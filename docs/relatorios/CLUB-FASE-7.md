# Brás Digital Club — Fase E7: frete do ônibus por Pix (D119)

## Em 5 linhas (para o dono)
- **O frete do ônibus pode ser pago por Pix antes da viagem, direto na conta do dono do ônibus.** A NextLevel não toca nesse dinheiro.
- **Está desligado.** Para ligar: Master → Brás Digital → Ônibus de excursão → Regras → "Frete pago por Pix na conta do dono do ônibus".
- **Ligado:** o dono do ônibus conecta o Mercado Pago dele no Perfil. O cliente paga o Pix pelo QR no painel de frete e o fardo só embarca depois do Pix conferido no Mercado Pago.
- **Cliente de confiança** paga na chegada (o dono marca com um toque e registra "recebi"). Fardo pago que não viajou fica na lista "Pix para devolver" do ônibus.
- **No Master** aparece a "Taxa da plataforma a faturar" por ônibus e mês. A cobrança da taxa continua desligada.

## O que depende de você
1. Ligar o Pix do frete quando a Starline estiver pronta para receber assim (e o Mauricio conectar o Mercado Pago no Perfil do ônibus).
2. Quem paga o desconto quando o cliente usa pontos do Club no frete (pergunta da seção 7B.6). Com isso eu ligo os pontos como desconto no Pix.
3. Preço da taxa da plataforma por fardo (hoje R$ 1,50 em rascunho) e quando ligar a cobrança.

## Verificação
- Tipos, estilo e build ok.
- Testes novos: 6 (`frete-pix-e7`), com o Mercado Pago simulado. Cobrem: token criptografado, Pix pendente não vale, valor menor não vale, aprovação aplicada uma vez, cliente de confiança, devolução e a taxa do Master.
- E2E `bras-portal` passo 14 com o Mercado Pago simulado:
  1. você liga o Pix e o ônibus conecta a conta;
  2. o fardo aceito não embarca sem o Pix;
  3. a cliente paga pelo QR e o fardo é coletado;
  4. a taxa aparece no Master.

  Acessibilidade sem violações graves.

## Próxima fase
E8: Nota Fácil integrado e promoção para lojistas novos, benefícios cruzados entre Starline, Mega Tron e NextLevel, guia de excursão e acerto entre empresas. Depende das suas respostas sobre o emissor de nota e os benefícios.
