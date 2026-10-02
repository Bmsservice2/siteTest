/* ============================================================
   PERSISTÊNCIA — arquivo JSON único (data/db.json)
   ------------------------------------------------------------
   Sem dependências nativas (nada de compilar): roda em qualquer
   ambiente Nixpacks sem risco de falha de build. Suficiente para
   o volume de um blog de escritório (dezenas/centenas de posts).

   Se um dia o volume justificar Postgres/MySQL, troque só este
   arquivo — o restante do servidor (routes/) não conhece o
   formato de armazenamento, só chama db.read()/db.write().

   Escrita atômica (grava em .tmp e renomeia) + fila em memória
   (evita duas escritas concorrentes corromperem o arquivo).
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function emptyDB() {
  return { users: [], posts: [], settings: {}, meta: { criadoEm: new Date().toISOString() } };
}

function readSync() {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const db = emptyDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    // Arquivo corrompido (queda de energia no meio de uma escrita, etc.):
    // preserva o original para inspeção manual em vez de perder os dados.
    const backup = DB_FILE + ".corrompido-" + Date.now();
    try { fs.copyFileSync(DB_FILE, backup); } catch (e2) { /* ignore */ }
    console.error("[db] Arquivo de dados corrompido. Cópia salva em " + backup + ". Iniciando um banco vazio.");
    const db = emptyDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
}

function writeSync(db) {
  ensureDirs();
  const tmp = DB_FILE + ".tmp-" + process.pid + "-" + Date.now();
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE); // rename é atômico no mesmo sistema de arquivos
}

/* Fila simples: cada chamada a mutate() só roda depois que a anterior
   terminou, então duas requisições simultâneas nunca leem o mesmo
   estado "velho" e se pisam na escrita. */
let queue = Promise.resolve();

/**
 * Lê o banco, deixa `fn` alterá-lo (em memória) e retornar um valor;
 * se `fn` não lançar erro, salva o resultado. Uso:
 *   const post = await mutate(db => { db.posts.push(p); return p; });
 */
function mutate(fn) {
  const task = queue.then(() => {
    const db = readSync();
    const result = fn(db);
    return Promise.resolve(result).then((r) => {
      writeSync(db);
      return r;
    });
  });
  // Mantém a fila viva mesmo se esta tarefa falhar, sem propagar o erro
  // para as próximas chamadas.
  queue = task.catch(() => {});
  return task;
}

/** Leitura simples, sem intenção de escrever (ainda assim entra na fila,
 *  para nunca ler um arquivo pela metade de outra escrita). */
function read(fn) {
  const task = queue.then(() => fn(readSync()));
  queue = task.then(() => {}).catch(() => {});
  return task;
}

module.exports = { DATA_DIR, UPLOADS_DIR, mutate, read, ensureDirs };
