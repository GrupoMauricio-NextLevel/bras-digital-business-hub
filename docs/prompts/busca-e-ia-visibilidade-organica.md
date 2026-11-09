# Busca e IA: ser encontrado do Google ao ChatGPT (plano e prompt mestre)

> Estado: **PLANO PRONTO, NADA DESENVOLVIDO** (09/11/2026, pedido do dono). Frente: **[E-commerce]** (regra 60/25/15: aproxima a E-commerce do 10º lojista pagante).
> Objetivo do dono, nas palavras dele: "quando alguém procurar pelas nossas soluções precisamos ser encontrados com facilidade do Google ao GPT; quando alguém perguntar qual a melhor plataforma, precisamos destacar nossos pontos fortes frente a todos os concorrentes; se necessário, criar páginas públicas e dados para serem indexados em todas as plataformas".
> Endereço público hoje: `https://lojas.nextlevelgroup.com.br` (marca NextLevel E-commerce). Grupo: `nextlevelgroup.com.br`.
> Próxima decisão livre: D276. Cada fase registra a sua decisão em `docs/design/DECISIONS.md` e cita a decisão na base de conhecimento (D264).

---

## Sumário

1. Resumo em uma página
2. Como as pessoas vão nos achar (os dois mundos: buscadores e IAs)
3. Diagnóstico de hoje (auditoria de 09/11/2026)
4. Regras que não podem quebrar
5. Intenções de busca e perguntas que precisamos ganhar
6. Arquitetura de páginas (o que existe, o que muda, o que nasce)
7. Camada técnica (o que o código precisa entregar)
8. Conteúdo que a IA consegue citar
9. Dados abertos para indexação
10. Presença fora do site (o que dá autoridade)
11. As lojas dos lojistas como motor de busca
12. Medição (Google, Bing e IAs)
13. Fases, entregas e critérios de aceite
14. O que depende do dono
15. Riscos e proibições
16. Prompt mestre (colar numa sessão para desenvolver cada fase)

---

## 1. Resumo em uma página

**A tese:** os buscadores e as IAs recomendam quem (a) **é fácil de ler** por robô, (b) **responde exatamente a pergunta** feita, (c) **tem dados verificáveis com fonte e data** e (d) **é citado em outros lugares** confiáveis. Temos uma vantagem rara: os nossos diferenciais são **fatos que dá para provar**, e não opiniões:
- 0% de tarifa da plataforma sobre as vendas com o Mercado Pago, em todos os planos;
- atacado nativo em todos os planos (Nuvemshop e Loja Integrada não têm; Tray, WBuy e Shopify só nos planos caros);
- mensalidade em real a partir de R$ 57;
- WhatsApp com gente desde o primeiro plano;
- equipe no Brás, com migração feita pela equipe;
- comissão de parceiro todo mês, sem nota fiscal.

O plano transforma esses fatos em **páginas, dados estruturados e arquivos abertos** que robô e IA entendem e citam.

**As 5 alavancas, em ordem de impacto:**

| # | Alavanca | O que é | Prazo |
|---|---|---|---|
| 1 | **Base técnica sem falha** | Sitemap completo, títulos e descrições certos, dados estruturados em todas as páginas, `llms.txt`, Search Console e Bing verificados, IndexNow | 1 rodada |
| 2 | **Páginas de comparação e de escolha** | "Melhor plataforma de loja virtual", "NextLevel × Nuvemshop" (uma por concorrente), "Alternativa à X" | 2 rodadas |
| 3 | **Páginas por nicho e por intenção** | Loja virtual para moda, para atacado do Brás, beleza, casa, celular, esporte; "loja virtual sem taxa", "loja virtual com Mercado Pago" | 2 rodadas |
| 4 | **Dados abertos e guias** | `/dados` com tabela e arquivo (JSON/CSV) dos preços e regras do mercado com fonte e data; guias evergreen; glossário | 2 rodadas |
| 5 | **Autoridade fora do site** | Perfil da empresa no Google, Bing e LinkedIn; YouTube (a série); diretórios e sites de avaliação; imprensa; selo "Feito com NextLevel" nas lojas | contínuo |

**Meta de 90 dias:**
- todas as páginas públicas indexadas no Google e no Bing;
- top 10 no Google para pelo menos 10 termos de cauda longa (ex.: "loja virtual atacado grade fechada", "loja virtual sem taxa por venda", "alternativa nuvemshop atacado");
- NextLevel citada em pelo menos 3 das 5 IAs (ChatGPT, Gemini, Perplexity, Copilot, Claude) para as perguntas de nicho da seção 5.

Medido como na seção 12. Termo genérico curto ("loja virtual") leva mais tempo; não é meta de 90 dias.

---

## 2. Como as pessoas vão nos achar (os dois mundos)

### 2.1 Buscadores

| Buscador | De onde vem o índice | O que precisamos |
|---|---|---|
| Google | Índice próprio (Googlebot) | Search Console verificado, sitemap, dados estruturados, velocidade, conteúdo útil |
| Bing | Índice próprio (Bingbot) | Bing Webmaster Tools, sitemap, **IndexNow** |
| Yahoo, DuckDuckGo, Ecosia | Usam muito o índice do Bing | Estar bem no Bing resolve boa parte |
| Brave Search | Índice próprio | Conteúdo rastreável; nada específico |
| Yandex, Naver | Índices próprios, pouco uso no Brasil | Sitemap e IndexNow (o Yandex aceita IndexNow) |

### 2.2 IAs de conversa (resposta com fontes)

> **Conferir na documentação oficial de cada empresa antes de implementar:** nomes de robôs e parcerias mudam. A tabela abaixo é o mapa de trabalho, não verdade eterna.

| IA | Como busca na internet (resumo) | Robôs que precisam ter acesso |
|---|---|---|
| ChatGPT (busca) | Rastreador próprio para busca e parceiros de busca | `OAI-SearchBot` (busca), `ChatGPT-User` (quando o usuário pede), `GPTBot` (treino) |
| Google Gemini e "Visão geral criada por IA" | Índice do Google | `Googlebot`; o token `Google-Extended` controla só o uso para treino, não a busca |
| Microsoft Copilot | Índice do Bing | `Bingbot` |
| Perplexity | Rastreador próprio | `PerplexityBot`, `Perplexity-User` |
| Claude | Busca na web e robôs próprios | `ClaudeBot`, `Claude-SearchBot`, `Claude-User` |
| Meta AI, Apple | Robôs próprios | `meta-externalagent`, `Applebot` e `Applebot-Extended` |

**Decisão recomendada:** liberar **todos** os robôs de busca e de IA nas páginas públicas (queremos ser lidos e citados) e manter bloqueados os painéis, como já é hoje. Liberar também o **treino** (`GPTBot`, `Google-Extended`, `ClaudeBot`, `Applebot-Extended`): quanto mais os modelos "conhecem" a NextLevel, mais ela aparece sem busca. Isso fica escrito no `robots.txt` por nome, para ficar explícito.

### 2.3 O que faz uma IA recomendar alguém

1. **A pergunta tem uma página que responde exatamente ela.** Exemplo: "qual a melhor plataforma para vender no atacado?" precisa de uma página cujo título, primeiro parágrafo e tabela respondam isso.
2. **Fatos atômicos e datados:** "0% de tarifa da plataforma sobre as vendas com o Mercado Pago, em todos os planos (09/11/2026)". A IA copia frases curtas, verificáveis e com data.
3. **Tabelas em HTML** (não imagem) e listas com critérios claros.
4. **Consistência da entidade:** o mesmo nome ("NextLevel E-commerce"), a mesma descrição, a mesma empresa (NextLevel Marketing Ltda.) e os mesmos fatos em todos os lugares (site, Google, LinkedIn, YouTube, diretórios).
5. **Citações fora do site:** listas de "melhores plataformas", sites de avaliação, imprensa, vídeos. A IA confia mais quando outros dizem.
6. **Honestidade comparativa:** página que admite onde o concorrente é bom ganha confiança (já fazemos isso no vídeo 4: "o que cada um faz bem").

---

## 3. Diagnóstico de hoje (auditoria de 09/11/2026)

Feito com `curl` no site no ar e leitura de `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo-marca.ts` e `src/components/portal/json-ld.tsx`.

| # | Achado | Gravidade | Onde |
|---|---|---|---|
| 1 | Descrição da home e do dado estruturado diz **"em breve, atacado"** (o atacado já existe em todos os planos) e "feita para quem vende moda" (somos para 6 nichos) | Alta | metadados da home, `SoftwareApplication` |
| 2 | Descrição de `/planos` fala em **"teste 7 dias com cupom"** (hoje são 3 dias) | Alta | `src/app/(portal)/planos` |
| 3 | Descrição de `/parceiros` fala em **comissão sobre o setup e cupons de 7 dias** (regra antiga; hoje 20/24/28% e 15/19/23% de toda mensalidade) | Alta | `src/app/(portal)/parceiros` |
| 4 | Descrição de `/faq` repete a da home | Média | `/faq` |
| 5 | Sitemap **não traz** `/comparativo`, `/recursos`, `/integracoes`, `/ferramentas`, `/quero-minha-loja`, `/parceiros/indique`, `/parceiros/criadores`, `/parceiros/vendedores`, `/parceiros/agencias`, `/parceiros/comissoes` | Alta | `sitemapPaths` em `src/lib/seo-marca.ts` |
| 6 | Sitemap sem `lastmod` real (todas as páginas "weekly") | Média | `src/app/sitemap.ts` |
| 7 | `/planos` e `/faq` **sem `canonical`** | Média | metadados |
| 8 | Dados estruturados só na home e em `/parceiros`; **nada** em comparativo, planos, FAQ, temas e recursos | Alta | `JsonLd` |
| 9 | `/faq` sem `FAQPage`; `/temas/[key]` sem `Product`/`CreativeWork`; nenhuma página com `BreadcrumbList` | Média | — |
| 10 | Sem `llms.txt` e `llms-full.txt` | Média (custo baixo) | `public/` ou rota |
| 11 | Sem Search Console e Bing Webmaster verificados (item I-03 da fila de integrações) | Alta | `docs/prompts/integracoes-aplicativos-fila.md` |
| 12 | Sem IndexNow | Média | — |
| 13 | HTML da home com ~329 KB | Média (velocidade e leitura por robô) | home |
| 14 | `robots.txt` não cita os robôs de IA por nome (hoje libera todos com `*`; funciona, mas não deixa a decisão explícita) | Baixa | `robotsPlan` |
| 15 | `Organization` sem `sameAs` (YouTube, Instagram, LinkedIn), logotipo, endereço e contato | Média | home |
| 16 | `/demo/*` bloqueado no robots (correto: demonstração), mas as páginas `/temas/*` precisam mostrar a loja funcionando com texto e imagem, para não perder o conteúdo | Baixa | `/temas/[key]` |

---

## 4. Regras que não podem quebrar

1. **Verdade com fonte e data.** Todo número de concorrente tem fonte oficial e data de consulta na própria página (regra da casa e base legal da propaganda comparativa). Os dados vêm dos módulos que já existem: `src/lib/marcas/comparativo-ecommerce.ts`, `src/lib/marcas/placar-seed.ts`, `src/lib/finance/captacao-regras.ts`. Nada de copiar número à mão para uma página.
2. **Sem promessa de ganho** (lojista nem parceiro).
3. **Preço de serviço não aparece** (projeto exclusivo, marketing, estúdio, migração paga). Mensalidade dos planos pode.
4. **Texto da marca vem de `getBrand()`**; página com banco declara `force-dynamic`; nenhuma regra fixa no código que deveria vir de `platform_settings` (preços via `getPriceBook`).
5. **Uma página por intenção**, útil por si só. Nada de páginas em massa só trocando uma palavra (o Google pune isso como "conteúdo em escala").
6. **Sem truques:** nada de texto escondido, conteúdo diferente para robô e para pessoa, avaliação falsa, depoimento inventado, ou "dado" sem origem.
7. **Acessibilidade AA e 360 px sem rolagem lateral**; título único e um `h1` por página.
8. **Anti-duplicação:** estender o que existe (`sitemapPaths`, `robotsPlan`, `JsonLd`, `/comparativo`, `/ferramentas`, `/temas/[key]`, `/solucoes/[slug]`) antes de criar módulo novo.

---

## 5. Intenções de busca e perguntas que precisamos ganhar

> Volumes de busca não estão aqui porque não temos fonte medida. Na fase S0, levantar no Google Search Console (depois de 4 semanas de dados), no Planejador de Palavras-chave do Google Ads (conta do dono) e no Google Trends, e registrar o volume com a data.

### 5.1 Grupos de intenção (do mais fácil de ganhar ao mais disputado)

| Grupo | Exemplos de busca | Página que responde |
|---|---|---|
| **Marca** | "nextlevel e-commerce", "nextlevel loja virtual", "nextlevel group" | home, `/sobre` |
| **Atacado** (nosso trunfo) | "loja virtual para atacado", "loja virtual grade fechada", "plataforma atacado e varejo", "loja virtual pedido mínimo", "ecommerce atacado brás" | `/loja-virtual-para/atacado`, `/loja-virtual-atacado-bras` |
| **Taxa** | "loja virtual sem taxa por venda", "plataforma de loja virtual sem comissão", "loja virtual com mercado pago sem taxa" | `/loja-virtual-sem-taxa` |
| **Comparação** | "nuvemshop ou tray", "alternativa à nuvemshop", "nuvemshop é bom?", "nuvemshop taxa", "shopify em real" | `/comparativo` e `/comparativo/nextlevel-x-<concorrente>` |
| **Escolha** | "melhor plataforma de loja virtual 2026", "qual plataforma de e-commerce escolher" | `/melhor-plataforma-de-loja-virtual` |
| **Nicho** | "loja virtual para moda", "loja virtual de roupas", "loja virtual de cosméticos", "loja virtual de capinha de celular", "loja virtual de camisa de time", "loja virtual de utilidades" | `/loja-virtual-para/<nicho>` |
| **Custo** | "quanto custa uma loja virtual", "quanto custa nuvemshop por mês" | `/quanto-custa-uma-loja-virtual` + calculadora em `/ferramentas` |
| **Como fazer** | "como criar loja virtual", "como vender no atacado pela internet", "como migrar da nuvemshop" | `/guias/<assunto>` |
| **Parceiros** | "programa de afiliados loja virtual", "ganhar comissão indicando", "programa de parceiros recorrente" | `/parceiros` e subpáginas |

### 5.2 Perguntas para IA (a lista do teste mensal, seção 12)

1. Qual a melhor plataforma de loja virtual para vender no atacado no Brasil?
2. Qual plataforma de loja virtual não cobra taxa por venda?
3. Qual a melhor alternativa à Nuvemshop para quem vende no atacado?
4. Nuvemshop, Tray, Loja Integrada, WBuy ou Shopify: qual escolher?
5. Qual plataforma de e-commerce aceita grade fechada e preço por quantidade?
6. Quanto custa ter uma loja virtual por mês em 2026?
7. Qual a melhor plataforma de loja virtual para moda?
8. Qual a melhor plataforma para lojistas do Brás?
9. Qual plataforma de loja virtual tem suporte por WhatsApp no plano mais barato?
10. Qual programa de parceiros de e-commerce paga comissão recorrente sem nota fiscal?
11. Como criar uma loja virtual com Mercado Pago sem pagar tarifa da plataforma?
12. O que é a NextLevel E-commerce? É confiável?

E mais 18 por nicho (3 por nicho: "melhor plataforma para loja de X", "loja virtual de X com Pix", "tema de loja virtual para X").

---

## 6. Arquitetura de páginas

### 6.1 O que existe e muda

| Página | Mudança |
|---|---|
| `/` (home) | Título e descrição novos; `Organization` completo e `SoftwareApplication` com `offers` (3 planos em real); bloco "Fatos rápidos" em texto; reduzir o HTML |
| `/comparativo` | `ItemList` e tabela em HTML com fonte e data; links para cada `/comparativo/nextlevel-x-*`; "o que cada um faz bem" |
| `/planos` | Descrição correta (3 dias grátis); `canonical`; `SoftwareApplication.offers`; FAQ de planos com `FAQPage` |
| `/faq` | Descrição própria; `FAQPage` com todas as perguntas; perguntas novas da seção 5.2 respondidas em 2 a 4 frases |
| `/temas` e `/temas/[key]` | `CollectionPage`/`ItemList` e `Product` (grátis ou premium, sem preço de tema se o dono preferir); nicho no título ("Tema Trama para loja de moda") |
| `/parceiros` e subpáginas | Descrição correta (regra D263); `FAQPage`; entram no sitemap |
| `/recursos`, `/integracoes`, `/ferramentas`, `/quero-minha-loja` | Entram no sitemap; `canonical`; dados estruturados (`WebPage`, `HowTo` quando couber) |

### 6.2 Páginas novas (em ordem de prioridade)

| Prioridade | Endereço | Para que serve | Dado de origem |
|---|---|---|---|
| P1 | `/melhor-plataforma-de-loja-virtual` | Guia de escolha com 8 critérios (tarifa, mensalidade, atacado, suporte, limites, moeda, IA, equipe), tabela das 6 e "para quem cada uma é melhor"; data de atualização | `comparativo-ecommerce.ts`, `placar-seed.ts` |
| P1 | `/comparativo/nextlevel-x-nuvemshop` (e `-tray`, `-loja-integrada`, `-wbuy`, `-shopify`) | Uma página por concorrente: tabela, custo do ano em 3 faixas de venda (a mesma conta do vídeo 4), pontos fortes dele, pontos fortes nossos, como migrar | mesmos módulos + calculadora |
| P1 | `/loja-virtual-para/atacado` + `/loja-virtual-atacado-bras` | O trunfo: grade fechada, preço por quantidade, pedido mínimo, varejo e atacado; quem tem e em qual plano | `comparativo-ecommerce.ts` |
| P1 | `/loja-virtual-sem-taxa` | Explica "tarifa da plataforma" × "taxa do meio de pagamento"; tabela da tarifa de cada uma com o Mercado Pago | idem |
| P2 | `/loja-virtual-para/moda`, `/beleza`, `/casa`, `/celular`, `/esporte` | Mesmo molde do vídeo 2: a pergunta do cliente, a dor, a loja responde, os 4 temas, a loja de demonstração | `THEME_CATALOG` |
| P2 | `/quanto-custa-uma-loja-virtual` | Custo real por faixa de venda (R$ 10 mil, 30 mil, 100 mil) em cada plataforma | calculadora de `/ferramentas` |
| P2 | `/migrar-da-nuvemshop` (e demais) | Passo a passo, o que vem junto (produtos, clientes, endereços), prazo, sem parar de vender | conteúdo do guia de migração |
| P2 | `/dados` | Dados abertos (seção 9) | módulos de comparação |
| P3 | `/sobre` | Quem somos: fundador (trajetória no Brás, internacionalização de empresas chinesas, digitalização de importadoras), equipe com fotos reais, empresa, endereço, contato | dono |
| P3 | `/guias/<assunto>` | 8 a 12 guias evergreen (como criar loja virtual; vender no atacado online; Pix na loja virtual; tarifa × taxa; frete; fotos com celular; descrição de produto; primeiros 30 dias) | equipe |
| P3 | `/glossario` | 40 termos de e-commerce com definição curta (alvo de citação por IA) | equipe |
| P3 | `/imprensa` | Kit de imprensa: fatos rápidos, logotipos, fotos, contato | dono |
| Depois | `/casos` | Só com lojistas reais e autorização por escrito | quando houver |

**Regra de qualidade de cada página nova:**
- pelo menos 600 palavras úteis;
- uma resposta direta nas 2 primeiras frases;
- uma tabela em HTML;
- FAQ de 4 a 8 perguntas;
- data de atualização visível;
- fonte em cada número de concorrente;
- links internos para planos, comparativo e cadastro;
- revisão do dono antes de publicar a primeira de cada tipo.

---

## 7. Camada técnica

### 7.1 Metadados (todas as páginas públicas)
- `title` único (até 60 caracteres) e `description` única (até 155), vindos de uma tabela central (`src/lib/seo/paginas.ts`), com teste que proíbe repetido, vazio ou texto vencido ("em breve, atacado", "7 dias").
- `canonical` absoluto em todas; `og:title`, `og:description`, `og:image` (1200×630, por página) e `twitter:card`.
- `lang="pt-BR"`; `hreflang` não é necessário enquanto houver um idioma só.

### 7.2 Dados estruturados (JSON-LD, pelo componente `JsonLd` que já existe)

| Tipo | Onde | Campos-chave |
|---|---|---|
| `Organization` | todas (no layout) | `name`, `legalName` (NextLevel Marketing Ltda.), `url`, `logo`, `sameAs` (YouTube, Instagram, LinkedIn, perfil do Google), `contactPoint` (WhatsApp), `address` (quando o dono passar) |
| `WebSite` | home | `name`, `url`, `inLanguage` |
| `SoftwareApplication` | home, planos | `applicationCategory: BusinessApplication`, `operatingSystem: Web`, `offers` (Start, Pro, Scale em BRL, vindos de `getPriceBook`), `featureList` (fatos da seção 1) |
| `FAQPage` | faq, planos, parceiros, todas as páginas novas | perguntas e respostas visíveis na página (as mesmas) |
| `BreadcrumbList` | todas menos a home | trilha da página |
| `ItemList` | comparativo, melhor plataforma, temas | itens com posição e URL |
| `Product` ou `CreativeWork` | `/temas/[key]` | nome, nicho, grátis ou premium, imagem |
| `Dataset` | `/dados` | nome, descrição, `dateModified`, `distribution` (JSON e CSV), `license`, `creator` |
| `HowTo` | guias e migração | passos |
| `VideoObject` | páginas com os vídeos da série | título, descrição, miniatura, `uploadDate`, `embedUrl` |

**Proibido no JSON-LD:** `AggregateRating` e `Review` sem avaliações reais coletadas de clientes, ou qualquer dado que não esteja visível na página.

### 7.3 Sitemap e robots
- `sitemapPaths` passa a incluir todas as páginas públicas da E-commerce (seção 6), com teste que **compara o sitemap com a lista de páginas públicas** (página pública fora do sitemap = teste vermelho).
- `lastmod` real: data da última mudança do conteúdo (dos dados de comparação, dos temas ou da página).
- Sitemaps separados quando passar de 200 URLs: `sitemap-paginas.xml`, `sitemap-temas.xml`, `sitemap-guias.xml`.
- `robots.txt`: manter os bloqueios dos painéis; adicionar blocos explícitos `User-agent` para os robôs da seção 2.2 com `Allow: /` nas páginas públicas.

### 7.4 Arquivos para IA
- `/llms.txt`: resumo em Markdown (o que é a NextLevel E-commerce, para quem, os fatos com data e links para as páginas-chave).
- `/llms-full.txt`: o conteúdo de texto das páginas-chave, sem menu, gerado pelo sistema a partir das mesmas fontes (nunca escrito à mão).
- **Honestidade:** o `llms.txt` é uma proposta aberta; não há garantia de que as grandes IAs o usem. O custo é baixo, então vale; o que move o ponteiro é o resto do plano.

### 7.5 Indexação rápida
- Search Console (Google) e Bing Webmaster verificados pela meta tag guardada em `platform_settings` (item I-03 da fila de integrações; criar o par para o Bing).
- **IndexNow:** a cada publicação de página ou mudança de dado de comparação, avisar Bing e Yandex (chave em arquivo público na raiz, conforme o padrão).
- Enviar o sitemap nos dois painéis.

### 7.6 Velocidade e leitura por robô
- Meta: LCP abaixo de 2,5 s no celular, CLS abaixo de 0,1, HTML da home abaixo de 150 KB (hoje cerca de 329 KB).
- Conteúdo principal no HTML do servidor (já é); imagens com `alt` descritivo e dimensões; nada de texto importante só dentro de imagem.

### 7.7 Links internos
- Rodapé com "Comparativos" (as 5 páginas) e "Loja virtual para" (os nichos).
- Cada página de nicho linka para o atacado, o comparativo e o cadastro; cada comparativo linka para a migração.

---

## 8. Conteúdo que a IA consegue citar

**O molde de cada página (vale para todas as novas):**
1. **Resposta em 2 frases**, no topo, com o nome da empresa e o fato principal. Exemplo: "A NextLevel E-commerce é uma plataforma brasileira de lojas virtuais com atacado nativo (grade fechada, preço por quantidade e pedido mínimo) em todos os planos, a partir de R$ 57 por mês. Ela não cobra tarifa sobre as vendas feitas com o Mercado Pago."
2. **Fatos rápidos** em lista, cada um com data.
3. **Tabela comparativa** em HTML, com a linha de fonte e data embaixo.
4. **"Para quem é" e "para quem não é"**: a honestidade aumenta a confiança. Exemplo: "Se você precisa de marketplace com milhões de visitas, uma loja própria não substitui o marketplace."
5. **FAQ** com as perguntas como as pessoas falam.
6. **Data de atualização** e autor (equipe NextLevel, com link para `/sobre`).

**Bloco de fatos padrão** (uma fonte só, `src/lib/seo/fatos.ts`, montado a partir dos módulos de preço e de comparação; usado no site, no `llms.txt`, nos dados abertos e nas descrições do YouTube):
- tarifa da plataforma sobre as vendas com o Mercado Pago: 0%, em todos os planos;
- planos: Start R$ 57, Pro R$ 147, Scale R$ 347 por mês (anual com desconto);
- 3 dias grátis para testar;
- atacado nativo em todos os planos;
- 26 temas, por nicho;
- suporte humano pelo WhatsApp desde o Start;
- equipe no Brás (São Paulo), migração pela equipe;
- parceiros: 20%, 24% ou 28% (CNPJ) e 15%, 19% ou 23% (CPF) de toda mensalidade, sem nota fiscal.

---

## 9. Dados abertos para indexação

O dono pediu "criar dados para ser indexados". A forma certa é publicar o que já temos, com fonte, num formato que robô, IA e jornalista possam usar e citar:

| Endereço | Conteúdo | Formato |
|---|---|---|
| `/dados` | Página explicando os conjuntos, a metodologia, as fontes e as datas | HTML + `Dataset` |
| `/dados/plataformas-de-loja-virtual.json` e `.csv` | Por plataforma e plano: mensalidade, moeda, tarifa por venda, atacado nativo, suporte, limites, fonte, data | JSON/CSV |
| `/dados/custo-anual-por-faixa.json` e `.csv` | Custo do ano em R$ 10 mil, 30 mil e 100 mil por mês, com premissas | JSON/CSV |
| `/dados/programas-de-parceiros.json` e `.csv` | Regras publicadas de cada programa, fonte e data | JSON/CSV |
| `/dados/temas.json` | Os 26 temas: nome, nicho, grátis ou premium, link da demonstração | JSON |

**Regras:**
- Tudo é gerado pelo sistema a partir dos módulos existentes, nunca escrito à mão.
- Cada linha traz `fonte` e `consultado_em`.
- A licença é aberta com atribuição (sugestão: CC BY 4.0; decisão do dono).
- Quando um dado de concorrente mudar, a data muda, o `lastmod` muda e o IndexNow avisa.

**Um "relatório anual" (opcional, P3):** "Quanto custa vender online no Brasil em 2026", em PDF e página, com os mesmos dados. Esse é o tipo de material que blogs e jornalistas citam, e a citação vira autoridade.

---

## 10. Presença fora do site (autoridade)

| Canal | Ação | Quem |
|---|---|---|
| Perfil da Empresa no Google | Criar ou ajustar: nome, categoria "Serviço de comércio eletrônico", endereço no Brás, horário, WhatsApp, fotos da equipe, link do site | Dono |
| Bing Places | O mesmo do Google (importa direto do Google) | Dono |
| LinkedIn | Página da empresa com a mesma descrição e os fatos | Dono |
| YouTube | A série de 6 vídeos com descrição completa, capítulos e link; playlist; os vídeos embutidos nas páginas com `VideoObject` | Dono + sistema |
| Instagram e TikTok | Bio com a frase-padrão e o link; cortes da série | Equipe |
| Sites de avaliação de software (ex.: B2B Stack, Capterra, G2) | Perfil com os fatos; pedir avaliação **real** aos primeiros lojistas, sem pagar e sem dar desconto em troca | Dono |
| Reclame Aqui | Perfil da empresa criado e respondido | Dono |
| Diretório de parceiros do Mercado Pago e de integrações (Melhor Envio, Frenet, Tiny, Omie) | Pedir listagem como plataforma integrada | Dono |
| Listas "melhores plataformas de e-commerce" (blogs, portais de e-commerce) | Contato com os autores: mandar os dados abertos e o comparativo com fonte | Equipe |
| Imprensa e associações (ABComm, portais do Brás) | Release com o relatório de custo e a história do Brás | Dono |
| Lojas dos lojistas | Selo "Feito com NextLevel" no rodapé, com link (o lojista pode desligar) | Sistema |
| Parceiros e criadores | Kit de divulgação com o link e a frase-padrão | Sistema |
| Wikidata | Só se houver fontes independentes (imprensa) que comprovem os dados; sem isso, não criar | Depois |

**Frase-padrão da entidade** (igual em todo lugar): "NextLevel E-commerce é a plataforma de lojas virtuais da NextLevel, nascida no Brás (São Paulo), com atacado nativo em todos os planos e 0% de tarifa da plataforma sobre as vendas com o Mercado Pago."

---

## 11. As lojas dos lojistas como motor de busca

Cada loja publicada é uma página indexável: ajuda o lojista a vender e espalha a marca.
- Conferir e completar o que já existe em `src/lib/storefront-seo.ts` e nas páginas de produto:
  - `Product` com `offers`, disponibilidade e preço;
  - `BreadcrumbList`;
  - `Organization` da loja;
  - sitemap e robots próprios;
  - `canonical` no domínio próprio quando houver.
- Feed de produtos (`feed.xml`) para o Google Merchant Center e o catálogo da Meta (fila de integrações, Rodada A).
- Selo "Feito com NextLevel" com link para a home e opção de desligar.
- No painel do lojista: um "check de busca" da loja (títulos, descrições, fotos com texto alternativo, produto sem descrição), dentro da fila do dia, sem módulo novo.

---

## 12. Medição

| O que medir | Ferramenta | Frequência |
|---|---|---|
| Páginas indexadas, impressões, cliques e posição por termo | Google Search Console e Bing Webmaster | semanal |
| Visitas orgânicas e cadastros vindos de busca | GA4 (I-01) e os UTMs | semanal |
| Visitas vindas de IA | Origem (`referrer`) `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`; o parâmetro `utm_source=chatgpt.com` quando a IA manda | semanal |
| Citação nas IAs | **Teste mensal:** as 30 perguntas da seção 5.2 feitas em ChatGPT, Gemini, Perplexity, Copilot e Claude; registrar se a NextLevel aparece, em que posição e se o fato está certo | mensal |
| Velocidade | PageSpeed Insights e os dados reais do Search Console | mensal |

**Onde guardar:** começar por uma planilha. Quando houver 3 meses de dados, criar a seção "Busca e IA" dentro de uma tela existente do Master (Crescimento), sem painel novo.

---

## 13. Fases, entregas e critérios de aceite

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **S0 · Base técnica** | Corrigir os achados 1 a 7 e 14 da seção 3; tabela central de metadados; `Organization`, `WebSite` e `SoftwareApplication` corretos; sitemap completo com `lastmod`; robots com os robôs de IA; meta de verificação do Google e do Bing por `platform_settings`; IndexNow | Teste que compara as páginas públicas com o sitemap; teste que proíbe descrição repetida ou com texto vencido; validador de dados estruturados sem erro (Rich Results Test e validator.schema.org) nas 10 páginas principais; prints |
| **S1 · Dados estruturados em tudo** | `FAQPage`, `BreadcrumbList`, `ItemList`, `Product` (temas), `VideoObject`; fatos em `src/lib/seo/fatos.ts` | Testes de unidade do JSON-LD (campos obrigatórios e que batem com o texto visível); zero erro no validador |
| **S2 · Arquivos para IA e dados abertos** | `/llms.txt`, `/llms-full.txt`, `/dados` com JSON e CSV gerados dos módulos | Teste: cada linha tem fonte e data; os números batem com a página do comparativo |
| **S3 · Comparação e escolha** | `/melhor-plataforma-de-loja-virtual`, `/comparativo/nextlevel-x-*` (5), `/loja-virtual-sem-taxa` | Cada página segue o molde da seção 8; revisão do dono na primeira; prints em 360, 768 e 1440 px |
| **S4 · Nichos e atacado** | `/loja-virtual-para/*` (6) e `/loja-virtual-atacado-bras` | Idem; links internos no rodapé |
| **S5 · Custo, migração, sobre e glossário** | `/quanto-custa-uma-loja-virtual`, `/migrar-da-*`, `/sobre`, `/glossario`, `/imprensa` | Idem; `/sobre` com fotos reais e dados aprovados pelo dono |
| **S6 · Guias** | 8 a 12 guias em `/guias` | Um guia por rodada; revisão do dono no primeiro |
| **S7 · Lojas dos lojistas** | Check de busca no painel; selo "Feito com NextLevel"; conferência do SEO das lojas | Teste de domínio do check; prints |
| **S8 · Medição** | Origem "IA" separada nos relatórios de cadastro; roteiro do teste mensal; depois, a seção no Master | Primeiro relatório mensal entregue ao dono |

**Ordem recomendada:** S0 → S1 → S2 → S3 → S4 → S8 → S5 → S6 → S7. As fases S0 a S2 são a base e não dependem do dono, exceto pelos códigos de verificação.

---

## 14. O que depende do dono

1. **Domínio definitivo** da E-commerce: ficar em `lojas.nextlevelgroup.com.br` ou registrar `nextlevelcommerce.com.br`. Trocar depois custa posição (exige redirecionamento 301 de tudo). **Decidir antes da S3.**
2. Códigos de verificação do **Google Search Console** e do **Bing Webmaster** (colar no Master).
3. **Perfil da Empresa no Google**, LinkedIn, Reclame Aqui e sites de avaliação (conta e acesso são dele).
4. Dados do `/sobre`: endereço que pode ser público, CNPJ, fotos e texto do fundador.
5. Licença dos dados abertos (sugestão: CC BY 4.0).
6. Se o preço dos temas premium pode aparecer nas páginas e nos dados (hoje a série mostra só "grátis" e "premium").
7. Revisar a primeira página de cada tipo antes de publicar.
8. Volume de palavras-chave: acesso ao Planejador de Palavras-chave (conta Google Ads).

---

## 15. Riscos e proibições

- **Conteúdo em escala sem valor** (muitas páginas iguais trocando só o nome do nicho ou do concorrente): o Google rebaixa o site inteiro. Cada página precisa de dado e texto próprios.
- **Propaganda comparativa:** só fatos verificáveis, com fonte e data, sem depreciar a marca do concorrente. Nome do concorrente pode ir no título quando a página realmente compara ("NextLevel × Nuvemshop").
- **Dado vencido** é pior que nenhum: as páginas de comparação mostram a data; quando passar de 60 dias sem conferência, um teste ou alerta no Master avisa.
- **Avaliações:** nunca comprar, inventar ou trocar por desconto. Sem `AggregateRating` sem avaliações reais.
- **Robôs de IA:** liberar o treino é decisão do dono. A recomendação é liberar, porque o objetivo é ser conhecido.
- **Nada de texto só para robô** (texto escondido, conteúdo diferente por robô): é contra as regras de todos os buscadores.

---

## 16. Prompt mestre (colar numa sessão para desenvolver cada fase)

```
Você vai desenvolver a fase [S0..S8] do plano "Busca e IA: ser encontrado do Google ao ChatGPT".

LEIA ANTES (nesta ordem)
1. CLAUDE.md e AGENTS.md (pilha, comandos, regras, branch de publicação, base de conhecimento D264).
2. docs/prompts/busca-e-ia-visibilidade-organica.md inteiro, em especial as seções 3 (diagnóstico), 4 (regras),
   6 a 9 (páginas, técnica, conteúdo, dados) e a linha da sua fase na seção 13.
3. docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md (fronteiras e regras do e-commerce).
4. O código que você vai estender: src/app/sitemap.ts, src/app/robots.ts, src/lib/seo-marca.ts,
   src/components/portal/json-ld.tsx, src/lib/storefront-seo.ts, src/app/(portal)/** (páginas públicas),
   src/lib/marcas/comparativo-ecommerce.ts, src/lib/marcas/placar-seed.ts, src/lib/finance/captacao-regras.ts,
   src/lib/themes/catalog.ts, getPriceBook (preços), getBrand() (texto da marca).
5. node_modules/next/dist/docs/ para a API de metadados, sitemap e robots desta versão do Next.js (ela muda).

RELATE PRIMEIRO (antes de escrever código)
- Em até 10 linhas: o que existe, o que vai mudar, os arquivos, os testes que vai escrever e o que depende do dono.
- Se a fase pede algo que conflita com as regras da seção 4 do plano ou com a Constituição, pare, explique e
  proponha a alternativa.

REGRAS
- Verdade com fonte e data: todo número de concorrente vem dos módulos de comparação (nunca digitado na página),
  e a página mostra a fonte e a data de consulta.
- Sem promessa de ganho; sem preço de serviço; mensalidade dos planos vem de getPriceBook.
- Texto de marca por getBrand(); página com banco: export const dynamic = "force-dynamic".
- Uma página por intenção, útil por si só (mínimo de 600 palavras nas páginas novas, resposta nas 2 primeiras
  frases, tabela em HTML, FAQ de 4 a 8 perguntas, data de atualização, links internos).
- JSON-LD só com o que está visível na página; nunca AggregateRating ou Review sem avaliação real.
- Nada de texto escondido ou conteúdo diferente para robô.
- Acessibilidade AA, um h1 por página, sem rolagem horizontal em 360 px.
- Anti-duplicação: estenda sitemapPaths, robotsPlan, JsonLd e as páginas existentes antes de criar módulo novo.

TESTES (mudança de comportamento sem teste não entra)
- S0: teste que compara a lista de páginas públicas com o sitemap; teste que proíbe title/description repetidos,
  vazios ou com texto vencido ("em breve", "7 dias", "setup"); teste do robots com os robôs de IA.
- S1: testes do JSON-LD (tipos, campos obrigatórios, coerência com o texto visível).
- S2: teste de que cada linha dos dados abertos tem fonte e consultado_em, e de que os números batem com o
  comparativo.
- S3 a S6: teste de que a página existe no sitemap, tem canonical, FAQPage válido e fonte em cada número.
- Rode só tipos, estilo e os testes dos arquivos mexidos durante o trabalho (npx tsc --noEmit,
  npx eslint src e2e tests, npx vitest run tests/<arquivo>.test.ts); a bateria completa e o npm run build ficam
  para o fim da rodada.

VERIFICAÇÃO VISUAL E EXTERNA
- Prints reais (Playwright, Chromium em /opt/pw-browsers/chromium) em 360, 768 e 1440 px de cada página nova ou
  mudada; mande ao dono pelo menos um print da principal entrega.
- Depois do deploy: curl no robots.txt, no sitemap.xml, no llms.txt e nas páginas, conferindo title, description,
  canonical e JSON-LD no HTML publicado; validar o JSON-LD (validator.schema.org) e registrar o resultado.

FECHAMENTO
- Registre a decisão em docs/design/DECISIONS.md (próxima livre, título com "[E-commerce]"), cite-a na base de
  conhecimento (docs/conhecimento/BC0-INVENTARIO.md) e rode node scripts/gerar-novidades.mjs.
- Atualize a linha "Estado" deste plano e a linha dele em docs/prompts/README.md.
- Commit em português, git pull --rebase e push na branch de publicação; confira o site no ar.
- Relate ao dono em português simples: o que ficou pronto (com print), o que depende dele (seção 14) e a
  próxima fase.
```
