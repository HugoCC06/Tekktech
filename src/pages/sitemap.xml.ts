import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { categories, hubs } from '../site.config.ts';
import { articleRoute, getIndexableTags, getPublishedArticles, lastModified, tagSlug } from '../lib/articles.ts';
import { isPreviewBuild } from '../lib/integrations.ts';
import { absoluteUrl } from '../lib/urls.ts';

/**
 * XML sitemap of indexable pages. Built from getPublishedArticles(), so
 * drafts and archived articles can never appear. Demonstration articles
 * (noindex), search, admin and paginated listing pages are excluded.
 * Preview builds publish an empty sitemap.
 */
export async function GET(context: APIContext) {
  const siteUrl = context.site!;
  const entries: { path: string; lastmod?: Date }[] = [];

  if (!isPreviewBuild) {
    const articles = (await getPublishedArticles()).filter((article) => !article.data.demo);
    const newest = articles[0] ? lastModified(articles[0]) : undefined;

    entries.push({ path: '/', lastmod: newest }, { path: '/articles/', lastmod: newest });
    for (const hub of Object.values(hubs)) entries.push({ path: hub.path });
    for (const category of categories) entries.push({ path: `/${category.slug}/` });
    for (const tag of (await getIndexableTags()).keys()) entries.push({ path: `/tags/${tagSlug(tag)}/` });
    for (const page of await getCollection('pages')) {
      if (!page.data.noindex) entries.push({ path: `/${page.id}/`, lastmod: page.data.updatedDate });
    }
    for (const article of articles) {
      if (!article.data.canonicalUrl) entries.push({ path: articleRoute(article), lastmod: lastModified(article) });
    }
  }

  const body = entries
    .map(
      (entry) =>
        `  <url><loc>${absoluteUrl(entry.path, siteUrl)}</loc>${
          entry.lastmod ? `<lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>` : ''
        }</url>`,
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
