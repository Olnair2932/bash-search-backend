#!/bin/bash

# --- Sentinela SRE: Protocolo Atomic-Push v2.0 ---

echo "🚀 Iniciando Ciclo de Sincronização..."

# 1. Verificar Saúde do Backend antes de começar
if ! curl -I -s https://bash-search-backend.onrender.com | grep -q "200 OK"; then
    echo "⚠️ ALERTA: Backend parece estar offline. Prosseguindo com cautela..."
fi

# 2. Executar Purga de Memória Local
echo "🧹 Limpando Firestore (Purga Rotativa)..."
node purge_memoria.js || { echo "❌ Falha na Purga. Abortando Sincronização."; exit 1; }

# 3. Definir Mensagem de Commit Semântico
echo "--------------------------------------"
echo "Escolha o tipo de alteração:"
echo "1) feat (nova funcionalidade)"
echo "2) fix (correção de erro)"
echo "3) perf (melhoria de performance)"
echo "4) docs (documentação)"
read -p "Opção (1-4): " OPT

case $OPT in
    1) TYPE="feat" ;;
    2) TYPE="fix" ;;
    3) TYPE="perf" ;;
    4) TYPE="docs" ;;
    *) TYPE="chore" ;;
esac

read -p "Descreva a alteração: " MSG

# 4. Processo Atômico de Git
echo "📦 Empacotando e enviando para o GitHub..."
git add .
git commit -m "$TYPE: $MSG"
git push origin main

echo "✅ [SRE] Sincronização Global Concluída!"
