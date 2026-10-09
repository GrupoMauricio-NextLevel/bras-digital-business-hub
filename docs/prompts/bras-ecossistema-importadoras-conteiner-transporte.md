# BRÁS DIGITAL v2 — PROMPT MESTRE DE ENGENHARIA
## Importadora 360, painel da importadora, estoque e Bling, produtos em alto mar com pré-pedido, contêiner fechado e compartilhado, nova marca de transporte, máquina de conteúdo, planos do membro e tudo no Master

> **Pedido do dono (2026-10-09, resumo fiel):**
> - **Importadoras:** o setor de importadoras precisa evoluir muito. Edição completa de cada importadora, cada uma vista como **fonte única de receita**, extraindo o máximo de cada uma.
> - **Estoque:** cadastro avançado e integração com o estoque da importadora (Bling, por exemplo). Quem não tem sistema usa um **modo manual detalhado** de galpão e venda de caixa fechada.
> - **Painel da importadora:** acessar o **ponto de vista de cada importadora**. Painel intuitivo, que ajude na gestão. Cadastrar e chamar transportadora com facilidade.
> - **Alto mar:** **produtos em transporte marítimo com previsão de chegada**, recebendo **pré-pedidos com reserva de pagamento**, bom para o fluxo de caixa da importadora.
> - **Contêiner fechado:** a importadora cadastra as opções e recebe cotações em até **7 dias**. Item do catálogo é grátis; **itens fora do catálogo custam R$ 1.500,00 para até 4 itens**, com resposta em **15 dias**.
> - **Contêiner compartilhado:** **cotas** com contador e barra de progresso **em tempo real**. Ao completar, a importação começa. Precisa de um **racional de preço por cubagem**: contêiner com vários itens é mais caro, e quanto menor a quantidade, mais caro.
> - **Nova marca de transporte:** transportadoras se conectam (API ou o nosso sistema). A NextLevel ganha **comissão por carga**, há **plano grátis e dois planos pagos**, **publicidade** e **recomendação para quem paga**, com copy forte nas funções pagas.
> - **Descobertas:** devem virar uma **máquina de conteúdo**. A XDX liberou o showroom e as gravações começam na **próxima segunda-feira** (Mauricio e Danielle). Os vídeos levam ao cadastro e, dentro da plataforma, tudo vende a **assinatura da análise**.
> - **Painel do cliente:**
>   - copy agressiva vendendo a análise;
>   - **tendências da semana** em destaque;
>   - **calculadora de economia** (compra tradicional × plataforma), que também serve de peça de marketing;
>   - **alto mar com pré-pedido** só no **Platinum**;
>   - **cadastro grátis para ver preço** e **3 níveis pagos** de análise de tendências.
> - **Master:** **todos os valores de planos** (transportadoras, importadoras e clientes) **no Master**. Racional: **entra de graça, dentro tem upgrade**.
>
> **Autoridade:** Constituição (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`) > `docs/design/DECISIONS.md` (D91 a D107 são da Brás) > `docs/prompts/bras-digital-plataforma.md` (adendo) > este documento > a tarefa do momento.
> **Próxima decisão livre:** confira em `CLAUDE.md` (hoje D108).
> **Skills do projeto:**
> - `desenvolver-prompt` (por fase);
> - `painel-interno` (telas autenticadas);
> - `pagina-de-vendas` (páginas públicas e paywalls);
> - `nova-migracao` (banco);
> - `qa-visual` e `e2e-demo` (conferência);
> - `publicar` (envio);
> - kit de análise quando reduzir incerteza real: `impact-analysis`, `security-guardian`, `acceptance-designer`, `ux-flow-auditor`.

---

## 0. Seu papel e o contrato

Você é o engenheiro responsável pelo ecossistema Brás Digital: domínio, banco, telas, testes, publicação. Trabalhe **por fases** (seção 17). Cada fase fecha com:
- domínio e testes;
- telas e e2e;
- decisão registrada em `DECISIONS.md`;
- relatório da fase;
- publicação na branch de publicação (`claude/wonderful-cannon-5o38v5`), seguindo o fluxo de `AGENTS.md`.

### 0.1 Pode fazer sozinho
- Tudo que estiver nesta especificação e não depender de um item `[CONFIRMAR]` bloqueante.
- Criar tabelas e colunas aditivas (prefixo `bd_` para a Brás, `tr_` para a marca de transporte).
- Seeds de planos como **RASCUNHO** (`DRAFT`) no catálogo Master, com os valores sugeridos aqui. **Nunca publique preço sem o dono aprovar no Master.**
- Copy forte, seguindo o banco de copy (seção 19) e as regras de verdade (seção 3.4).

### 0.2 Não pode fazer sem o dono
- Ligar chaves em produção (`BRAS_PANELS`, novas chaves desta frente), mexer em DNS e criar domínio.
- Cobrar de verdade por uma função nova antes de: (a) o dono publicar o preço no Master e (b) a revisão jurídica do item, quando a seção 16 exigir.
- Mudar comportamento do SuperDrop ou da Commerce (estão em produção). Arquivos compartilhados só com mudança neutra e teste.
- Guardar dinheiro de terceiros (sinal, cota) numa conta da NextLevel sem a estrutura jurídica aprovada (seção 16).

### 0.3 Quando travar
Implemente a parte que não depende do item travado, deixe a chave desligada, registre o `[CONFIRMAR]` no relatório e siga para a próxima parte.

---

## 1. Visão: a Brás como ecossistema de quatro lados

| Lado | Quem é | O que ganha | Como a NextLevel ganha |
|---|---|---|---|
| **Membro comprador** | Lojista, vendedor de Mercado Livre, distribuidor (CNPJ) | Preço de caixa fechada, análise, tendências, pré-compra de alto mar, contêiner | Assinatura da análise (3 níveis); taxa de cotação fora do catálogo; acesso a contêiner/pré-pedido nos planos altos |
| **Importadora** | Importadoras do Brás (XDX é a primeira) | Vitrine em vídeo, demanda qualificada, pré-pedidos (caixa antecipado), cotações de contêiner, gestão simples | Comissão por venda (D102); plano da importadora (grátis + upgrades); conteúdo patrocinado; destaque |
| **Transportadora** | Transportadoras e autônomos que retiram no Brás | Cargas da Brás (e depois SuperDrop e Commerce), painel grátis, recomendação | Comissão por carga; planos Pro e Premium; publicidade |
| **NextLevel (dono)** | Estúdio no Master | Uma rede onde cada lado puxa o outro | Todas as linhas acima, configuráveis no Master |

**Volante:**
1. A descoberta (vídeo) atrai o membro.
2. O membro gera pedido e pré-pedido.
3. A importadora fatura e quer mais destaque.
4. A carga vai para a transportadora.
5. A transportadora quer mais carga e paga plano ou publicidade.
6. A NextLevel ganha em cada ponto.

---

## 2. O que já existe (estenda; não duplique)

| Já existe | Onde | Use para |
|---|---|---|
| Membro com CNPJ, termos, origem | `bd_members`, `src/lib/domain/bras/membros.ts` (D92, D99) | Base do membro; planos estendem o acesso |
| Descobertas em 3 camadas, agenda, página `/d/<id>`, resultado por vídeo | `bd_videos`, `descobertas.ts`, `videos.ts` (D95, D101) | Máquina de conteúdo (Módulo H) |
| Acesso à análise (OPEN/PAID, assinatura e volume, cortesia) | `bd_access_grants`, `brasAccessFor` (D95) | Vira **planos do catálogo Master** (Módulo I e J) |
| Importadoras sem login, oferta por vídeo, pedido manual | `bd_importers`, `bd_offers`, `bd_requests` (D93) | Importadora 360 e painel da importadora |
| Comissão manual por importadora, fechamento mensal | `bd_commission_settlements`, `comissoes.ts` (D102) | Linha de receita "comissão" na 360 |
| Código de retirada, comprovante, romaneio | `retirada.ts` (D103) | Fluxo de retirada com transportadora |
| Balcão por link privado (sem login) | `balcao.ts` (D106) | Fica como **acesso rápido de retirada** (motorista e balcão), complementar ao painel com login |
| E-mails e avisos | `avisos.ts` (D100), `src/lib/email.ts` | Avisos de pré-pedido, cotação, cota, transporte |
| Catálogo Master versionado, ofertas, assinaturas, gateway único, auditoria financeira | `catalog_products`, `catalog_price_versions`, `catalog_offers`, `nl_subscriptions`, `corporate_orders`, `gateway_transactions`, `financial_audit_log` (D90) | **Todos os preços e planos** desta frente |
| Plataformas de envio (cotação de frete) | `src/lib/shipping/` (Melhor Envio, SuperFrete, Onlog) | Interface de frete; a marca de transporte entra como **provedor próprio** |
| Modo suporte auditado ("entrar como") | AD2 / D80 | "Ver como a importadora vê" e "ver como a transportadora vê" |
| Parceiros, atribuição, comissão versionada | `partners`, `commission_rules` (D90) | Indicação de importadora e transportadora por parceiro (fase futura) |
| Jobs, erros, segredos | `job_runs`, `error_events`, `encryptSecret` | Sincronização Bling, prazos (SLA) de cotação, expiração de reservas |

**Regra anti-duplicação:**
- Planos e preços → `catalog_products` (famílias novas, seção 13).
- Assinaturas → `nl_subscriptions`.
- Cobranças da NextLevel → `corporate_orders` / `gateway_transactions`.
- Comissões → regras versionadas.
- **Não crie tabela de "planos" paralela.**

---

## 3. Princípios de negócio (valem em todos os módulos)

### 3.1 Entra grátis, dentro tem upgrade
Membro, importadora e transportadora **entram grátis**. Cada tela mostra o que o plano atual faz e, ao lado, **o que o próximo plano destrava**, com cartão trancado, prévia borrada ou contador. Nunca esconda a função paga: mostre-a trancada.

### 3.2 Tudo configurável no Master
Preço de plano, comissão por venda e por carga, taxa da cotação fora do catálogo (R$ 1.500,00 para até 4 itens), prazos (7 e 15 dias), percentual de sinal do pré-pedido, parâmetros de cubagem, preço de publicidade: **nada fixo no código**. Fica no catálogo Master (preços) ou em `platform_settings` (regras), com versão e auditoria.

### 3.3 Fronteiras de dados (não mudam)
- **Preço nunca é público.** Visitante vê descoberta e "trancado".
- **A importadora nunca vê a identidade do comprador** (D92). Ela vê demanda agregada, pedidos e pré-pedidos **por código**, e só o envio (`brasShippingView`) na retirada. Exceção só com aceite explícito do membro numa negociação de contêiner (seção 9.6), registrada.
- **A transportadora vê só o necessário para a carga:** coleta (importadora, endereço, janela), entrega (endereço do destinatário), volumes, peso, cubagem e valor declarado quando exigido para seguro. Nunca CNPJ, e-mail ou telefone do membro, salvo o telefone de contato de entrega com aceite.
- Um tenant nunca lê dados de outro. Importadora A não vê nada de B; transportadora X não vê cargas de Y.

### 3.4 Copy forte e verdadeira
"Agressiva" quer dizer **direta, concreta, com urgência real e prova do próprio sistema**. Não quer dizer promessa.
- **Permitido:** dados do próprio sistema ("4 descobertas novas esta semana"); escassez real ("restam 3 cotas"); prazo real ("chegada prevista 18/11"); simulação com premissas visíveis.
- **Proibido:** ganho garantido ("lucre R$ X"); números inventados; depoimento inventado; "último dia" falso; esconder a premissa da calculadora.
- Banco de copy na seção 19.

### 3.5 Dinheiro de terceiros
- O dinheiro do **produto** (caixa, sinal de pré-pedido, cota de contêiner) é da **importadora**: vai para a conta da importadora (Mercado Pago dela conectado, como `stores.mpAccessTokenEnc`).
- A NextLevel cobra **o que é dela** (planos, comissão, taxa de cotação, publicidade) pelo gateway do Financeiro Master (D90).
- Repasse automático (split) só com confirmação do Mercado Pago `[CONFIRMAR Pix no split]`. Até lá: cobrança da comissão por fatura (como D102).

---

## 4. Módulo A — Importadora 360 (visão do dono, no Estúdio)

**Objetivo:** cada importadora é uma **fonte de receita** com ficha completa, saúde, potencial e ações para extrair o máximo.

### 4.1 Ficha completa (edição de alto nível)
- **Identidade:**
  - razão social, nome fantasia, CNPJ (dígitos conferidos), inscrição estadual;
  - logo (upload em `store_assets`, nunca no servidor do app sem o mecanismo existente);
  - descrição curta para a vitrine;
  - especialidades e categorias;
  - origem dos produtos (China, outros).
- **Contatos e equipe:**
  - responsáveis (comercial, financeiro, expedição) com papel e canal preferido;
  - usuários do painel (seção 5.9).
- **Galpões e pontos de retirada:**
  - vários endereços, cada um com horário de retirada, regras (agendamento obrigatório, doca, limite de veículo), contato do balcão e foto;
  - um galpão é o padrão.
- **Condições comerciais:**
  - comissão (D102), mínimo por pedido (caixas e valor), faixas de preço por quantidade de caixas;
  - formas de pagamento aceitas (Pix, dinheiro, boleto `[CONFIRMAR]`), prazo de separação;
  - política de troca e avaria (texto da importadora, revisado pela Brás).
- **Contrato e documentos:**
  - contrato de parceria (upload e versão), data de assinatura;
  - autorização de imagem (para gravações);
  - certidões opcionais.
- **Integração:** modo de estoque (manual, planilha, Bling), situação da conexão e última sincronização (Módulo C).
- **Plano da importadora** (Módulo J) e histórico de upgrades.
- **Notas internas e linha do tempo:** cada alteração auditada; a linha do tempo mostra eventos (pedido, cotação, contêiner, gravação, pagamento de comissão).

### 4.2 Painel de receita por importadora
Cartões e gráfico de 12 meses:
- vendas (soma dos pedidos pagos e retirados);
- comissão devida, recebida e em aberto (D102);
- **pré-pedidos** (sinal recebido pela importadora; comissão prevista);
- **contêineres** (fechados e compartilhados: valor, comissão prevista e realizada);
- **cotações fora do catálogo** (taxas recebidas pela NextLevel);
- **plano da importadora** (mensalidade);
- **conteúdo patrocinado e destaques** (publicidade da importadora);
- **receita total da NextLevel com a importadora** e **ticket por membro**.

Tudo em centavos. Gráficos seguindo a skill `dataviz`.

### 4.3 Saúde e potencial ("extrair o máximo")
- **Índice de saúde (0 a 100, explicável):**
  - estoque atualizado (frescor);
  - tempo médio para confirmar pedido;
  - taxa de retirada no prazo;
  - descobertas publicadas no mês;
  - cotações respondidas no prazo;
  - avaliações dos membros.
  - Cada fator mostra o peso e "como melhorar".
- **Oportunidades** (lista de ações com valor estimado, com premissa):
  - "12 membros viram o produto X e não pediram: gravar análise?";
  - "Produto Y esgotou 3 vezes: oferecer pré-pedido do próximo contêiner";
  - "Importadora sem galpão cadastrado: retirada mais lenta";
  - "Plano grátis com 40 pedidos/mês: oferecer plano Pro".
- **Funil por importadora:** visualizações → cliques no preço → pedidos → pagos → retirados (sem identificar membros).

### 4.4 Ações rápidas
- "Ver como a importadora vê": modo suporte auditado (D80).
- Agendar gravação (Módulo H), abrir contêiner compartilhado, convidar usuário, gerar link do Balcão (D106), cobrar comissão do mês.

### 4.5 Aceite
- Edição de cada campo auditada.
- Documentos só para o Master e a própria importadora.
- Receita igual à soma das fontes (teste de conciliação).
- Índice de saúde reproduzível (mesmos dados, mesmo número).

---

## 5. Módulo B — Painel da importadora (login próprio)

**Mudança de rumo registrada:** D106 resolveu o Balcão por link porque a importadora não tinha conta. Agora o dono quer o **ponto de vista de cada importadora**:
- crie o papel `BRAS_IMPORTER` (e `BRAS_IMPORTER_STAFF` para a equipe) com login;
- o link do Balcão continua como **acesso rápido de balcão/motorista**, sem login.
- O papel novo mexe em login, menus e roteamento compartilhados: faça com **mudança neutra para as outras marcas e testes de isolamento** (`impact-analysis` antes).
- Área: `/importadora` no endereço da Brás, com a cor da Brás (AreaTheme) e o nome da importadora.

### 5.1 Pense como uma importadora do Brás: o que chamaria a atenção
1. **"Seus pedidos de hoje" numa tela só:** separar, entregar à transportadora, aguardando pagamento. Botões grandes, no celular.
2. **Chamar transportadora em 2 toques:** escolher entre as cadastradas e as recomendadas, janela de coleta, volumes. A transportadora recebe no painel ou no WhatsApp com link.
3. **Estoque em caixas sem planilha:** "Tenho 40 caixas de X no galpão 2", ajuste rápido, contagem semanal guiada, alerta de esgotando.
4. **Produtos no mar com dinheiro antecipado:** cadastrar o contêiner com previsão de chegada e **vender antes de chegar** (pré-pedido com sinal). Isso é caixa novo.
5. **Contêineres:** receber cotações de contêiner fechado e abrir **venda compartilhada** com contador ao vivo.
6. **Demanda visível:** quantos membros viram, quantos favoritaram, quantos pediram, por produto (sem identificar ninguém). "O que gravar a seguir."
7. **Extrato claro:** vendas do mês, comissão da Brás, fechamentos (D102), pré-pedidos e contêineres.
8. **Conteúdo:** pedir gravação de um produto e acompanhar visualizações e cliques das suas descobertas.
9. **Equipe:** usuários com permissão (balcão, estoque, comercial, financeiro).
10. **Simples de verdade:** linguagem do Brás, sem jargão de ERP; ajuda em vídeo curto em cada tela; atendimento pela equipe Brás.

### 5.2 Telas (menu da importadora)
1. **Hoje:** fila do dia (separar, retirar, coletas agendadas, cotações vencendo, cotas do contêiner), números do dia, avisos.
2. **Pedidos:** Recebido → Confirmado → Pago → Retirado; confirmar disponibilidade, marcar separado, entregar com o código (D103/D106). O comprador aparece só por código e cidade/UF.
3. **Produtos e caixas:** catálogo de caixa fechada (seção 6.2), fotos, faixas de preço, mínimo, status.
4. **Estoque:** por galpão; entradas, saídas, ajustes, contagens; integração (Módulo C).
5. **Em alto mar:** contêineres a caminho, linha do tempo, pré-pedidos (Módulo D).
6. **Contêineres:** cotações recebidas (fechado), vendas compartilhadas (cotas ao vivo), propostas (Módulos E e F).
7. **Transportadoras:** cadastradas, recomendadas, chamar coleta, histórico, avaliação (Módulo G).
8. **Demanda e conteúdo:** funil por produto, descobertas da importadora, pedido de gravação.
9. **Financeiro:** extrato, comissões (D102), sinal de pré-pedidos, cotas recebidas, plano da importadora.
10. **Equipe e configurações:** usuários, galpões, horários, conexão Mercado Pago, integração Bling.
11. **Plano:** o que o plano atual faz e o upgrade (Módulo J).

### 5.3 Onboarding de quem nunca usou sistema
- Cadastro assistido pela equipe Brás (o dono ou a equipe preenche junto, em modo suporte) **ou** sozinho em 5 passos: empresa, galpão, primeiro produto, estoque, Mercado Pago.
- **Importação por foto ou planilha:** planilha modelo em português; a equipe Brás pode subir pela importadora.
- **Celular primeiro:** toda ação do balcão funciona em 360 px com botões grandes.
- **Avisos por WhatsApp com link** (provedor oficial na segunda etapa, D92). Até lá, link pronto para copiar.

### 5.4 Aceite e testes
- Isolamento importadora A × B em todas as telas e ações.
- Teste de chaves: nenhuma resposta do painel traz CNPJ, e-mail, telefone ou nome do membro.
- Permissões por papel de equipe.
- e2e de ponta a ponta no celular.

---

## 6. Módulo C — Estoque, caixa fechada e integrações (Bling e manual)

### 6.1 Interface única de estoque
`StockConnector` (`src/lib/domain/bras/estoque/`) com três implementações:
- **Manual:** galpões, entradas, saídas, ajustes e contagens no painel.
- **Planilha:** importação ExcelJS com a correção de namespace já existente; modelo em português; prévia antes de aplicar; relatório de erros por linha.
- **Bling (API v3):**
  - OAuth2 com `client_id`/`client_secret` da NextLevel; tokens por importadora criptografados (`encryptSecret`);
  - renovação automática do token;
  - leitura de **produtos** e **saldos por depósito**;
  - webhooks de estoque quando disponíveis `[CONFIRMAR escopos e webhooks no plano da importadora]`;
  - reconciliação agendada (`job_runs`, a cada 15 min, configurável no Master);
  - mapeamento SKU Bling ↔ produto de caixa fechada;
  - política de conflito: **Bling é a fonte da verdade** quando conectado; o ajuste manual fica bloqueado com a mensagem "estoque vem do Bling".
- **Futuro:** Tiny/Olist, Omie e outros, com a mesma interface. Documente como plugar.

Cada leitura grava **frescor** ("atualizado há 12 min"). Estoque velho acima do limite (Master; padrão 30 min com integração, 24 h manual) mostra "consultar" ao membro em vez do número.

### 6.2 Modelo de caixa fechada (detalhado)
Por produto:
- SKU; descrição; fotos; categoria;
- **caixa master**: unidades por caixa, dimensões da caixa (cm), **cubagem (m³) calculada**, peso bruto (kg);
- **faixas de preço por quantidade de caixas** (ex.: 1–4, 5–19, 20+); **mínimo de caixas**;
- galpão de saída; NCM `[opcional]`; código de barras `[opcional]`;
- status: rascunho, ativo, esgotado, em alto mar.

O estoque é contado **em caixas**, com movimentos (entrada, reserva, liberação, venda, ajuste, contagem), estendendo a lógica de `inventory_movements` sem duplicar regras.

### 6.3 Reserva atômica (agora necessária)
Pré-pedido, cota de contêiner e pedido disputam caixas. Use **atualização condicional** ("só baixa se ainda houver"), testada com concorrência no Postgres. Pendência 7 do dono: concorrência real exige Neon/Postgres; teste com PGlite e com Postgres. A reserva tem validade: expira e libera (job).

### 6.4 Aceite
- Estoque nunca negativo.
- Duas reservas da última caixa: uma ganha, a outra recebe mensagem clara.
- Sincronização Bling idempotente.
- Token nunca em tela ou log.
- A planilha não altera nada sem confirmação.

---

## 7. Módulo D — Produtos em alto mar e pré-pedido com reserva

### 7.1 Para a importadora
- Cadastro do **embarque**:
  - contêiner (número `[opcional]`, tipo 20'/40'/40HC);
  - origem e porto de destino;
  - **previsão de chegada (ETA)** ao porto e ao galpão;
  - status em linha do tempo: produção → embarcado → em trânsito → no porto → desembaraço → no galpão → disponível;
  - documentos internos `[opcional]`.
- **Itens do embarque:** produto, caixas totais, **caixas abertas para pré-pedido** (a importadora decide quanto vender antes), preço de pré-pedido (pode ter desconto), **percentual de sinal** (padrão no Master, ex.: 30%) e data-limite do pré-pedido.
- **Atualização de ETA** avisa os pré-compradores automaticamente (e-mail e aviso).
- **Fluxo de caixa:** quanto entrou de sinal, quanto falta receber na chegada, por embarque.

### 7.2 Para o membro (diferencial, trancado fora do Platinum)
- No catálogo, a seção **"Em alto mar"** aparece para todos.
- Para quem não é **Platinum**: cartões com produto, ETA, "restam X caixas para pré-pedido" e preço **borrado com cadeado**, mais a copy de upgrade (seção 19).
- Para o **Platinum**: escolhe as caixas e paga o **sinal** (Pix ou cartão, na conta da importadora); recebe comprovante, linha do tempo e avisos de ETA.
- **Saldo na chegada:** cobrança do restante ao virar "disponível". Prazo para pagar (Master); depois, cancelamento com a regra de devolução.

### 7.3 Regras de dinheiro (decisão do dono e jurídico)
- O sinal é pago à **importadora** (seção 3.5). Comissão da Brás sobre o pré-pedido: no pagamento do saldo ou no sinal `[CONFIRMAR]`.
- **Atraso grande** (acima de X dias da ETA original, no Master): o membro pode **cancelar com devolução integral do sinal**. A importadora devolve; o sistema registra e cobra.
- Avaria ou falta na chegada: atendimento Brás e devolução proporcional `[CONFIRMAR política]`.
- **Revisão jurídica obrigatória antes de ligar** (venda antecipada, CDC/B2B, nota fiscal do sinal).

### 7.4 Aceite
- Não vende mais caixas do que as abertas para pré-pedido (atômico).
- Mudança de ETA avisa todos os pré-compradores.
- Membro fora do Platinum não recebe o preço do pré-pedido em nenhuma resposta (teste de chaves).
- Devolução por atraso calculada certa.

---

## 8. Módulo E — Contêiner fechado (cotação)

### 8.1 Pense como um grande seller ou atacadista: o que chamaria a atenção
1. **Ver opções reais:** produto, quantidade por contêiner, prazo de produção e de chegada, **preço estimado por unidade colocada no Brasil** (com premissas).
2. **Comparar:** caixa fechada hoje × contêiner fechado (economia por unidade, investimento total, giro necessário).
3. **Calculadora de custo nacionalizado** (landed cost) **estimada**: FOB, frete, seguro, impostos estimados (premissas editáveis, aviso "estimativa, não é orçamento"), despesas, margem.
4. **Pedido de cotação com prazo garantido:** 7 dias para item do catálogo; contador visível.
5. **Cotação de itens fora do catálogo (até 4 itens, R$ 1.500,00, resposta em 15 dias):** para quem quer importar o que não está na vitrine. Pagamento na hora; contador de prazo.
6. **Propostas lado a lado**, aceite com sinal, linha do tempo da produção ao galpão.
7. **Contêiner com a própria marca** `[fase futura]`: personalização de embalagem, quando a importadora oferecer.
8. **Histórico e recompra:** "repetir este contêiner".

### 8.2 Para a importadora
- **Opções de contêiner:** produto do catálogo, tipo (20'/40'/40HC), quantidade de caixas, prazo de produção e trânsito, condição (FOB/CIF/entregue no galpão `[CONFIRMAR incoterms usados]`), **preço por unidade em faixas**, validade da opção.
- **Fila de cotações** com prazo (7 ou 15 dias) e aviso de vencimento. Responder com proposta estruturada: preço, prazo, condição, validade, sinal.

### 8.3 Fluxo
1. O membro pede a cotação (catálogo: grátis no plano que permite; fora do catálogo: paga R$ 1.500,00 à NextLevel pelo gateway D90).
2. A importadora responde no prazo. Se o prazo vencer, a Brás é avisada e o membro também. No fora do catálogo vencido, vale a regra de devolução `[CONFIRMAR]`.
3. O membro aceita: sinal à importadora, linha do tempo e acompanhamento como Módulo D.

### 8.4 Fora do catálogo: detalhes
- Até **4 itens** por cotação: link ou foto, especificação, quantidade estimada, preço-alvo `[opcional]`.
- **Valor e prazo no Master** (R$ 1.500,00 e 15 dias como padrão).
- Quem responde: a importadora escolhida ou "qualquer importadora parceira" (a Brás distribui) `[CONFIRMAR]`.
- Repasse de parte da taxa à importadora que responder `[CONFIRMAR]`.

### 8.5 Aceite
- Prazo contado em dias corridos no horário de Brasília.
- Vencimento gera aviso e entra na saúde da importadora (Módulo A).
- Taxa cobrada uma vez (idempotente) e conciliada no Financeiro Master.

---

## 9. Módulo F — Contêiner compartilhado (cotas, ao vivo)

### 9.1 Conceito
A importadora abre uma **venda compartilhada**: um contêiner dividido em **cotas**. Os membros compram cotas até completar. Ao completar, a importação começa e segue a linha do tempo do Módulo D. Há dois tipos:
- **Mesmo item** (padrão, mais barato): um produto, cotas iguais (ex.: 50 cotas de 20 caixas).
- **Misto** (vários itens): mais caro por unidade (seção 9.3).

### 9.2 Tela ao vivo (o "uau" da plataforma)
- **Contador grande** de cotas vendidas / total e **barra de progresso** com animação suave (respeitando movimento reduzido); "faltam X cotas"; prazo de fechamento com contagem regressiva.
- Atualização **em tempo real**: Server-Sent Events, ou consulta a cada 5 s como alternativa, sem recarregar a página.
- Lista de compras recentes **anônima** ("Distribuidor de GO comprou 2 cotas há 3 min"), só cidade/UF e tipo de negócio, sem nome.
- Ao bater 100%: tela de "contêiner completo, importação iniciada" e linha do tempo.
- **Se não completar no prazo** (Master): cancelamento com **devolução integral** das cotas, ou prorrogação **uma vez** com aviso e opção de saída sem custo para quem já comprou.

### 9.3 Racional de preço por cubagem (documentar e implementar como simulador no Master e na importadora)

Referências **editáveis no Master** (valores típicos de mercado; confirme com a importadora):

| Tipo | Volume interno | Volume útil de referência |
|---|---|---|
| 20' Dry | ~33 m³ | ~28 m³ |
| 40' Dry | ~67 m³ | ~58 m³ |
| 40' HC | ~76 m³ | ~68 m³ |

**Custos do contêiner** (por embarque, informados pela importadora): frete internacional, seguro, despesas de origem e destino, desembaraço, armazenagem, transporte porto → galpão, margem da importadora. Soma = **custo fixo do contêiner (CF)**.

**Custo por m³ útil:** `CF ÷ volume útil`.

**Mesmo item:**
- Cubagem por caixa `c` (m³), caixas no contêiner `N = volume útil ÷ c` (arredondado para baixo, respeitando o peso máximo).
- Custo logístico por caixa = `CF ÷ N`.
- Preço da caixa na cota = preço do produto por caixa + custo logístico por caixa + comissão + margem.
- Cota = `k` caixas, então preço da cota = `k ×` preço da caixa.

**Misto** (mais caro, por três motivos):
1. **Aproveitamento menor:** caixas de tamanhos diferentes ocupam pior o espaço. O fator de ocupação `f` (0,80 a 0,95, no Master) reduz o volume útil efetivo.
2. **Manuseio e consolidação por SKU:** taxa fixa `h` por item diferente (separação, etiqueta, conferência).
3. **Pedido mínimo por item no fornecedor:** quantidades pequenas pagam mais por unidade. Fator `p(q)` cresce quando a quantidade do item cai, com tabela no Master.
- Fórmula do custo logístico por caixa do item `i`: `(CF ÷ (volume útil × f)) × c_i + h ÷ caixas_i`.
- O preço do produto do item `i` usa `p(q_i)`.

**Contêiner pouco cheio** (para preço de cota antes de completar): o sistema calcula o preço **assumindo o contêiner cheio**. Se a importadora quiser fechar com ocupação menor, o custo por m³ sobe na proporção (`CF ÷ volume vendido`), e a diferença aparece como **"ajuste de ocupação"** antes de confirmar. Nunca cobre depois sem aceite.

**Simulador:** sliders de ocupação, número de itens e cubagem por caixa, mostrando o preço por unidade para "mesmo item × misto" e "cheio × parcial". Serve para a importadora decidir e para o marketing explicar.

### 9.4 Dinheiro e risco
- Cotas pagas à **importadora** (conta dela).
- **Prazo e devolução** obrigatórios e visíveis antes da compra.
- **Revisão jurídica obrigatória antes de ligar:** compra coletiva antecipada não pode parecer investimento nem consórcio. É **compra de mercadoria com entrega futura**, com prazo, devolução e nota fiscal.

### 9.5 Planos
Ver e participar de contêiner compartilhado: planos **Ouro e Platinum** (sugestão; Master decide). Os demais veem a vitrine trancada com o contador (o contador é prova social e vende o upgrade).

### 9.6 Identidade na negociação de contêiner
Contêiner fechado pode exigir que a importadora conheça o comprador (nota fiscal, contrato). Isso só acontece **depois do aceite da proposta**, com o consentimento explícito do membro ("compartilhar meus dados de faturamento com a importadora X para este contêiner"), registrado e auditado. É exceção à regra D92, a ser registrada em decisão.

### 9.7 Aceite
- Nunca vende acima de 100% (atômico; teste de concorrência).
- O contador da tela bate com o banco.
- Não completou no prazo: devolução calculada para todos.
- Atualização ao vivo sem recarregar; com movimento reduzido, sem animação.

---

## 10. Módulo G — Nova marca de transporte

### 10.1 Marca
- **Nome provisório:** `[CONFIRMAR]`. Sugestões: "NextLevel Cargas", "Brás Cargas", "Rota NextLevel". Código de marca sugerido `NEXTLEVEL_CARGAS` em `src/lib/brand.ts`; endereço `cargas.nextlevelgroup.com.br` (pendência de DNS do dono).
- É **marca e pacote de módulos sobre o mesmo motor** (regra anti-duplicação): um repositório, um banco, um deploy.
- Integra a Brás primeiro; depois SuperDrop e Commerce como **provedor de frete próprio** na interface `src/lib/shipping` (sem quebrar Melhor Envio, SuperFrete e Onlog).
- Tabelas com prefixo `tr_`.

### 10.2 Pense como dono de transportadora: o que chamaria a atenção
1. **Carga sem prospectar:** "coletas disponíveis no Brás hoje" para a sua rota, com volume, peso, cubagem e destino.
2. **Consolidação no Brás:** várias importadoras, uma rota. O sistema agrupa coletas por região e janela e mostra a **ocupação do caminhão** (m³ e kg).
3. **Aceitar com um toque** e receber endereço, janela e código de retirada (D103).
4. **Motorista sem aplicativo:** link no celular (como o Balcão D106) com coletas do dia, foto do comprovante e "entregue".
5. **Recebimento claro:** valor do frete, comissão da NextLevel, extrato.
6. **Reputação:** nota de pontualidade e de avaria, construída pelo sistema, que leva a mais indicações.
7. **Visibilidade paga:** aparecer primeiro para importadoras e membros da sua rota ("recomendada").
8. **Tabela de preço simples:** por região/UF, faixa de peso e de cubagem, mínimo por coleta.
9. **Integração:** quem tem sistema conecta por API (webhook de status, rastreio); quem não tem usa o nosso painel.

### 10.3 Cadastro rápido (na importadora e no Estúdio)
Em 1 minuto:
- CNPJ ou CPF (autônomo);
- RNTRC/ANTT `[CONFIRMAR exigência]`;
- contato e WhatsApp;
- regiões atendidas (UFs, cidades), tipos de veículo e capacidade;
- tabela de preço simples ou "cotar caso a caso";
- seguro de carga (sim/não, apólice `[opcional]`).

A transportadora recebe convite para completar o perfil e entrar no painel grátis.

### 10.4 Painel da transportadora (papel `CARRIER`, `CARRIER_STAFF`, motorista por link)
**Telas:** Hoje (coletas e entregas), Oportunidades de carga, Coletas aceitas, Rotas e ocupação, Motoristas e veículos, Tabela de preço, Financeiro (fretes, comissão, extrato), Reputação, Plano e publicidade, Integração (API).

### 10.5 Integração
- **API:**
  - webhook de status (coletado, em trânsito, entregue, ocorrência) com assinatura HMAC;
  - autenticação por chave criptografada;
  - documentação pública simples (OpenAPI).
- **Sem sistema:** o nosso painel e o link do motorista.
- **Fiscal:** CT-e e MDF-e ficam no sistema da transportadora. A plataforma só anexa o número `[CONFIRMAR]`.

### 10.6 Receita da NextLevel
- **Comissão por carga:** percentual sobre o frete (Master; sugestão 5% a 10%) `[CONFIRMAR]`, cobrada por fatura mensal (gateway D90) até existir split.
- **Planos:**

| Plano | Para quem | O que inclui (sugestão) |
|---|---|---|
| **Grátis** | Toda transportadora | Perfil, cadastro rápido, até X coletas/mês, link do motorista, comissão padrão |
| **Pro** | Quem quer volume | Coletas ilimitadas, oportunidades antes dos grátis (janela de 30 min), consolidação e ocupação do caminhão, relatórios, comissão menor |
| **Premium** | Quem quer ser a escolhida | Tudo do Pro + **selo "Recomendada"**, prioridade nas indicações para importadoras e membros da rota, API, gerente de conta |

- **Publicidade:** destaque pago nas listas de transportadoras, na tela "chamar transportadora" da importadora e na escolha de transporte do membro. Sempre rotulada **"Patrocinado"**. Preço por período e região no Master.
- **Copy das funções pagas:** banco na seção 19 (forte, sem promessa de faturamento).

### 10.7 Aceite
- Transportadora X não vê cargas de Y.
- A transportadora vê só os dados da seção 3.3.
- Comissão calculada por carga, congelada no aceite.
- "Patrocinado" sempre visível.
- Integração com SuperDrop/Commerce desligada até aprovação.

---

## 11. Módulo H — Descobertas como máquina de conteúdo

### 11.1 Plano de gravação: showroom XDX, a partir de segunda-feira
**Antes de gravar** (checklist no Estúdio, por importadora):
- autorização de imagem da XDX assinada (upload na ficha);
- lista de 20 a 30 produtos candidatos com: caixa master, unidades, preço da caixa, estoque, sinal de tendência (Mercado Livre, redes);
- 3 produtos **"âncora"** por dia (os de maior potencial);
- **equipamento:** celular com estabilizador, microfone de lapela sem fio, luz LED portátil, tripé, cartão de cor (para manter a cor da caixa fiel);
- áudio sem música alta no fundo; horário com menos movimento.

**Formatos** (cada gravação rende vários; marque no Estúdio):

| Formato | Duração | Camada | Objetivo |
|---|---|---|---|
| **Shorts de descoberta** | 30–60 s vertical | Público | Gancho em 3 s, produto, sinal em palavras, convite: "análise e preço da caixa na Brás Digital" (link `/d/<id>`) |
| **Trecho da análise** | até 60 s | Membro grátis | Veredito e um motivo; termina vendendo a análise completa |
| **Análise de mercado** | 5–10 min horizontal | Assinante | Tendência, concorrência, preço no Mercado Livre, margem estimada, riscos, como anunciar |
| **Tour do showroom** | 2–3 min | Público | "Entrei no showroom da XDX: 5 achados" (vitrine da importadora; vende o cadastro) |
| **Caixa aberta** | 30–45 s | Público | Abrir a caixa master, mostrar unidades e acabamento |
| **Brás × Mercado Livre** | 45–60 s | Público | Preço praticado no ML × preço por unidade na caixa (sem prometer lucro; "a conta você faz na calculadora") |
| **Chegou no contêiner** | 30–60 s | Público e Platinum | O que está em alto mar e chega em X dias (vende o pré-pedido do Platinum) |
| **Ranking da semana** | 60 s | Público | Top 5 tendências da semana (vende a análise) |
| **1 produto, 3 jeitos de vender** | 60–90 s | Membro | Kit, combo, sazonal (vende o plano Ouro) |

**Ritmo:** 4 descobertas por semana (D101), cada uma com o Shorts, o trecho e a análise, mais 1 tour ou ranking por semana.

**Por dia de gravação:** 3 âncoras × (Shorts + trecho + análise) + 2 a 3 caixas abertas + 1 tour. Rende o calendário de 1 semana ou mais.

**Ganchos testados** (rotacionar):
- "Achei no Brás e quase ninguém vende no Mercado Livre ainda";
- "Essa caixa tem 48 unidades e…";
- "Não compre isso antes de ver a análise";
- "O que chega em novembro no contêiner da XDX".

**Chamada fixa:** "Preço da caixa e análise completa: link na descrição (cadastro grátis com CNPJ)".

### 11.2 Funil (já existe a base; complete)
Shorts → `/d/<id>` (D101) → cadastro com origem (D99) → Meu Brás → paywall da análise → assinatura.
- Medir por vídeo (D101): cadastros, pedidos, **assinaturas** (novo) e **receita**.
- UTM por canal (YouTube, Instagram, TikTok, WhatsApp).

### 11.3 Ferramentas no Estúdio (máquina de conteúdo)
- **Pauta** em quadro (ideia → aprovada → gravada → editada → publicada), com responsável (Mauricio, Danielle), importadora, produto e formato.
- **Banco de ideias** alimentado por: produtos mais vistos sem pedido, esgotados, chegadas de contêiner, pedidos de gravação das importadoras.
- **Checklist de gravação** por dia (o da seção 11.1) e **roteiros-modelo** por formato.
- **Calendário** (agenda D101) com a meta semanal.
- **Pedido de gravação pela importadora** (Módulo B): vira **conteúdo patrocinado** cobrado pelo plano ou avulso (Master), sempre rotulado "Conteúdo com a importadora X".
- **Painel de desempenho** por vídeo e por formato: visualizações (entrada manual ou API do YouTube `[segunda etapa]`), cadastros, assinaturas, receita.

### 11.4 Aceite
- O fluxo da pauta é auditado.
- A origem do cadastro e da assinatura fica ligada ao vídeo.
- O rótulo de patrocínio aparece sempre que houver.

---

## 12. Módulo I — Painel do membro v2 (vender a análise em todos os cantos)

### 12.1 Planos do membro (valores no Master; sugestões em rascunho)

| Plano | Preço sugerido `[CONFIRMAR]` | Inclui |
|---|---|---|
| **Grátis** | R$ 0 | Ver preço da caixa e caixas disponíveis, veredito e trecho, pedir caixas, comprovante, tendências da semana (só títulos) |
| **Prata** | R$ 97/mês | Análise completa de todas as descobertas, ranking de tendências da semana completo, calculadora avançada, alertas de reposição |
| **Ouro** | R$ 197/mês | Tudo do Prata + contêiner compartilhado (participar), cotação de contêiner fechado do catálogo, "1 produto, 3 jeitos de vender", transportadoras com tarifa negociada `[quando existir]` |
| **Platinum** | R$ 397/mês | Tudo do Ouro + **pré-compra de produtos em alto mar** (exclusivo), prioridade nas cotas, 1 cotação fora do catálogo com desconto por trimestre `[sugestão]`, atendimento prioritário |

- Anual com desconto (Master).
- **Liberação por volume de compra** (D95) continua como regra opcional por plano.
- Migração: o modo OPEN/PAID atual (D95) vira o plano "Prata" e as cortesias viram **concessão de plano** em `nl_subscriptions`, mantendo as concessões atuais.

### 12.2 Onde vender (em todos os cantos, sem atrapalhar a compra)
- **Descoberta trancada:** veredito livre, análise borrada, contador "X membros Prata já viram esta análise" (dado real), botão "Liberar a análise".
- **Catálogo:**
  - faixa **"Tendências da semana"** no topo (mais vistas e pedidas nos últimos 7 dias, mais o veredito);
  - para o plano grátis, só os títulos e o resto borrado.
- **Seção "Em alto mar":** trancada fora do Platinum, com ETA e "restam X caixas para pré-pedido".
- **Contêiner compartilhado:** contador ao vivo visível a todos; participar só no Ouro e no Platinum.
- **Calculadora:** mostra a economia e "com a análise você escolhe melhor o produto" (Prata).
- **Pedido concluído:** "Quer saber o próximo produto antes dos outros? Prata".
- **E-mails** (D100): rodapé com o upgrade adequado ao plano.
- **Início do Meu Brás:** cartão do plano com "o que você está perdendo esta semana" (dados reais: análises novas, cotas abertas, chegadas).

### 12.3 Calculadora de economia (ferramenta e peça de marketing)
- **Entradas** (padrões no Master, editáveis pelo usuário):
  - compra tradicional: viagem ao Brás (passagem, hospedagem, alimentação, dias parados), compra fracionada (preço por unidade mais alto em pouca quantidade), frete fracionado, tempo de pesquisa;
  - pela plataforma: preço da caixa, frete consolidado (transportadora), plano.
- **Saídas:** custo por unidade nos dois caminhos, economia por compra e por mês, tempo economizado.
- **Sempre com a premissa visível** e o aviso "simulação com os valores informados; não é garantia de economia ou lucro".
- **Versão pública** (página do portal, sem preço de produto; usa valores médios configuráveis) e **gerador de imagem ou link para compartilhar** ("Simulei minha compra no Brás Digital"), para o marketing.

### 12.4 Aceite
- O paywall nunca envia o conteúdo trancado ao navegador (teste de chaves).
- O "X membros" é contado do banco.
- A calculadora tem teste de cálculo.
- A página pública não tem preço de produto.

---

## 13. Módulo J — Master: todos os valores e planos

- **Famílias novas** no catálogo Master (`CATALOG_FAMILIES`):
  - `BRAS_MEMBER_PLAN` (Prata, Ouro, Platinum);
  - `BRAS_IMPORTER_PLAN` (Grátis, Pro, Premium);
  - `CARRIER_PLAN` (Grátis, Pro, Premium);
  - `BRAS_SERVICE` (cotação fora do catálogo; conteúdo patrocinado; destaque da importadora);
  - `ADS` (publicidade de transportadora e importadora).
  - Ampliar `audience` com `BRAS_MEMBER`, `IMPORTER`, `CARRIER`.
- **Regras em `platform_settings`** (com versão e auditoria):
  - prazos de cotação (7/15 dias);
  - sinal do pré-pedido (%);
  - atraso que libera a devolução;
  - prazo de fechamento de cota;
  - tabela de cubagem (volumes, fator de ocupação, taxa por SKU, curva de quantidade);
  - comissão por carga;
  - limites do plano grátis;
  - frescor do estoque;
  - frequência do Bling.
- **Planos da importadora** (sugestão):
  - **Grátis:** painel, manual/planilha, pedidos, Balcão, 1 galpão;
  - **Pro:** Bling, vários galpões, pré-pedido, contêiner, demanda detalhada;
  - **Premium:** destaque na vitrine, conteúdo patrocinado incluso por mês, prioridade nas cotações fora do catálogo, relatórios de mercado.
- **Tela no Master "Brás: planos e regras"**: tudo num lugar, com prévia de como aparece para cada lado e o simulador de cubagem.
- **Seeds como DRAFT.** Nada vai ao ar sem o dono publicar.

---

## 14. Modelo de dados proposto (aditivo; valide contra o que existe)

**Brás (`bd_`):**
- `bd_importers`, estendida: razão social, IE, logo, descrição, categorias, plano, saúde (calculada, não gravada), modo de estoque.
- `bd_importer_users`: vínculo usuário ↔ importadora com papel de equipe.
- `bd_warehouses`: galpões e pontos de retirada (endereço, horários, regras, padrão).
- `bd_products`: produto de caixa fechada (SKU, caixa master, dimensões, cubagem, peso, unidades, faixas de preço, mínimo, galpão, status). **Relacione com `bd_offers` e `bd_videos`:** a oferta passa a apontar para o produto.
- `bd_stock_movements`: movimentos em caixas, com origem (manual, planilha, Bling, reserva).
- `bd_integrations`: conexão Bling (tokens criptografados, depósito, última sincronização, erros).
- `bd_shipments` (embarques) e `bd_shipment_items`: alto mar (ETA, status, linha do tempo, caixas abertas para pré-pedido, preço, sinal).
- `bd_preorders`: pré-pedidos (membro, item, caixas, sinal, saldo, status, devolução).
- `bd_container_options`: opções de contêiner fechado.
- `bd_container_quotes`: cotações (catálogo ou fora do catálogo, itens, prazo, taxa, proposta, status).
- `bd_shared_containers` e `bd_container_shares`: compartilhado (cotas, total, vendidas, prazo, status, devolução).
- `bd_content_items`: pauta da máquina de conteúdo (formato, responsável, status, importadora, produto, vídeo ligado). Avalie estender `content_items` antes de criar.

**Transporte (`tr_`):**
- `tr_carriers` (perfil, CNPJ/CPF, RNTRC, regiões, veículos, seguro, plano, reputação);
- `tr_carrier_users`;
- `tr_rate_tables`;
- `tr_loads` (cargas: origem/importadora, destino, volumes, peso, cubagem, janela, status, frete, comissão congelada);
- `tr_load_events`;
- `tr_api_keys` (hash);
- `tr_ads` (campanhas de destaque; ou família `ADS` do catálogo mais a veiculação).

**Papéis:** `BRAS_IMPORTER`, `BRAS_IMPORTER_STAFF`, `CARRIER`, `CARRIER_STAFF`. Motorista por link sem login (padrão D106).

---

## 15. Segurança, privacidade e auditoria

- Matriz de permissões por papel e testes de isolamento: importadora × importadora, transportadora × transportadora, membro × membro.
- Teste de chaves em todas as respostas que saem para a importadora e a transportadora (seção 3.3).
- Segredos (Bling, Mercado Pago, chaves de API) só criptografados; nunca em tela, log ou e-mail.
- Webhooks assinados (HMAC) e idempotentes (`dedupeKey`).
- Pagamento só vale depois de conferido na API do gateway (regra do projeto).
- Auditoria de cada ação de dinheiro, prazo, aceite e mudança de preço ou regra.
- LGPD:
  - atualizar termos e política da Brás (D99) para importadora, transportadora, pré-pedido, cota e compartilhamento de dados na negociação de contêiner;
  - nova versão dos termos (`BRAS_TERMS_VERSION`) pede novo aceite.

---

## 16. Riscos jurídicos e regulatórios (revisão antes de ligar cada um)

| Item | Risco | Antes de ligar |
|---|---|---|
| Pré-pedido com sinal | Venda antecipada, atraso, devolução, nota fiscal do sinal | Contrato/termos da importadora e do membro; política de atraso e devolução |
| Cotas de contêiner | Pode parecer investimento coletivo ou consórcio | Estruturar como compra de mercadoria com entrega futura; prazo e devolução; revisão de advogado |
| Taxa de cotação fora do catálogo (R$ 1.500) | Serviço da NextLevel; prazo e devolução | Termos do serviço; nota fiscal de serviço da NextLevel |
| Transporte | RNTRC, seguro de carga, responsabilidade por avaria | Termos da marca de transporte; exigências mínimas no cadastro |
| Publicidade | Recomendação paga sem rótulo engana o usuário | Rótulo "Patrocinado" obrigatório; critério de ranking explicado |
| Calculadora e copy | Promessa de ganho | Premissas visíveis; banco de copy (seção 19) |
| Dados na negociação de contêiner | Exceção à regra D92 | Consentimento explícito e registrado |

---

## 17. Fases de entrega (ordem recomendada)

| Fase | Entrega | Depende de |
|---|---|---|
| **F0 (já)** | Este documento aprovado; seeds DRAFT no Master; **kit de gravação da segunda-feira** (seção 11.1) impresso em PDF/Doc para o Mauricio e a Danielle; pauta no Estúdio (versão mínima) | — |
| **F1** | Importadora 360 (ficha, galpões, documentos, receita, saúde v1, ações); papel `BRAS_IMPORTER` com painel "Hoje", Pedidos, Produtos e caixas (modelo 6.2), Estoque manual e planilha | Decisão do papel (seção 5) |
| **F2** | Transportadoras v1: cadastro rápido pela importadora e pelo Estúdio, "chamar transportadora", painel grátis da transportadora, link do motorista, comissão por carga manual; marca com nome `[CONFIRMAR]` | Nome da marca |
| **F3** | Planos do membro no Master (Prata, Ouro, Platinum) com paywalls em todos os cantos, tendências da semana, calculadora (privada e pública) | Preços publicados pelo dono |
| **F4** | Alto mar e pré-pedido (importadora e Platinum), avisos de ETA, devolução por atraso | Revisão jurídica 7.3 |
| **F5** | Contêiner fechado: opções, cotação do catálogo (7 dias), fora do catálogo pago (15 dias) | Revisão jurídica, preço no Master |
| **F6** | Contêiner compartilhado ao vivo e simulador de cubagem no Master e na importadora | Revisão jurídica 9.4 |
| **F7** | Bling (OAuth2, saldos, mapeamento, sincronização, conflito) | Credenciais do app Bling da NextLevel; importadora piloto com Bling |
| **F8** | Transportadoras avançado: planos Pro/Premium, publicidade rotulada, recomendação, API com webhook, consolidação e ocupação, reputação | F2 em uso |
| **F9** | Máquina de conteúdo completa (desempenho por formato, pedido de gravação patrocinado, API do YouTube) | F0 e F1 |

Cada fase: domínio e testes (Vitest), telas no design system (`painel-interno`), e2e em 360/768/1440 com axe, decisão, relatório (`docs/relatorios/BD-V2-FASE-N.md`) e publicação.

---

## 18. Critérios de aceite gerais (toda fase)

- Funciona de ponta a ponta na demonstração com dados realistas e fictícios identificados.
- Tipos, estilo, testes e build passando; e2e da Brás e dos novos fluxos passando.
- Isolamento e teste de chaves para importadora, transportadora e membro.
- Nada trancado chega ao navegador de quem não tem acesso.
- Valores em centavos, preços e regras do Master, nada fixo no código.
- Copy dentro das regras da seção 3.4.
- Acessibilidade AA, sem rolagem lateral em 360 px, movimento reduzido respeitado (contador e barra).
- SuperDrop e Commerce sem mudança de comportamento (suíte completa).

---

## 19. Banco de copy (forte, verdadeira)

**Membro, análise (Prata):**
- "Você está vendo o produto. Os assinantes estão vendo **por que ele vai vender**."
- "Antes de colocar dinheiro numa caixa, veja a concorrência, o preço no Mercado Livre e a margem estimada. **Libere a análise.**"
- "X análises novas esta semana. Você viu 0."

**Membro, Ouro (contêiner):**
- "Caixa fechada é o começo. **Contêiner é onde o preço por unidade cai.** Participe das cotas."
- "Faltam {n} cotas para este contêiner fechar. Quem é Ouro entra agora."

**Membro, Platinum (alto mar):**
- "Chega em {data}. **Quem é Platinum garante as caixas antes do contêiner atracar.**"
- "Os outros vão ver este produto quando chegar. Você pode reservar hoje."

**Importadora (Pro/Premium):**
- "Venda o contêiner **antes de ele chegar**. Pré-pedido com sinal na sua conta."
- "Seu estoque atualiza sozinho com o Bling. **Pare de responder 'tem?' no WhatsApp.**"
- "Importadoras Premium aparecem primeiro nas descobertas e no catálogo."

**Transportadora (Pro/Premium):**
- "**Carga no Brás sem sair procurando.** As coletas da sua rota chegam no seu painel."
- "Seja a transportadora **recomendada** para importadoras e lojistas da sua região."
- "Pro vê as oportunidades 30 minutos antes. **Quem chega primeiro carrega.**"

**Proibido** (exemplos que não podem aparecer): "lucre R$ 10 mil", "renda garantida", "o melhor frete do Brasil" (sem prova), "últimas vagas" sem contador real.

---

## 20. Perguntas ao dono (siga com o padrão sugerido; registre)

1. **Nome da marca de transporte** e endereço (padrão: provisório "NextLevel Cargas", `cargas.nextlevelgroup.com.br`).
2. **Preços** dos planos de membro, importadora e transportadora, da publicidade e da comissão por carga (padrão: as sugestões em DRAFT; nada no ar sem publicar no Master).
3. **Sinal do pré-pedido** (padrão 30%) e atraso que libera a devolução (padrão 30 dias após a ETA original).
4. **Comissão da Brás** no pré-pedido e no contêiner (padrão: a comissão da importadora, D102, sobre o valor total, no pagamento do saldo).
5. **Cotação fora do catálogo:** quem responde e a devolução se o prazo vencer (padrão: a Brás distribui para as importadoras parceiras; prazo vencido devolve 100%).
6. **Contêiner compartilhado:** prazo de fechamento (padrão 30 dias), prorrogação (padrão 1 vez, 15 dias) e mínimo para fechar (padrão 100%).
7. **Incoterms** usados pelas importadoras (padrão: "entregue no galpão do Brás", preço nacionalizado).
8. **Bling:** credenciais do aplicativo da NextLevel e importadora piloto com Bling.
9. **Exigências da transportadora** no cadastro (padrão: CNPJ ou CPF, RNTRC opcional na v1, seguro declarado).
10. **Advogado** para os itens da seção 16, antes das fases F4 a F6.

---

### 20.1 Respostas do dono (2026-10-09, D108)
1. **Marca:** "NextLevel Cargas" em `cargas.nextlevelgroup.com.br`. Aceito; o domínio já foi ligado no Render e na Hostinger. A página pública e a lista de interesse estão no ar.
2. **Preços:** Prata R$ 97, Ouro R$ 197 e Platinum R$ 397; comissão por carga e publicidade como sugerido (8% / 6% / 5% por plano da transportadora; destaques R$ 197 e R$ 297 por mês). Tudo em rascunho no catálogo Master até o dono publicar.
3. **Pré-pedido:** sinal de 30% e devolução liberada com 30 dias de atraso sobre a ETA original. Aceito.
4. **Bling:** deixar tudo pronto para receber as credenciais (fase F7).
5. **Advogado:** textos com dados simulados e editáveis. Feito: Brás → Planos e regras → Jurídico.
6. **Tudo editável no Master:** Brás → Planos e regras (preços, regras, classificação, suporte, jurídico, simulador).

### 20.2 Módulo K: suporte por plano (pedido do dono)
- Grátis: perguntas frequentes.
- Básico pago (Prata): chat e WhatsApp com a equipe.
- Avançados (Ouro e Platinum): agenda pessoal na importadora, com 1 e 2 visitas por mês.
- Canais e limites ficam editáveis no Master.
- A grande conta tem WhatsApp mesmo no grátis (padrão editável).
- Telas: Meu Brás → Suporte; Estúdio → Atendimento (conversas e agenda).

### 20.3 Módulo L: classificação do cliente (pedido do dono)
- **Separar o pequeno que está testando do cliente gigante.** O cadastro tem 7 perguntas:
  - momento do negócio;
  - canais;
  - compra mensal pretendida;
  - faturamento;
  - experiência com importação;
  - equipe;
  - objetivos.
- **Nível declarado:** pontos e cortes editáveis no Master, com pisos. Exemplo: compra acima de R$ 500 mil por mês já é grande conta.
- **Nível comprovado:** compras pagas em 90 dias.
- **Nível final:** vale o maior dos dois, salvo ajuste manual do Master, com motivo.
- **No Master:** o dono vê o nível de cada cliente em Membros, com filtro, respostas e motivo.
- **Momento da jornada:** novo, aguardando, primeira compra, recorrente ou esfriando.
- **Meu Brás:** o painel escolhe os 3 cartões principais pelo nível, pelo momento e pelos objetivos. Exemplos:
  - iniciante: "comece com uma caixa";
  - grande conta: "atendimento de perto", contêiner e alto mar, marcados "em preparação" até as fases F4 a F6.

## 21. Relatório de cada fase (`docs/relatorios/BD-V2-FASE-N.md`)

```
# Brás v2 — Fase N
## Em 5 linhas (para o dono)
## Entregue e no ar (função, para quem, decisão, commit)
## Ficou para depois e por quê
## O que depende de você
## Verificação (tipos, estilo, testes, build, e2e, capturas)
## Riscos e dívidas
## Próxima fase
```

Ao final de cada fase, avise o dono em português simples, sem jargão.
