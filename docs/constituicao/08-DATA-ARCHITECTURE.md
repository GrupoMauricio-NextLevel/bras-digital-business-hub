# 08 — DATA ARCHITECTURE

> **Status:** Documento especializado de arquitetura de dados e engenharia  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`, `03-PLATFORM-CORE.md`, `04-VISUAL-COMMERCE.md`, `05-MERCHANT-PANEL-UX.md`, `06-STOREFRONT-UX-CONVERSION.md`, `07-THEMES-TEMPLATES-SEGMENTS.md`  
> **Escopo:** Modelo de dados, consistência, invariantes, transações, snapshots, histórico, multi-tenancy, concorrência, migrations, integridade e evolução do schema  
> **Não cobre:** UX visual, regras de negócio detalhadas de cada módulo, provider-specific integrations ou decisões de infraestrutura não relacionadas à persistência

---

# 1. OBJETIVO

Definir princípios e estruturas para que os dados da Plataforma NextLevel permaneçam:

- corretos;
- isolados por tenant;
- auditáveis;
- consistentes;
- evolutivos;
- migráveis;
- recuperáveis;
- performáticos;
- seguros;
- compreensíveis.

A arquitetura de dados deve proteger o produto contra:

- duplicidade;
- corrupção silenciosa;
- inconsistência entre módulos;
- perda de histórico;
- vazamento entre lojas;
- concorrência;
- reprocessamento;
- migrations frágeis;
- dependência indevida da UI.

---

# 2. PRINCÍPIO CENTRAL

A pergunta fundamental é:

> **“Qual é a fonte de verdade deste dado e quais invariantes precisam permanecer válidos?”**

Toda entidade importante deve possuir:

- owner claro;
- lifecycle;
- regras de mutabilidade;
- tenant scope;
- relação com histórico;
- estratégia de concorrência;
- estratégia de auditoria;
- estratégia de migração.

---

# PARTE I — FONTES DE VERDADE

## 3. SINGLE SOURCE OF TRUTH

Cada conceito central deve possuir uma fonte de verdade principal.

Exemplos:

- produto → catálogo;
- estoque → inventory ledger/state;
- pedido → order domain;
- pagamento → payment domain;
- cliente → customer domain;
- theme publicado → published theme state;
- domínio → domain configuration;
- capability → entitlement state.

---

## 4. PROJEÇÕES

Podem existir:

- materialized views;
- cache;
- search index;
- analytics tables;
- denormalizações;
- read models.

Essas estruturas devem ser tratadas como derivadas.

---

## 5. REBUILDABILITY

Quando possível, uma projeção deve poder ser reconstruída a partir da fonte de verdade.

---

# PARTE II — IDENTIFICADORES

## 6. INTERNAL ID

Entidades devem possuir identificador interno estável.

Não depender de:

- nome;
- slug;
- e-mail;
- domínio;
- SKU externo.

---

## 7. PUBLIC ID

Pode existir identificador público separado.

Útil para:

- URLs;
- APIs;
- exposição externa.

---

## 8. DISPLAY NUMBER

Pedidos e outros objetos podem possuir número amigável independente do id interno.

Exemplo:

`#10482`

---

## 9. EXTERNAL ID

Integrações podem exigir IDs externos.

Armazenar de forma namespaced.

Exemplo:

- provider;
- external_id;
- resource_type.

---

# PARTE III — MULTI-TENANCY

## 10. TENANT KEY

Entidades tenant-scoped devem possuir tenant/store id explícito quando aplicável.

---

## 11. QUERY SAFETY

Toda query tenant-scoped deve exigir contexto de tenant.

Evitar chamadas que dependam de filtro opcional.

---

## 12. COMPOSITE UNIQUENESS

Uniqueness deve considerar tenant.

Exemplos:

- SKU por loja;
- slug por loja;
- coupon code por loja;
- customer e-mail por loja, quando aplicável.

---

## 13. FOREIGN KEYS E TENANT

Relacionamentos devem evitar cruzamento acidental entre tenants.

Quando possível, validar tenant também em lógica de domínio.

---

## 14. GLOBAL TABLES

Entidades globais devem ser explicitamente globais.

Exemplos:

- theme catalog;
- platform plan;
- shared reference data.

---

# PARTE IV — NORMALIZAÇÃO

## 15. NORMALIZATION

Normalizar quando isso preserva:

- integridade;
- clareza;
- reutilização.

---

## 16. DENORMALIZATION

Denormalizar quando necessário para:

- performance;
- snapshots;
- read models;
- analytics.

A denormalização precisa de owner e estratégia de atualização.

---

## 17. JSON

JSON pode ser adequado para:

- settings versionados;
- provider metadata;
- extensibilidade controlada.

Não usar JSON para esconder domínio mal modelado.

---

# PARTE V — SNAPSHOTS

## 18. SNAPSHOT PRINCIPLE

Dados históricos devem preservar o estado relevante da transação no momento em que ocorreu.

---

## 19. ORDER SNAPSHOT

Pedido deve preservar:

- product name;
- SKU;
- variant description;
- unit price;
- discounts;
- shipping;
- tax quando aplicável;
- total;
- endereço;
- customer contact relevante.

---

## 20. PRODUCT EDIT AFTER ORDER

Editar catálogo não deve alterar pedido antigo.

---

## 21. ADDRESS SNAPSHOT

Endereço de pedido é snapshot.

Não referência mutável ao endereço atual do cliente.

---

## 22. THEME SNAPSHOT

Publicação visual pode usar snapshot/version.

---

# PARTE VI — HISTÓRICO

## 23. HISTORY

Histórico deve existir onde o valor presente não é suficiente para explicar o passado.

---

## 24. AUDIT VS HISTORY

Audit responde:

- quem alterou;
- quando;
- o que.

History responde:

- quais estados existiram;
- como evoluiu.

---

## 25. SOFT DELETE

Pode preservar histórico sem expor entidade ativa.

---

## 26. TEMPORAL DATA

Para domínios críticos, considerar:

- valid_from;
- valid_to;
- version;
- effective_at.

Quando realmente necessário.

---

# PARTE VII — ESTADOS E STATE MACHINES

## 27. STATUS

Status deve ser limitado a valores válidos.

---

## 28. INVALID TRANSITION

Banco e domínio devem impedir transições inválidas.

---

## 29. TRANSITION RECORD

Para estados críticos, registrar transição.

Exemplos:

- order;
- payment;
- shipment;
- store lifecycle;
- domain verification.

---

# PARTE VIII — TRANSAÇÕES

## 30. TRANSACTION BOUNDARY

Operações que precisam ser atômicas devem ocorrer na mesma transação quando possível.

---

## 31. CHECKOUT

Finalização pode exigir atomicidade entre:

- criar pedido;
- criar itens;
- reservar estoque;
- registrar payment intent;
- persistir snapshot.

---

## 32. CANCELAMENTO

Pode exigir:

- mudar estado;
- liberar reserva;
- criar evento;
- registrar audit.

---

## 33. PAYMENT UPDATE

Pagamento aprovado deve atualizar estado de forma consistente.

---

## 34. LIMITES

Não manter transação aberta durante chamada externa lenta quando houver alternativa segura.

---

# PARTE IX — IDEMPOTÊNCIA

## 35. IDEMPOTENCY KEY

Operações críticas devem poder receber idempotency key.

---

## 36. UNIQUE IDEMPOTENCY

Persistir chave + resultado quando necessário.

---

## 37. REPLAY

Repetir a mesma requisição deve retornar resultado compatível sem novo efeito.

---

## 38. WEBHOOK

Webhook duplicado não pode duplicar:

- pagamento;
- stock move;
- shipment;
- refund.

---

# PARTE X — CONCORRÊNCIA

## 39. RACE CONDITIONS

A plataforma deve assumir concorrência real.

---

## 40. INVENTORY

Estoque é área crítica.

Evitar read-then-write sem controle.

---

## 41. OPTIMISTIC LOCKING

Pode utilizar version column.

---

## 42. PESSIMISTIC LOCKING

Pode ser apropriado em operações críticas.

---

## 43. ATOMIC UPDATE

Preferir updates condicionais quando possível.

Exemplo conceitual:

`UPDATE inventory SET reserved = reserved + x WHERE available >= x`

---

## 44. UNIQUE CONSTRAINT

Constraint pode ser melhor proteção que validação de aplicação.

---

# PARTE XI — MONEY

## 45. MONEY TYPE

Valores monetários devem possuir representação consistente.

---

## 46. INTEGER MINOR UNIT

Quando aplicável, usar centavos/unidade mínima.

---

## 47. DECIMAL

Para regras que exigem precisão decimal, usar tipo adequado.

---

## 48. CURRENCY

Moeda deve ser explícita.

Nunca assumir implicitamente BRL em estrutura que pode evoluir.

---

## 49. ROUNDING

Regra de arredondamento deve ser centralizada.

---

# PARTE XII — INVENTORY DATA

## 50. INVENTORY STATE

Conceitos:

- on_hand;
- reserved;
- available.

---

## 51. LEDGER

Movimentações devem ser registradas.

---

## 52. BALANCE RECONCILIATION

Saldo atual deve poder ser reconciliado com ledger.

---

## 53. NEGATIVE STOCK

Se permitido, deve ser regra explícita.

---

## 54. LOCATION

Mesmo que V1 use um único local, evitar bloquear evolução para múltiplos locais sem necessidade.

---

# PARTE XIII — PRODUCT DATA

## 55. PRODUCT

Entidade comercial.

---

## 56. VARIANT

Combinação vendável.

---

## 57. SKU

Identificador operacional.

---

## 58. ATTRIBUTE MODEL

Atributos estruturados devem permitir:

- filtros;
- variações;
- exibição;
- integração.

---

## 59. SLUG

Slug deve ser único por store/contexto.

---

## 60. REDIRECT

Troca de slug pode criar redirect.

---

# PARTE XIV — CUSTOMER DATA

## 61. CUSTOMER

Customer é store-scoped por padrão.

---

## 62. GUEST

Guest checkout não exige account.

---

## 63. CUSTOMER ACCOUNT

Pode existir separadamente.

---

## 64. CONSENT

Consentimento precisa de:

- purpose;
- source;
- granted_at;
- revoked_at.

---

## 65. PII

Classificar dados pessoais.

---

# PARTE XV — ORDER DATA

## 66. ORDER NUMBER

Separado do internal id.

---

## 67. ORDER ITEM

Snapshot imutável onde necessário.

---

## 68. TOTALS

Persistir totais relevantes.

---

## 69. DERIVED TOTAL

Mesmo persistindo total, validação matemática deve existir.

---

## 70. ORDER VERSION

Alterações administrativas podem incrementar version.

---

# PARTE XVI — PAYMENT DATA

## 71. PAYMENT ATTEMPT

Cada tentativa deve ser registrável.

---

## 72. PROVIDER ID

External id deve ser único por provider/contexto.

---

## 73. RAW PROVIDER PAYLOAD

Evitar armazenar payload integral sem necessidade.

---

## 74. SENSITIVE PAYMENT DATA

Nunca armazenar dados proibidos de cartão.

---

## 75. RECONCILIATION DATA

Preservar informação suficiente para reconciliação.

---

# PARTE XVII — SHIPMENT DATA

## 76. SHIPMENT

Separado de order.

---

## 77. MULTIPLE SHIPMENTS

Modelar possibilidade futura sem complicar V1.

---

## 78. TRACKING EVENT

Eventos de rastreio podem ser normalizados.

---

# PARTE XVIII — EVENT DATA

## 79. EVENT ID

Todo evento deve possuir id único.

---

## 80. EVENT VERSION

Payload externo deve ser versionado.

---

## 81. OCCURRED VS PROCESSED

Distinguir:

- occurred_at;
- received_at;
- processed_at.

---

## 82. CORRELATION

Correlation id ajuda rastreabilidade.

---

# PARTE XIX — OUTBOX

## 83. TRANSACTIONAL OUTBOX

Quando consistência entre gravação e evento for crítica, considerar outbox.

---

## 84. PURPOSE

Evitar:

- banco commitado;
- evento perdido.

---

## 85. PROCESSING

Worker lê outbox e publica/processa.

---

## 86. IDEMPOTENT CONSUMER

Consumidor também precisa tolerar duplicidade.

---

# PARTE XX — JOB DATA

## 87. JOB

Persistir estado de jobs importantes.

---

## 88. RETRY COUNT

Registrar tentativas.

---

## 89. ERROR CONTEXT

Erro deve ser diagnosticável.

---

## 90. TENANT CONTEXT

Todo job tenant-scoped carrega tenant.

---

# PARTE XXI — IMPORT/EXPORT DATA

## 91. IMPORT BATCH

Registrar:

- arquivo;
- tenant;
- status;
- mapping;
- contagens;
- erros;
- timestamps.

---

## 92. ROW ERROR

Erro por linha deve ser persistível.

---

## 93. EXTERNAL REFERENCE

Import pode guardar legacy id.

---

## 94. RE-IMPORT

Evitar duplicação por reupload quando possível.

---

# PARTE XXII — SEARCH INDEX

## 95. SEARCH INDEX

Índice é derivado.

---

## 96. REINDEX

Precisa ser reconstruível.

---

## 97. TENANT FILTER

Tenant isolation também no search.

---

# PARTE XXIII — CACHE

## 98. CACHE

Cache não é fonte de verdade.

---

## 99. CACHE KEY

Deve incluir tenant/contexto quando necessário.

---

## 100. INVALIDATION

Invalidation deve ser explícita.

---

## 101. STALE DATA

Definir tolerância por domínio.

Checkout e estoque exigem maior rigor que conteúdo.

---

# PARTE XXIV — ANALYTICS DATA

## 102. ANALYTICS

Separar workload analítico de transacional quando escala justificar.

---

## 103. EVENT PIPELINE

Analytics pode consumir eventos.

---

## 104. METRIC DEFINITION

Métrica deve ter definição formal.

---

## 105. HISTORICAL RECOMPUTE

Quando possível, analytics deve permitir reprocessamento.

---

# PARTE XXV — SCHEMA MIGRATIONS

## 106. MIGRATION

Toda mudança de schema precisa ser versionada.

---

## 107. FORWARD-ONLY

Preferir migrations forward-safe.

---

## 108. BACKWARD COMPATIBILITY

Durante deploy, considerar versões antigas e novas coexistindo temporariamente.

---

## 109. EXPAND / MIGRATE / CONTRACT

Para mudanças críticas:

1. expandir schema;
2. migrar dados;
3. mudar aplicação;
4. remover estrutura antiga.

---

## 110. LARGE TABLE

Evitar migrations bloqueantes.

---

## 111. DEFAULTS

Adicionar coluna não-null precisa estratégia segura.

---

# PARTE XXVI — DATA MIGRATION

## 112. BUSINESS MIGRATION

Mudança de modelo pode exigir migração de dados, não apenas DDL.

---

## 113. VALIDATION

Após migrar, validar:

- contagem;
- integridade;
- foreign keys;
- invariantes;
- checksums quando útil.

---

## 114. ROLLBACK

Nem toda migration é facilmente reversível.

Planejar recovery.

---

# PARTE XXVII — CONSTRAINTS

## 115. DATABASE CONSTRAINTS

Usar banco para proteger regras simples e importantes.

Exemplos:

- not null;
- unique;
- foreign key;
- check constraints.

---

## 116. DOMAIN CONSTRAINTS

Regras complexas permanecem no domínio.

---

## 117. DUPLICATE PROTECTION

Combinar:

- unique constraints;
- idempotency;
- application validation.

---

# PARTE XXVIII — SOFT DELETE

## 118. DELETED_AT

Soft delete pode ser apropriado.

---

## 119. UNIQUE + SOFT DELETE

Cuidado com uniqueness após exclusão.

---

## 120. DEFAULT SCOPE

Queries não devem retornar deletados acidentalmente.

---

# PARTE XXIX — RETENTION

## 121. RETENTION POLICY

Cada categoria de dado precisa política.

---

## 122. TRANSACTIONAL DATA

Pode exigir longa retenção.

---

## 123. LOGS

Retenção menor.

---

## 124. PII

Retenção deve respeitar finalidade.

---

# PARTE XXX — BACKUP E RECOVERY

## 125. BACKUP

Banco precisa de estratégia de backup.

---

## 126. POINT-IN-TIME

Quando disponível, usar PITR.

---

## 127. RESTORE TEST

Backup não testado não é garantia.

---

## 128. TENANT RESTORE

Recuperar apenas uma loja pode ser requisito futuro.

---

# PARTE XXXI — OBSERVABILIDADE DE DADOS

## 129. DATA HEALTH

Monitorar:

- constraint failures;
- migration failures;
- replication lag quando houver;
- job backlog;
- deadlocks;
- slow queries.

---

## 130. BUSINESS INVARIANT MONITORING

Criar checks para:

- order total inconsistente;
- negative available indevido;
- payment sem order;
- duplicate external id;
- orphan records.

---

# PARTE XXXII — PERFORMANCE

## 131. INDEXES

Criar índices com base em query real.

---

## 132. OVER-INDEXING

Índice também custa escrita/storage.

---

## 133. COMPOSITE INDEX

Ordem deve refletir filtro real.

---

## 134. PAGINATION

Para grandes volumes, preferir cursor quando apropriado.

---

## 135. N+1

Evitar em queries de painel/storefront.

---

# PARTE XXXIII — SECURITY

## 136. ENCRYPTION

Dados sensíveis podem exigir criptografia at rest/application level.

---

## 137. SECRETS

Nunca armazenar secrets em tabela comum sem proteção.

---

## 138. ACCESS

Princípio de menor privilégio no banco.

---

## 139. PROD ACCESS

Acesso humano a produção deve ser restrito e auditável.

---

# PARTE XXXIV — DATA CONTRACTS

## 140. API DTO

Não expor schema interno diretamente.

---

## 141. VERSIONING

Contratos públicos precisam de compatibilidade.

---

## 142. NULLABILITY

Semântica de null deve ser clara.

---

## 143. ENUM

Enums públicos exigem cuidado para evolução.

---

# PARTE XXXV — DOMAIN BOUNDARIES

## 144. OWNERSHIP

Cada tabela importante deve ter módulo owner.

---

## 145. CROSS-MODULE WRITE

Módulo não deve escrever diretamente na tabela de outro domínio sem contrato.

---

## 146. READ MODELS

Leitura cruzada pode utilizar projection/query service.

---

# PARTE XXXVI — DATA GOVERNANCE

## 147. DATA CATALOG

Futuramente manter catálogo de dados importantes.

---

## 148. CLASSIFICATION

Classificar:

- public;
- internal;
- confidential;
- sensitive.

---

## 149. OWNER

Cada dado sensível deve ter owner.

---

# PARTE XXXVII — DATA QUALITY

## 150. REQUIRED FIELDS

Não exigir campo apenas por facilidade técnica.

---

## 151. NORMALIZATION

Normalizar telefone, e-mail, CEP quando apropriado.

---

## 152. VALIDATION SOURCE

Validação server-side é final.

---

## 153. DUPLICATES

Definir estratégia de deduplicação por domínio.

---

# PARTE XXXVIII — EVENTUAL CONSISTENCY

## 154. ACCEPTABLE EVENTUAL CONSISTENCY

Algumas áreas toleram atraso:

- analytics;
- search index;
- recommendations.

---

## 155. STRICT CONSISTENCY

Áreas críticas:

- estoque;
- total do checkout;
- payment state;
- entitlement crítico;
- tenant access.

---

# PARTE XXXIX — WBUY: APRENDIZADOS

## 156. ESTOQUE

A pesquisa WBuy mostrou histórico de movimentações.

### Decisão NextLevel

Modelar ledger + estado atual com rastreabilidade rica.

---

## 157. STATUS VISUAL

WBuy retornou metadados visuais junto de status.

### Decisão NextLevel

Persistir semântica, não aparência.

---

## 158. EXPORTAÇÃO

WBuy expõe dados em XLSX.

### Decisão NextLevel

Modelo de dados deve facilitar portabilidade.

---

## 159. GRADE

WBuy demonstrou experiências `sku` e `grid`.

### Decisão NextLevel

Estrutura de SKU permanece estável; compra em grade é regra/experiência.

---

# PARTE XL — TESTES

## 160. INVARIANT TESTS

Testar:

- totals;
- tenant isolation;
- uniqueness;
- stock;
- transitions;
- idempotency;
- snapshot integrity.

---

## 161. MIGRATION TESTS

Executar migrations em base representativa.

---

## 162. CONCURRENCY TESTS

Simular:

- duas compras do último item;
- webhook duplicado;
- retry simultâneo;
- refund concorrente.

---

## 163. RESTORE TEST

Validar backup/restore periodicamente.

---

# PARTE XLI — ANTI-PATTERNS

## 164. EVITAR

- tabela gigante para todo o sistema;
- JSON para tudo;
- foreign key sem tenant consideration;
- string status livre;
- apagar histórico;
- usar float para dinheiro;
- confiar em cache como verdade;
- query sem tenant;
- migration manual em produção;
- alterar schema sem versionamento;
- provider fields espalhados pelo core;
- duplicar customer por tela;
- pedido referenciando apenas product atual;
- webhook sem idempotência.

---

# PARTE XLII — O QUE NÃO PERTENCE AQUI

## 165. FORA DE DATA ARCHITECTURE

Pertencem a outros documentos:

- UX do painel;
- storefront;
- design visual;
- theme components;
- business copy;
- provider selection;
- deployment topology;
- marketing strategy.

---

# PARTE XLIII — OPEN QUESTIONS

## 166. QUESTÕES ABERTAS

Precisam de decisão conforme evolução:

- banco principal definitivo;
- estratégia de sharding;
- multi-region;
- read replicas;
- analytics warehouse;
- event store;
- search engine;
- cache provider;
- queue provider;
- object storage;
- encryption strategy;
- tenant restore;
- data residency;
- multi-currency;
- multi-location stock;
- fiscal data model;
- order editing;
- long-term archival.

---

# 167. REGRA FINAL

A arquitetura de dados deve fazer o sistema continuar correto mesmo quando:

- a UI mudar;
- integrações falharem;
- requests se repetirem;
- duas ações ocorrerem ao mesmo tempo;
- uma loja crescer;
- o schema evoluir;
- o sistema precisar recuperar histórico.

> **Dados corretos valem mais que telas rápidas de construir.  
> Histórico precisa continuar verdadeiro.  
> Tenant precisa continuar isolado.  
> E cada fato importante precisa ser explicável.**
