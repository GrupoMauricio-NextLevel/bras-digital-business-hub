# Painel de Agências (NextLevel Agências): racional e piloto com a agência UP

> **Situação (dono, 16/11/2026):** a agência **UP** está chegando com **30 clientes**. A UP é especializada em **captação de conteúdo mensal**: gravação de criativos, vídeos, fotos, conteúdo recorrente para redes sociais. **Não compete** com a NextLevel (sites, lojas virtuais, gerenciador do negócio, captação de clientes, tráfego, sistemas). O dono quer:
> 1. um **painel avançado para agências**, para que elas aproveitem o ecossistema e conectem os próprios clientes;
> 2. fazer um **piloto com a UP** e virar o **sistema operacional da agência**, indo além das soluções da NextLevel;
> 3. oferecer as **soluções da NextLevel como adicional** para os clientes da UP.
>
> **Versão 2 (16/11/2026):** a UP quer também **receber pagamentos e cobrar os clientes automaticamente**, e o piloto passa a ser **exclusivo para a UP como Agência Fundadora de um produto para grandes agências**. A **Parte 8** traz o sistema operacional completo, a cobrança automática e a análise da escada de preços (Business R$ 3 mil + 10%, white label R$ 15 mil + 3%, código próprio R$ 30 mil + 0%), e **prevalece** sobre as Partes 1 a 7 onde houver conflito.
>
> **Perguntas para a UP e leitura da equipe (roteiro, edição, social media, tráfego pago):** `docs/prompts/agencias-up-perguntas-estrategicas.md`.
>
> **Estado deste documento:** proposta para o dono decidir. Nada aqui está aprovado nem no código. Quando aprovado, vira a decisão **D312** em `docs/design/DECISIONS.md` (frente `[E-commerce]`, porque traz lojistas e contas pagantes para a NextLevel Commerce) e é citado na base de conhecimento (`docs/conhecimento/BC0-INVENTARIO.md`).
>
> **Documentos que este plano respeita:** Constituição (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`), regra anti-duplicação (`CLAUDE.md`), NextLevel Business (`docs/prompts/nextlevel-business-coracao-do-negocio.md`, D304 a D311), Programa de Parceiros (D220; regra única de comissão D260; duas frentes, CPF e CNPJ, D263), público e personas (`docs/prompts/publico-personas-precos-ecossistema.md`, persona P12 "o parceiro").

---

## Resumo em uma página (para o dono)

**A ideia em uma frase:** a UP passa a **tocar a agência inteira dentro da NextLevel** (clientes, agenda de gravação, produção, aprovação de vídeos, entrega, cobrança e relatório), e cada cliente da UP ganha, sem esforço, uma **conta NextLevel Business**, onde a UP (ou a própria NextLevel) oferece site, loja virtual, página de campanha e o resto do ecossistema como adicional.

**Por que isso é bom para a NextLevel:**
- **30 clientes de uma vez é três vezes a meta dos 10 lojistas pagantes** (D174). Nenhuma outra ação comercial hoje traz esse volume com custo de aquisição perto de zero.
- A agência **já tem a confiança** do cliente e fala com ele todo mês. A NextLevel não precisa convencer 30 empresas, precisa convencer uma agência.
- O cliente da UP **já produz conteúdo** todo mês, mas o conteúdo hoje "morre" no Instagram. A NextLevel é o lugar para onde esse conteúdo leva o cliente final: site, página de campanha, loja, formulário de orçamento, WhatsApp. **Os dois serviços se completam:** a UP faz o vídeo; a NextLevel transforma o vídeo em contato e venda.
- Depois da UP, o mesmo painel serve para **qualquer agência de conteúdo, social media, fotografia ou produtora**. É um canal de venda que se repete.

**Por que isso é bom para a UP:**
- Um sistema para organizar a agência (hoje provavelmente é planilha, WhatsApp, Google Drive e Trello soltos).
- Uma **nova fonte de receita** sem contratar ninguém: comissão sobre tudo o que os clientes dela contratarem na NextLevel (regra única vigente, D260 e D263: **20% de toda mensalidade paga, desde a primeira, enquanto o cliente ficar**; 24% com 10 clientes ativos e 28% com 25; agência parceira só com CNPJ).
- **Resultado para mostrar ao cliente**: o vídeo que a UP gravou gerou X visitas, Y contatos e Z vendas. Isso segura o contrato mensal da UP (o cliente não cancela o que mostra resultado).
- Portal para o cliente aprovar os vídeos, ver a agenda e baixar os arquivos, com a marca da UP.

**Por que isso é bom para o cliente da UP:**
- Um lugar só para ver o que a agência está fazendo, aprovar, baixar e acompanhar resultado.
- Acesso fácil a site, página de campanha e loja virtual com o conteúdo que ele já tem.

**Modelo comercial recomendado para o piloto (90 dias):**
- Painel da agência **grátis durante o piloto** para a UP.
- Cada cliente da UP ganha uma **conta NextLevel Business** com teste estendido durante o piloto.
- O que o cliente contratar na NextLevel (site, plano de loja, serviços) é cobrado pela **tabela de preços do Master**, e a UP recebe a comissão de agência.
- Depois do piloto: **preço por cliente ativo no painel** (valor a definir pelo dono na tabela de preços; sugestão de teste na seção 9), com o painel liberado sem custo enquanto a agência mantiver um número mínimo de clientes pagantes na NextLevel.

**O que construir primeiro (ordem do piloto):** carteira de clientes → produção do mês (pautas, gravações, edições) → aprovação pelo cliente → entrega e biblioteca → relatório mensal → vitrine de adicionais com comissão → cobrança mensal da agência. Detalhes na Parte 4 (fases AG0 a AG9).

**O que precisa do dono antes de começar:** responder as perguntas da Parte 6 (principalmente: quem é "dono" do cliente, se a UP aparece com a própria marca para os clientes, e se a cobrança da UP para os clientes dela passa pela plataforma).

---

## Mapa do documento

- **Parte 1. O racional** (por que, para quem, o que cada lado ganha, os limites)
- **Parte 2. O produto: o Painel da Agência** (módulos, telas, portal do cliente, vitrine de adicionais)
- **Parte 3. Como encaixa no sistema que já existe** (o que reaproveita, o que falta, modelo de dados)
- **Parte 4. Fases para o engenheiro** (AG0 a AG9, com critérios de aceite)
- **Parte 5. O piloto com a UP** (cronograma de 90 dias, metas, rotina, riscos)
- **Parte 6. Perguntas para o dono e para a UP**
- **Parte 7. Números do piloto** (simulação, sem promessa de ganho)
- **Parte 8. Versão 2: sistema operacional exclusivo para a UP, cobrança automática e monetização** (prevalece)

---

# Parte 1. O racional

## 1.1 O que é a UP (o que sabemos e o que falta saber)

| Sabemos | Falta confirmar com a UP |
|---|---|
| Agência de **captação de conteúdo mensal**: gravação de criativos, vídeos, conteúdo recorrente | Quantas pessoas trabalham lá e em que funções (videomaker, editor, social media, atendimento) |
| Tem **30 clientes** | Que tipo de negócio são os clientes (clínica, restaurante, academia, loja, prestador de serviço?) |
| Não compete com a NextLevel | Quanto cada cliente paga por mês e como é cobrado (boleto, Pix, cartão, nota fiscal) |
| Quer usar o ecossistema | Que ferramentas usam hoje (Drive, Trello, Notion, planilha, WhatsApp, Frame.io) |
| | Quantos clientes já têm site, loja virtual, tráfego pago e com quem |
| | Se a UP publica o conteúdo nas redes do cliente ou só entrega o arquivo |
| | Se quer aparecer com a marca dela para os clientes (portal com a marca UP) |

**Por que isso importa:** o tipo dos 30 clientes define quais adicionais da NextLevel fazem sentido primeiro. Prestador de serviço (clínica, academia, escritório) → **Site + formulário de orçamento + página de campanha** (caminho Site do NextLevel Business, D306 a D310). Quem vende produto → **Loja virtual** (planos Start, Pro, Scale, intactos, D311).

## 1.2 A tese: o conteúdo precisa de um destino

Uma agência de conteúdo entrega **vídeo e foto**. O cliente posta, ganha curtida, e a pergunta que ele faz no fim do mês é: **"isso me trouxe cliente?"** Quando a resposta não é clara, o contrato mensal fica frágil.

A NextLevel tem exatamente o que falta nessa ponta:

```
UP (conteúdo)                         NextLevel (conversão)
──────────────                         ─────────────────────
Gravação mensal  ──►  Vídeo / criativo ──►  Página de campanha / Site / Loja
                                               │
                                               ▼
                                     Formulário de orçamento, WhatsApp, compra
                                               │
                                               ▼
                                 Contatos e orçamentos (NB3), Resultados da Meta (D302)
                                               │
                                               ▼
                          Relatório do mês: "o vídeo X trouxe N contatos e R$ Y em vendas"
```

Ou seja: **a UP vende o vídeo, a NextLevel prova que o vídeo funcionou.** Juntos, os dois contratos ficam mais fortes do que separados.

## 1.3 Os três lados ganham (e o que cada um paga)

| Lado | Ganha | Paga |
|---|---|---|
| **UP (agência)** | Sistema operacional da agência; portal do cliente; relatório de resultado; nova receita por comissão; argumento para reter cliente | Nada no piloto; depois, valor por cliente ativo no painel (ou isenção por volume de clientes pagantes) |
| **Cliente da UP** | Lugar único para aprovar, baixar e acompanhar; acesso fácil a site, página de campanha e loja | Só o que contratar na NextLevel (pela tabela do Master), mais o que já paga à UP |
| **NextLevel** | 30 contas Business de uma vez; canal de venda que se repete com outras agências; conteúdo de qualidade circulando nas páginas e lojas | Desenvolvimento do painel; comissão à UP (já prevista na regra de agência) |

## 1.4 Os limites (o que este projeto **não** é)

> **Posição do dono (16/11/2026):** a NextLevel **oferece uma solução para a empresa da UP**; não somos concorrentes. O tráfego pago que a UP faz (Alam) não é conflito: é um departamento a mais que o sistema atende. O item 1 abaixo vale só para os serviços que a NextLevel vende aos clientes da UP, e a lista é combinada com a UP.

1. **A NextLevel não vira concorrente da UP.** O catálogo de soluções que a NextLevel oferece aos clientes da UP **não inclui** captação de conteúdo, gravação ou edição de vídeo. Se algum serviço da NextLevel encostar nisso (por exemplo "Consultoria e auditoria de crescimento" ou imagens geradas para temas), ele fica **fora da vitrine da UP** ou aparece só com o aceite da UP. Isso vira regra no sistema (lista de serviços por agência), não só combinado verbal.
2. **A NextLevel não aborda o cliente da UP por fora.** Nada de e-mail de venda, campanha ou ligação da equipe comercial NextLevel para um cliente que entrou pela UP sem a UP saber. O cliente fica marcado como "da agência UP" e a equipe comercial vê o aviso. (Avisos de sistema, como fatura, segurança e mudança de termos, continuam indo, porque são obrigação.)
3. **O dado é do cliente.** O cliente da UP é dono dos dados do negócio dele (contatos, pedidos, páginas). A agência acessa **com autorização do cliente**, e o cliente pode retirar a autorização. Se a UP e o cliente se separarem, o cliente leva a conta NextLevel com ele; a UP perde o acesso e a comissão futura daquele cliente (regra a confirmar com o dono, pergunta 6.1).
4. **Um cliente nunca vê outro.** A carteira da agência é separada por cliente, como já é a separação por loja hoje (regra "um tenant nunca lê dados de outro").
5. **Sem promessa de ganho** em nenhuma tela ou material: relatório mostra o que aconteceu, não o que vai acontecer.
6. **Não é um novo produto com marca nova.** É uma área de painel ("Agência") do mesmo sistema, como o NextLevel Business é uma área do painel (D304). Nome de mercado sugerido: **NextLevel Agências** (ou "Painel da Agência"); o dono decide.

## 1.5 Por que agora (e por que não atrapalha o foco)

- A regra de foco 60/25/15 (D174) manda priorizar o que aproxima a E-commerce do **10º lojista pagante**. Um canal que traz 30 contas é a ação de maior alavanca disponível hoje.
- Boa parte do que o painel precisa **já existe** (Parte 3): contas Business, Site, Contatos e orçamentos, leitura da Meta, propostas com link, programa de parceiros com comissão de agência, equipe da loja com login próprio, auditoria. O trabalho novo é principalmente a **camada da agência** (carteira, produção, aprovação e relatório).
- Risco de dispersão: o "sistema operacional da agência" pode crescer sem fim (financeiro completo, nota fiscal, folha da equipe, CRM de prospecção da agência...). Por isso o piloto tem **escopo fechado** (Parte 5.2) e cada pedido novo da UP entra numa fila para o dono aprovar.

## 1.6 Os três jeitos de trabalhar com uma agência (e qual usar no piloto)

| Modelo | Como funciona | Bom para | Cuidado |
|---|---|---|---|
| **A. Agência parceira** (já existe: `partners.kind = AGENCY`) | A agência indica clientes e ganha comissão. Não opera nada no sistema | Agência que só quer indicar | Não resolve o pedido do dono: não é sistema operacional |
| **B. Agência operadora** (novo) | A agência tem um painel próprio com a carteira de clientes, a equipe, a produção do mês e o portal do cliente; também ganha comissão como em A | **A UP** e agências de conteúdo e social media | Precisa do painel novo (este documento) |
| **C. White label** (já existe no catálogo: "White Label NextLevel", sob orçamento) | A agência vende a plataforma inteira com a marca dela | Agência grande, que quer revender site e loja como produto próprio | Mais caro e complexo; deixa a NextLevel invisível |

**Recomendação:** piloto no **modelo B** (que já inclui a comissão do A). O portal do cliente pode mostrar **o logo e as cores da UP** ("UP, com tecnologia NextLevel") sem ser white label completo; o white label total (domínio da UP, NextLevel invisível) fica para depois, se fizer sentido.

---

# Parte 2. O produto: o Painel da Agência

## 2.1 Quem entra e o que vê

| Pessoa | Onde entra | O que vê |
|---|---|---|
| **Dono da agência** (UP) | `Painel da Agência` | Tudo da agência: carteira, produção, equipe, financeiro da agência, comissões, vitrine de adicionais, ajustes |
| **Equipe da agência** (videomaker, editor, social media, atendimento) | `Painel da Agência`, com função | Só os clientes e as tarefas que o dono da agência liberar; sem financeiro e sem comissões |
| **Cliente da UP** (dono do negócio) | Portal do cliente (com a marca da UP) e, se quiser, o próprio painel NextLevel Business | Agenda de gravação, peças para aprovar, arquivos entregues, relatório do mês, adicionais disponíveis |
| **Equipe NextLevel** (Master) | Master → Parceiros → Agências | As agências, as carteiras (sem abrir conteúdo do cliente sem motivo registrado), comissões, situação do piloto |

## 2.2 Os módulos do Painel da Agência

### M1. Início da agência ("Hoje na agência")
Uma fila do dia, no mesmo espírito da fila do lojista (`fila-do-dia.ts`):
- gravações de hoje e de amanhã (cliente, local, horário, quem vai);
- peças esperando aprovação do cliente há mais de 2 dias;
- peças reprovadas para refazer;
- clientes com o mês atrasado (combinado: 8 vídeos; entregue: 3, faltando 10 dias);
- clientes sem nenhum resultado no mês (sinal de risco de cancelamento);
- adicionais que clientes pediram (proposta aberta).

Números do mês no topo: clientes ativos, peças entregues/combinadas, taxa de aprovação de primeira, comissões a receber.

### M2. Carteira de clientes
- Lista dos clientes da agência: nome, segmento, pacote mensal combinado (ex.: "8 vídeos + 12 fotos por mês"), responsável na agência, situação (ativo, pausado, saindo), o que ele já usa da NextLevel (Business, Site, Loja), dia de cobrança.
- **Cadastrar cliente** (a agência faz em 1 minuto: nome, WhatsApp, e-mail, segmento). O sistema cria uma **conta NextLevel Business** para o cliente e manda o convite para ele aceitar (ver 2.4: consentimento).
- **Importar a carteira** de uma planilha (para os 30 da UP entrarem num dia só).
- Ficha do cliente: dados, pacote, histórico de produção, arquivos, relatórios, anotações, adicionais contratados, comissões geradas por ele.

### M3. Produção do mês (o coração do sistema operacional)
Um quadro por etapas para cada peça de conteúdo:

```
Pauta → Roteiro → Gravação agendada → Gravado → Em edição → Para aprovar → Ajustes → Aprovado → Entregue / Publicado
```

- Cada **peça** tem: cliente, tipo (reels, vídeo longo, foto, carrossel, criativo de anúncio, stories), roteiro, referência, responsável, prazo, versões, comentários, arquivo final.
- **Plano do mês por cliente:** a agência cria o mês (ex.: "Novembro: 8 reels, 2 criativos de anúncio") e o sistema mostra o progresso.
- Vista em **quadro** (colunas), em **lista** e em **calendário** (dia de gravação, dia de postagem).
- Filtros: por cliente, por pessoa da equipe, por etapa, atrasadas.

### M4. Agenda de captação (gravações)
- Agenda de gravações: data, horário, endereço, cliente, equipe escalada, equipamento, roteiros daquele dia, checklist ("levar luz", "cliente precisa estar com uniforme").
- Confirmação com o cliente por WhatsApp (mensagem pronta, como em Contatos e orçamentos, D309) e lembrete na véspera.
- Remarcação com motivo (para a agência ver quem mais remarca).
- Visão da semana da equipe (quem está em qual gravação), para não marcar a mesma pessoa em dois lugares.

### M5. Aprovação pelo cliente
- A peça vai para "Para aprovar" e o cliente recebe um aviso (e-mail e link de WhatsApp) com o link do portal.
- No portal o cliente assiste, aprova ou pede ajuste com comentário (no celular, sem precisar de senha longa: entrada por código, como o login do cliente por loja já faz em `conta-cliente.ts`).
- Histórico de versões (v1, v2, v3), quem aprovou e quando (vale como registro em caso de discussão).
- Prazo de aprovação: depois de X dias sem resposta, a agência decide se considera aprovado (regra configurável por agência, avisada ao cliente).

### M6. Biblioteca e entrega de arquivos
- Arquivos entregues por cliente e por mês, com busca.
- **Atenção ao custo de armazenamento:** vídeo é pesado. Hoje as imagens das lojas ficam dentro do banco (`store_assets.data_base64`), o que **não serve para vídeo**. No piloto:
  - a peça guarda o **link** do vídeo onde a agência já guarda (Google Drive, Dropbox, Frame.io, Vimeo, YouTube não listado) e uma **capa** (imagem leve);
  - o player do portal abre o link incorporado quando o serviço permitir;
  - armazenamento próprio de vídeo (serviço de arquivos externo, com limite por plano) fica para depois do piloto e precisa de decisão de custo do dono.
- Botão **"Usar no site/loja"**: a peça aprovada vira, com um clique, mídia da página de campanha, do site ou de um produto do cliente na NextLevel (é aqui que o conteúdo da UP ganha destino; ver 1.2).

### M7. Resultados e relatório mensal do cliente
- Relatório do mês por cliente, gerado sozinho e revisado pela agência antes de enviar:
  - o que foi produzido (peças, gravações, aprovações);
  - **se o cliente usa a NextLevel:** visitas no site/página de campanha, contatos e orçamentos recebidos (NB3), de onde vieram (`canalDe`), vendas da loja, resultados da Meta (leitura por API, D302);
  - comparação com o mês anterior, em linguagem simples, **sem promessa de ganho**.
- Envio por link (portal) e PDF.
- Para a agência: ranking de clientes por resultado e por risco (quem produziu e não usou; quem usou e não teve contato).

### M8. Equipe da agência
- Convidar pessoas com login próprio (como a equipe da loja em `store-team.ts`), com função: **Atendimento**, **Produção** (videomaker/fotógrafo), **Edição**, **Social media**, **Administrador**.
- Cada pessoa vê só os clientes atribuídos a ela (ou todos, se o dono da agência marcar).
- Equipe não vê financeiro, comissões nem dados de pagamento.
- Tudo o que cada pessoa faz fica registrado (auditoria por usuário, como já é hoje).

### M9. Vitrine de adicionais NextLevel ("Soluções para seus clientes")
- Catálogo das soluções NextLevel que **não competem** com a agência (lista aprovada por agência):
  - **Site para a empresa** (caminho Site do NextLevel Business, D306 a D311);
  - **Página de campanha para anúncios** (NB4, quando existir);
  - **Loja virtual** (planos Start, Pro, Scale, **intactos**, D311);
  - **Contatos e orçamentos**, **Resultados da Meta**, **Portal do cliente** (adicionais do Business);
  - serviços prontos do catálogo (Loja Pronta, Migração, Tema), quando fizer sentido.
- Para cada um: o que é, para quem serve (ex.: "clínicas e academias"), **preço da tabela do Master** (nunca preço fixo no código), **comissão da agência** (regra de agência vigente) e exemplos.
- Botão **"Oferecer ao cliente"**: gera uma proposta com link e validade (mesma ideia de `proposals`), que o cliente aceita e paga direto na NextLevel. A comissão nasce sozinha quando o pagamento é conferido no Mercado Pago (regra de pagamento conferido).
- Indicação de oportunidade: "Estes 7 clientes produzem vídeo todo mês e não têm site/página de campanha".
- **Quem vende:** a agência (recomendado no piloto). Opção: a agência marca "quero que a NextLevel apresente", e a equipe comercial NextLevel faz a apresentação com a agência junto; a comissão continua da agência.

### M10. Financeiro da agência

> **Versão 2:** a cobrança automática deixou de ser "depois do piloto" e virou o centro do sistema. Ver 8.2 a 8.4.
Dividido em duas partes bem separadas:
- **O que a NextLevel paga à agência:** comissões (livro-razão do parceiro que já existe: `partner_commissions`, saques via Pix para o mesmo CNPJ, carência, saque mínimo de R$ 50, níveis 20%/24%/28% pela carteira ativa).
- **O que os clientes pagam à agência** (opcional, pergunta 6.3):
  - **Nível 1 (piloto):** só controle: valor do contrato, dia de vencimento, marcar "pago", lista de quem está em atraso. A cobrança continua como a UP faz hoje.
  - **Nível 2 (depois):** cobrança recorrente pela plataforma com o **Mercado Pago da própria agência** conectado (como o lojista conecta o dele; token criptografado com `encryptSecret`), com Pix e cartão. O dinheiro vai direto para a agência; a NextLevel **não** fica no meio do dinheiro da agência.
  - Nota fiscal de serviço: fora do piloto.

### M11. Entrar no painel do cliente (acesso assistido)
- Com a autorização do cliente, a agência abre o painel NextLevel Business daquele cliente para montar o site, trocar o vídeo da página de campanha, responder um contato etc.
- Cada entrada fica registrada ("Agência UP, pessoa X, entrou na conta do cliente Y às 14h"), e o cliente vê esse histórico.
- Permissões da agência no painel do cliente são **limitadas por padrão** (como a equipe da loja: páginas, conteúdo, contatos, pedidos), **sem** finanças, saques, dados de pagamento, troca de dono ou exclusão da conta. O cliente pode liberar mais.

### M12. Ajustes da agência
- Dados da agência, logo e cores (para o portal do cliente), mensagens prontas, prazo de aprovação, etapas do quadro (a agência pode renomear), lista de tipos de peça, dados para receber comissão.

## 2.3 O portal do cliente da agência

O cliente da UP **não precisa** aprender a NextLevel para começar. A primeira coisa que ele vê é o portal da agência:

```
┌─────────────────────────────────────────────┐
│  [logo UP]   Olá, Clínica Sorriso           │
│  ─────────────────────────────────────────  │
│  ▶ 2 vídeos esperando sua aprovação         │
│  📅 Próxima gravação: quinta, 14h           │
│  📦 Novembro: 5 de 8 vídeos entregues       │
│  📈 Relatório de outubro (abrir)            │
│  ─────────────────────────────────────────  │
│  Seu conteúdo pode trazer clientes:          │
│  [Ver como ficaria seu site com estes vídeos]│
│  ─────────────────────────────────────────  │
│  UP · com tecnologia NextLevel               │
└─────────────────────────────────────────────┘
```

- Entrada por código no celular, sem senha complicada.
- O bloco "Seu conteúdo pode trazer clientes" mostra uma **prévia** do site ou da página de campanha já com os vídeos aprovados dele (reaproveita a prévia com dados do cliente usada nos temas). É o momento de oferta mais natural possível, e é a agência que oferece.
- Se o cliente já tem site/loja/Business ativo, o portal mostra o atalho para o painel NextLevel dele.

## 2.4 Consentimento e dono dos dados (LGPD)

- No cadastro feito pela agência, o cliente recebe um convite: "A agência UP quer conectar sua empresa à NextLevel para organizar seu conteúdo e mostrar resultados. Ela poderá: ver suas peças e relatórios; editar páginas do seu site; ver contatos recebidos. Ela **não** poderá: ver seus pagamentos, sacar ou mudar o dono da conta."
- O cliente aceita (registro com data, versão do texto e quem aceitou, como o aceite de termos do parceiro).
- Sem aceite: a agência ainda pode usar a produção e a agenda (dados que são da própria agência), mas **não acessa** a conta NextLevel do cliente nem os resultados.
- O cliente pode **retirar** o acesso a qualquer momento no painel dele. A agência vê "acesso retirado em tal data".
- Papéis na LGPD (a validar com jurídico): para os dados de produção, a agência é controladora e a NextLevel é operadora; para os dados da conta Business do cliente, o cliente é controlador e a NextLevel operadora, e a agência acessa como autorizada pelo cliente. O texto do termo de agência precisa de revisão jurídica antes do piloto (pendência do dono).

---

# Parte 3. Como encaixa no sistema que já existe

## 3.1 Reaproveitar antes de criar (regra anti-duplicação)

| Necessidade | O que já existe | O que falta |
|---|---|---|
| Agência como parceira que ganha comissão | `partners` com `kind = AGENCY`; pedido de agência (`agencyRequestedAt`, `agencyInfo`); regra única 20%/24%/28% sobre toda mensalidade (D260, `niveis-regras.ts`), só CNPJ (D263); livro-razão, saques, carência | Ligar o parceiro a uma **organização de agência** com equipe e carteira |
| Conta do cliente | NextLevel Business (D304 a D311), caminho Site, módulos por direito (`entitlements`, `modulosDe`) | **Conta só com o Business** (D310 deixou "para quando houver procura": a UP é essa procura) |
| Equipe com login próprio e permissão limitada | Equipe da loja (`store-team.ts`, papéis OWNER/STAFF, auditoria por usuário) | Equipe da agência com funções e carteira por pessoa |
| Uma pessoa com vários perfis | Conta do grupo (`conta-grupo.ts`, D141) | Dono da agência que também é cliente NextLevel troca de perfil sem novo login |
| Oferecer adicional com link e validade | `proposals` (link público, aceita uma vez) | Proposta de **produto do catálogo NextLevel** (plano, Site, serviço) feita pela agência para o cliente dela |
| Catálogo de soluções e preços | `catalog_products`, tabela de preços `getPriceBook`, `platform_settings` | Lista de soluções **visíveis por agência** (filtro "não compete") |
| Pedido de serviço | `services`, `service_orders`, `service_messages` | Nada no piloto (serviços NextLevel seguem como estão) |
| Contatos e origem | `contatos_negocio` (NB3), `canalDe` | Somar no relatório da agência |
| Resultados da Meta | Leitura por API (D302, TR6) | Somar no relatório da agência |
| Login do cliente final por código | `conta-cliente.ts` | Portal do cliente da agência (pode nascer junto com o "Portal do cliente" da NB10) |
| Fila do dia | `fila-do-dia.ts` | Fila do dia da agência |
| Auditoria | `audit_log`, `recordAudit` | Registro de acesso da agência à conta do cliente, visível ao cliente |
| Imagens | `store_assets` (no banco, base64) | **Vídeo não vai para o banco**: link externo + capa (Parte 2, M6) |
| Marca | `getBrand()`, `organizations.brand` | Logo e cores da agência no portal (não é marca nova do grupo) |

## 3.2 Modelo de dados proposto (alto nível, para o engenheiro validar na AG0)

Princípio: **a agência é uma organização**, como fornecedor e lojista. O registro de parceiro (comissão) continua em `partners`.

1. **`organizations.type`** ganha `AGENCY` (hoje: NEXTLEVEL, SUPPLIER, MERCHANT, PARTNER). Alternativa a avaliar na AG0: reutilizar `PARTNER`. Recomendação: `AGENCY`, porque a agência tem equipe, carteira e produção, coisas que um afiliado não tem.
2. **`agencias`**: organização da agência, ligação com o `partners` (comissão), logo e cores do portal, prazo padrão de aprovação, configurações, situação (piloto, ativa, pausada).
3. **`users.role`** ganha `AGENCY` (dono e equipe da agência), com uma coluna de função na agência (ADMIN, ATENDIMENTO, PRODUCAO, EDICAO, SOCIAL), no mesmo espírito do `storeRole`.
4. **`agencia_clientes`**: vínculo agência ↔ cliente. Guarda nome e contato do cliente (para a agência trabalhar mesmo antes do aceite), a loja/conta Business ligada (`storeId`, quando houver), situação do vínculo (convidado, ativo, acesso retirado, encerrado), aceite (data, versão do texto, quem aceitou), escopo de acesso, pacote mensal combinado (texto + números: vídeos, fotos, criativos), responsável na agência, valor e dia de cobrança (só controle, M10 nível 1).
5. **`agencia_equipe_clientes`**: quais pessoas da equipe veem quais clientes.
6. **`agencia_pecas`**: peça de conteúdo (cliente, mês, tipo, título, roteiro, etapa, responsável, prazo, data de gravação, data de postagem, link do arquivo, capa, versão atual).
7. **`agencia_pecas_versoes`** e **`agencia_pecas_comentarios`**: versões, aprovações e pedidos de ajuste (autor, data, texto), imutáveis.
8. **`agencia_gravacoes`**: agenda (data, hora, endereço, cliente, equipe, checklist, situação, motivo de remarcação).
9. **`agencia_relatorios`**: relatório mensal (cliente, mês, números congelados no envio, texto revisado pela agência, data de envio, aberto pelo cliente).
10. **`agencia_acessos`**: cada entrada da agência na conta do cliente (pessoa, cliente, quando, o que fez). Pode ser o próprio `audit_log` com um tipo novo, se servir (decidir na AG0).
11. **Soluções visíveis por agência**: lista em `platform_settings` (regra configurável, nunca fixa no código), editada no Master.
12. **Propostas da agência**: estender `proposals` ou criar `agencia_propostas` para produto do catálogo NextLevel (decidir na AG0; `proposals` hoje é de produto de loja, então provavelmente outra tabela, para não misturar pedido de loja com venda de plano).

Todos os valores em **centavos**, datas ISO, toda ação pelo domínio (`src/lib/domain/agencias/*`) e por `runAction`, permissões no servidor (`requireRole`, `assertCanAccess` com um novo `assertAgencyCanAccessClient`).

## 3.3 Endereços e telas

- `src/app/agencia/**`: Painel da Agência (`/agencia`, `/agencia/clientes`, `/agencia/producao`, `/agencia/agenda`, `/agencia/relatorios`, `/agencia/solucoes`, `/agencia/financeiro`, `/agencia/equipe`, `/agencia/ajustes`). Toda página com `export const dynamic = "force-dynamic"`.
- Portal do cliente da agência: `/a/[agencia]/...` (curto, para WhatsApp), com entrada por código.
- Master: `Parceiros → Agências` (lista, carteira resumida, comissões, situação do piloto, lista de soluções visíveis por agência).
- Domínio: no piloto, tudo dentro de `nextlevelcommerce.com.br` (ou do domínio do Master para a agência). Domínio próprio da agência só no white label (modelo C).

## 3.4 O que **não** muda

- Checkout, pagamentos, pedidos e planos das lojas atuais (Start, Pro, Scale intactos, D311).
- Regras de comissão de parceiro (D260, D263: só são usadas).
- SuperDrop, Brás e demais marcas: não são tocadas.
- Tudo novo atrás da chave **`AGENCIAS_V1`** (desligada por padrão; ligada só para a UP no piloto).

---

# Parte 4. Fases para o engenheiro (AG0 a AG9)

> **Como usar:** cada fase entrega valor sozinha, é publicada atrás da chave `AGENCIAS_V1`, tem teste do comportamento novo, print real no navegador para o dono e decisão registrada. Seguir as regras de `CLAUDE.md` (testes enxutos durante o trabalho, bateria completa e build no fim da rodada, `[skip render]` em commit só de documento, no máximo 3 publicações de código por dia).

| Fase | Entrega | Critérios de aceite |
|---|---|---|
| **AG0** Diagnóstico e modelo | Confirmar o modelo de dados (3.2) contra o código real; decidir `AGENCY` vs `PARTNER`, `audit_log` vs `agencia_acessos`, `proposals` vs tabela nova; registrar D312 | Documento curto com as escolhas e o motivo; nenhuma linha de produção mudada |
| **AG1** Agência e equipe | Organização `AGENCY`, papel `AGENCY`, cadastro da agência pelo Master (ligando ao `partners` AGENCY), convite de equipe com função, menu do Painel da Agência vazio | Agência A nunca vê nada da agência B (teste no servidor); equipe sem acesso a financeiro (teste); print do painel |
| **AG2** Carteira de clientes | Cadastrar e importar clientes (planilha), ficha, pacote mensal, responsável; criar **conta só com o Business** para o cliente; convite com consentimento (2.4) | Sem aceite, a agência não abre a conta do cliente (teste); importação de 30 linhas sem duplicar; print da carteira |
| **AG3** Produção do mês | Peças, plano do mês por cliente, quadro/lista/calendário, etapas renomeáveis, prazos e atrasos | Pessoa da equipe só vê peças dos clientes dela (teste); progresso do mês correto; print do quadro em 360 px sem rolagem lateral |
| **AG4** Agenda de captação | Gravações, equipe escalada, checklist, mensagem pronta de confirmação no WhatsApp, lembrete na véspera, remarcação com motivo | Aviso de choque de agenda da mesma pessoa; print da semana |
| **AG5** Aprovação e portal do cliente | Portal `/a/[agencia]` com entrada por código, peças para aprovar, versões, comentários, aprovação registrada; logo e cores da agência | Cliente X nunca vê peça do cliente Y (teste); aprovação imutável; axe sem violações graves; print do celular |
| **AG6** Biblioteca e "Usar no site" | Arquivos por link + capa; botão que leva a peça aprovada para a página de campanha/site/produto do cliente | Nenhum vídeo gravado no banco; a mídia aparece no site do cliente; print antes/depois |
| **AG7** Relatório mensal | Relatório por cliente (produção + contatos NB3 + Meta D302 + loja), revisão da agência, envio por link e PDF; ranking de risco da carteira | Números congelados no envio; sem promessa de ganho no texto; print do relatório |
| **AG8** Vitrine de adicionais e comissão | Soluções visíveis por agência (Master edita), preço da tabela, "Oferecer ao cliente" com proposta e link, pagamento conferido no Mercado Pago gera a comissão de agência; aviso "cliente da agência" para a equipe comercial NextLevel | Solução fora da lista não aparece (teste); comissão só depois do pagamento conferido, uma vez só (`dedupeKey`); print da vitrine |
| **AG9** Financeiro da agência (nível 1) e acesso assistido | Controle dos contratos dos clientes (valor, vencimento, pago/atrasado); comissões e saques; entrar na conta do cliente com registro visível ao cliente | Entrada registrada e mostrada ao cliente; acesso sem finanças do cliente (teste); print |
| Depois do piloto | Cobrança recorrente com o Mercado Pago da agência (M10 nível 2), armazenamento próprio de vídeo, white label completo, app/PWA da equipe de gravação, relatório com IA (Maurício) | Só com decisão do dono |

**Ordem mínima para o piloto começar a rodar:** AG0 → AG1 → AG2 → AG3 → AG5. Com isso a UP já opera o mês dentro do sistema. AG4, AG6, AG7, AG8 e AG9 entram nas semanas seguintes do piloto.

---

# Parte 5. O piloto com a UP

## 5.1 Objetivo do piloto
Provar, em 90 dias, que:
1. a UP consegue **tocar o mês dos clientes** dentro do Painel da Agência (deixa de depender de planilha e WhatsApp solto);
2. os clientes da UP **usam o portal** para aprovar e acompanhar;
3. uma parte dos clientes da UP **contrata soluções da NextLevel** (contas pagantes);
4. o modelo se repete com uma segunda agência.

## 5.2 Escopo fechado do piloto
**Dentro:** carteira, produção, agenda, aprovação, portal do cliente, biblioteca por link, relatório mensal, vitrine de adicionais com comissão, controle simples dos contratos da agência.
**Fora (vai para a fila e o dono decide depois):** ~~cobrança dos clientes da agência pela plataforma~~ (entrou no escopo na versão 2, ver 8.8), nota fiscal, armazenamento próprio de vídeo, folha da equipe, CRM de prospecção da agência, app instalado, white label completo.

## 5.3 Cronograma (sugestão)

| Semana | O que acontece | Quem |
|---|---|---|
| 0 | Reunião com a UP: perguntas da Parte 6; receber a planilha dos 30 clientes; combinar termo de agência e consentimento (revisão jurídica) | Dono + UP |
| 1 a 2 | AG0, AG1, AG2: agência criada, equipe convidada, 30 clientes importados, convites enviados | Engenharia |
| 3 a 4 | AG3 e AG5: a UP planeja dezembro dentro do sistema; clientes aprovam as primeiras peças pelo portal | UP usa; engenharia ajusta |
| 5 a 6 | AG4 e AG6: agenda de gravação no sistema; peças aprovadas viram página de campanha/site para os primeiros clientes | UP + NextLevel |
| 7 a 8 | AG7: primeiro relatório mensal enviado a todos os clientes | UP |
| 9 a 10 | AG8: vitrine de adicionais aberta; a UP oferece Site/página de campanha para os clientes com perfil | UP vende; NextLevel apoia |
| 11 a 12 | AG9; leitura do piloto; decisão: seguir, ajustar ou parar; preço do painel depois do piloto | Dono |

**Rotina durante o piloto:** uma conversa de 30 minutos por semana com a UP (o que travou, o que falta), registrada em `docs/melhorias/` como as observações do dono; pedidos novos vão para a fila, não direto para o código.

## 5.4 Como medir (metas sugeridas para o dono confirmar)

| Indicador | Meta do piloto (90 dias) | Onde se vê |
|---|---|---|
| Clientes da UP com aceite no portal | 24 de 30 (80%) | Carteira |
| Peças do mês planejadas no sistema | 100% dos clientes ativos a partir do 2º mês | Produção |
| Peças aprovadas pelo portal (não pelo WhatsApp) | 70% | Aprovação |
| Relatórios mensais enviados | 100% dos clientes ativos | Relatórios |
| Clientes da UP com alguma solução NextLevel paga | 6 a 10 | Master → Agências |
| Uso semanal pela equipe da UP | Todos os dias úteis | Registro de acesso |
| Nota da UP para o painel (0 a 10) | 8 ou mais | Conversa semanal |

## 5.5 O que a UP precisa entregar
- Planilha dos clientes (nome, segmento, WhatsApp, e-mail, pacote mensal, valor, responsável).
- Lista da equipe com função.
- Uma pessoa da UP como responsável pelo piloto.
- Aceite do termo de agência.
- Retorno semanal sincero.

## 5.6 Riscos e como reduzir

| Risco | Como reduzir |
|---|---|
| **Escopo cresce sem fim** ("faz também a nota fiscal, o financeiro...") | Escopo fechado (5.2) e fila de pedidos aprovada pelo dono |
| **Dependência de uma agência só** (o painel nasce com a cara da UP) | Tudo configurável por agência (etapas, tipos de peça, prazos); nada fixo para a UP; segunda agência convidada até o fim do piloto |
| **Custo de vídeo** (armazenamento e banda) | Vídeo por link externo no piloto; armazenamento próprio só com decisão de custo do dono |
| **Clientes da UP não aceitam o convite** | O portal entrega valor sem precisar da conta NextLevel (aprovação, agenda, relatório de produção); o convite da conta vem junto com uma prévia útil ("seu site com seus vídeos") |
| **Conflito comercial** (equipe NextLevel aborda cliente da UP) | Marca "cliente da agência" visível no Master e no CRM; regra escrita no termo |
| **A UP sai e quer "levar" os clientes** | O cliente é dono da conta; a agência perde o acesso e as comissões futuras daquele cliente (confirmar regra, pergunta 6.1) |
| **LGPD** | Consentimento registrado, escopo limitado, registro de acesso visível ao cliente, termo revisado por jurídico |
| **Desempenho do Render/banco** | Telas com consulta leve, sem vídeo no banco; conferir com a skill `desempenho` antes de abrir para a UP |
| **Custo de montagem no Render** | Juntar as fases em poucas publicações; documentos com `[skip render]` (`docs/infra/RENDER-USO.md`) |

---

# Parte 6. Perguntas

## 6.1 Para o dono (decidem o desenho)
1. **De quem é o cliente?** Se a UP e o cliente se separarem: (a) o cliente fica com a conta NextLevel e a UP perde acesso e comissão futura (recomendado); (b) a UP mantém a comissão por um tempo; (c) outra regra.
2. **A marca da UP aparece para os clientes?** Recomendado: portal com logo e cores da UP e "com tecnologia NextLevel" no rodapé. White label completo só depois.
3. **A cobrança da UP para os clientes dela passa pela plataforma?** Recomendado: no piloto, só controle (nível 1). Cobrança real (nível 2) depois, com o Mercado Pago da própria agência.
4. **Preço do painel depois do piloto:** valor por cliente ativo, plano fixo da agência, ou grátis enquanto a agência tiver um mínimo de clientes pagantes na NextLevel? (Simulação na Parte 7.)
5. **Teste do cliente da UP:** quanto tempo de teste estendido para a conta Business dos clientes da UP durante o piloto?
6. **Comissão da UP:** a regra única vigente (20% até 9 clientes ativos, 24% com 10, 28% com 25; D260) ou, como "benefício exclusivo de agência" (D263), começar o piloto já no nível de 24% por trazer 30 clientes de uma vez? A UP só chega a 24% e 28% se os clientes dela virarem pagantes, então a regra atual já premia o resultado.
7. **Quem vende os adicionais:** só a UP, ou a equipe comercial NextLevel pode apresentar junto (com a comissão da UP preservada)?
8. **Nome da área:** "NextLevel Agências", "Painel da Agência" ou outro.
9. **Quais soluções ficam fora da vitrine da UP** para não competir (ex.: consultoria de crescimento, criação de imagens)?

## 6.2 Para a UP (na reunião da semana 0)
1. Como vocês organizam o mês hoje (ferramentas, planilhas, grupos de WhatsApp)? O que mais dá dor de cabeça?
2. Quantas peças por cliente por mês, em média? Quais tipos?
3. Como o cliente aprova hoje? Quanto tempo leva? Quantas idas e voltas?
4. Onde ficam os arquivos (Drive, Dropbox, Frame.io)?
5. Vocês postam nas redes do cliente ou só entregam?
6. Quais clientes já perguntaram por site, loja, anúncios ou "resultado"?
7. Quem da equipe vai usar o sistema e em que função?
8. Como vocês cobram os clientes? Gostariam de cobrar pelo sistema?
9. O que faria vocês dizerem, em 90 dias, "não volto mais para o jeito antigo"?

---

# Parte 7. Números do piloto (simulação, sem promessa de ganho)

> **Substituída na versão 2:** o preço do painel agora segue a escada da seção 8.5 (implantação + percentual ou manutenção). A comissão dos adicionais abaixo continua valendo.

> **Atenção:** os números abaixo são uma **simulação para ajudar a decidir o preço**, não uma previsão nem promessa. Os preços reais vêm sempre da tabela do Master. Valores de referência: planos da loja virtual Start R$ 57, Pro R$ 147, Scale R$ 347 por mês (D220); adicional Site para quem já é lojista R$ 29/mês (provisório, D311); comissão de parceiro com CNPJ 20% de toda mensalidade paga até 9 clientes ativos (D260).

**Cenário de referência (só para entender a ordem de grandeza):** dos 30 clientes da UP, 8 assinam um plano Start pelo caminho Site em 90 dias.

| Item | Conta | Por mês, depois de assinados |
|---|---|---|
| Receita NextLevel (bruta) | 8 × R$ 57 | R$ 456 |
| Comissão da UP (todo mês, desde o 1º) | 20% × R$ 456 | R$ 91,20 |
| Receita NextLevel depois da comissão | R$ 456 − R$ 91,20 | R$ 364,80 |
| Se chegar a 10 clientes pagantes | comissão passa a 24% sobre a carteira inteira | 10 × R$ 57 = R$ 570; UP R$ 136,80 |

**Preço do painel depois do piloto (opções para o dono escolher):**

| Opção | Como funciona | Exemplo com 30 clientes | Prós | Contras |
|---|---|---|---|---|
| **Por cliente ativo** | Valor por cliente ativo na carteira (ex.: R$ 15 a R$ 25) | 30 × R$ 19 = R$ 570/mês | Cresce com a agência; justo | Agência pode deixar clientes fora do sistema para pagar menos |
| **Plano fixo da agência** | Faixas (até 15, até 40, até 100 clientes) | ex.: R$ 397/mês até 40 | Simples de vender | Agência pequena acha caro |
| **Grátis por volume** | Painel grátis enquanto X% dos clientes da agência forem pagantes na NextLevel; senão, preço por cliente | 8 de 30 pagantes (27%) | Alinha os dois lados: a agência ganha o sistema vendendo o ecossistema | Receita do painel incerta |

**Recomendação:** **"grátis por volume" com piso** — o painel é grátis enquanto pelo menos ~25% dos clientes ativos da agência forem pagantes na NextLevel; abaixo disso, cobra por cliente ativo. Isso transforma o painel em motor de venda do ecossistema, que é o objetivo do dono, e não em mais um software a vender. O percentual e o valor ficam em `platform_settings` (nunca fixos no código), definidos pelo dono.

---

## Anexo: como apresentar para a UP (roteiro curto de reunião)

1. **O problema de vocês:** organizar 30 clientes por planilha e WhatsApp, cliente que demora para aprovar, e a pergunta do fim do mês "isso trouxe cliente?".
2. **O que oferecemos:** um painel para tocar a agência (produção, agenda, aprovação, entrega, relatório), com o portal do cliente na marca de vocês, grátis no piloto.
3. **O que muda para os clientes de vocês:** aprovam pelo celular, acompanham o mês e recebem relatório; quem quiser ganha site, página de campanha ou loja com os vídeos que vocês já gravam.
4. **O que vocês ganham além do sistema:** comissão em tudo o que os clientes contratarem na NextLevel, enquanto o cliente ficar.
5. **O que não fazemos:** não gravamos, não editamos, não abordamos os clientes de vocês por fora.
6. **Próximo passo:** planilha dos clientes, equipe e um responsável; em duas semanas vocês planejam dezembro dentro do sistema.

---

# Parte 8. Versão 2 (16/11/2026): sistema operacional exclusivo para a UP, cobrança automática e como monetizar

> **O que mudou (dono, 16/11/2026):** a UP quer ajuda para **controlar os clientes, inclusive receber pagamentos e cobrar automaticamente**. A conversa deixa de ser sobre agência que só divulga e passa a ser sobre um **sistema exclusivo para a UP**, que é o **piloto para grandes agências**. O dono propôs três degraus de preço:
>
> | Degrau | Proposta do dono |
> |---|---|
> | 1. NextLevel Business (validação) | Implantação de R$ 3.000 + **10%** sobre as transações dos clientes da agência |
> | 2. White label | R$ 15.000 + **3%** |
> | 3. Código próprio | R$ 30.000 + **0%** |
>
> **Esta Parte 8 prevalece** sobre as Partes 1 a 7 onde houver conflito: a cobrança entra no escopo do piloto (antes estava fora, 5.2), o financeiro (M10) vira módulo central e o preço do painel da Parte 7 é substituído pela escada abaixo.

## 8.1 A mudança de posição: de "parceiro que indica" para "sistema operacional da agência"

| | Antes (Partes 1 a 7) | Agora (Parte 8) |
|---|---|---|
| O que a UP compra | Um painel de produção, grátis no piloto | **O sistema que roda a agência**: clientes, contratos, cobrança, produção, portal, resultados |
| Como a NextLevel ganha | Comissão indireta (adicionais vendidos aos clientes da UP) | **Receita direta da agência** (implantação + percentual ou mensalidade) **e** os adicionais |
| Para quem é | Agências de conteúdo em geral | **Grandes agências**, com a UP como **Agência Fundadora** |
| Dinheiro | Fora do sistema | **Passa pelo sistema** (sem a NextLevel guardar o dinheiro da agência, ver 8.4) |

A frase para vender: **"A UP cuida do conteúdo; o sistema cuida de cliente, contrato, cobrança e resultado."**

## 8.2 Os oito pilares do sistema operacional da agência

1. **Clientes e contratos:** carteira, contrato recorrente por cliente (valor, dia de vencimento, o que está incluso no mês, reajuste anual), serviços avulsos (gravação extra, diária, criativo extra), assinatura do contrato no painel (reaproveita `contratos-assinatura-no-painel.md`).
2. **Cobrança automática** (o centro da versão 2, detalhado em 8.3).
3. **Financeiro da agência:** recebido x previsto, inadimplência, receita recorrente do mês, cancelamentos, ticket médio, **margem por cliente** (receita menos custo de produção: diárias, freelancers, horas).
4. **Produção:** pauta → roteiro → gravação → edição → aprovação → entrega (módulos M3 a M6).
5. **Portal do cliente** com a marca da agência: aprovar peças, ver agenda, **pagar faturas, ver 2ª via e histórico**, baixar arquivos, ver relatório.
6. **Resultados:** relatório mensal com produção e, quando o cliente usa a NextLevel, contatos, origem, vendas e Meta (M7).
7. **Ecossistema:** vitrine de adicionais NextLevel com comissão para a agência (M9).
8. **Gestão e escala:** equipe com funções, permissões finas, registro de tudo, exportação para o contador, e, nos degraus maiores, marca própria, várias unidades, integração por API e suporte com prazo garantido.

## 8.3 Cobrança automática (o que o sistema faz sozinho)

| Função | Como funciona | Fase |
|---|---|---|
| **Fatura recorrente** | Todo mês, no dia combinado, o sistema gera a fatura de cada cliente a partir do contrato (mensalidade + avulsos do mês) | Piloto |
| **Meios de pagamento** | Pix (QR e copia-e-cola) e cartão, inclusive cartão salvo para cobrança recorrente; boleto quando a integração existir | Pix e cartão no piloto; boleto depois |
| **Régua de cobrança** | Mensagens automáticas configuráveis pela agência: 3 dias antes, no dia, 1, 5 e 10 dias depois do vencimento; por e-mail e com mensagem pronta de WhatsApp (botão "Enviar" para a equipe). WhatsApp automático pela API oficial fica para depois (tem custo por conversa) | E-mail + WhatsApp assistido no piloto |
| **Baixa automática** | Pagamento só vale depois de conferido na API do meio de pagamento (regra da casa); a fatura vira "paga" sozinha, sem conferência manual; um aviso repetido nunca dá baixa duas vezes (`dedupeKey`) | Piloto |
| **Multa, juros e desconto** | Multa e juros por atraso e desconto por pagar em dia, configuráveis pela agência dentro dos limites legais | Piloto |
| **Inadimplência** | Painel de quem está atrasado, há quantos dias e quanto; regra opcional da agência: "pausar gravações depois de X dias de atraso" (avisada no contrato) | Piloto |
| **Reajuste anual** | Aviso 30 dias antes e reajuste no aniversário do contrato, pelo percentual que a agência definir | Depois |
| **Avulsos com link** | Gravação extra ou diária vira cobrança com link na hora | Piloto |
| **Nota fiscal de serviço** | Emissão automática da nota da agência quando a fatura é paga, por integração com emissor de NFS-e | Depois (grande pedido de agências; custo por nota) |
| **Exportação para o contador** | Planilha mensal de recebimentos, taxas e notas | Piloto (planilha) |
| **Previsão de caixa** | Quanto entra nos próximos 30, 60 e 90 dias pelos contratos ativos | Depois |

**O que já existe e é reaproveitado:** camada de meios de pagamento com Mercado Pago e Pagar.me (`src/lib/payments/gateway.ts`), Pix e cartão parcelado, tokens criptografados (`encryptSecret`), conferência do pagamento na API e idempotência, motor de faturas da própria NextLevel (`finance_invoices`, `nextlevel-billing.ts`), e-mails transacionais e assinatura de contrato no painel.
**O que falta:** contrato recorrente por cliente da agência, fatura gerada a partir do contrato, cartão salvo para recorrência, régua de cobrança, multa e juros, painel de inadimplência, boleto e nota fiscal.

## 8.4 Regra de ouro do dinheiro: a NextLevel não guarda o dinheiro da agência

- O cliente da UP paga **direto na conta de pagamento da própria UP** (Mercado Pago ou Pagar.me da UP, conectado no painel, como o lojista conecta o dele hoje). O dinheiro **nunca passa pela conta da NextLevel**.
- Motivo: receber o dinheiro de terceiros e repassar depois é atividade regulada pelo Banco Central (instituição de pagamento). Ficar fora disso protege a NextLevel e simplifica a parte fiscal.
- **Como a NextLevel cobra o percentual dela**, duas formas:
  1. **Fatura mensal da NextLevel para a agência** sobre o volume conferido no mês (recomendado no piloto: usa o motor de faturas que já existe, com cartão salvo ou Pix, e nota fiscal da NextLevel para a agência);
  2. **Divisão automática no pagamento** (o meio de pagamento separa a parte da NextLevel na hora). O Pagar.me tem divisão nativa; no Mercado Pago, conferir na documentação oficial se vale para cobrança recorrente. Fica para depois do piloto.
- A comissão de 20% que a NextLevel paga à UP pelos adicionais (D260) pode ser **abatida** dessa fatura mensal, se o dono quiser.

## 8.5 A escada de preços do dono, com números

**Base de cálculo:** "transações dos clientes" = o que os clientes da agência pagam à agência **pelo sistema** no mês (chamado aqui de **volume**). A UP tem 30 clientes; o valor médio por cliente ainda não sabemos (pergunta 6.2). Cenários:

| Cenário | Clientes × valor médio | Volume por mês |
|---|---|---|
| A | 30 × R$ 1.500 | R$ 45.000 |
| B | 30 × R$ 2.500 | R$ 75.000 |
| C | 40 × R$ 3.000 | R$ 120.000 |
| D (grande agência) | 80 × R$ 3.125 | R$ 250.000 |

**Quanto a agência pagaria no 1º ano com a proposta do dono:**

| Volume/mês | Business (R$ 3 mil + 10%) | White label (R$ 15 mil + 3%) | Código próprio (R$ 30 mil + 0%) |
|---|---|---|---|
| R$ 45 mil | R$ 57.000 | R$ 31.200 | R$ 30.000 |
| R$ 75 mil | R$ 93.000 | R$ 42.000 | R$ 30.000 |
| R$ 120 mil | R$ 147.000 | R$ 58.200 | R$ 30.000 |
| R$ 250 mil | R$ 303.000 | R$ 105.000 | R$ 30.000 |

**No 2º ano** (sem implantação): Business R$ 54 mil a R$ 300 mil; white label R$ 16 mil a R$ 90 mil; código próprio **R$ 0**.

### Os três problemas da escada como está

1. **O degrau 3 engole os outros.** No cenário B, a UP paga R$ 7.500 por mês no degrau 1. Pular direto para o código próprio (R$ 30 mil) se paga em **4 meses**; no cenário A, em menos de 7 meses. Qualquer agência que fizer a conta vai para o código próprio no primeiro ano. Resultado para a NextLevel: **R$ 30 mil uma vez, e depois zero para sempre**, mais o suporte e as dúvidas, que continuam.
2. **"Código próprio" é entregar o motor do grupo.** O repositório é **um sistema só** para NextLevel Commerce, Master, SuperDrop, Brás e as próximas marcas (regra anti-duplicação). Entregar o código é entregar anos de trabalho e permitir que a agência (ou quem comprar dela) **vire concorrente**, por R$ 30 mil. Separar só a parte da agência dá muito trabalho e cria um segundo sistema para manter, sem atualizações, segurança nem correções dali em diante.
3. **10% do faturamento é pesado para uma agência e convida a cobrar por fora.** Agência de conteúdo costuma ter margem apertada (hipótese a confirmar com a UP: algo entre 20% e 35% do faturamento). 10% do faturamento pode ser **um terço do lucro dela**. Plataformas de cobrança recorrente cobram, em geral, só alguns pontos percentuais por transação (conferir nas páginas oficiais antes de fechar), e sistemas de gestão de agência cobram mensalidade fixa. Com 10%, a tendência é a UP **passar só parte dos clientes pelo sistema** e cobrar os outros por fora, e aí o percentual não entra e o sistema perde valor.

### Escada recomendada (mantém a estrutura do dono e corrige os três problemas)

Princípio: **todo degrau tem uma parte que se repete todo mês**, e cada degrau fica mais vantajoso **conforme a agência cresce**, não logo no começo.

| Degrau | Nome sugerido | Implantação | Todo mês | Para quem |
|---|---|---|---|---|
| **1** | **NextLevel Business para Agências** | R$ 3.000 (como o dono propôs) | **5%** do volume, com **mínimo de R$ 990** | Agência até ~R$ 100 mil/mês, validando |
| **2** | **White label** | R$ 15.000 (como o dono propôs) | **3%** do volume (como o dono propôs), com **mínimo de R$ 1.990** | Agência que quer a própria marca e domínio, e oferecer o sistema aos clientes como produto dela |
| **3** | **Licença dedicada** (no lugar de "código próprio") | R$ 30.000 (como o dono propôs) | **Manutenção fixa de R$ 3.900**, **0%** sobre o volume | Agência grande, acima de ~R$ 200 mil/mês |

- **Licença dedicada** = servidor e banco só da agência, com a marca dela, sem percentual, **com atualizações, segurança e suporte incluídos na manutenção**. O código continua da NextLevel (a agência tem direito de uso, não a propriedade). É o que grandes empresas de software fazem com clientes grandes.
- **Cessão do código-fonte** (a agência ser dona do código): **não recomendada**. Se um dia fizer sentido, só de uma parte separada do sistema, com cláusula de não concorrência e preço de outra ordem de grandeza, sob orçamento.
- **Subir de degrau:** o que a agência pagou de implantação no degrau anterior vira **desconto** na implantação do próximo, se a troca for em até 12 meses. Isso dá motivo para começar no degrau 1 em vez de esperar.
- **Se o dono quiser manter os 10% no degrau 1:** colocar um **teto mensal** (por exemplo R$ 4.900) e incluir mais coisas no preço (implantação assistida, importação dos clientes, treinamento da equipe, régua de cobrança com WhatsApp). Sem teto, o problema 3 continua.
- Todos os valores ficam na **tabela de preços do Master** (`platform_settings`), nunca fixos no código. As tarifas do meio de pagamento (Pix, cartão) são da conta da agência, à parte.

**Quanto a agência pagaria no 1º ano com a escada recomendada:**

| Volume/mês | Degrau 1 (R$ 3 mil + 5%, mín. R$ 990) | Degrau 2 (R$ 15 mil + 3%, mín. R$ 1.990) | Degrau 3 (R$ 30 mil + R$ 3.900/mês) | Mais barato para a agência |
|---|---|---|---|---|
| R$ 45 mil | R$ 30.000 | R$ 38.880 | R$ 76.800 | Degrau 1 |
| R$ 75 mil | R$ 48.000 | R$ 42.000 | R$ 76.800 | Degraus 1 e 2 próximos (escolhe pela marca própria) |
| R$ 120 mil | R$ 75.000 | R$ 58.200 | R$ 76.800 | Degrau 2 |
| R$ 250 mil | R$ 153.000 | R$ 105.000 | R$ 76.800 | Degrau 3 |

**No 2º ano** (sem implantação), a NextLevel continua recebendo em todos os casos: degrau 1 de R$ 27 mil a R$ 150 mil; degrau 2 de R$ 23,9 mil a R$ 90 mil; degrau 3 R$ 46,8 mil.

**Comparação para a NextLevel, cenário B (UP com R$ 75 mil/mês), em 3 anos:**

| Caminho | Ano 1 | Ano 2 | Ano 3 | Total |
|---|---|---|---|---|
| Proposta do dono, UP pula para o código próprio no mês 4 (provável) | R$ 3.000 + 3 × R$ 7.500 + R$ 30.000 = R$ 55.500 | R$ 0 | R$ 0 | **R$ 55.500**, e a UP com o código |
| Escada recomendada, UP fica no degrau 1 | R$ 48.000 | R$ 45.000 | R$ 45.000 | **R$ 138.000** |
| Escada recomendada, UP sobe para o white label no mês 6 | R$ 3.000 + 5 × R$ 3.750 + R$ 12.000 (R$ 15 mil menos o desconto) + 7 × R$ 2.250 = R$ 49.500 | R$ 27.000 | R$ 27.000 | **R$ 103.500**, com a UP presa à marca própria dentro do sistema |

> Simulação para decidir preço, **não previsão nem promessa de ganho**. O volume real da UP muda tudo; por isso a primeira pergunta à UP é o faturamento mensal com os clientes.

## 8.6 "Exclusivo para a UP" sem perder o produto: Agência Fundadora

O dono quer algo **exclusivo para a UP** e, ao mesmo tempo, um **piloto para grandes agências**. As duas coisas cabem juntas assim:

**O que é exclusivo da UP (Agência Fundadora):**
- **preço de fundador travado por 12 meses** (o degrau 1 nas condições do piloto, mesmo que a tabela suba);
- **implantação feita pela NextLevel** (importação dos 30 clientes, contratos, régua de cobrança, treinamento da equipe);
- **prioridade no que é construído**: os pedidos da UP entram na frente da fila, sempre com aprovação do dono;
- **linha direta** com a NextLevel durante o piloto (conversa semanal);
- selo "Agência Fundadora" no portal e no diretório de agências (com o consentimento da UP).

**O que a UP dá em troca:**
- prazo mínimo de 6 meses após o piloto;
- usar o sistema de verdade (todos os clientes e cobranças passando por ele);
- retorno semanal e depoimento/caso ao final, se o resultado for bom.

**O que não é exclusivo (e precisa ficar escrito no contrato):**
- **o produto é da NextLevel** e será vendido a outras agências; o que é construído para a UP vira padrão do produto, configurável por agência;
- se o dono quiser oferecer mais, a exclusividade possível é de **condição** (nenhuma outra agência de conteúdo da mesma cidade com preço de fundador por 12 meses), nunca do produto.

## 8.7 O que muda nas fases (substitui a ordem da Parte 4)

A cobrança sobe para o começo, porque é o que a UP pediu e o que sustenta a receita da NextLevel.

| Ordem | Fase | Entrega |
|---|---|---|
| 1 | AG0 | Diagnóstico e modelo de dados, agora com contratos, faturas da agência, régua e meio de pagamento da agência |
| 2 | AG1 | Agência, equipe e funções |
| 3 | AG2 | Carteira de clientes **com contrato recorrente** (valor, vencimento, incluso no mês, avulsos), importação dos 30 |
| 4 | **AGF1 (nova)** | **Cobrança:** conectar o meio de pagamento da agência; fatura recorrente gerada pelo contrato; Pix e cartão; baixa automática conferida na API; avulsos com link |
| 5 | **AGF2 (nova)** | **Régua e inadimplência:** mensagens antes e depois do vencimento (e-mail + WhatsApp assistido), multa, juros e desconto, painel de atrasados, regra de pausar produção |
| 6 | AG5 | Portal do cliente com a marca da agência, **com faturas, 2ª via e histórico**, e aprovação de peças |
| 7 | AG3 + AG4 | Produção do mês e agenda de gravação |
| 8 | **AGF3 (nova)** | **Financeiro da agência:** recebido x previsto, receita recorrente, cancelamentos, margem por cliente, exportação para o contador; **fatura mensal da NextLevel para a agência** (o percentual do degrau 1) |
| 9 | AG6, AG7, AG8 | Biblioteca e "usar no site", relatório mensal, vitrine de adicionais |
| 10 | AG9 | Acesso assistido à conta do cliente |
| Depois | | Boleto, nota fiscal automática, WhatsApp pela API oficial, reajuste anual, previsão de caixa, divisão automática no pagamento, degraus 2 e 3 (marca própria, domínio, instância dedicada, API) |

**Critérios de aceite novos (além dos da Parte 4):**
- a fatura só vira "paga" com o pagamento conferido na API do meio de pagamento, e um aviso repetido não dá baixa duas vezes (teste);
- o token do meio de pagamento da agência fica criptografado e nunca aparece em tela, log ou e-mail;
- a agência A nunca vê fatura, cliente ou recebimento da agência B (teste no servidor);
- a equipe da agência sem função financeira não vê valores (teste);
- a régua respeita o horário comercial e para de mandar quando a fatura é paga;
- o percentual da NextLevel é calculado só sobre o que foi conferido como pago, menos estornos, e aparece de forma transparente para a agência (extrato do mês).

## 8.8 O que muda no piloto

- **Entra no escopo** (sai da lista "Fora" da 5.2): cobrança recorrente pelo sistema com o meio de pagamento da própria UP, régua de cobrança, inadimplência e financeiro da agência.
- **Continua fora:** nota fiscal automática, boleto, WhatsApp pela API oficial, armazenamento próprio de vídeo, white label e licença dedicada (os degraus 2 e 3 só depois do piloto dar certo).
- **Cobrança da NextLevel no piloto:** implantação de R$ 3.000 na assinatura do termo de Agência Fundadora; o percentual do degrau 1 começa a contar quando a primeira cobrança automática da UP for paga pelo sistema.
- **Metas novas do piloto** (somam às da 5.4):

| Indicador | Meta (90 dias) |
|---|---|
| Clientes da UP cobrados pelo sistema | 25 de 30 |
| Faturas pagas até o vencimento | Acima do que a UP tem hoje (medir a linha de base na semana 0) |
| Dias médios de atraso | Menor que hoje |
| Tempo da equipe da UP gasto cobrando | Menor que hoje (perguntar na semana 0 e no dia 90) |

## 8.9 Perguntas novas

**Para o dono:**
1. Aceita trocar o degrau 3 de "código próprio" para **licença dedicada com manutenção mensal**? Se quiser mesmo vender o código, qual o valor mínimo e com que limites?
2. Degrau 1: **5% com mínimo de R$ 990** (recomendado) ou **10% com teto mensal**? Qual teto?
3. Coloca **mínimo mensal** nos degraus 1 e 2?
4. A implantação do degrau anterior vira desconto no próximo?
5. A comissão de 20% dos adicionais é abatida da fatura da UP ou paga à parte?
6. Exclusividade de condição por cidade para a UP: sim ou não?

**Para a UP:**
1. Quanto vocês faturam por mês com os 30 clientes (para escolher o degrau certo)?
2. Como cobram hoje (Pix, boleto, cartão, transferência)? Usam alguma plataforma? Quanto pagam de tarifa?
3. Quantos clientes atrasam por mês e quanto tempo a equipe gasta cobrando?
4. Emitem nota fiscal de serviço em todo pagamento? Por qual sistema?
5. Têm conta no Mercado Pago ou no Pagar.me?
6. Querem que o portal do cliente apareça só com a marca UP?
