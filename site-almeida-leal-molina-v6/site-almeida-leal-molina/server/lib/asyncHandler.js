/* Express 4 não encaminha rejeições de Promise de handlers async para o
   middleware de erro sozinho — sem isto, um erro inesperado faria a
   requisição ficar pendurada em vez de responder com 500. */
"use strict";
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
