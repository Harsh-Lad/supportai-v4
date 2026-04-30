import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import { processInboundEmail, type InboundEmail } from '@/lib/email-processor'

/**
 * POST /api/email/inbound
 * Webhook endpoint for inbound emails.
 * Compatible with SendGrid Inbound Parse, Mailgun Routes, and Postmark.
 *
 * Query params: ?orgId=xxx&secret=yyy
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const secret = searchParams.get('secret')

    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    }

    await connectDB()

    // Verify webhook secret
    const org = await Organization.findById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (org.emailChannel?.webhookSecret && org.emailChannel.webhookSecret !== secret) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 403 })
    }

    // Parse email from request body
    // Support both JSON and form-data (SendGrid uses form-data)
    let email: InboundEmail

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = {
        from: body.from || body.sender || body.envelope?.from || '',
        fromName: body.fromName || body.from_name || '',
        to: body.to || body.recipient || '',
        subject: body.subject || '(No Subject)',
        body: body.text || body.body || body['stripped-text'] || '',
        htmlBody: body.html || body['stripped-html'] || '',
        messageId: body.messageId || body['Message-Id'] || '',
      }
    } else if (contentType.includes('multipart/form-data')) {
      // SendGrid Inbound Parse format
      const formData = await req.formData()
      email = {
        from: formData.get('from')?.toString() || '',
        fromName: '',
        to: formData.get('to')?.toString() || '',
        subject: formData.get('subject')?.toString() || '(No Subject)',
        body: formData.get('text')?.toString() || '',
        htmlBody: formData.get('html')?.toString() || '',
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
    }

    if (!email.from || !email.body) {
      return NextResponse.json({ error: 'Email must have from and body' }, { status: 400 })
    }

    // Process the email through RAG pipeline
    const result = await processInboundEmail(orgId, email)

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      ticketId: result.ticketId,
      escalated: result.escalated,
    })
  } catch (error: any) {
    console.error('Email webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
