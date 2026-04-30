import { Types } from 'mongoose'
import UsageLog from '@/models/UsageLog'

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: {
    conversations: 50,
    documentsUploaded: 5,
    tokensUsed: 100000,
    messages: 500,
    emailsProcessed: 10,
  },
  pro: {
    conversations: 1000,
    documentsUploaded: 50,
    tokensUsed: 2000000,
    messages: 10000,
    emailsProcessed: 1000,
  },
  enterprise: {
    conversations: Infinity,
    documentsUploaded: Infinity,
    tokensUsed: Infinity,
    messages: Infinity,
    emailsProcessed: Infinity,
  },
}

export type UsageField = 'conversations' | 'messages' | 'tokensUsed' | 'documentsUploaded' | 'emailsProcessed'
export type PlanType = 'free' | 'pro' | 'enterprise'

/**
 * Get the current month in format "YYYY-MM"
 */
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Increment a usage field for an organization in the current month
 * Uses upsert to avoid race conditions
 */
export async function incrementUsage(
  orgId: string | Types.ObjectId,
  field: UsageField,
  amount: number = 1,
  month?: string
): Promise<void> {
  const monthStr = month || getCurrentMonth()

  const updateObj: Record<string, number> = {
    [field]: amount,
  }

  await UsageLog.findOneAndUpdate(
    { organizationId: new Types.ObjectId(orgId), month: monthStr },
    { $inc: updateObj },
    { upsert: true, new: true }
  )
}

/**
 * Get usage for an organization for a specific month
 */
export async function getUsage(
  orgId: string | Types.ObjectId,
  month?: string
) {
  const monthStr = month || getCurrentMonth()

  const usage = await UsageLog.findOne({
    organizationId: new Types.ObjectId(orgId),
    month: monthStr,
  })

  if (!usage) {
    return {
      conversations: 0,
      messages: 0,
      tokensUsed: 0,
      documentsUploaded: 0,
      emailsProcessed: 0,
    }
  }

  return usage.toObject()
}

/**
 * Check if an organization is within plan limits for a specific field
 * Returns {allowed, current, limit}
 */
export async function checkLimit(
  orgId: string | Types.ObjectId,
  field: UsageField,
  plan: PlanType,
  month?: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const usage = await getUsage(orgId, month)
  const limits = PLAN_LIMITS[plan]

  const current = usage[field] || 0
  const limit = limits[field] || 0

  return {
    allowed: current < limit,
    current,
    limit,
  }
}

/**
 * Check multiple fields at once
 */
export async function checkMultipleLimits(
  orgId: string | Types.ObjectId,
  fields: UsageField[],
  plan: PlanType,
  month?: string
): Promise<Record<string, { allowed: boolean; current: number; limit: number }>> {
  const result: Record<string, { allowed: boolean; current: number; limit: number }> = {}

  for (const field of fields) {
    result[field] = await checkLimit(orgId, field, plan, month)
  }

  return result
}

/**
 * Get usage statistics for a date range
 */
export async function getUsageRange(
  orgId: string | Types.ObjectId,
  startMonth: string,
  endMonth: string
) {
  const logs = await UsageLog.find({
    organizationId: new Types.ObjectId(orgId),
    month: { $gte: startMonth, $lte: endMonth },
  }).sort({ month: 1 })

  return logs
}
