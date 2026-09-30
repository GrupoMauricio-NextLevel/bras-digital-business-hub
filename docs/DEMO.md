# Ambiente de demonstração (vitrine Mega Tron / MRS Sports)

Serviço separado do de produção, em **modo simulação**: dados fictícios, Pix e Mercado Pago simulados, nenhuma cobrança real. Serve para mostrar o sistema funcionando na prática a fornecedores e membros.

## Por que separado
Pedidos fictícios em uma conta real entrariam nas taxas por pedido e nas faturas. O ambiente de produção (`app.superdrop.com.br`) fica limpo; a demonstração roda em outro serviço (sugestão: `demo.superdrop.com.br`).

## O que a vitrine traz
- **Fornecedor Mega Tron** (`/f/megatron` é a página de vendas pública): 5 camisas genéricas, sem marcas de clubes, custo de R$ 80 e venda sugerida de R$ 120, tamanhos P a GG, estoque, horário de corte, equipe de expedição, página de vendas.
- **Membro MRS Sports** (Loja SuperDrop): loja publicada, catálogo ativo a R$ 120, carteira com recargas Pix, ~30 dias de pedidos em todos os estados (entregues, enviados, em separação, aguardando etiqueta, aguardando recarga, cancelados), etiquetas anexadas, onda de separação com impressão, pedidos de serviço na Loja NextLevel.
- **Acessos** (senha `demo1234`, todos fictícios):

| Perfil | E-mail | Painel |
|---|---|---|
| Gestor Mega Tron | megatron@superdrop.demo | `/supplier` (esteira ao vivo) |
| Expedição Mega Tron | expedicao@megatron.demo | `/supplier/dispatch` |
| Membro MRS Sports | loja@mrssports.demo | `/merchant` |
| Master NextLevel | master@nextlevel.demo | `/master` |

Também continuam os perfis da Central Sports (Mantos Shop, Arena 10, Fut Classics).

## Funções ativas em simulação
- **Simular venda (demo)** em Pedidos do membro: cria uma venda de cliente final, debita o saldo ou deixa "Aguardando recarga".
- **Gerar etiqueta de demonstração** ao anexar etiqueta: PDF fictício 10x15 cm.
- **Recarga Pix simulada** e **Simular pagamento**, em saldo e em faturas/add-ons.
- **Pós-venda** e **Etiquetas** no painel do membro, esteira, ondas e expedição no fornecedor: funcionam com os dados simulados.
- Sem conta do Mercado Pago conectada, todo Pix é marcado **PIX SIMULADO**.

## Como publicar (Render)
1. New > Web Service, mesmo repositório e branch, runtime **Docker**, nome `superdrop-demo`.
2. Variáveis: `NEXT_PUBLIC_DEMO_MODE=true` (lida no build), `DEMO_AUTOSEED=true`, `DATABASE_URL=pglite://memory`, `SESSION_SECRET`, `CRON_SECRET` (valores próprios, diferentes dos de produção).
3. Não configure `MASTER_EMAIL`, `MASTER_PASSWORD` nem cartão de pagamento.
4. Domínio opcional: `demo.superdrop.com.br` (CNAME `demo` para o endereço `.onrender.com` do serviço).
5. Os dados voltam ao estado inicial quando o serviço reinicia ou hiberna, o que é desejável em demonstração. A primeira requisição depois de acordar leva alguns segundos a mais porque o banco é recriado e populado.

## Verificação
`E2E_BASE=<url> node e2e/smoke-demo.mjs [pasta-de-capturas]` percorre a landing, esteira, expedição, pós-venda, etiquetas, simulação de venda, etiqueta de demonstração, anotação e recarga simulada.
