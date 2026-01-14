import { NextRequest, NextResponse } from 'next/server';
import { detectCMS } from '@/lib/cms-detector';

export async function POST(request: NextRequest) {
  try {
    const { siteUrl } = await request.json();

    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl is required' }, { status: 400 });
    }

    const cmsInfo = await detectCMS(siteUrl);

    return NextResponse.json(cmsInfo);
  } catch (error) {
    console.error('CMS detection error:', error);
    return NextResponse.json(
      {
        type: 'unknown',
        detected: false,
        indicators: [],
      },
      { status: 200 }
    );
  }
}
