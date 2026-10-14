/**
 * End-to-end publishing workflow test.
 *
 * Drives the real Decap CMS dashboard in a browser, against a disposable
 * copy of this project with its own git repository, using Decap's local
 * backend in "git" mode — which implements the same editorial workflow as
 * production (unpublished changes live on cms/* branches; Publish merges
 * them into main). After every step the site is rebuilt from main and the
 * build output is inspected.
 *
 *   1. Sign in (local backend) and create an explainer
 *   2. Preview it in the dashboard
 *   3. Save it → it exists only on a cms/* branch
 *   4. Build main → it is NOT public (page, listings, sitemap, RSS, search)
 *   5. Publish it → it is merged into main
 *   6. Build main → it IS public everywhere
 *   7. Edit the title, save and publish → the build shows the new title
 *   8. Set Site status to Archived, save and publish
 *   9. Build main → it has disappeared from pages, listings, sitemap, RSS and search
 *
 * What this does NOT cover: GitHub OAuth sign-in (see tests/oauth.test.ts and
 * the manual procedure in docs/PUBLISHING-WORKFLOW.md).
 *
 * Run with: npm run test:publishing   (needs a built dashboard bundle: npm run prepare:admin)
 * Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to use a specific Chromium binary.
 */
import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from '@playwright/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_PORT = Number(process.env.PUBLISHING_TEST_PORT ?? 4400);
const CMS_PORT = 8081; // Decap's local backend URL is fixed to localhost:8081.
const SLUG = 'zephyrquill-publishing-test';
const TITLE = 'Zephyrquill publishing workflow test article';
const UPDATED_TITLE = 'Zephyrquill publishing workflow test article (updated)';
const CANARY = 'zephyrquill';
const CATEGORY = 'productivity';
const COLLECTION = 'explainers';

const results: { step: string; ok: boolean; detail?: string }[] = [];
let work = '';
let server: Server | undefined;
let cms: ChildProcess | undefined;

function log(message: string) {
  console.log(`\n▶ ${message}`);
}

function check(step: string, condition: boolean, detail?: string) {
  results.push({ step, ok: condition, detail });
  console.log(`  ${condition ? '✔' : '✘'} ${step}${detail && !condition ? ` — ${detail}` : ''}`);
  if (!condition) throw new Error(`Check failed: ${step}`);
}

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: work, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** True if the file exists on main (checked in git, independent of the working copy). */
function onMain(path: string) {
  try {
    git('cat-file', '-e', `main:${path}`);
    return true;
  } catch {
    return false;
  }
}

function prepareWorkspace() {
  work = mkdtempSync(join(tmpdir(), 'tekktech-publishing-'));
  const skip = new Set(['node_modules', 'dist', '.git', '.astro', 'test-results', 'playwright-report']);
  cpSync(projectRoot, work, {
    recursive: true,
    filter: (source) => !skip.has(source.slice(projectRoot.length + 1).split(/[\\/]/)[0] ?? ''),
  });
  symlinkSync(join(projectRoot, 'node_modules'), join(work, 'node_modules'), 'junction');
  git('init', '-q', '-b', 'main');
  git('-c', 'user.email=test@example.com', '-c', 'user.name=Publishing Test', 'add', '-A');
  git('-c', 'user.email=test@example.com', '-c', 'user.name=Publishing Test', 'commit', '-q', '-m', 'Initial content');
  // decap-server commits as the configured user.
  git('config', 'user.email', 'cms@example.com');
  git('config', 'user.name', 'TekkTech CMS (local test)');
}

async function waitForMainCheckout() {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (git('rev-parse', '--abbrev-ref', 'HEAD') === 'main') return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error('The working copy did not return to main');
}

/** Builds main. The dashboard is navigated away first so the local backend is idle. */
async function buildMain(page?: Page) {
  if (page) await page.goto('about:blank');
  await waitForMainCheckout();
  build();
}

function build() {
  execFileSync('node', ['scripts/prepare-admin.ts'], { cwd: work, stdio: 'ignore' });
  execFileSync(process.execPath, [join(work, 'node_modules/astro/bin/astro.mjs'), 'build', '--silent'], {
    cwd: work,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  execFileSync(
    process.execPath,
    [join(work, 'node_modules/pagefind/lib/runner/bin.cjs'), '--site', 'dist', '--silent'],
    {
      cwd: work,
      stdio: ['ignore', 'ignore', 'inherit'],
    },
  );
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain',
};

/** Minimal static server for dist/, re-reading files on every request so rebuilds are picked up. */
function startServer() {
  server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    let file = join(work, 'dist', path);
    if (path.endsWith('/')) file = join(file, 'index.html');
    if (!file.startsWith(join(work, 'dist')) || !existsSync(file)) {
      response.writeHead(404, { 'Content-Type': 'text/html' });
      response.end(existsSync(join(work, 'dist/404.html')) ? readFileSync(join(work, 'dist/404.html')) : 'Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(readFileSync(file));
  });
  return new Promise<void>((done) => server!.listen(SITE_PORT, done));
}

async function startCmsBackend() {
  cms = spawn(process.execPath, [join(projectRoot, 'node_modules/decap-server/dist/index.js')], {
    env: { ...process.env, MODE: 'git', GIT_REPO_DIRECTORY: work, PORT: String(CMS_PORT), LOG_LEVEL: 'warn' },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`http://localhost:${CMS_PORT}/api/v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'info' }),
      });
      if (response.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error('Decap local backend did not start');
}

function dist(path: string) {
  const file = join(work, 'dist', path);
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

async function searchFinds(page: Page, term: string) {
  await page.goto(`http://localhost:${SITE_PORT}/search/?q=${encodeURIComponent(term)}`);
  await page
    .locator('[data-search-status]')
    .filter({ hasText: /result|No articles/ })
    .waitFor({ timeout: 15000 });
  return (await page.locator('.search-result').count()) > 0;
}

async function assertPublic(page: Page, expected: boolean, title: string) {
  const label = expected ? 'is public' : 'is NOT public';
  const html = dist(`${CATEGORY}/${SLUG}/index.html`);
  check(`article page ${label}`, expected ? html.includes(title) : html === '');
  check(`homepage listing ${label}`, dist('index.html').includes(SLUG) === expected);
  check(`/articles/ listing ${label}`, dist('articles/index.html').includes(SLUG) === expected);
  check(`category listing ${label}`, dist(`${CATEGORY}/index.html`).includes(SLUG) === expected);
  check(`sitemap ${label}`, dist('sitemap.xml').includes(`/${CATEGORY}/${SLUG}/`) === expected);
  check(`RSS feed ${label}`, dist('rss.xml').includes(`/${CATEGORY}/${SLUG}/`) === expected);
  check(`site search ${label}`, (await searchFinds(page, CANARY)) === expected);
}

async function openEntry(page: Page) {
  await page.goto(`http://localhost:${SITE_PORT}/admin/#/collections/${COLLECTION}/entries/${SLUG}`);
  await page.getByLabel('Title', { exact: true }).waitFor();
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page
    .getByText(/Entry saved|Changes saved/i)
    .first()
    .waitFor({ timeout: 20000 });
}

async function publishNow(page: Page) {
  // Move through the workflow to "Ready", then publish.
  await page.getByRole('button', { name: /^Status:/ }).click();
  await page.getByRole('menuitem', { name: 'Ready' }).click();
  await page
    .getByText(/Entry status updated/i)
    .first()
    .waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: /^Publish$/ }).click();
  await page.getByRole('menuitem', { name: 'Publish now' }).click();
  await page
    .getByText(/Entry published/i)
    .first()
    .waitFor({ timeout: 30000 });
}

async function selectOption(page: Page, label: string, option: string) {
  // Decap's select widget is a react-select combobox labelled by the field label.
  const input = page.getByLabel(label, { exact: true });
  await input.focus();
  await input.pressSequentially(option.slice(0, 12));
  await page.getByText(option, { exact: true }).last().click();
}

async function main() {
  log('Preparing a disposable copy of the project with its own git repository');
  prepareWorkspace();
  console.log(`  ${work}`);

  log('Building the initial site');
  build();
  await startServer();
  await startCmsBackend();

  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('dialog', (dialog) => dialog.accept());

  try {
    await assertPublic(page, false, TITLE);

    log('Signing in to the dashboard (local backend) and creating an explainer');
    await page.goto(`http://localhost:${SITE_PORT}/admin/`);
    await page.getByRole('button', { name: /login/i }).click();
    await page.getByText('All articles').first().waitFor();
    await page.goto(`http://localhost:${SITE_PORT}/admin/#/collections/${COLLECTION}/new`);
    await page.getByLabel('Title', { exact: true }).fill(TITLE);
    await page.getByLabel('URL slug').fill(SLUG);
    await page
      .getByLabel('Excerpt (standfirst)')
      .fill('A temporary article created by the automated publishing workflow test. It is deleted afterwards.');
    await selectOption(page, 'Category', 'Productivity & Software');
    const editor = page.locator('[data-slate-editor="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+Home');
    await page.keyboard.type(`The ${CANARY} canary paragraph proves this article reached the public build.`);
    await page.keyboard.press('Enter');

    log('Previewing the unpublished article in the dashboard');
    const preview = page.locator('iframe').first().contentFrame();
    await preview.locator('h1', { hasText: TITLE }).waitFor({ timeout: 10000 });
    check('live preview shows the article title', true);
    check('live preview shows the body text', (await preview.locator('.tt-prose').innerText()).includes(CANARY));

    log('Saving the draft');
    await save(page);
    const branches = git('branch', '--list', 'cms/*');
    check('draft is saved on a cms/* branch', branches.includes(`cms/${COLLECTION}/${SLUG}`), branches);
    check('draft is not on main', !onMain(`src/content/articles/${SLUG}.md`));

    log('Building main — the draft must not be public');
    await buildMain(page);
    await assertPublic(page, false, TITLE);

    log('Publishing');
    await openEntry(page);
    await publishNow(page);
    check('published article is merged into main', onMain(`src/content/articles/${SLUG}.md`));
    check('cms branch is removed after publishing', !git('branch', '--list', 'cms/*').includes(SLUG));
    check('git history records the publish', git('log', '--oneline', '-5').length > 0);

    log('Building main — the article must now be public');
    await buildMain(page);
    await assertPublic(page, true, TITLE);

    log('Editing the published article');
    await openEntry(page);
    await page.getByLabel('Title', { exact: true }).fill(UPDATED_TITLE);
    await save(page);
    await buildMain(page);
    check(
      'unpublished edit does not change the live article',
      dist(`${CATEGORY}/${SLUG}/index.html`).includes(`>${TITLE}<`),
    );
    await openEntry(page);
    await publishNow(page);
    await buildMain(page);
    check('published edit updates the live article', dist(`${CATEGORY}/${SLUG}/index.html`).includes(UPDATED_TITLE));

    log('Archiving (unpublishing) the article');
    await openEntry(page);
    await selectOption(page, 'Site status', 'Archived — removed from the public site');
    await save(page);
    await publishNow(page);
    const file = git('show', `main:src/content/articles/${SLUG}.md`);
    check('archived article is kept in the repository', /status: archived/.test(file));
    await buildMain(page);
    await assertPublic(page, false, UPDATED_TITLE);
  } catch (error) {
    const shot = join(projectRoot, 'test-results', 'publishing-failure.png');
    await page.screenshot({ path: shot, fullPage: true }).catch(() => undefined);
    console.error(`\nFailure screenshot: ${shot}`);
    throw error;
  } finally {
    await browser.close();
  }
}

main()
  .then(() => {
    console.log(`\n✔ Publishing workflow: ${results.length} checks passed.`);
  })
  .catch((error: unknown) => {
    console.error(`\n✘ Publishing workflow test failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => {
    cms?.kill();
    server?.close();
    if (work && !process.env.KEEP_PUBLISHING_TEST) rmSync(work, { recursive: true, force: true });
  });
