# Contrato da API do blog

> **Status: já implementado.** O backend descrito aqui existe em `server/` (Node + Express)
> e `js/config.js` já aponta para ele (`dados: { adaptador: "rest", apiBase: "/api" }`).
> Este documento continua valendo como referência do contrato — e serve caso um dia vocês
> troquem de tecnologia de backend, já que o front-end (`js/store/store.js`) só conhece
> esta interface, nunca o banco por trás dela. Deploy: ver `LEIA-ME.md`.

## Regras gerais

- JSON em UTF-8. Datas no formato `AAAA-MM-DD`; carimbos em ISO 8601.
- Autenticação por **cookie de sessão HttpOnly + Secure + SameSite=Lax** (o front envia `credentials: "include"`).
  Nunca devolva token em corpo de resposta para ser guardado no navegador.
- Erros: status HTTP adequado + corpo `{ "erro": "Mensagem legível em português" }` — o painel exibe essa mensagem.
- **Sanitize o HTML de `conteudo` também no servidor** (mesma lista de permissões de `js/lib/sanitize.js`:
  p, br, strong, em, u, h2, h3, h4, ul, ol, li, blockquote, a[href,title], hr, figure, figcaption, img[src,alt]).
- Senhas com hash forte (bcrypt/argon2). Limite de tentativas no login.
- Se a API ficar em outro domínio, configure CORS permitindo apenas a origem do site, com credenciais.

## Objeto `Post`

| campo         | tipo   | observação |
|---------------|--------|------------|
| `id`          | string | gerado pelo servidor |
| `slug`        | string | único; `a-z0-9-` |
| `titulo`      | string | obrigatório |
| `resumo`      | string | até 220 caracteres |
| `conteudo`    | string | HTML sanitizado |
| `categoria`   | string | texto livre (o painel sugere as existentes) |
| `autor`       | string | slug do integrante em `js/data/equipe.js` (ex.: `marcello-leal`) |
| `data`        | string | data de publicação exibida |
| `capa`        | string | URL da imagem (vinda de `POST /media`) |
| `linkExterno` | string | opcional (ex.: artigo original no LinkedIn) |
| `status`      | string | `rascunho` ou `publicado` |
| `atualizadoEm`| string | preenchido pelo servidor |

## Endpoints

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/posts` | público | Somente `publicado`, mais recentes primeiro. Com `?status=todos` (logado) inclui rascunhos. |
| GET    | `/posts/:slugOuId` | público* | Uma publicação. *Rascunho só para usuário logado; senão 404. |
| POST   | `/posts` | logado | Cria. Corpo: Post sem `id`. Retorna o Post salvo. 409 se o slug já existir. |
| PUT    | `/posts/:id` | logado | Atualiza. Retorna o Post salvo. |
| DELETE | `/posts/:id` | logado | Remove. 204. |
| POST   | `/media` | logado | `multipart/form-data`, campo `arquivo` (jpg/png/webp, máx. ~8 MB). Retorna `{ "url": "https://…" }`. Recomendado: redimensionar para 1600 px e gerar WebP. |
| GET    | `/settings` | público | `{ whatsappNumero, whatsappExibicao, email }` |
| PUT    | `/settings` | logado | Salva o mesmo objeto. |
| POST   | `/auth/login` | público | `{ email, senha }` → `{ nome, email, papel }` + cookie de sessão. 401 com `erro` se inválido. |
| POST   | `/auth/logout` | logado | Encerra a sessão. |
| GET    | `/auth/me` | — | Sessão atual ou 401. |
| GET    | `/users` | admin | Lista `{ nome, email, papel }`. |
| POST   | `/users` | admin | `{ nome, email, senha, papel: "editor"|"admin" }` cria ou atualiza. |
| DELETE | `/users/:email` | admin | Remove acesso (não permitir remover a si mesmo). |

## SEO do blog em produção

As páginas de artigo montam título, descrição e dados estruturados via JavaScript (o Google
renderiza JS). Para prévias perfeitas em WhatsApp/LinkedIn — que **não** executam JS — o ideal
é o backend servir `/conteudos/<slug>` já com as meta tags `og:*` preenchidas (renderização no
servidor ou pré-geração a cada publicação). Também é recomendável gerar `sitemap.xml` a cada
publicação.

## Implementação atual

`server/` (Node + Express), com os dados gravados em `data/db.json` (sem depender de um
banco externo) e as imagens em `data/uploads/`. Sessão por cookie HttpOnly assinado (JWT);
senhas com bcrypt; upload limitado a 8 MB / JPG-PNG-WebP; sanitização do HTML do artigo também
no servidor (`server/lib/sanitize.js`). Detalhes de cada rota em `server/routes/`.

Se um dia o volume de publicações justificar um banco de verdade (Postgres, por exemplo),
troque só `server/lib/store.js` — as rotas chamam apenas `db.read()`/`db.mutate()`, sem saber
como os dados são guardados por baixo.
