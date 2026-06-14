/**
 * WinPlus Asia — Pro Max interactions: scroll reveal, stat counters, card tilt, nav progress
 */
(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initReveal() {
        if (reduced) {
            document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
                el.classList.add('is-visible');
            });
            return;
        }

        var targets = document.querySelectorAll('.reveal, .reveal-stagger');
        if (!targets.length) return;

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
        );

        targets.forEach(function (el) {
            observer.observe(el);
        });
    }

    function initStatCounters() {
        if (reduced) return;

        var pills = document.querySelectorAll('.stat-pill__val[data-count], [data-wp-stat]');
        pills.forEach(function (el) {
            var raw = (el.textContent || '').trim();
            var match = raw.match(/^([\d,]+)(\+?)$/);
            if (!match) return;

            var end = parseInt(match[1].replace(/,/g, ''), 10);
            var suffix = match[2] || '';
            if (isNaN(end) || end < 10) return;

            el.setAttribute('data-count', String(end));
            el.setAttribute('data-suffix', suffix);
            el.textContent = '0' + suffix;

            var started = false;
            var obs = new IntersectionObserver(
                function (entries) {
                    if (!entries[0].isIntersecting || started) return;
                    started = true;
                    obs.disconnect();
                    animateCount(el, end, suffix);
                },
                { threshold: 0.5 }
            );
            obs.observe(el.closest('.stat-pill') || el);
        });
    }

    function animateCount(el, end, suffix) {
        var duration = 1400;
        var start = performance.now();

        function tick(now) {
            var t = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - t, 3);
            var val = Math.round(end * eased);
            el.textContent = val.toLocaleString() + suffix;
            if (t < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    function initCardTilt() {
        if (reduced || !window.matchMedia('(min-width: 768px)').matches) return;

        document.querySelectorAll('.game-chip').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform =
                    'perspective(800px) rotateY(' + x * 8 + 'deg) rotateX(' + -y * 8 + 'deg) translateY(-4px)';
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
        });
    }

    function initScrollProgress() {
        var bar = document.querySelector('.scroll-progress');
        if (!bar) return;

        function update() {
            var doc = document.documentElement;
            var scrollTop = window.scrollY || doc.scrollTop;
            var max = doc.scrollHeight - window.innerHeight;
            var pct = max > 0 ? (scrollTop / max) * 100 : 0;
            bar.style.width = pct + '%';
        }

        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    function initHeroParallax() {
        if (reduced) return;

        var visual = document.querySelector('.hero__visual');
        if (!visual) return;

        window.addEventListener(
            'scroll',
            function () {
                var y = window.scrollY;
                if (y > 600) return;
                visual.style.transform = 'translateY(' + y * 0.06 + 'px)';
            },
            { passive: true }
        );
    }

    function boot() {
        initReveal();
        initStatCounters();
        initCardTilt();
        initScrollProgress();
        initHeroParallax();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    document.addEventListener('wp:partials-loaded', function () {
        initScrollProgress();
    });
})();
