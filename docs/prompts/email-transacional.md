# Prompt de desenvolvimento: Plataforma de E-mail Transacional SuperDrop / NextLevel

> Cole este documento como instrução de trabalho. É executável por fases (E0 a E8). Antes de codar, leia `AGENTS.md`, `docs/design/DECISIONS.md` (D1 a D32), `src/lib/email.ts`, `src/lib/domain/order-emails.ts` e `src/lib/domain/password-reset.ts`. Registre as decisões em `docs/design/DECISIONS.md` (D33 em diante). Nada de percentual, prazo ou limite fixo no código: tudo em configuração.

## 0. ESTADO ATUAL (o que já existe, sem retoque)
- `sendEmail` com Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`), tabela `email_outbox` (status `LOGGED/SENT/FAILED`, `dedupeKey` único), layout HTML único com a marca SuperDrop, `notifyTenant`/`recipientsOf`.
- Enviados hoje: recuperar senha, boas-vindas (loja e parceiro), pagamento de fatura confirmado, aviso de vencimento/atraso, fim de teste (2 dias), pedido pago da Loja NextLevel, saque pago, ativação do parceiro.
- **Cliente final da loja do membro** (o ponto fraco): só recebe "pagamento confirmado" e "pedido enviado", com o **mesmo layout e remetente da SuperDrop**, sem a marca da loja. Não recebe: pedido criado / Pix aguardando, Pix expirando, entregue, cancelado por falta de pagamento, estorno, carrinho abandonado. O **lojista não recebe e-mail** de pedido novo (só o sino do painel, alimentado por `activities`).
- Não existe: fila com reenvio, retentativa, webhooks de entrega/rejeição, lista de supressão, preferências, descadastro, domínio de envio verificado, templates editáveis, versões, prévia, cota por plano, registro de consentimento de marketing.

## 1. RACIONAL: três camadas, três remetentes, três marcas
O e-mail é um produto da plataforma, não um recurso solto. Ele existe em **três frentes**, com dono, marca e regra próprios:

| Camada | Remetente (marca) | Destinatário | Natureza | Exemplos |
|---|---|---|---|---|
| **A. Plataforma** | SuperDrop / NextLevel | Membros, fornecedores, parceiros, compradores da Loja NextLevel | Transacional e de serviço | acesso, senha, faturas, teste, bloqueio, comissões, saque, pedido de serviço |
| **B. Fornecedor → membros** | Marca do fornecedor (white label) | Lojistas da rede do fornecedor | Operacional da rede + relacional | boas-vindas da rede, recarga baixa, pedido aguardando saldo, produto sem estoque, etiqueta pendente, comunicado da Central |
| **C. Membro → clientes** | Marca da loja do membro | Consumidores finais | Transacional de compra + (opt-in) marketing | pedido recebido, Pix, pago, enviado, entregue, cancelado, estorno, carrinho abandonado, avaliação |

Princípios:
1. **A camada C é a que vende.** O consumidor final não conhece SuperDrop: ele precisa ver a marca da loja, um assunto claro, o número do pedido, o que fazer agora e como falar com a loja. O selo NextLevel entra só no rodapé.
2. **Transacional nunca some; marketing exige consentimento.** Mensagem que confirma ou executa algo que o destinatário fez é transacional (sem descadastro, mas com canal de contato). Lembrete comercial, carrinho abandonado e novidades são marketing: só com consentimento registrado (`consents`, já existe no módulo de clientes), com descadastro em 1 clique (`List-Unsubscribe`) e registro.
3. **Reputação do domínio é ativo compartilhado.** Uma loja que dispara spam derruba a entrega de todas. Logo: domínio de envio verificado (SPF, DKIM, DMARC), remetente controlado pela plataforma (`Loja X <pedidos@dominio-da-plataforma>` com `Reply-To` da loja), limites por plano, supressão automática de rejeições e reclamações, e suspensão de envio por tenant.
4. **Personalizar sem quebrar.** Fornecedor e membro editam textos, cores, logo e rodapé dentro de blocos e variáveis seguras. Estrutura, acessibilidade, links obrigatórios e conformidade (identificação do remetente, canal de contato) não são editáveis.
5. **Tudo auditável e reenviável.** Cada e-mail tem registro, estado de entrega, motivo de falha e, quando cabível, botão de reenviar.
6. **Custo e limite por oferta.** Cota mensal por plano (Drop manual, Loja SuperDrop, Loja própria) com aviso ao atingir 80% e 100%; o transacional de pedido nunca é bloqueado por cota, só o marketing.
7. **Falha de e-mail nunca derruba o fluxo** (já vale hoje): tudo assíncrono, com retentativa e sem lançar erro para a tela.

## 2. CATÁLOGO DE EVENTOS (gatilho → destinatário → tipo)
### A. Plataforma
Conta: boas-vindas (loja, fornecedor, parceiro), verificação de e-mail (novo), redefinir senha, senha alterada (segurança), novo login em dispositivo (opcional).
Cobrança: fatura emitida, vence em 3 dias, vence hoje, atrasada (3/7/15/25 dias, conforme `dunning`), acesso parcialmente bloqueado, suspenso, pagamento confirmado, recibo, taxa por pedido do mês, teste termina em 2 dias / hoje / terminou.
Parceiros: nova ativação, comissão liberada, saque solicitado/aprovado/pago/recusado, cadastro inativo e como reativar, fechamento do mês (faixa final).
Loja NextLevel: pedido criado, pago, em contato, entregue; serviço orçado, em execução, entregue.
Fornecedor/Master: alertas críticos do dia (resumo diário, opcional).
### B. Fornecedor → membros
Convite/boas-vindas da rede (com o WhatsApp e o nome do fornecedor), saldo baixo, recarga confirmada, pedido aguardando saldo (72 h), estoque mínimo por tamanho, produto novo na Central, etiqueta pendente, comunicado da Central (marketing operacional, com opt-out), aviso de bloqueio da rede.
### C. Membro → clientes
Pedido recebido, Pix aguardando (com código e prazo), Pix vence em breve, pagamento confirmado, em separação, enviado (rastreio), entregue, cancelado por falta de pagamento, estorno realizado, pagamento recusado (cartão), carrinho abandonado (marketing, opt-in), avaliação pós-entrega (marketing, opt-in), resposta do pós-venda (chat).
**E-mail interno do lojista:** novo pedido, pedido pago, pedido aguardando saldo, cliente abriu solicitação de pós-venda.

## 3. ARQUITETURA
### 3.1 Registro de templates (fonte única)
`src/lib/email/registry.ts`: cada template tem `key` (`store.order.paid`), `layer` (`PLATFORM|SUPPLIER|MERCHANT`), `category` (`TRANSACTIONAL|MARKETING|SECURITY`), `version`, `audience`, `variables` (esquema Zod tipado), `defaults` (assunto, pré-cabeçalho, blocos), `locked` (blocos que não podem ser editados), `preview()` com dados de exemplo. Um teste percorre o registro e falha se algum template não renderizar com os dados de exemplo, se faltar versão de texto puro ou se uma variável obrigatória não for usada.
### 3.2 Renderização
`src/lib/email/render.ts`: blocos (cabeçalho com logo, título, parágrafo, botão, tabela de itens do pedido, caixa de destaque, código Pix, rastreio, rodapé legal) compostos em HTML de tabelas com estilos em linha, largura 600 px, fontes seguras, **modo escuro** (`prefers-color-scheme` com fallback), contraste AA (usar `readableOn`), `alt` em imagens, versão texto puro gerada do mesmo conteúdo, pré-cabeçalho, idioma `pt-BR`. Nenhuma variável entra sem escape; links só de domínios permitidos; imagens só do próprio `/assets` ou do CDN da plataforma.
### 3.3 Marca por tenant (theming)
`email_brand` por tenant: nome de exibição, logo (upload já existe em `store_assets`), cor primária e de destaque, texto do rodapé, WhatsApp, e-mail de contato, endereço e CNPJ (obrigatórios para marketing). Herança em cascata: **loja → fornecedor → plataforma**. Camada C usa a marca da loja; camada B a do fornecedor; camada A a da SuperDrop. A assinatura "SuperDrop é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda." fica sempre no rodapé de todas as camadas.
### 3.4 Personalização (editor)
`email_template_overrides` (tenant, `templateKey`, `version`, `subject`, `preheader`, `blocks` JSON validado, `active`, `updatedBy`): fornecedor personaliza os templates da camada B e define **padrões para as lojas da rede** (camada C, que o membro pode sobrescrever); membro personaliza a camada C. Regras: variáveis só da lista do template (`{{cliente.primeiroNome}}`, `{{pedido.numero}}`…), limites de tamanho, blocos travados (dados do pedido, rastreio, contato legal), **prévia em 3 larguras e no escuro**, **envio de teste** para o próprio e-mail, botão "restaurar padrão", histórico de versões com desfazer, e revisão automática (link quebrado, variável inexistente, contraste, tamanho da imagem, assunto vazio ou em CAIXA ALTA).
### 3.5 Fila, envio e entrega
- `email_outbox` vira fila: `status` (`QUEUED, SENDING, SENT, DELIVERED, BOUNCED, COMPLAINED, FAILED, SUPPRESSED`), `attempts`, `nextAttemptAt`, `providerId`, `tenant` (storeId/supplierId), `templateKey/version`, `category`, `dedupeKey`. Envio por trabalhador (rota `/api/cron/email` já no padrão dos jobs) com retentativa exponencial (até 5), limite de taxa por tenant e por domínio, prioridade (segurança e pagamento antes de marketing).
- **Webhook do provedor** (`/api/webhooks/resend`, assinatura verificada): `delivered`, `bounced`, `complained`, `opened`/`clicked` (opcional, respeitando privacidade). Rejeição definitiva e reclamação criam **supressão** (`email_suppressions`: endereço, motivo, escopo global ou por tenant) e passam a bloquear novos envios (exceto segurança).
- **Domínio de envio:** padrão `pedidos@<dominio-da-plataforma>` com nome de exibição da loja e `Reply-To` da loja; para White Label, domínio próprio verificado via API de domínios do provedor (assistente com os registros DNS, checagem, estado `PENDING/VERIFIED/FAILED`). Sem domínio verificado, cai no padrão.
- **Cota e proteção:** cota mensal por oferta em `platform_settings`, contador por tenant, aviso em 80% e 100%, corte só do marketing, botão do Master para suspender o envio de um tenant, detecção de pico anormal.
### 3.6 Consentimento, preferências e descadastro
Marketing só com `consents` (finalidade `EMAIL_MARKETING`, origem, data, versão do texto). Página pública `/e/preferencias/[token]` (token assinado, sem login) com descadastro em 1 clique e por categoria; `List-Unsubscribe` e `List-Unsubscribe-Post`. Cliente que comprou não vira marketing automaticamente: checkbox desmarcado no checkout da loja.
### 3.7 Segurança e privacidade
Sem dado pessoal em URL (tokens opacos); links de acompanhamento com token e checagem por e-mail já existentes; PII mínima no corpo (nunca CPF completo, nunca senha); log com hash do destinatário nos eventos; retenção do corpo por prazo configurável e anonimização; escape de tudo; proteção contra injeção de cabeçalhos; nenhum segredo em log; DMARC alinhado; `Reply-To` nunca aceita valor livre sem validação.
### 3.8 Observabilidade
Painel do Master (`/master/emails`): volume, entrega, rejeição, reclamação, por template e por tenant, fila e falhas; alertas (taxa de rejeição > 5%, reclamação > 0,3%, fila parada); reenvio manual e exportação CSV.

## 4. TELAS
- **Master:** `/master/emails` (visão geral, fila, supressões, cotas, domínios, tenants suspensos, templates da plataforma com versão e prévia).
- **Fornecedor:** `/supplier/emails` (marca, padrões para a rede, personalizar camada B, prévia, teste, cota da rede, histórico de envios aos membros).
- **Membro:** `/merchant/emails` (marca da loja, personalizar camada C, prévia com um pedido real ou de exemplo, teste, avisos ao lojista ligados/desligados, marketing e consentimento, cota, histórico e reenvio, domínio de envio para Loja própria).
- **Cliente final:** página de preferências e descadastro; toda mensagem com link de acompanhar e contato da loja.
- Design system v3, estados vazios, `axe` sem violações graves, 4 larguras.

## 5. FASES (cada uma fecha com lint, tipos, testes, build, e2e e commit)
- **E0 Fundação:** registro de templates, renderizador em blocos com texto puro e escuro, migração dos e-mails atuais para o registro (mesmo conteúdo, novo motor), testes de snapshot e de segurança (escape, links).
- **E1 Fila e entrega:** outbox como fila, trabalhador, retentativa, webhook do Resend, supressão, `/api/cron/email`; testes com provedor simulado (sucesso, erro, rejeição, reclamação, duplicidade).
- **E2 Marca e camada C:** `email_brand`, herança loja → fornecedor → plataforma, todos os e-mails do pedido do cliente final com a marca da loja (recebido, Pix, pago, separando, enviado, entregue, cancelado, estorno, recusado), e-mail interno do lojista (novo pedido, pago, aguardando saldo), gatilhos ligados aos eventos de pedido já existentes.
- **E3 Editor:** overrides, blocos travados, variáveis, prévia, teste, versões, revisão automática, padrão do fornecedor para a rede.
- **E4 Camada B:** e-mails do fornecedor para os membros (boas-vindas da rede, saldo baixo, recarga, aguardando saldo, estoque, etiqueta, comunicado) com opt-out do comunicado.
- **E5 Marketing e consentimento:** checkbox no checkout, `consents`, carrinho abandonado (fila com janela e limite), avaliação pós-entrega, preferências, `List-Unsubscribe`, regras de frequência.
- **E6 Domínio e cotas:** domínio próprio para Loja própria (assistente DNS e verificação), cotas por oferta, suspensão por tenant, alertas.
- **E7 Master e observabilidade:** `/master/emails`, métricas, alertas, CSV.
- **E8 Acabamento:** acessibilidade dos e-mails (contraste, texto alternativo), teste em clientes reais (Gmail, Outlook, Apple Mail, Android) com capturas, documentação (`docs/design/DECISIONS.md` D33, `docs/MAPA.md`), guia de DNS para o dono.

## 6. DECISÕES QUE VOCÊ DEVE PROPOR COM PADRÃO RECOMENDADO (não bloqueie; registre em D33)
| # | Ponto | Padrão recomendado |
|---|---|---|
| 1 | Provedor | Resend agora; interface `EmailProvider` para trocar (SES, Postmark) sem mexer no resto |
| 2 | Remetente da loja | `Nome da Loja <pedidos@dominio-da-plataforma>` + `Reply-To` da loja; domínio próprio só em Loja própria |
| 3 | Aviso interno ao lojista | Ligado por padrão para pedido novo e pago; desligável |
| 4 | Carrinho abandonado | Desligado por padrão; ligar exige checkbox de consentimento no checkout e CNPJ/endereço no perfil da loja |
| 5 | Rastreio de abertura | Desligado por padrão (privacidade); só entrega e rejeição |
| 6 | Cota por oferta | Drop manual 500/mês, Loja SuperDrop 3.000/mês, Loja própria 20.000/mês (só marketing corta) |
| 7 | Retenção do corpo | 90 dias, depois só metadados |
| 8 | Idioma | pt-BR fixo; estrutura pronta para outros |
| 9 | Segurança | Nunca desativável: senha, novo acesso, e-mail alterado |
| 10 | Conteúdo do fornecedor | O fornecedor não vê dados de pedidos de outras redes; a marca do fornecedor só aparece na camada B |

## 7. ACEITE
- Um pedido numa loja de membro dispara, com a marca da loja, e-mails de pedido recebido, Pix, pago, enviado e entregue, todos em texto puro e HTML, legíveis no claro e no escuro, sem violações graves de acessibilidade.
- O lojista recebe o aviso de pedido novo; o cliente responde ao e-mail e a resposta chega ao lojista.
- O membro altera assunto, texto de abertura, logo e cores de um template, vê a prévia, envia um teste e restaura o padrão; nada que ele escreva quebra o layout nem injeta HTML.
- O fornecedor define o padrão da rede e o membro o sobrescreve.
- Rejeição definitiva e reclamação suprimem o endereço e bloqueiam reenvios (exceto segurança); o reenvio manual funciona; o mesmo evento nunca sai duas vezes.
- Marketing nunca sai sem consentimento; o descadastro funciona em 1 clique e é respeitado imediatamente.
- Cota estourada corta só o marketing; o transacional de pedido continua.
- Toda mensagem tem o rodapé com a assinatura da NextLevel; nenhum dado pessoal em URL; nenhum segredo em log.

## 8. FORA DE ESCOPO NESTA RODADA
SMS e WhatsApp automatizado (canal à parte, mesma arquitetura de eventos), editor visual arrastar-e-soltar de e-mail livre, campanhas em massa (newsletter) e segmentação avançada, automações de jornada com vários passos.
