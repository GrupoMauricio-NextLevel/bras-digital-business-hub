# Bônus gamificado: parceiros online e executivos de rua (racional + prompt mestre)

> Estado: **BG1 (D271) e BG2 (D272) NO AR**. BG2: missões da semana, sequência, selos e ranking no painel do parceiro. BG1:
> - motor de bônus;
> - campanhas padrão **ativas**;
> - tela "Bônus e metas" no Master;
> - cartão de progresso no painel do parceiro.
>
> Próximas: BG3 (painel do executivo, junto da CX4) e BG4 (relatório de retorno).

**Pedido do dono (07/11/2026):**
- "Estou preocupado somente com minha margem. Bônus podem existir, mas não podem ser valores que me prejudiquem."
- "Pode existir bônus semanais e mensais; quanto maior o envolvimento, mais precisamos dar benefício."
- "A bonificação dos parceiros online é diferente da dos parceiros de rua."
- "Pensa na margem de comissão que eu já estou dando e vamos pensar nesses gatilhos de engajamento."
- "Já quero ativar esse sistema de bônus gamificado."

> **Muda a D260.** A D260 tirou o bônus em dinheiro do programa. Ele volta **só por campanhas ligadas pelo dono**, com teto de custo por loja, orçamento por período e pagamento apenas de venda **paga e mantida**.

---

## 1. A ideia em uma frase

O bônus é pago **uma vez por loja nova**, sai da margem do primeiro mês e nunca da recorrência. Ele cresce com o volume de vendas (quem vende mais ganha mais por loja), mas tem **um teto por loja** e **um orçamento por campanha** que o sistema não deixa passar.

## 2. Quanto a NextLevel já dá hoje (a comissão)

Regra vigente (D260 a D263):
- **CNPJ:** 20% no nível Inicial, 24% no Prata (10 lojas ativas), 28% no Ouro (25 lojas ativas);
- **CPF:** 5 pontos a menos em cada nível (15%, 19% e 23%);
- vale em **toda mensalidade enquanto a loja paga** (recorrência sem prazo);
- garantia de 30 dias, depois vai para saque;
- a comissão incide sobre o valor pago **menos a taxa de recebimento e o imposto configurado no Master** (hoje o imposto está em **0%**; veja a seção 9).

### 2.1 Margem por loja, por mês

Preços depois da Black (D228): Start R$ 67, Pro R$ 167 e Scale R$ 397 no mensal. Na Black (até 30/11) são R$ 57, R$ 147 e R$ 347.

**Hipóteses** (confirmar com o contador; dá para ajustar no Master):
- imposto de 6% (Simples, serviços de software);
- taxa média de recebimento de 3% (Pix cerca de 1%, cartão cerca de 5%);
- custo de operação de R$ 8 por loja por mês (servidor, banco, e-mail e suporte).

| Plano (mensal) | Preço | Imposto 6% | Taxa 3% | Comissão 20% | Comissão 28% | Custo de operação | **Margem a 20%** | **Margem a 28%** |
|---|---|---|---|---|---|---|---|---|
| Start | R$ 67,00 | R$ 4,02 | R$ 2,01 | R$ 12,19 | R$ 17,07 | R$ 8,00 | **R$ 40,78 (61%)** | **R$ 35,90 (54%)** |
| Pro | R$ 167,00 | R$ 10,02 | R$ 5,01 | R$ 30,39 | R$ 42,55 | R$ 8,00 | **R$ 113,58 (68%)** | **R$ 101,42 (61%)** |
| Scale | R$ 397,00 | R$ 23,82 | R$ 11,91 | R$ 72,25 | R$ 101,16 | R$ 8,00 | **R$ 281,02 (71%)** | **R$ 252,11 (64%)** |

**Leitura:**
- o Start é o plano mais apertado; por isso o teto do bônus é medido nele;
- no Pro e no Scale sobra muito mais margem, e o bônus os premia proporcionalmente, nunca acima da proporção de preço.

### 2.2 Quanto vale uma loja no primeiro ano

Hipótese conservadora para o começo: a loja paga 12 meses.

| Plano | Receita no 1º ano | Comissão no 1º ano (28%, o pior caso) | Margem no 1º ano (28%) |
|---|---|---|---|
| Start | R$ 804 | R$ 204,84 | R$ 430,80 |
| Pro | R$ 2.004 | R$ 510,60 | R$ 1.217,04 |
| Scale | R$ 4.764 | R$ 1.213,92 | R$ 3.025,32 |

## 3. As 5 regras que protegem a margem (o sistema faz cumprir)

1. **Uma vez por loja nova.** O bônus conta só o 1º pagamento de cada loja. Renovação já paga comissão recorrente e nunca dá bônus.
2. **Só venda paga e mantida.** O bônus é calculado **depois da garantia de 30 dias** das vendas do período. Venda estornada ou cancelada na garantia não conta, e cortesia e teste não contam.
3. **Pontos pelo valor pago, não por "loja".** 1 ponto = 1 mensalidade do Start pela tabela de hoje (R$ 67 depois da Black).
   - Pro = 2,5 pontos; Scale ≈ 5,9 pontos.
   - O anual conta a mensalidade equivalente × 1,2, porque entra o dinheiro do ano adiantado.
   - Desconto reduz os pontos sozinho, porque contam o valor pago. Assim o bônus acompanha a margem real de cada venda.
4. **Teto de custo por loja.** Somando **todas** as campanhas ativas de um público, o bônus máximo por ponto não passa de:
   - **50% de uma mensalidade** para os parceiros online;
   - **75%** para os executivos de rua.
   - O Master recusa salvar uma campanha que fure o teto.
5. **Orçamento por período.** Cada campanha tem um teto em reais por semana ou por mês. Quando acaba, quem ainda bateria a faixa fica como "sem orçamento" (registrado, sem pagamento) e o dono vê na tela.

**Prova de que não prejudica** (pior caso: nível Ouro com o bônus máximo):

| Público | Bônus máximo por loja Start | Margem do Start no 1º mês (28%) | Volta em | Comissão + bônus no 1º ano ÷ receita do 1º ano |
|---|---|---|---|---|
| Online | R$ 26,50 (40% de uma mensalidade) | R$ 35,90 | **menos de 1 mês** | **28,8%** |
| Rua | R$ 41,79 (62% de uma mensalidade) | R$ 35,90 | **1,2 mês** | **30,7%** |

**Na Black** (Start a R$ 57), o teto é medido sobre os R$ 57, e as campanhas padrão também cabem:
- online: 46% de uma mensalidade, abaixo do teto de 50%;
- rua: 73%, abaixo do teto de 75%.

A margem do Start de R$ 57 no 1º mês, no nível Ouro, é de R$ 29,35, e o bônus máximo de rua volta em cerca de 1,4 mês.

Os dois ficam abaixo de **35% da receita do 1º ano**, que é o limite saudável recomendado para custo de aquisição em software por assinatura. O resto (mais de 65%) é da NextLevel.

## 4. Online × rua: por que são diferentes

| | **Parceiro online** (link, CPF ou CNPJ) | **Executivo de rua** (equipe NextLevel) |
|---|---|---|
| Esforço | Divulga quando pode; vende pela internet | Dia inteiro na rua, visita, demonstra, recebe dinheiro |
| Custo para a NextLevel | Nenhum além da comissão | Tempo de acompanhamento, prestação de contas |
| O que motivar | Constância (vender toda semana) e escala | Ritmo diário, volume e disciplina (prestar contas em dia) |
| Teto por loja (soma das campanhas) | **50%** de uma mensalidade | **75%** de uma mensalidade |
| Semanal ("ritmo") | Pequeno, para criar o hábito | Maior, porque é o salário de quem está na rua |
| Mensal ("produção") | Escada que premia escala | Escada maior, com as metas do dono |

**"Quanto mais envolvimento, mais benefício"** aparece em três lugares:
1. **Escada progressiva.** O valor **por ponto** sobe a cada faixa. No mês online: R$ 10 por ponto com 3 pontos, R$ 12,50 com 6, R$ 15,83 com 12 e R$ 18 com 25.
2. **Semanal + mensal somam.** Quem vende toda semana leva as duas.
3. **Engajamento sem dinheiro** (missões, sequência, selos, ranking; seção 6). Atividade dá reconhecimento, e venda paga dá dinheiro. Visita registrada nunca vira dinheiro direto, porque daria para inventar visitas.

## 5. As campanhas padrão (ativas desde a BG1)

O valor é o total da faixa mais alta atingida no período, sem somar faixas.

**Parceiros online:**

| Campanha | Período | Faixas (pontos → bônus) | R$ por ponto na faixa mais alta | Orçamento |
|---|---|---|---|---|
| Sprint da semana | Semana (seg a dom) | 2 → R$ 15 · 4 → R$ 34 | R$ 8,50 | R$ 500 por semana |
| Produção do mês | Mês | 3 → R$ 30 · 6 → R$ 75 · 12 → R$ 190 · 25 → R$ 450 | R$ 18,00 | R$ 2.000 por mês |
| **Soma por ponto** | | | **R$ 26,50: 40% de R$ 67 e 46% de R$ 57 (teto 50%)** | |

**Executivos de rua:**

| Campanha | Período | Faixas (pontos → bônus) | R$ por ponto na faixa mais alta | Orçamento |
|---|---|---|---|---|
| Ritmo da semana | Semana | 3 → R$ 40 · 5 → R$ 80 · 8 → R$ 140 | R$ 17,50 | R$ 1.500 por semana |
| Meta do mês | Mês | 10 → R$ 190 · 20 → R$ 440 · 35 → R$ 850 | R$ 24,29 | R$ 5.000 por mês |
| **Soma por ponto** | | | **R$ 41,79: 62% de R$ 67 e 73% de R$ 57 (teto 75%)** | |

**Exemplo de executivo:** 8 Start na semana (8 pontos) dá R$ 140. No mês, 2 Pro + 6 Start por semana são 11 pontos por semana e 44 no mês, o que dá R$ 850 + 4 × R$ 140 = R$ 1.410. Isso para R$ 2.948 por mês de receita nova recorrente (44 × R$ 67), paga de novo todo mês.

## 6. Gatilhos de engajamento (o visual "de jogo")

Os gatilhos vêm de mecânicas conhecidas: progresso visível, meta próxima, prazo, sequência, status e reconhecimento social.

| Gatilho | Como aparece | Fase |
|---|---|---|
| **Barra de progresso até a próxima faixa** | "7 de 8 pontos · falta 1 para R$ 160" | BG1 |
| **Quase lá** | Destaque quando falta 1 ponto ou menos de 20% | BG1 |
| **Contagem regressiva** | "Termina domingo, 23h59" | BG1 |
| **Garantido × em garantia** | Bônus que já passou da garantia × o que ainda depende da garantia | BG1 |
| **Celebração** | Confete e mensagem ao subir de faixa (respeita "reduzir movimento") | BG1 |
| **Missões da semana** | 3 a 5 tarefas (10 visitas, 2 demonstrações, 1 venda) com selo; sem dinheiro | BG2 |
| **Sequência** | Semanas seguidas com venda ("4 semanas sem parar") | BG2 |
| **Selos** | 1ª venda, 5 lojas no mês, 1º Scale, mês sem atraso na prestação de contas, cliente com 6 meses | BG2 |
| **Ranking** | Semana e mês, separados por público, com posição e primeiro nome: "faltam 2 pontos para passar o 3º" | BG2 |
| **Nível** (já existe) | Anel até Prata e Ouro, que aumenta a comissão de toda a carteira | BG2 |
| **Atividade da rua** | Registro de visita e demonstração alimenta missões e ranking de esforço | BG3 |

**Cuidados de texto:**
- nunca prometer ganho ("ganhe R$ X por mês");
- sempre "ao atingir, você recebe", com a regra visível;
- o bônus aparece com a mesma linguagem do extrato.

## 7. Riscos e travas

| Risco | Trava |
|---|---|
| Vender loja que cancela depois do bônus | Bônus só depois da garantia; loja estornada na garantia não conta |
| Vender com desconto para inflar a contagem | Pontos pelo valor pago |
| Venda para si mesmo ou para parente | Loja com o mesmo CPF ou CNPJ do parceiro não conta; o Master vê a origem de cada loja |
| Campanha cara demais | Teto por ponto (soma das campanhas) e orçamento por período, checados ao salvar e ao pagar |
| Mudar a regra no meio do período | Campanha versionada; o período em andamento usa a versão que começou |
| Visita inventada | Atividade só dá selo e missão, nunca dinheiro |

## 8. Decisões do dono (com o padrão aplicado na BG1)

| # | Decisão | Padrão aplicado |
|---|---|---|
| 1 | Teto do custo por loja | Online 50% e rua 75% de uma mensalidade, somando as campanhas |
| 2 | Quando pagar | Depois da garantia de 30 dias das vendas do período |
| 3 | Unidade | Pontos pelo valor pago (Start = 1, Pro = 2,5, Scale ≈ 5,9; anual × 1,2) |
| 4 | Campanhas ligadas | As 4 da seção 5, ativas; o dono edita, pausa e cria outras no Master |
| 5 | Orçamentos | R$ 500 e R$ 2.000 (online); R$ 1.500 e R$ 5.000 (rua) por período |
| 6 | CPF participa? | Sim, nas campanhas online (a comissão já é 5 pontos menor) |

## 9. O que depende do dono

- **Imposto no Master** (Financeiro → configurações): hoje está em 0%, e a comissão é calculada sobre o valor cheio. Com o imposto configurado, a comissão passa a ser calculada sobre o valor líquido e a margem melhora.
- Revisar os valores das campanhas depois das 4 primeiras semanas, com o relatório de retorno (BG4).

---

## 10. Prompt mestre (para implementar em fases)

> Cole numa sessão de trabalho. Leia antes `CLAUDE.md`, a D260 e a D271 em `docs/design/DECISIONS.md`, este documento e `docs/prompts/caixa-balcao-executivos-de-venda.md` (executivos e CX4).

**Contexto técnico:**
- comissão em `src/lib/domain/corporate-commissions.ts` (`recordSaleCommission`, linhas `SALE` = 1º pagamento da loja, `RECURRING` = demais);
- níveis em `src/lib/domain/niveis-parceiro.ts`;
- rotina diária em `runDailyPartnerJobs` (`src/lib/domain/partners.ts`);
- extrato e saque em `partner_commissions` (tipo `BONUS` já existe);
- executivo = `partners.executivo` (D269).

**Regras invioláveis:**
1. O bônus nunca é pago em renovação; só no 1º pagamento de cada loja (linha `SALE`).
2. Só conta venda com a linha `SALE` já liberada (status `AVAILABLE` ou `PAID`), ou seja, que passou da garantia sem estorno.
3. Pontos = (valor-base da comissão do 1º pagamento ÷ meses do ciclo) × (1,2 se anual) ÷ mensalidade do Start na tabela. Usa duas casas.
4. Teto: a soma, por público, do maior R$ por ponto de cada campanha ativa ≤ teto do público (padrão 5000 bps online, 7500 bps rua) × mensalidade do Start. Conferir ao salvar e ao ativar.
5. Orçamento: a soma dos prêmios da campanha no período nunca passa do orçamento. O excedente vira prêmio "sem orçamento", com valor 0 e registrado.
6. Idempotência: um prêmio por (campanha, parceiro, período). O pagamento entra como `partner_commissions` do tipo `BONUS`, `AVAILABLE`, com `dedupeKey` estável.
7. Tudo na auditoria financeira. Texto sem promessa de ganho.

**Fases:**

| Fase | Entrega | Pronto quando |
|---|---|---|
| **BG1** | Tabelas `bonus_campanhas` e `bonus_premios`. Regras puras (`src/lib/finance/bonus-regras.ts`: pontos, faixa, teto, períodos semana e mês, prazo de avaliação). Motor `apurarBonus` na rotina diária. 4 campanhas padrão ativas (semeadas uma vez). Tela Master → Parceiros → **Bônus e metas** (lista, ativar e pausar, editar faixas e orçamento com checagem do teto, gasto do período, quem está perto). Cartão **"Seus bônus"** no painel do parceiro (barra, quase lá, contagem regressiva, garantido × em garantia) | Testes: pontos, teto, orçamento, só venda mantida, idempotência, público online × rua; capturas no celular |
| **BG2** | Missões da semana e selos (sem dinheiro), sequência, ranking por público, celebração | Missões e selos calculados no servidor; axe sem erro |
| **BG3** | Junto da CX4: painel do executivo no celular com os bônus da rua, registro de visita e demonstração alimentando missões e ranking de esforço | e2e do executivo; tudo a 2 toques |
| **BG4** | Relatório de retorno por campanha (lojas novas, receita recorrente nova, custo, custo por ponto, payback) e sugestão automática de ajuste | Totais batem com o extrato e o caixa |
