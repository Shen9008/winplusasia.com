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
        var track = wrap.querySelector('.steps__track');
        if (!track) return;
        track.innerHTML = data.steps
            .map(function (s, i) {
                var pv = i % 4;
                return (
                    '<div class="step-card step-card--simple" data-animate>' +
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

    function renderPopular(root, games) {
        var grid = root.querySelector('[data-wp-popular]');
        if (!grid || !games) return;
        grid.innerHTML = games
            .map(function (g, i) {
                var v = i % 8;
                var thumb = g.image
                    ? '<div class="game-chip__thumb"><img src="' +
                      esc(g.image) +
                      '" alt="" width="480" height="180" loading="lazy" decoding="async" /></div>'
                    : '<div class="ph ph--game ph--game-' +
                      v +
                      '" aria-hidden="true"><span class="ph__tag">Art</span></div>';
                return (
                    '<article class="game-chip" data-animate>' +
                    thumb +
                    '<div class="game-chip__body">' +
                    '<h3 class="game-chip__name">' +
                    esc(g.name) +
                    '</h3><p class="game-chip__type">' +
                    esc(g.type) +
                    '</p></div></article>'
                );
            })
            .join('');
    }

    function renderPromos(root, items) {
        var grid = root.querySelector('[data-wp-promos]');
        if (!grid || !items) return;
        grid.innerHTML = items
            .map(function (p, i) {
                var body = p.desc ? esc(p.desc) : esc(p.text || '');
                var pv = i % 4;
                var thumb = p.image
                    ? '<div class="promo-card__media"><img src="' +
                      esc(p.image) +
                      '" alt="" width="900" height="360" loading="lazy" decoding="async" /></div>'
                    : '<div class="ph ph--promo ph--promo-' +
                      pv +
                      '" aria-hidden="true"><span class="ph__tag">Offer</span></div>';
                return (
                    '<article class="promo-card" data-animate>' +
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

    function renderThemes(root, themes) {
        var grid = root.querySelector('[data-wp-themes]');
        if (!grid || !themes) return;
        grid.innerHTML = themes
            .map(function (t, i) {
                var tv = i % 6;
                return (
                    '<div class="theme-card" data-animate>' +
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
        renderThemes(root, data.themes);
        renderPromos(root, data.promotionsTeaser);

        document.dispatchEvent(new CustomEvent('wp:content-loaded'));
    }

    function load() {
        fetch('config/site-content.json')
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
