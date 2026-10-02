# Racional global do negócio: análise crítica e recomendações

> Escrito em 2026-10-02 a pedido do dono ("não tome o que está feito como 100% certo"). **Todo número de receita aqui é ilustrativo**: depende de quantos membros entram e de quanto cada um vende, o que ainda ninguém mediu. Os preços "hoje" são os **padrões do código** (`src/lib/finance/price-book.ts`); o valor vivo no Master pode ser outro. Nada aqui foi aplicado: são propostas para o dono aceitar ou recusar (viram D42 e ajustes no price book).

## 1. Diagnóstico em uma frase
O sistema técnico está bem à frente do modelo de negócio: há **muita regra de cobrança, mas nenhuma validada com cliente pagante**. O maior risco não é técnico, é cobrar de mais cedo ou de forma complicada demais de quem ainda não vendeu nada, e dispersar foco em cinco produtos.

## 2. O que existe hoje (padrões do código)
| Quem | Cobrança |
|---|---|
| Fornecedor (Central) | Start R$497, Growth R$997, Scale R$1.997 por mês, **mais** SuperDrop: 3% sobre volume com mínimo R$300/mês (ou White Label: setup R$15 mil + R$2 mil/mês + 1,5%) |
| Membro | Drop manual R$49 + 5% · Loja SuperDrop R$97 + setup R$200 + 5% · Loja própria R$197 + setup R$2.000 + 3% |
| Temas | PRO R$297 + R$39/mês · ELITE R$697 + R$89/mês |
| Extras | Academy R$47, Suporte Premium R$97, Relatórios R$29, assento R$19 |
| Parceiro | 15/20/25% do setup por ativações no mês + 5% de manutenção; taxa de inatividade R$100 |
| Custo assumido | cobrança 2%, infra R$8/loja, **suporte R$500 por fornecedor** |

## 3. Problemas encontrados (do mais grave ao menor)

1. **Fornecedor Start dá prejuízo no papel.** Custo de suporte assumido R$500/mês contra mensalidade R$497. Só fecha conta com o mínimo/volume somado, e nem o código nem a tela deixam claro se as duas cobranças somam. Fornecedor é o lado que traz o catálogo: cobrar caro dele afasta justamente quem destrava os membros.
2. **Taxa de 5% + Mercado Pago (~4–5%) = ~10% de cada venda.** Em dropshipping a margem do lojista costuma ser 20–35%. Pagar 10% à plataforma mais mensalidade torna a Nuvemshop/Shopify mais atraente. A "loja própria" com 3% é mais barata que a "loja SuperDrop" com 5%, o que inverte a lógica de escada (quem paga menos de mensalidade paga mais de taxa, mas o salto é pequeno).
3. **Base da taxa é declarada pelo lojista nos pedidos manuais (WhatsApp, Instagram, balcão).** Quem quiser fugir da taxa registra preço baixo ou nem registra. Só é confiável a taxa sobre venda **paga dentro da plataforma** (confirmada na API do Mercado Pago).
4. **Cobrar no fim do mês, por fatura, quem não vendeu.** Gera inadimplência e esforço de cobrança. O caminho padrão de mercado é reter a taxa **na hora do pagamento** (divisão/comissão da aplicação no Mercado Pago), sem fatura.
5. **Setup de R$200 (Loja SuperDrop) e R$2.000 (Loja própria)** são atrito na porta de entrada, para um produto que ainda não tem prova de resultado. Já existe isenção de 90 dias; o setup deveria ser o contrário do que é: zero na entrada, cobrado só por serviço feito.
6. **Temas com compra única + mensalidade (PRO R$297 + R$39/mês)** é cobrança dupla pelo mesmo bem; confunde. Escolher um: assinatura que inclui os temas do plano.
7. **Programa de parceiros fraco e punitivo.** Comissão só sobre o setup (R$200 → R$30–50 por indicação) + 5% de manutenção. Para o parceiro, o ganho recorrente deveria ser sobre a **mensalidade**, não sobre o setup. E a **taxa de inatividade de R$100 para parceiro** afasta afiliados (e tem risco jurídico/reputacional); trocar por perda de nível/ranking.
8. **Pix 10% de desconto vs. cartão em 6x** sobre o preço de lista: com cartão em 6x a plataforma antecipa o risco; vale conferir que o desconto cobre o custo, senão vira prejuízo disfarçado.
9. **Cinco frentes ao mesmo tempo** (SuperDrop, Commerce, Hub Creators, Brás Digital, China Hub). Só SuperDrop tem clientes. Cada frente nova divide atenção, suporte e dinheiro.
10. **Posicionamento do Commerce.** "Mais uma loja virtual" compete com Nuvemshop, Loja Integrada, Shopify, Yampi. O diferencial real e defensável é **catálogo de fornecedores pronto + pedido que vai direto ao fornecedor + frete e Pix resolvidos**. Vender isso, não "loja bonita".

## 4. O que eu faria no seu lugar

### 4.1 Preços e planos (proposta, a validar com 5 a 10 clientes reais)
**Membro: escada simples e previsível, 3 degraus, taxa decrescente.**

| Plano | Mensalidade | Taxa sobre venda paga na plataforma | Para quem |
|---|---|---|---|
| Começo | **R$0** | **4%** | quem ainda não vendeu; sem risco, sem setup |
| Loja | **R$97** | **2,5%** | já vende; loja em subdomínio, temas básicos |
| Marca | **R$197** | **1,5%** | domínio próprio, temas premium, relatórios, equipe |

- Ponto de virada (ilustrativo): de Começo para Loja compensa a partir de ~R$6.500/mês vendidos (97 ÷ 1,5%); de Loja para Marca, a partir de ~R$10.000/mês (100 ÷ 1%). O lojista **sobe de plano porque quer pagar menos**, não porque a plataforma empurra.
- **Sem setup**; temas incluídos no plano (Marca inclui premium). Migração/identidade visual vira **serviço** à parte (já há tabela de serviços).
- Pedido manual (fora da plataforma): **taxa fixa pequena por pedido** (ex.: R$1) em vez de percentual declarado. Remove a manipulação e o incentivo a esconder venda.
- Vale o teto mensal de taxa (ex.: nunca pagar mais que a mensalidade do plano acima) para o lojista grande não migrar.

**Fornecedor: barato para entrar, ganha com volume.**
- Entrada **grátis ou simbólica** (ex.: R$0 até 100 produtos) + **2% sobre pedidos que passam pelo fornecedor** (ele embute no preço de atacado). Sem mínimo mensal de R$300 nos primeiros 90 dias.
- Planos pagos só por **capacidade** (mais produtos, mais assentos de expedição, suporte prioritário), não por existir.
- Suporte não pode custar R$500 por fornecedor: automatizar (base de ajuda, Academy) e cobrar o Suporte Premium de quem quer atendimento humano.
- White Label (R$15 mil + R$2 mil/mês): manter como **venda consultiva**, nunca em tela de autoatendimento.

**Parceiros (afiliados/influenciadores):**
- Pagar **recorrente** (ex.: 20% da mensalidade do indicado por 12 meses) + bônus único pequeno por ativação. Recorrência é o que faz o parceiro continuar indicando.
- Remover a taxa de inatividade; usar nível (Bronze/Prata/Ouro) por ativações vivas.
- Manter carência de 7 dias e pagamento semanal (bom).

### 4.2 Fluxo do dinheiro
- **Cobrar a taxa no ato da venda** via Mercado Pago (comissão da aplicação) para vendas pagas na plataforma, em vez de fatura mensal. Exige o Mercado Pago do lojista conectado por OAuth da NextLevel (hoje o modelo usa o token do próprio lojista; validar viabilidade com a conta real antes de mudar).
- Fatura mensal fica **só para mensalidade** (cartão recorrente ou Pix), com a régua de cobrança que já existe.
- Nunca tocar no dinheiro do lojista/fornecedor (a regra atual de cada um receber na própria conta é boa: evita virar instituição de pagamento).

### 4.3 Foco e sequência (o que mais move o ponteiro)
1. **SuperDrop primeiro**: tem clientes e lojas esperando. Descobrir e remover o que trava a subida deles. Receita real > novos produtos.
2. **Commerce depois**, vendido como "loja com fornecedor embutido", abrindo para **10 lojistas convidados** (cadastro fechado → por convite), cobrando só quando houver venda (plano Começo).
3. **Master unificado** só o necessário para operar 1 e 2.
4. Hub Creators, Brás Digital e China Hub: **só depois** de existir receita recorrente nos dois primeiros e de um critério claro (ex.: "50 lojas ativas"). Coerente com D40.

### 4.4 Métricas para decidir (hoje não existem no Master)
Lojas ativas (com venda nos últimos 30 dias, não só cadastradas) · vendas por loja · taxa de ativação (cadastro → 1ª venda em 14 dias) · churn mensal · custo de suporte por loja · inadimplência. Sem isso, qualquer preço é palpite.

## 5. Cenário ilustrativo (só para dar ordem de grandeza)
Suposição: 100 lojas ativas, venda média de R$8.000/mês cada (**número inventado**, validar), distribuição 50 Começo / 40 Loja / 10 Marca.
- Mensalidades: 40×97 + 10×197 = **R$5.850**
- Taxas: 50×(8.000×4%) + 40×(8.000×2,5%) + 10×(8.000×1,5%) = 16.000 + 8.000 + 1.200 = **R$25.200**
- Total ≈ **R$31 mil/mês** antes de custos (infra ~R$8/loja = R$800, cobrança, suporte, parceiros ~20% da mensalidade).
- Lição: **a receita depende de GMV (vendas dos lojistas), não de mensalidade.** O negócio é fazer o lojista vender; por isso ajudar a primeira venda (Academy, catálogo pronto, tráfego) vale mais que otimizar R$10 de mensalidade. Se o GMV médio for R$2.000, o mesmo cenário rende ~R$13 mil.

## 6. Riscos e o que validar antes de mudar valores
- Quanto os preços vivos no Master diferem do código (conferir `platform_settings`).
- Mercado Pago aceita a comissão da aplicação no modelo atual de conexão do lojista?
- Margem real dos fornecedores atuais: aguentam embutir 2%?
- Disposição a pagar: perguntar a 5–10 clientes do SuperDrop antes de publicar a nova tabela. **Não mexer em preço de cliente que já paga sem aviso e sem trava** (o sistema já tem `priceLockMonths`, 12 meses).
- Aspectos fiscais (nota sobre comissão/serviço) a confirmar com contador.

## 7. Como isso vira trabalho (se aprovado)
1. D42 em `DECISIONS.md` com o que for aceito.
2. Ajuste do `DEFAULT_PRICE_BOOK` + plano "Começo" gratuito + taxa fixa para pedido manual + parceiros recorrentes (tudo via `platform_settings`, com testes e trava de preço para quem já contratou).
3. Painel de métricas de lojas ativas no Master.
4. Comissão no ato da venda (depois de validar com o Mercado Pago).
