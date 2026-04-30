'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Trash2, Plus, Copy, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Member {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'agent' | 'viewer'
  joinedAt: string
}

interface Invite {
  id: string
  email: string
  role: 'admin' | 'agent' | 'viewer'
  invitedBy: string
  createdAt: string
  expiresAt: string
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent' | 'viewer'>('agent')
  const [inviting, setInviting] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'agent' | 'viewer'>('agent')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const currentUserId = (session?.user as any)?.userId
  const userRole = (session?.user as any)?.role

  const isAdmin = ['admin', 'super_admin'].includes(userRole)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/invite'),
      ])

      if (!membersRes.ok || !invitesRes.ok) throw new Error('Failed to fetch')

      const membersData = await membersRes.json()
      const invitesData = await invitesRes.json()

      setMembers(Array.isArray(membersData) ? membersData : [])
      setInvites(Array.isArray(invitesData) ? invitesData : [])
      setError('')
    } catch (err) {
      setError('Failed to load team data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send invite')
        setInviting(false)
        return
      }

      setInvites([...invites, data])
      setInviteEmail('')
      setInviteRole('agent')
      setShowInviteModal(false)
      setError('')
    } catch (err) {
      setError('Failed to send invite')
      console.error(err)
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(memberId: string, newMemberRole: string) {
    try {
      const res = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, newRole: newMemberRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update role')
        return
      }

      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newMemberRole as any } : m))
      )
      setEditingMemberId(null)
      setError('')
    } catch (err) {
      setError('Failed to update role')
      console.error(err)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!window.confirm('Are you sure you want to remove this member?')) return

    try {
      const res = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to remove member')
        return
      }

      setMembers(members.filter((m) => m.id !== memberId))
      setError('')
    } catch (err) {
      setError('Failed to remove member')
      console.error(err)
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!window.confirm('Revoke this invitation?')) return

    try {
      const res = await fetch(`/api/team/invite/${inviteId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to revoke')

      setInvites(invites.filter((i) => i.id !== inviteId))
      setError('')
    } catch (err) {
      setError('Failed to revoke invite')
      console.error(err)
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/auth/accept-invite?token=${token}`
    navigator.clipboard.writeText(url)
    setCopyFeedback(token)
    setTimeout(() => setCopyFeedback(null), 2000)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function isInviteExpired(expiresAt: string) {
    return new Date() > new Date(expiresAt)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'agent':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading team data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-gray-600">Manage team members and invitations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invites">Pending Invites ({invites.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>All members in your organization</CardDescription>
              </div>
              {isAdmin && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                      {isAdmin && (
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{member.name}</td>
                        <td className="py-3 px-4 text-gray-600">{member.email}</td>
                        <td className="py-3 px-4">
                          {editingMemberId === member.id && isAdmin && member.id !== currentUserId ? (
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value as any)}
                              onBlur={() => {
                                if (newRole !== member.role) {
                                  handleRoleChange(member.id, newRole)
                                }
                              }}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="admin">Admin</option>
                              <option value="agent">Agent</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {member.role === 'super_admin' ? 'Super Admin' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(member.joinedAt)}</td>
                        {isAdmin && (
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {member.id !== currentUserId && member.role !== 'super_admin' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingMemberId(member.id)
                                      setNewRole(member.role as 'admin' | 'agent' | 'viewer')
                                    }}
                                  >
                                    Edit Role
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {members.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No team members yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Invites waiting to be accepted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Sent By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Sent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      {isAdmin && (
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => {
                      const isExpired = isInviteExpired(invite.expiresAt)
                      return (
                        <tr key={invite.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{invite.email}</td>
                          <td className="py-3 px-4">
                            <Badge className={getRoleBadgeColor(invite.role)}>
                              {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{invite.invitedBy}</td>
                          <td className="py-3 px-4 text-gray-600">{formatDate(invite.createdAt)}</td>
                          <td className="py-3 px-4">
                            {isExpired ? (
                              <Badge className="bg-red-100 text-red-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Expired
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {!isExpired && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyInviteLink(invite.id)}
                                    className="text-xs"
                                  >
                                    {copyFeedback === invite.id ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy Link
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRevokeInvite(invite.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {invites.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pending invitations
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
              <CardDescription>Send an invitation to join your team</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    disabled={inviting}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInviteModal(false)
                      setInviteEmail('')
                      setInviteRole('agent')
                    }}
                    disabled={inviting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
