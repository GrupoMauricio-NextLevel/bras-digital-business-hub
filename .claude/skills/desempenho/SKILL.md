---
name: desempenho
description: Medir e melhorar a velocidade do sistema (páginas públicas, vitrines das lojas e painéis internos) com metas, método e relatório antes/depois. Use quando o dono pedir "rápido e liso", antes de publicar uma tela nova, ou ao investigar lentidão, peso de imagem, cache, banco ou hospedagem.
---

# Desempenho

Skill não deixa nada rápido: **medir, achar o gargalo, corrigir, medir de novo**. Registre antes/depois em `docs/design/MEDICAO-DESEMPENHO-*.md`.

## Metas (a revisar com dados)
Páginas públicas no celular simulado (Lighthouse): nota ≥ 90, LCP ≤ 2,5 s, TBT ≤ 200 ms, CLS ≤ 0,1, peso ≤ 500 KB. Painéis: navegação ≤ 1 s com dados de demonstração e nenhuma consulta dentro de laço. Servidor (produção): TTFB ≤ 400 ms nas páginas públicas.

## Como medir
1. **Produção, de fora:** `curl -s -o /dev/null -w "ttfb=%{time_starttransfer} total=%{time_total}\n" https://...` (várias vezes; a primeira após ociosidade mostra partida a frio). Veja `cache-control`, `cf-cache-status` e `content-encoding`.
2. **Local em modo de produção** (nunca em `next dev`): pare o servidor de demonstração, `rm -rf .next && npm run build`, `NEXT_PUBLIC_DEMO_MODE=true DEMO_AUTOSEED=true DATABASE_URL=pglite://memory SESSION_SECRET=... CRON_SECRET=... npx next start -p 3101`. Depois: `CHROME_PATH=/opt/pw-browsers/chromium npx --yes lighthouse <url> --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility --output=json --output-path=...`. Rode 3 vezes e use a mediana. Para a marca Commerce na demonstração local, envie o cabeçalho `Cookie: nl-brand=NEXTLEVEL_COMMERCE` (`--extra-headers`).
3. Não rode `build` com o servidor de demonstração ligado (`.next` em uso). Para parar o servidor use um arquivo `.sh` (nunca `pkill -f` colado).
4. Lighthouse local não mede rede real nem a CDN: declare isso.

## Alavancas conhecidas (ordem de ganho)
- **Imagens:** `sharp` já existe em `node_modules`; converter para WebP/AVIF na largura certa (produto ≈ 520 px, banner ≈ 960 px, q ≈ 70). Exemplo: 2,1 MB → 344 KB na home da Commerce. Primeira dobra com prioridade e dimensões reservadas; o resto `loading="lazy"`.
- **Cache das páginas públicas:** hoje **todas as rotas são dinâmicas** e respondem `cache-control: private, no-store`; a Cloudflare do Render não guarda nada (`cf-cache-status: DYNAMIC`). Home, planos, dúvidas e vitrines de loja são candidatas a cache com revalidação curta; consulte `node_modules/next/dist/docs/` antes (Next 16).
- **JS cliente:** só onde há interação; sem biblioteca nova sem medir o peso.
- **Banco:** conferir índices das colunas usadas em `where`/`join`, evitar consulta por item (N+1), paginar listas, agrupar totais em uma consulta. Neon: usar a conexão com pooler e a região mais próxima do Render.
- **Hospedagem:** região do Render e do Neon próximas entre si e dos clientes (Brasil); plano que não hiberna; aquecer rotas após o deploy.
- **Fontes:** só as embutidas; `display: swap/optional` conforme o caso.

## Relatório
Tabela antes/depois (nota, FCP, LCP, TBT, CLS, peso, TTFB), o que mudou, o que **não** foi medido e a próxima alavanca. Sem declarar equivalência com Nuvemshop/Shopify.
