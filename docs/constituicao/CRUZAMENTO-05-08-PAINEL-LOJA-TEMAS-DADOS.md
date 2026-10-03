# Cruzamento dos documentos 05 a 08 com o código (2026-10-03)

Legenda: ✔ cumpre · ◐ parcial · ✘ não cumpre · ? não verificado. Método: leitura do código e buscas dirigidas; nenhum teste novo foi rodado nesta etapa.

## Resumo
- **05 Painel do lojista:** boa base (busca global com Ctrl+K, fila de ações, tabelas responsivas, histórico de pedido em linha do tempo). Faltam: visões salvas, ações em massa para o lojista, desfazer, centro de notificações estruturado, ajuda contextual e telemetria de produto.
- **06 Loja e conversão:** jornada principal completa e medida (busca, ordenação, compra rápida, carrinho, checkout sem login, página de pedido e acompanhamento, avaliações, "avise-me"). Faltam: eventos de funil, guia de medidas, imagem por variante, sugestões em busca sem resultado, conta do cliente, favoritos e **proteção de envio duplicado no servidor**.
- **07 Temas e segmentos:** catálogo, instalação com 1 clique, troca sem perda de dados, presets e segmentos existem. **Conflito a registrar:** a instalação **publica na hora** (07 §17 diz que instalar não deve alterar a loja pública). Faltam manifesto de tema, validação de capacidades e compatibilidade, versões e atualização, base de teste fixa e certificação.
- **08 Dados:** o que mais importa já existe (centavos, snapshot do pedido, número de exibição, índice único por loja, transações, `dedupeKey`, migrações versionadas). **Lacunas:** estoque sem atomicidade (F1.0, já corrigido), **nenhuma restrição `CHECK` no banco**, **nenhum monitoramento de invariantes**, **moeda implícita (BRL)**, sem idempotência de finalização, sem entidade de pagamento, **sem teste de restauração do backup**.

## 05 Merchant Panel UX
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Navegação, sidebar, contexto, cabeçalho de página (§4–9) | ✔/◐ | `app-shell.tsx`, `PageHeader`. Menu foi organizado por área; troca entre lojas não existe (uma loja por usuário). |
| Busca global e paleta de comandos (§13–16) | ✔/◐ | Busca e Ctrl+K em `app-shell.tsx`. Sem recentes nem ações ("criar produto") confirmadas. |
| Painel inicial (§17–24) | ◐ | `action-queue.tsx` (fila de ações). Separação entre desempenho do período e operação atual: **não verificada**. Módulos com falha isolada: não verificado. |
| Tabelas, filtros, ações em massa (§25–36) | ◐ | Tabelas responsivas (viram cartões no celular). Ações em massa só na lista de produtos do fornecedor (`setProductsStatus`). Sem visões salvas, sem colunas escolhíveis, filtros na URL: parcial. |
| Formulários, produto, variantes (§37–50) | ◐ | Agrupamento por seções. Edição em massa de variantes e matriz com SKU, preço e estoque por variante: não. |
| Pedidos (§51–55) | ◐ | Lista, detalhe, linha do tempo real (`order_events`) e ações pelo estado (✔, ajustadas na Onda 1). Estorno guiado (§55) não existe, porque o estorno não é uma entidade (ver 02). |
| Estoque (§56–59) | ◐ | Há visão por variante (físico, reservado, disponível) e histórico; o histórico ganhou saldo antes e depois e quem fez (F1.0). Ajuste exige motivo? Hoje só observação livre. |
| Clientes, marketing, configurações (§60–68) | ◐ | CRM, cupons, campanhas existem. Configurações com saúde por item (conectado, incompleto, erro): parcial. Busca dentro de configurações: não. |
| Onboarding (§69–74) | ✘/◐ | Teste de 7 dias e telas de pagamento; **sem checklist até a primeira venda** nem marco de primeira venda (a F4 do plano cobre). |
| Estados vazios, carregamento, erros, feedback, confirmações, desfazer (§75–92) | ◐ | `loading.tsx` com esqueleto e toasts (✔). Desfazer (§92) e confirmação proporcional ao risco: parcial; sem reautenticação nem 2FA para ação crítica. |
| Notificações e atividade (§93–98) | ◐ | Sino de notificações e `activities`; `email_outbox` para e-mail. Prioridade (crítica, alerta, info) e estado de leitura: não verificado. |
| Ajuda, mobile, acessibilidade, design system (§99–111) | ◐ | Design system próprio, AA e 360 px verificados por e2e. Sem ajuda contextual nem modo de densidade. |
| Permissão na UI (§116–118) | ◐ | Equipe (STAFF) vê só o permitido; bloqueio por plano mostra convite comercial. |
| Telemetria e métricas de UX (§134–135) | ✘ | Não há. |

## 06 Storefront UX e conversão
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Home, vitrines, confiança (§7–11) | ✔ | Seções de tema (destaque, vitrines, faixa de confiança, selos). |
| Navegação (§12–16) | ✔/◐ | Cabeçalho com busca e carrinho; caminho de navegação no produto; menu grande só no Signature. |
| Busca (§17–21) | ◐ | Busca no catálogo; sugestões só no Signature; **sem tolerância a erro de digitação e sem sugestões quando não há resultado**. |
| Listagem (§22–31) | ◐ | Ordenação (`SortSelect`), categorias, compra rápida. Filtros por tamanho, cor e preço: não; segunda imagem no cartão: não. |
| Página de produto (§32–48) | ◐ | Galeria com miniaturas, tamanhos com estoque, quantidade, grade (compra em pacote), barra fixa no celular, abas, relacionados, avise-me, avaliações reais. **Sem zoom e deslize, sem imagem por variante, sem guia de medidas, sem cálculo de frete por CEP na página do produto.** |
| Carrinho (§49–56) | ◐ | Itens, cupom, frete, total. O carrinho vive no navegador e revalida ao criar o pedido (ver 02). |
| Checkout (§57–72) | ◐ | Compra sem login (✔), CEP, método de entrega, Pix e cartão pelo Mercado Pago, botão desativado enquanto envia. **Sem idempotência no servidor** (F1.2 do plano). Pagamento pendente tratado como estado, não erro (✔ em `order/[id]`). |
| Confirmação, conta, pós-venda (§73–83) | ◐ | Página do pedido, acompanhamento por número e e-mail (✔). **Sem conta do cliente**, sem favoritos, cancelamento e troca pelo cliente: não. |
| Confiança, copy, mobile, desempenho, acessibilidade, SEO (§84–112) | ✔/◐ | Selos de segurança reais (sem inventar), SEO por loja (JSON-LD, sitemap, canonical), imagens reduzidas, 360 px sem rolagem lateral (✔ após correção de hoje). |
| Funil de eventos (§113–116) | ✘ | Não há `view_item`, `add_to_cart`, `begin_checkout`, `purchase`; nenhum pixel nem tabela de eventos de visita. |
| Experimentos, personalização, idioma (§117–122) | ✘ | Não existem (e o documento os trata como futuro). |
| Atacado e moda (§131–136) | ◐ | Grade, preço por faixa e pedido mínimo existem. Guia de medidas e imagem por cor: não. |
| Anti-padrões (§160) | ✔ | Não há modal de newsletter imediato, urgência falsa nem escassez inventada. A **contagem regressiva** do tema Arena e do Signature precisa de data real do lojista (já é configurável). |

## 07 Temas, templates e segmentos
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Manifesto e validação de pacote (§4–8) | ✘ | O catálogo de temas é código (`THEME_CATALOG`); não há manifesto formal, validação de capacidades requeridas nem faixa de compatibilidade do motor. |
| Loja de temas, demonstração, licença (§9–15) | ✔ | `/temas`, demonstração por link, preço do catálogo, licença permanente por loja (`entitlements`). Sem avaliações nem changelog por tema. |
| Instalação (§16–19) | ◐ **conflito** | `installTheme` valida licença, monta as páginas **e publica na hora**, guardando "Antes de instalar" no histórico. O 07 §17 manda que instalar **não** altere a loja pública. Foi decisão do dono (instalação em 1 clique). Fica como **exceção registrada (D63)**: a prévia com os produtos da loja vem antes e dá para voltar atrás. |
| Troca de tema (§20–24) | ✔ | Conteúdo da loja (nome, texto do destaque, aviso, rodapé) é aproveitado; produtos e pedidos não mudam; histórico permite voltar. Componente sem equivalente no novo tema: não é avisado. |
| Atualização de tema (§25–29) | ✘ | Só existe a versão "1.0.0" criada na semeadura; não há fluxo de atualização, migração de configuração ou changelog. |
| Biblioteca de templates e variantes (§30–34) | ◐ | 4 tipos de página; um modelo por tipo e por tema; sem variantes nem atribuição de template a produto ou página. |
| Presets e segmentos (§35–39) | ◐ | Cada tema é, na prática, um preset de um segmento (Lume moda, Ninho casa, Arena esporte). Não há entidade de segmento nem de preset separado do tema; **sem `if segment` espalhado** (✔). |
| Qualidade, base de teste, regressão visual (§57–59) | ◐ | Lojas de exemplo de cada tema com produtos fictícios; sem base de casos extremos fixa (sem foto, esgotado, título longo) nem regressão visual automática. |
| Economia, governança, código próprio (§60–71) | ✔/◐ | Preço único, diferença real entre temas (não só cores). Sem código próprio de lojista (✔ por omissão); sem SDK nem agências. |
| Checkout e SEO (§75, §80) | ✔ | Tema não controla pagamento nem total. HTML semântico e um H1 por página. |
| Suporte, descontinuação, migração (§83–88) | ✘ | Sem política de suporte, fim de vida nem prévia de migração. |
| Temas próprios de referência (§94–96) | ✔ | Starter (referência simples) e Signature (premium). |
| Nomes (§97) | ✔ | Starter, Lume, Ninho, Arena, Editorial, Signature: sem nome de cliente. |

## 08 Data Architecture
| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Fontes de verdade, projeções (§3–5) | ◐ | Cada conceito tem uma tabela dona. Projeções (resumos, métricas) são calculadas na leitura. |
| Identificadores (§6–9) | ◐ | Id interno com prefixo aleatório (✔), número de exibição do pedido (✔). Ids externos de provedores ficam em coluna única (`payment_reference`), sem provedor e tipo de recurso. |
| Multi-tenant (§10–14) | ◐ | `store_id` nas entidades da loja e `assertCanAccess` no servidor. Unicidade: SKU por fornecedor, número de pedido por loja (✔). "Toda consulta exige contexto de loja" não é imposto por tipo; depende de cada função. |
| Normalização, JSON (§15–17) | ◐ | Configurações de tema em JSON validado por esquema (✔). |
| Snapshots e histórico (§18–26) | ✔/◐ | Item do pedido guarda nome, rótulo, preço e custo; pedido guarda endereço e totais (✔). Faltam SKU e foto no item do pedido. |
| Estados e transições (§27–29) | ◐ | Estados em texto com enum; transições validadas no domínio (`order-status.ts`) e atualização condicional. **Sem registro de transição de pagamento e de loja.** |
| Transações e idempotência (§30–38) | ◐ | Criação, pagamento e cancelamento em transação (✔); `dedupeKey` em eventos e faturas (✔). **Sem chave de idempotência no checkout.** |
| Concorrência (§39–44) | ✔ após F1.0 | Estoque agora usa atualização condicional; o `FOR UPDATE` da carteira existia. Número do pedido: F1.1. |
| Dinheiro (§45–49) | ◐ | Centavos inteiros em todo o sistema (✔), arredondamento em `finance/pricing.ts`. **Moeda implícita (BRL), sem coluna de moeda.** |
| Estoque (§50–54) | ◐ | Saldo físico, reservado, disponível e livro de movimentos com saldo antes e depois (novo). **Sem rotina de reconciliação** entre o saldo e a soma dos movimentos. |
| Produto, cliente, pedido, pagamento, remessa (§55–78) | ◐ | Ver 02. Consentimento de marketing em tabela própria (✔). Sem classificação de dados pessoais. |
| Eventos e outbox (§79–86) | ✘/◐ | `events` com `dedupeKey`; sem `occurred_at/processed_at` separados, sem outbox. A rotina `runJob` e o painel de erros cobrem o essencial hoje. |
| Importação e exportação (§91–94) | ◐ | Ver 03. |
| Busca, cache, analytics (§95–105) | ✔ | Sem índice de busca nem cache de dados (tudo dinâmico); analytics calculado na leitura. |
| Migrações (§106–111) | ✔ | `drizzle/` versionado, nunca editado, só aditivas, testadas em banco antigo. |
| Migração de dados e reversão (§112–114) | ◐ | Preenchimentos feitos na própria migração; sem validação formal depois (contagem, integridade). |
| Restrições no banco (§115–117) | ✘ | Há 12 índices únicos e chaves estrangeiras, mas **nenhuma restrição `CHECK`** (saldo e reservado não negativos, total do pedido, quantidade positiva). |
| Exclusão lógica e retenção (§118–124) | ? | Não auditado; política de retenção é decisão pendente do dono. |
| Backup e recuperação (§125–128) | ? | Depende do Neon (ponto de restauração) e **nunca foi testado**; o dono ainda não confirmou o backup. |
| Saúde dos dados e invariantes (§129–130) | ✘ | Sem verificação diária de: total do pedido ≠ soma dos itens, reservado maior que físico, pagamento sem pedido, ids externos repetidos, registros órfãos. |
| Desempenho (§131–135) | ◐ | Índices por consulta real; listas paginadas em parte; N+1 evitado nos painéis novos. |
| Segurança de dados (§136–139) | ✔/◐ | Segredos criptografados, nada de cartão guardado (✔). Acesso humano ao banco: fora do código. |
| Contratos de dados (§140–143) | ◐ | `toPublicProduct` e DTOs na loja; sem versão de contrato público (não há API pública). |
| Fronteiras de domínio (§144–146) | ◐ | `src/lib/domain` por módulo; alguns módulos gravam tabelas de outros (por exemplo ações que atualizam `storeProducts` direto). |
| Qualidade de dados (§150–153) | ◐ | Normalização de CPF/CNPJ e e-mail (✔); telefone e CEP: parcial. |

## Efeito no plano de correção
1. **Fase de integridade de dados (nova, depois da F3, pequena e segura):**
   - **(a)** relatório somente-leitura de invariantes (total do pedido, reservado ≤ físico, físico e reservado ≥ 0, pagamento sem pedido, órfãos), rodado **antes** de qualquer restrição, em cópia e depois em produção;
   - **(b)** só se o relatório vier limpo: restrições `CHECK` aditivas (`NOT VALID` e depois validar) em estoque e itens do pedido;
   - **(c)** rotina diária de verificação das mesmas invariantes no Master (alerta, nunca correção automática).
2. **Teste de restauração do backup do Neon** e confirmação do ponto de restauração (decisão do dono; vira item da F8).
3. **Exceção registrada (D63):** instalação de tema publica na hora, por decisão do dono. Revisar se o dono preferir o fluxo "instalar em rascunho, publicar depois".
4. **ADRs sem código:** funil de eventos da loja (06 §113), manifesto e atualização de tema (07 §4, §25), moeda explícita (08 §48), conta do cliente e favoritos (06 §76, §142), ações em massa e visões salvas no painel (05 §30, §35).
