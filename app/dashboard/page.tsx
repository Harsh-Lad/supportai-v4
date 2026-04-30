'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, MessageSquare, Ticket, TrendingUp, Bot, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Stats {
  documents: number
  conversations: number
  activeConversations: number
  tickets: number
  openTickets: number
  escalationRate: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    documents: 0, conversations: 0, activeConversations: 0,
    tickets: 0, openTickets: 0, escalationRate: 0,
  })
  const [recentConversations, setRecentConversations] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [docsRes, convosRes, ticketsRes] = await Promise.all([
          fetch('/api/documents'),
          fetch('/api/conversations'),
          fetch('/api/tickets'),
        ])
        const docs = await docsRes.json()
        const convos = await convosRes.json()
        const tickets = await ticketsRes.json()

        const docsArr = Array.isArray(docs) ? docs : []
        const convosArr = Array.isArray(convos) ? convos : []
        const ticketsArr = Array.isArray(tickets) ? tickets : []

        setStats({
          documents: docsArr.length,
          conversations: convosArr.length,
          activeConversations: convosArr.filter((c: any) => c.status === 'active').length,
          tickets: ticketsArr.length,
          openTickets: ticketsArr.filter((t: any) => t.status === 'open').length,
          escalationRate: convosArr.length > 0
            ? Math.round((ticketsArr.length / convosArr.length) * 100)
            : 0,
        })
        setRecentConversations(convosArr.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { title: 'Documents', value: stats.documents, icon: FileText, desc: 'In knowledge base' },
    { title: 'Conversations', value: stats.conversations, icon: MessageSquare, desc: `${stats.activeConversations} active` },
    { title: 'Open Tickets', value: stats.openTickets, icon: Ticket, desc: `${stats.tickets} total` },
    { title: 'AI Resolution', value: `${100 - stats.escalationRate}%`, icon: TrendingUp, desc: 'Without human help' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Conversations will appear here once customers start chatting</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConversations.map((convo: any) => (
                  <div key={convo._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{convo.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {convo.channel} &middot; {new Date(convo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      convo.status === 'active' ? 'default' :
                      convo.status === 'resolved' ? 'success' : 'destructive'
                    }>
                      {convo.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Upload Documents', desc: 'Go to Documents and upload your support docs (PDF, DOCX, TXT)', done: stats.documents > 0 },
                { step: 2, title: 'Configure Settings', desc: 'Set retry threshold and customize your widget', done: false },
                { step: 3, title: 'Embed Widget', desc: 'Copy the widget code and add it to your website', done: false },
                { step: 4, title: 'Monitor & Improve', desc: 'Review conversations and tickets to improve your docs', done: false },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    item.done ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
