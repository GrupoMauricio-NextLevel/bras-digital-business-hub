# NOVO NÍVEL VISUAL — SUPERDROP (v3)

Você atua como DIRETOR DE DESIGN + ARQUITETO FRONT-END + ENGENHEIRO FULL-STACK SÊNIOR, dentro do repositório `bras-digital-business-hub` (Next.js 16 App Router, React 19, TypeScript estrito, Tailwind v4, Radix, Drizzle, Zod, Vitest, Playwright). Leia antes `AGENTS.md`, `docs/design/RACIONAL-VISUAL-V3.md`, `docs/design/DECISIONS.md`, `docs/prompts/evolucao-visual-v1.md` e `docs/prompts/mvp-original-v0.md` (seções 5 e 6). O Next.js desta versão tem mudanças: consulte `node_modules/next/dist/docs/` antes de escrever código.

## 0. MODO DE OPERAÇÃO
- Trabalhe por fases (V0 a V8), sem pedir permissão entre elas. Cada fase termina com: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, o E2E da fase, capturas nos 4 tamanhos (1440, 1024, 768, 390 px), commit e push na branch `claude/wonderful-cannon-5o38v5`.
- Não altere regra de negócio, preço, taxa ou domínio financeiro. Esta rodada é visual e de experiência de edição. Mudança de banco só onde a seção 8 pede (motor de temas), sempre com migração reversível e sem perder dados.
- Não regredir: os 185 testes e os E2E `visual-round`, `smoke-demo` e `scenario` continuam passando.
- Sem credenciais, sem senhas reais, sem dados pessoais. Textos em português do Brasil. Sem inventar números, depoimentos ou clientes: onde faltar conteúdo real, use marcador claro "conteúdo a fornecer".
- Ao terminar cada fase, atualize `docs/design/DECISIONS.md` (D12 em diante) e apresente o relatório curto da seção 14.

## 1. RESULTADO ESPERADO
Um produto que pareça, em cada tela, um SaaS de comércio eletrônico de primeira linha:
1. Painel de controle moderno, denso e calmo, com padrões de administração no nível dos melhores do mercado.
2. Editor de produto de outro patamar.
3. Editor de tema com seções e blocos, prévia ao vivo e publicação com rascunho.
4. Temas de loja bonitos e realmente configuráveis.
5. Portal `superdrop.com.br` que apresenta o sistema funcionando.
6. Páginas de vendas de Alpha Outfit e MantosShop sobre um modelo único.
7. Todo o resto do sistema elevado ao mesmo padrão (listas, formulários, dashboards, vazios, carregamentos).

## 2. ESTADO ATUAL (medido)
- Tema: `themes` tem 3 linhas (Starter, Pro, Elite); só o Starter está `available`. A home da loja é código fixo em `src/app/store/[slug]/page.tsx`. `ThemeSettingsData` tem 7 campos. O lojista não reordena nem esconde seções.
- Editor de tema: `src/app/merchant/appearance/appearance-form.tsx` (formulário + miniatura + iframe; prévia em 3 larguras só na Loja Própria).
- Editor de produto: `src/app/supplier/products/new/new-product-form.tsx` e `[id]/product-forms.tsx`, `images-editor.tsx`. Sem SEO, sem prévia, sem rascunho, sem ordenar fotos por arrastar.
- Design system: tokens por painel em `src/app/globals.css` (`data-panel`), componentes em `src/components/app`, `ui`, `shared`, `storefront`. Modo claro e escuro. Logo em `src/components/brand/logo.tsx` e `public/brand/`.
- Portal: `src/app/(portal)` com 5 páginas estáticas. Página do fornecedor: `src/app/f/[slug]`.
- Gráficos: `src/components/finance/charts.tsx`, paleta validada (variáveis `--series-*`, `--viz-*`).

## 3. DECISÕES ASSUMIDAS (registrar como D12 e seguintes; o dono pode reverter)
- **G1. Referência Shopify sem dependência.** Usar os princípios e padrões de administração do Polaris e a arquitetura de temas Online Store 2.0 (seções, blocos, templates JSON, esquema de configurações, editor com prévia). NÃO instalar `@shopify/polaris` (descontinuado, exige React 18) nem os web components da Shopify (feitos para o admin deles). NÃO usar marca, ícones, textos ou assets da Shopify. Identidade própria SuperDrop.
- **G2. Motor de temas em React.** Seções são componentes React com esquema Zod; templates são JSON. Liquid fica fora desta rodada.
- **G3. Compatibilidade.** As lojas atuais continuam idênticas: o tema atual vira o "template padrão" migrado automaticamente.
- **G4. Ofertas.** Editor avançado, seções premium e temas Pro e Elite seguem os gates de `src/lib/features.ts`. Recurso bloqueado aparece com cadeado e caminho de upgrade, nunca escondido.
- **G5. Logo.** A logo principal poderá ser trocada depois; nenhuma tela pode ter a logo embutida fora de `Logo` e `public/brand/`.
- **G6. Conteúdo.** Textos e imagens reais dos fornecedores chegam depois; entregar os modelos prontos com conteúdo demonstrativo identificado.

## 4. PRINCÍPIOS DE DESIGN
Simplicidade, hierarquia forte, tipografia excelente, espaço generoso, ação principal sempre óbvia, baixa carga cognitiva, divulgação progressiva, painéis orientados à ação, mobile de verdade. Evitar: gradientes exagerados, vidro fosco em excesso, sombras pesadas, cards demais, gráficos inúteis, aparência de template barato, "visual de IA genérico". Movimento sempre com propósito, curto (120 a 240 ms), respeitando `prefers-reduced-motion`. Contraste mínimo WCAG AA.

## 5. DESIGN SYSTEM V3 (fase V0)
Entregar em `src/components/app` (ou pasta `src/components/ds`) e documentar em `/dev/design`:
- **Tokens:** escala tipográfica (display, título, corpo, legenda, numérico tabular), espaçamento em grade de 4 px, raios, elevações (3 níveis), bordas, estados (hover, foco, ativo, desabilitado), duração e curva de movimento, densidade (confortável e compacta). Manter os temas por painel e o modo escuro.
- **Padrões de página:** `Page` (título, breadcrumb, ações primária e secundária, badge de status), `TwoColumn` (principal + lateral), `Card` com cabeçalho e ação, `Section`, `Banner` (info, sucesso, atenção, crítico), `EmptyState` com ação, `SkeletonPage`, `Toast`, `ConfirmDialog`.
- **`ContextualSaveBar`:** barra fixa "Alterações não salvas" com Descartar e Salvar, guarda contra sair da página, atalho de teclado, estado de erro.
- **`IndexList`:** lista com busca, filtros como chips, **visões salvas** (guardadas por usuário), ordenação, seleção em lote com barra de ações, paginação, densidade, colunas configuráveis, esqueleto e vazio. Substituir as tabelas atuais por ela onde fizer sentido (pedidos, produtos, lojas, clientes, recargas).
- **Componentes de edição:** `MediaGallery` (arrastar e soltar, ordenar por arrastar, capa, texto alternativo), `ColorField` com amostras e verificação de contraste, `RichTextLite`, `FontPicker`, `RangeField`, `LinkPicker`, `ResourcePicker` (produto e coleção), `SlugField` com prévia de URL, `SearchPreview` (como aparece no Google), `Stepper`, `KeyboardHint`.
- **Ícones:** um conjunto único e consistente (o que já existe, padronizado em tamanho e traço).
- **Aceite:** página `/dev/design` mostra todos os padrões nos 5 climas de painel e nos temas claro e escuro; testes de acessibilidade (axe) sem violações graves.

## 6. CASCA E PAINÉIS (fase V1)
Reescrever, com os padrões acima, mantendo as rotas e os dados:
- Navegação lateral recolhível com seções agrupadas, busca global e paleta de comandos (Ctrl K) com ações e navegação, topo com contexto (loja ou fornecedor), central de avisos, seletor de perfis de demonstração.
- **Master:** torre de controle com faixa de indicadores, fila de atenção, saúde da rede e receita; listas de fornecedores, lojas e serviços com `IndexList`.
- **Fornecedor:** esteira ao vivo (manter comportamento), pedidos, recargas, produtos, estoque, equipe com `IndexList`.
- **Expedição:** manter alto contraste e alvos grandes; sem valores.
- **Lojista:** início por perfil (Lite com saldo em destaque; Pro com análise), pedidos, catálogo, clientes, financeiro.
- Estados vazios com ação, esqueletos de carregamento em toda rota, transições de página discretas.
- **Aceite:** E2E por papel; capturas dos 5 climas em 4 tamanhos; sem rolagem horizontal; foco visível em tudo.

## 7. EDITOR DE PRODUTO (fase V2)
Nova tela de criar e editar produto em duas colunas com `ContextualSaveBar` e rascunho automático:
- **Coluna principal:** título e descrição (texto rico leve); **mídia** com arrastar e soltar, ordenar por arrastar, capa, texto alternativo e compressão no navegador (manter o limite atual); **variações** em matriz (hoje: tamanho único; deixar o modelo pronto para cor); preço, custo e **margem calculada na hora** com alerta abaixo do mínimo; estoque por variação com entrada em lote; **campos extras** (composição, cuidados, modelagem); **SEO** (título, descrição, endereço) com `SearchPreview`.
- **Coluna lateral:** status (ativo, rascunho, arquivado), categoria e coleções, distribuição para lojas, **prévia do produto na loja** (cartão e página, 3 larguras), atividade e histórico.
- **Ações:** duplicar, arquivar, ver na loja, edição em lote na lista (preço, status, estoque).
- **Regras:** nada de preço de venda definido pela plataforma (o fornecedor define custo e sugestão; o membro define o preço). Mesmas validações de domínio atuais; testes de domínio preservados.
- **Aceite:** E2E criar, editar, duplicar e arquivar; rascunho recuperado após recarregar; margem correta em teste unitário; a página de vendas do fornecedor continua sem mostrar custo.

## 8. MOTOR DE TEMAS (fase V3)
Modelo (Online Store 2.0, adaptado):
- **Tema** = conjunto de **seções** (componentes React) + **templates** por página (`home`, `product`, `collection`, `cart`) + **configurações globais** (cores, tipografia, botões, cantos, espaçamento).
- **Seção** = `{ type, schema, presets, component }`. `schema` (Zod) descreve `settings` e `blocks` (tipos de bloco, limite, configurações). Tipos de configuração: `text`, `textarea`, `richtext`, `image`, `color`, `range`, `select`, `checkbox`, `url`, `product`, `collection`, `font`, `number`.
- **Template** = JSON `{ sections: { id: { type, settings, blocks, blockOrder, hidden } }, order: [...] }`, validado por Zod e com versão de esquema.
- **Banco:** tabelas novas `theme_templates` (por loja e página: rascunho e publicado), `theme_template_versions` (histórico, últimas 20), e `theme_settings_global`. Migração transforma `theme_settings` e o tema atual no template padrão sem mudar a aparência. Manter `theme_settings` até a V5 fechar.
- **Renderização:** servidor (RSC) lendo o template publicado; a prévia lê o rascunho por um parâmetro assinado. Cada seção aceita `id` e `data-section-id` para o editor localizar.
- **Catálogo inicial de seções** (todas com esquema, presets e responsividade): barra de anúncio, cabeçalho, hero (imagem, vídeo, carrossel), faixa de confiança, vitrine de produtos, vitrine por coleção, grade de categorias, banner de imagem com texto, colunas de texto e imagem, depoimentos, perguntas frequentes, chamada para ação, contador de promoção, lookbook, rodapé; para produto: galeria, informações, seletor de variação, descrição em abas, produtos relacionados; para coleção: cabeçalho, filtros, grade.
- **Aceite:** testes unitários de validação de esquema, migração idempotente (rodar duas vezes não muda nada), renderização de cada seção com dados vazios e cheios; lojas de demonstração idênticas antes e depois (comparar capturas).

## 9. EDITOR DE TEMA (fase V4)
Rota `/merchant/theme` (e substituir `appearance` e `templates` por ela, com redirecionamentos):
- **Três painéis:** esquerda (páginas e árvore de seções e blocos, com arrastar para reordenar, ocultar, duplicar, remover, adicionar por catálogo com busca e presets); centro (prévia ao vivo em iframe, seletor de página, largura computador, tablet 768 e celular 390, zoom); direita (configurações da seção ou bloco selecionado, geradas do esquema, e configurações globais do tema).
- **Ao vivo:** o editor conversa com a prévia por `postMessage` (atualiza sem recarregar; clicar na prévia seleciona a seção; passar o mouse na árvore destaca na prévia).
- **Rascunho e publicação:** alterações vão para o rascunho automaticamente; botão Publicar; histórico de versões com restaurar; desfazer e refazer (Ctrl Z, Ctrl Shift Z); `ContextualSaveBar`; aviso de conflito se outra pessoa da equipe editou.
- **Ofertas:** Lite com tema Starter e edição básica (textos e cores); Loja Própria com editor completo, seções premium e domínio. Seções e temas pagos aparecem com cadeado e levam à Loja NextLevel.
- **Aceite:** E2E adicionar seção, editar, reordenar, ocultar, publicar, restaurar versão; capturas do editor em 4 tamanhos; teclado completo; nenhuma perda de dados ao recarregar.

## 10. TEMAS DA LOJA (fase V5)
- **Modelo comercial (decidido pelo dono):** o tema **Starter é grátis** (simples, mas bem acabado, não como o atual). Os temas **pagos são vendidos e instalados com 1 clique** na Loja NextLevel: **R$ 299**, **R$ 699** e **R$ 1.499**. Os pagos devem chegar o mais perto possível do nível dos temas da Shopify (seções e blocos, página inicial, produto, coleção, carrinho, menus grandes, vídeo, lookbook, busca com sugestões, compra rápida, barra fixa de compra no celular, animações discretas). Compra por fatura Pix da NextLevel (reaproveitar a cobrança existente), liberação automática e **instalação com 1 clique** (tema ativado já com conteúdo de exemplo do preset, sem apagar o que o lojista tem: fica como rascunho até publicar).
- **Escada:** R$ 299 (esportivo, para camisas de time) < R$ 699 (editorial, foco em imagem e marca) < R$ 1.499 (vitrine completa com todos os recursos acima).
- Reescrever o **Starter** com seções (aparência atual como ponto de partida, melhorada em tipografia e espaço).
- Criar **"Arena"** (esportivo, para camisas de time: hero forte, vitrine por clube, selo de autenticidade, faixa de envio) e **"Editorial"** (limpo, foco em imagem e tipografia).
- Páginas de **produto, coleção e carrinho** como templates. Checkout mantém o fluxo atual, com visual alinhado.
- Cada tema traz presets de página inicial prontos ("começar por um modelo").
- **Aceite:** trocar de tema mantém conteúdo compatível; capturas de cada tema nas 4 larguras; desempenho da loja (LCP abaixo de 2,5 s no ambiente de teste, imagens com dimensões definidas).

## 11. PORTAL superdrop.com.br (fase V6)
Página inicial de altíssimo nível, em `src/app/(portal)`, com a estrutura:
1. **Cabeçalho** enxuto com logo, navegação e botão de entrar; **herói** com promessa forte, ação principal (teste de 7 dias sem cartão), símbolo da marca e uma **demonstração viva** (esteira de pedidos animada com dados simulados, feita com os componentes reais).
2. **Problema e promessa:** três dores de quem vende e de quem fornece, com a resposta do produto.
3. **Como funciona** em cinco passos, interativo (o painel muda conforme o passo).
4. **Painéis por papel:** Master, Fornecedor, Expedição, Membro. Cada um com captura ou componente real e três benefícios.
5. **Loja e temas:** o editor de tema aparecendo em ação (mostrar a prévia mudando).
6. **Operação:** corte, ondas de separação, etiqueta em PDF, recarga por Pix.
7. **Preço com calculadora** (uma venda de camisa: cliente paga, membro paga, fornecedor recebe, taxa). Só valores confirmados em `docs/PLANOS.md`; a mensalidade do membro segue "informada ao iniciar o teste" até a decisão.
8. **Prova social:** espaço para os dois fornecedores e depoimentos, marcado como "conteúdo a fornecer" enquanto não houver material real.
9. **Perguntas frequentes**, **chamada final** e rodapé com termos e privacidade (páginas reais, texto a fornecer pelo jurídico).
- Movimento: revelações suaves ao rolar, contadores, transições de painel, tudo desligável por `prefers-reduced-motion`.
- Técnica: componentes de servidor por padrão, ilhas de cliente só onde há interação; imagens com dimensões e `priority` no herói; dados estruturados (Organização, Produto de software, FAQ); metadados e imagem de compartilhamento já existentes.
- **Aceite:** Lighthouse local: desempenho ≥ 90, acessibilidade ≥ 95, SEO ≥ 95 em desktop e celular; capturas em 4 larguras; E2E de navegação e do botão de teste.

## 12. PÁGINAS DOS FORNECEDORES (fase V7)
Modelo único `src/app/f/[slug]` (já existe; elevar): herói com o fornecedor em destaque e SuperDrop discreto (rodapé com a logo), catálogo em destaque (sem custo), como funciona, planos, prova social, WhatsApp fixo no celular, FAQ, CTA de teste de 7 dias com cupom (`MANTOSSHOP7`, `ALPHA7`, quando o P1 existir; até lá, botão leva ao contato). Configurável por um editor simples do fornecedor (cores, logo, textos, imagens, ordem das seções, reaproveitando o motor de seções). Criar `alpha-outfit` e `mantosshop` com conteúdo demonstrativo identificado.
- **Aceite:** as duas páginas no ar no ambiente de demonstração; capturas; o preço de custo nunca aparece.

## 13. ACABAMENTO GERAL (fase V8)
Estados vazios e de erro em todas as telas; esqueletos de carregamento; transições; revisão de textos em português; desempenho (sem regressão); acessibilidade (axe sem violações graves, navegação por teclado, leitores de tela nos editores); testes visuais em 4 larguras para as telas-chave (Playwright, capturas comparáveis); documentação atualizada (`README`, `docs/design`).

## 14. RELATÓRIO POR FASE
Ao fechar cada fase, responder em português, curto: o que mudou (por tela), decisões registradas (D12+), resultados de lint, tipos, testes, build e E2E (com números), capturas geradas (onde estão), pendências e o que precisa do dono (conteúdo, decisões). Nunca declarar pronto sem ter rodado os testes e olhado as capturas.

## 15. FORA DE ESCOPO NESTA RODADA
Regras financeiras, taxas, planos e preços; cobrança e Mercado Pago; e-mail transacional; cadastro público e cupom (P1); chat de pós-venda (U6); Academy completa; compatibilidade com Liquid e com temas de terceiros; aplicativo móvel; troca da logo principal (será feita depois, só nos arquivos de `public/brand/`).
