# Auditoria do sistema contra a Constituição (2026-10-03)

**Base:** `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`. **Método:** leitura do código da branch de publicação e buscas dirigidas, com a hierarquia de evidência do art. 37. **Não** rodei testes novos para esta auditoria. "Confirmado" = li o código; "Inferido" = conclusão plausível; "Não verificado" = não olhei.
**Legenda:** ✔ cumprido · ◐ parcial · ✘ violado ou ausente · ? não verificado.

## Resumo
- **Violados (3):** motor acoplado à "Central" do SuperDrop (art. 4); sem "esta loja está pronta para vender?" (art. 30); fatos de pedido, pagamento e estoque sem evento semântico (art. 22, parcial forte).
- **Falhas reais de segurança e dinheiro (3):** distribuição de produto aceita lojas de outra rede; preço da grade pode ficar abaixo do mínimo; número do pedido pode derrubar o checkout em compras simultâneas.
- **Correção de uma afirmação anterior:** o número do pedido **não** se repete (há índice único `orders_store_number`). O que acontece é que a segunda compra simultânea **falha** com erro, porque o número é calculado como "maior + 1" sem contador atômico.

## Artigo a artigo (agrupados)
| Art. | Tema | Situação | Evidência |
|---|---|---|---|
| 2, 3 | Definição e quatro responsabilidades | ◐ | O motor existe, mas "Platform Operations" está misturado ao produto derivado Master (`src/app/master/*`). |
| 4 | Core não depende de produto derivado | ✘ | `orders.supplier_id`, `stores.network_id` e `products.supplier_id` são `NOT NULL`; loja da Commerce só existe com uma "Central oculta" (`createHiddenCentral`, `independentSupplierOfStore`, `catalogSupplierId`, 12 arquivos). |
| 5, 6 | Capacidades e cinco camadas | ◐ | Domínio separado em `src/lib/domain`, temas em `src/lib/themes`, analytics em `analytics.ts`. Fronteiras não são formais. |
| 7 | Direção de dependência | ? | Não conferi se algum módulo de domínio importa marca ou tema. |
| 8, 9 | Domínio antes da interface; fonte de verdade | ? | Não auditei duplicidades de cliente entre módulos. |
| 10 | Invariantes acima de conveniência | ◐ | Valores em centavos, estoque com reserva. Mas: preço da grade abaixo do mínimo (ver abaixo). |
| 11 | Histórico não é reescrito | ◐ | Itens guardam `product_name`, `label`, `unit_price`, `unit_cost`; pedido guarda endereço e totais. Faltam foto, SKU e descrição do produto na hora da compra. |
| 12 | Isolamento entre lojas | ◐ | Forte: `assertCanAccess`, testes `tenancy`, webhook confere dono do pedido. **Falha confirmada na F0 (gravidade baixa):** `src/app/actions/supplier.ts` (linha 69) e `src/lib/domain/products.ts` (linha 91) gravam `storeIds` sem conferir que são da rede do fornecedor. A loja de fora ainda não consegue vender o produto (`assertProductListable`). Ver `F0-CONFIRMACAO-2026-10-03.md`. |
| 13, 14 | Visual como arquitetura; guarda-corpos | ◐ | Temas não definem preço nem estoque (✔). Painéis têm três visuais em disputa (ramos de design não juntados). |
| 15 | Configurar ≠ publicar | ✔ | Rascunho, prévia, publicar, histórico e restaurar no editor de temas (`src/lib/themes/store.ts`). |
| 16–18 | Mobile, desempenho, acessibilidade | ◐ | Medido com axe, 360 px e Lighthouse. Hoje achei rolagem lateral nas lojas (corrigida). LCP do Starter 3,0 s, acima da meta de 2,5 s. |
| 19 | Funcionalidade real | ◐ | Simulações são rotuladas ("CARTÃO SIMULADO", lojas de exemplo marcadas). Parte do Master mostra dados de demonstração só em demo. |
| 20 | Segurança no servidor | ✔ | `requireRole`, `assertCanAccess`, segredos criptografados, Mercado Pago só vale após consulta à API. |
| 21 | Privacidade e ciclo dos dados | ◐ | Máscara em erros, IP com hash. **Ausentes:** exportar ou excluir dados de um cliente, política de retenção. A tela do Master só descreve a intenção. |
| 22 | Eventos com significado | ◐ | Tabela de eventos tem 17 tipos (cobrança, parceiros, temas). Pedido criado, pagamento aprovado e estoque reservado vão para `activities`, um log de texto, e não para eventos. |
| 23 | Idempotência e concorrência | ◐ | Forte: atualização condicional, `dedupeKey`. **Falha:** número do pedido (`max + 1` em `orders.ts` linhas 129-130). |
| 24 | Falhas recuperáveis | ✔ | `runJob` isola etapas, `reconcilePendingPayments`, resposta 207. |
| 25 | Observabilidade | ◐ | Painel de erros, execuções de rotinas, monitor a cada 15 min. Falta log estruturado com correlação e saúde por loja; `/api/health` só testa o banco. |
| 26, 27 | Analytics ≠ operação; sinal, contexto, ação | ◐ | Resumo diário e fila de ações existem em parte; ramos de design têm mais. Não auditei se o filtro de período esconde pendência. |
| 28 | Capacidades em vez de condicionais | ◐ | `features.ts` centraliza (21 usos de `canUse` e `requireFeature`), mas há 19 comparações diretas com `offer ===` espalhadas. |
| 29 | Importação e exportação | ◐ | Importação de produtos (CSV e XLSX) existe. Não há exportação de pedidos, clientes e produtos. |
| 30 | Ciclo de vida da loja | ✘ | Só existe "publicada" mais teste e plano. Nenhuma resposta a "esta loja está pronta para vender? O que falta?". |
| 31 | Integrações não definem o core | ◐ | `src/lib/payments` e `src/lib/shipping` separados, mas a loja guarda campos do Mercado Pago (`mp_access_token_enc`, `mp_public_key`) e não há contrato de gateway. |
| 32 | Evolução de contratos | ✔ | Migrações Drizzle versionadas, nunca editadas depois de publicadas. |
| 33, 34 | Simplicidade; código existente tem valor | ✔ | Sem reescritas; motor único. |
| 36, 37 | Benchmark como evidência | ? | Há documentos de concorrentes; não conferi se classificam confirmado, inferido e hipótese. |
| 38 | Decisões registradas | ◐ | `DECISIONS.md` vai de D1 a D61. Muitas entradas não trazem alternativas e trade-offs. |
| 39 | Exceções explícitas | ◐ | A "Central oculta" é uma exceção de fato, mas não está registrada como exceção, com prazo de revisão. |
| 40, 41 | Governança e hierarquia | ✔ | Registrada hoje no `CLAUDE.md` e no `AGENTS.md`. |
| 43 | Critério de qualidade | ◐ | Existe checklist de verificação; falta o documento de Quality Engineering que a Constituição cita. |

## Plano de correção (ordem proposta)
1. **P1, dinheiro e pedidos:** contador atômico do número do pedido (coluna `next_order_number` em `stores`, nova migração na numeração atual) com teste de compra simultânea. Conferir o piso de preço da grade (`pack_price`) no servidor.
2. **P1, isolamento:** validar que as lojas de `storeIds` pertencem à rede do fornecedor, nos dois pontos. Com teste.
3. **P2, eventos (art. 22):** emitir `OrderCreated`, `PaymentApproved`, `OrderCanceled`, `StockReserved` no mesmo transcorrer das ações, sem tirar `activities`.
4. **P2, pronta para vender (art. 30):** função de prontidão (produtos ativos, pagamento, frete, domínio, tema publicado) e checklist na tela inicial do lojista.
5. **P3, desacoplar a Central oculta (art. 4):** decisão estrutural, precisa de ADR e plano de migração antes de qualquer código. É a mudança mais cara e a mais importante.
6. **P3, privacidade e exportação (arts. 21 e 29):** exportar e excluir dados de cliente; exportar pedidos e produtos.
7. **P3, juntar ou descartar os ramos de design** e unificar a casca dos painéis (art. 13.1).
