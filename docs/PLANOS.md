# Planos, preços e taxas: racional (v2, propostas a validar)

Esta versão corrige a anterior. A NextLevel **não define preço de produto**: fornecedores e membros decidem o que vendem e por quanto. A NextLevel cobra **mensalidades, setup, taxa de transação, serviços e Academy**. Nada aqui foi implementado no código ainda. Itens marcados **(proposta)** ainda não foram decididos.

## 0. Decisões confirmadas pelo dono (prevalecem sobre o restante deste arquivo)
**Taxa por pedido**
- Membro: **Loja Própria 3%**, **loja básica (subdomínio) 5%**, **Drop manual 5%**.
- Fornecedor: **SuperDrop (subdomínio) 3%**, **White Label 1,5%**. (Substitui os 5% e 2% ditos antes.)
- **Base sem frete**: o frete é pago pelo cliente final. Estorno **devolve a taxa**. **Pedidos de teste não pagam taxa.**
- **Fornecedores: taxa zero nos primeiros 15 dias.**

**Fornecedor: setup e mensalidade**
- **SuperDrop (subdomínio):** setup **R$ 1.500**, mensalidade **R$ 300**, taxa 3%.
- **White Label:** setup **R$ 15.000**, mensalidade **R$ 2.500**, taxa 1,5%.
- Os degraus Start/Growth/Scale deixam de existir: é um plano SuperDrop único.

**Formas de pagamento e descontos**
- **Não há desconto por ciclo nos planos.** Semestral e anual são o mesmo valor mensal pago adiantado. **O desconto de 15% (semestral) e 25% (anual) vale só para os serviços da Loja NextLevel.**
- **Pix = preço de lista.** O cartão soma um **acréscimo**; "desconto no Pix" é apenas não pagar esse acréscimo. Parcelado em 2 a 6x = lista ×1,14 (14% já simulado no Mercado Pago).
- Lojas e recargas: só Pix. Academy à parte, com ofertas periódicas.

**Pendente:** (1) acréscimo do cartão em 1x (proposta 5%, igual à tarifa); (2) valor da mensalidade dos membros (Drop, SuperDrop, Loja Própria), que sem desconto de ciclo pode ficar em R$ 49, R$ 97 e R$ 197 (tabela atual) ou nos valores propostos antes; (3) setup da Loja Própria (R$ 2.400) e o benefício de lançamento de 12 meses grátis; (4) prazo da comissão dos fundadores.

## 1. De onde vem a receita da NextLevel
| Fonte | Quem paga | Observação |
|---|---|---|
| **Taxa por pedido (2% a 5%)** | Fornecedor e membro, cada um sobre a sua venda, **qualquer que seja o preço** que pratique | Percentual por tipo de plano (item 6) |
| **Mensalidade da plataforma** | Membro e fornecedor | Mensal, semestral, anual |
| **Setup** | Fornecedor (para entrar) e Loja Própria (white label) | Separado da mensalidade |
| **Serviços da Loja NextLevel** | Fornecedor e membro | Descontos por ciclo (item 5) |
| **Academy e add-ons** | Membro e fornecedor | **À parte**; ofertas periódicas |

## 2. Como cada um paga
- **Planos da NextLevel:** Pix ou **cartão de crédito**. Cartão em 1x paga o preço cheio; parcelado em 2 a 6x paga o preço cheio ×1,14 (o Mercado Pago cobre esse custo, já simulado).
- **Recargas de saldo e lojas dos membros:** **somente Pix**, no Mercado Pago do fornecedor (recargas) e no de cada membro (vendas da loja). **Não aceitam cartão.**
- **Desconto para pagamento à vista (Pix):** existe, mas o percentual **ainda não foi definido**. Sugestão de partida: 5%, porque a tarifa do Pix (cerca de 1%) é cerca de 4 pontos menor que a do cartão em 1x (cerca de 5%), deixando o valor líquido da NextLevel praticamente igual. Você decide o número.

## 3. Membro: mensalidade da plataforma
Mensal é a âncora (mais cara). **Semestral −15% e anual −25% (proposta: mesmos percentuais dos serviços, para ser simples de comunicar).** Preço cheio = cartão 1x.

| Plano | Mensal | Semestral (total · por mês) | Anual (total · por mês) |
|---|---|---|---|
| **Drop manual** | R$ 69 | R$ 352 · R$ 58,67 | R$ 621 · R$ 51,75 |
| **Loja SuperDrop** (subdomínio) | R$ 139 | R$ 709 · R$ 118,17 | R$ 1.251 · R$ 104,25 |
| **Loja Própria** (white label) | R$ 279 | R$ 1.423 · R$ 237,17 | R$ 2.511 · R$ 209,25 |

Parcelado no cartão (×1,14), total e parcela em 6x:
| Plano | Semestral | Anual |
|---|---|---|
| Drop manual | R$ 401,28 · R$ 66,88 | R$ 707,94 · R$ 117,99 |
| Loja SuperDrop | R$ 808,26 · R$ 134,71 | R$ 1.426,14 · R$ 237,69 |
| Loja Própria | R$ 1.622,22 · R$ 270,37 | R$ 2.862,54 · R$ 477,09 |

O mensal é pago em Pix (ou cartão em 1x, mês a mês, sem recorrência automática).

## 4. Loja Própria (white label): setup separado, mensalidade e taxa
**O normal:**
- **Setup: R$ 2.400** (uma vez). Parcelado no cartão: R$ 2.736 (6x de R$ 456).
- **Mensalidade da plataforma** (tabela acima: R$ 279/mês, ou o valor do ciclo).
- **Taxa por pedido de 3%** sobre as vendas da loja (a loja básica paga 5%).

**Benefício de lançamento (temporário, não é a regra):** 12 meses de mensalidade grátis para quem comprar o setup durante o lançamento. Setup e taxa de 3% continuam valendo. Deve ser tratado como promoção com data de término, não como parte do preço.

Racional de valor do pacote completo (o que o comprador leva):
| Item | Referência |
|---|---|
| Setup assistido: loja, marca, domínio próprio, templates premium | R$ 2.400 |
| Plataforma: editor avançado, análise de vendas, equipe, relatórios | R$ 279/mês |
| Mercado Pago da própria loja: recebe os clientes direto por Pix | incluído |
| Estoque e expedição da Central, recarga por Pix | incluído |
| Sem selo SuperDrop, marca e domínio dele | incluído |
| **Lançamento:** 12 meses de plataforma grátis | economiza R$ 3.348 |

## 5. Serviços da Loja NextLevel: descontos por ciclo
Quem paga a plataforma no ciclo longo ganha desconto nos **serviços** da Loja NextLevel:
- **Semestral: 15%** de desconto.
- **Anual: 25%** de desconto.
- Mensal: sem desconto.

**Academy:** fica à parte, como add-on, e **não** entra nos benefícios dos ciclos. Ofertas periódicas (lançamento, Black Friday, indicação) usam a Academy como isca.

## 6. Taxa por pedido: quem paga quanto
**Regra:** em todo pedido, o **fornecedor** e o **membro** pagam, cada um, um percentual sobre a **sua própria venda**. O percentual cai para quem compra o sistema completo, o que torna o upgrade atraente.

| Quem paga | Plano | Taxa |
|---|---|---|
| Fornecedor | **White Label** (marca própria) | **2%** |
| Fornecedor | **SuperDrop** (subdomínio) | **5%** |
| Membro | **Loja Própria** (domínio próprio) | **3%** |
| Membro | **Loja básica** (subdomínio) | **5%** |
| Membro | Drop manual (sem loja) | **a definir** (proposta: 5%) |

**Base de cálculo (proposta):** valor dos produtos do pedido, **sem frete**.
- Fornecedor: sobre o valor que cobra do membro (o custo debitado da recarga).
- Membro: sobre o valor que o cliente final paga pelos produtos.

**Exemplo (1 camiseta):** o cliente paga R$ 100 ao membro; o membro paga R$ 70 ao fornecedor.
| Fornecedor | Membro | Taxa do fornecedor (sobre R$ 70) | Taxa do membro (sobre R$ 100) | Total NextLevel |
|---|---|---|---|---|
| SuperDrop 5% | Loja básica 5% | R$ 3,50 | R$ 5,00 | **R$ 8,50** |
| SuperDrop 5% | Loja Própria 3% | R$ 3,50 | R$ 3,00 | **R$ 6,50** |
| White Label 2% | Loja básica 5% | R$ 1,40 | R$ 5,00 | **R$ 6,40** |
| White Label 2% | Loja Própria 3% | R$ 1,40 | R$ 3,00 | **R$ 4,40** |

Sobra para cada um (antes de frete e mensalidade, com Pix de cerca de 1%): o membro fica com cerca de R$ 24 na loja básica e R$ 26 na Loja Própria; o fornecedor recebe cerca de R$ 65,81 no SuperDrop e R$ 67,91 no White Label.

**Quando o upgrade compensa (ponto de equilíbrio):**
- Membro, Loja SuperDrop (R$ 139/mês + 5%) para Loja Própria (R$ 279/mês + 3%): a diferença de R$ 140 na mensalidade se paga com **R$ 7.000 de vendas por mês** (R$ 5.250 no plano anual). Acima disso a Loja Própria custa menos no total.
- Fornecedor, SuperDrop Growth (R$ 1.397 + 5%) para White Label (R$ 2.800 + 2%): compensa a partir de cerca de **R$ 46.800 por mês** vendidos aos membros (Start: R$ 70.100). O Scale (R$ 2.797) e o White Label (R$ 2.800) têm mensalidade quase igual: o White Label se diferencia por marca, domínio, página de vendas e taxa menor.
- Isso alimenta as ofertas de upgrade da Loja NextLevel ("com o seu volume, a Loja Própria já sai mais barata").

**Quando a taxa vale:** só sobre pedidos pagos e enviados para separação (custo debitado). Cancelamento ou estorno antes do envio devolve a taxa. Pedidos do período de teste não pagam taxa.

**Como cobrar:** os dois lados recebem no Mercado Pago deles, então a NextLevel soma as taxas do mês e cobra no **fechamento mensal** (fatura por Pix, com o mesmo corte de acesso em caso de atraso). Evolução futura: conectar o Mercado Pago por OAuth e cobrar a taxa no momento do pagamento (split).

**O que substitui:** a antiga "taxa de volume" de 3% sobre o custo, o piso mensal e o 1,5% do White Label deixam de existir, no lugar das taxas acima.

## 7. Cobrança e corte de acesso
| Estado | Quando | O que acontece |
|---|---|---|
| Teste | 7 dias, sem cartão, cupom do fornecedor | Modo demonstração; 1 cupom por CPF/CNPJ; prorrogação manual com registro |
| Ativo | Em dia | Tudo liberado |
| Carência | Vencimento até +3 dias | Tudo funciona; avisos com Pix pronto |
| Limitado | +4 a +7 dias | Não envia novos pedidos ao fornecedor; loja online segue |
| Suspenso | +8 dias | Painel só leitura; loja mostra "em manutenção"; botão de pagar |
| Encerrado | +30 dias | Acesso encerrado; dados guardados por 90 dias |
- Reativação imediata quando o Pix confirma. Avisos em D-7, D-3, D0, D+3 e D+7. Renovação do semestral e anual com aviso em D-30 e D-7.
- Depois de 2 mensalidades pagas, oferta de migrar para semestral ou anual abatendo o que já foi pago. Upgrade na hora com crédito proporcional; downgrade só no fim do ciclo.

## 8. Fornecedor
O fornecedor **paga setup para entrar** e deixa a **taxa por pedido** (5% no SuperDrop, 2% no White Label) para a plataforma rodar. Os dois fundadores (MantosShop e Alpha Outfit) têm acordo temporário com comissão sobre os membros que trouxerem (proposta: 25% do setup e 20% da mensalidade, com data de término no contrato); os demais fornecedores não têm comissão (a rever depois do teste).

| | Setup (proposta) | Mensal | Semestral (total) | Anual (total) | Taxa por pedido |
|---|---|---|---|---|---|
| SuperDrop Start | R$ 1.997 | R$ 697 | R$ 3.555 | R$ 6.273 | 5% |
| SuperDrop Growth | R$ 1.997 | R$ 1.397 | R$ 7.125 | R$ 12.573 | 5% |
| SuperDrop Scale | R$ 1.997 | R$ 2.797 | R$ 14.265 | R$ 25.173 | 5% |
| Central White Label | R$ 15.000 | R$ 2.800 | R$ 14.280 | R$ 25.200 | 2% |

Racional do setup de entrada: cobre importação do catálogo, configuração, página de vendas, treinamento da expedição e integração do Mercado Pago (cerca de 20 h de trabalho). O piso mensal de taxa deixa de existir.

## 9. Impacto no código (quando for implementar)
- **Checkout das lojas e recargas: somente Pix.** Hoje o Checkout Pro do Mercado Pago aceita cartão; é preciso excluir os demais meios de pagamento na preferência.
- `price-book`: ciclos semestral e anual, setup separado da mensalidade, taxa por pedido por tipo de plano (2%, 3%, 5%), promoção de lançamento com prazo, descontos de serviços por ciclo.
- Registro da taxa por pedido e por parte (fornecedor e membro), com fechamento mensal também para membros; estorno devolve a taxa.
- Planos da NextLevel: pagamento por Pix ou cartão (1x cheio, 2 a 6x ×1,14).
- Fatura com a empresa emissora (NextLevel Marketing ou Mega Tron).
