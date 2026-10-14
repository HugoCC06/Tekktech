/**
 * Pure publishing rules, kept free of Astro imports so they can be unit
 * tested directly. src/lib/articles.ts applies them to the real collection.
 */

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface PublishableArticle {
  id: string;
  data: {
    slug: string;
    status: ArticleStatus;
    publishDate: Date;
    demo: boolean;
  };
}

export interface VisibilityOptions {
  /** Reference time; articles dated after the end of this UTC day are held back. */
  now?: Date;
  /** Drop demonstration articles entirely (EXCLUDE_DEMO_CONTENT=true). */
  excludeDemo?: boolean;
}

/**
 * The single rule that decides whether an article is public.
 *
 * An article is public only when its status is "published", its publication
 * date is not in the future (scheduled posts appear on the first build on or
 * after their date), and it is not demo content that has been excluded.
 * Drafts and archived articles are never rendered, listed, indexed or fed.
 */
export function isPublic(article: PublishableArticle, options: VisibilityOptions = {}): boolean {
  const now = options.now ?? new Date();
  const endOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);
  if (article.data.status !== 'published') return false;
  if (article.data.publishDate.getTime() > endOfToday) return false;
  if (options.excludeDemo && article.data.demo) return false;
  return true;
}

/** Throws if two articles share a URL slug, naming both files. */
export function assertUniqueSlugs(articles: PublishableArticle[]): void {
  const seen = new Map<string, string>();
  for (const article of articles) {
    const existing = seen.get(article.data.slug);
    if (existing) {
      throw new Error(
        `Duplicate article slug "${article.data.slug}" in "${existing}.md" and "${article.id}.md". ` +
          'Every article needs a unique slug — change one of them in the CMS.',
      );
    }
    seen.set(article.data.slug, article.id);
  }
}

const WORDS_PER_MINUTE = 225;

/** Estimated reading time in whole minutes, from the raw Markdown body. */
export function readingTimeMinutes(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → their text
    .replace(/<[^>]+>/g, ' ') // stray HTML
    .replace(/[#>*_`|~-]/g, ' ');
  const words = text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Splits a list into pages of `size`. Always returns at least one (possibly empty) page. */
export function paginate<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export interface RelatableArticle {
  id: string;
  data: { slug: string; category: string; tags: string[]; type: string; related: string[]; publishDate: Date };
}

/**
 * Picks related articles: editor-chosen ones first (in the order given),
 * then the best automatic matches by shared tags, category and type.
 * Only articles in `candidates` (i.e. public ones) can ever be returned.
 */
export function pickRelated<T extends RelatableArticle>(article: T, candidates: T[], limit = 3): T[] {
  const others = candidates.filter((candidate) => candidate.id !== article.id);
  const bySlug = new Map(others.map((candidate) => [candidate.data.slug, candidate]));

  const chosen: T[] = [];
  for (const slug of article.data.related) {
    const match = bySlug.get(slug);
    if (match && !chosen.includes(match)) chosen.push(match);
  }

  const scored = others
    .filter((candidate) => !chosen.includes(candidate))
    .map((candidate) => {
      const sharedTags = candidate.data.tags.filter((tag) => article.data.tags.includes(tag)).length;
      const score =
        sharedTags * 3 +
        (candidate.data.category === article.data.category ? 2 : 0) +
        (candidate.data.type === article.data.type ? 1 : 0);
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || b.candidate.data.publishDate.getTime() - a.candidate.data.publishDate.getTime(),
    )
    .map(({ candidate }) => candidate);

  return [...chosen, ...scored].slice(0, limit);
}
