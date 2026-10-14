import { pagination } from '../site.config.ts';
import type { Article } from './articles.ts';
import { paginate } from './content-rules.ts';

export interface ListingPageProps {
  articles: Article[];
  page: number;
  totalPages: number;
  totalArticles: number;
}

/**
 * Static paths for a paginated listing served by a `[...page].astro` route:
 * page 1 at the listing root, later pages at `page/2/`, `page/3/`…
 */
export function paginatedPaths<P extends Record<string, string>>(articles: Article[], params: P = {} as P) {
  const pages = paginate(articles, pagination.pageSize);
  return pages.map((items, index) => ({
    params: { ...params, page: index === 0 ? undefined : `page/${index + 1}` },
    props: {
      articles: items,
      page: index + 1,
      totalPages: pages.length,
      totalArticles: articles.length,
    } satisfies ListingPageProps,
  }));
}
