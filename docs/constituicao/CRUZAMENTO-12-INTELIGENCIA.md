# Cruzamento do documento 12 (Commerce Intelligence) com o código (2026-10-03)

Legenda: ✔ cumpre · ◐ parcial · ✘ não cumpre · ? não verificado. Método: leitura do código e buscas dirigidas; nenhum teste novo foi rodado nesta etapa.

## Resumo
O sistema já tem as peças certas, mas **ainda não as separa como o 12 exige** (desempenho, operação, saúde e recomendações). O que existe e funciona: **uma única definição de venda** (`isEligibleSale` e `netSaleCents`, usadas no painel, na análise, nas exportações e no resumo diário), **nota de saúde por loja com motivos** (`healthScore`), **fila de ações** no painel e **resumo diário** por e-mail. Falta: eventos de funil, definição formal das demais métricas, alertas com deduplicação e resolução, recomendações com evidência, estado "desconhecido" no lugar de zero falso e frescor dos dados.

| Parte | Situação | Evidência e lacuna |
|---|---|---|
| Quatro dimensões separadas (§2) | ◐ | Existem os quatro assuntos, misturados em `control-tower.ts` e na primeira tela. |
| Sinal, contexto, impacto, ação (§3) | ◐ | `ActionQueue` mostra título, contagem, link e ação; falta o contexto de impacto ("4 deles venderam nos últimos 7 dias"). |
| Analytics: intervalo, comparação, definição única (§4–8) | ✔/◐ | **Definição única de venda** (`analytics.ts`). Intervalo de 30 dias fixo; comparação com o período anterior: não verificada; as demais métricas (ticket médio, conversão) sem definição formal registrada. |
| Operação sem distorção por período (§9–11) | ? | Não verificado se o filtro de período da análise altera a fila de ações. |
| Saúde da loja (§12–15) | ◐ | `healthScore` dá nota, faixa e **motivos legíveis** (✔ explicável, §48). Mistura sinais de desempenho (sem pedidos em 30 dias, poucos pedidos) na saúde, o que o 12 §14 proíbe: saúde não depende de período analítico. Faltam dimensões (checkout, frete, domínio, integração, catálogo, segurança) e o estado `UNKNOWN`. |
| Central de ações (§16–20) | ◐ | Há fila; sem prioridade explicável por impacto, sem "dispensar" e "adiar", sem item resolvido automaticamente. |
| Alertas: regras, deduplicação, resolução (§21–26) | ◐ | Rotinas e painel de erros avisam o Master; o resumo diário tem `dedupeKey` por dia. Para o **lojista**: alerta de estoque baixo e pedido parado não existem como alertas com ciclo de vida. |
| Prioridade explicável (§27–29) | ✔/◐ | Motivos da nota de saúde são explícitos; sem peso por impacto financeiro. |
| Recomendações (§30–34) | ✘ | Não existem; os documentos 12 §33 e §96 a §99 exigem evidência e confiança antes de criar. |
| KPIs (§35–38) | ◐ | Vendas, pedidos, ticket médio e clientes calculados; sem conversão, recompra, taxa de estorno, taxa de aprovação de pagamento, tempo de expedição. |
| Funil (§39–41) | ✘ | Não há eventos de visita, produto visto, carrinho nem checkout (ver 06 §113). |
| Análise de vendas (§42–44) | ◐ | Por produto e por canal; bruto versus líquido definido (subtotal menos desconto, sem frete); **estorno não entra** porque não é entidade. |
| Produto, estoque, pedidos, pagamento, frete, cliente, marketing, busca (§45–70) | ◐/✘ | Avise-me, preço por faixa, campanhas e CRM existem. Saúde do cadastro de produto (sem foto, sem peso), risco de ruptura por velocidade de venda, envelhecimento de pedido, taxa de falha de pagamento, termos sem resultado: não. |
| Tema, integração, domínio, segurança (§73–78) | ◐ | Saúde de integração e de domínio só por colunas de estado (ver 09 e 03). |
| Prontidão do onboarding (§79–80) | ✘ | Cobre-se pela F4 do plano (checklist "loja pronta para vender"), com critérios visíveis. |
| Modelo de dados: definição de métrica, sinal, recomendação (§81–83) | ✘ | Nenhuma entidade; as métricas são funções no código. Para o tamanho atual isso é suficiente (art. 33 da Constituição). |
| Tempo real, quase real, lote (§86–88) | ◐ | Tudo é calculado na leitura da página; sem pré-agregação nem cache. |
| Frescor e dado desatualizado (§89–91) | ✘ | Nenhuma tela mostra "atualizado há X" nem estado atrasado. |
| Anomalias e sazonalidade (§92–94) | ✘ | Não existem. |
| IA (§95–101) | ✘ | Não há; o 12 só permite IA com dados já calculados, rastreáveis e sem ação automática. |
| Notificações, preferências (§102–105) | ◐ | E-mail de resumo diário só para o Master; o lojista não escolhe tipo, canal nem horário. |
| Composição do painel, drill-down, exportação (§106–110) | ◐ | Ordem do painel inicial: fila antes dos números (✔ parcial). Drill-down por link em vários cartões; exportação de CRM e parceiros só no Master. |
| Metas, benchmark, relatórios salvos (§111–117) | ✘ | Não existem (o 12 os trata como futuro). |
| Qualidade de dado e confiança (§118–120) | ✘ | Sem estados "confiável, parcial, atrasado, indisponível". |
| Privacidade e permissão (§121–124) | ◐ | Equipe (STAFF) não vê finanças (✔); sem permissão própria para métricas financeiras além disso. |
| **Falha não vira zero (§129–130)** | ? | Não verifiquei se as telas mostram "0" quando a consulta falha; o painel agrupa em `Promise` simples. |
| Testes (§135–140) | ◐ | `analytics.test.ts` e `resumo-dia.test.ts` validam fórmulas e privacidade; sem teste de alerta falso positivo nem de frescor. |

## O que fazer e o que não fazer agora
- **Fazer, pequeno e seguro (depois da F4):** (a) separar a **saúde da loja** do desempenho: tirar "sem pedidos em 30 dias" da nota e levar para a fila de oportunidades; (b) mostrar "atualizado às HH:MM" e **"indisponível" no lugar de 0** quando uma consulta do painel inicial falhar; (c) contexto de impacto na fila ("4 deles venderam nos últimos 7 dias") para estoque baixo.
- **Não fazer agora (o documento manda esperar necessidade):** entidades de métrica, de sinal e de recomendação, detecção de anomalia, IA, benchmark, metas, relatórios agendados.
- **ADRs:** pipeline de eventos de funil (junto com 06 §113), definição formal das métricas de conversão e recompra, política de alertas ao lojista (tipos, canais, horário de silêncio).
