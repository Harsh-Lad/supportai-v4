import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Conversation from '@/models/Conversation'
import Ticket from '@/models/Ticket'
import Document from '@/models/Document'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = (session.user as any).organizationId
    await connectDB()

    // Fetch all data
    const [conversations, tickets, documents] = await Promise.all([
      Conversation.find({ organizationId: orgId }).lean(),
      Ticket.find({ organizationId: orgId }).lean(),
      Document.find({ organizationId: orgId }).select('name status createdAt').lean(),
    ])

    // ── Channel breakdown ────────────────────────────────────────
    const channelBreakdown = {
      chat: conversations.filter((c: any) => c.channel === 'chat').length,
      voice: conversations.filter((c: any) => c.channel === 'voice').length,
      email: conversations.filter((c: any) => c.channel === 'email').length,
    }

    // ── Status breakdown ─────────────────────────────────────────
    const statusBreakdown = {
      active: conversations.filter((c: any) => c.status === 'active').length,
      resolved: conversations.filter((c: any) => c.status === 'resolved').length,
      escalated: conversations.filter((c: any) => c.status === 'escalated').length,
    }

    // ── Resolution metrics ───────────────────────────────────────
    const totalConversations = conversations.length
    const escalatedCount = conversations.filter((c: any) => c.status === 'escalated').length
    const resolvedByAI = totalConversations - escalatedCount
    const aiResolutionRate = totalConversations > 0
      ? Math.round((resolvedByAI / totalConversations) * 100)
      : 0

    // ── Average confidence ───────────────────────────────────────
    let totalConfidence = 0
    let confidenceCount = 0
    conversations.forEach((c: any) => {
      (c.messages || []).forEach((m: any) => {
        if (m.role === 'ai' && m.confidence != null) {
          totalConfidence += m.confidence
          confidenceCount++
        }
      })
    })
    const avgConfidence = confidenceCount > 0
      ? Math.round((totalConfidence / confidenceCount) * 100)
      : 0

    // ── Conversations over time (last 30 days) ───────────────────
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const conversationsByDay: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      conversationsByDay[date.toISOString().split('T')[0]] = 0
    }

    conversations.forEach((c: any) => {
      const day = new Date(c.createdAt).toISOString().split('T')[0]
      if (conversationsByDay[day] !== undefined) {
        conversationsByDay[day]++
      }
    })

    const conversationsTimeline = Object.entries(conversationsByDay).map(([date, count]) => ({
      date,
      count,
    }))

    // ── Top sources (most referenced documents) ──────────────────
    const sourceCounts: Record<string, number> = {}
    conversations.forEach((c: any) => {
      (c.messages || []).forEach((m: any) => {
        (m.sources || []).forEach((s: string) => {
          sourceCounts[s] = (sourceCounts[s] || 0) + 1
        })
      })
    })

    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // ── Average messages per conversation ─────────────────────────
    const totalMessages = conversations.reduce((sum: number, c: any) => sum + (c.messages?.length || 0), 0)
    const avgMessages = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : '0'

    // ── Ticket metrics ───────────────────────────────────────────
    const ticketsByPriority = {
      high: tickets.filter((t: any) => t.priority === 'high').length,
      medium: tickets.filter((t: any) => t.priority === 'medium').length,
      low: tickets.filter((t: any) => t.priority === 'low').length,
    }

    return NextResponse.json({
      overview: {
        totalConversations,
        totalTickets: tickets.length,
        totalDocuments: documents.length,
        aiResolutionRate,
        avgConfidence,
        avgMessages,
      },
      channelBreakdown,
      statusBreakdown,
      conversationsTimeline,
      topSources,
      ticketsByPriority,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
