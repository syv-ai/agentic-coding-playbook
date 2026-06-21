/* ============================================================================
   page-motion.js — calm navigation motion.

   1. A subtle fade-in of page content on first load and every Material instant
      navigation (Web Animations API, so it re-runs regardless of DOM swap).
   2. A slower, eased smooth-scroll for in-page anchor / TOC clicks (the native
      `scroll-behavior: smooth` duration isn't configurable, so we drive it).

   Both respect prefers-reduced-motion (no animation for users who opt out).
   ========================================================================== */
(function () {
  const reduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 1. Content fade-in (per navigation) -------------------------------
  function fadeIn() {
    if (reduced()) return;
    const el = document.querySelector(".md-content");
    if (!el || !el.animate) return;
    el.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 960, easing: "ease", fill: "both" }
    );
  }

  // ---- 2. Slower smooth-scroll to in-page anchors ------------------------
  const SCROLL_MS = 1000;
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function scrollToY(targetY) {
    const startY = window.scrollY;
    const dist = targetY - startY;
    if (Math.abs(dist) < 2) return;
    let start;
    function step(ts) {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / SCROLL_MS);
      window.scrollTo({ top: startY + dist * easeInOutCubic(p), behavior: "instant" });
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent((a.getAttribute("href") || "").slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    // Offset for the sticky header (Material sets scroll-margin-top; fall back to header height).
    const header = document.querySelector(".md-header");
    const sm = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const offset = sm || (header ? header.offsetHeight + 8 : 0);
    const y = target.getBoundingClientRect().top + window.scrollY - offset;
    if (reduced()) window.scrollTo({ top: y, behavior: "instant" });
    else scrollToY(y);
    history.pushState(null, "", "#" + id);
  }

  // Added once; the document persists across instant navigation.
  document.addEventListener("click", onClick);

  if (typeof window.document$ !== "undefined") {
    window.document$.subscribe(fadeIn);
  } else {
    document.addEventListener("DOMContentLoaded", fadeIn);
  }
})();
