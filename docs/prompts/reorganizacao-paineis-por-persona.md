# Proposta: reorganizar os painéis pelo jeito que cada pessoa pensa

> **Pedido do dono (17/11/2026):** "reorganizar a posição de cada função, reagrupar por categorias, pra tudo ter mais dinâmica. Se fosse você o dono, sendo humano, como gostaria de ver e interagir com tudo isso? Não só do meu painel: dos funcionários, freelancers, clientes (com a persona de cada um), do cliente do meu cliente, dos usuários finais e dos parceiros."
> **Status:** proposta para o dono aprovar. Nada aqui vale como decisão até virar D-número (a próxima livre é a D324).
> **Base usada:** menus de hoje em `src/lib/nav.ts` (Master, lojista, NextLevel Business, parceiro, agência, fornecedor), o print do Master de 17/11, as personas de `docs/prompts/publico-personas-precos-ecossistema.md` (A5) e as decisões D304, D308, D311 e D316 a D323.
> **Regra que não muda:** os endereços das telas continuam os mesmos. A reorganização mexe no **menu, nos nomes e na primeira tela**, não apaga nem quebra nada. Link antigo continua abrindo.

---

## 1. O diagnóstico em uma frase

**O menu de hoje está organizado pela ordem em que as telas foram construídas, não pela ordem em que você pensa.**

O que o print do Master mostra:

| O que se vê | Por que atrapalha |
|---|---|
| 19 itens dentro de um grupo só ("Escritório") e mais 12 em "Ferramentas" | Ninguém lê 31 linhas. O olho procura e cansa. A regra prática é até 7 grupos e até 7 itens por grupo. |
| "Atendimento", "Caixa de entrada" e "Ver como cliente (suporte)" em lugares diferentes | Os três são **conversar com alguém**. Hoje você abre três telas para responder pessoas. |
| "Receita", "Caixa" e "Financeiro" separados (um em cima, outro lá embaixo em Ferramentas) | Os três respondem a mesma pergunta: **como está o dinheiro?** |
| "Crescimento", "Tráfego e campanhas", "Mesa de anúncios", "Black Friday" | Os quatro são **atrair gente**. E Black Friday é uma campanha com data para acabar, não um lugar fixo do menu. |
| "Comercial", "Executivos de venda", "Bônus e metas", "Agências", "Placar" espalhados | Os cinco são **o time que vende**. |
| "Lojistas", "Pedidos das lojas", "Produtos publicados", "Funil de ativação" | Os quatro são **como estão os meus clientes**. Deviam ser abas da mesma ficha. |
| "Erros do sistema", "Central de qualidade", "Sistema", "Equipe do Master" | São **bastidores**: importantes, mas você entra uma vez por semana. Hoje ocupam o mesmo peso visual de "Caixa de entrada". |
| Topo com Indique e ganhe, NOVO Atendimento, Buscar, Agente, som, sino, e duas faixas (Black Friday e segurança) empilhadas | O conteúdo da tela só começa na metade da altura. Avisos competem com o trabalho. |
| "Aprender" no meio das tarefas do dia | Aprender é ajuda; mora no "?" do topo, sempre à mão, sem ocupar a fila do trabalho. |

---

## 2. O princípio: um esqueleto só, para todo mundo

Se eu fosse o dono, eu queria **aprender o sistema uma vez e reconhecê-lo em qualquer painel**: no meu, no do funcionário, no do lojista quando eu entro em "Ver como cliente", no do parceiro. Para isso, todos os painéis usam **as mesmas gavetas, na mesma ordem**. Cada painel enche as gavetas com o que é dele; gaveta vazia não aparece.

Cada gaveta responde **uma pergunta que a pessoa faz de verdade**:

| # | Gaveta | A pergunta que ela responde | Com que frequência se abre |
|---|---|---|---|
| 1 | **Hoje** | "O que precisa de mim agora?" | Toda vez que entra |
| 2 | **Conversas** | "Quem está falando comigo?" | Várias vezes ao dia |
| 3 | **Vendas** | "Estou vendendo? O que está em andamento?" | Todo dia |
| 4 | **Clientes** | "Quem compra de mim e como eles estão?" | Todo dia |
| 5 | **Dinheiro** | "Quanto entrou, quanto sai, quanto sobra?" | Todo dia / semana |
| 6 | **Crescer** | "Como atraio mais gente?" | Semana |
| 7 | **Minha vitrine** | "O que eu ofereço e como aparece?" (loja, site, planos, temas) | Semana / mês |
| — | **Ajustes** (no rodapé do menu) | "Como a casa está configurada?" | Raramente |
| — | **Ajuda** (o "?" no topo) | "Como faço isso?" (Aprender, novidades, falar com suporte) | Quando precisar |

Por que essa ordem: é a ordem de um dia de trabalho. Primeiro o urgente (Hoje e Conversas), depois o que gera dinheiro (Vendas e Clientes), depois o que se acompanha (Dinheiro), depois o que se planeja (Crescer e Vitrine) e por fim o que se mexe pouco (Ajustes). **O que você usa mais fica mais perto do topo; o que usa menos desce.**

### Cinco regras de interação que valem para todos os painéis

1. **A primeira tela é uma fila de decisões, não um gráfico.** "Hoje" mostra cartões do tipo "3 lojistas pararam no passo do domínio — [Chamar no WhatsApp]". Cada cartão tem um botão que resolve ali mesmo. Gráfico fica em Dinheiro e Crescer.
2. **Número vermelho só onde há algo para eu fazer.** Badge em "Conversas" (não lidas) e em "Hoje" (pendências). Nunca badge de "Novo" permanente em item de menu; novidade vai para o sino.
3. **Uma faixa de aviso por vez no topo.** Black Friday, segurança e cobrança disputam o mesmo lugar; aparece a mais importante, as outras ficam no sino. Fechou, some por 7 dias.
4. **Telas irmãs viram abas de uma tela só.** Ex.: Dinheiro → abas "Receita | Caixa | A pagar e receber | Preços". Menos itens no menu, e quem chega numa aba vê as irmãs.
5. **Busca (Ctrl K) e favoritos são o atalho do dono.** Qualquer tela, cliente ou pedido se acha digitando. Até 5 telas favoritas fixadas no topo do menu, escolhidas por cada pessoa.

---

## 3. O seu painel: Master (Mauricio, o dono)

### Quem é você aqui
Dono de uma empresa pequena que cresce rápido, que faz venda, suporte, marketing e decisão ao mesmo tempo. Precisa em 30 segundos saber: **tem alguém esperando por mim? o dinheiro está bem? o time está batendo a meta? algo quebrou?**

### O menu proposto (de 31 itens para 7 gavetas)

```
[★ Favoritos: até 5, você escolhe]

HOJE
  Agora                    (fila de decisões + placar resumido do dia)

CONVERSAS                  (uma caixa só, com filtro por canal)
  Caixa de entrada         e-mails contato@, suporte@, financeiro@...
  Atendimento              chat, WhatsApp e o agente
  Ver como cliente         entrar no painel de um lojista para ajudar

VENDAS (o time que vende)
  Comercial                funil de interessados e propostas
  Contratos
  Executivos e agências    abas: Executivos | Agências | Parceiros
  Metas e placar           abas: Bônus e metas | Placar (súmula)

CLIENTES (os lojistas)
  Lojistas                 ficha 360 com abas: Loja | Pedidos | Produtos | Plano | Conversas
  Funil de ativação        quem travou em qual passo
  Pedidos das lojas
  Produtos publicados

DINHEIRO
  Receita                  abas: Receita | Caixa | Financeiro (a pagar e receber)

CRESCER
  Crescimento              visão geral: de onde vêm os clientes
  Tráfego e anúncios       abas: Tráfego e campanhas | Mesa de anúncios
  Campanhas da temporada   Black Friday hoje; Natal, Volta às aulas depois

MINHA VITRINE (o que a NextLevel vende)
  Planos e recursos
  Templates
  Loja NextLevel (serviços)

─────────────
AJUSTES (rodapé, recolhido)
  Equipe do Master · Sistema · Erros do sistema · Central de qualidade · Integridade dos dados
```

### O que muda na prática, item por item

| Hoje | Vai para | Motivo |
|---|---|---|
| Agora | Hoje → Agora | Já é a fila do dia. Ganha o placar resumido do Placar. |
| Aprender | "?" no topo | Ajuda, não tarefa. |
| Atendimento, Caixa de entrada | Conversas | Responder pessoas num lugar só. Badge único com o total de não lidas. |
| Ver como cliente (suporte) | Conversas | Você entra no painel do cliente quase sempre porque ele pediu ajuda. |
| Comercial, Contratos | Vendas | Funil → proposta → contrato é uma esteira só. |
| Executivos de venda, Agências | Vendas → Executivos e agências (abas) | É quem vende por você. |
| Bônus e metas, Placar | Vendas → Metas e placar (abas) | Meta e resultado lado a lado. |
| Lojistas, Pedidos das lojas, Produtos publicados, Funil de ativação | Clientes | Saúde dos clientes. A ficha 360 do lojista reúne tudo dele. |
| Receita, Caixa, Financeiro | Dinheiro → Receita (abas) | Uma pergunta, uma tela. |
| Crescimento, Tráfego, Mesa de anúncios | Crescer | Atração de gente. |
| Black Friday | Crescer → Campanhas da temporada | Campanha tem começo e fim; quando acaba, sai do menu sozinha. |
| Planos e recursos, Templates, Loja NextLevel | Minha vitrine | É o que você vende. |
| Sistema, Equipe do Master, Erros, Qualidade | Ajustes (rodapé) | Bastidores. Se um erro grave acontecer, ele aparece em "Hoje", não esperando você abrir a tela. |

### O topo da tela (barra de cima)

| Hoje | Proposta |
|---|---|
| Seletor de negócio "E Commerce" | Fica (é o filtro de marca). |
| Indique e ganhe | Sai do topo do Master; é do parceiro e do lojista. No Master vira cartão em "Crescer". |
| "NOVO Atendimento" | Sai; Atendimento já está em Conversas com badge. |
| Buscar (Ctrl K) | Fica, maior, no centro. É o atalho principal. |
| Agente | Fica (pedir ao agente é ação, não lugar). |
| Som, sino, avatar | Ficam. O sino recebe as novidades e as faixas que não couberam. |
| Faixa Black Friday + faixa segurança | Uma faixa por vez (a mais urgente). Segurança ganha porque protege o dinheiro. |

**Ganho esperado:** o menu cai de 31 linhas visíveis para 7 títulos com 2 a 4 itens cada (cerca de 20 linhas, 6 delas recolhidas no rodapé), e o conteúdo da tela começa logo abaixo do topo.

---

## 4. Painel dos funcionários (equipe do Master)

### Quem são
O mesmo Master, mas **cada pessoa vê só as gavetas do trabalho dela** (o papel é definido em "Equipe do Master"). Ninguém precisa decorar um menu do tamanho do seu.

| Papel | O que precisa fazer bem | Gavetas que vê | A tela "Hoje" dele mostra |
|---|---|---|---|
| **Comercial / executivo de vendas** | Transformar interessado em lojista pagante | Hoje, Conversas, Vendas, Clientes (só os dele) | Interessados novos sem contato, propostas paradas há 3 dias, meta do mês e posição no placar |
| **Suporte / sucesso do cliente** | Responder rápido e destravar o lojista | Hoje, Conversas, Clientes | Conversas esperando, lojistas travados no funil de ativação, lojas sem venda há 14 dias |
| **Financeiro** | Cobrar, pagar, fechar o mês | Hoje, Dinheiro, Clientes (só a aba Plano), Vendas → Contratos | Cobranças vencidas, repasses a pagar, comprovantes para conferir |
| **Marketing / tráfego** | Trazer gente qualificada | Hoje, Crescer, Minha vitrine | Campanhas no ar, custo por lojista, criativos para aprovar |
| **Designer / produção** | Entregar tema, banner, loja pronta | Hoje, Minha vitrine → Templates, Clientes (só os pedidos de serviço) | Entregas da semana, pedidos de ajuste dos clientes |
| **Técnico** | Manter o sistema saudável | Hoje, Ajustes | Erros novos, filas atrasadas, integridade dos dados |

**Como ele interage:**
- Entra e cai em "Hoje" com **a fila dele**, não a sua.
- O placar mostra o resultado do time, sem ranking que humilhe: "você" em destaque e a meta do time.
- Você (dono) pode trocar para "ver como [funcionário]" e enxergar exatamente o que ele vê.
- Dinheiro da empresa (Caixa) só aparece para quem tem papel de financeiro ou dono.

---

## 5. Painel dos freelancers

### Quem são
Designer, editor de vídeo, social media, programador, que trabalham **por tarefa** e não devem ver a empresa toda. Hoje eles cabem melhor no **Painel da Agência** (`/agencia`, que já tem Minha fila, Produção e Equipe) do que no Master.

### O que eu, como freelancer, queria ver
Um painel mínimo, com três perguntas respondidas:

```
HOJE          o que eu entrego hoje e o que voltou para ajuste
MINHAS TAREFAS fila com prazo, briefing, arquivos do cliente e botão "Entregar"
MEUS GANHOS   o que já entreguei, o que vai ser pago e quando
```

**Regras:**
- Vê o **nome da marca do cliente**, nunca dados de contato, dinheiro do cliente ou outros clientes.
- Acesso por cliente e com data de validade (termina o projeto, termina o acesso).
- Entregar = subir o arquivo e o cliente recebe no portal para aprovar (o caminho da D320 já existe).

---

## 6. Painel dos meus clientes (o lojista e a empresa)

Aqui está o coração do faturamento. O painel é o mesmo (NextLevel Business, D304), mas **a primeira tela e as gavetas se adaptam a quem é o cliente**. Uso as personas já mapeadas (A5) e acrescento as do Business e do Site.

### As personas

| Persona | Quem é | O que quer resolver | O "aha" (primeiro valor) | O que a primeira tela dele deve mostrar |
|---|---|---|---|---|
| **Juliana, marca de moda do Instagram** | Fatura de R$ 10 mil a R$ 100 mil/mês, vende por Instagram e WhatsApp | Loja bonita que converte e tira a dependência do marketplace | Ver a loja dela linda no celular | Vendas de hoje, pedidos para separar, conversas, "seu tema" e campanha da semana |
| **Rodrigo, migrante insatisfeito** | Já tem loja em outra plataforma | Trocar sem parar de vender | Ver a própria loja migrada numa prévia | Checklist da migração (produtos, clientes, domínio, redirecionamentos) até o "ligar" |
| **Dona Lúcia, negócio local que começa** | Loja de bairro, MEI, pouca intimidade com tecnologia | Vender pela internet sem se perder | Primeiro produto no ar e o link para mandar no WhatsApp | Uma trilha de 5 passos, com um botão grande por vez e "Pede pro Maurício" sempre à vista |
| **Dr. Paulo, prestador de serviço (só Site)** | Clínica, academia, escritório, salão | Ser achado no Google e receber pedidos de orçamento | O site no ar e o primeiro contato chegando | Contatos e orçamentos novos, agenda, visitas do site; **nada de "produtos" e "estoque"** |
| **Agência parceira (Business da agência)** | Agência que atende vários clientes | Produzir, aprovar e cobrar de vários clientes sem bagunça | O primeiro cliente aprovando pelo portal | Fila de produção, aprovações pendentes, cobranças do mês (Painel da Agência) |

### O menu do cliente no esqueleto comum

Hoje o painel do lojista (`navDoNegocio`) tem um grupo "NextLevel Business" com 10 itens misturados, mais "Site", "Loja virtual" e "Ajustes". Proposta:

```
HOJE
  Agora                      fila de decisões do dia + trilha de primeiros passos

CONVERSAS
  Atendimento                chat, WhatsApp e e-mail num lugar só
  Contatos e orçamentos      quem pediu orçamento pelo site ou pela loja

VENDAS
  Pedidos                    abas: Para separar | Enviados | Pós-venda (trocas e devoluções)

CLIENTES
  Clientes                   CRM com histórico de compra (une "Clientes" e "Cadastro de clientes")

DINHEIRO
  Financeiro                 abas: Recebido | A receber | Minha assinatura

CRESCER
  Campanhas                  abas: Campanhas | Cupons | Anúncios na Meta
  Avaliações
  Análise
  Pede pro Maurício          (o assistente; também fica como botão no topo)

MINHA VITRINE
  Minha loja                 (só quem tem Loja) abas: Produtos | Categorias | Banners
  Meu site                   (só quem tem Site) abas: Páginas | Serviços
  Aparência                  tema, cores, domínio (uma tela só para Loja e Site)

─────────────
AJUSTES (rodapé)
  Empresa · Equipe · Plano do negócio · Aplicativos · Ferramentas · Contratos · Registro de ações · Migrar
```

**Como ele se adapta (sem tela nova, só mostrando ou escondendo gavetas):**
- **Só Site (Dr. Paulo):** some "Pedidos" e "Minha loja"; "Contatos e orçamentos" sobe para o primeiro lugar de Conversas.
- **Só Loja (Juliana):** some "Meu site".
- **Iniciante (Dona Lúcia), nos primeiros 14 dias:** "Hoje" mostra só a trilha; Crescer e Ajustes ficam recolhidos até a primeira venda. Ela não se assusta com 25 itens.
- **Migrante (Rodrigo):** "Migrar" sobe para "Hoje" como cartão até a migração terminar, depois volta para Ajustes.
- **O que ele não tem no plano** aparece uma vez, com cadeado e o que ganha ("Ligar site — seus clientes te acham no Google"), nunca em todo canto.

### Funcionário do lojista (o vendedor da Juliana)
Já existe a regra `STAFF_NAV_PREFIXES`: o funcionário da loja vê Conversas, Pedidos, Clientes e Produtos. Proposta: manter e dar a ele um "Hoje" próprio ("8 pedidos para separar, 3 conversas esperando") e **nunca** Dinheiro e Ajustes.

---

## 7. Painel do cliente do meu cliente

São duas pessoas diferentes, e as duas carregam a marca **do meu cliente**, não a da NextLevel (só "com tecnologia NextLevel" no rodapé).

### 7.1 O consumidor da loja (compra na loja da Juliana)
Entra pela "Minha conta" da loja (`/store/[slug]/conta`). O que ele quer é simples e quase sempre ansioso: **"cadê meu pedido?"**

```
MEUS PEDIDOS     o último pedido em destaque, com a linha do tempo (pago → separado → enviado → entregue) e o rastreio
TROCAS           pedir troca ou devolução em 3 toques, com foto
MEUS DADOS       endereços, CPF, senha (entrar por código no e-mail, sem senha para lembrar)
FAVORITOS        e o "avise-me quando chegar"
MEUS CUPONS      cupons e pontos que ele tem nesta loja
FALAR COM A LOJA  abre o WhatsApp ou o chat da loja, já com o número do pedido
```
**Regra de ouro:** a primeira coisa que ele vê ao entrar é o status do último pedido. Não é a vitrine, não é propaganda.

### 7.2 O cliente da agência (a empresa atendida pela agência)
Já existe o **Portal do cliente** (D320): acompanha o mês, aprova conteúdo, paga e faz pedidos. Proposta de ordem, pela pergunta dele:

```
PARA APROVAR      o que espera por mim (com o número em destaque)
ESTE MÊS          contratado × produzido × publicado
PAGAMENTOS        o que vence e o botão Pagar
PEDIDOS           mandar ideia, dúvida ou ajuste
CONTRATO          o contrato assinado (D321)
```

### 7.3 O cliente do prestador de serviço (paciente do Dr. Paulo)
Não precisa de painel: precisa de **um link** que mostra o orçamento ou o agendamento, com botão de confirmar e de falar no WhatsApp. Painel com login seria fricção.

---

## 8. Usuários finais e visitantes (páginas públicas)

Quem chega em `nextlevelcommerce.com.br` sem conta ainda não é cliente. Ele faz uma pergunta só: **"isso é para mim?"** Por isso as páginas públicas se organizam **por intenção**, não por recurso:

| Ele chega pensando... | Vai para | Botão principal |
|---|---|---|
| "Quero vender pela internet" | Loja virtual | Criar minha loja grátis |
| "Quero um site para o meu negócio" | Site | Criar meu site |
| "Já tenho loja em outra plataforma" | Migrar | Ver minha loja migrada |
| "Quero que façam por mim" | Soluções NextLevel (agência) | Pedir orçamento |
| "Quero ganhar indicando" | Parceiros | Virar parceiro |

**Regras:** o menu público tem no máximo 5 itens (as 5 intenções + Entrar). Preço visível sem precisar falar com vendedor. Cada página termina com uma pergunta frequente que derruba a principal objeção daquela persona ("e se eu não vender?", "vou perder meu Google?").

---

## 9. Painel dos parceiros

### Quem são (tipos que já existem no sistema)

| Tipo | Quem é | O que quer | O "aha" |
|---|---|---|---|
| **Afiliado** | Pessoa que indica por link e cupom | Ganhar por indicação sem esforço técnico | Primeira indicação que virou cliente pagante |
| **Representante / executivo** | Vendedor de rua ou de região | Fechar lojistas e acompanhar comissão | A primeira loja que ele fechou no ar |
| **Agência** | Agência que vende e atende lojistas | Revender a plataforma com o próprio serviço | O primeiro cliente dela no ar e pagando |
| **Agência Elite / White label** | Agência grande, com marca própria | Plataforma com a marca dela | Primeiro cliente entrando com a marca dela |

### O menu do parceiro no esqueleto comum

Hoje: Início, Links, Cupons de 7 dias, CRM de clientes, Catálogo comercial, Indicados, Financeiro, Meu perfil (8 itens em 5 grupos). Proposta:

```
HOJE          quanto ganhei no mês, quanto falta para o próximo bônus, e 3 ações do dia
              ("2 indicados pararam no cadastro — mande este recado")
CONVERSAS     CRM de clientes (com recados prontos para WhatsApp)
VENDAS        Indicados (onde cada um está: cadastrou → testou → pagou)
DINHEIRO      Financeiro (a receber, recebido, quando cai)
CRESCER       Divulgar — abas: Links | Cupons | Catálogo comercial | Materiais prontos
─────────────
AJUSTES       Meu perfil
```

**O que muda para cada tipo:** o afiliado vê só "Divulgar" e "Dinheiro" em destaque; o representante vê "Vendas" com o funil dele e o placar; a agência vê também "Clientes" com a produção (e o atalho para o Painel da Agência). Sem promessa de ganho: os números são o que **ele** já ganhou e a regra do bônus, nunca "você pode ganhar R$ X".

---

## 10. Fornecedores e outras marcas (em pausa)

SuperDrop, Brás, Cargas e Importadora seguem pausados (D216). Proposta: **não mexer agora**, mas quando voltarem, encaixar os menus deles no mesmo esqueleto (o fornecedor: Hoje = esteira; Vendas = pedidos; Minha vitrine = produtos e estoque; Dinheiro = faturas e recargas). Quem aprende um painel aprende todos.

---

## 11. Visão de conjunto: quem vê o quê

| Gaveta | Dono (Master) | Funcionário | Freelancer | Lojista | Consumidor da loja | Cliente da agência | Parceiro |
|---|---|---|---|---|---|---|---|
| Hoje | Fila da empresa | Fila do papel dele | Entregas de hoje | Fila da loja / trilha | Último pedido | Para aprovar | Meta e ações |
| Conversas | Todas | As dele | — | Da loja | Falar com a loja | Pedidos | CRM |
| Vendas | Time comercial | Comercial: o funil dele | — | Pedidos | Meus pedidos | — | Indicados |
| Clientes | Lojistas | Os dele | Nome da marca | CRM | — | — | (agência) |
| Dinheiro | Tudo | Só financeiro | Meus ganhos | Da loja | Cupons e pontos | Pagamentos | Comissões |
| Crescer | Marketing da NextLevel | Só marketing | — | Campanhas, cupons | — | — | Divulgar |
| Minha vitrine | Planos, temas, serviços | Marketing e produção | Tarefas | Loja, site, aparência | Favoritos | Este mês | — |
| Ajustes | Tudo | Técnico | — | Empresa, equipe | Meus dados | Contrato | Perfil |

---

## 12. Como fazer sem quebrar nada (plano em etapas)

Cada etapa é pequena, publica junto com outro código (para economizar montagem no Render) e manda print ao dono.

| Etapa | O que faz | Onde mexe | Risco |
|---|---|---|---|
| **R0** | Dono aprova esta proposta e responde as perguntas da seção 13. Registrar como D324. | `docs/design/DECISIONS.md` e base de conhecimento | Nenhum |
| **R1** | Master: reagrupar o menu nas 7 gavetas + Ajustes no rodapé; "Aprender" vai para o "?" do topo; Black Friday entra em Crescer; uma faixa de aviso por vez. **Só menu e nomes; endereços iguais.** | `MASTER_ECOMMERCE_NAV` em `src/lib/nav.ts`, casca do painel | Baixo |
| **R2** | Telas irmãs viram abas: Receita/Caixa/Financeiro; Tráfego/Mesa de anúncios; Bônus/Placar; Executivos/Agências; Atendimento + Caixa de entrada com contador único | páginas de `src/app/master/*` | Médio |
| **R3** | Menu por papel na equipe do Master e "Hoje" de cada papel | `src/app/master/equipe`, `src/lib/domain/access` | Médio (permissão no servidor, com teste) |
| **R4** | Lojista: novo agrupamento em `navDoNegocio`, adaptação por persona (só Site, só Loja, iniciante, migrante), "Hoje" do funcionário da loja | `src/lib/nav.ts`, `src/app/merchant` | Médio |
| **R5** | Parceiro no esqueleto, com "Hoje" de meta e ações | `NAV.AFFILIATE`, `src/app/partner` | Baixo |
| **R6** | "Minha conta" do consumidor começando pelo último pedido; portal do cliente da agência na ordem proposta | `src/app/store/[slug]/conta`, `/portal` | Baixo |
| **R7** | Freelancer como papel no Painel da Agência, com acesso por cliente e com validade | `src/app/agencia`, domínio de agências | Médio |
| **R8** | Favoritos (até 5) e "ver como [funcionário]" | casca do painel | Baixo |

**Como medir se ficou melhor (antes e depois):**
- quantos cliques do login até responder uma conversa (meta: 1);
- quantas linhas de menu visíveis sem rolar (meta: tudo cabe numa tela de notebook);
- tempo para um funcionário novo achar 5 telas pedidas (meta: menos de 1 minuto, sem ajuda);
- no lojista: % que termina a trilha de primeiros passos em 7 dias.

**Testes:** cada etapa leva teste do menu por papel (quem vê o quê) e varredura de acessibilidade em 360 px com `e2e/polish-v8.mjs`.

---

## 13. Perguntas para o dono (respostas destravam a R0)

1. **Nomes das gavetas:** gosta de "Hoje, Conversas, Vendas, Clientes, Dinheiro, Crescer, Minha vitrine, Ajustes"? Ou prefere outro nome para alguma (ex.: "Marketing" no lugar de "Crescer", "Oferta" no lugar de "Minha vitrine")?
2. **Black Friday:** pode virar "Campanhas da temporada" dentro de Crescer, saindo do menu quando acabar?
3. **Aprender no "?" do topo:** pode sair do menu?
4. **Papéis da equipe:** hoje quem trabalha com você além de você? (comercial, suporte, financeiro, tráfego, design, técnico). Começo pelos papéis que existem de verdade.
5. **Freelancers:** eles devem entrar pelo Painel da Agência (proposta) ou pelo Master?
6. **Ordem de execução:** começo pelo seu Master (R1, o que você vê todo dia) ou pelo lojista (R4, o que mais aproxima o 10º lojista pagante, regra 60/25/15)?

> **Minha recomendação:** R1 primeiro (é pequena, só menu, e você sente a diferença no mesmo dia), depois R4 (lojista), porque é o painel que decide se o cliente fica e paga.
