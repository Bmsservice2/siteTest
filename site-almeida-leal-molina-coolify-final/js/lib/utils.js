/* Utilitários compartilhados (site, blog e admin). Sem dependências. */
(function () {
  "use strict";
  var U = {};

  U.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  U.slugify = function (s) {
    return String(s || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      .slice(0, 90);
  };

  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  U.formatDate = function (iso) {
    if (!iso) { return ""; }
    var p = String(iso).slice(0, 10).split("-");
    if (p.length !== 3) { return ""; }
    return parseInt(p[2], 10) + " de " + MESES[parseInt(p[1], 10) - 1] + " de " + p[0];
  };

  U.initials = function (nome) {
    var parts = String(nome || "").split(/\s+/).filter(function (w) { return w.length > 2 || /^[A-ZÀ-Ú]/.test(w); });
    var a = parts[0] ? parts[0][0] : "";
    var b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  };

  /* Caminho relativo até a raiz do site (páginas em subpastas usam "../"). */
  U.root = function () {
    return document.documentElement.getAttribute("data-root") || "";
  };

  /* <picture> com WebP + JPG. base = caminho sem extensão. */
  /* Foto enviada pelo painel = arquivo único ("/uploads/…jpg");
     foto do projeto = caminho base com variantes .webp/.jpg/-480. */
  U.isUpload = function (foto) { return /^(\/uploads\/|data:image\/)/.test(String(foto || "")); };
  U.photoSmall = function (foto) { return U.isUpload(foto) ? foto : U.root() + foto + "-480.jpg"; };

  U.picture = function (base, alt, opts) {
    opts = opts || {};
    if (U.isUpload(base)) {
      return '<img' + (opts.cls ? ' class="' + opts.cls + '"' : "") + ' src="' + U.esc(base) + '" alt="' + U.esc(alt) + '" ' +
        (opts.eager ? 'loading="eager"' : 'loading="lazy"') + ' decoding="async">';
    }
    var r = U.root();
    var small = opts.small ? "-480" : "";
    var cls = opts.cls ? ' class="' + opts.cls + '"' : "";
    var lazy = opts.eager ? 'loading="eager"' : 'loading="lazy"';
    var w = opts.small ? 480 : 960, h = opts.small ? 720 : 1440;
    if (base.indexOf("leonardo") !== -1) { h = opts.small ? 679 : 1357; }
    return '<picture>' +
      '<source type="image/webp" srcset="' + r + base + small + '.webp">' +
      '<img' + cls + ' src="' + r + base + small + '.jpg" alt="' + U.esc(alt) + '" width="' + w + '" height="' + h + '" ' + lazy + ' decoding="async">' +
      '</picture>';
  };

  U.pessoa = function (slug) {
    return (window.ALM_EQUIPE || []).filter(function (p) { return p.slug === slug; })[0] || null;
  };

  U.whatsUrl = function (msg) {
    var c = (window.ALM_CONFIG && window.ALM_CONFIG.whatsapp) || {};
    return "https://wa.me/" + c.numero + "?text=" + encodeURIComponent(msg || c.mensagem || "");
  };

  U.readingTime = function (html) {
    var words = String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  };

  window.ALM_UTILS = U;
})();
