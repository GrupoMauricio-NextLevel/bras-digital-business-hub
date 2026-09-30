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

## D10. Rodada visual: portal, Lite, Pro e Loja NextLevel
- **Portal público** em `src/app/(portal)` (grupo de rotas): `/`, `/como-funciona`, `/fornecedores`, `/planos`, `/faq`. Conteúdo em `content.ts`, só com valores confirmados em `docs/PLANOS.md`; a mensalidade do membro fica sem preço até a decisão. Quem já tem sessão em `/` segue para o painel.
- **Lite (F6):** a home abre com o saldo e um botão dominante de recarga; se há pedidos pagos esperando saldo, mostra quanto falta.
- **Pro (F7):** `/merchant/analytics` (recurso `analytics`, com cartão de upgrade nas outras ofertas). Cálculo puro em `analytics.ts` (vendas, margem, ticket, canais, campeões, recorrência, comparação com os 30 dias anteriores). O editor de aparência ganha prévia em três larguras (computador, tablet 768 px, celular 390 px) para quem tem `appearanceAdvanced`.
- **Menu com cadeado:** itens do lojista cujo recurso a oferta não libera aparecem com cadeado (`MERCHANT_GATES` em `role-layout.tsx`), nunca escondidos.
- **Loja NextLevel (F8):** o pedido de serviço de ponta a ponta (`service_orders`) vale para lojista e fornecedor: catálogo por público, recomendações com motivo (`recommendServices`), pedido com briefing, andamento em cinco etapas e conversa. Master orça e conduz em `/master/services` e abre a conversa em `/master/services/[id]`. Upgrades para uma oferta que o lojista já tem não são oferecidos. O destaque "Recomendado para você" aparece nas telas iniciais do lojista e do fornecedor; o Master vê a fila no cartão "Loja NextLevel". O registro simples de "interesse" (`service_leads`) deixou de ser usado pela interface.
- **Verificação:** `e2e/visual-round.mjs` cobre portal, Lite, Pro, gate, prévia 390 px e o fluxo de serviço (lojista e fornecedor pedem, Master orça, lojista vê o orçamento).

## D11. Identidade visual SuperDrop
- Logo oficial em `public/brand/`: `superdrop-logo-light.png` (texto preto, para fundos claros), `superdrop-logo-dark.png` (texto branco com brilho, para fundos escuros), e os símbolos `superdrop-mark*.png`. O componente `Logo` (`src/components/brand/logo.tsx`) escolhe a versão pelo tema (`tone="auto"`) ou a fixa para fundos que não mudam (`on-dark`, `on-light`).
- Aplicada no cabeçalho, rodapé e destaques do portal; login; menu lateral (símbolo no topo, logo completa no rodapé; Master usa a versão escura); cabeçalho da expedição; página do fornecedor (rodapé "Tecnologia SuperDrop"); rodapé das lojas (só ofertas sem "sem selo SuperDrop", ou seja, fora da Loja Própria); página 404.
- Favicon (`src/app/icon.png`), ícone de celular (`apple-icon.png`) e imagem de compartilhamento (`opengraph-image.png`, 1200x630) usam a marca. O título das abas e a descrição padrão passaram a ser "SuperDrop".
- Não recebem a marca: etiquetas de transportadora (são do SuperFrete) e o painel do fornecedor, que continua com o nome do fornecedor no topo do menu.

## D12. Decisões do dono para o novo nível visual (v3)
- Aceitas as recomendações do racional (`docs/design/RACIONAL-VISUAL-V3.md`, seção 6): padrões de administração no estilo Polaris e arquitetura de temas Online Store 2.0, **sem depender de código ou serviço da Shopify**, com identidade própria; motor de temas em React com seções e blocos em JSON; portal e V0 antes do P1.
- **Temas:** Starter grátis (básico, mas melhor que o atual). **Três temas pagos, instalação com 1 clique: R$ 299, R$ 699 e R$ 1.499**, os mais próximos possível dos temas da Shopify. Compra por fatura Pix da NextLevel.
- **Conteúdo:** o dono fornece manualmente logos e fotos dos fornecedores. Até chegarem, os modelos usam conteúdo demonstrativo identificado.

## D13. V0: design system v3
- Componentes em `src/components/ds` (`Page`, `TwoColumn`, `Breadcrumbs`, `Banner`, `ContextualSaveBar`, esqueletos, `IndexList`, `MediaGallery`, campos: `ColorField`, `RangeField`, `SlugField`, `SearchPreview`, `RichTextLite`, `FontPicker`, `LinkPicker`, `ResourcePicker`, `KeyboardHint`) e lógica pura em `src/lib/ds` (cor e contraste, texto seguro, consulta de lista, fontes). Vitrine em `/dev/design`.
- **Acessibilidade verificada com axe** (WCAG A e AA) nos quatro climas e no tema escuro, com E2E em `e2e/design-v3.mjs`.
- **Correções de contraste encontradas pelo axe:** novo token `--on-accent` (texto sobre preenchimento de destaque; escuro no Master), `--danger-foreground`, `--link`; verde do Lite e da marca escurecido para `#0d803e` (branco sobre ele passa de 3,4 para 5,0); texto de destaque passou a usar `accent-foreground`; itens de menu e botões com preenchimento usam `on-accent`.
- **Defeito de tema corrigido:** no painel do fornecedor, no modo claro padrão, os tokens escuros de "destaque suave" eram aplicados por um seletor sem a proteção da preferência de tema escuro. Agora todos os painéis seguem o botão de tema e a preferência do sistema.
- Markdown leve (`renderMarkdownLite`) escapa todo HTML e só aceita links `http`, `https`, `mailto`, `tel` e caminhos: não há HTML vindo do usuário.
