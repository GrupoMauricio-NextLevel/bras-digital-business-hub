# Parceiros v2 + Planos por benefício + Placar da goleada + Black Friday NextLevel

> Racional + prompt engenheiro mestre. Data: 2026-11-03. Pedido do dono (resumo fiel):
> - "Preciso gerenciar com muita atenção os parceiros."
> - Aumentar os tipos de parceiro: de nano influenciadores a agências, vendedores e representantes. Estudar o modelo da Hostinger.
> - No painel gerencial (Master), um **CRM diferenciado** para gerenciar os parceiros.
> - A **página de captação** de parceiros precisa ser de muito alto nível.
> - A **página do parceiro** (a que ele usa para captar clientes) precisa ser de altíssimo nível.
> - Um **plano white label avançadíssimo** (o parceiro muda cores e marca): por enquanto, **só o esqueleto, bloqueado**, sem gastar energia.
> - Nos planos da loja: **lógica de benefícios por nível de plano**, e **sem cadastro ilimitado de produtos**.
>
> **Atualização de 03/11 (aprovações e pedidos novos do dono):**
> - "Aprovo": percentuais, níveis e benefícios recomendados (seções 3.2 e 8.2).
> - **Scale sem limite de produtos.**
> - Suporte do Pro em até **4 h úteis** (confirmado depois) + gerente de conta no Scale: **sim**.
> - Migração inclusa no Scale e com 50% de desconto no Pro: **sim**.
> - **Placar de futebol (seção 13):** "aproveitar que no Brasil o futebol é popular" e mostrar, num placar criativo e "em tempo real", como vencemos os concorrentes de goleada. Destaque para o que vencemos; o que perdemos fica sem destaque. O placar pode estar no site e no painel. O dono alimenta à mão as mudanças dos concorrentes. "Show de bola, uma vitória e um placar em destaque."
> - **Black Friday (seção 14):** "chegamos em novembro e nossa Black Friday chegou; vencemos todas as Blacks dos concorrentes". A roupa da Black veste **todos os sites públicos e painéis**. Comunicação agressiva: os valores atuais são de Black e por tempo limitado, com **contagem regressiva por todo canto**.

---

## 1. O que já existe (não refazer: estender)

| Peça | Onde | Estado |
|---|---|---|
| **Tipos de parceiro** `AFFILIATE`, `REPRESENTATIVE`, `AGENCY`, `AGENCY_ELITE`, `WHITE_LABEL` | `src/db/schema.ts` (`PARTNER_KINDS`, tabela `partners`) | Existem no banco. Só o Master troca o tipo (`PartnerKindControl`). |
| **Regras de comissão versionadas** (produto, ciclo, tipo de parceiro) | `commissionRules`, `findRule` | D220: indicador **20% + 10% por 12 meses**; agência e agência elite **30% + 15% enquanto o cliente ficar**. |
| **Links, cliques, cupons de 7 dias, saques Pix, antifraude e taxa de manutenção de inativo** | `partnerLinks`, `partnerPayouts`, `/partner/links`, `/partner/coupons`, `/partner/finance` | Funcionam. Saque só para o mesmo CPF/CNPJ. |
| **CRM do parceiro** (leads dele, etapas, diagnóstico) | `partnerLeads` (`PARTNER_LEAD_STAGES`), `/partner/crm` | Existe do lado do parceiro. **O Master não tem CRM dos parceiros.** |
| **Painel do parceiro da E-commerce** | `src/app/partner/painel-ec.tsx`, `src/lib/domain/parceiros-ec.ts` | D220/D224/D225: abertura em vidro, pulso, "Precisa de você agora", pedido de agência. |
| **Página pública /parceiros da E-commerce** | `src/components/portal/commerce/parceiros/parceiros-ec.tsx` + `simulador.tsx` | D220/D223: indicador × agência, simulador, como funciona, dúvidas. |
| **Link do parceiro** `/r/[slug]` | `src/app/r/[slug]/route.ts` | **Só redireciona** e grava a atribuição. **Não existe página do parceiro para captar clientes.** |
| **Master → Parceiros** | `src/app/master/partners` (+ `[id]`) | Lista, fila "Precisa de você" (pedidos de agência e saques), tipo do parceiro. |
| **Recursos por plano da loja** | `src/lib/domain/perfil-loja.ts`, configuração `ecommerce.recursos-por-plano` | Tabela editável no Master. Padrão de 19/10: **tudo liberado nos três planos**. |
| **Planos** | `catalog-seed.ts`, revisão `src/lib/finance/revisao-d220.ts` | Start R$ 57, Pro R$ 147, Scale R$ 347 (anual 37/119/297). **Produtos e pedidos sem limite.** Diferença entre planos só nas cotas do Maurício IA (3 / 200 / 1000 por mês). |

**Conclusão:** a base técnica dos parceiros está pronta. Falta:
- a **estratégia** (trilhas e níveis);
- a **gestão** (CRM do Master);
- as **duas vitrines** (captação e página do parceiro).

Nos planos, falta a **escada de benefícios**.

---

## 2. O que aprender com a Hostinger

A Hostinger tem **três programas separados**, cada um para um tipo de pessoa:

1. **Afiliados** (criadores de conteúdo e sites):
   - comissão alta na primeira venda (a partir de 40%, com níveis que sobem conforme o volume);
   - cookie de 30 dias;
   - painel com links e materiais.
2. **Partner Program** (agências que hospedam vários sites de clientes):
   - **20% nas novas indicações e 10% nas renovações, vendas cruzadas e upgrades**;
   - listagem no diretório de parceiros e **selo de parceiro**;
   - desconto no próprio produto da agência;
   - exige um mínimo de indicações para continuar no programa.
3. **Indique um amigo** (o cliente indica): recompensa simples por indicação.

O que copiar, adaptado ao nosso caso:
- **Trilhas por perfil**, com regra, página e painel próprios, no lugar de "um programa para todos". Cada perfil se reconhece na hora: "isto é para mim".
- **Níveis por desempenho** que sobem sozinhos (gamificação com dinheiro de verdade). O parceiro sempre vê "quanto falta para o próximo nível".
- **Selo e diretório** para agências: status vale tanto quanto a comissão.
- **Requalificação**: quem não produz desce de nível ou sai, e o programa fica limpo.
- **O cliente também indica** (indique e ganhe), com recompensa simples.

Fontes:
- [Hostinger Partner Program](https://www.hostinger.com/partner-program)
- [Suporte do Partner Program](https://www.hostinger.com/support/hostinger-partner-program/)
- [Tutorial de programas de afiliados](https://www.hostinger.com/tutorials/affiliate-marketing-programs/)
- [Resenha de terceiros do programa de afiliados](https://bloggerspassion.com/hostinger-affiliate-program)

Os limites de cada nível de afiliado da Hostinger não são públicos.

---

## 3. Proposta: trilhas de parceiro (tipos)

Seis trilhas. As quatro primeiras usam o tipo `AFFILIATE` / `REPRESENTATIVE` com **subtipo** (perfil); agência e white label já são tipos próprios.

| Trilha | Para quem | Como ganha (proposta, **valores a aprovar**) | O que recebe além do dinheiro |
|---|---|---|---|
| **Cliente indica** (indique e ganhe) | Lojista NextLevel que indica outro lojista | Crédito na própria mensalidade: **1 mês grátis por indicação que pagar** (limite de 12 por ano). | Link e cupom dentro do painel do lojista. |
| **Nano e micro criador** (até ~50 mil seguidores) | Criadores de moda e atacado no Instagram e TikTok, consultores | **20% + 10% por 12 meses** (regra D220 de hoje) | Kit de conteúdo (roteiros, fotos, stories prontos), cupom de 7 dias, página pessoal. |
| **Criador Pro** (nível, não cadastro) | Quem chega a 10 clientes pagantes ativos | **25% + 10% por 24 meses** | Destaque no ranking e materiais exclusivos. |
| **Vendedor / representante** | Quem vende na rua: Brás, Canindé, Bom Retiro, feiras, porta a porta | **20% + 10% enquanto o cliente ficar** + **bônus fixo por loja ativada** (ex.: R$ 30 quando a loja publica e faz a 1ª venda) + meta mensal | **Carteira e território** (bairros e ruas), modo "visita" no celular (cadastro da loja na rua em 2 minutos), material impresso com QR. |
| **Agência parceira** | Agências de marketing, social media, consultorias | **30% + 15% enquanto o cliente ficar** (regra D220) | Selo, **diretório público de agências**, atendimento prioritário, preço de revenda nas Soluções (Loja Pronta, Migração). |
| **Agência Elite** (nível) | Agência com 20 ou mais clientes ativos | **35% + 20% enquanto ficar** | Gerente de conta, leads do diretório, co-marketing. |
| **White label** (bloqueado) | Agências grandes que querem revender com a própria marca | Preço de atacado + margem própria (modelo a definir) | Cores, logo, domínio e e-mails com a marca da agência. **Só esqueleto agora** (seção 7). |

### 3.1 Níveis por desempenho (dentro de cada trilha)

| Nível | Clientes pagantes ativos | Efeito |
|---|---|---|
| **Inicial** | 0 a 2 | Regra base da trilha |
| **Prata** | 3 a 9 | +2 pontos na recorrência |
| **Ouro** | 10 a 19 | Vira "Pro" na trilha de criador; +5 pontos na recorrência |
| **Diamante** | 20 ou mais | Vira "Elite" na trilha de agência; gerente de conta |

- **Recalcula todo mês.** Sobe na hora e desce só depois de 2 meses abaixo do limite, para não punir por uma oscilação. O Master pode fixar o nível manualmente, com motivo registrado.
- **Guarda-corpo financeiro:** nenhuma combinação de regra pode passar de **X% da receita** do cliente (sugestão: 40% no 1º mês e 20% recorrente). Usar o mesmo padrão dos guarda-corpos da proposta de preço do Master. Um teste garante esse limite.

**Decisões do dono** (com valores sugeridos):
- percentuais por trilha e por nível;
- valor do bônus do representante;
- a recompensa do "cliente indica";
- o teto de comissão.

---

### 3.2 Recomendação de valores, baseada nos concorrentes (03/11)

**O que eles pagam:**
- **Nuvemshop:**
  - associado escolhe **100% da 2ª mensalidade (uma vez)** **ou** **20% recorrente**;
  - especialista ou agência ganha **20% recorrente só a partir do nível Silver**, pois o nível inicial não recebe recorrência;
  - fala em "até 30%";
  - gerente de sucesso só no nível Platinum.
- **Hostinger (agências):** 20% na venda nova + 10% em renovações, selo e diretório.
- Tray, Loja Integrada e WBuy não publicam percentuais.

**Recomendação: vencer cada ponto por pouco.**

| Trilha | 1ª mensalidade | Recorrente | Extra | Contra quem vence |
|---|---|---|---|---|
| Cliente indica | **1 mês grátis** na própria loja por indicação que pagar (até 12 por ano) | — | O indicado ganha o cupom do lojista | Igual aos 100% de uma mensalidade da Nuvemshop, em crédito |
| Criador (nano e micro) | **50%** | **20% enquanto o cliente ficar** | Cupom de 7 dias, kit de conteúdo, página pessoal | A Nuvemshop paga um **ou** outro; aqui são os dois juntos. No Pro, 1º ano = R$ 397 contra R$ 394 do recorrente da Nuvemshop no Impulso (vence por pouco, e com mensalidade menor para o cliente) |
| Vendedor / representante | **50%** | **20% enquanto ficar** | **Bônus de R$ 30 por loja ativada** (publicada + 1ª venda paga + 30 dias de assinatura); meta de 10 ativações no mês = **+R$ 100** | Ninguém paga bônus por ativação real |
| Agência parceira | **50%** | **25% enquanto ficar**, **desde o 1º cliente** | Selo, diretório, 30% de desconto nas Soluções para revenda, loja de demonstração | Nuvemshop 20% e só a partir do Silver; Hostinger 10% |
| Agência Elite (20+ clientes ativos) | **50%** | **32% enquanto ficar** | Gerente de conta, leads do diretório, co-marketing | Nuvemshop "até 30%" |

**Níveis, iguais em todas as trilhas** (contam clientes pagantes ativos):
- **Inicial:** já recebe recorrência. É uma vantagem sobre a Nuvemshop.
- **Prata (3+):** +2 pontos na recorrência.
- **Ouro (10+):** +4 pontos e gerente de sucesso (a Nuvemshop só dá gerente no Platinum).
- **Diamante (20+):** vira Elite. Na agência, 32%; no criador e no representante, 26%.

**Regras que protegem a margem:**
- **Teto:** 1ª mensalidade ≤ 50%; recorrente ≤ 32% (Elite). Teste garante.
- **Comissão só depois de 30 dias de assinatura paga** (garantia, que já existe).
- O bônus do representante só sai com a 1ª venda paga da loja.
- **Cookie de atribuição de 60 dias** (Hostinger: 30).
- **Saque por Pix a partir de R$ 50**, ao mesmo CPF/CNPJ (já existe).
- **Requalificação:** desce de nível após 2 meses abaixo; o parceiro sem nenhum cliente ativo por 6 meses fica Inativo.

**Conta de margem (Pro, R$ 147/mês):**
- agência no Inicial: R$ 73,50 no 1º mês + R$ 36,75 por mês;
- Elite: R$ 47,04 por mês.
- O cliente custa ao parceiro R$ 0 de taxa da plataforma, e a NextLevel fica com 68% a 75% da mensalidade recorrente.

**Mudança em relação à D220:** a regra hoje é indicador 20% + 10% por 12 meses e agência 30% + 15%. A recomendação vira 50% + 20% (criador e representante) e 50% + 25% (agência), sempre enquanto o cliente ficar. É uma revisão versionada (D226), sem apagar o histórico.

### 3.3 Planos: o que o dono decidiu (03/11)
- **Escada da seção 8.2:** aprovada (300 / 1.000 produtos no Start e no Pro; 3 / 6 / 12 pessoas; 40 / 350 / 1.200 de IA).
- **Scale: produtos sem limite** (decisão do dono). Empata com Nuvemshop e Loja Integrada nesse item.
- **Suporte do Pro: até 4 h úteis** (confirmado pelo dono). Empata com a WBuy e vence Nuvemshop e Tray, que não dão prazo.
- **Gerente de conta no Scale:** sim, a mesma pessoa que cuida dos parceiros Ouro.
- **Migração:** inclusa no Scale (até 2.000 produtos) e com 50% de desconto no Pro.

## 4. CRM de parceiros no Master (o "diferenciado")

Hoje o Master vê uma lista. A proposta é um **escritório de parceiros**: uma tela que responde "quem precisa de mim hoje".

### 4.1 Funil do parceiro (quadro em colunas, arrastável)
`Candidato → Em análise → Aprovado → Ativando (sem 1ª venda) → Produtivo → Em risco (30 dias sem indicar) → Inativo / Desligado`

Cada cartão mostra:
- foto e nome, trilha, nível;
- clientes ativos, receita gerada no mês e comissão a pagar;
- última atividade e próxima ação, com data;
- dono interno (quem da equipe cuida);
- botão de WhatsApp.

### 4.2 Ficha 360 do parceiro (gaveta lateral)
- **Linha do tempo:** cadastro, aprovação, links criados, cliques, testes, vendas, saques, notas, ligações e mudanças de nível.
- **Indicados**, com a situação de cada loja: teste, pagante, atrasada ou cancelada.
- **Dinheiro:** comissões por mês, garantia, saldo e saques.
- **Saúde:** nota de 0 a 100, calculada por conversão, recência, cancelamento dos indicados e sinais de antifraude.
- **Tarefas e lembretes:** "ligar dia 5", "mandar kit" e similares, com aviso na fila do Master.
- **Notas internas**, que o parceiro não vê.

### 4.3 Fila "Precisa de você" (ampliar a que já existe)
- pedidos de agência ou de mudança de trilha;
- saques para aprovar;
- candidatos parados há mais de 48 h;
- parceiros "Ativando" há mais de 14 dias, para ligar e ensinar;
- produtivos que entraram em risco;
- alertas de antifraude (autoindicação, mesmo CPF/CNPJ, mesmo IP).

### 4.4 Visões e números
- **Ranking do mês** por trilha.
- **Mapa por região**, para representantes.
- **Receita e retenção dos indicados** por parceiro.
- **Custo de aquisição** (comissão paga ÷ clientes ativos).
- **Segmentos salvos**, por exemplo "agências Ouro em SP" ou "criadores sem venda em 30 dias".

### 4.5 Ações em massa
- mensagem para um segmento, como um aviso no painel do parceiro ou um e-mail;
- **desafio do mês** (ex.: "3 lojas ativadas = bônus de R$ 100");
- exportar CSV.

### 4.6 Dados novos (migração)
- `partner_profiles`: `partnerId`, `trilha` (CREATOR | SELLER | AGENCY | CUSTOMER), `nivel`, `nivelFixadoPor`, `regiao`, `seguidores`, `canais`, `donoInternoId`.
- `partner_pipeline`: `partnerId`, `etapa`, `proximaAcao`, `proximaAcaoEm`, `atualizadoEm`.
- `partner_activities`: `partnerId`, `tipo` (NOTA | LIGACAO | TAREFA | MUDANCA_NIVEL | MENSAGEM), `texto`, `vencimento`, `feitoEm`, `autorId`.
- `partner_tier_history`: `partnerId`, `de`, `para`, `motivo`, `em`.
- `partner_challenges` (desafios): regra, período, bônus.

Sem apagar nada do que existe.

---

## 5. Página de captação de parceiros (/parceiros), de muito alto nível

Reconstruir sobre a página atual, seguindo a skill `pagina-de-vendas`.

1. **Topo:** "Ganhe dinheiro indicando a plataforma que o Brás está usando", com **seletor de perfil**: *Sou criador*, *Sou vendedor*, *Sou agência*. Cada perfil muda o texto, a comissão e a chamada sem sair da página.
2. **Escada de níveis** (Inicial → Prata → Ouro → Diamante) mostrando quanto se ganha em cada nível com números reais da regra.
3. **Simulador** (o atual, ampliado): perfil + lojas por mês + plano → ganho no mês 1, no 12 e no 24.
4. **"Fácil de vender":**
   - taxa zero da plataforma;
   - comparativo contra 4 concorrentes;
   - feita para o atacado;
   - equipe no Brás.
   Usar os blocos já prontos da home.
5. **O painel do parceiro**, com telas reais em dispositivo, sem inventar números: dados de demonstração identificados.
6. **Diretório de agências** (prova social real, quando houver agências aprovadas).
7. **Como funciona** em 4 passos e **dúvidas**.
8. **Cadastro em etapas:**
   - perfil;
   - dados;
   - qualificação (seguidores, região, carteira de clientes);
   - aceite.
   A candidatura vai para o funil do Master como **Candidato**.

Subpáginas para anúncio e busca: `/parceiros/criadores`, `/parceiros/vendedores` e `/parceiros/agencias`. É a mesma estrutura com outro perfil selecionado, sem duplicar código.

**Ativos que o dono precisa gerar:** fotos de vendedor na rua do Brás com celular, de agência em reunião e de criadora gravando story. Listar no manifesto com prompts; nunca usar foto genérica.

---

## 6. Página do parceiro para captar clientes, de altíssimo nível

**Hoje `/r/[slug]` só redireciona. A proposta é que ele vire uma página:** **`/i/anasouza`**: o código do parceiro em minúsculas, sem espaço nem hífen (decisão do dono, 03/11). Ela funciona como uma **home da NextLevel com a assinatura do parceiro**. O `/r/[slug]` continua funcionando e passa a levar para `/i/...`.

- **Faixa do parceiro no topo:**
  - "Indicação de **Ana Souza**", com foto, frase pessoal e botão de WhatsApp dela;
  - para agência, logo da agência e "implantação pela Agência X".
- **Oferta exclusiva:** o cupom do parceiro já aplicado (ex.: 7 dias grátis + 1º mês por R$ 9,90), com contagem regressiva real se houver validade.
- **Blocos da home já prontos:** faixa do 0%, comparativo, feita para o atacado, planos com o cupom, temas e dúvidas. Tudo com o mesmo visual de tecnologia (D222/D223).
- **Personalização no painel do parceiro:**
  - foto, frase, WhatsApp e cor de destaque, escolhida entre 4 da paleta;
  - temas favoritos em destaque;
  - um depoimento próprio, revisado pelo Master antes de ir ao ar.
- **Atribuição:** cookie de 60 dias + cupom. Quem vem pela página e cria loja fica ligado ao parceiro (regra atual de atribuição, sem mudar a lógica de comissão).
- **Kit de divulgação:**
  - QR code em alta resolução e cartão para imprimir (representante);
  - posts e stories gerados com a página;
  - link curto.
- **Rápida e segura:**
  - imagens otimizadas;
  - `noindex` opcional;
  - sem dados pessoais do parceiro além do que ele escolheu mostrar (LGPD).

---

## 7. White label: só o esqueleto, bloqueado

Objetivo: deixar o terreno pronto com o mínimo de esforço.

1. **Configuração** `parceiros.white-label.ativo = false` (padrão desligado), lida no domínio.
2. **Tabela** `partner_brands`, criada e vazia:
   - `partnerId`, `nomeMarca`, `logoUrl`;
   - `corPrimaria`, `corDestaque`;
   - `dominio`, `emailRemetente`;
   - `status` (RASCUNHO | EM_ANALISE | ATIVO).
3. **Domínio** `whiteLabelDoParceiro(db, partnerId)`: devolve `{ disponivel: false, motivo: "Em breve" }` enquanto a configuração estiver desligada. Um teste garante isso.
4. **Painel do parceiro:** cartão "Sua marca (white label) · Em breve", com cadeado, mostrando o que vai existir e o botão "Quero ser avisado", que registra interesse.
5. **Master:** na ficha do parceiro, a seção "White label" aparece desabilitada, com o interruptor travado e o texto "em desenvolvimento".

**Não fazer agora:** aplicar o tema da marca do parceiro nas lojas, domínio próprio do parceiro ou e-mails com a marca dele.

---

## 8. Planos da loja: benefícios por nível, vencendo os concorrentes por pouco

Pedido do dono (03/11): "faz uma análise dos concorrentes e vamos vencer eles por pouco, para dizer que temos mais benefícios no comparativo direto". Preços continuam **R$ 57 / 147 / 347** (D221).

### 8.1 O que cada concorrente dá em cada plano

Fonte: sites oficiais consultados em 03/11/2026.
- Nuvemshop: [planos-e-preços](https://www.nuvemshop.com.br/planos-e-precos)
- Loja Integrada: [planos](https://lojaintegrada.com.br/planos/) e [compare](https://lojaintegrada.com.br/compare/)
- WBuy: [planos](https://www.wbuy.com.br/planos)
- Tray: [planos](https://www.tray.com.br/planos/)

Item não divulgado = "—".

**Plano de entrada**

| Item | Nuvemshop Essencial R$ 69 | Loja Integrada Crescimento R$ 46* | WBuy Iniciante R$ 59 | Tray Lançamento R$ 59 |
|---|---|---|---|---|
| Taxa da plataforma usando o Mercado Pago | 2% | 0,99% | 1,5% | 1,25% |
| Produtos | Sem limite | 250 | 200 | 100 |
| Pedidos por mês | Sem limite | — | — | 100 |
| Pessoas no painel | — | 2 | 1 | 1 |
| IA por mês | 30 usos | — | — | 100 créditos |
| Atacado (grade, preço por quantidade) | — | — | Não (só no Turbo) | Não (só no Avançado) |
| Suporte | Central + e-mail | — | Chat (resposta em 4 h úteis) | Ticket e e-mail |
| Temas grátis | +70 | 4 | Loja de temas grátis | — |

**Plano intermediário**

| Item | Nuvemshop Impulso R$ 164 | Loja Integrada Aceleração R$ 83* | WBuy Turbo R$ 149 | Tray Crescimento R$ 159 |
|---|---|---|---|---|
| Taxa usando o Mercado Pago | 1% | 0,90% | 1,25% | 1% |
| Produtos | Sem limite | 500 | 500 | 750 |
| Pedidos por mês | Sem limite | — | — | 500 |
| Pessoas no painel | — | 3 | 5 | 5 |
| IA por mês | 150 usos | — | — | 300 créditos |
| Atacado | — | — | Sim (varejo e atacado) | Não |
| Suporte | + WhatsApp | — | Chat (4 h úteis) | + chat e WhatsApp |

**Plano avançado**

| Item | Nuvemshop Escala R$ 449 | Loja Integrada Expansão R$ 200* | WBuy Expansão R$ 299 | Tray Avançado R$ 449 |
|---|---|---|---|---|
| Taxa usando o Mercado Pago | 0,7% | 0,70% | 1% | 0,75% |
| Produtos | Sem limite | Sem limite | 1.000 | 1.500 |
| Pedidos por mês | Sem limite | — | — | 1.000 |
| Pessoas no painel | Equipe com permissões | 10 | 10 | 10 |
| IA por mês | Sem limite | — | — | 1.000 créditos |
| Atacado | — | — | Sim | Sim (3 tabelas de preço) |
| Suporte | + telefone | — | Chat (2 h úteis) | + telefone e prazo de atendimento |
| Migração assistida | — | — | — | Só no Ultra (R$ 999+) |

\* Loja Integrada: valor no pagamento trimestral, o único que o site mostra.

### 8.2 Proposta: escada de benefícios da NextLevel (vence por pouco)

| Benefício | **Start R$ 57** | **Pro R$ 147** | **Scale R$ 347** | Como vence |
|---|---|---|---|---|
| Taxa da plataforma usando o Mercado Pago | **0%** | **0%** | **0%** | Todas cobram de 0,7% a 2% |
| Produtos ativos (variações não contam) | **300** | **1.000** | **Sem limite** | Start > 250/200/100; Pro > 750/500/500; Scale empata com Nuvemshop e Loja Integrada e vence WBuy (1.000) e Tray (1.500) |
| Pedidos por mês | **Sem limite** | **Sem limite** | **Sem limite** | Tray limita 100 / 500 / 1.000 |
| Pessoas no painel | **3** | **6** | **12** | Start > 2/1/1; Pro > 5/5/3; Scale > 10/10/10 |
| Maurício IA por mês | **40** | **350** | **1.200** | Start > 30 (Nuvemshop); Pro > 300 e 150; Scale > 1.000 (Tray) |
| Atacado: grade fechada, preço por quantidade, pedido mínimo | **Sim** | **Sim** | **Sim** | WBuy só a partir do Turbo; Tray só no Avançado |
| Propostas e pedidos do balcão (WhatsApp e loja física) | **Sim** | **Sim** | **Sim** | Ninguém mostra nos planos de entrada |
| Relatórios em planilha | **Sim** | **Sim** | **Sim** | Tray só a partir do Crescimento |
| Tema pago incluso | — | **1 tema N2** | **1 tema N3** | Ninguém inclui tema pago |
| Suporte | **WhatsApp com gente da equipe** (horário comercial) | **WhatsApp prioritário** (resposta em até 4 h úteis) | **Prioritário + telefone + gerente de conta** | Entrada: Nuvemshop e Tray só e-mail. Avançado: igual ao telefone deles + gerente |
| Migração assistida | Paga à parte | **50% de desconto** | **Inclusa** | Tray só no Ultra (R$ 999+) |
| Equipe presencial em São Paulo (Brás) | **Sim** | **Sim** | **Sim** | Diferencial de proximidade (D219/D220) |

**Placar no comparativo direto** (itens em que a NextLevel ganha ou empata, sobre os 12 da tabela). Item que o concorrente não divulga conta a nosso favor só quando nós oferecemos e publicamos o nosso valor. Fora da tabela, a Nuvemshop também tem mais temas grátis (+70 contra os nossos 7):

| Plano | contra Nuvemshop | contra Loja Integrada | contra WBuy | contra Tray |
|---|---|---|---|---|
| Entrada | **11 de 12** (perde produtos sem limite) | **12 de 12** | **12 de 12** | **12 de 12** |
| Intermediário | **11 de 12** (perde produtos sem limite) | **12 de 12** | **12 de 12** | **12 de 12** |
| Avançado | **11 de 12** (perde IA sem limite) | **12 de 12** | **12 de 12** | **12 de 12** |

**A verdade que o dono precisa saber:**
- **Contra a Nuvemshop, o item "produtos" perde no Start e no Pro**, porque ela não limita produtos em nenhum plano.
- **No Scale (sem limite, decisão de 03/11)**, empata com Nuvemshop e Loja Integrada.
- O placar fica a nosso favor em todos os planos.
- No Scale, a única derrota é a IA sem limite da Nuvemshop Escala.

### 8.3 Cuidados com os números

- **Vencer por pouco tem que ser verdade em cada linha.** Os números ficam na tabela editável do Master (`ecommerce.recursos-por-plano`, agora com valores) e no arquivo de dados do comparativo, com data e fonte.
- **Teste novo:** "em cada plano, a NextLevel ganha ou empata em mais itens que cada concorrente". Se um concorrente mudar o plano e o teste quebrar, o site não publica um comparativo falso.
- **IA por "uso", não por "crédito":** a Tray conta créditos e a Nuvemshop conta usos. Na tabela pública, escrever exatamente a unidade de cada uma.
- **Custo da IA:** subir o Start de 3 para 40 usos tem custo. A cota fica no Master e pode ser ajustada sem publicar código.
- **Produtos contam como produtos ativos, não como variações:** um vestido em 6 tamanhos é 1 produto, e isso fica escrito na tabela. Os concorrentes não dizem como contam.
- **Quem já passou do limite não perde nada:**
  - os produtos continuam no ar;
  - a loja só não ativa produtos novos;
  - aviso claro com o caminho para o plano seguinte.
- **Verificação num lugar só, no domínio:** ao criar, importar, migrar e ativar.
- **Barra de uso no painel:** "Produtos: 212 de 300", com aviso aos 80%.
- **Textos que mudam no site:**
  - "Sem limite de produtos e pedidos" vira **"Pedidos sem limite em todos os planos"**;
  - o cartão "∞" da home vira **"Mais benefícios em cada plano"**;
  - o comparativo da home ganha a tabela de benefícios plano a plano com o placar;
  - atualizar o vendedor IA e as dúvidas.

## 9. Riscos e cuidados

- **Comissão alta demais:** usar o guarda-corpo (seção 3.1) e uma simulação no Master antes de ligar um nível novo.
- **Fraude:**
  - autoindicação (mesmo CPF/CNPJ, mesmo cartão, mesmo IP), que o antifraude atual já cobre e precisa ser estendido ao bônus do representante;
  - "loja fantasma" para pegar bônus de ativação: o bônus só sai após a 1ª venda paga **e** 30 dias de assinatura.
- **Limite de produtos assusta quem compara:** o texto destaca "pedidos sem limite" e a folga do Start (500).
- **Página do parceiro com dado pessoal:** só o que ele escolheu publicar; o depoimento passa pela revisão do Master.
- **White label:** não prometer data na página pública.

## 10. Decisões e perguntas

**Já decididas (03/11):**
- percentuais e níveis da seção 3.2;
- bônus do representante (R$ 30 por loja ativada + R$ 100 na meta de 10);
- "cliente indica" com 1 mês grátis;
- escada da seção 8.2 com o Scale sem limite de produtos;
- gerente de conta no Scale;
- migração inclusa no Scale e com 50% de desconto no Pro.

**Respondidas pelo dono (03/11, 2ª rodada):**
1. Suporte do Pro: **até 4 h úteis**.
2. Fim da Black: **30/11 às 23h59** (Cyber Monday).
3. **O argumento mais forte da Black fica no semestral e no anual.** Depois da Black, os preços voltam ao "preço normal" (ver a pergunta A abaixo).
4. **Quem assina na Black mantém o preço enquanto a assinatura estiver ativa.**
5. **Anual na Black: 2 meses grátis** (paga 10, leva 12).
6. **Black dos parceiros: 1ª mensalidade a 100%** para lojas indicadas durante a Black.
7. **Kit Black para a loja dos lojistas: sim** (fase BF4).
8. **Placar:** pode ter a Nuvemshop como rival, **mas temos que ganhar**. Outra opção: um **grupo de concorrentes** ("Seleção dos concorrentes"), mostrando o ponto mais fraco deles contra o nosso mais forte (seção 13.5).
9. Página do parceiro: **`/i/anasouza`**.

**Perguntas abertas (bloqueiam a BF1):**
- **A. Qual é o "preço normal" depois da Black?** A resposta foi "sim, volta a R$ 149 / 249 / 499". Atenção ao efeito:
  - com R$ 149 no mensal, o Start fica **mais caro que todos os concorrentes** (Nuvemshop R$ 69, WBuy e Tray R$ 59) e **o comparativo deixa de vencer na mensalidade** depois de 30/11;
  - só ganharia no custo total para quem vende muito.
  - **Recomendação:** o **preço normal continua R$ 57 / 147 / 347 no mensal** (já é o menor que vence por pouco). A Black fica toda no compromisso mais longo (seção 14.6), com anual e semestral muito mais vantajosos, que **voltam ao normal no dia 01/12**.
  - Assim, a contagem é verdadeira ("depois de 30/11, o anual volta a custar R$ X") e o comparativo continua vencendo o ano todo.
- **B. Semestral:** o sistema ainda não tem plano semestral (só mensal e anual). Criar o semestral agora para a Black? Sugestão: **sim**, com preço por mês entre o mensal e o anual (seção 14.6).

---

## 11. Fases

**Prioridade de calendário:** a Black Friday NextLevel vai até **30/11/2026 às 23h59** (Black em 27/11, Cyber Monday em 30/11). As fases **BF1 a BF3 vêm antes de tudo** e precisam estar no ar até **10/11**, para a campanha ter duas semanas e meia. As fases PV seguem depois, na ordem.

| Fase | Entrega | Pronto quando |
|---|---|---|
| **BF1** | **Black: base.** Configuração única da campanha no Master (início, fim, preço Black e preço depois, mensagens, ligada ou desligada), versão de preço agendada para virar sozinha no fim, componente de contagem regressiva, faixa da Black no topo de todos os sites públicos e painéis | Teste: antes, durante e depois do fim; a contagem nunca reinicia; quando acaba, a faixa some e o preço volta sozinho |
| **BF2** | **Placar da goleada:** súmula no Master (rivais, itens por plano, data e fonte), placar animado na home, /comparativo, /planos, página do parceiro e painel do lojista; versão para compartilhar (imagem de story) | Teste: o placar é calculado dos itens (ninguém digita o resultado); o que perdemos aparece sem destaque; data da última atualização visível |
| **BF3** | **Roupa da Black em tudo:** tema Black (preto, neon verde e ciano) nos sites públicos, no cadastro e nos 3 painéis; contadores na abertura de cada painel, nos cartões de plano, no cadastro e na página do parceiro; "Black dos concorrentes × Black NextLevel" com o placar | Capturas 1440/390 de todas as telas; sem rolagem lateral; `prefers-reduced-motion` respeitado |
| **BF4** | **Kit Black para a loja do lojista:** liga no painel do lojista; faixa da Black e contagem regressiva na vitrine dele (até a data que ele escolher), cupom de Black em 1 clique, selo "Black Friday" nos produtos com desconto, campanha pronta | Teste: a contagem da loja usa a data do lojista e some sozinha; capturas da vitrine em 390/1440 |
| **PV0** | Decisões do dono registradas (DECISIONS) e valores no catálogo e nas regras | Regras novas versionadas com motivo; guarda-corpo com teste |
| **PV1** | Dados: perfis, funil, atividades, histórico de nível, desafios, `partner_brands` (vazia) | Migração prova que atualiza banco antigo; seeds idempotentes |
| **PV2** | Níveis: cálculo mensal, subida e descida com carência, nível fixado pelo Master, regra por nível no `findRule` | Testes de domínio para cada caso |
| **PV3** | **CRM do Master:** quadro do funil, ficha 360 em gaveta, fila ampliada, ranking, segmentos, ações em massa | Capturas 1440/390, uma consulta por bloco, permissões no servidor |
| **PV4** | **Página de captação** com seletor de perfil, escada de níveis, simulador ampliado e cadastro em etapas → Candidato no funil | Skill `pagina-de-vendas` (3 rodadas de capturas), sem dado inventado |
| **PV5** | **Página do parceiro** `/i/[codigo] (ex.: /i/anasouza)` + personalização no painel + kit (QR, cartão) | Atribuição testada (cookie + cupom), LGPD, velocidade medida |
| **PV6** | **Planos:** escada da seção 8.2 com limites editáveis no Master, verificação no domínio, barra de uso, avisos, tabela de benefícios plano a plano com placar no comparativo, textos públicos e IA atualizados | Testes: bloqueio, excedente antigo preservado e "a NextLevel ganha ou empata em mais itens que cada concorrente em cada plano" |
| **PV7** | **White label (esqueleto):** configuração desligada, cartão bloqueado no painel do parceiro e no Master, "Quero ser avisado" | Teste garante `disponivel: false` com a configuração desligada |
| **PV8** | Painel do parceiro: nível atual, "quanto falta", desafios do mês, ranking | Capturas e teste do cálculo exibido |

---

## 12. Prompt engenheiro mestre (colar numa sessão de desenvolvimento)

```
Você é o engenheiro responsável pela evolução "Parceiros v2 + Planos + Placar + Black Friday" da NextLevel E-commerce (Next.js 16 App Router, React 19,
Drizzle com PGlite/Neon, Tailwind v4, Vitest, Playwright). Trabalhe em português simples com o dono (Mauricio), sem jargão.

LEIA PRIMEIRO, de forma econômica (índices e trechos, não arquivos inteiros):
- AGENTS.md (esta versão do Next tem mudanças: consulte node_modules/next/dist/docs antes de usar API nova).
- CLAUDE.md e docs/design/DECISIONS.md (últimas decisões: D216 a D225).
- Este arquivo: docs/prompts/parceiros-v2-crm-niveis-planos.md (racional, mapa do que já existe, fases PV0 a PV8).
- Skills do projeto em .claude/skills: desenvolver-prompt, nova-migracao, painel-interno, pagina-de-vendas, qa-visual,
  security-guardian, publicar.

REGRAS DO PROJETO (obrigatórias):
- Estender o que existe; não duplicar. Mapa: partners/PARTNER_KINDS, commissionRules/findRule, partnerLinks, partnerLeads,
  partnerPayouts, parceiros-ec.ts, painel-ec.tsx, parceiros-ec.tsx, /r/[slug], master/partners, perfil-loja.ts
  (ecommerce.recursos-por-plano), revisao-d220.ts.
- Regra de negócio em src/lib/domain/*; componente visual não decide regra; permissão no servidor; dinheiro em centavos
  (formatBRL); páginas com banco usam `export const dynamic = "force-dynamic"`.
- Valores comerciais (percentuais, bônus, limites) vêm de regras versionadas ou da tabela editável do Master, nunca fixos no
  componente. Mudança de valor = nova versão com motivo "Dxxx".
- Nada de números, logos, depoimentos ou clientes inventados nas páginas. Dado de demonstração sempre identificado.
- Taxa zero é "da plataforma"; o Mercado Pago cobra as taxas dele. Nunca escrever "mais barato" (use "mais vantajoso",
  "preço mais competitivo"). Visual: tipografia e kit de tecnologia (tech.css, CabecalhoTech, PainelTech), vidro colorido nas
  aberturas dos painéis (D225).
- Acessibilidade AA, sem rolagem horizontal em 360 px, foco visível, prefers-reduced-motion.
- SuperDrop não está em produção (D216); foco: NextLevel E-commerce + Master.
- Segredos só via encryptSecret; nunca em tela, log ou e-mail.

PRIORIDADE: Black Friday NextLevel termina em 30/11/2026 às 23h59. Faça BF1, BF2 e BF3 primeiro (no ar até 10/11), depois PV0 a PV8.
Regras da Black e do placar (seções 13 e 14 deste documento):
- Contagem regressiva SEMPRE para a data real do fim, vinda de UMA configuração no Master. Nunca reinicia por visitante,
  nunca é falsa (Código de Defesa do Consumidor e Procon). Quando acaba, a faixa some e a versão de preço agendada entra
  sozinha (catalogPriceVersions com effectiveFrom no fim da Black).
- "Preço Black" só é anunciado ao lado do preço depois da Black, que precisa ser real e já agendado.
- O placar é CALCULADO a partir dos itens da súmula (o dono edita os itens dos rivais no Master, com data e fonte);
  ninguém digita o resultado. Destaque só para os itens que vencemos; derrotas aparecem sem destaque, mas aparecem
  (nada escondido que possa ser contestado). "Ao vivo" = mostra a data e a hora da última atualização da súmula.
- Futebol sem marca de terceiros: nada de escudo de clube, CBF, FIFA ou logo de concorrente; nome do concorrente em texto.

COMO TRABALHAR CADA FASE (BF1..BF3, depois PV0..PV8, uma por vez, na ordem):
1. Confirme no início da fase as decisões pendentes do dono listadas na seção 10 que afetam a fase (pergunte só o que
   bloqueia; use os valores sugeridos do documento se o dono já aprovou).
2. Domínio + testes Vitest primeiro (casos: regra por trilha e nível, carência de descida, guarda-corpo de comissão,
   antifraude do bônus, limite de produtos com e sem excedente antigo, white label sempre indisponível com a chave desligada).
3. Migração com a skill nova-migracao (colunas novas com default ou anuláveis; provar que atualiza banco antigo; seeds
   idempotentes nos dois caminhos: demonstração e produção).
4. Telas: painel-interno para o Master e o painel do parceiro (fila "precisa de você", uma consulta por bloco, gaveta lateral,
   ações com resposta clara); pagina-de-vendas para /parceiros e /i/[codigo] (ex.: /i/anasouza) (seletor de perfil, escada de níveis, simulador,
   blocos da home reaproveitados, cadastro em etapas; listar ativos de foto que faltam em vez de usar foto genérica).
5. Conferência visual com qa-visual (1440, 768 e 390 px; interações; antes/depois) e mandar prints ao dono a cada passo.
6. Rodar: npx tsc --noEmit · npx eslint src e2e tests · testes do que mudou (a bateria completa nas fases com dinheiro) ·
   npm run build nas fases grandes.
7. Registrar a decisão nova em docs/design/DECISIONS.md e subir o "(próxima: Dxxx)" do CLAUDE.md; atualizar o estado deste
   prompt em docs/prompts/README.md.
8. Commit com o rodapé de atribuição da sessão; publicar com a skill publicar (push para a branch de trabalho, conferência em
   produção até "Tudo certo"). Nunca force push. Sem PR sem pedido do dono.
9. Reporte ao dono em português simples: o que ficou pronto, prints, o que depende dele e a próxima fase.

ENTREGÁVEIS POR FASE (resumo; detalhes nas seções 3 a 8, 13 e 14 do documento):
- BF1: configuração da campanha (início, fim, preço Black, preço depois, textos, liga/desliga), versão de preço agendada,
  componente ContagemRegressiva (servidor manda o fim; cliente só conta; acessível com aria-live educado), faixa da Black no
  topo de sites públicos e painéis.
- BF2: súmula no Master (rivais, planos, itens com valor, ganha/perde calculado, data e fonte), domínio placarDoClassico()
  com teste, componente PlacarGoleada (animação de gols, lances que vencemos em destaque, lances deles discretos), presença
  na home, /comparativo, /planos, página do parceiro e painel do lojista; imagem de compartilhar (story 1080x1920).
- BF4: kit Black da loja do lojista (faixa e contagem na vitrine, cupom de Black, selo nos produtos, campanha pronta),
  ligado pelo lojista no painel; reaproveitar cupons e campanhas que já existem.
- BF3: tema Black (preto, neon verde e ciano sobre o kit de tecnologia) em todos os sites públicos e nos 3 painéis,
  contadores nos pontos da seção 14.3, bloco "Black dos concorrentes × Black NextLevel".
- PV0: regras de comissão por trilha e nível da seção 3.2 (já aprovadas) versionadas (aprovadas na D226) + guarda-corpo testado.
- PV1: partner_profiles, partner_pipeline, partner_activities, partner_tier_history, partner_challenges, partner_brands (vazia).
- PV2: cálculo mensal de nível (sobe na hora, desce após 2 meses), nível fixado pelo Master com motivo, findRule por nível.
- PV3: CRM do Master (funil em colunas, ficha 360 em gaveta, fila ampliada, ranking, segmentos salvos, mensagem em massa,
  desafio do mês, CSV).
- PV4: /parceiros de altíssimo nível com subpáginas por perfil e cadastro em etapas que cria "Candidato" no funil.
- PV5: página do parceiro /i/[codigo] (ex.: /i/anasouza) (faixa do parceiro, cupom aplicado, blocos da home, personalização revisada pelo
  Master, atribuição 60 dias, QR e cartão para imprimir).
- PV6: escada de benefícios da seção 8.2 (produtos ativos 300/1.000/sem limite no Scale, pessoas 3/6/12, IA 40/350/1.200, atacado,
  propostas, planilha, tema pago, suporte, migração), editável no Master; verificação única no domínio; barra de uso;
  excedente antigo preservado; dados dos concorrentes por plano em comparativo-ecommerce.ts com data e fonte; tabela de
  benefícios com placar na home e em /comparativo; teste "ganha ou empata em mais itens em cada plano"; textos e IA.
- PV7: white label só esqueleto e bloqueado (configuração desligada, cartões "Em breve", "Quero ser avisado").
- PV8: painel do parceiro mostra nível, quanto falta, desafios e ranking.

CRITÉRIO DE PRONTO GERAL: o dono consegue, sem ajuda, (0) ligar a Black, ver a contagem em todo canto e o placar da
goleada atualizado quando muda um item na súmula, (a) ver quem precisa dele no CRM de parceiros e agir em 1 clique,
(b) mandar um parceiro novo para a página de captação e vê-lo cair como Candidato, (c) ver a página pessoal de um parceiro
com o cupom aplicado e a atribuição funcionando, (d) mudar um limite de plano no Master e ver o efeito no painel do lojista,
(e) ver o white label bloqueado e pronto para a próxima fase.
```

---

## 13. Placar da goleada: "O Clássico do E-commerce"

**Ideia:** o comparativo vira **jogo de futebol**. Cada item da tabela de benefícios (seção 8.2) é um **lance**: quem tem o melhor valor marca o gol. O resultado aparece num **placar de estádio**: **NextLevel 11 × 1 Nuvemshop**, **NextLevel 12 × 0 WBuy**.
- O visitante escolhe o rival e o plano: "Clássico do plano de entrada", "do intermediário", "do avançado".
- Os **gols que marcamos** aparecem em destaque.
- O gol deles aparece pequeno e discreto: "gol de honra".

### 13.1 Como é a peça (show de bola)
- **Placar de estádio** (painel de LED): fundo preto, números grandes em Space Grotesk, brilho neon verde e ciano.
  - Rótulo "AO VIVO" com ponto pulsando.
  - Data e hora da última atualização ("Súmula atualizada em 03/11 às 18h").
- **Animação dos gols:** ao entrar na tela, o placar conta de 0 até o resultado e cada gol entra com um "GOOOL" curto e confete verde.
  - Só uma vez por visita.
  - Respeita `prefers-reduced-motion`: sem animação, mostra o placar pronto.
- **Lances do jogo (linha do tempo):**
  - "12' Taxa zero da plataforma: GOL NextLevel (eles cobram 2%)";
  - "27' Atacado nativo: GOL NextLevel";
  - "54' Pedidos sem limite: GOL";
  - "81' Produtos sem limite: gol deles", em cinza e menor.
- **Melhores do jogo:**
  - "Artilheiro da partida: Taxa zero";
  - "Craque do jogo: Atacado nativo";
  - "Goleada" quando a diferença for de 5 ou mais.
- **Botão "Quero jogar no time que vence"** → cadastro, com o cupom da Black aplicado na época da Black.
- **"Compartilhar o placar":** gera imagem de story (1080 × 1920) e de feed. Serve para o parceiro postar e para as redes da NextLevel.

### 13.2 Onde aparece
- **Home:** logo depois da faixa do 0%, como peça principal da Black.
- **/comparativo:** no topo, com todos os rivais e planos.
- **/planos:** um placar pequeno em cada cartão de plano ("Start 11 × 1 Nuvemshop Essencial").
- **Página do parceiro (`/i/...`):** o placar com o nome do parceiro: "Ana escalou você no time campeão".
- **Painel do lojista:** "O seu plano contra os outros", um placar pequeno na abertura. Motiva a ficar e a subir de plano.
- **Painel do parceiro:** no kit de divulgação, a imagem pronta do placar.
- **Master:** a súmula (onde se edita) e a prévia do placar.

### 13.3 Súmula no Master (o dono alimenta à mão)
- **Rivais:** nome, site e data da coleta.
- **Planos de cada rival**, com preço e o degrau equivalente (entrada, intermediário, avançado).
- **Itens:**
  - nome do lance e minuto do jogo (a ordem de exibição);
  - valor nosso e valor deles;
  - regra de quem vence: maior, menor, sim/não, ou "sem limite" vence número;
  - fonte (link).
- **O placar é calculado.** Ninguém digita "11 × 1"; o sistema conta os lances.
  - Se o dono mudar um valor, o placar muda sozinho e a data de "atualizado" também.
- **Sem valor do rival = "não divulga"** e o lance não conta para ninguém (regra honesta da seção 8.2).
- **Histórico de alterações:** quem mudou o quê e quando.
- **Teste:** com os dados atuais, a NextLevel vence todos os jogos. Se uma mudança fizer perder um jogo, o Master recebe aviso na fila "Precisa de você" e o placar daquele jogo some do site até revisão. Nunca mostrar derrota em destaque nem esconder sem avisar o dono.

### 13.4 Dados de partida (seção 8.2, plano a plano)

| Jogo | Placar |
|---|---|
| Entrada | NextLevel **11 × 1** Nuvemshop · **12 × 0** Loja Integrada · **12 × 0** WBuy · **12 × 0** Tray |
| Intermediário | NextLevel **11 × 1** Nuvemshop · **12 × 0** Loja Integrada · **12 × 0** WBuy · **12 × 0** Tray |
| Avançado | NextLevel **11 × 1** Nuvemshop · **12 × 0** Loja Integrada · **12 × 0** WBuy · **12 × 0** Tray |

A tabela da seção 8.2 tem 12 itens. "12 × 0" significa ganhar ou empatar em todos. **Empate não é gol para ninguém**: o placar real exibido conta só os lances que vencemos. A súmula decide os números finais.

---

## 14. Black Friday NextLevel (novembro de 2026)

**Black Friday 2026: sexta, 27/11. A Black NextLevel vai até a Cyber Monday, 30/11 às 23h59** (decisão do dono). Começa assim que a BF1 for ao ar (meta: 10/11).

### 14.1 Mensagem
- **"Black Friday NextLevel: taxa zero da plataforma e o preço mais vantajoso do ano. Só até [data]."**
- **Contagem regressiva** com dias, horas, minutos e segundos.
- **"Vencemos todas as Blacks":** bloco **"Black deles × Black NextLevel"**, no formato do placar.
  - **Situação em 03/11:** os concorrentes ainda não publicaram as ofertas de Black 2026.
    - Referência de 2025: a Nuvemshop deu cashback em taxas do Nuvem Pago; a Loja Integrada deu 50% no plano Elite (R$ 1.999 → R$ 999).
  - O dono cadastra na súmula cada oferta assim que sair, com data e fonte. O bloco compara o **custo do 1º ano** (mensalidade de Black + taxa da plataforma) para a mesma loja.
  - Com taxa zero e mensalidade menor, **vencemos as Blacks de 2025 em todos os planos**. Para 2026, o teste da súmula confirma ou avisa.
- **Para quem assina na Black:** "Assinou na Black, o preço é seu enquanto a assinatura estiver ativa" (aprovado pelo dono).

### 14.2 A roupa da Black (veste tudo)
- **Tema Black** por cima do kit de tecnologia (D222):
  - preto profundo;
  - verde neon (#22e08a) e ciano (#22d3ee) como destaque;
  - selo "BLACK FRIDAY NEXTLEVEL" em Geist Mono;
  - borda em degradê animada lentamente.
  - Não cria um visual novo do zero: troca as variáveis de cor durante a campanha.
- **Liga e desliga sozinha** pela configuração da campanha (início e fim). Fora da campanha, tudo volta ao normal sem publicar código.
- **Veste:**
  - todos os sites públicos: home, recursos, comparativo, planos, temas, dúvidas, integrações, parceiros, quero minha loja, cadastro e login;
  - a página do parceiro;
  - os três painéis (lojista, Master e parceiro), na faixa do topo, na abertura e no selo.

### 14.3 Contadores "por todo canto"

O mesmo componente, com o mesmo fim e o mesmo relógio, em todos os lugares:

| Lugar | Forma |
|---|---|
| Faixa no topo de todos os sites públicos | "BLACK NEXTLEVEL · termina em 06d 14h 22m 10s · Garantir meu preço" |
| Topo da home (herói) | Contador grande ao lado do título |
| Faixa do 0% e placar da goleada | Contador pequeno no canto |
| Cartões de plano (home e /planos) | Riscado "depois da Black R$ X" + preço Black + contador |
| Cadastro e checkout do plano | "Seu preço Black vale até…" com contador |
| Página do parceiro | Contador + cupom do parceiro |
| Painel do lojista | Faixa no topo: "Black: anual com preço Black até…" (para quem está no teste ou no mensal) |
| Painel do parceiro | "Black dos parceiros: 1ª mensalidade a 100% até…" (aprovado pelo dono) |
| Master | Faixa com o contador + atalho para a configuração da Black e para a súmula |
| Vendedor IA (Maurício) | Responde sobre a Black e o prazo com o mesmo fim |

- O texto da contagem é atualizado de forma educada para leitor de tela: não a cada segundo, só nos minutos.
- **Na última hora:** contador em vermelho e "Últimos minutos".
- **Depois do fim:** "A Black acabou. Preço atual: R$ X". O contador some.

### 14.4 Regras para não virar "Black Fraude" (obrigatórias)
- **O fim da contagem é real** e igual para todos. Não reinicia por visitante e não estende em segredo. Para estender, o dono muda a data no Master e o site mostra "Prorrogada até…".
- **O preço depois da Black existe de verdade** e fica agendado como versão de preço (`catalogPriceVersions` com `effectiveFrom` no fim). Sem ele, a Black não liga (teste).
- **"De R$ X por R$ Y"** só com X = preço que vai valer depois da Black, já publicado na configuração.
- **Taxa zero continua "da plataforma"**: as taxas do Mercado Pago são à parte (D221).
- **"Vencemos todas as Blacks"** só aparece se a súmula comprovar com as ofertas cadastradas. Se faltar alguma, o texto vira "Vencemos as Blacks publicadas até [data]".

### 14.5 Dados novos (migração pequena)
- `campanhas`:
  - `chave` ("black-2026"), `inicio`, `fim`, `ativa`;
  - `precoDepoisVersao` (referência à versão agendada);
  - `textos` (json), `parceirosBonus` (json, opcional).
- `placar_rivais`, `placar_planos`, `placar_itens`: a súmula, com `fonte`, `coletadoEm`, `atualizadoPor`.
- `placar_historico`: auditoria das mudanças.

### 14.6 Oferta da Black: o argumento mais forte no semestral e no anual (proposta, a confirmar na pergunta A)

| Plano | Mensal (preço normal, segue igual) | **Semestral Black** (novo) | **Anual Black** |
|---|---|---|---|
| Start | R$ 57/mês | **R$ 47/mês** e paga 5, leva 6 → **R$ 39,17/mês** | R$ 37/mês e paga 10, leva 12 → **R$ 30,83/mês** |
| Pro | R$ 147/mês | **R$ 133/mês** e paga 5, leva 6 → **R$ 110,83/mês** | R$ 119/mês e paga 10, leva 12 → **R$ 99,17/mês** |
| Scale | R$ 347/mês | **R$ 322/mês** e paga 5, leva 6 → **R$ 268,33/mês** | R$ 297/mês e paga 10, leva 12 → **R$ 247,50/mês** |

- **Mensagem principal:** "**Black NextLevel: Start a R$ 30,83/mês no anual, com o preço travado enquanto você for cliente. Só até 30/11.**"
- **Depois de 01/12** (preço normal, agendado):
  - o anual volta para 37 / 119 / 297 por mês, **sem os 2 meses grátis**;
  - o semestral volta para 47 / 133 / 322 por mês, sem o mês grátis;
  - quem assinou na Black mantém o preço e as condições.
- **"De/por" honesto:**
  - "de R$ 37/mês (anual depois da Black) por R$ 30,83/mês";
  - "de R$ 57/mês no mensal por R$ 30,83/mês no anual Black".
- **Contra a concorrência**, no anual e no plano de entrada: Tray R$ 39, WBuy R$ 47,20, Nuvemshop R$ 59. **O anual Black vence todos**, e com taxa zero da plataforma.
- **Parceiros:** durante a Black, a 1ª mensalidade das lojas indicadas paga 100% de comissão. No anual, vale sobre o valor equivalente a uma mensalidade.
- **Cuidado de sistema:**
  - o semestral pede o ciclo novo `SEMIANNUAL` (o enum de ciclos é texto e não precisa de SQL), mais o checkout e a cobrança de 6 meses;
  - "paga 10, leva 12" e "paga 5, leva 6" viram meses de bônus na assinatura, e não um desconto escondido;
  - um teste garante o valor cobrado e a data da próxima cobrança.

### 13.5 (complemento) "Seleção dos concorrentes" e a regra para sempre vencer

O dono pediu: ganhar sempre no placar, ou usar um grupo de concorrentes mostrando o ponto mais fraco deles contra o nosso mais forte.

**Proposta:** dois formatos, os dois honestos.

1. **Jogo contra cada rival** (Nuvemshop, Loja Integrada, WBuy, Tray).
   - Só vai ao ar o jogo que **a súmula calcula como vitória**. Hoje, todos (seção 13.4).
   - Se um rival mudar e a gente deixar de vencer, aquele jogo sai do ar sozinho e o Master recebe aviso.
2. **"NextLevel × Seleção dos concorrentes"** (o grupo dos quatro). Cada lance mostra **o nosso ponto forte contra o ponto fraco de um concorrente, com o nome dele**:
   - "Taxa da plataforma: NextLevel 0% × Nuvemshop até 2%";
   - "Pedidos: sem limite × Tray até 100 por mês";
   - "Pessoas no painel: 3 × WBuy 1";
   - "Atacado: em todos os planos × Tray só no Avançado".
   - **Regra de honestidade:** cada lance diz **de qual concorrente** é o ponto fraco. Nunca mistura num "eles" genérico um valor que só um deles tem.
   - O placar da Seleção conta os lances em que vencemos **o melhor da Seleção naquele item**. Assim, "venceu a Seleção" é verdade e não pode ser contestado.
   - Os lances que destacam um concorrente específico aparecem como **"melhores momentos"**, sem mudar o placar.

O placar da Seleção, com os dados de hoje (plano de entrada), contando só os itens em que vencemos o melhor deles: cerca de **NextLevel 9 × 1**. Eles levam produtos sem limite (Nuvemshop); empates não contam. O item IA depende de como a súmula compara os "usos" da IA com os "créditos" da Tray: se contar como derrota, fica 8 × 2. A súmula confirma o número final.

