# Brás Digital Club — Fase E5: nota em dia e Meu Contador (D117)

## Em 5 linhas (para o dono)
- **Fardo sem nota não embarca**, e o sistema já oferece a saída: pedir a nota para a loja ou resolver com o Meu Contador.
- **"Pedir a nota para a loja"** monta a mensagem do Nota Fácil para o WhatsApp da loja, e a indicação conta para o cliente no Club.
- **Meu Contador:** o cliente abre o chamado no próprio fardo. Você vê a fila em Brás → Meu Contador, com a contagem regressiva até a saída do ônibus.
- **Resolver com a chave da nota** leva a nota direto para o fardo, e o ônibus já pode coletar. Sem solução, o cliente vê o motivo e o fardo vai na próxima viagem.
- **Correção importante:** os links de parceiro (`/r/...`) do SuperDrop e os convites do Club (`/c/...`) estavam levando para um endereço interno quebrado. Agora levam ao cadastro certo.

## O que depende de você
1. Preço, prazo e horário do Meu Contador (Brás → Meu Contador → Regras). A cobrança segue desligada.
2. Quem atende (equipe ou escritório parceiro): com isso eu crio o acesso só da fila para o contador.
3. Qual é o sistema do Nota Fácil e a promoção de lojista novo, para a integração (E8).

## Verificação
- Tipos, estilo, build e a bateria completa ok.
- Testes novos: 4 (`meu-contador-e5`).
- E2E `bras-portal` passo 12: o ônibus abre a viagem; a membro reserva sem nota e abre o chamado; você resolve com a chave; a nota aparece no fardo.

## Próxima fase
E6/E7: as duas vias (preferidas, coleta fixa, demanda agregada) e o frete por Pix na conta do ônibus.
