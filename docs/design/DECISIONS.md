# Decisões de design e produto

Registro de decisões tomadas durante a evolução visual. As decisões D1 a D7 do prompt foram aceitas pelo dono e valem como estão. Abaixo, o que foi decidido além delas.

## Geral

- **E1.** Nenhum material da Natural GO foi entregue. A linguagem visual parte dos princípios descritos e evolui neles, sem afirmar cópia de nada.
- **E2.** Temas por painel são aplicados por atributo `data-panel` no contêiner do shell. O atributo troca acento, densidade e raio, sem duplicar componentes.
- **E3.** Modo claro e escuro completos. A preferência fica em `localStorage` (`nl-theme`) e respeita `prefers-color-scheme` quando não há escolha. Um script inline evita o flash de tema.
- **E4.** Fontes locais do sistema como base, com uma família de exibição carregada de forma segura para build offline. Nada depende de rede em runtime.
- **E5.** A paleta de gráficos continua validada pelo script do skill dataviz, com legenda e visão em tabela.

## Domínio

- **E6.** O livro-razão da recarga registra saldo por par fornecedor e lojista. O saldo é uma coluna derivada e conferida contra a soma das entradas em teste.
- **E7.** O débito do pedido usa bloqueio de linha na conta (`FOR UPDATE`), o que evita gasto duplo em transações concorrentes.
- **E8.** Pedido sem saldo permanece em `AWAITING_CENTRAL_PAYMENT`, exibido como "Aguardando recarga". O prazo de 72 h vira configuração do fornecedor.
- **E9.** Etiquetas ficam no banco atrás de `LabelStorage`, trocável por S3 sem mudar o domínio.
- **E10.** O papel de expedição recebe um DTO sem nenhum campo monetário. Um teste varre as chaves da resposta.
- **E11.** Gates por oferta vivem em `OFFER_FEATURES` e são validados no domínio, não só na interface.
- **E12.** O checkout de serviços fica como registro de intenção, como definido. O pedido e o pipeline funcionam de ponta a ponta.

## D8. Cobrança da NextLevel e add-ons (U1)
- Faturas próprias (setup, mensalidade, fechamento, add-ons, serviços) são pagas por Pix na conta Mercado Pago da NextLevel (`platform_settings.nextlevel_mp`, token criptografado). Webhook consulta a API, confere referência e valor e quita a fatura de forma idempotente.
- Add-ons (Academy do lojista, Suporte Premium, Relatórios avançados, Assento extra de expedição) viram `entitlements` quando a fatura é paga; renovar soma o período. Preços em `price-book.addons` (propostas, marcadas "a validar").
- O racional de cada preço é gerado a partir da tabela vigente (`rationale.ts`), com economia unitária e alerta de margem abaixo da meta.
- `domain_events` (com `dedupeKey`) registra fatos relevantes; automações e fila do dia (U7) leem daí.
- Régua de cobrança: aviso in-app em D-3, D0, D+3, D+7 do vencimento, uma vez por fatura e marco.

## D9. Esteira, corte e expedição (U2)
- O horário de corte é por fornecedor e por dia da semana, com fuso e feriados (`supplier_ops`). Pedido liberado (custo debitado) antes do corte sai no mesmo dia; depois, no próximo dia útil. A lógica é pura (`cutoff.ts`) e testada nas bordas (corte exato, virada de dia local, feriado, fim de semana).
- Esteira ao vivo: SSE em `/api/live/orders` (encerra em ~4 min e o cliente reconecta) com fallback de polling a cada 8 s. A "versão" é um resumo de pedidos, claims, ondas e impressões do fornecedor.
- Um funcionário por pedido: `order_claims` (uma linha por pedido, expira em 30 min). O gestor pode liberar.
- Onda = conjunto de pedidos prontos com etiqueta, impresso junto: um PDF único de etiquetas e uma lista de separação agrupada por produto e variação.
- A expedição usa uma esteira sem qualquer campo monetário (teste varre as chaves do DTO) e não vê pedidos aguardando recarga ou etiqueta.
- Assentos de expedição: 2 na base, +1 por add-on `EXTRA_DISPATCH_SEAT` ativo.
- A antiga tela `/supplier/shipping` redireciona para `/supplier/dispatch`.

## D10. Rodada visual: portal, Lite, Pro e Loja NextLevel
- **Portal público** em `src/app/(portal)` (grupo de rotas): `/`, `/como-funciona`, `/fornecedores`, `/planos`, `/faq`. Conteúdo em `content.ts`, só com valores confirmados em `docs/PLANOS.md`; a mensalidade do membro fica sem preço até a decisão. Quem já tem sessão em `/` segue para o painel.
- **Lite (F6):** a home abre com o saldo e um botão dominante de recarga; se há pedidos pagos esperando saldo, mostra quanto falta.
- **Pro (F7):** `/merchant/analytics` (recurso `analytics`, com cartão de upgrade nas outras ofertas). Cálculo puro em `analytics.ts` (vendas, margem, ticket, canais, campeões, recorrência, comparação com os 30 dias anteriores). O editor de aparência ganha prévia em três larguras (computador, tablet 768 px, celular 390 px) para quem tem `appearanceAdvanced`.
- **Menu com cadeado:** itens do lojista cujo recurso a oferta não libera aparecem com cadeado (`MERCHANT_GATES` em `role-layout.tsx`), nunca escondidos.
- **Loja NextLevel (F8):** o pedido de serviço de ponta a ponta (`service_orders`) vale para lojista e fornecedor: catálogo por público, recomendações com motivo (`recommendServices`), pedido com briefing, andamento em cinco etapas e conversa. Master orça e conduz em `/master/services` e abre a conversa em `/master/services/[id]`. Upgrades para uma oferta que o lojista já tem não são oferecidos. O destaque "Recomendado para você" aparece nas telas iniciais do lojista e do fornecedor; o Master vê a fila no cartão "Loja NextLevel". O registro simples de "interesse" (`service_leads`) deixou de ser usado pela interface.
- **Verificação:** `e2e/visual-round.mjs` cobre portal, Lite, Pro, gate, prévia 390 px e o fluxo de serviço (lojista e fornecedor pedem, Master orça, lojista vê o orçamento).

## D11. Identidade visual SuperDrop
- Logo oficial em `public/brand/`: `superdrop-logo-light.png` (texto preto, para fundos claros), `superdrop-logo-dark.png` (texto branco com brilho, para fundos escuros), e os símbolos `superdrop-mark*.png`. O componente `Logo` (`src/components/brand/logo.tsx`) escolhe a versão pelo tema (`tone="auto"`) ou a fixa para fundos que não mudam (`on-dark`, `on-light`).
- Aplicada no cabeçalho, rodapé e destaques do portal; login; menu lateral (símbolo no topo, logo completa no rodapé; Master usa a versão escura); cabeçalho da expedição; página do fornecedor (rodapé "Tecnologia SuperDrop"); rodapé das lojas (só ofertas sem "sem selo SuperDrop", ou seja, fora da Loja Própria); página 404.
- Favicon (`src/app/icon.png`), ícone de celular (`apple-icon.png`) e imagem de compartilhamento (`opengraph-image.png`, 1200x630) usam a marca. O título das abas e a descrição padrão passaram a ser "SuperDrop".
- Não recebem a marca: etiquetas de transportadora (são do SuperFrete) e o painel do fornecedor, que continua com o nome do fornecedor no topo do menu.

## D12. Decisões do dono para o novo nível visual (v3)
- Aceitas as recomendações do racional (`docs/design/RACIONAL-VISUAL-V3.md`, seção 6): padrões de administração no estilo Polaris e arquitetura de temas Online Store 2.0, **sem depender de código ou serviço da Shopify**, com identidade própria; motor de temas em React com seções e blocos em JSON; portal e V0 antes do P1.
- **Temas:** Starter grátis (básico, mas melhor que o atual). **Três temas pagos, instalação com 1 clique: R$ 299, R$ 699 e R$ 1.499**, os mais próximos possível dos temas da Shopify. Compra por fatura Pix da NextLevel.
- **Conteúdo:** o dono fornece manualmente logos e fotos dos fornecedores. Até chegarem, os modelos usam conteúdo demonstrativo identificado.

## D13. V0: design system v3
- Componentes em `src/components/ds` (`Page`, `TwoColumn`, `Breadcrumbs`, `Banner`, `ContextualSaveBar`, esqueletos, `IndexList`, `MediaGallery`, campos: `ColorField`, `RangeField`, `SlugField`, `SearchPreview`, `RichTextLite`, `FontPicker`, `LinkPicker`, `ResourcePicker`, `KeyboardHint`) e lógica pura em `src/lib/ds` (cor e contraste, texto seguro, consulta de lista, fontes). Vitrine em `/dev/design`.
- **Acessibilidade verificada com axe** (WCAG A e AA) nos quatro climas e no tema escuro, com E2E em `e2e/design-v3.mjs`.
- **Correções de contraste encontradas pelo axe:** novo token `--on-accent` (texto sobre preenchimento de destaque; escuro no Master), `--danger-foreground`, `--link`; verde do Lite e da marca escurecido para `#0d803e` (branco sobre ele passa de 3,4 para 5,0); texto de destaque passou a usar `accent-foreground`; itens de menu e botões com preenchimento usam `on-accent`.
- **Defeito de tema corrigido:** no painel do fornecedor, no modo claro padrão, os tokens escuros de "destaque suave" eram aplicados por um seletor sem a proteção da preferência de tema escuro. Agora todos os painéis seguem o botão de tema e a preferência do sistema.
- Markdown leve (`renderMarkdownLite`) escapa todo HTML e só aceita links `http`, `https`, `mailto`, `tel` e caminhos: não há HTML vindo do usuário.

## D14. V6: portal superdrop.com.br
- Home em nove blocos (`src/app/(portal)/page.tsx`): herói com **esteira ao vivo de demonstração** (dados simulados, pausa com o mouse, estática com "reduzir movimento"), fornecedores do lançamento, problema e promessa, **como funciona** em cinco passos com a tela de cada um, painéis por papel (Master, Fornecedor, Expedição, Membro) usando o clima real de cada painel, loja e temas (Starter grátis e os três pagos, marcados como "lançamento em breve"), operação, **calculadora de venda**, como começar o teste de 7 dias, perguntas frequentes e chamada final.
- **Calculadora** (`src/lib/portal/calculator.ts`, testada): só usa regras confirmadas (taxa do membro 5% Drop manual e loja básica, 3% Loja própria, sobre o valor dos produtos sem frete; taxa do fornecedor 3% SuperDrop e 1,5% White Label). Exemplo do dono: cliente 100, membro paga 70 ao fornecedor, loja básica: taxa 5,00, sobra 25,00.
- O portal é sempre claro (`ForceLight`): fixa o tema claro enquanto está na tela e devolve o do usuário ao sair.
- Sem número ou depoimento inventado: fornecedores aparecem só pelo nome, sem logos até o dono enviar. Mensalidade do membro continua sem preço (decisão pendente).
- **Desempenho e qualidade** (Lighthouse contra o build de produção): desktop 100/100/100/92→100; celular **desempenho 94–95**, acessibilidade 100, boas práticas 100, SEO 100. Ganhos: logo em WebP (de 100–180 KB para 15–20 KB), versão escondida (claro ou escuro) não é baixada, ícone da aba de 130 KB para 10 KB, endereço canônico com `metadataBase` (`NEXT_PUBLIC_SITE_URL`), fonte de títulos com `display: optional`.
- E2E em `e2e/portal-v6.mjs`: interação (passos com teclado, painéis, temas, calculadora), axe sem violações graves no desktop e no celular, sem rolagem horizontal em 4 larguras.
- Os CTAs levam a "Como começar" (cupom do fornecedor) até o cadastro público existir (P1). As páginas dos fornecedores entram na V7.

## D15. V3: motor de temas
- **Modelo (Online Store 2.0, adaptado):** `src/lib/themes`. Um tema é um conjunto de **seções** (esquemas puros em `sections.ts`, componentes React em `components/storefront/sections`) organizadas em **modelos JSON** por página (`Template`: seções por id, ordem, blocos, ocultas) mais **estilo global** e dois **grupos globais** (cabeçalho e rodapé). Tipos de configuração: texto, texto longo, texto formatado, imagem, cor, faixa, número, seleção, caixa, link, produto, coleção e fonte.
- **Segurança e robustez:** `normalizeTemplate` nunca lança erro por conteúdo do usuário: remove tipos desconhecidos, seções no local ou página errados e duplicatas de seção única, limita seções (40) e blocos (24), corrige valores (cor, faixa, seleção, link, imagem) e é idempotente. Links `javascript:` e endereços iniciados por `//` são recusados; texto formatado escapa todo HTML.
- **Operações puras do editor:** adicionar, remover, mover, duplicar, ocultar seções; alterar configuração; adicionar, remover, mover e editar blocos. Todas devolvem modelos válidos (base do editor da V4).
- **Banco:** migração `0009_theme_engine` com `theme_templates` (rascunho e publicado por loja e página), `theme_globals` e `theme_template_versions` (últimas 20 publicações). **Nada é migrado**: sem modelo salvo, a loja usa o tema atual convertido em memória (`templateFromLegacy`, `legacyGlobals`), então as lojas existentes continuam iguais e o formulário atual de aparência segue funcionando.
- **Regras por oferta (no domínio, não só na tela):** editar textos e cores exige `appearanceBasic`; mudar a **estrutura** (adicionar, mover, ocultar seções) e a tipografia, cantos e botões exige `appearanceAdvanced` (Loja própria); seções `premium` exigem `templatesPremium`. Só o dono da loja e o Master editam; fornecedor e outras lojas são recusados. Publicar as cores do estilo atualiza as cores da loja.
- **Prévia do rascunho:** cookie `nl-preview` que o editor liga; só vale para o dono da própria loja ou o Master (`isPreviewMode`). O público vê sempre o publicado.
- **Renderização:** a página inicial e o cabeçalho e rodapé da loja passam a ser desenhados pelas seções, cada uma dentro de um contêiner `display: contents` com `data-section-id` (o editor localiza sem mexer no layout). `planProducts` reparte os produtos entre vitrines e grades sem repetir, com a mesma regra da loja anterior.
- **Prova de que nada mudou:** capturas das três lojas de demonstração, em desktop e celular, antes e depois: **0,000% de pixels diferentes** e alturas idênticas.
- **Fora desta fase:** páginas de produto, coleção e carrinho seguem como estavam (modelos vazios); entram com os temas na V5. As seções `hero` (3 formatos) e demais já cobrem o que a loja tinha.

## D16. V4: editor de tema
- **Rota** `/theme-editor` (tela cheia, fora do menu do painel, com o clima do painel do lojista). O item "Aparência" do menu virou "Editor do tema"; `/merchant/appearance` redireciona para ele e o formulário antigo foi removido. Drop manual (sem loja virtual) é levado ao upgrade.
- **Três painéis:** árvore de seções (cabeçalho, página, rodapé, com blocos aninhados), prévia ao vivo em iframe (computador, tablet 768 e celular 390 px, largura exata) e configurações **geradas do esquema** com os campos da V0 (cor com contraste, faixa, fonte, link, produto, texto formatado). Em telas pequenas os painéis viram abas.
- **Ao vivo:** o editor salva o rascunho automaticamente (700 ms depois da última edição, só o que mudou) e manda `postMessage` para a prévia, que faz `router.refresh()` sem recarregar. A ponte (`PreviewBridge`) só existe com o cookie de prévia do dono: clicar na loja seleciona a seção, passar o mouse a destaca, e só aceita mensagens do mesmo site.
- **Rascunho e publicação:** "Rascunho salvo" / "Alterações não salvas" / erro com nova tentativa; **Publicar** grava as páginas e o estilo e cria versão no histórico; **Histórico** restaura uma versão no rascunho (o dono revisa e publica); **Descartar** volta ao publicado. Desfazer e refazer (Ctrl Z, Ctrl Shift Z) com junção da digitação em um passo, até 100 passos; Ctrl S salva.
- **Ofertas:** Loja SuperDrop edita textos e cores; adicionar, remover, mover, ocultar e duplicar seções, blocos, fontes, cantos e botões ficam bloqueados (botões desabilitados com aviso e caminho de upgrade); a regra também vale no servidor. Loja própria tem tudo.
- **Acessibilidade:** axe sem violações graves no desktop e no celular; botões só com ícone têm nome (rótulos visíveis a partir de certa largura), estado de salvamento em região `status`.
- **E2E** `e2e/theme-engine.mjs` e `e2e/theme-editor.mjs` (edição ao vivo, publicar, reordenar, desfazer, adicionar seção, clicar na prévia, estilo, largura 390, histórico, Lite bloqueado, Drop manual). Testes unitários do estado do editor (histórico, seleção, mudanças).
- Correção encontrada pelo E2E: a ponte causava erro de hidratação por decidir no render se estava em iframe; agora decide depois de montar.

## D17. V5: temas pagos e loja de temas
- **Quatro temas** no catálogo (`src/lib/themes/catalog.ts`): Starter (grátis, reescrito em seções), **Arena** R$ 299, **Editorial** R$ 699 e **Signature** R$ 1.499. Licença **permanente** por loja; direitos `THEME_ARENA|EDITORIAL|SIGNATURE`.
- **Compra pela NextLevel:** fatura do tipo ADDON gerada por `buyThemeAction`, paga por Pix; `fulfillPaidInvoice` concede o direito. A chave de deduplicação impede duas faturas abertas do mesmo tema.
- **Instalar com 1 clique:** `installTheme` guarda um ponto no histórico ("Antes de instalar X"), publica as quatro páginas e os globais do tema, ajusta cores da loja e preserva título, subtítulo, botão, aviso e rodapé. Dá para voltar pelo histórico do editor.
- **Ver com os meus produtos:** cookie `nl-try-theme`, válido só para o dono da loja; o público nunca vê. Prévia em iframe com 3 larguras.
- **Nada mudou para quem já tem loja:** capturas de páginas iniciais, catálogo, categoria, produto e carrinho das três lojas de demonstração (desktop e celular) idênticas byte a byte.
- **Testes:** `tests/theme-install.test.ts`, `tests/theme-engine.test.ts`, `tests/theme-render.test.tsx`, e2e `e2e/theme-store.mjs` (comprar, pagar em demonstração, instalar, público muda, prévia não vaza).
- **Pendente:** logos e fotos reais (conteúdo de demonstração marcado); Master conceder cortesia de tema.

## D18. V1 (primeira entrega): casca e início do lojista
- **Referência:** capturas de um painel concorrente (escuro, celular) enviadas pelo dono; adotamos só os **padrões de uso**, com identidade SuperDrop e sem marca nem assets de terceiros.
- **Menu lateral agrupado** (Vendas, Catálogo, Loja virtual, Financeiro, Conta; Operação/Rede/Negócio no Master e no Fornecedor) com títulos de seção; recolhido vira divisores.
- **Celular:** barra de atalhos **flutuante em pílula** (3 atalhos + Mais) no lugar da barra colada na borda.
- **Menu do perfil** mostra papel e loja, com atalho para a loja virtual.
- **Início do lojista:** saudação por horário, KPIs com **variação contra os 30 dias anteriores**, gráfico de **vendas por dia** (SVG próprio, com texto alternativo).
- **Gaveta de pedido** ("Ver" na lista, para Lojista, Fornecedor e Master): produtos, total e histórico sem sair da lista; leva ao pedido completo.
- **Acessibilidade:** `--sidebar-muted` do tema claro escurecido (contraste AA); botão de troca de perfil com nome. `e2e/panels-v1.mjs` (axe desktop e celular).
- **Ainda na V1:** personalizar o início, mapa de calor por dia/hora, clientes por estado, visões salvas nas listas de pedidos/produtos/lojas, Master e Fornecedor com o mesmo tratamento do início.

## D19. V2: editor de produto
- **Layout em duas colunas** (`TwoColumn`): principal com informações, fotos, tamanhos/estoque e SEO; lateral com status, **prévia do cartão na loja (ao vivo)**, preços com margem, margem % e markup, como vende e distribuição.
- **Fotos** com a `MediaGallery` da V0: enviar ou soltar arquivos, arrastar para ordenar (ou Alt + setas), primeira é a capa, até 6; a mesma galeria na edição.
- **Variações em matriz** com modelos prontos (P ao GG, P ao XGG, infantil, único), SKU da variação calculado e coluna de grade.
- **SEO** (`seo_title`, `seo_description`, migração 0010): prévia do resultado do Google ao vivo; a página do produto na loja usa esses campos (ou nome e descrição) nos metadados.
- **Rascunho automático** do formulário novo no navegador (sem as fotos), com aviso para recuperar ou descartar; "Salvar como rascunho" grava o produto como rascunho; aviso ao sair com alterações.
- **Duplicar** (rascunho, sem estoque, SKU `-COPIA`, copia variantes, grade e SEO), **arquivar/reativar** e **edição em lote de status** na lista (busca, filtros, visões salvas, ordenação, seleção em lote pela `IndexList`).
- **Testes:** `tests/product-editor.test.ts`; e2e `e2e/product-editor.mjs`. Total unitário: 297.
- **Fora desta entrega:** opções além de tamanho (cor), histórico de alterações do produto, edição em lote de preços.

## D20. V7: páginas de Alpha Outfit e MantosShop
- **Modelo único** `/f/[slug]` elevado: logo e foto de destaque do fornecedor (`logo_url`, `hero_url`, migração 0011), prova social, botão fixo de WhatsApp no celular (quando houver número), SuperDrop discreto no rodapé; custo nunca aparece.
- **Conteúdo demonstrativo marcado** (`demo_content`): faixa "conteúdo a fornecer" no topo e depoimentos-espaço até o dono enviar logos, fotos e depoimentos reais. Os arquivos de logo vão em `public/brand/suppliers/<slug>.png` e o endereço é preenchido em `logoUrl`.
- **Fornecedores de demonstração** `alpha-outfit` e `mantosshop` (`src/db/demo-suppliers.ts`), criados só no seed de demonstração, com 4 produtos genéricos cada. Cupons `ALPHA7` e `MANTOSSHOP7` aparecem nas dúvidas frequentes como "em breve"; o cadastro com cupom e teste de 7 dias fica para o P1.
- **Testes:** `tests/supplier-page.test.ts` (sem custo, idempotência), e2e `e2e/supplier-pages.mjs` (3 larguras, sem rolagem horizontal).

## D21. Decisões de negócio do dono (para o P1)
- **Cartão em 1x:** acréscimo de **6%** cobrado do cliente.
- **Mensalidades dos membros:** mantidos os valores atuais (Drop manual R$ 49, Loja SuperDrop R$ 97, Loja própria R$ 197).
- **R$ 2.400 de setup:** **não** é benefício de lançamento (é cobrado normalmente).
- **Comissão dos fundadores:** vale por **tempo indeterminado**.
- **Teste de 7 dias:** todas as funcionalidades liberadas. Ao acabar sem pagamento, o **acesso é bloqueado** e a tela mostra em destaque como pagar: **QR code Pix e contato do suporte em todos os cantos**. O **pagamento libera o sistema automaticamente**.
- **Ainda em aberto:** logos e fotos de Alpha Outfit e MantosShop, WhatsApp de cada um, depoimentos reais.

## D22. P1: teste de 7 dias, bloqueio, cadastro com cupom e Pix
- **Acesso da loja** (`store-access.ts`): `trial_ends_at` e `paid_until` na loja. Sem as duas datas não há regra (contas antigas e de demonstração seguem livres). Teste vigente = tudo liberado; depois, **bloqueio total** do painel, do editor e da loja pública, que só mostram a tela de pagamento. A criação de pedidos também é recusada.
- **Tela de bloqueio:** fatura por Pix com QR code aberto sozinho, passo a passo, **suporte nos quatro cantos** (`NEXT_PUBLIC_SUPPORT_WHATSAPP` e `NEXT_PUBLIC_SUPPORT_EMAIL`). O setup em aberto vem primeiro; depois o plano (preço de lista × meses, sem desconto por ciclo). **Pagar libera sozinho** (`fulfillPlanInvoice`).
- **Cupom** (`coupons`): pertence ao fornecedor (atribuição), 7 dias, limite opcional; **um teste por CPF/CNPJ** válido (`trial_claims`). Fornecedor cria cupons e copia o link `/cadastro?cupom=CODIGO`; Master ou fornecedor **prorrogam** (+3 dias). Migração 0012.
- **Cadastro público** `/cadastro`: cria a loja na rede do fornecedor do cupom, o dono escolhe a senha, o teste começa e entra direto no painel.
- **Checkout das lojas somente Pix:** preferência do Mercado Pago exclui cartão, débito, boleto, caixa eletrônico e saldo. Cartão em 1x (+6%) fica para a cobrança dos planos, quando houver cartão. (Na E-commerce, substituída por D178: Pix e cartão em até 6x.)
- **Alpha Outfit e MantosShop:** logos, WhatsApp (Thiago e Alex) e cupons `ALPHA7` e `MANTOSSHOP7` aplicados. Em produção, `applyLaunchBranding` aplica a marca, o WhatsApp e o cupom assim que o Master cadastrar os dois fornecedores (slugs `alpha-outfit` e `mantosshop`).
- **Ainda do P1:** taxa por pedido e fechamento mensal, e-mail transacional e recuperar senha, cobrança automática recorrente, comissão dos fundadores, Academy, termos com aceite versionado.

## D23. Portal para quem vende, página própria para fornecedores e checkout de plano
- **Home, Planos e Como funciona** falam só com **quem vende**: loja sem estoque, planos com preço da tabela e botões **Assinar por Pix**, **Criar minha loja** e **Área de membros** (login) no topo, no rodapé e nas páginas dos fornecedores.
- **Fornecedores** têm página exclusiva `/seja-fornecedor` (oportunidade de negócio, painéis, operação, modelos SuperDrop e White Label, como se tornar fornecedor). `/fornecedores` redireciona. O contato usa o WhatsApp ou e-mail do suporte configurados.
- **Checkout rápido:** planos (portal e `/f/[slug]`) levam a `/cadastro?plano=…&fornecedor=…`. Sem cupom, a loja nasce pendente de pagamento e o painel abre direto na tela de Pix com QR code; com cupom começa o teste de 7 dias. **Pagar libera o plano automaticamente** (`paidUntil`).
- **Cobrança única na ativação:** a fatura de ativação já soma setup e primeira mensalidade; depois vêm mensalidades por Pix (preço de lista × meses).
- **Fornecedor obrigatório** no cadastro sem cupom (vem da página do fornecedor ou é escolhido na lista).
- e2e `e2e/checkout-flow.mjs`, `e2e/trial-block.mjs`; testes de cadastro em `tests/store-access.test.ts`.

## D24. Programa de Parceiros Oficiais (decisões do dono e padrões propostos)
- **Vertente 1, afiliados:** vendem a oportunidade de negócio (o sistema pronto) e ganham renda extra por indicação. Painel próprio (escritório virtual) com links rastreáveis, cupons de 7 dias e financeiro com saque.
- **Cadastro gratuito, com meta de 1 ativação por mês.** Comissão sobre o setup: 1 a 4 ativações 15%, 5 a 9 ativações 20%, 10 ou mais 25% (a confirmar o limite de 10). Manutenção fixa de 5% sobre as mensalidades.
- **Decidido:** 10 ou mais ativações = 25%. Parceiro sem ativação no mês fica inativo, **paga R$ 100 por mês** para continuar captando e **continua recebendo as mensalidades (manutenção)**. Saque só **depois do período de garantia**. Outras vertentes ficam para outro momento.
- Padrões propostos (a confirmar): faixa por mês civil com ajuste no fechamento; manutenção enquanto o indicado pagar; atribuição por cupom ou último link em 30 dias; comissão de um nível só; o cliente do link do parceiro escolhe o fornecedor na lista.
- Prompt completo em `docs/prompts/programa-parceiros.md` (fases PA0 a PA7).
- Rodapé das páginas públicas passa a mostrar a logo NextLevel e "SuperDrop é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda." (`NextLevelSignature`).

## D25. S1: grades de tamanho, estoque mínimo, importação por planilha e cadastro de produto
- **Grades** (`size-grids.ts`): adulto masculino e adulto feminino (P, M, G, GG, XX1, 2XL) e conjunto infantil (18, 20, 22, 24, 26, 28), mais personalizada. O produto guarda `size_grid`. Os rótulos seguem o que o dono escreveu; se "XX1" for outro nome, é só trocar em `size-grids.ts`.
- **Estoque mínimo por tamanho** (`supplier_ops.min_activation_stock`, padrão 4, configurável em Corte e operação): a loja só ativa o produto se todos os tamanhos tiverem o mínimo disponível; "Ativar todos" pula os que não têm. Aviso no painel do membro e no cadastro.
- **Peso e medidas** do produto (padrão 300 g, 30 x 25 x 3 cm) para cotação de frete.
- **Importação:** Excel (.xlsx, exceljs) e CSV, modelo .xlsx com listas suspensas e instruções, cabeçalhos com apelidos, estoque único, na ordem ou por nome de tamanho, grade, SEO, peso, status; **conferência antes de gravar** (criar, atualizar, ignorar, erros e avisos por linha), SKU repetido ignorar ou atualizar (atualizar não mexe em estoque), download dos erros, limite de 500 linhas.
- **Cadastro individual:** botões de grade, mesmo estoque em todos os tamanhos, aviso de estoque mínimo, sugestão de preço por margem (40, 50, 60%), embalagem e frete.
- Testes `tests/product-import.test.ts`, e2e `e2e/product-import.mjs`.

## D26. S2 e S3: faturas do fornecedor, loja própria, Mercado Pago único, plataforma de envio e estoque
- **Faturas do fornecedor** (`/supplier/invoices`): em aberto, vencidas, situação do acesso, Pix em um toque, régua explicada. Aviso no painel quando há vencida ou vence em até 3 dias. **Acesso pausado** mostra a tela de pagamento com QR code aberto sozinho (várias faturas, uma a uma) e **libera na hora** ao pagar. **Prazos flexíveis:** aviso em 3 dias, bloqueio parcial em 15, pausa em 25 e encerramento em 90 (antes 1, 10, 15 e 30).
- **Loja própria do fornecedor** (`stores.kind = SUPPLIER_OWN`): White Label recebe oferta Loja própria (editor completo, temas pagos); SuperDrop básico recebe Loja SuperDrop (subdomínio). Nasce com o catálogo (inativo), tema Starter e um usuário interno; o gestor entra pelo botão "Abrir painel da loja" (troca de contexto sem senha extra) e volta com um clique. Não pede estoque mínimo, não usa carteira (custo interno) e não mostra Saldo e recargas.
- **Mercado Pago único:** o token da carteira do fornecedor é o mesmo da loja própria e é sincronizado ao conectar, trocar ou desconectar; recargas e pedidos externos caem na mesma conta.
- **Plataforma de envio** (SuperFrete ou Melhor Envio): o fornecedor conecta o token, validado na própria plataforma e guardado criptografado. A compra de etiquetas pela API ainda não está ligada (em demonstração há conexão simulada).
- **Estoque é o coração:** todos os canais reservam e baixam no estoque central; "pendências que seguram estoque" na esteira listam pedidos pagos que esperam etiqueta ou saldo, com horas de espera e **cobrança do lojista** por aviso (uma a cada 6 horas), alerta após 12 horas.
- Testes `tests/own-store.test.ts`, `tests/supplier-billing.test.ts`; e2e `e2e/own-store.mjs`, `e2e/supplier-billing.mjs`.

## D27. M1: loja do membro mais confiável e jornada do cliente final
- **Assinatura NextLevel** em todas as lojas (faixa fixa depois do rodapé do tema, não editável): logo NextLevel e "SuperDrop é um sistema de tecnologia desenvolvido pela NextLevel Marketing Ltda.".
- **Credibilidade:** novos dados da loja (razão social, CNPJ/CPF, e-mail e endereço) em Configurações, exibidos no rodapé e em "Sobre a loja e contato"; seções novas **Selos de segurança** (site seguro, Pix, Mercado Pago só se a loja recebe por ele, envio rastreado, troca, atendimento, produto conferido), **Sobre a loja e contato** e **Botão flutuante do WhatsApp**. Todos os temas nascem com selos na inicial, no produto (logo abaixo da compra) e no carrinho.
- **Jornada do cliente:** página pública **Acompanhar pedido** (`/store/[slug]/acompanhar`, número + e-mail da compra; resposta igual para "não existe" e "e-mail diferente"), linha do tempo de cinco etapas (recebido, pago, preparando, enviado com código de rastreio, entregue) na confirmação e na consulta, sem custo nem fornecedor. Link "Acompanhar pedido" no cabeçalho. Cartões mostram "Últimas unidades" com 5 ou menos.
- **Logo e imagens:** envio de imagem (PNG, JPG ou WebP, até 1,5 MB, tipo conferido pelos bytes, 80 por loja) servida em `/assets/[id]` com cache longo; a logo aparece no cabeçalho (altura ajustável); todo campo de imagem do editor ganhou "Enviar".
- **Editor com as quatro páginas** (inicial, produto, catálogo, carrinho), cada uma com prévia própria.
- Migração 0015. Testes `tests/storefront-journey.test.ts`; e2e `e2e/storefront-journey.mjs`.

## D28. T1: temas à venda com cartão em até 6x, Pix com desconto e instalação imediata
- **Preço de lista = valor cheio do cartão** (até 6x). O Pix mostra o mesmo preço com desconto configurável (`billing.pixDiscountBps`, padrão 10%); a conta fica em `src/lib/finance/pricing.ts` (`quote`).
- Botão do card: "Comprar em até 6x de R$ X" abre o checkout NextLevel com as duas formas lado a lado; o cartão é Checkout Pro do Mercado Pago (só crédito, no máximo 6 parcelas) e o Pix usa o QR já existente. Trocar de forma reaproveita a fatura (`switchInvoiceMethod`).
- **Instalação imediata:** ao confirmar o pagamento o tema é liberado e o diálogo "Instalar agora" abre sozinho; no retorno do Mercado Pago (`?pago=`) o estado é sincronizado pela referência externa.
- Em demonstração o cartão é simulado, com aviso "CARTÃO SIMULADO".
- Migração 0016 (`nextlevel_payments.method`, `checkout_url`). Testes `tests/pricing.test.ts`, `tests/theme-install.test.ts`; e2e `e2e/theme-store.mjs`.

## D29. X1: Loja NextLevel pública, CRM, pedidos separados por comissão e escritório virtual
- **Loja NextLevel pública** (`/loja-nextlevel`, metade LP e metade loja): produtos digitais e serviços (`digital_products`, editáveis pelo Master; a semente é conteúdo de partida). Compra em 1 clique sem login: nome, e-mail e WhatsApp; Pix com desconto ou cartão em até 6x (mesmo `quote` dos temas). O pedido tem link secreto de acompanhamento (`/loja-nextlevel/pedido/[token]`).
- **Pagamento:** Pix e Checkout Pro na conta Mercado Pago da NextLevel; confirmação sempre conferida na API (referência e valor), pelo webhook `?order=` ou pelo polling da tela. Sem conta conectada, só a demonstração simula. Pedido igual do mesmo comprador reaproveita a cobrança válida.
- **CRM** (`/master/crm`): funil Aguardando pagamento → Pago → Em contato → Em execução → Entregue (+ Cancelado), anotações, histórico e botão de WhatsApp. `nl_orders.affiliateRef` já guarda a indicação para o programa de parceiros.
- **Pedidos separados** (`/master/orders`): aba "Pedidos das lojas" (margem do lojista e comissão NextLevel atribuída a cada loja) e aba "Pedidos dos fornecedores" (base paga à Central, taxa do contrato, abatimento de comissão de canal e fatura de fechamento), por competência.
- **Escritório virtual** (`/master/office`): assinaturas, ativações, serviços e vendas digitais em abas separadas.
- Migração 0017. Testes `tests/nl-sales.test.ts`, `tests/master-control.test.ts`; e2e `e2e/nextlevel-shop.mjs`.

## D30. A1: Programa de Parceiros (afiliados)
- **Escopo:** só afiliados, vendendo apenas planos NextLevel (sem produtos). `partners.kind` é enum extensível; outras vertentes ficam para depois. Sem comissão em cascata (parceiro não ganha por outro parceiro).
- **Regras vêm de `partner_settings`** (platform_settings, editáveis no Master): faixas 15% (1–4), 20% (5–9), 25% (10+; "acima de 10" foi lido como 10 ou mais para não deixar buraco), manutenção fixa de 5% sobre cada mensalidade, garantia (7 dias), saque mínimo R$ 100 e 1 por semana, taxa de reativação R$ 100, meta de 1 ativação/mês.
- **Faixa por mês civil:** a comissão de setup nasce provisória na faixa do momento; o fechamento do mês (`closePartnerMonth`, dia 1, junto do fechamento financeiro) lança `ADJUSTMENT` positivo ou negativo para a faixa final. Idempotente.
- **Meta e inatividade:** sem ativação no mês o parceiro fica INATIVO (links e cupons pausam; a manutenção e o financeiro continuam). Reativa pagando a taxa por fatura Pix (`PARTNER_FEE`, libera sozinho ao pagar) ou abatendo do saldo, ou ao fazer 1 ativação. Carência: o mês do cadastro não é avaliado.
- **Livro-razão imutável** (`partner_commissions`): pendente → disponível depois da garantia; estorno anula o pendente ou lança débito (saldo pode ficar negativo e bloqueia saque); saque reserva o saldo na hora e recusa devolve. Comissão só sobre valor pago de setup e mensalidade.
- **Atribuição:** cupom do parceiro tem prioridade; senão o último link (cookie `nl-ref`, HttpOnly, 30 dias). Grava na loja no cadastro e nunca muda. Cupom de parceiro deixa o cliente escolher o fornecedor. Autoindicação (mesmo CPF/CNPJ ou e-mail) marca `FRAUD_REVIEW`, sem comissão até o Master decidir. Comparação por dispositivo ficou de fora.
- **Privacidade:** o parceiro vê nome da loja mascarado, etapa e valores; cliques guardam só hashes com sal; chave Pix criptografada; saque só com confirmação de titularidade do CPF/CNPJ (o Master confere ao pagar).
- **Telas:** `/parceiros` (captação com calculadora e faixas), `/parceiros/cadastro`, `/parceiros/termos` (versionados), `/r/[slug]`, escritório virtual `/partner` (início, links com QR, cupons, indicados, financeiro com saque, perfil) e `/master/partners` (lista, detalhe com livro-razão, saques, antifraude, regras, CSV).
- **Pendências assumidas:** upload de materiais pelo Master (por ora textos prontos nos links), e-mail transacional, pagamento de saque por API, revisão jurídica/contábil dos termos e do RPA/nota. Limitador de taxa em memória (por instância).
- Migração 0018. Testes `tests/partners.test.ts`; e2e `e2e/partners.mjs`.

## D31. P1b e V8: taxa por pedido, e-mail transacional, recuperar senha e acabamento
- **Taxa por pedido do membro:** percentual da oferta (`orderFees` na tabela de preços: Drop manual 5%, Loja SuperDrop 5%, Loja própria 3%) sobre o valor dos produtos, sem frete, dos pedidos pagos pelo cliente. Estorno/cancelamento sai sozinho (só conta pago e não cancelado); pedido de teste (provedor DEMO) e loja própria do fornecedor não pagam. No dia 1 o fechamento emite a fatura `STORE_ORDER_FEES` de cada loja (idempotente), paga por Pix como as demais. O lojista vê a estimativa do mês no Financeiro; o Master vê por loja em Pedidos e comissões e edita os percentuais em Financeiro > Regras.
- **E-mail transacional:** `sendEmail` usa a API da Resend se `RESEND_API_KEY` e `EMAIL_FROM` existirem; sem eles só registra em `email_outbox` (status LOGGED). Nunca lança erro. Enviados: recuperar senha, boas-vindas (loja e parceiro), pedido pago da Loja NextLevel e saque pago.
- **Recuperar senha:** `/esqueci-senha` → link `/redefinir-senha/[token]` de uso único e 1 hora; só o hash do token é guardado; resposta igual exista ou não o e-mail; pedido novo invalida o anterior; limite de tentativas. Na demonstração o link aparece na tela porque não há provedor.
- **Acabamento (V8):** `e2e/polish-v8.mjs` varre 14 páginas públicas e 30 dos painéis em 360, 390, 768 e 1280 px: sem rolagem horizontal, sem erro de página e sem violações graves de acessibilidade (390 e 1280). Correções: tabelas roláveis focáveis, nome acessível nos interruptores, contraste do texto sobre cores da loja (`readableOn` por contraste WCAG) e gráficos com `role="img"`.
- **V1 (sobras):** mapa de calor de pedidos por dia da semana e hora (Brasília) e clientes/vendas por estado na Análise do lojista. Ficaram de fora: personalização do dashboard e visões salvas.
- Migrações 0019. Testes `tests/store-fees.test.ts`, `tests/email-reset.test.ts`, `tests/readable-on.test.ts`, `tests/analytics.test.ts`; e2e `e2e/polish-v8.mjs`, `e2e/password-reset.mjs`.

## D32. Correção do deploy no Render
- **Causa:** `/` e `/planos` liam a tabela de preços (PGlite) durante o `next build`, o que abortava a exportação estática e derrubava o deploy desde a página de planos por Pix (o site ficou preso no commit a873b8c).
- **Correção:** as duas páginas passaram a ser dinâmicas (preços sempre atuais) e o Dockerfile fixa `DATABASE_URL=pglite://memory` na etapa de build. Regra: página que consulta o banco declara `dynamic = "force-dynamic"`.

## D33. N0: portfólio de marcas sobre um só motor
- **Uma implantação, várias marcas:** `src/lib/brand.ts` define NextLevel Commerce, SuperDrop e Brás Digital (nome, domínios, cores, módulos, texto legal, remetente de e-mail). `getBrand()` resolve a marca pelo endereço (`x-forwarded-host`); endereço desconhecido cai em `DEFAULT_BRAND` (padrão SuperDrop, a marca em produção). Domínios e endereços vêm de variáveis de ambiente.
- **A marca é organização e apresentação, não segurança:** `organizations.brand` guarda por onde o cliente entrou (padrão SUPERDROP para o legado); o isolamento continua por tenant. O Master ganhou filtro de marca em Lojas e Escritório virtual.
- **Portal por marca:** marcas sem dropshipping (NextLevel Commerce, Brás Digital) têm home própria, sem promessa que ainda não existe ("Em breve" marcado como tal); páginas de outra marca (fornecedor, parceiros, cadastro) redirecionam. Planos e dúvidas têm variante da marca.
- **Cadastro fechado na NextLevel Commerce até a fase N1** (conta simples): a loja independente ainda depende do modelo de fornecedor. No lugar, "Quero minha loja" registra o interessado (`brand_leads`), com confirmação por e-mail e aba "Interessados por marca" no CRM do Master. Parceiros também ficam fechados nessa marca até haver planos e comissões próprios (`BRAND_PARTNERS_*`).
- **E-mails por marca:** textos usam `{marca}`; layout, cores, rodapé legal e remetente vêm da marca da organização do destinatário; o nome do produto na frase legal das lojas vem da marca da loja.
- **Contraste:** a cor de destaque da NextLevel Commerce é #2563eb (branco sobre ela passa AA).
- **Teste local de domínio:** `x-forwarded-host` simula o domínio; `SERVER_ACTIONS_ALLOWED_ORIGINS` (só nos scripts de demonstração) permite as ações do servidor nessa simulação.
- Migração 0021. Testes `tests/brand.test.ts`; e2e `e2e/brands.mjs`. Guia do dono: `docs/nextlevel-commerce/publicar-dominios.md`.

## D34. P0: conta simples do lojista (NextLevel Commerce sem fornecedor)
- **Central oculta:** cada lojista independente ganha por baixo um fornecedor `suppliers.hidden = true` (rede própria, contrato zerado: sem mensalidade, setup, taxa por volume nem comissão de canal), criado por `createHiddenCentral` (`src/lib/domain/independent.ts`). A loja nasce `kind = SUPPLIER_OWN`, então o custo do pedido é interno e não existe carteira. Não há usuário de gestor da Central: o lojista é só `STORE_OWNER`.
- **Invisível:** Central oculta fica fora da lista de fornecedores do cadastro, do Master (lista, contagem, financeiro), do fechamento mensal e da cobrança de fornecedor. O lojista não acessa `/supplier` (papel `STORE_OWNER`).
- **Cadastro:** `signupMember` ganha `independent`; a ação liga isso quando a marca não tem o módulo `dropship` (NextLevel Commerce). `/cadastro` na Commerce não pede fornecedor, esconde o plano "Drop manual" e mostra a logo da marca. A cobrança é só a do plano da loja (Pix); sem cupom a loja já nasce pedindo o pagamento. Cupom de fornecedor não vale na conta simples.
- **Produtos:** as telas de produto do fornecedor viraram corpos reutilizáveis (`ProductsBody`, `NewProductBody`, `ProductBody`, `ImportBody`, parâmetro `base`); o lojista usa `/merchant/catalogo` ("Meus produtos", com estoque e importação por planilha) e `/merchant/products` ("Preços e publicação"). As ações passam por `catalogSupplierId` (fornecedor ou conta simples, nunca outro tenant).
- **Painel:** menu sem saldo e recargas, sem aviso de "loja própria do fornecedor", rótulo "Minha loja"; checklist "no ar" ganha "Publicar 5 produtos".
- **Dívida:** o modelo geral `seller` (fase P6) substitui a Central oculta. A venda real só começa ao ligar `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true` (depende do Mercado Pago da NextLevel conectado e do frete real, fase P1).
- Migração 0022. Testes `tests/independent.test.ts`; e2e `e2e/conta-simples.mjs`.

## D35. P1a: frete real por CEP, calculado no servidor
- **Brecha fechada:** antes, o checkout aceitava o valor do frete enviado pelo navegador. Agora `placeStorefrontOrderAction` exige a forma de entrega escolhida (`shippingServiceId`) e recalcula a cotação no servidor (`resolveShipping`); o valor do cliente é descartado. Pedido manual do lojista (painel) continua informando o frete.
- **`src/lib/shipping/quote.ts`:** interface `ShippingProvider` com SuperFrete e Melhor Envio (token criptografado já existente em `suppliers`), uma embalagem por pedido (peso somado, alturas empilhadas) lida do catálogo da loja, prazo = transportadora + dias de preparo, acréscimo de embalagem. **PRECISA VALIDAR com token real** (formatos de pedido/resposta seguem a documentação pública; bases trocáveis por `SHIPPING_MELHOR_ENVIO_BASE` e `SHIPPING_SUPERFRETE_BASE` para sandbox).
- **Nunca sem opção:** sem transportadora conectada, sem CEP de origem, erro ou tempo esgotado (8 s) → "Entrega padrão" da loja, marcando a cotação como degradada.
- **Regras da loja** em `stores.shipping_config` (Configurações → Frete e entrega): frete grátis a partir de valor (no serviço mais barato), entrega padrão e prazo, dias de preparo, acréscimo, retirada na loja. Padrões vêm do schema Zod (editáveis por loja).
- **Origem:** `suppliers.shipping_origin_zip` (na conta simples, a Central oculta). A conta simples conecta a transportadora na própria tela de Configurações, reaproveitando o cartão do fornecedor e `catalogSupplierId`.
- **Pedido:** `orders.shipping_service` e `shipping_days` guardam o que o cliente escolheu.
- Migração 0023. Testes `tests/shipping.test.ts`; e2e `e2e/frete.mjs`. **Falta no P1:** compra de etiqueta pela API com rastreio automático, `PaymentProvider` e cupom de desconto do consumidor.

## D36. Prévia da NextLevel Commerce por caminho (`/lojas`)
- Enquanto `nextlevelgroup.com.br` (ou um subdomínio) não aponta para o serviço, `superdrop.com.br/lojas` liga a **prévia**: o `proxy.ts` grava o cookie `nl-brand=NEXTLEVEL_COMMERCE` (30 dias) e leva ao início; `getBrand()` passa a responder com a NextLevel Commerce **somente** quando o endereço é o da marca padrão (SuperDrop). `/lojas/sair` desliga. O endereço próprio de cada marca sempre manda.
- É apresentação, não segurança: permissões e isolamento seguem por tenant. Lojas criadas durante a prévia nascem com a marca Commerce (a marca vem de `getBrand()` no cadastro). O cadastro continua fechado até `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true`.
- Teste: `e2e/brands.mjs`.

## D37. Área "NextLevel Commerce" no Master (hub da marca)
- `/master/commerce` (`src/lib/domain/commerce-hub.ts`, só Master): lojas da marca (com "conta simples"), planos pagos/em teste/aguardando Pix, receita de planos do mês, vendas das lojas (30 dias), interessados e a **lista do que falta para lançar** (usuários de demonstração no banco, Mercado Pago da NextLevel, cadastro aberto, banco Postgres; recomendados: endereço da marca, e-mail, suporte). O dashboard do Master ganhou uma faixa que leva a ela e o menu ganhou o grupo "Plataformas".
- **Proposta pendente de aprovação:** `docs/nextlevel-commerce/dominios-e-rotas.md` (v2): cada marca com seu endereço e painéis (`lojas.nextlevelgroup.com.br` e `superdrop.com.br`), conta presa à marca e gestão Master por escopo de marca (holding × gestor de marca). Só vira decisão (D38) depois do aceite.
- Testes `tests/commerce-hub.test.ts`; e2e `e2e/master-commerce.mjs`.

## D38. Domínios finais e cada marca como "casa" (D1 feito)
- **Sem terceiro domínio pago:** `superdrop.com.br` (SuperDrop) e `lojas.nextlevelgroup.com.br` (NextLevel Commerce) são os dois domínios do Render; painéis ficam dentro de cada endereço (sem `office.`), e o `app.superdrop.com.br` sai quando o dono quiser (vira redirecionamento ou é removido). Proposta completa e histórico: `docs/nextlevel-commerce/dominios-e-rotas.md`.
- **Conta presa à marca:** `accountBrandConflict` (login) bloqueia lojista, fornecedor e afiliado que tentam entrar pelo endereço de **outra** marca e mostra o endereço certo. A equipe NextLevel (Master) entra em qualquer um. Endereços técnicos (localhost, `*.onrender.com`) e a prévia `/lojas` não bloqueiam.
- **Painel com a cara da marca:** `AppShell` e login usam a marca do endereço (logo, nome, texto). **Menu por marca:** `navForBrand` tira Fornecedores, Redes e Catálogo da rede onde a marca não tem dropshipping, Parceiros onde o programa não está aberto, e mostra a área "NextLevel Commerce" só no endereço da Commerce, onde o início do Master (`/master`) leva a ela.
- **Filtros do Master por marca:** `masterBrandFilter` faz Lojas e Escritório virtual abrirem filtrados pela marca do endereço (`marca=todas` mostra todas). **Pendente (D2):** o mesmo escopo em Pedidos, CRM, Parceiros, Financeiro e a trava "gestor de marca" (Master por escopo de marcas).
- Testes `tests/brand.test.ts`; e2e `e2e/brands.mjs` e `e2e/master-commerce.mjs`.

## D39. Ecossistema NextLevel: um sistema, um Render, um Neon, um domínio por produto
- **Confirmado pelo dono:** 1 sistema central, 1 serviço no Render (Starter) e 1 banco no Neon. Cada produto tem o seu endereço; o Master central entra só em `master.nextlevelgroup.com.br`.
- **Marcas:** `NEXTLEVEL_COMMERCE` (`lojas.nextlevelgroup.com.br`), `SUPERDROP` (`superdrop.com.br`, painéis em `office.superdrop.com.br`), `BRAS_DIGITAL` (`bras.superdrop.com.br`), `CREATORS_HUB` (`hubcreators.nextlevelgroup.com.br`), `CHINA_HUB` (`chinahubglobal.com.br`) e a holding `NEXTLEVEL` (`master.nextlevelgroup.com.br`, não vende nada). A raiz `nextlevelgroup.com.br` continua sendo o site da holding, fora do sistema. O domínio mais específico vence (`bras.superdrop.com.br` é do Brás mesmo `superdrop.com.br` sendo do SuperDrop). Sem migração de banco (a coluna é texto).
- **Produtos novos** (Brás Digital, Hub Creators, China Hub) mostram uma página "Em breve" com lista de espera (`brand.soon`), sem prometer o que não existe; o resto do portal volta para a página inicial. China Hub inclui uma linha em mandarim (revisão por falante nativo pendente).
- **Master central:** no endereço da holding só existem login e painéis; todas as marcas aparecem. Com `MASTER_HOST_ONLY=true` a equipe NextLevel só entra por esse endereço e `/master` dos produtos leva para lá; os demais perfis não entram no endereço central. Endereços técnicos nunca trancam ninguém.
- **Painéis por produto:** `BRAND_OFFICE_<MARCA>` separa o endereço dos painéis (liga-se por variável, desligado por padrão). `/loja/<nome>` é apelido da vitrine.
- **Pendente:** escopo de dados do Master por produto em Pedidos, CRM, Parceiros e Financeiro; desenvolvimento dos produtos novos (Hub Creators, Brás Digital, China Hub).
- Testes `tests/brand.test.ts` e `tests/host-routing.test.ts`; e2e `e2e/brands.mjs`, `e2e/dominios.mjs`. Guia do dono: `docs/nextlevel-commerce/ligar-escritorio.md`.

## D40. Foco: só os domínios do que está em andamento
- **Agora:** `master.nextlevelgroup.com.br` (Master central), `lojas.nextlevelgroup.com.br` (NextLevel Commerce) e os do SuperDrop (`superdrop.com.br`, `office.superdrop.com.br`).
- **Etapa futura (sem domínio apontado até haver código):** `hubcreators.nextlevelgroup.com.br`, `bras.superdrop.com.br`, `chinahubglobal.com.br`. As marcas já existem no código com página "em breve", mas ficam sem endereço no Render e no DNS por enquanto, sem custo. Backlog dessas frentes em `docs/prompts/README.md`.

## D41. Contas de demonstração bloqueadas fora da demonstração
- E-mails `*.demo` e `@demo.superdrop.com.br` (senha conhecida `demo1234`) **não entram** quando `NEXT_PUBLIC_DEMO_MODE` não é `true`: o login responde "senha errada" e uma sessão antiga delas deixa de valer (`isDemoAccountEmail`, `src/lib/security/demo-accounts.ts`; `loginAction` e `getSession`). Nada é apagado do banco. A lista de lançamento do Master trata o item como verde quando elas estão bloqueadas e vermelho se a demonstração estiver ligada com elas no banco.
- Testes `tests/security.test.ts` e `tests/commerce-hub.test.ts`.

## D42. Influenciadores fora do escopo por ora; ajuste de expectativa visual
- **Influenciadores, creators, feed e live saem da fila ativa** (dono, 2026-10-02). Nada de `influencers`, `liveShop` ou "programa de influenciadores" aparece como promessa no portal do Commerce (texto retirado de `commerce-home.tsx`, FAQ e descrição da marca). `hub-creators-consolidado.md`, P3/P4 de `promessas-commerce.md` e as seções 5.4/5.5 do prompt-mestre ficam **adiados**, sem apagar. O programa de **parceiros (afiliados de planos)** continua como está.
- **Foco: alicerce e esqueleto bem feitos.** Páginas públicas das lojas o mais próximo possível da qualidade do Shopify; painéis internos com **identidade original** (fugir do visual genérico de painel feito por IA); **paleta de todas as marcas reformulada**. Proposta e critérios em `docs/design/DIRECAO-VISUAL-V4.md` (aguardando aprovação do dono antes de implementar).

## D43. Paletas por marca e tema Starter como base da vitrine
- **Aprovado pelo dono:** direção "mesa do atacadista" e paletas papel + tinta + sinal por marca (`docs/design/DIRECAO-VISUAL-V4.md`). Implementado o alicerce: `src/lib/brand-palette.ts` (paleta clara e escura por marca, contraste WCAG calculado), `primaryColor`/`accentColor` de `brand.ts` derivados dela, variáveis `--brand-paper/ink/signal/on-signal/signal-text/support` injetadas no `<head>` pelo layout raiz, texto de botão e de e-mail legível sobre a cor de sinal (`onSignal`). Tokens atuais dos painéis **não foram alterados**; o Codex passa a consumir `--brand-*`.
- Temas das lojas dos lojistas ficam fora da paleta da marca.
- **Vitrine:** o tema **Starter** é o ponto de partida; evolução por seção em `docs/design/PLANO-VITRINE-V4.md`.
- Teste `tests/brand-palette.test.ts`.

## D44. Onda 1: expedição própria da conta simples, pagamento manual x gateway, dono só lista o que é seu
- **Quem expede:** a modalidade da loja vem do banco (`storeModality`: conta simples = Central oculta; loja própria de fornecedor; loja de rede), nunca de marca, cookie ou tela. Só o dono de **conta simples** separa e envia o próprio pedido; dono de loja de rede (SuperDrop) continua sem expedir (a Central faz). Regra única em `src/lib/domain/order-policy.ts`, aplicada no servidor (`advanceOrder`); o botão na tela só reflete essa regra.
- **Fonte financeira da conta simples:** o plano da própria loja (`isBlocked`). Plano vencido bloqueia expedição; não se consulta a Central oculta, que não tem cobrança.
- **Confirmação de pagamento:** `confirmCustomerPayment` só vale para pedido de pagamento **manual** (WhatsApp, balcão, Pix combinado). Pedido do Mercado Pago só é confirmado pela consulta à API do provedor (nova ação "Verificar pagamento", `syncOrderPaymentAction`). Pedido cancelado ou estornado nunca é marcado como pago.
- **Concorrência:** avançar, cancelar e confirmar usam atualização condicional ao estado esperado dentro da transação. Repetir o mesmo avanço é sucesso sem efeito; avanço simultâneo tem um vencedor e o outro recebe sucesso idempotente ou `STATE_CONFLICT`. Estoque baixa/libera uma vez só; e-mail e eventos não duplicam.
- **Listagem de produto:** `assertProductListable` (domínio) exige que o produto seja ativo e do catálogo da rede/Central da própria loja; `SELECTED_STORES` continua exigindo acesso. Produto de outro fornecedor ou de outra conta simples é recusado sem gravar nada.
- **Textos:** a conta simples deixa de ver "Central", recarga e saldo (pedidos, financeiro, etiquetas, novo pedido, detalhe); SuperDrop mantém os textos.
- **Atualização de telas:** ações de estoque/catálogo do fornecedor revalidam painel da Central e do lojista.
- Sem migração de banco. Testes: `tests/onda1-commerce.test.ts`.

## D45. Onda 2: categorias do catálogo (CRUD) para Central e conta simples
- Categorias já existiam só como texto digitado no produto. Agora há lista com contagem de produtos, criar, renomear (sem duplicar nome) e excluir **sem apagar produtos** (ficam sem categoria), sempre limitado à Central do usuário (`src/lib/domain/categories.ts`). Telas: `/supplier/products/categorias` e `/merchant/catalogo/categorias` (mesmo corpo). Duplicar, arquivar em lote, importar CSV e fotos já existiam e foram mantidos. Sem migração. Variantes avançadas e preço por variante continuam **fora** (exigem contrato e migração aprovados). Teste: `tests/onda2-categorias.test.ts`.

## D46. Onda 3: nota interna e folha de impressão do pedido
- **Nota interna** (`addOrderNote`): evento `NOTE_INTERNAL` no histórico, 2 a 500 letras, só quem enxerga o pedido; a página do cliente não lista eventos, então a nota nunca vaza. Sem migração.
- **Impressão** (`/merchant/orders/[id]/print`, `/supplier/orders/[id]/print`): lista de separação com destinatário, itens e total, marcada **"Não é documento fiscal"**. Não mostra custo nem notas internas. Nota fiscal real e devolução ficam fora (projeto especializado). Teste em `tests/onda1-commerce.test.ts`.

## D47. Onda 4: CRM básico por loja (etiquetas, anotação, histórico, consentimento, exportação)
- **Migração 0024:** `store_customers.notes` e `store_customers.tags` (perfil só da loja; a pessoa em outra loja tem outro registro). `customers` global não é editado.
- **Domínio** `src/lib/domain/crm.ts`: lista com busca e filtro por etiqueta, perfil + compras ativas (cancelados fora), salvar etiquetas/anotação (limites 10 etiquetas, 1000 letras), revogar consentimento (mantém o histórico com `revokedAt`) e exportação CSV **só de quem consentiu** e **da própria loja**, com proteção contra fórmula em planilha. Tudo valida a loja; outra loja recebe "não encontrado". Corrigida a consulta antiga que carregava consentimentos de todas as lojas.
- **Telas:** `/merchant/customers` (busca, etiquetas, exportar) e `/merchant/customers/[id]`; rota `/api/crm/export` (só dono). Pontos, créditos e impersonação ficam fora. Teste `tests/onda4-crm.test.ts`.

## D48. Onda 5: um só conceito de "venda" nos painéis do lojista
- **Venda = pedido não cancelado e com pagamento do cliente confirmado** (`isEligibleSale`, `src/lib/domain/analytics.ts`). Valor da venda = subtotal dos produtos (sem frete); margem = subtotal − custo. Painel inicial, Análise e Financeiro usam a mesma regra (antes o painel inicial somava pedidos ainda não pagos e usava total com frete; a margem do Financeiro incluía pedidos pendentes). "Recebido" continua sendo o total pago pelo cliente (com frete), "Aguardando recarga" passa a contar só pedidos já pagos pelo cliente. Visitantes, sessões e conversão seguem indisponíveis (sem telemetria). Teste em `tests/analytics.test.ts`.

## D49. Onda 6: propostas comerciais por link (venda assistida)
- **PDV:** continua sendo "Novo pedido" (`createOrder`, preço sempre do catálogo no servidor). Nova função **Gerar proposta** nessa tela.
- **Proposta** (migração 0025, tabela `proposals`; `src/lib/domain/proposals.ts`): link público `/store/<loja>/proposta/<código>` com código aleatório de 192 bits, validade de 3 dias (1 a 30), sem custos e sem dados de outras lojas, fora dos buscadores. Aceitar = criar **um** pedido manual com pagamento pendente e estoque reservado por 24 h. Idempotente: a proposta é reservada com atualização condicional antes de criar o pedido e volta a "aberta" se a criação falhar (ex.: sem estoque). Expirada ou cancelada não converte; se o preço do catálogo mudou desde a proposta, o aceite é recusado ("peça uma nova"). Lojista lista, copia o link e cancela em `/merchant/orders/propostas`.
- **Fora:** desconto e item temporário (exigem permissão e decisão antes), pagamento online na proposta. Teste `tests/onda6-propostas.test.ts`.

## D50. Onda 7: campanhas agendadas (faixa no topo da vitrine)
- Migração 0026 `store_campaigns`; `src/lib/domain/campaigns.ts`. Aviso de 3 a 140 letras, link opcional **seguro** (só `/…` da própria loja ou `https://`; recusa `javascript:`, `//`, `data:`), início e fim em horário de Brasília (UTC−3), só aparece quando início ≤ agora < fim; uma campanha vigente por vez (a mais antiga). Escopo por loja (outra loja não lista nem apaga). Telas: `/merchant/campanhas`. Usa as cores do tema da loja; **não cria outro editor**. Banner com imagem, preferências P1/P2 e identidade/favicon ficam para depois (dependem de ativos e de definição). Teste em `tests/onda6-propostas.test.ts`.

## D51. Onda 9 (módulo 1): cupom de desconto do consumidor
- **Tabela própria `store_discounts`** (migração 0027) em vez de estender `coupons`: aquela tabela é de cupom de teste grátis, com código único no sistema todo e vínculo a fornecedor/parceiro; misturar quebraria a busca de cupons de teste e impediria duas lojas de usarem o mesmo código (ex.: BEMVINDO10). Desvio da regra "estender o que existe", justificado aqui.
- **Pedido:** `orders.discountCents/discountId/discountCode`. `subtotalCents` continua bruto (soma das linhas); **venda líquida = subtotal − desconto** (`netSaleCents`), usada no painel inicial e na Análise; frete fora. Total = subtotal − desconto + frete.
- **Regras de segurança:** desconto nunca leva o subtotal abaixo do custo dos produtos; percentual 1–90%; vale na conta simples e na loja própria de fornecedor, **não em loja de rede (SuperDrop)**, onde o fornecedor define preço mínimo; uso limitado contado por atualização condicional (compras simultâneas não passam do limite); cancelamento/expiração de pedido não pago devolve o uso.
- **Mercado Pago:** com cupom, a preferência sai com um único item de valor líquido (+ frete) para cobrar exatamente o total. **Não homologado** (sem credencial de teste); validar no sandbox antes de divulgar cupons em loja com Mercado Pago.
- Telas: `/merchant/descontos`, campo de cupom no carrinho (com prévia) e no "Novo pedido". Teste `tests/onda9-descontos.test.ts`.

## D52. Onda 9 (módulo 2): preço por quantidade (atacado simples)
- Tabela `store_price_tiers` (migração 0028): até 5 faixas por produto da loja ("a partir de N peças, preço X"). Vale pela **soma das unidades do mesmo produto** no pedido (todos os tamanhos); **grades/packs ficam fora** (têm preço próprio). Escolhe a faixa de maior quantidade atingida e nunca sobe o preço base.
- **Regras:** quantidade mínima 2; preços estritamente decrescentes e abaixo do preço da loja; nunca abaixo do custo nem do preço mínimo do produto; **não existe em loja de rede (SuperDrop)**. O servidor recalcula tudo em `createOrder` e nas propostas (o preço do navegador nunca vale); o carrinho e a página do produto mostram a mesma regra (`priceCartLines`) para o total bater com o cobrado. Cupom de desconto continua valendo sobre o subtotal já com faixa.
- Tela: `/merchant/atacado`. Lista de preços por cliente/grupo ficou fora (dependeria do CRM por grupos). Testes em `tests/onda9-descontos.test.ts`.

## D53. Onda 9 (módulo 3): avaliações de clientes com moderação
- Tabela `product_reviews` (migração 0029). **Só avalia quem comprou:** o cliente prova a compra com número do pedido + e-mail (mesma regra do acompanhamento) e o pedido precisa estar **pago e enviado/entregue**, não cancelado; uma avaliação por produto em cada pedido; nota 1 a 5, comentário até 500 letras. A avaliação nasce **pendente** e só aparece na loja depois que o lojista publica em `/merchant/avaliacoes` (outra loja não modera). Público vê só o primeiro nome. Sem e-mail automático (nada é enviado a cliente): o formulário aparece em "Acompanhar pedido". Nota média e lista na página do produto; sem marcação de busca (rich snippets) por ora.
- Vale para todas as lojas, inclusive SuperDrop (só aparece formulário em pedido enviado; nada é publicado sem aprovação do lojista). Teste em `tests/onda9-descontos.test.ts`.

## D54. Onda 9 (módulo 4): equipe na loja (acesso limitado, sem multiloja)
- **Decisão do dono (autorizada):** equipe com login próprio por pessoa. **Multiloja não foi feita** (uma conta continua = uma loja); fica para pedido específico.
- Modelo: `users.storeRole` (`OWNER` padrão para todas as contas existentes, ou `STAFF`) e `users.disabledAt` (migração 0030). A equipe é um usuário `STORE_OWNER` com `storeRole = STAFF`: todas as telas e regras de isolamento por loja continuam as mesmas.
- **Equipe pode:** pedidos (inclui expedir na conta simples, notas, impressão, propostas, pedido manual), catálogo e produtos, clientes, etiquetas, pós-venda, avaliações, conteúdo. **Não pode (bloqueado no servidor e escondido no menu):** início com vendas/margem, análise, financeiro, saldo/recarga, configurações (pagamento, frete, domínio, publicar), templates/tema/aparência, preço por quantidade, cupons, campanhas, serviços e cobrança NextLevel, e a própria equipe. Guardas: `requireStoreAdmin()` nas páginas e `assertStoreAdmin(actor)` nas ações.
- **Acesso:** só o dono convida (até 5 pessoas ativas), cria e-mail + senha provisória (a pessoa troca no primeiro acesso; **nada é enviado por e-mail**). Encerrar acesso grava `disabledAt`: login recusado e sessão aberta deixa de valer na próxima requisição; histórico preservado. Dono não se remove.
- Tela: `/merchant/team`. Teste `tests/equipe.test.ts`.

## D55. Onda 9 (módulo 5): Avise-me (demanda de tamanho esgotado, sem envio automático)
- Tabela `stock_alerts` (migração 0031). Na página do produto, tamanho **realmente esgotado** ganha formulário "Avise-me" (e-mail ou WhatsApp com DDD; até 20 avisos por contato por loja; sem duplicar). O lojista vê a demanda em `/merchant/avise-me` (por produto/tamanho, com marca "voltou ao estoque") e **ele mesmo** avisa por link de WhatsApp/e-mail; depois marca como avisados. **Nenhuma mensagem é enviada automaticamente** (não há e-mail/WhatsApp real configurado nem consentimento para isso); contatos só aparecem no painel da própria loja. Envio automático fica para depois do Resend. Carrinho abandonado e newsletter **não foram feitos** (exigiriam capturar dados antes da compra e envio em massa). Teste `tests/avise-me.test.ts`.

## D56. Onda 9 (módulo 6): pedido mínimo de atacado
- `stores.minOrderCents` (migração 0032; 0 = sem mínimo). Vale **só para compra feita pelo cliente na loja virtual** (valor dos produtos já com faixa de preço e cupom, sem frete); venda manual do lojista e proposta não são barradas. Configurado em `/merchant/atacado` (só dono), **não existe em loja de rede (SuperDrop)**. O servidor recusa abaixo do mínimo ("Pedido mínimo desta loja…") e o checkout mostra o quanto falta e desabilita o pagamento. Teste em `tests/onda1-commerce.test.ts`.

## D57. Proteção da produção, fases A0 e A1: rotinas registradas e monitor do site
- **A0:** as duas rotinas (`/api/cron/expire-reservations`, `/api/cron/finance`) agora rodam cada etapa **isolada** (a falha de uma não impede as outras; resposta 207 com os erros), conferem pagamentos pendentes do Mercado Pago e **registram uma linha por execução** (`job_runs`, migração 0033; só contagens e motivo resumido, com e-mails e fichas longas mascarados; guarda as últimas 200). `jobStatus` marca **atrasada** a rotina que não roda há mais que o dobro do intervalo (10 min / 24 h). O Master vê isso na lista de lançamento da Commerce ("Rotinas automáticas rodando"), item que **bloqueia o lançamento** enquanto o agendador não existir.
- **Agendador:** duas opções, sem custo extra: (1) Render Cron Job; (2) `.github/workflows/rotinas.yml`, que só age se o repositório tiver o segredo `CRON_SECRET` e a variável `APP_URL` (sem eles, avisa e não faz nada). Não é preciso as duas.
- **A1:** `.github/workflows/monitor.yml` confere a cada 15 min o `/login` e o `/api/health` (banco) de lojas, superdrop e master; falha duas vezes seguidas = execução vermelha e e-mail do GitHub. Endereços ajustáveis pela variável `MONITOR_URLS`; para silenciar numa manutenção, desabilitar o fluxo na aba Actions.
- Não verificado: execução real dos fluxos no GitHub (só validei a sintaxe) e dos endereços de produção. Teste `tests/rotinas.test.ts`.

## D58. Proteção da produção, fase A2: painel de erros do Master
- Tabela `error_events` (migração 0034). **Erros do servidor** entram por `src/instrumentation.ts` (`onRequestError` do Next 16) e **erros de tela** pela tela de erro, que avisa `POST /api/errors` (aberto, por isso: limite de 10 por minuto por endereço, corpo até 4 KB, tudo mascarado no servidor). Agrupa pelo mesmo erro (origem + rota + mensagem sem números) somando a contagem; se um erro resolvido voltar, **reabre sozinho**; guarda no máximo 500 grupos.
- **Privacidade (LGPD):** e-mails, telefones, CPF/CNPJ e fichas longas são mascarados antes de gravar; a rota perde parâmetros e identificadores; a pilha é cortada. Só o Master lê e resolve (`/master/errors`). Registrar nunca lança (não pode piorar a falha que está registrando).
- Não verificado: captura real no Render (só testei o domínio; o gancho do Next roda em produção). Testes `tests/painel-erros.test.ts`.

## D59. Proteção da produção, fase A3: resumo do dia para o dono
- `buildDailySummary` (só contagens e valores, **sem nome, e-mail ou telefone de cliente**): vendas pagas e não canceladas das últimas 24 h (produtos menos desconto), lojas e interessados novos, faturas vencidas, pedidos parados há mais de 2 dias, erros do sistema abertos/novos e rotinas atrasadas. `renderSummary` monta um texto curto em português simples com **o que precisa de atenção primeiro**. Tela: `/master/summary`.
- **E-mail:** a rotina diária (`/api/cron/finance`) envia o resumo aos usuários Master, **uma vez por dia e por pessoa** (`dedupeKey`). Sem Resend configurado, o texto fica só na caixa de saída (e na tela). Nenhuma mensagem sai para cliente.
- Teste `tests/resumo-dia.test.ts`.

## D60. Loja de temas pagos: infraestrutura única e primeiro tema (Lume)
- **Infraestrutura (feita uma vez):** (1) uma **loja de demonstração por tema** (`stores.showcase_theme`, migração 0035; slug `demo-<tema>`), criada de forma idempotente na inicialização por `ensureShowcaseStores` (`src/lib/themes/showcase.ts`): 12 produtos fictícios com fotos do acervo, tema instalado, dono sem acesso (usuário desativado), status `CLOSED` (fora de cobrança e das contagens do Master), `noindex`, sem sitemap, **`createOrder` recusa** (`SHOWCASE_STORE`) e o checkout mostra aviso; (2) páginas públicas `/temas`, `/temas/<tema>` e `/demo/<tema>` (link compartilhável, com troca computador/celular), lendo preço e texto do catálogo; (3) `/login?voltar=/merchant/templates?ver=<tema>` leva o lojista à vitrine dele e abre sozinho a prévia **com os produtos da própria loja** (o mecanismo de prévia por cookie já existia e só vale para o dono da loja); (4) **compra e instalação em 1 clique:** depois do pagamento confirmado o tema é instalado sozinho (antes pedia um clique extra).
- **Tema em aprovação:** `released: false` no catálogo. Não aparece na galeria nem na vitrine do lojista e não é vendido; abre só por link (`/demo/lume`, `/temas/lume`, marcado "Em aprovação"). O preço **R$ 149 é proposta** até o dono aprovar.
- **Lume (T1):** moda e acessórios, um degrau acima do Starter e abaixo do Arena: destaque com imagem em tela larga, categorias em círculos, vitrines em sequência, imagem com texto, perguntas frequentes, chamada de WhatsApp, compra rápida e, no produto, abas e barra fixa de compra no celular. Seções `image-hero`, `category-grid`, `faq`, `cta-banner`, `image-with-text`, `product-tabs` passam a valer também para ele.
- **Correção junto:** o texto de destaque padrão de lojas novas ("Bem-vindo à <nome>") deixou de ser tratado como texto escrito pelo lojista ao instalar um tema.
- Não verificado: Lighthouse do Lume; compra com Mercado Pago real; foto de destaque própria (usa recorte de foto do acervo, 960 px). Testes `tests/temas-pagos.test.ts`, e2e `e2e/temas-pagos.mjs`.

## D61. Lume (entrada) liberado e Ninho (segundo tema) em aprovação
- O primeiro tema pago passou a se chamar **Lume** (antes "Aurora", nunca vendido): R$ 149, **liberado** por decisão do dono: aparece em `/temas`, na vitrine de temas do lojista (SuperDrop e Commerce) e na página da Loja NextLevel (seção "Temas para a sua loja"). Logo própria em `public/temas/lume-logo.svg`.
- **Ninho** (casa e decoração, tons de terra e verde-sálvia, mesmo padrão e mesmo preço R$ 149) criado como `released: false`: só abre por link (`/demo/ninho`) até o dono aprovar. Os dois temas saem da mesma função `entryTheme` (cores, fonte, textos e formato das categorias mudam; a estrutura é a mesma).
- Loja de demonstração por segmento: moda (12 produtos) e casa (6 produtos: faltam fotos de casa no acervo).
- O console da Commerce e as contagens do Master ignoram as lojas de demonstração.

## D62. Constituição da plataforma de lojas virtuais adotada como autoridade máxima do e-commerce
- **Decisão (dono, 2026-10-03):** `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` passa a ser a norma de mais alto nível para o motor de lojas. Ordem: Constituição > decisões registradas > documentos especializados > tarefa. Registrada no `CLAUDE.md` e no `AGENTS.md`.
- **Auditoria inicial:** `docs/constituicao/AUDITORIA-2026-10.md` (3 artigos violados, 3 falhas reais, plano em 7 passos). Correção ali: o número do pedido não repete (índice único); a compra simultânea é que pode falhar.
- **Exceção registrada (art. 39):** a "Central oculta" das lojas da Commerce contraria o art. 4. Fica como exceção temporária até haver ADR e plano de migração para tornar fornecedor e rede opcionais no motor.

## D63. Instalação de tema publica na hora (exceção ao documento 07 §17)
- **Contexto:** o documento oficial 07 §17 diz que instalar um tema não deve alterar a loja pública automaticamente; o dono pediu compra e instalação em 1 clique (2026-10-02), e o sistema instala e publica no mesmo passo.
- **Decisão:** manter o 1 clique como **exceção temporária**, com salvaguardas: a prévia com os produtos da própria loja vem antes (`/merchant/templates?ver=<tema>`); o estado anterior fica no histórico ("Antes de instalar …") e pode ser restaurado; trocar de tema nunca apaga produtos, clientes, pedidos ou configurações.
- **Alternativa não adotada:** instalar em rascunho e publicar depois (mais seguro, mais um clique).
- **Revisão:** se o dono preferir o fluxo em rascunho, ou se houver reclamação de loja que instalou sem querer.

## D64. Modo rápido de verificação convive com o documento 11 (exceção ao §103 e §104)
- **Contexto:** o documento oficial 11 pede unitário, integração, build e tipos antes do merge e proíbe publicar com risco de vazamento, pagamento duplicado ou estoque corrompido. O dono decidiu (2026-10-03) por poucos testes por fase e uma fase final só de testes, porque a suíte completa leva cerca de 10 minutos e o Render publica no push.
- **Decisão:** manter o modo rápido (tipos, estilo e testes da área tocada; build só quando muda rota, página ou banco; suíte completa na nuvem depois do push e na F8). **Não vale o modo rápido** para dinheiro, pedido, estoque, permissão, isolamento entre lojas, migração com dados e SuperDrop: esses rodam os testes vizinhos antes do push (coincide com os bloqueios de release do 11 §145).
- **Alternativa não adotada:** portão completo antes de cada push (mais lento, mais seguro).
- **Revisão:** voltar ao portão completo se um teste adiado causar incidente, se mais de uma pessoa passar a publicar, ou se o dono pedir.

## D65. Orquestrador AGENTS.md e doc 13 adotados; publicação segue a autorização do dono (2026-10-03)
- Doc 13 (roadmap, lacunas P0–P4, ADRs) salvo em `docs/constituicao/`; o orquestrador fica em `docs/constituicao/AGENTS-ORQUESTRADOR.md` e é referenciado pelo `AGENTS.md` do repositório, sem substituí-lo (preserva aviso do Next.js, branch de publicação e modo rápido).
- Conflito: o orquestrador veda deploy sem autorização explícita; o dono autorizou publicar sempre que preciso, então a autorização permanente prevalece. Exceções que continuam pedindo confirmação: migração com preenchimento de dados em produção (F1.1, aguarda backup do Neon), apagar dados, mudar segredos.
- Matriz de lacunas: consolidada em `AUDITORIA-2026-10.md` e nos `CRUZAMENTO-*`.

## D66. Rodada de 2026-10-04: lojas virtuais, visual e privacidade
- **Arena premium integrado** (destaque esportivo com produto real); Editorial e Signature passam a abrir com foto; miniaturas versionadas no nome (`-2`) para não servir imagem antiga do cache.
- **Publicação do tema é tudo-ou-nada** (`publishAllDrafts`): páginas e estilo numa só transação; aviso (não bloqueio) de cor clara demais no editor.
- **Saúde separada de desempenho** (doc 12): vendas baixas viram "oportunidade", não derrubam a nota.
- **Eventos de pedido** (`ORDER_CREATED`, `PAYMENT_APPROVED`, `ORDER_SHIPPED`, `ORDER_CANCELED`) emitidos na mesma transação, idempotentes por `dedupeKey`, só com ids e valores.
- **Privacidade (F6):** exportação CSV e exclusão de dados de UM cliente, só do dono da loja, auditada. A exclusão anonimiza identificação e preserva o pedido (valores, itens, datas). **Política de retenção continua sendo decisão do dono e jurídica**: proposta de prazo ainda não definida.
- **Auditoria F1.3:** aplicado só "frete cobrado exige endereço". Não aplicado "pagar antes de cancelar": sem fluxo de estorno (ADR-0001) tornaria pedidos pagos impossíveis de cancelar. Não aplicado "só a Central avança a expedição": quebraria lojas independentes.
- **Ninho não foi liberado para venda:** o ambiente bloqueou mudar o que está à venda sem confirmação direta; fica em `docs/PENDENCIAS-DO-DONO.md`.
- **Kit de skills de análise** instalado em `.claude/skills/` (somente leitura/análise).
- ADRs 0001 a 0005 em `docs/adr/` aguardam o dono.

## D67. Trilha de auditoria geral (ADR-0005, parte 1) implementada (2026-10-04)
- Tabela nova `audit_log` (migração 0038, só cria tabela, sem mexer em dados) e `recordAudit`/`listAudit`. Registra quem, o quê e antes/depois só de campos não sensíveis; campos com token, senha, chave ou Pix gravam apenas "alterado".
- Escopo desta etapa: dados da loja, preço/ativação de produto, publicação, frete, equipe, conexão do Mercado Pago, exportação e exclusão de dados de cliente. Visível ao dono em `/merchant/auditoria`.
- Não decide CSP nem assinatura do webhook (partes 2 e 3 do ADR-0005 seguem aguardando o dono).

## D69. Consentimento de marketing no checkout começa desmarcado (2026-10-04)
- A caixa "Aceito receber novidades por WhatsApp" vinha marcada. Consentimento precisa ser escolha ativa do titular (doc 10, "consentimento registrável"; LGPD). Agora começa desmarcada; só grava consentimento (`marketing_consents`) se o cliente marcar. Reversível, só aumenta a proteção.
- Efeito comercial: a base de contatos autorizados cresce mais devagar, mas fica válida para campanhas.

## D70. Chave de idempotência liberada quando o sistema cancela o pedido (2026-10-04)
- Falha encontrada na própria F1.2: se a cobrança falhava (Mercado Pago fora do ar) o pedido era cancelado, mas repetir a compra com a mesma chave devolvia o pedido cancelado e o cliente não conseguia pagar. Reproduzido em teste (vermelho), corrigido (verde): pedido cancelado deixa de contar como "a mesma tentativa"; a chave é liberada e a nova tentativa cria outro pedido. Vale também para reserva vencida.
- Cobertura nova: `tests/checkout-idempotencia.test.ts` (cancelamento e nova tentativa; cancelar duas vezes não devolve estoque duas vezes) e `tests/loop-negativos.test.ts` (quantidade inválida, produto arquivado/anúncio desativado, variante errada, estoque insuficiente em compra mista, loja suspensa/bloqueada, e-mail inválido, produto de outra loja).

## D71. Alvos de toque e carrossel no celular (2026-10-04)
- Medição a 390 px: menu (36), carrinho, chips de categoria (38), botões −/+ de quantidade (14 a 16 px de altura), "Continuar comprando", "Remover", logo, setas (36) e bolinhas (8) do carrossel ficavam abaixo de 40 a 44 px. Agora todos têm no mínimo 44 px (bolinhas: área de 32 px). As setas do carrossel somem no celular, porque cobriam o texto; no lugar vale deslizar o dedo (testado) e as bolinhas.
- Verificado nas lojas mantos-shop, Lume, Arena e Signature: sem rolagem lateral, nenhum alvo abaixo do mínimo fora do aviso de demonstração.

## D72. Erros inesperados deixam de ser caixa-preta (2026-10-04)
- Antes: erro inesperado numa ação do servidor (inclusive falha do Mercado Pago no checkout) só ia para o log do servidor; o Master nunca via. Agora `runAction` e o checkout registram em `error_events` (mascarado e agrupado) com origem, última loja (slug público) e um código curto que o cliente recebe na mensagem. Migração 0039: 3 colunas anuláveis, sem mexer em dados.

## D73. Rolagem lateral no cadastro de produto (2026-10-04)
- Causa raiz: o texto só-para-leitor-de-tela ("Remover") da tabela de tamanhos é posicionado de forma absoluta e escapava do recorte da tabela (o recorte não era a referência de posição), esticando a página para 476 px no celular. Correção: o recorte passa a ser `relative`. Também a base do `TwoColumn` passou a ter coluna explícita. Novo e2e `e2e/painel-loja-vazia.mjs` (25 telas do lojista com loja zerada, 2 larguras). Varredura de 69 telas (fornecedor, Master e lojista de rede) a 390 px: sem rolagem lateral.
- Tela de erro do navegador passa a mostrar o código (digest) e a registrá-lo no painel de erros.

## D74. Diagnóstico de loja para o Master e regra de frete configurado (2026-10-04)
- Nova tela `/master/stores/[slug]` (só Master, só leitura): prontidão, integrações, plano, pedidos por estado e parados, eventos de 7 dias, erros ligados à loja (com código) e mudanças recentes. Segredos nunca são lidos.
- "Frete configurado" passa a exigir plataforma conectada ou regras próprias; frete em demonstração não conta (apareceu como ok por engano no diagnóstico).

## D75. Console da administração Commerce: "\n" solto e contraste (2026-10-04)
- A tela Lojas do console `/commerce` mostrava "\n" literal (quebra de linha escapada no código). Corrigido. O console escuro falhava o contraste AA em todas as 7 telas (cinzas zinc-500/600 sobre quase preto): texto secundário passou a `zinc-400`. Verificado com axe a 1440 e 390 px: sem violação grave nem rolagem lateral.
- Painel do lojista: "Configuração da loja incompleta" mostrava a porcentagem que falta como se fosse contagem; agora mostra quantos passos faltam.

## D76. Painéis Commerce com a identidade da home institucional (2026-10-04)
- Pedido do dono: sem tela preta no painel do lojista; seguir as cores da home institucional da Commerce, com variação para o modo escuro.
- Causa: o painel do lojista Commerce tinha `dark:bg-[#08090b]` (preto) e destaque ciano; o console da administração era preto fixo, com cinzas e ciano escritos direto nas classes.
- Paleta (tokens em `globals.css`, escopo `[data-product="commerce"]`, nada vaza para SuperDrop ou Master): claro = papel quente #F5F1E8, tinta azul-marinho #14213D, azul #1F47C9 em links e rótulos, amarelo-etiqueta #F2B600 só em botões de destaque; escuro = azul-marinho (#0D1530 fundo, #121C3B cartões, #F5F1E8 texto, #8FA8FF links, botão principal amarelo com texto escuro), sem preto puro.
- As duas cascas (`commerce-merchant-shell`, `commerce-shell`) e as 7 telas do console passaram a usar os tokens (nenhuma cor fixa). Contraste medido nos dois modos: texto 14:1 e 16:1; secundário 6,5:1 e 9,7:1; azul 6,6:1 e 7,9:1.
- Verificado com axe: 16 telas × claro e escuro × 1440 e 390 px, sem violação grave nem rolagem lateral.

## D77 — Painel Commerce em vidro azul, Claro e Escuro (2026-10-04)
Decisão do dono: as duas imagens aprovadas (Claro e Escuro) e o prompt `PROMPT_CLAUDE_NEXTLEVEL_COMMERCE_GLASS_LIGHT_DARK.md` são a direção visual. **Substitui a D76** (paleta papel/marinho). Escopo apenas visual, dentro de `[data-product="commerce"]`; Master e SuperDrop intocados. Tema Claro/Escuro/Sistema, claro por padrão quando não há escolha salva (`nl-theme`). Menu agrupado só com rotas existentes (`COMMERCE_NAVIGATION_MAP.md`). Início recomposto (`CommerceHome`) só para lojas Commerce; o caminho SuperDrop de `/merchant` não mudou. Restante das telas herda por ganchos (`ds-card`, `ds-table`, `ds-pulse`); ver limites em `COMMERCE_VISUAL_QA.md`. Missão sem publicação: só commits locais até o dono pedir.


## D78 — Sistema de design compartilhado (NextLevel, Commerce, SuperDrop e projetos futuros) (2026-10-06)
Decisão do dono (pacote de referência `commerce-interface-reference`): um único núcleo de forma, e a única variação por empresa é a paleta de cores. **Substitui o CSS de vidro específico do Commerce (D77) e os climas por painel**; mantém o azul aprovado do Commerce como cor primária do tema `commerce`.
- Núcleo em `src/design-system/` (`tokens.css` medidas, `core.css` componentes, `themes.ts` contrato de cores, `components/` casca operacional e pública). Componentes não têm condição por empresa (teste `tests/design-system.test.ts`).
- Duas famílias: painéis operacionais (`OperationalShell`/`AppShell`) e páginas públicas (`PublicShell`). Tema por marca do endereço (`getThemeKey`), modo Claro/Escuro/Sistema salvo em `nl-theme`.
- Contraste AA conferido por teste em 6 temas × 2 modos; varredura de 130 rotas e das páginas públicas em 4 larguras (`docs/design-system/MATRIZ-COBERTURA.md`).
- Diferença consciente: Expedição usa densidade de toque. Pendências do dono: `docs/design-system/DECISOES-PENDENTES.md` (paletas de Brás, Creators e China; logos oficiais ficam para o final).

## D79 — Sistema de cores v2 e logos oficiais por marca (2026-10-06)
Decisão do dono: proposta `brand-system-v2/` aprovada ("está tudo aprovado, pode aplicar tudo"). **Substitui as paletas de D77/D78** (azul vidro Commerce, laranja NextLevel, verde SuperDrop antigo, rosa/vermelho provisórios das marcas futuras).
- Neutros compartilhados: navy #101B34 e off-white #F4F1E9 (claro: fundo off-white, superfície branca; escuro: superfície navy, fundo #0B1427).
- Cor de assinatura por marca, aplicada no raio das logos oficiais e nos pontos de ação (botão, item ativo, seleção, link, foco): NextLevel amarelo #F5BC00 · Commerce azul #2F81F4 · SuperDrop verde #2D9E3B · Creators magenta #D44790 · Play violeta #A15EDD · China Hub jade #00979D · Brás laranja #D35C00. Valores de interface por tema em `brand-system-v2/paletas.json`; no código: `src/design-system/themes.ts` (tema novo `play`) e `src/lib/brand-palette.ts`.
- Amarelo é do grupo: destaque secundário dos produtos; nunca texto no claro (usa bronze #7B4C00).
- Estados (sucesso, alerta, erro, informação) iguais em todas as marcas, sempre com ícone e texto.
- Logos e favicons: cópias do kit oficial v1 com o raio recolorido (`public/brand/v2/`), via `BrandLogo`/`Logo`; favicon por marca do endereço (`brandIcons`); marcas sem logo oficial (Brás, China) aparecem só com o nome em texto e usam o favicon do grupo.
- Pendências conhecidas: serrilhado dos contornos do kit acima de ~1200 px (pede redesenho manual); CMYK/Pantone não definidos.

## D80 — Modo suporte seguro e central de clientes (2026-10-07)
Rodada do dono (`docs/prompts/auditoria-dono-paineis-e-paginas.md`, fases 0 e 2).
- **Falha corrigida:** o "Entrar como lojista" do Commerce guardava o código do Master num cookie sem assinatura e confiava nele para devolver o acesso Master. Substituído por permissão assinada, presa à sessão do cliente (`sup`), com prazo de 1 hora e operador conferido a cada requisição.
- Modo suporte para todos os papéis de clientes (lojista, equipe, fornecedor, expedição, parceiro) de todas as marcas, a partir de `/master/clientes` (e do console Commerce).
- Motivo obrigatório; começa em **somente leitura** (bloqueio central em `runAction`); "agir em nome do cliente" é um segundo passo confirmado; entrada, liberação e saída na trilha `audit_log`, visível ao dono da loja.
- Detalhes e testes: `docs/auditoria-dono/03-suporte.md`.

## D81 — Painéis com a identidade da marca e Master por marca (2026-10-07)
Rodada do dono (`docs/prompts/auditoria-dono-paineis-e-paginas.md`, fases 1, 3, 4 e 5).
- **Identidade:** a barra lateral de cada painel leva um toque da cor da marca (claro: 9% da primária sobre o fundo; escuro: fundo e superfície com 5–6% da primária). O Master usa barra navy também no modo claro; nela, logo e seletor de negócio usam a versão para fundo escuro. Tudo no contrato `src/design-system/themes.ts` (sem condição por empresa nos componentes); contraste AA conferido por teste.
- **Mesmo contrato de venda em todo lugar:** o Master passa a contar só vendas pagas, não canceladas, subtotal menos desconto, sem frete (igual ao painel do lojista). Os cartões de negócio do Master mostram os números **daquela marca** (antes o SuperDrop mostrava o volume da rede inteira).
- **Janela única de 30 dias** (`salesWindow`) para o início do lojista e a Análise.
- **Master × marcas:** página por marca (`/master/marcas/superdrop`, `/master/marcas/commerce`) com saúde, clientes que precisam de atenção (com "Ver como cliente") e atalhos; o seletor de negócio leva a ela.
- `/commerce` aberto no endereço do Master não volta mais ao login (estava fora da lista de prefixos de painel).
- Páginas públicas: espaços "Imagem em criação" (`ImagemEmCriacao`) que trocam sozinhos pela foto quando o arquivo existir em `public/portal/<marca>/v3/` (lista em `MANIFESTO.md`; prompt das imagens em `docs/prompts/imagens-paginas-publicas-gpt.md`).

## D82 — Temas por nível (N1–N4), política única e direitos preservados (2026-10-07)
Pedido do dono (`Prompt-NextLevel.md`, auditoria em `docs/temas-modulares/AUDITORIA.md`). Branch `claude/temas-modulares-v1`, sem publicação.
- **Edição deriva do tema ativo + licença, não do plano.** Fim do cadeado "Loja própria" para editar o que o tema vendeu. A oferta Loja própria mantém, por compatibilidade explícita, a reorganização de seções da base e o estilo avançado que o "Editor avançado" incluía (`LEGACY_PLAN_GRANTS`); seções de temas pagos exigem a licença do tema.
- **Capacidades semânticas** substituem as listas de nomes de tema nas seções (`requires`, `families`, `module`); níveis cumulativos (`src/lib/themes/levels.ts`). Política pura única (`policy.ts`) usada pelo editor (cadeados, diálogo, árvore) e pelo servidor (salvar, publicar, restaurar, comprar, instalar). Especificação: `docs/temas-modulares/ESPECIFICACAO.md`.
- **Liberação no servidor:** `release` (`released`/`review`/`draft`) bloqueia compra e instalação de tema não liberado também por chamada direta (corrige A01); licença já comprada continua instalável.
- **Compatibilidade:** o que já está no documento continua valendo; Editorial mantém o vídeo que anunciava (`grants`); restaurar versão de outro tema reativa o tema se houver licença.
- **Rascunho nunca some:** instalar guarda rascunhos no histórico (corrige A04); revisão por página e conflito entre abas (`DRAFT_CONFLICT`, corrige A05).
- **Verdade comercial:** modelos sem "frete grátis", prazos ou depoimentos inventados; contagem e depoimentos nascem ocultos (A11/A12); preços públicos de uma fonte só (A13).
- **Preços atuais preservados.** Proposta de preços dos temas novos fica em `docs/temas-modulares/CATALOGO.md` (não aplicada).
- **Conflito registrado:** skill `tema-pago` ("não comece o tema N+1 sem OK do tema N") passa a valer para liberação comercial, não para desenvolvimento local reversível (proposta; skill não alterada).

## D83 — Famílias de temas sobre um construtor único por nível (2026-10-07)
Continuação de D82 (`Prompt-NextLevel.md`). Branch `claude/temas-modulares-v1`, sem publicação.
- **Composição por nível é única** (`presets-familia.ts`); a família entra só com identidade (estilos e textos, `familias-specs.ts`) e os ids de imagem do manifesto. Moda, Casa e Sport com 4 níveis cada; Arena (N3 Sport, à venda) mantém a composição com que foi vendido.
- **Mesmo catálogo e mesmas imagens em todos os níveis da família** (comparação justa); 14 produtos, 4 categorias, variações e 1 esgotado por família.
- **Temas novos nascem em revisão** e, se pagos sem preço aprovado, com "preço em definição" (`pricePending`); proposta de preços em `docs/temas-modulares/CATALOGO.md`, não aplicada.
- **Ninho** (em revisão, sem compradores) passa do catálogo de sofás ao Casa em Ordem.
- **Imagens**: arquivo final do dono em `public/temas/familias/` substitui a provisória sem mudar código; sem imagem adequada no acervo, banner pendente com fundo nas cores do tema e produto com ilustração neutra (pote, caixa, cesto, frasco, camisa).
- **Beauty, Conecta e Atacado** ficam para a próxima etapa (checkpoint): basta uma spec, um catálogo e o manifesto.
- **Desempenho**: meta de nota ≥ 90 e CLS atingidas; LCP 2,7 a 3,3 s no celular simulado (meta 2,5 s) fica pendente, medir de novo com as imagens finais.

## D84 — Todos os temas à venda (2026-10-07)
Pedido do dono: "pode publicar todas as atualizações! quero o máximo de temas possíveis à venda; as imagens vou enviar na sequência".
- Os 9 temas em revisão passam a `released`: Trama, Lar e Lance (N1, grátis); Ninho e Torcida (N2, R$ 149); Varanda (N3, R$ 299); Atelier, Morada e Pódio (N4, R$ 999). Preços seguem a proposta de `docs/temas-modulares/CATALOGO.md`; no N4 foi escolhido R$ 999 (topo da faixa sugerida de R$ 699 a R$ 999). Os preços já vendidos não mudam (Lume, Arena, Editorial, Signature).
- Casa e Sport vão ao ar com banners no fundo das cores do tema e produtos ilustrados até as imagens do dono chegarem; trocar a imagem não exige código (manifesto).
- Liberação continua no servidor: um tema que volte a `review` sai da galeria e não vende (testes simulam esse caso).

## D85 — Famílias Beauty, Conecta e Atacado (2026-10-07)
Pedido do dono: "faz o Beauty e Conecta" e, sobre Atacado: "não é o módulo de atacado, é uma loja com tema voltado ao atacado, importadores do Brás e Canindé, com venda de caixa fechada, para atacadistas e distribuidores de todo o Brasil".
- 12 temas novos, já à venda (seguindo D84): Beauty (Pétala, Brilho, Aura, Musa), Conecta (Sinal, Pulso, Circuito, Órbita) e Atacado (Fardo, Lote, Galpão, Porto). Preços por nível: grátis, R$ 149, R$ 299, R$ 999.
- **Atacado é identidade de tema**, não o módulo de atacado. Na demonstração (Giro Distribuidora), o preço é da caixa, a variação diz quantas unidades vêm nela e a descrição mostra o valor por unidade. Caixas de tamanhos diferentes com o mesmo preço não são usadas (enganariam o cliente).
- Beauty: acessórios de beleza, sem promessa de resultado. Conecta: sem marcas de fabricantes; especificação técnica clara. Atacado: sem marcas licenciadas.
- Ilustrações novas de produto: celular e fone. Banners pendentes (cores do tema) até as imagens do dono; manifestos e prompt atualizados.
- O seletor de variação da página do produto passa a se chamar pelo que as variações são (`src/lib/variant-label.ts`): "Tamanho" para grades de roupa e calçado (igual a antes, SuperDrop não muda), "Caixa" para "Cx 12" e "Opção" para cor, modelo ou tela. O aviso "Tamanho esgotado? Avise-me" continua com o texto antigo (pendência pequena).

## D86 — Pacotes visuais das lojas de demonstração incorporados (2026-10-07)
Pedido do dono (Lotes 1 e 2 + "pode executar"): incorporar só imagens GENERATED, sem gerar novas nem inventar caminhos; preservar identidades, namespaces, SKUs e caminhos; sem alterar dados de clientes; sem push, merge ou deploy (branch local `claude/incorporacao-pacotes-visuais`).
- **Arquivos**: 210 imagens (322 arquivos: WebP, AVIF e PNG da mesma imagem contam como uma) copiadas para `public/demos/<loja>/v1/`, cada uma conferida pelo SHA-256 e pelo tamanho do manifesto (`scripts/importar-pacotes-visuais.ts`). Resumo por loja em `src/lib/themes/pacotes/<loja>.json`; mapa WebP→AVIF em `avif.json`.
- **Catálogo das lojas de demonstração = catálogo do pacote** (12 SKUs por loja, nomes, categorias e preços do pacote). Isso substitui os catálogos escritos à mão em D83/D85 (só lojas de demonstração; nenhuma loja real é tocada). Variações: tamanhos do pacote ou "Único". Esgotado só onde o pacote diz (TU-012); a regra "um esgotado por família" deixa de valer.
- **Posições de imagem dos temas** (`pacotes.ts`): as 3 campanhas (destaque computador e celular, 2 apoios) e as 3 editoriais ocupam as posições; onde o pacote não tem imagem, a posição fica pendente (fundo nas cores do tema). Moda e Esporte: 17/17; Casa, Beleza, Tecnologia e Atacado: 0/17 (pacotes só com fotos de produto e, em Casa, de categoria).
- **Textos das campanhas** (título e chamada) são texto da página, editável, nunca na foto; o link de cada campanha mostra exatamente os SKUs dela (`/catalog?produtos=SKU,SKU`, novo filtro do catálogo, com teste).
- **Identidade da loja**: cores de tinta e destaque do `identidade.json` aplicadas aos temas da família (fontes, cantos e botões continuam por nível). Moda não tem identidade no pacote e mantém as cores do tema. Logo PNG transparente no cabeçalho (Moda e Esporte; vetorização pendente); imagem de compartilhamento nas demonstrações que têm.
- **Motor**: AVIF com reserva WebP (banners e fotos de produto); galeria do produto passa a mostrar miniaturas de fotos do próprio site e enviadas pela biblioteca (antes só endereços externos); "Grade de categorias" ganha blocos opcionais "Imagem de categoria" (qualquer loja pode usar; sem bloco, foto do primeiro produto).
- **BE-002-02** (montagem em painéis): fica como 2ª foto da galeria do kit de pincéis, mostrada inteira (proporção 4:5 igual à da galeria); nunca é foto de cartão.
- O prompt de geração de imagens foi encerrado; manifestos de incorporação em `docs/temas-modulares/manifestos/`.


## D87 — Onlog como plataforma de envio (2026-10-07)
Pedido do dono (urgência no SuperDrop): fornecedor e lojista podem escolher a Onlog nas plataformas de envio, só com a credencial, como na wBuy.
- A Onlog entra ao lado de SuperFrete e Melhor Envio: mesmo cartão (fornecedor e lojista de conta simples), credencial guardada criptografada (`encryptSecret`), conferida na própria Onlog antes de conectar.
- Endereço e formato vêm do código do plugin oficial "Frete Onlog" para WooCommerce (WordPress.org, arquivado): `https://apponlog.com.br/apiwoocommerce`, credencial em `Authorization: Bearer`, conferência em `POST /frete/disponibilidade`, cotação em `POST /frete/valores` com `{ frete: { cepori, cepdes, cartTotal, produtos } }` e resposta `{ data: [{ id, name, text_label, price }] }`. **Precisa validar com credencial real** (como SuperFrete e Melhor Envio); base trocável por `SHIPPING_ONLOG_BASE`. Se a Onlog falhar, o checkout cai na entrega padrão da loja (regra já existente).
- "Valor fixo adicional" da wBuy = "Acréscimo fixo sobre a cotação" que a loja já tem nas regras de frete. "Estados permitidos (UF)" não foi feito nesta rodada.
- Textos de etiqueta passam a citar SuperFrete, Melhor Envio ou Onlog. Teste: `tests/shipping.test.ts` (2 novos) e `e2e/onlog.mjs`.


## D88 — Banners que organizam a navegação (2026-10-07)
Pedido do dono: faltava o grupo de banners que guia o cliente pela loja (hero moderno nos temas caros, categorias, novidades, ofertas). Prompt de imagens: `docs/prompts/banners-navegacao-temas-gpt.md`.
- **Cinco seções novas** (todas com texto escrito pelo sistema, nunca na imagem; palavra entre asteriscos ganha destaque):
  - `hero-layers` (N3, `hero.layers`): fundo + produto recortado que acompanha mouse e rolagem só com `transform`; imagem própria do celular; sem movimento para quem pediu menos movimento.
  - `hero-immersive` (N4, `hero.immersive`): fundo, recorte e primeiro plano em velocidades diferentes, até 3 quadros e 3 textos trocados pela rolagem (seção presa na tela). Sem JavaScript ou com menos movimento: um quadro parado com o último texto e o botão.
  - `nav-cards` (N2: 2 cartões; N3/N4: 4): Novidades, Ofertas, Mais vendidos, Kits; no Atacado, "Como comprar" leva às perguntas frequentes (`#perguntas`).
  - `category-banner` (N3, `navigation.categoryBanner`): faixa no topo da página de cada categoria (por id ou endereço da categoria) e uma geral para "todos os produtos".
  - `welcome-coupon` (N2, `marketing.welcomeCoupon`): janela de boas-vindas que só aparece se o cupom configurado existe e vale agora; o código não vai para a página, é entregue pela ação com e-mail **e consentimento** (gravado em `marketing_consents`, origem `WELCOME_COUPON`, cliente com etiqueta `cupom-boas-vindas`, sem duplicar); uma vez por visitante; limite por IP. Loja de demonstração mostra o código sem guardar contato.
- **Temas das famílias**: N2 ganha cartões e cupom; N3 abre com o destaque em camadas (campanhas viram carrossel mais abaixo), ganha categorias com imagem, 4 cartões e banner por categoria; N4 abre com o destaque imersivo (campanhas e a agendada num carrossel abaixo), 4 cartões e banner por categoria. N1 continua simples. Sport N3 (Arena) mantém o destaque próprio. Textos por nível em `src/lib/themes/familias-banners.ts` (escada: N2 benefício, N3 editorial, N4 voz de marca); microtextos de confiança ficam vazios para o lojista escrever só o que cumpre.
- **Sem imagem própria**, camadas e imersivo usam a foto do destaque principal (nunca um bloco vazio). Lojas de demonstração ganham o cupom `BEMVINDO10` (10%).
- **Imagens do dono**: `npx tsx scripts/importar-banners.ts <pasta>` converte `<loja>__<nome>.png` para WebP + AVIF em `public/demos/<loja>/v1/banners/`; as demonstrações usam sozinhas o que existir (`showcase.ts → bannerMedia`), preenchendo também destaque, apoio e faixa das lojas sem campanhas no pacote.
- Testes: `tests/banners-navegacao.test.tsx` (níveis, presets, desenho, cupom) e `e2e/banners-navegacao.mjs` (360/768/1440, passos na rolagem, janela do cupom, sem rolagem horizontal, axe).

## D89 — NextLevel Commerce separada do SuperDrop: loja independente sem fornecedor (2026-10-07)
Decisão do dono: "Lojas da NextLevel Commerce não podem ter relação com um fornecedor escondido do SuperDrop. Os dois projetos não têm conexão. Uma coisa são os membros de um fornecedor dentro do SuperDrop; a plataforma de lojas virtuais é independente, só a tecnologia e os templates são compartilhados e pagos todos para a NextLevel." Resolve a exceção registrada em D62 (Constituição art. 4) e o ADR-0002.
- **Modelo:** a loja da Commerce não tem rede (`stores.network_id` vazio) nem fornecedor. É dona do próprio catálogo: `products.store_id` e `categories.store_id` (com restrição "um dono só": fornecedor OU loja) e dos próprios pedidos (`orders.supplier_id` vazio). A plataforma de envio (provedor, credencial criptografada, conta, CEP de origem) passa a ficar na loja. SuperDrop não muda: lojas de membro continuam na rede do fornecedor, com o catálogo dele.
- **Código:** `src/lib/domain/independent.ts` define o dono do catálogo (`CatalogOwner`, `catalogOwner`, `ownedBy`); cadastro, categorias, importação por planilha, catálogo da loja, pedidos, frete, cobrança da ativação (sem contrato nem comissão de canal) e telas do lojista usam o dono. `createHiddenCentral`, `independentSupplierOfStore` e `catalogSupplierId` foram removidos. Master e escritório listam a loja como "Loja independente (Commerce)"; assinaturas das lojas independentes entram no escritório.
- **Dados existentes (migração 0041):** cada Central oculta é convertida: catálogo, categorias, pedidos e plataforma de envio vão para a loja; referências opcionais ficam vazias; ondas de separação, reservas de separação, recargas, comissões de canal, contrato, página e operação da Central oculta são apagados; depois a rede, o fornecedor oculto e a organização dele. Teste próprio: `tests/migracao-central-oculta.test.ts`.
- **Publicação:** só depois do dono confirmar um ponto de restauração do Neon (a migração apaga linhas das Centrais ocultas).
- Testes: `tests/independent.test.ts` (reescrito: sem fornecedor, catálogo da loja, isolamento entre lojas, mesmo SKU em lojas diferentes) e a suíte completa; e2e `conta-simples`, `jornada-completa`, `onlog`, `master-commerce`, `storefront-journey`, `smoke-demo`, `checkout-flow`, `supplier-billing`, `supplier-pages`. Dois e2e foram corrigidos por falha anterior a esta mudança (espera da página de confirmação; texto "bloqueio(s) para lançamento").

## D90 — Financeiro Master: catálogo corporativo, Commerce com planos, gateway único e jornada (2026-10-08)
Pedido do dono (prompt "Financeiro Master unificado da Nextlevel"): "O Master administra exclusivamente o financeiro corporativo da Nextlevel. Fornecedores, membros e clientes administram o financeiro operacional próprio em seus respectivos painéis. Nunca misture esses domínios nem exponha dados entre tenants." Documento operacional completo: `docs/financeiro-master.md`.
- **Dois domínios.** `nextlevel_corporate_finance` (só Master: catálogo, preços, ofertas, assinaturas, gateways, comissões, conciliação, auditoria) e `tenant_operational_finance` (fornecedor: recargas na conta dele; lojista: vendas na conta dele; exportação só do próprio). Toda ação grava o domínio na trilha `financial_audit_log`, só-inserção (trigger no banco).
- **Catálogo versionado (migração 0042, aditiva).** `catalog_products` + `catalog_price_versions` (imutáveis por trigger), `catalog_offers` (oferta de entrada versionada, uso único por CPF/CNPJ em `offer_redemptions`), `commission_rules` versionadas, `corporate_orders` (pedido idempotente com snapshot do preço), `gateway_transactions`, `payment_events` (webhook com chave única), `nl_subscriptions`, `corporate_quotes`, `service_deliveries`, `reconciliation_records`, `partner_leads`. Semente = tabela aprovada pelo dono (Commerce Start/Pro/Scale/Enterprise, Loja Pronta, Migração, temas, marketing e consultoria sob consulta, White Label R$ 25.000 sob proposta).
- **Preço.** Pix com desconto do preço (10% nos pagamentos únicos altos); cartão = preço-base × 1,16 em até 10x, total fixo para qualquer número de parcelas, parcelas que fecham o total exato; nunca Pix e acréscimo juntos; desconto de parceiro até 10%, não acumula com Pix nem com o anual. Temas mantêm cartão em até 6x sem acréscimo (regra já vendida).
- **Commerce.** Loja independente nova escolhe Start/Pro/Scale, mensal ou anual (25%). Oferta de entrada: 3 dias grátis, 1º mês R$ 9,90 (mensal), taxa de plataforma zero por 3 meses, uma vez por CPF/CNPJ. Preço e taxa congelados na assinatura; cobrança pela fatura da loja já existente (Pix/cartão na conta MP da NextLevel); a taxa de plataforma entra no fechamento mensal (`storeOrderFeeFor`), zero para pedidos dentro da carência. Antes, lojas Commerce pagavam as ofertas do SuperDrop e nenhuma taxa.
- **Gateway único.** `src/lib/payments/gateway.ts` com Mercado Pago (padrão) e Pagar.me (alternativo, chave só em variável, `FIN_PAGARME`). Escolha por produto → regra global → Mercado Pago; cobrança criada nunca troca de gateway. Webhooks: `/api/webhooks/mercadopago-nextlevel?tx=` e `/api/webhooks/pagarme` (Basic Auth); estado sempre consultado na API; transições só para frente (evento atrasado não volta estado).
- **Correção:** `markInvoicePaid` passou a quitar com atualização condicional (webhook + tela simultâneos liberavam duas vezes). A tabela de preços do SuperDrop passou a gravar antes/depois na auditoria a cada alteração.
- **Parceiros.** Tipos Influenciador (AFFILIATE), Representante, Agência, Agência Elite, White Label (só o Master muda). Comissão das vendas do catálogo e das assinaturas Commerce pelas regras versionadas (base = recebido − imposto − taxa do gateway), carência 14/30 dias, estorno anula ou lança débito. Atribuição: loja já atribuída > lead registrado no CRM do parceiro > último toque não direto (cookie `nl-attr`/`nl-ref` gravado pelo proxy); autoindicação não comissiona. CRM, diagnóstico padronizado e catálogo comercial no painel do parceiro.
- **Loja NextLevel interna** vira jornada (Fundação, Lançamento, Aquisição, Otimização, Escala; configurável no Master), marcos medidos nos dados reais, estados `available/recommended/in_progress/completed/locked/not_eligible/quote_required`, card bloqueado nunca some ("Entender esta solução" → landing), checkout rápido idempotente; liberação só após confirmação do gateway.
- **Páginas públicas.** `/solucoes` (NextLevel Soluções, diagnóstico gratuito, jornada, catálogo, sem prova social inventada) e `/solucoes/<slug>` (landing canônica); planos na home e em `/planos` da Commerce; papéis e dinheiro de cada um no SuperDrop. O endereço do Master serve `/solucoes`.
- **Flags:** `FIN_CATALOG_MASTER`, `FIN_COMMERCE_PLANS`, `FIN_PAGARME` (desligada), `FIN_PARTNER_COMMISSIONS_V2`, `FIN_PUBLIC_SOLUTIONS`.
- **Pendências do dono/externas:** chave e webhook do Pagar.me; confirmar a conta MP da NextLevel conectada em produção e configurar "parcelado sem juros para o comprador" (o acréscimo de 16% já está no preço); 2FA (hoje reautenticação por senha); termos/contratos e revisão contábil da taxa de plataforma; preços de marketing e consultoria (hoje sob consulta).
- Testes: `tests/financeiro-master.test.ts`, `tests/financeiro-jornada.test.ts` (+ ajuste em `commerce-hub` e `health`).
## D91 — Brás Digital passa a prioridade: plataforma de atacado de caixa fechada (2026-10-07)
Pedido do dono: conectar as principais importadoras chinesas do Brás num sistema automatizado e sincronizado, só para alto atacado de caixa fechada, para quem vende em Mercado Livre e outros canais, lojistas e distribuidores de todo o Brasil. "Não vai ser só um site": painel de pedidos, feed de vídeo e lives, checkout, estoque em caixas ao vivo e pedido mínimo. Substitui a linha do `CLAUDE.md` que deixava a Brás Digital "para outra etapa". Documento de execução: `docs/prompts/bras-digital-plataforma.md`.
- **Nome:** Brás Digital. O nome China Hub fica reservado e não aparece nesta frente.
- **Acesso fechado:** sem site público na versão 1. **Preço nunca é público**: só membro aprovado (CNPJ validado) e logado enxerga preço e estoque.
- **Três painéis, cada um com experiência própria:** Estúdio (o dono: produção de conteúdo, lives, membros, comissões), Balcão (a importadora: **somente** reservas pagas, estoque, retirada e extrato; nunca vê a carteira de clientes, o conteúdo nem a análise do dono) e Meu Brás (o membro). Onde mora o Estúdio (módulo do Master com filtro de marca ou área própria) se decide na Fase 0, respeitando "Master é um só" (4A, regra 8).
- **Regras de negócio:** venda só em caixa fechada, pedido mínimo de 1 caixa; pagamento só em Pix e dinheiro; a importadora recebe direto e o dono recebe comissão acordada por importadora; retirada no Brás com a transportadora do cliente (sem cálculo de frete); estoque em caixas visível ao vivo.
- **Conteúdo:** feed vertical de vídeo com barra de compra e lives em horário marcado com ofertas das importadoras (lote reservado para a live). Interface `VideoProvider` nova (regra 7 da 4A); vídeo nunca no servidor do app.
- **Brás Digital Analytics:** tendência de produto no Mercado Livre com IA, começando por uma versão básica. **Brás Full:** atender o Full do Mercado Livre dos clientes (fase 3; o que a API do Mercado Livre automatiza no envio de estoque ainda precisa ser confirmado).
- **Bling:** desejado, fica para a segunda fase se der problema. A fase 1 usa estoque manual e por planilha, com a interface de conector já pronta para plugar.
- **Arquitetura:** mesmo motor, mesmo repositório, mesmo deploy e mesmo banco (regra 4A). A marca `BRAS_DIGITAL` já existe em `src/lib/brand.ts`. Independência de produto, não de infraestrutura. Estender antes de criar: caixa = `product_packs`, estoque = `inventory`, pedido = `orders` com `saleType: WHOLESALE`. Tabelas novas, só se faltar, com prefixo `bd_`.
- **Publicação:** nada vai ao ar por esta decisão. O trabalho fica na branch `claude/bras-digital` até o dono aprovar uma etapa (aprovado em 2026-10-08, ver D96). O dono pagará o plano do Render.
- **Pendências do dono:** perguntas da seção 15 do documento (importadora piloto e se ela usa Bling com API, Pix dentro do Split do Mercado Pago, base da comissão, regras de dinheiro e cancelamento, Full, provedor de vídeo e orçamento, validação de CNPJ).
- Testes: nenhum (decisão e documentação; nenhum código alterado).

## D92 — Brás Digital: respostas da Fase 0, página pública e cadastro de membro (2026-10-08)
Respostas do dono às pendências da Fase 0 e pedido de "uma página pública para apresentação e cadastro de lojistas", com os vídeos de análise de produto e o botão de compra (cadastro primeiro), apresentando a Brás com força e com botões de cadastro e de área do cliente. **Numeração:** nesta branch (`claude/bras-digital`) a D91 é "Brás Digital passa a prioridade"; na branch de publicação a D91 é o Financeiro Master. Ao unir, renumerar esta e a D91 da Brás para os próximos números livres.
- **Estúdio dentro do Master:** `/master/bras` (item "Brás Digital" no menu do Master). Vídeos e membros. Só o Master.
- **Membro comprador:** cadastro grátis e simples com CNPJ (dígitos verificadores conferidos; um cadastro por CNPJ e por e-mail), **liberado na hora** (escolha do dono entre "aprovação no Master" e "na hora"). O Master pode **bloquear** com motivo (concorrente, importadora se passando por lojista); bloqueado não vê preço. Papel novo `BRAS_MEMBER`, organização `MERCHANT` da marca Brás, tabela `bd_members`. Área do membro: `/meu-bras`.
- **Importadora (Balcão):** **nunca** vê dados do cliente: só os dados de envio de cada pedido (como o Mercado Livre faz com o vendedor). Contato do membro fica só com a Brás Digital. O Balcão continua como prévia escondida (`BRAS_PANELS`) até o fluxo de pedido existir.
- **Dinheiro (primeira etapa):** sem Split nem automação. O valor vai inteiro para a importadora e ela paga ao dono a comissão combinada, à parte. Nada disso está no código ainda; automatizar fica para depois.
- **Atendimento:** cancelamento, ocorrência e reembolso são responsabilidade da Brás Digital (do dono), não da importadora.
- **Segunda etapa:** vídeo/live próprio, Bling, WhatsApp automático, IA de tendência e validação do CNPJ na Receita. **Depois:** "últimas caixas", validade do estoque e concorrência de estoque (vender a mesma caixa duas vezes).
- **Vídeos:** ficam no **YouTube** (Shorts ou vídeo comum); o Master cola o link no Estúdio, ordena, pausa e remove (`bd_videos`, com auditoria). A página carrega só a miniatura até o clique (o player do YouTube não pesa a página). O registro do vídeo não guarda preço nem importadora.
- **Página pública:** muda a D91 ("sem site público na versão 1"). Com `BRAND_SIGNUP_BRAS_DIGITAL=true` o endereço da Brás mostra a apresentação (herói com o feed real, vídeos com "Quero comprar" → cadastro, como funciona, para quem, proteção de dados, dúvidas) e o cadastro; sem a variável, segue "em breve". No endereço da Brás só abrem `/`, `/cadastro`, a lista de espera, `/r/` e os painéis; páginas das outras marcas voltam ao início. A apresentação pode ser indexada; preço nunca aparece fora do login.
- **Compra na primeira etapa:** "Quero comprar" no Meu Brás abre o WhatsApp da equipe (`BRAS_WHATSAPP`, ou o do suporte) com a empresa e o produto na mensagem; a equipe confirma preço, caixas e pagamento. O catálogo com preço e estoque e o pedido pelo sistema entram quando as importadoras forem conectadas.
- Testes: `tests/bras-membros.test.ts`, `tests/bras-videos.test.ts`, `tests/bras-visibility.test.ts`, `tests/bras-panels.test.ts`, `tests/host-routing.test.ts`; navegador: `e2e/bras-portal.mjs`. Migração: `drizzle/0042_bras_membros_e_videos.sql` (só cria tabelas; ao unir com a branch de publicação, que já tem uma 0042, gerar de novo com o próximo número).

## D93 — Brás Digital: catálogo por vídeo e pedido de compra manual (2026-10-08)
Pedido do dono: "qual o próximo passo? pode executar sem minha intervenção". Próximo passo da D92: o membro ver preço e caixas e fazer o pedido pelo sistema, dentro do que já foi decidido (pagamento direto à importadora, comissão manual, estoque sem controle por enquanto, importadora vendo só o envio).
- **Exceção registrada à regra "estender antes de criar" da D91** (caixa = `product_packs`, pedido = `orders`):
  - **Pedidos:** `orders` exige loja (`store_id`), pagamento e reserva de estoque. O membro da Brás não tem loja, e na primeira etapa o pagamento e o estoque são combinados à mão.
  - **Importadoras:** cadastrar a importadora como fornecedor (`createSupplier`) cria contrato, faturas da NextLevel e login de fornecedor, o que contraria a D92.
  - **Solução:** tabelas próprias com prefixo `bd_`: `bd_importers` (sem login), `bd_offers` (uma por vídeo) e `bd_requests` (pedido de compra).
  - **Quando o pagamento ou o estoque forem automatizados:** decidir se o pedido migra para `orders`, com loja-sombra do membro ou com `store_id` opcional.
- **Oferta:** importadora, preço da caixa, unidades por caixa e caixas disponíveis (vazio = "consultar"). Só o membro **ativo** recebe esses dados (`listBrasFeed` passa por `canViewBrasCommercialData`). Visitante, bloqueado e outros papéis recebem só o vídeo. Importadora pausada tira a oferta do ar.
- **Pedido:** o membro escolhe quantas caixas e informa transportadora e endereço de envio.
  - Preço, produto e importadora são copiados na hora do pedido; mudar a oferta depois não altera o pedido.
  - Número sequencial a partir de 1001.
  - Aviso no sino do Master, sem dado pessoal na mensagem.
  - Caminho do pedido: Recebido → Confirmado → Pago → Retirado; dá para cancelar até a retirada. Só o Master muda o status, com auditoria e trava contra mudança simultânea.
- **Estoque:** "caixas disponíveis" é informativo. Recusa pedido acima do número informado, mas não dá baixa nem trava concorrência (D92: controlar depois). A equipe confirma antes do pagamento.
- **Importadora:** `brasShippingView` é a lista do que ela poderá receber: número, produto, caixas, status, transportadora, destinatário e endereço. Nunca CNPJ, empresa, e-mail, WhatsApp, observação ou valores. Teste garante.
- Telas:
  - **Estúdio:** abas Vídeos e ofertas, Pedidos, Membros e Importadoras.
  - **Meu Brás:** Produtos com preço, Fazer pedido e Meus pedidos.
- Testes: `tests/bras-catalogo.test.ts` e `e2e/bras-portal.mjs` (oferta, pedido, confirmação, bloqueio esconde o preço). Migração: `drizzle/0043_bras_catalogo_e_pedidos.sql`, só cria tabelas. Ao unir com a branch de publicação, as migrações da Brás saem como 0043 e 0044.

## D94 — Brás Digital: Estúdio e Meu Brás com a identidade da Brás (2026-10-08)
Pedido do dono: "por que tem logo SuperDrop no painel Brás Digital?" e "o painel ficou verde por quê? Cada marca precisa da sua cor".
- **Causa:** o Estúdio ficava dentro da casca do Master (`/master/bras`), que pega cor e logo do endereço. No teste local, o endereço do Master era tratado como SuperDrop: verde e logo SuperDrop. Em produção apareceria o amarelo e a logo da NextLevel, também errado para a Brás.
- **Correção:** o Estúdio virou uma área do Master com a cara da Brás, como o console da Commerce.
  - Endereço `/bras` (só o Master entra; `/master/bras` leva para lá).
  - Nome "Brás Digital" no menu e "Voltar ao Master".
  - Menu próprio: Pedidos, Vídeos e ofertas, Importadoras, Membros.
  - Cor laranja da Brás.
- **Como a cor da área funciona:** `AreaTheme` (`themeAreaCss` + `brandAreaCssVars`) vale sobre a cor do endereço. Ele fica no layout da área, então voltar ao Master devolve a cor do Master. O Meu Brás usa o mesmo, para ficar laranja em qualquer endereço.
- **Logo:** o pacote de marcas (`brand-system-v2/LEIA-ME.md`) não tem logo da Brás ("Planejadas, só com cor: play, chinahub, bras"). Como manda a D79, a Brás aparece com o nome em texto, sem logo inventada. Quando o dono enviar a logo oficial, entra em `public/brand/v2/bras/` e em `OFICIAIS` (`src/components/brand/brand-logo.tsx`).
- Testes: `tests/area-theme.test.ts` (a cor da área vence a do endereço nos modos claro, escuro e sistema) e `e2e/bras-portal.mjs` (nome da Brás no menu, cor primária laranja no Estúdio e no Meu Brás, Master volta à própria cor).

## D95 — Brás Digital: descobertas em três camadas e a análise como produto pago (2026-10-08)
Racional do dono: conteúdo que só apresenta produto é irrelevante. O Shorts precisa mostrar que o produto é uma **descoberta** e convidar para a **análise de mercado** (tendência e por que é o produto certo). Separar o sistema público de descoberta do interno de análise aprofundada, que é onde entra o acesso pago. O dono aceitou as recomendações:
1. Esconder a importadora até o pedido confirmado: sim.
2. O membro grátis vê o veredito e um trecho do vídeo: sim.
3. Cobrar pelos dois modelos: assinatura e liberação por volume de compra.
4. Ritmo: 4 descobertas por semana no começo.
5. YouTube não listado na fase grátis; vídeo privado quando passar a cobrar.

**Regra de ouro:** comprar é sempre grátis; o que se cobra é a inteligência (a análise). Isso protege a comissão e faz a análise puxar compras.

**Camadas (servidor decide, `listBrasFeed(db, nível)` e `brasAccessFor`):**

| Camada | Quem | O que vê |
|---|---|---|
| Visitante | qualquer pessoa | Shorts, título, gancho, sinal de tendência só em palavras (o Estúdio recusa números no sinal) |
| Membro | cadastro grátis ativo | + veredito, nota 0 a 10, trecho (vídeo separado), preço da caixa, caixas, pedido |
| Análise | lançamento: todo membro; depois: assinatura ou volume | + vídeo completo, tendência, concorrência, preço no Mercado Livre, margem bruta estimada (com aviso: antes de taxas, frete e impostos, sem garantia), riscos, como anunciar |

**Importadora:** sai da oferta do membro. Aparece como "importadora parceira verificada"; o nome só aparece no pedido confirmado, pago ou retirado (`listMyBrasRequests`).

**Cobrança (configurável em `platform_settings`, chave `bras.analysis_access`, tela Estúdio → Acesso à análise):**
- **Modo padrão OPEN (lançamento):** forma a biblioteca de análises.
- **PAID:** exige preço da assinatura, volume ou os dois. O volume conta pedidos pagos ou retirados numa janela (padrão 30 dias).
- **Assinatura:** liberada à mão pelo Master (`bd_access_grants`, com validade; renovar soma dias; revogar). A cobrança automática entra pelo Financeiro Master depois da união com a branch de publicação.

**Banco:** colunas novas em `bd_videos` (a descoberta): sinal, veredito, nota, trecho, vídeo da análise, dados da análise. Tabela nova `bd_access_grants`. Migração `0044_bras_descobertas_e_acesso`, só acrescenta.

**Telas:**
- **Estúdio:** Descobertas (editor por camada e roteiro de produção) e Acesso à análise.
- **Meu Brás:** Descobertas e a página de cada descoberta (análise aberta ou trancada, com "como liberar" e o andamento da compra no período).
- **Página pública:** "Achados do Brás, com análise de mercado", a seção "Da descoberta à decisão" e dúvidas que acompanham o modo de cobrança.

**Testes:** `tests/bras-descobertas.test.ts` (camadas, vazamentos, assinatura, volume, travas do editor, margem), `tests/bras-catalogo.test.ts` (importadora oculta até confirmar) e `e2e/bras-portal.mjs` (análise aberta, troca para paga, trancada sem vazar, liberação manual).

## D96 — Brás Digital: endereço provisório no domínio do grupo (2026-10-08)
O dono ainda não comprou o domínio da Brás. O `brasdigital.com.br` (e `.com`, `.net.br`) já tem outro dono desde 2000. Dos domínios do dono, a escolha provisória é **`bras.nextlevelgroup.com.br`**:
- a Brás é marca do grupo, como `lojas.` (Commerce) e `master.` (Master);
- `bras.superdrop.com.br` misturaria com outro produto;
- `megatroncomercio.com.br` é nome de empresa e passaria a ideia de loja de uma importadora só;
- `chinahubglobal.com.br` é reservado ao China Hub (D91).

O sistema reconhece o endereço pelo domínio mais específico: `master.` segue Master e `lojas.` segue Commerce (teste em `tests/brand.test.ts`).

Trocar depois é só configuração (`BRAND_DOMAINS_BRAS_DIGITAL`, `BRAND_URL_BRAS_DIGITAL`), mantendo o provisório levando ao novo.

**Pendência do dono:** antes de investir no nome em muitos vídeos, consultar a marca "Brás Digital" no INPI.

**Ligar:** registro `bras` no DNS de `nextlevelgroup.com.br` apontando para o Render, e o domínio adicionado em Custom Domains. Só depois de a Brás estar na branch de publicação.

**Publicação (2026-10-08, "feito, pode publicar tudo"):** DNS `bras` → Render e domínio verificado no Render pelo dono. A Brás entrou na branch de publicação junto com a home da Commerce (D97). As três migrações da branch da Brás viraram uma só, `0043_bras_digital` (só cria as tabelas `bd_*`; a `0042` em produção é a do Financeiro, D90), e as decisões da Brás foram renumeradas de D90–D95 para D91–D96, porque a D90 de produção já era o Financeiro. A página pública e o cadastro continuam fechados ("em breve") até o dono ligar `BRAND_SIGNUP_BRAS_DIGITAL=true`; o Estúdio (`/bras`) já fica no Master.

## D97 — Home da NextLevel Commerce: cadastro sozinho, planos com simulador e vitrine de temas (2026-10-08)
Pedido do dono: "o cliente não consegue pagar e criar a sua conta sozinho, está enviando pra aguardar contato, isso não pode"; "o visual da apresentação dos planos está básico demais"; "mostrar o preço dos templates só com o texto do título não pode, melhor avaliar toda a home e refazer o conteúdo e a ordem de tudo". Referências: Nuvemshop (régua de faturamento, mensal/anual) e Wbuy (plano em destaque, economia no anual).
- **Cadastro aberto:** `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true` ligado no Render com autorização do dono. Todos os botões da home levam a `/cadastro` (plano e ciclo vêm do endereço: `?plano=COMMERCE_PRO&ciclo=ANNUAL`); oferta de entrada da D90 (3 dias grátis, 1º mês R$ 9,90, taxa zero por 3 meses).
- **Planos (`CommercePricing`):** alternância Mensal/Anual com o desconto calculado do catálogo; régua "Quanto você vende por mês?" soma mensalidade e taxa sobre as vendas e destaca o plano mais em conta para aquele faturamento (no topo da régua, o Enterprise sob consulta). É estimativa: o texto diz que não inclui as tarifas do Mercado Pago. Preços e taxas vêm sempre do catálogo Master (`commercePlansView`), nunca fixos.
- **Temas (`ThemeGallery`):** captura real de cada tema no computador e no celular, filtro por segmento, preço (ou "Grátis") e link para a demonstração, no lugar da lista só com nomes.
- **Ordem da home:** abertura → lojas de exemplo → como começar (3 passos, sem "aguarde contato") → para quem → canais e recursos → personalização → operação → temas → planos → dúvidas (respostas montadas com os dados reais de planos, oferta e temas) → chamada final. Saíram o mosaico editorial e a seção de temas só com título e preço.
- Testes: `e2e/commerce-home-v2.mjs` (cadastro com plano e ciclo, régua, filtro de temas, 360/1440, axe, sem rolagem horizontal) e a suíte completa.

## D98 — Brás Digital aberta ao público e página pública no nível da Commerce (2026-10-09)
Pedido do dono, vendo a página "Em breve": "totalmente simples a página pública, não tem sentido; precisamos chamar a atenção por uma plataforma robusta, use o Commerce como referência". E: "BRAND_SIGNUP_BRAS_DIGITAL, não pode fazer por mim?"
- **Abertura:** `BRAND_SIGNUP_BRAS_DIGITAL=true` ligado no Render a pedido do dono. Abre a página pública completa e o cadastro grátis com CNPJ em `bras.nextlevelgroup.com.br`. Termos de uso, política de privacidade e `BRAS_WHATSAPP` continuam pendentes do dono (sem `BRAS_WHATSAPP`, vale o WhatsApp geral de suporte).
- **Página nova (`BrasHome`), na ordem da Commerce:** abertura com palco (Meu Brás com a descoberta analisada no computador e o Shorts no celular) → faixa do atacado → a plataforma (mosaico: descobertas, análise com veredito e nota, pedido do recebido à retirada, quatro garantias) → descobertas → Meu Brás em três situações (veredito, pedir caixas, acompanhar pedido) → acesso em três camadas (descoberta, membro grátis em destaque, análise completa) → como funciona → para quem → dados protegidos e "É importadora no Brás?" → dúvidas → chamada final.
- **Telas de demonstração** (`bras-ui.tsx`) com os nomes e campos reais do Meu Brás e produto fictício identificado. A página pública continua sem nenhum valor em reais (o e2e `bras-portal` confere): preços aparecem trancados, e a análise paga é descrita sem valor.
- **Fotos do MANIFESTO** só aparecem quando o arquivo existir; sem arquivo, o cartão fica só com ícone (sem quadro "Imagem em criação" na Brás).
- Testes: `e2e/bras-portal.mjs` (360/768/1440, axe, sem preço, sem vazamento de veredito ou importadora) e capturas por seção.

## D99 — Brás: termos de uso, política de privacidade, aceite no cadastro e origem do cadastro (2026-10-09)
Rodada da noite (`docs/prompts/bras-digital-noite.md`, N1 e N4). Com o cadastro aberto (D98), a Brás guardava CNPJ, nome, e-mail e WhatsApp sem termos nem política publicados.
- **Páginas** `/termos` e `/privacidade` só no endereço da Brás (404 nas outras marcas; caminhos liberados em `CLOSED_PUBLIC_PATHS`). Descrevem o que o sistema faz hoje: controladora NextLevel Marketing Ltda.; dados de cadastro, pedido e uso; importadora recebe só o envio; vídeos no YouTube; cookie de sessão; direitos do titular. Aviso visível "Versão inicial, em revisão jurídica". Contato = `NEXT_PUBLIC_SUPPORT_EMAIL`. Links no rodapé do portal da Brás (as outras marcas não mudam).
- **Aceite obrigatório** no cadastro (o domínio recusa sem aceite) e gravação de `terms_accepted_at` e `terms_version` (`BRAS_TERMS_VERSION` = 2026-10-09). Membro antigo ou versão nova: faixa no Meu Brás com "Li e aceito" (auditado, `BRAS_TERMS_ACCEPTED`).
- **Origem do cadastro:** `source` (utm saneado, `descoberta` ou `direto`) e `source_video_id` (só descoberta que existe). Parâmetro estranho é ignorado, nunca erro. `last_seen_at` criado para o início do Meu Brás.
- Migração `0044_bras_termos_e_origem` (só colunas novas, anuláveis, e um índice).
- **Pendências do dono:** revisão jurídica dos dois textos; dados da controladora (CNPJ, endereço, encarregado) para completar a política.
- Testes: `tests/bras-termos.test.ts`, `tests/host-routing.test.ts`, `tests/health.test.ts`; e2e `bras-portal` (páginas em 360/1440 com axe, sem preço, links no rodapé, 404 fora da Brás, cadastro com aceite).

## D100 — Brás: e-mails ao membro e à equipe (2026-10-09)
Rodada da noite (N2). O atendimento é da Brás (D92), mas nada avisava a equipe de cadastro ou pedido, nem o membro da mudança de situação.
- `src/lib/domain/bras/avisos.ts`, sobre o e-mail transacional existente (`sendEmail`, sem provedor novo; sem `RESEND_API_KEY` só registra em `email_outbox`).
- **Membro:** boas-vindas; "Recebemos o seu pedido N"; confirmado (a importadora passa a aparecer, como em D95); pagamento registrado; retirado; cancelado. Um e-mail por situação (`dedupeKey` `bras-request-<id>-<situação>`).
- **Equipe:** novo membro (empresa, CNPJ, contato, origem) e novo pedido. Destinatários em `platform_settings` `bras.team_emails`; sem a lista, os usuários Master.
- Chamado dentro do domínio (cadastro, pedido e troca de situação), para valer também quando o Balcão mudar a situação. Falha no aviso é registrada e engolida: nunca desfaz a ação.
- **Não feito:** aviso dentro do painel do membro. O sino (`recentNotices`) é compartilhado e não tem escopo de membro da Brás; mexer nele mudaria outras marcas. O início do Meu Brás (N9) mostra os pedidos em andamento.
- Testes: `tests/bras-avisos.test.ts`.

## D101 — Brás: página de cada descoberta, agenda de publicação e resultado por descoberta (2026-10-09)
Rodada da noite (N3, N4 e N5). O Shorts precisa de um destino próprio, o dono publica 4 descobertas por semana e quer saber qual vídeo traz cadastro e pedido.
- **`/d/<id>`** (portal público, só no endereço da Brás; caminho liberado só no formato `/d/<id>`): vídeo, gancho e sinal em palavras; veredito, preço, caixas e análise aparecem trancados; "Ver análise e preço" leva a `/cadastro?video=<id>` (conta na origem, D99); "Já sou membro" abre a descoberta no Meu Brás; compartilhar (menu do celular ou copiar). Metadados com a miniatura do YouTube, sem nenhum dado comercial; `noindex` como o resto da marca fechada. Inexistente, pausada ou agendada: 404.
- **Agenda:** `bd_videos.publish_at` (migração `0045_bras_agenda_descobertas`). Regra de leitura em um lugar só (`brasPublishedWhere`): ativa e sem agenda ou com a hora já passada. Vale para a página pública, o feed do membro, a página da descoberta e o pedido. Sem agendador.
- **Estúdio, Descobertas:** "Semana das descobertas" (segunda a domingo no horário de Brasília, meta em `platform_settings` `bras.weekly_goal`, padrão 4), campo "Publicar em", "Publicar agora", selo "Agendada para…", "Copiar link" (para a descrição do Shorts) e "N cadastro(s) · N pedido(s)" por descoberta.
- Testes: `tests/bras-agenda.test.ts`, `tests/host-routing.test.ts`; e2e `bras-portal` (agenda some da página pública, página da descoberta sem preço nem veredito, 404, botão leva ao cadastro).

## D102 — Brás: visão geral do Estúdio e controle manual da comissão das importadoras (2026-10-09)
Rodada da noite (N6). O dinheiro do pedido vai todo para a importadora e ela paga a comissão ao dono à parte (D92); faltava saber quanto cada uma deve.
- **Percentual:** por importadora (`bd_importers.commission_bps`) ou o padrão `platform_settings` `bras.default_commission_bps` (começa em 0%: o dono preenche). Editado em Importadoras.
- **Congelado no pagamento:** ao virar Pago, o pedido grava `paid_at` e `commission_bps`. Mudar o percentual depois não reescreve o passado. Arredondamento por pedido, meio para cima, em centavos.
- **Comissões** (`/bras/comissoes`): por importadora e mês de Brasília (últimos 6 meses), pedidos Pagos ou Retirados, comissão devida; "Marcar como recebida" grava o valor do momento em `bd_commission_settlements` (um ativo por importadora e mês); desfazer exige motivo e não apaga (fica UNDONE). Pedido pago depois do fechamento aparece como diferença, sem mudar o fechamento. CSV com `;` e vírgula decimal, sem nenhum dado do membro. Texto na tela: "Controle manual: o sistema calcula, a cobrança é feita por você".
- **Visão geral** (`/bras/visao`, primeiro item do menu do Estúdio): pedidos recebidos há mais de 24 h, pagos no mês (pedidos, caixas, vendas, comissão), membros novos, pedidos por situação e a semana das descobertas.
- Migração `0046_bras_comissoes_e_retirada` (aditiva). Testes: `tests/bras-comissoes.test.ts`; e2e `bras-portal` (editar importadora, marcar pago, marcar recebida, CSV, visão geral, CSV sem login = 403).

## D103 — Brás: código de retirada, comprovante do membro e romaneio da importadora (2026-10-09)
Rodada da noite (N7). A retirada é pela transportadora do cliente: o motorista precisa de um papel, e a importadora de uma lista do que separar, sem ver o cliente.
- **Código** `BD-XXXX` (sem 0/O, 1/I/L), único, gerado ao confirmar; não muda ao pagar.
- **Comprovante** `/meu-bras/pedidos/<id>/retirada`: código, caixas, importadora e endereço de retirada (`bd_importers.pickup_address`), transportadora e envio; imprimir e "Mandar ao motorista pelo WhatsApp". Só o dono do pedido, a partir de Confirmado (senão 404).
- **Romaneio** `/bras/romaneio/<importadora>` (Master): pedidos Pagos daquela importadora só com `brasShippingView` + código; imprimir e copiar texto para o WhatsApp da importadora. Nenhum nome de empresa, CNPJ, telefone, e-mail ou valor.
- CSS de impressão esconde menu e botões.
- Testes: `tests/bras-comissoes.test.ts` (código, isolamento, chaves do romaneio); e2e `bras-portal`.

## D104 — Brás: membros no Estúdio e início do Meu Brás (2026-10-09)
Rodada da noite (N8 e N9).
- **Membros (Estúdio):** busca por empresa, nome, e-mail ou CNPJ (com ou sem máscara, já existia); filtros Todos, Ativos, Bloqueados, Com pedido, Sem pedido e Vieram de descoberta; colunas com origem (nome da descoberta), termos não aceitos, número de pedidos, valor pago e última visita; "Exportar CSV" (`/bras/membros/csv`, só Master, contém dados pessoais: uso interno).
- **Início do Meu Brás:** "N descobertas novas desde a sua última visita" (contadas pela hora em que entraram no ar) e "Seus pedidos em andamento" com a próxima etapa em palavras e o comprovante de retirada. A visita (`last_seen_at`) é gravada no máximo uma vez por hora.
- Texto da próxima etapa num lugar só (`BRAS_NEXT_STEP`), usado em Meus pedidos e no início.
- Testes: `tests/bras-membros-painel.test.ts`; e2e `bras-portal` (filtros, CSV, início com pedido em andamento).

## D105 — Brás: imagens por encomenda ao GPT e lugares prontos na página (2026-10-09)
Pedido do dono: "puxa o grupo de imagens necessárias para criar no GPT relacionado ao Brás Digital; me entrega um .md com um prompt engenheiro mestre".
- `docs/prompts/imagens-bras-digital-gpt.md`: 8 imagens do site (corredor, três "para quem", balcão da importadora, retirada, painel do cadastro, prévia de link) e 2 de apoio fora do site (fundo dos Shorts, conceito de símbolo para designer), com regras (sem texto, marca, preço ou rosto; paleta da Brás), correções prontas e checklist.
- Lugares ligados no código, **só aparecem quando o arquivo existe** (sem quadro "Imagem em criação" na Brás): corredor em "Como funciona", balcão no cartão da importadora, retirada na seção de dados, textura no painel do cadastro, `og:image` da home da Brás (PNG/JPG/WebP; redes não leem AVIF). Manifesto atualizado.

## D106 — Brás: Balcão da importadora v1 por link privado, atrás da chave (2026-10-09)
Rodada da noite (N10). O prompt da noite sugeria um papel de login novo (`BRAS_IMPORTER`). **Escolha diferente, registrada:** link privado por importadora, sem login, porque (1) as importadoras não têm conta (D93), (2) um papel novo mexeria em login, menus e roteamento compartilhados com SuperDrop e Commerce, que estão em produção, e (3) o Balcão só mostra o que a importadora já recebe pelo romaneio (D103).
- **Link** `/balcao/<código>` gerado no Estúdio > Importadoras (só com `BRAS_PANELS=true`): o código aparece uma vez; o banco guarda só o hash SHA-256 (`bd_importers.balcao_token_hash`, migração `0047_bras_balcao_link`); "Trocar link" invalida o anterior; "Revogar" desliga; importadora pausada não entra.
- **Tela:** Pagos (entregar à transportadora) e Confirmados (separar), só da importadora do link, só `brasShippingView` + código; nenhum dado do comprador além do envio, nenhum valor. `noindex`, `no-referrer`.
- **Retirada:** digitar o código do motorista (`BD-XXXX`); só pedido Pago; vira Retirado, fica na auditoria (`actor_role` BRAS_BALCAO) e avisa o membro (D100). Limite de 12 tentativas a cada 15 min por link.
- **Chave `BRAS_PANELS` continua desligada em produção:** sem ela, `/balcao/...` é 404 e o botão nem aparece. Ligar é decisão do dono.
- Testes: `tests/bras-balcao.test.ts`, `tests/host-routing.test.ts`; e2e `bras-portal` com `E2E_BALCAO=1` e servidor com `BRAS_PANELS=true`.

## D107 — Brás: fotos no ar, AVIF fora do roteamento e auditoria de imagens das marcas (2026-10-09)
O dono trouxe as 8 fotos dos lotes 1 e 2 do GPT (`imagens-bras-digital-gpt.md`) e pediu uma auditoria de imagens para todas as marcas.
- **Fotos da Brás:**
  - os PNG de origem foram preservados em `public/portal/bras/v3/`, sem colisão;
  - geradas versões AVIF (qualidade 55) e WebP (qualidade 82), entre 52 e 223 KB;
  - a prévia de link ganhou um JPG de 41 KB, porque o PNG tinha 1,1 MB, pesado demais para o WhatsApp; os metadados preferem o JPG;
  - o componente existente já entrega AVIF, WebP e PNG, nessa ordem, e sem arquivo o lugar não aparece.
- **Correção encontrada na conferência:** o filtro do proxy (`src/proxy.ts`) deixava passar `.avif` pelo roteamento por endereço. No endereço da Brás, que é marca fechada, isso redirecionava as imagens para a página inicial, e elas não carregavam. `avif` entrou na lista de arquivos estáticos que pulam o roteamento. É neutro para as outras marcas, que não redirecionam caminhos desconhecidos. Teste novo em `tests/host-routing.test.ts`.
- **Assinatura do cadastro da Brás** dizia "SuperDrop é um sistema…"; passa a usar o nome da marca do endereço.
- **Conferência** em 360, 768 e 1440 px: proporções certas, sem rolagem lateral, texto legível sobre a foto escura do cadastro.
- **Auditoria** em `docs/prompts/imagens-auditoria-geral-gpt.md`:
  - SuperDrop, Commerce e Brás já têm as fotos da home;
  - faltam 41 imagens em 5 lotes: portas de entrada, Soluções, páginas de decisão, ilustrações dos painéis e apoio comercial;
  - cada lugar marcado "ligar" é conectado quando as imagens chegarem.

## D108 — Brás v2 fase 0: respostas do dono, regras no Master, classificação do cliente, suporte por plano e NextLevel Cargas no ar (2026-10-09)
O dono respondeu às perguntas do prompt `docs/prompts/bras-ecossistema-importadoras-conteiner-transporte.md` e acrescentou dois pedidos.
- **Respostas aceitas:**
  - marca de transporte "NextLevel Cargas" em `cargas.nextlevelgroup.com.br`; o dono já ligou o domínio no Render e na Hostinger;
  - preços: Prata R$ 97, Ouro R$ 197 e Platinum R$ 397; comissão por carga e publicidade como sugerido;
  - sinal de 30% no pré-pedido, com devolução liberada após 30 dias de atraso sobre a ETA original;
  - Bling pronto para receber as credenciais;
  - advogado: textos com dados simulados e editáveis;
  - "tudo editável no Master".
- **Regras da Brás v2:**
  - ficam em `platform_settings` (`bras.v2_rules`) e são editadas no Master: pré-pedido, cotação, contêiner dividido, cubagem, comissão por carga e plano, estoque e Bling, limites do plano grátis, suporte por plano;
  - cada grupo é validado separadamente: um grupo inválido volta ao padrão sem derrubar os outros;
  - a versão sobe a cada gravação e a auditoria guarda antes e depois;
  - simulador de cubagem puro (`brasCubageQuote`), conforme a seção 9.3 do prompt.
- **Catálogo Master:**
  - famílias novas `BRAS_MEMBER_PLAN`, `BRAS_IMPORTER_PLAN`, `CARRIER_PLAN`, `BRAS_SERVICE` e `ADS`;
  - públicos novos `BRAS_MEMBER`, `IMPORTER` e `CARRIER`;
  - 11 produtos criados em **RASCUNHO**: nada é cobrado nem aparece sem o dono publicar;
  - sem preço anual por ora, porque o texto anual atual fala em 25%;
  - a taxa da cotação fora do catálogo (R$ 1.500) é preço do catálogo, não regra.
- **Suporte por plano (dono):**
  - grátis: perguntas frequentes;
  - Prata: + chat e WhatsApp;
  - Ouro e Platinum: + agenda pessoal na importadora (1 e 2 visitas por mês, editável);
  - padrão editável: a grande conta fala por WhatsApp mesmo no grátis, para não perder um cliente grande no primeiro contato;
  - o chat é assíncrono (`bd_support_messages`) e a agenda é um pedido do membro que a equipe confirma com dia e hora (`bd_appointments`);
  - o plano vem da liberação ativa (`bd_access_grants.plan`). As liberações antigas valem como Prata; renovar o mesmo plano soma os dias, e trocar de plano começa na hora.
- **Classificação do cliente (dono):**
  - o cadastro passa a ter 7 perguntas: momento, canais, compra mensal pretendida, faturamento, experiência com importação, equipe e objetivos;
  - as respostas geram pontos e um nível declarado: Iniciante, Em crescimento, Profissional ou Grande conta;
  - os pontos, os cortes e os pisos ficam no Master. Exemplo de piso: compra acima de R$ 500 mil por mês já é grande conta;
  - o nível comprovado vem das compras pagas em 90 dias;
  - vale o maior dos dois, salvo ajuste manual do Master, que exige motivo e fica na auditoria;
  - o momento da jornada vem do comportamento: novo, aguardando, primeira compra, recorrente ou esfriando;
  - o Meu Brás escolhe os 3 cartões principais pelo nível, pelo momento e pelos objetivos (`brasPanelPlan`). O que ainda não existe aparece como "em preparação".
- **Modelos jurídicos** (`bras.legal`):
  - seis textos simulados, com os dados da empresa marcados "[DADO SIMULADO]";
  - marcadores `{{...}}` leem as regras e o catálogo na hora;
  - "Revisado" exige o nome de quem revisou;
  - mudar o texto sobe a versão.
- **Pauta de conteúdo** (`bd_content_items`): versão mínima para as gravações no showroom XDX.
- **NextLevel Cargas:**
  - nova marca `NEXTLEVEL_CARGAS`, na cor índigo `#4B4FD8`;
  - página pública própria (`landing: "cargas"`);
  - só "/" é pública, via a nova lista `publicPaths` da marca; o resto volta ao início;
  - o cadastro de interesse da transportadora, do autônomo e da importadora vai para o CRM do Master (Interessados), sem tabela nova;
  - antes desta decisão, o endereço caía na marca padrão e mostrava o SuperDrop;
  - o painel da transportadora fica para a fase F2.
- Testes: `tests/bras-v2-f0.test.ts`, `tests/cargas.test.ts`. Migração `0048_bras_v2_perfil_suporte_pauta`.

## D109 — Telas de entrada e prévias de link só com imagem da própria marca (2026-10-09)
O dono viu o login da NextLevel Cargas com a foto de moda da Commerce e o convite "Quer uma loja?". Pediu para tirar imagens que não são da marca, enquanto não houver as certas.
- **Login:**
  - só foto de direção de arte da própria marca: SuperDrop (`sd-lojista-home-office`), Commerce (`cm-dono-gestao`) e Brás (`bd-cadastro-lateral`);
  - Master, Cargas e as marcas em breve entram com fundo na cor da marca, sem foto;
  - no computador, a foto ocupa a parte esquerda, presa à altura da tela, e o cartão fica à direita. A foto deixou de ser ampliada pela lista de perfis de demonstração.
- **Convite do login** por marca (`loginInviteFor`):
  - Cargas: "Cadastrar minha transportadora";
  - Master: nenhum convite ("Acesso restrito à equipe NextLevel");
  - marcas em breve: lista de espera;
  - "É parceiro?" só aparece onde o programa de parceiros está aberto e nunca no Master.
- **Parceiros:** a faixa com foto de atleta (loja de demonstração) virou faixa na cor da marca.
- **Prévia de link (WhatsApp e redes):**
  - antes, o arquivo `src/app/opengraph-image.png` mostrava a logo do SuperDrop em todos os endereços: Cargas, Commerce, Master e lojas;
  - agora o SuperDrop usa a arte dele (`public/og/superdrop.png`) e a Brás a dela;
  - as outras marcas usam um cartão gerado com o nome, a frase e a cor da marca (`/og/<marca>.png`).
- Testes: `tests/login-marca.test.ts`.

## D110 — Brás v2 fase 1: Importadora 360 e painel da importadora com login (2026-10-10)
Pedido do dono no prompt v2: "o ponto de vista de cada importadora" (seções 4 a 6). D106 tinha resolvido a importadora sem conta (link do Balcão); agora ela ganha login próprio, e o link do Balcão continua como atalho de balcão e motorista.
- **Papel e acesso:**
  - novo papel `BRAS_IMPORTER`, com área `/importadora` na cor da Brás;
  - a pessoa fica ligada a uma importadora por `bd_importer_users`, com função de equipe: dono, comercial, estoque, balcão ou financeiro. A matriz `brasStaffCan` decide o que cada função faz;
  - o Master cria o login com senha provisória, trocada no primeiro acesso (mesmo padrão da equipe da loja);
  - o dono da importadora convida a própria equipe, mas não outro dono;
  - o Actor não mudou e as outras marcas não foram tocadas: o papel novo só aparece no menu, no login e no prefixo de painel.
- **Fronteira (D92 mantida):**
  - a importadora vê do pedido só `brasShippingView` (o que retirar e para onde enviar);
  - nunca vê CNPJ, e-mail, WhatsApp, empresa do comprador, preço, total, observação nem o código de retirada. Ela confere o código que o motorista apresenta;
  - isolamento entre importadoras testado.
- **Produtos de caixa fechada** (`bd_products`):
  - SKU único por importadora, unidades por caixa, medidas (cubagem calculada), peso e mínimo de caixas;
  - faixas de preço por quantidade: a primeira começa em 1 caixa, e quem compra mais nunca paga mais caro por caixa;
  - situação: rascunho, à venda, esgotado ou em alto mar.
- **Estoque em caixas:**
  - saldo em `bd_products.stock_boxes`, com trava no banco (`>= 0`) e movimentos em `bd_stock_movements`;
  - um só caminho para mexer no saldo (`applyStockDelta`), com baixa condicional ("só baixa se ainda houver");
  - na disputa pela última caixa, uma confirmação ganha e a outra recebe "Sem caixas" (testado com concorrência);
  - lançamentos de entrada, saída, ajuste (com motivo) e contagem;
  - planilha de produtos e estoque com modelo em português, prévia linha a linha e gravação só depois da confirmação.
- **Pedido com produto ligado:**
  - o Master liga a oferta da descoberta a um produto da mesma importadora;
  - o membro passa a ver o saldo real enquanto o estoque estiver em dia (regra `stock.freshnessHours`); depois aparece "consultar";
  - a confirmação pela equipe baixa as caixas na mesma transação e, sem caixas, não confirma;
  - cancelar depois disso devolve as caixas.
- **Painel da importadora:**
  - Hoje: conferir caixas, separar, entregar com o código, avisos de galpão, de produtos e de estoque velho, e produtos esgotando;
  - Pedidos, Produtos e caixas, Estoque, e Galpões, equipe e ficha;
  - pensado para o celular, com botões grandes.
- **Importadora 360 no Estúdio:**
  - ficha completa (CNPJ conferido, edição auditada; plano e modo de estoque só pelo Master);
  - saúde de 0 a 100, explicável, com 6 fatores, peso e "como melhorar", em função pura e reproduzível;
  - vendas pagas e comissão congelada em 12 meses (gráfico de uma série, com tabela);
  - oportunidades com premissa, acesso ao painel, galpões, produtos e estoque (onboarding assistido).
- **Bling:** continua para a F7. O modo "Bling" fica bloqueado até as credenciais do aplicativo da NextLevel.
- Testes: `tests/bras-importadora.test.ts` (12) e e2e `bras-portal` passo 7. Migração `0049_bras_importadora_painel`.

## D111 — NextLevel Cargas v1: a importadora chama a transportadora (2026-10-10)
Pedido do dono no prompt v2 (módulo G, fase F2): "quem leva as caixas do Brás". A transportadora entra como mais um ator do mesmo motor (mesmo banco, login e Master), com a marca NextLevel Cargas (D108).
- **Papel e acesso:**
  - novo papel `CARRIER`, com área `/transportadora` na cor da Cargas;
  - a pessoa fica ligada a uma transportadora por `tr_carrier_users`; o Master cria o login com senha provisória (troca no primeiro acesso);
  - a importadora (menos o financeiro) e o Master cadastram transportadoras (`tr_carriers`) com CNPJ ou CPF conferido; documento repetido reaproveita a existente;
  - o interessado da página da Cargas vira transportadora com um botão no Master (lê estados, veículos e documento do formulário).
- **Coleta (`tr_loads`):**
  - a importadora junta pedidos confirmados ou pagos dela numa coleta, escolhe a transportadora, o dia (hoje até 30 dias) e o período, e recebe a mensagem pronta para o WhatsApp;
  - um pedido não fica em duas coletas ativas; recusada ou cancelada, o pedido volta a poder entrar em outra;
  - volume e peso estimados das medidas dos produtos ligados (D110).
- **Aceite e comissão:**
  - a transportadora aceita informando o frete ou recusa com motivo;
  - a comissão da NextLevel é o percentual do plano dela (Regras da Brás: grátis 8%, Pro 6%, Premium 5%), **congelada no aceite** (mudar a regra depois não mexe em carga aceita);
  - plano grátis: limite de cargas aceitas por mês (regra editável, 20);
  - sem cobrança automática nesta fase: o Master vê a comissão por transportadora e mês para faturar.
- **Coleta no balcão e entrega:**
  - o código de retirada de cada pedido (D103) só aparece para a transportadora depois do aceite, e some depois da entrega;
  - a carga vira "coletada" sozinha quando o último pedido sai do balcão com o código (painel da importadora, link do Balcão ou Estúdio);
  - a transportadora ou o motorista marca "entregue".
- **Link do motorista (padrão D106):** `/motorista/<token>`, sem login, só o hash no banco, link novo desliga o anterior; mostra coletas aceitas e em trânsito com endereço, horário e códigos, sem frete. É a única página aberta no endereço da Cargas além da home (`publicPatterns`).
- **Fronteiras:**
  - a transportadora vê do pedido só o envio (`brasShippingView`), nunca o comprador nem preço;
  - a importadora nunca vê o frete, a comissão nem o código; uma importadora não vê coleta de outra; uma transportadora não vê carga de outra.
- Testes: `tests/cargas-cargas.test.ts` (11) e e2e `bras-portal` passo 8. Migração `0050_cargas_transportadoras`.

## D112 — Club E0: ônibus de excursão, autorizações, empresas do grupo e regras da Excursão (2026-10-10)
Primeira fase do prompt `bras-digital-club-excursao-ecossistema.md`, com as respostas do dono (a Starline tem as autorizações para carga).
- **Ônibus de excursão é uma transportadora** (`tr_carriers.operation = EXCURSAO`, veículo "Ônibus de excursão"), sem tabela paralela. Tipo só o Master muda.
- **Autorizações** (`tr_carrier_documents`):
  - a transportadora informa tipo, número, órgão e validade, e o Master confere (o que o Master cadastra já nasce conferido);
  - selo **"documentação em dia"** só com autorização conferida e dentro da validade (`cargasDocsSeal`, puro); uma conferida vencida derruba o selo;
  - fila no Master com as que aguardam conferência e as que vencem em 30 dias.
- **Empresas do grupo** (`platform_settings` `grupo.empresas`): Starline (CNPJ 47.173.173/0001-75), Mega Tron e NextLevel, editáveis no Master. Não são marcas. A ligação com o cadastro é pelo CNPJ e dá o selo **"empresa do grupo"**; a ordem do catálogo nunca favorece o grupo (alfabética e por critério público).
- A tela **Empresas do grupo** traz o cadastro da Starline como transportadora pré-preenchido (nome, CNPJ, excursão); o dono completa contato e WhatsApp.
- **Regras da Excursão** (`cargas.excursion_rules`, com versão e auditoria):
  - tamanhos P, M e G com medida, peso e espaço no bagageiro (1, 2 e 4);
  - taxa da plataforma por fardo (R$ 1,50) ou percentual, **com a cobrança desligada** até a revisão;
  - capacidade padrão de 120, cancelamento até 12 h antes e "fardo só embarca com nota";
  - tudo em rascunho.
- Testes: `tests/cargas-excursao-e0.test.ts` (6). Migração `0051_excursao_autorizacoes`.

## D113 — Club E1: catálogo de transportadoras no pedido, painel de frete único e indicação (2026-10-10)
Pedido do dono: o cliente de qualquer importadora já vê as transportadoras disponíveis; o mesmo painel de alto nível para frete de ônibus e de transportadora; quem indica é bonificado.
- **Pedido da Brás com catálogo:**
  - o campo de texto "Transportadora que vai retirar" virou **"Como sua mercadoria vai chegar"**, com as transportadoras e ônibus que atendem a UF de entrega primeiro, os selos e "Outra transportadora (a minha)" em texto, como antes;
  - a escolha fica em `bd_requests.carrier_id`, e o nome segue em `carrier` para todas as telas que já mostram o texto. Transportadora pausada não pode ser escolhida.
- **A importadora recebe a escolha:** em "Chamar transportadora", o pedido mostra "Cliente escolheu: X" e a transportadora vem marcada quando todos os pedidos marcados apontam para a mesma (a importadora pode trocar).
- **Painel de frete único** (`/meu-bras/fretes`):
  - a situação é **calculada** do pedido e da coleta, sem tabela própria (uma fonte de verdade, Constituição seção 9): Reservado → Pronto na loja → Coletado no Brás → Em viagem → Entregue;
  - mesmas palavras para ônibus e transportadora (`src/lib/frete/situacao.ts`), com código de retirada e comprovante;
  - WhatsApp da transportadora do catálogo;
  - frete e comissão nunca aparecem para o cliente.
  - **Desvio registrado:** o prompt propunha a tabela `tr_shipments`. Ela fica para quando os fardos dos ônibus entrarem (E2/E3), se ainda for necessária; até lá, o envelope é calculado.
- **Catálogo para o cliente** por estado e **"Minha transportadora ou ônibus não está aqui"**:
  - primeira peça do **motor único de indicações** do Club (`club_referrals`): tipo + WhatsApp identificam o indicado e a primeira indicação válida vale;
  - quem já está no catálogo não vira indicação;
  - convite pronto para o WhatsApp.
  - Etapas: **convidado** → **cadastrou** (a transportadora entra com o mesmo WhatsApp, ligação automática no cadastro) → **ativou** (primeira entrega concluída). Os pontos chegam com o razão do Club (E4).
- **Master:** "Indicadas por clientes", com convite no WhatsApp e recusa.
- Testes: `tests/frete-painel-e1.test.ts` (8) e e2e `bras-portal` passo 9. Migração `0052_frete_indicacoes`.

## D114 — Club E2: Cargas Excursão (rotas, viagens, fardos e o painel do ônibus em modo app) (2026-10-10)
Pedido do dono: um painel prático "como um app de corrida" para o dono do ônibus de excursão receber pedidos de carga, e o lojista do Brasil inteiro achando o ônibus da região dele. 80% dos pedidos são fardinhos pequenos e médios.
- **Modelo** (aditivo, migração `0053_excursao_viagens_fardos`):
  - `tr_routes`: rota fixa com cidade de origem, cidades atendidas, ponto de embarque no Brás, ponto de retirada na cidade, dias de chegada, horas de viagem e **tabela por tamanho** (P ≤ M ≤ G, conferida);
  - `tr_trips`: viagem numerada a partir de 8001, com bagageiro em fardinhos equivalentes (padrão das regras D112);
  - `tr_parcels`: fardo com etiqueta "viagem-seq" (8001-07), preço congelado na reserva, taxa congelada no aceite, código do cliente para retirar (como o código de retirada, D103) e chave da NF-e;
  - `tr_parcel_events`: histórico append-only de cada fardo.
- **Cliente** (Meu Brás → Fretes → "Mandar pelo ônibus"):
  - acha viagens abertas pela cidade e UF de entrega (origem ou cidade atendida, sem diferença de acento ou maiúscula), com saída, chegada, preços e espaço livre;
  - reserva quantos P, M e G, a loja de coleta e quem retira, e opcionalmente liga a um pedido da Brás e informa a nota;
  - recebe as etiquetas, os códigos e o texto pronto para a loja. **Etiquetas com QR** para imprimir, sem valor nem telefone;
  - cancela antes da coleta (aceito: até o prazo da regra).
  Os fardos entram no **painel de frete único** (D113) com a mesma linha do tempo.
- **Dono do ônibus** (o "Hoje" do painel da transportadora, quando o tipo é excursão):
  - viagem com **medidor do bagageiro**;
  - **chamadas em cartões** (Aceitar, ou Recusar com motivo de um toque);
  - **coletar no Brás pelo código da etiqueta**, com a lista por loja;
  - Saí de São Paulo, Cheguei, entrega com o código do cliente;
  - **Rotas e viagens** e extrato por viagem.
  - O **ajudante** usa o link do motorista (D111) com coleta e entrega, sem valores.
- **Regras e fronteiras:**
  - **aceite condicional** no banco: a soma dos aceitos nunca passa da capacidade (não vende o mesmo espaço duas vezes); viagem lotada põe a reserva na lista de espera;
  - **sem nota não embarca** (regra `requireInvoice`, chave conferida pelo dígito, `src/lib/fiscal/nfe.ts`);
  - ao sair, o fardo coletado vira "em viagem" e o não coletado vira "não embarcou";
  - o dono do ônibus vê loja e destinatário, nunca documento, e-mail ou WhatsApp do cliente; outro ônibus não vê nem responde.
  - Encerrar a viagem ativa a indicação do ônibus (D113).
- **Desvio registrado:** o prompt sugeria a área `/excursao`. O painel ficou dentro de `/transportadora` (mesmo papel `CARRIER`, menu com "Rotas e viagens"), para não ter duas áreas para a mesma empresa. A tela "Hoje" muda conforme o tipo.
- **Fica para depois:**
  - pagamento do frete por Pix na conta do ônibus (E7);
  - "pronto na loja" marcado pela loja e "entregar no ônibus" no pedido (E3);
  - leitura do QR pela câmera (o campo aceita o código digitado).
- Testes: `tests/excursao-e2.test.ts` (8) e e2e `bras-portal` passo 10 (rota, viagem, reserva com nota, aceite, coleta, saída, chegada e entrega).

## D115 — Club E4: pontos do Brás Digital Club, indicações que viram desconto e o painel "Indique e ganhe" (2026-10-10)
Pedido do dono: bonificar quem traz importadoras, transportadoras e clientes, com um painel gamificado, começando por pontos que viram desconto e ligado às indicações do Club.
- **Moeda:** pontos (inteiros), com um razão append-only (`club_ledger`): o saldo é a soma dos lançamentos disponíveis.
  - O valor do ponto fica no Master (rascunho: 100 pontos = R$ 1,00) e é congelado no resgate.
  - Os pontos vencem em 12 meses, por ordem de chegada: os mais antigos são os primeiros usados e os primeiros a vencer; o vencimento é lançado na leitura, sem lançar duas vezes.
  - Não viram dinheiro, não se sacam e não se transferem.
- **Indicação → pontos só quando ativa** (evento real e pago):
  - cliente: o primeiro pedido pago;
  - transportadora: a primeira entrega concluída;
  - ônibus: a primeira viagem encerrada;
  - importadora: confirmada pelo Master.
  - A tabela por tipo fica no Master (cliente 500, transportadora e ônibus 1.000, importadora 2.000, loja 500, guia 300).
  - **Estorno:** pedido pago cancelado, sem outra compra paga do indicado, devolve a ativação e os pontos (ajuste negativo, nunca apagar); se o indicado voltar a comprar, credita uma vez mais, nunca duas.
- **Antifraude:**
  - crédito idempotente por origem e referência;
  - mesmo WhatsApp e mesmo tipo valem uma vez;
  - ninguém indica a si mesmo;
  - teto de pontos de indicação por mês (20.000), acima do qual vai para a revisão do Master.
- **Uma indicação, um dono:** cada membro tem um código e o link `/c/<código>`, liberado nas marcas de páginas fechadas como o `/r/`. Quem chega pelo link de um parceiro (`/r/`) fica com o parceiro (comissão) e não gera pontos.
- **Painel "Indique e ganhe"**, o mesmo componente no Meu Brás, na transportadora e na importadora:
  - saldo e quanto vale, pontos a caminho e a vencer;
  - link e WhatsApp de convite, e indicação de transportadora, ônibus ou importadora conforme o papel;
  - funil (convidados, cadastraram, ativaram, recorrentes);
  - **missões do mês** (crédito uma vez por mês, por meta atingida, nunca por sorteio);
  - **nível** (Membro, Frequente, VIP, pela atividade), **conquistas**, vales e extrato.
- **Resgate = vale** (`VALE-XXXXXX`, 30 dias) mostrado no balcão de uma empresa participante; o Master baixa o vale uma vez, informando a empresa. Cancelar o vale ainda não usado devolve os pontos. O acerto entre empresas (quem paga o desconto) usa esse registro na próxima fase.
- **Master** (Brás → Brás Digital Club): pontos emitidos e em vales, revisão, vales e baixa, todas as indicações (convidar e "marcar como ativada") e as regras dos pontos.
- Testes: `tests/club-pontos-e4.test.ts` (6) e e2e `bras-portal` passo 11. Migração `0054_club_pontos`.

## D116 — Club E3 (parte): a importadora prepara os fardos do ônibus (2026-10-10)
- Na tela Transportadoras da importadora aparecem os fardos de ônibus ligados aos pedidos dela, com etiqueta, ônibus, saída e ponto de embarque, sem valores.
- A importadora informa a chave da nota (é ela quem fatura) e marca **"pronto para coletar"**, o que só vale para fardo aceito pelo ônibus. O ajudante vê "pronto" na lista dele, e o cliente vê o passo "Pronto na loja" no painel de frete.
- Outra importadora não vê nem mexe; a reserva só pode ligar um pedido do próprio cliente.
- Teste: novo caso em `tests/excursao-e2.test.ts`.

## D117 — Club E5: nota em dia com o Meu Contador, convite à loja e o link público corrigido (2026-10-11)
Respostas do dono: o Brás Digital tem o emissor Nota Fácil, com promoção para lojistas novos (o cliente pede para a loja entrar), e a função emergencial "Meu Contador" resolve em horas quem está sem nota.
- **Fardo sem nota** (no painel de frete do cliente) tem dois caminhos:
  - **"Pedir a nota para a loja":** indicação do tipo LOJA no motor único (D113), com a mensagem pronta do Nota Fácil para o WhatsApp da loja; o mesmo WhatsApp vale uma vez;
  - **"Resolver agora com o Meu Contador":** chamado urgente ligado ao fardo.
- **Meu Contador** (`accounting_tickets` e `accounting_ticket_messages`; conversa própria porque quem abre pode ser cliente, importadora ou ônibus, e o suporte da Brás é só do membro):
  - o prazo é a saída do ônibus, ou o prazo padrão do serviço quando não há fardo;
  - um chamado aberto por fardo;
  - o contador assume, conversa, e **resolve com a chave da nota** (conferida): a chave vai para o fardo, que embarca. Ou encerra **"sem solução"**, com o motivo para o cliente; o fardo vai na próxima viagem;
  - o cliente cancela só antes do atendimento;
  - indicadores: abertos, em atendimento, resolvidos, resolvidos antes do prazo, tempo médio.
  - O sistema **não emite nota no lugar do vendedor**: organiza, acelera e registra.
- **Preço, prazo e horário** ficam no Master (`fiscal.meu_contador`). O preço é congelado no chamado e a **cobrança fica desligada** até o dono publicar o preço (sem dinheiro de verdade antes disso).
- **Quem atende:** a equipe do Master nesta etapa. O papel próprio do contador (acesso só à fila) entra quando o dono definir quem atende (pergunta 13).
- **Correção em produção (antiga):** os links `/r/<parceiro>` e `/c/<convite>` redirecionavam para o endereço interno do servidor (`localhost:10000`), porque usavam `req.url` atrás do proxy do Render. Agora usam o domínio da requisição (`requestOrigin`, x-forwarded-host), com teste.
- Testes: `tests/meu-contador-e5.test.ts` (4) e e2e `bras-portal` passo 12. Migração `0055_meu_contador`.

## D118 — Club E6: importadoras e transportadoras nas duas vias (2026-10-11)
Pedido do dono: "o sistema de importadoras precisa se comunicar com as transportadoras e vice-versa", e cada via traz gente nova (prompt, seção 6B).
- **Importadoras na rede** (`/transportadora/importadoras`): a transportadora vê as importadoras ativas, os galpões e horários (dados públicos da ficha) e **para onde vão os pedidos** nos últimos 30 dias, **somados por estado de destino**, sem cliente, valor ou pedido individual. Estado com menos de 3 pedidos entra em "outros" para não identificar ninguém. O estado que ela atende fica destacado.
- **Preferida** (`tr_carrier_preferences`, uma linha por importadora e transportadora):
  - a transportadora pede, com um recado;
  - a importadora aceita ou recusa (recusada pode pedir de novo), ou marca direto a transportadora com quem já trabalha;
  - a preferida aparece **logo depois da escolhida pelo cliente** ao chamar a coleta.
- **Coleta fixa**: dias da semana e hora, só com preferida.
  - No dia, a importadora vê "Coleta fixa de hoje" com os pedidos prontos para os estados que a preferida atende, já juntos, e **confirma** com um toque (vira uma coleta comum, D111).
  - A transportadora vê "Coletas fixas de hoje" no "Hoje".
- **Conversa presa à coleta**: mensagens prontas de um toque ("Carga pronta", "Faltou volume", "Nota anexada"; "Chego em 30 min", "Estou no galpão", "Carga entregue") ou texto curto. Só a importadora dona, a transportadora da coleta e o Master escrevem.
  - **Exceção ao prompt (6B.3):** a conversa fica **no histórico da coleta** (`tr_load_events`, tipo MENSAGEM), não em `bd_support_messages`, porque aquele canal é preso ao membro da Brás (`member_id` obrigatório) e a coleta não tem membro. Continua sendo um registro só, sem chat novo.
- **Correção de fronteira**: o histórico da coleta mostrava à importadora o frete informado no aceite ("Frete informado: …"). Agora a importadora recebe o histórico sem esse valor (ela nunca vê frete nem comissão, D111).
- **Avaliação** (`tr_load_ratings`, uma por coleta, só depois de coletada ou entregue): pontualidade e cuidado, de 1 a 5, e comentário. A **nota média é pública** no catálogo (importadora, cliente e Master) a partir de 3 avaliações.
- **Mapa de demanda** (Master, em Transportadoras): cidades de destino dos últimos 90 dias em que o cliente usou transportadora fora da rede ou o estado não tem nenhuma. Mostra onde convidar transportadora ou abrir rota de ônibus.
- "Trazer importadora" e "trazer cliente" já existiam (D115) e foram mantidos.
- Testes: `tests/vias-e6.test.ts`. e2e: passo 13 de `e2e/bras-portal.mjs`.

## D119 — Club E7: frete do ônibus por Pix na conta do dono do ônibus (2026-10-11)
O prompt (seções 6.4 e 14) pede o frete pago antes, por Pix, direto na conta do dono do ônibus, conferido na API e idempotente.
- **Chave nas regras da Excursão (`pixOnline`), desligada por padrão.** Desligada, nada muda: o fardo aceito fica "pagamento combinado com o ônibus", como antes. O dono liga no Master (Ônibus de excursão → Regras) quando quiser.
- **Mercado Pago do dono do ônibus** (perfil do ônibus):
  - o token é conferido na API (`/users/me`) e guardado só criptografado (`encryptSecret`, colunas `mp_access_token_enc` e `mp_account_id` em `tr_carriers`);
  - nunca volta para a tela, log ou e-mail.
  - Ônibus sem Mercado Pago continua no "combinar", mesmo com a chave ligada.
- **Fluxo com a chave ligada:**
  - **Aceite:** o fardo aceito nasce "a pagar" (`tr_parcels.pay_status`). O cliente gera o Pix dos fardos aceitos daquela viagem no próprio painel de frete: QR, código copia e cola e "Já paguei".
  - **Cobrança:** `tr_freight_payments`, com o id como referência externa e chave de idempotência no Mercado Pago. Os mesmos fardos devolvem a mesma cobrança; se os fardos mudarem, a anterior expira e nasce outra com o valor certo.
  - **Confirmação:** só vale o pagamento aprovado na API do Mercado Pago, com a referência da cobrança e o valor completo. O corpo do aviso (`/api/webhooks/mercadopago-frete?pagamento=`) nunca é confiável. A confirmação é aplicada uma única vez (atualização condicional).
  - **Coleta:** fardo "a pagar" não embarca.
- **Cliente de confiança:** o dono do ônibus marca o cliente, e os fardos dele pagam na chegada (`tr_trusted_clients`). O ônibus registra "recebi" para fechar a conta.
- **Pago e não viajou** (cliente cancelou no prazo, não embarcou ou viagem cancelada): o fardo fica "devolver". O dono do ônibus devolve pelo app do Mercado Pago e marca "já devolvi". O sistema **não** estorna sozinho: o dinheiro é dele.
- **Taxa da plataforma:** fatura mensal por ônibus no Master (taxa congelada no aceite, frete total e quanto veio por Pix). A cobrança segue desligada (`fee.charging`) até o dono publicar o preço.
- **Fica para depois** (depende da pergunta "quem paga o desconto dos pontos", seção 7B.6): pontos do Club como desconto no Pix do frete. Hoje o vale do Club continua sendo baixado no balcão das empresas do grupo (D115).
- Testes: `tests/frete-pix-e7.test.ts`. e2e: passo 14 de `e2e/bras-portal.mjs`, com o Mercado Pago simulado (`MP_FAKE`). O roteiro reaproveita a sessão da membro, por causa do limite de 8 logins por e-mail a cada 15 minutos.

## D120 — Club E8a: cartão do Club no balcão, compra que vira ponto e acerto entre empresas (2026-10-11)
Prompt, seções 7.4 a 7.7 e 7B.6. O dono deixou as perguntas para depois. Foram usados os padrões da seção 13: quem oferece paga (pergunta 6); vale até 30% da compra (pergunta 16); pontos de indicação pelo caixa do Club (NextLevel).
- **Cartão do Club** (`club_cards`): código opaco de 10 caracteres com QR no Meu Brás → Club, nunca o documento. "Trocar cartão" invalida o anterior.
- **Balcão sem login por empresa do grupo** (`club_counters`, padrão D106: só o hash do link; atrás da chave `BRAS_PANELS`; limite de tentativas por link). O Master cria o link em Brás → Club. A página é `/balcao-club/<código>`.
  - **O que o balcão vê:** só o primeiro nome, o saldo e o valor dos vales ativos. Nada de documento, e-mail, telefone ou código do vale (o cliente mostra o vale no celular dele).
- **Compra no balcão** (`club_purchases`): vira pontos pela regra `purchase` do Club (padrão: 2 pontos por R$ 1,00, Mega Tron e Starline pontuam), **pagos pela empresa da compra**.
  - O mesmo cupom não pontua duas vezes.
  - Compra acima de R$ 5.000 nasce em revisão do Master.
  - O vale do cliente pode ser usado na mesma tela: tem de ser do dono do cartão e cobrir no máximo 30% da compra. Os pontos são calculados sobre o que ele pagou.
- **Quem paga cada ponto** (`club_ledger.funder`): a empresa da compra, ou NextLevel (caixa do Club) para indicação e missão. Ao gerar o vale, os pontos são tirados na ordem de chegada e o vale guarda de quem eram (`club_voucher_funding`).
- **Acerto entre empresas** (Master, Brás → Club, por mês):
  - quando o vale é usado numa empresa diferente da que pagou os pontos, quem pagou deve a ela;
  - as dívidas entre duas empresas se compensam;
  - o acerto é feito fora do sistema (nota ou transferência) e marcado como acertado (`club_settlements`). O sistema só registra, não movimenta dinheiro.
- O vale continua podendo ser baixado pelo Master (D115), agora pela mesma função do balcão.
- **Fica para a E8b:**
  - motor de benefícios com campanhas (`club_benefits`);
  - benefícios cruzados automáticos (fardo entregue pela Starline → pontos);
  - guia de excursão;
  - pontos como desconto no Pix do frete;
  - Nota Fácil integrado (depende do acesso ao emissor).
- Testes: `tests/club-balcao-e8.test.ts`. e2e: passo 15 de `e2e/bras-portal.mjs`.

## D121 — Club E8b: benefícios cruzados do grupo (2026-10-11)
Prompt, seções 7.3 e 7.5. Padrões da seção 13 (perguntas 6 e 9), em rascunho e editáveis no Master → Club → Regras ("Benefícios cruzados do grupo").
- **Fardo entregue por ônibus de empresa do grupo** (hoje a Starline, reconhecida pelo CNPJ do cadastro em Empresas do grupo):
  - vira pontos para o cliente (padrão 100 pontos = R$ 1,00 por fardo), **pagos pela empresa dona do ônibus** (`funder`);
  - uma vez por fardo;
  - ônibus de fora do grupo não dá esses pontos.
  - Usados na Mega Tron, entram no acerto entre empresas (D120).
- **O plano da Brás dá impulso de nível no Club** (não é outro plano): Platinum é VIP; Ouro é no mínimo Frequente.
- **Guia de excursão no balcão:**
  - o balcão informa o cartão do guia que trouxe o passageiro;
  - o guia ganha o percentual da regra (padrão 2%) sobre o que o passageiro pagou, em pontos pagos pela empresa da compra;
  - o guia não pode ser o próprio cliente;
  - compra acima do valor de revisão também deixa os pontos do guia em revisão.
- **Fica para depois:**
  - motor de campanhas com orçamento e prévia (`club_benefits`);
  - pontos como desconto no Pix do frete (depende de quem paga o desconto quando o ônibus não é do grupo);
  - Nota Fácil integrado (acesso ao emissor).
- Testes: `tests/club-cruzados-e8b.test.ts`.

## D122 — Club E9a: ranking do mês por cidade, só para quem aceitar (2026-10-11)
Prompt, seção 7B.5 e pergunta 17 (padrão: ligado, só para quem aceitar aparecer).
- **Aceite no "Indique e ganhe"** (Meu Brás, transportadora e importadora): a pessoa informa a cidade e a UF e aceita aparecer (`club_profiles`). Aparece só o primeiro nome do cadastro, sem documento. Ela pode sair quando quiser.
- **Ranking do mês na cidade:**
  - conta as indicações ativadas no mês;
  - empate divide a posição;
  - entre quem aceitou, só aparece quem ativou alguma indicação no mês, mais a própria pessoa.
- **Sem prêmio por posição nem sorteio** (seção 12 do prompt): o ranking só mostra a posição, e os pontos vêm sempre da indicação confirmada.
- Testes: `tests/club-ranking-e9.test.ts`. e2e: passo 15 (aceitar e aparecer como "(você)").

## D123 — Preço que vale: tabela única de preços do grupo no Master (2026-10-11)
Prompt `docs/prompts/publico-personas-precos-ecossistema.md`, fase P0. O dono aceitou as recomendações da seção A19 como padrão ("aceito as recomendações"); as perguntas que sobrarem ficam para a última fase.
- **Master → Financeiro → Preços do grupo** (`/master/financeiro/precos`) é a referência de "qual preço vale hoje": junta a tabela de preços (`getPriceBook`), o catálogo de planos e ofertas, as regras da Brás, da Excursão, do Club, dos parceiros e do Meu Contador, e os cupons com teste grátis. Cada linha diz a marca, o tipo (mensal, anual, taxa, teste, pontos…), o valor, a situação (valendo, rascunho, desligado) e o link para editar na origem. Só lê; não muda nenhum preço.
- **Divergências aparecem no topo** (teste grátis em mais de um lugar, duas tabelas de preço da loja, desconto anual diferente por marca, planos em rascunho, documento × sistema), cada uma com a sugestão de caminho.
- **`docs/PLANOS.md` vira histórico**; o que vale é o sistema. Regra: nenhum preço novo fixo no código; preço novo nasce no catálogo ou em `platform_settings`.
- Só o Master vê. Testes: `tests/precos-grupo-p0.test.ts`. Documento: `docs/descoberta/PRECO-QUE-VALE.md`. e2e: passo 15 de `e2e/bras-portal.mjs`.

## D124 — Descoberta: funil por marca e questionário de preço no painel (2026-10-11)
Prompt de público e preço, fases P1 e P2.
- **Master → Financeiro → Descoberta** (`/master/financeiro/descoberta`): funil de cada marca (Commerce, SuperDrop, Brás, Cargas) **só com números somados**:
  - etapas do cadastro ao pagamento, com a mediana de dias entre elas;
  - cadastros por semana (8 semanas);
  - coortes por mês de entrada (ativo a partir do dia 30, 60 e 90; quanto rendeu ao grupo por cliente);
  - faixas de venda dos últimos 30 dias, origem e uso de recursos (quem paga × quem não paga).
  - Nenhum nome, documento, e-mail ou telefone (há teste). A mesma conta roda em `npx tsx scripts/funil-marcas.ts` (só leitura).
- **Questionário de preço nos painéis** (lojista, Meu Brás, transportadora):
  - 5 perguntas opcionais: 4 sobre o preço por mês (adaptação de Van Westendorp) e "como se sentiria sem o produto" (Sean Ellis);
  - **desligado até o Master ligar**; aparece só depois de alguns dias de uso (padrão 7) e uma vez por marca ("agora não" também conta);
  - **anônimo**: a resposta guarda só a marca e o mês, em tabela separada de quem já respondeu;
  - o Master vê a mediana e a faixa aceitável só a partir de um mínimo de respostas por marca (padrão 5).
- **Roteiros de entrevista** por persona em `docs/descoberta/ROTEIROS.md` (o dono aprova antes de usar; gravação só com consentimento).
- Testes: `tests/funil-marcas-p1.test.ts`, `tests/questionario-preco-p2.test.ts`. e2e: passo 15 de `e2e/bras-portal.mjs`. Migração `0060_questionario_preco`.

## D125 — Personas v1 e proposta de preço em rascunho, com simulação (2026-10-11) — RASCUNHO
Prompt de público e preço, fases P3 e P4. **Em rascunho: nenhum preço de cliente muda.** Virar regra depende da aprovação do dono por escrito (pergunta da última fase).
- **Personas v1** (`docs/descoberta/PERSONAS.md`): cartões P1 a P12 com fonte em cada afirmação ([sistema], [mercado], [hipótese]) e o mapa de fricção F1 a F10 com a tela e a fase que resolve.
- **Master → Financeiro → Proposta de preço** (`/master/financeiro/proposta`):
  - rascunho editável (`platform_settings` `precos.proposta`, com auditoria): escada da seção A8 (Commerce: Começo grátis 2,5%, Start R$ 89, Pro R$ 199, Scale R$ 449; SuperDrop: Começo grátis 7%, Loja R$ 79, Própria R$ 179), teste reverso de 14 dias, dias por conquista (+7 publicar, +7 1ª venda, teto 30), anual "pague 8, leve 12", 5% de cashback em pontos;
  - **guarda-corpos no cenário base**: o grátis cobre o custo de servir; nenhum plano dá prejuízo; ponto de equilíbrio de cada plano contra o grátis;
  - **12 meses em 3 cenários** contra o modelo de hoje (lido do catálogo e da tabela do SuperDrop), mais a proposta com a conversão de hoje (mostra quanto do ganho depende de mais gente assinar);
  - custos da tabela do SuperDrop (infraestrutura, cobrança) e o custo real do ponto (margem dos serviços).
- Simulador puro em `src/lib/finance/entry-sim.ts`. Documento: `docs/descoberta/ARQUITETURA-PRECO.md`. Testes: `tests/proposta-preco-p4.test.ts`.

## D126 — Porta de entrada "grátis para começar, paga quando cresce" (motor pronto, desligado) (2026-10-11)
Prompt de público e preço, fase P5. **Tudo desligado por padrão**: nada muda para cliente até o Master ligar a porta da marca (e o dono aprovar a proposta da D125).
- **Regras nas ofertas do catálogo** (estende `OfferRules`, sem tabela nova): `PORTA_COMMERCE` e `PORTA_SUPERDROP`, versionadas, com senha e auditoria, **nascem pausadas**. Campos novos: modo (teste reverso ou direto no grátis), taxa do plano grátis, dias por conquista (publicar a loja, 1ª venda) com teto, anual "pague N, leve 12" e cashback em pontos.
- **A loja guarda a condição com que entrou** (`stores.entry_offer`, `stores.trial_started_at`): mudar ou pausar a porta depois não muda quem já entrou.
- **Acesso:** com porta, o fim do teste (ou de um período pago não renovado) é o estado **"Grátis"**: a loja continua vendendo e paga a taxa do grátis sobre a venda. Sem porta, tudo como hoje (bloqueio e tela de pagamento).
- **Dias por conquista:** uma vez por conquista (evento com chave única), até o teto contado do início do teste.
- **Anual no SuperDrop:** a fatura de 12 meses cobra os meses pagos da porta (padrão 8); faturas de plano já são só Pix. Na Commerce o preço anual continua no catálogo (muda por versão de preço, quando aprovado).
- **Cashback:** fatura de plano paga → pontos do Club para o dono da loja, pagos pela NextLevel, uma vez por fatura; estorno devolve os pontos.
- **Um teste por CPF/CNPJ** (a mesma trava de hoje). Com a porta do SuperDrop ligada, o cadastro sem cupom também ganha o teste.
- **Fica para a próxima rodada:** limites de escala do grátis (produtos, selo da marca) e o Passe do Grupo (`bundleGrants`, fase P5A).
- Testes: `tests/porta-entrada-p5.test.ts` (inclui a regressão do SuperDrop com a porta desligada).

## D127 — Ritmo de verificação: testes pesados ficam para a fase final (2026-10-11)
Pedido do dono ("vamos reduzir alguns testes e deixar eles para uma fase final, faça o grosso"). Exceção registrada à regra "mudança de comportamento sem teste não entra" do `CLAUDE.md`, só para esta rodada do prompt de público e preço (fases P5 a P6):
- **Em cada fase, antes de publicar:** tipos, estilo, build de produção e um teste de domínio curto das regras novas. Tudo novo continua **desligado por padrão**, então publicar não muda nada para cliente.
- **Na fase final (antes de ligar qualquer coisa):** bateria completa (`npx vitest run`), e2e de ponta a ponta (`e2e/bras-portal.mjs` e os de painel), capturas em 360/768/1440 e varredura de acessibilidade. A lista do que ficou para essa fase vai no relatório final.

## D128 — Benefícios gamificados nos painéis (P5V, desligado por padrão) (2026-10-11)
- **Um agregador só** (`src/lib/domain/beneficios/painel.ts`): Carteira do grupo (saldo do Club em pontos e em reais), Trilha de primeiros passos por persona (lojista, membro da Brás, transportadora/ônibus, medida nos dados reais), Medidor do teste reverso (dias restantes, dias ganhos, conquistas) e Simulador "quanto cada plano custaria para você" (vendas reais de 30 dias × planos reais do catálogo e da tabela do SuperDrop, mais o grátis da porta).
- **Comemoração uma vez por passo por pessoa** (evento com chave única), que também mede a ativação.
- Componentes em `src/components/beneficios/` (o componente não decide regra). No topo do painel do lojista (SuperDrop e Commerce), do Meu Brás e da transportadora.
- **Ligado por marca** em Master → Financeiro → Descoberta → Benefícios (`beneficios.painel`); começa desligado em todas.
- Fica para a fase final: capturas em 360/768/1440 claro e escuro, `axe` e e2e (D127). Fica para depois: trilha editável no Master, vitrine de recompensas e escada de nível no kit.

## D129 — Barra do ecossistema: fio do grupo e lançador (P5E, desligada por padrão) (2026-10-11)
- **Domínio único** (`src/lib/domain/ecossistema/lancador.ts`): segmentos com a cor de sinal de cada marca (`brand-palette.ts`), a marca atual mais larga; lançador com "Sua marca", "Recomendadas para você" (com o motivo, por perfil: SuperDrop → Brás e Cargas; Commerce → Brás e Cargas; Brás → Cargas e Commerce; Cargas → Brás) e "Todas". Benefício de entrada vindo da porta de entrada ligada (D126) ou "Cadastro grátis".
- **Só marcas abertas** (`brand.live`): marca fechada nunca aparece.
- **Onde aparece:** só na casca dos painéis de cliente (lojista, Meu Brás, importadora, transportadora). Nunca na vitrine do lojista, expedição, motorista, balcões, checkout ou pagamento.
- Gaveta acessível (Radix: foco preso, Esc fecha); a faixa é decorativa (`aria-hidden`); movimento reduzido respeitado.
- **Ligada por marca** em Master → Financeiro → Descoberta → Barra do ecossistema (`ecossistema.barra`).
- **Fica para depois:** conta do grupo (perfis ligados à mesma pessoa, com aceite) e passagem entre domínios por código de uso único; convites no momento certo com regras no Master. Hoje o link leva ao cadastro da outra marca.

## D130 — Página de ativação ao trocar de marca (P5A) (2026-10-11)
- **`/ativar?de=<marca>`** em cada marca (fora do índice de busca): título da marca de destino, a **ponte "de onde você vem → o que ganha aqui"**, três vantagens, **números reais da rede** (só contagens e só a partir de 3, para não mostrar "0 lojas"), o **benefício de entrada** (porta de entrada D126 quando ligada; "Cadastro grátis com CNPJ" na Brás) e o botão para o cadastro com a origem (`utm_source=grupo-<marca>`).
- O lançador "Marcas do grupo" (D129) passa a levar para essa página. Liberada nas marcas de lista fechada (Brás e Cargas).
- Domínio em `src/lib/domain/ecossistema/ativacao.ts` (mensagens padrão por marca e ponte por par de marcas). Nenhum dado pessoal: a página é igual para todos que vêm da mesma marca.
- **Fica para depois (conta do grupo):** hoje cada e-mail é um usuário de um papel só, então ativar outra marca é um cadastro novo. Ligar perfis da mesma pessoa (com aceite), a passagem entre domínios por código de uso único e o "ativar em 1 clique" sem redigitar dependem dessa conta do grupo. As mensagens editáveis no Master com teste A/B também ficam para depois.

## D131 — O Club como assinatura do ecossistema: Club+ e Club Total em rascunho (P5C) (2026-10-11)
- **Catálogo do Master** (família nova `CLUB_PLAN`): Club+ (R$ 29,90/mês) e Club Total (R$ 247/mês), anual "pague 8, leve 12" só no Pix, **em RASCUNHO**: fora da vitrine, sem cobrança, até o dono aprovar por escrito e publicar.
- **Regras dos níveis** nas regras do Club (`club.rules.tiers`, com versão e auditoria): Club+ pontos ×2 e 20% de desconto nos planos; Club Total pontos ×3 e plano de entrada de todas as marcas liberado; **a taxa sobre a venda continua**.
- **Master → Proposta de preço → "O Club como assinatura"**: os três níveis e a conta "quem usa o plano de entrada de todas as marcas paga X separado; com o Club Total, Y" (preços reais do catálogo e da tabela do SuperDrop).
- **Fica para depois (depende da aprovação e da conta do grupo, D130):** assinatura por pessoa (não por loja) no checkout corporativo, concessão de acesso em cada marca, multiplicador aplicado nos créditos, queda de cada marca para o grátis no cancelamento e o acerto entre empresas dos descontos.

## D132 — Fio do grupo na captação e rodapé do grupo nos e-mails (P5U, desligados) (2026-10-11)
- **Captação:** cadastro (SuperDrop, Commerce e Brás), entrada, "esqueci a senha" e `/ativar` mostram o fio do grupo (só marcas abertas, a da página mais larga) e o **selo do Club** ("Ao entrar, você já faz parte do Club do Grupo NextLevel: seus pontos valem em todas as marcas do grupo"). Componente de servidor `FioCaptacao`.
- **E-mails transacionais:** rodapé com a faixa de cores das marcas e a frase do Club, no HTML e no texto; ler a chave nunca impede o envio.
- **Chaves no Master** (Descoberta → Barra do ecossistema → "Fio do grupo fora dos painéis"): captação, e-mails e páginas públicas, todas desligadas. Gravar uma chave não apaga as outras.
- **Fica para depois:** quem convidou nos convites `/r/` e `/c/` com o benefício dos dois lados, saldo do Club no e-mail, "Suas marcas" no perfil (depende da conta do grupo, D130) e a comemoração com sugestão de outra marca.

## D133 — Páginas públicas: rodapé da família "Parte do Grupo NextLevel" (P5P, desligado) (2026-10-11)
- No rodapé de todas as páginas públicas das marcas (casca `(portal)`): fio do grupo, "Parte do Grupo NextLevel", a frase do Club e as outras marcas abertas, cada uma levando à página de ativação (`/ativar?de=<marca>`, D130).
- **Nunca na vitrine do lojista** (ela não usa a casca do portal) nem na marca branca.
- Chave "Páginas públicas" no Master (Descoberta → Barra do ecossistema), desligada.
- **Fica para depois:** páginas do Club, da Excursão e do Nota Fácil (dependem das fotos reais, `docs/prompts/fotos-club-excursao.md`), cruzamento por intenção entre páginas e a medição de velocidade da primeira dobra (fase final, D127).

## D134 — Reputação do parceiro de transporte: Bronze, Prata e Ouro (P5F) (2026-10-11)
- Calculada no domínio (`src/lib/domain/cargas/reputacao.ts`) só com dados reais dos últimos 180 dias: entregas concluídas (cargas e fardos), avaliação média das importadoras (pontualidade e cuidado), % de recusas e fardos que não embarcaram.
- **Regras no Master** (`parceiros.reputacao`): Prata = 10 entregas, avaliação 4+ e até 20% de recusas; Ouro = 30 entregas, 4,5+ e até 10%.
- **Painel da transportadora:** cartão "Sua reputação no grupo" com o que falta para o próximo nível (aparece junto com os benefícios, mesma chave por marca, D128). **Master → Descoberta:** quadro com o nível de cada transportadora ativa (só números, sem cliente).
- O destaque é sempre rotulado e nunca esconde as outras transportadoras.
- **Fica para depois:** vantagens por nível (destaque na escolha da transportadora), reputação de importadoras e contadores parceiros, missões e Carteira B2B do parceiro, papel de contador parceiro com acesso só à fila do Meu Contador e a demanda do ecossistema por tipo de parceiro (o mapa de demanda da D118 já cobre rotas).

## D135 — Torre do Ecossistema e fila de oportunidades cruzadas no Master (P5M) (2026-10-11)
- **Master → Torre do Ecossistema** (`/master/ecossistema`):
  - **índice do ecossistema:** clientes presentes em 2 ou mais marcas, reconhecidos pelo mesmo CPF/CNPJ (loja, membro da Brás, transportadora). Só conta; nenhuma conta é juntada;
  - combinações de marcas mais comuns e cadastros vindos de outra marca (origem `grupo-<marca>` da página de ativação);
  - **fila de oportunidades cruzadas** (tabela `cross_opportunities`, migração 0062): regras v1 = loja que vendeu R$ 1.000+ em 30 dias e não compra na Brás; membro da Brás com pedido pago e sem frete do grupo; loja no plano grátis vendendo R$ 3.000+ (um plano pago já sairia mais barato). Cada uma com situação (nova, em contato, ativou, descartada), dono (quem mexe primeiro) e auditoria;
  - **placar do mês:** ativações por pessoa (só número e posição).
- **Fica para depois:** funções de equipe no Master (Comercial, Suporte, Financeiro, Conteúdo) com permissões separadas, regras das oportunidades editáveis no Master, metas e bônus pelo motor de comissões, fila única de suporte e o placar das empresas do grupo (o acerto entre empresas já existe no Club, D120).

## D136 — Experimentos: controle × grupo novo, leitura com incerteza e decisão do dono (P6) (2026-10-11)
- **Master → Financeiro → Experimentos** (`/master/financeiro/experimentos`, tabela `experiments`, migração 0063): peça (porta de entrada do SuperDrop, da Commerce ou benefícios nos painéis), % no grupo novo, métrica principal (1ª venda ou pagou em 30 dias), métrica de guarda (receita por cliente ou saída), tamanho mínimo e data de leitura **combinados antes** (nasce em rascunho).
- **Sorteio fixo por loja** (o mesmo cliente cai sempre no mesmo grupo). Com experimento rodando, só o grupo novo recebe a peça; sem experimento, a peça vale para todos quando ligada. Um experimento rodando por peça.
- **Leitura:** lojas com 30 dias de casa por grupo, a métrica principal e a de guarda, e a frase em português simples dizendo se a diferença ainda pode ser acaso (teste de duas proporções, 95%). Avisa quando ainda não passou da data ou do tamanho combinados.
- **Encerrar exige leitura escrita e decisão** (registradas e auditadas): nada vira padrão sem isso.

## D137 — Respostas do dono à rodada de público e preço (2026-10-12)
1. **Testar os preços da Proposta como experimento:** sim (implementado na D140).
2. **Ordem de ligar:** questionário → benefícios → porta de entrada como experimento → barra e fio → Club. Sim.
3. **Conta do grupo:** autorizada (D141).
4. **Entrevistas:** ainda sem resposta (quem conduz e quais clientes chamar).
5. **Equipe:** o dono vai cadastrar a equipe no Master (D138).
6. **Contador parceiro:** o escritório existe; o dono cadastra o usuário no Master (função "Contador parceiro", D138).
7. **Reputação Ouro:** taxa menor e prioridade na lista, sempre com o selo; criar dados fictícios para demonstração (D139).
8. **Fotos do Club e da Excursão:** chegam amanhã.

## D138 — Equipe do Master com funções e o contador parceiro (2026-10-12)
- **Master → Equipe do Master** (`/master/equipe`, só o dono): cadastrar pessoa (nome, e-mail, senha provisória com troca obrigatória), mudar a função, encerrar ou devolver o acesso. Coluna `users.master_function` (migração 0064); vazio = dono.
- **Funções e telas:** Comercial (Torre, CRM, clientes, lojas, marcas, parceiros), Suporte (clientes e suporte, pedidos, lojas, fornecedores, erros, membros da Brás, Meu Contador), Financeiro (Financeiro NextLevel e SuperDrop, planos, resumo, escritório), Conteúdo (templates, catálogo, descobertas e pauta da Brás) e **Contador parceiro** (só a fila do Meu Contador). O menu mostra só as telas da função e o servidor redireciona quem abre outra (o caminho chega às páginas pelo `proxy`).
- **Ações sensíveis no servidor** (`requireMasterFn`): preço, catálogo, ofertas, porta de entrada, proposta, experimentos, regras da Brás, da Excursão, do Club e da reputação, parceiros, finanças e **acerto entre empresas** = dono e Financeiro; oportunidades cruzadas = dono e Comercial; atender chamados do Meu Contador = dono, Suporte e contador. O contador parceiro **não** conta como Master em nenhuma outra ação.
- Testes: `tests/equipe-master.test.ts`.

## D139 — Reputação Ouro: comissão menor e prioridade na lista, com dados fictícios de demonstração (2026-10-12)
Resposta 7 do dono ("sim, crie fictício").
- **Prioridade:** no catálogo de transportadoras (importadora, membro da Brás e painel de frete), Ouro e depois Prata aparecem primeiro, sempre com o selo "Reputação Ouro/Prata". Nenhuma transportadora some da lista.
- **Comissão menor:** a transportadora Ouro paga menos comissão sobre o frete (padrão 1 ponto percentual, editável no Master). O valor é gravado na carga no aceite e aparece no painel dela.
- **Regras editáveis** em Master → Descoberta → Reputação (entregas, nota e recusas de cada nível e o desconto do Ouro), só dono e Financeiro.
- **Dados fictícios** (`src/db/demo-cargas.ts`): "Rota Ouro Transportes", "Expresso Prata" e "Fretes Começando", todas com "(demonstração)" no nome, cargas e avaliações inventadas; **só no banco de demonstração**, nunca na produção.
- Testes: `tests/reputacao-ouro.test.ts`.

## D140 — Experimento com os preços da Proposta e o roteiro "ligar em ordem" (2026-10-12)
Respostas 1 e 2 do dono (testar os preços da Proposta como experimento; ordem questionário → benefícios → porta como experimento → barra/fio → Club).
- **Opção na porta de entrada** (Master → Ofertas e comissões → Porta de entrada, campo "Usar os preços da Proposta", desmarcado por padrão; regra `priceSource: "PROPOSTA"` na versão da oferta). Ligada, a loja que entra recebe a escada da Proposta **congelada na loja** (`stores.entry_offer.planPrices`): os planos pagos da Proposta, por ordem de preço, viram Start/Pro/Scale na Commerce e Loja (subdomínio e manual)/Própria no SuperDrop; o plano grátis da Proposta vira a taxa do grátis. Plano que falta na Proposta mantém o preço de hoje.
- **Onde vale:** mensalidade do SuperDrop (`ensurePlanInvoice`, inclusive o anual "pague N, leve 12"), 1º mês da fatura de ativação ainda em aberto (o setup não muda), taxa por pedido do SuperDrop, assinatura da Commerce (mensalidade e taxa congeladas) e o simulador "quanto cada plano custaria" do painel. Quem entrou antes, ou caiu no grupo de controle do experimento, segue com os preços de hoje. A tabela de preços de hoje não muda.
- **Como testar com parte dos clientes:** ligar a porta com a opção e criar o experimento da porta (Master → Experimentos, 50% no grupo novo).
- **Roteiro "Ligar em ordem"** no topo de Master → Descoberta: os 5 passos aprovados, cada um com Ligado/Em parte/Desligado, o que está ligado e o link para ligar; marca o próximo passo. Não liga nada sozinho.
- Testes: `tests/porta-precos-proposta.test.ts`.

## D141 — Conta do grupo: perfis ligados com aceite e passagem entre marcas (2026-10-12)
Resposta 3 do dono ("autoriza criar a conta do grupo": sim).
- **O que é:** a mesma pessoa com perfis em marcas diferentes (loja no SuperDrop, loja na Commerce, membro da Brás, transportadora, fornecedor, parceiro) liga os perfis em **Suas marcas** (`/account/marcas`, no menu do usuário). Para ligar: e-mail e senha do outro perfil (prova de que é dela) e o aceite escrito. Coluna `users.group_id` (migração 0065); até 8 perfis; desligar a qualquer momento. Auditoria de ligar, desligar e passagem.
- **O que muda para a pessoa:** troca de perfil sem novo login (mesmo endereço: troca a sessão; outra marca: **código de uso único de 2 minutos**, tabela `group_pass_codes`, só o hash guardado, que abre o perfil no endereço da outra marca); **login com a conta do grupo**: a senha de um perfil abre o perfil da mesma pessoa que é da marca do endereço; a barra "Marcas do grupo" mostra as marcas em que ela já tem perfil em "Suas marcas".
- **O que não muda:** cada perfil mantém os próprios dados, e-mail, senha e permissões; nenhum perfil lê dados do outro. Equipe NextLevel (Master), expedição e equipe de loja ficam fora. No modo suporte nada disso aparece nem funciona.
- **Fica para a próxima etapa:** "ativar em 1 clique" sem novo cadastro (perfil novo com o mesmo e-mail exige trocar a regra de e-mail único por e-mail único por login; hoje o cadastro da outra marca ainda pede um e-mail próprio, e depois a pessoa liga os perfis), Club como assinatura por pessoa (o grupo é a base) e "Suas marcas" no cadastro.
- Testes: `tests/conta-grupo.test.ts`; e2e em `e2e/precos-ecossistema.mjs` (ligar e trocar de perfil, acessibilidade em 390 e 1440 px).

## D142 — Central de qualidade no Master: todas as telas, uma por uma, com aprovação, domínios e checagens (2026-10-12)
Pedido do dono: "um painel onde eu possa acessar todas as páginas do sistema, entrar uma a uma e marcar aprovada e testada; uma super área para checar domínios, testes etc."
- **Onde:** Master → Operação → **Central de qualidade** (`/master/qualidade`), só o dono (equipe do Master não vê).
- **Telas:** a lista sai dos próprios arquivos do sistema (`src/app/**/page.tsx`), então **tela nova aparece sozinha**. Cada tela tem área (Master, Fornecedor, Lojista, Brás, públicas, links privados…), nome do menu, como entrar (direto ou modo suporte) e o domínio certo para abrir (painéis no endereço do Master, onde estão a sessão e o modo suporte; páginas públicas no da marca; `/termos` e `/privacidade` só na Brás).
- **Marcação:** Testada, Aprovada e Com problema (aprovar tira o problema; problema tira a aprovação), anotação e exemplo para telas com parte variável no endereço. Tabela `qa_screens` (migração 0066); cada mudança vai para a auditoria. "Zerar esta lista" começa uma rodada nova.
- **Uma por uma:** a tela atual em destaque com Abrir, "Testada e aprovada, próxima", e atalhos de teclado (O abrir, T testada, A aprovar e seguir, P problema, setas).
- **Domínios:** abre `/api/health` de cada domínio configurado das marcas e mostra no ar / fora do ar / não é o sistema, versão publicada e atualização do banco.
- **Checagem automática:** abre cada tela sem login (pública precisa abrir; painel precisa mandar para a entrada), cerca de 1 minuto; falhas em destaque e o resultado aparece em cada tela. Tabela `qa_runs`. Só endereços configurados das marcas (nunca um endereço digitado).
- Achado na primeira checagem: `/termos` e `/privacidade` existem só para a Brás Digital; SuperDrop e Commerce não têm página própria de termos e privacidade (fica como pendência para o dono decidir).
- Testes: `tests/central-qualidade.test.ts`.

## D143 — O que falta em cada tela e o pedido de imagens pronto para o GPT (2026-10-12)
Pedido do dono: "algumas páginas faltam coisas, tipo gerar imagens no GPT".
- Na Central de qualidade, cada tela ganha **O que falta**: Imagem (gerar no GPT), Texto, Vídeo, Função ou botão, Dados de exemplo; com Imagem, um campo "o que a imagem deve mostrar". Filtro "Falta algo" e selo em cada tela. Colunas `qa_screens.needs` e `image_brief` (migração 0067).
- Aba **O que falta**: (1) as imagens das páginas públicas lidas do `MANIFESTO.md` de cada marca, com a situação conferida nos arquivos de verdade (arquivo vazio não conta); (2) o que foi marcado em cada tela, por tipo; (3) **o pedido completo para colar no GPT**, com as regras de imagem que já geraram os lotes no ar (sem texto, sem marca real, sem rosto, paleta e acento de cada marca), lotes por marca e nome de arquivo por tela (`sd-tela-planos`). Botão copiar, com reserva de seleção quando o navegador recusar.
- Testes: `tests/central-qualidade.test.ts`.

## D144 — Ambiente de demonstração para gravar treinamentos (Estúdio de gravação) (2026-10-12)
Pedido do dono: "um ambiente simulado para gravação de treinamento usando o sistema inteiro em detalhes; vou gravar muito conteúdo para o YouTube".
- **Mundo completo na demonstração** (`src/db/demo-bras.ts`, só no banco de demonstração, uma vez, tudo pelas funções do sistema): importadora com dono e balcão, produtos em caixa com estoque, descobertas com oferta, dois membros (um com plano Ouro), pedidos em cada etapa, transportadora Ouro com login, ônibus de excursão com rota, viagem e fardos, compra no balcão que vira pontos do Club, chamado no Meu Contador e equipe do Master (Comercial, Suporte, Financeiro, Contador). Somado ao que já existia (fornecedores, expedição, lojistas SuperDrop, lojas Commerce, parceira). Todas as contas com a senha da demonstração e sem troca obrigatória.
- **Estúdio de gravação** (`/gravacao`, só existe no modo demonstração): entrar como cada participante com um clique; **roteiro de 17 aulas** em 4 séries (Master, SuperDrop, Commerce, Brás/Cargas), cada uma com "Começar" que já entra com a conta certa e abre a tela; **modo gravação** (cookie neste navegador: some o botão de trocar perfil e a lista de perfis da entrada); **Recomeçar do zero** (só como Master: recria o banco em memória, migrado e populado; ~1 minuto).
- Pix e Mercado Pago continuam marcados como simulados nas telas de pagamento (é verdade e evita confusão de quem assiste).
- **Publicação:** é um serviço separado no Render (não mexe na produção), com `NEXT_PUBLIC_DEMO_MODE=true`, `DEMO_AUTOSEED=true`, `DATABASE_URL=pglite://memory`, `BRAS_PANELS=true` e segredos próprios; depende da aprovação do dono (plano e endereço). Guia em `docs/DEMO.md`.
- Testes: `tests/demo-gravacao.test.ts`.

## D145 — "Pronto e desligado" na Central de qualidade (2026-10-12)
Pedido do dono: "pode desenvolver a aba Pronto e desligado; quero ver tudo em funcionamento".
- **Onde:** Master → Central de qualidade → aba **Pronto e desligado** (só o dono, como a Central).
- **O que mostra:** tudo o que já está no ar mas desligado de propósito, com o estado de agora (Ligado, Em parte, Desligado) e onde ligar, em quatro grupos:
  - **Roteiro de ligar em ordem** (o mesmo de D140, com o próximo passo destacado);
  - **Dinheiro e cobrança:** conta Mercado Pago da NextLevel, Pagar.me, taxa e Pix do frete da Excursão, experimentos rodando, situação da Proposta;
  - **Marcas e acesso:** chaves do Render (cadastro aberto da Commerce, parceiros na Commerce, Brás aberta ao público, painéis da Brás, endereço só dos painéis);
  - **Comunicação:** envio real de e-mails e contatos de suporte.
- **Só leitura:** nada é ligado pela aba. Item de tela leva ao lugar certo do Master; item do Render mostra o nome da chave. Nenhum valor de segredo aparece (só "ligada/desligada").
- Código: `src/lib/domain/qualidade-desligados.ts` (`readyButOff`), `src/components/master/qualidade/pronto-desligado.tsx`. Testes: `tests/pronto-desligado.test.ts`.

## D146 — Imagens da auditoria geral ligadas nas páginas, painéis e e-mails (2026-10-12)
Pedido do dono: integrar as 41 imagens dos lotes A a E (`docs/prompts/imagens-auditoria-geral-gpt.md`), usando os manifestos como fonte da verdade, sem sobrescrever nada e sem mudar textos, conteúdo comercial ou regras. (D145 fica reservada para a aba "Pronto e desligado" da Central de qualidade.)
- **Pastas e formatos:** fotos em `public/portal/<superdrop|commerce|nextlevel>/v3/` com o PNG original + AVIF (qualidade 55) + WebP (qualidade 82); prévias de link e faixas de e-mail em PNG original + JPG (fundo navy, sem AVIF: redes e e-mail não leem); ilustrações em `public/ilustracoes/v1/` (PNG original + WebP com transparência); feed e story dos parceiros em `docs/marca/` (fora do site). Nenhuma colisão de nome.
- **Onde entrou:** Lote A: prévia de link do SuperDrop, Commerce e NextLevel (`og-marca.ts`, e `/solucoes`), foto da entrada do SuperDrop, Commerce e Master (`auth-photo.ts`, a primeira foto que existir), foto ao lado do cadastro da Commerce (só computador), caixa vazia nas páginas "não encontrada" e "algo deu errado". Lote B: abertura de `/solucoes`, uma foto por família nos cartões de `/solucoes`, na abertura de `/solucoes/<produto>` e nos cartões da Loja NextLevel do painel. Lote C: 3 passos de `/como-funciona`, aberturas de `/seja-fornecedor` e `/parceiros`, faixa acima da tabela de `/planos` do SuperDrop. Lote D: estados vazios (pedidos, produtos, campanhas, ondas de expedição, indicados, descobertas da Brás), fases da jornada da Loja NextLevel e boas-vindas no início do painel Commerce no primeiro acesso. Lote E: faixa no topo dos e-mails do SuperDrop, Commerce e NextLevel (Brás e Cargas seguem sem faixa).
- **Sem arquivo, nada quebra:** `FotoOpcional` (servidor) não desenha nada; `Ilustracao` e `FotoErro` (navegador) somem se a imagem não carregar e o estado vazio volta ao ícone; e-mail sem arquivo sai como antes.
- **Acessibilidade:** fotos que contam algo têm `alt` descritivo (passos, aberturas); faixas, cartões de família, login, erro e ilustrações são decorativas (`alt` vazio), porque o texto ao lado já diz tudo.
- Testes: `tests/imagens-auditoria.test.ts` (formatos, tamanhos 1200×630, 1200×300 e 1024×1024 com transparência, material fora do site, ausência sem quebra, faixa do e-mail) e `tests/login-marca.test.ts`.

## D147 — Mapa do sistema: decisões do dono sobre endereços e o painel "Mapa vivo" (2026-10-12)
Pedido do dono: um novo racional de páginas, o mapa de tudo e um painel dinâmico para abrir cada hierarquia e testar (prompt `docs/prompts/mapa-paginas-dominios-painel.md`).
- **Decisões do dono (respostas às perguntas do prompt):**
  1. A **NextLevel Soluções** (`/solucoes`) mora no site do grupo, **nextlevelgroup.com.br**.
  2. **Painéis:** por enquanto **todos no Master**. No futuro, cada projeto terá o próprio Master; a reorganização deve deixar esse caminho aberto.
  3. A **Loja NextLevel** (`/loja-nextlevel`) é da agência **NextLevel Soluções Digitais** e vai junto para o site do grupo.
  4. **Termos e privacidade:** um texto único para o grupo inteiro, presente em todas as marcas.
  5. **Domínios agora:** só **nextlevelgroup.com.br** e **superdrop.com.br**. nextlevelcommerce.com.br fica para depois, e a Commerce segue em lojas.nextlevelgroup.com.br.
- **Fase 1 (avaliação, sem mudar endereço):**
  - relatório: `docs/mapa/AVALIACAO-LINKS-2026-10.md`;
  - planilha: `docs/mapa/rotas.csv`;
  - script: `scripts/mapa-rotas.ts`, que testa cada página nos 5 endereços seguindo os redirecionamentos, lê os links das páginas públicas e lista os órfãos.
- **Fase 4 (painel "Mapa vivo"):** nova aba da Central de qualidade.
  - **Árvore:** tipo de página → área → seção do menu → página, com contadores em cada galho e a situação de cada página em cada endereço.
  - **"Fora do lugar":** marca o que contraria as decisões acima.
  - **Ações:** checar um galho só (checagens guardadas em `qa_runs` com tipo `MAPA`, sem mudança no banco) e copiar o mapa mental em Mermaid.
  - O que ainda não foi decidido fica "a definir" até a Fase 2.
- Código: `src/lib/qualidade/mapa.ts`, `checkMap` e `mapCells` em `src/lib/domain/qualidade.ts`, `src/components/master/qualidade/mapa-vivo.tsx`. Testes: `tests/mapa-vivo.test.ts`.

## D148 — Fase 2 do mapa: termos do grupo, menu do endereço do grupo e categorias do fornecedor; proposta de reorganização (2026-10-12)
Aprovado pelo dono ("tudo aprovado, vamos ao próximo passo") a partir da Fase 1 (D147).
- **Termos e privacidade do grupo:**
  - um texto único (`src/components/portal/legal-grupo.tsx`, versão `2026-10-12`, marcado "em revisão jurídica") em `/termos` e `/privacidade` no SuperDrop, na Commerce, na Cargas e no endereço do grupo;
  - a Brás mantém o texto próprio, com aceite versionado (D99), até a unificação;
  - o rodapé de todas as marcas abertas mostra os dois links (antes: "serão publicados aqui antes da abertura ao público");
  - a Cargas passa a abrir as duas páginas;
  - o endereço da holding abre `GROUP_PATHS` (`/solucoes`, `/termos`, `/privacidade`).
- **Menu do endereço do grupo:** Soluções e as marcas pelos endereços delas, com o botão "Diagnóstico gratuito"; a logo leva a `/solucoes`. Nenhum link leva à entrada por engano.
- **Fornecedor:** "Categorias" no menu do catálogo (`/supplier/products/categorias` deixa de ser órfã).
- **Proposta da reorganização:** `docs/mapa/PROPOSTA-REORGANIZACAO-2026-10.md`, com a árvore-alvo, os 10 itens "de → para" e 5 perguntas. Nada além das três correções muda sem o sim do dono.
- Testes: `tests/legal-grupo.test.tsx`.

## D149 — Reorganização dos endereços: painéis da equipe só no Master, páginas da agência no site do grupo, buscadores por marca (2026-10-12)
O dono aceitou as recomendações da proposta (`docs/mapa/PROPOSTA-REORGANIZACAO-2026-10.md`, "aceito as recomendações da proposta"):
painéis da equipe exclusivos do Master; painéis dos clientes no endereço da marca deles; início do site do grupo = Soluções;
temas no SuperDrop e na Commerce; texto legal da Brás unificado depois; revisão jurídica recomendada. Aplicado na ordem 6 → 7 → 5 → 1/2 → 3 → 4 → 9:
- **6. Atalho `/lojas`** (cara da Commerce em qualquer endereço): só na demonstração (`NEXT_PUBLIC_DEMO_MODE=true`, `brandPreviewAllowed`). Em produção volta ao início e apaga a prévia guardada; `getBrand()` e o filtro do Master ignoram o cookie.
- **7. Financeiro:** `/master/finance` virou `/master/financeiro/operacao` ("Operação SuperDrop", aba do financeiro). O endereço antigo redireciona mantendo `?tab=`.
- **5. "Para quem fornece"** liga direto em `/seja-fornecedor` (acaba a corrente de 2 saltos).
- **1 e 2. Soluções e Loja NextLevel** (agência): nos endereços do SuperDrop e da Commerce redirecionam para o site do grupo (`groupSiteUrl()`: `GROUP_SITE_URL` quando ligado na Fase 3; até lá, o endereço do Master), mantendo caminho e busca (atribuição de parceiro preservada). Os links dos menus, da página inicial, dos planos, do catálogo do parceiro e do e-mail de pagamento apontam direto para lá (`groupLink`/`groupLinkFor`); na demonstração e no próprio grupo ficam relativos. No site do grupo, "Entrar para contratar" vira dois botões (loja SuperDrop / loja Commerce), porque o login de lojista não existe no Master.
- **3. Páginas do SuperDrop na Commerce** (`/f/<fornecedor>`, `/seja-fornecedor`, `/fornecedores`) vão para o SuperDrop.
- **4. Vitrine na marca certa:** loja SuperDrop aberta na Commerce (ou o contrário) vai para o endereço da marca dona, mesmo caminho (`storeOwnerBase`; o proxy passa `x-nl-search`). Demonstrações de tema, domínio próprio, Master e endereços técnicos não mudam.
- **9. Buscadores:** `src/app/robots.ts` e `src/app/sitemap.ts` (dinâmicos, por endereço, `src/lib/seo-marca.ts`): cada marca lista só as páginas dela; painéis, links privados e a API ficam fora; demonstração, escritório e marca "em breve" não são indexados.
- **Painéis (pergunta 1):** `MASTER_HOST_ONLY` passa a valer **por padrão** (só `MASTER_HOST_ONLY=false` desliga): `/master`, `/commerce` e `/bras` nos endereços das marcas levam ao Master, e a equipe entra só pelo endereço do Master (`accountBrandConflict`). Painéis de cliente de uma marca só (`/meu-bras`, `/importadora` → Brás; `/transportadora` → Cargas) abertos em outra marca vão para a marca deles. `/merchant`, `/supplier`, `/partner` e `/theme-editor` continuam no SuperDrop e na Commerce.
- **Site do grupo (pergunta 2):** com `GROUP_SITE_URL` ligado, a raiz daquele endereço abre Soluções; a raiz do Master continua levando ao login.
- **Mapa vivo:** as regras de "fora do lugar" seguem esta decisão (painel da equipe fora do Master; painel do cliente na marca errada; painel de lojista na Brás/Cargas fica "a definir"). "Pronto e desligado" mostra o site do grupo e o Master exclusivo.
- **Redirecionamentos temporários (307)** até a Fase 3 fixar os domínios; depois viram permanentes (308), para o navegador não guardar um destino provisório.
- Item 8 (`/master/bras`, `/master/commerce`, `/supplier/shipping`) fica como está, documentado; item 10 (nomes de painel em inglês) fica.
- Local: os scripts de demonstração com várias marcas precisam de `MASTER_HOST_ONLY=false` para abrir o Master em `localhost`/127.0.0.x como se fossem as marcas (localhost sozinho não é marca e nunca redireciona).
- Testes: `tests/host-routing.test.ts`, `tests/brand.test.ts`, `tests/mapa-vivo.test.ts`, `tests/seo-marca.test.ts`, `tests/cargas.test.ts`.

## D150 — Perfis da família no ambiente de demonstração e guias em PDF (2026-10-12)
Pedido do dono: um acesso para o filho (Samuel, 13 anos) e para a esposa (Danielle Terceiro) conhecerem todos os níveis do sistema, com a percepção de fornecedores, lojistas e clientes finais; recomendação aceita: **só no ambiente de demonstração**, nunca acesso total na produção (dados reais de clientes, LGPD, risco de ação errada).
- `src/db/demo-familia.ts` (`seedDemoFamily`, chamado no bootstrap com dados de demonstração): perfis `samuel.<papel>@familia.demo` e `danielle.<papel>@familia.demo` (Master, Financeiro do Master só para a Danielle, Lojista SuperDrop, Loja Commerce, Fornecedor, Expedição só para o Samuel, Importadora, Transportadora), cada um na mesma empresa de um perfil de demonstração existente (vê os mesmos dados fictícios), senha da demonstração. Importadora e transportadora ganham a ligação com a empresa. Idempotente pelo e-mail; referência ausente é pulada. Nunca roda na produção (o bootstrap de produção não usa dados de demonstração).
- Parceiro e membro da Brás ficam com os perfis de demonstração existentes: esses cadastros são únicos por pessoa (código, CPF, CNPJ).
- Guias: `docs/manual/GUIA-DO-EXPLORADOR-SAMUEL.md` (missões, 213 telas) e `docs/manual/GUIA-GESTAO-FINANCEIRA-DANIELLE.md` (6 módulos de gestão financeira), com PDFs gerados por `scripts/manuais/gerar-pdf.sh` (Markdown → HTML → Chromium).
- Testes: `tests/demo-familia.test.ts`.

## D151 — Demonstração com tudo ligado (2026-10-12)
Pedido do dono: "na demonstração precisamos ver tudo ativado e funcionando". Só no ambiente de demonstração; a produção não muda.
- `src/db/demo-ligar-tudo.ts` (`turnEverythingOnInDemo`, no bootstrap com dados de demonstração, uma vez só, marca `demo.tudo-ligado`): liga, pelas mesmas funções das telas do Master e com auditoria, o questionário de preço, os benefícios nos painéis, a porta de entrada do SuperDrop e da Commerce com os preços da Proposta e um experimento rodando em cada uma, a barra do ecossistema (captação, e-mails, páginas públicas), Club+ e Club Total publicados, a Proposta aprovada, a taxa dos fardos do ônibus e o Pix do frete do ônibus.
- Chaves no serviço de demonstração do Render: `BRAND_SIGNUP_NEXTLEVEL_COMMERCE`, `BRAND_PARTNERS_NEXTLEVEL_COMMERCE`, `BRAND_SIGNUP_BRAS_DIGITAL`, `FIN_PAGARME` (sem chave do Pagar.me continua cobrando pelo simulado) e `NEXT_PUBLIC_SUPPORT_EMAIL` fictício.
- Ficam desligados de propósito: conta Mercado Pago da NextLevel (exige conta real; a demonstração simula o Pix), envio real de e-mails, endereços próprios (escritório, site do grupo).
- **Correção que vale também para a produção:** `NEXT_PUBLIC_SUPPORT_WHATSAPP` e `NEXT_PUBLIC_SUPPORT_EMAIL` são gravados pelo Next no build; o `Dockerfile` não os recebia, então o contato de suporte nunca aparecia na imagem do Render mesmo com a chave preenchida. Agora entram como `ARG` no build.
- Testes: `tests/demo-ligar-tudo.test.ts`.

## D152 — Pacote visual das marcas selecionadas (GPT imagens) (2026-10-12)
Pedido do dono, com o prompt mestre `PROMPT-CLAUDE-CODE-IMPLEMENTAR-MARCAS-SELECIONADAS-V2` e nove pacotes.
- **Arquivos:** `public/marcas/<slug>/{logos,imagens}` com os PNG originais preservados e derivados WebP para exibição (logos `-640`, monogramas e ícones `-256`, imagens `-1600` e `-800` para celular). Marcas: nextlevel, superdrop, nextlevel-commerce, bras-digital, nextlevel-cargas (13 imagens cada); nextlevel-club (com `tiers/club-plus` e `tiers/club-total`), loja-nextlevel, meu-contador e parceiros (só logos).
- **Fonte única:** `src/lib/marcas-visuais.ts` (cor de assinatura, logos, status dos kits, textos sem métrica nem promessa de ganho). Peças em `src/components/portal/marca-institucional.tsx`: `VitrineMarca` (imagem principal, recursos com ícones, capacidades), `FechoMarca` (prova e chamada final), `AberturaMarca` e variante `assetless` (superfície navy, faixas diagonais em CSS, número no lugar do ícone) para quem ainda não tem imagens; o arquivo novo entra pelo registro.
- **Páginas:** início do SuperDrop, da Commerce, da Brás e da Cargas e Soluções ganharam as peças; Loja NextLevel e Programa de Parceiros ganharam a faixa com a logo; novas `/club` (Club+ e Club Total como níveis, preço só se publicado) e `/meu-contador` no site do grupo (no menu do grupo: "Club"; nas marcas, redirecionam para o grupo).
- **Cores:** sinal SuperDrop `#2D9E3B`, Commerce `#2F81F4`, Brás `#D55E00` (assinatura `#D35C00` ajustada 1 tom para o texto do botão passar em AA); NextLevel e Cargas já estavam nas cores do pacote. Painéis e páginas usam as mesmas variáveis `--brand-*`.
- **Logos:** NextLevel, SuperDrop e Commerce seguem com as oficiais do sistema. Brás e Cargas passam a usar a logo clara do pacote; a **logo escura das duas veio com fundo sólido** (sem transparência), então no tema escuro aparecem em texto até chegar a versão certa. Monogramas e favicons da Brás e da Cargas: pendentes no pacote.


## D153 — Home SuperDrop v4: uma história só, foto no herói e cabeçalho na cor do herói (2026-10-16)
Pedido do dono, depois de ver o pacote D152 no celular ("ficou muito a desejar… no início não houve imagem de hero"). Especificação: `docs/prompts/superdrop-home-v4-analise-e-prompt.md` (título A).
- **Mensagem:** "Você vende. O fornecedor envia." Sem pílula de cupom e sem três botões no herói; "Área de membros" fica só no cabeçalho.
- **Estrutura** (`src/components/portal/superdrop/home-v4.tsx`), de 15 para 9 seções: herói com a foto `hero-key-visual` e a esteira ao vivo; faixa de confiança; 4 passos com ícones e fotos do pacote; bastidores (marinho); o dinheiro de cada um com os papéis; lojas de demonstração reais (capturas em `public/portal/superdrop/v4/`); conta e planos; dúvidas; chamada final sobre `cta-moment`. Saíram desta página a `VitrineMarca`, a `FechoMarca` (continuam para outras marcas), os benefícios com ícone em círculo e a prévia cinza de tema.
- **Cor:** fundo escuro = marinho retirado das fotos (`#0D1B34`); verde `#2D9E3B` só no botão principal (texto marinho, contraste AA) e destaques.
- **Cabeçalho:** enquanto o herói escuro está sob ele, fica no mesmo marinho (CSS `:has([data-heroi-escuro])` sem piscar + `CabecalhoSobreHeroi` marcando `data-heroi-passou`). Opt-in por página; as outras não mudam.
- **Parceiros:** foto `pa-parceiros-hero` no topo das telas do SuperDrop; agência e desenvolvedor saíram da escolha principal (programas não abertos) e viraram link "entre na lista", com o mesmo formulário de contato.
- **Rodapé público:** a frase legal aparecia duas vezes (assinatura + `legalLine`); ficou só a assinatura e o ©.

## D154 — Commerce v3: marca certa em todas as telas, promessas coerentes e home com foto (2026-10-16)
Pedido do dono ("aplique todas as recomendações… aceito tudo… slogan a primeira opção"). Especificação: `docs/prompts/commerce-home-v3-analise-e-prompt.md` (título A).
- **Marca certa (vale para todas as marcas):** recuperar senha, nova senha, 404 e tela de bloqueio usam a logo da marca do endereço (`LogoDoEndereco`); a assinatura `NextLevelSignature` deixou de ter "SuperDrop" como padrão (marca obrigatória). O selo "Tecnologia SuperDrop" do rodapé das lojas só aparece em loja do SuperDrop (`SectionCtx.brandCode`, vindo da organização). Teste: `tests/marca-certa.test.tsx`.
- **Textos:** "Criar minha loja grátis" → "Começar N dias grátis" (prazo e 1º mês vêm da oferta); sem "1 minuto"; chamada final sem "escolha o plano depois"; "25% de desconto". Famílias de tema em português (Esporte, Beleza, Celular e acessórios) e níveis **Grátis · Profissional · Avançado · Exclusivo** (só rótulos; chaves, preços e capacidades iguais).
- **Home:** herói com a foto `hero-key-visual` sobre o marinho `#0B1A36`, título "A loja da sua marca, pronta para vender.", sem amarelo, grade ou manchas; cabeçalho na cor do herói (`data-heroi-escuro="commerce"`); lojas de exemplo = capturas reais (Trama Urbana, Linha de Jogo, Casa em Ordem); fotos antes paradas (`cm-hero-marca-propria`, `cm-temas-ambiente`) em uso; bento "Pagamento" sem o aparelho cobrindo o título no celular; temas abrem em Moda e avisam quando o segmento ainda não tem imagens; uma chamada final só, sobre `cta-moment`. Saíram da home `VitrineMarca` e `FechoMarca`.
- **Cadastro no celular:** faixa baixa com a foto `cm-cadastro-lateral`.

## D155 — Vidro, luz ambiente e escala de movimento no sistema de design (2026-10-16)
Pedido do dono: executar o prompt mestre da referência técnica NEXTLEVEL (navegação de vidro, motion discreto, profundidade, claro e escuro completos), dentro da arquitetura existente. Detalhes, inventário e "comprovado × evolução" em `docs/design/VIDRO-E-MOVIMENTO.md`.
- **Tokens novos** por marca e modo (`themes.ts`): `glass` (74–78%), `glassSolid` (97%, quando não há desfoque), `glassBorder`, `glassHighlight`, `ambient`. Forma (`tokens.css`): `--ds-glass-blur` 16 px, `--ds-glass-shadow`, `--ds-dur-micro` 180 ms, `--ds-dur-enter` 500 ms, `--ds-rise` 14 px, `--ds-lift-card` 3 px, `--ds-lift-action` 2 px, `--ds-stagger` 40 ms.
- **Aplicação central** (alcança as 215 páginas pelas quatro cascas): cabeçalho público e barra dos painéis em vidro real com fallback sólido; estado "rolado" com elevação; item ativo com fundo + barra; menu do celular e diálogos com entrada curta; luz ambiente nas páginas públicas; cartões e ações com elevação em resposta ao gesto. Lojas dos clientes ficam fora (o visual é do lojista).
- **Movimento reduzido também no JavaScript**: `comportamentoDeRolagem()` (`src/lib/ui/movimento.ts`) nas rolagens programáticas. `Reveal` passa à escala (500 ms, 14 px, atraso máximo 320 ms).
- **Mantido de propósito:** sem escolha salva o sistema abre no **claro** (decisão anterior do projeto; a referência manda seguir a arquitetura existente).
- **Testes:** `tests/vidro-contraste.test.ts` (texto AA sobre o vidro com fundo preto e branco, todas as marcas, claro e escuro).
- Botão "Assinar por Pix" dos planos do SuperDrop passa a usar a cor primária do tema (no escuro ficava quase invisível sobre o cartão).

## D156 — Fase 3: nextlevelgroup.com.br é o site do grupo no sistema (2026-10-16)
Decisão do dono: o endereço principal do grupo passa a abrir o nosso sistema; o site feito no ChatGPT Sites ("NEXTLEVEL Experiência Estratégica") vai para `experiencia.nextlevelgroup.com.br`.
- **Rotas** (`routeHost`): com `GROUP_SITE_URL`, `www.` leva ao endereço principal; no endereço do grupo só ficam as páginas do grupo (Soluções como início, Club, Meu Contador, Loja NextLevel, termos, privacidade, `/api`, `/r`, `/c`); login e painéis vão para o Master; o resto vai para Soluções. Sem `GROUP_SITE_URL` nada muda.
- **Marca:** `nextlevelgroup.com.br` e `www.` entram nos domínios padrão da holding (antes a raiz caía no SuperDrop por ser "fora do sistema").
- Redirecionamentos seguem temporários (307) para poder voltar atrás.
- Passo a passo do dono (ChatGPT Sites, Render, Hostinger) em `docs/nextlevel-commerce/fase-3-dominio-do-grupo.md`; a chave `GROUP_SITE_URL` só é ligada depois do domínio verificado no Render.

## D157 — Site do grupo v1: Soluções, Club, Meu Contador e Loja NextLevel na linguagem navy + amarelo (2026-10-17)
Pedido do dono: com nextlevelgroup.com.br abrindo o nosso sistema (D156), analisar e evoluir as quatro páginas do grupo como foi feito no SuperDrop (D153) e na Commerce (D154). Análise e prompt em `docs/prompts/site-grupo-v1-analise-e-prompt.md`.
- **Abertura única** (`AberturaMarca`): topo navy `#101B34` ligado ao cabeçalho (`data-heroi-escuro="nextlevel"`, botão amarelo com texto navy), foto opcional do kit do grupo, logo só quando a marca tem logo escura (a holding usa a do cabeçalho).
- **Soluções:** título "Estrutura digital para o seu negócio ir além." sobre `hero-key-visual`; faixa com as logos das marcas do grupo; jornada legível; imagem em todos os cartões de "Soluções e preços"; caminho recomendado destacado; prova e chamada antes do formulário; removida a nota pública "esta seção fica vazia".
- **Marcas sem kit de imagens** (Club, Meu Contador): capacidades em cartões de texto, sem bloco navy vazio no lugar da foto. Club usa `cta-moment` do grupo como foto decorativa.
- **Loja NextLevel:** topo pela abertura única com `capability-01` (sem o brilho verde do SuperDrop); temas com a captura da loja de demonstração; nichos "Beleza/Celular: acessórios de marca própria" (sem ":" duplo).
- Sem número, depoimento ou cliente inventado; preços e regras sem mudança.


## D158 — Brás Digital Club: nova identidade da marca Brás no painel e na página pública (2026-10-17)
Pedido do dono: aplicar o pacote `bras-digital-club-upload-sistema-v2` (logos, peças 3D, tokens, racional e prompt mestre). Registro completo em `docs/marcas/bras-digital-club/IMPLEMENTACAO.md`.
- **Nome e slogan:** a marca `BRAS_DIGITAL` passa a se chamar **Brás Digital Club**, slogan **"Conecte seu negócio ao pulso do Brás."** O código `BRAS_DIGITAL` não muda (está gravado no banco em organizações, membros e pedidos): nenhuma migração de dados.
- **Fonte única:** `src/lib/marcas/bras-digital-club.ts` (adaptação de `brand.config.json` e `brand-tokens.json`). Tema `bras` (`themes.ts`), paleta (`brand-palette.ts`), registro (`brand.ts`), logo (`BrandLogo`), ícones, manifesto, prévia de link e página pública leem daqui. Constantes `--bdc-*` na raiz (nomes exclusivos da Brás); papéis de interface pelo tema, isolado por `data-ds-theme="bras"` e pela área (`AreaTheme`).
- **Cores:** navy `#0C1830` na estrutura (barra lateral navy também no claro), área de trabalho clara (`#F7F9FC`/branco), azul elétrico `#315CFF` nas ações, ciano `#00D4FF` como pulso (reflexo, foco no escuro, detalhes). Escuro com navy `#0C1830`, superfícies `#132445`. **Exceção registrada:** o foco no modo claro é azul, porque o ciano sobre branco não chega a 3:1 (indicador de foco WCAG); no escuro o foco é ciano.
- **Logos:** troca de arquivo por superfície (clara no claro, escura com lettering off-white no navy), monograma na barra recolhida; nunca filtro, recoloração, sombra ou recorte. As peças 3D só no herói e na prévia de link, nunca no lugar da logo.
- **Página pública:** herói navy com o slogan como título em HTML e a peça `02-metal-anodizado-sem-texto` (recorte quadrado próprio no celular); proposta de valor, benefícios e capacidades, descobertas, como funciona, para quem, acesso, confiança (só fatos do sistema), dúvidas, chamada final e rodapé institucional escuro com a assinatura com slogan. Rota `/bras-digital-club`: no endereço da Brás leva à página inicial; nas outras marcas e no grupo, ao endereço da Brás; em endereço técnico abre a página.
- **Domínio:** o nome-base é `brasdigitalclub`, mas a extensão não foi confirmada: nenhum canônico, `og:url`, sitemap ou redirecionamento definitivo. A Brás segue em `bras.nextlevelgroup.com.br`.
- **Kit antigo arquivado:** `public/marcas/bras-digital/` (laranja) fica no repositório, sem uso nas páginas. Textos jurídicos versionados (termos da Brás, D99; termos do grupo, D148; juridico.ts) e os rótulos da tabela de preços do grupo não mudam sem decisão do dono (mudar os termos exige novo aceite dos membros).
- **Domínio próprio (17/10/2026):** o dono registrou `brasdigitalclub.com.br` (Registro.br). Já reconhecido como da Brás (com `www` e o antigo `bras.nextlevelgroup.com.br`); vira o endereço no ar quando `BRAND_URL_BRAS_DIGITAL=https://brasdigitalclub.com.br` for ligado no Render, depois do DNS verificado. Aí os outros endereços levam a ele (mesmo caminho) e o canônico passa a valer.

## D159 — Brás Digital Club: rede aberta de abastecimento com compra coletiva (2026-10-17)
Análise completa em `docs/prompts/bras-analise-sistema-e-perguntas.md`. Respostas do dono:
- **Sentido do "Club":** clube de compra coletiva entre empresas verificadas (juntar volume para comprar como grande: cotação coletiva, contêiner dividido, frete consolidado). Os pontos do grupo (NextLevel Club) são benefício, não a razão do nome.
- **Modelo:** rede aberta com aprovação. Fornecedores (importadora, distribuidor, atacadista) se cadastram, são aprovados no Estúdio e aparecem pelo nome por categoria; o comprador pede cotação a vários. Substitui o "nome escondido até o pedido" da D95 para o núcleo de cotação (a vitrine curada de descobertas pode continuar).
- **Públicos iniciais:** lojista do interior, vendedor de marketplace profissional e iniciante, distribuidor regional, todos com CNPJ. Revendedor sem CNPJ em aberto.
- **Receita:** plano do fornecedor, plano do comprador, frete e serviços e comissão sobre pedido. A comissão exige pagamento pela plataforma com repasse ao fornecedor; isso entra no núcleo, logo depois da cotação.
- **Roteiro:** F1 página com as duas portas e autocadastro do fornecedor; F2 diretório; F3 cotação; F4 planos; F5 pagamento integrado e cotação coletiva; F6 religar serviços. Perguntas restantes na seção 11 do documento.

## D160 — Brás Digital Club F1+F2: as duas portas, cadastro do fornecedor, aprovação e diretório; Canindé primeiro (2026-10-17)
Respostas do dono à análise (D159): o primeiro polo é o **Canindé**; podem se cadastrar **todos os tipos** de fornecedor (importadora, distribuidor e atacadista).
- **Mesma tabela, mesmo painel** (regra anti-duplicação): `bd_importers` ganha tipo (`supplier_type`), polo (`polo`: Canindé, Brás, Bom Retiro, 25 de Março, outro), situação do cadastro (`approval_status`: pendente, aprovado, recusado), origem (`signup_source`) e os dados da revisão. Os já cadastrados pelo Master ficam como importadora do Brás, aprovados. Migração `0068_bras_rede_fornecedores` (só acrescenta colunas e índices).
- **Cadastro do fornecedor** em `/fornecer` (público no endereço da Brás, limite de tentativas): tipo, polo (Canindé marcado como primeiro), CNPJ conferido e único, nome, razão social, até 8 categorias, descrição, pedido mínimo, formas de pagamento, endereço, responsável, WhatsApp, e-mail e senha. Cria a empresa, o login de dono e o fornecedor **pendente**; avisa a equipe no sino do Master. O fornecedor entra no painel e vê "em análise" até a aprovação.
- **Aprovação no Estúdio** (Importadoras): fila dos pendentes com aprovar ou recusar; recusa exige motivo, que o fornecedor vê ao entrar. Auditoria antes e depois.
- **Diretório no Meu Brás** (Fornecedores): só membro ativo, só fornecedor aprovado e ativo; filtros por polo, tipo e categoria; perfil comercial (categorias, descrição, mínimo, pagamento, prazo, produtos à venda). Nunca contato, CNPJ, anotações, comissão ou plano. A cotação, por enquanto, é pedida à equipe (WhatsApp com o fornecedor na mensagem); a cotação pelo sistema é a F3.
- **Página pública:** título "A rede de abastecimento de quem compra para revender.", o slogan como selo acima do título e os botões **Quero comprar no atacado** e **Quero fornecer**; seção "Para compradores / Para fornecedores" com o sentido do Club (empresas verificadas comprando com força de grupo); menu com as duas portas.
- Testes: `tests/bras-rede-fornecedores.test.ts`.


## D161 — NextLevel v2: nova identidade da marca-mãe no site do grupo e no Master (2026-10-17)
Pedido do dono: aplicar o pacote `nextlevel-grupo-v2-completo.zip` (NL Orbital, lettering Orbital em Avanço, acabamento Prisma Digital integral). Registro completo em `docs/marcas/nextlevel/IMPLEMENTACAO.md`; o pacote (docs, tokens, integração, referências) fica em `docs/marcas/nextlevel/`.
- **Nome e assinatura:** NextLevel / SOLUÇÕES DIGITAIS (linha da assinatura, não slogan). O slogan do briefing ("Estrutura digital para o seu negócio ir além.") continua como texto institucional; nenhum slogan novo. O código `NEXTLEVEL` (holding) não muda.
- **Fonte única:** `src/lib/marcas/nextlevel.ts` (adaptação de `brand.config.json` e `brand-tokens.json`). Tema `nextlevel` (`themes.ts`), paleta (`brand-palette.ts`), logo (`BrandLogo`), ícones, manifesto, prévia de link, herói e peças institucionais leem daqui. Constantes `--nlg-*` na raiz (nomes exclusivos da marca-mãe).
- **Cores:** marinho `#070F22` na estrutura (barra lateral marinho também no claro), área de trabalho gelo `#F3F6FC`/branco, ação royal (`#274BE5` no claro para texto branco passar AA; `#365BFF` no escuro), link `#80B8FF` no escuro, azul luminoso `#12B8F4` como reflexo e foco no escuro, turquesa `#2AD7C0` como acento decorativo. O degradê royal → turquesa só em filetes e detalhes, nunca atrás de texto.
- **Isolamento:** só o tema `nextlevel` mudou. SuperDrop, Commerce, Brás Digital Club, Cargas e as marcas em breve mantêm cores, logos e o amarelo do grupo como destaque secundário (decisão de produto deles, D79). As peças institucionais compartilhadas usam o marinho v2 só nas páginas do site do grupo; Cargas e Parceiros seguem no navy v2 do sistema.
- **Logos por superfície e tamanho:** nome sem a linha de apoio em espaço pequeno (cabeçalhos, rodapés, barra lateral), versão de interface (flat) com a linha de apoio em espaço médio, Prisma Digital em área ampla (herói, login), monograma flat na barra recolhida. Troca de arquivo, nunca filtro ou efeito CSS; cópias WebP recortadas da margem transparente (PNG originais preservados).
- **Site do grupo (`/solucoes`, página inicial de nextlevelgroup.com.br):** herói marinho com a assinatura Prisma e a peça `02-metal-anodizado-sem-texto` (texto à direita; recorte quadrado no celular), ecossistema com as logos próprias de cada marca, método (jornada), soluções e preços, três caminhos, dúvidas (só fatos do catálogo), prova, chamada final com a peça 3D e diagnóstico com contato (quando configurado).
- **Master:** tela de entrada com a peça "vidro óptico" e a assinatura Prisma no cartão; barra lateral marinho com o nome; monograma na barra recolhida; botões, foco e seleção no royal.
- **Ícones e prévia:** favicons 16/32/48 e ICO, Apple 180, PWA 192/512 e maskable com manifesto próprio; cor da barra do navegador marinho; prévia de link `og-nextlevel-1200x630` (achatada sobre o marinho, o PNG original tem transparência). Marcas sem favicon próprio (China Hub, Cargas) passam a usar os da marca-mãe v2.
- **Arquivado:** o raio amarelo (`public/brand/v2/nextlevel/`) e o kit de fotos v1 do grupo (`public/marcas/nextlevel/imagens`, com linhas amarelas) saíram das páginas da marca-mãe; ficam no repositório, e o kit de fotos segue só nas páginas da família (Club, Loja NextLevel) até elas ganharem kit próprio.
- Domínio: nenhum endereço novo; o canônico continua o de `groupSiteUrl()` (configuração existente). Testes: `tests/nextlevel-marca.test.tsx`.

## D162 — Vitrine imersiva de Soluções (atrás da chave FIN_SOLUTIONS_V2) (2026-10-17)
Execução de `docs/prompts/solucoes-vitrine-imersiva-construcao.md`; imagens e copy em `solucoes-vitrine-imersiva-imagens-gpt.md` (v3).
- **Chave:** `FIN_SOLUTIONS_V2` nasce desligada; com ela desligada `/solucoes` fica como na D161. O Master vê a vitrine em `/solucoes?previa=v2` (sessão `NEXTLEVEL_MASTER`). O dono liga a chave no Render depois de aprovar.
- **Peças compartilhadas, sem cópia:** `ImmersiveScroll`, `LayerMotion` e o carrossel do tema Pódio foram para `src/components/movimento/`; os arquivos antigos da loja reexportam (as lojas não mudam). `ImmersiveScroll` ganhou `onStep`.
- **Dados:** `src/lib/solucoes/vitrine.ts` projeta catálogo Master, jornada, oferta de entrada e temas pagos; nenhum preço fixo na tela. Contratação só por caminhos que existem (cadastro da plataforma, página da solução, site do SuperDrop, diagnóstico para itens sob consulta). Busca por intenção com sinônimos em `intencoes.ts` (texto de apoio, não regra) e as plataformas de origem da Migração vindas do catálogo.
- **Seções:** jornada em cinco fases com quadros que trocam na rolagem e régua clicável (sem JS ou com menos movimento, as fases ficam em sequência); quatro portas por intenção (filtram o cardápio pelo endereço, sem JS); cardápio com barra fixa de famílias, busca e mosaico; campanha da vez só com oferta ativa; temas em exposição com a loja de demonstração; "Sua seleção" (total à vista e por mês só do que tem preço fixo; o resto conta como sob consulta) que preenche o diagnóstico (até 6 necessidades e a lista na mensagem).
- **Imagens:** enquanto os lotes do GPT não chegam, os quadros usam as peças 3D da marca e os cartões as fotos das famílias (v3). Pasta de destino: `public/portal/nextlevel/v4/solucoes/`.
- Testes: `tests/solucoes-vitrine.test.ts`.

## D163 — NextLevel E-commerce: novo nome público e identidade da plataforma de lojas (2026-10-17)
Pedido do dono: aplicar `nextlevel-ecommerce-kit-completo-v1.zip`. Pacote em `docs/marcas/nextlevel-ecommerce/`; arquivos públicos em `public/marcas/nextlevel-ecommerce/`.
- **Nome:** NextLevel Commerce passa a se chamar **NextLevel E-commerce** (linha: PLATAFORMA DE LOJAS VIRTUAIS) em telas, e-mails, metadados e textos. O código `NEXTLEVEL_COMMERCE`, o tema interno `commerce`, rotas (`/commerce`), chaves e dados não mudam. **Exceção:** o texto jurídico do grupo (`legal-grupo.tsx`, termos versionados da D148) mantém o nome antigo até o dono decidir (mudar termos pode exigir novo aceite).
- **Fonte única:** `src/lib/marcas/nextlevel-ecommerce.ts` (EC, logos, ícones, `--ec-*`). Tema `commerce`, paleta, `BrandLogo`, ícones, manifesto e prévia de link leem daqui.
- **Cores:** marinho `#101A33`, azul `#3F65FF` (ação `#294CDC` no claro, para texto branco passar AA), ciano `#27C7F2` (reflexo e foco no escuro), gelo `#F3F6FC`. O site público da plataforma trocou o navy e o azul escritos à mão pelas variáveis `--ec-*`.
- **Logos:** flat no cabeçalho, rodapé e painel; Prisma em destaque; monograma NE na barra recolhida e favicons; troca de arquivo, nunca filtro. O SVG antigo (raio azul + "Commerce" em texto, `public/brand/v2/commerce/`) e a prévia de link v3 ficam arquivados.
- **Isolamento:** NextLevel (Master e grupo), SuperDrop, Brás Digital Club, Cargas e as vitrines dos lojistas não mudam (as lojas têm tema e marca próprios).
- Testes: `tests/nextlevel-ecommerce.test.tsx`.
- **Imagens entregues (2026-10-17):** os 4 lotes do GPT (27 imagens) estão em `public/portal/nextlevel/v4/solucoes/` (WebP e AVIF 800/1600; originais e documentação do pacote em `docs/marcas/nextlevel/solucoes-imagens/`). Jornada com fotos deitadas no computador e em pé no celular (texto na área calma de cima), portas, campanha, temas, diagnóstico, fecho e as nove famílias (Temas e Cursos com cartões próprios no cardápio). Copy das fases revisada com o pacote, sem prometer constância de vendas nem resultado. O manifesto `.webmanifest` passou a ser arquivo estático no proxy (antes ia para o login no Master e na Brás).

## D164 — Sem vazamento entre marcas: nada de SuperDrop na NextLevel E-commerce (2026-10-17)
- **Pedido do dono:** "não quero cores fora de lugar, não quero nada de SuperDrop no NextLevel E-commerce"; "agora não podemos ter vazamentos de painéis e marcas de forma inadequada". A mistura inteligente das marcas do grupo (venda cruzada) fica para uma rodada própria.
- **Fio do grupo, lançador, rodapé da família e selo do Club:** tabela `OCULTAS_EM` em `src/lib/domain/ecossistema/lancador.ts` (E-commerce oculta o SuperDrop). Só a marca atual tem cor no fio; as outras ficam neutras (sem cor de outra marca na tela). O SuperDrop continua vendo as marcas como antes.
- **Pós-venda da loja independente:** sem a coluna "Aguardando recarga"; "Na Central" vira "Em preparação" (`stagesFor`, `stageLabelsFor`, `attentionFor(…, independent)`).
- **Financeiro da loja E-commerce:** o cartão de mensalidade mostra a assinatura da E-commerce (`nl_subscriptions`), não o plano antigo "Loja SuperDrop"; o "Por que cobramos" deixa de citar o SuperDrop.
- **Nome dos planos na tela:** `nomePlanoEc` ("Plano Start/Pro/Scale"). O nome no catálogo do banco ("Commerce Start") troca no Master quando o dono quiser (nova versão, sem mexer no preço).
- **Master:** descrições do console `/commerce` sem SuperDrop; "Financeiro SuperDrop" só aparece onde há o módulo de distribuição.
- **Método e prompt para todas as marcas:** `docs/prompts/padrao-nextlevel-todas-marcas.md`; varredura `scripts/auditoria/marca.mjs`. Testes: `tests/ecommerce-sem-superdrop.test.ts`.
- **Rodada 2 (todas as marcas, 2026-10-17):** varredura em 14 contas (SuperDrop lojista, fornecedor, expedição; Brás membro, importadora, balcão; Cargas transportadora e ônibus; Master e financeiro; E-commerce lojista, completo e equipe). Correções: o rodapé "Parte do Grupo" e o aviso do Club não listam mais as outras marcas (só "Conheça o Grupo NextLevel"; a apresentação cruzada volta numa rodada própria); a Loja NextLevel do lojista SuperDrop não mostra produtos da E-commerce (`JourneyCard.outraMarca`, a compra continua bloqueada no servidor); o fornecedor não vê mais texto técnico sobre o Brás; a página da Cargas troca o amarelo antigo do grupo pelo índigo da marca; o login de cada marca lista só os perfis de demonstração daquela marca. Resultado da nova varredura: 0 telas com problema em SuperDrop, Brás, Cargas e E-commerce.
- **Rodada 3 (2026-10-17):** o menu das páginas públicas passava da tela entre 1021 e ~1110 px (85 px de rolagem lateral na E-commerce em 1024 px). Agora o menu completo aparece a partir de 1121 px (mais compacto até 1279 px) e abaixo disso vira o botão de menu; conferido sem rolagem lateral em E-commerce, SuperDrop, Brás e Cargas de 1000 a 1440 px. Cartões de tema sem `aria-label` próprio (o nome lido passa a ser o texto visível do cartão). A prévia da home imersiva da E-commerce fica na branch `revisao/ecommerce-home-imersiva` (fotos provisórias; relatório em `docs/design/ecommerce-home-imersiva-previa.md` naquela branch), sem publicar.

## D165 — Home imersiva da NextLevel E-commerce no ar (2026-10-17)
- **O quê:** a home de `lojas.nextlevelgroup.com.br` passa a ser a imersiva, no padrão da Soluções (D162): mesma primeira dobra (texto e oferta do Master), jornada "a loja que cresce" em cinco passos com a foto presa na tela (computador: foto emoldurada à esquerda e texto à direita; celular e tablet em pé: foto em pé ao fundo), quatro portas (todas levam ao cadastro), lojas de exemplo, personalização interativa, temas, planos (simulador), dúvidas e chamada final. Sem JavaScript ou com "menos movimento": passos parados, cada um com a sua foto.
- **Fotos:** 18 fotografias individuais do pacote do dono (mesmo ateliê e ângulo), AVIF/WebP 800/1400 e 640/960 por `scripts/imagens/ec-home-converter.py`; a tela de entrada da E-commerce usa `ec-entrar`. As fotos provisórias de storyboard (primeiro pacote) não foram ao ar.
- **Copy:** só o que o sistema faz (conferido frase a frase); prazos e preços vêm do Master.
- **Saiu:** a home v2 (blocos "três passos", "para quem é", "venda, receba…", "operação") e a rota de prévia; o conteúdo está coberto pela jornada e pelas portas. Histórico no git.
- **Verificação:** e2e `e2e/commerce-home.mjs` (computador, tablet, celular, menos movimento), axe sem violações, sem rolagem lateral, CLS 0, Lighthouse no computador 99; testes `tests/ecommerce-home-imersiva.test.ts`, `tests/login-marca.test.ts`.
- **Testes desatualizados corrigidos** (a verificação do GitHub está parada desde 08/10 por pagamento da conta): cor da área Brás (D158), nome E-commerce no pedido de imagens (D163), SuperDrop fora da barra da E-commerce (D164), última migração lida do diário do Drizzle.

## D166 — Fila do dia do lojista e fotos v2 da E-commerce (2026-10-18)
- **Fila do dia** (fase E do plano `docs/prompts/aplicacao-imersiva-todas-marcas.md`): a primeira tela do lojista responde "o que eu preciso fazer agora?". A regra saiu da página e foi para o domínio (`src/lib/domain/fila-do-dia.ts`, pura, `tests/fila-do-dia.test.ts`). Ordem: configuração (E-commerce) ou saldo e etiqueta (SuperDrop), depois **pedidos parados além do normal** (mesma régua do pós-venda, `attentionFor`; pedido aguardando saldo não conta duas vezes), pagamentos pendentes, preparação e **tamanho que voltou ao estoque com cliente esperando aviso** (`stockDemand`). Item urgente destacado em vermelho. Loja E-commerce nunca vê saldo, Central ou etiqueta da Central. SuperDrop: mesmos itens de antes + parados e avise-me (sem mudança no que já existia).
- **Fotos v2 da home da E-commerce** (`docs/prompts/ecommerce-fotos-v2-personagens-gpt.md`): 8 personagens diferentes. Entraram 17 de 18; a paisagem `ec-jornada-2-loja` ficou fora porque a tela do notebook está virada para a câmera (mesmo erro de IA do pacote anterior). No computador o passo 2 usa `ec-temas` (Bruno e Ana comparando a vitrine); no celular, `ec-jornada-2-loja-retrato` (correta). Arquivos antigos mantidos na pasta pública, fora do acervo.
- **Próximo (sem depender de fotos):** fila do dia nos painéis de fornecedor, membro e importadora da Brás, transportadora e Master; páginas imersivas de Brás, Cargas e SuperDrop com o espaço das fotos reservado (pedidos de fotos em `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md`).

## D167 — Jornada imersiva de Brás, Cargas e SuperDrop com o lugar das fotos reservado (2026-10-18)
- **Peça única estendida:** o acervo de fotos aceita foto "em espera" (`acervoEmEspera`, `src/lib/imersiva/acervo.ts`). A peça imersiva reserva o lugar com a mesma proporção, num campo na cor da marca, sem texto (decorativo). Temas novos `.im-tema-cargas` e `.im-tema-superdrop`.
- **Entra no ar sozinha:** `SecaoImersiva` (jornada de 5 passos + 4 portas) só aparece quando o acervo da marca está completo (`acervoCompleto`); antes disso, só na prévia `/?previa=imersiva`, com aviso. As homes atuais continuam iguais. Quando as fotos chegarem, `scripts/imagens/imersiva-converter.py` regrava `src/lib/marcas/<marca>-home-imagens.ts` e a jornada passa a valer; se faltar foto que a página usa, os tipos acusam no build.
- **Conteúdo (só o que existe):** Brás (compra da Dona Cida: descobertas com análise, caixa fechada confirmada pela equipe, separação na importadora, retirada com código pela transportadora ou ônibus, acompanhamento no painel); Cargas (coletas por região, código no balcão, link do motorista, ônibus de excursão com fardos, extrato do mês; portas para transportadora, autônomo, ônibus e importadora, todas no cadastro que já aceita esses tipos); SuperDrop (mesmas promessas da home v4; portas para lojista, revendedora, fornecedor e parceiros). Nomes das fotos = `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md` (teste `tests/imersiva-marcas.test.ts`).
- **Identidade do SuperDrop (fase C):** `src/lib/marcas/superdrop.ts` é a fonte única das cores públicas (mesmos valores de antes; a home v4 passou a ler dali). A logo segue a atual até a decisão do dono.
- **Verificação:** prévia em 360 e 1440 px nas três marcas, sem rolagem lateral, um h1, axe sem violações graves; sem `?previa` a jornada não aparece.

## D168 — Fila do dia do membro da Brás e da transportadora; convite do parceiro pela marca do endereço (2026-10-18)
- **Mesma anatomia em todos os painéis** (fase E): a primeira tela responde "o que eu preciso fazer agora?" com o `ActionQueue` (do mais urgente ao menos urgente, cada item com botão). Regras puras em `src/lib/domain/fila-do-dia.ts`, testadas em `tests/fila-do-dia.test.ts`.
  - **Membro da Brás (`/meu-bras`):** cadastro em análise, respostas novas da equipe, pedido confirmado sem pagamento (urgente), pedido pago para mandar retirar, pedido recebido, descobertas novas. Os avisos soltos de "respostas novas" e "descobertas novas" viraram itens da fila (não aparecem duas vezes).
  - **Transportadora e ônibus (`/transportadora`):** chamadas para responder e Pix a devolver (urgentes), coletas fixas de hoje, cargas para coletar, frete a receber na chegada, em trânsito, link do motorista. Cada item leva ao bloco da tela "Hoje" (D111). O aviso solto do link do motorista virou item.
  - Fornecedor, importadora e Master já tinham fila ("Fila do dia", "Hoje" D110 e "O que exige atenção"); ficaram como estão.
- **Vazamento corrigido:** os textos prontos de WhatsApp do parceiro (início, links e cupons) diziam "Conheça o SuperDrop" e "7 dias" em qualquer marca. Agora vêm da marca do endereço (`textoConvite`, `src/lib/parceiros/convite.ts`), sem prazo de teste fixo. O "plano em destaque" do link do parceiro (planos do SuperDrop) só aparece em marca com dropship. Nome curto da marca nos painéis e nas telas internas do Master: "E-commerce" (antes "Commerce").

## D169 — Pulso da loja no painel do lojista (2026-10-18)
- Três sinais em pílulas logo abaixo da saudação (E-commerce) ou do cabeçalho (SuperDrop), cada um levando à tela que resolve: **vendas de hoje** (valor e quantidade, mesma régua da Análise, que conta o dia em UTC), **pedidos parados** (mesma régua do pós-venda e da fila do dia) e **situação** (E-commerce: o que falta para vender, vitrine não publicada ou em dia; SuperDrop: recarga necessária, pedidos pedindo atenção ou em dia).
- Regra pura `pulsoDaLoja` em `src/lib/domain/fila-do-dia.ts` (testada); componente `src/components/app/pulso-loja.tsx`. A E-commerce nunca vê "recarga" nem "Central".
- Não substitui a "saúde" da torre de controle do Master (`healthScore`), que segue medindo a infraestrutura comercial de cada loja para a NextLevel.
- **Vazamento no Master corrigido:** o detalhe de um pedido de loja E-commerce aparecia como "SuperDrop / Pedido", com "Custo à Central" e "Custo debitado do saldo". O Master agora passa a modalidade e a marca da loja ao detalhe do pedido (mesmo componente do lojista e do fornecedor); para loja sem fornecedor, quem prepara aparece como "Loja".

## D170 — Análise de vendas liberada na loja da NextLevel E-commerce (2026-10-18)
- **Achado:** a loja da E-commerce nasce com a oferta `STORE_SUBDOMAIN` (herança do SuperDrop) e a tela "Análise de vendas" pedia "Loja própria": o lojista da E-commerce via um cadeado com o vocabulário das ofertas do SuperDrop ("disponível em Loja própria", "Ver como liberar"). O pulso da loja (D169) leva justamente a essa tela.
- **Decisão (a confirmar pelo dono):** na E-commerce a análise vem liberada (`analiseLiberada`, `src/lib/features.ts`); quem paga é o plano da plataforma (Start, Pro, Scale), não as ofertas do SuperDrop. A própria tela já tinha o texto escrito para a E-commerce. No SuperDrop nada muda (continua pela oferta da loja).
- Se o dono quiser a análise só em planos maiores da E-commerce, o caminho é ligar a regra ao plano de `nl_subscriptions`, nunca à oferta do SuperDrop.
- Junto: na lista de lojas do Master, a coluna "Oferta" mostra "—" para loja da E-commerce (antes "Loja SuperDrop"); o plano dela aparece na coluna "Plano".

## D171 — Rede de proteção: molde do banco de teste, teste rápido e conferência no ar (2026-10-19, R0)
- **Molde do banco de teste:** as 69 migrações e o seed rodavam em cada `freshDb()` (cerca de 6,7 s por banco). Agora o `globalSetup` (`tests/global-setup.ts`, `tests/molde.ts`) gera o banco semeado UMA vez por execução, salva a cópia do PGlite (`dumpDataDir`) e o resultado do seed (com `Map` e `Date`); cada teste só carrega a cópia (cerca de 0,1 s). Se o molde falhar, `freshDb()` volta ao caminho antigo. Bateria completa: de 1183 s para 346 s. Cada banco de teste é fechado quando o seu teste termina (`onTestFinished`); sem isso a memória passava de 13 GB e o sistema derrubava arquivos de teste. Pico atual: cerca de 4 GB.
- **`npm run test:rapido`:** só os testes ligados ao que mudou em relação à branch de publicação (`vitest --changed`). Para o modo rápido (D64); antes de mudança grande continua valendo a bateria inteira.
- **`npm run conferir:producao`** (`e2e/conferencia-producao.mjs`): depois de publicar, confere sem login e sem navegador que cada site responde, tem título, não mostra erro, que a versão no ar é a do commit (`EXPECT_VERSION`) e que a E-commerce não mostra palavras do SuperDrop (e vice-versa). Faz parte da skill `publicar`.

## D172 — Perfil da loja: uma resposta só para "que loja é esta e o que ela pode usar" (2026-10-19, R1)
- **Causa dos vazamentos:** a loja da E-commerce herda a oferta do SuperDrop (`STORE_SUBDOMAIN`) e cada tela decidia sozinha "é E-commerce?" (`isCommerceStore`, `isIndependentStore`, `canUse(store.offer…)`).
- **Decisão:** `src/lib/domain/perfil-loja.ts` monta o perfil (marca, modalidade, plano, recursos liberados e vocabulário); `perfilAtual(storeId)` calcula uma vez por requisição. SuperDrop: recursos = oferta da loja, sem mudança nenhuma (teste compara com `OFFER_FEATURES`). E-commerce: recursos = plano (Start, Pro, Scale) numa tabela editável no Master (`ecommerce.recursos-por-plano`), padrão do dono em 19/10: tudo liberado nos três planos; saldo e etiqueta da Central nunca entram. Direito comprado à parte soma, nunca tira. Alterar a tabela exige Master financeiro e fica na auditoria.
- Substitui o `analiseLiberada` da D170. As telas migram aos poucos para o perfil (casca do painel, análise, modelos e editor de tema primeiro).

## D173 — Club só na Brás e na Cargas; Master único com seletor de marca (2026-10-19, R3 e R2)
- **Club (decisão do dono, 19/10):** os pontos são do **Brás Digital Club**. O selo do Club nas telas de entrada (`FioCaptacao`) e o cartão de pontos do painel (`CarteiraGrupo`, agora "Pontos do Brás Digital Club") só aparecem na Brás Digital e na NextLevel Cargas (`src/lib/club-marcas.ts`). E-commerce e SuperDrop não falam de Club nem de pontos; o restante do kit de benefícios (trilha, teste, simulador) continua. A página `/club` do grupo ("NextLevel Club") fica para decisão do dono.
- **Master único (decisão do dono, 19/10):** faixa "Vendo:" no topo do Master com Todas as marcas, E-commerce, SuperDrop, Brás Digital Club e Cargas (cookie `nl-master-marca`). Escolher uma marca enxuga o menu (no máximo 12 itens, teste) e vira o filtro padrão de lojas, clientes e escritório (`masterBrandFilter`). Ferramentas do grupo (erros, integridade, qualidade, torre, equipe, CRM, escritório, configurações) ficam em "Todas as marcas". Só muda o que se vê, nunca a permissão. Nenhum endereço antigo saiu do ar.
- Próximo passo do R2: os consoles `/commerce` e `/bras` como grupos dentro da mesma casca e o financeiro em abas.

## D174 — [Grupo] Revisão mensal dos desligados e regra de foco 60/25/15 (2026-10-19, R4 e R5)
- **Revisão mensal (R4):** na aba "Pronto e desligado" da Central de qualidade, cada item desligado mostra a minha sugestão (o dono disse "eu sugiro, você decide") e a decisão do mês: ligar, manter desligado ou aposentar, com anotação (`src/lib/domain/revisao-desligados.ts`, `qualidade.revisao-desligados`). Registrar **não liga nada**; só o dono decide; fica na auditoria. Mês novo, revisão nova. Sugestões de outubro em `docs/relatorios/REVISAO-DESLIGADOS-2026-10.md`.
- **Regra de foco (R5, decisão do dono):** 60% E-commerce, 25% SuperDrop, 15% o resto, até a E-commerce ter 10 lojistas pagantes. Escrita em `CLAUDE.md` e `AGENTS.md`. A partir daqui, título de decisão leva a frente entre colchetes e o relatório do dia traz "Esforço do dia por frente".

## D175 — [Grupo] Mapa do Ecossistema vivo no Master; fotos das páginas imersivas no ar (2026-10-20)
- **Mapa vivo (decisão do dono: página nova no Master):** `/master/mapa` transforma o mapa estático de 18/10 em página viva. Mostra:
  - uma constelação de marcas com tamanho por clientes, anel de saúde e linhas de clientes em comum;
  - um cartão por marca com o motivo da saúde;
  - os sites com a última conferência, as pessoas por painel e as conexões.

  Só leitura, uma consulta por bloco, reaproveitando a Torre (`presenceByDocument`, `ecosystemIndex`), a regra de venda paga do Dashboard e a conferência dos endereços da Central de qualidade. Não grava oportunidades nem confere endereços. Saúde é regra pura testada (`saudeDaMarca`). Abre para o dono e para a função Comercial; o item fica em "Todas as marcas". Plano completo e próximas fases (M1 a M3) em `docs/prompts/mapa-vivo-master.md`.
- **Fotos (decisão do dono: as três no ar):** 50 fotos do pacote de 19/10 convertidas. A jornada imersiva entrou no ar em Brás, Cargas e SuperDrop, e a jornada 2 da E-commerce voltou com a foto refeita. Cinco fotos chegaram cortadas dentro do ZIP e foram recortadas da parte intacta até virem inteiras:
  - `cg-jornada-5-entrega`
  - `cg-porta-importadora`
  - `sd-jornada-2-divulga`
  - `sd-jornada-3-vende`
  - `sd-porta-central`

## D176 — [E-commerce] Pronta para rodar: funil de ativação e jornada do lojista novo sem travas (2026-10-21)
- **Funil de ativação** no painel de administração da E-commerce (`/commerce`). Seis degraus, com a régua da prontidão da loja: criou a loja → cadastrou produto → publicou → conectou o Mercado Pago → primeira venda paga → plano pago. Mostra quantas lojas passaram por cada degrau e onde cada uma parou, com o próximo passo (`src/lib/domain/funil-ecommerce.ts`). Uma consulta por degrau, só o Master.
- **Jornada do lojista novo testada no navegador** (`e2e/ecommerce-do-zero.mjs`, 10 passos: cadastro, produto, publicar, compra do cliente, pedido pago, plano). Ela achou e corrigiu:
  1. **Categoria obrigatória** travava o primeiro produto (a loja nova não tem categorias e o navegador bloqueava sem mensagem). Em branco, agora vira "Geral".
  2. **Produto da própria loja não entrava à venda**: exigia um segundo passo escondido em "Preços e publicação", e a loja publicada aparecia vazia. Produto da loja independente cadastrado como Ativo agora já entra nela pelo preço de venda. Rascunho não entra, e o fornecedor do SuperDrop não muda (teste).
  3. **Campos da finalização da compra sem nome acessível** (só o texto de exemplo dentro da caixa). Agora têm nome e preenchimento automático do navegador.
  4. Botão **"Continuar comprando" achatado no celular**.
  5. **SuperDrop no cadastro de produto da E-commerce**: prévia do Google com superdrop.com.br, "visível às lojas" e aviso de estoque mínimo da rede.
- O teste grátis vale uma vez por documento (CPF/CNPJ): repetir o cadastro com o mesmo documento leva direto ao pagamento. Isso é proteção contra abuso, e o roteiro usa um CPF novo a cada execução.

## D177 — [E-commerce] A página promete só o que todo lojista novo recebe (2026-10-24)
- **Achado na revisão da home e dos planos contra o produto:** com a porta de entrada ligada (experimento D140), parte das lojas novas entra pelas regras da porta. Essas lojas não têm "1º mês por R$ 9,90" nem "taxa zero por 3 meses", e os dias de teste mudam. A home, os planos e o cadastro mostravam sempre a oferta clássica.
- **Decisão:** `ofertaPublica` (em `commerce-plans.ts`) promete só o garantido para todos:
  - sem porta, vale a oferta clássica;
  - com a porta para todos, valem os termos dela;
  - com a porta em experimento, só o que as duas têm em comum (os dias menores, sem 1º mês promocional nem taxa zero).

  Uma fonte só, `commercePlansView`, serve a home, os planos e o cadastro.
- As demais promessas da home foram conferidas contra o código e conferem:
  - produtos por planilha;
  - domínio próprio;
  - rastreio com mensagem pronta no WhatsApp (Pós-venda);
  - cupons, campanhas, avaliações, avise-me e equipe;
  - Mercado Pago da loja.
- Jornada do lojista novo também no celular (390 px): 10 de 10 passos. Varredura de 31 telas a 360 px sem problema. No cadastro de produto da E-commerce, os exemplos deixam de ser camisa de time ("Ex.: Blusa de linho off-white").

## D178 — [E-commerce] Loja da E-commerce aceita Pix e cartão em até 6x (2026-10-25)
- **Achado na revisão da vitrine, do produto, do carrinho e do checkout nos 7 temas grátis:**
  - a página do produto dizia "ou 6x de R$ …" e o checkout oferecia "Cartão de crédito · Até 6x sem juros";
  - mas a preferência do Mercado Pago era só Pix (D22), então o cartão nunca aparecia na hora de pagar;
  - a home e os planos da E-commerce prometem "Pix e cartão na sua conta Mercado Pago";
  - a janela rápida do produto mostrava o aviso fixo "Enviado pela Central Sports", texto do SuperDrop.
- **Decisão do dono ("Liberar cartão"):** na loja da NextLevel E-commerce, o cliente paga por Pix ou cartão de crédito em até 6x, na conta Mercado Pago do próprio lojista. Tarifas e juros do parcelamento seguem a conta dele, por isso a tela não promete "sem juros" ("Em até 6x no cartão").
- **SuperDrop continua só Pix** (D22 vale para ele). Lá o checkout deixa de mostrar a opção de cartão, que não funcionava.
- Regra única em `src/lib/pagamento-loja.ts` (`lojaAceitaCartao`, `parcelasDaLoja`, `MAX_PARCELAS_LOJA = 6`), usada pela ação de compra (preferência com `installments`), pelo checkout e pela caixa de compra. O aviso de envio só aparece quando o lojista escreve um no editor.
- Varredura `e2e/vitrine-cliente.mjs`: 7 temas a 390 e 1440 px (início, catálogo, produto, carrinho, finalizar), sem achados de acessibilidade, foto quebrada ou rolagem lateral.

## D179 — [Grupo] Equipe real da NextLevel e o CEO como rosto em todas as marcas (2026-10-27)
- **Respostas do dono:** as fotos foram feitas na sede da NextLevel Marketing, em São Paulo (local real, não montagem). Todas as pessoas que aparecem autorizaram o uso da imagem; as autorizações ficam com a empresa. Maurício Ramos dos Santos Junior, CEO da NextLevel Marketing Ltda., é o rosto de cada marca do grupo.
- **Acervo:** 17 fotos em `public/portal/nextlevel/equipe/v1/` (AVIF e WebP, conversor das páginas imersivas), avatar do CEO (96/192/384 e JPEG para e-mail) e manifesto `src/lib/marcas/equipe-imagens.ts`.
  - O texto alternativo de cada foto e o bloco por marca estão em `src/lib/marcas/equipe.ts` (`secaoEquipeDaMarca`).
  - A foto 06 do ZIP era uma tela de tutorial do Supabase e ficou fora.
  - A foto do prêmio fica só para telas internas (`SO_INTERNAS`), porque em página pública seria lida como promessa de ganho.
- **Bloco "Quem está por trás"** (`SecaoEquipe`) antes das dúvidas em cinco páginas: home da E-commerce, home do SuperDrop, home do Brás Digital Club, home da NextLevel Cargas e Soluções (site do grupo).
  - Cada marca tem foto própria e o mesmo fato dito do seu jeito ("desenvolvida e operada pela NextLevel Marketing, com equipe própria na nossa sede em São Paulo").
  - O CEO aparece com foto, nome e cargo, sem frase atribuída a ele, número ou promessa.
  - Na E-commerce o bloco traz as portas de ajuda (Loja Pronta, Migração, diagnóstico gratuito).
- **E-mail de boas-vindas da loja** assina com nome, cargo e foto do CEO e diz os dias de teste que a loja realmente recebeu (`diasDeTeste`). Antes dizia "7 dias" fixos, enquanto a oferta pública é de 3. O aviso de fim do teste deixou de fixar "7 dias" no assunto.
- **Regras com teste** (`tests/equipe-fotos.test.ts`):
  - toda foto existe e tem texto alternativo;
  - nenhuma marca usa foto interna;
  - nenhum texto do bloco tem número ou promessa;
  - nenhuma foto da equipe aparece nas lojas dos lojistas nem nos temas.
- **Próximas fases** (prompt `docs/prompts/equipe-nextlevel-fotos-vida-marcas.md`):
  - cartão de apoio na primeira tela do lojista (quando o WhatsApp ou o e-mail de suporte estiver configurado);
  - login do Master, Equipe (prêmio) e Estúdio de gravação;
  - palavra do fundador no site do grupo;
  - prévia de link (OG) com a foto do escritório.

## D180 — [E-commerce] Depois da venda: separar, enviar com rastreio e cancelar devolvendo o dinheiro (2026-10-27)
- **Achados do roteiro no navegador** (`e2e/ecommerce-pos-venda.mjs`, lojista novo com dois pedidos pagos):
  1. O pedido pago da loja independente ficava parado em "aguardando etiqueta". Os botões de separar, enviar e entregar não apareciam; só "Anexar etiqueta (PDF)", com texto do SuperDrop ("a Central imprime").
  2. Não havia onde digitar o código de rastreio.
  3. Cancelar um pedido pago não devolvia o dinheiro nem avisava o cliente.
- **Decisões (só na loja independente da E-commerce; o SuperDrop não muda, com teste):**
  - **Pagou, já pode separar.** `resolveFulfillmentStatus` ganha `etiquetaAntes`. Na loja independente a etiqueta não trava a separação, porque quem envia é o próprio lojista. Pedido antigo parado em "aguardando etiqueta" ganha o botão "Liberar para separação". O anexo de PDF some do pedido da loja independente.
  - **Marcar como enviado pede como vai e o rastreio** (`marcarEnviado`, `FORMAS_DE_ENVIO`): Correios, Jadlog, Loggi ou outra transportadora (com código obrigatório), ou entrega própria (sem código). O código é guardado em maiúsculas e sem espaços. O cliente recebe o e-mail com o código e o vê na página do pedido e em "Acompanhar pedido".
  - **Cancelar pedido pago devolve antes de cancelar:**
    - Mercado Pago: estorno pela conta da loja, com chave de idempotência por pedido. Se o Mercado Pago recusar, nada é cancelado e a mensagem diz isso.
    - Demonstração: devolução simulada.
    - Pagamento confirmado à mão: o pedido registra que o lojista deve devolver pelo mesmo meio.

    O cliente recebe o e-mail de cancelamento dizendo como o dinheiro volta (Pix para a conta, cartão como estorno na fatura). A página do pedido mostra "cancelado e valor devolvido". O diálogo de cancelar diz o valor e o que vai acontecer.
- **Testes:** `tests/pos-venda-ecommerce.test.ts` (7 casos, incluindo o SuperDrop sem mudança). `tests/independent.test.ts` passa a esperar "pronto para separar".
- **Fica para depois:** compra de etiqueta pela API da plataforma de envio e rastreio automático até "entregue" (P1b de `promessas-commerce.md`). Devolução ao cliente nos pedidos do SuperDrop (envolve o saldo da Central).

## D181 — [Grupo] Equipe e CEO em toda parte, com critério (fotos da equipe, onda 2) e canal oficial de suporte (2026-10-27)
- **Pedido do dono:** usar mais as 17 fotos reais, "explorar de diversas formas o Maurício", um texto inspirador em nome dele e o canal oficial de suporte: WhatsApp (11) 94086-2144 e sac@nextlevelgroup.com.br.
- **Canal de suporte:** `supportContacts()` usa o que estiver no Render e, sem isso, o canal oficial (`SUPORTE_PADRAO`). Passam a ter o contato todas as telas que já mostravam suporte: bloqueio, rodapés, contato e "quero minha loja". A Central de qualidade deixa de marcar o suporte como desligado.
- **Mapa único de usos** (`src/lib/marcas/equipe-usos.ts`). Cada lugar diz a foto, o texto e a legenda. Um teste garante:
  - a foto do prêmio só em telas internas;
  - legenda em toda foto pública;
  - um letreiro de parede só por página;
  - nunca os dois de um par quase igual na mesma página.

  Rodízio diário pela data, no servidor (sem piscar).
- **Novos lugares nas páginas públicas:**
  - planos da E-commerce: "Prefere que a gente monte com você?", com Loja Pronta, Migração, diagnóstico e contatos;
  - perguntas frequentes: "Não achou a sua dúvida?";
  - "quero minha loja";
  - cadastro: cartão "Dúvida no cadastro?";
  - seja fornecedor e como funciona (SuperDrop);
  - parceiros;
  - Soluções: diagnóstico com "quem olha o seu diagnóstico";
  - Loja NextLevel;
  - prévia de link do grupo e da Soluções com a foto do escritório (1200 × 630).
- **Painéis:**
  - tela de entrada do Master com a equipe, em rodízio diário entre 3 fotos;
  - Master > Equipe com a faixa "Reconhecimento" (prêmio);
  - Estúdio de gravação;
  - escritório do parceiro;
  - **recado do fundador** na primeira tela do lojista novo (E-commerce e SuperDrop), nos 14 primeiros dias e até a primeira venda paga (`mostrarBoasVindas`), com foto, assinatura e contatos.

  Nos painéis entra a versão leve da foto (480 px, de 8 a 12 KB).
- **O Maurício de várias formas:**
  - "Palavra do fundador" (texto inspirador em nome dele, sem números nem promessa de ganho e sem história pessoal inventada) na home da E-commerce e na Soluções;
  - uma frase dele, diferente por marca, no bloco "Quem está por trás" das 5 homes;
  - retrato e assinatura em todos os blocos, no cadastro, no recado ao lojista e no e-mail de boas-vindas;
  - presença na tela de entrada do Master.
- **Ficou de fora, de propósito:**
  - página "não encontrada": é a mesma das lojas dos lojistas, e a equipe nunca aparece lá;
  - listas vazias do painel: já têm ilustração própria;
  - segunda foto na home da Cargas: seria par quase igual na mesma página.
- **Testes:** `tests/equipe-usos.test.ts` (regras do mapa, textos do CEO, recado, canal de suporte), `tests/equipe-fotos.test.ts` (a equipe nunca nas lojas nem nos temas, agora cobrindo também os blocos novos) e `tests/login-marca.test.ts` atualizado.

## D182 — [E-commerce] Melhorias a partir do painel wBuy aprovadas: ondas W0 a W6 (2026-10-27)
- **Contexto:** o dono mostrou o painel wBuy em 9 lotes de capturas (`docs/referencias/wbuy-painel-notas.md`). A avaliação (`docs/prompts/racional-wbuy-ecommerce-superdrop.md`) comparou cada item com o código e ordenou as lacunas por impacto e esforço.
- **Decisão (dono: "aceito as recomendações"):** executar `docs/prompts/melhorias-wbuy-prompt-engenheiro.md` na ordem:
  - W0 confiança;
  - W1 pedido na mesa;
  - W2 medir a loja;
  - W3 recuperar e vender mais;
  - W4 migrar sem medo;
  - W5 módulos e ferramentas;
  - W6, uma peça por vez.
- **Respostas padrão, já aprovadas:**
  - o link de pagamento só aparece com o Mercado Pago conectado;
  - o carrinho abandonado começa por e-mail;
  - Pix direto e "receber na entrega" entram como baixa manual, nunca como pagamento conferido;
  - as calculadoras públicas são a de preço e margem e a de frete grátis;
  - o balcão começa com leitor do tipo teclado e sem impressora térmica;
  - a verificação em duas etapas vale primeiro para o Master (W0), e para o lojista na W6.
- **Regras:**
  - nada copiado da wBuy;
  - cada peça estende o que existe: link de pagamento = propostas; taxa = `platformFeeFor`; módulos = `entitlements`; afiliado da loja = `partners`;
  - o SuperDrop só muda com teste, e a loja de rede não ganha mudança de situação na linha.

## D183 — [E-commerce] W0 Confiança: conta da taxa aberta, economia do anual, segurança da conta e duas etapas no Master (2026-10-27)
- **O que entrou (primeira onda de D182):**
  - **"Sua taxa"** no financeiro (`src/lib/domain/taxa-transparente.ts`, `src/components/finance/sua-taxa.tsx`):
    - mostra a competência, as vendas que contam, os pedidos, a taxa até agora e quando o mês fecha;
    - mostra a conta escrita (base × percentual), o que entra e o que não entra, e os 6 meses anteriores;
    - lê a **mesma** função do fechamento (`storeOrderFeeFor`, usada por `closeStoreFees`), então o número da tela é o da fatura (teste);
    - vale para a E-commerce e para o SuperDrop (só leitura; nada muda na cobrança). Sem taxa e sem histórico, o bloco não aparece.
  - **Economia do anual em reais** para quem está no mensal (`economiaDoAnual`, com os preços do catálogo Master). "Trocar de plano" já existia.
  - **Segurança da conta** (`/account/seguranca`, no menu do usuário de todos os painéis):
    - última entrada com IP;
    - **"Sair dos outros aparelhos"**: `users.sessionVersion` entra na sessão assinada, e a versão antiga deixa de valer;
    - o aviso "um acesso por pessoa";
    - em Equipe, a última entrada de cada pessoa (o IP só para o dono da loja).
  - **Duas etapas (TOTP) para o Master:**
    - feitas com `node:crypto`, sem biblioteca nova;
    - o segredo fica só com `encryptSecret`, e os 8 códigos de recuperação ficam em hash, mostrados uma vez;
    - a entrada é em duas etapas: a senha certa gera um bilhete de 5 minutos, e a sessão só abre com o código;
    - o painel do Master mostra o aviso "Ligue a verificação" até ser ligada;
    - `MASTER_2FA_OBRIGATORIO=1` passa a exigir a ativação antes de abrir o painel. Ligar só depois que o dono ativar, para ninguém ficar trancado para fora;
    - no modo suporte, nada disso pode ser mudado pela equipe.
  - **"O que mudou"** (`src/lib/domain/novidades.ts`, `/merchant/novidades`): novidades por marca, escritas à mão, com a mais recente na primeira tela do lojista.
- **Ficou para depois, com motivo:** a **escolha do dia de vencimento** do plano. Hoje o período da assinatura é contado pela data do pagamento, e a suspensão segue o fim do período. Trocar o dia exige uma regra de cobrança proporcional (pro rata) que o dono precisa aprovar; mudar só a data da fatura deixaria a loja "em atraso" antes do vencimento.
- **Banco:** migração `0069_w0_confianca` em `users`: `last_login_ip`, `session_version` (padrão 0, então as sessões abertas antes continuam valendo), `totp_secret`, `totp_enabled_at` e `totp_recovery`.
- **Testes:**
  - `tests/w0-confianca.test.ts`: a taxa igual ao fechamento, frete e pedido não pago fora, permissões, SuperDrop igual; o anual; a versão da sessão; o vetor oficial do TOTP (RFC 6238), a recuperação de uso único e o bilhete;
  - `e2e/w0-confianca.mjs`: lojista e Master, com axe e 360 px.

## D184 — [E-commerce] W1 Pedido na mesa: passo na linha, estrela, impresso, suspeita de fraude, endereço, previsão e link de pagamento (2026-10-27)
- **Na lista de pedidos da loja independente** (`src/lib/domain/pedido-mesa.ts`, `pedido-mesa-regras.ts`, `src/components/shared/pedido-na-linha.tsx`):
  - **estrela** para achar o pedido depois;
  - marca **"impresso"**: abrir a folha de impressão ou imprimir pela gaveta marca a primeira vez;
  - selo **"suspeita"**;
  - botão do **próximo passo** na própria linha: iniciar separação, concluir separação, marcar como entregue. O envio continua pela janela que pede o rastreio (D180);
  - atalhos "Com estrela", "Não impressos" e "Com suspeita". As abas com contador já existiam.
- **Gaveta do pedido:**
  - "Suspeita de fraude", com o motivo: **segura o envio** (`advanceOrder` recusa SHIPPED) até a loja retirar a marcação. Fica no histórico;
  - a previsão de entrega;
  - "Imprimir" marca impresso.
- **Página do pedido:** "Ajustar endereço" antes do envio, com o antes e o depois no histórico. Depois de enviado, o endereço não muda.
- **Previsão de entrega:** data do pagamento + prazo do frete, em dias úteis (fim de semana e feriados nacionais de data fixa ficam fora). É gravada quando o pedido fica pago (`gravarPrevisaoDeEntrega`) e aparece para o lojista e na página do pedido do cliente. Só na loja independente.
- **Link de pagamento = propostas** (anti-duplicação):
  - na E-commerce, "Propostas" passa a se chamar **"Links de pagamento"**, com "Copiar link" e "Enviar no WhatsApp";
  - se a loja tem Mercado Pago, o cliente aceita e vai **direto pagar** (Pix ou cartão). A cobrança é criada por `iniciarPagamentoDaLoja` (`src/lib/payments/checkout-loja.ts`), que agora também serve o checkout da loja (o mesmo código, extraído). O pagamento só vale conferido na API;
  - se a cobrança falhar, o pedido é cancelado pelo sistema (o estoque volta) e a proposta reabre;
  - sem Mercado Pago, aparece o aviso para conectar (decisão 2 de D182) e o link vira pedido para combinar o pagamento, como antes;
  - limite: o link cobra os **produtos**; o frete, se houver, é combinado (a proposta não tem frete).
- **SuperDrop não muda (com teste):** a loja de rede não ganha estrela, passo na linha, atalhos nem suspeita. As ações recusam ("quem avança é a Central") e a previsão não é gravada.
- **Banco:** migração `0070_w1_pedido_na_mesa` em `orders`: `starred`, `printed_at`, `fraud_flag` e `expected_delivery_at`.
- **Testes:** `tests/w1-pedido-na-mesa.test.ts` (10) e `e2e/w1-pedido-na-mesa.mjs` (E-commerce e SuperDrop, com axe e 360 px).

## D185 — [E-commerce] W2 Medir a loja: visitas sem cookie, conversão, mais visitados e origem das vendas (2026-10-27)
- **Visitas** (`src/lib/domain/visitas.ts`, tabela `store_visits_daily`):
  - a loja publicada avisa cada página aberta por `sendBeacon` depois de carregar (`ContadorDeVisitas` no layout da loja), para `/api/v/[slug]`. A página nunca espera, e a rota sempre responde 204;
  - **sem cookie, sem IP gravado e sem dado pessoal:** só a contagem por loja, dia (Brasília), produto, origem e aparelho;
  - não contam: robôs (pelo navegador declarado), o editor de tema (página dentro de outra), a prévia e a vitrine de demonstração. Há limite de 120 avisos por minuto por endereço;
  - por isso o painel mostra **"visitas"** (páginas abertas), nunca "visitantes únicos" (isso exigiria identificar a pessoa).
- **Origem:** a campanha (`?utm_source=`) vem primeiro; senão, o site de onde a pessoa veio (Google, Instagram, Facebook, TikTok, WhatsApp…); senão, "direto". A campanha fica guardada na sessão do navegador do cliente e vai para o pedido no checkout. O pedido grava `device`, `utm_source`, `utm_medium` e `utm_campaign`.
- **Análise de vendas** ganha "Visitas da loja", que aparece mesmo antes da primeira venda:
  - visitas em 30 dias e hoje;
  - **conversão** (pedidos pagos ÷ visitas; "—" sem visitas, sem inventar número);
  - visitas por dia, **produtos mais visitados** e de onde vêm as visitas (origem e aparelho);
  - **vendas por origem e por aparelho**;
  - a explicação de como usar `?utm_source=` num link de campanha.
- **Planilha (anti-duplicação):** a exportação de pedidos já existia (`/api/store/export/pedidos`, em `privacy.ts`). Ganhou no fim as colunas origem, aparelho, rastreio, cidade e UF, sem mudar as anteriores. A cópia que tinha começado foi apagada.
- **Fica para depois:** "visitas hoje" no pulso da primeira tela (mexe na regra pura do pulso, que tem teste próprio). Por ora fica na análise.
- **SuperDrop:** as lojas de rede também passam a contar visitas e a ver o bloco na análise (só leitura; nada muda no pedido nem na cobrança).
- **Banco:** migração `0071_w2_medir_a_loja`: a tabela `store_visits_daily` e 4 colunas em `orders`.
- **Testes:** `tests/w2-medir-a-loja.test.ts` (robô, aparelho, origem, soma, resumo, outra loja não vê, conversão, vendas por origem, planilha) e `e2e/w2-medir-a-loja.mjs` (visitante pela campanha, robô não conta, análise com axe e 360 px).

## D186 — [E-commerce] W3 Recuperar e vender mais: carrinho abandonado por e-mail, compre junto e prazo de produção (2026-10-27)
- **Carrinho abandonado** (`src/lib/domain/carrinho-abandonado.ts`, tabela `abandoned_carts`):
  - no checkout da loja independente aparece a caixinha **"Se eu não terminar a compra, pode me lembrar por e-mail (no máximo 2 vezes)"**, que vem desmarcada. Só com ela marcada e o e-mail preenchido o carrinho é guardado, sem preço;
  - um carrinho aberto por e-mail e loja;
  - lembretes **1 h e 24 h** depois da última mexida, pela rotina de 5 a 10 minutos (`/api/cron/expire-reservations`, etapa "carrinhos"). Cada envio é único (`carrinho:{id}:{1|2}`);
  - os lembretes param quando o cliente compra (o checkout marca o carrinho como recuperado), quando sai da lista (link no e-mail, com um clique de confirmação para leitores de link não descadastrarem ninguém) ou depois do 2º;
  - o link **"Voltar ao carrinho"** refaz o carrinho com o **preço e o estoque de agora**. O que acabou fica de fora; a quantidade é limitada ao estoque;
  - o e-mail não tem desconto nem promessa;
  - a **análise** mostra os carrinhos guardados, lembrados e os que voltaram e pagaram (com o valor);
  - só e-mail (decisão 3 de D182). O SuperDrop não guarda nem lembra (teste).
- **Compre junto:** em cada produto da loja independente, a caixa "Compre junto e prazo de produção" escolhe até 4 produtos da própria loja (`store_products.related_ids`). A seção "Produtos relacionados" da página do produto mostra os escolhidos primeiro e completa com os da mesma categoria, como antes. Fica fora do editor de produto compartilhado com o fornecedor do SuperDrop.
- **Prazo de produção** (`store_products.production_days`, 0 a 60): somado ao prazo do frete na previsão de entrega (D184), pelo item mais demorado do pedido.
- **Ficou para a próxima rodada, com motivo:**
  - **vender sem estoque (encomenda):** mexe na reserva e na baixa do estoque, que o SuperDrop também usa;
  - **personalização (nome e número)** e **embalagem para presente:** mexem no cálculo do preço do pedido e na cobrança do Mercado Pago;
  - os três pedem uma rodada própria com testes de preço e estoque;
  - o **desconto automático do "compre junto"** também fica para depois (usa o motor de descontos).
- **Banco:** migrações `0072_w3_carrinho_abandonado` (tabela) e `0073_w3_compre_junto` (2 colunas em `store_products`).
- **Testes:** `tests/w3-vender-mais.test.ts` (consentimento, loja de rede, um carrinho por e-mail, 1 h e 24 h, para ao comprar, sair da lista, preço de agora, resumo; compre junto da própria loja, no máximo 4, ordem na página; prazo de produção na previsão).

## D187 — [E-commerce] W4 Migrar sem medo: endereços antigos, Google Shopping, Pixel da Meta e loja em lançamento (2026-10-27)
- **Nova tela "Migrar e anunciar"** (`/merchant/migrar`, menu Marketing), só na loja independente. A regra fica em `src/lib/domain/migrar.ts`.
- **Endereços antigos (redirecionamento permanente):**
  - o lojista cola "endereço antigo;endereço novo" (vírgula, ponto e vírgula ou tabulação; até 5.000 linhas);
  - o caminho é limpo: sem domínio, sem `?` e sem `#`, em minúsculas;
  - são recusados: destino em outro site, laço (A→B e B→A) e origem que é página da loja (checkout, carrinho, pedido…);
  - quem abre um endereço que a loja não tem cai na rota `src/app/store/[slug]/[...resto]`: com redirecionamento cadastrado, vai para o novo com **308** (permanente; o Google trata como 301) e o uso é contado; senão, "não encontrada", como antes;
  - tabela `store_redirects`.
- **Google Shopping:**
  - `/store/[slug]/feed.xml` no formato do Merchant Center (`feedGoogle`, função pura);
  - traz os produtos ativos, preço em reais, disponível ou esgotado, imagem, link e a marca da loja;
  - loja não publicada, de demonstração ou em lançamento não lista;
  - o endereço aparece na tela para copiar.
- **Pixel da Meta:**
  - número do pixel (público) e token da API de conversões, **só criptografado** (`encryptSecret`). O token nunca volta para a tela; apagar o número desliga tudo;
  - na loja publicada: página vista, produto visto, item no carrinho e compra na página do pedido pago, com `eventID` = número do pedido;
  - no servidor, **só depois do pagamento conferido no Mercado Pago** (`markCustomerPaidBySystem`), `enviarCompraMeta` avisa a compra com o mesmo `event_id` (a Meta junta e não conta duas vezes) e o e-mail só em resumo SHA-256. Nunca lança;
  - os dados da loja que vão ao navegador continuam sem segredo (as seções recebem só nome, logo e WhatsApp).
- **Loja em lançamento:**
  - com a chave ligada (`stores.launch_mode`), o público vê "{loja} abre em breve" com a **lista de espera** (só com a caixinha marcada, sem repetir o e-mail; tabela `store_waitlist`);
  - o dono e a equipe NextLevel veem a loja normal com o aviso;
  - o checkout recusa compra do público, e visitas e Pixel não contam a página de espera;
  - a lista aparece na tela do lojista.
- **Ficou para depois:** avisar a lista de espera por e-mail quando a loja abrir (envio em massa: precisa da decisão sobre volume e remetente).
- **SuperDrop:** nada muda. As ações recusam ("Disponível na loja da NextLevel E-commerce"); o feed, o Pixel e o lançamento ficam desligados por padrão.
- **Banco:** migração `0074_w4_migrar_sem_medo`: `store_redirects`, `store_waitlist` e 3 colunas em `stores`.
- **Testes:** `tests/w4-migrar.test.ts` (6) e `e2e/w34-vender-e-migrar.mjs` (com a W3).

## D188 — [E-commerce] W5 Ferramentas e central de aplicativos, e W6a duas etapas para o lojista (2026-10-27)
- **Calculadoras** (`src/lib/ferramentas/calculadoras.ts`, funções puras em centavos e pontos-base; tela em `src/components/ferramentas/calculadoras.tsx`):
  - preço com margem (recusa quando taxas + margem passam de 100%);
  - simulador de promoção (o lucro por peça antes e depois, e as vendas necessárias para manter o lucro; nula quando o desconto zera o lucro);
  - parcelado sem juros, frete grátis a partir de, ponto de equilíbrio, e retorno do anúncio (ROAS e custo por cliente);
  - todas "calculam com os números que você digitar", sem promessa.
- **Onde aparecem:** no painel, em `/merchant/ferramentas`; na **página pública** `/ferramentas`, só preço com margem e frete grátis (decisão 5 de D182), com convite "Quero minha loja" e a marca do endereço.
- **Calendário do varejo:** datas fixas e móveis (Mães, Pais, Black Friday) calculadas por ano, com "preparar a partir de". As próximas 6 aparecem nas ferramentas.
- **Central de aplicativos** (`/merchant/aplicativos`, `src/lib/domain/aplicativos.ts`):
  - mostra tudo o que a loja tem, por categoria, com o estado real (ligado ou desligado, lido da loja) e o link para configurar;
  - o que ainda não existe (Pix direto, receber na entrega, balcão, API, afiliados da loja) aparece como **"Em breve"**, sem link e nunca como disponível;
  - **ligar e desligar por plano (`entitlements`) fica para depois:** hoje nenhum desses recursos é cobrado à parte, e trancar algo que o lojista já usa mudaria o combinado;
  - **Pix direto e receber na entrega** ficam para uma rodada própria: mexem no pagamento e na baixa manual, e precisam de teste de dinheiro.
- **"O que mudou"** ganha as novidades das ondas W1 a W5.
- **W6a, duas etapas para o lojista:** `podeUsarDuasEtapas` passa a valer também para STORE_OWNER (dono e equipe da loja). É opcional; a mesma tela de Segurança da conta e a mesma entrada em duas etapas da W0. O fornecedor ainda não tem.
- **Menu:** Gestão ganha "Ferramentas" e "Aplicativos"; Marketing ganhou "Migrar e anunciar" (D187).
- **Testes:**
  - `tests/w5-ferramentas.test.ts`: contas, casos impossíveis, datas móveis de 2026 e 2027, central honesta e novidades por marca;
  - `tests/w0-confianca.test.ts`: o lojista agora liga as duas etapas; o fornecedor, não;
  - `e2e/w5-ferramentas.mjs` (página pública reagindo ao que se digita, ferramentas, aplicativos, com axe e 360 px) e `e2e/w0-confianca.mjs` atualizado.

## D189 — [E-commerce] Rodada A das integrações: Google, TikTok, Pinterest, catálogos, chat, loja no celular e maioridade (2026-10-27)
- **Origem:** a fila `docs/prompts/integracoes-aplicativos-fila.md` (I-01 a I-11, nível 1, só configuração).
- **Regra de segurança:** o lojista **nunca cola script**. Cada serviço tem campo próprio que aceita só o formato do código do parceiro (validado na tela e no servidor, `src/lib/domain/integracoes-regras.ts`); da meta tag do Google e do endereço do Tawk/Jivo tiramos só o código. O script que vai para a loja é o oficial, escrito por nós (`src/components/storefront/integracoes-loja.tsx`).
- **Onde fica:** coluna `stores.integrations` (jsonb, padrão `{}`), migração `0075_rodada_a_integracoes`. Só códigos públicos; nenhum segredo.
- **O que entrou:**
  - **Google Analytics 4, Google Ads e Tag Manager:** gtag.js e GTM na loja publicada; página vista a cada troca de página, produto visto, item no carrinho e compra;
  - **Google Search Console:** a meta de verificação no `<head>` da loja (só o código);
  - **Pixel do TikTok e tag do Pinterest:** mesmo padrão do Pixel da Meta (página, produto, carrinho e compra);
  - **compra:** contada só na página do pedido **pago pelo Mercado Pago**, junto com a da Meta (mesmo número de pedido), e para o Google Ads com o rótulo da conversão quando há;
  - **catálogos do Instagram/Facebook e do TikTok:** o mesmo `feed.xml` do Google Shopping (o formato é aceito pelos três), com o passo a passo na tela;
  - **chat ao vivo:** lista fechada (Tawk.to ou JivoChat);
  - **loja instalável no celular:** `/store/{loja}/manifest.webmanifest` e ícone com as iniciais na cor da loja (`icone.svg`), além do logo quando há; só com a chave ligada;
  - **confirmação de 18 anos:** janela na primeira visita, resposta guardada só no navegador; quem responde "não" não vê a loja.
- **Nada carrega** na prévia do editor, na loja de demonstração dos temas, na página de espera do lançamento nem para loja não publicada (mesma regra do Pixel, variável `publico`).
- **Tela:** "Migrar e anunciar" ganha a seção "Google, TikTok, Pinterest, chat e celular" e o catálogo vira "Google, Instagram e TikTok". A central de aplicativos acende um cartão por integração.
- **SuperDrop:** nada muda. A ação recusa ("Disponível na loja da NextLevel E-commerce") e a coluna fica vazia.
- **Testes:** `tests/rodada-a-integracoes.test.ts` (7) e `e2e/rodada-a-integracoes.mjs`.

## D190 — [E-commerce] Rodada B das integrações: frete pela Frenet, Kangu e Correios com contrato (2026-10-27)
- **Origem:** a fila `docs/prompts/integracoes-aplicativos-fila.md` (I-12, I-13 e I-15). A Jadlog direta (I-14) fica para quando um lojista pedir: a Frenet e a Kangu já cotam a Jadlog.
- **Mesmo padrão das plataformas que já existiam** (SuperFrete, Melhor Envio, Onlog, `src/lib/shipping/`): o lojista conecta em Configurações → Frete e entrega, a conexão é conferida na própria plataforma e a credencial fica só criptografada (`encryptSecret`). O checkout cota por CEP; se a plataforma falhar, vale a tabela da loja.
- **Frenet:** cabeçalho `token`; verificação em `/shipping/info`; cotação em `/shipping/quote` (várias transportadoras de uma vez).
- **Kangu:** cabeçalho `token`; a verificação é uma cotação pequena (a Kangu não tem consulta de conta); cotação em `/tms/transporte/simular`.
- **Correios com contrato:** usuário do Meu Correios, código de acesso às APIs e cartão de postagem, guardados juntos e criptografados no mesmo campo do token. A cada cotação pedimos o token de uso (`/token/v1/autentica/cartaopostagem`) e cotamos SEDEX (03220) e PAC (03298) de contrato, com preço e prazo. A pré-postagem (etiqueta pelos Correios) fica para depois.
- **PRECISA VALIDAR com conta real** de cada plataforma: os formatos seguem a documentação pública; as bases podem ser trocadas por `SHIPPING_FRENET_BASE`, `SHIPPING_KANGU_BASE` e `SHIPPING_CORREIOS_BASE`.
- **Só a E-commerce:** as três aparecem só na loja independente da E-commerce e a ação recusa as outras ("Disponível na loja da NextLevel E-commerce"). O fornecedor do SuperDrop continua vendo só SuperFrete, Melhor Envio e Onlog.
- **Testes:** `tests/rodada-b-frete.test.ts` (6, com respostas simuladas). Por pedido do dono, sem roteiro de navegador nesta rodada (tela pequena, mesmo componente já conferido).

## D191 — [E-commerce] Rodada C das integrações: ERP leve (Tiny / Olist ERP e Omie) (2026-10-27)
- **Origem:** a fila `docs/prompts/integracoes-aplicativos-fila.md` (I-16 e I-17).
- **"Envio de pedido pago para fora" (base para a API da W6c):** não mexemos no fluxo do pedido. O pagamento aprovado já grava o evento interno `PAYMENT_APPROVED` (idempotente); a rotina lê esses eventos das lojas com ERP, desde a hora da conexão, e cria uma linha em `erp_envios` (única por pedido e ERP). A fila manda até 20 por rodada, espera 5, 10, 20 e 40 minutos entre tentativas (até 5) e para na hora se o ERP recusar a credencial. O lojista vê os últimos envios e pode mandar de novo um que deu erro.
- **Estoque:** a cada 15 minutos lemos os saldos do ERP e, por **SKU igual nos dois lados**, o disponível na loja passa a ser o saldo do ERP (o reservado da loja fica como está; o ajuste fica no histórico de estoque como "Estoque do ERP"). Produto sem SKU igual não muda.
- **Tiny (API v2):** token; `info.php` para conferir, `pedido.incluir.php` e `lista.atualizacoes.estoque.php` (o Tiny só lista mudanças dos últimos 30 dias).
- **Omie:** app key e app secret (guardados juntos e criptografados); `ListarEmpresas` para conferir, `UpsertCliente` pelo e-mail e `IncluirPedido` (etapa 10), `ListarPosEstoque` para o estoque.
- **Onde roda:** etapa "erp" do cron `/api/cron/expire-reservations` (o mesmo dos lembretes de carrinho; precisa estar agendado no Render).
- **Tela:** `/merchant/erp` (a partir da central de aplicativos, cartões "Tiny" e "Omie").
- **PRECISA VALIDAR com conta real:** os formatos seguem a documentação pública (bases trocáveis por `ERP_TINY_BASE` e `ERP_OMIE_BASE`). No Omie, conta corrente, categoria e dados fiscais do pedido podem precisar de ajuste por conta.
- **Só a E-commerce:** as ações recusam outras lojas. O SuperDrop não muda.
- **Banco:** migração `0076_rodada_c_erp` (tabela `erp_envios` e 5 colunas em `stores`).
- **Testes:** `tests/rodada-c-erp.test.ts` (4, com Tiny falso). Por pedido do dono, só os testes necessários e sem roteiro de navegador.

## D192 — [E-commerce] Integrações nas páginas públicas como argumento de venda (2026-10-28)
- **Fonte única:** `src/lib/marcas/integracoes-publicas.ts` lista só o que já existe (D187 a D191), em 7 grupos (receber, entregar, anunciar e medir, catálogos, gestão, atender, mudar de plataforma). Sem logos de terceiros: o nome do serviço é texto.
- **Onde aparece:** faixa "Conecta com o que você já usa" na home da E-commerce (depois das lojas de exemplo), página `/integracoes` (o que cada uma faz e o que o lojista precisa para ligar) e item "Integrações" no menu, no lugar de "Personalização" (a personalização continua na home).
- **Perguntas frequentes:** a resposta "O que está disponível hoje?" estava desatualizada (dizia que carrinho abandonado e ERP não existiam). Agora diz que só marketplace e API ainda não fazem parte, e há uma pergunta nova "Com quais serviços a loja se integra?".
- **Atenção:** Frenet, Kangu, Correios com contrato, Tiny e Omie ainda não foram conferidos com conta real (D190, D191).

## D193 — [Todas] Assinatura de movimento "Subida" (2026-10-28)
- **Pedido do dono:** uma transição moderna e própria entre páginas, nos painéis e nas páginas públicas, e também na entrada de dados.
- **O gesto:** as coisas sobem um degrau quando chegam, e uma linha na cor da marca corre quando algo está em andamento ou foi confirmado. Tudo nativo, em `src/design-system/movimento.css`, mais `src/components/transicao-de-pagina.tsx`, sem biblioteca.
- **Onde:**
  - troca de página pela View Transitions API (`<ViewTransition>` do React, com o endereço como chave; atualizar a mesma página não anima) na casca pública, na dos painéis e na loja;
  - linha de progresso no topo a partir do clique;
  - "degraus" no lugar da rodinha de carregamento (botões, envio de imagem, editor de tema, barra de salvar);
  - linha da marca correndo por baixo do campo focado;
  - imagem enviada que sobe;
  - aviso de "salvo" com a linha.
- **Na loja do lojista** a cor do movimento é a da loja (`--sf-primary`).
- **Movimento reduzido:** nada anima. **Sem suporte do navegador:** a página troca normal.

**Decisões do dono sobre a IA (Maurício v3, `docs/prompts/mauricio-ia-v3-padrao-hostinger.md`):** Maurício completo só no plano Scale; o Pro libera as ferramentas de texto; o nome é "Maurício" em todas as marcas.

## D194 — [E-commerce] Maurício, fase IA0: visual pronto e bloqueado, no padrão de painel da Hostinger (2026-10-28)
- **Base:** `docs/prompts/mauricio-ia-v3-padrao-hostinger.md`, mais a referência técnica do dono (caderno de prompts e o PDF com os prints REF-001 a REF-026, só para uso interno: tem dados da conta).
- **Decisões do dono:** Maurício completo só no Scale; o Pro libera as ferramentas de texto; o nome é "Maurício"; tudo visível, com o que o plano não inclui bloqueado.
- **O que entrou:**
  - botão flutuante e conversa lateral (`<dialog>`, Ctrl+J, Esc, foco devolvido) na loja independente da E-commerce e para o dono no Master, com sugestões e o exemplo gravado de cada ferramenta;
  - central `/merchant/ia` com 9 ferramentas em cartões (escrever, analisar, fazer por você), selo do plano mínimo ou "em breve";
  - Master `/master/ia`:
    - chave da OpenAI só criptografada (só o final aparece) e "Testar conexão" (lista de modelos, sem custo de uso);
    - "mostrar" e "uso real" (o uso real só liga com a chave testada);
    - plano mínimo por grupo, modelos e cotas;
    - prévia de como as lojas veem;
  - faixa "Maurício, a IA da sua loja" na home da E-commerce, com rótulo Beta e exemplo gravado.
- **Nenhuma chamada à IA nesta fase** (só o teste de conexão pedido pelo dono). Configuração em `platform_settings` (chave `ia`).
- **SuperDrop e fornecedor:** sem mudança.
- **Movimento (D193, ajuste):** a pedido do dono, o logo com o arco aparece em toda troca de página, no mínimo 0,42 s, e some subindo junto com a página nova. A página nova entra na hora, sem quadro vazio.
- **Testes:** `tests/ia0-mauricio.test.ts` (2).
- **Nome (decisão do dono, 2026-10-28):** "Pede pro Maurício" no menu e no botão; "Conta com o Maurício" como título da faixa na home; na conversa, "Maurício". Evitar "Mau"/"Mau Mau" ("mau" = ruim) e "Maurício (IA)".

## D195 — [E-commerce] Vendedor 24h na home: "Pede pro Maurício" (2026-10-29)
- **Pedido do dono:** a IA como vendedor ativo 24h nas páginas públicas, para converter visitante em cliente. Três frentes com pegadas diferentes (público, painel, loja), em `docs/prompts/mauricio-ia-v3-padrao-hostinger.md` seção 12.
- **Como é:**
  - cápsula "Pede pro Maurício: qual plano é o melhor para a minha loja?" no rodapé da tela (padrão REF-001), que se fecha na visita;
  - conversa lateral (padrão REF-010) com o selo "Online agora", a oferta de entrada, atalhos e campo livre.
- **Funciona sem IA:** motor guiado com dados reais:
  - plano recomendado pelo custo (mensalidade + taxa) para a faixa de vendas;
  - preços e oferta do Master;
  - integrações da fonte única (D192) e temas;
  - entende o assunto da pergunta livre e, se não entende, mostra os assuntos e oferece o contato.
- **Com IA ligada no Master:** a pergunta livre vai ao modelo econômico com os mesmos fatos e regras (sem preço inventado, sem promessa de ganho, máximo 4 frases), com limite de 30 perguntas por hora por endereço.
- **Conversão:**
  - "Criar minha loja com este plano" leva ao cadastro com o plano escolhido;
  - "Quero que a equipe me chame" cria o lead no CRM (`createBrandLead`) com o resumo das perguntas.
- **Testes:** `tests/vendedor-publico.test.ts` (3).

## D196 — [Todas] Maurício como coluna integrada ao site, não janela por cima (2026-10-29)
- **Pedido do dono (prints do painel da referência):** a conversa fica ao lado do conteúdo, como parte do site, e não como uma janela por cima.
- **Como ficou:** no computador (1100 px ou mais), a coluna de 420 px fica à direita e a página encolhe ao lado e continua usável. Não há fundo escuro e Esc fecha. No painel, a coluna continua aberta ao trocar de página (lembrada na sessão). No celular e no tablet, ocupa a tela inteira.
- Vale para o vendedor da home (D195) e para o Maurício dos painéis (D194).

## D197 — [Todas] Central da IA no Master: conversas ao vivo, coleta de contato e equipe assumindo o chat (2026-10-29)
- **Pedido do dono:** coletar dados do cliente logo no começo, jogar num CRM nosso para atender rápido pelo nosso chat além da IA, mostrar com o tempo que dá para chamar a equipe no WhatsApp, e um CRM para acompanhar em tempo real.
- **Conversa no servidor:** tabelas `ia_conversas` e `ia_mensagens` (migração 0077).
  - O visitante é identificado só por um token aleatório da conversa (guardamos o hash), sem cookie de rastreio.
  - Ficam registradas a página e a origem (utm).
  - O interesse e a faixa de faturamento saem das escolhas no chat.
- **Coleta rápida:**
  - logo depois da primeira resposta, o Maurício pede nome e WhatsApp (e-mail opcional), com "Agora não";
  - se a pessoa dispensar, o pedido volta uma vez depois de 3 mensagens;
  - com e-mail, também vira interessado no CRM da marca (`brand_leads`).
- **Canto do WhatsApp:** a partir da 2ª mensagem aparece "Prefere falar com uma pessoa? Chame a nossa equipe no WhatsApp", já com o código da conversa.
- **Central da IA (`/master/ia`):**
  - números do momento: abertas, com a equipe, conversas e contatos do dia, ganhas;
  - lista ao vivo (a cada 5 s) com filtros;
  - conversa aberta atualizando a cada 3 s;
  - "Assumir conversa": o Maurício pausa e a equipe responde no próprio chat do site, aparecendo como "Nome · equipe NextLevel";
  - "Devolver ao Maurício";
  - notas, ganha ou perdida, e WhatsApp a um clique;
  - os ajustes, a chave e os planos foram para a aba `/master/ia/ajustes`.
- **Permissão:** dono e funções Comercial e Suporte do Master.
- **Testes:** `tests/ia-conversas.test.ts`.

## D198 — [Master/E-commerce] Capa no padrão de painel maduro (Master) e home da E-commerce no padrão de herói de oferta (2026-10-29)
- **Pedido do dono:** "o roxo vai só para o Master e para a marca-mãe NextLevel"; "assumo os riscos de cópia"; "os planos continuam os mesmos, só o visual muda". Referências: prints PNL-001 a PNL-014 e REF-001 a REF-009 (uso interno, fora do repositório).
- **Cor:** o tema `nextlevel` (Master e site da marca-mãe) passa ao roxo da capa (`CAPA` em `src/lib/marcas/nextlevel.ts`): ação `#673DE6`, link `#5025D1`, área gelo `#F5F5F7`, menu `#E9E9EC`; no escuro, `#101011`/`#19191B` com ação `#8C85FF`. A paleta de marca `NEXTLEVEL` acompanha. As marcas-filhas não mudam (teste em `tests/nextlevel-marca.test.tsx`).
- **Casca (Master):** `OperationalShell` ganhou `faixa` (opcional). Com ela:
  - a barra superior vira a **faixa do ecossistema** (degradê escuro derivado da cor de ação do tema): "Indique e ganhe" à esquerda, a novidade do momento no centro, busca, botão **Agente** (abre o Maurício), avisos e conta à direita;
  - menu e área de trabalho formam uma **moldura com cantos de 28 px** sobre o fundo escuro; item ativo em **cápsula branca**;
  - **conta em popover** (330 px) com o tema claro/escuro/sistema dentro;
  - o botão flutuante do Maurício some (abria por cima de botões no canto); o painel encaixa abaixo da faixa.
  - Hoje só o Master usa (`capa` em `role-layout.tsx`). As outras marcas podem ligar depois: a faixa já pega a cor de cada tema.
- **Home E-commerce (azul da marca):** herói marinho com título enorme centralizado e a oferta num selo inclinado, preço "a partir de" calculado do catálogo (anual ÷ 12), botão branco e garantia; fotos do acervo flutuando com avisos de pedido marcados como demonstração. Logo abaixo, **planos em faixa escura** (mesmo componente e mesmos preços, ilha `.ds-tema-escuro`) e a **galeria de ofertas** (as quatro portas, cartão que se abre no mouse/foco). O restante da página segue.
- **Correção junto:** "taxa zero por 0 meses" deixava de fazer sentido quando a oferta não tem carência de taxa; agora só aparece com meses > 0. `movimento.css` deixou de ter cores fixas (o teste do núcleo do design system acusava).

## D199 — [Todas] Começar do zero: apagar contas e vendas fictícias da produção (2026-10-29)
- **Pedido do dono:** "não existem clientes reais em nenhuma das marcas; pode apagar contas e vendas fictícias; vamos começar tudo do zero".
- **Como:** `src/db/recomecar.ts` (`recomecarDoZero`), chamado pelo boot (`scripts/bootstrap.ts`) quando o Render tem `RECOMECAR_DO_ZERO=<código>`. Roda **uma vez por código** (marca `recomeco.aplicado` em `platform_settings`).
- **Apaga:** contas, lojas, fornecedores, pedidos, parceiros, conversas, interessados, Brás, Cargas e Club.
- **Mantém:**
  - usuários Master reais (sem `.demo`) e a organização deles;
  - temas, planos, catálogo e preços do Master, ofertas, regras de comissão, experimentos, serviços e produtos digitais;
  - vídeos da Brás e `platform_settings` (chave da IA, conexões).
- **Lojas de demonstração dos temas:** voltam no mesmo boot, porque são a vitrine de cada tema.
- **Trava:** tudo numa transação. Se não houver Master real, ou se algo mantido depender do que vai sair, nada é apagado.
- **Ensaio:** banco de demonstração com 68 usuários, 32 lojas e 194 pedidos ficou com 1 Master, 0 pedidos e as 26 lojas-vitrine dos temas.
- **O ambiente de gravação** (`nextlevel-demo`, banco em memória) continua com os dados de demonstração, que é o papel dele.

## D200 — [E-commerce] Master trancado na E-commerce, situação comercial única e a tela "Agora" (2026-10-29)
- **Pedido do dono:** "vamos trancar as marcas e falar só da E-commerce"; ordem F0 → F2 → F4 → F3 → F1 → F5 → F6 do prompt `docs/prompts/master-ecommerce-escritorio-comercial.md`; poucos testes agora.
- **Marcas trancadas:** `marcasAtivasNoMaster()` (`src/lib/master-marca.ts`).
  - O padrão é só `NEXTLEVEL_COMMERCE`. Para destravar, coloque `MASTER_MARCAS_ATIVAS=NEXTLEVEL_COMMERCE,SUPERDROP` no Render.
  - Com uma marca só, o seletor "Vendo:" some e o Master fica nela.
  - Equipe, configurações, IA e erros continuam no menu. Nada foi apagado e o SuperDrop não muda.
- **Situação comercial única** (`src/lib/domain/situacao-comercial.ts`):
  - O contrato (`nl_subscriptions`) manda.
  - O acesso dado à mão sem contrato aparece como "cortesia" (não conta como pagante).
  - O console E-commerce passou a usar essa regra: "Pagantes", "Receita mensal" (anual ÷ 12) e a coluna "Situação" das lojas. Isso acaba com o "2 assinantes" contra "0 pagantes".
- **"Agora"** (`/master/agora`, primeira tela do Master):
  - **Fila por urgência:** conversa esperando (amarela em 5 min, vermelha em 15) > interessado novo > cadastro novo > teste acabando em até 3 dias > ativação parada há mais de 2 dias > pagamento pendente > primeira venda.
  - **Ações:** WhatsApp com mensagem pronta (`wa.me`, sem integração) e link para a conversa (`/master/ia?c=`) ou para a loja.
  - **Números e meta:** conversas, novos em 24 h, em teste, pagantes contra a meta (`platform_settings.comercial.metaPagantes`, padrão 10) e receita mensal, mais o funil.
  - **Ao vivo:** a tela atualiza sozinha a cada 15 s.
- Código: `src/lib/domain/agora-ecommerce.ts`, `src/app/master/agora/page.tsx`, `src/components/master/ao-vivo.tsx`.

## D201 — [E-commerce] Ajuda do lojista dentro do painel e caixa de atendimento única no Master (2026-10-29)
- **Pedido do dono:** "logo vão aparecer clientes reais: como facilitar esse suporte?" (fase F4 do prompt do escritório comercial).
- **Lojista:** botão **Ajuda** na barra do topo do painel da E-commerce.
  - Abre uma coluna de conversa com a equipe e mostra o aviso de horário (seg a sex, 9h–18h).
  - O "Urgente? WhatsApp" continua como saída.
  - Atualiza a cada 4 s enquanto está aberta.
  - O lojista só vê a conversa da própria loja (`src/lib/domain/ajuda-lojista.ts`, `src/app/actions/ajuda.ts`, `src/components/ajuda/ajuda-lojista.tsx`).
- **Mesma tabela, sem duplicar:** `ia_conversas` com `canal: PAINEL` e o novo `store_id` (migração `0078`). A conversa já nasce com o nome da loja e do lojista, o e-mail e o WhatsApp da loja.
- **Master:**
  - "Central da IA" passou a se chamar **Atendimento** e subiu no menu, logo abaixo de "Agora".
  - Filtros novos: "Visitantes do site" e "Lojistas (Ajuda)"; as conversas de lojista aparecem com o selo "Lojista".
  - Na conversa de lojista não aparece "Devolver ao Maurício".
  - Mensagem nova de lojista entra na fila "Agora" como "Conversa esperando", com o relógio de espera.
- `next.config.ts`: `allowedDevOrigins: ["*.test"]`, só para o modo de desenvolvimento local com os endereços de teste das marcas.

## D202 — [E-commerce] Comercial: funil único do contato ao pagante e ficha 360 (2026-10-29)
- **Pedido do dono:** "um CRM ao vivo e turbo para trazer muitos clientes rápido" (fase F3).
- **`/master/comercial`:** junta numa pessoa só, sem duplicar (mesmo e-mail ou WhatsApp), três origens:
  - interessados do formulário (`brand_leads`);
  - conversas do site com contato (`ia_conversas`, canal HOME);
  - lojas criadas.
- **Etapas que andam sozinhas** pelo que a pessoa faz no sistema: Contato → Conta criada → Ativando → Vendendo → Pagante → Em risco → Perdido. Ficam em quadro por etapa ou em lista com os mais quentes primeiro.
- **Temperatura** de 1 a 3 chamas, com regra simples e explicável: faturamento informado, etapa avançada e conversa nos últimos 2 dias.
- **Ficha 360** (`/master/comercial/[chave]`):
  - contato e situação de pagamento (fonte única D200);
  - linha do tempo única: conversa com o Maurício, formulário, marcos e pedidos da loja, Ajuda do lojista e notas;
  - WhatsApp com mensagem pronta, "Abrir conversa" e "Ver como lojista";
  - responsável ("Assumir este cliente"), próxima ação com prazo, notas e "Marcar como perdido".
- **Tabela nova:** `crm_acompanhamento` (chave `loja:`/`interessado:`/`conversa:`), migração `0079`. Permissão: dono e funções Comercial e Suporte.

## D203 — [E-commerce] Menu do Master em 7 áreas e uma casca só (2026-10-29)
- **Fase F1.** Com o Master trancado na E-commerce, o menu passa a ter:
  - **Escritório:** Agora, Atendimento, Comercial, Lojistas, Receita, Crescimento, Sistema;
  - **Ferramentas** (o que não é do dia a dia): ver como cliente, pedidos das lojas, produtos publicados, funil de ativação, financeiro, planos e recursos, templates, Loja NextLevel, equipe, erros e qualidade.
- **Uma casca só:** o console `/commerce` deixou de trocar o menu inteiro (o antigo "Voltar ao Master"); usa o mesmo menu do Master.
- **Nada foi apagado:** as telas antigas continuam no endereço de sempre. Com mais de uma marca aberta, volta o menu anterior.
- Código: `MASTER_ECOMMERCE_NAV` em `src/lib/nav.ts`, escolha em `role-layout.tsx`.

## D204 — [E-commerce] Receita e Crescimento: telas de resumo (2026-10-29)
- **Fases F5 e F6.**
- **Receita (`/master/receita`):**
  - números: receita mensal (planos ativos, anual ÷ 12), recebido no mês, pagantes, em risco (vencido ou aguardando) e canceladas, todos pela regra única D200;
  - lista das assinaturas com o que precisa de ação primeiro (situação, plano, valor por mês, vencimento e última cobrança);
  - atalhos para contratos, "o que cada plano libera", serviços da Loja NextLevel e o financeiro completo.
- **Crescimento (`/master/crescimento`):** num lugar só, parceiros, ofertas e preços, Maurício vendedor (ajustes), temas e a página pública.
- **Faixa do topo:** a novidade passou a ser "Atendimento ao vivo: visitantes do site e lojistas numa caixa só".
- **Funções da equipe** (`master-equipe.ts`):
  - Comercial e Suporte passam a ver Agora, Atendimento e Comercial;
  - Comercial também vê Crescimento;
  - Financeiro vê Receita.

## D205 — [E-commerce] Aviso sonoro, mensagens editáveis e telas antigas levando às áreas novas (2026-10-29)
- **Pedido do dono:** "pode continuar" (os três pontos que faltavam no escritório comercial).
- **Aviso de conversa nova** (`src/components/master/aviso-sonoro.tsx`):
  - a cada 15 s o Master confere quantas conversas esperam resposta (`pulsoAtendimento`);
  - quando o número sobe, toca a "Subida" (três notas curtas pelo próprio navegador, sem arquivo), mostra um aviso com "Responder", atualiza a tela e põe o número no título da aba ("(2) NextLevel");
  - um botão de alto-falante na faixa do topo liga e desliga o som (guardado no navegador de cada pessoa).
- **Ajustes do Comercial** (`/master/comercial/ajustes`, `src/lib/domain/comercial-config.ts`):
  - itens editáveis: meta de pagantes, minutos de espera para o amarelo e o vermelho, e as 6 mensagens prontas de WhatsApp com `{nome}`, `{loja}`, `{dias}` e `{passo}`;
  - ficam em `platform_settings.comercial`, com os textos padrão quando não há ajuste;
  - só o dono e a função Comercial alteram.
- **Telas antigas:** com só a E-commerce aberta, elas levam direto para a área nova (`levarAoEscritorio` em `brand-server.ts`):

  | Tela antiga | Leva para |
  |---|---|
  | interessados (`/commerce/leads`, CRM aba interessados) | Comercial |
  | `/master/stores` | Lojistas |
  | `/master/orders` | pedidos das lojas da E-commerce |
  | escritório virtual e `/master/plans` | Receita |
  | mapa, torre e página da marca | Agora |

  Com mais marcas abertas, cada tela volta a abrir normalmente. Nada foi apagado.

## D206 — [E-commerce] IA em modo manual nas três esferas e atendimento que cai no CRM certo (2026-10-29)
- **Pedido do dono:**
  - "no celular está dando bug o menu e a IA trata como se fosse lojista, mas é o Master";
  - "a IA precisa funcionar offline como um grande manual vivo do sistema, com passo a passo";
  - "o racional é diferente entre Master, usuário e cliente do usuário";
  - "no Master o usuário cai no meu CRM; no usuário o cliente final cai no CRM dele".
- **Menu do celular:** a gaveta herdava a regra que esconde o menu fixo no celular e abria em branco. Corrigido em `core.css`.
- **Manual vivo** (`src/lib/ia/manual.ts`):
  - guias passo a passo por esfera: Master (13), lojista (16) e comprador (6);
  - busca por palavras, sem acento, ignorando palavras genéricas e reconhecendo a mesma raiz ("recebendo" e "receber");
  - funciona sem chave de IA. Quando a chave for ligada, estes textos viram a fonte da verdade do modelo.
- **Maurício no Master** (botão Agente):
  - responde como operar o escritório (Agora, Atendimento, Comercial, Receita, ligar a IA, equipe, ofertas…), com o botão que leva à tela;
  - selo "Modo manual"; não fala mais "sua loja".
- **Maurício no painel do lojista:**
  - responde o passo a passo da loja (produto, Mercado Pago, frete, publicar, tema, domínio, pedidos, cupons…);
  - o que o manual não cobre vira "Chamar a equipe NextLevel", que abre a Ajuda já com a pergunta escrita;
  - a Ajuda cai na caixa de Atendimento do Master (seu CRM).
- **Cliente final na loja** (botão "Dúvidas?", só nas lojas da E-commerce):
  - o assistente responde pelo manual do comprador: como comprar, pagamento, frete e prazo, acompanhar pedido, troca, medidas;
  - "Mandar a pergunta para a loja" pede nome e WhatsApp e cria uma conversa `ia_conversas` com canal LOJA, ligada à loja;
  - a resposta da loja aparece ali mesmo.
- **Atendimento do lojista** (`/merchant/atendimento`, menu Vendas):
  - a caixa dele, com as conversas dos clientes da loja ao vivo;
  - responder (o cliente vê na loja), WhatsApp e "Resolvida";
  - a equipe da loja também acessa.
- **Separação:** conversas com canal LOJA nunca aparecem no Atendimento, no aviso sonoro nem na fila do Master. São do lojista.
- Código: `src/lib/domain/atendimento-loja.ts`, `src/app/actions/atendimento-loja.ts`, `src/components/storefront/chat-da-loja.tsx`, `src/app/merchant/atendimento/`, `src/components/ia/mauricio.tsx`.

## D207 — [E-commerce] Painel do lojista com o escritório do Master: cor, menu, Agora, CRM próprio e aviso sonoro (2026-10-29)
- **Pedido do dono:** "aplicar a evolução do sistema do Master no painel do lojista"; menu de acordo com a necessidade dele e ligado ao suporte do Master; IA offline que chama a equipe; "o lojista precisa ter seu próprio CRM"; cores iguais às do Master.
- **Casca:** o painel da loja E-commerce usa a cor da NextLevel (roxo do Master) e a faixa do topo com a novidade "Atendimento ao vivo" e o agente. A loja do cliente final continua com o tema escolhido pelo lojista (a cor só vale dentro do painel).
- **Menu em 3 seções** (antes: 6 grupos em sanfona):
  - **Escritório:** Agora, Atendimento, Clientes, Pedidos, Produtos, Financeiro, Minha loja;
  - **Crescer:** Cupons, Campanhas, Avaliações, Migrar e anunciar, Análise, Pede pro Maurício;
  - **Loja e ajustes:** o resto (pós-venda, categorias, aparência, temas, cadastro de clientes, ferramentas, aplicativos, empresa, equipe, assinatura, registro).
  - Barra do celular: Agora, Atendimento, Clientes, Pedidos.
- **Agora:** a fila do dia sobe para logo abaixo da capa e ganha "cliente(s) esperando resposta" e "carrinho(s) abandonado(s) nas últimas 48 h". A tela atualiza sozinha (30 s).
- **Clientes (CRM da loja):** `/merchant/crm` junta numa pessoa só (mesmo e-mail ou WhatsApp) quem perguntou no "Dúvidas?", quem abandonou carrinho (60 dias) e quem comprou.
  - Etapas que andam sozinhas: Conversou, Carrinho abandonado, Primeira compra, Recorrente, Sumiu (90 dias sem comprar).
  - WhatsApp com mensagem pronta por etapa; ficha com linha do tempo, próxima ação, prazo e notas (`crm_acompanhamento`, marca `LOJA:<id>`, sem tabela nova).
  - Só a própria loja vê; a equipe da loja também acessa.
- **Aviso sonoro do lojista:** o mesmo do Master (`AvisoSonoro loja`), contando as perguntas dos clientes da loja; o aviso abre a conversa certa (`/merchant/atendimento?c=`). Desligado em modo suporte.
- **Maurício (offline):** guias novos do lojista (Agora, Clientes, Falar com a equipe NextLevel) e caminhos atualizados para o menu novo; o guia de suporte mostra o botão "Chamar a equipe NextLevel", que cai no Atendimento do Master (D201).
- Testes automáticos ficam para a fase de testes (pedido do dono); conferido por capturas em 1440 e 390 px.
- Código: `src/lib/domain/crm-loja.ts`, `src/app/actions/crm-loja.ts`, `src/app/merchant/crm/`, `src/lib/nav.ts`, `src/components/app/role-layout.tsx`, `src/components/commerce/commerce-home.tsx`, `src/components/master/aviso-sonoro.tsx`, `src/lib/ia/manual.ts`.

## D208 — [E-commerce] Pedidos do lojista: "Precisa de você agora" com mensagem pronta (2026-10-29)
- **Pedido do dono:** "Vamos lá!" (próximo passo proposto após D207: Pedidos no padrão do escritório).
- **Topo da tela Pedidos (só E-commerce):** os pedidos parados além do normal, na mesma régua do pós-venda (`attentionFor`), em ordem de urgência:
  - em preparação há mais de 48 h (vermelho) → "Separar e enviar";
  - sem pagamento há mais de 24 h (amarelo) → "Lembrar do pagamento";
  - enviado sem confirmação de entrega há mais de 7 dias (azul) → "Confirmar entrega".
- Cada linha tem a mensagem pronta para o cliente: WhatsApp quando o pedido tem telefone; senão, "Copiar mensagem".
- Atalho "Precisa de você (N)" filtra a lista; a tela atualiza sozinha (30 s).
- O item "Pedidos parados" da tela Agora da E-commerce agora abre essa lista (`/merchant/orders?ver=atencao`). SuperDrop continua indo ao pós-venda.
- Código: `src/lib/domain/pedidos-agora.ts` (puro, com teste `tests/pedidos-agora.test.ts`), `src/app/merchant/orders/`.

## D209 — [Painéis] Canto superior refeito: marca do cliente no lojista, seletor de negócios no Master e botão Agente com borda viva (2026-10-29)
- **Pedido do dono (com capturas):** "precisamos refazer o racional desse canto superior"; "não precisa ter a nossa marca e sim a do cliente no painel do lojista"; "no Master precisa ter um seletor de negócios de outra forma"; "quero esse efeito do agente da Hostinger nos botões do topo do nosso assistente".
- **Painel do lojista:** o canto do menu mostra a marca da loja: logo enviada pelo lojista (`stores.logo_url`) ou as iniciais sem símbolos ("Fio & Linha" → FL), com o nome e "Painel da loja" (ou "Equipe da loja"). Saem o logo da NextLevel E-commerce e o "NextLevel / E-commerce" do menu.
- **Master: seletor de negócios na faixa do topo**, no lugar do "NextLevel / …" do menu lateral e da faixa "Vendo:":
  - pílula "Negócio · E-commerce" com a sigla colorida da marca;
  - abre "Seus negócios" em cartões: Aberto agora, Disponível (troca na hora), Pausado (trancado em `MASTER_MARCAS_ATIVAS`) e Em breve (sem sistema);
  - com mais de um negócio aberto, aparece também "Todos" (visão do grupo);
  - no celular vira só a sigla, e "Indique e ganhe" fica no menu da conta.
- **Botão Agente:** pílula escura com borda em degradê (rosa, roxo, azul) que gira devagar e um brilho suave, como o da referência. Respeita "reduzir movimento". Vale no Master e no lojista.
- Os outros painéis (fornecedor, parceiro etc.) continuam com o menu de antes.
- Código: `src/components/app/app-shell.tsx`, `src/components/master/seletor-negocios.tsx`, `src/components/app/role-layout.tsx`, `src/design-system/core.css`.

## D210 — [Painéis] Botão Agente com o degradê da Hostinger e topo modernizado (2026-10-29)
- **Pedido do dono:** "o botão do agente precisa ter aquelas cores degradê igual Hostinger"; "nesses botões do topo, o que pudermos fazer para modernizar, pode fazer".
- **Causa de a borda aparecer cinza (D209):** a regra global `* { border-color }` (fora de camada) vence as regras do design system (camada `components`). A borda colorida passa a usar `border-color: transparent !important` para o degradê aparecer.
- **Agente:** pílula escura com borda grossa em degradê rosa → roxo → azul, brilho que corre devagar pela borda, halo rosa à esquerda e azul à direita, ícone com brilho. Parado para quem pede menos movimento.
- **Topo modernizado (Master e lojista):**
  - todos os controles em vidro: mesma altura (38 px), borda fina clara, brilho no alto, desfoque e leve subida ao passar o mouse;
  - busca em pílula com o atalho Ctrl K em cápsula;
  - botões só de ícone redondos;
  - número de avisos em pílula com degradê, fora do sino;
  - avatar com anel no degradê do Agente;
  - no celular, espaçamento menor para tudo caber em 360 px.
- Código: `src/design-system/core.css`.

## D211 — [E-commerce] Produtos do lojista: "Precisa de você agora" produto a produto + filtros sem a barra colorida (2026-10-29)
- **Pedido do dono:** "vamos avançar para mais painéis e páginas; vamos ao próximo passo" (próximo passo proposto: Produtos no padrão do escritório).
- **Topo de Produtos (só E-commerce):** lista produto a produto do que atrapalha a venda, do mais grave ao menos, com o botão que resolve:
  - ativo sem estoque (vermelho, "Repor estoque");
  - sem preço (vermelho, "Definir preço");
  - sem foto (amarelo, "Adicionar foto");
  - estoque abaixo de 10 (amarelo);
  - rascunho (azul, "Revisar e ativar").
- Detalhes da lista:
  - um problema por produto (o mais grave);
  - arquivados ficam de fora;
  - "Ver os N produtos" filtra a tabela (`?ver=atencao`).
- A fila só com contagens continua para o fornecedor do SuperDrop.
- **Agora:** novo item "N produto(s) travando venda" (só os vermelhos e amarelos), que abre essa lista.
- **Coluna "Sugerido" → "Preço"** na loja independente (o preço é dela; "sugerido" é termo do SuperDrop).
- **Correção visual em todos os painéis:** a linha animada dos campos (movimento.css) pegava as caixas de seleção e desenhava um bloco colorido no lugar da seta. Agora a seleção tem a seta própria e fica sem a linha.
- Código: `src/lib/domain/produtos-agora.ts` (puro, teste `tests/produtos-agora.test.ts`), `src/components/commerce/produtos-agora.tsx`, `src/app/supplier/products/page.tsx`, `src/app/merchant/catalogo/page.tsx`, `src/app/merchant/page.tsx`, `src/design-system/movimento.css`.

## D212 — [E-commerce] "Precisa de você agora" em todas as telas do lojista, num bloco único (2026-10-29)
- **Pedido do dono:** "vamos avançando para implementar em todas as telas necessárias".
- **Bloco único `PrecisaDeVoce`:** mesmo desenho em todas as telas (bolinha da urgência, o que é, por quê e o botão que resolve). Pedidos (D208) e Produtos (D211) passaram a usar o mesmo bloco.
- **Regras novas** (puras, em `src/lib/domain/loja-agora.ts`, com teste `tests/loja-agora.test.ts`):
  - **Financeiro:**
    - Mercado Pago não conectado (vermelho);
    - fatura vencida (vermelho) ou em aberto (amarelo) com a NextLevel;
    - plano em atraso ou suspenso (vermelho);
    - teste grátis acabando em até 5 dias (amarelo; vermelho em até 2);
    - valor a receber (azul).
    - Os números do topo viram: entrou hoje, últimos 7 dias, últimos 30 dias (com a margem) e a receber.
  - **Minha loja:** o que falta para vender (vermelho) e o que dá confiança ao cliente (amarelo), vindo da prontidão da loja (`getStoreReadiness`).
  - **Cupons:** esgotado e vencido ainda ligado (amarelo), vencendo em até 7 dias (azul).
  - **Avaliações:** esperando aprovação, nota baixa (1 ou 2) primeiro, em vermelho.
  - **Campanhas:** faixa terminando em menos de 24 h (amarelo) e loja sem nenhuma faixa no ar (azul).
- Só na E-commerce: o lojista do SuperDrop continua com as telas de antes.
- Pós-venda já tinha a fila própria; Atendimento e Clientes já nasceram nesse padrão (D206/D207).
- Código: `src/components/app/precisa-de-voce.tsx`, `src/lib/domain/loja-agora.ts` e as páginas `src/app/merchant/{finance,storefront,descontos,avaliacoes,campanhas,orders}`, `src/components/commerce/produtos-agora.tsx`.

## D213 — [E-commerce] Loja do cliente final: calcular frete, Comprar agora, barra de frete grátis e etapas da compra (2026-10-29)
- **Pedido do dono:** "pode ir na ordem, um de cada vez". Primeiro, a loja que o cliente final vê.
- **Página do produto (só lojas da E-commerce):**
  - **"Comprar agora":** coloca no carrinho e vai direto ao fechamento.
  - **"Calcular frete":** pelo CEP, com a mesma cotação do fechamento (`quoteShippingAction`, servidor), mostrando opções, prazo e preço.
  - **Aviso de frete grátis** a partir do valor da regra da loja (`shipping_config.freeFromCents`).
  - A barra fixa do celular passa a dizer "Comprar agora" e leva direto ao fechamento.
- **Carrinho (só E-commerce):** barra "Faltam R$ X para ganhar frete grátis", que fica cheia quando o pedido atinge o valor. Usa a mesma regra que a cotação aplica, sem prometer o que o fechamento não cumpre.
- **Fechamento (todas as lojas):** linha de etapas "1. Carrinho › 2. Seus dados e entrega › 3. Pagamento seguro".
- **Correções visuais:**
  - os selos "Compre com segurança" do carrinho escapavam das margens (o carrinho não tinha moldura de página);
  - no celular, o botão "Dúvidas?" cobria o preço do produto: agora é só um ícone redondo à direita, acima da barra de compra.
- Lojas do SuperDrop: mesmas telas de antes (sem "Comprar agora", sem calcular frete e sem barra de frete grátis).
- Código: `src/components/storefront/buy-box.tsx`, `src/components/storefront/calcular-frete.tsx`, `src/app/store/[slug]/cart/cart-view.tsx`, `src/app/store/[slug]/checkout/checkout-form.tsx`, `src/components/storefront/sections/sections.tsx`, `src/components/storefront/store-page.tsx`, `src/components/storefront/chat-da-loja.tsx`.

## D214 — [E-commerce] Página pública: cápsula do Maurício no padrão do Agente, versão curta no celular e grade de temas sem cartão sozinho (2026-10-29)
- **Pedido do dono:** "pode ir na ordem, um de cada vez" (etapa 2: a página que vende a plataforma).
- **Conferência por rolagem real:** "Como funciona" e "Personalização" são seções que se desenham conforme a rolagem; no print de página inteira parecem vazias, mas funcionam. Nada a mudar nelas.
- **Cápsula "Pede pro Maurício":**
  - mesmo visual do botão Agente (D210): pílula escura, borda em degradê rosa → azul que corre devagar, botão de enviar em degradê;
  - a borda clara antiga vinha do `* { border-color }` global;
  - a entrada não recorta mais o brilho (o `nl-chega` deixava um retângulo rosa).
- **Celular:** a cápsula virava uma barra larga sobre o título dos planos. Agora é uma pílula curta ("Pede pro Maurício") à esquerda, e o WhatsApp fica à direita.
- **Grade de temas:** 4 colunas em telas largas (com 3 colunas, o 4º tema ficava sozinho na linha).
- Código: `src/design-system/movimento.css`, `src/components/ia/vendedor-home.tsx`, `src/components/portal/commerce/theme-gallery.tsx`.

## D215 — [Master] "Precisa de você agora" em Receita, Lojistas e Crescimento (2026-10-29)
- **Pedido do dono:** "pode ir na ordem, um de cada vez" (etapa 3: o resto do Master no padrão novo).
- O mesmo bloco único do lojista (D212). Cada loja abre a ficha do Comercial (`loja:<id>`), com WhatsApp e histórico.
- **Regras** (puras, `src/lib/domain/master-agora.ts`, testes em `tests/loja-agora.test.ts`):
  - **Receita:** plano vencido (vermelho, "Cobrar"); pagamento pendente (amarelo); teste terminando em até 3 dias (amarelo); renovação em até 5 dias (azul).
  - **Lojistas:** acesso vencido (vermelho); loja criada há 3 dias ou mais e não publicada (amarelo, "Ajudar"); loja publicada sem Mercado Pago, que não recebe pagamento real (amarelo).
  - **Crescimento:**
    - Mercado Pago da NextLevel desconectado ou em modo teste (vermelho);
    - e-mails automáticos desligados (amarelo, leva à Central de qualidade, que diz como ligar);
    - Maurício em modo manual ou com a chave salva mas o uso real desligado (azul).
    - Só "ligado/desligado": nenhum valor de chave sai da tela.
- Código: `src/lib/domain/master-agora.ts`, `src/app/master/receita/page.tsx`, `src/app/commerce/stores/page.tsx`, `src/app/master/crescimento/page.tsx`.

## D216 — [Direção] Fase atual só na NextLevel E-commerce; SuperDrop não está em produção (2026-10-29)
- **Pedido do dono:** "SuperDrop não está em produção, não existem clientes. Mas nessa fase estamos só no E-commerce. Salva essa info."
- **Corrige a premissa antiga** (CLAUDE.md, AGENTS.md e skills) de que o SuperDrop estava em produção com clientes.
- **Regra a partir de agora:** o trabalho é só da E-commerce e do Master. Não deixar de melhorar algo por cautela com o SuperDrop. Quando uma melhoria servir para todas as lojas, pode valer para todas, desde que não quebre o que existe. As outras marcas voltam numa etapa futura.
- As barreiras "só na E-commerce" de D208 a D213 continuam como estão (não fazem mal). Podem ser abertas para as outras marcas quando elas entrarem na fase.

## D217 — [E-commerce] Lojista sem "Marcas do grupo"; filas antigas e números no mesmo padrão do "Precisa de você" (2026-10-29)
- **Pedido do dono:** "pode tirar o Marcas do grupo e seguir".
- **Painel do lojista da E-commerce:** saem o fio colorido do grupo, o botão "Marcas do grupo" e o "Suas marcas" do menu da conta. O painel mostra só a marca do cliente (continua de D209). A barra do ecossistema (D129) segue nas outras marcas, que estão fora da fase atual.
- **Fila antiga (`ActionQueue`) com o desenho do "Precisa de você agora" (D212)** em todas as telas que a usam (Pós-venda, Configurações, Master, fornecedor…): cartão, bolinha da urgência, o que é, por quê e o botão que resolve. A API não mudou.
- **Números no topo (`OperationalPulse`)** em duas colunas já no celular (antes, quatro linhas empurravam o que importa para baixo); o ícone some no celular para caber.
- Código: `src/components/app/role-layout.tsx`, `src/components/app/action-queue.tsx`, `src/components/app/operational-pulse.tsx`.

## D218 — [Master] Busca ativa de coisa antiga; Master pronto para receber as marcas do grupo (próxima: NextLevel Soluções) (2026-10-29)
- **Pedido do dono:** "faz a busca ativa, eu não quero nada antigo, quero tudo novo"; "o Master tem que estar pronto para receber as marcas do grupo; a próxima é a NextLevel Soluções".
- **Relatório:** `docs/relatorios/AUDITORIA-MODERNIZACAO-2026-10-29.md` (68 telas varridas no computador e no celular).
- **Cadastro único de negócios** (`src/lib/negocios.ts`): estado de cada negócio (aberto, próximo, pausado, em breve). A Soluções está marcada como próxima (`PROXIMO_NEGOCIO`). O seletor de negócios usa esse cadastro.
- **Regra:** as telas do Master citam só negócios abertos (`negocioAberto`, `negociosAbertos`). O `masterBrandFilter` prende as listas no único negócio aberto e ignora marca fechada.
- **Telas ajustadas:**
  - Clientes, Equipe (`dicaDaFuncao`), Financeiro (MRR e composição só dos abertos), Assinaturas, Planos;
  - Temas (vitrine real, sem jargão);
  - canto do menu do Master ("Master do grupo");
  - "Quero minha loja" em duas colunas;
  - rodapé sem "pontos do Club";
  - números do topo com 3 itens em 3 colunas.
- **Roteiro para abrir a Soluções:** está no relatório (marca própria, `MASTER_MARCAS`, menu do escritório, variável no Render).

## D219 — [E-commerce] Home com racional convincente e comparativo com concorrentes; marcas bloqueadas, não tiradas (2026-10-29)
- **Pedido do dono:** home objetiva, que convence de cara, com comparativo como o da Nuvemshop; o que não convence vai para páginas institucionais. Marcas: "não quero que tire, só deixa bloqueado; no painel do lojista não aparecem; só no Master; vamos ativando no ecossistema público conforme cada marca fica pronta".
- **Racional e avaliação da Nuvemshop:** `docs/design/HOME-ECOMMERCE-RACIONAL.md`.
- **Home nova:** topo → Por que a NextLevel → planos → comparativo (custo total em 30, 50 e 100 mil; tabela de taxas e limites contra Nuvemshop, Tray, Loja Integrada e Shopify; fonte e data) → lojas de exemplo → temas → equipe → dúvidas → chamada final.
- **Páginas novas:**
  - `/recursos`: como funciona, portas de entrada, personalização, Maurício, integrações e carta do fundador;
  - `/comparativo`: as 6 faixas de faturamento e os planos de cada plataforma, com link para a fonte.
- **Menu público:** Recursos · Comparativo · Planos · Temas · Dúvidas.
- **Dados do comparativo:** `src/lib/marcas/comparativo-ecommerce.ts` (públicos, com `COLETADO_EM`). A NextLevel entra sempre com os preços do Master. Plataforma em dólar ou que não divulga a tarifa fica fora do custo total. A frase "a partir de R$ 30 mil" é garantida por teste.
- **Marcas:**
  - no Master, todas continuam visíveis no seletor como Pausado, Próximo ou Em breve (bloqueadas, não removidas);
  - no painel do lojista não aparecem (D217);
  - no ecossistema público (menu do site do grupo), só entram as marcas liberadas, as mesmas abertas no Master (`negocioAberto`). As outras são ativadas conforme ficarem prontas.

## D220 — [E-commerce] Taxa zero com o Mercado Pago, preços abaixo da concorrência e Programa de Parceiros (2026-10-29)
- **Pedido do dono:** racional agressivo: taxa zero para quem usa o checkout do Mercado Pago (parceiro oficial, parceria confirmada), mais barato que a concorrência em todos os planos, inclusive no anual, e um grande programa de parceiros com página própria, agências em destaque e painel motivador.
- **Preços (revisão `src/lib/finance/revisao-d220.ts`, aplicada por `aplicarRevisaoD220` no seed do catálogo):** Start R$ 57, Pro R$ 147, Scale R$ 347 por mês; no anual, R$ 37, R$ 119 e R$ 297 por mês. Taxa sobre vendas 0% para todos; assinaturas existentes também passam a 0%. Os planos se diferenciam pelas cotas do Maurício IA.
- **Comissões:** indicador 20% da primeira mensalidade + 10% por 12 meses; agência parceira (e agência elite) 30% + 15% enquanto o cliente ficar (até 120 meses). Regras novas versionadas com motivo "D220".
- **Comparativo:** preço anual de Nuvemshop e Tray incluído; teste garante que a NextLevel é a mais barata em cada degrau, no mensal e no anual. Rodapé honesto: os concorrentes também zeram a taxa com o pagamento deles; tarifa de processamento fica de fora.
- **Selo Mercado Pago:** só texto, sem logo, até o dono enviar o material da marca.
- **Programa de Parceiros (módulo da E-commerce, depois estendido à Soluções):**
  - página pública `/parceiros` com indicador e agência parceira, simulador, como funciona e dúvidas; "Parceiros" no menu público;
  - painel do parceiro (`src/app/partner/painel-ec.tsx`, domínio `src/lib/domain/parceiros-ec.ts`): link com cópia e WhatsApp, ganhos do mês, recorrente, saldo, indicados, "Precisa de você agora" e pedido para virar agência;
  - pedido de agência (`agencyRequestedAt`, `agencyInfo`, migração 0080) aparece no Master em Parceiros; a aprovação é a troca do Tipo na página do parceiro.
- **Linguagem (pedido do dono):** nunca dizer "mais barato". Falar em mais vantajoso, preço mais competitivo, vencer no preço.
- **Vivência de rua:** seção nova na home (`vivencia-rua.tsx`), logo depois de "Por que a NextLevel". Fala da presença no Brás, no Canindé e em São Paulo, da experiência com os maiores importadores chineses e brasileiros, do foco no atacado e da proximidade, em oposição a agências de outros estados. O selo do topo diz "do Brás, com foco no atacado".

## D221 — [E-commerce] Faixa "a única com taxa zero no checkout do Mercado Pago", comparativo contra quatro e seção do atacado (2026-10-29)
- **Pedido do dono:**
  - faixa logo no topo com a taxa zero e as taxas das outras;
  - comparativo contra pelo menos quatro (Nuvemshop, Loja Integrada, Shopify, WBuy);
  - explorar o atacado (grade de 12, pacote) na home;
  - arquivo de selos com prompts para o gerador de imagem.
- **Preços:** continuam 57 / 147 / 347 (escolha do dono). Nos planos de entrada a Loja Integrada tem mensalidade menor, e no avançado a WBuy também. A comparação passa a ser pelo custo total (mensalidade + taxa usando o Mercado Pago). Teste: em cada plano, a NextLevel tem o menor custo total para quem vende R$ 30 mil por mês (`FAT_REFERENCIA_CENTS`).
- **Frase do topo:** "A única com taxa zero no checkout do Mercado Pago" (escolha do dono). Não usamos "a única plataforma com taxa zero", porque Nuvemshop, Loja Integrada e WBuy também zeram com o pagamento próprio delas. A faixa (`FaixaTaxaZero`) lista a taxa máxima de cada concorrente usando o Mercado Pago:
  - Nuvemshop 2%;
  - Shopify 2%;
  - WBuy 1,5%;
  - Tray 1,25%;
  - Loja Integrada 0,99%.
- **Dados (sites oficiais, 29/10/2026):** WBuy entrou (59 / 149 / 299 / 499; comissão de 1,5% a 0,7% com outros gateways). A Loja Integrada agora entra com a tarifa (0,99%, 0,90% e 0,70%). A tabela da home compara com cinco plataformas: Nuvemshop, Loja Integrada, WBuy, Tray e Shopify.
- **Seção "Feita para o atacado"** (`feita-para-atacado.tsx`), só com o que existe no sistema:
  - grade fechada e unidade no mesmo produto;
  - preço por quantidade;
  - pedido mínimo;
  - propostas e pedidos do balcão.
  - Não afirmamos que os concorrentes não têm esses recursos.
- **Selos:** `docs/marca/SELOS-E-PROVAS.md`. Selos próprios com prompts para o gerador de imagem; selos de terceiros (Google, Reclame Aqui, Mercado Pago, PCI) só com o material oficial.
- **Correção do dono (mesmo dia):** a taxa zero é da **plataforma** sobre as vendas. O Mercado Pago cobra as taxas dele (Pix e cartão), que não têm nada a ver com a NextLevel. Os textos agora dizem sempre "taxa zero da plataforma". Ficaram de fora "nada sobre as vendas" e "100% das vendas na sua conta", que davam a entender que não existia nenhuma taxa. A faixa do topo, o FAQ, os planos e o vendedor IA lembram que as taxas do Mercado Pago são à parte.

## D222 — [E-commerce] Visual de tecnologia: tipografia nova e blocos de informação redesenhados (2026-10-29)
- **Pedido do dono:** a fonte não parecia de tecnologia, os blocos de informação estavam sem design e o "0%" estava simples demais. A página precisa refletir que somos uma plataforma de tecnologia.
- **Tipografia:** só no portal público da E-commerce (`.ec-tech`, no layout do portal). As fontes são locais, com licença OFL:
  - Space Grotesk nos títulos;
  - Geist no texto;
  - Geist Mono em rótulos e números.
  - As outras marcas não mudam.
- **Kit visual** (`src/components/portal/commerce/tech.css`):
  - painel escuro com grade fina, borda em degradê ciano-violeta-verde e brilho;
  - "0%" gigante em degradê verde-ciano;
  - barras de dados que crescem na rolagem (com alternativa sem movimento);
  - cartões com índice em mono (01–04) e ícone em quadrado com degradê;
  - etiquetas em mono ("// POR QUE A NEXTLEVEL").
- **Aplicado em:**
  - faixa da taxa zero (painel e barras com a taxa de cada plataforma);
  - "Por que a NextLevel" (cartões com o dado em destaque: 0%, R$ 57, ∞, SP);
  - comparativo (cartões de plano e tabela em painel, números em mono);
  - "Feita para o atacado" e "Vivência de rua";
  - selo do Mercado Pago.

## D223 — [E-commerce] Visual de tecnologia em todas as páginas públicas (2026-10-29)
- **Pedido do dono:** "pode levar esse visual para todas as páginas".
- **Cabeçalho padrão** (`CabecalhoTech`, `cabecalho-tech.tsx`):
  - faixa marinho com grade e brilho;
  - rótulo em mono e título grande, com um trecho em degradê;
  - números reais em destaque.
  - Usado em Recursos, Comparativo, Planos, Temas, Dúvidas, Integrações e Quero minha loja.
  - Em Planos, Temas, Dúvidas e Quero minha loja, que outras marcas também usam, o cabeçalho aparece só na E-commerce.
- **Parceiros:**
  - topo no mesmo padrão;
  - Indicador em cartão claro e Agência parceira em painel escuro;
  - passos numerados em mono;
  - perguntas em cartões;
  - simulador em cartões.
- **Fontes também nas telas de entrada e cadastro da E-commerce:** login, cadastro, esqueci a senha, entrar e cadastro de parceiro. O módulo único `fontes-ec.ts` (classe `EC_TECH`) carrega as fontes e o `tech.css`.
- **Estilos no `tech.css`, valendo só dentro de `.ec-tech`:**
  - perguntas (`.ec-perguntas`) com sinal + / –;
  - chips em mono (`.ec-chip`);
  - cartões de plano com borda em degradê e o recomendado em painel escuro.
- **Correções:**
  - O seletor Mensal/Anual da página Planos estava sem estilo, porque o CSS só era carregado na home. Agora o `pricing.tsx` importa o CSS.
  - "Você recebe 100% das vendas" virou "o dinheiro cai direto para você", também nos bancos já semeados (ajuste no texto exibido).

## D224 — [Painéis] Visual de tecnologia contido no lojista, no Master e no parceiro (2026-10-29)
- **Pedido do dono:** aplicar nos três painéis, aceitando a recomendação (versão contida para o dia a dia; painel escuro só na abertura). A prévia foi aprovada antes.
- **`PainelTech`** (`src/components/app/painel-tech.tsx`): um `<style>` que entra e sai junto com a casca, como o `AreaTheme`, e por isso vale também em diálogos e menus. Está ligado:
  - no lojista da E-commerce;
  - no Master;
  - no parceiro da E-commerce.
- **Fontes:**
  - Space Grotesk nos títulos;
  - Geist no texto;
  - Geist Mono nos números (`.tabular-nums` do conteúdo) e nos rótulos do menu ("// ESCRITÓRIO").
  - As famílias vêm de `EC_FAMILIAS` (`fontes-ec.ts`).
- **Cartões:** borda fina em degradê azul, violeta e verde. O bloco de abertura (`.ds-hero`, ex.: "Boa noite, Ana") vira painel escuro com grade e borda brilhante. A faixa roxa do topo e o botão do Agente não mudam.
- **Parceiro:** o topo usa o mesmo painel escuro da faixa do 0% do site (`ec-painel`), com etiqueta em mono e link em mono.
- **Fora desta mudança:** fornecedor, expedição e as outras marcas.

## D225 — [Painéis] Abertura em vidro colorido no lugar do preto (2026-10-30)
- **Pedido do dono:** "esse preto sólido não ficou bonito; se fosse algo estilo vidro, com uma cor que se comunique com o sistema, tudo bem". Ele viu duas prévias (A: vidro colorido; B: vidro claro) e escolheu a A para os três painéis.
- **Como ficou o `.ds-hero` (no `PainelTech`):**
  - vidro translúcido com degradê roxo → violeta → azul, as cores da faixa do topo;
  - brilho rosa no canto e brilho azul na base;
  - desfoque do que fica atrás (`backdrop-filter`) e grade branca leve;
  - borda branca translúcida com reflexo no alto;
  - texto em branco.
- **Parceiro:** o topo do painel usa a mesma abertura (`ds-hero`) no lugar do painel escuro.
- **Lojista e Master:** o lojista usa o mesmo bloco ("Boa noite, …"). No Master, vale para qualquer tela que use o `ds-hero`.

## D226 — [Parceiros e planos] Valores aprovados; placar da goleada e Black Friday planejados (2026-11-03)
- **Aprovado pelo dono** (detalhes em `docs/prompts/parceiros-v2-crm-niveis-planos.md`):
  - **Comissões:**
    - criador e representante: 50% da 1ª mensalidade + 20% recorrente enquanto o cliente ficar;
    - agência: 50% + 25% desde o 1º cliente;
    - Agência Elite (20+ clientes): 50% + 32%;
    - representante: bônus de R$ 30 por loja ativada e R$ 100 na meta de 10 no mês;
    - cliente indica: 1 mês grátis por indicação paga;
    - níveis Prata, Ouro e Diamante;
    - teto: 50% no 1º mês e 32% recorrente.
  - **Planos:**
    - produtos ativos 300 / 1.000 / **sem limite no Scale**;
    - pessoas 3 / 6 / 12;
    - Maurício IA 40 / 350 / 1.200;
    - atacado, propostas e planilha em todos;
    - tema pago no Pro e no Scale;
    - suporte do Pro em até 2 h úteis (a confirmar) e gerente de conta no Scale;
    - migração inclusa no Scale e com 50% de desconto no Pro.
- **Planejado (pedido do dono):**
  - **Placar da goleada** ("O Clássico do E-commerce"): calculado a partir da súmula editada no Master, com destaque só para o que vencemos e as derrotas sem destaque; aparece no site e nos painéis.
  - **Black Friday NextLevel** (27/11/2026): roupa da Black em todos os sites públicos e painéis, contagem regressiva real em todo canto e regras contra a "Black Fraude": fim real, preço depois da Black agendado, "vencemos as Blacks" só com comprovação na súmula.
- **Ordem:** BF1 a BF3 primeiro (no ar até 10/11), depois as fases PV0 a PV8.
- **Ainda nada implementado.** As perguntas abertas estão na seção 10 do documento.

## D227 — [Black e planos] Respostas do dono da 2ª rodada (2026-11-03)
- **Suporte do Pro:** até 4 h úteis.
- **Black NextLevel:** vai até **30/11/2026 às 23h59** (Cyber Monday).
- **A Black se apoia no semestral e no anual:**
  - quem assina na Black mantém o preço enquanto a assinatura estiver ativa;
  - anual com **2 meses grátis** (paga 10, leva 12);
  - parceiros com **1ª mensalidade a 100%** nas lojas indicadas durante a Black;
  - **kit Black para a loja dos lojistas** (fase BF4).
- **Placar:**
  - pode ter a Nuvemshop como rival, mas tem que vencer;
  - jogo que deixar de ser vitória sai do ar sozinho, com aviso ao Master;
  - formato extra "Seleção dos concorrentes": cada lance diz de qual concorrente é o ponto fraco, e o placar conta só o que vencemos contra o melhor do grupo.
- **Página do parceiro:** `/i/anasouza`.
- **Pendentes:**
  - A. O "preço normal" depois da Black. A recomendação é manter o mensal em R$ 57 / 147 / 347 e a Black ficar no semestral e no anual; voltar a 149 / 249 / 499 faria o comparativo perder na mensalidade.
  - B. Criar o ciclo semestral.

## D228 — [Black] Sem semestral; preço depois da Black em meio-termo (2026-11-03)
- **Dono:** "vamos abortar o plano semestral"; depois da Black, "um meio-termo; não posso aumentar tanto e não me importo em ficar mais caro numericamente".
- **Proposta A (recomendada, aguardando o "ok"):**
  - **na Black:** os preços de hoje (R$ 57 / 147 / 347 no mensal; anual de R$ 37 / 119 / 297 por mês com 2 meses grátis);
  - **a partir de 01/12:** R$ 67 / 167 / 397 no mensal e R$ 49 / 139 / 339 por mês no anual.
  - No custo total continua vencendo todos: o Start a partir de R$ 2,1 mil de vendas por mês, o Pro a partir de R$ 9,3 mil e o Scale a partir de R$ 28,1 mil.
- **Alternativas:** B (62 / 157 / 377) e C (77 / 177 / 397). Detalhes na seção 14.6 do documento dos Parceiros v2.

## D229 — [Black] BF1 no ar: campanha única, contagem verdadeira e preço novo agendado (2026-11-03)
- **Dono aprovou a proposta A da D228** (depois da Black: R$ 67 / 167 / 397 no mensal e 49 / 139 / 339 por mês no anual) e mandou começar o pacote do `parceiros-v2-crm-niveis-planos.md`.
- **Campanha** (`src/lib/domain/campanha-black.ts`, configuração `campanha.black-2026`):
  - de 03/11 até **30/11/2026 às 23h59 de Brasília**;
  - o Master liga, desliga ou prorroga em `/master/black`, mas nunca encurta o fim anunciado.
- **Preço:**
  - versão D228 agendada para o instante seguinte ao fim (`revisao-d228.ts`, `agendarRevisaoD228`);
  - prorrogar acrescenta versões novas: o preço da Black a partir do fim antigo e a D228 a partir do fim novo, porque as versões de preço são só de inserção.
- **Anual na Black:** 2 meses grátis (paga 10, leva 12; `anualBlackCents`), congelado na assinatura. Vale na contratação e na troca de plano.
- **Telas:**
  - faixa com a contagem regressiva (`FaixaBlack`, `ContagemRegressiva`) no topo dos sites públicos (E-commerce e grupo) e nos três painéis;
  - nos cartões de plano: "Depois da Black: ~~R$ 67~~" e o anual Black;
  - "a partir de" do topo da home com o anual Black.
  - Tudo some sozinho quando a Black acaba.
- **Testes:**
  - `tests/campanha-black.test.ts` (estado, anual, virada de preço, prorrogação, permissão);
  - os testes de preço passaram a valer antes e depois de 01/12;
  - corrigido o teste de parceiros, que dependia da data real do cadastro.

## D230 — [Black] BF2 no ar: placar da goleada calculado a partir da súmula (2026-11-03)
- **Placar "O Clássico do E-commerce":**
  - aparece na home (logo depois da faixa do 0%), em /comparativo e em /planos (`PlacarSecao`, `PlacarGoleada`);
  - telão de estádio com "AO VIVO" e a data da súmula;
  - gols contados na tela (sem animação com `prefers-reduced-motion`);
  - gols da NextLevel em destaque; "gol de honra deles" discreto;
  - artilheiro do jogo, "Goleada!" (3 gols de diferença ou mais), botão para compartilhar o placar.
- **Regras** (`src/lib/domain/placar.ts`, testes em `tests/placar.test.ts`):
  - o placar é calculado; ninguém digita o resultado;
  - valor vazio = "não divulga" = sem gol para ninguém;
  - só vai ao ar jogo que é vitória; se virar, sai do ar e o Master é avisado ao salvar.
  - Na **Seleção dos concorrentes**, o gol conta contra o melhor do grupo. No nosso gol, o texto mostra o ponto mais fraco de um concorrente, com o nome dele; no gol deles, mostra quem de fato venceu.
- **Súmula inicial** (`placar-seed.ts`, sites oficiais em 03/11): 12 lances × 4 concorrentes × 3 planos. A NextLevel vence os 15 jogos. Exemplos: Tray 7 × 0, WBuy 4 × 0, Loja Integrada 3 × 0, Nuvemshop 3 × 1, Seleção 5 × 1 no plano de entrada.
- **Master:** `/master/placar` mostra o resultado de cada jogo e o editor da súmula. Aceita número, "sem limite", "sim", "não" ou vazio. Os créditos de IA da Tray ficaram como não comparáveis.

## D231 — [Black] Ataque no atacado: Nuvemshop e Loja Integrada não têm atacado nativo (2026-11-03)
- **O dono confirmou** que Nuvemshop e Loja Integrada não têm as funções de atacado (grade fechada, preço por quantidade, pedido mínimo): "Vamos atacar isso!".
- **Súmula do placar:** o atacado dos dois passou a "não", e o lance virou gol nosso. Agora: Nuvemshop 4 × 1 (goleada) e Loja Integrada 4 × 0 no plano de entrada.
- **Comparativo da home:** linha nova "Atacado nativo":
  - NextLevel em todos os planos;
  - Nuvemshop e Loja Integrada ✗;
  - WBuy só a partir do Turbo (R$ 149);
  - Tray só no Avançado (R$ 449);
  - Shopify só no Plus (em dólar).
  - Dados em `ATACADO_CONCORRENTES`.
- **Seção "Feita para o atacado":**
  - título "Grade de 12, pacote e preço por quantidade em todos os planos. Nos outros, não tem ou custa caro.";
  - quadro lado a lado: NextLevel desde R$ 57 × "Não tem" × "Só a partir de R$ 149" × "Só no plano de R$ 449".
- **Pendente para a fase PV6:** quando o limite de produtos dos planos for implantado, a linha "Produtos sem limite" do comparativo deve mudar junto. Hoje o sistema ainda não limita produtos; só o placar já usa a escada aprovada.

## D232 — [Black] BF3 no ar: roupa da Black, contagem em mais pontos e "Black deles × Black NextLevel" (2026-11-03)
- **Roupa da Black nos sites públicos** (classe `bk-on`, ligada pela campanha):
  - topo da home em preto com brilho verde e ciano;
  - a pílula "no ar hoje" em neon;
  - cabeçalhos das páginas e faixa de planos em preto;
  - plano recomendado com contorno neon.
  - Tudo volta ao normal sozinho quando a campanha acaba.
- **Contagem regressiva em mais pontos:**
  - grande no topo da home ("Preço Black termina em");
  - na faixa do 0%;
  - no quadro do duelo;
  - na faixa do cadastro.
  - Nos três painéis, a faixa continua e a abertura de vidro ganha contorno neon (`PainelTech black`).
- **"Black deles × Black NextLevel"** (`DueloBlack`, `dueloPrimeiroAno`): custo do 1º ano no plano de entrada para quem vende R$ 10 mil por mês. NextLevel Start anual Black R$ 370; Loja Integrada R$ 1.740; Tray R$ 1.968; WBuy R$ 2.366; Nuvemshop R$ 3.108. "R$ 1.370 a mais no seu bolso" no 1º ano.
  - Para os concorrentes, usa o melhor preço anual que divulgam hoje. As Blacks de 2026 deles ainda não foram anunciadas e entram quando saírem.
  - Aparece na home e em /planos.
- **Vendedor IA (Maurício):** responde sobre a Black (preço, promoção, desconto) com o mesmo fim da contagem (`blackTxt`).

## D233 — [Black] Rodada de ajustes: sem R$ 9,90, Shopify no clássico, Black no topo e checkout de tecnologia (2026-11-03)
Pedido do dono depois de ver o BF3 no celular.
- **Sem 1º mês por R$ 9,90 em lugar nenhum.** A oferta de entrada ganha uma versão nova, uma vez por banco (`aplicarOfertaSemPrimeiroMes`, motivo com "D233"), com `firstPeriodCents: null`; ficam os 3 dias grátis. Quem já usou a oferta antiga mantém o que recebeu. O FAQ gravado nos planos troca as respostas antigas (R$ 9,90 e "25%" no anual). Textos fixos (Soluções, vitrine, regras de comissão, botão do painel) corrigidos.
- **Shopify entra no comparativo, no duelo do 1º ano e no placar.** Cobra em dólar: convertida por `COTACAO_DOLAR` (R$ 5,00, abaixo do dólar comercial recente; sem IOF), com o valor e a data no código para o dono atualizar. Anual: US$ 29/79/299 por mês. No placar: taxa 2/1/0,6%, pessoas 2/5/15, atacado só no Plus (= não), pedidos de balcão sim; lance novo "Mensalidade em reais, sem câmbio nem IOF". Súmula já salva no Master recebe sozinha os rivais e lances novos do padrão (`completarSumula`). Jogos: 18, todos vitórias.
- **Home:** o duelo "Black deles × Black NextLevel" vem logo depois do topo; o topo vira Black (selo, "Sua loja virtual na Black · 2 meses grátis", anual a partir de R$ 30,83/mês com preço travado, contagem, botão "Garantir a Black NextLevel").
- **Comparativo no celular:** um cartão por item com a NextLevel em destaque e uma linha por concorrente (sem rolagem lateral); a tabela fica para telas grandes. Saiu a linha "Produtos sem limite em todos os planos" (contradizia os limites da D226 mostrados no placar).
- **Placar:** "AO VIVO · dados de 03/11" (só a data); a súmula padrão deixou de ter horário no futuro.
- **Menu do celular:** painel opaco de tela cheia (nada da página por trás), itens numerados, botão principal e entrar no pé, página travada enquanto aberto; na E-commerce, painel escuro de tecnologia.
- **Checkout dos planos (`/cadastro` da E-commerce):** página escura de tecnologia sem a foto; plano e ciclo (anual Black −46%), dados da conta e resumo vivo (12 meses, 2 meses grátis, 0% de taxa, total, "hoje você paga R$ 0", economia no ano, contagem e garantias). Recursos por plano com os números da D226.
- **Simulador de /planos:** a economia aparece grande em neon ("você economiza R$ X/ano") contra a opção de menor custo entre as outras, com barras de custo; no anual, cada cartão mostra a economia do ano.

## D234 — Domínio próprio liberado para todo lojista da E-commerce, de ponta a ponta (2026-11-03)
Pedido do dono: "Um cliente novo precisa poder configurar seu domínio próprio, desbloqueia isso agora".
- **Liberado em todos os planos da E-commerce** (`montarPerfil`: `customDomain` sempre ligado na E-commerce). O SuperDrop não muda.
- **Fluxo no painel** (Loja virtual → "Endereço e domínio próprio"):
  - o lojista informa o domínio;
  - o painel mostra os registros de DNS. Com "www" (ou outro nome antes do domínio) é um CNAME para o host da plataforma. Sem nada antes do domínio, é um registro A para o IP da hospedagem mais o CNAME do "www";
  - "Verificar agora" confere o DNS e se o endereço já abre a loja com HTTPS (`/api/store/dominio`). Quando os dois dão certo, o domínio fica conectado.
- **Proxy:** um host que não é da plataforma e está cadastrado abre a vitrine da loja (`lojaPorDominio`, com cache curto).
- **Endereço da loja:** quando o domínio está conectado, `storeUrl` passa a usá-lo em qualquer plano.
- **Um domínio só pode estar ligado a uma loja.**
- **Hospedagem:**
  - com `RENDER_API_KEY` e `RENDER_SERVICE_ID` no ambiente, o domínio é cadastrado sozinho no Render (o certificado sai automático);
  - sem eles, o domínio aparece na fila do Master ("Domínios próprios aguardando conexão") para a equipe cadastrar.
- **Alvo do DNS:** `LOJA_DOMINIO_CNAME` (padrão `nextlevel-demo.onrender.com`) e `LOJA_DOMINIO_IP` (padrão `216.24.57.1`).

## D235 — Proposta: lojas no nível Shopify (temas grátis, banners, chat, central do cliente) (2026-11-03)
Proposta, ainda sem decisão do dono: `docs/prompts/lojas-nivel-shopify-temas-banners-chat-central.md`, fases L1–L6, com perguntas ao dono.

## D236 — Respostas do dono sobre domínio e e-mail; "Suas pendências" no Master (2026-11-03)
- **Adicional Marca Completa aprovado:** R$ 19,90/mês com 3 caixas de e-mail; caixa extra a R$ 6,90/mês. O provedor escolhido é a Hostinger.
  - A API da Hostinger cria as caixas, mas ligar o domínio do cliente a um pedido de e-mail só se faz no hPanel. Levado ao dono, ainda sem decisão.
- **O cliente registra o próprio domínio e conecta sozinho.** Ajuda técnica é cobrada à parte, com parceiros oficiais indicados. Nada da configuração do domínio depende da equipe.
- **A verificação do domínio repete o cadastro na hospedagem** quando o DNS está certo e o HTTPS ainda não saiu.
- **Master → Agora → "Suas pendências"** (`pendencias-dono.ts`): mostra o que só o dono pode fazer, calculado do ambiente. Hoje: a chave de API do Render e o token do provedor de e-mail.
- **Serviços de parceiros com comissão:** registrado como pendente, sem executar (`docs/prompts/servicos-parceiros-afiliados.md`).

## D237 — L1: a loja nova já nasce completa e o tema grátis ganha banners em várias frentes (2026-11-03)
- **Loja E-commerce que nunca salvou um modelo e está no Starter:** na primeira leitura, ganha o tema grátis completo da família (Trama, moda), com as fotos de exemplo dos pacotes (`garantirLojaCompleta`, uma vez por loja). O SuperDrop não muda.
- **Posições sem foto própria** reaproveitam as fotos existentes da família. Só entra arquivo que existe de verdade.
- **A home do N1** tem:
  - carrossel de 3;
  - categorias e novidades;
  - dupla de banners e cartões de navegação;
  - destaques, mosaico e faixa;
  - "sobre" com imagem;
  - perguntas, grade e selos;
  - banner por categoria na coleção.
- **Capacidades que passaram para o N1:**
  - slides (até 3);
  - mosaico (até 3);
  - banner entre vitrines;
  - cartões (2), cupom e banner por categoria (4);
  - perguntas, chamada, contagem regressiva e imagem com texto.
- **Outras capacidades:**
  - o vídeo agora vale a partir do N2;
  - a agenda de campanha vale a partir do N3;
  - a estrutura (reordenar e acrescentar) segue do N3 em diante. A composição grátis já vem completa, e o SuperDrop não muda.

## D238 — L2: área "Banners" no painel do lojista (2026-11-04)
- **`/merchant/banners`** (menu "Banners" no Escritório da E-commerce e em "Loja virtual" no SuperDrop) mostra numa tela só:
  - a barra de aviso;
  - o destaque do topo;
  - a dupla de banners e os cartões;
  - o mosaico e a faixa;
  - o banner de cada categoria.
- **Em cada banner, o lojista pode:**
  - trocar a imagem (computador e celular) pela biblioteca da loja;
  - mudar o título, o texto, o botão e o link;
  - agendar o início e o fim (a partir do nível 3; nos níveis abaixo, o campo aparece com cadeado e leva aos temas);
  - ocultar, remover ou acrescentar, até o limite do nível.
- **Sem segunda cópia:** a tela lê e grava os mesmos modelos do editor de tema (`pontosDeBanner`), com as mesmas regras de nível no servidor. "Publicar banners" salva os rascunhos e publica.
- **Prévia:** um celular ao lado mostra a loja publicada.

## D239 — L3: o chat da loja atende com os dados reais da loja (2026-11-04)
- **Assistente da loja** (`responderNaLoja`, sem IA externa, sem custo nem cota):
  - **Pedido:** quando o cliente pergunta sobre o pedido, o chat pede o número e o e-mail da compra. Com os dois certos, mostra a etapa real, o código de rastreio e o link do pedido.
  - **Produto:** quando o cliente pergunta por um produto, o chat procura no catálogo ativo e mostra até 4 produtos, com foto, preço e link.
  - **O resto:** segue para os guias do comprador e, se o cliente quiser, para o lojista (caixa de Atendimento, D206).
- **Resposta da loja com o chat fechado:** o botão do chat confere a cada 30 s se a loja respondeu e acende um aviso. A conversa continua guardada no aparelho do cliente.
- **Ainda não feito:** IA generativa no chat. Ela depende de o dono decidir se conta na cota de IA do plano.

## D240 — L4: "Minha conta" do cliente final, sem senha; L6: o que cada nível de tema soma (2026-11-04)
- **L4, Minha conta** (`/store/<loja>/conta`, ícone de pessoa no cabeçalho de toda loja):
  - O cliente informa o e-mail, recebe um código de 6 dígitos (vale 10 minutos) e entra.
  - O código é derivado do segredo da plataforma: não precisou de tabela nova.
  - A sessão é um cookie assinado por loja, válido por 30 dias.
  - A resposta é a mesma para e-mail com e sem pedido, para não revelar quem comprou.
- **Dentro da conta:**
  - resumo com o total de pedidos e quantos estão a caminho;
  - a lista de pedidos, com a etapa real, os itens, o código de rastreio, "Ver pedido" e "Comprar de novo";
  - troca e devolução pelo chat da loja.
  - Ficam para depois: endereços salvos, favoritos e pedido de troca formal.
- **L6, temas por preço:** os textos dos níveis passaram a dizer o que cada um soma. A divisão de recursos é a da D237:
  - **N1:** loja completa, com banners em várias frentes;
  - **N2:** vídeo, lookbook, depoimentos e compra rápida;
  - **N3:** campanhas agendadas, carrossel automático e composição livre;
  - **N4:** experiência imersiva, menu grande e banners por contexto.
  - Recursos novos de N3/N4, como "compre o look", pacote com desconto e recomendação por IA, ficam para uma rodada própria.
- **L5, desempenho:** não mexido nesta rodada. O cache da vitrine pede cuidado com preço, estoque e campanhas ao vivo e terá rodada própria, com medição antes e depois.

## D241 — Respostas do dono: trocar o provedor de e-mail e regra da IA por plano (2026-11-04)
- **E-mail:** sai a Hostinger. Entra um provedor com API completa (domínio e caixas), para nada depender da equipe. Candidatos: Migadu, Purelymail ou Zoho Partner. A escolha final depende de pesquisa de preço e API.
- **IA:** os planos mais caros absorvem o custo. Nos planos básicos, o lojista pode usar a própria chave de API. A lógica completa será consolidada num documento próprio, com a cota por plano, a chave do lojista guardada com `encryptSecret`, a ordem de consumo, o teto de custo e a volta às respostas por regras quando a IA não estiver disponível.

## D242 — BF4: kit Black na loja do lojista, em 1 clique (2026-11-04)
- **Onde liga:** Painel da loja → Campanhas → "Kit Black da sua loja", só na E-commerce. O lojista escolhe o desconto (5 a 70%), o código (padrão BLACK10) e a data de fim (padrão: o fim da Black NextLevel).
- **O que liga:**
  - um cupom real em Cupons, com as regras de sempre (nunca abaixo do custo; não vale em loja de rede);
  - a faixa preta no topo da vitrine, com o cupom para copiar e a contagem regressiva;
  - o selo "BLACK" nos cartões de produto.
- **Some sozinho na data de fim.** Desligar desativa o cupom; o histórico fica em Cupons. "Atualizar" ajusta o mesmo cupom, sem duplicar.
- **Onde fica guardado:** a configuração fica em `platform_settings` (`loja.kit-black.<loja>`), sem tabela nova.

## D243 — Regra da IA por plano (aprovada pelo dono em 04/11)
| Plano | Painel (Maurício) | Chat da loja com IA | Chave própria do lojista |
|---|---|---|---|
| Start | 40 usos/mês (nós pagamos) | Só com a chave do lojista; sem ela, respostas por regras (D239) | Sim, sem limite (o lojista paga) |
| Pro | 350 usos/mês (nós pagamos) | Incluso, dentro da cota | Opcional, para passar da cota |
| Scale | 1.200 usos/mês (nós pagamos) | Incluso | Opcional |

- **Ordem de uso:** primeiro a cota do plano, depois a chave do lojista. Sem nenhuma das duas, as respostas voltam a ser por regras e nunca quebram.
- **Segurança:**
  - a chave fica guardada com `encryptSecret` e nunca aparece na tela;
  - o painel avisa quando a cota passar de 80%;
  - cada loja tem um teto de custo por mês.
- **Implementação:** próxima fase.

## D244 — IA por plano implementada (D243) (2026-11-04)
- **`ia-por-plano.ts`:**
  - `fonteDeIa` escolhe a chave: primeiro a cota do plano (chave da NextLevel, com o uso real ligado no Master), depois a chave do lojista. Sem nenhuma das duas, devolve nulo e o chamador responde por regras.
  - No chat da loja, o Start só usa a chave do lojista; o Pro e o Scale usam a cota.
  - `registrarUsoIa` conta 1 uso por mês de Brasília, só quando o uso foi pela cota.
  - `situacaoIa` alimenta o painel.
- **Cotas:** as de fábrica antigas (3/200/1000) viram as aprovadas (40/350/1.200), e as ferramentas de texto passam a valer desde o Start. Cotas que o dono mudou no Master ficam como estão.
- **Painel "Pede pro Maurício":**
  - cartão "IA do seu plano", com o uso do mês, a barra e o aviso aos 80%, e como o chat da loja está respondendo;
  - cartão "Use sua chave": a chave da OpenAI do lojista é conferida na hora (lista de modelos, sem custo), guardada com `encryptSecret` e nunca mostrada. Só o dono da loja cadastra.
- **Chat da loja:** a pergunta que não for de pedido nem achar produto vai à IA, quando a loja tem IA no chat. A IA responde só com os fatos da loja (produtos e preços, Mercado Pago, frete pelo CEP) e nunca inventa. Se falhar, o chat volta aos guias.
- **Ainda em "Beta · chega em breve":** as ferramentas do painel (descrição, SEO e outras). Quando forem ligadas, já usam `fonteDeIa` e `registrarUsoIa`.

## D245 — E-mail com o domínio sem custo para a NextLevel; o "Marca Completa" fica bloqueado (2026-11-04)
- **Regra do dono:** o e-mail precisa ser sem custo. O que tiver custo fica bloqueado para ativar depois.
- **Caminho grátis guiado:** em Loja virtual → "E-mail com o seu domínio", o lojista segue 3 passos para criar o e-mail no plano grátis do Zoho Mail, numa conta dele: até 5 caixas, acesso pela web e pelo app, sem IMAP. "Verificar meu e-mail" lê o registro MX do domínio raiz e mostra se está ligado e em qual provedor (Zoho, Google, Microsoft, Hostinger, Cloudflare ou outro). Nada de chave, conta ou custo nosso.
- **Marca Completa (R$ 19,90 com 3 caixas):** aparece como "em breve", com cadeado e sem compra (`MARCA_COMPLETA.disponivel = false`). Para ligar no futuro, é preciso escolher um provedor com API completa e aprovar o custo.
- **Pendências do dono:** o e-mail saiu da lista. Fica só a chave de API do Render.
- **Pesquisa:**
  - o plano grátis do Zoho segue em 2026, mas depende da região do data center;
  - o Cloudflare Email Routing é grátis, só encaminha e exige trocar os nameservers do domínio para o Cloudflare;
  - a Hostinger não liga o domínio pela API (D236).

## D246 — L5: velocidade da vitrine (medido antes e depois) (2026-11-04)
- **Causa:** cada página da loja buscava os dados no banco uma consulta depois da outra. O catálogo era lido duas vezes e o estilo da loja também.
- **O que mudou:**
  - o layout e a página buscam juntas as leituras independentes (campanha, kit Black, catálogo, prévia, teste de tema, endereço);
  - o catálogo é lido uma vez por requisição;
  - o estilo da loja (`getStorefrontGlobals`) também é lido uma vez por requisição;
  - os tamanhos com estoque, os pacotes e o preço por quantidade saem em paralelo;
  - de 16 para 14 consultas por página, em menos rodadas.
- **Medição local** (servidor de produção, banco em memória), mediana do tempo do servidor:

  | Página | Antes | Depois |
  |---|---|---|
  | Início | 63 ms | 31 ms |
  | Catálogo | 36 ms | 26 ms |
  | Produto | 38 ms | 28 ms |

- **Celular simulado (CPU 4x, rede 4G):** a maior pintura (LCP) fica em 1,0 a 2,0 s. JavaScript: 212 KB.
- **Produção** (a partir daqui, com a latência do agente):
  - catálogo: de 381 para 209 ms (mediana);
  - início: entre 300 e 460 ms, sem ganho claro. A página tem muitas seções e o tempo vai em montá-las, não no banco.
- **Ferramenta:** `LOG_SQL=1` no banco local imprime as consultas, para contar por página.
- **Ainda não feito (fica para depois):**
  - cache entre visitas, com renovação ao publicar ou ao mudar preço e estoque;
  - CDN para as imagens.
  - Isso exige cuidado com preço e estoque ao vivo e com o checkout.

## D247 — PV6: benefícios por plano numa tabela única, com travas reais (2026-11-04)
- **Tabela única** (`beneficios-plano.ts`, `ecommerce.beneficios-plano`), editável em Master → Assinaturas → "Benefícios por plano" (comercial ou financeiro, com auditoria). Valores da D226:

  | | Start | Pro | Scale |
  |---|---|---|---|
  | Produtos | 300 | 1.000 | sem limite |
  | Pessoas no painel | 3 | 6 | 12 |
  | Tema pago | não | sim | sim |
  | Suporte | chat e WhatsApp | prioritário em até 4 h | gerente de conta |
  | Migração | paga à parte | 50% de desconto | inclusa |

  Os usos de IA vêm das cotas do Maurício (D244), para não haver dois números.
- **Quem lê a tabela:**
  - /planos: os cartões listam os benefícios e há a tabela "Compare os planos" (cartões no celular);
  - o checkout;
  - o placar: os valores da NextLevel em produtos, pessoas, IA e tema vêm da tabela (`comBeneficios`).
- **Travas, só na E-commerce (o SuperDrop não muda):**
  - **produtos:** no limite, não cadastra mais (no formulário, na importação por planilha e na duplicação);
  - **pessoas:** o convite da equipe respeita o limite do plano, contando o dono;
  - **nada é tirado de ninguém:** quem já passou do limite continua vendendo tudo e só não cadastra novos;
  - arquivar um produto libera vaga;
  - sem plano ativo, vale o Start.
- **No painel:** barra de uso em Produtos e em Equipe, com aviso aos 80% e "Mudar de plano".
- **Textos corrigidos:** "sem limite de cadastro" saiu do catálogo, das páginas de Soluções (também nos bancos já existentes) e da home.

## D248 — PV0: comissões de parceiros da D226 no catálogo, com 100% da 1ª mensalidade na Black (2026-11-05)
- **Novas versões das regras** (`src/lib/finance/revisao-d226.ts`, aplicadas por `ensureCatalogSeed`, sem apagar as antigas):

  | Parceiro | 1ª mensalidade | Recorrente (enquanto o cliente ficar) |
  |---|---|---|
  | Criador / cliente que indica | 50% | 20% |
  | Representante | 50% | 20% |
  | Agência | 50% | 25% |
  | Agência Elite | 50% | 32% |

- **Plano anual:** paga o equivalente ao mensal (50% de um mês + recorrente dos outros 11, dividido por 12): 22,5% para quem tem 20%.
- **Teto:** 1ª até 50% e recorrente até 32% (teste garante).
- **Carência:** 30 dias antes de liberar o saque.
- **Na Black (campanha ativa):** a 1ª mensalidade de plano E-commerce paga 100% (no anual, 100% de um mês + recorrente dos outros 11). A recorrência não muda.
- **Revisa a D220:** agência passou de 30%/15% para 50%/25%.
- **Fica para a PV2:** bônus do representante (R$ 30 por loja ativada, R$ 100 na meta de 10) e os níveis Prata, Ouro e Diamante.

## D249 — PV2: níveis dos parceiros (Prata, Ouro, Diamante) e bônus do representante (2026-11-05)
- **Conta** clientes pagantes ativos: lojas atribuídas ao parceiro, sem bandeira de revisão, com assinatura E-commerce ativa.
- **Níveis** (`niveis-parceiro.ts`):

  | Nível | Clientes ativos | Efeito na recorrência |
  |---|---|---|
  | Inicial | 0 a 2 | Regra base da trilha |
  | Prata | 3+ | +2 pontos |
  | Ouro | 10+ | +4 pontos (e gerente de sucesso) |
  | Diamante | 20+ | Elite: agência 32%; criador e representante 26% |

  - Nunca passa do teto de 32%.
  - No plano anual, a 1ª cobrança acompanha o nível.
  - Na Black, a 1ª mensalidade continua 100%.
- **Quando muda:**
  - **sobe na hora** da venda e na rotina diária;
  - **desce só depois de 2 meses** seguidos abaixo do limite (`tierBelowSince`);
  - se voltar ao limite antes disso, não desce.
- **Master:**
  - na ficha do parceiro, "Fixar nível" com motivo obrigatório (comercial ou financeiro, com auditoria);
  - enquanto fixado, o cálculo não mexe; "Voltar ao cálculo" solta;
  - tudo vai para `partner_tier_history`.
- **Bônus do representante:**
  - **R$ 30** por loja ativada, uma vez por loja. Ativada = publicada + 1ª venda paga + 30 dias de assinatura ativa;
  - **+R$ 100** quando chega a 10 ativações no mês;
  - entra como lançamento "Bônus" no extrato.
- **Rotina:** `runDailyPartnerJobs` recalcula os níveis e paga os bônus todo dia.
- **Fora desta fase:** o "Inativo após 6 meses sem cliente ativo" não foi ligado, porque o status Inativo hoje cobra taxa de manutenção do cadastro (D-SuperDrop). Fica para decidir com o dono.

## D250 — Parceiro sem cliente por 6 meses fica Inativo; plano do atacado registrado (2026-11-05)
- **Pedido do dono:** "Pode ligar" a requalificação da D249.
- **Regra:**
  - O parceiro fica Inativo quando, ao mesmo tempo:
    - tem cadastro de 6 meses ou mais;
    - não tem nenhum cliente ativo;
    - não teve nenhuma comissão de venda nos últimos 6 meses (venda, recorrência, setup, manutenção ou bônus).
  - Roda na rotina diária (`inativarSemClientes`) e fica registrado na auditoria financeira.
  - Volta pela reativação que já existe.
- **Atacado:** o racional e o prompt engenheiro mestre estão em `docs/prompts/atacado-nextlevel-ecommerce.md`:
  - modalidades do Brás;
  - motor único de preço;
  - box novo;
  - escada Start/Pro/Scale;
  - fases AT0 a AT8.
  - Ainda não foi desenvolvido.

## D251 — PV1 + PV3: CRM de parceiros no Master (funil, ficha 360, fila, ranking, segmentos, aviso e desafio do mês) (2026-11-05)
- **Dados (migração 0082):**
  - `partner_profiles`: região, canais, seguidores, quem cuida, etapa manual, próxima ação e data;
  - `partner_activities`: nota, ligação, tarefa e mensagem; o parceiro não vê;
  - `partner_challenges` e `partner_notices`.
  - `partner_brands` fica para a PV7.
- **Funil** (aba "Funil", padrão em Master → Parceiros):
  - Etapas: Candidato → Em análise → Aprovado → Ativando → Produtivo → Em risco → Inativo → Desligado.
  - **Etapa automática:**
    - suspenso vira Desligado; inativo vira Inativo;
    - sem 1ª venda, Ativando;
    - cliente novo nos últimos 30 dias, Produtivo;
    - senão, Em risco.
  - A etapa manual (arrastar o cartão ou "Mover para…", que também funciona no teclado) vale até o cálculo mandar. As etapas iniciais somem com a 1ª venda.
  - Inativo e Desligado só mudam pela situação do parceiro.
- **Cartão:**
  - mostra tipo, nível, região, clientes ativos, receita do mês, comissão a pagar, próxima ação (vermelha quando vence), última atividade, quem cuida e WhatsApp;
  - traz a **saúde de 0 a 100**: recência 40, conversão 30, retenção 20 e sem antifraude 10.
- **Ficha 360 em gaveta** (`?p=<id>`):
  - acompanhamento editável (etapa, quem cuida, região, canais, próxima ação);
  - registrar nota, ligação ou tarefa com data;
  - tarefas com "Feita";
  - indicados com a situação de cada loja;
  - comissões por mês;
  - linha do tempo com cadastro, nível, vendas, bônus, saques, links e registros.
- **Precisa de você** passa a incluir:
  - ações vencidas;
  - "Ativando" há mais de 14 dias;
  - parceiros em risco;
  - candidatos parados há mais de 48 h.
- **Ranking do mês por trilha:** clientes novos no mês, depois receita.
- **Segmentos:**
  - filtros (nome/código, tipo, nível, região, quem cuida) salvos com nome em `parceiros.segmentos`;
  - CSV do segmento;
  - **aviso em massa**, que aparece no painel de cada parceiro do segmento por 45 dias e fica na linha do tempo.
- **Desafio do mês:**
  - meta de lojas novas no mês, bônus e tipos de parceiro;
  - a rotina diária paga o bônus uma vez por desafio e parceiro;
  - o parceiro vê a barra de progresso no painel.
- **Permissões no servidor:**
  - o dono e as funções comercial e financeiro mexem no funil e nos segmentos;
  - o suporte registra notas;
  - desafio só para o comercial e o financeiro, com auditoria.
- **Consultas:** o quadro sai de consultas agrupadas (uma por bloco), sem consulta por parceiro.
- **Na tela:** no celular o quadro rola dentro dele mesmo, sem rolagem lateral da página.

## D252 — PV4: página de captação de parceiros; parceiro da E-commerce sem meta mensal; mapa para levar o padrão às marcas (2026-11-05)
- **Página `/parceiros` da E-commerce:**
  - **Seletor de perfil** (criador, vendedor, agência) muda o título, a comissão, a escada, o simulador e a chamada, sem sair da página.
  - Subpáginas `/parceiros/criadores`, `/parceiros/vendedores` e `/parceiros/agencias`: a mesma página com o perfil já escolhido.
  - **Escada de níveis** com os números das regras vigentes: % e R$ por cliente no plano Pro, em cada nível.
  - **Simulador**: perfil, lojas por mês e plano dão o ganho no mês 1, 12 e 24. O nível sobe com a carteira; o vendedor soma os bônus; sem cancelamentos; o 100% da Black fica fora; não é promessa.
  - **"Fácil de vender"**: taxa zero da plataforma, comparativo, atacado e equipe no Brás.
  - Como funciona e dúvidas, já com níveis, garantia de 30 dias e a regra dos 6 meses.
- **Cadastro em 4 etapas** (perfil → dados → sobre você → aceite):
  - a conta nasce na hora, com o link pronto;
  - a candidatura entra no funil do Master como **Candidato**, com a qualificação (região, canais, seguidores ou carteira) na linha do tempo;
  - agência vira pedido de agência (aprovação em até 2 dias úteis);
  - vendedor gera uma tarefa no Master para mudar o tipo.
  - O cadastro antigo continua para as outras marcas.
- **Ficaram de fora (honestidade):**
  - A foto do painel no celular: a captura local mostrava o endereço de teste. A seção só aparece quando existir `public/portal/commerce/parceiros/painel-parceiro-demo.webp`, capturado em produção com dados de demonstração.
  - O diretório de agências: precisa do consentimento de cada agência para aparecer.
  - As fotos de pessoas (vendedor no Brás, agência em reunião, criadora gravando): o dono gera; os prompts estão na seção 5 do prompt dos parceiros.
- **Correção de regra:** o fechamento do mês (meta de 1 ativação, senão Inativo e taxa de manutenção) **não vale para o parceiro da E-commerce**. Ele contradizia a página ("participar não custa nada") e a regra dos 6 meses (D250). O SuperDrop continua igual, com teste.
- **Memória para as outras marcas:**
  - `docs/design/PADRAO-NEXTLEVEL-PARA-MARCAS.md` mapeia o kit visual, cada módulo (onde está, decisão, se já serve para outra marca) e o roteiro;
  - a skill `levar-para-marca` faz qualquer sessão seguir esse roteiro.

## D253 — Maurício guia do programa nas páginas /parceiros e manual completo do dia a dia no painel do parceiro (offline) (2026-11-05)
- **Pedido do dono:**
  - "A IA disponível na página de captação de parceiros tem que ser um guia amplo sobre o programa."
  - "A IA do painel interno do parceiro precisa guiar o dia a dia dele, ensinando profundamente a extrair o melhor da plataforma, tudo offline e bem completo."
- **Páginas `/parceiros` (e subpáginas):**
  - A conversa do Maurício usa o **guia do programa** (`guia-parceiros-publico.ts`), não o vendedor de lojas.
  - Motor guiado, **sem IA externa**, com os números das regras e da configuração (`fatosDosParceiros`).
  - Assuntos: como funciona, quanto ganho por perfil, criador × vendedor × agência, níveis com a % de cada perfil, simulação (1, 3, 5 ou 10 lojas por mês, ou "se eu indicar N lojas"), bônus, Black, como e quando recebo (garantia, mínimo e Pix), estorno e cancelamento, custo (grátis, sem meta), atribuição (link, cupom, CRM), argumentos de venda, regras, painel, cadastro e falar com uma pessoa.
  - Conversa própria (não mistura com a da home); cápsula e campo de texto próprios.
  - A conversa continua aparecendo no CRM ao vivo do Master.
- **Painel do parceiro:**
  - O Maurício passou a existir para o parceiro da E-commerce (botão "Agente" no topo e Ctrl+J).
  - Ganhou o **manual do parceiro** (`manual-parceiro.ts`): 36 guias passo a passo em modo manual (offline).
    - Rotina: 20 minutos por dia, primeira semana até a 1ª venda, Início.
    - Divulgação: link, link por canal, QR code, cupom, mensagem do WhatsApp, plano de conteúdo de 4 semanas, rota de visitas no Brás, clientes da agência.
    - Venda: argumentos, objeções, plano certo, atacado, migração, demonstração.
    - CRM: contatos, diagnóstico, proposta, catálogo comercial.
    - Acompanhamento: indicados, teste acabando, retenção.
    - Ganhos: comissão, níveis, desafio e avisos, bônus do vendedor, Black, saque, garantia e estorno.
    - Regras: atribuição, o que não pode, inatividade, selo de agência, perfil.
  - Na abertura aparecem 8 guias e "Todos os guias". A busca entende o jeito que o parceiro pergunta (teste com frases reais).
- **Correção:** o cartão "É agência? Ganhe…" do painel mostrava 30% + 15% fixo no código. Agora lê a regra de agência vigente (50% + 25%).

## D254 — Revisão visual: Maurício encaixado na moldura do painel (borda contínua) e alinhamentos (2026-11-05)
- **Pedido do dono:**
  - "Os prints revelam alguns erros no alinhamento e falhas no design."
  - "No painel, o chat precisa preservar a borda superior para dar uma sensação de borda infinita e continuidade."
- **Maurício nos painéis (capa: Master, lojista, parceiro), em telas de 1100 px ou mais:**
  - A faixa superior fica inteira.
  - O Maurício encaixa logo abaixo dela, como a última parte da moldura: a borda de cima corre contínua do menu ao Maurício, e o canto amplo passa para a direita dele.
  - O conteúdo encolhe ao lado.
  - Antes, o painel era desenhado fora da moldura (portal no `<body>`), a regra de encaixe nunca valia, e a faixa inteira era espremida. Agora a regra usa `:has()`.
- **Conteúdo que se adapta ao espaço real (container queries), não à largura da tela:**
  - abertura do painel do parceiro (link embaixo quando falta espaço);
  - pulso de números (`OperationalPulse`: 2 colunas quando apertado, 4 quando cabe).
- **Páginas públicas:**
  - `.ec-cabecalho` zerava o recuo lateral (`padding: … 0 …`) e anulava o `px-4`. O texto encostava na borda no celular e com o Maurício aberto. Agora só o recuo vertical é do estilo.
  - Com o Maurício aberto em telas de 1100 a 1599 px, o menu do site vira o compacto, em vez de cortar na direita.
  - Seletor de perfil de `/parceiros`: abaixo do selo, e no celular os 3 perfis cabem numa linha.
- **Conferido:**
  - capturas do painel do parceiro e do Master com o Maurício aberto;
  - `/parceiros` com o Maurício, em 390 px e em 1024 px;
  - sem rolagem lateral.

## D255 — Celular no padrão da referência: Maurício em tela cheia e menu flutuante (2026-11-05)
- **Pedido do dono (com capturas da Hostinger):**
  - "No mobile quero que o chat abra completo, seguindo as referências."
  - "O menu fica meio suspenso também e dá uma qualidade diferente."
- **Painéis com capa (Master, lojista, parceiro), no celular (até 980 px):**
  - **Sai a barra de atalhos de baixo.**
  - **Entram, flutuando embaixo,** um botão redondo de menu e, ao lado, a pílula "Pergunte ao Maurício…", que abre o agente.
    - O botão de menu e o do agente saíram da faixa, que fica mais limpa.
    - Os flutuantes são renderizados no `<body>`, acima da gaveta.
  - **O menu abre como gaveta logo abaixo da faixa** (a faixa continua à vista), com o canto amplo da moldura, o item ativo em pílula branca e o fundo escurecido só abaixo da faixa.
  - **O botão redondo vira o X** para fechar; Esc também fecha.
- **Maurício (painel e site):**
  - Em tela cheia no celular: cabeçalho limpo com seta para baixo, sem linhas divisórias, e a pílula de pergunta embaixo.
  - Na abertura, em todas as telas:
    - título grande;
    - **um destaque em cor** (o 1º guia, com o 1º passo);
    - **as demais sugestões num cartão único com ícones e divisórias**;
    - "Todos os guias".
  - As respostas do Maurício vêm em balão cinza.
- **Roteiros de conferência:** `e2e/commerce-glass-qa.mjs` e `e2e/commerce-motion-video.mjs` usam o novo botão "Abrir menu".

## D256 — O padrão do chat vale para todo o sistema (2026-11-05)
- **Pedido do dono:** "Esse racional de correção visual do chat precisa se estender para todo o sistema, e não somente em parceiros."
- **Onde vale o padrão (D254 + D255):**
  - Maurício no Master, no lojista e no parceiro;
  - vendedor/guia nas páginas públicas;
  - **Ajuda da equipe NextLevel**, no painel do lojista;
  - **chat da loja virtual**, para o cliente final.
- **No computador:**
  - O encaixe na moldura (borda contínua) passou a valer para **qualquer** coluna lateral (`html:has(.ia-dock)`). Antes, só valia quando o Maurício abria; a Ajuda ficava por cima do conteúdo.
  - Com uma coluna aberta, os flutuantes do celular somem.
- **No celular:**
  - Ajuda e chat da loja abrem em tela cheia, com cabeçalho limpo e seta para baixo, sem linhas divisórias, e a pílula de pergunta embaixo.
  - Respostas em balão.
- **Chat da loja virtual:**
  - Na abertura, "Como comprar" em destaque e os demais assuntos num cartão único com divisórias.
  - Cores neutras, para combinar com qualquer tema de loja.
- **Fica de fora:** as telas de Atendimento (Master e lojista) são páginas inteiras de conversa, não colunas de chat.

## D257 — AT0 do atacado: dados e motor único de preço (2026-11-05)
- **Prompt:** `docs/prompts/atacado-nextlevel-ecommerce.md`, fase AT0.
- **Dados (migração 0083, aditiva):**
  - `store_products`:
    - `wholesale_price_cents`: preço de atacado por peça, nulo = sem atacado;
    - `min_qty_per_model`: padrão 0;
    - `multiple_of`: padrão 1.
  - `product_packs`:
    - `kind`: GRADE_FECHADA ou PACOTE_SORTIDO;
    - `color_mode`: FIXA, SORTIDA ou POR_COR;
    - `color` e `position`.
  - `product_variants.color`: nula = "cor única", que vale para todos os produtos antigos.
  - Tabela `store_wholesale_rules`: MIX_PECAS, MIX_VALOR ou MIX_CATEGORIA, até 6 por loja, uma por tipo e por coleção.
  - Provado sobre um banco no formato anterior: as colunas novas entram sem erro.
- **Motor único** `precoDoCarrinho` (`src/lib/finance/atacado-preco.ts`, puro). Usado:
  - no **pedido** (`createOrder`);
  - na **proposta** (`priceLines`);
  - no **carrinho do navegador** (`priceCartLines`).
- **Regras do motor:**
  - grade e pacote têm preço próprio e **contam peças para o mix**;
  - peça avulsa pega o menor entre varejo, faixa do modelo (D52) e preço de atacado, este quando um gatilho está ativo (mix de peças, mix de valor, mix da coleção ou cliente aprovado);
  - nunca acima do varejo nem abaixo do piso (custo e mínimo);
  - o mix por valor usa o subtotal de varejo;
  - caiu abaixo do mínimo, volta ao varejo.
- **Garantias (testes):**
  - sem regra e sem preço de atacado, o resultado é **idêntico** ao preço por quantidade de antes (os testes da D52 continuam passando);
  - em 500 carrinhos aleatórios, o navegador dá o mesmo total que o motor, e o preço fica entre o piso e o varejo;
  - pedido e proposta aplicam o mix de 6 peças da loja toda.
- **SuperDrop (D216):** loja de rede não tem regras nem preço de atacado (recusado no servidor) e o pedido dela não muda.
- **Fica para a AT1:** a tela do lojista para o preço de atacado e as regras de mix, e os limites por plano. Hoje as regras só podem ser criadas pelo domínio, então nada muda para o cliente até lá.

## D258 — AT1 do atacado: painel do lojista e travas por plano (2026-11-05)
- **Prompt:** `docs/prompts/atacado-nextlevel-ecommerce.md`, fase AT1.
- **Tela `/merchant/atacado`** (reescrita):
  - chips do plano com o que ele libera e link "Mudar de plano";
  - **regras do mix** da loja (peças, valor, coleção) com o que falta para cada uma;
  - pedido mínimo (como antes);
  - **por produto:** preço de atacado por peça, faixas por quantidade (D52) e **grades** (fechada por cor, sortida ou pacote sortido).
- **Travas por plano** (`LIMITES_ATACADO`, só lojas Commerce; outras contas não têm trava):
  - Start: 3 faixas, 1 grade por produto, 1 regra de mix (só peças), sem pacote sortido;
  - Pro: 5 faixas, 4 grades, 3 regras (peças e valor), com pacote;
  - Scale: 5 faixas, grades sem limite prático, 6 regras de todos os tipos.
  - **Quem já tem mais continua:** ao cair de plano nada é apagado; a trava só vale para criar ou aumentar.
- **Grades:** só em produto de fornecimento próprio; preço do lote nunca abaixo do piso × peças; criar grade liga a venda em grade do produto; grade já vendida não pode ser removida.
- **Validações no servidor** (ações em `src/app/actions/atacado.ts`): preço de atacado entre o piso e o varejo; regra duplicada é recusada antes do limite do plano.
- **SuperDrop (D216):** loja de rede continua sem atacado; nada muda nela.
- **Testes:** `tests/atacado-preco.test.ts` ("AT1: travas por plano e grades").
- **Fica para a AT2:** box do produto novo na loja e barra do mix no carrinho (as regras passam a ir para o navegador).

## D259 — AT2 do atacado: box novo, card, carrinho e checkout (2026-11-06)
- **Prompt:** `docs/prompts/atacado-nextlevel-ecommerce.md`, fase AT2.
- **Box do produto** (`buy-box.tsx`):
  - abas por formato (peça avulsa, cada grade e cada pacote), cada uma com o preço por peça;
  - preço em destaque **por peça**, com o varejo riscado quando o comprador já está no atacado ou na faixa;
  - **escada de preço** (varejo, faixas do modelo, atacado com o gatilho da loja, grades) com "seu preço" marcado;
  - **barra do mix** que soma o carrinho e a escolha atual;
  - grade com a cor, "cores sortidas" ou "modelos e cores sortidos, a critério da loja";
  - total e economia da escolha antes de adicionar.
- **Card da vitrine:** selo do formato ("Grade 12", "Pacote 20", "Mix 6 peças", "12+ peças") e "a partir de R$ X a peça no atacado".
- **Carrinho e checkout:** barra do mix, "Você economizou com o atacado", varejo riscado na linha e nome da grade com a cor.
- **Mesmo preço do pedido:** o navegador usa o motor único (`precoDoCarrinho`) com as regras da loja e o preço de atacado vindos do servidor a cada página (carrinhos antigos ficam certos). O atacado só aparece quando alguma regra da loja libera. O piso já vem aplicado; o custo nunca vai para o navegador.
- **SuperDrop (D216):** loja de rede recebe o box, o card e o carrinho de antes (sem escada, sem mix, só a primeira grade).
- **Testes:** `tests/atacado-vitrine.test.ts` (escada, card, gatilhos e vitrine = pedido cobrado, inclusive com o custo subindo depois). Acessibilidade (axe) sem erro no produto e no catálogo.
- **Fica para a próxima fase:** o lojista escolher se o card destaca varejo ou atacado; o botão "Adicionar ao pedido" para loja só de atacado; "Pedir pelo WhatsApp" com a grade.

## D260 — Parceiros: regra única 20% / 24% / 28%, sem Black e sem bônus (2026-11-06)
- **Pedido do dono:** simplificar o programa: uma regra só para todo mundo, sem Black nem benefício diferente, com base nos concorrentes e um pouco à frente deles. Não havia parceiro nem venda feitos, então a regra vale para todos.
- **Regra (`revisao-d260.ts`, `niveis-regras.ts`):**
  - o mesmo percentual para criador, vendedor e agência, sobre **toda mensalidade paga, desde a 1ª**, enquanto o cliente ficar;
  - **20%** até 9 clientes ativos, **24%** com 10 e **28%** com 25, sobre a carteira inteira;
  - o nível sobe na hora e só desce depois de 2 meses abaixo do mínimo (como na D249);
  - no plano anual, o percentual vale sobre o valor pago no ano.
- **Saem:**
  - os 50% da 1ª mensalidade;
  - as regras por tipo e a Agência Elite;
  - o Diamante (quem estivesse nele recebe 28%);
  - o bônus do representante (R$ 30 e R$ 100);
  - os 100% na Black;
  - o dinheiro do desafio do mês, que vira só reconhecimento (ranking e destaque).
  - O histórico das regras antigas fica guardado.
- **Mais fácil que os concorrentes:**
  - saque mínimo de R$ 50;
  - link válido por 90 dias;
  - aplicado uma vez nos bancos que já tinham a configuração (o Master continua podendo mudar).
- **Concorrentes (sites oficiais, 06/11/2026):**
  - Nuvemshop Especialistas: 20% a partir do Silver, e 0% no nível de entrada;
  - Nuvemshop Associados: as 2 primeiras mensalidades;
  - WBuy: 10%, 15% e 20% por volume (100+ indicações), exige CNPJ;
  - Tray: até 20%, sem critério publicado.
- **Página de parceiros:**
  - frase única, escada de 3 níveis e simulador igual ao cálculo real;
  - calculadora **"Compare o seu programa"**, com a mesma mensalidade para todos, link de cada fonte e data;
  - com 2 lojas por mês em 24 meses: NextLevel R$ 23.661, Nuvemshop Especialistas até R$ 17.640, Associados R$ 13.818 e WBuy R$ 8.820.
- **Também:**
  - FAQ, Maurício (guia público e manual do painel), painel do parceiro, cadastro e CRM do Master;
  - termos próprios da E-commerce: antes a página mostrava os termos do SuperDrop, com meta mensal e taxa;
  - o vendedor já entra como representante, porque o tipo só organiza o CRM.
- **Correção junto:** as revisões de comissão (D220 e D226) eram reaplicadas a cada inicialização, porque olhavam só a última versão. Agora cada revisão entra uma vez só, e um teste garante isso.
- **Testes:**
  - `comissoes-d226`: regra vigente igual para todos, sem Black, anual e idempotência;
  - `niveis-parceiro`: 20%, 24% e 28%, e a rotina sem bônus;
  - `captacao-parceiros`: simulador e comparativo;
  - `guia-parceiros`.

## D261 — Comparação com concorrentes: tom agressivo, sempre com fato (regra fixa do dono) e página de parceiros com mais tecnologia (2026-11-06)
- **Regra do dono, que vale para sempre:**
  - nas comparações, o tom é **agressivo**, nunca neutro: expor o ponto fraco de cada concorrente e amassar o argumento deles;
  - todo golpe se apoia num fato publicado no site oficial do concorrente, com o link e a data;
  - sem ofensa pessoal, sem inventar e sem "mais barato".
  - Registrada na skill `pagina-de-vendas` (passo 5).
- **Página de parceiros** (`captacao-interativa.tsx`, `arena.css`):
  - topo com o "console" da regra (20%, depois 24% e 28%, nenhum nível para começar, saque a partir de R$ 50, link de 90 dias, CPF ou CNPJ);
  - **raio-x dos concorrentes**, com ponto fraco, fato, "ver a regra deles" e a resposta NextLevel:
    - Nuvemshop Especialistas: 0% de recorrência no nível de entrada;
    - Nuvemshop Associados: paga 2 mensalidades e acabou;
    - WBuy: 10% para começar e 20% só com 100 lojas;
    - Tray: "até 20%" sem a régua publicada.
  - escada em degraus, simulador escuro e a disputa "Só um paga de verdade", com o valor "a mais que o 2º colocado".
- **Teste:** cada ponto fraco tem fonte oficial e fato, e nenhum texto diz "mais barato".

## D262 — [E-commerce] Parceiros: comparação contra Shopify (destaque), Nuvemshop, Tray e WBuy, com a virada e o CPF como arma (2026-11-06)
- **Correção:**
  - em alguns cenários a página afirmava algo falso: com 5 lojas por mês em 12 meses, a Nuvemshop Associados soma mais;
  - o título e o "a mais que o 2º colocado" agora seguem a conta;
  - quando quem paga tudo no começo está na frente, a página mostra **o mês da virada** ("No 13º mês, a gente passa e não para mais").
- **Escolhas do dono:**
  - **Loja Integrada fica fora** (paga 35% vitalício + R$ 125, com CNPJ);
  - **Shopify em destaque**;
  - Tray com 20%, o teto da página Tray Partners.
- **Concorrentes** (`captacao-regras.ts`, sites oficiais em 06/11/2026):
  - **Shopify:** US$ 25 por loja do Brasil, uma vez só (tabela oficial do programa de afiliados; os US$ 150 do anúncio são para outros países). Convertido pelo PTAX de venda do Banco Central de 05/11/2026 (R$ 5,4621).
  - **Nuvemshop:** um cartão só, com o programa que mais paga no prazo (Especialistas ou Associados).
  - **Tray:** 20%.
  - **WBuy:** 10% / 15% / 20%.
- **CPF como diferencial:** seção "Recebe no CPF. Sem abrir empresa, sem MEI.", com o que os concorrentes publicam:
  - WBuy exige CNPJ e nota fiscal;
  - Nuvemshop Associados recomenda CNPJ ou MEI para a nota.
  - O topo também fala do CPF.
- **Teste:** `captacao-parceiros` cobre a ordem, os valores, o programa da Nuvemshop, a virada, as fontes e a ausência da Loja Integrada.

## D263 — [E-commerce] Parceiros em duas frentes: Indicações pelo CPF (5 pontos a menos) e Parceiros com CNPJ; agência com benefícios exclusivos; comparação sempre a nosso favor (2026-11-06)
- **Pedido do dono:**
  - quem recebe no CPF entra num **Programa de Indicações**, uma 4ª frente com **5 pontos a menos em cada nível**;
  - as agências têm vantagens: "benefícios exclusivos", sem dizer quais;
  - falar abertamente das barreiras dos concorrentes (nota fiscal para pagar comissão; o advogado do dono foi consultado);
  - mudar a perspectiva para a NextLevel sempre aparecer vencendo.
- **Regra (`niveis-regras.ts`, `corporate-commissions.ts`):** a comissão segue o documento do cadastro.
  - **CPF:** 15% / 19% / 23% (`DESCONTO_CPF_BPS` = 500);
  - **CNPJ** (criador, vendedor, agência): 20% / 24% / 28%.
  - Agência parceira só com CNPJ: o cadastro recusa agência com CPF e indica o Programa de Indicações.
- **Página:**
  - 4 perfis: Indico pelo CPF, criador, vendedor e agência;
  - página nova `/parceiros/indique`;
  - console com a regra da frente, incluindo "nota fiscal p/ receber: não precisa";
  - a agência aparece com "benefícios exclusivos", sem detalhar;
  - seção **"Eles exigem nota fiscal para te pagar. Aqui, não."**;
  - escada com as duas frentes.
- **Barreiras dos concorrentes (fontes oficiais, 06/11/2026):**
  - WBuy: só com CNPJ, com nota fiscal (NFS-e) anexada em cada saque;
  - Nuvemshop: nota fiscal para resgatar; sem CNPJ, só por RPA com retenção de INSS, IRRF e ISS;
  - Tray: o cadastro pede CNPJ;
  - Shopify: paga em dólar, US$ 25 uma vez.
- **Nova perspectiva da comparação:**
  - cada frente contra o programa equivalente: indicação (CPF) contra Shopify Afiliados e Nuvemshop Associados; parceiro (CNPJ) contra Nuvemshop Especialistas, Tray e WBuy;
  - a métrica é a **renda que entra por mês** no 18º, 24º ou 36º mês, a renda que se repete;
  - teste: em todos os cenários mostrados (1 a 30 lojas por mês, os 3 planos, as duas frentes), a NextLevel paga mais por mês.
- **Também:** Maurício (guia e manual), FAQ, termos da E-commerce e painel do parceiro, que mostra o percentual da frente dele.

## D264 — [Grupo] Base de conhecimento sempre ao vivo: toda atualização a alimenta (2026-11-06)
- **Pedido do dono:** "sempre que houver atualizações, alimente a base de conhecimento".
- **Regra fixa** (registrada no `CLAUDE.md` e na skill `publicar`): toda mudança publicada atualiza a base de conhecimento da equipe (`docs/conhecimento/BC0-INVENTARIO.md`; na BC1, a tela "Aprender" do Master), com a regra, o valor, o estado e a decisão.
- **Garantia:** o teste `tests/base-conhecimento.test.ts` falha se uma decisão desde a D257 não estiver citada na base.

## D265 — [Grupo] Base de conhecimento: BC0 aprovada e trilhas por função (2026-11-06)
- **O dono aprovou o inventário** (`docs/conhecimento/BC0-INVENTARIO.md`) e a divisão:
  - Comercial: trilhas 1 a 4;
  - Suporte: 1, 4 e 5;
  - Financeiro e Contador: 1, 3 e 6;
  - Conteúdo: 1 e 7;
  - dono: todas;
  - a trilha 1 é obrigatória para todos.
- "Cliente indica = 1 mês grátis" entra como "em breve" até ser ligado.
- **Próxima fase:** BC1, a tela "Aprender" no Master.

## D266 — [Grupo] BC1: tela "Aprender" no Master, com aulas ao vivo, trilhas por função, busca e Novidades (2026-11-06)
- **Onde:** Master → **Aprender** (`/master/aprender`), no menu logo depois de Agora, liberada para toda a equipe (`master-equipe.ts`).
- **Trilhas por função** (D265): cada pessoa vê as trilhas da sua função; o dono vê todas; a trilha 1 é obrigatória.
- **Aulas ao vivo** (`src/lib/conhecimento/aulas.ts`): 7 trilhas com o que é, a regra, um exemplo, o que dizer e o que nunca dizer, um botão para a tela certa e a decisão de origem.
  - Todo número vem de `fatosAoVivo`: preços do catálogo, preços depois da Black, benefícios por plano, cotas de IA, teste grátis, régua de parceiros CPF e CNPJ, saque, garantia, link, limites do atacado e barreiras e taxas dos concorrentes.
  - Teste: as aulas não têm valor em reais nem percentual escrito à mão, e mudam quando os fatos mudam.
- **Busca:** sem acento, nas aulas das trilhas da pessoa.
- **Novidades:** as 40 decisões mais recentes, geradas de `DECISIONS.md` por `scripts/gerar-novidades.mjs`, que roda antes do build. Um teste garante que estão em dia.
- **Fica para a BC2:** perguntas por aula, progresso por pessoa e o painel "quem está pronto".

## D267 — [Grupo] BC2: perguntas por aula, progresso por pessoa e painel "quem está pronto" no Aprender (2026-11-07)
- **Perguntas:** cada uma das aulas tem 3 perguntas rápidas no fim (`src/lib/conhecimento/perguntas.ts`), montadas dos mesmos `fatosAoVivo`: se o preço ou a comissão muda, a resposta certa muda junto. Teste: nenhum valor em reais ou percentual escrito à mão nas perguntas.
- **Correção no servidor:** a resposta certa não vai para o navegador. A aula fica **concluída** quando a pessoa acerta as 3; errar depois não desfaz. Cada tentativa é contada.
- **Progresso por pessoa:** tabela nova `aprender_progresso` (migração 0084). Na tela, cada trilha mostra "x de y aulas", uma barra e um sinal de feito em cada aula; no topo, o progresso total e o selo "Pronto".
- **Painel do dono:** aba **Equipe** no Aprender, só para o dono. Mostra cada pessoa ativa, a função, as trilhas dela com a barra e "Pronto" quando terminou todas.
- **Trilha atribuída no convite:** a trilha vem da função escolhida ao cadastrar a pessoa; a tela Equipe agora mostra quais trilhas cada função recebe.
- **Em destaque:** quem tem aula pendente vê um card na tela Agora ("Sua trilha no Aprender: x de y aulas").
- **Fica para a BC3:** o Maurício da equipe respondendo pela base e o aviso "mudou" quando uma decisão nova mexe numa aula.

## D268 — [E-commerce] AT3 do atacado: grade livre (cor × tamanho), mínimo por modelo e múltiplos (2026-11-07)
- **Prompt:** `docs/prompts/atacado-nextlevel-ecommerce.md`, fase AT3 (retomada a pedido do dono em 07/11).
- **Cores do produto** (Atacado → produto → Cores): o lojista dá nome à cor das peças que já tem e cadastra cores novas. Cada cor nova entra com os mesmos tamanhos e estoque zero (o estoque é lançado depois). Nenhuma cor existente é apagada. Até 12 cores por produto, em todos os planos.
- **Grade livre** (Atacado → produto → Grade livre): mínimo de peças do modelo e venda em múltiplos (ex.: mínimo 12, de 6 em 6). O mínimo precisa fechar no múltiplo. Plano **Pro e Scale**; quem já tem e cai de plano continua com a regra, só não aumenta (D247).
- **Na loja:** produto com cores ou com grade livre mostra a **matriz cor × tamanho** no lugar do seletor de tamanho. O contador soma o que já está no carrinho e mostra quanto falta para o mínimo ou para fechar o múltiplo; o botão só libera com a grade completa. O preço vem do mesmo motor do pedido.
- **Carrinho e checkout:** aviso "Complete a grade para fechar o pedido" e o botão de pagamento travado enquanto faltar.
- **Pedido:** o servidor recusa pedido da loja virtual com a grade incompleta (pedido do balcão não é barrado, como o pedido mínimo). A linha do pedido grava cor e tamanho ("Preto · Tam. M"); estoque, lista de produtos e pedido do balcão mostram a cor.
- **Pacote sortido** já estava no ar desde a AT1 (D258, plano Pro).
- **SuperDrop (D216):** loja de rede não tem grade livre nem cores próprias; nada muda nela.
- **Testes:** `tests/atacado-preco.test.ts` (conta do que falta para qualquer quantidade, travas por plano, cores, pedido recusado e aceito).
- **Próxima fase:** AT4 (entrega por excursão e retirada, romaneio por grade, recompra rápida).

## D269 — [E-commerce] CX0 e CX1: caixa do Master com abas Hoje, Semana e Lançamentos (2026-11-07)
- **Prompt:** `docs/prompts/caixa-balcao-executivos-de-venda.md`, fases CX0 e CX1. Todas as decisões do prompt foram aprovadas pelo dono em 07/11 ("tudo aprovado").
- **Dados (migração 0085, aditiva):**
  - `caixa_dias`: um por data de São Paulo, com saldo inicial, contado, esperado, diferença e motivo;
  - `caixa_lancamentos`: entrada ou saída, meio, origem, loja, executivo ou parceiro, descrição; estorno com motivo;
  - `caixa_historico`: abrir, fechar, reabrir, lançar, editar e estornar, com o antes, o depois e o motivo;
  - `partners.executivo`: marca o executivo de venda (usado na CX3).
- **Meios:** dinheiro, Pix, cartão na maquininha, transferência, boleto, outro e Mercado Pago.
- **Origens:** assinatura, serviço, prestação de contas de executivo, sangria, reforço de troco, pagamento de comissão, ajuste e outro. Sangria e reforço são sempre em dinheiro; cada origem tem o seu sentido (entrada ou saída).
- **Regras** (`src/lib/finance/caixa-regras.ts`, puras): data e semana no fuso de São Paulo (segunda a domingo); resumo por meio sem os estornados; dinheiro esperado na gaveta = saldo inicial + entradas em dinheiro − saídas em dinheiro.
- **Tela Master → Caixa** (`/master/receita/caixa`), só para o dono e a função Financeiro:
  - **Hoje:** abrir com o troco (sugere o contado do último fechamento), números do dia, total por meio, novo lançamento, editar e estornar cada um, fechar contando a gaveta, histórico do dia; navegar por dias;
  - **Semana:** os 7 dias com saldo, meios e diferenças; total da semana por meio;
  - **Lançamentos:** período com filtros por meio e origem.
- **Mercado Pago entra sozinho:** as cobranças pagas (planos e faturas) aparecem no dia como "Mercado Pago", sem mexer na gaveta e sem poder ser lançadas à mão (evita contar em dobro).
- **Travas:** dia fechado não recebe nem muda lançamento; só o dono mexe, e o dia volta a abrir com motivo registrado. Diferença no fechamento exige motivo.
- **Testes:** `tests/caixa.test.ts` (fuso, semana, resumo, permissões, abrir/lançar/fechar/reabrir, edição e estorno com histórico, semana e filtros, Mercado Pago automático).
- **Próxima fase:** CX2 (receber manualmente renovando a assinatura e liberando a loja; painel de assinaturas).

## D270 — [E-commerce] CX2: receber assinatura à mão, formas de pagamento da NextLevel e painel de assinaturas (2026-11-07)
- **Prompt:** `docs/prompts/caixa-balcao-executivos-de-venda.md`, fase CX2.
- **Formas de pagamento da NextLevel** (dono, 07/11):
  - checkout online, que entra sozinho no caixa;
  - maquininha do Mercado Pago com o Mauricio;
  - maquininha com os vendedores;
  - Pix na chave do CNPJ da NextLevel Marketing Ltda;
  - dinheiro: com o Mauricio vai para a gaveta; com o vendedor fica com ele até a prestação de contas (CX3).
  - Os meios antigos (cartão, transferência, boleto, outro) ficam só para leitura.
- **Conta de destino** (dono, 07/11), obrigatória em todo lançamento e escolhida numa lista:
  - dinheiro em espécie com o Mauricio;
  - conta Mercado Pago do checkout online (CNPJ Mega Tron);
  - Pix na conta CNPJ da NextLevel no Itaú;
  - Pix na conta CPF do Mauricio Ramos no Nubank.
  - A forma de pagamento sugere a conta e limita as opções: dinheiro só vai para a gaveta do Mauricio; maquininha e checkout online caem no Mercado Pago; o Pix escolhe Itaú, Nubank ou Mercado Pago.
  - O dia e a semana mostram o total por conta.
- **Toda entrada é ligada ao que foi pago** (dono, 07/11):
  - **assinatura:** só pelo "Receber assinatura", ligada à fatura da loja;
  - **template:** escolhido do catálogo, com a loja; o template é liberado na loja na hora;
  - **serviço adicional:** escolhido do catálogo (loja pronta, migração, marketing, consultoria, adicionais, anúncios);
  - **outros:** com a descrição obrigatória.
  - Um recebimento de assinatura não vira outro tipo na edição (estorna e lança de novo).
- **Correção:** editar um lançamento sem mexer na descrição não apaga mais a descrição.
- **Receber assinatura** (Caixa → Hoje), só para o dono e o Financeiro, com o caixa de hoje aberto. O pagamento manual usa o mesmo caminho do online:
  1. troca o plano ou o ciclo, se pedido;
  2. gera a fatura da assinatura e a paga;
  3. renova o período e libera a loja;
  4. gera a comissão pela regra D260;
  5. lança no caixa com a forma de pagamento.
- **Regras do recebimento:**
  - vazio = valor da tabela; menor = desconto, sempre com motivo; maior que a tabela é recusado;
  - quem vendeu vira a indicação da loja se ela ainda não tiver (via "EXECUTIVO"); a indicação de outro parceiro é respeitada.
- **Estornar recebimento:**
  - o lançamento sai das contas;
  - a fatura é cancelada;
  - a comissão em garantia é anulada; a já liberada vira débito no saldo;
  - o período pago volta.
- **Aba Assinaturas:**
  - filtros: todas, vencem em 7 dias, vencidas, em teste, pagas à mão e sem plano;
  - ações por loja: estender vencimento (até 90 dias), trocar plano ou ciclo, cancelar no fim do período, sempre com motivo e na auditoria financeira;
  - histórico da loja com cada pagamento (forma, quem recebeu, quem vendeu) e estorno.
- **Código:**
  - `src/lib/domain/assinaturas-master.ts`;
  - a troca de plano do lojista e a do Master usam a mesma função (`trocarPlanoDaAssinatura`).
- **Testes:** `tests/caixa.test.ts` (dinheiro no balcão com comissão do executivo, desconto, Pix e anual, estorno completo, painel e ações).
- **Próxima fase:** CX3 (executivos de venda: venda em dinheiro na rua, recibo, dinheiro com o executivo e prestação de contas).

## D271 — [E-commerce] BG1: bônus gamificado para parceiros online e executivos de rua, com teto de margem (2026-11-07)
- **Pedido do dono (07/11):**
  - bônus semanais e mensais que não prejudiquem a margem;
  - mais benefício para quem se envolve mais;
  - bonificação diferente para parceiros online e de rua;
  - ativar já.
- **Muda a D260:** o bônus em dinheiro volta, mas só por **campanhas ligadas pelo dono**.
- **Racional e prompt mestre:** `docs/prompts/bonus-gamificado-parceiros-executivos.md`:
  - margem por plano com comissão de 20% e de 28%;
  - prova de que comissão + bônus ficam abaixo de 35% da receita do 1º ano;
  - gatilhos de engajamento;
  - fases BG1 a BG4.
- **Regras** (`src/lib/finance/bonus-regras.ts`, `src/lib/domain/bonus.ts`):
  1. conta só a 1ª venda de cada loja (linha SALE da comissão); renovação nunca dá bônus;
  2. apuração só **depois da garantia** das vendas do período; estornada ou cancelada na garantia não conta; venda para o próprio CPF/CNPJ não conta;
  3. pontos pelo valor pago (1 ponto = 1 mensalidade do Start pela tabela de hoje; Pro e Scale proporcionais; anual × 1,2); desconto reduz os pontos;
  4. **teto de custo por loja** somando as campanhas ativas do público: online 50% e rua 75% de uma mensalidade, recusado ao salvar;
  5. **orçamento por período**: quem fez mais pontos é apurado primeiro; o excedente fica registrado como "sem orçamento", sem pagamento.
- **Pagamento:**
  - o bônus entra como lançamento "Bônus" no saldo do parceiro, liberado;
  - é idempotente (um prêmio por campanha, parceiro e período);
  - é apurado na rotina diária dos parceiros.
- **Campanhas padrão ativas**, que cabem no teto também na Black (Start a R$ 57):
  - online: "Sprint da semana" (2 → R$ 15, 4 → R$ 34) e "Produção do mês" (3 → R$ 30, 6 → R$ 75, 12 → R$ 190, 25 → R$ 450);
  - rua: "Ritmo da semana" (3 → R$ 40, 5 → R$ 80, 8 → R$ 140) e "Meta do mês" (10 → R$ 190, 20 → R$ 440, 35 → R$ 850);
  - custo máximo por loja Start: online 40% e rua 62% de R$ 67 (46% e 73% de R$ 57).
- **Telas:**
  - Master → **Bônus e metas** (`/master/partners/bonus`): campanhas por público, faixas, custo por loja contra o teto, orçamento, pago até hoje, "em jogo agora" e quem está no jogo; editar e pausar só o dono e o Financeiro;
  - painel do parceiro: cartão **"Seus bônus"** com pontos, barra com as faixas, "falta X para R$ Y", destaque de quase lá, contagem regressiva e pontos em garantia.
- **Dados:** migração 0087 (`bonus_campanhas`, `bonus_premios`).
- **Testes:** `tests/bonus.test.ts` (pontos, faixas, teto inclusive na Black, períodos, garantia, rua × online, próprio CNPJ, orçamento, idempotência, permissões, progresso).
- **Próximas fases:** BG2 (missões e selos sem dinheiro, sequência e ranking), BG3 (com a CX4, painel do executivo e registro de visitas), BG4 (relatório de retorno).

## D272 — [E-commerce] BG2: missões da semana, sequência, selos e ranking (engajamento sem dinheiro) (2026-11-07)
- **Prompt:** `docs/prompts/bonus-gamificado-parceiros-executivos.md`, fase BG2. O dono pediu as fases "um de cada vez" (07/11).
- **Regras** (`src/lib/finance/engajamento-regras.ts`, puras) **e cálculo** (`src/lib/domain/engajamento.ts`), tudo com o que já existe (cliques no link, cadastros indicados e 1ª venda de cada loja), sem tabela nova:
  - **missões da semana por público:**
    - online: 10 cliques no link, 1 cadastro, 1 venda, 1 Pro ou Scale;
    - rua: 3 cadastros, 3 vendas, 1 Pro ou Scale, 1 anual;
    - as missões de visita da rua entram na BG3;
  - **sequência:** semanas seguidas (segunda a domingo) com pelo menos uma venda, mais o recorde; a semana atual vazia não quebra a sequência até acabar ("em risco");
  - **9 selos:** primeira venda, 5 no mês, primeiro Scale, fechou anual, 4 semanas seguidas, semana completa, cliente fiel (6 pagamentos), Prata e Ouro;
  - **ranking:** da semana e do mês por público (online e rua separados), pelos pontos do bônus (inclui os em garantia), com a posição, os 5 primeiros (primeiro nome) e quanto falta para passar quem está acima.
- **Tela:** painel do parceiro → cartão **"Sua semana"**, abaixo de "Seus bônus":
  - missões com barra e dica;
  - "Semana completa!" com confete leve (some com "reduzir movimento");
  - sequência, ranking e grade de selos.
- **Sem dinheiro:** missão, selo e ranking são reconhecimento; o dinheiro continua só nas campanhas de bônus (D271), dentro do teto de margem.
- **Página pública "Comissões e bônus por produção"** (`/parceiros/comissoes`, pedido do dono em 07/11), com números lidos do sistema:
  - níveis CNPJ e CPF;
  - comissão estimada por plano e nível;
  - link, garantia e saque;
  - campanhas de bônus online ativas com as faixas;
  - pontos por plano (mensal e anual) e um exemplo;
  - as 6 regras do bônus;
  - as missões do painel.
  - Ligada a partir da captação e do programa. O FAQ "Tem bônus?" foi atualizado (antes dizia que não havia).
  - As campanhas dos executivos de rua não aparecem em público.
- **Testes:** `tests/engajamento.test.ts` (missões, sequência e recorde, ranking, online com cliques, cadastro e venda, rua com anual e Scale, rankings separados).
- **Próxima fase:** BG3, junto da CX4 (painel do executivo no celular, com registro de visitas alimentando missões e ranking de esforço).

## D273 — [E-commerce] CX3: executivos de venda, venda na rua com recibo e prestação de contas no caixa (2026-11-07)
- **Prompt:** `docs/prompts/caixa-balcao-executivos-de-venda.md`, fase CX3 (decisões aprovadas pelo dono em 07/11).
- **Executivo:**
  - parceiro do tipo vendedor marcado como executivo (`partners.executivo`), cadastrado **só pelo dono**;
  - mesma comissão do programa; bônus pelas campanhas da rua (D271).
- **Venda na rua** (painel do executivo, no topo):
  - ele escolhe a loja do cliente (indicada por ele ou ainda sem indicação), o plano, o ciclo e a forma (dinheiro ou maquininha);
  - o pagamento usa o mesmo caminho do online e do caixa (`pagarAssinaturaManual`): renova, **libera a loja na hora** e gera a comissão;
  - sai um **recibo** (código REC-XXXXXX) pronto para o WhatsApp do lojista;
  - loja indicada por outro parceiro é recusada.
- **Dinheiro com o executivo** (tabela `executivo_recebimentos`, migração 0088):
  - prazo de **2 dias úteis**; vencido, o executivo fica travado para nova venda em dinheiro (a maquininha continua liberada; a loja do cliente nunca é bloqueada);
  - a maquininha do vendedor cai no Mercado Pago e fica "a conferir".
- **Master → Executivos de venda** (`/master/partners/executivos`):
  - números: dinheiro na rua, atrasados, maquininha a conferir;
  - **prestações de contas**: "Receber agora" lança no caixa de hoje (dinheiro como prestação de contas na gaveta do Mauricio; maquininha como assinatura no Mercado Pago); estorno da venda ainda pendente;
  - a equipe: vendas da semana e do mês, comissão do mês, dinheiro com cada um, última prestação;
  - cadastro de executivo.
- **Caixa:** aviso no topo com o que está com os executivos e o link para receber.
- **Refatoração:** recebimento manual e estorno do caixa e da rua usam as mesmas funções (`pagarAssinaturaManual`, `desfazerPagamento`).
- **Testes:** `tests/executivos.test.ts` (prazo em dias úteis, recibo, cadastro só pelo dono, venda em dinheiro até o caixa, trava por atraso, maquininha, loja de outro parceiro, estorno).
- **Próxima fase:** CX4 (painel do executivo no celular, mais completo e motivador) com a BG3 (registro de visitas nas missões).

## D274 — [E-commerce] CX4 + BG3: painel do executivo no celular, registro de visitas, agenda, metas e feed da equipe (2026-11-08)
- **Prompts:** `docs/prompts/caixa-balcao-executivos-de-venda.md` (CX4) e `docs/prompts/bonus-gamificado-parceiros-executivos.md` (BG3). Autorizado pelo dono ("pode seguir").
- **Painel do executivo** (topo do painel de parceiro, só para executivo):
  - "Bom dia, Ana" (hora de São Paulo), **meta da semana** em barra (lojas pagas), comissão do mês e nível com quanto falta para o próximo (clientes ativos, D260);
  - **4 botões grandes:** Nova venda (vai à venda na rua), Registrar visita, Meu link (compartilhar ou copiar) e Mostrar a demonstração (galeria de temas);
  - **Minha agenda:** retornos combinados (vencidos em vermelho, WhatsApp e "feito" com 1 toque) e testes das lojas dele que acabam em até 7 dias;
  - **Visitas da semana:** ranking de esforço da equipe (só o primeiro nome, sem dinheiro);
  - **Argumentos de bolso:** taxa zero, preço a partir da tabela, loja pronta, atacado e as objeções "vou pensar", "já vendo no Instagram" e "é caro" (só o que é verdade no produto).
- **Registro de visita** (tabela `executivo_visitas`, migração 0089): loja, contato, WhatsApp, visita ou demonstração, resultado (gostou, pediu para pensar, não quis, cadastrou, fechou) e dia da volta. "Pediu para pensar" exige o dia da volta; loja de outro executivo é recusada; até 60 registros por dia.
- **Missões da rua (BG3):** saem "3 cadastros" e entram "10 visitas" e "5 demonstrações" (demonstração também conta como visita). Seguem as de vendas, plano maior e anual. Nada disso paga dinheiro (D272).
- **Master → Executivos de venda:**
  - **meta semanal** por executivo (só o dono; vazia = 1ª faixa da campanha semanal da rua, hoje 3);
  - visitas da semana no cartão de cada um;
  - **ranking da semana** (vendas, depois visitas) e **"O que a equipe fez"**: visitas, demonstrações e vendas mais recentes.
- **Testes:** `tests/executivos.test.ts` (saudação, meta, agenda, argumentos, visita com retorno, conclusão, missões, ranking, feed, meta só pelo dono) e `tests/engajamento.test.ts` (missões novas da rua).
- **Próximas fases:** BG4 (relatório de retorno do bônus) e CX5.

## D275 — [E-commerce] BG4: relatório de retorno do bônus, com sugestão automática de ajuste (2026-11-08)
- **Prompt:** `docs/prompts/bonus-gamificado-parceiros-executivos.md`, fase BG4. Autorizado pelo dono ("pode seguir nos próximos passos").
- **Onde:** Master → Parceiros → Bônus e metas → **Retorno das campanhas**, um cartão por campanha.
- **O que mostra** (só períodos já apurados: 8 semanas ou 3 meses):
  - lojas novas do público e lojas trazidas por quem ganhou o bônus;
  - receita recorrente nova dessas lojas por mês (anual dividido por 12);
  - custo do bônus, custo por loja e por ponto;
  - **em quantos meses a margem nova paga o bônus**, medida depois da comissão mais alta (28%, nível Ouro), para ser conservador;
  - tabela por período (lojas, premiados, custo, sem orçamento).
- **Sugestão automática** (o dono decide; o teto por loja continua valendo): sem período apurado → esperar; orçamento acabou → aumentar orçamento ou reduzir valores; retorno acima de 2 meses → reduzir as faixas em cerca de 20%; vendas sem ninguém na 1ª faixa por 4 períodos → baixar a meta da 1ª faixa; retorno até 1 mês com orçamento folgado → dá para subir a faixa de cima; senão, manter.
- **Conferência:** a soma dos prêmios pagos é comparada com as linhas de bônus do extrato dos parceiros; se não baterem, a tela avisa.
- **Refatoração:** as vendas que contam pontos e as do relatório saem da mesma consulta (`vendasDoPublico`).
- **Testes:** `tests/bonus.test.ts` (resumo, tempo de retorno, cada sugestão, relatório no banco e conferência com o extrato).
- **Próxima fase:** CX5 (caixa e executivos).

## D276 — [E-commerce] Contratos com aceite no painel (CT1+CT2): o Master envia, o lojista aceita, a cópia assinada vai aos dois (2026-11-10)
- **Pedido do dono:** contrato da Loja Virtual Pronta Express aceito dentro do sistema, sem burocracia, com a cópia indo para o e-mail de ambos quando estiver tudo assinado. Plano: `docs/prompts/contratos-assinatura-no-painel.md`; modelo: `docs/contratos/loja-pronta-express/`.
- **Master → Contratos:** o dono ou o Financeiro escolhe a loja, preenche o cliente, os valores, as datas, os produtos (padrão 40), o prazo (padrão 5 dias corridos) e os meses de cortesia, e aperta "Assinar e enviar". O envio é a assinatura da contratada.
  - O texto fica **congelado** (JSON) com **impressão digital SHA-256** em JSON estável (o banco reordena o jsonb).
  - O número sai como `LPX-AAAAMMDD-NN`.
  - Com cortesia, o acesso da loja é estendido na hora, em blocos de 90 dias, pela mesma regra do Caixa (D270), com motivo e auditoria.
  - O cliente recebe **só um e-mail de aviso**: entrar com o login dele e aceitar.
- **Painel do lojista:**
  - aviso no topo da tela inicial;
  - menu Loja e ajustes → **Contratos**;
  - o contrato na tela (resumo, Pix em destaque, cláusulas com "Em resumo");
  - "Li e concordo", o nome completo e **"Aceitar contrato"**. Só o dono da loja; a equipe não vê.
- **Prova do aceite:** usuário, data e hora do servidor, IP, aparelho e a impressão digital do texto visto. Se o texto mudou, o aceite é recusado. Aceite uma vez só.
- **Cópia assinada:** no aceite, o sistema gera o **PDF** no servidor (pdf-lib, sem navegador), com o registro de assinatura e aceite no fim, e envia **anexado ao e-mail das duas partes**. O PDF também pode ser baixado no Master e no painel (`/…/contratos/[id]/pdf`). `sendEmail` passou a aceitar anexos (Resend); o anexo não fica no registro de e-mails.
- **Contratada:** NextLevel Marketing Ltda (CNPJ 51.392.006/0001-92, Pix no Itaú), em `CONTRATADA_PADRAO`, e gravada em cada contrato. *Correção do dono (D279): não é provisória; esse CNPJ responde por todo o grupo.*
- **Fora desta fase:** pagamento com "Já fiz o Pix" e conferência no Master (CT3), aditivos e outros modelos (CT4).
- **Testes:** `tests/contratos.test.ts` (conta e datas, texto, cortesia, impressão digital estável, permissões, isolamento entre lojas, equipe sem acesso, aceite único, texto mudado, e-mails e PDF).

## D277 — [E-commerce] Contratos CT3: "Já fiz o Pix" no painel do cliente e conferência manual no Master (2026-11-10)
- **Pedido do dono:** o cliente só sinaliza que fez o Pix no CNPJ (Itaú) apertando um botão; o dono confere a conta do Itaú à mão.
- **Parcelas** (`contrato_parcelas`): sinal e restante saem dos dados congelados do contrato. São criadas sozinhas na primeira leitura, o que vale também para contrato enviado antes desta mudança.
- **Cliente** (Contratos → o contrato): bloco "Pagamentos" com a chave Pix, o botão "Copiar chave" e **"Já fiz o Pix"** em cada parcela, com recado opcional. O aviso **não marca como pago**: vai um e-mail ao representante da contratada para conferir. A tela inicial mostra uma faixa quando uma parcela vence em até 3 dias e ainda não foi avisada.
- **Master** (Contratos): faixa "Pix para conferir no banco" no topo. No contrato: **"Confirmar recebimento"** (também sem aviso do cliente) ou **"Não encontrei"** (a parcela volta a aberta e o cliente recebe um e-mail para conferir a chave e mandar o comprovante). Só o dono e o Financeiro.
- **Caixa (D269/D270):** a confirmação lança uma entrada Pix → Itaú NextLevel, origem "Outros" descrita com o número do contrato, ligada à loja. Se o caixa do dia não estiver aberto, a confirmação vale e aparece o botão "Lançar no caixa". O lançamento acontece uma vez só (reserva da coluna antes de lançar).
- **Fora desta etapa (simples, como o dono pediu):** trava automática da entrega, lembretes automáticos e rescisão automática. O prazo de entrega continua contando pelo texto do contrato.
- Testes: `tests/contratos.test.ts` (aviso não paga; outra loja e a equipe não avisam; lojista não confirma; "não encontrei"; caixa fechado e depois aberto; nenhum lançamento duplo; quitação).

## D278 — [E-commerce] Cortesia dada durante o teste aparece como "Cortesia" e não vira cobrança no fim do teste (2026-11-10)
- **Achado do dono:** depois de estender 90 dias a Vestiário das Lendas (Caixa → Assinaturas → Estender), o Master continuou mostrando "Em teste · 3 dias" e o painel do cliente mostrava "Teste grátis até 13/11" junto com "Pago até 11/02". Pior: no fim do teste a rotina diária passaria a assinatura para "aguardando pagamento".
- **Regra:** acesso estendido à mão durante o teste é **cortesia** até a data estendida.
  - A situação comercial (D200) mostra "Cortesia" com os dias até o fim. Não conta como pagante e não entra no faturamento mensal.
  - O painel do cliente mostra uma linha só: "Grátis (cortesia da NextLevel) até…".
  - "Estender" com a assinatura em teste leva junto o fim do teste.
  - A rotina diária: um teste que acaba com acesso dado à mão continua em teste até o fim desse acesso; só depois pede pagamento. Isso corrige sozinho os casos estendidos antes desta mudança.
- Ajuste junto: a linha "taxa zero até…" some quando a taxa do plano já é 0%.
- Teste: `tests/caixa.test.ts` (D278).

## D279 — [E-commerce] Termos de uso da plataforma com aceite obrigatório antes de usar o painel (2026-11-10)
- **Pedido do dono:** um contrato padrão para todos os usuários novos, aceito logo no começo; sem passar por ele, o painel não abre. O contrato da Loja Pronta (D276) é outro assunto (serviço avulso).
- **Texto:** `src/lib/contratos/termos-plataforma.ts`, versão `2026-11-10`, 14 cláusulas curtas com "Em resumo". Sem pontos polêmicos e sem preços (vêm da página de planos e da tela de pagamento).
  - Partes: NextLevel Marketing Ltda - ME e o LOJISTA.
  - **Empresa do grupo (correção do dono, 10/11/2026):** a NextLevel Marketing Ltda é e continua sendo a empresa de todo o grupo. O CNPJ responde por NextLevel E-commerce, NextLevel Soluções Digitais, SuperDrop e qualquer marca ou submarca de tecnologia. "NextLevel Soluções" é o nome dos serviços de marketing online da agência, não uma empresa nova. Não existe contratada "provisória".
  - O dinheiro das vendas cai direto na conta de pagamento do lojista. Responsabilidades de cada lado e o que não é permitido.
  - LGPD: o lojista controla os dados dos clientes; a NextLevel trata em nome da loja.
  - Cancelamento sem multa. Aviso de 30 dias antes de mudar preço. Termos novos pedem aceite novo.
  - Aceite eletrônico com prova. Foro de São Paulo, ressalvado o do consumidor.
  - Impressão digital SHA-256 do texto: qualquer letra mudada exige trocar a versão.
- **Trava:** no painel do lojista (`/merchant`) e no editor do tema, o dono de loja da E-commerce que não aceitou a versão atual vê só a tela do termo ("Li e concordo", nome completo, "Aceitar e continuar", ou "Agora não, sair"). Vale para os novos e para os que já têm conta (aceitam no próximo acesso).
  - A equipe da loja não aceita: quem contrata é o dono.
  - No modo suporte, o Master vê uma faixa de aviso em vez da trava.
  - As contas de demonstração (`*.demo` no modo demonstração) não travam.
- **Prova** (`aceites_termos`): usuário, loja, versão, impressão digital, nome, data e hora, IP e aparelho. Um aceite por versão. O e-mail de confirmação leva o link de `/termos`.
- **Onde ler:** `/termos` da E-commerce mostra o mesmo texto. O cadastro avisa que os termos são aceitos antes de usar o painel, com link. Master → Contratos mostra quem já aceitou e quem falta.
- Teste: `tests/termos-plataforma.test.ts`.

## D280 — [E-commerce] Janela de resgate na saída: nas páginas públicas e, por escolha do lojista, na loja (2026-11-10)
- **Pedido do dono:** quando alguém vai sair das páginas públicas, uma janela para resgatar o visitante (referência: janela de saída com e-mail, caixa de concordância e botão verde). Os lojistas também precisam desse recurso.
- **Páginas públicas da E-commerce** (`src/components/portal/resgate-saida.tsx`):
  - **Quando abre:** no computador, quando o mouse sai pelo topo da página; no celular, quando o visitante sobe a página rápido depois de ter descido 40% dela. Só depois de 5 segundos na página.
  - **Frequência:** uma vez a cada 7 dias por navegador. Nunca no cadastro, no login nem nos textos legais.
  - **O que mostra:** só fatos reais, os mesmos do vendedor 24h (D195): dias de teste, temas grátis, taxa zero quando todos os planos têm 0% e o selo da Black quando ela está no ar.
  - **Formulário:** e-mail e caixa de concordância obrigatória, com links para a privacidade e os termos.
- **O que acontece com o e-mail:** vira um interessado do tipo `SAIDA` no CRM do Master, com a página de origem e o momento do consentimento (o mesmo e-mail não duplica), e recebe por e-mail o caminho para criar a loja, sem preço fixo. A tela confirma e oferece "Criar minha loja agora". Limite de 6 envios por hora por endereço de rede.
- **Loja do lojista:** a janela do cupom de boas-vindas (D88) ganha a opção **"Quando abrir"**: depois do tempo ou quando o cliente for sair (padrão, como já era), só ao sair, ou só depois do tempo. A saída no celular segue a mesma regra das páginas públicas.
- Teste: `tests/resgate-saida.test.ts`.
- **Empresa:** a NextLevel Marketing Ltda é a empresa de todo o grupo (correção registrada no D279 e no `CLAUDE.md`).

## D281 — [E-commerce] Domínio novo nextlevelcommerce.com.br pronto para virar o endereço principal (2026-11-11)
- **Pedido do dono:** conectar logo o domínio novo.
- **Código:**
  - `www.nextlevelcommerce.com.br` entra nos endereços padrão da marca (o `nextlevelcommerce.com.br` já estava).
  - Nova regra no roteamento por endereço: com a chave `EC_DOMINIO_PRINCIPAL=1`, os outros endereços da E-commerce (o antigo `lojas.nextlevelgroup.com.br` e o `www`) levam ao endereço principal (`BRAND_URL_NEXTLEVEL_COMMERCE`) com redirecionamento **permanente (301)**, mesmo caminho e busca.
  - Fora da regra: o `/api/*` (avisos do Mercado Pago e rotinas), os envios de formulário e o endereço dos painéis (escritório) ficam como estão.
- **Por que a chave:** sem ela, nada redireciona. Assim o domínio novo pode ser ligado no Render e no DNS antes da troca, sem o navegador guardar um redirecionamento permanente na direção errada.
- **Passo a passo:** `docs/infra/DOMINIO-NOVO-ECOMMERCE.md`. Teste: `tests/host-routing.test.ts` (D281).
- **Fila do dono:** `docs/fila/FILA-DO-DONO.md` reúne o que o dono pediu para não esquecer.

## D282 — [E-commerce] Página "NextLevel Temas para Nuvemshop" (2026-11-12)
- **Pedido do dono:** uma página com as lojas que a NextLevel criou, o racional de cada uma, botões em destaque para os sites reais, o resumo de como o trabalho ajuda cada negócio, os temas da NextLevel no fim e destaque para semijoias. O ponto de partida é uma cliente de semijoias que vende na Nuvemshop e quer um layout melhor.
- **Onde:** `/temas-nuvemshop`, só no site da E-commerce (404 nas outras marcas). Vai para Soluções depois, com 301, porque tema personalizado é serviço da agência (NextLevel Marketing Ltda).
- **Seções:**
  - Topo.
  - "Conhecemos o seu layout por dentro": 6 fatos da central de ajuda da Nuvemshop, com fonte e data, cada um com o que a NextLevel faz a respeito.
  - As 5 lojas na ordem do dono (iRest, Capistrano Modas, Luis Fornecedor, Futcollection, CCV Vidros). Cada uma tem o botão "Visitar a loja", o resumo "Como o nosso trabalho ajuda", o desafio e de 3 a 5 pontos com recortes do layout.
  - Semijoias, com Musa, Aura, Brilho e Pétala.
  - Seis etapas de trabalho.
  - Vitrine dos temas NextLevel.
  - Dúvidas.
  - Diagnóstico gratuito (o formulário de Soluções, já marcado em "Melhorar o visual da loja") e o WhatsApp.
- **Regras:**
  - Nenhum case cita a plataforma em que a loja roda.
  - Sem número de venda.
  - Sem preço de serviço.
  - Recortes no layout, sem destacar escudos e marcas de terceiros.
  - Todos os clientes autorizaram aparecer.
  - Aviso de que a NextLevel não tem vínculo com a Nuvemshop.
- **Imagens:** em `public/portal/temas-nuvemshop/`. iRest e CCV foram capturadas pela NextLevel; Capistrano, pelos prints do dono. Luis Fornecedor e Futcollection: pelos prints que o dono reenviou como arquivo. As imagens dos temas são capturas novas das demonstrações no ar.
- **Arquivos:** dados em `src/lib/portal/cases-temas.ts`, plano em `docs/prompts/temas-para-nuvemshop-pagina.md`, teste em `tests/temas-nuvemshop.test.ts`.

## D283 — [E-commerce] Página "Nossos clientes": marcas que a NextLevel atende, 100% NextLevel (2026-11-12)
- **Pedido do dono:** uma página com os clientes reais e os melhores templates no fim, sem falar de nenhuma outra plataforma.
- **Enquadramento aprovado pelo dono:** "Marcas que a NextLevel atende". As 5 lojas são da equipe NextLevel, mas hoje não rodam na NextLevel E-commerce, e a página nunca diz que rodam. A ponte é "o que aprendemos com elas, você já tem na NextLevel E-commerce", que lista só recursos que existem no código: atacado com mix (D257), grades de tamanho, vista rápida, WhatsApp, parcelamento e temas com editor. O selo "Na NextLevel E-commerce" aparece só quando o campo `naPlataforma` do case for verdadeiro (hoje, nenhum).
- **Onde:** `/clientes`, só na E-commerce, e "Clientes" no menu público (pedido do dono). Mesma fonte de dados da D282 (`src/lib/portal/cases-temas.ts`, com os campos novos `negocio`, `cidade` e `naPlataforma`).
- **Seções:**
  - Topo com 3 números verdadeiros.
  - Uma vitrine por marca, com o botão "Visitar a loja".
  - Aprendizados → recursos.
  - Quatro segmentos com o tema indicado.
  - Melhores templates: Signature, Atelier, Musa, Pódio, Porto e Morada.
  - Chamada final com "Criar minha loja", "Quero a loja montada pela equipe" e o WhatsApp.
- **Fora, de propósito:** personalização com nome e número na camisa (a plataforma ainda não tem), número de venda e depoimento.
- Plano em `docs/prompts/pagina-nossos-clientes.md`, teste em `tests/clientes-pagina.test.ts`.

## D284 — [E-commerce] Lembretes automáticos das parcelas do contrato e endereço padrão do domínio próprio (2026-11-12)
- **Lembretes** (`lembretesDeParcelas`, na rotina diária `runDailyFinanceJobs`):
  - ao cliente, 2 dias antes e no dia do vencimento, com a chave Pix e o caminho para "Já fiz o Pix";
  - à contratada, quando a parcela vence sem aviso de Pix.
  - Cada aviso sai uma vez só (dedupeKey). Parcela avisada ou paga não recebe lembrete. Falha nos lembretes não derruba o resto da rotina.
  - Os e-mails só saem de verdade com o Resend configurado (pendência do dono).
- **Domínio próprio dos lojistas:** sem a variável `LOJA_DOMINIO_CNAME`, o endereço padrão passa a ser o da produção (`superdrop.onrender.com`), não mais o do serviço de Treino.
- Teste: `tests/contratos.test.ts` (D284).

## D285 — [E-commerce] E-mail ligado (Resend, nextlevelcommerce.com.br) e assinado pela marca aberta (2026-11-12)
- **E-mail real no ar:**
  - domínio `nextlevelcommerce.com.br` verificado no Resend, região São Paulo, com DNS na Hostinger (DKIM, SPF via `send`/`rsend` e DMARC `p=none`);
  - `RESEND_API_KEY` colada pelo dono no Render;
  - `EMAIL_FROM=contato@nextlevelcommerce.com.br`;
  - `EMAIL_REPLY_TO`, por enquanto, o Gmail da agência.
- **Achado do dono:** a redefinição de senha da conta Master chegou assinada "SuperDrop" (a organização antiga do Master é a do SuperDrop, e o SuperDrop está em pausa, D216).
- **Regra:**
  - marca em pausa (fora de `MASTER_MARCAS_ATIVAS`) ou e-mail sem marca assina pela NextLevel E-commerce; o grupo (NEXTLEVEL) continua assinando como NextLevel;
  - a equipe do Master recebe e-mails como "NextLevel".
  - Quando o SuperDrop voltar a abrir, os e-mails dele voltam a sair com o nome dele, sem mudar código.
- Teste: `tests/captacao-p5u.test.ts` (D285).

## D286 — [Grupo] Código de segurança a cada entrada em todos os painéis (2026-11-13)
- **Pedido do dono:** um código de segurança em cada acesso a todos os painéis internos. Modelo de referência: o código do aplicativo autenticador ou, para quem não tem, por e-mail.
- **Regra:** em toda entrada com e-mail e senha, em todos os papéis (Master, lojista e equipe, parceiro, fornecedor, Brás):
  - quem ligou o aplicativo autenticador (D183, D188) digita o código do aplicativo, ou um de recuperação;
  - quem não ligou recebe por e-mail um código de 6 números, válido por 10 minutos, com "Enviar outro código" (até 3 a cada 10 minutos).
  - A sessão aberta continua valendo até 7 dias naquele aparelho.
- **Segurança:**
  - o bilhete entre a senha e o código leva só a assinatura HMAC do código, com o segredo do servidor, nunca o código;
  - tentativas limitadas (`allowLoginAttempt`);
  - o bilhete do e-mail não serve como bilhete do aplicativo;
  - o e-mail avisa para trocar a senha se não foi a pessoa.
- **Para ninguém ficar trancado:**
  - se o e-mail não sair (provedor fora do ar), a entrada segue só com a senha e a falha fica no registro;
  - `LOGIN_CODIGO_EMAIL=0` no Render desliga o código por e-mail numa emergência;
  - a demonstração não pede código.
- **Não pedem código:** o cadastro novo (a pessoa acabou de criar a senha), a troca de perfil da conta do grupo e o modo suporte (o Master já passou pelo código).
- **Master:** `MASTER_2FA_OBRIGATORIO=1` (D183) continua disponível para exigir o aplicativo da equipe, ligado depois que todos ativarem.
- Teste: `tests/codigo-email-login.test.ts`.

## D287 — [Grupo] Duas frentes e domínio novo no ar: nextlevelcommerce.com.br e nextlevelgroup.com.br (2026-11-13)
- **Decisão do dono:** por enquanto só duas frentes concretas.
  1. **`nextlevelcommerce.com.br`:** a plataforma de lojas virtuais, com as páginas públicas e os painéis (lojista e parceiro).
  2. **`nextlevelgroup.com.br`:** a agência, sistemas sob medida, white label e outras soluções para empresas, com as páginas e os painéis internos (Master em `master.nextlevelgroup.com.br`).
- **Ficam de fora por enquanto:** Cargas, Brás e SuperDrop.
  - Domínios removidos do Render pelo dono: `bras.` e `cargas.nextlevelgroup.com.br`, e `app.` e `office.superdrop.com.br`.
  - `superdrop.com.br` e o `www` ligado a ele saem depois de confirmar que nada mais usa o endereço (`APP_URL` já trocado).
  - O endereço técnico `superdrop.onrender.com` **fica ligado**: é o alvo do domínio próprio dos lojistas.
- **Domínio novo no ar (13/11/2026):**
  - DNS na Hostinger: A `@` → `216.24.57.1`; CNAME `www` → `superdrop.onrender.com`.
  - No Render: verificado, com certificado, e o `www` leva ao principal.
  - Variáveis: `BRAND_URL_NEXTLEVEL_COMMERCE=https://nextlevelcommerce.com.br`, `EC_DOMINIO_PRINCIPAL=1` (D281: `lojas.nextlevelgroup.com.br` leva ao novo com 301, menos `/api/*` e formulários) e `APP_URL=https://nextlevelcommerce.com.br` (links dos e-mails e avisos do Mercado Pago).
  - `lojas.nextlevelgroup.com.br` fica alguns meses só redirecionando, porque há links já enviados (US$ 0,25 por mês).
- **Custo:** cada domínio além dos 2 do plano custa US$ 0,25 por mês no Render.

## D288 — [E-commerce] O nome da marca passa a ser "NextLevel Commerce" (2026-11-13)
- **Decisão do dono:** parar de usar "NextLevel E-commerce" e usar "NextLevel Commerce" em todo o sistema. O nome casa com o domínio `nextlevelcommerce.com.br` (D287).
- **Feito no código:**
  - "NextLevel E-commerce" vira "NextLevel Commerce" em todo `src/`, nos testes e nos documentos vivos (o histórico em DECISIONS e nos relatórios fica como foi escrito);
  - o nome curto "E-commerce" vira "Commerce": menu, seletor do Master, rótulos e "Administração Commerce".
  - Ficam como estão: a expressão de mercado "O Clássico do E-commerce", a palavra e-commerce em minúsculas e a etiqueta `[E-commerce]` dos títulos de decisão (convenção interna da frente).
- **Termos de uso:** o título passa a "Termos de uso da plataforma NextLevel Commerce", na versão `2026-11-13`. Pela regra da D279, cada dono de loja aceita de novo no próximo acesso.
- **Contratos:** os já enviados ficam como foram (texto congelado); os novos saem com o nome novo.
- **Pendente (arte):** os logos ainda mostram "E-commerce". O racional e os prompts para o gerador de imagens estão em `docs/marcas/nextlevel-commerce-logo-racional.md`, e o dono gera as imagens.

## D289 — [Grupo] Caixa de e-mail da Hostinger: apelidos, respostas e contratos no domínio novo (2026-11-13)
- **Plano do dono:** e-mail da Hostinger (teste de 30 dias) com a caixa `mauricio@nextlevelcommerce.com.br`. Limites: 5 GB, 1.000 envios por dia, 5 apelidos e 5 encaminhamentos. O conector Hostinger Mail está ligado no Claude.
- **Divisão de papéis:**
  - o **Resend** continua enviando os e-mails automáticos do sistema (D285), sem gastar o limite diário da Hostinger;
  - a **Hostinger** recebe e é onde o dono responde.
- **Apelidos que entregam na caixa `mauricio@`:** `contato@` (o remetente do sistema, que antes não existia como caixa, e por isso as respostas voltavam), `suporte@`, `financeiro@`, `comercial@` e `parceiros@`.
- **Pastas criadas na caixa:** Clientes, Financeiro - Comprovantes, Parceiros, Fornecedores e Sistema.
- **Sistema:**
  - `EMAIL_REPLY_TO=contato@nextlevelcommerce.com.br`, em vez do Gmail;
  - `NEXT_PUBLIC_SUPPORT_EMAIL=contato@nextlevelcommerce.com.br`;
  - os contratos novos usam `financeiro@nextlevelcommerce.com.br` como e-mail da contratada, para avisos de Pix e parcelas vencidas;
  - os contratos já enviados ficam como foram.
- **DNS:** os MX e o SPF da raiz são da Hostinger, e o envio do Resend fica no subdomínio `send`, sem conflito. O DMARC fica em `p=none` por 2 a 4 semanas, depois sobe para `quarantine`.
- **Depois:** um webhook do "Correio Agêntico" da Hostinger transforma e-mails de `suporte@` em atendimentos no Master.


## D290 — [E-commerce] Tráfego e campanhas, fases TR0 e TR1: aviso de cookies, origem completa e links rastreados (2026-11-13)
- **Pedido do dono:** saber de onde vem cada visita e cada lead (anúncio da Meta, do Google, orgânico), com links rastreados em tudo, como base para a campanha de teste e para devolver vendas à Meta e ao Google. Plano completo: `docs/prompts/trafego-campanhas-meta-google-reels.md` (fases TR0 a TR9).
- **TR0, aviso de cookies (LGPD):** todas as páginas públicas das marcas mostram o aviso com "Aceitar todos", "Só os necessários" e "Escolher" (necessários, medição do site, anúncios). A escolha fica no cookie `nl-consent` com a versão do texto (2026-11-13) por 12 meses; mudou a versão, o aviso volta. "Preferências de cookies" no rodapé reabre. **Anúncios (Pixel da Meta, Google) só carregam com "sim"** (vale a partir da TR4). Sem escolha, a medição própria segue ligada por legítimo interesse, avisada no aviso e na política; **pendente de revisão jurídica**.
- **Política de privacidade** (versão 13/11/2026, só ela; os termos de uso continuam na versão de 12/10): seção de cookies e medição reescrita e seção nova "Campanhas e resultados de anúncios" (envio a Meta/Google com e-mail e telefone só em código irreversível; direito de pedir que não seja feito).
- **TR1, origem completa:** o proxy guarda também o clique do anúncio (`fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`, até 120 caracteres), o momento do clique e o canal, no mesmo cookie de origem de 30 dias (D90). Novo cookie `nl-first` (90 dias, nunca sobrescrito) com o **primeiro toque**: canal, etiquetas, site de origem e página de entrada. O primeiro toque não é gravado nas lojas dos lojistas (contagem sem cookie, D185), nos painéis, em pré-carregamento, para robôs, nem se a pessoa recusou a medição (aí ele é apagado).
- **Canal:** uma regra só (`src/lib/trafego/canal.ts`, `canalDe`) com 16 canais: Meta pago, Google pago, TikTok pago, outro pago, indicação, Instagram, Facebook, busca do Google, outros buscadores, TikTok, YouTube, IA (ChatGPT, Gemini, Perplexity…), WhatsApp, e-mail, outros sites e direto. Clique pago vence indicação; a **comissão do parceiro não muda** (D90).
- **Links rastreados:** `/l/<código>` em qualquer endereço de marca (como `/r/` e `/c/`). Master → Tráfego e campanhas (menu do Escritório e cartão em Crescimento): criar com destino, origem, meio, campanha, peça e público no padrão de nomes (minúsculo, sem acento; avisos quando foge da lista), código próprio ou automático, prévia do endereço final, copiar, QR code, ligar/desligar e cliques de 7 e 30 dias e desde o início. Destino só dentro do próprio site (nunca site externo). Clique contado por dia sem IP; robôs à parte. Quem clicou chega com as etiquetas e com o `fbclid`/`gclid` que a Meta/Google puseram no link. Quem usa: dono, Comercial e Conteúdo.
- **Banco:** tabelas `links_rastreados` e `links_cliques_diarios` (migração 0093).
- **Próxima fase:** TR2 (coletor próprio e "Agora no site" em tempo real).

## D291 — [E-commerce] Tráfego e campanhas, fase TR2: medição própria do site e "Agora no site" em tempo real (2026-11-13)
- **Coletor próprio:** as páginas públicas das marcas (nunca as lojas dos lojistas, D185, nem os painéis) mandam um sinal ao abrir cada página, um "ainda aqui" a cada 30 s com a aba visível, e marcam clique no WhatsApp e ida ao cadastro (`/api/t`, sempre responde 204). O lead é marcado pelo servidor quando o formulário é aceito (lista de espera, janela de saída e diagnóstico).
- **Privacidade:** sem IP e sem nome. O visitante é um código aleatório em cookie próprio (`nl-vid`, 13 meses) e a visita em `nl-sid` (30 min). Nada é gravado se a pessoa recusou a medição no aviso de cookies (D290), para robôs ou acima de 90 sinais por minuto do mesmo endereço.
- **Visita (sessão):** 30 min sem sinal encerra. O canal é calculado uma vez, na entrada (regra única `canalDe`, D290). Chegar com outra etiqueta, outro clique de anúncio, código de parceiro ou vindo de outro site abre uma visita nova (como o Google Analytics); recarregar a mesma página de entrada continua a mesma. A mesma página duas vezes em menos de 2 s conta uma vez.
- **Master → Tráfego e campanhas** agora tem três abas:
  - **Agora no site:** pessoas nos últimos 5 min, por canal, página, aparelho e site; números de hoje (visitas, cliques no WhatsApp, idas ao cadastro, contatos); entradas da última hora com canal, campanha e peça; momentos importantes das últimas 24 h. Atualiza sozinha a cada 10 s só com a aba aberta.
  - **Origens:** 7, 30 ou 90 dias por canal (visitas, comparação com o período anterior, páginas por visita, WhatsApp, cadastro, contatos e % de contato) e as campanhas que mais trouxeram visitas.
  - **Links rastreados** (D290).
- **Guarda:** detalhe por 90 dias; depois, a rotina diária (a mesma do financeiro) resume por dia, marca, canal, campanha e aparelho (13 meses) e apaga o detalhe. Banco: tabelas `trafego_sessoes`, `trafego_eventos` e `trafego_diario` (migração 0094).
- **Quem vê:** dono, Comercial e Conteúdo.
- **Próxima fase:** TR3 (lead com origem completa no Comercial, "Fechou/Perdeu" e o código da visita no WhatsApp).

## D292 — [E-commerce] Tráfego: cidade e aparelho de cada visita e notificações em tempo real (2026-11-13)
- **Pedido do dono:** "um campo com notificação em tempo real dizendo pelo menos a cidade de onde a pessoa está acessando e por qual dispositivo; se puder, ainda mais profundo".
- **Cidade aproximada pelo IP, sem guardar o IP:** primeiro vale a cidade que a rede de entrega informar (cabeçalhos da Cloudflare, quando existirem; no Render, em geral, só o país); senão, uma base local da DB-IP "IP to City Lite" (licença CC BY 4.0, crédito na tela), compactada em `src/lib/trafego/base-geo.bin.gz` (3,3 MB; cerca de 9.900 cidades do Brasil com UF, outros países só o país; IPv4 e IPv6). O IP é usado só em memória, na abertura da página, e descartado. Nenhum serviço de fora recebe o IP. A cidade é aproximada: no celular, às vezes aparece a cidade da central da operadora (aviso na tela). **Atualizar a base uma vez por mês:** `scripts/geo/gerar-base-geo.mjs` (instruções no próprio arquivo).
- **Aparelho em detalhe:** tipo (celular, computador, tablet), sistema e versão (iOS 17.4, Android 14…), navegador, inclusive quando a pessoa abriu o site **de dentro do app do Instagram, Facebook ou TikTok**, modelo quando o celular informa (Android com Chrome; no iPhone, só "iPhone"), tamanho da tela, idioma e tipo de rede (4g, Wi-Fi).
- **Notificações em tempo real** em Master → Tráfego e campanhas → Agora no site: o quadro "Notificações em tempo real" mostra cada visita nova ("Nova visita · Fortaleza/CE · Celular · iOS 17.4 · iPhone · App do Instagram · veio de Anúncio Meta (campanha) · entrou em /") e cada clique no WhatsApp, ida ao cadastro ou contato deixado, com aviso na tela. Botões opcionais: **"Avisar no navegador"** (aviso do sistema mesmo com o Master em outra aba) e **"Tocar som"**; a escolha fica guardada naquele navegador. A tela atualiza a cada 5 s com a aba aberta (30 s escondida).
- **Cidades** também em "De qual cidade" (Agora) e "De quais cidades" (Origens, com visitas e contatos por cidade).
- **Política de privacidade:** a medição do site agora descreve aparelho e cidade aproximada, e que o IP não é guardado.
- **Banco:** colunas novas em `trafego_sessoes` (cidade, uf, pais, sistema, navegador, modelo, tela, idioma, rede; migração 0095).

## D293 — [E-commerce] Busca e IA, fase S0: tabela central das páginas públicas, perguntas com fatos do sistema, robôs de IA e IndexNow (2026-11-14)
- **Pedido do dono:** começar o plano v3 de busca, IA e Academy (`docs/prompts/busca-ia-academy-funil-organico.md`). A troca de domínio com redirecionamento já estava feita (D281, D287); a S0 virou a base técnica e a correção dos textos vencidos.
- **Tabela central** (`src/lib/seo/paginas.ts`): título, descrição, canonical, prévia de link (Open Graph e cartão do X), prioridade e data de revisão de cada uma das 20 páginas públicas da Commerce. As páginas usam `metadadosDaPagina` (`src/lib/seo/metadados.ts`); nas outras marcas fica o que já havia.
- **Textos vencidos corrigidos:**
  - a frase da marca dizia "em breve, atacado" e "feita para quem vende moda"; agora é "Loja virtual para varejo e atacado", com o atacado em todos os planos;
  - `/planos` e `/cadastro` falavam em "teste 7 dias com cupom", e `/parceiros` em "comissão sobre o setup" e "cupons de 7 dias";
  - `/faq`, `/termos` e `/privacidade` repetiam a descrição da home e não tinham canonical.
- **Perguntas frequentes** (`src/lib/seo/faq-commerce.ts`): 12 perguntas montadas com os fatos do sistema (planos e oferta do Master, benefícios por plano, faixas do atacado), com `FAQPage` igual ao texto visível. Uma resposta só aparece quando o fato vale (sem taxa zero, sem teste ou sem preço, a pergunta some). Saiu "o atacado está em construção".
- **Sitemap:** todas as páginas da tabela (antes faltavam comparativo, recursos, integrações, ferramentas, clientes, perguntas e as subpáginas de parceiros), com a data da última revisão real; temas sem data, para não inventar.
- **robots.txt:** os robôs de busca e de IA aparecem por nome (Google, Bing, ChatGPT, Perplexity, Claude, Apple, Meta, Mistral, DuckDuckGo), todos liberados nas páginas públicas, inclusive para treino; os painéis seguem bloqueados.
- **Entidade na home** (`src/lib/seo/entidade.ts`): organização com a empresa (NextLevel Marketing Ltda e CNPJ), logo, contato (WhatsApp e e-mail do suporte), cidade, site e os planos em reais vindos do catálogo. Os perfis oficiais (`sameAs`) entram quando o dono informar a variável `PERFIS_COMMERCE` (endereços https separados por vírgula).
- **IndexNow:** chave pública em `public/<chave>.txt` e `node scripts/indexnow.mjs` depois de cada publicação que mude páginas públicas (avisa Bing, Yandex e outros; o Bing alimenta o Copilot).
- **Fica com o dono:** verificar `nextlevelcommerce.com.br` no Google Search Console (propriedade de domínio, registro TXT na Hostinger) e no Bing Webmaster (importa do Google), enviar o sitemap e pedir a mudança de endereço a partir de `lojas.nextlevelgroup.com.br`.
- **Teste:** `tests/seo-paginas.test.ts` (títulos e descrições únicos, no tamanho certo e sem texto vencido; toda página com linha na tabela; sitemap; robôs; chave do IndexNow; perguntas só com fatos válidos; entidade).

## D294 — [E-commerce] Tráfego e campanhas, fase TR3: origem de cada contato no Comercial, Fechou/Perdeu e código da visita no WhatsApp (2026-11-13)
- **Origem de cada contato:** quando alguém deixa o contato (lista de espera, janela de saída, diagnóstico) ou cria a loja, o sistema guarda de onde veio na tabela nova `origens_contato`, ligada à mesma chave do Comercial: canal, campanha, peça, público, clique do anúncio (Meta, Google ou TikTok), primeiro canal pelo qual conheceu o site, cidade aproximada, aparelho e o código da visita. Vale a visita em andamento; se ela entrou "direto", vale o último toque com campanha dos últimos 30 dias (D90). A primeira origem fica (não é sobrescrita). A visita passa a contar como "deixou contato" em Agora no site.
- **Comercial:** cada cartão mostra o selo do canal, a campanha e a cidade; filtro por canal no topo ("Origem não registrada" para quem chegou antes desta fase). A ficha do cliente ganha "De onde veio" (como chegou, campanha, peça, público, conheceu por, cidade, aparelho, código da visita) e a linha do tempo registra "Chegou por…".
- **Fechou e Perdeu:** na ficha, "Fechou negócio" pede o valor (em reais, gravado em centavos) e o que foi vendido; a pessoa passa a "Pagante" no quadro (a menos que o sistema já diga "Em risco"). "Perdeu" pede o motivo de uma lista (Achou caro, Escolheu outra plataforma, Não respondeu mais, Ainda não é a hora, Ainda não tem produto ou empresa, Não era o público, Outro) e um detalhe opcional. Dá para desfazer os dois. É a base do retorno às plataformas (TR5).
- **Código da visita no WhatsApp:** cada visita ganha um código de 5 letras e números (sem 0/O e 1/I/L). Ao clicar no WhatsApp do site, a mensagem pronta vai com "(código K7Q2X)". A equipe cola o código na ficha ("Código da visita") e o contato herda a origem daquela visita, corrigindo a captura automática. O código também aparece nas entradas de Agora no site. Só a equipe (dono, Comercial e Suporte) liga códigos.
- **Banco:** migração 0096 (tabela `origens_contato`; colunas `motivo_perda`, `fechou_em`, `valor_fechado_cents` e `fechou_descricao` em `crm_acompanhamento`; `codigo` em `trafego_sessoes`).
- **Acessibilidade:** as chamas de temperatura do Comercial ganharam papel de imagem (o axe apontava rótulo em elemento sem papel).
- **Próxima fase:** TR4 (Pixel da Meta e tag do Google no site da NextLevel, só com consentimento).

## D295 — [E-commerce] Tráfego e campanhas, fase TR4: Pixel da Meta e Google no site da NextLevel, só com consentimento (2026-11-14)
- **Onde configurar:** Master → Tráfego e campanhas → **Pixel e Google**. O dono ou o Comercial colam só números públicos: Pixel da Meta (conjunto de dados), Google Ads (AW-… e o rótulo da conversão "Contato") e, opcional, Google Analytics 4 (G-…). Cada campo diz onde achar o número; formato errado é recusado com explicação; mudança fica na trilha de auditoria. Guardado em `platform_settings` (`trafego.tags`), sem criptografia porque o número vai no código da página; tokens de API ficam para a TR5, criptografados.
- **Carregamento:** nas páginas públicas das marcas (portal), **só depois que a pessoa aceita "Anúncios"** no aviso de cookies (D290). Sem aceite, nenhum script da Meta ou do Google é baixado. Se a pessoa tirar o aceite depois, a página manda a revogação para a Meta e para o Google e para de enviar eventos. As lojas dos lojistas seguem com as integrações delas (D187, D189).
- **Eventos:** página vista (inclusive navegando dentro do site); **Contato** ao clicar no WhatsApp; **Lead** quando o contato é aceito (lista de espera, janela de saída, diagnóstico), com o identificador do contato (`interessado:<id>`) como `eventID` da Meta e `transaction_id` do Google. É o mesmo identificador que o servidor vai mandar na TR5, para não contar duas vezes. Cadastro da loja e pagante vão pelo servidor na TR5 (a página de cadastro fica fora das páginas públicas).
- **Depende do dono:** colar os números no Master. Até lá, nada carrega.
- **Próxima fase:** TR5 (devolver para a Meta e o Google, pelo servidor, quem virou contato, conta e pagante, com valor; públicos de clientes).
# D296 — [E-commerce] Caixa de entrada no Master, e-mails por assunto e ligação com o Comercial (2026-11-13)
- **Pedido do dono:** usar a caixa da Hostinger dentro do Master e deixar CRM, e-mail e comercial bem ligados, para produtividade.
- **Caixa de entrada (`/master/caixa-de-entrada`, menu Escritório):**
  - lê a caixa da Hostinger pela API do Correio Agêntico (token `HOSTINGER_MAIL_TOKEN`, colado pelo dono no Render, nunca em tela ou log);
  - pastas, busca, leitura em texto (HTML só em quadro isolado, sem scripts), anexos, responder na mesma conversa, escrever, mover e marcar como não lida;
  - só o dono abre (a caixa tem dados de todos os clientes); a equipe do Master não.
- **Quem é o remetente:** cada e-mail mostra se é lojista, equipe de loja, parceiro ou interessado, com link para a ficha no Comercial (`/master/comercial/loja:…` ou `interessado:…`).
- **Ligação com o Comercial:**
  - remetente que ainda não está no sistema vira interessado com o botão "Salvar no CRM" (sem e-mail automático para ele);
  - responder ou escrever para um interessado novo muda a situação dele para "contatado";
  - a ficha do cliente no Comercial ganha "Ver e-mails", que abre a caixa já filtrada pelo e-mail dele.
- **E-mails por assunto (`src/lib/contatos.ts`, fonte única):** os e-mails automáticos do sistema saem com "responder para" conforme o assunto: financeiro@ (contrato, fatura, assinatura, Pix), parceiros@ (comissão, indicação), comercial@ (interessados, propostas), suporte@ (senha, login, loja, pedidos), contato@ (o resto). Os e-mails das lojas para os clientes delas continuam com o endereço da loja.
- **Nas telas:** o rodapé das páginas públicas da Commerce mostra os endereços por assunto; a Ajuda do lojista mostra suporte@ e financeiro@.
- **Depois:** contador de não lidas no menu e atendimento automático a partir de suporte@ (webhook do Correio Agêntico).

# D297 — [E-commerce] Caixa de entrada: número de não lidos no menu e respostas prontas (2026-11-13)
- **Pedido do dono:** CRM, e-mail e comercial bem ligados para a produtividade; seguir com as sugestões 1 (contador) e 3 (respostas prontas).
- **Não lidos no menu:** o item "Caixa de entrada" do Master mostra quantos e-mails da Entrada estão sem ler (até "99+"). Só o dono vê (a equipe do Master não abre a caixa). O número é guardado por 1 minuto e a consulta desiste em 1,5 s: o menu nunca espera a Hostinger. Ler, mover ou marcar como não lida atualiza o número.
- **Respostas prontas:** ao responder, "Resposta pronta" preenche a mensagem (o dono ajusta antes de enviar): recebemos, planos e teste grátis, domínio próprio, comprovante de Pix e quero ser parceiro. Saudação com o primeiro nome do remetente. Sem preço (aponta para /planos, porque o valor vem da tabela de preços) e sem promessa de ganho.
- **Depois:** respostas prontas editáveis pelo Master, se o dono quiser mudar os textos sem programação.

## D298 — [E-commerce] Tráfego e campanhas, fase TR5: retorno à Meta e ao Google pelo servidor (contato, conta, pagante e venda) (2026-11-14)
- **O que volta para as plataformas:**

  | Resultado no sistema | Meta (API de conversões) | Google Ads (conversão importada por clique) | Valor |
  |---|---|---|---|
  | Deixou contato (lista de espera, janela de saída, diagnóstico, código do WhatsApp) | Lead | ação "Contato" | sem |
  | Criou a loja | CompleteRegistration | ação "Conta criada" | sem |
  | Virou pagante (assinatura ativa, pagamento conferido) | Subscribe | ação "Pagante" | mensalidade |
  | Negócio fechado à mão no Comercial | Purchase | ação "Pagante" | valor fechado |

- **Fila** (`conversoes_envio`, migração 0097): uma linha por plataforma, resultado e contato (não duplica). O identificador é o mesmo do navegador (D295), então a Meta não conta duas vezes. A rotina de 5 a 10 minutos (`/api/cron/expire-reservations`) põe os pagantes novos na fila e envia. Prazos: 7 dias na Meta e 90 no Google; passou, fica "fora do prazo". Novas tentativas em 10 min, 1 h, 6 h e 1 dia (até 5); erro de dado (400 da Meta, recusa do Google) não insiste.
- **Sem configuração, a fila espera** sem gastar tentativa: quando o dono ligar, o que estiver no prazo é enviado.
- **Privacidade:** e-mail e telefone só vão como resumo SHA-256, montados na hora do envio e nunca gravados na fila. Quem escolheu "não" para anúncios no aviso de cookies fica "Recusou anúncios" e nada é enviado. O Google só recebe quem veio de clique de anúncio do Google (gclid, gbraid ou wbraid). A origem do contato passa a guardar o navegador, a escolha no aviso de cookies e os cookies da Meta (`_fbp`, `_fbc`).
- **Evento de site × de sistema:** contato e conta vão como evento do site (com o navegador e o endereço); pagante e venda, como evento do sistema.
- **Configuração** em Master → Tráfego e campanhas → **Retorno às plataformas**, **só o dono**: token da API de conversões da Meta e código de teste opcional; para o Google, conta, conta de administrador, token de desenvolvedor, acesso OAuth (ID, chave secreta e token de atualização) e os números das três ações de conversão. Segredos ficam criptografados, nunca voltam para a tela nem para a trilha de auditoria; deixar vazio mantém, "-" apaga. A tela mostra Ligado/Desligado, a contagem (entregue, na fila, falhou, recusou anúncios) e os últimos resultados com o nome da pessoa e o motivo de cada falha, com "Tentar de novo".
- **Versões das APIs:** Meta Graph `v23.0` e Google Ads `v22`, trocáveis por `META_GRAPH_VERSION` e `GOOGLE_ADS_API_VERSION` sem mexer no código. A compra das lojas na Meta (D187) passou a usar a mesma versão (antes `v19.0`, já fora do prazo da Meta).
- **Depende do dono:** gerar o token da Meta e colar no Master; conta de administrador e token de desenvolvedor do Google aprovados. Conferir que a rotina `/api/cron/expire-reservations` está agendada no Render (a cada 5 a 10 min).
- **Fica para depois (TR5b):** públicos de clientes (pagantes para "semelhantes" e para excluir das campanhas de aquisição).

## D299 — [E-commerce] Anúncios na Meta pelo painel do lojista: diagnóstico, mesa da equipe e sala da campanha (2026-11-14)
- **Pedido do dono:** dar ao lojista a sensação de integração com a Meta, mesmo com a configuração feita à mão pela equipe: diagnóstico dinâmico no painel, pedido na mesa do Master, a equipe configura no Gerenciador de Anúncios e marca o andamento.
- **Decisões do dono (14/11/2026):**
  - diagnóstico grátis, depois proposta com valor, aceita no painel (reaproveita o pedido de orçamento do serviço "Gestão de Meta Ads" do catálogo);
  - a campanha roda na **conta de anúncios do lojista**, com a verba no cartão dele (a NextLevel recebe acesso de parceiro e nunca toca na verba);
  - a equipe lança os números da campanha nesta primeira entrega; a leitura automática pela API fica para a TR6.
- **Lojista, painel → Anúncios na Meta** (menu "Crescer"; não confundir com "Campanhas", que é a faixa de aviso da loja):
  - **Diagnóstico** em formato de conversa com a equipe, uma pergunta por vez (8 passos): objetivo, o que anunciar (produtos da loja com foto, até 10, ou a loja toda), público (gênero, idade, interesses), onde (Brasil, estados ou cidade e raio), verba por dia e duração (com o total do período e o aviso de que a verba vai direto para a Meta e de que resultado não é garantido), Instagram, conta de anúncios e materiais, oferta e diferencial, revisão.
  - **Prévia do anúncio** ao lado, em formato de post do Instagram, montada na hora com o nome da loja, a foto do produto escolhido, o texto da oferta e o botão do objetivo; é ilustrativa.
  - O rascunho salva sozinho; enviar leva à **sala da campanha**.
- **Sala da campanha** (a mesma para o lojista e para a equipe):
  - **Etapas:** Diagnóstico → Na mesa da equipe → Análise → Proposta → Preparação → Montagem → Revisão da Meta → No ar (mais Pausada, Encerrada e Cancelada). Cada etapa tem o que está acontecendo e com quem está (você, a equipe ou a Meta).
  - **O que falta:** passos do lojista (criar a conta de anúncios, dar acesso de parceiro, forma de pagamento na Meta, materiais, ligar o Instagram), criados a partir das respostas; e passos da equipe. O lojista marca os dele; a equipe marca todos e inclui novos.
  - **Proposta** com itens e total, e o botão "Aceitar proposta". Ao aceitar, a campanha vai para Preparação; o pagamento a equipe combina, como já faz no caixa.
  - **Números:** investido na Meta, pessoas alcançadas, cliques e conversas, lançados pela equipe por período, com comentário. As **vendas na loja** com a etiqueta da campanha (`nl-meta-…`) são contadas sozinhas (pedidos pagos).
  - **Conversa** entre lojista e equipe; mudanças de etapa, passos, proposta e números aparecem na mesma linha do tempo.
  - O lojista pode cancelar antes de ir ao ar.
- **Master → Mesa de anúncios:** quadro por etapa com loja, verba por dia, passos em aberto de cada lado e o selo "Lojista escreveu" quando falta resposta. No detalhe:
  - a mesma sala;
  - mover de etapa com recado opcional;
  - assumir;
  - criar a proposta, que segue para Propostas para preencher e enviar; "Proposta" só abre depois de enviada;
  - lançar números e incluir passos;
  - o link pronto para os anúncios (a loja com a etiqueta da campanha).
- **E-mails ao lojista:** diagnóstico recebido, mudança de etapa (com o recado), mensagem da equipe e números novos.
- **Quem pode:** só o dono da loja (funcionário não); na mesa, o dono do Master, o Comercial e o Conteúdo.
- **Banco:** tabelas `anuncios_loja`, `anuncios_eventos` e `anuncios_resultados` (migração 0098).
- **Depois:** ligação com a API de Marketing da Meta para os números virem sozinhos (TR6) e criação de campanha pela API quando fizer sentido.

# D300 — [E-commerce] E-mail para suporte@ vira atendimento no Master (2026-11-14)
- **Pedido do dono:** e-mail, atendimento e CRM ligados; quem escreve para suporte@ deve aparecer junto com o WhatsApp e o chat do site.
- **Como funciona:** e-mail para `suporte@nextlevelcommerce.com.br` entra em Master → Atendimento como conversa com a etiqueta "E-mail" (uma conversa aberta por pessoa; respostas novas entram na mesma). A parte citada da resposta é tirada; o assunto aparece no começo.
- **Responder:** a resposta da equipe no Atendimento sai por e-mail pela caixa da Hostinger, na mesma conversa do cliente. Se o envio falhar, nada fica registrado como respondido.
- **Segurança:** o aviso da Hostinger (`/api/webhooks/hostinger-mail`) só é aceito com o segredo `HOSTINGER_MAIL_WEBHOOK_SECRET` (o dono cola no Render); o corpo do aviso é ignorado: o sistema lê a própria caixa e cada e-mail entra uma vez só.
- **Reserva:** ao abrir o Atendimento, o sistema também busca os e-mails novos (no máximo 3 s de espera), para funcionar mesmo antes do aviso estar ligado.
- **Depende do dono:** o token da caixa (`HOSTINGER_MAIL_TOKEN`, D296) e, para chegar na hora, criar o aviso na Hostinger com o endereço `https://nextlevelcommerce.com.br/api/webhooks/hostinger-mail` e colar o segredo dele no Render.

# D301 — [E-commerce] Linha do tempo do cliente no Comercial com e-mails, contrato e faturas (2026-11-14)
- **Pedido do dono:** CRM, e-mail e comercial ligados, para ver tudo de um cliente num lugar só.
- **O que entrou na ficha (Master → Comercial → cliente):** além de conversas do site, Ajuda, formulário, atividades da loja, origem e notas, a linha do tempo agora mostra:
  - os e-mails trocados por suporte@ (D300), com quem escreveu;
  - o contrato (enviado, aceito) e cada parcela (avisou o Pix, confirmado, Pix não encontrado);
  - as faturas do plano (criada, situação e pagamento), com o valor.
- **Rótulos:** "Financeiro" para contrato, parcelas e faturas; o nome da pessoa com "(e-mail)" para os e-mails.
- **Filtros:** Tudo, Conversas e e-mails, Financeiro e Loja, com a contagem de cada um (os pedidos da loja não escondem mais o resto).

## D302 — [E-commerce] Tráfego e campanhas, fase TR6: leitura da Meta, custo por cliente real e números automáticos na sala do lojista (2026-11-16)
- **Leitura pela API de Marketing da Meta** (só leitura; mesmo token da API de conversões, D298, com permissão de leitura de anúncios): gasto, impressões, alcance, cliques no link, conversas e leads de cada campanha, por dia, na tabela `ads_metricas_diarias` (migração 0099). A rotina de 5 a 10 minutos lê **no máximo uma vez por hora** os últimos 7 dias, porque a Meta ajusta os últimos dias; uma leitura que falhou tenta de novo na volta seguinte. "Atualizar agora" força a leitura.
- **Duas origens:**
  - **a conta de anúncios da NextLevel**: o número é informado em Retorno às plataformas;
  - **as contas dos lojistas**: na Mesa de anúncios, a equipe informa o número da conta de anúncios do lojista (que deu acesso de parceiro), aperta "Buscar campanhas", marca as campanhas da sala e salva. Os números da sala passam a vir sozinhos: investido, vezes que o anúncio apareceu, cliques no link e conversas, com a hora da última leitura. Na primeira leitura a sala vem desde que foi ao ar, até 90 dias. Conta sem acesso dá a explicação "o lojista precisa dar acesso de parceiro". Os números lançados à mão continuam como notas da equipe.
- **Master → Tráfego e campanhas → Campanhas** (7, 30 ou 90 dias): cada campanha da NextLevel com investido e cliques (da Meta) ao lado de visitas, contatos, lojas criadas, pagantes e receita (do nosso sistema), mais **custo por contato, custo por pagante e retorno** (receita ÷ investido). A campanha é ligada pelo nome: o link do anúncio leva `utm_campaign={{campaign.name}}`, e a comparação ignora acento, maiúsculas e espaços. Quando a Meta conta mais leads que nós, aparece "Meta diz N", e vale o nosso número. Receita = primeira mensalidade dos pagantes e negócios fechados no Comercial (D294/D298).
- **Erros** (token inválido, conta sem acesso) ficam guardados em português, sem o token, e aparecem ao lado da hora da última leitura.
- **Quem vê:** o painel Campanhas, o dono e o Comercial; ligar a sala à conta do lojista, o dono, o Comercial e o Conteúdo.
- **Acessibilidade:** tabelas largas com rolagem lateral podem receber o foco do teclado; páginas novas do tráfego e dos anúncios com título próprio na aba.
- **Depende do dono:** o token da Meta precisa da permissão de leitura de anúncios (`ads_read`), e a conta de anúncios da NextLevel precisa estar informada. Para cada lojista, o acesso de parceiro com permissão de anúncios.
- **Próximas:** TR5b (públicos de clientes), pagamento da proposta de anúncios no painel, TR7 (Reels, depois da aprovação do aplicativo pela Meta).

## D303 — [E-commerce] Busca e IA: "Como nos conheceu?", o que cada página trouxe de cliente, robôs de IA, llms.txt e trilha de navegação (2026-11-16)
- **Pedido do dono:** fechar os 5 itens pequenos que faltavam na base do plano de busca, IA e Academy (`docs/prompts/busca-ia-academy-funil-organico.md`), antes de começar o conteúdo. Tudo estende o trabalho de Tráfego e campanhas (D290 a D298 e D302); nada foi duplicado.
- **1. "Como você conheceu a NextLevel?":** pergunta opcional no cadastro da loja e no "Quero minha loja", com as inteligências artificiais separadas (ChatGPT, Gemini, Perplexity, Copilot, Claude, Meta AI, outra), além de Google, redes sociais, parceiro, vendedor e amigo. A resposta fica na origem do contato (`origens_contato.conheceu_por`), aparece na ficha do cliente no Comercial ("Disse que conheceu por") e num quadro em Tráfego e campanhas → Origens. É a única forma de medir quem chega por uma IA sem deixar rastro. Só aceita as opções da lista; a resposta não apaga uma anterior. O que antes se chamava "Conheceu por" na ficha (o primeiro canal medido) passou a "Primeiro canal".
- **2. Páginas que trouxeram clientes** (Origens): para cada contato ou loja criada no período, a página por onde a pessoa entrou no site da primeira vez (primeiro toque, D290; sem ele, a entrada da visita), com contatos, lojas criadas, pagantes de hoje, a soma das mensalidades e o valor fechado à mão no Comercial. Ordenado pelo dinheiro trazido. Quem recusou a medição aparece como "página não registrada".
- **3. Robôs de busca e de IA:** o proxy reconhece 19 robôs (Google, Bing e Copilot, ChatGPT, Claude, Perplexity, Gemini, Meta AI, Apple e outros), soma as visitas em memória e grava em lote a cada 5 minutos ou 300 linhas (nunca uma escrita por visita), só por dia, marca, robô e página, sem IP. Painéis, API e lojas dos lojistas ficam fora. Se o servidor reiniciar, perde no máximo os últimos minutos. Quadro novo em Origens com as páginas que cada robô mais leu.
- **4. Arquivos para as IAs lerem:** `/llms.txt` (resumo, fatos do dia e mapa das páginas), `/llms-full.txt` (tudo junto) e as versões em texto `/planos.md` e `/faq.md`, só na Commerce, montados da tabela de páginas e dos fatos do sistema (`src/lib/seo/fatos-publicos.ts`, a mesma fonte das perguntas frequentes). Nenhuma grande IA garante que lê `llms.txt`; o custo é baixo.
- **5. Trilha de navegação:** "Você está em: Início › Parceiros › Indique pelo CPF" no rodapé das páginas públicas da Commerce (menos a home) e a mesma trilha em `BreadcrumbList` para o Google. Vale para as páginas da tabela e para cada tema.
- **Banco:** migração 0100 (coluna `conheceu_por` em `origens_contato`; tabela `robos_visitas_diarias`).
- **Teste:** `tests/busca-s2-conheceu-robos.test.ts` (lista de respostas, resposta guardada sem sobrescrever, soma por página, permissão da equipe, reconhecimento dos robôs, gravação em lote somando, formato do `llms.txt`, versões em texto e trilha).
- **Fica para depois:** versão em texto do comparativo, sitemaps separados por núcleo e dados estruturados de artigo e de curso (entram com a Academy, fases S3 e S4).

## D304 — [E-commerce] A plataforma continua NextLevel Commerce, com dois caminhos (Site e Loja virtual) e o gerenciador do negócio "NextLevel Business" dentro do painel (2026-11-13)
- **Pedido do dono:** a NextLevel deixa de ser só plataforma de loja virtual e vira o coração do negócio do cliente, sem marca nova. Plano completo (racional técnico e prompt engenheiro mestre, fases NB0 a NB10): `docs/prompts/nextlevel-business-coracao-do-negocio.md`.
- **Nome:** a plataforma **continua "NextLevel Commerce"** (D288 vale como está: domínio, e-mails, termos e contratos não mudam).
- **Entrada:** na home e no cadastro, a pessoa escolhe o caminho **Site** (site institucional, páginas de campanha, contatos e orçamentos) ou **Loja virtual** (o que existe hoje). Os dois criam o mesmo tipo de conta; ligar o outro caminho depois não troca conta, domínio nem dados.
- **Dentro do painel:**
  - **NextLevel Business** é o gerenciador do negócio. É o nome de uma área do painel, não uma marca, domínio ou cadastro à parte. Agrupa o que é do negócio em si, seja qual for o caminho: Agora, Contatos e orçamentos, Atendimento, Clientes, Vendas, Caixa, Financeiro, Captação, Seja encontrado, Análise, Resultados da Meta e a IA;
  - ao lado dele ficam as áreas **Site** e **Loja virtual**, conforme o que o negócio usa, e **Ajustes**;
  - nenhum endereço atual muda, só o agrupamento do menu (prompt, Parte 5.14).
- **Só na Commerce:** as outras marcas não mostram o NextLevel Business (em pausa, D287).
- **Fica para a NB0:** os demais padrões da Parte 10 do prompt (piloto, caixa como adicional, captação por plano, portal adiado, pedido de aprovação do aplicativo da Meta em paralelo), salvo nova orientação do dono.
- **Nada no código ainda:** decisão e plano. A primeira entrega de código é a NB1.

## D305 — [E-commerce] NextLevel Business, fase NB0: linha de base, padrões aceitos e academia piloto confirmada (2026-11-13)
- **Pedido do dono:** "pode seguir com a NB0". Ele também já tem uma academia para o piloto do portal e vai detalhar o piloto em outra conversa.
- **Linha de base** (`docs/relatorios/NB0-LINHA-DE-BASE-2026-11-13.md`):
  - tipos e estilo passaram;
  - 231 de 231 testes dos pontos que o plano vai mexer passaram;
  - no navegador passaram `smoke-demo`, `storefront-journey` e `theme-editor`;
  - `checkout-flow` (fluxo antigo do SuperDrop, em pausa) já falhava antes: fica registrado como falha preexistente, não regressão.
- **Padrões da Parte 10 aceitos:**
  - Vidraçaria Modelo na demonstração;
  - Caixa como adicional com preço no Master;
  - Captação no Pro e no Scale, e uma página de campanha no Start;
  - etiqueta `[E-commerce]`;
  - pedir já a aprovação do aplicativo da Meta (tarefa do dono, em paralelo).
- **Academia:** o portal do cliente sai da gaveta. O detalhamento entra em `docs/prompts/portal-academia-piloto.md` (estrutura, 23 perguntas e padrões sugeridos prontos). Com ele preenchido, a NB10 pode vir logo depois da NB3. As fases NB1 a NB3 já deixam as bases (plano, Parte 5.16):
  - chave `portal` nos módulos (desligada);
  - endereço `/portal` reservado;
  - `stores.fuso`;
  - aluno = `customers` + `store_customers` com o login sem senha por loja (`conta-cliente.ts`);
  - modelo de site "Academia".
- **Correções do diagnóstico:**
  - a Commerce não mostra "SuperDrop" no topo do painel (usa `commerce-home.tsx`; a NB1 troca para "NextLevel Business · Visão geral do negócio");
  - com o cadastro fechado (`BRAND_SIGNUP_NEXTLEVEL_COMMERCE` desligada), a entrada é `/quero-minha-loja`, que também passa a perguntar Site ou Loja virtual (Parte 5.15).
- **Nada no código de produto.** Próxima fase: NB1.

## D306 — [E-commerce] NextLevel Business, fase NB1: dois caminhos na entrada, menu do gerenciador do negócio e vitrine do caminho Site (2026-11-14)
- **Pedido do dono:** "prossiga" (NB1 do plano `docs/prompts/nextlevel-business-coracao-do-negocio.md`, depois da NB0, D305).
- **Tudo atrás da chave `BUSINESS_V1`** (no Render, `true` liga; ausente ou outro valor, o sistema fica exatamente como antes). **Recomendação:** ligar em produção só depois da NB3, quando o site já tiver páginas e o formulário de orçamento; até lá, conferir pela demonstração.
- **Banco (migração 0101, só acrescenta):**
  - `stores.formato` (`LOJA` para todas as contas antigas, ou `SITE`);
  - `stores.fuso` (padrão `America/Sao_Paulo`, base do portal da academia).
- **Regra única de módulos** (`src/lib/business/modulos.ts`):
  - com a chave e na marca Commerce, todo negócio tem Visão geral e Contatos;
  - Site vem do formato `SITE` ou do direito `modulo:site`;
  - Loja vem do formato `LOJA` ou do direito `modulo:loja`;
  - Captação, Caixa, Meta e Portal só com direito (`entitlements`, chave `modulo:<nome>`);
  - `requireModulo` barra no servidor;
  - sem a chave, todo negócio volta a ser loja (reversão segura).
- **Nomes** em `src/lib/marcas/nextlevel-ecommerce.ts`: `NOME_GERENCIADOR` ("NextLevel Business", "Gerenciador do seu negócio") e `CAMINHOS` (Site para minha empresa · Loja virtual).
- **Entrada:**
  - **home:** seção "O que o seu negócio precisa agora?" com os dois caminhos;
  - **cadastro aberto:** `/cadastro?para=site` ("Seu site no ar hoje") cria a conta `SITE`. O servidor só aceita `SITE` com a chave ligada e na Commerce;
  - **formulário assistido** `/quero-minha-loja`: pergunta "O que você quer?" (Site para minha empresa · Loja virtual · Ainda não sei). A resposta vai para o Comercial do Master no detalhe do cartão ("Quer: site para a empresa"), guardada em `brand_leads.needs` como `caminho:<valor>`; a segunda escolha substitui a primeira;
  - **atalho** `/quero-meu-site` para anúncios: mantém as etiquetas da campanha.
- **Painel:**
  - o menu do lojista vira quatro grupos (`navDoNegocio` em `src/lib/nav.ts`):
    - **NextLevel Business:** Agora, Atendimento, Clientes, Pedidos e vendas, Financeiro, Campanhas, Análise, Pede pro Maurício;
    - **Site:** Aparência, Domínio;
    - **Loja virtual:** Minha loja, Produtos, Categorias, Banners, Cupons, Avaliações, Pós-venda, Migrar e anunciar, Aparência, Temas, Cadastro de clientes;
    - **Ajustes:** Empresa, Equipe, Aplicativos, Ferramentas, Minha assinatura, Contratos, Registro de ações;
  - nenhum endereço some (teste);
  - quem é só Site vê um cartão "Ligar loja virtual" no lugar dos itens de loja;
  - a visão geral mostra "NextLevel Business · Visão geral do negócio" e "Painel do negócio";
  - num `SITE`: selo "Site publicado", botões "Ver site" e "Editar o site", e a fila sem as pendências de montar loja.
- **Junção com as outras conversas (16/11/2026):** esta conversa trabalhou em paralelo a outras que numeraram decisões e migrações ao mesmo tempo. Na primeira junção estas decisões saíram de D295 a D297 para D302 a D304; na segunda, como D302 (TR6) e D303 (Busca e IA) também tinham sido usadas, ficaram **D304 (nome e organização), D305 (NB0) e D306 (NB1)**, e a migração `formato`/`fuso` ficou **0101**. O item "Anúncios na Meta" (D299) entrou no grupo NextLevel Business do menu. Encaixe completo no plano, Parte 0.3.
- **Vitrine do caminho Site** (sem o módulo Loja): catálogo, produto, carrinho e checkout mostram "Página não encontrada" (como toda página inexistente da vitrine, que carrega em etapas); `feed.xml` responde 404; o `sitemap.xml` lista só o início.
- **Ficou para as próximas fases:**
  - a página pública `/empresas` (sai na NB3, quando houver formulário e contatos para mostrar de verdade);
  - criar a conta no formato certo pelo Master, que hoje não cria conta Commerce à mão (NB2);
  - esconder o carrinho e os blocos de produto do tema na página inicial de um `SITE` (NB2, com o modelo institucional).
  - textos de loja que ainda aparecem para um `SITE` (NB2):
    - "Status da loja" e o recado do fundador ("Sua loja já existe") na visão geral;
    - o botão "Publicar loja" em Minha loja;
    - os termos de uso, que descrevem a plataforma como loja virtual (revisar com o texto jurídico na NB8).
- **Conferido no navegador** (demonstração com a chave ligada; relatório `docs/relatorios/NB1-2026-11-14.md`):
  - home com os dois caminhos;
  - `/quero-meu-site` com site marcado e a etiqueta da campanha mantida, sem rolagem lateral em 360 px;
  - cadastro "Seu site no ar hoje" → aceite dos termos → painel do negócio com Site, sem Produtos e com "Ligar loja virtual";
  - site publicado pelo painel: catálogo, carrinho e checkout com "não encontrada", e `feed.xml` com 404;
  - lojista com loja: menu em quatro grupos;
  - axe sem violações graves no formulário, na home (na seção nova) e no painel;
  - regressão `smoke-demo`, `storefront-journey` e `theme-editor` passando.
- **Testes:** `tests/business-modulos.test.ts` (regra dos módulos, cadastro com o caminho, direitos, `requireModulo`, caminho do interessado) e `tests/nav-business.test.ts` (grupos, nenhum endereço perdido, cartão de upgrade, barra do celular).

## D307 — [E-commerce] NextLevel Business, fase NB2: páginas do site, serviços da empresa e modelos prontos (Institucional e Academia) (2026-11-16)
- **Pedido do dono:** "vamos desenvolver" (depois da junção com as outras conversas, D304 a D306). Plano: `docs/prompts/nextlevel-business-coracao-do-negocio.md`, NB2.
- **Banco (migração 0102, só acrescenta):**
  - `paginas_site`: páginas livres com rascunho, publicado, revisão, endereço, tipo (Sobre, Serviços, Contato, Campanha, Livre), menu, SEO e arquivar;
  - `servicos_negocio`: o que a empresa oferece, com "a partir de" opcional (sem preço = "sob orçamento").
- **Regras** (`src/lib/business/paginas.ts`, `servicos.ts`, `modelos-site.ts`):
  - endereço só com letras minúsculas, números e hífens;
  - endereços da loja e do portal reservados (`cart`, `checkout`, `catalog`, `portal`…);
  - rascunho com controle de revisão (duas abas não se sobrescrevem);
  - publicar guarda a versão no histórico (`pagina:<id>`), que pode ser restaurada;
  - arquivar tira do ar sem apagar;
  - outro negócio não lê nem altera (testado no servidor).
- **Editor:** as páginas livres aparecem no seletor de páginas ("Sobre (/sobre)"). Salvar, publicar, descartar e o histórico valem para elas, com a mesma regra de nível do tema. Num site sem loja, Produto, Coleção e Carrinho somem do seletor.
- **Página nova nunca nasce vazia:** nos temas básicos não dá para acrescentar seções (regra dos níveis), então cada tipo traz um conteúdo inicial editável.
- **Seções novas** (valem em todos os temas):
  - "Serviços": cartões com o botão "Pedir orçamento" pelo WhatsApp, até a NB3 trazer o formulário;
  - "Contato, endereço e horário": com "Como chegar";
  - "Trabalhos realizados": fotos com legenda.
- **Vitrine:**
  - `/<endereço>` abre a página publicada antes do redirecionamento de endereço antigo (D187);
  - o sitemap lista as páginas, e a de campanha fica fora;
  - num site sem loja, o cabeçalho mostra Início e as páginas no menu, sem carrinho, conta ou "acompanhar pedido", e o rodapé sem "Pagamento seguro · Envio para todo o Brasil".
- **Modelos prontos:**
  - "Institucional de serviços": Início, Sobre, Serviços, Contato;
  - "Academia e estúdio": Início, Sobre, Modalidades, Grade de aulas, Contato. A grade é texto até o portal do aluno (NB10).
  - A conta criada no caminho Site **já nasce com o institucional publicado**. Em Site → Páginas, "Usar este modelo" aplica em rascunho: a página inicial anterior vai para o histórico e as páginas que já existem não são tocadas.
- **Painel:**
  - **Site → Páginas:** lista com situação, "Editar conteúdo", "Ver no site", menu, arquivar, página nova e modelos;
  - **Site → Serviços:** cadastro, editar, esconder do site e aviso quando falta o WhatsApp;
  - as ações só rodam com o módulo Site (conferido no servidor).
- **Textos de site:** "Status do site", recado do fundador ("Seu site já existe…"), "Publicar site", "Ver site" e "este site não está publicado".
- **Criar conta Site pelo Master:** não se aplica. O Master não cria conta Commerce à mão; a equipe usa o cadastro (`/cadastro?para=site`) ou o formulário assistido.
- **Conferido no navegador** (relatório `docs/relatorios/NB2-2026-11-16.md`): 20 passos da jornada do site, axe sem violações graves nas telas novas e no site, 360 px sem rolagem lateral; regressão do editor de temas, da loja e do roteiro geral passando.
- **Testes:** `tests/business-site.test.ts` (endereços, rascunho e publicação, duas abas, histórico, isolamento, serviços, modelos, conta Site pronta, conta de loja sem páginas), mais `nav-business` e `editor-state`.
- **Próxima fase:** NB3 (formulário de orçamento com origem, caixa de contatos, orçamento por proposta, WhatsApp com código) e a página pública `/empresas`.
