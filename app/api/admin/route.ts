import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import User from '@/models/User'
import Conversation from '@/models/Conversation'
import Ticket from '@/models/Ticket'
import Document from '@/models/Document'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 403 })
    }

    await connectDB()

    // Fetch platform-wide stats
    const [orgs, users, conversations, tickets, documents] = await Promise.all([
      Organization.find({}).lean(),
      User.find({}).select('-password').lean(),
      Conversation.countDocuments(),
      Ticket.countDocuments(),
      Document.countDocuments(),
    ])

    // Per-org breakdown
    const orgStats = await Promise.all(
      orgs.map(async (org: any) => {
        const [orgUsers, orgConvos, orgTickets, orgDocs] = await Promise.all([
          User.countDocuments({ organizationId: org._id }),
          Conversation.countDocuments({ organizationId: org._id }),
          Ticket.countDocuments({ organizationId: org._id }),
          Document.countDocuments({ organizationId: org._id }),
        ])

        const openTickets = await Ticket.countDocuments({ organizationId: org._id, status: 'open' })
        const escalated = await Conversation.countDocuments({ organizationId: org._id, status: 'escalated' })

        return {
          _id: org._id,
          name: org.name,
          slug: org.slug,
          createdAt: org.createdAt,
          aiProvider: org.aiProvider?.provider || 'none',
          aiEnabled: org.aiProvider?.enabled || false,
          emailEnabled: org.emailChannel?.enabled || false,
          users: orgUsers,
          conversations: orgConvos,
          tickets: orgTickets,
          openTickets,
          documents: orgDocs,
          escalated,
        }
      })
    )

    // Recent activity across platform
    const recentConversations = await Conversation.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('organizationId customerName channel status createdAt')
      .lean()

    // Enrich with org names
    const orgMap = new Map(orgs.map((o: any) => [o._id.toString(), o.name]))
    const recentActivity = recentConversations.map((c: any) => ({
      ...c,
      orgName: orgMap.get(c.organizationId?.toString()) || 'Unknown',
    }))

    return NextResponse.json({
      platform: {
        totalOrgs: orgs.length,
        totalUsers: users.length,
        totalConversations: conversations,
        totalTickets: tickets,
        totalDocuments: documents,
      },
      organizations: orgStats.sort((a, b) => b.conversations - a.conversations),
      recentActivity,
    })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
