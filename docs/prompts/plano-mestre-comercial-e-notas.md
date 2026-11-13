# Plano mestre: comercial em primeiro lugar e as notas de todos os departamentos subindo

> **Racional amplo + prompt engenheiro mestre.** Escrito em 13/11/2026 a partir da avaliação geral do sistema (nota 7,0) e dos fatos novos que o dono trouxe. Decisão de registro: **D290** (proposta, aguarda o "ok" do dono).
> **Como usar:** leia as Partes 1 a 3 uma vez. Depois, cada sessão de trabalho cola a **Parte 8 (prompt mestre)** e executa **uma etapa por vez**, na ordem da Parte 7, atualizando o **Registro de andamento** (Parte 9).
> **Frente:** 100% `[E-commerce]` (NextLevel Commerce). Nada aqui abre marca nova.

---

## Sumário
- Parte 1. Onde estamos (fatos)
- Parte 2. Racional: por que o comercial é o ponto mais fraco e o que muda isso
- Parte 3. Plano comercial (CM0 a CM10)
- Parte 4. Plano por departamento (todas as notas)
- Parte 5. Painel de notas: de onde saímos e aonde vamos
- Parte 6. Decisões que dependem do dono (com recomendação)
- Parte 7. Ordem de execução e calendário
- Parte 8. Prompt engenheiro mestre
- Parte 9. Registro de andamento

---

## Parte 1. Onde estamos (fatos)

### 1.1 Clientes reais (informado pelo dono em 13/11/2026)
| Quem | O que é | Situação | O que ainda não sabemos (preencher na CM0) |
|---|---|---|---|
| **Anderson** | Lojista | Já está dentro e **já pagou**. Tem contrato com parcelas no painel (D276, D277); **o restante vence em 16/11** (`docs/fila/FILA-DO-DONO.md`) | Plano/produto contratado, valor mensal, data de início, loja já vende? |
| **Bazar Prime Outlet** | Lojista (outlet) | **Já pagou** | Plano, valor, data, loja já vende? origem (indicação, contato direto?) |
| **Ingrid** | Micro influenciadora | **Começou como afiliada** (Programa de Parceiros, regra única D260: 20% de toda mensalidade paga) | Link dela, seguidores, nicho, quantos cliques/cadastros já trouxe |

**Placar da meta (D174):** **2 de 10 lojistas pagantes (20%)**. 1 parceira ativa. Isso muda a nota do Comercial: de 4,5 para **5,0** (tem venda real, mas sem processo que repita).

### 1.2 O que já existe e NÃO precisa ser construído de novo (regra anti-duplicação)
O comercial fraco **não é falta de ferramenta**. O sistema já tem:

| Peça | Onde | Decisão |
|---|---|---|
| Situação comercial única (fonte de verdade de "está pagando?") e tela "Agora" | `src/lib/domain/situacao-comercial.ts`, Master → Agora | D200 |
| Funil do contato ao pagante e ficha 360 | Master → Comercial | D202 |
| Ajuda do lojista dentro do painel e caixa única de atendimento | Painel do lojista, Master → Atendimento | D201, D205 |
| Receita e Crescimento | Master → Receita / Crescimento | D204 |
| Janela de saída que vira interessado no CRM | Páginas públicas e loja | D280 |
| Programa de Parceiros (regra única 20/24/28%), CRM de parceiros, página de captação | `/parceiros`, Master → Parceiros | D251, D252, D260 |
| Bônus gamificado e executivos de rua (venda com recibo, agenda, metas) | Painel do executivo, Master → Caixa | D271 a D275 |
| Contratos com aceite, Pix do contrato e lembrete de parcela | Master → Contratos | D276, D277, D284 |
| Black NextLevel (até 30/11 23h59), kit Black na loja do lojista | Sites e painéis | D227 a D233, D242 |
| Página "Nossos clientes" e "Temas para Nuvemshop" | `/clientes`, `/temas-nuvemshop` | D282, D283 |
| E-mail de verdade (Resend) e caixa da Hostinger com `comercial@` | | D285, D289 |
| Base de conhecimento "Aprender" com trilha comercial | Master → Aprender | D265 a D267 |
| Série de vídeos comerciais no YouTube (5 de 6 prontos) | `docs/prompts/serie-youtube-apresentacoes-comerciais.md` | |

**Conclusão:** o que falta é **processo, ritmo, prova e medição**. O plano trata o comercial como um departamento que opera todo dia, e o sistema entra só onde ele economiza tempo ou mede.

### 1.3 Notas da avaliação (13/11/2026)
| Departamento | Nota | Maior lacuna |
|---|---|---|
| Engenharia | 8,0 | "Central oculta" do SuperDrop por baixo de toda loja (Constituição, art. 4) |
| Qualidade e testes | 7,5 | Bateria de 30 min; teste de concorrência nunca rodou em Postgres real |
| Segurança | 8,0 | Duas falhas da auditoria de outubro a conferir; backup do Neon sem confirmação |
| Pagamentos | 7,0 | Compra de ponta a ponta com Mercado Pago real nunca testada |
| Produto | 7,5 | Falta "esta loja está pronta para vender?" (art. 30) |
| Visual | 7,5 | Refeito muitas vezes, sem medida de resultado |
| **Comercial** | **5,0** (era 4,5) | Sem rotina de prospecção, sem prova social, sem funil medido de verdade |
| Foco e gestão | 5,0 | Muitas frentes abertas no código e na cabeça |
| Documentação | 9,0 | Volume grande; pouco relatório de resultado |
| Custo e operação | 7,0 | Rotinas automáticas (CRON) e backup pendentes |

---

## Parte 2. Racional: por que o comercial é o ponto mais fraco e o que muda isso

### 2.1 O diagnóstico em uma frase
**O sistema está pronto para vender mais do que a empresa está vendendo.** Toda semana foi para construir; quase nenhuma hora foi para uma rotina comercial que se repete.

### 2.2 As sete causas
1. **Sem rotina de prospecção.** Ninguém tem a tarefa diária "falar com X pessoas novas". Venda veio de relacionamento (Anderson, Bazar Prime), não de processo.
2. **Sem prova social real.** A página "Nossos clientes" mostra marcas que a agência atende, mas ainda **nenhuma loja da plataforma com resultado**. Os dois primeiros clientes são a prova que falta.
3. **Sem perfil de cliente escrito a partir de quem comprou.** Temos 12 personas teóricas (`publico-personas-precos-ecossistema.md`); falta olhar quem **de fato** pagou e procurar mais gente igual.
4. **Parceiros sem ativação.** O programa está pronto, mas tem 1 parceira. Um programa de afiliados só anda com acompanhamento de perto das primeiras pessoas.
5. **Funil sem números reais.** O Master mede, mas ninguém lê toda semana "quantos contatos → conversas → testes → pagantes, e de onde vieram".
6. **Cliente pagante sem acompanhamento planejado.** Perder o Anderson ou o Bazar Prime agora custa mais do que não ganhar um novo: eles são a prova, a indicação e o caso de estudo.
7. **Janela da Black passando.** A Black NextLevel vai até **30/11** (17 dias). É o melhor motivo para chamar alguém agora e está sendo usada só no site.

### 2.3 A conta do funil (hipótese a calibrar em 2 semanas)
Para ir de 2 para 10 pagantes faltam **8**. Com taxas iniciais de mercado para venda consultiva a pequenos lojistas (a confirmar com os nossos números na CM7):

| Etapa | Taxa (hipótese) | Quanto precisa |
|---|---|---|
| Contato qualificado → conversa de verdade | 35% | **~190 contatos** |
| Conversa → teste ou proposta | 40% | ~66 conversas |
| Teste/proposta → pagante | 30% | ~27 testes/propostas |
| **Pagantes novos** | | **8** |

**Leitura simples:** cerca de **20 contatos novos por dia útil durante 2 semanas**, ou 10 por dia em 4 semanas. Indicação e parceiro reduzem muito essa conta, porque chegam com confiança (taxa de fechamento muito maior). Por isso o plano empurra **indicação dos dois primeiros** e **parceiros parecidos com a Ingrid** antes da prospecção fria.

### 2.4 Princípios do plano
1. **Primeiro quem já pagou.** Cuidar, provar e pedir indicação.
2. **Rotina antes de ferramenta.** Só se programa algo se a rotina manual já mostrou onde dói.
3. **Uma métrica por etapa**, lida toda segunda-feira.
4. **Nada de promessa de ganho** em nenhum material (regra do projeto). Caso de estudo mostra o que foi feito e o que o cliente diz, não promete resultado.
5. **Usar a Black como motivo**, com fim real (sem "Black Fraude", D227).
6. **Tudo registrado no sistema** (ficha 360, CRM de parceiros), nunca só no WhatsApp pessoal.

---

## Parte 3. Plano comercial (CM0 a CM10)

Cada etapa tem: **objetivo**, **o que o dono/equipe faz**, **o que o sistema faz (código)**, **métrica**, **pronto quando**. Etapas marcadas **[sem código]** são de operação; o agente prepara roteiros, listas e documentos.

### CM0. Placar real: os clientes de verdade no sistema (meio dia)
- **Objetivo:** o Master mostrar **2 pagantes e 1 parceira reais**, separados de qualquer dado de demonstração.
- **Dono:** confirmar os dados da tabela 1.1 (plano, valor, datas, origem).
- **Sistema:**
  - conferir que Anderson e Bazar Prime aparecem como **Pago** em `situacao-comercial` (D200) e que cortesia não conta (D278);
  - conferir que a Ingrid aparece no CRM de parceiros com o link e a origem dos cadastros;
  - meta "10 pagantes" lida da configuração (não fixa no texto) e o placar "2/10" na tela Agora;
  - se houver dado de demonstração misturado em produção, marcar e esconder do placar (sem apagar).
- **Métrica:** placar do Master = realidade informada pelo dono.
- **Pronto quando:** print do Master → Agora com "2 de 10" e a ficha 360 dos dois.

### CM1. Sucesso dos dois primeiros (1 a 2 dias, contínuo)
- **Objetivo:** Anderson e Bazar Prime **vendendo** e satisfeitos; nenhuma perda.
- **Dono/equipe:**
  - ligação de 20 minutos com cada um: o que falta para a loja vender, o que incomoda, o que mais gostam;
  - acompanhar a parcela do Anderson de 16/11 (lembrete já existe, D284);
  - combinar uma conversa a cada 15 dias nos primeiros 3 meses.
- **Sistema:**
  - **"Sua loja está pronta para vender?"**: lista de passos com estado verde/amarelo/vermelho no painel do lojista (produtos com foto e preço, frete, Mercado Pago conectado, domínio, política, primeiro pedido de teste). Fecha também o artigo 30 da Constituição (ver PR1). Reaproveitar o "Precisa de você agora" (D212) e o funil de ativação (`funilEcommerce`);
  - na ficha 360 do Master: "próximo contato em" e "saúde da loja" (vendeu nos últimos 7 dias? entrou no painel?).
- **Métrica:** loja de cada um com primeira venda real; 0 cancelamentos.
- **Pronto quando:** as duas lojas com todos os passos verdes e uma venda registrada.

### CM2. Prova social: os casos reais (2 dias, depois contínuo)
- **Objetivo:** transformar os dois primeiros em **prova** que vende para os próximos.
- **Dono:** pedir autorização por escrito (termo de uso de imagem e de nome) e um depoimento curto (vídeo de 30 a 60 s no celular ou texto).
- **Agente:**
  - roteiro de 5 perguntas para o depoimento (por que trocou, o que achou mais fácil, o que mudou na rotina, quem recomendaria, nota de 0 a 10);
  - página de caso em `/clientes` com o selo "Na NextLevel Commerce" (D283 já prevê o selo), só com fatos e falas autorizadas, **sem números de venda sem autorização e sem promessa de ganho**;
  - versões curtas para Instagram, WhatsApp e para o kit da Ingrid.
- **Métrica:** 2 casos publicados; uso do caso em toda proposta.
- **Pronto quando:** página no ar e print enviado.

### CM3. Ingrid como piloto de parceira (1 dia, depois acompanhamento semanal)
- **Objetivo:** fazer a primeira parceira **trazer o primeiro pagante** e virar o modelo para recrutar as próximas.
- **Dono/equipe:** conversa de 30 minutos com a Ingrid: público dela, formato que ela gosta (story, reels, live), meta combinada sem pressão.
- **Agente:**
  - **kit da parceira**: 5 roteiros de conteúdo (bastidores de montar uma loja, "quanto custa ter loja própria" com a calculadora real, antes e depois de uma loja, dica de produto, convite da Black), textos para direct e WhatsApp, imagens no padrão da marca, regras do que **não** dizer (sem promessa de ganho);
  - checklist semanal: cliques no link, cadastros, testes, pagantes, comissão a receber (tudo já no painel do parceiro).
- **Sistema:** conferir que o painel do parceiro mostra o funil dela por etapa; se não mostrar "cliques → cadastros → pagantes", completar.
- **Métrica:** 1º pagante vindo da Ingrid em até 30 dias.
- **Pronto quando:** kit entregue a ela e primeira semana medida.

### CM4. Black NextLevel até 30/11 [urgente] (3 dias de preparo, 17 dias de execução)
- **Objetivo:** usar a única janela com motivo forte até o fim do mês.
- **Equipe:**
  - lista de **todos os contatos que já demonstraram interesse** (interessados do CRM, janela de saída D280, conversas do Maurício, clientes da agência, contatos pessoais do dono);
  - sequência de 4 mensagens até 30/11: convite (dia 1), caso real (dia 4), lembrete com contagem (dia 10), última chamada (dia 30);
  - pedir a Anderson e Bazar Prime **uma indicação cada** (benefício conforme a regra vigente; ver decisão 6.3).
- **Agente:** textos das 4 mensagens (WhatsApp, e-mail, Instagram), lista organizada a partir do CRM, roteiro de ligação de 3 minutos.
- **Sistema:** só se faltar: segmento "interessados ainda não pagantes" exportável do CRM; e-mail da sequência pelo Resend respeitando a concordância (D280).
- **Métrica:** contatos alcançados, respostas, testes e pagantes da Black.
- **Pronto quando:** sequência disparada e números do dia lidos no Master.

### CM5. Perfil do cliente ideal a partir de quem comprou (meio dia) [sem código]
- **Objetivo:** saber **para quem** ligar.
- **Agente:** com os dados da CM0 e da CM1, escrever 3 perfis curtos (exemplos a confirmar: outlet/bazar com estoque próprio; marca própria de moda que vende no Instagram e WhatsApp; lojista de atacado do Brás que quer vender online). Para cada um: onde encontrar, dor principal, frase de abertura, plano indicado, objeções e respostas, caso real que mais convence.
- **Saída:** `docs/comercial/PERFIS-CLIENTE-IDEAL.md` e trilha atualizada no Aprender.
- **Pronto quando:** dono aprova os 3 perfis.

### CM6. Máquina de prospecção ativa (2 dias de preparo, depois diário)
- **Objetivo:** **20 contatos novos qualificados por dia útil**, registrados.
- **Equipe:** blocos fixos no dia (ex.: 9h–10h30 contatos, 16h–17h retornos); executivo de rua com agenda (D274).
- **Agente:**
  - lista inicial de 200 contatos por perfil (fontes públicas: Instagram, Google Maps, feiras, grupos de lojistas; nada de comprar lista nem mandar mensagem em massa sem concordância);
  - cadência de 5 toques em 14 dias (mensagem, áudio curto, ligação, caso real, última);
  - roteiro de diagnóstico de 15 minutos e as 10 objeções mais comuns com respostas verdadeiras (comparativo D261: agressivo, sempre com fato).
- **Sistema:**
  - no CRM: "próximo toque em", "toque nº", motivo de perda (lista fixa) e origem obrigatória;
  - fila "Ligar hoje" na tela Agora, com os contatos do dia;
  - placar diário por pessoa da equipe (reaproveitar o ranking e as missões do BG2, D272).
- **Métrica:** contatos/dia, taxa de resposta, conversas marcadas.
- **Pronto quando:** 5 dias seguidos com a meta diária batida e registrada.

### CM7. Funil medido de verdade (1 dia)
- **Objetivo:** toda segunda-feira, saber **onde a venda trava e de onde ela vem**.
- **Sistema:**
  - relatório semanal automático no Master (e por e-mail ao dono): contatos → conversas → testes/propostas → pagantes, **por origem** (indicação, parceiro, executivo, site, Black, prospecção) e por perfil;
  - taxa de cada etapa contra a hipótese da seção 2.3; destaque da pior etapa;
  - tempo médio do contato ao pagamento.
- **Métrica:** relatório lido e uma ação escolhida por semana.
- **Pronto quando:** primeiro relatório real chega na segunda-feira.

### CM8. Ofertas de entrada claras (1 dia) [quase sem código]
- **Objetivo:** cada perfil ter **uma porta** óbvia.
- **Agente:** uma página curta (ou seção em `/planos`) com 3 portas: "Começar sozinho" (teste + Start), "Faça por mim" (Loja Pronta Express, contrato D276) e "Vim de outra plataforma" (migração, D226). Cada uma com preço real lido do catálogo (`getPriceBook`), nunca escrito à mão.
- **Pronto quando:** página no ar e usada nos roteiros da CM6.

### CM9. Retenção e crescimento da carteira (1 a 2 dias)
- **Objetivo:** nenhum pagante sai sem a gente saber antes.
- **Sistema:**
  - alerta na tela Agora: lojista pagante sem entrar há 7 dias, sem venda há 14 dias, pagamento falhou, pediu cancelamento;
  - roteiro de conversa de resgate e oferta de ajuda (não desconto automático);
  - sugestão de mudança de plano quando o lojista bate o limite (produtos, pessoas, IA, D247).
- **Métrica:** cancelamentos/mês; tempo até reagir a um alerta.

### CM10. Escala de parceiros (depois do 5º pagante)
- **Objetivo:** 10 parceiros ativos com o modelo validado na Ingrid.
- **Agente:** lista de micro influenciadoras e agências pequenas por nicho, convite com o caso da Ingrid, página `/parceiros` com depoimento dela.
- **Regra:** abrir a captação ampla só depois do **5º pagante** (recomendação já registrada em `docs/relatorios/REVISAO-DESLIGADOS-2026-10.md`); antes disso, só convites diretos.
- **Métrica:** parceiros com pelo menos 1 pagante no mês.

---

## Parte 4. Plano por departamento (todas as notas)

Formato: **nota de hoje → meta**, ações com código, critério de pronto. A ordem dentro de cada departamento já é a de prioridade.

### 4.1 Engenharia: 8,0 → 9,0
| ID | Ação | Pronto quando |
|---|---|---|
| EN1 | **Desacoplar a "Central oculta"** da loja comum (ADR-0002; Constituição art. 4): loja da Commerce existe sem fornecedor obrigatório. Fazer em passos com migração nova (nunca editar migração publicada), começando por ler o mapa dos 12 arquivos da auditoria | `orders.supplier_id`, `products.supplier_id` e `stores.network_id` aceitam vazio para lojas da Commerce; testes de pedido passam sem Central |
| EN2 | **Eventos de negócio** para pedido, pagamento e estoque (art. 22): um registro "aconteceu X" por fato, base para relatórios e integrações | Fatos principais gravados e lidos por um teste |
| EN3 | **Inventário do que está em pausa** (Brás, Cargas, SuperDrop, Club…): marcar no código o que está trancado, sem apagar; medir quanto do código é de frente em pausa | Documento curto e chaves conferidas |

### 4.2 Qualidade e testes: 7,5 → 8,5
| ID | Ação | Pronto quando |
|---|---|---|
| QA1 | **Bateria rápida** (`npm run testes:rapidos` ou equivalente) com os testes críticos (pedido, pagamento, estoque, acesso, preço) em menos de 5 minutos | Comando documentado e usado no dia a dia |
| QA2 | **Teste de concorrência em Postgres real** (dois compradores da última peça, número do pedido simultâneo), num Neon separado (pendência 7 do dono) | Teste verde em Postgres real |
| QA3 | **Conferência diária da produção**: roteiro curto de navegador (entrar, abrir loja, carrinho, painel) rodando sozinho e avisando o Master se quebrar | Aviso chega quando algo cai |
| QA4 | Prints de 360/768/1440 só nas telas mexidas (skill `qa-visual`), sem varrer tudo a cada rodada | Regra seguida nas entregas |

### 4.3 Segurança: 8,0 → 9,0
| ID | Ação | Pronto quando |
|---|---|---|
| SG1 | **Conferir as duas falhas restantes da auditoria de outubro**: distribuição de produto aceitando loja de outra rede; preço da grade abaixo do mínimo. Teste que prova cada uma corrigida | Dois testes verdes ou correção feita |
| SG2 | **Número do pedido sem erro em compras simultâneas** (contador atômico; a auditoria diz que a 2ª compra falha) | Teste da QA2 passa |
| SG3 | **Backup do Neon confirmado** e um ensaio de restauração em banco separado (pendência 1) | Restauração ensaiada e anotada |
| SG4 | **Assinatura do webhook do Mercado Pago** e cabeçalhos de segurança do navegador (ADR-0005) | Webhook sem assinatura válida é recusado (sem deixar de conferir na API) |

### 4.4 Pagamentos: 7,0 → 8,5
| ID | Ação | Pronto quando |
|---|---|---|
| PG1 | **Compra de ponta a ponta com Mercado Pago real** (credencial de teste do dono, pendência 4): assinatura de plano e compra na loja de um lojista | Duas compras conferidas e registradas no caixa |
| PG2 | **Conciliação semanal**: o que o Mercado Pago diz × o que o sistema registrou × Pix do contrato conferido no Itaú | Relatório sem diferença ou com a diferença explicada |
| PG3 | **Falha de pagamento vira ação** (alerta da CM9 e mensagem ao lojista) | Teste do caminho de falha |

### 4.5 Produto: 7,5 → 8,5
| ID | Ação | Pronto quando |
|---|---|---|
| PR1 | **"Sua loja está pronta para vender?"** (art. 30), a mesma da CM1 | Lista no painel do lojista e na ficha 360 |
| PR2 | **Primeira venda guiada**: depois dos passos verdes, um roteiro para conseguir o 1º pedido (avisar amigos, kit de divulgação, cupom de boas-vindas que já existe) | Lojista novo vê o roteiro |
| PR3 | **Ouvir os dois primeiros**: cada pedido deles vira item numa fila de melhorias com prazo; o que se repetir vira prioridade | Fila criada e respondida |

### 4.6 Visual e design: 7,5 → 8,5
| ID | Ação | Pronto quando |
|---|---|---|
| VI1 | **Congelar redesenhos de página pública** até o 10º pagante; só mudar o que o funil mostrar que trava (ex.: página com muita saída) | Regra registrada |
| VI2 | **Painel do lojista no celular**: conferir as 5 telas mais usadas pelo Anderson e pelo Bazar Prime em 360 px | Prints e ajustes |
| VI3 | **Casos reais e fotos reais** no lugar de imagem genérica onde houver autorização (CM2) | Fotos reais no ar |

### 4.7 Comercial: 5,0 → 8,0
Etapas CM0 a CM10 (Parte 3). **Meta da nota:** 7,0 com 5 pagantes e rotina diária; 8,0 com 10 pagantes, funil medido há 4 semanas e 3 parceiros com venda.

### 4.8 Foco e gestão: 5,0 → 8,0
| ID | Ação | Pronto quando |
|---|---|---|
| FG1 | **Limite de trabalho em andamento**: no máximo 1 etapa de código e 1 de operação abertas ao mesmo tempo (este plano) | Registro de andamento mostra só 2 "em andamento" |
| FG2 | **Nada de marca, tela pública nova ou rodada de imagens** sem passar por: "isso aproxima o 10º pagante?" | Regra aplicada nas próximas 10 decisões |
| FG3 | **Revisão de segunda-feira** (30 min): placar, funil da CM7, etapa da semana, pendências do dono | 4 segunda-feiras seguidas |
| FG4 | **Pendências do dono num lugar só** (`docs/fila/FILA-DO-DONO.md`) com prazo e impacto em pagantes | Lista atualizada |

### 4.9 Documentação: 9,0 → 9,5
| ID | Ação | Pronto quando |
|---|---|---|
| DO1 | **Relatório semanal de resultado** (1 página: pagantes, funil, o que foi entregue, o que travou) em `docs/relatorios/SEMANA-AAAA-MM-DD.md` | 4 semanas seguidas |
| DO2 | **Arquivo morto**: prompts concluídos ou adiados saem da fila ativa em `docs/prompts/README.md` para uma seção "arquivados" | Fila ativa com até 10 itens |
| DO3 | Trilha **Comercial** do Aprender com os roteiros, perfis e objeções das CM5 e CM6 | Aulas no ar |

### 4.10 Custo e operação: 7,0 → 8,5
| ID | Ação | Pronto quando |
|---|---|---|
| OP1 | **Rotinas automáticas ligadas** (`CRON_SECRET` + agendador, pendência 5): expirar reservas, lembretes, relatório da CM7 | Rotinas rodando e registradas |
| OP2 | **Minutos do Render** dentro de 500/mês (`docs/infra/RENDER-USO.md`): conferir no fim de cada semana | Mês fechado abaixo da meta |
| OP3 | **Aviso de queda** (QA3) e página de estado simples para o lojista | Aviso testado |

---

## Parte 5. Painel de notas: de onde saímos e aonde vamos

| Departamento | Hoje | Meta 30 dias | Meta 90 dias | Etapas que movem |
|---|---|---|---|---|
| Comercial | 5,0 | 6,5 | 8,0 | CM0–CM10 |
| Foco e gestão | 5,0 | 7,0 | 8,0 | FG1–FG4 |
| Pagamentos | 7,0 | 8,0 | 8,5 | PG1–PG3 |
| Custo e operação | 7,0 | 8,0 | 8,5 | OP1–OP3 |
| Produto | 7,5 | 8,0 | 8,5 | PR1–PR3 |
| Visual | 7,5 | 7,5 | 8,5 | VI1–VI3 |
| Qualidade | 7,5 | 8,0 | 8,5 | QA1–QA4 |
| Engenharia | 8,0 | 8,0 | 9,0 | EN1–EN3 |
| Segurança | 8,0 | 8,5 | 9,0 | SG1–SG4 |
| Documentação | 9,0 | 9,0 | 9,5 | DO1–DO3 |
| **Geral** | **7,0** | **7,7** | **8,6** | |

**Regra da nota:** só sobe com prova (print, teste verde, número no Master ou relatório). Nota não sobe porque "compilou".

---

## Parte 6. Decisões que dependem do dono (com recomendação)
| # | Pergunta | Recomendação |
|---|---|---|
| 6.1 | Aprovar este plano e a ordem da Parte 7? | Sim, começando por CM0, CM1 e CM4 nesta semana |
| 6.2 | Meta diária de contatos (CM6) | **20 por dia útil** por 2 semanas; reavaliar com a CM7 |
| 6.3 | Benefício para o lojista que indica (CM4) | **1 mês grátis por indicação que pagar** (estava na D226; a D260 simplificou parceiros, não o "cliente indica"; confirmar se continua valendo) |
| 6.4 | Quem faz os contatos diários | Dono + 1 executivo de rua (D273); a IA prepara a lista e as mensagens, a pessoa envia |
| 6.5 | Pedir depoimento ao Anderson e ao Bazar Prime | Sim, com termo de autorização simples; sem números de venda sem autorização |
| 6.6 | Captação ampla de parceiros | Só depois do **5º pagante**; até lá, convites diretos (Ingrid + até 3) |
| 6.7 | Congelar redesenhos públicos até o 10º pagante (VI1) | Sim |
| 6.8 | Pendências técnicas do dono: backup do Neon, credencial de teste do Mercado Pago, `CRON_SECRET`, Neon de teste | Resolver as quatro até 30/11; cada uma destrava uma etapa (SG3, PG1, OP1, QA2) |

---

## Parte 7. Ordem de execução e calendário

**Regra:** uma etapa de código e uma de operação por vez. As de operação o agente prepara (textos, listas, roteiros) e o dono executa.

| Semana | Operação (dono + agente) | Código (agente) |
|---|---|---|
| **13–16/11** | CM1 ligação com os dois · CM4 lista e mensagens da Black · CM3 conversa com a Ingrid | **CM0** placar real → **CM1/PR1** "pronta para vender?" |
| **17–23/11** | CM4 sequência da Black · CM2 depoimentos · CM5 perfis | **CM3** funil da parceira (se faltar) → **SG1/SG2** falhas de dinheiro |
| **24–30/11** | CM4 última semana da Black · CM6 começa a rotina diária | **CM6** "próximo toque" e fila "Ligar hoje" → **PG1** (com a credencial do dono) |
| **01–07/12** | CM6 diário · FG3 revisão de segunda | **CM7** relatório semanal → **OP1** rotinas automáticas |
| **08–21/12** | CM6 diário · CM8 portas de entrada | **CM9** alertas de retenção → **QA1/QA3** → **PR2** |
| **Janeiro** | CM10 parceiros (se 5 pagantes) | **EN1** Central oculta (em passos) → **EN2** eventos → **SG3/SG4** → **PG2** |

**Se o tempo apertar, a ordem é:** CM0 → CM1/PR1 → CM4 → SG1/SG2 → CM6 → CM7 → PG1 → CM9 → o resto.

---

## Parte 8. Prompt engenheiro mestre

> Cole este bloco no início de cada sessão de trabalho, trocando `<ETAPA>` pelo ID da próxima etapa do Registro de andamento (ou deixe em branco para pegar a próxima da fila).

```
Você vai executar UMA etapa do plano mestre comercial e de notas da NextLevel Commerce.

ETAPA: <ETAPA>   (ex.: CM0, CM1/PR1, SG1. Em branco = a próxima "a fazer" da Parte 9, na ordem da Parte 7)

## 1. Ler antes de tudo (nesta ordem)
1. CLAUDE.md e AGENTS.md (pilha, comandos, regras, branch, custo do Render, "testes enxutos").
2. docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md, se a etapa mexer em dados, pedidos, pagamentos, estoque ou permissões.
3. docs/prompts/plano-mestre-comercial-e-notas.md inteiro: a seção da etapa (Parte 3 ou 4), a Parte 6 (decisões do dono) e a Parte 9 (registro).
4. As decisões citadas na etapa em docs/design/DECISIONS.md.
5. O código que a etapa cita. Procure e ESTENDA o que existe (regra anti-duplicação): situacao-comercial, funil, ficha 360, CRM de parceiros, bônus, contratos, caixa, Agora, "Precisa de você agora".

## 2. Relatar primeiro (antes de escrever código)
Em português simples, sem jargão, mande ao dono em até 10 linhas:
- o que a etapa vai entregar e como ele vai ver (qual tela, qual print);
- o que já existe e será reaproveitado;
- o que depende dele (dados, autorização, credencial). Se depender e ele ainda não respondeu, use a recomendação da Parte 6, registre e siga.
Não espere resposta para seguir, a não ser que a etapa mexa em dinheiro de cliente real, apague dado ou mude preço.

## 3. Executar
- Só a etapa pedida. Nada de "aproveitar para" mexer em outra coisa.
- Etapa [sem código]: produza o material (roteiros, listas, textos, perfis) em docs/comercial/ e, quando for útil para a equipe, uma aula no Aprender.
- Etapa com código: domínio em src/lib/domain/* com runAction e permissões no servidor; valores em centavos; regra configurável em platform_settings; página com banco declara `export const dynamic = "force-dynamic"`; textos em português claro e SEM promessa de ganho; acessibilidade AA e sem rolagem horizontal em 360 px.
- Mudou src/db/schema.ts: `npx drizzle-kit generate --name <assunto>` e commite drizzle/. Nunca edite migração publicada.
- Mudança de comportamento exige teste (Vitest). Tela nova ou alterada: roteiro em e2e/ quando fizer sentido.
- Clientes reais (Anderson, Bazar Prime Outlet, Ingrid): nunca use os dados deles em demonstração, print público ou texto sem autorização do dono.

## 4. Conferir (testes enxutos)
- `npx tsc --noEmit`, `npx eslint src e2e tests` e os testes dos arquivos mexidos.
- Etapa grande (banco, pagamento, pedido): bateria completa e `npm run build` antes de publicar.
- Print real no navegador (Playwright) da principal mudança, 1440 e 390 px.

## 5. Registrar
- Decisão nova em docs/design/DECISIONS.md (próximo número livre), título com a frente: "## Dxxx — [E-commerce] ...".
- Citar a decisão em docs/conhecimento/BC0-INVENTARIO.md (uma linha "> **Assunto (Dxxx):** ..." em linguagem de equipe) e rodar `node scripts/gerar-novidades.mjs`.
- Atualizar a Parte 9 deste plano: estado da etapa, data, decisão, prova (print/teste/número) e a nota do departamento se ela mudou com prova.
- Atualizar CLAUDE.md "(próxima: Dxxx)".

## 6. Publicar
- Branch de trabalho indicada na sessão; `git pull --rebase` antes do push; nunca force push.
- Commit em português. Commit só de documentos leva `[skip render]`. Junte documentos e código numa publicação só. No máximo 3 publicações de código por dia.

## 7. Entregar ao dono (mensagem curta)
- O que ficou pronto (2 a 4 linhas) + print.
- O que depende dele.
- Placar: "X de 10 pagantes" e a nota do departamento (de → para), só se mudou com prova.
- Próxima etapa da fila.
- Linha "Esforço do dia por frente: E-commerce 100%".
```

### Critérios gerais de aceite (valem para toda etapa)
1. Nada duplicado: se já havia tela, tabela ou regra, ela foi estendida.
2. Números do Master batem com a realidade informada pelo dono.
3. Nenhum texto promete ganho; comparação com concorrente sempre com fato (D261).
4. Segredos nunca em tela, log ou e-mail.
5. Print real enviado ao dono.
6. Registro de andamento atualizado.

---

## Parte 9. Registro de andamento

Estados: `a fazer` · `em andamento` · `feito` · `esperando o dono` · `adiado`.

| ID | Etapa | Tipo | Estado | Data | Decisão | Prova |
|---|---|---|---|---|---|---|
| CM0 | Placar real | código | a fazer | | | |
| CM1 / PR1 | Sucesso dos dois primeiros + "pronta para vender?" | operação + código | a fazer | | | |
| CM2 | Casos reais | operação + página | esperando o dono (autorização) | | | |
| CM3 | Ingrid piloto | operação | a fazer | | | |
| CM4 | Black até 30/11 | operação | a fazer (urgente) | | | |
| CM5 | Perfil do cliente ideal | operação | a fazer | | | |
| CM6 | Prospecção ativa | operação + código | a fazer | | | |
| CM7 | Funil medido | código | a fazer | | | |
| CM8 | Portas de entrada | página | a fazer | | | |
| CM9 | Retenção | código | a fazer | | | |
| CM10 | Escala de parceiros | operação | adiado (até o 5º pagante) | | | |
| EN1 | Desacoplar a Central oculta | código | a fazer | | | |
| EN2 | Eventos de negócio | código | a fazer | | | |
| EN3 | Inventário do que está em pausa | documento | a fazer | | | |
| QA1 | Bateria rápida | código | a fazer | | | |
| QA2 | Concorrência em Postgres real | código | esperando o dono (Neon de teste) | | | |
| QA3 | Conferência diária da produção | código | a fazer | | | |
| QA4 | Prints só nas telas mexidas | regra | a fazer | | | |
| SG1 | Duas falhas da auditoria | código | a fazer | | | |
| SG2 | Número do pedido simultâneo | código | a fazer | | | |
| SG3 | Backup do Neon e ensaio | operação | esperando o dono | | | |
| SG4 | Assinatura do webhook e cabeçalhos | código | a fazer | | | |
| PG1 | Mercado Pago de ponta a ponta | código + operação | esperando o dono (credencial) | | | |
| PG2 | Conciliação semanal | código | a fazer | | | |
| PG3 | Falha de pagamento vira ação | código | a fazer | | | |
| PR2 | Primeira venda guiada | código | a fazer | | | |
| PR3 | Fila de pedidos dos clientes reais | operação | a fazer | | | |
| VI1 | Congelar redesenhos | regra | esperando o dono | | | |
| VI2 | Painel do lojista no celular | código | a fazer | | | |
| VI3 | Fotos e casos reais | página | esperando o dono | | | |
| FG1–FG4 | Gestão e foco | regra | a fazer | | | |
| DO1–DO3 | Relatório semanal, arquivo morto, trilha Comercial | documento | a fazer | | | |
| OP1 | Rotinas automáticas | código + operação | esperando o dono (`CRON_SECRET`) | | | |
| OP2 | Minutos do Render | operação | a fazer | | | |
| OP3 | Aviso de queda | código | a fazer | | | |

**Placar:** 2 de 10 pagantes · 1 parceira ativa · nota geral 7,0 (13/11/2026).
