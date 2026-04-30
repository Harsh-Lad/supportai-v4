import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Conversation from '@/models/Conversation'

// POST - submit feedback on AI message (helpful or not)
export async function POST(req: NextRequest) {
  try {
    const { conversationId, messageIndex, helpful } = await req.json()

    await connectDB()

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (messageIndex >= 0 && messageIndex < conversation.messages.length) {
      conversation.messages[messageIndex].helpful = helpful

      // If not helpful, increment retry count
      if (!helpful) {
        conversation.retryCount += 1
      }

      await conversation.save()
    }

    return NextResponse.json({
      retryCount: conversation.retryCount,
      message: 'Feedback recorded',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
