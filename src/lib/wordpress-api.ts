import { WPCredentials } from '@/types';

interface WPPage {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { raw: string; rendered: string };
  meta?: {
    _elementor_data?: string;
  };
}

interface WPTemplate {
  id: number;
  meta: {
    _elementor_data: string;
  };
}

export async function verifyWPCredentials(
  credentials: WPCredentials
): Promise<{ valid: boolean; message?: string; status?: number }> {
  const cleanSiteUrl = credentials.siteUrl.trim().replace(/\/+$/, '');
  const cleanUsername = credentials.username.trim();
  const cleanAppPassword = credentials.appPassword.replace(/\s+/g, '');

  try {
    const auth = Buffer.from(`${cleanUsername}:${cleanAppPassword}`).toString('base64');
    const url = `${cleanSiteUrl}/wp-json/wp/v2/users/me`;

    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const finalResponse = await followAuthRedirectIfNeeded(response, url, auth);

    if (finalResponse.ok) {
      return { valid: true, status: finalResponse.status };
    }

    const body = await safeReadBody(finalResponse);
    const message = body || finalResponse.statusText || `API error: ${finalResponse.status}`;
    return { valid: false, status: finalResponse.status, message };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}


export async function findAndReplaceUrl(
  credentials: WPCredentials,
  oldUrl: string,
  newUrl: string
): Promise<{ success: boolean; affectedPages: number; message?: string }> {
  const auth = Buffer.from(`${credentials.username}:${credentials.appPassword}`).toString('base64');
  let affectedPages = 0;

  try {
    // Search in pages
    const pagesAffected = await searchAndReplaceInPostType(credentials.siteUrl, 'pages', oldUrl, newUrl, auth);
    affectedPages += pagesAffected;

    // Search in posts
    const postsAffected = await searchAndReplaceInPostType(credentials.siteUrl, 'posts', oldUrl, newUrl, auth);
    affectedPages += postsAffected;

    // Search in Elementor templates
    const templatesAffected = await searchAndReplaceInElementorTemplates(credentials.siteUrl, oldUrl, newUrl, auth);
    affectedPages += templatesAffected;

    // Clear cache
    await clearWPCache(credentials.siteUrl, auth);

    return { success: true, affectedPages };
  } catch (error) {
    return {
      success: false,
      affectedPages,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function searchAndReplaceInPostType(
  siteUrl: string,
  postType: string,
  oldUrl: string,
  newUrl: string,
  auth: string
): Promise<number> {
  let affected = 0;
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `${siteUrl}/wp-json/wp/v2/${postType}?per_page=${perPage}&page=${page}&context=edit`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    if (!response.ok) break;

    const items: WPPage[] = await response.json();
    if (items.length === 0) break;

    for (const item of items) {
      let updated = false;
      const updates: Record<string, unknown> = {};

      // Check content.raw
      if (item.content?.raw?.includes(oldUrl)) {
        updates.content = item.content.raw.replace(new RegExp(escapeRegExp(oldUrl), 'g'), newUrl);
        updated = true;
      }

      // Check Elementor data
      if (item.meta?._elementor_data) {
        const escapedOld = oldUrl.replace(/\//g, '\\/');
        const escapedNew = newUrl.replace(/\//g, '\\/');

        if (item.meta._elementor_data.includes(escapedOld)) {
          updates.meta = {
            _elementor_data: item.meta._elementor_data.replace(
              new RegExp(escapeRegExp(escapedOld), 'g'),
              escapedNew
            ),
          };
          updated = true;
        }
      }

      if (updated) {
        await fetch(`${siteUrl}/wp-json/wp/v2/${postType}/${item.id}`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
        affected++;
      }
    }

    page++;
    if (items.length < perPage) break;
  }

  return affected;
}

async function searchAndReplaceInElementorTemplates(
  siteUrl: string,
  oldUrl: string,
  newUrl: string,
  auth: string
): Promise<number> {
  let affected = 0;

  try {
    const response = await fetch(
      `${siteUrl}/wp-json/wp/v2/elementor_library?per_page=100&context=edit`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    if (!response.ok) return 0;

    const templates: WPTemplate[] = await response.json();

    const escapedOld = oldUrl.replace(/\//g, '\\/');
    const escapedNew = newUrl.replace(/\//g, '\\/');

    for (const template of templates) {
      if (template.meta?._elementor_data?.includes(escapedOld)) {
        const updatedData = template.meta._elementor_data.replace(
          new RegExp(escapeRegExp(escapedOld), 'g'),
          escapedNew
        );

        await fetch(`${siteUrl}/wp-json/wp/v2/elementor_library/${template.id}`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meta: { _elementor_data: updatedData },
          }),
        });
        affected++;
      }
    }
  } catch {
    // Elementor library endpoint may not exist
  }

  return affected;
}

async function clearWPCache(siteUrl: string, auth: string): Promise<void> {
  try {
    // Try WP Super Cache
    await fetch(`${siteUrl}/wp-json/wp-super-cache/v1/cache`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'delete_cache' }),
    });
  } catch {
    // Cache clearing is optional
  }
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

async function followAuthRedirectIfNeeded(
  response: Response,
  originalUrl: string,
  auth: string
): Promise<Response> {
  if (![301, 302, 303, 307, 308].includes(response.status)) {
    return response;
  }

  const location = response.headers.get('location');
  if (!location) return response;

  const target = new URL(location, originalUrl).toString();
  return fetch(target, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

