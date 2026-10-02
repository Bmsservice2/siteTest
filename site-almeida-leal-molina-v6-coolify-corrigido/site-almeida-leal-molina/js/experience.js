/* ============================================================
   ALM × BMS — CAMADA DE EXPERIÊNCIA (interações)
   Carregado com "defer" depois de site.js / main.js / motion.js.
   Tudo é aprimoramento progressivo: se este arquivo falhar, o site
   continua completo. Cada recurso checa se o elemento existe, então
   o mesmo arquivo serve a home, o blog e o artigo.

   Recursos:
     1. Barra de progresso de leitura     8. Glossário jurídico (pop-over)
     2. Trilho lateral de seções          9. Assistente de atendimento
     3. Cursor personalizado             10. Aviso discreto (toast)
     4. Texto digitado no hero           11. Aviso de privacidade (LGPD)
     5. Balança da justiça interativa    12. Martelo (gavel) no contato
     6. Números com contagem             13. Spotlight nos sócios
     7. Divisores com coluna clássica    14. Reveals sem GSAP

   Observação (Provimento OAB 205/2021): a publicidade da advocacia
   deve ser informativa e discreta. Por isso NÃO há pop-up de saída,
   contador de urgência ou chamadas insistentes: o aviso aparece uma
   vez por visita, só depois de interesse real (rolagem/tempo), e o
   assistente só abre quando o visitante pede.
   ============================================================ */
(function () {
  "use strict";
  var C = window.ALM_CONFIG || {};
  var U = window.ALM_UTILS || { esc: function (s) { return String(s); } };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isHome = !!document.querySelector(".hero");
  var root = U.root ? U.root() : "";

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (html != null) { e.innerHTML = html; } return e; }
  function store(key, val) { try { if (val === undefined) { return sessionStorage.getItem(key); } sessionStorage.setItem(key, val); } catch (e) { return null; } }
  function lstore(key, val) { try { if (val === undefined) { return localStorage.getItem(key); } localStorage.setItem(key, val); } catch (e) { return null; } }
  function lockScroll(on) {
    document.body.classList.toggle("is-locked", on);
    if (window.__bmsLenis) { on ? window.__bmsLenis.stop() : window.__bmsLenis.start(); }
  }

  /* ============ 1. Barra de progresso ============ */
  var bar = el("div", "xp-progress", "<span></span>");
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var barFill = bar.firstChild;
  function onScrollProgress() {
    var h = document.documentElement.scrollHeight - innerHeight;
    barFill.style.setProperty("--p", h > 0 ? Math.min(1, scrollY / h) : 0);
  }
  addEventListener("scroll", onScrollProgress, { passive: true });
  onScrollProgress();

  /* ============ 2. Trilho lateral de seções (home) ============ */
  if (isHome && "IntersectionObserver" in window) {
    var sections = [
      ["escritorio", "Escritório"], ["atuacao", "Atuação"], ["socios", "Sócios"],
      ["equipe", "Equipe"], ["conteudos", "Conteúdos"], ["contato", "Contato"]
    ].filter(function (s) { return document.getElementById(s[0]); });
    var rail = el("nav", "xp-rail is-hidden");
    rail.setAttribute("aria-label", "Seções da página");
    rail.innerHTML = sections.map(function (s) { return '<a href="#' + s[0] + '"><i></i><span>' + s[1] + "</span></a>"; }).join("");
    document.body.appendChild(rail);
    var railLinks = rail.querySelectorAll("a");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        var id = en.target.id;
        railLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + id); });
        var dark = en.target.classList.contains("section--slate") || en.target.classList.contains("section--ink");
        rail.classList.toggle("on-dark", dark);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(document.getElementById(s[0])); });
    addEventListener("scroll", function () { rail.classList.toggle("is-hidden", scrollY < innerHeight * 0.7); }, { passive: true });
  }

  /* ============ 3. Cursor ============ */
  if (fine && !reduce) {
    var ring = el("div", "xp-cursor is-hidden"), dot = el("div", "xp-cursor-dot is-hidden");
    ring.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring); document.body.appendChild(dot);
    document.documentElement.classList.add("xp-has-cursor");
    var mx = 0, my = 0, rx = 0, ry = 0;
    addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
      ring.classList.remove("is-hidden"); dot.classList.remove("is-hidden");
    }, { passive: true });
    document.addEventListener("mouseleave", function () { ring.classList.add("is-hidden"); dot.classList.add("is-hidden"); });
    document.addEventListener("mouseover", function (e) {
      ring.classList.toggle("is-hover", !!e.target.closest("a, button, [role=button], .member, .partner__photo-wrap, .xp-term"));
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ============ 4. Texto digitado no hero ============ */
  var sub = document.querySelector(".hero__subtitle");
  if (sub) {
    var areas = (window.ALM_AREAS || []).map(function (a) { return a.titulo; });
    if (areas.length) {
      var typed = el("span", "hero__typed");
      typed.setAttribute("aria-hidden", "true"); // o texto completo já está no subtítulo (leitores de tela)
      sub.appendChild(typed);
      if (reduce) { typed.innerHTML = "Atuação em <b>" + areas.join(", ") + "</b>"; typed.style.setProperty("--x", 0); }
      else {
        var ai = 0, ci = 0, del = false;
        var tick = function () {
          var word = areas[ai];
          ci += del ? -1 : 1;
          typed.innerHTML = "Atuação em <b>" + U.esc(word.slice(0, ci)) + "</b>";
          var wait = del ? 45 : 85;
          if (!del && ci === word.length) { del = true; wait = 1700; }
          else if (del && ci === 0) { del = false; ai = (ai + 1) % areas.length; wait = 350; }
          setTimeout(tick, wait);
        };
        setTimeout(tick, 1600);
      }
    }
  }

  /* ============ 5. Balança da justiça (hero) ============ */
  var hero = document.querySelector(".hero");
  if (hero) {
    var scale = el("div", "xp-scale");
    scale.setAttribute("aria-hidden", "true");
    scale.innerHTML =
      '<svg viewBox="0 0 320 300" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
        '<defs><radialGradient id="xpg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c9b088" stop-opacity=".35"/><stop offset="1" stop-color="#c9b088" stop-opacity="0"/></radialGradient></defs>' +
        '<circle class="xp-scale__glow" cx="160" cy="62" r="90" fill="url(#xpg)" stroke="none"/>' +
        /* coluna e base */
        '<path class="draw" style="--len:260" d="M160 50 V262"/>' +
        '<path class="draw d2" style="--len:220" d="M110 280 H210 M124 262 H196 L204 280 M124 262 L116 280"/>' +
        '<circle class="draw d2" style="--len:40" cx="160" cy="44" r="6"/>' +
        /* travessão e pratos */
        '<g class="xp-scale__beam">' +
          '<path class="draw d3" style="--len:280" d="M40 62 H280"/>' +
          '<g class="xp-scale__pan xp-scale__pan--l">' +
            '<path class="draw d4" style="--len:200" d="M40 62 L12 150 M40 62 L68 150"/>' +
            '<path class="draw d4" style="--len:160" d="M4 150 H76 Q70 180 40 180 Q10 180 4 150 Z"/>' +
          '</g>' +
          '<g class="xp-scale__pan xp-scale__pan--r">' +
            '<path class="draw d4" style="--len:200" d="M280 62 L252 150 M280 62 L308 150"/>' +
            '<path class="draw d4" style="--len:160" d="M244 150 H316 Q310 180 280 180 Q250 180 244 150 Z"/>' +
          '</g>' +
        '</g>' +
      '</svg>';
    hero.appendChild(scale);
    var beam = scale.querySelector(".xp-scale__beam");
    var panL = scale.querySelector(".xp-scale__pan--l"), panR = scale.querySelector(".xp-scale__pan--r");
    var setTilt = function (deg) {
      beam.style.setProperty("--tilt", deg + "deg");
      // os pratos ficam sempre na vertical (contra-rotação em torno do ponto de suspensão)
      panL.style.transform = "rotate(" + (-deg) + "deg)"; panL.style.transformOrigin = "40px 62px";
      panR.style.transform = "rotate(" + (-deg) + "deg)"; panR.style.transformOrigin = "280px 62px";
    };
    if (!reduce) {
      // Equilíbrio: pende suavemente com o mouse e volta ao centro (a "justiça" se reequilibra)
      var back;
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        setTilt(Math.max(-9, Math.min(9, x * 18)));
        clearTimeout(back); back = setTimeout(function () { setTilt(0); }, 900);
      });
      hero.addEventListener("mouseleave", function () { setTilt(0); });
      // oscilação inicial, como uma balança que acaba de ser colocada na mesa
      setTimeout(function () { setTilt(-6); }, 2600);
      setTimeout(function () { setTilt(4); }, 3700);
      setTimeout(function () { setTilt(0); }, 4800);
    }
  }

  /* ============ 6. Números (fatos do próprio site, nada inventado) ============ */
  var aboutSection = document.getElementById("escritorio");
  if (aboutSection && window.ALM_EQUIPE) {
    var eq = window.ALM_EQUIPE;
    var stats = [
      [eq.filter(function (p) { return p.socio; }).length, "", "sócios à frente do escritório"],
      [eq.length, "", "profissionais na equipe"],
      [(window.ALM_AREAS || []).length, "", "áreas de atuação, consultivo e contencioso"],
      [(C.unidades || []).length, "", "unidades: Rio de Janeiro e São Paulo"]
    ];
    var band = el("section", "xp-stats");
    band.setAttribute("aria-label", "O escritório em números");
    band.innerHTML = '<div class="container xp-stats__grid">' + stats.map(function (s) {
      return '<div class="xp-stat"><span class="xp-stat__num" data-to="' + s[0] + '">' + s[0] + (s[1] ? "<sup>" + s[1] + "</sup>" : "") + '</span><span class="xp-stat__label">' + s[2] + "</span></div>";
    }).join("") + "</div>";
    aboutSection.parentNode.insertBefore(band, aboutSection.nextSibling);
    if (!reduce && "IntersectionObserver" in window) {
      var nums = band.querySelectorAll("[data-to]");
      nums.forEach(function (n) { n.firstChild.nodeValue = "0"; });
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) { return; }
        obs.disconnect();
        nums.forEach(function (n, i) {
          var to = +n.getAttribute("data-to"), t0 = null, dur = 1400 + i * 150;
          (function step(t) {
            if (!t0) { t0 = t; }
            var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            n.firstChild.nodeValue = String(Math.round(to * e));
            if (k < 1) { requestAnimationFrame(step); }
          })(performance.now());
        });
      }, { threshold: 0.4 }).observe(band);
    }
  }

  /* ============ 7. Divisores com coluna clássica ============ */
  var COLUMN = '<svg viewBox="0 0 30 44" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M3 4 H27 M5 8 H25 M8 8 V36 M12 8 V36 M18 8 V36 M22 8 V36 M5 36 H25 M3 40 H27"/></svg>';
  ["atuacao", "socios", "equipe", "conteudos"].forEach(function (id) {
    var sec = document.getElementById(id);
    var c = sec && sec.querySelector(".container");
    if (!c) { return; }
    var d = el("div", "xp-divider", COLUMN);
    d.setAttribute("aria-hidden", "true");
    d.style.marginBottom = "clamp(14px,2vw,24px)";
    c.insertBefore(d, c.firstChild);
  });
  if ("IntersectionObserver" in window) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); dio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll(".xp-divider").forEach(function (d) { dio.observe(d); });
  } else { document.querySelectorAll(".xp-divider").forEach(function (d) { d.classList.add("is-in"); }); }

  /* ============ 8. Glossário jurídico ============ */
  var GLOSSARIO = {
    "consultivo": ["Consultivo", "Atuação preventiva: orientação, pareceres e estruturação de decisões antes que surja um conflito."],
    "contencioso": ["Contencioso", "Atuação em conflitos já instaurados: defesa e condução de processos administrativos e judiciais."],
    "Procuradoria da Fazenda Nacional": ["Procuradoria da Fazenda Nacional", "Órgão da Advocacia-Geral da União que representa a União em matéria tributária e na cobrança da dívida ativa federal."],
    "Conselho de Contribuintes": ["Conselho de Contribuintes", "Tribunal administrativo que julga, em grau de recurso, litígios entre o contribuinte e o fisco estadual."],
    "julgamento administrativo": ["Julgamento administrativo", "Discussão de autuações fiscais perante órgãos da própria Administração, antes (ou em vez) de levar o caso ao Judiciário."]
  };
  var pop = null;
  function closePop() { if (pop) { pop.classList.remove("is-open"); } }
  function openPop(btn) {
    var g = GLOSSARIO[btn.getAttribute("data-term")];
    if (!g) { return; }
    if (!pop) { pop = el("div", "xp-pop"); pop.setAttribute("role", "tooltip"); pop.id = "xp-pop"; document.body.appendChild(pop); }
    pop.innerHTML = "<strong>" + U.esc(g[0]) + "</strong>" + U.esc(g[1]);
    var r = btn.getBoundingClientRect();
    pop.style.left = Math.max(12, Math.min(scrollX + r.left, scrollX + innerWidth - 312)) + "px";
    pop.style.top = (scrollY + r.bottom + 10) + "px";
    btn.setAttribute("aria-describedby", "xp-pop");
    requestAnimationFrame(function () { pop.classList.add("is-open"); });
  }
  (function wrapTerms() {
    var scopes = document.querySelectorAll("#escritorio .about__text p, #atuacao .modes");
    var done = {};
    scopes.forEach(function (scope) {
      var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      var nodes = []; while (walker.nextNode()) { nodes.push(walker.currentNode); }
      nodes.forEach(function (node) {
        Object.keys(GLOSSARIO).forEach(function (term) {
          if (done[term] || !node.parentNode) { return; }
          var idx = node.nodeValue.toLowerCase().indexOf(term.toLowerCase());
          if (idx === -1) { return; }
          var after = node.splitText(idx); var rest = after.splitText(term.length);
          var b = el("button", "xp-term"); b.type = "button"; b.setAttribute("data-term", term); b.textContent = after.nodeValue;
          after.parentNode.replaceChild(b, after);
          done[term] = true; node = rest;
        });
      });
    });
  })();
  document.addEventListener("mouseover", function (e) { var t = e.target.closest(".xp-term"); if (t && fine) { openPop(t); } });
  document.addEventListener("mouseout", function (e) { if (e.target.closest(".xp-term")) { closePop(); } });
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".xp-term");
    if (t) { e.preventDefault(); openPop(t); return; }
    if (!e.target.closest(".xp-pop")) { closePop(); }
  });
  document.addEventListener("focusin", function (e) { var t = e.target.closest && e.target.closest(".xp-term"); if (t) { openPop(t); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closePop(); } });
  addEventListener("scroll", closePop, { passive: true });

  /* ============ 9. Assistente de atendimento ============ */
  var ICON = {
    balanca: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v18M7 21h10M4 7h16M4 7l-3 6a3 3 0 0 0 6 0L4 7Zm16 0-3 6a3 3 0 0 0 6 0l-3-6Z"/></svg>',
    doc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5M9 13h8M9 17h6"/></svg>',
    duvida: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/></svg>',
    predio: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"/></svg>',
    pessoa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
    escudo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/></svg>',
    martelo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m14 5 5 5M11 8l5 5M12.5 6.5l5 5-3 3-5-5zM9.5 12.5 3 19M2 22h10"/></svg>'
  };
  var areaOpts = (window.ALM_AREAS || []).map(function (a) { return [a.titulo, ICON.balanca]; }).concat([["Ainda não sei", ICON.duvida]]);
  var STEPS = [
    { key: "area", q: "Em qual área está a sua demanda?", opts: areaOpts },
    { key: "tipo", q: "Em que momento você está?", opts: [
      ["Quero orientação antes de decidir", ICON.escudo],
      ["Já existe processo, autuação ou notificação", ICON.martelo],
      ["Não tenho certeza", ICON.duvida]
    ] },
    { key: "perfil", q: "Você está falando em nome de…", opts: [["Uma empresa", ICON.predio], ["Pessoa física", ICON.pessoa]] }
  ];
  var modal = null, answers = {}, stepIdx = 0, lastFocus = null;

  function buildModal() {
    modal = el("div", "xp-modal");
    modal.hidden = true;
    modal.innerHTML =
      '<div class="xp-modal__backdrop" data-xp-close></div>' +
      '<div class="xp-modal__card" role="dialog" aria-modal="true" aria-labelledby="xp-modal-title" data-lenis-prevent>' +
        '<button class="xp-modal__close" type="button" data-xp-close aria-label="Fechar"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.6"/></svg></button>' +
        '<p class="xp-modal__eyebrow">Atendimento guiado</p>' +
        '<h2 class="xp-modal__title" id="xp-modal-title">Conte, em poucos toques, o que você precisa.</h2>' +
        '<p class="xp-modal__lead">Em menos de um minuto, montamos a sua mensagem para a equipe. Você revisa e envia pelo canal que preferir.</p>' +
        '<div class="xp-steps" aria-hidden="true">' + STEPS.concat([{}]).map(function () { return "<i></i>"; }).join("") + "</div>" +
        STEPS.map(function (s, i) {
          return '<div class="xp-step" data-step="' + i + '"><p class="xp-step__q">' + s.q + '</p><div class="xp-options" role="group">' +
            s.opts.map(function (o) { return '<button type="button" class="xp-opt" data-key="' + s.key + '" data-val="' + U.esc(o[0]) + '" aria-pressed="false">' + o[1] + "<span>" + U.esc(o[0]) + "</span></button>"; }).join("") +
            "</div></div>";
        }).join("") +
        '<div class="xp-step" data-step="' + STEPS.length + '">' +
          '<p class="xp-step__q">Revise e envie</p>' +
          '<dl class="xp-summary" id="xp-summary"></dl>' +
          '<label class="xp-field"><span>Seu nome (opcional)</span><input id="xp-nome" maxlength="80" autocomplete="name"></label>' +
          '<label class="xp-field"><span>Em uma frase, o que aconteceu? (opcional)</span><textarea id="xp-desc" rows="3" maxlength="400"></textarea></label>' +
          '<div class="xp-modal__nav" style="margin-top:6px"><a class="btn btn--brass" id="xp-send-wa" href="#" target="_blank" rel="noopener">Enviar pelo WhatsApp</a><a class="btn btn--ghost" id="xp-send-mail" href="#">Enviar por e-mail</a></div>' +
          '<p class="xp-note">O envio abre o seu WhatsApp ou e-mail com a mensagem pronta. Nada do que você escreve aqui é salvo pelo site.</p>' +
        "</div>" +
        '<div class="xp-modal__nav"><button type="button" class="xp-back" id="xp-back">← Voltar</button><span class="xp-note" id="xp-count" style="margin:0"></span></div>' +
      "</div>";
    document.body.appendChild(modal);

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-xp-close]")) { closeWizard(); return; }
      var o = e.target.closest(".xp-opt");
      if (o) {
        answers[o.getAttribute("data-key")] = o.getAttribute("data-val");
        o.parentNode.querySelectorAll(".xp-opt").forEach(function (x) { x.setAttribute("aria-pressed", String(x === o)); });
        setTimeout(function () { goStep(stepIdx + 1); }, 220);
      }
    });
    modal.querySelector("#xp-back").addEventListener("click", function () { goStep(stepIdx - 1); });
    ["xp-nome", "xp-desc"].forEach(function (id) { modal.querySelector("#" + id).addEventListener("input", updateLinks); });
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeWizard(); }
      if (e.key === "Tab") {
        var f = modal.querySelectorAll("button:not([hidden]), a[href], input, textarea");
        f = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
        if (!f.length) { return; }
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  function message() {
    var nome = (modal.querySelector("#xp-nome").value || "").trim();
    var desc = (modal.querySelector("#xp-desc").value || "").trim();
    return "Olá! Vim pelo site do Almeida, Leal & Molina." + (nome ? " Meu nome é " + nome + "." : "") +
      "\n\n• Área: " + (answers.area || "—") +
      "\n• Momento: " + (answers.tipo || "—") +
      "\n• Perfil: " + (answers.perfil || "—") +
      (desc ? "\n\nResumo: " + desc : "") +
      "\n\nGostaria de conversar com a equipe.";
  }
  function updateLinks() {
    var msg = message();
    modal.querySelector("#xp-send-wa").href = U.whatsUrl ? U.whatsUrl(msg) : "https://wa.me/?text=" + encodeURIComponent(msg);
    modal.querySelector("#xp-send-mail").href = "mailto:" + (C.email || "") + "?subject=" + encodeURIComponent("Contato pelo site — " + (answers.area || "Atendimento")) + "&body=" + encodeURIComponent(msg);
  }
  function goStep(i) {
    stepIdx = Math.max(0, Math.min(STEPS.length, i));
    modal.querySelectorAll(".xp-step").forEach(function (s) { s.classList.toggle("is-active", +s.getAttribute("data-step") === stepIdx); });
    modal.querySelectorAll(".xp-steps i").forEach(function (b, k) { b.classList.toggle("is-done", k <= stepIdx); });
    modal.querySelector("#xp-back").hidden = stepIdx === 0;
    modal.querySelector("#xp-count").textContent = "Etapa " + (stepIdx + 1) + " de " + (STEPS.length + 1);
    if (stepIdx === STEPS.length) {
      modal.querySelector("#xp-summary").innerHTML = STEPS.map(function (s) {
        return "<dt>" + U.esc(s.q.replace(/[?…]/g, "")) + "</dt><dd>" + U.esc(answers[s.key] || "—") + "</dd>";
      }).join("");
      updateLinks();
    }
    var first = modal.querySelector(".xp-step.is-active .xp-opt, .xp-step.is-active input");
    if (first) { setTimeout(function () { first.focus(); }, 60); }
  }
  function openWizard(preset) {
    if (!modal) { buildModal(); }
    lastFocus = document.activeElement;
    answers = {};
    modal.querySelectorAll(".xp-opt").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    modal.querySelector("#xp-nome").value = ""; modal.querySelector("#xp-desc").value = "";
    var start = 0;
    if (preset && preset.area) {
      answers.area = preset.area; start = 1;
      var b = modal.querySelector('.xp-opt[data-key="area"][data-val="' + preset.area + '"]'); if (b) { b.setAttribute("aria-pressed", "true"); }
    }
    modal.hidden = false; lockScroll(true);
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    goStep(start);
    store("alm:wizard-seen", "1");
    hideToast();
  }
  function closeWizard() {
    if (!modal || modal.hidden) { return; }
    modal.classList.remove("is-open"); lockScroll(false);
    setTimeout(function () { modal.hidden = true; }, 450);
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }
  window.ALM_openWizard = openWizard;

  // Pontos de entrada: botão flutuante, [data-xp-wizard] e um botão em cada área de atuação
  var launch = el("button", "xp-launch", ICON.balanca.replace('width="18" height="18"', 'width="20" height="20"') + "<span>Atendimento guiado</span>");
  launch.type = "button"; launch.setAttribute("aria-label", "Abrir atendimento guiado");
  document.body.appendChild(launch);
  setTimeout(function () { launch.classList.add("is-visible"); }, isHome ? 2600 : 900);
  launch.addEventListener("click", function () { openWizard(); });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-xp-wizard]");
    if (t) { e.preventDefault(); openWizard(t.getAttribute("data-xp-area") ? { area: t.getAttribute("data-xp-area") } : null); }
  });
  function addAreaButtons() {
    (window.ALM_AREAS || []).forEach(function (a) {
      var panel = document.querySelector("#panel-" + a.id + " .area__panel-content");
      if (!panel || panel.querySelector("[data-xp-area]")) { return; }
      var b = el("button", "btn btn--line-dark btn--sm", "Iniciar atendimento sobre " + U.esc(a.titulo));
      b.type = "button"; b.style.marginTop = "18px"; b.setAttribute("data-xp-wizard", ""); b.setAttribute("data-xp-area", a.titulo);
      panel.appendChild(b);
    });
  }
  addAreaButtons();
  document.addEventListener("alm:team-rendered", addAreaButtons); // a equipe pode ser re-renderizada com dados do painel
  var contactActions = document.querySelector(".contact__actions");
  if (contactActions) {
    var g = el("button", "btn btn--ghost btn--lg", "Atendimento guiado");
    g.type = "button"; g.setAttribute("data-xp-wizard", "");
    contactActions.insertBefore(g, contactActions.children[1] || null);
  }

  /* ============ 10. Aviso discreto (toast) — uma vez por visita ============ */
  var toast = null;
  function hideToast() { if (toast) { toast.classList.remove("is-open"); } }
  function showToast() {
    if (store("alm:toast") || store("alm:wizard-seen") || (modal && !modal.hidden)) { return; }
    store("alm:toast", "1");
    toast = el("aside", "xp-toast");
    toast.setAttribute("role", "status");
    toast.innerHTML =
      '<span class="xp-toast__icon">' + ICON.balanca + "</span>" +
      '<div><strong>Posso ajudar a direcionar?</strong><p>Responda três perguntas e montamos a mensagem para a área certa.</p>' +
      '<div class="xp-toast__actions"><button type="button" data-a="go">Começar</button><button type="button" data-a="no">Agora não</button></div></div>' +
      '<button class="xp-toast__x" type="button" data-a="no" aria-label="Fechar aviso"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2"/></svg></button>';
    document.body.appendChild(toast);
    toast.addEventListener("click", function (e) {
      var a = e.target.closest("[data-a]"); if (!a) { return; }
      hideToast(); if (a.getAttribute("data-a") === "go") { openWizard(); }
    });
    requestAnimationFrame(function () { toast.classList.add("is-open"); });
    setTimeout(hideToast, 14000);
  }
  if (isHome) {
    var armed = false;
    var arm = function () {
      if (armed) { return; }
      var h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0 && scrollY / h > 0.35) { armed = true; setTimeout(showToast, 1200); }
    };
    addEventListener("scroll", arm, { passive: true });
    setTimeout(function () { if (!armed) { armed = true; showToast(); } }, 45000);
  }

  /* ============ 11. Aviso de privacidade (LGPD) ============ */
  if (!lstore("alm:consent")) {
    var consent = el("div", "xp-consent");
    consent.setAttribute("role", "region"); consent.setAttribute("aria-label", "Aviso de privacidade");
    consent.innerHTML =
      "<p>Este site não usa cookies de publicidade. Para exibir o vídeo institucional e as fontes, carregamos serviços de terceiros (YouTube, em modo de privacidade reforçada, e Google Fonts).</p>" +
      '<button class="btn btn--brass" type="button">Entendi</button>'; // TODO: linkar a Política de Privacidade quando o escritório enviar o texto
    document.body.appendChild(consent);
    setTimeout(function () { consent.classList.add("is-open"); }, 1800);
    consent.querySelector("button").addEventListener("click", function () {
      lstore("alm:consent", "1"); consent.classList.remove("is-open");
      setTimeout(function () { consent.remove(); }, 700);
    });
  }

  /* ============ 12. Martelo (gavel) no contato ============ */
  var contactIntro = document.querySelector(".contact__intro");
  if (contactIntro) {
    var gavel = el("div", "", '<svg class="xp-gavel" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<g class="xp-gavel__head"><path d="M30 44 L48 26"/><rect x="36" y="8" width="14" height="24" rx="2" transform="rotate(45 43 20)"/></g>' +
      '<path d="M8 56 H36 M12 50 H32"/><g class="xp-gavel__ring"><path d="M10 46 Q20 40 30 46" /></g></svg>');
    var svgG = gavel.firstChild;
    contactIntro.insertBefore(svgG, contactIntro.firstChild);
    var strike = function () { svgG.classList.remove("is-strike"); void svgG.getBoundingClientRect(); svgG.classList.add("is-strike"); };
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { setTimeout(strike, 500); o.disconnect(); } }, { threshold: 0.6 }).observe(svgG);
      contactIntro.querySelectorAll(".btn").forEach(function (b) { b.addEventListener("mouseenter", strike); });
    }
  }

  /* ============ 13. Spotlight nos cartões dos sócios ============ */
  function addSpotlights() {
    if (!fine || reduce) { return; }
    document.querySelectorAll(".partner__photo-wrap").forEach(function (w) {
      if (w.querySelector(".xp-spot")) { return; }
      w.appendChild(el("span", "xp-spot"));
      w.addEventListener("mousemove", function (e) {
        var r = w.getBoundingClientRect();
        w.style.setProperty("--mx", (e.clientX - r.left) + "px"); w.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }
  addSpotlights();
  document.addEventListener("alm:team-rendered", addSpotlights);

  /* ============ 14. Reveals sem GSAP (se a CDN falhar) ============ */
  if (!window.gsap && !reduce && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(".section__eyebrow, .section__lead, .credentials__item, .area, .partner, .member, .office, .post-card, .xp-stat");
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); rio.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t, i) { t.classList.add("xp-rv"); t.style.transitionDelay = (i % 4) * 70 + "ms"; rio.observe(t); });
    document.querySelectorAll(".section__title").forEach(function (t) { t.classList.add("xp-mask"); rio.observe(t); });
  }
})();
