import { CMSInfo } from '@/types';

export async function detectCMS(siteUrl: string): Promise<CMSInfo> {
  const indicators: string[] = [];
  let detectedType: CMSInfo['type'] = 'unknown';

  try {
    // Fetch the homepage
    const response = await fetch(siteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrokenLinkChecker/1.0)',
      },
    });

    const html = await response.text();
    const headers = response.headers;

    // Check WordPress indicators
    if (await isWordPress(siteUrl, html, headers, indicators)) {
      detectedType = 'wordpress';
    }
    // Check Shopify
    else if (isShopify(html, headers, indicators)) {
      detectedType = 'shopify';
    }
    // Check Wix
    else if (isWix(html, headers, indicators)) {
      detectedType = 'wix';
    }
    // Check Squarespace
    else if (isSquarespace(html, headers, indicators)) {
      detectedType = 'squarespace';
    }
    // Check Webflow
    else if (isWebflow(html, headers, indicators)) {
      detectedType = 'webflow';
    }
  } catch (error) {
    console.error('CMS detection error:', error);
  }

  return {
    type: detectedType,
    detected: detectedType !== 'unknown',
    indicators,
  };
}

async function isWordPress(
  siteUrl: string,
  html: string,
  headers: Headers,
  indicators: string[]
): Promise<boolean> {
  // Check for wp-content in HTML
  if (html.includes('/wp-content/') || html.includes('/wp-includes/')) {
    indicators.push('Found /wp-content/ or /wp-includes/ paths');
    return true;
  }

  // Check for WordPress meta generator
  if (html.includes('name="generator" content="WordPress')) {
    indicators.push('Found WordPress generator meta tag');
    return true;
  }

  // Check X-Powered-By header
  const poweredBy = headers.get('x-powered-by');
  if (poweredBy?.toLowerCase().includes('wordpress')) {
    indicators.push('X-Powered-By header indicates WordPress');
    return true;
  }

  // Check for REST API
  try {
    const apiResponse = await fetch(`${siteUrl}/wp-json/`, { method: 'HEAD' });
    if (apiResponse.ok) {
      indicators.push('WordPress REST API endpoint exists');
      return true;
    }
  } catch {
    // API check failed
  }

  // Check for wp-login.php
  try {
    const loginResponse = await fetch(`${siteUrl}/wp-login.php`, { method: 'HEAD' });
    if (loginResponse.ok || loginResponse.status === 302) {
      indicators.push('wp-login.php exists');
      return true;
    }
  } catch {
    // Login check failed
  }

  return false;
}

function isShopify(html: string, headers: Headers, indicators: string[]): boolean {
  // Check for Shopify CDN
  if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) {
    indicators.push('Found Shopify CDN references');
    return true;
  }

  // Check X-ShopId header
  if (headers.get('x-shopid')) {
    indicators.push('X-ShopId header present');
    return true;
  }

  // Check for myshopify.com
  if (html.includes('.myshopify.com')) {
    indicators.push('Found myshopify.com reference');
    return true;
  }

  return false;
}

function isWix(html: string, headers: Headers, indicators: string[]): boolean {
  // Check for Wix indicators
  if (html.includes('wix.com') || html.includes('_wix_browser_sess')) {
    indicators.push('Found Wix references');
    return true;
  }

  // Check X-Wix-Request-Id header
  if (headers.get('x-wix-request-id')) {
    indicators.push('X-Wix-Request-Id header present');
    return true;
  }

  // Check for static.parastorage.com (Wix CDN)
  if (html.includes('static.parastorage.com')) {
    indicators.push('Found Wix CDN (parastorage)');
    return true;
  }

  return false;
}

function isSquarespace(html: string, headers: Headers, indicators: string[]): boolean {
  // Check for Squarespace indicators
  if (html.includes('squarespace.com') || html.includes('<!-- This is Squarespace')) {
    indicators.push('Found Squarespace references');
    return true;
  }

  // Check Server header
  const server = headers.get('server');
  if (server?.toLowerCase().includes('squarespace')) {
    indicators.push('Server header indicates Squarespace');
    return true;
  }

  // Check for Squarespace static content
  if (html.includes('static1.squarespace.com')) {
    indicators.push('Found Squarespace static CDN');
    return true;
  }

  return false;
}

function isWebflow(html: string, headers: Headers, indicators: string[]): boolean {
  // Check for Webflow indicators
  if (html.includes('webflow.com') || html.includes('w-nav') || html.includes('wf-page')) {
    indicators.push('Found Webflow references or classes');
    return true;
  }

  // Check X-Webflow-Info header
  if (headers.get('x-webflow-info')) {
    indicators.push('X-Webflow-Info header present');
    return true;
  }

  // Check for Webflow CDN
  if (html.includes('assets.website-files.com') || html.includes('assets-global.website-files.com')) {
    indicators.push('Found Webflow assets CDN');
    return true;
  }

  return false;
}
