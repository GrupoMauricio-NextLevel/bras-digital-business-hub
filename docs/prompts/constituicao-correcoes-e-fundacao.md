# Correções e fundação segundo a Constituição (prompt-mestre de engenharia)

> **Status: SALVO, NÃO IMPLEMENTADO** (pedido do dono, 2026-10-03). Cole o bloco da seção 2 numa sessão de trabalho. Nasceu da auditoria `docs/constituicao/AUDITORIA-2026-10.md` contra `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` (autoridade máxima do e-commerce). Cada fase termina com a skill `publicar`; nenhuma fase começa sem o OK do dono na anterior.

## 1. O que o dono pediu
Montar um prompt completo, usando as skills do projeto, para corrigir com segurança o que a auditoria achou: três falhas reais (número do pedido, piso de preço da grade, distribuição de produto entre redes) e três violações da Constituição (motor acoplado à "Central oculta", sem "loja pronta para vender?", sem eventos de pedido, pagamento e estoque).

## 2. O prompt (colar numa sessão)
```
FUNÇÃO
Você é engenheiro principal (staff) de e-commerce no sistema NextLevel (Next.js 16/React 19, TypeScript estrito, Drizzle, Postgres/Neon em produção, PGlite em demonstração). O dono, Mauricio, não é técnico: fale em português simples; código, arquivos e commits em português como o projeto já faz. SuperDrop está em produção com clientes reais.

LEITURA OBRIGATÓRIA (nesta ordem, antes de qualquer código)
AGENTS.md, CLAUDE.md, node_modules/next/dist/docs/ (Next 16 muda APIs), docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md, docs/constituicao/AUDITORIA-2026-10.md, docs/design/DECISIONS.md (próxima numeração: D63), src/lib/domain/{orders,products,events,access,store-access,independent}.ts, src/app/actions/{merchant,supplier}.ts, src/db/schema.ts, tests/{tenancy,orders,independent}.test.ts. Skills: desenvolver-prompt (conduz o processo), nova-migracao, e2e-demo, qa-visual, painel-interno, desempenho, publicar, code-review, security-review, simplify.

HIERARQUIA E CONFLITO
Constituição > decisões registradas > este prompt > a tarefa. Se qualquer passo abaixo conflitar com a Constituição, PARE, explique, e registre a decisão antes de seguir (arts. 41 e 42). Nunca "resolva" o conflito em silêncio.

REGRAS DE SEGURANÇA (valem para todas as fases)
1. Teste que falha primeiro: para cada falha da auditoria, escreva o teste mínimo que a reproduz e mostre-o VERMELHO antes de corrigir; só então corrija e mostre VERDE. Sem reprodução, não é correção. Poucos testes, mas os certos: um por regra de negócio nova, nada de bateria extensa por fase.
2. Migração só aditiva ("expandir, depois contrair"): coluna nova com default ou anulável, preenchimento de dados na própria migração, nada de apagar nem renomear coluna usada. Nunca edite migração já publicada; use `npx drizzle-kit generate --name <assunto>` (a numeração atual manda: confira `ls drizzle | tail`). Prove que atualiza um banco ANTIGO com dados (skill nova-migracao, passo 4).
3. Produção tem dados reais. Antes de publicar migração com preenchimento de dados, peça ao dono para confirmar que existe backup do Neon (ponto de restauração). Registre isso na resposta.
4. SuperDrop não muda de comportamento sem teste. Toda alteração em src/lib/domain/orders.ts roda os testes de pedido, tenancy e a jornada e2e completa (e2e/jornada-completa.mjs).
5. Segredos nunca em código, log ou tela. Valores em centavos. Textos ao usuário em português claro. Página que consulta o banco declara `export const dynamic = "force-dynamic"`.
6. Nunca force push. Nunca criar PR sem o dono pedir. `git pull --rebase origin claude/wonderful-cannon-5o38v5` antes de cada push. O hook antes-do-push roda tipos e estilo: corrija a causa, não contorne.
7. Não aplique o ramo `audit/usability-critical-flows` inteiro: ele nasceu de uma base antiga (a migração dele se chama 0012 e colide com a atual 0012). Aproveite o que vale por commit isolado (ver F1 e F2), revisando cada um.
8. Verdade (art. 19): o que for simulado ou parcial é dito como simulado ou parcial, na tela e na entrega.

CICLO DE CADA FASE (modo rápido, decisão do dono em 2026-10-03: poucos testes por fase e uma fase final só de testes)
(a) Reproduzir o achado com o teste mínimo que o prova (vermelho) → (b) corrigir o mínimo → (c) rodar SÓ os arquivos de teste da área tocada (`npx vitest run tests/<area>.test.ts`), nunca a suíte inteira → (d) `npx tsc --noEmit` e `npx eslint src e2e tests` (rápidos; o hook do push também roda) → (e) `npm run build` SOMENTE se mexeu em rota, página, esquema do banco ou `dynamic` → (f) decisão em DECISIONS.md → (g) push → (h) conferir o site e o resultado do GitHub Actions (roda a suíte completa na nuvem, ~17 min) → (i) reportar.
EXCEÇÃO QUE NÃO SE NEGOCIA: se a fase toca dinheiro, pedido, estoque, permissão, isolamento entre lojas, migração com preenchimento de dados ou o comportamento do SuperDrop, rode também os testes vizinhos dessa área (orders, tenancy, finance, independent, payments, conforme o caso) ANTES do push, porque o Render publica no push sem esperar o GitHub.
Skills simplify, code-review e security-review ficam para o fim de cada fase que mexe em dinheiro, permissão ou dado pessoal (não em toda fase). Se o GitHub Actions ficar vermelho depois do push, a próxima ação é corrigir, antes de qualquer fase nova.

FASE F0. CONFIRMAR (sem alterar código de produto)
Confirme com teste ou leitura cada achado da auditoria e anote o que NÃO se confirmou: (1) `grep -rn "insert(orders)" src` para achar TODO lugar que cria pedido (checkout, pedido manual, proposta, pagamento) e dizer quais usam o cálculo "maior + 1"; (2) distribuição: chamar a ação com `storeIds` de outra rede e mostrar que grava; (3) grade: listar produto com `packPriceCents` abaixo do piso e mostrar que grava; (4) simule dois `createOrder` na mesma loja e descreva o que acontece (o índice único `orders_store_number` impede repetição; o provável é a segunda falhar). ATENÇÃO: PGlite tem uma conexão só; ele NÃO prova concorrência real. Diga isso e valide a alocação por propriedade (ver F1), não por corrida simulada.

FASE F1. DINHEIRO, ESTOQUE E PEDIDOS
F1.0 Estoque atômico (PRIMEIRO; achado do documento 02, ver docs/constituicao/CRUZAMENTO-02-COMMERCE-CORE.md). Em src/lib/domain/inventory.ts, `reserveStock`, `releaseStock`, `consumeReservation`, `receiveStock` e `adjustStock` leem o saldo e gravam `row.x + n` sem condição nem trava: duas compras da última peça passam as duas (overselling) e o contador perde reservas. Corrigir com atualização condicional e atômica no banco (`UPDATE inventory SET reserved = reserved + $q WHERE variant_id = $v AND on_hand - reserved >= $q RETURNING ...`; zero linhas = `INSUFFICIENT_STOCK`; análogo nas outras quatro, com as condições `reserved >= q` e `on_hand >= q`), tudo na mesma transação do pedido. Cada movimento passa a guardar saldo antes e depois (`on_hand_before/after`, `reserved_before/after`) e quem fez (`actor_user_id` anulável): migração aditiva, linhas antigas com NULL. Testes: reserva além do disponível recusa; reserva exata aceita; liberar mais que o reservado recusa; sequência de movimentos fecha a conta (saldo depois de um = saldo antes do próximo); pedido que falha no meio não deixa reserva (transação desfeita); duas lojas ou dois produtos não interferem. Diga ao dono que PGlite não prova a corrida e que a prova real é o `UPDATE` condicional (o Postgres trava a linha) mais o teste de concorrência da F8 num Postgres de verdade. Rodar security-review e code-review. SuperDrop: roda orders, inventory, tenancy e jornada-completa antes do push.
F1.1 Contador atômico do número do pedido. Coluna `stores.next_order_number integer not null default 1001`, preenchida na migração com `max(orders.number)+1` por loja (ou 1001 sem pedidos). Alocar dentro da MESMA transação do pedido com `UPDATE stores SET next_order_number = next_order_number + 1 WHERE id = $1 RETURNING next_order_number - 1` (o Postgres trava a linha: duas compras simultâneas esperam uma pela outra). Sem lacunas se a transação desfizer. Substituir o cálculo em src/lib/domain/orders.ts (linhas ~129-130) e em todo caminho achado na F0. Testes: sequência única crescente; preenchimento correto a partir de pedidos antigos (banco antigo com dados); transação desfeita não consome número; pedidos de lojas diferentes não interferem. Explique ao dono, em uma frase, por que PGlite não prova a corrida e o que prova a segurança.
F1.2 Idempotência da finalização do checkout (documento 02 §46): o navegador envia uma chave única por tentativa (`idempotencyKey`, gerada ao abrir o checkout); `createOrder` grava a chave em `orders` com índice único por loja e, se a chave já existir, devolve o pedido já criado em vez de criar outro. Migração aditiva. Testes: mesma chave duas vezes devolve o mesmo pedido, sem segunda reserva de estoque; chaves diferentes criam pedidos diferentes; chave de outra loja não colide.
F1.2b Piso de preço da grade. No servidor (src/app/actions/merchant.ts, ação de listagem), recusar `packPriceCents` abaixo do maior `minimumPriceCents` das grades do produto, com a mesma mensagem de piso unitário. O commit c133791 do ramo de auditoria tem a ideia: reaproveite o trecho, não o commit. Testes: abaixo do piso recusa, igual ao piso aceita, sem grade aceita, produto de outra rede recusa.
F1.3 Do ramo de auditoria, avalie UM A UM (git show por commit; aplicar só o que ainda falta e tem teste): vendas só com pagamento confirmado nas métricas do fornecedor, endereço de entrega obrigatório quando há frete em pedido manual, cancelar pedido pago exige estorno, limites de papel nas ações de pagamento, etiqueta e despacho. Confira antes se o contrato único `isEligibleSale`/`netSaleCents` (src/lib/domain/finance.ts) já cobre; não duplique regra. Cada item aplicado: teste vermelho→verde.

FASE F2. ISOLAMENTO ENTRE REDES (Constituição arts. 12 e 20)
Em src/app/actions/supplier.ts (linha ~69) e src/lib/domain/products.ts (linha ~91), antes de gravar `productStoreAccess`, validar que TODAS as `storeIds` pertencem a lojas da rede do fornecedor (join com `networks.supplierId`), sem duplicados; qualquer uma de fora recusa a ação inteira (ForbiddenError, mensagem em português). Referência: commit 1ed3daa. Testes: loja de outra rede recusa e nada é gravado; mistura válida e inválida recusa tudo; lista vazia aceita; fornecedor A não altera produto do fornecedor B. Rodar security-review. Varra o mesmo padrão em outras ações que recebem lista de IDs vinda do cliente (`grep -rn "z.array(z.string" src/app/actions`) e relate cada caso, corrigindo os que tiverem o mesmo defeito.

FASE F3. EVENTOS COM SIGNIFICADO (art. 22) E ESTOQUE AUDITÁVEL (documentos 01 e 02)
Além dos eventos: o movimento de estoque passa a registrar motivo estruturado, origem, loja (tenant), `correlation_id` e `idempotency_key`, e os tipos que faltam (RETURN, CANCELLATION, DAMAGE) quando houver fluxo que os use. Sem inventar tipo sem fluxo.
Estender a tabela de eventos existente (src/lib/domain/events.ts, `emitEvent`, com `dedupeKey`) com OrderCreated, PaymentApproved, PaymentFailed, OrderCanceled, StockReserved, StockOut, OrderShipped, emitidos no MESMO ponto da regra (dentro da transação) e idempotentes. NÃO remova `activities` (linha do tempo visível ao usuário). Payload só com ids e valores, nunca nome, e-mail, telefone ou endereço de cliente. Testes: cada evento nasce uma vez; repetir o webhook de pagamento não duplica; estorno e cancelamento geram o evento certo; o payload não contém dado pessoal. Sem consumidor novo nesta fase: só registrar bem.

FASE F4. "ESTA LOJA ESTÁ PRONTA PARA VENDER?" (art. 30)
Função pura `getStoreReadiness(db, storeId)` em src/lib/domain/ que devolve a lista de requisitos: produto ativo e com estoque; preço dentro do piso; forma de pagamento (Mercado Pago conectado ou pagamento manual configurado); frete configurado; tema publicado; dados legais mínimos; loja publicada e plano em dia. Cada item: `{ key, ok, label, fixHref }`. Regra vem do domínio, nunca de componente. Tela: faixa "Falta pouco para vender" na primeira tela do lojista (Commerce e SuperDrop) com o próximo passo e o link que resolve; some quando tudo está ok. Skills painel-interno (cada número com "e daí?") e qa-visual (360/768/1440, 3 rodadas, axe). Testes de domínio para cada requisito e e2e. Sem número ou meta inventada.

FASE F4b. PAGAMENTO E ESTORNO DO PEDIDO DA LOJA (documento 02 §58 a §63). SÓ ADR NESTA ETAPA
Hoje o pedido guarda só `payment_provider` e `payment_reference`, e o estorno é `customer_payment_status = REFUNDED`. O 02 pede entidade de pagamento (tentativas, aprovado, falho) e de estorno (total, parcial, por valor), auditáveis. É decisão cara de reverter: entregue inventário, alternativas, migração expandir→migrar→contrair e pergunta ao dono ANTES de qualquer código. Também em ADR, sem código: carrinho no servidor (§37 a §41), remessas (§66) e "estoque não controlado" (§36). Os itens do §84 do 02 NÃO entram na V1 sem ADR.

FASE F5. DESACOPLAR A "CENTRAL OCULTA" (art. 4). SÓ DOCUMENTO NESTA FASE
É a mudança de maior custo de reversão (art. 35). NÃO escreva código antes de o dono aprovar um ADR. Entregue: (1) inventário real: tabelas e colunas `NOT NULL` que exigem fornecedor ou rede (`orders.supplier_id`, `stores.network_id`, `products.supplier_id`, e os 12 arquivos que usam createHiddenCentral, independentSupplierOfStore e catalogSupplierId), com o que cada uso faz; (2) três alternativas com custo, risco e reversão: A) tornar fornecedor e rede opcionais no motor; B) formalizar a Central oculta como conceito do motor ("dono do catálogo da loja") com nome e contrato próprios; C) manter como exceção registrada (art. 39) com prazo de revisão; (3) plano de migração expandir→migrar→contrair com ensaio em cópia do banco e rollback; (4) o que o SuperDrop precisa continuar fazendo igual, com os testes que provam. Recomende UMA alternativa. Pergunte ao dono. Espere o OK.

FASE F6. PRIVACIDADE E EXPORTAÇÃO (arts. 21 e 29)
Exportar pedidos, produtos e clientes da loja (CSV) pelo domínio, só para o dono ou a equipe com permissão, sempre filtrando pela loja; exportar e excluir os dados de UM cliente (anonimizando o que a lei exige guardar, como o pedido e a nota); registrar a ação em auditoria. Política de retenção é DECISÃO DO DONO (e jurídica): proponha, não decida. Testes de isolamento (uma loja nunca exporta dado de outra) e de anonimização. Rodar security-review.

FASE F7. RAMOS DE DESIGN (art. 13.1)
Ramos fora do Render: design/system-redesign-final-20261002, design/nextlevel-os-revolution, audit/usability-critical-flows (parte visual), feat/theme-arena-premium-v1, feat/master-scenario-data, main (ecossistema). NÃO fazer merge geral: todos conflitam com a branch atual (12 arquivos no redesign). Para cada ramo: listar o que traz, o que já existe na branch atual, o conflito, e propor entrar por partes (um painel por vez), cada parte com capturas antes/depois (qa-visual) para o dono aprovar. Skill painel-interno manda: cada papel e cada marca vê só o que existe para ele. Nada entra sem o OK visual do dono.

FASE F8. TESTES FINAIS (só depois de F0 a F7 aprovadas, ou quando o dono pedir)
Uma fase inteira só para verificar, sem escrever funcionalidade nova: (1) `npx vitest run` completo; (2) `npm run build`; (3) e2e: `jornada-completa`, `smoke-demo`, `temas-pagos`, `checkout-flow`, `polish-v8` (4 larguras + axe); (4) concorrência de verdade do número do pedido contra um Postgres de verdade (não PGlite), se o dono liberar um banco de teste; (5) skill desempenho: Lighthouse nas páginas públicas e tempo do checkout com o contador; (6) varredura de erros em páginas públicas e painéis (como a feita em 2026-10-03); (7) revisão final code-review e security-review sobre todo o conjunto. Corrija o que aparecer, registre em DECISIONS.md e entregue um relatório com o que passou, o que falhou e o que NÃO foi medido.

ENTREGA (ao fim de cada fase)
Em português simples: o que mudou; o teste vermelho→verde; o que foi e NÃO foi medido; o que depende do dono (backup do Neon, decisões); resultado do que foi rodado (tsc, eslint, testes da área, build se aplicável) e do GitHub Actions; decisão registrada (D63+); e UMA pergunta de aprovação. Espere o OK.

FORA DE ESCOPO
Novos temas, páginas de vendas, redesign de marca, planos e preços, nota fiscal e etiqueta paga, produtos "em breve" (Creators Hub, Brás Digital, China Hub).
```

## 3. Como cada skill entra
| Skill | Onde | Para quê |
|---|---|---|
| `desenvolver-prompt` | todas | Conduz o processo e atualiza este índice |
| `nova-migracao` | F1.1, F5 | Migração aditiva provada em banco antigo com dados |
| `e2e-demo` | todas | Jornada completa antes de publicar; reiniciar a demo após migração |
| `qa-visual` | F4, F7 | Capturas 360/768/1440, três rodadas, axe |
| `painel-interno` | F4, F7 | "O que preciso fazer agora?", cada papel vê só o seu |
| `desempenho` | F1, F4 | Latência do checkout com contador; consultas da faixa de prontidão sem laço |
| `code-review` e `security-review` | F1, F2, F5, F6 | Revisão antes de publicar; segurança onde há dinheiro, permissão e dado pessoal |
| `simplify` | todas | Enxugar a diferença antes da revisão |
| `publicar` | fim de cada fase | Modo rápido (testes só da área, tipos, estilo, build quando preciso); suíte completa na fase F8 e na nuvem |
| `tema-pago`, `pagina-de-vendas`, `dataviz`, artifacts | não se aplicam | Estão fora do escopo deste trabalho |

## 4. O que depende do dono
1. **Backup do Neon** (ponto de restauração) confirmado antes da F1, porque ela preenche dados em produção.
2. **Escolher a alternativa da F5** (A, B ou C) depois do inventário.
3. **Política de retenção de dados** da F6 (com orientação jurídica).
4. **OK visual** de cada parte da F7.

## 5. Por que assim
Cada falha é provada antes de ser corrigida. As migrações só acrescentam, nunca apagam nada em uso. A parte cara e irreversível (F5) vira decisão registrada, não código. O que mexe com dinheiro e permissão passa por revisão de segurança. E nada de visual entra sem o dono ver.
