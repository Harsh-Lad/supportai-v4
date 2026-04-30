import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/email-service'
import { generateToken } from '@/lib/encryption'

/**
 * POST /api/auth/forgot-password
 * Takes { email }
 * Generates reset token, sets resetPasswordToken + resetPasswordExpires (1 hour)
 * Sends password reset email
 * Always returns success (don't leak user existence)
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      // Don't leak user existence - return generic success
      return NextResponse.json({ success: true })
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })

    if (user) {
      // Generate reset token (valid for 1 hour)
      const resetToken = generateToken(32)
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      user.resetPasswordToken = resetToken
      user.resetPasswordExpires = resetExpires
      await user.save()

      // Send reset email
      try {
        await sendPasswordResetEmail(email, resetToken)
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError)
        // Still return success to prevent timing attacks
      }
    }

    // Always return success (don't leak whether email exists)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ success: true })
  }
}
