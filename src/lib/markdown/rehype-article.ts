import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/** Link titles that mark a link as commercial. Written in Markdown as `[text](url "affiliate")`. */
const COMMERCIAL_MARKERS = new Set(['affiliate', 'sponsored']);

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function classList(node: Element): string[] {
  const value = node.properties.className;
  return Array.isArray(value) ? value.map(String) : typeof value === 'string' ? value.split(' ') : [];
}

/**
 * Article-specific HTML refinements, run after sanitisation:
 *
 * 1. Tables are wrapped in a focusable, horizontally scrollable region so
 *    specification tables stay readable on small screens.
 * 2. External links get `rel="noopener"`.
 * 3. Links titled "affiliate" or "sponsored" become clearly-labelled
 *    commercial links with `rel="sponsored nofollow noopener"`, and the
 *    article is flagged so the affiliate disclosure is shown automatically.
 * 4. Root-relative internal links (`/about/`) are prefixed with the
 *    configured base path, so content keeps working under BASE_PATH.
 */
export function rehypeArticle(options: { base?: string } = {}) {
  const base = (options.base ?? '/').replace(/\/+$/, '');
  return (tree: Root, file: { data: { astro?: { frontmatter?: Record<string, unknown> } } }) => {
    let hasCommercialLinks = false;

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'table' && parent && typeof index === 'number') {
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'], role: 'region', tabIndex: 0, ariaLabel: 'Scrollable table' },
          children: [node],
        };
        parent.children[index] = wrapper;
        return 'skip';
      }

      if (node.tagName === 'a' && typeof node.properties.href === 'string') {
        const href = node.properties.href;
        const title = typeof node.properties.title === 'string' ? node.properties.title.trim().toLowerCase() : '';

        if (COMMERCIAL_MARKERS.has(title) && isExternal(href)) {
          hasCommercialLinks = true;
          delete node.properties.title;
          node.properties.rel = ['sponsored', 'nofollow', 'noopener'];
          node.properties.className = [...classList(node), 'commercial-link'];
          node.properties.dataCommercial = title;
          node.children.push({
            type: 'element',
            tagName: 'span',
            properties: { className: ['commercial-link__label'] },
            children: [{ type: 'text', value: title === 'sponsored' ? ' (sponsored link)' : ' (affiliate link)' }],
          });
        } else if (isExternal(href)) {
          node.properties.rel = ['noopener'];
        } else if (base && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(`${base}/`)) {
          node.properties.href = `${base}${href}`;
        }
      }
      return undefined;
    });

    const frontmatter = file.data.astro?.frontmatter;
    if (frontmatter) frontmatter.hasCommercialLinks = hasCommercialLinks;
  };
}
