#!/bin/bash
# Gera os PDFs dos guias da família a partir dos .md em docs/manual (rode depois de editar um guia).
# Saídas: versão escura (para ler à noite, a principal) e versão clara (-claro, para imprimir).
# Precisa: python3 com `markdown` e `beautifulsoup4` (pip install markdown beautifulsoup4) e o Chromium do Playwright.
set -e
cd "$(dirname "$0")/../.."
T=$(mktemp -d)
gerar() { # md tema nome titulo subtitulo para rodape
  for modo in escuro claro; do
    suf=""; cor="#9aa3c7"; [ "$modo" = "claro" ] && { suf="-claro"; cor="#7a8396"; }
    python3 scripts/manuais/md-para-html.py "$1" "$T/$3$suf.html" "$2" "$modo" "$4" "$5" "$6" >/dev/null
    node scripts/manuais/html-para-pdf.mjs "$T/$3$suf.html" "docs/manual/$3$suf.pdf" "$7" "$cor"
  done
}
gerar docs/manual/GUIA-DO-EXPLORADOR-SAMUEL.md samuel GUIA-DO-EXPLORADOR-SAMUEL "Guia do Explorador" "A grande inspeção do Sistema NextLevel: 10 mundos, superpoderes de teste, medalhas e chefões" "Agente Samuel" "Guia do Explorador · Samuel"
gerar docs/manual/GUIA-GESTAO-FINANCEIRA-DANIELLE.md danielle GUIA-GESTAO-FINANCEIRA-DANIELLE "Guia da Gestão Financeira" "Como o Grupo NextLevel ganha, cobra, confere e decide: um curso em 6 módulos" "Danielle Terceiro" "Guia da Gestão Financeira · Danielle Terceiro"
rm -rf "${T:?}"
