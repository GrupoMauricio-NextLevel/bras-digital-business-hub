# QA visual do painel Commerce (vidro azul)

Roteiro: `e2e/commerce-glass-qa.mjs` (cria uma loja, passa por telas em Claro e Escuro, movimento reduzido, mede rolagem lateral, erros de console e `axe` sério/crítico, e salva capturas em `docs/commerce-visual/capturas/`).

## Resultado (execução local)
- Lojista, Claro e Escuro: Início, Pedidos, Produtos, Clientes, Temas, Financeiro e Configurações em 1440 e 390 px; Início e Pedidos também em 1280 e 768 px. **Sem rolagem lateral, sem erro de console, sem violação grave de axe.**
- ADM Commerce: Visão geral, Lojas, Vendas e Assinaturas em 1440 e 390 px, Claro e Escuro: mesmo resultado.
- Antigos e2e `painel-loja-vazia` (25 telas x 2 larguras) e `conta-simples`: passam.
- Verificação de tipos e estilo (`tsc`, `eslint`): limpas.

## O que NÃO foi feito ou ficou parcial (dito com franqueza)
- Só **Início** e a **casca/menu** foram recompostos. Pedidos, Produtos, Clientes, Financeiro etc. herdam o novo visual (cores, bordas, cartões, tabelas) mas o layout interno delas não foi redesenhado, então ainda não são tão "vidro" quanto o Início.
- A paleta de comandos (Ctrl+K) abre em camada fora do painel e usa as cores globais, não as do Commerce.
- A visão geral do ADM mantém o título grande anterior; só a casca (menu, cabeçalho, tema) foi refeita.
- Telas de Edição de produto, Aparência/Temas, Financeiro (separar caixa da loja da assinatura) e Configurações não foram recompostas nesta rodada.
- Contraste medido pelo `axe` sobre a composição renderizada nas telas acima; não foi medido sobre todas as telas do painel.
- Não testado: teclado completo da gaveta em dispositivos reais, Safari/Firefox, leitor de tela.
- `npm run build` passou. A suíte completa de testes (`vitest`) não foi rodada nesta rodada (só mudou apresentação).

## Capturas
`docs/commerce-visual/capturas/`: `inicio|pedidos|produtos` em `light|dark` x `1440|390`, e `adm-visao|adm-lojas`.
