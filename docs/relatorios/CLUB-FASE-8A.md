# Brás Digital Club — Fase E8a: cartão no balcão e acerto entre empresas (D120)

## Em 5 linhas (para o dono)
- **Cada membro tem o cartão do Club** (QR no Meu Brás → Club). No balcão da Mega Tron, a compra vira pontos para o cliente.
- **O balcão não precisa de login:** você cria o link em Brás → Club → "Balcões do Club" (por exemplo "Mega Tron · box 12") e manda para quem atende. O balcão vê só o primeiro nome e o saldo do cliente.
- **O vale do cliente pode ser usado no balcão:** tem de ser dele e cobre até 30% da compra.
- **Cada ponto tem dono:** compra na Mega Tron é paga pela Mega Tron; indicação e missão, pelo caixa do Club (NextLevel).
- **Acerto do mês:** quando o vale é usado numa empresa diferente da que pagou os pontos, o Master mostra "a Mega Tron deve à Starline R$ X". Você faz o acerto fora do sistema e marca "acertado". O sistema não movimenta dinheiro.

## Padrões usados (você pode mudar no Master → Club → Regras)
- 2 pontos por R$ 1,00 gasto (2% de volta, já que 100 pontos = R$ 1,00).
- Mega Tron e Starline pontuam.
- Compra acima de R$ 5.000 vai para a sua revisão.
- O vale cobre até 30% da compra.

## O que depende de você
1. Confirmar os padrões acima (ou mudar no Master).
2. Como fazer o acerto entre as empresas (nota de serviço de marketing, reembolso ou rateio): pergunta para o contador.
3. Se a Mega Tron tem um sistema de caixa (PDV) que possa registrar a compra sozinho (hoje é digitado no balcão).

## Verificação
- Tipos, estilo e build ok.
- Bateria completa: 887 de 888. A única falha foi o teste da versão do banco, que mudou durante a rodada; corrigido e passando.
- Testes novos: 6 (`club-balcao-e8`).
- E2E `bras-portal` passo 15:
  1. você cria o balcão da Mega Tron;
  2. a cliente mostra o cartão e o balcão registra R$ 500 → +1.000 pontos;
  3. o acerto do mês mostra o vale do passo 11 e você marca acertado.

  Sem violações graves de acessibilidade.

## Próxima fase
E8b: motor de benefícios (campanhas com orçamento e prévia), benefícios cruzados automáticos (fardo entregue pela Starline vira pontos), guia de excursão e pontos como desconto no Pix do frete.
