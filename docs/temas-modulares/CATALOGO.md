# Catálogo de temas por família e nível

> Fonte de verdade: `src/lib/themes/catalog.ts`. Estados: **à venda** (`released`), **em revisão** (`review`: demonstração por link, não vende nem instala) e rascunho (`draft`: não aparece).
> Nenhum preço foi alterado nesta rodada. Os valores "propostos" abaixo são só sugestão para o dono decidir.

| Família (loja de exemplo) | N1 Grátis | N2 NextLevel Commerce | N3 Commerce PRO | N4 Commerce ULTIMATE |
|---|---|---|---|---|
| Base (catálogo Moda) | **Starter**: à venda, grátis | (nenhum) | (nenhum) | **Signature**: à venda, R$ 1.499 |
| Moda (Trama Urbana) | **Trama**: em revisão, grátis | **Lume**: à venda, R$ 149 | **Editorial**: à venda, R$ 699 | **Atelier**: em revisão, preço em definição |
| Casa (Casa em Ordem) | **Lar**: em revisão, grátis | **Ninho**: em revisão, R$ 149 | **Varanda**: em revisão, preço em definição | **Morada**: em revisão, preço em definição |
| Sport (Linha de Jogo) | **Lance**: em revisão, grátis | **Torcida**: em revisão, preço em definição | **Arena**: à venda, R$ 299 (composição própria, mantida) | **Pódio**: em revisão, preço em definição |
| Beauty (Bela Essência) | (próxima etapa) | | | |
| Conecta (Ponto Conecta) | (próxima etapa) | | | |
| Atacado (Giro Distribuidora) | (próxima etapa) | | | |

## Proposta de preços (NÃO aplicada; decisão do dono)
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
