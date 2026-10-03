# 05 — MERCHANT PANEL UX

> **Status:** Documento especializado de produto, UX e engenharia  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`, `03-PLATFORM-CORE.md`, `04-VISUAL-COMMERCE.md`  
> **Escopo:** Experiência administrativa do lojista dentro da Plataforma de Lojas Virtuais NextLevel  
> **Não cobre:** storefront público, Theme Engine detalhado, regras transacionais do Commerce Core, arquitetura interna de integrações ou Platform Ops interno

---

# 1. OBJETIVO

Definir como deve funcionar a experiência do lojista dentro da plataforma NextLevel.

O painel deve permitir que um usuário:

- entenda rapidamente o estado da loja;
- encontre qualquer área importante sem esforço;
- execute tarefas frequentes com poucos passos;
- configure a loja sem conhecimento técnico;
- identifique problemas antes que afetem vendas;
- opere pedidos, produtos, clientes e estoque com segurança;
- trabalhe no desktop e em mobile;
- compreenda claramente o que está salvo, publicado, pendente ou com erro;
- tenha confiança de que cada ação produziu o efeito esperado.

O painel não deve ser apenas visualmente bonito.

Ele deve ser uma **ferramenta operacional de alta produtividade**.

---

# 2. PRINCÍPIO CENTRAL

A pergunta principal do painel é:

> **“O que o lojista precisa entender ou fazer agora?”**

O painel deve priorizar:

1. clareza;
2. contexto;
3. ação;
4. feedback;
5. prevenção de erro.

Não priorizar densidade de informação sem propósito.

---

# 3. PAINEL NÃO É STOREFRONT

A experiência administrativa possui objetivos diferentes da loja pública.

O painel pode priorizar:

- densidade maior;
- tabelas;
- atalhos;
- filtros;
- busca;
- ações em massa;
- status;
- produtividade.

O storefront prioriza:

- descoberta;
- confiança;
- conversão;
- compra.

Não compartilhar padrões apenas por conveniência visual.

---

# PARTE I — ARQUITETURA DE INFORMAÇÃO

## 4. NAVEGAÇÃO PRINCIPAL

A navegação deve refletir o modelo mental do lojista.

Áreas conceituais podem incluir:

- Visão geral;
- Pedidos;
- Produtos;
- Estoque;
- Clientes;
- Marketing;
- Conteúdo;
- Loja virtual;
- Temas;
- Páginas;
- Domínios;
- Integrações;
- Relatórios;
- Configurações.

A nomenclatura final deve ser validada por uso real.

---

## 5. AGRUPAMENTO

Itens relacionados devem ser agrupados.

Evitar menus longos e planos com dezenas de opções no mesmo nível.

---

## 6. PROFUNDIDADE

Evitar navegação excessivamente profunda.

Uma tarefa comum não deve exigir atravessar múltiplos níveis sem necessidade.

---

## 7. ORIENTAÇÃO

O usuário precisa sempre saber:

- onde está;
- qual loja está operando;
- o que aquela página representa;
- como voltar;
- qual é a ação principal.

---

## 8. STORE CONTEXT

Se o usuário tiver acesso a múltiplas lojas, o contexto ativo deve ser evidente.

Troca de loja precisa ser clara e segura.

---

## 9. PAGE HEADER

Páginas importantes devem possuir header consistente com:

- título;
- descrição curta quando útil;
- ação primária;
- ações secundárias;
- filtros globais relevantes;
- contexto.

---

# PARTE II — SIDEBAR E TOPBAR

## 10. SIDEBAR

Sidebar deve:

- ser previsível;
- manter ordem estável;
- indicar item ativo;
- suportar colapso no desktop;
- funcionar bem no mobile;
- não esconder funções essenciais sem motivo.

---

## 11. TOPBAR

Pode concentrar:

- busca global;
- notificações;
- ajuda;
- contexto da loja;
- perfil;
- atalhos.

Evitar sobrecarga.

---

## 12. NAVEGAÇÃO POR TECLADO

Usuários avançados devem poder:

- abrir busca;
- navegar resultados;
- confirmar ações;
- fechar dialogs;
- acessar command palette.

---

# PARTE III — BUSCA GLOBAL

## 13. GLOBAL SEARCH

Busca deve localizar, conforme permitido:

- pedido;
- produto;
- SKU;
- cliente;
- página;
- configuração;
- integração;
- loja, quando aplicável.

---

## 14. COMMAND PALETTE

A busca pode evoluir para command palette.

Exemplos:

- Criar produto;
- Ver pedidos pendentes;
- Abrir configurações de domínio;
- Criar cupom;
- Publicar tema.

---

## 15. RESULT GROUPING

Resultados devem ser agrupados por entidade.

Exemplo:

- Pedidos;
- Produtos;
- Clientes;
- Configurações.

---

## 16. RECENT ITEMS

Pode exibir:

- buscas recentes;
- páginas recentes;
- ações frequentes.

---

# PARTE IV — DASHBOARD

## 17. DASHBOARD COMO CENTRAL DE DECISÃO

Dashboard não deve ser mural passivo de números.

Ele precisa responder:

- O que está acontecendo?
- O que mudou?
- O que precisa da minha atenção?
- O que está bloqueando vendas?
- Qual ação devo tomar?

---

## 18. ANALYTICS

Analytics responde:

> Como a loja performou?

Exemplos:

- vendas;
- pedidos;
- ticket médio;
- conversão;
- visitantes;
- produtos vendidos;
- evolução temporal.

---

## 19. OPERAÇÃO

Operação responde:

> O que precisa de atenção agora?

Exemplos:

- pedidos pendentes;
- pagamentos com problema;
- estoque crítico;
- produtos esgotados;
- domínio com erro;
- integração falhando;
- checkout indisponível.

---

## 20. SEPARAÇÃO ANALYTICS/OPERAÇÃO

Filtro de período analítico não deve alterar silenciosamente indicadores operacionais atuais.

Essa separação foi reforçada pelo estudo WBuy.

---

## 21. PRIORIDADE

Dashboard deve ordenar atenção por impacto.

Exemplo:

1. checkout indisponível;
2. pagamento falhando;
3. pedidos atrasados;
4. estoque crítico;
5. oportunidade comercial.

---

## 22. ACTION CARDS

Um alerta deve preferencialmente conter:

- sinal;
- contexto;
- impacto;
- ação.

Exemplo:

`8 pedidos aguardam envio`

→ `Ver pedidos`

---

## 23. MODULARIDADE

Widgets devem carregar independentemente quando apropriado.

Falha de um módulo secundário não deve derrubar o dashboard inteiro.

---

## 24. PERSONALIZAÇÃO

Personalização do dashboard pode existir futuramente.

Mas defaults precisam ser excelentes.

---

# PARTE V — LISTAGENS E DATATABLES

## 25. DATA TABLE

Tabelas são centrais para operação.

Devem possuir:

- headers claros;
- sorting;
- filtros;
- paginação;
- seleção;
- ações;
- estados;
- responsividade.

---

## 26. COLUNAS

Mostrar apenas informação útil para decisão.

Não adicionar coluna porque o dado existe.

---

## 27. COLUMN CUSTOMIZATION

Usuários avançados podem futuramente escolher colunas.

Persistir preferências por usuário/loja quando fizer sentido.

---

## 28. STICKY CONTEXT

Em tabelas largas, considerar:

- coluna principal fixa;
- header sticky;
- ações acessíveis.

---

## 29. ROW ACTIONS

Ações de linha devem seguir ordem consistente.

Ação destrutiva deve ser visualmente distinta.

---

## 30. BULK ACTIONS

Quando aplicável:

- publicar;
- despublicar;
- alterar categoria;
- ajustar status;
- exportar;
- arquivar.

Ações em massa precisam mostrar alcance.

---

## 31. BULK CONFIRMATION

Ação de grande impacto deve indicar:

- quantidade de itens;
- operação;
- consequências;
- possibilidade de desfazer quando existir.

---

# PARTE VI — FILTROS

## 32. FILTER BAR

Filtros devem ser consistentes entre módulos.

---

## 33. ACTIVE FILTERS

Usuário deve enxergar filtros ativos.

---

## 34. CLEAR FILTERS

Sempre oferecer forma simples de limpar.

---

## 35. SAVED VIEWS

Pode evoluir para views salvas.

Exemplo:

- Pedidos para enviar;
- Produtos sem estoque;
- Clientes VIP.

---

## 36. FILTER URL STATE

Quando apropriado, estado de filtros pode estar na URL para:

- compartilhar;
- voltar;
- refresh;
- histórico.

---

# PARTE VII — FORMULÁRIOS

## 37. FORM DESIGN

Formulário deve seguir ordem mental do usuário.

---

## 38. FIELD GROUPING

Agrupar campos por significado.

Exemplo produto:

- Informações básicas;
- Mídia;
- Preço;
- Variantes;
- Estoque;
- Frete;
- SEO;
- Publicação.

---

## 39. PRIMARY ACTION

Ação principal deve ser evidente.

---

## 40. SAVE BEHAVIOR

Deve ficar claro se:

- salva automaticamente;
- exige salvar;
- publica automaticamente;
- permanece rascunho.

Nunca confundir `Salvar` com `Publicar`.

---

## 41. VALIDATION

Validação deve ocorrer:

- cedo para erros simples;
- no servidor para verdade final.

---

## 42. ERROR LOCATION

Erro precisa aparecer próximo ao campo e também em resumo quando necessário.

---

## 43. LONG FORMS

Formulários grandes podem utilizar:

- sections;
- tabs;
- accordion;
- sticky summary;
- side navigation.

Evitar página interminável sem estrutura.

---

## 44. DANGEROUS SETTINGS

Configurações destrutivas devem ficar separadas.

---

# PARTE VIII — CRIAÇÃO E EDIÇÃO DE PRODUTO

## 45. PRODUCT EDITOR

Produto deve ter edição clara sem expor complexidade desnecessária.

---

## 46. BASIC MODE

Usuário simples deve conseguir criar produto com poucos campos.

---

## 47. ADVANCED MODE

Recursos avançados podem ser expostos progressivamente:

- SEO;
- atributos;
- regras;
- dimensões;
- metadata;
- integrações.

---

## 48. VARIANT MATRIX

Produtos com variações devem permitir editar:

- SKU;
- preço;
- estoque;
- status;
- barcode;
- imagem.

---

## 49. BULK VARIANT EDIT

Deve existir caminho eficiente para muitas variantes.

---

## 50. GRADE UX

Para atacado/grade, painel deve representar claramente:

- tamanhos;
- quantidades;
- composição;
- regras de compra.

---

# PARTE IX — PEDIDOS

## 51. ORDER LIST

Lista de pedidos deve facilitar operação.

Priorizar:

- número;
- cliente;
- data;
- valor;
- pagamento;
- fulfillment;
- status;
- ação.

---

## 52. ORDER DETAIL

Detalhe precisa organizar:

- itens;
- cliente;
- endereço;
- pagamento;
- entrega;
- timeline;
- notas;
- ações;
- histórico.

---

## 53. TIMELINE

Timeline deve representar eventos reais.

Exemplos:

- pedido criado;
- pagamento aprovado;
- separação iniciada;
- etiqueta criada;
- enviado;
- entregue;
- cancelado;
- reembolsado.

---

## 54. ACTION AVAILABILITY

Ação disponível deve respeitar estado e permissão.

Não exibir ação impossível apenas para retornar erro depois.

---

## 55. REFUND UX

Reembolso deve mostrar:

- valor;
- itens;
- motivo;
- consequências;
- método;
- confirmação.

---

# PARTE X — ESTOQUE

## 56. INVENTORY VIEW

Estoque deve permitir entender:

- SKU;
- produto;
- on hand;
- reserved;
- available;
- status.

---

## 57. STOCK MOVEMENT UX

Histórico precisa mostrar:

- quando;
- quem;
- motivo;
- quantidade;
- saldo;
- origem.

---

## 58. ADJUSTMENT

Ajuste manual deve exigir:

- quantidade;
- tipo;
- motivo;
- confirmação.

---

## 59. LOW STOCK

Alertas precisam ser acionáveis.

---

# PARTE XI — CLIENTES

## 60. CUSTOMER LIST

Lista deve permitir:

- busca;
- filtros;
- total de pedidos;
- gasto;
- data última compra;
- status.

---

## 61. CUSTOMER DETAIL

Pode organizar:

- dados;
- endereços;
- pedidos;
- consentimentos;
- notas;
- timeline;
- segmentos.

---

## 62. PRIVACY

Dados sensíveis devem ser exibidos apenas quando necessário.

---

# PARTE XII — MARKETING

## 63. MARKETING HUB

Recursos de marketing devem ser agrupados por objetivo.

Exemplos:

- cupons;
- promoções;
- campanhas;
- carrinho abandonado;
- pixels;
- feeds;
- integração social.

---

## 64. CAMPAIGN STATUS

Status deve ser claro:

- draft;
- scheduled;
- active;
- ended.

---

## 65. ATTRIBUTION CLARITY

Não apresentar métricas de marketing sem definição.

---

# PARTE XIII — CONFIGURAÇÕES

## 66. SETTINGS IA

Configurações devem ser organizadas por domínio.

Exemplos:

- Loja;
- Pagamentos;
- Frete;
- Checkout;
- Domínio;
- Usuários;
- Segurança;
- Integrações;
- Notificações;
- SEO;
- Billing.

---

## 67. SETTINGS SEARCH

Configurações extensas devem ser pesquisáveis.

---

## 68. SETTINGS HEALTH

Configuração crítica pode mostrar status:

- conectado;
- incompleto;
- erro;
- atenção.

---

# PARTE XIV — ONBOARDING

## 69. ONBOARDING

Onboarding deve orientar o lojista até a primeira venda.

---

## 70. CHECKLIST

Pode incluir:

- dados da loja;
- identidade;
- produto;
- pagamento;
- frete;
- domínio;
- tema;
- teste;
- publicação.

---

## 71. PROGRESS

Mostrar progresso real.

Não criar porcentagem artificial sem critério.

---

## 72. SKIPPABLE

Etapas não obrigatórias devem poder ser puladas.

---

## 73. RESUME

Lojista deve poder sair e continuar depois.

---

## 74. FIRST SALE MOMENT

A plataforma deve reconhecer primeira venda como marco de ativação.

---

# PARTE XV — EMPTY STATES

## 75. EMPTY STATE

Estado vazio precisa ensinar.

Não apenas:

`Nenhum produto.`

Preferir:

- explicar;
- indicar benefício;
- oferecer ação.

---

## 76. FIRST-TIME EMPTY

Pode ser diferente de:

`nenhum resultado para este filtro`.

---

## 77. SEARCH EMPTY

Explicar que a busca não encontrou resultado.

Oferecer limpar filtros.

---

# PARTE XVI — LOADING

## 78. LOADING STATES

Evitar spinner global quando apenas parte da página está carregando.

---

## 79. SKELETONS

Usar skeleton quando ajuda a preservar layout.

---

## 80. OPTIMISTIC UI

Pode ser usada para ações seguras e reversíveis.

Nunca mascarar operação crítica não confirmada.

---

# PARTE XVII — ERROS

## 81. ERROR MESSAGE

Erro precisa ser:

- humano;
- específico;
- acionável.

---

## 82. TECHNICAL DETAILS

Detalhes técnicos podem estar disponíveis para suporte, não necessariamente para usuário comum.

---

## 83. RETRY

Quando possível oferecer retry.

---

## 84. PARTIAL FAILURE

Se um módulo falhar, preservar o restante da página.

---

# PARTE XVIII — FEEDBACK

## 85. TOAST

Toast serve para confirmação breve.

---

## 86. INLINE FEEDBACK

Mudança importante deve possuir feedback no próprio contexto.

---

## 87. PROGRESS FEEDBACK

Operações longas precisam mostrar progresso/status.

---

## 88. SUCCESS STATE

Não exagerar em celebrações para tarefas rotineiras.

---

# PARTE XIX — CONFIRMAÇÕES

## 89. CONFIRMATION DIALOG

Não usar confirmação para tudo.

---

## 90. DESTRUCTIVE ACTION

Ações destrutivas exigem confirmação proporcional ao risco.

---

## 91. HIGH-RISK ACTION

Pode exigir:

- digitar nome;
- reautenticar;
- 2FA;
- justificativa.

---

# PARTE XX — UNDO

## 92. UNDO FIRST

Quando possível, preferir ação reversível a confirmação excessiva.

Exemplo:

`Produto arquivado — Desfazer`

---

# PARTE XXI — NOTIFICAÇÕES

## 93. NOTIFICATION CENTER

Notificação deve representar evento estruturado.

---

## 94. PRIORITY

Classificar:

- critical;
- warning;
- info;
- success.

---

## 95. ACTIONABLE

Notificação operacional deve levar ao contexto correto.

---

## 96. READ STATE

Estado lido/não lido não substitui resolução do problema.

---

# PARTE XXII — ATIVIDADE

## 97. ACTIVITY LOG

Lojista pode precisar ver:

- quem alterou;
- o quê;
- quando.

---

## 98. DIFFERENCE FROM NOTIFICATION

Activity log registra fatos.

Notification chama atenção.

---

# PARTE XXIII — AJUDA

## 99. CONTEXTUAL HELP

Ajuda deve aparecer no contexto da tarefa.

---

## 100. DOCUMENTATION LINKS

Pode oferecer documentação aprofundada.

---

## 101. TOOLTIP

Tooltip explica algo curto.

Não usar tooltip para esconder instrução essencial.

---

## 102. SUPPORT HANDOFF

Se o usuário precisar de suporte, contexto relevante deve poder acompanhar o chamado.

---

# PARTE XXIV — MOBILE ADMIN

## 103. MOBILE PRIORITIES

No celular priorizar tarefas como:

- ver pedidos;
- atualizar pedido;
- consultar produto;
- consultar estoque;
- ver alertas;
- responder operação urgente.

---

## 104. MOBILE TABLES

Tabela desktop não deve simplesmente ser espremida.

Usar:

- cards;
- priority columns;
- horizontal scroll controlado;
- disclosure.

---

## 105. MOBILE ACTIONS

CTA crítico precisa permanecer acessível.

---

# PARTE XXV — ACCESSIBILITY

## 106. ACCESSIBILITY

Painel deve suportar:

- teclado;
- foco;
- contraste;
- labels;
- leitores de tela;
- modal acessível;
- tabelas semânticas;
- feedback de erro.

---

## 107. DENSITY VS ACCESSIBILITY

Densidade não pode comprometer target size e legibilidade.

---

# PARTE XXVI — DESIGN SYSTEM DO PAINEL

## 108. ADMIN DESIGN SYSTEM

Deve incluir:

- Button;
- Input;
- Select;
- Combobox;
- Checkbox;
- Radio;
- Switch;
- Tabs;
- Dialog;
- Drawer;
- Dropdown;
- Table;
- DataTable;
- Badge;
- StatusBadge;
- Card;
- MetricCard;
- ActionCard;
- EmptyState;
- ErrorState;
- Skeleton;
- Toast;
- Pagination;
- DateRange;
- Search;
- CommandPalette.

---

## 109. SEMANTIC STATUS

Cor não é o status.

Domain state é semântico.

Design System mapeia aparência.

---

## 110. CONSISTENCY

O mesmo padrão deve se comportar igual em todas as áreas.

---

## 111. DENSITY MODES

Pode existir:

- comfortable;
- compact.

Útil para operação intensa.

---

# PARTE XXVII — LINGUAGEM

## 112. MICROCOPY

Texto deve ser:

- direto;
- específico;
- humano;
- consistente.

---

## 113. JARGON

Evitar jargão técnico quando houver termo de negócio claro.

---

## 114. BUTTON LABELS

Preferir verbo + objeto.

Exemplo:

- Criar produto;
- Publicar tema;
- Enviar pedido.

Evitar `OK` quando ação é específica.

---

## 115. ERROR COPY

Explicar causa quando conhecida.

---

# PARTE XXVIII — PERMISSÃO NA UI

## 116. PERMISSION-AWARE UI

UI deve refletir permissão.

---

## 117. HIDDEN VS DISABLED

### Hidden
Usuário não precisa saber que existe.

### Disabled
Usuário pode entender recurso, mas não pode executar.

Escolha deve ser consciente.

---

## 118. CAPABILITY LOCK

Recurso não incluso pode mostrar contexto comercial sem comprometer UX.

Evitar transformar painel inteiro em upsell.

---

# PARTE XXIX — PERFORMANCE DO PAINEL

## 119. PAGE LOAD

Carregar primeiro o que permite ação.

---

## 120. PAGINATION

Grandes listas devem paginar ou virtualizar adequadamente.

---

## 121. PREFETCH

Pode prefetch rotas frequentes.

---

## 122. CACHING

Cache não pode exibir dados de outro tenant.

---

# PARTE XXX — PERSONALIZAÇÃO

## 123. USER PREFERENCES

Pode persistir:

- density;
- columns;
- saved views;
- sidebar state;
- default filters.

---

## 124. STORE PREFERENCES

Configuração compartilhada da loja não deve ser confundida com preferência pessoal.

---

# PARTE XXXI — PRODUTIVIDADE

## 125. KEYBOARD SHORTCUTS

Pode suportar atalhos.

---

## 126. RECENTLY VIEWED

Itens recentes ajudam operação.

---

## 127. QUICK CREATE

Ações rápidas podem existir:

- produto;
- pedido manual;
- cupom;
- cliente.

---

## 128. DUPLICATE

Duplicação segura pode acelerar:

- produto;
- promoção;
- página;
- tema config.

---

# PARTE XXXII — WBUY: LIÇÕES DIRETAS

## 129. DENSIDADE

O dashboard WBuy observado apresenta muitos elementos simultaneamente.

### Decisão NextLevel

Priorizar informação acionável antes de densidade.

---

## 130. ANALYTICS VS OPERAÇÃO

A pesquisa reforçou separação entre período analítico e estado operacional.

### Decisão NextLevel

Dashboard deve deixar essa diferença visualmente explícita.

---

## 131. MODULARIDADE

Widgets WBuy carregavam separadamente.

### Decisão NextLevel

Adotar módulos independentes quando isso melhorar resiliência.

---

## 132. NOTIFICAÇÃO COMO HTML

Foi observado endpoint retornando fragmento HTML.

### Decisão NextLevel

Notificações devem utilizar dados estruturados.

---

## 133. STATUS COM COR NO BACKEND

Foi observado status com metadados visuais.

### Decisão NextLevel

Status permanece semântico; Design System controla visual.

---

# PARTE XXXIII — MÉTRICAS DE UX

## 134. UX METRICS

Podem ser avaliadas:

- tempo para primeira venda;
- tempo para criar produto;
- taxa de conclusão do onboarding;
- erros por fluxo;
- abandono de configuração;
- uso de busca;
- frequência de ações manuais;
- tempo de resolução operacional.

---

## 135. PRODUCT TELEMETRY

Telemetria deve servir melhoria de produto e respeitar privacidade.

---

# PARTE XXXIV — TESTES

## 136. UX FLOW TESTS

Cobrir fluxos principais:

- criar produto;
- publicar;
- operar pedido;
- configurar pagamento;
- configurar frete;
- configurar domínio;
- publicar loja.

---

## 137. ROLE TESTS

Verificar experiência por role.

---

## 138. MOBILE TESTS

Testar tarefas críticas em mobile.

---

## 139. ACCESSIBILITY TESTS

Automação + validação manual.

---

## 140. VISUAL REGRESSION

Componentes do painel podem ter regressão visual.

---

# PARTE XXXV — O QUE NÃO PERTENCE A ESTE DOCUMENTO

## 141. FORA DO MERCHANT PANEL UX

Pertencem a outros documentos:

- regras de estoque;
- price engine;
- checkout core;
- pagamentos;
- Theme Engine;
- storefront UX detalhada;
- Platform Ops;
- segurança técnica detalhada;
- infraestrutura;
- adapters de integração;
- analytics engine detalhado.

---

# PARTE XXXVI — QUESTÕES ABERTAS

## 142. OPEN QUESTIONS

Precisam de validação futura:

- IA final do menu;
- nomes definitivos dos módulos;
- command palette;
- saved views;
- density modes;
- dashboard personalizável;
- mobile admin completo;
- atalhos de teclado;
- AI assistant no painel;
- help center integrado;
- support chat;
- onboarding adaptativo;
- tours guiados;
- contextual recommendations.

Nenhuma dessas decisões deve ser congelada sem evidência.

---

# 143. REGRA FINAL

O painel NextLevel deve permitir que o lojista opere uma loja complexa sem sentir que está operando um sistema complexo.

> **A complexidade pertence à plataforma.  
> A clareza pertence ao usuário.  
> O painel deve mostrar o que importa, explicar o que aconteceu e oferecer a próxima ação correta.**
