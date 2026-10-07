# ADR-0002. Desacoplar a "Central oculta" das lojas simples

**Estado:** decidido pelo dono em 2026-10-07 e implementado (D89): loja independente sem fornecedor nem rede, dona do catálogo. **Constituição:** art. 4 (loja não depende de fornecedor), art. 35 (decisão cara de reverter). Exceção vigente: D62.

## Situação hoje (fato)
- Toda loja precisa de uma rede (`stores.network_id` obrigatório) e todo pedido de um fornecedor (`orders.supplier_id` obrigatório; também em `products`, `invoices` e outras 6 tabelas).
- Conta simples do Commerce recebe uma "Central" oculta que existe só para satisfazer essas chaves. 12 arquivos usam `createHiddenCentral`, `independentSupplierOfStore` ou `catalogSupplierId`.

## Alternativas
1. **Manter** a Central oculta (D62) e esconder bem. Zero risco agora; a dívida cresce a cada módulo novo.
2. **Tornar `supplier_id`/`network_id` opcionais** nas tabelas de pedido e produto, com a loja como dona. Muda 9 tabelas e todo o código que assume fornecedor. Alto risco no SuperDrop.
3. **Camada de "dono do catálogo"** (loja ou fornecedor) sem mudar as chaves existentes: nova coluna `owner_store_id` e regras que escolhem o dono. Migração aditiva, convive com a Central oculta e a remove aos poucos.

## Recomendação
Alternativa 3, em fases, começando por leitura (consultas passam a perguntar "quem é o dono do catálogo") e só depois escrita. SuperDrop não muda de comportamento.

## Depende de
Decisão do dono e de janela de baixo movimento. **Sem código antes da aprovação.**
