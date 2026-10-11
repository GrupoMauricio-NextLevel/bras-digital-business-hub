# Prompt de engenheiro mestre: público, personas, preço e porta de entrada de todas as marcas NextLevel

> **Para que serve:** ser a base do próximo grupo de adaptações e melhorias em **todas as marcas**: SuperDrop, NextLevel Commerce, Brás Digital, NextLevel Cargas (com a Excursão), Brás Digital Club, Nota Fácil e Meu Contador, Programa de Parceiros, e depois Hub Creators e China Hub.
> **Duas partes** (a Parte A inclui, na seção A9, como mostrar os benefícios gamificados nos painéis):
> - **Parte A** é o racional que o Claude já fez (2026-10-11), lendo o código, os documentos e o mercado.
> - **Parte B** é o prompt para aprofundar a descoberta de cada usuário com dados reais, entrevistas e testes de preço, e só então mudar planos, telas e ofertas.
>
> **Como usar:** leia a Parte A, responda as perguntas da seção A10 e peça ao Claude "desenvolva o prompt `publico-personas-precos-ecossistema.md` a partir da fase P0".
> **Autoridade:** `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` > `docs/design/DECISIONS.md` > este documento. Nada daqui vale como decisão até virar D-número.
> **Legenda das afirmações:**
> - **[fato]**: está no código ou no documento;
> - **[mercado]**: fonte externa, a conferir na página oficial;
> - **[inferência]**: conclusão a partir dos fatos;
> - **[hipótese]**: precisa de teste.

---

# PARTE A: o racional

## A1. Método (skills usadas)
- **repo-auditor:** o que existe de verdade: planos, preços e regras no código (`src/lib/finance/price-book.ts`, `catalog-seed.ts`, `catalog-seed-bras.ts`, `domain/bras/regras.ts`, `domain/club/regras.ts`, `partner-rules.ts`) e nos documentos (`docs/NEGOCIO.md`, `docs/PLANOS.md`, decisões D1 a D122).
- **ux-flow-auditor:** a jornada de cada persona, do anúncio ao primeiro valor, e onde ela desiste (fricção, estado vazio, pedido de dinheiro cedo demais).
- **impact-analysis:** o efeito cruzado de cada mudança de preço nas outras marcas: Club, parceiros, acerto entre empresas, taxa por pedido.
- **acceptance-designer:** cada recomendação vira hipótese com métrica e critério de aceite (Parte B).
- **pagina-de-vendas:** as promessas que podem ir para as páginas sem mentir (sem "lucre R$ X", sem número inventado).

## A2. O ecossistema em uma frase
**Um motor, várias portas.** Cada marca é uma porta de entrada para um público diferente:
- **SuperDrop:** quem quer vender sem estoque.
- **Commerce:** quem tem marca e quer loja própria.
- **Brás Digital:** quem compra atacado em caixa fechada.
- **Cargas:** quem transporta.
- **Club:** a moeda e a cola entre todas.

O dinheiro do grupo vem de **mensalidade, taxa sobre a venda real, serviços (temas, Loja Pronta, migração, marketing, Meu Contador) e o giro entre as empresas do grupo**: Mega Tron vende produto, Starline transporta, NextLevel cobra a tecnologia. **[inferência]**

## A3. O que cobramos hoje (inventário)
| Marca | Porta de entrada hoje | Planos e preço | Taxa sobre venda | Fonte |
|---|---|---|---|---|
| **SuperDrop: membro** (revendedor) | Teste de 7 dias com cupom do fornecedor; depois bloqueia | Drop manual R$ 49 · Loja SuperDrop R$ 97 + setup R$ 200 · Loja própria R$ 197 + setup R$ 2.000 | 5% · 5% · 3% | [fato] `price-book.ts` |
| **SuperDrop: fornecedor** (Central) | Venda assistida | Start R$ 497 · Growth R$ 997 · Scale R$ 1.997; White Label setup R$ 15.000 + R$ 2.000/mês | 3% (SuperDrop) · 1,5% (WL) | [fato] `price-book.ts` |
| **NextLevel Commerce** | 3 dias grátis → 1º mês R$ 9,90 → taxa zero por 3 meses | Start R$ 149 · Pro R$ 249 · Scale R$ 499 · anual −25% | 1% · 0,7% · 0,4% | [fato] `catalog-seed.ts` |
| Serviços Commerce | Compra avulsa | Loja Pronta R$ 1.997 / R$ 4.997 · Migração R$ 1.497 / R$ 3.997 · Temas R$ 297 / R$ 697 · marketing sob consulta | — | [fato] |
| **Brás Digital: membro** | Cadastro grátis com CNPJ (preço só para membro) | Prata R$ 97 · Ouro R$ 197 · Platinum R$ 397 | Embutida na comissão da importadora | [fato] D108 |
| **Brás: importadora** | Grátis | Pro R$ 297 · Premium R$ 697 · gravação R$ 1.497 | Comissão por venda | [fato] |
| **NextLevel Cargas** | Grátis (20 cargas/mês) | Pro R$ 147 · Premium R$ 397 | 8% · 6% · 5% do frete | [fato] |
| **Excursão (ônibus)** | Grátis | — | R$ 1,50 por fardo (cobrança desligada) | [fato] D112/D119 |
| **Club** | Automático | — | 100 pontos = R$ 1; compra 2 pts/R$; indicação 300 a 2.000 pts; vale até 30% da compra | [fato] D115/D120 |
| **Meu Contador** | Chamado | Preço em rascunho (cobrança desligada) | — | [fato] D117 |
| **Parceiros** | Cadastro | — | 15% a 25% do setup + 5% de manutenção | [fato] `partner-rules.ts` |
| **Add-ons** | — | Academy R$ 47 · Suporte Premium R$ 97 · Relatórios R$ 29 · assento de expedição R$ 19 | — | [fato] |

**Achados do inventário:**
1. **Três regras de teste diferentes** (7 dias com cupom, 3 dias + R$ 9,90, cadastro grátis), sem uma lógica de grupo. O cliente que circula entre marcas não entende. **[fato + inferência]**
2. **`docs/PLANOS.md` diverge do código.** Exemplo: o fornecedor SuperDrop custa R$ 300/mês + 3% no documento e R$ 497 a R$ 1.997 no código. Antes de mexer em preço, é preciso fixar uma fonte da verdade (o catálogo do Master). **[fato]**
3. **Desconto anual inconsistente.** O documento diz "sem desconto por ciclo nos planos". O Commerce dá 25% e o price book de serviços dá 15% (semestral) e 25% (anual). **[fato]**
4. **O Commerce Start (R$ 149) custa o dobro da porta paga mais barata do líder brasileiro** (Nuvemshop Essencial, cerca de R$ 69), e **não temos plano grátis**: Nuvemshop e Loja Integrada têm. **[mercado]**
5. **O Club já é uma moeda única do grupo** (pontos, vale, acerto entre empresas). Ainda não é usado como alavanca de preço (cashback de mensalidade, desconto em serviço do grupo). Essa é a maior vantagem que os concorrentes não têm. **[fato + inferência]**

## A4. Referência de mercado (conferir nas páginas oficiais antes de decidir)
| Concorrente | Porta de entrada | Preço | Observação |
|---|---|---|---|
| **Nuvemshop** | Plano grátis (Começo) + 7 dias grátis nos pagos | Essencial cerca de R$ 69 · Impulso cerca de R$ 164 · Escala cerca de R$ 449 | Tarifa por venda cai com o plano e é zero com o gateway próprio. As fontes divergem sobre a tarifa do plano grátis (0% a 2,5%) **[mercado]** |
| **Shopify** | 3 dias grátis + US$ 1/mês por 3 meses | Basic cerca de US$ 39 (US$ 29 no anual), em dólar com IOF | Sem gateway próprio no Brasil: 2% de taxa no Basic **[mercado]** |
| **Loja Integrada** | Grátis permanente (50 produtos, 5.000 visitas, com selo) | Pagos de cerca de R$ 54 a R$ 499+ | Anual com cerca de 20% de desconto **[mercado]** |
| **Dropshipping nacional** (Dropi e similares) | Cadastro grátis | Cerca de R$ 49 a R$ 97/mês (fontes fracas) | **[mercado, baixa confiança]** |

**Conversão por modelo (dados de fornecedores de SaaS, só como direção):**
- grátis permanente (freemium): cerca de 2,6% a 5% vira pago;
- teste sem cartão: cerca de 18%;
- teste com cartão cadastrado: cerca de 49%, mas entra muito menos gente;
- teste reverso (tudo liberado e depois cai para o grátis): cerca de 4% a 12%, e precisa de 14 a 21 dias para criar hábito.

Nosso público paga por **Pix e quase não usa cartão recorrente**, então o "teste com cartão" não serve. **[mercado + inferência]**

## A5. Personas (quem é cada cliente)
> Cada persona tem: quem é, o que quer resolver (trabalho), gatilho de compra, objeções, primeiro valor (o "aha"), quanto paga, o que faz ficar e o que faz sair. Os nomes são ilustrativos. **[hipótese até a Parte B validar]**

### SuperDrop
**P1. Carla, a revendedora que começa pelo celular** (público principal do membro)
- 22 a 45 anos, vende para conhecidos no Instagram e WhatsApp. Quase sempre é renda extra. Sem capital para estoque e sem CNPJ ou com MEI.
- **Trabalho:** "quero vender sem comprar estoque e sem passar vergonha com loja feia".
- **Gatilho:** ver uma conhecida vendendo; um fornecedor (Central) que a convida.
- **Objeções:** "e se eu não vender?", "mensalidade antes de vender", "não sei mexer".
- **Primeiro valor:** a loja dela no ar com os produtos do fornecedor, em minutos, e a **1ª venda**.
- **Quanto paga:** baixo, até cerca de R$ 50/mês antes de vender. Aceita bem uma **taxa sobre a venda** ("só pago quando vendo").
- **Fica** por vendas recorrentes e pela recarga simples. **Sai** se passar 2 a 3 semanas sem venda.
- **Não é para:** quem quer marca própria com estoque (Commerce).

**P2. Marcos, o fornecedor que quer uma rede de revendedoras** (Central)
- Dono de confecção ou atacado (camisas, moda, utilidades). Tem estoque e capacidade de separar. Hoje vende no WhatsApp para revendedoras, com bagunça de pedido e de pagamento.
- **Trabalho:** "quero 50 a 500 revendedoras vendendo meu estoque, com pedido e Pix organizados".
- **Objeções:** setup alto; "e se ninguém aderir?".
- **Primeiro valor:** catálogo importado e a **1ª revendedora com pedido pago na esteira**.
- **Quanto paga:** setup e mensalidade, se a conta fechar com o número de revendedoras. A taxa de 3% é aceitável.
- **Fica** pela expedição organizada. **Sai** se a rede não ativar.
- **Ponto-chave:** o Marcos traz as Carlas. **O fornecedor é o canal de aquisição do membro.** **[inferência]**

### NextLevel Commerce
**P3. Juliana, a marca de moda que cresceu no Instagram**
- 25 a 45 anos, marca própria (moda feminina, fitness, infantil, camisa de time). Fatura de R$ 10 mil a R$ 100 mil por mês entre Instagram, WhatsApp e marketplace.
- **Trabalho:** "quero uma loja bonita que converta e me tire da dependência de marketplace".
- **Gatilho:** taxa do marketplace, loja atual feia ou lenta, queda de alcance.
- **Objeções:** migrar dá trabalho; "já pago a Nuvemshop"; medo de perder SEO e clientes.
- **Primeiro valor:** **a loja dela com o tema de alto nível e os produtos importados**, vista no celular.
- **Quanto paga:** de R$ 69 a R$ 250/mês sem drama, se a loja vender mais. Paga tema e Loja Pronta à vista no Pix com desconto.
- **Fica** por conversão, tema e suporte. **Sai** por taxa alta ou loja lenta.

**P4. Rodrigo, o migrante insatisfeito**
- Já tem loja em Nuvemshop, Shopify, Tray ou similar. Reclama de custo em dólar, visual genérico ou suporte.
- **Trabalho:** "quero trocar sem parar de vender".
- **Primeiro valor:** **ver a própria loja migrada numa prévia** antes de pagar.
- **Porta de entrada natural:** migração assistida com garantia.

### Brás Digital
**P5. Dona Cida, a lojista do interior que compra no Brás**
- 35 a 65 anos, loja de utilidades, variedades ou presentes em cidade do interior, com CNPJ ou MEI. Hoje viaja de **ônibus de excursão** ao Brás de 1 a 4 vezes por mês.
- **Trabalho:** "quero comprar em caixa fechada pelo preço do Brás sem perder o dia de viagem, e que chegue na minha cidade".
- **Gatilho:** custo e cansaço da viagem; um vídeo do produto viralizando.
- **Objeções:** "não conheço a importadora", "e se não chegar", "não sei usar aplicativo".
- **Primeiro valor:** **ver o preço da caixa e o frete do ônibus dela no mesmo lugar**, e o primeiro fardo chegando.
- **Quanto paga:** é sensível a mensalidade, mas paga por **economia comprovada** (frete, viagem, nota). Gosta de **cashback em compras**.
- **Fica** por confiança na importadora e no ônibus. **Sai** se tiver um problema de entrega.

**P6. Rafael, o vendedor de marketplace que caça produto**
- 22 a 40 anos, vende no Mercado Livre e na Shopee, compra caixa para revender online.
- **Trabalho:** "quero achar o próximo produto vencedor antes dos outros".
- **Primeiro valor:** **a análise do produto** (vídeo e veredito) e o preço da caixa.
- **Quanto paga:** de R$ 97 a R$ 397/mês **por informação** (Prata, Ouro, Platinum). É o público dos planos pagos da Brás.

**P7. A importadora do Brás**
- Empresa familiar com showroom e estoque grande. Vende no balcão e no WhatsApp.
- **Trabalho:** "quero vender para o Brasil inteiro sem atender 200 conversas por dia".
- **Primeiro valor:** **o 1º pedido de fora de São Paulo** pago e retirado com código.
- **Quanto paga:** comissão sobre a venda sem dor. A mensalidade só depois do volume. Paga gravação de conteúdo.

### NextLevel Cargas e Excursão
**P8. Mauricio, o dono do ônibus de excursão**
- 40 a 65 anos, faz linha fixa cidade–Brás. Vive de poltrona e de bagageiro. Usa celular e WhatsApp.
- **Trabalho:** "quero bagageiro cheio antes de sair de São Paulo e frete pago antes".
- **Primeiro valor:** **a primeira viagem com fardos reservados pelo painel** e o Pix recebido.
- **Quanto paga:** **por fardo transportado**, nunca mensalidade no início.

**P9. A transportadora pequena regional**
- De 1 a 10 caminhões, rota fixa, quer carga de volta.
- **Primeiro valor:** **a 1ª coleta no Brás** vinda de uma importadora da rede.
- **Quanto paga:** comissão sobre o frete. Plano pago para ter destaque e mais cargas.

### Transversais
**P10. A loja do Brás sem nota** (Nota Fácil e Meu Contador)
- Lojista do Brás, muitas vezes informal, que perde venda porque o fardo não embarca sem nota.
- **Primeiro valor:** **a primeira nota emitida em minutos** e o fardo embarcando.
- **Paga** por emissão ou pacote. A promoção de entrada (notas grátis) é a isca.

**P11. O guia de excursão e o passageiro** (Club)
- O guia leva grupos ao Brás e já ganha "comissão de guia" informal.
- **Primeiro valor:** **ver os pontos dos passageiros dele virando dinheiro de verdade em desconto.**

**P12. O parceiro** (consultor, agência, influenciador)
- Indica lojas e fornecedores e vive de comissão recorrente.
- **Primeiro valor:** **a 1ª comissão liberada.**
- **Quer:** link simples, painel claro e material pronto.

**Futuras [hipótese]:**
- **P13 (Hub Creators):** criador que vende por link.
- **P14 (China Hub):** fornecedor estrangeiro.

As duas ficam para depois, sem domínio até haver código.

## A6. O que barra a entrada hoje (fricção, pela ótica de cada persona)
| Persona | Barreira | Evidência |
|---|---|---|
| P1 Carla | Paga antes de vender e o acesso **bloqueia** no fim dos 7 dias | [fato] D-P1, `store-access.ts` |
| P3 Juliana | 3 dias é pouco para migrar e ver a loja pronta; o Start é 2x o concorrente | [fato + mercado] |
| P4 Rodrigo | Precisa ver a loja migrada **antes** de pagar R$ 1.497 | [inferência] |
| P5 Dona Cida | Não confia sem a 1ª entrega; o plano pago não fala de economia em reais | [inferência] |
| P2 Marcos | Setup alto antes de ver a rede ativar | [fato] |
| P8 Mauricio | Nenhuma (é grátis); falta o Pix ligado e a Starline com preço | [fato] D119 |

## A7. A proposta inteligente: "Grátis para começar, paga quando cresce"
> Nem só 7 nem só 15 dias. **A combinação que funciona para o nosso público (Pix, celular, renda variável)** tem 8 peças. Todas configuráveis no Master e testáveis. **[hipótese com base em fato e mercado]**

1. **Porta grátis permanente em todas as marcas, com limite de crescimento, não de função básica.**
   - O grátis vende de verdade (loja no ar, Pix, pedidos) e paga uma **taxa maior sobre a venda**: "só paga quando vende".
   - Os limites são de escala (produtos, pedidos por mês, selo da marca, suporte), nunca "não pode vender".
   - SuperDrop e Commerce ganham o plano **Começo**. Brás, Cargas e Excursão já são grátis na porta.
2. **Teste reverso de 14 dias do plano do meio, sem cartão.**
   - Entra com tudo liberado (Pro ou Ouro). No 15º dia, **cai para o grátis sem bloquear nem perder nada**.
   - Quem se acostumou com o Pro tem o motivo para assinar. Quem não assinou continua vendendo e pagando taxa, o que é melhor que o bloqueio de hoje.
3. **Dias ganhos por conquista** (o teste que o cliente "merece"):
   - +7 dias ao publicar a loja e +7 na 1ª venda, até 30 dias no total;
   - recompensa o comportamento que prevê a assinatura.
4. **Simulador de "quando o plano se paga".**
   - O painel mostra, com o volume real do cliente: "com as suas vendas, o Pro sai R$ X mais barato que o grátis".
   - A taxa menor dos planos pagos faz o upgrade ser **matemática, não insistência**. A conta de equilíbrio já existe no `PLANOS.md`.
5. **Anual agressivo, no Pix:**
   - **"Pague 8, leve 12" (cerca de 33% de desconto)** no Pix à vista, no lugar dos 25% de hoje;
   - **mais 1 mês de mensalidade em pontos do Club** (cashback);
   - **preço travado por 12 meses** (já existe `priceLockMonths`);
   - **garantia de 30 dias** com devolução integral.
   - **Alternativa para testar:** 12x "sem juros" no cartão a preço de anual, com a taxa da maquininha embutida.
6. **Cashback do grupo em pontos do Club** (a vantagem que concorrente nenhum tem):
   - 5% a 10% de toda mensalidade paga vira pontos do Club;
   - os pontos valem desconto em **serviços do grupo**: tema, Loja Pronta, Meu Contador, frete da Starline e compra na Mega Tron.
   - Custo real menor que o valor de face, porque a margem dos serviços é de cerca de 50% **[fato: `services.targetMarginBps` 5000]**. O acerto entre empresas já existe (D120).
7. **Passe do Grupo:** quem assina uma marca ganha vantagem nas outras. Exemplos:
   - assinante Commerce Pro ganha Brás Prata grátis por 3 meses;
   - membro Brás Ouro ganha frete Starline com desconto;
   - fornecedor SuperDrop ganha destaque na Brás.

   Usa o motor de concessão de acesso (`entitlements`) e o nível do Club.
8. **Indicação que paga os dois lados:** quem indica e quem é indicado ganham 1 mês em pontos (já existe o motor único de indicações, D113/D115, e o de parceiros).

**Guarda-corpos:**
- um teste e um grátis por CPF/CNPJ (já existe `oncePer: TAX_ID`);
- sem promessa de ganho;
- renovação com aviso (D-30 e D-7);
- cancelamento simples;
- ponto não vira dinheiro;
- o Master liga e desliga cada peça (configurar não é publicar).

## A8. Preço sugerido para testar (rascunho; a Parte B valida)
| Marca | Grátis (taxa) | Meio | Topo | Anual |
|---|---|---|---|---|
| SuperDrop membro | **Começo R$ 0 · 7% por venda** | Loja R$ 79 · 4% | Própria R$ 179 · 2,5% | Pague 8 leve 12 + pontos |
| Commerce | **Começo R$ 0 · 2,5% · até 50 produtos e com selo** | Start R$ 89 · 1% · Pro R$ 199 · 0,7% | Scale R$ 449 · 0,4% | Idem |
| Brás membro | Grátis (vê preço e compra) | Prata R$ 97 → **"grátis no mês em que comprar acima de R$ X"** | Ouro e Platinum com cashback em compra | Idem |
| Importadora | Grátis + comissão | Pro quando passar de N pedidos/mês | Premium | — |
| Cargas | Grátis 20 cargas | Pro | Premium | Idem |
| Excursão | Grátis · taxa por fardo | — | — | — |

Os números são **pontos de partida para teste**, não decisão. O critério é: o grátis cobre o custo de servir com a taxa; o pago fica abaixo do concorrente equivalente; o upgrade se paga sozinho a partir de um volume claro.

## A9. Como mostrar: os benefícios gamificados nos painéis, didáticos e atraentes
> **Ponto de partida [fato]:** já existe o painel "Indique e ganhe" (`src/components/club/club-panel.tsx`), igual em todos os papéis: saldo, nível, convite, funil, missões com barra, conquistas, vales, extrato e ranking. Ele funciona, mas é uma lista de caixas parecidas, com pontos sem valor em reais em vários lugares, e fica escondido numa página. **A proposta é evoluir esse painel e espalhar os benefícios onde o cliente trabalha, não criar um "joguinho" à parte.**

### A9.1 Princípios (valem para todas as marcas)
1. **Sempre em reais.** Todo ponto aparece também em reais ("12.000 pontos = R$ 120 de desconto"). Ponto sem valor em reais não ensina nada.
2. **O próximo passo é o herói.** Cada bloco responde "o que eu faço agora para ganhar?", com um botão que leva à tela que resolve (direção do `painel-interno`).
3. **Mostrar o prêmio antes da tarefa.** "Publique a loja → ganhe +7 dias de Pro e 300 pontos." A recompensa aparece na trilha antes de ser conquistada, com cadeado aberto ou fechado.
4. **Progresso visível e honesto.** Barras e degraus com números reais ("2 de 3"), sem contador falso de urgência.
5. **Comemorar o marco, uma vez só.** Primeira venda, nível novo, vale usado: uma comemoração leve (selo animado e toast), sem atrapalhar o trabalho e sem repetir o mesmo evento.
6. **Linguagem de quem lê no celular.** Frases curtas, verbos de ação e um "como funciona" de 3 passos ilustrados ao alcance de um toque.
7. **Identidade de cada marca, mesma anatomia.** A cor de sinal e a tipografia são da marca; o desenho do componente é o mesmo em todos os painéis. O cliente que circula entre marcas reconhece a "carteira do grupo".
8. **Sem cara de cassino.** Nada de roleta, sorteio, caça-níquel, raspadinha ou "você ganhou!" sem motivo. Sorteio exige autorização legal, e o prompt do Club já proíbe (seção 12 dele).

### A9.2 Os componentes (um kit só, reaproveitado em todos os painéis)
| # | Componente | O que mostra | Por que ensina | Onde aparece |
|---|---|---|---|---|
| 1 | **Carteira do Grupo** (faixa fixa) | Saldo em pontos e em reais + o próximo marco ("faltam 2 indicações para Frequente") | O cliente vê que tem dinheiro de desconto parado | Topo de todos os painéis (lojista, membro Brás, ônibus, transportadora, importadora, parceiro) |
| 2 | **Trilha de primeiros passos** | 5 a 7 marcos da persona, em escada ou linha (publicar loja → 1º produto → 1ª venda → 1º Pix recebido…), com o prêmio de cada marco | Leva ao primeiro valor e mostra os "dias ganhos por conquista" | Primeira tela de cada painel nos primeiros 30 dias; depois recolhe |
| 3 | **Medidor do teste** | Dias restantes do teste reverso, o que ele usou do plano pago e o que muda se voltar ao grátis (com marcação ✓/✗) | Mostra a perda, não a cobrança, e reduz a surpresa no fim do teste | Faixa no painel durante o teste e tela de fim de teste |
| 4 | **Simulador "quando o plano se paga"** | Gráfico simples: custo no grátis × no pago conforme as vendas do mês, com o ponto de cruzamento e o marcador "você está aqui" | Transforma o upgrade em conta | Página de planos e cartão no painel quando ele passa do ponto de cruzamento |
| 5 | **Escada de níveis** | Membro → Frequente → VIP como degraus, com as vantagens de cada um, o atual destacado e o que falta para subir | O cliente sabe o que ganha ao subir | Página do Club e cartão da carteira |
| 6 | **Cartões de missão** | Meta do mês, barra, prazo ("faltam 9 dias"), recompensa em reais e a etiqueta "quase lá" quando passa de 70% | Meta curta e clara puxa o hábito | Página do Club e um cartão "missão da semana" no painel |
| 7 | **Vitrine "Onde usar seus pontos"** | Recompensas do grupo com preço em pontos e em reais: tema, Loja Pronta, Meu Contador, frete da Starline, vale na Mega Tron. "Você já pode" fica destacado | Dá desejo e mostra o valor do cashback | Página do Club e sugestão no lugar certo (ex.: no frete, "use 3.000 pontos") |
| 8 | **Passe do Grupo** | Mapa das marcas com o que está liberado (cadeado aberto) e como liberar o resto | Mostra o ecossistema como vantagem e puxa a venda cruzada | Página do Club e perfil |
| 9 | **Extrato que conta a história** | Linha do tempo: ganhou (de quê), usou (onde), vai vencer (quando), com o aviso de 30 dias e o botão "usar agora" | Confiança: o cliente entende de onde veio cada ponto | Página do Club |
| 10 | **Resumo de economia** | "Este ano você economizou R$ X com o Grupo" (anual, cashback, frete, vales), em cartão que dá para compartilhar sem dado sensível | Prova o valor de ficar e serve de divulgação | Página do Club, uma vez por mês, e um resumo anual |
| 11 | **Ranking da cidade** | Pódio discreto, só com a posição (já existe, D122) | Comparação social sem prêmio por posição | Página do Club |
| 12 | **Comemoração** | Selo animado e toast no marco (1ª venda, nível novo) | Reforço positivo no momento certo | Onde o marco acontece |

### A9.3 Esboço (celular, 360 px)
```
┌──────────────────────────────────────┐
│ 💰 R$ 34,50 em pontos   [Usar ▸]     │  ← Carteira do Grupo (faixa fixa)
│ Faltam 2 indicações para Frequente   │
├──────────────────────────────────────┤
│ Seus primeiros passos      3 de 6    │  ← Trilha
│ ●━━━●━━━●━━━○━━━○━━━○                │
│ ✓ Loja no ar   ✓ 1º produto          │
│ ✓ 1ª venda (+7 dias, +300 pts)       │
│ → Próximo: receba o 1º Pix           │
│   prêmio: +200 pts (R$ 2)  [Fazer ▸] │
├──────────────────────────────────────┤
│ Teste do Pro: faltam 6 dias          │  ← Medidor do teste
│ ▓▓▓▓▓▓▓▓░░░░                          │
│ No grátis você mantém: loja, vendas  │
│ Você perde: tema Pro, taxa 2,5%→7%   │
│ Com suas vendas, o Pro se paga.      │
│ [Ver a conta]  [Assinar no Pix]      │
└──────────────────────────────────────┘
```

### A9.4 O que cada persona vê primeiro (a mesma peça, com outro foco)
| Persona | Primeiro destaque | Tom |
|---|---|---|
| P1 Carla (revendedora) | Trilha até a 1ª venda + carteira simples | "Você está a 1 passo da sua primeira venda" |
| P2 Marcos (fornecedor) | Rede ativada: revendedoras convidadas → com venda, com prêmio por revendedora ativa | "Sua rede vendeu R$ X esta semana" |
| P3/P4 Juliana e Rodrigo (Commerce) | Simulador do plano + Passe do Grupo + vitrine (temas) | Profissional, número primeiro |
| P5 Dona Cida (Brás) | **Economia em reais** (frete do ônibus, cashback na Mega Tron), letra maior, poucos blocos | "Você economizou R$ 86 neste mês" |
| P6 Rafael (marketplace) | Escada de níveis e missões (descobertas, análises) | Desafio e status |
| P7 Importadora | Pedidos de fora de São Paulo e destaque conquistado | Resultado comercial |
| P8 Dono do ônibus | Medidor do bagageiro (já existe) + pontos dos clientes que viajam com ele | "Seu bagageiro está 70% cheio" |
| P11 Guia de excursão | Pontos dos passageiros dele virando desconto | "Seus passageiros te renderam R$ X" |
| P12 Parceiro | Escada de comissão (já existe nos parceiros) + próxima faixa | "Mais 2 ativações e você sobe para 20%" |

### A9.5 Regras de desenho e de acessibilidade
- **Direção visual:** a "mesa do atacadista" (`docs/design/DIRECAO-VISUAL-V4.md`): papel quente, tinta, uma cor de sinal por marca e linhas finas. Evite gradiente roxo, cartões idênticos com sombra e ícone genérico em círculo.
- **Gráficos:** pela skill `dataviz`: um gráfico por pergunta, cores da marca, rótulo direto (sem legenda distante) e número tabular.
- **Movimento:** curto (até 400 ms), só nos marcos, e respeitando `prefers-reduced-motion` (sem animação para quem pediu).
- **Acessibilidade AA:**
  - toda barra com `role="progressbar"` e texto equivalente;
  - informação nunca só pela cor;
  - foco visível;
  - sem rolagem horizontal em 360 px;
  - contraste conferido com `readableOn`.
- **Velocidade:** a carteira e a trilha vêm de uma consulta só por bloco, com esqueleto de carregamento. Nada de cálculo pesado a cada tela.
- **Didático de verdade:**
  - cada componente tem o link "Como funciona", com 3 passos ilustrados e uma pergunta frequente;
  - o vocabulário é o mesmo em todas as marcas: pontos, vale, nível, missão, conquista.

## A10. Perguntas para o dono (respondem a Parte B mais rápido)
1. Pode ter plano grátis permanente no Commerce e no SuperDrop, com taxa maior sobre a venda? (Sugestão: sim.)
2. Teste reverso de 14 dias que cai para o grátis, em vez de bloquear? (Sugestão: sim.)
3. Anual "pague 8, leve 12" no Pix + 1 mês em pontos: o caixa aguenta? (Sugestão: testar com 100 clientes.)
4. Cashback de 5% ou 10% da mensalidade em pontos do Club? Quem paga: o caixa do Club ou a marca?
5. Qual o preço oficial: o `PLANOS.md` ou o que está no código? (Sugestão: o catálogo do Master vira a única fonte.)
6. Quais combinações do Passe do Grupo você topa dar de presente?
7. Tem números reais por marca (cadastros, ativações, vendas, cancelamentos)? Posso tirar do banco do Neon, só agregados e sem dados pessoais?
8. Pode entrevistar de 5 a 8 clientes por marca? (Fornecedores do SuperDrop, a Starline, a Mega Tron, lojistas do Brás.)
9. A Carteira do Grupo pode ficar fixa no topo de todos os painéis, ou prefere um ícone que abre? (Sugestão: faixa fixa nos primeiros 30 dias, depois um ícone com o saldo.)
10. Comemoração com animação no marco (1ª venda, nível novo): pode? (Sugestão: sim, leve e uma vez por marco.)
11. Quais recompensas entram primeiro na vitrine "Onde usar seus pontos"? (Sugestão: tema, Meu Contador, frete da Starline e vale na Mega Tron.)

---

# PARTE B: o prompt (cole numa sessão nova)

## B0. Seu papel e o contrato
Você é o engenheiro mestre de produto e preço da NextLevel. Sua missão é **descobrir em profundidade quem usa cada marca** e transformar isso em **uma arquitetura única de entrada, preço, benefícios e cashback para o grupo**, implementada no motor que já existe, sem quebrar o SuperDrop em produção.

**Leia antes:**
- `CLAUDE.md`, `AGENTS.md` e `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`;
- `docs/NEGOCIO.md`, `docs/PLANOS.md` e `docs/financeiro-master.md`;
- `docs/design/DECISIONS.md` (D1 a D122);
- os prompts do Commerce (`docs/prompts/nextlevel-commerce-plataforma.md`) e do Club (`docs/prompts/bras-digital-club-excursao-ecossistema.md`);
- a **Parte A** deste arquivo.

**Pode fazer sozinho:**
- análise;
- consultas **agregadas e anônimas** ao banco;
- roteiros de entrevista e questionários;
- simuladores;
- telas atrás de chave desligada;
- testes;
- publicar fases testadas com tudo desligado.

**Não pode sem o dono:**
- mudar preço que está valendo;
- ligar cobrança;
- mandar mensagem a cliente;
- prometer ganho;
- expor dado pessoal;
- mudar comportamento do SuperDrop sem teste.

Diferencie sempre **fato, mercado, inferência e hipótese**.

## B1. Fase P0: fonte única da verdade de preço (pré-requisito)
- Inventário de **todo** preço, taxa, teste e desconto nas marcas: código, `platform_settings`, catálogo do Master e documentos. Liste as divergências (ex.: `PLANOS.md` × `price-book.ts`).
- Proponha que o **catálogo do Master** (`catalog_products`, `catalog_price_versions`, `catalog_offers`) seja a fonte única e que o `price-book` leia dele. Registre a decisão.
- **Aceite:** uma tabela "preço que vale hoje", por marca e plano, conferida contra o banco; nenhum preço fixo novo no código.

## B2. Fase P1: dados reais (sem dado pessoal)
Para cada marca, tire do banco **só agregados** (nunca nome, documento, e-mail ou telefone):
- **Funil:** cadastros por semana → ativação (loja publicada, 1º produto, 1ª venda, 1ª compra na Brás, 1ª coleta, 1ª viagem) → pagante → cancelamento, com o tempo mediano entre as etapas.
- **Coortes por mês de entrada:** retenção em 30, 60 e 90 dias e receita por cliente.
- **Distribuição de faturamento** dos lojistas (faixas). É ela que define onde o upgrade se paga.
- **Uso por recurso:** o que os pagantes usam e os não pagantes não usam. Esses são os candidatos a recurso pago.
- **Origem:** parceiro, fornecedor (Central), indicação do Club, orgânico.

**Entrega:** `docs/descoberta/DADOS-<marca>.md` com gráficos simples (skill `dataviz`) e as conclusões marcadas como fato.
**Aceite:** os números batem com os painéis do Master. Consulta reproduzível em script, só leitura.

## B3. Fase P2: entrevistas e questionário
- **Roteiro por persona (P1 a P12)**, com 30 minutos e perguntas abertas sobre comportamento passado, não sobre opinião futura:
  - "Conte a última vez que…";
  - "O que você usava antes?";
  - "Quanto isso te custou?";
  - "O que quase te fez desistir?".
- **Questionário curto dentro do painel** (máximo 5 perguntas, opcional, atrás de chave), com a pergunta de preço em 4 faixas (adaptação de Van Westendorp):
  - "barato demais para confiar";
  - "uma pechincha";
  - "caro, mas pagaria";
  - "caro demais".
- **Teste de "e se tirássemos?"** (Sean Ellis): "como você se sentiria se não pudesse mais usar X?".
- **Entrega:** roteiros em `docs/descoberta/ROTEIROS.md`, questionário em tela e as respostas agregadas.
- **Aceite:** o roteiro foi aprovado pelo dono antes de usar. Sem gravação sem consentimento. As respostas ficam anônimas.

## B4. Fase P3: personas validadas e trabalhos a serem feitos
Para cada persona, um **cartão** com:
- quem é;
- contexto;
- trabalho a ser feito;
- gatilho;
- objeções;
- primeiro valor (o "aha") e em quanto tempo;
- métrica de ativação;
- quanto paga (faixa de preço medida);
- canal de aquisição;
- motivos de ficar e de sair;
- quem **não** é.

Marque o que mudou em relação à Parte A. Inclua o **mapa da jornada** (skill `ux-flow-auditor`), com os pontos de fricção numerados e a tela onde acontecem.

**Entrega:** `docs/descoberta/PERSONAS.md`.
**Aceite:** cada afirmação tem fonte (dado, entrevista ou mercado).

## B5. Fase P4: arquitetura de entrada e preço do grupo
Desenhe e justifique, com números da P1 e da P2:

1. **Porta de entrada por marca:** grátis permanente com taxa, teste reverso, dias ganhos por conquista. Use a seção A7 como hipótese inicial.
2. **Escada de planos** com o **ponto de equilíbrio** de cada upgrade, mostrado ao cliente.
3. **Ciclos:** mensal, anual no Pix "pague 8, leve 12" (ou a variante vencedora), preço travado, garantia.
4. **Cashback do grupo** em pontos do Club:
   - percentual da mensalidade;
   - onde vale;
   - quem paga (acerto entre empresas, D120);
   - teto e validade;
   - o custo real calculado com a margem dos serviços.
5. **Passe do Grupo:** que assinatura dá qual vantagem em qual marca, por concessão de acesso (`entitlements`) e nível do Club.
6. **Indicação e parceiros:** benefício dos dois lados, sem acumular com o desconto do parceiro (regra atual do Commerce).
7. **Simulação de receita de 12 meses** (motor `src/lib/finance/engine.ts`), em 3 cenários (pessimista, base, otimista), comparando com o modelo atual.

**Entrega:** `docs/descoberta/ARQUITETURA-PRECO.md` e uma decisão nova em `DECISIONS.md` **em rascunho**.
**Aceite:**
- nenhum plano custa ao grupo mais do que rende no cenário base;
- o grátis cobre o custo de servir (`costs` do price book);
- o dono aprovou por escrito.

## B6. Fase P5: implementação (atrás de chaves, uma marca por vez, SuperDrop por último)
Estenda, não duplique:
- **`OfferRules`** (em `catalog_offers`) ganha:
  - `mode` (TRIAL, REVERSE_TRIAL, FREE_TIER);
  - `fallbackPlanKey` (para onde cai no fim do teste);
  - `milestoneDays` (lista de conquista → dias, com teto);
  - `annualPromo` (meses pagos × meses levados, só Pix);
  - `cashbackBps` (pontos do Club por mensalidade);
  - `bundleGrants` (Passe do Grupo).

  Tudo versionado e editável no Master, com prévia de custo antes de publicar.
- **Acesso da loja** (`store-access.ts`): o estado "teste acabou" passa a ser **cair para o grátis**, e não bloquear, quando a oferta for reversa. **Bloqueio só por fatura vencida** (régua atual).
- **Taxa por venda por plano** já existe. O plano grátis entra com a taxa dele.
- **Simulador de upgrade** no painel do lojista (skill `painel-interno`), com os números reais do cliente.
- **Cashback:** crédito em pontos com `funder` da marca (D120), idempotente por fatura paga, revertido no estorno.
- **Páginas de preço** (skill `pagina-de-vendas`): a comparação com o concorrente só com fonte e data.
- **Aceite (skill `acceptance-designer`):**
  - teste de domínio para cada regra: queda para o grátis; dias ganhos com teto; anual só no Pix; cashback uma vez por fatura; estorno; um teste por CPF/CNPJ;
  - e2e no navegador do caminho completo de cada persona principal;
  - SuperDrop com teste de regressão;
  - tudo desligado por padrão.

## B6b. Fase P5V: os benefícios gamificados nos painéis (visual e didático)
Construa o kit da seção A9 **evoluindo o que existe** (`src/components/club/club-panel.tsx`, medidor do bagageiro, escada de comissão dos parceiros), sem criar um segundo sistema de pontos.
- **Domínio:**
  - um agregador só, `src/lib/domain/beneficios/painel.ts`, junta o saldo do Club, o nível, as missões, a trilha da persona, o estado do teste e o simulador do plano;
  - entrega tudo pronto para a tela, com os valores em centavos e em pontos;
  - **o componente não decide regra**;
  - a trilha de cada persona (marcos, prêmio e ordem) fica no Master (`platform_settings`), versionada.
- **Componentes:** `src/components/beneficios/*`:
  - CarteiraGrupo, TrilhaMarcos, MedidorTeste, SimuladorPlano, EscadaNivel, CartaoMissao, VitrineRecompensas, PasseGrupo, ExtratoHistoria, ResumoEconomia, Comemoracao;
  - todos na galeria do design system, com a cor de cada marca e o modo claro e escuro.
- **Onde liga:**
  1. Carteira e trilha no topo dos painéis do lojista (SuperDrop e Commerce), do Meu Brás, do ônibus, da transportadora, da importadora e do parceiro;
  2. medidor do teste durante a oferta reversa;
  3. simulador na página de planos e como cartão quando o cliente passa do ponto de cruzamento;
  4. vitrine de recompensas na página do Club e como sugestão no frete e na compra de serviços.
- **Comemoração e marcos:** cada marco é um evento idempotente (uma comemoração por marco por pessoa), registrado para medir a ativação.
- **Medição:** eventos "viu", "clicou" e "concluiu" para cada componente, lidos no painel do experimento (fase P6). A pergunta é se a trilha e a carteira aumentam a ativação e a assinatura.
- **Aceite (skills `acceptance-designer`, `qa-visual`, `painel-interno`):**
  - capturas em 360, 768 e 1440 px de cada painel, em modo claro e escuro, mostradas ao dono antes de publicar;
  - `axe` sem violação grave; navegação por teclado; movimento reduzido respeitado;
  - todo ponto exibido também em reais; nenhum texto de sorteio ou promessa de ganho;
  - teste de domínio do agregador (saldo, próximo marco, trilha por persona, simulador com números conhecidos);
  - e2e: o lojista completa um marco e vê a comemoração uma vez; a carteira atualiza; o simulador mostra o cruzamento;
  - tudo atrás de chave, ligado por marca, SuperDrop por último e com teste de regressão.

## B7. Fase P6: experimento e leitura
- Cada peça vira um **experimento** com uma chave no Master:
  - grupo de controle × grupo novo, por coorte de cadastro;
  - métrica principal (ativação ou pagante em 30 dias);
  - métrica de guarda (receita por cliente, cancelamento);
  - tamanho mínimo e data de leitura combinados antes.
- **Painel do experimento no Master:** funil por grupo e conclusão com a incerteza explicada em português simples.
- **Aceite:** nada vira padrão sem leitura escrita e decisão do dono.

## B8. Regras que não podem quebrar
- Valores em **centavos**.
- Preço e regra em `platform_settings` ou no catálogo do Master, **nunca fixos no código**.
- Pagamento só vale depois de conferido no gateway, com idempotência.
- **Sem promessa de ganho**, sem "garantido", sem número que não existe.
- Pontos **não viram dinheiro**.
- Renovação com aviso e cancelamento simples (CDC).
- Um tenant nunca lê dado de outro. Pesquisa só com consentimento e dado anônimo.
- Acessibilidade AA, celular primeiro (360 px).
- Textos ao cliente em português claro.
- **SuperDrop em produção:** nenhuma mudança de comportamento sem teste e sem o dono.

## B9. Relatório de cada fase
`docs/relatorios/PRECO-FASE-N.md`, com:
- o que foi descoberto, em 5 linhas para o dono;
- números com fonte;
- o que mudou na hipótese;
- as decisões pedidas;
- a próxima fase.

## B10. Fontes de mercado usadas na Parte A (conferir nas páginas oficiais)
- Nuvemshop, planos e tarifa por venda: [central da Nuvemshop](https://atendimento.nuvemshop.com.br/pt_BR/tarifa-por-venda/o-que-sao-as-tarifas-por-venda-da-nuvemshop), [comparativo de planos (E-commerce na Prática)](https://ecommercenapratica.com/blog/planos-nuvemshop/), [LitExtension](https://litextension.com/pt/blog/nuvemshop-planos)
- Shopify, teste e preço: [Base](https://base.com/pt-BR/blog/shopify-guia-completo/), [Omid Saffari](https://omidsaffari.com/pt-br/blog/shopify-preco), [Kommo](https://www.kommo.com/br/blog/shopify-precos/)
- Loja Integrada: [comparativo oficial](https://lojaintegrada.com.br/comparar-plataformas/), [Empreender](https://empreender.com.br/planos-da-loja-integrada/)
- Dropshipping nacional: [Nuvemshop blog](https://www.nuvemshop.com.br/blog/plataforma-dropshipping/), [Loja Integrada hub](https://lojaintegrada.com.br/hub/plataformas-de-dropshipping-nacional/)
- Conversão grátis × teste × teste reverso: [Userpilot](https://userpilot.com/blog/free-trial-conversion-rate/), [Fungies](https://fungies.io/saas-free-trial-vs-freemium-2026), [Monetizely](https://www.getmonetizely.com/articles/freemium-vs-free-trial-choosing-the-right-customer-acquisition-model-for-saas-success)
