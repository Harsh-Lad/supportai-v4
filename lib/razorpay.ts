import Razorpay from 'razorpay'

let _razorpay: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!_razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
    }
    _razorpay = new Razorpay({ key_id, key_secret })
  }
  return _razorpay
}

// Backward compat — lazy getter
export const razorpay = new Proxy({} as Razorpay, {
  get(_, prop) {
    return (getRazorpay() as any)[prop]
  },
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    razorpayPlanId: '',
    features: [
      '50 conversations/mo',
      '5 documents',
      '100K tokens/mo',
      'Chat widget',
      'Basic analytics',
    ],
  },
  pro: {
    name: 'Pro',
    price: 2999,
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID || '',
    features: [
      '1000 conversations/mo',
      '50 documents',
      '2M tokens/mo',
      'Email channel',
      'Voice support',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 9999,
    razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID || '',
    features: [
      'Unlimited conversations',
      'Unlimited documents',
      'Unlimited tokens',
      'All channels',
      'Custom prompts',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
}

export type PlanType = keyof typeof PLANS
