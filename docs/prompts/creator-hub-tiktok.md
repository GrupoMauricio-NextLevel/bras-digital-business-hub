# Creator Hub + TikTok (NextLevel Commerce): prompt salvo para implementar com calma

> **Status: SALVO, NÃO IMPLEMENTADO.** O dono pediu para guardar e implementar depois, com calma. Comece pela tarefa 28 (diagnóstico) e só então a FASE 1.
>
> **Notas do repositório (ler antes de codar, vieram da sessão de trabalho):**
> - **Anti-duplicação (CLAUDE.md, seção 4A do prompt mestre):** já existem `partners` (com `kind`, previsto `INFLUENCER`), `partner_links`, `partner_clicks`, `partner_commissions` (livro-razão imutável com PENDING→AVAILABLE, VOID, CLAWBACK), `partner_payouts`, antifraude (`attributionFlag`), cookie `nl-ref`, `coupons`, `recordClick`, `runDailyPartnerJobs`. O prompt `promessas-commerce.md` fase **P3 (Influenciadores)** já planeja estender isso. O Creator Hub deve **estender ou generalizar esses objetos**, não criar um segundo livro-razão nem um segundo rastreio. Decidir no diagnóstico: `Creator` global como generalização de `partners` ou tabela nova ligada a `partners`; registrar em `DECISIONS.md` (próxima: D35).
> - **Marca/módulos:** `src/lib/brand.ts` (`BRAND_MODULES` já tem `influencers`); Creator Hub é módulo, liga por marca/plano. Superdrop e Brás Digital são módulos irmãos, não base.
> - **Multi-tenant:** tenant vem da sessão (`requireRole`, `assertCanAccess`), nunca do front. Segredos só com `encryptSecret`. Ações por `runAction` e domínio em `src/lib/domain/`. Páginas com banco: `export const dynamic = "force-dynamic"`. Valores em centavos.
> - **Conta simples (D34) já existe:** lojas independentes (`SUPPLIER_OWN`, Central oculta) também usarão o Creator Hub.
> - **Pesquisa pendente:** `docs/prompts/pesquisa-tiktok-shop-integracao.md` (o dono vai trazer a resposta do GPT). Use-a para marcar CONFIRMADO / PRECISA VALIDAR / TIKTOK SHOP DEPENDENT / TIKTOK ONE DEPENDENT / ADS DEPENDENT.
> - Promessas e fases P1 (frete/pagamentos) e P5 (tema) têm prioridade de lançamento; o Creator Hub entra depois ou em paralelo conforme o dono decidir.

---

CONTEXTO ATUALIZADO — NEXTLEVEL COMMERCE + TIKTOK

Estamos evoluindo a arquitetura da plataforma.

1. DEFINIÇÃO CORRETA DO PRODUTO

A plataforma principal agora é:

NextLevel Commerce

Ela é uma plataforma de e-commerce multi-tenant para criação e operação de lojas virtuais.

Não trate mais o Superdrop como plataforma principal.

A arquitetura conceitual é:

NextLevel Commerce
│
├── Core E-commerce
│   ├── lojas
│   ├── usuários
│   ├── catálogo
│   ├── produtos
│   ├── variantes
│   ├── estoque
│   ├── clientes
│   ├── carrinho
│   ├── checkout
│   ├── pedidos
│   ├── pagamentos
│   ├── domínios
│   └── integrações
│
├── Superdrop
│   ├── fornecedores
│   ├── catálogo compartilhado
│   ├── dropshipping
│   ├── sincronização de produtos
│   └── operação logística drop
│
├── Brás Digital
│   ├── fornecedores
│   ├── atacadistas
│   ├── ecossistema B2B
│   └── distribuição comercial
│
└── Creator / Influence Hub
    ├── TikTok
    ├── creators
    ├── campanhas
    ├── conteúdos
    ├── links rastreáveis
    ├── atribuição
    ├── comissões
    ├── amostras
    └── performance

Superdrop passa a ser apenas um produto/módulo dentro da NextLevel Commerce.

Brás Digital será outro produto/módulo.

Uma loja pode utilizar:

- somente NextLevel Commerce;
- NextLevel Commerce + Superdrop;
- NextLevel Commerce + Brás Digital;
- NextLevel Commerce + Creator Hub;
- ou qualquer combinação desses módulos.

Portanto, novos recursos devem ser arquitetados preferencialmente como capacidades reutilizáveis do Core ou módulos desacoplados, evitando dependência desnecessária do Superdrop.

---

2. NOVO OBJETIVO: INTEGRAÇÃO COM TIKTOK

Queremos criar dentro da NextLevel Commerce uma camada profunda de integração com o ecossistema TikTok.

IMPORTANTE:

O objetivo principal NÃO é fazer o lojista vender dentro do TikTok Shop.

O checkout principal continuará acontecendo na loja virtual hospedada pela NextLevel Commerce.

Fluxo desejado:

TikTok / Creator
       ↓
conteúdo
       ↓
link / campanha
       ↓
Loja NextLevel Commerce
       ↓
produto
       ↓
checkout NextLevel
       ↓
pedido
       ↓
atribuição ao creator
       ↓
comissão / analytics

O TikTok deve funcionar principalmente como:

- canal de aquisição;
- canal de influência;
- origem de creators;
- canal de publicação de conteúdo;
- plataforma de campanhas;
- fonte de dados de performance;
- origem de tráfego para lojas NextLevel.

---

3. TIKTOK SHOP

Não devemos obrigar cada lojista da NextLevel Commerce a criar uma TikTok Shop.

Entretanto, temos acesso a pelo menos uma conta própria/operacional do TikTok Shop que poderá ser utilizada, se necessário, para:

- pesquisa técnica;
- Development Shop;
- acesso a funcionalidades adicionais;
- explorar APIs de Affiliate;
- analisar creators;
- analisar produtos;
- testar colaboração;
- testar solicitação de amostras;
- entender comissões;
- entender campanhas;
- entender fluxos de afiliados;
- testar funcionalidades que não estejam disponíveis via TikTok One ou APIs públicas.

Portanto:

TikTok Shop deve ser tratado como integração complementar e opcional, não como requisito estrutural da NextLevel Commerce.

---

4. CAMADAS DE INTEGRAÇÃO

Estruture a integração considerando quatro camadas separadas.

CAMADA A — TikTok Account / Creator Connection

Permitir que um creator conecte sua conta TikTok à NextLevel.

OAuth.

Criar estrutura para armazenar por integração:

provider
external_account_id
tenant_id
user_id
access_token encrypted
refresh_token encrypted
expires_at
scopes
status
metadata
created_at
updated_at

Nunca armazenar secrets no frontend.

Criar:

TikTokConnection
TikTokAccount
OAuthState
IntegrationCredential

ou adaptar entidades equivalentes existentes.

Objetivo futuro:

- obter perfil autorizado;
- username;
- avatar;
- identificação externa;
- vídeos;
- métricas permitidas;
- status de autorização.

---

5. CAMADA B — CREATOR HUB

Criar arquitetura para uma central de creators independente de qualquer provider.

Não chamar entidades internas exclusivamente de "TikTokCreator".

Preferir algo como:

Creator
CreatorAccount
CreatorChannel
CreatorMetric
CreatorCampaign
CreatorCampaignMember
CreatorContent
CreatorCommissionRule
CreatorAttribution
CreatorPayout
CreatorSample

Assim futuramente podemos integrar:

TikTok
Instagram
YouTube
Kwai
outras plataformas

Exemplo:

Creator
 ├── CreatorChannel TikTok
 ├── CreatorChannel Instagram
 └── CreatorChannel YouTube

---

6. PERFIL DO CREATOR

Criar estrutura para armazenar dados normalizados.

Exemplo:

Creator {
  id
  tenantId?
  name
  email?
  phone?
  status
  source
  createdAt
}

CreatorChannel {
  id
  creatorId
  provider
  externalAccountId
  username
  profileUrl?
  avatarUrl?
  followers?
  following?
  totalLikes?
  videoCount?
  engagementRate?
  metadata?
}

Alguns creators poderão existir globalmente na plataforma, enquanto relacionamentos comerciais específicos pertencem a tenants.

Pensar com cuidado na separação:

Creator global
        ↓
Creator ↔ Tenant relationship
        ↓
Campanhas

Evitar duplicar o mesmo creator para cada loja se houver forma segura de compartilhamento.

---

7. TIKTOK ONE / CREATOR MARKETPLACE

Queremos investigar e preparar a arquitetura para integração com TikTok One / Creator Marketplace.

Possíveis funcionalidades futuras:

- discovery de creators;
- pesquisa;
- filtros;
- convites;
- campanhas;
- candidatura de creator;
- aceite;
- briefing;
- conteúdo produzido;
- aprovação;
- status da campanha;
- performance;
- Spark Ads;
- anchors para websites externos.

IMPORTANTE:

Não inventar endpoints.

Não implementar chamadas fictícias.

Primeiro localizar na documentação oficial atual:

- APIs disponíveis;
- scopes;
- fluxo OAuth;
- permissões;
- requisitos de Partner;
- disponibilidade no Brasil;
- limitações;
- rate limits;
- necessidade de aprovação manual.

Criar adapters/interfaces mesmo quando a API ainda não estiver disponível.

Exemplo:

interface CreatorDiscoveryProvider {
  searchCreators(...)
  getCreator(...)
}

interface CreatorCampaignProvider {
  createCampaign(...)
  inviteCreator(...)
  getCampaign(...)
  syncCampaign(...)
}

interface CreatorContentProvider {
  listContent(...)
  getContentMetrics(...)
}

---

8. CONTENT POSTING

Queremos futuramente permitir:

Produto
   ↓
Campanha
   ↓
Creator
   ↓
Conteúdo
   ↓
aprovação
   ↓
publicação TikTok

Investigar Content Posting API oficial.

Considerar:

- Direct Post;
- upload como draft;
- publicação de vídeo;
- publicação de imagem, caso suportado;
- scopes;
- autorização individual do creator;
- auditoria necessária para publicação pública.

Criar arquitetura desacoplada:

SocialPost
SocialPostAsset
SocialPublishJob
SocialPublishResult

Provider:

TIKTOK

No futuro:

INSTAGRAM
YOUTUBE

---

9. CAMPANHAS

Criar conceito de campanha de influência.

Exemplo:

CreatorCampaign {
  id
  tenantId
  name
  description
  status

  startAt
  endAt

  objective

  landingPageUrl?
  destinationType

  attributionWindowDays

  createdAt
}

Relacionamentos:

Campaign
 ├── produtos
 ├── creators
 ├── conteúdos
 ├── links
 ├── cupons
 ├── comissão
 └── analytics

---

10. PRODUTOS DA CAMPANHA

O lojista deve conseguir selecionar produtos do próprio catálogo NextLevel.

Exemplo:

Criar campanha
      ↓
Selecionar produto
      ↓
Selecionar creators
      ↓
Configurar comissão
      ↓
Gerar briefing
      ↓
Enviar campanha

Criar algo equivalente a:

CreatorCampaignProduct

Não duplicar produto.

Relacionar com "productId" existente.

---

11. LINKS RASTREÁVEIS

Essa parte é PRIORITÁRIA.

Cada combinação creator + campanha deverá poder gerar um link único.

Exemplo:

https://lojacliente.com.br/produto/x?ref=abc123

Mas preferencialmente usar identificador opaco e seguro.

Exemplo:

?src=cr_8FD3K2

ou URL curta:

https://nxl.to/a8FG2

Criar entidades como:

TrackingLink
TrackingClick
AttributionSession

Registrar:

creatorId
campaignId
tenantId
productId?
source
medium
campaign
externalClickId?
sessionId
visitorId
clickedAt
ipHash?
userAgent?
utm*

Respeitar LGPD.

Não armazenar dados desnecessários.

---

12. ATRIBUIÇÃO

Precisamos saber qual creator originou uma venda.

Fluxo:

Clique
 ↓
trackingId
 ↓
sessão
 ↓
carrinho
 ↓
checkout
 ↓
pedido
 ↓
attribution

Criar:

OrderAttribution

Exemplo:

OrderAttribution {
  id
  tenantId
  orderId
  creatorId?
  campaignId?
  trackingLinkId?
  couponId?
  source
  attributedAt
  attributionModel
}

Modelo inicial:

last-click

Mas deixar arquitetura preparada para:

first-click
coupon
hybrid
multi-touch futuro

---

13. JANELA DE ATRIBUIÇÃO

Configuração por campanha.

Exemplo:

1 dia
7 dias
15 dias
30 dias

Default inicial sugerido:

7 dias

Mas não hardcode.

---

14. CUPOM DO CREATOR

Possibilitar código exclusivo.

Exemplo:

JOAO10
MARIA15

O cupom pode funcionar tanto como desconto quanto como método secundário de atribuição.

Exemplo:

clique não identificado
+
cupom do creator utilizado
=
atribuir venda ao creator

Definir regras para conflito:

tracking link
vs
coupon

Inicialmente podemos definir:

coupon explicitamente utilizado > cookie de creator anterior

Mas colocar isso como regra configurável futuramente.

---

15. COMISSÕES

Criar engine de comissão desacoplada.

Possibilidades futuras:

% da venda
valor fixo
% por produto
% por campanha
% por creator
comissão escalonada
bônus por meta

Criar algo como:

CommissionRule
CommissionEntry
CreatorBalance
CreatorPayout

Não pagar automaticamente ainda.

Primeiro gerar ledger confiável.

Exemplo:

ORDER_PAID
   ↓
commission pending

prazo de devolução
   ↓

commission approved

refund
   ↓

commission reversed

Ledger deve ser imutável ou auditável.

---

16. AMOSTRAS

Queremos uma funcionalidade semelhante à lógica de sample request do TikTok Shop.

Mesmo que a API do TikTok não esteja disponível inicialmente, criar o conceito dentro da NextLevel.

Creator solicita amostra
        ↓
Loja analisa
        ↓
Aprova/rejeita
        ↓
Produto enviado
        ↓
Creator recebe
        ↓
Conteúdo produzido

Entidade:

CreatorSampleRequest

Possíveis estados:

REQUESTED
APPROVED
REJECTED
PREPARING
SHIPPED
DELIVERED
CONTENT_PENDING
COMPLETED
CANCELED

Associar:

tenant
creator
campaign
product
variant?
address snapshot
shipping
tracking
content

---

17. TIKTOK SHOP COMO FONTE COMPLEMENTAR

Temos possibilidade de utilizar uma conta TikTok Shop própria da operação para investigação e integração avançada.

Pesquisar especialmente:

Affiliate API
Creator Affiliate
Open Collaboration
Target Collaboration
Sample Requests
Creator discovery
Commission
Campaigns
Products
Affiliate performance

Objetivo:

descobrir se conseguimos obter dados ou executar operações úteis ao Creator Hub sem obrigar cada lojista NextLevel a possuir TikTok Shop.

IMPORTANTE:

Se determinada função exigir explicitamente:

Seller TikTok Shop
+
produto cadastrado na TikTok Shop

marcar como:

TIKTOK_SHOP_DEPENDENT

e NÃO tornar isso requisito do Creator Hub principal.

---

18. PIXEL + EVENTS API

Cada loja NextLevel deverá poder conectar TikTok Business/Ads futuramente.

Criar arquitetura para:

TikTok Pixel
TikTok Events API

Eventos relevantes:

PageView
ViewContent
Search
AddToCart
InitiateCheckout
AddPaymentInfo
CompletePayment/Purchase

Mapear corretamente os eventos usando documentação oficial.

Nunca enviar dados sensíveis sem tratamento apropriado.

Criar camada server-side para Events API.

Evitar dependência exclusiva do browser.

---

19. CONVERSÕES

A NextLevel possui a fonte real da verdade sobre:

checkout
pagamento
pedido
cancelamento
reembolso

Portanto:

TikTok não deve ser considerado a fonte da verdade da venda quando o checkout ocorrer na NextLevel.

A arquitetura é:

NextLevel Order
      ↓
Payment confirmed
      ↓
Attribution
      ↓
Commission
      ↓
TikTok Events API

---

20. SPARK ADS / ADS

Preparar arquitetura futura para transformar conteúdo de creator em mídia.

Pesquisar APIs e requisitos relacionados a:

TikTok Ads
Spark Ads
advertiser accounts
creator authorization
ad authorization
campaign performance

Não implementar sem confirmar documentação.

Criar apenas abstrações se fizer sentido.

---

21. MULTI-TENANT

Todo código deve preservar isolamento multi-tenant.

Nenhuma chamada deve permitir:

tenant A

acessar:

creator campaign
commission
order attribution
credential
tracking

do tenant B.

Aplicar tenant ownership no backend.

Nunca confiar apenas em "tenantId" recebido do frontend.

Resolver tenant pela sessão/autorização server-side.

---

22. SEGURANÇA

Tokens TikTok devem:

- permanecer server-side;
- ser criptografados em repouso;
- nunca ir para logs;
- nunca ir para respostas do frontend;
- suportar refresh;
- suportar revogação;
- suportar desconexão.

Criar abstração de credentials.

Registrar eventos importantes em audit log.

Exemplo:

TIKTOK_CONNECTED
TIKTOK_DISCONNECTED
TOKEN_REFRESHED
CAMPAIGN_CREATED
CREATOR_INVITED
SAMPLE_APPROVED
COMMISSION_APPROVED
PAYOUT_CREATED

Nunca registrar token.

---

23. WEBHOOKS

Preparar estrutura de webhooks.

Criar:

WebhookEvent
WebhookDelivery
WebhookProcessingAttempt

Requisitos:

signature validation
idempotency
retries
deduplication
dead-letter strategy
audit

Não assumir quais eventos TikTok existem.

Mapear somente depois de validar documentação.

---

24. IDEMPOTÊNCIA

Qualquer operação externa deverá ser idempotente.

Especialmente:

publish content
send invite
sync campaign
process webhook
create commission
attribute order
send conversion

Evitar:

duplicate commission
duplicate invite
duplicate publish
duplicate conversion

---

25. PROVIDER ARCHITECTURE

Evitar lógica TikTok espalhada pelo domínio.

Criar camada semelhante a:

/integrations/tiktok
/providers/tiktok

ou respeitar a arquitetura atual do projeto.

Sugestão conceitual:

TikTokOAuthService
TikTokCreatorService
TikTokContentService
TikTokCampaignService
TikTokAffiliateService
TikTokAdsService
TikTokEventsService
TikTokWebhookService

Mas adaptar ao padrão atual do repositório.

Não criar arquitetura paralela desnecessária.

---

26. NÃO QUEBRAR PRODUÇÃO

Antes de modificar:

1. analisar repositório;
2. identificar arquitetura existente;
3. identificar banco;
4. identificar ORM;
5. identificar autenticação;
6. identificar multi-tenancy;
7. identificar padrões de service/repository;
8. identificar event bus/jobs;
9. identificar migrations;
10. identificar testes.

Não duplicar infraestrutura existente.

Não alterar fluxos de checkout/pedido atualmente funcionais sem necessidade.

---

27. ETAPA DE IMPLEMENTAÇÃO AGORA

Neste momento NÃO tente construir toda a integração TikTok.

Primeiro faça um diagnóstico técnico do repositório.

Depois implemente a FUNDAÇÃO.

Prioridade:

FASE 1

Creator
CreatorChannel
CreatorTenantRelationship
CreatorCampaign
CreatorCampaignProduct
CreatorCampaignMember
TrackingLink
TrackingClick
OrderAttribution
CommissionRule
CommissionEntry
CreatorSampleRequest
IntegrationConnection

Ajustar nomes para o padrão existente.

FASE 2

Painel inicial:

Creator Hub
├── Overview
├── Creators
├── Campaigns
├── Samples
├── Commissions
└── Integrations

FASE 3

TikTok OAuth básico.

FASE 4

Tracking + atribuição de pedidos.

FASE 5

Pixel / Events API.

FASE 6

TikTok One / Creator APIs.

FASE 7

TikTok Shop Affiliate APIs opcionais.

---

28. PRIMEIRA TAREFA

Agora:

1. inspecione o código atual;
2. identifique onde esses módulos devem entrar;
3. mostre a arquitetura existente relevante;
4. liste entidades existentes que podem ser reutilizadas;
5. identifique conflitos de nomenclatura;
6. proponha modelo de dados mínimo;
7. proponha migrations;
8. proponha rotas/API;
9. proponha estrutura de UI;
10. proponha etapas de implementação.

Depois disso:

implemente somente a fundação necessária para o Creator Hub, sem ainda adicionar integrações externas reais que dependam de credenciais.

Não invente respostas de APIs do TikTok.

Quando alguma capacidade depender de documentação, marcar claramente:

CONFIRMADO
PRECISA VALIDAR
TIKTOK SHOP DEPENDENT
TIKTOK ONE DEPENDENT
ADS DEPENDENT

Ao final, mostrar:

ARQUIVOS CRIADOS
ARQUIVOS ALTERADOS
MIGRATIONS
ROTAS
MODELOS
TESTES
PENDÊNCIAS
PRÓXIMA ETAPA

Objetivo de longo prazo:

transformar a NextLevel Commerce em uma plataforma de e-commerce com uma camada nativa de Creator Commerce, onde lojistas possam descobrir creators, criar campanhas, enviar produtos/amostras, publicar conteúdos, gerar tráfego, rastrear vendas e administrar comissões sem depender de vender dentro do TikTok Shop.
