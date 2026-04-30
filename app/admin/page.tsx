'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Building2, Users, MessageSquare, Ticket, FileText,
  CheckCircle, AlertTriangle, Bot, Mail, Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PlatformData {
  platform: {
    totalOrgs: number
    totalUsers: number
    totalConversations: number
    totalTickets: number
    totalDocuments: number
  }
  organizations: Array<{
    _id: string
    name: string
    slug: string
    createdAt: string
    aiProvider: string
    aiEnabled: boolean
    emailEnabled: boolean
    users: number
    conversations: number
    tickets: number
    openTickets: number
    documents: number
    escalated: number
  }>
  recentActivity: Array<{
    _id: string
    orgName: string
    customerName: string
    channel: string
    status: string
    createdAt: string
  }>
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<PlatformData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || (session.user as any).role !== 'super_admin') {
      setError('Access denied. Super Admin privileges required.')
      setLoading(false)
      return
    }

    fetch('/api/admin')
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      })
      .then(setData)
      .catch(() => setError('Failed to load admin data'))
      .finally(() => setLoading(false))
  }, [session, status])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="h-12 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              To make a user a super admin, update their role to &quot;super_admin&quot; in the database.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null
  const { platform, organizations, recentActivity } = data

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Platform overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[
          { title: 'Organizations', value: platform.totalOrgs, icon: Building2 },
          { title: 'Users', value: platform.totalUsers, icon: Users },
          { title: 'Conversations', value: platform.totalConversations, icon: MessageSquare },
          { title: 'Tickets', value: platform.totalTickets, icon: Ticket },
          { title: 'Documents', value: platform.totalDocuments, icon: FileText },
        ].map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {organizations.map(org => (
                  <div key={org._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{org.name}</h3>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </div>
                      <div className="flex gap-1">
                        {org.aiEnabled && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Bot className="h-3 w-3" /> {org.aiProvider}
                          </Badge>
                        )}
                        {org.emailEnabled && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'Users', value: org.users },
                        { label: 'Convos', value: org.conversations },
                        { label: 'Tickets', value: org.tickets },
                        { label: 'Open', value: org.openTickets },
                        { label: 'Docs', value: org.documents },
                      ].map(s => (
                        <div key={s.label} className="bg-muted/50 rounded p-2">
                          <p className="text-lg font-bold">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {org.escalated > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                        <AlertTriangle className="h-3 w-3" />
                        {org.escalated} escalated conversations
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={activity._id || i} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.status === 'active' ? 'bg-blue-100' :
                      activity.status === 'resolved' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <MessageSquare className={`h-4 w-4 ${
                        activity.status === 'active' ? 'text-blue-600' :
                        activity.status === 'resolved' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{activity.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.orgName} &middot; {activity.channel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      activity.status === 'active' ? 'default' :
                      activity.status === 'resolved' ? 'success' : 'destructive'
                    } className="text-xs flex-shrink-0">
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
