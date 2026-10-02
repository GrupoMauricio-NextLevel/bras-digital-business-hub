<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NextLevel Commerce Engine: regras para agentes (Codex, Claude e pessoas)

Este repositório é **um sistema só** (Next.js 16, TypeScript estrito, Drizzle, Neon) que atende SuperDrop (em produção, com clientes), NextLevel Commerce e o Master central. **Leia `CLAUDE.md` antes de mudar qualquer coisa**: pilha, comandos, regras e a direção do produto. O dono fala português, sem jargão; código, arquivos e commits em português, como o projeto já faz.

## Divisão de trabalho (para dois agentes não colidirem)
- **Visual e design** (Codex): `src/components/**`, `src/app/(portal)/**`, `src/app/globals.css`, `src/lib/themes/**`, `public/**` e o aspecto das telas dos painéis. Mantenha a lógica e os dados como estão; não mude regras de negócio.
- **Domínio, banco, pagamentos, frete, acesso, testes** (Claude): `src/lib/domain/**`, `src/lib/finance/**`, `src/lib/shipping/**`, `src/db/**`, `src/app/actions/**`, `drizzle/**`, `tests/**`.
- Precisa mexer na área do outro? Faça o mínimo, descreva no commit e avise o dono.

## Fluxo de trabalho
1. **Nunca trabalhe direto na `main`** (é a produção). Cada agente usa a sua branch (`codex/<assunto>` ou `claude/<assunto>`) e abre pull request para `staging`; só o dono leva `staging` para `main`.
2. Antes de abrir o PR rode: `npx tsc --noEmit`, `npx eslint src e2e tests`, `npx vitest run` e `npm run build`. A verificação automática (`.github/workflows/ci.yml`) roda os mesmos passos.
3. Mudança de comportamento exige teste. Alterou `src/db/schema.ts`? `npx drizzle-kit generate --name <assunto>` e commite `drizzle/` (nunca edite migração já publicada).
4. Não crie PR/commit com segredos. Tokens só criptografados (`encryptSecret`); nada em log, tela ou e-mail.

## Regras que não podem quebrar
- Página que consulta o banco declara `export const dynamic = "force-dynamic"`.
- Valores em centavos; textos ao usuário em português claro; sem promessa de ganho; acessibilidade AA (sem rolagem horizontal em 360 px).
- Um tenant nunca lê dados de outro; permissões no servidor; a marca vem do endereço (`getBrand()`), nunca fixa em componente.
- **SuperDrop está em produção:** não mude o comportamento dele sem teste.
