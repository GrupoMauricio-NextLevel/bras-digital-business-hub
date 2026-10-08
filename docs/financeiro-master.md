# Financeiro Master da NextLevel (D90)

Documento operacional do financeiro corporativo da NextLevel e da fronteira com o financeiro operacional de fornecedores, membros, lojas e parceiros. Escrito **antes** da implementação (inventário e plano) e atualizado ao final (seção "Estado entregue").

## 0. Regra de domínio

| Domínio | Quem administra | O que contém | Onde fica no código |
|---|---|---|---|
| `nextlevel_corporate_finance` | Só o Master (`NEXTLEVEL_MASTER`) | Catálogo e preços da NextLevel, ofertas, planos Commerce, cobranças de setup/plano/tema/serviço, gateways da NextLevel, comissões de parceiros, conciliação, auditoria | `src/lib/finance/catalog*.ts`, `src/lib/domain/corporate-*.ts`, `src/lib/payments/gateway*.ts`, telas `/master/financeiro/**` |
| `tenant_operational_finance` | Cada negócio no próprio painel | Recargas do fornecedor (vão para a conta Mercado Pago **dele**), vendas do membro e da loja (recebidas na conta Mercado Pago **da loja**), saldo, extrato, exportação | `src/lib/domain/wallet.ts`, `orders.ts`, `queries/merchant.ts`, telas `/supplier/finance`, `/supplier/wallets`, `/merchant/finance`, `/merchant/wallet` |

Os painéis que não são o Master só **consomem** o catálogo publicado (preço autorizado, checkout, proposta). Nenhuma tela fora do Master edita preço, regra, gateway, comissão, fatura ou direito de acesso. Cada registro corporativo grava `domain` na trilha `financial_audit_log`.

## 1. Inventário (o que existia antes, com evidência)

### 1.1 Pilha e publicação
- Next.js 16 + Drizzle; produção no Render (Docker), banco Neon Postgres. `start:prod` roda `scripts/bootstrap.ts` (migrações + dados de referência) e depois `next start`. Cada push na branch de publicação publica. Migração com erro: o Render mantém a versão anterior no ar.
- Evidência de versão no ar: `GET /api/health` devolve `version` (commit) e `migration` (última migração aplicada).
- Rotinas: `GET /api/cron/finance` (diária, `CRON_SECRET`) e `/api/cron/expire-reservations`.

### 1.2 Tenants e permissões
- Papéis: `NEXTLEVEL_MASTER`, `SUPPLIER_ADMIN`, `SUPPLIER_DISPATCH`, `STORE_OWNER` (dono ou equipe `STAFF`), `AFFILIATE` (parceiro). `Actor` em `src/lib/domain/access.ts`; `requireRole` nas telas; `isMaster`, `assertCanAccess`, `tenantOf` no domínio.
- Loja SuperDrop: pertence à rede do fornecedor. Loja Commerce (D89): independente, sem fornecedor, dona do catálogo.

### 1.3 Cobrança corporativa existente
| Peça | Arquivo | Estado encontrado |
|---|---|---|
| Tabela de preços (SuperDrop e lojas) | `src/lib/finance/price-book.ts`, `platform_settings.price_book`, editável em Master → Financeiro → Regras e preços | Funciona. **Sem versionamento nem trilha** das alterações |
| Faturas da NextLevel | `finance_invoices` + `nextlevel_payments` | Funciona para setup/plano da loja, mensalidade e fechamento do fornecedor, add-ons, temas e taxa de membro de parceiro |
| Conta Mercado Pago do Master | `platform_settings.nextlevel_mp` (token criptografado), conectada no Master | Pix (`createPixPayment`) e cartão até 6x (Checkout Pro) |
| Webhook corporativo | `/api/webhooks/mercadopago-nextlevel?payment=` ou `?order=` | Corpo ignorado; o pagamento é consultado na API com o token da NextLevel, conferidos referência e valor |
| Liberação após pagamento | `markInvoicePaid` → `fulfillPaidInvoice` (plano: `grantPlanMonths`; add-on/tema: `grantEntitlement`) → comissão do parceiro (`onInvoicePaid`) → e-mail `INVOICE_PAID` | Funciona; **corrida**: duas confirmações simultâneas podiam executar a liberação duas vezes (sem atualização condicional) |
| Loja NextLevel pública | `digital_products` + `nl_orders`, `/loja-nextlevel` | Compra em 1 clique (Pix/cartão até 6x) na conta do Master, CRM no Master |
| Loja NextLevel interna | `services` + `service_orders`, `/merchant/services` e `/supplier/services` | Cards "a partir de" + "Solicitar": vira pedido de orçamento, **sem checkout**, sem jornada, sem landing |
| Parceiros | `partners`, `partner_links`, `partner_commissions` (livro-razão imutável), `partner_payouts`; regras em `platform_settings.partner_settings` | Comissão sobre ativação (setup) e manutenção das lojas indicadas; carência, estorno (`clawback`), saque com aprovação do Master. Só um tipo (`AFFILIATE`) |
| Auditoria | `audit_log` (geral, editável por SQL) | Não cobre preço corporativo; não é só-inserção |

### 1.4 Gateways
- **Mercado Pago:** três usos separados e corretos: conta da NextLevel (cobranças corporativas), conta do fornecedor (recargas, `mercadopago-wallet`), conta da loja (vendas ao cliente final, `mercadopago?store=`).
- **Pagar.me:** não existia nada no repositório (nem SDK, nem rota, nem variável).

### 1.5 Racional de cobrança do SuperDrop (encontrado)
Fonte: `docs/FINANCEIRO.md`, `src/lib/finance/price-book.ts`, `src/lib/domain/finance.ts`, `src/lib/finance/rationale.ts`.
| O quê | De quem | Valor (tabela vigente) | Gatilho | Para onde vai |
|---|---|---|---|---|
| Mensalidade do fornecedor | Fornecedor | Start R$ 497, Growth R$ 997, Scale R$ 1.997 | Dia 1 (cron) | Fatura → Pix na conta MP do Master |
| Taxa de volume | Fornecedor | 3% do custo dos pedidos pagos à Central, mínimo R$ 300/mês | Fechamento do mês | Fatura de fechamento |
| White Label do fornecedor | Fornecedor | Setup R$ 15.000, R$ 2.000/mês, 1,5%, mínimo R$ 500 | Contrato | Fatura |
| Ativação da loja do membro | Membro | Drop manual R$ 0 + R$ 49/mês; Loja SuperDrop R$ 200 + R$ 97; Loja própria R$ 2.000 + R$ 197 | Cadastro / bloqueio | Fatura Pix → libera acesso ao pagar |
| Taxa por pedido do membro | Membro | 5% / 5% / 3% sobre produtos (sem frete) | Fechamento mensal | Fatura `STORE_ORDER_FEES` |
| Comissão de canal | NextLevel → fornecedor | 25% do setup de cada loja nova, após 7 dias | Pagamento do setup | Abatida no fechamento |
| Recarga | Membro → fornecedor | 100% para o fornecedor | Pix na conta MP **do fornecedor** | Nunca passa pela NextLevel |
| Venda ao cliente final | Cliente → membro | 100% para a loja | Pix/cartão na conta MP **da loja** | Nunca passa pela NextLevel |

**Cadeia verificada no código (testes `u1-billing`, `supplier-billing`, `finance-domain`):** fatura → `chargeInvoice` (Pix na conta do Master) → webhook `mercadopago-nextlevel` → `syncNextLevelPayment` (consulta API, confere referência e valor) → `markInvoicePaid` → liberação (`grantPlanMonths`/`grantEntitlement`) → comissão → e-mail → aparece em Master → Financeiro. **Não verificável daqui:** se a conta MP do Master está conectada em produção (o token fica criptografado no banco; o estado aparece em Master → Financeiro NextLevel → Gateways).

## 2. Lacunas encontradas
1. Commerce cobrava com as **ofertas do SuperDrop** (Loja SuperDrop/Loja própria) e lojas independentes não pagavam taxa de plataforma (`storeOrderFeeFor` devolvia 0 para `SUPPLIER_OWN`). Os planos aprovados (Start/Pro/Scale/Enterprise, oferta de entrada) não existiam.
2. Sem catálogo corporativo versionado: preços espalhados (`price_book`, `digital_products`, `services.priceFromCents`, `THEME_CATALOG`).
3. Loja Pronta, Migração, Marketing, White Label de parceiro e Enterprise não existiam como produto.
4. Loja NextLevel interna sem checkout, jornada, estados, landing.
5. Sem Pagar.me; sem camada única de gateway; sem registro de eventos de webhook (deduplicação dependia só do estado da fatura).
6. `markInvoicePaid` sem atualização condicional (risco de liberação e e-mail duplicados em webhooks simultâneos).
7. Parceiros: um tipo só; comissão só sobre planos de loja; sem regra versionada por produto; sem CRM, diagnóstico, catálogo comercial.
8. Sem trilha financeira só-inserção; sem reautenticação para operações sensíveis.
9. Super landing institucional inexistente; o endereço da holding mostrava a home do SuperDrop para visitante.

## 3. Decisões de implementação
- **Aditivo e compatível.** Migração `0042_financeiro_master` só cria tabelas e colunas; nada é apagado nem reinterpretado. Faturas, pagamentos, contratos e acessos antigos seguem com as mesmas regras.
- **Uma fonte da verdade:** `catalog_products` + `catalog_price_versions` (imutáveis; trigger impede UPDATE/DELETE). Preço vigente = maior versão com vigência iniciada. Pedido grava o `price_version_id` e o *snapshot* completo do preço e da regra aplicada.
- **SuperDrop:** a tabela de preços do SuperDrop continua em `price_book` (já editável só pelo Master e usada por contratos vigentes); passa a ter **versão e trilha** em `financial_audit_log` a cada alteração e aparece no catálogo Master como família "SuperDrop" (somente leitura, com link para a edição existente). Não há troca de preço.
- **Pix e cartão:** Pix = base − 10% (`pixDiscountBps`); cartão = base × 1,16 (`cardMarkupBps` 1600) em até 10 parcelas; arredondamento: total do cartão `round(base × 11600 / 10000)`, parcela `ceil(total / n)` com a última ajustada para fechar o total exato. Nunca Pix e acréscimo juntos. Regras por preço (catálogo), não no código.
- **Commerce:** assinatura em `nl_subscriptions` (ciclo `trial → pending_payment → active → past_due → suspended → cancelled/expired`), mantendo `stores.trial_ends_at/paid_until` como trava de acesso (já usada por todas as telas). Oferta de entrada versionada em `catalog_offers`, uma vez por CPF/CNPJ (`offer_redemptions` com chave única). Taxa de plataforma por pedido usa a taxa do plano congelada na assinatura e é zero para pedidos dentro da carência.
- **Gateway:** interface única `PaymentGateway` (`src/lib/payments/gateway.ts`) com adaptadores Mercado Pago (padrão) e Pagar.me. Escolha por produto (`catalog_products.gateway`) → regra global do Master → padrão Mercado Pago. Depois de criada uma cobrança num gateway, a tentativa nunca muda de gateway sozinha.
- **Webhook:** `payment_events` com chave única por evento (deduplicação); o estado é sempre consultado na API do gateway; Pagar.me exige autenticação básica configurada no painel deles.
- **Comissões:** regras versionadas em `commission_rules` (por família/produto, ciclo e tipo de parceiro), base = recebido − desconto − imposto − taxa do gateway; carência 14 dias (digital/assinatura) e 30 dias (serviço/projeto); lançamentos no livro-razão existente `partner_commissions` (novos tipos `SALE`, `RECURRING`). Atribuição: último toque não direto dentro da janela, mas loja já atribuída mantém o parceiro original; autoindicação (mesmo CPF/CNPJ ou mesmo usuário) não comissiona.
- **Operações sensíveis** (novo preço, regra de comissão, gateway, reembolso, exportação): exigem a senha do Master na própria ação (reautenticação). 2FA não existe no sistema e fica como pendência.

## 4. Feature flags (variáveis de ambiente; padrão seguro)
| Variável | Padrão | Efeito |
|---|---|---|
| `FIN_CATALOG_MASTER` | ligado | Catálogo Master e Loja NextLevel em jornada. `false` volta à vitrine de serviços antiga |
| `FIN_COMMERCE_PLANS` | ligado | Cadastro e cobrança Commerce pelos planos novos. `false` volta às ofertas antigas para **novas** lojas (assinaturas já criadas continuam) |
| `FIN_PAGARME` | desligado | Permite escolher Pagar.me em produto/regra. Só liga com credenciais |
| `FIN_PARTNER_COMMISSIONS_V2` | ligado | Comissão por regra versionada nas vendas do catálogo |
| `FIN_PUBLIC_SOLUTIONS` | ligado | Super landing `/solucoes` e landings públicas de produto |

## 5. Plano de reversão
1. **Código:** `git revert <commit>` e push (o Render publica a versão anterior). Ou "Rollback" para o deploy anterior no painel do Render.
2. **Comportamento sem reverter código:** desligar as flags acima no Render (efeito no próximo deploy/reinício).
3. **Banco:** a migração 0042 é só aditiva; a versão anterior do código ignora as tabelas novas. Não é preciso desfazer. Se for preciso remover, usar o ponto de restauração do Neon tirado antes da publicação (não rodar DROP à mão).
4. **Gateway:** desligar `FIN_PAGARME` devolve todas as novas cobranças ao Mercado Pago; cobranças já criadas no Pagar.me continuam sendo confirmadas pelo webhook dele.

## 6. Estado entregue

### 6.1 Arquitetura
- **Corporativo (Master):** `/master/financeiro` (visão executiva com MRR/ARR, recebido, previsto, inadimplência, churn, LTV, ticket; receita por produto, canal, parceiro e gateway), `/catalogo` (produto, versões de preço com senha, publicar/pausar/arquivar), `/ofertas` (oferta de entrada e regras de comissão versionadas, imposto da base), `/assinaturas`, `/pagamentos` (pedidos, tentativas, webhooks, reembolso com senha), `/propostas` (sob consulta e entregas com checklist e aceite), `/parceiros` (tipo do parceiro, carência/liberado), `/gateways` (estado sem segredos, regra global, conciliação), `/superdrop` (racional e fluxo validado), `/jornada` (fases e marcos), `/auditoria` (trilha só-inserção). O antigo `/master/finance` segue como "Financeiro SuperDrop".
- **Operacional (cada negócio):** fornecedor exporta as próprias recargas (`/api/finance/export?tipo=recargas`); lojista vê "Minha operação", "Minha evolução com a NextLevel" e "Oportunidades" em `/merchant/finance` e exporta as próprias vendas (`?tipo=vendas`); parceiro vê só o próprio extrato (pendente, em carência, liberada, paga, cancelada), CRM e catálogo comercial.
- **Código:** domínio em `src/lib/domain/{nl-catalog,corporate-checkout,commerce-plans,corporate-commissions,corporate-sales,corporate-metrics,journey,fin-audit,operational-finance}.ts`; preço em `src/lib/finance/{catalog-pricing,catalog-seed,catalog-labels,flags}.ts`; gateway em `src/lib/payments/{gateway,pagarme}.ts`; ações em `src/app/actions/financeiro.ts`.

### 6.2 Superdrop: relatório
- **Racional encontrado:** seção 1.5 (mensalidade do fornecedor por faixa, taxa de volume com mínimo, White Label do fornecedor, ativação e mensalidade da loja do membro, taxa por pedido, comissão de canal; recargas e vendas nunca passam pela NextLevel).
- **Fluxo validado (código e testes):** fatura → Pix/cartão na conta MP do Master → webhook com consulta à API → quitação → liberação → comissão → e-mail. Testes `u1-billing`, `supplier-billing`, `finance-domain` e os novos `financeiro-master` passam.
- **Falhas corrigidas:** quitação duplicada em confirmações simultâneas (`markInvoicePaid` condicional); tabela de preços sem trilha (agora auditada); Commerce cobrada com ofertas do SuperDrop e sem taxa (agora planos próprios); comissão de assinatura Commerce pela regra antiga de 5% (agora regra versionada 25% + 10% por 12 meses).
- **Pendências externas:** confirmar em `/master/financeiro/gateways` que a conta MP da NextLevel está conectada em produção (o token fica criptografado no banco e não é visível daqui) e fazer uma cobrança controlada de valor baixo para ver o ciclo completo no ar.

### 6.3 Gateways
| | Mercado Pago | Pagar.me |
|---|---|---|
| Código | Implementado (adaptador sobre o cliente já usado em produção) | Implementado (API v5: pedido Pix, checkout hospedado de cartão, consulta, estorno) |
| Testes | Cobrança, webhook duplicado, fora de ordem, referência errada, reembolso | Criação com Idempotency-Key, webhook autenticado, duplicado, de outro gateway |
| Configuração em produção | Depende da conta conectada no Master | **Pendente:** `PAGARME_SECRET_KEY`, `PAGARME_WEBHOOK_USER/PASSWORD`, `FIN_PAGARME=true` e cadastro do webhook no painel Pagar.me |
| Ativo em produção | Não comprovado por esta sessão (sem acesso ao painel/credencial) | Não: falta credencial |

### 6.4 Riscos residuais
- Recorrência é cobrada por fatura (o cliente paga cada ciclo por Pix/cartão); não há débito automático no cartão.
- 2FA não existe; operações sensíveis pedem a senha do Master na própria ação.
- Preços de marketing e consultoria seguem "sob consulta" até o Master publicar versões de preço.
- Matriz de recursos por plano: hoje todos os planos têm os mesmos recursos e diferem na taxa de plataforma; limites por plano dependem de decisão do dono.
