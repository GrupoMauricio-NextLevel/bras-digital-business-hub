# Planos, preços e taxas: racional (v1, propostas a validar no simulador)

Todos os valores abaixo são **propostas**. Nada foi alterado no `price-book` do código ainda. Ajuste no simulador (Master > Financeiro) antes de publicar.

## 1. A lógica do preço (do custo ao valor)
O preço ao público final segue cinco degraus, cada um com uma razão:

1. **Custo de servir (piso).** Infraestrutura, suporte e tarifa de pagamento custam de R$ 13 a R$ 27 por mês por membro. Nenhum plano pode ficar perto disso.
2. **Valor para o membro (teto).** O membro ganha cerca de **R$ 91 por camiseta vendida** (venda de R$ 149,90 menos custo de R$ 59, valores do demonstrativo; confirme com o preço real do MantosShop). Cada plano se paga com poucas vendas por mês:

| Plano | Mensal | Camisetas/mês para se pagar | No anual (por mês) |
|---|---|---|---|
| Drop manual | R$ 69 | menos de 1 | 0,5 |
| Loja SuperDrop | R$ 139 | 1,5 | 1,1 |
| Loja Própria | R$ 279 | 3 | 2,2 |

3. **Degraus que dobram.** R$ 69, R$ 139 e R$ 279: cada nível liga capacidades novas (vitrine em subdomínio; domínio próprio, análise de vendas, equipe e templates premium). É fácil de explicar: "cada degrau dobra o preço e libera mais".
4. **Ciclo: quanto mais longo, mais barato por mês.** O preço mensal é a âncora (mais caro). Semestral desconta cerca de 15% e anual cerca de 30%, porque o caixa vem adiantado, o cancelamento cai e há uma cobrança em vez de doze.
5. **Forma de pagamento.** O preço cheio é o do **cartão em 1x**. O **Pix à vista tem 5% de desconto**: a tarifa do Pix é cerca de 1% e a do cartão cerca de 5%, então a NextLevel fica com praticamente o mesmo valor líquido nos dois (Pix: 0,95 − 0,01 = 94%; cartão: 1 − 0,05 = 95%). O **parcelado em 2 a 6x** paga o preço cheio ×1,14 (o Mercado Pago cobre o custo, já simulado por você).

## 2. Tabela de preços ao público (membro)
Pix à vista (−5%) · cartão 1x (preço cheio) · cartão em 2 a 6x (×1,14, dividido em até 6).

| Plano | Ciclo | Pix à vista | Cartão 1x (cheio) | Parcelado (total · 6x) | Por mês (Pix) |
|---|---|---|---|---|---|
| **Drop manual** | Mensal | R$ 66 | R$ 69 | n/d | R$ 66 |
| | Semestral | R$ 336 | R$ 354 | R$ 403,56 · 6x R$ 67,26 | R$ 56 |
| | Anual | R$ 559 | R$ 588 | R$ 670,32 · 6x R$ 111,72 | R$ 46,58 |
| **Loja SuperDrop** | Mensal | R$ 132 | R$ 139 | n/d | R$ 132 |
| | Semestral | R$ 678 | R$ 714 | R$ 813,96 · 6x R$ 135,66 | R$ 113 |
| | Anual | R$ 1.106 | R$ 1.164 | R$ 1.326,96 · 6x R$ 221,16 | R$ 92,17 |
| **Loja Própria** | Mensal | R$ 265 | R$ 279 | n/d | R$ 265 |
| | Semestral | R$ 1.351 | R$ 1.422 | R$ 1.621,08 · 6x R$ 270,18 | R$ 225,17 |
| | Anual | R$ 2.246 | R$ 2.364 | R$ 2.694,96 · 6x R$ 449,16 | R$ 187,17 |

Setups:
| Item | Pix à vista | Cartão 1x | Parcelado (total · 6x) |
|---|---|---|---|
| Setup Loja SuperDrop | R$ 190 | R$ 200 | R$ 228 · 6x R$ 38 |
| **Setup Loja Própria (com 12 meses de plataforma inclusos)** | **R$ 2.280** | **R$ 2.400** | **R$ 2.736 · 6x R$ 456** |

Leitura correta dos descontos (contra 12 × o mensal cheio): anual no Pix economiza cerca de 33%; anual no cartão 1x cerca de 30%; anual parcelado em 6x ainda economiza cerca de 20%. O semestral parcelado quase não desconta (2 a 3%), de propósito: quem quer parcelar é empurrado para o anual.

**Loja Própria (R$ 2.400):** valor de referência R$ 5.748 (setup R$ 2.400 + 12 meses de R$ 279 = R$ 3.348 no mensal). Renovação depois de 12 meses: R$ 2.364/ano ou R$ 279/mês.

## 3. Cobrança inteligente e corte de acesso
Objetivo: cobrar antes de vencer, facilitar o pagamento e cortar o acesso só depois de avisar.

**Estados do membro**
| Estado | Quando | O que acontece |
|---|---|---|
| Teste | 7 dias, sem cartão, cupom do fornecedor | Modo demonstração; 1 cupom por CPF/CNPJ; prorrogação manual com registro |
| Ativo | Fatura em dia | Tudo liberado |
| Carência | Vencimento até +3 dias | Tudo funciona; avisos e Pix pronto |
| Limitado | +4 a +7 dias | Não envia novos pedidos ao fornecedor; loja online segue; banner de cobrança |
| Suspenso | +8 dias | Painel só leitura; loja online mostra "em manutenção"; botão de pagar |
| Encerrado | +30 dias | Acesso encerrado; dados guardados por 90 dias |

- **Reativação imediata:** o pagamento confirmado no Pix libera na hora (webhook).
- **Aviso antes de cortar:** lembretes em D-7 (fatura com Pix pronto), D-3, D0, D+3 e D+7.
- **Renovação antecipada:** aviso em D-30 e D-7 do fim do semestral ou anual, com uma condição especial para renovar antes.
- **Migração inteligente:** depois de 2 mensalidades pagas, oferta de trocar para semestral ou anual, abatendo o que já foi pago.
- **Mudança de plano:** upgrade na hora, com crédito proporcional ao que sobrou; downgrade só no fim do ciclo.
- **Fornecedor:** os estados de atraso já existem (aviso, bloqueio parcial, suspenso, encerrado) e valem para ele.

## 4. Benefícios por ciclo (custo baixo, valor percebido alto)
| Benefício | Mensal | Semestral | Anual | Valor percebido | Custo p/ NextLevel |
|---|---|---|---|---|---|
| Academy: módulo de boas-vindas | ✓ | ✓ | ✓ | — | ~0 |
| Academy completa incluída | | 3 primeiros meses | **12 meses** | R$ 564 | ~0 (conteúdo já gravado) |
| Suporte por chat com prioridade | | ✓ | ✓ (SLA menor) | R$ 1.164/ano | baixo |
| Setup da Loja SuperDrop grátis | | | ✓ | R$ 200 | baixo |
| Trava de preço por 24 meses | | | ✓ | proteção | baixo |
| Relatório mensal de desempenho | | ✓ | ✓ | — | ~0 (automático) |
| Pausar o plano 1 vez por 30 dias | | ✓ | ✓ | flexibilidade | baixo |
| 1 pacote de banners da Loja NextLevel por ano | | | ✓ | R$ 290 | médio (trabalho) |
| Acesso antecipado a novos módulos | | | ✓ | exclusividade | ~0 |
| Selo "Membro Anual" na Loja NextLevel | | | ✓ | status | ~0 |

## 5. Teste de 7 dias e cupom
- **Sem cartão.** Um cupom por CPF/CNPJ (`MANTOSSHOP7`, `ALPHA7`).
- Quem precisar de mais dias: o Master (ou o fornecedor) prorroga com um motivo registrado.
- Ao fim do teste o membro vê a tabela acima, com o Pix à vista em destaque.

## 6. Margens estimadas (custo de servir R$ 13 a R$ 27 por mês)
| Plano | Receita/mês | Custo/mês | Margem |
|---|---|---|---|
| Drop mensal (Pix) | R$ 66 | ≈ R$ 13 | 80% |
| SuperDrop mensal (Pix) | R$ 132 | ≈ R$ 18 | 86% |
| SuperDrop anual (cartão 1x) | R$ 97 | ≈ R$ 22 | 78% |
| Própria mensal (Pix) | R$ 265 | ≈ R$ 20 | 92% |
| Própria anual (cartão 1x) | R$ 197 | ≈ R$ 27 | 86% |
| Setup Loja Própria (R$ 2.400, com 12 meses) | | ≈ R$ 621 | 74% (≈ R$ 1.179 com comissão de fundador de 25%) |

## 3. Fornecedor: planos
O fornecedor **paga setup para entrar**. Propostas:

| | Setup (a validar) | Mensal | Semestral (por mês · total) | Anual (por mês · total) | Taxa de transação |
|---|---|---|---|---|---|
| **SuperDrop Start** | R$ 1.997 | R$ 697 | R$ 597 · R$ 3.582 | R$ 497 · R$ 5.964 | 3% do custo dos pedidos |
| **SuperDrop Growth** | R$ 1.997 | R$ 1.397 | R$ 1.197 · R$ 7.182 | R$ 997 · R$ 11.964 | 3% |
| **SuperDrop Scale** | R$ 1.997 | R$ 2.797 | R$ 2.397 · R$ 14.382 | R$ 1.997 · R$ 23.964 | 3% |
| **Central White Label** (plataforma com a marca dele) | R$ 15.000 | R$ 2.800 | R$ 2.400 · R$ 14.400 | R$ 2.000 · R$ 24.000 | 1,5% |

Racional do setup de entrada (R$ 1.997): cobre importação do catálogo, configuração, página de vendas, treinamento da equipe de expedição e integração do Mercado Pago (≈ 20 h de trabalho). A Central White Label cobra mais porque entrega marca própria, domínio e a landing de vendas do sistema completo.

Racional da taxa de transação: é o que mantém a plataforma rodando conforme o fornecedor vende. Cai de 3% para 1,5% no white label, porque ele já paga setup e mensalidade maiores. **Ponto de atenção:** o "piso mensal de taxa" atual (R$ 300 / R$ 500) somado à mensalidade parece cobrança dupla; proponho eliminar o piso ou abatê-lo da mensalidade.

### Acordo de fundadores (MantosShop e Alpha Outfit): temporário
- Setup isento, mais comissão sobre os membros que trouxerem: 25% do setup e 20% da mensalidade paga, **com data de término no contrato** (proposta: 12 meses).
- Depois do término, entram nas condições normais (sem comissão).
- No sistema é só um parâmetro do contrato do fornecedor: percentual e data limite.

## 4. Taxas de cartão e Pix (custo de recebimento da NextLevel)
Usar a tabela vigente da conta do Mercado Pago (varia por conta e prazo de recebimento). Ordem de grandeza a confirmar:
- Pix: cerca de 1%.
- Cartão em 1x: cerca de 5% (absorvido pela NextLevel).
- Cartão parcelado em 6x: tarifa maior (perto de 14%), coberta pelos 14% cobrados do comprador.
**Confirme na sua conta** ("Simular tarifas") que 14% cobre o custo do parcelamento no prazo de recebimento que você escolher. Se não cobrir, o parcelado dá prejuízo.

## 5. Impacto no código (quando for implementar)
- `price-book`: ciclos (mensal, semestral, anual), setup do fornecedor, comissão com data limite, parcelado ×1,14.
- Checkout: duas opções (à vista, parcelado em até 6x); no parcelado o valor enviado ao Mercado Pago já leva os 14%.
- Contrato do fornecedor: comissão sobre mensalidade e prazo de validade.
- Empresa emissora por fatura (NextLevel Marketing ou Mega Tron).
