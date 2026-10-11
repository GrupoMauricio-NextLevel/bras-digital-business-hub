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
- **Checkout das lojas somente Pix:** preferência do Mercado Pago exclui cartão, débito, boleto, caixa eletrônico e saldo. Cartão em 1x (+6%) fica para a cobrança dos planos, quando houver cartão.
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
