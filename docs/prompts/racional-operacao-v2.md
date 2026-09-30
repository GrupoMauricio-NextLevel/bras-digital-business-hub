# RACIONAL DE OPERAÇÃO, RECEITA E CONTROLE — NEXTLEVEL / SUPERDROP (v2)

Você atuará como PRINCIPAL PRODUCT MANAGER + HEAD DE OPERAÇÕES + SENIOR FULL-STACK ENGINEER. O repositório já funciona (painéis Master, Fornecedor ADM, Expedição, Lojista, carteira Pix, etiqueta em PDF, gates por oferta, marketplace de serviços, motor financeiro). Sua missão é transformar o negócio descrito em `docs/NEGOCIO.md` em produto: mais **controle** e **produtividade** para a NextLevel, mais **receita** para todos e um painel com **desenho próprio** para cada papel. Entregue código executável, testado e revisado visualmente, não só documento.

============================================================
0. MODO DE OPERAÇÃO
============================================================
- Leia primeiro: CLAUDE.md, AGENTS.md (Next.js recente: consulte `node_modules/next/dist/docs/`), ARCHITECTURE.md, docs/NEGOCIO.md, docs/FINANCEIRO.md, docs/design/DECISIONS.md e o código real.
- Autonomia total, exceto: apagar dados, segredo/credencial, ação irreversível, decisão comercial que mude o produto. Decida, registre em `docs/design/DECISIONS.md` (D8, D9, ...) e siga.
- Fases G0 a G9 (seção 9). Ao fim de cada uma: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e`; commit por fase; push na branch atual. Sem pull request sem pedido.
- Regra de ouro do código: componente visual sem regra de negócio; actions finas; todo acesso por `Actor`/`assertCanAccess`; dinheiro em centavos; taxas em basis points; enums como texto (sem migração para estender); migrações com `drizzle-kit generate --name X`.
- Fiscal fora do escopo. Nada de integração real além do Mercado Pago. Sem segredo no código. Idioma pt-BR, moeda BRL.
- Números de preço deste prompt são PROPOSTAS: implemente-os no `price-book` editável, valide no simulador (`/master/finance`) e mostre o racional. O dono ajusta depois sem mexer em código.

============================================================
1. MÓDULOS A CONSTRUIR
============================================================

### M1. Pós-venda por chat (NextLevel ↔ fornecedor / lojista)
- Conversas (`support_threads`) com mensagens (`support_messages`), anexos (PDF/imagem, mesmos limites de segurança das etiquetas), status (ABERTA, AGUARDANDO_CLIENTE, RESOLVIDA), prioridade, categoria (PEDIDO, FINANCEIRO, TÉCNICO, SERVIÇO, ACADEMY), SLA por prioridade e responsável.
- Contexto vinculável: pedido, loja, fatura, pedido de serviço. A tela do master mostra o contexto ao lado da conversa (loja, oferta, saldo, inadimplência, últimos pedidos) para responder sem trocar de tela.
- Respostas rápidas (macros) editáveis pelo master; indicador de não lidas; notificação no sino; tempo real por SSE com fallback de polling.
- Fila do master ordenada por SLA estourando. Métricas: 1ª resposta, tempo de resolução, CSAT (1 a 5 ao encerrar).
- Reutilize o mecanismo de `service_messages` quando fizer sentido; não duplique.

### M2. Recebimento NextLevel via Mercado Pago (conta da NextLevel)
- Cobrança de faturas próprias (setup, mensalidade, taxa de volume, serviços, academy) por Pix e Checkout Pro na conta MP da NextLevel; credencial criptografada no master.
- Webhook idempotente (nunca confiar no corpo: consultar a API), conciliação automática fatura ↔ pagamento, estorno registrado, reenvio de cobrança.
- Régua de cobrança automática (dunning) já modelada em `ACCESS_CAPABILITIES`: e-mails/avisos in-app em D-3, D0, D+3, D+7; bloqueio parcial e suspensão por regra; cron diário. Tudo visível em uma tela "Cobranças" do master com filtros e ação em lote.
- "Saúde da conexão MP": teste de credencial, teste de cobrança de R$ 1,00 estornável, aviso de token expirado.

### M3. Entitlements e Academy
- `entitlements` por tenant (fornecedor ou loja): recurso, origem (PLANO, ADD_ON, CORTESIA), validade. `features.ts` passa a consultar plano + entitlements. Academy é um add-on com mensalidade própria para o lojista.
- Academy: trilhas > módulos > aulas (vídeo por URL, texto, checklist, arquivo), progresso por usuário, certificado simples, bloqueio por módulo (`locked` global em produção + por entitlement). Trilha do fornecedor (montar a Central, expedição, captar lojistas) e trilha do lojista ("do zero ao faturamento": catálogo, preço com margem, Pix, primeira venda, tráfego, recompra).
- Módulo bloqueado mostra cadeado, resumo e CTA de desbloqueio (compra de add-on via M2). O master edita conteúdo e libera/bloqueia módulos.

### M4. Esteira de pedidos ao vivo (fornecedor ADM e expedição)
- Visão esteira (kanban horizontal): AGUARDANDO RECARGA > LIBERADO > EM SEPARAÇÃO > CONFERIDO > PRONTO PARA ENVIO > ENVIADO, com contadores, idade do pedido e alerta de atraso.
- **Horário de corte**: por fornecedor, por dia da semana, com fuso. Pedido liberado antes do corte entra na onda de hoje; depois, na de amanhã. Cronômetro "faltam 1h20 para o corte" na esteira e na área do lojista ("pedido até 14h sai hoje"). Feriados configuráveis. Lógica pura em `src/lib/domain/cutoff.ts`, com testes de borda (virada de dia, fuso, feriado).
- **Ao vivo e sincronizado**: SSE (`/api/live/orders`) com fallback de polling; vários funcionários veem a mesma esteira; "quem está separando" (bloqueio otimista por pedido) para evitar dois separando o mesmo; indicador "ao vivo" e hora da última sincronização.
- **Ondas (batches)**: seleção múltipla ou "todos até o corte" cria uma onda; a onda gera um PDF único de etiquetas (já existe `mergeLabels`) e uma lista de separação agrupada por produto/variação (para andar uma vez pela prateleira). Reimpressão registrada.
- Conferência por leitura de código (campo de scan que aceita leitor USB) antes de "pronto para envio".
- Expedição continua sem nenhum valor monetário (teste que varre as chaves do DTO).

### M5. Painel do fornecedor, conexão Mercado Pago e recargas
- Onboarding guiado em 4 passos: conta MP > teste de cobrança > horário de corte > equipe de expedição. Barra de progresso persistente até concluir.
- Tela "Recargas dos lojistas": entradas por dia, lojistas com saldo baixo (botão "avisar por chat"), pedidos travados por falta de saldo, crédito manual auditado.

### M6. Painel do lojista (membro final)
- Fluxo em uma tela: recarregar (Pix) > escolher produtos do catálogo > enviar para expedição com saldo > anexar etiqueta. Mostrar sempre: saldo, custo do carrinho, "faltam R$ X" com botão de recarga que já preenche o valor.
- Ao ativar a loja: assistente para conectar o Mercado Pago dele e receber dos clientes por Pix, com teste.
- Academy do lojista com módulos bloqueados e CTA do add-on.

### M7. Torre de controle do Master (gerencial + automações)
- Visões separadas e filtráveis: FORNECEDORES; LOJISTAS BÁSICOS (subdomínio SuperDrop); LOJISTAS COM DOMÍNIO PRÓPRIO (status do domínio, DNS, selo). Cada linha com health score.
- **Health score** (0 a 100, função pura testada): pedidos 30d, saldo, inadimplência, uso do painel, chamados abertos, academy concluída. Bandas: Saudável, Atenção, Risco de churn.
- **Fila de trabalho do dia** (inbox de tarefas geradas por regras): cobranças a fazer, conexões MP quebradas, lojas sem venda há 14 dias, fornecedor sem corte configurado, chamados perto do SLA, serviços aguardando orçamento, setups em garantia a vencer. Cada tarefa: dono, prazo, ação em 1 clique.
- **Motor de automações** (`automation_rules`): gatilho (evento ou cron) + condição + ação (criar tarefa, enviar aviso, mudar status, aplicar bloqueio). Regras padrão semeadas e desligáveis. Log de execuções auditável.
- Painel de receita da NextLevel em tempo real: MRR, receita de taxa de volume, serviços, academy, setups, comissões devidas; com metas mensais e projeção (usar o motor financeiro existente).

### M8. Racional de preços e taxas (obrigatório)
- Cada item do `price-book` ganha `rationale`: `{ cobre, entrega, ancora }` (o que o valor paga, o que o cliente recebe, comparação de mercado). Exibir em tooltip/painel "Por que cobramos isto?" no master, no simulador e nas telas de fornecedor e lojista (versão em linguagem simples).
- Cada taxa por transação tem: base de cálculo, alíquota, piso/teto, justificativa e "quanto isso é por pedido" para um ticket típico.
- Modelo de unit economics por perfil (fornecedor, lojista Lite, lojista Pro): custo de servir (Mercado Pago, infraestrutura, suporte por chamado), receita, margem, ponto de equilíbrio. Alerta no simulador quando um perfil fica com margem abaixo da meta.
- Propostas iniciais para validar no simulador (ajuste com base no cálculo, registre a decisão):
  - Lojista: DROP_MANUAL R$ 49/mês; STORE_SUBDOMAIN R$ 97/mês; STORE_OWN R$ 197/mês + setup (fornecedor fica com 25% do setup).
  - Academy do lojista: R$ 47/mês ou R$ 397/ano (ancora: um curso avulso de e-commerce custa R$ 500 a R$ 2.000).
  - Fornecedor: mensalidade por faixa de lojistas ativos (degraus), mais taxa de volume sobre o custo dos pedidos com piso mensal.
  - Taxa por recarga: sem taxa para o lojista (o custo do Mercado Pago fica com o fornecedor); a NextLevel ganha na taxa de volume.
- Nenhum número sem racional. Onde faltar dado, deixe o campo editável e marque "a validar".

### M9. Ideias de receita adicionais (implemente as marcadas com ★)
- ★ Add-ons mensais por entitlement: Academy, Suporte Premium (SLA menor no chat), Relatórios avançados, Assentos extras de expedição.
- ★ Serviços recorrentes (pacotes mensais de banners, conteúdo, tráfego) com renovação automática por fatura.
- ★ Upgrade guiado por gatilho (recomendador já existe): "você bateu 20 pedidos, migre para Loja própria".
- Revenda de etiquetas com desconto de frete negociado (fase futura; só registrar no roadmap).
- Marketplace de fornecedores (lojista escolhe mais de um fornecedor): roadmap.
- Programa de indicação: lojista indica lojista e ganha crédito de saldo (custo de aquisição baixo). ★ versão simples com código de convite e crédito.
- Cobrança de expedição por pedido pelo fornecedor (taxa de manuseio configurável, debitada do saldo). ★
- Pacote "loja pronta" (setup assistido): fotos + cadastro + domínio, vendido pela Loja NextLevel.
- Planos anuais com desconto (2 meses grátis) em todos os produtos recorrentes. ★

============================================================
2. DESIGN E NAVEGAÇÃO POR PAINEL (não pode ser um painel para todos)
============================================================
Cada painel ganha um brief em `docs/design/PAINEIS.md` e uma tela inicial coerente com ele. Todos usam o design system v2, mas com composição, densidade e navegação distintas:
- **MASTER**: torre de controle. Barra lateral escura; home com receita, fila de trabalho do dia, mapa de saúde (fornecedores e lojistas), mesa de chamados. Denso, tabelas e filtros salvos, atalhos de teclado, paleta de comandos.
- **FORNECEDOR ADM**: home é a **esteira ao vivo** com contador do corte; abas Recargas, Lojistas, Catálogo, Financeiro, Academy. Cores frias, muito estado (semáforo de atraso).
- **EXPEDIÇÃO**: tablet primeiro; sem barra lateral; tela única com fila, campo de scan, botão gigante de lote; alto contraste; funciona com luvas (alvo de toque 56 px); zero dinheiro.
- **LOJISTA LITE**: guiado; home é um passo a passo ("recarregue > escolha > envie > anexe etiqueta"), saldo sempre visível, linguagem simples, ícones grandes, academy em destaque com bloqueio.
- **LOJISTA PRO**: análise; gráficos de vendas e margem, editor de loja com pré-visualização em 3 larguras, clientes, domínio, equipe, relatórios exportáveis.
- Loja NextLevel (serviços e academy): presente nos quatro, com o tom de cada um.
- Critérios: teste visual por captura (1440/1024/768/390, claro e escuro) e checklist de contraste; nenhum painel repete o mesmo layout de home.

============================================================
3. DADOS (resumo do que criar)
============================================================
`support_threads`, `support_messages`, `entitlements`, `academy_tracks`, `academy_modules`, `academy_lessons`, `academy_progress`, `supplier_cutoffs` (dia, horário, fuso), `holidays`, `pick_waves`, `pick_wave_orders`, `order_claims` (quem separa), `automation_rules`, `automation_runs`, `work_items` (fila do dia), `health_snapshots`, `referral_codes`, `nextlevel_payments` (conciliação), além de `rationale` no price-book. Reaproveite tabelas existentes sempre que possível.

============================================================
4. QUALIDADE E SEGURANÇA
============================================================
- Testes de domínio para: corte (bordas), ondas, claim concorrente, health score, regras de automação, conciliação idempotente, entitlements, isolamento entre tenants em chat e academy, DTO de expedição sem dinheiro.
- E2E: fornecedor conecta MP e configura corte; lojista recarrega, envia pedido, anexa etiqueta; expedição imprime lote e despacha; master responde chamado e vê a tarefa sumir; módulo de academy bloqueado libera após pagar add-on.
- Segurança: uploads validados (tipo, tamanho, hash), autorização em toda rota `api`, SSE autenticado e escopado por tenant, rate limit simples em envio de mensagens, sem dados de um tenant em outro.
- Acessibilidade: foco visível, rótulos, contraste, navegação por teclado, `prefers-reduced-motion`.

============================================================
5. FASES
============================================================
- G0: Diagnóstico e `docs/design/PAINEIS.md`, `docs/OPERACAO.md` (mapa de automações), decisões D8+.
- G1: Racional de preços (M8): `rationale` no price-book, unit economics, simulador com alertas, telas "Por que cobramos".
- G2: Entitlements + Academy (M3), módulos bloqueados.
- G3: Cobrança NextLevel no Mercado Pago (M2): faturas, webhook, conciliação, régua.
- G4: Corte, esteira ao vivo e ondas (M4), painel de expedição finalizado.
- G5: Fornecedor: onboarding MP, recargas, saúde da conexão (M5).
- G6: Lojista: fluxo em uma tela, assistente de MP, academy (M6).
- G7: Chat de pós-venda (M1).
- G8: Torre de controle, health score, automações, fila do dia, receita (M7).
- G9: Receitas adicionais ★ (M9), endurecimento, documentação, seed de demonstração com os cinco perfis, E2E por papel, relatório final curto (o que entrou, o que ficou de fora, riscos, próximos passos).

============================================================
6. ENTREGA FINAL
============================================================
Relatório curto com: o que foi entregue por módulo, decisões D8+ tomadas, números de preço adotados e o racional de cada um, o que ficou de fora, riscos e a ordem recomendada para publicar. Reempacote o zip do projeto (sem node_modules, .next, data, .e2e, .git, .env.local).
