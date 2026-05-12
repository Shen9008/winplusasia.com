/**
 * Hydrate [data-wp-*] regions from config/site-content.json
 */
(function () {
    'use strict';

    /**
     * When fetch fails (e.g. file://), JSON is malformed, or keys are missing,
     * hydrate facts + headline stats so [data-wp-facts-panel] is never stuck empty.
     * Keep in sync with config/site-content.json (stats + factsFigures).
     */
    var CONTENT_FALLBACK = {
        stats: {
            totalGames: '2,800+',
            slotTitles: '2,100+',
            liveTables: '320+',
            liveCasinoGames: '320+',
            providers: '60+',
            jackpotTitles: '180+',
            tableGames: '120+',
            fishingGames: '85+',
            sportsMarkets: '40+',
            avgPayoutHours: 'Under 24h',
            bonusOffers: '12+',
            languages: '8+'
        },
        factsFigures: {
            title: 'Catalogue & trust snapshot',
            subtitle:
                'Illustrative catalogue scope for a full WinPlus-style integration. Your licensed operator\u2019s live lobby counts, licence, and payment rails are authoritative.',
            metrics: [
                { label: 'Total games', statKey: 'totalGames' },
                { label: 'Game providers', statKey: 'providers' },
                { label: 'Jackpot & progressive titles', statKey: 'jackpotTitles' },
                { label: 'RNG table games', statKey: 'tableGames' },
                { label: 'Live casino tables', statKey: 'liveCasinoGames' },
                { label: 'Fishing & hunter-style slots', statKey: 'fishingGames' }
            ],
            trust: {
                licensedBy:
                    'Licence is held by the operator where you play — common examples include Curaçao eGaming, Malta Gaming Authority (MGA), or PAGCOR. Always confirm the badge and licence number in the site footer before depositing, and cross-check the regulator\u2019s public register when in doubt.',
                certifiedByHeading: 'Certified & tested by',
                certifiedBy: [
                    'Gaming Laboratories International (GLI)',
                    'eCOGRA',
                    'iTech Labs',
                    'BMM Testlabs',
                    'Technical Systems Testing (TST)'
                ],
                paymentsHeading: 'Payment options',
                payments:
                    'Visa, Mastercard, bank transfer, Skrill, Neteller, other regional e-wallets, and cryptocurrency where permitted — availability and limits vary by country and operator.',
                payoutHeading: 'Withdrawal speed',
                payoutSpeed:
                    'Typical average under 24 hours after account verification (KYC); e-wallets and crypto often settle fastest, bank cards commonly 1\u20135 business days.',
                mobileHeading: 'Mobile compatibility',
                mobile:
                    'Responsive HTML5 lobby — works in Safari on iOS and Chrome on Android; many brands offer optional PWA or shortcut install with no mandatory app store download.'
            }
        }
    };

    function mergeFallback(raw) {
        var d = raw && typeof raw === 'object' ? raw : {};
        var out = Object.assign({}, d);
        out.stats = Object.assign(
            {},
            CONTENT_FALLBACK.stats,
            d.stats && typeof d.stats === 'object' ? d.stats : {}
        );
        if (!d.factsFigures || typeof d.factsFigures !== 'object') {
            out.factsFigures = CONTENT_FALLBACK.factsFigures;
        }
        return out;
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // Paths must be images/webp/.../*.webp only — never esc() URLs into src.
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

    function wrapFactsMetricSvg(paths) {
        return (
            '<svg class="facts-metric__svg" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">' +
            paths +
            '</svg>'
        );
    }

    // Icons keyed by metric statKey (see config/site-content.json factsFigures.metrics)
    var FACTS_METRIC_ICONS = {
        totalGames: wrapFactsMetricSvg(
            '<rect x="3.5" y="3.5" width="6.25" height="6.25" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.65"/>' +
                '<rect x="14.25" y="3.5" width="6.25" height="6.25" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.65"/>' +
                '<rect x="3.5" y="14.25" width="6.25" height="6.25" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.65"/>' +
                '<rect x="14.25" y="14.25" width="6.25" height="6.25" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.65"/>'
        ),
        providers: wrapFactsMetricSvg(
            '<circle cx="8" cy="10" r="2.85" stroke="currentColor" fill="rgba(167,139,250,0.08)" stroke-width="1.6"/>' +
                '<circle cx="16" cy="10" r="2.85" stroke="currentColor" fill="rgba(167,139,250,0.08)" stroke-width="1.6"/>' +
                '<circle cx="12" cy="16.5" r="2.85" stroke="currentColor" fill="rgba(167,139,250,0.08)" stroke-width="1.6"/>' +
                '<path d="M9.9 12.05l2.1 3.3M13.95 14.85l2.15-3.25" stroke="currentColor" fill="none" stroke-width="1.35" stroke-linecap="round"/>'
        ),
        jackpotTitles: wrapFactsMetricSvg(
            '<path d="M12 3.75l1.82 6.57h6.52l-5 3.93 1.93 7-5.27-4.06L6.73 21.25l1.93-7-5-3.93h6.52L12 3.75z" stroke="currentColor" fill="rgba(167,139,250,0.1)" stroke-width="1.45" stroke-linejoin="round"/>'
        ),
        tableGames: wrapFactsMetricSvg(
            '<path d="M5.25 12.85c0-3.5 3-6.75 6.75-6.75S18.75 9.36 18.75 12.85" stroke="currentColor" fill="none" stroke-width="1.65" stroke-linecap="round"/>' +
                '<ellipse cx="12" cy="12.85" rx="6.75" ry="2.65" stroke="currentColor" fill="rgba(167,139,250,0.06)" stroke-width="1.6"/>' +
                '<path d="M8.6 14.95v5.3M15.4 14.95v5.3" stroke="currentColor" fill="none" stroke-width="1.65" stroke-linecap="round"/>'
        ),
        liveCasinoGames: wrapFactsMetricSvg(
            '<circle cx="12" cy="12" r="9" stroke="currentColor" fill="rgba(167,139,250,0.06)" stroke-width="1.5"/>' +
                '<path d="M10.4 9.85l6 2.95-6 2.95v-5.9z" fill="currentColor"/>'
        ),
        liveTables: wrapFactsMetricSvg(
            '<circle cx="12" cy="12" r="9" stroke="currentColor" fill="rgba(167,139,250,0.06)" stroke-width="1.5"/>' +
                '<path d="M10.4 9.85l6 2.95-6 2.95v-5.9z" fill="currentColor"/>'
        ),
        fishingGames: wrapFactsMetricSvg(
            '<path d="M4.6 13.95c2.05-3.35 6.6-5.2 11.05-3.25l3.1-1.75-.05 5.95-3.05-1.8c-.95.42-2 .72-3.05.92" stroke="currentColor" fill="none" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<circle cx="7.1" cy="13.2" r=".95" fill="currentColor"/>'
        ),
        _default: wrapFactsMetricSvg(
            '<path d="M4.85 17.85V11.35M12 17.85V7.95m7.15 9.9V5.95" stroke="currentColor" fill="none" stroke-width="1.85" stroke-linecap="round"/>'
        )
    };

    var TRUST_LIST_CHECK_SVG =
        '<svg class="facts-trust__check-icon" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12.207 4.793a1 1 0 010 1.414l-5.25 5.25a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 111.414-1.414L6.23 9.086l4.793-4.793a1 1 0 011.414 0z"/>' +
        '</svg>';

    function factsMetricIconHtml(statKey) {
        var k = statKey && typeof statKey === 'string' ? statKey : '';
        return FACTS_METRIC_ICONS[k] || FACTS_METRIC_ICONS._default;
    }

    function initFactsPanelMotion(root) {
        var panels = root.querySelectorAll('[data-wp-facts-panel]');
        if (!panels.length) return;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        panels.forEach(function (panel) {
            var cards = panel.querySelectorAll('.facts-metric');
            var trust = panel.querySelector('.facts-trust');
            function revealAll() {
                cards.forEach(function (c) {
                    c.classList.add('facts-metric--visible');
                });
                if (trust) trust.classList.add('facts-trust--visible');
            }
            if (reduce || !('IntersectionObserver' in window)) {
                revealAll();
                return;
            }
            var pending = cards.length;
            var ioCards = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (e) {
                        if (!e.isIntersecting) return;
                        e.target.classList.add('facts-metric--visible');
                        ioCards.unobserve(e.target);
                        pending -= 1;
                        if (pending <= 0 && trust && !trust.classList.contains('facts-trust--visible')) {
                            window.setTimeout(function () {
                                trust.classList.add('facts-trust--visible');
                            }, 120);
                        }
                    });
                },
                { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
            );
            cards.forEach(function (c) {
                ioCards.observe(c);
            });
            if (!trust) return;
            var ioTrust = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (e) {
                        if (!e.isIntersecting) return;
                        e.target.classList.add('facts-trust--visible');
                        ioTrust.unobserve(e.target);
                    });
                },
                { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.08 }
            );
            ioTrust.observe(trust);
        });
    }

    function renderFactsPanel(root, factsFigures, stats) {
        if (!factsFigures) return;
        root.querySelectorAll('[data-wp-facts-panel]').forEach(function (mount) {
            var metrics = factsFigures.metrics || [];
            var metricsHtml = metrics
                .map(function (m, i) {
                    var val =
                        m.statKey && stats && stats[m.statKey] != null
                            ? stats[m.statKey]
                            : m.value != null
                              ? m.value
                              : '—';
                    var sk = m.statKey || '';
                    var di = Math.min(i, 12);
                    return (
                        '<div class="facts-metric" data-stat="' +
                        escAttr(sk) +
                        '" style="--fm-i:' +
                        di +
                        '">' +
                        '<span class="facts-metric__icon-wrap" aria-hidden="true">' +
                        factsMetricIconHtml(sk) +
                        '</span>' +
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
                          return (
                              '<li><span class="facts-trust__check" aria-hidden="true">' +
                              TRUST_LIST_CHECK_SVG +
                              '</span><span>' +
                              esc(c) +
                              '</span></li>'
                          );
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
        var merged = mergeFallback(data);
        var root = document.getElementById('main-content') || document.body;
        fillStats(root, merged.stats);
        fillText(root, '[data-wp-top-category]', merged.topCategory);
        fillText(root, '[data-wp-jackpot]', merged.jackpotGames);
        fillText(root, '[data-wp-megaways]', merged.megawaysTitles);
        fillText(root, '[data-wp-bonusbuy]', merged.bonusBuyGames);
        fillText(root, '[data-wp-rtp-note]', merged.highRTPNote);
        renderListicle(root, merged.listicle);
        renderSteps(root, merged.steps);
        renderInfographic(root, merged.infographic);
        renderProviders(root, merged.providers);
        renderPopular(root, merged.popularGames);
        renderGamesByCategory(root, merged.gamesByCategory);
        renderFactsPanel(root, merged.factsFigures, merged.stats);
        renderThemes(root, merged.themes);
        renderHotPromos(root, merged.hotPromotionHighlights);
        renderPromos(root, merged.promotionsTeaser);

        initFactsPanelMotion(root);

        document.dispatchEvent(new CustomEvent('wp:content-loaded'));
    }

    function load() {
        fetch('/config/site-content.json?v=20260419')
            .then(function (r) {
                if (!r.ok) throw new Error('Config fetch failed');
                return r.json();
            })
            .then(run)
            .catch(function () {
                run(null);
            });
    }

    document.addEventListener('wp:partials-loaded', load);
})();
