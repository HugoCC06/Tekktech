# TekkTech

TekkTech is an independent technology publication covering consumer tech, gaming hardware, crypto and blockchain, and productivity software. This repository contains the complete website, its private publishing dashboard, its content, and its tests.

This README is the owner's guide. It assumes no web-development experience. More detailed guides live in [`docs/`](docs/):

| Guide                                                      | What it covers                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                   | Putting the site online (Cloudflare Pages), sign-in setup, custom domain, launch checklist |
| [docs/PUBLISHING.md](docs/PUBLISHING.md)                   | Day-to-day writing and publishing in the dashboard, step by step                           |
| [docs/EDITORIAL-CHECKLIST.md](docs/EDITORIAL-CHECKLIST.md) | The checklist to run before publishing any article                                         |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | Technical decisions, hosting evaluation, URL structure, security design                    |
| [docs/TESTING.md](docs/TESTING.md)                         | How the site is tested, and the latest test results                                        |

---

## Status: what is done and what needs you

**Built and verified in this repository**

- The public website: homepage, article pages, listings, four category pages, Reviews and Guides hubs, topic (tag) pages, search, About, editorial and legal pages, 404 page, RSS feed, sitemap and robots.txt.
- The design system, logo, favicon and social-sharing image.
- The content model, with validation, and draft / published / archived states.
- The private publishing dashboard at `/admin/` (Decap CMS) with article templates, live preview, an editorial workflow (save draft → publish), and archiving.
- The secure GitHub sign-in component for the dashboard, which restricts writing to your GitHub account.
- 11 demonstration articles (plus one draft and one archived example) with placeholder illustrations.
- Automated tests: 70 unit tests, 76 browser tests, and a 38-check end-to-end publishing test that drives the real dashboard. See [docs/TESTING.md](docs/TESTING.md).
- GitHub Actions workflows for CI and (optionally) daily rebuilds.

**Needs your action** (step-by-step instructions in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

1. Merge this work into a `main` branch on GitHub.
2. Create a free Cloudflare account and connect the repository to Cloudflare Pages.
3. Create a GitHub OAuth App and add its credentials to Cloudflare, so you can sign in to `/admin/`. **Until you do this, the live dashboard cannot sign in.** It has not been tested against real GitHub credentials, because none were available while building.
4. Buy and connect the `tekktech.com` domain, if you haven't already.
5. Fill in the placeholders in the legal pages and have them reviewed.
6. Replace the demonstration articles with real ones (`npm run demo:remove`).
7. Optional: newsletter, analytics and advertising providers.

---

## 1. What the website is built with

| Part              | Technology                                                                | Why                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Website           | [Astro](https://astro.build) 7                                            | Generates fast, plain HTML pages. No server or database to maintain.                                                                     |
| Language          | TypeScript, Astro components, standard CSS                                | Small, readable, no heavy frameworks.                                                                                                    |
| Articles          | Markdown files in `src/content/articles/`                                 | Portable plain text with version history.                                                                                                |
| Dashboard         | [Decap CMS](https://decapcms.org) 3 at `/admin/`                          | Free, open-source, Git-based: every save is a Git commit.                                                                                |
| Dashboard sign-in | A small GitHub OAuth function (`functions/oauth/`)                        | Keeps the GitHub secret on the server, and only lets you in.                                                                             |
| Search            | [Pagefind](https://pagefind.app)                                          | A static search index built with the site. No paid service.                                                                              |
| Hosting           | Cloudflare Pages (recommended), or GitHub Pages via the included workflow | Free tier allows commercial use, unlimited bandwidth, custom domains. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#hosting-decision). |
| Source control    | GitHub                                                                    | History, backups, and the store for all content.                                                                                         |

There is no database and no paid service. The ongoing cost is the domain name.

## 2. How the repository is organised

```
.
├── src/
│   ├── site.config.ts          ← publication settings: name, categories, navigation, author
│   ├── content.config.ts       ← the article schema (fields and validation rules)
│   ├── content/
│   │   ├── articles/           ← one Markdown file per article
│   │   └── pages/              ← About, Editorial policy, legal pages
│   ├── assets/images/
│   │   ├── articles/           ← article images (uploaded through the dashboard)
│   │   └── fallback/           ← category illustrations used when an article has no image
│   ├── components/             ← reusable building blocks (header, cards, share buttons…)
│   ├── layouts/                ← page shells
│   ├── pages/                  ← one file per kind of URL
│   ├── lib/                    ← logic: which articles are public, SEO data, URLs
│   └── styles/                 ← design tokens and article typography
├── public/
│   ├── admin/                  ← the dashboard page and its preview styles
│   ├── _headers, _redirects    ← Cloudflare security headers and redirects
│   └── brand/, favicon…        ← logo files and icons
├── content-templates/          ← the article templates the dashboard pre-fills
├── functions/oauth/            ← dashboard sign-in endpoint (Cloudflare Pages Function)
├── cms-auth/                   ← the sign-in logic (also deployable as a standalone Worker)
├── scripts/                    ← build helpers, brand/illustration generators, test runner
├── tests/                      ← unit tests (Vitest) and browser tests (Playwright)
├── docs/                       ← guides
└── .github/workflows/          ← automated checks and the optional daily rebuild
```

## 3. Running the site on your computer

You need [Node.js](https://nodejs.org) 22 or newer (the LTS download) and [Git](https://git-scm.com).

```bash
git clone https://github.com/hugocc06/tekktech.git
cd tekktech
npm install                 # install dependencies (once, and after updates)
npm run dev                 # start the site at http://localhost:4321
```

Every command:

| Command                   | What it does                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Development server with live reload at <http://localhost:4321>                                                        |
| `npm run cms`             | Local dashboard backend: use `/admin/` on your computer without GitHub sign-in (run alongside `npm run dev`)          |
| `npm run cms:git`         | The same, using the full draft/publish workflow on local Git branches                                                 |
| `npm run build`           | Builds the production site into `dist/`, including the search index                                                   |
| `npm run preview`         | Serves the production build at <http://localhost:4321> (run `build` first)                                            |
| `npm run lint`            | Checks code for common mistakes                                                                                       |
| `npm run format`          | Formats code consistently                                                                                             |
| `npm run check`           | TypeScript and Astro type checking                                                                                    |
| `npm test`                | Unit tests                                                                                                            |
| `npm run test:e2e`        | Browser tests against the production build (run `build` first; the first time, run `npx playwright install chromium`) |
| `npm run test:publishing` | End-to-end test of the dashboard's draft → publish → edit → archive workflow                                          |
| `npm run verify`          | Lint, type-check, unit tests, build and browser tests, in one go                                                      |
| `npm run demo:remove`     | Lists (or with `-- --yes`, deletes) all demonstration articles                                                        |

> Search works only in the production build. Use `npm run build` and then `npm run preview` to try it locally.

## 4. Creating an article

The full walkthrough is in [docs/PUBLISHING.md](docs/PUBLISHING.md). In short:

1. Go to `https://tekktech.com/admin/` and click **Login with GitHub**.
2. In the left sidebar, choose the kind of article, for example **Reviews**, **Explainers** or **Guides**.
3. Click the **＋ Review** button (or **＋ Explainer**, and so on) at the top of the list. The body is pre-filled with that type's template.
4. Fill in **Title**, **URL slug**, **Excerpt** and **Category**, write the body, and add sources.
5. Click **Save**.

## 5. Editing an existing article

Open **All articles** (or the matching type), click the article, make your changes, and click **Save**. The live article doesn't change until you publish the edit (see section 8).

## 6. Saving a draft

Clicking **Save** stores your work as a _draft_ on a private Git branch. It never appears on the public site, even though it is saved in GitHub. Drafts are listed under the **Workflow** tab in the top bar.

## 7. Previewing an article

- **Live preview:** the right-hand pane of the editor shows the article as you type. Click the eye icon to show or hide it.
- **Full-site preview (optional):** once Cloudflare preview deployments are enabled, every saved draft also gets a private preview URL. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#preview-deployments-for-drafts).

## 8. Publishing and unpublishing

**Publish:** in the editor, set **Status** (top bar) to **Ready**, then click **Publish → Publish now**. This merges the article into the `main` branch. Cloudflare rebuilds the site, and the article goes live in about a minute, once the deployment succeeds.

**Unpublish (archive):** open the article, change **Site status** to **Archived — removed from the public site**, click **Save**, then **Publish → Publish now**. The article disappears from every page, the search index, the RSS feed and the sitemap, but stays in your repository so you can restore it later.

**Delete:** in the editor, use **Delete published entry** (or **Delete unpublished entry** for drafts). The dashboard asks you to confirm. Deleted articles can still be recovered from Git history.

**Scheduling:** set a future **Publication date**. The article stays hidden until the first build on or after that date. Turn on the daily rebuild described in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#scheduled-publishing) to make this automatic.

Only articles whose **Site status** is _Published_, and whose date has arrived, ever appear publicly. This rule lives in one place, `src/lib/content-rules.ts`, and every page, feed, sitemap and search index uses it.

## 9. Uploading and replacing images

In the editor, use **Featured image → Choose an image → Upload**. Images are stored in `src/assets/images/articles/` and automatically resized into responsive WebP versions when the site builds.

- Use 16:9 images of at least 1600×900 pixels (JPG, PNG or WebP).
- Always fill in **Image alt text**: describe what the image shows for people who can't see it. The build refuses images without alt text.
- Tick **Image is AI-generated** for AI illustrations. Never present an AI image as a photograph of a real product or event.
- Add a credit for any image you didn't make yourself, and only use images you have the right to use.
- To replace an image, choose a different one in the same field and publish.

If an article has no image, a category illustration from `src/assets/images/fallback/` is shown instead. To regenerate the placeholder artwork, run `npm run illustrations`.

## 10. Using the article templates

Each article type in the dashboard sidebar starts from its own template in [`content-templates/`](content-templates/):

| Sidebar            | Template        | Use it for                                                     |
| ------------------ | --------------- | -------------------------------------------------------------- |
| Reviews            | `review.md`     | A single product. Also fill in the **Review details** section. |
| Comparisons        | `comparison.md` | Two or more products or technologies side by side              |
| Ranked lists       | `ranking.md`    | Top-N lists, which must state their ranking criteria           |
| Explainers         | `explainer.md`  | Answering one question about how something works               |
| Guides             | `guide.md`      | Helping readers do or choose something                         |
| Opinion & analysis | `opinion.md`    | Clearly labelled opinion                                       |

The grey `<!-- … -->` lines are guidance for you. Delete them as you write. If you forget, they're stripped automatically and never appear on the site. Typical articles run 600–1,000 words.

For reviews, switch on **Used hands-on?** only if you genuinely used the product. A **Score** appears only on hands-on reviews; research-based reviews say clearly that they weren't tested. See the [How we review](src/content/pages/how-we-review.md) page.

## 11. Managing categories and tags

**Categories** are defined once, in `src/site.config.ts` (`categories`). Each category's `slug` is part of every article URL in it (for example `/gaming/…`), so **don't rename a slug after launch**. You can safely change names, summaries and introductions. Adding a category means adding an entry there. The dashboard, category pages and navigation all follow automatically (add it to `navigation` too if it belongs in the header).

**Tags** are typed freely in the dashboard (lowercase, comma-separated). A topic page such as `/tags/displays/` is created automatically once at least two published articles share a tag, which avoids thin, near-empty pages.

## 12. Configuring the private dashboard

The dashboard configuration is generated from `scripts/cms-config.ts` (fields, labels, help text) and `src/site.config.ts` (categories, repository). It's written to `public/admin/cms-config.json` on every build. Don't edit that file by hand.

If you add a field to articles, add it in **both** `src/content.config.ts` (the schema) and `scripts/cms-config.ts` (the dashboard). A unit test fails if they drift apart.

## 13. Configuring sign-in (OAuth) and authorised users

The dashboard signs in with GitHub. A small server-side function (`functions/oauth/[[route]].ts`, logic in `cms-auth/github-oauth.ts`) completes the sign-in and checks that:

1. your GitHub username is listed in `ALLOWED_GITHUB_USERS`, and
2. your account has write access to the repository.

Anyone else is refused, and their token is revoked immediately. Setup steps are in [docs/DEPLOYMENT.md → Dashboard sign-in](docs/DEPLOYMENT.md#3-dashboard-sign-in-github-oauth). Keep yourself as the only collaborator with write access to the GitHub repository: GitHub enforces that permission on every save.

## 14. Deploying the public website

After the one-time setup in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), deployment is automatic: every change that reaches the `main` branch, including every **Publish** in the dashboard, triggers a Cloudflare Pages build. If the build fails (for example, an article is missing required information), the previous version stays live and Cloudflare shows the error.

## 15. Connecting the custom domain

See [docs/DEPLOYMENT.md → Custom domain](docs/DEPLOYMENT.md#5-custom-domain-tekktechcom). The site's canonical address defaults to `https://tekktech.com`. If you launch on a temporary `*.pages.dev` address first, set the `SITE_URL` environment variable to that address until the domain is connected.

## 16. Troubleshooting

| Problem                                              | What to do                                                                                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare build failed                              | Open the deployment log. Content errors name the file and field, e.g. `articles → my-article … imageAlt: Add alternative text`. Fix the article in the dashboard and publish again. |
| "Duplicate article slug"                             | Two articles share a URL slug. Change one of them.                                                                                                                                  |
| Dashboard says "Error loading the CMS configuration" | Usually caused by an edit to `scripts/cms-config.ts`. Run `npm run prepare:admin` locally to see the error.                                                                         |
| Sign-in popup says "not configured"                  | The Cloudflare environment variables are missing; see DEPLOYMENT.md.                                                                                                                |
| Sign-in popup says "not authorised"                  | Your GitHub username isn't in `ALLOWED_GITHUB_USERS`, or your account lacks write access to the repository.                                                                         |
| GitHub shows "redirect_uri is not associated"        | The OAuth App's callback URL doesn't match the address you signed in from.                                                                                                          |
| Article published but not visible                    | Check that **Site status** is _Published_, the publication date isn't in the future, and the Cloudflare deployment finished.                                                        |
| Search finds nothing locally                         | Search needs the production build: `npm run build && npm run preview`.                                                                                                              |
| Local dashboard asks for GitHub                      | Start `npm run cms` in a second terminal, then reload `/admin/`.                                                                                                                    |
| `npm run cms:git` complains about branches           | Commit or stash your own changes first; it switches branches in your working copy.                                                                                                  |

## 17. Backing up and restoring content

All content (articles, pages and images) lives in the GitHub repository, with full history, so every save is already backed up.

- **Extra backup:** on GitHub, click **Code → Download ZIP**, or keep a local clone and run `git pull` regularly.
- **Restore an old version of an article:** open the file on GitHub → **History** → pick a version → copy its contents back, or, with Git, run `git log -- src/content/articles/<file>.md` then `git checkout <commit> -- src/content/articles/<file>.md`.
- **Undo a bad publish:** on GitHub, open the commit and click **Revert**, or run `git revert <commit>`, then push. Cloudflare redeploys automatically.
- **Roll back the whole site instantly:** Cloudflare Pages → your project → **Deployments** → pick an earlier deployment → **Rollback**.

## 18. Adding analytics, advertising and a newsletter later

All three are off by default, and the site works fully without them. They are configured with environment variables in Cloudflare (**Settings → Variables and Secrets**) and take effect on the next deployment. See [`.env.example`](.env.example) for every variable.

**Analytics** (privacy-conscious, cookie-free options):

| Provider                        | Variables                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Cloudflare Web Analytics (free) | `PUBLIC_ANALYTICS_PROVIDER=cloudflare`, `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=…`                       |
| Plausible                       | `PUBLIC_ANALYTICS_PROVIDER=plausible`, `PUBLIC_PLAUSIBLE_DOMAIN=tekktech.com`                       |
| Umami                           | `PUBLIC_ANALYTICS_PROVIDER=umami`, `PUBLIC_UMAMI_SCRIPT_URL=https://…`, `PUBLIC_UMAMI_WEBSITE_ID=…` |

Analytics never loads during local development or on preview deployments. Update the privacy and cookie policies when you enable a provider.

**Newsletter:** until a provider is configured, readers see nothing: a fake signup form is never shown. (In development and previews you'll see a dashed placeholder note.)

| Provider                                | Variables                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Buttondown                              | `PUBLIC_NEWSLETTER_PROVIDER=buttondown`, `PUBLIC_BUTTONDOWN_USERNAME=…`                                                |
| Any provider with an HTML form endpoint | `PUBLIC_NEWSLETTER_PROVIDER=form`, `PUBLIC_NEWSLETTER_FORM_ACTION=https://…`, optional `PUBLIC_NEWSLETTER_EMAIL_FIELD` |

The form posts directly to the provider, so TekkTech never stores email addresses.

**Advertising:** placements are reserved in `src/components/AdSlot.astro` (homepage, end of article). In development they appear as labelled outlines; in production they render nothing. Once an ad network approves the site, add its script and slot markup to `AdSlot.astro` as described in that file, set `providerConfigured = true`, and set `PUBLIC_ADS_ENABLED=true`. Update the cookie policy and add a consent banner if the provider requires one.

**Affiliate links:** add them in an article's **Affiliate links ("Where to buy")** section, or inline in the body by giving a link the title `affiliate`: `[Check price](https://shop.example/item "affiliate")`. Either way, the link is labelled, marked `rel="sponsored nofollow"`, and a disclosure appears at the top of the article automatically. Only add links from programmes you have genuinely joined.

## 19. Moving to another host

The website is a folder of static files (`dist/`) that can run on almost any host: Netlify, Vercel, GitHub Pages (for non-commercial use), S3 and others. To move:

1. Build with `npm run build`, and publish `dist/` on the new host.
2. Recreate the rules in `public/_headers` and `public/_redirects` in the new host's format.
3. Keep the dashboard sign-in working by deploying `cms-auth/` as a standalone Cloudflare Worker (free). Set `ALLOWED_ORIGINS` on the Worker to your site's address, and set `CMS_AUTH_BASE_URL` to the Worker's address when building the site. Details: [docs/DEPLOYMENT.md → Moving hosts](docs/DEPLOYMENT.md#moving-to-another-host).

Your content, images and history stay in GitHub throughout.

---

## Licence and credits

Code and content © TekkTech. Fonts: Inter and Source Serif 4 (SIL Open Font License), self-hosted via Fontsource. Decap CMS is MIT-licensed. The placeholder illustrations are generated by `scripts/generate-placeholder-illustrations.ts`.
