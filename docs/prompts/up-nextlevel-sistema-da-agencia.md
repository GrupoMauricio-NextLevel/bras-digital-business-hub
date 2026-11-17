# UP + NextLevel: o sistema da agência, a parceria Léo e Maurício e o caso que vende o NextLevel Business

> **Pedido do dono (17/11/2026):** ampliar o cockpit do dono da agência para cinco frentes: **gestão comercial do próprio catálogo e portfólio**, **marketing próprio para captar clientes**, **gestão de cada departamento da equipe**, **gestão avançada de cada cliente sobre os serviços do catálogo** e **uma janela para as soluções da NextLevel** como aceleração da carteira, enviando **demandas para a mesa do Maurício** e acompanhando o progresso. A agência também precisa de ajuda para divulgar o próprio catálogo. **Léo (dono da UP) precisa do Maurício e o Maurício precisa do Léo:** é uma parceria. Incluir as **páginas públicas** (o modelo de negócio para empresas, o site da UP e LPs por segmento ligadas ao tráfego e ao CRM) e os **cockpits dos dois lados**. Agir como dono e trazer o que ficou esquecido. Um **prompt engenheiro mestre** no fim.
>
> **Estado:** proposta para o dono aprovar. Já no código: **D313** (Painel da Agência, fases AG0 a AG2: agência, equipe com funções, carteira com contrato, importação por planilha, cockpit "Hoje na agência", com o visual da Commerce). Fechado em preço: só a **D312** (código não se vende; o degrau maior é a Licença dedicada). **Valores ficam fora deste documento** (pedido do dono, 16/11).
>
> **Documentos relacionados:** `agencias-parceiras-up-piloto.md` (racional e Parte 8: cobrança automática, Agência Fundadora), `agencias-up-perguntas-estrategicas.md` (perguntas e leitura da equipe da UP), `nextlevel-business-coracao-do-negocio.md` (NB0 a NB10), `trafego-campanhas-meta-google-reels.md`, `contratos-assinatura-no-painel.md`, `busca-ia-academy-funil-organico.md`.
>
> **Ao aprovar:** vira a decisão **D314** em `docs/design/DECISIONS.md`, com frente `[E-commerce]`, e é citada em `docs/conhecimento/BC0-INVENTARIO.md`.

---

## Resumo em uma página

**A ideia:** a UP faz conteúdo melhor do que ninguém; a NextLevel transforma atenção em contato, venda e gestão. Juntas, viram uma coisa que nenhuma das duas vende sozinha: **"conteúdo que vira cliente, com tudo medido"**. O sistema é o lugar onde essa parceria acontece, com dois cockpits que se olham:

| | Cockpit do Léo (UP) | Cockpit do Maurício (NextLevel) |
|---|---|---|
| **O que vê** | A agência inteira: comercial, marketing, departamentos, clientes, dinheiro e a janela NextLevel | A parceria: saúde da UP, demandas na mesa, entregas, receita gerada, próximos passos |
| **O que decide** | Quem vender, o que produzir, quem está sobrecarregado, quem cobrar, o que pedir à NextLevel | O que entregar primeiro, onde a UP precisa de apoio, o que vira produto para outras agências |
| **Onde** | `/agencia` (já existe, D313) | Master → Agências → UP (amplia a tela que já existe) |

**As cinco frentes do cockpit do Léo:**
1. **Comercial:** o catálogo de serviços da UP, o portfólio (cases em vídeo), propostas com link e aceite, contrato assinado no painel e o funil de quem está negociando.
2. **Marketing próprio:** o site da UP, LPs por segmento, formulário que cai no CRM com a origem de cada contato, anúncios medidos e indicação de clientes.
3. **Departamentos:** cada área (atendimento, roteiro, gravação, edição, social media, tráfego, financeiro) com a fila dela, a capacidade, os prazos e o retrabalho.
4. **Cada cliente:** os serviços contratados do catálogo, o consumo do pacote no mês, aprovações, cobrança, resultados, saúde do cliente e a hora certa de renovar ou ampliar.
5. **Janela NextLevel ("Mesa do Maurício"):** a UP pede site, LP, loja, CRM, automação ou sistema para um cliente dela, acompanha cada etapa e ganha a parte dela.

**O que torna isso um caso de sucesso:** tudo é medido desde o dia zero (linha de base). Em 90 dias, a NextLevel tem números reais para mostrar a outras agências e empresas: **"veja o que a UP passou a controlar"**. A página pública "NextLevel Business para Agências" nasce desse caso, sem número inventado.

**Ordem de construção:** primeiro a UP rodando (cobrança, catálogo, site e a primeira LP, mesa do Maurício); depois os departamentos e a gestão avançada de cada cliente; depois o portal do cliente e as páginas públicas do modelo. Detalhes na Parte 7 e no prompt mestre (Parte 10).

---

## Mapa do documento

1. A parceria: por que um precisa do outro
2. Princípios (o que não pode quebrar)
3. O cockpit do Léo: as cinco frentes
4. O cockpit do Maurício em relação à UP
5. A integração: o melhor da UP com o melhor da NextLevel
6. Páginas públicas: o modelo para empresas, o site da UP e as LPs por segmento
7. Ondas de construção
8. O que ficou esquecido: sugestões de dono
9. Como medir e transformar em caso de sucesso
10. Prompt engenheiro mestre

---

# 1. A parceria: por que um precisa do outro

| O Léo (UP) tem | O Léo precisa | O Maurício (NextLevel) tem | O Maurício precisa |
|---|---|---|---|
| Equipe que grava, roteiriza, edita, publica e anuncia | Organizar a agência, cobrar sem esforço, mostrar resultado, vender mais | Plataforma de site, loja, CRM, tráfego medido, cobrança, IA | Conteúdo de qualidade para as páginas e campanhas dos clientes |
| Relação mensal com dezenas de clientes | Divulgar o próprio catálogo e captar clientes novos | Equipe de tecnologia e o NextLevel Business | Um caso real e grande para vender o NextLevel Business |
| Linguagem de vídeo, criatividade | Ferramentas que ele não tem como construir | Método de captação e medição | Um canal que se repete (outras agências) |

**A frase da parceria:** *"A UP faz o conteúdo. A NextLevel faz o conteúdo virar cliente. O sistema mostra os dois trabalhando juntos."*

**Na prática, a UP é ao mesmo tempo:**
- **usuária** do NextLevel Business, que toca a agência e capta os próprios clientes;
- **parceira**, que oferece as soluções da NextLevel aos clientes dela e ganha por isso;
- **vitrine**, porque o caso da UP vende o modelo para outras agências.

---

# 2. Princípios (o que não pode quebrar)

1. **Reaproveitar antes de criar** (regra anti-duplicação). O site da UP é o caminho Site do NextLevel Business; o catálogo da UP são os serviços da empresa (`servicos_negocio`); o CRM é Contatos e orçamentos (`contatos_negocio`); a mesa do Maurício estende os pedidos de serviço (`services`, `service_orders`, `service_messages`). Nada de segundo site, segundo CRM ou segunda mesa.
2. **Visual da NextLevel Commerce** em todo painel (pedido do dono, D313): faixa roxa, cartão de boas-vindas, fila do dia e cartões de números. Nada de visual novo.
3. **Uma agência nunca vê outra;** cada função vê só o que é dela (D313); o cliente da UP é dono dos dados dele e autoriza o acesso.
4. **Dinheiro:** o cliente da UP paga direto na conta da UP; a NextLevel nunca guarda dinheiro da agência (Parte 8.4 do racional). Pagamento só vale conferido na API.
5. **Sem promessa de ganho e sem número inventado** em tela, relatório ou página pública. O caso de sucesso usa só números medidos, com o aceite da UP para publicar.
6. **Regras e valores configuráveis** (`platform_settings`, tabela de preços do Master), nunca fixos no código.
7. **Tudo atrás de chave** (`AGENCIAS_V1` e chaves por onda); desligado, ninguém percebe mudança.
8. **Parceria de mão dupla:** a NextLevel não oferece aos clientes da UP nada sem a UP saber, e a UP não leva para outra plataforma o que construiu junto sem aviso. Isso vai para o termo da Agência Fundadora (Parte 8).

---

# 3. O cockpit do Léo: as cinco frentes

O painel `/agencia` (D313) ganha um menu por frente, sempre no visual da Commerce:

```
HOJE            Visão geral, fila do dia (já existe)
COMERCIAL       Catálogo e portfólio · Funil · Propostas · Contratos
MARKETING       Site e LPs · Contatos (CRM) · Campanhas e origem · Indicações
OPERAÇÃO        Produção do mês · Agenda de gravação · Departamentos
CLIENTES        Carteira (já existe) · Ficha avançada · Portal do cliente
FINANCEIRO      Cobrança · Recebimentos · Inadimplência · Margem por cliente
NEXTLEVEL       Mesa do Maurício · Soluções para a carteira · Ganhos da parceria
GESTÃO          Equipe (já existe) · Ajustes
```

## 3.1 Frente comercial: catálogo, portfólio, propostas e funil

**Catálogo de serviços da UP** (reaproveita `servicos_negocio` da conta Business da UP, ver 5.2):
- cada serviço com nome, descrição, o que entrega (vídeos, fotos, posts, criativos, gravações), prazo, preço de tabela e se é mensal ou avulso;
- **pacotes** (ex.: "Mensal 8 vídeos") montados a partir dos serviços;
- o mesmo catálogo aparece no site da UP (botão "Pedir orçamento" com o serviço já escolhido, como já funciona na NB3) e alimenta o contrato de cada cliente (3.4).

**Portfólio:**
- cases por segmento (clínica, academia, restaurante...), cada um com vídeos (link + capa, sem vídeo no banco), o desafio, o que foi feito e o resultado medido quando houver;
- o portfólio vira seção do site e das LPs da UP;
- o cliente precisa autorizar o uso do case (aceite registrado).

**Propostas com link e aceite:**
- o Léo monta a proposta a partir do catálogo, com validade;
- o cliente abre no celular, aceita, e o aceite vira **contrato assinado no painel** (reaproveita `contratos-assinatura-no-painel.md`) e **cliente ativo na carteira** com o contrato preenchido, sem digitar de novo;
- a primeira fatura sai pela cobrança automática (AGF1).

**Funil comercial da UP:**
- etapas: novo contato → conversa → diagnóstico → proposta enviada → fechou ou perdeu (com motivo);
- origem de cada oportunidade (LP, anúncio, indicação, Instagram, evento), vinda do formulário com a regra única de canais (`canalDe`);
- números: contatos no mês, taxa de fechamento, tempo até fechar, valor fechado, de onde vêm os melhores clientes.

## 3.2 Frente de marketing: a UP captando os próprios clientes

O Léo sabe vender conteúdo para os outros, mas precisa de estrutura para captar para si. A NextLevel entrega isso pronto:
- **site institucional da UP** no caminho Site do NextLevel Business, com domínio próprio, catálogo, portfólio e formulário;
- **LPs por segmento** (página de campanha, NB4), cada uma com a dor do segmento, cases daquele segmento, oferta e formulário;
- **origem medida** em cada contato: etiquetas `utm`, clique do anúncio (`fbclid`, `gclid`), site de origem e links rastreados para o Instagram, o WhatsApp e a bio (`links_rastreados`);
- **Pixel e API de conversões** da Meta e do Google por LP (TR1 a TR6, D290 a D302), com o evento de contato e, depois, o de cliente fechado;
- **resultados dos anúncios** dentro do painel (leitura da Meta por API, D302): quanto custou cada contato e cada cliente fechado;
- **indicação:** cada cliente da UP ganha um link para indicar outra empresa; quem indica ganha um benefício definido pela UP;
- **isca de diagnóstico:** "Diagnóstico grátis do seu Instagram" como LP, que gera contato qualificado para o funil;
- **o Alam (tráfego da UP) usa as mesmas ferramentas nos clientes dele:** a UP vira a maior prova de que a medição funciona.

**Ajuda para divulgar o catálogo (o Léo precisa e a NextLevel entrega):**
- modelos prontos de LP por segmento, com texto inicial escrito pelo Maurício IA a partir do catálogo da UP, que a UP revisa;
- calendário de conteúdo da própria UP (a UP grava os próprios cases, como faz para os clientes);
- campanha de lançamento do site novo da UP, montada junto na mesa do Maurício como primeira demanda.

## 3.3 Frente de departamentos: gestão de cada área da equipe

Cada departamento tem uma tela com a fila dele e quatro números:

| Departamento | Fila | Números que o Léo vê |
|---|---|---|
| Atendimento | Clientes para responder, aprovações paradas, onboarding de cliente novo | Tempo de resposta, aprovações atrasadas |
| Roteiro | Pautas do mês sem roteiro, roteiros para revisar | Roteiros por semana, % aprovado de primeira |
| Gravação | Agenda da semana, remarcações, checklist | Gravações feitas e remarcadas, deslocamentos |
| Edição | Vídeos na fila, versões, ajustes pedidos | Vídeos por pessoa por dia, retrabalho, atraso |
| Social media | Calendário de posts, posts do dia, clientes sem post | Posts no prazo, clientes sem post na semana |
| Tráfego | Campanhas ativas, verba por cliente, campanhas paradas | Custo por contato, contatos por cliente |
| Financeiro | Cobranças do mês, atrasos, renegociações | Recebido x previsto, inadimplência |

**Capacidade e gargalo:** o sistema compara o que foi vendido (soma do incluso nos contratos) com o que a equipe entrega por semana e avisa antes de faltar braço ("a edição está com 30% a mais de vídeos do que entrega por semana").

**Prazos por etapa (combinado da UP):** cada etapa da produção tem prazo; o atraso aparece na fila do departamento e na fila do dia do Léo.

## 3.4 Frente de clientes: gestão avançada de cada cliente

A ficha do cliente (já existe, D313) vira o centro de tudo o que a UP faz para ele:
- **serviços contratados do catálogo**, e não texto solto: cada item do contrato aponta para um serviço do catálogo, com quantidade, preço e se é mensal ou avulso;
- **consumo do mês:** "8 vídeos contratados, 5 entregues, 2 em edição, 1 a gravar" com previsão de fechar o mês;
- **linha do tempo:** gravações, entregas, aprovações, cobranças, conversas e demandas na mesa do Maurício;
- **aprovação** (portal do cliente), **cobrança** (AGF1/AGF2) e **resultados** (contatos, vendas e anúncios do cliente, quando ele usa a NextLevel);
- **saúde do cliente:** uma nota simples a partir de pagamento em dia, aprovações rápidas, entregas no prazo e resultado no mês. Cliente em risco aparece na fila do dia antes de cancelar;
- **renovação e ampliação:** aviso de aniversário do contrato, sugestão de reajuste e "este cliente consome mais do que contratou" (hora de ampliar o pacote);
- **onboarding** do cliente novo: checklist (briefing, identidade visual, acessos às redes guardados com segurança, primeira gravação marcada);
- **NPS mensal** de uma pergunta, pelo portal.

## 3.5 Frente NextLevel: a janela e a Mesa do Maurício

A janela para as soluções da NextLevel, dentro do painel da UP:

**Soluções para a carteira:**
- site, LP de campanha, loja virtual, CRM e atendimento, tráfego medido, automação, sistema sob medida;
- para cada solução: para quem serve, o que entrega, prazo, preço da tabela do Master e o ganho da UP;
- **sugestões por cliente:** a própria carteira mostra onde cada solução faz sentido ("6 clientes produzem vídeo todo mês e não têm página para onde levar o público").

**Mesa do Maurício (enviar demanda e acompanhar):**
- a UP abre a demanda escolhendo a solução e o cliente (ou a própria UP), com briefing, anexos e prazo desejado;
- etapas visíveis: **recebida → em análise → orçamento enviado → aprovada → em produção → em revisão → entregue**, com responsável da NextLevel e previsão;
- conversa dentro da demanda, aprovação do orçamento com um clique e aviso a cada mudança;
- a entrega fica ligada ao cliente: o site ou a LP entregue aparece na ficha dele, com os resultados;
- **reaproveita** `services`, `service_orders` (já tem as situações pedido, em análise, orçado, em produção, entregue e cancelado) e `service_messages`. Estender com: agência e cliente da agência, revisão, previsão, responsável e anexos por link.

**Ganhos da parceria:**
- o que a UP ganhou com cada solução (comissão do Programa de Parceiros, D260), o que está a receber e o histórico;
- o que a parceria entregou na carteira: quantos clientes da UP usam alguma solução e com que resultado.

---

# 4. O cockpit do Maurício em relação à UP

Amplia **Master → Agências** (D313) com a página da agência:

| Bloco | O que mostra |
|---|---|
| **Saúde da parceria** | Uso do painel por semana, equipe ativa, carteira, cobrança passando pelo sistema, nota da conversa semanal |
| **Mesa** | Demandas da UP por etapa, prazo, responsável e atraso (o SLA da mesa), com a fila geral da NextLevel |
| **Receita da parceria** | O que a UP paga pelo sistema, adicionais vendidos pela UP, comissões pagas, previsão do mês |
| **Carteira da UP (resumo)** | Clientes ativos, segmentos e soluções NextLevel em uso. Dados detalhados de cada cliente só com o aceite dele |
| **Marketing da UP** | Contatos do site e das LPs da UP, origem e fechamentos: o Maurício vê se a captação montada junto está funcionando |
| **Próximos passos** | O combinado da última conversa semanal, com dono e data |
| **Para o produto** | Pedidos da UP que viram melhoria para todas as agências (fila de produto aprovada pelo dono) |

Uma linha no "Agora" do Master avisa quando há demanda da UP parada ou cliente da UP com solução entregue sem resultado.

---

# 5. A integração: o melhor da UP com o melhor da NextLevel

## 5.1 O fluxo que une os dois

```
Catálogo da UP ──► Site e LPs da UP ──► Contato com origem ──► Proposta com link ──► Contrato assinado
                                                                                         │
             ┌───────────────────────────────────────────────────────────────────────────┘
             ▼
     Cliente na carteira ──► Produção do mês (roteiro, gravação, edição) ──► Aprovação no portal
             │                                                                        │
             │                                         ┌──────────────────────────────┘
             ▼                                         ▼
     Cobrança automática              Vídeo aprovado ──► "Usar no site/LP" do cliente (NextLevel)
             │                                         │
             ▼                                         ▼
     Recebido no mês                   Anúncio do tráfego da UP ──► Contato do cliente com origem
                                                       │
                                                       ▼
                         Relatório do mês: "o vídeo X trouxe N contatos e R$ Y" (portal do cliente)
                                                       │
                                                       ▼
                         Renovação, ampliação do pacote e nova demanda na Mesa do Maurício
```

## 5.2 Uma conta só para o Léo, dois painéis

- A UP ganha **também** uma conta NextLevel Business (caminho Site) para o site, as LPs, o catálogo e o CRM dela.
- A **conta do grupo** (D141) liga o perfil "Painel da Agência" e o perfil "Site da UP": o Léo troca de um para o outro sem novo login.
- A ligação fica registrada na agência (`agencias.store_id` ou equivalente, a decidir na fase de diagnóstico), para que:
  - o catálogo do site seja o mesmo dos contratos;
  - o contato que vira cliente no site entre na carteira da agência com um clique;
  - os números de marketing apareçam no cockpit da agência.

## 5.3 Pacotes combinados (oferta conjunta)

A UP pode vender, com a marca dela, pacotes que juntam os dois mundos. Exemplos de nome:
- **"Conteúdo que vende":** pacote mensal de vídeos da UP + LP da NextLevel + relatório de contatos;
- **"Presença completa":** conteúdo + site institucional + CRM de contatos;
- **"Loja que aparece":** conteúdo de produto + loja virtual + campanha.

A parte NextLevel de cada pacote entra pela mesa do Maurício e pela tabela do Master; a UP define o preço final para o cliente dela. Preços: ficam para depois (pedido do dono).

---

# 6. Páginas públicas

> Regra da casa (skill `pagina-de-vendas`): página de alto nível é ativo produzido (foto, vídeo, telas reais) + roteiro + texto. **A UP produz conteúdo; ela mesma pode gravar os ativos** das próprias páginas e da página do modelo NextLevel. Nada de foto genérica, número ou depoimento inventado; "disponível", "demonstração" e "em breve" bem separados.

## 6.1 NextLevel: "NextLevel Business para Agências" (o modelo para empresas)

- Endereço sugerido: `/agencias` na NextLevel Commerce, ligada à `/empresas` (D310).
- **Para quem:** agências de conteúdo, social media, produtoras, fotógrafos, assessorias de marketing e, depois, empresas de serviço com equipe e carteira (consultorias, escritórios, clínicas com várias unidades).
- **Roteiro:**
  1. a dor: carteira em planilha, cobrança na mão, cliente perguntando "isso trouxe resultado?";
  2. o sistema: telas reais do cockpit (D313 em diante);
  3. as cinco frentes;
  4. a parceria com a NextLevel: soluções para a carteira e a mesa;
  5. o caso UP, **só quando houver números medidos e o aceite da UP**; até lá, "Agência Fundadora em andamento";
  6. como começar: conversa com a NextLevel e formulário assistido.
- **Captação:** formulário que cai em Contatos e orçamentos da própria NextLevel, origem medida, Pixel e API de conversões.
- Some do sitemap enquanto a chave estiver desligada (como a `/empresas`).

## 6.2 Site institucional da UP (no NextLevel Business)

- **Páginas:** Início (manifesto, vídeo forte, segmentos atendidos), Serviços (catálogo), Portfólio (cases por segmento), Sobre (equipe e jeito de trabalhar), Contato (formulário de orçamento), e a página de cada serviço.
- **Ativos:** gravados pela própria UP (bastidores de gravação, equipe, cases em vídeo curto). Lista de ativos (manifesto) entregue pela NextLevel na fase de construção.
- Domínio da UP com HTTPS (domínio próprio já existe no sistema, D234).

## 6.3 LPs por segmento (uma por segmento da carteira da UP)

- Uma LP por segmento que a UP atende (os segmentos vêm da planilha dos 30 clientes; exemplos: clínicas e consultórios, academias, restaurantes, imobiliárias, estética, advocacia, varejo).
- **Cada LP tem:** a dor do segmento em uma frase, 2 ou 3 cases daquele segmento (só os autorizados), o pacote indicado do catálogo, perguntas frequentes do segmento e o formulário com o serviço e o segmento já marcados.
- **Ligadas às fontes de tráfego:** etiquetas por campanha, Pixel e API de conversões, link rastreado para o WhatsApp e para a bio do Instagram, evento de contato e de cliente fechado.
- **Ligadas ao CRM:** o contato cai no funil comercial da UP com segmento, serviço, origem e campanha; aparece na fila do dia do atendimento.
- **Medição:** custo por contato e por cliente fechado por LP (leitura da Meta, D302).
- Criação rápida: um modelo de LP de segmento, preenchido com o catálogo e revisado pela UP (texto inicial pelo Maurício IA).

## 6.4 Portal do cliente da UP

- Com a marca da UP e "com tecnologia NextLevel" no rodapé (Parte 2.3 do racional).
- Aprovar vídeos, ver a agenda, pagar e baixar faturas, ver o relatório do mês e responder o NPS.

---

# 7. Ondas de construção

| Onda | Entrega | Por que nessa ordem |
|---|---|---|
| **Feita (D313)** | Agência, equipe com funções, carteira com contrato, importação, cockpit "Hoje", Master → Agências | Base |
| **Onda 1: a UP rodando** | Cobrança automática (AGF1) e régua (AGF2) · conta Business da UP ligada à agência · catálogo de serviços da UP · site institucional e a **primeira LP de segmento** · **Mesa do Maurício v1** (abrir demanda, etapas, conversa) · linha de base do caso (seção 9) | É o que a UP sente na primeira semana: dinheiro organizado, presença própria e um canal direto com a NextLevel |
| **Onda 2: operação** | Produção do mês (AG3) · agenda de gravação (AG4) · departamentos com fila e capacidade · prazos por etapa | Tira a operação do WhatsApp e mostra o gargalo |
| **Onda 3: cliente avançado** | Serviços do catálogo no contrato · consumo do mês · saúde do cliente · linha do tempo · onboarding · portal do cliente (AG5) com aprovação e faturas · relatório mensal (AG7) | Segura a carteira e prepara a ampliação |
| **Onda 4: comercial e marketing completos** | Funil comercial · propostas com link e contrato assinado · LPs de todos os segmentos · indicação · resultados de anúncio por LP | A UP cresce com o sistema |
| **Onda 5: janela NextLevel completa** | Soluções sugeridas por cliente · "Usar no site/LP" (AG6) · ganhos da parceria · cockpit do Maurício completo (Parte 4) | A parceria rende para os dois |
| **Onda 6: o modelo vira produto** | Página "NextLevel Business para Agências" · caso UP publicado (com aceite) · segunda agência entrando com o mesmo sistema | Vender o NextLevel Business para outras empresas |

---

# 8. O que ficou esquecido: sugestões de dono

1. **Direito de imagem em toda gravação.** Agência de conteúdo grava pessoas: cliente, funcionários, alunos, pacientes. Um termo de autorização de uso de imagem por gravação, assinado no celular no dia (reaproveita a assinatura de contratos), protege a UP e o cliente. Para clínicas e saúde, isso é ainda mais sensível.
2. **Acessos dos clientes guardados com segurança.** Agências recebem senha de Instagram, Meta Ads e Google. Guardar num cofre criptografado (`encryptSecret`), com quem viu e quando, em vez de planilha ou WhatsApp. Melhor ainda: acesso de parceiro do Business Manager da Meta, sem senha.
3. **Termo da Agência Fundadora com mão dupla:** SLA da mesa do Maurício, confidencialidade, **não aliciamento de equipe e de clientes dos dois lados**, dados exportáveis se a parceria acabar e LGPD (quem é controlador e operador).
4. **Ritual da parceria:** conversa semanal de 30 minutos Léo e Maurício com os dois cockpits abertos, e uma revisão mensal de resultados. Sem ritual, parceria esfria.
5. **Linha de base no dia zero:** quanto tempo a UP leva para cobrar, quantos atrasam, quanto demora uma aprovação, quantos clientes saíram nos últimos 6 meses, de onde vêm os clientes novos. Sem isso, não há caso de sucesso para vender.
6. **Biblioteca de roteiros e pautas por segmento:** o que funciona numa clínica serve para outra. O Maurício IA sugere roteiros a partir da pauta e dos melhores vídeos; a Sirlene revisa. A UP produz mais com a mesma equipe.
7. **Calendário de datas por segmento:** Dia das Mães para varejo, campanhas de verão para academia, Black Friday. O sistema lembra a UP de vender campanhas extras na hora certa.
8. **Margem por cliente:** horas e diárias gastas x valor do contrato. Mostra cliente que dá prejuízo e ajuda a precificar o próximo.
9. **Nota fiscal de serviço automática:** é o pedido mais comum de agência depois da cobrança. Entra logo depois da cobrança.
10. **Armazenamento de vídeo:** brutos e finais pesam. No começo, link do Drive ou outro serviço + capa; depois, armazenamento próprio com limite por plano (decisão de custo do dono).
11. **Aplicativo de campo para gravação** (painel instalável no celular): agenda do dia, endereço, roteiro, checklist, termo de imagem e foto de bastidor para o portfólio.
12. **Treinamento da equipe da UP** na tela Aprender (base de conhecimento ao vivo, D264): trilha "Painel da Agência" para cada função.
13. **Grupo de WhatsApp por cliente → caixa única:** a conversa com o cliente passa a ter registro na ficha. Depois, o atendimento ao vivo que já existe para lojas pode servir à agência.
14. **Selo "Agência parceira NextLevel"** no site da UP e diretório público de agências parceiras (com aceite). É autoridade para a UP e vitrine para a NextLevel.
15. **Segunda agência na fila:** escolher já a próxima agência para entrar quando a Onda 2 estiver pronta. Prova que o sistema não é "feito sob medida para a UP".
16. **Indicador de dependência:** acompanhar quanto da receita nova da NextLevel vem da UP, para a parceria crescer sem a NextLevel depender de um parceiro só.
17. **Saída sem trauma:** exportação da carteira, contratos e histórico em planilha a qualquer momento. Dá confiança para entrar.

---

# 9. Como medir e transformar em caso de sucesso

| Indicador | Linha de base (semana 0) | Meta de 90 dias (sugestão) | Onde se mede |
|---|---|---|---|
| Clientes cobrados pelo sistema | 0 | Toda a carteira ativa | Financeiro da agência |
| Faturas pagas até o vencimento | Medir na semana 0 | Acima da linha de base | Cobrança |
| Horas por mês da equipe cobrando | Perguntar na semana 0 | Menor que a linha de base | Conversa semanal |
| Tempo médio de aprovação de um vídeo | Medir | Menor que a linha de base | Portal do cliente |
| Contatos novos da UP pelo site e LPs | 0 (sem site medido) | Crescente mês a mês | Funil comercial |
| Clientes novos fechados pela UP | Medir | Acima da linha de base | Funil comercial |
| Clientes da UP com solução NextLevel | 0 | Definir com o dono | Mesa e soluções |
| Clientes que saíram no trimestre | Medir os últimos 6 meses | Menor que a linha de base | Carteira |

**Como vira página pública:** com o aceite da UP, a página do caso mostra só números medidos, com o período e a fonte ("de agosto a novembro, medido no painel"), depoimento real do Léo em vídeo gravado pela própria UP e telas reais do sistema.

---

# 10. Prompt engenheiro mestre

> Copie o bloco abaixo inteiro numa sessão de trabalho. Ele é autossuficiente.

```text
Você é o engenheiro responsável por transformar o Painel da Agência da NextLevel no sistema operacional completo da
agência UP (Agência Fundadora) e no produto "NextLevel Business para Agências". Trabalhe no repositório da NextLevel
Commerce, seguindo CLAUDE.md e AGENTS.md à risca.

LEIA ANTES DE QUALQUER CÓDIGO
- CLAUDE.md, AGENTS.md, docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md (autoridade máxima).
- docs/prompts/up-nextlevel-sistema-da-agencia.md (este racional: Partes 1 a 9).
- docs/prompts/agencias-parceiras-up-piloto.md (Parte 8: cobrança automática, dinheiro direto na conta da agência,
  Agência Fundadora) e docs/prompts/agencias-up-perguntas-estrategicas.md.
- Decisões D304 a D313 em docs/design/DECISIONS.md (NextLevel Business, Site, contatos, planos, D312 e D313).
- Código já feito (D313): src/lib/agencias/{acesso,agencias,clientes}.ts, src/app/agencia/**, src/app/master/agencias/**,
  src/app/actions/agencias.ts, src/db/demo-agencia.ts, tests/agencias.test.ts, e2e/agencias.mjs, migração 0104.
- Skills: painel-interno (toda tela autenticada), pagina-de-vendas (páginas públicas), qa-visual (capturas 360/768/1440),
  desempenho (antes de abrir para a UP), nova-migracao (toda mudança de schema), e2e-demo, publicar.

REGRAS QUE NÃO QUEBRAM
1. Reaproveitar antes de criar. Mapa obrigatório:
   - site e LPs da UP = caminho Site do NextLevel Business (paginas_site, modelos, página de campanha, domínio próprio);
   - catálogo da UP = servicos_negocio da conta Business da UP;
   - CRM e funil = contatos_negocio (NB3) + canalDe + links_rastreados + conversões (TR1 a TR6, D290 a D302);
   - propostas e contratos = proposals/corporate_quotes e o fluxo de contratos com assinatura no painel;
   - Mesa do Maurício = services + service_orders + service_messages (estender, nunca duplicar);
   - um login para o Léo nos dois perfis = conta do grupo (D141);
   - comissão = Programa de Parceiros (D260, D263); cobrança = camada de meios de pagamento (src/lib/payments/gateway.ts).
2. Visual da NextLevel Commerce em todo painel (pedido do dono, D313): casca do lojista (faixa roxa, marcaCliente),
   ds-hero, ds-card, Kpi de src/components/commerce/commerce-home.tsx, fila do dia. Nada de visual novo.
3. Uma agência nunca lê dados de outra; cada função vê só o que é dela (src/lib/agencias/acesso.ts: pode,
   podeVerCliente); permissões no servidor; o cliente da agência autoriza o acesso aos dados dele.
4. Dinheiro do cliente da agência vai direto para a conta de pagamento da agência; a NextLevel nunca guarda esse
   dinheiro. Pagamento só vale conferido na API; idempotência por dedupeKey; tokens com encryptSecret.
5. Valores em centavos; regras e preços em platform_settings/tabela de preços do Master; nenhum preço no código.
6. Toda página com banco: export const dynamic = "force-dynamic". Toda onda atrás de chave (AGENCIAS_V1 + chave da
   onda); desligada, nada muda para ninguém.
7. Sem promessa de ganho, sem número, logo ou depoimento inventado. Caso UP público só com números medidos e aceite.
8. Acessibilidade AA, axe sem violações graves, sem rolagem horizontal em 360 px.
9. Migração: alterou src/db/schema.ts → npx drizzle-kit generate --name <assunto>; nunca editar migração publicada.
10. Custo do Render: commit só de documentos com [skip render]; no máximo 3 publicações de código por dia.

PROTOCOLO DE CADA FASE ("relatar primeiro")
a) Diagnóstico curto: o que já existe para a fase, o que estender, o que é novo, riscos. Se algo conflitar com a
   Constituição ou com uma decisão, pare e explique ao dono.
b) Construa no domínio (src/lib/agencias/* ou o módulo existente), ações com runAction, telas por último.
c) Testes do comportamento novo (vitest) com isolamento entre agências e permissões por função; e2e no navegador.
d) Prints reais (Playwright, deviceScaleFactor 2) da principal tela, em 1440 e 360 px; confira cada print antes de
   mandar e corrija o que estiver feio ou quebrado.
e) Registre a decisão em docs/design/DECISIONS.md (frente [E-commerce]), cite na base de conhecimento
   (docs/conhecimento/BC0-INVENTARIO.md), rode node scripts/gerar-novidades.mjs.
f) Durante o trabalho: tipos, lint e testes dos arquivos mexidos. No fim da rodada: bateria completa e npm run build.
g) Relatório do dia com "Esforço do dia por frente" e o que o dono precisa fazer (chaves, contas, conteúdo).

FASES (na ordem; cada uma entrega valor sozinha)

ONDA 1: A UP RODANDO
- AGF1 Cobrança automática: conectar o meio de pagamento da agência (Mercado Pago ou Pagar.me, token cifrado); fatura
  recorrente gerada pelo contrato de cada cliente (agencia_clientes.valorMensalCents, diaVencimento) + avulsos; Pix e
  cartão; baixa automática conferida na API; o cliente paga direto na conta da agência; extrato do mês.
  Aceite: fatura não duplica no mesmo mês; aviso repetido não dá baixa duas vezes; agência A não vê fatura da B;
  função sem valores não vê fatura; token nunca aparece.
- AGF2 Régua e inadimplência: mensagens antes e depois do vencimento (e-mail + WhatsApp com mensagem pronta), multa,
  juros e desconto configuráveis pela agência, painel de atrasados, regra opcional "pausar produção após X dias".
  Aceite: a régua para quando paga; respeita horário comercial; números do cockpit batem com as faturas.
- UP1 Conta Business da UP ligada à agência: criar ou ligar a conta (caminho Site) à agência; conta do grupo para o
  Léo trocar de perfil sem novo login; catálogo de serviços da UP (servicos_negocio) visível no Painel da Agência.
  Aceite: só o administrador liga; o catálogo é um só para site e contratos.
- UP2 Site da UP e a primeira LP de segmento: modelo institucional de agência (Início, Serviços, Portfólio, Sobre,
  Contato) e modelo de LP de segmento (dor, cases autorizados, pacote, perguntas, formulário com serviço e segmento);
  origem, Pixel e API de conversões ligados; contatos no CRM da UP. Use a skill pagina-de-vendas: entregue o
  manifesto de ativos para a UP gravar; sem foto genérica.
- MESA1 Mesa do Maurício v1: a agência abre demanda (solução, cliente da carteira ou a própria UP, briefing, anexos
  por link, prazo); etapas recebida → em análise → orçamento enviado → aprovada → em produção → em revisão →
  entregue; conversa na demanda; aprovação do orçamento em um clique; avisos. No Master, a fila da mesa com
  responsável, previsão e atraso. Estender services/service_orders/service_messages.
  Aceite: a agência só vê as próprias demandas; o Master vê todas; mudança de etapa notifica e fica na linha do tempo.
- BASE Linha de base do caso: tela no Master → Agências → UP para registrar os números da semana 0 (Parte 9).

ONDA 2: OPERAÇÃO
- AG3 Produção do mês (peças por cliente, etapas, quadro/lista/calendário, versões); AG4 agenda de gravação
  (equipe escalada, checklist, choque de agenda, confirmação por WhatsApp); DEP departamentos (fila, capacidade x
  vendido, prazos por etapa, retrabalho). Aceite: cada função vê só a fila dela; o gargalo aparece antes do atraso.

ONDA 3: CLIENTE AVANÇADO
- CLI1 itens do contrato a partir do catálogo e consumo do mês; CLI2 saúde do cliente, linha do tempo, renovação e
  ampliação, onboarding com cofre de acessos (encryptSecret, registro de quem viu); AG5 portal do cliente com a marca
  da agência (aprovação, faturas, relatório, NPS); AG7 relatório mensal sem promessa de ganho;
  IMG termo de uso de imagem por gravação, assinado no celular.

ONDA 4: COMERCIAL E MARKETING COMPLETOS
- COM1 funil comercial da agência (etapas, origem, motivo de perda); COM2 propostas com link → contrato assinado →
  cliente na carteira → primeira fatura, sem redigitar; MKT1 LPs de todos os segmentos, indicação de clientes,
  resultado de anúncio por LP; MKT2 modelos de texto pelo Maurício IA a partir do catálogo (a agência revisa).

ONDA 5: JANELA NEXTLEVEL COMPLETA
- NL1 soluções sugeridas por cliente da carteira; AG6 "Usar no site/LP" (peça aprovada vira mídia da página do
  cliente); NL2 ganhos da parceria (comissões D260); NL3 cockpit do Maurício completo (Parte 4 do racional).

ONDA 6: O MODELO VIRA PRODUTO
- PUB1 página pública "NextLevel Business para Agências" (/agencias), atrás de chave, com telas reais; PUB2 caso UP
  (só com números medidos e aceite); PUB3 segunda agência entrando sem nenhuma mudança de código feita "para a UP".

AO TERMINAR CADA ONDA
- Prints conferidos, testes, build, decisão registrada, base de conhecimento, relatório em docs/relatorios/, e a lista
  do que o dono precisa fazer (ligar chaves no Render, conectar conta de pagamento, receber ativos da UP).
```
