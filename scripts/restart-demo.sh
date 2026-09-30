#!/bin/bash
# Reinicia o servidor de demonstração (porta 3100) e aquece as rotas principais.
# Rode SEMPRE como arquivo (bash scripts/restart-demo.sh), nunca colando o corpo num comando: o filtro por "next dev" mataria o próprio shell.
cd "$(dirname "$0")/.."
for d in $(ls /proc | grep -E '^[0-9]+$'); do
  if [ "$d" != "$$" ] && grep -qa "next-server\|next dev" /proc/$d/cmdline 2>/dev/null; then kill "$d" 2>/dev/null; fi
done
sleep 3
[ "$1" = "--limpo" ] && rm -rf .next
(nohup setsid bash scripts/dev-demo.sh > /tmp/dev.log 2>&1 &)
sleep 10
for u in /login /cadastro /parceiros /loja-nextlevel /master /supplier /merchant /partner; do curl -s -o /dev/null --max-time 250 "localhost:3100$u"; done
curl -s -o /dev/null -w "servidor de demonstração: HTTP %{http_code}\n" --max-time 60 localhost:3100/login
