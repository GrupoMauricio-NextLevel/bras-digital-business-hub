# 06 — STOREFRONT UX & CONVERSION

> **Status:** Documento especializado de produto, UX e engenharia  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`, `03-PLATFORM-CORE.md`, `04-VISUAL-COMMERCE.md`, `05-MERCHANT-PANEL-UX.md`  
> **Escopo:** Experiência pública de compra da Plataforma de Lojas Virtuais NextLevel  
> **Não cobre:** regras internas do Commerce Core, engenharia detalhada de Theme Engine, Platform Ops, billing SaaS ou painel administrativo

---

# 1. OBJETIVO

Definir a experiência pública de compra da Plataforma NextLevel.

O storefront deve permitir que um consumidor:

- encontre rapidamente o que procura;
- entenda o produto;
- confie na loja;
- selecione a opção correta;
- compre sem fricção desnecessária;
- saiba preço, prazo, frete e condições;
- conclua o checkout com segurança;
- receba confirmação clara;
- acompanhe o pedido;
- retorne à loja com facilidade.

O objetivo é combinar:

**clareza + confiança + velocidade + conversão + acessibilidade + identidade visual.**

---

# 2. PRINCÍPIO CENTRAL

O storefront não deve obrigar o consumidor a entender a plataforma.

A experiência deve responder naturalmente:

1. Onde estou?
2. O que esta loja vende?
3. Como encontro o que quero?
4. Este produto serve para mim?
5. Quanto custa?
6. Tem disponível?
7. Quando chega?
8. Posso confiar?
9. Como compro?
10. O que acontece depois?

---

# 3. CONVERSÃO NÃO É MANIPULAÇÃO

A plataforma deve buscar conversão por:

- clareza;
- velocidade;
- confiança;
- relevância;
- boa apresentação;
- baixa fricção.

Não por:

- dark patterns;
- urgência falsa;
- escassez inventada;
- preço enganoso;
- consentimento escondido;
- dificuldade artificial de cancelar ou sair.

---

# PARTE I — JORNADA DE COMPRA

## 4. JORNADA PRINCIPAL

Jornada típica:

**Entrada → Descoberta → Avaliação → Seleção → Carrinho → Checkout → Pagamento → Confirmação → Acompanhamento → Pós-venda**

Cada etapa deve ser mensurável e diagnosticável.

---

## 5. PONTOS DE ENTRADA

Consumidor pode chegar por:

- home;
- produto;
- categoria;
- coleção;
- busca;
- campanha;
- link compartilhado;
- anúncio;
- rede social;
- blog/conteúdo;
- QR code;
- link direto.

Não assumir que todos começam pela home.

---

## 6. CONTINUIDADE

Cada ponto de entrada deve permitir continuar a jornada sem exigir navegação desnecessária.

---

# PARTE II — HOME

## 7. FUNÇÃO DA HOME

A home deve:

- comunicar identidade;
- mostrar proposta de valor;
- orientar descoberta;
- destacar categorias/produtos;
- transmitir confiança;
- conduzir à compra.

---

## 8. PRIORIDADE VISUAL

A primeira dobra deve evitar excesso de informação.

Priorizar:

- marca;
- proposta;
- principal ação;
- principal campanha ou categoria.

---

## 9. HERO

Hero deve possuir:

- propósito;
- mensagem clara;
- CTA;
- mídia adequada;
- comportamento mobile.

Não usar banner apenas como decoração.

---

## 10. VITRINES

Vitrines podem incluir:

- lançamentos;
- mais vendidos;
- promoções;
- coleções;
- categorias;
- recomendados.

Cada uma deve responder a uma intenção.

---

## 11. PROVA DE CONFIANÇA

Elementos possíveis:

- pagamento seguro;
- política de troca;
- avaliações;
- prazo;
- entrega;
- contato;
- reputação;
- informações institucionais.

Não sobrecarregar.

---

# PARTE III — NAVEGAÇÃO

## 12. HEADER

Header precisa preservar:

- logo;
- navegação;
- busca;
- carrinho;
- conta quando aplicável.

---

## 13. MENU

Menu deve refletir o catálogo real.

Evitar arquitetura baseada apenas em organização interna do lojista.

---

## 14. MEGA MENU

Pode ser útil para catálogos amplos.

Deve manter:

- escaneabilidade;
- hierarquia;
- foco;
- mobile alternative.

---

## 15. BREADCRUMB

Útil em:

- categoria;
- produto;
- páginas profundas.

Ajuda navegação e contexto.

---

## 16. STICKY HEADER

Pode melhorar acesso a busca/carrinho.

Não deve consumir espaço excessivo no mobile.

---

# PARTE IV — BUSCA

## 17. SEARCH

Busca é uma capacidade de conversão.

---

## 18. AUTOCOMPLETE

Pode mostrar:

- produtos;
- categorias;
- coleções;
- sugestões.

---

## 19. TYPO TOLERANCE

Busca deve tolerar variações razoáveis de escrita quando tecnicamente possível.

---

## 20. SEARCH RESULT

Resultados devem permitir:

- ordenação;
- filtros;
- paginação/infinite scroll;
- empty state;
- correção de termo.

---

## 21. ZERO RESULTS

Não encerrar jornada com:

`Nenhum resultado`

Preferir:

- sugestões;
- categorias;
- limpar filtros;
- produtos alternativos;
- busca corrigida.

---

# PARTE V — CATEGORIA E COLEÇÃO

## 22. PLP

Product Listing Page precisa favorecer comparação e descoberta.

---

## 23. CARD

Card deve comunicar:

- imagem;
- nome;
- preço;
- promoção;
- disponibilidade quando relevante;
- variações importantes quando útil.

---

## 24. IMAGE RATIO

Cards devem preservar consistência visual.

---

## 25. SECOND IMAGE

Pode melhorar descoberta em moda.

Deve ser opcional e performático.

---

## 26. QUICK VIEW

Pode existir quando realmente reduz fricção.

Não substituir PDP quando produto exige avaliação detalhada.

---

## 27. QUICK ADD

Útil para produtos simples.

Para variantes, precisa evitar seleção ambígua.

---

## 28. SORT

Opções possíveis:

- relevância;
- mais vendidos;
- lançamento;
- menor preço;
- maior preço;
- desconto.

---

## 29. FILTERS

Filtros devem refletir atributos reais.

Exemplos:

- tamanho;
- cor;
- preço;
- categoria;
- marca;
- disponibilidade.

---

## 30. MOBILE FILTERS

Usar drawer/modal.

Mostrar quantidade de filtros ativos.

---

## 31. FILTER FEEDBACK

Após filtrar:

- atualizar resultados;
- preservar scroll quando apropriado;
- mostrar loading localizado;
- permitir limpar.

---

# PARTE VI — PRODUCT DETAIL PAGE

## 32. PDP

PDP é uma das superfícies de maior impacto em conversão.

---

## 33. ABOVE THE FOLD

Priorizar:

- mídia;
- nome;
- preço;
- promoção;
- variantes;
- disponibilidade;
- quantidade;
- CTA;
- informação essencial de frete.

---

## 34. GALERIA

Deve suportar:

- swipe;
- zoom;
- thumbnails;
- mídia por variante;
- vídeo quando aplicável.

---

## 35. PREÇO

Mostrar de forma inequívoca:

- preço atual;
- preço anterior quando válido;
- desconto;
- parcelamento;
- Pix quando aplicável.

---

## 36. VARIANT SELECTOR

Seleção precisa:

- mostrar opções;
- indicar indisponível;
- manter seleção clara;
- atualizar mídia/preço/estoque quando necessário.

---

## 37. SIZE SELECTOR

Em moda:

- tamanhos claros;
- indisponíveis desabilitados;
- guia de medidas acessível;
- feedback da seleção.

---

## 38. COLOR SELECTOR

Pode usar:

- swatch;
- nome;
- imagem.

Não depender apenas de cor visual.

---

## 39. QUANTITY

Quantidade deve respeitar:

- estoque;
- mínimo;
- máximo;
- múltiplos;
- grade.

---

## 40. GRADE / MULTI-VARIANT PURCHASE

Quando habilitado:

- exibir matriz clara;
- permitir quantidade por variante;
- mostrar total de peças;
- total de valor;
- validação antes de adicionar.

---

## 41. ADD TO CART

CTA deve:

- ser proeminente;
- usar texto claro;
- mostrar loading;
- impedir duplicidade acidental;
- confirmar sucesso.

---

## 42. BUY NOW

Pode existir.

Não deve quebrar regras do carrinho/checkout.

---

## 43. OUT OF STOCK

Produto esgotado pode oferecer:

- aviso;
- variante alternativa;
- receber alerta;
- produto relacionado.

---

## 44. SHIPPING ESTIMATE

Pode permitir cálculo por CEP.

Resultado precisa mostrar:

- método;
- prazo;
- custo.

---

## 45. PRODUCT INFORMATION

Organizar:

- descrição;
- especificações;
- cuidados;
- medidas;
- políticas relevantes.

---

## 46. SOCIAL PROOF

Pode incluir:

- avaliações;
- quantidade vendida, se real;
- reviews;
- UGC autorizado.

Nunca inventar prova social.

---

## 47. RELATED PRODUCTS

Pode usar:

- categoria;
- coleção;
- comportamento;
- configuração manual.

---

## 48. CROSS SELL

Deve ser relevante.

Evitar distração antes do CTA principal.

---

# PARTE VII — CARRINHO

## 49. CART

Carrinho deve responder:

- o que estou comprando;
- qual variante;
- quantidade;
- preço;
- desconto;
- subtotal;
- frete;
- total.

---

## 50. CART DRAWER

Útil para confirmação rápida.

Não deve limitar acesso ao carrinho completo.

---

## 51. EDIT QUANTITY

Atualização deve fornecer feedback imediato.

---

## 52. REMOVE

Remoção deve ser clara.

Pode oferecer undo.

---

## 53. COUPON

Campo pode ser:

- visível;
- colapsado.

Não deve dominar a UI.

---

## 54. SHIPPING

Se calculado no carrinho, explicar que valor pode depender do endereço final.

---

## 55. CART VALIDATION

Carrinho deve reagir a:

- item esgotado;
- preço alterado;
- promoção encerrada;
- quantidade inválida.

---

## 56. CART PERSISTENCE

Carrinho deve persistir de forma coerente entre sessões quando possível.

---

# PARTE VIII — CHECKOUT UX

## 57. OBJETIVO

Checkout deve reduzir atrito sem reduzir segurança.

---

## 58. GUEST CHECKOUT

Quando o produto permitir, consumidor deve poder comprar sem criar conta antes.

---

## 59. LOGIN OPTIONAL

Cliente existente pode se identificar.

Não bloquear compra desnecessariamente.

---

## 60. CHECKOUT STRUCTURE

Pode ser:

- one-page;
- multi-step.

A decisão deve priorizar clareza e taxa de conclusão.

---

## 61. PROGRESS

Multi-step deve mostrar progresso.

---

## 62. FORM MINIMIZATION

Pedir apenas dados necessários.

---

## 63. ADDRESS

CEP pode auxiliar preenchimento no Brasil.

Sempre permitir correção manual.

---

## 64. DELIVERY METHOD

Mostrar:

- método;
- prazo;
- preço;
- contexto.

---

## 65. PAYMENT METHOD

Mostrar métodos disponíveis com clareza.

---

## 66. PIX

Pode incluir:

- QR;
- código copia e cola;
- status;
- expiração;
- atualização.

---

## 67. CARD

Deve indicar:

- parcelas;
- juros quando houver;
- total;
- erro de validação.

---

## 68. ORDER SUMMARY

Resumo deve permanecer acessível.

---

## 69. FINAL CTA

Texto explícito:

- Finalizar pedido;
- Pagar;
- Confirmar compra;

dependendo do fluxo.

---

## 70. DOUBLE SUBMIT

CTA deve impedir duplicidade.

---

## 71. PAYMENT PENDING

Não tratar pending como erro.

---

## 72. PAYMENT FAILURE

Mostrar:

- problema;
- possibilidade de tentar novamente;
- troca de método;
- preservação do pedido quando correto.

---

# PARTE IX — CONFIRMAÇÃO

## 73. SUCCESS PAGE

Deve mostrar:

- pedido;
- status;
- pagamento;
- próximos passos;
- acompanhamento;
- contato.

---

## 74. PIX PENDING PAGE

Pode atualizar status automaticamente.

---

## 75. EMAIL / MESSAGE

Confirmação deve ser enviada por canal apropriado.

---

# PARTE X — CONTA DO CLIENTE

## 76. ACCOUNT

Pode permitir:

- pedidos;
- endereços;
- perfil;
- senha;
- favoritos;
- consentimentos.

---

## 77. ORDER HISTORY

Mostrar:

- número;
- data;
- total;
- status;
- detalhes.

---

## 78. TRACKING

Acompanhamento deve ser simples.

---

# PARTE XI — PÓS-VENDA

## 79. AFTER SALES

Experiência continua após pagamento.

---

## 80. ORDER DETAIL

Cliente precisa entender:

- pagamento;
- envio;
- rastreio;
- itens;
- endereço;
- suporte.

---

## 81. CANCELLATION

Quando permitido, processo deve ser claro.

---

## 82. RETURN / EXCHANGE

Política e caminho devem ser facilmente encontrados.

---

## 83. REFUND STATUS

Cliente deve conseguir compreender andamento.

---

# PARTE XII — CONFIANÇA

## 84. TRUST

Confiança é construída por:

- consistência visual;
- HTTPS;
- dados da empresa;
- políticas;
- contato;
- pagamento conhecido;
- transparência;
- reviews reais;
- prazos claros.

---

## 85. SECURITY INDICATORS

Evitar ícones falsos ou selos sem origem.

---

## 86. CONTACT

Contato precisa ser fácil de encontrar.

---

## 87. POLICY PAGES

Manter:

- troca;
- privacidade;
- entrega;
- termos;
- pagamento.

---

# PARTE XIII — CONTEÚDO E COPY

## 88. COPY

Texto comercial deve ser:

- específico;
- escaneável;
- humano.

---

## 89. CTA

CTA precisa descrever ação.

---

## 90. PRODUCT DESCRIPTION

Priorizar benefício + informação útil.

---

## 91. MICROCOPY

Pode reduzir ansiedade.

Exemplo:

`Você poderá revisar antes de pagar.`

---

# PARTE XIV — MOBILE

## 92. MOBILE FIRST

A experiência mobile deve ser considerada padrão.

---

## 93. STICKY CTA

PDP mobile pode possuir CTA sticky.

---

## 94. THUMB REACH

Ações importantes devem estar acessíveis.

---

## 95. MOBILE MENU

Deve ser simples.

---

## 96. MOBILE CART

Resumo e checkout precisam evitar scroll confuso.

---

# PARTE XV — PERFORMANCE

## 97. CORE WEB VITALS

Storefront deve ser otimizado para:

- LCP;
- INP;
- CLS.

Metas específicas ficam em Quality Engineering.

---

## 98. ABOVE-THE-FOLD

Priorizar recurso crítico.

---

## 99. LAZY LOADING

Usar em conteúdo abaixo da dobra.

---

## 100. IMAGE OPTIMIZATION

Obrigatória.

---

## 101. THIRD PARTY

Scripts externos precisam ser controlados.

---

## 102. CLIENT JS

Minimizar JavaScript quando servidor/HTML resolvem.

---

# PARTE XVI — ACESSIBILIDADE

## 103. SEMANTICS

HTML correto.

---

## 104. KEYBOARD

Todos os fluxos essenciais devem funcionar por teclado.

---

## 105. FOCUS

Estado visível.

---

## 106. COLOR

Não depender apenas de cor.

---

## 107. ERROR

Erros de formulário precisam ser anunciados.

---

# PARTE XVII — SEO

## 108. SEO

Storefront precisa fornecer base técnica consistente.

---

## 109. PRODUCT SEO

Produto deve possuir:

- title;
- meta;
- canonical;
- structured data;
- URL estável.

---

## 110. CATEGORY SEO

Categoria/coleção também.

---

## 111. SITEMAP

Gerado pela plataforma.

---

## 112. INDEXATION

Controlar:

- rascunhos;
- filtros;
- buscas;
- páginas duplicadas.

---

# PARTE XVIII — ANALYTICS DE FUNIL

## 113. FUNNEL

Eventos podem incluir:

- view_item;
- search;
- view_collection;
- add_to_cart;
- begin_checkout;
- add_shipping_info;
- add_payment_info;
- purchase.

---

## 114. EVENT CONSISTENCY

Eventos devem possuir schema estável.

---

## 115. PURCHASE

Só emitir compra quando evento real estiver confirmado conforme regra definida.

---

## 116. DUPLICATION

Evitar pixel duplicando purchase em refresh.

---

# PARTE XIX — EXPERIMENTOS

## 117. A/B TEST

Pode ser suportado futuramente.

---

## 118. GUARDRAILS

Experimentos não podem:

- alterar preço de forma incoerente;
- quebrar acessibilidade;
- degradar checkout;
- gerar dark pattern.

---

# PARTE XX — PERSONALIZAÇÃO

## 119. PERSONALIZATION

Pode existir futuramente:

- vitrines personalizadas;
- recomendações;
- conteúdo por contexto.

---

## 120. FALLBACK

Sempre existir experiência padrão.

---

# PARTE XXI — INTERNACIONALIZAÇÃO

## 121. LOCALE

Storefront deve poder evoluir para:

- idioma;
- moeda;
- formatos;
- timezone.

---

## 122. COPY

Não concatenar textos de forma impossível de traduzir.

---

# PARTE XXII — ESTADOS

## 123. LOADING

Loading deve preservar layout.

---

## 124. EMPTY

Empty state útil.

---

## 125. ERROR

Erro deve permitir recuperação.

---

## 126. OFFLINE / DEGRADED

Quando possível, comunicar problema temporário.

---

# PARTE XXIII — ERROS DE COMPRA

## 127. OUT OF STOCK

Mensagem específica.

---

## 128. PRICE CHANGE

Se preço mudar:

- informar;
- revalidar;
- pedir confirmação quando necessário.

---

## 129. SHIPPING UNAVAILABLE

Explicar e oferecer alternativa.

---

## 130. PAYMENT ERROR

Não apagar carrinho.

---

# PARTE XXIV — ATACADO

## 131. WHOLESALE UX

Atacado pode exigir:

- grade;
- quantidade mínima;
- múltiplos;
- preço por faixa;
- total de peças;
- compra rápida.

---

## 132. GRID ENTRY

Matriz deve ser rápida no desktop e utilizável no mobile.

---

## 133. WHOLESALE SUMMARY

Mostrar:

- peças;
- subtotal;
- regra mínima;
- desconto.

---

# PARTE XXV — MODA

## 134. FASHION UX

Moda pode priorizar:

- fotografia;
- tamanho;
- cor;
- guia;
- coleção;
- editorial.

---

## 135. SIZE GUIDE

Acessível sem sair da PDP.

---

## 136. VARIANT IMAGE

Selecionar cor pode mudar galeria.

---

# PARTE XXVI — STORE BRAND

## 137. BRAND CONSISTENCY

Theme deve preservar identidade da loja em:

- header;
- card;
- PDP;
- cart;
- checkout quando permitido;
- email, quando integrado.

---

## 138. CHECKOUT BRANDING

Personalização deve respeitar segurança e legibilidade.

---

# PARTE XXVII — WHATSAPP / SOCIAL

## 139. SHARE

Produto pode ser compartilhado.

---

## 140. WHATSAPP

CTA de WhatsApp pode existir sem competir com compra principal.

---

## 141. SOCIAL PROOF

UGC e avaliações devem ser reais.

---

# PARTE XXVIII — FAVORITOS

## 142. WISHLIST

Pode existir.

---

## 143. GUEST WISHLIST

Pode usar armazenamento local e merge futuro.

---

# PARTE XXIX — RECOMENDAÇÕES

## 144. RECOMMENDATION ENGINE

Pode evoluir para:

- relacionados;
- complementares;
- vistos recentemente;
- personalizados.

---

## 145. FALLBACK RULES

Se motor inteligente falhar, usar regra determinística.

---

# PARTE XXX — ABANDONED CART

## 146. ABANDONMENT

Pode ser identificado conforme regras de privacidade.

---

## 147. RECOVERY

Recuperação deve levar ao carrinho real.

---

# PARTE XXXI — LIÇÕES DA WBUY

## 148. MOBILE

Pesquisa WBuy mostrou problemas de:

- overflow;
- cards congestionados;
- galeria;
- desalinhamento;
- sobreposição.

### Decisão NextLevel

Mobile é requisito de sistema, não correção posterior.

---

## 149. PRICE PRESENTATION

Foi observado risco de preço duplicado/mal posicionado em customizações.

### Decisão NextLevel

Price component deve possuir contrato único.

---

## 150. NATIVE FEATURES

Trabalhos WBuy exigiram preservar:

- preço;
- promoção;
- Pix;
- parcelamento;
- imagens;
- SKUs;
- variações;
- quantidade;
- frete;
- carrinho;
- login;
- favoritos;
- checkout;
- reviews;
- relacionados;
- filtros.

### Decisão NextLevel

Tema nunca deve quebrar feature de comércio nativa.

---

## 151. CONTENT ADMIN

Banners e módulos administráveis precisavam continuar editáveis.

### Decisão NextLevel

Storefront consome configuração, não HTML congelado.

---

# PARTE XXXII — MÉTRICAS DE CONVERSÃO

## 152. FUNNEL METRICS

Possíveis métricas:

- search success;
- PDP view rate;
- add-to-cart rate;
- cart-to-checkout;
- checkout completion;
- payment approval;
- conversion rate.

---

## 153. PERFORMANCE CORRELATION

Cruzar performance e conversão pode revelar degradação.

---

## 154. ERROR RATE

Monitorar erros por etapa.

---

# PARTE XXXIII — TESTES

## 155. E2E

Fluxos essenciais:

- navegar;
- buscar;
- filtrar;
- abrir produto;
- selecionar variante;
- adicionar;
- carrinho;
- checkout;
- pagamento simulado/test;
- sucesso.

---

## 156. MOBILE E2E

Executar viewport mobile.

---

## 157. ACCESSIBILITY

Testes automáticos + manuais.

---

## 158. VISUAL REGRESSION

Themes críticos.

---

## 159. EDGE CASES

Testar:

- título longo;
- imagem ausente;
- sem estoque;
- promoção;
- uma variante;
- muitas variantes;
- grade;
- cupom inválido;
- frete indisponível;
- pagamento falho.

---

# PARTE XXXIV — ANTI-PATTERNS

## 160. EVITAR

- modal de newsletter imediatamente;
- popups empilhados;
- autoplay invasivo;
- CTA concorrentes;
- menu excessivo;
- checkout cheio de distrações;
- preço escondido;
- frete descoberto só no fim sem necessidade;
- login obrigatório sem motivo;
- campo desnecessário;
- banner pesado;
- carrossel sem controle;
- urgência falsa.

---

# PARTE XXXV — O QUE NÃO PERTENCE AQUI

## 161. FORA DO STOREFRONT UX

Pertencem a outros documentos:

- máquina de pedido;
- payment domain;
- estoque interno;
- multi-tenancy;
- Theme Engine implementation;
- painel administrativo;
- Platform Ops;
- provider adapters;
- infraestrutura;
- billing SaaS.

---

# PARTE XXXVI — QUESTÕES ABERTAS

## 162. OPEN QUESTIONS

Precisam de validação:

- guest checkout final;
- one-page vs multi-step;
- login social;
- checkout branding;
- wishlist;
- reviews;
- Q&A;
- social commerce;
- recommendation engine;
- abandoned cart;
- personalização;
- A/B test;
- PWA;
- push;
- pickup;
- entrega local;
- assinatura;
- backorder;
- pre-order.

---

# 163. REGRA FINAL

O storefront NextLevel deve fazer a complexidade do comércio desaparecer para o consumidor.

> **A loja precisa ser rápida para entender, fácil para navegar, clara para decidir e simples para comprar.  
> O visual atrai.  
> A confiança sustenta.  
> A performance protege.  
> E a clareza converte.**
