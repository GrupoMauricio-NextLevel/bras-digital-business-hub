# Planos, preços e taxas: racional (v2, propostas a validar)

Esta versão corrige a anterior. A NextLevel **não define preço de produto**: fornecedores e membros decidem o que vendem e por quanto. A NextLevel cobra **mensalidades, setup, taxa de transação, serviços e Academy**. Nada aqui foi implementado no código ainda. Itens marcados **(proposta)** ainda não foram decididos.

## 1. De onde vem a receita da NextLevel
| Fonte | Quem paga | Observação |
|---|---|---|
| **Taxa de transação de 3%** | Quem vende, em toda transação, **qualquer que seja o preço** que ele pratique | Base de cálculo a confirmar (item 6) |
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
- **Taxa de transação de 3%** sobre as vendas da loja.

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

## 6. Taxa de transação de 3%: pontos a definir
- **Base:** sobre o valor da venda paga de quem vende. Duas leituras possíveis, preciso da sua decisão:
  - (A) só sobre a venda de cada lado: o membro paga 3% do valor que vende ao cliente final e o fornecedor paga 3% do valor que vende ao membro (custo debitado da recarga). É "taxa em cima de tudo".
  - (B) uma única taxa por pedido, paga por um só lado.
- **Como cobrar:** os dois lados recebem no Mercado Pago deles, então a NextLevel cobra a taxa no **fechamento mensal** (fatura por Pix). Alternativa mais automática: conectar o Mercado Pago por OAuth e cobrar a taxa no momento do pagamento (split). É uma integração maior; fica como evolução.
- Fornecedor White Label hoje tem 1,5% no `price-book`; a regra geral agora é 3%. Manter 1,5% para eles ou unificar?

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
O fornecedor **paga setup para entrar** e deixa **taxa de transação** para a plataforma rodar. Os dois fundadores (MantosShop e Alpha Outfit) têm acordo temporário com comissão sobre os membros que trouxerem (proposta: 25% do setup e 20% da mensalidade, com data de término no contrato); os demais fornecedores não têm comissão (a rever depois do teste).

| | Setup (proposta) | Mensal | Semestral (total) | Anual (total) | Taxa |
|---|---|---|---|---|---|
| SuperDrop Start | R$ 1.997 | R$ 697 | R$ 3.555 | R$ 6.273 | 3% |
| SuperDrop Growth | R$ 1.997 | R$ 1.397 | R$ 7.125 | R$ 12.573 | 3% |
| SuperDrop Scale | R$ 1.997 | R$ 2.797 | R$ 14.265 | R$ 25.173 | 3% |
| Central White Label | R$ 15.000 | R$ 2.800 | R$ 14.280 | R$ 25.200 | 3% (hoje 1,5%) |

Racional do setup de entrada: cobre importação do catálogo, configuração, página de vendas, treinamento da expedição e integração do Mercado Pago (cerca de 20 h de trabalho). Aviso: o "piso mensal de taxa" atual (R$ 300/R$ 500) somado à mensalidade parece cobrança dupla; proposta: eliminar o piso.

## 9. Impacto no código (quando for implementar)
- **Checkout das lojas e recargas: somente Pix.** Hoje o Checkout Pro do Mercado Pago aceita cartão; é preciso excluir os demais meios de pagamento na preferência.
- `price-book`: ciclos semestral e anual, setup separado da mensalidade, taxa de 3%, promoção de lançamento com prazo, descontos de serviços por ciclo.
- Planos da NextLevel: pagamento por Pix ou cartão (1x cheio, 2 a 6x ×1,14).
- Fatura com a empresa emissora (NextLevel Marketing ou Mega Tron).
