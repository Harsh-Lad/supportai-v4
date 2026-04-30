import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

/**
 * POST /api/auth/verify-email
 * Takes { token }
 * Finds user by verificationToken, sets emailVerified = true, clears token
 * Returns success
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find user with verification token
    const user = await User.findOne({ verificationToken: token })

    if (!user) {
      return NextResponse.json(
        { error: 'Verification token is invalid' },
        { status: 400 }
      )
    }

    // Mark email as verified and clear token
    user.emailVerified = true
    user.verificationToken = undefined
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
