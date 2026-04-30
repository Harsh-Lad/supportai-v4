import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const org = await Organization.findOne({ members: session.user.email })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const currentPlan = org.plan || 'free'
    const usage = {
      conversations: org.conversationCount || 0,
      documents: org.documentCount || 0,
      tokens: org.tokenCount || 0,
    }

    const limits = {
      free: { conversations: 100, documents: 10, tokens: 100000 },
      pro: { conversations: 1000, documents: 50, tokens: 2000000 },
      enterprise: { conversations: Infinity, documents: Infinity, tokens: Infinity },
    }

    return NextResponse.json({
      plan: currentPlan,
      usage,
      limits: limits[currentPlan as keyof typeof limits] || limits.free,
      razorpaySubscriptionId: org.razorpaySubscriptionId || null,
      billingCycle: org.billingCycle || null,
    })
  } catch (error) {
    console.error('Billing GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
