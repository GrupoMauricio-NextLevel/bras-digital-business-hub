# Prompt avançado: evoluir ao máximo o Editor de Temas e a área de Templates (10 temas: 4 gratuitos e 6 avançados)

> Cole este documento como instrução de trabalho. É executável por fases (T0 a T9). Antes de codar, leia `CLAUDE.md`, `AGENTS.md` (Next.js com mudanças: consulte `node_modules/next/dist/docs/`), `docs/design/DECISIONS.md` (D1 a D33), `docs/prompts/nextlevel-commerce-plataforma.md` (seção 4A, anti-duplicação) e `docs/prompts/promessas-commerce.md` (P5 é a versão resumida deste trabalho; este prompt a **substitui em detalhe**). As imagens e os conteúdos de demonstração vêm de `docs/prompts/imagens-temas-gpt.md`. Registre as decisões em `docs/design/DECISIONS.md` (D34 em diante). Nada de preço, limite ou regra fixa no código: tudo em `platform_settings` e no catálogo.

## 0. MISSÃO
Ter o **melhor editor de temas e a melhor vitrine de temas do comércio de moda no Brasil**, no nível do Shopify: o lojista escolhe entre **10 temas prontos (4 gratuitos, 6 avançados)**, monta a loja sem código, vê o resultado ao vivo, troca de tema sem perder conteúdo e publica com confiança. Cada tema é bonito, rápido e acessível, e o editor é o argumento de venda da plataforma.

## 1. ESTADO DE PARTIDA (verifique antes de mexer)
- **Motor:** `src/lib/themes/*` (sections, template, presets, store, install, preview, try), seções em `src/components/storefront/sections/*` (cerca de 30 tipos de seção e bloco), 4 páginas modeladas (início, produto, catálogo, carrinho), rascunho/publicação/histórico, limites por oferta.
- **Editor:** `src/app/theme-editor` e `src/components/theme-editor/*` (árvore, painel de ajustes, upload de imagem, prévia ao vivo, desfazer, salvar e publicar).
- **Templates/temas:** `src/app/merchant/templates` (loja de temas: cartão até 6x ou Pix com desconto, instalação com 1 clique, prévia com os produtos da loja), `src/app/master/templates`, catálogo em `src/lib/themes/catalog.ts`, entitlements `THEME_<KEY>`.
- **Temas hoje (4):** Starter (grátis), Arena (R$ 299), Editorial (R$ 699), Signature (R$ 1.499). **Meta: 10** (4 grátis + 6 avançados).
- **Imagens de demonstração hoje:** só gradientes determinísticos (`art:` em `ProductArt`). Precisamos de imagens reais fictícias por tema (ver o prompt de imagens).

## 2. O PORTFÓLIO: 4 GRATUITOS + 6 AVANÇADOS
Ordem do mais simples ao mais sofisticado; preços em `platform_settings`/catálogo (os atuais ficam; os novos são sugestões para o dono aprovar).

| # | Chave | Nome | Tipo | Para quem | Personalidade | Preço |
|---|---|---|---|---|---|---|
| 1 | `starter` | Starter | Grátis | qualquer loja | limpo, neutro, rápido (já existe) | R$ 0 |
| 2 | `essencial` | Essencial | Grátis | moda feminina, básicos, acessórios | minimalista claro, muito respiro, tipografia leve | R$ 0 |
| 3 | `vitrine` | Vitrine | Grátis | varejo de bairro e sacoleira digital | colorido, faixas de promoção, grade densa, WhatsApp em destaque | R$ 0 |
| 4 | `lancamento` | Lançamento | Grátis | drops, coleção única, streetwear | uma peça em destaque, contagem regressiva, foco em conversão | R$ 0 |
| 5 | `arena` | Arena | Avançado | camisas de time e esportivo | escuro, vibrante, clubes e coleções (já existe) | R$ 299 |
| 6 | `ofertas` | Ofertão | Avançado | alto giro, promoção, atacado leve | vermelho e amarelo, selos de desconto, ordenação e filtros fortes, compra rápida | sugestão R$ 449 |
| 7 | `pop` | Pop Kids | Avançado | infantil, brinquedos, festa | colorido, formas arredondadas, ilustração, microanimações lúdicas | sugestão R$ 549 |
| 8 | `editorial` | Editorial | Avançado | moda autoral | revista, serifa, lookbook, vídeo (já existe) | R$ 699 |
| 9 | `noir` | Noir | Avançado | luxo, joias, moda premium | escuro elegante, dourado discreto, imagem grande, movimento sutil | sugestão R$ 999 |
| 10 | `signature` | Signature | Avançado | operação grande | tudo dos anteriores: menu grande, busca com sugestões, compra rápida (já existe) | R$ 1.499 |

**O que separa gratuito de avançado (regra de produto, configurável em `features.ts`):**
- **Gratuitos:** todas as páginas (início, produto, catálogo, carrinho), 8 a 12 seções, cores/logo/fontes (lista curta), sem vídeo, sem menu grande, sem animações avançadas, sem lookbook, com o selo NextLevel no rodapé (já é regra).
- **Avançados:** biblioteca completa de seções, vídeo e lookbook, animações sóbrias, menu grande e busca com sugestões, seções de conversão (contador, estoque baixo, compre o look, faixas), tipografia e cores avançadas, páginas extras, desempenho e suporte de designer, atualização contínua.
- **Marca e módulos:** todos os temas funcionam em qualquer marca; seções de atacado (P2), influenciadores (P3) e feed/live (P4) aparecem quando o módulo está ligado.

## 3. O EDITOR (o que construir)
### 3.1 Estrutura e fluxo
- **Três colunas:** árvore (esquerda), prévia (centro), inspetor (direita), todas recolhíveis; barra superior com página, dispositivo (celular, tablet, notebook, tela grande), tema claro/escuro, desfazer/refazer, histórico, salvar, publicar e **agendar publicação**.
- **Páginas modeladas:** início, produto, catálogo/coleção, carrinho e **novas**: busca, página livre, blog/artigo, 404, "sobre/contato", cabeçalho e rodapé (grupos de seção globais), **agradecimento do pedido** e página de **atacado** quando o módulo estiver ligado. **Modelos alternativos por página** (ex.: produto "camisa de time" e produto "acessório"), atribuídos por coleção ou produto.
- **Seções e blocos:** adicionar por biblioteca com busca, categorias e **prévia da seção**; arrastar e soltar na árvore e **direto na prévia**; duplicar, ocultar, bloquear, copiar/colar entre páginas; seções globais reutilizáveis (uma edição vale em todas as páginas); **modelos de seção salvos** ("minhas seções").
- **Ajustes globais do tema:** cores semânticas (primária, destaque, fundo, texto, sucesso, aviso), escala tipográfica, fontes (lista curada com subconjunto e desempenho), raios, sombras, espaçamento, largura do conteúdo, botões, formulários, animações (nível: desligado, sutil, padrão), com **prévia imediata**.
### 3.2 Recursos de editor avançado
- **Conteúdo dinâmico:** campos ligados aos dados (nome, preço, imagem, estoque do produto; nome e imagem da coleção; texto da loja) por *tokens* validados; seções que puxam da coleção X ou de "mais vendidos" por regra.
- **Visibilidade condicional:** mostrar/ocultar por dispositivo, cliente logado, cliente atacadista aprovado, país/estado (fase posterior), horário (agendamento).
- **Imagens:** recorte com ponto focal, texto alternativo obrigatório com sugestão, otimização automática (WebP/AVIF, `srcset`), biblioteca de arquivos da loja (`store_assets`) com busca e pastas, e **banco de imagens de demonstração** dos temas (do prompt de imagens) para o lojista começar bonito.
- **Qualidade em tempo real:** painel "Saúde da página" com **contraste**, **texto alternativo**, **peso da página**, **tempo de carregamento estimado** e **orçamento do tema** (verde/amarelo/vermelho), bloqueando publicar com erro grave (ex.: contraste ilegível).
- **Versões:** histórico com nome, comparação **lado a lado**, restaurar seção ou página, duplicar tema para experimentar, **publicar agendado**, "voltar ao que estava no ar".
- **Atalhos e acessibilidade do editor:** teclado completo (mover seção, abrir inspetor, desfazer), leitor de tela, foco visível; axe limpo.
- **Segurança do conteúdo:** nenhum script livre; HTML só por blocos permitidos com sanitização; CSS extra só por variáveis do tema (sem CSS arbitrário); links validados; tamanho e tipo de imagem conferidos pelos bytes (já existe).
### 3.3 Colaboração e proteção (fase posterior)
Comentários na página, papel "designer" com acesso só ao editor, bloqueio de edição concorrente, registro de quem mudou o quê (auditoria).

## 4. A ÁREA DE TEMPLATES (loja de temas)
Renomear e organizar como **Temas** (aparência completa) e **Modelos de página** (blocos prontos):
- **Vitrine de temas** com filtro (gratuito/avançado, segmento, estilo, recursos), ordenação (preço, novidade, popularidade), selos ("Grátis", "Novo", "Mais escolhido"), tabela comparativa entre temas, e **prévia em tela cheia com os produtos da própria loja** (já existe) e **com os produtos de demonstração do tema** (imagens do prompt de imagens), em celular e computador.
- **Cada tema tem página própria:** descrição, capturas por dispositivo, recursos, **demonstração navegável** (loja fictícia `/demo/<tema>` gerada só com conteúdo de demonstração), avaliações e novidades da versão.
- **Testar antes de comprar** (já existe `tryingTheme`) estendido para os gratuitos: aplicar como rascunho, editar à vontade e só publicar quando decidir; nada muda na loja no ar.
- **Trocar de tema sem perder conteúdo:** mapeamento de seções entre temas (por tipo), o que não tem equivalente vai para "seções não usadas" (recuperáveis), nunca é apagado; prévia do resultado antes de confirmar.
- **Modelos de página e de seção** (galeria do Master + os do lojista): "Página de coleção de time", "Landing de lançamento", "Página de atacado", "Sobre a loja", "Guia de tamanhos"; instalar em 1 clique numa página.
- **Compra:** já pronta (cartão 6x, Pix com desconto, instalação imediata); acrescentar **pacote "todos os avançados"** com preço próprio configurável.
- **Master** (`/master/templates`): catálogo (ativar/desativar, preço, ordem, destaque), versões e publicação de novas versões com nota, métricas por tema (instalações, ativos, conversão, receita), fila de revisão (Theme Store aberta na fase T8).

## 5. QUALIDADE E DESEMPENHO (requisitos, não desejos)
- **Régua no CI** (`e2e/theme-quality.mjs`): para cada um dos 10 temas com dados de demonstração, Lighthouse mobile ≥ 90 em desempenho e ≥ 95 em acessibilidade, LCP e CLS dentro do orçamento (`theme_budgets` em configuração), peso por página; falha bloqueia a publicação. Para os gratuitos o orçamento é ainda mais apertado.
- **Regressão visual:** capturas de cada tema e página em 4 larguras (360, 768, 1280, 1920) comparadas com a referência aprovada; tolerância configurada; diferença abre relatório.
- **Testes de motor:** toda seção renderiza com dados vazios, com um item e com muitos; o esquema rejeita entrada inválida; trocar de tema preserva conteúdo; agendamento publica na hora certa; versões restauram.
- **Acessibilidade AA** em todos os temas e no editor (axe sem violações graves, contraste, foco, teclado, `prefers-reduced-motion`).
- **SEO técnico:** metadados por página, dados estruturados de produto, sitemap, imagens com dimensões (sem CLS).

## 6. MODELO DE DADOS (estender, não duplicar)
Reaproveitar `themes`, `theme_versions`, `store_themes`, `theme_settings`, `theme_templates`, `theme_globals`, `theme_template_versions`, `store_assets`. Acrescentar (migração `00NN_theme_editor_v2`):
- `theme_saved_sections` (`storeId?` nulo = galeria do Master, `name`, `type`, `settings` JSON, `blocks` JSON, `thumbnailAssetId`).
- `theme_schedules` (`storeId`, `templateVersionId`, `publishAt`, `status`, `createdBy`).
- `theme_budgets` (`themeKey`, `page`, `maxWeightKb`, `minPerf`, `minA11y`) ou em `platform_settings`.
- `theme_demo_manifests` (`themeKey`, `version`, `manifest` JSON com produtos, banners e textos de demonstração; imagens em `public/theme-demo/<tema>/`).
- `store_templates.alternateFor` (modelo alternativo por coleção/produto) e `section_visibility` (regras condicionais) dentro do JSON validado do modelo (com esquema Zod versionado e migração de versão de esquema).
- Catálogo: `THEME_CATALOG` cresce para 10 com `tier` (`FREE`|`ADVANCED`), `segment[]`, `style[]`, `bestFor`, `requiresModule?`; `features.ts` ganha `themesFree`, `themesAdvanced`.

## 7. FASES (cada uma fecha com lint, tipos, testes, build, e2e, capturas, decisão registrada e commit)
- **T0 Fundação e catálogo:** `THEME_CATALOG` com 10 temas (só os 4 existentes com preset completo no início; os demais entram nas fases T2 e T3), `tier` grátis/avançado, `features.ts`, migração e testes de catálogo; página de tema no Master.
- **T1 Régua de qualidade e demonstração:** script de qualidade, orçamento, regressão visual, **sistema de conteúdo de demonstração** (`theme_demo_manifests`, `/demo/<tema>`, "usar imagens de demonstração"), integração com as imagens do prompt de imagens.
- **T2 Três novos gratuitos:** `essencial`, `vitrine`, `lancamento`, cada um com presets das 4 páginas, seções novas necessárias, prévia, testes de render e régua no verde.
- **T3 Três novos avançados:** `ofertas`, `pop`, `noir`, com o mesmo padrão; revisão de `arena`, `editorial` e `signature` para o novo nível (imagens reais, animações sóbrias, desempenho).
- **T4 Editor v2 (estrutura):** arrastar e soltar na prévia, biblioteca de seções com prévia, seções globais, modelos de seção salvos, copiar/colar, modelos alternativos, novas páginas (busca, livre, blog, 404, obrigado), atalhos de teclado.
- **T5 Editor v2 (inteligência):** conteúdo dinâmico, visibilidade condicional, imagens com ponto focal e alt sugerido, painel "Saúde da página", publicar agendado, comparação lado a lado.
- **T6 Templates v2 (loja de temas):** filtros, comparativo, página do tema, demonstração navegável, testar antes de comprar em todos, troca de tema sem perda com prévia, pacote de avançados, métricas no Master.
- **T7 Modelos de página e de seção** (galeria do Master e do lojista) e importar/exportar tema (JSON versionado).
- **T8 Theme Store aberta** (designers e agências): envio, revisão automática e manual, versões, repasse (`platform_settings`, padrão 70%), atualização segura por loja.
- **T9 Acabamento:** acessibilidade completa, documentação (`DECISIONS.md`, `MAPA.md`), guia do lojista ("como montar sua loja em 1 hora"), vídeos curtos, capturas e checklist de lançamento.

## 8. DECISÕES QUE VOCÊ DEVE PROPOR COM PADRÃO RECOMENDADO (não bloqueie; registre em D34)
| # | Ponto | Padrão recomendado |
|---|---|---|
| 1 | Nomes e chaves dos 6 novos temas | os da tabela da seção 2 |
| 2 | Preços dos novos avançados | sugestões da tabela; o dono confirma; ordem crescente por preço |
| 3 | Selo NextLevel no rodapé | sempre, também nos avançados (regra de marca) |
| 4 | Trocar de tema | nunca apaga conteúdo; "seções não usadas" recuperáveis |
| 5 | Fontes | lista curada de 12 famílias com subconjunto latino e `swap` |
| 6 | Vídeo no tema | só avançados; upload via provedor de vídeo do módulo `liveShop`; até lá, apenas link/embed permitido |
| 7 | Conteúdo dinâmico | tokens fechados e validados (sem expressões livres) |
| 8 | Agendamento | fuso de Brasília, publicação por trabalho de fundo com trava de idempotência |
| 9 | Régua de desempenho | 90 desempenho e 95 acessibilidade (mobile); gratuitos com orçamento de peso menor |
| 10 | Demonstração navegável | `/demo/<tema>` só leitura, sem dados reais, com `noindex` |

## 9. ACEITE
- Existem **10 temas** (4 gratuitos e 6 avançados), cada um com as páginas completas, prévia com conteúdo de demonstração (imagens reais fictícias), página própria e demonstração navegável.
- Todos passam na régua (Lighthouse 90/95 no celular) e na regressão visual em 4 larguras; axe sem violações graves.
- O lojista escolhe um tema gratuito, edita com arrastar e soltar, vê "Saúde da página", agenda a publicação e volta a uma versão anterior; troca de tema sem perder nada.
- Um avançado é comprado (cartão 6x ou Pix), instalado com 1 clique e reflete na loja no ar; o gratuito aplica sem compra.
- O Master gerencia catálogo, preços, versões e vê métricas por tema.
- Nada de script livre ou CSS arbitrário entra pelo editor; conteúdo é sanitizado; isolamento por loja intacto.

## 10. FORA DE ESCOPO
Editor de código (Liquid/HTML livre), aplicativos de terceiros dentro do tema, teste A/B automático (fase posterior), tradução de temas, editor de e-mail (prompt de e-mail), checkout totalmente personalizável (o checkout segue o padrão da plataforma).
