# Estudo de mercado: academias, captação de alunos, app do aluno e comunidade (versão 2)

> **Pedido do dono, 1ª rodada (14/11/2026):** investigar os melhores apps de gestão de academias e de gestão dos alunos, com funções diferenciadas que a NextLevel consiga lançar com facilidade, para criar um produto novo. Cliente em potencial: **uma unidade da rede Runner** (São Paulo). Estender a **comunidade de clientes** para todos os clientes da NextLevel. Comparar (A) parceria, com app grátis para o aluno, que paga só os adicionais, e (B) white label vendido à academia, com a NextLevel ficando com uma taxa de serviço e hospedagem.
>
> **Pedido do dono, 2ª rodada (14/11/2026):** aprofundar e reanalisar. **O primeiro cliente é uma academia de rede que abre as portas em 10 dias.** A dor dela talvez seja **captar novos alunos (leads)**; um produto que resolva isso pode trazer muitos clientes. **Não desfazer a proposta anterior: melhorar e ter mais diferenciais.**
>
> **Estado:** estudo e recomendação. Nada foi decidido nem programado. Se o dono aprovar, vira decisão em `docs/design/DECISIONS.md` e um prompt em `docs/prompts/`.
>
> **Frente:** `[E-commerce]`. A academia entra como **lojista da NextLevel Commerce** (página, loja, captação e clube) e conta para a meta dos 10 lojistas pagantes (D174). O mesmo motor de captação serve qualquer negócio local (seção 12).

---

## 0. O que mudou da versão 1 para a versão 2

| Versão 1 | Versão 2 (esta) |
|---|---|
| Foco na **retenção**: app do aluno, clube, loja, pontos, comunidade | **Captação vira a porta de entrada.** Retenção e clube continuam, como a segunda metade do mesmo ciclo |
| Cliente era "uma unidade da Runner" | Cliente é uma **unidade de rede que inaugura em 10 dias**: urgência, pré-venda, evento de inauguração e os 90 dias seguintes |
| Modelo: piloto em parceria → white label com mensalidade + % das vendas | **Mantido**, com duas peças novas: **pacote de inauguração** (cobrança única) e **parte variável por matrícula** gerada pelo sistema |
| 14 funções de retenção | **+17 funções de captação** (seção 6) e um **plano de 10 dias** (seção 9) |
| Não olhava o que falta no sistema para captação | Seção 13: o que já existe, o que falta e em que ordem |

---

## 1. Resumo em 12 linhas

1. **A dor que vende rápido é captação; a dor que mantém o cliente é retenção.** Academia nova precisa de aluno no dia 1; academia aberta perde de 40% a 60% dos alunos por ano. **O produto certo cobre o ciclo inteiro:** atrair → converter → manter → indicar → atrair de novo.
2. **Os sistemas de gestão (Tecnofit, EVO/W12, Pacto, Next Fit) são fracos em captação.** Eles cuidam de contrato, cobrança e catraca. Captação acaba em planilha, grupo de WhatsApp e agência de anúncios sem medir matrícula.
3. **Lead de academia é barato e morno.** O que decide a matrícula é a **velocidade da resposta** e o **acompanhamento**. Dados de fornecedor: academias com acompanhamento automático convertem **85%** das aulas experimentais, contra **71%** no manual (Gymdesk). Responder em até 5 minutos em vez de 30 aumenta em até 21 vezes a chance de qualificar o contato (estudo InsideSales/MIT, dado de fornecedor).
4. **Diferencial número 1:** medir e otimizar **por matrícula, não por clique**. A NextLevel já tem origem de cada contato, código da visita no WhatsApp e retorno da venda à Meta e ao Google (D294, D298). Quase nenhuma academia tem isso.
5. **Diferencial número 2:** **pré-venda com vaga de fundador paga por Pix** (reserva abatida da primeira mensalidade) e **indicação do fundador** com ranking, usando a loja e o Club que já existem.
6. **Diferencial número 3:** o aluno captado **entra direto no clube/app** (proposta da versão 1) e vira o próximo canal de indicação. Ninguém no mercado brasileiro fecha esse ciclo num produto só.
7. **10 dias é pouco para pré-venda completa** (o mercado recomenda de 6 a 8 semanas). Mas a inauguração e os **90 dias seguintes** são o pico de captação, e isso dá tempo.
8. **No sistema, o funil de contatos hoje serve ao comercial da própria NextLevel, não a cada loja.** Nos 10 dias, parte do serviço será operada pela equipe; o funil por loja fica pronto para o pós-abertura (seções 9 e 13).
9. **Modelo recomendado (versão 1 mantida e ampliada):** pacote de inauguração → mensalidade por unidade (captação, ou captação + clube) → % sobre vendas no app → valor por matrícula gerada (opcional). Preços na seção 11.
10. **Escala:** só três redes (Smart Fit, Gaviões 24h e Selfit) preveem centenas de aberturas em 2026. Toda unidade nova precisa de captação. E o mesmo motor serve estúdios, clínicas, escolas e outros negócios locais.
11. **Referência de modelo:** o GoHighLevel, nos EUA, é exatamente isso: agência que revende, com a própria marca, um sistema de captação para negócios locais (US$ 297 a US$ 497/mês para a agência). A NextLevel é agência e plataforma ao mesmo tempo.
12. Primeiro passo: conversa com a unidade usando as perguntas da seção 15, **ainda esta semana**.

---

## 2. A dor certa: o ciclo de vida do aluno

```
  ATRAIR            CONVERTER              MANTER                 INDICAR
  anúncio,     →    resposta rápida,   →   clube, app, loja,  →   link do aluno,
  pré-venda,        visita / aula           desafios, alerta       pontos, ranking
  parceiros         experimental,           de aluno sumido           │
  do bairro         matrícula                                         │
     ▲                                                                │
     └──────────────────── o aluno traz o próximo aluno ◄─────────────┘
```

| Etapa | Onde a academia perde dinheiro | O que o mercado oferece | O que a NextLevel oferece |
|---|---|---|---|
| Atrair | Anúncio otimizado por clique barato, sem saber qual traz matrícula | Agência de anúncios + formulário solto | Página da unidade + origem de cada contato + retorno da matrícula à Meta/Google |
| Converter | Contato respondido horas depois, sem acompanhamento; ninguém sabe por que perdeu | Planilha, WhatsApp no celular da recepção, CRM genérico | Resposta automática na hora, funil da unidade, lembretes, motivo de perda |
| Manter | Evasão de 40% a 60% ao ano | App de treino do sistema de gestão | Clube, pontos, desafios, loja, alerta de aluno sumido (versão 1) |
| Indicar | Indicação boca a boca, sem rastreio nem prêmio | Quase nada | Link do aluno, pontos, ranking, vale (Club) |

**Por que isso importa para vender:** a captação é a dor que o dono da academia sente **hoje** (principalmente quem está abrindo). A retenção é a dor que ele sente **em 6 meses**. Entrar pela captação e entregar a retenção junto faz o cliente ficar.

---

## 3. Tamanho do mercado no Brasil

| Dado | Número | Fonte e confiança |
|---|---|---|
| Centros de atividade física ativos | 22.581 (2015) → **62.718 (2025)**; 72% são academias | Panorama Setorial Fitness Brasil 2025 (boa) |
| Academias no Brasil | **41.332**, 3º país do mundo | HFA Global Report 2025 (boa) |
| Faturamento anual das academias | cerca de **R$ 17 bilhões** | Panorama Setorial 2024 (boa) |
| Alunos matriculados | "mais de 15 milhões" | Reportagem de 2025, estudo não citado (fraca) |
| Evasão média anual | **40% a 60%** | ACAD Brasil, citada em reportagem de 2026 (boa) |
| **Aberturas previstas em 2026** | **Smart Fit: 330 a 350**; **Gaviões 24h: 300** até o fim do ano; **Selfit: 33** só até março | Imprensa de negócios 2025/2026 (boa) |
| Agregadores | Wellhub com 3 milhões de usuários; TotalPass forte no varejo | Imprensa 2025/2026 |

**Leitura nova:** **inaugurar academia virou rotina.** Só três redes somam mais de 600 aberturas previstas para 2026, fora as redes médias (Panobianco com mais de 400 unidades, Bodytech, Runner) e as independentes. **Cada inauguração é uma compra de captação com prazo fixo e verba separada.** É um mercado recorrente para um "pacote de inauguração".

### Sobre a Runner
Rede de São Paulo. Unidades encontradas em páginas públicas: **Cursino** (Av. do Cursino, 4172), **Freguesia do Ó** (R. Chicó de Paula, 365) e **Top Center** (Av. Paulista). Está no **Wellhub** (plano Silver) e no **TotalPass** (a partir do TP2+), com nota 4,77 em 364 avaliações na unidade Cursino. Não achei app próprio da rede nem o sistema de gestão que ela usa. **A unidade que abre em 10 dias é uma das novas.** Perguntas obrigatórias (seção 15): quem faz o marketing (a rede ou a unidade), se a pré-venda já começou e com qual sistema.

---

## 4. Quem é quem no mercado

### 4.1 Sistemas de gestão brasileiros (cobrança, contrato, catraca, financeiro)

| Sistema | Para quem | Preço praticado | App do aluno | Captação |
|---|---|---|---|---|
| **Tecnofit** | Academias, box de cross, estúdios | Por aluno ativo: **média de R$ 3,38 por aluno/mês**; faixa de 50 alunos a **R$ 269/mês + implantação** (site oficial) | Sim; app de marca própria com guia de implantação, preço sob consulta | Cadastro de interessados; sem rastreio de anúncio até a matrícula |
| **EVO (W12)** | Redes e academias médias/grandes | Sob consulta, por unidade e módulo. Estimativa de terceiros: **R$ 1.500 a R$ 6.500/mês** por rede (fonte fraca) | Sim | Tem módulo de CRM e **página de venda de planos com checkout** (usada por redes na pré-venda) |
| **Pacto Soluções** | Redes grandes | Sob consulta | Sim; estudo de gamificação com 11 mil alunos (SBC, 2025) | CRM próprio com integração ao RD Station |
| **Next Fit** | Pequenas e médias | Sob consulta via demonstração | Sim | Básico |
| **MFIT Personal** | Personal trainer | App grátis; assinatura cresce com o número de alunos | Treino, anamnese, avaliação, cobrança, IA na prescrição | Não |

**Leitura:** se a unidade usa EVO, a matrícula pode até acontecer no checkout da EVO. **A NextLevel não precisa substituir isso**: capta, aquece e entrega o contato quente no checkout dela, medindo quem matriculou.

### 4.2 Plataformas internacionais (referência de recursos e preço)

| Plataforma | Preço (US$/mês) | App de marca própria |
|---|---|---|
| **Mindbody** (ABC Fitness) | cerca de **99 a 699**, por unidade | Adicional, sob consulta |
| **ABC Glofox** | a partir de cerca de **99 a 110**; precisa de demonstração | Ponto forte; tem calculadora de receita de pré-venda no site |
| **ABC Trainerize** | sob consulta | App de marca para treino e acompanhamento online |
| **Club OS** | sob consulta | Foco em vendas e acompanhamento de contatos; caso de pré-venda da World Gym Tucson (mais de 1.000 matrículas em 30 dias, dado do fornecedor) |
| **PushPress** | **grátis** ou **159** | Sim (planos pagos); guias de "clube dos fundadores" |
| **Gymdesk** | planos a partir de cerca de 79 | **Adicional de US$ 39/mês** |
| **FitBudd** | **149/mês + 75 de implantação** | Sim, no plano mais alto |
| **Arvo** | a partir de **€ 99/mês** | Diz incluir desde o primeiro dia (afirmação do fornecedor) |
| **Virtuagym** | sob consulta | Adicional pago |

### 4.3 Agregadores (não são software, são canal de venda)

| Agregador | Quanto a academia recebe | Observação |
|---|---|---|
| **Wellhub** (ex-Gympass) | Relatos de **R$ 8 a R$ 25 por check-in**, até R$ 35 em contratos específicos; houve caso de R$ 9,90 | Sem tabela pública; em 2026 academias de bairro começaram a sair por achar o repasse baixo |
| **TotalPass** | Relatos de **R$ 16 a R$ 37 por check-in** | Cadastro sem custo, paga desde a primeira visita |

**Por que importa:** aluno de agregador **não é aluno da academia**: ela não tem o contato nem a relação. Captação + clube é o jeito de **transformar o aluno de agregador em aluno direto** ou, ao menos, em comprador da loja e participante do clube (função C14).

### 4.4 Ferramentas de captação e CRM (concorrentes da parte nova)

| Ferramenta | Preço | Para academia |
|---|---|---|
| **RD Station Marketing** (Light) | a partir de **R$ 50 a R$ 75/mês** (até cerca de 1.000 contatos, conforme a página) | Genérico: e-mail, página, formulário. Sem aula experimental, sem matrícula, sem clube |
| **GoHighLevel** | **US$ 297/mês** (agência, marca própria) e **US$ 497/mês** (revenda com cobrança automática dos clientes) | Muito usado por agências americanas que atendem academias. **É o modelo de negócio mais parecido com o que a NextLevel pode fazer**, mas em inglês, sem Pix, sem loja e sem clube |
| **Pipedrive, Kommo e similares** | por usuário, sob plano | CRM genérico; a academia monta o funil sozinha |
| **Agências de tráfego** | fee mensal + verba do cliente | Entregam contatos, raramente medem matrícula |

**A lacuna:** nenhum deles junta, em português e com Pix, **página da unidade + resposta na hora no WhatsApp + funil de aula experimental + medição por matrícula + clube e indicação do aluno**.

### 4.5 Plataformas de comunidade (referência para o "Clube NextLevel")

| Plataforma | Preço (US$/mês) | App de marca própria |
|---|---|---|
| **Circle** | **89** (Professional) / **199** (Business), anual | Só no **Circle Plus**, sob consulta (a partir de cerca de 360) |
| **Mighty Networks** | a partir de **79** | Só no **Mighty Pro**, relatos de cerca de **US$ 30 mil/ano** + taxa sobre vendas |
| **Skool** | **9** (com 10% de taxa nas vendas) / **99** (2,9%) | Não tem |

### 4.6 Apps de treino e corrida (concorrem pela atenção do aluno)
Strava (clubes e desafios de corrida), apps de relógio (Apple Saúde, Google Fit, Garmin) e apps de treino com IA. **Não brigue com eles: integre.** Uma rede chamada **Runner** tem afinidade natural com corrida: grupo de corrida da unidade, desafio de quilômetros e ranking custam pouco e viram **conteúdo de captação** ("treino de corrida aberto ao bairro no sábado").

---

## 5. Captação de alunos: o que funciona (com números)

| Tema | O que se sabe | Fonte e confiança |
|---|---|---|
| **Quando começar a pré-venda** | 6 a 8 semanas antes da abertura, não mais que 10; alguns falam em 60 a 90 dias | Guias de fornecedores (média) |
| **Oferta de fundador** | Vagas limitadas (30 a 100), condição que **acaba na inauguração** ou sobe de preço conforme a pré-venda avança; não pode ser eterna | Agências e redes (média); a rede SIX vende cerca de **um terço das vagas antes de abrir** e sobe o preço por etapa (reportagem) |
| **Meta de pré-venda** | Fechar de 30% a 50% do ponto de equilíbrio antes de abrir | Guia de fornecedor (fraca) |
| **Canais** | Anúncio num raio de cerca de **3 km**, indicação dos primeiros alunos, parcerias com o comércio vizinho, evento VIP de pré-inauguração, aula aberta, visita guiada | Agências e guias (média, consistente entre fontes) |
| **Custo por contato (lead) na Meta, Brasil** | **R$ 5 a R$ 40**, conforme o segmento e a oferta | Trafius 2026 (média, sem recorte de academia) |
| **Fitness nos EUA** | custo por contato maior que a média e conversão menor (5,6% contra 7,7%) | Benchmark de anúncios (média) |
| **Velocidade de resposta** | Responder em até 5 minutos em vez de 30: até **21 vezes** mais chance de qualificar o contato. Menos de 1% das empresas responde em 5 minutos | InsideSales/MIT (dado de fornecedor, muito citado) e Harvard Business Review (boa) |
| **Acompanhamento** | Aula experimental vira matrícula em **85%** com acompanhamento por sistema, contra **71%** manual | Gymdesk (dado de fornecedor) |
| **Cuidado legal** | Vender antes de abrir só com data confirmada; regras de devolução claras se atrasar | Caso Skyfit Recife; Código de Defesa do Consumidor |

**Conclusão prática:** o anúncio é a parte fácil (e o dinheiro é do cliente). O que separa academia cheia de academia vazia é **o que acontece nos primeiros 5 minutos depois do contato** e **nos 7 dias seguintes**. É aí que o produto da NextLevel tem que brilhar.

---

## 6. O produto de captação: funções diferenciadas

Ordenadas por prioridade para a inauguração. "Já existe" aponta o que o motor tem hoje (regra anti-duplicação: **estender, não criar de novo**). Onde diz "por loja", a peça existe para o comercial da NextLevel e precisa passar a servir cada loja (seção 13).

| # | Função | O que a academia ganha | Já existe no motor | Esforço |
|---|---|---|---|---|
| C1 | **Página de pré-venda da unidade** com contagem regressiva e **vagas de fundador que acabam de verdade** (contador ligado ao banco, não falso) | Urgência honesta; página bonita no ar em horas | Temas, páginas da loja, estoque do produto como contador | Baixo |
| C2 | **Reserva de vaga de fundador paga por Pix** (ex.: R$ 49, abatidos da primeira mensalidade, devolvida se a abertura atrasar) | Contato com compromisso; caixa antes de abrir; menos falta no dia | Produto + checkout Mercado Pago/Pix + cupom | Baixo |
| C3 | **Quiz de 4 perguntas** (objetivo, horário que treina, bairro, já treina em outra academia?) que qualifica e já sugere o plano | Recepção sabe o que oferecer; anúncio aprende quem é bom contato | Padrão de diagnóstico em conversa da D299 | Médio |
| C4 | **Resposta automática em menos de 1 minuto** no WhatsApp e no e-mail, com o horário de visita e o link do quiz | Nenhum contato esfria; vale de madrugada e no domingo | E-mail transacional; WhatsApp com mensagem pronta e código da visita (D294) | Médio (WhatsApp oficial é novo) |
| C5 | **Painel "responda agora"** na recepção: fila de contatos novos com **cronômetro** desde a chegada | A equipe vê quem está esperando; meta de 5 minutos | Quadro do Comercial com temperatura (D294) | Médio (por loja) |
| C6 | **Funil da academia**: Novo → Respondido → Visita/aula marcada → Compareceu → Matriculado / Perdido, com **motivo da perda** (preço, horário, distância, foi para outra, não respondeu) | Saber onde perde aluno, com números | Fechou/Perdeu e motivos (D294); faltam as etapas de visita | Médio (por loja) |
| C7 | **Agendamento de visita ou aula experimental** com lembrete na véspera e 2 horas antes | Menos falta na aula experimental | Novo (agenda simples; a Brás tem `bd_appointments` como referência) | Médio |
| C8 | **De onde veio cada matrícula** (anúncio, peça, público, parceiro do bairro, indicação, Instagram, Google) | Corta o anúncio que só traz curioso | Origem de cada contato e links rastreados (D290, D294) | Médio (por loja) |
| C9 | **Matrícula volta para a Meta e o Google** como venda | O anúncio aprende a achar **quem matricula**, não quem clica. **Maior diferencial técnico** | Retorno pelo servidor (D298) | Médio (por loja) |
| C10 | **Indicação do fundador**: cada reserva ganha um link; quem traz mais amigos sobe no ranking e ganha prêmio (mês grátis, camiseta, avaliação) | Pré-venda que se espalha sozinha | `club_referrals`, ranking, pontos e vales do Club | Baixo/médio |
| C11 | **QR code rastreado no comércio do bairro** (padaria, farmácia, loja de suplemento): cada parceiro tem o seu e ganha benefício pelo que trouxer | Mede o panfleto e a parceria offline | Links rastreados (D290) + balcão do parceiro no Club | Baixo |
| C12 | **Convite para a inauguração e a aula aberta** com confirmação de presença, lista na porta e "traga um amigo" | Evento cheio e medido; cada convidado vira contato | Novo (simples, sobre o agendamento C7) | Médio |
| C13 | **Reaquecimento de quem não matriculou**: mensagens no dia 1, 3 e 7 e uma oferta no mês seguinte | Recupera parte dos perdidos sem custo de anúncio | Fila de e-mails; motivos de perda | Médio |
| C14 | **Aluno de agregador vira contato**: na recepção, cadastro rápido do aluno Wellhub/TotalPass no clube, com oferta de plano direto | Converte quem hoje paga R$ 10 a R$ 25 por visita em aluno da casa | Club (perfil, carteirinha) | Baixo |
| C15 | **Atendente de IA no WhatsApp e no site** que responde preço, horário e estrutura 24 horas e marca a visita | Atende o pico da noite e do fim de semana | Conversas de IA (`ia_conversas`) | Médio/alto |
| C16 | **Mapa do bairro**: de onde vêm os contatos e as matrículas | Ajusta o raio do anúncio e onde panfletar | Cidade e aparelho de cada visita (D292) | Médio |
| C17 | **Painel da rede**: unidades lado a lado (contatos, custo por matrícula, conversão, evasão) | Argumento para a franqueadora comprar para todas as unidades | Novo (relatório sobre os dados das unidades) | Alto |

**Peças que fazem o conjunto ser único:** C2 (reserva paga) + C9 (matrícula volta para o anúncio) + C10 (indicação do fundador) + passagem automática para o clube (seção 7). Separadas, existem em algum lugar. **Juntas e em português com Pix, não existem.**

---

## 7. Funções de retenção e comunidade (proposta da versão 1, mantida)

Ordenadas da mais fácil para a mais difícil.

| # | Função | O que o aluno vê | Já existe no motor | Esforço |
|---|---|---|---|---|
| R1 | **Página e app (PWA) com a marca da unidade** | Instala pelo navegador, ícone da academia | Temas, `getBrand()`, páginas públicas; PWA está na fila de integrações | Baixo |
| R2 | **Loja da academia** com retirada na recepção ou entrega | Compra whey, camiseta, garrafa pelo app | Loja completa da NextLevel Commerce, cupons, Mercado Pago | Baixo |
| R3 | **Indique um amigo** com aula grátis e pontos | Link pessoal; ganha pontos quando o amigo se matricula | `club_referrals`, `partner_links`, origem do contato | Baixo |
| R4 | **Pontos e vales** (frequência, indicação, compra) | Saldo, extrato, troca por desconto | `club_ledger`, `club_vouchers` | Baixo |
| R5 | **Carteirinha digital e clube de vantagens** com parceiros do bairro | Mostra a carteirinha e ganha desconto | `club_cards`, balcão do parceiro | Baixo/médio |
| R6 | **Desafios e ranking** (quilômetros do mês, frequência, "30 dias sem faltar") | Ranking da unidade, medalhas | `partner_challenges`, `club/ranking.ts` | Médio |
| R7 | **Mural da unidade** (avisos, eventos, grupo de corrida, horários de pico) | Feed com fotos e vídeos curtos | `content_items` e o feed de vídeo da Brás | Médio |
| R8 | **Adicionais pagos** (avaliação física, nutricionista, personal online, aula especial, armário, day use para amigo) | Compra e agenda pelo app | `services`, `service_orders`, `subscriptions`, `entitlements` | Médio |
| R9 | **Alerta de aluno sumido** para a recepção, com mensagem pronta no WhatsApp | (Do lado da academia) | `crm_acompanhamento` | Médio |
| R10 | **Vitrine dos personal trainers da unidade** com cobrança e taxa para a academia | Escolhe e contrata o personal | `partners` (novo `kind`), comissões | Médio |
| R11 | **Assistente de IA** da academia | Conversa no app | `ia_conversas` (o mesmo da C15) | Médio |
| R12 | Integração com o sistema de gestão (EVO, Tecnofit, Pacto) | Entra com o mesmo CPF; frequência automática | Novo; depende da API do sistema da unidade | Alto |
| R13 | Integração com relógio e apps de corrida | Quilômetros entram sozinhos no desafio | Novo | Alto |
| R14 | App nativo nas lojas Apple e Google com a marca | Baixa na loja | Novo; custo de conta e publicação por cliente | Alto |

**Novidade da versão 2:** captação e retenção usam **o mesmo cadastro**. O contato que matricula vira automaticamente membro do clube (R3 a R6) e recebe o link de indicação (C10). **O aluno de hoje é o canal de captação de amanhã.**

**O que não fazer:** cobrança da mensalidade, contrato, catraca e ficha de treino completa. O sistema de gestão da academia já faz.

---

## 8. A comunidade para todos os clientes da NextLevel

- **Um Clube NextLevel, várias comunidades.** Cada cliente (academia, lojista, fornecedor, Brás) tem a **sua** comunidade com a **sua** marca.
- **Um saldo que circula (opcional, por adesão).** Pontos ganhos numa comunidade valem em parceiros de outra, se os dois toparem. Ex.: o aluno da academia ganha desconto numa loja de roupa fitness da plataforma; a loja ganha cliente; a academia oferece um benefício sem gastar nada.
- **Captação cruzada (novo na versão 2):** os parceiros do clube são também **pontos de captação** (QR code C11). A padaria do bairro dá desconto ao aluno e, em troca, o QR code dela traz alunos novos. Cada lado mede o que ganhou.
- **Cada tenant continua isolado.** A comunidade da academia nunca vê dados de outra (Constituição). O que circula é o benefício, com consentimento do cliente.
- **Base técnica:** o Club já tem perfis, pontos, indicações, vales, carteirinha, ranking, balcão do parceiro e acerto entre empresas (`club_*`). Hoje nasceu para a Brás; o trabalho é **tirar a amarra de marca**, sem tabelas novas.
- **Ganho para a NextLevel:** cada academia traz centenas ou milhares de consumidores para o ecossistema, que viram público das lojas da plataforma. **É canal de aquisição de lojistas**: "coloque sua loja no clube e chegue aos 2.500 alunos da academia do bairro".

---

## 9. Plano para a academia que abre em 10 dias

**Premissa honesta:** 10 dias não é tempo de programar um produto novo. É tempo de **montar com o que existe** e **operar à mão o que falta**, enquanto o funil por loja fica pronto para o pós-abertura. A inauguração e os 90 dias seguintes são o pico de captação de qualquer academia, então o produto chega a tempo para a parte que mais rende.

### Antes da abertura (dia −10 ao dia 0)

| Dia | Entrega | Como (com o que já existe) |
|---|---|---|
| −10 / −9 | Conversa (seção 15), aceite do piloto, acesso ao Instagram, à conta de anúncios e às fotos | Sala da campanha de anúncios do lojista (D299) para organizar pendências |
| −9 / −7 | **Página da unidade no ar**: fotos, planos, horários, mapa, contagem regressiva, vagas de fundador e **reserva paga por Pix** (C1, C2) | Loja da NextLevel Commerce com tema; reserva como produto com estoque limitado; termos de devolução se atrasar |
| −8 / −7 | **Anúncios num raio de 3 km** apontando para a página, com links por peça e público (C8) | Gestão de Meta Ads pelo fluxo da D299, na conta de anúncios da academia, verba no cartão dela |
| −7 | **Indicação do fundador** (C10): cada reserva recebe um link e entra no ranking "quem traz mais amigos" | Cupom por fundador + contagem de pedidos por cupom (rápido); depois migra para o Club |
| −7 / −6 | **QR codes** em 5 a 10 comércios vizinhos (C11) | Links rastreados; cartaz impresso |
| −6 / 0 | **Resposta rápida** (C4/C5): toda reserva e todo contato recebem mensagem na hora; a recepção recebe aviso | E-mail automático da loja + mensagem pronta no WhatsApp; **a lista de contatos é acompanhada pela equipe** numa planilha compartilhada com a academia até o funil por loja ficar pronto |
| −3 / 0 | **Convite da inauguração e aula aberta** (C12) para todos os contatos | Mensagem com confirmação; lista na porta |
| 0 | Inauguração: cadastro na porta (QR code) de quem veio, inclusive de quem é de agregador (C14) | Página de cadastro da loja |

### Depois da abertura (dia 1 ao dia 90)

| Semana | Entrega |
|---|---|
| 1 a 2 | **Funil por loja no ar** (C5, C6, C8): contatos, cronômetro, etapas, motivo da perda. A planilha é importada |
| 2 a 4 | **Agendamento de aula experimental com lembretes** (C7) e **reaquecimento** de quem não matriculou (C13) |
| 3 a 5 | **Matrícula volta para a Meta** (C9): o anúncio passa a otimizar por quem matricula |
| 4 a 8 | **Clube da unidade** (R1 a R6): todo matriculado entra, ganha carteirinha, pontos e link de indicação |
| 8 a 12 | **Relatório de 90 dias** para a unidade e para a rede: contatos, custo por matrícula, conversão por etapa, origem, indicações. **É o material de venda para as outras unidades** |

### O que medir desde o dia −10 (para o caso de sucesso)
Contatos por dia e por origem · tempo de primeira resposta · reservas de fundador · visitas/aulas marcadas e comparecidas · matrículas · custo por matrícula · indicações convertidas · (depois) evasão do trimestre.

---

## 10. Modelos de negócio comparados

### Os dois modelos da versão 1

| | A: parceria (app grátis, receita nos adicionais) | B: white label (taxa de serviço e hospedagem) |
|---|---|---|
| A favor | Entrada fácil; o aluno testa sem barreira | Receita previsível; a academia divulga porque pagou; suporte é para a academia; escala |
| Contra | Conflito com a academia (ela também quer vender personal e avaliação); conversão baixa de grátis para pago; suporte a milhares de consumidores; depende da academia divulgar | Venda mais lenta; unidade de rede pode precisar de autorização da franqueadora; app nativo custa por cliente |

### O que a captação acrescenta

| Peça nova | Como funciona | Por que ajuda |
|---|---|---|
| **Pacote de inauguração** | Cobrança única: página, reserva de fundador, indicação, QR codes, convite e montagem dos anúncios | Inauguração tem verba separada e prazo; é a venda mais fácil de fechar |
| **Valor por matrícula** | Pequeno valor fixo por matrícula cuja origem o sistema registrou primeiro (regra escrita: contato nos últimos 30 dias, antes de qualquer outro registro) | O dono de academia detesta pagar por clique e por contato; **pagar por matrícula é o argumento mais forte de venda** |
| **Gestão de anúncios** | Serviço da agência (NextLevel Soluções), pelo fluxo da D299; verba sempre no cartão da academia | Receita de serviço com margem; a plataforma mede o resultado |

### Simulação (todos os números são hipóteses para conferir com a Runner)

**Captação na abertura e nos 90 dias:** verba de anúncio de **R$ 3.000/mês** da academia; custo por contato de **R$ 15** (meio da faixa brasileira) → **200 contatos/mês**; 50% marcam visita, 70% comparecem, 50% matriculam → **cerca de 35 matrículas/mês pelo anúncio**, mais indicações e QR codes. Custo de anúncio por matrícula: **cerca de R$ 85**.

**Quanto vale uma matrícula para a academia:** mensalidade média de **R$ 130** × permanência média de 6 a 8 meses = **R$ 780 a R$ 1.040**. Pagar R$ 85 de anúncio + R$ 20 à NextLevel por matrícula é um ótimo negócio para ela.

**Retenção (versão 1):** com 2.500 alunos, reduzir a evasão de 50% para 45% ao ano mantém **125 alunos** a mais, em média por 6 meses × R$ 130 = **cerca de R$ 97 mil por ano**.

**Receita da NextLevel por unidade (cenário do piloto convertido em cliente, ano 1):**

| Fonte | Conta | Por mês |
|---|---|---|
| Mensalidade "Captação + Clube" | fixa | R$ 597 |
| Valor por matrícula | 45 matrículas × R$ 20 | R$ 900 |
| Taxa sobre a loja e os adicionais | R$ 9.000 em vendas × 10% | R$ 900 |
| Gestão de anúncios (serviço, opcional) | fixa | R$ 800 a R$ 1.500 |
| **Total recorrente** | | **cerca de R$ 2.400 a R$ 3.900** |
| Pacote de inauguração (uma vez) | | R$ 1.500 a R$ 3.000 |

Com **10 unidades** (uma rede média), seriam de R$ 24 mil a R$ 39 mil por mês. Com o mesmo motor servindo outros segmentos (seção 12), o teto é bem maior.

---

## 11. Recomendação (versão 2): o híbrido da versão 1, com a captação como porta de entrada

**Continua valendo:** nem parceria pura, nem white label puro. Começa como piloto em parceria e vira white label com mensalidade baixa + participação nas vendas. **O que muda:** a porta de entrada é a captação, e a parte variável passa a incluir a matrícula.

### Etapa 1: Runner como **cliente fundador** (inauguração + 90 dias)
- **Pacote de inauguração sem custo** (ou a preço de custo) e **90 dias sem mensalidade**. A academia paga só a verba dos anúncios (direto à Meta) e, se quiser, a gestão de anúncios.
- **A NextLevel fica com 10% das vendas no app** (reservas, loja, adicionais). As reservas de fundador são da academia; os 10% cobrem pagamento e hospedagem.
- **Em troca, por escrito:** acesso aos números (contatos, matrículas, evasão), uso do caso como vitrine, depoimento em vídeo e **apresentação à franqueadora** ao fim dos 90 dias.
- **Depois do piloto, desconto de fundador para sempre** (por exemplo, 30% na mensalidade). A mesma lógica de "fundador" que a academia usa com os alunos, a NextLevel usa com a academia.

### Etapa 2: planos por unidade (sugestão inicial, a validar com 3 a 5 academias)

| Plano | O que tem | Mensalidade por unidade | Variável |
|---|---|---|---|
| **Captação** | Página, reserva paga, quiz, resposta automática, funil, agendamento, origem, retorno à Meta/Google, indicação, QR codes | **R$ 397** | **R$ 20 por matrícula** gerada pelo sistema (ou sem variável e mensalidade de R$ 597, à escolha da academia) |
| **Captação + Clube** | Tudo acima + clube, carteirinha, pontos, desafios, mural, loja, adicionais, alerta de aluno sumido | **R$ 597** (até 2.500 alunos) / **R$ 797** (acima) | R$ 20 por matrícula + **8% a 12% das vendas no app** |
| **Rede** | Planos acima em todas as unidades + painel da rede (C17) | desconto por volume (a partir de 5 unidades) | negociado |
| **Pacote de inauguração** | Montagem da pré-venda e do evento | **R$ 1.500 a R$ 3.000**, uma vez | |
| **Gestão de anúncios** | Serviço da agência | **R$ 800 a R$ 1.500/mês** | verba sempre da academia |
| **App nativo nas lojas** | Opcional, só para quem pedir | adicional | |

Referências de preço: RD Station Light (de R$ 50 a R$ 75, só marketing genérico); Tecnofit (cerca de R$ 3,38 por aluno, só gestão); GoHighLevel (US$ 297 a US$ 497 **para a agência**, antes da revenda); Gymdesk (US$ 39 só pelo app de marca). **R$ 397 a R$ 797 com captação + clube + loja fica abaixo de qualquer combinação equivalente.**

### Etapa 3: rede, outros segmentos e clube
- Com o relatório de 90 dias, propor à **franqueadora da Runner** o plano Rede e o **pacote de inauguração para cada unidade nova**.
- Oferecer o **pacote de inauguração a outras redes em expansão** (Gaviões, Selfit, redes médias): cada inauguração é uma venda com prazo.
- Abrir o **Clube NextLevel** entre academias e lojas da plataforma.

### Por que esse caminho
1. **Vende pela dor de hoje** (captação), **segura pela dor de amanhã** (retenção).
2. **Quem ganha mais é a academia** (matrículas e alunos que ficam), então ela divulga e renova.
3. **A NextLevel cobra pelo resultado que mede:** matrícula registrada no sistema, não promessa. Sem promessa de ganho nos textos (regra do projeto); o que se cobra é o que aconteceu.
4. **Usa o que já existe:** loja, Pix, Club, anúncios do lojista, origem do contato, retorno à Meta/Google, IA.
5. **Conta para a meta dos 10 lojistas pagantes** e gera receita de serviço para a agência.

---

## 12. Escala: o mesmo motor para muitos clientes

O funil "contato → visita/avaliação → fechamento → cliente fiel → indicação" é igual em vários negócios locais. **Construir para a academia, mas com o motor genérico e um "kit por segmento"** (textos, etapas, motivos de perda, quiz):

| Segmento | "Visita" equivalente | Por que encaixa |
|---|---|---|
| Academias e estúdios (pilates, cross, luta, dança) | Aula experimental | Primeiro cliente; muitas inaugurações por ano |
| Clínicas de estética e odontologia | Avaliação | Ticket alto, contato caro, muita perda por demora |
| Escolas de idiomas, cursos, autoescolas | Aula demonstrativa | Matrícula sazonal, indicação forte |
| Salões, barbearias, pet shops | Primeiro atendimento | Recorrência e clube de pontos |
| Lojas da NextLevel Commerce | Primeira compra | Já são clientes; ganham captação e clube |

Isso segue a regra anti-duplicação: **um motor, vários pacotes**, com a marca de cada cliente. O primeiro passo técnico (seção 13) já é o mesmo para todos.

---

## 13. O que já existe no sistema e o que falta

| Peça | Situação hoje | O que falta |
|---|---|---|
| Página, tema, loja, Pix, cupons | **Pronto por loja** | Modelo de página "academia/pré-venda" |
| Anúncios na Meta pelo painel do lojista (D299) | **Pronto por loja** | Nada para começar |
| Lista de espera da loja (`store_waitlist`) | Por loja, só e-mail | Telefone/WhatsApp e consentimento (ou usar o funil abaixo) |
| Origem de cada contato, código da visita, links rastreados (D290 a D294) | **Só para o comercial da NextLevel** (por marca) | **Passar a servir cada loja**, isolando os dados de cada uma |
| Funil Comercial com Fechou/Perdeu (D294) | Só para a NextLevel | Mesma coisa + etapas de visita/aula + cronômetro de resposta |
| Retorno à Meta/Google pelo servidor (D298) | Só para a NextLevel | Por loja, com a conta/pixel da própria loja |
| Club (pontos, indicações, vales, carteirinha, ranking, balcão) | Nasceu para a Brás | Tirar a amarra de marca |
| IA de conversa | Existe | Base de respostas por loja e marcação de visita |
| Agendamento de visita/aula | Só na Brás (`bd_appointments`) | Versão para qualquer loja |
| WhatsApp oficial (mensagem automática) | Hoje só mensagem pronta com clique | Integração oficial (custo por mensagem cobrado pela Meta) |

**Ordem sugerida das fases** (cada uma vira uma fase de prompt):
1. **L0** Modelo de página de pré-venda + reserva paga (dias, só configuração e tema).
2. **L1** Funil, origem e links **por loja** (a peça que destrava todo o resto e serve todos os segmentos).
3. **L2** Agendamento de visita/aula com lembretes + reaquecimento.
4. **L3** Retorno da matrícula à Meta/Google por loja.
5. **L4** Club sem amarra de marca + entrada automática do matriculado.
6. **L5** WhatsApp oficial e atendente de IA.
7. **L6** Painel da rede.

**Decisão estrutural a registrar antes de L1:** passar origem/funil de "por marca" para "por marca e por loja" mexe em dados de tenant; precisa de leitura da Constituição e registro em `DECISIONS.md` (a próxima livre está no `CLAUDE.md`).

---

## 14. Riscos e cuidados

| Risco | Como tratar |
|---|---|
| **A rede já faz o marketing central** (anúncio e pré-venda pela franqueadora) | Perguntar antes (seção 15). Se fizer, a NextLevel entra na **conversão e no acompanhamento local** (C4 a C7, C13) e no clube, sem disputar o anúncio |
| A unidade é franquia e não pode ter página ou app próprio | Usar o nome da unidade dentro do padrão da rede; se não puder, o produto vira "clube e captação da unidade" sem a marca no ícone |
| **10 dias de prazo** | Plano da seção 9: montar com o que existe, operar à mão o que falta, sem prometer o que não está pronto |
| Venda antes de abrir (Código de Defesa do Consumidor) | Reserva com termos claros: valor abatido da mensalidade e **devolvido se a abertura atrasar**; só vender com data confirmada |
| Disputa sobre "quem trouxe a matrícula" | Regra escrita no contrato: vale o primeiro registro no sistema nos últimos 30 dias; relatório aberto para a academia conferir |
| LGPD e WhatsApp | Consentimento no formulário; mensagens de marketing só para quem aceitou; opção de sair em toda mensagem |
| Custo do WhatsApp oficial | A Meta cobra por mensagem iniciada pela empresa; repassar no plano ou como adicional |
| Saúde e dados sensíveis | Consentimento explícito; IA nunca prescreve, só orienta e indica o professor |
| Promessa de resultado | Sem promessa de matrícula, ganho ou emagrecimento nos textos; cobrar só o que foi medido |
| Conflito com personal trainers da casa | Trazê-los para dentro (R10) |
| Distração do foco E-commerce | Piloto limitado; L1 serve a todas as lojas, então o trabalho não é só para academia |

---

## 15. Perguntas para a conversa com a unidade (atualizadas)

**Sobre a abertura (urgente):**
1. Qual a data exata da inauguração? A obra está garantida para essa data?
2. **A pré-venda já começou?** Quantos alunos já fecharam e por qual sistema (EVO, Tecnofit, outro, link de pagamento)?
3. **Quem faz o marketing:** a rede (central) ou a unidade? A unidade tem verba própria de anúncio? Quanto?
4. Quem responde os contatos hoje, por qual WhatsApp, e em quanto tempo?
5. Vai ter evento de inauguração ou aula aberta?
6. Qual a meta de alunos para o primeiro mês e o ponto de equilíbrio da unidade?

**Sobre a rede e o sistema:**
7. A unidade é franquia ou própria? A rede permite página, clube ou app próprio da unidade?
8. Qual sistema de gestão vão usar? Tem app do aluno?
9. Vão entrar no Wellhub e no TotalPass desde o começo?

**Sobre o depois:**
10. Vão vender algo além da mensalidade (suplemento, roupa, avaliação, personal)?
11. Têm grupo de corrida ou eventos planejados?
12. Quais comércios do bairro topariam ser parceiros?
13. Quem decide e quem vai operar (recepção, gerente, dono)?

---

## 16. Próximos passos sugeridos

1. **Hoje ou amanhã:** o dono faz a conversa da seção 15 (perguntas 1 a 6 primeiro) e confirma o aceite do piloto como cliente fundador.
2. **Em seguida:** registrar a decisão (próxima livre em `DECISIONS.md`) e escrever o prompt por fases em `docs/prompts/captacao-clube-academias.md` (fases L0 a L6 da seção 13).
3. **Dias −9 a −7:** página de pré-venda e reserva paga no ar (L0), com print para o dono e para a academia.
4. **Semanas 1 a 2 depois da abertura:** funil por loja (L1), já pensado para todos os segmentos.
5. **Dia 90:** relatório do piloto e apresentação à franqueadora.

---

## Fontes

**Mercado e redes**
- Mercado de academias, dados e tendências (Sebrae PR): https://sebraepr.com.br/impulsiona/mercado-de-academias-no-brasil-dados-e-tendencias/
- Mercado fitness cresce 170% em 10 anos (Correio): https://www.correio24horas.com.br/brasil/mercado-fitness-cresce-170-em-10-anos-e-academias-apostam-em-acolhimento-para-reter-alunos-0726
- Retenção de alunos (Estado de Minas, 2026): https://www.em.com.br/networking-e-negocios/2026/07/7469486-retencao-de-alunos-vira-novo-campo-de-batalha-das-academias-no-brasil.html
- Smart Fit prevê de 330 a 350 aberturas em 2026: https://mercadoeconsumo.com.br/11/03/2026/franquias/smartfit-preve-aberturas-liquidas-de-330-a-350-academias-em-2026/
- Smart Fit com 2 mil unidades: https://mercadoeconsumo.com.br/31/12/2025/servicos/smart-fit-chega-a-2-mil-unidades-e-acelera-expansao-no-brasil-e-no-exterior/
- Gaviões 24h planeja 1.000 unidades até 2030: https://www.portaldofranchising.com.br/noticias/academia-gavioes-24h-planeja-1000-unidades-ate-2030/
- Selfit prevê 33 academias até março: https://mercadoeconsumo.com.br/20/01/2026/servicos/selfit-investe-r-1155-milhoes-e-preve-abertura-de-33-academias-ate-marco/
- Bodytech e o BTFIT: https://mundodomarketing.com.br/bodytech-reposiciona-marca-e-planeja-dobrar-rede-de-academias-em-cinco-anos
- Gamificação personalizada com dados da Pacto (SBC): https://sol.sbc.org.br/index.php/erigo/article/download/39535/39307

**Runner e agregadores**
- Wellhub, Runner Cursino: https://wellhub.com/pt-br/search/partners/runner-cursino-vila-moraes-sao-paulo
- Wellhub, Runner Freguesia do Ó: https://wellhub.com/pt-br/search/partners/runner-freguesia-do-o-freguesia-do-o-sao-paulo
- TotalPass, Runner: https://totalpass.com/br/academias/runner/
- Quanto a academia recebe por check-in: https://www.remessaonline.com.br/blog/quanto-academia-recebe-por-check-in/
- Wellhub e TotalPass para academias (Seu Dinheiro): https://www.seudinheiro.com/2026/seu-negocio/wellhub-e-totalpass-vale-a-pena-para-as-academias-estar-nos-aplicativos/
- Academias de bairro saindo das plataformas (Correio): https://www.correio24horas.com.br/salvador/fim-do-gympass-academias-de-bairro-rompem-com-plataformas-e-tendencia-cresce-no-pais-0226

**Sistemas e apps**
- Tecnofit, preços oficiais: https://www.tecnofit.com.br/precos/
- Sistemas para academia (Nota Gateway): https://notagateway.com.br/blog/sistemas-para-academia/
- CRM para academia no Brasil (Zoye): https://www.zoye.io/blog/crm-para-academia
- TI para academias, estimativas de EVO e Tecnofit (fonte fraca): https://encontreumnerd.com.br/artigos/empresa-de-ti-terceirizada/empresa-de-ti-terceirizada-academias-estudios-tecnofit-evo-pme-brasil-2026
- EVO (ABC Fitness): https://abcfitness.com/evo/
- Pacto CRM + RD Station: https://www.rdstation.com/integracoes/pacto-crm/
- Custo de software de academia 2026 (Gymdesk): https://gymdesk.com/blog/gym-management-software-cost
- Melhores apps de membros 2026 (Gymdesk): https://gymdesk.com/blog/best-gym-member-apps
- Preços de software de academia (Costbench): https://costbench.com/software/gym-management/
- Alternativas ao Mindbody (PushPress): https://www.pushpress.com/blog/7-best-mindbody-alternatives-for-gym-owners-in-2026
- Alternativa ao Glofox (FitBudd): https://www.fitbudd.com/best-glofox-alternative
- Glofox x Mindbody (G2): https://g2.com/compare/abc-glofox-vs-mindbody
- Arvo para academias: https://arvo.guru/pt-BR/for-gyms e https://arvo.guru/pt-BR/vs/virtuagym
- MFIT Personal (App Store): https://apps.apple.com/BR/app/id1283273690

**Captação, pré-venda e anúncios**
- Pré-venda Aluno Fundador (Skyfit Encruzilhada): https://skyfitencruzilhada.com.br/
- Marketing para inauguração de academia: https://fluxodigitaltech.com.br/inauguracao-de-academia/
- 9 estratégias para a inauguração de academia: https://www.rvb.com.br/9-estrategias-inauguracao-de-academia/
- Plano de negócio para abrir academia em 2026: https://gestaofitness.net/academia/abrir/plano-de-negocio
- Academia mais cara do Brasil (rede SIX, pré-venda por etapas): https://exame.com/negocios/como-e-treinar-na-academia-mais-cara-do-brasil-onde-a-mensalidade-chega-a-r-5-400/
- Pré-venda da World Gym Tucson (Club OS): https://www.club-os.com/blog/gym-marketing-case-study-how-world-gym-tucson-partnered-with-club-os/asf-to-enroll-over-1200-new-members-before-their-grand-opening
- Guia de pré-venda e membros fundadores (Verve): https://www.vervefitness.com.au/blogs/all/gym-pre-sale-guide-founding-members
- Dicas de pré-venda (PushPress): https://www.pushpress.com/blog/gym-presale-success-tips e https://www.pushpress.com/blog/gym-founders-club-sales-plan
- Calculadora de pré-venda (Glofox): https://www.glofox.com/calculator/presale/
- Playbook de marketing com números de donos (Gymdesk): https://gymdesk.com/blog/gym-marketing-playbook-owner-insights
- Anúncios no Facebook para academias: https://adsuploader.com/pt/blog/facebook-ads-for-gyms
- Custo por contato na Meta no Brasil (Trafius): https://trafius.com.br/blog/como-gerar-leads-facebook-ads
- Tempo de resposta a contatos, a regra dos 5 minutos: https://resources.rework.com/pt/libraries/lead-management/lead-response-time
- O que a regra dos 5 minutos realmente mediu: https://creatorflow.so/blog/speed-to-lead/

**Captação, CRM e comunidade (ferramentas)**
- RD Station Marketing, plano Light: https://www.rdstation.com/marketing/light/
- Planos do RD Station Marketing: https://www.rdstation.com/blog/marketing/planos-precos-rd-station-marketing/
- GoHighLevel, revenda com marca própria: https://www.webdew.com/blog/gohighlevel-saas-mode e https://setsmart.io/blog/gohighlevel-white-label
- Circle, preços 2026: https://schoolmaker.com/blog/circle-so-pricing
- Mighty Networks, alternativas e preços: https://www.choicely.com/blog/mighty-networks-alternatives
- Skool x Circle x Mighty: https://app.unilink.us/blog/skool-vs-circle-vs-mighty-networks-2026

> Preços de fornecedores mudam e muitos são sob consulta. Valores de blogs de concorrentes e de agências estão marcados como estimativa. Os números de conversão da seção 10 são hipóteses: o relatório de 90 dias do piloto vai trocá-los por números reais da Runner.
