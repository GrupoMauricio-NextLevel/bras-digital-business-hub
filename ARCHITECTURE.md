# NextLevel Commerce Engine — Arquitetura (MVP)

Motor de e-commerce multi-tenant da NextLevel Marketing Ltda. O primeiro produto construído sobre ele é o **SuperDrop**. O mesmo núcleo sustentará SuperDrop White Label, lojas individuais, Theme Store, marketplace interno de serviços, **Brás Digital** (marketplace atacadista com fornecedores, catálogos, grades e lojas) e futuras verticais. Não há um core por produto: há **um** core.

## Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript estrito | Server components + server actions reduzem código de API no MVP |
| UI | Tailwind CSS v4, Radix primitives, Lucide, sonner | Design system próprio (tokens em `globals.css`), sem template de admin |
| Banco | Postgres via Drizzle ORM: PGlite (embutido) em dev/testes, Neon/Netlify DB em produção | Zero instalação local; produção serverless na Netlify sem banco pago; troca de driver sem tocar nas regras |
| Validação | Zod | Schemas compartilhados entre actions e domínio |
| Testes | Vitest com banco em memória + seed real | Testa as regras que causam prejuízo |

## Camadas

```
src/db/            schema.ts (Drizzle), client.ts, migrate.ts, seed.ts
src/lib/domain/    REGRAS DE NEGÓCIO puras (sem React, sem Next):
                   access.ts (tenant guards) · inventory.ts · orders.ts ·
                   order-status.ts (máquina de estados) · catalog.ts
src/lib/queries/   leituras por perfil (master, supplier, merchant, storefront)
src/app/actions/   server actions finas: sessão → domínio → revalidate
src/app/{master,supplier,merchant}  painéis · src/app/store/[slug]  storefront
src/components/ui  primitivos · components/app  AppShell, DataTable etc. · shared  peças reutilizadas por perfil
```

Regra: componentes visuais não contêm lógica de negócio; actions não contêm regras, apenas delegam ao domínio. O `Database` é um tipo genérico (`PgDatabase`) aceito por conexões e transações; `createDatabase()` escolhe o driver pela `DATABASE_URL` (`postgres://` → node-postgres, `pglite://` → PGlite).

## Multi-tenancy

Entidades: `NEXTLEVEL` (plataforma) → `organizations` (tenant) → `suppliers` / `stores`; `networks` ligam fornecedor a lojas; `users` pertencem a uma organização e podem apontar para um supplier ou uma store; `customers` são consumidores finais, separados de `users`.

Todo acesso passa por um `Actor` (`src/lib/domain/access.ts`):
- `NEXTLEVEL_MASTER` vê tudo;
- `SUPPLIER_ADMIN` só o que tem `supplierId` igual ao seu;
- `STORE_OWNER` só o que tem `storeId` igual ao seu.

`assertCanAccess`, `listOrdersForActor` e `getOrderForActor` aplicam esse escopo. A storefront pública só resolve pedidos pelo par `(orderId, storeId)`. Testes em `tests/tenancy.test.ts` garantem que um lojista nunca lê nem altera pedidos de outro.

## Catálogo, distribuição e visibilidade

- Produto é cadastrado **uma vez** pelo fornecedor (`products`), com variantes por tamanho (`product_variants`) e **grades** configuráveis (`product_packs` + `product_pack_items`, ex.: 12 peças P2/M4/G4/GG2 — nada hardcoded).
- `distribution`: `ALL_NETWORK` ou `SELECTED_STORES` (tabela `product_store_access`).
- `visibility`: `PRIVATE_NETWORK` hoje; `SHARED_NETWORK` e `PUBLIC_NETWORK` já existem no enum para o catálogo compartilhado entre fornecedores (Brás Digital).
- A loja define preço e ativação em `store_products` (respeitando `minimumPriceCents`), **sem** copiar estoque.

## Estoque central

`inventory(variantId, onHand, reserved)`; `available = onHand − reserved` (nunca negativo). Movimentos em `inventory_movements`: `IN`, `RESERVE`, `RELEASE`, `SALE`, `ADJUSTMENT`. Pedido reserva na criação (grades expandem para suas variantes); cancelamento libera; expedição (`SHIPPED`) consome. Reservas acima do disponível falham antes de gravar o pedido (transação).

## Pedidos e máquina de estados

`PENDING → AWAITING_CENTRAL_PAYMENT → AWAITING_LABEL → READY_TO_PICK → PICKING → READY_TO_SHIP → SHIPPED → DELIVERED`, com `CANCELED` a partir de qualquer estado anterior a `SHIPPED`.

Regra central do MVP (`resolveFulfillmentStatus`): o pedido só fica `READY_TO_PICK` quando `customerPaymentStatus = PAID` **e** `centralPaymentStatus = PAID` **e** `shippingLabelStatus = READY`. A ordem em que o lojista paga a Central ou registra a etiqueta não importa.

Canais: `ONLINE_STORE`, `WHATSAPP`, `INSTAGRAM`, `MANUAL` — todos usam o mesmo catálogo e estoque. `saleType`: `RETAIL` | `WHOLESALE`.

## Financeiro (sem split)

Cliente paga o lojista; lojista paga o custo à Central; NextLevel cobra `platformFeePercent` sobre o GMV (6% SuperDrop / 3% White Label + setup). No MVP tudo é simulado por estados (`customerPaymentStatus`, `centralPaymentStatus`). Integrações (Mercado Pago, Melhor Envio, SuperFrete) terão adapters; hoje as configurações da loja guardam apenas `provider` + status `DEMO`.

## Template engine

`themes` (Starter/Pro/Elite) → `theme_versions` → `store_themes` (tema ativo por loja) e `theme_settings` (conteúdo: hero, banners, anúncio, rodapé). Conteúdo e dados da loja são independentes do tema; trocar de tema não toca em produtos, clientes, pedidos ou configurações. A storefront lê `store`, `theme_settings` e o tema ativo e renderiza dinamicamente em `/store/[slug]`; `?theme=pro|elite` pré-visualiza variações de layout.

## Privacidade (LGPD-ready)

`customers` (pessoa) ≠ `store_customers` (relação com uma loja) ≠ `marketing_consents` (`purpose`, `source`, `grantedAt`, `revokedAt`). Acesso operacional para processar pedidos não implica permissão de marketing.

## Planos e assinaturas

`plans` → `subscriptions` → `invoices`. Regra futura: 15 dias de atraso → `SUSPENDED`, 30 dias → `CLOSED` (dados administrativos permanecem disponíveis à NextLevel). Sem cobrança recorrente real no MVP.

## Demo mode / autenticação

Sessão por cookie `nl_session` (id do usuário). `/login` lista os usuários demo; o **Demo Role Switcher** no topo alterna perfis quando `NEXT_PUBLIC_DEMO_MODE=true` (ou em desenvolvimento). Trocar por um provedor real (Auth.js, Clerk, etc.) exige apenas reimplementar `getSession()` em `src/lib/auth.ts`.

## Caminho para produção

1. Produção já roda em Postgres (Netlify DB/Neon). Para D1/SQLite bastaria trocar `pg-core` por `sqlite-core` no schema; o domínio não muda.
2. Autenticação real + convites por organização.
3. Adapters de pagamento e frete (interfaces em `src/lib/adapters/` — a criar) mantendo o domínio intacto.
4. Upload de imagens (hoje `products.images` guarda descritores `art:` renderizados por `ProductArt`).
5. Jobs (expiração de reservas, inadimplência) como cron/queue.

## Autenticação e provisionamento (v0.2)

- Login por e-mail e senha (`scrypt`), sessão em cookie `httpOnly` assinado com HMAC (`SESSION_SECRET`, 7 dias). O login de um clique só existe com `NEXT_PUBLIC_DEMO_MODE=true`.
- Convites sem e-mail: o master cria o fornecedor, o fornecedor cria a loja; a plataforma gera uma senha temporária exibida uma única vez e o usuário é obrigado a trocá-la no primeiro acesso (`mustChangePassword`, aplicado em `requireRole`). Redefinição de senha pelo tenant responsável.
- Escopo por papel continua em `access.ts`; toda action revalida a sessão no servidor.

## Cadastro de catálogo

`createProduct` (domínio) cria produto, variantes, estoque inicial (movimento `IN`), grade configurável, categoria e distribuição numa transação. Importação CSV (`;` ou `,`, valores em reais) processa linha a linha e reporta erros por linha. Fotos: compressão no navegador (JPEG, 900px) e armazenamento como data URL em `products.images`; a interface aceita URLs http(s), então trocar por Cloudinary/S3 não exige mudar o schema.

## Pagamento do cliente (Mercado Pago Checkout Pro)

- Cada loja conecta o próprio Access Token (`TEST-…` ou `APP_USR-…`); o token é validado em `/users/me` e guardado com AES-256-GCM. O cliente paga direto ao lojista (sem split).
- Checkout: cria pedido `PENDING` reservando estoque com validade de 30 min → cria preferência (`external_reference` = id do pedido, `notification_url` e `back_urls` https, expiração) → redireciona.
- Confirmação: webhook `/api/webhooks/mercadopago?store=<slug>` **nunca confia no corpo**: consulta o pagamento na API com o token da loja, confere que o pedido pertence àquela loja e que o valor pago cobre o total, então `markCustomerPaidBySystem` (idempotente). A página de retorno faz polling por `external_reference` como rede de segurança.
- Expiração: `expireStaleReservations` cancela pedidos não pagos vencidos e devolve o estoque; roda a cada carregamento de painel e por `GET /api/cron/expire-reservations` (Bearer `CRON_SECRET`). Pagamento aprovado após o cancelamento não reabre o pedido e gera alerta no histórico.
- `MERCADOPAGO_API_URL` permite apontar para um servidor simulado (usado no teste ponta a ponta).

## Produção

`npm run db:bootstrap` (idempotente): migrações + dados de referência (temas, planos, serviços) + usuário master a partir de `MASTER_EMAIL`/`MASTER_PASSWORD`. Dados de demonstração só com `SEED_DEMO=true`. Variáveis: ver `.env.example`.

## Financeiro (v0.3)

Detalhes e regras em [docs/FINANCEIRO.md](./docs/FINANCEIRO.md). Resumo técnico:

- **Motor puro** em `src/lib/finance` (`engine.ts`, `price-book.ts`, `revenue-map.ts`): taxa de volume, comissão, fechamento, estados de acesso e simulador, sem banco nem React, cobertos por testes unitários.
- **Persistência** em `src/lib/domain/finance.ts`: `platform_settings` (tabela de preços), `supplier_contracts`, `finance_invoices` (com linhas em jsonb e chave de idempotência) e `store_acquisitions` (comissão de canal). `orders.central_paid_at` é a data-base da taxa.
- **Idempotência:** mensalidades e fechamentos usam `dedupe_key` única, então a rotina diária pode rodar repetidamente.
- **Enforcement:** o estado do fornecedor em `suppliers.status` alimenta `ACCESS_CAPABILITIES`, aplicado no domínio e não só na interface.
- **Lojas novas** nascem `PENDING_PAYMENT` e só são liberadas quando a fatura de ativação é confirmada.
