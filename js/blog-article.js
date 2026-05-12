/**
 * Blog single post: sidebar + related posts from /assets/data/blogs.json (root-relative fetch).
 */
(function () {
    'use strict';

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

    function safeSlug(s) {
        return /^[a-z0-9][a-z0-9_-]*$/i.test(String(s || '').trim());
    }

    var SIDEBAR_POST_LIMIT = 3;

    /** @returns {string} */
    function formatPublishedLabel(iso) {
        if (iso == null || iso === '') return '';
        var raw = String(iso).trim();
        var d = new Date(raw.indexOf('T') === -1 ? raw + 'T12:00:00' : raw);
        if (!isFinite(d.getTime())) return '';
        try {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return '';
        }
    }

    function run() {
        var slug = String(document.body.getAttribute('data-blog-slug') || '').trim();
        var relatedAttr = document.body.getAttribute('data-related-slugs') || '';
        var relatedOrder = relatedAttr
            .split(',')
            .map(function (x) {
                return x.trim();
            })
            .filter(function (s) {
                return s && safeSlug(s) && s !== slug;
            });

        fetch('/assets/data/blogs.json')
            .then(function (r) {
                if (!r.ok) throw new Error(String(r.status));
                return r.json();
            })
            .then(function (blogs) {
                if (!Array.isArray(blogs)) blogs = [];
                blogs.sort(sortPosts);

                var bySlug = {};
                var bi = 0;
                while (bi < blogs.length) {
                    var e = blogs[bi];
                    if (e && e.slug) bySlug[e.slug] = e;
                    bi++;
                }

                var sidebar = document.getElementById('sidebar-posts');
                if (sidebar) {
                    var side = blogs
                        .filter(function (b) {
                            return b && b.slug && safeSlug(b.slug) && b.slug !== slug;
                        })
                        .slice(0, SIDEBAR_POST_LIMIT);
                    sidebar.innerHTML = side.length
                        ? side
                              .map(function (b) {
                                  var href = '/blog/' + escapeHtml(b.slug);
                                  var title = escapeHtml(b.title || b.slug);
                                  var dateIso = String(b.published_date || b.synced_at || '').trim();
                                  var dateShown = formatPublishedLabel(b.published_date || b.synced_at);
                                  var dateAttr =
                                      dateIso && dateIso.indexOf('T') === -1
                                          ? escapeHtml(dateIso)
                                          : escapeHtml(dateIso.split('T')[0] || '');
                                  var read = escapeHtml(String(b.reading_time || '').trim());
                                  var timeHtml = dateShown
                                      ? '<time class="blog-sidebar-post__date" datetime="' +
                                        dateAttr +
                                        '">' +
                                        escapeHtml(dateShown) +
                                        '</time>'
                                      : '';
                                  var readHtml = read
                                      ? '<span class="blog-sidebar-post__hint">' + read + '</span>'
                                      : '';
                                  return (
                                      '<li class="blog-sidebar-post">' +
                                      '<a class="blog-sidebar-post__link" href="' +
                                      href +
                                      '">' +
                                      '<span class="blog-sidebar-post__body">' +
                                      timeHtml +
                                      '<span class="blog-sidebar-post__title">' +
                                      title +
                                      '</span>' +
                                      readHtml +
                                      '</span>' +
                                      '</a>' +
                                      '</li>'
                                  );
                              })
                              .join('')
                        : '<li class="blog-sidebar-placeholder">No other posts yet.</li>';
                }

                var relUl = document.querySelector('#related-posts .blog-related-list');
                var relPh = document.querySelector('#related-posts .blog-related-placeholder');
                if (!relUl || !relPh) return;

                var picked = [];
                var ri = 0;
                while (ri < relatedOrder.length && picked.length < 4) {
                    var rs = relatedOrder[ri];
                    var post = bySlug[rs];
                    if (post) picked.push(post);
                    ri++;
                }

                if (picked.length === 0) {
                    picked = blogs
                        .filter(function (b) {
                            return b && b.slug && safeSlug(b.slug) && b.slug !== slug;
                        })
                        .slice(0, 3);
                }

                if (picked.length) {
                    relUl.innerHTML = picked
                        .map(function (b) {
                            return (
                                '<li><a href="/blog/' +
                                escapeHtml(b.slug) +
                                '">' +
                                escapeHtml(b.title || b.slug) +
                                '</a></li>'
                            );
                        })
                        .join('');
                    relUl.removeAttribute('hidden');
                    relPh.setAttribute('hidden', '');
                } else {
                    relPh.textContent = 'More posts coming soon.';
                }
            })
            .catch(function () {
                var sidebar = document.getElementById('sidebar-posts');
                if (sidebar) {
                    sidebar.innerHTML =
                        '<li class="blog-sidebar-placeholder">Could not load posts. Refresh to try again.</li>';
                }
                var relPh = document.querySelector('#related-posts .blog-related-placeholder');
                if (relPh) relPh.textContent = 'Could not load related posts.';
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
