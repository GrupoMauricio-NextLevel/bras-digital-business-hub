> **ADIADO (D42, 2026-10-02):** o dono tirou influenciadores, creators, feed e live da fila ativa. Documento preservado para a etapa futura; não desenvolver agora.

# Hub Creators: projeto único e consolidado (prompt-mestre)

> **Status: PROPOSTA PARA O DONO AVALIAR. Nada foi implementado.** Consolida em um só projeto o que estava espalhado em `creator-commerce-plataforma.md` (arquitetura de plataforma independente), `creator-hub-tiktok.md` (rastreio, atribuição, comissões, amostras, TikTok), `promessas-commerce.md` P3 (influenciadores) e P4 (feed e live), `nextlevel-commerce-plataforma.md` seções 5.4 e 5.5, e `pesquisa-tiktok-shop-integracao.md`. **Este arquivo passa a ser a fonte única do Hub Creators**; os outros viram referência de detalhe. Decisão do dono: influenciadores, lives e creators vivem **todos** no Hub Creators (domínio `hubcreators.nextlevelgroup.com.br`, marca `HUB_CREATORS` já existente em `src/lib/brand.ts`), fora do Commerce. Etapa futura (D40): só vai ao ar com código desenvolvido.
>
> Antes de codar, leia `CLAUDE.md`, `AGENTS.md` (Next.js com mudanças: `node_modules/next/dist/docs/`), `docs/design/DECISIONS.md` (próxima: D42) e a seção 4A do prompt-mestre do Commerce (anti-duplicação).

## 1. O que é (uma frase)
**O Hub Creators conecta lojas e marcas a criadores de conteúdo que vendem por vídeo, live e link, e paga a comissão de cada venda de forma transparente.** O Commerce responde "como vender e operar a transação"; o Hub responde "como gerar demanda e audiência e quem merece a comissão".

## 2. Quem usa e o que ganha
| Papel | Ganha | Telas |
|---|---|---|
| **Creator** (influenciador, afiliado de produto, apresentador de live) | Catálogo de oportunidades pagas por comissão, amostras, link e cupom próprios, extrato e saque | Creator Studio |
| **Loja / marca / fornecedor** (Commerce, SuperDrop, Brás) | Vendas por indicação, conteúdo com seu produto, lives, tudo medido | Brand Studio (dentro do painel da loja, com atalho) |
| **Consumidor** | Descobrir produto em vídeo/live e comprar na loja | Feed e Ao vivo (fase posterior) |
| **NextLevel (Master)** | Receita (taxa sobre comissão ou plano), moderação, antifraude | Painel Master (filtro Hub Creators) |
| **Operador de canal** (futuro) | Programação 24/7 | Studio de canais |

## 3. Fronteira com o Commerce (regra de ouro)
- **Commerce é a fonte da verdade** de loja, produto, variante, estoque, preço, carrinho, checkout, cliente, pedido, pagamento, reembolso. **O Hub nunca copia isso**: lê por API interna e, se precisar de cache, chama explicitamente de *projeção* (`CommerceProductProjection`).
- **Hub é a fonte da verdade** de creator, perfil e canais, campanhas e oportunidades, amostras, conteúdo e mídia, lives, canais, atribuição, regras e livro-razão de comissão, desempenho.
- **Checkout continua no Commerce**: vídeo/live → botão → página do produto na loja → checkout existente. Sem segundo checkout.
- **Comunicação:** chamadas internas (produto, disponibilidade, preço, criar sessão de checkout) e **eventos** pelo `emitEvent` já existente: Commerce emite `OrderCreated/Paid/Canceled/Refunded`, `ProductUpdated`, `InventoryChanged`; Hub emite `CreatorAttributed`, `CommissionCreated/Approved/Reversed`, `ContentPublished`, `LiveStarted/Ended`. Idempotência por `dedupeKey`.
- **Estrutura de código (monólito modular, mesmo repositório, mesmo deploy e banco):** `src/lib/domain/creator/*`, tabelas com prefixo `creator_*`, telas `src/app/creator/*` (+ `src/app/(hub)` público), sem importar tabelas do Commerce diretamente fora de um módulo de integração `src/lib/domain/creator/commerce-gateway.ts`. Separar fisicamente só se a escala exigir.
- **Creator não pertence a uma loja:** identidade global, com relação comercial por loja/marca/campanha. A estrutura admite no futuro marcas que não usam o Commerce, mas **não construir isso agora**.

## 4. O que reaproveitar (anti-duplicação)
| Já existe | Uso no Hub |
|---|---|
| `partners` (kind), `partner_links`, `partner_clicks`, cookie `nl-ref`, antifraude `attributionFlag` | Base de identidade, link rastreável e cliques do creator (novo `kind = CREATOR`) |
| `partner_commissions` (livro-razão imutável PENDING→AVAILABLE/VOID/CLAWBACK), `partner_payouts`, garantia, saque, mínimo, pagamento semanal, `runDailyPartnerJobs` | **Um só livro-razão.** Comissão de venda de loja entra como novo tipo `SALE` no mesmo mecanismo (decisão proposta; a alternativa é tabela `creator_commissions` espelhada, mais duplicação) |
| `coupons` (+ `kind`) | Cupom do creator (desconto e atribuição) |
| `emitEvent` / `domain_events` | Barramento entre Commerce e Hub |
| `store_assets` | Mídia (imagens); vídeo exige provedor novo |
| `email_outbox`, `email-transacional.md` | Convites, aprovações, amostras, extrato |
| `encryptSecret` | Tokens de TikTok/Instagram |
| Temas (seções) | Seção "vídeo/creator" na loja e página da live |
| `brand.ts` (`HUB_CREATORS`, módulos `influencers`, `liveShop`) | Domínio, nav e marca |

## 5. Modelo de dados (proposto, nomes a ajustar ao schema)
`creators` (id, partnerId, nome, status, origem) · `creator_channels` (creatorId, provider TIKTOK/INSTAGRAM/YOUTUBE/KWAI/NATIVE, conta externa, usuário, seguidores, métricas normalizadas) · `creator_profiles` (nicho, portfólio, regiões) · `creator_orgs` (relação creator ↔ loja/marca, status, termos aceitos) · `creator_campaigns` (loja/marca, objetivo, período, janela de atribuição, comissão, briefing, status) · `creator_campaign_products` (productId do Commerce) · `creator_campaign_members` (convite/candidatura/aceite) · `creator_sample_requests` (estados REQUESTED→APPROVED/REJECTED→PREPARING→SHIPPED→DELIVERED→CONTENT_PENDING→COMPLETED/CANCELED, endereço em *snapshot*, rastreio) · `creator_contents` (mídia, direitos de uso, status de aprovação) · `tracking_links` / `tracking_clicks` (token opaco, hash de IP, UTM, LGPD) · `order_attributions` (orderId, creator, campanha, link/cupom, modelo `last-click`, regra de conflito configurável) · `commission_rules` (percentual, fixo, por produto/campanha/creator, escalonada, bônus) · `integration_connections` (provider, token criptografado, refresh, escopos, status) · `webhook_events` (assinatura, idempotência, tentativas) · mais, nas fases de vídeo: `creator_videos`, `video_products`, `lives`, `live_pins`, `live_messages`, `channels`, `program_blocks`.

## 6. Regras de negócio centrais
1. **Atribuição:** `last-click` com janela por campanha (padrão 7 dias, configurável); **cupom explicitamente usado vence o cookie**; modelo preparado para first-click/híbrido, sem implementar.
2. **Comissão:** nasce em `PENDING` no pedido pago, sobre **valor dos produtos pagos sem frete**; vira `AVAILABLE` após prazo de devolução/garantia; estorno gera `CLAWBACK`; ledger imutável/auditável; sem pagamento automático na primeira fase.
3. **Quem paga a comissão:** a loja/marca que contratou (percentual dentro de faixa mín/máx definida no Master). Quem a NextLevel cobra e quanto: **decisão do dono** (taxa sobre comissão, plano mensal da loja ou ambos) — fica para a etapa de regras de negócio.
4. **Antifraude:** autocompra, cupom vazado, estorno alto, mesmo dispositivo; marcação para revisão no Master.
5. **Amostras:** criador pede, loja aprova, envia com rastreio (reuso de `shipping`/etiqueta), criador entrega o conteúdo; regra de devolução ou de "perda" definida pela loja.
6. **Conteúdo e direitos:** termo de uso de imagem/vídeo e licença para a loja usar o conteúdo; moderação antes de aparecer em feed público.
7. **Segurança e multi-tenant:** tenant sempre resolvido no servidor; token de rede social só criptografado e nunca em log/tela; webhooks com assinatura e idempotência; nada de dado pessoal em URL.
8. **Conformidade (fora do código, para validar com contador/advogado):** contrato com o creator, RPA/nota fiscal das comissões, LGPD (consentimento, base legal), direito de imagem, regras de publicidade (identificar "publi").

## 7. Fases (cada uma entrega valor sozinha e só avança se a anterior funcionar)
- **H0. Diagnóstico e contrato de fronteira** (1 doc): inventário do que existe (`partners`…), o que fica, o que muda, contratos de API e de eventos, caminho de migração sem perda. Decisão D42 em `DECISIONS.md`.
- **H1. O ciclo do dinheiro (núcleo):** creator (sobre `partners`), campanha e produtos da loja, convite/candidatura, **link rastreável + cupom**, atribuição no pedido, **comissão no livro-razão**, painel mínimo do creator e da loja, visão no Master. *Esta fase já valida o negócio sem vídeo nenhum.*
- **H2. Amostras e Creator Studio/Brand Studio completos:** pedido de amostra, conteúdo entregue, aprovação, calendário, desempenho por campanha e creator.
- **H3. Vídeo comprável (feed):** `VideoProvider` (Mux, Cloudflare Stream ou Bunny: decidir com custo por minuto), vídeo com produto marcado, **primeiro dentro da loja** (seção de tema), depois feed do Hub; moderação e denúncia.
- **H4. Lives:** primeiro **live externa** (agenda, página, produto fixado, link para TikTok/Instagram/YouTube, atribuição por live); live nativa só depois; replay com produtos.
- **H5. Canais 24/7 e operador de canal:** programação, blocos, patrocinados. Só com audiência comprovada.
- **H6. Integrações de rede:** TikTok OAuth, Pixel/Events API server-side, TikTok One/Creator Marketplace, TikTok Shop Affiliate (marcadas CONFIRMADO / PRECISA VALIDAR / DEPENDENTE DE TIKTOK ONE / DEPENDENTE DE TIKTOK SHOP / DEPENDENTE DE ADS / FUTURO, **depois** da pesquisa em `pesquisa-tiktok-shop-integracao.md` e do teste controlado); depois Instagram/YouTube. TikTok é *provider*, nunca a fundação.

## 8. O que eu cortaria ou adiaria (avaliação crítica)
- **Rede social própria cheia (feed global, social graph, recomendação, busca, canais 24/7, live nativa)** é produto de empresa grande. O risco é "app vazio": sem audiência própria, o feed não tem quem assista. **O creator já traz a audiência dele do TikTok/Instagram**; o Hub deve primeiro **mover essa audiência para a loja e medir a venda**. Feed próprio e canais só depois que H1–H3 provarem venda.
- **Streaming próprio** (ingest, HLS, CDN, chat, gravação): custo e complexidade altos; usar provedor ou live externa.
- **Clipping por IA e recomendação por aprendizado:** futuro; só registrar os sinais (impressão, tempo, clique, compra).
- **Marca externa sem Commerce** e **organização genérica:** não construir; só não bloquear.
- **Pagamento automático ao creator:** começar com saque manual aprovado (já existe).

## 9. Critérios de aceite do MVP (H1)
1. Uma loja cria campanha com 1+ produtos, define comissão e convida um creator (ou ele se candidata).
2. O creator recebe link e cupom; um clique grava atribuição; compra paga na loja cria `order_attribution` e comissão `PENDING`.
3. Passada a garantia, vira `AVAILABLE`; o creator pede saque; estorno gera `CLAWBACK`.
4. Loja e creator veem números certos; um tenant nunca vê dado de outro; sem comissão duplicada em reentrega de evento (teste de idempotência).
5. Testes de domínio, e2e do ciclo completo, acessibilidade e `force-dynamic` onde cabe.

## 10. Riscos
Audiência inexistente no feed próprio · conformidade fiscal e trabalhista do pagamento a creators · direitos de imagem e moderação · custo de vídeo/live por minuto · mudança de API do TikTok (por isso provider e flags) · fraude de comissão · dispersão de foco (D40: só após o Commerce estar vendendo).

## 11. Decisões que dependem do dono
1. Aceita o **corte** da seção 8 (começar pelo ciclo do dinheiro, vídeo depois)?
2. Comissão: o **mesmo livro-razão** dos parceiros (recomendado) ou um novo?
3. **Quem é o primeiro creator-alvo:** influenciador de moda do Brás, revendedor/afiliado de produto ou apresentador de live?
4. Modelo de receita do Hub (taxa sobre comissão, plano da loja ou ambos) — pode ficar para a etapa de regras.
5. Quando o Hub entra na fila: depois do Commerce vender, em paralelo ou na frente do painel de controle?
