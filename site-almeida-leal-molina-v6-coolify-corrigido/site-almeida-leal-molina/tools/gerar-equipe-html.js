/* ============================================================
   Regenera, no index.html, os blocos de Sócios (com biografia e
   formação) e Equipe a partir de js/data/equipe.js.
   Uso (na pasta do projeto):   node tools/gerar-equipe-html.js
   Rode sempre que mudar nome, cargo, foto, OAB, LinkedIn,
   biografia ou formação em js/data/equipe.js.
   ============================================================ */
const fs = require("fs"), vm = require("vm"), path = require("path");
process.chdir(path.join(__dirname, ".."));
const ctx = { window: {}, document: { documentElement: { getAttribute: () => "" } } };
ctx.window.document = ctx.document; vm.createContext(ctx);
["js/data/equipe.js", "js/lib/utils.js"].forEach(f => vm.runInContext(fs.readFileSync(f, "utf8"), ctx));
const EQ = ctx.window.ALM_EQUIPE, U = ctx.window.ALM_UTILS, esc = U.esc;
const LI = '<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4v-11Z"/></svg>';
const photo = (p, o) => p.foto ? U.picture(p.foto, p.nome, o) :
  '<div class="photo-ph" role="img" aria-label="Foto de ' + esc(p.nome) + ' a ser incluída"><span class="photo-ph__mono" aria-hidden="true">' + esc(U.initials(p.nome)) + '</span><span class="photo-ph__note" aria-hidden="true">Foto em breve</span></div>';
const linkedin = p => !p.linkedin ? "" : '<a class="linkedin" href="' + esc(p.linkedin) + '" target="_blank" rel="noopener" aria-label="LinkedIn de ' + esc(p.nomeCurto || p.nome) + ' (abre em nova aba)">' + LI + '<span>LinkedIn</span></a>';
const I = "          ";
const partners = EQ.filter(p => p.socio).map(p =>
I+'<article class="partner" id="socio-' + p.slug + '">\n' +
I+'  <button class="partner__photo-wrap" type="button" data-profile="' + p.slug + '" aria-label="Abrir perfil de ' + esc(p.nome) + '">' + photo(p) + '</button>\n' +
I+'  <div class="partner__body">\n' +
I+'    <h3 class="partner__name">' + esc(p.nome) + '</h3>\n' +
I+'    <p class="partner__role">' + esc(p.cargo) + (p.oab ? ' · ' + esc(p.oab) : '') + '</p>\n' +
(p.destaque ? I+'    <p class="partner__highlight">' + esc(p.destaque) + '</p>\n' : '') +
I+'    <details class="partner__bio">\n' +
I+'      <summary>Biografia e formação</summary>\n' +
I+'      <div class="partner__bio-body">\n' +
I+'        <h4>Atuação</h4>\n' + (p.bio||[]).map(t => I+'        <p>' + esc(t) + '</p>\n').join('') +
((p.formacao||[]).length ? I+'        <h4>Formação</h4>\n'+I+'        <ul>\n' + p.formacao.map(t => I+'          <li>' + esc(t) + '</li>\n').join('') + I+'        </ul>\n' : '') +
I+'      </div>\n' +
I+'    </details>\n' +
I+'    <div class="partner__actions">' + linkedin(p) + '</div>\n' +
I+'  </div>\n' +
I+'</article>').join("\n");
const team = EQ.filter(p => !p.socio).map(p =>
I+'<li class="member" data-areas="' + p.areas.join(" ") + '">\n' +
I+'  <div class="member__photo">' + photo(p, { small: true }) + '</div>\n' +
I+'  <h3 class="member__name"><button class="member__link" type="button" data-profile="' + p.slug + '">' + esc(p.nome) + '</button></h3>\n' +
I+'  <p class="member__role">' + esc(p.cargo) + '</p>\n' +
I+'</li>').join("\n");
let h = fs.readFileSync("index.html", "utf8");
const put = (tag, body) => {
  const re = new RegExp("(<!-- " + tag + ":INICIO[^>]*-->)[\\s\\S]*?(\\n\\s*<!-- " + tag + ":FIM -->)");
  if (!re.test(h)) { throw new Error("Marcadores " + tag + " não encontrados no index.html"); }
  h = h.replace(re, (m, a, b) => a + "\n" + body + b);
};
put("SOCIOS", partners);
put("EQUIPE", team);
fs.writeFileSync("index.html", h);
console.log("index.html atualizado — sócios:", (partners.match(/class="partner"/g)||[]).length, "| equipe:", (team.match(/class="member"/g)||[]).length);
