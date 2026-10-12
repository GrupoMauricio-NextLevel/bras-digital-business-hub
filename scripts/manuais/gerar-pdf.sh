#!/bin/bash
# Gera os PDFs dos guias da família a partir dos .md em docs/manual (rode depois de editar um guia).
# Precisa: python3 com o pacote `markdown` (pip install markdown) e o Chromium do Playwright.
set -e
cd "$(dirname "$0")/../.."
T=$(mktemp -d)
python3 scripts/manuais/md-para-html.py docs/manual/GUIA-DO-EXPLORADOR-SAMUEL.md "$T/samuel.html" samuel "Guia do Explorador" "A grande inspeção do Sistema NextLevel: missões, superpoderes de teste, medalhas e chefões" "Agente Samuel"
node scripts/manuais/html-para-pdf.mjs "$T/samuel.html" docs/manual/GUIA-DO-EXPLORADOR-SAMUEL.pdf "Guia do Explorador · Samuel"
python3 scripts/manuais/md-para-html.py docs/manual/GUIA-GESTAO-FINANCEIRA-DANIELLE.md "$T/danielle.html" danielle "Guia da Gestão Financeira" "Como o Grupo NextLevel ganha, cobra, confere e decide: um curso em 6 módulos" "Danielle Terceiro"
node scripts/manuais/html-para-pdf.mjs "$T/danielle.html" docs/manual/GUIA-GESTAO-FINANCEIRA-DANIELLE.pdf "Guia da Gestão Financeira · Danielle Terceiro"
rm -rf "$T"
