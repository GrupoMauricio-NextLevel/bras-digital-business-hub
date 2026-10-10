# Brás Digital Club — Fase E2: ônibus de excursão (D114)

## Em 5 linhas (para o dono)
- **O dono do ônibus tem um painel tipo app:** a viagem com o medidor do bagageiro, as chamadas em cartões (Aceitar ou Recusar com um toque), a coleta no Brás pelo código da etiqueta e a entrega com o código do cliente.
- **Tabela por tamanho:** o ônibus cadastra o preço do fardinho P, do fardo M e do G uma vez por rota. O cliente vê antes de pedir e não tem pechincha.
- **O lojista acha o ônibus da cidade dele** (Meu Brás → Fretes → Mandar pelo ônibus), reserva os fardos e recebe as etiquetas com QR e o texto pronto para a loja.
- **Nada é vendido duas vezes:** o bagageiro nunca passa da capacidade; lotou, vai para a lista de espera.
- **Sem nota não embarca:** a chave da nota é conferida. Ao sair, o que não foi coletado fica como "não embarcou".

## Como testar com a Starline
1. Cadastre a Starline em Empresas do grupo (contato e WhatsApp) e crie o acesso em Transportadoras → Gerenciar.
2. Entrando com esse acesso: Rotas e viagens → nova rota (com os preços) → abrir viagem.
3. Num membro da Brás: Fretes → Mandar pelo ônibus → cidade → reservar.
4. No ônibus: Hoje → Aceitar → Coletei (código da etiqueta) → Saí de São Paulo → Cheguei → Entregar (código do cliente).

## Ficou para depois e por quê
- **Frete pago por Pix direto na conta do ônibus:** fase E7 (precisa da conta Mercado Pago de cada ônibus).
- **A loja marcar "pronto" e "entregar no ônibus" dentro do pedido:** fase E3.
- **Ler o QR pela câmera do celular:** por enquanto o ajudante digita o código (curto, ex.: 8001-07).
- **Pontos do Club:** fase E4.

## O que depende de você
- Preços, rota e capacidade reais da Starline (seção 13 do prompt).
- A taxa da plataforma segue desligada até você decidir.

## Verificação
- Tipos, estilo, build e a bateria completa ok.
- Testes novos: 8 (`excursao-e2`), cobrindo o fluxo completo, a lista de espera, a capacidade, o prazo de cancelamento, a nota, o ajudante e as fronteiras entre ônibus e clientes.
- E2E: passo 10 do `bras-portal` com o fluxo inteiro no navegador e axe em 390 px.

## Próxima fase
E3/E4: painel de frete completo (loja "pronto", "entregar no ônibus" no pedido) e pontos do Club com o painel gamificado de indicações.
