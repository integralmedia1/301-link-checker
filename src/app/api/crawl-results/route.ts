import { NextRequest, NextResponse } from 'next/server';
import { getCrawlStatus, getCrawlResults } from '@/lib/sf-crawler';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const crawlId = searchParams.get('crawlId');

  if (!crawlId) {
    return NextResponse.json({ error: 'crawlId is required' }, { status: 400 });
  }

  const status = getCrawlStatus(crawlId);

  if (!status) {
    return NextResponse.json({ error: 'Crawl not found' }, { status: 404 });
  }

  if (status.status !== 'complete') {
    return NextResponse.json({ error: 'Crawl not complete' }, { status: 400 });
  }

  const results = getCrawlResults(crawlId);

  return NextResponse.json({
    siteUrl: status.siteUrl,
    totalPages: results?.length || 0,
    redirects: results || [],
    crawlTime: Date.now() - status.startTime.getTime(),
  });
}
