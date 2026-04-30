import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Ticket from '@/models/Ticket'
import Conversation from '@/models/Conversation'

// GET - list tickets for org
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const tickets = await Ticket.find({
      organizationId: (session.user as any).organizationId,
    }).sort({ createdAt: -1 })

    return NextResponse.json(tickets)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH - update ticket status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticketId, status, assignedTo } = await req.json()

    await connectDB()
    const update: any = {}
    if (status) update.status = status
    if (assignedTo) update.assignedTo = assignedTo

    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, organizationId: (session.user as any).organizationId },
      update,
      { new: true }
    )

    // If resolved, update conversation too
    if (status === 'resolved' && ticket) {
      await Conversation.findByIdAndUpdate(ticket.conversationId, { status: 'resolved' })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
