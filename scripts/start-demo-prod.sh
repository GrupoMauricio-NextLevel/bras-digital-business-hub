#!/bin/bash
# Servidor de demonstração a partir do build de produção (porta 3100, banco em memória). Rápido para varreduras de QA.
# Antes: NEXT_PUBLIC_DEMO_MODE=true npm run build. Rode SEMPRE como arquivo (bash scripts/start-demo-prod.sh).
cd "$(dirname "$0")/.."
for d in $(ls /proc | grep -E '^[0-9]+$'); do
  if [ "$d" != "$$" ] && grep -qa "next-server\|next dev\|next start" /proc/$d/cmdline 2>/dev/null; then kill "$d" 2>/dev/null; fi
done
sleep 2
(BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true SERVER_ACTIONS_ALLOWED_ORIGINS=localhost:3100 NEXT_PUBLIC_DEMO_MODE=true DEMO_AUTOSEED=true DATABASE_URL=pglite://memory SESSION_SECRET=teste-local-segredo-1234567890 CRON_SECRET=teste-cron-1234567890 nohup setsid npx next start -p 3100 > /tmp/prod3100.log 2>&1 &)
for i in $(seq 1 60); do sleep 2; c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 localhost:3100/login); [ "$c" = "200" ] && break; done
echo "servidor (build de produção): HTTP $c"
