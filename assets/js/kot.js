/* ===========================================================================
   КОТ — site interactions
   - VK community feed widget (with graceful fallback)
   - sticky nav state + scroll-spy active link
   - mobile menu toggle
   - scroll-reveal animation
   =========================================================================== */
(function () {
    'use strict';

    /* ---- group id: vk.com/kot_media. The community numeric id is taken from
       the СУПЕРВЕТ playlist URL (vkvideo.ru/playlist/-170497734_2). ---- */
    var VK_GROUP_ID = 170497734;

    /* ===================== VK community widget ===================== */
    function showVkFallback() {
        var el = document.getElementById('vk-fallback');
        var mount = document.getElementById('vk_groups');
        if (el) el.hidden = false;
        // hide the (empty) mount so we don't show a blank gap
        if (mount && !mount.childNodes.length) mount.style.display = 'none';
    }

    function initVkWidget() {
        var mount = document.getElementById('vk_groups');
        if (!mount) return;

        var loaded = false;
        var s = document.createElement('script');
        s.src = 'https://vk.com/js/api/openapi.js?169';
        s.async = true;

        // Hard timeout: if the script or render hasn't produced content, show fallback.
        var timer = setTimeout(function () {
            if (!loaded || !mount.childNodes.length) showVkFallback();
        }, 6000);

        s.onload = function () {
            try {
                if (typeof VK === 'undefined' || !VK.Widgets || !VK.Widgets.Group) {
                    clearTimeout(timer);
                    showVkFallback();
                    return;
                }
                // mode 4 = posts feed with comments/likes; responsive width
                VK.Widgets.Group('vk_groups', {
                    mode: 4,
                    width: 'auto',
                    height: 600,
                    color1: 'FFFFFF',
                    color2: '353334',
                    color3: '93BCDA'
                }, VK_GROUP_ID);
                loaded = true;
                // verify render shortly after
                setTimeout(function () {
                    clearTimeout(timer);
                    if (!mount.childNodes.length) showVkFallback();
                }, 2500);
            } catch (e) {
                clearTimeout(timer);
                showVkFallback();
            }
        };
        s.onerror = function () {
            clearTimeout(timer);
            showVkFallback();
        };
        document.body.appendChild(s);
    }

    /* ===================== Sticky nav + scroll-spy ===================== */
    function initNav() {
        var nav = document.getElementById('nav');
        var toggle = document.getElementById('navToggle');
        var links = Array.prototype.slice.call(
            document.querySelectorAll('#navLinks a[href^="#"]')
        );
        if (!nav) return;

        // The illustration height marks the point at which the nav "sticks".
        var illustration = document.querySelector('.hero-illustration');

        function onScroll() {
            var threshold = illustration ? illustration.offsetHeight - 10 : 120;
            nav.classList.toggle('is-stuck', window.scrollY > threshold);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // Mobile menu
        if (toggle) {
            toggle.addEventListener('click', function () {
                var open = nav.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }
        // close mobile menu after choosing a link
        links.forEach(function (a) {
            a.addEventListener('click', function () {
                nav.classList.remove('is-open');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Scroll-spy: highlight the section currently in view
        var sections = links
            .map(function (a) { return document.querySelector(a.getAttribute('href')); })
            .filter(Boolean);

        if ('IntersectionObserver' in window && sections.length) {
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var id = '#' + entry.target.id;
                        links.forEach(function (a) {
                            a.classList.toggle('is-active', a.getAttribute('href') === id);
                        });
                    }
                });
            }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
            sections.forEach(function (sec) { spy.observe(sec); });
        }
    }

    /* ===================== Scroll-reveal ===================== */
    function initReveal() {
        var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
        if (!items.length) return;

        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        items.forEach(function (el) { io.observe(el); });
    }

    /* ===================== Boot ===================== */
    function boot() {
        initNav();
        initReveal();
        initVkWidget();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
