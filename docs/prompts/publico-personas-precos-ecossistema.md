# Prompt de engenheiro mestre: público, personas, preço, benefícios e o ecossistema NextLevel (arquivo consolidado)

> **Para que serve:** ser a base do próximo grupo de adaptações e melhorias em **todas as marcas**: SuperDrop, NextLevel Commerce, Brás Digital, NextLevel Cargas (com a Excursão), Brás Digital Club, Nota Fácil e Meu Contador, Programa de Parceiros, e depois Hub Creators e China Hub.
> **Duas partes.** A Parte A inclui os benefícios gamificados nos painéis (A9), a barra do ecossistema e a página de ativação ao trocar de marca (A10), e o Club como assinatura que abre todas as marcas (A11):
> - **Parte A** é o racional que o Claude já fez (2026-10-11), lendo o código, os documentos e o mercado.
> - **Parte B** é o prompt para aprofundar a descoberta de cada usuário com dados reais, entrevistas e testes de preço, e só então mudar planos, telas e ofertas.
>
> **Como usar:** leia a Parte A, responda as perguntas da seção A13 e peça ao Claude "desenvolva o prompt `publico-personas-precos-ecossistema.md` a partir da fase P0".
> **Autoridade:** `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` > `docs/design/DECISIONS.md` > este documento. Nada daqui vale como decisão até virar D-número.
> **Legenda das afirmações:**
> - **[fato]**: está no código ou no documento;
> - **[mercado]**: fonte externa, a conferir na página oficial;
> - **[inferência]**: conclusão a partir dos fatos;
> - **[hipótese]**: precisa de teste.

---

## Resumo executivo (uma página para o dono)
1. **Quem é o cliente:** 12 personas em 6 marcas, da revendedora que começa pelo celular (SuperDrop) à Dona Cida que compra no Brás e manda pelo ônibus (A5). São hipóteses até a Parte B confirmar com dados e entrevistas.
2. **O problema de hoje:** três regras de teste diferentes, preço do documento divergente do sistema, Commerce caro na entrada e um Club que ainda não é usado como alavanca de venda (A3 e A6).
3. **A porta de entrada:** "grátis para começar, paga quando cresce". As peças são (A7):
   - plano grátis com taxa sobre a venda;
   - teste reverso de 14 dias que cai para o grátis, sem bloquear;
   - dias ganhos por conquista;
   - anual "pague 8, leve 12" no Pix;
   - cashback em pontos do Club.
4. **Como o cliente enxerga:** a Carteira do Grupo, a trilha de primeiros passos, o medidor do teste, o simulador do plano e a vitrine de recompensas. Tudo didático e sempre em reais (A9).
5. **Ecossistema:**
   - o "fio do grupo" no topo, com as cores das marcas, e o lançador para trocar de marca (A10);
   - ao entrar numa marca que ainda não usa, a pessoa vê uma **página de ativação personalizada**, com um clique para o teste grátis ou para assinar com benefício (A10.10).
6. **A chave de tudo: o Club como assinatura do ecossistema:**
   - **Club** (grátis, pontos para todos);
   - **Club+** (multiplica pontos e dá desconto em todas as marcas);
   - **Club Total** (entrada paga de todas as marcas numa assinatura só) (A11).
7. **Como tudo se encaixa** numa jornada de ponta a ponta (A12) e **o que preciso de você** (A13).
8. **Parte B:** fases P0 a P6 para descobrir, decidir e construir atrás de chaves, com o SuperDrop por último.

## Mapa do documento
| Seção | Assunto |
|---|---|
| A1 a A4 | Método, ecossistema, inventário de preços, mercado |
| A5 e A6 | Personas e o que barra a entrada |
| A7 e A8 | Porta de entrada inteligente e preços para testar |
| A9 | Benefícios gamificados nos painéis (visual e didático) |
| A10 | Barra do ecossistema e página de ativação ao trocar de marca |
| A11 | Club como assinatura que abre o ecossistema |
| A12 | A jornada completa: como tudo se encaixa |
| A13 | Perguntas para o dono |
| B0 a B10 | Prompt de execução por fases (P0 a P6) |

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
| **Club (assinatura do ecossistema, A11)** | Club grátis (pontos) | Club+ cerca de R$ 29,90 (pontos em dobro + 20% nos planos) | Club Total cerca de R$ 247 (entrada de todas as marcas) | Pague 8 leve 12 |

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

## A10. A barra do ecossistema: o cliente de uma marca descobre as outras
> **Pedido do dono:** "algo no topo, como uma aba, para o cliente de uma marca descobrir a outra com facilidade; cada marca com cores equivalentes; dinâmico, sutil, atrativo; todas as marcas do grupo precisam ser esse ecossistema".

### A10.1 Por que vale a pena
- **O cliente que já confia em uma marca é o mais barato de conquistar para a outra.**
  - A Carla, que revende no SuperDrop, pode comprar caixa na Brás.
  - A Dona Cida, que compra na Brás, pode mandar pelo ônibus da Excursão e vender online no SuperDrop.
  - A Juliana, do Commerce, pode abastecer a loja na Brás.
- **Hoje não existe esse caminho [fato]:**
  - cada marca é uma ilha para o cliente;
  - só o Master vê todas (`BusinessPortal` em `/master`).
- **É a peça que transforma o Passe do Grupo e a Carteira do Grupo (A7 e A9) em algo que o cliente enxerga:** "estas são as nossas marcas, e os seus pontos valem em todas".

### A10.2 O que já existe e o que limita [fato]
- **Cores:** todas as marcas já compartilham os mesmos neutros (papel `#F4F1E9`, tinta `#101B34`) e o amarelo do grupo (`#F5BC00`). Cada uma tem a sua **cor de sinal** em `src/lib/brand-palette.ts`:
  - Commerce: azul `#196BD8`;
  - SuperDrop: verde `#118728`;
  - Brás: laranja `#B34D00`;
  - Cargas: índigo `#4B4FD8`;
  - Creators: magenta `#BA327B`;
  - China Hub: petróleo `#008085`;
  - NextLevel: amarelo `#F5BC00`.

  É a base pronta para "cores equivalentes".
- **Conta:** **uma pessoa = um papel** (`users.role` único e e-mail único). Hoje a Carla não consegue ser membro da Brás com o mesmo e-mail. Para o "entrar direto em outra marca" funcionar, é preciso a **conta do grupo**: uma pessoa com vários perfis, um por marca, ligados com consentimento. O prompt do Club já previu isso (`club_members` e `club_member_accounts`, seção 7.1 dele).
- **Endereços:**
  - as marcas em `*.nextlevelgroup.com.br` podem compartilhar a sessão no mesmo domínio;
  - `superdrop.com.br` e `nextlevelcommerce.com.br` são domínios diferentes e precisam de uma **passagem por código de uso único** (o cliente clica e entra do outro lado sem digitar a senha de novo).

### A10.3 As opções comparadas
| Opção | Como é | A favor | Contra |
|---|---|---|---|
| Aba ou barra de abas no topo | Uma aba por marca, sempre visível | Muito descobrível | Ocupa espaço no celular, compete com o trabalho e vira "propaganda fixa" |
| Só um ícone de "apps do grupo" (grade) | Botão que abre a lista | Discreto e conhecido (Google, Microsoft) | Pouca gente clica sem um convite |
| Cartão dentro do painel | Sugestão no meio da tela | Contextual | Se for fixo, vira banner que ninguém lê |
| Rodapé "do Grupo NextLevel" | Lista de marcas no fim | Sem incômodo | Quase ninguém vê |

### A10.4 A recomendação: três camadas que se completam
**Camada 1: o "fio do grupo"** (a assinatura, sempre presente e quase invisível)
- Uma linha de 3 a 4 px no topo de **todos** os painéis e páginas públicas das marcas, dividida em segmentos com as cores das marcas.
- **O segmento da marca em uso é mais largo**; os outros são finos.
- Ao passar o mouse (ou tocar), a linha "acorda": cresce para cerca de 28 px e mostra os nomes das marcas como pílulas. Toque numa pílula para abrir a camada 2 já naquela marca.
- **Não ocupa espaço de trabalho.** Comunica "você faz parte de algo maior" sem dizer nada.

**Camada 2: o "lançador do grupo"** (o caminho em 1 toque)
- Um botão com o símbolo do grupo (quatro quadradinhos nas cores das marcas) no cabeçalho, ao lado da Carteira do Grupo (A9). No celular, fica no menu "Mais" da barra de baixo.
- **Abre uma gaveta** com três grupos, nesta ordem:
  1. **Suas marcas:** as que a pessoa já usa, com o saldo ou o status de cada uma. Entra direto.
  2. **Recomendadas para você:** de 1 a 3 marcas escolhidas pela persona e pelo momento, cada uma com **o motivo em uma frase** e **o benefício do Passe do Grupo**. Exemplo: "Compre do Brás em caixa fechada para a sua loja · você ganha 3 meses de Prata por ser assinante Commerce". Botão "Começar grátis" com os dados já preenchidos.
  3. **Todas as marcas:** a família inteira, com uma linha de "para quem é" cada uma. As que ainda não abriram (Creators, China Hub) aparecem como "em breve · avise-me", se o dono quiser.
- Um ponto colorido pulsa **uma vez** no botão quando surge um benefício novo para a pessoa (nunca piscando sem parar).

**Camada 3: o "convite no momento certo"** (o dinâmico)
- Um cartão pequeno e discreto, **dentro do fluxo**, quando a outra marca resolve exatamente o que a pessoa está fazendo. Exemplos:
  - SuperDrop, a Carla sem opção de frete barato para o interior → "Mande pelo ônibus da Excursão (NextLevel Cargas)".
  - Brás, a Dona Cida finalizando uma compra de caixa → "Quer vender esse produto online também? Abra sua loja no SuperDrop, grátis".
  - Commerce, a Juliana com estoque baixo → "Reponha comprando do Brás em caixa fechada".
  - Cargas, o dono do ônibus → "Seus passageiros ganham pontos no Club: divulgue o cartão".
  - Importadora → "Venda também em loja própria com o Commerce".
- **Regras do convite:**
  - no máximo **1 por sessão** e 1 por semana para o mesmo convite;
  - sempre com "agora não" e "não mostrar mais";
  - **nunca no meio de pagamento, checkout, separação de pedido ou tarefa urgente**.
- As regras (qual convite, para quem, em que tela, com que limite) ficam **no Master**, versionadas e ligadas por marca.

### A10.5 Cores equivalentes (para nenhuma marca "gritar" mais que a outra)
- As cores de sinal de hoje têm **pesos diferentes**: o amarelo da NextLevel é muito claro e o índigo da Cargas é escuro.
- Para o fio e o lançador, crie uma **variante "ecossistema"** de cada cor com a **mesma luminosidade e intensidade** (ajuste em OKLCH), conferida com o validador de contraste (`readableOn`, skill `dataviz`).
- A cor própria e forte de cada marca continua dentro do painel dela. A variante ecossistema só aparece no fio, nos quadradinhos do lançador e nas pílulas.
- **Símbolo de cada marca:**
  - um quadrado com a inicial (S, C, B, Cg, Cl…) na cor ecossistema;
  - o amarelo do grupo é o "guarda-chuva", em pequeno: "Grupo NextLevel".
- **Modo escuro:** cada variante tem par claro e escuro, como as paletas atuais.

### A10.6 Dinâmico, sutil e atraente (o comportamento)
- **Movimento:** de 150 a 250 ms, só ao abrir, ao "acordar" o fio e no ponto de benefício novo. Respeita `prefers-reduced-motion` (sem animação para quem pediu).
- **Ordem inteligente:** "Suas marcas" e "Recomendadas" mudam com a persona (A5), o momento (o que a pessoa acabou de fazer) e o que ela já tem.
- **Prova e benefício:** cada recomendação diz em reais o que a pessoa ganha ("3 meses de Prata = R$ 291") e o que a marca resolve, em linguagem simples.
- **Atrativo sem cara de anúncio:**
  - tipografia e linhas finas da direção "mesa do atacadista";
  - os quadradinhos coloridos são o único elemento de cor forte;
  - nada de banner, carrossel ou pop-up que bloqueia a tela.

### A10.7 Esboço
```
Computador (cabeçalho do painel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← fio (segmento SuperDrop largo)
 SuperDrop · Painel da loja        💰 R$ 34,50 em pontos   [▪▪/▪▪]  [Carla ▾]
                                                            ↑ lançador
Gaveta do lançador
┌───────────────────────────────────────────────┐
│ Grupo NextLevel                              ✕│
│ SUAS MARCAS                                   │
│ [S] SuperDrop    Loja no ar · 12 pedidos   ▸  │
│ RECOMENDADAS PARA VOCÊ                        │
│ [B] Brás Digital                              │
│     Compre em caixa fechada para revender.    │
│     Assinante SuperDrop: 1º mês de Prata grátis│
│     [Começar grátis ▸]                        │
│ [Cg] Ônibus de excursão (Cargas)              │
│     Frete barato para o interior, pago no Pix.│
│ TODAS AS MARCAS                               │
│ [C] Commerce · loja própria com a sua marca   │
│ [Cl] Club · seus pontos valem em todas        │
└───────────────────────────────────────────────┘

Celular: o fio fica no topo; o lançador entra no menu "Mais" da barra de baixo.
```

### A10.8 Onde NÃO aparece
- **Na vitrine (loja) do lojista**: a loja é da marca dele, ainda mais na Loja Própria. Lá, no máximo o rodapé "feito com SuperDrop/Commerce" que já existe.
- No modo expedição (tablet de separação), no link do motorista ou do ajudante, nos balcões sem login, no checkout e nas telas de pagamento.
- No Master, onde o `BusinessPortal` já faz esse papel.

### A10.9 Regras que não podem quebrar
- **Um tenant nunca lê dado de outro:** a recomendação usa só os dados da própria pessoa.
- **Ligar contas entre marcas só com aceite** (conta do grupo). Nenhuma marca passa a ver os dados de outra.
- **Texto da marca vem de `getBrand()`**, nunca fixo.
- **A lista de marcas vem do cadastro de marcas** (`brand.ts`): marca nova entra sozinha no fio e no lançador.
- **Acessibilidade AA:**
  - o fio é decorativo (`aria-hidden`), e o lançador é o caminho acessível (botão com rótulo, gaveta com foco preso e fechamento com Esc);
  - nada depende só da cor (cada quadrado tem a inicial e o nome);
  - sem rolagem horizontal em 360 px.
- **Medição:**
  - impressões, aberturas do lançador, cliques por marca e convites vistos, aceitos e dispensados;
  - **cadastro cruzado e ativação cruzada** (o cliente de A que ativou em B);
  - "não mostrar mais" acima de um limite é sinal de convite errado.

### A10.10 Ao entrar numa marca que ainda não usa: a página de ativação
> **Pedido do dono:** "quando o cliente trocar para outra marca, claro que não pode liberar o painel, mas tem que ter uma landing page e botões para ativar e contratar, algo dinâmico e criativo, com uma copy convincente, e ativar com um clique o teste ou pagar de imediato com benefício."

**Comportamento:**
- Quando a pessoa toca numa marca que ainda não tem (pelo lançador, pelo fio do grupo, por um convite ou digitando o endereço do painel), ela **não vê erro, login nem cadastro do zero**.
- Ela vê a **página de ativação daquela marca, dentro do próprio ambiente**: com o fio do grupo, a Carteira e o nome dela.
- O painel da marca **continua fechado** até ativar.

**A página, de cima para baixo:**
1. **Abertura personalizada (dor → ganho em reais).** Usa só os dados da própria pessoa e nunca promete ganho. Exemplos:
   - SuperDrop → Brás: "Carla, você vendeu 38 peças este mês. Comprando em caixa fechada no Brás, você repõe o estoque direto das importadoras, sem intermediário."
   - Brás → Excursão: "Dona Cida, seus 4 fardos deste mês podem ir pelo ônibus que você já usa, com etiqueta e código de retirada."
   - Commerce → Brás: "Juliana, abasteça sua loja comprando do Brás em caixa fechada, com análise de produto antes de comprar."
   - Sem dado suficiente, entra a frase da persona, honesta e genérica.
2. **"Espie o painel".** Uma prévia animada do painel da marca, com **dados de demonstração rotulados como exemplo**. As bordas ficam suaves e há um cadeado com "liberado ao ativar". A pessoa vê o que vai ter antes de ter.
3. **Três ganhos concretos, cada um com ícone e número real:**
   - "112 importadoras na rede", "frete pago no Pix", "nota em dia com o Meu Contador";
   - os números vêm do banco, ao vivo, e **nunca são inventados**. Com pouco número, troca por um ganho sem número.
4. **Os três botões (o coração da página):**
   - **[Ativar 14 dias grátis]:**
     - um clique, sem cartão, com o aceite dos termos na mesma tela (caixa de seleção com o link);
     - pede só o dado que falta para aquela marca (o CNPJ na Brás, a placa e a rota na Cargas), num campo só;
     - no fim do teste, cai para o grátis da marca (A7).
   - **[Assinar agora com benefício]:**
     - Pix na própria página (QR e copia e cola);
     - o benefício do Passe do Grupo vem já calculado ("1º mês com 50% de desconto + 2.000 pontos", ou o anual "pague 8, leve 12");
     - liberação na hora em que o pagamento é conferido.
   - **[Liberar com o Club Total]:**
     - aparece quando a pessoa já tem o Club Total (entra direto, sem pagar nada a mais) ou quando ele sai mais barato que a soma das marcas que ela usa ("com a Brás, o Club Total já compensa: você economiza R$ X por mês").
5. **Risco zero, em uma linha:** "Cancela quando quiser. Seus dados ficam. O teste não cobra nada."
6. **Três perguntas frequentes** daquela marca, e o contato do suporte.

**Dinâmico e criativo (sem cara de anúncio):**
- **A copy muda pela combinação "de onde vem → para onde vai"** (persona de origem × marca de destino). A matriz fica no Master, versionada e com teste A/B (tabela abaixo).
- **Ao ativar:**
  - uma animação curta de "desbloqueio": o cadeado abre e o fio do grupo ganha o segmento da nova marca;
  - a pessoa cai **direto na trilha de primeiros passos** da marca nova (A9), com o primeiro marco já sugerido;
  - a Carteira ganha os pontos de boas-vindas.
- **A página lembra o meio do caminho:** se a pessoa começou a ativação e parou, o lançador mostra "falta 1 passo para ativar a Brás".
- **Sem urgência falsa:** contagem regressiva só quando a oferta tem prazo de verdade (por exemplo, o benefício de lançamento cadastrado no Master).

**Fórmula da copy (para todas as combinações):**
1. **Dor que a pessoa reconhece** (uma frase).
2. **Ganho em reais ou em tempo** (com o número dela, quando houver).
3. **Prova real** (número ao vivo da rede ou o que já funciona para ela no grupo).
4. **Risco zero** (teste, cancelar fácil, dados ficam).
5. **Um clique.**

É proibido: "lucre R$ X", "garantido", depoimento ou cliente inventado e urgência falsa.

**Matriz de mensagens (exemplos iniciais; o Master edita):**
| De → Para | Título | Benefício do Passe |
|---|---|---|
| SuperDrop → Brás | "Compre do Brás em caixa fechada, sem sair de casa" | 1º mês de Prata grátis |
| SuperDrop → Cargas (Excursão) | "Frete para o interior pelo ônibus, pago no Pix" | 1º fardo sem taxa |
| Commerce → Brás | "Abasteça sua loja direto das importadoras" | 2.000 pontos de boas-vindas |
| Brás → SuperDrop | "Revenda online o que você já compra no Brás" | Plano Começo + 14 dias de Pro |
| Brás → Excursão | "Seus fardos no ônibus que você já usa" | Pontos em dobro no 1º mês |
| Importadora → Commerce | "Sua loja própria para vender no varejo" | Migração com desconto |
| Ônibus → Club | "Seus passageiros ganham pontos: divulgue o cartão" | Selo de ônibus parceiro |
| Qualquer → Club Total | "Uma assinatura, todas as marcas" | Compare com o que você paga hoje |

## A11. O Club como assinatura que abre o ecossistema
> **Pedido do dono:** "talvez seja preciso focar no Club neste caso, porque com uma assinatura do Club a pessoa pode acessar todo o ecossistema."

### A11.1 Por que o Club é o lugar certo [inferência]
- **Ele já é a moeda e a identidade do grupo [fato]:** pontos, cartão com QR, vales, níveis, missões, ranking e acerto entre empresas (D115 a D122).
- **Uma marca de assinatura acima das outras** resolve o problema de "cada marca é uma ilha". O cliente paga uma vez e circula, e o grupo ganha no **uso cruzado** (taxa sobre as vendas, frete, compras na Mega Tron).
- **É o modelo de "assinatura que dá vantagem em tudo"** que o consumidor brasileiro já entende (programas de assinatura de marketplace e de delivery). A diferença aqui: a vantagem é **para o negócio** do cliente, não para o consumo.

### A11.2 Os três níveis (hipótese para testar)
| Nível | Preço (rascunho) | O que dá | Para quem |
|---|---|---|---|
| **Club** | Grátis | Pontos, cartão, vales, ranking, missões, porta grátis de cada marca | Todo cliente de qualquer marca, automático |
| **Club+** | Cerca de R$ 29,90/mês · R$ 239/ano ("pague 8, leve 12") | **Pontos em dobro** em tudo; **20% de desconto em qualquer plano de marca**; teste de 30 dias (em vez de 14) em qualquer marca; frete da Starline com desconto; prioridade no Meu Contador; condições da Mega Tron no balcão | Quem usa uma marca e quer começar outra |
| **Club Total** | Cerca de R$ 247/mês · anual "pague 8, leve 12" | **O plano de entrada pago de todas as marcas numa assinatura só**: Loja SuperDrop + Commerce Start + Brás Prata + Cargas Pro, e tudo do Club+ | Quem usa duas marcas ou mais |

**A conta do Club Total [inferência]:**
- a soma da entrada paga das quatro marcas hoje é cerca de R$ 490 (R$ 97 + R$ 149 + R$ 97 + R$ 147);
- por cerca de R$ 247, sai **quase pela metade**;
- quem usa só uma marca não tem motivo para trocar, então **a perda de receita fica limitada**;
- quem usa duas ou mais passa a usar mais, porque a **taxa sobre a venda e os serviços continuam valendo**.

**Guarda-corpos contra canibalizar a receita das marcas:**
- **a taxa sobre a venda continua em todos os níveis** (o grupo ganha quando o cliente vende);
- o Club Total inclui só o **plano de entrada** de cada marca. Os planos maiores (Commerce Pro e Scale, Brás Ouro e Platinum, Loja Própria) seguem à parte, com o desconto do Club+;
- serviços (Loja Pronta, migração, marketing, temas) seguem pagos, com desconto e pontos;
- os limites de uso do plano de entrada continuam iguais aos da marca.

### A11.3 Como aparece para o cliente
- **Na Carteira do Grupo (A9):** o selo do nível (Club, Club+, Club Total) ao lado do saldo, com "o que você ganharia com o Club+ este mês" em reais (pontos em dobro + descontos que ele teria usado).
- **No lançador e no fio do grupo (A10):** com o Club Total, **todas as marcas de entrada aparecem liberadas** (cadeado aberto). Com o Club+, aparecem com o desconto já aplicado.
- **Na página de ativação (A10.10):** o botão "Liberar com o Club Total" e a comparação honesta "você paga hoje R$ X em planos; com o Club Total pagaria R$ Y".
- **Comparativo simples** na página do Club: três colunas, os mesmos itens e o "recomendado para você", calculado com o uso real da pessoa.

### A11.4 Regras que não podem quebrar
- **Ponto não vira dinheiro**, não se saca nem se transfere.
- **A assinatura é da NextLevel** (fatura própria). Quem dá desconto em empresa do grupo entra no **acerto entre empresas** (D120).
- **Renovação com aviso e cancelamento simples** (CDC). Ao cancelar o Club Total, cada marca cai para o grátis dela (teste reverso), **sem bloquear e sem perder dados**.
- **Conta do grupo com aceite:** o Club Total só funciona com os perfis ligados à mesma pessoa (A10.2).
- **Nenhuma marca vê os dados da outra:** o Club guarda só nível, saldo e benefícios.

## A12. A jornada completa: como tudo se encaixa
**Exemplo: a Carla, do primeiro dia ao Club Total [hipótese].**
1. **Dia 1, SuperDrop:**
   - entra pelo convite do fornecedor (Marcos) no plano **Começo grátis**, com o teste reverso de 14 dias de Pro;
   - vê a **trilha de primeiros passos** e a **Carteira** (A9).
2. **Dia 3:** publica a loja (**+7 dias de Pro** e +300 pontos). A trilha comemora uma vez.
3. **Dia 9:** primeira venda (**+7 dias**). O **simulador** mostra "com as suas vendas, o Pro sai R$ 18 mais barato que o grátis" (A7).
4. **Dia 20:**
   - um **convite no momento certo** aparece quando ela procura frete para o interior: "Mande pelo ônibus da Excursão";
   - ela toca e cai na **página de ativação da Cargas** (A10.10);
   - ativa o teste em um clique.
5. **Dia 30:**
   - o **medidor do teste** mostra o que ela perde ao voltar ao grátis;
   - ela assina o **anual no Pix** ("pague 8, leve 12") e ganha **1 mês em pontos**.
6. **Mês 3:**
   - o fio do grupo e o lançador mostram a **Brás** recomendada;
   - a página de ativação compara: "você paga R$ X entre SuperDrop e Cargas; com o **Club Total** pagaria R$ Y e ainda ganha a Brás";
   - ela assina o Club Total, e as três marcas ficam com o cadeado aberto.
7. **Sempre:**
   - os pontos de tudo (compra na Mega Tron, fardo da Starline, indicações) vão para **uma Carteira só**;
   - o **resumo de economia** mostra quanto o grupo devolveu a ela no mês.

O mesmo desenho vale para a Dona Cida (Brás → Excursão → SuperDrop), a Juliana (Commerce → Brás) e o dono do ônibus (Cargas → Club).

## A13. Perguntas para o dono (respondem a Parte B mais rápido)
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
12. Barra do ecossistema: o fio colorido aparece também nas páginas públicas das marcas, ou só nos painéis? (Sugestão: nos dois.)
13. Creators e China Hub aparecem no lançador como "em breve · avise-me", ou ficam escondidas até abrir? (Sugestão: escondidas até haver produto, conforme a direção atual.)
14. Pode criar a "conta do grupo" (uma pessoa com perfis em várias marcas, ligados com aceite)? Ela é a base do "entrar direto" sem novo cadastro. (Sugestão: sim, começando pelas marcas em `*.nextlevelgroup.com.br`.)
15. A página de ativação pode usar os números da própria pessoa na abertura (por exemplo, "você vendeu 38 peças este mês")? (Sugestão: sim, só os dados dela e só dentro do ambiente logado.)
16. Club como assinatura: aprova testar os três níveis (Club grátis, Club+ por cerca de R$ 29,90 e Club Total por cerca de R$ 247)? (Sugestão: testar primeiro o Club+, que tem menos risco, e o Club Total com um grupo pequeno.)
17. No Club Total, quais planos de entrada entram? (Sugestão: Loja SuperDrop, Commerce Start, Brás Prata e Cargas Pro; os maiores seguem à parte, com desconto.)
18. Quais benefícios da Mega Tron e da Starline entram no Club+? (Sugestão: condição de atacado no balcão da Mega Tron e desconto no frete da Starline, com o acerto entre empresas.)

---

# PARTE B: o prompt (cole numa sessão nova)

## B0. Seu papel e o contrato
Você é o engenheiro mestre de produto e preço da NextLevel. Sua missão é **descobrir em profundidade quem usa cada marca** e transformar isso em **uma arquitetura única de entrada, preço, benefícios, cashback e ecossistema para o grupo, com o Club como a assinatura que liga todas as marcas**, implementada no motor que já existe, sem quebrar o SuperDrop em produção.

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

## B6c. Fase P5E: barra do ecossistema (fio do grupo, lançador e convite no momento certo)
Siga a seção A10. Ordem de construção:
1. **Variantes "ecossistema" das cores:** uma por marca, mesma luminosidade, par claro e escuro, em `src/lib/brand-palette.ts`, conferidas pelo validador de contraste. Entram na galeria do design system.
2. **Fio do grupo:** um componente na casca dos painéis e das páginas públicas, desenhado a partir de `brand.ts` (só marcas ativas, mais as "em breve" se o dono aprovar). Decorativo, com o segmento da marca em uso mais largo e o estado "acordado" ao passar o mouse ou tocar.
3. **Lançador:**
   - botão no cabeçalho (no celular, no menu "Mais") e uma gaveta com as três listas (suas marcas, recomendadas, todas);
   - as recomendações e os benefícios vêm de um domínio só, `src/lib/domain/ecossistema/lancador.ts`, que lê persona, perfis da pessoa, Passe do Grupo e Club. **O componente não decide regra.**
4. **Conta do grupo e passagem entre marcas:**
   - perfis por marca ligados à mesma pessoa, com aceite (estender o que o prompt do Club previu em `club_members`, sem duplicar usuários);
   - sessão compartilhada nos subdomínios de `nextlevelgroup.com.br` e passagem por código de uso único (curto, uma vez, com prazo) para os outros domínios;
   - sem aceite: abre o cadastro da outra marca com os dados preenchidos, e a pessoa confirma.
5. **Convites no momento certo:**
   - regras no Master (tela, persona, condição, texto, benefício, limite por sessão e por semana), versionadas e ligadas por marca;
   - cada convite visto, aceito ou dispensado vira um evento.
6. **Onde não aparece:** vitrine do lojista, expedição, motorista, balcões, checkout e pagamento (com teste que garante).

**Aceite:**
- capturas em 360, 768 e 1440 px, claro e escuro, em cada painel e página pública, mostradas ao dono antes de publicar;
- `axe` sem violação grave; gaveta com foco preso, Esc fecha, teclado completo; movimento reduzido respeitado;
- teste de domínio: recomendação por persona; uma marca nunca recebe dado de outra; limite de convites respeitado;
- passagem entre domínios: código de uso único, com prazo, recusado na segunda vez;
- e2e: o lojista do SuperDrop abre o lançador, vê a Brás recomendada com o benefício, entra na Brás pelo cadastro preenchido e o perfil fica ligado à mesma pessoa;
- nada aparece na vitrine do lojista nem na expedição;
- tudo atrás de chave, marca por marca, SuperDrop por último e com teste de regressão.

## B6d. Fase P5A: página de ativação ao trocar de marca
Siga a seção A10.10.
- **Domínio:**
  - `src/lib/domain/ecossistema/ativacao.ts` monta a página para a pessoa e a marca de destino: abertura personalizada (só dados dela), números reais da rede, benefício do Passe calculado, oferta válida no catálogo do Master e o que falta preencher;
  - **o componente não decide regra**.
- **Matriz de mensagens** "de onde vem → para onde vai" no Master: título, frases, benefício, teste A/B, versão e liga/desliga por marca.
- **Ativar em um clique:**
  - cria o perfil da marca ligado à mesma pessoa (conta do grupo, com aceite);
  - aplica a oferta reversa (`OfferRules`, B6);
  - pede só o dado que falta, num campo único;
  - registra o aceite dos termos (versão e data);
  - uma vez por CPF/CNPJ.
- **Assinar com benefício:** checkout corporativo existente (Pix, conferência no gateway, idempotência), com o benefício do Passe e os pontos.
- **"Espie o painel":** prévia com dados de demonstração rotulados, nunca dados reais de outra conta.
- **Retomada:** quem parou no meio vê "falta 1 passo" no lançador.
- **Aceite:**
  - capturas em 360, 768 e 1440 px;
  - `axe` sem violação grave;
  - teste de domínio:
    - a copy usa só os dados da própria pessoa;
    - os números da rede vêm do banco;
    - um teste por CPF/CNPJ;
    - a ativação liga o perfil e cai na trilha;
  - e2e: a revendedora do SuperDrop ativa a Brás em um clique e vê a trilha da Brás; outra ativa pagando no Pix (Mercado Pago simulado) e recebe os pontos;
  - nenhum texto proibido (promessa de ganho, urgência falsa).

## B6e. Fase P5C: o Club como assinatura do ecossistema (Club+, Club Total)
Siga a seção A11. Só depois da P4 (arquitetura de preço) aprovada.
- **Catálogo:**
  - Club+ e Club Total entram como produtos do catálogo do Master (família nova, preço versionado, mensal e anual);
  - a concessão de acesso (`entitlements`) libera o plano de entrada de cada marca e os multiplicadores do Club;
  - **nada de preço fixo no código**.
- **Regras:**
  - o multiplicador de pontos e o desconto em planos ficam nas regras do Club (`club.rules`), com versão e auditoria;
  - o desconto respeita "não acumula com o desconto do parceiro" quando a regra disser.
- **Cancelamento e inadimplência:** cada marca cai para o grátis dela (teste reverso), sem bloquear e sem perder dados, com a régua de cobrança atual.
- **Telas:**
  - comparativo dos três níveis com o "recomendado para você";
  - selo do nível na Carteira;
  - cadeados abertos no lançador;
  - botão "Liberar com o Club Total" na página de ativação.
- **Simulação antes de publicar:** receita de 12 meses com e sem o Club Total (motor `engine.ts`), mostrando quanto se perde em mensalidade e quanto se ganha em taxa, serviços e uso cruzado.
- **Aceite:**
  - teste de domínio:
    - o Club Total libera o plano de entrada de todas as marcas e mais nada;
    - a taxa sobre a venda continua;
    - o cancelamento devolve cada marca ao grátis;
    - o acerto entre empresas recebe os descontos;
  - e2e: assinar o Club Total no Pix e ver todas as marcas liberadas;
  - aprovação do dono por escrito antes de ligar.

## B6f. Ordem recomendada das fases
| Ordem | Fase | Depende de |
|---|---|---|
| 1 | P0 fonte única de preço | — |
| 2 | P1 dados reais · P2 entrevistas | P0 |
| 3 | P3 personas validadas | P1, P2 |
| 4 | P4 arquitetura de preço (inclui os níveis do Club) | P3 |
| 5 | P5 ofertas no motor (grátis, teste reverso, anual, cashback) | P4 |
| 6 | P5V benefícios gamificados (Carteira, trilha, medidor, simulador) | P5 |
| 7 | P5E barra do ecossistema · P5A página de ativação (com a conta do grupo) | P5V |
| 8 | P5C Club+ e Club Total | P4, P5A |
| 9 | P6 experimento e leitura | cada fase acima, ao ligar |

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
