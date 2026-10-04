# Relatório autônomo: segunda onda (2026-10-04)

## Estado herdado
P0 restantes: numeração atômica do pedido (depende do backup do Neon) e assinatura do webhook (depende do segredo do dono). P1 restantes: decisões dos ADRs 0001 a 0005. Build, tipos e testes verdes na nuvem.

## P0 resolvidos
- Falha da própria idempotência (D70): pedido cancelado por falha do Mercado Pago deixava o cliente sem poder pagar de novo. Reproduzido, corrigido, testado.
- Caminhos de erro do checkout cobertos (quantidade inválida, produto arquivado, variante errada, estoque insuficiente, loja suspensa/bloqueada, e-mail inválido, produto de outra loja).

## P1 / P2 avançados
- Observabilidade (D72): erro inesperado de ação e do Mercado Pago vai ao painel de erros com loja, origem e código para o cliente informar; tela de erro mostra o código.
- Platform Ops (D74): diagnóstico de loja para o Master.
- Privacidade (D69): consentimento de marketing começa desmarcado.
- Frete em demonstração não conta como configurado.

## Loop comercial (verificado no navegador local)
READY de ponta a ponta: criar loja, produto, estoque, publicar, vitrine, carrinho, checkout, pagamento em demonstração, pedido, estoque, operação, envio, avaliação (`e2e/conta-simples`, `storefront-journey`, `jornada-completa`, `painel-loja-vazia`).
Não provado: pagamento real no Mercado Pago, concorrência real em Postgres, carga.

## Painel do lojista, storefront e mobile
- 69 telas (lojista, fornecedor, Master) sem rolagem lateral a 390 px; 25 telas do lojista com loja zerada sem quebra (nova `e2e/painel-loja-vazia.mjs`).
- Corrigido o estouro do cadastro de produto (D73), contraste AA dos painéis (D68) e alvos de toque (D71).
- Acabamento (`polish-v8`): 45 páginas × 4 larguras, sem violação grave de acessibilidade.

## Visual Commerce
Provado em teste que dois temas diferentes usam o mesmo catálogo, preço, estoque e pedidos (instalar e trocar de tema não altera o núcleo).

## Import/Export
Importação já em três passos (arquivo, prévia com erros por linha, confirmação), CSV e XLSX, limite de 500 linhas. Exportação do lojista (pedidos, produtos, clientes) e exclusão de dados de cliente feitas na noite anterior. Não feito: processamento assíncrono (desnecessário neste volume).

## Integrações
Leituras ao Mercado Pago repetem até 3 vezes; cobrança nunca repete. Contrato formal por categoria de provedor e assinatura do webhook seguem em ADR-0005 (aguardam o dono).

## Commerce Intelligence
Sem mudança: saúde separada de desempenho (noite anterior). Recomendações e IA ficam para depois de métricas confiáveis.

## Publicações
Todas as etapas publicadas com a nuvem aprovando os commits intermediários (tipos, build e 540+ testes). A suíte local completa passou (542 de 543; a única falha era um teste novo escrito durante a execução, hoje verde).

## Riscos e dívida
- Modo escuro dos painéis não verificado.
- Pagamento real no Mercado Pago e Postgres real: fase F8, dependem do dono.
- Muitos envios seguidos cancelam a verificação da nuvem: publicar em lotes maiores.

## Decisões humanas necessárias
As mesmas de `docs/PENDENCIAS-DO-DONO.md` e dos ADRs 0001 a 0005.
