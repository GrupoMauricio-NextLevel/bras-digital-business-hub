# Arquitetura de entrada e preço do grupo (fase P4, D125 em rascunho)

> **Onde mexer:** Master → Financeiro NextLevel → **Proposta de preço** (`/master/financeiro/proposta`). A tela guarda o rascunho, refaz a conta a cada ajuste e compara com o modelo de hoje (lido do catálogo e da tabela do SuperDrop).
> **Nada aqui muda preço de cliente.** Ligar as peças é a fase P5, com a aprovação do dono por escrito.

## 1. Porta de entrada por marca
| Marca | Hoje | Proposta |
|---|---|---|
| Commerce | 3 dias grátis, 1º mês R$ 9,90, depois Start R$ 149 | **Começo grátis** (2,5% sobre a venda, até 50 produtos, com selo) + **teste reverso de 14 dias do Pro** + **dias por conquista** (+7 ao publicar, +7 na 1ª venda, até 30) |
| SuperDrop (lojista) | 7 dias com cupom do fornecedor, depois bloqueia | **Começo grátis** (7% sobre a venda) + o mesmo teste reverso e os dias por conquista |
| Brás, Cargas, Excursão | Já grátis na porta | Continua; o pago vira "grátis no mês em que comprar acima de R$ X" (Brás) e destaque (Cargas) |

Por que o grátis com taxa: a P1 aceita "só pago quando vendo" [hipótese, a validar]; quem não assina continua vendendo e rendendo taxa, em vez de sair no bloqueio.

## 2. Escada de planos e quando cada um se paga (cenário base)
| Marca | Plano | Mensal | Taxa | Sai mais barato que o grátis a partir de |
|---|---|---|---|---|
| Commerce | Começo | grátis | 2,5% | — |
| Commerce | Start | R$ 89 | 1% | R$ 5.933 de venda/mês |
| Commerce | Pro | R$ 199 | 0,7% | R$ 11.056 |
| Commerce | Scale | R$ 449 | 0,4% | R$ 21.381 |
| SuperDrop | Começo | grátis | 7% | — |
| SuperDrop | Loja | R$ 79 | 4% | R$ 2.633 |
| SuperDrop | Própria | R$ 179 | 2,5% | R$ 3.978 |

O painel vai mostrar ao cliente a conta com as vendas dele ("com as suas vendas, o Pro sai R$ X mais barato"): o upgrade é matemática, não insistência.

## 3. Ciclos
- **Anual no Pix "pague 8, leve 12"** (cerca de 33% de desconto) em todas as marcas, no lugar dos 25% de hoje da Commerce. Preço travado por 12 meses e garantia de 30 dias.
- Alternativa a testar depois: 12x no cartão a preço de anual.

## 4. Cashback do grupo em pontos do Club
- **5% da mensalidade** vira pontos do Club (ajustável).
- Vale em serviços do grupo (tema, Loja Pronta, Meu Contador, frete Starline, Mega Tron).
- **Custo real ≈ metade do valor de face**, porque o ponto é gasto em serviço com margem de 50% (`services.targetMarginBps`). A conta da tela já desconta isso.
- Quem paga: a empresa onde o ponto é usado acerta com a que o deu (acerto entre empresas, D120).
- Ponto não vira dinheiro; validade e teto seguem as regras do Club.

## 5. Passe do Grupo e indicação
- Passe: assinatura de uma marca dá vantagem nas outras (ex.: Commerce Pro → Brás Prata por 3 meses), pelo motor de acessos (`entitlements`) e pelo nível do Club. Desenho completo na fase P5A.
- Indicação: os dois lados ganham 1 mês em pontos; não acumula com o desconto do parceiro (regra atual da Commerce).

## 6. Simulação de 12 meses (cenários como hipótese, valores da tela em 2026-10-11)
Resultado = receita menos infraestrutura (R$ 8 por cliente/mês), cobrança (2%) e o custo real do cashback.

| Marca | Cenário | Resultado hoje | Resultado proposta | Proposta com a conversão de hoje |
|---|---|---|---|---|
| Commerce | Pessimista | R$ 5.806 | R$ 10.096 | R$ 5.797 |
| Commerce | Base | R$ 25.975 | R$ 83.463 | R$ 65.698 |
| Commerce | Otimista | R$ 91.255 | R$ 429.805 | R$ 377.792 |
| SuperDrop | Pessimista | R$ 3.937 | R$ 6.525 | R$ 4.486 |
| SuperDrop | Base | R$ 16.202 | R$ 90.886 | R$ 77.085 |
| SuperDrop | Otimista | R$ 82.531 | R$ 589.778 | R$ 540.777 |

**Leitura honesta:**
- Quase todo o ganho vem de **quem não assina continuar no grátis pagando taxa** (hoje essa pessoa sai). Por isso a coluna "com a conversão de hoje" já ganha do modelo atual no base e no otimista.
- No **pessimista da Commerce**, com a conversão de hoje, a proposta empata com o modelo atual: se pouca gente vender no grátis, o grátis só se paga. É o cenário a vigiar.
- Os números dependem de duas hipóteses: **quanto o cliente do grátis vende** e **quantos chegam a vender**. A Descoberta (P1) mede as duas; troque os cenários pelos números reais assim que houver um mês de dados.

## 7. Guarda-corpos (aceite da fase)
| Regra | Situação no rascunho (cenário base) |
|---|---|
| O grátis cobre o custo de servir | Commerce: rende R$ 26 e custa R$ 9 por cliente/mês (média, contando quem não vende). SuperDrop: R$ 25 × R$ 9. **Passa.** |
| Nenhum plano custa mais do que rende | Todos com margem positiva (Start R$ 101, Pro R$ 190, Scale R$ 404; Loja R$ 112, Própria R$ 187). **Passa.** |
| Aprovação do dono por escrito | **Pendente** (pergunta da última fase). |

## 8. O que falta para virar regra (fase P5)
1. Aprovação do dono (valores e peças).
2. `OfferRules` com modo grátis, teste reverso, dias por conquista, anual e cashback, tudo desligado por padrão.
3. O acesso da loja cai para o grátis em vez de bloquear (SuperDrop por último, com teste de regressão).
