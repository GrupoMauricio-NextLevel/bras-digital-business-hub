# Documentos oficiais de engenharia do e-commerce NextLevel

Ordem normativa: **00 Constituição** > decisões registradas em `docs/design/DECISIONS.md` > documentos especializados (01 a 13) > especificações funcionais > tarefa atual.

| Nº | Documento | Estado |
|---|---|---|
| 00 | `00-CONSTITUICAO-ECOMMERCE.md` | Recebido e em vigor |
| 01 | `01-WBUY-RESEARCH-INTELLIGENCE.md` | Recebido (evidência de benchmark; não é especificação) |
| 02 | `02-COMMERCE-CORE.md` | Recebido (cruzamento: `CRUZAMENTO-02-COMMERCE-CORE.md`) |
| 03 | `03-PLATFORM-CORE.md` | Recebido (cruzamento: `CRUZAMENTO-03-04-PLATFORM-VISUAL.md`) |
| 04 | `04-VISUAL-COMMERCE.md` | Recebido (cruzamento: `CRUZAMENTO-03-04-PLATFORM-VISUAL.md`) |
| 05 | `05-MERCHANT-PANEL-UX.md` | Recebido (cruzamento: `CRUZAMENTO-05-08-PAINEL-LOJA-TEMAS-DADOS.md`) |
| 06 | `06-STOREFRONT-UX-CONVERSION.md` | Recebido (cruzamento: `CRUZAMENTO-05-08-PAINEL-LOJA-TEMAS-DADOS.md`) |
| 07 | `07-THEMES-TEMPLATES-SEGMENTS.md` | Recebido (cruzamento: `CRUZAMENTO-05-08-PAINEL-LOJA-TEMAS-DADOS.md`) |
| 08 | `08-DATA-ARCHITECTURE.md` | Recebido (cruzamento: `CRUZAMENTO-05-08-PAINEL-LOJA-TEMAS-DADOS.md`) |
| 09 | `09-INTEGRATIONS-EXTENSIBILITY.md` | Recebido (cruzamento: `CRUZAMENTO-09-11-INTEGRACOES-SEGURANCA-QUALIDADE.md`) |
| 10 | `10-SECURITY-RELIABILITY.md` | Recebido (cruzamento: `CRUZAMENTO-09-11-INTEGRACOES-SEGURANCA-QUALIDADE.md`) |
| 11 | `11-QUALITY-ENGINEERING.md` | Recebido (cruzamento: `CRUZAMENTO-09-11-INTEGRACOES-SEGURANCA-QUALIDADE.md`) |
| 12 | `12-COMMERCE-INTELLIGENCE.md` | Recebido (cruzamento: `CRUZAMENTO-12-INTELIGENCIA.md`) |
| 13 | `13-ROADMAP-GAPS-DECISIONS.md` | Recebido e salvo (roadmap, lacunas P0 a P4, registro de decisões). Matriz de lacunas: AUDITORIA-2026-10.md e CRUZAMENTO-* |

Os números 02 a 13 vêm da lista do próprio documento 01 (seção 22). Outros arquivos desta pasta: `AUDITORIA-2026-10.md` (sistema contra a Constituição) e `F0-CONFIRMACAO-2026-10-03.md` (confirmação dos achados).

## Efeito do documento 01 no projeto (conferido no código em 2026-10-03)
O 01 é **evidência**, não ordem (art. 36 da Constituição). Cruzei suas decisões com o que existe hoje:

| Tema do 01 | Situação no código | Observação |
|---|---|---|
| Status de pedido semântico (§5) | ✔ Já é assim | `orders.status` e `customer_payment_status` são enums semânticos; cor e rótulo ficam na interface. |
| Grade e atacado como regra sobre as mesmas variantes (§6.3) | ✔ Em grande parte | Existem grade (`product_packs`) e preço por quantidade sobre o mesmo catálogo. Não auditei se toda a compra por grade usa as mesmas variantes sem duplicar. |
| Estoque auditável (§7) | ◐ Parcial | `stock_movements` guarda variante, tipo, quantidade, referência, nota e data. **Faltam** saldo anterior e posterior, quem fez, origem, chave de idempotência e a loja. |
| Painel modular, com falha isolada por bloco (§4.1) | ? Não verificado | A conferir na fase de painel. |
| Analytics separado de operação (§4.3) | ? Não verificado | Já previsto na Constituição (art. 26). |
| Importação e exportação como motor (§8) | ◐ Parcial | Importação de produtos (CSV e XLSX) existe. Exportação só no Master (parceiros e CRM). Lojista não exporta pedidos, produtos e clientes. Sem prévia, sem relatório de erros por linha. |
| Central de segurança: 2FA, sessões, alertas (§9) | ✘ Ausente | Não há 2FA nem lista de sessões ativas nem alerta de novo acesso. |
| PWA desacoplado da loja (§10) | ? Não verificado | |
| Tema sem dominar regra de comércio (§11 e §12) | ✔ | Temas não definem preço nem estoque. |
| Conteúdo administrável continua administrável (§13) | ✔ | Banners, textos e seções editáveis no editor. |

Impacto no plano: acrescentar à fase F3 (eventos) o registro auditável de estoque, e criar uma fase própria depois da F6 para a central de segurança (2FA e sessões). Nada disso muda a ordem da F1 e da F2.
