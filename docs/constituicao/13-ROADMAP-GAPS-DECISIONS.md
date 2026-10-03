# 13 — ROADMAP, GAPS & DECISIONS

> **Status:** Documento especializado de governança de evolução, gaps, decisões e sequência de implementação  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md` até `12-COMMERCE-INTELLIGENCE.md`  
> **Escopo:** Como transformar a arquitetura-alvo da Plataforma NextLevel em evolução incremental do produto e do código existente  
> **Não cobre:** implementação detalhada de cada módulo; cada documento especializado continua sendo autoridade no próprio domínio

---

# 1. OBJETIVO

Este documento existe para evitar dois erros opostos:

1. desenvolver sem arquitetura;
2. tentar implementar toda a arquitetura de uma vez.

A Plataforma NextLevel já possui código, decisões, experimentos e funcionalidades em diferentes níveis de maturidade.

Portanto, o caminho correto é:

**entender → classificar → preservar → corrigir → consolidar → expandir**

e não:

**apagar → recomeçar → reconstruir tudo**

Este documento define:

- como auditar o estado atual;
- como identificar gaps;
- como classificar dívida;
- como priorizar;
- como registrar decisões;
- como transformar documentos em backlog;
- como evitar reescrita desnecessária;
- como evoluir a plataforma em fases coerentes;
- como saber quando uma fase está realmente pronta.

---

# 2. PRINCÍPIO CENTRAL

A arquitetura documentada representa o **estado desejado**.

O repositório representa o **estado atual**.

O trabalho de engenharia é reduzir a distância entre os dois sem destruir valor existente.

A regra é:

> **Não implementar documento por documento.  
> Implementar capacidades completas por dependência e risco.**

---

# 3. NÃO É UM ROADMAP DE DATAS

Este documento não define datas comerciais fixas.

Define:

- ordem lógica;
- dependências;
- critérios de entrada;
- critérios de saída;
- prioridades arquiteturais.

Datas só devem ser definidas após auditoria real do código.

---

# PARTE I — FONTES DE VERDADE

## 4. HIERARQUIA

Quando houver conflito:

1. `00-CONSTITUICAO-ECOMMERCE.md`
2. decisões arquiteturais formalmente aprovadas;
3. documentos especializados;
4. decisões de produto registradas;
5. implementação atual;
6. conveniência da tarefa corrente.

---

## 5. WBUY

`01-WBUY-RESEARCH-INTELLIGENCE.md` é fonte de evidência.

Não é especificação.

A classificação deve ser preservada:

- CONFIRMADO;
- INFERIDO;
- HIPÓTESE;
- DECISÃO NEXTLEVEL.

---

## 6. CÓDIGO EXISTENTE

Código atual é evidência de implementação.

Não é automaticamente decisão arquitetural correta.

Também não deve ser descartado automaticamente.

---

# PARTE II — CLASSIFICAÇÃO DO ESTADO ATUAL

## 7. CATEGORIAS

Todo módulo auditado deve cair em uma destas categorias.

---

## 8. ALINHADO

Existe, funciona e está coerente com a arquitetura.

Ação:

**preservar.**

---

## 9. ALINHADO PARCIALMENTE

Existe e possui valor, mas precisa evolução.

Ação:

**refatorar incrementalmente.**

---

## 10. IMPLEMENTADO COM DÍVIDA

Funciona, mas possui risco técnico relevante.

Ação:

**manter funcionando e planejar correção.**

---

## 11. PROTÓTIPO

Serve como validação visual/funcional, mas não possui robustez para produção.

Ação:

**não confundir com feature concluída.**

---

## 12. AUSENTE

Capability necessária não existe.

Ação:

**planejar implementação.**

---

## 13. CONFLITANTE

Implementação viola princípio constitucional.

Ação:

**corrigir com prioridade proporcional ao risco.**

---

## 14. DESCARTÁVEL

Código sem valor real, duplicado ou experimental.

Ação:

**remover somente após confirmar dependências.**

---

# PARTE III — MATRIZ DE GAP

## 15. GAP RECORD

Cada gap importante deve possuir:

- id;
- domínio;
- descrição;
- evidência;
- impacto;
- severidade;
- dependências;
- risco;
- recomendação;
- owner;
- status;
- decision reference quando existir.

---

## 16. GAP TYPES

Classificar como:

- FUNCTIONAL;
- ARCHITECTURAL;
- SECURITY;
- DATA;
- UX;
- VISUAL;
- RELIABILITY;
- PERFORMANCE;
- ACCESSIBILITY;
- OBSERVABILITY;
- TESTING;
- DOCUMENTATION.

---

## 17. GAP ≠ FEATURE

Um gap pode ser:

`tenant isolation inconsistente`

Isso não é uma feature.

É uma deficiência estrutural.

---

# PARTE IV — PRIORIDADE

## 18. PRIORITY MODEL

Prioridade deve considerar:

- risco de dados;
- risco financeiro;
- risco de segurança;
- bloqueio de venda;
- dependência estrutural;
- frequência de uso;
- impacto no usuário;
- custo de corrigir depois.

---

## 19. P0 — FUNDACIONAL CRÍTICO

Exemplos:

- tenant leak;
- auth bypass;
- pagamento duplicado;
- estoque inconsistente;
- corrupção de pedido;
- migration destrutiva;
- checkout incorreto.

Corrigir antes de expandir.

---

## 20. P1 — FUNDACIONAL

Exemplos:

- domínio mal modelado;
- ausência de idempotência;
- ausência de lifecycle;
- APIs inconsistentes;
- theme publish frágil;
- falta de audit.

---

## 21. P2 — PRODUTO ESSENCIAL

Exemplos:

- melhor fluxo de produto;
- pedido operacional;
- domínio customizado;
- import/export;
- dashboard funcional.

---

## 22. P3 — DIFERENCIAÇÃO

Exemplos:

- visual builder avançado;
- theme marketplace;
- intelligence avançada;
- recomendações;
- extensões.

---

## 23. P4 — OTIMIZAÇÃO

Exemplos:

- personalização avançada;
- automações sofisticadas;
- benchmarks;
- experimentação.

---

# PARTE V — REVERSIBILIDADE

## 24. REVERSIBLE DECISION

Pode ser tomada rapidamente quando:

- baixo impacto;
- fácil rollback;
- sem lock-in;
- sem mudança de contrato público.

---

## 25. IRREVERSIBLE / EXPENSIVE DECISION

Exige análise maior.

Exemplos:

- identidade principal;
- tenant model;
- IDs públicos;
- payment state model;
- storage format;
- API pública;
- theme manifest público.

---

## 26. RULE

Quanto mais difícil reverter, maior deve ser a evidência antes da decisão.

---

# PARTE VI — DECISION REGISTER

## 27. DECISION RECORD

Toda decisão estrutural deve registrar:

- id;
- título;
- data;
- status;
- contexto;
- alternativas;
- decisão;
- consequências;
- reversibilidade;
- documentos afetados.

---

## 28. DECISION STATUS

Pode ser:

- PROPOSED;
- ACCEPTED;
- SUPERSEDED;
- REJECTED;
- DEPRECATED.

---

## 29. ADR

Decisões técnicas importantes devem virar ADR quando necessário.

---

## 30. PRODUCT DECISION

Nem toda decisão é técnica.

Exemplo:

`Guest checkout será permitido por padrão.`

Também precisa registro.

---

# PARTE VII — QUESTÕES ABERTAS

## 31. OPEN QUESTION

Questão aberta não deve ser tratada como requisito.

---

## 32. REQUIRED DECISION

Quando implementação estiver bloqueada:

1. registrar questão;
2. listar alternativas;
3. analisar impactos;
4. recomendar;
5. decidir;
6. registrar resultado.

---

## 33. NO INVENTION

Agente de código não deve transformar open question em decisão silenciosa.

---

# PARTE VIII — AUDITORIA INICIAL DO REPOSITÓRIO

## 34. PRIMEIRO PASSO

Antes de grande implementação, mapear o repositório.

---

## 35. INVENTORY

Levantar:

- apps;
- packages;
- routes;
- APIs;
- database;
- migrations;
- auth;
- domains;
- tests;
- integrations;
- themes;
- jobs;
- deployment;
- environment variables.

---

## 36. DEPENDENCY MAP

Identificar dependências entre módulos.

---

## 37. DOMAIN MAP

Mapear onde atualmente vivem:

- products;
- inventory;
- customers;
- orders;
- payments;
- shipping;
- themes;
- tenants.

---

## 38. DUPLICATED RULES

Procurar regras repetidas em:

- frontend;
- API;
- database;
- webhook;
- jobs.

---

## 39. MOCKS

Identificar mocks usados como se fossem dados reais.

---

## 40. DEAD ROUTES

Identificar rotas/telas sem uso.

---

## 41. FAKE FEATURES

Identificar:

- botões sem implementação;
- cards cenográficos;
- números hardcoded;
- fluxos incompletos.

---

# PARTE IX — BASELINE TÉCNICA

## 42. BASELINE

Antes de alterar:

- rodar install;
- lint;
- typecheck;
- tests;
- build.

Registrar resultado.

---

## 43. EXISTING FAILURES

Falhas preexistentes devem ser separadas das introduzidas pela tarefa.

---

## 44. BASELINE FUNCTIONAL

Registrar fluxos que já funcionam.

---

# PARTE X — FASE 0: ESTABILIZAR O REPOSITÓRIO

## 45. OBJETIVO

Criar base confiável para evoluir.

---

## 46. CHECKS

Garantir:

- build reproduzível;
- environment documentado;
- migrations aplicáveis;
- seed funcional;
- testes executáveis;
- lint/typecheck.

---

## 47. REMOVE BLOCKERS

Corrigir erros que impedem desenvolvimento seguro.

---

## 48. NO BIG REFACTOR

Fase 0 não é reescrita arquitetural.

---

# PARTE XI — FASE 1: TENANT, AUTH E PLATFORM FOUNDATION

## 49. OBJETIVO

Garantir que a plataforma saiba:

- quem é usuário;
- qual loja está ativa;
- o que pode fazer;
- quais capabilities possui.

---

## 50. ENTREGAS

Priorizar:

- Store/Tenant;
- User;
- Membership;
- Session;
- Roles;
- Permissions;
- Capabilities;
- store lifecycle;
- audit foundation.

---

## 51. EXIT CRITERIA

Fase pronta quando:

- acesso cross-tenant é bloqueado;
- autorização é server-side;
- loja possui identidade estável;
- usuário pode ter memberships;
- ações críticas geram audit;
- testes de isolamento passam.

---

# PARTE XII — FASE 2: COMMERCE DOMAIN FOUNDATION

## 52. OBJETIVO

Consolidar verdade comercial.

---

## 53. CATALOG

Implementar/consolidar:

- Product;
- Variant;
- SKU;
- categories;
- collections;
- media refs;
- publication.

---

## 54. PRICING

Consolidar:

- base price;
- promo price;
- discounts;
- coupon foundation;
- money representation.

---

## 55. INVENTORY

Consolidar:

- on_hand;
- reserved;
- available;
- movement ledger;
- concurrency.

---

## 56. EXIT CRITERIA

- produto e SKU possuem identidade estável;
- preço é calculado no servidor;
- estoque não oversella no caso testado;
- histórico de movimento existe;
- tenant isolation passa.

---

# PARTE XIII — FASE 3: CART E CHECKOUT

## 57. OBJETIVO

Criar jornada de compra confiável.

---

## 58. CART

Consolidar:

- cart;
- cart items;
- variant references;
- revalidation;
- anonymous cart;
- merge policy quando decidido.

---

## 59. CHECKOUT

Consolidar:

- checkout session;
- address;
- shipping selection;
- payment method;
- total revalidation;
- idempotent finalization.

---

## 60. EXIT CRITERIA

- preço não pode ser adulterado no browser;
- estoque é revalidado;
- double submit não duplica pedido;
- falha de pagamento não destrói carrinho;
- checkout possui testes E2E.

---

# PARTE XIV — FASE 4: ORDER, PAYMENT E FULFILLMENT

## 61. OBJETIVO

Consolidar pós-checkout operacional.

---

## 62. ORDER

Implementar:

- snapshots;
- semantic states;
- timeline;
- transitions;
- cancellation.

---

## 63. PAYMENT

Implementar:

- attempts;
- provider abstraction;
- webhook;
- idempotency;
- reconciliation;
- refund.

---

## 64. SHIPMENT

Implementar:

- shipping method;
- shipment;
- tracking;
- fulfillment.

---

## 65. EXIT CRITERIA

- pedido histórico não muda com catálogo;
- webhook duplicado não duplica efeito;
- payment e fulfillment são estados separados;
- refund é auditável;
- rastreio possui estado.

---

# PARTE XV — FASE 5: STOREFRONT BASE

## 66. OBJETIVO

Entregar loja pública completa antes de complexidade visual extrema.

---

## 67. PÁGINAS

Garantir:

- home;
- category;
- collection;
- search;
- PDP;
- cart;
- checkout;
- success;
- account mínimo;
- content pages;
- 404.

---

## 68. UX CONTRACT

Preservar contratos do `06`.

---

## 69. MOBILE

Mobile precisa funcionar antes de declarar fase pronta.

---

## 70. EXIT CRITERIA

Consumidor consegue:

- descobrir;
- selecionar;
- adicionar;
- comprar;
- receber confirmação.

---

# PARTE XVI — FASE 6: MERCHANT PANEL OPERACIONAL

## 71. OBJETIVO

Permitir gestão ponta a ponta.

---

## 72. ÁREAS PRIORITÁRIAS

- dashboard;
- products;
- inventory;
- orders;
- customers;
- settings;
- domain;
- integrations;
- users/security.

---

## 73. NO FAKE DASHBOARD

KPIs precisam derivar de dados reais.

---

## 74. EXIT CRITERIA

Lojista consegue administrar sem acesso ao banco ou código.

---

# PARTE XVII — FASE 7: VISUAL COMMERCE FOUNDATION

## 75. OBJETIVO

Separar identidade visual de negócio.

---

## 76. ENTREGAS

- tokens;
- Theme;
- ThemeVersion;
- StoreTheme;
- templates;
- sections;
- blocks;
- settings schemas;
- draft;
- preview;
- publish;
- rollback.

---

## 77. REFERENCE THEME

Criar um theme first-party completo.

---

## 78. EXIT CRITERIA

- troca visual não altera regras de comércio;
- draft não afeta produção;
- publish é atômico;
- theme é responsivo;
- rollback funciona.

---

# PARTE XVIII — FASE 8: EDITOR VISUAL

## 79. OBJETIVO

Dar autonomia visual ao lojista.

---

## 80. ENTREGAS

- section editor;
- block editor;
- reorder;
- settings;
- media picker;
- responsive preview;
- device preview.

---

## 81. DRAG AND DROP

Adicionar somente se modelo estruturado já estiver sólido.

---

## 82. EXIT CRITERIA

Lojista personaliza loja sem alterar código.

---

# PARTE XIX — FASE 9: THEMES E SEGMENTOS

## 83. OBJETIVO

Transformar engine em produto reutilizável.

---

## 84. ENTREGAS

- package manifest;
- install;
- upgrade;
- switch;
- theme library;
- presets;
- segment packs;
- compatibility validation.

---

## 85. FIRST SEGMENTS

Escolher poucos segmentos com alto valor.

Possíveis:

- Moda;
- Futebol;
- Atacado.

A decisão final depende de estratégia comercial.

---

## 86. EXIT CRITERIA

Tema pode ser instalado em outra loja sem código específico de cliente.

---

# PARTE XX — FASE 10: IMPORT, EXPORT E MIGRAÇÃO

## 87. OBJETIVO

Facilitar entrada e saída de dados.

---

## 88. ENTREGAS

- import job;
- validation;
- preview;
- error report;
- export;
- mapping;
- retry.

---

## 89. WBUY MIGRATION

Pode surgir adapter específico após modelo canônico estar estável.

---

## 90. EXIT CRITERIA

Dados entram sem exigir script manual de banco.

---

# PARTE XXI — FASE 11: INTEGRATIONS PLATFORM

## 91. OBJETIVO

Transformar integrações pontuais em infraestrutura extensível.

---

## 92. ENTREGAS

- provider contracts;
- adapters;
- connection health;
- credentials;
- webhooks;
- retry;
- reconciliation;
- logs.

---

## 93. EXIT CRITERIA

Novo provider pode ser adicionado sem alterar domínio principal.

---

# PARTE XXII — FASE 12: OBSERVABILITY & PLATFORM OPS

## 94. OBJETIVO

Permitir operar a plataforma sem “adivinhar”.

---

## 95. ENTREGAS

- structured logs;
- correlation;
- health;
- job diagnostics;
- integration diagnostics;
- store health;
- audit viewer;
- support tooling.

---

## 96. EXIT CRITERIA

Problema de uma loja pode ser localizado e diagnosticado sem consulta manual dispersa.

---

# PARTE XXIII — FASE 13: COMMERCE INTELLIGENCE

## 97. OBJETIVO

Transformar dados confiáveis em decisão.

---

## 98. PRÉ-REQUISITO

Não antecipar inteligência sobre dados ainda inconsistentes.

---

## 99. ENTREGAS

- metric definitions;
- operations signals;
- action center;
- health;
- alerts;
- recommendations;
- drill-down.

---

## 100. EXIT CRITERIA

Toda recomendação relevante possui evidência e ação.

---

# PARTE XXIV — FASE 14: ECOSSISTEMA

## 101. OBJETIVO

Permitir expansão por terceiros.

---

## 102. POSSÍVEIS ENTREGAS

- public API;
- app model;
- scopes;
- app installations;
- extension points;
- app blocks;
- developer docs;
- theme marketplace;
- app marketplace.

---

## 103. PRÉ-REQUISITO

Contratos internos precisam estar maduros antes de virarem públicos.

---

# PARTE XXV — FASES NÃO SÃO SILOS

## 104. ITERAÇÃO

Pode haver trabalho paralelo.

Exemplo:

- storefront básico enquanto order core é consolidado;
- painel sobre APIs estáveis;
- theme system sobre storefront reference.

---

## 105. DEPENDENCY RULE

Nunca avançar uma camada dependente usando mocks permanentes para esconder fundação ausente.

---

# PARTE XXVI — VERTICAL SLICES

## 106. VERTICAL SLICE

Quando possível, entregar capacidades completas ponta a ponta.

Exemplo:

`Criar produto`

inclui:

- data model;
- API;
- authorization;
- UI;
- validation;
- persistence;
- audit;
- tests.

---

## 107. BENEFIT

Evita dezenas de telas parcialmente funcionais.

---

# PARTE XXVII — FIRST COMPLETE LOOP

## 108. PRIMEIRO LOOP COMERCIAL COMPLETO

Prioridade estratégica:

1. criar loja;
2. criar produto;
3. publicar produto;
4. storefront;
5. carrinho;
6. checkout;
7. pagamento de teste;
8. pedido;
9. estoque;
10. gestão do pedido.

---

## 109. WHY

Esse loop valida a arquitetura de ponta a ponta.

---

# PARTE XXVIII — DEFINITION OF MVP

## 110. MVP

MVP não significa arquitetura descartável.

---

## 111. MVP SCOPE

Pode reduzir:

- número de providers;
- número de themes;
- quantidade de relatórios;
- automações;
- extensões.

Não deve reduzir:

- tenant isolation;
- consistência;
- segurança crítica;
- integridade de pedido;
- idempotência crítica.

---

# PARTE XXIX — DEFINITION OF PRODUCTION READY

## 112. PRODUCTION READY

Uma capability crítica precisa:

- comportamento real;
- tratamento de erro;
- permission;
- tenant safety;
- tests;
- observability;
- recovery strategy quando aplicável.

---

# PARTE XXX — DÍVIDA TÉCNICA

## 113. TECH DEBT

Dívida técnica deve ser registrada.

---

## 114. CATEGORIES

- architecture debt;
- test debt;
- security debt;
- performance debt;
- UX debt;
- data debt;
- operational debt.

---

## 115. INTEREST

Registrar impacto de não corrigir.

---

## 116. NO INVISIBLE DEBT

Não deixar `TODO` crítico como único registro.

---

# PARTE XXXI — REFACTOR POLICY

## 117. REFACTOR WHEN

Refatorar quando:

- impede feature;
- causa bugs recorrentes;
- viola segurança;
- duplica regra crítica;
- impede testes;
- cria acoplamento grave.

---

## 118. DO NOT REFACTOR BECAUSE

Não refatorar apenas porque:

- outra arquitetura parece mais elegante;
- tecnologia nova existe;
- agente prefere outro padrão.

---

# PARTE XXXII — REWRITE POLICY

## 119. REWRITE

Rewrite completo exige evidência excepcional.

---

## 120. CONDITIONS

Considerar apenas se:

- estrutura atual impede evolução;
- custo incremental excede reconstrução;
- testes permitem comparar;
- migration plan existe;
- rollback existe.

---

## 121. DEFAULT

Padrão é evolução incremental.

---

# PARTE XXXIII — LEGACY MANAGEMENT

## 122. LEGACY

Código antigo ainda funcional pode permanecer temporariamente.

---

## 123. STRANGLER PATTERN

Migrar capacidade por capacidade quando útil.

---

## 124. DEPRECATION

Marcar interfaces antigas.

---

## 125. REMOVAL

Remover somente após não haver consumidores.

---

# PARTE XXXIV — FEATURE FLAGS

## 126. USE

Flags podem apoiar rollout e migração.

---

## 127. NOT ARCHITECTURE

Não usar flag para manter duas arquiteturas indefinidamente.

---

## 128. CLEANUP

Toda flag temporária precisa plano de remoção.

---

# PARTE XXXV — DATA MIGRATION ROADMAP

## 129. DATA FIRST

Mudanças estruturais precisam plano de dados.

---

## 130. EXPAND / MIGRATE / CONTRACT

Preferência para alterações incompatíveis.

---

## 131. VALIDATE

Comparar antes/depois.

---

# PARTE XXXVI — CONTRACT MIGRATION

## 132. INTERNAL API

Alterar contrato interno com compatibilidade quando necessário.

---

## 133. PUBLIC API

Mais rigorosa.

---

## 134. WEBHOOK

Versionado.

---

## 135. THEME CONTRACT

Versionado.

---

# PARTE XXXVII — RISK REGISTER

## 136. RISK RECORD

Pode possuir:

- id;
- risk;
- probability;
- impact;
- mitigation;
- owner;
- status.

---

## 137. HIGH RISKS

Exemplos:

- tenant leakage;
- checkout inconsistency;
- payment replay;
- migration corruption;
- provider lock-in;
- theme fragmentation.

---

# PARTE XXXVIII — CURRENT STRATEGIC RISKS

## 138. PLATFORM VS DERIVED PRODUCTS

Risco:

contaminar core com SuperDrop/Master.

Mitigação:

dependência sempre produto derivado → core.

---

## 139. UI-FIRST DEVELOPMENT

Risco:

muitas telas com domínio incompleto.

Mitigação:

vertical slices e contracts.

---

## 140. COPY WBUY

Risco:

reproduzir limitações históricas.

Mitigação:

benchmark → interpretação → decisão.

---

## 141. THEME CHAOS

Risco:

customização sem contratos.

Mitigação:

Visual Commerce Engine.

---

## 142. PROVIDER LOCK-IN

Risco:

Mercado Pago/frete contaminarem domínio.

Mitigação:

adapters.

---

## 143. ANALYTICS BEFORE DATA QUALITY

Risco:

insights incorretos.

Mitigação:

métricas depois das fontes de verdade.

---

# PARTE XXXIX — ROADMAP DE PESQUISA WBUY

## 144. PESQUISA CONTINUA

Estudo WBuy continua durante desenvolvimento.

---

## 145. PRIORITY RESEARCH

Aprofundar quando acessível:

- pedidos;
- produtos;
- grades;
- estoque;
- checkout;
- clientes;
- temas;
- configurações;
- segurança;
- import/export;
- WBuy Pay;
- apps;
- marketplaces;
- permissões;
- billing.

---

## 146. EVIDENCE CAPTURE

Para cada descoberta:

- tela;
- request;
- payload;
- comportamento;
- classificação de evidência;
- implicação;
- decisão NextLevel.

---

## 147. NO PAUSE

Não esperar pesquisa “terminar” para desenvolver.

Usar descoberta incremental.

---

# PARTE XL — GAP REVIEW CADENCE

## 148. PERIODIC REVIEW

Revisar gaps em marcos importantes.

---

## 149. AFTER MAJOR FEATURE

Atualizar:

- gaps resolvidos;
- novos gaps;
- decisões tomadas;
- dívida criada.

---

# PARTE XLI — DOCUMENTATION EVOLUTION

## 150. DOCS ARE LIVING

Documentos podem evoluir.

---

## 151. NO SILENT CONTRADICTION

Mudança precisa preservar hierarquia.

---

## 152. UPDATE SPECIALIZED DOC

Decisão aprovada deve ser refletida no documento correto.

---

## 153. CONSTITUTION CHANGE

Somente para princípio realmente estrutural.

---

# PARTE XLII — AGENT WORKFLOW

## 154. BEFORE TASK

Agente deve:

1. identificar domínio;
2. ler Constituição;
3. ler documentos especializados relevantes;
4. inspecionar código;
5. verificar decisões existentes.

---

## 155. DURING TASK

Agente deve:

- preservar contratos;
- evitar scope creep;
- testar;
- registrar decisões necessárias.

---

## 156. AFTER TASK

Agente deve informar:

- arquivos alterados;
- comportamento entregue;
- testes;
- gaps restantes;
- decisões novas;
- riscos.

---

# PARTE XLIII — NO AUTONOMOUS STRUCTURAL DECISIONS

## 157. RULE

Agente pode decidir sozinho detalhes pequenos e reversíveis.

---

## 158. ASK BEFORE

Deve pedir decisão quando envolver:

- mudança de domínio;
- banco irreversível;
- API pública;
- provider lock-in;
- security tradeoff;
- eliminar feature;
- rewrite;
- mudança grande de escopo.

---

# PARTE XLIV — IMPLEMENTATION BATCH

## 159. BATCH SIZE

Preferir lotes pequenos.

---

## 160. EACH BATCH

Deve possuir:

- objetivo;
- arquivos;
- tests;
- validation;
- rollback/risk quando necessário.

---

## 161. COMPLETE BEFORE NEXT

Não acumular cinco refactors simultâneos.

---

# PARTE XLV — QUALITY GATES

## 162. GATE 1 — BUILD

Compila.

---

## 163. GATE 2 — TEST

Testes passam.

---

## 164. GATE 3 — DOMAIN

Invariantes preservados.

---

## 165. GATE 4 — SECURITY

Tenant/auth/permissions corretos.

---

## 166. GATE 5 — UX

Estados essenciais completos.

---

## 167. GATE 6 — OBSERVABILITY

Falha diagnosticável.

---

# PARTE XLVI — RELEASE DECISION

## 168. RELEASE READY

Uma release não depende apenas de ausência de erro de build.

---

## 169. BLOCKERS

Bloquear release com:

- P0 aberto;
- migration insegura;
- checkout quebrado;
- tenant leak;
- payment duplication;
- data corruption;
- critical security bug.

---

# PARTE XLVII — PRODUCT MATURITY LEVELS

## 170. LEVEL 0 — PROTOTYPE

Visual/fluxo demonstrável.

---

## 171. LEVEL 1 — FUNCTIONAL

Happy path real.

---

## 172. LEVEL 2 — ROBUST

Errors, permissions, persistence, tests.

---

## 173. LEVEL 3 — PRODUCTION

Observability, recovery, reliability.

---

## 174. LEVEL 4 — SCALE

Performance, automation, extensibility.

---

## 175. LEVEL 5 — INTELLIGENT

Signals, recommendations, automation assistida.

---

# PARTE XLVIII — CAPABILITY READINESS

## 176. READINESS MATRIX

Cada capability pode registrar:

- maturity level;
- tests;
- docs;
- monitoring;
- known gaps.

---

# PARTE XLIX — NO FALSE COMPLETION

## 177. 100% FUNCTIONAL

Só usar “100% funcional” se:

- fluxo principal funciona;
- estados alternativos tratados;
- persistência real;
- autorização;
- testes;
- sem mock oculto.

---

# PARTE L — BUSINESS CONTINUITY DURING DEVELOPMENT

## 178. EXISTING USERS

Quando houver produção ativa:

- preservar compatibilidade;
- migrar dados;
- rollout gradual.

---

## 179. FEATURE MIGRATION

Nova versão pode coexistir temporariamente com antiga.

---

# PARTE LI — PERFORMANCE ROADMAP

## 180. PERFORMANCE

Primeiro medir.

Depois otimizar.

---

## 181. EARLY PRIORITIES

Ainda assim, evitar desde o início:

- N+1;
- imagens gigantes;
- client JS excessivo;
- queries sem índice óbvio;
- blocking external calls.

---

# PARTE LII — ACCESSIBILITY ROADMAP

## 182. FOUNDATION

Design System acessível desde o início.

---

## 183. THEMES

Theme certification inclui a11y.

---

# PARTE LIII — SECURITY ROADMAP

## 184. SECURITY FROM DAY ONE

Não adiar:

- tenant isolation;
- server auth;
- secrets;
- webhook validation;
- input validation.

---

## 185. LATER MATURITY

Pode vir depois:

- SSO;
- passkeys;
- SIEM;
- bug bounty;
- advanced threat detection.

---

# PARTE LIV — INTEGRATION ROADMAP

## 186. FIRST PROVIDER

Primeiro provider deve validar contrato.

---

## 187. SECOND PROVIDER

Segundo provider é teste real de abstração.

Se adicionar segundo provider exige reescrever domínio, contrato está errado.

---

# PARTE LV — THEME ROADMAP

## 188. FIRST THEME

Theme simples e completo.

---

## 189. SECOND THEME

Visualmente diferente.

Serve para provar separação entre visual e commerce.

---

## 190. THIRD THEME

Pode ser segmentado.

---

# PARTE LVI — INTELLIGENCE ROADMAP

## 191. STAGE 1

Métricas confiáveis.

---

## 192. STAGE 2

Operational signals.

---

## 193. STAGE 3

Action Center.

---

## 194. STAGE 4

Recommendations.

---

## 195. STAGE 5

AI summaries/assistance.

---

# PARTE LVII — PLATFORM OPS ROADMAP

## 196. STAGE 1

Store lookup + audit.

---

## 197. STAGE 2

Health + jobs + integrations.

---

## 198. STAGE 3

Safe support actions.

---

## 199. STAGE 4

Incident tooling.

---

# PARTE LVIII — MIGRATION FROM EXISTING IMPLEMENTATION

## 200. RULE

Não criar uma “nova plataforma paralela” se o atual puder evoluir.

---

## 201. MAP FIRST

Mapear:

- entidades existentes;
- rotas;
- componentes;
- migrations;
- APIs.

---

## 202. ADAPT

Introduzir novos contratos ao redor do que pode ser preservado.

---

## 203. REPLACE

Substituir somente partes incompatíveis.

---

# PARTE LIX — CLAUDE CODE / AGENT EXECUTION

## 204. ROLE

O agente de código é executor técnico, não dono autônomo da arquitetura.

---

## 205. FIRST ACTION

Ao receber estes documentos:

- ler;
- auditar;
- mapear;
- não reescrever imediatamente.

---

## 206. REPORT FIRST

Antes de grande mudança, apresentar:

- arquitetura encontrada;
- alinhamentos;
- divergências;
- gaps;
- riscos;
- plano incremental.

---

## 207. IMPLEMENT AFTER

Depois executar em lotes pequenos.

---

# PARTE LX — DECISÕES JÁ CONSOLIDADAS

## 208. CORE PLATFORM

NextLevel é plataforma própria de lojas virtuais.

---

## 209. DERIVED PRODUCTS

SuperDrop, Master e outros produtos não são core.

---

## 210. PLATFORM OPS

É capacidade interna da plataforma, não Master.

---

## 211. WBUY

Benchmark profundo, não modelo obrigatório.

---

## 212. DOMAIN BEFORE UI

Regra consolidada.

---

## 213. TENANT ISOLATION

Obrigatório.

---

## 214. SERVER AUTHORITY

Obrigatório.

---

## 215. THEME BOUNDARY

Tema não controla regra de comércio.

---

## 216. PROVIDER BOUNDARY

Provider não define domínio.

---

## 217. HISTORY

Pedidos e fatos históricos precisam preservar snapshots.

---

## 218. IDEMPOTENCY

Obrigatória em operações críticas.

---

## 219. MOBILE

Primeira classe.

---

## 220. VISUAL AS ARCHITECTURE

Visual Commerce é pilar da plataforma.

---

## 221. INTELLIGENCE

Signal → context → action.

---

# PARTE LXI — DECISÕES AINDA NÃO CONSOLIDADAS

## 222. NÃO CONGELADAS

Ainda não congelar sem necessidade:

- banco definitivo;
- hosting topology;
- queue provider;
- cache provider;
- search provider;
- analytics warehouse;
- public API style;
- SSO;
- passkeys;
- exact RBAC roles;
- exact theme manifest;
- app marketplace model;
- custom JS policy final;
- multi-region;
- multi-currency;
- multi-stock location;
- fiscal architecture completa.

---

# PARTE LXII — NEXT DECISION TRIGGERS

## 223. TRIGGER-BASED DECISION

Decidir tecnologia quando requisito exigir.

Exemplo:

`Precisamos de busca com typo tolerance em 500 mil SKUs.`

Aí comparar engines.

Não escolher antes por preferência.

---

# PARTE LXIII — REVIEW BEFORE SCALE

## 224. SCALE REVIEW

Antes de escalar:

- banco;
- jobs;
- cache;
- storage;
- queues;
- rate limits;
- observability;
- billing;
- support.

---

# PARTE LXIV — PRODUCT COMPLETENESS REVIEW

## 225. PONTA A PONTA

Auditar regularmente:

- merchant setup;
- catalog;
- storefront;
- purchase;
- order;
- fulfillment;
- after-sales.

---

# PARTE LXV — UX COMPLETENESS REVIEW

## 226. STATES

Para cada superfície:

- default;
- loading;
- empty;
- error;
- success;
- disabled;
- permission denied;
- mobile.

---

# PARTE LXVI — ENGINEERING COMPLETENESS REVIEW

## 227. CHECKLIST

- source of truth;
- tenant;
- authorization;
- transactions;
- idempotency;
- logs;
- tests;
- migration;
- performance.

---

# PARTE LXVII — DOCUMENT COMPLETENESS REVIEW

## 228. CROSS-DOC AUDIT

Após finalizar todos os documentos:

- procurar contradições;
- duplicidades;
- gaps;
- termos diferentes para mesma coisa;
- decisões sem owner.

---

## 229. NORMALIZE TERMINOLOGY

Criar glossário se necessário.

---

# PARTE LXVIII — WBUY RESEARCH GAP REGISTER

## 230. KNOWN RESEARCH GAPS

Manter lista viva de áreas ainda não suficientemente confirmadas.

---

## 231. EXAMPLES

- origem exata de `grade_tipo`;
- regras WBuy Pay;
- permissões detalhadas;
- marketplace flows;
- app lifecycle;
- billing behavior;
- PWA/push limits.

---

# PARTE LXIX — SUCCESS CRITERIA DA PLATAFORMA

## 232. TECHNICAL SUCCESS

- consistente;
- segura;
- testável;
- operável;
- extensível.

---

## 233. MERCHANT SUCCESS

Lojista consegue:

- configurar;
- publicar;
- vender;
- operar;
- entender.

---

## 234. CUSTOMER SUCCESS

Consumidor consegue:

- descobrir;
- confiar;
- comprar;
- acompanhar.

---

## 235. PLATFORM SUCCESS

NextLevel consegue:

- operar milhares de lojas;
- diagnosticar problemas;
- adicionar capacidades;
- trocar providers;
- evoluir sem rewrite.

---

# PARTE LXX — ANTI-PATTERNS

## 236. EVITAR

- implementar os documentos literalmente em ordem numérica;
- reescrever tudo;
- criar microserviço por domínio prematuramente;
- criar feature sem owner;
- aceitar mock como produção;
- criar dashboard antes dos dados;
- criar AI antes das métricas;
- theme antes de storefront contract;
- marketplace antes de core sólido;
- provider no domínio;
- plano comercial espalhado no código;
- fork por segmento;
- fork por cliente;
- decisão estrutural silenciosa por agente.

---

# PARTE LXXI — IMMEDIATE EXECUTION PLAN

## 237. AGORA

Com os documentos arquiteturais completos, a sequência imediata deve ser:

1. entregar os documentos ao ambiente de desenvolvimento;
2. auditar o repositório real;
3. gerar mapa AS-IS;
4. comparar com TO-BE;
5. produzir gap matrix;
6. identificar P0/P1;
7. definir primeiro lote;
8. implementar;
9. testar;
10. revisar contra documentos.

---

# 238. REGRA FINAL

O roadmap da NextLevel não é uma lista de telas.

É a sequência pela qual capacidades confiáveis passam a existir.

> **Preserve o que funciona.  
> Corrija o que viola princípios.  
> Construa primeiro as fundações que reduzem retrabalho.  
> Entregue capacidades ponta a ponta.  
> E só aumente a complexidade quando o produto realmente exigir.**
