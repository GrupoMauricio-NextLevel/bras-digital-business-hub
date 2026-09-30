<!-- Prompt original do MVP (primeira sessão). A seção 5 (DESIGN) e a 6 (DESIGN SYSTEM) são a origem da linguagem visual. -->

# NEXTLEVEL COMMERCE ENGINE — MVP FUNCIONAL
# Projeto inicial: SuperDrop
# Empresa: NextLevel Marketing Ltda.

Você atuará como ARQUITETO DE SOFTWARE + SENIOR FULL-STACK ENGINEER + PRODUCT DESIGNER.

Sua missão é criar um MVP FUNCIONAL, navegável e visualmente profissional ainda nesta sessão.

IMPORTANTE:
Não quero apenas documentação, wireframes ou páginas estáticas.
Quero um sistema executável localmente, com banco, autenticação, dados de demonstração e os principais fluxos funcionando.

============================================================
1. VISÃO DO PRODUTO
============================================================

Estamos construindo a fundação de uma plataforma própria de e-commerce da:

NextLevel Marketing Ltda.

O motor interno deve ser tratado conceitualmente como:

NEXTLEVEL COMMERCE ENGINE

O primeiro produto comercial construído sobre esse motor será:

SUPERDROP

A arquitetura futura deverá permitir que o mesmo núcleo seja utilizado para:

1. SuperDrop
2. SuperDrop White Label
3. lojas virtuais individuais NextLevel
4. Theme Store / Templates Premium
5. Marketplace interno de serviços NextLevel
6. Brás Digital
7. futuras verticais de comércio digital

NÃO criar sistemas independentes para cada produto.

Precisamos de UM CORE multi-tenant.

============================================================
2. OBJETIVO DO MVP DE HOJE
============================================================

Não tente construir a plataforma definitiva.

O objetivo desta versão é provar funcionalmente:

FORNECEDOR
    ↓
CATÁLOGO CENTRAL
    ↓
REDE DE LOJISTAS
    ↓
LOJA WHITE LABEL
    ↓
CLIENTE FINAL
    ↓
PEDIDO
    ↓
FORNECEDOR / CENTRAL
    ↓
EXPEDIÇÃO

Precisamos conseguir demonstrar visualmente esse ciclo.

O MVP deve parecer um produto real, e não um painel administrativo genérico ou um protótipo acadêmico.

============================================================
3. PRINCÍPIO ARQUITETURAL
============================================================

Criar arquitetura multi-tenant desde o primeiro commit.

Entidades conceituais diferentes:

NEXTLEVEL
ORGANIZATION
SUPPLIER
NETWORK
STORE
USER
CUSTOMER

Não confundir:

fornecedor
lojista
loja
usuário
cliente final

Um fornecedor pode futuramente possuir uma rede com centenas de lojas.

Uma loja pertence a uma organização/rede conforme as regras de acesso.

Produtos podem futuramente ser:

PRIVATE_NETWORK
SHARED_NETWORK
PUBLIC_NETWORK

No MVP não precisamos implementar toda a complexidade futura, mas o schema NÃO deve impedir essa evolução.

Todo acesso deve respeitar tenant/organization/store.

Nunca permitir vazamento de dados entre lojistas.

============================================================
4. STACK
============================================================

Use preferencialmente:

Next.js atual com App Router
React
TypeScript
Tailwind CSS
shadcn/ui ou componentes equivalentes
Lucide Icons
Drizzle ORM

Para banco:

priorize uma solução que permita entregar o MVP funcional rapidamente.

Se o ambiente já estiver configurado com Cloudflare D1, use D1.

Caso contrário, para desenvolvimento local, SQLite + Drizzle é aceitável.

Organize o código para permitir migração futura para uma infraestrutura de produção mais robusta sem reescrever regras de negócio.

Não introduza tecnologias desnecessárias.

============================================================
5. DESIGN — PRIORIDADE ALTÍSSIMA
============================================================

Quero uma experiência comparável em organização e simplicidade aos melhores SaaS modernos de e-commerce.

REFERÊNCIA CONCEITUAL:
Shopify.

NÃO copiar Shopify visualmente.

NÃO copiar código, componentes proprietários ou identidade.

Quero aprender com os princípios:

- simplicidade
- hierarquia
- navegação previsível
- excelente tipografia
- espaços generosos
- baixa carga cognitiva
- ações principais muito claras
- excelente experiência mobile
- progressive disclosure
- dashboards orientados a ação

A experiência anterior do projeto Natural GO deve servir como aprendizado:

- Next.js
- React
- TypeScript
- Tailwind
- componentes reutilizáveis
- cards claros
- dashboards objetivos
- ações rápidas
- boa experiência mobile

MAS:

NÃO reutilizar identidade visual da Natural GO.

Este é um produto totalmente novo.

Evitar:

- gradientes exagerados
- excesso de glassmorphism
- sombras exageradas
- dezenas de gráficos inúteis
- visual futurista genérico de IA
- excesso de cores
- cards demais
- aparência de template administrativo barato

Quero um SaaS comercial sério.

============================================================
6. DESIGN SYSTEM
============================================================

Crie um design system central.

Defina:

Typography
Spacing
Radius
Borders
Surfaces
Background
Primary
Secondary
Success
Warning
Danger
Muted
Interactive states

Criar componentes reutilizáveis:

AppShell
Sidebar
Topbar
PageHeader
Card
MetricCard
StatusBadge
DataTable
EmptyState
SearchInput
FilterBar
Drawer
Modal
Tabs
FormField
ActionMenu
ConfirmationDialog
Toast
Skeleton

Desktop e mobile devem compartilhar o mesmo sistema.

============================================================
7. PERFIS DO MVP
============================================================

Implementar três experiências.

--------------------------------
A. NEXTLEVEL MASTER
--------------------------------

Controle global.

Dashboard deve mostrar:

- total de fornecedores
- total de lojas
- lojas ativas
- lojas suspensas
- pedidos
- GMV de demonstração
- receita estimada da plataforma
- atividades recentes

Áreas:

Dashboard
Fornecedores
Redes
Lojas
Catálogo
Pedidos
Templates
Serviços
Planos
Configurações

--------------------------------
B. FORNECEDOR / CENTRAL
--------------------------------

Dashboard do fornecedor.

Mostrar:

- vendas
- pedidos
- lojas da rede
- produtos
- estoque
- pedidos aguardando ação
- pedidos prontos para expedição

Áreas:

Início
Produtos
Estoque
Pedidos
Lojistas
Expedição
Financeiro
Conteúdo
Configurações

--------------------------------
C. LOJISTA
--------------------------------

Essa experiência merece atenção especial.

É onde estará grande parte do valor comercial futuro.

Menu:

Início
Pedidos
Produtos
Clientes
Loja Virtual
Aparência
Templates
Conteúdo
Serviços NextLevel
Financeiro
Configurações

Home deve responder imediatamente:

Como está minha loja?
Quanto vendi?
Tenho pedidos?
Existe alguma pendência?
O que preciso fazer agora?

============================================================
8. ONBOARDING DO LOJISTA
============================================================

Criar checklist visual:

"Sua loja está 60% pronta"

Etapas:

[ ] Dados da loja
[ ] Adicionar logo
[ ] Escolher cores
[ ] Configurar pagamentos
[ ] Configurar frete
[ ] Conectar domínio
[ ] Publicar loja

No MVP:

as integrações externas podem usar estado de demonstração.

NÃO precisamos conectar Mercado Pago ou transportadoras reais hoje.

Mas a interface e o modelo de dados precisam existir.

============================================================
9. CATÁLOGO CENTRAL
============================================================

O fornecedor cadastra o produto uma vez.

Campos mínimos:

name
slug
description
SKU
category
images
cost
suggestedPrice
minimumPrice
stock
status

Variantes:

size
stock

Produtos de camisas esportivas precisam suportar:

VENDA UNITÁRIA

e

GRADE DE 12 PEÇAS DO MESMO MODELO.

Criar estrutura de:

pack / grade

Exemplo:

Grade 12 peças

P: 2
M: 4
G: 4
GG: 2

Não hardcode essa distribuição.
Deve ser configurável.

============================================================
10. ESTOQUE CENTRAL
============================================================

Existe um estoque físico central.

Não criar estoque duplicado para cada loja.

Modelar:

on_hand
reserved
available

available = on_hand - reserved

Pedidos devem poder reservar estoque.

Cancelamento/expiração deve permitir devolver a reserva.

Não permitir estoque negativo silenciosamente.

Criar histórico básico de movimentação:

IN
RESERVE
RELEASE
SALE
ADJUSTMENT

============================================================
11. DISTRIBUIÇÃO DE PRODUTOS
============================================================

O fornecedor deve conseguir definir quais lojas podem vender determinado produto.

Preparar:

ALL_NETWORK

SELECTED_STORES

Futuramente teremos catálogo compartilhado entre fornecedores.

Não precisamos implementar toda essa rede compartilhada hoje.

Mas NÃO crie um schema que torne isso impossível.

============================================================
12. LOJA WHITE LABEL
============================================================

Cada lojista recebe uma storefront própria.

No MVP:

usar rota semelhante a:

/store/[slug]

Exemplo:

/store/mantos-shop

Criar um storefront realmente bonito.

Páginas mínimas:

Home
Catálogo
Produto
Carrinho
Checkout demonstrativo
Pedido concluído

A loja deve carregar dinamicamente:

logo
nome
cores
banners
produtos
preços
configurações

Não criar uma página diferente manualmente para cada loja.

============================================================
13. TEMPLATE ENGINE
============================================================

Isso é MUITO IMPORTANTE.

Conteúdo deve ser separado do layout.

Criar estrutura conceitual:

Theme
ThemeVersion
StoreTheme
ThemeSettings

O MVP terá:

STARTER

gratuito e padrão.

Criar também cards de demonstração para:

PRO
ELITE

Eles podem aparecer bloqueados/pagos.

Precisamos demonstrar que o lojista poderá comprar outro template sem perder:

produtos
clientes
pedidos
configurações

============================================================
14. NEXTLEVEL THEME STORE
============================================================

Criar página:

Templates

Apresentar os temas visualmente como produtos.

Cada card deve ter:

preview
nome
nível
recursos
preço
"Visualizar"
"Comprar/Ativar"

No MVP somente Starter precisa funcionar completamente.

Pro e Elite podem ser demonstrações visuais.

A arquitetura deve permitir futuramente comercializar versões desses templates também para WBuy, mas NÃO implementar integração WBuy agora.

============================================================
15. PEDIDOS
============================================================

Criar fluxo funcional.

Cliente realiza pedido na storefront.

Pedido aparece para:

LOJISTA

e

FORNECEDOR/CENTRAL

sem permitir que outros lojistas enxerguem esse pedido.

Estados iniciais:

PENDING
AWAITING_CENTRAL_PAYMENT
AWAITING_LABEL
READY_TO_PICK
PICKING
READY_TO_SHIP
SHIPPED
DELIVERED
CANCELED

============================================================
16. FINANCEIRO — MVP
============================================================

NÃO IMPLEMENTAR SPLIT.

Modelo futuro:

Cliente
→ conta do lojista

Lojista
→ paga custo do produto à Central

Para o MVP:

simular os estados financeiros.

Criar:

customerPaymentStatus
centralPaymentStatus

Botão demonstrativo:

"Confirmar pagamento à Central"

Quando confirmado:

atualizar status do pedido.

A arquitetura deve permitir integração futura com Mercado Pago.

============================================================
17. FRETE
============================================================

No modelo real:

lojista gera/paga etiqueta usando SuperFrete ou Melhor Envio.

Depois envia a etiqueta para a Central.

No MVP:

permitir upload/registro demonstrativo de etiqueta.

Pedido não fica READY_TO_PICK até:

centralPaymentStatus = PAID

e

shippingLabelStatus = READY

============================================================
18. VENDA MANUAL
============================================================

Criar:

"+ Novo Pedido"

no painel do lojista.

Permitir criar pedido originado de:

ONLINE_STORE
WHATSAPP
INSTAGRAM
MANUAL

Todos usam o mesmo catálogo e estoque.

Isso é importante porque nosso público já vende muito pelo WhatsApp.

============================================================
19. VAREJO + ATACADO
============================================================

Preparar estrutura para:

RETAIL
WHOLESALE

Permitir produto unitário e grade.

Não construir ERP B2B completo.

Apenas fundação.

============================================================
20. MENSALIDADE DA LOJA
============================================================

Criar estrutura:

Subscription
Plan
Invoice

Criar planos fictícios para demonstração.

Exibir no painel:

plano atual
valor
próximo vencimento
status

Regras futuras:

15 dias de inadimplência
→ SUSPENDED

30 dias
→ CLOSED

Dados administrativos permanecem disponíveis para a NextLevel conforme políticas aplicáveis.

No MVP não precisamos construir cobrança recorrente real.

============================================================
21. SUPERDROP — MODELO COMERCIAL
============================================================

Preparar o sistema para dois modelos.

SUPERDROP

Fornecedor entra com baixa barreira.

Modelo comercial inicialmente planejado:

0 setup
+
6% do faturamento bruto

WHITE LABEL

Fornecedor recebe ambiente com sua própria marca.

Modelo comercial inicialmente planejado:

R$ 6.000 setup
+
3% do faturamento bruto

Não implementar cobrança percentual automática agora.

Apenas preparar entidades/configurações:

businessModel
platformFeePercent
setupFee

============================================================
22. MARKETPLACE NEXTLEVEL
============================================================

Essa é uma área estratégica.

Criar dentro do painel do lojista:

"Serviços NextLevel"

Cards iniciais de demonstração:

Template Premium
Identidade Visual
Banners
Conteúdo para Redes Sociais
Tráfego Pago
Automação WhatsApp
Configuração Profissional
Suporte Premium

No MVP:

não precisamos construir checkout desses serviços.

Botão:

"Tenho interesse"

pode criar um registro:

ServiceLead

para demonstrar a oportunidade comercial.

============================================================
23. CENTRAL DE CONTEÚDO
============================================================

Criar página simples:

Conteúdo

Categorias:

Produtos
Stories
Banners
Reels
Campanhas

Usar dados de demonstração.

Não implementar geração por IA agora.

============================================================
24. BRÁS DIGITAL
============================================================

NÃO desenvolver Brás Digital nesta primeira entrega.

Porém, documentar no README/ARCHITECTURE que o mesmo Commerce Engine futuramente sustentará:

marketplace atacadista
fornecedores
catálogos
grades
lojas
SuperDrop

Não criar outro core para isso.

============================================================
25. DADOS E PRIVACIDADE
============================================================

Não implementar uma regra simplista de que todos os dados dos consumidores podem ser usados indiscriminadamente.

Modelar separadamente:

Customer
StoreCustomer
MarketingConsent

Preparar consentimentos com:

purpose
source
grantedAt
revokedAt

O acesso operacional da plataforma deve ser separado das permissões de marketing.

Isso facilitará adequação futura à LGPD.

============================================================
26. DEMO DATA
============================================================

Criar seed convincente.

NEXTLEVEL MASTER

1 fornecedor:
"Central Sports"

3 lojas:

Mantos Shop
Arena 10
Fut Classics

Criar aproximadamente:

12 produtos
variantes P/M/G/GG
alguns produtos com grade de 12
estoque
clientes
8-15 pedidos
diferentes status
algumas atividades recentes

Usar nomes e dados fictícios.

Não usar dados pessoais reais.

============================================================
27. DEMO MODE
============================================================

Quero conseguir apresentar o sistema imediatamente.

Criar maneira simples de alternar entre:

NextLevel Master
Fornecedor
Lojista Mantos Shop
Lojista Arena 10

Pode existir temporariamente:

"Demo Role Switcher"

visível apenas em development/demo.

Isso será extremamente útil para apresentação.

============================================================
28. EXPERIÊNCIA DE DEMONSTRAÇÃO
============================================================

Ao abrir o sistema eu preciso conseguir demonstrar:

1. entrar como NextLevel
2. visualizar fornecedores e lojas
3. entrar no fornecedor
4. visualizar catálogo/estoque
5. visualizar sua rede
6. entrar como lojista
7. ver dashboard
8. personalizar nome/logo/cor
9. visualizar template
10. abrir storefront
11. realizar pedido
12. pedido aparecer no painel
13. confirmar pagamento Central
14. adicionar etiqueta
15. pedido ficar pronto para separação
16. visualizar serviço NextLevel
17. visualizar templates premium

Esse é o "golden path" do MVP.

PRIORIZE ESSE CAMINHO.

============================================================
29. RESPONSIVIDADE
============================================================

Obrigatório testar:

Desktop
Tablet
Mobile

Sidebar deve virar navegação apropriada em telas pequenas.

Tabelas complexas devem ter alternativa mobile.

Storefront deve ser excelente no celular.

============================================================
30. QUALIDADE
============================================================

Use:

TypeScript estrito
schemas/validation
componentização
server/client components corretamente
tratamento de erros
loading states
empty states
error states
toasts
confirmação para ações destrutivas

Evite:

any desnecessário
arquivos gigantes
duplicação
estado global desnecessário
business logic dentro de componentes visuais

============================================================
31. TESTES
============================================================

Criar testes pelo menos para regras críticas:

isolamento multi-tenant
estoque disponível
reserva de estoque
liberação de reserva
pedido
transição crítica de status
regra pagamento + etiqueta
permissões

Não precisamos buscar cobertura artificial de 100%.

Teste as regras que podem causar prejuízo.

============================================================
32. NÃO IMPLEMENTAR AGORA
============================================================

NÃO perder tempo hoje com:

integração real Mercado Pago
split
SuperFrete real
Melhor Envio real
WhatsApp API
Meta API
Instagram API
Google Ads
marketplaces
IA
CRM completo
fidelidade
ERP completo
NF-e
contabilidade
BI avançado
aplicativo nativo
microservices
Kubernetes
infraestrutura excessivamente complexa

Crie interfaces/adapters onde necessário.

Não implemente essas integrações.

============================================================
33. ORDEM DE EXECUÇÃO
============================================================

Diferentemente de um projeto apenas conceitual:

VOCÊ ESTÁ AUTORIZADO A IMPLEMENTAR.

Não pare após criar arquitetura.

Faça:

ETAPA 1
Inspecione o ambiente/repositório existente.

ETAPA 2
Se estiver vazio, inicialize o projeto.

ETAPA 3
Crie ARCHITECTURE.md resumindo decisões importantes.

ETAPA 4
Implemente schema/banco/migrations/seed.

ETAPA 5
Implemente design system e AppShell.

ETAPA 6
Implemente autenticação/demo roles e isolamento.

ETAPA 7
Implemente Master.

ETAPA 8
Implemente Fornecedor.

ETAPA 9
Implemente Lojista.

ETAPA 10
Implemente storefront.

ETAPA 11
Implemente golden path do pedido.

ETAPA 12
Implemente Theme Store e Serviços NextLevel.

ETAPA 13
Adicione testes.

ETAPA 14
Execute:

lint
typecheck
tests
build

Corrija os erros encontrados.

============================================================
34. REGRA DE PRIORIZAÇÃO PARA HOJE
============================================================

Se não houver tempo para tudo:

NÃO deixe 30 telas pela metade.

Priorize:

1. arquitetura multi-tenant correta
2. design system excelente
3. Master funcional
4. Fornecedor funcional
5. Lojista funcional
6. storefront bonita
7. pedido ponta a ponta funcionando
8. estoque central
9. pagamento Central simulado
10. etiqueta simulada
11. Theme Store demonstrável
12. Marketplace NextLevel demonstrável

Uma experiência pequena e excelente é melhor que uma plataforma enorme quebrada.

============================================================
35. AUTONOMIA
============================================================

Não me interrompa a cada pequena decisão técnica.

Tome decisões razoáveis de engenharia e registre as importantes em ARCHITECTURE.md.

Só pare para perguntar se existir:

- risco de apagar dados existentes
- necessidade de credencial/secreto
- ação irreversível
- conflito grave com código existente
- decisão comercial que mude materialmente o produto

Caso contrário:

continue trabalhando.

============================================================
36. PROTEÇÃO DE PROJETOS EXISTENTES
============================================================

ATENÇÃO:

NÃO modificar, publicar ou reutilizar banco de produção da Natural GO.

NÃO alterar projetos existentes da NextLevel sem necessidade.

Este projeto deve possuir:

banco próprio
variáveis próprias
ambiente próprio
deploy próprio

Não colocar secrets diretamente no código.

============================================================
37. DEFINIÇÃO DE PRONTO — MVP
============================================================

Considerar esta primeira entrega pronta quando:

- projeto inicia sem erro
- banco e seed funcionam
- Master abre
- fornecedor abre
- lojista abre
- tenants estão isolados
- produtos aparecem corretamente
- estoque funciona
- storefront abre
- carrinho funciona
- pedido pode ser criado
- pedido aparece para o lojista correto
- fornecedor recebe o pedido correto
- pagamento Central pode ser simulado
- etiqueta pode ser registrada
- status operacional avança
- templates aparecem
- serviços NextLevel aparecem
- experiência mobile funciona
- lint passa
- typecheck passa
- testes críticos passam
- build de produção passa

============================================================
38. ENTREGA FINAL
============================================================

Ao terminar, me entregue um relatório curto contendo:

IMPLEMENTADO
PENDENTE
ARQUITETURA
ROTAS
USUÁRIOS/ACESSOS DEMO
COMO RODAR
TESTES
LIMITAÇÕES DO MVP
PRÓXIMOS 5 PASSOS RECOMENDADOS

Não me entregue um relatório enorme.

Quero conseguir ABRIR E TESTAR O PRODUTO.

============================================================
COMECE AGORA
============================================================

Primeiro inspecione o repositório e ambiente.

Depois implemente imediatamente.

Não fique apenas me explicando o que pretende fazer.

O objetivo desta sessão é sair com um MVP funcional e demonstrável do:

NEXTLEVEL COMMERCE ENGINE / SUPERDROP.
