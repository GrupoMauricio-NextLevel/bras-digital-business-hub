# UPClips: centro de comando da agência sobre o NextLevel Business (briefing do cliente × o que já existe)

> **Origem:** briefing enviado pelo Léo (UPClips, agência de marketing 360: planejamento, roteiro, captação, edição, social media, tráfego e resultados) em 17/11/2026, pedindo um "ERP de agência" com três ambientes: **Painel do CEO**, **Painel dos funcionários** e **Portal do cliente**.
>
> **Regra do dono para esta fase (17/11/2026):** *"Não precisa seguir integralmente. Se o que ele mandar se acoplar ao que já temos, melhor. Não quero desenvolver nada do zero nesta primeira fase. Priorize as funções avançadas que já temos no Master da NextLevel Commerce (e-mail, base de conhecimento e outras prontas) e traga o máximo para cá."*
>
> **Como ler:** a Parte 1 mostra o que já está pronto e vira função da UPClips; a Parte 2 responde o briefing item por item; a Parte 3 descreve o **único núcleo novo** (a peça de conteúdo e o ciclo do mês, que nenhuma tela de loja tem); as Partes 4 a 7 organizam os três ambientes, permissões e fases; a **Parte 9 é o prompt engenheiro mestre**.
>
> **Já no código (D313):** Painel da Agência em `/agencia` com o visual da Commerce, agência e equipe com funções, carteira com contrato (valor, vencimento, o que entra no mês), importação por planilha, cockpit "Hoje na agência", Master → Agências.
>
> **Documentos ligados:** `up-nextlevel-sistema-da-agencia.md` (parceria, cinco frentes, Mesa do Maurício, páginas públicas), `agencias-parceiras-up-piloto.md` (Parte 8: cobrança automática), `agencias-up-perguntas-estrategicas.md`. Preços fora deste documento; só a D312 está decidida.
>
> **Ao aprovar:** decisão nova em `docs/design/DECISIONS.md` (frente `[E-commerce]`) e citação na base de conhecimento.

---

## Resumo em uma página

**O que o Léo pediu:** abrir o sistema e saber o que está sendo feito, quem faz, para qual cliente, em que etapa, com qual prazo, o que atrasou, o que espera aprovação, que resultado gera, quanto entra e quanto sai. Cada funcionário com a própria fila. Cada cliente acompanhando e aprovando.

**O que entregamos na Fase 1, aproveitando o que já existe:**

| Pedido do briefing | Já pronto na NextLevel | Como vira UPClips |
|---|---|---|
| Painel do CEO, prioridades de hoje | Cockpit "Hoje na agência" (D313), Fila do dia, "Agora" ao vivo | Cockpit ampliado com produção do mês e "Prioridades de hoje" por cliente |
| Cadastro de clientes e de funcionários | Carteira e equipe com funções (D313) | Mais campos (logo, redes, links, briefing) e a função "filmmaker freelancer" |
| Login do cliente | Entrada por código no e-mail, sem senha (D240) | Portal do cliente da UPClips |
| Notificações | Sino de avisos, aviso sonoro, e-mail transacional | Avisos a cada mudança de etapa |
| Histórico de alterações | Trilha de auditoria (`audit_log`) e linha do tempo de pedido | Histórico de cada conteúdo |
| Busca rápida, modo claro e escuro, celular | Busca Ctrl+K, tema claro/escuro, casca responsiva | Igual |
| E-mail | Caixa de entrada do Master (D296) e e-mails da marca | E-mails do sistema com a marca UPClips |
| Treinar a equipe | Base de conhecimento "Aprender" (D264 a D266) | Trilhas por função da UPClips |
| CRM comercial | Comercial: um funil do contato ao pagante (D202) | Funil da UPClips com as etapas dela |
| Contratos e PDF | Contratos com assinatura no painel e PDF (D276) | Contrato do cliente e ordem de serviço em PDF |
| Financeiro, despesas, freelancers | Caixa com entradas, saídas e histórico (D269); cobrança Pix e cartão | Caixa da agência; pagamento de freelancer como saída |
| Tráfego pago | Tráfego e campanhas, leitura da Meta, links rastreados, origens (D290 a D302) | Painel do Alan com a mesma leitura |
| IA ("quais clientes estão atrasados?") | Maurício IA (painel lateral, ferramentas por plano) | Perguntas sobre os dados da UPClips |
| Resumo da semana | Resumo do dia (`daily-summary.ts`) | "Resumo da Semana" no mesmo molde |

**O único núcleo novo:** a **peça de conteúdo** com o fluxo da UPClips (planejamento → roteiro → captação → edição → revisão → aprovação → social media → publicação → métricas) e o **ciclo do mês** de cada cliente (contratado × produzido × publicado). Ele é construído com os padrões que já existem (linha do tempo, etapas, fila, avisos, permissões), sem visual novo.

**Ordem proposta:** Fase 1 entrega o centro de comando funcionando com o núcleo e o que está pronto. O CRM, o caixa e os contratos já existem, então entram na Fase 1 como bônus, mesmo estando na Fase 2 do briefing. Integrações externas (Google Drive pela API, redes sociais, WhatsApp automático, publicação automática) ficam para depois.

---

# Parte 1. Inventário: o que já está pronto e como vira função da UPClips

| # | Função pronta (onde está) | Para que serve hoje | Uso na UPClips | Ajuste necessário |
|---|---|---|---|---|
| 1 | **Painel da Agência** (`src/app/agencia/**`, D313) | Agência, equipe, carteira, cockpit | Base dos três ambientes | Ampliar (Parte 4) |
| 2 | **Casca da Commerce** (`role-layout.tsx`, `app-shell.tsx`) | Visual do lojista e do Master | Visual de tudo, com o nome e o logo da UPClips no menu (`marcaCliente.logoUrl`) | Logo da agência |
| 3 | **Fila do dia** (`fila-do-dia.ts`) e **Agora ao vivo** (`/master/agora`, `ao-vivo.tsx`) | "O que faço agora?" | "Prioridades de hoje" do CEO e de cada função | Regras da agência |
| 4 | **Resumo do dia** (`daily-summary.ts`, `/master/summary`) | Números do dia por e-mail e tela | "Resumo da Semana" (Seção 20 do briefing) | Janela de 7 dias |
| 5 | **Avisos** (sino `notifications-menu.tsx`, `activities`, aviso sonoro) | Novidades do painel | Central de notificações | Avisos por pessoa e por etapa |
| 6 | **E-mail transacional** (`email_outbox`, Resend, `email-marca.ts`) | E-mails com a marca | Avisos ao cliente (aprovar vídeo, fatura) e à equipe | Modelos da agência |
| 7 | **Caixa de entrada** (`caixa-entrada.ts`, D296) | E-mail da NextLevel dentro do Master | Fica no Master: a NextLevel atende a UPClips por ela | Nenhum |
| 8 | **Base de conhecimento "Aprender"** (`aprender.ts`, `/master/aprender`, D264 a D266) | Trilhas por função, aulas com teste | Manual da UPClips: como usar cada tela, o fluxo, os padrões de qualidade | Trilhas da agência e conteúdo |
| 9 | **Atendimento ao vivo e Maurício IA** (`ia-conversas.ts`, `/master/ia`) | Conversa do site e do painel | Ajuda dentro do painel; depois, perguntas sobre os dados da agência | Fase 3: ferramentas de consulta |
| 10 | **Comercial** (`comercial.ts`, `/master/comercial`, D202) | Funil do contato ao pagante | CRM da UPClips | Etapas e campos da agência |
| 11 | **Contatos e orçamentos** (`contatos_negocio`, NB3) e **site** (caminho Site) | Formulário do site com origem | Entrada de leads do site e das LPs da UPClips | Ligar a conta Business da UPClips |
| 12 | **Contratos com assinatura e PDF** (`contratos.ts`, `contratos/pdf.ts`, D276) | Contrato com aceite, parcelas Pix | Contrato do cliente da UPClips, ordem de serviço em PDF | Modelo de contrato da agência |
| 13 | **Caixa** (`caixa.ts`, D269) | Dia abre e fecha, entradas e saídas com histórico | Despesas fixas e variáveis, pagamento de freelancer, custo por cliente | Caixa por agência |
| 14 | **Cobrança** (`src/lib/payments/gateway.ts`, Mercado Pago e Pagar.me) | Pix e cartão conferidos na API | Fatura mensal do cliente (AGF1) | Conta de pagamento da agência |
| 15 | **Tráfego e campanhas** (`/master/trafego`, `anuncios_loja`, leitura da Meta D302, `links_rastreados`) | Origem, campanhas, retorno | Painel do Alan: campanhas por cliente, custo por resultado | Escopo por cliente da agência |
| 16 | **Auditoria** (`audit.ts`) e **linha do tempo** (`order_events`) | Histórico de mudanças | Histórico de cada conteúdo e de cada cliente | Reaproveitar o padrão |
| 17 | **Modo suporte** (`support.ts`) | A NextLevel vê o painel como o cliente vê, com motivo e registro | O CEO vê "como o cliente vê" o portal antes de mandar | Fase 2 |
| 18 | **Entrada por código** (`conta-cliente.ts`, D240) | Cliente final entra sem senha | Login do portal do cliente | Escopo agência e cliente |
| 19 | **Busca Ctrl+K, tema claro/escuro, painel instalável** | Já na casca | Igual | Indexar clientes e conteúdos |
| 20 | **Calendário comercial** (`ferramentas/calendario.tsx`, D188) | Datas do varejo | Datas por segmento no planejamento mensal | Datas por segmento |
| 21 | **Equipe do Master com funções** (`equipe-master.ts`, D138) | Modelo de função por tela | Já copiado na D313 | Nenhum |
| 22 | **Placar e metas** (`/master/placar`) | Meta do mês visível | Meta de entregas da equipe | Fase 2 |

---

# Parte 2. O briefing item por item

Legenda: **Pronto** (só ligar) · **Ajuste** (pequena extensão do que existe) · **Núcleo** (a peça de conteúdo, Parte 3) · **Depois** (fase seguinte).

| Briefing | Resposta | Fase |
|---|---|---|
| 1. Dashboard do CEO: clientes ativos, pausados e encerrados; faturamento; pagamentos pendentes | **Pronto** (D313) | 1 |
| 1. Vídeos contratados, roteiros, gravações, em edição, finalizados, aguardando aprovação, publicados, atrasados | **Núcleo** | 1 |
| 1. "Prioridades de hoje" e o cartão por cliente (ex.: 12 contratados, 8 publicados, 67%) | **Ajuste** da fila do dia + **Núcleo** | 1 |
| 1. Filtros por cliente, período, funcionário e departamento | **Ajuste** (filtros na URL, como nas outras listas) | 1 |
| 1. Despesas da agência | **Ajuste** do caixa | 2 |
| 2. Cadastro do cliente: nome, segmento, contato, plano, serviços, quantidades, valor, início, vencimento, equipe, observações | **Pronto** (D313) | 1 |
| 2. Logo, redes sociais, links importantes, briefing da marca, prazo contratual | **Ajuste** (campos novos na ficha) | 1 |
| 2. Página do cliente com 12 abas | **Ajuste**: a ficha ganha abas; cada aba usa o núcleo ou uma função pronta | 1 e 2 |
| 2. Escopo totalmente personalizado (12 vídeos, 20, só edição, só social, só tráfego) | **Ajuste**: serviços do contrato por tipo de entrega | 1 |
| 3. Fluxo PLANEJAMENTO → … → MÉTRICAS com encaminhamento automático | **Núcleo** | 1 |
| 3.1 Roteiros com status, comentários, aprovação | **Núcleo** | 1 |
| 3.2 Calendário de gravações, filmmaker freelancer, equipamentos, valor da captação, link do Drive dos brutos | **Núcleo** + função "filmmaker" | 1 |
| 3.2 Custo por profissional e por gravação | **Ajuste** do caixa | 2 |
| 3.3 Painel de cada editor, produtividade, transferir demanda | **Núcleo** | 1 |
| 3.4 Social media: calendário editorial, legendas, data e hora, links publicados, cumprimento do pacote semanal | **Núcleo** | 1 |
| 3.5 Tráfego: campanhas, verba, alcance, cliques, CPC, CTR, leads, custo por resultado, checklist, alertas | **Ajuste** do tráfego (leitura da Meta pronta; lançamento manual onde não houver conexão) | 2 |
| 4. Automação entre departamentos | **Núcleo** (a etapa seguinte recebe a tarefa e o aviso) | 1 |
| 5. Funcionários e freelancers com login, carga, histórico, redistribuição | **Pronto** (D313) + **Núcleo** | 1 |
| 5. Comunicação interna: comentar, anexar, mencionar | **Núcleo** (comentários na peça, anexos por link, menção avisa a pessoa) | 1 |
| 6. Portal do cliente: resumo do mês, produção simplificada, aprovar ou pedir ajuste, solicitações, resultados | **Ajuste** (entrada por código + núcleo) | 1 |
| 7. Controle automático de entregas mensais, extras, pendentes do mês anterior, produzido ≠ publicado, novo ciclo | **Núcleo** | 1 |
| 8. Calendário geral (dia, semana, mês) com filtros | **Núcleo** (gravações, prazos, publicações) + vencimentos do contrato | 1 |
| 8. Reuniões | **Ajuste** (compromisso simples na agenda) | 2 |
| 9. CRM comercial com conversão de lead em cliente e onboarding | **Pronto** (Comercial) + **Ajuste** (botão "virar cliente") | 1 (bônus) |
| 10. Financeiro: recorrente, recebido, em aberto, inadimplência | **Ajuste** (cobrança AGF1/AGF2) | 1 e 2 |
| 10. Custos fixos e variáveis, freelancers, custo e margem por cliente | **Ajuste** do caixa | 2 |
| 10. Ordem de serviço e documentos em PDF | **Ajuste** do gerador de PDF dos contratos | 2 |
| 10. Separar o que o cliente paga à agência do investimento em mídia | **Ajuste**: verba de mídia é campo do tráfego, nunca receita | 2 |
| 11. Métricas das redes e relatórios em PDF com a identidade da UPClips | **Ajuste**: lançamento manual com fonte e data; PDF no molde dos contratos | 2 |
| 12. Biblioteca de arquivos | **Ajuste**: links por cliente e por peça (Drive), sem guardar vídeo | 1 |
| 12. Integração com o Google Drive pela API | **Depois** | 3 |
| 13. Notificações nos casos listados | **Pronto** (sino, e-mail) + **Núcleo** (gatilhos) | 1 |
| 14. Checklist de onboarding | **Ajuste** (lista na ficha, criada ao virar cliente) | 1 |
| 15. Controle de qualidade: revisão interna, versões, quem pediu, quem fez, quando aprovou | **Núcleo** | 1 |
| 16. Relatórios internos (operacional, equipe, comercial, financeiro) | **Ajuste** (telas de números; PDF depois) | 2 |
| 17. Permissões por função; cliente só vê o dele | **Pronto** (D313) + funções novas | 1 |
| 17. Autenticação segura, backups, histórico | **Pronto** (sessões, troca de senha, "sair dos outros aparelhos", auditoria; backup do banco no Neon) | 1 |
| 18. Kanban, lista, calendário, busca, filtros, claro/escuro, celular | **Pronto** (casca) + **Núcleo** (quadro e calendário) | 1 |
| 18. "Identidade visual da UPClips" | Painel no visual da Commerce com o nome e o logo da UPClips; portal e PDFs com a identidade dela | 1 |
| 19. IA perguntando sobre os dados reais; ajuda com roteiros, legendas e relatórios | **Pronto** (Maurício IA) + ferramentas novas | 3 |
| 20. Resumo da Semana | **Ajuste** do resumo do dia | 1 |
| 3ª fase do briefing: Meta Ads e Google Ads, redes sociais, WhatsApp automático | **Depois** (a leitura da Meta já existe e pode vir antes) | 3 |

---

# Parte 3. O núcleo novo: a peça de conteúdo e o ciclo do mês

É a única coisa que não existe em nenhuma tela de loja: **uma peça de conteúdo que atravessa departamentos**. Ela é construída com padrões que já existem (etapas como a "mesa" de pedidos, linha do tempo como `order_events`, fila do dia, avisos, permissões da D313).

## 3.1 A peça (registro único de cada conteúdo)

- Uma peça por conteúdo: cliente, **ciclo (mês)**, tipo (vídeo, foto, carrossel, arte, criativo de anúncio, stories), título, objetivo, roteiro (texto e referências), responsável da etapa atual, prazo da etapa, gravação ligada, links (brutos, versões, final, publicação), legenda, data e hora de publicação, prioridade, se é **extra** (fora do pacote) e de que mês veio, se estiver atrasada.
- **Histórico imutável:** cada mudança de etapa, de responsável e de prazo, com quem fez e quando (o padrão da linha do tempo de pedidos).
- **Comentários** com menção (a pessoa mencionada recebe aviso), **anexos por link** e marcação de comentário **interno** (nunca aparece no portal).
- **Versões:** v1, v2, v3, com quem pediu o ajuste, quem executou e quando foi aprovado.

## 3.2 O fluxo da UPClips e a passagem automática

| Etapa interna | Quem recebe | Sub-situações | Sai quando | O cliente vê |
|---|---|---|---|---|
| Planejamento | Roteiro (ou gestor) | ideia → planejada | Entra no planejamento do mês | Em planejamento |
| Roteirização | Roteiro | não iniciado → em desenvolvimento → revisão → aprovado → pronto para captação | Roteiro aprovado (internamente ou pelo cliente, se o contrato pedir) | Em planejamento |
| Captação | Filmmaker da gravação | agendada → gravada → brutos disponíveis | Link dos brutos registrado | Em produção |
| Edição | Editor do cliente | aguardando edição → editando → revisão interna → ajustes → finalizado | Finalizado | Em edição |
| Revisão (qualidade) | Gestor ou revisor | em revisão → ajustes pedidos → aprovado internamente | Aprovado internamente | Em edição |
| Aprovação do cliente | Cliente (portal) | aguardando → aprovado / ajuste pedido (com comentário, volta para a edição) | Aprovado pelo cliente (ou dispensado no contrato) | Aguardando aprovação → Aprovado |
| Social media | Social media do cliente | aguardando material → programado | Programado com data e hora | Aprovado |
| Publicação | Social media | publicado (com o link) | Link da publicação registrado | Publicado |
| Métricas | Social media ou tráfego | métricas registradas (fonte e data) | Métricas lançadas | Publicado |

- **Passagem automática:** ao sair de uma etapa, a peça vai para o responsável da próxima, definido na equipe do cliente (D313: equipe por cliente). A pessoa recebe aviso no sino e por e-mail, e a peça entra na fila dela com prazo.
- **Prazos:** cada etapa tem um prazo padrão configurável pela agência. Passou do prazo, a peça fica atrasada no cockpit, na fila da pessoa e no Resumo da Semana.
- **Transferir:** gestor e administrador passam a peça de um editor para outro; o histórico registra.
- **Regra testada:** a passagem de etapa é uma função pura (`proximaEtapa`), como o `proximaNaLinha` do pedido na mesa (D184).

## 3.3 O ciclo do mês (entregas contratadas)

- Cada cliente tem um **ciclo por mês**, criado sozinho no primeiro dia (ou quando o gestor abre o planejamento), com o **contratado** copiado do contrato naquele momento. Mudar o contrato vale do próximo ciclo em diante, ou do atual se o gestor marcar.
- **Contagem que não engana:** *produzido* (finalizado ou além) e *publicado* são números diferentes, e a mesma peça nunca conta duas vezes. Extra conta à parte. Pendente do mês anterior aparece como "herdado" no ciclo novo, sem apagar o histórico do ciclo antigo.
- **Ritmo semanal:** para o contrato "5 vídeos por semana", o calendário mostra se a semana está em dia.
- **Regra pura testada** (`contagemDoCiclo`): contratado, planejado, em roteiro, em captação, em edição, aguardando aprovação, aprovado, publicado, atrasado, extra, herdado e percentual publicado.

## 3.4 Gravações e freelancers

- **Gravação:** cliente, data, hora, endereço, filmmaker, peças que serão gravadas, quantidade planejada, equipamentos, valor da captação, situação e link dos brutos.
- **Filmmaker freelancer:** pessoa da equipe com a função Gravação e a marca "freelancer". Vê só as gravações dele, os roteiros dessas gravações e o envio do link dos brutos.
- **Custo:** o valor da captação vira saída no caixa da agência quando marcada como paga (Fase 2), ligado ao cliente (custo por cliente).

## 3.5 Modelo de dados (para o engenheiro validar no diagnóstico)

Tabelas novas, só acrescentando:
- `agencia_ciclos`: cliente, mês (AAAA-MM), contratado (cópia do contrato), aberto/fechado;
- `agencia_pecas`: o registro único (Seção 3.1);
- `agencia_peca_eventos`: histórico imutável;
- `agencia_peca_comentarios`: interno ou visível ao cliente, menções e links;
- `agencia_peca_versoes`;
- `agencia_gravacoes`, com `agencia_gravacao_pecas` ligando as peças;
- `agencia_solicitacoes`: pedidos do cliente pelo portal.

Campos novos em `agencia_clientes` (logo, redes, links, briefing, prazo contratual, serviços por tipo, prazos padrão) e em `agencia_membros` (freelancer, valor padrão de captação).

Nada de tabela nova para avisos, auditoria, e-mail, caixa, contratos, CRM ou cobrança: usar as que existem.

---

# Parte 4. Os três ambientes

## 4.1 Painel do CEO (o cockpit, `/agencia`)

O "Hoje na agência" (D313) ganha:
- **números da produção do mês:** contratados, roteiros, gravações feitas e agendadas, em edição, finalizados, aguardando aprovação, publicados e atrasados, com filtro por cliente, período, pessoa e departamento;
- **"Prioridades de hoje":** a fila do dia com atrasos, aprovações paradas, gravações de hoje e amanhã, vencimentos, clientes sem responsável e peças sem dono;
- **cartão por cliente** no formato do briefing (contratados, publicados, em edição, aguardando aprovação, aguardando gravação, barra de progresso);
- **dinheiro:** faturamento do mês, pagamentos pendentes e, na Fase 2, despesas e margem;
- **carga da equipe** (já existe) com atrasados por pessoa;
- **Resumo da Semana** como página própria, para a reunião interna.

Menu:
```
HOJE · RESUMO DA SEMANA
PRODUÇÃO     Quadro (Kanban) · Lista · Calendário geral · Gravações
CLIENTES     Carteira · Ficha (abas) · Solicitações
COMERCIAL    Funil (CRM) · Contratos                    [funções prontas]
FINANCEIRO   Cobrança · Caixa                           [funções prontas]
TRÁFEGO      Campanhas por cliente                      [Fase 2]
EQUIPE       Pessoas e funções · Aprender               [funções prontas]
```

## 4.2 Painel dos funcionários ("Minha fila")

Cada pessoa entra direto na fila dela, com as peças da etapa dela, ordenadas por prazo e prioridade:
- **Roteiro:** planejamento do mês por cliente, ideias, roteiros por situação, referências e prazos;
- **Filmmaker:** agenda de gravações, roteiros a gravar, checklist de equipamento, botão "brutos disponíveis" com o link;
- **Editor:** vídeos a editar com roteiro, brutos, referências, prioridade e prazo; versões; ajustes pedidos; produtividade dele;
- **Social media:** finalizados e aprovados, calendário editorial por cliente, legenda, data e hora, link publicado, ritmo do pacote;
- **Tráfego:** clientes com tráfego, campanhas e checklist (Fase 2).

No celular, a fila funciona com uma mão: botão grande para avançar a etapa.

## 4.3 Portal do cliente (com a identidade da UPClips)

- Entrada por **código no e-mail**, sem senha (D240, mesmo mecanismo);
- **Resumo do mês:** contratados, produzidos, publicados, em andamento, próximas gravações e publicações, barra de progresso;
- **Produção** em situações simples: em planejamento → em produção → em edição → aguardando aprovação → aprovado → publicado;
- **Aprovar ou pedir ajuste** (com comentário obrigatório). O pedido volta para a edição com aviso ao editor e ao gestor;
- **Solicitações:** ideias, dúvidas e pedidos, com andamento;
- **Resultados** dos serviços contratados (métricas lançadas e, depois, integradas);
- **Nunca mostra:** comentários internos, custos, valores de freelancer, outros clientes.

---

# Parte 5. Permissões

Amplia as funções da D313 (`AGENCIA_FUNCOES`):

| Função | Vê | Faz |
|---|---|---|
| Administrador (CEO) | Tudo | Tudo |
| **Gestor** (nova) | Operação de todos os clientes, sem financeiro (a menos que o CEO libere) | Distribui, transfere, revisa, aprova internamente |
| Atendimento | Carteira sem valores | Cadastra cliente, onboarding, solicitações |
| Roteiro | Planejamentos e roteiros dos clientes dele | Cria e envia roteiros |
| Gravação (filmmaker, interno ou freelancer) | Só as gravações dele e os roteiros delas | Registra brutos |
| Edição | Peças dele, brutos e referências | Edita, envia versões |
| Social media | Calendário e peças aprovadas dos clientes dele | Programa, publica, lança métricas |
| Tráfego | Clientes com tráfego | Campanhas, checklist, métricas |
| Financeiro | Valores, cobrança, caixa | Contrato, cobrança, despesas |
| Cliente (portal) | Só o que é dele e foi marcado como visível | Aprova, pede ajuste, envia solicitações |

Regras: permissões no servidor; uma agência nunca lê outra; comentário interno nunca sai para o portal; cliente nunca vê custo.

---

# Parte 6. Fases

| Fase | Entrega | Reaproveita |
|---|---|---|
| **Fase 1A** (núcleo) | Ciclo do mês, peça de conteúdo, fluxo com passagem automática, histórico, comentários e versões, quadro e lista, "Minha fila" por função | Padrões de etapas, linha do tempo, permissões D313 |
| **Fase 1B** (ambientes) | Cockpit do CEO com produção e "Prioridades de hoje", cartão por cliente, calendário geral (gravações, prazos, publicações, vencimentos), gravações e filmmaker freelancer, ficha do cliente com abas e campos novos, onboarding, biblioteca por links | Cockpit D313, fila do dia |
| **Fase 1C** (cliente e avisos) | Portal do cliente (entrada por código), aprovação e ajuste, solicitações, avisos no sino e por e-mail, Resumo da Semana, trilha "Painel da Agência" no Aprender | `conta-cliente.ts`, avisos, e-mail transacional, `daily-summary.ts`, Aprender |
| **Fase 1D** (bônus prontos) | CRM com "virar cliente" e onboarding; contratos com assinatura; cobrança automática (AGF1) | Comercial, contratos, gateway |
| **Fase 2** | Caixa da agência (despesas, freelancers, custo e margem por cliente), tráfego por cliente (leitura da Meta + lançamento manual, checklist, alertas), métricas manuais com fonte e data, relatórios internos, PDFs (OS e relatório) com a identidade da UPClips, régua de cobrança (AGF2), reuniões na agenda, metas da equipe | Caixa, tráfego, PDF dos contratos, placar |
| **Fase 3** | Google Drive pela API, Meta Ads e Google Ads completos, redes sociais (indicadores e publicação quando permitido), WhatsApp automático, Maurício IA respondendo sobre os dados da agência e ajudando em roteiros, legendas e relatórios, relatórios automáticos | Maurício IA, conexões de tráfego |

---

# Parte 7. O que não fazemos agora (e por quê)

- **Guardar vídeo no sistema:** custo de armazenamento e banda. Usamos o link do Google Drive em cada peça e na biblioteca. Integração pela API do Drive é Fase 3.
- **Publicar nas redes automaticamente:** depende de aprovação das plataformas e de permissão do cliente; Fase 3.
- **Visual "igual ao ClickUp":** o painel fica no visual da NextLevel Commerce, com quadro, lista, calendário, cores por situação, barras de progresso, busca e modo escuro, que é o que o briefing pede na prática.
- **"Seguir 100% o briefing":** o dono decidiu acoplar o briefing ao que existe; o que não cabe agora fica listado na Fase 2 ou 3.

---

# Parte 8. Sugestões de dono

1. **Termo de uso de imagem por gravação,** assinado no celular no dia (reaproveita a assinatura de contratos). Agência de vídeo grava pessoas.
2. **Acessos dos clientes num cofre** criptografado (`encryptSecret`), com registro de quem viu. Item do onboarding do briefing ("acessos às redes organizados").
3. **Prazos padrão por etapa definidos com a UPClips na primeira semana** (roteiro em X dias, edição em Y). Sem isso, "atrasado" não significa nada.
4. **Aprovação silenciosa combinada no contrato:** passados N dias sem resposta do cliente, a peça segue (com aviso). Evita fila parada.
5. **Biblioteca de roteiros por segmento:** o que funciona numa vidraçaria serve para outra; acelera a roteirização.
6. **Linha de base no dia zero:** atrasos por mês, tempo de aprovação, horas cobrando, clientes perdidos em 6 meses. É o que transforma a UPClips em caso de sucesso.
7. **Treinamento antes de ligar:** trilha "Painel da Agência" no Aprender para cada função, com teste curto. Equipe treinada usa; equipe sem treino volta para o WhatsApp.
8. **Um mês de transição:** o ciclo de dezembro inteiro já no sistema; nada de metade no WhatsApp e metade no painel.
9. **Indicador "contratado × capacidade":** quantos vídeos a equipe consegue entregar por semana contra o que foi vendido. Mostra a hora de contratar outro editor antes de atrasar.
10. **Verba de mídia sempre separada da receita** (pedido do briefing): o investimento que o cliente põe na Meta ou no Google nunca entra no faturamento da agência.

---

# Parte 9. Prompt engenheiro mestre

> Copie o bloco inteiro numa sessão de trabalho. Ele é autossuficiente.

```text
Você vai transformar o Painel da Agência (D313) no centro de comando da UPClips (agência de marketing 360), aproveitando ao
máximo o que já existe na NextLevel Commerce. Regra do dono para esta fase: NADA do zero; acoplar o briefing do cliente
ao que já existe; o que não couber vai para fases futuras. Siga CLAUDE.md e AGENTS.md à risca.

LEIA ANTES
- CLAUDE.md, AGENTS.md, docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md.
- docs/prompts/upclips-centro-de-comando.md (este documento: inventário, briefing item a item, núcleo, ambientes,
  permissões, fases). Complementos: up-nextlevel-sistema-da-agencia.md e agencias-parceiras-up-piloto.md (Parte 8).
- Decisões D202, D240, D264 a D266, D269, D276, D290 a D302, D296, D304 a D313.
- Código da agência: src/lib/agencias/*, src/app/agencia/**, src/app/master/agencias/**, src/app/actions/agencias.ts,
  src/db/demo-agencia.ts, tests/agencias.test.ts, e2e/agencias.mjs.
- Padrões a reaproveitar: pedido-mesa-regras.ts (etapas puras), order_events (linha do tempo), fila-do-dia.ts,
  daily-summary.ts, conta-cliente.ts (entrada por código), contratos.ts + contratos/pdf.ts, caixa.ts, comercial.ts,
  notifications-menu.tsx + activities, email_outbox, aprender.ts, src/lib/payments/gateway.ts, commerce-home.tsx (Kpi),
  role-layout.tsx (casca da Commerce com marcaCliente).

SKILLS (use cada uma no momento certo)
- impact-analysis e acceptance-designer: no diagnóstico de cada fase (o que a mudança toca e os critérios de aceite).
- nova-migracao: a cada mudança em src/db/schema.ts.
- painel-interno: toda tela autenticada (fila do dia, "o que faço agora?", densidade, celular com uma mão).
- ux-flow-auditor: no fluxo de ponta a ponta (roteiro → … → publicado) e no portal do cliente.
- security-guardian: permissões por função, portal do cliente, comentários internos, cofre de acessos.
- qa-visual e e2e-demo: capturas reais em 360, 768 e 1440 px, interação e axe, antes de mostrar ao dono.
- desempenho: antes de abrir para a UPClips (listas e cockpit com poucas consultas, sem consulta dentro de laço).
- release-gate e publicar: no fim de cada fase. architecture-drift: ao fim da Fase 1, para conferir que nada foi
  duplicado. pagina-de-vendas: só se a fase incluir página pública.

REGRAS QUE NÃO QUEBRAM
1. Reaproveitar antes de criar (tabela de reaproveitamento da Parte 1). Nada de tabela nova para avisos, auditoria,
   e-mail, caixa, contratos, CRM ou cobrança.
2. Visual da NextLevel Commerce (casca do lojista, ds-hero, ds-card, Kpi, fila do dia) com o nome e o logo da agência no
   menu. Sem visual novo. Quadro (Kanban), lista e calendário com os componentes e tokens do design system.
3. Uma agência nunca lê outra; cada função vê só o que é dela; comentário interno e custo nunca aparecem no portal;
   permissões sempre no servidor (src/lib/agencias/acesso.ts).
4. Registro único por peça; histórico imutável; produzido ≠ publicado; nada conta duas vezes; ciclo novo preserva o
   anterior; contrato copiado para o ciclo no momento da abertura.
5. Valores em centavos; regras configuráveis em platform_settings ou nas configurações da agência; nada fixo no código.
6. Página com banco: export const dynamic = "force-dynamic". Tudo atrás de AGENCIAS_V1 (+ chave por fase se fizer
   sentido); desligado, nada muda para ninguém.
7. Vídeo nunca no banco: só links (Drive) e capa leve.
8. Acessibilidade AA, axe sem violações graves, sem rolagem horizontal em 360 px.
9. Sem número inventado em tela; métricas manuais sempre com fonte e data.
10. Custo do Render: documentos com [skip render]; no máximo 3 publicações de código por dia.

PROTOCOLO DE CADA FASE
a) Diagnóstico ("relatar primeiro"): para cada item, o que já existe, o que estender, o que é novo; riscos; critérios de
   aceite. Conflito com Constituição ou decisão: pare e explique ao dono.
b) Regras puras primeiro (proximaEtapa, contagemDoCiclo, prazos, permissões), com testes vitest.
c) Domínio em src/lib/agencias/*, ações com runAction, telas por último.
d) Testes: isolamento entre agências, permissão por função (inclusive portal), passagem de etapa, contagem do ciclo.
e) e2e no navegador com dados de demonstração fictícios (Agência Aurora); prints conferidos antes de mandar.
f) Decisão em docs/design/DECISIONS.md ([E-commerce]), base de conhecimento, node scripts/gerar-novidades.mjs, relatório
   em docs/relatorios/ com "Esforço do dia por frente".
g) Durante: tipos, lint e testes dos arquivos mexidos. Fim da fase: bateria completa e npm run build.

FASE 1A, NÚCLEO
- Ciclo do mês por cliente (agencia_ciclos) com o contratado copiado do contrato; criação automática no primeiro acesso
  do mês; herdados do mês anterior.
- Peça de conteúdo (agencia_pecas) com as etapas e sub-situações da Parte 3.2, responsável, prazo, prioridade, extra,
  links, legenda, data de publicação; histórico (agencia_peca_eventos); comentários internos ou visíveis com menção
  (agencia_peca_comentarios); versões (agencia_peca_versoes).
- Passagem automática para o responsável da próxima etapa (equipe do cliente), com aviso; transferir responsável.
- Quadro (Kanban por etapa), lista com filtros (cliente, período, pessoa, departamento) e "Minha fila" por função.
Aceite: passagem de etapa testada; editor não vê peça de cliente fora da equipe dele; produzido e publicado contados
separados; mudar contrato não altera ciclo fechado; histórico registra quem, o quê e quando.

FASE 1B, AMBIENTES
- Cockpit do CEO com números da produção, "Prioridades de hoje" (atrasos, aprovações paradas, gravações de hoje e
  amanhã, vencimentos), cartão por cliente com barra de progresso, filtros.
- Gravações (agencia_gravacoes) com filmmaker (função Gravação, marca freelancer), peças, equipamentos, valor e link
  dos brutos; "brutos disponíveis" move as peças para a edição.
- Calendário geral (dia, semana, mês) com gravações, prazos de roteiro e edição, aprovações, publicações e vencimentos;
  filtros por cliente, pessoa e setor.
- Ficha do cliente com abas (visão geral, planejamento, roteiros, gravações, edição, aprovações, calendário,
  arquivos, solicitações; financeiro restrito) e campos novos (logo, redes, links, briefing, prazo contratual);
  onboarding como lista na ficha.

FASE 1C, CLIENTE E AVISOS
- Portal do cliente com a identidade da agência, entrada por código (padrão conta-cliente.ts), resumo do mês, produção
  em situações simples, aprovar ou pedir ajuste (comentário obrigatório, volta para a edição com aviso), solicitações.
- Avisos (sino e e-mail) para: tarefa atribuída, prazo próximo, atraso, pronto para revisão, aprovado pelo cliente,
  ajuste pedido, gravação próxima, publicação pendente, vencimento próximo.
- Resumo da Semana (molde do daily-summary). Trilha "Painel da Agência" no Aprender, por função.

FASE 1D, BÔNUS PRONTOS
- CRM da agência sobre o Comercial (etapas do briefing: prospecção → contato → reunião → proposta → negociação →
  fechado → onboarding) com "virar cliente" que cria o cliente na carteira e o checklist de onboarding.
- Contrato do cliente pelo fluxo de contratos com assinatura e PDF.
- Cobrança automática (AGF1 do racional da agência).

FASE 2 E FASE 3
- Seguir a Parte 6 deste documento, sempre com o mesmo protocolo.

ENTREGA DE CADA FASE
- Prints conferidos (1440 e 360 px), testes, build, decisão, base de conhecimento, relatório e a lista do que o dono
  precisa fazer (ligar chave, configurar prazos padrão com a agência, receber logo e briefing dos clientes).
```
