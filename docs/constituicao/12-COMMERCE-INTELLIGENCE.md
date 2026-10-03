# 12 — COMMERCE INTELLIGENCE

> **Status:** Documento especializado de produto, dados e inteligência operacional  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md` até `11-QUALITY-ENGINEERING.md`  
> **Escopo:** Analytics, métricas, inteligência operacional, alertas, health, recomendações, prioridades e suporte à decisão do lojista  
> **Não cobre:** regras transacionais do Commerce Core, UX visual detalhada do painel, infraestrutura analítica definitiva ou modelo de IA específico

---

# 1. OBJETIVO

Definir como a Plataforma NextLevel transforma dados em entendimento e ação.

Commerce Intelligence deve ajudar o lojista a responder:

- O que aconteceu?
- O que está acontecendo agora?
- O que mudou?
- O que exige atenção?
- O que está bloqueando vendas?
- Onde existe risco?
- Onde existe oportunidade?
- Qual ação devo tomar primeiro?

A inteligência da plataforma não deve ser apenas um conjunto de gráficos.

Ela deve reduzir a carga cognitiva do lojista.

---

# 2. PRINCÍPIO CENTRAL

A arquitetura deve distinguir claramente:

## Analytics
Explica desempenho histórico.

## Operational Intelligence
Explica o estado atual da operação.

## Health
Explica se a infraestrutura comercial da loja está funcionando.

## Recommendations
Sugere ações baseadas em sinais válidos.

Essas quatro dimensões podem aparecer juntas no produto, mas não devem ser confundidas.

---

# 3. SINAL → CONTEXTO → AÇÃO

A unidade mínima de inteligência útil é:

1. sinal;
2. contexto;
3. impacto;
4. ação.

Exemplo ruim:

`12 produtos sem estoque`

Exemplo melhor:

`12 produtos estão sem estoque. 4 deles receberam vendas nos últimos 7 dias.`

Ação:

`Ver produtos`

---

# PARTE I — ANALYTICS

## 4. ANALYTICS

Analytics responde perguntas históricas.

Exemplos:

- vendas no período;
- pedidos;
- ticket médio;
- clientes;
- conversão;
- produtos vendidos;
- visitantes;
- canais;
- desempenho por categoria.

---

## 5. TIME RANGE

Toda métrica temporal precisa de intervalo explícito.

---

## 6. COMPARISON

Pode oferecer comparação com:

- período anterior;
- mesmo período anterior;
- meta;
- baseline.

---

## 7. METRIC DEFINITION

Toda métrica deve possuir definição formal.

Exemplo:

### Revenue
Soma de pedidos pagos ou faturados conforme regra definida.

Nunca usar nomes vagos sem definição.

---

## 8. SINGLE SOURCE OF METRIC DEFINITION

A definição de uma métrica deve existir uma única vez.

Dashboard, relatório e API não devem calcular de formas diferentes.

---

# PARTE II — OPERATIONAL INTELLIGENCE

## 9. OPERATIONAL STATE

Operational Intelligence responde:

> O que precisa da atenção do lojista agora?

---

## 10. OPERATIONAL SIGNALS

Exemplos:

- pedidos aguardando envio;
- pagamentos falhando;
- produtos sem estoque;
- estoque crítico;
- domínio com erro;
- integração desconectada;
- checkout degradado;
- importação falhou;
- theme draft não publicado;
- pedidos com atraso operacional.

---

## 11. NO TIME-RANGE DISTORTION

Filtros analíticos não devem esconder estado operacional atual.

---

# PARTE III — HEALTH

## 12. STORE HEALTH

Saúde da loja deve ser composta por dimensões.

Exemplos:

- Storefront Health;
- Checkout Health;
- Payment Health;
- Shipping Health;
- Domain Health;
- Integration Health;
- Security Health;
- Catalog Health.

---

## 13. HEALTH STATUS

Estados conceituais:

- HEALTHY;
- DEGRADED;
- WARNING;
- ERROR;
- UNKNOWN.

---

## 14. HEALTH IS NOT ANALYTICS

`Checkout Health = ERROR`

não depende do filtro:

`Últimos 30 dias`.

---

## 15. HEALTH EXPLANATION

Nunca mostrar apenas ícone vermelho.

Explicar:

- problema;
- impacto;
- última verificação;
- próxima ação.

---

# PARTE IV — ACTION CENTER

## 16. ACTION CENTER

A plataforma deve poder centralizar tarefas prioritárias.

---

## 17. ACTION ITEM

Pode conter:

- type;
- priority;
- title;
- description;
- impact;
- source;
- entity;
- action;
- created_at;
- resolved_at.

---

## 18. PRIORITY

Prioridade pode considerar:

- impacto financeiro;
- bloqueio de venda;
- urgência operacional;
- segurança;
- número de pedidos/clientes afetados.

---

## 19. CRITICAL FIRST

Exemplos de alta prioridade:

- checkout indisponível;
- gateway desconectado;
- domínio inválido;
- estoque inconsistente;
- pedido pago não processado.

---

## 20. RESOLUTION

Action item deve poder ser:

- resolved automatically;
- resolved by user;
- dismissed;
- snoozed;
- escalated.

---

# PARTE V — ALERT ENGINE

## 21. ALERT

Alert representa condição relevante detectada.

---

## 22. ALERT RULE

Pode ser baseada em:

- threshold;
- state;
- anomaly;
- event;
- duration;
- missing event.

---

## 23. EXAMPLES

- estoque abaixo de 3;
- payment error rate acima do normal;
- nenhum pedido por período anormal;
- domínio falhou;
- webhook não recebido;
- pedido parado por X horas.

---

## 24. ALERT DEDUPLICATION

Mesmo problema não deve gerar dezenas de notificações idênticas.

---

## 25. ALERT GROUPING

Alertas relacionados podem ser agrupados.

---

## 26. ALERT RESOLUTION

Quando condição volta ao normal, alerta deve resolver ou atualizar.

---

# PARTE VI — PRIORITIZATION

## 27. PRIORITY SCORE

A plataforma pode calcular prioridade interna.

---

## 28. INPUTS

Pode considerar:

- severity;
- revenue impact;
- customer impact;
- duration;
- recurrence;
- confidence.

---

## 29. EXPLAINABILITY

Prioridade deve ser explicável.

Evitar score opaco sem contexto.

---

# PARTE VII — RECOMMENDATIONS

## 30. RECOMMENDATION

Recomendação é diferente de alerta.

Alerta:

`Há um problema.`

Recomendação:

`Há uma oportunidade.`

---

## 31. EXAMPLES

- reposição de produto com alta demanda;
- criar promoção para item parado;
- melhorar frete em região com abandono;
- publicar produto incompleto;
- corrigir título ruim;
- ativar domínio próprio;
- adicionar imagem a produto sem mídia.

---

## 32. CONFIDENCE

Recomendação pode possuir nível de confiança.

---

## 33. NO FALSE CERTAINTY

Não afirmar causalidade sem evidência.

---

## 34. USER CONTROL

Lojista pode:

- aceitar;
- ignorar;
- ocultar;
- marcar como não relevante.

---

# PARTE VIII — KPI MODEL

## 35. KPI

KPI deve estar ligado a objetivo.

---

## 36. COMMERCE KPIS

Exemplos:

- GMV;
- revenue;
- orders;
- AOV;
- conversion rate;
- units per order;
- repeat purchase rate;
- refund rate;
- payment approval rate.

---

## 37. OPERATIONAL KPIS

Exemplos:

- fulfillment time;
- stockout rate;
- order aging;
- integration failure rate;
- checkout error rate.

---

## 38. CUSTOMER KPIS

Exemplos:

- new customers;
- returning customers;
- repeat rate;
- LTV futuro;
- retention.

---

# PARTE IX — FUNNEL

## 39. FUNNEL

Jornada pode ser representada por:

- visits;
- product views;
- add to cart;
- checkout;
- payment attempt;
- purchase.

---

## 40. FUNNEL DROP

A plataforma pode destacar perdas relevantes.

---

## 41. EVENT QUALITY

Funnel só é útil se tracking for consistente.

---

# PARTE X — SALES ANALYSIS

## 42. SALES BREAKDOWN

Pode analisar por:

- product;
- variant;
- category;
- collection;
- channel;
- campaign;
- customer segment;
- geography.

---

## 43. GROSS VS NET

Definição precisa ser explícita.

---

## 44. REFUNDS

Métricas líquidas devem considerar refund conforme regra definida.

---

# PARTE XI — PRODUCT INTELLIGENCE

## 45. PRODUCT PERFORMANCE

Sinais podem incluir:

- views;
- conversion;
- units sold;
- revenue;
- stockout;
- margin futura;
- return rate.

---

## 46. PRODUCT HEALTH

Produto pode ser classificado operacionalmente por:

- missing image;
- no price;
- no stock;
- unpublished;
- incomplete SEO;
- invalid variation;
- missing weight/dimensions.

---

## 47. CATALOG QUALITY

Pode gerar score operacional interno.

---

## 48. SCORE EXPLAINABILITY

Sempre mostrar por que.

---

# PARTE XII — INVENTORY INTELLIGENCE

## 49. STOCKOUT RISK

Pode usar:

- available;
- sales velocity;
- lead time futuro;
- demand trend.

---

## 50. LOW STOCK

Não depender apenas de threshold fixo.

---

## 51. DEAD STOCK

Pode identificar baixa movimentação.

---

## 52. REPLENISHMENT

Futuro: sugestão de reposição.

---

# PARTE XIII — ORDER INTELLIGENCE

## 53. ORDER AGING

Medir tempo em cada estado.

---

## 54. STUCK ORDER

Pedido fora do comportamento esperado pode gerar alerta.

---

## 55. SLA

Pode existir SLA operacional por etapa.

---

## 56. EXCEPTIONS

Exemplos:

- pago e não separado;
- etiqueta criada e não postada;
- envio sem atualização;
- refund pendente.

---

# PARTE XIV — PAYMENT INTELLIGENCE

## 57. PAYMENT APPROVAL

Monitorar aprovação.

---

## 58. FAILURE RATE

Anomalia de falha pode indicar:

- provider;
- antifraud;
- cartão;
- bug;
- configuração.

---

## 59. PROVIDER COMPARISON

Se houver múltiplos providers, comparar de forma justa.

---

## 60. RECONCILIATION SIGNAL

Divergência entre provider e plataforma gera alerta.

---

# PARTE XV — SHIPPING INTELLIGENCE

## 61. SHIPPING

Métricas podem incluir:

- average freight cost;
- delivery estimate;
- delay;
- carrier performance;
- abandonment by freight cost.

---

## 62. DELIVERY EXCEPTION

Atrasos e falhas podem ser sinalizados.

---

# PARTE XVI — CUSTOMER INTELLIGENCE

## 63. CUSTOMER SEGMENTATION

Pode existir por:

- recency;
- frequency;
- monetary value;
- first-time;
- repeat;
- high-value.

---

## 64. RFM

Pode ser adicionado futuramente.

---

## 65. PRIVACY

Segmentação deve respeitar consentimento e finalidade.

---

# PARTE XVII — MARKETING INTELLIGENCE

## 66. CAMPAIGN PERFORMANCE

Pode medir:

- clicks;
- sessions;
- conversion;
- revenue;
- CAC futuro;
- ROAS quando dados permitirem.

---

## 67. ATTRIBUTION

Modelo de atribuição deve ser explícito.

---

## 68. NO FALSE PRECISION

Atribuição possui limitações.

---

# PARTE XVIII — SEARCH INTELLIGENCE

## 69. SEARCH TERMS

Pode analisar:

- termos buscados;
- zero results;
- conversion after search;
- popular queries.

---

## 70. ZERO-RESULT OPPORTUNITY

Termos sem resultado podem indicar:

- produto faltando;
- sinônimo;
- erro de catalogação.

---

# PARTE XIX — STOREFRONT INTELLIGENCE

## 71. PAGE PERFORMANCE

Pode analisar:

- home;
- PDP;
- category;
- search;
- checkout.

---

## 72. PERFORMANCE CORRELATION

Cruzar Core Web Vitals com conversão pode gerar investigação.

---

# PARTE XX — THEME INTELLIGENCE

## 73. THEME HEALTH

Pode monitorar:

- errors;
- performance;
- broken blocks;
- publish failures.

---

## 74. THEME PERFORMANCE

Comparar themes sem afirmar causalidade indevida.

---

# PARTE XXI — INTEGRATION INTELLIGENCE

## 75. INTEGRATION HEALTH

Monitorar:

- auth;
- sync lag;
- failure rate;
- last success;
- webhook freshness.

---

## 76. ACTIONABLE ERROR

Exemplo:

`Mercado Pago desconectado`

→ `Reconectar`

---

# PARTE XXII — DOMAIN INTELLIGENCE

## 77. DOMAIN HEALTH

Monitorar:

- DNS;
- SSL;
- canonical;
- redirects.

---

# PARTE XXIII — SECURITY INTELLIGENCE

## 78. SECURITY SIGNALS

Pode incluir:

- new device;
- suspicious login;
- MFA off;
- API token old;
- critical role change.

---

# PARTE XXIV — ONBOARDING INTELLIGENCE

## 79. READINESS

A plataforma deve indicar:

- o que falta;
- impacto;
- prioridade;
- ação.

---

## 80. READINESS SCORE

Pode existir internamente.

Não deve esconder critérios.

---

# PARTE XXV — DATA MODEL

## 81. METRIC DEFINITION ENTITY

Pode representar:

- id;
- name;
- description;
- formula;
- dimensions;
- source;
- grain;
- version.

---

## 82. SIGNAL

Pode representar:

- type;
- store;
- entity;
- severity;
- status;
- detected_at;
- resolved_at;
- evidence.

---

## 83. RECOMMENDATION

Pode representar:

- source signal;
- rationale;
- action;
- confidence;
- lifecycle.

---

# PARTE XXVI — EVENT SOURCES

## 84. SOURCES

Commerce Intelligence pode consumir:

- domain events;
- platform events;
- analytics events;
- health checks;
- provider events;
- background jobs.

---

## 85. TRANSACTIONAL DATABASE

Não sobrecarregar banco transacional com analytics pesado quando escala crescer.

---

# PARTE XXVII — REAL TIME VS BATCH

## 86. REAL TIME

Necessário para:

- critical health;
- payment failures;
- checkout outage;
- order exceptions.

---

## 87. NEAR REAL TIME

Suficiente para:

- dashboard metrics;
- inventory recommendations.

---

## 88. BATCH

Adequado para:

- cohort;
- long-term trends;
- recommendations pesadas.

---

# PARTE XXVIII — DATA FRESHNESS

## 89. FRESHNESS

Toda métrica deve possuir expectativa de atualização.

---

## 90. LAST UPDATED

Quando relevante, exibir `Atualizado há X`.

---

## 91. STALE DATA

Dados desatualizados devem ser sinalizados.

---

# PARTE XXIX — ANOMALY DETECTION

## 92. ANOMALY

Pode detectar desvios de baseline.

---

## 93. EXAMPLES

- vendas caíram abruptamente;
- approval rate despencou;
- checkout errors subiram;
- nenhuma venda em período incomum.

---

## 94. SEASONALITY

Não tratar sazonalidade normal como incidente.

---

# PARTE XXX — AI INTELLIGENCE

## 95. AI ROLE

IA pode:

- resumir;
- explicar;
- priorizar;
- sugerir ações;
- gerar narrativa.

---

## 96. AI DOES NOT CREATE FACTS

IA deve consumir dados já calculados.

---

## 97. GROUNDING

Toda recomendação importante deve ser grounded em dados.

---

## 98. CONFIDENCE

IA deve reconhecer incerteza.

---

## 99. NO AUTO-ACTION BY DEFAULT

IA não deve executar ação crítica sem autorização explícita.

---

# PARTE XXXI — NATURAL LANGUAGE INSIGHTS

## 100. SUMMARY

Exemplo:

`As vendas cresceram 18% esta semana, puxadas pela categoria Retrô.`

---

## 101. TRACEABILITY

Narrativa deve permitir acessar dados que a sustentam.

---

# PARTE XXXII — NOTIFICATIONS

## 102. INTELLIGENCE TO NOTIFICATION

Nem todo insight vira notificação.

---

## 103. NOTIFICATION THRESHOLD

Só notificar quando:

- urgente;
- relevante;
- acionável.

---

## 104. DIGEST

Insights menores podem ir para resumo diário/semanal.

---

# PARTE XXXIII — USER PREFERENCES

## 105. PREFERENCES

Lojista pode escolher:

- alert types;
- channels;
- quiet hours;
- digest frequency.

---

# PARTE XXXIV — DASHBOARD COMPOSITION

## 106. DASHBOARD

Deve combinar:

- health;
- operations;
- analytics;
- opportunities.

---

## 107. HIERARCHY

Ordem padrão:

1. critical;
2. operational;
3. performance;
4. opportunity.

---

# PARTE XXXV — EXPLORATION

## 108. DRILL-DOWN

Toda métrica deve permitir investigar.

Exemplo:

`R$ 42.000 em vendas`

→ por produto, categoria, período, canal.

---

## 109. FILTERS

Filtros devem ser coerentes.

---

## 110. EXPORT

Relatórios podem ser exportados.

---

# PARTE XXXVI — SAVED REPORTS

## 111. REPORT

Pode existir relatório salvo.

---

## 112. SCHEDULE

Futuro: envio agendado.

---

# PARTE XXXVII — BENCHMARKING

## 113. STORE BENCHMARK

Futuro: comparar loja consigo mesma.

---

## 114. MARKET BENCHMARK

Comparação externa exige cuidado de privacidade e qualidade.

---

# PARTE XXXVIII — GOALS

## 115. GOAL

Lojista pode definir metas.

---

## 116. PROGRESS

Mostrar progresso.

---

## 117. NO GAMIFICATION ABUSE

Evitar métricas de vaidade.

---

# PARTE XXXIX — DATA QUALITY

## 118. BAD DATA

Insight ruim nasce de dado ruim.

---

## 119. DATA QUALITY SIGNAL

Pode detectar:

- missing events;
- duplicated events;
- stale integration;
- broken tracking.

---

## 120. TRUST INDICATOR

Métrica pode possuir estado:

- reliable;
- partial;
- delayed;
- unavailable.

---

# PARTE XL — PRIVACY

## 121. PRIVACY

Analytics deve respeitar:

- minimização;
- finalidade;
- consentimento;
- retenção.

---

## 122. PII

Evitar PII quando agregação basta.

---

# PARTE XLI — ACCESS CONTROL

## 123. ANALYTICS PERMISSION

Nem todo usuário precisa ver tudo.

---

## 124. FINANCIAL METRICS

Podem exigir permission própria.

---

# PARTE XLII — PERFORMANCE

## 125. ANALYTICS QUERY

Não bloquear painel.

---

## 126. PRECOMPUTE

Pode usar agregações.

---

## 127. CACHE

Cache apropriado.

---

# PARTE XLIII — FAILURE MODES

## 128. PARTIAL DATA

Se parte dos dados falhar, explicar.

---

## 129. NO FAKE ZERO

Falha não deve aparecer como `0`.

---

## 130. UNKNOWN

Usar estado desconhecido quando necessário.

---

# PARTE XLIV — WBUY: APRENDIZADOS

## 131. KPI DENSITY

O dashboard WBuy observado apresenta muitos KPIs simultaneamente.

### Decisão NextLevel

Priorizar atenção e ação antes de quantidade de widgets.

---

## 132. ANALYTICS VS OPERATION

A pesquisa mostrou separação prática entre filtros históricos e módulos operacionais.

### Decisão NextLevel

Essa separação será explícita na arquitetura.

---

## 133. STOCK ALERTS

Notificações de estoque esgotado foram observadas.

### Decisão NextLevel

Alertas devem nascer de sinais estruturados.

---

## 134. RECENT ORDERS

Módulo de pedidos recentes mostra valor de contexto operacional.

### Decisão NextLevel

Pedido recente é uma projeção operacional, não uma segunda fonte de verdade.

---

# PARTE XLV — TESTES

## 135. METRIC TESTS

Validar fórmulas.

---

## 136. EVENT TESTS

Validar tracking.

---

## 137. ALERT TESTS

Simular condições.

---

## 138. FALSE POSITIVE

Testar alertas indevidos.

---

## 139. FRESHNESS TEST

Validar atraso.

---

## 140. PERMISSION TEST

Métrica restrita não aparece indevidamente.

---

# PARTE XLVI — ANTI-PATTERNS

## 141. EVITAR

- dashboard só com cards;
- métrica sem definição;
- zero falso;
- alerta sem ação;
- recomendação sem evidência;
- IA inventando causalidade;
- filtro de período afetando operação atual;
- insight duplicado;
- notificação excessiva;
- score sem explicação;
- analytics como fonte de verdade;
- query pesada no banco transacional sem controle.

---

# PARTE XLVII — O QUE NÃO PERTENCE AQUI

## 142. FORA DE COMMERCE INTELLIGENCE

Pertencem a outros documentos:

- regras transacionais;
- UX visual detalhada;
- Theme Engine;
- Platform Ops técnico;
- provider adapters;
- security implementation;
- data warehouse final.

---

# PARTE XLVIII — OPEN QUESTIONS

## 143. QUESTÕES ABERTAS

Precisam de decisão conforme maturidade:

- event pipeline;
- analytics warehouse;
- BI tooling;
- anomaly detection engine;
- recommendation engine;
- AI model;
- reporting engine;
- scheduled reports;
- forecasting;
- LTV;
- cohort analysis;
- attribution model;
- benchmark externo;
- margin analytics;
- profitability;
- inventory forecasting;
- natural language analytics.

---

# 144. REGRA FINAL

Commerce Intelligence deve transformar a plataforma de sistema passivo em sistema que ajuda o lojista a decidir.

> **Dados mostram fatos.  
> Intelligence identifica significado.  
> Alertas mostram risco.  
> Recomendações mostram oportunidade.  
> E o produto deve sempre deixar claro por que está dizendo aquilo e qual ação faz sentido tomar.**
