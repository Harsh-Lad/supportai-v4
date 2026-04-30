import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

function verifySignature(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')
  return hash === signature
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
    if (!verifySignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    await connectDB()

    const event = JSON.parse(body)
    const eventType = event.event
    const payload = event.payload

    switch (eventType) {
      case 'subscription.activated': {
        const subscriptionId = payload.subscription.entity.id
        const org = await Organization.findOne({
          razorpaySubscriptionId: subscriptionId,
        })
        if (org) {
          org.subscriptionStatus = 'active'
          await org.save()
        }
        break
      }

      case 'subscription.cancelled': {
        const subscriptionId = payload.subscription.entity.id
        const org = await Organization.findOne({
          razorpaySubscriptionId: subscriptionId,
        })
        if (org) {
          org.plan = 'free'
          org.subscriptionStatus = 'cancelled'
          await org.save()
        }
        break
      }

      case 'payment.captured': {
        const orderId = payload.payment.entity.order_id
        const amount = payload.payment.entity.amount
        console.log(`Payment captured: ${orderId} - ${amount}`)
        // Log payment or update billing records as needed
        break
      }

      case 'subscription.paused': {
        const subscriptionId = payload.subscription.entity.id
        const org = await Organization.findOne({
          razorpaySubscriptionId: subscriptionId,
        })
        if (org) {
          org.subscriptionStatus = 'paused'
          await org.save()
        }
        break
      }

      case 'subscription.resumed': {
        const subscriptionId = payload.subscription.entity.id
        const org = await Organization.findOne({
          razorpaySubscriptionId: subscriptionId,
        })
        if (org) {
          org.subscriptionStatus = 'active'
          await org.save()
        }
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
