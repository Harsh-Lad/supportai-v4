'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bot, Send, User, ArrowLeft, MessageSquare, Sparkles,
  ThumbsUp, ThumbsDown, Loader2, ChevronDown,
} from 'lucide-react'

interface Message {
  role: 'customer' | 'ai' | 'system'
  content: string
  confidence?: number
  sources?: string[]
}

interface DemoOrg {
  id: string
  name: string
}

export default function DemoPage() {
  const [orgs, setOrgs] = useState<DemoOrg[]>([])
  const [selectedOrg, setSelectedOrg] = useState<DemoOrg | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [widgetConfig, setWidgetConfig] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch demo-eligible orgs
  useEffect(() => {
    fetch('/api/demo')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrgs(data)
          if (data.length === 1) {
            selectOrg(data[0])
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectOrg = async (org: DemoOrg) => {
    setSelectedOrg(org)
    setMessages([])
    setConversationId(null)

    // Load widget config for welcome message
    try {
      const res = await fetch(`/api/widget?orgId=${org.id}`)
      const config = await res.json()
      setWidgetConfig(config)
      setMessages([{
        role: 'ai',
        content: config.welcomeMessage || `Hi! I'm the AI support assistant for ${org.name}. How can I help you today?`,
      }])
    } catch {
      setMessages([{
        role: 'ai',
        content: `Hi! I'm the AI support assistant for ${org.name}. How can I help you today?`,
      }])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedOrg || sending) return

    const text = input
    setInput('')
    setMessages(prev => [...prev, { role: 'customer', content: text }])
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
          orgId: selectedOrg.id,
          customerName: 'Demo User',
          channel: 'chat',
        }),
      })

      const data = await res.json()

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.response || 'Sorry, something went wrong.',
        confidence: data.confidence,
        sources: data.sources,
      }])

      if (data.escalated) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'This conversation would be escalated to a human agent in production.',
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    }

    setSending(false)
  }

  const resetDemo = () => {
    setSelectedOrg(null)
    setMessages([])
    setConversationId(null)
    setWidgetConfig(null)
  }

  const brandColor = widgetConfig?.widgetColor || '#6366f1'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Nav */}
      <nav className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold">SupportAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">Like what you see?</span>
            <Link href="/auth/register"
              className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Live Demo
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Try SupportAI in action
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Chat with a live AI assistant powered by real documentation.
            See how RAG-based support works — no signup needed.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading demo...
            </div>
          </div>
        )}

        {/* No orgs available */}
        {!loading && orgs.length === 0 && (
          <div className="max-w-md mx-auto text-center py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No demo available yet</h2>
            <p className="text-muted-foreground mb-6">
              No organizations have uploaded documents yet. Sign up and upload
              your support docs to make the demo live.
            </p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Your Own <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        )}

        {/* Org selector (when multiple orgs and none selected) */}
        {!loading && orgs.length > 1 && !selectedOrg && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Choose a demo to try</h2>
            <div className="space-y-3">
              {orgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => selectOrg(org)}
                  className="w-full flex items-center gap-4 p-4 border rounded-xl bg-white dark:bg-slate-800 hover:border-primary hover:shadow-md transition-all text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{org.name}</p>
                    <p className="text-sm text-muted-foreground">AI support assistant</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
        {selectedOrg && (
          <div className="max-w-2xl mx-auto">
            {/* Org header */}
            {orgs.length > 1 && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor + '20' }}>
                    <Bot className="h-4 w-4" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedOrg.name}</p>
                    <p className="text-xs text-muted-foreground">AI Support Demo</p>
                  </div>
                </div>
                <button
                  onClick={resetDemo}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Switch demo
                </button>
              </div>
            )}

            {/* Chat card */}
            <div className="border rounded-2xl bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
              {/* Chat header */}
              <div className="px-5 py-3 border-b flex items-center gap-3" style={{ backgroundColor: brandColor + '08' }}>
                <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor + '20' }}>
                  <Bot className="h-4 w-4" style={{ color: brandColor }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedOrg.name} Support</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                    Online — Powered by AI
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[420px] overflow-y-auto p-5 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === 'system' ? (
                      <div className="text-center py-1">
                        <span className="inline-block bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs px-3 py-1.5 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    ) : (
                      <div className={`flex gap-2.5 ${msg.role === 'customer' ? 'flex-row-reverse' : ''}`}>
                        <div
                          className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5"
                          style={msg.role === 'ai'
                            ? { backgroundColor: brandColor + '15' }
                            : { backgroundColor: '#e5e7eb' }
                          }
                        >
                          {msg.role === 'customer'
                            ? <User className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                            : <Bot className="h-3.5 w-3.5" style={{ color: brandColor }} />
                          }
                        </div>

                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === 'customer'
                            ? 'text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-foreground rounded-bl-md'
                        }`}
                          style={msg.role === 'customer' ? { backgroundColor: brandColor } : {}}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                          {msg.role === 'ai' && msg.confidence !== undefined && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-slate-600">
                              <span className="text-xs text-muted-foreground">
                                {Math.round(msg.confidence * 100)}% confident
                              </span>
                              {msg.sources && msg.sources.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  · {msg.sources.join(', ')}
                                </span>
                              )}
                              <div className="flex gap-1 ml-auto">
                                <button className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors" title="Helpful">
                                  <ThumbsUp className="h-3 w-3 text-muted-foreground hover:text-green-600" />
                                </button>
                                <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors" title="Not helpful">
                                  <ThumbsDown className="h-3 w-3 text-muted-foreground hover:text-red-600" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex gap-2.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor + '15' }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: brandColor }} />
                    </div>
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-gray-50/50 dark:bg-slate-800/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your question..."
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:outline-none disabled:opacity-50 transition-shadow"
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className="px-4 py-2.5 text-white rounded-xl disabled:opacity-50 transition-opacity flex items-center gap-2 text-sm font-medium"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Responses are generated from uploaded documentation using RAG
                </p>
              </div>
            </div>

            {/* Suggested questions */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'What services do you offer?',
                  'How do I get started?',
                  'What are your pricing plans?',
                  'How can I contact support?',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="px-3 py-1.5 border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
