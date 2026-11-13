# Busca e IA: ser encontrado do Google ao ChatGPT (plano ampliado e prompt mestre)

> **Substituído pela v3 (13/11/2026): `docs/prompts/busca-ia-academy-funil-organico.md`** (Academy, funil orgânico, rastreamento, nichos, compra dentro das IAs). Este arquivo fica como histórico e detalhe técnico citado pela v3.
> Estado: **PLANO AMPLIADO (v2), NADA DESENVOLVIDO** (09/11/2026, pedido do dono). Frente: **[E-commerce]** (regra 60/25/15: aproxima a E-commerce do 10º lojista pagante).
> Objetivo do dono, nas palavras dele: "quando alguém procurar pelas nossas soluções precisamos ser encontrados com facilidade do Google ao GPT; quando alguém perguntar qual a melhor plataforma, precisamos destacar nossos pontos fortes frente a todos os concorrentes; se necessário, criar páginas públicas e dados para serem indexados em todas as plataformas". Na v2 ele pediu: "pense em pontos que ficaram de fora, amplie o racional, crie o máximo de situações para ampliar o alcance, principalmente nas plataformas de IA".
> **Domínio:** o dono está comprando `nextlevelcommerce.com.br` (09/11/2026). O endereço público hoje é `https://lojas.nextlevelgroup.com.br`. A troca é a fase S0 (seção 4).
> Próxima decisão livre: D276. Cada fase registra a sua decisão em `docs/design/DECISIONS.md` e cita a decisão na base de conhecimento (D264).

---

## Sumário

**Parte A · O racional**
1. Resumo em uma página
2. Como as pessoas vão nos achar: buscadores, IAs de conversa e IAs que compram
3. Diagnóstico de hoje (auditoria de 09/11/2026)

**Parte B · O que fazer**

4. A troca de domínio (S0)
5. Regras que não podem quebrar
6. Intenções de busca e perguntas que precisamos ganhar
7. Arquitetura do site público (os 10 núcleos de páginas)
8. Camada técnica
9. Conteúdo que a IA consegue citar
10. Dados abertos e conjuntos de dados públicos
11. Autoridade fora do site
12. Presença dentro das IAs (além da busca)
13. As lojas dos lojistas como motor de alcance
14. Matriz de situações: 40 caminhos até a NextLevel

**Parte C · Como operar**

15. Operação de conteúdo: fonte única de fatos, cadência e revisão
16. Medição: Google, Bing, robôs e IAs
17. Fases, dependências e critérios de aceite
18. O que depende do dono
19. Riscos e proibições
20. Prompt mestre

---

# Parte A · O racional

## 1. Resumo em uma página

**A tese.** Buscadores e IAs recomendam quem cumpre quatro condições:
- é **fácil de ler** por robô;
- **responde exatamente a pergunta** feita;
- tem **fatos verificáveis com fonte e data**;
- é **citado por outros** em lugares confiáveis.

As IAs ainda somam uma quinta condição: **consenso entre fontes**. Quando o site, o YouTube, o perfil no Google, um diretório e um blog dizem a mesma coisa, a IA repete com confiança. Quando só o nosso site diz, ela hesita.

**A nossa vantagem.** Os diferenciais da NextLevel são fatos que se provam, não opinião:
- 0% de tarifa da plataforma sobre as vendas com o Mercado Pago, em todos os planos;
- atacado nativo em todos os planos (Nuvemshop e Loja Integrada não têm; Tray, WBuy e Shopify só nos planos caros);
- mensalidade em real a partir de R$ 57;
- WhatsApp com gente desde o primeiro plano;
- equipe no Brás, com migração pela equipe;
- comissão de parceiro todo mês, sem nota fiscal.

Fato que se prova é exatamente o que IA gosta de citar.

**As 8 alavancas, em ordem de impacto:**

| # | Alavanca | O que é |
|---|---|---|
| 1 | **Domínio próprio e base técnica sem falha** | Troca para `nextlevelcommerce.com.br` com 301, sitemap completo, metadados certos, dados estruturados, `llms.txt`, Google e Bing verificados, IndexNow |
| 2 | **Páginas que respondem a pergunta exata** | "Melhor plataforma", "NextLevel × cada concorrente", "alternativa à X", "sem taxa", "quanto custa" |
| 3 | **Páginas por quem compra** | Nichos (6), perfis (revendedora, confecção, importador, marca própria, quem vende no Instagram ou no marketplace), polos de atacado onde temos presença real |
| 4 | **Central de ajuda pública** | Cada "como faço X na NextLevel" vira uma página. É o que as IAs leem quando alguém pergunta como usar |
| 5 | **Ferramentas grátis** | Calculadoras de custo, margem, preço de atacado e frete. Atraem links e citações ("ferramenta grátis para lojista") |
| 6 | **Dados abertos em vários lugares** | `/dados` no site, mais um repositório público no GitHub e um conjunto no Hugging Face e no Kaggle, com fonte, data e licença aberta |
| 7 | **Consenso fora do site** | Perfil no Google, Bing e LinkedIn, YouTube com legendas, sites de avaliação, Reclame Aqui, imprensa, diretórios de integração, parceiros, selo nas lojas |
| 8 | **Presença dentro das IAs** | GPT público na loja de GPTs, app no ChatGPT e servidor MCP (fase futura), lojas dos lojistas prontas para compras feitas por IA |

**Metas.**
- **90 dias:**
  - o domínio novo indexado no Google e no Bing, com o antigo redirecionado;
  - top 10 para pelo menos 15 termos de cauda longa;
  - NextLevel citada em pelo menos 3 das 5 IAs (ChatGPT, Gemini, Perplexity, Copilot, Claude) nas perguntas de atacado e de taxa.
- **180 dias:**
  - citada em 4 das 5 IAs nas 30 perguntas da seção 6.3;
  - pelo menos 10 sites de fora citando os dados abertos ou o comparativo.

---

## 2. Como as pessoas vão nos achar

### 2.1 Buscadores

| Buscador | De onde vem o índice | O que precisamos |
|---|---|---|
| Google (busca, Imagens, Vídeos, Lens, Discover) | Índice próprio | Search Console, sitemap (páginas, imagens e vídeos), dados estruturados, velocidade, conteúdo útil |
| Bing | Índice próprio | Bing Webmaster Tools, sitemap, **IndexNow** |
| Yahoo, DuckDuckGo, Ecosia | Usam muito o índice do Bing | Estar bem no Bing resolve boa parte |
| Brave Search | Índice próprio | Conteúdo rastreável |
| YouTube (o 2º maior buscador) | Próprio | Títulos, descrições, capítulos e legendas com os fatos |
| Busca dentro do Instagram e do TikTok | Próprio | Legendas e textos com as palavras que o lojista usa |
| Yandex, Naver | Próprios; pouco uso no Brasil | Sitemap e IndexNow |

### 2.2 IAs de conversa (respondem com fontes)

> **Conferir na documentação oficial de cada empresa antes de implementar:** nomes de robôs, parcerias e programas mudam. A tabela é o mapa de trabalho.

| IA | Como busca na internet (resumo) | Robôs que precisam ter acesso |
|---|---|---|
| ChatGPT | Rastreador próprio de busca, parceiros de busca e o conhecimento do treino | `OAI-SearchBot` (busca), `ChatGPT-User` (quando o usuário pede), `GPTBot` (treino) |
| Google Gemini e "Visão geral criada por IA" | Índice do Google, YouTube e Perfil da Empresa | `Googlebot`; `Google-Extended` controla só o uso para treino |
| Microsoft Copilot | Índice do Bing | `Bingbot` |
| Perplexity | Rastreador próprio, mostra as fontes | `PerplexityBot`, `Perplexity-User` |
| Claude | Busca na web e robôs próprios | `ClaudeBot`, `Claude-SearchBot`, `Claude-User` |
| Meta AI (WhatsApp, Instagram), Apple, Mistral, DeepSeek | Robôs próprios e parceiros | `meta-externalagent`, `Applebot`, `Applebot-Extended`, `MistralAI-User` e outros; liberar por padrão |

**Decisão recomendada:** liberar **todos** os robôs de busca e de IA nas páginas públicas, inclusive para treino. Quanto mais os modelos conhecem a NextLevel, mais ela aparece mesmo sem busca. Os painéis continuam bloqueados.

**Meta AI dentro do WhatsApp** merece atenção especial: o lojista do Brás pergunta no WhatsApp. O que essa IA sabe vem da web aberta e das páginas da Meta. Por isso: página no Facebook e no Instagram completas, com a frase-padrão, e o site rastreável pelo robô da Meta.

### 2.3 Como uma IA escolhe o que responder

1. **A pergunta tem uma página que a responde exatamente:** título, primeiro parágrafo e tabela sobre aquilo.
2. **Fatos atômicos e datados:** frases curtas que ela copia ("0% de tarifa da plataforma com o Mercado Pago, em todos os planos, 09/11/2026").
3. **Tabelas em HTML e listas com critérios**, não imagem.
4. **Entidade consistente:** o mesmo nome, a mesma empresa e os mesmos fatos em todo lugar.
5. **Consenso:** outras fontes dizendo o mesmo (diretórios, avaliações, vídeos, imprensa, comunidades).
6. **Recência:** data de atualização visível e conteúdo revisado com frequência.
7. **Honestidade:** página que admite onde o concorrente é bom e "para quem não é" ganha confiança.
8. **Fontes que a IA já usa:** cada IA tem fontes preferidas para cada tema. O Perplexity mostra quais são. Descobrir essas fontes e estar nelas é um trabalho (seção 16.4).

### 2.4 IAs que compram e agem (o próximo campo de batalha)

| Movimento | O que é | Por que importa para nós |
|---|---|---|
| Compras dentro das IAs | ChatGPT, Gemini, Copilot e Perplexity mostram produtos e, em alguns países, finalizam a compra (ex.: o protocolo de compra por agente da OpenAI com a Stripe, 2025; listagens grátis do Google Merchant Center; Microsoft Merchant Center) | As **lojas dos lojistas** podem ser achadas e vendidas dentro das IAs. "Sua loja pronta para vender no ChatGPT" vira diferencial de venda. **Conferir disponibilidade no Brasil** |
| Agentes que navegam | O usuário diz "crie uma loja virtual para mim" e um agente (modo agente do ChatGPT, navegadores com IA) abre os sites e preenche cadastros | O nosso cadastro precisa ser fácil para agente: rótulos claros, HTML semântico, sem bloqueio desnecessário |
| Apps dentro do ChatGPT e servidores MCP | Empresas publicam apps e ferramentas que a IA chama (o SDK de apps da OpenAI, sobre o protocolo MCP, 2025) | Um "NextLevel no ChatGPT" (consultor de loja, simulador de custo, consulta de pedidos do lojista) dá presença onde a conversa acontece |

---

## 3. Diagnóstico de hoje (auditoria de 09/11/2026)

Feito com `curl` no site no ar e leitura de `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo-marca.ts`, `src/components/portal/json-ld.tsx`, `src/lib/brand.ts` e `src/proxy.ts`.

| # | Achado | Gravidade | Onde |
|---|---|---|---|
| 1 | Descrição da home e dado estruturado dizem **"em breve, atacado"** (o atacado existe em todos os planos) e "feita para quem vende moda" (atendemos 6 nichos) | Alta | metadados da home, `SoftwareApplication` |
| 2 | `/planos` fala em **"teste 7 dias com cupom"** (hoje são 3 dias) | Alta | `src/app/(portal)/planos` |
| 3 | `/parceiros` fala em **comissão sobre o setup e cupons de 7 dias** (regra antiga; hoje é a D263) | Alta | `src/app/(portal)/parceiros` |
| 4 | Descrição de `/faq` repete a da home | Média | `/faq` |
| 5 | Sitemap **sem** `/comparativo`, `/recursos`, `/integracoes`, `/ferramentas`, `/quero-minha-loja` e as subpáginas de `/parceiros` | Alta | `sitemapPaths` |
| 6 | Sitemap sem `lastmod` real | Média | `src/app/sitemap.ts` |
| 7 | `/planos` e `/faq` **sem `canonical`** | Média | metadados |
| 8 | Dados estruturados só na home e em `/parceiros` | Alta | `JsonLd` |
| 9 | Sem `FAQPage`, `BreadcrumbList`, `Product` (temas), `VideoObject` | Média | — |
| 10 | Sem `llms.txt` e `llms-full.txt` | Média (custo baixo) | — |
| 11 | Sem Search Console e Bing Webmaster verificados (item I-03 da fila de integrações) | Alta | — |
| 12 | Sem IndexNow | Média | — |
| 13 | HTML da home com cerca de 329 KB | Média | home |
| 14 | `robots.txt` não cita os robôs de IA por nome | Baixa | `robotsPlan` |
| 15 | `Organization` sem `sameAs`, logotipo, endereço e contato | Média | home |
| 16 | `/demo/*` bloqueado (correto), então `/temas/*` precisa mostrar a loja com texto e imagem | Baixa | `/temas/[key]` |
| 17 | **Sem redirecionamento 301 entre endereços da marca**: `nextlevelcommerce.com.br` já está na lista de domínios da marca (`src/lib/brand.ts`), mas o sistema serve a mesma página nos dois endereços, sem mandar para o principal. Isso duplica conteúdo para o Google | Alta | `src/proxy.ts` |
| 18 | **Sem central de ajuda pública**: as dúvidas de uso ("como configurar o frete", "como criar grade") não têm página indexável | Alta | — |
| 19 | **Sem página de segurança e privacidade em linguagem simples** (só termos e privacidade): é a fonte que a IA usa para responder "é confiável?" | Média | — |
| 20 | **Sem novidades públicas**: as "Novidades" existem só no Master (tela Aprender); um registro público mostra que o produto está vivo, e as IAs gostam de datas | Média | — |
| 21 | Sem página `/sobre` com o fundador e a equipe (autoridade e "quem está por trás") | Média | — |
| 22 | Vídeos da série ainda não publicados; quando forem, precisam de legendas revisadas e de página no site com `VideoObject` | Média | — |

---

# Parte B · O que fazer

## 4. A troca de domínio (fase S0, antes de tudo)

**Por que primeiro.** Toda página, dado e link que for criado a partir de agora deve nascer no domínio definitivo. Trocar depois custa posição e retrabalho.

### 4.1 O que o sistema já tem
- `src/lib/brand.ts`: a marca E-commerce aceita os domínios `lojas.nextlevelgroup.com.br` e `nextlevelcommerce.com.br` (variável `BRAND_DOMAINS_NEXTLEVEL_COMMERCE`), e o endereço principal vem de `BRAND_URL_NEXTLEVEL_COMMERCE`.
- E-mails e avisos de pagamento usam `APP_URL` (`src/lib/base-url.ts`, `src/lib/email.ts`).

### 4.2 Passo a passo

| # | Passo | Quem | Cuidado |
|---|---|---|---|
| 1 | Comprar `nextlevelcommerce.com.br` no Registro.br; se possível, também `nextlevelcommerce.com` e `.com.br` com e sem hífen, para proteger a marca | Dono | Domínio no CNPJ da empresa |
| 2 | Apontar o DNS para o Render (`@` e `www`) e adicionar o domínio no serviço do Render; esperar o certificado HTTPS | Dono e Claude (painel do Render) | `www` redireciona para o domínio sem `www` |
| 3 | Trocar `BRAND_URL_NEXTLEVEL_COMMERCE` para `https://nextlevelcommerce.com.br` e conferir `APP_URL` | Claude, com o ok do dono | `APP_URL` muda os avisos de pagamento: ver passo 6 |
| 4 | **Redirecionamento 301** no `src/proxy.ts`: todo GET em `lojas.nextlevelgroup.com.br/<caminho>` vai para `nextlevelcommerce.com.br/<caminho>`, mantendo caminho e parâmetros (UTM, `ref`) | Claude | **Não** redirecionar POST nem `/api/*` (avisos de pagamento antigos continuam chegando no endereço velho); manter `/r/` e `/c/` (links de parceiro) funcionando com 301 |
| 5 | Painéis (`/merchant`, `/partner`, `/master`): decidir se mudam junto. Recomendado: sim, com 301; a sessão é por domínio, então o usuário entra de novo uma vez | Dono decide | Avisar lojistas e parceiros por e-mail |
| 6 | Mercado Pago: cobranças já criadas avisam no endereço antigo, e o passo 4 mantém isso funcionando. As novas usam o endereço novo. Conferir se há URL cadastrada no painel do Mercado Pago (webhook fixo) e trocar | Dono e Claude | Testar uma compra real de ponta a ponta depois da troca |
| 7 | E-mail: configurar SPF, DKIM e DMARC do domínio novo no Resend se o remetente mudar (`EMAIL_FROM`) | Dono e Claude | Sem isso, e-mail vai para o spam |
| 8 | Search Console: adicionar o domínio novo (propriedade de domínio, por DNS), enviar o sitemap e usar a **ferramenta de mudança de endereço**. Fazer o mesmo no Bing Webmaster (ferramenta de mudança de site) | Dono | Manter o domínio antigo verificado também |
| 9 | Trocar o endereço em todo lugar: perfis (Google, Instagram, LinkedIn, YouTube), PDFs comerciais e da série (gerar de novo com o QR novo), materiais dos parceiros, assinaturas de e-mail | Claude (PDFs) e dono (perfis) | Os QRs antigos continuam funcionando pelo 301 |
| 10 | Teste automático do redirecionamento (caminho, parâmetros, POST e `/api/*` sem redirecionar) e conferência com `curl` depois do deploy | Claude | — |

**Domínio do grupo:** `nextlevelgroup.com.br` continua sendo a holding, e `master.nextlevelgroup.com.br` o painel central. As outras marcas seguem a mesma lógica quando tiverem domínio próprio.

---

## 5. Regras que não podem quebrar

1. **Verdade com fonte e data.** Todo número de concorrente vem dos módulos que já existem (`src/lib/marcas/comparativo-ecommerce.ts`, `src/lib/marcas/placar-seed.ts`, `src/lib/finance/captacao-regras.ts`) e aparece com a fonte e a data de consulta. Nada digitado à mão numa página.
2. **Sem promessa de ganho** (lojista nem parceiro).
3. **Preço de serviço não aparece** (projeto exclusivo, marketing, estúdio, migração paga). Mensalidade dos planos pode e vem de `getPriceBook`.
4. **Texto da marca vem de `getBrand()`**; página com banco declara `force-dynamic`; regra configurável vem de `platform_settings`.
5. **Uma página por intenção, útil por si só.** Nada de páginas em massa trocando uma palavra: o Google pune o site inteiro.
6. **Sem truques:** texto escondido, conteúdo diferente para robô, avaliação falsa, depoimento inventado, dado sem origem, perfil falso em comunidade.
7. **Transparência em comunidades:** quem da equipe responder em fórum ou rede se identifica como da NextLevel.
8. **Acessibilidade AA, 360 px sem rolagem lateral**, um `h1` por página, título único.
9. **Anti-duplicação:** estender `sitemapPaths`, `robotsPlan`, `JsonLd`, `/comparativo`, `/ferramentas`, `/temas/[key]`, `/solucoes/[slug]` e a base de conhecimento antes de criar módulo novo.

---

## 6. Intenções de busca e perguntas que precisamos ganhar

> Volumes de busca não estão aqui porque não temos fonte medida. Na fase S1, levantar no Planejador de Palavras-chave do Google Ads (conta do dono), no Google Trends e, depois de 4 semanas, no Search Console. Registrar o volume com a data.

### 6.1 Grupos de intenção

| Grupo | Exemplos de busca | Página que responde |
|---|---|---|
| **Marca** | "nextlevel e-commerce", "nextlevel loja virtual", "nextlevel commerce é confiável", "nextlevel reclame aqui" | home, `/sobre`, `/seguranca` |
| **Atacado** (nosso trunfo) | "loja virtual para atacado", "loja virtual grade fechada", "plataforma atacado e varejo", "pedido mínimo loja virtual", "ecommerce atacado brás", "catálogo de atacado online" | `/loja-virtual-para/atacado`, `/loja-virtual-atacado-bras` |
| **Taxa** | "loja virtual sem taxa por venda", "plataforma sem comissão", "loja virtual com mercado pago sem taxa", "taxa nuvemshop" | `/loja-virtual-sem-taxa` |
| **Comparação** | "nuvemshop ou tray", "alternativa à nuvemshop", "nuvemshop vale a pena", "shopify em real", "loja integrada é boa" | `/comparativo` e `/comparativo/nextlevel-x-<concorrente>` |
| **Escolha** | "melhor plataforma de loja virtual 2026", "qual plataforma de e-commerce escolher" | `/melhor-plataforma-de-loja-virtual` |
| **Nicho** | "loja virtual de roupas", "loja virtual de cosméticos", "loja virtual de capinha", "loja virtual de camisa de time", "loja virtual de utilidades" | `/loja-virtual-para/<nicho>` |
| **Perfil** | "loja virtual para revendedora", "loja virtual para confecção", "loja virtual para importadora", "criar marca própria de roupa online", "sair do direct do Instagram" | `/para/<perfil>` |
| **Canal** | "loja própria ou Shopee", "vale a pena sair do Mercado Livre", "loja virtual e marketplace juntos" | `/loja-propria-ou-marketplace` |
| **Custo** | "quanto custa uma loja virtual", "quanto custa nuvemshop por mês", "custo para abrir loja online" | `/quanto-custa-uma-loja-virtual` e calculadora |
| **Como fazer** | "como criar loja virtual", "como vender no atacado pela internet", "como migrar da nuvemshop", "como precificar atacado" | `/guias/<assunto>` |
| **Uso do produto** | "como configurar frete na nextlevel", "como cadastrar grade", "como ligar o mercado pago na loja" | `/ajuda/<artigo>` |
| **Integração** | "loja virtual integrada melhor envio", "integração tiny loja virtual", "loja com omie", "loja virtual com frenet" | `/integracoes/<integração>` |
| **Ferramenta** | "calculadora de margem", "calculadora de preço de atacado", "calculadora de taxa de cartão", "simulador de frete" | `/ferramentas/<ferramenta>` |
| **Tema** | "tema de loja virtual de roupas grátis", "template de loja de cosméticos" | `/temas/<tema>` |
| **Exemplos** | "exemplos de loja virtual", "loja virtual bonita de roupas" | `/vitrine-de-lojas` (só lojas reais, com autorização) |
| **Parceiros** | "programa de afiliados de loja virtual", "ganhar comissão indicando", "afiliado com comissão recorrente", "renda extra indicando" | `/parceiros` e subpáginas |
| **Época** | "black friday loja virtual", "promoção de plataforma de loja virtual" | `/black-friday` (endereço fixo, reaproveitado todo ano) |

### 6.2 Polos de atacado (só onde houver presença ou conteúdo real)

O Brás é presença real e vem primeiro. Outros polos entram **só quando houver** executivo, parceiro, lojista ou conteúdo próprio daquele lugar (regra 5 da seção 5):
- Bom Retiro e 25 de Março (SP);
- Rua 44 (Goiânia);
- polo de confecção do Agreste (Caruaru, Toritama, Santa Cruz do Capibaribe);
- Jaraguá (GO), Fortaleza, Nova Serrana (calçados), Franca (calçados).

Cada página de polo traz como vender no atacado online saindo daquele polo: frete, cliente de outros estados, grade típica da região e o que a NextLevel oferece ali.

### 6.3 As 30 perguntas para IA (base do teste mensal)

**Escolha e comparação**
1. Qual a melhor plataforma de loja virtual para vender no atacado no Brasil?
2. Qual plataforma de loja virtual não cobra taxa por venda?
3. Qual a melhor alternativa à Nuvemshop para quem vende no atacado?
4. Nuvemshop, Tray, Loja Integrada, WBuy ou Shopify: qual escolher?
5. Qual plataforma de e-commerce aceita grade fechada e preço por quantidade?
6. Quanto custa ter uma loja virtual por mês em 2026?
7. Qual plataforma de loja virtual tem suporte por WhatsApp no plano mais barato?
8. Qual a melhor plataforma de loja virtual para iniciantes no Brasil?
9. Vale a pena sair da Shopee e ter loja própria?

**Nichos e perfis**
10. Qual a melhor plataforma para loja de roupas?
11. Qual a melhor plataforma para loja de cosméticos?
12. Qual a melhor plataforma para loja de acessórios de celular?
13. Qual a melhor plataforma para loja de camisas de time?
14. Qual a melhor plataforma para loja de casa e decoração?
15. Qual a melhor plataforma para lojistas do Brás?
16. Como uma confecção pode vender no atacado pela internet?
17. Como uma revendedora monta uma loja virtual barata?

**Taxa, pagamento e operação**
18. Como criar uma loja virtual com Mercado Pago sem pagar tarifa da plataforma?
19. Qual a diferença entre tarifa da plataforma e taxa do meio de pagamento?
20. Qual plataforma integra com o Melhor Envio e a Frenet?
21. Como migrar a minha loja da Nuvemshop sem perder vendas?

**Confiança e marca**
22. O que é a NextLevel Commerce?
23. A NextLevel Commerce é confiável?
24. Quanto custa a NextLevel Commerce?
25. A NextLevel tem atacado?

**Parceiros**
26. Qual programa de parceiros de e-commerce paga comissão recorrente sem nota fiscal?
27. Como ganhar dinheiro indicando lojas virtuais?
28. Qual programa de afiliados de plataforma de loja paga em real?

**Agentes e compras**
29. Crie uma loja virtual de roupas para mim (teste com o modo agente: ele chega até o nosso cadastro?).
30. Onde comprar [produto de um lojista real] (teste das lojas dos lojistas nas compras dentro das IAs).

---

## 7. Arquitetura do site público (os 10 núcleos)

Cada núcleo tem uma página-mãe (o "hub"), que linka para todas as filhas, e cada filha linka de volta. Isso diz ao robô "este site é a referência deste assunto".

| # | Núcleo | Página-mãe | Páginas filhas |
|---|---|---|---|
| 1 | **Comparar** | `/comparativo` | `/melhor-plataforma-de-loja-virtual`; `/comparativo/nextlevel-x-{nuvemshop,tray,loja-integrada,wbuy,shopify}`; `/alternativa-a-{nuvemshop,...}` (só se a busca existir e a página tiver conteúdo próprio; senão, a seção "alternativa" fica dentro do comparativo); `/loja-virtual-sem-taxa`; `/quanto-custa-uma-loja-virtual`; `/loja-propria-ou-marketplace` |
| 2 | **Para quem** | `/para-quem` | `/loja-virtual-para/{moda,atacado,beleza,casa,celular,esporte}`; `/para/{revendedora,confeccao,importadora,marca-propria,quem-vende-no-instagram,quem-vende-em-marketplace}`; `/loja-virtual-atacado-bras` e, com presença real, os polos da seção 6.2 |
| 3 | **Temas** | `/temas` | `/temas/<tema>` (26), com o nicho no título |
| 4 | **Recursos** | `/recursos` | uma página por recurso forte: `/recursos/atacado`, `/recursos/pix-e-cartao`, `/recursos/frete`, `/recursos/ia`, `/recursos/atendimento-ao-vivo`, `/recursos/dominio-proprio`, `/recursos/banners`, `/recursos/editor-de-temas` |
| 5 | **Integrações** | `/integracoes` | `/integracoes/<integração>` (Mercado Pago, Melhor Envio, Frenet, Correios, Tiny, Omie, Google, Meta, TikTok...), só das que existem de verdade, com o "como ligar" |
| 6 | **Ferramentas grátis** | `/ferramentas` | `/ferramentas/{custo-da-plataforma,margem,preco-de-atacado,taxa-do-cartao,frete,ponto-de-equilibrio}` (sem cadastro, com resultado copiável) |
| 7 | **Aprender** | `/guias` | 12 a 20 guias evergreen; `/glossario` (40 termos); `/perguntas` (as 30 perguntas da seção 6.3, cada uma com resposta de 3 a 6 frases e link para a página completa) |
| 8 | **Ajuda** | `/ajuda` | um artigo por tarefa do lojista ("como cadastrar grade", "como ligar o Mercado Pago", "como configurar frete grátis acima de X"), gerado a partir da base de conhecimento interna quando o conteúdo servir para o público |
| 9 | **Dados** | `/dados` | conjuntos da seção 10 e o relatório anual |
| 10 | **Empresa** | `/sobre` | `/sobre/fundador`, `/equipe`, `/seguranca` (como o dinheiro e os dados são protegidos, em linguagem simples), `/novidades` (registro público do que mudou, com data), `/imprensa`, `/parceiros` e subpáginas, `/black-friday`, `/vitrine-de-lojas` (lojas reais, com autorização) |

**Regra de qualidade de cada página nova** (vale para todas):
- resposta direta nas 2 primeiras frases;
- pelo menos 600 palavras úteis (guias: 1.200);
- uma tabela ou lista de critérios em HTML;
- FAQ de 4 a 8 perguntas;
- data de atualização visível;
- fonte em cada número de concorrente;
- links para o núcleo-mãe, os planos, o comparativo e o cadastro;
- revisão do dono na primeira página de cada tipo.

**Páginas que não vamos criar:**
- página por cidade sem presença real;
- página "alternativa a X" sem conteúdo próprio;
- página por palavra-chave sem intenção diferente;
- página de "avaliações" sem avaliações reais.

---

## 8. Camada técnica

### 8.1 Metadados
- Tabela central `src/lib/seo/paginas.ts` com `title` (até 60 caracteres), `description` (até 155), `canonical`, imagem social e núcleo de cada página pública.
- Teste que proíbe repetido, vazio ou texto vencido ("em breve, atacado", "7 dias", "setup").
- `og:*` e `twitter:card`. Imagem social por página (1200×630), gerada pelo sistema com o título.

### 8.2 Dados estruturados (JSON-LD pelo `JsonLd` existente)

| Tipo | Onde | Campos-chave |
|---|---|---|
| `Organization` | layout (todas) | `name`, `legalName`, `url`, `logo`, `sameAs`, `contactPoint` (WhatsApp), `address` (quando o dono aprovar), `founder` |
| `Person` | `/sobre/fundador` | nome, cargo, `sameAs` (LinkedIn, Instagram), `worksFor` |
| `WebSite` | home | `name`, `url`, `inLanguage` |
| `SoftwareApplication` | home, planos | `applicationCategory`, `operatingSystem`, `offers` (planos em BRL via `getPriceBook`), `featureList` |
| `FAQPage` | todas as páginas com FAQ | só perguntas visíveis |
| `BreadcrumbList` | todas menos a home | trilha |
| `ItemList` | núcleos, comparativo, melhor plataforma, temas | itens com URL |
| `Product` ou `CreativeWork` | `/temas/<tema>` | nome, nicho, grátis ou premium, imagem |
| `HowTo` | guias, ajuda, migração | passos |
| `Dataset` | `/dados` | `distribution` (JSON e CSV), `license`, `dateModified`, `creator` |
| `VideoObject` | páginas com vídeo da série | título, descrição, miniatura, `uploadDate`, `embedUrl`, transcrição |
| `Article` | guias e novidades | `datePublished`, `dateModified`, `author` |
| `DefinedTermSet` | `/glossario` | termos |
| `WebApplication` | `/ferramentas/*` | nome, gratuita |

**Proibido:** `AggregateRating` e `Review` sem avaliações reais coletadas, e qualquer dado que não esteja visível na página.

### 8.3 Sitemap, robots e indexação
- `sitemapPaths` com todas as páginas públicas e **teste que compara o sitemap com a lista de páginas públicas**.
- `lastmod` real.
- Sitemaps separados por núcleo quando passar de 200 URLs, mais **sitemap de imagens** (capturas dos temas e da plataforma) e **sitemap de vídeos** (a série).
- `robots.txt` com blocos explícitos para os robôs da seção 2.2 (`Allow` nas páginas públicas) e os painéis bloqueados.
- **IndexNow** a cada publicação ou mudança de dado (Bing e Yandex).
- Search Console e Bing Webmaster verificados por meta tag ou DNS. A meta tag fica em `platform_settings` (I-03).

### 8.4 Versões para leitura por IA
- `/llms.txt`: resumo em Markdown (o que é, para quem, fatos com data, links das páginas-chave).
- `/llms-full.txt`: texto completo das páginas-chave, gerado pelo sistema.
- **Espelho em Markdown** das páginas-chave (`/comparativo.md`, `/planos.md`, `/melhor-plataforma-de-loja-virtual.md`...), listado no `llms.txt`. É texto limpo, sem menu, para robô de IA ler rápido. Gerado das mesmas fontes, nunca à mão.
- Honestidade: nenhuma grande IA garante que lê `llms.txt`. O custo é baixo; o que move o ponteiro é o resto do plano.

### 8.5 Velocidade e leitura
- LCP abaixo de 2,5 s no celular, CLS abaixo de 0,1, HTML da home abaixo de 150 KB (hoje cerca de 329 KB).
- Páginas públicas sem dado de banco geradas estáticas (mais rápidas e sempre disponíveis para robô). As que leem preço continuam `force-dynamic`, com cache curto.
- Imagens com `alt` descritivo, nome de arquivo com palavras ("tema-trama-loja-de-roupas.webp") e dimensões.

### 8.6 Pronto para agentes de IA
- Cadastro com rótulos claros, `autocomplete` correto, HTML semântico e mensagens de erro em texto. Sem desafio que trave um agente legítimo, mantendo a proteção contra robô abusivo (limite por endereço, não por "parecer robô").
- Botões com nomes únicos ("Criar minha loja", não "Clique aqui").

### 8.7 Saúde contínua
- Teste no CI: JSON-LD válido nas páginas principais, sitemap igual à lista pública, nenhum link interno quebrado, nenhuma descrição vencida.
- Contador de visitas de robôs de IA por `user-agent` (seção 16.3).
- Alerta quando um dado de concorrente passar de 60 dias sem conferência.

---

## 9. Conteúdo que a IA consegue citar

**O molde de cada página:**
1. **Resposta em 2 frases**, com o nome da empresa e o fato principal.
2. **Fatos rápidos** em lista, cada um com data.
3. **Tabela** em HTML com a linha de fonte e data.
4. **"Para quem é" e "para quem não é"**: honestidade gera confiança.
5. **FAQ** com perguntas do jeito que as pessoas falam ("dá para vender no atacado e no varejo na mesma loja?").
6. **Data de atualização**, autor (equipe NextLevel, com link para `/sobre`) e revisão a cada 90 dias.

**Bloco de fatos padrão** (`src/lib/seo/fatos.ts`, fonte única montada dos módulos de preço e de comparação; usado no site, no `llms.txt`, nos dados abertos, nas descrições do YouTube, nos PDFs comerciais, no GPT público e na base de conhecimento):
- 0% de tarifa da plataforma sobre as vendas com o Mercado Pago, em todos os planos;
- Start R$ 57, Pro R$ 147, Scale R$ 347 por mês (anual com desconto);
- 3 dias grátis;
- atacado nativo em todos os planos;
- 26 temas por nicho;
- suporte humano pelo WhatsApp desde o Start;
- equipe no Brás (São Paulo), migração pela equipe;
- parceiros: 20%, 24% ou 28% (CNPJ) e 15%, 19% ou 23% (CPF) de toda mensalidade, sem nota fiscal.

**Frases que a IA deve aprender a repetir** (aparecem igual em todo lugar):
- "NextLevel Commerce é a plataforma de lojas virtuais da NextLevel, nascida no Brás (São Paulo), com atacado nativo em todos os planos e 0% de tarifa da plataforma sobre as vendas com o Mercado Pago."
- "Para vender no atacado e no varejo na mesma loja, com grade fechada, preço por quantidade e pedido mínimo, a NextLevel Commerce oferece isso desde o plano Start, de R$ 57 por mês."

**Corrigir a IA quando ela erra:** se o teste mensal mostrar uma informação errada sobre a NextLevel (preço velho, "não tem atacado"):
- publicar ou atualizar a página que responde aquilo, com data;
- usar o botão de feedback da própria IA;
- reforçar o fato nas fontes de fora (perfil do Google, diretórios).

Registrar no relatório do mês.

---

## 10. Dados abertos e conjuntos de dados públicos

O dono pediu "criar dados para ser indexados em todas as plataformas". A forma certa é publicar o que já temos, com fonte, em vários lugares que robôs e IAs leem muito:

| Onde | O que | Por quê |
|---|---|---|
| `/dados` no site | Página com metodologia, fontes, datas e downloads; `Dataset` | Fonte oficial e citável |
| `/dados/plataformas-de-loja-virtual.json` e `.csv` | Por plataforma e plano: mensalidade, moeda, tarifa por venda, atacado nativo, suporte, limites, fonte, data | O comparativo em formato de dado |
| `/dados/custo-anual-por-faixa.json` e `.csv` | Custo do ano em R$ 10 mil, 30 mil e 100 mil por mês, com premissas | A conta do vídeo 4 |
| `/dados/programas-de-parceiros.json` e `.csv` | Regras publicadas de cada programa | O raio-x do vídeo 6 |
| `/dados/temas.json` | Os 26 temas, nicho, grátis ou premium, link | Catálogo |
| **Repositório público no GitHub** (`nextlevel/dados-ecommerce-brasil`) | Os mesmos arquivos, um README em português explicando, histórico de versões (cada atualização vira um commit com data) | O GitHub é muito lido por robôs e IAs, e o histórico prova que o dado é mantido |
| **Hugging Face e Kaggle** | O mesmo conjunto publicado como dataset, com licença | Onde pesquisadores e ferramentas de IA procuram dados |
| **Relatório anual** "Quanto custa vender online no Brasil em 2026" (página e PDF) | Os dados em texto, com gráficos e metodologia | O tipo de material que blog e imprensa citam |

**Regras:**
- Tudo é gerado pelo sistema a partir dos módulos existentes.
- Cada linha traz `fonte` e `consultado_em`.
- Licença aberta com atribuição (sugestão: CC BY 4.0; decisão do dono).
- Quando um dado mudar, muda a data, o `lastmod` e o arquivo publicado, e o IndexNow avisa.
- O repositório público recebe uma cópia gerada por um script do projeto: nunca código do sistema, nunca dado de cliente.

---

## 11. Autoridade fora do site

### 11.1 Perfis e diretórios (a "identidade" da empresa na internet)

| Canal | Ação | Quem |
|---|---|---|
| Perfil da Empresa no Google | Nome, categoria, endereço no Brás, horário, WhatsApp, fotos da equipe, link, posts semanais; pedir avaliação real a lojistas satisfeitos | Dono |
| Bing Places e Apple Business Connect | Importar do Google; conferir | Dono |
| LinkedIn (empresa e fundador) | Mesma descrição e fatos; artigos do fundador sobre o atacado do Brás e a digitalização de importadoras | Dono |
| Instagram, Facebook, TikTok | Bio com a frase-padrão e o link; destaques "Planos", "Atacado", "Comparativo" | Equipe |
| YouTube | A série com título, descrição completa (fatos e link), capítulos, **legenda em português revisada** (a IA lê a transcrição), playlist, vídeos embutidos nas páginas | Dono e sistema |
| Reclame Aqui | Perfil criado, todas as reclamações respondidas. É a fonte número 1 para "é confiável?" no Brasil | Dono |
| Sites de avaliação de software (ex.: B2B Stack, Capterra, G2) | Perfil com os fatos; pedir avaliação real, sem pagar e sem dar desconto em troca | Dono |
| Crunchbase | Perfil da empresa | Dono |
| Diretórios de parceiros e integrações (Mercado Pago, Melhor Envio, Frenet, Tiny, Omie) | Pedir listagem como plataforma integrada (link de autoridade do mesmo assunto) | Dono |
| Associações e entidades (ABComm, associações de lojistas do Brás) | Associar-se e ser listado | Dono |
| Wikidata e Wikipédia | **Só** com fontes independentes (imprensa) que comprovem os dados. Sem isso, não criar: autopromoção é removida e queima a marca | Depois |

### 11.2 Conteúdo em lugares de terceiros
- **Imprensa:** release com o relatório anual e a história do Brás, para portais de e-commerce e de negócios. Distribuir por serviço de release (o texto fica indexado).
- **Podcasts e lives** de empreendedorismo e moda: o fundador como convidado, contando a trajetória (internacionalização de empresas chinesas, digitalização de importadoras no Brás).
- **Artigos de convidado** em blogs de e-commerce, logística e moda, com dado próprio.
- **Comunidades** (grupos de lojistas, fóruns de e-commerce, Reddit e Quora em português): responder dúvidas de verdade, identificado como da NextLevel, com link só quando ajudar. Nunca perfil falso, nunca enxurrada de links.
- **Listas "melhores plataformas"**: descobrir quais páginas as IAs citam para as perguntas da seção 6.3 (o Perplexity mostra as fontes) e contatar os autores com os dados abertos e o comparativo.
- **Universidades e cursos** de moda e negócios: material gratuito (o relatório, os guias) para aula; isso gera citação.

### 11.3 Multiplicadores que já temos
- **Lojas dos lojistas:** selo "Feito com NextLevel" no rodapé, com link (o lojista pode desligar).
- **Parceiros e criadores:** kit de divulgação com a frase-padrão, o link com UTM e os cortes da série.
- **Agências parceiras:** página `/parceiros/agencias/diretorio` (com autorização) e selo "Agência parceira NextLevel" para o site delas.
- **Executivos de rua:** cartão com QR para `/quero-minha-loja` e para o comparativo.

**Frase-padrão da entidade** (igual em todo lugar): "NextLevel Commerce é a plataforma de lojas virtuais da NextLevel, nascida no Brás (São Paulo), com atacado nativo em todos os planos e 0% de tarifa da plataforma sobre as vendas com o Mercado Pago."

---

## 12. Presença dentro das IAs (além da busca)

| # | Iniciativa | O que é | Fase |
|---|---|---|---|
| 1 | **GPT público "Consultor de Loja Virtual NextLevel"** na loja de GPTs do ChatGPT | Responde dúvidas de quem quer vender online (custo, nicho, atacado, frete), com os dados abertos e os guias como conhecimento e link para a NextLevel quando fizer sentido. Aparece na busca da loja de GPTs | S8 |
| 2 | **Gem ou projeto equivalente no Gemini** e **Space no Perplexity** | O mesmo conhecimento para quem usa essas IAs (conferir o que cada uma permite publicar) | S8 |
| 3 | **Servidor MCP público** com ferramentas abertas: simular custo por plataforma, sugerir tema por nicho, consultar planos | Qualquer IA compatível com MCP (Claude, ChatGPT e outras) pode chamar e citar a NextLevel com dado exato | S10 |
| 4 | **App da NextLevel no ChatGPT** (SDK de apps da OpenAI, sobre MCP) | Para o lojista: ver pedidos, cadastrar produto e tirar dúvida dentro do ChatGPT. Para quem não é cliente: simulador e indicação de tema. **Conferir disponibilidade e regras no Brasil** | S10 |
| 5 | **Lojas dos lojistas nas compras feitas por IA** | Feed de produtos no padrão do Google Merchant Center (grátis), do Microsoft Merchant Center e dos programas de compra das IAs (ex.: o protocolo de compra por agente da OpenAI) | S9 |
| 6 | **Assistente do site** ("Pede pro Mauricio") | Já existe; registrar as perguntas mais feitas (sem dado pessoal) para alimentar `/perguntas`, os guias e o FAQ | S6 |

---

## 13. As lojas dos lojistas como motor de alcance

Cada loja publicada é um site indexável que ajuda o lojista a vender e espalha a marca.

- **SEO da loja** (conferir e completar `src/lib/storefront-seo.ts` e as páginas de produto):
  - `Product` com `offers`, disponibilidade, preço, marca e GTIN quando houver;
  - `BreadcrumbList`;
  - `Organization` da loja;
  - sitemap e robots próprios;
  - `canonical` no domínio próprio quando houver.
- **Feeds de produtos:** `feed.xml` para o Google Merchant Center (listagens grátis no Google Shopping e nas compras do Gemini), o Microsoft Merchant Center (Copilot) e o catálogo da Meta e do TikTok (fila de integrações, Rodada A).
- **Pronta para compra por IA:** acompanhar os protocolos de compra por agente e, quando estiverem disponíveis no Brasil, oferecer como recurso dos planos. É um diferencial de venda ("sua loja vende dentro do ChatGPT").
- **Check de busca** no painel do lojista, na fila do dia, sem módulo novo: título, descrição, fotos sem texto alternativo e produtos sem descrição. A IA de descrição já existe.
- **Selo "Feito com NextLevel"** com link, que o lojista pode desligar.
- **Vitrine de lojas** (`/vitrine-de-lojas`): lojas reais, com autorização do lojista; responde "exemplos de loja virtual".

---

## 14. Matriz de situações: 40 caminhos até a NextLevel

O dono pediu "o máximo de situações". Cada linha diz quem pergunta, onde pergunta, o que a IA ou o buscador usa para responder e o que precisamos ter. A coluna "Fase" liga à seção 17.

| # | Quem | Onde | Pergunta ou busca | O que a ferramenta usa | O que precisamos ter | Fase |
|---|---|---|---|---|---|---|
| 1 | Atacadista do Brás | ChatGPT | "melhor plataforma para vender no atacado" | Busca do ChatGPT e treino | `/loja-virtual-para/atacado`, dados abertos, consenso fora | S3, S4 |
| 2 | Atacadista do Brás | WhatsApp (Meta AI) | "como vender atacado pela internet" | Web aberta e Meta | Guia, perfil no Instagram e no Facebook completos | S6, S7 |
| 3 | Atacadista | Google | "loja virtual grade fechada" | Índice do Google | Página de atacado com tabela e FAQ | S4 |
| 4 | Atacadista | Google, Visão geral por IA | "plataforma atacado e varejo" | Índice e dados estruturados | Página de atacado com resposta nas 2 primeiras frases | S4 |
| 5 | Lojista na Nuvemshop | Google | "taxa nuvemshop" | Índice | `/loja-virtual-sem-taxa`, `/comparativo/nextlevel-x-nuvemshop` | S3 |
| 6 | Lojista na Nuvemshop | Perplexity | "alternativa à Nuvemshop mais barata" | Rastreador do Perplexity e fontes citadas | Comparativo com fonte, listas de terceiros | S3, S7 |
| 7 | Lojista na Nuvemshop | ChatGPT | "como migrar da Nuvemshop" | Busca do ChatGPT | `/migrar-da-nuvemshop` com `HowTo` | S5 |
| 8 | Quem vai começar | Gemini | "quanto custa abrir loja virtual" | Índice do Google e YouTube | `/quanto-custa-uma-loja-virtual`, vídeo 4 com legenda | S5, S7 |
| 9 | Quem vai começar | YouTube | "como criar loja virtual" | Busca do YouTube | Série com títulos e capítulos; Shorts | S7 |
| 10 | Quem vai começar | TikTok | "loja virtual barata" | Busca do TikTok | Cortes da série com legenda falada e escrita | S7 |
| 11 | Revendedora | Instagram | "como sair do direct" | Busca do Instagram | Cortes do vídeo 1, página `/para/quem-vende-no-instagram` | S4, S7 |
| 12 | Confecção | Google | "vender roupa no atacado online" | Índice | `/para/confeccao`, guia de atacado | S4, S6 |
| 13 | Importadora | ChatGPT | "plataforma para importadora vender para lojistas" | Busca e treino | `/para/importadora`, tema Galpão e Porto | S4 |
| 14 | Marca própria | Claude | "melhor plataforma para marca de roupa" | Busca do Claude | `/para/marca-propria`, temas premium, projeto exclusivo | S4 |
| 15 | Loja de cosméticos | Copilot | "plataforma para loja de cosméticos" | Índice do Bing | `/loja-virtual-para/beleza`, Bing verificado | S0, S4 |
| 16 | Loja de capinhas | Google | "loja virtual de capinha de celular" | Índice | `/loja-virtual-para/celular`, tema Órbita | S4 |
| 17 | Loja de camisas de time | Google | "loja virtual de camisa de time" | Índice | `/loja-virtual-para/esporte` | S4 |
| 18 | Loja de casa | Pinterest e Google Imagens | "decoração loja online" | Imagens | Sitemap de imagens com `alt` | S1 |
| 19 | Vendedor de marketplace | ChatGPT | "vale a pena sair da Shopee" | Busca | `/loja-propria-ou-marketplace` honesta | S3 |
| 20 | Quem desconfia | Google | "nextlevel e-commerce é confiável" | Índice, Reclame Aqui, perfil do Google | `/seguranca`, `/sobre`, Reclame Aqui respondido, avaliações reais | S5, S7 |
| 21 | Quem desconfia | ChatGPT | "a NextLevel é confiável?" | Busca e consenso | Mesmas fontes, entidade consistente | S5, S7 |
| 22 | Lojista da NextLevel | Google | "como configurar frete na nextlevel" | Índice | `/ajuda/configurar-frete` | S6 |
| 23 | Lojista da NextLevel | ChatGPT | "como cadastrar grade na NextLevel" | Busca | `/ajuda/cadastrar-grade` | S6 |
| 24 | Quem usa o Melhor Envio | Google | "loja virtual integrada melhor envio" | Índice e diretório do Melhor Envio | `/integracoes/melhor-envio`, listagem no diretório | S5, S7 |
| 25 | Quem usa ERP | Google | "loja virtual com Tiny" | Índice | `/integracoes/tiny` | S5 |
| 26 | Quem calcula preço | Google | "calculadora de preço de atacado" | Índice | `/ferramentas/preco-de-atacado` | S5 |
| 27 | Quem calcula margem | Google | "calculadora de margem de lucro" | Índice | `/ferramentas/margem` | S5 |
| 28 | Quem quer renda extra | Google | "programa de afiliados com comissão recorrente" | Índice | `/parceiros` com FAQ | S1 |
| 29 | Quem quer renda extra | ChatGPT | "como ganhar dinheiro indicando lojas" | Busca | `/parceiros/indique`, dados de programas de parceiros | S2, S3 |
| 30 | Agência | LinkedIn e Google | "plataforma para agência revender loja virtual" | Índice e LinkedIn | `/parceiros/agencias`, diretório de agências | S5 |
| 31 | Jornalista | Google | "custo de loja virtual no Brasil" | Índice | Relatório anual, `/imprensa` | S8 |
| 32 | Pesquisador ou blogueiro | Kaggle, Hugging Face, GitHub | "dataset e-commerce platforms Brazil" | Busca dessas plataformas | Dados abertos publicados lá | S2 |
| 33 | Quem pergunta em inglês | ChatGPT | "best ecommerce platform for wholesale in Brazil" | Busca | Página `/en` resumida (opcional, P3) | S8 |
| 34 | Quem vê a Black | Google | "black friday plataforma de loja virtual" | Índice | `/black-friday` com endereço fixo | S5 |
| 35 | Quem usa agente | ChatGPT (modo agente) | "crie uma loja virtual de roupas para mim" | Navegação do agente | Cadastro fácil para agente | S1 |
| 36 | Comprador final | Gemini e Google Shopping | "camiseta verde-musgo atacado" | Merchant Center | Feed das lojas dos lojistas | S9 |
| 37 | Comprador final | ChatGPT (compras) | "onde comprar X" | Programas de compra das IAs | Feed e protocolo de compra (quando houver no Brasil) | S9 |
| 38 | Usuário de GPTs | Loja de GPTs | "consultor de loja virtual" | Busca da loja de GPTs | GPT público | S8 |
| 39 | Usuário de Claude ou ChatGPT com ferramentas | MCP e apps | "simule o custo da minha loja" | Ferramenta MCP | Servidor MCP público | S10 |
| 40 | Quem pesquisa a marca no Maps | Google Maps | "loja virtual Brás" | Perfil da Empresa | Perfil completo com avaliações reais | S7 |

---

# Parte C · Como operar

## 15. Operação de conteúdo

### 15.1 Fonte única de fatos
`src/lib/seo/fatos.ts` (fatos da NextLevel) e os módulos de comparação (fatos dos concorrentes) alimentam, sem cópia manual:
- o site e o `llms.txt`;
- os espelhos `.md` e os dados abertos (site, GitHub, Hugging Face);
- o GPT público;
- as descrições do YouTube;
- os PDFs comerciais e da série;
- a base de conhecimento (tela Aprender, D264).

Mudou um preço? Muda em um lugar e se espalha.

### 15.2 Cadência
- **Toda semana:**
  - 1 página nova ou 1 guia;
  - 1 artigo de ajuda;
  - posts no Perfil da Empresa no Google;
  - cortes da série.
- **Todo mês:**
  - teste das 30 perguntas nas 5 IAs;
  - revisão das páginas com dado de concorrente;
  - relatório ao dono.
- **A cada 90 dias:** revisão de todas as páginas de comparação (data de consulta nova) e atualização dos dados abertos.
- **Todo ano:** relatório "Quanto custa vender online no Brasil".

### 15.3 Como escrever
- Português claro, como o lojista fala; frases curtas.
- Rascunho com IA é permitido, mas todo texto passa por revisão humana. Nenhum número vem da IA: os números vêm das fontes do item 15.1.
- Cada página nova tem um "dono do conteúdo" (quem revisa a cada 90 dias).

---

## 16. Medição

### 16.1 O que medir

| O que | Ferramenta | Frequência |
|---|---|---|
| Páginas indexadas, impressões, cliques, posição por termo | Google Search Console e Bing Webmaster | semanal |
| Visitas e cadastros vindos de busca | GA4 (I-01) e UTMs | semanal |
| Visitas vindas de IA | Origem `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`; `utm_source=chatgpt.com` | semanal |
| Cadastros vindos de IA | Origem do cadastro guardada no lead e no lojista (campo que já existe de origem, se houver; senão, estender) | semanal |
| Citação nas IAs | Teste mensal (16.2) | mensal |
| Visitas de robôs de IA | Contador por `user-agent` (16.3) | semanal |
| Velocidade | PageSpeed e dados reais do Search Console | mensal |
| Citações e links de fora | Search Console (links) e busca pela frase-padrão | mensal |

### 16.2 Teste mensal das IAs
- **Como:** as 30 perguntas da seção 6.3 feitas em ChatGPT, Gemini, Perplexity, Copilot e Claude, numa sessão anônima ou sem histórico.
- **O que registrar por pergunta e por IA:**
  - a NextLevel aparece?
  - em que posição?
  - o fato está certo?
  - quais concorrentes aparecem?
  - quais fontes foram citadas?
- **Indicador:** "presença em IA" é a porcentagem de respostas com a NextLevel citada corretamente, comparada com a de cada concorrente ("participação de voz").
- **Onde guardar:** planilha nos 3 primeiros meses. Depois, uma seção "Busca e IA" dentro da tela Crescimento do Master, sem painel novo.

### 16.3 Robôs de IA visitando o site
- No `src/proxy.ts` (sem custo de banco a cada visita), contar por dia as visitas de `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `Claude-SearchBot`, `Google-Extended` (nos logs do Google), `Bingbot`, `Applebot`, `meta-externalagent`.
- Guardar só o total por robô e por página, nunca dado pessoal.
- Mostra se as IAs estão lendo as páginas novas e quais páginas elas mais leem.

### 16.4 Engenharia reversa das fontes
Para cada pergunta da seção 6.3, anotar as fontes que o Perplexity e o ChatGPT citam. Essas são as páginas que precisamos:
1. superar com uma página melhor;
2. ou passar a fazer parte delas (contato com o autor, dado aberto, avaliação no site citado).

---

## 17. Fases, dependências e critérios de aceite

| Fase | Entrega | Depende de | Critério de aceite |
|---|---|---|---|
| **S0 · Domínio e base** | Seção 4 inteira (301, `APP_URL`, e-mail, Search Console e Bing com mudança de endereço); achados 1 a 7, 14, 15 e 17 corrigidos; tabela central de metadados; robots com robôs de IA; IndexNow | Domínio comprado; DNS; códigos de verificação | Teste do 301 (caminho, parâmetros, POST e `/api/*` sem redirecionar); teste sitemap igual à lista pública; teste sem descrição vencida; compra de teste de ponta a ponta no domínio novo; prints |
| **S1 · Dados estruturados e técnica** | JSON-LD em todas as páginas (8.2), sitemap de imagens, `lastmod` real, `fatos.ts`, cadastro pronto para agente, testes no CI | S0 | Zero erro no validador nas 15 páginas principais; testes de unidade do JSON-LD |
| **S2 · Arquivos para IA e dados abertos** | `/llms.txt`, `/llms-full.txt`, espelhos `.md`, `/dados` (JSON e CSV); script que publica no repositório público do GitHub; Hugging Face e Kaggle | S1; licença decidida | Teste: cada linha com fonte e data, números iguais aos do comparativo |
| **S3 · Comparar** | `/melhor-plataforma-de-loja-virtual`, `/comparativo/nextlevel-x-*` (5), `/loja-virtual-sem-taxa`, `/loja-propria-ou-marketplace` | S1 | Molde da seção 9; revisão do dono na primeira; prints em 360, 768 e 1440 px |
| **S4 · Para quem** | `/para-quem`, `/loja-virtual-para/*` (6), `/para/*` (6), `/loja-virtual-atacado-bras` | S3 | Idem; links no rodapé |
| **S5 · Empresa, custo, integrações e ferramentas** | `/sobre`, `/sobre/fundador`, `/equipe`, `/seguranca`, `/novidades`, `/imprensa`, `/black-friday`, `/quanto-custa-uma-loja-virtual`, `/migrar-da-*`, `/integracoes/*`, `/ferramentas/*` | S1; dados do dono para `/sobre` | Idem; `/sobre` com fotos reais aprovadas |
| **S6 · Aprender e ajuda** | `/guias` (12 a 20, um por semana), `/glossario`, `/perguntas`, `/ajuda` (a partir da base de conhecimento, só o que servir ao público) | S1 | Um guia por rodada; revisão do dono no primeiro |
| **S7 · Autoridade fora do site** | Checklist da seção 11 executado com o dono; legendas e descrições da série; kit para parceiros; selo nas lojas | Dono | Lista de perfis criados com link; frase-padrão igual em todos |
| **S8 · Medição e IAs** | Contador de robôs; origem "IA" nos cadastros; teste mensal; GPT público; página `/en` opcional; relatório anual | S2, S3 | Primeiro relatório mensal entregue |
| **S9 · Lojas dos lojistas** | SEO das lojas completo, feeds (Google, Microsoft, Meta, TikTok), check de busca no painel, vitrine de lojas | S1 | Teste de domínio do check; feed válido no Merchant Center |
| **S10 · IA que age** | Servidor MCP público (ferramentas abertas); depois, app no ChatGPT para o lojista | S2, S8 | Ferramentas respondem com os mesmos números do site; revisão de segurança (nenhum dado de lojista sem login) |

**Ordem:** S0 → S1 → S2 → S3 → S4 → S5 → S8 → S6 → S7 (em paralelo, com o dono) → S9 → S10.

---

## 18. O que depende do dono

1. **Domínio** `nextlevelcommerce.com.br` (comprando hoje) e, se quiser, as variações para proteger a marca. DNS apontado para o Render.
2. Se os **painéis** mudam para o domínio novo junto (recomendado) e o aviso aos lojistas e parceiros.
3. **Remetente de e-mail** no domínio novo (SPF, DKIM e DMARC no Resend).
4. Códigos de verificação do **Google Search Console** e do **Bing Webmaster**.
5. Contas e perfis: Perfil da Empresa no Google, LinkedIn, Reclame Aqui, sites de avaliação, Crunchbase, diretórios de integração, Hugging Face, Kaggle, GitHub (organização da empresa).
6. Dados do `/sobre`: endereço que pode ser público, CNPJ, fotos e texto do fundador.
7. **Licença dos dados abertos** (sugestão: CC BY 4.0).
8. Se o **preço dos temas premium** pode aparecer.
9. Liberar os **robôs de treino** de IA (recomendado).
10. Revisar a primeira página de cada tipo.
11. Acesso ao Planejador de Palavras-chave (conta Google Ads).
12. Se cria o **GPT público** na conta da empresa (ChatGPT Plus ou Business).

---

## 19. Riscos e proibições

- **Conteúdo em escala sem valor:** muitas páginas iguais trocando só nicho, cidade ou concorrente fazem o Google rebaixar o site inteiro. Cada página precisa de dado e texto próprios.
- **Troca de domínio mal feita:** sem 301, perde posição. Redirecionar POST e `/api/*` quebra os avisos de pagamento. Esquecer o e-mail manda tudo para o spam. A seção 4 cobre os três.
- **Propaganda comparativa:** só fatos verificáveis, com fonte e data, sem depreciar a marca do concorrente.
- **Dado vencido** é pior que nenhum: alerta aos 60 dias.
- **Avaliações:** nunca comprar, inventar ou trocar por desconto.
- **Comunidades:** sempre identificado; spam queima a marca e é removido.
- **Wikipédia:** não criar sem fontes independentes.
- **Dados abertos:** só dados públicos e nossos; nunca dado de cliente nem código do sistema.
- **MCP e app no ChatGPT:** nenhuma ferramenta pública mostra dado de lojista. As do lojista exigem login e passam pelas permissões do servidor (`requireRole`, `assertCanAccess`).
- **Nada de texto só para robô.**

---

## 20. Prompt mestre (colar numa sessão para desenvolver cada fase)

```
Você vai desenvolver a fase [S0..S10] do plano "Busca e IA: ser encontrado do Google ao ChatGPT".

LEIA ANTES (nesta ordem)
1. CLAUDE.md e AGENTS.md (pilha, comandos, regras, branch de publicação, base de conhecimento D264).
2. docs/prompts/busca-e-ia-visibilidade-organica.md inteiro, em especial: seção 3 (diagnóstico), 4 (domínio),
   5 (regras), a seção do conteúdo da sua fase (7 a 13) e a linha da sua fase na seção 17.
3. docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md.
4. O código que você vai estender: src/lib/brand.ts, src/proxy.ts, src/lib/base-url.ts, src/app/sitemap.ts,
   src/app/robots.ts, src/lib/seo-marca.ts, src/components/portal/json-ld.tsx, src/lib/storefront-seo.ts,
   src/app/(portal)/**, src/lib/marcas/comparativo-ecommerce.ts, src/lib/marcas/placar-seed.ts,
   src/lib/finance/captacao-regras.ts, src/lib/themes/catalog.ts, getPriceBook, getBrand().
5. node_modules/next/dist/docs/ para metadados, sitemap, robots e proxy desta versão do Next.js.

RELATE PRIMEIRO (antes de escrever código)
- Em até 12 linhas: o que existe, o que vai mudar, os arquivos, os testes, o que depende do dono e os riscos
  (na S0: avisos de pagamento, sessões e e-mail).
- Se a fase conflita com a seção 5 do plano ou com a Constituição, pare, explique e proponha a alternativa.

REGRAS
- Verdade com fonte e data: número de concorrente só dos módulos de comparação, com fonte e data na página.
- Fatos da NextLevel só de src/lib/seo/fatos.ts (crie na S1) e de getPriceBook; nunca digitados na página.
- Sem promessa de ganho; sem preço de serviço.
- Texto de marca por getBrand(); página com banco: export const dynamic = "force-dynamic".
- Uma página por intenção, com o molde da seção 9 (resposta em 2 frases, fatos com data, tabela em HTML,
  para quem é e para quem não é, FAQ, data de atualização, links para o núcleo).
- JSON-LD só com o que está visível; nunca AggregateRating ou Review sem avaliação real.
- Nada de texto escondido ou conteúdo diferente para robô.
- Acessibilidade AA, um h1, sem rolagem horizontal em 360 px.
- Anti-duplicação: estenda sitemapPaths, robotsPlan, JsonLd, as páginas e a base de conhecimento existentes.
- Na S0: o 301 vale só para GET; POST e /api/* nunca redirecionam; /r/ e /c/ continuam funcionando.

TESTES (mudança de comportamento sem teste não entra)
- S0: redirecionamento (caminho e parâmetros mantidos; POST e /api/* sem redirecionar); sitemap igual à lista
  pública; nenhum title/description repetido, vazio ou vencido; robots com os robôs de IA.
- S1: JSON-LD (tipos, campos obrigatórios, coerência com o texto visível).
- S2: dados abertos com fonte e consultado_em em cada linha e números iguais aos do comparativo; espelhos .md
  gerados das mesmas fontes.
- S3 a S6: cada página no sitemap, com canonical, FAQPage válido e fonte em cada número.
- S8: o contador de robôs não grava dado pessoal e não consulta o banco a cada visita.
- S10: nenhuma ferramenta pública devolve dado de lojista; as privadas exigem login e permissão.
- Durante o trabalho: npx tsc --noEmit, npx eslint src e2e tests e os testes dos arquivos mexidos; a bateria
  completa e o npm run build ficam para o fim da rodada.

VERIFICAÇÃO VISUAL E EXTERNA
- Prints reais (Playwright, Chromium em /opt/pw-browsers/chromium) em 360, 768 e 1440 px de cada página nova ou
  mudada; mande ao dono pelo menos um print da principal entrega.
- Depois do deploy: curl no robots.txt, sitemap.xml, llms.txt e nas páginas (title, description, canonical,
  JSON-LD no HTML publicado); na S0, curl do domínio antigo mostrando o 301 e uma compra de teste ponta a ponta.
- Validar o JSON-LD (validator.schema.org) e registrar o resultado.

FECHAMENTO
- Registre a decisão em docs/design/DECISIONS.md (próxima livre, título com "[E-commerce]"), cite-a na base de
  conhecimento (docs/conhecimento/BC0-INVENTARIO.md) e rode node scripts/gerar-novidades.mjs.
- Atualize a linha "Estado" deste plano e a linha dele em docs/prompts/README.md.
- Commit em português, git pull --rebase e push na branch de publicação; confira o site no ar.
- Relate ao dono em português simples: o que ficou pronto (com print), o que depende dele (seção 18) e a
  próxima fase.
```
