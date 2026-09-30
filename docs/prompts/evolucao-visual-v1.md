# EVOLUÇÃO VISUAL E OPERACIONAL — NEXTLEVEL COMMERCE ENGINE / SUPERDROP

Você atuará como PRINCIPAL PRODUCT DESIGNER + SENIOR FULL-STACK ENGINEER + ARQUITETO DE SOFTWARE.
O repositório já existe e funciona. Sua missão é evoluir a experiência de cinco painéis, adicionar o que a operação real exige (etiqueta em arquivo, recarga Pix, usuário de expedição, gates por plano) e colocar a Loja de Serviços NextLevel em destaque em todos eles. Entregue código executável, testado e revisado visualmente. Não entregue apenas documentação.

============================================================
0. MODO DE OPERAÇÃO
============================================================

- Autonomia total. Só pare para perguntar se houver: risco de apagar dados, necessidade de credencial ou segredo, ação irreversível, conflito grave com o código existente, ou decisão comercial que mude materialmente o produto. Fora isso, decida, registre em docs/design/DECISIONS.md e siga.
- Trabalhe em fases (seção 9). Ao fim de cada fase rode, nesta ordem: npm run lint, npm run typecheck, npm test, npm run build, npm run e2e. Corrija tudo antes de avançar. Faça um commit por fase com mensagem descritiva e dê push na branch de trabalho atual. Não abra pull request sem pedido.
- Antes de codar, leia CLAUDE.md, AGENTS.md, ARCHITECTURE.md, docs/FINANCEIRO.md e o código real. Este Next.js é uma versão recente com mudanças de API: consulte node_modules/next/dist/docs/ antes de usar APIs que você não tem certeza.
- Nunca deixe 30 telas pela metade. Uma fase só termina quando seus critérios de aceite passam. Se faltar tempo, corte escopo das fases finais, nunca a qualidade das iniciais, e diga exatamente o que cortou.
- Fiscal (nota fiscal, tributos) está FORA DO ESCOPO. Não implemente nem mencione como funcionalidade ativa.
- Nada de integração real além do Mercado Pago (Pix) já previsto. SuperFrete e Melhor Envio continuam manuais: o lojista gera a etiqueta lá e ANEXA o arquivo no sistema.
- Não modifique, publique nem reutilize banco de produção de outros projetos. Nenhum segredo no código.

============================================================
1. RESULTADO ESPERADO
============================================================

Cinco experiências, uma linguagem visual única e evoluída:

1. MASTER (NextLevel): torre de controle do negócio inteiro.
2. FORNECEDOR, dois níveis de usuário:
   2a. GESTOR ADM: operação, rede de lojistas, financeiro organizado.
   2b. EXPEDIÇÃO (novo papel): interface mínima para receber pedidos, imprimir etiqueta e lista de separação, despachar.
3. LOJISTA LITE (ofertas DROP_MANUAL e STORE_SUBDOMAIN): simples, focado em saldo, pedidos e etiqueta.
4. LOJISTA PRO (oferta STORE_OWN, loja white label): avançado, com análise, editor de loja, templates, domínio, clientes.
5. LOJA DE SERVIÇOS NEXTLEVEL: presente e em destaque nos quatro painéis acima, com muitas possibilidades de upgrade.

============================================================
2. ESTADO ATUAL DO CÓDIGO (não reescreva, evolua)
============================================================

- Stack: Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind v4 (tokens em src/app/globals.css com @theme inline), Radix UI, lucide-react, sonner, Drizzle ORM em Postgres (PGlite local, Neon/Postgres em produção), Zod, Vitest.
- Camadas: src/db (schema.ts, seed.ts, base-data.ts, bootstrap-data.ts), src/lib/domain (access, orders, inventory, catalog, finance, provisioning, products), src/lib/finance (engine, price-book, revenue-map), src/lib/queries (master, supplier, merchant, storefront), src/app/actions/* (server actions finas), painéis em src/app/{master,supplier,merchant}, storefront em src/app/store/[slug], componentes em src/components/{ui,app,shared,finance,storefront}.
- Regra de ouro já existente: componentes visuais não têm regra de negócio. Actions só validam sessão e delegam ao domínio. Todo acesso passa por Actor e assertCanAccess.
- Papéis atuais: NEXTLEVEL_MASTER, SUPPLIER_ADMIN, STORE_OWNER. Navegação por papel em src/lib/nav.ts (ícones referenciados por nome, pois cruzam a fronteira server para client).
- Ofertas de loja (stores.offer): DROP_MANUAL, STORE_SUBDOMAIN, STORE_OWN. Planos em plans com key por oferta.
- Pedidos: estados PENDING, AWAITING_CENTRAL_PAYMENT, AWAITING_LABEL, READY_TO_PICK, PICKING, READY_TO_SHIP, SHIPPED, DELIVERED, CANCELED. Regra central: READY_TO_PICK só com cliente pago, Central paga e etiqueta pronta (resolveFulfillmentStatus). Hoje o pagamento à Central é confirmado MANUALMENTE pelo lojista e a etiqueta é só código e transportadora.
- Expedição atual: quadro em /supplier/shipping.
- Serviços atuais: tabelas services e service_leads, oito cards com botão "Tenho interesse".
- Financeiro da NextLevel já existe em Master, Financeiro (contratos, faturas, fechamento, bloqueio por inadimplência, simulador). Não quebre.
- Qualidade atual: 99 testes Vitest, lint e typecheck limpos, npm run e2e (Playwright com Mercado Pago simulado, banco limpo, sem demo). Modo demo (NEXT_PUBLIC_DEMO_MODE=true e SEED_DEMO) tem login de um clique e seletor de perfis.
- Design atual: neutros frios, primary #111827, brand #16a34a, raio 10px, fonte de sistema, sidebar clara. Funcional, mas genérico.

============================================================
3. DECISÕES ASSUMIDAS (o dono pode editar antes de rodar; se editar, siga a versão editada)
============================================================

D1. Recarga Pix por lojista, por fornecedor. O lojista recarrega saldo via Pix na conta Mercado Pago DO FORNECEDOR. O sistema apenas registra um livro-razão (a NextLevel nunca guarda dinheiro de terceiros). Saldo é crédito do lojista junto ao fornecedor.
D2. O pedido só entra na fila de expedição depois de o custo dele ser DEBITADO do saldo. Pedido sem saldo suficiente fica em AWAITING_CENTRAL_PAYMENT, exibido como "Aguardando recarga", e é debitado automaticamente (mais antigo primeiro) quando uma recarga aprovada entra. Prazo máximo configurável (padrão 72 h): vencido, o pedido é cancelado, o estoque volta e o lojista é avisado. O botão manual "Confirmar pagamento à Central" do lojista deixa de existir. O Gestor ADM ganha "Registrar crédito manual" com motivo obrigatório e trilha de auditoria, para exceções.
D3. Etiqueta é arquivo. O lojista anexa o PDF gerado no SuperFrete (até 5 arquivos por pedido, PDF até 3 MB cada, validar assinatura %PDF, guardar sha256). Código de rastreio e transportadora viram opcionais. A etiqueta pronta é definida por "há pelo menos um arquivo anexado".
D4. Papel novo SUPPLIER_DISPATCH ("Expedição"): criado pelo Gestor ADM em Equipe. Vê só pedidos de READY_TO_PICK em diante, etiquetas, itens, destino. NÃO vê custo, preço, saldo, financeiro, lista de lojistas nem configurações. Pode avançar PICKING, READY_TO_SHIP, SHIPPED e DELIVERED e imprimir.
D5. Gates por oferta: DROP_MANUAL sem loja virtual. STORE_SUBDOMAIN com loja em subdomínio (slug.superdrop.com.br, com fallback /store/[slug]) e tema Starter. STORE_OWN com domínio próprio, templates premium, editor avançado, análise e equipe. Recursos bloqueados aparecem com cadeado e CTA de upgrade para a Loja de Serviços, nunca escondidos.
D6. Referência visual Natural GO: o direcionamento anterior de "não reutilizar identidade" foi REVISTO pelo dono. Use a linguagem da Natural GO como ponto de partida (cards claros, dashboards objetivos, ações rápidas, forte experiência mobile) e EVOLUA. Você não tem acesso aos arquivos da Natural GO nesta sessão. Se o dono anexar prints, tokens ou código em docs/design/reference/, estude e aplique. Sem esse material, aplique os princípios acima, sem inventar que "copiou" algo.
D7. Idioma pt-BR, moeda BRL, datas dd/mm, fuso America/Sao_Paulo na exibição.

============================================================
4. DIREÇÃO VISUAL (evolua, não decore)
============================================================

Tese: SaaS comercial sério, quente e claro, denso onde há gestão e generoso onde há operação. Cada painel tem a MESMA gramática e um "clima" próprio.

4.1 Sistema
- Tokens semânticos em CSS variables: superfície (canvas, surface, raised, sunken), texto (primary, secondary, muted), borda, foco, marca, e estados (success, warning, danger, info) com versões soft. Modo claro completo e modo escuro completo por painel, com seletor no menu do usuário e respeito a prefers-color-scheme. Contraste AA em todo texto. Valide paletas de gráfico com o script do skill dataviz (validate_palette.js) e mantenha legenda e tabela alternativa.
- Tipografia: escala fixa (12, 13, 14, 16, 20, 24, 32, 48), pesos definidos, números tabulares em valores. Escolha uma família de exibição com personalidade para títulos e números grandes e uma família de texto legível. Verifique se o build baixa fontes do Google; se não conseguir, embuta os arquivos em public/fonts com next/font/local. Nunca dependa de rede em runtime.
- Espaço e forma: grade de 4px, raios 8, 12 e 16, sombras discretas em duas camadas, bordas de 1px. Cartões só quando o objeto precisa se destacar. Nada de gradientes exagerados, glassmorphism ou dezenas de gráficos inúteis.
- Movimento: micro-interações de 120 a 200 ms (hover, foco, abrir gaveta, toast), skeletons fiéis ao layout final, transições de rota suaves. Respeite prefers-reduced-motion.
- Clima por painel (accent e densidade): Master, grafite e verde da marca, denso, modo escuro opcional destacado. Fornecedor ADM, claro com azul-petróleo, denso médio. Expedição, alto contraste, alvos grandes, tablet primeiro. Lojista Lite, claro e amigável, muito espaço, um CTA dominante. Lojista Pro, claro sofisticado, denso médio, com gráficos.

4.2 Componentes novos ou reformados (em src/components/ui e src/components/app, com uma página viva /dev/design visível só em desenvolvimento, mostrando todos os estados)
- AppShell v2: sidebar recolhível (ícone e rótulo), topo com busca global, central de notificações, seletor de tema, menu do usuário; em mobile vira barra inferior de 4 atalhos mais "Mais". Item "Loja NextLevel" fixo no topo da navegação de todos os painéis, com selo de novidade.
- Paleta de comandos (Ctrl/Cmd+K): navegar, buscar pedido por número, buscar loja, ações rápidas por papel.
- KpiTile com variação e sparkline, StatusPill com ícone e rótulo (nunca só cor), DataTable v2 (cabeçalho fixo, seleção em lote, densidade, ordenação, virada em cards no mobile), FilterBar, Drawer lateral, Stepper, Timeline, EmptyState com ilustração leve em SVG, FeatureGate (cadeado e CTA de upgrade), UpgradeCard, ServiceCard, MoneyInput e PercentInput reutilizáveis.
- Acessibilidade: foco visível, navegação por teclado completa, rótulos em todo controle, aria-live nos toasts e nos contadores que mudam sozinhos.

============================================================
5. ARQUITETURA DE INFORMAÇÃO E TELAS POR PAINEL
============================================================

5.1 MASTER, torre de controle (rota /master)
- Faixa superior: GMV, receita recorrente, taxas do mês, lojas ativas, fornecedores, receita em risco (faturas vencidas), com variação e sparkline.
- Caixa de entrada de alertas priorizados: fornecedores com atraso e nível de bloqueio, pedidos parados há mais de X horas, recargas com falha, leads novos da Loja NextLevel, lojas aguardando pagamento de setup. Cada alerta tem ação direta.
- Módulos: mapa de saúde da rede (fornecedores e lojas por estado), ranking de fornecedores (volume, ativação, churn), funil e pipeline de leads e pedidos de serviço (kanban), receita por origem, atividade recente, atalhos para Financeiro, Contratos e Simulador.
- Itens do menu: Visão geral, Fornecedores, Lojas, Pedidos, Financeiro, Loja NextLevel (gestão: catálogo, preços, pedidos de serviço, leads), Catálogo, Templates, Planos, Configurações.

5.2a FORNECEDOR GESTOR ADM (rota /supplier)
- Home: quadro de pedidos por estágio (Aguardando recarga, Aguardando etiqueta, Pronto para separar, Separando, Pronto para envio, Enviado hoje) com contadores, tempo de espera e alerta de atraso; estoque crítico; saúde da rede (lojistas ativos, saldo total dos lojistas, inativos há 30 dias); faixa "NextLevel Store" com recomendações.
- Pedidos: lista e quadro, filtros, detalhes em gaveta, linha do tempo, etiquetas anexadas com pré-visualização e impressão.
- Financeiro organizado (abas): Visão geral (saldo total dos lojistas, recargas hoje e no mês, pedidos aguardando saldo, comissões de canal), Recargas (lista com Pix, status, id do Mercado Pago, conciliação), Saldos por lojista (extrato, ajuste manual com motivo, estorno de saldo conforme política do fornecedor), Pedidos aguardando recarga, Fatura NextLevel (o que já existe), Configuração (conectar credenciais do Mercado Pago do fornecedor com teste de conexão).
- Equipe: criar, listar, redefinir senha e desativar usuários de Expedição (e-mail e senha temporária, fluxo já existente).
- Demais itens: Produtos, Estoque, Lojistas (com oferta, saldo e último pedido), Conteúdo, Configurações.

5.2b FORNECEDOR EXPEDIÇÃO (rota /supplier/dispatch, tablet primeiro)
- Uma tela principal, sem menu lateral pesado: abas grandes A separar, Separando, Prontos para envio, Enviados hoje, cada uma com contador.
- Campo "Bipar pedido" sempre focado (leitor USB atua como teclado): Enter abre o pedido e o destaca. Atalhos de teclado (P imprime etiqueta, L imprime lista, Enter avança estágio).
- Cartão do pedido: número, loja, cidade e UF do destino, peças totais e resumo por tamanho (mostrar a grade expandida), transportadora, tempo de espera, selo Etiqueta anexada, botões grandes Imprimir etiqueta, Imprimir lista de separação, Avançar.
- Lote: seleção múltipla e "Imprimir N etiquetas" gerando um único PDF na ordem da fila. Reimpressão registra quem, quando e quantas vezes.
- Sem dinheiro: nenhum valor, saldo, custo ou dado financeiro em nenhuma tela, rota ou payload desse papel.
- Feedback tátil e sonoro opcional (som curto ao avançar), alto contraste, funciona bem em 768 px e em celular.

5.3 LOJISTA LITE (rota /merchant, ofertas DROP_MANUAL e STORE_SUBDOMAIN)
- Home responde em segundos: quanto tenho de saldo, o que preciso fazer agora, como estão meus pedidos. Cartão de saldo com CTA dominante "Recarregar via Pix".
- Recarga Pix: valores rápidos (R$ 100, 300, 500, 1.000 e outro), QR Code e "copia e cola", cronômetro de expiração, atualização automática ao aprovar, histórico e extrato.
- Fila "Precisa de você": pedidos aguardando etiqueta (upload por arrastar e soltar, pré-visualização, substituir, validação), pedidos aguardando recarga com valor faltante e botão de recarga já preenchido.
- Novo pedido manual em destaque (WhatsApp, Instagram, balcão). Catálogo com margem por produto e "Ativar todos". Clientes. Financeiro simples (saldo, extrato, recargas).
- STORE_SUBDOMAIN adiciona: Loja virtual, Aparência básica e Templates Starter. DROP_MANUAL vê esses itens bloqueados com CTA "Desbloquear loja".

5.4 LOJISTA PRO (rota /merchant, oferta STORE_OWN)
- Tudo do Lite mais: Análise (vendas 30 dias, margem, ticket, conversão e funil da loja, produtos campeões, clientes recorrentes), Editor da loja (seções, banners, cores, logo, prévia ao vivo em três larguras), Templates (Starter ativo, Pro e Elite com prévia e compra pela Loja NextLevel), Domínio próprio (instruções de DNS e verificação de estado), Clientes com consentimentos de marketing e segmentos simples, Equipe (usuários da loja), Relatórios exportáveis em CSV.

============================================================
6. LOJA DE SERVIÇOS NEXTLEVEL (destaque em todos os painéis)
============================================================

Não é um menu escondido. É um produto dentro do produto.

- Presença: item fixo no topo da navegação, faixa de destaque na home de cada painel (hero com 1 a 3 recomendações contextuais), CTA de upgrade nos FeatureGates e cartões "Sugestão para você" em telas relevantes (ex.: pedido sem etiqueta sugere assistente de frete; estoque parado sugere fotos e conteúdo).
- Motor de recomendação PURO e testado: recommendServices(contexto) recebe papel, oferta, estado da loja e do fornecedor (onboarding incompleto, sem logo, sem vendas em 14 dias, sem domínio, plano Lite, estoque alto, atraso financeiro) e devolve a lista ordenada com o motivo em linguagem simples.
- Catálogo rico (categorias, badges Popular e Novo, entregáveis, prazo, preço único ou recorrente, faixas Básico, Pro e Premium, pré-requisitos, prova social). Cobrir todos os sentidos de upgrade:
  Loja: upgrade para Loja própria, Templates Pro e Elite, domínio próprio, configuração profissional, migração assistida de catálogo.
  Marca e criativo: identidade visual, logo, banners mensais, ensaio fotográfico de produto, vídeos e reels, conteúdo para redes.
  Crescimento: tráfego pago Meta e Google, automação de WhatsApp, e-mail marketing, SEO, influenciadores, recuperação de carrinho.
  Operação: assistente de etiquetas e frete, integração com ERP (marcar Em breve quando não existir), treinamento da equipe, atendimento terceirizado, relatórios avançados.
  Para fornecedores: subir de faixa, White Label, importação assistida de catálogo, ensaio em massa, captação de lojistas, gestão de rede, suporte premium com SLA.
  Fiscal: NÃO listar.
- Fluxo: detalhe do serviço em gaveta, escolha de faixa, briefing curto, pedido de serviço (service_orders) com pipeline NOVO, EM_ANALISE, EM_EXECUCAO, ENTREGUE, CANCELADO e mensagens simples entre cliente e NextLevel. Pagamento: registre a intenção e o valor; o checkout na conta Mercado Pago da NextLevel fica como próxima etapa, claramente sinalizado, mas o pedido e o pipeline funcionam de ponta a ponta.
- Master gerencia tudo isso: catálogo, preços, faixas, pipeline de pedidos, leads e receita da origem "Extras" do módulo financeiro.

============================================================
7. MUDANÇAS DE DOMÍNIO NECESSÁRIAS (antes das telas que dependem delas)
============================================================

Siga as convenções do repositório: Drizzle pg-core, valores em centavos inteiros, timestamps com o helper ts(), enums como texto, migrações com drizzle-kit generate, IDs com newId, regras em src/lib/domain com testes, actions finas com runAction.

7.1 Papel de expedição
- users.role ganha SUPPLIER_DISPATCH. Estender access.ts (Actor, assertCanAccess, requireSupplierId), nav.ts, requireRole (aceitar lista de papéis) e o redirecionamento por papel.
- Criar DTO de pedido para expedição que NUNCA contém campos monetários. Nenhuma query, action, rota de API ou payload de página desse papel pode devolver custo, preço, saldo ou financeiro. Teste isso por varredura de chaves.
- Gestor ADM cria e gerencia usuários de expedição (reaproveite provisionamento com senha temporária e troca obrigatória).

7.2 Livro-razão de saldo (recarga Pix)
- Tabelas: wallet_accounts (supplierId, storeId, único por par), wallet_entries (accountId, type RECHARGE, ORDER_DEBIT, ORDER_REFUND, ADJUSTMENT, valor com sinal, orderId, rechargeId, actorUserId, motivo, saldo após, dedupeKey única), wallet_recharges (accountId, valor, status PENDING, APPROVED, EXPIRED, CANCELED, id do pagamento no Mercado Pago, qr_code, qr_code_base64, ticket_url, expira em, aprovado em).
- Fornecedor conecta o próprio Access Token do Mercado Pago (cifrado, mesmo padrão das lojas) em Configurações, com teste de conexão.
- Recarga: Pix pela API de pagamentos do Mercado Pago com o token do fornecedor, external_reference da recarga, expiração de 30 min, notification_url pública quando https. Webhook dedicado que NUNCA confia no corpo: consulta o pagamento na API, confere fornecedor, valor e status, e credita de forma idempotente. Polling de segurança na tela do lojista.
- Invariantes obrigatórias e testadas: saldo nunca negativo por débito de pedido; duas operações simultâneas não podem gastar o mesmo saldo (transação com bloqueio de linha ou controle otimista); saldo é sempre igual à soma das entradas; webhook repetido não credita duas vezes; recarga aprovada depois de expirada credita e sinaliza.
- Débito de pedido: no momento em que existe saldo. Ao debitar, marcar centralPaymentStatus PAID e centralPaidAt (base da taxa de volume da NextLevel, que segue igual). Ao entrar recarga, debitar automaticamente os pedidos em espera, do mais antigo ao mais novo. Cancelamento de pedido já debitado devolve o valor ao saldo (ORDER_REFUND).
- Remover o botão e a action de confirmação manual do lojista. Manter crédito manual apenas para o Gestor ADM, com auditoria.

7.3 Etiqueta como arquivo
- Tabelas: order_label_files (orderId, nome, mime, tamanho, sha256, conteúdo, enviado por, data) atrás de uma interface LabelStorage (implementação em banco agora, trocável por S3 depois) e label_prints (fileId ou lote, quem imprimiu, quando).
- Validação: apenas PDF, até 3 MB, até 5 por pedido, assinatura %PDF, sem duplicar o mesmo sha256 no mesmo pedido. Anexar atualiza shippingLabelStatus para READY e reavalia o estado do pedido.
- Download seguro: rota GET /api/labels/[orderId]/[fileId] com sessão, escopo de tenant e papel (Expedição só de READY_TO_PICK em diante), Content-Disposition inline, sem cache público.
- Lote: rota que junta N etiquetas em um PDF único (pdf-lib), limite de 50 pedidos, na ordem pedida, registrando a impressão.
- Impressão: iframe oculto e window.print() para etiqueta e lote; página de lista de separação com @media print (A4) mostrando itens, tamanhos e a grade expandida; CSS @page para etiqueta 10x15 cm quando aplicável.

7.4 Gates por oferta
- Mapa OFFER_FEATURES (fonte única) e função canUse(loja, recurso), testados. FeatureGate no servidor e no cliente. Toda action protegida por recurso valida no domínio, não só escondendo o botão.
- Subdomínio: middleware que resolve slug.<SUPERDROP_ROOT_DOMAIN> para /store/[slug] com lista de subdomínios reservados (www, app, api, admin), e domínio próprio via stores.customDomain quando domainStatus for CONNECTED. Mantenha /store/[slug] como fallback. Configurável por variável de ambiente, desligado quando ausente.

7.5 Serviços
- Estender services (categoria, badges, entregáveis, prazo, tipo de cobrança, faixas de preço, pré-requisitos, ordem, ativo) e criar service_orders e service_messages. Popular o catálogo rico da seção 6 em base-data.
- recommendServices puro, com testes.

============================================================
8. IMPRESSÃO E USO EM CAMPO (requisitos não funcionais)
============================================================

- Expedição em tablet de 768 px e em celular: alvos de toque de pelo menos 48 px, sem hover obrigatório, sem rolagem horizontal, legível a 1 metro em contraste alto.
- Nenhum dado financeiro no HTML, no JSON de páginas, nas respostas de API nem em mensagens de erro do papel de Expedição.
- Impressão testada por PDF: a etiqueta impressa deve ser o arquivo original do SuperFrete sem redimensionamento surpresa.
- Tolerância a falhas: se a impressão falhar, mostrar como baixar o PDF. Se a rede cair, manter a fila visível e sinalizar.

============================================================
9. FASES, CRITÉRIOS DE ACEITE E TESTES
============================================================

F0. Diagnóstico. Capture os painéis atuais em 1440, 1024, 768 e 390 px, escreva docs/design/AUDIT.md (o que funciona, o que confunde, lacunas por papel) e docs/design/DECISIONS.md. Se existir docs/design/reference/, estude e registre o que absorveu. Aceite: documentos e capturas commitados.

F1. Design system v2. Tokens, temas por painel, modo escuro, tipografia, componentes da seção 4.2 e a página /dev/design. Refatore AppShell e migre os painéis existentes sem regressão funcional. Aceite: lint, typecheck, testes e E2E existentes verdes; capturas do /dev/design em claro e escuro; contraste AA verificado por script.

F2. Domínio. Seção 7 inteira com migrações, serviços de domínio e testes. Aceite: novos testes cobrem: isolamento de Expedição (varredura de chaves monetárias), livro-razão (saldo, concorrência, idempotência, débito automático em ordem, expiração), etiqueta (validação, tenant, papel, lote, registro de impressão), gates por oferta, recommendServices. Suíte inteira verde.

F3. Master. Torre de controle e Loja NextLevel de gestão. Aceite: cada alerta abre a ação correta; pipeline de serviços funciona; E2E de master.

F4. Fornecedor ADM e financeiro. Home em quadro, pedidos com gaveta, financeiro em abas, conexão do Mercado Pago do fornecedor, equipe de expedição. Aceite: E2E criando usuário de Expedição, conectando MP simulado e conciliando uma recarga.

F5. Expedição. Tela única, bipagem, lote, impressão, avanço de estágios. Aceite: E2E do fluxo completo: lojista anexa PDF, pedido debitado, aparece na fila de Expedição, imprime lote, avança até enviado; verificação automática de que nenhuma resposta do papel contém valores monetários.

F6. Lojista Lite. Home de saldo, recarga Pix ponta a ponta com MP simulado (QR, cronômetro, aprovação automática, débito dos pedidos em espera), upload de etiqueta, gates. Aceite: E2E de DROP_MANUAL e STORE_SUBDOMAIN, incluindo bloqueio e upgrade.

F7. Lojista Pro. Análise, editor com prévia em três larguras, templates, domínio, clientes, equipe. Aceite: E2E de STORE_OWN e capturas nos quatro breakpoints.

F8. Loja NextLevel transversal. Destaque e recomendações nos quatro painéis, fluxo de pedido de serviço completo. Aceite: E2E de compra de serviço por lojista e fornecedor, acompanhada pelo Master.

F9. Endurecimento. Acessibilidade (teclado e leitor de tela nos fluxos críticos), desempenho (sem layout shift nos painéis, imagens e fontes otimizadas), revisão de textos em pt-BR, atualização de README, ARCHITECTURE.md, docs/FINANCEIRO.md e novo docs/PAINEIS.md, demo seed atualizado com os cinco perfis e dados coerentes (lojista Lite, lojista Pro, fornecedor ADM, fornecedor Expedição, master). Aceite: todos os gates verdes e relatório final.

============================================================
10. QUALIDADE (valem em todas as fases)
============================================================

- TypeScript estrito, sem any desnecessário, arquivos pequenos, zero duplicação de regra. Server e client components corretos. Ícones cruzando a fronteira server para client SEMPRE por nome.
- Segurança: toda action revalida sessão e escopo no servidor; nenhum segredo em log; uploads validados por conteúdo e não por extensão; rotas de arquivo nunca públicas.
- Estados completos em toda tela: carregando (skeleton fiel), vazio (com ação), erro (com recuperação) e sem permissão.
- Revisão visual obrigatória: para cada painel, abra no navegador automatizado, capture 1440, 1024, 768 e 390 px em claro e escuro, e OLHE as imagens. Procure colisões, cortes, hierarquia fraca, contraste e alvos pequenos antes de dar como pronto. Corrija e recapture.
- Testes: mantenha os 99 existentes verdes e adicione os novos. Estenda npm run e2e com cenários por papel (arquivos em e2e/). Inclua verificação de que rotas de outro papel redirecionam.
- Commits pequenos e frequentes, mensagens no imperativo, sem identificar modelo de IA em código ou mensagens de commit além do trailer exigido pelo ambiente.

============================================================
11. FORA DE ESCOPO AGORA
============================================================

Fiscal e nota fiscal. Integração real com SuperFrete e Melhor Envio. WhatsApp API. Checkout de serviços na conta Mercado Pago da NextLevel (apenas registrar intenção). Marketplace Brás Digital. Split de pagamento. Aplicativo nativo. Qualquer infraestrutura nova pesada.

============================================================
12. RELATÓRIO FINAL (curto)
============================================================

Entregue: IMPLEMENTADO por painel, PENDENTE, DECISÕES TOMADAS (as de docs/design/DECISIONS.md que divergem do prompt), ROTAS novas, USUÁRIOS DEMO por papel, COMO RODAR, RESULTADO DOS GATES (lint, typecheck, testes, build, e2e), CAPTURAS (caminhos), LIMITAÇÕES e PRÓXIMOS 5 PASSOS. Sem relatório gigante. O dono precisa conseguir abrir e testar cada um dos cinco painéis.

COMECE PELA FASE F0 AGORA. Depois siga F1 a F9 sem pedir permissão a cada etapa.
