/* ============================================================
   PAINEL DE CONTEÚDOS (/admin) — Almeida, Leal & Molina
   Rotas por hash: #/publicacoes · #/nova · #/editar/<id> ·
   #/configuracoes · #/usuarios
   Fala somente com ALM_STORE → funciona igual com o adaptador
   local (demonstração) ou REST (produção).
   ============================================================ */
(function () {
  "use strict";
  var S = window.ALM_STORE, U = window.ALM_UTILS, esc = U.esc;
  var $ = function (id) { return document.getElementById(id); };
  var session = null;
  var current = null;      // publicação em edição
  var dirty = false;
  var statusFilter = "todos";

  /* ---------- Utilidades de UI ---------- */
  var toastT;
  function toast(msg, isError) {
    var t = $("toast");
    t.textContent = msg; t.hidden = false;
    t.classList.toggle("toast--error", !!isError);
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3200);
  }
  function showError(id, msg) { var el = $(id); el.textContent = msg || ""; el.hidden = !msg; }
  function busy(btn, on, label) {
    if (!btn) { return; }
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || "Salvando…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  if (S.modo === "local") {
    $("demo-banner").hidden = false;
    $("login-demo").hidden = false;
    $("login-demo").innerHTML = "Acesso de demonstração: <strong>" + esc(S.demo.email) + "</strong> / <strong>" + esc(S.demo.senha) + "</strong>";
  }

  /* ============================ LOGIN ============================ */
  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    showError("login-error");
    var btn = e.target.querySelector("button[type=submit]");
    busy(btn, true, "Entrando…");
    S.auth.login($("login-email").value, $("login-pass").value).then(function (s) {
      session = s; startApp();
    }).catch(function (err) { showError("login-error", err.message); })
      .then(function () { busy(btn, false); });
  });
  $("logout").addEventListener("click", function () {
    if (dirty && !confirm("Há alterações não salvas. Sair mesmo assim?")) { return; }
    S.auth.logout().then(function () { session = null; dirty = false; showLogin(); });
  });

  function showLogin() {
    $("view-app").hidden = true; $("view-login").hidden = false;
    $("login-pass").value = "";
    setTimeout(function () { $("login-email").focus(); }, 30);
  }
  function startApp() {
    $("view-login").hidden = true; $("view-app").hidden = false;
    $("user-name").textContent = session.nome + " · " + (session.papel === "admin" ? "Administrador" : "Editor");
    document.querySelectorAll("[data-admin]").forEach(function (a) { a.hidden = session.papel !== "admin"; });
    if (!location.hash || location.hash === "#") { location.hash = "#/publicacoes"; } else { route(); }
  }

  /* ============================ ROTAS ============================ */
  var lastHash = location.hash;
  function route() {
    if (!session) { return; }
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/");
    var name = parts[0] || "publicacoes";
    document.querySelectorAll(".view").forEach(function (v) { v.hidden = true; });
    document.querySelectorAll(".side__nav a").forEach(function (a) {
      var r = a.getAttribute("data-route");
      a.classList.toggle("is-active", r === name || (r === "publicacoes" && name === "editar"));
    });
    if (name === "nova") { openEditor(null); }
    else if (name === "editar") { openEditor(decodeURIComponent(parts[1] || "")); }
    else if (name === "configuracoes") { $("view-configuracoes").hidden = false; loadSettings(); }
    else if (name === "usuarios" && session.papel === "admin") { $("view-usuarios").hidden = false; loadUsers(); }
    else { $("view-publicacoes").hidden = false; loadPosts(); }
    $("main").focus({ preventScroll: true });
    window.scrollTo(0, 0);
    lastHash = location.hash;
  }
  window.addEventListener("hashchange", function () {
    if (dirty && location.hash !== lastHash) {
      if (!confirm("Há alterações não salvas nesta publicação. Descartar?")) { history.replaceState(null, "", lastHash); return; }
      dirty = false;
    }
    route();
  });
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ============================ LISTA ============================ */
  var allPosts = [];
  function loadPosts() {
    $("posts-body").innerHTML = '<tr><td colspan="6" class="muted">Carregando…</td></tr>';
    S.posts.list({ incluirRascunhos: true }).then(function (list) { allPosts = list; drawPosts(); })
      .catch(function (e) { $("posts-body").innerHTML = '<tr><td colspan="6">' + esc(e.message) + "</td></tr>"; });
  }
  function drawPosts() {
    var q = U.slugify($("posts-search").value).replace(/-/g, " ");
    var list = allPosts.filter(function (p) {
      return (statusFilter === "todos" || p.status === statusFilter) &&
        (!q || U.slugify(p.titulo).replace(/-/g, " ").indexOf(q) !== -1);
    });
    var pub = allPosts.filter(function (p) { return p.status === "publicado"; }).length;
    $("posts-count").textContent = pub + " publicada(s) · " + (allPosts.length - pub) + " rascunho(s)";
    $("posts-empty").hidden = allPosts.length > 0;
    document.querySelector("#view-publicacoes .table-wrap").hidden = allPosts.length === 0;
    $("posts-body").innerHTML = list.length ? list.map(function (p) {
      var a = U.pessoa(p.autor);
      var edit = "#/editar/" + encodeURIComponent(p.id);
      return "<tr>" +
        '<td><a class="t-title" href="' + edit + '">' + esc(p.titulo || "(sem título)") + "</a>" + (p.linkExterno ? '<span class="muted t-sub">Link externo</span>' : "") + "</td>" +
        "<td>" + esc(a ? (a.nomeCurto || a.nome) : "—") + "</td>" +
        "<td>" + esc(p.categoria || "—") + "</td>" +
        "<td>" + (p.data ? esc(U.formatDate(p.data)) : '<span class="muted">sem data</span>') + "</td>" +
        '<td><span class="badge badge--' + p.status + '">' + (p.status === "publicado" ? "Publicada" : "Rascunho") + "</span></td>" +
        '<td class="t-actions"><a class="btn btn--ghost btn--sm" href="' + edit + '">Editar</a>' +
        (p.status === "publicado" ? '<a class="btn btn--ghost btn--sm" href="../conteudos/artigo.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener">Ver</a>' : "") + "</td>" +
      "</tr>";
    }).join("") : '<tr><td colspan="6" class="muted">Nenhuma publicação corresponde ao filtro.</td></tr>';
  }
  document.querySelector(".seg").addEventListener("click", function (e) {
    var b = e.target.closest("[data-status]"); if (!b) { return; }
    statusFilter = b.getAttribute("data-status");
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    drawPosts();
  });
  $("posts-search").addEventListener("input", drawPosts);

  /* ============================ EDITOR ============================ */
  var area = $("f-conteudo");
  var slugTouched = false;

  // Autores: equipe (sócios primeiro)
  $("f-autor").innerHTML = '<option value="">— Selecione —</option>' + (window.ALM_EQUIPE || []).map(function (p) {
    return '<option value="' + p.slug + '">' + esc(p.nome) + "</option>";
  }).join("");

  function fillCategories() {
    var cats = S.CATEGORIAS_PADRAO.slice();
    allPosts.forEach(function (p) { if (p.categoria && cats.indexOf(p.categoria) === -1) { cats.push(p.categoria); } });
    $("cat-list").innerHTML = cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("");
  }

  function openEditor(id) {
    $("view-editor").hidden = false;
    showError("editor-error");
    $("save-state").textContent = "";
    var load = id ? S.posts.get(id) : Promise.resolve(null);
    (allPosts.length ? Promise.resolve() : S.posts.list({ incluirRascunhos: true }).then(function (l) { allPosts = l; })).then(fillCategories);
    load.then(function (p) {
      if (id && !p) { toast("Publicação não encontrada.", true); location.hash = "#/publicacoes"; return; }
      current = p ? Object.assign({}, p) : { status: "rascunho", data: new Date().toISOString().slice(0, 10) };
      $("editor-title").textContent = p ? "Editar publicação" : "Nova publicação";
      $("f-titulo").value = current.titulo || "";
      $("f-resumo").value = current.resumo || "";
      $("f-autor").value = current.autor || "";
      $("f-categoria").value = current.categoria || "";
      $("f-data").value = current.data || "";
      $("f-slug").value = current.slug || "";
      $("f-link").value = current.linkExterno || "";
      area.innerHTML = window.ALM_SANITIZE(current.conteudo || "");
      slugTouched = !!current.slug;
      setCover(current.capa || "");
      updateCount();
      $("btn-delete").hidden = !current.id;
      $("btn-publish").textContent = current.status === "publicado" ? "Atualizar publicação" : "Publicar";
      dirty = false;
      if (!p) { $("f-titulo").focus(); }
    });
  }

  function markDirty() { dirty = true; $("save-state").textContent = "Alterações não salvas"; }
  ["f-titulo", "f-resumo", "f-autor", "f-categoria", "f-data", "f-slug", "f-link"].forEach(function (id) {
    $(id).addEventListener("input", markDirty);
  });
  area.addEventListener("input", markDirty);

  $("f-titulo").addEventListener("input", function () {
    if (!slugTouched) { $("f-slug").value = U.slugify($("f-titulo").value); }
  });
  $("f-slug").addEventListener("input", function () { slugTouched = true; });
  $("f-slug").addEventListener("blur", function () { $("f-slug").value = U.slugify($("f-slug").value); });

  function updateCount() { $("resumo-count").textContent = $("f-resumo").value.length + "/220"; }
  $("f-resumo").addEventListener("input", updateCount);

  /* ---------- Editor de texto (contenteditable + barra) ---------- */
  document.execCommand && document.execCommand("defaultParagraphSeparator", false, "p");
  document.querySelector(".rte__bar").addEventListener("mousedown", function (e) { if (e.target.closest("button")) { e.preventDefault(); } }); // mantém a seleção
  document.querySelector(".rte__bar").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cmd]"); if (!b) { return; }
    var cmd = b.getAttribute("data-cmd");
    area.focus();
    if (cmd === "link") {
      var url = prompt("Endereço do link (https://…):", "https://");
      if (url && /^(https?:|mailto:)/i.test(url)) { document.execCommand("createLink", false, url); }
    } else if (cmd === "image") {
      saveSel(); $("inline-image").click(); return;
    } else if (cmd === "formatBlock") {
      document.execCommand("formatBlock", false, "<" + b.getAttribute("data-val") + ">");
    } else {
      document.execCommand(cmd, false, null);
    }
    markDirty();
  });
  var savedRange = null;
  function saveSel() { var s = window.getSelection(); savedRange = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; }
  $("inline-image").addEventListener("change", function () {
    var f = this.files[0]; this.value = "";
    if (!f) { return; }
    toast("Enviando imagem…");
    S.media.upload(f).then(function (r) {
      area.focus();
      if (savedRange) { var s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); }
      document.execCommand("insertHTML", false, '<img src="' + esc(r.url) + '" alt="">');
      markDirty(); toast("Imagem inserida.");
    }).catch(function (e) { toast(e.message, true); });
  });
  // Colar do Word/Google Docs: limpa estilos, mantém estrutura
  area.addEventListener("paste", function (e) {
    var html = e.clipboardData && e.clipboardData.getData("text/html");
    var text = e.clipboardData && e.clipboardData.getData("text/plain");
    e.preventDefault();
    var clean = html ? window.ALM_SANITIZE(html.replace(/<!--[\s\S]*?-->/g, "").replace(/<o:p>[\s\S]*?<\/o:p>/g, ""))
                     : esc(text || "").split(/\n{2,}/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
    document.execCommand("insertHTML", false, clean);
    markDirty();
  });

  /* ---------- Capa ---------- */
  function setCover(url) {
    current.capa = url || "";
    $("cover-img").hidden = !url;
    if (url) { $("cover-img").src = url; }
    $("cover-drop").classList.toggle("has-image", !!url);
    $("cover-remove").hidden = !url;
  }
  $("f-capa").addEventListener("change", function () {
    var f = this.files[0]; this.value = "";
    if (!f) { return; }
    toast("Enviando imagem…");
    S.media.upload(f).then(function (r) { setCover(r.url); markDirty(); toast("Capa atualizada."); })
      .catch(function (e) { toast(e.message, true); });
  });
  $("cover-remove").addEventListener("click", function () { setCover(""); markDirty(); });

  /* ---------- Coleta, validação, salvar ---------- */
  function collect(status) {
    return Object.assign({}, current, {
      titulo: $("f-titulo").value.trim(),
      resumo: $("f-resumo").value.trim(),
      autor: $("f-autor").value,
      categoria: $("f-categoria").value.trim(),
      data: $("f-data").value,
      slug: U.slugify($("f-slug").value || $("f-titulo").value),
      linkExterno: $("f-link").value.trim(),
      conteudo: window.ALM_SANITIZE(area.innerHTML),
      status: status || current.status || "rascunho"
    });
  }
  function validate(p) {
    if (!p.titulo) { return "Informe o título."; }
    if (p.status === "publicado") {
      if (!p.autor) { return "Selecione o autor antes de publicar."; }
      if (!p.data) { return "Informe a data de publicação."; }
      if (!p.linkExterno && !p.conteudo.replace(/<[^>]+>/g, "").trim()) { return "Escreva o texto ou informe o link do artigo original."; }
    }
    if (p.linkExterno && !/^https?:\/\//i.test(p.linkExterno)) { return "O link do artigo original precisa começar com https://"; }
    return "";
  }

  var submitter = null;
  document.querySelectorAll('#editor-form button[type=submit]').forEach(function (b) {
    b.addEventListener("click", function () { submitter = b; });
  });
  $("editor-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = submitter || $("btn-publish");
    var p = collect(btn.getAttribute("data-status"));
    var err = validate(p);
    showError("editor-error", err);
    if (err) { toast(err, true); return; }
    busy(btn, true);
    S.posts.save(p).then(function (saved) {
      current = saved; dirty = false;
      $("f-slug").value = saved.slug;
      $("save-state").textContent = "Salvo às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      $("btn-delete").hidden = false;
      $("editor-title").textContent = "Editar publicação";
      toast(saved.status === "publicado" ? "Publicação no ar." : "Rascunho salvo.");
      var i = allPosts.findIndex(function (x) { return x.id === saved.id; });
      if (i === -1) { allPosts.push(saved); } else { allPosts[i] = saved; }
      history.replaceState(null, "", "#/editar/" + encodeURIComponent(saved.id)); lastHash = location.hash;
    }).catch(function (e2) { showError("editor-error", e2.message); toast(e2.message, true); })
      .then(function () {
        busy(btn, false);
        $("btn-publish").textContent = current.status === "publicado" ? "Atualizar publicação" : "Publicar";
      });
  });

  $("btn-preview").addEventListener("click", function () {
    var p = collect();
    try { sessionStorage.setItem("alm:preview", JSON.stringify(p)); }
    catch (e) { toast("Não foi possível abrir a pré-visualização (imagens muito grandes).", true); return; }
    window.open("../conteudos/artigo.html?preview=1", "_blank");
  });

  $("btn-delete").addEventListener("click", function () {
    if (!current || !current.id) { return; }
    if (!confirm("Excluir “" + (current.titulo || "esta publicação") + "”? Esta ação não pode ser desfeita.")) { return; }
    S.posts.remove(current.id).then(function () {
      allPosts = allPosts.filter(function (x) { return x.id !== current.id; });
      dirty = false; toast("Publicação excluída."); location.hash = "#/publicacoes";
    }).catch(function (e) { toast(e.message, true); });
  });

  // Ctrl+S salva rascunho
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("view-editor").hidden) {
      e.preventDefault(); submitter = document.querySelector('#editor-form button[data-status="rascunho"]');
      if (current && current.status === "publicado") { submitter = $("btn-publish"); }
      $("editor-form").requestSubmit ? $("editor-form").requestSubmit() : submitter.click();
    }
  });

  /* ============================ CONFIGURAÇÕES ============================ */
  function loadSettings() {
    var c = window.ALM_CONFIG;
    S.settings.get().then(function (s) {
      s = s || {};
      $("s-wa").value = s.whatsappNumero || c.whatsapp.numero;
      $("s-wa-exibicao").value = s.whatsappExibicao || c.whatsapp.exibicao;
      $("s-email").value = s.email || c.email;
    });
  }
  $("settings-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var num = $("s-wa").value.replace(/\D/g, "");
    var mail = $("s-email").value.trim();
    if (num.length < 12 || num.length > 13) { showError("settings-error", "Informe o número com DDI e DDD, ex.: 5521987059438."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { showError("settings-error", "Informe um e-mail válido."); return; }
    showError("settings-error");
    var btn = e.target.querySelector("button[type=submit]"); busy(btn, true);
    S.settings.save({ whatsappNumero: num, whatsappExibicao: $("s-wa-exibicao").value.trim(), email: mail })
      .then(function () { toast("Configurações salvas. O site já usa os novos contatos."); })
      .catch(function (e2) { showError("settings-error", e2.message); })
      .then(function () { busy(btn, false); });
  });

  /* ============================ USUÁRIOS ============================ */
  function loadUsers() {
    S.users.list().then(function (list) {
      $("users-body").innerHTML = list.map(function (u) {
        var me = u.email === session.email;
        return "<tr><td>" + esc(u.nome) + (me ? ' <span class="muted">(você)</span>' : "") + "</td><td>" + esc(u.email) + "</td>" +
          "<td>" + (u.papel === "admin" ? "Administrador" : "Editor") + "</td>" +
          '<td class="t-actions">' + (me ? "" : '<button class="btn btn--ghost btn--sm" type="button" data-remove-user="' + esc(u.email) + '">Remover</button>') + "</td></tr>";
      }).join("");
    }).catch(function (e) { toast(e.message, true); });
  }
  $("users-body").addEventListener("click", function (e) {
    var b = e.target.closest("[data-remove-user]"); if (!b) { return; }
    var email = b.getAttribute("data-remove-user");
    if (!confirm("Remover o acesso de " + email + "?")) { return; }
    S.users.remove(email).then(function () { toast("Acesso removido."); loadUsers(); }).catch(function (er) { toast(er.message, true); });
  });
  $("user-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = e.target.querySelector("button[type=submit]"); busy(btn, true);
    S.users.save({ nome: $("u-nome").value.trim(), email: $("u-email").value, senha: $("u-senha").value, papel: $("u-papel").value })
      .then(function () { showError("user-error"); e.target.reset(); toast("Usuário adicionado."); loadUsers(); })
      .catch(function (er) { showError("user-error", er.message); })
      .then(function () { busy(btn, false); });
  });

  /* ============================ INÍCIO ============================ */
  S.auth.session().then(function (s) { session = s; if (s) { startApp(); } else { showLogin(); } })
    .catch(showLogin);
})();
