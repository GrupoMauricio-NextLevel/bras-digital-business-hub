# BRÁS DIGITAL — PROMPT MESTRE DE ENGENHARIA

> Documento para o Codex. Leia **inteiro** antes de escrever a primeira linha de código.
> Versão 1.1, adaptada ao repositório em 07/10/2026 (decisão D91). Dono do produto: Grupo Maurício.
> Onde estiver escrito **[CONFIRMAR]**, o fato não foi verificado ou depende de decisão do dono: não invente, siga o padrão indicado e registre no relatório.

---

## ADENDO: ADEQUAÇÃO AO REPOSITÓRIO (prevalece sobre qualquer trecho em contrário)

Este documento foi escrito antes de ler o código. O repositório já tem regras próprias, e elas valem mais do que o que está abaixo. Ordem normativa do projeto: **Constituição** (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`) > decisões em `docs/design/DECISIONS.md` > este documento > a tarefa do dia.

### A. O que já existe e muda o plano

1. **Motor único.** Mesmo repositório, mesmo deploy, mesmo banco para todas as marcas (`CLAUDE.md`, regra anti-duplicação, `docs/prompts/nextlevel-commerce-plataforma.md` seção 4A). **Não há repositório, serviço Render ou banco Neon novos.**
2. **A marca já existe:** `BRAS_DIGITAL` em `src/lib/brand.ts` ("O atacado do Brás em uma vitrine só"), com módulos `stores`, `themes`, `partners`, `wholesale`, `marketplace`, domínio `bras.superdrop.com.br`, `live: false` e `signupOpen: false` (cadastro por aprovação, como pedimos). Paleta em `src/lib/brand-palette.ts`: **`#B34D00` (claro) e `#FB8342` (escuro)**; escala completa em `brand-system-v2/tokens.css` (`--bras-50` a `--bras-900`). O texto de marca vem de `getBrand()`, nunca fixo em componente.
3. **A decisão D91** (em `docs/design/DECISIONS.md`) coloca a Brás Digital como prioridade e fixa o escopo da versão 1. Esta frente deixa de estar "para outra etapa".
4. **Independência = de produto, não de infraestrutura.** Rotas, painéis, permissões, textos e visual próprios da Brás Digital; dados e motor compartilhados, com isolamento por importadora e por membro. Nada de condicional por empresa dentro de componente compartilhado.
5. **O Master é um só** (visão do Group com filtro de marca). O que este documento chama de **Estúdio** (produção de conteúdo e lives do dono) precisa caber nessa regra: decidir na Fase 0, registrando em decisão, se vive como módulo da marca dentro do Master ou como área própria que o Master enxerga.
6. **SuperDrop está em produção, com clientes.** Nenhuma mudança no comportamento dele sem teste. A D89 mostrou o caminho para separar donos de catálogo (`src/lib/domain/independent.ts`, `CatalogOwner`): estude antes de modelar o catálogo das importadoras.

### B. Mapa: conceito deste documento → o que existe → ação

Mapeamento **inicial**. Confirme cada linha na Fase 0, no relatório de mapeamento, antes de escrever código.

| Conceito (este documento) | O que já existe | Ação |
|---|---|---|
| Dono / Estúdio | Papel `NEXTLEVEL_MASTER`, painel `src/app/master` | Decidir onde mora (item A.5) |
| Importadora / Balcão | `suppliers`, papéis `SUPPLIER_ADMIN` e `SUPPLIER_DISPATCH` (hoje do SuperDrop) | Decidir: reaproveitar papéis com contexto de marca ou criar papel próprio. Interface **nova e independente** |
| Membro (comprador com CNPJ) | `organizations.brand`, `users`, papel `STORE_OWNER`; `customers` é o consumidor final de uma loja (**não** é o membro) | Provável entidade B2B nova, estendendo `organizations`. Justificar na decisão |
| Caixa / SKU | `products`, `product_variants`, `product_packs` (`totalQuantity`) | Caixa = pack. Estender com pedido mínimo e múltiplo, sem catálogo paralelo |
| Estoque em caixas | `inventory` (`onHand`, `reserved` em unidades) e `inventory_movements` (`IN`, `RESERVE`, `RELEASE`, `SALE`, `ADJUSTMENT`) | Caixas disponíveis **derivadas** de unidades e do pack. Reserva atômica estendendo `src/lib/domain/inventory.ts`. Concorrência real exige Postgres (pendência 7 do dono) |
| Reserva e pedido | `orders` com `saleType: WHOLESALE`, `order_items`, `order_events` | Reserva paga = pedido atacado. Retirada vira modalidade de entrega |
| Pagamento direto à importadora | `stores.mpAccessTokenEnc`, `mp_payment_id`, regra "pagamento só vale depois de conferido na API", idempotência por `dedupeKey` | Importadora conecta a própria conta; comissão via `application_fee` **[CONFIRMAR Pix no Split]**. Criar a interface `PaymentProvider` (regra 7 da 4A) |
| Comissão do dono | `partner_commissions`, `finance`, `nextlevel_payments` | Avaliar reaproveitar **antes** de criar tabela de comissão |
| Conteúdo, feed, lives | `content_items`, `store_assets`, `domain_events` (**verificar** o que cada um guarda) | Estender. Criar a interface `VideoProvider` (regra 7 da 4A), que ainda não existe |
| Auditoria | `audit_log`, `src/lib/domain/audit.ts` | Usar |
| Jobs e erros | `job_runs`, `error_events`, `CRON_SECRET` (pendência 5 do dono) | Usar |
| Importação de planilha | ExcelJS do SuperDrop, com a correção de prefixo de namespace | Estender para estoque |
| Regras configuráveis (comissão, expiração, mínimos) | `platform_settings` | Nunca fixo no código |

Tabelas novas, quando de fato faltarem, levam o prefixo **`bd_`** (ex.: `bd_members`), para evitar colisão e permitir extrair a Brás Digital no futuro, se o dono decidir.

### C. Onde este documento foi corrigido

Seções 0.1, 0.3, 3.4, 3.5, 13.5, 13.6, itens da Fase 0 e da seção 16. Onde a seção 4 mostra um modelo de dados "do zero", leia como **modelo conceitual**: o real nasce do mapa acima.

### D. Primeiro entregável do Codex

Antes de qualquer código, o **relatório de mapeamento** (`docs/relatorios/BD-FASE-0-MAPEAMENTO.md`): para cada linha da tabela B, o que foi confirmado no código, o que será reaproveitado, o que será criado, e as perguntas que sobraram. Siga o protocolo "relatar primeiro" de `docs/constituicao/AGENTS-ORQUESTRADOR.md`. Pare e espere a revisão do dono.

---

## 0. Seu papel e como trabalhar

Você é o **engenheiro-chefe** da Brás Digital. Não é um gerador de telas: é quem responde pela arquitetura, pela segurança, pela qualidade visual e pelo que vai ao ar. Você decide o que for técnico, justifica no log de decisões e pergunta ao dono só o que for decisão de negócio (lista na seção 15).

Princípios inegociáveis, em ordem de prioridade:

1. **Privacidade comercial do dono.** Nenhuma importadora pode descobrir como ele capta, cuida, gerencia e se relaciona com os clientes (seção 6). Este é o ativo da empresa.
2. **Dinheiro e estoque corretos.** Nunca vender a mesma caixa duas vezes, nunca perder um pagamento, nunca mostrar estoque que não existe.
3. **Preço nunca público.** Preço de atacado só aparece para membro aprovado e logado (seção 6.2).
4. **Qualidade visual e de uso acima do comum.** Os três painéis precisam ser impecáveis (seção 11).
5. **Reversibilidade.** Toda mudança pode ser desfeita; todo erro deixa rastro (auditoria e logs).

### 0.1 Protocolo de execução (siga sempre)

O trabalho acontece **dentro do repositório existente**, seguindo `CLAUDE.md`, `AGENTS.md` e `docs/constituicao/AGENTS-ORQUESTRADOR.md`.

```
git fetch origin
git checkout claude/bras-digital
git pull --rebase origin claude/bras-digital
```

- **`claude/bras-digital` é a branch de trabalho e não publica nada.** O Render publica **a cada push** da `claude/wonderful-cannon-5o38v5`. **Não faça push nela** até o dono aprovar uma etapa; aprovada, `git pull --rebase origin claude/wonderful-cannon-5o38v5` e só então una.
- Nunca `--force`. **Não crie PR sem o dono pedir.**
- Commits pequenos, mensagens em português dizendo **o quê e por quê**.
- Antes de cada push: `npx tsc --noEmit`, `npx eslint src e2e tests --max-warnings=0` e `npx vitest run` (use `npx vitest run tests/x.test.ts` para um arquivo); em mudança grande, `npm run build`. Página que consulta o banco declara `export const dynamic = "force-dynamic"`.
- **Next.js 16 tem mudanças de API.** Leia `node_modules/next/dist/docs/` antes de escrever código de Next.
- Migrações: alterou `src/db/schema.ts` → `npx drizzle-kit generate --name <assunto>` e commite `drizzle/`. **Nunca** edite migração já publicada. Só aditivas e reversíveis. Registre que o **ponto de restauração do Neon** é necessário antes de publicar qualquer migração.
- Segredos nunca no código, nos logs, em fixtures ou em capturas: só `encryptSecret`.
- **SuperDrop e NextLevel Commerce não podem mudar de comportamento** sem teste.
- Decisões em `docs/design/DECISIONS.md`, **a partir da D92** (a D91 já registra esta frente).
- Ao fim de **cada fase**, relatório (modelo em 13.4) e **pare** para revisão do dono.

### 0.2 Quando parar e perguntar

Pare e registre o bloqueio (não improvise) quando: a decisão envolver dinheiro, dado pessoal, regra fiscal ou jurídica; um fato marcado **[CONFIRMAR]** mudar a arquitetura; ou duas exigências deste documento entrarem em conflito. Continue com as tarefas que não dependem do bloqueio.

### 0.3 Leia antes de codar (o stack e os padrões já estão definidos)

Leia, nesta ordem: `CLAUDE.md`, `AGENTS.md`, `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`, `docs/prompts/nextlevel-commerce-plataforma.md` (seção 4A), `src/lib/brand.ts`, `src/lib/brand-palette.ts`, `brand-system-v2/` e `docs/design/DECISIONS.md` (D79 a D91).

**Stack:** Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind v4, Radix, Drizzle ORM (PGlite local; Postgres/Neon em produção), Zod, Vitest, Playwright via `playwright-core` (scripts em `e2e/*.mjs`).

**Padrões do projeto:** valores em centavos; toda ação passa pelo domínio (`src/lib/domain/*`) e por `runAction`; permissões no servidor (`requireRole`, `assertCanAccess`); um tenant nunca lê dados de outro; regra configurável em `platform_settings`; segredos com `encryptSecret`; idempotência por `dedupeKey`; marca por `getBrand()`; textos em português claro, sem promessa de ganho. Skills do projeto: `/publicar`, `/e2e-demo`, `/nova-migracao`, `/desenvolver-prompt`.

---

## 1. Visão e tese

**Brás Digital** é a plataforma do atacado de caixa fechada do Brás. Conecta as principais importadoras chinesas do Brás a quem revende: vendedores de e-commerce (Mercado Livre e outros marketplaces), lojistas e distribuidores de todo o Brasil.

A tese em uma frase: **o comprador descobre o produto em vídeo (feed e lives), vê quantas caixas existem agora, reserva e paga em minutos, e retira no Brás com a transportadora dele.**

O que torna a plataforma diferente do que o cliente já viu:

- **Conteúdo como vitrine.** Não há catálogo frio. Cada produto chega em vídeo, apresentado pelo dono, com análise de mercado.
- **Estoque real e visível.** "Restam 37 caixas" ao vivo, com pedido mínimo à vista.
- **Lives com ofertas por horário**, com lote reservado e contagem regressiva.
- **Inteligência de mercado (Brás Digital Analytics).** Análise de tendência no Mercado Livre com IA, que alimenta o vídeo e a decisão de compra.
- **Brás Full.** Esquema para atender o Full do Mercado Livre dos clientes.
- **Acesso fechado.** Só CNPJ validado e aprovado enxerga preço. Não existe site público na primeira versão.

### 1.1 Quem usa (três painéis, três experiências)

| Papel | Nome do painel | Foco |
|---|---|---|
| Dono (Grupo Maurício) | **Estúdio** | Produzir e publicar conteúdo, fazer lives, cuidar dos membros, comissões e operação |
| Importadora | **Balcão** | **Somente** reservas de estoque pagas, estoque, retirada e extrato |
| Cliente membro | **Meu Brás** | Feed, lives, reservar caixas, retirar, analisar, pedir Full |

Os três precisam ser **impecáveis**: rápidos, claros, sem tela confusa, sem erro vago, sem estado vazio morto.

### 1.2 O que NÃO é a primeira versão

- Não é loja pública nem marketplace aberto.
- Não calcula frete (a retirada é no Brás, com a transportadora do cliente).
- Não aceita cartão, boleto nem prazo (somente Pix e dinheiro).
- Não depende do Bling para funcionar (o Bling é módulo da fase seguinte, mas a **interface de conector** já nasce pronta).

---

## 2. Decisões do dono (travadas)

Estas decisões vieram do dono e **não se reabrem** sem pedido dele.

| # | Decisão | Consequência no código |
|---|---|---|
| D1 | Nome: **Brás Digital** | Marca, textos e domínio usam esse nome. O "China Hub" fica reservado e não aparece |
| D2 | Primeira versão **sem site público** | Toda rota exige login, exceto login, cadastro e recuperação de senha. Nenhuma página indexável |
| D3 | A **importadora recebe o pagamento direto** | Dinheiro não passa pela conta do dono. Usar split 1:1 com conta da importadora (seção 7.1) |
| D4 | O dono recebe **comissão já acordada** | Percentual por importadora, calculado a cada venda; cobrança separada para pagamentos em dinheiro |
| D5 | **Preço nunca público** | Preço só para membro aprovado e logado (seção 6.2) |
| D6 | **Retirada no Brás**, com a **transportadora do cliente** | Sem cotação de frete. Fluxo de retirada com código, janela e dados do motorista (seção 8.5) |
| D7 | **Pedido mínimo: 1 caixa fechada** | Compra sempre em múltiplos de caixa inteira. O campo existe no modelo, com padrão 1 |
| D8 | Pagamento: **somente Pix e dinheiro** | Dinheiro é pago na retirada |
| D9 | Painel da importadora **totalmente limitado** à reserva do estoque pago | Escopo mínimo e proteção de dados dos clientes (seção 6) |
| D10 | Painel do dono foca **produção e publicação de conteúdo e lives**, e membros | Estúdio é o produto principal do dono |
| D11 | O dono grava **conteúdo toda semana** no espaço do fornecedor | Pipeline de produção com agenda semanal (seção 9.2) |
| D12 | Lives em **horários específicos**, com **ofertas das importadoras** | Módulo de lives com lote reservado (seção 9.5) |
| D13 | Módulo **Brás Digital Analytics**: tendência no Mercado Livre com IA | Versão básica primeiro, aprofundar depois (seção 10) |
| D14 | **Brás Full**: atender o Full do Mercado Livre dos clientes | Módulo próprio (seção 10.6) |
| D15 | **Bling** é desejável; se for muito problemático, vai para a segunda fase | Fase 1 usa estoque manual e planilha, com conector Bling especificado (seção 7.2) |
| D16 | O dono **paga o Render** | Plano pago, sem desligamento por inatividade |
| D17 | Reaproveitar as outras marcas **só no que for preciso**; olhar para cá de forma **diferente e independente** | Seção 3.4 e seção 11 |

---

## 3. Arquitetura geral

### 3.1 Estilo

**Monólito modular**: um único app implantável, com módulos de domínio isolados por pasta e por contrato. Sem microsserviços. Cada módulo expõe uma API interna (funções tipadas) e **não** acessa as tabelas de outro módulo diretamente.

### 3.2 Módulos de domínio

```
identidade        usuários, sessões, papéis, 2FA, convites
membros           cadastro CNPJ, aprovação, perfil, segmentos (CRM do dono)
importadoras      cadastro, pontos de retirada, comissão acordada, contas conectadas
catalogo          produtos, SKUs, embalagem/caixa, mídia
estoque           saldo por SKU, reservas, movimentos, carimbo de atualização
pedidos           reserva -> pagamento -> retirada (máquina de estados)
pagamentos        Pix e split via provedor, conciliação, estornos, comissões
retirada          códigos, janelas, motoristas, conferência
conteudo          pipeline de vídeo, biblioteca, publicação, feed
lives             agenda, transmissão, ofertas, chat, replay
analytics         tendências, score de oportunidade, análises com IA
full              clientes Full, remessas, plano de preparo
conectores        Bling (fase 2), Mercado Livre, interface comum
notificacoes      push web, e-mail, fila
auditoria         trilha de tudo que importa
plataforma        configurações, flags, jobs, saúde
```

### 3.3 Camadas e regras de código

- **Domínio puro** (regras de negócio, sem I/O) → **serviços de aplicação** (casos de uso, transação) → **adaptadores** (banco, provedores) → **interface** (rotas, telas).
- Toda ação que altera estado passa por **um caso de uso** com: validação, autorização, transação, auditoria, idempotência.
- Autorização **no servidor, por campo e por tenant**, nunca só escondendo botão.
- Dinheiro em **centavos inteiros**. Quantidades de estoque em **caixas inteiras**. Nunca ponto flutuante para valor ou estoque.
- Datas em UTC no banco; exibição em `America/Sao_Paulo`.
- Todo texto de interface fica em um dicionário central (vocabulário na seção 11.5).

### 3.4 Independência dentro do motor único

- **Mesmo repositório, mesmo deploy, mesmo banco** (decisão D91 e regra 4A). A independência é de **produto**: rotas, painéis, permissões, textos e visual próprios da marca `BRAS_DIGITAL`, resolvida por `getBrand()`.
- **Estenda antes de criar.** O mapa do adendo (B) lista o que reaproveitar. Tabelas que forem realmente novas levam o prefixo `bd_`.
- **Visual:** use os primitivos acessíveis de `src/design-system` (foco, contraste, teclado), mas **não herde a casca nem o layout** dos painéis atuais. O plano de design (11.1) decide o que reaproveitar. A cor da marca é a de `brand-system-v2/` (laranja `#B34D00` no claro, `#FB8342` no escuro).
- **Proibido** `if (marca === ...)` ou condição por empresa em componente compartilhado. Variação por marca entra por configuração, tema ou módulo.
- Do SuperDrop, **copie e adapte** só o que for preciso, registrando a origem na decisão: importação de planilha (com a correção de namespace), `audit_log`, modo suporte seguro, criptografia de credenciais.

### 3.5 Infraestrutura

- **Um Render e um Neon para tudo.** O deploy é por push na branch de publicação; a branch `claude/bras-digital` não publica. O dono paga o plano do Render (D16): sem desligamento por inatividade.
- **Domínio:** hoje `bras.superdrop.com.br` (em `brand.ts`). Domínio próprio e ligação no Render/DNS só quando houver código para mostrar e o dono pedir.
- **Jobs agendados** (expirar Pix, liberar reserva em dinheiro vencida, sincronizar estoque, atualizar tendências, lembrar de live, conciliar pagamentos): usar o mecanismo existente (`job_runs`, `CRON_SECRET`; a pendência 5 do dono precisa estar resolvida). Todos idempotentes.
- **Vídeo e lives:** nunca no servidor do app. Criar a interface `VideoProvider` (seção 9.4).
- **Observabilidade:** `/api/health` (já mostra versão no ar e última atualização do banco), `error_events` e `job_runs`; logs estruturados com `requestId`.
- **Armazenamento de arquivos** (imagens, planilhas): seguir o que `src/lib/domain/assets.ts` e `store_assets` já usam; só propor outro com decisão registrada.

---

## 4. Modelo de dados (núcleo)

> **Modelo conceitual.** O real nasce do mapa do adendo (B): estenda as tabelas existentes e crie, com prefixo `bd_`, só o que faltar.

Convenções: chaves `uuid`, `criado_em`, `atualizado_em`, `versao` (controle otimista) em toda tabela mutável. Valores em centavos (`bigint`). Estoque em caixas (`integer`, `CHECK >= 0`). Nada de exclusão física de dado financeiro: use `arquivado_em`.

### 4.1 Tabelas principais

```
usuarios            id, email, hash_senha, papel (DONO|EQUIPE|IMPORTADORA|MEMBRO), 2fa, status
membros             id, usuario_id, cnpj, razao_social, nome_fantasia, tipo (ECOMMERCE|LOJISTA|DISTRIBUIDOR),
                    status (PENDENTE|APROVADO|SUSPENSO|RECUSADO), aprovado_por, aprovado_em, origem_captacao*
membro_crm          membro_id, segmentos[], notas*, historico_contatos*, valor_vitalicio*, proxima_acao*   (*SOMENTE DONO)
importadoras        id, nome, cnpj, status, comissao_bps (ponto-base, ex.: 500 = 5,00%), conta_pagamento_id
importadora_usuarios  importadora_id, usuario_id, perfil (ADMIN|OPERADOR|EXPEDICAO)
pontos_retirada     id, importadora_id, endereco, horarios, instrucoes
produtos            id, importadora_id, titulo, descricao, categoria, ncm?, status, midia[]
skus                id, produto_id, codigo_externo, variacao, unidades_por_caixa, preco_caixa_centavos,
                    pedido_minimo_caixas (padrao 1), multiplo_caixas (padrao 1), peso_caixa_g, dimensoes_caixa_mm
estoque_saldos      sku_id, caixas_fisicas, caixas_reservadas, caixas_disponiveis (derivado), atualizado_em, origem
estoque_movimentos  id, sku_id, tipo, caixas, motivo, ator, referencia, criado_em       (append-only)
reservas            id, membro_id, importadora_id, status, expira_em, total_centavos, forma_pagamento
reserva_itens       reserva_id, sku_id, caixas, preco_caixa_centavos_no_ato
pagamentos          id, reserva_id, provedor, forma (PIX|DINHEIRO), status, valor, taxa_plataforma, referencia_externa
comissoes           id, pagamento_id|reserva_id, importadora_id, base, bps, valor, status (APURADA|COBRADA|PAGA)
retiradas           id, reserva_id, codigo, janela_inicio, janela_fim, transportadora, motorista_nome, motorista_doc, placa, status
conteudos           id, tipo (VIDEO|LIVE|ANALISE), titulo, status, publicado_em, produto_ids[], sku_ids[]
lives               id, titulo, inicia_em, termina_em, status, provedor_id, lote_oferta[]
live_ofertas        live_id, sku_id, caixas_reservadas_para_live, preco_caixa_centavos, abre_em, fecha_em
analises            id, produto_id|termo, fonte, periodo, score, resumo_ia, dados_brutos_ref, gerada_em
full_clientes       membro_id, conta_ml_conectada, status, regras
full_remessas       id, membro_id, status, itens[], plano_preparo, etiquetas_ref, agendamento_ref
conectores          id, tipo (BLING|MERCADO_LIVRE|MERCADO_PAGO), dono (IMPORTADORA|MEMBRO|PLATAFORMA), credencial_cifrada, estado
auditoria           id, ator, papel, acao, alvo, antes, depois, ip, criado_em      (append-only)
```

### 4.2 Regras do modelo

- `caixas_disponiveis = caixas_fisicas - caixas_reservadas`. Nunca confie num campo editável: derive e proteja com `CHECK`.
- O **preço da caixa** é copiado para `reserva_itens` no ato (preço histórico imutável).
- `estoque_movimentos` e `auditoria` são **append-only** (sem UPDATE/DELETE por permissão do banco).
- Todo vínculo importadora↔dado leva `importadora_id`, e **toda consulta é filtrada por ele no servidor** (seção 6.3).

---

## 5. Estoque e reservas (o coração do sistema)

Este módulo decide se o produto vale a pena. Trate-o com o rigor de um módulo financeiro.

### 5.1 Regras

1. **Venda sempre em caixa fechada inteira**, em múltiplos de `multiplo_caixas`, respeitando `pedido_minimo_caixas` (padrão 1, D7).
2. **Reserva atômica.** Criar reserva = transação única que: trava a linha do SKU (`SELECT ... FOR UPDATE` ou `UPDATE ... WHERE caixas_disponiveis >= :n RETURNING`), incrementa `caixas_reservadas`, grava `reservas` + `reserva_itens` + `estoque_movimentos`. Se faltar estoque, falha com mensagem clara e **nada** é gravado.
3. **Idempotência.** Toda criação de reserva e todo pagamento recebem `chave_idempotencia`. Repetir a requisição devolve o mesmo resultado.
4. **Expiração.** Reserva Pix expira em **15 minutos** (configurável). Reserva em dinheiro expira no fim da janela de retirada combinada, no máximo **[CONFIRMAR: 24 h]**. Um job idempotente libera o estoque e registra o movimento.
5. **Baixa definitiva** só na confirmação de retirada (`caixas_fisicas -= n`, `caixas_reservadas -= n`).
6. **Conferência.** Job diário compara `Σ movimentos` com o saldo e alerta qualquer divergência. Divergência nunca é "corrigida sozinha": vira ocorrência para a importadora e para o dono.
7. **Carimbo de frescor.** Todo saldo exibido mostra "atualizado há X" (origem manual, planilha ou Bling). Se o saldo passar de **[CONFIRMAR: 30 min]** sem atualização em modo integrado, a interface troca para "confirmando estoque" e bloqueia a reserva.
8. **Quem altera o estoque físico** é só a importadora (ou a integração dela). O dono nunca edita saldo da importadora; ele pode **pedir** correção, que fica registrada.

### 5.2 Estoque ao vivo na interface

- Todo cartão de produto, vídeo e oferta de live exibe: **caixas disponíveis agora**, **pedido mínimo**, **unidades por caixa** e **preço por caixa** (somente para membro aprovado).
- Atualização em tempo real por **SSE** (preferido) ou WebSocket, com reconexão e fallback para polling de 10 s.
- Nos estados "últimas caixas" (≤ **[CONFIRMAR: 10]**), "esgotado" e "voltou ao estoque", a interface muda de forma clara, sem animação gratuita.
- Em live, a contagem de caixas da oferta é **lote reservado para a live** (seção 9.5), separado do saldo geral.

### 5.3 Casos de borda que precisam de teste

- Dois membros reservando a última caixa no mesmo milissegundo.
- Pagamento Pix confirmado **depois** da expiração da reserva (política: se ainda há estoque, honrar; se não, estorno automático e aviso).
- Importadora zera o estoque com reservas abertas.
- Planilha de estoque com SKU inexistente, valor negativo, decimal ou vazio.
- Queda do provedor de pagamento no meio da reserva.
- Relógio do servidor atrasado (use o relógio do banco).

---

## 6. Privacidade, segredo comercial e segurança

### 6.1 O que a importadora NUNCA pode ver (D9, princípio nº 1)

O dono não pode entregar às importadoras a forma como capta, cuida, gerencia e se relaciona com os clientes. Portanto, a importadora **não** vê:

- a lista de membros, nem o perfil, o histórico, as notas, o segmento ou o valor vitalício de nenhum;
- quantas vezes um membro comprou **de outras importadoras**;
- qualquer dado de conteúdo, de live ou de analytics (audiência, visualizações, quem assistiu, tempo assistido);
- a origem de captação, campanhas e conversas do dono com membros;
- a comissão acordada com **outras** importadoras.

A importadora vê **apenas, por reserva paga na sua loja**: o identificador do comprador mínimo necessário para entregar a mercadoria (nome fantasia e CNPJ do comprador, contato operacional da retirada), os itens, quantidade e valor. Nada além disso. **[CONFIRMAR]** se o CNPJ do comprador pode ser exibido; se houver dúvida, exiba somente o nome fantasia e um código do pedido, e deixe o CNPJ para a nota fiscal que ela emite no próprio sistema.

### 6.2 Preço nunca público (D5)

- Sem login = **nenhum preço, nenhum estoque, nenhum nome de importadora, nenhum vídeo completo**.
- Membro com status ≠ `APROVADO` (pendente, suspenso, recusado) **não** vê preço.
- O preço **não** vai em HTML renderizado para anônimo, em metadados, em `sitemap`, em cache de CDN público, nem em respostas de API sem sessão válida.
- Proteja contra raspagem: limite de taxa por usuário/IP, sessões com expiração, marca d'água discreta com identificação do membro nas telas com preço, bloqueio de exportação em massa. Registre qualquer volume anormal de consultas e alerte o dono.
- Os vídeos do feed **não falam preço**. O preço aparece em sobreposição da interface, somente após login.
- `robots.txt` bloqueando tudo, cabeçalho `noindex` global.

### 6.3 Isolamento de dados (tenant)

- Multi-tenant lógico por `importadora_id` e por `membro_id`. **Toda** consulta passa por uma camada de repositório que injeta o filtro de tenant a partir da sessão. Proibido SQL manual sem esse filtro.
- Se o banco permitir, ative **Row Level Security** como segunda barreira.
- Teste automatizado obrigatório: para cada rota e ação da importadora e do membro, um usuário de **outro tenant** tentando acessar deve receber 403/404, sem vazar existência do recurso.
- Teste automatizado de "vazamento de campo": respostas da API da importadora não podem conter nenhum campo de CRM, analytics ou conteúdo (verificação por esquema de resposta com lista de campos permitidos).

### 6.4 Autenticação e acesso

- E-mail + senha com hash forte (argon2id) e política de senha; **2FA obrigatório** para DONO e EQUIPE, recomendado para importadora.
- Cadastro de membro **por convite ou solicitação com aprovação manual** (CNPJ validado, seção 8.1). Nada de cadastro aberto que libere preço.
- Sessões com expiração e revogação, proteção CSRF, cookies `HttpOnly`, `Secure`, `SameSite`.
- Limite de tentativas de login, aviso de login em dispositivo novo.
- **Modo suporte** do dono (ver como importadora/membro): somente leitura por padrão, prazo curto, motivo obrigatório, assinado, auditado e visível ao usuário. Copie o padrão já usado no sistema existente (seção 3.4).

### 6.5 Dados pessoais (LGPD)

- Mapear dados pessoais coletados (responsável, e-mail, telefone, CPF do motorista na retirada), finalidade e base legal, em `docs/privacidade/bd-mapeamento.md`.
- Coletar o mínimo; mascarar documentos em telas e logs; reter só o necessário.
- Rotinas de **exportação** e de **exclusão/anonimização** a pedido do titular, mantendo o que a lei exige (financeiro, fiscal).
- Termos de uso e política de privacidade são textos jurídicos: gere **rascunho**, marque **[REVISAR COM ADVOGADO]** e não publique como definitivo.

### 6.6 Segredos e credenciais de terceiros

- Tokens de Bling, Mercado Livre e Mercado Pago ficam **cifrados em repouso** (AES-256-GCM, chave fora do banco, rotacionável). Mostre só os 4 últimos caracteres na interface.
- Nunca registre token em log, erro, auditoria ou captura de tela.
- Cada importadora/membro conecta **a própria conta** por OAuth; revogar no painel dele revoga no sistema.
- Escopos mínimos e documentados por conector.

### 6.7 Segurança de aplicação

- Validação de entrada com esquema em toda borda; saída sempre escapada; CSP restritiva; cabeçalhos de segurança.
- Upload de planilha/imagem: limitar tipo e tamanho, varrer, processar em worker isolado, nunca executar conteúdo.
- Webhooks: validar assinatura, rejeitar replay, responder rápido e processar em fila.
- Dependências: auditoria automática (`npm audit` ou equivalente) no pipeline; sem pacote abandonado.
- Backups: Neon com ponto de restauração; teste de restauração documentado.

---

## 7. Pagamentos e integrações

### 7.1 Pagamentos: importadora recebe direto, dono recebe comissão (D3, D4, D8)

**Provedor sugerido: Mercado Pago com Split de Pagamentos 1:1.** Pela documentação oficial, o marketplace usa um **access token de cada vendedor obtido por OAuth**, e define a comissão no parâmetro `application_fee` de cada pagamento criado em `/payments`; o valor é dividido automaticamente entre vendedor e marketplace, sem ação do vendedor. A tarifa do Mercado Pago é descontada do valor recebido pelo vendedor.

Como aplicar aqui:

1. Cada importadora conecta a conta Mercado Pago dela por OAuth (no Balcão). O dinheiro do Pix cai **na conta dela**.
2. A plataforma cria o pagamento Pix com o token da importadora e `application_fee` = comissão acordada daquela importadora (`comissao_bps`). A comissão do dono é separada **na hora**, sem repasse manual.
3. Reembolso: pela documentação, o valor devolvido é dividido proporcionalmente entre as contas; se o vendedor não tiver saldo, o marketplace devolve a sua parte e o resto vira pendência entre as partes. Modele esse estado e mostre-o nos dois painéis.
4. Confirmação por **webhook assinado** + conferência ativa por consulta (nunca confie só no webhook).

**[CONFIRMAR antes de codar]** que o **Pix** é suportado dentro do Split 1:1 com `application_fee` para o seu tipo de conta, as tarifas, e os requisitos de homologação do marketplace. Se não for, o plano B é: Pix direto na chave da importadora, com conciliação por webhook do banco/PSP dela, e a comissão apurada em `comissoes` e **cobrada mensalmente** (item abaixo).

**Pagamento em dinheiro (retirada):** não passa por gateway.
- A reserva em dinheiro **trava o estoque** até o fim da janela de retirada.
- A importadora confirma o recebimento no Balcão, no momento da retirada (ação auditada, com valor).
- A comissão fica `APURADA` e é **cobrada da importadora** em fechamento (semanal ou mensal, **[CONFIRMAR]**), com extrato por pedido, exportável.
- Anti-abuso: membro novo ou com faltas só reserva em dinheiro até um limite **[CONFIRMAR]**; falta na retirada gera ocorrência e pode suspender a modalidade dinheiro.

**Comissão:** percentual por importadora (`comissao_bps`), com vigência (histórico). Base de cálculo: valor dos produtos da reserva **[CONFIRMAR]** (se incide sobre taxa, desconto etc.). Tudo aparece em extrato do Estúdio. A importadora vê **só a dela**.

### 7.2 Bling (opcional na Fase 1, previsto para a Fase 2) (D15)

A decisão do dono: se for problemático, fica para a segunda fase. **Mesmo assim, a Fase 1 já entrega a interface de conector** para que a troca seja só plugar o adaptador.

**Interface comum de conector de estoque** (`ConectorEstoque`): `conectar()`, `listarProdutos()`, `lerSaldos()`, `receberEvento()`, `publicarReserva()`, `desconectar()`, mais `estado` e `ultimaSincronizacao`. Implementações: `EstoqueManual` (Balcão), `EstoquePlanilha` (ExcelJS, reaproveitando o padrão do sistema existente) e `EstoqueBling` (Fase 2).

**O que a documentação oficial do Bling confirma:**
- API v3 com **OAuth 2.0** (aplicativo registrado com client_id/secret; a importadora autoriza).
- **Webhooks** disponíveis, incluindo pedido de venda, estoque e nota fiscal, com documentação comparando webhooks e polling.
- Saldos em `/estoques/saldos` e pedidos de venda em `/pedidos/vendas`.
- **Limites por conta Bling inteira**: 3 requisições por segundo e 120.000 por dia; excesso retorna 429, e há bloqueio de IP por rajadas de erros ou de requisições e por abuso do endpoint de token.

**Desenho da Fase 2:**
1. Webhook de estoque + **reconciliação por polling** com limitador de taxa (fila por conta, no máximo ~2 req/s para folga), backoff exponencial e circuito aberto ao receber 429.
2. **Unidade vs caixa**: o Bling guarda unidades. O SKU da plataforma define `unidades_por_caixa`; `caixas_fisicas = floor(saldo_unidades / unidades_por_caixa)`. Sobra de unidades não vira caixa.
3. **Mapeamento de produto** com tela de conferência (SKU do Bling ↔ SKU da plataforma) aprovada pela importadora antes de ligar a sincronização.
4. **Reserva** na plataforma continua sendo a verdade de venda: ao reservar, a plataforma reduz o disponível imediatamente e **só depois** publica o pedido no Bling (`/pedidos/vendas`), para a importadora emitir nota e expedir no ERP dela. Atenção ao descompasso entre saldo físico, virtual e reservado do Bling **[CONFIRMAR com a importadora piloto]**.
5. Dado da importadora no Bling **nunca** vai para o dono além do que o produto precisa (estoque, preço, SKU). Pedido de outros canais da importadora **não** é copiado.
6. Escopos de acesso mínimos **[CONFIRMAR na documentação]**, e se o plano Bling da importadora piloto libera a API.

### 7.3 Mercado Livre (para Analytics e Full)

Detalhado nas seções 10.2 e 10.6. Resumo: OAuth do **membro** (para Full e dados da conta dele) e uma **credencial da plataforma** (para tendências públicas).

---

## 8. Pedidos, cadastro e retirada

### 8.1 Cadastro e aprovação de membro

1. Solicitação: CNPJ, razão social, tipo (e-commerce, lojista, distribuidor), responsável, WhatsApp, e-mail, como conheceu.
2. **Validação de CNPJ** (dígitos verificadores + consulta de situação cadastral por fonte oficial/serviço **[CONFIRMAR provedor]**). CNPJ inativo/baixado é recusado com motivo.
3. Fila de aprovação no **Estúdio**: o dono vê o perfil, aprova, recusa ou pede informação. Aprovação libera preço.
4. Convite: o dono gera links de convite com origem rastreada (`origem_captacao`), visível **só a ele**.
5. Cada membro tem **uma** conta principal por CNPJ, com usuários adicionais (comprador, financeiro) opcionais.

### 8.2 Máquina de estados da reserva

```
RASCUNHO -> AGUARDANDO_PAGAMENTO -> PAGA -> AGENDADA_RETIRADA -> RETIRADA
                |                     |
                v                     v
             EXPIRADA              CANCELADA / ESTORNADA
```

- Transições só pelos casos de uso, cada uma com auditoria e movimento de estoque coerente.
- **Dinheiro:** `AGUARDANDO_PAGAMENTO` vira `AGENDADA_RETIRADA` ao confirmar a reserva (estoque travado) e vira `PAGA`+`RETIRADA` quando a importadora confirma o recebimento.
- Cancelamento pelo membro até X horas antes da janela **[CONFIRMAR regra]**; cancelamento pela importadora exige motivo e gera ocorrência visível ao dono.

### 8.3 Carrinho e fechamento

- Carrinho de **uma importadora por reserva** (o dinheiro vai direto para ela). O carrinho agrupa por importadora e gera uma reserva por grupo, com um **resumo único** para o membro.
- Total em caixas e em valor; aviso se algum item perdeu estoque; revalidação final no servidor.
- Nada de "frete": a tela mostra "Retirada no Brás".

### 8.4 Pix

- QR Code e copia-e-cola, contagem regressiva da expiração, status em tempo real, comprovante, recuperação se o membro fechar a tela (a reserva continua em "Minhas reservas").

### 8.5 Retirada (transportadora do cliente) (D6)

Fluxo:
1. O membro escolhe a **janela de retirada** entre as oferecidas pela importadora no ponto de retirada.
2. Informa a **transportadora**, o **nome e documento do motorista** e a **placa** (pode editar até X horas antes).
3. O sistema gera um **código de retirada** (curto, não adivinhável) e um **QR Code**, enviados ao membro e à transportadora (link sem preço).
4. No Balcão, a expedição **lê o QR/código**, vê a **lista de picking** (caixas por SKU, corredor, observações), confere e **confirma a retirada** com foto opcional da carga.
5. Divergência (caixa faltante/avariada) abre ocorrência com fotos; o estoque e o financeiro seguem a regra de ocorrência (estorno parcial) **[CONFIRMAR política]**.
6. Documento fiscal: **a importadora emite** no sistema dela. A plataforma guarda o número/arquivo anexado ao pedido (campo opcional), sem emitir nota.

**A tela de retirada para a transportadora/motorista não mostra preço.**

### 8.6 Notificações

- Web push + e-mail (+ WhatsApp **[CONFIRMAR provedor oficial]**) para: reserva paga, janela confirmada, lembrete de retirada, oferta de live iniciando, "voltou ao estoque", ocorrência aberta.
- Preferências por tipo de aviso. Nenhuma notificação com preço no corpo do e-mail ou push.
- Importadora recebe só avisos operacionais (reserva paga, retirada agendada, ocorrência).

---

## 9. Conteúdo, feed e lives (o diferencial)

### 9.1 Conceito

O feed é a **vitrine**. Vertical, em tela cheia, rolagem por produto, em estilo de vídeo curto. Cada vídeo traz sobreposta, em tempo real, a **barra de compra**: caixas disponíveis, pedido mínimo, unidades por caixa, preço da caixa (só para membro aprovado) e o botão **Reservar caixas**. O membro nunca sai do vídeo para comprar.

O feed não é uma rede social aberta: não há comentário público nem perfil de membro. Existe **reação privada** (salvar, "quero ver na live", "avisar quando voltar") que alimenta o CRM do dono.

### 9.2 Pipeline de produção do dono (D10, D11)

O dono grava toda semana no espaço do fornecedor. O Estúdio precisa tornar esse ritual **rápido e repetível**.

- **Agenda semanal de produção**: calendário com os dias de gravação, importadora/espaço, produtos previstos, status por vídeo.
- **Roteiro assistido**: para cada produto, o sistema monta uma **ficha de gravação** (dados do SKU, análise de mercado do Analytics, pontos de venda sugeridos, caixa/unidades, perguntas que o comprador faria). A IA sugere roteiro e legenda; **o dono edita e aprova**. Nenhuma publicação automática sem aprovação.
- **Envio do vídeo** pelo celular (upload direto ao provedor de vídeo, com retomada se cair a conexão), **marcação de produto/SKU** no vídeo e **capa** escolhida.
- **Fluxo de estados**: `ROTEIRO -> GRAVADO -> EM_EDICAO -> REVISAO -> AGENDADO -> PUBLICADO -> ARQUIVADO`.
- **Publicação agendada** e **fila de publicação** (o dono arrasta a ordem no feed).
- **Biblioteca**: busca por produto, importadora, tema, desempenho. Reaproveitar clipes.
- **Checagem antes de publicar** (bloqueia a publicação se falhar): produto vinculado, SKU com estoque, **nenhum preço falado/escrito no vídeo**, legenda presente, capa definida, importadora autorizou o produto.
- **Aprovação da importadora (opcional)**: a importadora pode ser avisada de que o produto dela vai ao ar, **sem ver o conteúdo do CRM nem o desempenho**.

### 9.3 Feed do membro

- Ordenação: relevância para o membro (segmento dele, categorias que olhou, tendências do Analytics) **+ regra editorial do dono** (itens fixados, destaque da semana).
- Itens do feed: vídeo de produto, análise de tendência, **oferta de live** (com cronômetro), **replay**, e "voltou ao estoque".
- Estados do cartão: normal, últimas caixas, esgotado (mostra "me avisar"), em live agora.
- Acessibilidade: legenda automática, controle de som, sem autoplay com som, respeito a "reduzir movimento".
- Desempenho: pré-carregar o próximo vídeo, adaptar a qualidade à rede (muitos vão assistir no celular, no Brás ou em trânsito), nada de scroll travado.
- **Telemetria de produto** (visualização, tempo assistido, salvou, reservou) é **do dono**, nunca da importadora (seção 6.1).

### 9.4 Vídeo e lives: infraestrutura

Nunca hospede vídeo no servidor do app. Pesquisa atual (2026):

- **Transmissão de broadcast** (RTMP/SRT de entrada e HLS de saída) atende bem a live de venda, com latência baixa de poucos segundos; Mux e Cloudflare Stream são provedores consolidados desse modelo, e Cloudflare Stream cobra por minuto assistido. Já as soluções de **tempo real (WebRTC, como LiveKit)** servem quando o público precisa **entrar no palco**, o que **não** é o caso aqui.
- **Recomendação:** provedor de **broadcast com HLS**, gravação automática da live para replay (live-to-VOD) e upload de vídeo sob demanda no mesmo provedor. Avaliar **Mux** e **Cloudflare Stream** com uma prova de conceito (latência real, custo por minuto assistido para ~[CONFIRMAR: nº de membros simultâneos], faixa de qualidade, URL assinada). Registrar a escolha no log de decisões.
- **URLs assinadas e com expiração** para todo vídeo. Sem link público. Proteção contra incorporação em outros sites.
- **Chat e eventos da live** ficam no **seu servidor** (SSE/WebSocket), não no provedor de vídeo, para controlar moderação e privacidade.

### 9.5 Lives com ofertas por horário (D12)

Módulo `lives`, fluxo completo:

1. **Agendar** (Estúdio): título, data/hora, produtos e **ofertas por importadora**.
2. **Oferta de live** = SKU + **lote de caixas reservado para a live** (tirado do disponível, em transação, e devolvido ao fim) + preço da live + abre/fecha. O lote reservado **aparece como estoque da live**, não do geral.
3. **Convite aos membros**: notificação e entrada no feed, "Começa em 02:14:10", botão "Me lembrar".
4. **Sala de transmissão do dono**: preview, chave de transmissão, botão **Iniciar**, painel lateral com as ofertas (liberar/pausar/encerrar cada uma), pedidos entrando em tempo real, caixas restantes de cada lote, fila de perguntas do chat.
5. **Sala do membro**: vídeo, ofertas ativas com **contagem regressiva e caixas restantes ao vivo**, botão **Reservar** que respeita a regra de estoque (seção 5) e leva a Pix em poucos toques.
6. **Chat** só entre dono e membros aprovados, com moderação, perguntas fixadas, mensagens apagáveis, **sem** exibir CNPJ de ninguém aos outros membros.
7. **Encerramento**: lote não vendido volta ao estoque geral; relatório da live (reservas, caixas vendidas, tempo para esgotar cada oferta, picos de audiência) **só para o dono**.
8. **Replay** automático, com as ofertas já encerradas marcadas como "encerrada" (ou "ainda disponível" se houver estoque).
9. **Plano de contingência**: queda da transmissão (tela de espera + retomar), queda do chat (a live segue), sobrecarga na reserva (fila com posição visível, nunca erro seco).

**Teste de carga obrigatório** da reserva simulando uma live: centenas de membros disputando poucas caixas, sem venda duplicada e sem queda (seção 12).

### 9.6 Painel Estúdio: telas do módulo

`Hoje` (o que gravar, o que publicar, lives próximas) · `Produção` (pipeline, agenda semanal) · `Biblioteca` · `Feed` (ordem e destaques) · `Lives` (agenda, sala, relatório) · `Membros` (fila de aprovação, CRM) · `Importadoras` (cadastro, comissões, saúde da integração) · `Financeiro` (comissões, extrato, cobranças em dinheiro) · `Analytics` · `Full` · `Configurações`.

---

## 10. Brás Digital Analytics e Brás Full

### 10.1 Objetivo (D13)

Dar ao comprador uma **leitura de mercado do produto** antes de comprar uma caixa, e dar ao dono **matéria-prima para o conteúdo**. O dono citou como referência de conceito a plataforma **Joom Pulse** (análise de produto). **Não foi verificada por mim**: reproduza o **conceito** (análise e tendência de produto), nunca copie interface, texto ou marca de terceiros.

**Versão 1 (básica):** análise por produto e por categoria, com fonte pública do Mercado Livre e resumo gerado por IA. **Versão 2:** profundidade, histórico próprio, previsão e alertas personalizados.

### 10.2 Dados do Mercado Livre (o que a documentação oficial confirma)

- **Tendências:** `GET /trends/MLB` (e `/trends/MLB/{categoria}`) traz os **50 produtos mais buscados**, atualizados **semanalmente**: um bloco de **buscas mais desejadas** (última semana) e um de **buscas que mais cresceram** (comparação de duas semanas). Retorna palavra-chave e URL de busca.
- **Mais vendidos:** `GET /highlights/MLB/category/{categoria}` lista até **20** itens/produtos mais vendidos da categoria (só categoria folha); há consulta por item e por produto para ver a posição no ranking.
- Autenticação por **token de acesso (OAuth)** do aplicativo cadastrado no Mercado Livre.
- Itens, preços e catálogo por consultas à API. **[CONFIRMAR]** quais endpoints de busca, visitas e vendas estimadas estão **abertos** ao seu aplicativo e quais exigem permissão ou foram restringidos. **Não faça raspagem (scraping) do site**: use apenas a API oficial e respeite os termos e limites.
- Guarde **snapshots semanais** das tendências no seu banco para construir **histórico próprio** (a API mostra só a semana).

### 10.3 Pipeline de análise

```
coleta (jobs) -> normalização -> casamento com catálogo Brás -> métricas -> score -> resumo com IA -> aprovação do dono -> vídeo/feed
```

1. **Coleta** agendada (semanal para tendências; diária para itens acompanhados), com cache e respeito ao limite de requisições.
2. **Casamento** palavra-chave/categoria ↔ SKU da Brás (por categoria, termos e revisão manual). O dono pode ajustar.
3. **Métricas por produto** (as que os dados permitirem): posição em tendências, crescimento semanal, presença nos mais vendidos, quantidade de anúncios concorrentes, faixa de preço praticada, margem estimada = preço de revenda observado − (preço da caixa ÷ unidades) − custo do canal informado pelo membro **[CONFIRMAR premissas de taxa]**.
4. **Score de oportunidade** (0–100) **explicável**: mostre os componentes e pesos. Nunca um número sem justificativa.
5. **Resumo com IA**: gera texto curto, **sempre ancorado nos números coletados**, citando a fonte e a data. A IA **não inventa dado**; se faltar informação, escreve "sem dados suficientes". Todo texto de IA mostra "gerado a partir de dados de DD/MM" e nunca promete lucro.
6. **Revisão do dono** antes de virar vídeo ou aparecer para membros em destaque.

### 10.4 Telas

- **Membro (Meu Brás > Radar):** tendências da semana nas categorias que ele vende, produtos da Brás com score, "vale a pena?" por produto com a conta de margem e o botão **Reservar caixas** com estoque ao vivo.
- **Dono (Estúdio > Analytics):** painel de oportunidades, fila "o que gravar esta semana", histórico, desempenho dos vídeos (visualização → reserva).
- Gráficos seguem a skill `dataviz` (seção 11.6).

### 10.5 Limites e honestidade

- Tendência de busca **não é** previsão de lucro. A interface diz isso em linguagem simples.
- Cada análise mostra **data da coleta** e **fonte**. Sem fonte, não publica.
- Guardar prompts, versão do modelo, dados de entrada e saída de cada análise para auditoria e melhoria.
- Custo de IA: orçamento por mês no painel de plataforma, com alerta, cache de resultados e limite por membro.

### 10.6 Brás Full: atender o Full do Mercado Livre dos clientes (D14)

**Contexto confirmado:** Full é o serviço de fulfillment do Mercado Livre: o vendedor envia o estoque a um centro de distribuição do Mercado Livre, que armazena, separa, embala e despacha. Pela documentação oficial, o estoque Full **não pode ser alterado pelo vendedor via API** (a API de convivência Full/Flex só permite ajustar o estoque do depósito do vendedor), e é possível **consultar** o estoque de fulfillment por `inventories/{id}/stock/fulfillment`. A **remessa de estoque ao centro** depende de fluxo no ambiente do Mercado Livre, que, segundo ferramentas do mercado, aceita envio por planilha com a submissão final feita lá. **[CONFIRMAR com o Mercado Livre]** o que é automatizável por API no envio de estoque (inbound) e no agendamento da entrega.

**O que a Brás Full faz (versão 1 = assistente de preparo e acompanhamento, sem prometer automação que a API não oferece):**

1. **Cadastro do cliente Full:** conecta a conta Mercado Livre dele por OAuth; o sistema lê anúncios, SKUs e **estoque em Full** (somente leitura).
2. **Planejador de remessa:** o cliente escolhe os SKUs e as quantidades; o sistema calcula **quantas caixas Brás** correspondem, **unidades por caixa**, o que sobra, e mostra o custo e a margem estimados. Gera o **plano de preparo**.
3. **Plano de preparo (checklist e documentos):** etiquetagem por unidade (padrão do Mercado Livre), embalagem e volumes, lista de itens, observações de conformidade. Gera os arquivos que o Mercado Livre aceitar (ex.: planilha de envio) **[CONFIRMAR formato vigente]**, para o cliente enviar no ambiente dele.
4. **Esquema de atendimento da Brás:** a Brás Digital oferece como serviço a **preparação** (etiquetar, reembalar, montar volumes) no ponto do Brás. **[CONFIRMAR com o dono]** quem executa, em qual local, preço do serviço e quem se responsabiliza por avaria. Modelar como **serviço opcional** cobrado por unidade preparada, com **ordem de serviço**, fotos de conferência e **laudo de entrada**.
5. **Acompanhamento:** status da remessa (`PLANEJADA -> EM_PREPARO -> PRONTA -> COLETADA -> ENTREGUE_AO_CD -> RECEBIDA`), leitura periódica do estoque em Full para confirmar o recebimento, divergências abertas como ocorrência.
6. **Reposição inteligente:** com o histórico de vendas do membro (que ele autorizar ler) e a tendência do Analytics, sugerir "repor X caixas de Y". Sempre como **sugestão**.
7. **Regras Full do Mercado Livre** (elegibilidade, giro mínimo, tarifas, prazos): **leia a documentação vigente e a mostre ao cliente**; não codifique valores de tarifa no código, mantenha-os como configuração com data de vigência.

**Privacidade:** os dados do cliente Full (vendas, contas) são dele e do dono. **Nunca** aparecem para a importadora.

**Fase:** a Brás Full entra **depois** do núcleo (Fase 3), mas o **modelo de dados e o conector do Mercado Livre** já nascem prontos.

---

## 11. Design e experiência: os três painéis precisam ser impecáveis

### 11.1 Direção

A Brás Digital **não pode parecer** com NextLevel, Commerce ou SuperDrop, nem com um painel genérico de SaaS. Tire as escolhas visuais **do mundo do assunto**: o atacado de caixa fechada do Brás. Vocabulário visual de partida: etiqueta de romaneio, placar de galpão, números grandes de contagem de estoque, fita de embalagem, carimbo de retirada, tabela de preço de balcão, correria do Brás de manhã cedo. Isso é ponto de partida, não receita: escolha, teste, descarte.

**Processo obrigatório de duas passagens** (registre em `docs/design/BD-PLANO-DE-DESIGN.md` **antes** de codar telas):

1. **Plano compacto**: de 4 a 6 cores nomeadas (hex), os tipos e seus papéis, o conceito de layout (frase + wireframe em ASCII para as telas-chave) e os princípios.
2. **Revisão contra o briefing**: se qualquer parte do plano for o que você faria para **qualquer** painel parecido, refaça e anote o que mudou e por quê. Só depois implemente.

**Gaste a ousadia em um lugar só.** Sugestão: o **número de caixas em estoque** (grande, tabular, legível a 3 metros de distância num galpão) é o elemento memorável. O resto fica sereno e disciplinado.

### 11.2 Armadilhas de visual genérico a evitar (a menos que o plano as justifique)

- Fundo creme com serifada de contraste alto e acento cor de barro/terracota.
- Fundo quase preto com um único acento verde-ácido ou vermelhão.
- Estética de jornal (fios finos, cantos retos, colunas densas).
- O "kit SaaS": tudo em cartões idênticos arredondados, mesma sombra cinza suave, gradientes decorativos.
- Cromo de template: rótulo em caixa-alta espaçada acima de todo título, textos com pontos médios (`A · B · C`), "PALAVRA — fragmento", preto tingido (`#0B0B0B`/`#111`) fazendo as vezes de preto, fonte monoespaçada para todo rótulo de dado, seta `→` em todo botão.
- Acentuar uma única palavra de um título (itálico/negrito/cor).
- Marcadores numerados (`01/02/03`) onde o conteúdo não é uma sequência.
- Animação de entrada em toda seção e hover animado em todo cartão.

A **cor de assinatura da marca Brás (laranja)** já foi aprovada no pacote `brand-system-v2/` deste repositório. **Leia o valor oficial lá.** Se o projeto aprovou os neutros compartilhados (navy `#101B34`, off-white `#F4F1E9`), **avalie** se eles servem aqui; este documento permite divergir **somente com justificativa registrada**, porque a Brás Digital deve olhar diferente. O laranja é decisão do dono (a restrição de "terracota" acima é sobre o uso automático, não sobre a cor de marca aprovada).

### 11.3 Sistema visual (tokens)

- **Cor:** neutros frios para trabalho em claro e um modo escuro dedicado ao feed e às lives; laranja de marca para ação principal e foco; **cores de estado com significado fixo e igual nos três painéis**: disponível, últimas caixas, esgotado, aguardando pagamento, pago, retirada agendada, retirado, ocorrência. Nunca só cor: sempre ícone ou texto também.
- **Contraste AA** (4,5:1 texto normal) em claro e escuro, validado por teste automático. Texto pequeno sobre vídeo sempre sobre película/fundo sólido.
- **Tipografia:** uma ou duas famílias claramente distintas, escolhidas **para este projeto** (não as de sempre), com **numerais tabulares** para estoque, preço e quantidade. Escala tipográfica definida, linhas com menos de 80 caracteres no texto corrido. O título pode ser peça ativa do design.
- **Forma:** raio de borda **diferente por hierarquia** (não um só em tudo); elevação com propósito; espaçamento em escala de 4 px.
- **Movimento:** só para mostrar mudança causada pela ação do usuário (reservou, confirmou, esgotou) ou **um** momento orquestrado por tela. Respeitar `prefers-reduced-motion`.
- Núcleo em `src/design-system` próprio da Brás (componentes, tokens, contrato de tema), com **galeria** em `/dev/design` e testes de contraste.

### 11.4 Os três painéis

**Princípios comuns:** carregamento rápido (esqueletos, não spinners soltos), **estados vazios que convidam à ação**, **erros que dizem o que houve e como resolver**, nunca tela em branco, foco de teclado visível, alvos de toque de **44 px**, nada de rolagem lateral em 320 px, desfazer onde for seguro, confirmação explícita em ação financeira ou irreversível.

#### Estúdio (dono, desktop primeiro, com versão celular para gravar e publicar)

- **Hoje:** o que gravar, o que publicar, lives de hoje, aprovações pendentes, alertas de estoque e de pagamentos, em uma tela só.
- **Produção:** quadro dos vídeos por estado, agenda semanal, ficha de gravação, envio pelo celular.
- **Sala de live:** layout de **controle de transmissão** (preview, ofertas, pedidos entrando, estoque dos lotes, chat) pensado para operar **sem olhar o teclado**.
- **Membros (CRM):** lista com busca e segmentos, perfil com histórico de reservas, interesse por categoria, origem, notas privadas, próxima ação, valor vitalício, **fila de aprovação** de CNPJ.
- **Importadoras:** cadastro, comissão com vigência, saúde da integração, ocorrências.
- **Financeiro:** comissões por pedido, cobranças de dinheiro em aberto, extrato exportável.
- **Atalhos de teclado** e **paleta de comandos** (buscar membro, produto, reserva). Tabelas densas com filtros salvos.
- **Modo celular** do dono: publicar vídeo, ver aprovação, aprovar membro, ver vendas da live.

#### Balcão (importadora, **escopo mínimo**, D9)

Telas **somente**: `Reservas` (a pagar, pagas, a retirar, retiradas), `Estoque` (saldo por SKU, atualizar por planilha/manual, ver conexão Bling quando existir), `Retirada` (agenda, leitura do QR, lista de picking, confirmação, ocorrência), `Extrato` (recebimentos, comissão da plataforma **dela**), `Conta` (dados, pontos de retirada, conectar Mercado Pago/Bling).

- **Nada** de CRM, conteúdo, audiência, analytics, lista de membros.
- Tela de **expedição otimizada para celular e tablet no galpão**: botões enormes, leitura de QR, funciona com conexão ruim, confirma em dois toques.
- Atualização de estoque **muito simples**: planilha modelo, edição rápida por linha, histórico do que mudou e quem mudou.
- A importadora tem seu **perfil operacional** (ADMIN, OPERADOR, EXPEDICAO) com visões diferentes.

#### Meu Brás (membro, **celular primeiro**)

- **Feed** em tela cheia com barra de compra e estoque ao vivo.
- **Lives** (entrada, ofertas, reserva em poucos toques).
- **Radar** (Analytics): tendências, "vale a pena?", conta de margem.
- **Carrinho e reservas:** Pix com QR e copia-e-cola, status em tempo real, agendar retirada, dados da transportadora, código de retirada.
- **Full:** conectar conta, planejar remessa, acompanhar.
- **Conta:** dados do CNPJ, usuários, notificações, conexões.
- Reserva em **no máximo 3 toques** a partir do vídeo (Reservar → quantidade em caixas → Pagar com Pix).

### 11.5 Texto da interface (vocabulário e tom)

Fonte única de textos em `src/textos`. Regras:

- Escreva **para quem usa**, em palavras simples: "caixas disponíveis", "pedido mínimo", "reservar", "retirar no Brás". Evite jargão de sistema ("sincronizar webhook").
- **Verbo na voz ativa** nos botões: "Reservar 3 caixas", "Pagar com Pix", "Confirmar retirada". A ação mantém o mesmo nome em todo o fluxo (o botão "Publicar" gera o aviso "Publicado").
- **Caixa de sentença**, sem texto todo em maiúsculas.
- **Erro:** diz o que houve e como resolver, sem pedir desculpa e sem vagueza. Ex.: "Só restam 2 caixas deste produto. Reduza a quantidade ou escolha outro."
- **Vazio:** convida à ação. Ex.: "Você ainda não tem reservas. Veja o feed e reserve sua primeira caixa."
- Vocabulário fixo (glossário em `docs/design/GLOSSARIO.md`): **caixa**, **reserva**, **retirada**, **importadora**, **membro**, **oferta**, **live**, **estoque**. Não alterne entre "pedido" e "reserva", nem entre "fornecedor" e "importadora".
- Textos jurídicos e de preço nunca prometem lucro, prazo ou disponibilidade que o sistema não garanta.

### 11.6 Gráficos e dados

Todo gráfico (Estúdio e Radar) segue boas práticas de visualização: forma adequada ao dado, **paleta acessível a daltonismo**, rótulo direto em vez de legenda quando possível, eixos honestos (barra começa em zero), estados vazio/carregando/erro, mesma lógica de cor no claro e no escuro, tooltip com valor exato, e **sempre uma versão em tabela** para leitor de tela. Sem 3D, sem gradiente decorativo, sem rosca quando barra serve.

### 11.7 Acessibilidade e desempenho (piso de qualidade)

- WCAG 2.2 AA: teclado, foco visível, rótulos, ordem de foco, anúncios para leitor de tela (mudança de estoque, erro de pagamento), legenda nos vídeos.
- Funciona de 320 px a 1440 px+; testado em Android de entrada e em rede 3G rápida.
- Orçamento: primeira tela do feed útil em **< 2,5 s** em 4G; início do vídeo em **< 2 s** depois de visível; interações < 100 ms de resposta percebida; sem salto de layout.
- Instalável como **PWA** (ícone, tela cheia, push), com modo offline limitado e claro ("sem conexão: suas reservas aparecem, reservar novas exige internet").

---

## 12. Qualidade, testes e verificação

**Nenhuma entrega sem teste.** Pirâmide:

1. **Unidade:** domínio de estoque, comissão, estados da reserva, cálculo de margem, regras de caixa/múltiplo/mínimo. Use **testes baseados em propriedades** para dinheiro e estoque (nunca negativo, soma dos movimentos = saldo, comissão ≤ valor).
2. **Integração (banco real, não mock):** reserva atômica, expiração, idempotência, isolamento de tenant, migrações subindo e voltando.
3. **Contrato:** respostas das APIs de terceiros (Mercado Pago, Mercado Livre, Bling) com **gravações/fixtures** e testes de resiliência (429, 5xx, timeout, resposta malformada).
4. **E2E de navegador** (`e2e/*.mjs`, nos tamanhos 360/768/1440): cadastro→aprovação→feed→reserva→Pix→retirada; live com oferta; importadora atualizando estoque e confirmando retirada; dono publicando vídeo.
5. **Segurança (automático e obrigatório):**
   - anônimo **não** recebe preço, estoque nem nome de importadora em nenhuma rota, nem no HTML, nem em cache;
   - membro pendente/suspenso não recebe preço;
   - importadora A não acessa dado da importadora B;
   - respostas da importadora **não contêm** campo de CRM, analytics ou conteúdo (lista de campos permitidos);
   - IDOR em todas as rotas com ID; CSRF; limites de taxa; upload malicioso; webhooks sem assinatura rejeitados.
6. **Carga:** simular live com **centenas de reservas simultâneas** sobre poucas caixas: zero venda duplicada, tempo de resposta dentro do orçamento, fila com posição visível. Teste de falha (provedor de pagamento fora do ar, banco lento).
7. **Acessibilidade:** `axe` automatizado + checagem manual de teclado e leitor de tela nas telas-chave; contraste AA em todos os temas e modos.
8. **Visual:** capturas antes/depois de cada tela-chave nos três tamanhos, guardadas em `docs/capturas/`, e **autocrítica** escrita (o que removeria, o que parece genérico).
9. **Observabilidade:** todo erro inesperado vai ao painel de erros com `requestId`, usuário, origem e código que o cliente pode informar.

**Regra de ouro:** se um teste falha de forma intermitente, trate como **bug** (não repita até passar).

---

## 13. Plano de entrega por fases

Cada fase termina com **demonstração navegável**, **testes verdes**, **relatório** (13.4) e **PR revisável**. Não comece a fase seguinte com pendência crítica na anterior.

### Fase 0: Fundação (antes de qualquer tela de negócio)
- **Relatório de mapeamento** (adendo D) antes de qualquer código; branch `claude/bras-digital`; demonstração local (`bash scripts/restart-demo.sh`) funcionando.
- Papéis e permissões da Brás Digital sobre os existentes (`requireRole`, `assertCanAccess`), 2FA conforme ADR-0003, **auditoria** (`audit_log`) e **testes de isolamento** de importadora e membro.
- **Plano de design** (`docs/design/BD-PLANO-DE-DESIGN.md`) + tokens da marca `BRAS_DIGITAL` sobre os primitivos de `src/design-system` + galeria (`/dev/design`) + testes de contraste.
- Esqueleto dos três painéis, navegação, estados vazio/erro/carregando.
- Segredos com `encryptSecret` e jobs agendados no mecanismo existente (`job_runs`).
- **Prova de conceito de vídeo/live** comparando provedores (seção 9.4) e **decisão registrada**.

### Fase 1: Núcleo vendável (piloto com **uma** importadora)
- Cadastro de importadora, pontos de retirada, catálogo (SKU, unidades por caixa, preço por caixa, pedido mínimo 1).
- **Estoque manual e por planilha**, com carimbo de frescor, movimentos e conferência.
- Cadastro, validação de CNPJ e **aprovação** de membro; **preço só para aprovado**.
- **Feed básico** (vídeo sob demanda + barra de compra com estoque ao vivo).
- **Reserva atômica**, **Pix** (split 1:1 ou plano B), **dinheiro**, expiração, comissão apurada.
- **Retirada** com código/QR, transportadora e motorista, confirmação no Balcão.
- Notificações essenciais. Estúdio mínimo: aprovar membros, subir vídeo, publicar, ver reservas e comissão.

### Fase 2: Conteúdo em escala, lives e inteligência
- Estúdio completo: pipeline semanal, roteiro assistido, biblioteca, agenda, fila de publicação.
- **Lives** com ofertas por lote, chat, replay, relatório.
- **Analytics v1** (tendências e mais vendidos do Mercado Livre, score explicável, resumo com IA, revisão do dono).
- **Conector Bling** (se viável; senão fica documentado e pronto para plugar), segunda e terceira importadoras.

### Fase 3: Full e profundidade
- **Brás Full** (conexão da conta, planejador, plano de preparo, ordem de serviço, acompanhamento).
- Analytics v2 (histórico próprio, alertas, reposição sugerida).
- Fechamento mensal de comissões, relatórios, exportações, refinamentos de operação.

### 13.4 Modelo do relatório de fase (`docs/relatorios/BD-RELATORIO-FASE-N.md`)

```
# Relatório da Fase N
- Resumo (3 frases)
- O que foi entregue (um item por commit/PR, com o hash)
- O que foi tentado e descartado, e por quê
- Decisões técnicas tomadas (link para o log) e alternativas rejeitadas
- Riscos e dívidas técnicas (com severidade e plano)
- Itens [CONFIRMAR] que bloquearam algo, e o que foi feito no lugar
- Resultado de testes (unidade, integração, e2e, segurança, carga, acessibilidade)
- Capturas das telas-chave (360/768/1440) e autocrítica de design
- Checklist de implantação (migrações, variáveis, ponto de restauração do Neon)
- Próximos passos recomendados
```

### 13.5 Log de decisões

`docs/design/DECISIONS.md`, no formato das decisões existentes (título `## D92 — ... (data)`, contexto, escolha, consequências, testes). A D91 já registra esta frente. Registre **o que foi reutilizado e por quê**; se não reutilizou algo que existia, justifique (regra anti-duplicação).

### 13.6 Onde fica o código (confirmar na Fase 0)

Siga a organização existente: domínio em `src/lib/domain/`, telas em `src/app/`, componentes em `src/components/`, testes em `tests/`, e2e em `e2e/`, migrações em `drizzle/`. Proposta inicial, a validar com a Constituição e o `proxy.ts`: domínio em `src/lib/domain/bras/`; rotas do membro e do feed em `src/app/bras/`; Balcão da importadora em uma área própria; Estúdio conforme a decisão do item A.5 do adendo. Documentos em `docs/prompts/` e `docs/relatorios/`.

### 13.7 Variáveis de ambiente (nomes, sem valores)

`DATABASE_URL`, `APP_URL`, `SESSION_SECRET`, `CRED_ENCRYPTION_KEY`, `MP_APP_ID`, `MP_APP_SECRET`, `MP_WEBHOOK_SECRET`, `ML_APP_ID`, `ML_APP_SECRET`, `BLING_CLIENT_ID`, `BLING_CLIENT_SECRET`, `VIDEO_PROVIDER_KEYS`, `STORAGE_*`, `EMAIL_*`, `PUSH_VAPID_*`, `IA_API_KEY`, `IA_MONTHLY_BUDGET`. **Valores reais nunca entram no repositório**: o dono os configura no Render.

---

## 14. Definição de pronto e critérios de aceite

Uma entrega só está **pronta** quando **todos** os itens abaixo valem:

- [ ] Funciona de ponta a ponta na demonstração, com dados de teste realistas.
- [ ] Testes novos e antigos passam; build e tipagem passam; sem aviso novo de lint.
- [ ] Testes de segurança da seção 12 passam para o que foi tocado.
- [ ] Anônimo e membro não aprovado **não** veem preço em nenhum caminho.
- [ ] Importadora **não** vê nada da seção 6.1 (teste automático de vazamento de campo).
- [ ] Estoque nunca negativo e sem venda duplicada sob carga.
- [ ] Estados vazio, carregando, erro e esgotado implementados e revisados.
- [ ] AA de contraste e teclado verificados; sem rolagem lateral em 320 px.
- [ ] Textos seguem o glossário e o tom (seção 11.5).
- [ ] Auditoria registra a ação; erros inesperados aparecem no painel de erros.
- [ ] Migrações aditivas, reversíveis, documentadas; ponto de restauração anotado.
- [ ] Nenhum segredo no repositório, nos logs ou nas capturas.
- [ ] Documentação e relatório atualizados; autocrítica de design escrita.

**Critérios de aceite do produto (Fase 1):**
1. Um membro aprovado vê no celular um vídeo, as caixas disponíveis e o pedido mínimo e **reserva e paga com Pix em até 3 toques** a partir do vídeo.
2. A importadora recebe o dinheiro **na própria conta** e vê a reserva paga no Balcão em menos de **[CONFIRMAR: 10]** segundos.
3. A comissão acordada é apurada corretamente em 100% dos casos de teste (Pix e dinheiro).
4. A retirada com QR confirma em dois toques e baixa o estoque.
5. Duas pessoas disputando a última caixa: **uma** reserva, a outra recebe mensagem clara.
6. Um visitante sem login não obtém **nenhuma informação comercial**.

---

## 15. Decisões em aberto (perguntas ao dono)

Não trave o trabalho por estas. Siga o padrão indicado e registre no relatório.

1. **Importadora piloto:** qual é, ela usa **Bling com API liberada**? (plano e escopos a confirmar).
2. **Pix com split:** o Mercado Pago aceita Pix dentro do Split 1:1 para a conta do dono? Taxas? Se não, aprovar o **plano B** (Pix direto na conta da importadora + comissão cobrada em fechamento).
3. **Base da comissão** (valor dos produtos, com/sem taxa de pagamento) e **periodicidade da cobrança** das vendas em dinheiro.
4. **Dinheiro:** prazo máximo de reserva, limite por membro novo, política de falta na retirada.
5. **Nota fiscal:** confirmar que a importadora emite no sistema dela e a plataforma só anexa o número/arquivo.
6. **CNPJ do comprador visível à importadora?** (padrão: só nome fantasia e código do pedido).
7. **Cancelamento e ocorrência na retirada:** prazos, estorno parcial, quem arca.
8. **Brás Full:** quem executa a preparação, onde, preço, responsabilidade por avaria e quais documentos o Mercado Livre exige hoje.
9. **Provedor de vídeo/live** e **orçamento mensal** de vídeo e de IA.
10. **Validação de CNPJ:** qual provedor/consulta usar.
11. **Mensagens por WhatsApp:** usar provedor oficial?
12. **Domínio** e **cor/identidade finais** (valor oficial do laranja em `brand-system-v2/`).
13. **Textos jurídicos** (termos, privacidade): precisam de revisão por advogado antes de publicar.
14. **Limiares:** "últimas caixas" (padrão 10), frescor do estoque (padrão 30 min), expiração do Pix (padrão 15 min).

---

## 16. Primeiras ações do Codex (sequência)

1. Executar o protocolo da seção 0.1 e ler os documentos da seção 0.3.
2. Escrever o **relatório de mapeamento** (adendo D) e propor a estrutura da seção 13.6.
3. Escrever `docs/design/BD-PLANO-DE-DESIGN.md` (duas passagens) e `docs/privacidade/bd-mapeamento.md`.
4. Implementar a **Fase 0** completa, com testes de isolamento de tenant e de preço anônimo **antes** de qualquer tela de negócio.
5. Gerar `docs/relatorios/BD-RELATORIO-FASE-0.md` e **parar** para revisão do dono (sem PR, sem publicar).

> Qualidade acima do comum não é enfeite: é estoque certo, dinheiro certo, segredo protegido e telas que o dono, a importadora e o cliente usam sem pensar. Na dúvida, escolha o caminho mais seguro e mais simples, e registre.
