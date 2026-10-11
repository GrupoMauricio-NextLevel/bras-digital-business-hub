# Preço do grupo — fase P0: o preço que vale, num lugar só (D123)

> Prompt: `docs/prompts/publico-personas-precos-ecossistema.md`, seção B1. As recomendações da seção A19 foram aceitas como padrão.

## O que ficou pronto
- **Master → Financeiro NextLevel → Preços do grupo** (`/master/financeiro/precos`):
  - uma tabela por marca (Commerce, SuperDrop, Brás Digital, NextLevel Cargas, Club, parceiros e Meu Contador) com o item, o tipo (mensal, anual, taxa, teste, pontos…), o valor, a situação (valendo, rascunho, desligado) e o link para editar onde o preço mora;
  - **divergências no topo**, cada uma com o caminho aprovado (teste grátis em três regras, duas tabelas de preço, desconto anual diferente, planos em rascunho, documento × sistema);
  - só lê: nenhum preço muda por esta tela. Só o Master vê.
- `docs/descoberta/PRECO-QUE-VALE.md`: onde mora cada preço e as divergências.
- `docs/PLANOS.md` passa a ser histórico (aviso no topo).
- Regra nova (D123): nenhum preço novo fixo no código.

## Verificações
- `tests/precos-grupo-p0.test.ts`: todas as marcas aparecem; o valor da Loja SuperDrop é o da tabela; Commerce Start valendo; Brás Prata em rascunho; taxa da Excursão desligada; divergências presentes; mudar o valor do ponto no Club muda a tela; quem não é Master não vê.
- e2e: passo 15 de `e2e/bras-portal.mjs` abre a tela em 1440 e 360 px (axe sem violações, sem rolagem horizontal).
- Tipos, estilo e build de produção sem erro.

## O que depende do dono
Nada nesta fase. As decisões de preço vêm nas fases P3/P4 (D124), com valores em rascunho no Master.

## Próxima fase
P1/P2: números agregados por marca no Master (sem dado pessoal), roteiros de entrevista e o questionário de preço no painel (desligado até o dono ligar).
