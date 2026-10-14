/**
 * URL helpers. Always build internal links through `withBase()` so the site
 * keeps working if it is ever served from a sub-directory (BASE_PATH).
 */

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Prefixes an internal, root-relative path with the configured base path. */
export function withBase(path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${normalised}`;
}

/** Absolute URL on the canonical site, e.g. for canonical tags and feeds. */
export function absoluteUrl(path: string, site: URL | string | undefined): string {
  if (/^https?:/.test(path)) return path;
  if (!site) throw new Error('`site` must be configured to build absolute URLs');
  return new URL(withBase(path), site).toString();
}

/** Removes the base path from a pathname, for comparing against nav items. */
export function stripBase(pathname: string): string {
  if (BASE && pathname.startsWith(BASE)) return pathname.slice(BASE.length) || '/';
  return pathname;
}
