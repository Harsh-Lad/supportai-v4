import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { generateToken } from '@/lib/encryption'
import { sendTeamInviteEmail } from '@/lib/email-service'
import Invite from '@/models/Invite'
import User from '@/models/User'
import Organization from '@/models/Organization'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const orgId = (session.user as any).organizationId
    const inviterId = (session.user as any).userId

    // Only admin and super_admin can invite
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 })
    }

    const body = await req.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    if (!['admin', 'agent', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists in organization
    const existingUser = await User.findOne({
      email,
      organizationId: orgId,
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in organization' },
        { status: 409 }
      )
    }

    // Check if invite already pending for this email
    const pendingInvite = await Invite.findOne({
      email,
      organizationId: orgId,
      status: 'pending',
    })

    if (pendingInvite) {
      return NextResponse.json(
        { error: 'Invite already pending for this email' },
        { status: 409 }
      )
    }

    // Get organization details
    const org = await Organization.findById(orgId)
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get inviter name
    const inviter = await User.findById(inviterId)
    const inviterName = inviter?.name || 'A team member'

    // Generate invite token
    const token = generateToken(32)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invite
    const invite = await Invite.create({
      email,
      organizationId: orgId,
      role,
      invitedBy: inviterId,
      token,
      expiresAt,
      status: 'pending',
    })

    // Send email
    await sendTeamInviteEmail(email, org.name, inviterName, token)

    return NextResponse.json(
      {
        id: invite._id.toString(),
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = (session.user as any).organizationId
    const userRole = (session.user as any).role

    // Only admin and super_admin can view invites
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await connectDB()

    const invites = await Invite.find({
      organizationId: orgId,
      status: 'pending',
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json(
      invites.map((invite: any) => ({
        id: invite._id.toString(),
        email: invite.email,
        role: invite.role,
        invitedBy: invite.invitedBy?.name || 'Unknown',
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
      }))
    )
  } catch (error) {
    console.error('Fetch invites error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
