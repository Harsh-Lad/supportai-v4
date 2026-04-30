import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processInboundEmail, type InboundEmail } from '@/lib/email-processor'

/**
 * POST /api/email/forward
 * Manual email forwarding — agents paste email content into a form.
 * Requires authentication.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { from, fromName, subject, body } = await req.json()

    if (!from || !body) {
      return NextResponse.json({ error: 'Email from and body are required' }, { status: 400 })
    }

    const orgId = (session.user as any).organizationId

    const email: InboundEmail = {
      from,
      fromName: fromName || from,
      to: 'forwarded',
      subject: subject || '(Forwarded)',
      body,
    }

    const result = await processInboundEmail(orgId, email)

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      ticketId: result.ticketId,
      aiResponse: result.aiResponse,
      confidence: result.confidence,
      escalated: result.escalated,
    })
  } catch (error: any) {
    console.error('Email forward error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
