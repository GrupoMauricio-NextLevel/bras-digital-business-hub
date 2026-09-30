# Prompt de desenvolvimento: NextLevel Commerce, a plataforma de lojas virtuais do Brás para o Brasil

> Documento-mestre. É executável por fases (N0 a N10) e orquestra os outros prompts da fila (`email-transacional.md`, `fornecedor-360-master.md`, `programa-parceiros.md`). Antes de codar, leia `CLAUDE.md`, `AGENTS.md`, `docs/design/DECISIONS.md` (D1 a D32), **`docs/nextlevel-commerce/aproveitamento-superdrop.md`** (inventário do que reaproveitar) e `docs/MAPA.md`. Registre as decisões em `docs/design/DECISIONS.md` (D33 em diante). Nada de preço, percentual, prazo ou limite fixo no código: tudo em configuração.

## 0. MISSÃO
Lançar a **NextLevel Commerce**: a plataforma de lojas virtuais para **qualquer lojista do Brás e do Brasil inteiro**, com o que as plataformas tradicionais entregam mal para o comércio de moda e atacado brasileiro: **atacado de verdade, influenciadores, feed e live shop, programa de parceiros e temas de nível Shopify**. O SuperDrop deixa de ser a marca-mãe e passa a ser **um módulo** (loja conectada à rede de fornecedores). O foco da primeira onda é a **loja virtual**; o restante se acopla aos poucos, sem reescrever o núcleo.

Empresa: NextLevel Marketing Ltda. Domínio da holding: `nextlevelgroup.com.br` (gestão master de todos os negócios). Domínio da plataforma: `nextlevelcommerce.com.br` (a registrar).

## 1. POSICIONAMENTO E MARCA
### 1.1 Arquitetura de marca
```
NextLevel Group (holding, nextlevelgroup.com.br)
 └─ NextLevel Commerce (plataforma, nextlevelcommerce.com.br)   ← marca principal do produto
     ├─ Lojas virtuais (núcleo)            ← lançamento
     ├─ Temas e Theme Store                ← lançamento
     ├─ Parceiros (afiliados)              ← já pronto
     ├─ Atacado B2B                        ← onda 2
     ├─ Influenciadores                    ← onda 2
     ├─ Feed e Live Shop                   ← onda 3
     ├─ SuperDrop (dropshipping com rede)  ← módulo existente, pausado
     ├─ Serviços e assessoria (Loja NextLevel)
     └─ Brás Digital e futuras verticais
```
### 1.2 Promessa e público
- **Quem:** dono de loja do Brás (atacadista, varejista, sacoleira digital, marca própria) e lojista do Brasil todo que vende moda, acessórios, calçados e afins; secundariamente fornecedores, influenciadores e parceiros.
- **Promessa central:** "A loja virtual feita para quem vende moda no Brasil: bonita como as melhores do mundo, com atacado, Pix e venda por influenciador e por live já no lugar."
- **Contra quem:** Shopify, Nuvemshop, Loja Integrada, Tray, Yampi, WBuy. **Validar cada afirmação sobre concorrente antes de usar em qualquer texto público**; o texto de marca fala do que fazemos, não ataca ninguém.
### 1.3 Camada de marca configurável
Nada de "SuperDrop" ou "NextLevel Commerce" fixo em componentes. Criar `src/lib/brand.ts` (nome, logo, cores, domínios, texto de rodapé, WhatsApp, e-mail de suporte, assinatura da NextLevel Marketing Ltda.) lida de configuração da plataforma; portal, e-mails, painéis, BlockedScreen, rodapés das lojas e termos consomem daí. A troca de marca vira configuração e um deploy, não uma caça a textos. O SuperDrop continua como marca de um módulo e de um domínio próprio (`superdrop.com.br`), com redirecionamento planejado, nunca desligado de repente.
### 1.4 Ações fora do código (dono)
Registrar `nextlevelcommerce.com.br` (comparar preço total e renovação com o Registro.br), consulta ao INPI (classes de software/serviços) e busca de anterioridade para "NextLevel Commerce", e-mails do domínio, logo e identidade.

## 2. PRINCÍPIOS DE PRODUTO
1. **Lojista primeiro:** abrir a loja e vender a primeira venda em menos de 1 dia, sem conhecer fornecedor, rede ou carteira.
2. **Pix e WhatsApp são cidadãos de primeira classe** (Brasil real), cartão em até 6x, boleto opcional.
3. **Beleza é recurso:** o tema é a vitrine do lojista e o principal argumento de venda.
4. **Cada módulo acopla sem reescrever o núcleo** (entitlements por plano, tabelas próprias, eventos de domínio).
5. **Configuração em vez de código** (planos, taxas, limites, textos, regras de parceiros e influenciadores).
6. **Confiança:** segurança, LGPD, acessibilidade AA, desempenho medido, textos honestos, sem promessa de ganho.
7. **Uma equipe pequena mantém:** reaproveitar o que existe antes de escrever; cortar o que não se sustenta.

## 3. PERSONAS E JORNADAS
| Persona | Objetivo | Jornada-chave |
|---|---|---|
| **Lojista do Brás** (atacado e varejo) | Vender no atacado e no varejo, receber por Pix, despachar rápido | Cadastro → importa planilha → escolhe tema → publica → primeiro pedido (varejo e atacado) |
| **Lojista do Brasil** (varejo, marca própria) | Loja bonita e simples que vende | Cadastro → tema → produtos → frete e Pix → divulga |
| **Cliente atacadista** (revendedor) | Comprar em grade e por quantidade com preço melhor | Cadastro B2B → aprovação → catálogo de atacado → pedido rápido → repete |
| **Influenciador** | Ganhar comissão indicando lojas de amigos | Cadastro → vitrine e cupom → vende → extrato → saque |
| **Consumidor** | Comprar com confiança e ver o pedido chegar | Feed/live → produto → checkout Pix → acompanhar → recomprar |
| **Parceiro** (afiliado da plataforma) | Renda indicando planos | Já implementado (D30) |
| **Fornecedor** | Abastecer lojas da rede | Módulo SuperDrop |
| **Master NextLevel** | Operar, vender planos e serviços, controlar receita | Escritório virtual, CRM, fornecedor 360 |

## 4. MODELO DE CONTA E ARQUITETURA ALVO
Detalhe e dívida em `aproveitamento-superdrop.md` (seção 5). Decisão:
- **Etapa 1 (lançamento, baixo risco):** a "conta simples" do lojista é criada sobre uma Central própria oculta (`SUPPLIER_OWN`) e sua loja. O lojista vê só **Minha loja** (produtos, estoque, pedidos, tema, financeiro). Sem carteira, rede ou custo de Central. Onboarding "Abrir minha loja" em passos.
- **Etapa 2 (depois de validar):** introduzir `seller` como entidade de primeiro nível (loja, catálogo e estoque próprios), com a rede de fornecedores como **fonte opcional** de catálogo (módulo SuperDrop). Migração dos dados existentes e revisão de `orders.supplierId`, `products.supplierId`, `inventory` e `order_claims`, com testes de isolamento.
- **Módulos por entitlement** (`features.ts`): `wholesale`, `influencers`, `liveShop`, `themesPremium`, `dropship`, etc., ligados por plano e por compra avulsa; cada módulo declara tabelas, telas, eventos e recursos.
- **Eventos de domínio** (`domain_events`) como cola entre módulos (pedido pago dispara comissão de influenciador, e-mail, análise, fila de expedição).
- **Marca por tenant** (nome da loja, logo, cores, domínio) já existe; estender para e-mail e páginas legais.

## 5. MÓDULOS (o que construir, com aceite)
### 5.1 Loja virtual (núcleo) — lançamento
Reaproveita a vitrine, o checkout e os pedidos existentes. Construir:
- **Onboarding "Abrir minha loja":** nome, segmento, CNPJ/CPF, logo, cores, tema, primeiros produtos (planilha ou cadastro), frete, pagamento e domínio; checklist de "no ar" com progresso.
- **Frete real:** cotação por CEP (SuperFrete, Melhor Envio e Correios por adaptador `ShippingProvider`), frete grátis por regra, retirada, prazo estimado; **compra de etiqueta pela API** com débito do saldo ou do Mercado Pago da loja; rastreio automático com e-mails ao cliente.
- **Pagamentos:** camada `PaymentProvider` (Mercado Pago hoje; Pix direto, Asaas, PagSeguro e Stripe como adaptadores), parcelamento por regra da loja, cupom de desconto do consumidor, antifraude simples.
- **SEO e marketing:** sitemap, dados estruturados, páginas livres e blog, pixel Meta/Google/TikTok e API de conversões, carrinho abandonado (com consentimento), avaliações de produto, links de WhatsApp.
- **Domínio próprio:** assistente de DNS, verificação, certificado, redirecionamento do subdomínio.
- **Fiscal (fase própria):** integração com emissor de nota, CPF/CNPJ na compra.
- **Migração:** importadores (WBuy, Nuvemshop, Loja Integrada, Shopify) por API ou exportação, com redirecionamento de URL.
**Aceite:** um lojista novo publica uma loja com 20 produtos, frete real e Pix em menos de 1 hora e recebe o primeiro pedido de teste ponta a ponta.

### 5.2 Temas nível Shopify — lançamento (contínuo)
Base: motor de seções (`src/lib/themes`), editor, Theme Store, 4 temas. Construir (**Theme Engine v2**):
- **Desempenho como requisito:** orçamento por tema (Lighthouse 90+ no celular, LCP, CLS), imagens responsivas e otimizadas, carregamento lazy, sem JS desnecessário; teste automatizado de desempenho e acessibilidade por tema.
- **Biblioteca de seções e blocos ampliada** (galerias, vídeo, lookbook, comparativos, contadores, avaliações, guia de tamanhos, barra de frete grátis, compre o look, estoque baixo, prova social, menu grande, quick view, filtros e ordenação avançados) com **animações e microinterações** sóbrias e desligáveis (`prefers-reduced-motion`).
- **Sistema de design do tema:** tipografia, cores, raios, espaçamentos e componentes por configuração global; predefinições por segmento (moda feminina, masculina, infantil, esportiva, acessórios, atacado).
- **Editor:** comparação lado a lado, histórico com desfazer, atalhos, prévia em 4 larguras, "publicar agendado", duplicar tema, importar/exportar tema.
- **Theme Store aberta:** designers e agências publicam temas com revisão automática (contraste, desempenho, seções válidas) e manual, repasse configurável, versões e atualização segura para as lojas.
- **Conjunto inicial de 8 a 12 temas** ordenados do mais barato ao mais caro (grátis, básico, esportivo, editorial, luxo, atacado, infantil, ofertas).
**Aceite:** os temas pagos batem a régua de desempenho e acessibilidade do CI, o lojista troca de tema sem perder conteúdo, e um tema de terceiro passa pela revisão e é instalado com 1 clique.

### 5.3 Atacado (B2B) — onda 2
Reaproveita `product_packs`, `saleType WHOLESALE`, pedidos e importação. Construir:
- **Cliente atacadista:** cadastro com CNPJ/CPF, aprovação manual ou automática, grupos (bronze, prata, ouro), crédito e prazos configuráveis.
- **Preço:** faixas por quantidade, tabela por grupo e por cliente, preço oculto para visitante, catálogo de atacado separado do varejo, **pedido mínimo** (valor e peças), **grade por cor e tamanho**, kit e caixa fechada.
- **Compra:** pedido rápido por planilha ou SKU, reposição de pedido anterior, cotação por WhatsApp, carrinho de atacado com regras de mínimo e frete por peso, condições de pagamento (Pix, cartão, boleto, faturado com aprovação).
- **Vendedor e representante:** pedido feito pelo vendedor em nome do cliente, comissão de representante.
- **Painel do atacadista** (histórico, segunda via, reposição).
**Aceite:** uma loja do Brás vende no varejo e no atacado no mesmo catálogo, com preço por faixa, mínimo, aprovação de cliente e pedido por planilha, sem quebrar o varejo.

### 5.4 Influenciadores — onda 2
Reaproveita `partners` (links, cupons, livro-razão, garantia, saque, antifraude) e eventos de pedido. Construir:
- **Papel `INFLUENCER`** e cadastro com perfil (redes, nicho, audiência) e termos versionados.
- **Programa por loja:** o lojista convida influenciadores, define **comissão por venda** (percentual e regras por categoria), prazo de garantia e cupom; o influenciador pode ter **vitrine própria** (`/i/<nome>` com seleção de produtos e link rastreável).
- **Atribuição:** cupom do influenciador tem prioridade, depois o último link (cookie); comissão sobre valor pago de produtos (sem frete), estorno devolve.
- **Painel do influenciador:** cliques, vendas, comissão em garantia e disponível, extrato, saque; **painel do lojista** com desempenho por influenciador, aprovar, pausar e pagar; visão do Master.
- **Antifraude e conformidade:** autoindicação, cupons vazados, taxa de estorno; contrato simples e emissão de RPA/nota (fora de escopo automático, com orientação).
**Aceite:** o lojista convida um influenciador, este vende com cupom e link, a comissão nasce em garantia, vira disponível e é sacada; estorno desfaz.

### 5.5 Feed e Live Shop — onda 3
Novo módulo, sem equivalente hoje. Construir:
- **Feed de compra:** rolagem vertical de vídeos curtos e fotos com produtos marcados, "comprar" direto para o carrinho, curtir e salvar, seção de tema que exibe o feed da loja e um **feed da plataforma** (descoberta entre lojas, com regras de curadoria).
- **Live:** agendamento e página da live, produtos fixados durante a transmissão, compra dentro da live, chat com moderação, replay com produtos, notificação aos inscritos (com consentimento).
- **Tecnologia:** provedor de vídeo terceirizado (upload e transcodificação, transmissão ao vivo) por interface `VideoProvider`; custos e limites por plano; moderação e denúncia; LGPD e direitos de imagem.
- **Influenciadores + live:** o influenciador apresenta produtos da loja com comissão automática.
**Aceite:** uma loja publica vídeos com produto marcado no feed e faz uma live de teste em que 2 pedidos são pagos durante a transmissão; o replay mantém os produtos.

### 5.6 Parceiros (afiliados) — pronto
Já implementado (D30): links, cupons, faixas, garantia, saque, Master. Ajustar textos para a marca nova e considerar comissão por **planos NextLevel Commerce**.

### 5.7 Serviços e Theme Store da NextLevel
Loja NextLevel pública e CRM prontos. Acrescentar produtos: implantação da loja, migração de plataforma, criativos, gestão de tráfego, tema sob medida.

### 5.8 SuperDrop como módulo
Mantém rede de fornecedores, carteira, expedição, estoque mínimo e comissão de canal, atrás de `dropship` (entitlement). Conectar uma loja a um fornecedor passa a ser **uma ação dentro da loja** (Etapa 2 do modelo de conta).

## 6. PLANOS E MONETIZAÇÃO (tudo em `platform_settings`, valores a validar com o dono)
- **Planos de loja** (Grátis/Teste, Essencial, Profissional, Atacado, Master), com limites de produtos, temas, módulos e equipe; taxa por pedido decrescente por plano.
- **Receitas:** mensalidade, taxa por pedido, Theme Store (venda e repasse), serviços, parceiros (comissão paga), módulos avulsos (Atacado, Influenciadores, Live), volume de vídeo, domínio e e-mail acima da cota.
- **Guardar:** margem de gateway e frete, custo de vídeo, suporte.
Tudo já tem base em `getPriceBook`, `entitlements` e `features`.

## 7. GO-TO-MARKET DO BRÁS
Onboarding assistido (você monta com o lojista), migração de outra plataforma, modelos por segmento, prova social com lojas do Brás, programa de parceiros e influenciadores como canal de aquisição, presença em comunidades e feiras, materiais e vídeos curtos, página de comparação honesta, garantia de teste de 7 dias.

## 8. FASES (cada uma fecha com lint, tipos, testes, build, e2e, capturas, decisão registrada e commit)
- **N0 Fundação de marca e infraestrutura:** `brand.ts` configurável, portal novo com a marca NextLevel Commerce (SuperDrop como módulo), domínios, e-mails de marca, Neon e plano pago, variáveis de produção, redirecionamentos planejados.
- **N1 Conta simples e onboarding:** "Abrir minha loja" sobre `SUPPLIER_OWN` oculto, painel "Minha loja" enxuto, checklist de "no ar", produtos por planilha ou cadastro.
- **N2 Frete e pagamentos:** cotação por CEP, etiqueta pela API, `PaymentProvider`, cupom de desconto, boleto opcional.
- **N3 Tema Engine v2 e temas:** régua de desempenho e acessibilidade no CI, novas seções, 8 a 12 temas, editor melhorado, Theme Store para terceiros.
- **N4 Crescimento da loja:** SEO, páginas e blog, pixels e API de conversões, carrinho abandonado, avaliações, domínio próprio assistido.
- **N5 E-mail em três camadas:** executar `email-transacional.md` (E0 a E8) com a marca da loja.
- **N6 Fornecedor 360 e Master:** executar `fornecedor-360-master.md`; painel 360 também para lojas independentes.
- **N7 Atacado B2B:** seção 5.3.
- **N8 Influenciadores:** seção 5.4.
- **N9 Feed e Live Shop:** seção 5.5.
- **N10 Modelo geral (`seller`) e SuperDrop como módulo:** seção 4, etapa 2, com migração e regressão completa.
Lançamento comercial ao fim de **N4** (com N5 em paralelo); N7 a N9 chegam como módulos pagos.

## 9. DECISÕES QUE VOCÊ DEVE PROPOR COM PADRÃO RECOMENDADO (não bloqueie; registre em D33)
| # | Ponto | Padrão recomendado |
|---|---|---|
| 1 | Marca principal | NextLevel Commerce; SuperDrop vira módulo e marca própria de dropshipping |
| 2 | Modelo de conta na primeira onda | Conta simples sobre `SUPPLIER_OWN` oculto; `seller` na etapa 2 |
| 3 | Domínios | `nextlevelcommerce.com.br` (produto), `app.` (painéis), `{loja}.nextlevelcommerce.com.br` (lojas), `superdrop.com.br` mantido |
| 4 | Gateway inicial | Mercado Pago; adaptadores depois, na ordem Pix direto, Asaas, Stripe |
| 5 | Frete | SuperFrete e Melhor Envio por adaptador; Correios depois |
| 6 | Vídeo e live | Provedor terceirizado; começar por vídeo curto (feed) e só então live |
| 7 | Repasse de temas de terceiros | Configurável; padrão 70% para o designer |
| 8 | Atacado | Mesmo catálogo, preço por faixa e por grupo, aprovação manual por padrão |
| 9 | Influenciador | Comissão definida pelo lojista dentro de faixa mínima e máxima da plataforma |
| 10 | Nota fiscal | Fora do lançamento; integração com emissor na fase própria |
| 11 | Hospedagem | Render pago com Neon, sempre ligado; reavaliar por custo depois de 100 lojas |
| 12 | Idioma e moeda | pt-BR e BRL; estrutura pronta para outros |

## 10. MÉTRICAS DE SUCESSO
Ativação: % de lojas que publicam e recebem o 1º pedido em 7 dias. Tempo até a 1ª venda. Receita por loja (mensalidade + taxa). Retenção em 30 e 90 dias. Nota de desempenho dos temas. % de pedidos de atacado e de influenciador. Taxa de entrega de e-mail. Chamados por loja. Custo de suporte por loja.

## 11. RISCOS E MITIGAÇÃO
Escopo enorme (ondas e módulos pagos); concorrência forte (foco em nicho e em diferenciais); vídeo e live com custo (provedor, cotas, plano à parte); fiscal e legal (revisão jurídica e contábil antes de abrir); marca (INPI antes de investir); dívida do modelo de conta (etapa 1 rápida, etapa 2 planejada); infraestrutura (Neon, plano pago, monitoramento); suporte (autoatendimento, materiais, onboarding assistido).

## 12. ACEITE GERAL DA PRIMEIRA ONDA
Um lojista novo abre a loja em **nextlevelcommerce.com.br**, escolhe um tema de alto nível, importa produtos, configura frete real e Pix, publica e vende; recebe e-mails profissionais, acompanha tudo no painel, e o Master enxerga receita e saúde de todas as lojas. O portal, os painéis e os e-mails falam **NextLevel Commerce**; o SuperDrop continua no ar como módulo. Testes, build, acessibilidade e desempenho no verde.

## 13. FORA DE ESCOPO DA PRIMEIRA ONDA
Marketplace com carrinho único entre lojas, app nativo, ERP completo, nota fiscal automática, multi-idioma, programa de afiliados em cascata, comparação de preço entre lojas.
