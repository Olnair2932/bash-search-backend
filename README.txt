============================================================
              SENTINELA-BASH IA - v2.3
        Unidade de Processamento CLI - Projeto Memoria
============================================================

DESCRICAO:
O Sentinela-Bash e uma ferramenta hibrida para usuarios de 
Termux/Linux, combinando busca local de comandos e 
inteligencia artificial avançada (Gemini 1.5 Flash).

FUNCIONALIDADES:
- IA Sentinela: Respostas tecnicas e geracao de comandos.
- Busca Local: Filtro instantaneo de comandos via .txt.
- SRE Resiliente: Backend com tolerancia a falhas de DB.
- PWA: Instalavel como aplicativo no Android.

TECNOLOGIAS:
- Backend: Node.js, Express, Google Generative AI.
- Frontend: HTML5, Tailwind CSS, Marked.js.
- Cloud: Firebase Hosting & Render (API).
- Database: Google Firestore (Persistencia).

ESTRUTURA DE ARQUIVOS:
/public/         -> Frontend (index, config, comandos)
/index.js        -> Servidor Backend v2.3
/firebase.json   -> Configuracao Hosting
/package.json    -> Dependencias Node.js

COMANDOS DE DEPLOY:
1. Git Push (Render):
   git add . && git commit -m "update" && git push origin main

2. Firebase Hosting:
   firebase deploy --only hosting

DESENVOLVEDORES:
- Olnair Pereira
- IA Gemini (Arquitetura)

------------------------------------------------------------
Status: OPERACIONAL - Resiliencia SRE Ativa
URL: https://bash-eee21.web.app
------------------------------------------------------------
