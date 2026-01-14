import { NextRequest, NextResponse } from 'next/server';
import { getCrawlStatus } from '@/lib/sf-crawler';

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

  return NextResponse.json({
    crawlId: status.crawlId,
    status: status.status,
    progress: status.progress,
    phase: status.phase,
    error: status.error,
  });
}
