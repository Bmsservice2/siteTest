"use strict";
const { readSession } = require("../lib/auth");

/** Lê a sessão (se houver) e disponibiliza em req.session, sem bloquear
 *  a requisição — usado em rotas que são públicas mas se comportam
 *  diferente para quem está logado (ex.: GET /posts com rascunhos). */
function attachSession(req, res, next) {
  req.session = readSession(req);
  next();
}

function requireAuth(req, res, next) {
  if (!req.session) { return res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." }); }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session) { return res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." }); }
  if (req.session.papel !== "admin") { return res.status(403).json({ erro: "Apenas administradores podem fazer isso." }); }
  next();
}

/** Checagem simples de CSRF para requisições que mudam estado.
 *  Como a autenticação é por cookie, um site malicioso poderia tentar
 *  disparar um POST/PUT/DELETE "sem querer" no navegador de alguém
 *  logado. Como o cookie é SameSite=Lax, isso já bloqueia a maioria
 *  dos casos; esta checagem de Origin é uma segunda camada, sem exigir
 *  que o front-end envie um token extra. */
function verifyOrigin(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") { return next(); }
  const origin = req.get("origin");
  if (!origin) { return next(); } // chamadas same-origin "simples" nem sempre enviam Origin
  let host;
  try { host = new URL(origin).host; } catch (e) { return res.status(403).json({ erro: "Origem inválida." }); }
  if (host !== req.get("host")) {
    return res.status(403).json({ erro: "Origem não permitida." });
  }
  next();
}

module.exports = { attachSession, requireAuth, requireAdmin, verifyOrigin };
