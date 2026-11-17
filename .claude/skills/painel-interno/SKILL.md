---
name: painel-interno
description: Projetar ou revisar telas dos painéis internos (lojista, fornecedor, expedição, Master, afiliado) com identidade própria, fila de decisões e velocidade. Use ao criar ou mexer em qualquer tela autenticada, na casca dos painéis, em tabelas, gavetas, busca global ou na primeira tela do lojista.
---

# Painel interno

## Direção ("mesa do atacadista", `docs/design/DIRECAO-VISUAL-V4.md`)
> **Atualização D328 (17/11/2026):** o dono pediu painéis com vida (cor por assunto, gráficos com dados reais, números em destaque, imagem com função e movimento). O parágrafo abaixo continua valendo para as **telas de trabalho** (listas, fichas, formulários, pagamento, ajustes). Nas telas de visão geral (Agora/Hoje, "Meu negócio", Dinheiro, Crescer, portal, acompanhamento do pedido), siga `docs/prompts/paineis-com-vida-prompt-mestre.md`: números sempre reais, famílias de cor `--vida-*`, kit único de componentes e gráficos, movimento da "Subida".

Ferramenta de trabalho, não vitrine de software. Papel quente e tinta em vez de cinza-azulado; **uma cor de sinal por marca** (`--brand-paper/ink/signal/on-signal/signal-text/support`, ver `src/lib/brand-palette.ts`); linhas finas em vez de sombra e caixa arredondada; números tabulares; títulos editoriais, nunca "Dashboard". Evite o visual genérico: gradiente roxo/azul, cartões idênticos com sombra, círculo com ícone padrão, número gigante com pílula verde.

## O que toda tela responde
"O que eu preciso fazer agora?" Cada número tem um "e daí?" (ação sugerida) e leva à tela que resolve.
- **Fila do dia** na primeira tela do lojista: pedidos para pagar/etiquetar/responder, estoque acabando, cliente sem resposta, cada um com botão de ação.
- **Pulso da loja**: faixa discreta e fixa (vendas de hoje, pedidos parados, saúde da loja; reaproveitar `healthScore` de `src/lib/domain/control-tower.ts`).
- **Linha do tempo do pedido** com a mesma anatomia em loja, fornecedor e Master; pedido em gaveta lateral.
- **Busca global e Ctrl+K** (pedido, cliente, produto, loja); tabelas densas com filtros salvos; modo expedição para celular/tablet (grande, uma mão).

## Regras do projeto
- **Cada papel e cada marca vê só o que existe para ele.** Achado de 2026-10-03: o painel da conta simples da Commerce (`lojista@commerce.demo`) ainda mostra conceitos do SuperDrop (coluna "Central", filtros "Aguardando recarga" e "Aguardando etiqueta", item "Preços e publicação", cor verde). Ao tocar nessas telas, esconda ou renomeie o que não se aplica à conta sem fornecedor (`store.kind === "SUPPLIER_OWN"` independente).
- Lógica e regras de negócio ficam em `src/lib/domain/*`; componente visual não decide regra. Permissões no servidor. Valores em centavos (`formatBRL`). Página com banco: `export const dynamic = "force-dynamic"`.
- Acessibilidade AA (`readableOn`), sem rolagem horizontal em 360 px, foco visível, teclado.
- **Fase atual só na E-commerce (D216):** o SuperDrop não está em produção nem tem clientes; não trave melhorias por causa dele.

## Velocidade percebida
Lista inicial em ≤ 1 consulta por bloco (nada de consulta dentro de laço), paginação, `loading.tsx` com esqueleto, ações com resposta otimista só quando seguro, JS cliente só no que interage. Meça com a skill `desempenho`.

## Verificação
Contas de demonstração (senha `demo1234`): `lojista@commerce.demo` (Commerce, conta simples), `dono@arena10.demo`, `central@centralsports.demo`, `master@nextlevel.demo`. Capturas e interação com a skill `qa-visual`. Antes de apresentar: `npx tsc --noEmit`, `npx eslint src e2e tests`, testes do que mudou.
