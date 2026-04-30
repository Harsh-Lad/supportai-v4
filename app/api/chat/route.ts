import { NextRequest, NextResponse } from 'next/server'
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

    const { message, conversationId, orgId, customerName, channel } = await req.json()

    if (!message || !orgId) {
      return NextResponse.json({ error: 'Message and orgId are required' }, { status: 400 })
    }

    await connectDB()

    // Get org with settings
    const org = await Organization.findById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
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

    // ── RAG Retrieval (Google Embeddings) ────────────────────
    const allChunks = docs.flatMap(doc =>
      (doc.chunks || []).map((chunk: any) => ({
        id: chunk._id?.toString() || chunk.id,
        text: chunk.text,
        documentId: doc._id.toString(),
        documentName: doc.name,
        embedding: chunk.embedding || [],
      }))
    )

    // Semantic search using Google embeddings
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
    const platformGeminiKey = process.env.GEMINI_API_KEY

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
        // Fallback to platform Gemini key or template
        if (platformGeminiKey) {
          try {
            const aiResult = await generateAIResponse(
              { provider: 'gemini', apiKey: platformGeminiKey, model: 'gemini-2.0-flash' },
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
    } else if (platformGeminiKey) {
      // No tenant BYOK configured — use platform default Gemini key
      try {
        const aiResult = await generateAIResponse(
          { provider: 'gemini', apiKey: platformGeminiKey, model: 'gemini-2.0-flash' },
          org.name,
          message,
          contextTexts,
          messageHistory,
          org.customPrompt
        )
        responseText = aiResult.text
        tokensUsed = aiResult.tokensUsed
      } catch (aiError: any) {
        console.error('Platform Gemini error:', aiError.message)
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
