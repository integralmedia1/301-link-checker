import { NextRequest, NextResponse } from 'next/server';
import { findAndReplaceUrl } from '@/lib/wordpress-api';

export async function POST(request: NextRequest) {
  try {
    const { sourceUrl, destUrl, wpConfig } = await request.json();

    if (!sourceUrl || !destUrl || !wpConfig) {
      return NextResponse.json(
        { error: 'sourceUrl, destUrl, and wpConfig are required' },
        { status: 400 }
      );
    }

    if (!wpConfig.siteUrl || !wpConfig.username || !wpConfig.appPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials are incomplete' },
        { status: 400 }
      );
    }

    const result = await findAndReplaceUrl(wpConfig, sourceUrl, destUrl);

    if (result.success) {
      return NextResponse.json({
        status: 'success',
        message: `Successfully updated ${result.affectedPages} page(s)`,
        affectedPages: result.affectedPages,
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: result.message || 'Failed to update links',
        affectedPages: result.affectedPages,
      });
    }
  } catch (error) {
    console.error('Fix link error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
