# Execução por módulos: checkpoint da Onda 1

**Estado:** Onda 1 implementada e testada **localmente** na branch `commerce/onda-1`. **Não publicada** (sem push, sem deploy, sem efeito externo pago).

## O que mudou (Onda 1: núcleo independente e segurança operacional)
| Pacote | Entrega | Onde |
|---|---|---|
| A | Dono de conta simples separa e envia o próprio pedido; dono de rede continua sem expedir | `src/lib/domain/order-policy.ts`, `orders.ts` |
| B | Confirmação manual só para pagamento manual; Mercado Pago só por "Verificar pagamento" | `orders.ts`, `actions/orders.ts`, `order-actions.tsx` |
| C | Avançar/cancelar/confirmar seguros contra repetição e clique duplo | `orders.ts` |
| D | Dono só lista produto do próprio catálogo; textos da conta simples sem "Central"/recarga | `catalog.ts`, `actions/merchant.ts`, telas do lojista |
| E | Estoque e catálogo atualizam painel da Central e do lojista | `actions/supplier.ts` |

## Rastreabilidade
| Risco | Teste |
|---|---|
| R-02 independente não expedia | T-01, T-02, T-03, T-04, T-08 |
| R-03 confirmação manual em pedido de gateway | T-09 a T-14 |
| R-07 concorrência | T-05, T-06, T-07, T-09 |
| R-08 listagem de produto alheio | T-15 a T-18 |
| Dinheiro / SuperDrop preservado | T-19, T-20 e suíte existente (wallet, orders, payments) |

Decisão: `docs/design/DECISIONS.md` D44. Testes: `tests/onda1-commerce.test.ts` (20).

## Fora da Onda 1 (próximas ondas)
Onda 2: categorias, estoque e catálogo do lojista independente. Sem ativar outro módulo sem pedido do dono.
