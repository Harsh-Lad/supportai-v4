import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'
import Conversation from '@/models/Conversation'
import Document from '@/models/Document'
import Ticket from '@/models/Ticket'
import UsageLog from '@/models/UsageLog'
import Invite from '@/models/Invite'

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Require explicit confirmation to proceed with deletion
    if (!body.confirm || body.confirm !== true) {
      return NextResponse.json(
        {
          error: 'Data deletion requires explicit confirmation',
          message: 'Send { "confirm": true } to proceed with permanent deletion',
        },
        { status: 400 }
      )
    }

    await connectDB()

    const userId = (session.user as any).userId
    const orgId = (session.user as any).organizationId

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Missing user or organization ID' },
        { status: 400 }
      )
    }

    // Verify user is super_admin (highest authority required for org deletion)
    const user = await User.findById(userId)
    if (!user || user.organizationId.toString() !== orgId) {
      return NextResponse.json(
        { error: 'User does not belong to this organization' },
        { status: 403 }
      )
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can delete all organization data' },
        { status: 403 }
      )
    }

    // Delete all data for this organization in sequence
    // Order matters: delete dependent records first

    // 1. Delete all conversations
    await Conversation.deleteMany({ organizationId: orgId })

    // 2. Delete all documents (and their chunks)
    await Document.deleteMany({ organizationId: orgId })

    // 3. Delete all tickets
    await Ticket.deleteMany({ organizationId: orgId })

    // 4. Delete all usage logs
    await UsageLog.deleteMany({ organizationId: orgId })

    // 5. Delete all invites
    await Invite.deleteMany({ organizationId: orgId })

    // 6. Delete all users in the organization (except the current user, handled in step 7)
    await User.deleteMany({ organizationId: orgId })

    // 7. Delete the organization itself
    const deletedOrg = await Organization.findByIdAndDelete(orgId)

    if (!deletedOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Log the deletion action
    console.log(`[GDPR] Organization ${orgId} (${deletedOrg.name}) permanently deleted by user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'All organization data has been permanently deleted',
      deletedAt: new Date().toISOString(),
      organization: {
        id: deletedOrg._id.toString(),
        name: deletedOrg.name,
      },
      summary: {
        notice: 'This action cannot be undone. All data for this organization has been permanently removed.',
      },
    })
  } catch (error) {
    console.error('GDPR deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete organization data' },
      { status: 500 }
    )
  }
}
