import type { APIContext } from 'astro';
import { isPreviewBuild } from '../lib/integrations.ts';
import { absoluteUrl, withBase } from '../lib/urls.ts';

/** robots.txt — preview deployments block all crawling. */
export function GET(context: APIContext) {
  const lines = isPreviewBuild
    ? ['User-agent: *', 'Disallow: /']
    : [
        'User-agent: *',
        'Allow: /',
        `Disallow: ${withBase('/admin/')}`,
        `Disallow: ${withBase('/oauth/')}`,
        '',
        `Sitemap: ${absoluteUrl('/sitemap.xml', context.site)}`,
      ];
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
