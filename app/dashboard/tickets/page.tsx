'use client'

import { useEffect, useState, useRef } from 'react'
import {
  MessageSquare, Mail, Headphones, User, Bot, Send,
  Clock, CheckCircle, AlertTriangle, Filter, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const channelIcons: Record<string, any> = {
  chat: MessageSquare,
  email: Mail,
  voice: Headphones,
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets')
      const data = await res.json()
      if (Array.isArray(data)) setTickets(data)
    } catch {}
  }

  useEffect(() => { fetchTickets() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const loadConversation = async (ticket: any) => {
    setSelectedTicket(ticket)
    try {
      const res = await fetch(`/api/conversations?id=${ticket.conversationId}`)
      const data = await res.json()
      setConversation(data)
    } catch {}
  }

  const updateTicket = async (ticketId: string, status: string) => {
    try {
      await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      })
      toast.success(`Ticket marked as ${status}`)
      fetchTickets()
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status })
      }
    } catch {
      toast.error('Failed to update ticket')
    }
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !conversation) return
    setSending(true)

    try {
      const res = await fetch('/api/tickets/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation._id,
          ticketId: selectedTicket._id,
          message: replyText,
        }),
      })

      if (res.ok) {
        setReplyText('')
        // Reload conversation
        loadConversation(selectedTicket)
        toast.success('Reply sent')
      }
    } catch {
      toast.error('Failed to send reply')
    }
    setSending(false)
  }

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter)

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <div className="p-8 h-[calc(100vh-0px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground mt-1">All customer interactions across channels</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all', label: 'All', icon: MessageSquare, color: 'text-foreground' },
          { key: 'open', label: 'Open', icon: AlertTriangle, color: 'text-yellow-500' },
          { key: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
          { key: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-green-500' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`p-3 border rounded-lg text-left transition-colors ${
              filter === item.key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts[item.key as keyof typeof statusCounts]}</p>
          </button>
        ))}
      </div>

      {/* Main layout: ticket list + chat window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 300px)' }}>
        {/* Ticket list */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {filteredTickets.length} tickets
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="px-2 pb-2">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tickets found</p>
                </div>
              ) : (
                filteredTickets.map(ticket => {
                  const ChannelIcon = channelIcons[ticket.channel] || MessageSquare
                  return (
                    <button
                      key={ticket._id}
                      onClick={() => loadConversation(ticket)}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        selectedTicket?._id === ticket._id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ChannelIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{ticket.customerName}</span>
                        </div>
                        <Badge
                          variant={
                            ticket.status === 'open' ? 'warning' :
                            ticket.status === 'in_progress' ? 'default' : 'success'
                          }
                          className="text-xs flex-shrink-0"
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate pl-6">
                        {ticket.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-1 pl-6">
                        <Badge variant={
                          ticket.priority === 'high' ? 'destructive' :
                          ticket.priority === 'medium' ? 'outline' : 'secondary'
                        } className="text-xs">
                          {ticket.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat window */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ChevronRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a ticket to view the conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedTicket.customerName}</h3>
                    {selectedTicket.customerEmail && (
                      <span className="text-xs text-muted-foreground">{selectedTicket.customerEmail}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs gap-1">
                      {(() => { const I = channelIcons[selectedTicket.channel] || MessageSquare; return <I className="h-3 w-3" /> })()}
                      {selectedTicket.channel}
                    </Badge>
                    <Badge variant={
                      selectedTicket.priority === 'high' ? 'destructive' :
                      selectedTicket.priority === 'medium' ? 'warning' : 'secondary'
                    } className="text-xs">
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status === 'open' && (
                    <Button size="sm" variant="outline" onClick={() => updateTicket(selectedTicket._id, 'in_progress')}>
                      Take Over
                    </Button>
                  )}
                  {selectedTicket.status !== 'resolved' && (
                    <Button size="sm" onClick={() => updateTicket(selectedTicket._id, 'resolved')}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {conversation?.messages?.map((msg: any, i: number) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'customer' ? '' : 'flex-row-reverse'}`}>
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        msg.role === 'customer' ? 'bg-secondary' :
                        msg.role === 'ai' ? 'bg-primary/10' : 'bg-green-100 dark:bg-green-900'
                      }`}>
                        {msg.role === 'customer' ? <User className="h-4 w-4" /> :
                         msg.role === 'ai' ? <Bot className="h-4 w-4 text-primary" /> :
                         <User className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className={`max-w-[75%] rounded-lg p-3 text-sm ${
                        msg.role === 'customer' ? 'bg-secondary' :
                        msg.role === 'ai' ? 'bg-primary/5 border' : 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {msg.role === 'customer' ? selectedTicket.customerName :
                             msg.role === 'ai' ? 'AI Assistant' : 'Agent'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                          </span>
                        </div>
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
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply input */}
              {selectedTicket.status !== 'resolved' && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                      placeholder="Type your reply as a human agent..."
                      disabled={sending}
                    />
                    <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
