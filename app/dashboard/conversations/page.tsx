'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, User, Bot, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setConversations(data) })
      .catch(() => {})
  }, [])

  const loadConversation = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/conversations?id=${id}`)
      const data = await res.json()
      setSelected(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground mt-1">Review AI-customer interactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Conversation list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {conversations.length} conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-4">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <div key={convo._id}>
                    <button
                      onClick={() => loadConversation(convo._id)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selected?._id === convo._id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{convo.customerName}</span>
                        <Badge variant={
                          convo.status === 'active' ? 'default' :
                          convo.status === 'resolved' ? 'success' : 'destructive'
                        } className="text-xs">
                          {convo.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{convo.channel}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(convo.updatedAt || convo.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </button>
                    <Separator />
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation detail */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {!selected ? (
              <div className="flex items-center justify-center h-full text-muted-foreground py-20">
                <div className="text-center">
                  <ChevronRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a conversation to view details</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full py-20">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-260px)]">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{selected.customerName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selected.channel} &middot; Retries: {selected.retryCount}
                      </p>
                    </div>
                    <Badge variant={
                      selected.status === 'active' ? 'default' :
                      selected.status === 'resolved' ? 'success' : 'destructive'
                    }>
                      {selected.status}
                    </Badge>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {(selected.messages || []).map((msg: any, i: number) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'customer' ? '' : 'flex-row-reverse'}`}>
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          msg.role === 'customer' ? 'bg-secondary' : msg.role === 'ai' ? 'bg-primary/10' : 'bg-green-100'
                        }`}>
                          {msg.role === 'customer' ? <User className="h-4 w-4" /> :
                           msg.role === 'ai' ? <Bot className="h-4 w-4 text-primary" /> :
                           <User className="h-4 w-4 text-green-600" />}
                        </div>
                        <div className={`max-w-[75%] rounded-lg p-3 text-sm ${
                          msg.role === 'customer' ? 'bg-secondary' : msg.role === 'ai' ? 'bg-primary/5 border' : 'bg-green-50 border border-green-200'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.confidence !== undefined && msg.confidence !== null && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Confidence: {Math.round(msg.confidence * 100)}%
                              {msg.sources?.length > 0 && ` · Sources: ${msg.sources.join(', ')}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
