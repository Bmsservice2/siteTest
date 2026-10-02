/* ============================================================
   ALMEIDA, LEAL & MOLINA — Interações essenciais (engine BMS)
   Header mínimo (logo + botão de menu), menu lateral em tela cheia
   (único, para qualquer tamanho de tela — sem barra fixa de links),
   scrollspy, preloader e ano.
   Sem dependência de CDN: funciona mesmo se as libs falharem.
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader: some no load (mín. 0,3s, teto 1,2s) ---------- */
  var preloader = document.getElementById("preloader");
  if (preloader) {
    var t0 = performance.now();
    var hide = function () {
      if (preloader.classList.contains("is-done")) { return; }
      preloader.classList.add("is-done");
      setTimeout(function () { if (preloader.parentNode) { preloader.parentNode.removeChild(preloader); } }, 600);
    };
    window.addEventListener("load", function () { setTimeout(hide, Math.max(0, 300 - (performance.now() - t0))); });
    setTimeout(hide, 1200);
  }

  /* ---------- Header: sólido ao rolar, recolhe ao descer ---------- */
  var header = document.querySelector(".header");
  var toggle = document.querySelector(".menu-toggle");
  var toggleLabel = toggle && toggle.querySelector(".menu-toggle__label");
  var navDrawer = document.getElementById("nav-drawer");
  var navPanel = navDrawer && navDrawer.querySelector(".nav-drawer__panel");
  var lastY = window.scrollY;
  var navOpen = false;
  var solidPage = document.body.classList.contains("page--solid-header");

  function updateHeader() {
    if (!header) { return; }
    var y = window.scrollY;
    header.classList.toggle("header--scrolled", solidPage || y > 24 || navOpen);
    header.classList.toggle("header--nav-open", navOpen);
    var down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 560 && !navOpen) { header.classList.add("header--hidden"); }
    else if (up || y <= 560) { header.classList.remove("header--hidden"); }
    lastY = y;
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ---------- Menu lateral (mesmo padrão do painel de perfil) ---------- */
  function setNav(open) {
    if (!navDrawer) { return; }
    navOpen = open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (toggleLabel) { toggleLabel.textContent = open ? "Fechar" : "Menu"; }
    document.body.classList.toggle("is-locked", open);
    if (window.__bmsLenis) { open ? window.__bmsLenis.stop() : window.__bmsLenis.start(); }
    if (open) {
      navDrawer.hidden = false;
      if (navPanel) { navPanel.scrollTop = 0; }
      requestAnimationFrame(function () { navDrawer.classList.add("is-open"); });
    } else {
      navDrawer.classList.remove("is-open");
      setTimeout(function () { navDrawer.hidden = true; }, 650);
    }
    updateHeader();
  }
  if (toggle && navDrawer) {
    toggle.addEventListener("click", function () { setNav(!navOpen); });
    navDrawer.addEventListener("click", function (e) {
      if (e.target.closest("[data-nav-close]")) { setNav(false); return; }
      if (e.target.closest(".nav-drawer__link")) { setNav(false); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && navOpen) { setNav(false); toggle.focus(); } });
  }

  /* ---------- Logo volta ao topo (só na home; nas outras é link) ---------- */
  document.querySelectorAll('.logo[href="#topo"]').forEach(function (logo) {
    logo.addEventListener("click", function (e) {
      e.preventDefault();
      if (window.__bmsLenis) { window.__bmsLenis.scrollTo(0); }
      else { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); }
    });
  });

  /* ---------- Scrollspy (marca o link do menu lateral) ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-drawer__link[href^="#"]'));
  var byId = {};
  links.forEach(function (l) { var id = l.getAttribute("href").slice(1); if (document.getElementById(id)) { byId[id] = l; } });
  if ("IntersectionObserver" in window && Object.keys(byId).length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          if (byId[en.target.id]) { byId[en.target.id].classList.add("is-active"); }
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(byId).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  var ano = document.getElementById("ano-atual");
  if (ano) { ano.textContent = String(new Date().getFullYear()); }
})();
