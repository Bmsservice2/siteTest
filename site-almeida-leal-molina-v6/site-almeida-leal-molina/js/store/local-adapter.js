/* ============================================================
   ADAPTADOR LOCAL (DEMONSTRAÇÃO) — grava no localStorage.
   ⚠ Não é produção: os dados ficam apenas no navegador de quem
   usa, e a autenticação é simulada. Serve para o escritório e a
   BMS validarem o fluxo do blog enquanto o banco é definido.
   ============================================================ */
(function () {
  "use strict";
  window.ALM_ADAPTERS = window.ALM_ADAPTERS || {};

  window.ALM_ADAPTERS.local = function () {
    var K = { posts: "alm:posts", settings: "alm:settings", users: "alm:users", session: "alm:session" };
    var DEMO_USER = { nome: "Administrador (demonstração)", email: "admin@almeidaleal.adv.br", senha: "alm-demo-2026", papel: "admin" };

    function read(key, fallback) {
      try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    }
    function write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (e) {
        throw new Error("O armazenamento do navegador está cheio. Use imagens menores ou remova publicações antigas. (Limitação só do modo demonstração.)");
      }
    }
    function delay(v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 120); }); }
    function fail(msg) { return Promise.reject(new Error(msg)); }

    function hash(s) {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        return crypto.subtle.digest("SHA-256", new TextEncoder().encode("alm::" + s)).then(function (buf) {
          return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
        });
      }
      var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
      return Promise.resolve("x" + h);
    }

    function posts() {
      var p = read(K.posts, null);
      if (!p) { p = (window.ALM_SEED_POSTS || []).slice(); write(K.posts, p); }
      return p;
    }
    function users() {
      var u = read(K.users, null);
      if (u) { return Promise.resolve(u); }
      return hash(DEMO_USER.senha).then(function (h) {
        var list = [{ nome: DEMO_USER.nome, email: DEMO_USER.email, papel: "admin", senhaHash: h }];
        write(K.users, list);
        return list;
      });
    }
    function requireSession() {
      var s = read(K.session, null);
      return s ? Promise.resolve(s) : fail("Sua sessão expirou. Entre novamente.");
    }
    function uid() { return "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

    var api = {
      demo: { email: DEMO_USER.email, senha: DEMO_USER.senha },

      posts: {
        list: function (opts) {
          opts = opts || {};
          var list = posts().filter(function (p) { return opts.incluirRascunhos || p.status === "publicado"; });
          return delay(window.ALM_STORE.sortPosts(list));
        },
        get: function (key) {
          var p = posts().filter(function (x) { return x.slug === key || x.id === key; })[0] || null;
          return delay(p);
        },
        save: function (post) {
          return requireSession().then(function () {
            var list = posts();
            var slug = window.ALM_UTILS.slugify(post.slug || post.titulo);
            if (!slug) { return fail("Informe um título para a publicação."); }
            var clash = list.filter(function (x) { return x.slug === slug && x.id !== post.id; })[0];
            if (clash) { return fail("Já existe uma publicação com o endereço “" + slug + "”. Ajuste o título ou o endereço."); }
            var now = new Date().toISOString();
            var saved = Object.assign({}, post, { slug: slug, atualizadoEm: now });
            if (!saved.id) { saved.id = uid(); list.push(saved); }
            else {
              var i = list.findIndex(function (x) { return x.id === saved.id; });
              if (i === -1) { list.push(saved); } else { list[i] = saved; }
            }
            write(K.posts, list);
            return delay(saved);
          });
        },
        remove: function (id) {
          return requireSession().then(function () {
            write(K.posts, posts().filter(function (x) { return x.id !== id; }));
            return delay(true);
          });
        }
      },

      media: {
        /* Redimensiona no navegador (máx. 1600px) e devolve data URL.
           No backend real, este método envia o arquivo e devolve a URL. */
        upload: function (file) {
          return new Promise(function (resolve, reject) {
            if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { reject(new Error("Envie uma imagem JPG, PNG ou WebP.")); return; }
            var img = new Image();
            var url = URL.createObjectURL(file);
            img.onload = function () {
              var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
              if (w > max) { h = Math.round(h * max / w); w = max; }
              var c = document.createElement("canvas"); c.width = w; c.height = h;
              c.getContext("2d").drawImage(img, 0, 0, w, h);
              URL.revokeObjectURL(url);
              resolve({ url: c.toDataURL("image/jpeg", 0.8) });
            };
            img.onerror = function () { reject(new Error("Não foi possível ler esta imagem.")); };
            img.src = url;
          });
        }
      },

      settings: {
        get: function () { return delay(read(K.settings, null)); },
        save: function (s) {
          return requireSession().then(function () { write(K.settings, s); return delay(s); });
        }
      },

      auth: {
        login: function (email, senha) {
          email = String(email || "").trim().toLowerCase();
          return Promise.all([users(), hash(String(senha || ""))]).then(function (r) {
            var u = r[0].filter(function (x) { return x.email === email && x.senhaHash === r[1]; })[0];
            if (!u) { return fail("E-mail ou senha incorretos."); }
            var s = { nome: u.nome, email: u.email, papel: u.papel };
            write(K.session, s);
            return delay(s);
          });
        },
        logout: function () { localStorage.removeItem(K.session); return delay(true); },
        session: function () { return delay(read(K.session, null)); }
      },

      users: {
        list: function () {
          return requireSession().then(users).then(function (l) {
            return l.map(function (u) { return { nome: u.nome, email: u.email, papel: u.papel }; });
          });
        },
        save: function (u) {
          return requireSession().then(function (s) {
            if (s.papel !== "admin") { return fail("Apenas administradores podem gerenciar usuários."); }
            var email = String(u.email || "").trim().toLowerCase();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { return fail("Informe um e-mail válido."); }
            if (!u.senha || u.senha.length < 8) { return fail("A senha precisa ter pelo menos 8 caracteres."); }
            return Promise.all([users(), hash(u.senha)]).then(function (r) {
              var list = r[0].filter(function (x) { return x.email !== email; });
              list.push({ nome: u.nome || email, email: email, papel: u.papel === "admin" ? "admin" : "editor", senhaHash: r[1] });
              write(K.users, list);
              return true;
            });
          });
        },
        remove: function (email) {
          return requireSession().then(function (s) {
            if (s.email === email) { return fail("Você não pode remover o próprio acesso."); }
            return users().then(function (l) { write(K.users, l.filter(function (x) { return x.email !== email; })); return true; });
          });
        }
      }
    };
    return api;
  };
})();
