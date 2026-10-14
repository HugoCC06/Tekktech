import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { buildCmsConfig } from '../../scripts/cms-config.ts';
import { RESERVED_SLUGS, SLUG_PATTERN, collections } from '../../src/content.config.ts';
import { articleTypes, author, categories, navigation } from '../../src/site.config.ts';
import { reviewJsonLd, serializeJsonLd } from '../../src/lib/structured-data.ts';

const cms = buildCmsConfig();
type CmsField = {
  name: string;
  widget: string;
  options?: { value: string }[];
  default?: unknown;
  pattern?: [string, string];
};
const allArticles = cms.collections.find((collection) => collection.name === 'articles')!;
const fields = allArticles.fields as CmsField[];
const field = (name: string) => fields.find((item) => item.name === name)!;

// Build the real article schema with a stand-in for Astro's image() helper.
const schemaFactory = (collections.articles as unknown as { schema: (ctx: { image: () => z.ZodType }) => z.ZodObject })
  .schema;
const articleSchema = schemaFactory({ image: () => z.string() });

const validArticle = {
  title: 'A valid article title',
  slug: 'a-valid-article',
  excerpt: 'An excerpt that is comfortably longer than twenty characters.',
  category: 'gaming',
  publishDate: '2026-10-01',
};

describe('site configuration', () => {
  it('uses TekkTech as the public author', () => {
    expect(author.name).toBe('TekkTech');
  });

  it('has the four editorial categories with unique slugs', () => {
    expect(categories.map((category) => category.name)).toEqual([
      'Consumer Tech',
      'Gaming Tech',
      'Crypto & Blockchain',
      'Productivity & Software',
    ]);
    expect(new Set(categories.map((category) => category.slug)).size).toBe(4);
  });

  it('only links navigation to real sections', () => {
    const sections = new Set(['/reviews/', '/guides/', ...categories.map((category) => `/${category.slug}/`)]);
    for (const item of navigation) expect(sections.has(item.href)).toBe(true);
  });
});

describe('article schema', () => {
  it('accepts a minimal valid article and applies safe defaults', () => {
    const data = articleSchema.parse(validArticle);
    expect(data.status).toBe('draft');
    expect(data.demo).toBe(false);
    expect(data.tags).toEqual([]);
  });

  it('always sets the author to TekkTech, whatever is entered', () => {
    expect(articleSchema.parse({ ...validArticle, author: 'Some Personal Name' }).author).toBe('TekkTech');
  });

  it('rejects invalid and reserved slugs', () => {
    expect(() => articleSchema.parse({ ...validArticle, slug: 'Not A Slug' })).toThrow();
    expect(() => articleSchema.parse({ ...validArticle, slug: 'double--hyphen' })).toThrow();
    for (const slug of RESERVED_SLUGS) expect(() => articleSchema.parse({ ...validArticle, slug })).toThrow();
  });

  it('rejects unknown categories and statuses', () => {
    expect(() => articleSchema.parse({ ...validArticle, category: 'politics' })).toThrow();
    expect(() => articleSchema.parse({ ...validArticle, status: 'live' })).toThrow();
  });

  it('requires alt text when an image is set', () => {
    expect(() => articleSchema.parse({ ...validArticle, image: 'x.webp' })).toThrow(/alternative text/);
  });

  it('requires a sponsor name for sponsored content', () => {
    expect(() => articleSchema.parse({ ...validArticle, sponsored: true })).toThrow(/sponsor/);
  });

  it('requires review details for reviews', () => {
    expect(() => articleSchema.parse({ ...validArticle, type: 'review' })).toThrow(/review details/);
  });

  it('treats an empty review block written by the CMS as absent', () => {
    expect(
      articleSchema.parse({ ...validArticle, review: { handsOn: false, productName: '' } }).review,
    ).toBeUndefined();
  });

  it('treats blank optional CMS fields as absent', () => {
    const data = articleSchema.parse({
      ...validArticle,
      updatedDate: '',
      seoTitle: '',
      canonicalUrl: null,
      tags: null,
    });
    expect(data.updatedDate).toBeUndefined();
    expect(data.seoTitle).toBeUndefined();
    expect(data.tags).toEqual([]);
  });

  it('rejects an updated date before the publication date', () => {
    expect(() => articleSchema.parse({ ...validArticle, updatedDate: '2026-09-01' })).toThrow(/updated date/);
  });

  it('only allows half-point scores between 0 and 10', () => {
    const review = { productName: 'Thing', handsOn: true };
    expect(() => articleSchema.parse({ ...validArticle, review: { ...review, score: 11 } })).toThrow();
    expect(() => articleSchema.parse({ ...validArticle, review: { ...review, score: 7.3 } })).toThrow();
    const parsed = articleSchema.parse({ ...validArticle, review: { ...review, score: 7.5 } }) as {
      review?: { score?: number };
    };
    expect(parsed.review?.score).toBe(7.5);
  });
});

describe('CMS configuration matches the content schema', () => {
  it('writes every CMS field to a key the schema understands', () => {
    const schemaKeys = new Set([...Object.keys(articleSchema.shape), 'body']);
    for (const item of fields) expect(schemaKeys, `CMS field "${item.name}"`).toContain(item.name);
  });

  it('offers exactly the configured categories and types', () => {
    expect(field('category').options?.map((option) => option.value)).toEqual(
      categories.map((category) => category.slug),
    );
    expect(field('type').options?.map((option) => option.value)).toEqual(articleTypes.map((type) => type.value));
  });

  it('uses the same slug pattern as the schema', () => {
    expect(field('slug').pattern?.[0]).toBe(SLUG_PATTERN.source);
  });

  it('offers only the three supported statuses', () => {
    expect(
      field('status')
        .options?.map((option) => option.value)
        .sort(),
    ).toEqual(['archived', 'draft', 'published']);
  });

  it('has a template-backed collection for every article type', () => {
    for (const type of articleTypes) {
      const collection = cms.collections.find(
        (item) => 'filter' in item && (item.filter as { value: string }).value === type.value,
      );
      expect(collection, type.value).toBeDefined();
      const typeField = (collection!.fields as CmsField[]).find((item) => item.name === 'type')!;
      expect(typeField.widget).toBe('hidden');
      expect(typeField.default).toBe(type.value);
      const body = (collection!.fields as CmsField[]).find((item) => item.name === 'body')!;
      expect(String(body.default)).toContain('##');
    }
  });

  it('uses the editorial workflow on the GitHub backend without a hard-coded secret', () => {
    expect(cms.publish_mode).toBe('editorial_workflow');
    expect(cms.backend.name).toBe('github');
    expect(JSON.stringify(cms)).not.toMatch(/secret|client_id|token/i);
  });
});

describe('structured data', () => {
  const base = { productName: 'Thing', path: '/gaming/thing/', published: new Date('2026-10-01'), summary: 'Good.' };
  const site = new URL('https://tekktech.com');

  it('emits Review markup only for hands-on, scored, non-demo reviews', () => {
    expect(reviewJsonLd({ ...base, handsOn: true, score: 8, demo: false }, site)).not.toBeNull();
    expect(reviewJsonLd({ ...base, handsOn: false, score: 8, demo: false }, site)).toBeNull();
    expect(reviewJsonLd({ ...base, handsOn: true, demo: false }, site)).toBeNull();
    expect(reviewJsonLd({ ...base, handsOn: true, score: 8, demo: true }, site)).toBeNull();
  });

  it('never emits aggregate ratings', () => {
    expect(JSON.stringify(reviewJsonLd({ ...base, handsOn: true, score: 8, demo: false }, site))).not.toContain(
      'aggregateRating',
    );
  });

  it('escapes markup when embedding JSON-LD', () => {
    expect(serializeJsonLd([{ name: '</script><script>alert(1)</script>' }])).not.toContain('</script>');
  });
});
