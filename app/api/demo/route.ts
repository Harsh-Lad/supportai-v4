import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Organization from '@/models/Organization'
import Document from '@/models/Document'

/**
 * GET /api/demo — Public endpoint.
 * Returns a list of orgs that have at least one "ready" document,
 * so the demo page can offer a working chatbot to try.
 * Only returns id + name — nothing sensitive.
 */
export async function GET() {
  try {
    await connectDB()

    // Find orgs that have at least one ready document
    const readyDocs = await Document.aggregate([
      { $match: { status: 'ready' } },
      { $group: { _id: '$organizationId' } },
    ])

    const orgIds = readyDocs.map(d => d._id)

    if (orgIds.length === 0) {
      return NextResponse.json([])
    }

    const orgs = await Organization.find({ _id: { $in: orgIds } })
      .select('name')
      .lean()

    const result = orgs.map(o => ({
      id: o._id.toString(),
      name: o.name,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Demo orgs error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
