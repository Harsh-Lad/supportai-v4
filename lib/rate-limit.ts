/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-based (upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 60000)

export interface RateLimitConfig {
  windowMs: number   // time window in ms
  maxRequests: number // max requests per window
}

export const RATE_LIMITS = {
  chat: { windowMs: 60000, maxRequests: 30 },       // 30 msgs/min
  documents: { windowMs: 60000, maxRequests: 10 },   // 10 uploads/min
  auth: { windowMs: 900000, maxRequests: 10 },        // 10 attempts/15min
  api: { windowMs: 60000, maxRequests: 60 },          // 60 req/min general
  widget: { windowMs: 60000, maxRequests: 40 },       // 40 req/min per widget
} as const

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)
  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  }
}

// Helper to get client IP from request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
