# Plano da vitrine v4: do tema Starter para o nível das melhores lojas

> 2026-10-02. O dono aprovou o tema **Starter** (loja básica do membro) como ponto de partida. Referência de qualidade: capturas do tema "Maximize" (Shopify) que o dono enviou. **Objetivo: igualar o nível de acabamento e de recursos de vitrine, sem copiar layout, marca ou imagens.** Execução visual: Codex; contratos, dados, desempenho e testes: Claude.

## 1. O que o Starter já tem e fica como base
Barra de anúncio, cabeçalho (logo, menu, WhatsApp, carrinho), destaque principal, faixa de confiança, atalhos de categorias, vitrine de produtos, banners, texto, grade do catálogo, produto com galeria e miniaturas, relacionados, carrinho, selos de segurança, rodapé NextLevel. Motor de seções com editor de tela cheia (`src/lib/themes/*`, `src/components/storefront/*`). **Não jogar fora: evoluir seção por seção.**

## 2. O que a referência mostra e o Starter ainda não tem
| # | Na referência | No Starter hoje | Ação |
|---|---|---|---|
| 1 | Barra de anúncio **rolando** com ícones (3 a 4 avisos) | Um aviso fixo | Seção com vários avisos e ícone, rolagem suave desligável |
| 2 | Cabeçalho com **busca grande + seletor de categoria**, **menu grande** (submenus), crachás "Oferta/Novo/Atacado" nos itens, conta, localização | Cabeçalho simples | Busca instantânea (já existe `search.ts`), menu grande, crachás nos itens |
| 3 | **Cartões de categoria com miniaturas e contagem** ("43 itens") | Chips de texto | Novo bloco de categoria com 2 miniaturas e contagem |
| 4 | **Destaque em mosaico**: um painel grande e dois menores, selo "Economize 45%" e "Mais vendido" | Destaque único | Layout "mosaico" na seção de destaque |
| 5 | **Mais vendidos por abas** de categoria | Vitrine única | Vitrine com abas |
| 6 | **Cartão de produto**: marca, segunda foto ao passar o mouse, estrelas, preço, **cores/variantes em bolinhas**, selos (promoção, oferta do fim de semana), **estoque** ("poucas unidades"), prova social ("94 adicionaram hoje") | Foto, nome, preço | Evoluir `product-card.tsx`; selos e estoque vêm de dados que já temos |
| 7 | **Carrinho em gaveta** com quantidade, remover, **nota, desconto, estimar frete, compartilhar**, "você vai gostar também" (venda cruzada) | Página de carrinho | Gaveta lateral; frete por CEP já existe; cupom (P1d) entra aqui |
| 8 | **Página de produto**: galeria dupla, selo "queda de preço", avaliações, **"356 pessoas viram"**, principais características, faixa de combo, perguntas frequentes | Galeria, compra, tamanhos | Acrescentar seções; **prova social só com número real** (nunca inventado) |
| 9 | **Rodapé grande**: ajuda 24h, políticas, coleções, boletim com e-mail, redes | Rodapé básico | Rodapé em colunas com boletim (consentimento LGPD) |
| 10 | Tema claro/escuro, seletor de idioma/moeda | Não | Só o que fizer sentido: idioma/moeda ficam fora (mercado BR) |

**Regras:** prova social e estoque baixo só com dado real (a referência usa números de demonstração); desempenho antes de enfeite; tudo em pt-BR; sem copiar imagens, logotipo ou textos do tema de referência.

## 3. Ordem de execução
1. **Alicerce (feito nesta rodada):** paletas por marca (`brand-palette.ts`, variáveis `--brand-*`, teste de contraste).
2. **Cartão de produto e cabeçalho** (itens 2 e 6): são o que mais aparece em toda página.
3. **Gaveta do carrinho** (item 7), junto com o cupom de desconto (P1d).
4. **Destaque em mosaico, categorias com miniaturas e vitrine por abas** (itens 3 a 5).
5. **Página de produto** (item 8) e **rodapé** (item 9).
6. **Desempenho:** cache das páginas públicas, imagens otimizadas, CDN na frente; metas medidas (Lighthouse mobile ≥ 90, LCP < 2,5 s, CLS < 0,1).
Cada etapa: teste de renderização do tema, e2e, acessibilidade (axe), quatro larguras, sem regressão nos temas Arena, Editorial e Signature.

## 4. Divisão de trabalho
- **Codex:** desenho e componentes das seções acima, na branch `codex/visual`, vendo ao vivo em `localhost:3100`.
- **Claude:** novos tipos de seção no esquema (`sections.ts`), dados reais (estoque, vendidos hoje, avaliações), gaveta e frete, cache/imagens/CDN, testes.
- Quem precisar mexer na área do outro faz o mínimo e avisa.
