> **CONSOLIDADO:** a fonte única do Hub Creators agora é `hub-creators-consolidado.md`. Este arquivo fica como referência de detalhe (arquitetura de plataforma).

# Creator Commerce Platform (produto independente do ecossistema NextLevel): prompt salvo

> **Status: SALVO, NÃO IMPLEMENTADO.** Guardado para uma fase futura. **Este documento SUBSTITUI a premissa de `creator-hub-tiktok.md` de que o Creator Hub é só um módulo interno do Commerce.** O conteúdo de `creator-hub-tiktok.md` (integração TikTok, links rastreáveis, atribuição, comissões, amostras, Pixel/Events API, webhooks, idempotência, segurança) continua válido como **detalhamento**, agora dentro do domínio Creator Platform.
>
> **Estado real do código na data do salvamento (para o item 39 "CURRENT STATE"):**
> - **Nada de Creator Hub foi criado ainda** (sem tabelas, rotas ou telas de creator/campanha/amostra/feed/live/canal). O que existe e é vizinho: programa de **Parceiros/afiliados** (`partners` com `kind = AFFILIATE`, `partner_links`, `partner_clicks`, `partner_commissions` como livro-razão imutável PENDING→AVAILABLE/VOID/CLAWBACK, `partner_payouts`, antifraude `attributionFlag`, cookie `nl-ref`, `coupons`, `runDailyPartnerJobs`; telas em `src/app/partner`, `src/app/master/partners`, `src/app/(portal)/parceiros`; domínio em `src/lib/domain/partners.ts`, regras em `src/lib/finance/partner-rules.ts`; migração 0018).
> - **Marcas e módulos:** `src/lib/brand.ts` (NextLevel Commerce, SuperDrop, Brás Digital; `BRAND_MODULES` já inclui `influencers` e `liveShop`). **Conta simples (D34, migração 0022):** lojas independentes com Central oculta.
> - **Fonte da verdade do Commerce já existente:** `products`, `product_variants`, `inventory`, `orders`, `finance_invoices`, `coupons`, `stores`, `organizations` (tem `brand`), `events` (`emitEvent` com `dedupeKey`, é a semente do barramento de eventos), `email_outbox`.
> - **Fase P3 de `promessas-commerce.md`** (influenciadores sobre `partners`) e **P4** (feed e live shop) são a versão "módulo interno" disso. Ao executar este prompt, **reconciliar P3/P4 com a nova fronteira** (registrar em `DECISIONS.md`, próxima D35) em vez de implementar as duas visões.
> - **Regras do projeto que continuam valendo:** tenant só pela sessão do servidor, segredos com `encryptSecret`, valores em centavos, `force-dynamic` em páginas com banco, nada de preço/percentual fixo no código, mudança de comportamento só com teste, sem PR sem o dono pedir, anti-duplicação (estender o que existe).
> - **Sugestão de ordem:** (1) diagnóstico e contrato de fronteira por escrito (tarefa 45); (2) `creator_*` separado por prefixo e pasta `src/lib/domain/creator/` + `src/app/creator*` no mesmo repositório (fase 1 de 4: monólito modular); (3) contratos de eventos sobre o `emitEvent` atual; (4) MVP (item 41). P1 (frete/pagamentos) e P5 (tema) seguem com prioridade de lançamento do Commerce.

---

ATUALIZAÇÃO ARQUITETURAL CRÍTICA

Este documento SUBSTITUI o entendimento anterior de que o Creator/Influencer Hub é apenas um módulo interno da NextLevel Commerce.

Antes de continuar qualquer implementação relevante, considere a seguinte decisão arquitetural:

«Creator Commerce será uma plataforma/produto independente dentro do ecossistema NextLevel.»

Ela continuará profundamente integrada à NextLevel Commerce, mas terá domínio, produto, experiência, usuários e evolução próprios.

---

1. NOVA ARQUITETURA DO ECOSSISTEMA

ECOSSISTEMA NEXTLEVEL
│
├── NEXTLEVEL COMMERCE
│   │
│   ├── Commerce Core
│   ├── Lojas
│   ├── Catálogo
│   ├── Produtos
│   ├── Variantes
│   ├── Estoque
│   ├── Carrinho
│   ├── Checkout
│   ├── Pagamentos
│   ├── Pedidos
│   ├── Clientes
│   │
│   ├── Superdrop
│   └── Brás Digital
│
│             ↕
│
│      API + EVENTS + SSO
│
│             ↕
│
└── CREATOR COMMERCE PLATFORM
    │
    ├── Consumer Experience
    │   ├── Video Feed
    │   ├── Discovery
    │   ├── Search
    │   ├── Following
    │   ├── Live
    │   ├── Channels 24/7
    │   └── Product Discovery
    │
    ├── Creator Studio
    │   ├── Profile
    │   ├── Portfolio
    │   ├── Opportunities
    │   ├── Campaigns
    │   ├── Samples
    │   ├── Content
    │   ├── Lives
    │   ├── Links
    │   ├── Commissions
    │   └── Analytics
    │
    └── Brand / Merchant Studio
        ├── Creators
        ├── Creator Discovery
        ├── Campaigns
        ├── Samples
        ├── Content
        ├── Lives
        ├── Channels
        ├── Commissions
        └── Performance

---

2. REGRA FUNDAMENTAL

NÃO tratar Creator Commerce como:

NextLevel Commerce
└── /influencer-hub

O entendimento correto passa a ser:

NextLevel Commerce
        ↕
Creator Commerce Platform

São dois bounded contexts/produtos.

Eles podem inicialmente compartilhar infraestrutura, monorepo, autenticação, banco ou determinados serviços se isso for tecnicamente vantajoso.

Porém, a fronteira de domínio precisa existir DESDE AGORA.

---

3. NÃO CRIAR MICROSSERVIÇOS PREMATURAMENTE

Independência de produto NÃO significa criar dezenas de serviços agora.

Preferir inicialmente:

Modular Monolith
+
Bounded Contexts
+
APIs internas bem definidas
+
Domain Events

Se o projeto atual estiver em monorepo, considerar algo conceitualmente semelhante a:

/apps
   /commerce
   /creator-platform

/packages
   /auth
   /ui
   /events
   /commerce-sdk
   /creator-sdk
   /shared-types

Somente adotar isso se compatível com a arquitetura existente.

Não reestruturar o repositório cegamente.

---

4. RESPONSABILIDADE DA NEXTLEVEL COMMERCE

A NextLevel Commerce continua sendo a fonte da verdade para:

Store
Product
Variant
Inventory
Price
Cart
Checkout
Customer
Order
Payment
Refund
Fulfillment

A Creator Platform NÃO deve duplicar esses domínios.

Quando precisar de produto:

Creator Platform
      ↓
Commerce API
      ↓
Product

Quando acontecer uma venda:

Commerce
   ↓
OrderPaid event
   ↓
Creator Platform
   ↓
Attribution
   ↓
Commission

---

5. RESPONSABILIDADE DA CREATOR PLATFORM

A nova plataforma será a fonte da verdade para:

Creator
Creator Profile
Creator Channels
Creator Portfolio

Feed
Feed Interaction
Recommendation Signals

Campaign
Opportunity
Creator Interest

Sample Request

Creator Content
Media Assets
Content Rights

Live Session
Live Participants

Channels 24/7
Programming
Program Blocks

Creator Attribution Context

Commission Rules
Commission Ledger

Creator Performance
Content Performance
Live Performance
Channel Performance

---

6. CREATOR NÃO PERTENCE AO COMMERCE

Essa decisão é crítica.

Creator deve possuir identidade própria dentro da Creator Platform.

Creator Platform

Creator
   ├── TikTok
   ├── Instagram
   ├── YouTube
   └── outros

Ele pode trabalhar simultaneamente com:

Store A
Store B
Brand C
Supplier D
Channel E

Não modelar creator como filho de "Store".

---

7. LOJA NÃO É MAIS O ÚNICO CLIENTE POSSÍVEL

A arquitetura deve admitir futuramente:

NextLevel Commerce Store
External Store
Brand
Supplier
Agency
Advertiser
Creator

Isso significa que uma empresa que NÃO utiliza NextLevel Commerce poderá futuramente utilizar a Creator Platform.

Exemplo:

Marca externa
     ↓
Creator Platform
     ↓
Campaign
     ↓
Creators

Se utilizar Commerce:

Creator Platform
     ↓
NextLevel Commerce
     ↓
Checkout

Se não utilizar Commerce, futuramente poderá haver outros connectors.

NÃO implementar isso agora.

Apenas não criar dependência estrutural que torne isso impossível.

---

8. CONCEITO DE ORGANIZATION

Avaliar criar uma entidade mais genérica:

Organization

Tipos futuros:

MERCHANT
BRAND
SUPPLIER
AGENCY
PLATFORM

Uma "Organization" poderá possuir relacionamento com:

CommerceTenant

quando aplicável.

Não substituir o tenant atual sem análise.

Criar adapter/relação se necessário.

---

9. AUTENTICAÇÃO

Objetivo futuro:

uma identidade NextLevel entre os produtos.

Exemplo:

NextLevel Account
      │
      ├── Commerce
      ├── Creator Platform
      ├── Superdrop
      └── Brás Digital

Utilizar SSO ou identidade compartilhada quando apropriado.

Mas permissões são diferentes.

Exemplos:

CONSUMER
CREATOR
MERCHANT
BRAND_MANAGER
CHANNEL_OPERATOR
MODERATOR
ADMIN

Não misturar identidade com autorização.

---

10. EXPERIÊNCIA DO CONSUMIDOR

A Creator Platform também terá uma experiência destinada ao consumidor final.

Ela não é somente SaaS administrativo.

Principal experiência:

VIDEO-FIRST
MOBILE-FIRST

Navegação conceitual:

Para Você
Ao Vivo
Explorar
Seguindo
Perfil

---

11. FEED VERTICAL

Feed principal:

9:16
fullscreen
autoplay
swipe

Pode apresentar:

Creator Content
Product Demo
Campaign Content
Live
Channel
Store
Product
Sponsored Content

Produto deve estar contextualizado no conteúdo.

---

12. COMMERCE OVERLAY

Durante vídeo:

VIDEO
│
├── Creator
├── Store
├── Product
├── Price
├── Offer
└── CTA

CTA:

VER PRODUTO
COMPRAR

Quando Commerce estiver conectado:

Creator Platform
       ↓
Commerce Product
       ↓
Commerce Checkout

---

13. LIVE COMMERCE

A plataforma deverá suportar conceito de:

LiveSession

Uma LIVE pode possuir:

Host
Co-host
Creators
Stores
Brands
Products
Campaign
Channel

---

14. CHANNELS 24/7

Separar:

LiveSession

de:

Channel

Channel representa programação contínua.

Exemplos:

Ferramentas 24h
Moda
Casa & Cozinha
Beleza
Eletrônicos
Esportes

---

15. PROGRAMMING ENGINE

Channel:

Channel
  ↓
ProgramSchedule
  ↓
ProgramBlock

ProgramBlock:

LIVE
PRE_RECORDED
CREATOR_CONTENT
PRODUCT_DEMO
REPLAY
SPONSORED
PROMO

Objetivo:

24/7 availability

mesmo quando nenhuma LIVE real estiver acontecendo.

---

16. EXEMPLO — CANAL FERRAMENTAS

FERRAMENTAS 24H

08:00 Product Demo
08:15 Creator Review
08:30 Replay
09:00 LIVE Loja A
10:00 Creator Content
10:20 Product Demo
11:00 LIVE Loja B
12:00 Sponsored Block
13:00 Creator Review
14:00 LIVE Multi-store
...

---

17. MULTI-MERCHANT LIVE

Uma mesma transmissão poderá possuir produtos de diversas lojas.

Exemplo:

NEXTLEVEL TOOLS LIVE

Host
+
Creator
+
Loja A
+
Loja B
+
Loja C

A plataforma precisa saber:

produto → merchant
pedido → merchant
creator → attribution
live → attribution
channel → attribution

---

18. CHECKOUT CONTINUA NO COMMERCE

Não construir outro checkout dentro da Creator Platform neste momento.

Quando o produto pertence à NextLevel Commerce:

Video / Live
     ↓
Product CTA
     ↓
NextLevel Commerce
     ↓
Checkout
     ↓
Payment
     ↓
Order

---

19. EVENTOS ENTRE PLATAFORMAS

Criar contrato de eventos.

Exemplos:

ProductCreated
ProductUpdated
ProductUnavailable

OrderCreated
OrderPaid
OrderCanceled
OrderRefunded

InventoryChanged
PriceChanged

Creator Platform poderá produzir:

CreatorAttributed
CampaignConversion
CommissionCreated
ContentPublished
LiveStarted
LiveEnded

Não acoplar diretamente tabelas internas quando eventos/APIs forem mais adequados.

---

20. ATTRIBUTION

Precisamos preservar contexto entre plataformas.

Exemplo:

Creator Platform

viewer
↓
video
↓
creator
↓
channel
↓
product
↓
tracking token

        ↓

Commerce

product
↓
checkout
↓
order
↓
tracking token

        ↓

Creator Platform

OrderPaid
↓
Attribution
↓
Commission

Tracking token deve ser opaco e seguro.

---

21. COMMISSION LEDGER

Comissão pertence à Creator Platform.

Venda pertence ao Commerce.

Fluxo:

Commerce
ORDER_PAID
    ↓
Creator Platform
COMMISSION_PENDING
    ↓
Commerce
return window / refund
    ↓
Creator Platform
APPROVED / REVERSED

Ledger deve ser auditável.

---

22. REPLAY COMPRÁVEL

LIVE termina:

Live
↓
Recording
↓
Replay
↓
Product markers
↓
Feed
↓
Sale

Preservar attribution.

---

23. CLIPPING

Arquitetura deve permitir:

Live Recording
↓
Clip
↓
Vertical Video
↓
Feed

IA para clipping automático é futura.

Não implementar agora.

---

24. CREATOR STUDIO

Produto próprio para creators:

Creator Studio
│
├── Home
├── Feed
├── Opportunities
├── Campaigns
├── Samples
├── Content
├── Lives
├── Calendar
├── Products
├── Links
├── Sales
├── Commissions
└── Analytics

---

25. BRAND / MERCHANT STUDIO

Brand Studio
│
├── Dashboard
├── Creator Discovery
├── Creators
├── Campaigns
├── Samples
├── Content
├── Lives
├── Channels
├── Products
├── Commissions
└── Analytics

---

26. CHANNEL OPERATOR

Criar conceito futuro de operador/editorial.

Responsabilidades:

Channel programming
Scheduling
Content approval
Live scheduling
Fallback programming
Product placement
Sponsored slots

Isso é diferente de Merchant.

---

27. ADMIN / MODERATION

Plataforma social exige administração própria.

Preparar:

Moderation
Reports
Content Review
Creator Review
Organization Review
Suspensions
Bans
Audit

---

28. SOCIAL GRAPH

Preparar:

Follow Creator
Follow Store
Follow Brand
Follow Channel
Follow Category

Isso pertence à Creator Platform.

---

29. SEARCH

Busca unificada dentro da Creator Platform:

Creators
Videos
Lives
Channels
Products
Brands
Stores
Campaigns

Produtos podem ser resolvidos via Commerce.

---

30. RECOMMENDATION

V1:

rules-based.

Futuro:

recommendation engine.

Registrar desde agora:

impression
watch time
completion
skip
replay
like
save
follow
product click
add to cart
checkout
purchase
refund

---

31. DATA OWNERSHIP

Definir explicitamente quem é source of truth.

COMMERCE

Products
Inventory
Orders
Payments
Checkout
Customers

CREATOR PLATFORM

Creators
Feed
Content
Campaigns
Samples
Lives
Channels
Programming
Attribution
Commissions
Creator Analytics

---

32. TIKTOK É PROVIDER, NÃO FUNDAÇÃO

Não modelar a plataforma como extensão do TikTok.

Providers futuros:

TikTok
Instagram
YouTube
Kwai
NextLevel Native

A plataforma precisa funcionar mesmo se determinada API externa mudar.

---

33. TIKTOK INTEGRATION

Investigar separadamente:

TikTok Login
Display API
Content Posting
TikTok One
Creator Marketplace
Marketing API
Spark Ads
Pixel
Events API
TikTok Shop Affiliate
Samples
LIVE

Não inventar endpoints.

Classificar:

CONFIRMED
NEEDS_VALIDATION
TIKTOK_ONE_DEPENDENT
TIKTOK_SHOP_DEPENDENT
ADS_DEPENDENT
FUTURE

---

34. TIKTOK SHOP NÃO É REQUISITO

Uma conta TikTok Shop poderá ser utilizada para testes e integrações avançadas.

Mas:

Creator Platform
≠
TikTok Shop frontend

E:

Merchant
não precisa obrigatoriamente
possuir TikTok Shop

---

35. LIVE NATIVA FUTURA

Não construir streaming próprio agora.

Arquitetura deve permitir futuramente:

NextLevel Native Live

utilizando infraestrutura especializada para:

ingest
transcoding
HLS
low latency
CDN
recording
chat
moderation

---

36. NÃO DUPLICAR DADOS DO COMMERCE

Evitar criar dentro da Creator Platform cópias independentes completas de:

Product
Inventory
Order
Payment
Customer

Quando cache/read-model for necessário, deixar explícito que é projeção.

Exemplo:

CommerceProductProjection

e não novo source of truth.

---

37. API CONTRACT

Definir fronteira clara.

Exemplo conceitual:

Creator Platform
      ↓
Commerce API

GET product
GET availability
GET price
CREATE checkout/session

E:

Commerce
      ↓
Event Bus/Webhooks
      ↓
Creator Platform

OrderPaid
OrderRefunded

Adaptar à infraestrutura existente.

---

38. INDEPENDÊNCIA GRADUAL

Não separar fisicamente tudo agora.

Fases:

PHASE 1
same repository
clear domain boundary

PHASE 2
independent application surfaces

PHASE 3
internal APIs/events

PHASE 4
separate scaling where necessary

Evitar distributed-system complexity prematura.

---

39. NOVO OBJETIVO DO DESENVOLVIMENTO ATUAL

PARE antes de aprofundar Creator Hub como submódulo de Commerce.

Primeiro faça uma análise do que já foi implementado.

Identifique:

quais tabelas já foram criadas
quais migrations já rodaram
quais rotas existem
quais telas existem
quais services existem
quais dependências com tenant/store foram criadas

Depois classifique cada item:

KEEP
MOVE TO CREATOR DOMAIN
ADAPT
DECOUPLE
REMOVE ONLY IF SAFE

NÃO apagar nada automaticamente.

---

40. REESTRUTURAÇÃO SEGURA

Se já existirem entidades Creator dentro do Commerce:

não destruir.

Primeiro proponha migration path.

Exemplo:

Current Creator Hub
        ↓
Domain boundary
        ↓
Creator Platform

Preservar IDs e relacionamentos sempre que possível.

---

41. MVP DA PLATAFORMA INDEPENDENTE

Primeira entrega deve validar:

Creator Platform

1. Creator identity
2. Creator profile
3. Vertical video feed
4. Products from Commerce
5. Campaigns
6. Creator interest
7. Samples
8. Tracking
9. Attribution
10. Commission
11. Channels
12. Program blocks
13. External LiveSession

Não implementar todas as funcionalidades avançadas.

---

42. EXPERIÊNCIA MVP

Consumer:

Feed
Ao Vivo
Explorar
Perfil

Creator:

Feed
Oportunidades
Campanhas
Amostras
Conteúdo
Ganhos

Merchant:

Dashboard
Creators
Campaigns
Samples
Lives
Performance

---

43. VISÃO DE LONGO PRAZO

A arquitetura final pretendida é:

                 ECOSSISTEMA NEXTLEVEL
                         │
        ┌────────────────┴────────────────┐
        │                                 │
NEXTLEVEL COMMERCE              CREATOR COMMERCE PLATFORM
        │                                 │
Commerce Core                         Audience
Stores                                Creators
Products                              Video Feed
Inventory                             Social Graph
Checkout                              Campaigns
Payments                              Samples
Orders                                Content
        │                              Live
        │                              Channels 24/7
        │                              Recommendation
        │                              Attribution
        │                              Commissions
        │                                 │
        └──────── APIs / EVENTS ──────────┘
                         │
                         ▼
                       SALE

---

44. PRINCÍPIO ESTRATÉGICO

NextLevel Commerce responde:

«Como vender e operar a transação?»

Creator Commerce responde:

«Como descobrir produtos, gerar audiência, produzir influência e criar demanda?»

Juntas:

DISCOVERY
↓
CONTENT
↓
INFLUENCE
↓
LIVE
↓
PRODUCT
↓
CHECKOUT
↓
ORDER
↓
ATTRIBUTION
↓
COMMISSION
↓
DATA
↓
RECOMMENDATION

---

45. PRIMEIRA TAREFA AGORA

Antes de continuar codificando:

1. inspecione o estado atual do repositório;
2. identifique tudo já criado para Influencer/Creator Hub;
3. identifique dependências diretas com Commerce;
4. determine o que pode permanecer;
5. determine o que precisa de boundary;
6. proponha a estrutura independente;
7. proponha migration path SEM perda de dados;
8. proponha API contracts Commerce ↔ Creator Platform;
9. proponha eventos entre os domínios;
10. proponha estrutura de aplicações/pacotes compatível com o projeto atual.

Depois apresente:

CURRENT STATE

WHAT STAYS

WHAT CHANGES

DOMAIN BOUNDARY

CREATOR PLATFORM ARCHITECTURE

COMMERCE INTEGRATION

DATA OWNERSHIP

API CONTRACTS

EVENT CONTRACTS

MIGRATION PLAN

MVP PLAN

RISKS

Somente depois disso continue a implementação.

---

46. RESTRIÇÃO IMPORTANTE

Não faça uma refatoração destrutiva apenas porque a visão mudou.

A prioridade é:

preservar
↓
desacoplar
↓
migrar
↓
expandir

e NÃO:

apagar
↓
reescrever tudo

---

47. RESULTADO ESPERADO

Queremos sair de:

NextLevel Commerce
└── Influencer Hub

para:

NextLevel Ecosystem
│
├── NextLevel Commerce
│
└── Creator Commerce Platform

com integração profunda entre os produtos, mas fronteiras arquiteturais claras.

A Creator Commerce Platform deve conseguir futuramente existir como produto comercial independente, inclusive atendendo marcas, creators e organizações que não necessariamente utilizem o NextLevel Commerce.

Agora analise o código existente com essa nova decisão arquitetural antes de continuar a implementação.
