---
name: e2e-demo
description: Subir o servidor de demonstração local e rodar os testes de navegador (Playwright) em e2e/. Use para conferir uma tela, um fluxo ou regressões antes de publicar.
---

# Testes de navegador na demonstração

1. `bash scripts/restart-demo.sh` (use `--limpo` após migração ou erro estranho do Turbopack). Ele sobe a porta 3100 com dados de exemplo e aquece as rotas.
2. Rode o script pedido: `E2E_BASE=http://localhost:3100 node e2e/<arquivo>.mjs`. Principais: `smoke-demo` (páginas), `polish-v8` (4 larguras + acessibilidade, ~10 min), `partners`, `nextlevel-shop`, `theme-store`, `checkout-flow`, `trial-block`, `password-reset`.
3. **Scripts que mudam dados** (compra de tema, parceiros, loja NextLevel, recuperar senha) deixam o estado sujo: reinicie antes de rodar outro e2e que espere dados originais (por exemplo `theme-engine` depois de `theme-store`).
4. Primeira compilação é lenta; se houver timeout no primeiro acesso, aqueça a rota com `curl` e repita.
5. Falha de contraste no axe: ajuste a cor (use `readableOn`); falha de rolagem horizontal: procure elemento `sr-only` sem `relative` no contêiner ou tabela larga sem região rolável.
6. Screenshots: salve em `/tmp` e leia com a ferramenta de leitura de imagem para conferir o visual.
