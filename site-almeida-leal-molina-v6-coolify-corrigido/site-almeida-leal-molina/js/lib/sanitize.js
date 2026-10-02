/* ============================================================
   Sanitizador de HTML (lista de permissões) para o conteúdo dos
   artigos. Tudo que vem do editor/banco passa por aqui antes de
   ir para a página — evita scripts e atributos perigosos (XSS).
   Mantenha a sanitização TAMBÉM no backend quando ele existir.
   ============================================================ */
(function () {
  "use strict";
  var ALLOWED = {
    P: [], BR: [], STRONG: [], B: [], EM: [], I: [], U: [], H2: [], H3: [], H4: [],
    UL: [], OL: [], LI: [], BLOCKQUOTE: [], A: ["href", "title"], HR: [],
    FIGURE: [], FIGCAPTION: [], IMG: ["src", "alt"]
  };
  var SAFE_URL = /^(https?:|mailto:|tel:|#|\/|\.\.?\/|data:image\/(png|jpe?g|webp|gif);base64,)/i;

  function clean(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) { return; }
      if (child.nodeType !== 1) { child.remove(); return; }
      var tag = child.tagName;
      if (tag === "DIV") {                      // editores costumam gerar <div> → vira <p>
        var p = document.createElement("p");
        while (child.firstChild) { p.appendChild(child.firstChild); }
        child.replaceWith(p); clean(p); return;
      }
      if (tag === "B") { var s = document.createElement("strong"); while (child.firstChild) { s.appendChild(child.firstChild); } child.replaceWith(s); clean(s); return; }
      if (tag === "I") { var e = document.createElement("em"); while (child.firstChild) { e.appendChild(child.firstChild); } child.replaceWith(e); clean(e); return; }
      if (!ALLOWED.hasOwnProperty(tag)) {
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|FORM|INPUT|BUTTON|TEXTAREA|SELECT|SVG|MATH)$/.test(tag)) { child.remove(); return; }
        var frag = document.createDocumentFragment();       // desembrulha (mantém o texto)
        while (child.firstChild) { frag.appendChild(child.firstChild); }
        child.replaceWith(frag);
        clean(node);
        return;
      }
      Array.prototype.slice.call(child.attributes).forEach(function (a) {
        if (ALLOWED[tag].indexOf(a.name) === -1) { child.removeAttribute(a.name); }
      });
      ["href", "src"].forEach(function (attr) {
        var v = child.getAttribute(attr);
        if (v != null && !SAFE_URL.test(v.trim())) { child.removeAttribute(attr); }
      });
      if (tag === "A") { child.setAttribute("rel", "noopener noreferrer"); if (/^https?:/i.test(child.getAttribute("href") || "")) { child.setAttribute("target", "_blank"); } }
      if (tag === "IMG") {
        if (!child.getAttribute("src")) { child.remove(); return; }
        child.setAttribute("loading", "lazy");
      }
      clean(child);
    });
  }

  var BLOCK = /^(P|H2|H3|H4|UL|OL|BLOCKQUOTE|HR|FIGURE|IMG)$/;
  /* Texto solto na raiz (comum no contenteditable) vira <p> */
  function wrapLoose(root) {
    var run = null;
    Array.prototype.slice.call(root.childNodes).forEach(function (n) {
      var isBlock = n.nodeType === 1 && BLOCK.test(n.tagName);
      if (isBlock) { run = null; return; }
      if (n.nodeType === 3 && !n.textContent.trim() && !run) { n.remove(); return; }
      if (n.nodeType === 1 && n.tagName === "BR" && !run) { n.remove(); return; }
      if (!run) { run = document.createElement("p"); root.insertBefore(run, n); }
      run.appendChild(n);
    });
  }

  window.ALM_SANITIZE = function (html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = String(html || "");
    clean(tpl.content);
    wrapLoose(tpl.content);
    var div = document.createElement("div");
    div.appendChild(tpl.content.cloneNode(true));
    return div.innerHTML;
  };
})();
