#!/bin/bash
# Liga as verificações automáticas locais (pre-commit e pre-push). Rode uma vez por cópia do repositório.
cd "$(dirname "$0")/.." || exit 1
chmod +x .githooks/* .claude/hooks/*.sh 2>/dev/null
git config core.hooksPath .githooks
echo "Ganchos ligados: tipos e estilo antes de cada commit e de cada push."
