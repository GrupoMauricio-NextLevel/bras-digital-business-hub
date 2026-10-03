# 11 — QUALITY ENGINEERING

> **Status:** Documento especializado de qualidade, validação e entrega  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md` até `10-SECURITY-RELIABILITY.md`  
> **Escopo:** Definition of Done, estratégia de testes, validação funcional, qualidade visual, acessibilidade, performance, segurança, regressão, CI/CD, revisão e critérios de aceite  
> **Não cobre:** roadmap comercial, estratégia de produto ou implementação específica de cada módulo

---

# 1. OBJETIVO

Definir o que significa entregar software de qualidade na Plataforma NextLevel.

Uma funcionalidade não está pronta porque:

- compila;
- aparece na tela;
- funciona no happy path;
- passou em um teste manual;
- foi publicada.

Ela está pronta quando seu comportamento é:

- correto;
- seguro;
- consistente;
- observável;
- testável;
- acessível;
- responsivo;
- performático;
- resiliente;
- compatível com o domínio;
- livre de efeitos colaterais críticos.

---

# 2. PRINCÍPIO CENTRAL

Qualidade não é uma etapa no final.

Qualidade deve existir durante:

- definição;
- arquitetura;
- implementação;
- revisão;
- teste;
- deploy;
- operação.

A regra é:

> **Tudo que pode quebrar o negócio precisa possuir uma forma objetiva de ser validado.**

---

# PARTE I — DEFINITION OF DONE

## 3. DEFINITION OF DONE

Uma funcionalidade só pode ser considerada concluída quando os critérios aplicáveis forem atendidos.

---

## 4. FUNCIONALIDADE REAL

A feature deve executar o comportamento prometido.

Não aceitar:

- botão sem ação;
- mock tratado como produção;
- loading infinito;
- placeholder definitivo;
- fluxo interrompido;
- confirmação falsa.

---

## 5. PERSISTÊNCIA

Alterações precisam persistir corretamente.

Testar:

- salvar;
- editar;
- recarregar;
- sair e voltar;
- concorrência quando aplicável.

---

## 6. AUTORIZAÇÃO

A feature precisa respeitar:

- usuário;
- role;
- permission;
- tenant;
- capability.

---

## 7. TENANT ISOLATION

Toda feature tenant-scoped precisa teste explícito de isolamento.

---

## 8. ERROR STATES

Erros previsíveis devem possuir tratamento.

---

## 9. EMPTY STATES

Estados vazios precisam ser funcionais.

---

## 10. LOADING STATES

Loading precisa ser visível e não bloquear desnecessariamente.

---

## 11. MOBILE

Fluxos relevantes devem ser testados em mobile.

---

## 12. ACCESSIBILITY

Requisitos aplicáveis precisam ser validados.

---

## 13. PERFORMANCE

Feature não pode degradar criticamente a aplicação.

---

## 14. OBSERVABILITY

Erros relevantes precisam ser diagnosticáveis.

---

## 15. TEST COVERAGE

Testes necessários precisam existir.

---

# PARTE II — PIRÂMIDE DE TESTES

## 16. TEST STRATEGY

Usar combinação de:

- unit;
- integration;
- contract;
- component;
- E2E;
- visual;
- accessibility;
- performance;
- security.

Nenhum tipo substitui todos os outros.

---

## 17. UNIT TESTS

Indicados para:

- regras de domínio;
- cálculos;
- validações;
- formatters;
- parsers;
- state transitions;
- helpers críticos.

---

## 18. INTEGRATION TESTS

Indicados para:

- banco;
- repositories;
- services;
- APIs;
- auth;
- tenant scope;
- jobs;
- events.

---

## 19. CONTRACT TESTS

Indicados para:

- provider adapters;
- public APIs;
- webhooks;
- theme contracts;
- extension points.

---

## 20. COMPONENT TESTS

Indicados para:

- forms;
- tables;
- components;
- responsive behavior;
- states.

---

## 21. E2E TESTS

Indicados para jornadas críticas.

---

# PARTE III — E2E CRÍTICOS

## 22. STORE CREATION

Cobrir:

- criar loja;
- configuração mínima;
- publish;
- acesso público.

---

## 23. PRODUCT FLOW

Cobrir:

- criar produto;
- variante;
- preço;
- estoque;
- publicar;
- encontrar no storefront.

---

## 24. PURCHASE FLOW

Cobrir:

- navegar;
- selecionar;
- adicionar;
- carrinho;
- checkout;
- pagamento test;
- pedido criado.

---

## 25. ORDER FLOW

Cobrir:

- pagamento aprovado;
- processamento;
- envio;
- conclusão.

---

## 26. CANCEL / REFUND

Cobrir:

- cancelamento;
- liberação de estoque;
- refund;
- status.

---

## 27. THEME FLOW

Cobrir:

- instalar;
- editar;
- preview;
- publicar;
- rollback.

---

# PARTE IV — DOMAIN TESTING

## 28. DOMAIN INVARIANTS

Cada domínio crítico deve possuir testes de invariantes.

---

## 29. MONEY

Testar:

- arredondamento;
- desconto;
- subtotal;
- total;
- cupom;
- promoção;
- frete.

---

## 30. INVENTORY

Testar:

- reserve;
- release;
- sale;
- adjustment;
- concurrency;
- overselling.

---

## 31. ORDER

Testar:

- transitions;
- invalid transition;
- snapshot;
- totals;
- cancellation.

---

## 32. PAYMENT

Testar:

- pending;
- approved;
- failed;
- duplicate webhook;
- refund.

---

# PARTE V — CONCURRENCY TESTING

## 33. RACE CONDITION TESTS

Simular concorrência real.

---

## 34. LAST ITEM

Dois clientes comprando último item.

---

## 35. DOUBLE CHECKOUT

Duas submissões simultâneas.

---

## 36. DUPLICATE WEBHOOK

Mesmo evento duas vezes.

---

## 37. REFUND RACE

Duas tentativas de reembolso.

---

# PARTE VI — TENANT ISOLATION TESTING

## 38. CROSS-TENANT READ

Tenant A não lê B.

---

## 39. CROSS-TENANT WRITE

Tenant A não altera B.

---

## 40. DIRECT ID ACCESS

Testar IDOR.

---

## 41. EXPORT

Exportação contém apenas dados do tenant.

---

## 42. CACHE

Cache não vaza dados.

---

# PARTE VII — AUTH TESTING

## 43. LOGIN

Testar:

- válido;
- inválido;
- bloqueio;
- rate limit.

---

## 44. SESSION

Testar:

- expiração;
- revogação;
- rotação.

---

## 45. 2FA

Quando implementado:

- ativar;
- validar;
- recuperar;
- desativar.

---

## 46. PERMISSIONS

Cada ação sensível precisa de teste negativo e positivo.

---

# PARTE VIII — UI QUALITY

## 47. VISUAL CONSISTENCY

Componentes devem seguir Design System.

---

## 48. SPACING

Evitar inconsistências visuais.

---

## 49. TYPOGRAPHY

Hierarquia precisa ser consistente.

---

## 50. STATUS

Status deve usar mapeamento semântico correto.

---

## 51. FORM STATES

Cobrir:

- default;
- focus;
- error;
- disabled;
- success.

---

# PARTE IX — RESPONSIVE QUALITY

## 52. VIEWPORTS

Testar pelo menos:

- mobile;
- tablet representativo;
- desktop.

---

## 53. OVERFLOW

Nenhum overflow horizontal acidental.

---

## 54. TOUCH TARGET

Ações precisam tamanho adequado.

---

## 55. MOBILE TABLE

Validar alternativa responsiva.

---

# PARTE X — ACCESSIBILITY

## 56. AUTOMATED A11Y

Usar ferramentas automáticas.

---

## 57. KEYBOARD

Testar jornada por teclado.

---

## 58. FOCUS

Focus visível e lógico.

---

## 59. SCREEN READER

Fluxos críticos precisam validação manual periódica.

---

## 60. COLOR CONTRAST

Validar tokens e themes.

---

## 61. FORM ERROR

Erro deve ser associado ao campo.

---

# PARTE XI — VISUAL REGRESSION

## 62. VISUAL SNAPSHOT

Usar para superfícies críticas.

---

## 63. BASELINES

Manter baseline aprovada.

---

## 64. INTENTIONAL CHANGE

Mudança visual precisa revisão consciente.

---

## 65. THEMES

Cada theme de referência deve possuir regressão visual.

---

# PARTE XII — PERFORMANCE QUALITY

## 66. PERFORMANCE BUDGET

Definir budgets por superfície.

---

## 67. STOREFRONT

Monitorar:

- LCP;
- INP;
- CLS;
- JS;
- image weight.

---

## 68. ADMIN

Monitorar:

- initial load;
- interaction latency;
- table rendering;
- search.

---

## 69. API

Monitorar:

- p50;
- p95;
- p99;
- error rate.

---

## 70. DATABASE

Monitorar slow queries.

---

# PARTE XIII — LOAD TESTING

## 71. LOAD

Executar para fluxos críticos.

---

## 72. CHECKOUT LOAD

Simular volume.

---

## 73. ORDER CREATION

Validar atomicidade.

---

## 74. SEARCH

Validar escala.

---

## 75. IMPORT

Testar grande volume.

---

# PARTE XIV — SECURITY QUALITY

## 76. SECURITY TESTS

Cobrir:

- auth;
- authorization;
- IDOR;
- XSS;
- CSRF;
- SSRF;
- webhook signature;
- secret exposure.

---

## 77. DEPENDENCY SCAN

Rodar em CI.

---

## 78. SECRET SCAN

Rodar em CI.

---

## 79. STATIC ANALYSIS

Rodar quando disponível.

---

# PARTE XV — CONTRACT QUALITY

## 80. API CONTRACT

Testar:

- schema;
- status codes;
- errors;
- nullability;
- versioning.

---

## 81. WEBHOOK CONTRACT

Testar payload.

---

## 82. THEME CONTRACT

Testar schema/version.

---

## 83. PROVIDER CONTRACT

Mocks devem representar comportamento real.

---

# PARTE XVI — DATA QUALITY

## 84. FIXTURE QUALITY

Fixtures devem representar casos reais.

---

## 85. SEED DATA

Seed precisa cobrir variedade.

---

## 86. EDGE DATA

Incluir:

- título longo;
- unicode;
- sem imagem;
- zero estoque;
- preço alto;
- muitas variantes;
- grande pedido.

---

# PARTE XVII — MIGRATION QUALITY

## 87. MIGRATION TEST

Rodar em banco representativo.

---

## 88. DATA VALIDATION

Validar após migration.

---

## 89. BACKWARD COMPATIBILITY

Deploy precisa tolerar transição.

---

## 90. ROLLBACK PLAN

Existir antes da produção.

---

# PARTE XVIII — IMPORT/EXPORT QUALITY

## 91. IMPORT VALID

Arquivo válido.

---

## 92. IMPORT INVALID

Campos inválidos.

---

## 93. PARTIAL SUCCESS

Testar estratégia.

---

## 94. LARGE FILE

Validar tempo e memória.

---

## 95. EXPORT

Comparar dados exportados.

---

# PARTE XIX — OBSERVABILITY QUALITY

## 96. ERROR LOG

Erro relevante deve gerar log estruturado.

---

## 97. CORRELATION

Trace/correlation id preservado.

---

## 98. ALERT

Falha crítica deve produzir alerta.

---

## 99. DASHBOARD

Health precisa refletir realidade.

---

# PARTE XX — TEST DATA MANAGEMENT

## 100. NO PROD DATA

Não usar dados reais de clientes em testes locais.

---

## 101. SYNTHETIC DATA

Preferir dados sintéticos.

---

## 102. MASKED DATA

Se usar dump, anonimizar.

---

# PARTE XXI — CI PIPELINE

## 103. REQUIRED CHECKS

Antes de merge:

- lint;
- typecheck;
- unit;
- integration;
- build;
- security checks aplicáveis.

---

## 104. PR GATE

PR com checks quebrados não deve ser mergeado.

---

## 105. E2E GATE

Fluxos críticos podem bloquear release.

---

## 106. VISUAL GATE

Mudanças visuais relevantes precisam aprovação.

---

# PARTE XXII — CODE REVIEW

## 107. REVIEW

Review precisa avaliar:

- domínio;
- segurança;
- tenant;
- qualidade;
- performance;
- regressão.

---

## 108. REVIEW CHECKLIST

Perguntas:

- duplicou regra?
- quebrou tenant?
- criou acoplamento?
- tratamento de erro existe?
- teste existe?
- logging é seguro?
- rollback é possível?

---

# PARTE XXIII — RELEASE QUALITY

## 109. RELEASE CANDIDATE

Release deve possuir versão/identificação.

---

## 110. CHANGELOG

Mudanças relevantes registradas.

---

## 111. DEPLOY CHECK

Antes de produção:

- build;
- tests;
- migrations;
- secrets;
- config;
- health.

---

## 112. POST-DEPLOY

Validar:

- health;
- error rate;
- critical flows.

---

# PARTE XXIV — SMOKE TESTS

## 113. SMOKE

Após deploy:

- login;
- storefront;
- product;
- cart;
- checkout test;
- admin core.

---

# PARTE XXV — CANARY / ROLLOUT

## 114. STAGED RELEASE

Quando necessário, liberar gradualmente.

---

## 115. FEATURE FLAG

Usar para reduzir risco.

---

## 116. KILL SWITCH

Recurso crítico deve poder ser desligado.

---

# PARTE XXVI — BUG SEVERITY

## 117. SEVERITY MODEL

Pode classificar:

- S0 — data/security/financial critical;
- S1 — core flow blocked;
- S2 — major degradation;
- S3 — minor;
- S4 — cosmetic.

---

## 118. PRIORITY

Severity não é a mesma coisa que prioridade comercial.

---

# PARTE XXVII — REGRESSION POLICY

## 119. BUG FIX TEST

Todo bug relevante corrigido deve ganhar teste de regressão.

---

## 120. RECURRENCE

Bug reincidente indica falha sistêmica.

---

# PARTE XXVIII — QUALITY METRICS

## 121. ENGINEERING METRICS

Podem incluir:

- escaped defects;
- change failure rate;
- rollback rate;
- test flakiness;
- MTTR;
- deployment frequency.

---

## 122. PRODUCT QUALITY METRICS

Podem incluir:

- checkout error rate;
- payment failure anomaly;
- storefront error rate;
- theme publish failures.

---

# PARTE XXIX — FLAKY TESTS

## 123. FLAKY TEST

Teste instável é bug.

---

## 124. QUARANTINE

Pode ser temporário, com owner.

---

## 125. NO IGNORE FOREVER

Nunca acumular testes ignorados sem revisão.

---

# PARTE XXX — TEST MAINTENANCE

## 126. TEST OWNERSHIP

Cada domínio mantém seus testes.

---

## 127. REMOVE DEAD TESTS

Testes obsoletos devem ser removidos.

---

# PARTE XXXI — DOCUMENTATION QUALITY

## 128. DOCS AS CODE

Documentação técnica relevante deve acompanhar mudança.

---

## 129. ADR

Decisão estrutural precisa registro.

---

## 130. API DOC

Contrato público precisa documentação.

---

# PARTE XXXII — QUALITY OF UX COPY

## 131. COPY REVIEW

Mensagens precisam ser:

- corretas;
- consistentes;
- acionáveis.

---

## 132. ERROR COPY TEST

Testar mensagens importantes.

---

# PARTE XXXIII — QUALITY OF ANALYTICS

## 133. METRIC VALIDATION

Métrica precisa definição.

---

## 134. TRACKING TEST

Eventos devem ser validados.

---

## 135. NO DOUBLE COUNT

Purchase não pode duplicar.

---

# PARTE XXXIV — WBUY: APRENDIZADOS

## 136. VISUAL REGRESSION RISK

A pesquisa WBuy mostrou conflitos entre CSS, wrappers e componentes.

### Decisão NextLevel

Visual regression e theme contract tests serão essenciais.

---

## 137. MOBILE RISK

Problemas mobile observados reforçam testes obrigatórios por viewport.

---

## 138. MIXED CONTRACTS

Respostas inconsistentes reforçam contract testing.

---

## 139. STOCK HISTORY

A pesquisa reforça necessidade de testes de auditoria e integridade de estoque.

---

# PARTE XXXV — QUALITY GATES POR ÁREA

## 140. COMMERCE CORE

Obrigatório:

- unit;
- integration;
- concurrency;
- idempotency;
- invariant tests.

---

## 141. PLATFORM CORE

Obrigatório:

- tenant isolation;
- auth;
- permissions;
- lifecycle;
- audit.

---

## 142. VISUAL COMMERCE

Obrigatório:

- schema;
- responsive;
- visual regression;
- a11y;
- performance.

---

## 143. INTEGRATIONS

Obrigatório:

- contract;
- webhook;
- retry;
- timeout;
- token expiry.

---

## 144. SECURITY

Obrigatório:

- negative tests;
- exploit simulations;
- secret checks.

---

# PARTE XXXVI — RELEASE BLOCKERS

## 145. BLOCK RELEASE

Não publicar se houver:

- tenant leak;
- payment duplication;
- order corruption;
- stock corruption;
- auth bypass;
- destructive migration risk;
- checkout blocked;
- storefront inaccessible;
- unresolved critical security issue.

---

# PARTE XXXVII — MANUAL QA

## 146. MANUAL QA

Automação não elimina revisão humana.

---

## 147. EXPLORATORY TESTING

Especialmente útil em:

- editor visual;
- mobile;
- onboarding;
- complex forms.

---

## 148. CROSS-BROWSER

Testar browsers relevantes.

---

# PARTE XXXVIII — ACCEPTANCE CRITERIA

## 149. CRITÉRIO

Toda tarefa relevante deve possuir critérios de aceite verificáveis.

---

## 150. BAD CRITERIA

Evitar:

`Melhorar tela.`

---

## 151. GOOD CRITERIA

Exemplo:

`Ao salvar um produto com três variantes, as três devem persistir e aparecer no storefront após publicação.`

---

# PARTE XXXIX — QUALITY OWNERSHIP

## 152. ENGINEER

Responsável pela qualidade da implementação.

---

## 153. PRODUCT

Responsável pela clareza do comportamento esperado.

---

## 154. DESIGN

Responsável pela consistência visual/UX.

---

## 155. QA

Responsável por estratégia e validação, não por “ser dono dos bugs”.

---

# PARTE XL — AI-GENERATED CODE

## 156. AI CODE

Código gerado por IA segue os mesmos gates.

---

## 157. NO TRUST BY DEFAULT

Não assumir correção porque compilou.

---

## 158. REVIEW

Revisar:

- segurança;
- dependências;
- lógica;
- testes;
- arquitetura.

---

# PARTE XLI — DEVELOPMENT ENVIRONMENT

## 159. LOCAL QUALITY

Ambiente local deve permitir:

- lint;
- typecheck;
- tests;
- build.

---

## 160. REPRODUCIBILITY

Setup precisa ser reproduzível.

---

# PARTE XLII — TESTING PYRAMID BALANCE

## 161. NO E2E ONLY

Não depender apenas de E2E.

---

## 162. NO UNIT ONLY

Não depender apenas de unit tests.

---

## 163. COST-AWARE

Usar o teste mais barato que valida corretamente o risco.

---

# PARTE XLIII — OPEN QUESTIONS

## 164. QUESTÕES ABERTAS

Precisam de definição conforme stack:

- test runner;
- browser automation;
- visual regression provider;
- accessibility tooling;
- load test tooling;
- security scanner;
- coverage thresholds;
- release cadence;
- environments;
- preview deployments;
- canary strategy;
- mobile device lab;
- synthetic monitoring;
- chaos testing cadence.

---

# 165. REGRA FINAL

A Plataforma NextLevel não deve confundir velocidade de entrega com pressa.

> **Qualidade é conseguir evoluir rápido sem quebrar o que já funciona.  
> Toda regra crítica precisa de teste.  
> Toda regressão importante precisa virar aprendizado.  
> E nenhuma feature deve chegar à produção apenas porque “parece pronta”.**
