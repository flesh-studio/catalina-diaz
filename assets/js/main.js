/* ==========================================================================
   CAT DÍAZ — main.js
   Vanilla + GSAP/ScrollTrigger + Lenis (CDN, no build step)
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ----------------------------------------------------------------------
     Split text into words while preserving an accessible name
  ---------------------------------------------------------------------- */
  function splitWords(el) {
    var text = el.textContent.trim();
    if (!text) return [];
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    el.setAttribute("role", "text");

    // Preserve <br> as line breaks: work per child node
    var frag = document.createDocumentFragment();
    var words = [];

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var parts = node.textContent.split(/(\s+)/);
        parts.forEach(function (part) {
          if (part.trim() === "") {
            if (part.length) frag.appendChild(document.createTextNode(part));
          } else {
            var span = document.createElement("span");
            span.className = "word";
            span.textContent = part;
            span.setAttribute("aria-hidden", "true");
            frag.appendChild(span);
            words.push(span);
          }
        });
      } else if (node.nodeName === "BR") {
        frag.appendChild(document.createElement("br"));
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    }

    Array.prototype.slice.call(el.childNodes).forEach(processNode);
    el.innerHTML = "";
    el.appendChild(frag);
    return words;
  }

  var splitTargets = document.querySelectorAll("[data-split]");
  var splitMap = new Map();
  splitTargets.forEach(function (el) {
    splitMap.set(el, splitWords(el));
  });

  /* ----------------------------------------------------------------------
     Lenis smooth scroll (disabled under reduced motion)
  ---------------------------------------------------------------------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel: true,
    });
    lenis.on("scroll", hasGSAP ? ScrollTrigger.update : function () {});
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    document.documentElement.classList.add("has-lenis");
  }

  /* ----------------------------------------------------------------------
     Header state + mobile nav
  ---------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  function onScrollHeader() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  var menuToggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  function closeMenu() {
    menuToggle.classList.remove("open");
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  menuToggle.addEventListener("click", function () {
    var isOpen = menuToggle.classList.toggle("open");
    mobileNav.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ----------------------------------------------------------------------
     Scroll progress bar
  ---------------------------------------------------------------------- */
  var progressFill = document.getElementById("progressFill");
  function onProgress() {
    var h = document.documentElement;
    var scrollTop = h.scrollTop || document.body.scrollTop;
    var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressFill.style.width = pct + "%";
  }
  window.addEventListener("scroll", onProgress, { passive: true });
  onProgress();

  /* ----------------------------------------------------------------------
     Animated counter (honest, real numbers only)
  ---------------------------------------------------------------------- */
  var counters = document.querySelectorAll("[data-count-to]");
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count-to"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) {
      el.textContent = target.toLocaleString("es-AR") + suffix;
      return;
    }
    var obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: function () {
        el.textContent = Math.round(obj.val).toLocaleString("es-AR") + suffix;
      },
    });
  }

  /* ----------------------------------------------------------------------
     Hero intro timeline
  ---------------------------------------------------------------------- */
  function heroIntro() {
    var heroWords = [];
    document.querySelectorAll(".hero-title [data-split], .eyebrow[data-split]").forEach(function (el) {
      heroWords = heroWords.concat(splitMap.get(el) || []);
    });

    if (!hasGSAP || reduceMotion) {
      document.querySelectorAll(".hero .word").forEach(function (w) { w.style.opacity = 1; });
      document.querySelectorAll(".hero-sub, .hero-actions, .hero-stats, .hud-tag, .hud-line").forEach(function (el) {
        el.style.opacity = 1;
      });
      counters.forEach(animateCounter);
      return;
    }

    gsap.set(".hero .word", { yPercent: 120, opacity: 0 });
    gsap.set(".hero-sub, .hero-actions", { y: 18, opacity: 0 });
    gsap.set(".hero-stats", { y: 24, opacity: 0 });
    gsap.set(".hud-tag, .hud-line", { opacity: 0 });
    gsap.set(".hero-media img", { scale: 1.18 });

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(".hero-media img", { scale: 1.08, duration: 1.6, ease: "power2.out" }, 0)
      .to(".eyebrow .word", { yPercent: 0, opacity: 1, duration: .7, stagger: .02 }, .15)
      .to(".hero-title .word", { yPercent: 0, opacity: 1, duration: .9, stagger: .025 }, .3)
      .to(".hero-sub", { y: 0, opacity: 1, duration: .7 }, .75)
      .to(".hero-actions", { y: 0, opacity: 1, duration: .7 }, .85)
      .to(".hud-tag, .hud-line", { opacity: 1, duration: .6, stagger: .1 }, .9)
      .to(".hero-stats", { y: 0, opacity: 1, duration: .7 }, .95, )
      .call(function () { counters.forEach(animateCounter); }, null, 1.1);
  }

  /* ----------------------------------------------------------------------
     Scroll reveals (section by section)
  ---------------------------------------------------------------------- */
  function scrollReveals() {
    if (!hasGSAP) return;

    // Kickers, titles (word stagger)
    document.querySelectorAll("[data-split]").forEach(function (el) {
      if (el.closest(".hero")) return; // hero handled by intro tl
      var words = splitMap.get(el) || [];
      if (!words.length) return;
      if (reduceMotion) { words.forEach(function (w) { w.style.opacity = 1; }); return; }
      gsap.set(words, { yPercent: 100, opacity: 0 });
      gsap.to(words, {
        yPercent: 0, opacity: 1, duration: .8, stagger: .02, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // Generic fade/rise for supporting copy & media
    var riseTargets = document.querySelectorAll(
      ".about-lead, .about-body, .badge-row, .about-media, .service-card, .gallery-item, .mentality-sub, .final-cta .btn, .final-ig, .gallery-note"
    );
    riseTargets.forEach(function (el, i) {
      if (reduceMotion) { el.style.opacity = 1; return; }
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: .8, ease: "power3.out",
          delay: el.classList.contains("service-card") ? (i % 4) * 0.06 : 0,
          scrollTrigger: { trigger: el, start: "top 90%" },
        }
      );
    });
  }

  /* ----------------------------------------------------------------------
     Init
  ---------------------------------------------------------------------- */
  function init() {
    heroIntro();
    scrollReveals();

    if (hasGSAP) {
      window.addEventListener("load", function () { ScrollTrigger.refresh(); });
      window.addEventListener("resize", function () { ScrollTrigger.refresh(); });
    }

    document.getElementById("year").textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
