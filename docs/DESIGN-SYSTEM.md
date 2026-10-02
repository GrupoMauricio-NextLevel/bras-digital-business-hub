# NextLevel Design System — System Redesign

## Direção
Uma plataforma operacional premium, com identidade de ferramenta de trabalho. A linguagem visual deve transmitir controle, precisão, velocidade e confiança.

## Foundations

### Superfícies
- background: canvas geral
- surface: conteúdo principal
- raised: elemento elevado
- sunken: área embutida
- surface-muted: agrupamento leve
- surface-hover: interação
- border / border-strong: estrutura

### Cores semânticas
Nunca usar cor de marca como significado de status.
- success
- warning
- danger
- info
- neutral

### Tipografia
- Display: somente comunicação institucional e momentos especiais.
- Headline: páginas de alto nível.
- Title: seções.
- Body: padrão operacional.
- Caption: metadados.
- Numeric: valores, quantidades, SKU e métricas com `tabular-nums`.

### Densidade
- comfortable: onboarding/configuração
- default: dashboards
- compact: listas, catálogos, estoque e financeiro

### Raio e elevação
- bordas e superfícies primeiro
- sombra somente para hierarquia real
- evitar “card em tudo”

## Anatomia das páginas
1. ContextHeader
2. OperationalPulse quando fizer sentido
3. ActionQueue quando houver pendências
4. métricas realmente necessárias
5. conteúdo operacional
6. atividade/histórico

## Componentes-assinatura

### ActionQueue
Fila ordenada por prioridade, cada item com:
- título humano
- contexto
- severidade
- quantidade opcional
- CTA direto

### OperationalPulse
Faixa discreta com 3–5 sinais sempre visíveis:
- vendas hoje
- pedidos travados
- saldo
- saúde
- expedição

### EntityHeader
Cabeçalho reutilizável para fornecedor, loja, pedido, cliente e produto.

### OperationalQueue
Lista de trabalho mais densa que cards e mais orientada a ação que tabela genérica.

## AppShell
Preservar:
- sidebar desktop
- drawer mobile
- busca global
- Ctrl+K
- notificações
- theme toggle

Evoluir:
- contexto de produto/vertical
- breadcrumb sem poluição
- ações globais
- melhor distinção entre tenant, papel e produto

## Assinatura visual por contexto
Compartilhar anatomia e tokens; variar somente o acento contextual.

Master: governança e controle.
Commerce: infraestrutura e motor.
SuperDrop: logística e distribuição.
Brás Digital: B2B/atacado.
Creators Hub: campanhas e conversão.
China Hub: importação/distribuição.

## Acessibilidade
- alvo de toque >= 44 px em fluxos touch
- foco visível
- aria-live em dados ao vivo
- reduced motion
- contraste WCAG
- ícone/texto além de cor em status

## Performance
- Server Components por padrão
- Client Components apenas onde necessário
- sem nova biblioteca visual pesada
- sem animações que afetem operação
