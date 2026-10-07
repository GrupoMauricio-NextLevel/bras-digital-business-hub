# Fase 1C — Lógica do negócio: racional de cada fluxo e onde ele é testado

Regra geral: **venda** é pedido não cancelado com pagamento do cliente confirmado (`isEligibleSale`). O valor da venda é o subtotal menos o desconto, sem frete (`netSaleCents`). Pagamento só vale depois de conferido na API do Mercado Pago (`dedupeKey`). Valores sempre em centavos.

## SuperDrop (em produção)

| Passo | Racional (o que precisa ser verdade) | Testes |
|---|---|---|
| Cadastro e assinatura | Loja nasce com a marca do endereço; trial e bloqueio por falta de pagamento seguem o plano | `brand.test.ts`, `store-access.test.ts`, `u1-billing.test.ts`, e2e `trial-block.mjs` |
| Catálogo do fornecedor → loja | Produto só vai para a loja se tiver estoque mínimo e preço acima do custo | `catalog-provisioning.test.ts`, `pricing.test.ts`, `inventory.test.ts`, `product-import.test.ts` |
| Pedido no checkout | Estoque reservado de forma atômica; reserva vence e devolve estoque; pedido não duplica | `estoque-atomico.test.ts`, `checkout-idempotencia.test.ts`, `orders.test.ts`, e2e `checkout-flow.mjs` |
| Pagamento do cliente | Só confirma após consulta à API; webhook repetido não paga duas vezes | `payments.test.ts`, `security.test.ts`, e2e `scenario.mjs` (Mercado Pago simulado) |
| Débito do saldo do lojista → libera para a Central | Saldo nunca fica negativo sem aviso; pedido fica "aguardando saldo" | `wallet.test.ts`, `finance-domain.test.ts`, `finance-engine.test.ts` |
| Etiqueta → separação → expedição → enviado | Central só separa com etiqueta; corte do dia respeitado; ondas sem pedido repetido | `labels.test.ts`, `cutoff.test.ts`, `operations.test.ts`, `shipping.test.ts` |
| Pós-venda | Troca/devolução com prazo e histórico | `after-sales.test.ts` |
| Comissões e repasses | Comissão do parceiro e taxa por pedido calculadas por regra de `platform_settings` | `partners.test.ts`, `store-fees.test.ts`, `supplier-billing.test.ts` |
| Isolamento | Um tenant nunca lê dado de outro | `tenancy.test.ts`, `seguranca-rapida.test.ts` |

## NextLevel Commerce

| Passo | Racional | Testes |
|---|---|---|
| Convite/cadastro → loja | Loja Commerce nunca herda navegação ou marca SuperDrop | `store-brand.test.ts`, `commerce-hub.test.ts`, `host-routing.test.ts` |
| Configuração e prontidão | Loja só "pronta para vender" com pagamento real, frete e produto publicado | `prontidao-loja.test.ts`, `diagnostico-loja.test.ts` |
| Tema e editor | Tema muda só a apresentação (mesmo catálogo, preço e estoque) | `theme-engine.test.ts`, `theme-render.test.tsx`, `theme-install.test.ts`, `editor-state.test.ts` |
| Checkout → pedido | Mesmas regras de estoque e pagamento do motor | `storefront-journey.test.ts`, `checkout-idempotencia.test.ts` |
| Atendimento e marketing | Cupons, propostas, avise-me, avaliações | `onda9-descontos.test.ts`, `onda6-propostas.test.ts`, `avise-me.test.ts` |
| Financeiro da loja × assinatura | Caixa da loja separado da mensalidade da plataforma | `finance-domain.test.ts`, `commerce-console.test.ts` |
| Equipe | Equipe só vê operação; dono vê tudo | `equipe.test.ts` |

## Master e suporte

| Passo | Racional | Testes |
|---|---|---|
| Visão consolidada e por marca | Números do Master usam o mesmo contrato de venda (pago, não cancelado, sem frete) e a soma por marca bate com a rede | `master-numeros.test.ts`, `master-control.test.ts`, `control-tower.test.ts`, `resumo-dia.test.ts` |
| Erros e integridade | Erro inesperado vai para o painel com código | `painel-erros.test.ts`, `observabilidade-erros.test.ts`, `integridade.test.ts` |
| **Modo suporte (novo)** | Só Master, com motivo, somente leitura, prazo, trilha visível ao cliente | `modo-suporte.test.ts`, e2e `modo-suporte.mjs` |
| **Mesmo número em telas diferentes (novo)** | "Vendas · 30 dias" igual no início do painel e na Análise | `analytics.test.ts` |
| **Auditoria legível (novo)** | Histórico sem termos técnicos | `auditoria.test.ts` |

## Execução nesta rodada
- Vitest completo: ver o relatório final (`RELATORIO.md`).
- Fluxo real ponta a ponta com Mercado Pago simulado (`npm run e2e`): ver o relatório final.
