# Estudo de mercado: apps de gestão de academia e de relacionamento com o aluno

> **Pedido do dono (14/11/2026):** investigar os melhores apps de gestão de academias e de gestão dos alunos, com funções diferenciadas que a NextLevel consiga lançar com facilidade, para criar um produto novo. Cliente em potencial: **uma unidade da rede Runner** (São Paulo). Estender a **comunidade de clientes** para todos os clientes da NextLevel, não só academias. Comparar dois modelos: (A) parceria, em que o aluno usa o app de graça e paga só os adicionais; (B) white label vendido à academia, com a NextLevel ficando com uma taxa de serviço e hospedagem.
>
> **Estado:** estudo e recomendação. Nada foi decidido nem programado. Se o dono aprovar, vira decisão em `docs/design/DECISIONS.md` e um prompt em `docs/prompts/`.
>
> **Frente:** `[E-commerce]` se for tratado como um segmento da NextLevel Commerce (academia = lojista com loja e clube), que é o que este estudo recomenda (seção 8). Tratado como produto novo e separado, seria `[Grupo]` e cairia nos 15% da regra 60/25/15 (D174).

---

## 1. Resumo em 10 linhas

1. **Não brigue com os sistemas de gestão** (Tecnofit, EVO/W12, Pacto, Next Fit). Eles fazem cobrança recorrente, contrato, catraca e financeiro. Isso é pesado, cheio de integração com hardware e já está resolvido. A unidade da Runner quase certamente já usa um deles.
2. **O espaço livre é a camada de cima:** engajamento, comunidade, loja, clube de vantagens e venda de adicionais. É aí que a academia perde dinheiro hoje: a evasão média fica entre **40% e 60% ao ano** (ACAD Brasil).
3. **A NextLevel já tem 70% dessa camada pronta** no motor: loja (Commerce), pontos, indicações, vales, carteirinha e ranking (Club, D112 a D119), serviços e assinaturas, CRM, assistente de IA, rastreio de origem do contato.
4. **App de marca própria é caro lá fora:** é adicional pago ou só nos planos mais altos (Circle Plus, Mighty Pro, Virtuagym). Oferecer marca própria barata é um diferencial real.
5. **Recomendação:** um modelo **híbrido**, começando por um **piloto em parceria** na unidade Runner e virando **white label com mensalidade baixa + participação nas vendas** depois que o piloto provar resultado. Detalhes na seção 8.
6. O argumento de venda não é "mais um app", é **"o app que segura aluno e paga a própria conta"**.
7. A comunidade vira o **Clube NextLevel**: uma carteirinha e um saldo de pontos que valem em academias, lojas da plataforma e parceiros do grupo, estendendo o Club que já existe (sem tabela nova).
8. Primeiro passo prático: uma conversa de 30 minutos com a unidade, com as perguntas da seção 10.

---

## 2. Tamanho do mercado no Brasil

| Dado | Número | Fonte e confiança |
|---|---|---|
| Centros de atividade física ativos | 22.581 (2015) → **62.718 (2025)**; 72% são academias | Panorama Setorial Fitness Brasil 2025 (boa) |
| Academias no Brasil | **41.332**, 3º país do mundo | HFA Global Report 2025 (boa) |
| Faturamento anual das academias | cerca de **R$ 17 bilhões** | Panorama Setorial 2024 (boa) |
| Alunos matriculados | "mais de 15 milhões" | Reportagem de 2025, estudo não citado (fraca) |
| Evasão média anual | **40% a 60%** | ACAD Brasil, citada em reportagem de 2026 (boa) |
| Agregadores | Wellhub com 3 milhões de usuários; TotalPass forte no varejo | Imprensa 2025/2026 |

**Leitura:** mercado enorme, pulverizado e com um problema caro e conhecido (evasão). Redes grandes (Smart Fit com mais de 2.000 unidades, Bodytech com o BTFIT, Panobianco com mais de 400) já têm app próprio. **A oportunidade está nas redes médias, unidades franqueadas e academias de bairro**, que não têm verba para desenvolver app.

### Sobre a Runner
Rede de São Paulo. Unidades encontradas em páginas públicas: **Cursino** (Av. do Cursino, 4172), **Freguesia do Ó** (R. Chicó de Paula, 365) e **Top Center** (Av. Paulista). Está no **Wellhub** (plano Silver) e no **TotalPass** (a partir do TP2+), com nota 4,77 em 364 avaliações na unidade Cursino. Não achei app próprio da rede nem o sistema de gestão que ela usa. **Isso precisa ser perguntado à unidade** (seção 10), porque muda tudo: unidade de rede pode estar presa ao sistema e às regras de marca da franqueadora.

---

## 3. Quem é quem no mercado

O mercado se divide em cinco grupos. Só os dois primeiros são concorrentes diretos.

### 3.1 Sistemas de gestão brasileiros (cobrança, contrato, catraca, financeiro)

| Sistema | Para quem | Preço praticado | App do aluno |
|---|---|---|---|
| **Tecnofit** | Academias, box de cross, estúdios | Por aluno ativo: **média de R$ 3,38 por aluno/mês**; faixa de 50 alunos a **R$ 269/mês + implantação** (site oficial) | Sim; app de marca própria (white label) com guia de implantação, preço sob consulta |
| **EVO (W12)** | Redes e academias médias/grandes | Sob consulta, por unidade e módulo. Estimativa de terceiros: **R$ 1.500 a R$ 6.500/mês** por rede (fonte fraca) | Sim; também faz a página de venda de planos com checkout |
| **Pacto Soluções** | Redes grandes | Sob consulta | Sim; tem estudo de gamificação com 11 mil alunos (SBC, 2025) |
| **Next Fit** | Pequenas e médias | Sob consulta via demonstração (as fontes se contradizem) | Sim |
| **MFIT Personal** | Personal trainer | App grátis; assinatura cresce com o número de alunos | Treino, anamnese, avaliação, cobrança, IA na prescrição. Sem white label conhecido |

### 3.2 Plataformas internacionais (referência de recursos e preço)

| Plataforma | Preço (US$/mês) | App de marca própria |
|---|---|---|
| **Mindbody** (ABC Fitness) | cerca de **99 a 699**, por unidade, conforme plano | Adicional, sob consulta |
| **ABC Glofox** | a partir de cerca de **99 a 110**; precisa de demonstração | Ponto forte: é o mais citado para app de marca |
| **ABC Trainerize** | sob consulta | App de marca para treino e acompanhamento online |
| **PushPress** | **grátis** ou **159** | Sim (planos pagos) |
| **Gymdesk** | planos a partir de cerca de 79 | **Adicional de US$ 39/mês** |
| **FitBudd** | **149/mês + 75 de implantação** | Sim, no plano mais alto |
| **Arvo** | a partir de **€ 99/mês** | Diz incluir desde o primeiro dia (afirmação do próprio fornecedor) |
| **Virtuagym** | sob consulta | Adicional pago |

### 3.3 Agregadores (não são software, são canal de venda)

| Agregador | Quanto a academia recebe | Observação |
|---|---|---|
| **Wellhub** (ex-Gympass) | Relatos de **R$ 8 a R$ 25 por check-in**, até R$ 35 em contratos específicos; houve caso de R$ 9,90 | Sem tabela pública; em 2026 academias de bairro começaram a sair por achar o repasse baixo |
| **TotalPass** | Relatos de **R$ 16 a R$ 37 por check-in** (ex.: R$ 21,67 no TP3, depois R$ 16,42) | Cadastro sem custo, paga desde a primeira visita |

**Por que importa:** a Runner está nos dois. Aluno de agregador **não é aluno da academia**: ela não tem o contato nem a relação. Um app com comunidade e clube é o jeito de **transformar o aluno de agregador em aluno direto** (ou, ao menos, em comprador da loja da academia).

### 3.4 Plataformas de comunidade (referência para o "Clube NextLevel")

| Plataforma | Preço (US$/mês) | App de marca própria |
|---|---|---|
| **Circle** | **89** (Professional) / **199** (Business), anual | Só no **Circle Plus**, sob consulta (a partir de cerca de 360) |
| **Mighty Networks** | a partir de **79** | Só no **Mighty Pro**, relatos de cerca de **US$ 30 mil/ano** + taxa sobre vendas |
| **Skool** | **9** (com 10% de taxa nas vendas) / **99** (2,9%) | Não tem; só o app compartilhado da Skool |

**Leitura:** app de marca própria com comunidade custa no mínimo algumas centenas de dólares por mês lá fora. Para uma academia de bairro brasileira isso é inviável. **A NextLevel pode entregar comunidade + loja + clube com a marca da academia por uma fração disso**, porque o motor é um só para todas as marcas.

### 3.5 Apps de treino e corrida (concorrem pela atenção do aluno)
Strava (clubes e desafios de corrida), apps de relógio (Apple Saúde, Google Fit, Garmin) e apps de treino com IA. **Não brigue com eles: integre.** Uma rede chamada **Runner** tem afinidade natural com corrida: grupo de corrida da unidade, desafio de quilômetros do mês e ranking são diferenciais de baixo custo.

---

## 4. O que os melhores fazem e o que ninguém faz bem

| Recurso | Quem faz bem | Situação no mercado brasileiro |
|---|---|---|
| Ficha de treino no app, com vídeo | Tecnofit, EVO, MFIT, Trainerize | Comum; não diferencia sozinho |
| Agendamento de aula e vagas | Glofox, Mindbody, Tecnofit | Comum em estúdio; menos em academia de musculação |
| Cobrança recorrente e contrato | Todos os sistemas de gestão | Resolvido; **não refazer** |
| App com a marca da academia | Glofox, Tecnofit, Arvo | Caro ou sob consulta |
| **Loja da academia no app** (suplemento, roupa, garrafa) com retirada na recepção | Pouquíssimos | **Lacuna. A NextLevel já tem o motor de loja** |
| **Clube de vantagens com parceiros do bairro** | Raro em academia | **Lacuna. O Club já tem carteirinha, pontos e vales** |
| **Comunidade da unidade** (avisos, grupos, eventos, corrida) | Circle/Skool fora do fitness | Lacuna em academia |
| **Pontos por frequência e indicação** trocados por desconto | Pacto estuda; poucos entregam | **O Club já tem pontos, indicações e vales** |
| **Alerta de aluno sumido** com mensagem pronta no WhatsApp | Sistemas grandes têm relatórios; poucos têm ação | O CRM da NextLevel já tem acompanhamento e origem do contato |
| Assistente de IA para dúvidas de treino e da academia | Começando (MFIT na prescrição) | A NextLevel já tem conversas de IA |
| Venda de adicionais (avaliação física, nutri, personal online, aula especial, day use para amigo) | Espalhado | O motor tem serviços, pedidos de serviço, assinaturas e liberações |
| Personal trainers da unidade com vitrine e cobrança | MFIT (fora da academia) | Lacuna: o personal hoje cobra por fora |

---

## 5. Funções diferenciadas que a NextLevel lança com facilidade

Ordenadas da mais fácil para a mais difícil. "Já existe" aponta o que o motor tem hoje (regra anti-duplicação: **estender, não criar de novo**).

| # | Função | O que o aluno vê | Já existe no motor | Esforço |
|---|---|---|---|---|
| 1 | **Página e app (PWA) com a marca da unidade** | Instala pelo navegador, ícone da academia | Temas, `getBrand()`, páginas públicas; PWA está na fila de integrações | Baixo |
| 2 | **Loja da academia** com retirada na recepção ou entrega | Compra whey, camiseta, garrafa pelo app | Loja completa da NextLevel Commerce, cupons, Mercado Pago | Baixo |
| 3 | **Indique um amigo** com aula grátis e pontos | Link pessoal; ganha pontos quando o amigo se matricula | `club_referrals`, `partner_links`, origem do contato | Baixo |
| 4 | **Pontos e vales** (frequência, indicação, compra) | Saldo, extrato, troca por desconto na loja ou na mensalidade | `club_ledger`, `club_vouchers`, regras configuráveis | Baixo |
| 5 | **Carteirinha digital e clube de vantagens** com parceiros do bairro (lanchonete, fisioterapia, loja de tênis) | Mostra a carteirinha e ganha desconto | `club_cards`, balcão do parceiro (`club/balcao.ts`) | Baixo/médio |
| 6 | **Desafios e ranking** (quilômetros do mês, frequência, "30 dias sem faltar") | Ranking da unidade, medalhas | `partner_challenges`, `club/ranking.ts` | Médio |
| 7 | **Mural da unidade** (avisos, eventos, grupo de corrida, horários de pico) | Feed com fotos e vídeos curtos | `content_items` e o feed de vídeo da Brás | Médio |
| 8 | **Adicionais pagos** (avaliação física, consulta com nutricionista, personal online, aula especial, armário, day use para amigo) | Compra e agenda pelo app | `services`, `service_orders`, `subscriptions`, `entitlements` | Médio |
| 9 | **Alerta de aluno sumido** para a recepção, com mensagem pronta no WhatsApp | (Do lado da academia) | `crm_acompanhamento` | Médio |
| 10 | **Vitrine dos personal trainers da unidade** com cobrança pelo app e taxa para a academia | Escolhe e contrata o personal | `partners` (como um novo `kind`), comissões | Médio |
| 11 | **Assistente de IA** da academia (horários, regras, dúvidas de treino com aviso de procurar o professor) | Conversa no app | `ia_conversas`, `ia_mensagens` | Médio |
| 12 | Integração com o sistema de gestão (EVO, Tecnofit, Pacto) para saber quem é aluno ativo e a frequência | Entra com o mesmo CPF | Novo: depende da API do sistema que a unidade usa | Alto |
| 13 | Integração com relógio e apps de corrida (Strava, Apple Saúde, Google Fit) | Quilômetros entram sozinhos no desafio | Novo | Alto |
| 14 | App nativo nas lojas Apple e Google com a marca da academia | Baixa na loja | Novo; custo de conta e publicação por cliente | Alto |

**Para o piloto, bastam 1 a 6 + 9.** Frequência pode começar manual (QR code na recepção dá pontos) até existir a integração (12).

**O que não fazer:** cobrança da mensalidade, contrato, catraca e ficha de treino completa. O sistema de gestão da academia já faz; refazer é caro e cria atrito com o fornecedor dela.

---

## 6. A comunidade para todos os clientes da NextLevel

O pedido é que a comunidade não seja só da academia. O desenho que encaixa no motor:

- **Um Clube NextLevel, várias comunidades.** Cada cliente (academia, lojista, fornecedor, Brás) tem a **sua** comunidade com a **sua** marca. O aluno da Runner vê "Clube Runner Cursino"; o cliente de uma loja vê "Clube da Loja X".
- **Um saldo que circula (opcional, por adesão).** Pontos ganhos numa comunidade podem valer em parceiros de outra, se os dois toparem. Ex.: aluno da academia ganha desconto numa loja de roupa fitness da plataforma; a loja ganha cliente novo; a academia ganha um benefício para oferecer sem gastar nada.
- **Cada tenant continua isolado.** A comunidade da academia nunca vê dados de outra (regra da Constituição). O que circula é só o benefício, com consentimento do cliente.
- **Base técnica:** o Club já tem perfis, pontos, indicações, vales, carteirinha, ranking, balcão do parceiro e acerto entre empresas (`club_*`). Hoje ele nasceu para a Brás; o trabalho é **tirar a amarra de marca** e deixá-lo servir qualquer loja e qualquer marca, sem tabelas novas.
- **Ganho para a NextLevel:** cada academia traz centenas ou milhares de consumidores para dentro do ecossistema, e esses consumidores viram público das lojas da plataforma. **É um canal de aquisição de lojistas**: "coloque sua loja no clube e chegue a 2.500 alunos da academia do bairro".

---

## 7. Os dois modelos que o dono propôs, comparados

### Modelo A: parceria (app grátis para o aluno, receita nos adicionais)

| A favor | Contra |
|---|---|
| Entrada fácil: a academia não paga nada | Quem cobra o aluno é a NextLevel, e o aluno é da academia: risco de conflito (a academia quer vender o próprio personal, a própria avaliação) |
| Aluno testa sem barreira | Conversão de app grátis para pago costuma ser baixa (poucos por cento); a receita depende de volume |
| | A NextLevel assume suporte ao consumidor final (muitas pessoas, ticket baixo) |
| | A receita só aparece se a academia divulgar, e ela não tem motivo forte para isso |

### Modelo B: white label vendido à academia (taxa de serviço e hospedagem)

| A favor | Contra |
|---|---|
| Receita previsível e cliente com nome e CNPJ | A academia precisa tirar dinheiro do bolso antes de ver resultado; venda mais lenta |
| A academia vende, a academia divulga: incentivo alinhado | Unidade de rede pode precisar de autorização da franqueadora |
| Suporte é para a academia, não para milhares de alunos | App nativo nas lojas tem custo e trabalho por cliente |
| Escala: o mesmo motor serve 1 ou 500 academias | |

### Simulação de uma unidade (todos os números são hipóteses para conferir com a Runner)

Premissas: **2.500 alunos**, mensalidade média de **R$ 130**, evasão de **50% ao ano**.

| Fonte de receita | Conta | Por mês |
|---|---|---|
| **Modelo A**: 5% assinam um adicional de R$ 19,90 | 125 × R$ 19,90 | cerca de R$ 2.490 brutos, divididos com a academia |
| **Loja da academia**: 3% compram R$ 120 por mês | 75 × R$ 120 = R$ 9.000 em vendas | taxa de 10% = R$ 900 para a NextLevel |
| **Modelo B**: mensalidade de hospedagem | fixa | R$ 497 |
| **Valor para a academia: evasão** cai de 50% para 45% | 125 alunos a mais ficam, em média, 6 meses × R$ 130 | cerca de **R$ 97 mil por ano** que a academia deixa de perder |

**A conclusão da tabela:** o dinheiro grande não está no adicional cobrado do aluno; está na **evasão que a academia evita** e no **volume da loja e do clube**. Por isso a conta tem que ser vendida para a academia (ela é quem ganha os R$ 97 mil), e a NextLevel fica com uma parte pequena e recorrente disso.

---

## 8. Recomendação: híbrido, em três etapas

**Nem A puro, nem B puro.** O modelo que faz o negócio acontecer:

### Etapa 1: piloto em parceria na unidade Runner (90 dias)
- **Custo para a academia: zero de mensalidade.** Em troca: divulgação na recepção e nos grupos, acesso a números de frequência e evasão (antes e depois) e permissão para usar o caso como vitrine.
- Entram as funções 1 a 6 e 9 da seção 5 (PWA com a marca, loja, indicação, pontos, carteirinha, desafios, alerta de aluno sumido).
- **A NextLevel só ganha a taxa sobre as vendas** da loja e dos adicionais (10% a 15%). O resto fica com a academia.
- **Meta combinada por escrito:** por exemplo, 30% dos alunos com o app instalado, X indicações convertidas e evasão do trimestre menor que a do mesmo trimestre do ano anterior.

### Etapa 2: white label com mensalidade baixa + participação (depois do piloto)
- **Mensalidade de hospedagem por unidade**, em faixas por número de alunos (sugestão inicial, a validar): **R$ 297** (até 800 alunos), **R$ 497** (até 2.500), **R$ 797** (acima disso). Referência: a Tecnofit cobra cerca de R$ 3,38 por aluno só para gestão; o Gymdesk cobra US$ 39 só pelo app de marca.
- **Taxa de serviço sobre o que é vendido no app** (loja, adicionais, personal): **8% a 12%**, menor que um marketplace e cobrindo pagamento, suporte e hospedagem.
- **A academia define os preços dos adicionais e fica com a maior parte.** É isso que faz a academia **lucrar** e divulgar.
- Implantação: grátis para quem fecha 12 meses; cobrada para quem quer mensal.
- App nativo nas lojas Apple/Google: **adicional pago**, só para quem pedir (a maioria fica bem com o PWA).

### Etapa 3: rede e clube
- Com o caso da unidade, apresentar à **franqueadora da Runner** a proposta para todas as unidades (desconto por volume).
- Abrir o **Clube NextLevel** entre academias e lojas da plataforma: o aluno vira cliente das lojas e o lojista ganha um motivo para entrar na NextLevel Commerce.

### Por que esse caminho
1. **Tira a barreira de entrada** (piloto sem custo), mas **não transforma a NextLevel em vendedora de app para consumidor final**.
2. **Quem ganha mais é a academia**, então ela divulga. Sem divulgação, nenhum dos dois modelos funciona.
3. **Receita recorrente e previsível** para a NextLevel a partir da etapa 2.
4. **Alinha com a regra de foco:** a academia entra como **lojista da NextLevel Commerce** (tem loja, clube e assinatura). Cada academia pagante conta para os **10 lojistas pagantes**. Não é uma frente nova competindo com a E-commerce; é um segmento dela.
5. **Usa o que já existe:** loja, Club, serviços, assinaturas, CRM, IA. O trabalho novo é sobretudo adaptar telas e tirar a amarra do Club da marca Brás.

---

## 9. Riscos e cuidados

| Risco | Como tratar |
|---|---|
| A unidade é franquia e não pode ter app próprio | Perguntar antes de tudo (seção 10); se não puder, o produto vira "clube e loja da unidade" sem a marca Runner no ícone |
| O sistema de gestão da unidade não tem API aberta | Começar com check-in por QR code na recepção e lista de alunos por planilha; integrar depois |
| Saúde e dados sensíveis (avaliação física, nutri) | LGPD: consentimento explícito, dado de saúde só com quem precisa; IA nunca prescreve, só orienta e indica o professor |
| Promessa de resultado | Sem promessa de ganho ou de emagrecimento nos textos (regra do projeto) |
| Conflito com personal trainers da casa | Trazê-los para dentro (vitrine dos personal, função 10) em vez de competir |
| Suporte ao aluno | Primeiro nível na recepção da academia + IA; a NextLevel atende a academia |
| Distração do foco E-commerce | Piloto limitado a 90 dias e às funções que já existem; nada de app nativo ou integração pesada antes de 2 academias pagantes |

---

## 10. Perguntas para a conversa com a unidade Runner

1. A unidade é franquia ou própria da rede? A rede permite app ou clube próprio da unidade?
2. Qual sistema de gestão usam hoje (EVO/W12, Tecnofit, Pacto, Next Fit, outro)? Tem app do aluno? O que os alunos acham dele?
3. Quantos alunos ativos? Quantos vêm do Wellhub e do TotalPass?
4. Qual a evasão mensal ou anual que eles medem? Como tentam segurar o aluno hoje?
5. Vendem algo além da mensalidade (suplemento, roupa, avaliação, personal)? Quanto por mês?
6. Têm grupo de corrida ou eventos? Usam grupo de WhatsApp com alunos?
7. Quem são os parceiros do bairro que topariam dar desconto aos alunos?
8. Quem decide e quem vai operar (recepção, gerente, dono)?

---

## 11. Próximos passos sugeridos

1. Dono faz a conversa da seção 10 (30 minutos) e traz as respostas.
2. Com as respostas, registrar a decisão (próxima livre em `DECISIONS.md`) e escrever o prompt por fases em `docs/prompts/academia-clube-comunidade.md` (fases: Club sem amarra de marca → PWA e loja da unidade → pontos por check-in → desafios e mural → alerta de aluno sumido → adicionais e personal).
3. Montar uma demonstração com a marca da unidade (tema + loja + carteirinha) para mostrar na segunda conversa, antes de programar qualquer integração.

---

## Fontes

- Tecnofit, preços oficiais: https://www.tecnofit.com.br/precos/
- Sistemas para academia (Nota Gateway): https://notagateway.com.br/blog/sistemas-para-academia/
- CRM para academia no Brasil (Zoye): https://www.zoye.io/blog/crm-para-academia
- TI para academias, estimativas de EVO e Tecnofit (fonte fraca): https://encontreumnerd.com.br/artigos/empresa-de-ti-terceirizada/empresa-de-ti-terceirizada-academias-estudios-tecnofit-evo-pme-brasil-2026
- Custo de software de academia 2026 (Gymdesk): https://gymdesk.com/blog/gym-management-software-cost
- Melhores apps de membros 2026 (Gymdesk): https://gymdesk.com/blog/best-gym-member-apps
- Preços de software de academia (Costbench): https://costbench.com/software/gym-management/
- Alternativas ao Mindbody (PushPress): https://www.pushpress.com/blog/7-best-mindbody-alternatives-for-gym-owners-in-2026
- Alternativa ao Glofox (FitBudd): https://www.fitbudd.com/best-glofox-alternative
- Glofox x Mindbody (G2): https://g2.com/compare/abc-glofox-vs-mindbody
- Arvo para academias: https://arvo.guru/pt-BR/for-gyms e https://arvo.guru/pt-BR/vs/virtuagym
- Circle, preços 2026: https://schoolmaker.com/blog/circle-so-pricing
- Mighty Networks, alternativas e preços: https://www.choicely.com/blog/mighty-networks-alternatives
- Skool x Circle x Mighty: https://app.unilink.us/blog/skool-vs-circle-vs-mighty-networks-2026
- MFIT Personal (App Store): https://apps.apple.com/BR/app/id1283273690
- Wellhub, Runner Cursino: https://wellhub.com/pt-br/search/partners/runner-cursino-vila-moraes-sao-paulo
- Wellhub, Runner Freguesia do Ó: https://wellhub.com/pt-br/search/partners/runner-freguesia-do-o-freguesia-do-o-sao-paulo
- TotalPass, Runner: https://totalpass.com/br/academias/runner/
- Quanto a academia recebe por check-in: https://www.remessaonline.com.br/blog/quanto-academia-recebe-por-check-in/
- Wellhub e TotalPass para academias (Seu Dinheiro): https://www.seudinheiro.com/2026/seu-negocio/wellhub-e-totalpass-vale-a-pena-para-as-academias-estar-nos-aplicativos/
- Academias de bairro saindo das plataformas (Correio): https://www.correio24horas.com.br/salvador/fim-do-gympass-academias-de-bairro-rompem-com-plataformas-e-tendencia-cresce-no-pais-0226
- Mercado de academias, dados e tendências (Sebrae PR): https://sebraepr.com.br/impulsiona/mercado-de-academias-no-brasil-dados-e-tendencias/
- Retenção de alunos (Estado de Minas, 2026): https://www.em.com.br/networking-e-negocios/2026/07/7469486-retencao-de-alunos-vira-novo-campo-de-batalha-das-academias-no-brasil.html
- Mercado fitness cresce 170% em 10 anos (Correio): https://www.correio24horas.com.br/brasil/mercado-fitness-cresce-170-em-10-anos-e-academias-apostam-em-acolhimento-para-reter-alunos-0726
- Gamificação personalizada com dados da Pacto (SBC): https://sol.sbc.org.br/index.php/erigo/article/download/39535/39307
- Smart Fit com 2 mil unidades: https://mercadoeconsumo.com.br/31/12/2025/servicos/smart-fit-chega-a-2-mil-unidades-e-acelera-expansao-no-brasil-e-no-exterior/
- Bodytech e o BTFIT: https://mundodomarketing.com.br/bodytech-reposiciona-marca-e-planeja-dobrar-rede-de-academias-em-cinco-anos

> Preços de fornecedores mudam e muitos são sob consulta. Valores de blogs de concorrentes estão marcados como estimativa. Antes de fechar preço com a Runner, vale pedir uma cotação real à Tecnofit e à W12 como referência.
