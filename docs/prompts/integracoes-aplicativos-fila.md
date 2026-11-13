# Fila de integrações (aplicativos) da NextLevel Commerce, da mais fácil para a mais difícil

> **Origem:** a área de aplicativos do painel wBuy (lotes 5 a 7, em `docs/referencias/wbuy-painel-notas.md`), comparada com o que já existe no código em 2026-10-27.
> **Uso:** cada item é uma tarefa pronta para programar. Diga "faça a integração I-xx" numa sessão e siga as regras do fim.
> **Relacionados:** a central de aplicativos (`/merchant/aplicativos`, `src/lib/domain/aplicativos.ts`, D188) e o comparativo (`docs/relatorios/COMPARATIVO-ECOMMERCE-X-WBUY-2026-10-27.md`).

## Como medi a facilidade
- **Nível 1, só configuração (horas):** a loja cola um número ou código; nós colocamos o script oficial na loja. Não há contrato nem servidor do parceiro.
- **Nível 2, API com token simples (1 a 3 dias):** o lojista gera um token no site do parceiro e cola na loja; chamamos a API (cotação, envio de pedido, lista de contatos). É o mesmo padrão que já usamos no SuperFrete, no Melhor Envio e na Onlog (`src/lib/shipping/providers.ts`).
- **Nível 3, OAuth + avisos (1 a 2 semanas):** login na conta do parceiro (autorizar o app), avisos de volta (webhooks), associação de produtos e pedidos, e é preciso cadastrar um "aplicativo" no parceiro.
- **Nível 4, contrato ou parceria comercial:** depende de proposta, homologação ou custo por transação. Não começa sem você.

## Já temos (não refazer)
- **Pagamento e envio:** Mercado Pago da loja (Pix e cartão até 6x); Pagar.me (só na cobrança da NextLevel); SuperFrete, Melhor Envio e Onlog (token).
- **Divulgação:** botão de WhatsApp; Pixel da Meta e API de conversões (D187); lista do Google Shopping, `feed.xml` (D187); sitemap.
- **Loja:** endereços antigos, o "301" (D187); retirada na loja; frete por regras de CEP.

---

## A fila, em ordem de programação

### Nível 1: só configuração (fazer primeiro; tudo junto cabe numa rodada)
| # | Integração | O que o lojista faz | O que programamos | Por que vale |
|---|---|---|---|---|
| I-01 | **Google Analytics 4** | Cola o ID (G-XXXX) | Campo em "Migrar e anunciar" e script na loja publicada (como o Pixel); eventos de produto visto, carrinho e compra | Pedido número 1 de quem vem de outra plataforma |
| I-02 | **Google Tag Manager** | Cola o ID (GTM-XXXX) | Mesmo lugar; o script do GTM só na loja publicada | Permite outras tags sem programar |
| I-03 | **Google Search Console** | Cola a "meta tag" de verificação | Gravar só o código (sem HTML livre) e pôr a meta no `<head>` da loja | Indexação no Google; o sitemap já existe |
| I-04 | **Google Ads (conversão)** | Cola o ID e o rótulo da conversão | Evento de compra na página do pedido pago (igual à `CompraMeta`) | Mede o anúncio do Google |
| I-05 | **Pixel do TikTok** | Cola o ID do pixel | Copiar o padrão da `PixelMeta` (página, produto, carrinho, compra com `event_id`) | Público jovem da moda |
| I-06 | **Tag do Pinterest** | Cola o ID | Mesmo padrão | Moda e decoração vendem bem lá |
| I-07 | **Catálogo do Instagram/Facebook (Meta)** | Cola o endereço no Gerenciador de Comércio | Reusar o `feed.xml` com os campos que a Meta pede (mesmo formato do Google) | "Instagram Shopping" sem API |
| I-08 | **Catálogo do TikTok** | Cola o endereço no TikTok Shop Ads | Mesmo `feed.xml` | Anúncio de catálogo no TikTok |
| I-09 | **Chat ao vivo (Tawk.to ou JivoChat)** | Cola o ID do widget | Script na loja publicada (lista fechada de chats, sem HTML livre) | Atendimento sem custo (Tawk é gratuito) |
| I-10 | **Loja instalável no celular (PWA)** | Liga a chave | `manifest` por loja (nome, ícone, cor) | "Baixe o app da loja" |
| I-11 | **Confirmação de maioridade** | Liga a chave | Janela "tenho 18 anos" na primeira visita | Bebidas, tabacaria, adulto |

**Regra de segurança deste nível:** nunca aceitar "colar script" livre (o wBuy tem "scripts por página"). Cada integração tem campo próprio, validado (só o formato do ID) e o script oficial escrito por nós. Também não carrega na prévia, na demonstração nem na página de espera.

### Nível 2: API com token simples
| # | Integração | O que o lojista faz | O que programamos | Por que vale |
|---|---|---|---|---|
| I-12 | **Frenet** (hub de frete) | Cola o token | Novo provedor em `SHIPPING_PROVIDERS` + cotação no checkout | Muitas transportadoras de uma vez |
| I-13 | **Kangu** (frete com pontos de coleta) | Cola o token | Mesmo padrão | Frete barato para pequenos |
| I-14 | **Jadlog** (direto) | Contrato + token | Cotação e rastreio | Pedido comum de quem já tem contrato |
| I-15 | **Correios com contrato** | Usuário, código de acesso e cartão de postagem | Cotação no contrato e pré-postagem | Preço de contrato é menor que o de balcão |
| I-16 | **Tiny / Olist ERP** | Cola o token da API | Enviar pedido pago, receber estoque (rotina a cada 15 minutos) | O ERP mais usado por pequenos |
| I-17 | **Omie** | App key + app secret | Enviar pedido pago e nota | ERP de contadores |
| I-18 | **Mailchimp / Brevo** | Cola a chave da API | Mandar clientes com consentimento de marketing para a lista | Newsletter sem planilha |
| I-19 | **Avisos no WhatsApp (API oficial, via provedor)** | Conta no provedor (Z-API, Twilio ou Meta Cloud API) e token | Pedido pago, enviado e carrinho abandonado também por WhatsApp (já existe por e-mail) | Decisão 3 de D182: o WhatsApp entra quando houver API oficial |

### Nível 3: OAuth + avisos (uma por vez, com o seu OK)
| # | Integração | O que exige | O que programamos | Por que vale |
|---|---|---|---|---|
| I-20 | **Bling v3** | Cadastrar o app no Bling (OAuth2) | Autorizar, enviar pedido, receber estoque e preço; a Brás também usa (F7) | O ERP número 1 do Brasil |
| I-21 | **Mercado Livre** | Cadastrar o app no ML (OAuth) | Anunciar produtos, receber pedidos, baixar estoque nos dois lados | O maior marketplace |
| I-22 | **Shopee** | Ser parceiro aberto da Shopee (Open Platform) | Mesmo fluxo do ML | Muito forte em moda barata |
| I-23 | **Conta Azul** | App no Conta Azul (OAuth) | Vendas para o financeiro do lojista | Contabilidade |
| I-24 | **TikTok Shop** | Cadastro de desenvolvedor no TikTok Shop | Produtos e pedidos (pesquisa já salva em `pesquisa-tiktok-shop-integracao.md`) | Venda dentro do TikTok |
| I-25 | **Avaliações com selo externo (Trustvox ou Reclame Aqui)** | Conta no parceiro | Enviar pedido entregue e mostrar o selo | Confiança para quem não conhece a loja |

### Nível 4: contrato ou parceria (não começar sem você)
| # | Integração | Por que depende de você |
|---|---|---|
| I-26 | **Antifraude (ClearSale ou Konduto)** | Custo por pedido e contrato. Hoje existe a suspeita de fraude manual (D184) |
| I-27 | **Intelipost** | Plataforma para quem já é grande; contrato |
| I-28 | **Linx e outros ERPs de varejo** | Homologação |
| I-29 | **Armazém (fulfillment)** | Operação física e contrato |
| I-30 | **SMS (Zenvia)** | Custo por mensagem |
| I-31 | **Cashback ou fidelidade de terceiros** | Já temos o Club na Brás; pensar antes de pagar um parceiro |
| I-32 | **Gateways extras (PagSeguro, Stone, Getnet)** | Cada um é uma integração de pagamento com teste de dinheiro; o Mercado Pago já cobre Pix e cartão |

---

## Ordem recomendada (para programar)
1. **Rodada A (nível 1 inteiro):** I-01 a I-11, porque é tudo do mesmo tipo e reaproveita o padrão do Pixel da Meta (D187). Entra em "Migrar e anunciar" e acende os cartões na central de aplicativos.
2. **Rodada B, frete:** I-12 Frenet, I-13 Kangu e I-15 Correios com contrato, porque é o mesmo padrão dos provedores que já existem.
3. **Rodada C, ERP leve:** I-16 Tiny e I-17 Omie. Antes, criar o "envio de pedido pago para fora", que reaproveita os eventos internos (`emitEvent`) e serve de base para a API (W6c).
4. **Rodada D, WhatsApp oficial (I-19):** você escolhe o provedor.
5. **Rodada E:** Bling (I-20), depois Mercado Livre (I-21) e depois Shopee (I-22), uma por vez.

## Regras para programar qualquer item
- Token e segredo só com `encryptSecret`; nunca em tela, log ou e-mail. O número público (ID de pixel ou tag) pode ficar aberto.
- Só a loja independente da E-commerce no começo; o SuperDrop não muda sem teste.
- Cada integração aparece na central de aplicativos com o estado real: ligado se configurado, desligado se não, "em breve" enquanto não estiver pronta.
- Pagamento só vale conferido na API do provedor; pedido para fora só depois de pago; idempotência por `dedupeKey`.
- Teste com `fetch` falso (como `tests/w4-migrar.test.ts`), roteiro de navegador, decisão nova em `DECISIONS.md` e uma linha em "O que mudou".
- Nada de "script livre" colado pelo lojista.

## Estado
| Rodada | Itens | Estado |
|---|---|---|
| A, só configuração | I-01 a I-11 | **Feita** (D189, 2026-10-27) |
| B, frete | I-12, I-13, I-15 (I-14 se houver pedido) | **Feita** (D190, 2026-10-27); falta conferir com conta real de cada plataforma |
| C, ERP leve | I-16, I-17 | **Feita** (D191, 2026-10-27); falta conferir com conta real do Tiny e do Omie |
| D, WhatsApp oficial | I-19 | Aguarda a escolha do provedor (próxima depende de você) |
| E, OAuth | I-20, I-21, I-22 (depois I-23 a I-25) | A fazer, uma por vez |
| Nível 4 | I-26 a I-32 | Depende de você |
