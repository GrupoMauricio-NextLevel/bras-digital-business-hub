# Financeiro da NextLevel

Módulo em **Master → Financeiro** (`/master/finance`) com seis abas: Visão geral, Mapa de receitas, Simulador, Contratos, Faturas e fechamento, Regras e preços. Fiscal (notas e tributos) está fora do escopo por decisão atual.

## Decisões comerciais implementadas

| Tema | Regra |
|---|---|
| Fornecedor SuperDrop | Mensalidade por faixa (Start R$ 497, Growth R$ 997, Scale R$ 1.997) paga antes de usar, mais taxa de 3% sobre o custo dos pedidos com pagamento à Central confirmado, com mínimo de R$ 300 por mês |
| Fornecedor White Label | Setup de R$ 15.000, manutenção de R$ 2.000 por mês, taxa de 1,5% e mínimo de R$ 500 |
| Parceiro fundador | Isenção de mensalidade e setup por 90 dias e preço de lista travado por 12 meses. A taxa de volume e o mínimo continuam valendo |
| Loja do lojista | Paga direto à NextLevel antes da liberação: Drop manual R$ 0 de setup e R$ 49 por mês, Loja SuperDrop R$ 200 e R$ 97, Loja própria R$ 2.000 e R$ 197. A primeira mensalidade vai junto do setup |
| Comissão do canal | 25% do setup de cada loja nova, liberada 7 dias após o pagamento e abatida da fatura de fechamento. Estorno cancela, ou debita o saldo se já creditada |
| Recargas | Vão para a conta Mercado Pago do fornecedor. A NextLevel nunca guarda saldo de terceiros |
| Cobrança | Antecipada para setup e mensalidade. Taxa de volume no fechamento do mês, vencimento no dia 5 |
| Inadimplência | Aviso em 1 dia. Bloqueio parcial em 10 dias, sem pedidos e lojas novas mas com expedição de pedidos pagos. Suspenso em 15 dias. Encerrado em 30 |

Todos os valores ficam na tabela de preços editável em **Regras e preços**. Cada fornecedor tem contrato próprio, que nasce da tabela e pode ser negociado em **Contratos**.

## Como o dinheiro é calculado

- **Base da taxa:** soma de `costTotalCents` dos pedidos com `centralPaymentStatus = PAID`, não cancelados, com `centralPaidAt` dentro da competência (UTC).
- **Fechamento:** taxa de volume, mais complemento até o mínimo, menos comissões elegíveis, menos saldo a favor. Se o resultado for negativo, a fatura é R$ 0 e a diferença vira saldo para o mês seguinte.
- **Faturas** (`finance_invoices`): setup e mensalidade do fornecedor, fechamento mensal e ativação de loja. Cada uma guarda as linhas que compõem o valor.
- **Acesso:** `refreshSupplierAccess` marca faturas vencidas e ajusta o estado do fornecedor. O estado é aplicado em `createOrder`, `createStore`, `createProduct`, expedição e login.

## Rotinas

- `GET /api/cron/finance` (Authorization: Bearer `CRON_SECRET`), uma vez por dia. No dia 1 (UTC) emite as mensalidades e fecha o mês anterior. Todos os dias atualiza atrasos e bloqueios.
- `GET /api/cron/expire-reservations`, a cada 5 a 10 minutos, libera estoque de pedidos online não pagos.
- Pelo painel, o Master também pode emitir mensalidades, fechar uma competência e confirmar recebimentos manualmente.

## Simulador

Aba **Simulador**: fornecedores configuráveis (modelo, faixa, isenção, lojas iniciais, lojas novas por mês e custo pago à Central por loja), mix de ofertas, cancelamento, templates e serviços. Mostra resultado, receita recorrente, comissões, custos, gráficos de receita por origem e de resultado acumulado, sensibilidade e tabela mensal com exportação em CSV. Os preços podem ser alterados só no cenário, sem mexer na tabela real.

## Pendências conhecidas

- Recebimento de setup e mensalidades é confirmado manualmente pelo Master. O checkout na conta Mercado Pago da NextLevel é a próxima etapa.
- Recarga automática do lojista na conta do fornecedor ainda depende da confirmação manual do pagamento à Central.
- Templates, serviços, excedentes, domínio e comissão de frete estão mapeados, mas ainda sem cobrança no sistema.
