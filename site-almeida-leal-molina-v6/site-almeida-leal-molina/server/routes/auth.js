"use strict";
const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const db = require("../lib/store");
const { setSessionCookie, clearSessionCookie } = require("../lib/auth");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// No máximo 10 tentativas de login por IP a cada 15 minutos.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de entrar. Aguarde alguns minutos e tente de novo." }
});

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  const senha = String((req.body && req.body.senha) || "");
  if (!email || !senha) { return res.status(400).json({ erro: "Informe e-mail e senha." }); }

  const user = await db.read((d) => d.users.find((u) => u.email === email));
  if (!user) { return res.status(401).json({ erro: "E-mail ou senha incorretos." }); }

  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) { return res.status(401).json({ erro: "E-mail ou senha incorretos." }); }

  setSessionCookie(res, user);
  res.json({ nome: user.nome, email: user.email, papel: user.papel });
}));

router.post("/logout", requireAuth, (req, res) => {
  clearSessionCookie(res);
  res.json(true);
});

router.get("/me", (req, res) => {
  if (!req.session) { return res.status(401).json({ erro: "Não autenticado." }); }
  res.json(req.session);
});

module.exports = router;
