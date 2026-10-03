# 03 — PLATFORM CORE

> **Status:** Documento especializado de engenharia  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Relacionados:** `01-WBUY-RESEARCH-INTELLIGENCE.md`, `02-COMMERCE-CORE.md`  
> **Escopo:** Capacidades estruturais da Plataforma SaaS de Lojas Virtuais NextLevel  
> **Não cobre:** regras detalhadas do Commerce Core, Theme Engine, UX visual do painel, storefront, ou regras específicas de SuperDrop/Master

---

## 1. OBJETIVO

Definir o núcleo estrutural que permite operar a Plataforma de Lojas Virtuais NextLevel como um SaaS multi-tenant confiável.

O Platform Core deve sustentar:

- lojas/tenants;
- usuários;
- autenticação;
- autorização;
- roles e permissões;
- capabilities;
- ciclo de vida da loja;
- configurações;
- segurança;
- auditoria;
- eventos;
- jobs;
- mídia;
- domínios;
- integrações;
- webhooks;
- importação/exportação;
- observabilidade;
- Platform Ops;
- feature flags;
- governança operacional.

O Platform Core não deve carregar regras específicas de um produto derivado.

---

# PARTE I — TENANT E LOJA

## 2. STORE / TENANT

A entidade de loja representa a unidade isolada de operação dentro da plataforma.

Ela deve possuir identidade estável e não depender de:

- domínio;
- slug atual;
- nome comercial;
- tema;
- plano;
- gateway;
- URL pública.

Esses elementos podem mudar ao longo do tempo.

O identificador interno da loja deve permanecer estável.

---

## 3. TENANT ISOLATION

Isolamento entre lojas é requisito constitucional.

Toda operação sensível deve considerar explicitamente:

- identidade do usuário;
- tenant atual;
- recurso acessado;
- ação solicitada;
- permissão;
- escopo.

Nunca assumir que um recurso pertence ao tenant apenas porque seu ID veio de uma tela daquele tenant.

---

## 4. CONTEXTO DE TENANT

O backend deve possuir uma forma explícita e confiável de determinar o tenant atual.

Esse contexto pode vir de:

- sessão;
- subdomínio;
- domínio customizado;
- rota;
- token;
- contexto interno de operação.

A origem do contexto precisa ser validada.

---

## 5. TROCA DE CONTEXTO

Usuários autorizados podem, em alguns cenários, acessar mais de uma loja.

A troca de contexto deve:

- ser explícita;
- ser auditável quando necessário;
- atualizar permissões;
- invalidar caches inadequados;
- evitar vazamento de dados;
- ser compreensível na UI.

---

## 6. STORE IDENTITY

A loja pode possuir dados como:

- nome interno;
- nome comercial;
- slug;
- status;
- locale;
- timezone;
- moeda;
- país;
- idioma padrão;
- configurações;
- datas de criação/publicação;
- owner principal;
- metadata operacional.

Nem todo dado precisa estar em uma única tabela.

---

# PARTE II — CICLO DE VIDA DA LOJA

## 7. STORE LIFECYCLE

A loja deve possuir um ciclo de vida explícito.

Estados conceituais podem incluir:

- CREATED;
- CONFIGURING;
- READY_FOR_TEST;
- READY_TO_SELL;
- PUBLISHED;
- PAUSED;
- RESTRICTED;
- SUSPENDED;
- CLOSED;
- ARCHIVED.

A máquina final de estados deve ser documentada e validada.

---

## 8. READY TO SELL

A plataforma deve conseguir responder de forma objetiva:

> Esta loja está apta a vender?

Essa resposta não deve depender de uma impressão visual.

Pode exigir verificações como:

- catálogo válido;
- forma de pagamento configurada;
- frete disponível;
- storefront publicável;
- domínio ou URL temporária válida;
- configurações mínimas;
- políticas obrigatórias;
- dados comerciais necessários.

Os requisitos exatos pertencem ao produto e podem variar por capability.

---

## 9. HEALTH CHECK DA LOJA

Além do lifecycle, a loja deve possuir indicadores de saúde.

Exemplos:

- payment_health;
- domain_health;
- shipping_health;
- storefront_health;
- integration_health;
- security_health.

Uma loja pode estar `PUBLISHED` e ainda possuir degradações operacionais.

---

## 10. PAUSA, RESTRIÇÃO E SUSPENSÃO

Esses estados não devem ser tratados como sinônimos.

### PAUSED
Ação voluntária/operacional.

### RESTRICTED
Parte das capacidades pode ser bloqueada.

### SUSPENDED
A loja não pode operar comercialmente.

### CLOSED
Operação encerrada.

A semântica final deve ser explícita.

---

## 11. RETENÇÃO APÓS ENCERRAMENTO

Encerrar uma loja não significa necessariamente apagar imediatamente:

- pedidos;
- auditoria;
- transações;
- documentos;
- histórico operacional;
- obrigações legais.

Políticas de retenção devem ser separadas do status operacional.

---

# PARTE III — IDENTIDADE E USUÁRIOS

## 12. USER

Usuário da plataforma representa identidade de acesso administrativo.

Não confundir automaticamente:

- usuário administrativo;
- cliente consumidor;
- contato comercial;
- owner da loja.

Esses conceitos podem se relacionar, mas não devem ser fundidos sem necessidade.

---

## 13. USER IDENTITY

Uma identidade pode possuir:

- id interno;
- nome;
- e-mail;
- telefone;
- status;
- credenciais;
- provedores de login;
- 2FA;
- sessões;
- dispositivos;
- datas de acesso;
- eventos de segurança.

---

## 14. MEMBERSHIP

Relacionamento entre usuário e loja deve ser explícito.

Exemplo conceitual:

`StoreMembership`

Pode conter:

- user_id;
- store_id;
- role;
- status;
- invited_by;
- accepted_at;
- permissions adicionais;
- datas de criação/remoção.

---

## 15. MULTI-STORE USER

Um mesmo usuário pode participar de mais de uma loja.

Isso não deve exigir duplicação de identidade.

Permissões são avaliadas no contexto de cada membership.

---

# PARTE IV — AUTENTICAÇÃO

## 16. AUTHENTICATION

Autenticação deve responder:

> Quem é esta pessoa/processo?

Ela é diferente de autorização:

> O que esta identidade pode fazer neste contexto?

---

## 17. CREDENCIAIS

A plataforma pode suportar:

- senha;
- magic link;
- código temporário;
- login social;
- SSO futuro;
- passkeys futuras.

A escolha de mecanismos não deve alterar o modelo de autorização.

---

## 18. SENHAS

Senhas devem ser:

- armazenadas com hashing apropriado;
- nunca registradas em logs;
- nunca recuperáveis em texto puro;
- protegidas contra brute force;
- redefinidas por fluxo seguro.

---

## 19. CÓDIGOS TEMPORÁRIOS

Se utilizados:

- expiração curta;
- uso único;
- rate limit;
- tentativa limitada;
- invalidação após uso;
- auditoria quando necessário.

---

## 20. 2FA

A arquitetura deve permitir autenticação em dois fatores.

Possíveis métodos:

- TOTP;
- passkey;
- outro método seguro aprovado.

2FA pode ser:

- opcional;
- obrigatório por role;
- obrigatório para ações críticas;
- obrigatório em políticas futuras.

---

# PARTE V — SESSÕES E DISPOSITIVOS

## 21. SESSION

Sessões devem ser entidades/controláveis.

A plataforma deve poder:

- listar sessões ativas;
- revogar sessão;
- expirar;
- detectar última atividade;
- registrar metadata útil;
- invalidar após evento crítico.

---

## 22. DEVICE / ACCESS CONTEXT

Quando tecnicamente útil e legalmente apropriado, registrar:

- user agent;
- IP;
- localização aproximada derivada;
- data/hora;
- device label;
- primeira/última atividade.

Não transformar isso em coleta excessiva.

---

## 23. EVENTOS DE SEGURANÇA

Exemplos:

- login bem-sucedido;
- login falhou;
- novo dispositivo;
- novo IP;
- 2FA ativado/desativado;
- senha alterada;
- sessão revogada;
- permissão elevada;
- secret alterado.

Eventos críticos devem ser auditáveis.

---

# PARTE VI — AUTORIZAÇÃO

## 24. AUTHORIZATION

Autorização deve ser server-side.

Nenhuma ação é autorizada apenas porque:

- botão aparece;
- rota existe;
- campo está oculto;
- UI impede interação.

---

## 25. RBAC

A plataforma deve suportar roles.

Exemplos conceituais:

- OWNER;
- ADMIN;
- MANAGER;
- CATALOG_OPERATOR;
- ORDER_OPERATOR;
- SUPPORT;
- VIEWER.

Esses nomes são ilustrativos.

---

## 26. PERMISSION

Permissões devem representar ações semânticas.

Exemplos:

- product.read;
- product.write;
- order.read;
- order.update;
- refund.create;
- theme.publish;
- domain.manage;
- user.invite.

Evitar permissões baseadas apenas em página.

---

## 27. ROLE COMO CONJUNTO DE PERMISSÕES

Role deve agrupar permissões.

Permissão crítica pode também exigir:

- owner;
- 2FA;
- reautenticação;
- aprovação adicional;
- Platform Ops.

---

## 28. DENY BY DEFAULT

Nova ação sensível deve começar negada até ser explicitamente permitida.

Evitar comportamento de autorização implícita.

---

# PARTE VII — CAPABILITIES E ENTITLEMENTS

## 29. CAPABILITY

Capability representa uma capacidade funcional disponível para uma loja.

Exemplos:

- custom_domain;
- wholesale;
- advanced_theme;
- multiple_staff;
- advanced_analytics;
- abandoned_cart;
- custom_checkout_extension.

A lista real pertence ao produto.

---

## 30. CAPABILITY NÃO É ROLE

Role responde:

> este usuário pode fazer?

Capability responde:

> esta loja possui este recurso?

Não confundir.

---

## 31. PLAN → ENTITLEMENT

Planos comerciais podem conceder entitlements/capabilities.

A plataforma deve evitar espalhar:

`if plan === "premium"`

pelo código.

---

## 32. OVERRIDES

Pode existir override administrativo controlado.

Exemplos:

- liberar recurso temporariamente;
- bloquear capability;
- beta program;
- grandfathering.

Overrides precisam ser auditáveis.

---

# PARTE VIII — FEATURE FLAGS

## 33. FEATURE FLAG

Feature flag serve para controlar rollout de implementação.

Não é substituto de capability comercial.

Pode controlar:

- beta;
- rollout gradual;
- experimento;
- kill switch;
- migração.

---

## 34. ESCOPO DE FLAG

Uma flag pode ser:

- global;
- por ambiente;
- por loja;
- por usuário;
- por grupo.

Uso deve ser simples e rastreável.

---

## 35. FLAGS TEMPORÁRIAS

Flags de rollout devem ter plano de remoção.

Evitar acumular flags mortas indefinidamente.

---

# PARTE IX — CONFIGURAÇÕES

## 36. STORE SETTINGS

Configurações devem ser organizadas por domínio.

Exemplos:

- commerce;
- checkout;
- shipping;
- customer;
- notification;
- SEO;
- storefront;
- security.

Evitar uma tabela genérica de key-value sem governança para tudo.

---

## 37. PLATFORM SETTINGS

Configurações globais pertencem ao Platform Core.

Devem ser protegidas e auditadas.

---

## 38. SECRET SETTINGS

Secrets não devem ser tratados como settings comuns.

Exemplos:

- API keys;
- webhook secrets;
- private tokens.

Devem utilizar storage apropriado e nunca ser exibidos integralmente após gravação.

---

# PARTE X — PLATFORM OPS

## 39. DEFINIÇÃO

Platform Ops é a superfície interna necessária para a própria NextLevel operar o SaaS.

Não é o “Master” de produtos derivados.

---

## 40. CAPACIDADES DE PLATFORM OPS

Pode incluir:

- localizar loja;
- diagnosticar erro;
- revisar saúde;
- verificar integrações;
- consultar auditoria;
- suspender/reativar loja;
- auxiliar suporte;
- verificar domínio;
- revisar jobs;
- visualizar incidentes;
- executar ações administrativas controladas.

---

## 41. PLATFORM OPS NÃO DEVE BURLAR SEGURANÇA

Acesso interno privilegiado precisa de:

- role própria;
- autenticação forte;
- auditoria;
- menor privilégio;
- justificativa em ações críticas;
- controles adicionais quando aplicável.

---

## 42. IMPERSONATION

Se futuramente existir “entrar como lojista”:

- deve ser explicitamente indicado;
- deve possuir auditoria;
- não deve revelar secrets;
- pode exigir aprovação/reautenticação;
- deve permitir sair facilmente;
- deve registrar ator real e ator impersonado.

Nunca mascarar a identidade do operador.

---

# PARTE XI — AUDITORIA

## 43. AUDIT EVENT

Ações sensíveis devem registrar:

- ator;
- tenant;
- ação;
- entidade;
- entity_id;
- timestamp;
- origem;
- metadata;
- estado anterior/posterior quando necessário;
- correlation id.

---

## 44. AUDITORIA NÃO É LOG

Log serve diagnóstico técnico.

Audit trail serve explicabilidade e segurança.

Podem compartilhar infraestrutura, mas não são conceitualmente iguais.

---

## 45. IMUTABILIDADE

Eventos de auditoria relevantes não devem ser editáveis por usuários comuns.

Retenção deve obedecer política apropriada.

---

# PARTE XII — EVENTOS

## 46. DOMAIN / PLATFORM EVENTS

Eventos estruturados podem representar fatos como:

- StoreCreated;
- StorePublished;
- StoreSuspended;
- UserInvited;
- UserJoinedStore;
- DomainVerified;
- IntegrationConnected;
- IntegrationFailed;
- ThemePublished;
- ImportCompleted.

---

## 47. EVENT CONTRACT

Um evento deve possuir estrutura consistente:

- event_id;
- event_type;
- occurred_at;
- tenant_id;
- actor quando aplicável;
- entity;
- entity_id;
- metadata;
- correlation_id.

---

## 48. EVENTO INTERNO VS EXTERNO

Nem todo evento interno deve virar webhook público.

Contratos externos precisam de governança e versionamento.

---

# PARTE XIII — JOBS E PROCESSAMENTO ASSÍNCRONO

## 49. JOB

Tarefas longas ou reprocessáveis devem poder ser executadas fora do request principal.

Exemplos:

- importação;
- exportação;
- processamento de mídia;
- sincronização;
- envio em massa;
- geração de sitemap;
- atualização de feed;
- limpeza controlada;
- reindexação.

---

## 50. JOB STATUS

Estados conceituais:

- PENDING;
- RUNNING;
- COMPLETED;
- FAILED;
- CANCELED;
- PARTIALLY_COMPLETED.

---

## 51. RETRY

Retries devem ser:

- limitados;
- observáveis;
- idempotentes;
- com backoff quando apropriado.

---

## 52. DEAD LETTER / MANUAL REVIEW

Falhas persistentes devem poder ser diagnosticadas sem loop infinito.

A implementação específica depende da infraestrutura.

---

# PARTE XIV — MEDIA ENGINE

## 53. MEDIA ASSET

Mídia é infraestrutura compartilhada.

Uma asset pode possuir:

- id;
- tenant;
- tipo;
- mime;
- tamanho;
- dimensões;
- metadata;
- hash;
- storage key;
- alt text;
- status;
- created_at.

---

## 54. STORAGE

O domínio não deve depender diretamente do provedor de storage.

Usar abstração adequada.

---

## 55. TRANSFORMAÇÕES

Pode suportar:

- resize;
- crop;
- thumbnail;
- formatos modernos;
- otimização;
- compressão;
- background removal futuro.

Transformações devem preservar original quando necessário.

---

## 56. REFERÊNCIAS

Remover uma asset não pode quebrar silenciosamente:

- produto;
- banner;
- página;
- tema.

Antes de excluir, verificar referências ou utilizar soft deletion quando adequado.

---

## 57. QUOTAS

Armazenamento pode estar sujeito a quota/capability/plano.

Essa política não deve contaminar consumers de mídia.

---

# PARTE XV — DOMÍNIOS E PUBLICAÇÃO

## 58. DOMÍNIO PADRÃO

Toda loja deve poder possuir URL funcional antes de domínio próprio.

Exemplo conceitual:

`slug.nextlevel.store`

O domínio real será decisão de produto/infra.

---

## 59. CUSTOM DOMAIN

Domínio customizado deve possuir lifecycle:

- requested;
- awaiting_dns;
- verifying;
- verified;
- ssl_provisioning;
- active;
- error;
- disconnected.

---

## 60. DNS VERIFICATION

A plataforma precisa informar claramente:

- registros necessários;
- status;
- último check;
- erro;
- próximo passo.

---

## 61. SSL

HTTPS é requisito.

Nunca publicar domínio customizado como “pronto” sem SSL válido.

---

## 62. CANONICAL DOMAIN

Cada storefront deve ter domínio canonical definido.

Evitar duplicidade SEO entre:

- domínio temporário;
- domínio customizado;
- aliases.

---

## 63. DOMAIN HEALTH

Platform Ops e lojista devem poder detectar:

- DNS incorreto;
- SSL expirado/falhou;
- domínio removido;
- redirect loop;
- canonical inconsistente.

---

# PARTE XVI — INTEGRAÇÕES

## 64. INTEGRATION

Integração deve ser entidade configurável.

Pode conter:

- provider;
- status;
- tenant;
- scopes;
- configuração;
- secrets referenciados;
- last_sync;
- health;
- error state.

---

## 65. PROVIDER ADAPTER

Provedores externos devem entrar por adapters/contracts.

Exemplos futuros:

- payment provider;
- shipping provider;
- ERP;
- analytics;
- marketing;
- marketplace;
- notification provider.

---

## 66. CONNECTION HEALTH

Integração deve possuir estado explícito:

- CONNECTED;
- DEGRADED;
- ERROR;
- EXPIRED;
- DISCONNECTED.

---

## 67. RATE LIMIT

Chamadas externas precisam respeitar limites de provider.

---

## 68. TIMEOUT

Integração lenta não deve travar indefinidamente request crítico.

---

## 69. CIRCUIT BREAKER / DEGRADAÇÃO

Quando útil, a plataforma deve conseguir degradar graciosamente.

A tecnologia específica pertence à engenharia de reliability.

---

# PARTE XVII — WEBHOOKS

## 70. INBOUND WEBHOOK

Webhook recebido deve:

- autenticar origem;
- validar payload;
- registrar recebimento;
- deduplicar;
- processar idempotentemente;
- registrar resultado;
- permitir retry.

---

## 71. OUTBOUND WEBHOOK

A plataforma pode futuramente expor eventos para apps/clientes.

Deve considerar:

- assinatura;
- retry;
- versionamento;
- logs;
- desativação por falha;
- replay.

---

## 72. WEBHOOK DELIVERY LOG

Deve ser possível diagnosticar:

- payload/event id;
- endpoint;
- tentativa;
- status;
- response;
- tempo;
- próximo retry.

---

# PARTE XVIII — IMPORTAÇÃO E EXPORTAÇÃO

## 73. IMPORT JOB

Importação deve ser job estruturado.

Não apenas upload de planilha + tentativa silenciosa.

---

## 74. FASES DA IMPORTAÇÃO

Idealmente:

1. upload;
2. parse;
3. validação;
4. preview;
5. confirmação;
6. processamento;
7. relatório;
8. correção/reprocessamento.

Nem todo import precisa exibir todas as fases na V1.

---

## 75. VALIDAÇÃO

Erros devem identificar:

- linha;
- campo;
- valor;
- motivo;
- severidade.

---

## 76. PROCESSAMENTO PARCIAL

A política deve ser explícita:

- all-or-nothing;
- partial success;
- batches.

Nunca deixar comportamento implícito.

---

## 77. EXPORT

Exportação deve poder ocorrer em background para volumes maiores.

Pode gerar:

- CSV;
- XLSX;
- JSON;
- outros formatos futuros.

---

## 78. PORTABILIDADE

Entidades devem ser modeladas de forma estável para permitir migração sem depender de layout de UI.

---

# PARTE XIX — CONFIGURAÇÃO E METADATA

## 79. METADATA

Metadata extensível pode ser útil.

Mas não deve virar local para esconder qualquer campo que deveria ser estruturado.

---

## 80. JSON SETTINGS

Campos JSON podem ser apropriados para configurações flexíveis.

Precisam de:

- schema;
- validação;
- versionamento;
- defaults;
- migração.

---

# PARTE XX — OBSERVABILIDADE

## 81. CORRELATION ID

Requests, jobs, events e integrações devem poder compartilhar correlation id quando fizer sentido.

---

## 82. STRUCTURED LOGGING

Logs devem ser estruturados e pesquisáveis.

Evitar mensagens soltas impossíveis de correlacionar.

---

## 83. TENANT CONTEXT NOS LOGS

Quando apropriado, logs devem incluir tenant id.

Nunca incluir dados sensíveis desnecessários.

---

## 84. METRICS

Métricas técnicas podem incluir:

- erro;
- latência;
- throughput;
- job failures;
- webhook failures;
- integration health.

---

## 85. STORE HEALTH

A plataforma deve poder construir saúde por loja sem misturar com analytics comercial.

---

# PARTE XXI — DATA LIFECYCLE

## 86. SOFT DELETE

Nem toda entidade deve ser hard deleted.

Definir por domínio.

Exemplos que podem exigir preservação:

- pedidos;
- pagamentos;
- audit events;
- stock moves;
- usuários removidos;
- histórico.

---

## 87. HARD DELETE

Quando legalmente ou operacionalmente necessário, hard delete precisa considerar dependências e retenção.

---

## 88. ANONYMIZATION

Em alguns casos, anonimização pode ser melhor que remoção de registros transacionais.

A política deve respeitar requisitos aplicáveis.

---

# PARTE XXII — BILLING DA PLATAFORMA

## 89. BILLING SAAS

Cobrança da própria plataforma é diferente do pagamento do consumidor no checkout.

Esses domínios não devem ser confundidos.

---

## 90. SUBSCRIPTION

A loja pode futuramente possuir:

- plano;
- assinatura;
- status;
- ciclo;
- faturas;
- trial;
- grace period;
- suspensão por cobrança.

A política comercial será detalhada em documento específico quando necessário.

---

## 91. BILLING NÃO DEVE CONTROLAR DIRETAMENTE FEATURES

Billing concede entitlements/capabilities.

O restante do sistema consulta capabilities.

---

# PARTE XXIII — SUPORTE E DIAGNÓSTICO

## 92. SUPPORT CONTEXT

Suporte precisa conseguir localizar contexto sem acessar dados além do necessário.

---

## 93. SUPPORT ACTION

Ações de suporte devem ser:

- autorizadas;
- auditáveis;
- limitadas;
- reversíveis quando possível.

---

## 94. INCIDENT CONTEXT

Quando uma loja reportar problema, Platform Ops deve conseguir responder:

- qual versão;
- qual tenant;
- qual domínio;
- quais integrações;
- quais erros recentes;
- jobs falhando;
- eventos relevantes.

---

# PARTE XXIV — GOVERNANÇA

## 95. CONFIG CHANGE AUDIT

Configurações críticas precisam registrar alteração.

---

## 96. SECRET ROTATION

Secrets devem poder ser rotacionados sem reescrever código.

---

## 97. ENVIRONMENT SEPARATION

Desenvolvimento, staging e produção precisam permanecer logicamente separados.

Nunca usar secret ou banco de produção em ambiente de desenvolvimento por conveniência.

---

## 98. PRODUCTION SAFETY

Ações destrutivas em produção precisam de controles adicionais.

---

# PARTE XXV — TESTES DO PLATFORM CORE

## 99. TENANT ISOLATION TESTS

Obrigatórios para fluxos críticos.

Cobrir:

- leitura;
- escrita;
- query por ID;
- export;
- integração;
- cache.

---

## 100. AUTH TESTS

Cobrir:

- login;
- sessão;
- expiração;
- revogação;
- 2FA quando implementado.

---

## 101. AUTHORIZATION TESTS

Cobrir:

- role;
- permission;
- membership;
- capability;
- deny-by-default.

---

## 102. DOMAIN TESTS

Cobrir:

- lifecycle;
- verificação;
- falha;
- canonical.

---

## 103. WEBHOOK TESTS

Cobrir:

- autenticação;
- duplicidade;
- retry;
- ordem;
- falha.

---

## 104. IMPORT TESTS

Cobrir:

- arquivo válido;
- inválido;
- parcial;
- duplicado;
- grande volume;
- replay.

---

# PARTE XXVI — LIÇÕES DA WBUY

## 105. SEGURANÇA DA CONTA

A pesquisa WBuy evidenciou:

- códigos temporários;
- alerta de novo IP;
- recomendação de 2FA.

Decisão:

> NextLevel deve tratar segurança da conta como produto, não somente como middleware.

---

## 106. EXPORTAÇÃO

A pesquisa WBuy evidenciou exportações de produtos e clientes.

Decisão:

> portabilidade deve ser capacidade nativa.

---

## 107. MÓDULOS INDEPENDENTES

O dashboard WBuy mostrou módulos com carregamento separado.

Decisão:

> Platform Core deve permitir isolamento de falhas e carregamento independente quando útil.

---

## 108. CONTRATOS

A WBuy mostrou respostas com formatos diferentes entre módulos.

Decisão:

> NextLevel padroniza contratos semânticos e evita HTML como contrato de domínio.

---

# PARTE XXVII — O QUE NÃO PERTENCE AQUI

## 109. FORA DO PLATFORM CORE

Não detalhar neste documento:

- cálculo de preço;
- stock reservation rules detalhadas;
- checkout;
- pedido;
- pagamento do consumidor;
- Theme Engine;
- Page Builder;
- layout do painel;
- storefront;
- SEO detalhado;
- conversão;
- analytics comercial;
- templates por segmento;
- SuperDrop;
- Master.

Eles possuem documentos próprios.

---

# PARTE XXVIII — QUESTÕES ABERTAS

## 110. OPEN QUESTIONS

Ainda precisam de decisão/ADR:

- modelo final de tenant;
- organização acima da loja, se necessária;
- sistema final de roles;
- permission model granular;
- SSO;
- passkeys;
- política final de 2FA;
- impersonation;
- billing SaaS;
- quota;
- storage provider;
- domain provider;
- job infrastructure;
- queue infrastructure;
- event delivery;
- webhook público;
- retention policy;
- anonymization policy;
- feature flag provider;
- secret manager;
- audit retention.

Nenhuma dessas decisões deve ser inventada antes da necessidade.

---

## 111. REGRA FINAL

O Platform Core deve permitir que a NextLevel opere milhares de lojas com segurança sem transformar cada loja em um sistema independente.

A plataforma precisa preservar:

- isolamento;
- identidade;
- autorização;
- governança;
- observabilidade;
- extensibilidade;
- portabilidade;
- operação interna;
- segurança.

> **O Commerce Core define como vender. O Platform Core define como a plataforma sustenta, protege e opera essas lojas em escala.**
