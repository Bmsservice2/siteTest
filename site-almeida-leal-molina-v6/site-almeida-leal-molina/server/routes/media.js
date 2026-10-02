/* ============================================================
   UPLOAD DE IMAGENS (capas e imagens dentro do texto)
   O painel já redimensiona a imagem no navegador antes de enviar
   (ver js/admin.js), então aqui só validamos tipo/tamanho e
   gravamos com um nome aleatório — sem depender de libvips/sharp,
   o que evita problemas de compilação nativa no build do Nixpacks.
   ============================================================ */
"use strict";
const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const db = require("../lib/store");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const EXT_BY_MIME = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, db.UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname || "").slice(0, 5) || ".bin";
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!EXT_BY_MIME[file.mimetype]) { return cb(new Error("TIPO_INVALIDO")); }
    cb(null, true);
  }
});

router.post("/", requireAuth, (req, res) => {
  upload.single("arquivo")(req, res, (err) => {
    if (err) {
      if (err.message === "TIPO_INVALIDO") { return res.status(400).json({ erro: "Envie uma imagem JPG, PNG ou WebP." }); }
      if (err.code === "LIMIT_FILE_SIZE") { return res.status(400).json({ erro: "A imagem é maior que 8 MB." }); }
      return res.status(400).json({ erro: "Não foi possível enviar a imagem." });
    }
    if (!req.file) { return res.status(400).json({ erro: "Nenhuma imagem recebida." }); }
    // URL pública relativa: funciona atrás de qualquer domínio/proxy (Coolify/Traefik)
    // sem precisar saber o host de fora.
    const url = "/uploads/" + req.file.filename;
    res.status(201).json({ url });
  });
});

module.exports = router;
