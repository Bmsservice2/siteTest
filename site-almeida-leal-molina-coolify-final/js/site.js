/* ============================================================
   ALMEIDA, LEAL & MOLINA — Conteúdo dinâmico da página
   Renderiza a partir das fontes únicas de dados:
   - js/data/areas.js   → Áreas de Atuação (acordeão)
   - js/data/equipe.js  → Sócios, Equipe (filtros) e painel de perfil
   - js/config.js       → unidades, WhatsApp e e-mail
   - ALM_STORE          → últimas publicações do blog
   Roda antes do motion.js (que só anima o que já existe).
   ============================================================ */
(function () {
  "use strict";
  var U = window.ALM_UTILS;
  var C = window.ALM_CONFIG;
  var EQUIPE = window.ALM_EQUIPE || [];
  var esc = U.esc;

  var ICONS = {
    balanca: '<path d="M16 5v22M9 27h14M6 10h20M6 10l-4 8a4 4 0 0 0 8 0l-4-8Zm20 0-4 8a4 4 0 0 0 8 0l-4-8Z"/>',
    estrutura: '<rect x="12" y="3" width="8" height="6"/><rect x="3" y="23" width="8" height="6"/><rect x="21" y="23" width="8" height="6"/><path d="M16 9v7M7 23v-4h18v4"/>',
    documento: '<path d="M8 3h11l6 6v20H8z"/><path d="M19 3v6h6M12 15h9M12 19h9M12 23h6"/>',
    pilar: '<path d="M4 29h24M6 25h20M5 11h22L16 4 5 11ZM9 11v14M14 11v14M18 11v14M23 11v14"/>',
    pessoas: '<circle cx="11" cy="11" r="4"/><circle cx="22" cy="12" r="3"/><path d="M3 27c0-4.5 3.6-8 8-8s8 3.5 8 8M19 20.5c3.8-.8 8 1.8 8 6.5"/>'
  };
  var LINKEDIN_SVG = '<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4v-11Z"/></svg>';
  var AREA_LABEL = { tributario: "Tributário", contencioso: "Contencioso", contratos: "Contratos", societario: "Societário", trabalhista: "Trabalhista", consultivo: "Consultivo", gestao: "Gestão" };

  /* ---------- Foto ou placeholder ---------- */
  function photo(p, opts) {
    if (p.foto) { return U.picture(p.foto, p.nome, opts); }
    return '<div class="photo-ph" role="img" aria-label="Foto de ' + esc(p.nome) + ' a ser incluída">' +
      '<span class="photo-ph__mono" aria-hidden="true">' + esc(U.initials(p.nome)) + '</span>' +
      '<span class="photo-ph__note" aria-hidden="true">Foto em breve</span></div>';
  }
  function linkedin(p, label) {
    if (!p.linkedin) { return ""; }
    return '<a class="linkedin" href="' + esc(p.linkedin) + '" target="_blank" rel="noopener" aria-label="LinkedIn de ' + esc(p.nomeCurto || p.nome) + ' (abre em nova aba)">' + LINKEDIN_SVG + '<span>' + (label || "LinkedIn") + '</span></a>';
  }

  /* ============================================================
     CONTATO: WhatsApp / e-mail / unidades a partir do config
     ============================================================ */
  function applyContact() {
    document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = U.whatsUrl(); });
    document.querySelectorAll("[data-wa-text]").forEach(function (s) { s.textContent = C.whatsapp.exibicao; });
    document.querySelectorAll("[data-mail]").forEach(function (a) { a.href = "mailto:" + C.email; if (!a.children.length) { a.textContent = C.email; } });
  }

  function renderOffices() {
    var box = document.getElementById("offices-list");
    if (!box) { return; }
    box.innerHTML = C.unidades.map(function (u, i) {
      var q = encodeURIComponent(u.mapa);
      return '<article class="office">' +
        '<h3 class="office__city">' + esc(u.cidade) + '</h3>' +
        '<address>' + u.linhas.map(esc).join("<br>") + '</address>' +
        '<div class="office__map" id="map-' + i + '">' +
          '<button class="office__map-btn" type="button" data-map="' + q + '" aria-label="Carregar mapa da unidade ' + esc(u.cidade) + '">' +
            '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>' +
            '<span>Ver no mapa</span></button></div>' +
        '<a class="office__link" href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener">Abrir no Google Maps</a>' +
      '</article>';
    }).join("");
    /* Mapa sob demanda: o iframe do Google só carrega ao clicar (leve) */
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-map]");
      if (!btn) { return; }
      var f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=" + btn.getAttribute("data-map") + "&output=embed";
      f.title = "Mapa da unidade";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      btn.replaceWith(f);
    });
  }

  /* ============================================================
     ÁREAS DE ATUAÇÃO — acordeão acessível
     ============================================================ */
  function renderAreas() {
    var list = document.getElementById("areas-list");
    if (!list) { return; }
    list.innerHTML = (window.ALM_AREAS || []).map(function (a) {
      var people = EQUIPE.filter(function (p) { return p.areas.some(function (x) { return a.equipe.indexOf(x) !== -1; }); });
      var detail = (a.detalhe || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
      var chips = people.map(function (p) {
        var img = p.foto
          ? '<img src="' + U.esc(U.photoSmall(p.foto)) + '" alt="" width="32" height="32" loading="lazy">'
          : '<span class="chip__mono" aria-hidden="true">' + esc(U.initials(p.nome)) + '</span>';
        return '<button class="chip" type="button" data-profile="' + p.slug + '">' + img + esc(p.nomeCurto || p.nome) + '</button>';
      }).join("");
      return '<li class="area" id="area-' + a.id + '">' +
        '<h3 class="area__heading"><button class="area__head" type="button" aria-expanded="false" aria-controls="panel-' + a.id + '">' +
          '<svg class="area__icon" aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">' + (ICONS[a.icone] || "") + '</svg>' +
          '<span class="area__text"><span class="area__title">' + esc(a.titulo) + '</span>' +
          '<span class="area__summary">' + esc(a.resumo) + '</span>' +
          '<span class="area__tags"><span class="tag">Consultivo</span><span class="tag">Contencioso</span></span></span>' +
          '<span class="area__toggle" aria-hidden="true"></span>' +
        '</button></h3>' +
        '<div class="area__panel" id="panel-' + a.id + '" role="region" aria-label="' + esc(a.titulo) + '"><div class="area__panel-inner"><div class="area__panel-content">' +
          detail +
          (chips ? '<p class="area__people-label">Profissionais relacionados</p><div class="chips">' + chips + '</div>' : "") +
        '</div></div></div>' +
      '</li>';
    }).join("");

    list.onclick = function (e) { // onclick (não addEventListener): re-renderizar não duplica o handler
      var head = e.target.closest(".area__head");
      if (!head) { return; }
      var li = head.closest(".area"); // o botão fica dentro de um <h3>
      var open = !li.classList.contains("is-open");
      li.classList.toggle("is-open", open);
      head.setAttribute("aria-expanded", open ? "true" : "false");
      if (window.ScrollTrigger) { setTimeout(function () { window.ScrollTrigger.refresh(); }, 450); }
    };
  }

  /* ============================================================
     SÓCIOS
     ============================================================ */
  function renderPartners() {
    var box = document.getElementById("partners-list");
    if (!box || box.children.length) { return; } // sócios já escritos no HTML
    box.innerHTML = EQUIPE.filter(function (p) { return p.socio; }).map(function (p) {
      return '<article class="partner">' +
        '<button class="partner__photo-wrap" type="button" data-profile="' + p.slug + '" aria-label="Abrir perfil de ' + esc(p.nome) + '">' + photo(p) + '</button>' +
        '<div class="partner__body">' +
          '<h3 class="partner__name">' + esc(p.nome) + '</h3>' +
          '<p class="partner__role">' + esc(p.cargo) + (p.oab ? " · " + esc(p.oab) : "") + '</p>' +
          (p.destaque ? '<p class="partner__highlight">' + esc(p.destaque) + '</p>' : "") +
          '<div class="partner__actions">' +
            '<button class="partner__more link-arrow" type="button" data-profile="' + p.slug + '">Formação e trajetória</button>' +
            linkedin(p) +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  /* ============================================================
     EQUIPE + filtros
     ============================================================ */
  function renderTeam() {
    var list = document.getElementById("team-list");
    var filters = document.getElementById("team-filters");
    if (!list) { return; }
    var members = EQUIPE.filter(function (p) { return !p.socio; });

    if (!list.children.length) list.innerHTML = members.map(function (p) { // equipe já escrita no HTML
      return '<li class="member" data-areas="' + p.areas.join(" ") + '">' +
          '<div class="member__photo">' + photo(p, { small: true }) + '</div>' +
          '<h3 class="member__name"><button class="member__link" type="button" data-profile="' + p.slug + '">' + esc(p.nome) + '</button></h3>' +
          '<p class="member__role">' + esc(p.cargo) + '</p>' +
        '</li>';
    }).join("");

    if (!filters) { return; }
    var used = {};
    members.forEach(function (p) { p.areas.forEach(function (a) { used[a] = true; }); });
    filters.innerHTML = (window.ALM_FILTROS_EQUIPE || []).filter(function (f) { return f.id === "todos" || used[f.id]; }).map(function (f) {
      return '<button class="filter" type="button" data-filter="' + f.id + '" aria-pressed="' + (f.id === "todos") + '">' + esc(f.rotulo) + '</button>';
    }).join("");

    filters.onclick = function (e) {
      var b = e.target.closest("[data-filter]");
      if (!b) { return; }
      var id = b.getAttribute("data-filter");
      filters.querySelectorAll(".filter").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var shown = 0;
      list.querySelectorAll(".member").forEach(function (li) {
        var ok = id === "todos" || li.getAttribute("data-areas").split(" ").indexOf(id) !== -1;
        li.hidden = !ok;
        if (ok) { shown++; li.style.opacity = "1"; li.style.transform = "none"; }
      });
      document.getElementById("team-empty").hidden = shown > 0;
      if (window.ScrollTrigger) { window.ScrollTrigger.refresh(); }
    };
  }

  /* ============================================================
     PAINEL DE PERFIL — deep link: #equipe/slug
     ============================================================ */
  var drawer = document.getElementById("profile-drawer");
  var drawerBody = document.getElementById("drawer-body");
  var lastFocus = null;

  function profileHTML(p) {
    var bio = (p.bio || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    var form = (p.formacao || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var tags = p.areas.map(function (a) { return '<span class="tag">' + esc(AREA_LABEL[a] || a) + '</span>'; }).join("");
    var foto = p.fotoAmbiente ? Object.assign({}, p, { foto: p.fotoAmbiente }) : p;
    return '<div class="profile__photo">' + photo(foto, { eager: true }) + '</div>' +
      '<div class="profile__content">' +
        '<p class="profile__role">' + esc(p.cargo) + '</p>' +
        '<h2 class="profile__name" id="drawer-name">' + esc(p.nome) + '</h2>' +
        (p.oab ? '<p class="profile__oab">' + esc(p.oab) + '</p>' : "") +
        '<div class="profile__tags">' + tags + '</div>' +
        (bio ? '<div class="profile__block"><h3>Atuação</h3>' + bio + '</div>'
             : '<div class="profile__block"><p class="profile__pending">Biografia em atualização.</p></div>') +
        (form ? '<div class="profile__block"><h3>Formação</h3><ul>' + form + '</ul></div>' : "") +
        '<div class="profile__actions">' +
          linkedin(p, "Ver LinkedIn") +
          '<a class="btn btn--brass" href="' + U.whatsUrl() + '" target="_blank" rel="noopener">Falar com o escritório</a>' +
        '</div>' +
      '</div>';
  }

  function openProfile(slug, push) {
    var p = U.pessoa(slug);
    if (!p || !drawer) { return; }
    lastFocus = document.activeElement;
    drawerBody.innerHTML = profileHTML(p);
    drawer.hidden = false;
    drawer.querySelector(".drawer__panel").scrollTop = 0;
    document.body.classList.add("is-locked");
    if (window.__bmsLenis) { window.__bmsLenis.stop(); }
    requestAnimationFrame(function () { drawer.classList.add("is-open"); drawer.querySelector(".drawer__close").focus(); });
    if (push !== false) { history.replaceState(null, "", "#equipe/" + slug); }
    document.title = p.nome + " — Almeida, Leal & Molina Advogados";
  }
  function closeProfile() {
    if (!drawer || drawer.hidden) { return; }
    drawer.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (window.__bmsLenis) { window.__bmsLenis.start(); }
    setTimeout(function () { drawer.hidden = true; }, 450);
    if (/^#equipe\//.test(location.hash)) { history.replaceState(null, "", location.pathname + location.search); }
    document.title = "Almeida, Leal & Molina Advogados";
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-profile]");
    if (t) { e.preventDefault(); openProfile(t.getAttribute("data-profile")); return; }
    if (e.target.closest("[data-close]")) { closeProfile(); }
  });
  document.addEventListener("keydown", function (e) {
    if (!drawer || drawer.hidden) { return; }
    if (e.key === "Escape") { closeProfile(); }
    if (e.key === "Tab") { // mantém o foco dentro do painel
      var f = drawer.querySelectorAll("a[href], button:not([disabled])");
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function fromHash() {
    var m = location.hash.match(/^#equipe\/([a-z0-9-]+)/);
    if (m) { openProfile(m[1], false); }
  }
  window.addEventListener("hashchange", fromHash);

  /* ============================================================
     ÚLTIMAS PUBLICAÇÕES (via ALM_STORE)
     ============================================================ */
  /* Card de publicação: js/lib/post-card.js (compartilhado com o blog) */

  function renderLatest() {
    var box = document.getElementById("latest-posts");
    if (!box || !window.ALM_STORE) { return; }
    window.ALM_STORE.posts.list().then(function (list) {
      if (!list.length) {
        box.innerHTML = '<p class="posts__empty">As primeiras publicações da equipe estarão aqui em breve.</p>';
        return;
      }
      box.innerHTML = list.slice(0, 3).map(function (p) { return window.ALM_postCard(p); }).join("");
    }).catch(function () {
      box.innerHTML = '<p class="posts__empty">Não foi possível carregar as publicações agora. <a class="link-arrow" href="conteudos/">Abrir a página de conteúdos</a></p>';
    });
  }

  /* ============================================================
     VÍDEO DO HERO — fonte única em ALM_CONFIG.heroVideo
     YouTube como fundo puro: sem controles, sem interação, sem
     branding clicável (o iframe fica com pointer-events: none e é
     escalado para esconder as bordas). Carrega depois do "load"
     para não competir com o carregamento da página.
     ============================================================ */
  function loadHeroVideo() {
    var cfg = C.heroVideo || {};
    if (!cfg.enabled) { return; }
    /* Só respeita "movimento reduzido" se configurado: em alguns sistemas
       (ex.: GNOME/Fedora com animações desligadas) isso vem ligado por
       padrão e o vídeo institucional simplesmente não aparecia. */
    if (cfg.respeitarMovimentoReduzido && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { return; }

    if (cfg.provider === "youtube" && cfg.id) {
      var box = document.getElementById("hero-youtube");
      if (!box) { return; }
      var id = encodeURIComponent(cfg.id);
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id +
        "?autoplay=1&mute=1&loop=1&playlist=" + id +
        "&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&cc_load_policy=0&enablejsapi=1" +
        "&origin=" + encodeURIComponent(location.origin);
      f.title = "Vídeo institucional (fundo decorativo)";
      f.setAttribute("tabindex", "-1");
      f.setAttribute("aria-hidden", "true");
      f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      f.setAttribute("frameborder", "0");
      box.appendChild(f);
      /* Só revela depois de ~2,2s: esconde o "flash" inicial do player
         (título e logo que o YouTube mostra no primeiro segundo). */
      f.addEventListener("load", function () {
        setTimeout(function () { box.classList.add("is-playing"); }, 2200);
      });
      return;
    }

    if (cfg.provider === "local" && cfg.src) {
      var v = document.getElementById("hero-video");
      if (!v) { return; }
      if (cfg.webm) { var sw = document.createElement("source"); sw.src = cfg.webm; sw.type = "video/webm"; v.appendChild(sw); }
      var sm = document.createElement("source"); sm.src = cfg.src; sm.type = "video/mp4"; v.appendChild(sm);
      v.addEventListener("canplay", function () {
        v.classList.add("is-playing");
        var pr = v.play(); if (pr && pr.catch) { pr.catch(function () {}); }
      }, { once: true });
      v.load();
    }
  }

  /* ---------- Inicialização ---------- */
  applyContact();
  renderOffices();
  renderAreas();
  renderPartners();
  renderTeam();
  if (window.ALM_STORE) {
    window.ALM_STORE.applySettings().then(applyContact);
    document.dispatchEvent(new CustomEvent("alm:team-rendered"));
  }
  renderLatest();
  if (document.readyState === "complete") { loadHeroVideo(); } else { window.addEventListener("load", loadHeroVideo); }
  fromHash();
})();
