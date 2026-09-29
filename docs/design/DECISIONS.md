# Decisões de design e produto

Registro de decisões tomadas durante a evolução visual. As decisões D1 a D7 do prompt foram aceitas pelo dono e valem como estão. Abaixo, o que foi decidido além delas.

## Geral

- **E1.** Nenhum material da Natural GO foi entregue. A linguagem visual parte dos princípios descritos e evolui neles, sem afirmar cópia de nada.
- **E2.** Temas por painel são aplicados por atributo `data-panel` no contêiner do shell. O atributo troca acento, densidade e raio, sem duplicar componentes.
- **E3.** Modo claro e escuro completos. A preferência fica em `localStorage` (`nl-theme`) e respeita `prefers-color-scheme` quando não há escolha. Um script inline evita o flash de tema.
- **E4.** Fontes locais do sistema como base, com uma família de exibição carregada de forma segura para build offline. Nada depende de rede em runtime.
- **E5.** A paleta de gráficos continua validada pelo script do skill dataviz, com legenda e visão em tabela.

## Domínio

- **E6.** O livro-razão da recarga registra saldo por par fornecedor e lojista. O saldo é uma coluna derivada e conferida contra a soma das entradas em teste.
- **E7.** O débito do pedido usa bloqueio de linha na conta (`FOR UPDATE`), o que evita gasto duplo em transações concorrentes.
- **E8.** Pedido sem saldo permanece em `AWAITING_CENTRAL_PAYMENT`, exibido como "Aguardando recarga". O prazo de 72 h vira configuração do fornecedor.
- **E9.** Etiquetas ficam no banco atrás de `LabelStorage`, trocável por S3 sem mudar o domínio.
- **E10.** O papel de expedição recebe um DTO sem nenhum campo monetário. Um teste varre as chaves da resposta.
- **E11.** Gates por oferta vivem em `OFFER_FEATURES` e são validados no domínio, não só na interface.
- **E12.** O checkout de serviços fica como registro de intenção, como definido. O pedido e o pipeline funcionam de ponta a ponta.

## D8. Cobrança da NextLevel e add-ons (U1)
- Faturas próprias (setup, mensalidade, fechamento, add-ons, serviços) são pagas por Pix na conta Mercado Pago da NextLevel (`platform_settings.nextlevel_mp`, token criptografado). Webhook consulta a API, confere referência e valor e quita a fatura de forma idempotente.
- Add-ons (Academy do lojista, Suporte Premium, Relatórios avançados, Assento extra de expedição) viram `entitlements` quando a fatura é paga; renovar soma o período. Preços em `price-book.addons` (propostas, marcadas "a validar").
- O racional de cada preço é gerado a partir da tabela vigente (`rationale.ts`), com economia unitária e alerta de margem abaixo da meta.
- `domain_events` (com `dedupeKey`) registra fatos relevantes; automações e fila do dia (U7) leem daí.
- Régua de cobrança: aviso in-app em D-3, D0, D+3, D+7 do vencimento, uma vez por fatura e marco.

## D9. Esteira, corte e expedição (U2)
- O horário de corte é por fornecedor e por dia da semana, com fuso e feriados (`supplier_ops`). Pedido liberado (custo debitado) antes do corte sai no mesmo dia; depois, no próximo dia útil. A lógica é pura (`cutoff.ts`) e testada nas bordas (corte exato, virada de dia local, feriado, fim de semana).
- Esteira ao vivo: SSE em `/api/live/orders` (encerra em ~4 min e o cliente reconecta) com fallback de polling a cada 8 s. A "versão" é um resumo de pedidos, claims, ondas e impressões do fornecedor.
- Um funcionário por pedido: `order_claims` (uma linha por pedido, expira em 30 min). O gestor pode liberar.
- Onda = conjunto de pedidos prontos com etiqueta, impresso junto: um PDF único de etiquetas e uma lista de separação agrupada por produto e variação.
- A expedição usa uma esteira sem qualquer campo monetário (teste varre as chaves do DTO) e não vê pedidos aguardando recarga ou etiqueta.
- Assentos de expedição: 2 na base, +1 por add-on `EXTRA_DISPATCH_SEAT` ativo.
- A antiga tela `/supplier/shipping` redireciona para `/supplier/dispatch`.
