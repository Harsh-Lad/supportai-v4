import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = (session.user as any).organizationId

    await connectDB()

    const members = await User.find({ organizationId: orgId })
      .select('_id name email role createdAt')
      .sort({ createdAt: 1 })

    return NextResponse.json(
      members.map((member: any) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        joinedAt: member.createdAt,
      }))
    )
  } catch (error) {
    console.error('Fetch members error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const orgId = (session.user as any).organizationId
    const currentUserId = (session.user as any).userId

    // Only admin and super_admin can update roles
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await req.json()
    const { memberId, newRole } = body

    if (!memberId || !newRole) {
      return NextResponse.json(
        { error: 'memberId and newRole are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'agent', 'viewer'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Can't change own role
    if (memberId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    await connectDB()

    const member = await User.findOne({
      _id: memberId,
      organizationId: orgId,
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't change super_admin role
    if (member.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot modify super_admin role' },
        { status: 403 }
      )
    }

    member.role = newRole
    await member.save()

    return NextResponse.json({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      role: member.role,
    })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const orgId = (session.user as any).organizationId
    const currentUserId = (session.user as any).userId

    // Only admin and super_admin can delete members
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await req.json()
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    // Can't delete yourself
    if (memberId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from organization' },
        { status: 400 }
      )
    }

    await connectDB()

    const member = await User.findOne({
      _id: memberId,
      organizationId: orgId,
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't delete super_admin
    if (member.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot remove super_admin' },
        { status: 403 }
      )
    }

    await User.deleteOne({ _id: memberId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
