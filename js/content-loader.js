/**
 * Hydrate [data-wp-*] regions from config/site-content.json
 */
(function () {
    'use strict';

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    /** Local /images/webp/**/*.webp paths only — never esc() URLs into src. */
    function safeImgSrc(u) {
        if (u == null || u === '') return '';
        var s = String(u).trim().replace(/[\r\n\u0000]/g, '').replace(/^\/+/, '');
        if (s.indexOf('..') !== -1) return '';
        if (!/^images\/webp\/[a-z0-9][a-z0-9_.\/-]*\.webp$/i.test(s)) return '';
        return '/' + s;
    }

    function escAttr(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    function fillStats(root, stats) {
        if (!stats) return;
        root.querySelectorAll('[data-wp-stat]').forEach(function (el) {
            var key = el.getAttribute('data-wp-stat');
            if (stats[key] != null) el.textContent = stats[key];
        });
    }

    function fillText(root, sel, val) {
        if (val == null) return;
        root.querySelectorAll(sel).forEach(function (el) {
            el.textContent = val;
        });
    }

    function renderListicle(root, data) {
        var wrap = root.querySelector('[data-wp-listicle]');
        if (!wrap || !data || !data.items) return;
        var title = wrap.querySelector('[data-wp-listicle-title]');
        if (title && data.title) title.textContent = data.title;
        var sub = wrap.querySelector('[data-wp-listicle-sub]');
        if (sub && data.subtitle) sub.textContent = data.subtitle;
        var ol = wrap.querySelector('ol');
        if (!ol) return;
        ol.innerHTML = data.items.map(function (t, i) {
            return (
                '<li class="player-list__item"><span class="player-list__mark">' +
                (i + 1) +
                '</span><span class="player-list__text">' +
                esc(t) +
                '</span></li>'
            );
        }).join('');
    }

    function renderSteps(root, data) {
        var wrap = root.querySelector('[data-wp-steps]');
        if (!wrap || !data || !data.steps) return;
        var title = wrap.querySelector('[data-wp-steps-title]');
        if (title && data.title) title.textContent = data.title;
        var sub = wrap.querySelector('[data-wp-steps-sub]');
        if (sub && data.subtitle) sub.textContent = data.subtitle;
        var track = wrap.querySelector('.steps__track');
        if (!track) return;
        track.innerHTML = data.steps
            .map(function (s, i) {
                var pv = i % 4;
                return (
                    '<div class="step-card step-card--simple">' +
                    '<div class="ph ph--step ph--step-' +
                    pv +
                    '" aria-hidden="true"><span class="ph__tag">Step</span></div>' +
                    '<div class="step-card__n">' +
                    (i + 1) +
                    '</div>' +
                    '<h3 class="step-card__title">' +
                    esc(s.title) +
                    '</h3>' +
                    '<p class="step-card__text">' +
                    esc(s.text) +
                    '</p>' +
                    '</div>'
                );
            })
            .join('');
    }

    function renderInfographic(root, data) {
        var wrap = root.querySelector('[data-wp-infographic]');
        if (!wrap || !data || !data.segments) return;
        var title = wrap.querySelector('[data-wp-infographic-title]');
        if (title && data.title) title.textContent = data.title;
        var bar = wrap.querySelector('.infographic__bar');
        var legend = wrap.querySelector('.infographic__legend');
        if (!bar || !legend) return;
        bar.innerHTML = '';
        legend.innerHTML = '';
        data.segments.forEach(function (seg) {
            var segEl = document.createElement('div');
            segEl.className = 'infographic__segment';
            segEl.style.flex = seg.percent + ' 1 0';
            segEl.style.background = seg.color;
            segEl.title = seg.label + ' ' + seg.percent + '%';
            bar.appendChild(segEl);
            var li = document.createElement('li');
            li.innerHTML =
                '<span class="infographic__swatch" style="background:' +
                esc(seg.color) +
                '"></span><span>' +
                esc(seg.label) +
                '</span><strong>' +
                seg.percent +
                '%</strong>';
            legend.appendChild(li);
        });
    }

    function renderProviders(root, names) {
        var ul = root.querySelector('[data-wp-providers]');
        if (!ul || !names) return;
        ul.innerHTML = names.map(function (n) {
            return '<li><svg class="icon icon--sm" aria-hidden="true"><use href="#icon-star"></use></svg> ' + esc(n) + '</li>';
        }).join('');
    }

    function gameChipHtml(g, i) {
        var v = i % 8;
        var imgSrc = safeImgSrc(g.image);
        var isBannerThumb =
            imgSrc.indexOf('hero-') !== -1 ||
            imgSrc.indexOf('chip-') !== -1 ||
            imgSrc.indexOf('/cards/') !== -1;
        var isIconThumb = imgSrc.indexOf('icon-') !== -1;
        var thumbClass = 'game-chip__thumb';
        if (isBannerThumb) thumbClass += ' game-chip__thumb--banner';
        else if (isIconThumb) thumbClass += ' game-chip__thumb--icon';
        if (g.category === 'slots') thumbClass += ' game-chip__thumb--slots';
        if (g.category === 'live') thumbClass += ' game-chip__thumb--live';
        var alt = g.name ? escAttr(String(g.name)) + ' preview' : 'Game preview';
        var thumb = imgSrc
            ? '<div class="' +
              thumbClass +
              '"><img src="' +
              imgSrc +
              '" alt="' +
              alt +
              '" width="640" height="220" loading="lazy" decoding="async" sizes="(max-width: 559px) 100vw, 25vw" /></div>'
            : '<div class="ph ph--game ph--game-' +
              v +
              '" aria-hidden="true"><span class="ph__tag">Art</span></div>';
        return (
            '<article class="game-chip" data-category="' +
            escAttr(g.category || '') +
            '">' +
            thumb +
            '<div class="game-chip__body">' +
            '<h3 class="game-chip__name">' +
            esc(g.name) +
            '</h3><p class="game-chip__type">' +
            esc(g.type) +
            '</p></div></article>'
        );
    }

    function renderPopular(root, games) {
        if (!games) return;
        root.querySelectorAll('[data-wp-popular]').forEach(function (grid) {
            grid.innerHTML = games.map(function (g, i) {
                return gameChipHtml(g, i);
            }).join('');
        });
    }

    function renderGamesByCategory(root, categories) {
        var mount = root.querySelector('[data-wp-games-by-category]');
        if (!mount || !categories || !categories.length) return;
        mount.innerHTML = categories
            .map(function (cat, ci) {
                var hid = 'gcat-h-' + ci;
                var games = cat.games || [];
                var chips = games
                    .map(function (g, gi) {
                        return gameChipHtml(g, gi);
                    })
                    .join('');
                var sub = cat.subtitle ? '<p class="section-head__sub">' + esc(cat.subtitle) + '</p>' : '';
                return (
                    '<section class="games-cat-block" data-games-cat="' +
                    escAttr(cat.id || '') +
                    '" aria-labelledby="' +
                    escAttr(hid) +
                    '">' +
                    '<header class="section-head section-head--left">' +
                    '<h2 id="' +
                    escAttr(hid) +
                    '" class="section-head__title">' +
                    esc(cat.title) +
                    '</h2>' +
                    sub +
                    '</header>' +
                    '<div class="grid-2 grid-2--games games-cat-block__grid">' +
                    chips +
                    '</div></section>'
                );
            })
            .join('');
    }

    function renderHotPromos(root, items) {
        var mount = root.querySelector('[data-wp-hot-promos]');
        if (!mount || !items || !items.length) return;
        mount.innerHTML =
            '<div class="hot-promo-strip">' +
            items
                .map(function (h) {
                    var badge = h.badge ? '<span class="hot-promo-card__badge">' + esc(h.badge) + '</span>' : '';
                    var meta = h.meta ? '<p class="hot-promo-card__meta">' + esc(h.meta) + '</p>' : '';
                    return (
                        '<article class="hot-promo-card">' +
                        badge +
                        '<h3 class="hot-promo-card__title">' +
                        esc(h.title) +
                        '</h3>' +
                        '<p class="hot-promo-card__teaser">' +
                        esc(h.teaser) +
                        '</p>' +
                        meta +
                        '</article>'
                    );
                })
                .join('') +
            '</div>';
    }

    function renderPromos(root, items) {
        var grid = root.querySelector('[data-wp-promos]');
        if (!grid || !items) return;
        grid.innerHTML = items
            .map(function (p, i) {
                var body = p.desc ? esc(p.desc) : esc(p.text || '');
                var pv = i % 4;
                var pImg = safeImgSrc(p.image);
                var thumb = pImg
                    ? '<div class="promo-card__media"><img src="' +
                      pImg +
                      '" alt="" width="900" height="360" loading="lazy" decoding="async" /></div>'
                    : '<div class="ph ph--promo ph--promo-' +
                      pv +
                      '" aria-hidden="true"><span class="ph__tag">Offer</span></div>';
                return (
                    '<article class="promo-card">' +
                    thumb +
                    '<div class="promo-card__body">' +
                    '<h3>' +
                    esc(p.title) +
                    '</h3>' +
                    '<p>' +
                    body +
                    '</p></div></article>'
                );
            })
            .join('');
    }

    function renderFactsPanel(root, factsFigures, stats) {
        if (!factsFigures) return;
        root.querySelectorAll('[data-wp-facts-panel]').forEach(function (mount) {
            var metrics = factsFigures.metrics || [];
            var metricsHtml = metrics
                .map(function (m) {
                    var val =
                        m.statKey && stats && stats[m.statKey] != null
                            ? stats[m.statKey]
                            : m.value != null
                              ? m.value
                              : '—';
                    return (
                        '<div class="facts-metric">' +
                        '<span class="facts-metric__value">' +
                        esc(String(val)) +
                        '</span>' +
                        '<span class="facts-metric__label">' +
                        esc(m.label) +
                        '</span></div>'
                    );
                })
                .join('');
            var t = factsFigures.trust || {};
            var certList = Array.isArray(t.certifiedBy)
                ? '<ul class="facts-trust__list">' +
                  t.certifiedBy
                      .map(function (c) {
                          return '<li>' + esc(c) + '</li>';
                      })
                      .join('') +
                  '</ul>'
                : '';
            mount.innerHTML =
                '<header class="facts-panel__head">' +
                '<h2 id="facts-figures-heading" class="facts-panel__title">' +
                esc(factsFigures.title || 'Facts & figures') +
                '</h2>' +
                (factsFigures.subtitle
                    ? '<p class="facts-panel__sub">' + esc(factsFigures.subtitle) + '</p>'
                    : '') +
                '</header>' +
                '<div class="facts-metric-grid">' +
                metricsHtml +
                '</div>' +
                '<div class="facts-trust">' +
                '<dl class="facts-trust__dl">' +
                '<dt class="facts-trust__dt">Licensed by</dt><dd class="facts-trust__dd">' +
                esc(t.licensedBy || '') +
                '</dd>' +
                (t.certifiedByHeading
                    ? '<dt class="facts-trust__dt">' +
                      esc(t.certifiedByHeading) +
                      '</dt><dd class="facts-trust__dd">' +
                      certList +
                      '</dd>'
                    : '') +
                (t.paymentsHeading
                    ? '<dt class="facts-trust__dt">' +
                      esc(t.paymentsHeading) +
                      '</dt><dd class="facts-trust__dd">' +
                      esc(t.payments || '') +
                      '</dd>'
                    : '') +
                (t.payoutHeading
                    ? '<dt class="facts-trust__dt">' +
                      esc(t.payoutHeading) +
                      '</dt><dd class="facts-trust__dd">' +
                      esc(t.payoutSpeed || '') +
                      '</dd>'
                    : '') +
                (t.mobileHeading
                    ? '<dt class="facts-trust__dt">' +
                      esc(t.mobileHeading) +
                      '</dt><dd class="facts-trust__dd">' +
                      esc(t.mobile || '') +
                      '</dd>'
                    : '') +
                '</dl></div>';
        });
    }

    function renderThemes(root, themes) {
        var grid = root.querySelector('[data-wp-themes]');
        if (!grid || !themes) return;
        grid.innerHTML = themes
            .map(function (t, i) {
                var tv = i % 6;
                return (
                    '<div class="theme-card">' +
                    '<div class="ph ph--theme ph--theme-' +
                    tv +
                    '" aria-hidden="true"><span class="ph__tag">Theme</span></div>' +
                    '<h3 class="theme-card__label">' +
                    esc(t.label) +
                    '</h3>' +
                    '<p class="theme-card__examples">' +
                    esc(t.examples) +
                    '</p></div>'
                );
            })
            .join('');
    }

    function run(data) {
        var root = document.getElementById('main-content') || document.body;
        fillStats(root, data.stats);
        fillText(root, '[data-wp-top-category]', data.topCategory);
        fillText(root, '[data-wp-jackpot]', data.jackpotGames);
        fillText(root, '[data-wp-megaways]', data.megawaysTitles);
        fillText(root, '[data-wp-bonusbuy]', data.bonusBuyGames);
        fillText(root, '[data-wp-rtp-note]', data.highRTPNote);
        renderListicle(root, data.listicle);
        renderSteps(root, data.steps);
        renderInfographic(root, data.infographic);
        renderProviders(root, data.providers);
        renderPopular(root, data.popularGames);
        renderGamesByCategory(root, data.gamesByCategory);
        renderFactsPanel(root, data.factsFigures, data.stats);
        renderThemes(root, data.themes);
        renderHotPromos(root, data.hotPromotionHighlights);
        renderPromos(root, data.promotionsTeaser);

        document.dispatchEvent(new CustomEvent('wp:content-loaded'));
    }

    function load() {
        fetch('config/site-content.json?v=20260412')
            .then(function (r) {
                return r.json();
            })
            .then(run)
            .catch(function () {
                document.dispatchEvent(new CustomEvent('wp:content-loaded'));
            });
    }

    document.addEventListener('wp:partials-loaded', load);
})();
