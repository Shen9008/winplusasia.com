/**
 * WinPlus Asia — load header/footer/optional CTA. Sets active nav from body[data-page].
 */
(function () {
    'use strict';

    /** Bumped when CSS/JS/partials change — busts browser cache on fetch. */
    var WP_ASSET_VER = '20260408';

    var pathname = window.location.pathname || '';
    var isSubfolder = pathname.split('/').filter(Boolean).length > 1;
    var base = '';

    function rewriteLinks(html) {
        return html;
    }

    function setActiveNav() {
        var page = document.body.getAttribute('data-page') || '';
        if (!page) return;
        document.querySelectorAll('.nav__link[data-nav="' + page + '"], .mobile-menu__link[data-nav="' + page + '"]').forEach(function (el) {
            el.classList.add('nav__link--active');
        });
    }

    function injectSvgSprite() {
        if (document.getElementById('svg-sprite-wp')) return;
        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" id="svg-sprite-wp" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
            '<defs>' +
            '<symbol id="icon-menu" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></symbol>' +
            '<symbol id="icon-close" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></symbol>' +
            '<symbol id="icon-slot" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></symbol>' +
            '<symbol id="icon-live" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31A7.902 7.902 0 0 1 12 20zm6.31-3.1L7.1 5.69A7.902 7.902 0 0 1 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></symbol>' +
            '<symbol id="icon-sports" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></symbol>' +
            '<symbol id="icon-gift" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-3-3c-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-1.35l.47-.63C14.23 3.18 14.61 3 15 3zM9 3c.39 0 .77.18 1.04.49l.47.63H9c-.55 0-1-.45-1-1s.45-1 1-1zm11 16H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/></symbol>' +
            '<symbol id="icon-help" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></symbol>' +
            '<symbol id="icon-shield" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></symbol>' +
            '<symbol id="icon-check" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></symbol>' +
            '<symbol id="icon-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></symbol>' +
            '<symbol id="icon-roulette" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.31-8.86c-1.56-.51-2.62-1.91-2.62-3.51 0-2.05 1.98-3.71 4.42-3.71s4.42 1.66 4.42 3.71c0 1.29-.78 2.43-1.98 3.13L15 16h-2l1.09-3.24-.78-.62z"/></symbol>' +
            '<symbol id="icon-cards" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></symbol>' +
            '<symbol id="icon-phone" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></symbol>' +
            '<symbol id="icon-megaways" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></symbol>' +
            '<symbol id="icon-trophy" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></symbol>' +
            '</defs></svg>';
        document.body.insertBefore(wrap.firstChild, document.body.firstChild);
    }

    function run() {
        injectSvgSprite();
        var loadCta = document.body.getAttribute('data-cta') !== 'false';
        var q = '?v=' + encodeURIComponent(WP_ASSET_VER);
        var fetches = [
            fetch(base + 'partials/header.html' + q).then(function (r) { return r.text(); }),
            fetch(base + 'partials/footer.html' + q).then(function (r) { return r.text(); })
        ];
        if (loadCta) {
            fetches.push(fetch(base + 'partials/cta-banner.html' + q).then(function (r) { return r.text(); }));
        }
        Promise.all(fetches).then(function (parts) {
            var headerHtml = rewriteLinks(parts[0]);
            var footerHtml = rewriteLinks(parts[1]);
            var headerPlaceholder = document.getElementById('partial-header');
            var footerPlaceholder = document.getElementById('partial-footer');
            if (headerPlaceholder) {
                var temp = document.createElement('div');
                temp.innerHTML = headerHtml;
                var parent = headerPlaceholder.parentNode;
                while (temp.firstChild) {
                    parent.insertBefore(temp.firstChild, headerPlaceholder);
                }
                headerPlaceholder.remove();
            }
            if (footerPlaceholder) {
                footerPlaceholder.outerHTML = footerHtml;
            }
            if (loadCta && parts[2]) {
                var main = document.getElementById('main-content');
                var bannerHtml = rewriteLinks(parts[2]);
                if (main) {
                    var firstSection = main.querySelector('section');
                    if (firstSection) {
                        firstSection.insertAdjacentHTML('afterend', bannerHtml);
                    }
                }
            }
            setActiveNav();
            document.dispatchEvent(new CustomEvent('wp:partials-loaded'));
        }).catch(function () {
            setActiveNav();
            document.dispatchEvent(new CustomEvent('wp:partials-loaded'));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
