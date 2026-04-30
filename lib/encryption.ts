/**
 * AES-256-GCM encryption for sensitive data (API keys, IMAP passwords, etc.)
 * Uses ENCRYPTION_KEY from env, falls back to NEXTAUTH_SECRET
 */
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || ''
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(text: string): string {
  if (!text) return ''
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  // Format: iv:tag:encrypted
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText
  try {
    const [ivHex, tagHex, encrypted] = encryptedText.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    // If decryption fails, return as-is (might be unencrypted legacy data)
    return encryptedText
  }
}

// Generate a secure random token
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

// Generate a signed widget token (JWT-like but simpler)
export function signWidgetToken(orgId: string, allowedDomains: string[]): string {
  const payload = JSON.stringify({ orgId, domains: allowedDomains, exp: Date.now() + 86400000 * 365 })
  const hmac = crypto.createHmac('sha256', getKey())
  hmac.update(payload)
  const sig = hmac.digest('hex')
  return Buffer.from(payload).toString('base64url') + '.' + sig
}

export function verifyWidgetToken(token: string): { orgId: string; domains: string[] } | null {
  try {
    const [payloadB64, sig] = token.split('.')
    const payload = Buffer.from(payloadB64, 'base64url').toString()
    const hmac = crypto.createHmac('sha256', getKey())
    hmac.update(payload)
    if (hmac.digest('hex') !== sig) return null
    const data = JSON.parse(payload)
    if (data.exp && data.exp < Date.now()) return null
    return { orgId: data.orgId, domains: data.domains }
  } catch {
    return null
  }
}
