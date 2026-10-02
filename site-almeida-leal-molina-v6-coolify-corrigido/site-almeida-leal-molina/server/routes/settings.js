"use strict";
const express = require("express");
const db = require("../lib/store");
const { isEmail } = require("../lib/util");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const settings = await db.read((d) => d.settings || {});
  res.json(settings);
}));

router.put("/", requireAuth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const numero = String(body.whatsappNumero || "").replace(/\D/g, "");
  const exibicao = String(body.whatsappExibicao || "").trim();
  const email = String(body.email || "").trim();

  if (numero && (numero.length < 12 || numero.length > 13)) {
    return res.status(400).json({ erro: "Informe o WhatsApp com DDI e DDD, ex.: 5521987059438." });
  }
  if (email && !isEmail(email)) {
    return res.status(400).json({ erro: "Informe um e-mail válido." });
  }

  const saved = await db.mutate((d) => {
    d.settings = { whatsappNumero: numero, whatsappExibicao: exibicao, email };
    return d.settings;
  });
  res.json(saved);
}));

module.exports = router;
