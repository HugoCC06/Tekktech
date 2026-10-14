import { defaultSchema, type Options as SanitizeSchema } from 'rehype-sanitize';

/**
 * Sanitisation schema for article Markdown.
 *
 * Articles are written by the owner through an authenticated CMS, but the
 * body is still sanitised as defence in depth: if an account were ever
 * compromised, injected markup must not be able to run scripts on the site.
 *
 * - Raw HTML embedded in Markdown is removed (it is still an unparsed `raw`
 *   node at this point in Astro's pipeline, and the sanitiser drops it).
 * - `javascript:` and other non-web URL protocols are removed.
 * - Event-handler attributes and <script>, <style>, <iframe> are removed.
 * - Syntax-highlighting output (inline styles on <pre>/<span>) is kept.
 */
export const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  // Keep heading ids readable (no "user-content-" prefix).
  clobberPrefix: '',
  clobber: [],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'title', 'rel'],
    img: [...(defaultSchema.attributes?.img ?? []), 'title', 'loading', 'width', 'height'],
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className', 'style', 'tabIndex', ['dataLanguage']],
    code: [...(defaultSchema.attributes?.code ?? []), 'className', 'style'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className', 'style'],
    th: [...(defaultSchema.attributes?.th ?? []), 'align', 'scope'],
    td: [...(defaultSchema.attributes?.td ?? []), 'align'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
};
