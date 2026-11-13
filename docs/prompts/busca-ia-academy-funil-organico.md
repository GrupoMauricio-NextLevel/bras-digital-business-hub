# Busca, IA e Academy: o funil de venda orgânico da NextLevel (plano v3 e prompt mestre)

> Estado: **PLANO v3, NADA DESENVOLVIDO** (13/11/2026, pedido do dono). Frente: **[E-commerce]** (regra 60/25/15: aproxima a E-commerce do 10º lojista pagante).
> **Substitui a v2** (`docs/prompts/busca-e-ia-visibilidade-organica.md`, 09/11/2026). A v2 continua como histórico e como detalhe técnico de alguns pontos: quando esta v3 diz "mantido da v2, seção X", vale o que está lá.
> Pedido do dono, nas palavras dele: "Tudo isso que a gente está criando é para ser um belo funil de venda orgânico. Precisamos de um nível de rastreamento muito alto de onde as pessoas estão vindo. Detalhar muito os nichos, cada página para uma situação. Entregar conhecimento útil, de grande valia: um grande Academy. Entender todo o mecanismo de busca e das plataformas de IA e agir de forma reversa. Falar amplamente das dores do segmento e mostrar um caminho útil. Ter um funil para consultoria. Aproveitar a compra dentro do ChatGPT. Pense como o dono do negócio."
> Próxima decisão livre: **D290**. Cada fase registra a sua decisão em `docs/design/DECISIONS.md` e cita a decisão na base de conhecimento (D264).

---

## Sumário

**Parte A · O racional**
1. Resumo em uma página (o que muda da v2 para a v3)
2. Pensando como dono: a conta do funil orgânico
3. Como funcionam os buscadores, por dentro
4. Como funcionam as IAs que respondem, por dentro
5. Engenharia reversa: o que a máquina faz e o que nós construímos
6. IAs que compram: o racional para aproveitar a compra dentro do ChatGPT e das outras IAs
7. Diagnóstico atualizado (o que já existe e o que falta)

**Parte B · A estratégia**

8. NextLevel Academy: o centro de tudo
9. O mapa das dores (a matéria-prima do conteúdo)
10. Nichos, perfis e situações: cada página para uma situação
11. Arquitetura do site público (os 16 núcleos)
12. Os funis: teste grátis, consultoria, Academy e parceiros
13. Rastreamento de alto nível: de onde vem cada pessoa e quanto ela vale
14. Camada técnica (mantida da v2, ampliada)
15. Conteúdo que a IA consegue citar
16. Dados abertos, autoridade fora do site e presença dentro das IAs
17. As lojas dos lojistas como motor de alcance (e de venda dentro das IAs)
18. Matriz de situações: 60 caminhos até a NextLevel

**Parte C · Como operar**

19. Fábrica de conteúdo: como produzir muito sem perder qualidade
20. Calendário do varejo brasileiro (pauta do ano)
21. Medição, metas e o painel "Orgânico" no Master
22. Correções de eficiência (pensando como dono)
23. Fases, dependências e critérios de aceite
24. O que depende do dono
25. Riscos e proibições
26. Prompt mestre

---

# Parte A · O racional

## 1. Resumo em uma página

**A ideia central.** Não vamos "fazer SEO". Vamos montar **a maior escola gratuita e prática para quem quer vender online no Brasil**, com foco em quem vende moda, atacado e nos nichos que atendemos. Cada aula, artigo, ferramenta e página resolve uma dor de verdade. Quem aprende com a gente passa a confiar na gente. Quando chega a hora de ter loja, contratar migração ou pedir ajuda, a NextLevel é o nome que a pessoa (e a IA que ela consulta) já conhece.

**Por que isso funciona com buscadores e IAs.** Os dois recomendam quem:
1. é fácil de ler por robô;
2. responde exatamente a pergunta;
3. tem fatos que se podem conferir, com fonte e data;
4. é citado por outros;
5. (nas IAs) é confirmado por várias fontes que dizem a mesma coisa;
6. **(novo na v3) cobre o assunto inteiro.** Quem tem 300 páginas boas sobre "vender online" vira a referência do assunto. Quem tem 10 páginas vira só mais um site.

**O que muda da v2 para a v3.**

| Tema | v2 (09/11) | v3 (hoje) |
|---|---|---|
| Objetivo | Ser encontrado | **Ser encontrado e vender**: funil orgânico medido do primeiro clique até a mensalidade paga |
| Conteúdo | ~80 páginas em 10 núcleos | **NextLevel Academy** com ~300 páginas no primeiro ano em 16 núcleos, trilhas com certificado, ferramentas, modelos para baixar e mapa de dores |
| Nichos | 6 nichos e 6 perfis | **30 nichos, 18 perfis e 25 situações**, com regra que impede página rasa |
| Rastreamento | GA4 e UTM | **Primeiro toque, último toque e todo o caminho**, origem "IA" separada, código de rastreio no WhatsApp, "como nos conheceu?" no cadastro e receita por conteúdo |
| Conversão | Cadastro | **Quatro funis**: teste grátis, consultoria (diagnóstico gratuito → proposta), Academy (aprender → confiar → contratar) e parceiros |
| Compra dentro das IAs | Uma linha "acompanhar" | **Racional em três camadas**: a NextLevel contratável por agente, as lojas dos lojistas vendendo nas IAs e a Academy como autoridade nº 1 em "como vender no ChatGPT" no Brasil |
| Ordem | Domínio, técnica, páginas | **Domínio e rastreamento primeiro** (medir desde o primeiro dia), depois Academy e páginas |

**As 10 alavancas, em ordem de impacto:**

| # | Alavanca | O que é |
|---|---|---|
| 1 | **Domínio e base técnica** | `nextlevelcommerce.com.br` com 301, sitemap completo, dados estruturados, Google e Bing verificados, IndexNow (mantido da v2) |
| 2 | **Rastreamento do funil inteiro** | Saber, para cada lojista pagante, por onde ele entrou, o que leu e o que o fez decidir |
| 3 | **Academy com conteúdo de verdade** | Artigos-pilar, guias, trilhas com certificado, glossário, modelos e estudos de caso, todos com fatos vindos do sistema |
| 4 | **Páginas de decisão** | Melhor plataforma, NextLevel × concorrente, sem taxa, quanto custa, migrar de X |
| 5 | **Nichos, perfis e situações** | Uma página para cada combinação que tem procura e conteúdo próprio |
| 6 | **Ferramentas grátis e o Raio-X da loja** | Calculadoras e um diagnóstico automático que já é a porta da consultoria |
| 7 | **Funil de consultoria** | Diagnóstico gratuito → relatório → conversa → proposta (Loja Pronta, migração, marketing, projeto exclusivo) |
| 8 | **Arquivos para IA e dados abertos** | `llms.txt`, espelhos `.md`, `/dados`, GitHub, Hugging Face (mantido da v2) |
| 9 | **Consenso fora do site** | Perfil no Google, YouTube, Reclame Aqui, diretórios, imprensa, parceiros, selo nas lojas |
| 10 | **Comércio por IA** | Lojas dos lojistas com feed e dados prontos para as compras dentro das IAs; GPT público; depois, servidor MCP e app |

**Metas (detalhe na seção 21).**
- **90 dias:** domínio novo indexado; rastreamento ligado; 60 páginas da Academy publicadas; primeiros 3 lojistas pagantes com origem orgânica comprovada.
- **180 dias:** 150 páginas; citada em 4 das 5 grandes IAs nas perguntas de atacado e taxa; 10% dos cadastros vindos de busca ou IA.
- **365 dias:** 300 páginas; o orgânico (busca, IA, Academy) como **o maior canal de lojistas pagantes**, com custo por lojista menor que qualquer canal pago.

---

## 2. Pensando como dono: a conta do funil orgânico

### 2.1 Por que orgânico é o melhor investimento agora
- **Anúncio é aluguel; conteúdo é imóvel.** O anúncio para quando o dinheiro para. Uma página boa traz visita por anos e fica mais forte com o tempo.
- **Somos pequenos contra gigantes.** Não ganhamos no leilão de anúncio da palavra "loja virtual". Ganhamos nas milhares de perguntas específicas ("loja virtual para vender grade fechada de jeans no atacado") que os gigantes não respondem bem.
- **As IAs mudaram o jogo a nosso favor.** A IA não escolhe pela verba de anúncio; escolhe quem responde melhor, com fatos e consenso. Isso nivela o campo.
- **O conteúdo serve três vezes:** atrai cliente novo, ajuda o lojista atual (menos suporte, menos cancelamento) e treina a equipe e os parceiros (a base de conhecimento interna, D264 e D266).

### 2.2 A conta (para acompanhar todo mês)

```
visitas orgânicas → leitores engajados → contatos (e-mail/WhatsApp) → cadastros → testes → pagantes → receita do ano
```

| Etapa | Taxa de referência para começar (ajustar com os nossos dados após 60 dias) |
|---|---|
| Visita → leitor engajado (leu 75% ou usou ferramenta) | 30% |
| Leitor engajado → contato (baixou material, diagnóstico, newsletter) | 5% a 10% |
| Contato → cadastro | 10% a 20% |
| Cadastro → pagante | definido pela taxa real do teste de 3 dias (medir) |

> As taxas acima são pontos de partida para planejar, não promessa. A primeira tarefa da fase S1 é medir as nossas.

**Exemplo de raciocínio:** para ganhar 10 lojistas pagantes por mês só pelo orgânico, com cadastro → pagante de 20% e contato → cadastro de 15%, precisamos de cerca de 330 contatos por mês. Com 7% de conversão de leitor engajado, são ~4.700 leitores engajados, ou ~16 mil visitas orgânicas por mês. Isso é alcançável com ~200 a 300 páginas boas em 9 a 12 meses. **É por isso que a meta de páginas é alta.**

### 2.3 O que um dono olharia toda segunda-feira
1. Quantos lojistas pagantes vieram do orgânico na semana, e de quais páginas.
2. Quais conteúdos geraram contato (e quais têm visita mas não geram nada: precisam de chamada melhor).
3. Quanto tempo a equipe leva para responder um contato (cada hora de atraso derruba a conversão).
4. O que as IAs estão dizendo da NextLevel (certo ou errado).

---

## 3. Como funcionam os buscadores, por dentro

O Google (e o Bing, que alimenta Copilot, DuckDuckGo, Yahoo e Ecosia) trabalha em quatro etapas. Em cada uma, a gente pode perder ou ganhar.

| Etapa | O que o buscador faz | Onde se perde | O que fazemos |
|---|---|---|---|
| **1. Descobrir** | Acha endereços novos por sitemap, links internos, links de fora e avisos (IndexNow no Bing) | Página sem link apontando para ela, fora do sitemap | Sitemap completo com `lastmod` real; toda página ligada a uma página-mãe; IndexNow a cada publicação |
| **2. Rastrear** | O robô baixa a página, respeitando `robots.txt` e um "orçamento" de visitas por site | Site lento, erro, redirecionamento em cadeia, páginas inúteis gastando a visita do robô | Página rápida, HTML com o texto já pronto (sem depender de JavaScript), painéis e lixo bloqueados |
| **3. Entender e indexar** | Lê título, texto, cabeçalhos, tabelas, dados estruturados, imagens; decide se a página merece entrar e qual é a versão principal (`canonical`) | Conteúdo duplicado, raso ou igual a outras mil páginas; dois endereços servindo a mesma página | Uma página por intenção, conteúdo próprio, `canonical` certo, JSON-LD coerente com o texto |
| **4. Classificar e mostrar** | Para cada busca, ordena as páginas pela **intenção** (o que a pessoa quer de fato), **utilidade** (o sistema de "conteúdo útil" do Google), **confiança** (experiência, conhecimento, autoridade e confiabilidade: o "E-E-A-T"), **links** de sites do mesmo assunto, **experiência de uso** (velocidade, celular, sem anúncio invasivo) e **frescor** quando o assunto muda | Texto genérico feito para robô; sem autor; sem prova; página lenta; data velha | Autor real com página própria, dado próprio, experiência de quem vive o Brás, data de revisão visível, velocidade |

**Os formatos de resultado que podemos ocupar no Google:**
- os 10 links azuis;
- a **Visão geral criada por IA** (o resumo no topo, que cita as fontes);
- "As pessoas também perguntam" (perguntas e respostas curtas: o nosso FAQ);
- trechos em destaque (resposta de 40 a 60 palavras logo abaixo de um título em forma de pergunta);
- vídeos (YouTube, com capítulos);
- imagens (Google Imagens e Lens);
- Perfil da Empresa no Maps;
- Google Shopping e as listagens grátis (para as lojas dos lojistas).

**O que o Google pune (e derruba o site inteiro):**
- "conteúdo em escala sem valor": muitas páginas iguais trocando só uma palavra (nicho, cidade, concorrente), feitas por IA ou não;
- texto escondido ou diferente para o robô;
- links comprados;
- páginas "porta de entrada" que só levam para outra.

> **Isso define a regra de ouro da v3: podemos e devemos criar muitas páginas, desde que cada uma tenha conteúdo próprio de verdade** (seção 10.4).

---

## 4. Como funcionam as IAs que respondem, por dentro

### 4.1 Duas memórias
Toda IA de conversa responde com duas fontes:

| Memória | O que é | Como entramos nela |
|---|---|---|
| **Memória de treino** | O que o modelo aprendeu lendo a internet até a data de corte. Responde sem buscar | Estar muito presente e consistente na web aberta **antes** do próximo treino: site liberado para os robôs de treino, conteúdo em muitos lugares, dados abertos, frase-padrão repetida |
| **Busca na hora** | Para perguntas atuais ou específicas, a IA busca na web e lê páginas | Ser a melhor página para cada pergunta e estar nas fontes que a IA já usa |

### 4.2 O que acontece quando a IA busca (o mecanismo que vamos "inverter")
1. **A pessoa pergunta:** "qual a melhor plataforma para vender roupa no atacado?".
2. **A IA desdobra a pergunta em várias buscas** (o "fan-out"): "plataforma ecommerce atacado grade", "nuvemshop atacado", "loja virtual pedido mínimo", "comparativo plataformas atacado 2026", "reclame aqui plataforma X"...
3. **Busca em um índice:** o Bing (Copilot e, em boa parte, ChatGPT), o Google (Gemini e Visão geral), índice próprio (Perplexity, Claude, ChatGPT pelo `OAI-SearchBot`).
4. **Abre algumas páginas e lê trechos**, não a página inteira com calma. Prefere trechos que respondem sozinhos ("A NextLevel Commerce tem atacado em todos os planos, desde o Start de R$ 57").
5. **Compara as fontes:** se três fontes dizem a mesma coisa, confia. Se só o site da empresa diz, hesita ou nem cita.
6. **Escreve a resposta e cita algumas fontes.** Normalmente 3 a 8 links.

### 4.3 O que isso significa para nós
- **Precisamos ganhar as buscas derivadas, não só a pergunta original.** Por isso o mapa de dores e os nichos: cada pergunta da pessoa gera 5 a 15 buscas, e queremos aparecer em várias.
- **Cada trecho precisa se sustentar sozinho:** nome da empresa + fato + contexto na mesma frase. Nada de "como dissemos acima".
- **Consenso fora do site é obrigatório** (seção 16).
- **Comparativos e listas "melhores plataformas" são o formato que a IA mais busca** para perguntas de escolha. Precisamos ter o nosso (honesto, com fonte) e estar nos de terceiros.
- **Bing importa muito mais do que parece:** alimenta Copilot e é uma das bases de busca de outras IAs.
- **Data visível e revisão frequente:** as IAs preferem fontes recentes para "2026".
- **Tráfego de IA chega muitas vezes sem origem registrada** (a pessoa copia o link, ou o aplicativo não envia de onde veio). Por isso o "como nos conheceu?" no cadastro (seção 13).

### 4.4 Quem lê o nosso site (robôs a liberar nas páginas públicas)
Mantido da v2, seção 2.2: `Googlebot`, `Google-Extended` (treino), `Bingbot`, `OAI-SearchBot`, `ChatGPT-User`, `GPTBot` (treino), `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `Applebot`, `Applebot-Extended`, `meta-externalagent`, `MistralAI-User`. **Recomendação mantida: liberar todos nas páginas públicas, inclusive para treino; painéis bloqueados.** Conferir os nomes na documentação oficial na hora de implementar (mudam).

---

## 5. Engenharia reversa: o que a máquina faz e o que nós construímos

| O que buscadores e IAs fazem | O que construímos em resposta | Onde no plano |
|---|---|---|
| Descobrem páginas por sitemap e links | Sitemap por núcleo, links internos automáticos entre artigos, nichos e páginas de decisão | 11, 14 |
| Desdobram a pergunta em muitas buscas | Mapa de dores (≈150 dores) e matriz de nichos × perfis × situações | 9, 10 |
| Leem trechos curtos | Molde de página com "resposta em 2 frases", fatos atômicos com data, tabela em HTML | 15 |
| Confiam em quem tem autor e experiência | Página do fundador e da equipe, autor em cada artigo, histórias reais do Brás, estudos de caso com autorização | 8, 11 |
| Preferem dado próprio | `/dados`, relatório anual, Termômetro do lojista (pesquisa própria), números da plataforma (agregados) | 16 |
| Confiam em consenso | Mesmos fatos no site, YouTube, Google, LinkedIn, Reclame Aqui, diretórios, parceiros | 16 |
| Citam listas e comparativos | `/melhor-plataforma-de-loja-virtual`, `/comparativo/*`, contato com autores das listas que as IAs citam | 11, 16 |
| Gostam de data recente | Data de revisão visível, revisão a cada 90 dias, `lastmod` real, IndexNow | 14, 19 |
| Respondem perguntas de "como fazer" | Academy (guias passo a passo) e central de ajuda pública | 8, 11 |
| Recomendam ferramentas | Calculadoras e Raio-X da loja, com resultado copiável | 12 |
| Compram e agem por agentes | Cadastro legível por agente, planos com dados estruturados, feeds das lojas, protocolo de compra quando houver no Brasil | 6, 17 |
| Aprendem no treino | Liberar robôs de treino, dados abertos em GitHub e Hugging Face, frase-padrão em todo lugar | 4.4, 16 |

**Rotina de engenharia reversa (todo mês, seção 21.3):**
1. Fazer as 60 perguntas-teste em 5 IAs e anotar as fontes que elas citam.
2. Perguntar à própria IA: "que buscas você faria para responder isso?". As respostas viram pauta.
3. Ler as páginas citadas e responder: o que elas têm que nós não temos? Fazer melhor.
4. Contatar os autores das listas citadas com os nossos dados abertos.

---

## 6. IAs que compram: o racional para aproveitar a compra dentro do ChatGPT

### 6.1 O que existe (conferir antes de implementar; muda rápido)
- **ChatGPT:** compra dentro da conversa ("Instant Checkout") e o protocolo aberto de comércio por agente (Agentic Commerce Protocol), lançado pela OpenAI com a Stripe em 2025, começando pelos Estados Unidos, com lojas da Shopify e da Etsy, e um formulário para lojistas enviarem o catálogo (feed de produtos).
- **Google:** listagens grátis do Merchant Center alimentam o Shopping, a Visão geral por IA e o Gemini; o Google anunciou protocolos para pagamento e compra por agente.
- **Microsoft Copilot:** produtos pelo Microsoft Merchant Center e compra dentro do Copilot em parceria com meios de pagamento.
- **Perplexity:** compras com parceiros de pagamento.
- **No Brasil:** a disponibilidade, os meios de pagamento aceitos (Pix, Mercado Pago) e as regras precisam ser conferidos na documentação oficial na fase S12. **Não prometer ao lojista nada que ainda não está liberado no Brasil.**

### 6.2 O racional em três camadas

**Camada 1 · A NextLevel contratável por agente (vender a nossa assinatura dentro da IA).**
- Hoje: quando alguém pede ao ChatGPT "crie uma loja virtual para mim", o agente navega. Precisamos que ele **chegue ao nosso cadastro e consiga concluir**: página de planos com preço em texto e JSON-LD (`SoftwareApplication` com `offers`), cadastro com rótulos claros, sem bloqueio desnecessário (v2, seção 8.6).
- Amanhã: se os protocolos de compra por agente passarem a aceitar assinaturas de software no Brasil, publicar os planos como produto contratável. Até lá, a página `/planos.md` e o `llms.txt` deixam os planos claros para o agente.
- Teste mensal nº 29 da v2 (mantido): "crie uma loja virtual de roupas para mim" no modo agente. Ele chegou ao nosso cadastro? Onde travou?

**Camada 2 · As lojas dos lojistas vendendo dentro das IAs (o diferencial de produto).**
- Cada loja NextLevel gera feed de produtos (`feed.xml`, já previsto na fila de integrações, Rodada A) no padrão do Google Merchant Center, que já alimenta o Gemini e o Shopping. O mesmo feed, ajustado, serve ao Microsoft Merchant Center e ao formulário de lojistas do ChatGPT.
- Dados de produto ricos fazem a IA recomendar: título claro, descrição sem enrolação, atributos (cor, tamanho, material, grade, preço de atacado), GTIN quando houver, fotos boas, estoque certo, política de troca e prazo de entrega em texto.
- O painel do lojista ganha o **"Pronto para IA"** (estende o "check de busca" da v2, seção 13): nota de 0 a 100 dos produtos, com o que falta.
- **Quando o protocolo estiver disponível no Brasil**, ligar a loja como vendedora dentro das IAs vira recurso de plano. Mensagem de venda: "sua loja preparada para ser encontrada e vender dentro das IAs". Só depois de funcionar de verdade.

**Camada 3 · A Academy como referência nº 1 em "vender pela IA" no Brasil.**
- É um assunto novo, com muita procura e pouco conteúdo em português. **Quem explicar primeiro e melhor vira a fonte que as próprias IAs citam.**
- Trilha da Academy "Vender na era da IA": como a IA escolhe produtos, como preparar o catálogo, como aparecer no Google Shopping grátis, como funciona a compra no ChatGPT (e o que já vale no Brasil), como usar IA para descrição e foto, como responder clientes com IA.
- Isso puxa o lojista para a camada 2 e, de quebra, nos coloca como autoridade.

**Camada 4 (futuro, v2 seção 12) · Ferramentas dentro das IAs:** GPT público "Consultor de Loja Virtual", servidor MCP com simulador de custo e sugestão de tema, app no ChatGPT para o lojista ver pedidos. Depois das camadas 1 a 3.

---

## 7. Diagnóstico atualizado (13/11/2026)

### 7.1 Achados da v2 (seção 3) que continuam abertos
Todos os 22 achados da v2 continuam abertos, porque nada foi desenvolvido. Os mais urgentes: textos vencidos (achados 1 a 3: "atacado em breve", "teste de 7 dias", comissão sobre setup), sitemap incompleto (5), sem Search Console e Bing (11), sem 301 entre endereços da marca (17), sem central de ajuda pública (18).

### 7.2 Novos achados (rastreamento e funil)

| # | Achado | Gravidade | Onde |
|---|---|---|---|
| 23 | A origem guarda **só o último toque**, por 30 dias (`nl-attr` no `src/proxy.ts`). Não sabemos **por onde a pessoa entrou pela primeira vez**, nem o caminho entre o primeiro e o último toque | Alta | `src/proxy.ts`, `src/lib/attribution.ts` |
| 24 | `origemDe` (`src/lib/domain/visitas.ts`) reconhece Google, Instagram, Facebook, TikTok, WhatsApp, YouTube, Bing e Pinterest, mas **não reconhece IAs** (chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai, meta.ai) | Alta | `visitas.ts` |
| 25 | Não guardamos a **página de entrada** nem os **conteúdos lidos** antes do cadastro | Alta | — |
| 26 | Não há **contagem de visitas das páginas públicas** (só das lojas, `store_visits_daily`) | Alta | — |
| 27 | Conversas de WhatsApp iniciadas no site **não carregam a origem** (não sabemos de qual página a pessoa chamou) | Alta | botões de WhatsApp |
| 28 | O cadastro **não pergunta "como nos conheceu?"**, que é a única forma de medir a IA que chega sem origem | Média | cadastro |
| 29 | `/ferramentas` tem 2 calculadoras (preço com margem, frete grátis), sem salvar resultado, sem captura opcional de contato e sem dado estruturado | Média | `src/app/(portal)/ferramentas` |
| 30 | **Não existe blog, Academy nem guia público.** A base de conhecimento (aulas e fatos, D264 a D266) é só para a equipe | Alta | `src/lib/conhecimento/` |
| 31 | Os contatos (`brand_leads`) têm `attribution` e `needs`, mas **não há sequência de e-mails** por interesse (nutrição) | Média | `src/lib/domain/brand-leads.ts` |
| 32 | Não existe **painel de funil orgânico** no Master (receita por conteúdo, por canal, por IA) | Alta | `src/app/master/crescimento` |
| 33 | Não há **pergunta-chave de qualificação** no diagnóstico (faturamento, canal atual, nicho) ligada a uma proposta pronta | Média | diagnóstico |
| 34 | `/meu-contador` existe: é um ativo para conteúdo de impostos e MEI, com revisão de quem entende do assunto | Oportunidade | `src/app/(portal)/meu-contador` |

### 7.3 O que já temos e vamos reaproveitar (regra anti-duplicação)
- Fatos vivos do sistema: `src/lib/conhecimento/fatos.ts` (base de conhecimento, D264 a D266). **A Academy usa a mesma fonte.**
- Comparativo e placar: `src/lib/marcas/comparativo-ecommerce.ts`, `src/lib/marcas/placar-seed.ts`.
- Preços: `getPriceBook`; regras de parceiros: `getPartnerSettings`.
- Atribuição: `nl-attr`/`nl-ref` no proxy, `currentAttribution`/`withAttribution`, `brand_leads.attribution`, UTM nos pedidos das lojas.
- Contato e diagnóstico: `brand_leads` (`LEAD`, `DIAGNOSTIC`, `SAIDA`).
- Assistente "Pede pro Mauricio" (conversas por canal): as perguntas mais feitas viram pauta.
- E-mail: `src/lib/email.ts` (Resend).
- Temas por nicho: `src/lib/themes/catalog.ts` (26 temas).
- Páginas públicas existentes: `/comparativo`, `/recursos`, `/integracoes`, `/ferramentas`, `/temas`, `/temas-nuvemshop`, `/faq`, `/planos`, `/parceiros`, `/quero-minha-loja`, `/solucoes`, `/meu-contador`, `/como-funciona`, `/clientes`.

---

# Parte B · A estratégia

## 8. NextLevel Academy: o centro de tudo

### 8.1 O que é
A escola gratuita da NextLevel para quem vende ou quer vender online. **Ensina de verdade, mesmo quem nunca vai contratar.** Fala a língua do lojista do Brás, da revendedora, da confecção e da importadora. Cada conteúdo termina com um próximo passo útil, que às vezes é a NextLevel e às vezes não (honestidade gera confiança e citação).

- **Nome sugerido:** "NextLevel Academy" (decisão do dono; alternativa: "Escola NextLevel").
- **Endereço:** `nextlevelcommerce.com.br/academy` (pasta, **não** subdomínio: a autoridade da Academy soma no domínio principal).
- **Autor:** cada artigo tem autor real (fundador, equipe ou especialista convidado), com página própria. Rascunho com IA é permitido; revisão humana é obrigatória.

### 8.2 Formatos

| Formato | O que é | Exemplo | Por que serve ao funil |
|---|---|---|---|
| **Artigo-pilar** | Guia completo de um tema grande (3.000 a 6.000 palavras), com índice | "Guia completo para vender no atacado pela internet" | Ganha buscas amplas, recebe links, é a página-mãe do núcleo |
| **Guia prático** | Passo a passo de uma tarefa (1.200 a 2.500 palavras) | "Como montar a grade fechada de jeans" | Responde "como fazer"; `HowTo` |
| **Resposta rápida** | Uma pergunta, resposta em 3 a 6 frases e links | "Qual a diferença entre tarifa da plataforma e taxa do Mercado Pago?" | Vira trecho em destaque e é o que a IA cita |
| **Trilha com certificado** | 5 a 10 aulas em sequência, com teste final e certificado grátis em PDF e link | "Do Instagram à loja própria em 7 dias" | Captura contato (precisa de e-mail para o certificado); o certificado no LinkedIn traz link de volta |
| **Ferramenta** | Calculadora ou gerador com resultado copiável | "Calculadora de preço de atacado" | Atrai links e uso recorrente |
| **Modelo para baixar** | Planilha, checklist, roteiro, contrato simples | "Planilha de precificação para confecção", "Checklist da Black Friday" | Isca de contato |
| **Estudo de caso** | Loja real, com autorização, números reais | "Como a loja X saiu do direct e passou a vender para 12 estados" | Prova; o que IA e cliente mais valorizam |
| **Glossário** | 150 termos do e-commerce e do atacado em português simples | "O que é grade fechada" | Muitas buscas pequenas; `DefinedTermSet` |
| **Comparativo e "melhor"** | Decisão de compra, com fonte e data | "Melhor plataforma para atacado 2026" | Fundo de funil |
| **Notícias que mudam o jogo** | O que mudou (regra do Pix, taxa de marketplace, compra no ChatGPT) e o que fazer | "Compra dentro do ChatGPT: o que muda para o lojista brasileiro" | Frescor; as IAs buscam o recente |
| **Relatório e pesquisa** | Dado próprio anual e "Termômetro do lojista" (pesquisa trimestral com lojistas e parceiros) | "Quanto custa vender online no Brasil em 2026" | Imprensa e IA citam |
| **Vídeo e aula ao vivo** | A série do YouTube e aulas abertas mensais | "Live: prepare sua loja para o Natal" | Busca do YouTube; confiança |
| **Newsletter semanal** | "Segunda do lojista": 1 dica, 1 dado, 1 ferramenta | — | Mantém o contato quente até ele estar pronto |

### 8.3 Trilhas iniciais (com certificado)

| # | Trilha | Para quem | Aulas (resumo) |
|---|---|---|---|
| 1 | **Começar a vender online do zero** | Quem nunca vendeu | Escolher o que vender, CNPJ ou MEI, primeiras fotos, preço, loja ou marketplace, primeira venda |
| 2 | **Do direct do Instagram à loja própria** | Revendedora e quem vende pelo WhatsApp | Por que o direct trava o crescimento, catálogo, link na bio, pagamento automático, frete, atendimento |
| 3 | **Atacado online sem dor de cabeça** | Atacadista, confecção, importadora | Grade, pedido mínimo, preço por quantidade, cliente de outros estados, frete de volume, inadimplência |
| 4 | **Margem e preço que fecham a conta** | Todos | Custo real, taxas (plataforma, pagamento, marketplace), impostos básicos, preço de atacado e varejo, ponto de equilíbrio |
| 5 | **Fotos e descrição que vendem** | Todos | Foto no celular, fundo, luz, vídeo curto, descrição, uso de IA |
| 6 | **Frete e entrega** | Todos | Correios e transportadoras, Melhor Envio, frete grátis acima de X, embalagem, troca e devolução |
| 7 | **Trazer visitas sem depender só de anúncio** | Lojista com loja nova | Google grátis, Instagram, TikTok, WhatsApp, parceiros, e-mail |
| 8 | **Loja própria e marketplace juntos** | Quem vende em Shopee, Mercado Livre | Quando cada um vale, taxas, como levar o cliente para a loja |
| 9 | **Vender na era da IA** | Todos | Como a IA escolhe, catálogo pronto para IA, Google Shopping grátis, compra no ChatGPT, IA no atendimento |
| 10 | **Datas que vendem** | Todos | Calendário do varejo, Black Friday, Natal, Dia das Mães |
| 11 | **Do Brás para o Brasil** | Lojista físico do Brás, Bom Retiro, 25 de Março | Por que o movimento caiu, cliente da excursão no digital, catálogo para lojista de outros estados |
| 12 | **Parceiro NextLevel: indicar com ética** | Quem quer ser parceiro | Como funciona, sem promessa de ganho; liga ao programa de parceiros |

### 8.4 Como a Academy vende (sem parecer propaganda)
- **Blocos de "remédio" dentro do conteúdo:** no ponto exato em que o artigo descreve a dor, um quadro discreto "Na NextLevel, isso é feito assim" com o recurso e o link (ex.: no guia de grade, o quadro mostra a grade fechada da plataforma).
- **Uma chamada principal por página**, escolhida pelo estágio do leitor: topo de funil → material grátis ou trilha; meio → diagnóstico ou ferramenta; fundo → teste grátis ou conversa.
- **Selo "aprendeu com a NextLevel"** no certificado e no rodapé dos modelos baixados.
- **Retorno ao aluno:** quem fez a trilha e criou loja ganha atenção especial no teste (decisão do dono: benefício a definir, seção 24).

---

## 9. O mapa das dores (a matéria-prima do conteúdo)

**Regra:** toda dor tem (1) artigos e respostas rápidas que a explicam com profundidade, (2) uma ferramenta ou modelo que alivia na hora, (3) o "remédio" NextLevel quando existir de verdade e (4) a chamada certa. Dor sem remédio nosso também vira conteúdo (gera confiança e autoridade), com indicação honesta.

### 9.1 Dores por grupo

| Grupo | Dores (como o lojista fala) | Remédio NextLevel (quando há) | Ferramenta ou modelo |
|---|---|---|---|
| **Começar** | "Não sei por onde começar"; "tenho medo de investir e não vender"; "não tenho tempo"; "não entendo de tecnologia"; "preciso de CNPJ?"; "loja ou marketplace?"; "quanto preciso para começar?" | Teste grátis, temas por nicho, Loja Pronta Express, WhatsApp com gente | Simulador "quanto custa começar", checklist de abertura |
| **Visitas** | "Minha loja não tem visita"; "o Instagram não entrega mais"; "anúncio está caro"; "não apareço no Google" | SEO da loja, feed para o Google, check de busca | Guia de Google grátis, Raio-X da loja |
| **Conversão** | "Tem visita mas não vende"; "abandonam o carrinho"; "o cliente pergunta tudo no WhatsApp e some"; "não confiam na loja" | Checkout, recuperação de carrinho (se houver), selos, avaliações reais | Checklist de confiança, Raio-X |
| **Dinheiro e taxas** | "As taxas comem minha margem"; "a plataforma cobra por venda"; "não sei quanto lucro de verdade"; "o dinheiro demora para cair"; "chargeback"; "Pix ou cartão?" | 0% de tarifa da plataforma com Mercado Pago, Pix | Calculadora de margem, de taxa do cartão, comparativo de custo anual |
| **Preço** | "Não sei precificar"; "o concorrente vende mais barato"; "preço de atacado e varejo na mesma loja" | Lista de preço de atacado, preço por quantidade | Calculadora de preço de atacado, planilha de precificação |
| **Impostos e formalização** | "MEI pode vender online?"; "Simples Nacional"; "nota fiscal de venda online"; "estourei o limite do MEI" | `/meu-contador` (com revisão de contador) | Guia com revisão profissional; nunca conselho fiscal individual |
| **Estoque e grade** | "Vendo o que não tenho"; "controlo no caderno"; "grade quebrada"; "variações de cor e tamanho" | Estoque, grade, variantes, integrações com ERP | Planilha de grade, guia de cadastro em lote |
| **Frete e entrega** | "Frete caro afasta o cliente"; "não sei calcular"; "frete grátis compensa?"; "devolução e troca" | Frete integrado, frete grátis acima de X | Calculadora de frete grátis (já existe), simulador de frete |
| **Atendimento** | "O WhatsApp está lotado"; "respondo a mesma pergunta 50 vezes"; "atendo de madrugada" | Maurício (IA da loja), FAQ da loja, atendimento ao vivo | Modelos de respostas prontas |
| **Marketplace** | "A Shopee aumentou a taxa"; "guerra de preço"; "conta suspensa"; "cliente não é meu" | Loja própria junto com o marketplace | Calculadora "quanto fica com você em cada canal" |
| **Atacado** | "Pedido mínimo"; "catálogo em PDF desatualizado"; "cliente de outro estado"; "vendedores externos"; "inadimplência"; "excursão diminuiu" | Atacado nativo em todos os planos, catálogo online, pedido mínimo | Guia de atacado, modelo de política comercial |
| **Marca e produto** | "Meu produto é igual ao de todo mundo"; "foto ruim"; "como criar marca própria" | Temas premium, projeto exclusivo, estúdio (sob consulta) | Guia de marca, checklist de fotos |
| **Digitalização do físico** | "A loja física perdeu movimento"; "o aluguel no Brás está caro"; "meu cliente lojista agora compra online" | Loja + atacado online, equipe no Brás, migração | Trilha "Do Brás para o Brasil" |
| **Migração** | "Estou na Nuvemshop e pago caro"; "tenho medo de perder tudo ao trocar"; "minha loja está lenta" | Migração pela equipe | Guias "migrar da X", comparativos |
| **Confiança e segurança** | "Plataforma nova é confiável?"; "golpe de falso pagamento"; "e se a plataforma fechar?"; "meus dados" | `/seguranca`, Reclame Aqui respondido, exportação de dados | Guia "como se proteger de golpes na venda online" |
| **Crescimento e equipe** | "Não dou conta sozinha"; "contratar vendedor"; "como saber o que vende mais" | Relatórios, equipe na loja (se houver) | Planilha de metas, guia de indicadores |
| **Datas e sazonalidade** | "A Black Friday não vendeu"; "Natal chegou e não preparei" | Campanhas, cupons, banners | Calendário do varejo, checklists por data |
| **IA** | "Todo mundo fala de IA e eu não sei usar"; "como aparecer no ChatGPT" | Maurício, Pronto para IA (camada 2) | Trilha "Vender na era da IA" |

**Meta da fase S3:** transformar esse quadro em **≈150 dores escritas** (uma linha cada, na voz do lojista), cada uma ligada a pelo menos uma página. A lista vive num arquivo de dados (seção 19) e alimenta a pauta.

### 9.2 Fontes para descobrir mais dores (contínuo)
- Perguntas do assistente "Pede pro Mauricio" e da ajuda do lojista (sem dado pessoal).
- Conversas de venda no WhatsApp (equipe anota as objeções).
- Reclame Aqui dos concorrentes (reclamações mais comuns = dores reais).
- Comentários dos vídeos do YouTube sobre loja virtual e atacado.
- "As pessoas também perguntam" e o autocompletar do Google.
- Grupos e comunidades de lojistas (só ler; responder identificado, v2 seção 11.2).
- Executivos de rua e parceiros (o que o lojista do Brás pergunta na porta da loja).

---

## 10. Nichos, perfis e situações: cada página para uma situação

### 10.1 Nichos (30)
Começar pelos que já têm tema e lojista; os outros entram em ondas.

| Onda | Nichos |
|---|---|
| **1 (já temos tema e público)** | Moda feminina · Moda masculina · Atacado de roupas · Jeans · Moda plus size · Moda fitness · Moda praia · Moda infantil · Cosméticos e maquiagem · Acessórios de celular (capinhas) · Camisas de time · Casa e decoração |
| **2** | Moda íntima · Moda evangélica e moda modesta · Calçados · Bolsas e mochilas · Bijuterias e semijoias · Perfumes · Cama, mesa e banho · Utilidades domésticas · Óculos e relógios · Eletrônicos pequenos e acessórios |
| **3** | Brinquedos · Papelaria · Pet · Artigos de festa · Presentes e personalizados · Artesanato · Suplementos (com cuidado com regras sanitárias) · Moda country e agro |

**O que toda página de nicho precisa ter (conteúdo próprio, não troca de palavra):**
1. Resposta em 2 frases ("Para vender [nicho] online no atacado e no varejo...").
2. **As dores específicas daquele nicho** (ex.: jeans: grade com numeração, troca por tamanho; cosméticos: validade, regras da Anvisa; capinhas: milhares de modelos por aparelho).
3. **Como é a grade, a variação e o cadastro** naquele nicho.
4. **Fotos que funcionam** no nicho (com exemplo real).
5. **Frete típico** (peso, volume, embalagem).
6. **Calendário do nicho** (moda praia: setembro a fevereiro; volta às aulas para papelaria).
7. **Margem e preço:** como calcular, com link para a calculadora (sem inventar número de mercado sem fonte).
8. **Tema recomendado** com prévia.
9. **Checklist de abertura** do nicho.
10. **Estudo de caso** do nicho quando houver lojista real que autorize.
11. FAQ de 6 a 10 perguntas do nicho.
12. Links para os guias da Academy e para as páginas de perfil e situação relacionadas.

### 10.2 Perfis (18)
Revendedora (porta a porta e catálogo) · Sacoleira · Confecção própria · Facção que quer ter marca · Importadora · Atacadista do Brás · Atacadista do Bom Retiro · Lojista da 25 de Março · Lojista de shopping ou loja de rua · Loja de bairro · Marca própria nova · Influenciadora que quer a própria marca · Quem vende só no Instagram ou no WhatsApp · Quem vende em marketplace (Shopee, Mercado Livre, Shein) · Quem está na Nuvemshop, Tray, Loja Integrada, WBuy ou Shopify · MEI começando · Empresa que quer canal B2B (vender para lojistas) · Agência que monta lojas para clientes.

### 10.3 Situações (25)
Abrir a primeira loja · Sair do direct · Sair ou complementar o marketplace · Migrar de plataforma · A loja física perdeu movimento · Vender para outros estados · Começar o atacado online · Separar atacado e varejo · Montar catálogo para lojistas · Preparar a Black Friday · Preparar o Natal · Dia das Mães · Volta às aulas · Lançar coleção · Liquidar estoque parado · Contratar o primeiro vendedor · Formalizar (MEI ou CNPJ) · Estourou o limite do MEI · Golpe ou chargeback · Plataforma atual ficou cara · Loja lenta · Quer aparecer no Google · Quer vender pela IA · Quer marca própria · Quer renda extra indicando lojas (parceiros).

### 10.4 A regra que impede página rasa (combinação controlada)
Nicho × perfil × situação daria milhares de páginas. **Não vamos gerar todas.** Uma combinação só vira página quando passa nos **quatro portões**:

1. **Procura:** existe busca (Planejador de Palavras-chave, Search Console, autocompletar) ou pergunta real (assistente, WhatsApp, executivos).
2. **Conteúdo próprio:** pelo menos **40% do texto é exclusivo** daquela combinação (dores, exemplos, grade, frete, caso), conferido por teste de semelhança contra as páginas irmãs.
3. **Prova:** pelo menos um elemento real (caso, foto de loja, dado, depoimento autorizado, vídeo).
4. **Revisão humana** antes de publicar.

Combinação que não passa vira **seção** dentro da página do nicho ou do perfil, não página própria. Exemplos que provavelmente passam: "loja virtual de jeans no atacado para confecção", "moda plus size no atacado do Brás", "capinhas no atacado para revendedora".

### 10.5 Polos de atacado
Mantido da v2 (seção 6.2): Brás primeiro; Bom Retiro, 25 de Março, Rua 44 (Goiânia), polo do Agreste (Caruaru, Toritama, Santa Cruz do Capibaribe), Jaraguá, Fortaleza, Nova Serrana e Franca **só quando houver presença ou conteúdo real** (executivo, parceiro, lojista ou reportagem própria).

---

## 11. Arquitetura do site público (os 16 núcleos)

Cada núcleo tem uma página-mãe que liga todas as filhas; cada filha liga de volta e para 3 a 6 irmãs relacionadas (links automáticos pela tabela de conteúdo, seção 19).

| # | Núcleo | Página-mãe | Filhas (tamanho no 1º ano) |
|---|---|---|---|
| 1 | **Academy** | `/academy` | Trilhas (`/academy/trilhas/<trilha>`, 12), aulas (~80), certificados |
| 2 | **Guias e artigos** | `/academy/guias` | Pilares (~12) e guias práticos (~80), por categoria (começar, vender, dinheiro, atacado, frete, marketing, IA, datas) |
| 3 | **Perguntas** | `/perguntas` | Respostas rápidas (~100), incluindo as 60 perguntas-teste das IAs |
| 4 | **Glossário** | `/glossario` | Termos (~150) |
| 5 | **Comparar** | `/comparativo` | `/melhor-plataforma-de-loja-virtual`, `/comparativo/nextlevel-x-<concorrente>` (5), `/loja-virtual-sem-taxa`, `/quanto-custa-uma-loja-virtual`, `/loja-propria-ou-marketplace` |
| 6 | **Migrar** | `/migrar` | `/migrar/da-<plataforma>` (5), com passo a passo e o que a equipe faz |
| 7 | **Nichos** | `/loja-virtual-para` | `/loja-virtual-para/<nicho>` (12 na onda 1, 30 no total) |
| 8 | **Perfis** | `/para-quem` | `/para/<perfil>` (18) |
| 9 | **Situações** | `/situacoes` | `/situacoes/<situação>` (25) e combinações aprovadas nos portões (10.4) |
| 10 | **Polos** | `/atacado-online` | `/atacado-online/bras` e os polos com presença real |
| 11 | **Temas** | `/temas` | `/temas/<tema>` (26), com nicho no título (já existe; completar) |
| 12 | **Recursos e integrações** | `/recursos`, `/integracoes` | Uma página por recurso forte e por integração real (já existem as mães) |
| 13 | **Ferramentas** | `/ferramentas` | 10 ferramentas (seção 12.4), incluindo o Raio-X |
| 14 | **Ajuda** | `/ajuda` | Um artigo por tarefa do lojista (~60), a partir da base de conhecimento |
| 15 | **Dados** | `/dados` | Conjuntos abertos, relatório anual, Termômetro do lojista |
| 16 | **Empresa e confiança** | `/sobre` | `/sobre/fundador`, `/equipe`, `/autores/<nome>`, `/seguranca`, `/novidades`, `/imprensa`, `/casos` (estudos de caso), `/vitrine-de-lojas`, `/black-friday`, `/parceiros` e subpáginas |

**Total previsto no 1º ano:** ≈ 300 páginas de conteúdo + as páginas de produto existentes, publicadas em ondas (seção 23), nunca de uma vez.

**Molde de qualidade de toda página** (mantido da v2, seção 7, ampliado):
- resposta direta nas 2 primeiras frases;
- conteúdo útil (resposta rápida: 150 a 400 palavras; nicho e perfil: 1.200+; guia: 1.500+; pilar: 3.000+);
- tabela ou lista de critérios em HTML;
- FAQ de 4 a 10 perguntas;
- autor, data de publicação e de revisão visíveis;
- fonte em cada número de concorrente;
- bloco "remédio" quando houver;
- uma chamada principal pelo estágio do leitor;
- links para a página-mãe e 3 a 6 irmãs;
- revisão do dono na primeira página de cada tipo.

**Páginas que não criaremos:** cidade sem presença real; "alternativa a X" sem conteúdo próprio; combinação que não passa nos 4 portões; "avaliações" sem avaliações reais; conteúdo de impostos sem revisão profissional.

---

## 12. Os funis

### 12.1 Estágios e chamadas

| Estágio | O que a pessoa pensa | Conteúdo | Chamada principal |
|---|---|---|---|
| **Topo** (descobre a dor) | "Minhas vendas no Instagram caíram" | Artigos de dor, glossário, perguntas | Material grátis, trilha, newsletter |
| **Meio** (procura solução) | "Preciso de loja própria? Quanto custa?" | Guias, nichos, perfis, situações, ferramentas | Ferramenta, Raio-X, diagnóstico gratuito |
| **Fundo** (escolhe fornecedor) | "NextLevel ou Nuvemshop?" | Comparativos, planos, casos, segurança | Teste grátis, conversa no WhatsApp |
| **Depois da compra** | "Como faço X?" | Ajuda, Academy | Recurso de plano maior, indicação (parceiros) |

### 12.2 Funil 1 · Teste grátis (autoatendimento)
Página → cadastro → teste de 3 dias → assinatura. Melhorias:
- cadastro curto, legível por agente de IA, com "como nos conheceu?" (seção 13.5);
- no primeiro acesso, a loja já vem com o tema do nicho de onde a pessoa veio (a página de entrada diz o nicho);
- mensagem de boas-vindas e e-mails do teste citando o conteúdo que a pessoa leu ("você leu o guia de grade: veja como fazer isso na sua loja em 2 minutos").

### 12.3 Funil 2 · Consultoria (o caminho para quem precisa de ajuda)
Quem tem operação maior, medo de migrar ou pouco tempo não quer "testar sozinho". Quer conversar. O funil:

1. **Porta de entrada gratuita e útil:**
   - **Raio-X da loja** (ferramenta automática): a pessoa informa o endereço da loja atual ou do Instagram e recebe um relatório com velocidade, presença no Google, itens básicos de confiança, comparação de custo com a NextLevel e 5 recomendações. **Útil mesmo se ela não contratar.**
   - **Diagnóstico gratuito** (já existe como `brand_leads` com `kind = DIAGNOSTIC`): perguntas curtas de qualificação (nicho, canal atual, faturamento por faixa, plataforma atual, maior dor).
2. **Relatório automático** por e-mail e na tela, com a recomendação de caminho:
   - "faça sozinho" → teste grátis com o tema do nicho;
   - "precisa de ajuda para começar" → Loja Pronta Express;
   - "precisa migrar" → migração pela equipe;
   - "precisa de visitas" → serviços de marketing (NextLevel Soluções);
   - "precisa de algo sob medida" → projeto exclusivo.
3. **Conversa** (WhatsApp ou vídeo de 20 minutos) com agenda, já com o relatório na tela do vendedor.
4. **Proposta** pelo sistema de contratos com aceite no painel (D276), sem preço de serviço nas páginas públicas.
5. **Prazo de resposta:** contato de diagnóstico respondido em até 15 minutos no horário comercial (meta; seção 22).

### 12.4 Funil 3 · Academy (aprender → confiar → contratar)
- **Iscas de contato** (troca de e-mail ou WhatsApp, com consentimento LGPD):
  - certificado das trilhas;
  - planilhas (precificação, grade, metas, fluxo de caixa simples);
  - checklists (abertura de loja, Black Friday, Natal, fotos, migração);
  - modelos (política de troca, política comercial de atacado, respostas prontas de WhatsApp);
  - relatório anual completo em PDF.
- **Ferramentas (10):** custo da plataforma (comparativo anual), margem, preço de atacado, taxa do cartão e do Pix, frete grátis acima de X (existe), ponto de equilíbrio, quanto fica em cada canal (loja × marketplace), tamanho do pedido mínimo, gerador de descrição de produto (IA, limitado), Raio-X da loja.
- **Nutrição por interesse:** sequências curtas de e-mail (Resend, `src/lib/email.ts`) por trilha ou isca: 5 a 7 e-mails, cada um ensinando algo; o 3º ou 4º apresenta o remédio NextLevel; o último oferece teste ou conversa. Descadastro em um clique.
- **Pontuação do contato** (simples): leu 3+ conteúdos, usou ferramenta, abriu planos, voltou em 7 dias → "quente" → aparece na fila do comercial.

### 12.5 Funil 4 · Parceiros
Conteúdo da Academy para quem quer indicar (sem promessa de ganho), trilha 12 e páginas de parceiros (v2). O parceiro recebe **kit de conteúdo** (links da Academy com o código dele): cada artigo compartilhado leva o `ref` do parceiro. **A Academy vira ferramenta de venda do parceiro.**

---

## 13. Rastreamento de alto nível

### 13.1 O que queremos saber de cada lojista pagante
1. **Primeiro toque:** por onde chegou a primeira vez (canal, origem, campanha, página de entrada, data).
2. **Caminho:** quais conteúdos leu, quais ferramentas usou, quantas visitas, quantos dias até decidir.
3. **Último toque:** o que o fez cadastrar (página e chamada).
4. **Como ele diz que nos conheceu** (auto-relato no cadastro).
5. **Quanto vale:** plano, meses pagos, receita.

Com isso, o Master responde: **"quanto de receita cada conteúdo, nicho, canal e IA trouxe"**.

### 13.2 Canais padronizados
Todo toque é classificado em um canal só:

| Canal | Como reconhecemos |
|---|---|
| Busca orgânica | Origem `google.*`, `bing.*`, `duckduckgo.*`, `yahoo.*`, `ecosia.*`, `brave.*`, `yandex.*` sem UTM pago |
| **IA** | Origem `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`, `meta.ai`, `grok.com`, `deepseek.com`, `you.com`, ou `utm_source` com esses nomes (o ChatGPT acrescenta `utm_source=chatgpt.com`) |
| Redes sociais orgânicas | Instagram, Facebook, TikTok, YouTube, LinkedIn, Pinterest, Kwai sem UTM pago |
| WhatsApp | `wa.me`, `whatsapp.*`, ou link com UTM de WhatsApp |
| Parceiros | `ref` de parceiro (`/r/`, `/c/`) |
| Executivos de rua | QR com UTM do executivo |
| E-mail | `utm_medium=email` |
| Pago | `utm_medium` = `cpc`, `paid`, `ads`; `gclid`, `fbclid` com campanha paga |
| Direto ou desconhecido | Sem origem |
| Lojas dos lojistas | Selo "Feito com NextLevel" (`utm_source=selo-loja&utm_content=<loja>`) |

**Padrão de UTM** (documento curto em `docs/infra/utm-padrao.md` na fase S1): `utm_source` (onde), `utm_medium` (tipo), `utm_campaign` (assunto ou data), `utm_content` (peça), sempre em minúsculas e sem acento. O kit de parceiros e executivos já sai com o padrão.

### 13.3 Como guardar (estender o que existe, sem dado pessoal antes do consentimento)
- **Proxy (`src/proxy.ts`):**
  - manter `nl-attr` (último toque, 30 dias) e **acrescentar `nl-first`** (primeiro toque, 180 dias: canal, origem, campanha, página de entrada, data), gravado só quando não existe;
  - **acrescentar `nl-vid`**: identificador aleatório do visitante (sem dado pessoal), **só com consentimento** de cookies de medição;
  - `origemDe` passa a reconhecer as IAs (achado 24) e a devolver o canal da tabela 13.2.
- **Visitas das páginas públicas (agregado, sem consentimento necessário):** tabela diária por página, canal e aparelho, no mesmo padrão de `store_visits_daily` (contagem, sem IP, sem cookie, robôs fora). Ex.: `portal_visits_daily (dia, marca, caminho, canal, aparelho, visitas)`.
- **Toques do visitante (com consentimento):** tabela de eventos curta, ex.: `funil_toques (visitante, quando, tipo, caminho, canal, conteúdo)`, com tipos: `entrada`, `leitura_75`, `ferramenta`, `download`, `chamada_clicada`, `whatsapp`, `diagnostico`, `cadastro`. Guardar 12 meses e apagar depois.
- **Ligação com o cliente:** no cadastro do lojista, no `brand_leads` e no diagnóstico, gravar `primeiro_toque`, `ultimo_toque`, `visitante` (se houver consentimento) e `como_conheceu`. Quando o lojista paga, a receita fica ligada ao caminho.
- **Robôs de IA (v2, seção 16.3):** contagem diária por robô e por página, no proxy, sem banco a cada visita.
- **Search Console e Bing Webmaster:** importação semanal (API) de buscas, impressões, cliques e posição **por página** para o Master. (O Google não informa a busca de cada pessoa; o cruzamento é por página de entrada.)
- **GA4 e Gerenciador de Tags (fila de integrações I-01 e I-02):** opcionais, para comparar. **A fonte da verdade é o nosso banco**, porque liga visita a receita.

### 13.4 WhatsApp com rastreio
Todo botão de WhatsApp no site leva uma mensagem pronta com um **código curto da página** (ex.: "Olá! Vim pelo guia de atacado [A-ATAC-01]"). A equipe (ou o Maurício) registra o código no contato; o código aponta para a página e o canal. Simples, sem ferramenta paga, e resolve o maior ponto cego do funil.

### 13.5 "Como nos conheceu?" (obrigatório no cadastro e no diagnóstico)
Opções: Google · ChatGPT · Gemini · Perplexity · Copilot · Claude · Meta AI no WhatsApp · Instagram · TikTok · YouTube · indicação de parceiro · executivo NextLevel · amigo · outro (texto). É a única forma confiável de medir a IA que chega sem origem ("tráfego escuro").

### 13.6 Relatórios (painel "Orgânico" dentro de `master/crescimento`, sem painel novo)
- funil da semana e do mês por canal (visitas → contatos → cadastros → pagantes → receita);
- **ranking de conteúdos por receita atribuída** (primeiro toque, último toque e "participou do caminho");
- nichos e perfis que mais convertem;
- IA: visitas, cadastros, pagantes, "como nos conheceu" e robôs que leram;
- páginas com muita visita e pouco contato (precisam de chamada melhor);
- tempo de resposta aos contatos;
- teste mensal das IAs (presença e acerto dos fatos).

### 13.7 LGPD e transparência
- Aviso de cookies com opção real de recusar; sem consentimento, só contagem agregada.
- Nenhum dado pessoal em cookie, URL ou log.
- `/privacidade` atualizado com o que medimos e por quê.
- Identificador do visitante apagado em 12 meses; o contato pode pedir exclusão.

---

## 14. Camada técnica (mantida da v2, ampliada)

Vale a v2, seção 8 inteira (metadados centrais, JSON-LD, sitemap, robots, IndexNow, `llms.txt`, espelhos `.md`, velocidade, pronto para agentes, saúde contínua). Acréscimos da v3:

- **Conteúdo como dado versionado:** artigos e páginas da Academy em arquivos Markdown no repositório (ex.: `content/academy/<categoria>/<slug>.md`), com cabeçalho (título, descrição, autor, datas, núcleo, nicho, perfil, situação, dores, estágio do funil, chamada, código de WhatsApp). Sem banco para o texto: rápido, gerado estático, revisável por commit.
- **Fatos por marcador, nunca digitados:** no texto, `{{fato:planoStartMensal}}`, `{{fato:tarifaPlataformaMercadoPago}}`, `{{comparativo:nuvemshop.tarifa}}`, resolvidos na hora de montar a página a partir de `src/lib/conhecimento/fatos.ts`, `getPriceBook` e do comparativo. Teste falha se um artigo trouxer "R$" ou "%" com número escrito à mão (mesma regra da base de conhecimento, D266).
- **Novos tipos de JSON-LD:** `Article` com `author` (`Person`) e `dateModified`; `Course` e `LearningResource` nas trilhas; `HowTo` nos guias; `FAQPage`; `DefinedTermSet`; `WebApplication` nas ferramentas; `BreadcrumbList` em todas.
- **Links internos automáticos:** cada página mostra "leia também" pelas etiquetas (dores, nicho, perfil), mais um bloco fixo para a página-mãe.
- **Busca interna da Academy** (simples, no próprio site) e registro anônimo das buscas sem resultado (vira pauta).
- **RSS** da Academy e das novidades (leitores, agregadores e algumas IAs usam).
- **Sitemaps separados por núcleo** e sitemap de imagens e vídeos.
- **Página de autor** (`/autores/<nome>`) com experiência real e links (LinkedIn).
- **Imagem social gerada** por página (título + núcleo), 1200×630.
- **Velocidade:** conteúdo da Academy gerado estático; HTML abaixo de 150 KB; LCP abaixo de 2,5 s no celular.

---

## 15. Conteúdo que a IA consegue citar

Mantido da v2, seção 9 (molde, bloco de fatos, frases-padrão, correção da IA quando ela erra). Acréscimos:

- **Trechos que se sustentam sozinhos:** cada seção começa com uma frase completa que pode ser copiada fora de contexto, com o nome da empresa quando o assunto for ela.
- **Títulos em forma de pergunta** nas seções ("Quanto custa uma loja virtual por mês em 2026?") seguidos de resposta de 40 a 60 palavras.
- **Tabelas com cabeçalho claro** e linha de fonte e data.
- **"Para quem é" e "para quem não é"** em toda página de decisão.
- **Frase-padrão da entidade** (igual em todo lugar): "NextLevel Commerce é a plataforma de lojas virtuais da NextLevel, nascida no Brás (São Paulo), com atacado nativo em todos os planos e 0% de tarifa da plataforma sobre as vendas com o Mercado Pago."
- **Frase-padrão da Academy:** "A NextLevel Academy é a escola gratuita da NextLevel para quem vende online no Brasil, com guias, ferramentas e trilhas com certificado sobre loja virtual, atacado, preço, frete e vendas pela IA."

### 15.1 As 60 perguntas-teste das IAs
As 30 da v2 (seção 6.3) continuam. Mais 30:

**Academy e dores**
31. Como sair do direct do Instagram e ter uma loja própria?
32. Como calcular o preço de atacado de roupas?
33. Como montar grade fechada para vender online?
34. Como vender para lojistas de outros estados?
35. Frete grátis vale a pena para loja pequena?
36. Como evitar golpe de falso pagamento na venda online?
37. MEI pode ter loja virtual?
38. Como preparar a loja para a Black Friday?
39. Como tirar foto de roupa com o celular para vender online?
40. Como diminuir o abandono de carrinho?

**Nichos e perfis**
41. Melhor plataforma para moda plus size no atacado?
42. Melhor plataforma para vender jeans no atacado?
43. Melhor plataforma para moda evangélica?
44. Como uma importadora do Brás pode vender para o Brasil todo?
45. Melhor plataforma para vender semijoias?
46. Como uma influenciadora cria a própria marca de roupa?
47. Melhor plataforma para revendedora de cosméticos?
48. Como uma loja física do Brás pode vender online?

**IA e compra por agente**
49. Como fazer meus produtos aparecerem no ChatGPT?
50. Dá para vender dentro do ChatGPT no Brasil?
51. Como aparecer no Google Shopping de graça?
52. Qual plataforma de loja virtual está preparada para compras pela IA?

**Consultoria e serviços**
53. Quem monta loja virtual pronta para atacado em São Paulo?
54. Quem faz migração da Nuvemshop para outra plataforma?
55. Quanto custa contratar alguém para montar uma loja virtual?
56. Onde encontrar curso grátis de loja virtual com certificado?

**Marca e autoridade**
57. O que é a NextLevel Academy?
58. Quem é o fundador da NextLevel Commerce?
59. Qual o custo médio para vender online no Brasil em 2026? (teste do relatório anual)
60. Quais as maiores dores de quem vende online no Brasil? (teste do Termômetro do lojista)

---

## 16. Dados abertos, autoridade fora do site e presença dentro das IAs

### 16.1 Dados abertos
Mantido da v2, seção 10 (`/dados`, JSON e CSV, GitHub, Hugging Face, Kaggle, relatório anual, fonte e data em cada linha, licença aberta). Acréscimos:
- **Termômetro do lojista** (trimestral): pesquisa curta com lojistas, parceiros e alunos da Academy (maiores dores, canais, uso de IA, planos para datas). Resultado público em `/dados/termometro`, com metodologia e número de respostas. É dado próprio e novo a cada trimestre: imprensa e IA citam.
- **Números agregados da plataforma**, só quando houver volume e com aprovação do dono (ex.: "pedidos de atacado representam X% dos pedidos"; nunca dado de uma loja).

### 16.2 Autoridade fora do site
Mantido da v2, seção 11 (Perfil da Empresa no Google, Bing Places, LinkedIn, redes, YouTube com legendas, Reclame Aqui, sites de avaliação, Crunchbase, diretórios de integrações, associações, imprensa, podcasts, artigos de convidado, comunidades identificadas, listas "melhores plataformas", universidades, selo nas lojas, kit de parceiros, executivos). Acréscimos:
- **Certificado da Academy no LinkedIn** (cada aluno que publica gera menção e link).
- **Academy em escolas e cursos:** oferecer as trilhas como material gratuito para escolas técnicas de moda e cursos de empreendedorismo (Sebrae, ETECs, faculdades), com crédito.
- **Aulas ao vivo em parceria** com integrações (Melhor Envio, Mercado Pago) e com parceiros: cada parceria vira página e menção nos canais deles.

### 16.3 Presença dentro das IAs
Mantido da v2, seção 12: GPT público "Consultor de Loja Virtual NextLevel" (com a Academy e os dados abertos como conhecimento), Gem e Space quando permitido, servidor MCP público (simular custo, sugerir tema, consultar planos), app no ChatGPT para o lojista e o assistente do site alimentando a pauta.

---

## 17. As lojas dos lojistas como motor de alcance (e de venda dentro das IAs)

Mantido da v2, seção 13 (SEO da loja, feeds, selo, vitrine de lojas). Acréscimos da v3:
- **"Pronto para IA"** no painel do lojista (camada 2, seção 6.2): nota por produto e lista do que falta, na fila do dia, sem módulo novo.
- **Feed único com saídas por canal:** Google Merchant Center (grátis), Microsoft Merchant Center, catálogo Meta e TikTok e, quando disponível no Brasil, o programa de lojistas das compras dentro das IAs.
- **Selo com rastreio:** "Feito com NextLevel" leva `utm_source=selo-loja&utm_content=<slug>`; o lojista pode desligar.
- **Estudos de caso:** lojistas que crescem viram caso na Academy (com autorização e número real).

---

## 18. Matriz de situações: 60 caminhos até a NextLevel

Os 40 caminhos da v2 (seção 14) continuam. Mais 20:

| # | Quem | Onde | Pergunta ou busca | O que precisamos ter | Fase |
|---|---|---|---|---|---|
| 41 | Revendedora | Google | "como precificar roupa para revender" | Guia + calculadora + trilha 4 | S4, S6 |
| 42 | Iniciante | YouTube | "curso grátis loja virtual" | Trilha 1 com certificado + vídeos | S4 |
| 43 | Iniciante | ChatGPT | "curso gratuito de e-commerce com certificado" | `/academy` com `Course` | S4 |
| 44 | Lojista de jeans | Google | "grade de jeans atacado" | `/loja-virtual-para/jeans` + guia de grade | S5 |
| 45 | Plus size | Gemini | "plataforma loja plus size atacado" | Página de nicho onda 1 | S5 |
| 46 | Loja física do Brás | Google Maps e Google | "vender online loja do brás" | `/atacado-online/bras`, trilha 11, perfil no Google | S5, S10 |
| 47 | Importadora | LinkedIn | "como vender para lojistas do Brasil inteiro" | Artigo do fundador + `/para/importadora` | S5, S10 |
| 48 | Lojista na Shopee | TikTok | "taxa da shopee aumentou" | Notícia + calculadora "quanto fica em cada canal" | S6 |
| 49 | Lojista com golpe | Google | "golpe falso comprovante pix loja" | Guia de segurança | S4 |
| 50 | MEI | Google | "mei pode vender pela internet" | Guia revisado por contador + `/meu-contador` | S4 |
| 51 | Lojista | ChatGPT | "como colocar meus produtos no chatgpt" | Trilha 9 + notícia + "Pronto para IA" | S4, S12 |
| 52 | Lojista | Google | "google shopping grátis como aparecer" | Guia + feed das lojas | S4, S12 |
| 53 | Dono de operação média | Google | "empresa que monta loja virtual atacado" | Página da Loja Pronta + Raio-X + diagnóstico | S7 |
| 54 | Lojista insatisfeito | Google | "nuvemshop está lenta" | Raio-X da loja (compara velocidade) + migração | S6, S7 |
| 55 | Lojista em dezembro | Google | "checklist natal loja virtual" | Checklist para baixar (isca) | S6 |
| 56 | Jornalista | Google | "pesquisa dores de lojistas 2026" | Termômetro do lojista | S8 |
| 57 | Aluno de moda | Faculdade ou ETEC | Material de aula | Academy oferecida às escolas | S10 |
| 58 | Parceiro | WhatsApp | Compartilha guia com o código dele | Kit de conteúdo com `ref` | S7 |
| 59 | Visitante que não decidiu | E-mail | Sequência da isca | Nutrição por interesse | S7 |
| 60 | Agente de IA | ChatGPT (modo agente) | "assine o plano Start da NextLevel para mim" | `/planos.md`, JSON-LD de oferta, cadastro legível por agente | S2, S12 |

---

# Parte C · Como operar

## 19. Fábrica de conteúdo

### 19.1 Como produzir muito sem perder qualidade
1. **Pauta** a partir do mapa de dores, da matriz de nichos e dos dados (Search Console, assistente, WhatsApp, IAs).
2. **Briefing** gerado pelo sistema: dor, leitor, estágio, perguntas a responder, buscas derivadas, fatos disponíveis (marcadores), páginas irmãs, chamada.
3. **Rascunho** com IA a partir do briefing, em português do lojista.
4. **Checagem de fatos automática:** números só por marcador; teste bloqueia número escrito à mão.
5. **Toque humano obrigatório:** exemplo real, experiência do Brás, foto ou caso; corte de enrolação.
6. **Revisão** (dono na primeira de cada tipo; depois, revisor da equipe).
7. **Publicação** com IndexNow e entrada no sitemap.
8. **Distribuição:** corte em vídeo curto, post, newsletter, kit de parceiros.
9. **Medição** após 30 e 90 dias.
10. **Atualização** a cada 90 dias ou quando um fato mudar (data de revisão nova).

### 19.2 Arquivos de dados da fábrica (no repositório)
- `content/dores.yaml`: as ≈150 dores (id, grupo, frase do lojista, remédio, ferramentas, páginas).
- `content/nichos.yaml`, `content/perfis.yaml`, `content/situacoes.yaml`: atributos de cada um (grade, frete, calendário, tema, dores ligadas).
- `content/perguntas-ia.yaml`: as 60 perguntas-teste.
- `content/academy/**.md`: os textos.
- Teste que confere: toda dor tem pelo menos uma página; toda página publicada está no sitemap; nenhuma combinação publicada sem os 4 portões marcados no cabeçalho.

### 19.3 Cadência
| Período | Ritmo |
|---|---|
| Meses 1 e 2 | 5 páginas por semana (pilares, trilha 1, nichos da onda 1, comparativos) |
| Meses 3 a 6 | 7 páginas por semana |
| Meses 7 a 12 | 5 páginas novas + 5 atualizações por semana |
| Todo mês | Teste das 60 perguntas, relatório ao dono, uma aula ao vivo, uma newsletter por semana |
| Todo trimestre | Termômetro do lojista, revisão dos comparativos |
| Todo ano | Relatório "Quanto custa vender online no Brasil" |

### 19.4 Como escrever
- Português claro, como o lojista fala; frases curtas.
- Ensinar de verdade: o leitor deve conseguir fazer a tarefa só com o artigo.
- Honestidade: dizer quando a NextLevel não é a melhor opção.
- Sem promessa de ganho ("você vai vender X"), nem para lojista nem para parceiro.
- Imposto, direito do consumidor e regras sanitárias: com revisão de profissional e sem conselho individual.

---

## 20. Calendário do varejo brasileiro (pauta do ano)

Conteúdo de cada data **publicado 6 a 8 semanas antes** (o Google precisa de tempo para indexar).

| Mês | Datas | Conteúdo |
|---|---|---|
| Janeiro | Liquidação, volta às aulas | Liquidar estoque parado; papelaria e mochilas |
| Fevereiro e março | Carnaval, Dia do Consumidor (15/3), Dia da Mulher | Moda festa, cupons, campanha para a mulher empreendedora |
| Abril | Páscoa | Presentes, chocolates artesanais |
| Maio | **Dia das Mães** (maior data da moda) | Guia completo, checklist, kit de banners |
| Junho | Dia dos Namorados, festas juninas, inverno | Moda inverno, presentes, moda country |
| Julho | Férias, liquidação de inverno | Liquidar, preparar o segundo semestre |
| Agosto | Dia dos Pais | Moda masculina, presentes |
| Setembro | Dia do Cliente (15/9), início do verão (moda praia) | Fidelização, coleção verão |
| Outubro | Dia das Crianças | Moda infantil, brinquedos; **preparação da Black Friday** |
| Novembro | **Black Friday** | Página fixa `/black-friday` atualizada todo ano |
| Dezembro | Natal, réveillon | Checklist do Natal, moda festa, entrega no prazo |

---

## 21. Medição, metas e o painel "Orgânico"

### 21.1 Indicadores
| Indicador | Fonte | Frequência |
|---|---|---|
| Páginas publicadas e indexadas | Repositório e Search Console | semanal |
| Visitas orgânicas por núcleo, nicho e canal (busca, IA, social) | `portal_visits_daily` | semanal |
| Contatos, cadastros, pagantes e receita por primeiro e último toque | Banco (seção 13) | semanal |
| Receita atribuída por conteúdo | Banco | mensal |
| Presença e acerto nas IAs (60 perguntas × 5 IAs) | Teste mensal | mensal |
| Visitas de robôs de IA por página | Proxy | semanal |
| Tempo de resposta a contatos | `brand_leads` | semanal |
| Velocidade (celular) | PageSpeed e Search Console | mensal |
| Links e citações de fora | Search Console e busca da frase-padrão | mensal |
| Alunos da Academy, certificados, inscritos na newsletter | Banco | mensal |

### 21.2 Metas
| Prazo | Meta |
|---|---|
| **30 dias** | Domínio novo no ar com 301; rastreamento (primeiro toque, IA, WhatsApp com código, "como nos conheceu") ligado; achados de texto vencido corrigidos |
| **90 dias** | 60 páginas (Academy, comparativos, nichos onda 1); trilha 1 com certificado; Raio-X no ar; 3 lojistas pagantes com origem orgânica comprovada; citada em 3 das 5 IAs nas perguntas de atacado e taxa |
| **180 dias** | 150 páginas; 10% dos cadastros vindos de busca ou IA; 4 das 5 IAs citando a NextLevel corretamente; 500 inscritos na newsletter; primeiro relatório anual pronto para jan/2027 |
| **365 dias** | 300 páginas; orgânico como maior canal de lojistas pagantes; 10 sites de fora citando os dados ou a Academy; custo por lojista orgânico menor que o de qualquer canal pago |

> Metas para orientar o esforço, revisadas a cada 90 dias com os dados reais. Não são promessa a ninguém.

### 21.3 Teste mensal das IAs
Mantido da v2 (seção 16.2), agora com as 60 perguntas: aparece? posição? fato certo? concorrentes? fontes citadas? "Participação de voz" por IA e por grupo de pergunta. Planilha nos 3 primeiros meses; depois, seção no painel "Orgânico".

---

## 22. Correções de eficiência (pensando como dono)

1. **Medir antes de escrever.** Sem rastreamento, 300 páginas viram opinião. O rastreamento (S1) vem antes da Academy.
2. **Corrigir já os textos vencidos** (achados 1 a 3 da v2): a IA repete o que lê; texto errado hoje vira resposta errada por meses.
3. **Responder rápido.** Contato de diagnóstico ou WhatsApp vindo do site: meta de 15 minutos no horário comercial; fora do horário, o Maurício responde e agenda. Contato que espera um dia esfria.
4. **Uma chamada principal por página.** Muitos botões dividem a atenção.
5. **Formulários curtos.** Diagnóstico com 5 perguntas no máximo; o resto, na conversa.
6. **WhatsApp com código da página** (13.4): sem isso, a maior parte das vendas fica sem origem.
7. **Tema do nicho no primeiro acesso:** quem veio da página de cosméticos já vê a loja de cosméticos.
8. **Aproveitar o que já escrevemos:** a base de conhecimento interna (aulas e fatos) vira ajuda pública e aulas da Academy onde servir ao público.
9. **Prova real antes de adjetivo:** casos, prints e números com fonte valem mais que "a melhor plataforma".
10. **Teste grátis e Academy conversando:** avaliar se quem concluiu uma trilha ganha mais dias de teste ou uma conversa de implantação (decisão do dono, seção 24).
11. **Não espalhar o esforço:** primeiro a onda 1 de nichos (os 12 com tema e público), depois as outras. Regra 60/25/15.
12. **Uma publicação por rodada no Render:** conteúdo em lote, junto com código, para não gastar minutos de montagem (CLAUDE.md, `docs/infra/RENDER-USO.md`). Texto da Academy em Markdown entra com o código da rodada; commits só de documentos levam `[skip render]`.
13. **Reaproveitar cada peça 5 vezes:** artigo → vídeo curto → post → newsletter → kit de parceiro.
14. **Revisar o que já está no ar a cada 90 dias** antes de criar mais: atualizar uma página boa costuma render mais que criar uma nova.

---

## 23. Fases, dependências e critérios de aceite

| Fase | Entrega | Depende de | Critério de aceite |
|---|---|---|---|
| **S0 · Domínio e base** | v2 seção 4 inteira (301, `APP_URL`, e-mail, Search Console e Bing com mudança de endereço); achados 1 a 7, 14, 15 e 17 corrigidos; tabela central de metadados; robots com robôs de IA; IndexNow | Domínio e DNS; códigos de verificação | Teste do 301 (caminho e parâmetros mantidos; POST e `/api/*` sem redirecionar); sitemap igual à lista pública; nenhuma descrição vencida; compra de teste de ponta a ponta no domínio novo; prints |
| **S1 · Rastreamento** | `nl-first`, canal padronizado com IAs em `origemDe`, `portal_visits_daily`, `funil_toques` com consentimento, aviso de cookies, "como nos conheceu?", WhatsApp com código, campos de primeiro e último toque no cadastro e em `brand_leads`, contador de robôs de IA, padrão de UTM, primeira versão do painel "Orgânico" | S0 | Testes: classificação de canal (cada IA da tabela 13.2), primeiro toque não é sobrescrito, sem dado pessoal sem consentimento, robôs fora da contagem, nada de banco a cada visita de robô; print do painel |
| **S2 · Técnica, fatos e arquivos para IA** | JSON-LD (v2 8.2 + 14), `lastmod` real, sitemaps por núcleo, `/llms.txt`, `/llms-full.txt`, espelhos `.md`, planos legíveis por agente, cadastro pronto para agente, testes no CI | S1 | Zero erro no validador nas 15 páginas principais; teste dos marcadores de fatos |
| **S3 · Fábrica de conteúdo** | `content/` (dores, nichos, perfis, situações, perguntas), leitor de Markdown com marcadores de fatos, molde de página, página de autor, links automáticos, busca interna, RSS, teste dos 4 portões e do número escrito à mão | S2 | Uma página de exemplo de cada tipo aprovada pelo dono; testes da fábrica |
| **S4 · Academy base** | `/academy`, 12 artigos-pilar, trilha 1 com certificado, 30 respostas rápidas, glossário (60 termos iniciais), trilha 9 (IA) | S3 | Molde da seção 11; prints 360, 768 e 1440 px; certificado gerado em PDF com link de verificação |
| **S5 · Decisão, nichos e perfis (onda 1)** | Comparativos e páginas de decisão (v2 S3), `/migrar/*`, 12 nichos da onda 1, 8 perfis principais, `/atacado-online/bras` | S3 | Cada página passa nos 4 portões; FAQ válido; fonte em cada número |
| **S6 · Ferramentas e Raio-X** | 10 ferramentas (12.4), com resultado copiável e captura opcional de contato; Raio-X da loja | S3 | Ferramentas com testes de cálculo; Raio-X sem guardar dado pessoal sem consentimento; prints |
| **S7 · Funis de contato** | Diagnóstico com qualificação e relatório automático, agenda de conversa, iscas para baixar, sequências de e-mail por interesse, pontuação do contato, fila do comercial, kit de conteúdo com `ref` para parceiros | S1, S4, S6 | Teste de ponta a ponta: isca → e-mail → cadastro com toques gravados; descadastro funciona; consentimento registrado |
| **S8 · Dados abertos e Termômetro** | `/dados` (v2 S2), GitHub, Hugging Face, Kaggle, Termômetro do lojista, relatório anual | S2 | Cada linha com fonte e data; números iguais aos do comparativo |
| **S9 · Ajuda pública, ondas 2 e 3, situações** | `/ajuda` (60 artigos), nichos ondas 2 e 3, perfis restantes, situações e combinações aprovadas, calendário do varejo | S5 | Idem S5 |
| **S10 · Autoridade fora do site** | v2 seção 11 + 16.2 executados com o dono; série do YouTube com legendas; selo nas lojas com UTM; Academy para escolas | Dono | Lista de perfis com link; frase-padrão igual em todos |
| **S11 · IAs (medição e presença)** | Teste mensal das 60 perguntas no painel; GPT público; página `/en` opcional | S8 | Primeiro relatório mensal entregue ao dono |
| **S12 · Comércio por IA** | "Pronto para IA" no painel do lojista, feed único com saídas por canal, Merchant Center, programa de lojistas das IAs quando houver no Brasil, planos legíveis por agente revistos | S2 | Feed válido no Merchant Center; nota "Pronto para IA" com testes |
| **S13 · Ferramentas dentro das IAs** | Servidor MCP público; depois, app no ChatGPT para o lojista | S8, S11 | Mesmos números do site; nenhuma ferramenta pública devolve dado de lojista; revisão de segurança |

**Ordem:** S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9 → S11 → S12 → S13, com **S10 em paralelo** (com o dono) a partir da S4.

---

## 24. O que depende do dono (com recomendação)

| # | Decisão | Recomendação |
|---|---|---|
| 1 | Domínio `nextlevelcommerce.com.br`, DNS no Render, variações para proteger a marca | Comprar e apontar já (S0) |
| 2 | Painéis mudam junto para o domínio novo? | Sim, com 301 e aviso por e-mail |
| 3 | Remetente de e-mail no domínio novo (SPF, DKIM, DMARC no Resend) | Sim |
| 4 | Códigos do Search Console e do Bing Webmaster | Verificar por DNS |
| 5 | **Nome da escola** | "NextLevel Academy" em `/academy` |
| 6 | **Quem assina os artigos** (autores reais) | Fundador nos pilares; equipe nos guias; convidados quando houver |
| 7 | Benefício para quem conclui uma trilha (mais dias de teste? conversa de implantação?) | Conversa de implantação grátis (não mexe no preço) |
| 8 | Aviso de cookies e o que medimos | Medir com consentimento; sem consentimento, só contagem agregada |
| 9 | Liberar robôs de treino de IA | Sim (v2) |
| 10 | Licença dos dados abertos | CC BY 4.0 |
| 11 | Contador que revisa os textos de impostos e MEI | Parceiro do `/meu-contador` |
| 12 | Lojistas que autorizam virar estudo de caso | Começar com 2 ou 3 |
| 13 | Meta de tempo de resposta aos contatos e quem atende | 15 minutos no horário comercial |
| 14 | GPT público e contas (Google, LinkedIn, Reclame Aqui, GitHub, Hugging Face, Kaggle) | Criar na conta da empresa |
| 15 | Revisar a primeira página de cada tipo | Sim |
| 16 | Acesso ao Planejador de Palavras-chave (Google Ads) | Sim, para medir a procura de cada nicho |

---

## 25. Riscos e proibições

Mantidos da v2 (seção 19): conteúdo em escala sem valor, troca de domínio mal feita, propaganda comparativa sem fonte, dado vencido, avaliações falsas, spam em comunidades, Wikipédia sem fontes independentes, dado de cliente em dado aberto, MCP com dado de lojista sem login, texto só para robô. Acréscimos:

- **Conteúdo feito por IA em massa:** o Google trata como "conteúdo em escala sem valor" quando não há valor original. Os 4 portões (10.4) e o toque humano (19.1) são obrigatórios. Melhor 3 páginas excelentes por semana que 30 rasas.
- **Canibalização:** duas páginas nossas disputando a mesma busca. Cada página tem uma intenção principal registrada no cabeçalho; teste aponta intenção repetida.
- **Assuntos sensíveis** (impostos, direito do consumidor, regras sanitárias, golpes): revisão profissional e aviso de "informação geral, não é aconselhamento".
- **LGPD no rastreamento:** nada de dado pessoal sem consentimento; prazo de guarda; direito de exclusão.
- **Prometer venda pela IA antes de existir no Brasil:** proibido. Só anunciar o que funciona.
- **Promessa de ganho** em qualquer conteúdo (lojista, aluno ou parceiro): proibida.
- **Custo de publicação no Render:** conteúdo em lote, junto com código (seção 22, item 12).

---

## 26. Prompt mestre (colar numa sessão para desenvolver cada fase)

```
Você vai desenvolver a fase [S0..S13] do plano "Busca, IA e Academy: o funil de venda orgânico da NextLevel" (v3).

QUEM VOCÊ É NESTA TAREFA
Engenheiro e estrategista de crescimento orgânico da NextLevel Commerce. Pense como o dono: cada entrega precisa
aproximar a E-commerce do 10º lojista pagante e ser medível (de onde veio, o que leu, quanto pagou).

LEIA ANTES (nesta ordem)
1. CLAUDE.md e AGENTS.md (pilha, comandos, branch de publicação, testes enxutos, custo do Render, base de
   conhecimento D264, regra 60/25/15).
2. docs/prompts/busca-ia-academy-funil-organico.md inteiro (v3), em especial: seção 7 (diagnóstico), a seção da sua
   fase (8 a 17) e a linha da sua fase na seção 23. Onde a v3 diz "mantido da v2", leia a seção indicada em
   docs/prompts/busca-e-ia-visibilidade-organica.md.
3. docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md.
4. O código que você vai estender (anti-duplicação): src/proxy.ts (nl-attr, nl-ref), src/lib/attribution.ts,
   src/lib/domain/visitas.ts (origemDe, ehRobo, store_visits_daily), src/lib/domain/brand-leads.ts,
   src/lib/conhecimento/fatos.ts e aulas.ts, src/lib/brand.ts, src/lib/base-url.ts, src/app/sitemap.ts,
   src/app/robots.ts, src/lib/seo-marca.ts, src/components/portal/json-ld.tsx, src/lib/storefront-seo.ts,
   src/app/(portal)/** (comparativo, ferramentas, recursos, integracoes, temas, planos, faq, meu-contador),
   src/app/master/crescimento, src/lib/marcas/comparativo-ecommerce.ts, src/lib/marcas/placar-seed.ts,
   src/lib/themes/catalog.ts, src/lib/email.ts, getPriceBook, getPartnerSettings, getBrand().
5. node_modules/next/dist/docs/ para metadados, sitemap, robots, proxy e geração estática desta versão do Next.js.

RELATE PRIMEIRO (antes de escrever código)
- Em até 15 linhas: o que existe, o que vai mudar, os arquivos, as migrações (se houver), os testes, o que depende do
  dono e os riscos (S0: avisos de pagamento, sessões e e-mail; S1: LGPD e custo de banco por visita).
- Se a fase conflita com a seção 25 do plano ou com a Constituição, pare, explique e proponha a alternativa.

REGRAS
- Verdade com fonte e data: número de concorrente só dos módulos de comparação, com fonte e data visíveis.
- Fatos da NextLevel só por marcador ({{fato:...}}) resolvido de src/lib/conhecimento/fatos.ts e getPriceBook;
  nunca "R$" ou "%" com número escrito à mão em conteúdo (teste obrigatório).
- Sem promessa de ganho; sem preço de serviço; temas sensíveis com revisão profissional e aviso.
- Uma página por intenção; combinações de nicho × perfil × situação só com os 4 portões (procura, 40% de conteúdo
  próprio, prova real, revisão humana) marcados no cabeçalho do arquivo.
- Molde de página (seção 11): resposta em 2 frases, tabela em HTML, FAQ, autor e datas, bloco "remédio" quando houver,
  uma chamada principal pelo estágio, links para a mãe e 3 a 6 irmãs.
- JSON-LD só com o que está visível; nunca AggregateRating ou Review sem avaliação real.
- Rastreamento: sem dado pessoal em cookie, URL ou log; identificador de visitante e toques só com consentimento;
  contagem agregada sem consentimento; nada de consulta ao banco a cada visita de robô; primeiro toque nunca sobrescrito.
- Texto de marca por getBrand(); página com banco: export const dynamic = "force-dynamic"; conteúdo da Academy
  gerado estático. Regra configurável em platform_settings.
- Acessibilidade AA, um h1, sem rolagem horizontal em 360 px.
- Na S0: o 301 vale só para GET; POST e /api/* nunca redirecionam; /r/ e /c/ continuam funcionando.
- Alterou src/db/schema.ts? npx drizzle-kit generate --name <assunto> e commite drizzle/ (nunca edite migração publicada).
- Comércio por IA: não anunciar ao lojista nada que ainda não funciona no Brasil; confirme na documentação oficial.

TESTES (mudança de comportamento sem teste não entra)
- S0: 301 (caminho e parâmetros; POST e /api/* sem redirecionar); sitemap igual à lista pública; nenhum
  title/description repetido, vazio ou vencido; robots com os robôs de IA.
- S1: canal de cada origem da tabela 13.2 (todas as IAs); primeiro toque preservado; sem consentimento não grava
  visitante; robôs fora; código de WhatsApp resolvido para a página certa; "como nos conheceu" gravado.
- S2: JSON-LD (tipos, campos, coerência com o texto); espelhos .md e llms.txt gerados das mesmas fontes.
- S3: marcadores de fatos resolvidos; número escrito à mão reprovado; 4 portões; intenção repetida reprovada;
  toda dor ligada a uma página; toda página publicada no sitemap.
- S4 a S9: cada página no sitemap, com canonical, FAQPage válido, autor, datas e fonte em cada número; ferramentas
  com testes de cálculo; certificado verificável; descadastro de e-mail funciona.
- S12 e S13: feed válido; nenhuma ferramenta pública devolve dado de lojista; as privadas exigem login e permissão
  (requireRole, assertCanAccess).
- Durante o trabalho: npx tsc --noEmit, npx eslint src e2e tests e os testes dos arquivos mexidos; a bateria completa
  (npx vitest run) e o npm run build ficam para o fim da rodada.

VERIFICAÇÃO VISUAL E EXTERNA
- Prints reais (Playwright, Chromium em /opt/pw-browsers/chromium) em 360, 768 e 1440 px de cada tipo de página nova;
  mande ao dono pelo menos um print da principal entrega.
- Depois do deploy: curl no robots.txt, sitemap.xml, llms.txt e nas páginas (title, description, canonical, JSON-LD);
  na S0, curl do domínio antigo mostrando o 301 e uma compra de teste ponta a ponta; na S1, uma visita de teste com
  utm_source=chatgpt.com aparecendo como canal "IA" no painel "Orgânico".
- Validar o JSON-LD (validator.schema.org) e registrar o resultado.

FECHAMENTO
- Registre a decisão em docs/design/DECISIONS.md (próxima livre, título com "[E-commerce]"), cite-a na base de
  conhecimento (docs/conhecimento/BC0-INVENTARIO.md) e rode node scripts/gerar-novidades.mjs.
- Atualize a linha "Estado" deste plano e a linha dele em docs/prompts/README.md.
- Commit em português; junte conteúdo e código numa publicação só; commit só de documentos leva [skip render].
- git pull --rebase e push na branch de publicação; confira o site no ar.
- Relate ao dono em português simples: o que ficou pronto (com print), números do funil quando já houver, o que
  depende dele (seção 24), a linha "Esforço do dia por frente" e a próxima fase.
```
