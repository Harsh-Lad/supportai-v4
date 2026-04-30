import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';

const packageJson = require('@/package.json');

export async function GET() {
  const timestamp = new Date().toISOString();
  const version = packageJson.version || '1.0.0';

  try {
    // Attempt to connect to MongoDB
    await connectDB();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp,
        version,
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    // Database connection failed, but app is still running
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        status: 'ok',
        timestamp,
        version,
        database: 'disconnected',
        databaseError: errorMessage,
      },
      { status: 200 }
    );
  }
}

// Explicitly disable authentication for health checks
export const dynamic = 'force-dynamic';
