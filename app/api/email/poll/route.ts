import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import { pollInbox } from '@/lib/imap-poller'

/**
 * POST /api/email/poll
 * Manually trigger IMAP poll for an org (or use with a cron job).
 * In production, this would run on a schedule via a cron service.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = (session.user as any).organizationId
    await connectDB()

    const org = await Organization.findById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const emailConfig = org.emailChannel
    if (!emailConfig?.enabled || emailConfig.method !== 'imap') {
      return NextResponse.json({ error: 'IMAP not configured for this organization' }, { status: 400 })
    }

    if (!emailConfig.imapHost || !emailConfig.imapUser || !emailConfig.imapPassword) {
      return NextResponse.json({ error: 'IMAP credentials incomplete' }, { status: 400 })
    }

    // Call the IMAP poller
    const result = await pollInbox(orgId, {
      host: emailConfig.imapHost,
      port: emailConfig.imapPort,
      user: emailConfig.imapUser,
      password: emailConfig.imapPassword,
      tls: emailConfig.imapTls,
    })

    return NextResponse.json({
      processed: result.processed,
      errors: result.errors,
    })
  } catch (error) {
    console.error('IMAP poll error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
