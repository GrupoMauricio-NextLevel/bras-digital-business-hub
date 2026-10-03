# AGENTS.md — ORQUESTRADOR DE ENGENHARIA NEXTLEVEL

> **Projeto:** Plataforma de Lojas Virtuais NextLevel  
> **Função deste arquivo:** orientar agentes de código sobre quais documentos ler, como decidir, como implementar e como reportar alterações  
> **Autoridade máxima:** `00-CONSTITUICAO-ECOMMERCE.md`  
> **Regra principal:** este arquivo NÃO substitui os documentos especializados; ele decide quais deles precisam ser consultados em cada tarefa.

---

# 1. MISSÃO

Você está trabalhando na **Plataforma de Lojas Virtuais NextLevel**.

Ela é o core próprio de e-commerce da NextLevel, na mesma categoria de produto de plataformas como Shopify, Nuvemshop e WBuy.

O objetivo não é criar apenas telas.

O objetivo é construir uma plataforma:

- multi-tenant;
- segura;
- extensível;
- visualmente flexível;
- operacionalmente confiável;
- preparada para múltiplos segmentos;
- capaz de sustentar produtos derivados no futuro;
- evolutiva sem exigir reescritas frequentes.

---

# 2. ESCOPO DO CORE

Pertencem ao core:

- criação e ciclo de vida de lojas;
- usuários, autenticação e autorização;
- catálogo;
- variantes e SKUs;
- preços;
- estoque;
- carrinho;
- checkout;
- pedidos;
- pagamentos;
- envio;
- clientes;
- storefront;
- painel do lojista;
- themes;
- templates;
- editor visual;
- domains;
- integrations;
- import/export;
- observabilidade;
- Platform Ops;
- analytics;
- intelligence.

Não pertencem ao core:

- SuperDrop;
- Master;
- Brás Digital;
- redes específicas de fornecedores;
- marketplaces derivados;
- operações específicas de um cliente.

Esses produtos podem usar o core.

A direção correta é:

`PRODUTO DERIVADO -> PLATAFORMA E-COMMERCE`

Nunca:

`PLATAFORMA E-COMMERCE -> PRODUTO DERIVADO`

---

# 3. PLATFORM OPS NÃO É MASTER

Platform Ops é a capacidade interna necessária para operar o SaaS.

Inclui, por exemplo:

- localizar loja;
- verificar saúde;
- diagnosticar integrações;
- consultar auditoria;
- inspecionar jobs;
- executar suporte controlado;
- suspender/reativar loja quando permitido.

Isso não cria dependência de um produto chamado Master.

---

# 4. HIERARQUIA DE AUTORIDADE

Quando houver conflito, siga esta ordem:

1. `00-CONSTITUICAO-ECOMMERCE.md`
2. decisões formalmente aprovadas e registradas
3. documento especializado responsável pelo domínio
4. `13-ROADMAP-GAPS-DECISIONS.md`
5. `01-WBUY-RESEARCH-INTELLIGENCE.md` como evidência/benchmark
6. implementação atual
7. conveniência da tarefa corrente

Nunca use a implementação existente para justificar violação da Constituição.

Nunca use benchmark externo para sobrepor decisão NextLevel aprovada.

---

# 5. DOCUMENTOS DISPONÍVEIS

## 5.1 Constituição

`00-CONSTITUICAO-ECOMMERCE.md`

Leia sempre quando:

- tarefa é estrutural;
- decisão é difícil de reverter;
- houver conflito entre documentos;
- alterar arquitetura;
- criar novo domínio;
- houver dúvida de fronteira de produto.

---

## 5.2 Pesquisa WBuy

`01-WBUY-RESEARCH-INTELLIGENCE.md`

Use para:

- benchmark;
- evidência observada;
- comportamento de referência;
- identificação de problemas e oportunidades.

Classificações obrigatórias:

- CONFIRMADO;
- INFERIDO;
- HIPÓTESE;
- DECISÃO NEXTLEVEL.

Nunca transforme hipótese em requisito.

Nunca copie limitação da WBuy por conveniência.

---

## 5.3 Commerce Core

`02-COMMERCE-CORE.md`

Leia para tarefas envolvendo:

- Product;
- Variant;
- SKU;
- catalog;
- pricing;
- discount;
- coupon;
- promotion;
- inventory;
- stock movements;
- reservations;
- cart;
- checkout;
- customer;
- order;
- payment;
- refund;
- shipping;
- fulfillment;
- domain events de comércio.

---

## 5.4 Platform Core

`03-PLATFORM-CORE.md`

Leia para:

- tenant/store;
- user;
- membership;
- auth;
- session;
- roles;
- permissions;
- capabilities;
- entitlements;
- feature flags;
- store lifecycle;
- settings;
- Platform Ops;
- audit;
- jobs;
- domains;
- media;
- integration lifecycle;
- SaaS billing foundation.

---

## 5.5 Visual Commerce

`04-VISUAL-COMMERCE.md`

Leia para:

- Theme Engine;
- Design Tokens;
- templates;
- sections;
- blocks;
- editor visual;
- draft;
- preview;
- publish;
- rollback;
- responsive behavior;
- visual contracts;
- theme quality;
- custom code boundaries.

---

## 5.6 Merchant Panel UX

`05-MERCHANT-PANEL-UX.md`

Leia para:

- painel do lojista;
- navigation;
- sidebar;
- dashboard;
- tables;
- filters;
- forms;
- product editor;
- order admin;
- inventory admin;
- customer admin;
- onboarding;
- notifications;
- mobile admin;
- admin design system.

---

## 5.7 Storefront UX & Conversion

`06-STOREFRONT-UX-CONVERSION.md`

Leia para:

- home;
- navigation;
- search;
- PLP;
- PDP;
- cart UX;
- checkout UX;
- customer account;
- post-purchase;
- trust;
- conversion;
- mobile storefront;
- accessibility;
- SEO;
- analytics funnel.

---

## 5.8 Themes, Templates & Segments

`07-THEMES-TEMPLATES-SEGMENTS.md`

Leia para:

- theme package;
- manifest;
- Theme Store;
- theme installation;
- upgrade;
- switching;
- presets;
- commercial themes;
- segment-specific experiences;
- fashion;
- football;
- wholesale;
- beauty;
- electronics;
- auto;
- food;
- kids.

---

## 5.9 Data Architecture

`08-DATA-ARCHITECTURE.md`

Leia para:

- schema;
- source of truth;
- IDs;
- multi-tenancy;
- normalization;
- snapshots;
- transactions;
- idempotency;
- concurrency;
- money;
- event data;
- outbox;
- jobs;
- migrations;
- constraints;
- retention;
- backup;
- performance;
- data contracts.

---

## 5.10 Integrations & Extensibility

`09-INTEGRATIONS-EXTENSIBILITY.md`

Leia para:

- provider adapters;
- APIs;
- OAuth;
- credentials;
- webhooks;
- apps;
- extension points;
- marketplace integrations;
- ERP;
- messaging;
- sync;
- rate limits;
- retries;
- integration health;
- app permissions.

---

## 5.11 Security & Reliability

`10-SECURITY-RELIABILITY.md`

Leia para:

- tenant security;
- sessions;
- MFA;
- authorization;
- Platform Ops security;
- XSS;
- CSRF;
- SSRF;
- upload security;
- secrets;
- theme/app security;
- API security;
- checkout security;
- privacy;
- reliability;
- timeouts;
- retries;
- circuit breakers;
- observability;
- incidents;
- disaster recovery.

---

## 5.12 Quality Engineering

`11-QUALITY-ENGINEERING.md`

Leia para:

- Definition of Done;
- unit tests;
- integration tests;
- contract tests;
- E2E;
- visual regression;
- accessibility;
- performance tests;
- security tests;
- CI;
- release gates;
- regression policy;
- QA;
- acceptance criteria.

---

## 5.13 Commerce Intelligence

`12-COMMERCE-INTELLIGENCE.md`

Leia para:

- metrics;
- KPIs;
- operational intelligence;
- health;
- alerts;
- Action Center;
- recommendations;
- funnel;
- product intelligence;
- inventory intelligence;
- order intelligence;
- payment intelligence;
- analytics;
- AI-assisted insights.

---

## 5.14 Roadmap, Gaps & Decisions

`13-ROADMAP-GAPS-DECISIONS.md`

Leia para:

- auditoria AS-IS vs TO-BE;
- classificação de gaps;
- prioridades;
- fases;
- sequencing;
- tech debt;
- rewrite policy;
- refactor policy;
- ADRs;
- open questions;
- decisões estruturais;
- estratégia incremental.

---

# 6. REGRA DE LEITURA

Não leia todos os documentos a cada pequena tarefa.

Leia:

1. Constituição quando necessário;
2. este `AGENTS.md`;
3. documento principal do domínio;
4. documentos adjacentes afetados;
5. `11-QUALITY-ENGINEERING.md` para critérios de conclusão;
6. `13-ROADMAP-GAPS-DECISIONS.md` quando houver mudança estrutural ou gap relevante.

---

# 7. MATRIZ TAREFA → DOCUMENTOS

## Produto / SKU / variante

Obrigatórios:

- `02`
- `08`
- `11`

Complementares:

- `05`
- `06`
- `07`

---

## Estoque

Obrigatórios:

- `02`
- `08`
- `10`
- `11`

Complementares:

- `05`
- `12`

---

## Carrinho / checkout

Obrigatórios:

- `02`
- `06`
- `08`
- `10`
- `11`

Complementares:

- `09`
- `12`

---

## Pedido

Obrigatórios:

- `02`
- `08`
- `10`
- `11`

Complementares:

- `05`
- `12`

---

## Pagamento

Obrigatórios:

- `02`
- `08`
- `09`
- `10`
- `11`

Complementares:

- `12`

---

## Frete / fulfillment

Obrigatórios:

- `02`
- `09`
- `11`

Complementares:

- `05`
- `06`
- `08`
- `12`

---

## Tenant / loja

Obrigatórios:

- `03`
- `08`
- `10`
- `11`

Complementar:

- `13`

---

## Auth / roles / permissions

Obrigatórios:

- `03`
- `10`
- `11`

Complementar:

- `08`

---

## Dashboard

Obrigatórios:

- `05`
- `12`
- `11`

Complementares:

- `01`
- `03`

---

## Painel do lojista

Obrigatórios:

- `05`
- `11`

Complementares conforme domínio:

- `02`
- `03`
- `12`

---

## Storefront

Obrigatórios:

- `04`
- `06`
- `11`

Complementares:

- `02`
- `07`
- `10`

---

## Theme Engine

Obrigatórios:

- `04`
- `07`
- `08`
- `11`

Complementares:

- `06`
- `10`

---

## Editor visual

Obrigatórios:

- `04`
- `05`
- `07`
- `11`

Complementares:

- `08`
- `10`

---

## Theme Store

Obrigatórios:

- `03`
- `04`
- `07`
- `09`
- `10`
- `11`

---

## Import / export

Obrigatórios:

- `03`
- `08`
- `09`
- `10`
- `11`

Complementar:

- `01`

---

## Integração externa

Obrigatórios:

- `09`
- `10`
- `11`

Complementares:

- `03`
- `08`
- documento de domínio afetado.

---

## API pública

Obrigatórios:

- `03`
- `08`
- `09`
- `10`
- `11`
- `13`

---

## Webhooks

Obrigatórios:

- `08`
- `09`
- `10`
- `11`

---

## Analytics / métricas

Obrigatórios:

- `08`
- `12`
- `11`

Complementares:

- `05`
- `06`

---

## Intelligence / alertas

Obrigatórios:

- `12`
- `08`
- `11`

Complementares:

- `05`
- `10`

---

## Segurança

Obrigatórios:

- `10`
- `11`

Complementares:

- `03`
- `08`
- `09`

---

## Migrations / banco

Obrigatórios:

- `08`
- `10`
- `11`
- `13`

---

## Refactor estrutural

Obrigatórios:

- `00`
- documento do domínio;
- `08`;
- `10`;
- `11`;
- `13`.

---

# 8. PROTOCOLO ANTES DE IMPLEMENTAR

Antes de modificar código:

1. identificar o domínio;
2. localizar documentos relevantes;
3. inspecionar a implementação existente;
4. identificar source of truth atual;
5. verificar testes existentes;
6. verificar migrations;
7. identificar consumers;
8. identificar impacto entre tenants;
9. verificar contratos públicos;
10. classificar o tipo de mudança.

---

# 9. CLASSIFICAÇÃO DA MUDANÇA

Classifique internamente como:

- UI_ONLY;
- DOMAIN;
- DATA;
- API;
- SECURITY;
- INTEGRATION;
- VISUAL_ENGINE;
- INFRA;
- MIGRATION;
- CROSS_CUTTING.

Quanto maior o alcance, maior a necessidade de planejamento.

---

# 10. ANTES DE GRANDES ALTERAÇÕES

Para alteração estrutural, produza primeiro:

### Estado atual
O que existe.

### Problema
Por que não atende.

### Estado alvo
Como deve ficar.

### Impacto
Quais módulos serão afetados.

### Migração
Como preservar dados/compatibilidade.

### Testes
Como comprovar correção.

### Rollback
Como recuperar se necessário.

---

# 11. NÃO REESCREVA O PROJETO

O repositório existente possui valor.

Não iniciar rewrite total por preferência arquitetural.

Priorizar:

- preservar;
- encapsular;
- migrar;
- substituir progressivamente.

Rewrite exige decisão explícita.

---

# 12. NÃO CRIE PLATAFORMA PARALELA

Não crie uma segunda implementação completa apenas para depois migrar.

Preferir evolução incremental da atual quando tecnicamente viável.

---

# 13. DOMAIN BEFORE UI

Antes de construir uma tela que altera estado:

- definir entidade;
- regra;
- autorização;
- validação;
- persistência;
- erro;
- evento/audit quando necessário.

A UI consome isso.

---

# 14. SERVER AUTHORITY

O frontend nunca é autoridade final para:

- preço;
- desconto;
- estoque;
- total;
- order state;
- payment state;
- permission;
- tenant ownership.

Sempre validar no servidor.

---

# 15. SINGLE SOURCE OF TRUTH

Não criar duas fontes independentes para o mesmo fato.

Read models, caches e dashboards podem ser derivados.

---

# 16. TENANT ISOLATION

Toda nova feature deve responder:

- este dado pertence a qual tenant?
- como a query é limitada?
- como a API valida?
- como o cache é isolado?
- como o job carrega tenant?
- como o export evita vazamento?

---

# 17. IDENTIDADE ESTÁVEL

Não usar como chave primária de negócio:

- slug;
- name;
- email;
- domain;
- provider id.

Usar IDs estáveis.

---

# 18. SNAPSHOTS

Preservar histórico quando dado atual não representa o passado.

Especialmente:

- order items;
- prices;
- customer address;
- shipping;
- payment references;
- published theme version.

---

# 19. MONEY

Nunca usar float ingênuo.

Centralizar:

- representation;
- rounding;
- currency.

---

# 20. IDEMPOTÊNCIA

Obrigatória para:

- checkout finalization;
- payment callbacks;
- webhooks;
- refunds;
- stock effects;
- retries críticos.

---

# 21. CONCORRÊNCIA

Assuma concorrência em:

- estoque;
- checkout;
- payments;
- refunds;
- job processing.

Não usar apenas read → validate → write sem proteção quando o dado é competitivo.

---

# 22. STATUS SEMÂNTICO

Domínio armazena semântica.

Design System decide:

- cor;
- badge;
- icon;
- tone.

Não persistir UI como significado de estado.

---

# 23. PROVIDER BOUNDARY

Nunca espalhar lógica específica de:

- Mercado Pago;
- SuperFrete;
- qualquer futuro provider

pelo core.

Use contracts + adapters.

---

# 24. FEATURE FLAG ≠ CAPABILITY

## Feature flag

Rollout, segurança, experimento.

## Capability / entitlement

Direito funcional da loja.

## Quota

Limite numérico.

## Config

Preferência/comportamento do lojista.

Não misturar.

---

# 25. THEME BOUNDARY

Theme pode controlar apresentação.

Theme não controla:

- preço verdadeiro;
- estoque verdadeiro;
- order state;
- payment state;
- autorização.

---

# 26. DRAFT ≠ PUBLISHED

Em superfícies publicáveis:

- salvar draft não publica;
- publish deve ser explícito;
- storefront consome published state;
- rollback deve ser possível quando aplicável.

---

# 27. MOBILE

Não considerar desktop concluído e “corrigir mobile depois”.

Mobile é primeira classe.

---

# 28. ACCESSIBILITY

Não degradar:

- keyboard;
- focus;
- contrast;
- semantic HTML;
- labels;
- error announcements.

---

# 29. PERFORMANCE

Evitar:

- N+1;
- client JS excessivo;
- imagens gigantes;
- blocking external request;
- query sem índice evidente;
- re-render desnecessário;
- bundle descontrolado.

Otimizar com medição, não por superstição.

---

# 30. OBSERVABILITY

Nova capacidade crítica deve permitir responder:

- deu erro?
- para qual tenant?
- em qual request/job?
- qual entidade?
- qual provider?
- qual correlation id?
- o sistema recuperou?

---

# 31. SECURITY

Nunca:

- expor secret;
- logar token;
- confiar em client-side role;
- aceitar webhook sem validação;
- interpolar HTML não sanitizado;
- buscar URL externa sem proteção SSRF;
- usar credencial de produção em dev.

---

# 32. PLATFORM OPS

Qualquer ação privilegiada interna precisa considerar:

- role;
- audit;
- justification quando crítica;
- actor real;
- tenant afetado.

---

# 33. OPEN QUESTIONS

Se documento marcar como open question:

não congele uma resposta silenciosamente.

Quando bloquear implementação:

1. formular problema;
2. apresentar alternativas;
3. impactos;
4. recomendação;
5. indicar reversibilidade;
6. pedir decisão se estrutural.

---

# 34. AUTONOMIA PERMITIDA

Você pode decidir sozinho:

- nome interno local;
- pequena organização de função;
- refactor de baixo risco;
- detalhes reversíveis;
- testes adicionais;
- melhorias de legibilidade.

Desde que não alterem contrato ou arquitetura.

---

# 35. PEÇA DECISÃO ANTES DE

- mudar tenant model;
- alterar modelo de order/payment;
- remover funcionalidade;
- criar API pública;
- mudar provider architecture;
- fazer migration destrutiva;
- fazer rewrite;
- criar lock-in;
- alterar regra comercial central;
- reduzir segurança;
- alterar escopo do produto.

---

# 36. VERTICAL SLICES

Preferir capacidade ponta a ponta.

Exemplo `Criar produto`:

- schema;
- domain;
- service;
- authorization;
- API;
- UI;
- validation;
- audit;
- tests.

Evitar 20 telas incompletas.

---

# 37. LOTES PEQUENOS

Para cada lote:

1. objetivo;
2. arquivos afetados;
3. implementação;
4. tests;
5. lint;
6. typecheck;
7. build;
8. validação;
9. resumo.

---

# 38. BASELINE ANTES DE ALTERAR

Quando começar uma fase importante:

- instalar dependências;
- rodar lint;
- rodar typecheck;
- rodar tests;
- rodar build.

Registrar falhas preexistentes.

---

# 39. TESTES

Seguir `11-QUALITY-ENGINEERING.md`.

No mínimo, quando aplicável:

- unit;
- integration;
- tenant isolation;
- permission;
- concurrency;
- idempotency;
- E2E;
- visual;
- accessibility.

---

# 40. BUG FIX

Bug relevante corrigido deve ganhar teste de regressão.

---

# 41. MIGRATIONS

Nunca alterar banco de produção manualmente como substituto de migration.

Toda migration precisa:

- versionamento;
- estratégia de dados;
- compatibilidade;
- validação;
- recovery.

---

# 42. IMPORT / EXPORT

Não criar script único escondido quando capability deve ser produto.

Quando recorrente:

- job;
- validation;
- preview;
- errors;
- report;
- retry.

---

# 43. API

Não exponha formato de tabela diretamente.

Use DTO/contract semântico.

---

# 44. WEBHOOK

Todo webhook deve considerar:

- authentication;
- signature;
- idempotency;
- duplicates;
- out-of-order;
- retry;
- logging;
- correlation.

---

# 45. JOBS

Todo job importante deve considerar:

- tenant;
- retry;
- idempotency;
- status;
- error context;
- stuck job.

---

# 46. EVENTOS

Eventos representam fatos.

Não use event como nome genérico para qualquer callback.

Preserve:

- event_id;
- type;
- tenant;
- occurred_at;
- correlation.

---

# 47. AUDIT ≠ LOG

Audit:

- quem fez;
- o que fez;
- em qual entidade;
- quando.

Log:

- diagnóstico técnico.

Não confundir.

---

# 48. ANALYTICS ≠ OPERATION

Analytics:

- histórico;
- períodos;
- métricas.

Operation:

- estado atual;
- problemas;
- filas;
- alertas.

Filtro temporal não deve esconder condição operacional atual.

---

# 49. INTELLIGENCE

Siga:

`SIGNAL -> CONTEXT -> IMPACT -> ACTION`

Não gere recomendações sem evidência.

---

# 50. IA

IA pode:

- auxiliar;
- resumir;
- sugerir;
- explicar.

IA não deve:

- inventar fato;
- ser fonte de verdade;
- executar ação crítica sem autorização;
- virar dependência de runtime para renderizar a loja.

---

# 51. WBUY

Quando usar WBuy como benchmark:

pergunte:

1. o que foi observado?
2. isso está confirmado?
3. qual problema a WBuy tenta resolver?
4. quais limitações aparecem?
5. qual decisão NextLevel deriva disso?

Não copie automaticamente.

---

# 52. CÓDIGO EXISTENTE

Antes de substituir:

- entender;
- localizar consumers;
- verificar tests;
- verificar produção;
- identificar se comportamento é necessário.

---

# 53. TECH DEBT

Se criar dívida para avançar:

registre.

Inclua:

- o que;
- por que;
- risco;
- condição para remoção.

---

# 54. TODOs

TODO crítico não deve existir sem issue/gap/registro equivalente.

---

# 55. MOCKS

Mocks são permitidos em:

- tests;
- protótipos claramente identificados;
- sandbox.

Não apresentar mock como feature pronta.

---

# 56. SEEDS

Seeds devem ser:

- reproduzíveis;
- seguros;
- distintos de dados de produção.

---

# 57. STOREFRONT

Toda alteração deve considerar:

- desktop;
- mobile;
- loading;
- empty;
- error;
- performance;
- accessibility;
- conversion contract.

---

# 58. PAINEL

Toda alteração deve considerar:

- context;
- primary action;
- filters;
- permissions;
- loading;
- error;
- empty;
- feedback;
- mobile.

---

# 59. THEMES

Toda alteração deve considerar:

- compatibility;
- version;
- schema;
- draft;
- publish;
- rollback;
- mobile;
- accessibility;
- performance.

---

# 60. SEGMENTOS

Não criar forks do core para:

- Moda;
- Futebol;
- Atacado;
- Cosméticos;
- etc.

Use:

- theme;
- preset;
- capability;
- purchase experience;
- config.

---

# 61. CHECKOUT

Checkout é área crítica.

Não permitir theme/app alterar livremente:

- total;
- payment logic;
- validation;
- order creation;
- security.

---

# 62. PAYMENT

Browser redirect não confirma pagamento.

Provider webhook + reconciliation definem estado conforme contrato.

---

# 63. INVENTORY

Movimentos precisam ser explicáveis.

Nunca ajustar estoque silenciosamente sem motivo/origem.

---

# 64. ORDER

Pedido preserva história.

Não depender do produto atual para reconstruir o que foi comprado.

---

# 65. CUSTOMER

Customer e administrative user não são a mesma entidade por padrão.

---

# 66. STORE LIFECYCLE

Não use apenas booleanos desconectados como:

- active;
- published;
- suspended;
- blocked;

sem semântica clara.

---

# 67. DOMAIN HEALTH

Domínio customizado precisa lifecycle e health.

Não considerar pronto antes de DNS + SSL válidos.

---

# 68. INTEGRATION HEALTH

Integração deve poder ser:

- connected;
- degraded;
- error;
- expired;
- disconnected.

---

# 69. RETRIES

Não fazer retry infinito.

Classifique erro como retryable ou non-retryable.

---

# 70. TIMEOUT

Toda chamada externa precisa timeout.

---

# 71. FALLBACK

Fallback nunca pode inventar dado.

Exemplo:

frete falhou → informar indisponibilidade.

Nunca fabricar valor.

---

# 72. PARTIAL FAILURE

Quando possível, preservar o restante da experiência.

Um widget não deve derrubar o dashboard.

Uma recomendação não deve derrubar checkout.

---

# 73. RELEASE BLOCKERS

Não considerar release pronta com:

- tenant leak;
- auth bypass;
- payment duplication;
- stock corruption;
- order corruption;
- destructive migration risk;
- checkout bloqueado;
- critical security issue.

---

# 74. REPORT DE ALTERAÇÃO

Ao concluir lote relevante, reporte:

## Objetivo
O que foi resolvido.

## Arquivos alterados
Lista objetiva.

## Comportamento entregue
O que agora funciona.

## Testes executados
Com resultado.

## Migrations
Se houver.

## Riscos
Se houver.

## Gaps restantes
Somente relevantes.

## Decisões necessárias
Somente se bloquearem próxima etapa.

---

# 75. NÃO GERE RELATÓRIOS GIGANTES SEM NECESSIDADE

Se tarefa for pequena, reporte pequeno.

Se tarefa for arquitetural, reporte completo.

---

# 76. AUDITORIA INICIAL DO REPOSITÓRIO

Se esta for a primeira vez que estes documentos são aplicados ao repositório, execute antes de grandes mudanças:

1. mapear apps/packages;
2. mapear database/schema;
3. mapear migrations;
4. mapear auth;
5. mapear tenant;
6. mapear commerce domains;
7. mapear routes/APIs;
8. mapear UI;
9. mapear storefront;
10. mapear themes;
11. mapear integrations;
12. mapear tests;
13. mapear deploy;
14. identificar mocks;
15. identificar features incompletas;
16. comparar com documentação.

---

# 77. SAÍDA DA AUDITORIA

Produzir:

## AS-IS
Arquitetura atual.

## ALINHADO
O que já está correto.

## PARCIAL
O que pode ser preservado e evoluído.

## AUSENTE
Gaps.

## CONFLITANTE
Violações constitucionais.

## P0 / P1
Riscos prioritários.

## PLANO INCREMENTAL
Sequência recomendada.

Não reescrever ainda.

---

# 78. ORDEM GERAL DE EVOLUÇÃO

Referência do `13`:

1. estabilizar repo;
2. tenant/auth/platform foundation;
3. commerce domain;
4. cart/checkout;
5. order/payment/fulfillment;
6. storefront base;
7. merchant panel;
8. visual commerce foundation;
9. visual editor;
10. themes/segments;
11. import/export;
12. integrations platform;
13. observability/Platform Ops;
14. commerce intelligence;
15. ecosystem.

Essa ordem pode ser ajustada conforme estado real.

---

# 79. PRIMEIRO LOOP COMPLETO

Priorize validar:

1. criar loja;
2. criar produto;
3. publicar produto;
4. acessar storefront;
5. adicionar ao carrinho;
6. checkout;
7. pagamento de teste;
8. pedido;
9. estoque;
10. operação do pedido.

Esse loop prova a arquitetura ponta a ponta.

---

# 80. NÃO OTIMIZE PREMATURAMENTE

Antes de adicionar:

- microservices;
- event bus complexo;
- data warehouse;
- multi-region;
- sharding;

prove necessidade.

---

# 81. SIMPLICIDADE

Preferir a solução mais simples que preserve:

- invariantes;
- segurança;
- extensibilidade necessária;
- observabilidade;
- possibilidade de evolução.

---

# 82. ARQUITETURA NÃO É TECNOLOGIA

Não escolher tecnologia apenas porque parece moderna.

Primeiro requisito.

Depois restrições.

Depois alternativas.

Depois decisão.

---

# 83. DECISION REGISTER

Decisão estrutural deve ser registrada.

Formato sugerido:

`ADR-XXX — Título`

Com:

- Contexto;
- Alternativas;
- Decisão;
- Consequências;
- Reversibilidade.

---

# 84. DOCUMENTAÇÃO

Quando implementação alterar decisão aprovada:

atualize documentação correspondente.

Não deixe código e docs divergirem silenciosamente.

---

# 85. NOVOS DOCUMENTOS

Não criar novo documento de arquitetura se assunto já possui owner.

Atualize o documento correto.

---

# 86. TERMOS

Use consistentemente:

- Store / Loja;
- Tenant;
- User;
- Customer;
- Product;
- Variant;
- SKU;
- Order;
- Payment;
- Shipment;
- Theme;
- Template;
- Section;
- Block;
- Capability;
- Feature Flag;
- Audit Event;
- Domain Event.

Não inventar sinônimos desnecessários.

---

# 87. QUALIDADE DE CÓDIGO

Prefira:

- funções pequenas;
- interfaces claras;
- nomes semânticos;
- módulos com owner;
- dependências explícitas;
- testes próximos do comportamento.

Evite:

- god objects;
- util genérico para tudo;
- lógica em controller;
- lógica duplicada;
- side effects escondidos.

---

# 88. CROSS-MODULE WRITES

Um módulo não deve escrever diretamente na persistência interna de outro domínio sem contrato.

---

# 89. DATABASE ACCESS

Não espalhar queries arbitrárias em componentes/UI.

Use camada apropriada.

---

# 90. UI CONTRACTS

UI deve receber DTO/view model adequado.

Não acoplar interface à tabela diretamente.

---

# 91. ERROR CONTRACTS

Erros importantes devem ser semânticos.

Exemplos:

- OUT_OF_STOCK;
- PAYMENT_DECLINED;
- INVALID_TRANSITION;
- PERMISSION_DENIED.

Não depender apenas de texto humano.

---

# 92. USER-FACING ERRORS

Converter erro técnico em mensagem acionável.

---

# 93. LOGGING

Não logar:

- senha;
- token;
- cartão;
- secret;
- PII desnecessária.

---

# 94. CORRELATION

Preservar correlation id nos fluxos críticos.

---

# 95. BACKUPS

Mudanças de persistência crítica devem considerar recuperação.

---

# 96. DATA DELETION

Não hard-delete histórico transacional por conveniência.

---

# 97. GDPR/LGPD-LIKE PRINCIPLES

Mesmo sem definir implementação legal completa:

- minimização;
- finalidade;
- consent;
- retention;
- anonymization;
- export;
- deletion workflow

devem ser considerados.

---

# 98. DEPLOY

Não faça deploy de produção sem autorização explícita.

---

# 99. SECRETS

Não altere secrets de produção sem autorização.

---

# 100. OUTROS PROJETOS

Não modificar:

- Natural GO;
- SuperDrop;
- outros repositórios;
- outros ambientes;

a menos que a tarefa peça explicitamente.

---

# 101. GIT SAFETY

Antes de operações destrutivas:

- verificar branch;
- verificar working tree;
- preservar alterações do usuário;
- não force push sem autorização;
- não apagar commits.

---

# 102. COMMITS

Quando solicitado, commits devem:

- ser pequenos;
- ter mensagem clara;
- representar uma unidade lógica.

---

# 103. CODE GENERATED BY AI

Código gerado por IA segue exatamente os mesmos requisitos de:

- review;
- tests;
- security;
- quality.

---

# 104. QUANDO PARAR

Pare e peça decisão se:

- o requisito contradiz Constituição;
- há risco de perda de dados;
- mudança exige rewrite;
- migration destrutiva não tem plano;
- ação afetará produção;
- segredo necessário não está disponível;
- comportamento comercial central não está definido.

---

# 105. QUANDO AVANÇAR

Avance sem interromper por detalhes triviais quando:

- decisão é reversível;
- documentos já definem comportamento;
- risco é baixo;
- testes podem validar;
- escopo está claro.

---

# 106. FORMATO DE COMUNICAÇÃO

Seja direto.

Não explicar conceitos básicos desnecessariamente.

Para mudanças grandes:

- plano curto;
- execução;
- validação;
- resultado.

---

# 107. NÃO DECLARE SUCESSO SEM EVIDÊNCIA

Não diga:

- “pronto”;
- “100% funcional”;
- “resolvido”;

sem executar verificações aplicáveis.

---

# 108. DEFINITION OF COMPLETE

Uma capacidade importante está completa quando, conforme aplicável:

- código existe;
- persistência funciona;
- authorization funciona;
- tenant isolation funciona;
- estados estão tratados;
- error handling existe;
- tests passam;
- lint passa;
- typecheck passa;
- build passa;
- mobile funciona;
- accessibility não foi quebrada;
- observability existe.

---

# 109. PRINCÍPIOS INEGOCIÁVEIS

Nunca viole silenciosamente:

1. tenant isolation;
2. single source of truth;
3. domain before UI;
4. server authority;
5. semantic contracts;
6. historical integrity;
7. idempotency crítica;
8. provider isolation;
9. theme/business separation;
10. explicit draft/publish;
11. mobile;
12. accessibility;
13. security;
14. observability;
15. incremental evolution.

---

# 110. REGRA FINAL

O agente deve agir como engenheiro responsável por uma plataforma de longo prazo.

> **Leia apenas o contexto necessário, mas respeite toda a arquitetura.  
> Preserve o que funciona.  
> Não invente decisões estruturais.  
> Não esconda complexidade dentro da UI.  
> Não confunda benchmark com especificação.  
> Não confunda protótipo com produção.  
> E nunca troque velocidade momentânea por corrupção de dados, perda de segurança ou fragmentação do core.**
