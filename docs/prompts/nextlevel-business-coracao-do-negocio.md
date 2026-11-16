# NextLevel Commerce com o gerenciador NextLevel Business: racional técnico e prompt engenheiro mestre

> **Status: EM ANDAMENTO.** Nome e organização decididos pelo dono (**D304**). **NB0 feita (D305, 13/11/2026):** inventário confirmado, linha de base registrada em `docs/relatorios/NB0-LINHA-DE-BASE-2026-11-13.md`, padrões da Parte 10 aceitos, **academia piloto confirmada** pelo dono (o portal sai da gaveta; o prompt detalhado do piloto chega em outra conversa e entra em `docs/prompts/portal-academia-piloto.md`). **NB1 feita (D306, 14/11/2026):** dois caminhos na home, no cadastro e no formulário assistido; `stores.formato` e `stores.fuso`; `src/lib/business/modulos.ts`; menu em quatro grupos; visão geral com o nome do gerenciador; vitrine do Site sem loja; tudo atrás de `BUSINESS_V1`. Ficaram para a NB2: criar conta no formato pelo Master e limpar carrinho e produtos da página inicial do Site; `/empresas` passou para a NB3. **NB2 feita (D307, 16/11/2026):** páginas livres do site no editor, Site → Páginas e Site → Serviços, seções Serviços, Contato e Trabalhos realizados, modelos Institucional e Academia, conta Site nascendo pronta. Próxima: **NB3**.
> **Decisão do dono (13/11/2026, D304):** a plataforma **continua NextLevel Commerce**. Na entrada, a pessoa escolhe o caminho: **Site** ou **Loja virtual**. Dentro do painel ficam as funções de cada situação (área Site, área Loja virtual) e um **gerenciador do negócio chamado NextLevel Business**, que agrupa tudo o que é do negócio em si, seja qual for o caminho escolhido (dia a dia, contatos e orçamentos, clientes, vendas, caixa, financeiro, captação, resultados). "NextLevel Business" é o nome dessa área do painel, não uma marca, domínio ou cadastro à parte.
> **O que o dono pediu (13/11/2026):** a NextLevel deixa de ser "só plataforma de loja virtual" e vira **o coração do negócio do cliente**. Quem entra escolhe entre dois caminhos (nomes finais na D304: **Site** e **Loja virtual**): **Site** (site institucional, página de campanha para a Meta em poucos cliques, captação paga e orgânica, contatos e orçamentos, painel do dia a dia, frente de caixa instalada no computador do negócio) e **Loja virtual** (o que já existe, com os planos atuais). "O que já temos na NextLevel Commerce é 80% do caminho; vale uma adaptação para elevar o nosso nível de segmento." Uma marca-mãe só (NextLevel, da NextLevel Marketing Ltda, D279), sem multiplicar marcas.
> **Origem:** documento "NextLevel Business — racional de produto e prompt mestre" (13/11/2026, enviado pelo dono), relido e ajustado ao código real e à visão acima. O que foi mantido, mudado ou retirado do original está na Parte 3.
> **Como usar:** as Partes 1 a 10 são o contrato técnico (o que existe, o que construir, regras e aceite). A **Parte 11** é o prompt para colar numa sessão de trabalho; ele manda executar **uma fase por vez** (NB0 a NB10) com a skill `desenvolver-prompt`.
> **Marcação:** **[fato]** = conferido no código em 13/11/2026 (caminho citado); **[decisão]** = padrão recomendado, vale se o dono não disser outra coisa (registrar em `DECISIONS.md`); **[hipótese]** = estimativa a medir; **[plataforma]** = regra de terceiros (Meta, Google, navegadores), conferir na documentação vigente no dia.

---

## Parte 0. Memória da conversa de origem (não perder)

> Esta parte guarda o racional da conversa em que o plano nasceu (13 a 16/11/2026), para qualquer sessão seguinte continuar sem refazer a conversa. **Leia antes de qualquer fase.**

### 0.1 Linha do tempo das decisões do dono
| Data | O que o dono disse | Onde ficou |
|---|---|---|
| 13/11 | Enviou o racional "NextLevel Business" (vidraçaria, academia, Meta). Pediu análise para incorporar sem dano, com marca forte num guarda-chuva só (como Meta → Meta Business), sem multiplicar marcas; NextLevel Marketing Ltda com quase 4 anos | Parte 3 (o que ficou, mudou ou saiu do racional original) |
| 13/11 | "Somos o coração do negócio do cara." Duas opções de entrada; captação paga e orgânica; dashboard do dia a dia; frente de caixa instalada no computador; site institucional; página de campanha da Meta em poucos cliques; "80% do caminho já está andado". Pesquisa no INPI fora | Partes 1, 2 e 5 |
| 13/11 | Pediu o prompt engenheiro mestre amplo e técnico em .md | Este arquivo |
| 13/11 | **Nome:** continua "NextLevel Commerce"; na entrada, caminho Site ou Loja virtual; dentro do painel, o gerenciador do negócio "NextLevel Business", agrupando o que é do negócio em si | **D304**, Partes 5.10 e 5.14 |
| 13/11 | "Pode seguir com a NB0." Já tem uma academia para o piloto do portal e vai detalhar em outra conversa | **D305**, `docs/prompts/portal-academia-piloto.md` |
| 14/11 | "Prossiga" (NB1) | **D306**, `docs/relatorios/NB1-2026-11-14.md` |
| 14/11 | **Pergunta em aberto:** "E se Business, sites e lojas virtuais forem 3 funções distintas, como produtos? Funções iniciais básicas e depois a contratação dessas três possibilidades?" | 0.2 abaixo (**aguarda a resposta do dono**) |
| 16/11 | "O que fizemos nessa seção não pode se perder de forma alguma." Pediu a análise das outras conversas e uma forma de manter o racional | Esta Parte 0 e a junção descrita em 0.3 |

### 0.2 Três produtos: **aprovado pelo dono em 16/11/2026 (D308)**
- **NextLevel Business (base):** painel do negócio (visão geral, clientes, atendimento, contatos e orçamentos, pedidos e vendas, financeiro, Maurício). Todo cliente começa aqui.
- **Site (contratação):** site da empresa, páginas de serviço e de campanha, domínio, formulário de orçamento.
- **Loja virtual (contratação):** catálogo, carrinho, Pix e cartão, temas, atacado.
- **Adicionais sobre qualquer combinação:** Caixa, Captação, Resultados da Meta, Portal do cliente.
- **Recomendação dada ao dono:**
  - sim, vendido em **pacotes**: Business; Business + Site; Business + Loja (= plano Commerce de hoje); Business + Site + Loja;
  - preços no Master;
  - lojistas atuais mantidos como "Business + Loja" sem mudança;
  - base com **teste grátis de poucos dias** (não grátis para sempre, por causa da meta de 10 pagantes).
- **Encaixe técnico (fato):** uma assinatura principal por conta (`nl_subscriptions_store_unique`) e adicionais por `entitlements` (já usado pelo checkout corporativo). Logo: a assinatura principal é o Business; Site e Loja entram como adicionais `modulo:site` e `modulo:loja`, que a regra `modulosDe` (NB1) já entende.
- **O que muda se aprovado:**
  - `formato` vira só o primeiro passo sugerido, e Site e Loja passam a vir só da contratação;
  - conta só com o Business ganha página pública simples (nome, contato, WhatsApp);
  - o menu ganha "Ligar site" além de "Ligar loja virtual";
  - a entrada vira "Comece pelo seu negócio" e, depois, "Quer um site? Quer uma loja?" (pode pular);
  - a NB8 (planos e contratação no painel) sobe para logo depois da NB3;
  - "NextLevel Business" passa a ser nome de produto vendido, e não só de área (ajusta a D304).
- **Ordem depois da aprovação:** NB3 (contatos e orçamentos) e, logo em seguida, NB8 (planos, pacotes e contratação de Site e Loja no painel).

### 0.3 Encaixe com o trabalho das outras conversas (junção de 16/11/2026)
As outras sessões publicaram na branch `claude/wonderful-cannon-5o38v5`, em paralelo, D295 a D303 e as migrações 0097 a 0100. As decisões desta conversa, que nasceram com os mesmos números, foram **renumeradas em duas junções**: primeiro para D302 a D304 e, como D302 (TR6) e D303 (Busca e IA) também foram usadas, para os números finais **D304 (nome e organização), D305 (NB0) e D306 (NB1)**. A migração `formato`/`fuso` ficou **0101**. Nada se perdeu dos dois lados.

| Trabalho das outras conversas | Como entra no NextLevel Business |
|---|---|
| **D295 TR4** (Pixel e Google no site da NextLevel, só com consentimento) e **D298 TR5** (retorno à Meta e ao Google pelo servidor, fila `conversoes_envio`) | NB4 (página de campanha do negócio) reaproveita o padrão de consentimento, o `eventID` igual entre navegador e servidor e a fila de envio, aplicados por loja. Não criar outro motor |
| **D299 Anúncios na Meta pelo painel do lojista** (diagnóstico, sala da campanha, Mesa de anúncios no Master, `anuncios_loja`) | Item "Anúncios na Meta" no grupo **NextLevel Business** do menu (feito na junção). NB4 liga a página de campanha à sala da campanha (o link pronto para os anúncios passa a poder apontar para uma página de campanha do Site). NB9 (resultados da Meta) = TR6 da D299: os números lançados à mão viram leitura automática |
| **D302 TR6** (leitura da Meta pela API, custo por cliente real e números automáticos na sala do lojista) | **Adianta a NB9:** a leitura de resultados da Meta por loja já existe para a sala da campanha. A NB9 passa a ser só mostrar esses números no NextLevel Business (visão geral e Captação) e cruzar com os contatos do Site, sem criar outra leitura |
| **D303 Busca e IA** ("Como nos conheceu?" no cadastro e no formulário, páginas que trouxeram clientes, robôs de IA, `llms.txt`) | O formulário de entrada já tem as duas perguntas: "O que você quer?" (Site ou Loja) e "Como você conheceu?". A NB5 (captação orgânica do negócio) reaproveita a mesma ideia de "páginas que trouxeram contatos" por loja |
| **D296/D297/D300/D301** (caixa de entrada no Master, suporte@ vira atendimento, linha do tempo do cliente) | É do Master (NextLevel), não do negócio do cliente. Serve de modelo para a NB3: os contatos do negócio também ganham linha do tempo; o e-mail do negócio fica para depois |

### 0.4 Como esta conversa protege o trabalho
- Tudo está na branch `ccr-ecbeafd1-sh4iy2` (enviada ao GitHub) e já foi juntado com a branch de publicação (16/11), pronto para publicar sem conflito quando o dono autorizar.
- Decisões em `docs/design/DECISIONS.md` (D304 a D306), citadas na base de conhecimento (`docs/conhecimento/BC0-INVENTARIO.md`) e em `CLAUDE.md` ("Organização (D304)").
- Relatórios com prints: `docs/relatorios/NB0-LINHA-DE-BASE-2026-11-13.md` e `docs/relatorios/NB1-2026-11-14.md`.
- **Regra para as próximas sessões:**
  - antes de criar decisão ou migração, puxar a branch de publicação e usar o próximo número livre;
  - outras conversas podem estar numerando ao mesmo tempo;
  - **a solução definitiva é publicar logo:** enquanto as decisões desta conversa ficarem só na branch `ccr-ecbeafd1-sh4iy2`, as outras sessões não as enxergam e reaproveitam os números.

---

## Parte 1. Resposta curta

1. **Não é um sistema novo nem uma marca nova.** É o mesmo motor (mesmo repositório, banco, deploy e Master), com o "negócio" do cliente como centro. A entidade `stores` já é, na prática, o negócio: empresa, equipe, domínio próprio, marca, WhatsApp, Pixel, integrações, plano e cobrança [fato, `src/db/schema.ts` `stores`]. Não se cria tabela `companies`.
2. **Dois caminhos na entrada, um painel só (D304).** A plataforma continua **NextLevel Commerce**. Na home e no cadastro a pessoa escolhe **Site** ou **Loja virtual**. Os dois criam o mesmo tipo de conta; o que muda é o **formato** inicial (site ou loja) e os **módulos** ligados. Ligar a loja depois, ou o site depois, não troca conta, domínio nem dados.
2a. **Dentro do painel, três camadas:** a área **NextLevel Business** (o gerenciador do negócio, igual para todos: dia a dia, contatos e orçamentos, clientes, vendas, caixa, financeiro, captação, resultados), a área **Site** (páginas, serviços, aparência, domínio) e a área **Loja virtual** (produtos, vitrine, cupons, temas, pós-venda), mais **Ajustes**. Cada área aparece conforme o que o negócio usa (Parte 5.14).
3. **Os módulos do negócio:** Site, Captação (páginas de campanha, origem dos contatos, Pixel), Contatos e orçamentos, Painel do dia, Caixa (frente de caixa), Loja virtual (o que existe) e, depois, Portal do cliente e Resultados da Meta. A liberação usa o que já existe: recursos por oferta (`src/lib/features.ts`) e direitos por negócio (`src/lib/domain/entitlements.ts`, `grantEntitlement`/`requireEntitlement`) [fato].
4. **Os 80% prontos:** conta e equipe, domínio próprio, editor de temas com rascunho/prévia/histórico, seções, mídia, CRM do lojista, propostas com link público, Pixel e API de conversões por loja, regra única de canal, links rastreados, origem do contato, aviso de cookies, venda manual, caixa do Master (padrão de abertura e fechamento), login do cliente final por código, fila do dia, IA do painel, catálogo de planos no Master.
5. **Os 20% que dão a cara do Business:** (a) **páginas livres** no editor (Sobre, Serviços, Contato, página de campanha), porque hoje o editor só tem `home`, `product`, `collection` e `cart` [fato, `src/lib/themes/types.ts` `PAGE_KINDS`]; (b) **formulário de orçamento** e **caixa de contatos** do negócio; (c) **montador de página de campanha** em poucos cliques, já com link rastreado e Pixel; (d) **frente de caixa de verdade** (o "Balcão (ponto de venda)" está como **"em breve"** em `src/lib/domain/aplicativos.ts` [fato]; hoje só existe o "Novo pedido" manual); (e) **painel instalável no computador**.
6. **Fica para depois, com gatilho claro:** portal do cliente (academia e reservas) só com piloto real; ler resultados da Meta só depois da aprovação do aplicativo pela Meta (e reaproveitando a fase TR6/TR9 de `trafego-campanhas-meta-google-reels.md`, sem duplicar); criar/pausar campanhas, várias unidades e delegação para agência fora da oferta.
7. **Ordem:** NB0 diagnóstico → NB1 dois caminhos, formato "site" e menu com o NextLevel Business → NB2 páginas do site → NB3 contatos e orçamentos → NB4 captação paga (página de campanha) → NB5 captação orgânica → NB6 painel do dia → NB7 caixa e painel instalável → NB8 planos e upgrade → NB9 resultados da Meta → NB10 portal do cliente. Cada fase entrega valor sozinha e não toca checkout, pagamentos ou pedidos das lojas atuais.

---

## Parte 2. A tese: o coração do negócio

### 2.1 Do "plataforma de loja" para "sistema do negócio"
| Hoje | Depois |
|---|---|
| Quem entra só vê planos de loja virtual | Quem entra escolhe o caminho (Site ou Loja virtual) pelo que o negócio precisa |
| Uma vidraçaria, academia, clínica, escritório ou prestador não tem lugar | Esses negócios entram pelo caminho "Site" |
| Captação (links, origem, tempo real) só existe para a própria NextLevel | A mesma captação passa a servir o negócio do cliente |
| Venda no balcão = "Novo pedido" manual | Frente de caixa com abertura, fechamento, formas de pagamento e recibo, instalável no computador |
| O lojista só vê o que é da loja | O dono vê o dia do negócio: contatos, orçamentos, caixa, vendas, visitas |

### 2.2 Os dois caminhos (D304)
- **Site:** "Site profissional para sua empresa, páginas para seus anúncios e todos os seus contatos num painel só. Com caixa para o balcão, se você precisar."
- **Loja virtual:** os planos de hoje (Start, Pro, Scale; preços do catálogo do Master, nunca fixos no texto).
- Nos dois casos, o painel traz o **NextLevel Business**, o gerenciador do negócio. Na página pública ele aparece como benefício comum ("em qualquer caminho, você gerencia o seu negócio no NextLevel Business"), não como produto separado.
- Os dois levam ao mesmo cadastro (`/cadastro`), com o parâmetro `para=site|loja`. A escolha define o formato inicial e a página de boas-vindas; não fecha caminho nenhum.

### 2.3 Módulos (o que cada negócio liga)
| Módulo | Para quem | Entrega | Base existente |
|---|---|---|---|
| Site | Todos | Páginas institucionais, serviços, contato, domínio próprio | Editor de temas, `customDomain`, `storefront-seo.ts`, `sitemap.xml` da loja |
| Captação | Todos | Página de campanha em poucos cliques, links rastreados, Pixel e conversões, origem do contato, WhatsApp com código | `src/lib/trafego/*`, `links_rastreados`, `origens_contato`, `pixel-meta.tsx`, `src/lib/payments/meta-capi.ts` |
| Contatos e orçamentos | Todos | Caixa de contatos com responsável, situação, primeira resposta, orçamento enviado, fechou/perdeu | `crm-loja.ts`, `crm_acompanhamento` (marca `LOJA:<storeId>`), `proposals.ts` |
| Painel do dia | Todos | "Agora" do negócio: o que precisa de você, números de hoje | `fila-do-dia.ts`, `loja-agora.ts`, `visitas.ts` |
| Caixa | Quem tem balcão | Abrir/fechar caixa, venda rápida, formas de pagamento, sangria/suprimento, recibo, leitor de código de barras | `orders` (canal `MANUAL`), `createOrder`, padrão do caixa do Master `src/lib/domain/caixa.ts` |
| Loja virtual | Quem vende online | O que existe hoje | Todo o Commerce |
| Resultados da Meta | Quem anuncia | Gasto, resultados e custo por contato real | Fase TR6/TR9 do prompt de tráfego |
| Portal do cliente | Academia e afins | Login do cliente, grade, reserva, cancelamento | `conta-cliente.ts` (login por código por loja) |

---

## Parte 3. Leitura do racional original: o que fica, o que muda, o que sai

| Ponto do documento original | Decisão | Motivo |
|---|---|---|
| Duas ofertas sobre uma base comum (site + painel; site + painel + portal) | **Muda:** vira "dois caminhos" (Site e Loja virtual), o gerenciador NextLevel Business dentro do painel e módulos; o portal é um módulo entre outros | Visão do dono: o negócio escolhe o que precisa |
| Vidraçaria como primeiro piloto | **Fica** | Jornada mais simples: página, orçamento, retorno |
| Academia com portal de reservas | **Adiada (NB10)**, especificação guardada no Anexo A | Mais cara e arriscada (novo tipo de acesso, vagas concorrentes); só com cliente real |
| "Acompanhe" e não "gerencie" anúncios enquanto só houver leitura | **Fica** como regra de texto | Não prometer o que não existe |
| Separar formulário, clique no WhatsApp e conversa confirmada | **Fica**, e usa o código da visita (TR3, D294) | Já resolvido para a NextLevel; vai para o negócio |
| Atribuição no envio do formulário, "sem atribuição" quando faltar | **Fica**, com a regra das lojas sem cookie (D185) | Ver 5.6 |
| Custo por contato só com campanha, moeda, período e janela compatíveis e ao menos um contato | **Fica** | Credibilidade |
| Estados explícitos ("nenhum contato", "conta desconectada", "dados desatualizados"…) | **Fica** e vira critério de aceite de toda tela nova | |
| Tempo até a primeira resposta e % respondidos | **Fica** e ganha destaque no painel do dia | Indicador simples e vendável |
| "O cliente encontra, assume e responde sem chamar a NextLevel" | **Fica** e vira indicador no Master | É o que segura a mensalidade |
| Entrada autônoma ou assistida, setup avulso, gestão de tráfego e verba separadas | **Fica**; a gestão de tráfego é serviço da agência (`nextlevelgroup.com.br`, D287) | O Business alimenta as duas frentes |
| Diagnóstico grande ("verificar se existe editor, permissões…") | **Muda:** o diagnóstico já foi feito aqui (Parte 4); a NB0 só confirma e mede a linha de base | Eficiência |
| Comparar "módulo" com "aplicação irmã" | **Decidido: módulo** | Regra anti-duplicação (CLAUDE.md) e um Render só |
| Escrita na Meta, várias unidades, delegação para agência | **Sai da oferta** (fica só como visão) | Sem validação nem demanda ainda |
| Domínio e registro de marca | **Sai deste plano** (pedido do dono) | Foco no desenvolvimento |
| **Novo (dono):** frente de caixa instalada no computador | **Entra (NB7)** | |
| **Novo (dono):** página de campanha da Meta "em poucos cliques" | **Entra (NB4)** | |
| **Novo (dono):** captação orgânica | **Entra (NB5)** | |
| **Novo (dono):** dois caminhos na entrada e gerenciador do negócio no painel | **Entra (NB1)** | |

---

## Parte 4. Inventário: o que já existe (estenda, não duplique)

| Peça | Onde [fato] | Uso no Business | Ação |
|---|---|---|---|
| Negócio (tenant) | `stores` (`organizationId`, `slug`, `customDomain`, `logoUrl`, `primaryColor`, `accentColor`, `whatsapp`, `instagram`, `legalName`, `cnpj`, `address`, `contactEmail`, `metaPixelId`, `metaCapiTokenEnc`, `integrations`, `launchMode`) | É o negócio | Reusar; somar coluna `formato` (5.1) |
| Criação da conta | `src/lib/domain/provisioning.ts` (`createStore`, `createStoreSchema`); `src/app/cadastro/*` (`signup-form.tsx`, `checkout-ec.tsx`) | Cadastro dos dois caminhos | Adaptar |
| Recursos por oferta | `src/lib/features.ts` (`FEATURES`, `OFFER_FEATURES`, `canUse`, `minOfferFor`, "bloqueado aparece com cadeado") | Liberar menus | Estender com chaves do Business |
| Direitos por negócio | `src/lib/domain/entitlements.ts` (`tenantOf`, `activeEntitlementKeys`, `hasEntitlement`, `requireEntitlement`, `grantEntitlement` com `source: ADD_ON/COURTESY/PLAN`) | Ligar módulo por plano, adicional ou cortesia | Reusar como fonte dos módulos |
| Planos da Commerce | `src/lib/domain/commerce-plans.ts` (`COMMERCE_PLAN_KEYS`, `nl_subscriptions`, preço congelado), `src/lib/domain/nl-catalog.ts` (catálogo do Master) | Planos do Business | Somar itens de catálogo |
| Menu do lojista | `src/lib/nav.ts` (menu "Escritório/Crescer/Loja e ajustes" a partir da linha ~232) | Menu por módulo | Adaptar |
| Painel inicial | Commerce: `src/components/commerce/commerce-home.tsx` ("Visão geral da loja", linha ~101); `src/app/merchant/page.tsx` é a versão SuperDrop ("SuperDrop / Minha operação", linha ~93, só aparece nessa marca; conferido na NB0, não é vazamento na Commerce); `src/lib/domain/fila-do-dia.ts` (`filaDoLojista`, `pulsoDaLoja`); `src/lib/domain/loja-agora.ts` | Painel do dia | Adaptar e corrigir rótulo |
| Editor de temas | `src/lib/themes/types.ts` (`PAGE_KINDS = home, product, collection, cart`; `Template = { v, sections, order }`; `LIMITS`); `theme_templates` (PK `storeId+page`, `draft`/`published`/`revision`); `theme_template_versions`; `theme_saved_templates` (`kind: section/page`); `src/components/theme-editor/*`; `src/app/actions/theme.ts`; `src/lib/themes/template.ts`, `store.ts`, `policy.ts`, `license.ts` | Páginas do site e de campanha | Estender para páginas livres |
| Seções existentes | `src/lib/themes/sections.ts` (hero, image-with-text, rich-text, faq, testimonials, steps, cta-banner, video, store-about, trust-bar, whatsapp-float, countdown, slideshow, banners…) | Montar páginas institucionais | Reusar; somar 4 seções (5.3) |
| Renderização da loja | `src/components/storefront/store-page.tsx`, `src/components/storefront/sections/*`, `src/app/store/[slug]/*` | Mostrar páginas | Estender |
| Endereço desconhecido | `src/app/store/[slug]/[...resto]/page.tsx` (redireciona endereço antigo, D187; senão 404) | Encaixe das páginas livres | Consultar páginas antes de redirecionar |
| SEO da loja | `src/lib/storefront-seo.ts`, `src/app/store/[slug]/sitemap.xml`, `robots.txt` | SEO local | Estender |
| CRM do lojista | `src/lib/domain/crm-loja.ts` (`ETAPAS_LOJA`, `clientesDaLoja`, `fichaClienteLoja`, `salvarAcompanhamentoLoja`, `marcaDaLoja = LOJA:<storeId>`, `filaExtraDaLoja`); `src/app/merchant/crm/*`; `src/app/actions/crm-loja.ts` | Contatos do negócio | Estender (compradores + contatos) |
| Acompanhamento e origem | `crm_acompanhamento` (responsável, próxima ação, prazo, perdido/motivo, fechou/valor), `origens_contato` (canal, UTMs, click ids, primeiro toque, cidade, aparelho, código da visita; coluna `brand`) | Responsável, fechou/perdeu, origem | Reusar com `brand = LOJA:<storeId>` |
| Propostas | `src/lib/domain/proposals.ts` (`createProposal`, `getPublicProposal`, `acceptProposal`); `src/app/merchant/orders/propostas`; `src/app/store/[slug]/proposta` | "Orçamento enviado" | Reusar; somar item avulso (serviço sem produto) |
| Canal e consentimento | `src/lib/trafego/canal.ts` (`canalDe`, `CANAIS`, `CLICK_IDS`, `ehCanalPago`, `ehRobo`), `consentimento.ts` (`nl-consent`, `podeMedir`, `podeAnunciar`), `lead-na-sessao.ts` (`registrarOrigemDaVisita`), `dispositivo.ts`, `geo.ts` | Origem do contato do negócio | Reusar funções puras; não gravar cookie nas lojas (D185) |
| Links rastreados | `links_rastreados`, `links_cliques_diarios`, rota `/l/<codigo>` (D290) | Link da campanha do negócio | Estender com `storeId` |
| Visitas das lojas | `src/lib/domain/visitas.ts` (`registrarVisita`, `resumoDeVisitas`, `origemDe`, `aparelhoDe`; sem cookie) | Visitas do site | Reusar |
| Pixel e conversões | `stores.metaPixelId`, `metaCapiTokenEnc`; `src/components/storefront/pixel-meta.tsx`, `integracoes-loja.tsx`; `src/lib/payments/meta-capi.ts` (Purchase com `event_id`) | Evento `Lead` | Estender para `Lead`/`Contact` |
| Venda manual | `orders.channel` (`ONLINE_STORE`, `WHATSAPP`, `INSTAGRAM`, `MANUAL`); `src/app/merchant/orders/new` ("Venda manual: WhatsApp, Instagram ou balcão") | Base do caixa | Somar canal `BALCAO` |
| Caixa do Master | `src/lib/domain/caixa.ts` (`abrirCaixa`, `lancar`, `editarLancamento`, `estornarLancamento`, `fecharCaixa`, `reabrirCaixa`, `caixaDoDia`; só Master, `podeOperarCaixa`) | Padrão de regras do caixa do negócio | Copiar o padrão de regras, **não** a tabela (é do caixa da NextLevel) |
| Login do cliente final | `src/lib/domain/conta-cliente.ts` (cookie `nl-cliente`, código por e-mail, sessão por loja); `src/app/store/[slug]/conta` | Portal (NB10) | Reusar depois |
| Central de aplicativos | `src/lib/domain/aplicativos.ts` (balcão "em breve") | Mostrar o Caixa como disponível | Atualizar estado |
| IA do painel | `src/app/merchant/ia`, `src/lib/domain/ia.ts`, `ia-por-plano.ts` | Sugerir texto da página de campanha | Reusar (respeitando o plano) |
| Instalação | `src/app/layout.tsx` (manifesto só para EC e Club, na página pública) | Painel instalável | Somar manifesto do painel |
| Nome e marca | `src/lib/brand.ts` (`NEXTLEVEL_COMMERCE`), `src/lib/marcas/nextlevel-ecommerce.ts` (`EC`) | Textos | Nunca fixar nome; ver 5.10 |
| Fiscal | `src/lib/domain/fiscal/meu-contador.ts` (só o Meu Contador) | **Não há NFC-e** | Fora da v1 do caixa |
| Código de barras | Nenhum campo `gtin`/`ean`/`barcode` em produtos [fato, grep em `schema.ts`] | Leitor no caixa | Somar coluna (NB7) |

---

## Parte 5. Arquitetura alvo

### 5.1 Formato do negócio [decisão]
- Coluna nova `stores.formato text enum ["LOJA","SITE"] not null default "LOJA"`. Migração aditiva: todas as contas atuais ficam `LOJA` e nada muda para elas.
- `formato` decide **só a vitrine pública e a primeira tela**: `SITE` → a raiz do domínio mostra a página inicial do site; rotas de catálogo, carrinho e checkout (`catalog`, `cart`, `carrinho`, `checkout`, `product`, `feed.xml`) respondem 404 enquanto o módulo Loja estiver desligado. `LOJA` → como hoje.
- **Módulos ≠ formato.** Um negócio `SITE` pode ligar a Loja depois (vira `LOJA` com as páginas do site preservadas); um negócio `LOJA` pode usar páginas livres, formulário e caixa.
- Função única `src/lib/business/modulos.ts`:
  - `MODULOS = ["site","captacao","contatos","painel","caixa","loja","meta","portal"] as const`;
  - `modulosDoNegocio(db, storeId, agora)`, que junta o plano (`nl_subscriptions`/oferta), os direitos (`activeEntitlementKeys`) e o formato;
  - `requireModulo(db, actor, modulo)` no servidor (lança `ForbiddenError` com texto de upgrade);
  - `podeVerModulo` para o menu. Telas e ações consultam **só** daqui.
- Ligar e desligar módulo é reversível e auditado (`recordFinancialAudit`/`audit.ts`, conforme o padrão do item).

### 5.2 Páginas livres do site [decisão]
- `theme_templates` tem chave `storeId+page` com `page` fixa, por isso **não serve** para N páginas. Tabela nova `paginas_site`:
  - `id`, `storeId` (FK), `slug` (único por loja; regex do projeto; reservados: `catalog`, `cart`, `carrinho`, `checkout`, `product`, `conta`, `order`, `acompanhar`, `proposta`, `p`, `l`, `api`);
  - `tipo enum ["INSTITUCIONAL","SERVICO","CONTATO","CAMPANHA","LIVRE"]`, `titulo`;
  - `draft jsonb Template|null`, `published jsonb Template|null`, `revision int`;
  - `seoTitulo`, `seoDescricao`, `indexar bool` (padrão: `true`; `CAMPANHA` padrão `false`);
  - `objetivo enum ["ORCAMENTO","WHATSAPP","CADASTRO","PRODUTO"]|null`, `servicoId|null`;
  - `publicadaEm`, `arquivadaEm`, `createdBy`, `createdAt`, `updatedAt`;
  - índice `(storeId, slug)` único.
- Histórico em `theme_template_versions` com `page = "pagina:<id>"` (a coluna já é texto livre) [fato]. Modelos salvos em `theme_saved_templates` (`kind: "page"`) [fato].
- **Editor:** generalizar o alvo de edição de `PageKind` para `AlvoEdicao = { tipo: "fixa"; page: PageKind } | { tipo: "livre"; paginaId: string }` em `src/lib/themes/editor-state.ts`, `src/app/actions/theme.ts` e `src/components/theme-editor/*`. Mesmo rascunho, mesma prévia, mesma publicação, mesmo controle de revisão (duas abas não se sobrescrevem).
- **Rotas públicas:** `/store/[slug]/p/[pagina]` e, no domínio próprio, `/<pagina>` resolvido em `[...resto]/page.tsx`, nesta ordem:
  1. página publicada com esse slug;
  2. redirecionamento antigo (D187);
  3. 404.

  Nunca sobrepor uma rota existente. Página com `force-dynamic` (consulta o banco).
- **Menu do site:** os grupos globais (`theme_globals`, cabeçalho e rodapé) ganham itens que apontam para páginas livres (seletor de página no editor de menu).

### 5.3 Seções novas (mínimo necessário)
| Seção | Uso | Regras |
|---|---|---|
| `lead-form` (Formulário de orçamento) | Contato, serviço, campanha | Campos configuráveis dentro de uma lista fechada (nome, WhatsApp, e-mail, serviço, cidade/bairro, mensagem, melhor horário); obrigatórios mínimos: nome + (WhatsApp ou e-mail); aviso de privacidade com link; envia para a ação do servidor (5.4) |
| `services-grid` (Serviços) | Lista de serviços do negócio | Lê `servicos_negocio`; cada cartão leva à página do serviço ou ao formulário com o serviço já escolhido |
| `contact-info` (Endereço, horário e mapa) | Contato e SEO local | Endereço da loja, horário por dia, link de rota (sem incorporar mapa de terceiros sem consentimento; link externo simples) |
| `before-after` (Antes e depois / galeria de trabalhos) | Prova de serviço | Imagens da mídia da loja (`store_assets`), texto alternativo obrigatório |

Reaproveitar `faq`, `testimonials` (só depoimento real, regra D283), `steps`, `cta-banner`, `whatsapp-float`, `hero*`, `image-with-text`, `rich-text`, `video`.

### 5.4 Serviços, contatos e orçamentos [decisão]
- **Serviços:** tabela nova `servicos_negocio`:
  - `id`, `storeId`, `nome`, `slug`, `resumo`, `descricao`, `imagemUrl`;
  - `precoAPartirCents|null` (null = "sob orçamento"), `ativo`, `ordem`.
  - Não usar `products`: produto carrega estoque, frete, checkout, feed do Google e catálogo da Central. Não usar `services`: é o catálogo de serviços **da NextLevel** [fato, `schema.ts` ~938].
- **Pedido de contato:** tabela nova `contatos_negocio`:
  - `id`, `storeId`;
  - `nome`, `whatsapp`, `email` (dados pessoais; nunca em log), `servicoId|null`, `mensagem`, `campos jsonb`;
  - `paginaId|null`, `via enum ["FORMULARIO","WHATSAPP_CONFIRMADO","MANUAL","CAIXA"]`;
  - `situacao enum ["NOVO","EM_ATENDIMENTO","ORCAMENTO_ENVIADO","GANHO","PERDIDO"]`;
  - `responsavelId|null`, `primeiraRespostaEm|null`, `propostaId|null`, `chaveEnvio` (idempotência), `consentimentoVersao`, `criadoEm`, `atualizadoEm`;
  - índice único `(storeId, chaveEnvio)`; índices `(storeId, situacao, criadoEm)`.
- **Reuso obrigatório:**
  - responsável, próxima ação, prazo, notas, perdido/motivo e fechou/valor ficam em `crm_acompanhamento` com `chave = "contato:<id>"` e `brand = marcaDaLoja(storeId)` [fato: o CRM do lojista já usa `LOJA:<storeId>`];
  - a origem fica em `origens_contato` com a mesma chave e `brand = LOJA:<storeId>`;
  - a lista "Clientes" do lojista (`clientesDaLoja`) passa a juntar compradores e contatos, com filtro por tipo.
- **Envio do formulário** (`src/lib/domain/business/contatos.ts` → `registrarContato`, chamado por ação em `src/app/actions/business-contatos.ts` via `runAction`):
  1. Zod no servidor. Loja resolvida pelo **host/slug no servidor**, nunca por id vindo do navegador.
  2. Idempotência: `chaveEnvio` gerada no navegador ao montar o formulário (uuid), reenviada em repetição técnica. Mesma chave = mesmo contato (devolve o existente). Envio legítimo novo = chave nova.
  3. Antiabuso proporcional: campo-isca escondido, tempo mínimo de preenchimento (≥ 3 s), limite por loja + impressão do endereço em memória (ex.: 5 envios/10 min, sem guardar IP), tamanho máximo dos campos, sem links na mensagem acima de N.
  4. Origem (5.6) gravada com `registrarOrigemDaVisita` (adaptado para receber os dados do envio, sem sessão de cookie).
  5. Aviso ao negócio: e-mail (`src/lib/email.ts`, marca da loja), item na fila do dia e notificação no painel. Nunca enviar o conteúdo do contato para terceiros.
  6. Evento `Lead` para a Meta (5.7) só com consentimento.
- **Situação e primeira resposta:** a primeira mudança de `NOVO` para outra situação, ou o primeiro clique em "Responder no WhatsApp" pela ficha, grava `primeiraRespostaEm` (uma vez).
- **Orçamento:** "Enviar orçamento" na ficha cria proposta (`createProposal`) com **item avulso** (descrição + valor em centavos, sem produto). Isso exige estender `proposals.ts`/`priceLines` com linha avulsa validada no servidor, sem afetar as propostas de produto existentes (teste de regressão). A situação passa a `ORCAMENTO_ENVIADO`; aceitar a proposta marca `GANHO` com o valor.

### 5.5 Caixa de contatos (tela)
- `src/app/merchant/contatos` (lista com filtros por situação, serviço, origem/canal, responsável e período; contagem por situação no topo) e `src/app/merchant/contatos/[id]` (ficha com dados, origem "De onde veio", linha do tempo, responsável, situação, orçamento, WhatsApp com mensagem pronta, fechou/perdeu com motivo).
- Estados vazios com próxima ação: "Nenhum contato ainda → publique o formulário na sua página" (atalho para o editor).
- Quem vê: dono e equipe da loja com permissão (`store-team.ts`); o cliente final nunca.
- Exportar CSV só da própria loja, com registro em auditoria.

### 5.6 Origem e atribuição no site do negócio
- **Regra D185 continua:** o site/loja do lojista **não grava cookie de medição da NextLevel**. A origem do contato vem do que existe **no momento do envio**:
  - os parâmetros da página atual (`utm_*`, `fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`);
  - o `document.referrer`;
  - a página do formulário.

  Tudo é enviado junto com o formulário e classificado no servidor por `canalDe` [fato].
- Se o visitante navegou antes de enviar, os parâmetros da entrada são guardados em `sessionStorage` **só** quando o aviso de cookies da loja permitir medição (5.7). Sem permissão, vale só o que está na página atual. Faltou informação → canal `direto`/"sem atribuição". Nunca inventar campanha.
- Testes obrigatórios de atribuição:
  - acesso direto;
  - campanha completa (`utm_source=facebook&utm_medium=paid&utm_campaign=x&fbclid=…`);
  - UTM incompleta;
  - reenvio idempotente;
  - navegação entre páginas com e sem consentimento;
  - link rastreado do negócio.
- **WhatsApp com código:**
  - o botão do site (seção `whatsapp-float` e CTAs) gera um código de 5 caracteres (mesmo alfabeto da TR3, sem 0/O/1/I/L) e grava `cliques_whatsapp_negocio` (`storeId`, `codigo`, `pagina`, canal e UTMs da página, `criadoEm`; sem dado pessoal; guarda 90 dias);
  - a mensagem pronta leva "(código XXXXX)";
  - na caixa de contatos, "Registrar conversa do WhatsApp" pede nome, telefone e código e cria `contatos_negocio` com `via = WHATSAPP_CONFIRMADO` e a origem do clique;
  - o clique sozinho conta só como **intenção** (número no painel), nunca como contato.

### 5.7 Captação paga: página de campanha em poucos cliques
- **Assistente** `src/app/merchant/captacao/nova` em 4 passos:
  1. **Objetivo:** receber orçamento, chamar no WhatsApp, cadastro (lista de espera) ou vender produto (só com módulo Loja).
  2. **O que anunciar:** um serviço de `servicos_negocio` ou um produto.
  3. **Conteúdo pronto:** o sistema monta a página a partir de um modelo por objetivo (`src/lib/business/modelos-campanha.ts`, `Template` com seções 5.3), preenchido com logo, cores, nome, serviço, endereço, WhatsApp, fotos da mídia e perguntas frequentes. Botão opcional "Sugerir textos com a IA" (`ia-por-plano.ts`; sem promessa de ganho; o dono revisa).
  4. **Publicar e levar ao anúncio:** a página nasce `CAMPANHA`, `indexar=false`. O sistema entrega:
     - o **link rastreado** do negócio: `links_rastreados` com `storeId` nullable novo, código próprio, destino só dentro do próprio site, UTMs no padrão de nomes da D290 e, para a Meta, a sugestão de parâmetros de URL dinâmicos [plataforma: conferir os parâmetros vigentes no Gerenciador];
     - o QR code;
     - o botão "Copiar para o Gerenciador de Anúncios".
- **Meta:**
  - Pixel do negócio (`stores.metaPixelId`) com `PageView` e `Lead` (no envio aceito, `event_id = contato:<id>`) e `Contact` (clique no WhatsApp, `event_id = codigo`);
  - API de conversões: estender `src/lib/payments/meta-capi.ts` com `enviarLeadMeta` (mesmo padrão: SHA-256 de e-mail/telefone, `timeoutSignal`, nunca lança, sem dado em log), usando o `event_id` do navegador para não contar duas vezes;
  - **tudo só com "anúncios = sim" no aviso de cookies da loja.**
- **Aviso de cookies no site do negócio:** reaproveitar o componente do aviso da NextLevel (D290) com o nome e a política da loja, exibido **somente** quando o negócio liga Pixel/medição de anúncios. Sem Pixel, não há aviso nem cookie (D185).
- Lista "Minhas campanhas" (`src/app/merchant/captacao`): páginas de campanha, link, cliques (de `links_cliques_diarios`), contatos por página e por campanha, % de contato, situação dos contatos. **Custo por contato só na NB9**, com os critérios da Parte 3.

### 5.8 Captação orgânica
- SEO local por negócio em `storefront-seo.ts`:
  - `LocalBusiness` (ou subtipo escolhido numa lista fechada) com nome, endereço, telefone, horário, área atendida, serviços (`Service`), `sameAs` com Instagram e perfil do Google quando informados;
  - `FAQPage` igual ao texto visível da seção `faq`;
  - título e descrição por página (`paginas_site.seo*`), canonical e prévia de link.
- `sitemap.xml` da loja inclui as páginas livres indexáveis com data real de publicação; páginas `CAMPANHA` ficam fora.
- **Lista de tarefas orgânicas** no painel ("Seja encontrado"):
  - perfil da empresa no Google com o link do site (campo `integrations.perfilGoogle`);
  - Search Console (o ID de verificação já é configuração da Rodada A, D189);
  - uma página por serviço;
  - perguntas frequentes;
  - fotos com texto alternativo;
  - avaliações reais;
  - link na bio do Instagram (link rastreado `bio`).

  Cada item marca feito pelos dados reais, nunca por clique do usuário.
- Avisar mecanismos de busca (IndexNow) ao publicar página do domínio próprio só se a chave por domínio for viável [hipótese; conferir na NB5]; senão, fica fora.

### 5.9 Painel do dia do negócio
- `filaDoNegocio` em `src/lib/domain/fila-do-dia.ts` (função pura e testada), somada à fila atual (`filaDoLojista`) conforme os módulos:
  - contatos novos sem resposta (mais antigo primeiro);
  - orçamentos enviados sem retorno há X dias (configurável em `platform_settings`);
  - caixa aberto de ontem sem fechamento;
  - pedidos parados (se Loja);
  - página de campanha sem contato em 7 dias com cliques.
- **Números de hoje e 7 dias:**
  - contatos (por canal);
  - tempo mediano até a primeira resposta;
  - % respondidos em até 1 h;
  - orçamentos enviados e ganhos (valor em centavos);
  - vendas do caixa (por forma de pagamento);
  - visitas do site (`resumoDeVisitas`);
  - cliques no WhatsApp (intenção).
- Cabeçalho da visão geral da Commerce (`commerce-home.tsx`): "Visão geral da loja" passa a "NextLevel Business · Visão geral do negócio" (com `NOME_GERENCIADOR`); para formato `SITE`, os selos "Loja publicada" e "Falta 1 item para vender" viram "Site publicado" e "Contatos novos". A versão SuperDrop (`src/app/merchant/page.tsx`) não muda.
- Master: indicador "negócios que responderam sozinhos" (contato com `primeiraRespostaEm` registrado por usuário da loja, sem atendimento NextLevel no período) e "tempo até publicar" (criação da conta → primeira página publicada).

### 5.10 Nome e textos (decidido, D304)
- **Plataforma:** "NextLevel Commerce" (sem mudança de marca, domínio, e-mails, termos ou contratos; D288 continua valendo).
- **Caminhos:** "Site" e "Loja virtual".
- **Área do painel:** "NextLevel Business", com o subtítulo "Gerenciador do seu negócio".
- Nada disso é fixado em componente: constantes `NOME_GERENCIADOR` ("NextLevel Business") e `CAMINHOS` (rótulos e descrições de Site e Loja virtual) em `src/lib/marcas/nextlevel-ecommerce.ts`; o nome da plataforma continua vindo de `getBrand()`.
- Nas outras marcas (SuperDrop, Brás), o painel não mostra "NextLevel Business" (as marcas estão em pausa, D287); a área só existe para a marca `NEXTLEVEL_COMMERCE`.
- Rota pública do caminho Site: **`/empresas`**, porque `/solucoes` já é a página da NextLevel Soluções (agência, D90) [fato, `src/app/(portal)/solucoes`]. Subpáginas:
  - `/empresas/site-institucional`;
  - `/empresas/pagina-de-campanha`;
  - `/empresas/contatos-e-orcamentos`;
  - `/empresas/caixa`.

  Cada uma com linha em `src/lib/seo/paginas.ts` (D293) e no sitemap.

### 5.11 Frente de caixa e painel instalável
- **Modelo:**
  - tabela `caixas_negocio`: sessão com `id`, `storeId`, `abertoPor`, `abertoEm`, `valorAberturaCents`, `fechadoPor`, `fechadoEm`, `contadoCents jsonb` por forma, `diferencaCents`, `observacao`; índice único "um caixa aberto por loja" (índice parcial onde `fechadoEm is null`);
  - tabela `movimentos_caixa`: `id`, `caixaId`, `tipo enum ["VENDA","SANGRIA","SUPRIMENTO","ESTORNO"]`, `formaPagamento enum ["DINHEIRO","PIX","CARTAO_CREDITO","CARTAO_DEBITO","OUTRO"]`, `valorCents`, `orderId|null`, `motivo`, `por`, `em`, `chave` (idempotência, único por caixa).
- **Venda no balcão = pedido.**
  - Usa `createOrder` com `channel = "BALCAO"` (somar ao enum; migração aditiva), preço sempre do catálogo no servidor, mais linha avulsa para serviço/valor livre (mesma extensão da 5.4).
  - Estoque: só para lojas com catálogo próprio, reservado como hoje.
  - Troco calculado na tela; o servidor confere a soma.
- **Formas de pagamento na v1:**
  - registro manual (dinheiro, maquininha, Pix conferido pela equipe);
  - Pix por QR do Mercado Pago só se a loja já tiver a integração ligada, conferido na API (regra do projeto: o webhook nunca é confiável);
  - **sem integração com maquininha (TEF)** e **sem NFC-e** na v1 (não há base fiscal no sistema). Na tela, o recibo diz "não é documento fiscal".
- **Recibo:** página de impressão 80 mm (CSS `@media print`) e envio por WhatsApp com mensagem pronta.
- **Leitor de código de barras:** coluna nova `gtin` em produtos (aditiva, validação de dígito). O leitor funciona como teclado: campo de busca focado, Enter adiciona o item.
- **Regras copiadas do caixa do Master** (`caixa.ts`): edição só com motivo e histórico, estorno em vez de apagar, reabrir só com motivo e permissão do dono, fechamento com contagem por forma e diferença registrada.
- **Permissões:** papel de operador de caixa na equipe da loja (`store-team.ts`), que vende e fecha o próprio caixa e não vê financeiro nem configurações; o dono vê tudo.
- **Tela:** `src/app/merchant/caixa` em modo foco (sem menu lateral, tela cheia, botões grandes, atalhos de teclado F2 buscar, F4 pagar, F8 sangria, Esc cancelar), funcionando em 1366×768 e em tablet; acessível (rótulos, foco visível).
- **Instalável no computador:**
  - manifesto do painel (rota de manifesto do App Router; ler `node_modules/next/dist/docs/` antes) com `start_url` `/merchant/caixa` ou `/merchant` (escolha no próprio painel), `display: standalone`, ícones e nome da marca via `getBrand()`, escopo `/merchant`;
  - botão "Instalar no computador" que usa o evento de instalação do navegador quando disponível e, senão, mostra o passo a passo (Chrome/Edge: ícone na barra de endereço) [plataforma: conferir os critérios de instalação vigentes do Chrome e do Edge].
- **Sem internet na v1:** a tela mostra "sem conexão" e bloqueia finalizar venda (nada se perde: o carrinho fica na memória da aba). Venda sem internet com fila e idempotência é fase própria futura, não prometer.

### 5.12 Planos e upgrade [decisão]
- Itens novos no catálogo do Master (`nl-catalog.ts`), com preços **definidos no Master**, nunca no código:
  - `BUSINESS_PRESENCA` (Site + Contatos + Painel);
  - `BUSINESS_CAPTACAO` (Presença + Captação);
  - adicional `CAIXA`;
  - adicional `PORTAL` (oculto até a NB10).

  Os planos Commerce (`COMMERCE_START/PRO/SCALE`) passam a incluir Site + Contatos + Painel (Captação conforme o plano; decidir na NB8).
- Oferta de entrada, teste e uma vez por CPF/CNPJ: mesma regra dos planos Commerce (`commerce-plans.ts`, `offerRedemptions`).
- **Upgrade e downgrade:** `SITE` → ligar Loja mantém páginas, domínio, contatos e equipe; Loja → desligar volta ao `SITE` sem apagar produtos (ficam ocultos). Testes cobrindo os dois sentidos.
- Piloto antes do preço: liberar por **cortesia** (`grantEntitlement source: COURTESY`) para o negócio piloto, com data de fim.

### 5.13 Matriz de acesso (servidor)
| Recurso | Visitante | Equipe do negócio | Operador de caixa | Cliente final (NB10) | Outro negócio | Master |
|---|---|---|---|---|---|---|
| Páginas publicadas | Lê | Lê | Lê | Lê | Lê (é público) | Lê |
| Rascunho e editor | Não | Edita (com módulo Site) | Não | Não | Não | Lê para suporte, conforme regra atual |
| Enviar formulário | Sim (com antiabuso) | Sim | Sim | Sim | Sim | Sim |
| Contatos e fichas | Não | Lê/edita os seus | Não | Não | **Nunca** | Conforme regra atual de suporte |
| Caixa | Não | Dono: tudo; equipe: conforme papel | O próprio caixa | Não | **Nunca** | Lê para suporte |
| Configurar Pixel/links | Não | Dono | Não | Não | Nunca | Conforme regra atual |

Cada linha "Nunca" vira teste de servidor (ação e rota direta), não só de tela.


### 5.14 Menu do painel: NextLevel Business, Site, Loja virtual e Ajustes (D304)
Hoje o menu do lojista da Commerce (`COMMERCE_STORE_NAV` em `src/lib/nav.ts`, D207) tem três grupos: **Escritório**, **Crescer** e **Loja e ajustes** [fato]. Ele passa a ter quatro grupos. **Nenhum endereço muda**; só o agrupamento e alguns rótulos. Toda tela atual continua no menu.

| Grupo | Quando aparece | Itens (endereço) | Origem |
|---|---|---|---|
| **NextLevel Business** · Gerenciador do seu negócio | Sempre | Agora (`/merchant`); Contatos e orçamentos (`/merchant/contatos`, NB3); Atendimento (`/merchant/atendimento`); Clientes (`/merchant/crm`); Vendas (`/merchant/orders`, pedidos de todos os canais: loja, WhatsApp, Instagram, balcão); Caixa (`/merchant/caixa`, NB7); Financeiro (`/merchant/finance`); Captação (`/merchant/captacao`, NB4: páginas de campanha, links, origens; absorve "Campanhas" e "Migrar e anunciar"); Seja encontrado (NB5); Análise (`/merchant/analytics`); Resultados da Meta (NB9); Pede pro Maurício (`/merchant/ia`) | Escritório + Crescer de hoje, mais as telas novas |
| **Site** | Formato `SITE`, ou módulo Site ligado numa loja | Páginas (`/merchant/site/paginas`, NB2); Serviços (`/merchant/site/servicos`, NB2); Aparência (`/theme-editor`); Domínio (`/merchant/settings#dominio`) | Novo |
| **Loja virtual** | Formato `LOJA` ou módulo Loja ligado | Minha loja (`/merchant/storefront`); Produtos (`/merchant/catalogo`); Categorias; Banners; Cupons; Avaliações; Pós-venda; Atacado; Temas (`/merchant/templates`); Aparência (`/theme-editor`); Cadastro de clientes da loja (`/merchant/customers`) | Itens de loja que hoje estão espalhados |
| **Ajustes** | Sempre | Empresa (`/merchant/settings`); Equipe; Aplicativos; Ferramentas; Minha assinatura; Contratos; Registro de ações | "Loja e ajustes" de hoje, sem os itens de loja |

**Regras:**
- **Aparência** aparece no grupo de quem o negócio usa. Se usar Site e Loja, aparece uma vez só, em Loja virtual, porque o editor é o mesmo.
- **Caminho que o negócio não usa:** aparece um único cartão no fim do menu ("Ligar loja virtual" ou "Ligar site"), com o caminho de upgrade. Não aparecem dez itens com cadeado. Isso cumpre a regra de `features.ts` ("bloqueado aparece com cadeado, nunca escondido") de forma enxuta.
- **Recursos do Business ainda não contratados** (Caixa, Captação, Resultados da Meta) aparecem com cadeado e o texto de upgrade (`FEATURE_INFO`/`minOfferFor`).
- **Barra inferior do celular** (`bottom: true`): Agora, Contatos e orçamentos, Clientes, Vendas.
- **Cabeçalho do grupo NextLevel Business:** nome e subtítulo vêm de `NOME_GERENCIADOR`. A visão geral (Agora) mostra "NextLevel Business · Visão geral do negócio" no lugar de "Visão geral da loja".
- **Equipe da loja** (`STAFF_NAV_PREFIXES`): a lista ganha `/merchant/contatos` e `/merchant/caixa` conforme o papel. O operador de caixa vê só Caixa e Vendas.
- **Teste novo** (`tests/nav-business.test.ts`):
  - os quatro grupos por formato e módulos;
  - nenhum endereço atual sumiu do menu (comparar com a lista de hoje);
  - os itens da barra inferior;
  - "NextLevel Business" só na marca `NEXTLEVEL_COMMERCE`.
- **Aviso aos lojistas atuais:** uma faixa "Novo: o seu painel agora tem o NextLevel Business" na primeira entrada depois da mudança, com "entendi" (guardar no navegador, com proteção contra falha de armazenamento) e item em Novidades (base de conhecimento, D264).


### 5.15 Dois modos de entrada: cadastro aberto e atendimento (fato da NB0)
- O cadastro da Commerce **só abre** com `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true` (`src/lib/brand.ts`, `signupOpen`). Sem a chave, `/cadastro` leva a **`/quero-minha-loja`** (`requireBrandFeature("signup")` em `src/lib/brand-server.ts`): é um formulário de interesse, e a equipe chama no WhatsApp ("Quero minha loja virtual") [fato, NB0].
- Por isso a escolha do caminho existe **nos dois modos**:
  - **cadastro aberto:** a escolha fica no `/cadastro?para=site|loja`;
  - **atendimento:** `/quero-minha-loja` ganha a pergunta "O que você quer?" (Site para minha empresa · Loja virtual · Ainda não sei). O título acompanha a escolha ("Quero um site para minha empresa" ou "Quero minha loja virtual"), e a resposta vai junto com o contato no Comercial (`brand_leads`, campo do interesse) para a equipe criar a conta no formato certo.
- **Master:** ao criar a conta para um contato (fluxo assistido), escolher o formato `SITE` ou `LOJA`, com o interesse do contato já marcado.
- Endereço `/quero-meu-site` como atalho para `/quero-minha-loja?para=site` (para anúncios e links).

### 5.16 Bases do portal que as fases NB1 a NB3 já respeitam (academia confirmada, D305)
Para o prompt da academia entrar sem retrabalho:
- **Módulos:** `modulos.ts` nasce com a chave `portal`, desligada para todos. O menu reserva "Portal do cliente" no grupo NextLevel Business, visível só com o módulo.
- **Rotas:** o slug `portal` entra na lista de reservados das páginas livres (5.2), junto com `conta` e `p`. O portal vai morar em `/store/[slug]/portal` (e `/portal` no domínio próprio). Nenhuma página livre pode ocupar esse endereço.
- **Identidade do cliente final:** reaproveitar o login sem senha por código de 6 dígitos por loja (`src/lib/domain/conta-cliente.ts`, cookie `nl-cliente`, sessão por loja de 30 dias) [fato]. Hoje ele não tem cadastro próprio: dá acesso aos pedidos daquele e-mail. O aluno será `customers` + `store_customers` (a pessoa e o vínculo com aquele negócio, já existentes), com um campo de situação do vínculo (convidado, ativo, suspenso) somado na NB10. A autorização do aluno nunca usa `requireRole` de equipe; é uma checagem própria por loja e e-mail.
- **Contatos:** quem vira aluno a partir de um contato (`contatos_negocio`) mantém a origem (`origens_contato`). A NB3 guarda e-mail e WhatsApp normalizados para permitir a ligação.
- **Serviços:** as modalidades da academia (musculação, funcional, pilates…) podem ser cadastradas como `servicos_negocio` (NB2) e aparecer no site. A grade de aulas é tabela própria da NB10, ligada ao serviço.
- **Fuso:** `stores` ganha `fuso` (padrão `America/Sao_Paulo`) já na NB1, para todos os horários do negócio (caixa, contatos, aulas).
- **Modelo de site "Academia":** na NB2, além do "Institucional de serviços", um segundo modelo com modalidades, grade (seção estática até a NB10), planos (texto livre, sem cobrança) e "Agende uma aula experimental" (formulário de contato da NB3).

---

## Parte 6. Fases de desenvolvimento

Cada fase segue a skill `desenvolver-prompt`:
- domínio com testes Vitest;
- telas no design system atual (skills `painel-interno` e `qa-visual`);
- e2e em `e2e/`, `axe` sem violação grave, 360 px sem rolagem lateral;
- estados vazios e de erro com próxima ação;
- textos em português claro;
- decisão nova em `DECISIONS.md` com citação na base de conhecimento (D264);
- print ao dono.

| Fase | Entrega | Banco | Aceite principal | Dono precisa |
|---|---|---|---|---|
| **NB0** | Confirmar o inventário da Parte 4 (só onde algo mudou), linha de base (tipos, lint, testes dos arquivos citados, e2e de cadastro, editor, checkout e painel do lojista), completar a **D304** com os padrões da Parte 10 que o dono não mudar, criar a etiqueta de frente das decisões (padrão: `[E-commerce]`) | — | Linha de base registrada; nenhum código de produto alterado | Responder a Parte 10 (ou aceitar os padrões) |
| **NB1** | Dois caminhos (Site e Loja virtual) na home e no cadastro (`para=site\|loja`), menu em quatro grupos com o NextLevel Business (5.14), páginas `/empresas*` (atrás da chave `BUSINESS_V1`; sem ela, os caminhos não aparecem), `stores.formato`, `modulos.ts` com `requireModulo`, menu por módulo, vitrine `SITE` com 404 nas rotas de loja, boas-vindas por formato, visão geral com o nome do gerenciador, escolha de caminho também no formulário assistido `/quero-minha-loja` (5.15) | `stores.formato`, `stores.fuso` | Negócio `SITE` criado pelo cadastro abre o painel certo; loja atual idêntica (e2e de regressão) | Ligar `BUSINESS_V1` quando aprovar |
| **NB2** | Páginas livres (`paginas_site`), editor generalizado, seções `services-grid`, `contact-info`, `before-after`, `servicos_negocio` com tela de cadastro, rotas `/p/` e domínio próprio, menu do site, modelo "Institucional de serviços" (Início, Sobre, Serviços, Contato) instalável com 1 clique | `paginas_site`, `servicos_negocio` | Criar, pré-visualizar, publicar e restaurar versão de uma página; slug reservado recusado; histórico preservado | — |
| **NB3** | Seção `lead-form`, `registrarContato` (idempotente, antiabuso, origem), caixa de contatos e ficha, primeira resposta, orçamento por proposta com item avulso, WhatsApp com código e "registrar conversa", aviso por e-mail e na fila, CRM do lojista unificado | `contatos_negocio`, `cliques_whatsapp_negocio`; linha avulsa em propostas | Envio no celular cria contato na loja certa; repetição técnica não duplica; outro negócio não lê nem por URL nem por ação; proposta de produto continua igual | Textos do aviso de privacidade (padrão pronto) |
| **NB4** | Assistente de página de campanha, modelos por objetivo, IA opcional, links rastreados por negócio, QR, Pixel `Lead`/`Contact` e CAPI `Lead` com `event_id`, aviso de cookies no site do negócio quando houver Pixel, lista "Minhas campanhas" | `links_rastreados.store_id` | Do zero à página publicada com link em ≤ 5 minutos (medir); evento chega no "Testar eventos" sem duplicar (com conta de teste) | Pixel de teste de um negócio piloto |
| **NB5** | SEO local (`LocalBusiness`, `Service`, `FAQPage`), sitemap das páginas, campos de perfil do Google, lista "Seja encontrado" com marcação por dados reais | `integrations` (JSON, sem coluna) | Validador de dados estruturados sem erro; página de campanha fora do sitemap | — |
| **NB6** | Painel do dia do negócio (`filaDoNegocio`, números de hoje e 7 dias), indicadores no Master (responderam sozinhos, tempo até publicar) | — | Números batem com os dados de teste; estados vazios orientam | — |
| **NB7** | Caixa: sessões, movimentos, venda `BALCAO`, linha avulsa, formas de pagamento, recibo 80 mm, `gtin` e leitor, papel de operador, modo foco com atalhos, manifesto do painel e botão de instalar, estado "sem conexão" | `caixas_negocio`, `movimentos_caixa`, `orders.channel += BALCAO`, `products.gtin` | Abrir, vender (dinheiro com troco, Pix, cartão), sangria, fechar com diferença; dois cliques em "finalizar" geram uma venda só; operador não vê financeiro; instalação conferida no Chrome e no Edge | Escolher se o Caixa é adicional ou incluso |
| **NB8** | Itens de catálogo Business, adicional Caixa, cortesia para piloto, upgrade `SITE`↔Loja nos dois sentidos, vitrine na Loja NextLevel (`/merchant/services`), páginas `/empresas` com planos do catálogo | itens de catálogo (dados) | Upgrade preserva páginas, domínio, contatos e equipe; downgrade não apaga produtos | Preços no Master |
| **NB9** | Resultados da Meta por negócio: é a **TR6 + TR9** de `trafego-campanhas-meta-google-reels.md` aplicada ao negócio (mesmo motor), com custo por contato só nos critérios da Parte 3 | conforme TR6 | Estados "conta desconectada", "sem acesso", "dados desatualizados"; leitura apenas | Aplicativo da Meta aprovado e empresa verificada |
| **NB10** | Portal do cliente, piloto academia (Anexo A + `docs/prompts/portal-academia-piloto.md`) | conforme o prompt do piloto | Critérios do Anexo A e do prompt do piloto | **Academia confirmada (D305);** falta o dono detalhar o piloto em `portal-academia-piloto.md` |

**Academia (D305):** com o prompt do piloto preenchido, a NB10 pode começar logo depois da NB3 (precisa do formato `SITE`, das páginas do site e da caixa de contatos), antes de NB4 a NB9, se o dono quiser.

**Ordem e paralelismo:** NB1 → NB2 → NB3 é o caminho crítico (a vidraçaria já pode usar depois da NB3 com cortesia). NB4 e NB5 podem trocar de ordem. NB7 independe de NB4/NB5 e pode vir antes se aparecer cliente com balcão. **Pedido de aprovação do aplicativo da Meta começa já na NB0, fora do código** (é o que mais demora).

---

## Parte 7. Regras transversais (não podem quebrar)

- **Uma conta, um tenant:** toda consulta nova filtra por `storeId` vindo da sessão (`requireRole`, `assertCanAccess`, `tenantOf`), nunca de parâmetro do navegador. Teste de isolamento por ação e por rota direta em cada fase.
- **Commerce intacto:**
  - checkout, pagamentos, pedidos online, temas e editor das páginas fixas continuam com os mesmos contratos;
  - cada fase roda o e2e de regressão da linha de base (cadastro de loja, editor/publicação de tema, compra de teste, painel do lojista).
- **Migrações só aditivas** (`npx drizzle-kit generate --name <assunto>`; nunca editar migração publicada). Enums ganham valor, não perdem. Reversão: desligar `BUSINESS_V1` e os módulos; os dados ficam.
- `export const dynamic = "force-dynamic"` em toda página que consulta o banco.
- Valores em centavos; datas ISO; horário de Brasília para "hoje" (`diaDeBrasilia`/`dataSP`).
- Toda ação passa por `src/lib/domain/*` e `runAction`.
- Segredos só com `encryptSecret`; dados pessoais de contato nunca em log, URL ou evento sem hash.
- Regras configuráveis em `platform_settings`: prazos da fila, limites antiabuso, dias de guarda dos cliques.
- Texto de marca sempre por `getBrand()`; nenhum "SuperDrop" na experiência da Commerce (varredura `scripts/auditoria/marca.mjs`).
- Sem promessa de ganho nos modelos e nos textos sugeridos pela IA; depoimento só real (D283).
- Acessibilidade AA: `axe` sem violações graves; 360 px sem rolagem lateral (`e2e/polish-v8.mjs`).
- **Custo de montagem no Render (pedido do dono, 09/11/2026, `docs/infra/RENDER-USO.md`):** uma publicação de código por fase sempre que der, no máximo 3 por dia; commits só de documentos com `[skip render]`.
- **Testes enxutos:** durante a fase, só tipos, lint e os testes dos arquivos mexidos; a bateria completa (`npx vitest run`) e `npm run build` no fim da fase, antes de publicar.
- Base de conhecimento ao vivo (D264): decisão nova citada em `docs/conhecimento/BC0-INVENTARIO.md` e `node scripts/gerar-novidades.mjs`.
- Print real (Playwright) da principal tela de cada fase para o dono.

---

## Parte 8. Critérios de aceite do conjunto

1. Na home e no cadastro, com `BUSINESS_V1` ligada, a pessoa vê os dois caminhos (Site e Loja virtual). Sem a chave, tudo como hoje. No painel, o grupo NextLevel Business aparece para todos, com os grupos Site e Loja virtual conforme o que o negócio usa. Nenhum endereço atual sumiu do menu.
2. Um negócio criado pelo caminho "Site" monta Início, Sobre, Serviços e Contato com o modelo, pré-visualiza e publica no subdomínio de prévia, e depois no domínio próprio pelo fluxo atual.
3. Um visitante no celular (360 px) envia o formulário. O contato aparece na loja certa com página, serviço e origem. A repetição técnica é idempotente; envios distintos ficam todos registrados.
4. A equipe atribui responsável, muda a situação, envia orçamento (proposta com item avulso), marca ganho com valor ou perdido com motivo. O painel do dia e o tempo até a primeira resposta refletem isso.
5. O clique no WhatsApp conta como intenção. A conversa só vira contato quando registrada, com o código levando a origem do clique.
6. A página de campanha sai do assistente com link rastreado, QR e Pixel. Com consentimento, `Lead` chega pelo navegador e pelo servidor sem duplicar; sem consentimento, nada vai para a Meta.
7. O caixa abre, vende (com troco), faz sangria e fecha com diferença registrada. Repetir "finalizar" não duplica venda. O operador não vê financeiro. O painel instala no Chrome e no Edge.
8. Um usuário de outro negócio não lê nem altera páginas em rascunho, contatos, caixa ou links, nem por URL direta nem por ação do servidor (testes).
9. Os fluxos Commerce da linha de base continuam passando (cadastro de loja, editor, publicação de tema, compra de teste, painel do lojista).
10. O negócio `SITE` liga a Loja e mantém páginas, domínio, equipe e contatos. Desligar a Loja não apaga produtos.
11. Tudo pode ser desligado de forma reversível (`BUSINESS_V1`, módulos), com instruções no relatório da fase.
12. Integração ainda não validada com conta real (Meta) aparece com esse estado na tela e no relatório.

---

## Parte 9. Riscos e como evitar dano

| Risco | Como evitar |
|---|---|
| Quebrar loja existente ao generalizar o editor | Alvo `fixa \| livre` com as páginas fixas intocadas; e2e do editor na linha de base e a cada fase |
| Páginas livres sombrearem rotas da loja ou redirecionamentos (D187) | Lista de slugs reservados, ordem de resolução fixa em `[...resto]`, teste para cada rota existente |
| Vazamento entre negócios nos contatos | Filtro por `storeId` da sessão, testes de servidor, exportação auditada |
| Spam no formulário | Campo-isca, tempo mínimo, limite por loja, tamanho máximo; sem guardar IP |
| Cookie/medição sem base legal no site do lojista | D185 mantida; aviso de cookies só quando houver Pixel; origem só do envio |
| Contato duplicado por clique duplo ou rede ruim | `chaveEnvio` única por loja |
| Venda duplicada no caixa | `chave` única por movimento e um caixa aberto por loja (índice parcial) |
| Prometer nota fiscal, maquininha integrada ou caixa sem internet | Fora da v1, dito na tela e na página `/empresas/caixa` |
| Prometer "gerenciar anúncios" | Texto "acompanhe" até existir escrita; leitura só na NB9 |
| Confundir com a NextLevel Soluções (`/solucoes`, agência) | Rota `/empresas`; a agência continua sendo o serviço de implantação e tráfego |
| Muitas publicações no Render | Uma publicação de código por fase; documentos com `[skip render]` |
| Tirar o foco das 10 lojas pagantes (D174) | NB2/NB3/NB5/NB7 também servem aos lojistas atuais (páginas Sobre/Contato, formulário de atacado/encomenda, SEO local, caixa); ordem pensada para isso |

---

## Parte 10. Decisões do dono (registradas na D304 e na D305)

| # | Pergunta | Padrão recomendado |
|---|---|---|
| 1 | Nome do topo | **Decidido (D304):** plataforma NextLevel Commerce; caminhos Site e Loja virtual; "NextLevel Business" é o gerenciador do negócio dentro do painel (5.10 e 5.14) |
| 2 | Primeiro piloto (vidraçaria ou outro serviço)? | **Aceito (D305):** negócio de demonstração "Vidraçaria Modelo" no ambiente de demonstração; piloto real por cortesia quando houver |
| 3 | O Caixa é adicional ou incluso? | **Aceito (D305):** adicional, com preço no Master; cortesia no piloto |
| 4 | Captação entra em todos os planos Commerce? | **Aceito (D305):** Pro e Scale; Start com página de campanha limitada a 1 |
| 5 | Etiqueta das decisões | **Aceito (D305):** `[E-commerce]` (mesma plataforma) |
| 6 | Portal do cliente | **Mudou (D305): o dono já tem a academia piloto.** A NB10 sai da gaveta: o prompt detalhado do piloto chega em outra conversa e entra em `docs/prompts/portal-academia-piloto.md` (estrutura já pronta). As fases NB1 a NB3 já respeitam as bases do portal (5.16) |
| 7 | Pedir aprovação do aplicativo da Meta já | **Aceito (D305):** sim, em paralelo (fora do código; tarefa do dono, passo a passo na NB9) |

---

## Parte 11. Prompt engenheiro mestre (colar numa sessão de trabalho)

```
FUNÇÃO
Você é engenheiro full-stack sênior do sistema NextLevel (Next.js 16 App Router, React 19, TypeScript estrito, Tailwind v4, Radix, Drizzle com PGlite/Neon, Zod, Vitest, Playwright via playwright-core, deploy Docker no Render). O dono, Mauricio, não é técnico: fale com ele em português claro, sem jargão. Código, nomes de arquivos e commits em português, como o projeto já faz.

OBJETIVO
Transformar a NextLevel Commerce no "coração do negócio" do cliente, sem criar sistema nem marca nova: a plataforma continua NextLevel Commerce (D304); na entrada, dois caminhos ("Site" e "Loja virtual"); dentro do painel, o gerenciador do negócio "NextLevel Business" agrupa tudo o que é do negócio em si (dia a dia, contatos e orçamentos, clientes, vendas, caixa, financeiro, captação, resultados), ao lado das áreas Site e Loja virtual e de Ajustes (Parte 5.14); módulos (Site, Captação, Contatos e orçamentos, Painel do dia, Caixa, Loja virtual; depois Resultados da Meta e Portal do cliente). Reaproveitar os 80% que já existem e construir só o que falta: páginas livres no editor, formulário e caixa de contatos, página de campanha em poucos cliques com link rastreado e Pixel, SEO local, painel do dia do negócio, frente de caixa instalável no computador, planos e upgrade. Nada pode quebrar o Commerce atual.

LEITURA OBRIGATÓRIA (nesta ordem)
AGENTS.md; CLAUDE.md; docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md (dados, permissões, temas, fronteiras); docs/prompts/nextlevel-business-coracao-do-negocio.md (este documento inteiro; as Partes 4, 5, 6, 7 e 8 são o contrato); docs/design/DECISIONS.md (D90 atribuição e /solucoes, D174 foco, D185 lojas sem cookie, D187 Pixel/CAPI e redirecionamentos da loja, D189 integrações por ID, D216 fase atual, D264 base de conhecimento, D279 empresa, D283 depoimentos reais, D287 frentes e domínios, D288 nome, D290 a D294 tráfego e busca, D304 nome e organização do painel); docs/prompts/trafego-campanhas-meta-google-reels.md (TR4 a TR9: não duplicar o motor); docs/infra/RENDER-USO.md; as skills desenvolver-prompt, painel-interno, qa-visual, nova-migracao, e2e-demo e publicar. Antes de mexer em rotas, manifesto, proxy ou cookies, leia o guia correspondente em node_modules/next/dist/docs/.

CÓDIGO QUE JÁ EXISTE (estenda, não duplique; detalhes na Parte 4)
- Negócio = stores (formato novo em stores.formato). Criação: src/lib/domain/provisioning.ts (createStore); cadastro: src/app/cadastro/*.
- Liberação: src/lib/features.ts (canUse, cadeado com caminho de upgrade) e src/lib/domain/entitlements.ts (grantEntitlement, requireEntitlement). Planos: src/lib/domain/commerce-plans.ts e nl-catalog.ts.
- Menu: src/lib/nav.ts (COMMERCE_STORE_NAV vira os quatro grupos da Parte 5.14). Painel da Commerce: src/components/commerce/commerce-home.tsx (src/app/merchant/page.tsx é a versão SuperDrop; não mexer), src/lib/domain/fila-do-dia.ts, loja-agora.ts.
- Editor: src/lib/themes/types.ts (PAGE_KINDS fixo), template.ts, editor-state.ts, store.ts, sections.ts; src/app/actions/theme.ts; src/components/theme-editor/*; tabelas theme_templates, theme_template_versions (page é texto livre), theme_saved_templates, theme_globals. Renderização: src/components/storefront/store-page.tsx e sections/*; rotas src/app/store/[slug]/* e [...resto]/page.tsx (redirecionamento D187).
- Contatos: src/lib/domain/crm-loja.ts (marcaDaLoja = LOJA:<storeId>), crm_acompanhamento, origens_contato, src/lib/domain/proposals.ts (createProposal, acceptProposal), src/app/merchant/crm/*.
- Captação: src/lib/trafego/canal.ts (canalDe, CLICK_IDS), consentimento.ts, lead-na-sessao.ts (registrarOrigemDaVisita), links_rastreados e a rota /l/; src/lib/domain/visitas.ts (sem cookie); stores.metaPixelId/metaCapiTokenEnc; src/components/storefront/pixel-meta.tsx; src/lib/payments/meta-capi.ts.
- Caixa: orders.channel (MANUAL) e createOrder; padrão de regras em src/lib/domain/caixa.ts (caixa do Master, não reutilizar a tabela); src/lib/domain/aplicativos.ts (balcão "em breve").
- Cliente final: src/lib/domain/conta-cliente.ts (só para a NB10).
- SEO: src/lib/storefront-seo.ts, sitemap.xml/robots.txt da loja, src/lib/seo/paginas.ts (páginas públicas da marca).
- Infra: runAction, requireRole, assertCanAccess, tenantOf, emitEvent, encryptSecret, platform_settings, src/lib/email.ts, getBrand().

COMO TRABALHAR
1. Execute UMA fase por vez (NB0 a NB10, Parte 6), na ordem, salvo pedido do dono. Comece pela NB0 se ela não estiver marcada como feita em docs/prompts/README.md.
2. Antes de escrever, leia o código que a fase toca e confirme a Parte 4 só onde algo mudou desde 13/11/2026. Se um fato estiver errado, corrija o documento e siga o padrão mais próximo do que o código já faz.
3. Decisões abertas: use o padrão da Parte 10 e registre em DECISIONS.md (próximo número livre; etiqueta [E-commerce], salvo decisão do dono). Não pare para perguntar o que já tem padrão.
4. Banco: só migrações aditivas (skill nova-migracao). Enums ganham valor, nunca perdem. Contas antigas continuam com o comportamento de hoje (formato LOJA).
5. Domínio primeiro: funções puras e testáveis em src/lib/domain/business/* ou src/lib/business/*, com Vitest (casos felizes, limites, idempotência, isolamento entre negócios, permissões por papel). Depois as ações (runAction) e as telas.
6. Telas: design system atual, skill painel-interno; estados vazios e de erro com a próxima ação; 360 px sem rolagem lateral; axe sem violações graves; textos em português claro, sem promessa de ganho, marca por getBrand().
7. E2E em e2e/ (skill e2e-demo): a jornada da fase e a regressão do Commerce (cadastro de loja, editor e publicação de tema, compra de teste, painel do lojista).
8. Segurança: storeId sempre da sessão; dados pessoais nunca em log, URL ou evento sem hash; segredos com encryptSecret; antiabuso proporcional no formulário; nada de cookie de medição no site do negócio sem aviso (D185 e 5.6/5.7).
9. Durante a fase rode só tipos (npx tsc --noEmit), estilo (npx eslint src e2e tests) e os testes dos arquivos mexidos. No fim da fase: npx vitest run, npm run build (sem "Export encountered"), e2e da fase e de regressão.
10. Feche com a skill publicar: uma publicação de código por fase (no máximo 3 por dia); commits só de documentos com [skip render]; decisão citada em docs/conhecimento/BC0-INVENTARIO.md e node scripts/gerar-novidades.mjs; atualize o estado em docs/prompts/README.md e neste documento.
11. Mande ao dono pelo menos um print real (Playwright) da tela principal da fase e um relatório curto: o que ficou pronto, o que foi reaproveitado, como ligar e como desligar, o que depende dele, "Esforço do dia por frente" e a próxima fase.

LIMITES
- Não criar tabela de empresas, aplicação separada ou marca nova. "NextLevel Business" é só o nome da área do painel: nada de domínio, cadastro, e-mail ou termos próprios. Não usar /solucoes (é a agência); as páginas públicas do Business ficam em /empresas.
- Não alterar contratos de checkout, pagamentos, pedidos online, frete e temas das páginas fixas, exceto as extensões aditivas descritas (linha avulsa em propostas e pedidos, canal BALCAO, gtin).
- Não prometer nota fiscal, integração com maquininha, caixa sem internet, "gerenciar anúncios" ou portal antes das fases correspondentes.
- Resultados da Meta (NB9) usam o motor da TR6/TR9 do prompt de tráfego; não duplicar. Teste com conta real só com acesso autorizado; sem acesso, a tela mostra "conexão pendente".
- Portal do cliente (NB10) só com piloto confirmado pelo dono; siga o Anexo A.
- Credenciais, contas reais, publicação em produção e operações de mídia exigem acesso e autorização. Quando um item depender do dono, continue com as partes independentes e liste a pendência.

CRITÉRIOS DE ACEITE
Os da Parte 8 deste documento, mais o aceite da linha da fase na Parte 6.
```

---

## Anexo A. Portal do cliente (NB10), especificação do racional original

> **Academia confirmada (D305).** O detalhamento do dono entra em `docs/prompts/portal-academia-piloto.md`. Este anexo é o piso: o prompt do piloto pode acrescentar, mas não afrouxar as regras de lotação, isolamento e dados de saúde.

- **Escopo da primeira versão (academia):**
  - a equipe cria aulas com horário (fuso do negócio), capacidade e instrutor, e vê inscritos e ocupação;
  - o aluno convidado ou cadastrado entra (reaproveitar o login por código de `conta-cliente.ts`, por negócio), consulta a grade, reserva, vê as próprias reservas e cancela conforme a política.
- **Fora:** mensalidade do aluno, treino, avaliação física, prontuário, controle de acesso, cobrança do aluno e **qualquer dado de saúde**.
- **Regras:**
  - lotação garantida de forma atômica (operação condicional no banco com contagem sob trava, ou restrição única por vaga numerada);
  - idempotência por chave de reserva;
  - duas reservas simultâneas na última vaga: uma entra, a outra recebe "turma cheia";
  - cancelamento libera a vaga até o prazo configurado;
  - aula encerrada não aceita reserva.
- **Acesso:** o aluno vê só o seu negócio e as suas reservas; a equipe vê a grade e os inscritos; outro negócio, nunca (testes de servidor e rota direta).
- **Escolha de contexto:** uma pessoa com vínculo em mais de um negócio escolhe o contexto explicitamente.
- **Módulo:**
  - ligar o portal não muda site, domínio, equipe nem contatos;
  - desligar esconde as rotas (404) e não apaga dados;
  - negócio sem portal nunca expõe as rotas.
- **Medir:** alunos ativos, reservas concluídas, conflitos de capacidade, cancelamentos e uso pela equipe.
- **Extensão futura:** acompanhamento de serviço (status de instalação ou obra para o cliente da vidraçaria) como outra função do mesmo módulo. Não criar abstração genérica antes do segundo caso real.
