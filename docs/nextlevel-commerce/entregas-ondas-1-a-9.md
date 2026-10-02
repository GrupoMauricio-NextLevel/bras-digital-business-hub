# O que o NextLevel Commerce já faz (Ondas 1 a 9) e o que falta

Estado em 2026-10-02. Tudo abaixo está **publicado**, testado por testes automáticos e build. O que depende de credencial real **não está homologado**.

## Para testar na demonstração (só funciona com a demonstração ligada)
- Dono: `lojista@commerce.demo` / `demo1234` (loja "Fio & Linha", conta simples da marca Commerce).
- Equipe da loja: `equipe@commerce.demo` / `demo1234` (vê só pedidos, catálogo, clientes, etiquetas, pós-venda e avaliações).
- A demonstração já vem com: cupom `BEMVINDO10`, faixas de atacado no primeiro produto, uma campanha no ar, uma proposta aberta e uma avaliação aguardando aprovação.

## O que o lojista (conta simples) tem
| Função | Onde (menu) | Observação |
|---|---|---|
| Separar e enviar o próprio pedido | Pedidos | Plano vencido bloqueia. Loja de rede (SuperDrop) continua expedida pela Central |
| Confirmar pagamento manual / "Verificar pagamento" (Mercado Pago) | Pedido | Pedido de gateway só é confirmado pelo provedor |
| Categorias | Meus produtos → Categorias | Excluir não apaga produto |
| Nota interna e impressão do pedido | Pedido | Impressão diz "não é documento fiscal" |
| Clientes: etiquetas, anotação, histórico, consentimento, exportação | Clientes | Exporta só quem consentiu |
| Propostas por link | Pedidos → Novo pedido → Gerar proposta | Vira um pedido uma única vez |
| Campanhas (faixa no topo da loja) | Campanhas | Com início e fim |
| Cupons de desconto | Cupons | Nunca abaixo do custo; não vale em loja de rede |
| Atacado: preço por quantidade e pedido mínimo | Atacado | Servidor recalcula o preço |
| Avaliações de clientes (compra verificada) | Avaliações | Só aparece depois de aprovada |
| Avise-me (tamanho esgotado) | Avise-me | O lojista avisa pelo WhatsApp/e-mail; nada é enviado sozinho |
| Equipe (até 5 pessoas) | Equipe | Sem finanças, configurações, preços e cupons |

## Segurança e confiabilidade
Avançar/cancelar/confirmar pedido é seguro contra clique duplo; pagamentos do Mercado Pago pendentes são reconferidos pelas rotinas agendadas; um tenant nunca lê dado de outro; textos e telas novas passaram em 360 px e no computador, sem rolagem horizontal e sem alerta de acessibilidade (e2e `e2e/novas-telas.mjs`).

## O que NÃO foi feito, e por quê
- **Multiloja** (várias lojas na mesma conta): hoje cada loja tem a sua organização e o seu usuário dono; permitir várias lojas muda identidade, cobrança e teste grátis ao mesmo tempo. Sem demanda real ainda e com risco para o SuperDrop em produção, ficou fora. Recomendo só fazer quando houver um cliente pedindo.
- **Carrinho abandonado e newsletter:** precisam capturar dados antes da compra e enviar e-mail em massa (consentimento + Resend).
- **Onda 8 real:** homologação do Mercado Pago, compra de etiqueta, nota fiscal. Ver `onda-8-homologacao.md`.
- Banner com imagem, preferências da loja e lista de preço por grupo de clientes.

## O que só você pode fazer
1. Agendador no Render chamando `/api/cron/expire-reservations` (a cada 5–10 min) e `/api/cron/finance` (1×/dia) com `Authorization: Bearer $CRON_SECRET`.
2. Credencial de teste do Mercado Pago (para homologar pagamento, webhook e cupom) e conta NextLevel conectada no Master.
3. `RESEND_API_KEY` e `EMAIL_FROM` (e-mails reais).
4. Autorizar compra de etiqueta (gasta dinheiro) e decidir sobre nota fiscal.
5. Pendências antigas: Master real (`MASTER_EMAIL/PASSWORD`), Neon (plano e backup), regras de preços e planos.
