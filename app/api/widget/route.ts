import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'

// GET - get widget config for an org (public endpoint)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    }

    await connectDB()
    const org = await Organization.findById(orgId).select('name settings')

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      orgName: org.name,
      welcomeMessage: org.settings.welcomeMessage,
      widgetColor: org.settings.widgetColor,
      widgetPosition: org.settings.widgetPosition,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
