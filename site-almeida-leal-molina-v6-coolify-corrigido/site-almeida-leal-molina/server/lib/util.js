"use strict";
const crypto = require("crypto");

function slugify(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function isEmail(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || "").trim());
}

function newId(prefix) {
  return (prefix || "id") + "-" + crypto.randomBytes(9).toString("base64url");
}

function nowISO() {
  return new Date().toISOString();
}

/** Remove campos que o cliente não deveria conseguir setar diretamente
 *  (id, hash de senha, etc.) ao aceitar um corpo de requisição. */
function pick(obj, fields) {
  const out = {};
  fields.forEach((f) => { if (obj && obj[f] !== undefined) { out[f] = obj[f]; } });
  return out;
}

module.exports = { slugify, isEmail, newId, nowISO, pick };
