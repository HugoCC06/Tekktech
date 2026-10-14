import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../site.config.ts';
import { articleRoute, getCategory, getPublishedArticles } from '../lib/articles.ts';
import { absoluteUrl } from '../lib/urls.ts';

/** RSS feed of published articles. Demonstration articles are excluded. */
export async function GET(context: APIContext) {
  const siteUrl = context.site!;
  const articles = (await getPublishedArticles()).filter((article) => !article.data.demo).slice(0, 30);
  return rss({
    title: site.name,
    description: site.description,
    site: absoluteUrl('/', siteUrl),
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.excerpt,
      link: absoluteUrl(articleRoute(article), siteUrl),
      pubDate: article.data.publishDate,
      categories: [getCategory(article.data.category).name, ...article.data.tags],
      author: site.name,
    })),
    customData: `<language>${site.locale}</language>`,
    trailingSlash: true,
  });
}
