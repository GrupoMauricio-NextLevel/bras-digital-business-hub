#!/bin/bash
# Gera as capturas "antes" (código do último commit) numa cópia temporária e as "depois" (pasta de trabalho atual).
# Rode como arquivo: bash scripts/capturas-antes-depois.sh antes|depois
# antes: cria worktree em /tmp/ds-antes (HEAD), compila em modo demonstração e sobe na porta 3200.
cd "$(dirname "$0")/.."
ROOT=$(pwd)
if [ "$1" = "antes" ]; then
  [ -d /tmp/ds-antes ] || git worktree add --detach /tmp/ds-antes HEAD
  cd /tmp/ds-antes
  [ -e node_modules ] || cp -al "$ROOT/node_modules" node_modules
  NEXT_PUBLIC_DEMO_MODE=true npm run build > /tmp/build-antes.log 2>&1
  echo "build antes: $(tail -1 /tmp/build-antes.log)"
  (BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true SERVER_ACTIONS_ALLOWED_ORIGINS=localhost:3200 NEXT_PUBLIC_DEMO_MODE=true DEMO_AUTOSEED=true DATABASE_URL=pglite://memory SESSION_SECRET=teste-local-segredo-1234567890 CRON_SECRET=teste-cron-1234567890 nohup setsid npx next start -p 3200 > /tmp/antes3200.log 2>&1 &)
  for i in $(seq 1 60); do sleep 2; c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 localhost:3200/login); [ "$c" = "200" ] && break; done
  echo "servidor antes: HTTP $c"
fi
