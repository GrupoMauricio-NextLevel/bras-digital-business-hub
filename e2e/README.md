# Teste ponta a ponta

`npm run e2e` sobe um banco limpo (sem demonstração), um Mercado Pago simulado (`fake-mp.mjs`) e o app em `localhost:3300`, e percorre o fluxo real com um navegador (Playwright): convite de fornecedor, cadastro de produto, loja com setup pendente, confirmação de recebimento, conexão do Mercado Pago, venda, webhook, etapas do pedido e fechamento do mês.

- Capturas e logs ficam em `.e2e/` (ignorado pelo git).
- Requer Chromium. Por padrão usa `/opt/pw-browsers/chromium`; ajuste com `PW_CHROMIUM`.
- Para criar um cenário novo, copie `scenario.mjs` e rode com `E2E_SCENARIO=e2e/meu-cenario.mjs npm run e2e`.
- O Mercado Pago simulado expõe `/__approve?ref=<pedido>` e `/__state` para os testes controlarem pagamentos.
