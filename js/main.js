(function () {
    function syncMobileMenuUi(open) {
        var menu = document.querySelector('.mobile-menu');
        var toggle = document.querySelector('.mobile-menu-toggle');
        if (!menu) return;
        menu.classList.toggle('active', open);
        menu.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.classList.toggle('mobile-nav-open', open);
        if (toggle) {
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            var use = toggle.querySelector('use');
            if (use) use.setAttribute('href', open ? '#icon-close' : '#icon-menu');
        }
    }

    function setMobileMenuOpen(open) {
        if (open && window.matchMedia('(min-width: 900px)').matches) return;
        syncMobileMenuUi(open);
        if (open) {
            window.setTimeout(function () {
                var closeBtn = document.querySelector('.mobile-menu__close');
                if (closeBtn) closeBtn.focus({ preventScroll: true });
            }, 60);
        } else {
            var t = document.querySelector('.mobile-menu-toggle');
            if (t) t.focus({ preventScroll: true });
        }
    }

    function toggleMobileMenu() {
        var menu = document.querySelector('.mobile-menu');
        if (!menu) return;
        setMobileMenuOpen(!menu.classList.contains('active'));
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.body.addEventListener('click', function (e) {
            if (e.target.closest('.mobile-menu-toggle')) {
                toggleMobileMenu();
                return;
            }
            if (e.target.closest('.mobile-menu__close')) {
                e.preventDefault();
                setMobileMenuOpen(false);
                return;
            }
            if (e.target.closest('.mobile-menu__backdrop')) {
                setMobileMenuOpen(false);
            }
        });

        window.addEventListener('resize', function () {
            if (window.matchMedia('(min-width: 900px)').matches) {
                syncMobileMenuUi(false);
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            var menu = document.querySelector('.mobile-menu');
            if (menu && menu.classList.contains('active')) {
                setMobileMenuOpen(false);
            }
        });

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href === '#') return;
                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ block: 'start' });
                    var menu = document.querySelector('.mobile-menu');
                    if (menu && menu.classList.contains('active')) {
                        syncMobileMenuUi(false);
                    }
                }
            });
        });
    });

    function initHeaderScroll() {
        var header = document.querySelector('.header');
        if (!header) return;
        window.addEventListener(
            'scroll',
            function () {
                header.classList.toggle('header--scrolled', window.pageYOffset > 80);
            },
            { passive: true }
        );
    }

    function initScrollTop() {
        var btn = document.getElementById('wp-scroll-top');
        if (!btn) return;
        var threshold = 360;
        function updateVisibility() {
            btn.classList.toggle('scroll-top--visible', window.scrollY > threshold);
        }
        updateVisibility();
        window.addEventListener('scroll', updateVisibility, { passive: true });
        btn.addEventListener('click', function () {
            var instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
            btn.focus({ preventScroll: true });
        });
    }

    document.addEventListener('wp:partials-loaded', function () {
        initHeaderScroll();
        initScrollTop();
    });
})();
