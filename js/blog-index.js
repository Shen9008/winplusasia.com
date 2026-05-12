/**
 * Blog listing: assets/data/blogs.json; pagination (6 posts/page); grid up to 3 columns.
 */
(function () {
    'use strict';

    var PAGE_SIZE = 6;

    function timeMs(iso) {
        if (iso == null || iso === '') return -Infinity;
        var t = new Date(iso).getTime();
        return isFinite(t) ? t : -Infinity;
    }

    function sortPosts(a, b) {
        var ds = timeMs(b.synced_at) - timeMs(a.synced_at);
        if (ds !== 0) return ds;
        var dp = timeMs(b.published_date) - timeMs(a.published_date);
        if (dp !== 0) return dp;
        return String(b.slug).localeCompare(String(a.slug));
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    var DEF_BLOG_IMG = '/images/webp/blog-default.webp';

    function escapeAttr(s) {
        return escapeHtml(s).replace(/\r?\n|\r/g, ' ');
    }

    function safeBlogImageSrc(raw) {
        var t = String(raw == null ? '' : raw).trim();
        if (!t) return DEF_BLOG_IMG;
        if (/^javascript:/i.test(t)) return DEF_BLOG_IMG;
        if (/\s/.test(t)) return DEF_BLOG_IMG;
        if (/^https?:\/\//i.test(t)) return t;
        if (t.indexOf('//') === 0) return 'https:' + t;
        if (t.charAt(0) === '/') {
            if (t.indexOf('<') !== -1) return DEF_BLOG_IMG;
            return t.length <= 2000 ? t : DEF_BLOG_IMG;
        }
        return DEF_BLOG_IMG;
    }

    function parsePageFromLocation() {
        try {
            var n = parseInt(new URL(window.location.href).searchParams.get('page') || '1', 10);
            return isFinite(n) && n >= 1 ? n : 1;
        } catch (e) {
            return 1;
        }
    }

    /** @param {number} page 1-based */
    function syncUrl(page, replace) {
        try {
            var url = new URL(window.location.href);
            if (page <= 1) url.searchParams.delete('page');
            else url.searchParams.set('page', String(page));
            var qs = url.searchParams.toString();
            var next = url.pathname + (qs ? '?' + qs : '') + url.hash;
            if (replace) window.history.replaceState({ blogPage: page }, '', next);
            else window.history.pushState({ blogPage: page }, '', next);
        } catch (e2) {
            /* ignore */
        }
    }

    function scrollToBlogGrid() {
        var wrap = document.querySelector('.blog-posts-wrap');
        if (wrap && wrap.scrollIntoView) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * @param {number} current
     * @param {number} total
     * @returns {(number|'gap')[]}
     */
    function pagerItems(current, total) {
        if (total <= 7) {
            var all = [];
            for (var i = 1; i <= total; i++) all.push(i);
            return all;
        }
        var cand = [1, current - 1, current, current + 1, total];
        var seen = {};
        var nums = [];
        var ci = 0;
        while (ci < cand.length) {
            var n = cand[ci];
            if (typeof n === 'number' && n >= 1 && n <= total && !seen[n]) {
                seen[n] = true;
                nums.push(n);
            }
            ci++;
        }
        nums.sort(function (a, b) {
            return a - b;
        });
        /** @type {(number|'gap')[]} */
        var out = [];
        var prev = 0;
        var ni = 0;
        while (ni < nums.length) {
            var p = nums[ni];
            if (prev && p - prev > 1) out.push('gap');
            out.push(p);
            prev = p;
            ni++;
        }
        return out;
    }

    function cardHtml(b) {
        var excerpt = escapeHtml(b.excerpt || '');
        var titlePlain = b.title || '';
        var title = escapeHtml(titlePlain);
        var slug = String(b.slug || '').trim();
        if (!/^[a-z0-9][a-z0-9_-]*$/i.test(slug)) return '';
        var date = escapeHtml(b.published_date || '');
        var cat = escapeHtml(b.category || '');
        var rt = escapeHtml(b.reading_time || '');
        var imgSrc = escapeAttr(safeBlogImageSrc(b.featured_image));
        var imgAlt = escapeAttr(titlePlain);
        var meta = [cat, date, rt].filter(Boolean).join(' · ');
        return (
            '<article class="card-surface blog-card blog-card--with-thumb">' +
            '<a class="blog-card__link" href="/blog/' +
            slug +
            '">' +
            '<div class="blog-card__media">' +
            '<div class="blog-card__media-inner">' +
            '<img class="blog-card__img" src="' +
            imgSrc +
            '" alt="' +
            imgAlt +
            '" width="640" height="360" loading="lazy" decoding="async">' +
            '</div>' +
            '<span class="blog-card__media-fade" aria-hidden="true"></span>' +
            '</div>' +
            '<div class="blog-card__body">' +
            '<h3 class="blog-card__title">' +
            title +
            '</h3>' +
            (meta ? '<p class="blog-card__meta">' + meta + '</p>' : '') +
            '<p class="blog-card__excerpt">' +
            excerpt +
            '</p>' +
            '<span class="blog-card__cta">' +
            '<span class="blog-card__cta-label">Read article</span>' +
            '<svg class="blog-card__cta-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>' +
            '</svg>' +
            '</span>' +
            '</div></a></article>'
        );
    }

    function run() {
        var grid = document.getElementById('blog-posts-grid');
        var nav = document.getElementById('blog-pagination');
        if (!grid) return;

        fetch('/assets/data/blogs.json')
            .then(function (r) {
                if (!r.ok) throw new Error(String(r.status));
                return r.json();
            })
            .then(function (blogs) {
                if (!Array.isArray(blogs)) blogs = [];
                blogs.sort(sortPosts);

                function totalPages() {
                    return blogs.length === 0 ? 1 : Math.ceil(blogs.length / PAGE_SIZE);
                }

                function clampPage(p) {
                    var tp = totalPages();
                    if (p < 1) return 1;
                    if (p > tp) return tp;
                    return p;
                }

                function renderPaginationWrapped(currentPage, tp, onPick) {
                    if (!nav) return;

                    if (tp <= 1) {
                        nav.setAttribute('hidden', '');
                        nav.innerHTML = '';
                        return;
                    }
                    nav.removeAttribute('hidden');
                    var seq = pagerItems(currentPage, tp);

                    var h = '';
                    h +=
                        '<button type="button" class="blog-pagination__btn blog-pagination__prev"' +
                        (currentPage <= 1 ? ' disabled' : '') +
                        ' data-blog-page="' +
                        String(currentPage - 1) +
                        '">Previous</button>';

                    h += '<ul class="blog-pagination__numbers" role="list">';
                    var qi = 0;
                    while (qi < seq.length) {
                        var item = seq[qi];
                        if (item === 'gap') {
                            h += '<li class="blog-pagination__ellipsis" aria-hidden="true">\u2026</li>';
                        } else {
                            var isHere = item === currentPage;
                            h +=
                                '<li><button type="button" class="blog-pagination__btn blog-pagination__num' +
                                (isHere ? ' is-active' : '') +
                                '" data-blog-page="' +
                                String(item) +
                                '"' +
                                (isHere ? ' aria-current="page"' : '') +
                                '>' +
                                String(item) +
                                '</button></li>';
                        }
                        qi++;
                    }
                    h += '</ul>';

                    h +=
                        '<button type="button" class="blog-pagination__btn blog-pagination__next"' +
                        (currentPage >= tp ? ' disabled' : '') +
                        ' data-blog-page="' +
                        String(currentPage + 1) +
                        '">Next</button>';

                    h +=
                        '<p class="blog-pagination__status">Page ' +
                        currentPage +
                        ' of ' +
                        tp +
                        '</p>';

                    nav.innerHTML = h;

                    nav.onclick = function (ev) {
                        var tgt = /** @type {HTMLElement} */ (ev.target);
                        if (!tgt.closest) return;
                        var btn = tgt.closest('button[data-blog-page]');
                        if (!btn || !nav.contains(btn)) return;
                        /** @type {HTMLButtonElement} */
                        var bEl = btn;
                        if (bEl.disabled) return;
                        var nextPg = parseInt(bEl.getAttribute('data-blog-page') || '', 10);
                        if (!isFinite(nextPg)) return;
                        onPick(nextPg);
                    };
                }

                function showPage(desiredPage) {
                    var tp = totalPages();
                    var page = clampPage(desiredPage);

                    if (blogs.length === 0) {
                        grid.innerHTML = '<p class="blog-empty">No articles yet. Check back soon.</p>';
                        if (nav) {
                            nav.setAttribute('hidden', '');
                            nav.innerHTML = '';
                        }
                        return;
                    }

                    var start = (page - 1) * PAGE_SIZE;
                    var slice = blogs.slice(start, start + PAGE_SIZE);
                    var cards = slice.map(cardHtml).filter(Boolean).join('');
                    grid.innerHTML = cards || '<p class="blog-empty">Nothing on this page.</p>';

                    renderPaginationWrapped(page, tp, function (nextPg) {
                        var cl = clampPage(nextPg);
                        syncUrl(cl, false);
                        showPage(cl);
                        scrollToBlogGrid();
                    });
                }

                var truncateNote = document.getElementById('blog-pagination-truncated');
                if (truncateNote) {
                    truncateNote.setAttribute('hidden', '');
                    truncateNote.textContent = '';
                }

                var fromUrl = parsePageFromLocation();
                var clamped = clampPage(fromUrl);
                if (clamped !== fromUrl) {
                    syncUrl(clamped, true);
                }

                showPage(clamped);

                if (!window.__wpBlogPagerPop) {
                    window.__wpBlogPagerPop = true;
                    window.addEventListener('popstate', function () {
                        showPage(clampPage(parsePageFromLocation()));
                    });
                }
            })
            .catch(function () {
                grid.innerHTML = '<p class="blog-empty">Could not load articles. Refresh to try again.</p>';
                if (nav) nav.setAttribute('hidden', '');
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
