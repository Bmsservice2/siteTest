"use strict";
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../lib/store");
const { isEmail } = require("../lib/util");
const { requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

function publicUser(u) { return { nome: u.nome, email: u.email, papel: u.papel }; }

router.get("/", requireAdmin, asyncHandler(async (req, res) => {
  const list = await db.read((d) => d.users);
  res.json(list.map(publicUser));
}));

/* Cria OU atualiza (mesmo e-mail = atualiza nome/papel/senha) */
router.post("/", requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const nome = String(body.nome || "").trim() || email;
  const papel = body.papel === "admin" ? "admin" : "editor";

  if (!isEmail(email)) { return res.status(400).json({ erro: "Informe um e-mail válido." }); }
  if (body.senha && String(body.senha).length < 8) {
    return res.status(400).json({ erro: "A senha precisa ter pelo menos 8 caracteres." });
  }

  const existing = await db.read((d) => d.users.find((u) => u.email === email));
  if (!existing && !body.senha) {
    return res.status(400).json({ erro: "Defina uma senha inicial para o novo usuário." });
  }

  const senhaHash = body.senha ? await bcrypt.hash(String(body.senha), 12) : (existing && existing.senhaHash);

  const saved = await db.mutate((d) => {
    const i = d.users.findIndex((u) => u.email === email);
    const user = { nome, email, papel, senhaHash };
    if (i === -1) { d.users.push(user); } else { d.users[i] = user; }
    return user;
  });
  res.status(existing ? 200 : 201).json(publicUser(saved));
}));

router.delete("/:email", requireAdmin, asyncHandler(async (req, res) => {
  const email = decodeURIComponent(req.params.email).trim().toLowerCase();
  if (email === req.session.email) {
    return res.status(400).json({ erro: "Você não pode remover o próprio acesso." });
  }
  try {
    await db.mutate((d) => {
      const admins = d.users.filter((u) => u.papel === "admin");
      const alvo = d.users.find((u) => u.email === email);
      if (alvo && alvo.papel === "admin" && admins.length <= 1) {
        const err = new Error("ULTIMO_ADMIN"); throw err;
      }
      d.users = d.users.filter((u) => u.email !== email);
    });
  } catch (e) {
    if (e.message === "ULTIMO_ADMIN") {
      return res.status(400).json({ erro: "Este é o único administrador. Torne outra pessoa administradora antes de remover este acesso." });
    }
    throw e;
  }
  res.status(204).end();
}));

module.exports = router;
