# Agência UP: análise e perguntas estratégicas para montar o cockpit

> **Para que serve:** roteiro de perguntas que o dono faz à UP para desenvolver o sistema operacional da agência de forma avançada (o "cockpit" da UP). Complementa `docs/prompts/agencias-parceiras-up-piloto.md` (racional, módulos, cobrança automática e escada de preços, Parte 8).
>
> **Situação em 16/11/2026:** o dono pediu à UP os departamentos, a equipe e as funções, e perguntou "o que é essencial você ver, como você quer encaminhar demandas e o que você precisa gerir sobre cada um deles. Preciso montar seu cockpit". A UP respondeu com a equipe (abaixo); o resto ainda não foi respondido.

---

## 1. O que já sabemos

### 1.1 A equipe da UP

| Pessoa | Função | Área |
|---|---|---|
| Bruna | Social media | Publicação e redes |
| Julia | Social media | Publicação e redes |
| Sirlene | Roteirização | Planejamento do conteúdo |
| Gustavo | Edição | Produção |
| Guilherme | Edição | Produção |
| Alam | Tráfego pago | Anúncios |
| Dono(a) da UP | (não informado) | Provavelmente comercial, atendimento, financeiro e gravação |

> E-mails ainda não vieram. Quando vierem, **não colocar neste documento**: entram só no sistema, no convite de cada pessoa.

### 1.2 O que a equipe revela (leitura do dono)

1. **O caminho de uma peça já está desenhado pela equipe:**
   ```
   Roteiro (Sirlene) → Gravação (quem?) → Edição (Gustavo, Guilherme) → Publicação (Bruna, Julia) → Anúncio (Alam)
   ```
   O quadro de produção do sistema (M3) deve seguir **exatamente essa sequência**, com essas cinco funções.

2. **Falta a gravação na lista.** A UP é uma agência de **captação de conteúdo**, mas ninguém aparece como videomaker ou fotógrafo. Ou o dono da UP grava, ou usa freelancers, ou o cliente grava. Isso muda a agenda de gravação (M4) e o custo por cliente. **É a primeira pergunta a fazer.**

3. **Ninguém aparece em atendimento, comercial e financeiro.** Quase certo que tudo isso está com o dono da UP. Ou seja, **o cockpit é para o dono da UP**: ele precisa ver dinheiro, prazos e gargalos sem precisar perguntar a ninguém.

4. **Conta rápida de capacidade (hipótese, confirmar):** se cada um dos 30 clientes recebe cerca de 8 vídeos por mês, são **240 vídeos por mês**:
   - para **2 editores**, são cerca de 120 vídeos por editor por mês, uns **6 por dia útil**;
   - para **2 social media**, são uns 15 clientes por pessoa.

   **O gargalo provável é a edição.** O cockpit deve mostrar a fila de cada editor e o que vai atrasar.

5. **A UP faz tráfego pago (Alam), e isso é ótimo para o sistema.** Posição do dono (16/11/2026): **a NextLevel oferece uma solução para a empresa da UP; não somos concorrentes.** Então o tráfego da UP é mais um departamento a ser atendido pelo cockpit, não um conflito. O Alam tende a ser um dos maiores usuários das ferramentas que já existem: página de campanha para onde o anúncio leva, formulário de orçamento, origem de cada contato e leitura dos resultados da Meta (D302). Com elas ele prova o retorno do anúncio que faz.

6. **Social media publica:** então a UP não só entrega o arquivo. O calendário de postagem por cliente é parte do sistema (vista em calendário do M3), e talvez a aprovação do cliente aconteça **antes de postar**.

### 1.3 O que é o cockpit (definição para alinhar com a UP)

Uma tela que o dono da UP abre de manhã e que responde, em 30 segundos, cinco perguntas:

| Pergunta | O que aparece |
|---|---|
| **O dinheiro está entrando?** | Recebido no mês, a receber, atrasados (quem e quanto) |
| **A produção está no prazo?** | Peças do mês por cliente (feito x combinado), o que vence hoje e o que já atrasou |
| **Onde está o gargalo?** | Fila de cada pessoa (roteiro, edição, publicação, tráfego) e quem está sobrecarregado |
| **Algum cliente está em risco?** | Atrasou pagamento, reprovou muita peça, ficou sem entrega, sem resultado no mês, contrato vencendo |
| **O cliente está tendo resultado?** | Contatos, vendas e anúncios do mês, para quem usa a NextLevel |

E, para cada pessoa da equipe, uma versão menor: **"minha fila de hoje"**.

---

## 2. Como conduzir

- **Formato recomendado:** uma conversa de **1 hora** (vídeo ou presencial) com o dono da UP, usando os Blocos 1 a 4, e depois **15 minutos com cada pessoa da equipe** (Bloco 5). Pelo WhatsApp as respostas vêm curtas demais para desenhar o sistema.
- **Se for pelo WhatsApp:** mandar em **3 rodadas** (seção 5), uma por dia, no máximo 6 perguntas por vez.
- **Peça para mostrar, não só contar:** a planilha de clientes, o grupo de WhatsApp de um cliente, a pasta do Drive de um mês, um relatório que mandam hoje. Um print vale mais que dez respostas.
- **Pergunte pelo último caso real:** "como foi o último vídeo do cliente X, do pedido até o post?" Isso mostra o processo de verdade, não o ideal.
- **Anote as respostas** em `docs/melhorias/up-respostas-descoberta.md`, uma seção por bloco, com a data.

**Prioridade:** ⭐ = essencial para começar o piloto · ○ = importante, pode vir depois.

---

## 3. As perguntas

### Bloco 1. Visão e o que dói (para o dono da UP)

| # | Pergunta | Por que perguntar | O que muda no sistema |
|---|---|---|---|
| 1.1 ⭐ | Se o sistema resolvesse **uma coisa só** nos próximos 90 dias, qual seria? | Define o que entregar primeiro | Ordem das fases |
| 1.2 ⭐ | O que mais toma o seu tempo hoje e você queria parar de fazer? | Acha a tarefa repetitiva que o sistema pode tirar da mão dele | O que automatizar primeiro |
| 1.3 ⭐ | Onde você quer a UP daqui a 12 meses: quantos clientes, quantas pessoas, que faturamento? | Diz se o sistema precisa escalar para 60 ou para 200 clientes | Escada de preços (degrau 1, 2 ou 3) |
| 1.4 | O que impede a UP de pegar mais clientes hoje: venda, equipe, organização ou dinheiro? | Separa problema comercial de problema de operação | Foco do cockpit |
| 1.5 | Já perderam cliente por desorganização, atraso ou falta de resultado? Conte o último caso | Mostra o risco que o sistema precisa evitar | Alertas de risco do cliente |
| 1.6 ○ | Já tentaram algum sistema (Trello, Notion, ClickUp, mLabs, planilha)? Por que parou? | Evita repetir o que já falhou | Simplicidade das telas |

### Bloco 2. Clientes e contratos

| # | Pergunta | Por que perguntar | O que muda no sistema |
|---|---|---|---|
| 2.1 ⭐ | Pode mandar a lista dos 30 clientes com segmento, valor mensal e o que está incluso? (planilha) | É a base da importação e dos cenários de preço | Importação (AG2), contratos |
| 2.2 ⭐ | Quais pacotes vocês vendem? (ex.: 8 vídeos + 12 posts + tráfego) Cada cliente tem um pacote diferente? | Define o "combinado do mês" de cada cliente | Plano do mês, contrato recorrente |
| 2.3 ⭐ | Tem contrato assinado com todos? Prazo mínimo? Multa de saída? | Base da cobrança e do reajuste | Contratos com assinatura no painel |
| 2.4 | O que acontece quando o cliente pede algo fora do pacote (vídeo extra, diária)? Cobram? Como? | Mostra receita que hoje escapa | Avulsos com link de pagamento |
| 2.5 | Quantos clientes entraram e quantos saíram nos últimos 6 meses? Por quê saíram? | Mede o cancelamento | Painel de cancelamentos e alertas |
| 2.6 ○ | O cliente tem um responsável fixo na UP? Quem fala com ele? | Define "dono do cliente" na carteira | Responsável na ficha do cliente |
| 2.7 ○ | Quantos clientes têm site, loja virtual ou página de vendas? Com quem? | Tamanho da oportunidade dos adicionais NextLevel | Vitrine de adicionais |

### Bloco 3. Dinheiro e cobrança

| # | Pergunta | Por que perguntar | O que muda no sistema |
|---|---|---|---|
| 3.1 ⭐ | Quanto a UP fatura por mês com os 30 clientes (aproximado)? | Escolhe o degrau de preço certo (seção 8.5 do racional) | Proposta comercial |
| 3.2 ⭐ | Como cobram hoje: Pix, boleto, cartão, transferência? Por qual banco ou plataforma? Quanto pagam de tarifa? | Define o meio de pagamento a conectar | Integração (Mercado Pago, Pagar.me ou outro) |
| 3.3 ⭐ | Quantos clientes atrasam por mês? Quem cobra e como? Quanto tempo isso toma? | Linha de base para medir o piloto | Régua de cobrança, metas do piloto |
| 3.4 ⭐ | Emitem nota fiscal em todo pagamento? Por qual sistema? Quem emite? | Nota fiscal automática é um grande pedido | Prioridade da integração de nota fiscal |
| 3.5 | Os vencimentos são todos no mesmo dia ou cada cliente tem o seu? | Desenho da fatura recorrente | Configuração de vencimento |
| 3.6 | Cobram multa e juros por atraso? Dão desconto por pagar em dia? | Regras da régua | Multa, juros e desconto |
| 3.7 | Quando o cliente atrasa, vocês param de produzir? Depois de quantos dias? | Regra de inadimplência | "Pausar produção após X dias" |
| 3.8 | O dinheiro da mídia (anúncios) passa pela UP ou o cliente paga direto à Meta/Google? | Muda o que é volume da agência e o que é repasse | Base do percentual da NextLevel |
| 3.9 ○ | Quanto custa a equipe por mês (aproximado) e como pagam (CLT, PJ, freela por peça)? | Permite a margem por cliente | Financeiro da agência (custo x receita) |

### Bloco 4. Como as demandas andam hoje

| # | Pergunta | Por que perguntar | O que muda no sistema |
|---|---|---|---|
| 4.1 ⭐ | Conte o último vídeo de um cliente: do pedido até o post, quem fez o quê e quanto tempo levou | Mostra o processo real | Etapas do quadro de produção |
| 4.2 ⭐ | **Quem grava?** Você, freelancers, o próprio cliente? Quantas gravações por semana? | A gravação não aparece na equipe | Agenda de gravação, custo por cliente |
| 4.3 ⭐ | Como o cliente pede as coisas hoje: grupo de WhatsApp, ligação, e-mail? Um grupo por cliente? | Define por onde a demanda entra no sistema | Entrada de pedidos, portal do cliente |
| 4.4 ⭐ | Quem decide o que cada pessoa faz no dia? Como a demanda chega até o editor? | Mostra se o dono é o "distribuidor" de tudo | Distribuição automática x manual |
| 4.5 ⭐ | O cliente aprova antes de postar? Roteiro, vídeo ou os dois? Quantas idas e voltas, em média? | Desenho da aprovação | Aprovação no portal (roteiro e vídeo) |
| 4.6 | Qual o prazo de cada etapa (roteiro, edição, ajuste)? Existe combinado com o cliente? | Base para os alertas de atraso | Prazos por etapa |
| 4.7 | Onde ficam os arquivos brutos e os finais? Como passam do editor para a social media? | Biblioteca por link | Biblioteca e entrega |
| 4.8 | Vocês publicam pelo Meta Business Suite, mLabs, outro? Agendam? | Evita refazer o que a ferramenta já faz | Calendário de postagem, integração futura |
| 4.9 ○ | O que é urgente para vocês? O cliente pode pedir "pra hoje"? | Regra de prioridade | Etiqueta de urgência na fila |

### Bloco 5. Função por função (o que o dono da UP precisa gerir de cada um)

Perguntar **ao dono da UP** ("o que você precisa ver de cada um?") e depois **a cada pessoa** ("o que te atrapalha no dia?").

**Roteiro (Sirlene)**
- ⭐ Quantos roteiros por semana? Como recebe o assunto de cada cliente (pauta, briefing, reunião)?
- Usa modelo de roteiro? Por cliente ou por tipo de vídeo?
- O cliente aprova o roteiro antes da gravação?
- *O dono da UP quer ver:* roteiros prontos x pendentes da semana, quais clientes estão sem pauta.

**Edição (Gustavo, Guilherme)**
- ⭐ Quantos vídeos cada um edita por dia? Como dividem os clientes entre os dois?
- ⭐ O que mais atrasa a edição: material bruto ruim, ajuste do cliente, falta de roteiro, fila grande?
- Quantas versões, em média, até aprovar?
- *O dono da UP quer ver:* fila de cada editor, tempo médio por vídeo, peças paradas em ajuste, quem está sobrecarregado.

**Social media (Bruna, Julia)**
- ⭐ Quantos clientes cada uma atende? Fazem legenda, arte, agendamento, resposta de comentário e direct?
- Têm o calendário de postagem do mês de cada cliente? Onde?
- Quem fala com o cliente no dia a dia: elas ou o dono?
- *O dono da UP quer ver:* posts do dia publicados x previstos, clientes sem post na semana, calendário do mês aprovado ou não.

**Tráfego pago (Alam)**
- ⭐ Quantos clientes têm anúncio? Quem paga a mídia e quanto, em média, por cliente?
- ⭐ Para onde o anúncio leva hoje: WhatsApp, Instagram, site, formulário? Como mede se virou cliente?
- Como faz o relatório de resultados? Em que ferramenta?
- *O dono da UP quer ver:* investimento x resultado por cliente, campanhas paradas, clientes sem anúncio que deveriam ter.
- *Ferramentas que o sistema dá ao Alam:* página de campanha, formulário, origem dos contatos e leitura da Meta, para provar o retorno de cada anúncio ao cliente.

**Gravação (a confirmar)**
- ⭐ Quem grava, quantas gravações por semana, onde (no cliente, em estúdio)?
- Como agendam com o cliente e quantas são remarcadas?
- *O dono da UP quer ver:* agenda da semana, gravações confirmadas, quem está escalado, remarcações.

**Todos**
- ○ Cada pessoa trabalha presencial, remoto ou misto? CLT, PJ ou freela?
- ○ Existe meta individual? Como sabem se foram bem no mês?
- ○ O que cada pessoa **não** pode ver (valores dos contratos, dados de pagamento, clientes de outra pessoa)?

### Bloco 6. O cockpit (o que é essencial ver)

| # | Pergunta | O que muda no sistema |
|---|---|---|
| 6.1 ⭐ | Quando você abre o sistema de manhã, quais **3 números** quer ver primeiro? | Topo do cockpit |
| 6.2 ⭐ | Sobre o que você quer ser **avisado na hora** (sem abrir o sistema)? Ex.: cliente atrasou pagamento, vídeo reprovado, gravação cancelada | Alertas e por onde chegam (WhatsApp, e-mail, celular) |
| 6.3 ⭐ | Vai olhar mais pelo **celular** ou pelo computador? | Desenho da tela (celular primeiro?) |
| 6.4 | Que relatório você quer receber toda semana e todo mês sem pedir? | Resumo semanal e mensal automáticos |
| 6.5 | Que decisões você toma toda semana (contratar, cobrar, renegociar, cortar cliente)? Que número ajudaria? | Indicadores do cockpit |
| 6.6 ○ | Mais alguém da UP precisa ver o cockpit inteiro (sócio, gerente)? | Papéis e permissões |

### Bloco 7. O cliente da UP (portal e resultado)

| # | Pergunta | O que muda no sistema |
|---|---|---|
| 7.1 ⭐ | O que o cliente mais pergunta a vocês no mês? | O que o portal mostra primeiro |
| 7.2 ⭐ | Vocês mandam relatório para o cliente hoje? Mostre um | Modelo do relatório mensal |
| 7.3 | O cliente aceitaria aprovar, pagar e acompanhar por um portal em vez do WhatsApp? Quais clientes resistiriam? | Plano de adoção do portal |
| 7.4 | Como o cliente mede se o trabalho da UP funciona? | Indicadores do relatório (contatos, vendas, alcance) |
| 7.5 ○ | Vocês têm acesso às contas do cliente (Instagram, Meta Ads, Google)? Como guardam as senhas? | Cuidado com segurança (nunca guardar senha de cliente em texto) |

### Bloco 8. Parceria, comercial e compromisso

| # | Pergunta | O que muda |
|---|---|---|
| 8.1 ⭐ | Quem da UP vai ser o responsável pelo piloto e quantas horas por semana pode dar? | Ritmo do piloto |
| 8.2 ⭐ | Querem que o portal apareça só com a marca UP? | Degrau 1 x white label |
| 8.3 ⭐ | Toparia passar **todos** os clientes e cobranças pelo sistema durante o piloto? | Validade do piloto e do percentual |
| 8.4 | Vocês teriam interesse em oferecer site, página de campanha e loja aos clientes, com comissão? Quais clientes primeiro? | Vitrine de adicionais |
| 8.5 | Vocês querem revender as soluções da NextLevel com a marca UP, indicar com comissão, ou só usar como ferramenta interna? | Papel da vitrine de adicionais |
| 8.6 | O que faria você dizer, em 90 dias, "não volto mais para o jeito antigo"? E o que faria você desistir? | Critério de sucesso do piloto |
| 8.7 ○ | Conhecem outras agências que teriam o mesmo problema? | Próximas agências (produto para grandes agências) |

### Bloco 9. Dados e mudança

| # | Pergunta | O que muda |
|---|---|---|
| 9.1 ⭐ | Onde estão hoje: lista de clientes, contratos, calendário, arquivos, cobranças? Pode compartilhar? | Plano de importação |
| 9.2 | Qual o melhor mês para virar a chave (menos gravação, menos fechamento)? | Data da migração |
| 9.3 ○ | Os clientes assinaram algo autorizando a UP a guardar os dados deles? | Consentimento e LGPD |

---

## 4. O que as respostas decidem

| Resposta | Decide |
|---|---|
| Faturamento mensal (3.1) e crescimento (1.3) | O degrau de preço (seção 8.5 do racional) e se o piloto já nasce pensando em white label |
| Quem grava (4.2) | Se a agenda de gravação entra no começo ou depois |
| Como cobra e nota fiscal (3.2, 3.4) | Qual meio de pagamento integrar primeiro e se a nota fiscal sobe na fila |
| Caminho da demanda (4.1, 4.3, 4.4) | As etapas do quadro e se a distribuição é automática ou feita pelo dono |
| Aprovação do cliente (4.5, 7.3) | Se o portal aprova roteiro, vídeo ou os dois, e quando |
| Os 3 números e os alertas (6.1, 6.2, 6.3) | A primeira tela do cockpit e os avisos |
| Tráfego pago (Bloco 5, Alam) | As telas do Alam no cockpit (investimento x resultado por cliente) e a página de campanha como ferramenta dele |
| Responsável e compromisso (8.1, 8.3) | Se o piloto começa já ou espera |

---

## 5. Mensagens prontas para o WhatsApp (se não houver conversa ao vivo)

**Rodada 1 (visão, dinheiro e equipe):**
> Obrigado pela equipe! Para eu montar o seu cockpit do jeito certo, me responde (pode ser em áudio):
> 1. Se o sistema resolvesse uma coisa só nos próximos 90 dias, qual seria?
> 2. Quem grava os conteúdos? Você, freelancer ou o próprio cliente?
> 3. Quanto a UP fatura por mês com os clientes, mais ou menos?
> 4. Como vocês cobram hoje (Pix, boleto, cartão) e quantos clientes atrasam por mês?
> 5. Emitem nota fiscal em todo pagamento? Por qual sistema?
> 6. Pode me mandar a planilha (ou print) da lista de clientes com o valor e o que cada um recebe no mês?

**Rodada 2 (demandas e aprovação):**
> Agora sobre o dia a dia:
> 1. Me conta o último vídeo de um cliente, do pedido até o post: quem fez o quê e quanto tempo levou?
> 2. Como o cliente pede as coisas: grupo de WhatsApp por cliente?
> 3. Quem decide o que cada pessoa faz no dia?
> 4. O cliente aprova antes de postar? O roteiro, o vídeo ou os dois?
> 5. Onde ficam os arquivos (Drive, Dropbox)?
> 6. O Alam leva os anúncios para onde: WhatsApp, Instagram ou site? Como sabe se virou cliente?

**Rodada 3 (cockpit):**
> Última parte, a mais importante:
> 1. Quando abrir o sistema de manhã, quais 3 números você quer ver primeiro?
> 2. Sobre o que você quer ser avisado na hora, no celular?
> 3. O que você precisa acompanhar de cada pessoa da equipe (Sirlene, Gustavo, Guilherme, Bruna, Julia, Alam)?
> 4. Vai usar mais pelo celular ou pelo computador?
> 5. O que cada pessoa da equipe **não** pode ver (valores, pagamentos)?
> 6. O que faria você dizer em 90 dias: "não volto mais para o jeito antigo"?

---

## 6. Próximo passo depois das respostas

1. Registrar as respostas em `docs/melhorias/up-respostas-descoberta.md`.
2. Desenhar a primeira tela do cockpit e a fila de cada função, e mostrar ao dono (print real no navegador).
3. Fechar com o dono o degrau de preço e o termo de Agência Fundadora (seções 8.5 e 8.6 do racional).
4. Registrar as decisões novas (a D312, código não se vende, já está registrada) e começar a AG0.
