# Matriz de cobertura 00–13 por capacidade

Atualizada em 2026-10-04. Cruza os documentos com o código (detalhes nos `CRUZAMENTO-*.md` e na `AUDITORIA-2026-10.md`).
Estados: **READY**, **PARTIAL**, **MISSING**, **CONFLICT**, **NEEDS_DECISION**. Prioridade: P0 crítico, P1 fundacional, P2 essencial, P3 evolução, P4 otimização.
Agrupada por capacidade, na ordem real de dependência (não por número de documento). A tabela de lacunas por prioridade está em `MATRIZ-DE-LACUNAS.md`.

## 1. Tenant, acesso e plataforma
| Doc | Capacidade | Estado | Evidência no código | Gap | Prio | Dependências | Próxima ação |
|---|---|---|---|---|---|---|---|
| 00, 03, 10 | Isolamento entre lojas | READY | `assertCanAccess`, `tests/tenancy`, `assertStoresInSupplierNetwork`, exportações filtradas por loja | Cache e jobs: não há cache compartilhado | P0 | — | Manter; teste de isolamento em cada capacidade nova |
| 03, 10 | Autorização no servidor | READY | `requireRole`, `assertStoreAdmin`, `order-policy` | Sem permissões semânticas nem reautenticação em ação crítica | P1 | ADR-0003 | NEEDS_DECISION (papéis finos) |
| 10 | Login com limite de tentativas | PARTIAL | `login-limit.ts` | Em memória, por instância | P1 | ADR-0003 | Compartilhar entre instâncias quando houver mais de uma |
| 03, 10 | Sessões revogáveis, 2FA | NEEDS_DECISION | cookie assinado sem registro | Sem revogação nem 2FA | P1 | — | ADR-0003 |
| 03 | Um usuário em várias lojas | NEEDS_DECISION | `users.store_id` único | — | P2 | ADR-0004 | Decisão do dono |
| 03 | Trilha de auditoria geral | READY | `audit_log` (migração 0038), `audit.ts`, `/merchant/auditoria`; ligada em dados da loja, preço, publicação, frete, equipe, Mercado Pago, exportação e exclusão de cliente | Preço no Master e ações de fornecedor ainda sem registro | P1 | — | Estender a ações do Master e do fornecedor |
| 00 art. 4 | Loja sem fornecedor obrigatório | CONFLICT | Central oculta (D62) | Acoplamento em 9 tabelas | P1 | ADR-0002 | NEEDS_DECISION |
| 10 | Cabeçalhos de segurança, CSP | PARTIAL | `next.config.ts` (sem CSP) | CSP ausente | P1 | ADR-0005 | CSP em modo relatório |

## 2. Catálogo e estoque
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 02 | Produto, variante, SKU | READY | `products`, `product_variants` | Atributos além de tamanho (cor, material) | P2 | — | Backlog |
| 02 | Preço mínimo da grade | READY | `assertListingPrices` | — | P0 | — | — |
| 02, 08 | Estoque atômico e auditável | READY | `inventory.ts` (UPDATE condicional), trilha antes/depois/quem | Prova de concorrência em Postgres real | P0 | banco de teste | F8 |
| 02 | Reserva com expiração | PARTIAL | `reservation_expires_at`, `expireStaleReservations` | Sem vínculo com carrinho | P2 | carrinho | Backlog |
| 02 | Produto sem controle de estoque | MISSING | todo produto tem saldo | — | P2 | ADR | NEEDS_DECISION |
| 02 | Coleções, tags, atributos filtráveis | MISSING | só categorias | — | P3 | — | Backlog |

## 3. Carrinho, checkout e pedido
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 02 | Carrinho no servidor | NEEDS_DECISION | `localStorage` | Sem revalidação persistida | P2 | ADR | Decisão |
| 02 §46 | Idempotência do checkout | READY | `orders.idempotency_key`; pedido cancelado pelo sistema libera a chave (D70); `tests/checkout-idempotencia`, `tests/loop-negativos` | — | P0 | — | — |
| 02, 08 | Número do pedido atômico | NEEDS_DECISION | `max(number)+1` com índice único | Corrida resulta em falha, não em duplicata | P0 | backup do Neon | Dono confirma backup; migração pronta no plano (F1.1) |
| 02 | Pedido e itens com snapshot | READY | `orders`, `order_items` | — | — | — | — |
| 02 | Frete cobrado exige endereço | READY | `createOrderSchema` | — | P1 | — | — |
| 02 | Estados de pedido (pagamento e envio separados) | PARTIAL | `order-status.ts` mistura | Máquina única | P2 | ADR | Backlog |
| 02, 12 | Eventos de pedido e estoque | READY | `ORDER_CREATED`, `PAYMENT_APPROVED`, `ORDER_SHIPPED`, `ORDER_CANCELED`, `STOCK_OUT` | — | P1 | — | — |
| 02 | Pagamento e estorno como entidades | NEEDS_DECISION | só `payment_provider/reference` | Sem tentativas nem estorno parcial | P1 | ADR-0001 | Decisão |
| 02 | Remessas (rastreio por pacote) | MISSING | um código por pedido | — | P3 | ADR | Backlog |
| 02 | Cancelar pedido pago exige estorno | NEEDS_DECISION | cancelamento direto | Depende de fluxo de estorno | P1 | ADR-0001 | Junto do estorno |

## 4. Pagamento e integrações
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 09 | Pagamento só vale conferido na API | READY | `payments/mercadopago.ts`, `markCustomerPaidBySystem` | — | P0 | — | — |
| 09, 10 | Assinatura do webhook | NEEDS_DECISION | corpo nunca confiável | Sem `x-signature` | P1 | segredo do dono | Dono gera o segredo |
| 09, 10 | Tempo máximo e repetição das chamadas externas | READY | `http-timeout.ts`; leituras ao Mercado Pago repetem até 3 vezes em falha temporária, cobrança nunca repete | Sem disjuntor; cotação de frete sem repetição | P1 | — | Backlog |
| 09 | Contrato por categoria e saúde de integração | PARTIAL | adapters existem | Saúde só por coluna | P2 | — | Backlog |
| 09 | Pixels e funil de eventos | MISSING | — | Sem `view_item` etc. | P3 | — | Backlog (precisa de consentimento) |

## 5. Storefront, temas e visual
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 06 | Jornada de compra completa | READY | loja, produto, carrinho, checkout, acompanhamento; alvos de toque de 44 px e carrossel com deslizar (D71); AA nas lojas e painéis (D68); e2e de acabamento em 4 larguras passa | Zoom, guia de medidas, imagem por variante | P3 | — | Backlog |
| 06 | Busca com tolerância a erro | PARTIAL | busca simples | — | P3 | — | Backlog |
| 04, 07 | Publicação de tema atômica | READY | `publishAllDrafts` | — | P1 | — | — |
| 04 | Aviso de legibilidade das cores | READY | `styleContrastWarnings` | Só cor principal/destaque | P3 | — | — |
| 07 | Instalar não deve publicar na hora | CONFLICT | `installTheme` publica (D63) | Decisão do dono registrada | P2 | — | INTENTIONAL_EXCEPTION |
| 07 | Temas pagos com identidade própria | PARTIAL | 6 temas; Ninho pronto | Fotos próprias; Ninho depende do dono | P3 | dono | Dono |
| 07 | Manifesto, atualização, suporte de tema | MISSING | catálogo em código | — | P3 | — | Backlog |
| 04 | Regressão visual automática | MISSING | — | — | P3 | F8 | F8 |

## 6. Painel do lojista e operação
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 05 | "Loja pronta para vender" | READY | `getStoreReadiness` + aviso no início | — | P2 | — | — |
| 05, 12 | Início sem KPI cenográfico | PARTIAL | métricas reais; desempenho × operação | Falha isolada por bloco | P2 | — | Lote E |
| 05 | Pedido: ações pela modalidade | READY | `order-policy`, `tests/onda1-commerce` | — | P1 | — | — |
| 05 | Textos da conta simples sem Central | READY | fixes de hoje | — | P2 | — | — |
| 05 | Visões salvas, ações em massa, desfazer | MISSING | — | — | P3 | — | Backlog |
| 05 | Onboarding até a primeira venda | READY | `getStoreReadiness` (itens, `percent`, `hasFirstSale`) e cartão "Até a primeira venda" no início da loja Commerce | Conferido só por teste e por tipos; a tela com checklist visível não foi vista no navegador (a conta de demonstração já vendeu) | P2 | — | Conferir visualmente com loja nova |

## 6b. Observabilidade (doc 10 §121 a §130, doc 09 §107 a §111)
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 10, 09 | Erro inesperado visível ao Master, com loja, origem e código | READY | `runAction` registra e devolve código ao usuário; erro do Mercado Pago no checkout registrado com loja e código; migração 0039; `/master/errors` mostra loja, origem e código | Sem correlação entre erro e pedido; sem log por chamada de provedor; jobs/rotinas sem registro de execução no mesmo painel | P1 | — | Registrar falha de rotinas (`job-runs`) no painel |

## 6c. Platform Ops
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 03, 10 | Diagnóstico de uma loja para o Master (estado, prontidão, integrações, erros, mudanças, pedidos parados) | READY | `diagnostics.ts`, `/master/stores/[slug]`, `tests/diagnostico-loja` | Sem diagnóstico de rotinas (jobs) nem de provedores por chamada; sem ações seguras (reprocessar, reenviar) | P2 | — | Ligar `job-runs` ao diagnóstico |

## 7. Dados, privacidade e confiabilidade
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 08 | Integridade dos dados | READY | `/master/integridade` | Restrições no banco só após limpo em produção | P1 | dono rodar em produção | Dono |
| 00 | Exportar e excluir dados de cliente | READY | `privacy.ts` | Política de retenção | P1 | dono + jurídico | NEEDS_DECISION (prazo) |
| 10 | Backup e restauração testada | NEEDS_DECISION | Neon | Sem teste de restauração | P1 | dono | F8 |
| 11 | Testes finais (suíte, e2e, carga, concorrência real) | NEEDS_DECISION | modo rápido (D64) | Fase F8 | P1 | dono libera | F8 |

## 8. Inteligência
| Doc | Capacidade | Estado | Evidência | Gap | Prio | Dep. | Próxima ação |
|---|---|---|---|---|---|---|---|
| 12 | Saúde separada de desempenho | READY | `healthScore`, `opportunities` | — | P2 | — | — |
| 12 | Alertas e recomendações | PARTIAL | `buildAlerts` | Recomendação com explicação | P4 | dados | Backlog |

## Totais
READY 28 · PARTIAL 8 · MISSING 6 · CONFLICT 2 · NEEDS_DECISION 12.

## Lotes da noite (ordem)
A trilha de auditoria (FEITO) · B eventos de estoque (StockOut) · C retry limitado para leituras externas · D checklist de primeira venda · E blocos do início com falha isolada · depois testes, mobile e acessibilidade do loop comercial.

## Estado do primeiro loop comercial (verificado em 2026-10-04, navegador local, banco de demonstração)
| Passo | Resultado | Prova |
|---|---|---|
| 1 Criar loja (conta simples, Commerce) | OK | `e2e/conta-simples.mjs` |
| 2 a 4 Criar produto, variantes/SKU, estoque | OK | `e2e/conta-simples.mjs` |
| 5 Publicar produto | OK | `e2e/conta-simples.mjs` |
| 6 Ver a vitrine | OK | `e2e/storefront-journey.mjs`, 6 lojas de demonstração sem rolagem lateral a 360 px |
| 7 a 9 Carrinho, checkout, pagamento (demonstração) | OK | `e2e/jornada-completa.mjs` (atacado + cupom) |
| 10 a 11 Pedido criado e estoque atualizado | OK | `e2e/jornada-completa.mjs`, `tests/estoque-atomico`, `tests/checkout-idempotencia` |
| 12 Operar o pedido no painel (etiqueta, separar, enviar, nota, avaliação) | OK | `e2e/jornada-completa.mjs` |
**Não provado:** pagamento real no Mercado Pago (credencial de teste é do dono), concorrência real em Postgres e carga (F8).
