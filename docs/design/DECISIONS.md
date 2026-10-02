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
