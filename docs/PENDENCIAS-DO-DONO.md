# Pendências que dependem do dono (deixadas para o final)

Atualizado em 2026-10-04. Nada aqui bloqueia o trabalho em andamento.

## Precisam de uma ação sua
| # | Item | Por que depende de você | O que eu faço quando você resolver |
|---|------|-------------------------|-------------------------------------|
| 1 | Confirmar o backup do Neon (ponto de restauração) | A numeração dos pedidos sem repetição preenche dados de produção | Aplico a migração e publico (fase F1.1) |
| 2 | Liberar o tema **Ninho** para venda | O sistema bloqueia mudar o que está à venda sem a sua confirmação direta. Ele já está pronto, com demonstração por link | Troco uma linha, ajusto os testes e publico |
| 3 | Fotos próprias por tema (moda de marca, esportivo com camisas, casa) | Hoje a demonstração reaproveita as mesmas fotos de exemplo | Encaixo nas demonstrações e nas miniaturas |
| 4 | Credencial de teste do Mercado Pago e o segredo de assinatura do webhook | Só você gera no painel do Mercado Pago | Valido a compra de ponta a ponta e a assinatura do webhook |
| 5 | `CRON_SECRET` e agendador no Render | Rotinas (expirar reservas, lembretes) precisam de um agendador | Ligo as rotinas |
| 6 | Chave do Resend e e-mail remetente | Para os e-mails transacionais saírem de verdade | Conferir envio |
| 7 | Banco de teste Postgres de verdade (pode ser um Neon separado) | O teste de concorrência real (dois compradores da última peça) não roda no banco local | Rodar a fase F8 |

## Decisões (documentos em `docs/adr/`)
- ADR-0001 pagamento e estorno como entidades próprias.
- ADR-0002 desacoplar a Central oculta das lojas simples.
- ADR-0003 sessões revogáveis e 2FA (qual papel exige primeiro).
- ADR-0004 um usuário em várias lojas.
- ADR-0005 trilha de auditoria, CSP e assinatura do webhook.

## Escolhas de integração (ramos parados)
- `audit/usability-critical-flows` (36 commits, nasceu de base antiga): vale por commit isolado, nenhum aplicado ainda.
- `feat/ecosystem-foundation` / `main` (69 arquivos), `feat/master-scenario-data` (PR aberto): fora do foco atual (lojas virtuais).

## Fase final de testes (F8), só quando você pedir
Suíte completa, build, e2e (`jornada-completa`, `smoke-demo`, `temas-pagos`, `checkout-flow`, `polish-v8`), concorrência em Postgres real, carga e Lighthouse.
