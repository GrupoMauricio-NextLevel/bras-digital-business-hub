#!/bin/bash
# Servidor de demonstração local (porta 3100, banco em memória com dados de exemplo). Não use em produção.
cd "$(dirname "$0")/.."
NEXT_PUBLIC_DEMO_MODE=true DEMO_AUTOSEED=true DATABASE_URL=pglite://memory SESSION_SECRET=teste-local-segredo-1234567890 CRON_SECRET=teste-cron-1234567890 exec npx next dev -p 3100
