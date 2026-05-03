import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Document from '@/models/Document'
import Conversation from '@/models/Conversation'
import Organization from '@/models/Organization'
import Ticket from '@/models/Ticket'
import { searchChunks } from '@/lib/rag'
import { generateAIResponse, generateFallbackResponse, type AIProviderConfig } from '@/lib/ai-providers'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'
import { decrypt } from '@/lib/encryption'
import { incrementUsage } from '@/lib/usage'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(req)
    const rl = checkRateLimit(`chat:${ip}`, RATE_LIMITS.chat)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { message, conversationId, orgId, customerName, channel, playground, history } = await req.json()

    if (!message || !orgId) {
      return NextResponse.json({ error: 'Message and orgId are required' }, { status: 400 })
    }

    await connectDB()

    // Get org with settings
    const org = await Organization.findById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // ── Sandbox/playground path ────────────────────────────────
    // Runs the full RAG + AI pipeline but persists nothing and does not
    // increment usage counters. Requires an authenticated session so the
    // flag can't be used by anonymous callers to bypass billing.
    if (playground) {
      const session = await getServerSession(authOptions)
      const sessionOrgId = (session?.user as any)?.organizationId
      if (!session || sessionOrgId !== orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return await handlePlaygroundChat(org, message, Array.isArray(history) ? history : [])
    }

    // Get or create conversation
    let conversation
    let isNewConversation = false
    if (conversationId) {
      conversation = await Conversation.findById(conversationId)
    }
    if (!conversation) {
      conversation = await Conversation.create({
        organizationId: orgId,
        channel: channel || 'chat',
        customerName: customerName || 'Anonymous',
        status: 'active',
        retryCount: 0,
        messages: [],
      })
      isNewConversation = true
    }

    // Add customer message
    conversation.messages.push({
      role: 'customer',
      content: message,
    })

    // Get all ready documents for this org
    const docs = await Document.find({
      organizationId: orgId,
      status: 'ready',
    })

    if (docs.length === 0) {
      const noDocsResponse = "I apologize, but our knowledge base hasn't been set up yet. Let me connect you with a human agent who can help."

      conversation.messages.push({
        role: 'ai',
        content: noDocsResponse,
        confidence: 0,
        sources: [],
      })
      conversation.status = 'escalated'
      await conversation.save()

      await Ticket.create({
        organizationId: orgId,
        conversationId: conversation._id,
        status: 'open',
        priority: 'medium',
        reason: 'No documents in knowledge base',
        customerName: conversation.customerName,
      })

      return NextResponse.json({
        response: noDocsResponse,
        conversationId: conversation._id,
        escalated: true,
        confidence: 0,
      })
    }

    // ── RAG Retrieval (OpenAI Embeddings) ────────────────────
    const allChunks = docs.flatMap(doc =>
      (doc.chunks || []).map((chunk: any) => ({
        id: chunk._id?.toString() || chunk.id,
        text: chunk.text,
        documentId: doc._id.toString(),
        documentName: doc.name,
        embedding: chunk.embedding || [],
      }))
    )

    // Semantic search using OpenAI embeddings
    const scored = await searchChunks(message, allChunks, 5)

    const topScore = scored[0]?.score || 0
    const relevantChunks = scored.filter(s => s.score > 0.3)
    const contextTexts = relevantChunks.map(c => c.text)
    const confidence = Math.min(topScore, 1)

    // Get source document names
    const sourceNames = [...new Set(relevantChunks.map(c => c.documentName))]

    // ── Extract message history (last 10 messages) ──────────────
    const messageHistory = conversation.messages
      .slice(-10)
      .map((msg: any) => ({
        role: msg.role === 'customer' ? 'user' : 'assistant',
        content: msg.content,
      }))

    // ── Response Generation ────────────────────────────────────
    let responseText: string
    let tokensUsed: number | undefined

    const aiConfig = org.aiProvider
    const platformOpenAIKey = process.env.OPENAI_API_KEY
    const platformDefaultModel = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'

    if (aiConfig?.enabled && aiConfig?.apiKey && aiConfig?.provider !== 'none') {
      // Use configured AI provider (BYOK)
      try {
        const decryptedApiKey = decrypt(aiConfig.apiKey)
        const providerConfig: AIProviderConfig = {
          provider: aiConfig.provider,
          apiKey: decryptedApiKey,
          model: aiConfig.model || undefined,
        }
        const aiResult = await generateAIResponse(
          providerConfig,
          org.name,
          message,
          contextTexts,
          messageHistory,
          org.customPrompt
        )
        responseText = aiResult.text
        tokensUsed = aiResult.tokensUsed
      } catch (aiError: any) {
        console.error('AI provider error:', aiError.message)
        // Fallback to platform OpenAI key or template
        if (platformOpenAIKey) {
          try {
            const aiResult = await generateAIResponse(
              { provider: 'openai', apiKey: platformOpenAIKey, model: platformDefaultModel },
              org.name, message, contextTexts, messageHistory, org.customPrompt
            )
            responseText = aiResult.text
            tokensUsed = aiResult.tokensUsed
          } catch {
            responseText = generateFallbackResponse(message, contextTexts)
          }
        } else {
          responseText = generateFallbackResponse(message, contextTexts)
        }
      }
    } else if (platformOpenAIKey) {
      // No tenant BYOK configured — use platform default OpenAI key
      try {
        const aiResult = await generateAIResponse(
          { provider: 'openai', apiKey: platformOpenAIKey, model: platformDefaultModel },
          org.name,
          message,
          contextTexts,
          messageHistory,
          org.customPrompt
        )
        responseText = aiResult.text
        tokensUsed = aiResult.tokensUsed
      } catch (aiError: any) {
        console.error('Platform OpenAI error:', aiError.message)
        responseText = generateFallbackResponse(message, contextTexts)
      }
    } else {
      // No AI key at all — use template-based fallback
      responseText = generateFallbackResponse(message, contextTexts)
    }

    // Add AI message to conversation
    conversation.messages.push({
      role: 'ai',
      content: responseText,
      confidence,
      sources: sourceNames,
    })

    // Check if we need to escalate
    let escalated = false
    if (confidence < 0.3) {
      conversation.retryCount += 1
    }

    if (conversation.retryCount >= org.settings.maxRetries) {
      conversation.status = 'escalated'
      escalated = true

      await Ticket.create({
        organizationId: orgId,
        conversationId: conversation._id,
        status: 'open',
        priority: conversation.retryCount >= org.settings.maxRetries + 2 ? 'high' : 'medium',
        reason: `AI could not resolve after ${conversation.retryCount} attempts`,
        customerName: conversation.customerName,
      })
    }

    await conversation.save()

    // ── Usage tracking ─────────────────────────────────────────
    if (isNewConversation) {
      await incrementUsage(orgId, 'conversations')
    }
    await incrementUsage(orgId, 'messages')
    if (tokensUsed) {
      await incrementUsage(orgId, 'tokensUsed', tokensUsed)
    }

    return NextResponse.json({
      response: responseText,
      conversationId: conversation._id,
      confidence,
      sources: sourceNames,
      retryCount: conversation.retryCount,
      escalated,
      maxRetries: org.settings.maxRetries,
      tokensUsed,
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function handlePlaygroundChat(
  org: any,
  message: string,
  history: { role: string; content: string }[]
) {
  const docs = await Document.find({ organizationId: org._id, status: 'ready' })

  if (docs.length === 0) {
    return NextResponse.json({
      response: "Your knowledge base is empty — upload documents on the Documents page to test real responses.",
      confidence: 0,
      sources: [],
      tokensUsed: 0,
      escalated: false,
      sandbox: true,
    })
  }

  const allChunks = docs.flatMap(doc =>
    (doc.chunks || []).map((chunk: any) => ({
      id: chunk._id?.toString() || chunk.id,
      text: chunk.text,
      documentId: doc._id.toString(),
      documentName: doc.name,
      embedding: chunk.embedding || [],
    }))
  )

  const scored = await searchChunks(message, allChunks, 5)
  const topScore = scored[0]?.score || 0
  const relevantChunks = scored.filter(s => s.score > 0.3)
  const contextTexts = relevantChunks.map(c => c.text)
  const confidence = Math.min(topScore, 1)
  const sourceNames = [...new Set(relevantChunks.map(c => c.documentName))]

  const messageHistory = history.slice(-10).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  let responseText: string
  let tokensUsed: number | undefined

  const aiConfig = org.aiProvider
  const platformOpenAIKey = process.env.OPENAI_API_KEY
  const platformDefaultModel = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'

  const tryProvider = async (cfg: AIProviderConfig) => generateAIResponse(
    cfg, org.name, message, contextTexts, messageHistory, org.customPrompt
  )

  if (aiConfig?.enabled && aiConfig?.apiKey && aiConfig?.provider !== 'none') {
    try {
      const result = await tryProvider({
        provider: aiConfig.provider,
        apiKey: decrypt(aiConfig.apiKey),
        model: aiConfig.model || undefined,
      })
      responseText = result.text
      tokensUsed = result.tokensUsed
    } catch (err: any) {
      console.error('Playground BYOK error:', err.message)
      if (platformOpenAIKey) {
        try {
          const result = await tryProvider({ provider: 'openai', apiKey: platformOpenAIKey, model: platformDefaultModel })
          responseText = result.text
          tokensUsed = result.tokensUsed
        } catch {
          responseText = generateFallbackResponse(message, contextTexts)
        }
      } else {
        responseText = generateFallbackResponse(message, contextTexts)
      }
    }
  } else if (platformOpenAIKey) {
    try {
      const result = await tryProvider({ provider: 'openai', apiKey: platformOpenAIKey, model: platformDefaultModel })
      responseText = result.text
      tokensUsed = result.tokensUsed
    } catch (err: any) {
      console.error('Playground platform OpenAI error:', err.message)
      responseText = generateFallbackResponse(message, contextTexts)
    }
  } else {
    responseText = generateFallbackResponse(message, contextTexts)
  }

  return NextResponse.json({
    response: responseText,
    confidence,
    sources: sourceNames,
    tokensUsed,
    escalated: false,
    sandbox: true,
  })
}
