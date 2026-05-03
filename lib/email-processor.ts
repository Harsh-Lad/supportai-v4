/**
 * Email processing pipeline.
 * Takes an inbound email, runs it through RAG + AI, creates conversation & ticket.
 */

import { connectDB } from './db'
import Document from '@/models/Document'
import Conversation from '@/models/Conversation'
import Organization from '@/models/Organization'
import Ticket from '@/models/Ticket'
import { searchChunks, cosineSimilarity } from './rag'
import { generateAIResponse, generateFallbackResponse, type AIProviderConfig } from './ai-providers'
import { decrypt } from './encryption'

export interface InboundEmail {
  from: string
  fromName?: string
  to: string
  subject: string
  body: string        // plain text body
  htmlBody?: string
  messageId?: string
}

export interface EmailProcessingResult {
  conversationId: string
  ticketId: string
  aiResponse: string
  confidence: number
  escalated: boolean
}

export async function processInboundEmail(
  orgId: string,
  email: InboundEmail
): Promise<EmailProcessingResult> {
  await connectDB()

  const org = await Organization.findById(orgId)
  if (!org) throw new Error('Organization not found')

  // Create conversation from email
  const conversation = await Conversation.create({
    organizationId: orgId,
    channel: 'email',
    customerName: email.fromName || email.from,
    customerEmail: email.from,
    status: 'active',
    retryCount: 0,
    messages: [{
      role: 'customer',
      content: `Subject: ${email.subject}\n\n${email.body}`,
    }],
  })

  // Create ticket for every email (since email is async, always track it)
  const ticket = await Ticket.create({
    organizationId: orgId,
    conversationId: conversation._id,
    status: 'open',
    priority: 'medium',
    reason: `Email from ${email.from}: ${email.subject}`,
    customerName: email.fromName || email.from,
    channel: 'email',
    customerEmail: email.from,
  })

  // Get documents for RAG
  const docs = await Document.find({ organizationId: orgId, status: 'ready' })

  if (docs.length === 0) {
    const fallback = "Thank you for reaching out. Our team will review your message and get back to you shortly."
    conversation.messages.push({ role: 'ai', content: fallback, confidence: 0, sources: [] })
    conversation.status = 'escalated'
    await conversation.save()
    ticket.status = 'open'
    ticket.priority = 'high'
    await ticket.save()

    return {
      conversationId: conversation._id.toString(),
      ticketId: ticket._id.toString(),
      aiResponse: fallback,
      confidence: 0,
      escalated: true,
    }
  }

  // RAG retrieval using OpenAI Embeddings
  const allChunks = docs.flatMap(doc =>
    (doc.chunks || []).map((chunk: any) => ({
      id: chunk._id?.toString() || chunk.id,
      text: chunk.text,
      documentId: doc._id.toString(),
      documentName: doc.name,
      embedding: chunk.embedding || [],
    }))
  )

  const queryText = `${email.subject} ${email.body}`
  const scored = await searchChunks(queryText, allChunks, 5)

  const topScore = scored[0]?.score || 0
  const relevantChunks = scored.filter(s => s.score > 0.3)
  const contextTexts = relevantChunks.map(c => c.text)
  const confidence = Math.min(topScore, 1)
  const sourceNames = [...new Set(relevantChunks.map(c => c.documentName))]

  // Generate AI response
  let responseText: string
  const aiConfig = org.aiProvider
  const platformOpenAIKey = process.env.OPENAI_API_KEY
  const platformDefaultModel = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'

  if (aiConfig?.enabled && aiConfig?.apiKey && aiConfig?.provider !== 'none') {
    try {
      const providerConfig: AIProviderConfig = {
        provider: aiConfig.provider,
        apiKey: decrypt(aiConfig.apiKey),
        model: aiConfig.model || undefined,
      }
      const aiResult = await generateAIResponse(providerConfig, org.name, email.body, contextTexts)
      responseText = aiResult.text
    } catch {
      responseText = generateFallbackResponse(email.body, contextTexts)
    }
  } else if (platformOpenAIKey) {
    try {
      const aiResult = await generateAIResponse(
        { provider: 'openai', apiKey: platformOpenAIKey, model: platformDefaultModel },
        org.name, email.body, contextTexts
      )
      responseText = aiResult.text
    } catch {
      responseText = generateFallbackResponse(email.body, contextTexts)
    }
  } else {
    responseText = generateFallbackResponse(email.body, contextTexts)
  }

  // Save AI response
  conversation.messages.push({
    role: 'ai',
    content: responseText,
    confidence,
    sources: sourceNames,
  })

  const escalated = confidence < 0.3
  if (escalated) {
    conversation.status = 'escalated'
    ticket.priority = 'high'
    await ticket.save()
  }

  await conversation.save()

  return {
    conversationId: conversation._id.toString(),
    ticketId: ticket._id.toString(),
    aiResponse: responseText,
    confidence,
    escalated,
  }
}
