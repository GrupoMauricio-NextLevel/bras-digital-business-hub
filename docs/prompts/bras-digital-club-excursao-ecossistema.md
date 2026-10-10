# BRÁS DIGITAL CLUB + CARGAS EXCURSÃO — PROMPT MESTRE DE ENGENHARIA
## Ônibus de excursão como rede de frete do Brás, painel "tipo app" para o dono do ônibus, catálogo de ônibus para o lojista do Brasil inteiro e um clube de benefícios que liga as empresas do grupo

> **Pedido do dono (2026-10-10, resumo fiel):**
> - **Primeira transportadora:** Starline Viagens e Turismo Ltda - ME (nome fantasia **Mauricio Turismo**), CNPJ **47.173.173/0001-75** (dígitos conferidos). Fundada em 15/07/2022, sede em São Paulo/SP, atividade principal hoje: agência de viagens. Modalidade: **ônibus de excursão**.
> - **A frente:** todo dia centenas de ônibus de excursão chegam ao Brás, vindos do Brasil inteiro, com lojistas e sacoleiras. Muita gente **não precisa mais viajar**: já conhece as lojas certas e só manda a mercadoria pelo ônibus. Foco específico nos ônibus de excursão.
> - **Dono da excursão:** painel didático e organizado, **prático como um app de corrida** para receber pedidos de carga.
> - **Lojista do Brasil inteiro:** painel para ver o **catálogo de ônibus da região dele** e fazer pedidos de carga. Se o ônibus que ele já usa não estiver lá, ele **cadastra com 1 clique** (nome e contato do responsável). Ele precisa de um **motivo para usar o sistema**; talvez o maior seja o próprio ecossistema.
> - **Carga:** 80% dos pedidos são **fardinhos pequenos e fardos médios**. O ônibus não quer carga grande: **quanto menor o fardo, maior o lucro** no mesmo espaço.
> - **Grupo do Mauricio:** Starline Viagens e Turismo (transporte de carga e ônibus de excursão), Mega Tron Comércio Eletrônico Ltda (atacado, distribuidor e importador), NextLevel Marketing Ltda (todas as marcas e sistemas). Cliente de uma empresa deve ter **benefício e desconto ao usar a outra**.
> - **Novo sistema:** um **clube de benefícios** para fornecedores e clientes, muito bem estruturado: **Brás Digital Club**.
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
- Ligar a cobrança do frete, a taxa da plataforma ou o crédito do Club em produção antes da **revisão jurídica e contábil** da seção 12.
- Criar domínio, mexer em DNS ou ligar chave de produção.
- Mudar o comportamento do SuperDrop, da Commerce ou da Brás (em produção) sem teste.
- Guardar dinheiro de terceiros (frete, crédito) numa conta da NextLevel.
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
| **Guia de excursão** | Quem traz passageiros ao Brás | Crédito do Club pelas compras dos passageiros nas lojas participantes (formaliza a comissão de guia que já existe no Brás) | Fluxo de compradores nas lojas do grupo |
| **NextLevel (dono)** | Master | Uma rede onde cada lado puxa o outro, e o mapa da demanda do país | Todas as linhas acima, configuráveis no Master |

### 1.3 O volante
1. O lojista do interior acha no catálogo o ônibus da cidade dele e reserva espaço.
2. Ele compra da Mega Tron ou de uma importadora da Brás e escolhe **"entregar no ônibus"**.
3. A loja etiqueta o fardo; o ônibus coleta e leva; o lojista retira com o código.
4. Cada passo gera crédito do Club, que dá desconto na próxima compra ou no próximo frete.
5. A demanda por cidade aparece no Master: **onde vale abrir uma rota nova da Starline**.
6. Mais rotas trazem mais lojistas, mais compras e mais cargas.

### 1.4 Empresas do grupo e marcas (não confunda)
- **Empresa** é quem fatura e responde juridicamente: Starline, Mega Tron, NextLevel.
- **Marca** é o produto no sistema: NextLevel Cargas, Brás Digital, Brás Digital Club, SuperDrop, NextLevel Commerce.
- A **Starline** é uma *transportadora* dentro da NextLevel Cargas, igual a qualquer outra.
- A **Mega Tron** é uma *loja ou importadora* (fornecedor) dentro da Brás Digital e do SuperDrop, igual a qualquer outra.
- O **Club** é uma *camada* sobre todas as marcas, não um sistema separado.
- Mesmo repositório, deploy, banco e Master (regra anti-duplicação do `CLAUDE.md`).

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
- **"O meu ônibus não está aqui":** um toque abre o cadastro com nome do responsável, WhatsApp, cidade e nome da excursão. O ônibus aparece para ele na hora como **"indicado por você"**, ainda sem verificação, e o responsável recebe o convite pelo WhatsApp para assumir o perfil (seção 5.3). Cada ônibus indicado que entra dá crédito do Club a quem indicou.
- **Reserva antes de comprar:** ele reserva o espaço na viagem e recebe o código do fardo. Na loja (ou no checkout online da Mega Tron e da Brás Digital) escolhe **"entregar no ônibus"** e informa o código.
- **Rastreio simples:** reservado → pronto na loja → coletado → no ônibus → saiu de São Paulo → chegou → retirado. Com foto do fardo e aviso no WhatsApp ou por e-mail.
- **Um lugar para tudo:** compras de várias lojas num só pedido de frete, com o total de volumes, e o histórico do mês.
- **Club:** cada fardo enviado dá crédito; cada compra na Mega Tron dá crédito; o crédito vira desconto no frete e nas compras. No ecossistema, quem centraliza paga menos.
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
| Parceiros, atribuição, comissão versionada | `partners` (`PARTNER_KINDS`), `commission_rules` (D90) | **Guia de excursão** como novo `kind` de parceiro (nada de tabela nova de guias) |
| Cupons | `coupons` | O resgate do Club gera cupom (estenda com tipo e origem; não crie outro sistema de cupom) |
| Carteira com razão (saldo = soma dos lançamentos) | `wallet_accounts`, `wallet_entries` | **Padrão** para o razão do Club (append-only, saldo em cache conferido em teste), em tabela própria porque a carteira é da loja e o crédito do Club é da pessoa |
| Concessões (`entitlements`) | `entitlements` | Vantagens de acesso do Club (ex.: 1 mês da análise da Brás) |
| E-mail, avisos, jobs, erros | `src/lib/email.ts`, `avisos.ts`, `job_runs` | Avisos de status, vencimento de crédito, fechamento mensal entre empresas |
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
5. Quem indicou ganha crédito do Club quando o ônibus completa a primeira viagem pelo sistema (regra no Master).

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

---

## 6. Módulo B: Frete para o lojista (catálogo de ônibus e pedidos)

### 6.1 Quem é o lojista no sistema
- A **conta do Club** é a conta universal do comprador (papel novo `CLUB_MEMBER`), aceita CPF, MEI ou CNPJ e é ligada pelo documento à identidade do Club (seção 7.1).
- Quem já é membro da Brás (CNPJ, D91), lojista do SuperDrop ou da Commerce **não cria outra conta**: liga a conta existente ao Club com aceite e usa o frete pela área dela.
- `[CONFIRMAR]` endereço: área `/club` no endereço do Club (seção 10).

### 6.2 Telas
- **Achar ônibus:**
  - cidade e UF (com cidades próximas), mais data;
  - lista de cartões com ônibus, dias, preço P, M e G, ponto de retirada, nota e fardos entregues;
  - filtro "paga na chegada aceito";
  - selos "empresa do grupo" e "patrocinado" onde couber (seção 3.4).
- **Reservar:** escolher a viagem, quantos P, M e G, a(s) loja(s) de coleta e quem retira. Mostra o total na hora e paga por Pix (seção 6.4). Gera o código de cada fardo e o texto para mandar à loja ("entregue no ônibus X, viagem do dia D, fardo código C").
- **Meus fardos:** a linha do tempo de cada fardo, com fotos.
- **Meus ônibus:** os ônibus que ele usa, os indicados por ele e o botão **"O meu ônibus não está aqui"**.
- **Club:** o saldo de crédito, o nível e as vantagens disponíveis (seção 7).

### 6.3 Loja do Brás: "entregar no ônibus"
- No pedido da Brás Digital (importadora) e no da Mega Tron, nova forma de entrega: **"Ônibus de excursão"**, com o código do fardo ou a escolha da viagem. O pedido passa a mostrar a etiqueta do fardo para imprimir.
- **Balcão da loja** (padrão D106, link sem login, ou o painel da importadora, D110): "pronto para coletar" e "entregue ao ajudante", com bipe e foto.
- A loja vê só o necessário (código, tamanho, ônibus, ponto de embarque), nunca o telefone do lojista. Mesma fronteira de D92 e D111.

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

## 7. Módulo C: Brás Digital Club (clube de benefícios)

### 7.1 Identidade única
- `club_members`: uma pessoa ou empresa no ecossistema, chave pelo **documento** (CPF ou CNPJ, só dígitos, único), com nome, WhatsApp, cidade e UF, nível, aceite dos termos do Club (versão e data) e consentimento para ligar contas.
- `club_member_accounts`: liga o membro às contas existentes (usuário da Brás, loja do SuperDrop ou da Commerce, conta `CLUB_MEMBER`, cliente da Mega Tron). **Só com aceite** e conferência do documento. Nenhuma marca passa a ver dado de outra: o Club guarda só o necessário (nível, saldo, histórico de benefícios).
- O lado empresa (lojas, importadoras e ônibus) também é membro do Club, como **parceiro que oferece benefício**.

### 7.2 A moeda: crédito do Club, não dinheiro
- **Crédito do Club** em centavos, num razão append-only (`club_ledger`, mesmo padrão de `wallet_entries`: saldo em cache igual à soma dos lançamentos, conferido em teste).
- Regras que mantêm o crédito longe de produto financeiro:
  - **não vira dinheiro**, não se saca e não se transfere;
  - vale só como desconto dentro do ecossistema;
  - **vence** (sugestão: 90 dias, com aviso 7 dias antes);
  - cada lançamento tem origem (compra, frete, indicação, campanha), empresa que concedeu e empresa que vai pagar o desconto.
- Sem sorteio nem "concurso" (exige autorização própria); só benefício direto `[CONFIRMAR jurídico]`.

### 7.3 Níveis (calculados pela atividade; os planos pagos dão impulso)

| Nível | Como chega (sugestão, rascunho) | Exemplo de vantagem |
|---|---|---|
| **Membro** | Cadastrou e aceitou os termos | Crédito de boas-vindas no primeiro frete |
| **Frequente** | 3 meses seguidos com compra ou frete | Crédito maior por fardo; prioridade na lista de espera |
| **VIP** | Gasto somado no grupo acima de R$ X em 90 dias, ou plano Ouro ou Platinum da Brás | Frete com desconto fixo, condições da Mega Tron, atendimento prioritário |

- Os limites e as vantagens ficam no Master. O nível é recalculado por job diário, com histórico.
- Os planos da Brás (Prata R$ 97, Ouro R$ 197, Platinum R$ 397, D108) **não são duplicados**: plano ativo conta como impulso de nível.

### 7.4 Motor de benefícios (no Master)
`club_benefits`, com versão (configurar não é publicar, Constituição seção 15):
- **Quem oferece:** empresa do grupo ou loja ou ônibus parceiro.
- **Para quem:** nível, tipo de cliente, região e marca de origem.
- **Gatilho:** compra numa empresa, fardo entregue, indicação, primeira viagem, aniversário de cadastro, campanha.
- **Recompensa:**
  - crédito em centavos ou percentual com teto;
  - cupom gerado (`coupons` estendido);
  - concessão de acesso (`entitlements`, por exemplo 1 mês da análise da Brás);
  - fardo P grátis.
- **Quem paga o desconto (funding):** a empresa que oferece, ou o "caixa do Club" com rateio definido.
- **Limites:** por pessoa, por mês e orçamento total, com a campanha parando sozinha ao acabar.
- **Prévia** antes de publicar: quantas pessoas recebem e o custo estimado.

### 7.5 Benefícios cruzados do grupo (sugestões em rascunho)

| De → Para | Benefício sugerido | Por que funciona |
|---|---|---|
| Comprou na **Mega Tron** → frete **Starline** | A cada R$ X em compra, crédito para 1 fardinho P | A compra puxa o frete, e o ônibus enche |
| Mandou fardos pela **Starline** → **Mega Tron** | Crédito de R$ Y por fardo entregue, usável na Mega Tron | O frete puxa a compra |
| **Passageiro** de excursão do Club → lojas participantes | Desconto na Mega Tron com o QR do Club no balcão | Ajuda o ônibus a vender poltrona e traz gente para a loja |
| **Guia de excursão** (parceiro) → crédito do Club | Percentual das compras dos passageiros dele nas lojas participantes, atribuído pelo QR | Formaliza a comissão de guia que já existe no Brás, com registro |
| Membro **Brás Digital** pago → frete e Mega Tron | Nível VIP automático no Platinum, Frequente no Ouro | Valoriza o plano sem criar outro plano |
| Lojista **SuperDrop** ou **Commerce** → frete Starline | Primeiro fardo com desconto | Traz o lojista online para o mundo do Brás |
| Ônibus indicado pelo lojista → quem indicou | Crédito quando o ônibus completa a primeira viagem | O lojista traz a oferta para a rede |

### 7.6 Cartão do Club e balcão
- **Cartão digital** com QR (identificador opaco, nunca o documento) no celular do membro.
- **Validar no balcão** (Mega Tron primeiro): a loja bipa o QR, vê nome, nível e as vantagens válidas e registra a compra (valor) para gerar o crédito. Duas formas:
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
- Compra na Mega Tron registrada no balcão → crédito → usado como desconto no próximo frete.
- No fechamento do mês aparece o valor que uma empresa deve à outra.
- O crédito vence com aviso, e nada vira dinheiro.
- Testes com saldo igual à soma do razão, sem lançamento duplicado (idempotência), crédito nunca negativo e concorrência no uso do crédito.

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
| `club_ledger` | Club | Razão append-only do crédito, com vencimento |
| `club_benefits` (+ versões) | Club | Motor de benefícios |
| `club_redemptions` | Club | Uso do benefício (cupom, concessão ou crédito), idempotente |
| `club_settlements` | Club | Acerto mensal entre empresas |
| `partners.kind` + `GUIA_EXCURSAO` | Parceiros | Guia de excursão, sem tabela nova |
| `coupons` (+ `kind`, `clubBenefitId`) | Cupons | Resgate do Club gera cupom |

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
- Tudo que mexe em dinheiro ou crédito entra na auditoria: aceite, preço congelado, uso de crédito, ajuste manual e acerto.
- LGPD:
  - o Club guarda o mínimo;
  - ligar contas exige aceite;
  - o membro pode ver e baixar os próprios dados e pedir a exclusão (o crédito vencido ou não usado se perde, conforme os termos);
  - o mapa de demanda é agregado (nenhuma cidade com menos de N pedidos aparece identificada).

---

## 12. Riscos jurídicos, fiscais e regulatórios (revisão antes de ligar a cobrança)

| Item | Risco | O que fazer |
|---|---|---|
| Ônibus de fretamento turístico levando mercadoria de terceiros | A regra da ANTT e dos estados para fretamento turístico pode limitar ou exigir registro próprio para levar carga de terceiros | `[CONFIRMAR jurídico]` antes de anunciar publicamente. O sistema não incentiva irregularidade: cada fardo precisa do documento fiscal da mercadoria (seção abaixo) |
| Starline com atividade principal "agência de viagens" | Cobrar frete pode exigir atividade (CNAE) de transporte de carga e registro de transportador (RNTRC) | `[CONFIRMAR contador]`: incluir a atividade e o registro da Starline antes do frete pago |
| Documento fiscal da mercadoria e do frete | Mercadoria viajando sem nota fica sujeita a fiscalização de ICMS nas divisas; frete de transportadora pode exigir CT-e | O fardo guarda o número da nota da loja; o sistema avisa quando falta. Emissão de CT-e e regra de frete por estado ficam como `[CONFIRMAR contador]` |
| Crédito do Club | Crédito que vira dinheiro ou se transfere pode ser tratado como arranjo de pagamento | Crédito não sacável, não transferível, com vencimento e só como desconto (seção 7.2) |
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
| 5 | Validade do crédito | 90 dias, com aviso 7 dias antes |
| 6 | Quem paga cada benefício cruzado (quem oferece ou rateio) | Quem oferece paga |
| 7 | Endereço do Club | `/club` dentro da Brás até haver domínio |
| 8 | Mega Tron entra como importadora da Brás, fornecedor do SuperDrop ou os dois | Os dois, com o selo "empresa do grupo" |
| 9 | Guia de excursão: percentual sobre as compras dos passageiros | 2% em crédito do Club, rascunho |

---

## 14. Fases de entrega (ordem recomendada)

| Fase | Entrega | Depende de |
|---|---|---|
| **E0** | Decisões (D112+), modalidade `ONIBUS_EXCURSAO`, `operation`, cadastro da **Starline** como primeira transportadora (excursão), regras `excursion` no Master, empresas do grupo cadastradas | — |
| **E1** | Rotas, viagens e fardos; painel do dono do ônibus em modo app (Viagem, Chamadas, Coleta, Entrega, Rotas e preços); link do ajudante; etiqueta com QR | E0 |
| **E2** | Lado do lojista: conta `CLUB_MEMBER` mínima, achar ônibus por cidade, reservar, rastrear, "o meu ônibus não está aqui" com assumir perfil | E1 |
| **E3** | "Entregar no ônibus" nos pedidos da Brás e da Mega Tron; balcão da loja com bipe e foto | E1, E2 |
| **E4** | Pagamento do frete por Pix na conta do dono do ônibus (MP conferido, idempotente); fatura mensal da taxa | E2, revisão da seção 12 para ligar |
| **E5** | Club: identidade, ligação de contas, razão do crédito, níveis, cartão QR, validação no balcão | E2 |
| **E6** | Motor de benefícios, benefícios cruzados do grupo, guia de excursão (parceiro), acerto entre empresas | E5 |
| **E7** | Mapa de demanda, páginas públicas (Club e Excursão) com ativos reais, relatório final | E1 a E6 |

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
- Club: **"Comprou na Mega Tron, ganhou crédito para o frete. Mandou pelo ônibus, ganhou crédito para a próxima compra."**
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
