"use strict";
const express = require("express");
const db = require("../lib/store");
const { slugify, newId, nowISO, pick } = require("../lib/util");
const { sanitizeConteudo } = require("../lib/sanitize");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const CAMPOS_EDITAVEIS = [
  "titulo", "resumo", "conteudo", "categoria", "autor", "data", "capa", "linkExterno", "status", "slug"
];

function sortPosts(list) {
  return list.slice().sort((a, b) => {
    const da = a.data || "", dbb = b.data || "";
    if (da !== dbb) { return da < dbb ? 1 : -1; }
    return (a.atualizadoEm || "") < (b.atualizadoEm || "") ? 1 : -1;
  });
}

function publicPost(p) { return p; } // hoje o objeto já é seguro para expor por completo

/* GET /posts — só publicados; ?status=todos (logado) também traz rascunhos */
router.get("/", asyncHandler(async (req, res) => {
  const incluirRascunhos = req.query.status === "todos" && !!req.session;
  const list = await db.read((d) => d.posts);
  const filtered = incluirRascunhos ? list : list.filter((p) => p.status === "publicado");
  res.json(sortPosts(filtered).map(publicPost));
}));

/* GET /posts/:slugOuId — rascunho só é visível para quem está logado */
router.get("/:key", asyncHandler(async (req, res) => {
  const key = req.params.key;
  const post = await db.read((d) => d.posts.find((p) => p.slug === key || p.id === key));
  if (!post) { return res.status(404).json({ erro: "Publicação não encontrada." }); }
  if (post.status !== "publicado" && !req.session) { return res.status(404).json({ erro: "Publicação não encontrada." }); }
  res.json(publicPost(post));
}));

/* POST /posts — cria (logado) */
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const body = pick(req.body || {}, CAMPOS_EDITAVEIS);
  if (!body.titulo || !String(body.titulo).trim()) { return res.status(400).json({ erro: "Informe o título." }); }

  const slug = slugify(body.slug || body.titulo);
  if (!slug) { return res.status(400).json({ erro: "Não foi possível gerar o endereço da página a partir do título." }); }

  try {
    const saved = await db.mutate((d) => {
      if (d.posts.some((p) => p.slug === slug)) {
        const err = new Error("SLUG_EM_USO"); err.status = 409; throw err;
      }
      const post = Object.assign({}, body, {
        id: newId("post"),
        slug,
        conteudo: sanitizeConteudo(body.conteudo),
        status: body.status === "publicado" ? "publicado" : "rascunho",
        atualizadoEm: nowISO()
      });
      d.posts.push(post);
      return post;
    });
    res.status(201).json(saved);
  } catch (e) {
    if (e.message === "SLUG_EM_USO") {
      return res.status(409).json({ erro: "Já existe uma publicação com o endereço “" + slug + "”. Ajuste o título ou o endereço." });
    }
    throw e;
  }
}));

/* PUT /posts/:id — atualiza (logado) */
router.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const body = pick(req.body || {}, CAMPOS_EDITAVEIS);
  if (!body.titulo || !String(body.titulo).trim()) { return res.status(400).json({ erro: "Informe o título." }); }

  const slug = slugify(body.slug || body.titulo);
  if (!slug) { return res.status(400).json({ erro: "Não foi possível gerar o endereço da página a partir do título." }); }

  try {
    const saved = await db.mutate((d) => {
      const i = d.posts.findIndex((p) => p.id === id);
      if (i === -1) { const err = new Error("NAO_ENCONTRADO"); err.status = 404; throw err; }
      if (d.posts.some((p) => p.slug === slug && p.id !== id)) {
        const err = new Error("SLUG_EM_USO"); err.status = 409; throw err;
      }
      const post = Object.assign({}, d.posts[i], body, {
        id,
        slug,
        conteudo: sanitizeConteudo(body.conteudo),
        status: body.status === "publicado" ? "publicado" : "rascunho",
        atualizadoEm: nowISO()
      });
      d.posts[i] = post;
      return post;
    });
    res.json(saved);
  } catch (e) {
    if (e.message === "NAO_ENCONTRADO") { return res.status(404).json({ erro: "Publicação não encontrada." }); }
    if (e.message === "SLUG_EM_USO") {
      return res.status(409).json({ erro: "Já existe uma publicação com o endereço “" + slug + "”. Ajuste o título ou o endereço." });
    }
    throw e;
  }
}));

/* DELETE /posts/:id — remove (logado) */
router.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = req.params.id;
  const existiu = await db.mutate((d) => {
    const antes = d.posts.length;
    d.posts = d.posts.filter((p) => p.id !== id);
    return d.posts.length < antes;
  });
  if (!existiu) { return res.status(404).json({ erro: "Publicação não encontrada." }); }
  res.status(204).end();
}));

module.exports = router;
