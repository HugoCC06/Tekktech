# Testing

## Test suites

| Command                   | Tool                                                    | What it covers                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`            | ESLint (TypeScript and Astro rules)                     | Code mistakes                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run format:check`    | Prettier                                                | Consistent formatting                                                                                                                                                                                                                                                                                                                                                                     |
| `npm run check`           | `astro check` / TypeScript                              | Type errors in pages, components, scripts and tests                                                                                                                                                                                                                                                                                                                                       |
| `npm test`                | Vitest (`tests/unit/`)                                  | Visibility rules, slug uniqueness, reading time, related articles, Markdown sanitisation and link handling, OAuth handler security, schema ↔ dashboard consistency, structured-data rules                                                                                                                                                                                                 |
| `npm run test:e2e`        | Playwright (`tests/e2e/`), against the production build | Homepage, navigation, a full internal link crawl, listings, category filtering, article metadata, SEO tags and JSON-LD, TOC, related articles, share links, copy link, review honesty, search, draft and archive exclusion, sitemap, robots.txt, RSS, 404, keyboard access, no-JavaScript behaviour, responsive layout at 375/430/768/1024/1440 px, mobile menu, axe accessibility audits |
| `npm run test:publishing` | Playwright + Decap local backend (git mode)             | The real dashboard: sign in (local), create, preview, save draft, confirm it isn't public, publish, confirm it is public everywhere, edit, confirm the update, archive, confirm it is removed everywhere                                                                                                                                                                                  |

The browser tests use the demonstration articles as fixtures. After `npm run demo:remove`, the tests that depend on them are skipped automatically, and the generic checks keep running.

First-time setup for browser tests: `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed Chromium.

## Latest results

Run on 14 October 2026, from a **fresh clone** with `npm ci`, using Node 22.22 and Chromium (Playwright 1.64).

| Check                                                                       | Result                                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Lint                                                                        | ✅ passed, 0 problems                                                                             |
| Formatting                                                                  | ✅ all files formatted                                                                            |
| Type check                                                                  | ✅ 0 errors, 0 warnings (73 files)                                                                |
| Unit tests                                                                  | ✅ **70 / 70 passed** (4 files)                                                                   |
| Production build                                                            | ✅ 36 pages built; Decap bundle downloaded and integrity-verified; 11 articles indexed for search |
| Browser tests                                                               | ✅ **76 / 76 passed** (desktop 1440 px and mobile 375 px projects)                                |
| Publishing workflow                                                         | ✅ **38 / 38 checks passed**                                                                      |
| Build with all demo content removed                                         | ✅ builds 18 pages; homepage shows its empty state                                                |
| axe accessibility audit (homepage, article, review, listing, search, about) | ✅ 0 violations at any impact level                                                               |

### Publishing workflow checks (summary)

The test ran in a disposable copy of the project with its own Git repository. The real Decap dashboard was driven in Chromium.

1. Before creation, the test article was absent from the article URL, homepage, `/articles/`, category page, sitemap, RSS and search.
2. Created an explainer in the dashboard. The live preview showed the title and body.
3. **Save** created branch `cms/explainers/<slug>`; the file was not on `main`.
4. Rebuilt `main`: the draft was absent from all seven public surfaces.
5. **Publish now** merged it into `main` and deleted the branch.
6. Rebuilt: the article was present on all seven surfaces.
7. Edited the title and saved: the live article was unchanged. After publishing, the live article showed the new title.
8. Set **Site status: Archived**, saved and published: the file stayed in the repository, and after rebuilding, the article was absent from all seven surfaces.

### Cloudflare runtime checks

The production build was served with `wrangler pages dev` (Cloudflare's local Pages runtime), with test credentials:

| Check                                     | Result                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /oauth/auth`                         | ✅ 302 to `github.com/login/oauth/authorize` with client ID, callback URL, random state, `allow_signup=false`; `__Host-tt_oauth_state` cookie `HttpOnly; Secure; SameSite=Lax; Max-Age=600` |
| `GET /oauth/callback` with a forged state | ✅ 403, nonce-based CSP, GitHub not contacted                                                                                                                                               |
| **Login with GitHub** in the dashboard    | ✅ Popup opened `/oauth/auth`, which redirected to the real GitHub authorisation page                                                                                                       |
| `/admin/` headers                         | ✅ CSP, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: SAMEORIGIN`                                                                                                                    |
| `/feed/`                                  | ✅ 301 to `/rss.xml`                                                                                                                                                                        |
| Unknown URL                               | ✅ 404 page                                                                                                                                                                                 |

### Lighthouse

Lighthouse 12.8 against the local production build (`astro preview`, no CDN compression, so live results should be similar or better). The mobile preset uses simulated slow 4G and CPU throttling.

| Page         | Preset  | Performance | Accessibility | Best practices | SEO  | LCP   | CLS   |
| ------------ | ------- | ----------- | ------------- | -------------- | ---- | ----- | ----- |
| Homepage     | Mobile  | 100         | 100           | 100            | 100  | 1.5 s | 0.011 |
| Article      | Mobile  | 97          | 100           | 100            | 69\* | 2.3 s | 0.025 |
| All articles | Mobile  | 100         | 100           | 100            | 100  | 1.4 s | 0     |
| Homepage     | Desktop | 100         | 100           | 100            | 100  | 0.4 s | 0     |
| Article      | Desktop | 100         | 100           | 100            | 69\* | 0.5 s | 0.003 |
| All articles | Desktop | 100         | 100           | 100            | 100  | 0.4 s | 0     |

\* The only SEO audit that failed was "Page is blocked from indexing". Demonstration articles are deliberately `noindex`; real articles are indexable.

## Blocked by missing external configuration

| Test                                                          | Status                                                                               | What's needed                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Real GitHub sign-in to the live dashboard                     | ⛔ **Blocked**: no GitHub OAuth App credentials or Cloudflare project were available | Follow [DEPLOYMENT.md step 4](DEPLOYMENT.md#4-test-the-dashboard-end-to-end) after setup |
| Refusal of an unauthorised GitHub account against real GitHub | ⛔ **Blocked** (covered by unit tests with a simulated GitHub)                       | Same procedure, step 4.7                                                                 |
| Production deployment, custom domain, HTTPS                   | ⛔ **Blocked**: no Cloudflare account or domain configured                           | [DEPLOYMENT.md](DEPLOYMENT.md)                                                           |
| Newsletter, analytics and ad providers                        | ⛔ Not configured (off by default; the site was verified working without them)       | Choose providers                                                                         |

## Continuous integration

`.github/workflows/ci.yml` runs every suite above on each push to `main` and on each pull request, including the dashboard's draft pull requests. These results are from local runs: the workflow hasn't run on GitHub yet, because the code hasn't been pushed to `main`.
