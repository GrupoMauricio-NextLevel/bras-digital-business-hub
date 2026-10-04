# Matriz de lacunas (documento 13, partes III e IV)

Atualizada em 2026-10-04. Estado: **FEITO** (no ar e testado na área), **ADR** (decisão do dono pendente), **DONO** (depende de ação do dono), **ABERTO** (ainda sem trabalho), **NÃO AUDITADO**.
Prioridade: P0 crítico, P1 fundacional, P2 essencial, P3 diferenciação, P4 otimização.

## P0 (corrigir antes de expandir)
| Id | Lacuna | Doc | Estado |
|----|--------|-----|--------|
| G-01 | Estoque: duas compras da última peça passavam (leitura e gravação sem condição) | 02 | FEITO (atualização condicional; trilha com saldos antes/depois; prova em banco real fica na F8) |
| G-02 | Pedido duplicado ao reenviar o checkout | 02 §46 | FEITO (chave de idempotência por tentativa) |
| G-03 | Número de pedido calculado como "maior + 1" (corrida) | 02, 08 | DONO (migração com preenchimento; pede backup do Neon). Impacto atual: a 2ª compra simultânea falha em vez de duplicar |
| G-04 | Rede de outro fornecedor podia receber produto distribuído | 03 | FEITO (validação da rede) |
| G-05 | Piso de preço da grade não validado no servidor | 02 | FEITO |
| G-06 | Login sem limite de tentativas | 10 | FEITO (por IP e por e-mail; em memória, 1 instância) |
| G-07 | Chamadas externas sem tempo máximo | 09, 10 | FEITO |
| G-08 | Webhook do Mercado Pago sem assinatura | 09, 10 | DONO (segredo gerado pelo dono) + ADR-0005. O pagamento já é conferido na API |

## P1 (fundacional)
| Id | Lacuna | Doc | Estado |
|----|--------|-----|--------|
| G-10 | Publicação de tema não atômica | 04 | FEITO (`publishAllDrafts`) |
| G-11 | Eventos de domínio sem significado de negócio | 02, 12 | FEITO (criado, pago, enviado, cancelado) |
| G-12 | "Loja pronta para vender" inexistente | 05 | FEITO (domínio + aviso no painel) |
| G-13 | Saúde misturada com desempenho | 12 | FEITO |
| G-14 | Integridade dos dados sem conferência | 08 | FEITO (relatório só leitura; restrições no banco só depois de limpo em produção) |
| G-15 | Sem trilha de auditoria geral | 03 | ADR-0005 (aditivo, recomendado primeiro) |
| G-16 | Sessões não revogáveis, sem 2FA | 03, 10 | ADR-0003 |
| G-17 | Pagamento e estorno sem entidade própria | 02 | ADR-0001 |
| G-18 | Central oculta acoplada às lojas simples | 00 art. 4 | ADR-0002 |
| G-19 | Usuário em uma loja só | 03 | ADR-0004 |
| G-20 | Exportação e exclusão de dados de cliente | 00 arts. 21, 29 | FEITO (política de retenção: dono e jurídico) |
| G-21 | CSP completa | 10 | ADR-0005 (modo relatório primeiro) |

## P2 e acima
| Id | Lacuna | Estado |
|----|--------|--------|
| G-30 | Temas pagos com identidade e foto própria | Lume, Arena, Editorial, Signature no ar; Ninho pronto (DONO libera); fotos próprias (DONO) |
| G-31 | Textos da conta simples sem conceitos de Central/recarga | FEITO |
| G-32 | Mocks, rotas mortas e funções de fachada (doc 13 §39 a §41) | NÃO AUDITADO |
| G-33 | Ramos de design e auditoria parados | Painéis já integrados; Arena integrado; `audit/usability-critical-flows` aproveitado só em "frete exige endereço"; demais itens avaliados e recusados (ver D66) |
| G-34 | Testes finais: suíte completa, e2e, concorrência real, carga, restauração | F8, só quando o dono pedir |
