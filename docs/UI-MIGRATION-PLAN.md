# UI Migration Plan — NextLevel Ecosystem

## Estratégia
Migrar por fundação e fluxos, não por “página bonita”.

## Fase 0 — Auditoria
Status: DONE
- inventário de 114 páginas
- leitura do design v3
- leitura do AppShell e primitives
- identificação de riscos
- definição da anatomia alvo

## Fase 1 — Foundation
Status: IN_PROGRESS

Entregue:
- ActionQueue / Fila do Dia
- OperationalPulse / Pulso Operacional
- showcase v4 em /dev/design
1. consolidar tokens existentes
2. introduzir ActionQueue
3. introduzir OperationalPulse
4. revisar PageHeader/SectionTitle
5. documentar densidade e estados
6. ampliar /dev/design para QA visual

## Fase 2 — AppShell
Status: IN_PROGRESS

Entregue:
- breadcrumb operacional automático tenant → tela atual
- contexto produto/vertical
- tenant/papel mais claros
- navegação mobile
- breadcrumb contextual
- ações rápidas

## Fase 3 — SuperDrop
Status: IN_PROGRESS
Ordem:
1. Supplier Home — DONE
2. Dispatch — DONE
3. Supplier Orders
4. Supplier Products
5. Inventory
6. Stores
7. Wallets
8. Finance
9. Merchant Home — DONE
10. Merchant Orders
11. Merchant Wallet
12. Products/Catalog
13. Storefront
14. Customers
15. Analytics
16. After Sales
17. Settings

## Fase 4 — Master
Status: TODO
Transformar em control center:
- alertas
- saúde do ecossistema
- receita em risco
- organizações
- operação
- atividade

## Fase 5 — Commerce
Status: BLOCKED UNTIL LOGICAL INTEGRATION
A interface de Commerce deve ser construída sobre a arquitetura multi-produto consolidada.

## Fase 6 — Verticais
Status: BLOCKED UNTIL LOGICAL INTEGRATION
- Brás Digital
- Creators Hub
- China Hub

## Política de segurança
- branch exclusiva de design
- nada em Render/produção durante desenvolvimento
- commits pequenos
- preservar código recente do Claude
- nenhuma alteração de regra financeira, estoque ou pedidos por conveniência visual

## Definition of Done
Cada etapa só termina com:
- desktop + mobile
- light + dark
- loading + empty + error
- teclado e foco
- sem overflow
- sem regressão funcional
- revisão em /dev/design ou baseline e2e
