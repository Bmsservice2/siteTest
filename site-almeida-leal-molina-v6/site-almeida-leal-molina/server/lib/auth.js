/* ============================================================
   AUTENTICAÇÃO — sessão via cookie HttpOnly assinado (JWT)
   Sem tabela de sessões: o próprio cookie carrega e-mail/papel,
   assinado com JWT_SECRET, então revogar TODAS as sessões de uma
   vez é só trocar o JWT_SECRET (variável de ambiente no Coolify).
   ============================================================ */
"use strict";
const jwt = require("jsonwebtoken");

const COOKIE_NAME = "alm_session";
const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) {
  console.error(
    "[auth] JWT_SECRET ausente ou curto demais. Defina uma variável de ambiente " +
    "JWT_SECRET com pelo menos 32 caracteres aleatórios antes de subir o servidor " +
    "(gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")."
  );
  process.exit(1);
}

const isProd = process.env.NODE_ENV === "production";
const EXPIRES_IN = "30d";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,                 // exige HTTPS em produção (Coolify/Traefik já termina TLS)
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/"
  };
}

function sign(user) {
  // Corpo mínimo: nunca coloque hash de senha no token.
  return jwt.sign({ email: user.email, nome: user.nome, papel: user.papel }, SECRET, { expiresIn: EXPIRES_IN });
}

function setSessionCookie(res, user) {
  res.cookie(COOKIE_NAME, sign(user), cookieOptions());
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: isProd, sameSite: "lax", path: "/" });
}

function readSession(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) { return null; }
  try {
    const payload = jwt.verify(token, SECRET);
    return { email: payload.email, nome: payload.nome, papel: payload.papel };
  } catch (e) {
    return null; // token expirado, inválido ou assinado com um SECRET antigo
  }
}

module.exports = { COOKIE_NAME, setSessionCookie, clearSessionCookie, readSession };
