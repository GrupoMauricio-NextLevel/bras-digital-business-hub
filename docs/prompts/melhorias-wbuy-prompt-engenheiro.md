# Prompt engenheiro mestre: melhorias da NextLevel Commerce (referência wBuy), ondas W0 a W6

> **Estado:** aprovado pelo dono em 2026-10-27 ("aceito as recomendações"), decisão **D182**.
> **Base:**
> - racional e matriz: `docs/prompts/racional-wbuy-ecommerce-superdrop.md`;
> - notas das capturas: `docs/referencias/wbuy-painel-notas.md`.
>
> **Como usar:** cole o bloco da Parte 2 numa sessão de trabalho e diga a onda ("faça a W0"). Uma onda por sessão, publicada e conferida antes da próxima.
>
> Os caminhos, tabelas e funções citados foram conferidos no código em 2026-10-27 (migração mais recente: `0068`).

---

## Parte 1. Decisões do dono já tomadas (D182): use como padrão, sem perguntar de novo

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Ordem | W0 → W1 → W2 → W3 → W4 → W5; a W6 uma peça por vez, na ordem: duas etapas para o lojista, balcão, API e webhooks, afiliados por loja, assistente |
| 2 | Link de pagamento sem Mercado Pago conectado | Mostrar o passo "conectar o Mercado Pago" no lugar do link (nunca gerar link que não cobra) |
| 3 | Carrinho abandonado | Só e-mail (Resend) na primeira versão; WhatsApp quando houver API oficial |
| 4 | Pix direto e receber na entrega | Sim, como módulo, com o aviso "baixa manual, sob sua responsabilidade"; nunca contam como pagamento conferido |
| 5 | Calculadoras públicas | Preço e margem; frete grátis |
| 6 | Balcão | Tela de caixa com leitor de código de barras do tipo teclado (ele digita o código e aperta Enter); sem impressora térmica na v1 |
| 7 | Duas etapas | Obrigatória para o Master já na W0; opcional para o lojista na W6 |

---

## Parte 2. Prompt (cole a partir daqui)

````text
PAPEL
Você é o engenheiro responsável pelas melhorias da NextLevel Commerce aprovadas em D182.
Trabalhe UMA onda por vez (o dono diz qual; sem dizer, é a próxima não feita da tabela
"Estado das ondas" em docs/prompts/README.md).

LEIA ANTES (nesta ordem)
1. CLAUDE.md e AGENTS.md (pilha, comandos, branch de publicação, regras).
2. docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md (autoridade máxima).
3. docs/prompts/racional-wbuy-ecommerce-superdrop.md (matriz e ondas) e este arquivo.
4. docs/design/DECISIONS.md: D89 (loja sem fornecedor), D90 (taxa), D145 (desligados),
   D163 (marca E-commerce), D170 (análise), D178 (cartão), D180 (pós-venda), D182.
Skills: painel-interno (toda tela autenticada), nova-migracao (todo schema), qa-visual,
desempenho, e2e-demo, publicar.

REGRAS QUE NÃO QUEBRAM
- Nunca copie texto, marca, imagem ou código da wBuy.
- Anti-duplicação: estenda antes de criar. Mapa obrigatório:
    link de pagamento   -> proposals (src/lib/domain/proposals.ts, /merchant/orders/propostas)
    taxa transparente   -> platformFeeFor (src/lib/domain/commerce-plans.ts)
    trocar plano        -> choosePlan / subscriptionOf (commerce-plans.ts)
    módulos             -> entitlements (src/lib/domain/entitlements.ts)
    compre junto        -> motor de descontos (src/lib/domain/discounts.ts) / coupons
    afiliado da loja    -> partners (novo kind), nunca tabela nova de afiliados
    grupo de clientes   -> módulo atacado (/merchant/atacado, price-tiers.ts)
    balcão              -> orders com channel novo "BALCAO" (createOrder)
    gaveta do pedido    -> src/components/shared/order-quick-view.tsx
    transições          -> canTransition / NEXT_ACTION (src/lib/domain/order-status.ts)
- Domínio em src/lib/domain/*, ações por runAction, permissões no servidor (requireRole,
  assertCanAccess), um tenant nunca lê outro. storeRole STAFF não vê finanças nem configurações.
- Centavos (inteiros), formatBRL, datas ISO, textos em português claro, sem promessa de ganho.
- Segredos (token do Pixel, chave Pix, segredo TOTP, chave de API) só com encryptSecret;
  nunca em tela, log, e-mail ou resposta de ação.
- Pagamento só vale conferido na API do Mercado Pago; corpo de webhook nunca é confiável;
  idempotência por dedupeKey. Baixa manual é outro estado, nunca "PAID por MP".
- SuperDrop em produção: o que tocar pedido, taxa ou painel de loja de rede (store.networkId)
  tem teste provando que o comportamento atual se mantém. Loja de rede NÃO ganha seletor de
  situação na linha (quem avança é a Central). Use isIndependentStore / etiquetaAntes (D180).
- Conta simples da E-commerce não mostra conceitos do SuperDrop (R1). Módulo desligado não
  aparece no menu.
- Página com banco: export const dynamic = "force-dynamic". Sem consulta dentro de laço.
  Sem rolagem horizontal em 360 px; axe sem violação grave; foco visível; teclado.
- Schema: colunas novas anuláveis ou com default; npx drizzle-kit generate --name <assunto>;
  nunca editar migração publicada; provar a migração sobre um banco antigo (skill nova-migracao).
- Comportamento novo sem teste não entra. Decisão nova em DECISIONS.md com etiqueta da frente
  ("[E-commerce]", "[SuperDrop]"), numerada a partir da próxima livre de CLAUDE.md.

==========================================================================================
W0 — CONFIANÇA (taxa transparente, meu plano, segurança visível, novidades)
==========================================================================================
Banco (uma migração "w0_confianca"):
  users.sessionVersion   integer not null default 0
  users.lastLoginIp      text null           -- só o IP, sem geolocalização
  users.totpSecret       text null           -- encryptSecret; só o Master na W0
  users.totpEnabledAt    timestamp null
  nl_subscriptions.billingDay  integer null  -- 5 | 10 | 15 | 20; null = dia da assinatura

Domínio:
  src/lib/domain/taxa-transparente.ts
    export async function taxaDoMes(db, actor, agora = new Date()): Promise<{
      competencia: string; fechaEm: string; bps: number;
      baseCents: number; taxaCents: number; pedidos: number; carenciaAte: string | null;
      entra: string[]; naoEntra: string[]; historico: { competencia: string; taxaCents: number }[]
    }>
    - Chama platformFeeFor com a MESMA janela do fechamento mensal (não reimplemente a soma).
    - "entra" e "naoEntra" descrevem exatamente a regra atual de platformFeeFor
      (hoje: subtotal dos pedidos pagos e não cancelados; frete fora). Se a regra mudar,
      a lista muda junto (constante exportada ao lado da função, com teste).
    - Só o dono da loja (storeRole OWNER) e o Master.
  commerce-plans.ts
    export async function economiaAnual(db, productKey): Promise<{ mensalx12Cents, anualCents, economiaCents }>
      -- preços vindos do catálogo Master (listCatalog), nunca fixos.
    export async function escolherDiaDeVencimento(db, actor, dia: 5|10|15|20)
      -- vale a partir da PRÓXIMA fatura; auditoria em recordFinancialAudit.
  src/lib/auth.ts + actions/auth.ts
    - signSession inclui sv = user.sessionVersion; getSession rejeita sv diferente.
    - export async function sairDosOutrosAparelhos(db, actor): incrementa sessionVersion e
      regrava o cookie atual com o novo sv (a sessão atual continua).
    - loginAction grava lastLoginAt (já existe) e lastLoginIp.
    - Master com totpEnabledAt: depois da senha, pede o código de 6 dígitos (TOTP RFC 6238,
      janela ±1 passo, sem biblioteca nova se der para fazer com node:crypto). Ativação em
      /master/settings: QR + confirmação com um código. Códigos de recuperação: 8, mostrados
      uma vez, guardados com hash. Limite de tentativas com allowLoginAttempt.
    - MASTER sem 2FA: faixa fixa no Master "Ative a verificação em duas etapas" até ativar.
      (Obrigatório de verdade = não entra sem; ligar a obrigatoriedade por variável
      MASTER_2FA_OBRIGATORIO=1 depois que o dono ativar, para não trancar ninguém para fora.)
  src/lib/domain/novidades.ts
    export const NOVIDADES: { data: string; marca: BrandCode | "TODAS"; titulo: string; texto: string }[]
    -- escrito à mão, sem jargão; função novidadesDa(marca, limite).

Telas:
  /merchant/finance        bloco "Sua taxa" (competência, base, % do plano, taxa até agora,
                           fecha em, entra/não entra, histórico de 6 meses) e bloco
                           "Meu plano" (plano atual, economia do anual em reais, trocar de
                           plano com confirmação via choosePlan, dia de vencimento).
  /merchant/team           último acesso e IP por pessoa (IP só para OWNER e Master),
                           aviso "um usuário por pessoa, nunca compartilhe a senha",
                           botão "Sair de todos os outros aparelhos" (também no menu do usuário).
  /merchant (primeira tela) link discreto "O que mudou" -> /merchant/novidades.
  SuperDrop: "Sua taxa" aparece para loja de rede SÓ se ela tiver nl_subscription com
  platformFeeBps > 0; senão o bloco não aparece (teste).

Testes (tests/w0-confianca.test.ts):
  - taxaDoMes devolve o mesmo taxaCents que platformFeeFor na janela do fechamento.
  - STAFF não acessa taxaDoMes; outra loja não acessa.
  - economiaAnual usa o catálogo (mudar preço no catálogo muda a economia).
  - sessão com sv antigo é recusada depois de sairDosOutrosAparelhos; a atual segue válida.
  - TOTP: código certo passa, errado falha, código de recuperação usa uma vez só.
  - segredo TOTP nunca aparece em resposta de ação (procure o valor na saída).
e2e: e2e/w0-confianca.mjs (lojista vê "Sua taxa", troca dia de vencimento, sai dos outros
aparelhos; Master ativa 2FA e entra com código).

==========================================================================================
W1 — PEDIDO NA MESA
==========================================================================================
Banco ("w1_pedido_na_mesa"):
  orders.starred        boolean not null default false
  orders.printedAt      timestamp null
  orders.fraudFlag      text null              -- motivo; não nulo segura o envio
  orders.expectedDeliveryAt timestamp null      -- calculado ao confirmar pagamento
Domínio (src/lib/domain/orders.ts e um novo pedido-mesa.ts):
  contarPorSituacao(db, actor): Record<OrderStatus, number>   -- UMA consulta com group by
  mudarSituacaoNaLinha(db, actor, orderId, para)  -- só se canTransition e só loja
      independente; loja de rede -> DomainError("NOT_ALLOWED"). Reaproveita advanceOrder.
  marcarEstrela / marcarImpresso / sinalizarFraude(motivo) / retirarFraude
  previsaoDeEntrega(pagoEm, shippingDays, diasDeProducao=0): Date  -- dias úteis, pura, testada
      gravada em markCustomerPaidBySystem e confirmCustomerPayment.
  ajustarEnderecoDoPedido(db, actor, orderId, endereço) -- só antes de SHIPPED; evento em
      order_events com antes/depois.
  marcarEnviado recusa com fraudFlag ativo.
Link de pagamento = proposals:
  - Ligar /merchant/orders/propostas para a E-commerce com o nome "Link de pagamento".
  - Botão "Copiar link" e "Enviar no WhatsApp" (wa.me com texto pronto).
  - Sem Mercado Pago conectado: mostrar o passo de conectar (decisão 2), nunca o link.
  - O pagamento volta pelo mesmo caminho do checkout (conferido na API).
Telas:
  orders-table: abas com contador; estrela; ícone "impresso"; seletor de situação na linha
  (só opções de NEXT_ACTION/canTransition; só loja independente); escolher colunas
  (preferência em localStorage com try/catch, nada no banco).
  order-quick-view: ações Enviar (EnvioDialog), Imprimir (marca impresso), Cancelar,
  Sinalizar fraude, Ajustar endereço; previsão de entrega.
  Página do pedido do cliente e rastreio: "previsão de entrega: até dd/mm".
Testes: transições permitidas e proibidas; loja de rede recusa a mudança na linha; contador
bate com a lista; previsão em fim de semana e feriado nacional fixo; fraude segura o envio;
endereço não muda depois de enviado.
e2e: e2e/w1-pedido-na-mesa.mjs + checagem de que /merchant/orders do lojista SuperDrop
(dono@arena10.demo) não mostra o seletor.

==========================================================================================
W2 — MEDIR A LOJA
==========================================================================================
Banco ("w2_visitas"):
  store_visits_daily(storeId, day date, productId null, source text, device text,
                     views int, PRIMARY KEY (storeId, day, productId, source, device))
  orders.device text null; orders.utmSource text null; orders.utmMedium text null;
  orders.utmCampaign text null
Coleta:
  - Em /store/[slug] e /store/[slug]/product/*: beacon (navigator.sendBeacon) para
    /api/v/[slug] depois da página carregada; nunca no caminho do servidor da página.
  - Sem cookie, sem IP gravado, sem dado pessoal. Robôs fora (user-agent) e prévias do
    editor fora. Upsert com incremento (uma linha por chave por dia).
  - "Visitantes únicos" NÃO entra (exigiria identificar a pessoa); mostre "visitas".
  - UTM e aparelho: lidos no checkout (query + user-agent) e gravados no pedido.
Domínio (analytics.ts, funções puras + uma consulta por bloco):
  visitasPorDia, maisVisitados, conversao = pedidosPagos / visitas (null se visitas = 0),
  vendasPorOrigem (utmSource), vendasPorAparelho.
Telas: /merchant/analytics ganha visitas, conversão e mais visitados; o pulso da primeira
tela ganha "visitas hoje"; exportar CSV de pedidos e de produtos (mesmo padrão de
/api/finance/export, com requireRole e só a loja do ator).
Desempenho: medir TTFB e LCP da loja antes/depois (skill desempenho) e anotar em D-nova.
Testes: robô não conta; editor não conta; conversão com zero visitas; CSV de outra loja = 403.

==========================================================================================
W3 — RECUPERAR E VENDER MAIS
==========================================================================================
Banco ("w3_vender_mais"):
  abandoned_carts(id, storeId, email, items jsonb, consent boolean, token, createdAt,
                  remindedAt1 null, remindedAt2 null, recoveredOrderId null, optedOutAt null)
  products.relatedIds jsonb default []; products.madeToOrder boolean default false;
  products.productionDays integer default 0; products.personalization jsonb null
     -- { rotulo, maxChars, precoCents }
  order_items.personalization text null
  stores.giftWrapCents integer null; orders.giftWrapCents integer default 0
Carrinho abandonado:
  - Checkout captura e-mail no 1º passo com consentimento explícito (caixa marcada pelo
    cliente, texto claro). Sem consentimento, nada é guardado.
  - Rotina (registrar em job-runs): 1 h e 24 h; dedupeKey "carrinho:{id}:{1|2}";
    para ao virar pedido, ao descadastrar ou depois do 2º e-mail. Link /store/[slug]/cart?r=token
    recompõe o carrinho com preço ATUAL (nunca o preço guardado).
  - Painel: quantos e-mails, quantos voltaram, valor recuperado (pedidos pagos).
Relacionados e compre junto: escolher até 4 relacionados no produto; seção no tema já existe
(sections.ts) passa a ler relatedIds; "compre junto" = desconto automático do motor de
descontos quando os dois itens estão no carrinho.
Encomenda: madeToOrder permite vender sem estoque; productionDays soma na previsão (W1).
Personalização: campo no produto; valida maxChars no servidor; preço adicional entra no
subtotal; aparece no pedido, na gaveta e na impressão.
Presente: opção no checkout se a loja definiu o preço.
Testes: consentimento obrigatório; e-mail não sai duas vezes; carrinho recomposto com preço
atual; personalização acima do limite recusada; encomenda sem estoque vende só com a chave.

==========================================================================================
W4 — MIGRAR SEM MEDO
==========================================================================================
Banco ("w4_migrar"):
  store_redirects(storeId, fromPath, toPath, hits int default 0, PRIMARY KEY(storeId, fromPath))
  stores.metaPixelId text null; stores.metaCapiToken text null (encryptSecret)
  stores.launchMode text null  -- null | "MAINTENANCE" | "LAUNCH"
  store_waitlist(storeId, email, consent, createdAt)
301: importar CSV de-para (limite 5.000 linhas), só caminhos relativos, sem loop (A->B->A),
  aplicar no src/proxy.ts DEPOIS de resolver a loja (consulta em cache por loja, 60 s).
feed.xml: /store/[slug]/feed.xml (produtos ativos, preço em reais, disponibilidade,
  imagem, link canônico); cache curto; export const dynamic = "force-dynamic".
Pixel e API de conversões: eventos PageView, ViewContent, AddToCart, Purchase (este só
  depois do pagamento conferido, com event_id = id do pedido para não duplicar). Token
  nunca no navegador.
Manutenção ou lançamento: dono e Master veem a loja normal; o público vê a página de espera
  com lista de e-mails (consentimento).
Testes: loop recusado; caminho externo recusado; feed sem produto inativo; Purchase só
  com pedido pago; token não aparece em HTML.

==========================================================================================
W5 — VITRINE DE MÓDULOS E FERRAMENTAS
==========================================================================================
Catálogo: src/lib/domain/modulos.ts
  export const MODULOS: { key, nome, categoria, descricao, planoMinimo: CommercePlanKey|null,
    rota?: string, desligadoGlobal?: boolean }[]
  Estados por loja vindos de activeEntitlementKeys + plano atual:
    "ligado" | "desligado" | "fora-do-plano" (mostra o plano que libera).
  Ligar e desligar: grantEntitlement/revokeEntitlement com source "PLAN" + auditoria.
  Os módulos das ondas anteriores (carrinho abandonado, Pixel, 301, feed, presente,
  personalização) passam a respeitar requireEntitlement.
  Migração de dados: lojas que já usam um módulo recebem o entitlement (sem quebrar ninguém).
Novos módulos de pagamento (decisão 4): "Pix direto" (chave criptografada, QR estático,
  pedido fica "aguardando baixa manual") e "Receber na entrega ou retirada". Novo
  paymentProvider "MANUAL_LOJA" ou reaproveitar "MANUAL" com evento; nunca PAID sem a baixa
  do lojista; a baixa grava quem e quando.
Ferramentas: src/lib/ferramentas/*.ts (funções puras): precoComMargem, simularPromocao,
  parcelamentoSemJuros, freteGratisAPartirDe, pontoDeEquilibrio. Telas /merchant/ferramentas
  e públicas /ferramentas/preco e /ferramentas/frete-gratis (marca do endereço, getBrand()).
  Texto: "calcula com os números que você digitou"; sem promessa.
Calendário comercial: datas do varejo em platform_settings (editável no Master), faixa
  fechável no painel ligada a uma oferta do catálogo Master (ex.: diagnóstico).
Testes: estados do módulo por plano; módulo fora do plano não executa; ferramentas com
  casos de borda (margem 0, desconto 100%, taxa > preço).

==========================================================================================
W6 — GRANDES PEÇAS (uma por vez, nesta ordem)
==========================================================================================
W6a Duas etapas para o lojista: a mesma da W0, opcional, com código de recuperação.
W6b Balcão: /merchant/balcao em tela cheia; busca e código de barras (campo sempre focado,
    Enter adiciona), atalhos (F2 busca, F4 cliente, F8 pagamento, F12 finalizar, sem
    conflitar com o navegador), cliente rápido; gera pedido channel "BALCAO" pago na hora
    (dinheiro, cartão na maquininha ou Pix = baixa manual registrada); baixa estoque.
    Estender o enum de channel e o rótulo em orders.ts; análise por canal já pega.
W6c API e webhooks de saída: chave por loja (hash guardado, mostrada uma vez), escopos de
    leitura; webhooks de pedido criado e pago, situação, estoque e produto, com assinatura
    HMAC, até 5 tentativas com espera crescente e tela de entregas.
W6d Afiliados por loja: partners com kind "STORE_AFFILIATE" e storeId; link com ref;
    comissão pela regra versionada já existente (FM4); painel do afiliado reaproveitado.
W6e Assistente: seguir docs/prompts/mauricio-agente-ia-v1.md (ajuda de uso primeiro;
    ações só com confirmação; dinheiro sempre por função determinística).

==========================================================================================
FECHAMENTO DE CADA ONDA (obrigatório)
==========================================================================================
1. npx tsc --noEmit · npx eslint src e2e tests · npx vitest run · npm run build.
2. Demo reiniciada (bash scripts/restart-demo.sh --limpo) e o e2e da onda verde.
3. Capturas 360 e 1440 das telas novas com axe 0 e sem rolagem horizontal; olhar as capturas.
4. DECISIONS.md (decisão nova), CLAUDE.md (próxima decisão), docs/prompts/README.md
   (estado da onda) e este arquivo (tabela abaixo).
5. Publicar (skill publicar), conferir no ar (npm run conferir:producao).
6. Relatório ao dono em português simples: o que ficou pronto, como ver, o que depende dele,
   qual é a próxima onda.
````

---

## Parte 3. Estado das ondas

| Onda | Estado | Decisão |
|---|---|---|
| W0 Confiança | **Feita** (2026-10-27); o dia de vencimento ficou para depois (precisa de regra de cobrança proporcional, ver D183) | D183 |
| W1 Pedido na mesa | **Feita** (2026-10-27); o link cobra os produtos, o frete é combinado | D184 |
| W2 Medir a loja | **Feita** (2026-10-27); "visitas hoje" no pulso fica para depois | D185 |
| W3 Recuperar e vender mais | **Feita em parte** (2026-10-27): carrinho abandonado, compre junto e prazo de produção; encomenda, personalização, presente e desconto do compre junto ficam para uma rodada própria | D186 |
| W4 Migrar sem medo | **Feita** (2026-10-27); aviso por e-mail à lista de espera fica para depois | D187 |
| W5 Módulos e ferramentas | **Feita em parte** (2026-10-27): calculadoras (painel e públicas), calendário, central de aplicativos; ligar por plano, Pix direto e receber na entrega ficam para depois | D188 |
| W6a Duas etapas para o lojista | **Feita** (2026-10-27) | D188 |
| W6b a W6e (balcão, API, afiliados da loja, assistente) | A fazer, uma por vez | — |
