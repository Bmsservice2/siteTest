/* ============================================================
   ALMEIDA, LEAL & MOLINA — Camada de movimento (engine BMS)
   Técnicas LIGADAS para este cliente (briefing pede sobriedade):
     [x] G1 Lenis   [x] G2 reveals discretos   [x] G4 preloader (main.js)
     [x] G6/G7 header e menu (main.js)   [x] H3 H1 palavra a palavra
     [x] H4 CTAs magnéticos (leve)   [x] F1 fotos com wipe de revelação
   DESLIGADAS de propósito: G3 transição de camadas, G5 cursor,
     S2 tilt 3D, CS1 galeria pinada, DP1 coverflow (não há depoimentos
     enviados), contadores (não há números fornecidos).
   Degradação segura: sem libs / com reduced-motion → estado final.
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (reduceMotion) { return; }

  /* ---------- 1) Scroll suave (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.05, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__bmsLenis = lenis;
    if (hasGSAP) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 76;
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link || link.classList.contains("logo")) { return; }
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.indexOf("/") !== -1) { return; }
      var target = href === "#topo" ? 0 : document.querySelector(href);
      if (target === null) { return; }
      e.preventDefault();
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -(headerH - 1) });
    });
  }

  if (!hasGSAP) { return; }
  var g = window.gsap;
  g.registerPlugin(window.ScrollTrigger);

  /* ---------- 2) Reveals discretos (apenas blocos-chave) ---------- */
  var sel = ".section__eyebrow, .section__title, .section__lead, .modes__item, .credentials__item, " +
            ".area, .partner, .member, .office, .contact__actions";
  var els = g.utils.toArray(sel);
  els.forEach(function (el) {
    var delay = 0;
    if (el.parentElement) {
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return els.indexOf(c) !== -1; });
      var i = sibs.indexOf(el);
      if (i > 0) { delay = Math.min(i * 0.06, 0.36); }
    }
    g.from(el, { opacity: 0, y: 18, duration: 0.8, ease: "power3.out", delay: delay,
      scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  /* ---------- 3) H1 do hero palavra a palavra (momento único) ---------- */
  (function () {
    var h1 = document.querySelector(".hero__title");
    if (!h1 || h1.dataset.split) { return; }
    var units = [];
    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(h1.childNodes, function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) { return; }
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement("span"); w.className = "hero-word"; w.textContent = part;
          frag.appendChild(w); units.push(w);
        });
      } else if (node.nodeType === 1) {
        var c = node.cloneNode(true);
        if (!c.classList.contains("hero__title-sub")) { c.classList.add("hero-word"); }
        frag.appendChild(c); units.push(c);
      }
    });
    h1.textContent = ""; h1.appendChild(frag); h1.dataset.split = "1";
    h1.style.animation = "none"; h1.style.opacity = "1"; h1.style.transform = "none";
    g.from(units, { yPercent: 50, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.07, delay: 0.3 });
  })();

  /* ---------- 4) CTAs magnéticos (sutil) ---------- */
  if (finePointer) {
    document.querySelectorAll(".hero__actions .btn").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        g.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.2, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () { g.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" }); });
    });
  }

  /* ---------- 5) Fotos: wipe de revelação (F1) ---------- */
  g.utils.toArray(".about__photo, .band__photo").forEach(function (img) {
    var pic = img.closest("picture") || img;
    if (pic.parentElement.classList.contains("media-reveal")) { return; }
    var w = document.createElement("div"); w.className = "media-reveal";
    pic.parentNode.insertBefore(w, pic); w.appendChild(pic);
    g.fromTo(w, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "power3.inOut",
      scrollTrigger: { trigger: w, start: "top 85%", once: true }, onComplete: function () { g.set(w, { clearProps: "clipPath" }); } });
    g.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.5, ease: "power3.out",
      scrollTrigger: { trigger: w, start: "top 85%", once: true }, onComplete: function () { g.set(img, { clearProps: "transform" }); } });
  });

  /* Recalcula medidas após fontes/imagens (lição do gotchas.md) */
  window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); }); }
  setTimeout(function () { window.ScrollTrigger.refresh(); }, 600);
})();
