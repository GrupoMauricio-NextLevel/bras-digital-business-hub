# Racional da home da NextLevel Commerce (D219, 2026-10-29)

**Pedido do dono:** "a pessoa entra e já se convence de que somos a melhor opção; como a Nuvemshop faz, comparando com outras marcas; o que não convence vai para páginas institucionais."

## O que a Nuvemshop faz (avaliação de 29/10/2026)
- **Home curta e direta:** título de marca ("Mais do que loja online…"), "Criar loja grátis", número de prova (+180 mil marcas), logos de clientes, canais, IA, os produtos dela (Pago, Envio, Chat, Marketing) e planos.
- **O comparativo NÃO fica na home:** fica em `/compare`, com tabela contra Shopify, Tray e Loja Integrada (7 critérios), páginas "Nuvemshop ou X?" para 13 concorrentes, nota do Reclame Aqui, prêmios ABComm, depoimentos, FAQ ("Nuvemshop é bom?") e a frase "dados de sites oficiais, coletados em …; as marcas citadas não têm vínculo".
- **Argumento central dela:** plano grátis sem limite e tarifa zero com o meio de pagamento próprio.

## Onde nós ganhamos, com números públicos
Custo de plataforma = mensalidade + tarifa sobre a venda com o próprio meio de pagamento.

| Vendendo por mês | NextLevel | Nuvemshop | Tray |
|---|---|---|---|
| R$ 30 mil | R$ 449 (Start) | R$ 464 (Impulso) | R$ 459 (Crescimento) |
| R$ 50 mil | R$ 599 (Pro) | R$ 664 (Impulso) | R$ 659 (Crescimento) |
| R$ 100 mil | R$ 899 (Scale) | R$ 1.149 (Escala) | R$ 1.199 (Avançado) |

- Abaixo de R$ 30 mil por mês, os planos de entrada dos outros saem mais baratos. A página diz isso com honestidade.
- **Vantagens que não dependem de preço:**
  - sem limite de produtos e pedidos (a Tray limita os dois e a Loja Integrada limita produtos);
  - cobrança em reais (a Shopify cobra em dólar);
  - 100% das vendas na conta Mercado Pago do lojista;
  - equipe de verdade em São Paulo.
- **Onde perdemos e não escondemos:** não temos plano grátis e o teste é de 3 dias.

## Nova ordem da home
1. Topo (inalterado).
2. **Por que a NextLevel** (4 motivos verificáveis).
3. Planos com simulador.
4. **Comparativo** (custo total em 3 faixas + tabela de taxas e limites + fonte e data).
5. Lojas de exemplo (prova).
6. Temas.
7. Equipe.
8. Dúvidas.
9. Chamada final.

**Foi para `/recursos`:** como funciona (5 passos), portas de entrada, faixa de recursos, personalização, Maurício, integrações e carta do fundador. As integrações têm página própria (`/integracoes`), linkada de Recursos.

**Novo `/comparativo`:** 6 faixas de faturamento, planos de cada plataforma com link para a fonte e aviso de que as marcas citadas não têm vínculo.

**Menu:** Recursos · Comparativo · Planos · Temas · Dúvidas.

## Regras para manter o comparativo honesto
- Dados em `src/lib/marcas/comparativo-ecommerce.ts`, com `COLETADO_EM`. Atualize junto com a data quando os preços mudarem, ou a cada trimestre.
- A NextLevel entra sempre com os preços do Master (`commercePlansView`). Se o preço mudar no Master, o comparativo muda junto.
- O título "a partir de R$ 30 mil" é verificado por teste (`tests/comparativo-ecommerce.test.ts`). Se os preços mudarem e a frase deixar de ser verdade, o teste falha.

## Próximos passos sugeridos para convencer mais
- Prova real: número de lojas e depoimentos, assim que houver clientes (nada inventado).
- Página "NextLevel ou Nuvemshop?" por concorrente, como a Nuvemshop faz (boa para o Google).
- Avaliar uma porta de entrada mais barata para quem vende menos de R$ 30 mil, que hoje é o ponto fraco.
