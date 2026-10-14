import { site } from '../site.config.ts';

const dateFormatter = new Intl.DateTimeFormat(site.locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortDateFormatter = new Intl.DateTimeFormat(site.locale, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}

/** ISO date (YYYY-MM-DD) for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isSameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}
