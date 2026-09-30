# Prompt de desenvolvimento: Programa de Parceiros Oficiais SuperDrop / NextLevel

> Cole este documento como instrução de trabalho. Ele é executável por fases (PA0 a PA7). Antes de codar, leia `AGENTS.md`, `docs/design/DECISIONS.md` (D1 a D23), `docs/PLANOS.md` e `docs/MAPA.md`. Responda e registre as decisões em `docs/design/DECISIONS.md` (D24 em diante).

## 0. CONTEXTO
SuperDrop é um sistema de tecnologia desenvolvido pela **NextLevel Marketing Ltda**. Já existem: painéis por papel (Master, Fornecedor, Expedição, Membro), cadastro público com plano e Pix, teste de 7 dias com cupom (um por CPF/CNPJ), bloqueio e liberação automática, tabela de preços (`platform_settings`, `getPriceBook`), faturas da NextLevel (`finance_invoices`, `markInvoicePaid`, `fulfillPaidInvoice`), aquisição de loja com comissão de canal (`store_acquisitions`, garantia, estorno) e portal público.

## 1. O QUE É O PROGRAMA
Vendemos uma **oportunidade de negócio**: um sistema pronto de loja online sem estoque, que a pessoa passa a divulgar como negócio próprio. O parceiro oficial indica pessoas para assinar os planos e ganha **renda extra** por comissão. Vertentes do programa (esta rodada implementa a primeira; as demais ficam preparadas no modelo):
1. **Afiliados** (esta rodada): divulgam links e cupons de 7 dias e comissionam sobre setup e mensalidades dos planos dos membros que trouxerem.
2. Outras vertentes (a definir com o dono; não implementar): p. ex. parceiros de implantação e agências. Deixe `partners.kind` como enum extensível (`AFFILIATE` por enquanto).

## 2. REGRAS DE NEGÓCIO (já decididas pelo dono)
- **Cadastro gratuito**, mas o parceiro precisa **ativar 1 novo cliente por mês** para continuar gratuito.
- **Ativação** = uma loja indicada que **paga** o primeiro pagamento (setup + primeira mensalidade, ou a primeira mensalidade no Drop manual). Teste de 7 dias não conta até virar pagamento.
- **Comissão sobre o setup, progressiva pelas ativações do mês:**
  - de 1 a 4 ativações: **15%**
  - de 5 a 9 ativações: **20%**
  - **10 ou mais** ativações: **25%** (o dono escreveu "acima de 10"; trate 10 como faixa de 25% e registre isso em D24 para confirmação)
- **Comissão de manutenção:** **5% fixo** sobre cada mensalidade paga pelo cliente indicado, todo mês.
- Comissão só sobre o **valor efetivamente pago** (sem frete, sem taxa por pedido, sem serviços da Loja NextLevel, sem temas). Estorno ou cancelamento **devolve** a comissão.
- O painel dos afiliados tem **links rastreáveis de venda**, **cupons de 7 dias**, **financeiro com comissões e solicitação de saque**.
- Precisa de uma **página de captação de afiliados** destacando a oportunidade.

## 3. DECISÕES QUE VOCÊ DEVE PROPOR COM PADRÃO RECOMENDADO (não bloqueie; registre em D24 e siga o padrão)
| # | Ponto | Padrão recomendado |
|---|---|---|
| 1 | A faixa (15/20/25%) vale por mês civil ou acumulado? | **Por mês civil**, apurada no fechamento do mês sobre as ativações do mês; durante o mês a comissão provisória usa a faixa atual e o fechamento faz o ajuste (acerto positivo ou negativo) |
| 2 | Duração dos 5% de manutenção | Enquanto a loja indicada estiver pagando e o parceiro estiver ativo |
| 3 | O que acontece sem 1 ativação no mês | Parceiro fica **INATIVO**: links e cupons pausam e ele não capta novos clientes; **continua recebendo as comissões já geradas e a manutenção** e vê o financeiro. Reativa ao fazer 1 ativação (por link direto) ou pagando a taxa de manutenção do programa (valor a definir; deixar configurável e desligado) |
| 4 | Garantia antes de liberar saque | Usar `channel.guaranteeDays` (comissão fica PENDENTE e vira DISPONÍVEL depois da garantia) |
| 5 | Saque mínimo e frequência | R$ 100 e 1 pedido por semana (configuráveis); pagamento por Pix para chave do mesmo CPF/CNPJ do parceiro |
| 6 | Atribuição | **Cupom do parceiro tem prioridade**; senão o **último link** clicado em até **30 dias** (cookie próprio `nl-ref`); a atribuição grava na loja no cadastro e **nunca muda** |
| 7 | Fornecedor da loja indicada | O cadastro pelo link do parceiro sem fornecedor exibe a **lista de fornecedores** (como hoje). Se a loja vier de um cupom/página de fornecedor, o fornecedor é o daquela página e o parceiro **também** é creditado (atribuição de parceiro e de fornecedor coexistem) |
| 8 | Comissão do fornecedor (fundadores) e do parceiro | Independentes: a do parceiro é paga pela NextLevel e **não reduz** a do fornecedor |
| 9 | Autoindicação | Bloquear: mesmo CPF/CNPJ, e-mail ou dispositivo do parceiro não gera comissão (marca `FRAUD_REVIEW`) |
| 10 | Um nível só | **Sem comissão sobre outros parceiros** (nada de indicação de afiliado que gera ganho em cascata): só vendas de planos a lojistas. Isso evita risco jurídico de pirâmide |

## 4. MODELO DE DADOS (Drizzle, uma migração `0013_partners.sql` por fase)
- `partners`: `id`, `userId`, `kind` (`AFFILIATE`), `code` (único, 4 a 20 caracteres, letras e números), `displayName`, `taxId` (CPF/CNPJ só dígitos, único), `phone`, `pixKeyEnc` (criptografada como os tokens do Mercado Pago), `status` (`PENDING`, `ACTIVE`, `INACTIVE`, `SUSPENDED`), `termsVersion`, `termsAcceptedAt`, `createdAt`.
- `partner_links`: `id`, `partnerId`, `slug` (curto, único), `label`, `campaign` (UTM), `planKey?`, `clicks`, `createdAt`. Rota pública `/r/[slug]` grava o clique, define o cookie e redireciona para `/cadastro?ref=CODE&plano=…`.
- `partner_clicks`: `id`, `linkId`, `at`, `ipHash`, `uaHash` (nunca o IP puro; LGPD), `landed` (bool).
- `coupons` (já existe): passa a aceitar dono parceiro: `partnerId` nulo por padrão e `supplierId` opcional (um dos dois obrigatório). Cupom de parceiro: 7 dias, código único, limite opcional.
- `stores`: `partnerId?`, `attributedVia` (`LINK`, `COUPON`), `attributedAt`.
- `partner_commissions` (livro-razão, imutável; correções por lançamentos novos): `id`, `partnerId`, `storeId`, `invoiceId`, `kind` (`SETUP`, `MAINTENANCE`, `ADJUSTMENT`, `CLAWBACK`), `baseCents`, `rateBps`, `amountCents`, `period` (YYYY-MM), `status` (`PENDING`, `AVAILABLE`, `PAID`, `VOID`), `availableAt`, `dedupeKey` único.
- `partner_month_status`: `partnerId`, `period`, `activations`, `tierBps`, `closedAt`, `metGoal`.
- `partner_payouts`: `id`, `partnerId`, `amountCents`, `pixKeySnapshot`, `status` (`REQUESTED`, `APPROVED`, `PAID`, `REJECTED`), `requestedAt`, `decidedBy`, `paidAt`, `receiptNote`.
- `partner_settings` dentro de `platform_settings` (zod): faixas `[ {min:1,max:4,bps:1500}, {min:5,max:9,bps:2000}, {min:10,bps:2500} ]`, `maintenanceBps: 500`, `attributionDays: 30`, `guaranteeDays`, `minPayoutCents: 10000`, `payoutsPerWeek: 1`, `inactiveFeeCents: 0`. **Nada de percentual fixo no código.**

## 5. DOMÍNIO (`src/lib/domain/partners.ts`, puro e testável)
- `tierFor(activations, settings)` → `{ bps, next?: { needed, bps } }`.
- `recordActivation(db, invoice)`: chamado por `fulfillPaidInvoice` quando a fatura de ativação (`STORE_SETUP`) é paga e a loja tem `partnerId`. Idempotente por `dedupeKey`. Cria comissão `SETUP` provisória com a faixa atual sobre **a linha de setup** (sem a primeira mensalidade) e comissão `MAINTENANCE` de 5% sobre a primeira mensalidade.
- `recordMaintenance(db, invoice)`: fatura `STORE_PLAN` paga → 5% sobre o valor da mensalidade (todos os meses seguintes).
- `closeMonth(db, period)`: apura as ativações do mês por parceiro, aplica a faixa final e lança `ADJUSTMENT` (positivo ou negativo) nas comissões `SETUP` do mês; marca `metGoal` e ativa ou inativa o parceiro (regra 3). Integrar ao fechamento diário já existente (`runDailyFinanceJobs`).
- `releaseCommissions(db, now)`: `PENDING` → `AVAILABLE` depois da garantia.
- `clawback(db, invoiceId)`: estorno/cancelamento gera `CLAWBACK`; se já `PAID`, vira saldo negativo a compensar no próximo saque.
- `requestPayout` (saldo `AVAILABLE` ≥ mínimo, dentro do limite semanal, chave Pix do próprio CPF/CNPJ, parceiro ativo ou inativo mas não suspenso), `approvePayout`, `markPayoutPaid`, `rejectPayout` (devolve o saldo).
- `attribute(db, { storeId, code?, refCookie?, couponCode? })` no cadastro: aplica as regras 6, 7 e 9.
- Todas as regras com testes unitários: faixas nos limites 1, 4, 5, 9, 10; ajuste de fim de mês; estorno; garantia; autoindicação; idempotência; permissões (parceiro só vê o que é dele).

## 6. TELAS E ROTAS
### 6.1 Página pública de captação `/parceiros` (portal, nova; copy própria, sem falar de fornecedor)
Herói "Tenha um negócio próprio vendendo tecnologia que já funciona", **calculadora de ganhos** (ativações no mês → faixa, comissão sobre setup e manutenção acumulada em 12 meses, com o aviso "simulação, não é garantia de ganhos"), tabela das três faixas, como funciona em 4 passos (cadastre-se, receba seus links e cupons, indique, receba), o que o parceiro recebe (escritório virtual, links rastreáveis, cupons de 7 dias, materiais, financeiro e saque), regra de manter 1 ativação por mês, FAQ e botões **Quero ser parceiro** (`/parceiros/cadastro`) e **Entrar** (`/login`). Link no menu e no rodapé do portal. SEO e JSON-LD.
### 6.2 Cadastro `/parceiros/cadastro`
Nome, e-mail, senha, CPF/CNPJ (validado, único), telefone/WhatsApp, chave Pix (opcional agora), **aceite dos termos do programa (versão registrada)**. Cria usuário com o novo papel `AFFILIATE`, parceiro `ACTIVE` (aprovação do Master opcional, configurável) e código único. Envia para `/partner`.
### 6.3 Escritório virtual `/partner` (novo papel, novo clima visual "parceiro", mesmo design system v3 e menu agrupado)
- **Início:** saudação; KPIs com variação (cliques, cadastros, testes, ativações no mês, comissão do mês, saldo disponível); **barra de progresso da faixa** ("faltam 2 ativações para 20%"); aviso claro da **meta do mês** (1 ativação) com prazo e situação (ativo/inativo); funil do mês; gráfico de comissões por dia.
- **Links:** link principal com QR code e botão de copiar/compartilhar no WhatsApp; criar links por campanha e por plano; cliques, cadastros e ativações por link; textos prontos.
- **Cupons:** criar cupons de 7 dias (código próprio, limite opcional), copiar link com cupom, usos e conversões.
- **Indicados:** tabela com loja (nome mascarado até virar pagante), origem (link ou cupom), etapa (cadastro, teste, pagante, bloqueado, cancelado), data e comissão gerada.
- **Financeiro:** saldo pendente, disponível e pago; extrato de comissões (setup e manutenção, faixa aplicada, mês); **solicitar saque** (valor, chave Pix), histórico de saques com status; regras de garantia visíveis.
- **Materiais:** banners, textos e vídeos (upload do Master), com regras de uso da marca.
- **Perfil:** dados, chave Pix, termos aceitos, segurança.
### 6.4 Master (`/master/partners`)
Lista com filtros e visões salvas (ativos, inativos, em revisão), detalhe do parceiro, fila de **saques** (aprovar, marcar pago com comprovante, rejeitar), fila de **antifraude**, ajuste manual de comissão com motivo, configuração das faixas e regras (`partner_settings`), relatório mensal e exportação CSV.
### 6.5 Rodapé com a logo NextLevel
Já entregue (`NextLevelSignature`): "SuperDrop é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda." Manter em todas as páginas públicas novas (`/parceiros`, `/parceiros/cadastro`, `/r/*`).

## 7. SEGURANÇA, PRIVACIDADE E CONFORMIDADE
- Autorização por papel no servidor em toda ação; o parceiro nunca vê dado de cliente além do necessário (nome da loja mascarado, etapa e valores da própria comissão). Sem e-mail, telefone ou CPF do indicado.
- Chave Pix criptografada (mesmo utilitário dos tokens); saque só para o mesmo CPF/CNPJ do cadastro.
- Rate limit em cadastro, `/r/[slug]` e criação de cupom; `ipHash` com sal; cookie `nl-ref` `HttpOnly`, `SameSite=Lax`, 30 dias, com aviso de cookies.
- Termos do programa versionados e aceite registrado; texto sem promessa de renda ("simulação", "os ganhos dependem das suas vendas"). Pedir revisão jurídica e contábil antes do lançamento (nota fiscal ou RPA, retenções, MEI, pessoa física).
- Auditoria: todo lançamento e toda decisão de saque gravam evento (`domain_events`).

## 8. FASES (cada fase fecha com lint, tipos, testes, build, e2e, capturas e commit)
- **PA0 Fundação:** migração, configurações, papel `AFFILIATE`, `nav.ts`, layout e clima visual do painel, testes de `tierFor`.
- **PA1 Cadastro e captação:** `/parceiros`, `/parceiros/cadastro`, termos versionados, rodapé; e2e do cadastro.
- **PA2 Links e atribuição:** `/r/[slug]`, cookie, atribuição no `/cadastro`, cupons de parceiro, autoindicação; e2e clique → cadastro → atribuição.
- **PA3 Comissões:** ativação, manutenção, garantia, estorno, fechamento do mês e regra de meta; integração com `fulfillPaidInvoice`; e2e compra → comissão pendente.
- **PA4 Escritório virtual:** Início, Links, Cupons, Indicados, Financeiro (extrato), com dados reais.
- **PA5 Saques:** solicitação, fila no Master, pagamento e extrato.
- **PA6 Master e antifraude:** lista, detalhe, configuração, relatórios e CSV.
- **PA7 Acabamento:** estados vazios, acessibilidade (axe), celular em 4 larguras, textos, documentação (`docs/design/DECISIONS.md` D24, `docs/PLANOS.md`, `docs/MAPA.md`).

## 9. ACEITE
- Um parceiro novo se cadastra, recebe link e cupom, um lojista entra pelo link, paga e o parceiro vê a comissão **pendente**; após a garantia, **disponível**; consegue **solicitar saque** e o Master **paga**.
- As faixas 15%, 20% e 25% são calculadas nos limites (1, 4, 5, 9, 10) e o fechamento do mês ajusta; a manutenção de 5% aparece todo mês pago.
- Sem ativação no mês, o parceiro fica inativo e os links pausam, mas o financeiro continua.
- Estorno devolve a comissão; autoindicação não gera comissão.
- Nenhum dado pessoal do indicado aparece para o parceiro; axe sem violações graves; sem rolagem horizontal em 390 px; logo NextLevel no rodapé das páginas públicas.

## 10. FORA DE ESCOPO NESTA RODADA
Comissão em cascata (parceiro indicando parceiro), outras vertentes além de afiliados, pagamento automático de saque por API (o saque é manual pelo Master nesta rodada), emissão automática de nota fiscal, aplicativo móvel, e-mail transacional (entra com o P1-6; até lá, avisos no painel).
