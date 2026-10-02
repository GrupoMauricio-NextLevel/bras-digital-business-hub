# Onda 8: integrações e operação real — o que está pronto e o que depende do dono

**Regra:** nada aqui está "homologado". Só se marca homologado com evidência em ambiente de teste do provedor. Nenhuma compra, cobrança real, e-mail a cliente real ou emissão fiscal foi feita.

## Pronto e testado com simulação (não é homologação)
- Pagamento só vale depois de conferido na API do Mercado Pago (corpo do webhook nunca é confiável); valor menor que o total é recusado; pagamento repetido não duplica; pago depois de cancelado vira alerta, não reabre o pedido.
- **Novo:** rede de segurança para aviso perdido (`reconcilePendingPayments`): nas rotinas `/api/cron/expire-reservations` e `/api/cron/finance`, antes de cancelar reservas vencidas, consulta no Mercado Pago os pedidos pendentes. Falha do provedor em um pedido não derruba os demais nem cancela nada.
- Botão "Verificar pagamento" para o lojista (Onda 1).

## Depende de você (preciso antes de continuar)
1. **Agendador:** criar no Render as chamadas a `/api/cron/expire-reservations` (a cada 5–10 min) e `/api/cron/finance` (1x/dia) com `Authorization: Bearer $CRON_SECRET`. Sem isso a reconciliação e a expiração não rodam.
2. **Mercado Pago real/teste:** conta da NextLevel conectada no Master e uma loja de teste com credencial de teste, para homologar pagamento, webhook e valor inválido com evidência. Custo: taxas do Mercado Pago só em transação real.
3. **Compra de etiqueta (SuperFrete/Melhor Envio):** exige token, saldo e **gasto real**. Só implemento a compra idempotente (com tratamento de timeout incerto e conferência) depois da sua autorização específica.
4. **Nota fiscal:** projeto separado (certificado, regras tributárias, provedor). Não há documento fiscal no sistema; a folha impressa diz "não é documento fiscal".
5. **E-mails reais:** `RESEND_API_KEY`/`EMAIL_FROM` no Render.

## Próximos passos assim que autorizado
Homologação com credencial de teste → evidência → marcar item homologado; compra de envio idempotente; rastreio automático.
