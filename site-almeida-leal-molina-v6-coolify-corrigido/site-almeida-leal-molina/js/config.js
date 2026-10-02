/* ============================================================
   ALMEIDA, LEAL & MOLINA — Configuração central do site
   Tudo que muda com frequência fica AQUI (um único lugar):
   WhatsApp, e-mail, endereços, redes e o adaptador de dados do blog.
   Obs.: o número de WhatsApp também pode ser alterado pelo painel
   /admin → Configurações (sobrepõe este valor quando houver backend).
   ============================================================ */
window.ALM_CONFIG = {
  nome: "Almeida, Leal & Molina Advogados",
  sigla: "ALM",
  dominio: "https://almeidaleal.adv.br", // TODO: confirmar domínio final de publicação

  whatsapp: {
    numero: "5521987059438",            // só dígitos, com DDI+DDD
    exibicao: "+55 21 98705-9438",
    mensagem: "Olá! Vim pelo site do Almeida, Leal & Molina e gostaria de falar com o escritório."
  },

  // TODO: confirmar domínio do e-mail — a última assinatura da Jéssica usa
  // contato@almeidalealmolina.com; o briefing aprovado usa @almeidaleal.adv.br
  email: "contato@almeidaleal.adv.br",

  unidades: [
    {
      cidade: "Rio de Janeiro",
      // Endereço atualizado conforme e-mail de 16/09 (sala 701). TODO: validar redação final.
      linhas: ["Rua Sete de Setembro, nº 71, sala 701", "7º andar — Centro", "CEP 20050-005 — Rio de Janeiro/RJ"],
      mapa: "Rua Sete de Setembro, 71, Centro, Rio de Janeiro - RJ, 20050-005"
    },
    {
      cidade: "São Paulo",
      linhas: ["Avenida Paulista, nº 302-306", "Conjunto 10", "CEP 01310-000 — São Paulo/SP"],
      mapa: "Avenida Paulista, 302, São Paulo - SP, 01310-000"
    }
  ],

  redes: {
    linkedin: "https://www.linkedin.com/company/alm-advogados/posts/",
    site: "https://almeidaleal.adv.br/"
  },

  /* Hero: vídeo de fundo.
     provider "youtube": toca o vídeo real do YouTube como FUNDO — sem
       controles, sem cliques (pointer-events: none), sem título/link;
       o visitante não tem como ser levado ao YouTube. Usa o domínio
       youtube-nocookie.com (menos cookies). Precisa de internet.
     provider "local": arquivo em assets/video/ (100% offline).
     Em qualquer caso, a foto dos sócios (poster) aparece até o vídeo
     começar e fica como fallback se ele não carregar. */
  heroVideo: {
    enabled: true,
    provider: "youtube",
    id: "6my2ltOHaZE",
    src: "assets/video/banner.mp4",   // usado só com provider "local"
    webm: "assets/video/banner.webm", // opcional (local)
    poster: "assets/img/escritorio/socios-estudio.webp",
    respeitarMovimentoReduzido: false // true = não toca o vídeo para quem pediu "reduzir animações" no sistema
  },



  /* ------------------------------------------------------------
     BLOG — ADAPTADOR DE DADOS  (banco de dados AINDA NÃO DEFINIDO)
     "local" → demonstração: grava no navegador (localStorage).
               Serve para aprovação do fluxo, NÃO para produção.
     "rest"  → quando o backend for escolhido: aponte apiBase para a
               API que implementar o contrato em docs/API-CONTRATO.md.
     ------------------------------------------------------------ */
  dados: {
    // "rest": fala com o backend em server/ (Node), pronto para produção —
    //         a equipe já pode publicar de verdade, os dados ficam salvos
    //         no servidor (ver DATA_DIR), não no navegador de cada um.
    // "local": modo demonstração antigo, grava só no navegador; útil
    //         apenas para abrir os arquivos sem rodar "npm start".
    adaptador: "rest",
    apiBase: "/api"
  }
};
