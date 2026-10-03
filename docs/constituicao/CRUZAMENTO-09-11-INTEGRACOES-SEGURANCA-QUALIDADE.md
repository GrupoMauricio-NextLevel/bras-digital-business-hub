# Cruzamento dos documentos 09, 10 e 11 com o código (2026-10-03)

Legenda: ✔ cumpre · ◐ parcial · ✘ não cumpre · ? não verificado. Método: leitura do código e buscas dirigidas; nenhum teste novo foi rodado nesta etapa.

## Resumo
- **Falhas reais de segurança encontradas:** (1) **o login não tem limite de tentativas** (só a recuperação de senha tem), o que permite adivinhar senhas; (2) **nenhuma chamada externa tem tempo máximo** (Mercado Pago, frete): uma resposta lenta trava a requisição; (3) **sem cabeçalhos de segurança** (anti-clickjacking, nosniff, política de referência, CSP); (4) **webhook do Mercado Pago sem verificação de assinatura** (a conferência na API do provedor protege o dinheiro, mas o 09 §37 e o 10 §68 pedem assinatura quando o provedor oferece).
- **Pontos fortes confirmados:** texto rico da loja é escapado antes de virar HTML e os links só aceitam endereços seguros (`renderMarkdownLite`); cookie de sessão HttpOnly, SameSite e Secure em produção; segredos criptografados; pagamento só vale depois de conferido na API; rotinas isoladas e painel de erros; monitor a cada 15 min; Dependabot ligado; CI com tipos, estilo, testes e build.
- **Conflito entre o 11 e a regra de testes do dono:** ver a seção final.

## 09 Integrações e extensibilidade
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Contrato por categoria e adaptadores (§2–19) | ◐ | `src/lib/payments` (Mercado Pago) e `src/lib/shipping` (SuperFrete, Melhor Envio) isolam as chamadas e aceitam um `fetch` injetável (bom para teste). Não há interface comum de `PaymentProvider` e `ShippingProvider`; campos do Mercado Pago ficam na loja (`mp_access_token_enc`, `mp_public_key`, `payment_provider`). |
| Entidade de integração e saúde (§20–22, §93–95) | ✘ | Estado só por colunas (`payment_status`, `shipping_status`: NOT_CONFIGURED, DEMO, CONNECTED). Sem DEGRADED, EXPIRED, última sincronização, último erro. |
| Segredos (§23–27) | ✔/◐ | Criptografados em repouso, nunca exibidos. Rotação e revogação ao desconectar: não verificadas. |
| OAuth, escopos (§28–35) | ✘ | Conexão por colar o token manualmente. Sem OAuth; sem escopos (não há apps externos). |
| Webhook de entrada (§36–42, §70) | ◐ | Confere o pagamento direto na API do provedor, deduplica por `dedupeKey`, valida que o pedido é da loja (✔). **Sem verificação de assinatura nem de data (replay)**, sem limite de tamanho do corpo, sem registro de cada recebimento. |
| Webhook de saída, API pública, apps, extensões (§43–77) | ✘ | Não existem. O 09 §170 e o 10 os tratam como decisões futuras: **não construir agora**. |
| Sincronização, reconciliação (§78–92) | ◐ | `reconcilePendingPayments` compara pedidos pendentes com a API do Mercado Pago (✔). Sem direção, cursor nem política de conflito (não há ERP). |
| Repetição, tempo máximo, disjuntor (§96–106) | ✘ | **Sem timeout** em chamadas externas (`payments/mercadopago.ts`, `shipping/*`); sem classificação de erro repetível; sem backoff, sem disjuntor. A reconciliação periódica cobre a perda de webhook. |
| Erros normalizados, log de integração (§107–111) | ◐ | `MercadoPagoError` e `ShippingError` com mensagem em português; sem correlação nem log por operação. |
| Ambientes de teste (§112–116) | ✔/◐ | Token de teste do Mercado Pago é detectado (`isTest`); modo demonstração com Pix e cartão simulados rotulados. |
| Importadores e exportadores (§120–124) | ◐ | Importação de produtos (CSV e XLSX). Nada de WBuy nem exportação do lojista. |
| Pixels e eventos (§125–128) | ✘ | Sem pixels nem eventos de funil. |
| Notificações (§129–131) | ◐ | `email_outbox` com estado; sem SMS, WhatsApp ou push. |
| Testes de contrato e simulação (§162–167) | ◐ | Adaptadores testados com `fetch` falso. Sem teste de assinatura, de atraso, de ordem trocada, de limite de taxa, de expiração de token. |

## 10 Segurança e confiabilidade
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Isolamento entre lojas (§7–15) | ✔/◐ | `assertCanAccess` e testes de `tenancy`; webhook confere o dono do pedido. Falha baixa na distribuição de produto (corrigida hoje, F2). Cache, busca, jobs: não há cache nem busca. |
| Senhas, redefinição (§17) | ✔ | Hash scrypt, redefinição por fluxo seguro com limite (`reset:` e `reset-mail:`). |
| **Limite de tentativas no login (§18)** | ✘ | `loginAction` não chama `rateLimit`. Só a recuperação de senha tem. O limitador atual é em memória por instância (`rate-limit.ts`). |
| MFA, passkeys, código por e-mail (§19–21) | ✘ | Não existem. |
| Sessões (§22–27) | ◐ | Cookie assinado com `HttpOnly`, `SameSite=lax`, `Secure` em produção, validade; **sem registro no servidor**: sem lista, sem revogação, sem rotação após troca de senha. |
| Autorização, RBAC, ações de alto risco (§28–33) | ◐ | Servidor decide; sem permissões semânticas nem reautenticação para estorno, troca de domínio, elevação de papel. |
| Operações internas (§34–38) | ◐ | Master por papel; **sem MFA**; modo suporte da Commerce tem barra de retorno; sem registro do ator real. |
| Security Center (§39–41) | ✘ | Não existe. |
| Loja pública: XSS, sanitização (§43–45) | ✔ | Texto rico escapado e links filtrados; campos validados com Zod. |
| **CSP, clickjacking, nosniff (§46–47)** | ✘ | `next.config` não define cabeçalhos de segurança. |
| CSRF (§49–50) | ✔ | Ações do Next.js verificam a origem; `SERVER_ACTIONS_ALLOWED_ORIGINS` configurado. |
| SSRF (§51–52) | ✔ | O servidor não busca URL informada por usuário (só consulta APIs fixas dos provedores). A importação de produtos não baixa imagens por URL. |
| Uploads (§53–56) | ? | Imagens e etiquetas vão para `store_assets` em base64; tipo e tamanho validados em parte; não auditei a validação de conteúdo. |
| Tema, apps (§57–67) | ✔ | Sem JavaScript nem CSS de lojista; seções vêm de um catálogo fixo. |
| Webhooks (§68–72) | ◐ | Ver 09. |
| API, checkout, pagamento (§73–87) | ✔/◐ | Servidor recalcula total, frete, desconto e estoque; pagamento só vale depois de conferido; **duplo envio sem proteção no servidor** (F1.2); nenhum dado de cartão guardado (✔). |
| Dados do cliente, privacidade (§88–96) | ◐ | Consentimento de marketing registrado; hash do IP; máscara em erros. Sem classificação de dados pessoais, sem exportar ou excluir cliente. |
| Segredos (§97–101) | ✔ | Nada no repositório; criptografados; fora do log. Sem varredura automática de segredos no CI. |
| Dependências, CI/CD (§102–111) | ◐ | `package-lock.json` versionado, Dependabot, CI com tipos, estilo, testes e build. **Sem varredura de vulnerabilidades, sem varredura de segredos, sem proteção de branch confirmada.** |
| Ambientes (§112–115) | ◐ | Demonstração local e produção; não há homologação. |
| Tempo máximo, repetição, disjuntor, isolamento (§121–132) | ✘/◐ | Sem timeout nas chamadas externas; `runJob` isola etapas das rotinas (✔). |
| Jobs duráveis (§133–137) | ◐ | `job_runs` registra execução e falha; sem tarefa travada, sem fila de falhas. |
| Eventos, banco, backup (§138–146) | ◐ | Transações e índices únicos (✔); sem outbox; **backup do Neon não confirmado, restauração nunca testada**. |
| Observabilidade, SLO, alertas (§147–163) | ◐ | Painel de erros, resumo diário, monitor a cada 15 min com alarme. Sem log estruturado com correlação, sem SLO, sem saúde por loja. |
| Incidentes, pós-mortem, recuperação (§164–179) | ✘ | Sem processo, sem RTO e RPO, sem roteiro de restauração. |
| Interruptores, implantação, reversão (§180–187) | ◐ | Reversão de aplicação por `git revert`; sem flags nem interruptores. Migrações só aditivas (✔). |
| Abuso, fraude, domínio, e-mail (§188–199) | ◐ | Limite em cadastro, cliques e cupons (✔). Teste de cartão, captcha: não. SPF, DKIM, DMARC: dependem do domínio do Resend (a configurar pelo dono). |
| Auditoria (§204–205) | ✘ | Só `activities`. |
| Testes de segurança (§208–216) | ◐ | `tenancy`, `payments`, `independent` cobrem isolamento e pagamento. Sem testes de IDOR sistemático, CSRF, XSS, assinatura, injeção de falha. |

## 11 Quality Engineering
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Definição de pronto (§3–15) | ◐ | Regras no `CLAUDE.md` e na skill `publicar`: tipos, estilo, testes, build, decisão registrada, conferência do site. Falta o rótulo "critério de aceite verificável" por tarefa. |
| Pirâmide de testes (§16–21) | ◐ | 496+ testes de domínio e integração com banco real (PGlite), alguns de componente e e2e em navegador. Sem testes de contrato formais e **sem regressão visual**. |
| E2E críticos (§22–27) | ✔/◐ | `jornada-completa`, `checkout-flow`, `theme-store`, `temas-pagos`. Estorno e cancelamento com liberação de estoque: parcial (estorno ainda não é entidade). |
| Domínio: dinheiro, estoque, pedido, pagamento (§28–32) | ◐ | Testes de preço, estoque (agora com atomicidade), transições e pagamento. |
| **Concorrência real (§33–37)** | ✘ | PGlite atende uma conexão por vez: **não prova** corrida. Nenhum teste de última peça, duplo envio, webhook duplicado simultâneo ou estorno duplo contra Postgres de verdade. Vira item da F8. |
| Isolamento entre lojas e autenticação (§38–46) | ◐ | `tenancy`, `independent`; teste de login com limite: não (o limite nem existe). |
| Qualidade de interface e responsividade (§47–55) | ✔ | Design system, `polish-v8` em 4 larguras, axe, 360 px sem rolagem lateral. |
| Acessibilidade (§56–61) | ✔/◐ | axe automatizado; teclado e leitor de tela manuais: periódicos? não. |
| Regressão visual (§62–65) | ✘ | Só capturas manuais. |
| Desempenho, carga (§66–75) | ◐ | Lighthouse e medições pontuais; **sem teste de carga**. |
| Segurança, contrato, dados, migrações, importação (§76–95) | ◐ | Migrações testadas em banco antigo; importação com testes de arquivo válido e inválido; sem varredura de dependências e de segredos no CI. |
| Observabilidade da qualidade (§96–99) | ◐ | Ver 10. |
| Dados de teste (§100–102) | ✔ | Dados sintéticos; sem dump de produção. |
| Pipeline de CI (§103–106) | ◐ | `ci.yml` (tipos, estilo com zero avisos, testes, build). **O Render publica no push, sem esperar o CI** (ver abaixo). |
| Revisão de código (§107–108) | ◐ | Skills `code-review` e `security-review`; sem revisão obrigatória por outra pessoa. |
| Release, fumaça, canário, flags (§109–116) | ◐ | Monitor a cada 15 min e `smoke-demo`. Sem changelog, sem flags, sem liberação gradual. |
| Severidade e regressão (§117–120) | ✘/◐ | Sem modelo de severidade. A regra "bug corrigido ganha teste" é seguida na prática (F0 a F2 de hoje). |
| Testes instáveis, manutenção (§123–127) | ◐ | Sem registro; a suíte completa passou verde nas últimas execuções. |
| Documentação, ADR (§128–130) | ✔ | `DECISIONS.md` (D1 a D63) e `docs/`. |
| Bloqueios de release (§145) | ◐ | Os casos (vazamento entre lojas, pagamento duplicado, estoque corrompido, migração destrutiva) estão cobertos por regra do projeto, não por um portão automático. |

## Conflito do documento 11 com a regra de testes do dono (art. 41 e 42)
- **O que o 11 pede:** §103 e §104: lint, tipos, unitário, integração e build **antes do merge**; PR com verificação quebrada não entra. §145: não publicar com risco de vazamento, pagamento duplicado, estoque corrompido ou migração destrutiva.
- **O que ficou combinado com o dono (2026-10-03, modo rápido):** antes do envio, só tipos, estilo e os testes da **área tocada**; a suíte completa roda na nuvem **depois** do push, e a fase F8 faz a bateria completa. O Render publica no push, sem esperar o CI.
- **Como convivem:** o modo rápido **mantém** o que o 11 marca como bloqueio de release: dinheiro, pedido, estoque, permissão, isolamento entre lojas, migração com dados e SuperDrop passam pelos testes vizinhos **antes** do push. O que se adia para a nuvem e para a F8 é o resto da suíte.
- **Fica registrado como exceção (D64)** com condição de revisão: voltar ao portão completo antes de publicar se houver incidente causado por teste adiado, se mais de uma pessoa passar a publicar, ou quando o dono pedir.

## Efeito no plano de correção
1. **Fase FS (nova, pequena e segura, antes da F1.1):**
   - limite de tentativas no login (por IP e por e-mail), com teste;
   - cabeçalhos de segurança (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`) sem CSP completa (CSP exige ADR: o Next usa scripts embutidos);
   - tempo máximo (10 s) em todas as chamadas externas (Mercado Pago e plataformas de frete), com teste de `fetch` que nunca responde.
2. **ADRs sem código:** verificação de assinatura do webhook do Mercado Pago (precisa do segredo de webhook que só o dono gera no painel do Mercado Pago), sessões revogáveis e MFA, auditoria geral, interface comum de provedor de pagamento e de frete, flags e interruptores, CSP, RTO e RPO, processo de incidente.
3. **CI (depende do dono aprovar):** varredura de vulnerabilidades (`npm audit`) e de segredos (gitleaks) como etapas não bloqueantes no início; proteção da branch com o CI obrigatório se o dono quiser que o Render só publique com CI verde.
4. **F8 (testes finais):** teste de concorrência contra Postgres de verdade, teste de carga do checkout, regressão visual dos temas de referência e teste de restauração do backup.
