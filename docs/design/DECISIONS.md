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
