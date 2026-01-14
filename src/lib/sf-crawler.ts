import AdmZip from 'adm-zip';
import { RedirectLink } from '@/types';

interface CrawlSession {
  crawlId: string;
  siteUrl: string;
  status: 'running' | 'complete' | 'error';
  progress: number;
  phase: string;
  startTime: Date;
  expiresAt: number;
  lastStatusCheck?: number;
  runId?: number;
  results?: RedirectLink[];
  error?: string;
}

interface WorkflowRunResponse {
  workflow_runs: Array<{
    id: number;
    name: string;
    display_title?: string;
    event: string;
  }>;
}

interface RunStatusResponse {
  id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: string | null;
}

interface ArtifactsResponse {
  artifacts: Array<{
    id: number;
    name: string;
  }>;
}

const sessions = new Map<string, CrawlSession>();
const SESSION_TTL_MS = Number(process.env.CRAWL_SESSION_TTL_MS ?? 2 * 60 * 60 * 1000);
const STATUS_CACHE_MS = Number(process.env.CRAWL_STATUS_CACHE_MS ?? 5000);

export function generateCrawlId(): string {
  return `crawl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function hasRunningCrawl(): boolean {
  purgeExpiredSessions();
  for (const session of sessions.values()) {
    if (session.status === 'running') return true;
  }
  return false;
}

export async function startCrawl(siteUrl: string, crawlId: string): Promise<void> {
  if (hasRunningCrawl()) {
    throw new Error('Another crawl is already running');
  }

  const now = Date.now();
  sessions.set(crawlId, {
    crawlId,
    siteUrl,
    status: 'running',
    progress: 5,
    phase: 'Queued on GitHub Actions...',
    startTime: new Date(),
    expiresAt: now + SESSION_TTL_MS,
  });

  try {
    await dispatchCrawl(siteUrl, crawlId);
    updateSession(crawlId, {
      phase: 'Dispatched to GitHub Actions...',
      progress: 10,
    });
  } catch (error) {
    updateSession(crawlId, {
      status: 'error',
      phase: 'Error',
      error: error instanceof Error ? error.message : 'Failed to dispatch crawl',
    });
    throw error;
  }
}

export async function refreshCrawlStatus(crawlId: string): Promise<CrawlSession | null> {
  const session = getCrawlStatus(crawlId);
  if (!session) return null;

  if (session.status !== 'running') {
    return session;
  }

  const now = Date.now();
  if (session.lastStatusCheck && now - session.lastStatusCheck < STATUS_CACHE_MS) {
    return session;
  }

  let runId = session.runId;
  if (!runId) {
    runId = await findRunIdForCrawl(crawlId);
    if (runId) {
      updateSession(crawlId, { runId });
    }
  }

  if (!runId) {
    updateSession(crawlId, {
      phase: 'Waiting for GitHub runner...',
      progress: 10,
      lastStatusCheck: now,
    });
    return getCrawlStatus(crawlId);
  }

  const runStatus = await getRunStatus(runId);
  if (runStatus.status !== 'completed') {
    updateSession(crawlId, {
      phase: `GitHub Actions: ${runStatus.status.replace('_', ' ')}`,
      progress: runStatus.status === 'queued' ? 15 : 60,
      lastStatusCheck: now,
    });
    return getCrawlStatus(crawlId);
  }

  if (runStatus.conclusion === 'success') {
    updateSession(crawlId, {
      status: 'complete',
      progress: 100,
      phase: 'Complete',
      lastStatusCheck: now,
    });
  } else {
    updateSession(crawlId, {
      status: 'error',
      phase: 'Error',
      error: runStatus.conclusion ? `Workflow ${runStatus.conclusion}` : 'Workflow failed',
      lastStatusCheck: now,
    });
  }

  return getCrawlStatus(crawlId);
}

export async function loadCrawlResults(crawlId: string): Promise<RedirectLink[]> {
  const session = getCrawlStatus(crawlId);
  if (!session) {
    throw new Error('Crawl not found');
  }

  if (session.status !== 'complete') {
    throw new Error('Crawl not complete');
  }

  if (session.results) {
    return session.results;
  }

  if (!session.runId) {
    throw new Error('Missing workflow run ID');
  }

  updateSession(crawlId, { phase: 'Downloading crawl results...', progress: 90 });
  const csvContent = await downloadCrawlCsv(session.runId, crawlId);
  const results = parseCsvContent(csvContent);

  updateSession(crawlId, {
    results,
    phase: 'Complete',
    progress: 100,
  });

  return results;
}

export function getCrawlStatus(crawlId: string): CrawlSession | null {
  purgeExpiredSessions();
  return sessions.get(crawlId) || null;
}

export function getCrawlResults(crawlId: string): RedirectLink[] | null {
  const session = getCrawlStatus(crawlId);
  return session?.results || null;
}

function updateSession(crawlId: string, updates: Partial<CrawlSession>): void {
  const session = sessions.get(crawlId);
  if (session) {
    sessions.set(crawlId, { ...session, ...updates });
  }
}

function purgeExpiredSessions(): void {
  const now = Date.now();
  for (const [crawlId, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(crawlId);
    }
  }
}

function getGithubConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const workflow = process.env.GITHUB_WORKFLOW_CRAWL;
  const ref = process.env.GITHUB_REF || 'main';
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !workflow || !token) {
    throw new Error('Missing GitHub configuration (GITHUB_OWNER, GITHUB_REPO, GITHUB_WORKFLOW_CRAWL, GITHUB_TOKEN)');
  }

  return { owner, repo, workflow, ref, token };
}

async function dispatchCrawl(siteUrl: string, crawlId: string): Promise<void> {
  const { owner, repo, workflow, ref } = getGithubConfig();
  await githubRequest(`/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({
      ref,
      inputs: {
        crawlId,
        siteUrl,
      },
    }),
  });
}

async function findRunIdForCrawl(crawlId: string): Promise<number | undefined> {
  const { owner, repo, workflow } = getGithubConfig();
  const data = await githubRequest<WorkflowRunResponse>(
    `/repos/${owner}/${repo}/actions/workflows/${workflow}/runs?per_page=10`
  );

  const match = data.workflow_runs.find((run) => {
    const title = run.display_title || '';
    return run.event === 'workflow_dispatch' && (title.includes(crawlId) || run.name.includes(crawlId));
  });

  return match?.id;
}

async function getRunStatus(runId: number): Promise<RunStatusResponse> {
  const { owner, repo } = getGithubConfig();
  return githubRequest<RunStatusResponse>(`/repos/${owner}/${repo}/actions/runs/${runId}`);
}

async function downloadCrawlCsv(runId: number, crawlId: string): Promise<string> {
  const { owner, repo } = getGithubConfig();
  const artifacts = await githubRequest<ArtifactsResponse>(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`);
  const artifactName = `sf-crawl-${crawlId}`;
  const artifact = artifacts.artifacts.find((item) => item.name === artifactName);

  if (!artifact) {
    throw new Error(`Artifact ${artifactName} not found`);
  }

  const response = await githubFetch(`/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`);
  if (!response.ok) {
    throw new Error(`Failed to download artifact: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entry = zip.getEntries().find((item: { entryName: string }) =>
    item.entryName.endsWith('response_codes_all.csv')
  );

  if (!entry) {
    throw new Error('response_codes_all.csv not found in artifact');
  }

  return entry.getData().toString('utf-8');
}

async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await githubFetch(path, init);
  if (!response.ok) {
    const message = await safeReadBody(response);
    throw new Error(message || `GitHub API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function githubFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { token } = getGithubConfig();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(init.headers ?? {}),
  };

  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers,
  });
}

function parseCsvContent(csvContent: string): RedirectLink[] {
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

    if (statusCode === 301) {
      redirects.push({
        id: `redirect-${i}`,
        sourceUrl: values[addressIdx] || '',
        destUrl: values[redirectIdx] || '',
        statusCode,
        foundOnPages: [],
        status: 'pending',
      });
    }
  }

  return redirects;
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

async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
