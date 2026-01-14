import { NextRequest, NextResponse } from 'next/server';
import { generateCrawlId, hasRunningCrawl, startCrawl } from '@/lib/sf-crawler';

export async function POST(request: NextRequest) {
  try {
    const { siteUrl } = await request.json();

    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(siteUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (hasRunningCrawl()) {
      return NextResponse.json({ error: 'Another crawl is already running' }, { status: 409 });
    }

    const crawlId = generateCrawlId();

    await startCrawl(siteUrl, crawlId);

    return NextResponse.json({ crawlId, status: 'initiated' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start crawl' },
      { status: 500 }
    );
  }
}

