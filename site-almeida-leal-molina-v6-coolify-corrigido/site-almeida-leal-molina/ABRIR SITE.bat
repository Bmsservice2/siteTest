@echo off
chcp 65001 >nul
title Almeida, Leal ^& Molina - servidor local
cd /d "%~dp0"
echo.
echo  Iniciando o site (com o blog) em http://localhost:3000
echo  Feche esta janela para desligar o servidor.
echo.
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo  Node.js nao encontrado. Instale a versao LTS em https://nodejs.org/
  echo  e rode este arquivo de novo.
  pause
  exit /b
)
if not exist "node_modules" (
  echo  Primeira vez rodando aqui: instalando dependencias, um minuto...
  call npm install
)
if not exist ".env" (
  echo  Criando um .env local de teste ^(nao usar em producao^)...
  > .env echo PORT=3000
  >> .env echo NODE_ENV=development
  >> .env echo JWT_SECRET=chave-apenas-para-teste-local-trocar-em-producao-0000
  >> .env echo ADMIN_EMAIL=admin@almeidaleal.adv.br
  >> .env echo ADMIN_PASSWORD=admin123456
  >> .env echo DATA_DIR=./data
  echo  Acesso do painel para este teste local: admin@almeidaleal.adv.br / admin123456
)
start "" http://localhost:3000/
node server/index.js
pause
