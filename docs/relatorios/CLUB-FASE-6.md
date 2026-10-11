# Brás Digital Club — Fase E6: importadoras e transportadoras nas duas vias (D118)

## Em 5 linhas (para o dono)
- **A transportadora agora procura a importadora:** em "Importadoras na rede" ela vê os galpões e para onde vão os pedidos (somados por estado, sem cliente e sem valor) e pede para ser a preferida.
- **A importadora aceita com um toque**, ou marca direto a transportadora com quem já trabalha. A preferida aparece logo depois da escolha do cliente quando ela chama a coleta.
- **Coleta fixa:** por exemplo, "toda quinta às 15h". No dia, os pedidos para os estados da preferida já aparecem juntos e a importadora só confirma. A transportadora vê "Coletas fixas de hoje" no painel.
- **Conversa na coleta:** botões prontos ("Carga pronta", "Chego em 30 min", "Faltou volume"...) e mensagem curta, tudo no histórico da coleta.
- **Avaliação e mapa:** depois da coleta, a importadora dá nota (pontualidade e cuidado), que aparece no catálogo a partir de 3 avaliações. No Master, Transportadoras mostra "Onde falta transportadora", a lista de cidades onde convidar transportadora ou abrir rota de ônibus.

## Correção de sigilo
O histórico da coleta mostrava à importadora o valor do frete informado no aceite. Agora a importadora não vê esse valor (ela nunca vê frete nem comissão, D111). Há teste cobrindo isso.

## O que depende de você
Nada novo para ligar. Uma pergunta, que pode esperar: a nota da transportadora deve aparecer só a partir de 3 avaliações (padrão adotado) ou de outro número?

## Verificação
- Tipos, estilo e build ok.
- Testes novos: 6 (`vias-e6`). A bateria das áreas tocadas (cargas, excursão, frete, club, Meu Contador) também passou.
- E2E `bras-portal` passo 13: a transportadora pede para ser preferida, a importadora aceita e combina a coleta fixa de hoje, a coleta aparece no "Hoje" da transportadora e o mapa abre no Master. Acessibilidade (axe) sem violações graves em 390 e 1440 px.

## Próxima fase
E7: frete do ônibus por Pix direto na conta do dono do ônibus (Mercado Pago dele). A cobrança fica desligada até você publicar o preço.
