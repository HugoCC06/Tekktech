import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ARTICLE, DEMO_REASON, HAS_DEMO, REVIEW_PATH } from './helpers.ts';

const DEMO_PAGES = [ARTICLE.path, REVIEW_PATH, '/gaming/refresh-rate-response-time-input-lag/'];
const ALL_PAGES = [
  '/',
  ARTICLE.path,
  REVIEW_PATH,
  '/gaming/refresh-rate-response-time-input-lag/',
  '/articles/',
  '/crypto/',
  '/search/',
  '/about/',
  '/privacy/',
  '/this-page-does-not-exist/',
];
const PAGES = HAS_DEMO ? ALL_PAGES : ALL_PAGES.filter((path) => !DEMO_PAGES.includes(path));
const WIDTHS = [375, 430, 768, 1024, 1440];

test.describe('responsive layout', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} overflows by ${overflow}px at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('mobile menu opens, navigates and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Primary"]')).toBeHidden();
    const toggle = page.locator('.mobile-menu__toggle');
    await toggle.click();
    const panel = page.locator('nav[aria-label="Mobile"]');
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Close menu');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await panel.getByRole('link', { name: 'Gaming' }).click();
    await expect(page).toHaveURL(/\/gaming\/$/);
  });

  test('the table of contents collapses on mobile and opens on demand', async ({ page }) => {
    test.skip(!HAS_DEMO, DEMO_REASON);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ARTICLE.path);
    const details = page.locator('[data-toc-details]');
    await expect(details).not.toHaveAttribute('open', '');
    await page.locator('.toc__summary').click();
    await expect(page.locator('[data-toc] a').first()).toBeVisible();
    await page.locator('[data-toc] a').first().click();
    await expect(details).not.toHaveAttribute('open', '');
  });

  test('tap targets in the header are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    for (const selector of ['.search-trigger', '.mobile-menu__toggle']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('accessibility (axe)', () => {
  for (const path of PAGES) {
    test(`no serious or critical violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      if (path === '/search/' && HAS_DEMO) {
        await page.locator('[data-search-input]').fill('wallet');
        await expect(page.locator('.search-result').first()).toBeVisible();
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );
      expect(
        serious.map(
          (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([]);
    });
  }
});
