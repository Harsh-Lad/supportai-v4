'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Check,
  Zap,
  FileText,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { PLANS } from '@/lib/razorpay'

interface BillingData {
  plan: string
  usage: {
    conversations: number
    documents: number
    tokens: number
  }
  limits: {
    conversations: number
    documents: number
    tokens: number
  }
  razorpaySubscriptionId: string | null
}

interface RazorpayCheckoutOptions {
  key: string
  order_id: string
  subscription_id: string
  name: string
  description: string
  prefill: {
    email: string
  }
  handler: (response: any) => void
  modal: {
    ondismiss: () => void
  }
}

declare global {
  interface Window {
    Razorpay: any
  }
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800',
  pro: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
}

const planBadgeColor: Record<string, string> = {
  free: 'secondary',
  pro: 'default',
  enterprise: 'default',
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    fetchBillingData()
    // Get user email from session or auth
    const email = localStorage.getItem('userEmail') || 'user@example.com'
    setUserEmail(email)
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/billing')
      if (!response.ok) throw new Error('Failed to fetch billing data')
      const data = await response.json()
      setBillingData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(planId)
      const response = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) throw new Error('Failed to create subscription')
      const { subscription_id, order_id, key } = await response.json()

      const options: RazorpayCheckoutOptions = {
        key,
        order_id,
        subscription_id,
        name: 'SupportAI',
        description: `Upgrade to ${PLANS[planId as keyof typeof PLANS].name} Plan`,
        prefill: {
          email: userEmail,
        },
        handler: (response: any) => {
          // Payment successful
          alert('Subscription activated successfully!')
          fetchBillingData()
        },
        modal: {
          ondismiss: () => {
            setUpgrading(null)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade plan')
      setUpgrading(null)
    }
  }

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === Infinity) return 0
    return Math.round((used / limit) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing & Plans</h1>
            <p className="text-gray-600">
              Manage your subscription and view usage across all features
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {billingData && (
            <>
              {/* Current Plan Section */}
              <Card className="mb-12 border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>
                        You are currently on the{' '}
                        <Badge className={planColors[billingData.plan]}>
                          {PLANS[billingData.plan as keyof typeof PLANS]?.name || 'Free'}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Usage Section */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Conversations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Conversations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {billingData.usage.conversations}
                          </span>
                          <span className="text-gray-500">
                            {billingData.limits.conversations === Infinity
                              ? 'Unlimited'
                              : `/ ${billingData.limits.conversations}`}
                          </span>
                        </div>
                        {billingData.limits.conversations !== Infinity && (
                          <Progress
                            value={getUsagePercentage(
                              billingData.usage.conversations,
                              billingData.limits.conversations
                            )}
                            className="h-2"
                          />
                        )}
                        <p className="text-xs text-gray-500">
                          {billingData.limits.conversations === Infinity
                            ? 'Unlimited conversations'
                            : `${getUsagePercentage(
                                billingData.usage.conversations,
                                billingData.limits.conversations
                              )}% used`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="w-5 h-5 text-green-600" />
                        Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {billingData.usage.documents}
                          </span>
                          <span className="text-gray-500">
                            {billingData.limits.documents === Infinity
                              ? 'Unlimited'
                              : `/ ${billingData.limits.documents}`}
                          </span>
                        </div>
                        {billingData.limits.documents !== Infinity && (
                          <Progress
                            value={getUsagePercentage(
                              billingData.usage.documents,
                              billingData.limits.documents
                            )}
                            className="h-2"
                          />
                        )}
                        <p className="text-xs text-gray-500">
                          {billingData.limits.documents === Infinity
                            ? 'Unlimited documents'
                            : `${getUsagePercentage(
                                billingData.usage.documents,
                                billingData.limits.documents
                              )}% used`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tokens */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {(billingData.usage.tokens / 1000000).toFixed(1)}M
                          </span>
                          <span className="text-gray-500">
                            {billingData.limits.tokens === Infinity
                              ? 'Unlimited'
                              : `/ ${(billingData.limits.tokens / 1000000).toFixed(0)}M`}
                          </span>
                        </div>
                        {billingData.limits.tokens !== Infinity && (
                          <Progress
                            value={getUsagePercentage(
                              billingData.usage.tokens,
                              billingData.limits.tokens
                            )}
                            className="h-2"
                          />
                        )}
                        <p className="text-xs text-gray-500">
                          {billingData.limits.tokens === Infinity
                            ? 'Unlimited tokens'
                            : `${getUsagePercentage(
                                billingData.usage.tokens,
                                billingData.limits.tokens
                              )}% used`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Plans Comparison */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Compare Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(PLANS).map(([key, plan]) => {
                    const isCurrentPlan = billingData.plan === key
                    return (
                      <Card
                        key={key}
                        className={`relative flex flex-col ${
                          isCurrentPlan ? 'border-2 border-primary shadow-lg' : ''
                        }`}
                      >
                        {isCurrentPlan && (
                          <div className="absolute -top-3 left-4">
                            <Badge className="bg-primary text-white">Current Plan</Badge>
                          </div>
                        )}

                        <CardHeader>
                          <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">
                              {plan.price === 0
                                ? 'Free'
                                : `₹${(plan.price / 100).toFixed(0)}`}
                            </span>
                            {plan.price > 0 && (
                              <span className="text-gray-600">/month</span>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1">
                          <div className="space-y-6">
                            {/* Features */}
                            <div className="space-y-3">
                              {plan.features ? (
                                plan.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-700">
                                      {feature}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-start gap-3">
                                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-gray-700">
                                    Limited features
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* CTA Button */}
                            <div className="pt-4">
                              {isCurrentPlan ? (
                                <Button className="w-full" variant="outline" disabled>
                                  Current Plan
                                </Button>
                              ) : key === 'free' ? (
                                <Button
                                  className="w-full"
                                  variant="outline"
                                  onClick={() => {
                                    alert('Contact support to downgrade to Free plan')
                                  }}
                                >
                                  Downgrade
                                </Button>
                              ) : (
                                <Button
                                  className="w-full"
                                  onClick={() => handleUpgrade(key)}
                                  disabled={upgrading === key}
                                >
                                  {upgrading === key ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Upgrading...
                                    </>
                                  ) : (
                                    'Upgrade Now'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Need Help?
                </h3>
                <p className="text-blue-800 mb-4">
                  Have questions about our billing, plans, or need to make changes to your
                  subscription?
                </p>
                <Button variant="outline" className="border-blue-300 text-blue-700">
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
