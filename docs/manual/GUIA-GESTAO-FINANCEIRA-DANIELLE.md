# 💼 Guia da Gestão Financeira do Grupo NextLevel

> **Para:** Danielle Terceiro · **Objetivo:** entender, acompanhar e avaliar todo o dinheiro que passa pelo sistema: o que o grupo cobra, de quem, quando, como confere e onde decide.
> **Ambiente:** demonstração (dados fictícios, pagamentos simulados) · **Escrito em:** 12/10/2026

---

## Como usar este guia

Este guia é um curso em **6 módulos**. Cada módulo tem:
- **o conceito** (o que é e por que importa, em linguagem simples);
- **as telas** onde isso aparece, com o link, o que observar e uma pergunta para responder;
- **um exercício prático** no ambiente de demonstração.

No fim existe uma **Ficha de Observação** e um modelo de **relatório**. As suas anotações vão virar decisões e melhorias no sistema: entregue o relatório ao Mauricio, que repassa ao Claude.

**Ritmo sugerido:** um módulo por sessão de 60 a 90 minutos. Em duas semanas você terá visto todo o lado financeiro.

| Módulo | Assunto | Tempo |
|---|---|---|
| 1 | O mapa do dinheiro: de onde vem a receita do grupo | 60 min |
| 2 | O Financeiro do Master: visão executiva, preços e propostas | 90 min |
| 3 | Cobrança, pagamentos, assinaturas e conferência | 90 min |
| 4 | Parceiros, comissões e o ecossistema | 60 min |
| 5 | O dinheiro visto pelos clientes (lojista, fornecedor, Brás, Cargas) | 90 min |
| 6 | Rotinas de gestão: dia, semana e fechamento do mês | 60 min |

---

## Antes de começar

### Onde entrar
- **Endereço do ambiente de demonstração:** https://nextlevel-demo.onrender.com/login (ou, no computador do Mauricio, http://localhost:3100/login).
- Na tela de entrada, abra **"Perfis de demonstração"** e clique no perfil desejado: você entra com um clique. **Senha de todos:** `demo1234`.
- A faixa amarela "Ambiente de demonstração · Mercado Pago e Pix SIMULADOS" e o botão **"Demo"** no topo dos painéis confirmam que você está na demonstração. **Tudo aqui é fictício**: pode apertar qualquer botão.
- A primeira página do dia pode demorar até 1 minuto (o ambiente "acorda"). Não é defeito.

### Os seus perfis
| Perfil | E-mail | Para quê |
|---|---|---|
| **Danielle · Master** | `danielle.master@familia.demo` | Ver **tudo**: todas as marcas, todo o financeiro, todas as regras |
| **Danielle · Financeiro do Master** | `danielle.financeiro@familia.demo` | Ver o que um **funcionário do financeiro** enxerga (acesso limitado) |
| **Danielle · Lojista SuperDrop** | `danielle.lojista@familia.demo` | O dinheiro do ponto de vista de quem tem loja no SuperDrop |
| **Danielle · Loja Commerce** | `danielle.commerce@familia.demo` | O dinheiro de quem tem loja na NextLevel Commerce |
| **Danielle · Fornecedor** | `danielle.fornecedor@familia.demo` | O dinheiro do fornecedor (recargas, faturas) |
| **Danielle · Importadora** | `danielle.importadora@familia.demo` | O lado da importadora na Brás Digital |
| **Danielle · Transportadora** | `danielle.transportadora@familia.demo` | O extrato de quem faz o frete |
| Parceira (perfil de demonstração) | `parceira@demo.superdrop.com.br` | Comissões do programa de parceiros |
| Membro Brás (perfil de demonstração) | `membro@bras.demo` | O que o comprador da Brás paga |

> Para trocar de perfil sem sair: botão **"Demo"** no topo → escolha o perfil.

### Três regras do sistema que valem para todo o guia
1. **O dinheiro do cliente final não passa pela NextLevel.** Quando alguém compra numa loja, o pagamento vai **direto** para a conta Mercado Pago do lojista (ou do fornecedor). A NextLevel cobra **só o que é dela** (planos, taxas, serviços), em **fatura separada**.
2. **Nenhum pagamento vale até ser conferido no Mercado Pago.** O sistema não confia no aviso que chega; ele vai ao Mercado Pago e confirma. E o mesmo pagamento nunca é contado duas vezes.
3. **Regra de negócio não fica "escondida no código".** Preços, taxas, comissões e prazos ficam em telas de configuração do Master, com **histórico de versões**: dá para saber o que valia em cada data.

---

# Módulo 1: O mapa do dinheiro

## 1.1 As marcas e o que cada uma fatura

| Marca | Quem paga | O que paga à NextLevel | Onde aparece |
|---|---|---|---|
| **SuperDrop** | Lojistas e fornecedores | Mensalidade do plano, **taxa por pedido**, taxa de implantação (setup) do fornecedor, taxa sobre volume do fornecedor | Master → Financeiro → **Operação SuperDrop** |
| **NextLevel Commerce** | Donos de loja | **Plano** (mensal ou anual) + **taxa de plataforma** (um percentual das vendas) | Financeiro → Assinaturas; Admin Commerce → Assinaturas |
| **Loja NextLevel / Soluções** | Qualquer cliente | **Temas** (pagos uma vez), **serviços** (Loja Pronta, Migração, tráfego, consultoria) | Master → CRM Loja NextLevel; Financeiro → Pagamentos |
| **Brás Digital** | Membros (compradores) e importadoras | Planos de acesso, análises pagas, **comissões** sobre pedidos | Estúdio Brás → Comissões e Acesso |
| **NextLevel Cargas** | Transportadoras e ônibus | **Comissão** sobre o frete (quando ligada) | Estúdio Brás → Ônibus de excursão e Transportadoras |

## 1.2 O caminho do dinheiro numa venda do SuperDrop (exemplo)

```
1. Cliente compra uma camisa por R$ 100,00 na loja "Arena 10"
        └─► R$ 100,00 caem direto na conta Mercado Pago do LOJISTA

2. O lojista mantém SALDO recarregado por Pix (ex.: recarregou R$ 500,00)
        └─► a recarga vai para a conta do FORNECEDOR

3. A cada pedido, o custo do produto sai do saldo (ex.: R$ 55,00)
        └─► saldo do lojista: R$ 500,00 → R$ 445,00

4. O fornecedor separa e envia ao cliente

5. A NextLevel fatura à parte:
        lojista: mensalidade + taxa por pedido
        fornecedor: mensalidade/setup + taxa sobre o volume
```

**Margem bruta do lojista nesse pedido:** R$ 100,00 − R$ 55,00 = R$ 45,00, antes da taxa do Mercado Pago, da taxa por pedido e da mensalidade.

## 1.3 Conceitos que você vai ver nas telas

| Termo | Explicação simples |
|---|---|
| **Receita recorrente (MRR)** | O que entra todo mês de forma previsível (mensalidades e planos) |
| **Receita variável** | O que depende do movimento (taxas por pedido, percentual sobre vendas, comissões) |
| **Setup (implantação)** | Valor cobrado uma vez para começar |
| **Taxa de plataforma** | Percentual sobre as vendas da loja Commerce. Aparece às vezes em "bps": 100 bps = 1% |
| **Ticket médio** | Valor médio de cada pedido |
| **Inadimplência** | Faturas vencidas e não pagas |
| **Bloqueio por atraso** | Depois de X dias de atraso, o acesso é pausado até pagar (com aviso) |
| **Carência** | Tempo de espera antes de liberar uma comissão (caso o cliente desista ou peça estorno) |
| **Estorno** | Devolução de um pagamento; comissão ligada a ele é cancelada |
| **Gateway** | Empresa que processa o pagamento (Mercado Pago, Pagar.me) |
| **Conciliação** | Conferir se o que o sistema diz que recebeu bate com o que o banco/gateway diz |
| **Competência × caixa** | Competência = mês a que a cobrança se refere; caixa = dia em que o dinheiro entrou |
| **Centavos** | O sistema guarda todo valor em centavos (R$ 49,90 = 4990) para nunca errar arredondamento |

### ✍️ Exercício 1
Com as suas palavras, escreva numa folha: **"De onde vem o dinheiro do grupo, em 5 linhas."** Guarde: no fim do curso, compare com o que você escreveria depois de ver tudo.

---

# Módulo 2: O Financeiro do Master

> **Perfil:** `danielle.master@familia.demo` · **Entrada:** menu da esquerda → grupo **Negócio** → **Financeiro NextLevel**
> As telas do financeiro têm **abas no topo** (Visão executiva, Preços do grupo, Descoberta, Proposta de preço, Experimentos, Catálogo e preços, Ofertas e comissões, Assinaturas, Pagamentos, Operação SuperDrop…). Role as abas para o lado se não couberem.

### 2.1 Visão executiva
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro
- **O que é:** o painel de bordo do dinheiro do grupo: receita, o que está em aberto, tendências.
- **Por que importa:** é a primeira tela que um gestor deve abrir no dia.
- **Observe:** quais números aparecem primeiro? Há comparação com o mês anterior? Dá para saber em 10 segundos se o mês está bom ou ruim?
- **Pergunta para anotar:** *que número eu sinto falta nesta tela?*

### 2.2 Preços do grupo
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/precos
- **O que é:** a **tabela única de preços** de todas as marcas (fonte única: se o preço muda aqui, muda no sistema inteiro).
- **Por que importa:** evita que o site diga um preço e a cobrança outro.
- **Observe:** os preços estão organizados por marca? Fica claro o que é mensal, anual e cobrança única? Existe alguma divergência sinalizada?
- **Exercício:** encontre o plano mais barato e o mais caro de cada marca.

### 2.3 Descoberta (dados para decidir preço)
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/descoberta
- **O que é:** questionário e números agregados por marca para embasar decisões de preço (quanto os clientes vendem, quanto pagam, perfis).
- **Observe:** os dados ajudam a responder "estamos caros ou baratos"?

### 2.4 Proposta de preço e Propostas
- **Links:** https://nextlevel-demo.onrender.com/master/financeiro/proposta e https://nextlevel-demo.onrender.com/master/financeiro/propostas
- **O que é:** a proposta de nova tabela de preços (rascunho ou aprovada) e o histórico de propostas.
- **Importante:** **aprovar registra a decisão; não muda preço sozinho.** O preço só muda na tela de preços ou no catálogo.
- **Observe:** a proposta mostra o impacto esperado (quanto a receita sobe ou desce)?

### 2.5 Experimentos de preço
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/experimentos
- **O que é:** testar um preço diferente com um grupo de clientes antes de mudar para todos.
- **Exercício:** abra um experimento (ou crie um, é demonstração). Responda: como o sistema decide qual cliente vê qual preço? Quando o experimento termina, como se lê o resultado?

### 2.6 Catálogo e preços (produtos da NextLevel)
- **Links:** https://nextlevel-demo.onrender.com/master/financeiro/catalogo e um item: `/master/financeiro/catalogo/<chave>`
- **O que é:** tudo que a NextLevel vende (planos, temas, serviços), com **preço versionado**: cada mudança cria uma versão nova com data.
- **Exercício:** abra um produto, mude o preço (demonstração) e procure a versão antiga no histórico. Depois confira na **Auditoria** (2.9).

### 2.7 Ofertas e comissões
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/ofertas
- **O que é:** ofertas de entrada (teste grátis, primeiro mês com desconto, meses sem taxa) e as regras de comissão.
- **Observe:** quanto custa ao grupo cada oferta? Há um prazo de fim?

### 2.8 Jornada
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/jornada
- **O que é:** o caminho do cliente **dentro do painel** até comprar um serviço (cartões, página, pagamento).
- **Observe:** em que ponto o cliente pode desistir?

### 2.9 Auditoria
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/auditoria
- **O que é:** o registro de **toda** mudança em preço, oferta e comissão: quem, quando, de quanto para quanto. **Não pode ser apagado.**
- **Por que importa:** é a base de controle interno e de qualquer conferência futura.
- **Exercício:** ache a mudança de preço que você fez no 2.6.

### 2.10 Resumo SuperDrop
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/superdrop
- **O que é:** resumo financeiro da marca SuperDrop.

---

# Módulo 3: Cobrança, pagamentos e conferência

### 3.1 Operação SuperDrop (o "financeiro operacional")
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/operacao
- **O que é:** o coração da cobrança do SuperDrop, com abas próprias:

| Aba | O que tem | O que observar |
|---|---|---|
| **Visão geral** | Receita recorrente contratada, taxas de volume, recebido no mês, a receber, em atraso, comissões em garantia | Os cartões batem entre si? |
| **Mapa de receitas** | Todas as fontes de receita, de onde vem cada real | Alguma fonte que você não conhecia? |
| **Simulador** | Simula ganhos com mais lojistas/fornecedores | Mude os números: o resultado é coerente? |
| **Contratos** | Contrato de cada fornecedor (mensalidade, taxa, setup) | Os contratos estão claros? |
| **Faturas e fechamento** | Faturas do mês e o fechamento | Como uma fatura vence, é paga e é fechada? |
| **Por que cobramos** | A explicação de cada cobrança (para justificar ao cliente) | Você conseguiria explicar ao cliente usando essa tela? |
| **Regras e preços** | Regras de cobrança (dias para bloqueio etc.) | Quantos dias de atraso até bloquear? |

- **Exercício:** escolha um fornecedor e responda: quanto ele paga por mês, quanto já pagou, quanto deve e quando vence.

### 3.2 Assinaturas
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/assinaturas
- **O que é:** quem assina o quê (plano, ciclo mensal/anual, próxima cobrança, situação).
- **Observe:** dá para ver quem vai renovar nos próximos 7 dias? Quem está em teste grátis?

### 3.3 Pagamentos
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/pagamentos
- **O que é:** pagamentos recebidos (Pix e cartão), com situação (pendente, aprovado, recusado, estornado).
- **Exercício de conciliação:** escolha 3 pagamentos e verifique se cada um tem: valor, forma, data, cliente e referência do gateway. Se faltar algo para você conferir com o extrato do Mercado Pago, anote.

### 3.4 Gateways
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/gateways
- **O que é:** os processadores de pagamento: **Mercado Pago** (padrão) e **Pagar.me** (segundo, desligado até o Mauricio decidir).
- **Observe:** fica claro qual está ligado? Qual taxa cada um cobra?

### 3.5 Configurações: a conta Mercado Pago da NextLevel
- **Link:** https://nextlevel-demo.onrender.com/master/settings
- **O que é:** onde a conta Mercado Pago da NextLevel é conectada. Sem ela, as cobranças da NextLevel (planos, temas, serviços) não geram Pix.
- **Atenção:** no sistema real, **chaves e tokens nunca aparecem na tela** (ficam criptografados). Na demonstração, **só observe**.

### 3.6 O que está pronto e desligado (Central de qualidade)
- **Link:** https://nextlevel-demo.onrender.com/master/qualidade → aba **Pronto e desligado** → grupo **Dinheiro e cobrança**
- **O que é:** a lista de tudo que já funciona mas está **desligado de propósito**, esperando decisão: conta Mercado Pago, Pagar.me, taxa dos ônibus de excursão, Pix do frete do ônibus, experimentos, proposta de preços. Cada item diz o estado e **onde ligar**.
- **Por que importa:** são decisões de receita pendentes. Ótimo assunto para uma reunião com o Mauricio.
- **Exercício:** para cada item desligado, escreva: *"Se ligarmos, ganhamos ___ e arriscamos ___."*

### 3.7 Pedidos da Loja NextLevel (receita de serviços)
- **Links:** CRM: https://nextlevel-demo.onrender.com/master/crm (um pedido: `/master/crm/<id>`) · Loja por dentro: https://nextlevel-demo.onrender.com/master/services
- **O que é:** cada venda de tema ou serviço, da cobrança à entrega.
- **Observe:** há algum pedido pago e não entregue? Algum entregue e não pago?

---

# Módulo 4: Parceiros, comissões e o ecossistema

### 4.1 Parceiros (financeiro)
- **Link:** https://nextlevel-demo.onrender.com/master/financeiro/parceiros
- **O que é:** as comissões de todos os parceiros: **em carência** (aguardando), **liberadas** (a pagar) e **pagas**.
- **Conceito:** a comissão só é liberada depois da carência; se o cliente pede estorno, a comissão é cancelada.
- **Exercício:** quanto o grupo deve hoje a parceiros? Quanto disso vence nos próximos 30 dias?

### 4.2 Programa de Parceiros
- **Links:** https://nextlevel-demo.onrender.com/master/partners (um parceiro: `/master/partners/<id>`)
- **O que é:** cadastro e tipo de cada parceiro (influenciador, representante, agência, white label) e a regra de comissão aplicada.

### 4.3 A comissão vista pela parceira
- **Perfil:** `parceira@demo.superdrop.com.br` → https://nextlevel-demo.onrender.com/partner/finance
- **Observe:** a parceira entende **quanto** vai receber e **quando**? A tela promete ganho (não pode)?

### 4.4 Torre do Ecossistema
- **Link:** https://nextlevel-demo.onrender.com/master/ecossistema
- **O que é:** como as marcas se ajudam (benefícios cruzados: quem é cliente de uma ganha vantagem na outra) e o efeito disso.
- **Pergunta:** quais benefícios custam dinheiro ao grupo e quais trazem receita?

### 4.5 Comissões da Brás e da Cargas
| Tela | Link | O que observar |
|---|---|---|
| Comissões Brás | https://nextlevel-demo.onrender.com/bras/comissoes | Quanto a Brás ganha por pedido, por importadora |
| Acesso e planos Brás | https://nextlevel-demo.onrender.com/bras/acesso | Planos pagos dos membros |
| Planos e regras Brás | https://nextlevel-demo.onrender.com/bras/regras | Percentuais configuráveis |
| Ônibus de excursão | https://nextlevel-demo.onrender.com/bras/excursao | Taxa da NextLevel sobre os fardos (calculada, cobrança desligada) |
| Transportadoras | https://nextlevel-demo.onrender.com/bras/transportadoras | Comissão sobre o frete por plano da transportadora |
| Meu Contador | https://nextlevel-demo.onrender.com/bras/meu-contador | Serviço fiscal para membros |

### 4.6 Planos (lojistas) e Admin Commerce
| Tela | Link | O que observar |
|---|---|---|
| Planos dos lojistas | https://nextlevel-demo.onrender.com/master/plans | Planos, preços, o que inclui |
| Assinaturas Commerce | https://nextlevel-demo.onrender.com/commerce/plans | Lojas Commerce e o plano de cada uma |
| Vendas das lojas Commerce | https://nextlevel-demo.onrender.com/commerce/orders | Base para a taxa de plataforma |
| Interessados | https://nextlevel-demo.onrender.com/commerce/leads | Futuros clientes (receita potencial) |

---

# Módulo 5: O dinheiro visto pelos clientes

> **Por que este módulo:** quem cobra precisa entender como o cliente vê a cobrança. Uma fatura confusa gera atraso, reclamação e cancelamento.

### 5.1 Lojista SuperDrop (`danielle.lojista@familia.demo`)
| Tela | Link | O que observar |
|---|---|---|
| Saldo e recargas | https://nextlevel-demo.onrender.com/merchant/wallet | Faça uma recarga com Pix simulado. O saldo sobe na hora? O extrato é claro? |
| Financeiro | https://nextlevel-demo.onrender.com/merchant/finance | Plano, faturas da NextLevel, o que acontece se atrasar |
| Catálogo (margem) | https://nextlevel-demo.onrender.com/merchant/products | Custo × preço de venda × margem de cada produto. Coloque um preço abaixo do custo: o sistema avisa? |
| Análise | https://nextlevel-demo.onrender.com/merchant/analytics | Faturamento, ticket médio, lucro |
| Serviços | https://nextlevel-demo.onrender.com/merchant/services | Compra de temas e serviços dentro do painel |

### 5.2 Loja Commerce (`danielle.commerce@familia.demo`)
| Tela | Link | O que observar |
|---|---|---|
| Financeiro | https://nextlevel-demo.onrender.com/merchant/finance | Plano Commerce e a **taxa de plataforma**: está claro quanto a loja paga por venda? |
| Análise | https://nextlevel-demo.onrender.com/merchant/analytics | Vendas e resultados |
| Atacado | https://nextlevel-demo.onrender.com/merchant/atacado | Lista de preços de atacado |
| Histórico | https://nextlevel-demo.onrender.com/merchant/auditoria | Quem mudou o quê na loja |

### 5.3 Fornecedor (`danielle.fornecedor@familia.demo`)
| Tela | Link | O que observar |
|---|---|---|
| Recargas | https://nextlevel-demo.onrender.com/supplier/wallets | Recargas de cada lojista. A recarga do 5.1 apareceu? |
| Faturas | https://nextlevel-demo.onrender.com/supplier/invoices | O que o fornecedor deve à NextLevel; pagamento com QR Pix; bloqueio por atraso |
| Financeiro | https://nextlevel-demo.onrender.com/supplier/finance | Resumo do mês |

### 5.4 Brás e Cargas
| Perfil | Tela | Link | O que observar |
|---|---|---|---|
| Membro (`membro@bras.demo`) | Meus pedidos | https://nextlevel-demo.onrender.com/meu-bras/pedidos | Quanto o membro paga e a quem |
| Importadora (`danielle.importadora@familia.demo`) | Pedidos | https://nextlevel-demo.onrender.com/importadora/pedidos | Valor de cada pedido de caixas |
| Transportadora (`danielle.transportadora@familia.demo`) | Extrato | https://nextlevel-demo.onrender.com/transportadora/extrato | Frete a receber e comissão da NextLevel |

### ✍️ Exercício 5: a recarga que atravessa o sistema
1. Como **lojista**, recarregue R$ 300,00 (Pix simulado).
2. Como **fornecedor**, encontre essa recarga em Recargas.
3. Como **Master**, procure o reflexo dela em Financeiro → Operação SuperDrop.
4. Anote: o valor, a data e o nome bateram nos três lugares? Quanto tempo levou para aparecer?

---

# Módulo 6: Rotinas de gestão

Use estas rotinas como roteiro. Ao testá-las na demonstração, anote **o que faltou** para fazer cada passo rápido.

### Rotina diária (5 a 10 minutos)
| # | Onde | Pergunta |
|---|---|---|
| 1 | Financeiro → Visão executiva | Como está o mês até hoje? |
| 2 | Financeiro → Pagamentos | Entrou tudo que deveria ontem? Algum recusado? |
| 3 | Operação SuperDrop → Visão geral | Algo **em atraso** novo? |
| 4 | CRM Loja NextLevel | Algum pedido pago esperando entrega? |
| 5 | Master → Erros do sistema (https://nextlevel-demo.onrender.com/master/errors) | Algum erro em cobrança ou pagamento? |

### Rotina semanal (30 minutos)
| # | Onde | Pergunta |
|---|---|---|
| 1 | Assinaturas | Quem renova ou termina o teste grátis nos próximos 7 dias? |
| 2 | Parceiros (financeiro) | Quais comissões saem da carência esta semana? |
| 3 | Experimentos | Algum experimento já tem resultado? |
| 4 | Interessados (Commerce) | Quantos novos interessados? Alguém sem resposta? |
| 5 | Comissões Brás | O volume da semana subiu ou caiu? |

### Fechamento do mês (1 a 2 horas)
| # | Passo | Onde |
|---|---|---|
| 1 | Conferir faturas emitidas × pagas × vencidas | Operação SuperDrop → Faturas e fechamento |
| 2 | Conciliar pagamentos com o extrato do Mercado Pago | Financeiro → Pagamentos (e o extrato do Mercado Pago, fora do sistema) |
| 3 | Revisar inadimplência e bloqueios | Operação SuperDrop → Visão geral; Fornecedor → Faturas |
| 4 | Aprovar pagamento de comissões liberadas | Financeiro → Parceiros |
| 5 | Revisar mudanças de preço do mês | Financeiro → Auditoria |
| 6 | Registrar a receita por marca e por tipo (recorrente × variável) | Visão executiva + Mapa de receitas |
| 7 | Levar decisões pendentes ao Mauricio | Central de qualidade → Pronto e desligado |

### ✍️ Exercício 6
Faça um **fechamento simulado** do mês na demonstração seguindo os 7 passos. Cronometre. Anote onde travou, o que precisou procurar e que relatório você gostaria de baixar pronto (por exemplo, em planilha).

---

## A visão do funcionário do financeiro

Entre como `danielle.financeiro@familia.demo` (função **Financeiro** da equipe do Master) e percorra o menu.
- O que ele vê e o que fica bloqueado?
- Ele consegue fazer o fechamento do mês sozinho?
- Algo que ele vê e **não deveria** ver (ou que não vê e **deveria**)?

A tela de equipe e funções fica em https://nextlevel-demo.onrender.com/master/equipe (perfil Master).

---

## Ficha de Observação

Preencha uma por tela importante (caderno ou planilha):

```
FICHA Nº ____   Data: __/__   Perfil: ____________________
Tela: _______________________   Link: _____________________

1. Para que serve (com as minhas palavras): ______________
2. Que decisão financeira esta tela permite tomar? ________
3. Os números são claros? [ ] Sim [ ] Em parte [ ] Não
4. Os números batem com outras telas? [ ] Sim [ ] Não  Quais? ____
5. O que falta (número, filtro, exportar, gráfico, alerta): ____
6. Problema encontrado:
   [ ] Crítico (valor errado, cobrança indevida, dado de outro cliente)
   [ ] Importante (difícil de entender, passo escondido)
   [ ] Melhoria (seria bom ter)
   [ ] Dúvida (não entendi a regra)
   Descrição (o que fiz → o que esperava → o que aconteceu): ____
7. Nota (0 a 10): Clareza __  Confiança nos números __  Rapidez __
```

### Como descrever um problema crítico
1. **Perfil e caminho:** "Entrei como `danielle.lojista@familia.demo`, Saldo e recargas, recarga de R$ 300,00."
2. **Esperado:** "Saldo passar de R$ 445,00 para R$ 745,00."
3. **Aconteceu:** "Saldo ficou R$ 445,00 por 10 minutos." + print da tela (`Windows + Shift + S`).

---

## Relatório final

```
RELATÓRIO DE GESTÃO FINANCEIRA — DANIELLE TERCEIRO
Período: __/__ a __/__        Telas avaliadas: ___

1. Como o grupo ganha dinheiro (resumo em 10 linhas, com as minhas palavras)
2. Problemas críticos encontrados (com os 3 passos)
3. Onde os números NÃO bateram entre telas
4. O que falta para eu fazer o fechamento do mês com confiança
5. Relatórios que eu gostaria de exportar (planilha/PDF)
6. Decisões pendentes que recomendo (da lista "Pronto e desligado")
7. Riscos que eu vejo (inadimplência, comissões, dependência de um gateway…)
8. As 3 melhorias de maior impacto
```

---

## Perguntas para levar ao Mauricio

1. Qual é a meta de receita recorrente por marca para os próximos 6 meses?
2. Quantos dias de atraso até bloquear um cliente? É o mesmo para lojista e fornecedor?
3. Quem aprova o pagamento das comissões dos parceiros, e com que frequência?
4. Quando ligar o Pagar.me como segundo gateway? Qual o critério?
5. A taxa dos ônibus de excursão vai ser cobrada? A partir de quando?
6. Quem é o responsável pela conciliação com o Mercado Pago no dia a dia?
7. Que relatório o contador precisa todo mês?

---

## Apêndice: todas as telas com dinheiro

| Área | Tela | Link (demonstração) |
|---|---|---|
| Master | Visão executiva | /master/financeiro |
| Master | Operação SuperDrop | /master/financeiro/operacao |
| Master | Preços do grupo | /master/financeiro/precos |
| Master | Descoberta | /master/financeiro/descoberta |
| Master | Proposta de preço | /master/financeiro/proposta |
| Master | Propostas | /master/financeiro/propostas |
| Master | Experimentos | /master/financeiro/experimentos |
| Master | Catálogo e preços | /master/financeiro/catalogo |
| Master | Ofertas e comissões | /master/financeiro/ofertas |
| Master | Assinaturas | /master/financeiro/assinaturas |
| Master | Pagamentos | /master/financeiro/pagamentos |
| Master | Gateways | /master/financeiro/gateways |
| Master | Parceiros (financeiro) | /master/financeiro/parceiros |
| Master | Jornada | /master/financeiro/jornada |
| Master | Auditoria | /master/financeiro/auditoria |
| Master | Resumo SuperDrop | /master/financeiro/superdrop |
| Master | Planos | /master/plans |
| Master | Parceiros | /master/partners |
| Master | Torre do Ecossistema | /master/ecossistema |
| Master | CRM Loja NextLevel | /master/crm |
| Master | Loja NextLevel | /master/services |
| Master | Configurações (Mercado Pago) | /master/settings |
| Master | Equipe e funções | /master/equipe |
| Master | Central de qualidade (Pronto e desligado) | /master/qualidade |
| Admin Commerce | Assinaturas | /commerce/plans |
| Admin Commerce | Vendas | /commerce/orders |
| Admin Commerce | Interessados | /commerce/leads |
| Estúdio Brás | Comissões | /bras/comissoes |
| Estúdio Brás | Acesso e planos | /bras/acesso |
| Estúdio Brás | Planos e regras | /bras/regras |
| Estúdio Brás | Ônibus de excursão | /bras/excursao |
| Estúdio Brás | Transportadoras | /bras/transportadoras |
| Estúdio Brás | Meu Contador | /bras/meu-contador |
| Lojista | Saldo e recargas | /merchant/wallet |
| Lojista | Financeiro | /merchant/finance |
| Lojista | Catálogo (margem) | /merchant/products |
| Lojista | Análise | /merchant/analytics |
| Fornecedor | Recargas | /supplier/wallets |
| Fornecedor | Faturas | /supplier/invoices |
| Fornecedor | Financeiro | /supplier/finance |
| Parceiro | Financeiro | /partner/finance |
| Transportadora | Extrato | /transportadora/extrato |

Todos os links começam com **https://nextlevel-demo.onrender.com** (ou **http://localhost:3100** no computador do Mauricio).

---

*Guia criado em 12/10/2026. Quando o sistema ganhar telas financeiras novas, peça ao Claude para atualizar este guia.*
