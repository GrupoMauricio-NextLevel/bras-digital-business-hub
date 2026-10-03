# 07 — THEMES, TEMPLATES & SEGMENTS

> **Status:** Documento especializado de produto, visual e arquitetura  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`, `03-PLATFORM-CORE.md`, `04-VISUAL-COMMERCE.md`, `05-MERCHANT-PANEL-UX.md`, `06-STOREFRONT-UX-CONVERSION.md`  
> **Escopo:** Sistema de temas comercializáveis, templates reutilizáveis, presets por segmento e governança de compatibilidade visual/comercial  
> **Não cobre:** regras transacionais do Commerce Core, arquitetura interna do editor visual, UX administrativa detalhada ou integrações de provedores

---

# 1. OBJETIVO

Definir como a Plataforma NextLevel deve organizar, empacotar, distribuir, instalar, atualizar e comercializar temas e templates sem fragmentar o core do e-commerce.

Este documento existe para garantir que:

- temas sejam produtos reutilizáveis;
- templates possam atender nichos diferentes;
- segmentos tenham experiências próprias;
- a mesma loja possa trocar de tema sem perder o negócio;
- o core não dependa de um nicho específico;
- temas possam evoluir por versão;
- templates possam ser vendidos;
- conteúdo comercial e configuração visual não fiquem presos a uma implementação;
- a plataforma possa construir uma Theme Store coerente.

---

# 2. PRINCÍPIO CENTRAL

Tema é uma camada de experiência.

Segmento é uma camada de contexto.

Nenhum dos dois deve redefinir o Commerce Core.

A regra fundamental é:

> **Produto, preço, estoque, pedido e pagamento permanecem estáveis.  
> Tema, template, preset e segmento definem como essas capacidades são apresentadas e configuradas.**

---

# 3. DEFINIÇÕES

## 3.1 Theme

Sistema visual completo.

Inclui:

- tokens;
- templates;
- sections;
- blocks;
- component variants;
- defaults;
- settings;
- assets;
- schema;
- compatibilidade;
- versão.

---

## 3.2 Template

Composição visual para determinado tipo de página ou propósito.

Exemplos:

- home;
- PDP;
- categoria;
- landing page;
- atacado;
- editorial;
- campanha.

---

## 3.3 Preset

Configuração pronta baseada em um tema.

Exemplo:

Mesmo theme pode possuir presets:

- Futebol;
- Streetwear;
- Cosméticos;
- Infantil.

---

## 3.4 Segment

Contexto comercial ou de mercado.

Exemplos:

- moda;
- atacado;
- futebol;
- cosméticos;
- eletrônicos;
- autopeças;
- alimentos;
- beleza;
- infantil.

Segmento não é tenant type.

---

## 3.5 Theme Instance

Aplicação concreta de um tema em uma loja.

---

# PARTE I — THEME PACKAGE

## 4. MANIFEST

Todo theme deve possuir manifest formal.

Pode declarar:

- id;
- name;
- slug;
- version;
- author;
- description;
- engine compatibility;
- required capabilities;
- supported page types;
- available sections;
- available blocks;
- assets;
- migrations;
- preview data;
- changelog;
- license metadata.

---

## 5. PACKAGE VALIDATION

Antes da instalação, validar:

- manifest;
- versão;
- schema;
- integridade dos arquivos;
- dependências;
- capabilities;
- componentes;
- compatibilidade;
- segurança;
- tamanho;
- build.

---

## 6. PACKAGE STRUCTURE

A estrutura precisa ser previsível.

Exemplo conceitual:

- manifest;
- theme config;
- templates;
- sections;
- blocks;
- tokens;
- assets;
- migrations;
- preview metadata.

A estrutura real pertence à implementação.

---

## 7. COMPATIBILITY RANGE

Theme deve declarar versões compatíveis do Visual Commerce Engine.

Evitar instalação silenciosa em runtime incompatível.

---

## 8. REQUIRED CAPABILITIES

Theme pode depender de capacidades específicas.

Exemplo:

- wholesale;
- reviews;
- advanced_search;
- custom_sections.

Se capability faltar, instalação deve:

- bloquear;
- degradar com segurança;
- informar claramente.

Nunca quebrar em runtime.

---

# PARTE II — THEME STORE

## 9. THEME STORE

A plataforma deve poder oferecer catálogo de temas.

---

## 10. LISTING

Cada theme comercial pode exibir:

- nome;
- autor;
- preço;
- categoria;
- segmento;
- screenshots;
- demo;
- versão;
- features;
- compatibilidade;
- avaliações futuras;
- changelog.

---

## 11. PREVIEW BEFORE INSTALL

Lojista deve poder visualizar antes de instalar.

---

## 12. LIVE DEMO

Pode existir loja demo com catálogo fictício controlado.

---

## 13. SCREENSHOTS

Screenshots devem representar a experiência real.

Não usar mock enganoso.

---

## 14. LICENSE

Licença pode ser:

- gratuita;
- paga;
- incluída em plano;
- exclusiva;
- por loja;
- por organização.

Billing é responsabilidade do Platform Core.

---

## 15. THEME OWNERSHIP

A plataforma deve registrar quais lojas têm direito de uso.

---

# PARTE III — INSTALLATION

## 16. INSTALL

Instalar um tema deve:

- validar package;
- validar compatibilidade;
- validar entitlement;
- criar theme instance;
- preservar tema publicado atual;
- permitir configuração em draft.

---

## 17. INSTALL NÃO PUBLICA

Instalação não deve alterar automaticamente a loja pública.

---

## 18. STARTER CONFIG

Ao instalar, theme pode carregar:

- defaults;
- starter sections;
- starter content references;
- preset selecionado.

---

## 19. CONTENT SAFETY

Starter content não deve sobrescrever conteúdo real sem confirmação.

---

# PARTE IV — SWITCH THEME

## 20. TROCA DE TEMA

Trocar theme deve ser operação segura.

---

## 21. GLOBAL CONTENT VS THEME CONTENT

Separar:

### Global store content

Exemplos:

- logo;
- menus;
- páginas;
- coleções;
- banners reutilizáveis;
- informações institucionais.

### Theme-specific content

Exemplos:

- layout;
- section ordering;
- visual settings;
- component variants.

---

## 22. CONTENT MAPPING

Na troca de theme, mapear conteúdo compatível.

---

## 23. MISSING COMPONENT

Se novo theme não suporta um componente antigo:

- preservar no histórico;
- informar;
- sugerir substituição;
- não apagar silenciosamente.

---

## 24. SAFE SWITCH

Tema atual continua público até publish do novo.

---

# PARTE V — THEME UPDATE

## 25. UPDATE

Atualização deve ser separada de instalação.

---

## 26. VERSION CHANGE

Mudança de versão pode ser:

- patch;
- minor;
- major.

Semântica final deve ser definida pela engenharia.

---

## 27. AUTO UPDATE

Auto update só deve existir para mudanças seguras.

---

## 28. MAJOR UPDATE

Mudanças incompatíveis exigem:

- preview;
- migration;
- confirmação;
- fallback.

---

## 29. CHANGELOG

Theme deve informar o que mudou.

---

# PARTE VI — TEMPLATE LIBRARY

## 30. TEMPLATE CATALOG

Theme pode incluir múltiplos templates.

---

## 31. TEMPLATE TYPE

Tipos podem incluir:

- home;
- product;
- category;
- collection;
- search;
- cart;
- account;
- content;
- blog;
- campaign;
- wholesale;
- landing.

---

## 32. TEMPLATE VARIANT

Mesmo tipo pode possuir variantes.

Exemplo:

- PDP editorial;
- PDP minimal;
- PDP atacado;
- PDP high-conversion.

---

## 33. PAGE ASSIGNMENT

Loja deve poder associar template a:

- page type;
- produto;
- categoria;
- coleção;
- página específica.

---

## 34. FALLBACK TEMPLATE

Sempre existir fallback válido.

---

# PARTE VII — PRESETS

## 35. PRESET

Preset acelera setup.

Pode configurar:

- tokens;
- typography;
- spacing;
- sections;
- defaults;
- component variants;
- banner ratios;
- content order.

---

## 36. PRESET NÃO É THEME

Theme é sistema.

Preset é configuração inicial.

---

## 37. PRESET SWITCH

Aplicar outro preset não deve destruir conteúdo.

---

# PARTE VIII — SEGMENTS

## 38. SEGMENT MODEL

Segmento é classificação de experiência.

Pode influenciar:

- default theme;
- template;
- onboarding;
- sections recomendadas;
- filtros;
- atributos;
- purchase experience;
- analytics recommendations.

---

## 39. SEGMENT NÃO DEVE VIRAR CONDICIONAL GLOBAL

Evitar:

`if segment === "fashion"` espalhado pelo sistema.

Preferir:

- presets;
- capabilities;
- schemas;
- component variants;
- config;
- recommendations.

---

# PARTE IX — MODA

## 40. FASHION CHARACTERISTICS

Moda costuma exigir:

- fotografia forte;
- cor;
- tamanho;
- variantes;
- guia de medidas;
- coleções;
- editorial;
- lançamentos;
- produtos relacionados.

---

## 41. FASHION HOME

Pode priorizar:

- hero editorial;
- coleção;
- categorias visuais;
- vitrines;
- campanhas;
- lookbook.

---

## 42. FASHION PDP

Pode priorizar:

- galeria grande;
- variante por cor;
- tamanhos;
- guia;
- combinação de peças.

---

# PARTE X — FUTEBOL / SPORTS APPAREL

## 43. SPORTS CHARACTERISTICS

Pode priorizar:

- clubes/seleções;
- temporadas;
- linhas;
- torcedor/jogador;
- retrô;
- infantil;
- feminino;
- tamanhos.

---

## 44. SPORTS HOME

Pode utilizar:

- campeonatos;
- coleções;
- clubes;
- lançamentos;
- retrô;
- categorias visuais.

---

## 45. SPORTS FILTERS

Podem incluir:

- time;
- seleção;
- temporada;
- versão;
- gênero;
- tamanho.

---

# PARTE XI — ATACADO

## 46. WHOLESALE CHARACTERISTICS

Atacado costuma exigir:

- compra rápida;
- grade;
- preço por quantidade;
- mínimo;
- múltiplos;
- alta densidade;
- repetição;
- estoque por variante.

---

## 47. WHOLESALE PDP

Pode utilizar:

- matrix;
- quantity per SKU;
- total de peças;
- total financeiro;
- regra mínima;
- preço por faixa.

---

## 48. WHOLESALE PLP

Pode priorizar:

- lista compacta;
- quick order;
- disponibilidade;
- grade resumida;
- preço atacado.

---

# PARTE XII — COSMÉTICOS

## 49. BEAUTY CHARACTERISTICS

Pode priorizar:

- benefício;
- composição;
- modo de uso;
- resultado;
- rotina;
- reviews;
- kits.

---

## 50. BEAUTY HOME

Pode utilizar:

- problema/solução;
- coleção por necessidade;
- best sellers;
- kits;
- conteúdo educativo.

---

# PARTE XIII — ELETRÔNICOS

## 51. ELECTRONICS CHARACTERISTICS

Pode priorizar:

- especificações;
- comparação;
- garantia;
- voltagem;
- capacidade;
- acessórios;
- parcelamento.

---

## 52. ELECTRONICS PDP

Pode usar:

- spec table;
- comparison;
- warranty;
- accessory upsell.

---

# PARTE XIV — AUTOPEÇAS

## 53. AUTO CHARACTERISTICS

Pode exigir:

- compatibilidade;
- modelo;
- ano;
- versão;
- aplicação;
- SKU;
- especificação técnica.

---

## 54. FITMENT

Fitment é capacidade comercial específica e não deve ser improvisado em texto.

---

# PARTE XV — ALIMENTOS

## 55. FOOD CHARACTERISTICS

Pode priorizar:

- peso;
- composição;
- ingredientes;
- validade;
- alergênicos;
- kits;
- recorrência futura.

---

# PARTE XVI — INFANTIL

## 56. KIDS CHARACTERISTICS

Pode priorizar:

- idade;
- tamanho;
- medidas;
- material;
- segurança;
- kits.

---

# PARTE XVII — TEMPLATE QUALITY

## 57. QUALITY GATES

Antes de um template ser distribuído:

- schema válido;
- build válido;
- mobile validado;
- desktop validado;
- accessibility;
- performance;
- empty states;
- long content;
- no-image state;
- stock state;
- promo state;
- error state.

---

## 58. REFERENCE DATASET

A NextLevel deve manter catálogo de teste com casos variados.

Exemplos:

- produto simples;
- muitas variantes;
- sem imagem;
- promoção;
- esgotado;
- grade;
- título longo;
- descrição extensa.

---

## 59. VISUAL REGRESSION

Templates principais devem possuir baseline visual.

---

# PARTE XVIII — COMMERCIALIZATION

## 60. TEMPLATE ECONOMY

Theme Store pode ser fonte de receita.

---

## 61. PRICING

Tema pode ter:

- preço único;
- assinatura;
- bundle;
- incluso em plano;
- custom enterprise.

---

## 62. PREMIUM DIFFERENTIATION

Tema premium deve entregar valor real.

Exemplos:

- componentes exclusivos;
- layouts;
- presets;
- segment fit;
- advanced sections.

Não apenas trocar cores.

---

## 63. CUSTOM THEME

Pode existir serviço de customização baseado no mesmo engine.

---

## 64. AGENCY MODEL

Futuramente agências podem criar themes.

Isso exige:

- SDK;
- documentação;
- validação;
- review;
- licensing.

---

# PARTE XIX — THEME GOVERNANCE

## 65. APPROVAL

Themes externos precisam de aprovação antes da loja.

---

## 66. SECURITY REVIEW

Revisar:

- scripts;
- network access;
- unsafe HTML;
- XSS;
- tracking;
- data access.

---

## 67. PERFORMANCE REVIEW

Revisar bundle, scripts e mídia.

---

## 68. ACCESSIBILITY REVIEW

Revisar fluxo essencial.

---

# PARTE XX — CUSTOM CODE POLICY

## 69. CUSTOM CSS

Pode existir futuramente com limites.

---

## 70. CUSTOM JS

Muito mais restrito.

Não deve permitir:

- acesso a secrets;
- alterar pagamento;
- burlar checkout;
- exfiltrar dados.

---

## 71. SAFE EXTENSIONS

Preferir extension points controlados a código arbitrário.

---

# PARTE XXI — CONTENT PORTABILITY

## 72. CONTENT OWNERSHIP

Conteúdo de negócio deve sobreviver à troca de theme.

---

## 73. GLOBAL OBJECTS

Exemplos:

- menus;
- pages;
- banners;
- media;
- collections.

---

## 74. THEME CONFIG

Layout específico pertence ao theme instance.

---

# PARTE XXII — SEO COMPATIBILITY

## 75. THEME SEO CONTRACT

Theme precisa preservar:

- semantic HTML;
- headings;
- canonical hooks;
- structured data hooks;
- pagination semantics;
- accessible links.

---

# PARTE XXIII — PERFORMANCE COMPATIBILITY

## 76. PERFORMANCE CLASS

Theme pode receber classificação interna de performance.

---

## 77. HEAVY THEME

Tema pesado deve ser rejeitado ou sinalizado.

---

# PARTE XXIV — MOBILE QUALITY

## 78. MOBILE CERTIFICATION

Nenhum theme deve entrar na Theme Store sem teste mobile real.

---

## 79. RESPONSIVE ART DIRECTION

Templates devem prever mídia mobile própria quando necessário.

---

# PARTE XXV — CHECKOUT BOUNDARY

## 80. CHECKOUT OWNERSHIP

Checkout é área especialmente sensível.

Theme pode controlar:

- identidade;
- tokens limitados;
- logo;
- tipografia segura;
- espaçamento permitido.

Theme não deve controlar livremente:

- lógica de pagamento;
- total;
- validação;
- segurança;
- ordem transacional.

---

# PARTE XXVI — THEME ANALYTICS

## 81. THEME PERFORMANCE METRICS

A plataforma pode comparar:

- performance;
- conversion impact;
- error rate;
- adoption;
- uninstall rate.

---

## 82. NO FALSE CAUSALITY

Não afirmar que theme “causa” conversão sem evidência.

---

# PARTE XXVII — THEME SUPPORT

## 83. SUPPORT

Theme comercial precisa possuir:

- versão;
- changelog;
- autor;
- compatibilidade;
- suporte policy.

---

## 84. DEPRECATION

Theme antigo pode ser depreciado.

---

## 85. END OF LIFE

Fim de suporte deve ser comunicado.

---

# PARTE XXVIII — MIGRATION

## 86. THEME MIGRATION

Migração entre engines/versions deve ser planejada.

---

## 87. MIGRATION PREVIEW

Antes de migrar, mostrar incompatibilidades.

---

## 88. BACKUP

Config anterior deve ser preservada quando possível.

---

# PARTE XXIX — WBUY: APRENDIZADOS

## 89. THEME PACKAGE

A pesquisa WBuy mostrou dependência da estrutura correta do pacote.

### Decisão NextLevel

Formalizar manifest e validação.

---

## 90. ADMINISTRABLE CONTENT

Banners e módulos precisavam continuar editáveis.

### Decisão NextLevel

Conteúdo pertence à loja; tema apenas renderiza.

---

## 91. CSS COLLISION

Foram observados conflitos de classes e wrappers.

### Decisão NextLevel

Temas terão isolamento e contratos claros.

---

## 92. MOBILE FRAGILITY

Customizações produziram conflitos em mobile.

### Decisão NextLevel

Theme certification inclui responsividade.

---

## 93. GRID EXPERIENCE

WBuy revelou variações de compra por grade.

### Decisão NextLevel

Template pode renderizar experiência distinta, mas regra comercial permanece no Commerce Core.

---

# PARTE XXX — THEMES DA NEXTLEVEL

## 94. FIRST-PARTY THEMES

A NextLevel deve possuir themes próprios de referência.

Eles servem como:

- produto;
- benchmark interno;
- teste do engine;
- base de documentação;
- exemplo para parceiros.

---

## 95. REFERENCE THEME

Manter pelo menos um theme de referência simples, completo e altamente compatível.

---

## 96. PREMIUM REFERENCE THEME

Manter um theme premium para validar recursos avançados.

---

# PARTE XXXI — TEMPLATE NAMING

## 97. NAMING

Nomes devem evitar dependência de cliente.

Preferir:

- Fashion Editorial;
- Wholesale Grid;
- Sports Premium.

Evitar:

- Tema Capistrano;
- Tema Cliente X;

como identidade do produto reutilizável.

---

# PARTE XXXII — VERSIONING

## 98. VERSION POLICY

Versão deve ser legível e rastreável.

---

## 99. SCHEMA VERSION

Separar versão de package e versão de schema quando necessário.

---

## 100. ENGINE VERSION

Manifest deve declarar compatibilidade com engine.

---

# PARTE XXXIII — MARKETPLACE FUTURE

## 101. THIRD-PARTY MARKETPLACE

Pode permitir desenvolvedores externos.

---

## 102. REVIEW PIPELINE

Submissão pode passar por:

- automated checks;
- security review;
- design review;
- performance review;
- manual approval.

---

## 103. REVENUE SHARE

Modelo comercial futuro não pertence ao engine.

---

# PARTE XXXIV — DOCUMENTATION

## 104. THEME DOCS

Todo theme avançado precisa documentar:

- templates;
- sections;
- blocks;
- settings;
- limits;
- compatibility.

---

## 105. DEVELOPER DOCS

SDK futuro deve documentar contracts.

---

# PARTE XXXV — TESTES

## 106. INSTALL TEST

Cobrir:

- tema válido;
- inválido;
- capability faltando;
- versão incompatível.

---

## 107. SWITCH TEST

Troca sem perda de conteúdo.

---

## 108. UPDATE TEST

Atualização preserva settings.

---

## 109. ROLLBACK TEST

Rollback restaura versão anterior.

---

## 110. SEGMENT TEST

Preset específico não deve alterar core.

---

# PARTE XXXVI — ANTI-PATTERNS

## 111. EVITAR

- tema que contém regra de preço;
- tema que consulta banco diretamente;
- tema que altera order state;
- tema que depende de cliente específico;
- tema sem versionamento;
- tema que sobrescreve conteúdo global;
- HTML solto como configuração;
- CSS global irrestrito;
- JavaScript arbitrário;
- template que só funciona com catálogo perfeito;
- preset que apaga conteúdo;
- mudança automática em produção.

---

# PARTE XXXVII — O QUE NÃO PERTENCE AQUI

## 112. FORA DESTE DOCUMENTO

Pertencem a outros documentos:

- regra de produto;
- estoque;
- checkout core;
- payment domain;
- RBAC;
- lifecycle da loja;
- editor visual detalhado;
- painel administrativo;
- analytics engine;
- billing implementation;
- infrastructure;
- integrations.

---

# PARTE XXXVIII — QUESTÕES ABERTAS

## 113. OPEN QUESTIONS

Precisam de decisão futura:

- formato final do manifest;
- package registry;
- theme SDK;
- marketplace externo;
- licensing;
- revenue share;
- update policy;
- custom code;
- CSS sandbox;
- app blocks;
- certification levels;
- automated visual checks;
- template cloning;
- theme fork;
- agency publishing;
- theme localization;
- import/export de theme config;
- cross-store copying;
- theme A/B testing.

---

# 114. REGRA FINAL

Temas e templates devem ampliar o alcance da plataforma sem fragmentá-la.

> **O segmento muda a experiência.  
> O tema muda a identidade.  
> O template muda a composição.  
> O preset acelera a configuração.  
> O Commerce Core continua o mesmo.**
