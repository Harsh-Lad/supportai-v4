import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'
import Conversation from '@/models/Conversation'
import Document from '@/models/Document'
import Ticket from '@/models/Ticket'
import UsageLog from '@/models/UsageLog'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const userId = (session.user as any).userId
    const orgId = (session.user as any).organizationId

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Missing user or organization ID' },
        { status: 400 }
      )
    }

    // Verify user belongs to organization and is admin
    const user = await User.findById(userId)
    if (!user || user.organizationId.toString() !== orgId) {
      return NextResponse.json(
        { error: 'User does not belong to this organization' },
        { status: 403 }
      )
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only admins can export organization data' },
        { status: 403 }
      )
    }

    // Fetch all organization data
    const [org, users, conversations, documents, tickets, usageLogs] = await Promise.all([
      Organization.findById(orgId),
      User.find({ organizationId: orgId }),
      Conversation.find({ organizationId: orgId }),
      Document.find({ organizationId: orgId }),
      Ticket.find({ organizationId: orgId }),
      UsageLog.find({ organizationId: orgId }),
    ])

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Build export object, redacting sensitive data
    const exportData = {
      exportDate: new Date().toISOString(),
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        settings: org.settings,
        aiProvider: {
          provider: org.aiProvider?.provider || 'none',
          model: org.aiProvider?.model || '',
          enabled: org.aiProvider?.enabled || false,
          apiKey: '[ENCRYPTED]', // Never export actual API keys
        },
        emailChannel: {
          enabled: org.emailChannel?.enabled || false,
          method: org.emailChannel?.method || 'none',
          webhookSecret: '[ENCRYPTED]',
          imapPassword: '[ENCRYPTED]',
          replyFromName: org.emailChannel?.replyFromName || '',
          replyFromEmail: org.emailChannel?.replyFromEmail || '',
          notifyOnEscalation: org.emailChannel?.notifyOnEscalation || false,
        },
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      conversations: conversations.map(c => ({
        id: c._id.toString(),
        channel: c.channel,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        status: c.status,
        retryCount: c.retryCount,
        messageCount: c.messages?.length || 0,
        messages: c.messages?.map((m: any) => ({
          role: m.role,
          content: m.content,
          sources: m.sources || [],
          confidence: m.confidence,
          helpful: m.helpful,
          timestamp: m.createdAt,
        })) || [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      documents: documents.map(d => ({
        id: d._id.toString(),
        name: d.name,
        originalName: d.originalName,
        type: d.type,
        status: d.status,
        chunkCount: d.chunks?.length || 0,
        uploadedBy: d.uploadedBy?.toString() || null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      tickets: tickets.map(t => ({
        id: t._id.toString(),
        conversationId: t.conversationId?.toString() || null,
        assignedTo: t.assignedTo?.toString() || null,
        status: t.status,
        priority: t.priority,
        reason: t.reason,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        channel: t.channel,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      usageLogs: usageLogs.map(log => ({
        id: log._id.toString(),
        month: log.month,
        conversations: log.conversations || 0,
        messages: log.messages || 0,
        tokensUsed: log.tokensUsed || 0,
        documentsUploaded: log.documentsUploaded || 0,
        emailsProcessed: log.emailsProcessed || 0,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      })),
    }

    // Generate JSON response with download header
    const jsonString = JSON.stringify(exportData, null, 2)

    return new Response(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="supportai-export-${orgId}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('GDPR export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
