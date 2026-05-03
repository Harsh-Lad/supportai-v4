'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  TrendingUp, MessageSquare, Bot, Ticket, Mail, ArrowUp, ArrowDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Analytics {
  overview: {
    totalConversations: number
    totalTickets: number
    totalDocuments: number
    aiResolutionRate: number
    avgConfidence: number
    avgMessages: string
  }
  channelBreakdown: { chat: number; voice: number; email: number }
  statusBreakdown: { active: number; resolved: number; escalated: number }
  conversationsTimeline: { date: string; count: number }[]
  topSources: { name: string; count: number }[]
  ticketsByPriority: { high: number; medium: number; low: number }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null
  const { overview, channelBreakdown, statusBreakdown, conversationsTimeline, topSources, ticketsByPriority } = data

  const maxTimelineCount = Math.max(...conversationsTimeline.map(d => d.count), 1)
  const totalChannels = channelBreakdown.chat + channelBreakdown.voice + channelBreakdown.email || 1

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''} — performance metrics and insights
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Conversations', value: overview.totalConversations, icon: MessageSquare, desc: `${overview.avgMessages} avg messages` },
          { title: 'AI Resolution Rate', value: `${overview.aiResolutionRate}%`, icon: Bot, desc: 'Resolved without human help', good: overview.aiResolutionRate > 70 },
          { title: 'Avg Confidence', value: `${overview.avgConfidence}%`, icon: TrendingUp, desc: 'AI response confidence', good: overview.avgConfidence > 50 },
          { title: 'Open Tickets', value: overview.totalTickets, icon: Ticket, desc: `${overview.totalDocuments} docs in KB` },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.good !== undefined && (
                  <Badge variant={stat.good ? 'success' : 'warning'} className="text-xs">
                    {stat.good ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                    {stat.good ? 'Good' : 'Needs work'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Conversation timeline (simple bar chart) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Conversations (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-40">
              {conversationsTimeline.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group"
                  style={{ height: `${Math.max((day.count / maxTimelineCount) * 100, 2)}%` }}
                  title={`${day.date}: ${day.count} conversations`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.count} on {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{new Date(conversationsTimeline[0]?.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>

        {/* Channel breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Chat', value: channelBreakdown.chat, icon: MessageSquare, color: 'bg-blue-500' },
              { label: 'Email', value: channelBreakdown.email, icon: Mail, color: 'bg-green-500' },
            ].map(ch => (
              <div key={ch.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm">
                    <ch.icon className="h-4 w-4 text-muted-foreground" />
                    {ch.label}
                  </div>
                  <span className="text-sm font-medium">
                    {ch.value} ({Math.round((ch.value / totalChannels) * 100)}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${ch.color} rounded-full transition-all`}
                    style={{ width: `${(ch.value / totalChannels) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t mt-4">
              <p className="text-sm font-medium mb-3">Status Distribution</p>
              <div className="flex gap-2">
                {[
                  { label: 'Active', value: statusBreakdown.active, color: 'bg-blue-100 text-blue-800' },
                  { label: 'Resolved', value: statusBreakdown.resolved, color: 'bg-green-100 text-green-800' },
                  { label: 'Escalated', value: statusBreakdown.escalated, color: 'bg-red-100 text-red-800' },
                ].map(s => (
                  <div key={s.label} className={`flex-1 text-center p-2 rounded ${s.color}`}>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top document sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Knowledge Base Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {topSources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topSources.map((source, i) => (
                  <div key={source.name} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{source.name}</span>
                        <span className="text-sm text-muted-foreground">{source.count} hits</span>
                      </div>
                      <Progress value={(source.count / (topSources[0]?.count || 1)) * 100} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ticket Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'High Priority', value: ticketsByPriority.high, color: 'bg-red-500', textColor: 'text-red-600' },
                { label: 'Medium Priority', value: ticketsByPriority.medium, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                { label: 'Low Priority', value: ticketsByPriority.low, color: 'bg-green-500', textColor: 'text-green-600' },
              ].map(p => {
                const total = ticketsByPriority.high + ticketsByPriority.medium + ticketsByPriority.low || 1
                return (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${p.textColor}`}>{p.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {p.value} ({Math.round((p.value / total) * 100)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${p.color} rounded-full transition-all`}
                        style={{ width: `${(p.value / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
