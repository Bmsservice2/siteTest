/* Card de publicação — usado na home e na página de Conteúdos. */
(function () {
  "use strict";
  var U = window.ALM_UTILS, esc = U.esc;
  window.ALM_postCard = function (post, rootPrefix) {
    var r = rootPrefix == null ? U.root() : rootPrefix;
    var autor = U.pessoa(post.autor);
    var href = r + "conteudos/artigo.html?slug=" + encodeURIComponent(post.slug);
    var cover = post.capa
      ? '<a class="post-card__cover" href="' + href + '" tabindex="-1" aria-hidden="true"><img src="' + esc(post.capa) + '" alt="" loading="lazy"></a>'
      : '<a class="post-card__cover post-card__cover--empty" href="' + href + '" tabindex="-1" aria-hidden="true">' + esc(post.categoria || "ALM") + '</a>';
    var meta = [];
    if (post.categoria) { meta.push('<span class="post-card__cat">' + esc(post.categoria) + '</span>'); }
    if (post.data) { meta.push('<time datetime="' + esc(post.data) + '">' + U.formatDate(post.data) + '</time>'); }
    if (post.linkExterno) { meta.push("<span>Publicado no LinkedIn</span>"); }
    return '<article class="post-card">' + cover +
      '<div class="post-card__meta">' + meta.join("") + '</div>' +
      '<h3 class="post-card__title"><a href="' + href + '">' + esc(post.titulo) + '</a></h3>' +
      (post.resumo ? '<p class="post-card__excerpt">' + esc(post.resumo) + '</p>' : "") +
      (autor ? '<p class="post-card__author">Por ' + esc(autor.nomeCurto || autor.nome) + '</p>' : "") +
    '</article>';
  };

})();
