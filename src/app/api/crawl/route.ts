import { NextRequest, NextResponse } from 'next/server';
import { generateCrawlId, startCrawl } from '@/lib/sf-crawler';

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

    const crawlId = generateCrawlId();

    // Start crawl in background
    startCrawl(siteUrl, crawlId).catch((error) => {
      console.error('Crawl error:', error);
    });

    return NextResponse.json({ crawlId, status: 'initiated' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to start crawl' },
      { status: 500 }
    );
  }
}
