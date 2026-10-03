# 04 — VISUAL COMMERCE

> **Status:** Documento especializado de engenharia e produto  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`, `03-PLATFORM-CORE.md`  
> **Escopo:** Arquitetura visual das lojas, Theme Engine, templates, sections, blocks, editor visual, preview, responsividade, publicação e qualidade visual  
> **Não cobre:** regras comerciais do Commerce Core, UX detalhada do painel administrativo, checkout transacional interno, segurança geral da plataforma ou integrações específicas

---

# 1. OBJETIVO

Definir a arquitetura visual da Plataforma de Lojas Virtuais NextLevel de forma que:

- lojas possam ser visualmente muito diferentes;
- o lojista consiga personalizar sem programar;
- temas não dupliquem lógica de comércio;
- storefront continue rápido, responsivo e acessível;
- templates possam ser comercializados;
- segmentos diferentes possam ter experiências próprias;
- mudanças possam ser pré-visualizadas, versionadas e publicadas com segurança;
- o sistema evite conflitos de CSS, estrutura e componentes observados em plataformas existentes;
- evolução visual não exija reescrever o Commerce Core.

---

# 2. PRINCÍPIO CENTRAL

A Visual Commerce Platform transforma capacidades comerciais em experiência visual.

Ela **não é dona da verdade comercial**.

O Theme Engine pode decidir:

- onde mostrar preço;
- como apresentar variante;
- qual card usar;
- qual composição de home;
- qual tipografia;
- qual espaçamento;
- qual ordem visual;
- qual comportamento responsivo permitido.

Ele não pode decidir sozinho:

- qual é o preço verdadeiro;
- se há estoque;
- se o pagamento foi aprovado;
- se um cupom é válido;
- se um pedido existe;
- se um usuário pode executar determinada ação.

---

# 3. VISUAL NÃO É HTML SOLTO

A plataforma não deve tratar personalização como simples armazenamento de HTML/CSS arbitrário.

A arquitetura visual deve possuir conceitos estruturados.

Conceitos centrais:

- Design Tokens;
- Theme;
- Theme Version;
- Template;
- Page Type;
- Section;
- Block;
- Settings Schema;
- Content Binding;
- Responsive Rules;
- Preview;
- Draft;
- Publication;
- Rollback;
- Asset Reference.

---

# 4. CAMADAS DA VISUAL COMMERCE PLATFORM

A arquitetura visual deve possuir, conceitualmente, as seguintes camadas:

## 4.1 Design Tokens
Base de identidade visual.

## 4.2 Component Primitives
Componentes de base reutilizáveis.

## 4.3 Theme Components
Componentes estilizados por tema.

## 4.4 Sections
Blocos estruturais de página.

## 4.5 Blocks
Elementos internos de uma section.

## 4.6 Templates
Composição de sections para determinado tipo de página.

## 4.7 Theme
Conjunto de tokens, componentes, templates, defaults e schemas.

## 4.8 Store Theme Instance
Aplicação concreta de um theme em uma loja.

## 4.9 Draft / Published Version
Versão em edição e versão pública.

---

# PARTE I — DESIGN TOKENS

## 5. DESIGN TOKENS

Tokens representam decisões visuais reutilizáveis.

Devem permitir configuração coerente de:

- cores;
- tipografia;
- escalas;
- espaçamento;
- raios;
- bordas;
- sombras;
- containers;
- grids;
- breakpoints;
- botões;
- inputs;
- cards;
- overlays;
- z-index;
- motion;
- proporções;
- densidade.

---

## 6. TOKENS SEMÂNTICOS

Preferir tokens semânticos a valores espalhados.

Exemplo:

- `color.surface.primary`
- `color.text.primary`
- `color.text.muted`
- `color.action.primary`
- `color.action.primaryHover`
- `color.border.subtle`
- `radius.card`
- `spacing.section`
- `container.max`

Evitar hardcode repetido de hexadecimal em componentes.

---

## 7. TOKENS DE MARCA

Cada loja pode possuir identidade própria.

Tokens de marca podem incluir:

- primary;
- secondary;
- accent;
- background;
- surface;
- heading font;
- body font;
- logo;
- favicon;
- button style.

Esses valores devem ser validados contra requisitos mínimos de contraste e usabilidade quando possível.

---

## 8. TOKENS DERIVADOS

Nem todo valor precisa ser editável diretamente.

A plataforma pode derivar:

- hover;
- pressed;
- muted;
- subtle;
- borders;
- focus;
- background variants.

Isso reduz inconsistência.

---

## 9. TYPOGRAPHY SYSTEM

Tipografia deve possuir escala coerente.

Conceitos:

- display;
- h1;
- h2;
- h3;
- body;
- small;
- caption;
- button;
- price;
- badge.

Tema pode redefinir família e proporções dentro de limites seguros.

---

## 10. SPACING SYSTEM

Espaçamento deve seguir escala consistente.

Evitar valores arbitrários em cada componente.

O editor pode expor opções semânticas como:

- compact;
- normal;
- spacious;

em vez de permitir qualquer número sem contexto.

---

# PARTE II — THEME ENGINE

## 11. THEME

Theme representa um sistema visual completo.

Pode conter:

- metadata;
- tokens default;
- templates;
- sections disponíveis;
- blocks disponíveis;
- component variants;
- settings schema;
- assets;
- compatibilidade;
- version;
- changelog;
- preview metadata.

---

## 12. THEME IDENTITY

Theme deve possuir:

- id estável;
- nome;
- slug;
- versão;
- autor;
- status;
- thumbnail;
- screenshots;
- segmentos indicados;
- capabilities requeridas;
- compatibilidade mínima;
- data de publicação.

---

## 13. THEME VERSION

Mudanças de theme devem ser versionadas.

Uma versão pode conter:

- código/componentes;
- schema;
- defaults;
- migrations;
- changelog.

A loja não deve quebrar porque uma nova versão foi publicada.

---

## 14. COMPATIBILIDADE DE VERSÃO

Tema atualizado deve considerar:

- settings antigos;
- sections existentes;
- blocks existentes;
- conteúdo já configurado;
- assets;
- schema migration.

Atualização de tema não pode apagar configuração sem aviso.

---

## 15. THEME INSTANCE

Uma loja não “edita o tema global”.

Ela possui uma instância/configuração própria.

Exemplo conceitual:

`StoreTheme`

com:

- store_id;
- theme_id;
- theme_version;
- draft_config;
- published_config;
- status;
- updated_at;
- published_at.

---

# PARTE III — TEMPLATE SYSTEM

## 16. TEMPLATE

Template representa composição para um tipo de página.

Exemplos:

- home;
- product;
- collection;
- category;
- search;
- cart;
- account;
- blog;
- page;
- campaign;
- 404.

---

## 17. PAGE TYPE

Cada template deve declarar a qual page type pertence.

Isso permite contratos específicos.

Exemplo:

`PRODUCT_PAGE` espera contexto de produto.

`COLLECTION_PAGE` espera coleção/listagem.

---

## 18. TEMPLATE NÃO É PÁGINA DE CONTEÚDO

Template define estrutura visual.

Conteúdo e dados podem vir de:

- store settings;
- CMS;
- catálogo;
- context;
- blocks;
- dynamic bindings.

---

## 19. TEMPLATE VARIANTS

Um theme pode oferecer múltiplas variantes para a mesma page type.

Exemplo:

- product-default;
- product-editorial;
- product-wholesale;
- product-minimal.

---

# PARTE IV — SECTIONS

## 20. SECTION

Section é unidade estrutural reutilizável.

Exemplos:

- hero;
- product grid;
- collection showcase;
- category carousel;
- image + text;
- benefits;
- logo strip;
- testimonials;
- newsletter;
- video;
- banner;
- countdown;
- featured product;
- rich text;
- FAQ.

---

## 21. SECTION SCHEMA

Toda section deve declarar seu schema.

Pode incluir:

- settings;
- blocks;
- limits;
- defaults;
- responsive behavior;
- required capabilities;
- allowed bindings.

---

## 22. SECTION SETTINGS

Settings devem ser tipados.

Exemplos:

- select;
- boolean;
- text;
- rich text;
- image;
- color;
- token;
- number;
- range;
- collection reference;
- product reference;
- URL;
- enum;
- alignment.

---

## 23. SECTION LIMITS

Uma section pode definir:

- máximo de blocks;
- tipos permitidos;
- required blocks;
- minimum items;
- maximum items;
- reorder rules.

Isso protege a integridade visual.

---

## 24. SECTION REORDERING

O editor deve permitir reordenar sections quando o template permitir.

Mudança deve atualizar apenas configuração.

Não reescrever código.

---

# PARTE V — BLOCKS

## 25. BLOCK

Block é unidade interna de uma section.

Exemplos:

Hero section:

- heading;
- subtitle;
- button;
- image;
- badge.

Feature grid:

- feature item;
- icon;
- text.

---

## 26. BLOCK SCHEMA

Block deve possuir schema próprio.

Settings não devem ser strings arbitrárias sem validação.

---

## 27. REUSABILITY

Block pode ser reutilizado em várias sections quando semanticamente correto.

Não criar duplicação apenas por aparência.

---

# PARTE VI — CONTENT BINDING

## 28. STATIC CONTENT

Conteúdo configurado diretamente pelo lojista.

Exemplos:

- título;
- texto;
- imagem;
- CTA;
- link.

---

## 29. DYNAMIC CONTENT

Conteúdo vindo do domínio.

Exemplos:

- produtos;
- coleções;
- preço;
- estoque;
- avaliações;
- categorias;
- customer data;
- order data.

---

## 30. BINDING CONTRACT

O Theme Engine deve consumir dados por contratos estáveis.

Exemplo conceitual:

`ProductCardData`

não deve expor internals do banco.

---

## 31. FALLBACKS

Se conteúdo dinâmico não existir, component deve possuir comportamento definido:

- esconder;
- mostrar empty state;
- usar fallback.

Nunca quebrar a página.

---

# PARTE VII — STOREFRONT UX CONTRACT

## 32. PRINCÍPIO

Todo tema pode ser visualmente diferente.

Nenhum tema pode quebrar requisitos essenciais de comércio.

---

## 33. PRODUCT PAGE CONTRACT

Página de produto precisa preservar:

- nome;
- preço;
- promoções compreensíveis;
- mídia;
- seleção de variante;
- disponibilidade;
- quantidade;
- CTA de compra;
- feedback;
- informações essenciais;
- acessibilidade;
- mobile.

---

## 34. PRODUCT CARD CONTRACT

Card deve comunicar claramente:

- produto;
- preço;
- promoção quando existir;
- disponibilidade quando relevante;
- imagem;
- destino clicável;
- CTA quando aplicável.

---

## 35. CART CONTRACT

Carrinho deve preservar:

- itens;
- variações;
- quantidades;
- preço;
- desconto;
- subtotal;
- frete quando calculado;
- total;
- editar/remover;
- continuar compra;
- checkout.

---

## 36. SEARCH CONTRACT

Busca precisa oferecer:

- input claro;
- resultado compreensível;
- empty state;
- loading;
- navegação por teclado quando aplicável;
- mobile adequado.

---

## 37. NAVIGATION CONTRACT

Header/menu deve preservar:

- acesso à navegação;
- busca;
- carrinho;
- conta quando habilitada;
- logo/home;
- acessibilidade.

---

# PARTE VIII — RESPONSIVIDADE

## 38. MOBILE FIRST

Storefront deve ser desenhado e testado prioritariamente em mobile.

---

## 39. BREAKPOINTS

Breakpoints pertencem ao design system do theme.

Devem ser consistentes.

Evitar componentes com breakpoints aleatórios.

---

## 40. RESPONSIVE SETTINGS

Quando necessário, settings podem possuir variação por viewport.

Exemplos:

- imagem desktop;
- imagem mobile;
- alinhamento;
- ordem;
- spacing;
- visibility.

---

## 41. MEDIA RESPONSIVA

Banner horizontal não deve ser simplesmente espremido no mobile.

Sistema deve permitir:

- art direction;
- imagem específica;
- crop inteligente;
- aspect ratio controlado.

---

## 42. HIDING CONTENT

Ocultar conteúdo por breakpoint deve ser permitido com cuidado.

Não utilizar como substituto de estrutura correta.

---

# PARTE IX — PAGE BUILDER

## 43. PAGE BUILDER

Page Builder deve ser estruturado.

Não é editor HTML livre.

---

## 44. OPERAÇÕES DO BUILDER

Pode permitir:

- adicionar section;
- remover;
- duplicar;
- reordenar;
- configurar;
- adicionar blocks;
- reordenar blocks;
- alterar bindings;
- preview;
- salvar draft;
- publicar.

---

## 45. DRAG AND DROP

Drag-and-drop é interação visual.

Não deve determinar o modelo de dados.

Configuração persistida deve continuar estruturada.

---

## 46. VALIDATION

Builder deve impedir:

- configuração inválida;
- block incompatível;
- section sem required data;
- referência quebrada;
- layout impossível.

---

## 47. SAFE DEFAULTS

Adicionar uma section deve produzir algo visualmente aceitável imediatamente.

---

# PARTE X — PREVIEW

## 48. PREVIEW MODE

Lojista deve poder visualizar mudanças antes de publicar.

Preview precisa refletir o draft real.

---

## 49. PREVIEW TOKEN

Preview privado deve utilizar mecanismo seguro.

Não tornar draft publicamente indexável.

---

## 50. DEVICE PREVIEW

Editor deve oferecer pelo menos:

- desktop;
- mobile.

Tablet pode ser adicionado.

---

## 51. PREVIEW REAL

Preview deve utilizar o mesmo renderer do storefront sempre que possível.

Evitar editor visual que “parece” diferente da loja publicada.

---

# PARTE XI — DRAFT, PUBLISH E ROLLBACK

## 52. DRAFT

Alterações visuais devem poder ser salvas sem impactar produção.

---

## 53. PUBLISHED VERSION

Storefront público consome apenas configuração publicada.

---

## 54. ATOMIC PUBLISH

Publicação deve ser atômica.

Nunca publicar metade de uma configuração.

---

## 55. PUBLICATION RECORD

Registrar:

- quem publicou;
- quando;
- version;
- mudança;
- correlation id quando aplicável.

---

## 56. ROLLBACK

Quando possível, permitir reverter para versão anterior publicada.

---

## 57. VERSION HISTORY

Histórico visual deve permitir identificar:

- versões;
- autor;
- data;
- notas;
- estado.

---

# PARTE XII — ASSETS E MÍDIA

## 58. MEDIA PICKER

Editor deve consumir Media Engine.

Não criar upload isolado por section.

---

## 59. ASSET REUSE

Mesma imagem deve poder ser reutilizada.

Evitar duplicar upload desnecessariamente.

---

## 60. ALT TEXT

Assets visuais devem permitir alt text.

Quando contexto exigir, alt pode ser específico por uso.

---

## 61. IMAGE FOCAL POINT

Sistema pode permitir focal point.

Isso melhora crops responsivos.

---

# PARTE XIII — COMPONENT LIBRARY

## 62. STOREFRONT COMPONENTS

Componentes comerciais comuns devem possuir contratos claros.

Exemplos:

- ProductCard;
- Price;
- VariantSelector;
- QuantitySelector;
- AddToCart;
- CartDrawer;
- Search;
- Breadcrumb;
- CollectionGrid;
- Badge;
- Rating;
- Pagination.

---

## 63. COMPONENT VARIANTS

Tema pode fornecer variantes visuais sem alterar contrato de comportamento.

---

## 64. COMPONENT API

API de componente deve ser estável e semântica.

Evitar dependência direta do schema do banco.

---

# PARTE XIV — CSS E ISOLAMENTO VISUAL

## 65. ESCOPO DE ESTILO

Evitar CSS global irrestrito.

---

## 66. CONFLITOS

A pesquisa WBuy mostrou conflitos entre estruturas e classes antigas/novas.

A NextLevel deve minimizar:

- colisão de selector;
- cascade inesperado;
- override invisível;
- dependência de specificity excessiva;
- estilos globais acidentais.

---

## 67. CSS STRATEGY

A implementação pode utilizar:

- scoped CSS;
- CSS modules;
- design tokens;
- utility classes;
- CSS layers;
- outra abordagem consistente.

A tecnologia específica pertence à implementação.

---

## 68. THIRD-PARTY CSS

Apps externos não devem poder destruir layout inteiro.

Extensões precisam de superfície controlada.

---

# PARTE XV — PERFORMANCE VISUAL

## 69. PERFORMANCE BUDGET

Themes devem respeitar orçamento de performance.

---

## 70. JAVASCRIPT

Evitar JavaScript desnecessário.

Componentes puramente visuais não devem exigir hidratação completa sem motivo.

---

## 71. IMAGENS

Utilizar:

- tamanhos adequados;
- lazy loading quando apropriado;
- formatos modernos;
- responsive images;
- prioridade para conteúdo crítico.

---

## 72. FONTES

Fontes impactam performance.

Limitar:

- pesos;
- famílias;
- requests;
- FOIT/FOUT.

---

## 73. THIRD-PARTY SCRIPTS

Pixels, chats e trackers devem ser governados.

Theme não deve carregar scripts arbitrários por padrão.

---

# PARTE XVI — ACESSIBILIDADE

## 74. ACCESSIBILITY CONTRACT

Themes precisam preservar:

- contraste;
- foco;
- teclado;
- semântica;
- labels;
- ARIA quando necessário;
- touch target;
- leitura de preço;
- estado de erro;
- modais acessíveis.

---

## 75. COLOR SAFETY

Editor deve alertar quando contraste ficar inadequado.

---

## 76. MOTION

Motion deve respeitar `prefers-reduced-motion`.

---

# PARTE XVII — SEO VISUAL/ESTRUTURAL

## 77. HTML SEMÂNTICO

Theme deve produzir HTML semanticamente correto.

---

## 78. HEADINGS

Hierarquia de títulos deve ser coerente.

Editor não deve gerar múltiplos H1 arbitrários.

---

## 79. STRUCTURED DATA

Schema estruturado pode ser fornecido pela plataforma.

Theme não deve reimplementar isso sem necessidade.

---

## 80. CANONICAL / META

Dados técnicos de SEO pertencem ao storefront/platform contract.

Theme controla apresentação, não a verdade de canonical.

---

# PARTE XVIII — TEMAS COMERCIAIS

## 81. THEME STORE

A plataforma deve poder comercializar themes/templates.

---

## 82. THEME PRODUCT

Tema comercial pode possuir:

- nome;
- autor;
- preço;
- screenshots;
- demo;
- segmento;
- features;
- compatibilidade;
- versão;
- changelog;
- suporte.

---

## 83. FREE VS PAID

Tema pode ser:

- gratuito;
- premium;
- exclusivo;
- bundle;
- incluído em plano.

Licenciamento pertence à Platform Core/Billing.

---

## 84. INSTALL THEME

Instalar tema deve:

- validar compatibilidade;
- criar instance;
- preservar tema atual até publicação;
- permitir preview.

---

## 85. SWITCH THEME

Trocar tema não pode apagar conteúdo sem aviso.

A plataforma deve distinguir:

- conteúdo global da loja;
- configuração específica do tema.

---

## 86. THEME MIGRATION

Quando possível, mapear conteúdo compartilhável:

- logo;
- cores;
- menus;
- banners;
- coleções;
- páginas.

---

# PARTE XIX — SEGMENTOS

## 87. SEGMENT PRESETS

Temas podem ser preparados para segmentos.

Exemplos:

- moda;
- futebol;
- atacado;
- cosméticos;
- eletrônicos;
- autopeças;
- infantil.

---

## 88. SEGMENT NÃO É CORE

Segmento não deve criar novo Commerce Core.

Diferenças entram por:

- theme;
- template;
- components;
- capabilities;
- purchase experience;
- defaults.

---

## 89. MODA

Pode priorizar:

- editorial;
- fotografia;
- coleção;
- cor;
- tamanho;
- guia de medidas;
- look;
- produto relacionado.

---

## 90. ATACADO

Pode priorizar:

- densidade;
- grade;
- múltiplas quantidades;
- preço por faixa;
- compra rápida;
- repetição de pedido.

---

# PARTE XX — EDITOR EXPERIENCE

## 91. EDITOR UX

Editor visual deve reduzir ansiedade.

Precisa deixar claro:

- o que está sendo editado;
- o que está salvo;
- o que está publicado;
- o que mudou;
- como desfazer.

---

## 92. AUTO SAVE

Pode existir autosave para draft.

Nunca confundir autosave com publish.

---

## 93. UNSAVED CHANGES

Se autosave não existir, alertar sobre mudanças não salvas.

---

## 94. UNDO/REDO

Arquitetura deve permitir evolução para undo/redo.

---

## 95. COPY/PASTE

Futuro: copiar section/block entre páginas/themes compatíveis.

---

# PARTE XXI — GUARDRAILS

## 96. MAX WIDTH

Theme deve possuir regras de container.

Evitar conteúdo arbitrariamente largo.

---

## 97. IMAGE RATIOS

Cards devem trabalhar com aspect ratios controlados.

---

## 98. TEXT LIMITS

Algumas components podem impor limites ou truncation.

---

## 99. CTA SAFETY

Botões não devem desaparecer por contraste ruim.

---

## 100. EMPTY STATE

Section dinâmica deve ter comportamento quando não houver dados.

---

# PARTE XXII — EXTENSIBILIDADE VISUAL

## 101. APP BLOCKS

Arquitetura pode evoluir para permitir blocks de apps.

---

## 102. APP BLOCK CONTRACT

App block deve possuir:

- schema;
- render sandbox/control;
- permissions;
- performance budget;
- failure boundary.

---

## 103. EXTENSION POINTS

Storefront pode expor pontos controlados.

Exemplos:

- product.afterPrice;
- product.afterAddToCart;
- cart.beforeTotal;
- checkout limited extension points.

Checkout deve ter regras mais restritivas.

---

# PARTE XXIII — QUALIDADE DE THEME

## 104. THEME VALIDATION

Antes de theme ser publicado na Theme Store, validar:

- build;
- schema;
- accessibility;
- mobile;
- performance;
- contracts;
- empty states;
- error states;
- browser compatibility.

---

## 105. THEME CERTIFICATION

A NextLevel pode possuir nível de certificação para themes.

---

## 106. VISUAL QA

Testar páginas mínimas:

- home;
- collection;
- search;
- product;
- cart;
- content page;
- 404.

---

## 107. DATA QA

Testar:

- produto sem imagem;
- título longo;
- preço promocional;
- produto esgotado;
- muitas variantes;
- uma variante;
- zero resultado;
- coleção vazia.

---

# PARTE XXIV — LIÇÕES DA WBUY

## 108. CONTEÚDO ADMINISTRÁVEL

A pesquisa WBuy mostrou que banners e módulos editáveis precisam continuar administráveis.

Decisão:

> NextLevel não converterá conteúdo gerenciável em HTML estático apenas para melhorar aparência.

---

## 109. CONFLITO DE CSS

Foram observados conflitos entre customizações e estrutura nativa.

Decisão:

> Theme Engine terá contratos de componente, tokens, escopo de estilo e versionamento.

---

## 110. MOBILE

Foram observados problemas como:

- overflow;
- cards congestionados;
- galeria deficiente;
- desalinhamentos;
- sobreposição.

Decisão:

> responsividade será requisito do sistema visual, não responsabilidade improvisada de cada página.

---

## 111. THEME PACKAGE

A WBuy revelou sensibilidade a estrutura de pacote.

Decisão:

> NextLevel deve possuir manifest/schema formal de theme com validação antes da instalação.

---

## 112. GRID / PURCHASE EXPERIENCE

A WBuy revelou diferença entre `sku` e `grid`.

Decisão:

> Visual layer pode escolher componentes de compra diferentes, mas comportamento comercial vem do Commerce Core.

---

# PARTE XXV — IA E VISUAL

## 113. AI ASSISTANCE

IA pode auxiliar em:

- criação de identidade;
- sugestão de tokens;
- composição de home;
- seleção de seções;
- criação de conteúdo;
- geração de banners;
- adaptação de imagem;
- auditoria visual.

---

## 114. IA NÃO É RUNTIME

Resultado da IA deve virar configuração normal.

A loja não pode depender de chamada ao modelo para renderizar storefront.

---

## 115. AI SAFETY

Conteúdo gerado deve respeitar:

- direitos;
- política;
- qualidade;
- revisão do lojista;
- consistência de marca.

---

# PARTE XXVI — CONTRATOS DE DADOS VISUAIS

## 116. THEME CONFIG

Configuração visual deve ser validada por schema.

---

## 117. VERSIONED SCHEMA

Mudanças de schema precisam de migrations.

---

## 118. UNKNOWN SETTINGS

Ao atualizar theme, settings desconhecidos não devem ser descartados silenciosamente sem estratégia.

---

# PARTE XXVII — PUBLICAÇÃO E CACHE

## 119. PUBLISHED SNAPSHOT

Storefront pode consumir snapshot de configuração publicada.

---

## 120. CACHE INVALIDATION

Publish deve invalidar caches corretos.

Evitar purge global desnecessário.

---

## 121. ATOMICITY

Cliente nunca deve receber mistura de duas versões de configuração.

---

# PARTE XXVIII — TESTES

## 122. UNIT TESTS

Cobrir:

- schema;
- defaults;
- migrations;
- validation;
- responsive config.

---

## 123. INTEGRATION TESTS

Cobrir:

- draft;
- preview;
- publish;
- rollback;
- install;
- upgrade;
- theme switch.

---

## 124. VISUAL REGRESSION

Themes importantes devem possuir testes visuais.

---

## 125. ACCESSIBILITY TESTS

Automação + revisão manual onde necessário.

---

## 126. PERFORMANCE TESTS

Theme Store deve impor limites mínimos.

---

# PARTE XXIX — NÃO PERTENCE A ESTE DOCUMENTO

## 127. FORA DO VISUAL COMMERCE

Pertencem a outros documentos:

- regras de preço;
- pagamento;
- pedido;
- estoque;
- autenticação;
- RBAC;
- Platform Ops;
- billing;
- analytics detalhado;
- UX detalhada do painel;
- infraestrutura de deploy;
- provider adapters.

---

# PARTE XXX — OPEN QUESTIONS

## 128. QUESTÕES ABERTAS

Precisam de decisão futura:

- framework do theme runtime;
- formato final do manifest;
- linguagem/schema de settings;
- isolamento de CSS;
- editor drag-and-drop;
- component registry;
- app blocks;
- theme marketplace licensing;
- update automático;
- migration engine;
- visual diff;
- undo/redo;
- staging de theme;
- A/B testing visual;
- personalização por público;
- edge rendering;
- SSR/ISR strategy;
- custom code policy;
- custom CSS policy;
- custom JS policy.

Nenhuma dessas decisões deve ser inventada antes da necessidade.

---

# 129. REGRA FINAL

A Visual Commerce Platform precisa permitir que duas lojas sejam visualmente quase irreconhecíveis entre si e ainda utilizem o mesmo motor de comércio com segurança.

> **A identidade visual deve ser flexível.  
> O comportamento comercial deve permanecer coerente.  
> O editor deve dar liberdade sem entregar caos.  
> E nenhuma melhoria estética pode degradar compra, acessibilidade ou performance.**
