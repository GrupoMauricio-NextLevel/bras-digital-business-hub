---
name: publicar
description: Publicar o trabalho no Render com segurança. Use quando o dono pedir para publicar, fazer deploy ou "subir" o que foi feito. Roda a bateria completa (tipos, lint, testes, build), commita, envia para a branch e confere o site.
---

# Publicar

1. `git status --short` e leia o que mudou. Se houver arquivo estranho (segredos, `.env`, dumps), pare e avise o dono.
2. Bateria, nesta ordem, parando no primeiro erro e corrigindo a causa (nunca pulando teste):
   - `npx tsc --noEmit`
   - `npx eslint src e2e tests`
   - `npx vitest run`
   - `npm run build` (não pode aparecer "Export encountered" nem "Aborted"; se aparecer, a página está consultando o banco no build: use `export const dynamic = "force-dynamic"`)
3. Se houve migração nova, confirme que `drizzle/` está no commit e rode `bash scripts/restart-demo.sh --limpo` seguido de `node e2e/smoke-demo.mjs` com `E2E_BASE=http://localhost:3100`.
4. Registre decisões novas em `docs/design/DECISIONS.md`.
5. Commit com mensagem em português e os trailers de atribuição exigidos pela sessão; `git push -u origin <branch designada>`.
6. Confira o site: `curl -s -o /dev/null -w "%{http_code}" https://superdrop.com.br/<rota nova>`. Se seguir 404 por mais de ~10 min, peça ao dono o log do deploy (aba Logs no Render) e não declare sucesso.
7. Reporte ao dono em português, sem jargão: o que foi publicado, o que foi verificado e o que ficou pendente (inclusive variáveis do Render).

Nunca crie PR sem pedido do dono.
