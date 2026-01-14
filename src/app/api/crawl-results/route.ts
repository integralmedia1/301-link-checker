import { NextRequest, NextResponse } from 'next/server';
import { getCrawlStatus, loadCrawlResults } from '@/lib/sf-crawler';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const crawlId = searchParams.get('crawlId');

  if (!crawlId) {
    return NextResponse.json({ error: 'crawlId is required' }, { status: 400 });
  }

  const status = getCrawlStatus(crawlId);

  if (!status) {
    return NextResponse.json({ error: 'Crawl not found or expired' }, { status: 404 });
  }

  if (status.status !== 'complete') {
    return NextResponse.json({ error: 'Crawl not complete' }, { status: 400 });
  }

  try {
    const results = await loadCrawlResults(crawlId);

    return NextResponse.json({
      siteUrl: status.siteUrl,
      totalPages: results.length,
      redirects: results,
      crawlTime: Date.now() - status.startTime.getTime(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load results' },
      { status: 500 }
    );
  }
}

