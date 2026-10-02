#!/bin/bash
# Prepara a sessão: instala dependências se faltarem e liga as verificações locais (idempotente e silencioso).
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
if [ ! -d node_modules ]; then npm install --no-audit --no-fund > /tmp/npm-install.log 2>&1 || echo "npm install falhou: veja /tmp/npm-install.log"; fi
git config core.hooksPath .githooks 2>/dev/null
exit 0
