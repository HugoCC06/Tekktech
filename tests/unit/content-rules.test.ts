import { describe, expect, it } from 'vitest';
import {
  assertUniqueSlugs,
  isPublic,
  paginate,
  pickRelated,
  readingTimeMinutes,
  type PublishableArticle,
  type RelatableArticle,
} from '../../src/lib/content-rules.ts';

const now = new Date('2026-10-14T12:00:00Z');

function article(overrides: Partial<PublishableArticle['data']> = {}, id = 'a'): PublishableArticle {
  return {
    id,
    data: { slug: id, status: 'published', publishDate: new Date('2026-10-01'), demo: false, ...overrides },
  };
}

describe('isPublic — the single visibility rule', () => {
  it('shows published articles', () => {
    expect(isPublic(article(), { now })).toBe(true);
  });

  it('never shows drafts', () => {
    expect(isPublic(article({ status: 'draft' }), { now })).toBe(false);
  });

  it('never shows archived articles', () => {
    expect(isPublic(article({ status: 'archived' }), { now })).toBe(false);
  });

  it('holds back future-dated articles until their publication day', () => {
    expect(isPublic(article({ publishDate: new Date('2026-10-15') }), { now })).toBe(false);
    expect(isPublic(article({ publishDate: new Date('2026-10-14') }), { now })).toBe(true);
  });

  it('drops demonstration content only when asked', () => {
    expect(isPublic(article({ demo: true }), { now })).toBe(true);
    expect(isPublic(article({ demo: true }), { now, excludeDemo: true })).toBe(false);
  });
});

describe('assertUniqueSlugs', () => {
  it('accepts unique slugs', () => {
    expect(() => assertUniqueSlugs([article({ slug: 'one' }, 'one'), article({ slug: 'two' }, 'two')])).not.toThrow();
  });

  it('rejects duplicate slugs and names both files', () => {
    expect(() => assertUniqueSlugs([article({ slug: 'same' }, 'first'), article({ slug: 'same' }, 'second')])).toThrow(
      /Duplicate article slug "same" in "first\.md" and "second\.md"/,
    );
  });
});

describe('readingTimeMinutes', () => {
  it('estimates at about 225 words per minute', () => {
    expect(readingTimeMinutes(Array(900).fill('word').join(' '))).toBe(4);
  });

  it('never returns less than one minute', () => {
    expect(readingTimeMinutes('Short.')).toBe(1);
  });

  it('ignores code blocks, image syntax and link URLs', () => {
    const body = `${Array(450).fill('word').join(' ')}\n\n\`\`\`js\n${Array(2000).fill('code').join(' ')}\n\`\`\`\n![alt](../../img.webp) [text](https://example.com/very/long/url)`;
    expect(readingTimeMinutes(body)).toBe(2);
  });
});

describe('paginate', () => {
  it('splits into pages', () => {
    expect(paginate([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('always returns one page, even when empty', () => {
    expect(paginate([], 12)).toEqual([[]]);
  });
});

describe('pickRelated', () => {
  const make = (id: string, data: Partial<RelatableArticle['data']> = {}): RelatableArticle => ({
    id,
    data: {
      slug: id,
      category: 'gaming',
      tags: [],
      type: 'guide',
      related: [],
      publishDate: new Date('2026-10-01'),
      ...data,
    },
  });

  it('puts editor-chosen articles first, in order', () => {
    const current = make('current', { related: ['c', 'b'] });
    const result = pickRelated(current, [current, make('a'), make('b'), make('c')]);
    expect(result.map((item) => item.id).slice(0, 2)).toEqual(['c', 'b']);
  });

  it('never returns the article itself or articles outside the candidate list', () => {
    const current = make('current', { related: ['hidden-draft'] });
    const result = pickRelated(current, [current, make('a')]);
    expect(result.map((item) => item.id)).toEqual(['a']);
  });

  it('prefers shared tags over category', () => {
    const current = make('current', { tags: ['displays'], category: 'gaming' });
    const sameTag = make('tag', { tags: ['displays'], category: 'consumer-tech' });
    const sameCategory = make('category', { category: 'gaming' });
    expect(pickRelated(current, [sameCategory, sameTag, current])[0]?.id).toBe('tag');
  });

  it('respects the limit', () => {
    const current = make('current');
    expect(pickRelated(current, [make('a'), make('b'), make('c'), make('d')], 2)).toHaveLength(2);
  });
});
