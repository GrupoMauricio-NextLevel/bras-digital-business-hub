# Catálogo de temas por família e nível

> Fonte de verdade: `src/lib/themes/catalog.ts`. Estados: **à venda** (`released`), **em revisão** (`review`: demonstração por link, não vende nem instala) e rascunho (`draft`: não aparece).
> Preços dos temas já vendidos não mudaram. Os temas novos usam a proposta abaixo (D84).

| Família (loja de exemplo) | N1 Grátis | N2 NextLevel Commerce | N3 Commerce PRO | N4 Commerce ULTIMATE |
|---|---|---|---|---|
| Base (catálogo Moda) | **Starter**: grátis | (nenhum) | (nenhum) | **Signature**: R$ 1.499 |
| Moda (Trama Urbana) | **Trama**: grátis | **Lume**: R$ 149 | **Editorial**: R$ 699 | **Atelier**: R$ 999 |
| Casa (Casa em Ordem) | **Lar**: grátis | **Ninho**: R$ 149 | **Varanda**: R$ 299 | **Morada**: R$ 999 |
| Sport (Linha de Jogo) | **Lance**: grátis | **Torcida**: R$ 149 | **Arena**: R$ 299 (composição própria, mantida) | **Pódio**: R$ 999 |
| Beauty (Bela Essência) | (próxima etapa) | | | |
| Conecta (Ponto Conecta) | (próxima etapa) | | | |
| Atacado (Giro Distribuidora) | (próxima etapa) | | | |

Todos à venda desde D84 (decisão do dono, 2026-10-07).

## Proposta de preços (aplicada em D84 para os temas novos)
Hoje os preços não seguem o nível: Editorial (N3) custa R$ 699 e Arena (N3) custa R$ 299. Proposta para os temas novos, sem mexer nos já vendidos:
- N2: R$ 149 (igual a Lume e Ninho).
- N3: R$ 299 (igual a Arena). Editorial continua R$ 699 enquanto o dono não decidir.
- N4: R$ 699 a R$ 999 (abaixo do Signature, que traz mais seções genéricas).

## Como um tema novo entra
1. Identidade da família em `src/lib/themes/familias-specs.ts` (estilos e textos dos 4 níveis).
2. Catálogo e manifesto de imagens em `src/lib/themes/families.ts` (12+ produtos, 4 categorias, variações, 1 esgotado).
3. Entrada em `catalog.ts` com `release: "review"` e, se pago sem preço aprovado, `pricePending: true`.
4. `npx tsx scripts/manifesto-temas.ts` gera os manifestos e o prompt das imagens.
5. Testes `tests/temas-familias.test.ts` e `tests/temas-pagos.test.ts` conferem manifesto, catálogo e lojas de demonstração.
6. Liberação para venda: o dono aprova visual e preço; troca `release` para `released`.
