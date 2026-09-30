# Racional: o salto visual da SuperDrop (v3)

Este documento responde três perguntas: onde estamos, de onde vem a referência "Shopify" e como evoluímos em fases. O prompt executável está em `docs/prompts/novo-nivel-visual-v3.md`.

## 1. Prompts e decisões de design recuperados

| Arquivo | O que é |
|---|---|
| `docs/prompts/mvp-original-v0.md` | Prompt original do MVP. A seção 5 (DESIGN) e a 6 (DESIGN SYSTEM) definem a linguagem visual: Shopify como **referência conceitual**, sem copiar visual, código ou identidade. |
| `docs/prompts/evolucao-visual-v1.md` | Evolução por painel (Master, Fornecedor, Expedição, Lojista Lite e Pro, Loja NextLevel). F0 a F3 prontos; F4 a F8 cobertos. |
| `docs/prompts/racional-operacao-v2.md` | Operação e o design por painel (seção 2). |
| `docs/prompts/historico-design.md` | Suas mensagens sobre design, na íntegra, em ordem. |
| `docs/design/DECISIONS.md` | D1 a D11: o que já foi decidido e por quê. |
| `docs/design/AUDIT.md` | Diagnóstico visual da fase F0. |

Ponto que muda agora: o prompt original dizia "não copiar a Shopify". Você pediu "usar tecnologia da Shopify". A conciliação proposta está na seção 3.

## 2. Diagnóstico honesto do que está "básico"

Medido no código de hoje:

- **Tema.** Existem 3 temas na tabela, mas só o Starter está disponível (Pro e Elite estão marcados `available: false`). O "tema" é uma página de loja escrita à mão em `src/app/store/[slug]/page.tsx` (hero, faixa de confiança, categorias, destaques), com uma variação por `themeKey === "elite"` no código. O lojista não escolhe seções, não reordena e não esconde nada.
- **Editor de tema.** É um formulário com 7 campos (`ThemeSettingsData`: título, subtítulo, botão, anúncio, banners, categorias, rodapé) mais uma miniatura e um iframe. Não há seções, blocos, rascunho e publicação, histórico, desfazer nem edição em cima da prévia.
- **Editor de produto.** Um formulário longo em cards (`new-product-form.tsx`, 158 linhas). Fotos sem arrastar para ordenar, variações como tabela simples, sem SEO, sem prévia do produto na loja, sem rascunho, sem barra de "alterações não salvas", sem edição em lote.
- **Painéis.** Boa base (tokens por painel, modo escuro, esteira, análise), mas o visual ainda é "cards e tabelas". Falta densidade de informação de nível profissional, listas com filtros salvos e ações em lote, estados vazios com ação, microinterações e transições.
- **Portal.** Cinco páginas corretas, porém editoriais e sem produto na tela. Um portal de altíssimo nível mostra o sistema funcionando, não só descreve.

## 3. "Tecnologia da Shopify": o que dá para usar de verdade

São três camadas diferentes. Recomendo tratá-las separadamente.

### 3.1 Painel de controle (admin): padrões do Polaris, sem depender do Polaris
- `@shopify/polaris` (React) está **descontinuado** no npm ("no longer maintained") e exige React 18. O projeto usa React 19. Não serve.
- O Polaris novo é feito de **web components**, entregue pela Shopify para apps que rodam **dentro do admin da Shopify**. Depender disso em uma plataforma independente amarra o painel a um serviço externo e a termos que não controlamos. Não recomendo.
- O que é aproveitável: os **princípios e padrões** (licença MIT nos pacotes de tokens e do Polaris React): página com ações primária e secundária, layout em duas colunas (conteúdo principal e lateral de status), lista com filtros, visões salvas e ações em lote, **barra contextual de salvar** ("alterações não salvas"), banners, estados vazios, esqueletos de carregamento, paleta de comandos.
- Decisão proposta: construir um **design system próprio "classe Polaris"** sobre o que já usamos (Tailwind v4, Radix, tokens por painel), com esses padrões. Mantemos identidade SuperDrop (verde, logo nova). Não usamos marca, ícones nem assets da Shopify.

### 3.2 Loja e temas: arquitetura Online Store 2.0 (aqui está o salto)
É a parte da "tecnologia Shopify" que mais muda o produto. Conceitos:
- **Tema = pacote de seções e blocos.** Seção é um pedaço de página (hero, vitrine, depoimentos, vídeo). Bloco é um item configurável dentro da seção (um slide, um selo, uma coluna).
- **Templates em JSON.** Cada página (home, produto, coleção, carrinho) é uma lista ordenada de seções com configurações. O lojista adiciona, reordena, oculta e edita, sem código.
- **Esquema de configurações** por seção (texto, texto rico, imagem, cor, faixa, seleção, produto, coleção, link, fonte). O editor se monta sozinho a partir do esquema.
- **Editor de tema** em três painéis (árvore de seções, prévia ao vivo em 3 larguras, configurações), com rascunho e publicação, histórico de versões e desfazer.
- **Liquid** é a linguagem de templates da Shopify. Recomendo **não** usar Liquid na primeira fase: nossa loja é React em Next.js, e o modelo de seções e blocos em JSON com componentes React dá o mesmo poder com tipagem e segurança. Liquid (via LiquidJS) fica como opção futura, sabendo que temas da Shopify não rodam aqui sem adaptação.

### 3.3 Editor de produto: o padrão de páginas de cadastro da Shopify
Duas colunas, cabeçalho com status (ativo, rascunho), mídia com arrastar e ordenar, opções e variações em matriz (tamanho hoje; cor depois), preço e custo com margem calculada na hora, estoque por variação, SEO com prévia do resultado no Google, coleções, campos extras (composição, cuidados), duplicar, histórico e **rascunho automático**.

## 4. Fases propostas

| Fase | Entrega | Tam. | Depende de |
|---|---|---|---|
| V0 | Fundações: tokens v3 (tipografia, espaço, elevação, movimento), biblioteca de padrões (página, duas colunas, barra de salvar, lista com visões, banner, esqueleto), regras de acessibilidade e movimento reduzido | M | nada |
| V1 | Casca e painéis reescritos com os padrões: navegação, topo, paleta de comandos, listas de pedidos, produtos, lojas e clientes com filtros e ações em lote | G | V0 |
| V2 | Editor de produto novo (mídia, variações em matriz, SEO, prévia na loja, rascunho) | G | V0 |
| V3 | Motor de temas: esquema de seções e blocos, templates JSON, tabelas novas, migração do tema atual sem perda | G | nada (paralelo a V1) |
| V4 | Editor de tema: árvore, prévia ao vivo em 3 larguras, configurações geradas do esquema, rascunho e publicação, versões, desfazer | G | V3 |
| V5 | Temas: reescrever o Starter com seções; criar 2 temas novos (um esportivo para camisas, um editorial) e a página de produto, coleção e carrinho como templates | G | V3 |
| V6 | Portal `superdrop.com.br` de altíssimo nível, com demonstração real do produto | G | V0 |
| V7 | Páginas dos dois primeiros fornecedores (Alpha Outfit e MantosShop) sobre um modelo único | M | V6 |
| V8 | Acabamento: estados vazios, transições, desempenho, acessibilidade, testes visuais em 4 larguras | M | tudo |

Ordem sugerida: V0, depois V6 e V3 em paralelo, V1, V2, V4, V5, V7, V8. O portal vem cedo porque é a vitrine para os dois fornecedores.

## 5. Portal: o que faz uma apresentação de altíssimo nível
- **Mostrar o produto funcionando.** Uma demonstração interativa (esteira de pedidos ao vivo, recarga por Pix, loja sendo editada) feita com os próprios componentes e dados simulados. É o que vende para quem nunca viu o sistema.
- **Uma história em cinco atos:** promessa, problema, como funciona, prova (números da operação e depoimentos reais quando existirem), preço e ação.
- **Preço claro com calculadora** (quanto sobra em uma venda de camisa), sem inventar valores que ainda estão em decisão.
- **Movimento com propósito:** revelações suaves ao rolar, contadores, transições de painel. Tudo com respeito a "reduzir movimento".
- **Desempenho e busca:** carregamento rápido, imagens otimizadas, dados estruturados, compartilhamento (já tem imagem de compartilhamento).
- **A logo é trocável em um lugar só** (`Logo` e `public/brand/`), então "mudar a logo principal" depois não exige refazer telas.
- **Páginas dos fornecedores:** um modelo único (herói com o fornecedor em destaque, SuperDrop discreto, catálogo, planos, prova social, WhatsApp) preenchido com dados de Alpha Outfit e MantosShop. O que depende de você: logos, cores, textos, fotos com direito de uso e depoimentos.

## 6. Decisões que preciso de você
1. Confirmar a conciliação da seção 3: **padrões Polaris + arquitetura Online Store 2.0, sem depender de código ou serviço da Shopify**, com identidade própria. (Se você quiser mesmo os componentes da Shopify, o custo é depender do admin deles; não recomendo.)
2. Motor de temas em **React com seções e blocos em JSON** (recomendado) ou tentar compatibilidade com Liquid.
3. Quantos temas novos no lançamento (proposta: Starter reescrito + 2).
4. Quais seções e temas serão **pagos** na Theme Store e quais entram nas ofertas (define o que fica com cadeado).
5. Fotos e conteúdo: quem fornece imagens reais para o portal e para as páginas de Alpha Outfit e MantosShop.
6. Prioridade frente ao P1 (Pix, cupom, taxa por pedido): fazer V0 e V6 antes, e o resto em paralelo ao P1?

## 7. Riscos
- **Escopo:** é um programa de várias sessões. Cada fase fecha com testes, capturas e commit.
- **Migração de temas:** lojas existentes precisam continuar iguais. O motor novo lê o tema atual como um template padrão.
- **Desempenho da prévia ao vivo:** exige um canal de mensagens entre o editor e a loja; por isso o motor de temas vem antes do editor.
- **Fontes e imagens:** usar só fontes com licença livre e imagens com direito de uso.
