# BRÁS DIGITAL CLUB + CARGAS EXCURSÃO — PROMPT MESTRE DE ENGENHARIA
## Ônibus de excursão como rede de frete do Brás, painel "tipo app" para o dono do ônibus, catálogo de ônibus para o lojista do Brasil inteiro, carga sempre com nota (Nota Fácil e Meu Contador), um painel de frete único para o cliente, importadoras e transportadoras nas duas vias, indicações com pontos e um clube de benefícios que liga as empresas do grupo

> **Pedido do dono (2026-10-10, resumo fiel):**
> - **Primeira transportadora:** Starline Viagens e Turismo Ltda - ME (nome fantasia **Mauricio Turismo**), CNPJ **47.173.173/0001-75** (dígitos conferidos). Fundada em 15/07/2022, sede em São Paulo/SP, atividade principal hoje: agência de viagens. Modalidade: **ônibus de excursão**.
> - **A frente:** todo dia centenas de ônibus de excursão chegam ao Brás, vindos do Brasil inteiro, com lojistas e sacoleiras. Muita gente **não precisa mais viajar**: já conhece as lojas certas e só manda a mercadoria pelo ônibus. Foco específico nos ônibus de excursão.
> - **Dono da excursão:** painel didático e organizado, **prático como um app de corrida** para receber pedidos de carga.
> - **Lojista do Brasil inteiro:** painel para ver o **catálogo de ônibus da região dele** e fazer pedidos de carga. Se o ônibus que ele já usa não estiver lá, ele **cadastra com 1 clique** (nome e contato do responsável). Ele precisa de um **motivo para usar o sistema**; talvez o maior seja o próprio ecossistema.
> - **Carga:** 80% dos pedidos são **fardinhos pequenos e fardos médios**. O ônibus não quer carga grande: **quanto menor o fardo, maior o lucro** no mesmo espaço.
> - **Grupo do Mauricio:** Starline Viagens e Turismo (transporte de carga e ônibus de excursão), Mega Tron Comércio Eletrônico Ltda (atacado, distribuidor e importador), NextLevel Marketing Ltda (todas as marcas e sistemas). Cliente de uma empresa deve ter **benefício e desconto ao usar a outra**.
> - **Novo sistema:** um **clube de benefícios** para fornecedores e clientes, muito bem estruturado: **Brás Digital Club**.
>
> **Respostas do dono (2026-10-10, segunda rodada):**
> - **A Starline tem outras autorizações** que permitem levar carga no ônibus. O sistema guarda essas autorizações (número, validade e arquivo) e mostra o selo "documentação em dia" (seção 5.6).
> - **O Brás Digital tem o emissor de nota fácil (Nota Fácil)**, com **promoção para novos lojistas**. A lógica: o cliente pede para a loja se cadastrar, a loja ganha o benefício e a emissão fácil, e a carga viaja com nota (Módulo E, seção 7A).
> - **Função emergencial "Meu Contador":** para quem tem uma situação urgente e está sem nota, a equipe resolve **em algumas horas** e regulariza o transporte (seção 7A.4).
>
> **Pedido do dono (2026-10-10, terceira rodada):**
> - **Um painel de frete só:** quem usa frete, seja de transportadora, seja de ônibus de excursão, usa **o mesmo painel**, e de alto nível (seção 6A).
> - **Catálogo de transportadoras no pedido:** o cliente de **qualquer importadora** já vê as transportadoras disponíveis (a Starline e as outras) num catálogo de escolha fácil (seção 6A.2).
> - **Importadoras e transportadoras se comunicam nas duas vias**, e cada via traz gente nova com facilidade: novas importadoras, novas transportadoras, novos clientes (seção 6B).
> - **Quem indica ganha:** painel gamificado, começando por **pontos**, usados como **desconto**, ligado às indicações do Club (seção 7B).
>
> **Autoridade:** Constituição (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`) > `docs/design/DECISIONS.md` (D91 a D111 são da Brás e da Cargas) > `docs/prompts/bras-ecossistema-importadoras-conteiner-transporte.md` (Brás v2) > este documento > a tarefa do momento.
> **Próxima decisão livre:** confira em `CLAUDE.md` (hoje D112).
> **Skills:**
> - `desenvolver-prompt` (por fase);
> - `painel-interno` (telas autenticadas, "modo app" do dono do ônibus);
> - `pagina-de-vendas` (páginas públicas do Club e da Excursão, só com ativos reais);
> - `nova-migracao` (banco);
> - `qa-visual` e `e2e-demo` (conferência);
> - `publicar` (envio);
> - `desempenho` (o app do ônibus roda em celular simples e 4G fraco);
> - kit de análise quando reduzir incerteza real: `impact-analysis`, `security-guardian`, `acceptance-designer`, `ux-flow-auditor`.

---

## 0. Seu papel e o contrato

Você é o engenheiro responsável por três frentes ligadas:
- **Cargas Excursão:** a vertical de ônibus de excursão dentro da NextLevel Cargas;
- **Brás Digital Club:** o clube de benefícios;
- **as pontes entre as empresas do grupo.**

Trabalhe **por fases** (seção 14). Cada fase fecha com:
- domínio e testes;
- telas e e2e;
- decisão em `DECISIONS.md`;
- relatório em `docs/relatorios/CLUB-FASE-N.md`;
- publicação na branch de publicação, pelo fluxo de `AGENTS.md`.

### 0.1 Pode fazer sozinho
- Tudo desta especificação que não dependa de um `[CONFIRMAR]` bloqueante.
- Tabelas e colunas aditivas: prefixo `tr_` (transporte) e `club_` (clube).
- Preços, taxas e benefícios como **rascunho** no Master, com os valores sugeridos aqui. **Nunca publique preço nem benefício sem o dono aprovar no Master.**
- Cadastrar a Starline como primeira transportadora (fase E0), com o documento acima.

### 0.2 Não pode fazer sem o dono
- Ligar a cobrança do frete, a taxa da plataforma ou os pontos do Club em produção antes da **revisão jurídica e contábil** da seção 12.
- Criar domínio, mexer em DNS ou ligar chave de produção.
- Mudar o comportamento do SuperDrop, da Commerce ou da Brás (em produção) sem teste.
- Guardar dinheiro de terceiros (frete) numa conta da NextLevel.
- Dar vantagem escondida às empresas do grupo na busca ou no ranking (seção 3.4).

### 0.3 Quando travar
Implemente o que não depende do item travado, deixe a chave desligada, registre o `[CONFIRMAR]` no relatório e siga.

---

## 1. Visão: o Brás como rede, e o Club como cola

### 1.1 O ecossistema em uma frase
**O lojista do interior compra do Brás sem sair de casa, a mercadoria chega pelo ônibus que ele já conhece, e cada real gasto numa empresa do grupo vira vantagem nas outras.**

### 1.2 Os lados

| Lado | Quem é | O que ganha | Como o grupo ganha |
|---|---|---|---|
| **Lojista e sacoleira** | Revendedor do Brasil inteiro, com CPF, MEI ou CNPJ | Achar o ônibus da região, reservar espaço, rastrear o fardo, não viajar, descontos no Club | Taxa por volume (NextLevel), compra na Mega Tron, planos da Brás Digital |
| **Dono do ônibus** | Empresas de excursão (a Starline é a primeira) e autônomos | Pedidos de carga organizados, bagageiro cheio antes de sair, frete pago adiantado, menos fardo perdido, passageiros com desconto | Frete (Starline, quando é a Starline), taxa da plataforma (NextLevel), planos da Cargas |
| **Loja do Brás** | Mega Tron, importadoras da Brás Digital e, depois, qualquer loja | Vende para quem não veio, entrega no ônibus com etiqueta, recebe cliente do Club | Venda (Mega Tron), comissão (NextLevel), publicidade |
| **Guia de excursão** | Quem traz passageiros ao Brás | Pontos do Club pelas compras dos passageiros nas lojas participantes (formaliza a comissão de guia que já existe no Brás) | Fluxo de compradores nas lojas do grupo |
| **NextLevel (dono)** | Master | Uma rede onde cada lado puxa o outro, e o mapa da demanda do país | Todas as linhas acima, configuráveis no Master |

### 1.3 O volante
1. O lojista do interior acha no catálogo o ônibus da cidade dele e reserva espaço.
2. Ele compra da Mega Tron ou de uma importadora da Brás e escolhe **"entregar no ônibus"**.
3. A loja etiqueta o fardo **com a nota** (Nota Fácil); sem nota, o Meu Contador resolve. O ônibus coleta e leva; o lojista retira com o código.
4. Cada passo gera pontos do Club, que viram desconto na próxima compra ou no próximo frete. Quem traz gente nova (importadora, transportadora, ônibus, lojista) ganha mais pontos.
5. A demanda por cidade aparece no Master: **onde vale abrir uma rota nova da Starline**.
6. Mais rotas trazem mais lojistas, mais compras e mais cargas.

### 1.4 Empresas do grupo e marcas (não confunda)
- **Empresa** é quem fatura e responde juridicamente: Starline, Mega Tron, NextLevel.
- **Marca** é o produto no sistema: NextLevel Cargas, Brás Digital, Brás Digital Club, SuperDrop, NextLevel Commerce.
- A **Starline** é uma *transportadora* dentro da NextLevel Cargas, igual a qualquer outra.
- A **Mega Tron** é uma *loja ou importadora* (fornecedor) dentro da Brás Digital e do SuperDrop, igual a qualquer outra.
- O **Club** é uma *camada* sobre todas as marcas, não um sistema separado.
- Mesmo repositório, deploy, banco e Master (regra anti-duplicação do `CLAUDE.md`).

### 1.5 Como tudo se conecta (o mapa)
- **Pedido → frete:** todo pedido de importadora já oferece o catálogo de ônibus e transportadoras (6A.2); a escolha vira um frete no painel único do cliente (6A) e chega à importadora como sugestão (6B.1).
- **Frete → nota:** nenhum frete viaja sem nota; falta de nota vira convite à loja (Nota Fácil) ou Meu Contador (7A).
- **Tudo → pontos:** compra, frete, nota emitida e indicação geram pontos no mesmo razão (7.2), e os pontos viram desconto em qualquer empresa do grupo (7B.5).
- **Tudo → gente nova:** cada tela tem um convite do tipo certo ("meu ônibus não está aqui", "convide a loja", "traga uma importadora"), e todos passam pelo mesmo motor de indicações (7B.1).
- **Importadora ↔ transportadora:** preferidas, coleta fixa, demanda agregada e conversa presa à coleta (6B), com cada lado trazendo o outro.
- **Master:** uma tela para cada alavanca (preços, tabela de pontos, missões, fila do Meu Contador, acerto entre empresas) e o funil de crescimento da rede inteira (8).

---

## 2. Pense como o dono do ônibus: o que faz a diferença

Hoje a carga do ônibus vive no WhatsApp, no caderno e na memória do ajudante. As dores, na ordem em que custam dinheiro:

1. **Fardo perdido ou trocado.** Fardos iguais, marcados à caneta, recolhidos em 30 lojas. Um fardo perdido apaga o lucro de dez.
2. **Calote e "pago na chegada".** O lojista some, ou contesta o valor.
3. **Bagageiro mal aproveitado.** Ou sobra espaço, ou chega carga grande de última hora e não cabe.
4. **Tempo de coleta no Brás.** O ajudante roda galeria por galeria atrás de fardo que não está pronto.
5. **Telefone tocando o dia inteiro.** "Meu fardo já está aí?", "quanto fica?", "que dia vocês saem?".
6. **Preço confuso.** Cada um cobra de um jeito e o cliente pechincha.

**O que faria o dono do ônibus usar o sistema todo dia (o "app de corrida"):**
- **Tela de chamada em cartões:** cada pedido chega como cartão com cidade, tamanho (P, M, G), loja de coleta, valor do frete já calculado e foto, se houver. Botões grandes **Aceitar** e **Recusar**, sem digitar nada.
- **Medidor do bagageiro:** a viagem tem capacidade em "fardinhos equivalentes" (P = 1, M = 2, G = 4, configurável). O medidor enche conforme ele aceita; quando lota, o sistema fecha os pedidos da viagem sozinho e abre lista de espera.
- **Tabela de preço dele, por tamanho:** ele define o preço de P, M e G uma vez por rota. O cliente vê o preço antes de pedir, e acaba a pechincha.
- **Frete pago antes (Pix):** o dinheiro vai direto para a conta Mercado Pago do dono do ônibus, conferido na API (nunca pelo corpo do webhook). O "pago na chegada" fica opcional, por cliente de confiança, e marcado.
- **Etiqueta com QR:** cada fardo tem etiqueta impressa pela loja (ou escrita com o código curto, para quem não tem impressora). Os passos são **coletado na loja**, **no ônibus** e **entregue**: cada um com bipe pelo celular e foto. Acabou o fardo sem dono.
- **Rota de coleta no Brás:** a lista do ajudante agrupa por rua e galeria, na ordem do caminho, com "pronto para coletar" marcado pela loja. A loja também pode **levar até o ônibus** (ponto de embarque da viagem), o que vira diferencial da loja.
- **Resposta automática:** o cliente vê sozinho o status, o dia de saída e o de chegada. O telefone para de tocar.
- **Faturamento da viagem:** frete recebido, fardos por tamanho, comparação com a viagem anterior.
- **Clientes fiéis:** histórico de cada cliente, nota de pontualidade e "cliente de confiança" (libera pagar na chegada).
- **Diferente de tudo:** o **mapa de demanda**. O dono do ônibus vê de que cidades vêm pedidos que ninguém atende (agregado, sem identificar o cliente) e decide abrir rota nova. Para a Starline, isso é planejamento de frota com dado real.
- **Passageiros com vantagem:** passageiro da excursão de um ônibus do Club ganha desconto nas lojas participantes (Mega Tron primeiro). Isso ajuda o dono do ônibus a **vender poltrona**.

## 3. Pense como a sacoleira e o lojista: o que faz a diferença

Dores de quem compra de longe: não saber em que ônibus mandar, não saber se a loja entregou, medo de perder o fardo, pagar frete sem tabela e ter que viajar só para buscar.

**O que faria o lojista usar o sistema:**
- **Catálogo de ônibus da região:** ele informa a cidade e vê os ônibus que atendem perto, com:
  - dias de chegada e saída do Brás, e o dia de chegada na cidade;
  - preço por tamanho (P, M, G);
  - ponto de retirada na cidade;
  - nota de pontualidade e quantos fardos já entregou pelo sistema (dado real);
  - selo "frete pago com proteção" (seção 6.5).
- **"O meu ônibus não está aqui":** um toque abre o cadastro com nome do responsável, WhatsApp, cidade e nome da excursão. O ônibus aparece para ele na hora como **"indicado por você"**, ainda sem verificação, e o responsável recebe o convite pelo WhatsApp para assumir o perfil (seção 5.3). Cada ônibus indicado que entra dá pontos do Club a quem indicou (seção 7B).
- **Reserva antes de comprar:** ele reserva o espaço na viagem e recebe o código do fardo. Na loja (ou no checkout online da Mega Tron e da Brás Digital) escolhe **"entregar no ônibus"** e informa o código.
- **Rastreio simples:** reservado → pronto na loja → coletado → no ônibus → saiu de São Paulo → chegou → retirado. Com foto do fardo e aviso no WhatsApp ou por e-mail.
- **Um lugar para tudo:** compras de várias lojas num só pedido de frete, com o total de volumes, e o histórico do mês.
- **Club:** cada fardo enviado dá pontos; cada compra na Mega Tron dá pontos; os pontos viram desconto no frete e nas compras. No ecossistema, quem centraliza paga menos.
- **Não precisa viajar:** a mensagem principal é *"compre do Brás de onde você está; seu ônibus de confiança traz"*.

### 3.4 Neutralidade (vale para as duas visões)
A Starline e a Mega Tron são do mesmo dono da plataforma. Para que outros ônibus e lojas confiem e entrem:
- a busca ordena por critério público (região, data, preço, nota), **nunca por ser do grupo**;
- empresas do grupo levam o selo **"empresa do grupo NextLevel"**;
- destaque pago é rotulado **"patrocinado"** e segue a mesma regra para todos;
- os dados de um ônibus ou de uma loja nunca vão para outra, nem para a Starline ou a Mega Tron (D92: um tenant nunca lê dados de outro). Isso inclui o mapa de demanda, que é agregado e o mesmo para todos.

---

## 4. O que já existe (estenda; não duplique)

| Já existe | Onde | Use para |
|---|---|---|
| Transportadora, login, plano, link do motorista, coletas, comissão congelada no aceite | `tr_carriers`, `tr_loads`, `src/lib/domain/cargas/cargas.ts` (D111) | **Base da Excursão:** o ônibus é uma transportadora com `vehicles` incluindo `ONIBUS_EXCURSAO` e um tipo de operação "excursão" |
| Página pública da Cargas e interessados | `cargas-home`, `registerCargasInterest` (D108) | Cadastro do dono do ônibus e lista de interessados |
| Regras editáveis com versão | `getBrasRules` / `bras.v2_rules` (D108) | Grupo `excursion` (tamanhos, taxa, capacidade) |
| Importadoras, produtos de caixa, estoque, pedido, código de retirada | `bd_importers`, `bd_products`, `bd_requests` (D92, D103, D110) | "Entregar no ônibus" nos pedidos da Brás; a Mega Tron pode ser importadora |
| Fornecedores e pedidos do SuperDrop | `suppliers`, `orders` | Mega Tron como fornecedor; benefício do Club para lojistas do SuperDrop |
| Catálogo Master versionado, assinaturas, gateway único | `catalog_products`, `nl_subscriptions`, `corporate_orders` (D90) | Planos da Cargas e do Club; nada de tabela de planos paralela |
| Mercado Pago da loja (token criptografado) | `stores.mpAccessTokenEnc`, `encryptSecret` | **Mercado Pago do dono do ônibus:** o frete cai direto na conta dele |
| Parceiros, atribuição, comissão versionada, links `/r/<código>` | `partners` (`PARTNER_KINDS`), `partner_links`, `commission_rules` (D90) | **Guia de excursão** como novo `kind` de parceiro (nada de tabela nova de guias); a regra "uma indicação, um dono" da seção 7B.4 decide entre comissão (parceiro) e pontos (Club) |
| Campo de texto "Transportadora que vai retirar" no pedido da Brás | `src/app/meu-bras/pedir/[id]/request-form.tsx`, `bd_requests.carrier` | Vira a **escolha no catálogo de transportadoras** (seção 6A.2), mantendo "outra" como texto, que gera uma transportadora indicada |
| Coletas da importadora para a transportadora | `tr_loads`, `callCarrier` (D111) | A escolha do cliente no pedido já chega à importadora como transportadora sugerida para a coleta |
| Cupons | `coupons` | O resgate do Club gera cupom (estenda com tipo e origem; não crie outro sistema de cupom) |
| Carteira com razão (saldo = soma dos lançamentos) | `wallet_accounts`, `wallet_entries` | **Padrão** para o razão do Club (append-only, saldo em cache conferido em teste), em tabela própria porque a carteira é da loja e o crédito do Club é da pessoa |
| Concessões (`entitlements`) | `entitlements` | Vantagens de acesso do Club (ex.: 1 mês da análise da Brás) |
| E-mail, avisos, jobs, erros | `src/lib/email.ts`, `avisos.ts`, `job_runs` | Avisos de status, vencimento de pontos, fechamento mensal entre empresas |
| Modo suporte auditado | AD2 / D80 | "Ver como o dono do ônibus vê" e "ver como o lojista vê" |

---

## 5. Módulo A: Cargas Excursão (o ônibus)

### 5.1 Modelo (aditivo; valide contra o que existe)
- `tr_carriers`:
  - acrescente `ONIBUS_EXCURSAO` em `CARGAS_VEHICLES` (rótulo "Ônibus de excursão");
  - nova coluna `operation`: `CARGA` (padrão, D111) ou `EXCURSAO`;
  - novas colunas `claimStatus` (`VERIFICADA` ou `INDICADA`) e `referredByClubMemberId`.
- `tr_routes` (rota fixa): transportadora, cidade e UF de origem, cidades atendidas no caminho, ponto de embarque no Brás (endereço e referência), ponto de retirada na cidade, dias da semana de chegada ao Brás e de saída, prazo de viagem em horas, tabela de preço por tamanho (`{P, M, G}` em centavos), ativa ou não.
- `tr_trips` (viagem): rota, data e hora de chegada ao Brás, saída, chegada prevista na cidade, capacidade em fardos equivalentes, ocupação (calculada), situação (`ABERTA`, `LOTADA`, `EM_COLETA`, `EM_VIAGEM`, `CHEGOU`, `ENCERRADA`, `CANCELADA`).
- `tr_parcels` (fardo):
  - viagem, cliente (membro do Club) e tamanho (`P`, `M`, `G`), com volumes equivalentes congelados;
  - loja de coleta (texto livre ou ligação com `bd_importers` ou `suppliers`) e destinatário (nome e cidade);
  - preço congelado na reserva; taxa da plataforma congelada no aceite;
  - código curto e QR: só o hash no banco, como D106 e D111;
  - pagamento (`A_PAGAR`, `PAGO`, `NA_CHEGADA`) e situação;
  - **nota da mercadoria:** chave de acesso da NF-e (44 dígitos, conferida pelo dígito) ou número e série, e a situação da nota (`COM_NOTA`, `NOTA_A_CAMINHO`, `SEM_NOTA`, `MEU_CONTADOR`) (seção 7A);
  - foto de cada etapa.
- `tr_parcel_events`: append-only, com quem, quando, onde (texto) e foto.
- `tr_loads` (D111) continua para a carga fechada de importadora; o fardo da excursão é um modelo próprio porque a unidade é o volume, não o pedido.

### 5.2 Tamanhos (regra editável no Master, grupo `excursion`)

| Tamanho | Sugestão de limite (rascunho) | Equivalência no bagageiro |
|---|---|---|
| Fardinho P | até 40 × 30 × 30 cm e 10 kg | 1 |
| Fardo M | até 60 × 40 × 40 cm e 20 kg | 2 |
| Fardo G | até 80 × 50 × 50 cm e 30 kg | 4 |

- Acima de G, o pedido não entra na excursão: o sistema sugere a carga fechada (D111).
- Os números são ponto de partida para validar com a Starline `[CONFIRMAR com a Starline]`.

### 5.3 Ônibus indicado pelo lojista (crescimento)
1. O lojista informa nome do responsável, WhatsApp, nome da excursão e cidade.
2. Nasce uma transportadora `INDICADA`. Ela aparece **só para quem indicou**, como "indicado por você", e o lojista já pode guardar ali o histórico dele.
3. O responsável recebe um link pelo WhatsApp (texto pronto, sem envio automático pago) para **assumir o perfil**: confirma documento (CPF ou CNPJ conferido), cria a senha e define rota e preço. Vira `VERIFICADA` e passa a aparecer no catálogo para todos.
4. O mesmo documento, ou o mesmo WhatsApp, nunca gera dois ônibus (reaproveita, como `createCarrier`).
5. Quem indicou ganha pontos do Club quando o ônibus completa a primeira viagem pelo sistema (indicação confirmada, seção 7B).

### 5.4 Painel do dono do ônibus (modo app)
Área `/excursao` (papel `CARRIER` com `operation = EXCURSAO`), feita para celular, com barra inferior:
- **Viagem:** a viagem atual com o medidor do bagageiro, os botões grandes **Abrir viagem**, **Fechar pedidos**, **Saí de São Paulo**, **Cheguei** e a contagem por situação.
- **Chamadas:** os cartões de pedido (seção 2), com Aceitar e Recusar com motivo de um toque ("sem espaço", "tamanho", "data").
- **Coleta:** a lista do ajudante por rua e galeria, com "pronto na loja", **bipar QR** (câmera do celular, com campo para digitar o código como alternativa) e foto.
- **Entrega:** na cidade, o cliente mostra o código; bipe e foto. Sem código, não entrega.
- **Rotas e preços:** rotas, dias, pontos e tabela P, M, G.
- **Dinheiro:** frete por viagem, a receber na chegada e taxa da plataforma do mês.
- **Ajudante:** link sem login (padrão do link do motorista, D111) só com Coleta e Entrega, sem valores.
- Celular simples e rede fraca: telas leves, botões de 48 px ou mais, ações com nova tentativa idempotente (`dedupeKey`) e nada que dependa de animação.

### 5.5 Aceite
- O dono do ônibus abre a viagem, recebe três pedidos (P, M e G), aceita dois e recusa um com motivo; o medidor mostra 3 de N.
- Lotou: novos pedidos vão para a lista de espera, e o cliente vê "lotado; você está na lista".
- Fardo sem código não entrega; código errado registra a tentativa e limita repetições.
- O ajudante não vê valores; o dono de outro ônibus não vê nada deste.
- Preço e taxa ficam congelados: mudar a tabela depois não mexe em fardo reservado.

### 5.6 Autorizações do ônibus (documentação em dia)
- A transportadora cadastra as autorizações que tem (tipo, número, órgão, validade e arquivo em PDF ou foto). O Master confere e marca como verificada.
- A Starline já tem as autorizações necessárias (resposta do dono): o cadastro dela na E0 já entra com os documentos que o dono enviar.
- O catálogo mostra o selo **"documentação em dia"** só para autorização verificada e dentro da validade. 30 dias antes de vencer, o dono do ônibus e o Master recebem aviso; vencida, o selo some sozinho.
- Os arquivos ficam no mecanismo de arquivos existente, visíveis só para a transportadora e o Master.

---

## 6. Módulo B: Frete para o lojista (catálogo de ônibus e pedidos)

### 6.1 Quem é o lojista no sistema
- A **conta do Club** é a conta universal do comprador (papel novo `CLUB_MEMBER`), aceita CPF, MEI ou CNPJ e é ligada pelo documento à identidade do Club (seção 7.1).
- Quem já é membro da Brás (CNPJ, D91), lojista do SuperDrop ou da Commerce **não cria outra conta**: liga a conta existente ao Club com aceite e usa o frete pela área dela.
- `[CONFIRMAR]` endereço: área `/club` no endereço do Club (seção 10).

### 6.2 Telas (próprias do ônibus, dentro do painel de frete único da seção 6A)
- **Achar ônibus:**
  - cidade e UF (com cidades próximas), mais data;
  - lista de cartões com ônibus, dias, preço P, M e G, ponto de retirada, nota e fardos entregues;
  - filtro "paga na chegada aceito";
  - selos "empresa do grupo" e "patrocinado" onde couber (seção 3.4).
- **Reservar:** escolher a viagem, quantos P, M e G, a(s) loja(s) de coleta e quem retira. Mostra o total na hora e paga por Pix (seção 6.4). Gera o código de cada fardo e o texto para mandar à loja ("entregue no ônibus X, viagem do dia D, fardo código C").
- **Meus fardos:** a linha do tempo de cada fardo, com fotos.
- **Meus ônibus:** os ônibus que ele usa, os indicados por ele e o botão **"O meu ônibus não está aqui"**.
- **Club:** o saldo de pontos, o nível e as vantagens disponíveis (seção 7).

### 6.3 Loja do Brás: "entregar no ônibus"
- No pedido da Brás Digital (importadora) e no da Mega Tron, nova forma de entrega: **"Ônibus de excursão"**, com o código do fardo ou a escolha da viagem. O pedido passa a mostrar a etiqueta do fardo para imprimir.
- **Balcão da loja** (padrão D106, link sem login, ou o painel da importadora, D110): "pronto para coletar" e "entregue ao ajudante", com bipe e foto.
- A loja vê só o necessário (código, tamanho, ônibus, ponto de embarque), nunca o telefone do lojista. Mesma fronteira de D92 e D111.
- **Nota no fardo:** ao marcar "pronto para coletar", a loja informa a nota (chave da NF-e) ou emite na hora pelo **Nota Fácil** (seção 7A.2). Loja sem nota cai no fluxo da seção 7A.

### 6.4 Pagamento do frete
- O frete é do dono do ônibus: Pix gerado na **conta Mercado Pago dele** (token só com `encryptSecret`), conferido na API antes de valer, com idempotência por `dedupeKey`.
- A **taxa da plataforma** é da NextLevel, cobrada do dono do ônibus por fatura mensal (como D102 e D111), até existir o split com Pix confirmado `[CONFIRMAR Pix no split]`.
- **Na chegada** é opção do dono do ônibus, por cliente marcado como de confiança. O sistema registra o recebimento ("recebi em dinheiro ou Pix") para fechar a conta.
- Cancelamento e reembolso seguem regra pública do ônibus (prazo antes da saída), mostrada antes de pagar.

### 6.5 Proteção do fardo (diferencial, com cuidado)
- **Fase inicial:** a "proteção" é **processo e prova**: QR em cada etapa, foto, histórico e nota pública do ônibus. Nada de prometer indenização.
- **Depois:** fundo de garantia ou seguro de carga com parceiro, `[CONFIRMAR jurídico e seguradora]`. Até lá, o texto é "fardo rastreado com foto em cada etapa", nunca "garantido" ou "seguro".

### 6.6 Aceite
- O lojista acha o ônibus pela cidade, reserva 2 P e 1 M, paga (Pix simulado no e2e com o MP falso existente) e recebe três códigos.
- A loja marca "pronto"; o ajudante bipa; o dono marca a saída; o lojista vê cada passo; na retirada, o código fecha o fardo.
- O lojista indica um ônibus que não existe; ele aparece só para o lojista; o responsável assume pelo link e o ônibus passa a aparecer para todos.
- Isolamento testado: lojista A não vê fardo do B; uma loja não vê o telefone do lojista.

---

## 6A. Painel de frete do cliente: um só, para ônibus e transportadora

### 6A.1 Princípio
- O cliente não quer saber se é ônibus ou transportadora: ele quer **a mercadoria chegando, sabendo onde está e quanto custou**. Um painel só, de alto nível, para qualquer frete.
- O mesmo conjunto de telas e componentes (`src/components/frete/*`) e o mesmo domínio (`src/lib/domain/frete/*`) aparecem:
  - para o membro da Brás, em `/meu-bras/fretes`;
  - para o cliente do Club, em `/club/fretes`;
  - e depois para o lojista do SuperDrop e da Commerce.
  É uma capacidade em vários lugares, não páginas copiadas (Constituição, seção 5).
- **Envelope único: `tr_shipments`.** Cada frete do cliente tem:
  - modo `ONIBUS` (aponta para os fardos, `tr_parcels`) ou `TRANSPORTADORA` (aponta para a coleta, `tr_loads`, D111);
  - origem: pedido(s) da Brás, da Mega Tron ou de outra loja;
  - código de rastreio para o cliente;
  - situação unificada.
  O que é de cada modo continua no modelo dele; o envelope só junta para o cliente.
- **Situação unificada** (mesmas palavras para os dois modos): **Reservado → Pronto na loja → Coletado → Em viagem → Chegou → Entregue**, mais **Cancelado** e **Problema**. Cada passo tem data, foto quando houver e quem fez.

### 6A.2 Catálogo de transportadoras no pedido de qualquer importadora
- No pedido da Brás Digital (e no da Mega Tron), o campo de texto "Transportadora que vai retirar" vira **"Como sua mercadoria vai chegar"**, com cartões:
  - **Ônibus de excursão** que atendem a cidade do endereço de entrega (dia de saída, preço por tamanho, ponto de retirada);
  - **Transportadoras** que atendem a UF de destino (veículos, seguro, tabela ou "frete a combinar", nota de pontualidade);
  - **"Minha transportadora ou ônibus não está aqui"**: nome e WhatsApp, e nasce uma transportadora **indicada** (seção 5.3 e 7B), sem travar o pedido.
- Ordem dos cartões por critério público: atende o destino, data, preço, nota, "documentação em dia". Nunca por ser do grupo; a Starline leva o selo "empresa do grupo" (seção 3.4).
- A escolha vai junto com o pedido:
  - **ônibus:** reserva o espaço na viagem (fardos com tamanho estimado pelo produto, editável);
  - **transportadora:** chega à importadora como **transportadora sugerida pelo cliente** na tela "Chamar transportadora" (D111), já marcada. A importadora pode trocar, com aviso ao cliente.
- **Comparador** quando há os dois modos: "ônibus: sai quinta, chega sábado, R$ X" e "transportadora: 3 a 5 dias úteis, frete a combinar". O cliente escolhe sabendo a diferença.

### 6A.3 Telas do painel (alto nível)
- **Início:** fretes em andamento com a linha do tempo, a próxima saída de ônibus para a cidade dele e os atalhos **Novo frete**, **Rastrear** e **Indicar e ganhar pontos**.
- **Novo frete:** escolher as compras (pedidos da Brás, da Mega Tron ou "comprei em outra loja", com loja e nota), o modo (comparador) e pagar ou confirmar.
- **Rastreio:** linha do tempo com fotos, documentos (nota e comprovante) e o contato de quem está com a carga quando houver aceite.
- **Catálogo:** ônibus e transportadoras da região com filtros (cidade, dia, tamanho, seguro, documentação em dia, paga na chegada). Ali ficam também os favoritos e os indicados por ele.
- **Gastos:** frete por mês, por modo e por transportadora, e quanto os pontos já descontaram.
- **Pontos e indicações:** o painel gamificado (seção 7B.5).
- **Problemas:** abrir ocorrência num frete (atraso, avaria, falta), com foto. Segue para quem transporta e, se não resolver no prazo, para a equipe.
- Celular primeiro, sem rolagem horizontal em 360 px, com tudo em 2 toques a partir do início.

### 6A.4 Aceite
- Um cliente com um pedido levado por transportadora e um fardo levado por ônibus vê os dois no mesmo painel, com a mesma linha do tempo.
- No pedido de uma importadora qualquer, o cliente vê a Starline e as transportadoras que atendem o destino e escolhe uma. A importadora vê a escolha já marcada em "Chamar transportadora".
- "Minha transportadora não está aqui" cria a indicada, o pedido segue, e o convite fica pronto para o WhatsApp.
- Isolamento: o cliente só vê os próprios fretes; a transportadora sugerida não vê nada do pedido antes de ser chamada e aceitar (D111).

---

## 6B. Importadoras e transportadoras: as duas vias

O objetivo é que cada lado **traga o outro**, e os dois tragam clientes.

### 6B.1 Da importadora para a transportadora (já existe a base, D111)
- Chamar a transportadora, ver o aceite e acompanhar a coleta (D111).
- **Novo:** catálogo de transportadoras na importadora com os mesmos filtros do cliente; a sugestão do cliente aparece em primeiro.
- **Novo:** "coleta fixa": a importadora combina dias fixos com uma transportadora ou ônibus (por exemplo, "Starline passa toda quinta às 15h") e os pedidos daquele destino entram sozinhos na próxima coleta fixa, com confirmação.
- **Novo:** avaliar a transportadora depois da coleta (pontualidade e cuidado), que vira a nota pública do catálogo.

### 6B.2 Da transportadora para a importadora (novo)
- **Importadoras na rede:** a transportadora vê as importadoras do sistema com o endereço do galpão e o horário de retirada (dados públicos da ficha), e pede para entrar na **lista de preferidas** de uma importadora. A importadora aceita ou não.
- **Demanda agregada por importadora:** volumes por UF de destino nos últimos 30 dias, sem cliente e sem valores, para a transportadora oferecer rota e coleta fixa onde há movimento.
- **Trazer importadora:** a transportadora indica uma importadora que ela já atende fora do sistema (nome, contato, WhatsApp). O convite leva o link de cadastro da importadora (painel D110) e a indicação vale pontos (seção 7B).
- **Trazer cliente:** o ônibus e a transportadora convidam os clientes deles a acompanhar o frete pelo painel. Cada cliente que entra pelo convite é indicação dele.

### 6B.3 Conversa entre as duas
- Cada coleta (e cada fardo) tem uma conversa curta entre importadora e transportadora, presa à coleta. Estenda o canal de suporte existente (`bd_support_messages`, com o contexto da coleta); não crie outro chat.
- Mensagens prontas de um toque: "carga pronta", "chego em 30 min", "faltou volume", "nota anexada". Tudo fica registrado e aparece no histórico da coleta.
- Fronteira: na conversa, ninguém vê o que o próprio painel não mostra (a transportadora não vê comprador nem preço; a importadora não vê frete nem comissão).

### 6B.4 Aceite
- A transportadora pede para ser preferida de uma importadora, a importadora aceita, e a transportadora passa a aparecer em primeiro para ela.
- A coleta fixa junta sozinha os pedidos do destino e a importadora confirma.
- Os testes provam que a demanda agregada não traz cliente, valor nem pedido individual.
- A conversa fica presa à coleta e cada lado vê só a própria coleta.

---

## 7. Módulo C: Brás Digital Club (clube de benefícios)

### 7.1 Identidade única
- `club_members`: uma pessoa ou empresa no ecossistema, chave pelo **documento** (CPF ou CNPJ, só dígitos, único), com nome, WhatsApp, cidade e UF, nível, aceite dos termos do Club (versão e data) e consentimento para ligar contas.
- `club_member_accounts`: liga o membro às contas existentes (usuário da Brás, loja do SuperDrop ou da Commerce, conta `CLUB_MEMBER`, cliente da Mega Tron). **Só com aceite** e conferência do documento. Nenhuma marca passa a ver dado de outra: o Club guarda só o necessário (nível, saldo, histórico de benefícios).
- O lado empresa (lojas, importadoras e ônibus) também é membro do Club, como **parceiro que oferece benefício**.

### 7.2 A moeda: pontos do Club, não dinheiro
- **Pontos do Club** (inteiros), num razão append-only (`club_ledger`, mesmo padrão de `wallet_entries`: saldo em cache igual à soma dos lançamentos, conferido em teste). É **uma moeda só** para tudo: compra, frete, indicação, missão e campanha.
- **Valor do ponto no resgate** fica no Master, com versão (sugestão em rascunho: 100 pontos = R$ 1,00 de desconto). O resgate congela o valor do momento.
- Regras que mantêm os pontos longe de produto financeiro:
  - **não viram dinheiro**, não se sacam e não se transferem;
  - valem só como desconto dentro do ecossistema (frete, compra, plano, serviço como o Meu Contador);
  - **vencem** (sugestão: 12 meses, com aviso 30 dias antes);
  - cada lançamento tem origem (compra, frete, indicação, missão, campanha), empresa que concedeu e empresa que vai pagar o desconto.
- Pontos de indicação nascem **pendentes** e só ficam disponíveis quando a indicação se confirma (seção 7B.3).
- Sem sorteio nem "concurso" (exige autorização própria); só benefício direto `[CONFIRMAR jurídico]`.

### 7.3 Níveis (calculados pela atividade; os planos pagos dão impulso)

| Nível | Como chega (sugestão, rascunho) | Exemplo de vantagem |
|---|---|---|
| **Membro** | Cadastrou e aceitou os termos | Pontos de boas-vindas no primeiro frete |
| **Frequente** | 3 meses seguidos com compra ou frete | Mais pontos por fardo e por frete; prioridade na lista de espera |
| **VIP** | Gasto somado no grupo acima de R$ X em 90 dias, ou plano Ouro ou Platinum da Brás | Frete com desconto fixo, condições da Mega Tron, atendimento prioritário |

- Os limites e as vantagens ficam no Master. O nível é recalculado por job diário, com histórico.
- Os planos da Brás (Prata R$ 97, Ouro R$ 197, Platinum R$ 397, D108) **não são duplicados**: plano ativo conta como impulso de nível.

### 7.4 Motor de benefícios (no Master)
`club_benefits`, com versão (configurar não é publicar, Constituição seção 15):
- **Quem oferece:** empresa do grupo ou loja ou ônibus parceiro.
- **Para quem:** nível, tipo de cliente, região e marca de origem.
- **Gatilho:** compra numa empresa, fardo entregue, indicação, primeira viagem, aniversário de cadastro, campanha.
- **Recompensa:**
  - pontos (fixos ou proporcionais ao valor, com teto);
  - cupom gerado (`coupons` estendido);
  - concessão de acesso (`entitlements`, por exemplo 1 mês da análise da Brás);
  - fardo P grátis.
- **Quem paga o desconto (funding):** a empresa que oferece, ou o "caixa do Club" com rateio definido.
- **Limites:** por pessoa, por mês e orçamento total, com a campanha parando sozinha ao acabar.
- **Prévia** antes de publicar: quantas pessoas recebem e o custo estimado.

### 7.5 Benefícios cruzados do grupo (sugestões em rascunho)

| De → Para | Benefício sugerido | Por que funciona |
|---|---|---|
| Comprou na **Mega Tron** → frete **Starline** | A cada R$ X em compra, pontos que pagam 1 fardinho P | A compra puxa o frete, e o ônibus enche |
| Mandou fardos pela **Starline** → **Mega Tron** | Pontos por fardo entregue, usáveis na Mega Tron | O frete puxa a compra |
| **Passageiro** de excursão do Club → lojas participantes | Desconto na Mega Tron com o QR do Club no balcão | Ajuda o ônibus a vender poltrona e traz gente para a loja |
| **Guia de excursão** (parceiro) → pontos do Club | Percentual das compras dos passageiros dele nas lojas participantes, atribuído pelo QR | Formaliza a comissão de guia que já existe no Brás, com registro |
| Membro **Brás Digital** pago → frete e Mega Tron | Nível VIP automático no Platinum, Frequente no Ouro | Valoriza o plano sem criar outro plano |
| Lojista **SuperDrop** ou **Commerce** → frete Starline | Primeiro fardo com desconto | Traz o lojista online para o mundo do Brás |
| Ônibus indicado pelo lojista → quem indicou | Pontos quando o ônibus completa a primeira viagem | O lojista traz a oferta para a rede |

### 7.6 Cartão do Club e balcão
- **Cartão digital** com QR (identificador opaco, nunca o documento) no celular do membro.
- **Validar no balcão** (Mega Tron primeiro): a loja bipa o QR, vê nome, nível e as vantagens válidas e registra a compra (valor) para gerar os pontos. Duas formas:
  - o painel da loja ou da importadora, com login;
  - um link de balcão sem login (padrão D106), com limite de tentativas.
- Sem integração com o PDV no início: o registro é manual no balcão `[CONFIRMAR integração com o sistema da Mega Tron]`.

### 7.7 Acerto entre empresas
Quando um desconto é dado numa empresa e pago por outra:
- `club_settlements` fecha por mês, empresa a empresa, com o detalhe de cada lançamento;
- o Master mostra "a Mega Tron deve à Starline R$ X por descontos de frete pagos pela Mega Tron";
- o acerto é feito fora do sistema, por nota ou transferência, e marcado como acertado.

Por serem empresas do mesmo dono, o formato do acerto (nota de serviço de marketing, reembolso, rateio) depende do contador `[CONFIRMAR contador]`. O sistema só registra, não movimenta dinheiro.

### 7.8 Aceite
- O membro liga a conta da Brás e a conta do Club com aceite.
- Compra na Mega Tron registrada no balcão → pontos → usados como desconto no próximo frete.
- No fechamento do mês aparece o valor que uma empresa deve à outra.
- Os pontos vencem com aviso, e nada vira dinheiro.
- Testes com saldo igual à soma do razão, sem lançamento duplicado (idempotência), saldo nunca negativo e concorrência no uso dos pontos.

---

## 7A. Módulo E: Nota em dia (Nota Fácil, convite à loja e Meu Contador)

**Por que existe:** a carga só viaja regularizada. A falta de nota é o maior risco do ônibus (fiscalização na divisa) e o maior medo do lojista. Em vez de só bloquear, o sistema **resolve**: convida a loja para o emissor, ou aciona o contador em caráter de urgência. Cada caminho é uma receita e um motivo a mais para entrar no ecossistema.

### 7A.1 Regra do fardo
- O fardo só passa para **"no ônibus"** com a situação `COM_NOTA` ou `MEU_CONTADOR` resolvido. A regra fica no Master (`excursion.requireInvoice`, padrão ligado).
- O dono do ônibus vê em cada cartão de pedido o selo **"com nota"**, **"nota a caminho"** ou **"sem nota"**, e pode recusar com um toque.
- A chave da NF-e é conferida pelo dígito verificador (sem consultar a Sefaz nesta fase) e guardada só para o fardo; nenhum valor da nota aparece para o ônibus, só a chave e o emitente.

### 7A.2 Nota Fácil (emissor da Brás Digital)
- Para a **loja do Brás** (fornecedor, importadora ou qualquer loja que entra só para emitir): emitir NF-e a partir do pedido ou do fardo em poucos toques.
- **`[CONFIRMAR]` qual é o sistema emissor que a Brás Digital já usa.** Se for um provedor com API, o sistema integra por uma interface própria (`src/lib/fiscal/`), como as plataformas de envio (`src/lib/shipping/`): um provedor por adaptador, testado com provedor falso. Se ainda for um sistema à parte, a fase entrega o cadastro, a promoção e o link de acesso, e a integração entra depois.
- Configuração fiscal da loja: CNPJ, inscrição estadual, regime tributário, certificado digital A1 e senha. **Certificado e senha só com `encryptSecret`, nunca em tela, log ou e-mail.**
- A nota emitida volta para o fardo e para o pedido sozinha (chave, número, PDF e XML guardados), e o cliente recebe o PDF.
- **Promoção para novos lojistas** no catálogo Master (D90), família nova `FISCAL` ou dentro de `BRAS_SERVICE`, decidindo na E0:
  - por exemplo, X notas grátis ou N meses grátis para a loja que entra pelo convite de um cliente (valores do dono, em rascunho);
  - depois da promoção, plano mensal ou pacote de notas.

### 7A.3 Convite à loja (o cliente traz a loja)
1. No fardo "sem nota", o lojista toca em **"Pedir para a loja emitir a nota"**.
2. O sistema monta a mensagem de WhatsApp para a loja, com o link de cadastro no Nota Fácil e a promoção de novos lojistas: *"Emita a nota deste pedido em 2 minutos, com notas grátis no primeiro mês."*
3. A loja se cadastra pelo link (atribuído ao cliente que convidou e ao fardo), emite a nota e o fardo vira `COM_NOTA`.
4. **Benefício para os dois (Club):**
   - o cliente que convidou ganha pontos quando a loja emite a primeira nota (indicação do tipo cliente → loja, seção 7B);
   - a loja ganha o selo **"Nota em dia"** no catálogo e no Club;
   - pedidos "entregar no ônibus" com loja "Nota em dia" ganham prioridade de coleta.
5. A mesma loja convidada por vários clientes conta uma vez para cada um (cada convite é dele), e os pontos só saem uma vez por loja por cliente.

### 7A.4 Função emergencial "Meu Contador"
**Para quem:** o cliente, a loja ou o dono do ônibus que se deparou com uma situação urgente e está sem nota.

**Como funciona:**
1. No fardo (ou no painel), o botão **"Resolver agora com o Meu Contador"** abre um chamado urgente com:
   - o fardo, a loja e o que foi comprado (descrição e valor aproximado);
   - quem precisa da nota;
   - o horário da saída do ônibus, que define a urgência.
2. Mostra o **preço do serviço** e o **prazo em horas**, ambos no Master, em rascunho até o dono definir, e cobra pelo gateway do Financeiro Master (D90). O pagamento vale só depois de conferido na API.
3. Assim que é pago, o chamado entra na **fila da equipe contábil** (Master, área "Meu Contador"), com contagem regressiva até a saída do ônibus.
4. O contador conversa pelo canal de suporte que já existe (estenda `bd_support_messages`; não crie outro chat) e resolve pelo caminho correto. Por exemplo:
   - a loja emite a nota pelo Nota Fácil, com ajuda;
   - nota avulsa na Sefaz quando couber.
   O sistema **não emite nota por quem não é o vendedor** nem "ajeita" documento: ele organiza, acelera e registra.
5. Resolvido, a chave da nota entra no fardo, que vira `COM_NOTA`, e todos são avisados.
6. Se não der tempo, o chamado registra o motivo e o fardo fica para a próxima viagem, **sem custo extra de remarcação** (regra no Master).

**Quem atende:** contador ou escritório com registro no CRC, da equipe ou parceiro `[CONFIRMAR quem atende e o horário de atendimento]`. Ele entra com papel próprio de equipe (acesso só à fila do Meu Contador, auditado).

**Indicadores no Master:**
- chamados abertos, em andamento e resolvidos;
- tempo médio até resolver e porcentagem resolvida antes da saída do ônibus;
- receita do serviço;
- lojas que viraram clientes do Nota Fácil depois de um chamado (o Meu Contador também é porta de entrada do emissor).

### 7A.5 Aceite
- O fardo sem nota não vira "no ônibus"; com a chave válida, vira.
- Chave de NF-e com dígito errado é recusada com mensagem clara.
- O convite à loja gera o link atribuído; a loja cadastra e emite (provedor falso no teste); o fardo vira `COM_NOTA` e os pontos do Club saem uma vez.
- O Meu Contador cobra só depois do pagamento conferido, entra na fila com contagem regressiva, o contador resolve e o fardo é liberado. O contador não vê nada além do chamado.
- O certificado A1 nunca aparece em resposta, log ou e-mail (teste procura o conteúdo na saída).

---

## 7B. Módulo F: Indicações em rede e pontos (painel gamificado)

### 7B.1 Um sistema de indicação só
- **Todo mundo indica todo mundo**, pelo mesmo motor, ligado ao Club. Cada membro do Club (pessoa ou empresa) tem **um código e um link de convite** (`/c/<código>`), que funcionam em qualquer marca, e convites prontos por tipo.
- `club_referrals` registra cada indicação:
  - quem indicou;
  - o tipo do indicado: `CLIENTE`, `IMPORTADORA`, `TRANSPORTADORA`, `ONIBUS`, `LOJA` (Nota Fácil) ou `GUIA`;
  - o contexto (fardo, pedido, coleta);
  - o documento e o WhatsApp do indicado, para conferir duplicidade;
  - a situação, por etapa: `CONVIDADO`, `CADASTROU`, `ATIVOU`, `RECORRENTE`, `RECUSADA` ou `EXPIRADA`.
- Os convites que já aparecem neste prompt são **casos do mesmo motor**, não sistemas separados:
  - ônibus indicado pelo lojista (5.3);
  - transportadora "não está aqui" (6A.2);
  - convite à loja para a nota (7A.3);
  - importadora indicada pela transportadora (6B.2);
  - guia de excursão (7.5).

### 7B.2 Quem indica quem (as vias que trazem gente nova)

| Quem indica | Indica | Quando confirma (ativou) | Pontos sugeridos (rascunho) |
|---|---|---|---|
| Cliente | Cliente | Primeiro pedido ou frete pago | 500 |
| Cliente | Ônibus ou transportadora | Primeira viagem ou coleta concluída pelo sistema | 1.000 |
| Cliente | Loja (Nota Fácil) | Primeira nota emitida | 500 |
| Cliente | Importadora | Primeiro pedido pago na importadora | 2.000 |
| Importadora | Transportadora | Primeira coleta concluída | 1.000 |
| Importadora | Cliente | Primeiro pedido pago | 500 |
| Transportadora ou ônibus | Importadora | Primeiro pedido pago na importadora | 2.000 |
| Transportadora ou ônibus | Cliente | Primeiro frete concluído | 500 |
| Guia de excursão | Passageiro | Primeira compra registrada numa loja participante | 300 |

- Tudo editável no Master (tabela de recompensas por tipo, com versão).
- **Etapa extra "recorrente":** bônus quando o indicado completa a terceira compra ou o terceiro frete em 90 dias (sugestão: metade dos pontos da ativação). Premia trazer gente que fica.

### 7B.3 Antifraude (pontos só por gente de verdade)
- Os pontos nascem **pendentes** no convite e ficam **disponíveis só na ativação**, que é sempre um evento real e pago (pedido pago conferido, coleta ou viagem concluída, nota emitida).
- Mesmo documento (CPF ou CNPJ) ou mesmo WhatsApp não vira duas indicações; a primeira indicação válida é a que vale.
- Não se indica a si mesmo, nem uma empresa em que se é sócio ou usuário.
- Teto de pontos por mês por pessoa (sugestão 20.000, no Master); acima disso, a indicação vai para revisão do Master.
- Estorno: pedido estornado ou cancelado devolve os pontos daquela ativação (lançamento de estorno, nunca apagar).
- Sinais de abuso (muitos cadastros do mesmo aparelho ou endereço, indicações que nunca ativam) vão para uma fila de revisão no Master.

### 7B.4 Uma indicação, um dono (ligação com o Programa de Parceiros)
- O Programa de Parceiros (D90, comissão em dinheiro, links `/r/`) continua para quem indica **profissionalmente**. O Club (pontos, links `/c/`) é para **todo mundo**.
- Regra única de atribuição: cada conta ou empresa nova tem **um dono de indicação**, o primeiro link válido.
  - Se o dono for parceiro, vale a comissão do parceiro.
  - Se for membro do Club, valem os pontos.
  - **Nunca os dois pela mesma indicação.** O parceiro que também é membro do Club escolhe, no painel dele, se as indicações dele rendem comissão ou pontos.
- A atribuição usa o mesmo mecanismo de origem que já existe (cookie e link de atribuição); não crie outro rastreio.

### 7B.5 Painel gamificado "Indique e ganhe"
Aparece igual em todos os painéis (cliente, importadora, transportadora, ônibus, loja), como capacidade compartilhada:
- **Saldo de pontos** (disponíveis, pendentes e a vencer) e **quanto isso vale em desconto** hoje.
- **Meus convites:** link, QR e mensagens prontas para WhatsApp por tipo ("convidar meu ônibus", "convidar uma importadora", "convidar um cliente").
- **Funil das minhas indicações:** convidado → cadastrou → ativou → recorrente, com o nome e a etapa de cada indicado (só o nome e a etapa, nada mais) e um lembrete de um toque para quem parou.
- **Missões da semana e do mês** (no Master), por exemplo:
  - "Traga 1 transportadora: +1.000";
  - "Seu primeiro frete por ônibus: +300";
  - "3 fretes no mês: +500".
  A recompensa sai quando a meta é atingida, nunca por sorteio.
- **Níveis do Club** (Membro, Frequente e VIP, seção 7.3) com a barra do que falta para o próximo; indicações confirmadas também contam para subir.
- **Conquistas (selos):** "Primeira indicação", "Trouxe uma importadora", "Rede de 10", "Trouxe o meu ônibus".
- **Ranking do mês** por cidade ou estado, **só para quem aceitar aparecer**: primeiro nome e cidade, sem documento. O ranking mostra posição; a recompensa é sempre a meta (seção 12).
- **Usar pontos:** no pagamento do frete, do pedido, do plano ou do Meu Contador, com "usar X pontos = R$ Y de desconto" e o limite por compra do Master (sugestão: até 30% do valor).

### 7B.6 Quem paga o desconto dos pontos
- **Pontos de indicação** são custo de aquisição da NextLevel, pagos pelo "caixa do Club".
- **Pontos de compra** são pagos pela empresa onde a compra aconteceu.
- Quando o ponto é usado numa empresa diferente da que o pagou, entra no acerto entre empresas (seção 7.7).
- O Master mostra o **custo por indicado ativado** por tipo, para o dono ajustar a tabela de pontos.

### 7B.7 Aceite
- Um cliente convida o ônibus que já usa: os pontos ficam pendentes; o ônibus assume o perfil e conclui a primeira viagem; os pontos ficam disponíveis e o cliente usa no frete seguinte.
- Uma transportadora indica uma importadora; a importadora entra pelo link, tem o primeiro pedido pago e a transportadora ganha os pontos.
- O mesmo CNPJ indicado por dois membros conta só para o primeiro.
- Um estorno devolve os pontos.
- Um parceiro com link `/r/` e um membro com link `/c/`: só o primeiro link válido leva, e nunca os dois.
- O teto mensal manda o excesso para revisão.
- O painel aparece igual nos papéis cliente, importadora e transportadora.

---

## 8. Módulo D: Master (tudo editável)
- **Excursão:**
  - ônibus (verificados e indicados), rotas, viagens e fardos;
  - o mapa de demanda por cidade, agregado: pedidos sem ônibus, buscas sem resultado e indicações;
  - a taxa da plataforma a faturar.
- **Regras** (grupo `excursion` em `bras.v2_rules`, ou chave própria `cargas.excursion_rules` com versão):
  - tamanhos e equivalências;
  - a taxa da plataforma, nos modos "valor por volume" (sugestão R$ 1,50 por fardo, rascunho) ou "percentual do frete";
  - limite de cargas do plano grátis;
  - prazo de cancelamento padrão.
- **Club:**
  - membros, níveis e limites;
  - benefícios (criar, prévia, publicar, pausar);
  - razão por membro (só leitura; ajuste manual com motivo e auditoria);
  - acerto entre empresas;
  - termos do Club.
- **Indicações e pontos:**
  - tabela de pontos por tipo de indicação e etapa;
  - valor do ponto, teto mensal, limite de uso por compra e vencimento;
  - missões e conquistas;
  - fila de revisão antifraude;
  - funil geral (convidados, cadastrados, ativados, recorrentes) e custo por indicado ativado.
- **Frete:** todos os fretes (ônibus e transportadora) no mesmo quadro, ocorrências abertas, coletas fixas e preferidas por importadora.
- **Nota em dia:**
  - lojas do Nota Fácil e situação da configuração fiscal;
  - promoção de novos lojistas (catálogo Master);
  - fila do **Meu Contador** com contagem regressiva, preço e prazo do serviço;
  - indicadores da seção 7A.4;
  - autorizações das transportadoras a conferir e a vencer.
- **Empresas do grupo:** cadastro com dados jurídicos (Starline, Mega Tron, NextLevel). Elas aparecem como emissoras de benefício e partes do acerto.
  - Proposta: `organizations` com marca "empresa do grupo", mais os dados jurídicos. Valide contra o que existe antes de criar tabela.
- **Planos** no catálogo Master (D90), famílias já existentes: `CARRIER_PLAN` para o ônibus e uma família nova `CLUB_PLAN` só se o dono decidir por um Club pago (seção 13).

---

## 9. Modelo de dados proposto (aditivo; valide contra o que existe)

| Tabela | Dono | Observação |
|---|---|---|
| `tr_carriers` (+ `operation`, `claimStatus`, `referredByClubMemberId`, `mpAccessTokenEnc`) | Cargas | Estende D111 |
| `tr_routes`, `tr_trips` | Cargas | Rota fixa e viagem com capacidade |
| `tr_parcels`, `tr_parcel_events` | Cargas | Fardo com código em hash, preço e taxa congelados, fotos |
| `club_members`, `club_member_accounts` | Club | Identidade por documento, ligação com aceite |
| `club_ledger` | Club | Razão append-only dos pontos (pendente, disponível, usado, vencido, estornado) |
| `club_benefits` (+ versões) | Club | Motor de benefícios |
| `club_redemptions` | Club | Uso dos pontos ou do benefício (desconto, cupom ou concessão), valor do ponto congelado, idempotente |
| `club_settlements` | Club | Acerto mensal entre empresas |
| `partners.kind` + `GUIA_EXCURSAO` | Parceiros | Guia de excursão, sem tabela nova |
| `coupons` (+ `kind`, `clubBenefitId`) | Cupons | Resgate do Club gera cupom |
| `tr_shipments` (+ eventos) | Frete | Envelope único do cliente para ônibus e transportadora, com situação unificada |
| `tr_carrier_preferences` | Frete | Transportadora preferida de uma importadora e coleta fixa (dias e horário) |
| `club_referrals` | Club | Motor único de indicações (tipos, etapas, contexto, antifraude) |
| `club_missions`, `club_badges` (+ conquistas do membro) | Club | Missões, conquistas e progresso do painel gamificado |
| `tr_carrier_documents` | Cargas | Autorizações do ônibus com validade e conferência do Master |
| `fiscal_issuers` | Nota Fácil | Configuração fiscal da loja; certificado e senha com `encryptSecret` |
| `fiscal_documents` | Nota Fácil | Nota emitida ou informada (chave, número, PDF, XML), ligada ao pedido e ao fardo |
| `fiscal_invites` | Nota Fácil | Convite cliente → loja, atribuído ao fardo (é um `club_referrals` do tipo LOJA com o fardo como contexto; não duplique) |
| `accounting_tickets` | Meu Contador | Chamado urgente: fardo, prazo (saída do ônibus), preço, pagamento, responsável, situação; a conversa usa o suporte existente |

---

## 10. Marcas, endereços e páginas
- **Excursão** fica dentro da **NextLevel Cargas**, no endereço que já está no ar: `cargas.nextlevelgroup.com.br`. A página pública ganha a seção "Ônibus de excursão: receba cargas organizadas" e o cadastro do dono do ônibus.
- **Brás Digital Club** é uma marca nova (`BRAS_CLUB` em `brand.ts`), com cor e logo próprias, entrando pelo processo das marcas (DS e BS). Endereço sugerido: `club.nextlevelgroup.com.br` `[CONFIRMAR]`. Até o dono criar o endereço, o Club roda dentro da Brás Digital, em `/club`.
- **Páginas públicas** (skill `pagina-de-vendas`, só com ativos reais):
  - "Seu ônibus de confiança traz o Brás até você" (lojista);
  - "Encha o bagageiro antes de sair de São Paulo" (dono do ônibus);
  - "Brás Digital Club: o que você compra aqui vale desconto ali" (Club).
- **Ativos:** fotos reais dos ônibus da Starline, do ponto de embarque no Brás, de fardos etiquetados e do balcão da Mega Tron. Liste o manifesto e peça ao dono; não use imagem genérica.

---

## 11. Segurança, privacidade e auditoria
- Código do fardo, link do ajudante e QR do Club: valor aleatório, **só o hash no banco**, com limite de tentativas.
- Documento (CPF ou CNPJ) nunca aparece no QR, na URL nem para lojas e ônibus.
- Token do Mercado Pago do dono do ônibus só com `encryptSecret`, nunca em tela, log ou e-mail.
- Tudo que mexe em dinheiro ou pontos entra na auditoria: aceite, preço congelado, uso de pontos, ajuste manual e acerto.
- LGPD:
  - o Club guarda o mínimo;
  - ligar contas exige aceite;
  - o membro pode ver e baixar os próprios dados e pedir a exclusão (pontos vencidos ou não usados se perdem, conforme os termos);
  - o mapa de demanda é agregado (nenhuma cidade com menos de N pedidos aparece identificada).

---

## 12. Riscos jurídicos, fiscais e regulatórios (revisão antes de ligar a cobrança)

| Item | Risco | O que fazer |
|---|---|---|
| Ônibus levando mercadoria de terceiros | Cada ônibus precisa da autorização própria para carga | **Starline: resolvido pelo dono** (tem as autorizações). Para os outros ônibus, o selo "documentação em dia" só com autorização verificada e válida (seção 5.6); o sistema não promete regularidade de quem não comprovou |
| Mercadoria sem nota | Fiscalização de ICMS nas divisas | Fardo só vai "no ônibus" com nota ou com o Meu Contador resolvido (seção 7A.1) |
| Nota do frete | Frete cobrado por empresa pode exigir documento fiscal do serviço (CT-e) | `[CONFIRMAR contador]` como a Starline emite o documento do frete; o fardo guarda a referência |
| Meu Contador | O serviço contábil precisa de profissional com registro no CRC; o sistema não pode emitir nota em nome de quem não é o vendedor | Atendimento por contador registrado; o sistema organiza e registra, não emite por terceiros (seção 7A.4) |
| Certificado digital A1 da loja | Vazamento permite emitir nota em nome da loja | Só com `encryptSecret`, nunca exposto, acesso auditado (seção 7A.2) |
| Pontos do Club | Ponto que vira dinheiro ou se transfere pode ser tratado como arranjo de pagamento | Pontos não sacáveis, não transferíveis, com vencimento e só como desconto (seção 7.2) |
| Ranking e premiação | Prêmio por sorteio ou concurso exige autorização | Ranking só mostra posição; a recompensa é sempre por meta atingida (pontos por indicação confirmada), nunca por sorteio |
| Benefícios entre empresas do mesmo dono | Tratamento fiscal do desconto pago por outra empresa | O sistema só registra o acerto (seção 7.7); a forma é do contador |
| Promoções | Sorteio e concurso exigem autorização | Só benefício direto |
| Termos do Club e da Excursão | Código do Consumidor: regras claras, aviso de vencimento, mudança com antecedência | Textos simulados e editáveis no Master (como D108), revisados pelo advogado antes de publicar |
| Responsabilidade por perda | O dono do ônibus responde pelo transporte; a plataforma intermedeia | Termos deixam o papel de cada um claro; a "proteção" no início é processo e prova (seção 6.5) |

---

## 13. Perguntas ao dono (siga com o padrão sugerido; registre)

| # | Pergunta | Padrão sugerido se não houver resposta |
|---|---|---|
| 1 | Preço P, M e G da Starline na primeira rota, e qual a rota | Cadastrar uma rota de exemplo em rascunho e o dono preenche |
| 2 | Taxa da plataforma por fardo (valor fixo ou %) | R$ 1,50 por fardo, rascunho, só cobrada depois da revisão da seção 12 |
| 3 | Capacidade do bagageiro em fardinhos equivalentes | 120, editável por viagem |
| 4 | Club pago (assinatura própria) ou só gratuito com níveis | Só gratuito com níveis; os planos da Brás dão impulso |
| 5 | Validade dos pontos e valor do ponto | 12 meses, aviso 30 dias antes; 100 pontos = R$ 1,00 |
| 6 | Quem paga cada benefício cruzado (quem oferece ou rateio) | Quem oferece paga |
| 7 | Endereço do Club | `/club` dentro da Brás até haver domínio |
| 8 | Mega Tron entra como importadora da Brás, fornecedor do SuperDrop ou os dois | Os dois, com o selo "empresa do grupo" |
| 9 | Guia de excursão: pontos sobre as compras dos passageiros | 2% do valor em pontos, rascunho |
| 10 | Qual é o sistema emissor do Nota Fácil (provedor e acesso à API) | Cadastro, promoção e link na primeira entrega; integração quando houver o acesso |
| 11 | Promoção de novos lojistas do Nota Fácil (o que ganha e por quanto tempo) | 30 notas grátis no primeiro mês, rascunho |
| 12 | Meu Contador: preço, prazo em horas e horário de atendimento | Preço em rascunho, prazo de 4 horas, atendimento de segunda a sábado das 8h às 20h |
| 13 | Quem atende o Meu Contador (equipe própria ou escritório parceiro) | Escritório parceiro com registro no CRC, acesso só à fila |
| 14 | Números e validade das autorizações da Starline | Cadastrar na E0 com os documentos que o dono enviar |
| 15 | Tabela de pontos por indicação (seção 7B.2) | Os valores sugeridos, em rascunho |
| 16 | Limite de uso de pontos por compra | Até 30% do valor |
| 17 | Ranking público por cidade | Ligado, só para quem aceitar aparecer |
| 18 | Parceiro que também é membro do Club: comissão ou pontos | Ele escolhe no painel; o padrão é comissão |

---

## 14. Fases de entrega (ordem recomendada)

| Fase | Entrega | Depende de |
|---|---|---|
| **E0** | Decisões (D112+), modalidade `ONIBUS_EXCURSAO`, `operation`, cadastro da **Starline** como primeira transportadora (excursão) com as autorizações dela, regras `excursion` no Master, empresas do grupo cadastradas | — |
| **E1** | **Catálogo de transportadoras no pedido de qualquer importadora** (seção 6A.2), envelope `tr_shipments` com a situação unificada, painel de frete do cliente v1 com as coletas por transportadora (D111), sugestão do cliente chegando em "Chamar transportadora" | E0 |
| **E2** | Excursão: rotas, viagens e fardos; painel do dono do ônibus em modo app; link do ajudante; etiqueta com QR | E0 |
| **E3** | Painel de frete completo (ônibus e transportadora juntos, comparador, catálogo, gastos, ocorrências), "entregar no ônibus" e balcão da loja | E1, E2 |
| **E4** | **Club base e indicações:** identidade, pontos (razão), motor único de indicações com antifraude, regra "uma indicação, um dono", painel gamificado (convites, funil, missões, níveis, conquistas, uso de pontos) em todos os papéis | E1 |
| **E5** | Nota em dia: nota no fardo, convite à loja (pelo motor de indicações), Meu Contador, autorizações com selo | E3, E4 |
| **E6** | As duas vias: preferidas, coleta fixa, demanda agregada, "trazer importadora", conversa presa à coleta, avaliação | E1, E4 |
| **E7** | Pagamento do frete por Pix na conta do dono do ônibus ou da transportadora (MP conferido, idempotente), pontos como desconto no pagamento, fatura mensal da taxa | E3, E4 |
| **E8** | Nota Fácil integrado e promoção de novos lojistas; motor de benefícios, benefícios cruzados do grupo, guia de excursão, cartão QR no balcão, acerto entre empresas | E5, E7 e o acesso ao emissor (pergunta 10) |
| **E9** | Mapa de demanda, ranking por cidade, páginas públicas (Club, Excursão, Nota Fácil e "Indique e ganhe") com ativos reais, relatório final | E1 a E8 |

---

## 15. Critérios de aceite gerais (toda fase)
- `npx tsc --noEmit`, `npx eslint src e2e tests`, `npx vitest run` e `npm run build` limpos.
- Página com banco: `export const dynamic = "force-dynamic"`.
- Valores em centavos; preço e taxa congelados onde a regra diz.
- Isolamento testado entre ônibus, entre lojistas e entre lojas; o Club nunca vaza dado de uma marca para outra.
- Acessibilidade AA (`axe` sem violação grave), sem rolagem horizontal em 360 px e o modo app testado em 360 px.
- Textos em português claro, sem promessa de ganho e sem "garantido" ou "seguro" antes da seção 6.5 permitir.
- SuperDrop, Commerce e Brás sem mudança de comportamento fora do escopo, com teste.

---

## 16. Banco de copy (forte e verdadeira)
- Lojista: **"Compre do Brás de onde você está. Seu ônibus de confiança traz."**
- Lojista: **"Seu fardo com foto em cada etapa: na loja, no ônibus e na sua cidade."**
- Lojista: **"Seu ônibus não está aqui? Cadastre em 1 minuto e continue usando o mesmo."**
- Dono do ônibus: **"Encha o bagageiro antes de sair de São Paulo."**
- Dono do ônibus: **"Frete pago no Pix antes da viagem. Chega de cobrar na chegada."**
- Dono do ônibus: **"Fardinho é lucro: tabela por tamanho, sem pechincha."**
- Club: **"O que você compra aqui vira desconto ali."**
- Club: **"Comprou na Mega Tron, ganhou pontos para o frete. Mandou pelo ônibus, ganhou pontos para a próxima compra."**
- Indicações: **"Trouxe uma importadora, um ônibus ou um lojista? Seus pontos viram desconto."**
- Indicações: **"Seu ônibus de sempre ainda não está aqui? Indique e ganhe pontos quando ele fizer a primeira viagem."**
- Loja: **"Seu cliente está esperando a nota. Emita em 2 minutos, com notas grátis no primeiro mês."**
- Lojista: **"Ficou sem nota? O Meu Contador resolve em algumas horas, antes do ônibus sair."** (só com o prazo real do Master)
- Proibido: "frete grátis para sempre", "lucre R$ X", "carga garantida", número de clientes que não existe.

---

## 17. Relatório de cada fase (`docs/relatorios/CLUB-FASE-N.md`)
Mesmo formato da Brás v2:
- "Em 5 linhas (para o dono)";
- entregue (função, para quem, onde);
- ficou para depois e por quê;
- o que depende do dono;
- verificação;
- riscos e dívidas;
- próxima fase.
