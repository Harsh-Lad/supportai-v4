import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Invite from '@/models/Invite'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const orgId = (session.user as any).organizationId

    // Only admin and super_admin can revoke invites
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await connectDB()

    const invite = await Invite.findOne({
      _id: params.inviteId,
      organizationId: orgId,
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    await Invite.deleteOne({ _id: params.inviteId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke invite error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
