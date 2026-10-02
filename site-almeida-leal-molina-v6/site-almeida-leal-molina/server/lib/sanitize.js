/* ============================================================
   Sanitização do HTML dos artigos — espelha exatamente a lista de
   permissões de js/lib/sanitize.js (o mesmo conteúdo que o painel
   já limpa no navegador). Nunca confie só no lado do cliente: o
   servidor sanitiza de novo antes de gravar, porque a chamada à
   API pode vir de qualquer lugar, não só do painel.
   ============================================================ */
"use strict";
const sanitizeHtml = require("sanitize-html");

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "a", "hr", "figure", "figcaption", "img"
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "title"],
  img: ["src", "alt"]
};

const ALLOWED_SCHEMES = ["http", "https", "mailto", "tel", "data"];

function sanitizeConteudo(html) {
  const clean = sanitizeHtml(String(html || ""), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    // data: só para imagens em base64 (mesma regra do sanitizador do cliente)
    allowProtocolRelative: false,
    exclusiveFilter: function (frame) {
      if (frame.tag === "img" && !frame.attribs.src) { return true; } // remove <img> sem src
      return false;
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }, true)
    }
  });
  return clean;
}

module.exports = { sanitizeConteudo };
