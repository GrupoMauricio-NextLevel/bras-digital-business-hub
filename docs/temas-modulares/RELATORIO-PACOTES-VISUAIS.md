# Relatório · Incorporação dos pacotes visuais (Lotes 1 e 2)

Branch local `claude/incorporacao-pacotes-visuais`, **sem push, merge ou deploy** (pedido do dono). Decisão D86 em `docs/design/DECISIONS.md`.

## O que entrou
| Loja (família) | Imagens prontas | Arquivos | Posições dos temas com imagem real | Categorias com imagem | Logo |
|---|---|---|---|---|---|
| Trama Urbana (Moda) | 60/60 | 116 | 17/17 | 4/4 | sim (PNG) |
| Linha de Jogo (Esporte) | 60/60 | 116 | 17/17 | 4/4 | sim (PNG) |
| Casa em Ordem (Casa) | 39/60 | 39 | 0/17 | 3/4 (Têxteis pendente) | não |
| Bela Essência (Beleza) | 27/60 | 27 | 0/17 | 0/4 | não |
| Ponto Conecta (Tecnologia) | 12/60 | 12 | 0/17 | 0/4 | não |
| Giro Distribuidora (Atacado) | 12/60 | 12 | 0/17 | 0/4 | não |
| **Total** | **210** | **322** | | | |

- Arquivos em `public/demos/<loja>/v1/`, conferidos um a um pelo SHA-256 e pelo tamanho do manifesto. WebP, AVIF e PNG da mesma imagem contam como uma.
- Só GENERATED. Nenhuma imagem nova, nenhum caminho inventado para PENDING.
- Catálogo das demonstrações = catálogo do pacote: 12 SKUs por loja, com os nomes, categorias e preços dos pacotes.
  - Só as lojas de demonstração foram alteradas. Nenhum dado de cliente foi tocado.
  - Esgotado só no TU-012, que é o único marcado assim nos pacotes.
- As 3 campanhas viram os slides e banners, com título e chamada em texto da página. O link de cada campanha mostra exatamente os SKUs dela (`/catalog?produtos=...`).
- Identidade: cores (`identidade.json`) nos temas da família, logo no cabeçalho (Moda e Esporte) e imagem de compartilhamento (Moda e Esporte).

## O que o sistema ganhou
- AVIF com reserva em WebP: banners, fotos de produto e pré-carregamento da imagem principal.
- Galeria do produto com miniaturas das fotos do próprio site e das enviadas pela biblioteca. Antes só mostrava endereços externos.
- "Grade de categorias" com blocos opcionais "Imagem de categoria", para qualquer loja.
- Filtro do catálogo por SKUs, para os links de campanha.
- Na loja publicada, peças de banner, mosaico, galeria e imagem-com-texto sem foto não aparecem. O destaque sem foto fica baixo, só com título e chamada. No editor tudo continua visível, para o lojista ver onde falta foto.
- **Defeito encontrado e corrigido no caminho:**
  - O Next pré-carrega em segundo plano os links que aparecem na tela. O pré-carregamento do link de campanha deixava uma conexão aberta no navegador.
  - Links de banner e da galeria agora não são pré-carregados; a página abre normalmente no clique.
  - Medido: antes, 13 de 36 aberturas não terminavam de carregar; depois, 0 de 80.

## Verificado
- `npx vitest run`: 85 arquivos, **648 testes passando**.
  - Novos: `tests/pacotes-visuais.test.tsx` (9).
  - Ajustados: `temas-familias`, `temas-pagos`, `theme-render`.
- `npx tsc --noEmit`, `npx eslint src e2e tests scripts`: limpos. `npm run build`: passa, sem "Export encountered".
- **Navegador, 24 lojas** (6 famílias × 4 níveis):
  - 6 telas (home, coleção, produto, carrinho, fechamento simulado, confirmação) × 360/768/1440 px;
  - **432 verificações, 0 problemas**;
  - sem rolagem lateral, sem violação grave no axe, sem erro no navegador, **sem imagem quebrada, sem 404 e sem pedido falho**;
  - registro em `evidencias/e3/bateria-24-lojas.txt`.
- **Galeria de temas e Moda:** 90 verificações, 0 problemas.
- **Verificações antigas, todas OK:**
  - demonstração geral;
  - loja de temas (compra e instalação);
  - temas pagos;
  - motor de temas;
  - editor de tema;
  - editor por nível (biblioteca, foco, conflito entre abas).

  Registro em `evidencias/e3/rodada-final.txt`.
- **Capturas** em `evidencias/e3/capturas/`: home em 360/768/1440 e produto em 1440 de cada loja, mais as galerias.

## Limitações reais
- Casa, Beleza, Tecnologia e Atacado não têm imagens de campanha, editorial nem logo nos pacotes.
  - Nessas lojas, o destaque mostra só texto, e mosaico, apoio e galeria não aparecem.
  - A loja é bonita nos produtos, mas a página inicial é mais simples que a da Moda e do Esporte.
- Beleza: 5 SKUs com menos de 3 fotos (BE-008 tem 2; BE-009 a BE-012 têm 1).
  - Tecnologia e Atacado: 1 foto por SKU.
  - BE-002-02 (montagem em painéis) é a 2ª foto do kit; aparece inteira na galeria e nunca no cartão.
- Logos são PNG conceituais e ainda precisam de versão vetorial.
- Atacado: o catálogo do pacote é de kits com preço unitário de kit. Não há quantidade por caixa no pacote, então os textos do tema não prometem caixa fechada com quantidade.
- Tempo de carregamento da imagem principal no celular (LCP): não foi medido de novo nesta rodada.
- Integração validada só no ambiente local de demonstração; nada foi publicado.
