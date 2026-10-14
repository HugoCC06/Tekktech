/**
 * Optional third-party integrations, configured with PUBLIC_* environment
 * variables (see .env.example). Every integration is off by default and the
 * site works fully without any of them.
 */

const env = import.meta.env;

export const isPreviewBuild = env.TT_DEPLOY_PREVIEW === true;
export const isDevServer = env.DEV;

export type AnalyticsConfig =
  | { provider: 'none' }
  | { provider: 'plausible'; domain: string }
  | { provider: 'cloudflare'; token: string }
  | { provider: 'umami'; scriptUrl: string; websiteId: string };

export function getAnalyticsConfig(): AnalyticsConfig {
  // Never send analytics from local development or preview deployments.
  if (isDevServer || isPreviewBuild) return { provider: 'none' };
  switch (env.PUBLIC_ANALYTICS_PROVIDER) {
    case 'plausible':
      return env.PUBLIC_PLAUSIBLE_DOMAIN ? { provider: 'plausible', domain: env.PUBLIC_PLAUSIBLE_DOMAIN } : { provider: 'none' };
    case 'cloudflare':
      return env.PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN
        ? { provider: 'cloudflare', token: env.PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN }
        : { provider: 'none' };
    case 'umami':
      return env.PUBLIC_UMAMI_SCRIPT_URL?.startsWith('https://') && env.PUBLIC_UMAMI_WEBSITE_ID
        ? { provider: 'umami', scriptUrl: env.PUBLIC_UMAMI_SCRIPT_URL, websiteId: env.PUBLIC_UMAMI_WEBSITE_ID }
        : { provider: 'none' };
    default:
      return { provider: 'none' };
  }
}

export type NewsletterConfig =
  | { provider: 'none' }
  | { provider: 'buttondown' | 'form'; action: string; emailField: string; providerName: string };

export function getNewsletterConfig(): NewsletterConfig {
  switch (env.PUBLIC_NEWSLETTER_PROVIDER) {
    case 'buttondown':
      return env.PUBLIC_BUTTONDOWN_USERNAME
        ? {
            provider: 'buttondown',
            action: `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(env.PUBLIC_BUTTONDOWN_USERNAME)}`,
            emailField: 'email',
            providerName: 'Buttondown',
          }
        : { provider: 'none' };
    case 'form':
      return env.PUBLIC_NEWSLETTER_FORM_ACTION?.startsWith('https://')
        ? {
            provider: 'form',
            action: env.PUBLIC_NEWSLETTER_FORM_ACTION,
            emailField: env.PUBLIC_NEWSLETTER_EMAIL_FIELD || 'email',
            providerName: 'our newsletter provider',
          }
        : { provider: 'none' };
    default:
      return { provider: 'none' };
  }
}

/**
 * Advertising. No ad network is integrated: AdSlot renders nothing in
 * production until PUBLIC_ADS_ENABLED=true AND a provider has been wired into
 * src/components/AdSlot.astro. In development, outlines show placements.
 */
export const adsEnabled = env.PUBLIC_ADS_ENABLED === 'true';
