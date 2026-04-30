/**
 * Email sending service using Nodemailer.
 * Used for: password reset, email verification, team invites, notifications.
 */
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

const FROM = process.env.SMTP_FROM || 'SupportAI <noreply@supportai.app>'

export async function sendEmail(to: string, subject: string, html: string) {
  // In development without SMTP config, just log
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`)
    console.log(`[EMAIL] Body: ${html.substring(0, 200)}...`)
    return { messageId: 'dev-' + Date.now() }
  }

  return transporter.sendMail({ from: FROM, to, subject, html })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
  await sendEmail(email, 'Reset Your Password - SupportAI', `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;">
      <h2 style="color:#6366f1;">Reset Your Password</h2>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#666;font-size:14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `)
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`
  await sendEmail(email, 'Verify Your Email - SupportAI', `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;">
      <h2 style="color:#6366f1;">Verify Your Email</h2>
      <p>Please verify your email address to complete your registration:</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
        Verify Email
      </a>
      <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
    </div>
  `)
}

export async function sendTeamInviteEmail(email: string, orgName: string, inviterName: string, token: string) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invite?token=${token}`
  await sendEmail(email, `You're invited to ${orgName} on SupportAI`, `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;">
      <h2 style="color:#6366f1;">You're Invited!</h2>
      <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on SupportAI.</p>
      <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
        Accept Invitation
      </a>
      <p style="color:#666;font-size:14px;">This invitation expires in 7 days.</p>
    </div>
  `)
}

export async function sendEscalationNotification(agentEmail: string, ticketInfo: { customerName: string; reason: string; channel: string }) {
  await sendEmail(agentEmail, `[SupportAI] New Escalation: ${ticketInfo.customerName}`, `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;">
      <h2 style="color:#ef4444;">New Ticket Escalation</h2>
      <p>A conversation has been escalated and needs human attention:</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
        <p><strong>Customer:</strong> ${ticketInfo.customerName}</p>
        <p><strong>Channel:</strong> ${ticketInfo.channel}</p>
        <p><strong>Reason:</strong> ${ticketInfo.reason}</p>
      </div>
      <a href="${process.env.NEXTAUTH_URL}/dashboard/tickets" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
        View Ticket
      </a>
    </div>
  `)
}
