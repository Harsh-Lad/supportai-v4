'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Message {
  role: 'user' | 'ai'
  content: string
  confidence?: number
  sources?: string[]
  tokensUsed?: number
  retryCount?: number
}

interface OrgSettings {
  _id: string
  name: string
}

export default function PlaygroundPage() {
  const { data: session } = useSession()
  const [orgData, setOrgData] = useState<OrgSettings | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)

  const orgId = (session?.user as any)?.organizationId

  // Fetch org settings on mount
  useEffect(() => {
    async function fetchSettings() {
      if (!orgId) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('Failed to fetch settings')
        const data = await res.json()
        setOrgData(data)
      } catch (err) {
        console.error('Error fetching settings:', err)
        setError('Failed to load organization data')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [orgId])

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || !orgId) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          orgId,
          channel: 'playground',
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to send message')
      }

      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.response,
        confidence: data.confidence,
        sources: data.sources,
        tokensUsed: data.tokensUsed,
        retryCount: data.retryCount,
      }])
    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setSelectedMessage(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading playground...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedMsg = selectedMessage !== null ? messages[selectedMessage] : null

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Test Playground</h1>
        <p className="text-muted-foreground mt-1">
          Test your AI support assistant and debug responses
        </p>
      </div>

      <div className="flex-1 gap-6 flex min-h-0">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chat Window</CardTitle>
                  <CardDescription>
                    Organization: {orgData?.name || 'Loading...'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardHeader>

            {error && (
              <div className="px-6 py-3 bg-destructive/5 border-b">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <CardContent className="flex-1 overflow-y-auto space-y-4 py-4">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <p className="text-muted-foreground mb-2">No messages yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start chatting to test your setup
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex cursor-pointer transition-colors ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  } hover:opacity-80`}
                  onClick={() => setSelectedMessage(i)}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground border'
                    } ${selectedMessage === i ? 'ring-2 ring-primary' : ''}`}
                  >
                    <p>{msg.content}</p>
                    {msg.role === 'ai' && msg.confidence !== undefined && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          Confidence: {(msg.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </CardContent>

            <Separator />
            <div className="p-4 flex gap-2 border-t">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !sending) {
                    handleSendMessage()
                  }
                }}
                disabled={sending}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!input.trim() || sending}
              >
                {sending ? (
                  <div className="animate-spin h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Debug Panel */}
        <div className="w-96">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Debug Panel</CardTitle>
              <CardDescription>
                {selectedMsg ? 'Selected message details' : 'Click a message to debug'}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-4 py-4">
              {!selectedMsg ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Select a message to view details
                    </p>
                  </div>
                </div>
              ) : selectedMsg.role === 'user' ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Message Type
                    </p>
                    <Badge>User Message</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Content
                    </p>
                    <p className="text-sm p-2 bg-muted/50 rounded border">
                      {selectedMsg.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Confidence Score
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full"
                          style={{
                            width: `${(selectedMsg.confidence || 0) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold min-w-fit">
                        {(selectedMsg.confidence || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Sources Used
                    </p>
                    {selectedMsg.sources && selectedMsg.sources.length > 0 ? (
                      <div className="space-y-1">
                        {selectedMsg.sources.map((source, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No sources used</p>
                    )}
                  </div>

                  {selectedMsg.tokensUsed !== undefined && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Tokens Used
                      </p>
                      <p className="text-sm font-mono bg-slate-50 p-2 rounded border">
                        {selectedMsg.tokensUsed}
                      </p>
                    </div>
                  )}

                  {selectedMsg.retryCount !== undefined && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Retry Count
                      </p>
                      <p className="text-sm font-mono bg-slate-50 p-2 rounded border">
                        {selectedMsg.retryCount}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Response
                    </p>
                    <p className="text-sm p-2 bg-muted/50 rounded border whitespace-pre-wrap">
                      {selectedMsg.content}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
