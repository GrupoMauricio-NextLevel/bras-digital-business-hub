@AGENTS.md

# SuperDrop / NextLevel Commerce Engine: guia para sessões de trabalho

Sistema de tecnologia da **NextLevel Marketing Ltda** (dono: Mauricio). Plataforma de lojas online sem estoque: fornecedores (Centrais), lojistas membros, parceiros afiliados e o painel Master. **Fale com o dono em português, sem jargão**; código, nomes de arquivos e commits em português do jeito que o projeto já faz.

## Pilha
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estrito · Tailwind v4 · Radix · Drizzle ORM (PGlite local/produção simples, Postgres/Neon externo) · Zod · Vitest · Playwright (via `playwright-core`, scripts em `e2e/`). Deploy: Docker no Render, direto da branch de trabalho; cada push publica.

## Comandos que você deve usar
- Tipos: `npx tsc --noEmit` · Lint: `npx eslint src e2e tests` · Testes: `npx vitest run` (leva ~5 min; para um arquivo: `npx vitest run tests/x.test.ts`)
- Build de produção: `npm run build` (rode antes de publicar; precisa passar sem "Export encountered")
- Migração: alterou `src/db/schema.ts` → `npx drizzle-kit generate --name <assunto>` e commite `drizzle/`. Nunca edite migração já publicada.
- Demonstração local: `bash scripts/restart-demo.sh` (porta 3100; `--limpo` apaga `.next`). Depois: `E2E_BASE=http://localhost:3100 node e2e/<arquivo>.mjs`. Reinicie antes de e2e que mudam dados (compras, temas, parceiros) e após migrações.
- Não use `pkill -f` nem `pgrep -f` com padrão que case com o próprio shell.

## Regras do projeto (aprendidas com erro)
- **Página que consulta o banco declara `export const dynamic = "force-dynamic"`.** Senão o `next build` tenta abrir o banco e o deploy quebra (já aconteceu).
- Valores em **centavos** (inteiros); datas ISO; textos ao usuário em português claro; sem promessa de ganho.
- Toda ação passa pelo domínio (`src/lib/domain/*`) e por `runAction`; permissões no servidor (`requireRole`, `assertCanAccess`); um tenant nunca lê dados de outro.
- Segredos (tokens do Mercado Pago e da plataforma de envio, chave Pix) só criptografados (`encryptSecret`), nunca em tela, log ou e-mail.
- Pagamento só vale depois de conferido na API do Mercado Pago (o corpo do webhook nunca é confiável); idempotência por `dedupeKey`.
- Regra de negócio configurável vem de `platform_settings` (tabela de preços `getPriceBook`, regras de parceiros `getPartnerSettings`), nunca fixa no código.
- Acessibilidade AA: `axe` sem violações graves, sem rolagem horizontal em 360 px; use `e2e/polish-v8.mjs` para varrer.
- Não crie PR sem o dono pedir. Trabalhe na branch designada e faça `git push -u origin <branch>`.
- Registre decisões em `docs/design/DECISIONS.md` (próxima: D33). Mudanças de comportamento sem teste não entram.

## Mapa rápido
- Domínio: `src/lib/domain/` (finance, store-access, partners, nl-sales, orders, own-store, provisioning…) · Preços: `src/lib/finance/` · Temas: `src/lib/themes/` · E-mail: `src/lib/email.ts`
- Telas: `src/app/master`, `supplier`, `merchant`, `partner`, `(portal)` (público), `store/[slug]` (loja do membro), `f/[slug]` (página do fornecedor)
- Prompts para desenvolver aos poucos: `docs/prompts/` (comece por `README.md`); decisões: `docs/design/DECISIONS.md`; visão geral: `ARCHITECTURE.md`, `docs/MAPA.md`, `docs/PLANOS.md`
- Skills do projeto (`.claude/skills/`, uso: `/publicar`, `/e2e-demo`, `/nova-migracao`, `/desenvolver-prompt`): `publicar`, `e2e-demo`, `nova-migracao`, `desenvolver-prompt`

## Direção do produto (atual)
O foco passou de SuperDrop para **NextLevel Commerce**, a plataforma de lojas virtuais (o SuperDrop é um módulo, em pausa). Leia `docs/prompts/nextlevel-commerce-plataforma.md` e `docs/nextlevel-commerce/aproveitamento-superdrop.md` antes de propor trabalho novo. Holding: `nextlevelgroup.com.br`; produto: `nextlevelcommerce.com.br` (a registrar).

## Configurações de produção que dependem do dono
`DATABASE_URL` (Neon), `SESSION_SECRET`, `MASTER_EMAIL`/`MASTER_PASSWORD`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`/`NEXT_PUBLIC_SUPPORT_EMAIL`, `RESEND_API_KEY`/`EMAIL_FROM`/`EMAIL_REPLY_TO`, `APP_URL`, conta Mercado Pago da NextLevel conectada no Master. Render Free dorme e não tem disco: dados reais exigem Neon e plano pago.
