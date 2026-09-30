# SuperDrop · NextLevel Commerce Engine (MVP até a U2)

Plataforma de e-commerce multi-tenant da NextLevel Marketing Ltda. O fluxo completo:
fornecedor → catálogo central → rede de lojistas → loja (subdomínio ou white label) → cliente final → pedido → saldo do lojista → expedição.

> **Ambiente de demonstração:** Mercado Pago e Pix estão **SIMULADOS**. Nenhum dinheiro real é movimentado e nenhuma credencial real acompanha o código.

## Visão geral do que já funciona

**Base (F0 a F3)**
- Cinco painéis com desenho próprio: **Master** (torre de controle com fila de atenção e saúde das lojas), **Fornecedor/gestor**, **Expedição** (tablet, sem valores), **Lojista Lite** e **Lojista Pro**.
- Catálogo central, estoque por variação/grade, pedidos, vitrine pública `/store/[slug]`, temas, checkout com Mercado Pago (modo simulado sem credencial).
- Financeiro da NextLevel: mapa de receitas, contratos, faturas, fechamento mensal, régua de inadimplência, simulador (`docs/FINANCEIRO.md`).
- Carteira do lojista: o custo do pedido é debitado do saldo; sem saldo o pedido fica "Aguardando recarga" (expira em 72 h). Recarga por Pix.
- Etiqueta como arquivo PDF (SuperFrete): validação de tipo/tamanho, download protegido, lote em PDF único.
- Loja NextLevel: catálogo de serviços por público, pedidos de serviço e recomendação.

**U1 – Receita e base**
- Racional de cada preço e taxa ("Por que cobramos"), economia unitária e alerta de margem (Master → Financeiro).
- Add-ons por entitlement (Academy do lojista, Suporte Premium, Relatórios, Assento extra de expedição).
- Cobrança das faturas da NextLevel por Pix, com webhook idempotente e conciliação (**modo simulado** enquanto não houver credencial), régua de cobrança e eventos de domínio.

**U2 – Operação do fornecedor**
- Horário de corte por dia da semana, fuso e feriados; cronômetro na esteira.
- **Esteira ao vivo** (SSE com fallback de polling), um funcionário por pedido, ondas de separação, PDF único de etiquetas e lista de separação por produto.
- Painel de expedição (tablet), equipe com assentos, recargas dos lojistas, onboarding do fornecedor.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript estrito · Tailwind CSS v4 · Radix UI · Drizzle ORM (Postgres) · PGlite (banco local embutido) · Zod · Vitest · Playwright (E2E) · pdf-lib.
Este Next.js tem mudanças de API: leia `node_modules/next/dist/docs/` antes de alterar convenções (ver `AGENTS.md`).

## Instalação
Requisitos: Node 20+ (testado em 22) e npm.

```bash
npm install
cp .env.example .env.local          # preencha os valores (veja "Variáveis de ambiente")
```

## Desenvolvimento
```bash
npm run db:reset                    # apaga ./data/pg, migra e popula a demonstração
npm run dev                         # http://localhost:3000
```

## Build e produção
```bash
NEXT_PUBLIC_DEMO_MODE=true npm run build      # o modo demo é lido no build
# Preview / produção (Node):
DEMO_AUTOSEED=true DATABASE_URL=pglite://memory SESSION_SECRET=<segredo> CRON_SECRET=<segredo> NEXT_PUBLIC_DEMO_MODE=true npm run start
```
`npm run start` sobe na porta `${PORT:-3000}`. Para uma instalação real (sem demonstração) veja `DEPLOY_SITES.md`.

## Usuários de demonstração
Com `NEXT_PUBLIC_DEMO_MODE=true` e o seed aplicado, abra `/login` e escolha um perfil (senha de todos: `demo1234`) ou use o seletor no topo do painel.

| Perfil | E-mail | Painel |
|---|---|---|
| NextLevel Master | master@nextlevel.demo | `/master` |
| Gestor do fornecedor (Central Sports) | central@centralsports.demo | `/supplier` |
| Expedição da Central | expedicao@centralsports.demo | `/supplier/dispatch` |
| Lojista Mantos Shop (Loja própria) | dono@mantosshop.demo | `/merchant` |
| Lojista Arena 10 (Loja SuperDrop) | dono@arena10.demo | `/merchant` |
| Lojista Fut Classics (suspenso) | dono@futclassics.demo | `/merchant` |

Vitrine de demonstração (Mega Tron e MRS Sports): ver `docs/DEMO.md`. Acessos: `megatron@superdrop.demo` (fornecedor), `expedicao@megatron.demo` (expedição) e `loja@mrssports.demo` (membro), senha `demo1234`. Página de vendas pública: `/f/megatron`.

Vitrines públicas: `/store/mantos-shop` e `/store/arena-10`.

## Seed e reset dos dados
| Comando | O que faz |
|---|---|
| `npm run db:migrate` | aplica as migrações em `./drizzle` |
| `npm run db:seed` | popula a demonstração (só em banco vazio) |
| `npm run db:reset` | apaga `./data/pg`, migra e popula |
| `npm run db:bootstrap` | migra, cria dados de referência e o master (`MASTER_EMAIL/PASSWORD`); com `SEED_DEMO=true` também a demonstração |
| `DEMO_AUTOSEED=true` | migra e popula sozinho na primeira requisição (útil com `pglite://memory`, que zera a cada reinício) |

## Variáveis de ambiente
Lista completa em `.env.example` (apenas nomes). As essenciais: `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`, `APP_URL`, `NEXT_PUBLIC_DEMO_MODE`, `DEMO_AUTOSEED`/`SEED_DEMO`, `MASTER_EMAIL`/`MASTER_PASSWORD`. As credenciais do Mercado Pago **não** são variáveis: cada tenant as cola no painel e elas ficam criptografadas no banco.

## Testes
```bash
npm run lint && npm run typecheck && npm test   # 181 testes de domínio
npm run e2e                                     # fluxo ponta a ponta com Mercado Pago simulado (Playwright)
```

## Limitações conhecidas
- **Mercado Pago/Pix simulados** enquanto não houver credenciais: sem conta conectada, a demonstração gera Pix fictício com botão "Simular pagamento". Em produção sem credencial o usuário vê apenas "ainda não habilitado".
- **Não roda como site estático**: usa sessões, server actions e banco. Precisa de Node ou de um adaptador serverless.
- **Cloudflare Workers ainda não é suportado** (banco PGlite/arquivo, `pg` por TCP e leitura de migrações do disco). Detalhes e caminho em `DEPLOY_SITES.md`.
- Em `pglite://memory` os dados zeram a cada reinício e não são compartilhados entre instâncias.
- Esteira ao vivo por SSE exige hospedagem que aceite conexão aberta; sem isso o polling assume sozinho.
- Etiquetas PDF e fotos ficam no banco (base64). Migrar para R2/S3 é trabalho futuro.
- Não há e-mail transacional nem academy/chat/automações ainda; fiscal está fora do escopo.
- Crons (`/api/cron/expire-reservations`, `/api/cron/finance`) precisam ser agendados na hospedagem.

## Próximos módulos
Roteiro em `docs/ROADMAP.md`: **U3** Lojista Lite (fluxo em uma tela e Mercado Pago da loja) · **U4** Lojista Pro (análise, editor, templates, domínio) · **U5** Loja NextLevel e Academy com compra paga · **U6** pós-venda por chat · **U7** automações, fila do dia e saúde · **U8** endurecimento, seed dos cinco perfis, E2E por papel e docs finais.

## Documentação
`ARCHITECTURE.md` · `docs/DEMO.md` · `docs/PLANOS.md` · `docs/PORTAL.md` · `docs/NEGOCIO.md` (contexto de negócio) · `docs/FINANCEIRO.md` · `docs/ROADMAP.md` · `docs/design/DECISIONS.md` · `DEPLOY_SITES.md`.
