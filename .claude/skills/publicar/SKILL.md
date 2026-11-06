---
name: publicar
description: Publicar o trabalho no Render com segurança. Use quando o dono pedir para publicar, fazer deploy ou "subir" o que foi feito. Roda a bateria completa (tipos, lint, testes, build), commita, envia para a branch e confere o site.
---

# Publicar

## Tamanho da verificação (erro aprendido em 2026-10-28)
Perdemos horas remontando o site (`npm run build`, 10 a 15 min aqui) a cada ajuste visual pequeno só para tirar print, e testando correção no modo dev (que recarrega a página inteira e não mostra transições). O dono reclamou do tempo e dos tokens.
- **Ajuste pequeno de visual** (CSS, cor, texto, uma classe): `npx tsc --noEmit` + `npx eslint` do arquivo, commit, push para a branch de publicação e **print do site no ar** (Playwright contra produção com o proxy). Sem build local, sem bateria completa.
- **Mudança grande** (tela nova, banco, pagamento, regra de negócio): bateria normal (tipos, lint, testes do que mudou, build) antes de publicar.
- **Uma montagem por rodada:** junte os ajustes antes de montar; nunca monte para cada tentativa.
- **Antes de corrigir, entenda a causa** (ex.: o que fica por cima numa View Transition), para não gastar uma rodada com correção errada.
- **Modo dev não serve** para conferir transição entre páginas.
- **Sempre um print da principal implementação por etapa**, e mensagens curtas.

1. `git status --short` e leia o que mudou. Se houver arquivo estranho (segredos, `.env`, dumps), pare e avise o dono.
2. Bateria, nesta ordem, parando no primeiro erro e corrigindo a causa (nunca pulando teste):
   - `npx tsc --noEmit`
   - `npx eslint src e2e tests`
   - `npx vitest run`
   - `npm run build` (não pode aparecer "Export encountered" nem "Aborted"; se aparecer, a página está consultando o banco no build: use `export const dynamic = "force-dynamic"`)
3. Se houve migração nova, confirme que `drizzle/` está no commit e rode `bash scripts/restart-demo.sh --limpo` seguido de `node e2e/smoke-demo.mjs` com `E2E_BASE=http://localhost:3100`.
4. Registre decisões novas em `docs/design/DECISIONS.md`. **E alimente a base de conhecimento** (`docs/conhecimento/BC0-INVENTARIO.md`): a regra nova, o valor, o estado (No ar / Aprovado / Em breve) e a decisão (Dxxx). O teste `base-conhecimento` falha se faltar.
5. Commit com mensagem em português e os trailers de atribuição exigidos pela sessão; `git push -u origin <branch designada>`.
6. Confira o site no ar (D171): espere a versão nova subir (3 a 6 min) e rode `EXPECT_VERSION=<commit curto> npm run conferir:producao` (atrás de proxy: `NODE_USE_ENV_PROXY=1`). Confere cada endereço, a versão no ar, título, tela de erro e vazamento entre marcas, em segundos. Falhou: corrija antes de qualquer outra coisa. Se a versão não mudar em ~10 min, peça ao dono o log do deploy (aba Logs no Render) e não declare sucesso.
7. Reporte ao dono em português, sem jargão: o que foi publicado, o que foi verificado e o que ficou pendente (inclusive variáveis do Render).

## Modo rápido (decisão do dono, 2026-10-03)
Quando o dono pedir "modo rápido" ou "só o necessário", ou o prompt da fase disser:
- Rode `npx tsc --noEmit` e `npx eslint src e2e tests` (o hook do push também roda), `npm run test:rapido` (só os testes ligados ao que mudou) e `npm run build` **só se** mexeu em rota, página, esquema do banco ou `dynamic`. Não rode `npx vitest run` completo.
- **Não vale o modo rápido** (rode também os testes vizinhos da área antes do push) quando a mudança toca dinheiro, pedido, estoque, permissão, isolamento entre lojas, migração com preenchimento de dados ou comportamento do SuperDrop: o Render publica no push sem esperar o GitHub.
- Depois do push, confira o resultado do GitHub Actions (`verificar`, ~17 min, suíte completa). Vermelho = corrigir antes de qualquer trabalho novo.
- A suíte completa, o e2e e o Lighthouse ficam para a fase final de testes.

Nunca crie PR sem pedido do dono.
