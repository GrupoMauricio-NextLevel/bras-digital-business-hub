# O que ficou pronto nesta noite (Brás Digital Club e NextLevel Cargas)

Tudo publicado na branch de trabalho, com testes. A produção confere: migração `0059_club_ranking` no ar. Bateria completa: **899 testes passando**. Roteiro no navegador (`e2e/bras-portal.mjs`): **15 passos, todos ok**.

**Lembrete:** os painéis da Brás (Meu Brás, transportadora, importadora, balcões) continuam atrás da chave `BRAS_PANELS`, **desligada em produção**. Nada disso aparece para cliente até você ligar. Nenhuma cobrança de verdade foi ligada.

## Fases entregues
| Fase | O que é, em uma linha | Decisão |
|---|---|---|
| E5 | Fardo sem nota: "pedir a nota para a loja" (Nota Fácil) ou "Meu Contador" resolve antes do ônibus sair | D117 |
| E5 (correção) | Links de parceiro `/r/...` e do Club `/c/...` levavam a um endereço interno quebrado; agora vão ao cadastro certo | D117 |
| E6 | Importadoras e transportadoras nas duas vias: preferida, coleta fixa, conversa na coleta, avaliação, mapa "onde falta transportadora" | D118 |
| E6 (sigilo) | A importadora via o valor do frete no histórico da coleta; corrigido | D118 |
| E7 | Frete do ônibus por Pix direto na conta do dono do ônibus (desligado até você ligar), cliente de confiança, devolução, taxa a faturar | D119 |
| E8a | Cartão do Club com QR, balcão da Mega Tron sem login, compra vira ponto, acerto entre empresas | D120 |
| E8b | Fardo entregue pela Starline vira ponto, plano Ouro/Platinum sobe o nível, guia de excursão ganha % | D121 |
| E9a | Ranking do mês por cidade, só para quem aceitar aparecer | D122 |

Relatórios de cada fase: `docs/relatorios/CLUB-FASE-5.md`, `-6`, `-7`, `-8A`, `-8B`.

## Para você testar quando acordar (5 minutos, no Master)
1. **Brás → Ônibus de excursão:** veja a "Taxa da plataforma a faturar" e a chave "Frete pago por Pix" (deixe desligada até a Starline conectar o Mercado Pago).
2. **Brás → Transportadoras:** "Onde falta transportadora" mostra as cidades para convidar transportadora ou abrir rota.
3. **Brás → Club:**
   - crie o balcão "Mega Tron · box 12" e abra o link no celular;
   - o acerto do mês aparece logo abaixo;
   - em "Regras" ficam os pontos por compra, por fardo e o percentual do guia.

## Perguntas que ficaram para você (nada travou: usei o padrão do prompt)
| # | Pergunta | O que usei por enquanto |
|---|---|---|
| 1 | Preço P/M/G da Starline e qual a primeira rota | O dono do ônibus preenche no painel dele |
| 2 | Taxa da plataforma por fardo | R$ 1,50 (rascunho), cobrança desligada |
| 3 | Quando ligar o Pix do frete | Desligado |
| 4 | Quem paga o desconto quando o cliente usar pontos no frete de ônibus de fora do grupo | Pontos no frete ainda não ligados |
| 5 | Pontos por compra no balcão | 2 pontos por R$ 1,00 (2% de volta); Mega Tron e Starline pontuam |
| 6 | Pontos por fardo entregue pela Starline e percentual do guia | 100 pontos por fardo; guia 2% |
| 7 | Formato do acerto entre as empresas (nota de marketing, reembolso, rateio) | Só registro; você marca "acertado" |
| 8 | Sistema emissor do Nota Fácil e a promoção de lojista novo | Convite pelo WhatsApp; integração quando houver acesso |
| 9 | Preço, prazo e quem atende o Meu Contador | 4 horas, preço em rascunho, cobrança desligada |
| 10 | Números das autorizações da Starline | Cadastrar em Transportadoras → Gerenciar → Autorizações |
| 11 | Mega Tron tem caixa (PDV) que possa registrar a compra sozinho | Registro manual no balcão |
| 12 | Fotos reais para as páginas públicas (Club e Excursão) | Lista em `docs/prompts/fotos-club-excursao.md`; páginas não montadas sem elas |

## Próximos passos sugeridos
1. Responder as perguntas 2, 3, 5 e 6 (dá para ajustar tudo no Master).
2. Mandar as fotos da lista para eu montar as três páginas públicas.
3. Quando quiser abrir para clientes reais: ligar `BRAS_PANELS` no Render (eu oriento o passo a passo).
