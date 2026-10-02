/* ============================================================
   ALMEIDA, LEAL & MOLINA — servidor (front-end estático + API)
   Um único processo Node serve o site inteiro e a API do blog no
   mesmo domínio (/api/...), o que simplifica cookies e CORS e
   funciona bem no Nixpacks/Coolify: nada de configuração extra
   de proxy reverso além do que o Coolify já faz.
   ============================================================ */
"use strict";
const path = require("path");
const fs = require("fs");

// Carrega .env só se o arquivo existir (uso local/teste). Em produção
// (Coolify) as variáveis já vêm do ambiente do container — não suba
// um .env para lá. dotenv nunca lança erro se o arquivo não existir.
if (fs.existsSync(path.join(__dirname, "..", ".env"))) {
  require("dotenv").config();
}

const express = require("express");
const cookieParser = require("cookie-parser");

const db = require("./lib/store");
const { ensureAdmin } = require("./lib/seed");
const { attachSession, verifyOrigin } = require("./middleware/auth");

const ROOT = path.join(__dirname, "..");
const PORT = parseInt(process.env.PORT, 10) || 3000;
const isProd = process.env.NODE_ENV === "production";

const app = express();

// Atrás do proxy do Coolify (Traefik): necessário para req.secure /
// cookies "secure" funcionarem corretamente com HTTPS.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Health check usado pelo Coolify para verificar se o processo Node está vivo.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(attachSession);

// Cabeçalhos de segurança básicos (sem depender do pacote helmet).
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isProd) { res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains"); }
  next();
});

/* ---------------------------- API ---------------------------- */
app.use("/api", verifyOrigin);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/media", require("./routes/media"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/users", require("./routes/users"));

/* ------------------------- Uploads ----------------------------
   Imagens enviadas pelo painel. Fica fora de /api para poder usar
   cache longo (o nome do arquivo é aleatório, então nunca muda). */
app.use("/uploads", express.static(db.UPLOADS_DIR, { maxAge: "365d", immutable: true }));

/* --------------------- Painel fora de busca -------------------- */
app.use("/admin", (req, res, next) => { res.setHeader("X-Robots-Tag", "noindex, nofollow"); next(); });

/* --------------------- Front-end estático ---------------------- */
const STATIC_OPTIONS = {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    // CSS/JS/imagens são versionados por "?v=N" no HTML — cache longo é seguro.
    if (/\.(css|js|jpg|jpeg|png|webp|svg|woff2?)$/i.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else if (/\.html$/i.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    }
  }
};
app.use(express.static(ROOT, STATIC_OPTIONS));

/* URL amigável dos artigos: /conteudos/<slug> → conteudos/artigo.html
   (equivalente ao rewrite do .htaccess, agora do lado do Node — o
   blog.js já sabe ler o slug direto do caminho da URL). */
app.get(/^\/conteudos\/([a-z0-9-]+)\/?$/, (req, res) => {
  res.sendFile(path.join(ROOT, "conteudos", "artigo.html"));
});

/* ------------------------- Erros da API ------------------------- */
app.use("/api", (req, res) => { res.status(404).json({ erro: "Rota não encontrada." }); });
app.use("/api", (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error("[api]", err);
  const status = err.status || 500;
  res.status(status).json({ erro: status === 500 ? "Erro interno do servidor." : (err.message || "Erro.") });
});

/* Página 404 do site (fora da API) */
app.use((req, res) => {
  res.status(404).sendFile(path.join(ROOT, "404.html"), (err) => {
    if (err) { res.status(404).send("Página não encontrada."); }
  });
});

db.ensureDirs();
ensureAdmin()
  .catch((e) => console.error("[seed] Falha ao preparar o administrador inicial:", e))
  .then(() => {
    app.listen(PORT, () => {
      console.log("Almeida, Leal & Molina — servidor no ar em http://localhost:" + PORT);
      console.log("Dados persistidos em: " + db.DATA_DIR);
    });
  });
