/**
 * Builds the Decap CMS configuration from src/site.config.ts and the
 * article templates in content-templates/, so categories, article types and
 * templates are defined once and the dashboard can never drift from the
 * website's content schema (src/content.config.ts).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleTypes, categories, site } from '../src/site.config.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

type Field = Record<string, unknown>;

const SLUG_PATTERN = ['^[a-z0-9]+(?:-[a-z0-9]+)*$', 'Use lowercase letters, numbers and single hyphens only, e.g. best-budget-headphones'];

/** Relative to src/content/articles — the same path is written into frontmatter, which Astro resolves. */
const MEDIA_FOLDER = '../../assets/images/articles';

function template(type: string): string {
  try {
    return readFileSync(resolve(root, 'content-templates', `${type}.md`), 'utf8');
  } catch {
    return '';
  }
}

const today = '{{now}}';

function articleFields(options: { type?: string; requireReview?: boolean }): Field[] {
  const { type, requireReview = false } = options;

  const typeField: Field = type
    ? { label: 'Article type', name: 'type', widget: 'hidden', default: type }
    : {
        label: 'Article type',
        name: 'type',
        widget: 'select',
        options: articleTypes.map((item) => ({ label: item.label, value: item.value })),
        default: 'explainer',
        hint: 'Controls the label shown on the article and whether it appears under Reviews or Guides.',
      };

  const reviewField: Field = {
    label: 'Review details',
    name: 'review',
    widget: 'object',
    required: requireReview,
    collapsed: !requireReview,
    summary: '{{fields.productName}}',
    hint: requireReview
      ? 'Shown in the "At a glance" box at the top of the review.'
      : 'Only for product reviews. Leave empty for other articles.',
    fields: [
      { label: 'Product name', name: 'productName', widget: 'string', required: requireReview },
      { label: 'Product category', name: 'productCategory', widget: 'string', required: false },
      { label: 'Verdict summary', name: 'summary', widget: 'text', required: false, hint: 'One or two sentences.' },
      {
        label: 'Used hands-on?',
        name: 'handsOn',
        widget: 'boolean',
        default: false,
        hint: 'Switch on ONLY if TekkTech genuinely used this product. Off = the review says it is research-based.',
      },
      {
        label: 'Score (out of 10)',
        name: 'score',
        widget: 'number',
        value_type: 'float',
        min: 0,
        max: 10,
        step: 0.5,
        required: false,
        hint: 'Optional. Only shown for hands-on reviews, following /how-we-review/. Leave empty otherwise.',
      },
      { label: 'Strengths', name: 'strengths', widget: 'list', required: false, field: { label: 'Strength', name: 'item', widget: 'string' } },
      { label: 'Weaknesses', name: 'weaknesses', widget: 'list', required: false, field: { label: 'Weakness', name: 'item', widget: 'string' } },
      { label: 'Consider it if…', name: 'bestFor', widget: 'text', required: false },
      { label: 'Look elsewhere if…', name: 'avoidIf', widget: 'text', required: false },
      { label: 'How we assessed it', name: 'methodology', widget: 'text', required: false, hint: 'What you used, for how long, or which sources you relied on.' },
      { label: 'Review date', name: 'reviewDate', widget: 'datetime', required: false, date_format: 'YYYY-MM-DD', time_format: false, format: 'YYYY-MM-DD' },
      {
        label: 'Alternatives',
        name: 'alternatives',
        widget: 'list',
        required: false,
        summary: '{{fields.label}}',
        fields: [
          { label: 'Name', name: 'label', widget: 'string' },
          { label: 'URL', name: 'url', widget: 'string', pattern: ['^https?://', 'Must start with https://'] },
          { label: 'Note', name: 'note', widget: 'string', required: false },
        ],
      },
    ],
  };

  return [
    { label: 'Title', name: 'title', widget: 'string', hint: 'Clear and specific. 5–120 characters.', pattern: ['^.{5,120}$', 'Titles must be 5–120 characters'] },
    {
      label: 'URL slug',
      name: 'slug',
      widget: 'string',
      pattern: SLUG_PATTERN,
      hint: 'Becomes the web address: /category/your-slug/. Must be unique. Do not change it after publishing.',
    },
    {
      label: 'Excerpt (standfirst)',
      name: 'excerpt',
      widget: 'text',
      hint: 'One or two sentences shown under the headline and on article cards. 20–300 characters.',
      pattern: ['^[\\s\\S]{20,300}$', 'The excerpt must be 20–300 characters'],
    },
    {
      label: 'Category',
      name: 'category',
      widget: 'select',
      options: categories.map((category) => ({ label: category.name, value: category.slug })),
      hint: 'Part of the URL — avoid changing it after publishing.',
    },
    typeField,
    {
      label: 'Site status',
      name: 'status',
      widget: 'select',
      default: 'published',
      options: [
        { label: 'Published — goes live when you click Publish', value: 'published' },
        { label: 'Draft — stays hidden even after Publish', value: 'draft' },
        { label: 'Archived — removed from the public site', value: 'archived' },
      ],
      hint: 'Nothing goes live until you click "Publish" (top right). To take an article down, choose Archived, save, then Publish.',
    },
    { label: 'Feature on homepage', name: 'featured', widget: 'boolean', default: false, required: false, hint: 'The newest featured article becomes the homepage lead story.' },
    {
      label: 'Publication date',
      name: 'publishDate',
      widget: 'datetime',
      default: today,
      date_format: 'YYYY-MM-DD',
      time_format: false,
      format: 'YYYY-MM-DD',
      hint: 'Future dates are held back until the first site build on or after that date.',
    },
    {
      label: 'Last updated',
      name: 'updatedDate',
      widget: 'datetime',
      required: false,
      date_format: 'YYYY-MM-DD',
      time_format: false,
      format: 'YYYY-MM-DD',
      hint: 'Set this when you make a meaningful update after publication.',
    },
    { label: 'Tags', name: 'tags', widget: 'list', required: false, hint: 'Comma-separated, lowercase, e.g. displays, buying advice. Topic pages appear for tags used by 2+ articles.' },
    {
      label: 'Featured image',
      name: 'image',
      widget: 'image',
      required: false,
      choose_url: false,
      hint: '16:9, at least 1600×900 px, JPG/PNG/WebP. If empty, a category illustration is used.',
    },
    { label: 'Image alt text', name: 'imageAlt', widget: 'string', required: false, hint: 'Describe the image for people who cannot see it. Required if you add an image.' },
    { label: 'Image caption', name: 'imageCaption', widget: 'string', required: false },
    { label: 'Image credit', name: 'imageCredit', widget: 'string', required: false, hint: 'e.g. "Illustration: TekkTech" or the photographer and licence.' },
    { label: 'Image is AI-generated', name: 'imageIsAiGenerated', widget: 'boolean', default: false, required: false, hint: 'Adds an "AI-generated illustration" label under the image.' },
    {
      label: 'Body',
      name: 'body',
      widget: 'markdown',
      default: type ? template(type) : '',
      hint: 'To mark an affiliate link, add the title "affiliate": [Check price](https://…  "affiliate"). It will be labelled and get rel="sponsored".',
    },
    {
      label: 'Sources and references',
      name: 'sources',
      widget: 'list',
      required: false,
      summary: '{{fields.title}}',
      hint: 'Prefer primary sources: manufacturer documentation, official announcements, standards, research.',
      fields: [
        { label: 'Title', name: 'title', widget: 'string' },
        { label: 'URL', name: 'url', widget: 'string', pattern: ['^https?://', 'Must start with https://'] },
        { label: 'Publisher', name: 'publisher', widget: 'string', required: false },
        { label: 'Note', name: 'note', widget: 'string', required: false },
      ],
    },
    {
      label: 'Related articles',
      name: 'related',
      widget: 'relation',
      collection: 'articles',
      search_fields: ['title', 'slug'],
      value_field: 'slug',
      display_fields: ['title'],
      multiple: true,
      required: false,
      hint: 'Optional. Chosen articles appear first under "Keep reading"; the rest are picked automatically.',
    },
    reviewField,
    {
      label: 'Affiliate links ("Where to buy")',
      name: 'affiliateLinks',
      widget: 'list',
      required: false,
      summary: '{{fields.label}}',
      hint: 'Only add links from affiliate programmes you have actually joined. Adds a disclosure automatically.',
      fields: [
        { label: 'Button label', name: 'label', widget: 'string', hint: 'e.g. "Check price at Retailer"' },
        { label: 'URL', name: 'url', widget: 'string', pattern: ['^https?://', 'Must start with https://'] },
        { label: 'Retailer', name: 'retailer', widget: 'string', required: false },
      ],
    },
    { label: 'Show affiliate disclosure', name: 'affiliateDisclosure', widget: 'boolean', default: false, required: false, hint: 'Shown automatically when affiliate links are present; switch on to force it.' },
    { label: 'Sponsored content', name: 'sponsored', widget: 'boolean', default: false, required: false },
    { label: 'Sponsor name', name: 'sponsorName', widget: 'string', required: false, hint: 'Required for sponsored content.' },
    { label: 'SEO title', name: 'seoTitle', widget: 'string', required: false, pattern: ['^.{0,70}$', 'Keep SEO titles to 70 characters or fewer'], hint: 'Optional. Defaults to the title.' },
    { label: 'SEO description', name: 'seoDescription', widget: 'text', required: false, pattern: ['^[\\s\\S]{0,170}$', 'Keep SEO descriptions to 170 characters or fewer'], hint: 'Optional. Defaults to the excerpt. Aim for 120–160 characters.' },
    { label: 'Canonical URL', name: 'canonicalUrl', widget: 'string', required: false, pattern: ['^(https?://.*)?$', 'Must be a full URL starting with https://'], hint: 'Only if this article was first published elsewhere.' },
    { label: 'Social sharing image', name: 'socialImage', widget: 'image', required: false, choose_url: false, hint: 'Optional. Defaults to the featured image (cropped to 1200×630).' },
    { label: 'Demonstration content', name: 'demo', widget: 'boolean', default: false, required: false, hint: 'Marks placeholder articles. Demo articles show a warning banner and are hidden from search engines.' },
  ];
}

const commonArticleCollection = {
  folder: 'src/content/articles',
  extension: 'md',
  format: 'frontmatter',
  create: true,
  delete: true,
  slug: '{{fields.slug}}',
  identifier_field: 'slug',
  media_folder: MEDIA_FOLDER,
  public_folder: MEDIA_FOLDER,
  preview_path: '{{fields.category}}/{{fields.slug}}/',
  summary: '{{title}} — {{status}} · {{publishDate | date("D MMM YYYY")}}',
  sortable_fields: ['publishDate', 'title', 'status', 'category'],
  view_filters: [
    { label: 'Published', field: 'status', pattern: 'published' },
    { label: 'Drafts', field: 'status', pattern: 'draft' },
    { label: 'Archived', field: 'status', pattern: 'archived' },
    { label: 'Demonstration content', field: 'demo', pattern: true },
  ],
  view_groups: [
    { label: 'Category', field: 'category' },
    { label: 'Status', field: 'status' },
  ],
};

export function buildCmsConfig() {
  const typedCollections = articleTypes.map((type) => ({
    ...commonArticleCollection,
    name: type.value === 'opinion' ? 'opinion' : `${type.value}s`,
    label: type.plural,
    label_singular: type.label,
    description: `${type.plural}. New entries start from the ${type.label.toLowerCase()} template.`,
    filter: { field: 'type', value: type.value },
    fields: articleFields({ type: type.value, requireReview: type.value === 'review' }),
  }));

  return {
    backend: {
      name: 'github',
      repo: site.repository,
      branch: site.productionBranch,
      // By default base_url is set at runtime to the dashboard's own origin
      // (public/admin/admin.js), so sign-in works on production and on preview
      // deployments. Set CMS_AUTH_BASE_URL only when using the standalone Worker.
      ...(process.env.CMS_AUTH_BASE_URL ? { base_url: process.env.CMS_AUTH_BASE_URL.replace(/\/+$/, '') } : {}),
      auth_endpoint: 'oauth/auth',
      squash_merges: true,
      cms_label_prefix: 'tekktech-cms/',
      commit_messages: {
        create: 'Create {{collection}} "{{slug}}"',
        update: 'Update {{collection}} "{{slug}}"',
        delete: 'Delete {{collection}} "{{slug}}"',
        uploadMedia: 'Upload "{{path}}"',
        deleteMedia: 'Delete "{{path}}"',
      },
    },
    // Only used when the dashboard runs on localhost with `npm run cms`.
    local_backend: true,
    publish_mode: 'editorial_workflow',
    site_url: site.defaultUrl,
    display_url: site.defaultUrl,
    logo_url: '/brand/tekktech-wordmark.svg',
    locale: 'en',
    show_preview_links: false,
    media_folder: 'src/assets/images/articles',
    public_folder: MEDIA_FOLDER,
    slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },
    collections: [
      {
        ...commonArticleCollection,
        name: 'articles',
        label: 'All articles',
        label_singular: 'Article',
        description: 'Every article, with its status. To start from a template, use a specific type below.',
        fields: articleFields({}),
      },
      ...typedCollections,
      {
        name: 'pages',
        label: 'Site pages',
        label_singular: 'Page',
        description: 'About, editorial policy and legal pages. The file name becomes the URL (e.g. about → /about/).',
        folder: 'src/content/pages',
        extension: 'md',
        format: 'frontmatter',
        create: true,
        delete: false,
        slug: '{{slug}}',
        media_folder: MEDIA_FOLDER,
        public_folder: MEDIA_FOLDER,
        fields: [
          { label: 'Title', name: 'title', widget: 'string' },
          { label: 'Description', name: 'description', widget: 'text', hint: 'Used in search results and social previews. 20–170 characters.' },
          { label: 'Last updated', name: 'updatedDate', widget: 'datetime', required: false, date_format: 'YYYY-MM-DD', time_format: false, format: 'YYYY-MM-DD' },
          { label: 'Needs legal review', name: 'requiresReview', widget: 'boolean', default: false, required: false, hint: 'Shows a "draft template" warning on the page. Switch off once reviewed.' },
          { label: 'Hide from search engines', name: 'noindex', widget: 'boolean', default: false, required: false },
          { label: 'Body', name: 'body', widget: 'markdown' },
        ],
      },
    ],
  };
}
