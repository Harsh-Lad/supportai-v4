'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bot, Sparkles, Zap, Shield, Globe, ArrowRight,
  CheckCircle2, MessageCircle, Star, X, Loader2,
} from 'lucide-react'

interface WidgetConfig {
  orgName: string
  welcomeMessage?: string
  widgetColor?: string
  widgetPosition?: 'bottom-right' | 'bottom-left'
}

export default function LandingDemoPage() {
  return (
    <Suspense fallback={<DemoLoading />}>
      <LandingDemoInner />
    </Suspense>
  )
}

function DemoLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      Loading demo…
    </div>
  )
}

function LandingDemoInner() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')

  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Build widget URL from current origin so this works in dev and prod.
  const widgetUrl = orgId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/widget?orgId=${orgId}`
    : ''

  useEffect(() => {
    if (!orgId) {
      setError('Missing orgId. Open this page from your dashboard "View Demo" link, or append ?orgId=<your-id> to the URL.')
      setLoading(false)
      return
    }

    fetch(`/api/widget?orgId=${orgId}`)
      .then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new Error(data.error || `Failed to load widget config (${r.status})`)
        }
        return r.json()
      })
      .then((cfg: WidgetConfig) => setConfig(cfg))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [orgId])

  if (loading) return <DemoLoading />

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold mb-2 text-slate-900">Demo unavailable</h1>
          <p className="text-sm text-slate-600 mb-6">{error || 'Could not load tenant config.'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const tenantName = config.orgName
  const brandColor = config.widgetColor || '#6366f1'
  const position = config.widgetPosition === 'bottom-left' ? 'left' : 'right'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      {/* Demo banner */}
      <div className="bg-indigo-600 text-white text-xs">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Live demo of <strong>{tenantName}</strong>'s support widget on a sample marketing site
          </span>
          <Link href="/dashboard" className="hover:underline">Back to dashboard →</Link>
        </div>
      </div>

      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: brandColor }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">{tenantName}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-slate-900 transition-colors">Docs</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{ backgroundColor: brandColor + '15', color: brandColor }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          New — AI-powered support, built in
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
          The platform your team
          <span style={{ color: brandColor }}> actually enjoys using</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          Deploy in seconds, scale on demand, and stop paying for things you don't use.
          {' '}{tenantName} handles the boring parts so you can focus on shipping.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: brandColor }}
          >
            Start your free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 border border-slate-300 px-6 py-3 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            See how it works
          </a>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            No credit card required
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            14-day free trial
          </div>
          <div className="hidden md:flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Cancel anytime
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <section className="border-y bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-6">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-slate-400 font-semibold text-lg">
            <span>Northwind</span>
            <span>Globex</span>
            <span>Initech</span>
            <span>Hooli</span>
            <span>Pied Piper</span>
            <span>Vandelay</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Built on the same primitives the big players use — with a developer experience that doesn't make you want to quit.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap,            title: 'Deploy in 30 seconds', desc: 'Push to git and we handle the build, rollout, and rollback if something breaks.' },
            { icon: Globe,          title: 'Global edge network',  desc: '300+ points of presence so your users hit cached responses anywhere.' },
            { icon: Shield,         title: 'Compliance built in',  desc: 'SOC 2, HIPAA, and GDPR-ready out of the box. Audit logs on every plan.' },
            { icon: Bot,            title: 'Automation everywhere', desc: 'Workflows that react to events, schedules, or webhooks — no extra layer needed.' },
            { icon: MessageCircle,  title: '24/7 AI support',       desc: 'Stuck at 3am? Our AI assistant has read every line of our docs. Try the chat →' },
            { icon: Star,           title: 'No surprise bills',     desc: 'Per-second billing with hard spend caps. Set a limit, sleep easy.' },
          ].map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-6 bg-white hover:shadow-md hover:border-slate-300 transition-all">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: brandColor + '15' }}
              >
                <f.icon className="h-5 w-5" style={{ color: brandColor }} />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to ship faster?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Join thousands of teams who've ditched their old provider for something simpler.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Start your free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-6 text-sm text-slate-400">
            Got questions? Click the chat bubble in the bottom-{position} — our AI assistant is online now.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center"
              style={{ backgroundColor: brandColor }}
            >
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span>&copy; 2026 {tenantName}. A SupportAI demo page.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#status" className="hover:text-slate-900 transition-colors">Status</a>
          </div>
        </div>
      </footer>

      {/* ── Collapsible widget ─────────────────────────────────── */}
      <div
        aria-hidden={!open}
        style={{
          position: 'fixed',
          [position]: 20,
          bottom: 90,
          width: 400,
          height: 600,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 110px)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          zIndex: 9999,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >
        <iframe
          src={widgetUrl}
          title={`${tenantName} support chat`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        aria-expanded={open}
        style={{
          position: 'fixed',
          [position]: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: 'none',
          background: brandColor,
          color: 'white',
          boxShadow: `0 6px 20px ${brandColor}73`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
