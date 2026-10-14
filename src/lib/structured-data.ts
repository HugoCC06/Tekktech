/**
 * schema.org structured data (JSON-LD).
 *
 * Only facts the site genuinely knows are emitted: no star ratings, review
 * counts, author credentials or popularity figures are ever invented.
 * Review markup is emitted only for hands-on reviews that carry a score
 * (see `reviewJsonLd`) and are not demonstration content.
 */
import { author, site, socialProfiles } from '../site.config.ts';
import { absoluteUrl } from './urls.ts';

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(siteUrl: URL): JsonLd {
  return {
    '@type': 'Organization',
    '@id': absoluteUrl('/#organization', siteUrl),
    name: site.name,
    url: absoluteUrl('/', siteUrl),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icon-512.png', siteUrl),
      width: 512,
      height: 512,
    },
    ...(socialProfiles.length ? { sameAs: socialProfiles.map((profile) => profile.url) } : {}),
  };
}

export function websiteJsonLd(siteUrl: URL): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website', siteUrl),
    name: site.name,
    description: site.description,
    url: absoluteUrl('/', siteUrl),
    inLanguage: site.locale,
    publisher: { '@id': absoluteUrl('/#organization', siteUrl) },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], siteUrl: URL): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl),
    })),
  };
}

export interface ArticleJsonLdInput {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
  published: Date;
  modified: Date;
  section: string;
  tags: string[];
  wordCount: number;
}

export function articleJsonLd(input: ArticleJsonLdInput, siteUrl: URL): JsonLd {
  const url = absoluteUrl(input.path, siteUrl);
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: input.title.slice(0, 110),
    description: input.description,
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    datePublished: input.published.toISOString(),
    dateModified: input.modified.toISOString(),
    author: {
      '@type': 'Organization',
      name: author.name,
      url: absoluteUrl(author.url, siteUrl),
    },
    publisher: { '@id': absoluteUrl('/#organization', siteUrl) },
    articleSection: input.section,
    ...(input.tags.length ? { keywords: input.tags.join(', ') } : {}),
    wordCount: input.wordCount,
    inLanguage: site.locale,
  };
}

export interface ReviewJsonLdInput {
  productName: string;
  score?: number;
  handsOn: boolean;
  demo: boolean;
  summary?: string;
  path: string;
  published: Date;
}

/**
 * Review markup for a hands-on, scored, non-demo review only. Returns null
 * otherwise, so research-based round-ups never claim a rating.
 */
export function reviewJsonLd(input: ReviewJsonLdInput, siteUrl: URL): JsonLd | null {
  if (!input.handsOn || input.demo || typeof input.score !== 'number') return null;
  return {
    '@type': 'Review',
    itemReviewed: { '@type': 'Product', name: input.productName },
    reviewRating: { '@type': 'Rating', ratingValue: input.score, bestRating: 10, worstRating: 0 },
    author: { '@type': 'Organization', name: author.name },
    publisher: { '@id': absoluteUrl('/#organization', siteUrl) },
    datePublished: input.published.toISOString(),
    ...(input.summary ? { reviewBody: input.summary } : {}),
    url: absoluteUrl(input.path, siteUrl),
  };
}

/** Serialises a JSON-LD graph safely for inline <script> embedding. */
export function serializeJsonLd(nodes: JsonLd[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
