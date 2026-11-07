# Caixa do Master, recebimentos manuais e executivos de venda (equipe de rua)

> Estado: **PROPOSTA.** Aguarda o dono aprovar as decisões da seção 7.
> Pedido do dono (07/11/2026):
> - "Uma função no Master para ser o balcão do caixa, com opções avançadas de gerenciar as assinaturas e recebimentos, inclusive pagamentos manuais em dinheiro."
> - "Controle do caixa com abas semanais e diárias; todo dia abrir e fechar o caixa e poder editar e controlar de qual meio o pagamento veio."
> - "Liberar um cliente que pagou em dinheiro por meio da nossa equipe de vendedores e gerenciar essas comissões; a equipe de rua tem a mesma comissão dos parceiros online."
> - "Editar em detalhes cada pagamento."
> - "Os vendedores de rua são nossos executivos de venda: veem as suas comissões e prestam contas direto comigo quando o pagamento é em dinheiro. O painel deles precisa ser bem trabalhado para o dia a dia na rua, e motivador."
> - "No Master, dentro de Parceiros, um espaço especial para gerenciar as ações desses vendedores externos."

---

## 1. A ideia em uma frase

Um **caixa de verdade** no Master (abre de manhã, fecha à noite, sabe de onde veio cada real) ligado às **assinaturas** das lojas, e uma **equipe de rua** que vende, recebe em dinheiro, libera o cliente na hora e presta contas ao dono, ganhando a mesma comissão dos parceiros online.

## 2. O que já existe (não refazer)

| Peça | Onde | Uso aqui |
|---|---|---|
| Assinatura da loja (plano, ciclo, período) | `nl_subscriptions` | O pagamento manual renova o período, como o Mercado Pago faz |
| Faturas e "marcar como paga" | `finance_invoices`, `markInvoicePaid` | Base do recebimento; hoje não guarda **meio** nem **quem recebeu** |
| Cobrança Pix e cartão da NextLevel | `nextlevel_payments` | Entra no caixa como meio "Mercado Pago" |
| Parceiro vendedor/representante | `partners.kind = REPRESENTATIVE`, página `/parceiros/vendedores` | O executivo de venda é um parceiro desse tipo, marcado como da equipe |
| Comissão por nível (20/24/28%, CPF 5 pontos a menos) | `recordSaleCommission`, D260 a D263 | A mesma regra vale para o executivo (pedido do dono) |
| Garantia, saldo e saque de comissões | `partner_commissions`, garantia de 30 dias | Comissão do executivo segue o mesmo caminho |
| CRM de parceiros (funil, ficha, segmentos) | Master → Parceiros (D251) | Ganha a aba **Executivos de venda** |
| Auditoria de ações | `recordAudit` | Toda edição de pagamento e de caixa fica registrada |

**Lacunas:**
- não há caixa (abertura, fechamento, saldo, sangria);
- o pagamento não guarda o **meio** (dinheiro, Pix, cartão na maquininha, transferência, Mercado Pago);
- não há pagamento manual que **libere a loja** com o período certo;
- não há dinheiro "na mão do vendedor" nem prestação de contas;
- não há painel próprio para quem vende na rua.

## 3. O caixa do Master ("Caixa")

**Onde:** Master → Receita → **Caixa** (só o dono e a função Financeiro).

**Abas:**
- **Hoje:**
  - caixa aberto ou fechado;
  - saldo inicial;
  - entradas e saídas por meio;
  - saldo esperado em dinheiro;
  - botão **Fechar caixa**.
- **Semana:** os 7 dias lado a lado, total por meio, diferenças de fechamento e o que ainda está com vendedores.
- **Lançamentos:** lista com filtros (dia, meio, origem, vendedor, loja) e exportação para o contador.

**Abrir o caixa:**
- quem abre;
- hora;
- dinheiro inicial na gaveta, que é sugerido pelo fechamento de ontem.

**Lançamento**, cada um com:
- **tipo:** entrada ou saída;
- **meio:** dinheiro, Pix, cartão na maquininha, transferência, Mercado Pago (automático), boleto ou outro;
- **origem:** assinatura, serviço, prestação de contas de vendedor, sangria, reforço, pagamento de comissão, ajuste;
- loja e vendedor (quando houver), valor, data e hora, observação e comprovante (foto, opcional).

**Fechar o caixa:**
- o dono conta o dinheiro;
- o sistema mostra o esperado e a diferença (sobra ou falta), que exige um motivo.

Fechado, o dia fica **travado**. Só o dono reabre, e a reabertura fica no histórico.

**Editar um pagamento:**
- campos editáveis: meio, valor, data, loja, vendedor e observação;
- toda edição pede um **motivo** e guarda o antes e o depois;
- editar um dia fechado reabre esse dia (só o dono).

Os pagamentos pelo Mercado Pago entram sozinhos no caixa do dia como "Mercado Pago". Eles não mexem no dinheiro da gaveta.

## 4. Assinaturas e recebimentos (avançado)

**Onde:** Master → Lojistas → ficha da loja, e Master → Receita → Caixa → **Receber**.

- **Receber manualmente:**
  - escolhe a loja, o plano, o ciclo (mensal ou anual), o meio e o valor; o valor vem do plano e pode ter desconto com motivo;
  - escolhe quem recebeu: o dono, o Financeiro ou um executivo.
  - O sistema:
    1. cria a fatura paga;
    2. renova o período da assinatura, igual ao Mercado Pago;
    3. libera a loja;
    4. lança no caixa;
    5. gera a comissão de quem indicou ou vendeu.
- **Painel de assinaturas:**
  - vencendo em 7 dias;
  - vencidas;
  - em teste;
  - cortesia;
  - pagas em dinheiro;
  - filtros por plano, meio e vendedor.
- **Ações por assinatura:**
  - trocar de plano;
  - trocar o ciclo;
  - dar desconto;
  - estender o vencimento (com motivo);
  - cancelar;
  - estornar um pagamento (desfaz a comissão, como hoje).
- **Histórico da loja:** todos os pagamentos, com meio, quem recebeu e as edições.

## 5. Executivos de venda (equipe de rua)

**Quem é:**
- um parceiro do tipo **vendedor/representante** marcado como **"Executivo NextLevel"**;
- é cadastrado pelo dono, nunca pela página pública;
- a comissão é a do programa (D260 a D263): mesmo nível, mesmo percentual, a mesma garantia de 30 dias e o mesmo saque.

**Venda em dinheiro, passo a passo:**
1. Na loja do cliente, o executivo abre o painel no celular e toca em **Nova venda**. Preenche o cliente (CNPJ ou CPF, WhatsApp), o plano e o ciclo, e marca **Recebi em dinheiro**.
2. O cliente recebe na hora o **recibo digital** pelo WhatsApp: número, valor, plano e o nome do executivo.
3. A loja é liberada na hora.
4. O valor entra como **"dinheiro com o executivo"**. É um saldo que ele deve ao dono, com prazo para entregar.
5. Na **prestação de contas**, o executivo entrega o dinheiro ao dono:
   - o dono confere e dá baixa;
   - o valor entra no caixa do dia como "prestação de contas do executivo".
6. A comissão do executivo nasce com o pagamento, segue a garantia normal e vai para o saque.

**Prazo e travas:**
- dinheiro com o executivo há mais tempo que o prazo vira um **alerta** no Master;
- o executivo fica sem poder registrar novas vendas em dinheiro até prestar contas;
- a loja do cliente **não** é bloqueada por atraso do executivo.

**No Master** (Parceiros → **Executivos de venda**):
- **lista:** cada executivo, vendas da semana e do mês, comissão, **dinheiro na mão** e a última prestação de contas;
- **prestações de contas:** pendentes e feitas, com "Receber agora", que lança no caixa;
- **ações da equipe:** visitas, vendas e testes, por dia, num feed;
- **metas:** por semana e por mês, para cada executivo;
- **ranking** da semana;
- cadastrar, pausar e ver como o executivo.

## 6. O painel do executivo (celular, motivador)

Pensado para a rua: uma mão, letra grande, poucos toques, funciona com sinal fraco.

- **Topo:**
  - "Bom dia, Ana";
  - a meta da semana numa barra ("3 de 5 lojas");
  - a comissão do mês;
  - o nível (Inicial, Prata ou Ouro) e quanto falta para o próximo.
- **Botões grandes:**
  - **Nova venda**;
  - **Registrar visita**;
  - **Meu link** (para o cliente assinar sozinho com Pix ou cartão e a venda contar para ele);
  - **Mostrar a demonstração** (abre a loja de demonstração no celular para o lojista ver).
- **Dinheiro comigo:** quanto ele está segurando, até quando entregar, e o botão "Combinar entrega".
- **Minha agenda:** visitas marcadas, retornos de quem pediu para pensar e testes que acabam esta semana (avisar o lojista).
- **Minhas comissões:**
  - em garantia;
  - disponível;
  - saques;
  - cada venda com o cliente.
- **Ranking da equipe** (só a posição e o primeiro nome dos colegas) e **conquistas**: primeira venda, 5 lojas na semana, mês sem atraso na prestação de contas.
- **Argumentos de bolso:** a aula da base de conhecimento (Comercial: venda direta) resumida em cartões: taxa zero, comparativo e objeções.
- Sem promessa de ganho e sem prêmio em dinheiro fora da regra (D260).

## 7. Decisões do dono (com o padrão recomendado)

| # | Decisão | Padrão recomendado |
|---|---|---|
| 1 | Quem opera o caixa | O dono e a função Financeiro. Só o dono reabre dia fechado |
| 2 | Venda em dinheiro libera a loja na hora? | **Sim**, na hora; o dinheiro fica como saldo do executivo |
| 3 | Prazo para o executivo entregar o dinheiro | **2 dias úteis**; depois vira alerta e trava novas vendas em dinheiro dele |
| 4 | O executivo pode descontar a comissão do dinheiro que recebeu? | **Não**: entrega o valor cheio e recebe a comissão pelo saque normal (controle mais simples e à prova de erro) |
| 5 | Comissão do executivo | Igual à dos parceiros online (20/24/28% CNPJ; 15/19/23% CPF), mesmo nível e garantia |
| 6 | Desconto na venda de rua | Só o dono e o Financeiro; o executivo vende pelo preço da tabela |
| 7 | Metas e ranking | Metas por executivo definidas pelo dono; ranking e conquistas sem prêmio em dinheiro |
| 8 | Recibo para o cliente | Recibo digital pelo WhatsApp em toda venda em dinheiro |
| 9 | Fechamento | Diário (abre e fecha); a aba Semana soma os dias; diferença sempre com motivo |

## 8. Fases (uma de cada vez)

| Fase | Entrega | Pronto quando |
|---|---|---|
| **CX0** | Dados: caixa do dia, lançamentos com meio e origem, histórico de edição, executivo e prestação de contas. Regras puras (saldo esperado, diferença, prazo) | Testes das regras; migração provada sobre o banco antigo |
| **CX1** | **Caixa no Master:** abas Hoje, Semana e Lançamentos; abrir e fechar; sangria e reforço; editar com motivo; Mercado Pago entrando sozinho | e2e abre, lança, fecha e reabre; capturas 360/1440 |
| **CX2** | **Receber manualmente** (qualquer meio) renovando a assinatura e liberando a loja; painel de assinaturas (vencendo, vencidas, em dinheiro); ações por assinatura; histórico da loja | Pagamento em dinheiro renova o período e gera a comissão certa; estorno desfaz |
| **CX3** | **Executivos no Master:** cadastro, aba em Parceiros, venda em dinheiro registrada pelo executivo, recibo, dinheiro com o executivo, prestação de contas que lança no caixa, alertas e travas | e2e: executivo vende em dinheiro, loja liberada, dono recebe a prestação, caixa e comissão batem |
| **CX4** | **Painel do executivo** no celular: meta, botões grandes, agenda, comissões, ranking, conquistas, argumentos de bolso | Capturas no celular; axe sem erro; tudo a no máximo 2 toques |
| **CX5** | Relatórios: semana e mês por meio, por executivo e por plano; exportação para o contador; aulas novas na base de conhecimento | Totais do relatório = caixa = faturas |

## 9. Cuidados

- Dinheiro em centavos; nada de número digitado à mão nas telas (vem da regra do sistema).
- Permissão no servidor:
  - o executivo só vê os próprios clientes, vendas e comissões;
  - o caixa é só do dono e do Financeiro.
- Nada se apaga:
  - lançamento errado se **estorna** ou se **edita com motivo**;
  - o histórico guarda o antes e o depois.
- O pagamento pelo Mercado Pago continua valendo só depois de conferido na API.
- Recibo e telas sem dado sensível além do necessário (CPF mascarado).
- Cada fase entra na base de conhecimento (D264): trilhas Financeiro e Comercial.
