import { getCollection, type CollectionEntry } from 'astro:content';
import { articleTypes, categories, hubs, type CategoryDefinition } from '../site.config.ts';
import { assertUniqueSlugs, isPublic, pickRelated, readingTimeMinutes } from './content-rules.ts';
import { withBase } from './urls.ts';

export type Article = CollectionEntry<'articles'>;

const excludeDemo = process.env.EXCLUDE_DEMO_CONTENT === 'true';

let cache: Promise<Article[]> | undefined;

/**
 * All public articles, newest first.
 *
 * This is the only function pages, feeds, the sitemap and the search index
 * use to obtain articles, so the visibility rule in `isPublic()` is applied
 * everywhere. Drafts and archived articles never leave this function.
 */
export function getPublishedArticles(): Promise<Article[]> {
  cache ??= (async () => {
    const all = await getCollection('articles');
    assertUniqueSlugs(all);
    return all
      .filter((article) => isPublic(article, { excludeDemo }))
      .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
  })();
  return cache;
}

export function articlePath(article: Article): string {
  return withBase(`/${article.data.category}/${article.data.slug}/`);
}

/** Root-relative path without the base prefix, for canonical URLs. */
export function articleRoute(article: Article): string {
  return `/${article.data.category}/${article.data.slug}/`;
}

export function getCategory(slug: string): CategoryDefinition {
  const category = categories.find((item) => item.slug === slug);
  if (!category) throw new Error(`Unknown category "${slug}"`);
  return category;
}

export function typeLabel(type: string): string {
  return articleTypes.find((item) => item.value === type)?.label ?? 'Article';
}

export function typesForHub(hub: keyof typeof hubs): string[] {
  return articleTypes.filter((item) => item.hub === hub).map((item) => item.value);
}

export function readingTime(article: Article): number {
  return readingTimeMinutes(article.body ?? '');
}

export function lastModified(article: Article): Date {
  return article.data.updatedDate ?? article.data.publishDate;
}

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  return pickRelated(article, await getPublishedArticles(), limit);
}

/** Tags used by at least `minimum` public articles — avoids thin tag pages. */
export async function getIndexableTags(minimum = 2): Promise<Map<string, Article[]>> {
  const tags = new Map<string, Article[]>();
  for (const article of await getPublishedArticles()) {
    for (const tag of article.data.tags) {
      tags.set(tag, [...(tags.get(tag) ?? []), article]);
    }
  }
  return new Map([...tags].filter(([, list]) => list.length >= minimum).sort(([a], [b]) => a.localeCompare(b)));
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** True if the article should show an affiliate disclosure. */
export function needsAffiliateDisclosure(article: Article, hasInlineCommercialLinks = false): boolean {
  return article.data.affiliateDisclosure || article.data.affiliateLinks.length > 0 || hasInlineCommercialLinks;
}
