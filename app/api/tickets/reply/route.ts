import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Conversation from '@/models/Conversation'
import Ticket from '@/models/Ticket'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, ticketId, message } = await req.json()

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'conversationId and message required' }, { status: 400 })
    }

    await connectDB()

    // Add agent message to conversation
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        organizationId: (session.user as any).organizationId,
      },
      {
        $push: {
          messages: {
            role: 'agent',
            content: message,
          },
        },
      },
      { new: true }
    )

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Update ticket status to in_progress if still open
    if (ticketId) {
      await Ticket.findByIdAndUpdate(ticketId, {
        status: 'in_progress',
        assignedTo: (session.user as any).userId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
