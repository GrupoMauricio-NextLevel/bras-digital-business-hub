# Cruzamento do 03 (Platform Core) e do 04 (Visual Commerce) com o código (2026-10-03)

Legenda: ✔ cumpre · ◐ parcial · ✘ não cumpre · ? não verificado. Método: leitura do código e buscas; nenhum teste novo foi rodado nesta etapa.

## Resumo
- **03 Platform Core:** o que mais pesa é a **sessão** (cookie assinado sem registro no servidor: não dá para listar nem revogar), a **falta de membership** (um usuário pertence a uma loja só), a **ausência de auditoria geral** e de **2FA**, e as **mídias guardadas dentro do banco**.
- **04 Visual Commerce:** o motor de temas está **bem alinhado** (seções e blocos com esquema, rascunho, publicação, histórico, instalação sem perda). Falhas reais: **publicação não é atômica** entre páginas, sem **variação por celular/computador**, sem **manifesto de tema** e sem **teste visual de regressão**.

## 03 Platform Core
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| I. Loja como tenant, isolamento (§2–6) | ◐ | Identidade estável (`stores.id`), isolamento no servidor (✔, auditoria anterior). Troca de contexto entre lojas não existe. |
| II. Ciclo de vida (§7–11) | ◐ | `stores.status` (PENDING_PAYMENT, ACTIVE, SUSPENDED, CLOSED) e `published_at`. Faltam CONFIGURING, READY_TO_SELL, PAUSED, RESTRICTED, ARCHIVED, a saúde por loja (pagamento, domínio, frete, tema) e a política de retenção após encerrar. |
| III. Usuário e membership (§12–15) | ✘ | `users.store_id` único: um usuário só participa de uma loja; não há tabela de membership (papel, convite, aceite, remoção). Papéis atuais: `role` + `store_role` (OWNER ou STAFF). |
| IV. Autenticação (§16–20) | ◐ | Senha com hash scrypt, redefinição por fluxo seguro, limite de tentativas (`rate-limit`). **Sem 2FA, sem código temporário de acesso, sem magic link.** |
| V. Sessões e dispositivos (§21–23) | ✘ | Sessão é um cookie assinado com `uid` e validade (`auth.ts:35`), **sem registro no servidor**: não lista sessões, não revoga uma sessão específica e não invalida após troca de senha. Sem eventos de segurança (novo IP, novo dispositivo). Usuário desativado perde acesso (✔: `disabledAt`). |
| VI. Autorização (§24–28) | ◐ | Servidor decide (`requireRole`, `assertCanAccess`, `assertStoreAdmin`). Papéis em grupos (Master, fornecedor, dono, equipe), **sem permissões semânticas** (`order.update`, `refund.create`…) e sem reautenticação para ação crítica. |
| VII. Capabilities (§29–32) | ◐ | `features.ts` e tabela `entitlements` (usada por temas). Há 19 comparações diretas com `offer ===` espalhadas. Overrides administrativos sem trilha de auditoria. |
| VIII. Feature flags (§33–35) | ✘ | Não há. Hoje só variáveis de ambiente (`NEXT_PUBLIC_DEMO_MODE`) e `released` nos temas. |
| IX. Configurações e segredos (§36–38) | ✔/◐ | `platform_settings` e preços governados; segredos criptografados e nunca exibidos (`encryptSecret`). Configurações da loja espalhadas por colunas e JSON sem versão. |
| X. Platform Ops (§39–42) | ◐ | Master tem painel de erros, resumo diário, monitor, lista de lojas. **Entrar como lojista** existe (modo suporte da Commerce) com barra de retorno; falta registrar ator real e ator imitado. |
| XI. Auditoria (§43–45) | ✘/◐ | Só `activities` (texto para o usuário) e `events` (17 tipos). Sem trilha de auditoria com ator, loja, antes e depois, origem e correlação para ações sensíveis (troca de senha, secret, permissão, domínio). |
| XII. Eventos (§46–48) | ◐ | Ver art. 22 da auditoria: eventos de cobrança, parceiros e temas existem; de pedido e estoque não. |
| XIII. Jobs (§49–52) | ◐ | `job_runs`/`runJob` isola etapas e registra execução; sem fila, sem estados `PENDING/RUNNING/PARTIAL`, sem reprocessamento. Importação é síncrona. |
| XIV. Mídia (§53–57) | ◐ | Imagens em `store_assets` com o **conteúdo em base64 dentro do banco** (`dataBase64`): sem abstração de armazenamento (§54), sem hash, sem texto alternativo, sem checagem de referências antes de excluir (§56), sem cota. Redimensionamento por `sharp` existe (✔). |
| XV. Domínios (§58–63) | ◐ | `custom_domain` e `domain_status` com 3 estados (NOT_CONFIGURED, PENDING, CONNECTED); faltam awaiting_dns, verifying, ssl_provisioning, error e a saúde do domínio; URL canônica já tratada no SEO da loja (✔). |
| XVI. Integrações (§64–69) | ◐ | Adaptadores de pagamento e frete isolados em `lib`; **sem entidade de integração** (estado, última sincronização, saúde); sem limite de taxa nem disjuntor próprios. |
| XVII. Webhooks (§70–72) | ◐ | Entrada: confere na API do provedor e deduplica (✔). Sem registro de entrega, sem saída para apps. |
| XVIII. Importação e exportação (§73–78) | ◐ | Importação de produtos com validação por linha; sem prévia, sem job, sem reprocessamento; exportação só no Master. |
| XXI. Dados e retenção (§86–88) | ? | Não auditei exclusão lógica. O dono já aponta política de retenção como decisão pendente. |
| XXII. Billing SaaS (§89–91) | ✔ | Cobrança da plataforma (`finance_invoices`, `nextlevel_payments`) separada do pagamento do consumidor; concede `entitlements`. |
| XXIV. Governança (§95–98) | ◐ | Ambientes separados por variável (✔); rotação de segredo e auditoria de mudança de configuração: não. |

## 04 Visual Commerce
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| I. Design tokens (§5–10) | ◐ | `ThemeStyle` tem 8 decisões (cores primária e destaque, fontes, raio, botões, compra rápida, animações) expostas como variáveis `--sf-*`. Não há conjunto semântico completo (superfície, texto, borda, espaçamento, densidade). Contraste: `readableOn` calcula a cor do texto. |
| II. Theme, versão, instância (§11–15) | ✔ | `themes`, `theme_versions`, `store_themes`, `theme_templates`, `theme_globals`; instalação cria a configuração própria da loja e guarda o estado anterior. |
| III. Templates e page types (§16–19) | ◐ | 4 tipos (home, produto, coleção, carrinho). Faltam busca própria, conta, blog, página institucional, campanha, 404 como templates. Variantes de template por tipo: não. |
| IV. Seções e esquemas (§20–24) | ✔ | `sections.ts`: cada seção declara configurações tipadas, limite de blocos, páginas e temas permitidos; seções nascem com defaults aceitáveis. |
| V. Blocos (§25–27) | ✔ | Blocos com esquema e limite. |
| VI. Vínculo de conteúdo (§28–31) | ✔ | Conteúdo estático do lojista e dinâmico do catálogo por contratos (`toPublicProduct`); seções dinâmicas têm estado vazio. |
| VII. Contratos da loja (§32–37) | ✔/◐ | Produto, cartão, carrinho e cabeçalho preservam preço, variação, estoque e CTA. Busca com sugestões só no Signature. |
| VIII. Responsividade (§38–42) | ◐ | Mobile-first e checagem de 360 px (✔; hoje corrigi um estouro no rodapé). **Sem configuração por tela** (imagem de celular x computador, ordem, visibilidade) e sem direção de arte. |
| IX. Page builder (§43–47) | ✔ | Adicionar, remover, duplicar, reordenar, validar. Editor não é HTML livre. |
| X. Prévia (§48–51) | ✔/◐ | Prévia do rascunho com o mesmo renderizador; liberada só ao dono ou Master por cookie (não por link com token); tablet, celular e computador. |
| XI. Rascunho, publicação, volta atrás (§52–57) | ◐ | Rascunho, publicado, histórico de 20 versões com autor, data e rótulo, restaurar para rascunho. **Publicação NÃO é atômica**: `publishThemeAction` publica cada página em uma transação separada e depois o estilo global (§54 e §121). |
| XII. Mídia no editor (§58–61) | ◐ | Mídia pelo `store_assets`. Sem texto alternativo por uso nem ponto focal. |
| XIII–XIV. Componentes e CSS (§62–68) | ✔/◐ | Estilos escopados em `.sf-root` com variáveis; componentes de loja com contrato. Sem registro de componentes. |
| XV. Desempenho visual (§69–73) | ✔ | Orçamento do prompt dos temas (LCP, CLS, JS), imagens reduzidas, fontes do sistema, sem script de terceiros por padrão. LCP do Starter ainda acima da meta. |
| XVI–XVII. Acessibilidade e SEO (§74–80) | ✔ | Contraste calculado, movimento reduzido, **um único H1 por página** (`firstId`), dados estruturados da plataforma. |
| XVIII. Loja de temas (§81–86) | ✔ | Starter gratuito e pagos, demonstração, instalação com 1 clique, troca sem perder dados, licença permanente. Sem versão nem changelog por tema. |
| XIX. Segmentos (§87–90) | ✔ | Lume (moda), Ninho (casa), Arena (esportivo) sobre o mesmo motor. |
| XX. Experiência do editor (§91–95) | ◐ | Rascunho vs publicado e histórico claros. Sem autosave, sem desfazer e refazer, sem copiar seção entre páginas. |
| XXIII. Qualidade de tema (§104–107) | ◐ | Dados de teste (produto sem foto, título longo etc.) não são uma bateria fixa; sem certificação nem validação formal de tema antes de vender. |
| XXVI–XXVII. Contratos e cache (§116–121) | ◐ | Configuração validada por esquema (`normalizeTemplate`, `normalizeGlobals`); sem versão de esquema nem migração de configuração antiga; sem cache de publicação (todas as páginas são dinâmicas). |
| XXVIII. Testes (§122–126) | ◐ | Testes de esquema, instalação e troca (✔). **Sem regressão visual automatizada**. |

## Efeito no plano de correção
1. **Fase visual V (nova, pequena, segura):** publicação atômica do tema (todas as páginas e o estilo global numa única transação) e teste de falha no meio; validação de contraste no editor; quatro dados de teste fixos (sem foto, título longo, esgotado, muitas variantes).
2. **ADRs sem código (Constituição art. 35, e 03 §110 e 04 §128 mandam não inventar antes da necessidade):** sessões revogáveis e 2FA; membership de usuário em várias lojas; auditoria geral (tabela e quais ações); abstração de armazenamento de mídia (hoje base64 no banco); feature flags; entidade de integração e saúde; configuração por tela (celular e computador) e manifesto de tema.
3. A central de segurança do documento 01 (2FA, sessões) continua como fase própria **depois** do ADR.
