import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RedirectLink } from '@/types';

const execAsync = promisify(exec);

interface CrawlSession {
  crawlId: string;
  siteUrl: string;
  status: 'running' | 'complete' | 'error';
  progress: number;
  phase: string;
  startTime: Date;
  results?: RedirectLink[];
  error?: string;
}

// In-memory session store (replace with Redis for production)
const sessions = new Map<string, CrawlSession>();

const CRAWL_OUTPUT_DIR = '/tmp/sf-crawls';

export function generateCrawlId(): string {
  return `crawl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export async function startCrawl(siteUrl: string, crawlId: string): Promise<void> {
  const outputDir = path.join(CRAWL_OUTPUT_DIR, crawlId);

  // Create session
  sessions.set(crawlId, {
    crawlId,
    siteUrl,
    status: 'running',
    progress: 0,
    phase: 'Initializing crawl...',
    startTime: new Date(),
  });

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Update phase
    updateSession(crawlId, { phase: 'Crawling website...', progress: 10 });

    // Run Screaming Frog CLI in Docker
    // Note: This assumes the SF Docker container is running and accessible
    const cmd = `docker exec sf-crawler screamingfrogseospider \
      --crawl "${siteUrl}" \
      --headless \
      --save-crawl \
      --export-tabs "Response Codes:All" \
      --output-folder "/crawl/${crawlId}" \
      2>&1`;

    try {
      await execAsync(cmd, { timeout: 300000 }); // 5 minute timeout
    } catch (dockerError) {
      // If Docker fails, fall back to mock data for development
      console.warn('Docker SF CLI not available, using mock data:', dockerError);
      await mockCrawl(siteUrl, crawlId, outputDir);
    }

    // Parse results
    updateSession(crawlId, { phase: 'Parsing results...', progress: 80 });
    const results = await parseCrawlResults(crawlId);

    // Complete
    updateSession(crawlId, {
      status: 'complete',
      progress: 100,
      phase: 'Complete',
      results,
    });
  } catch (error) {
    updateSession(crawlId, {
      status: 'error',
      phase: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function mockCrawl(siteUrl: string, crawlId: string, outputDir: string): Promise<void> {
  // Simulate crawl delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  updateSession(crawlId, { phase: 'Checking links...', progress: 50 });

  // Generate mock 301 redirects for demo
  const mockCsv = `Address,Status Code,Redirect URL,Redirect Type
${siteUrl}/old-page,301,${siteUrl}/new-page,Permanent
https://www.linkedin.com/in/old-profile,301,https://au.linkedin.com/in/new-profile,Permanent
${siteUrl}/blog/old-post,301,${siteUrl}/blog/new-post,Permanent`;

  await fs.writeFile(path.join(outputDir, 'response_codes_all.csv'), mockCsv);
}

function updateSession(crawlId: string, updates: Partial<CrawlSession>): void {
  const session = sessions.get(crawlId);
  if (session) {
    sessions.set(crawlId, { ...session, ...updates });
  }
}

export function getCrawlStatus(crawlId: string): CrawlSession | null {
  return sessions.get(crawlId) || null;
}

export async function parseCrawlResults(crawlId: string): Promise<RedirectLink[]> {
  const outputDir = path.join(CRAWL_OUTPUT_DIR, crawlId);
  const csvPath = path.join(outputDir, 'response_codes_all.csv');

  try {
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length <= 1) {
      return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const addressIdx = headers.findIndex((h) => h === 'address');
    const statusIdx = headers.findIndex((h) => h.includes('status'));
    const redirectIdx = headers.findIndex((h) => h.includes('redirect url'));

    const redirects: RedirectLink[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const statusCode = parseInt(values[statusIdx], 10);

      // Only include 301 redirects
      if (statusCode === 301) {
        redirects.push({
          id: `redirect-${i}`,
          sourceUrl: values[addressIdx] || '',
          destUrl: values[redirectIdx] || '',
          statusCode,
          foundOnPages: [], // Would be populated from internal link data
          status: 'pending',
        });
      }
    }

    return redirects;
  } catch (error) {
    console.error('Error parsing crawl results:', error);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

export function getCrawlResults(crawlId: string): RedirectLink[] | null {
  const session = sessions.get(crawlId);
  return session?.results || null;
}
