# Site — Almeida, Leal & Molina Advogados

One-page institucional + blog com painel para a equipe. Front-end em HTML + CSS + JS puro
(sem build/bundler); backend em Node/Express (`server/`) que serve o site inteiro e a API
do blog, com os dados gravados em disco. Pronto para deploy no **Coolify** via **Nixpacks**.

## Testar no seu computador

Precisa de [Node.js](https://nodejs.org/) (versão 18 ou mais nova) instalado.

**Windows:** dê dois cliques em `ABRIR SITE.bat`. Na primeira vez ele instala as dependências
e cria um `.env` só para teste local (login `admin@almeidaleal.adv.br` / `admin123456`), depois
abre `http://localhost:3000`.

**Mac/Linux ou manualmente:**
```
npm install
cp .env.example .env
# o .env de exemplo já roda local; só troque JWT_SECRET (comando abaixo)
npm start
```
Abra `http://localhost:3000` (ou a porta que você definiu em `PORT`).

> ⚠ `.env.example` já vem pronto para **teste local** (`NODE_ENV=development`,
> `DATA_DIR=./data`). Não troque essas duas variáveis para os valores de produção
> ao testar na sua máquina: `DATA_DIR=/app/data` só existe dentro do container do
> Coolify (fora dele dá `EACCES: permission denied`), e `NODE_ENV=production`
> exige HTTPS para o cookie de login funcionar — em `http://localhost` o painel
> pareceria travado no login sem mostrar erro nenhum.

| Página | Endereço |
|---|---|
| Site | `/` |
| Blog | `/conteudos/` |
| Artigo | `/conteudos/<slug>` |
| Painel (onde a equipe escreve os posts) | `/admin/` |
| Perfil de integrante | `/#equipe/marcello-leal` |

No primeiro boot, se ainda não existir nenhum usuário, o servidor cria um administrador a
partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD` (ou gera uma senha aleatória e imprime nos logs, se
você não definir `ADMIN_PASSWORD`). Depois de entrar, crie o usuário de cada advogado(a) que
vai escrever em **Painel → Usuários** e, se quiser, remova o administrador de teste.

## ⚠ Antes de colocar no ar: gere as variáveis de produção

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Isso gera um `JWT_SECRET` forte — cole no Coolify (nunca reaproveite o valor de teste local).

## Deploy no Coolify (Hostinger VPS KVM2), com Nixpacks

O projeto já está pronto para o Coolify detectar como **app Node via Nixpacks** — não precisa
de Dockerfile: `package.json` define `"start": "node server/index.js"` e `nixpacks.toml` fixa
a versão do Node e desliga o passo de build (não existe bundler aqui).

1. **Suba o projeto para um Git** (GitHub/GitLab/Gitea) — é o jeito mais simples do Coolify
   rastrear novas versões e reconstruir a cada push. Se preferir, o Coolify também aceita
   upload direto, mas perde o redeploy automático.
2. **No Coolify:** New Resource → Application → escolha o repositório (ou "Public Repository"
   colando a URL) → branch principal.
3. **Build Pack:** selecione **Nixpacks** (deve ser detectado automaticamente por causa do
   `package.json`). Não defina Dockerfile.
4. **Porta:** o Coolify injeta a variável `PORT` automaticamente e o `server/index.js` já lê
   `process.env.PORT` — não precisa mexer em nada aqui, só confirme que a "Port" configurada
   no Coolify bate com o que o app expõe (o padrão do Coolify já resolve isso sozinho).
5. **Variáveis de ambiente** (Environment Variables do serviço):

   | Variável | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | o valor gerado no passo anterior |
   | `ADMIN_EMAIL` | e-mail do primeiro administrador |
   | `ADMIN_PASSWORD` | senha forte do primeiro administrador |
   | `DATA_DIR` | `/app/data` |

   (`PORT` o próprio Coolify já define; não precisa adicionar.)

6. **Volume persistente — passo crítico.** Sem isso, todo post, imagem e usuário criado é
   **apagado a cada novo deploy**, porque o Nixpacks reconstrói o container do zero. Em
   **Storages** (ou "Persistent Storage") do serviço, adicione um volume com:
   - **Destination Path (dentro do container):** `/app/data`
   - Deixe o Coolify escolher/gerenciar o volume no host (ou dê um nome fixo, ex.
     `alm-blog-data`).
7. **Domínio:** configure o domínio em Domains (ex. `almeidaleal.adv.br` e, se quiser,
   `www.`), o Coolify emite o certificado HTTPS sozinho (Let's Encrypt via Traefik). Com
   `NODE_ENV=production`, o cookie de login só é aceito em HTTPS — é por isso que o domínio
   com certificado precisa estar funcionando para o painel logar.
8. **Deploy.** Depois do primeiro deploy bem-sucedido, abra `https://seu-dominio/admin`,
   entre com o `ADMIN_EMAIL`/`ADMIN_PASSWORD` definidos, e cadastre os usuários reais da
   equipe em Usuários.
9. **Depois disso**, cada `git push` na branch configurada gera um novo deploy automático
   (se você ativou o auto-deploy do Coolify) — o volume de dados não é afetado.

### Backup dos dados

Os dados ficam em `/app/data` (dentro do volume): `db.json` (posts, usuários, configurações)
e `uploads/` (imagens). Vale configurar um backup periódico desse volume pelo próprio Coolify
(Storages → Backups, se disponível na sua versão) ou um cron simples de `rsync`/`tar` no VPS.

### Se preferir não usar Git

Dá para fazer upload do projeto direto pela interface do Coolify ("Docker Compose"/"Upload"),
mas você perde os deploys automáticos a cada mudança — cada atualização de código exigiria
subir o zip de novo. Recomendo o Git.

## Como a equipe usa o blog no dia a dia

Qualquer pessoa cadastrada em **Usuários** entra em `/admin`, e pelo editor:
título, resumo, categoria, autor (puxado da equipe cadastrada em `js/data/equipe.js`), data,
imagem de capa e o texto (com negrito, itálico, links, listas, citação e imagens no meio do
texto — cola do Word também, a formatação é limpa automaticamente). Pode salvar como
**rascunho** (só quem está logado vê) ou **publicar** direto; dá pra pré-visualizar antes.
Perfil **editor** publica e edita conteúdo; perfil **administrador** também gerencia usuários
e as configurações de contato (WhatsApp/e-mail) que aparecem no site inteiro.

## Onde alterar cada coisa (fonte única)

| O quê | Onde |
|---|---|
| WhatsApp, e-mail, endereços, LinkedIn, vídeo do hero | `js/config.js`; WhatsApp/e-mail também dá pra mudar pelo painel → Configurações (sobrepõe o arquivo) |
| Integrantes: nome, cargo, foto, LinkedIn, OAB, biografia, formação, áreas | `js/data/equipe.js` |
| Áreas de atuação e textos detalhados | `js/data/areas.js` |
| Fotos, biografias, formação, OAB e LinkedIn | `js/data/equipe.js` + `node tools/gerar-equipe-html.js` |
| Publicações do blog | pelo painel `/admin` (não mais em `js/data/seed-posts.js`, que só existe como semente do modo demonstração) |
| Cores e tipografia | topo de `css/styles.css` (`:root`) |

**Foto nova de integrante:** gere `nome.jpg`, `nome.webp`, `nome-480.jpg` e `nome-480.webp`
(retrato 2:3, 960 px e 480 px de largura) em `assets/img/equipe/` e preencha `foto:` no
`equipe.js`. Sem foto (`foto: null`) aparece um placeholder com as iniciais.

**Depois de mexer em CSS/JS do front-end**, incremente o `?v=1` nos HTML e faça o deploy de
novo (ou, em teste local, recarregue com Ctrl+F5).

## Equipe e biografias — fixas no HTML

Todos os 16 integrantes estão escritos **direto no `index.html`** (aparecem mesmo sem
JavaScript e são lidos pelo Google). Os três sócios mostram **biografia e formação** na
própria página, em "Biografia e formação" (expansível); clicar na foto abre o perfil lateral.
Não há opção de incluir/remover integrantes pelo painel.

Para mudar algo (foto nova, cargo, biografia de outro integrante quando chegar):
1. edite `js/data/equipe.js` (campos `foto`, `cargo`, `bio`, `formacao`, `linkedin`, `oab`);
2. rode `node tools/gerar-equipe-html.js` — ele reescreve só os blocos entre os marcadores
   `SOCIOS:INICIO/FIM` e `EQUIPE:INICIO/FIM` do `index.html`.

Foto nova: gere `nome.jpg`, `nome.webp`, `nome-480.jpg` e `nome-480.webp` em
`assets/img/equipe/` e aponte `foto:` para `assets/img/equipe/nome`.

Hoje faltam as fotos de Larissa Piotto, Gabriela Paranhos, Gabriel Pereira, Pedro Bornay e
Nathalia Vivas, e as biografias dos integrantes que não são sócios (nunca foram enviadas).

## Acesso ao painel

Botão **Painel** (cadeado) no topo de todas as páginas, link no menu lateral e no rodapé.
No painel, "Ver o site" e "Ver blog publicado" levam de volta.

## Vídeo do hero

Hoje toca o vídeo do YouTube (`6my2ltOHaZE`) como **fundo decorativo**: sem controles, sem
cliques, sem título ou logo clicável — não há como o visitante ser levado ao YouTube. Aparece
~2 s depois do carregamento (esconde o "flash" inicial do player); até lá, e se o vídeo não
carregar, fica a foto dos sócios. Para usar um arquivo próprio (100% offline): coloque
`banner.mp4` em `assets/video/` e troque `heroVideo.provider` para `"local"` em `js/config.js`.

## Experiência interativa (css/experience.css + js/experience.js)

Camada separada, carregada por cima do design base — dá para ajustar (ou desligar, removendo
as duas linhas dos HTML) sem mexer no resto do site.

- **Balança da justiça** em SVG no hero: se desenha ao abrir, oscila e reage ao mouse,
  sempre voltando ao equilíbrio.
- **Texto digitado** no hero percorrendo as áreas de atuação (de `js/data/areas.js`).
- **Faixa de números** com contagem animada, calculada dos próprios dados do site (sócios,
  equipe, áreas, unidades) — nunca desatualizada nem inventada.
- **Divisores com coluna clássica** que se desenham ao rolar.
- **Glossário jurídico**: *consultivo*, *contencioso*, *Procuradoria da Fazenda Nacional* e
  *Conselho de Contribuintes* ganham explicação ao passar o mouse/tocar.
- **Atendimento guiado** (botão flutuante, em cada área e no contato): 3 perguntas + revisão;
  o site monta a mensagem para WhatsApp ou e-mail. Nada é salvo pelo site.
- **Aviso discreto** oferecendo o atendimento: uma vez por visita, só após 35% de rolagem (ou
  45 s), e nunca se o visitante já abriu o assistente.
- **Aviso de privacidade (LGPD)** citando YouTube e Google Fonts. *Falta linkar a Política
  de Privacidade quando o escritório enviar o texto.*
- **Martelo (gavel)** que "bate" ao chegar no contato e no hover dos botões.
- Barra de progresso, trilho lateral de seções (telas largas), cursor próprio (só mouse),
  spotlight nas fotos dos sócios, brilho nos botões.
- Respeita `prefers-reduced-motion` e funciona mesmo se as bibliotecas de CDN falharem.

**Publicidade na advocacia (Provimento OAB 205/2021):** de propósito, não há pop-up de saída,
contagem regressiva ou chamadas insistentes — o tom é informativo.

## Botões

Todos os botões e links de ação mudam de cor, crescem levemente ao passar o mouse e
"afundam" ao clicar (site e painel). Ajustes na seção 20 de `css/experience.css`.

## Estrutura

```
index.html               one-page (hero, escritório, áreas, sócios, equipe, conteúdos, contato)
conteudos/index.html      listagem com busca e filtro por categoria
conteudos/artigo.html     artigo, autor, compartilhamento, "leia também"
admin/index.html          painel: login, publicações, editor, configurações, usuários
css/ · js/                front-end (ver tabela acima)
server/                   backend Node/Express
  index.js                 servidor: estático + API + segurança
  lib/store.js              persistência em data/db.json (escrita atômica)
  lib/auth.js, middleware/  login por cookie JWT, checagem de origem
  lib/sanitize.js           limpeza do HTML dos artigos (também no servidor)
  lib/seed.js               cria o primeiro administrador no primeiro boot
  routes/                   posts, media (upload), settings, auth, users
docs/API-CONTRATO.md      contrato da API (documentação de referência)
package.json · nixpacks.toml · .env.example    deploy (Coolify/Nixpacks)
.htaccess                 legado: só usado se um dia virar hospedagem estática (ver o arquivo)
```

## Pendências com o cliente (marcadas `TODO` no código)

1. **E-mail**: briefing usa `contato@almeidaleal.adv.br`; a última assinatura da Jéssica usa `@almeidalealmolina.com`.
2. **Domínio final** (canonical, Open Graph, schema, sitemap) — hoje os arquivos assumem `almeidaleal.adv.br`.
3. **Endereço RJ**: validar a redação "Rua Sete de Setembro, nº 71, sala 701 — 7º andar".
4. **CNPJ** exibido no rodapé: confirmar.
5. **Fotos pendentes**: Larissa Piotto, Gabriela Paranhos, Gabriel Pereira, Pedro Bornay, Nathalia Vivas.
6. **Textos detalhados das áreas** (hoje há só resumos gerais, sem afirmações técnicas).
7. **Vídeo do hero**: confirmar que o YouTube permite incorporação, ou providenciar o arquivo local.
8. Biografias e LinkedIn dos demais integrantes (o layout já comporta).

## Segurança — o que já está implementado

- Senhas com bcrypt (nunca em texto puro).
- Login por cookie **HttpOnly** (não acessível por JavaScript) + `Secure` em produção (exige
  HTTPS) + `SameSite=Lax`, assinado com JWT (`JWT_SECRET`).
- Limite de tentativas de login (10 a cada 15 min por IP).
- Checagem de origem nas rotas que alteram dados (mitiga CSRF).
- HTML dos artigos sanitizado no servidor (lista de permissões), mesmo que alguém chame a API
  direto, sem passar pelo editor do painel.
- Upload de imagem restrito a JPG/PNG/WebP, até 8 MB.
- Um administrador não consegue remover o próprio acesso nem remover o último administrador
  restante.
- Painel fora dos buscadores (`X-Robots-Tag: noindex`).
