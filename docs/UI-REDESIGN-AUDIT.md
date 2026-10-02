# UI Redesign Audit — NextLevel Ecosystem

Data: 2026-10-02
Branch: `design/system-redesign-20261002`

## Objetivo
Evoluir a UI existente para um sistema SaaS premium e operacional, preservando domínio, dados, autenticação, permissões e fluxos de negócio.

## Inventário real
Foram identificadas 114 páginas no App Router:
- Master: 20
- Supplier: 27
- Merchant: 32
- Partner: 6
- Storefront: 8
- Portal público: 12
- Auth/account: 5
- Dev/design: 1
- Outras: 3

## Base já existente e que deve ser preservada
- Design system v3 com tokens semânticos em `globals.css`.
- Light/dark mode.
- Climas por painel via `data-panel`.
- AppShell compartilhado com sidebar, busca global, Ctrl+K, notificações e mobile drawer.
- DataTable responsiva que vira cards em mobile.
- MetricCard, StatusBadge, EmptyState, Stepper, Timeline e FeatureGate.
- Baselines visuais em 390/768/1024/1440.
- Rota `/dev/design` para QA do sistema visual.
- Documentação visual existente em `docs/design/`.

## Problema central
A base técnica é boa, mas a experiência ainda é orientada demais a “telas e cards”. O próximo nível deve orientar o usuário por situação, prioridade e ação.

A home ideal responde:
1. O que está acontecendo?
2. O que está travado?
3. O que precisa da minha ação?
4. Qual é a próxima decisão?
5. Onde vejo o detalhe?

## Princípios aprovados
- Uma única família visual NextLevel.
- Verticais com contexto e acento próprios, não sistemas independentes.
- “Mesa do atacadista”: ferramenta de trabalho, não landing page.
- Papel + tinta + uma cor de sinal; sem gradiente gratuito.
- Menos cards decorativos; mais filas, listas, documentos e estados.
- Valores e quantidades com numerais tabulares.
- Mobile operacional como requisito de primeira classe.
- Nenhuma regra de negócio em componentes de apresentação.

## Componentes prioritários
### Manter e evoluir
- AppShell
- PageHeader
- MetricCard
- DataTable
- StatusBadge
- EmptyState
- Stepper/Timeline
- CommandPalette
- Notifications

### Criar
- ActionQueue / Fila do Dia
- OperationalPulse / Pulso Operacional
- ContextHeader
- EntityHeader
- BulkActionBar
- OperationalQueue
- StatTrend
- ResponsiveActionBar

## Auditoria por superfície
| Superfície | Estado atual | Alvo | Prioridade | Risco |
|---|---|---|---|---|
| Master | funcional, bastante dashboard | control center executivo | P1 | médio |
| Supplier home | esteira já forte | centro operacional do dia | P0 | alto |
| Dispatch | modo dedicado já existe | operação touch-first | P0 | alto |
| Merchant home | boa base saldo/ação | decisão em poucos segundos | P0 | alto |
| Merchant orders | funcional | fila clara + ações rápidas | P0 | alto |
| Merchant wallet | funcional | saldo e recarga como ação | P0 | alto |
| Supplier products/inventory | funcional | densidade operacional | P1 | médio |
| Finance | completo, denso | hierarquia e explicabilidade | P1 | médio |
| Storefront/editor | rico | qualidade tipo Shopify | P2 | médio |
| Portal | já trabalhado | consistência de marca | P2 | baixo |
| Partner | funcional | mesma família visual | P3 | baixo |

## Riscos técnicos
- RoleLayout ainda resolve contexto visual por role legado; a integração futura com grants deve preservar o contrato do AppShell.
- Existem mudanças paralelas no Claude Code; nunca substituir arquivos sem ler HEAD atual.
- O storefront tem identidade própria do lojista e não deve herdar paleta dos painéis.
- Financeiro, estoque e pedidos não podem sofrer alterações de regra durante o redesign.
- Componentes client devem permanecer mínimos para não aumentar JS.

## Critério de conclusão por página
- shell e contexto corretos
- ação principal óbvia
- estado de atenção visível
- loading/empty/error
- 390/768/1024/1440
- light/dark
- teclado/foco
- nenhuma regra de domínio duplicada
- sem overflow horizontal
- sem cor como único indicador
