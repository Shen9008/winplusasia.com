(function () {
    function observeAnimated() {
        var opts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, opts);
        document.querySelectorAll('[data-animate]:not(.is-visible)').forEach(function (el) {
            if (!el.classList.contains('is-visible')) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(14px)';
                el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
                obs.observe(el);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.body.addEventListener('click', function (e) {
            var toggle = e.target.closest('.mobile-menu-toggle');
            if (!toggle) return;
            var menu = document.querySelector('.mobile-menu');
            if (menu) {
                menu.classList.toggle('active');
                var isOpen = menu.classList.contains('active');
                var use = toggle.querySelector('use');
                if (use) use.setAttribute('href', isOpen ? '#icon-close' : '#icon-menu');
            }
        });

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href === '#') return;
                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    var menu = document.querySelector('.mobile-menu');
                    if (menu && menu.classList.contains('active')) {
                        menu.classList.remove('active');
                        var u = document.querySelector('.mobile-menu-toggle use');
                        if (u) u.setAttribute('href', '#icon-menu');
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

    document.addEventListener('wp:partials-loaded', function () {
        initHeaderScroll();
        observeAnimated();
    });

    document.addEventListener('wp:content-loaded', function () {
        observeAnimated();
    });
})();
