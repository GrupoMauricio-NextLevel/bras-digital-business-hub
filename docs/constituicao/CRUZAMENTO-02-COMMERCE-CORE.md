# Cruzamento do 02 (Commerce Core) com o código (2026-10-03)

Legenda: ✔ cumpre · ◐ parcial · ✘ não cumpre · ? não verificado. Método: leitura do código; nenhum teste novo foi rodado.

## Achado novo e grave: estoque sem atomicidade (02 §29–34, Constituição arts. 10 e 23)
`src/lib/domain/inventory.ts`: `reserveStock` lê `inventory.reserved`, compara, e grava `reserved: row.reserved + quantity` **sem condição e sem trava de linha**. Só a carteira usa `FOR UPDATE` (`wallet.ts:23`). Duas compras simultâneas da última peça leem o mesmo saldo e ambas passam: **vende-se mais do que existe** (overselling), e o contador `reserved` perde uma das reservas. O mesmo padrão vale para `releaseStock`, `consumeReservation`, `receiveStock` e `adjustStock`. O 02 §34 proíbe exatamente "ler, comparar, atualizar depois". **Em produção, com clientes.** Não provado em corrida real (PGlite não prova); provado por leitura do código. Vira a **F1.0**, antes do número do pedido.

## Parte a parte
| Parte do 02 | Situação | Evidência e lacuna |
|---|---|---|
| I. Produto, variante, SKU (§3–8) | ✔ | `products`, `product_variants` (com `sku`, `size`, `position`). SKU por variante existe. Atributos além de tamanho (cor, material) não são modelados. |
| I. Status, publicação, categorias, coleções, tags, mídia (§9–13) | ◐ | Há status e categorias. Coleções existem nas seções do tema, não como entidade. Sem tags nem atributos filtráveis estruturados. |
| II. Experiência de compra: unitária, grade, mínimo, atacado (§14–20) | ✔ em grande parte | Grade (`product_packs`), preço por quantidade (`store_price_tiers`), pedido mínimo (`min_order_cents`). **Faltam** múltiplos obrigatórios (§19) e mínimo por produto ou variante (§18). |
| III. Dinheiro e preço (§21–24) | ✔ | Centavos inteiros; pedido guarda preço unitário, desconto, subtotal, frete e total. |
| III. Faixas, cupons, promoções (§25–28) | ◐ | Faixas e cupons (`coupons`/descontos) existem e são validados no servidor. Sem promoção automática com prazo e prioridade (§27–28) e sem restrição por produto, categoria ou cliente. |
| IV. Estoque: modelo e movimentos (§29–32) | ✘ | **Sem atomicidade** (acima). `inventory_movements` não guarda saldo antes e depois, motivo estruturado, quem fez, loja, correlação nem chave de idempotência. Tipos existentes: IN, RESERVE, RELEASE, SALE, ADJUSTMENT (faltam RETURN, CANCELLATION, DAMAGE, TRANSFER). |
| IV. Reserva (§33) | ◐ | Reserva por pedido com expiração (`reservation_expires_at`) e rotina de expiração. Sem vínculo com carrinho ou checkout. |
| IV. Produto sem estoque e "não controlado" (§35–36) | ✘ | Não há "não controla estoque": todo produto tem saldo numérico. |
| V. Carrinho (§37–41) | ✘ | O carrinho vive só no navegador (`localStorage`, `cart-context.tsx`). Não é entidade no servidor: sem revalidação persistida, sem política de mesclagem ao entrar. O servidor revalida preço e estoque ao criar o pedido (✔), mas o carrinho em si não é verdade do domínio. |
| VI. Checkout (§42–47) | ◐ | Servidor calcula preço, desconto, frete e total e não confia no navegador (✔, `createOrder`). **Sem idempotência de finalização**: enviar duas vezes cria dois pedidos. **Sem estado de checkout** (iniciado, aguardando pagamento, abandonado…). |
| VII. Cliente e endereço (§48–50) | ✔ em grande parte | `store_customers` separado do usuário; compra sem login; endereço copiado para o pedido. Consentimento de marketing separado. |
| VIII. Pedido (§51–57) | ◐ | Pedido central e itens com histórico (✔); estados semânticos (✔), mas a máquina mistura pagamento e envio (`AWAITING_LABEL`, `READY_TO_PICK`…), enquanto o 02 pede pagamento e fulfillment separados (§68). Transições com origem, ator e efeitos: parcial (`order-status.ts`). |
| IX. Pagamento (§58–63) | ✘/◐ | **Não há entidade de pagamento do pedido da loja**: só `payment_provider` e `payment_reference` no pedido, sem tentativas, sem estorno como entidade. Estorno hoje é `customer_payment_status = REFUNDED` (o 02 §63 proíbe exatamente isso). Webhook: ✔ confere na API do provedor e deduplica; reconciliação: ✔ (`reconcilePendingPayments`). Provedor: `src/lib/payments` isola o Mercado Pago, mas a loja guarda campos do MP. |
| X. Frete e fulfillment (§64–68) | ◐ | Frete separado em `lib/shipping`. **Um pedido tem um código de rastreio** (`shipping_label_code`): o 02 §66 pede não assumir isso. Sem tabela de remessas nem eventos de rastreio. |
| XI. Eventos e transações (§69–72) | ◐ | Transações em criação de pedido, pagamento e cancelamento (✔). Eventos semânticos de pedido, pagamento e estoque não existem (só `activities`). |
| XII. Autoridade do servidor, validação, erros (§73–77) | ◐ | Servidor é autoridade (✔). Erros de domínio têm código (`INSUFFICIENT_STOCK`, `MIN_ORDER`…), mas há vários textos soltos e falta um catálogo único (§75). |
| XIV. Decisões da WBuy (§79–83) | ✔/◐ | Status semântico ✔; separar estrutura e experiência de compra ✔; estoque rastreável ✘; exportação ◐. |

## O que o 02 proíbe antes de decisão (§84)
Não entram na V1 sem ADR: política final de reserva, duração, guest checkout, mesclagem de carrinho, máquina final de pedido, captura vs autorização, envio dividido, promotion engine, impostos, marketplace, múltiplas moedas e estoques, backorder, kits, assinatura, edição de pedido pago. **Este cruzamento não propõe construir nenhum deles.**

## Efeito no plano de correção
1. **F1.0 (novo, primeiro):** reserva, liberação, baixa, entrada e ajuste de estoque **atômicos** (`UPDATE ... WHERE saldo suficiente`, ou trava de linha), com `before/after` e `actor` no movimento.
2. **F1.1:** número do pedido atômico (como já planejado).
3. **F1.2:** idempotência da finalização do checkout (chave enviada pelo navegador, única por loja): evita pedido duplicado.
4. **F3 (eventos) amplia:** movimento de estoque auditável (saldo antes e depois, motivo, quem fez, loja, correlação, chave).
5. **Nova fase de pagamento (depois da F3):** entidade de pagamento e de estorno do pedido da loja. Precisa de ADR (é decisão cara de reverter).
6. **ADR pendente, sem código:** carrinho no servidor, remessas, "estoque não controlado".
