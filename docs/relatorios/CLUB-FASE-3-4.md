# Brás Digital Club — Fases E3 (parte) e E4: pontos, indicações e "Indique e ganhe" (D115, D116)

## Em 5 linhas (para o dono)
- **Quem indica ganha pontos**, e os pontos viram desconto (vale com código). Cada membro tem um link de convite próprio.
- **Ponto só por gente de verdade:** só entra quando o indicado faz a primeira compra paga, entrega ou viagem pelo sistema. Estorno devolve os pontos; o mesmo WhatsApp vale uma vez; acima do teto do mês, você revisa.
- **Painel "Indique e ganhe" igual para todos** (membro, transportadora, ônibus, importadora): saldo, pontos a caminho, funil das indicações, missões do mês, nível, conquistas, vales e extrato.
- **Vale no balcão:** o cliente gera o vale e mostra na Mega Tron ou para a Starline; você baixa em Brás → Brás Digital Club.
- **A importadora prepara os fardos do ônibus:** vê os fardos dos pedidos dela, informa a nota e marca "pronto para coletar".

## Valores em rascunho (você muda em Brás → Brás Digital Club → Regras)
| Item | Sugestão |
|---|---|
| Valor do ponto | 100 pontos = R$ 1,00 |
| Indicação ativada | cliente 500 · transportadora/ônibus 1.000 · importadora 2.000 · loja 500 · guia 300 |
| Teto de indicação por mês | 20.000 pontos (acima: revisão) |
| Validade | 12 meses |
| Vale mínimo | 1.000 pontos (R$ 10,00) |
| Missões do mês | traga sua transportadora +300 · 3 fretes +500 · primeiro fardo por ônibus +300 |

## Ficou para depois e por quê
- **Usar pontos direto no pagamento** (frete, plano, Meu Contador): entra com o pagamento por Pix (E7). Por enquanto, o vale no balcão.
- **Acerto entre empresas** (quem paga o desconto do vale): o registro já fica pronto; a tela de acerto vem na E8.
- **Ranking por cidade:** precisa do seu "sim" (pergunta 17); sem ele, fica desligado.
- **Painel de frete "tela cheia" do lojista CPF** (sem CNPJ): depende da conta universal do Club (E7).

## Verificação
- Tipos, estilo, build e a bateria completa ok.
- Testes novos: 7 (`club-pontos-e4` e o caso da importadora em `excursao-e2`).
- E2E `bras-portal` inteiro, com o passo 11: você ativa a indicação; a membro vê os pontos e gera o vale; você baixa o vale; a tela da transportadora abre.

## Próxima fase
E5: nota em dia com o Meu Contador e o convite à loja pelo motor de indicações (depende das perguntas 10 a 13).
