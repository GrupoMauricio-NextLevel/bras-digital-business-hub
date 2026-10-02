#!/bin/bash
# Gancho do Claude Code (PreToolUse/Bash): antes de `git push`, roda tipos e estilo e bloqueia se houver erro (código de saída 2).
CMD=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input.command||"")}catch{console.log("")}})')
case "$CMD" in *"git push"*) ;; *) exit 0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
OUT=$(npx tsc --noEmit 2>&1) || { echo "Push bloqueado: erro de tipos. Corrija antes de enviar." >&2; echo "$OUT" | head -20 >&2; exit 2; }
OUT=$(npx eslint src e2e tests --max-warnings=0 2>&1) || { echo "Push bloqueado: erro de estilo. Corrija antes de enviar." >&2; echo "$OUT" | head -20 >&2; exit 2; }
exit 0
