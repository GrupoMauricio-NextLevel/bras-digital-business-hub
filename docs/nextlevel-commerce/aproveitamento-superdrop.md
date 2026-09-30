# NextLevel Commerce: o que aproveitar do SuperDrop

> Inventário feito sobre o código real (branch `claude/wonderful-cannon-5o38v5`, D1 a D32). Serve de base para o prompt `docs/prompts/nextlevel-commerce-plataforma.md`. Escala usada: **A** = aproveita como está · **B** = aproveita com adaptação · **C** = específico do SuperDrop (isolar em módulo) · **D** = não existe (construir).

## 0. Resumo em uma página
- O SuperDrop já contém, de fato, **uma plataforma de lojas virtuais completa por dentro**: motor de temas com seções e editor, vitrine pública, carrinho, checkout com Pix e cartão, pedidos, acompanhamento pelo cliente, financeiro, planos, cobrança por Pix, programa de parceiros, e-mail e um painel Master. Cerca de **4.700 linhas de regras de negócio testadas** (42 arquivos de teste, 25 roteiros de navegador), 67 tabelas e cerca de 95 telas.
- O que é **específico do SuperDrop** (dropshipping) está concentrado em poucas peças: rede de fornecedores, custo debitado da carteira do lojista, expedição/ondas/etiquetas da Central, estoque mínimo para ativação e comissão de canal do fornecedor. Dá para **isolar em um módulo** sem jogar fora nada.
- **A maior dívida estrutural** para virar plataforma geral: hoje toda loja pertence a uma rede de um fornecedor (`stores.networkId` obrigatório) e todo pedido e produto tem `supplierId` obrigatório. Existe o atalho `SUPPLIER_OWN` (loja própria de um fornecedor), que já funciona como "loja com catálogo próprio". A recomendação é usar esse atalho como a **"conta simples" do lojista independente** na primeira fase e generalizar o modelo depois (seção 5).
- **O que falta para a promessa nova** (atacado B2B de verdade, influenciadores, feed e live, tema nível Shopify, frete real, SEO e integrações de marketing): está listado na seção 6.

## 1. Núcleo de loja virtual (base da plataforma)

| Peça | Onde está | Nota | O que fazer |
|---|---|---|---|
| Multi-tenancy e permissões | `src/lib/domain/access.ts`, `assertCanAccess`, papéis em `users.role` | Isolamento por tenant testado (`tests/tenancy.test.ts`) | **A** |
| Motor de temas (seções, blocos, modelos JSON, 4 páginas) | `src/lib/themes/*` (sections, template, presets, store, install), `src/components/storefront/sections/*` | cerca de 30 tipos de seção e bloco, 4 temas (Starter, Arena, Editorial, Signature), rascunho/publicação/histórico, prévia como dono | **A**, base do "tema nível Shopify" |
| Editor de tema em tela cheia | `src/app/theme-editor`, `src/components/theme-editor/*` | Prévia ao vivo, desfazer, limites por oferta, upload de imagens | **A**, evoluir (seção 6) |
| Loja de temas (compra e instalação) | `src/lib/themes/install.ts`, `src/app/merchant/templates/theme-store.tsx` | Cartão até 6x, Pix com desconto, instalação imediata | **A**; vira Theme Store com terceiros |
| Vitrine pública | `src/app/store/[slug]/*` (catálogo, produto, carrinho, checkout, pedido, acompanhar) | Rodapé NextLevel, selos, WhatsApp, SEO básico | **A** |
| Checkout e pagamento do cliente final | `src/app/store/[slug]/checkout`, `src/lib/payments/mercadopago.ts`, `orders.ts` (`markCustomerPaidBySystem`) | Mercado Pago (Pix e Checkout Pro), confirmação só pela API, reserva de estoque com expiração | **A**; abrir para outros meios de pagamento |
| Pedidos e máquina de estados | `src/lib/domain/orders.ts`, `order-status.ts`, `tracking.ts` | Estados, eventos, cancelamento, pedido de teste, acompanhamento por número + e-mail | **A** |
| Clientes e LGPD | `customers`, `store_customers`, `marketing_consents` | Consentimento por finalidade | **A**; base do marketing por e-mail |
| Catálogo e produto | `products.ts`, `catalog.ts`, `size-grids.ts`, `product-import*.ts`, editor de produto | Variantes, grades P a 2XL e infantil 18-28, importação por Excel/CSV com conferência, SEO, duplicar, lote | **A/B** (hoje o dono do catálogo é o fornecedor) |
| Estoque | `inventory.ts`, `inventory_movements`, reservas | Reserva ao pedir, baixa ao expedir, histórico | **A/B** (estoque central do fornecedor; ver seção 5) |
| Cupons e teste grátis | `coupons`, `store-access.ts` | Cupom de teste de 7 dias, um por CPF/CNPJ | **A**; falta cupom de desconto do consumidor |
| Análise de vendas | `analytics.ts`, `/merchant/analytics` | Vendas, margem, ticket, recompra, mapa de calor, estados | **A** |
| Domínio próprio da loja | `stores.customDomain`, `domainStatus`, `store-url.ts` | Estrutura pronta, assistente ainda simples | **B** |
| Upload de imagens | `assets.ts`, `/assets/[id]` | Tipo conferido pelos bytes, limite por loja | **A** |
| Pós-venda | `after-sales.ts`, `/merchant/after-sales` | Chat de pós-venda | **A** |
| Navegação e casca | `AppShell`, `nav.ts`, design system v3, painéis por papel | Menu agrupado, celular, tema claro/escuro, axe limpo | **A** |

## 2. Monetização e cobrança (a máquina de receita)
| Peça | Onde está | Nota | O que fazer |
|---|---|---|---|
| Tabela de preços configurável | `src/lib/finance/price-book.ts`, `getPriceBook`, `/master/finance` | Ofertas, setups, taxas, prazos de cobrança, desconto Pix | **A** |
| Planos por recurso (entitlements) | `features.ts`, `entitlements.ts` | Recurso liberado por oferta, com cadeado e upgrade | **A**, base para planos da nova plataforma |
| Faturas e cobrança por Pix/cartão | `finance.ts`, `nextlevel-billing.ts`, `nextlevel_payments` | Fatura, liberação automática ao pagar, bloqueio com QR, prazos flexíveis | **A** |
| Teste de 7 dias, bloqueio e liberação | `store-access.ts`, `BlockedScreen` | Já validado de ponta a ponta | **A** |
| Taxa por pedido do membro | `closeStoreFees` | Percentual da oferta, fechamento mensal | **A** |
| Venda de temas e serviços | `themes/install.ts`, `services.ts`, Loja NextLevel pública | Pix com desconto ou cartão 6x | **A** |
| Escritório virtual do Master | `nextlevel-office.ts`, `master-control.ts`, CRM | Assinaturas, ativações, serviços, vendas digitais | **A** |

## 3. Crescimento e relacionamento
| Peça | Onde está | Nota | O que fazer |
|---|---|---|---|
| Programa de Parceiros | `partners.ts` (524 linhas), `/partner/*`, `/master/partners`, `/parceiros` | Links com QR, cupons, faixas de comissão, garantia, saque, antifraude, CSV, termos versionados | **A**; é o motor de aquisição de lojistas. Base do programa de **influenciadores** (seção 6) |
| E-mail transacional | `email.ts`, `order-emails.ts`, `password-reset.ts`, `email_outbox` | Layout de marca, envio único, avisos de cobrança, cliente final | **A/B**; prompt E0 a E8 já escrito |
| Recuperar senha | `password-reset.ts` | Token de uso único | **A** |
| Loja NextLevel pública + CRM | `nl-sales.ts`, `/loja-nextlevel`, `/master/crm` | Compra em 1 clique, funil de pedidos | **A** (vitrine de serviços e produtos digitais da plataforma) |
| Portal público | `(portal)` | Home, planos, dúvidas, parceiros, páginas por público | **B**; reescrever a copy para a nova marca |
| Cupom por fornecedor e página `/f/[slug]` | `supplier-page.ts` | Página de captação por fornecedor | **C** (vira "página do parceiro/marca") |

## 4. O que é específico do SuperDrop (isolar em módulo "Dropshipping")
| Peça | Onde está | Observação |
|---|---|---|
| Fornecedor/Central, rede, contrato do fornecedor | `suppliers`, `networks`, `supplier_contracts`, `supplierBilling` | Fornecedor vira **um tipo de conta** entre outros |
| Carteira do lojista e débito de custo | `wallet.ts`, `tryDebitOrder`, recargas por Pix | Só faz sentido quando há custo pago à Central |
| Expedição da Central | `operations.ts`, `cutoff.ts`, `labels.ts`, ondas, fila de separação, estoque que segura pedidos | Vira o módulo de **expedição** (útil também a lojistas com estoque próprio) |
| Acesso de produtos por loja e estoque mínimo para ativação | `product_store_access`, `min_activation_stock`, `checkProductActivation` | Específico da rede |
| Comissão de canal do fornecedor | `store_acquisitions`, `registerStoreAcquisition` | Específico da rede |
| Torre de controle e saúde das lojas | `control-tower.ts` | Vale para a plataforma inteira (**B**) |
| Copy e telas de "seja fornecedor" | `/seja-fornecedor`, `/fornecedores` | Pausar; manter no ar |

## 5. Mudança estrutural necessária (modelo de conta)
**Hoje:** `Organização → Fornecedor → Rede → Loja`; produtos e pedidos carregam `supplierId` obrigatório; custo é debitado da carteira do lojista.
**Caminho recomendado em duas etapas:**
1. **Conta simples (rápida, baixo risco):** ao "abrir minha loja", o sistema cria por baixo uma Central própria oculta (`SUPPLIER_OWN`) e a loja. O lojista vê só "Minha loja": produtos, estoque, pedidos, tema. Sem carteira, sem rede, sem custo de Central (o bypass de custo já existe). Reaproveita 100% do que existe e permite **lançar já**.
2. **Modelo geral (depois de validar):** introduzir `seller` (vendedor) como entidade de primeiro nível, com `stores.sellerId`, produtos e estoque do vendedor, e a rede de fornecedores como **fonte opcional** de catálogo (o SuperDrop vira "conectar a um fornecedor"). Migração com dados existentes e testes de regressão dos pedidos.
Ponto de atenção: `orders.supplierId`, `products.supplierId`, `inventory` e `order_claims` dependem do fornecedor. A etapa 2 exige revisão de todas as consultas de painel e do isolamento por tenant.

## 6. O que falta para a promessa da NextLevel Commerce
| Necessidade | Situação | Reaproveita | Construir |
|---|---|---|---|
| **Atacado B2B** | Existe grade/pack (`product_packs`, `saleType WHOLESALE`) e pedido manual de atacado | catálogo, pedidos, importação | preço por faixa de quantidade, pedido mínimo, cadastro de cliente atacado com aprovação, tabela de preço por cliente, catálogo fechado/oculto para varejo, pedido rápido por planilha, condições de pagamento, representantes |
| **Influenciadores** | Não existe; parceiros só vendem planos | `partners`, links, cupons, ledger, saque, antifraude | comissão sobre **vendas das lojas** (não só planos), vitrine e cupom por influenciador, contrato por loja, painel próprio, prova de venda |
| **Feed / Live shop** | Não existe | seções de tema, mídia (`store_assets`), clientes, checkout | feed vertical de vídeos com produto marcado, lives agendadas com produto fixado e compra dentro da live, moderação, replay, comissão; exige provedor de vídeo (custo) |
| **Tema nível Shopify** | Base sólida, faltam camadas | motor de seções, editor, loja de temas, presets | performance (Lighthouse 90+), mais seções e animações, blocos aplicativos, guia de tamanhos, barra de frete grátis, tipografia e cores avançadas, temas de terceiros com repasse, verificação de tema (revisão automática) |
| **Frete real no checkout** | Só existe a conexão da plataforma de envio; o frete do pedido é informado | `shipping/providers.ts`, `labels.ts` | cotação por CEP (SuperFrete, Melhor Envio, Correios), regras de frete grátis, compra de etiqueta pela API, rastreio automático |
| **Meios de pagamento** | Só Mercado Pago | camada `payments/` | adaptadores (Pix direto, PagSeguro, Stripe, Asaas), parcelamento com regras por loja |
| **SEO e marketing** | SEO básico por produto | editor de produto | sitemap, dados estruturados, blog e páginas livres, pixel Meta/Google/TikTok e API de conversões, carrinho abandonado, avaliações |
| **Fiscal** | Não existe | pedidos | integração de nota fiscal (emissores), CPF/CNPJ na compra, cálculo de impostos quando o cliente pedir |
| **Migração de outras plataformas** | Importação por planilha | `product-import*` | importadores (WBuy, Nuvemshop, Loja Integrada, Shopify) e redirecionamento de URL |
| **App/PWA e desempenho** | Loja responsiva | storefront | PWA da loja, cache de borda, imagens otimizadas |
| **Observabilidade e escala** | Banco embutido (PGlite) em produção simples | drizzle | Postgres gerenciado (Neon), fila de trabalho, monitor de erros, limites por tenant |

## 7. Riscos técnicos a tratar cedo
1. **Banco e hospedagem:** produção precisa de Postgres externo e plano sempre ligado antes de qualquer cliente real.
2. **Dependência do fornecedor em todo o modelo** (seção 5): não misturar a refatoração com o lançamento; lançar com a conta simples.
3. **Build estático quebrando o deploy** quando página consulta o banco: regra já no `CLAUDE.md`.
4. **Vídeo e live** têm custo e complexidade próprios; entrar por provedor terceiro e fase separada.
5. **Marca:** troca de SuperDrop para NextLevel Commerce toca em textos, e-mails, logo, domínio, portal e termos; fazer por camada de tema de marca, sem espalhar nomes fixos (ver o prompt).
6. **Escopo:** a lista da seção 6 é grande. O lançamento é loja virtual + tema + parceiros; atacado, influenciadores e live entram em ondas.

## 8. Ordem de aproveitamento sugerida
1. Marca e domínio (camada de marca configurável, portal novo).
2. Conta simples do lojista (SUPPLIER_OWN oculto) com onboarding "abrir minha loja".
3. Frete real e mais meios de pagamento.
4. Tema nível Shopify (performance e novas seções).
5. Atacado B2B.
6. Influenciadores (sobre o motor de parceiros).
7. Feed e live shop.
8. Modelo geral de vendedor e SuperDrop como módulo conectável.

## 9. Portfólio: como cada marca reaproveita o Core
Ver a matriz módulo × marca e as 10 regras anti-duplicação em `docs/prompts/nextlevel-commerce-plataforma.md` (seção 4A). Resumo do que **já existe e todas as marcas usam sem cópia**: identidade e papéis, lojas e vitrine, motor de temas e loja de temas, catálogo e estoque, pedidos, Pix e cartão, faturas e planos, programa de parceiros, e-mail, CRM e escritório virtual, torre de controle e eventos de domínio. O que **falta para servir mais de uma marca** (fase N0): `brands`, resolução por domínio, `organizations.brand`, planos por marca e filtro de marca no Master.
