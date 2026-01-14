import { NextRequest, NextResponse } from 'next/server';
import { verifyWPCredentials } from '@/lib/wordpress-api';

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, username, appPassword } = await request.json();

    if (!siteUrl || !username || !appPassword) {
      return NextResponse.json(
        { valid: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await verifyWPCredentials({ siteUrl, username, appPassword });

    return NextResponse.json(result);
  } catch (error) {
    console.error('WP verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        message: error instanceof Error ? error.message : 'Verification failed',
      },
      { status: 200 }
    );
  }
}
