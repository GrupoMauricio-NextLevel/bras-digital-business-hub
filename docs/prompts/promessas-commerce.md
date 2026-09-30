# Prompt avançado: as promessas da NextLevel Commerce que ainda não existem

> Cole este documento como instrução de trabalho. Cobre, em nível de código, tudo o que o portal da NextLevel Commerce marca como **"Em breve"** e o que precisa existir antes: **conta simples do lojista (N1)**, **atacado B2B**, **influenciadores**, **feed e live shop** e **tema nível Shopify (Theme Engine v2)**. É executável por fases (P0 a P6). Antes de codar, leia `CLAUDE.md`, `AGENTS.md` (Next.js com mudanças: consulte `node_modules/next/dist/docs/`), `docs/design/DECISIONS.md` (D1 a D33), `docs/nextlevel-commerce/aproveitamento-superdrop.md` e `docs/prompts/nextlevel-commerce-plataforma.md` (seção 4A: **regras anti-duplicação valem aqui**). Registre as decisões em `docs/design/DECISIONS.md` (D34 em diante). Nada de preço, percentual, prazo ou limite fixo no código: tudo em `platform_settings`/configuração.

## 0. ESTADO DE PARTIDA (verifique antes de mexer)
- Marcas por domínio prontas (`src/lib/brand.ts`, `getBrand()`, `organizations.brand`); a NextLevel Commerce está com **cadastro fechado** (`signupOpen=false`) e lista de espera (`brand_leads`), porque a loja independente ainda depende do modelo de fornecedor.
- Loja virtual completa por dentro (vitrine, carrinho, checkout Mercado Pago, pedidos, acompanhamento, temas e editor, loja de temas, análise, e-mail básico), programa de parceiros (`partners`, `coupons`, livro-razão), cobrança e planos (`getPriceBook`, `features.ts`, `entitlements`).
- Existem `product_packs` e `orders.saleType = WHOLESALE` (grade e pedido manual de atacado), `SUPPLIER_OWN` (loja com catálogo próprio), `store_assets` (imagens), `domain_events`.
- **Não existe:** preço por faixa, cliente atacadista, comissão de vendas de loja para terceiros, feed/live/vídeo, temas de terceiros, régua de desempenho de tema, conta simples.

## 1. REGRAS DE OURO (valem para todas as fases)
1. **Estender, não duplicar** (portfólio 4A): influenciador = `kind` de `partners`; desconto do consumidor estende `coupons`; atacado = lista de preços/grupos sobre o mesmo catálogo; feed/live = seções de tema + mídia; nada de segundo sistema de pedidos.
2. **Domínio testado antes de tela:** cada regra em `src/lib/domain/*` com Vitest (limites, idempotência, permissões, isolamento por tenant); depois telas; depois e2e; depois acessibilidade (`axe`) e 4 larguras.
3. **Módulos por entitlement** (`features.ts`): novos `FeatureKey` (`wholesale`, `influencers`, `liveShop`, `themesAdvanced`) ligados por plano/compra, com cadeado e caminho de upgrade (padrão já usado). Marca liga o módulo por padrão (`BRAND_MODULES`).
4. **Eventos de domínio** (`emitEvent`, `dedupeKey`) como cola: pedido pago dispara comissão, e-mail e análise; nunca chamada direta entre módulos.
5. **Segurança:** permissões no servidor, isolamento por tenant, valores em centavos, segredos criptografados, pagamento só conferido na API, nada de dado pessoal em URL, taxa de requisições nas rotas públicas (`rateLimit`).
6. **Página que consulta o banco declara `force-dynamic`.**
7. **Migração segura:** colunas novas com padrão ou anuláveis; teste de upgrade de banco antigo (skill `nova-migracao`).
8. **Honestidade do portal:** o item só sai de "Em breve" quando o critério de aceite da fase passou.

## 2. FASES

### P0 — Conta simples do lojista (N1): pré-requisito de tudo
> **FEITO (D34, migração 0022):** Central oculta (`suppliers.hidden`), cadastro sem fornecedor em `/cadastro` na Commerce, `/merchant/catalogo` (meus produtos, importação), painel enxuto, testes `tests/independent.test.ts`, e2e `e2e/conta-simples.mjs`. Pendente deste bloco: pedido de teste ponta a ponta no e2e (coberto em teste de domínio) e ligar `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true` em produção.
**Objetivo:** "Abrir minha loja" na NextLevel Commerce sem fornecedor, rede ou carteira.
- **Modelo:** ao cadastrar, `openIndependentStore(db, input)` cria numa transação: organização `MERCHANT` (brand da requisição), **Central própria oculta** (`suppliers` com `businessModel` interno `OWN` ou flag `hidden`, rede própria), usuário `STORE_OWNER`, loja `kind = SUPPLIER_OWN`, contrato com taxa zero de Central, assinatura/plano da marca, tema Starter e configurações. Reaproveitar `createSupplier`/`createStore`/`own-store.ts` (contexto companheiro) em vez de reescrever; extrair o que for comum.
- **Painel "Minha loja":** o lojista **não** vê Central, carteira, ondas nem custo. Menu enxuto (Início, Pedidos, Produtos, Estoque, Clientes, Loja virtual, Aparência, Financeiro, Configurações). Produtos e estoque próprios (`products.supplierId` da Central oculta); o bypass de custo de `tryDebitOrder` para `SUPPLIER_OWN` já existe; `min_activation_stock` não se aplica.
- **Fluxo de cadastro:** `/cadastro` na marca abre com: dados, segmento, nome da loja, plano, pagamento por Pix (`ensurePlanInvoice`), checklist "no ar" (logo, tema, 5 produtos, Mercado Pago, frete, domínio). Liga `BRAND_SIGNUP_NEXTLEVEL_COMMERCE`.
- **Testes:** cria conta simples completa; isolamento entre contas; lojista não acessa rotas `/supplier`; pedido de teste ponta a ponta sem carteira; e2e "abrir loja → primeiro produto → pedido".
- **Aceite:** um lojista novo abre a loja, cadastra produto, recebe pedido de teste e paga o plano, sem tocar em conceito de fornecedor.
- **Dívida a registrar:** modelo geral `seller` (fase P6) substitui a Central oculta.

### P1 — Frete real e pagamentos (base para atacado e live)
- **`ShippingProvider`** (interface em `src/lib/shipping/`): `quote({ from, to, items })`, `buyLabel(order)`, `track(code)`; implementações SuperFrete e Melhor Envio (a conexão e o token criptografado já existem em `providers.ts`). Cotação por CEP no checkout (`shippingCents` deixa de ser informado à mão), regra de frete grátis por valor/região em `store_settings`, retirada na loja, prazo estimado.
- **Compra de etiqueta pela API** com débito do saldo (carteira) ou do Mercado Pago da loja; guardar etiqueta em `order_label_files`; rastreio automático (cron) que avança `SHIPPED → DELIVERED` e dispara e-mails.
- **`PaymentProvider`:** extrair de `payments/mercadopago.ts` uma interface (`createPix`, `createCardCheckout`, `getPayment`) e manter Mercado Pago como implementação; adaptadores futuros (Pix direto, Asaas). Parcelamento configurável por loja; cupom de desconto do consumidor (estende `coupons`: `kind = DISCOUNT`, valor fixo ou %, mínimo, validade, limite por CPF).
- **Testes:** cotação com provedor simulado (sucesso, erro, timeout), frete grátis, etiqueta idempotente, rastreio, cupom (limites e concorrência), regressão do checkout atual.
- **Aceite:** checkout calcula frete por CEP, compra etiqueta pela API e o cliente acompanha o rastreio sem ação manual.

### P2 — Atacado B2B (módulo `wholesale`)
**Reuso:** `products`, `product_variants`, `product_packs`, `orders`, `customers/store_customers`, importação por planilha, `coupons`, `entitlements`.
**Modelo (migração `00NN_wholesale`):**
- `customer_groups` (`storeId`, `name`, `discountBps?`, `minOrderCents?`, `minPieces?`, `paymentTerms` JSON, `visibleCatalogs`), `store_customers.groupId`, `store_customers.b2bStatus` (`NONE|PENDING|APPROVED|BLOCKED`), `taxId`, `companyName`, `approvedBy/At`.
- `price_tiers` (`productId` ou `variantId`, `groupId?`, `minQty`, `unitPriceCents`, `validFrom/To`) com índice por produto; regra de prioridade: preço do cliente > do grupo > faixa por quantidade > preço de varejo.
- `products.wholesaleOnly`, `products.wholesaleMinQty`, `product_packs` já cobre grade fechada (caixa por cor e tamanho).
**Domínio (`src/lib/domain/wholesale.ts`, puro e testável):** `resolvePrice(product, qty, customer)`, `cartRules(lines, customer)` (mínimos por valor, peças e por produto; múltiplos de caixa), `applyForB2b`, `approveCustomer`, `reorderFromOrder`, `parseQuickOrder(csv)` (SKU e quantidade, com conferência linha a linha como na importação de produtos).
**Vitrine e checkout:** o mesmo checkout; para cliente B2B aprovado: preço atacado visível, tabela de faixas na página do produto, seletor de grade (matriz cor × tamanho), carrinho mostra quanto falta para o mínimo, pedido rápido por planilha ou SKU, "repetir pedido", condições de pagamento (Pix, cartão, **faturado** com aprovação e limite de crédito em `store_customers.creditLimitCents`, fatura via `finance_invoices` do tenant). Visitante e varejo não veem preço de atacado (`wholesaleOnly` oculto).
**Painel do lojista:** grupos, aprovação de clientes, faixas por produto em lote (planilha), pedidos de atacado com filtro, representantes (usuário `SALES_REP` opcional com comissão via `partner_commissions`, `kind = REP` — reuso do livro-razão).
**Testes:** prioridade de preço em todos os casos-limite; mínimos; caixa fechada; aprovação; visitante não vê preço; concorrência de estoque em pedido grande; isolamento entre lojas.
**Aceite:** uma loja vende no varejo e no atacado no mesmo catálogo, com preço por faixa, mínimo, aprovação de cliente, pedido por planilha e faturado aprovado, sem quebrar o varejo. Só então o portal troca "Em breve" por disponível.

### P3 — Influenciadores (módulo `influencers`), sobre o programa de parceiros
**Reuso máximo:** `partners`, `partner_links`, `partner_clicks`, `partner_commissions` (livro-razão imutável), `partner_payouts`, antifraude, `coupons`, cookie `nl-ref`, `runDailyPartnerJobs`.
**Modelo:**
- `partners.kind` ganha `INFLUENCER` (enum extensível já previsto); `partners.profile` JSON (redes, nicho, audiência).
- `influencer_programs` (`storeId`, `commissionBps`, `minBps/maxBps` da plataforma, `guaranteeDays`, `attributionDays`, `categoryRules` JSON, `active`) e `influencer_invites` (convite por link/e-mail, aceite, termos).
- `partner_commissions.kind` ganha `SALE` (comissão de venda de loja) com `storeId`, `orderId`, base = valor dos **produtos pagos sem frete**, estorno gera `CLAWBACK` (já implementado).
- `orders.influencerId`, `orders.attributedVia` (`LINK|COUPON`), gravados na criação do pedido; cupom do influenciador (`coupons.kind = INFLUENCER`) tem prioridade sobre o último link.
**Domínio (`influencers.ts`, estende `partners.ts`):** `inviteInfluencer`, `acceptInvite`, `attributeOrder(order, ref, coupon)`, `recordSale(order)` (idempotente por `dedupeKey`), `releaseCommissions` (já cobre), `clawback` por estorno, antifraude (compra do próprio influenciador, cupom vazado, taxa de estorno alta, mesmo dispositivo), painel de números.
**Telas:** `/influencer` (novo papel `INFLUENCER`, clima visual próprio): links, cupom por loja, vitrine própria `/i/<nome>` (seleção de produtos e link rastreável), indicados/vendas, financeiro e saque (reuso do componente de saque). **Lojista:** `/merchant/influencers` (convidar, comissão, pausar, desempenho, pagar). **Master:** visão no painel de parceiros com filtro por tipo.
**Testes:** atribuição (cupom > link > nenhum), comissão sobre valor pago sem frete, estorno desfaz, garantia e saque, faixa mín/máx, isolamento (um lojista não vê influenciadores de outro), autoindicação, idempotência.
**Aceite:** o lojista convida um influenciador, este vende com cupom e link, a comissão nasce em garantia, vira disponível e é sacada; o estorno desfaz.

### P4 — Feed e Live Shop (módulo `liveShop`)
**Reuso:** motor de seções de tema, `store_assets`, `store_customers`, checkout, `domain_events`, `influencers` (P3), e-mail (E-plataforma).
**Interface `VideoProvider`** (`src/lib/video/`): `createUpload()`, `getAsset(id)`, `createLiveStream()`, `endLive()`, `signPlaybackUrl()`; primeira implementação escolhida por custo (Mux, Cloudflare Stream ou Bunny Stream: **decidir e registrar em D34+ com estimativa de custo por minuto**); implementação simulada para testes.
**Modelo:** `videos` (`storeId`, `providerAssetId`, `status`, `durationMs`, `posterUrl`, `caption`, `published`, `sortOrder`), `video_products` (produtos marcados, com tempo opcional), `lives` (`storeId`, `title`, `scheduledAt`, `status: SCHEDULED|LIVE|ENDED|CANCELED`, `providerStreamId`, `chatEnabled`, `replayVideoId`), `live_pins` (produto fixado no tempo), `live_messages` (chat com moderação), `live_subscriptions` (aviso ao inscrito, com consentimento), `video_reports` (denúncias).
**Domínio:** limites por plano (minutos e armazenamento), moderação (bloqueio por palavras, denúncia, banimento), compra dentro da live (**o carrinho e o checkout existentes**, com produto fixado e reserva de estoque normal), métricas (espectadores, cliques, pedidos por live), replay com produtos.
**Tema:** novas seções `video-feed` (rolagem vertical), `live-banner`/`live-player`, `shoppable-video`; página `/store/[slug]/live/[id]`; feed da plataforma opcional (descoberta entre lojas, com curadoria e regras).
**Segurança e LGPD:** direitos de imagem e termo do apresentador, moderação obrigatória, sem dado pessoal no chat público, retenção configurável, denúncia com fila no Master.
**Testes:** ciclo de vida da live, pin de produto, compra durante a live, limites por plano, moderação, provedor simulado (upload, falha, fim da live), isolamento por loja.
**Aceite:** uma loja publica vídeos com produto marcado no feed e faz uma live de teste em que 2 pedidos são pagos durante a transmissão; o replay mantém os produtos; custo por minuto medido e dentro do limite do plano.

### P5 — Tema nível Shopify (Theme Engine v2)
**Reuso:** `src/lib/themes/*`, `components/storefront/sections/*`, editor, loja de temas, presets (Starter, Arena, Editorial, Signature).
- **Régua de qualidade no CI:** script `e2e/theme-quality.mjs` roda cada tema (com dados de exemplo) e mede Lighthouse mobile (meta 90+ em desempenho, 95+ em acessibilidade), LCP, CLS e peso; falha o CI se cair. Orçamento por página em `theme_budgets` (configuração).
- **Otimização:** imagens responsivas (`srcset`, formatos modernos), carregamento lazy, fontes com `display: swap` e subconjuntos, sem JS desnecessário nas seções estáticas, cache de borda das páginas de loja.
- **Biblioteca ampliada** (cada seção com esquema, preset, teste de render e prévia): galeria e comparativo, avaliações, guia de tamanhos (usa `product.sizeGrid`), barra de frete grátis (usa a regra de P1), compre o look, estoque baixo, prova social, menu grande com busca, quick view, filtros e ordenação avançados, contador, tabelas de atacado (P2), feed e live (P4). Animações sóbrias e desligáveis (`prefers-reduced-motion`).
- **Sistema de design do tema:** tipografia, escalas, cores semânticas, raios, espaçamentos e componentes por configuração global; predefinições por segmento (feminina, masculina, infantil, esportiva, acessórios, atacado).
- **Editor:** comparação lado a lado, atalhos, prévia em 4 larguras, publicar agendado, duplicar, importar/exportar tema (JSON versionado e validado).
- **Theme Store aberta:** `theme_authors`, envio de tema (pacote JSON + preview), **revisão automática** (esquema válido, seções permitidas, contraste, orçamento de desempenho, sem script externo) e manual (fila no Master), versões e atualização segura por loja (com `theme_versions` já existente), repasse configurável (`platform_settings`, padrão 70% ao designer), venda com Pix/cartão pelo checkout de temas já pronto.
- **Conjunto de 8 a 12 temas** ordenados do mais barato ao mais caro, todos passando na régua.
- **Testes:** todas as seções renderizam com dados vazios e cheios; esquema rejeita entrada inválida; tema de terceiros reprovado por contraste ou peso; atualização de versão não perde conteúdo; régua no CI.
- **Aceite:** temas pagos batem a régua de desempenho e acessibilidade; o lojista troca de tema sem perder conteúdo; um tema de terceiro passa na revisão e é instalado com 1 clique.

### P6 — Modelo geral `seller` (opcional, depois de validar o mercado)
Trocar a Central oculta por `seller` de primeiro nível (`stores.sellerId`, produtos e estoque do vendedor, rede de fornecedores como **fonte opcional** de catálogo = módulo SuperDrop). Migração com dados existentes, revisão de todas as consultas por `supplierId` e testes de isolamento e regressão completos. Só começa com o Brás Digital (marketplace) definido.

## 3. ORDEM E DEPENDÊNCIAS
`P0` (conta simples) → `P1` (frete e pagamentos) → `P5` (tema, pode andar em paralelo com P1) → `P2` (atacado) → `P3` (influenciadores) → `P4` (feed e live) → `P6`. O lançamento comercial da NextLevel Commerce acontece **depois de P0 e P1** (com P5 já em curso); P2 a P4 saem como módulos pagos, cada um só marcado como disponível quando o aceite passar.

## 4. DECISÕES QUE VOCÊ DEVE PROPOR COM PADRÃO RECOMENDADO (não bloqueie; registre)
| # | Ponto | Padrão recomendado |
|---|---|---|
| 1 | Provedor de vídeo | O de menor custo por minuto que ofereça upload, transcodificação e live com URL assinada; interface `VideoProvider` para trocar |
| 2 | Comissão de influenciador | Lojista define dentro de faixa mín/máx da plataforma (ex.: 5% a 30%), garantia 7 dias |
| 3 | Atacado: aprovação | Manual por padrão; automática por CNPJ ativo opcional |
| 4 | Faturado | Só com limite de crédito e aprovação; vence pelo `dueDay` da loja; bloqueio por atraso reaproveita a lógica de bloqueio da loja |
| 5 | Frete | SuperFrete e Melhor Envio primeiro; Correios direto depois |
| 6 | Repasse de temas de terceiros | 70% ao designer, configurável |
| 7 | Live: limite por plano | Minutos por mês e armazenamento por plano, com aviso em 80% |
| 8 | Nota fiscal | Fora deste prompt (fase própria) |
| 9 | Marca | Todos os módulos funcionam em qualquer marca; o portal só anuncia o que a marca liga |
| 10 | Papéis novos | `INFLUENCER` e `SALES_REP` no enum de papéis, com navegação própria |

## 5. ACEITE GERAL
Cada promessa do portal ("Atacado de verdade", "Programa de influenciadores", "Feed e live shop", "Temas de nível internacional") passa no seu aceite com testes de domínio, e2e, acessibilidade e 4 larguras; o portal remove "Em breve" só do que passou; nenhum módulo duplica tabela ou tela existente; `docs/design/DECISIONS.md` registra o que foi reaproveitado e o que foi criado, e o `docs/prompts/README.md` marca o estado.

## 6. FORA DE ESCOPO
Nota fiscal automática, marketplace com carrinho único entre lojas (Brás Digital, prompt próprio), app nativo, multi-idioma, afiliados em cascata, ERP.
