# 09 — INTEGRATIONS & EXTENSIBILITY

> **Status:** Documento especializado de arquitetura e engenharia  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`, `03-PLATFORM-CORE.md`, `04-VISUAL-COMMERCE.md`, `05-MERCHANT-PANEL-UX.md`, `06-STOREFRONT-UX-CONVERSION.md`, `07-THEMES-TEMPLATES-SEGMENTS.md`, `08-DATA-ARCHITECTURE.md`  
> **Escopo:** Integrações, adapters, APIs, webhooks, apps, extensões, contratos públicos, segurança de integrações e governança de ecossistema  
> **Não cobre:** UX detalhada do painel, regras comerciais centrais, engine visual interna ou escolha de provedores específicos

---

# 1. OBJETIVO

Definir como a Plataforma NextLevel se conecta com sistemas externos sem transformar essas dependências em parte inseparável do core.

A arquitetura deve permitir:

- múltiplos gateways;
- múltiplas transportadoras;
- ERPs;
- CRMs;
- analytics;
- pixels;
- marketplaces;
- notificações;
- webhooks;
- APIs públicas;
- apps;
- extensions;
- automações;
- integrações futuras ainda desconhecidas.

O objetivo é preservar:

- estabilidade do core;
- substituibilidade;
- segurança;
- observabilidade;
- versionamento;
- isolamento por tenant;
- idempotência;
- boa experiência operacional.

---

# 2. PRINCÍPIO CENTRAL

O sistema interno define contratos.

Os provedores implementam adapters.

A regra é:

> **Provider específico não define o domínio.  
> O domínio define o que precisa acontecer.  
> O adapter traduz isso para o provider.**

Exemplo:

O Commerce Core conhece:

`PaymentProvider`

Não:

`MercadoPagoPaymentRuleEverywhere`

---

# PARTE I — TIPOS DE INTEGRAÇÃO

## 3. PAYMENT INTEGRATION

Responsável por:

- payment intents;
- cobrança;
- status;
- webhook;
- refund;
- conciliação.

---

## 4. SHIPPING INTEGRATION

Responsável por:

- cotação;
- etiqueta;
- tracking;
- carriers;
- prazos;
- eventos de entrega.

---

## 5. ERP INTEGRATION

Pode sincronizar:

- produtos;
- estoque;
- pedidos;
- clientes;
- notas;
- status.

---

## 6. MARKETPLACE INTEGRATION

Pode sincronizar:

- catálogo;
- preço;
- estoque;
- pedidos;
- status.

Não deve redefinir o core da loja virtual.

---

## 7. ANALYTICS INTEGRATION

Exemplos:

- analytics;
- tag managers;
- pixels;
- attribution providers.

---

## 8. MESSAGING INTEGRATION

Exemplos:

- e-mail;
- SMS;
- WhatsApp;
- push.

---

## 9. CRM / MARKETING

Pode consumir:

- customers;
- consent;
- orders;
- events;
- segments.

---

## 10. STORAGE / MEDIA PROVIDERS

Podem fornecer:

- object storage;
- CDN;
- image processing.

---

# PARTE II — CONTRACT-FIRST

## 11. INTERNAL CONTRACT

Cada categoria de integração deve possuir interface/contrato estável.

---

## 12. CONTRACT EXAMPLE — PAYMENT

Conceitualmente:

- createPayment();
- getPaymentStatus();
- refundPayment();
- verifyWebhook();
- reconcilePayment();

---

## 13. CONTRACT EXAMPLE — SHIPPING

Conceitualmente:

- quote();
- createShipment();
- createLabel();
- cancelShipment();
- trackShipment();

---

## 14. NO PROVIDER LEAKAGE

Campos específicos de provider não devem vazar por todo o domínio.

---

## 15. PROVIDER METADATA

Dados específicos podem ser armazenados em metadata namespaced.

---

# PARTE III — ADAPTERS

## 16. PROVIDER ADAPTER

Adapter converte entre:

- modelo interno;
- API externa.

---

## 17. ADAPTER RESPONSIBILITIES

Pode incluir:

- autenticação;
- serialização;
- request;
- response mapping;
- retry;
- rate limit;
- error normalization.

---

## 18. ADAPTER NÃO DEVE CONTER DOMÍNIO

Regra comercial pertence ao core.

---

## 19. PROVIDER-SPECIFIC LIMITS

Limites devem ser encapsulados no adapter.

---

# PARTE IV — INTEGRATION ENTITY

## 20. STORE INTEGRATION

Cada integração por loja deve possuir estado próprio.

---

## 21. FIELDS

Pode conter:

- id;
- store_id;
- provider;
- type;
- status;
- config;
- secret reference;
- scopes;
- last_sync;
- last_success;
- last_error;
- health;
- version.

---

## 22. STATUS

Estados conceituais:

- CONNECTED;
- DEGRADED;
- ERROR;
- EXPIRED;
- DISCONNECTED;
- PENDING_AUTH.

---

# PARTE V — CREDENTIALS E SECRETS

## 23. SECRET STORAGE

Secrets devem utilizar armazenamento seguro.

---

## 24. NEVER LOG

Nunca registrar:

- access token;
- refresh token;
- client secret;
- API key;
- private key.

---

## 25. DISPLAY

Após salvar, mostrar apenas:

- masked value;
- last four;
- updated_at.

---

## 26. ROTATION

Credenciais devem poder ser rotacionadas.

---

## 27. REVOCATION

Desconectar integração deve revogar credencial quando provider permitir.

---

# PARTE VI — OAUTH

## 28. OAUTH

Quando disponível, preferir OAuth a copiar token manual.

---

## 29. STATE

Fluxo OAuth deve usar state seguro.

---

## 30. CALLBACK

Callback deve validar:

- state;
- tenant;
- provider;
- user.

---

## 31. REFRESH TOKEN

Refresh deve ser seguro e observável.

---

## 32. EXPIRED TOKEN

Integração deve mudar health/status claramente.

---

# PARTE VII — SCOPES

## 33. MINIMUM SCOPE

Solicitar apenas permissões necessárias.

---

## 34. STORE SCOPES

Apps externos podem receber permissões como:

- read_products;
- write_products;
- read_orders;
- write_orders;
- read_customers;
- read_inventory;
- write_inventory.

---

## 35. SCOPE REVIEW

Mudança de escopo pode exigir nova autorização.

---

# PARTE VIII — WEBHOOKS INBOUND

## 36. WEBHOOK RECEIVER

Webhook deve possuir endpoint dedicado.

---

## 37. VERIFICATION

Validar:

- signature;
- secret;
- timestamp;
- replay protection;
- source.

---

## 38. ACKNOWLEDGEMENT

Responder rápido.

Processamento pesado deve ocorrer async quando apropriado.

---

## 39. RAW EVENT STORAGE

Pode registrar payload minimamente necessário para auditoria/reprocessamento.

---

## 40. IDEMPOTENCY

Duplicado não gera efeito duplicado.

---

## 41. ORDERING

Não assumir ordem perfeita.

---

## 42. LATE EVENT

Evento atrasado deve ser validado contra estado atual.

---

# PARTE IX — WEBHOOKS OUTBOUND

## 43. EVENT SUBSCRIPTION

Apps podem assinar eventos permitidos.

---

## 44. SUBSCRIPTION

Pode conter:

- app;
- store;
- endpoint;
- event types;
- secret;
- status.

---

## 45. SIGNATURE

Todo outbound webhook deve ser assinado.

---

## 46. RETRY

Retry com backoff.

---

## 47. DELIVERY LOG

Registrar:

- event id;
- attempt;
- status;
- response code;
- duration;
- next retry.

---

## 48. DISABLE

Endpoint persistentemente falho pode ser desativado.

---

# PARTE X — API PÚBLICA

## 49. PUBLIC API

A plataforma pode expor API pública.

---

## 50. VERSIONING

Versão explícita.

Exemplo conceitual:

`/api/v1/`

---

## 51. RESOURCE MODEL

Recursos públicos devem ser estáveis e semânticos.

---

## 52. NO DATABASE SHAPE LEAK

Não expor diretamente tabela interna.

---

## 53. RATE LIMIT

API deve possuir rate limits.

---

## 54. PAGINATION

Padronizar paginação.

---

## 55. ERRORS

Padronizar error schema.

---

# PARTE XI — AUTH DE API

## 56. API TOKEN

Tokens podem ser:

- personal;
- app;
- service account.

---

## 57. TOKEN SCOPE

Token deve possuir scopes.

---

## 58. EXPIRATION

Pode haver expiração.

---

## 59. REVOCATION

Revogação imediata.

---

# PARTE XII — APPS

## 60. APP MODEL

App representa integração instalável.

---

## 61. APP METADATA

Pode possuir:

- id;
- name;
- slug;
- developer;
- permissions;
- webhook subscriptions;
- extension points;
- version;
- status;
- pricing metadata.

---

## 62. APP INSTALLATION

Instalação deve:

- informar permissões;
- solicitar consentimento;
- criar installation;
- gerar credenciais;
- registrar scopes.

---

## 63. APP INSTALLATION ENTITY

Pode conter:

- app_id;
- store_id;
- status;
- granted_scopes;
- installed_by;
- installed_at;
- config;
- secret refs.

---

## 64. UNINSTALL

Deve:

- revogar tokens;
- remover webhooks;
- desativar extensions;
- preservar histórico necessário.

---

# PARTE XIII — EXTENSION POINTS

## 65. EXTENSION POINT

Superfície formal de extensão.

---

## 66. ADMIN EXTENSIONS

Exemplos:

- order sidebar;
- product action;
- settings card.

---

## 67. STOREFRONT EXTENSIONS

Exemplos:

- product.afterPrice;
- product.afterAddToCart;
- cart.beforeSummary.

---

## 68. CHECKOUT EXTENSIONS

Mais restritas.

Não permitir:

- alterar total arbitrariamente;
- capturar cartão;
- remover validações;
- burlar autorização.

---

## 69. DATA CONTRACT

Cada extension point deve definir:

- dados fornecidos;
- ações permitidas;
- permissions;
- lifecycle;
- error boundary.

---

# PARTE XIV — SANDBOXING

## 70. THIRD-PARTY CODE

Código externo deve ser controlado.

---

## 71. ISOLATION

Pode exigir:

- iframe;
- sandbox;
- isolated runtime;
- restricted API.

---

## 72. NO SECRET ACCESS

App nunca recebe secret interno da plataforma.

---

## 73. DOM ACCESS

Acesso ao DOM do storefront deve ser restrito.

---

# PARTE XV — APP BLOCKS

## 74. APP BLOCK

App pode fornecer block visual para Theme Engine.

---

## 75. SCHEMA

Block precisa de schema validado.

---

## 76. PERFORMANCE BUDGET

Apps visuais precisam respeitar budget.

---

## 77. FAILURE BOUNDARY

Falha do app block não derruba página.

---

# PARTE XVI — SYNCHRONIZATION

## 78. SYNC DIRECTION

Sincronização deve declarar direção:

- inbound;
- outbound;
- bidirectional.

---

## 79. SOURCE OF TRUTH

Definir explicitamente qual sistema vence.

---

## 80. CONFLICT

Conflito precisa de política.

---

## 81. LAST WRITE WINS

Não usar por padrão sem analisar.

---

## 82. MAPPING

Integrações podem precisar mapping.

Exemplos:

- SKU;
- status;
- category;
- warehouse;
- carrier.

---

# PARTE XVII — INITIAL SYNC

## 83. BOOTSTRAP

Integração pode precisar carga inicial.

---

## 84. PROGRESS

Mostrar progresso.

---

## 85. PARTIAL FAILURE

Itens com erro devem ser listados.

---

## 86. RESUME

Permitir retomada.

---

# PARTE XVIII — INCREMENTAL SYNC

## 87. DELTA

Preferir delta quando provider suporta.

---

## 88. CURSOR

Persistir cursor/checkpoint.

---

## 89. RECONCILIATION

Executar reconciliação periódica para detectar divergências.

---

# PARTE XIX — CONFLICT RESOLUTION

## 90. PRIORITY

Definir prioridade por campo quando necessário.

---

## 91. MANUAL REVIEW

Conflitos importantes podem exigir revisão.

---

## 92. AUDIT

Registrar resolução.

---

# PARTE XX — PROVIDER HEALTH

## 93. HEALTH

Integração precisa de health state.

---

## 94. HEALTH SIGNALS

Pode usar:

- auth valid;
- last success;
- error rate;
- latency;
- webhook freshness;
- sync backlog.

---

## 95. USER MESSAGE

Traduzir health técnico em linguagem operacional.

---

# PARTE XXI — RETRY E BACKOFF

## 96. RETRYABLE ERROR

Classificar.

---

## 97. NON-RETRYABLE

Exemplo:

- invalid credentials;
- permission denied;
- malformed request.

---

## 98. EXPONENTIAL BACKOFF

Usar quando apropriado.

---

## 99. JITTER

Evitar thundering herd.

---

# PARTE XXII — RATE LIMITS

## 100. PROVIDER RATE LIMIT

Respeitar headers/limits.

---

## 101. INTERNAL QUEUE

Pode serializar chamadas.

---

## 102. STORE FAIRNESS

Uma loja não deve consumir quota de todas as outras.

---

# PARTE XXIII — TIMEOUTS

## 103. TIMEOUT POLICY

Toda chamada externa precisa de timeout.

---

## 104. USER REQUEST

Não bloquear interface por integração lenta.

---

# PARTE XXIV — CIRCUIT BREAKER

## 105. DEGRADATION

Provider indisponível não deve derrubar sistema inteiro.

---

## 106. FALLBACK

Pode existir fallback seguro.

Exemplo:

- frete indisponível → informar;
- não inventar cotação.

---

# PARTE XXV — ERRORS

## 107. NORMALIZED ERROR

Adapter converte erro externo em erro interno semântico.

---

## 108. PROVIDER DETAIL

Preservar detalhe técnico para suporte.

---

## 109. USER DETAIL

Mostrar mensagem compreensível.

---

# PARTE XXVI — LOGGING

## 110. INTEGRATION LOG

Registrar:

- provider;
- store;
- operation;
- status;
- duration;
- correlation;
- error category.

---

## 111. PII REDACTION

Redigir PII e secrets.

---

# PARTE XXVII — TEST MODE

## 112. SANDBOX

Integrações devem suportar ambiente de teste quando provider oferece.

---

## 113. TEST CREDENTIALS

Separadas de produção.

---

## 114. TEST WEBHOOK

Não misturar eventos de sandbox com produção.

---

# PARTE XXVIII — ENVIRONMENTS

## 115. ENVIRONMENT BOUNDARY

Cada ambiente possui credenciais próprias.

---

## 116. CALLBACK URL

OAuth/webhook precisam URLs por ambiente.

---

# PARTE XXIX — DATA MAPPING

## 117. FIELD MAPPING

Integrações complexas podem exigir mapping configurável.

---

## 118. MAPPING VERSION

Mudança deve ser rastreável.

---

## 119. DEFAULT MAPPING

Fornecer defaults.

---

# PARTE XXX — IMPORT CONNECTORS

## 120. IMPORT ADAPTER

Migração de plataformas pode usar adapters específicos.

---

## 121. WBUY IMPORTER

Futuramente pode existir adapter de importação WBuy.

Ele deve mapear para modelo canônico NextLevel.

Não duplicar schema da WBuy internamente.

---

## 122. LEGACY ID

Guardar id legado como external reference.

---

# PARTE XXXI — EXPORT CONNECTORS

## 123. EXPORT

Exportação pode seguir modelo canônico.

---

## 124. PLATFORM-SPECIFIC EXPORT

Somente se houver necessidade clara.

---

# PARTE XXXII — ANALYTICS & PIXELS

## 125. EVENT CONTRACT

Analytics deve consumir eventos semânticos.

---

## 126. CLIENT VS SERVER EVENTS

Definir quando evento vem:

- browser;
- server;
- ambos.

---

## 127. DEDUPLICATION

Evitar purchase duplicado.

---

## 128. CONSENT

Respeitar consentimento.

---

# PARTE XXXIII — NOTIFICATION PROVIDERS

## 129. NOTIFICATION CONTRACT

Pode suportar:

- email;
- SMS;
- WhatsApp;
- push.

---

## 130. TEMPLATE

Conteúdo pode ser separado do provider.

---

## 131. DELIVERY STATUS

Registrar:

- queued;
- sent;
- delivered;
- failed.

---

# PARTE XXXIV — MARKETPLACE FUTURE

## 132. MARKETPLACE CONNECTOR

Marketplace é canal externo.

---

## 133. LISTING

Mapear produto interno para listing externo.

---

## 134. ORDER IMPORT

Pedido externo vira order/channel record.

---

## 135. STOCK SYNC

Precisa evitar overselling.

---

## 136. CHANNEL SOURCE

Pedido deve preservar origem.

---

# PARTE XXXV — ERP FUTURE

## 137. ERP CONNECTOR

Pode sincronizar:

- cadastro;
- estoque;
- pedido;
- fiscal.

---

## 138. SOURCE OF TRUTH

Precisa ser definido por domínio.

---

# PARTE XXXVI — SECURITY

## 139. SSRF

URLs externas precisam ser validadas.

---

## 140. SIGNATURE VERIFICATION

Obrigatória quando provider suporta.

---

## 141. IP ALLOWLIST

Pode ser adicional, não única defesa.

---

## 142. SECRET ROTATION

Suportada.

---

## 143. APP REVIEW

Apps externos precisam revisão.

---

# PARTE XXXVII — APP PERMISSIONS

## 144. CONSENT SCREEN

Exibir claramente:

- dados lidos;
- dados escritos;
- ações.

---

## 145. HIGH-RISK SCOPE

Exemplos:

- refunds;
- customer PII;
- order write;
- theme publish.

Podem exigir review adicional.

---

# PARTE XXXVIII — APP MARKETPLACE

## 146. APP STORE

Pode existir futuramente.

---

## 147. APP LISTING

Pode mostrar:

- publisher;
- description;
- permissions;
- pricing;
- reviews;
- privacy policy;
- support.

---

## 148. APPROVAL

Apps passam por:

- security review;
- permission review;
- quality review;
- performance review.

---

# PARTE XXXIX — VERSIONING

## 149. API VERSION

Contratos externos são versionados.

---

## 150. WEBHOOK VERSION

Payload versionado.

---

## 151. APP VERSION

App declara versão.

---

## 152. DEPRECATION

Mudança incompatível precisa aviso.

---

# PARTE XL — BACKWARD COMPATIBILITY

## 153. COMPATIBILITY WINDOW

Definir período razoável.

---

## 154. MIGRATION GUIDE

Mudança pública precisa documentação.

---

# PARTE XLI — OBSERVABILITY

## 155. INTEGRATION DASHBOARD

Platform Ops deve conseguir ver:

- status;
- auth;
- last success;
- errors;
- retries;
- backlog.

---

## 156. STORE VIEW

Lojista deve ver apenas contexto útil.

---

# PARTE XLII — SUPPORT

## 157. SUPPORT CONTEXT

Erro de integração deve produzir referência/correlation id.

---

## 158. RECONNECT FLOW

Deve ser simples.

---

# PARTE XLIII — WBUY: APRENDIZADOS

## 159. MIXED CONTRACTS

Pesquisa WBuy mostrou JSON em alguns módulos e HTML em outros.

### Decisão NextLevel

Contratos de integração serão estruturados e semânticos.

---

## 160. EXPORTS

WBuy demonstrou valor de portabilidade.

### Decisão NextLevel

Import/export e future migration adapters são capacidades formais.

---

## 161. SECURITY

A WBuy evidenciou preocupação com acesso e 2FA.

### Decisão NextLevel

Integrações também precisam security center, revogação e audit.

---

# PARTE XLIV — TESTES

## 162. CONTRACT TESTS

Cada adapter precisa de contract tests.

---

## 163. MOCK PROVIDER

Testes locais usam provider mock.

---

## 164. WEBHOOK TESTS

Cobrir:

- valid signature;
- invalid;
- duplicate;
- delayed;
- out of order;
- retry.

---

## 165. RATE LIMIT TEST

Simular throttling.

---

## 166. TOKEN EXPIRY TEST

Simular expiração.

---

## 167. UNINSTALL TEST

Garantir revogação.

---

# PARTE XLV — ANTI-PATTERNS

## 168. EVITAR

- SDK externo chamado diretamente por toda aplicação;
- provider field no core;
- token em plain text;
- webhook sem signature;
- retry infinito;
- request sem timeout;
- sync sem source of truth;
- app com acesso total por padrão;
- custom JS irrestrito;
- HTML externo injetado sem sandbox;
- API pública sem versionamento;
- marketplace definindo produto interno;
- integração sem health state.

---

# PARTE XLVI — O QUE NÃO PERTENCE AQUI

## 169. FORA DESTE DOCUMENTO

Pertencem a outros documentos:

- product domain;
- inventory rules;
- payment business rules;
- storefront UX;
- admin UX;
- theme internal implementation;
- data warehouse;
- billing commercial strategy.

---

# PARTE XLVII — OPEN QUESTIONS

## 170. QUESTÕES ABERTAS

Precisam de decisão futura:

- API pública V1;
- GraphQL vs REST;
- app SDK;
- app marketplace;
- revenue share;
- developer portal;
- OAuth provider próprio;
- service accounts;
- webhook replay UI;
- event streaming;
- marketplace connectors;
- ERP connectors;
- WBuy migration adapter;
- custom app hosting;
- app sandbox;
- extension runtime;
- partner certification.

---

# 171. REGRA FINAL

A plataforma deve conseguir trocar, adicionar ou remover provedores sem reescrever o negócio.

> **O core fala a linguagem da NextLevel.  
> O adapter fala a linguagem do provider.  
> O contrato entre os dois precisa ser estável, seguro, observável e substituível.**
