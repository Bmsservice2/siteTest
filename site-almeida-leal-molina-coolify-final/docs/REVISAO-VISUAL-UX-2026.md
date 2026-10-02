# Revisão Visual e UX — Almeida, Leal & Molina

## Objetivo

Revisar a apresentação do site existente sem reconstruí-lo do zero. A estrutura de dados, blog, painel, adaptadores e URLs foram preservados.

## Principais mudanças

- Hero preparado para vídeo local MP4/WebM com poster e fallback.
- Configuração do vídeo centralizada em `js/config.js`.
- Hero ganhou ritmo editorial, indicador de scroll e lista numerada de áreas.
- Nova faixa editorial entre Hero e O Escritório para reduzir a sensação de página vazia.
- O Escritório ganhou composição assimétrica e microinterações fotográficas.
- Áreas ganharam numeração, estados ativos e movimento discreto, mantendo o acordeão acessível.
- Sócios passaram a usar composição de 12 colunas, com destaque visual para o primeiro retrato.
- Equipe recebeu grid editorial assimétrico em telas grandes, mantendo filtros e dados em `js/data/equipe.js`.
- Faixa fotográfica ganhou overlay e melhor integração entre seções.
- Conteúdos ganhou uma introdução editorial e destaque visual para a primeira publicação.
- Página de Conteúdos ganhou hero mais forte e grid editorial.
- Botões, links, fotos e filtros receberam microinterações consistentes.
- Header passa a ficar visualmente mais compacto quando o visitante rola a página.
- Contato ganhou hierarquia tipográfica maior e composição com RJ / SP.
- `prefers-reduced-motion` continua sendo respeitado.

## Blog

O front-end continua usando `ALM_STORE` e os adaptadores existentes. O modo `local` permanece como demonstração. A produção deve usar o adaptador REST e uma API que siga `docs/API-CONTRATO.md`.

O painel existente continua com criação, edição, rascunho, publicação, exclusão, preview, upload de capa/imagem e configurações.

## Vídeo

Quando o cliente entregar o vídeo, coloque `banner.mp4` em `assets/video/` e, opcionalmente, `banner.webm`. Em `js/config.js`, altere apenas `heroVideo.enabled` para `true`.

## Não alterado

- Fonte de dados da equipe.
- Fotos existentes.
- Dados das áreas.
- Estrutura do painel.
- Adaptadores local e REST.
- URLs principais.
- SEO, sitemap, robots e `.htaccess`.
- Mecanismo de perfil por `#equipe/slug`.
