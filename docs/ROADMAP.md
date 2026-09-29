# Roteiro unificado (prompt visual v1 + racional de operação v2)

Feito: F0 diagnóstico, F1 design system, F2 domínio (carteira Pix, etiqueta PDF, gates, subdomínio, serviços), F3 Master como torre de controle.
Restante das duas frentes, fundido em oito fases (U1 a U8). Cada fase termina com lint, typecheck, testes, build, e2e, commit e push, e entrega algo visível.

## Princípios da fusão
1. **Cobrar antes de vender**: entitlements e cobrança NextLevel no Mercado Pago vêm primeiro, porque Academy, serviços orçados, mensalidades e add-ons dependem deles.
2. **Construir uma vez**: a home do fornecedor É a esteira; a expedição é a mesma esteira em modo mínimo. Não existe "F4 e depois M4".
3. **Eventos desde já**: a partir da U1 toda ação relevante grava um evento de domínio (`domain_events`). Automações, fila do dia e saúde (U7) só leem eventos, sem reescrever telas.
4. **Um canal ao vivo** (SSE com fallback de polling) para esteira e chat. **Um componente de conversa** para chat de pós-venda e pedidos de serviço.
5. **Um racional por número**: todo preço e taxa nasce com `rationale` (U1) e aparece nas telas.

## Fases
| Fase | Junta | Entrega visível | Depende de |
|---|---|---|---|
| **U1 Receita e base** | G1/M8 racional de preços, M3 entitlements, G3/M2 cobrança NextLevel no MP, eventos de domínio | Tela "Por que cobramos" e simulador com margem por perfil; add-ons ativáveis; faturas pagas por Pix/Checkout com conciliação e régua de cobrança | F2 |
| **U2 Operação do fornecedor** | F4, F5, M4, M5 | Home = esteira ao vivo com horário de corte e ondas; lote de etiquetas em 1 clique; painel de expedição em tablet; onboarding MP em 4 passos; recargas dos lojistas; equipe | U1 (eventos, entitlements) |
| **U3 Lojista Lite** | F6, M6 | Fluxo em uma tela (recarregar, escolher, enviar, anexar etiqueta); assistente de MP da loja; gates com CTA de upgrade | U2 (corte visível ao lojista) |
| **U4 Lojista Pro** | F7 | Análise de vendas e margem, editor com 3 larguras, templates, domínio, clientes, equipe | U3 |
| **U5 Loja NextLevel e Academy** | F8, M3 conteúdo, M9 add-ons | Vitrine por painel com recomendações; compra de serviço e add-on paga pelo MP; Academy com módulos bloqueados | U1 |
| **U6 Pós-venda por chat** | M1 | Chat com SLA, contexto do pedido/loja, macros, CSAT; conversa de serviço reaproveitada | U2, U5 |
| **U7 Controle e automação** | M7, M9 | Motor de regras, fila do dia, health score persistido, receita em tempo real, indicação, taxa de manuseio | U1 a U6 |
| **U8 Endurecimento e entrega** | F9, G9 | Acessibilidade, desempenho, seed com os cinco perfis, E2E por papel, docs (`PAINEIS.md`, `OPERACAO.md`), zip final | todas |

## O que sai de cada frente
- Do v1 permanece: identidade visual por painel, componentes, expedição sem dinheiro, gates, tablet primeiro.
- Do v2 entra: dinheiro da NextLevel, Academy, chat, automações. Nada é duplicado; onde havia duas versões da mesma tela, vale a do v2 (mais completa).
- Cortado se faltar tempo (nesta ordem): revenda de etiquetas, marketplace de fornecedores (já só roadmap), CSAT, certificado da Academy.

## Riscos
- Mercado Pago da NextLevel exige credencial real para provar M2 ponta a ponta; até lá o E2E usa o MP simulado.
- SSE em hospedagem serverless: manter polling como padrão e SSE onde houver suporte.
- Preços são propostas até validar no simulador com o dono.

## Adendo: portal e aquisição (P1 a P4)
Racional em `docs/PORTAL.md`; planos e preços em `docs/PLANOS.md`. Entra antes da U3.
P1 (15 dias, foco em MantosShop e Alpha Outfit): portal, páginas dos fornecedores, cupom e teste de 7 dias sem cartão, planos semestral/anual, Pix e cartão em até 6x, Academy com um módulo completo, e-mail transacional. P2: comissão dos fundadores com prazo, editor, upgrade white label. P3: Loja NextLevel e Academy de impacto (com U5). P4: assinante independente e Mega Tron (custódia, repasse, multi-fornecedor).
Pré-requisito descoberto: variação de produto por **cor e tamanho** (hoje só tamanho), necessária para os catálogos do Brás.
