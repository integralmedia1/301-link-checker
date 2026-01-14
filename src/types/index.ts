export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'results' | 'loading' | 'credentials' | 'fix-result';
  data?: CrawlResults | FixResult | WPCredentials;
}

export interface RedirectLink {
  id: string;
  sourceUrl: string;
  destUrl: string;
  statusCode: number;
  foundOnPages: string[];
  status: 'pending' | 'fixing' | 'fixed' | 'error';
}

export interface CrawlResults {
  siteUrl: string;
  totalPages: number;
  redirects: RedirectLink[];
  crawlTime: number;
}

export interface WPCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

export interface FixResult {
  linkId: string;
  status: 'success' | 'error';
  message: string;
  affectedPages?: number;
}

export interface CrawlStatus {
  crawlId: string;
  status: 'running' | 'complete' | 'error';
  progress: number;
  phase: string;
  error?: string;
}

export interface CMSInfo {
  type: 'wordpress' | 'shopify' | 'wix' | 'squarespace' | 'webflow' | 'unknown';
  detected: boolean;
  indicators: string[];
}
