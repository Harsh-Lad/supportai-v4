import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Organization from '@/models/Organization'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, orgName } = await req.json()

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Create organization
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const org = await Organization.create({
      name: orgName,
      slug: `${slug}-${Date.now().toString(36)}`,
    })

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      organizationId: org._id,
      role: 'admin',
    })

    return NextResponse.json({
      message: 'Account created successfully',
      userId: user._id,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
