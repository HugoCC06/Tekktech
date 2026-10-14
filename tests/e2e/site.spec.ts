import { expect, test } from '@playwright/test';
import { ARTICLE, DEMO_REASON, HAS_DEMO, HIDDEN_MARKERS, REVIEW_PATH, crawl } from './helpers.ts';

test.describe('homepage and navigation', () => {
  test('homepage renders the masthead, lead story and sections', async ({ page }) => {
    test.skip(!HAS_DEMO, DEMO_REASON);
    await page.goto('/');
    await expect(page).toHaveTitle(/^TekkTech — /);
    await expect(page.locator('h1')).toContainText('Honest reviews');
    await expect(page.locator('.featured h2 a')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Explore by category' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reviews & buying advice' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guides & explainers' })).toBeVisible();
  });

  test('no article appears twice on the homepage', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('main article h2 a, main article h3 a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test('the lead story links to its article', async ({ page }) => {
    test.skip(!HAS_DEMO, DEMO_REASON);
    await page.goto('/');
    const link = page.locator('.featured h2 a');
    const title = (await link.textContent())!.trim();
    await link.click();
    await expect(page.locator('h1')).toHaveText(title);
  });

  test('primary navigation links all work and mark the current section', async ({ page }) => {
    await page.goto('/');
    const links = await page
      .locator('nav[aria-label="Primary"] a')
      .evaluateAll((items) =>
        items.map((item) => ({ href: item.getAttribute('href')!, text: item.textContent!.trim() })),
      );
    expect(links.length).toBeGreaterThanOrEqual(6);
    for (const link of links) {
      const response = await page.goto(link.href);
      expect(response?.status(), link.href).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator(`nav[aria-label="Primary"] a[href="${link.href}"]`)).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
  });

  test('the wordmark links home', async ({ page }) => {
    await page.goto(ARTICLE.path);
    await page.getByRole('link', { name: 'TekkTech home' }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('every internal link resolves, and no hidden article is linked anywhere', async ({ request }) => {
    const { statuses, bodies } = await crawl(request);
    const broken = [...statuses].filter(([, status]) => status !== 200);
    expect(broken).toEqual([]);
    expect(statuses.size).toBeGreaterThan(HAS_DEMO ? 30 : 15);
    for (const [path, html] of bodies) {
      for (const marker of HIDDEN_MARKERS) expect(html, `${path} contains ${marker}`).not.toContain(marker);
    }
  });
});

test.describe('listings', () => {
  test.skip(!HAS_DEMO, DEMO_REASON);
  test('article cards link to the matching article', async ({ page }) => {
    await page.goto('/articles/');
    const cards = page.locator('main .card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(10);
    for (let index = 0; index < count; index += 3) {
      await page.goto('/articles/');
      const link = page.locator('main .card').nth(index).locator('.card__title a');
      const title = (await link.textContent())!.trim();
      await link.click();
      await expect(page.locator('h1')).toHaveText(title);
    }
  });

  test('articles are listed newest first', async ({ page }) => {
    await page.goto('/articles/');
    const dates = await page
      .locator('main .card time')
      .evaluateAll((items) => items.map((item) => item.getAttribute('datetime')!));
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  for (const category of [
    { slug: 'consumer-tech', label: 'Consumer Tech' },
    { slug: 'gaming', label: 'Gaming' },
    { slug: 'crypto', label: 'Crypto' },
    { slug: 'productivity', label: 'Productivity' },
  ]) {
    test(`the ${category.slug} page only lists its own articles`, async ({ page }) => {
      await page.goto(`/${category.slug}/`);
      const cards = page.locator('main .card');
      expect(await cards.count()).toBeGreaterThan(0);
      for (const label of await cards.locator('.card__eyebrow a').allTextContents()) expect(label).toBe(category.label);
      for (const href of await cards
        .locator('.card__title a')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
        expect(href).toMatch(new RegExp(`^/${category.slug}/`));
      }
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/${category.slug}/$`));
    });
  }

  test('the reviews hub lists reviews, comparisons and ranked lists only', async ({ page }) => {
    await page.goto('/reviews/');
    const types = await page.locator('main .card .eyebrow__muted').allTextContents();
    expect(types.length).toBeGreaterThan(0);
    for (const type of types) expect(['Review', 'Comparison', 'Ranked list']).toContain(type);
  });
});

test.describe('article page', () => {
  test.skip(!HAS_DEMO, DEMO_REASON);
  test('renders metadata, byline and content', async ({ page }) => {
    await page.goto(ARTICLE.path);
    await expect(page.locator('h1')).toHaveText(ARTICLE.title);
    await expect(page.locator('.article__byline')).toContainText('By TekkTech');
    await expect(page.locator('.article__byline time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    await expect(page.locator('.article__byline')).toContainText(/\d+ min read/);
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText('Consumer Tech');
    await expect(page.locator('.article__body h2').first()).toBeVisible();
    await expect(page.locator('.sources li')).toHaveCount(3);
  });

  test('has correct SEO metadata and structured data', async ({ page }) => {
    await page.goto(ARTICLE.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://tekktech.com${ARTICLE.path}`);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https:\/\/tekktech\.com\/_astro\/.+\.jpg$/,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)['@graph'];
    const types = graph.map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'Article', 'BreadcrumbList']));
    const article = graph.find((node: { '@type': string }) => node['@type'] === 'Article');
    expect(article.author).toMatchObject({ '@type': 'Organization', name: 'TekkTech' });
    expect(types).not.toContain('AggregateRating');
  });

  test('demo articles are marked noindex and show the demonstration notice', async ({ page }) => {
    await page.goto(ARTICLE.path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('[data-demo-notice]')).toBeVisible();
  });

  test('ordinary pages are indexable', async ({ page }) => {
    for (const path of ['/', '/gaming/', '/about/']) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/);
    }
  });

  test('the table of contents links to headings', async ({ page }) => {
    await page.goto(ARTICLE.path);
    const links = page.locator('[data-toc] a');
    expect(await links.count()).toBeGreaterThanOrEqual(4);
    const target = (await links.nth(2).getAttribute('href'))!;
    await expect(page.locator(target)).toHaveCount(1);
    await links.nth(2).click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target)).toBeInViewport();
  });

  test('related articles link to published articles', async ({ page }) => {
    await page.goto(ARTICLE.path);
    const links = page.locator('.related .card__title a');
    expect(await links.count()).toBeGreaterThan(0);
    for (const href of await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')!))) {
      expect((await page.request.get(href)).status()).toBe(200);
    }
  });

  test('share links use the canonical URL', async ({ page }) => {
    await page.goto(ARTICLE.path);
    const encoded = encodeURIComponent(`https://tekktech.com${ARTICLE.path}`);
    const hrefs = await page
      .locator('.article__footer-share .share__list a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
    expect(hrefs).toHaveLength(5);
    for (const href of hrefs) expect(href).toContain(encoded);
  });

  test('copy link copies the article URL and confirms', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(ARTICLE.path);
    const button = page.locator('.article__footer-share [data-share-copy]');
    await button.click();
    await expect(button).toContainText('Link copied');
    await expect(page.locator('.article__footer-share [data-share-status]')).toHaveText('Link copied to clipboard');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`https://tekktech.com${ARTICLE.path}`);
  });

  test('research-based reviews show no score and say they were not tested', async ({ page }) => {
    await page.goto(REVIEW_PATH);
    const summary = page.locator('.review-summary');
    await expect(summary).toContainText('not hands-on testing');
    await expect(summary.locator('.review-summary__score')).toHaveCount(0);
    const graph = await page.locator('script[type="application/ld+json"]').textContent();
    expect(graph).not.toContain('"Review"');
  });

  test('specification tables are wrapped in a keyboard-focusable scroll region', async ({ page }) => {
    await page.goto('/gaming/refresh-rate-response-time-input-lag/');
    const region = page.locator('.table-scroll').first();
    await expect(region).toHaveAttribute('role', 'region');
    await expect(region).toHaveAttribute('tabindex', '0');
  });

  test('images have alt attributes and load, including the category fallback', async ({ page }) => {
    await page.goto('/productivity/choosing-digital-productivity-tools/');
    const hero = page.locator('.article__image img');
    await expect(hero).toHaveAttribute('src', /productivity/);
    await page.goto('/articles/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const images = page.locator('main img');
    for (let index = 0; index < (await images.count()); index++) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      expect(await image.getAttribute('alt')).not.toBeNull();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    }
  });
});

test.describe('search', () => {
  test.skip(!HAS_DEMO, DEMO_REASON);
  test('finds published articles', async ({ page }) => {
    await page.goto('/search/?q=passkeys');
    await expect(page.locator('[data-search-status]')).toContainText('for “passkeys”');
    const result = page.locator('.search-result', { has: page.locator(`a[href="${ARTICLE.path}"]`) });
    await expect(result).toBeVisible();
    await expect(result.locator('.search-result__meta')).toHaveText(/^Consumer Tech · Explainer · \d{1,2} \w+ \d{4}$/);
  });

  test('typing updates results and the URL', async ({ page }) => {
    await page.goto('/search/');
    await page.locator('[data-search-input]').fill('blockchain');
    await expect(page.locator('.search-result').first()).toBeVisible();
    await expect(page).toHaveURL(/\?q=blockchain/);
  });

  test('never returns drafts or archived articles', async ({ page }) => {
    for (const term of ['DRAFT-CANARY-7f3a', 'ARCHIVED-CANARY-2c9e', 'must never appear']) {
      await page.goto(`/search/?q=${encodeURIComponent(term)}`);
      await expect(page.locator('[data-search-status]')).toContainText(/No articles match|result/);
      for (const href of await page
        .locator('.search-result a')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
        expect(href).not.toMatch(/example-unpublished-draft|example-archived-article/);
      }
    }
  });

  test('shows a helpful message when nothing matches', async ({ page }) => {
    await page.goto('/search/?q=qwxzvbnm');
    await expect(page.locator('[data-search-status]')).toContainText('No articles match “qwxzvbnm”');
  });

  test('pressing "/" focuses search', async ({ page }) => {
    await page.goto('/search/');
    await page.locator('body').click();
    await page.keyboard.press('/');
    await expect(page.locator('[data-search-input]')).toBeFocused();
  });
});

test.describe('crawlability', () => {
  test('hidden articles return 404', async ({ request }) => {
    for (const path of ['/consumer-tech/example-unpublished-draft/', '/gaming/example-archived-article/']) {
      expect((await request.get(path)).status()).toBe(404);
    }
  });

  test('the sitemap lists real pages, excludes demo content and every entry resolves', async ({ request }) => {
    test.skip(!HAS_DEMO, DEMO_REASON);
    const xml = await (await request.get('/sitemap.xml')).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls.length).toBeGreaterThan(15);
    for (const marker of HIDDEN_MARKERS) expect(xml).not.toContain(marker);
    expect(xml).not.toContain('/admin/');
    expect(xml).not.toContain('/search/');
    expect(xml).not.toContain(ARTICLE.path); // demo article: noindex, so not in the sitemap
    for (const url of urls) {
      expect(url.startsWith('https://tekktech.com/')).toBe(true);
      expect((await request.get(new URL(url).pathname)).status(), url).toBe(200);
    }
  });

  test('robots.txt allows crawling, blocks admin and points to the sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Sitemap: https://tekktech.com/sitemap.xml');
  });

  test('the RSS feed is valid XML and excludes hidden and demo articles', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml).toContain('<rss');
    for (const marker of HIDDEN_MARKERS) expect(xml).not.toContain(marker);
  });

  test('unknown pages show the 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist/');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText("We couldn't find that page");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('the dashboard is not indexable', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
});

test.describe('keyboard and no-JavaScript', () => {
  test('the first Tab reaches the skip link, which moves focus to the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('interactive elements show a visible focus indicator', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
    expect(outline).not.toBe('none');
  });
});

test.describe('without JavaScript', () => {
  test.skip(!HAS_DEMO, DEMO_REASON);
  test.use({ javaScriptEnabled: false });

  test('articles, navigation and listings work', async ({ page }) => {
    await page.goto(ARTICLE.path);
    await expect(page.locator('h1')).toHaveText(ARTICLE.title);
    await expect(page.locator('.article__body p').first()).toBeVisible();
    await expect(page.locator('[data-toc] a').first()).toBeAttached();
    await page.goto('/articles/');
    expect(await page.locator('main .card').count()).toBeGreaterThan(5);
  });

  test('share links still work; JavaScript-only buttons stay hidden', async ({ page }) => {
    await page.goto(ARTICLE.path);
    await expect(page.locator('.article__footer-share a[aria-label="Share on LinkedIn"]')).toBeVisible();
    await expect(page.locator('.article__footer-share [data-share-copy]')).toBeHidden();
  });

  test('the search page explains how to browse instead', async ({ page }) => {
    await page.goto('/search/');
    await expect(page.locator('noscript')).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Browse by category' })).toBeVisible();
  });
});
