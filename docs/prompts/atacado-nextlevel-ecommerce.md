# NextLevel E-commerce de Atacado — racional e prompt engenheiro mestre

> Estado: **EM ANDAMENTO.** AT0 no ar (D257: dados + motor único de preço). Próxima: AT1 (painel do lojista: preço de atacado, grades e mix, travas por plano).
> Pedido do dono (05/11/2026): "nossa plataforma vai ser especialista em atacado: NextLevel E-commerce de Atacado. Precisamos aprimorar o box de produtos e o sistema para comportar com perfeição a venda em atacado. No plano básico, o básico; nos planos mais altos, aprofundamos. Grade com 12, atacado de pacote, atacado mesclado com itens de toda a loja: são várias formas de venda de atacado que os empreendedores do Brás têm como realidade."

---

## 1. A tese em uma frase

**Quem vende no atacado do Brás não cabe numa loja de varejo com "desconto por quantidade" pendurado.** O lojista do Brás vende de quatro ou cinco jeitos ao mesmo tempo:
- grade fechada;
- pacote sortido;
- mix da loja toda;
- peça avulsa;
- pedido do balcão e do WhatsApp.

Hoje as plataformas grandes tratam isso com aplicativos de terceiros e tabelas limitadas por plano. A NextLevel E-commerce passa a ser **a plataforma feita para esse jeito de vender**: a regra de atacado nasce no produto, aparece igual na vitrine, no carrinho, na proposta e no balcão, e o servidor sempre recalcula.

**Posicionamento:** "NextLevel E-commerce de Atacado: a loja virtual que vende como o Brás vende." Grade, pacote, mix e varejo na mesma loja, com taxa zero da plataforma.

---

## 2. Como o Brás vende (as modalidades reais)

Cada modalidade abaixo tem: o que é, como o cliente compra e o que o sistema precisa garantir.

| # | Modalidade | O que é | O que o comprador vê | O que o sistema garante |
|---|---|---|---|---|
| 1 | **Varejo (peça avulsa)** | Uma peça, tamanho e cor escolhidos | Preço de varejo | Estoque por variação |
| 2 | **Atacado por quantidade do modelo** | A partir de N peças do mesmo modelo, o preço cai | "A partir de 6 peças: R$ 29,90 cada" | Soma tamanhos e cores do mesmo modelo; nunca abaixo do custo |
| 3 | **Grade fechada** (ex.: grade de 12) | Lote fechado do mesmo modelo, com quantidade definida por tamanho (ex.: 3P, 4M, 3G, 2GG) | "Grade 12 peças: P3 M4 G3 GG2 · R$ 26,90 a peça" | Baixa o estoque de cada tamanho; vende em grades inteiras |
| 4 | **Grade por cor** | Mesma grade em cada cor ("grade fechada por cor") ou cores sortidas na grade | Escolhe a cor da grade ou "cores sortidas" | Estoque por cor×tamanho; regra de cor sortida explícita |
| 5 | **Grade livre (aberta)** | O comprador monta a grade: mínimo X peças do modelo, em qualquer tamanho e cor | Matriz cor×tamanho com contador "faltam 2 para fechar" | Valida mínimo por modelo e, se houver, o múltiplo |
| 6 | **Pacote / fardo sortido** | Lote de N peças sortidas (modelos, cores e estampas a critério da loja) | "Pacote 20 peças sortidas tam. único · R$ 300" | Produto próprio "pacote", estoque em pacotes, aviso claro de que o comprador não escolhe |
| 7 | **Atacado mesclado (mix da loja toda)** | Atingiu N peças **em qualquer produto da loja** (ou R$ X), todo o carrinho vai para o preço de atacado | Barra no carrinho: "Faltam 3 peças para o preço de atacado em tudo" | Recalcula todas as linhas com o preço de atacado de cada produto; volta ao varejo se cair abaixo |
| 8 | **Mix por categoria** | O mix vale dentro de uma coleção ("6 peças de jeans, qualquer modelo") | Barra por categoria | Conta por categoria; um item pode estar em uma regra só |
| 9 | **Múltiplos** | Vende de 6 em 6, de 12 em 12 | Seletor de quantidade pula de 6 em 6 | Recusa quantidade fora do múltiplo |
| 10 | **Pedido mínimo da loja** | Valor ou peças mínimas para fechar | "Pedido mínimo R$ 300 em produtos" | Já existe por valor (D56) |
| 11 | **Caixa fechada** | Importadoras: preço por caixa com unidades por caixa | "Caixa com 48 un. · R$ 480" | É o Brás Digital (D91); a E-commerce só aponta |
| 12 | **Preço por tipo de cliente** | Tabela de varejo, de atacado, de revendedor e de distribuidor | Ao entrar, o cliente aprovado vê a sua tabela | Cliente ligado a uma tabela; a tabela muda o preço base |
| 13 | **Catálogo fechado** | Preço de atacado só para quem tem cadastro aprovado (CNPJ ou CPF de revendedor) | "Entre ou peça acesso para ver o preço de atacado" | Pedido de acesso, aprovação do lojista, preço escondido até aprovar |
| 14 | **Pré-venda / encomenda de coleção** | Vende antes de produzir, com sinal | "Entrega a partir de 20/12 · sinal de 30%" | Prazo de produção (já existe `productionDays`, D186), sinal e saldo |
| 15 | **Recompra rápida** | O cliente de atacado repete o último pedido | "Repetir pedido" na Minha conta | Reaproveita a conta do cliente (D240) |
| 16 | **Entrega do atacado** | Excursão (ônibus de sacoleiras), retirada na loja, transportadora, Correios | Escolhe a excursão e a guia, ou a retirada com horário | Formas de envio da loja (já existem, D-formas-envio) com tipo "excursão" |
| 17 | **Romaneio e separação** | Lista de separação por grade e tamanho | O lojista imprime o romaneio | Impressão a partir do pedido |
| 18 | **Faturado para CNPJ** | Boleto a prazo (30/60/90) para cliente aprovado, com limite | "Pagar faturado (aprovado)" | Limite por cliente e controle de títulos (fase avançada) |
| 19 | **Vendedor externo** | Representante tira o pedido no celular na loja do cliente | Pedido em nome do cliente | Equipe da loja + proposta (D-propostas) |

**Linguagem para as telas:**
- dizer "grade", "pacote", "mix", "peça", "modelo", "cor sortida";
- não dizer "SKU", "variante", "bundle", "tier".

---

## 3. O que já existe no sistema (não refazer)

| Peça | Onde | Decisão |
|---|---|---|
| Venda por unidade e por grade no mesmo produto (`sellsUnit`, `sellsPack`) | `products`, `product_packs`, `product_pack_items` | Base do SuperDrop |
| Grade com distribuição por tamanho (ex.: 12 peças) | `productPacks` + itens por variação | Base |
| Preço por quantidade do mesmo modelo (até 5 faixas, soma tamanhos, grades fora) | `store_price_tiers`, `price-tiers.ts`, `/merchant/atacado` | D52 |
| Pedido mínimo da loja (valor) | `stores.minOrderCents`, `orders.ts`, checkout | D56 |
| Tipo de venda Varejo/Atacado no pedido manual | `orders.saleType` | Base |
| Propostas (link para o cliente do WhatsApp) e pedido do balcão | `proposals.ts`, `/merchant/orders/new` | D-propostas |
| Grade de tamanhos e tabela de medidas | `sizeGrid`, `size-grids.ts` | Base |
| Prazo de produção por produto | `storeProducts.productionDays` | D186 |
| Formas de envio da loja | `formas-envio.ts` | Base |
| Conta do cliente final (código por e-mail) | `conta-cliente.ts` | D240 |
| Temas da família Atacado (Fardo, Lote…) | `families.ts` | D85 |
| Seção "Feita para o atacado" na home | `feita-para-atacado.tsx` | D221 |
| Caixa fechada para importadoras | Brás Digital | D91 |

**Lacunas principais:**
1. **A grade é uma só por produto** (o box usa `packs[0]`), sem cor, sem "cores sortidas" e sem grade livre.
2. **Não há mix da loja toda** (mesclado): a faixa de quantidade conta só o mesmo modelo.
3. **Não há pacote sortido** como modalidade própria (com aviso de que o comprador não escolhe).
4. **Não há múltiplos** nem mínimo por modelo.
5. **Não há preço de atacado como campo do produto.** Hoje existe só a faixa; o "preço de atacado" do mix precisa de um valor por produto.
6. **Não há tabela por tipo de cliente, catálogo fechado, recompra, excursão como entrega nem romaneio** pensado para grade.
7. **O box do produto foi desenhado para varejo:**
   - não tem matriz cor×tamanho;
   - não diz "por peça" em todos os modos;
   - não mostra o progresso até o atacado.

---

## 4. O modelo de regras (um motor só)

Toda modalidade vira a combinação de **três coisas**:
1. **Preços do produto:**
   - varejo (já existe: `storeProducts.priceCents`);
   - **atacado** (novo: `wholesalePriceCents`);
   - faixas opcionais (já existem).
2. **Formatos de venda do produto:**
   - avulsa;
   - grade fechada (uma ou várias, com cor fixa ou sortida);
   - grade livre (mínimo e múltiplo);
   - pacote sortido.
3. **Gatilhos de atacado da loja** (quando o carrinho passa ao preço de atacado):
   - `NENHUM`: só faixas e grades;
   - `MIX_PECAS`: N peças em qualquer produto;
   - `MIX_VALOR`: R$ X no carrinho;
   - `MIX_CATEGORIA`: N peças dentro de uma coleção;
   - `CLIENTE`: o cliente aprovado sempre vê o atacado.

**Ordem de cálculo (uma função pura, `precoDoCarrinho`, testada à exaustão)** — para cada linha:
1. Grade e pacote têm preço próprio (por peça × peças da grade) e não somam faixa.
2. Peça avulsa:
   - se algum gatilho do carrinho está ativo (mix atingido ou cliente aprovado), usa o preço de atacado do produto;
   - senão, usa a faixa do modelo (D52);
   - senão, usa o varejo.
   - O menor preço vence. Nunca abaixo do custo nem do mínimo do produto.
3. **As peças das grades e dos pacotes contam para o mix.** Comprou uma grade de 12, já liberou o atacado nas peças avulsas.
4. Cupom e pedido mínimo vêm depois, sobre o subtotal já com o atacado (como D56).
5. **O servidor sempre recalcula.** O preço do navegador nunca vale (regra D52). A mesma função roda:
   - no box;
   - no carrinho;
   - no checkout;
   - na proposta;
   - no balcão.

**Teste de ouro:** para qualquer carrinho, o total exibido no navegador é igual ao total cobrado (teste de propriedade com carrinhos aleatórios).

---

## 5. O box do produto (o coração do pedido)

**Desenho (computador e celular):**
- **Abas de formato** quando houver mais de um: `Peça avulsa | Grade de 12 | Grade livre | Pacote`. Cada aba mostra **o preço por peça em destaque** e o total do lote.
- **Escada de preço visível sempre:**
  - Varejo R$ 39,90;
  - atacado R$ 29,90 (a partir de 6 peças na loja);
  - grade R$ 26,90 a peça.
  - A linha atual do comprador fica marcada.
- **Matriz cor×tamanho** (grade livre e avulsa em quantidade):
  - linhas são cores (com amostra);
  - colunas são tamanhos;
  - cada célula tem um campo numérico com − e +;
  - esgotado aparece riscado, com o "Avise-me" (D55);
  - total de peças e de valor no rodapé fixo.
- **Grade fechada:**
  - fichas com a composição ("P 3 · M 4 · G 3 · GG 2");
  - seletor de cor ou "cores sortidas" com aviso;
  - quantidade de grades.
- **Pacote sortido:** foto do pacote, número de peças e o aviso "Modelos e cores sortidos, a critério da loja".
- **Barra do mix** (quando a loja usa mix): "Você tem 4 peças no carrinho. Faltam 2 para o preço de atacado em tudo." A barra enche conforme o comprador adiciona.
- **Múltiplos:** o seletor anda de 6 em 6 e explica "Vendido de 6 em 6".
- **Botões:**
  - "Adicionar ao pedido" (não "carrinho" quando a loja é só atacado);
  - "Pedir pelo WhatsApp" monta a mensagem com a grade (opcional, por loja).
- **Desempenho:** a matriz só carrega no cliente quando o formato a usa. Nada de biblioteca nova.
- **Acessibilidade:**
  - a matriz é uma tabela com cabeçalhos e campos rotulados ("Azul, tamanho M");
  - funciona no teclado;
  - em 360 px vira lista por cor.

**Card da vitrine:**
- mostra **"a partir de R$ 26,90 a peça no atacado"**;
- leva o selo do formato ("Grade 12", "Pacote", "Mix 6 peças");
- o lojista escolhe se o card destaca o varejo ou o atacado.

**Carrinho e checkout:**
- barra do mix fixa;
- quanto economizou no atacado ("Você economizou R$ 84,00 com o atacado");
- linhas de grade com a composição;
- aviso de mínimo;
- entrega por excursão ou retirada (guia, ônibus e horário).

---

## 6. A escada por plano (básico no Start, profundidade no Pro e no Scale)

**Princípios:**
- Ninguém perde o que já tem. O que existe hoje continua em todos os planos.
- O Start tem o atacado **completo para começar**.
- O Pro dá **variedade de formatos e de clientes**.
- O Scale dá **operação de distribuidor**.
- A tabela entra em `beneficios-plano.ts` (D247, uma tabela só) e alimenta a página de planos, o checkout, o placar e as travas no servidor.

| Recurso | Start (R$ 57) | Pro (R$ 147) | Scale (R$ 347) |
|---|---|---|---|
| Preço de varejo e de atacado por produto | ✓ | ✓ | ✓ |
| Preço por quantidade do modelo (faixas) | até 3 faixas | até 5 | até 5 |
| Grade fechada (ex.: grade de 12) | 1 por produto | até 4 por produto, por cor ou sortida | ilimitadas |
| Pedido mínimo da loja (valor) | ✓ | ✓ + mínimo em peças | ✓ + mínimo em peças |
| **Mix da loja toda** (mesclado: N peças em qualquer produto) | 1 regra | ✓ + mix por valor | ✓ + mix por categoria (várias regras) |
| Cor sortida na grade | ✓ | ✓ | ✓ |
| Grade livre (matriz cor×tamanho, mínimo por modelo) | — | ✓ | ✓ |
| Múltiplos (de 6 em 6) | — | ✓ | ✓ |
| Pacote / fardo sortido | — | ✓ | ✓ |
| Tabelas por tipo de cliente (atacado, revendedor…) | — | 2 tabelas | ilimitadas + preço por cliente |
| Catálogo fechado (preço só para aprovado) | — | ✓ | ✓ |
| Recompra rápida ("repetir pedido") | ✓ | ✓ | ✓ |
| Entrega por excursão e retirada com horário | ✓ | ✓ | ✓ |
| Romaneio de separação por grade | ✓ | ✓ | ✓ + separação em lote |
| Propostas e pedido do balcão com as regras | ✓ | ✓ | ✓ |
| Importar grades e preços por planilha | — | ✓ | ✓ |
| Pré-venda de coleção com sinal | — | — | ✓ |
| Faturado para CNPJ (boleto a prazo com limite) | — | — | ✓ (fase final, depende do meio de pagamento) |
| Vendedor externo tirando pedido no celular | — | — | ✓ |

> Valores sugeridos. O dono decide (seção 10). As travas seguem a regra da D247: quem já usa mais do que o novo limite continua vendendo; só não cria novos.

**Contra a concorrência (fato com fonte, consultado em 05/11/2026):**
- A Nuvemshop tem tabela de preços de atacado nativa: **1 tabela no Impulso, até 3 no Escala, ilimitadas no Next**, com pedido mínimo por valor ou quantidade ([central da Nuvemshop](https://atendimento.nuvemshop.com.br/pt_BR/varejo-e-atacado/como-criar-e-ativar-a-tabela-de-precos-no-atacado-na-nuvemshop)).
- A Nuvemshop também tem **compra por grade via aplicativo de terceiro** ("Compre por Grade Pro", instalado de outra loja de apps) ([central da Nuvemshop](https://atendimento.nuvemshop.com.br/pt_BR/recursos-extras/como-instalar-o-aplicativo-compre-por-grade-pro)).
- Sobre a WBuy, Tray e Loja Integrada não achamos nada público e verificável sobre grade e mix. **Não afirmar nada sobre elas** até ter fonte.
- Mensagem honesta: "Grade, pacote, mix e varejo nativos, na mesma loja, desde o plano de R$ 57." Só publicar cada item **depois** que ele existir no código (regra da D221 e da skill `pagina-de-vendas`).

---

## 7. Dados (proposta para a fase AT0)

Colunas novas anuláveis ou com valor padrão, sem quebrar o SuperDrop (skill `nova-migracao`):
- `storeProducts`:
  - `wholesalePriceCents` (anulável);
  - `minQtyPerModel` (padrão 0);
  - `multipleOf` (padrão 1);
  - `formatoDestaque` (`VAREJO`, `ATACADO`).
- `productPacks`:
  - `kind` (`GRADE_FECHADA`, `PACOTE_SORTIDO`);
  - `colorMode` (`FIXA`, `SORTIDA`, `POR_COR`);
  - `color` (anulável);
  - `position`.
- `productVariants`: `color` (anulável; hoje só `size`). A matriz depende disso, e a migração precisa preencher a cor dos produtos existentes como nula ("cor única").
- Tabela nova `store_wholesale_rules`:
  - colunas: `id`, `storeId`, `kind` (`MIX_PECAS`, `MIX_VALOR`, `MIX_CATEGORIA`), `minPieces`, `minCents`, `categoryId`, `active` e `position`;
  - limite de regras por plano.
- Tabelas novas `store_price_lists` e `store_price_list_items`, com o cliente ligado a uma lista. Tabelas por tipo de cliente (Pro+).
- Tabela nova `store_wholesale_access`, com os pedidos de acesso ao catálogo fechado (e-mail, CNPJ ou CPF, status) (Pro+).
- `formas-envio`: tipo `EXCURSAO`, com os campos guia, ônibus, ponto e horário.

**SuperDrop (D216):**
- loja de rede continua sem preço por quantidade, sem mínimo e sem mix (`storeModality === "NETWORK"`);
- a grade da Central continua como está;
- um teste garante isso.

---

## 8. Páginas de venda

1. **Home da E-commerce:**
   - o título passa a falar de atacado ("A loja virtual que vende como o Brás vende");
   - a seção "Feita para o atacado" ganha as modalidades novas **só quando estiverem no ar**;
   - demonstração animada do box: matriz enchendo, barra do mix completando, preço caindo.
2. **Página nova `/atacado`** (alto nível, skill `pagina-de-vendas`):
   - uma seção por modalidade, com o box real em cada uma (grade, pacote, mix, cliente aprovado);
   - glossário do Brás;
   - "como o seu cliente compra" em 3 passos;
   - entrega por excursão;
   - tabela por plano;
   - perguntas frequentes.
   - Ativos reais: fotos de grade dobrada, pacote, balcão; a lista de ativos com os prompts fica no manifesto da página.
3. **`/planos` e `/comparativo`:**
   - linha "Atacado" com a escada da seção 6;
   - no placar, entram só itens com fonte e data (Nuvemshop: tabelas por plano e grade por aplicativo de terceiro).
4. **Loja de demonstração de atacado** (tema da família Atacado):
   - produtos com grade de 12, pacote sortido e mix de 6 peças;
   - serve de prova viva para o comercial e os parceiros.
5. **Cadastro e boas-vindas:**
   - pergunta "Você vende no atacado, no varejo ou nos dois?";
   - já liga os formatos e o mix conforme a resposta (sem esconder nada).
6. **Parceiros:** material do representante com a demonstração de atacado (PV4/PV5).

**Regras de texto:**
- nunca "mais barato" (dizer "mais vantajoso");
- sempre "taxa zero da plataforma";
- nada de dado inventado;
- diferenciar "disponível", "demonstração" e "em breve".

---

## 9. Fases

| Fase | Entrega | Aceite |
|---|---|---|
| **AT0** | Dados (seção 7) + função pura `precoDoCarrinho` com o preço de atacado, o mix por peças e por valor, e grades contando no mix | Testes de cada modalidade, de borda (cai abaixo do mix → volta ao varejo) e de propriedade (navegador = servidor); SuperDrop intacto |
| **AT1** | Painel: preço de atacado no produto, grades várias (por cor ou sortida), mix da loja em `/merchant/atacado`, travas por plano | e2e do lojista; travas no servidor |
| **AT2** | **Box novo** (abas, escada de preço, grade com cor, barra do mix) + card com "a partir de… a peça" + carrinho/checkout com a barra e a economia | Capturas em 360/768/1440; axe sem erro; total igual ao cobrado |
| **AT3** | Matriz cor×tamanho (grade livre), mínimo por modelo, múltiplos, pacote sortido (Pro+) | e2e montando grade livre; teclado |
| **AT4** | Entrega por excursão e retirada, romaneio por grade, recompra rápida na Minha conta | e2e de pedido com excursão; impressão |
| **AT5** | Tabelas por tipo de cliente + catálogo fechado com aprovação (Pro+) | Cliente aprovado vê a sua tabela; não aprovado não vê preço |
| **AT6** | Páginas de venda: `/atacado`, home, planos, comparativo, loja de demonstração | Skill `pagina-de-vendas` (3 rodadas de ajuste); só o que existe |
| **AT7** | Importação por planilha (grades e preços), mix por categoria, pré-venda com sinal (Scale) | Planilha de exemplo; testes |
| **AT8** | Faturado para CNPJ e vendedor externo (Scale; depende do meio de pagamento) | Decisão do dono antes |

---

## 10. Decisões do dono (com o padrão recomendado)

| # | Decisão | Padrão recomendado |
|---|---|---|
| 1 | Escada por plano | A tabela da seção 6 |
| 2 | Nome público | "NextLevel E-commerce de Atacado" no título e no posicionamento; a marca segue "NextLevel E-commerce" |
| 3 | O mix vale para quê | As peças das grades e dos pacotes contam para o mix |
| 4 | O mix caiu abaixo no carrinho | Volta ao varejo na hora, com aviso |
| 5 | Card da vitrine | Destaca o atacado quando a loja tem mix ou grade; o lojista pode trocar |
| 6 | Catálogo fechado | Opcional por loja (Pro+); varejo continua aberto se a loja quiser |
| 7 | Faturado | Fica para o fim (AT8), só com meio de pagamento que suporte |

---

## 11. Riscos e cuidados

- **Preço divergente entre o navegador e a cobrança:** é o maior risco. Uma função só e o teste de propriedade resolvem.
- **Estoque de grade:**
  - a grade fechada baixa cada tamanho;
  - o pacote sortido tem estoque próprio em pacotes;
  - nunca vender grade sem todos os tamanhos.
- **Variações com cor:** a migração tem que manter os produtos antigos funcionando ("cor única").
- **SuperDrop:** a loja de rede não muda de comportamento. Teste dedicado.
- **Velocidade:** o box novo não pode piorar a página do produto. Medir com a skill `desempenho` (meta: LCP do produto no celular ≤ o atual).
- **Promessa pública:** só anunciar o que já está no ar.

---

## 12. Prompt engenheiro mestre

```
Você é o engenheiro responsável por transformar a NextLevel E-commerce na plataforma especialista em atacado
("NextLevel E-commerce de Atacado"). Leia antes: este arquivo inteiro, docs/design/DECISIONS.md (D52, D56, D85, D91,
D186, D221, D240, D247 e as decisões novas do atacado), AGENTS.md (Next.js desta versão), e o código citado na seção 3.
Use as skills do projeto: desenvolver-prompt, nova-migracao, painel-interno, pagina-de-vendas, desempenho, qa-visual, publicar.

Objetivo: o lojista do Brás vende do jeito que vende na rua (grade fechada, grade livre, pacote sortido, mix da loja
toda, peça avulsa, cliente aprovado, balcão e WhatsApp) numa loja só, com a mesma regra de preço em vitrine, carrinho,
checkout, proposta e balcão. No Start, o básico completo; no Pro, variedade de formatos e de clientes; no Scale,
operação de distribuidor.

Regras inegociáveis:
1. Uma função pura `precoDoCarrinho` (src/lib/domain/atacado/preco.ts) decide todos os preços; o servidor sempre
   recalcula; o preço vindo do navegador nunca vale. Teste de propriedade: total exibido == total cobrado.
2. Nunca abaixo do custo nem do preço mínimo do produto. O menor preço válido vence. Grades e pacotes têm preço próprio
   e contam para o mix.
3. SuperDrop (loja de rede) não muda: sem mix, sem faixa, sem mínimo; teste dedicado (D216).
4. Limites por plano em beneficios-plano.ts (D247), travados no servidor; quem já passou do limite continua vendendo.
5. Migrações aditivas (anuláveis ou com padrão) e provadas sobre banco antigo; variações antigas viram "cor única".
6. Box e matriz acessíveis (tabela rotulada, teclado, 360 px vira lista), sem biblioteca nova, sem piorar o LCP.
7. Textos em português simples do Brás: grade, pacote, mix, peça, modelo, cor sortida. Nunca "mais barato"; sempre
   "taxa zero da plataforma"; nada inventado; só anunciar o que está no ar; dados de concorrente só com fonte e data.

Entregue por fases (seção 9), uma por vez, cada uma com: domínio + testes Vitest, telas no design system atual,
e2e, capturas em 360/768/1440 examinadas, decisão nova em DECISIONS.md, atualização deste arquivo e do
docs/prompts/README.md, tsc + eslint + vitest completo + build antes de publicar. Comece pela AT0. Ao terminar cada
fase, reporte ao dono em português simples: o que ficou pronto, o que depende dele e qual é a próxima fase.
```
