# Deploying TekkTech

This guide takes the site from this repository to a live website at `https://tekktech.com`, with a working private dashboard. Do the steps in order. Expect about an hour the first time.

Nothing here has been done on your behalf. No accounts, domains or credentials were available while the site was built, so these steps are yours.

**Contents**

1. [Put the code on a `main` branch](#1-put-the-code-on-a-main-branch)
2. [Create the Cloudflare Pages project](#2-create-the-cloudflare-pages-project)
3. [Dashboard sign-in (GitHub OAuth)](#3-dashboard-sign-in-github-oauth)
4. [Test the dashboard end to end](#4-test-the-dashboard-end-to-end)
5. [Custom domain (tekktech.com)](#5-custom-domain-tekktechcom)
6. [Preview deployments for drafts](#preview-deployments-for-drafts)
7. [Scheduled publishing](#scheduled-publishing)
8. [Recommended GitHub settings](#recommended-github-settings)
9. [Environment variable reference](#environment-variable-reference)
10. [Moving to another host](#moving-to-another-host)
11. [Deploying to GitHub Pages instead](#deploying-to-github-pages-instead)
12. [Launch checklist](#launch-checklist)

---

## 1. Put the code on a `main` branch

The site, the dashboard and Cloudflare all treat **`main`** as the live branch (`productionBranch` in `src/site.config.ts`).

1. On GitHub, open `hugocc06/tekktech`.
2. Merge the development branch into `main`, either through a pull request or by creating `main` from it: **Branches → New branch**, name it `main`, source the development branch.
3. Make `main` the default branch: **Settings → General → Default branch → main**.

**Strongly recommended: make the repository private.** Saved drafts live on `cms/…` branches in the repository. In a public repository, anyone could read your unpublished drafts on GitHub. Go to **Settings → General → Danger Zone → Change visibility → Private**. Cloudflare Pages works with private repositories on the free plan.

## 2. Create the Cloudflare Pages project

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. Go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorise the Cloudflare GitHub app for **only** the `hugocc06/tekktech` repository, then select it.
4. Configure the build:

   | Setting                | Value                                                                    |
   | ---------------------- | ------------------------------------------------------------------------ |
   | Project name           | `tekktech` (gives you `https://tekktech.pages.dev`, if the name is free) |
   | Production branch      | `main`                                                                   |
   | Framework preset       | Astro                                                                    |
   | Build command          | `npm run build`                                                          |
   | Build output directory | `dist`                                                                   |
   | Root directory         | _(leave empty)_                                                          |

5. Under **Environment variables (advanced)**, add `NODE_VERSION` = `22`. (The repository's `.nvmrc` already requests Node 22; this is a safety net.)
6. Click **Save and Deploy**. The first build takes two to four minutes. The build log shows `Decap CMS 3.16.3 verified` and finishes with Pagefind indexing.
7. Open the `*.pages.dev` address. The site should load.

**Until the domain is connected:** in **Settings → Variables and Secrets** (Production), add `SITE_URL` = `https://tekktech.pages.dev` (your real `*.pages.dev` address), then redeploy. That makes canonical URLs, the sitemap and social previews point to the address that actually works. Remove the variable once `tekktech.com` is live.

> **Why Cloudflare Pages?** GitHub's own terms state that GitHub Pages "is not intended for or allowed to be used as a free web-hosting service to run your online business". Cloudflare Pages' free plan allows commercial sites, unlimited bandwidth and custom domains, and it runs the dashboard sign-in function from the same project. Cloudflare now also recommends _Workers_ (with static assets) for new projects. Pages remains supported, and because this site is a plain static build, moving to Workers or another host later is straightforward. See [ARCHITECTURE.md](ARCHITECTURE.md#hosting-decision).

## 3. Dashboard sign-in (GitHub OAuth)

The dashboard needs a GitHub OAuth application so it can save to the repository on your behalf. The secret stays in Cloudflare and is never sent to browsers.

### 3a. Create the GitHub OAuth App

1. On GitHub: your avatar → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:

   | Field                      | Value                                                                                          |
   | -------------------------- | ---------------------------------------------------------------------------------------------- |
   | Application name           | `TekkTech Dashboard`                                                                           |
   | Homepage URL               | `https://tekktech.com` (or your `*.pages.dev` address for now)                                 |
   | Authorization callback URL | `https://tekktech.com/oauth/callback` (or `https://tekktech.pages.dev/oauth/callback` for now) |
   | Enable Device Flow         | leave unticked                                                                                 |

3. Click **Register application**, then **Generate a new client secret**. Copy the **Client ID** and the **Client secret**. The secret is shown only once.

An OAuth App allows only one callback address. Sign in to the dashboard from that exact address: `/admin/` on preview deployments will fail with GitHub's "redirect_uri is not associated" message. When you move from `*.pages.dev` to `tekktech.com`, update the callback URL.

### 3b. Add the credentials to Cloudflare

In Cloudflare: **Workers & Pages → tekktech → Settings → Variables and Secrets → Production → Add**:

| Variable               | Type                 | Value                                                                       |
| ---------------------- | -------------------- | --------------------------------------------------------------------------- |
| `GITHUB_CLIENT_ID`     | Text                 | the Client ID                                                               |
| `GITHUB_CLIENT_SECRET` | **Secret** (encrypt) | the Client secret                                                           |
| `ALLOWED_GITHUB_USERS` | Text                 | your GitHub username, e.g. `hugocc06` (comma-separate several)              |
| `GITHUB_REPO`          | Text                 | `hugocc06/tekktech`                                                         |
| `OAUTH_SCOPE`          | Text                 | `repo` (needed for a private repository; use `public_repo` if it is public) |

Then **Deployments → latest → Retry deployment** (or push any commit), so the function picks up the variables.

### How sign-in is protected

- The client secret exists only in Cloudflare's encrypted settings. It is not in the repository, the built site, or any browser.
- Each sign-in uses a random one-time `state` value, stored in a 10-minute, `HttpOnly`, `Secure`, `SameSite=Lax` cookie, to block cross-site request forgery.
- After GitHub signs you in, the function checks that your username is in `ALLOWED_GITHUB_USERS` **and** that your account can push to `GITHUB_REPO`. Anyone else is refused, and their token is revoked straight away.
- The token is handed only to the dashboard window on the same site, never broadcast.
- If `ALLOWED_GITHUB_USERS` is empty, nobody can sign in (fail closed).
- GitHub is the final gatekeeper: every save is a GitHub API call that succeeds only for accounts with write access. **Keep yourself as the only collaborator with write access** (**Settings → Collaborators**).
- There is no public registration, and hiding the `/admin/` address is not relied on.

### Optional hardening: a GitHub App instead of an OAuth App

An OAuth App's `repo` scope covers _all_ repositories your account can access, and its tokens don't expire. A **GitHub App** can be limited to the single TekkTech repository and issues tokens that expire after 8 hours. The sign-in function works with both unchanged, because GitHub uses the same sign-in endpoints. This option has **not** been tested end to end with the dashboard. If you try it, run the test in step 4, and switch back to the OAuth App credentials if anything fails.

1. **Settings → Developer settings → GitHub Apps → New GitHub App.** Set the callback URL to `https://tekktech.com/oauth/callback`, tick **Expire user authorization tokens**, untick **Webhook → Active**.
2. Repository permissions: **Contents** read and write; **Pull requests** read and write; **Issues** read and write (the dashboard uses labels to track draft status); **Metadata** read-only; **Commit statuses** read-only.
3. Install the app on **only** the `hugocc06/tekktech` repository.
4. Generate a client secret, and put the app's Client ID and secret in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. `OAUTH_SCOPE` is ignored.

## 4. Test the dashboard end to end

Do this once after setup. It is the part that could not be tested without your credentials.

1. Open `https://tekktech.com/admin/` (or your `*.pages.dev` address) and click **Login with GitHub**. Approve the app. The dashboard should open on **All articles**.
2. Choose **Explainers → ＋ Explainer**. Enter the title `Dashboard test`, the slug `dashboard-test`, an excerpt of at least 20 characters, and any category. Click **Save**.
3. On GitHub, check that a branch `cms/explainers/dashboard-test` and a pull request appeared, and that the live site has no `/…/dashboard-test/` page.
4. In the dashboard, set **Status → Ready**, then **Publish → Publish now**. Wait for the Cloudflare deployment to finish, then check that the article appears on the site and in search.
5. Change **Site status** to **Archived**, then save and publish. After the deployment, check that the article has gone from the site, the search and `/sitemap.xml`.
6. Delete the test article with **Delete published entry**.
7. **Check that unauthorised users are refused:** in a private window, sign in with a _different_ GitHub account (or ask a friend). The popup should say "This GitHub account is not authorised to use the TekkTech dashboard", and nothing should be saved.

If step 1 fails, the popup shows the reason. See the troubleshooting table in the README.

## 5. Custom domain (tekktech.com)

1. Buy `tekktech.com` from any registrar. Cloudflare Registrar sells domains at cost. Skip this if you already own it.
2. Put the domain on Cloudflare DNS (needed for the root domain): **Cloudflare dashboard → Add a domain → tekktech.com → Free plan**, then change the nameservers at your registrar to the two Cloudflare gives you. Propagation can take up to 24 hours. Cloudflare emails you when it's active.
3. **Workers & Pages → tekktech → Custom domains → Set up a custom domain** → enter `tekktech.com` → **Activate domain**. Cloudflare creates the DNS record and issues the HTTPS certificate automatically, usually within minutes.
4. Add `www.tekktech.com` the same way, then redirect it to the root domain: **tekktech.com zone → Rules → Redirect Rules → Create rule**. When _Hostname equals `www.tekktech.com`_, use a dynamic redirect to `concat("https://tekktech.com", http.request.uri.path)` with status 301, and preserve the query string.
5. Remove the `SITE_URL` variable if you set it in step 2, and redeploy.
6. Update the GitHub OAuth App's Homepage and callback URLs to `https://tekktech.com/…`.
7. Check `https://tekktech.com/robots.txt` and `https://tekktech.com/sitemap.xml`, then submit the sitemap in [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters).

HTTPS is automatic. The site also sends `Strict-Transport-Security` (`public/_headers`).

## Preview deployments for drafts

Every saved draft lives on its own `cms/…` branch. Cloudflare can build each branch at a private preview address, so you can see a draft exactly as it will look on the live site.

1. **Settings → Builds → Branch control → Preview branch → All non-production branches** (or _Custom_, including `cms/*`).
2. **Protect previews:** **Settings → General → Access policy → Enable access policy** (Cloudflare Access, free for up to 50 users). Allow only your email address. Without this, preview addresses are hard to guess but not private.
3. After saving a draft, find its preview address under **Deployments** (it looks like `https://cms-explainers-my-article.tekktech.pages.dev`). Preview builds show a "Preview deployment" banner, are marked `noindex`, and their `robots.txt` blocks all crawlers.

## Scheduled publishing

Articles with a future **Publication date** stay hidden until a build runs on or after that date (UTC). To publish them automatically:

1. Cloudflare: **Settings → Builds → Deploy hooks → Add deploy hook**, branch `main`. Copy the URL.
2. GitHub: **Settings → Secrets and variables → Actions → New repository secret**, name `CLOUDFLARE_DEPLOY_HOOK`, value the URL.

The workflow `.github/workflows/scheduled-rebuild.yml` then rebuilds the site daily at 05:07 UTC. You can also run it manually from the **Actions** tab.

## Recommended GitHub settings

- **Actions:** the `CI` workflow runs linting, type checks, unit tests, the build, browser tests and the publishing test on every push and pull request, including the pull requests the dashboard opens for drafts.
- **Branch protection (optional):** **Settings → Branches → Add rule** for `main`, requiring the `Lint, type-check, test and build` check to pass. The dashboard's **Publish** then refuses to merge an article that breaks the build. Leave "Require approvals" off, because you are the only author.
- **Secret scanning:** **Settings → Code security → Secret scanning → Enable** (free for public repositories, available on private ones with GitHub Advanced Security).

## Environment variable reference

| Variable                                                          | Where                               | Required                              | Purpose                                                    |
| ----------------------------------------------------------------- | ----------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `GITHUB_CLIENT_ID`                                                | Cloudflare (Production)             | For the dashboard                     | OAuth App client ID                                        |
| `GITHUB_CLIENT_SECRET`                                            | Cloudflare (Production, **secret**) | For the dashboard                     | OAuth App secret                                           |
| `ALLOWED_GITHUB_USERS`                                            | Cloudflare (Production)             | For the dashboard                     | Comma-separated GitHub usernames allowed to sign in        |
| `GITHUB_REPO`                                                     | Cloudflare (Production)             | Recommended                           | `owner/repo`; signed-in users must have push access to it  |
| `OAUTH_SCOPE`                                                     | Cloudflare (Production)             | Optional                              | `repo` (default) or `public_repo`                          |
| `SITE_URL`                                                        | Cloudflare                          | Until the domain is live              | Canonical site address; defaults to `https://tekktech.com` |
| `NODE_VERSION`                                                    | Cloudflare                          | Recommended                           | `22`                                                       |
| `EXCLUDE_DEMO_CONTENT`                                            | Cloudflare                          | Optional                              | `true` hides all demo articles without deleting them       |
| `DEPLOY_ENV`                                                      | Cloudflare                          | Rarely                                | `preview` forces a `noindex` build                         |
| `BASE_PATH`                                                       | Build                               | Rarely                                | Serve the site from a sub-folder, e.g. `/tekktech`         |
| `CMS_AUTH_BASE_URL`                                               | Build                               | Only with a standalone sign-in Worker | Address of the Worker                                      |
| `PUBLIC_ANALYTICS_*`, `PUBLIC_NEWSLETTER_*`, `PUBLIC_ADS_ENABLED` | Cloudflare                          | Optional                              | See the README, section 18                                 |

Never put a secret in a variable whose name starts with `PUBLIC_`: those values are embedded in the public website.

## Moving to another host

The public site is the static `dist/` folder, so it runs anywhere. The only Cloudflare-specific parts are:

| Part                                   | On another host                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/_headers`                      | Recreate the headers in the host's format (Netlify uses the same `_headers` format; Vercel uses `vercel.json`)                                                           |
| `public/_redirects`                    | Recreate the redirects (Netlify uses the same format)                                                                                                                    |
| `functions/oauth/` (dashboard sign-in) | Deploy `cms-auth/` as a standalone Cloudflare Worker (below), or adapt `cms-auth/github-oauth.ts`, which uses only web-standard APIs, to the host's serverless functions |

**Standalone sign-in Worker:**

```bash
cd cms-auth
npx wrangler login
npx wrangler deploy                                # creates https://tekktech-cms-auth.<account>.workers.dev
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put ALLOWED_GITHUB_USERS
```

Then set `ALLOWED_ORIGINS = "https://tekktech.com"` in `cms-auth/wrangler.toml` and redeploy. Change the OAuth App callback to `https://tekktech-cms-auth.<account>.workers.dev/oauth/callback`, and build the site with `CMS_AUTH_BASE_URL=https://tekktech-cms-auth.<account>.workers.dev`.

---

## Deploying to GitHub Pages instead

The repository also includes `.github/workflows/deploy-github-pages.yml`, which builds the site and publishes it to GitHub Pages at `https://hugocc06.github.io/Tekktech/`, or at your custom domain.

> GitHub's terms say Pages is not intended for running an online business. GitHub Pages is fine while TekkTech isn't monetised; move to Cloudflare Pages (above) before adding ads or affiliate income.

**Setup**

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.** This is the important step. With the default "Deploy from a branch", GitHub runs Jekyll on the raw source code and the build fails with `Invalid YAML front matter in …astro`.
2. Make sure a `main` branch exists (see step 1 at the top). The workflow runs on every push to `main`, or manually from **Actions → Deploy to GitHub Pages → Run workflow**.
3. If Settings → Environments → `github-pages` restricts deployment branches, allow `main`.

The site address and the `/Tekktech/` sub-path are detected automatically, and every page, image, search result and dashboard link works under that sub-path (verified). If you add a custom domain in **Settings → Pages → Custom domain**, the next deployment switches to it automatically. To override the canonical address, add a repository variable `SITE_URL` (**Settings → Secrets and variables → Actions → Variables**).

**What's different from Cloudflare Pages**

| Feature                                | GitHub Pages                                                                                                                                                                                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public website, search, RSS, sitemap   | ✅ Works                                                                                                                                                                                                                                                                          |
| Dashboard sign-in (`/oauth/`)          | ❌ GitHub Pages can't run server code. Deploy the standalone sign-in Worker ([Moving to another host](#moving-to-another-host)), then add a repository variable `CMS_AUTH_BASE_URL` with the Worker's address and set the OAuth App callback to `https://<worker>/oauth/callback` |
| Security headers (`public/_headers`)   | ❌ Ignored (GitHub sets its own defaults)                                                                                                                                                                                                                                         |
| Redirects (`public/_redirects`)        | ❌ Ignored                                                                                                                                                                                                                                                                        |
| Preview deployments for drafts         | ❌ Not available. Use the dashboard's live preview                                                                                                                                                                                                                                |
| Rebuild on every dashboard **Publish** | ✅ Publishing merges into `main`, which triggers the workflow                                                                                                                                                                                                                     |

## Launch checklist

**Accounts and hosting**

- [ ] `main` branch exists and is the default; repository is private
- [ ] Cloudflare Pages project builds `main` successfully
- [ ] `tekktech.com` connected with HTTPS; `www` redirects to the root domain
- [ ] `SITE_URL` removed (or set to `https://tekktech.com`)

**Dashboard**

- [ ] OAuth App created; callback URL is `https://tekktech.com/oauth/callback`
- [ ] `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (secret), `ALLOWED_GITHUB_USERS`, `GITHUB_REPO` set in Cloudflare
- [ ] Step 4 (dashboard end-to-end test) completed, including the unauthorised-account check
- [ ] You are the only collaborator with write access to the repository
- [ ] Optional: preview deployments enabled and protected with Cloudflare Access

**Content**

- [ ] Demonstration articles removed (`npm run demo:remove -- --yes`) or replaced
- [ ] At least three to five real articles published, each passing the [editorial checklist](EDITORIAL-CHECKLIST.md)
- [ ] About page reviewed
- [ ] Privacy, Cookie, Terms, Affiliate disclosure and Contact pages completed: placeholders replaced, reviewed for your jurisdiction, **Needs legal review** switched off
- [ ] Real contact email set up (Cloudflare Email Routing can forward `hello@tekktech.com` for free)

**SEO and integrations**

- [ ] `/robots.txt` and `/sitemap.xml` correct on the live domain
- [ ] Sitemap submitted to Google Search Console and Bing Webmaster Tools
- [ ] Social profiles (if any) added to `socialProfiles` in `src/site.config.ts`
- [ ] Optional: analytics configured, and the privacy policy updated to match
- [ ] Optional: newsletter provider configured, and the privacy policy updated
- [ ] Optional: daily rebuild enabled for scheduled posts
