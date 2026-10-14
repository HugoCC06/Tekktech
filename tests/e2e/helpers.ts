import { existsSync } from 'node:fs';
import type { APIRequestContext } from '@playwright/test';

/**
 * Many tests use the demonstration articles as fixtures. After they are
 * removed for launch (`npm run demo:remove`), those tests are skipped and the
 * generic checks (navigation, links, sitemap, accessibility…) keep running.
 */
export const HAS_DEMO = existsSync('src/content/articles/passkeys-explained.md');
export const DEMO_REASON = 'Uses the demonstration articles, which have been removed';

export const DRAFT_SLUG = 'example-unpublished-draft';
export const ARCHIVED_SLUG = 'example-archived-article';
export const HIDDEN_MARKERS = [DRAFT_SLUG, ARCHIVED_SLUG, 'DRAFT-CANARY', 'ARCHIVED-CANARY'];

export const ARTICLE = {
  path: '/consumer-tech/passkeys-explained/',
  title: 'Passkeys explained: the technology replacing passwords',
};

export const REVIEW_PATH = '/gaming/example-review-halcyon-one-keyboard/';

/** Crawls every internal page reachable from the homepage. */
export async function crawl(request: APIRequestContext, start = '/') {
  const seen = new Map<string, number>();
  const queue = [start];
  const bodies = new Map<string, string>();
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    const response = await request.get(path);
    seen.set(path, response.status());
    const type = response.headers()['content-type'] ?? '';
    if (!type.includes('text/html')) continue;
    const html = await response.text();
    bodies.set(path, html);
    for (const match of html.matchAll(/href="([^"#?]+)[^"]*"/g)) {
      const href = match[1]!;
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      if (/^\/(admin|_astro|pagefind)\//.test(href) || /\.(png|svg|webp|jpg|xml|webmanifest|ico)$/.test(href)) continue;
      if (!seen.has(href)) queue.push(href);
    }
  }
  return { statuses: seen, bodies };
}
