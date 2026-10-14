/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** True for non-production (preview) builds. Defined in astro.config.mjs. */
  readonly TT_DEPLOY_PREVIEW: boolean;
  /** Git branch reported by the build environment, if any. */
  readonly TT_DEPLOY_BRANCH: string;

  readonly PUBLIC_ANALYTICS_PROVIDER?: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?: string;
  readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;

  readonly PUBLIC_NEWSLETTER_PROVIDER?: string;
  readonly PUBLIC_BUTTONDOWN_USERNAME?: string;
  readonly PUBLIC_NEWSLETTER_FORM_ACTION?: string;
  readonly PUBLIC_NEWSLETTER_EMAIL_FIELD?: string;

  readonly PUBLIC_ADS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
