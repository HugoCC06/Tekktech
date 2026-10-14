import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeSanitize from 'rehype-sanitize';
import { beforeAll, describe, expect, it } from 'vitest';
import { rehypeArticle } from '../../src/lib/markdown/rehype-article.ts';
import { sanitizeSchema } from '../../src/lib/markdown/sanitize-schema.ts';

// The same plugin chain as astro.config.mjs.
let render: (markdown: string, base?: string) => Promise<{ html: string; frontmatter: Record<string, unknown> }>;

beforeAll(async () => {
  const processors = new Map<string, Awaited<ReturnType<typeof createMarkdownProcessor>>>();
  render = async (markdown, base = '/') => {
    if (!processors.has(base)) {
      processors.set(
        base,
        await createMarkdownProcessor({
          rehypePlugins: [
            [rehypeSanitize, sanitizeSchema],
            [rehypeArticle, { base }],
          ],
        }),
      );
    }
    const frontmatter: Record<string, unknown> = {};
    const result = await processors.get(base)!.render(markdown, { frontmatter });
    return { html: result.code, frontmatter: result.metadata.frontmatter };
  };
});

describe('article Markdown sanitisation', () => {
  it('removes raw <script> tags', async () => {
    const { html } = await render('Hello\n\n<script>alert("x")</script>\n\nWorld');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(');
  });

  it('removes inline event handlers and iframes', async () => {
    const { html } = await render(
      '<img src="x.png" onerror="alert(1)">\n\n<iframe src="https://evil.example"></iframe>',
    );
    expect(html).not.toMatch(/onerror|<iframe/);
  });

  it('removes javascript: links', async () => {
    const { html } = await render('[click](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('strips HTML comments such as template guidance', async () => {
    const { html } = await render('<!-- guidance for the writer -->\n\nReal text');
    expect(html).not.toContain('guidance');
    expect(html).toContain('Real text');
  });

  it('keeps ordinary formatting, headings with ids, and links', async () => {
    const { html } = await render('## A heading\n\nSome **bold** text and a [link](https://example.com).');
    expect(html).toContain('<h2 id="a-heading">');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="https://example.com"');
  });
});

describe('article Markdown refinements', () => {
  it('wraps tables in a focusable scroll region', async () => {
    const { html } = await render('| A | B |\n| --- | --- |\n| 1 | 2 |');
    expect(html).toMatch(
      /<div class="table-scroll" role="region" tabindex="0" aria-label="Scrollable table">\s*<table>/,
    );
  });

  it('adds rel="noopener" to external links', async () => {
    const { html } = await render('[site](https://example.com)');
    expect(html).toContain('rel="noopener"');
  });

  it('marks affiliate links as sponsored, labels them, and flags the article', async () => {
    const { html, frontmatter } = await render('[Check price](https://shop.example/item "affiliate")');
    expect(html).toContain('rel="sponsored nofollow noopener"');
    expect(html).toContain('(affiliate link)');
    expect(html).not.toContain('title="affiliate"');
    expect(frontmatter.hasCommercialLinks).toBe(true);
  });

  it('does not flag articles without commercial links', async () => {
    const { frontmatter } = await render('[site](https://example.com "A normal title")');
    expect(frontmatter.hasCommercialLinks).toBe(false);
  });

  it('prefixes root-relative links with the base path', async () => {
    const { html } = await render('[About](/about/)', '/tekktech/');
    expect(html).toContain('href="/tekktech/about/"');
  });
});
