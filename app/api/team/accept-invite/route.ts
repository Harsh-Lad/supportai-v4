import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import Invite from '@/models/Invite'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, name, password } = body

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, name, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find valid invite
    const invite = await Invite.findOne({
      token,
      status: 'pending',
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    // Check if invite has expired
    if (new Date() > invite.expiresAt) {
      // Mark as expired
      invite.status = 'expired'
      await invite.save()
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    // Check if user with this email already exists in the organization
    const existingUser = await User.findOne({
      email: invite.email,
      organizationId: invite.organizationId,
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with the role from invite
    const user = await User.create({
      name,
      email: invite.email,
      password: hashedPassword,
      organizationId: invite.organizationId,
      role: invite.role,
    })

    // Mark invite as accepted
    invite.status = 'accepted'
    await invite.save()

    return NextResponse.json(
      {
        message: 'Invite accepted successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
