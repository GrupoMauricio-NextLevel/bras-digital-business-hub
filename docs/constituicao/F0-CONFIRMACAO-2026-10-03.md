# F0: confirmação dos achados da auditoria (2026-10-03)

Fase só de confirmação: nenhum código de produto foi alterado. Os testes usados foram descartáveis (não entram no repositório). Banco de teste: PGlite, que atende uma conexão por vez.

| # | Achado | Resultado | Como foi provado | Gravidade real |
|---|---|---|---|---|
| 1 | Número do pedido ("maior + 1") | **Confirmado, com efeito diferente do que se supunha** | Só existe **um** ponto que cria pedido (`src/lib/domain/orders.ts:134`); todo caminho (checkout, pedido manual, proposta, demo) passa por `createOrder`. Seis compras simultâneas no PGlite: 6 de 6 deram certo, porque ele serializa. Duplicar um número já usado é **recusado pelo índice único** `orders_store_number`. Logo, o número não repete; numa corrida real o Postgres derrubaria a segunda compra inteira. | Média: comprador recebe erro no checkout em compra simultânea. **Não provado em corrida real** (PGlite não prova). |
| 2 | Piso de preço da grade | **Confirmado por leitura** | `src/app/actions/merchant.ts` (linhas 88-99) confere só o piso unitário; `packPriceCents` é gravado sem checar `productPacks.minimumPriceCents`. No checkout (`orders.ts:95`) a grade é vendida por esse preço, sem nenhuma outra conferência. | Média: loja pode vender grade abaixo do mínimo do fornecedor. |
| 3 | Distribuição aceita lojas de outra rede | **Confirmado por teste** | Com uma loja independente (outra rede), `createProduct` com `SELECTED_STORES` gravou o acesso para ela. A ação do fornecedor (`supplier.ts:69-70`) tem o mesmo código, sem validação. | **Baixa hoje**: a loja de fora continua sem poder vender o produto, porque `assertProductListable` (`catalog.ts:127`) exige que o fornecedor do produto seja o da rede da loja. É dado inválido gravado e uma brecha latente se outra consulta passar a confiar nessa tabela. |
| 4 | Outras ações com lista de IDs vindos do cliente | **Sem defeito** | `recordPickingListPrint` confere `assertCanAccess` por pedido; ondas filtram pelo conjunto do próprio fornecedor. | n/a |

## Correções à auditoria
- Art. 12 (isolamento): continua "parcial", mas o achado 3 é de gravidade **baixa**, não média.
- Art. 23 (idempotência): o achado 1 é um **erro de checkout em compra simultânea**, não repetição de número.

## Consequências para a F1 e a F2
- **F1.1 é simples de aplicar:** um ponto só de criação de pedido; o contador atômico entra em `orders.ts` e cobre todos os caminhos.
- **Como validar a F1.1 sem corrida real:** testes de sequência, de preenchimento a partir de pedidos antigos, de transação desfeita e de isolamento entre lojas. A prova de concorrência real fica para a F8, num Postgres de verdade.
- **F2:** validar as lojas nos dois pontos (`supplier.ts:69` e `products.ts:91`). A varredura de outras ações com lista de IDs já foi feita e está limpa.
