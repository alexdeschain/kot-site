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

    /* VK requires a registered application id to render the community feed widget
       (VK.init throws "called without an apiId" otherwise — onlyWidgets doesn't waive it).
       Create one free at vk.com/apps?act=manage → Create app → Website/Embed, then paste
       the numeric App ID here. While it's 0 we show the designed «сообщество» card instead. */
    var VK_APP_ID = 52201531;

    /* ===================== VK community widget ===================== */
    function showVkFallback() {
        var el = document.getElementById('vk-fallback');
        var mount = document.getElementById('vk_groups');
        if (el) el.hidden = false;
        // hide the (empty) mount so we don't show a blank gap
        if (mount && !mount.childNodes.length) mount.style.display = 'none';
    }

    function mountVkGroup() {
        var mount = document.getElementById('vk_groups');
        if (!mount || typeof VK === 'undefined' || !VK.Widgets || !VK.Widgets.Group) {
            showVkFallback();
            return;
        }
        try {
            // mode 1 = the GROUP's wall posts — always shows this community regardless of who
            // is logged in. (mode 4 = personalised "news" feed, which for a logged-in VK user
            // rendered THEIR own feed instead of the КОТ group — that was the bug.)
            VK.Widgets.Group('vk_groups', {
                mode: 1,
                wide: 1,
                width: 'auto',
                height: 600,
                color1: 'FFFFFF',
                color2: '353334',
                color3: '93BCDA'
            }, VK_GROUP_ID);
        } catch (e) {
            showVkFallback();
        }
    }

    function initVkWidget() {
        var mount = document.getElementById('vk_groups');
        if (!mount) return;

        // No VK App ID configured → don't attempt the widget (it would just throw and
        // flash a broken state). Show the designed community card straight away.
        if (!VK_APP_ID) {
            showVkFallback();
            return;
        }

        // The reliable VK pattern: define window.vkAsyncInit BEFORE loading openapi.js.
        // VK calls it only when the API (incl. VK.Widgets) is fully ready — onload alone
        // is NOT enough (VK.Widgets may not exist yet at script onload).
        window.vkAsyncInit = function () {
            VK.init({ apiId: VK_APP_ID, onlyWidgets: true });
            VK._kotInited = true;
            mountVkGroup();
        };

        var s = document.createElement('script');
        s.src = 'https://vk.com/js/api/openapi.js?169';
        s.async = true;

        // Hard timeout: if vkAsyncInit never fires or the widget renders nothing, fall back.
        var timer = setTimeout(function () {
            if (!mount.childNodes.length) showVkFallback();
        }, 7000);
        // clear the timeout once content appears
        var poll = setInterval(function () {
            if (mount.childNodes.length) { clearTimeout(timer); clearInterval(poll); }
        }, 500);
        setTimeout(function () { clearInterval(poll); }, 8000);

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
