import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Conversation from '@/models/Conversation'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    await connectDB()

    if (id) {
      const conversation = await Conversation.findOne({
        _id: id,
        organizationId: (session.user as any).organizationId,
      })
      return NextResponse.json(conversation)
    }

    const conversations = await Conversation.find({
      organizationId: (session.user as any).organizationId,
    })
      .select('-messages')
      .sort({ updatedAt: -1 })
      .limit(50)

    return NextResponse.json(conversations)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
