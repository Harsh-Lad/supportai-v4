import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import { decrypt, encrypt } from '@/lib/encryption'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const org = await Organization.findById((session.user as any).organizationId)

    // Decrypt sensitive fields before returning
    if (org && org.aiProvider?.apiKey) {
      org.aiProvider.apiKey = decrypt(org.aiProvider.apiKey)
    }
    if (org && org.emailChannel?.imapPassword) {
      org.emailChannel.imapPassword = decrypt(org.emailChannel.imapPassword)
    }

    return NextResponse.json(org)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'viewer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    await connectDB()

    const update: any = {}

    // Update general settings
    if (body.settings) {
      update.settings = body.settings
    }

    // Update AI provider config - encrypt API key if provided
    if (body.aiProvider) {
      update.aiProvider = body.aiProvider
      if (body.aiProvider.apiKey && body.aiProvider.apiKey.trim()) {
        update.aiProvider.apiKey = encrypt(body.aiProvider.apiKey)
      }
    }

    // Update custom prompt
    if (body.customPrompt !== undefined) {
      update.customPrompt = body.customPrompt.slice(0, 2000) // Cap at 2000 chars
    }

    // Update email channel config - encrypt IMAP password if provided
    if (body.emailChannel) {
      update.emailChannel = body.emailChannel
      if (body.emailChannel.imapPassword && body.emailChannel.imapPassword.trim()) {
        update.emailChannel.imapPassword = encrypt(body.emailChannel.imapPassword)
      }
    }

    const org = await Organization.findByIdAndUpdate(
      (session.user as any).organizationId,
      { $set: update },
      { new: true }
    )

    // Decrypt sensitive fields before returning
    if (org && org.aiProvider?.apiKey) {
      org.aiProvider.apiKey = decrypt(org.aiProvider.apiKey)
    }
    if (org && org.emailChannel?.imapPassword) {
      org.emailChannel.imapPassword = decrypt(org.emailChannel.imapPassword)
    }

    return NextResponse.json(org)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
