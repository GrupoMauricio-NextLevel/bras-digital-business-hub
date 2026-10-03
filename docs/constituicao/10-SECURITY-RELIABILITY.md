# 10 — SECURITY & RELIABILITY

> **Status:** Documento especializado de segurança, confiabilidade e operação  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`, `03-PLATFORM-CORE.md`, `04-VISUAL-COMMERCE.md`, `05-MERCHANT-PANEL-UX.md`, `06-STOREFRONT-UX-CONVERSION.md`, `07-THEMES-TEMPLATES-SEGMENTS.md`, `08-DATA-ARCHITECTURE.md`, `09-INTEGRATIONS-EXTENSIBILITY.md`  
> **Escopo:** Segurança da plataforma, isolamento entre tenants, autenticação, autorização, proteção de dados, abuso, segurança de storefront/checkout, segurança de integrações, observabilidade, resiliência, incidentes, backup e recuperação  
> **Não cobre:** UX detalhada, regras comerciais completas, design visual, ou escolha final de infraestrutura/provedor

---

# 1. OBJETIVO

Definir como a Plataforma NextLevel deve proteger:

- contas;
- lojas;
- clientes;
- pedidos;
- pagamentos;
- estoque;
- integrações;
- domínios;
- temas;
- dados;
- operações internas;
- disponibilidade do serviço.

A segurança deve ser parte da arquitetura e do ciclo de vida do produto.

A confiabilidade deve garantir que falhas:

- sejam detectáveis;
- sejam isoladas quando possível;
- não corrompam dados;
- não produzam efeitos duplicados;
- permitam recuperação;
- não derrubem toda a plataforma sem necessidade.

---

# 2. PRINCÍPIO CENTRAL

A plataforma deve assumir que:

- usuários cometem erros;
- credenciais vazam;
- requests podem ser manipulados;
- integrações falham;
- providers ficam indisponíveis;
- webhooks duplicam;
- jobs repetem;
- dados podem chegar fora de ordem;
- ataques acontecem;
- deploys podem falhar;
- componentes podem ficar lentos;
- um tenant não pode afetar outro.

A arquitetura deve continuar segura e explicável mesmo nessas condições.

---

# PARTE I — MODELO DE AMEAÇA

## 3. THREAT MODEL

Cada domínio relevante deve avaliar:

- ativos;
- atores;
- superfícies de ataque;
- fronteiras de confiança;
- impacto;
- probabilidade;
- mitigação;
- detecção;
- resposta.

---

## 4. ATIVOS CRÍTICOS

Exemplos:

- credenciais;
- sessões;
- dados de clientes;
- pedidos;
- pagamentos;
- estoque;
- secrets;
- tokens;
- domínios;
- configurações;
- theme code;
- audit logs;
- backups.

---

## 5. ATORES

Considerar:

- consumidor;
- lojista;
- colaborador;
- administrador da loja;
- operador interno;
- app externo;
- integração;
- atacante externo;
- usuário comprometido;
- insider malicioso.

---

## 6. TRUST BOUNDARIES

Fronteiras principais:

- browser ↔ backend;
- storefront ↔ commerce services;
- admin ↔ platform;
- platform ↔ provider externo;
- app ↔ API;
- worker ↔ queue;
- platform ops ↔ tenant data;
- public internet ↔ webhook endpoint.

---

# PARTE II — TENANT ISOLATION

## 7. TENANT ISOLATION

Isolamento entre lojas é requisito de segurança, não convenção.

---

## 8. SERVER-SIDE CHECK

Toda ação tenant-scoped deve validar:

- authenticated actor;
- tenant;
- membership;
- resource ownership;
- permission;
- action.

---

## 9. IDOR PROTECTION

Nunca confiar apenas em IDs fornecidos pelo cliente.

---

## 10. QUERY SCOPING

Queries devem exigir tenant scope explícito.

---

## 11. CACHE ISOLATION

Cache keys precisam incluir tenant/contexto quando necessário.

---

## 12. SEARCH ISOLATION

Busca/index também deve filtrar por tenant.

---

## 13. JOB ISOLATION

Jobs carregam tenant id e validam escopo.

---

## 14. EXPORT ISOLATION

Export nunca pode incluir dados de outro tenant.

---

## 15. FILE ISOLATION

Assets privados devem respeitar ownership.

---

# PARTE III — AUTENTICAÇÃO

## 16. AUTHENTICATION

Autenticação responde:

> Quem é esta identidade?

---

## 17. PASSWORD SECURITY

Senhas devem:

- ser hashadas com algoritmo adequado;
- nunca ser logadas;
- nunca ser recuperáveis em texto puro;
- possuir proteção contra brute force;
- suportar reset seguro.

---

## 18. LOGIN RATE LIMIT

Login deve possuir:

- rate limit;
- lockout progressivo quando apropriado;
- monitoramento de tentativas;
- proteção contra credential stuffing.

---

## 19. MFA / 2FA

A arquitetura deve suportar MFA.

Especialmente para:

- owner;
- admins;
- Platform Ops;
- ações críticas.

---

## 20. PASSKEYS

Podem ser adicionadas futuramente.

---

## 21. MAGIC LINK / CODE

Se usados:

- expiração curta;
- uso único;
- assinatura;
- rate limit;
- invalidação após uso.

---

# PARTE IV — SESSÕES

## 22. SESSION

Sessões devem ser gerenciáveis.

---

## 23. SECURE COOKIE

Quando aplicável:

- HttpOnly;
- Secure;
- SameSite apropriado.

---

## 24. SESSION ROTATION

Rotacionar sessão após:

- login;
- privilege change;
- password reset;
- MFA enable;
- reauthentication.

---

## 25. SESSION REVOCATION

Usuário deve poder revogar sessões.

---

## 26. SESSION LIST

Security Center pode mostrar:

- device;
- IP aproximado;
- última atividade;
- criada em.

---

## 27. SUSPICIOUS SESSION

Pode exigir:

- logout;
- MFA;
- reauth.

---

# PARTE V — AUTORIZAÇÃO

## 28. AUTHORIZATION

Autorização é server-side.

---

## 29. DENY BY DEFAULT

Ação não explicitamente permitida deve ser negada.

---

## 30. RBAC

Roles agrupam permissões.

---

## 31. PERMISSION

Permissões devem ser semânticas.

---

## 32. HIGH-RISK ACTIONS

Exemplos:

- refund;
- payout config;
- domain change;
- user role elevation;
- API key rotation;
- store suspension;
- export customer data.

Podem exigir reautenticação.

---

## 33. PRIVILEGE ESCALATION

Alteração de role deve ser auditada.

---

# PARTE VI — PLATFORM OPS

## 34. INTERNAL ADMIN

Operações internas precisam proteção superior.

---

## 35. STRONG AUTH

Platform Ops deve exigir:

- MFA;
- menor privilégio;
- sessão curta;
- auditoria.

---

## 36. JUST-IN-TIME ACCESS

Pode ser adotado futuramente para acesso privilegiado.

---

## 37. SUPPORT ACCESS

Suporte não deve ter acesso irrestrito por padrão.

---

## 38. IMPERSONATION

Se existir:

- banner visível;
- ator real preservado;
- audit;
- expiração;
- saída fácil;
- sem acesso a secrets.

---

# PARTE VII — SECURITY CENTER

## 39. SECURITY CENTER

A plataforma deve evoluir para uma área central de segurança.

---

## 40. CAPACIDADES

Pode incluir:

- alterar senha;
- MFA;
- sessões;
- dispositivos;
- login history;
- security alerts;
- API tokens;
- app permissions;
- recent critical actions.

---

## 41. ALERTS

Alertas podem ocorrer para:

- novo IP;
- novo device;
- MFA disabled;
- password changed;
- owner changed;
- suspicious login.

---

# PARTE VIII — PROTEÇÃO DO STOREFRONT

## 42. PUBLIC ATTACK SURFACE

Storefront é superfície pública.

---

## 43. INPUT VALIDATION

Validar:

- busca;
- endereço;
- cupom;
- review;
- forms;
- query params.

---

## 44. XSS

Prevenir:

- stored XSS;
- reflected XSS;
- DOM XSS.

---

## 45. HTML SANITIZATION

Rich text precisa sanitização.

---

## 46. CSP

Content Security Policy deve ser considerada.

---

## 47. CLICKJACKING

Usar headers apropriados quando necessário.

---

## 48. OPEN REDIRECT

URLs de redirect devem ser validadas.

---

# PARTE IX — CSRF

## 49. CSRF

Operações state-changing devem ser protegidas.

---

## 50. SAME-SITE

Configuração correta de cookies ajuda, mas não substitui desenho seguro.

---

# PARTE X — SSRF

## 51. SSRF

Qualquer funcionalidade que fetch URL externa precisa proteção.

Exemplos:

- image import;
- webhook tester;
- feed import;
- oEmbed;
- URL preview.

---

## 52. BLOCK INTERNAL NETWORK

Bloquear acesso a:

- localhost;
- metadata service;
- private ranges;
- internal services.

---

# PARTE XI — FILE UPLOADS

## 53. UPLOAD SECURITY

Uploads precisam validar:

- tipo;
- MIME;
- extensão;
- tamanho;
- conteúdo quando necessário.

---

## 54. STORAGE

Arquivos não devem executar como código.

---

## 55. IMAGE PROCESSING

Processadores de mídia devem ser atualizados e isolados.

---

## 56. FILENAME

Nunca confiar em filename para path.

---

# PARTE XII — THEME SECURITY

## 57. THEME CODE

Theme não deve possuir acesso irrestrito.

---

## 58. CUSTOM JS

Deve ser limitado ou proibido por padrão.

---

## 59. CUSTOM CSS

Pode ser permitido com impacto controlado.

---

## 60. THEME REVIEW

Themes externos passam por:

- static analysis;
- dependency check;
- security review;
- performance review.

---

## 61. THEME SANDBOX

Onde possível, código não confiável deve ser isolado.

---

# PARTE XIII — APP SECURITY

## 62. APP INSTALL

Usuário vê scopes antes de instalar.

---

## 63. APP TOKEN

Token por instalação.

---

## 64. APP REVOCATION

Uninstall revoga acesso.

---

## 65. APP LEAST PRIVILEGE

Apps recebem mínimo necessário.

---

## 66. APP DATA ACCESS

PII exige scope específico.

---

## 67. MALICIOUS APP

Plataforma deve poder:

- suspend;
- revoke;
- disable globally;
- notify affected stores.

---

# PARTE XIV — WEBHOOK SECURITY

## 68. WEBHOOK SIGNATURE

Validar assinatura.

---

## 69. TIMESTAMP

Evitar replay.

---

## 70. EVENT ID

Deduplicar.

---

## 71. PAYLOAD LIMIT

Limitar tamanho.

---

## 72. RETRY SAFETY

Processamento idempotente.

---

# PARTE XV — API SECURITY

## 73. TOKEN

Tokens devem ser:

- scoped;
- revogáveis;
- rotacionáveis.

---

## 74. RATE LIMIT

Por:

- IP;
- token;
- tenant;
- endpoint;
- risk level.

---

## 75. ABUSE DETECTION

Detectar padrão anormal.

---

## 76. ENUMERATION

Evitar revelar existência de recursos indevidamente.

---

# PARTE XVI — CHECKOUT SECURITY

## 77. SERVER AUTHORITY

Browser nunca define:

- total;
- desconto;
- frete;
- preço;
- estoque.

---

## 78. TAMPERING

Recalcular no servidor.

---

## 79. DOUBLE SUBMIT

Proteção idempotente.

---

## 80. PAYMENT REDIRECT

Validar callback.

---

## 81. PAYMENT STATUS

Não confiar no redirect do browser como verdade.

---

## 82. WEBHOOK TRUTH

Webhook precisa ser autenticado e reconciliável.

---

# PARTE XVII — PAYMENT SECURITY

## 83. PCI BOUNDARY

Evitar armazenar cartão.

---

## 84. TOKENIZATION

Preferir token/provider-hosted fields.

---

## 85. SECRETS

Provider credentials protegidas.

---

## 86. REFUND AUTH

Reembolso exige permissão forte.

---

## 87. HIGH-VALUE ACTION

Pode exigir reauth/MFA.

---

# PARTE XVIII — CUSTOMER DATA

## 88. DATA MINIMIZATION

Coletar apenas o necessário.

---

## 89. PII CLASSIFICATION

Classificar:

- nome;
- e-mail;
- telefone;
- documento;
- endereço;
- IP.

---

## 90. DISPLAY MASKING

Mascarar quando apropriado.

---

## 91. EXPORT CONTROL

Export de PII deve ser auditado.

---

# PARTE XIX — PRIVACIDADE

## 92. PURPOSE

Dados devem ter finalidade.

---

## 93. CONSENT

Consentimento precisa ser registrável.

---

## 94. RETENTION

Definir por tipo de dado.

---

## 95. DELETION

Processo precisa considerar obrigações históricas.

---

## 96. ANONYMIZATION

Pode preservar histórico sem manter PII.

---

# PARTE XX — SECRETS MANAGEMENT

## 97. SECRET

Nunca armazenar secret em source control.

---

## 98. ENVIRONMENT SECRET

Separar por ambiente.

---

## 99. ROTATION

Rotação deve ser suportada.

---

## 100. SECRET ACCESS

Acesso restrito.

---

## 101. SECRET LOGGING

Nunca logar.

---

# PARTE XXI — DEPENDENCY SECURITY

## 102. DEPENDENCY INVENTORY

Manter dependências visíveis.

---

## 103. VULNERABILITY SCANNING

Executar regularmente.

---

## 104. UPDATE POLICY

Corrigir vulnerabilidades críticas rapidamente.

---

## 105. SUPPLY CHAIN

Evitar packages sem reputação/necessidade.

---

## 106. LOCKFILE

Versionar lockfile.

---

# PARTE XXII — CI/CD SECURITY

## 107. PIPELINE

Pipeline deve proteger:

- credentials;
- artifacts;
- deploy permissions.

---

## 108. PRODUCTION DEPLOY

Restrito.

---

## 109. BRANCH PROTECTION

Aplicar em branches críticas.

---

## 110. CODE REVIEW

Mudanças sensíveis exigem review.

---

## 111. SECURITY CHECKS

CI pode incluir:

- SAST;
- dependency scan;
- secret scan;
- tests.

---

# PARTE XXIII — ENVIRONMENT SEPARATION

## 112. DEV / STAGING / PROD

Ambientes separados.

---

## 113. DATA

Evitar dados reais em desenvolvimento.

---

## 114. CREDENTIALS

Nunca reutilizar secret de produção.

---

## 115. NETWORK

Separar acesso conforme necessidade.

---

# PARTE XXIV — RELIABILITY PRINCIPLES

## 116. RELIABILITY

Confiabilidade significa:

- comportamento correto;
- disponibilidade;
- recuperação;
- consistência;
- previsibilidade.

---

## 117. FAILURE IS EXPECTED

Desenhar assumindo falha.

---

## 118. PARTIAL FAILURE

Um módulo pode falhar sem derrubar o resto.

---

## 119. SAFE FAILURE

Falhar fechado em segurança.

---

## 120. NO SILENT CORRUPTION

Nunca continuar silenciosamente com dado inconsistente.

---

# PARTE XXV — TIMEOUTS

## 121. TIMEOUT

Toda chamada externa precisa de limite.

---

## 122. DEPENDENCY TIMEOUT

Diferentes dependências podem ter timeouts diferentes.

---

## 123. USER FEEDBACK

Se exceder, mostrar estado compreensível.

---

# PARTE XXVI — RETRIES

## 124. RETRY

Somente erros retryable.

---

## 125. BACKOFF

Exponential backoff.

---

## 126. JITTER

Evitar sincronização de retries.

---

## 127. MAX ATTEMPTS

Nunca retry infinito.

---

# PARTE XXVII — CIRCUIT BREAKERS

## 128. CIRCUIT BREAKER

Usar quando dependência instável puder causar cascata.

---

## 129. OPEN STATE

Parar chamadas temporariamente.

---

## 130. HALF-OPEN

Testar recuperação.

---

# PARTE XXVIII — BULKHEADS

## 131. ISOLATION

Isolar recursos para que:

- integração A;
- tenant A;
- job A

não esgote tudo.

---

## 132. QUEUE PARTITION

Pode ser usada futuramente.

---

# PARTE XXIX — JOB RELIABILITY

## 133. DURABLE JOB

Jobs importantes precisam estado persistido.

---

## 134. IDEMPOTENT JOB

Retry não duplica efeito.

---

## 135. HEARTBEAT

Jobs longos podem emitir heartbeat.

---

## 136. STUCK JOB

Detectar jobs travados.

---

## 137. DEAD LETTER

Falhas persistentes vão para análise.

---

# PARTE XXX — EVENT RELIABILITY

## 138. EVENT DELIVERY

Eventos críticos não devem ser perdidos.

---

## 139. TRANSACTIONAL OUTBOX

Considerar quando evento depende de commit.

---

## 140. CONSUMER IDEMPOTENCY

Consumidor tolera duplicidade.

---

# PARTE XXXI — DATABASE RELIABILITY

## 141. TRANSACTIONS

Usar onde necessário.

---

## 142. CONSTRAINTS

Banco protege invariantes simples.

---

## 143. BACKUPS

Obrigatórios.

---

## 144. RESTORE TEST

Obrigatório.

---

## 145. MIGRATION SAFETY

Migration testada antes de produção.

---

## 146. LOCKING

Evitar locks longos.

---

# PARTE XXXII — OBSERVABILITY

## 147. LOGS

Estruturados.

---

## 148. METRICS

Cobrir:

- latency;
- error rate;
- throughput;
- saturation.

---

## 149. TRACES

Úteis para requests distribuídos.

---

## 150. CORRELATION ID

Preservar através de módulos.

---

## 151. TENANT CONTEXT

Incluir tenant quando apropriado.

---

## 152. PII REDACTION

Obrigatória.

---

# PARTE XXXIII — SLO / SLI

## 153. SLI

Indicadores podem incluir:

- request success rate;
- latency;
- checkout success;
- payment processing latency;
- webhook processing;
- storefront availability.

---

## 154. SLO

Definir objetivos realistas por serviço.

---

## 155. ERROR BUDGET

Pode orientar velocidade de releases.

---

# PARTE XXXIV — ALERTING

## 156. ALERT QUALITY

Alertar apenas eventos acionáveis.

---

## 157. SEVERITY

Pode classificar:

- SEV1;
- SEV2;
- SEV3.

---

## 158. NOISE

Evitar alert fatigue.

---

## 159. TENANT-SPECIFIC ALERT

Alguns incidentes afetam uma única loja.

---

# PARTE XXXV — STORE HEALTH

## 160. HEALTH DIMENSIONS

Por loja:

- storefront;
- checkout;
- payment;
- shipping;
- domain;
- integrations;
- jobs.

---

## 161. HEALTH STATUS

Conceitualmente:

- HEALTHY;
- DEGRADED;
- ERROR;
- UNKNOWN.

---

## 162. USER-FACING HEALTH

Lojista vê mensagem operacional.

---

## 163. PLATFORM HEALTH

Platform Ops vê detalhe técnico.

---

# PARTE XXXVI — INCIDENT RESPONSE

## 164. INCIDENT

Incidente precisa:

- detection;
- triage;
- owner;
- communication;
- mitigation;
- recovery;
- postmortem.

---

## 165. INCIDENT ID

Cada incidente relevante recebe ID.

---

## 166. TIMELINE

Registrar eventos importantes.

---

## 167. STATUS PAGE

Pode existir futuramente.

---

## 168. CUSTOMER COMMUNICATION

Comunicar apenas impacto confirmado.

---

# PARTE XXXVII — POSTMORTEM

## 169. BLAMELESS POSTMORTEM

Foco em sistema, não culpa.

---

## 170. CONTENT

Registrar:

- impacto;
- causa;
- timeline;
- detecção;
- mitigação;
- gaps;
- ações.

---

## 171. FOLLOW-UP

Ações precisam owner e prazo.

---

# PARTE XXXVIII — DISASTER RECOVERY

## 172. DR

Planejar para:

- database loss;
- region failure;
- provider outage;
- credential compromise;
- data corruption.

---

## 173. RPO

Definir perda aceitável de dados.

---

## 174. RTO

Definir tempo de recuperação.

---

## 175. BACKUP LOCATION

Backup não deve depender do mesmo failure domain.

---

## 176. RESTORE RUNBOOK

Documentado.

---

# PARTE XXXIX — BUSINESS CONTINUITY

## 177. CRITICAL PATH

Identificar:

- storefront;
- cart;
- checkout;
- payment;
- order creation;
- inventory.

---

## 178. DEGRADATION MODE

Exemplos:

- analytics indisponível → loja continua;
- recommendations indisponíveis → fallback;
- chat indisponível → loja continua;
- payment provider indisponível → informar/usar outro se disponível.

---

## 179. NEVER FAKE SUCCESS

Se pagamento falhar, nunca mostrar pedido pago.

---

# PARTE XL — FEATURE FLAGS E KILL SWITCHES

## 180. KILL SWITCH

Recurso problemático deve poder ser desativado rapidamente.

---

## 181. PROVIDER KILL SWITCH

Pode desabilitar integração específica.

---

## 182. STORE-SCOPED FLAG

Pode isolar impacto.

---

# PARTE XLI — DEPLOY SAFETY

## 183. SAFE DEPLOY

Preferir:

- staged rollout;
- canary quando útil;
- rollback;
- health verification.

---

## 184. MIGRATION BEFORE DEPLOY

Planejar compatibilidade.

---

## 185. NO BIG BANG

Evitar mudança estrutural massiva sem fallback.

---

# PARTE XLII — ROLLBACK

## 186. APPLICATION ROLLBACK

Deve ser possível quando mudança é compatível.

---

## 187. DATA ROLLBACK

Mais difícil.

Preferir forward fix para migrations destrutivas.

---

# PARTE XLIII — ABUSE E FRAUDE

## 188. ABUSE

Considerar:

- spam;
- bots;
- card testing;
- coupon abuse;
- credential stuffing;
- fake accounts;
- scraping agressivo.

---

## 189. RATE LIMIT

Ajustado por risco.

---

## 190. CAPTCHA

Pode ser usado de forma seletiva.

---

## 191. BOT DETECTION

Preferir sinais antes de bloquear usuários legítimos.

---

## 192. CARD TESTING

Checkout pode exigir proteção específica.

---

# PARTE XLIV — DOMAIN SECURITY

## 193. DOMAIN VERIFICATION

Verificar ownership/configuração.

---

## 194. SUBDOMAIN TAKEOVER

Evitar apontamento órfão.

---

## 195. HTTPS

Obrigatório.

---

## 196. CERTIFICATE FAILURE

Monitorar.

---

# PARTE XLV — EMAIL SECURITY

## 197. SENDER AUTH

Usar:

- SPF;
- DKIM;
- DMARC.

---

## 198. PHISHING RESISTANCE

E-mails de segurança devem ser claros.

---

## 199. LINK SAFETY

Links críticos com token curto/expirável.

---

# PARTE XLVI — LOG SECURITY

## 200. LOG ACCESS

Restrito.

---

## 201. LOG INJECTION

Sanitizar entrada.

---

## 202. SECRET REDACTION

Automática quando possível.

---

## 203. RETENTION

Limitada.

---

# PARTE XLVII — AUDIT TRAIL

## 204. CRITICAL AUDIT

Registrar:

- role change;
- refund;
- domain change;
- secret rotation;
- user invite/remove;
- store suspension;
- theme publish;
- payment config change.

---

## 205. IMMUTABILITY

Audit não editável por usuário comum.

---

# PARTE XLVIII — DATA BREACH RESPONSE

## 206. BREACH PLAN

Definir:

- containment;
- investigation;
- scope;
- remediation;
- communication;
- legal process aplicável.

---

## 207. CREDENTIAL COMPROMISE

Revogar e rotacionar.

---

# PARTE XLIX — SECURITY TESTING

## 208. UNIT / INTEGRATION

Testar authorization.

---

## 209. TENANT ISOLATION

Testes específicos.

---

## 210. SAST

Análise estática.

---

## 211. DAST

Pode ser adicionada.

---

## 212. DEPENDENCY SCAN

Contínua.

---

## 213. SECRET SCAN

No repo/CI.

---

## 214. PEN TEST

Periódico conforme maturidade.

---

# PARTE L — CHAOS / RESILIENCE TESTING

## 215. FAILURE INJECTION

Testar:

- provider timeout;
- webhook duplicate;
- queue delay;
- DB transient error;
- storage failure.

---

## 216. EXPECTED BEHAVIOR

Sistema deve:

- fail safe;
- preserve data;
- recover.

---

# PARTE LI — SECURITY UX

## 217. USER-FACING SECURITY

Segurança deve ser compreensível.

---

## 218. SECURITY COPY

Evitar mensagens vagas.

---

## 219. REAUTH

Explicar por que ação exige nova autenticação.

---

# PARTE LII — WBUY: APRENDIZADOS

## 220. ACCESS CODES

A pesquisa WBuy mostrou código temporário por e-mail.

### Decisão NextLevel

Autenticação moderna e recuperável deve ser capacidade nativa.

---

## 221. NEW IP ALERT

Foi observado alerta de novo IP/dispositivo.

### Decisão NextLevel

Security Center deve tratar eventos de acesso como produto.

---

## 222. 2FA

WBuy recomenda 2FA.

### Decisão NextLevel

MFA será capacidade arquitetural desde o desenho.

---

## 223. OPERATIONAL MODULARITY

Widgets independentes observados reforçam isolamento de falha.

### Decisão NextLevel

Falha localizada não deve derrubar todo o painel.

---

# PARTE LIII — TESTES CRÍTICOS

## 224. MUST TEST

Cobrir no mínimo:

- tenant isolation;
- IDOR;
- role permission;
- session revocation;
- password reset;
- MFA;
- CSRF;
- XSS;
- webhook signature;
- webhook duplicate;
- checkout tampering;
- payment replay;
- stock concurrency;
- export isolation;
- app scope;
- secret exposure;
- rollback;
- backup restore.

---

# PARTE LIV — ANTI-PATTERNS

## 225. EVITAR

- confiar no frontend;
- token em localStorage sem necessidade;
- secret em env client-side;
- role apenas na UI;
- query sem tenant;
- admin global sem audit;
- webhook sem assinatura;
- retry infinito;
- ausência de timeout;
- logs com PII/secrets;
- custom JS irrestrito;
- deploy sem rollback;
- backup não testado;
- alertas ruidosos;
- status “success” sem confirmação;
- shared production credentials;
- manual production changes sem registro.

---

# PARTE LV — O QUE NÃO PERTENCE AQUI

## 226. FORA DE SECURITY & RELIABILITY

Pertencem a outros documentos:

- visual do painel;
- composição do theme;
- regras de pricing;
- marketing;
- conteúdo;
- roadmap comercial;
- escolha final de vendors.

---

# PARTE LVI — OPEN QUESTIONS

## 227. QUESTÕES ABERTAS

Precisam de decisão conforme maturidade:

- identity provider;
- passkeys;
- MFA enforcement;
- WAF;
- bot provider;
- SIEM;
- secrets manager;
- SSO;
- JIT access;
- zero-trust network;
- status page;
- incident tooling;
- tracing stack;
- SLOs finais;
- RTO/RPO;
- multi-region;
- disaster recovery automation;
- pen test cadence;
- bug bounty;
- app security certification;
- theme sandbox technology.

---

# 228. REGRA FINAL

Segurança e confiabilidade não são módulos adicionados depois.

> **Nenhuma loja deve acessar outra.  
> Nenhuma ação crítica deve depender apenas do browser.  
> Nenhum evento repetido deve causar efeito financeiro duplicado.  
> Nenhuma falha externa deve corromper a verdade interna.  
> Nenhum incidente relevante deve ser invisível.  
> E toda recuperação importante deve ser testável.**
