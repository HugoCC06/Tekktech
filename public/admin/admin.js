/**
 * TekkTech publishing dashboard bootstrap.
 *
 * 1. Loads the generated configuration (cms-config.json, built from
 *    scripts/cms-config.ts).
 * 2. Points the GitHub sign-in at this site's own /oauth/ endpoints, so the
 *    same build works on production and on preview deployments.
 * 3. Registers live previews that mirror the public article layout.
 * 4. Starts Decap CMS.
 */
(function () {
  'use strict';

  var CMS = window.CMS;
  var h = window.h;
  var createClass = window.createClass;
  var loading = document.getElementById('tt-admin-loading');

  function showError(message) {
    if (!loading) return;
    var box = document.createElement('p');
    box.className = 'tt-admin-error';
    box.textContent = message;
    loading.appendChild(box);
  }

  if (!CMS || !h || !createClass) {
    showError('The dashboard could not load. Run "npm run prepare:admin" or rebuild the site.');
    return;
  }

  // Base path of the site, e.g. "/" or "/tekktech/" (the dashboard lives at <base>admin/).
  var basePath = window.location.pathname.replace(/admin\/.*$/, '');

  function optionsFor(config, fieldName) {
    var fields = (config.collections[0] && config.collections[0].fields) || [];
    var field = fields.filter(function (f) {
      return f.name === fieldName;
    })[0];
    var map = {};
    ((field && field.options) || []).forEach(function (option) {
      map[option.value] = option.label;
    });
    return map;
  }

  function registerPreviews(config) {
    var categories = optionsFor(config, 'category');
    var types = {
      review: 'Review',
      comparison: 'Comparison',
      ranking: 'Ranked list',
      explainer: 'Explainer',
      guide: 'Guide',
      opinion: 'Opinion',
    };
    var statusLabels = {
      published: 'Site status: Published (live only after you click Publish)',
      draft: 'Site status: Draft (stays hidden)',
      archived: 'Site status: Archived (removed from the site)',
    };

    var ArticlePreview = createClass({
      render: function () {
        var entry = this.props.entry;
        var get = function (key) {
          return entry.getIn(['data', key]);
        };
        var image = get('image');
        var imageAsset = image ? this.props.getAsset(image) : null;
        var review = get('review');
        var sources = get('sources');
        var status = get('status') || 'published';
        var date = get('publishDate');
        var dateText = date
          ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : '';

        var reviewBox = null;
        if (review && review.get && review.get('productName')) {
          var list = function (key, title, cls) {
            var items = review.get(key);
            if (!items || !items.size) return null;
            return h(
              'div',
              { className: 'tt-review__list ' + cls },
              h('h3', {}, title),
              h(
                'ul',
                {},
                items
                  .map(function (item, i) {
                    return h('li', { key: i }, String(item));
                  })
                  .toArray(),
              ),
            );
          };
          reviewBox = h(
            'aside',
            { className: 'tt-review' },
            h('p', { className: 'tt-review__kicker' }, 'At a glance'),
            h('h2', {}, review.get('productName')),
            review.get('summary') ? h('p', {}, review.get('summary')) : null,
            h(
              'div',
              { className: 'tt-review__lists' },
              list('strengths', 'Strengths', 'pro'),
              list('weaknesses', 'Weaknesses', 'con'),
            ),
            h(
              'p',
              { className: 'tt-review__basis' },
              review.get('handsOn')
                ? 'Hands-on review' +
                    (review.get('score') !== undefined && review.get('score') !== ''
                      ? ' · Score ' + review.get('score') + '/10'
                      : '')
                : 'Research-based review (no score is shown)',
            ),
          );
        }

        var sourceList = null;
        if (sources && sources.size) {
          sourceList = h(
            'section',
            { className: 'tt-sources' },
            h('h2', {}, 'Sources and references'),
            h(
              'ol',
              {},
              sources
                .map(function (source, i) {
                  return h(
                    'li',
                    { key: i },
                    h('a', { href: source.get('url') }, source.get('title') || source.get('url')),
                    source.get('publisher') ? ' — ' + source.get('publisher') : '',
                  );
                })
                .toArray(),
            ),
          );
        }

        return h(
          'article',
          { className: 'tt-preview' },
          h(
            'p',
            { className: 'tt-status tt-status--' + status },
            (statusLabels[status] || status) + (get('demo') ? ' · Demonstration content' : ''),
          ),
          h(
            'p',
            { className: 'tt-eyebrow' },
            (categories[get('category')] || 'No category') + ' / ' + (types[get('type')] || 'Article'),
          ),
          h('h1', {}, get('title') || 'Untitled article'),
          get('excerpt') ? h('p', { className: 'tt-standfirst' }, get('excerpt')) : null,
          h('p', { className: 'tt-byline' }, 'By TekkTech' + (dateText ? ' · ' + dateText : '')),
          imageAsset
            ? h(
                'figure',
                {},
                h('img', { src: imageAsset.toString(), alt: get('imageAlt') || '' }),
                get('imageCaption') || get('imageCredit') || get('imageIsAiGenerated')
                  ? h(
                      'figcaption',
                      {},
                      [
                        get('imageCaption'),
                        get('imageIsAiGenerated') ? 'AI-generated illustration' : null,
                        get('imageCredit'),
                      ]
                        .filter(Boolean)
                        .join(' · '),
                    )
                  : null,
              )
            : null,
          reviewBox,
          h('div', { className: 'tt-prose' }, this.props.widgetFor('body')),
          sourceList,
        );
      },
    });

    var PagePreview = createClass({
      render: function () {
        var entry = this.props.entry;
        return h(
          'article',
          { className: 'tt-preview' },
          h('h1', {}, entry.getIn(['data', 'title']) || 'Untitled page'),
          h('p', { className: 'tt-standfirst' }, entry.getIn(['data', 'description']) || ''),
          h('div', { className: 'tt-prose' }, this.props.widgetFor('body')),
        );
      },
    });

    config.collections.forEach(function (collection) {
      CMS.registerPreviewTemplate(collection.name, collection.name === 'pages' ? PagePreview : ArticlePreview);
    });
    CMS.registerPreviewStyle('preview.css');
  }

  fetch('cms-config.json', { cache: 'no-cache', credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function (config) {
      config.load_config_file = false;
      if (!config.backend.base_url) config.backend.base_url = window.location.origin;
      config.backend.auth_endpoint = (basePath + 'oauth/auth').replace(/^\//, '');
      config.logo_url = basePath + 'brand/tekktech-wordmark.svg';
      registerPreviews(config);
      CMS.init({ config: config });
      if (loading) loading.hidden = true;
    })
    .catch(function (error) {
      showError('The dashboard configuration could not be loaded (' + error.message + ').');
    });
})();
