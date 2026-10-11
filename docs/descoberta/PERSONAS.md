# Personas v1 (fase P3, D125)

> **Origem:** seção A5 do prompt `docs/prompts/publico-personas-precos-ecossistema.md`, agora com **fonte em cada afirmação** e o que já se sabe pelo sistema.
> **Marcação:** **[sistema]** = fato do código ou do banco (com o arquivo); **[mercado]** = referência pública de concorrente ou pesquisa; **[hipótese]** = ainda a validar nas entrevistas (`ROTEIROS.md`) e no questionário de preço (Master → Descoberta).
> **Regra desta versão:** nada aqui é dado de produção ainda. Quando a Descoberta tiver um mês de números e as primeiras entrevistas, esta página vira v2, com o que mudou marcado.

## Como ler cada cartão
Quem é · trabalho a ser feito · gatilho · objeções · primeiro valor (o "aha") e em quanto tempo · métrica de ativação (a etapa do funil que a mede) · quanto paga · canal · por que fica e por que sai · **quem não é**.

---

### P1. Carla, revendedora que começa pelo celular (SuperDrop)
- **Quem é:** 22 a 45 anos, vende para conhecidos no Instagram e no WhatsApp, renda extra, sem estoque, MEI ou sem CNPJ. [hipótese]
- **Trabalho:** vender sem comprar estoque e sem loja feia. [hipótese]
- **Gatilho:** convite de um fornecedor (Central) que já tem rede. [sistema: cupom do fornecedor dá o teste, `coupons.trial_days`, `store-access.ts`]
- **Objeções:** pagar antes de vender; o acesso **bloqueia** no fim do teste. [sistema: D-P1, `store-access.ts`]
- **Primeiro valor:** loja no ar com o catálogo da rede e a **1ª venda paga**. Meta: loja no ar no dia 1, 1ª venda em até 14 dias. [hipótese]
- **Ativação:** etapa "1ª venda paga" do funil SuperDrop. [sistema: `funil.ts`]
- **Quanto paga:** até cerca de R$ 50/mês antes de vender; aceita taxa sobre a venda. [hipótese; hoje paga R$ 49 a R$ 197 + 3% a 5% por pedido, sistema: `price-book.ts`]
- **Canal:** fornecedor (cupom) e indicação. [sistema: origem "Fornecedor (cupom)" na Descoberta]
- **Fica** por venda recorrente e recarga simples; **sai** depois de 2 a 3 semanas sem venda. [hipótese]
- **Não é:** quem quer marca própria com estoque (é a P3).

### P2. Marcos, fornecedor que quer rede de revendedoras (SuperDrop Central)
- **Quem é:** confecção ou atacado com estoque e capacidade de separar. [hipótese]
- **Trabalho:** 50 a 500 revendedoras com pedido e Pix organizados. [hipótese]
- **Objeções:** setup alto antes de ver a rede ativar. [sistema: faixas de fornecedor R$ 497 a R$ 1.997 + setup, `price-book.ts`]
- **Primeiro valor:** 1ª revendedora com pedido pago na esteira. [hipótese]
- **Ativação:** lojas da rede com 1ª venda paga (funil SuperDrop filtrado por rede, a fazer na v2). [sistema parcial]
- **Canal:** venda direta e parceiro. **Ele é o canal de aquisição da P1.** [sistema: cupom do fornecedor]
- **Não é:** loja única que vende direto ao consumidor.

### P3. Juliana, marca de moda que cresceu no Instagram (Commerce)
- **Quem é:** marca própria, fatura de R$ 10 mil a R$ 100 mil/mês entre Instagram, WhatsApp e marketplace. [hipótese]
- **Trabalho:** loja bonita que converta e tire a dependência do marketplace. [hipótese]
- **Objeções:** migrar dá trabalho; o Start custa cerca de 2x o equivalente do concorrente. [sistema: Start R$ 149, `catalog-seed.ts`; mercado: planos de entrada dos concorrentes na faixa de R$ 60 a R$ 90]
- **Primeiro valor:** a loja com o tema e os produtos, vista no celular, no 1º dia. [hipótese]
- **Ativação:** "loja publicada" e "1ª venda paga" no funil Commerce. [sistema]
- **Quanto paga:** R$ 69 a R$ 250/mês se vender mais; tema e Loja Pronta à vista no Pix. [hipótese]
- **Canal:** parceiro (agência), orgânico. [sistema: origem "Parceiro"]
- **Sai** por taxa alta ou loja lenta. [hipótese]
- **Não é:** revendedora sem estoque (P1).

### P4. Rodrigo, migrante insatisfeito (Commerce)
- **Quem é:** já tem loja em outra plataforma; reclama de custo em dólar, visual genérico ou suporte. [hipótese]
- **Primeiro valor:** **ver a própria loja migrada numa prévia** antes de pagar. [hipótese]
- **Objeção:** pagar R$ 1.497 de migração sem ver o resultado. [sistema: produto de migração no catálogo]
- **Não é:** quem está começando do zero (P3 ou P1).

### P5. Dona Cida, lojista do interior que compra no Brás (Brás Digital)
- **Quem é:** 35 a 65 anos, loja de utilidades no interior, CNPJ ou MEI, vai ao Brás de excursão 1 a 4 vezes por mês. [hipótese]
- **Trabalho:** comprar caixa pelo preço do Brás sem perder o dia de viagem, com o fardo chegando na cidade. [hipótese]
- **Objeções:** "não conheço a importadora", "e se não chegar", "não sei usar aplicativo". [hipótese]
- **Primeiro valor:** preço da caixa e frete do ônibus no mesmo lugar; o 1º fardo entregue. [sistema: Excursão, D111 a D119]
- **Ativação:** "1º pedido pago" no funil Brás. [sistema]
- **Quanto paga:** sensível a mensalidade, paga por economia comprovada; gosta de cashback. [hipótese; sistema: Club com pontos por compra, D120]
- **Canal:** guia de excursão, vídeo de descoberta, indicação do Club. [sistema: origens na Descoberta]
- **Sai** depois de um problema de entrega. [hipótese]
- **Não é:** quem compra uma peça para uso próprio.

### P6. Rafael, vendedor de marketplace que caça produto (Brás, planos pagos)
- **Primeiro valor:** a análise do produto (vídeo e veredito) e o preço da caixa. [sistema: descobertas e análises, D94]
- **Quanto paga:** R$ 97 a R$ 397/mês por informação. [sistema: Prata, Ouro, Platinum em rascunho no catálogo]
- **Ativação:** "assinou um plano" no funil Brás. [sistema]
- **Não é:** a Dona Cida (compra para loja física e não paga por informação). [hipótese]

### P7. Importadora do Brás
- **Primeiro valor:** o 1º pedido de fora de São Paulo pago e retirado com código. [sistema: retirada com código, D97]
- **Quanto paga:** comissão sobre a venda; mensalidade só com volume. [sistema: Importadora Pro e Premium em rascunho]
- **Não é:** loja de varejo do Brás (P10).

### P8. Mauricio, dono do ônibus de excursão (Excursão)
- **Primeiro valor:** a 1ª viagem com fardos reservados pelo painel e o Pix recebido. [sistema: D111, D119]
- **Quanto paga:** por fardo transportado, nunca mensalidade no início. [sistema: taxa por fardo existe e está desligada]
- **Ativação:** "1ª carga ou viagem" e "1ª entrega" no funil Cargas. [sistema]

### P9. Transportadora pequena regional (Cargas)
- **Primeiro valor:** a 1ª coleta no Brás vinda de uma importadora. [sistema: D100]
- **Quanto paga:** comissão sobre o frete; plano pago para destaque. [sistema: comissão por plano e 20 cargas grátis/mês, `bras.rules`]

### P10. Loja do Brás sem nota (Nota Fácil e Meu Contador)
- **Primeiro valor:** a 1ª nota em minutos e o fardo embarcando. [sistema: Meu Contador, D117]
- **Quanto paga:** por emissão ou pacote. [sistema: preço do chamado existe, cobrança desligada]

### P11. Guia de excursão (Club)
- **Primeiro valor:** os pontos dos passageiros virando desconto de verdade. [sistema: guia no balcão, D121]

### P12. Parceiro (consultor, agência, influenciador)
- **Primeiro valor:** a 1ª comissão liberada. [sistema: carência e liberação, D90]

---

## Mapa da jornada e pontos de fricção (numerados, com a tela)
| # | Persona | Momento | Fricção | Tela | Fonte | Fase que resolve |
|---|---|---|---|---|---|---|
| F1 | P1 | Fim do teste de 7 dias | Acesso bloqueia antes da 1ª venda | `/merchant` (bloqueio e pagamento) | [sistema] `store-access.ts` | P5 (cai para o grátis) |
| F2 | P1 | Antes de vender | Mensalidade antes da 1ª venda | página de planos do SuperDrop | [sistema] `price-book.ts` | P5 (Começo grátis com taxa) |
| F3 | P3 | Teste | 3 dias não dá para importar e ver a loja pronta | `/merchant` (Commerce) | [sistema] oferta de entrada | P5 (teste reverso de 14 dias + dias por conquista) |
| F4 | P3 | Comparação de preço | Start acima do equivalente de mercado | `/commerce/planos` (público) | [sistema + mercado] | P4/P5 (Start R$ 89 proposto) |
| F5 | P4 | Decidir migrar | Pagar migração sem ver a prévia | catálogo Loja Pronta/migração | [hipótese] | P5V (prévia antes de pagar) |
| F6 | P5 | 1º pedido | Não conhece a importadora | Meu Brás → pedido | [hipótese] | P5V (selos e reputação) |
| F7 | P5 | Plano pago | O plano não fala de economia em reais | Meu Brás → planos | [hipótese] | P5V (simulador de economia) |
| F8 | P2 | Contratar | Setup alto antes da rede ativar | proposta do fornecedor | [sistema] | P4 (setup por meta) |
| F9 | P8 | Receber | Pix do frete ainda desligado | painel do ônibus | [sistema] D119 | depende do dono (ligar) |
| F10 | Todas | Trocar de marca | Não descobre as outras marcas do grupo | todos os painéis | [sistema] sem barra do ecossistema | P5E/P5A |

## O que validar primeiro (ordem)
1. **F1 e F2** (P1): quanto a taxa sobre a venda é aceita no lugar da mensalidade (questionário na marca SuperDrop + 5 entrevistas).
2. **F3 e F4** (P3): faixa aceitável do plano de entrada da Commerce (questionário) e o tempo real até "loja publicada" (funil).
3. **F7** (P5): se a economia em reais muda a decisão de assinar (entrevistas).
