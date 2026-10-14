// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeSanitize from 'rehype-sanitize';
import { site } from './src/site.config.ts';
import { sanitizeSchema } from './src/lib/markdown/sanitize-schema.ts';
import { rehypeArticle } from './src/lib/markdown/rehype-article.ts';

/**
 * Deployment environment.
 *
 * A build is a *preview* build when DEPLOY_ENV=preview, or when Cloudflare
 * Pages builds any branch other than the production branch. Preview builds
 * are marked noindex and robots.txt disallows crawling.
 */
const branch = process.env.CF_PAGES_BRANCH ?? '';
const isPreview = process.env.DEPLOY_ENV === 'preview' || (branch !== '' && branch !== site.productionBranch);

const siteUrl = process.env.SITE_URL || (isPreview && process.env.CF_PAGES_URL) || site.defaultUrl;

/** Optional base path, e.g. "/tekktech" when served from a sub-directory. */
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: siteUrl,
  base,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Inline CSS (≈7 kB gzipped per page) to remove render-blocking requests:
    // most readers arrive on a single article from search or social.
    inlineStylesheets: 'always',
  },
  markdown: {
    processor: unified({
      rehypePlugins: [
        [rehypeSanitize, sanitizeSchema],
        [rehypeArticle, { base }],
      ],
    }),
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: 'github-light' },
  },
  image: {
    // Only local images are optimised; remote images are never hotlinked.
    domains: [],
  },
  vite: {
    define: {
      'import.meta.env.TT_DEPLOY_PREVIEW': JSON.stringify(isPreview),
      'import.meta.env.TT_DEPLOY_BRANCH': JSON.stringify(branch),
    },
  },
});
