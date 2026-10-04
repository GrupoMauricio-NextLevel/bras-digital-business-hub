# ADR-0001. Pagamento e estorno como entidades próprias

**Estado:** proposta, aguardando o dono. **Documento de origem:** 02 §58 a §63. **Quem decide:** dono.

## Situação hoje (fato)
- `orders` guarda só `payment_provider`, `payment_reference` e `customer_payment_status` (PENDING, PAID, REFUNDED).
- Não existe registro de tentativas de pagamento (aprovado, recusado, pendente) nem de estorno parcial. REFUNDED é uma troca de estado, sem valor nem histórico.
- O webhook do Mercado Pago é conferido na API antes de valer (regra do projeto) e a idempotência usa `dedupeKey`.

## Problema
Sem entidade de pagamento não dá para mostrar ao lojista "o cliente tentou 2 vezes, a 2ª passou", nem estornar parte do valor, nem conciliar com o extrato do Mercado Pago.

## Alternativas
1. **Duas tabelas novas** (`payments`: pedido, provedor, referência, valor, estado, datas; `refunds`: pagamento, valor, motivo, quem fez). Mantém `orders.customer_payment_status` como resumo calculado. Mais correta, custo médio.
2. **Só `refunds`** (valor e motivo) e o pagamento continua em `orders`. Custo baixo, cobre o estorno parcial, não cobre tentativas.
3. **Nada agora.** Risco: estorno parcial continua impossível; conciliação manual.

## Recomendação
Alternativa 1, em três passos (expandir, migrar, contrair): criar as tabelas; gravar nos dois lugares e preencher o histórico dos pedidos existentes (1 pagamento aprovado por pedido pago); só depois mudar a leitura. Nada é removido de `orders`.

## Depende de
Backup do Neon confirmado (a migração preenche dados) e decisão do dono. **Não será implementado sem aprovação.**
