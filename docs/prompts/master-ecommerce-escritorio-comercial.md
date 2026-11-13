# Master da NextLevel Commerce: auditoria profunda e prompt engenheiro mestre

> **Pedido do dono (2026-10-29):** "o Master está muito confuso, é muita coisa. Se coloca no meu lugar: o que eu preciso ver, o que torna a gestão mais produtiva, o que merece atenção em tempo real. Como se fosse o meu departamento comercial: um CRM ao vivo e turbo para trazer muitos clientes rápido. Logo vão aparecer clientes reais: como facilitar o suporte? Parece haver coisas duplicadas. Vamos trancar as outras marcas e falar só do painel da NextLevel Commerce. Deixe preparado para aplicar depois nos painéis de clientes e nas outras marcas."
>
> **Método:** skills `repo-auditor` (o que existe de fato) e `ux-flow-auditor` (a jornada do dono). As 57 telas do Master e do console E-commerce foram percorridas no navegador com `master@nextlevel.demo` e o filtro "E-commerce", e o código de cada uma foi lido. Neste documento:
> - **Fato** é o que foi visto na tela ou no código;
> - **Inferência** é a conclusão tirada desses fatos;
> - **Proposta** é a recomendação.
>
> **Resumo em uma linha:** o sistema já tem quase todas as peças de um escritório comercial forte. Elas estão espalhadas em **57 telas, 3 listas de interessados, 3 lugares de assinatura e 2 menus diferentes para a mesma marca**, com números que não batem entre si. A proposta não pede módulo grande novo. Ela **junta tudo em 7 áreas, uma tela "Agora" ao vivo, um funil único do visitante ao pagante e uma caixa de atendimento única**, reaproveitando o que existe.

---

## Parte 1. Diagnóstico: o que temos hoje

### 1.1 Números do problema
| Medida | Hoje |
|---|---|
| Telas no Master + console E-commerce | **57** (50 em `/master`, 7 em `/commerce`) |
| Itens no menu "Todas as marcas" | **26** |
| Itens no menu com o filtro "E-commerce" | 9. Ao clicar em "NextLevel Commerce", o menu inteiro troca por **outro menu de 7 itens** (console E-commerce, com "Voltar ao Master") |
| Abas no Financeiro NextLevel | **16** |
| Lugares que mostram "interessados" | **3**: `/commerce/leads`, `/master/crm?tab=interessados` e `/master/ia` (conversas) |
| Lugares que mostram "assinaturas" | **3**: `/commerce/plans`, `/master/financeiro/assinaturas` e `/master/plans` (sistema antigo do SuperDrop) |
| Lugares que mostram "saúde do sistema" | **5**: erros, integridade, qualidade, `/commerce/settings` e a prontidão em `/master/settings` |
| Canal de ajuda do lojista dentro do sistema | **Nenhum**: só um link de WhatsApp. A conversa não fica registrada no sistema |

### 1.2 Mapa de duplicidades (fato)
| Assunto | Telas que fazem a mesma coisa (ou quase) | Observação |
|---|---|---|
| **Visão geral** | `/master` (Dashboard), `/commerce` (Visão geral), `/master/marcas/commerce`, `/master/ecossistema` (Torre), `/master/mapa`, `/master/summary` (Resumo do dia) | Seis "visões gerais". O Dashboard **ignora o filtro "Vendo: E-commerce"** e continua mostrando SuperDrop, Brás, Creators e China |
| **Interessados e CRM** | `/commerce/leads` (formulário, só E-commerce), `/master/crm?tab=interessados` (o **mesmo** formulário, todas as marcas), `/master/ia` (conversas ao vivo do Maurício), o funil em `/commerce` (lojas paradas) e `/master/crm` (pedidos da Loja NextLevel) | O visitante que conversa, o que preenche o formulário e o que cria a conta estão em **três lugares sem ligação**. Ninguém vê a pessoa inteira |
| **Lojas** | `/master/stores` e `/commerce/stores` | Com o filtro E-commerce, `/master/stores` ainda mostra conceitos do SuperDrop ("Drop manual", "Loja SuperDrop", "Saldo agregado") |
| **Pedidos** | `/master/orders` e `/commerce/orders` | Com o filtro E-commerce, `/master/orders` mostra "Comissão do fornecedor", "Margem lojistas" e "Pedidos dos fornecedores", que não existem na E-commerce |
| **Assinaturas e receita** | `/commerce/plans` (cobranças + o que cada plano libera), `/master/financeiro/assinaturas` (contratos), `/master/financeiro` (visão executiva), `/master/office` (escritório virtual) e `/master/plans` (legado SuperDrop) | Três fontes de dados (veja 1.3) |
| **Saúde e configuração** | `/master/errors`, `/master/integridade`, `/master/qualidade`, `/commerce/settings`, `/master/settings` | Coisa de técnico na frente do dono. Os bloqueios reais ("Mercado Pago da NextLevel", "rotinas automáticas", "modo demonstração") ficam escondidos dentro delas |
| **Financeiro** | 16 abas: Visão, Preços do grupo, Descoberta, Proposta, Experimentos, Catálogo e preços, Ofertas e comissões, Assinaturas, Pagamentos, Propostas e entregas, Parceiros, Gateways, SuperDrop, Operação SuperDrop, Jornada, Auditoria | Para a E-commerce, o dono usa no dia a dia **3 ou 4** delas |
| **Menu** | Menu do Master + menu do console E-commerce (`COMMERCE_ADMIN_NAV`) | Duas cascas para a mesma marca. Entrar e sair do console desorienta |

### 1.3 Números que não batem (fato, com os dados de demonstração)
Isso mina a confiança no painel. É o primeiro problema a resolver.

| Pergunta do dono | Resposta em cada tela |
|---|---|
| Quantos lojistas pagam? | `/commerce`: "**Assinantes 2**". Funil na mesma tela: "**Hoje: 0** pagantes". `/master/financeiro/assinaturas`: "**Ativas 0**". `/commerce/stores`: as duas lojas como "**Pago · 31 dias**" |
| Quanto as lojas venderam? | Dashboard: "R$ 96,1 mil · 119 pedidos" (desde o início). `/commerce`: "R$ 49,6 mil · 63 pedidos" (no mês). `/master/orders` com o filtro: "R$ 59,7 mil · 100 pedidos" (competência) |
| Quanto a NextLevel recebe? | `/commerce`: "Receita SaaS R$ 0,00". Dashboard: "Receita NextLevel R$ 1.788,00". `/master/office`: "Recorrência R$ 294,00". `/master/financeiro`: "MRR R$ 97,…" |

**Causa (inferência confirmada no código):**
- **"Está pagando?" tem três fontes:**
  - o acesso da loja (`store-access`, que dá "Pago 31 dias" por meses concedidos);
  - as cobranças `finance_invoices` do tipo `STORE_PLAN` (console E-commerce);
  - o contrato `nl_subscriptions` (financeiro e funil).
- **Cada tela usa um período diferente** (desde o início, mês corrente, competência) e o rótulo não diz qual é.

### 1.4 O que está bom e deve ser preservado (fato)
- **Funil de ativação** em `/commerce` (`funilEcommerce`): os 6 degraus, "onde cada loja parou" e o próximo passo. É o embrião do CRM certo.
- **Central da IA** (`/master/ia`, D197):
  - conversas ao vivo;
  - "assumir", "devolver", notas, ganha e perdida;
  - `ia_conversas` já tem `canal: HOME | PAINEL | LOJA`, ou seja, já está pronta para receber o lojista.
- **Modo suporte** (`/master/clientes`, AD2): "Ver como cliente", com motivo e registro de auditoria.
- **Programa de Parceiros**: completo (comissões, saques, antifraude).
- **Ofertas, preços versionados e checkout corporativo idempotente**: a base do que se vende está sólida.
- **"O que cada plano libera"** em `/commerce/plans`: uma configuração útil, só que no lugar errado.
- **Casca nova** (D198): faixa, moldura e "Agente".

### 1.5 O que falta para operar com clientes reais (inferência)
1. **Uma tela "Agora".** Hoje nenhuma tela responde "o que eu faço nos próximos 15 minutos?". Os alertas do Dashboard (`buildAlerts`) falam de fornecedores e recargas, coisas do SuperDrop.
2. **Ver a pessoa inteira.** Hoje não dá para ver numa ficha só: conversou com o Maurício, deixou o WhatsApp, criou a conta, parou em "conectar Mercado Pago", está no teste e vence em 2 dias.
3. **Próxima ação e responsável.** Nada diz "quem da equipe cuida deste lojista e o que fazer amanhã". As notas existem só na conversa e no interessado, separadas.
4. **Suporte dentro do painel do lojista.** Com clientes reais, o WhatsApp pessoal vira o "sistema de chamados". O histórico se perde e a equipe não sabe quem já respondeu.
5. **Avisos de verdade.** O sino do Master mostra atividades da plataforma, com leitura guardada **só no navegador**. Não há aviso de "conversa nova", "cadastro novo" ou "pagamento falhou".
6. **Metas visíveis.** "Meta: 10 lojistas pagantes" está escrita fixa no texto do funil.

---

## Parte 2. No lugar do dono: o que precisa ver

### 2.1 As três perguntas de todo dia
1. **"Quem eu preciso atender agora?"**: atendimento e vendas quentes.
2. **"Estamos crescendo?"**: funil, pagantes, receita e meta.
3. **"Tem algo quebrado que impede alguém de vender ou pagar?"**: saúde que importa ao negócio, não ao técnico.

### 2.2 O que merece atenção em tempo real (em ordem de prioridade)
| # | Sinal | Por que é urgente | Ação de um clique |
|---|---|---|---|
| 1 | **Conversa esperando resposta** (visitante ou lojista), com o tempo de espera | Lead quente esfria em minutos, e lojista sem resposta cancela | Abrir a conversa e assumir |
| 2 | **Cadastro novo sem contato** (conta criada nas últimas 24 h) | Melhor momento de ajudar a ativar | WhatsApp com mensagem pronta e "marcar contatado" |
| 3 | **Teste vencendo em até 3 dias sem pagamento** | É a conversão em si | Mensagem pronta com a oferta do momento e o link de pagamento |
| 4 | **Ativação parada há mais de 48 h** (degrau do funil) | Onde a maioria desiste | "Ver como lojista", ajudar no passo e registrar |
| 5 | **Cobrança vencida ou pagamento recusado** | Receita em risco | Reenviar a cobrança e falar com o lojista |
| 6 | **Loja impedida de vender** (Mercado Pago desconectado, checkout com erro, loja fora do ar, domínio quebrado) | Perde venda dele e confiança em nós | Abrir a loja em modo suporte |
| 7 | **Primeira venda de uma loja** | Momento de celebrar e oferecer o próximo plano | Parabéns pronto e sugestão de plano |
| 8 | **Pedido de cancelamento ou plano rebaixado** | Evitar perda | Ligar ou oferecer ajuda |

### 2.3 O CRM "turbo" (o departamento comercial)
- **Um funil só, do visitante ao pagante**, com as etapas avançando sozinhas pelos eventos do sistema, sem ninguém digitar:
  - **Visitante** (conversou com o Maurício)
  - → **Contato** (deixou nome e WhatsApp ou preencheu o formulário)
  - → **Conta criada** (teste)
  - → **Ativando** (cadastrou produto, publicou, conectou o Mercado Pago)
  - → **Vendendo** (primeira venda)
  - → **Pagante**
  - → **Em risco** (cobrança vencida, sem acesso há 7 dias, sem vendas há 30 dias)
  - → **Perdido**
- **Ficha do cliente (360):**
  - contato, origem (UTM ou parceiro) e faturamento informado;
  - plano e situação de pagamento, com uma fonte só;
  - degrau do funil e saúde da loja;
  - **linha do tempo única**: conversas, notas, cobranças, marcos da loja e acessos de suporte;
  - **responsável** e **próxima ação com prazo**;
  - botões: WhatsApp (mensagem pronta), "Ver como lojista" e reenviar cobrança.
- **Temperatura (pontuação simples, explicável):**
  - faturamento informado + segmento + engajamento (mensagens, degraus vencidos) + origem;
  - a lista ordena por quem tem mais chance de pagar;
  - sem "IA mágica": a regra fica escrita e editável no Master (`platform_settings`).
- **Respostas prontas:** modelos de mensagem por momento (boas-vindas, ajuda no Mercado Pago, teste acabando, cobrança vencida, primeira venda), com variáveis (nome, loja, link). Funcionam por `wa.me` (sem integração avançada de WhatsApp, como o dono pediu) e dentro do chat do sistema.
- **Visão da equipe:** quem está com quantos clientes, tempo médio de primeira resposta e conversões da semana.

### 2.4 O suporte com clientes reais
- **Botão "Ajuda" dentro do painel do lojista:**
  - abre o **mesmo chat** (o Maurício responde o que sabe e chama a equipe quando precisa);
  - a conversa entra na **mesma caixa de atendimento** do Master, com `canal: PAINEL`, já ligada à loja;
  - o lojista vê "a equipe está respondendo" e o histórico fica guardado.
- **Caixa de atendimento única:**
  - visitantes da home e lojistas em abas ou filtros;
  - fila por tempo de espera;
  - "Assumir", respostas prontas, notas internas;
  - "Ver como lojista" ao lado da conversa;
  - encerrar com motivo (dúvida, problema, venda).
- **Prazo de resposta visível:** o relógio fica amarelo em 5 min e vermelho em 15 min (valores editáveis).
- **Avisos com som** (a "Subida", racional de sons): para conversa nova e cadastro novo, com a leitura guardada no servidor.
- **WhatsApp continua:** é o botão de fuga (o dono decidiu deixar a integração avançada para depois). O sistema registra "falou pelo WhatsApp" com um clique, para não perder o histórico.

---

## Parte 3. A proposta: o Master da E-commerce em 7 áreas

### 3.1 Trancar as outras marcas (sem apagar nada)
- **Uma configuração** em `platform_settings` (`master.marcasAtivas`, começando com `["NEXTLEVEL_COMMERCE"]`).
- **O Master entra direto no modo E-commerce.** O seletor "Vendo:" some enquanto só houver uma marca ativa.
- **Itens de outras marcas somem do menu.** As rotas continuam existindo, só com acesso direto. As ferramentas de grupo (equipe, erros) vão para "Sistema".
- **Para destravar uma marca**, basta incluí-la na lista. Nada é apagado e nenhuma tela do SuperDrop muda de comportamento: ele está em produção.

### 3.2 Menu novo (7 itens, um só menu, sem "console" separado)
| Área | O que reúne (telas de hoje) | Pergunta que responde |
|---|---|---|
| **1. Agora** | Nova (substitui Dashboard, Visão geral, Resumo do dia e Torre na rotina). Mostra a fila do item 2.2, contadores ao vivo, a meta do mês e o funil compacto | "O que eu faço agora?" |
| **2. Comercial** | Funil único (2.3) em quadro e em lista; interessados (`brand_leads`) + conversas (`ia_conversas`) + contas (`stores`) num só lugar; parceiros como origem | "Quem está entrando e quem está perto de pagar?" |
| **3. Atendimento** | Caixa única: Central da IA (`/master/ia`) + Ajuda do lojista + respostas prontas | "Quem está esperando resposta?" |
| **4. Lojistas** | Lista de lojistas com situação, plano, degrau, saúde, responsável e "Ver como lojista" (une `/commerce/stores`, `/master/stores` filtrado e `/master/clientes`); **ficha 360** | "Como está cada cliente?" |
| **5. Receita** | Assinaturas (contrato + cobranças numa visão só), vencidas, MRR, cancelamentos, "o que cada plano libera"; atalhos para Ofertas e Preços | "Quanto entra e o que está em risco?" |
| **6. Crescimento** | Parceiros, ofertas e cupons de entrada, página pública e o Maurício vendedor (ajustes), temas e templates | "O que eu ligo para vender mais?" |
| **7. Sistema** | Prontidão (os bloqueios reais no topo), configurações, equipe e permissões, erros, integridade, qualidade, financeiro avançado (as abas que não são do dia a dia) | "Está tudo ligado?" |

> A Loja NextLevel (serviços e o CRM de pedidos de serviço) entra em **Receita → Serviços**. Para a E-commerce, ela é receita extra, e não um item de primeiro nível.

### 3.3 Destino de cada tela de hoje (nada se perde)
| Tela de hoje | Destino |
|---|---|
| `/master` (Dashboard) | **Agora** (no modo E-commerce); a visão de grupo volta quando houver mais de uma marca ativa |
| `/commerce` | **Agora** (o funil vai junto) |
| `/commerce/leads`, `/master/crm?tab=interessados` | **Comercial** |
| `/master/ia` | **Atendimento** (os ajustes vão para **Crescimento → Maurício**) |
| `/commerce/stores`, `/master/stores`, `/master/clientes`, `/master/marcas/commerce` | **Lojistas** |
| `/commerce/orders`, `/master/orders` | **Lojistas → Pedidos** (monitoramento, sem conceitos do SuperDrop) |
| `/commerce/catalog` | **Lojistas → Produtos publicados** |
| `/commerce/plans`, `/master/financeiro/assinaturas`, `/master/financeiro`, `/master/office`, `/master/financeiro/pagamentos` | **Receita** |
| `/master/services`, `/master/crm` (pedidos da Loja NextLevel), `/master/financeiro/propostas` | **Receita → Serviços** |
| `/master/financeiro/ofertas`, `/catalogo`, `/precos`, `/master/partners`, `/master/templates` | **Crescimento** |
| `/master/settings`, `/commerce/settings`, `/master/equipe`, `/errors`, `/integridade`, `/qualidade`, demais abas do financeiro | **Sistema** |
| `/master/summary` | Vira o e-mail diário + o resumo no topo de **Agora** |
| `/master/mapa`, `/master/ecossistema` | **Sistema → Grupo** (voltam ao primeiro plano quando houver mais marcas) |
| `/master/plans`, `/suppliers`, `/networks`, `/catalog`, `/financeiro/operacao`, `/financeiro/superdrop` | SuperDrop: ficam fora do menu enquanto a marca estiver trancada |

As rotas antigas **redirecionam** para a área nova durante um ciclo e só depois saem do código.

### 3.4 Uma fonte de verdade para "situação comercial"
- **Função de domínio única:** `situacaoComercial(store)`, em `src/lib/domain/`. Ela responde:
  - `etapa` (degrau do funil);
  - `pagamento`, com um destes valores: `teste` | `pagante` | `vencido` | `cancelado` | `cortesia`;
  - `plano`;
  - `venceEm`;
  - `motivo`.
- **Regra:** o contrato (`nl_subscriptions`) manda. As cobranças (`finance_invoices` `STORE_PLAN`) explicam. O acesso (`store-access`) só vale como **cortesia** quando não houver contrato. Deve ficar registrada numa decisão nova.
- **Todas as telas** (Agora, Lojistas, Receita, funil) passam a usar essa função. Sai o "Assinantes 2" contra "0 pagantes".
- **Todo número diz o período:** "hoje", "no mês" ou "desde o início", sempre escrito no rótulo.

### 3.5 Tabelas: estender, não criar (regra anti-duplicação)
| Precisa de | Usa |
|---|---|
| Conversas de visitante e de lojista | `ia_conversas` (já tem `canal PAINEL`); acrescentar `storeId` anulável |
| Interessado do formulário | `brand_leads`; acrescentar `conversaId`, `storeId`, `responsavelId`, `proximaAcao`, `proximaAcaoEm` |
| Linha do tempo | `activities` (já existe) + mensagens + cobranças, montada na leitura |
| Responsável e próxima ação **da loja** | **Única tabela nova recomendada:** `crm_acompanhamento` (`storeId` ou `leadId`, `responsavelId`, `proximaAcao`, `prazo`, `temperatura`, `estagioManual` opcional), para não espalhar colunas em `stores` |
| Respostas prontas, prazos de resposta, metas, pontuação | `platform_settings` (chave `comercial`) |
| Leitura de avisos no servidor | Tabela pequena `avisos_lidos` (`userId`, `lastSeenAt`) ou coluna no usuário (fatia C2 já prevista) |

### 3.6 Preparado para as outras marcas e para os painéis dos clientes
- **Contrato por marca.** As áreas leem de um provedor da marca:
  - interface `ModuloMaster { agora(), funil(), situacao(), alertas() }`;
  - a E-commerce implementa o provedor agora;
  - SuperDrop, Brás e Cargas implementam depois, sem mexer nas telas.
- **Componentes reaproveitáveis:**
  - caixa de atendimento (`Inbox`);
  - linha do tempo (`LinhaDoTempo`);
  - ficha 360 (`FichaCliente`);
  - fila "Agora" (`FilaAgora`, mesma anatomia da `FilaItem` do lojista).
  - O painel do lojista usa a mesma caixa para atender os clientes **dele** (pós-venda, D-futura) e a mesma fila.
- **Avisos e sons:** o mesmo serviço para Master e lojista.

---

## Parte 4. Riscos e cuidados
- **SuperDrop em produção:**
  - trancar marcas mexe só no **menu do Master** e nas telas do Master;
  - nenhuma regra do SuperDrop muda;
  - teste de regressão: o lojista e o fornecedor do SuperDrop continuam iguais.
- **Permissões:**
  - Atendimento e Comercial respeitam as funções da equipe (D138: COMERCIAL, SUPORTE);
  - o lojista só vê as conversas dele;
  - um tenant nunca lê outro.
- **Dados pessoais:**
  - WhatsApp e e-mail só aparecem para quem atende;
  - nada em log;
  - mensagens prontas não incluem segredo nenhum.
- **Ao vivo sem pesar:**
  - atualização a cada 10–15 s na tela "Agora" e 3–5 s na conversa aberta (padrão D197);
  - consultas agregadas (uma por bloco, nada dentro de laço);
  - sem serviço pago de tempo real.
- **Números:** cada indicador novo nasce com teste que compara com a fonte única (3.4).

---

## Parte 5. Decisões que dependem do dono (com recomendação)
| # | Pergunta | Recomendação |
|---|---|---|
| 1 | Meta do mês (pagantes e MRR) | Começar com **10 pagantes**, como está no funil, editável no Master |
| 2 | Prazo de resposta (amarelo/vermelho) | **5 e 15 minutos** em horário comercial; fora dele, o Maurício responde e avisa o horário da equipe |
| 3 | Horário da equipe | Seg a sex, 9h–18h (editável) |
| 4 | Quem atende o quê | Funções já existentes: COMERCIAL fica com Comercial e Atendimento de visitantes; SUPORTE fica com a Ajuda de lojistas; o dono vê tudo |
| 5 | "Cortesia" (lojas com acesso dado sem contrato) conta como pagante? | **Não**: aparece separada como "cortesia" |
| 6 | Indique e ganhe para lojistas | Deixar para a fatia de Crescimento (decisão já pendente) |

---

# PROMPT ENGENHEIRO MESTRE: "Escritório E-commerce" no Master

> Cole este bloco numa sessão de trabalho. Execute **uma fase por vez**. Ao fim de cada fase, mostre prints ao dono e publique, seguindo as regras de eficiência do `CLAUDE.md`.

## Contexto obrigatório (ler antes de tudo)
- `CLAUDE.md`, `AGENTS.md`, a Constituição (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`) e `docs/design/DECISIONS.md` (D90, D125, D138, D172, D194–D198).
- Este documento inteiro: o diagnóstico (Parte 1) e a proposta (Partes 2 e 3).
- Skills:
  - `painel-interno` (direção dos painéis);
  - `repo-auditor` antes de cada fase;
  - `qa-visual` (prints);
  - `publicar` ao fim;
  - `nova-migracao` se a fase mexer no banco.

## Objetivo
Transformar o Master, no modo NextLevel Commerce, num **escritório comercial ao vivo**:
- **7 áreas:** Agora, Comercial, Atendimento, Lojistas, Receita, Crescimento, Sistema;
- **um funil único** do visitante ao pagante;
- **uma ficha 360** por cliente;
- **uma caixa de atendimento** que também recebe o lojista;
- **números que batem**, a partir de uma fonte de verdade.

As outras marcas ficam trancadas por configuração, e tudo é construído para ser ligado nelas depois.

## Regras inegociáveis
1. **Estender, não duplicar** (Parte 3.5):
   - a única tabela nova permitida sem nova decisão é `crm_acompanhamento` (mais `avisos_lidos` se a fatia de avisos entrar);
   - toda regra configurável vai para `platform_settings`.
2. **SuperDrop não muda de comportamento.** Teste de regressão do menu e das telas do lojista e do fornecedor SuperDrop em cada fase.
3. **Permissões no servidor:**
   - `requireRole`, `requireMasterFn(actor, ["COMERCIAL","SUPORTE"])`, `assertCanAccess`;
   - o lojista só vê as conversas da loja dele.
4. **Toda ação** passa por `src/lib/domain/*` e `runAction`. Valores em centavos. Página com banco tem `export const dynamic = "force-dynamic"`.
5. **Nada se perde:**
   - rotas antigas redirecionam para a área nova (permanentRedirect) durante um ciclo;
   - remover a tela antiga só numa fase posterior, com teste provando o redirecionamento.
6. **Cada número diz o período no rótulo** e vem de função testada.
7. **Eficiência** (`CLAUDE.md`):
   - entender a causa antes de mexer;
   - tipos + lint sempre;
   - testes do que mudou;
   - **um** build por fase (mudança grande);
   - prints da produção ao fim;
   - mensagens curtas ao dono.
8. **Acessibilidade AA:** sem rolagem horizontal em 360 px; foco visível; avisos de "ao vivo" com `aria-live="polite"`.

## Fases

### F0. Base de verdade e trava de marcas (pequena, primeiro)
**O que fazer:**
- `situacaoComercial(store)` e `situacoesComerciais(db, storeIds)` (em lote) em `src/lib/domain/situacao-comercial.ts`, com a regra da Parte 3.4.
- Trocar as contas de "pagante", "assinantes", "em teste" e "receita SaaS" em `/commerce`, no funil, em `/commerce/stores` e em `/master/financeiro/assinaturas` para usar a função.
- `master.marcasAtivas` em `platform_settings`:
  - `navDoMasterPorMarca` respeita a lista;
  - o seletor "Vendo:" some com uma marca só;
  - o Dashboard redireciona para a área Agora no modo E-commerce.
- Decisão nova em `DECISIONS.md`.

**Testes:**
- `tests/situacao-comercial.test.ts`, com os casos:
  - teste;
  - pagante mensal;
  - pagante anual;
  - vencido;
  - cancelado;
  - cortesia sem contrato;
  - contrato + cobrança atrasada.
- Teste de menu com a marca trancada.
- O SuperDrop continua igual.

**Aceite:** com a demonstração, "Assinantes", "pagantes", "Ativas" e a coluna de acesso dizem a mesma coisa.

### F1. Menu novo e uma casca só
**O que fazer:**
- `MASTER_ECOMMERCE_NAV` com as 7 áreas (Parte 3.2).
- Fim do menu separado `COMMERCE_ADMIN_NAV` (o console E-commerce vira as áreas).
- Redirecionamentos da Parte 3.3.
- Área **Sistema** com abas: Prontidão (bloqueios reais no topo), Configurações, Equipe, Saúde (erros, integridade, qualidade), Financeiro avançado.
- O Financeiro mostra 4 abas no modo E-commerce: Visão, Assinaturas e cobranças, Ofertas e preços, Parceiros. As outras ficam em Sistema → Financeiro avançado.

**Testes:**
- Mapa de rotas: toda rota antiga responde 308 para a nova.
- Menu: 7 itens no modo E-commerce.

**Aceite:** nenhuma tela mostra conceito do SuperDrop (Drop manual, saldo, comissão de fornecedor, margem) no modo E-commerce.

### F2. "Agora": cockpit ao vivo
**O que fazer:**
- Domínio: `agoraEcommerce(db, actor, agora)` retorna a fila priorizada da Parte 2.2 (`FilaItem[]`, mesma anatomia do lojista), os contadores ao vivo, a meta do mês (de `platform_settings`) e o funil compacto.
- Tela:
  - faixa de contadores;
  - fila com ações de um clique (WhatsApp com mensagem pronta, assumir conversa, Ver como lojista, reenviar cobrança);
  - meta;
  - funil;
  - atualiza a cada 15 s (sem recarregar a página, com transição suave).
- E-mail diário (`/master/summary`) passa a usar a mesma função.

**Testes:**
- Prioridade da fila: conversa esperando > cadastro novo > teste vencendo > parado 48 h > cobrança vencida > loja impedida de vender > primeira venda.
- Prazos com `agora` injetado (lição do ERP: nada de relógio implícito).

**Aceite:** com a demonstração, a fila mostra pelo menos um item de cada tipo que os dados permitem, e cada botão leva à ação.

### F3. Comercial: funil único e ficha 360
**O que fazer:**
- Migração: `crm_acompanhamento` + colunas em `brand_leads` (Parte 3.5).
- Domínio:
  - `funilComercial()` junta conversas, interessados e contas por pessoa (e-mail ou WhatsApp normalizado, ou `storeId`), sem duplicar;
  - as etapas avançam por eventos (conversa → contato → conta → ativando → vendendo → pagante → em risco → perdido);
  - `temperatura()` com regra em `platform_settings`.
- Telas:
  - quadro (colunas por etapa) e lista ordenada por temperatura;
  - filtros (origem, responsável, etapa, sem próxima ação);
  - **ficha 360** com linha do tempo única, responsável, próxima ação com prazo e botões.
- Respostas prontas (`platform_settings.comercial.modelos`), com variáveis e `wa.me`.
- "Falei pelo WhatsApp" registra na linha do tempo.

**Testes:**
- Junção sem duplicar (mesma pessoa vinda da conversa e do formulário).
- Avanço de etapa por evento.
- Temperatura.
- Permissões COMERCIAL e SUPORTE.

**Aceite:** um visitante que conversa, deixa o WhatsApp e cria a conta aparece **uma vez**, com a história inteira.

### F4. Atendimento: caixa única e Ajuda do lojista
**O que fazer:**
- `ia_conversas.storeId`.
- **Botão "Ajuda" no painel do lojista da E-commerce:**
  - mesmo chat do Maurício, `canal: PAINEL`, ligado à loja;
  - o Maurício responde com os fatos do sistema e passa para a equipe ("Chamar a equipe");
  - o lojista vê o histórico.
- **Caixa de atendimento no Master:**
  - abas Visitantes e Lojistas;
  - fila por tempo de espera com o relógio (5 e 15 min editáveis);
  - assumir;
  - respostas prontas;
  - notas internas;
  - "Ver como lojista" ao lado;
  - encerrar com motivo.
- **Avisos no servidor** (fatia C2):
  - leitura guardada no servidor;
  - som "Subida" para conversa nova e cadastro novo (chave "Sons do painel" na conta);
  - número no sino.

**Testes:**
- O lojista não lê a conversa de outra loja.
- A equipe recebe a conversa do painel.
- Prazo de resposta com relógio injetado.
- Leitura de avisos por usuário.

**Aceite:** o lojista pede ajuda dentro do painel, a equipe responde pelo Master, e os dois veem a mesma conversa.

### F5. Receita unificada
**O que fazer:**
- Uma tela: MRR, pagantes, em teste, vencidas, cancelamentos do mês e cortesias (tudo pela fonte única).
- Lista de assinaturas com o contrato e a última cobrança lado a lado.
- Ações: reenviar cobrança, estender teste (com motivo e auditoria), ver no gateway.
- "O que cada plano libera" mora aqui.
- **Serviços** (Loja NextLevel) como aba.

**Testes:** soma de MRR = soma dos contratos ativos; vencidas = cobranças em atraso dos contratos ativos.

### F6. Crescimento e Sistema: limpeza
**O que fazer:**
- **Crescimento:** parceiros, ofertas de entrada e cupons, Maurício vendedor (ajustes saem de `/master/ia/ajustes`), templates.
- **Sistema:** prontidão com os bloqueios reais no topo (Mercado Pago da NextLevel, rotinas, e-mail, modo demonstração).
- Remover do código as telas antigas que já redirecionam há um ciclo, com teste provando o redirecionamento.

**Aceite:** menu com 7 itens, nenhuma tela órfã e mapa de rotas atualizado em `docs/MAPA.md`.

### F7. Preparar a expansão (sem ligar)
**O que fazer:**
- Interface `ModuloMaster` (Parte 3.6).
- Documentar em `docs/prompts/` como ligar o SuperDrop: o provedor do SuperDrop é implementado e a marca entra em `master.marcasAtivas`.
- Os componentes `Inbox`, `LinhaDoTempo`, `FichaCliente` e `FilaAgora` ficam no design system, prontos para o painel do lojista (atendimento aos clientes dele).

## Entrega de cada fase
1. Prints (Master local; páginas públicas na produção): 1440 e 390 px, claro e escuro quando houver tela nova.
2. `npx tsc --noEmit`, `npx eslint src e2e tests` e os testes da fase. Um build quando a fase for grande.
3. Decisão nova em `DECISIONS.md`, commit em português e publicação na branch de publicação; conferir a produção (`npm run -s conferir:producao`).
4. Mensagem curta ao dono: o que ficou pronto, prints e o que depende dele.

## Ordem recomendada e tamanho
| Fase | Entrega visível ao dono | Tamanho |
|---|---|---|
| F0 | Números que batem; o Master abre só na E-commerce | Pequeno (meio dia) |
| F1 | Menu de 7 itens, uma casca só | Médio (1 dia) |
| F2 | Tela "Agora" ao vivo | Médio (1 dia) |
| F3 | Funil único e ficha 360 | Grande (2 dias) |
| F4 | Ajuda do lojista e caixa única com som | Grande (2 dias) |
| F5 | Receita unificada | Médio (1 dia) |
| F6–F7 | Limpeza e preparação | Médio (1 dia) |

**Prioridade se o tempo apertar:** F0 → F2 → F4 → F3 → F1 → F5 → F6. Números certos e atendimento primeiro, porque clientes reais estão chegando.
