/* ============================================================
   ADAPTADOR REST (PRODUÇÃO) — pronto para quando o banco for
   definido. Implementa a mesma interface do adaptador local,
   chamando a API descrita em docs/API-CONTRATO.md.
   Autenticação por cookie de sessão HttpOnly (credentials: include).
   Para ativar: ALM_CONFIG.dados = { adaptador: "rest", apiBase: "https://.../api" }
   ============================================================ */
(function () {
  "use strict";
  window.ALM_ADAPTERS = window.ALM_ADAPTERS || {};

  window.ALM_ADAPTERS.rest = function (cfg) {
    var base = String(cfg.apiBase || "/api").replace(/\/$/, "");

    function req(method, path, body, isForm) {
      var opts = { method: method, credentials: "include", headers: { Accept: "application/json" } };
      if (body !== undefined) {
        if (isForm) { opts.body = body; }
        else { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
      }
      return fetch(base + path, opts).then(function (res) {
        if (res.status === 204) { return true; }
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) { throw new Error(data.erro || ("Falha na comunicação com o servidor (" + res.status + ").")); }
          return data;
        });
      });
    }
    var enc = encodeURIComponent;

    return {
      posts: {
        list: function (o) { return req("GET", "/posts" + (o && o.incluirRascunhos ? "?status=todos" : "")); },
        get: function (k) { return req("GET", "/posts/" + enc(k)).catch(function () { return null; }); },
        save: function (p) { return p.id ? req("PUT", "/posts/" + enc(p.id), p) : req("POST", "/posts", p); },
        remove: function (id) { return req("DELETE", "/posts/" + enc(id)); }
      },
      media: {
        upload: function (file) { var f = new FormData(); f.append("arquivo", file); return req("POST", "/media", f, true); }
      },
      settings: {
        get: function () { return req("GET", "/settings").catch(function () { return null; }); },
        save: function (s) { return req("PUT", "/settings", s); }
      },
      auth: {
        login: function (email, senha) { return req("POST", "/auth/login", { email: email, senha: senha }); },
        logout: function () { return req("POST", "/auth/logout", {}); },
        session: function () { return req("GET", "/auth/me").catch(function () { return null; }); }
      },
      users: {
        list: function () { return req("GET", "/users"); },
        save: function (u) { return req("POST", "/users", u); },
        remove: function (email) { return req("DELETE", "/users/" + enc(email)); }
      }
    };
  };
})();
