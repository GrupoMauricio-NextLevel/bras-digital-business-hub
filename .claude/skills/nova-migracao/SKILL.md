---
name: nova-migracao
description: Criar e validar uma migração do banco (Drizzle). Use ao alterar src/db/schema.ts (nova tabela, coluna ou enum).
---

# Nova migração

1. Edite `src/db/schema.ts` (colunas novas com `default` ou anuláveis para não quebrar bancos existentes).
2. `npx drizzle-kit generate --name <assunto_curto>` e leia o SQL gerado (`drizzle/00NN_*.sql`). Enum de texto não gera SQL; só o TypeScript muda.
3. Rode `npx tsc --noEmit` (o tipo novo derruba código que não tratou o valor).
4. **Prove que atualiza um banco antigo:** crie um banco com o esquema anterior e rode a migração nova por cima, por exemplo extraindo a pasta `drizzle` de um commit antigo com `git archive <commit> drizzle`, aplicando com `runMigrations(db, "<pasta antiga>")` e depois `DATABASE_URL=pglite:///tmp/simdb npm run db:bootstrap`.
5. Adicione o seed de referência que a tabela precisar em `src/db/base-data.ts` (idempotente) e ligue em `src/db/bootstrap-data.ts` (nos dois caminhos: demonstração e produção).
6. Escreva teste de domínio; rode `npx vitest run`.
7. Reinicie a demonstração (`bash scripts/restart-demo.sh --limpo`), porque o banco em memória antigo não tem a tabela.
8. Nunca edite uma migração já publicada; crie outra.
