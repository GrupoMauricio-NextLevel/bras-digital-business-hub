#!/bin/bash
# Teste ponta a ponta em ambiente limpo, sem dados de demonstração e com Mercado Pago simulado.
# Uso: npm run e2e            (usa e2e/scenario.mjs)
#      E2E_SCENARIO=e2e/outro.mjs npm run e2e
set -e
cd "$(dirname "$0")/.."
OUT=".e2e"; SCENARIO="${E2E_SCENARIO:-e2e/scenario.mjs}"
stop() { for p in $(ps -eo pid,args | grep -E "next-server|next dev -p 3300|e2e/fake-mp" | grep -v grep | awk '{print $1}'); do kill "$p" 2>/dev/null || true; done; }
stop; sleep 1; rm -rf "$OUT/pg" .next; mkdir -p "$OUT"
export DATABASE_URL="pglite://$PWD/$OUT/pg" MASTER_EMAIL=master@teste.com MASTER_PASSWORD=Master-Teste-2026 SESSION_SECRET=e2e-secret-e2e-secret-1234 CRON_SECRET=cron-e2e E2E_OUT="$OUT"
unset SEED_DEMO
npm run db:bootstrap 2>&1 | tail -2
(setsid nohup node e2e/fake-mp.mjs > "$OUT/fake-mp.log" 2>&1 &)
(NEXT_PUBLIC_DEMO_MODE=false MERCADOPAGO_API_URL=http://localhost:4010 setsid nohup npx next dev -p 3300 > "$OUT/dev.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3300/login && break; sleep 1; done
set +e; node "$SCENARIO"; CODE=$?; stop; exit $CODE
