# Cadastro de produto da loja virtual: auditoria e prompt de melhorias (2026-11-17)

Frente: **[E-commerce]**. Pedido do dono (17/11/2026), com print do celular logado como cliente: "não dá pra excluir uma foto no modo PC", "não dá pra editar a grade de tamanho de sapatos", "não dá pra excluir produtos, somente arquivar", "a edição está muito limitada".

Telas auditadas: `/merchant/catalogo` (lista), `/merchant/catalogo/new` (novo), `/merchant/catalogo/[id]` (edição). As três reaproveitam o código do fornecedor (`src/app/supplier/products/**`) com `independent`/`commerce` ligados. Conferido no código e na demonstração local (lojista `lojista@commerce.demo`, tela de 1440 px).

---

## 1. O que está quebrado (defeito, não falta de recurso)

| # | Problema | Onde | Efeito para o cliente |
|---|---|---|---|
| B1 | **Fotos somem do editor.** O editor só mostra fotos cujo endereço começa com `http` ou `data:` (`isReal` em `images-editor.tsx`). Foto enviada pela biblioteca (`/assets/...`), trazida pelo "Migrar" ou das demonstrações (`/portal/...`) aparece na lista e na loja, mas o editor mostra **"0 de 6"**. Conferido: o "Poncho de tricô cru" tem foto na lista e nenhuma no editor. | `src/app/supplier/products/[id]/images-editor.tsx:12` | **Não dá para excluir nem reordenar essas fotos** (é o relato do dono). Pior: se o cliente adicionar uma foto nova e clicar "Salvar fotos", as fotos antigas são **apagadas sem aviso**. |
| B2 | **Preço editado não chega à loja.** O formulário de edição grava `products.suggestedPriceCents`, mas a loja cobra `store_products.priceCents` (gravado só na criação). | `updateProductAction` em `src/app/actions/supplier.ts:108` | O cliente muda o preço, a lista mostra o novo, **a loja continua cobrando o antigo**. |
| B3 | **"Ativar" um rascunho não coloca o produto na loja.** O status muda para Ativo, mas a linha de `store_products` só é criada no cadastro. Vale para o "Duplicar" (que nasce rascunho) e para o botão "Ativar" em lote. | `setProductsStatus` em `src/lib/domain/products.ts` | Produto aparece "Ativo" no painel e **não aparece na loja**. |
| B4 | **Categoria não pode ser mudada.** O cadastro diz "dá para mudar depois", mas a edição não tem o campo. | `ProductForm` em `product-forms.tsx` | Produto que entrou em "Geral" fica em "Geral" para sempre. |
| B5 | A caixa "Aparência nos buscadores" **vaza para fora do cartão** em 1440 px e mostra o endereço **`sualoja.superdrop.com.br`** (marca errada na Commerce). | `product-forms.tsx:414` | Visual quebrado e marca errada (regra: marca vem de `getBrand()` / endereço real da loja). |
| B6 | Galeria espremida na coluna estreita: uma única caixinha de "Adicionar foto" de ~60 px; os botões de cada foto (lixeira, capa, mover) **só aparecem ao passar o mouse** e têm 14 px. | `MediaGallery` dentro do cartão lateral | No PC o cliente não acha a lixeira. Somado ao B1, "não dá para excluir foto". |
| B7 | Remover foto exige um segundo clique em "Salvar fotos", separado do "Salvar produto". Sair sem salvar perde a mudança sem aviso. | `images-editor.tsx` | Cliente acha que excluiu, volta e a foto está lá. |

## 2. Botões e funções que faltam

**Produto**
- **Excluir produto** (não existe em lugar nenhum; só Arquivar). Regra proposta: sem pedido nem movimentação além do estoque inicial → apaga de verdade; com histórico de venda → "excluído" some de todas as telas e da loja, mas o pedido antigo continua mostrando o item (o banco liga pedidos à variação, `order_items`).
- Excluir em lote na lista (hoje só Ativar / Rascunho / Arquivar).
- Editar **SKU** (o "Duplicar" gera `...-COPIA`, como no print, e não há como corrigir) e **endereço da página** (`slug`).
- **Ver na loja** (abrir a página do produto) e **Salvar e próximo**.
- Preço **"de / por"** (preço riscado de promoção) — conferir se já existe em outro lugar antes de criar.

**Tamanhos, cores e grade (variações)**
- Só existem grades de **camisa** (P a 2XL; infantil 18 a 28). **Não há grade de calçado** (33 a 44), nem números de calça (36 a 48), nem "Tamanho único".
- Depois de criado, **não dá para adicionar, renomear, reordenar ou remover tamanho**, nem trocar a grade. Tamanho limitado a 6 letras.
- **Cores** só existem escondidas na tela de Atacado (`salvarCoresDoProduto`, que nunca apaga cor). Precisam estar no cadastro, com remover cor e foto por cor.
- SKU e código de barras (EAN) por variação: hoje só leitura.
- A aba "Grades" (pacote de atacado) é **só leitura**: não dá para editar quantidade por tamanho, preço ou apagar a grade.
- Estoque: "Ajustar" e "Entrada" abrem um diálogo para um tamanho por vez. Falta editar o estoque de todos os tamanhos numa tabela só.

**Linguagem e organização**
- "Custo / Sugerido / Mínimo" é vocabulário de fornecedor da rede. Na loja própria o certo é **"Preço de venda"**, "Custo (só você vê)" e, se fizer sentido, "Preço promocional".
- O formulário inteiro vive numa coluna lateral estreita; "Compre junto" fica solto abaixo de tudo. Falta uma ordem de leitura (Fotos → Informações → Preço → Variações e estoque → Frete → Buscadores) e um botão de salvar só, fixo no rodapé.

## 3. Pergunta antes de seguir (regra de 17/11)

- **Excluir de verdade ou "esconder"?** Recomendo as duas: apagar de verdade quando não houve venda (o cliente espera isso) e esconder com histórico quando houve (obrigação de manter o pedido legível). Precisa de decisão nova (D328).
- **Grades de calçado e outras:** em vez de criar uma grade fixa para cada ramo, recomendo **modelos de grade prontos (Camisa, Calçado, Calça, Infantil, Único) + grade livre editável**, e permitir mudar depois do cadastro. Hoje a grade foi pensada só para camisas de time (origem SuperDrop), o que trava lojistas de calçado, moda, cosméticos.

---

## 4. Prompt para desenvolver (copiar e colar)

> **Papel:** você é o engenheiro do NextLevel Commerce. Leia `CLAUDE.md`, `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` e este arquivo (`docs/prompts/cadastro-produto-auditoria-e-melhorias.md`) antes de mexer. Frente **[E-commerce]**. As telas `/merchant/catalogo/**` reaproveitam `src/app/supplier/products/**`: toda mudança deve continuar funcionando para o fornecedor (sem quebrar o SuperDrop, que está em pausa).
>
> **Objetivo:** o lojista consegue cadastrar e **editar tudo** de um produto no celular e no PC: fotos, informações, categoria, SKU, preço, tamanhos, cores, estoque, grade e excluir, sem nenhum efeito escondido (o que ele vê no painel é o que a loja mostra).
>
> **Fase P1 — defeitos (primeiro, publicar sozinha):**
> 1. Fotos: o editor deve mostrar **toda** imagem que a loja mostra (mesma regra do `ProductArt`/`product-gallery`: `http`, `data:image`, `/assets/`, `/portal/`, `/demos/`, qualquer `/`; só `art:` fica de fora). Teste: produto com foto `/assets/x` e `/portal/x` aparece no editor, pode ser excluído, e adicionar uma foto nova não apaga as antigas.
> 2. Botões de cada foto sempre visíveis no PC (não só ao passar o mouse), lixeira com área de clique de 32 px ou mais e confirmação desfazível (“Foto removida · Desfazer”). Galeria em largura cheia.
> 3. Preço: na loja independente, salvar o produto atualiza também `store_products.priceCents` (e `packPriceCents`). Teste de domínio que prova que a loja passa a cobrar o preço novo.
> 4. Status: passar um produto da loja independente para Ativo (edição, lote ou duplicado) cria/ativa a linha em `store_products`; Rascunho/Arquivado desativa. Teste.
> 5. Categoria editável na edição (escolher existente ou criar). Teste.
> 6. Prévia de buscadores sem vazar do cartão e com o endereço real da loja (sem `superdrop` fixo). Varra 360 px e 1440 px com `e2e/polish-v8.mjs`.
>
> **Fase P2 — excluir produto:** registre a decisão D328. Ação `excluirProdutosAction(ids)` pelo domínio (`src/lib/domain/products.ts`), com `runAction`, dono conferido (`ownedBy`) e auditoria. Sem pedido e sem movimentação além da inicial → apaga produto, variações, estoque, grades, acesso e `store_products`. Com histórico → marca como excluído (novo status ou coluna `deletedAt`, migração com `npx drizzle-kit generate --name produto-excluido`), some da lista, da loja, do feed e da busca, e o pedido antigo continua mostrando nome, tamanho e preço. Botão "Excluir" na página do produto (zona de perigo, confirmação digitando o nome ou com contagem) e "Excluir" na ação em lote da lista. Testes: os dois caminhos e "não exclui produto de outra loja".
>
> **Fase P3 — tamanhos, cores e grade editáveis:**
> 1. Modelos de grade prontos: Camisa (PP a XGG/2XL), **Calçado (33 a 44)**, Calça (36 a 48), Infantil, Tamanho único, e Livre. Sem limite de 6 letras (até 12).
> 2. Na edição, uma tabela **Variações e estoque** (cor × tamanho): adicionar tamanho, renomear, reordenar, remover; adicionar e remover cor (trazendo `salvarCoresDoProduto` do Atacado para cá, sem duplicar a regra); SKU e código de barras por linha; estoque editável na própria tabela (gera movimentação `ADJUSTMENT` com observação, nunca abaixo do reservado).
> 3. Remover variação: sem histórico → apaga; com venda → esconde (mesma regra da P2). Remover tamanho que está numa grade de atacado avisa e ajusta a grade.
> 4. Aba "Grades" editável: quantidade por tamanho, preços, apagar grade.
> 5. Testes de domínio para cada regra (adicionar/remover tamanho, cor, estoque em lote, variação com venda).
>
> **Fase P4 — organização da tela (seguir as skills `painel-interno` e `qa-visual`):** uma coluna principal com seções na ordem Fotos → Informações (nome, descrição, categoria, SKU, endereço) → Preço (Preço de venda, Preço "de" opcional, Custo "só você vê") → Variações e estoque → Frete → Buscadores → Compre junto; um botão **Salvar** só, fixo no rodapé, que salva fotos e dados juntos e avisa ao sair com mudanças não salvas. Topo com "Ver na loja", "Duplicar", "Arquivar" e menu com "Excluir". Mesmo formulário no "Novo produto". Na loja independente, nada de "Sugerido/Mínimo" (são da rede de fornecedor).
>
> **Regras:** valores em centavos; textos em português claro; permissões no servidor; um lojista nunca mexe em produto de outro; AA sem rolagem horizontal em 360 px; mudança de comportamento só com teste. Durante o trabalho rode tipos, lint e os testes dos arquivos mexidos (`tests/product-editor.test.ts` e novos); bateria completa e `npm run build` só no fim de cada fase. Publique cada fase numa montagem só e mande ao dono prints reais (PC 1440 px e celular 360 px) da tela de edição antes/depois, incluindo: foto sendo excluída, grade de calçado editada, produto excluído.
