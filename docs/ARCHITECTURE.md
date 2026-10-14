# TekkTech architecture

This document records the main technical decisions, their trade-offs, and the rules the code follows.

## Overview

```
                ┌──────────────────────── GitHub repository (source of truth) ───────────────────────┐
  Owner ──► /admin/ (Decap CMS, in the browser) ──GitHub API──► cms/* branch (draft) ──Publish──► main │
     ▲          │                                                                                     │
     │          └─ sign-in popup ─► /oauth/auth ─► GitHub ─► /oauth/callback (Pages Function)         │
     │                                 checks allow-list + push access; secret stays server-side      │
     │                                                                                                 │
     │                     Cloudflare Pages builds main ──► astro build ──► pagefind ──► static dist/ ─┘
  Readers ◄──────────────────────────── plain HTML, CSS, images (no server, no database) ◄───────┘
```

- **Static first.** Every public page is pre-rendered HTML. Article content is readable without JavaScript. JavaScript only enhances: search, copy-link, native share, TOC highlighting and menu polish.
- **Git as the database.** Articles are Markdown files with YAML frontmatter, so every edit is a commit and every version can be recovered.
- **One visibility rule.** `isPublic()` in `src/lib/content-rules.ts` decides whether an article is public. `getPublishedArticles()` in `src/lib/articles.ts` is the only way pages, the RSS feed, the sitemap and the search index obtain articles. Drafts and archived articles are never rendered at all, so they cannot leak through any route.

## Hosting decision

| Option                             | Commercial use                                                                                                                                                                                                                                                                                        | Cost                                               | Notes                                                                                                                                                                           | Verdict                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Cloudflare Pages**               | Allowed on the free plan                                                                                                                                                                                                                                                                              | Free (500 builds/month; static requests unlimited) | Git integration, preview deployments, `_headers`/`_redirects`, Pages Functions for the OAuth endpoint, free Cloudflare Access for previews, custom domains with automatic HTTPS | **Chosen**                           |
| GitHub Pages                       | GitHub's documentation states it is "not intended for or allowed to be used as a free web-hosting service to run your online business, e-commerce site, or any other website that is primarily directed at either facilitating commercial transactions or providing commercial software as a service" | Free                                               | No server-side code, so the OAuth step would need another host                                                                                                                  | Rejected for a monetised publication |
| Cloudflare Workers (static assets) | Allowed                                                                                                                                                                                                                                                                                               | Free tier                                          | Cloudflare's recommended path for new projects; feature-equivalent for this site except native `_redirects`                                                                     | Good future migration target         |
| Netlify / Vercel                   | Allowed on paid plans; free tiers have usage and commercial-use limits that change over time                                                                                                                                                                                                          | Free–paid                                          | Both would work with minor configuration changes                                                                                                                                | Viable alternatives                  |

GitHub Pages was ruled out on its terms of use, not on technical grounds.

**Portability.** The site is a standard static build. Cloudflare-specific pieces are isolated: `public/_headers`, `public/_redirects`, `functions/oauth/` (a three-line wrapper), and the build-environment variables `CF_PAGES_BRANCH`/`CF_PAGES_URL`, which are used only to detect preview builds. The OAuth logic in `cms-auth/github-oauth.ts` uses only web-standard APIs. See [DEPLOYMENT.md → Moving to another host](DEPLOYMENT.md#moving-to-another-host).

## Publishing system

**Decap CMS** (formerly Netlify CMS) was chosen because it is mature, free, Git-based, works with any static host, and provides the requested features: collection lists with statuses, create, edit, rich text and Markdown editing, live preview, an editorial workflow (draft → in review → ready → publish), media management, relation fields, validation, and confirmed deletion.

**Two layers keep drafts private:**

1. **Editorial workflow.** Saving creates or updates a `cms/<collection>/<slug>` branch and a pull request. Nothing reaches `main`, and therefore the live site, until **Publish**, which merges the pull request.
2. **Site status field** (`draft` / `published` / `archived`). Even a file on `main` is only public when its status is `published`. This provides archiving without deletion, and makes accidental merges harmless.

**Self-hosted, integrity-checked bundle.** `scripts/prepare-admin.ts` downloads the pinned Decap version from the npm registry during the build, verifies its SHA-384 hash, and serves it from `/admin/vendor/`. The dashboard loads no third-party scripts, and a tampered bundle stops the build. Installing Decap as an npm dependency was avoided because it pulls in hundreds of packages.

**Generated configuration.** `scripts/cms-config.ts` builds the dashboard configuration from `src/site.config.ts` and `content-templates/`. A unit test asserts that every dashboard field maps to a schema field, and that categories, types, statuses and the slug pattern match.

**Article types as collections.** The sidebar's Reviews, Comparisons, Ranked lists, Explainers, Guides and Opinion collections are filtered views of the same `src/content/articles/` folder. Each one pre-fills its own template and sets the hidden `type` field. **All articles** shows everything with its status.

## Authentication and authorisation

Decap's GitHub backend needs a server-side step to exchange the OAuth code for a token without exposing the client secret. That step is `cms-auth/github-oauth.ts`, mounted as a Cloudflare Pages Function at `/oauth/auth` and `/oauth/callback`.

| Threat                                  | Control                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client secret exposure                  | Read only from server-side environment variables; never in the repository, build output or browser (covered by unit tests)                                              |
| CSRF / login injection                  | Random 256-bit `state` in a `__Host-` cookie (`HttpOnly`, `Secure`, `SameSite=Lax`, 10 minutes), compared in constant time; GitHub is not contacted if it doesn't match |
| Arbitrary GitHub users                  | `ALLOWED_GITHUB_USERS` allow-list (fails closed when empty) **and** push permission on `GITHUB_REPO`; rejected tokens are revoked via GitHub's API                      |
| Token leakage to other windows          | The token is posted only to allow-listed origins (the site itself by default), after the dashboard completes Decap's handshake; never with a `*` target                 |
| Script injection into the callback page | Nonce-based CSP (`default-src 'none'`), token JSON escaped for inline scripts, `no-store`, `no-referrer`                                                                |
| Write access by anyone else             | GitHub enforces repository permissions on every API write; keep the owner as the only collaborator with write access                                                    |
| Unsanitised content                     | Article HTML is sanitised at build time (`rehype-sanitize`): raw HTML, scripts, iframes, event handlers and `javascript:` URLs are removed (covered by unit tests)      |
| Dashboard hijacking                     | `/admin/*` has its own CSP, `frame-ancestors 'self'` and `noindex` (`public/_headers`); it holds no secrets                                                             |

The dashboard's CSP includes `'unsafe-eval'`, which Decap needs for schema validation. The CSP is scoped to `/admin/*` only.

Token lifetime: OAuth App tokens don't expire automatically; sign out from the dashboard menu on shared machines. A GitHub App (documented in DEPLOYMENT.md as optional hardening) issues 8-hour tokens limited to one repository.

## URL taxonomy

| URL                                                                                                                            | Content                                                            |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `/`                                                                                                                            | Homepage                                                           |
| `/articles/`, `/articles/page/2/`                                                                                              | All articles, newest first, 12 per page                            |
| `/consumer-tech/`, `/gaming/`, `/crypto/`, `/productivity/` (+ `/page/N/`)                                                     | Category pages                                                     |
| `/<category>/<slug>/`                                                                                                          | Articles, e.g. `/crypto/how-blockchain-networks-differ/`           |
| `/reviews/`, `/guides/`                                                                                                        | Hubs: reviews, comparisons and ranked lists; explainers and guides |
| `/tags/<tag>/`                                                                                                                 | Topic pages, only for tags used by two or more articles            |
| `/search/`                                                                                                                     | Search (`noindex`)                                                 |
| `/about/`, `/editorial-policy/`, `/how-we-review/`, `/privacy/`, `/cookies/`, `/terms/`, `/affiliate-disclosure/`, `/contact/` | Site pages (`src/content/pages/`)                                  |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt`                                                                                      | Feeds and crawler files                                            |
| `/admin/`                                                                                                                      | Dashboard (`noindex`, disallowed in robots.txt)                    |

Rules: URLs are lowercase, hyphenated and end with `/`. An article URL depends on its category and slug, so **neither should change after publication**. If one must, add a 301 redirect in `public/_redirects`. Slugs are validated (pattern, reserved words such as `page`, uniqueness across all articles, with the build failing on duplicates).

## Content model

Defined in `src/content.config.ts` (Zod schema, validated at build time).

| Field                                                                    | Notes                                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(file name)_                                                            | Permanent identifier                                                                                                                                                                                           |
| `title`, `slug`, `excerpt`                                               | Required; slug pattern and uniqueness enforced                                                                                                                                                                 |
| `category`                                                               | One of the four categories in `site.config.ts`                                                                                                                                                                 |
| `type`                                                                   | review, comparison, ranking, explainer, guide, opinion                                                                                                                                                         |
| `tags`                                                                   | Optional, lowercase                                                                                                                                                                                            |
| `status`                                                                 | `draft` (default), `published`, `archived`                                                                                                                                                                     |
| `featured`                                                               | Homepage lead story                                                                                                                                                                                            |
| `publishDate`, `updatedDate`                                             | `updatedDate` cannot precede `publishDate`                                                                                                                                                                     |
| `author`                                                                 | Always forced to **TekkTech**, whatever is entered                                                                                                                                                             |
| `image`, `imageAlt`, `imageCaption`, `imageCredit`, `imageIsAiGenerated` | Alt text required when an image is set                                                                                                                                                                         |
| `seoTitle` (≤70), `seoDescription` (≤170), `canonicalUrl`, `socialImage` | Optional overrides                                                                                                                                                                                             |
| `sources[]`                                                              | `title`, `url`, `publisher`, `note`                                                                                                                                                                            |
| `related[]`                                                              | Slugs; hidden or missing targets are ignored safely                                                                                                                                                            |
| `review`                                                                 | `productName`, `productCategory`, `summary`, `score` (0–10, halves), `strengths[]`, `weaknesses[]`, `bestFor`, `avoidIf`, `methodology`, `handsOn`, `reviewDate`, `alternatives[]`; required for type `review` |
| `affiliateLinks[]`, `affiliateDisclosure`, `sponsored`, `sponsorName`    | Sponsor name is required when sponsored                                                                                                                                                                        |
| `demo`                                                                   | Demonstration content: warning banner, `noindex`, excluded from the RSS feed and sitemap                                                                                                                       |

Reading time is calculated from the body (225 words per minute).

## Design system

- **Palette:** warm paper neutrals (`#FAFAF7` page, `#0E1014` ink) with one accent, TekkTech cobalt `#2443D6`. All text and accent pairs meet WCAG AA, most AAA; tokens are in `src/styles/global.css`.
- **Type:** Inter (variable, optical sizes) for interface and headings; Source Serif 4 for long-form body copy at a ~68-character measure. Both are self-hosted, with no third-party font requests.
- **Logo:** a typographic wordmark ("Tekk" bold, "Tech" regular in cobalt) converted to outlines (`npm run brand`), plus a "T" favicon.
- **Components:** scoped Astro components in `src/components/`; restrained motion that respects `prefers-reduced-motion`; visible focus styles everywhere.
- **Light mode only.** Dark mode was deliberately left out of the first release to keep the initial experience polished; the tokens make it straightforward to add.

## SEO

Unique titles and descriptions; canonical URLs; Open Graph and Twitter cards (1200×630 article images generated from the featured image); JSON-LD `Organization`, `WebSite`, `Article` and `BreadcrumbList`. `Review` markup is emitted only for hands-on, scored, non-demo reviews. No aggregate ratings or invented data are ever produced. The site also generates an XML sitemap, robots.txt and an RSS feed. Preview builds are `noindex` with a blocking robots.txt and an empty sitemap.

## Performance and accessibility

Pre-rendered HTML, inlined CSS, responsive WebP images with explicit dimensions, lazy loading below the fold, and the hero image loaded eagerly with high priority. There is no client framework: page scripts are a few kilobytes. Measured Lighthouse results are in [TESTING.md](TESTING.md).

## Known limitations

- The live GitHub sign-in hasn't been exercised with real credentials (none were available). The handler is unit-tested, and the redirect to GitHub was verified in Cloudflare's local Pages runtime.
- Decap's editor UI is English-only as configured, and its look is Decap's own, with TekkTech branding on the login screen and in the preview pane.
- Search runs in the browser (Pagefind). It suits thousands of articles but isn't a hosted search service.
- The newsletter form posts directly to the provider; success and error pages are the provider's own.
- The legal pages are templates and need professional review.
- Scheduled posts need the optional daily rebuild to go live automatically.
