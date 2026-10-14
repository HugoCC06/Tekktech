/**
 * TekkTech central configuration.
 *
 * This file is the single source of truth for publication-wide settings.
 * It is imported by the website, and by the scripts that generate the CMS
 * configuration, so keep it free of imports and environment access.
 *
 * Environment-specific values (site URL, analytics IDs, newsletter IDs) are
 * read from environment variables in `astro.config.mjs` and
 * `src/lib/integrations.ts`. See `.env.example`.
 */

export const site = {
  name: 'TekkTech',
  /** Used in the <title> of the homepage and as the default social title. */
  tagline: 'Independent technology reviews, comparisons and explainers',
  description:
    'TekkTech is an independent technology publication covering consumer tech, gaming hardware, crypto and blockchain, and productivity software — with honest reviews, fair comparisons and clear explanations.',
  /**
   * Canonical production URL. Override with the SITE_URL environment
   * variable (for example while the site only lives on a *.pages.dev URL).
   */
  defaultUrl: 'https://tekktech.com',
  locale: 'en-GB',
  lang: 'en',
  /** Production Git branch. Builds from any other branch are marked noindex. */
  productionBranch: 'main',
  /** GitHub repository that stores content, used by the CMS. */
  repository: 'hugocc06/tekktech',
} as const;

/**
 * The public author identity. Every article is attributed to this name,
 * regardless of what an editor types. Never put a personal name here.
 */
export const author = {
  name: 'TekkTech',
  url: '/about/',
} as const;

export interface CategoryDefinition {
  /** URL segment, e.g. /gaming/. Never change after launch. */
  slug: string;
  /** Full display name. */
  name: string;
  /** Short label for navigation. */
  shortName: string;
  /** One-line summary used on cards and in metadata. */
  summary: string;
  /** Introduction paragraph shown at the top of the category page. */
  intro: string;
}

export const categories = [
  {
    slug: 'consumer-tech',
    name: 'Consumer Tech',
    shortName: 'Consumer Tech',
    summary: 'Phones, laptops, wearables, audio and the gadgets worth your money.',
    intro:
      'Practical coverage of the devices people actually use every day: phones, laptops, tablets, wearables, audio and smart-home kit. We focus on what a product does well, where it falls short, and whether it is worth the price.',
  },
  {
    slug: 'gaming',
    name: 'Gaming Tech',
    shortName: 'Gaming',
    summary: 'Consoles, PC hardware, peripherals and the technology behind play.',
    intro:
      'Hardware-first gaming coverage: consoles, graphics cards, monitors, controllers, keyboards, mice and headsets. We explain the specifications that matter, ignore the ones that do not, and help you spend sensibly.',
  },
  {
    slug: 'crypto',
    name: 'Crypto & Blockchain',
    shortName: 'Crypto',
    summary: 'How blockchains, wallets and digital assets actually work.',
    intro:
      'Clear, sceptical explanations of blockchain networks, wallets, security practices and the technology behind digital assets. We cover how things work and the risks involved. We do not give investment advice or make price predictions.',
  },
  {
    slug: 'productivity',
    name: 'Productivity & Software',
    shortName: 'Productivity',
    summary: 'Apps, services and digital tools that help you get work done.',
    intro:
      'Reviews and guides for the software that runs your working life: note-taking, task management, collaboration, security and privacy tools. We look at usability, pricing, data handling and long-term value.',
  },
] as const satisfies readonly CategoryDefinition[];

export type CategorySlug = (typeof categories)[number]['slug'];

export interface ArticleTypeDefinition {
  value: string;
  label: string;
  /** Plural label used in the CMS sidebar. */
  plural: string;
  /** Which hub page lists this type, if any. */
  hub: 'reviews' | 'guides' | null;
}

export const articleTypes = [
  { value: 'review', label: 'Review', plural: 'Reviews', hub: 'reviews' },
  { value: 'comparison', label: 'Comparison', plural: 'Comparisons', hub: 'reviews' },
  { value: 'ranking', label: 'Ranked list', plural: 'Ranked lists', hub: 'reviews' },
  { value: 'explainer', label: 'Explainer', plural: 'Explainers', hub: 'guides' },
  { value: 'guide', label: 'Guide', plural: 'Guides', hub: 'guides' },
  { value: 'opinion', label: 'Opinion', plural: 'Opinion & analysis', hub: null },
] as const satisfies readonly ArticleTypeDefinition[];

export type ArticleTypeValue = (typeof articleTypes)[number]['value'];

export const hubs = {
  reviews: {
    path: '/reviews/',
    title: 'Reviews & Buying Advice',
    navLabel: 'Reviews',
    description:
      'Product reviews, head-to-head comparisons and ranked buying guides across consumer tech, gaming, crypto hardware and software.',
  },
  guides: {
    path: '/guides/',
    title: 'Guides & Explainers',
    navLabel: 'Guides',
    description:
      'Plain-English explainers and practical guides that help you understand technology and make better decisions.',
  },
} as const;

/** Primary navigation, in display order. */
export const navigation = [
  { label: 'Reviews', href: '/reviews/' },
  { label: 'Consumer Tech', href: '/consumer-tech/' },
  { label: 'Gaming', href: '/gaming/' },
  { label: 'Crypto', href: '/crypto/' },
  { label: 'Productivity', href: '/productivity/' },
  { label: 'Guides', href: '/guides/' },
] as const;

export const footerNavigation = {
  sections: [
    {
      title: 'Coverage',
      links: [
        { label: 'All articles', href: '/articles/' },
        { label: 'Reviews', href: '/reviews/' },
        { label: 'Guides', href: '/guides/' },
        { label: 'Consumer Tech', href: '/consumer-tech/' },
        { label: 'Gaming', href: '/gaming/' },
        { label: 'Crypto & Blockchain', href: '/crypto/' },
        { label: 'Productivity & Software', href: '/productivity/' },
      ],
    },
    {
      title: 'TekkTech',
      links: [
        { label: 'About', href: '/about/' },
        { label: 'Editorial policy', href: '/editorial-policy/' },
        { label: 'How we review', href: '/how-we-review/' },
        { label: 'Contact', href: '/contact/' },
        { label: 'RSS feed', href: '/rss.xml' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy policy', href: '/privacy/' },
        { label: 'Cookie policy', href: '/cookies/' },
        { label: 'Terms of use', href: '/terms/' },
        { label: 'Affiliate disclosure', href: '/affiliate-disclosure/' },
      ],
    },
  ],
} as const;

/**
 * Public social profiles. Leave the array empty until real profiles exist —
 * empty entries are not rendered and are not added to structured data.
 */
export const socialProfiles: readonly { label: string; url: string }[] = [];

/** Listing page sizes. */
export const pagination = {
  pageSize: 12,
} as const;
