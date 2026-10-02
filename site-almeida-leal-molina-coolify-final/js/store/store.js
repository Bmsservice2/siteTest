/* ============================================================
   CAMADA DE DADOS DO BLOG — interface única (ALM_STORE)
   ------------------------------------------------------------
   O site, o blog e o painel /admin conversam SOMENTE com esta
   interface. O banco de dados ainda não foi definido; por isso a
   implementação real fica num "adaptador" plugável:

     local-adapter.js → demonstração (localStorage do navegador)
     rest-adapter.js  → produção (qualquer backend que siga o
                        contrato de docs/API-CONTRATO.md:
                        Node, PHP/Laravel, Supabase, Firebase via
                        functions, WordPress headless etc.)

   Trocar de banco = trocar ALM_CONFIG.dados.adaptador. Nenhuma
   tela precisa ser alterada.

   Contrato (todas as funções retornam Promise):
     posts.list({ incluirRascunhos })  → Post[] (mais recentes 1º)
     posts.get(slugOuId)               → Post | null
     posts.save(post)                  → Post (cria se não tiver id)
     posts.remove(id)                  → true
     media.upload(File)                → { url }
     settings.get() / settings.save(o) → { whatsappNumero, whatsappExibicao, email }
     auth.login(email, senha)          → { nome, email, papel }
     auth.logout() / auth.session()    → sessão atual ou null
     users.list() / users.save(u) / users.remove(email)

   Post = { id, slug, titulo, resumo, conteudo(HTML), categoria,
            autor(slug da equipe), data(AAAA-MM-DD), capa(url),
            linkExterno, status("rascunho"|"publicado"), atualizadoEm }
   ============================================================ */
(function () {
  "use strict";
  var cfg = (window.ALM_CONFIG && window.ALM_CONFIG.dados) || { adaptador: "local" };
  var factories = window.ALM_ADAPTERS || {};
  var make = factories[cfg.adaptador] || factories.local;
  if (!make) { console.error("[ALM] Nenhum adaptador de dados carregado."); return; }
  var store = make(cfg);
  store.modo = cfg.adaptador in factories ? cfg.adaptador : "local";

  store.CATEGORIAS_PADRAO = ["Tributário", "Societário", "Contratos", "Cível", "Trabalhista", "Notícias do escritório"];

  /* Ordenação comum: data desc; sem data vai para o fim, por atualização */
  store.sortPosts = function (list) {
    return list.slice().sort(function (a, b) {
      var da = a.data || "", db = b.data || "";
      if (da !== db) { return da < db ? 1 : -1; }
      return (a.atualizadoEm || "") < (b.atualizadoEm || "") ? 1 : -1;
    });
  };

  /* Aplica WhatsApp/e-mail salvos no painel sobre a configuração padrão */
  store.applySettings = function () {
    return store.settings.get().then(function (s) {
      if (!s) { return; }
      var c = window.ALM_CONFIG;
      if (s.whatsappNumero) { c.whatsapp.numero = String(s.whatsappNumero).replace(/\D/g, ""); }
      if (s.whatsappExibicao) { c.whatsapp.exibicao = s.whatsappExibicao; }
      if (s.email) { c.email = s.email; }
    }).catch(function () {});
  };

  window.ALM_STORE = store;
})();
