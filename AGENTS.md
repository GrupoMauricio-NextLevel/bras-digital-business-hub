<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NextLevel Commerce Engine: regras para agentes (Codex, Claude e pessoas)

> **Autoridade máxima do e-commerce:** `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`. Em conflito, ela vence; registre a exceção em `docs/design/DECISIONS.md`.

Este repositório é **um sistema só** (Next.js 16, TypeScript estrito, Drizzle, Neon) que atende SuperDrop (em produção, com clientes), NextLevel Commerce e o Master central. **Leia `CLAUDE.md` antes de mudar qualquer coisa**: pilha, comandos, regras e a direção do produto. O dono fala português, sem jargão; código, arquivos e commits em português, como o projeto já faz.

## Divisão de trabalho (para dois agentes não colidirem)
> **Atualização (2026-10-02, dono):** o primeiro teste de design no Codex não deu bom resultado e o dono pausou o visual lá. **Por ora o Claude também faz o visual**, trabalhando em branch própria (`visual/v4`), mostrando capturas de tela ao dono e só publicando na branch de publicação depois da aprovação. O Codex só volta se o dono decidir. As regras abaixo continuam valendo se ele voltar.

- **Visual e design** (Codex): `src/components/**`, `src/app/(portal)/**`, `src/app/globals.css`, `src/lib/themes/**`, `public/**` e o aspecto das telas dos painéis. Mantenha a lógica e os dados como estão; não mude regras de negócio.
- **Domínio, banco, pagamentos, frete, acesso, testes** (Claude): `src/lib/domain/**`, `src/lib/finance/**`, `src/lib/shipping/**`, `src/db/**`, `src/app/actions/**`, `drizzle/**`, `tests/**`.
- Precisa mexer na área do outro? Faça o mínimo, descreva no commit e avise o dono.

## Visual: trabalhar local, ao vivo, e publicar só no final
O Codex (visual) trabalha **no computador do dono** numa branch própria (`codex/visual`): `scripts/dev-demo.ps1` liga o sistema em `http://localhost:3100` com atualização automática a cada arquivo salvo (guia em `docs/nextlevel-commerce/visualizar-ao-vivo.md`). **Nada vai para o Render até o dono aprovar uma etapa.** Aprovada, una a branch à de publicação (abaixo) com `git pull --rebase`.

## Fluxo de trabalho (um Render só, uma branch de publicação)
O Render publica **a cada push** da branch de publicação, que hoje é `claude/wonderful-cannon-5o38v5` (o dono pode trocar para `main` depois). Claude e Codex trabalham **nessa mesma branch**:
1. **Antes de começar e antes de cada push:** `git pull --rebase origin claude/wonderful-cannon-5o38v5`. Se houver conflito, resolva mantendo o trabalho dos dois (nunca descarte o do outro agente) e rode os testes.
2. **Commits pequenos e frequentes**, com mensagem clara em português, e `git push` em seguida (cada push publica em cerca de 3 a 6 minutos).
3. **Verificações automáticas** (detalhes em `docs/nextlevel-commerce/verificacao-automatica.md`): rode `npm run ganchos` uma vez por cópia; commit e push passam a rodar tipos e estilo sozinhos. **Antes de dar push** rode `npx tsc --noEmit`, `npx eslint src e2e tests` e, se mexeu em lógica, `npx vitest run`; mudança grande: `npm run build`. A verificação automática (`.github/workflows/ci.yml`) roda os mesmos passos depois do push.
4. Nunca force push (`--force`) nessa branch.
5. Mudança de comportamento exige teste. Alterou `src/db/schema.ts`? `npx drizzle-kit generate --name <assunto>` e commite `drizzle/` (nunca edite migração já publicada).
6. Segredos: nunca no código. Tokens só criptografados (`encryptSecret`); nada em log, tela ou e-mail.

## Foco
**Regra de foco 60/25/15 (decisão do dono, 19/10/2026, D174):** até a NextLevel E-commerce ter **10 lojistas pagantes**, o esforço vai **60% para a E-commerce, 25% para o SuperDrop e 15% para o resto** (Brás, Cargas, grupo). Todo título de decisão nova em `DECISIONS.md` leva a frente entre colchetes (`[E-commerce]`, `[SuperDrop]`, `[Brás]`, `[Cargas]`, `[Grupo]`) e todo relatório do dia traz a linha "Esforço do dia por frente". Na dúvida sobre o que fazer primeiro, vence o que aproxima a E-commerce do 10º lojista pagante.

## Regras que não podem quebrar
- Página que consulta o banco declara `export const dynamic = "force-dynamic"`.
- Valores em centavos; textos ao usuário em português claro; sem promessa de ganho; acessibilidade AA (sem rolagem horizontal em 360 px).
- Um tenant nunca lê dados de outro; permissões no servidor; a marca vem do endereço (`getBrand()`), nunca fixa em componente.
- **SuperDrop está em produção:** não mude o comportamento dele sem teste.

## Orquestrador de engenharia (documentos oficiais)
O orquestrador completo (matriz tarefa → documentos, protocolo "relatar primeiro", portões de qualidade) está em `docs/constituicao/AGENTS-ORQUESTRADOR.md`. Ele complementa este arquivo; em conflito valem este arquivo e `CLAUDE.md` (Next.js, branch de publicação, modo rápido D64). Exceção registrada em D65: a autorização permanente do dono ("autorizo publicar sempre que for preciso") vale no lugar da regra "sem deploy sem autorização explícita" do orquestrador.
