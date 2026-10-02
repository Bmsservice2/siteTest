/* ============================================================
   BLOG — listagem (/conteudos/) e artigo (/conteudos/artigo.html?slug=)
   Lê exclusivamente do ALM_STORE (adaptador plugável).
   Conteúdo HTML dos artigos sempre passa pelo ALM_SANITIZE.
   Pré-visualização do painel: artigo.html?preview=1 (lê o rascunho
   que o /admin guarda no sessionStorage desta aba).
   ============================================================ */
(function () {
  "use strict";
  var U = window.ALM_UTILS, S = window.ALM_STORE, esc = U.esc;
  var WA_SVG = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z"/></svg>';

  function applyContact() {
    document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = U.whatsUrl(); });
  }
  S.applySettings().then(applyContact);
  var teamReady = Promise.resolve();
  applyContact();

  /* ============================ LISTAGEM ============================ */
  var grid = document.getElementById("posts");
  if (grid) {
    var all = [], cat = "Todas", q = "";
    var filters = document.getElementById("cat-filters");
    var search = document.getElementById("search");

    var draw = function () {
      var needle = U.slugify(q).replace(/-/g, " ");
      var list = all.filter(function (p) {
        if (cat !== "Todas" && p.categoria !== cat) { return false; }
        if (!needle) { return true; }
        var autor = U.pessoa(p.autor);
        var hay = U.slugify([p.titulo, p.resumo, p.categoria, autor ? autor.nome : ""].join(" ")).replace(/-/g, " ");
        return hay.indexOf(needle) !== -1;
      });
      if (!all.length) {
        grid.innerHTML = '<p class="posts__empty">Ainda não há publicações. Os primeiros conteúdos da equipe aparecerão aqui.</p>';
      } else if (!list.length) {
        grid.innerHTML = '<p class="posts__empty">Nenhuma publicação encontrada para esta busca. Tente outro termo ou escolha “Todas”.</p>';
      } else {
        grid.innerHTML = list.map(function (p) { return window.ALM_postCard(p); }).join("");
      }
    };

    S.posts.list().then(function (list) {
      all = list;
      var cats = ["Todas"];
      list.forEach(function (p) { if (p.categoria && cats.indexOf(p.categoria) === -1) { cats.push(p.categoria); } });
      filters.innerHTML = cats.length > 2 ? cats.map(function (c) {
        return '<button class="filter" type="button" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>';
      }).join("") : "";
      draw();
    }).catch(function (e) {
      grid.innerHTML = '<p class="posts__empty">Não foi possível carregar as publicações (' + esc(e.message) + '). Recarregue a página.</p>';
    });

    filters.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) { return; }
      cat = b.getAttribute("data-cat");
      filters.querySelectorAll(".filter").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      draw();
    });
    var t;
    search.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { q = search.value; draw(); }, 120); });
  }

  /* ============================ ARTIGO ============================ */
  var box = document.getElementById("article");
  if (box) {
    var params = new URLSearchParams(location.search);
    var slug = params.get("slug") || (location.pathname.match(/\/conteudos\/([a-z0-9-]+)\/?$/) || [])[1]; // suporta URL amigável via rewrite
    var preview = params.get("preview") === "1";

    var load = preview
      ? Promise.resolve((function () { try { return JSON.parse(sessionStorage.getItem("alm:preview")); } catch (e) { return null; } })())
      : S.posts.get(slug).then(function (p) {
          if (p && p.status !== "publicado") {
            return S.auth.session().then(function (s) { return s ? p : null; }); // rascunho só para quem está logado
          }
          return p;
        });

    Promise.all([load, teamReady]).then(function (r) {
      var p = r[0];
      if (!p) { renderNotFound(); return; }
      renderArticle(p, preview);
      if (!preview) { renderRelated(p); }
    }).catch(renderNotFound);
  }

  function renderNotFound() {
    document.title = "Publicação não encontrada — Almeida, Leal & Molina Advogados";
    box.innerHTML = '<div class="container article__notfound"><h1>Publicação não encontrada</h1>' +
      '<p>O endereço pode ter mudado ou a publicação foi removida.</p>' +
      '<a class="btn btn--line-dark" href="./">Ver todas as publicações</a></div>';
  }

  function setMeta(name, value, attr) {
    attr = attr || "name";
    var m = document.querySelector("meta[" + attr + '="' + name + '"]');
    if (m) { m.setAttribute("content", value); }
  }

  function renderArticle(p, preview) {
    var autor = U.pessoa(p.autor);
    var url = location.origin + location.pathname + "?slug=" + encodeURIComponent(p.slug);
    var html = window.ALM_SANITIZE(p.conteudo);
    document.title = p.titulo + " — Almeida, Leal & Molina Advogados";
    setMeta("description", p.resumo || p.titulo);
    setMeta("og:title", p.titulo, "property");
    setMeta("og:description", p.resumo || "", "property");
    if (p.capa && /^https?:/.test(p.capa)) { setMeta("og:image", p.capa, "property"); }

    var meta = [];
    if (p.categoria) { meta.push('<span class="article__cat">' + esc(p.categoria) + '</span>'); }
    if (p.data) { meta.push('<time datetime="' + esc(p.data) + '">' + U.formatDate(p.data) + '</time>'); }
    meta.push("<span>" + U.readingTime(html) + " min de leitura</span>");

    var authorBlock = autor ? (
      '<a class="author" href="../#equipe/' + autor.slug + '">' +
        (autor.foto ? '<img src="' + esc(U.photoSmall(autor.foto)) + '" alt="" width="56" height="56" loading="lazy">' : '<span class="author__mono">' + esc(U.initials(autor.nome)) + '</span>') +
        '<span><span class="author__name">' + esc(autor.nomeCurto || autor.nome) + '</span><span class="author__role">' + esc(autor.cargo) + '</span></span>' +
      '</a>') : "";

    var enc = encodeURIComponent;
    var share =
      '<div class="share" aria-label="Compartilhar">' +
        '<span class="share__label">Compartilhar</span>' +
        '<a class="share__btn" href="https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url) + '" target="_blank" rel="noopener">LinkedIn</a>' +
        '<a class="share__btn" href="https://wa.me/?text=' + enc(p.titulo + " — " + url) + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '<a class="share__btn" href="mailto:?subject=' + enc(p.titulo) + '&body=' + enc(url) + '">E-mail</a>' +
        '<button class="share__btn" type="button" id="copy-link">Copiar link</button>' +
      '</div>';

    box.innerHTML =
      (preview ? '<div class="preview-bar">Pré-visualização do painel — esta versão ainda não foi salva/publicada.</div>' : "") +
      '<header class="article__head"><div class="container container--narrow">' +
        '<a class="article__back" href="./">Conteúdos</a>' +
        '<div class="article__meta">' + meta.join("") + '</div>' +
        '<h1 class="article__title">' + esc(p.titulo) + '</h1>' +
        (p.resumo ? '<p class="article__lead">' + esc(p.resumo) + '</p>' : "") +
        authorBlock +
      '</div></header>' +
      (p.capa ? '<figure class="article__cover container"><img src="' + esc(p.capa) + '" alt=""></figure>' : "") +
      '<div class="container container--narrow">' +
        '<div class="prose">' + html + '</div>' +
        (p.linkExterno ? '<aside class="external"><p>Publicado originalmente no LinkedIn.</p><a class="btn btn--brass" href="' + esc(p.linkExterno) + '" target="_blank" rel="noopener">Ler o artigo completo no LinkedIn</a></aside>' : "") +
        share +
      '</div>';

    var copy = document.getElementById("copy-link");
    if (copy) {
      copy.addEventListener("click", function () {
        var done = function () { copy.textContent = "Link copiado"; setTimeout(function () { copy.textContent = "Copiar link"; }, 2000); };
        if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done, function () { prompt("Copie o link:", url); }); }
        else { prompt("Copie o link:", url); }
      });
    }

    /* Dados estruturados do artigo (SEO) */
    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Article", headline: p.titulo, description: p.resumo || "",
      datePublished: p.data || undefined, dateModified: p.atualizadoEm || undefined,
      author: autor ? { "@type": "Person", name: autor.nome, url: autor.linkedin || undefined } : undefined,
      publisher: { "@type": "LegalService", name: "Almeida, Leal & Molina Advogados" }, mainEntityOfPage: url
    });
    document.head.appendChild(ld);
  }

  function renderRelated(p) {
    S.posts.list().then(function (list) {
      var others = list.filter(function (x) { return x.id !== p.id; });
      others.sort(function (a, b) { return (b.categoria === p.categoria) - (a.categoria === p.categoria); });
      if (!others.length) { return; }
      document.getElementById("related-list").innerHTML = others.slice(0, 3).map(function (x) { return window.ALM_postCard(x); }).join("");
      document.getElementById("related").hidden = false;
    });
  }
})();
