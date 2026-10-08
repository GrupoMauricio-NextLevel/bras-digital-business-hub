# Brás Digital — Fase 0: relatório de mapeamento

**Branch analisada:** `claude/bras-digital`  
**Data:** 07/10/2026  
**Escopo desta entrega:** levantamento; nenhum código de produto, migração, decisão D92, PR ou publicação.

## Regra aplicada

O adendo de `docs/prompts/bras-digital-plataforma.md` prevaleceu. A Brás Digital é um produto independente dentro do motor único: mesmo repositório, deploy e banco; rotas, permissões, textos e visual próprios. Não se deve criar catálogo, banco ou serviço paralelos.

## Limite da evidência

A análise foi feita na branch remota designada. Onde o comportamento, contrato ou dado operacional não pôde ser demonstrado nesta leitura, o item está marcado como **[CONFIRMAR]**; não é uma suposição de implementação.

## Mapa do adendo B

| Conceito | Confirmado no repositório / fonte | Reaproveitar | Criar ou estender | Perguntas e bloqueios |
|---|---|---|---|---|
| Dono / Estúdio | Há papel `NEXTLEVEL_MASTER` e painel `src/app/master`, conforme o mapa do adendo. | O Master único, autorização existente e filtro de marca. | Módulo de Estúdio, sem criar outro Master. | **[CONFIRMAR]** O Estúdio será módulo `BRAS_DIGITAL` dentro de `/master` ou área própria visível ao Master? Esta é decisão de Fase 0. |
| Importadora / Balcão | Existem `suppliers` e os papéis `SUPPLIER_ADMIN` e `SUPPLIER_DISPATCH`, hoje associados ao SuperDrop. | Entidade de fornecedor, proteção de tenant e autorização de servidor. | Interface Balcão própria, com escopo mínimo. | **[CONFIRMAR]** Papéis atuais ganham contexto de marca ou haverá papéis Brás próprios? Não criar papel/tabela antes dessa decisão. |
| Membro comprador com CNPJ | `organizations`, `users` e `STORE_OWNER` existem; `customers` é consumidor final de loja, não membro B2B. | Identidade, organizações e controles de acesso. | Provável extensão B2B de organização; se faltar estado de aprovação/CNPJ, tabela nova com prefixo `bd_`. | **[CONFIRMAR]** Qual é o modelo de aprovação, validação de CNPJ e relação entre usuários e uma organização membro? |
| Caixa / SKU | O modelo possui `products`, `product_variants` e `product_packs`; `totalQuantity` é a base indicada para pack. | Catálogo, SKU e pack. | Pedido mínimo e múltiplo por caixa, sem catálogo paralelo. | **[CONFIRMAR]** A unidade de venda, o preço e a disponibilidade por caixa devem ser persistidos no pack ou em extensão Brás? |
| Estoque em caixas | O mapa aponta `inventory` em unidades e movimentos `IN`, `RESERVE`, `RELEASE`, `SALE`, `ADJUSTMENT`; há domínio de inventário. | Movimentos e reserva atômica do domínio existente. | Derivação de caixas disponíveis a partir de unidades/pack; extensão da reserva. | **[CONFIRMAR]** A execução produtiva usará Postgres para concorrência real. Não assumir PGlite como solução de disputa pela última caixa. |
| Reserva e pedido | Existem `orders`, `order_items`, `order_events` e `saleType: WHOLESALE`. | Ciclo de pedido, eventos e auditoria de estado. | Semântica de “reserva paga” e retirada como modalidade de entrega. | **[CONFIRMAR]** Máquina de estados, expiração de Pix/dinheiro, cancelamento e ocorrências de retirada. |
| Pagamento direto à importadora | Há credencial por loja (`mpAccessTokenEnc`), identificador de pagamento e prática de conferir pagamento na API; idempotência por `dedupeKey` é regra do projeto. | Criptografia de segredo, confirmação na API e idempotência. | Contrato `PaymentProvider`; conexão da conta da importadora. | **[CONFIRMAR]** Pix é suportado no Split 1:1 do Mercado Pago, com `application_fee`, taxas e responsabilidades adequadas? Sem confirmação, não modelar o fluxo definitivo. |
| Comissão do dono | Existem `partner_commissions`, finanças e pagamentos NextLevel. | Avaliação do razão/lançamentos existentes antes de nova tabela. | Apenas o que não for representável sem corromper a semântica de parceiros. | **[CONFIRMAR]** Base da comissão, vigência, responsabilidade no dinheiro e periodicidade de cobrança. |
| Conteúdo, feed e lives | Existem `content_items` e `store_assets`; o adendo pede verificar `domain_events`. | Mídia e os contratos de eventos já existentes, se forem adequados. | `VideoProvider` e os conceitos de feed/live que faltarem, isolados do provedor. | **[CONFIRMAR]** O que cada estrutura atual guarda e qual provedor/orçamento de vídeo e live serão adotados. |
| Auditoria | Existem `audit_log` e `src/lib/domain/audit.ts`. | Auditoria existente em toda ação relevante. | Nada antes de demonstrar uma lacuna concreta. | Nenhuma pergunta de produto nesta linha; validar eventos mínimos por fluxo. |
| Jobs e erros | Existem `job_runs`, `error_events` e uso de `CRON_SECRET`. | Mecanismo existente, com jobs idempotentes. | Apenas novos nomes de jobs e observabilidade específica. | **[CONFIRMAR]** A pendência operacional do `CRON_SECRET` está resolvida antes de depender de expiração/sincronização. |
| Importação de planilha | O projeto já usa ExcelJS no SuperDrop; o adendo exige manter a correção de prefixo de namespace. | Pipeline de importação, validação e histórico já existentes. | Adaptador de estoque em caixas. | **[CONFIRMAR]** Layout da planilha, importadora piloto e regra de tratamento de divergências. |
| Regras configuráveis | Existe `platform_settings`. | Configuração central. | Chaves específicas para comissão, expiração, mínimo, limiar de últimas caixas e frescor. | **[CONFIRMAR]** Valores iniciais e quem pode alterá-los; não fixar defaults de negócio no código. |

## Elementos de marca e infraestrutura já estabelecidos

- A marca `BRAS_DIGITAL` já existe e deve continuar sendo resolvida por `getBrand()`, nunca por texto fixo em componente.
- A paleta de referência é `#B34D00` no claro e `#FB8342` no escuro, com a escala em `brand-system-v2/tokens.css`.
- O domínio configurado é `bras.superdrop.com.br`; não há autorização para mexer em Render, Neon, DNS ou domínio.
- A D91 tornou a Brás Digital prioritária; qualquer decisão nova começa em D92, mas este relatório não toma essa decisão.

## Proposta inicial de organização — não implementada

- Domínio específico: `src/lib/domain/bras/`.
- Rotas e experiências próprias sob área Brás, sem condicional por empresa em componentes compartilhados.
- Tabelas realmente novas: prefixo `bd_`.
- Estúdio: pendente da decisão de localização dentro do Master.
- Balcão e Meu Brás: áreas próprias, preservando as fronteiras de dados e permissões já existentes.

## Itens [CONFIRMAR] que impedem decisões irreversíveis

1. Estúdio dentro do Master ou área própria.
2. Reuso ou novos papéis de importadora com contexto de marca.
3. Modelo de membro B2B, validação de CNPJ e aprovação.
4. Pix no Split 1:1 do Mercado Pago, taxas e plano B.
5. Regras de comissão, dinheiro, expiração, cancelamento e retirada.
6. Postgres para concorrência produtiva de estoque.
7. Provedor/orçamento de vídeo e lives.
8. Importadora piloto, Bling e formato da planilha.
9. Estado operacional de `CRON_SECRET`.
10. Valores configuráveis iniciais e responsável por mudá-los.

## Próximo passo

Aguardar revisão do dono. Não iniciar Fase 0, não criar D92, não criar migração, não publicar e não fazer push em `claude/wonderful-cannon-5o38v5`.
