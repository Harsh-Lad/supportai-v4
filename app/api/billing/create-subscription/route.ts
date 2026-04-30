import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import { razorpay, PLANS } from '@/lib/razorpay'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await req.json()
    if (!planId || !['pro', 'enterprise'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    await connectDB()

    const org = await Organization.findOne({ members: session.user.email })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const plan = PLANS[planId as keyof typeof PLANS]
    if (!plan.razorpayPlanId) {
      return NextResponse.json(
        { error: 'Plan not configured' },
        { status: 400 }
      )
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: 0, // 0 means infinite
    })

    // Create order for initial payment
    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `sub_${org._id}`,
      notes: {
        organizationId: org._id.toString(),
        subscriptionId: subscription.id,
        planId,
      },
    })

    // Update organization
    org.razorpaySubscriptionId = subscription.id
    org.plan = planId
    org.billingCycle = {
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
    await org.save()

    return NextResponse.json({
      subscription_id: subscription.id,
      order_id: order.id,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
