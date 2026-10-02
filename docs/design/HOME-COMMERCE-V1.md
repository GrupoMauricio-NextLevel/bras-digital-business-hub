# Home da NextLevel Commerce, v1 (protótipo em revisão)

> 2026-10-02. Branch `visual/v4`, **sem push e sem deploy** até o dono aprovar. Escopo: só a página inicial pública da Commerce (e a casca com cabeçalho e rodapé dela). Não toca em planos completos, temas, editor, painéis, outras marcas, pagamentos, banco ou regras.

## Decisões
1. **Mensagem:** "Crie a loja virtual da sua marca e cuide de tudo em um só painel." O título diz "loja virtual" na primeira linha; o painel entra como segunda metade da promessa.
2. **Percurso:** cabeçalho → primeira dobra com loja de demonstração grande → três lojas de segmentos diferentes → simulação de personalização → três tarefas do painel → como começar → temas e valores → dúvidas → chamada final.
3. **Visual:** papel quente (`#F5F1E8`), tinta azul-marinho (`#14213D`), amarelo-etiqueta (`#F2B600`) só em botões (texto escuro, contraste 8,7), azul `#1F47C9` para links e rótulos. Títulos Plus Jakarta Sans, texto Inter (já embutidas). Sem sombras decorativas, sem cápsulas, sem efeitos de entrada.
4. **Assinatura provisória:** "NextLevel ▪ Commerce" em texto (proposta); a logomarca definitiva não foi trocada.
5. **Isolamento:** a casca da Commerce é `src/components/portal/commerce/*`, usada só quando a marca é `NEXTLEVEL_COMMERCE` (`src/app/(portal)/layout.tsx`). SuperDrop e demais marcas seguem como antes. As demais páginas do portal da Commerce (`/faq`, `/planos`, `/quero-minha-loja`) herdam o novo cabeçalho e rodapé.
6. **Honestidade:** nada de atacado, influenciadores, feed ou live. Cadastro por convite: o botão leva a `/quero-minha-loja` (lista de interesse já existente) e o texto diz isso.

## Cada afirmação e sua base
| Afirmação na página | Base no código |
|---|---|
| Quatro temas; Starter grátis; Arena, Editorial, Signature com preço | `src/lib/themes/catalog.ts` (valores lidos de lá, com `formatBRL`) |
| Cores, fontes, cantos e botões ajustáveis; logo, textos e ordem das seções | `ThemeStyle` em `src/lib/themes/types.ts`, editor `/theme-editor` |
| Prévia antes de publicar; pedidos de teste | prévia do dono (`nl-preview`), pedidos de teste em `orders` |
| Pedidos com situação; cliente acompanha por link | painel `/merchant/orders`, `/store/[slug]/acompanhar` |
| Vendas por estado, margem, recompra, horários | `src/lib/domain/analytics.ts`, `/merchant/analytics` |
| Pix e cartão em até 6x pelo Mercado Pago, conferido pela API | `src/lib/payments/mercadopago.ts`; `CLAUDE.md` (pagamento só vale depois de conferido) |
| Domínio próprio no plano de loja própria | `src/lib/features.ts` |
| Equipe responde ao contato | `/quero-minha-loja` (lista de interesse com contato por WhatsApp) |
**Não verificado em produção:** que o Mercado Pago da NextLevel/lojista esteja conectado, que o e-mail transacional esteja ligado e a cotação de frete com tokens reais. Por isso a home **não** promete frete, e-mail ou atendimento além do contato inicial.

## Dados de demonstração
- Lojas "Fio & Linha" (Starter), "Ateliê Sala" (Editorial), "Rota 7" (Signature): nomes, produtos e preços fictícios, marcados como demonstração; preços em centavos e `formatBRL`, isolados de cobrança e permissões (`demo-stores.ts`).
- Trechos de painel: dados fictícios, com legenda "Dados de demonstração". Nenhum dado de lojista.
- As mini-lojas são **ilustrações no estilo dos temas**, não o motor de temas renderizado.

## Fotos
Fotografias de uso livre pela **Unsplash License** (uso comercial permitido, atribuição não obrigatória), baixadas em 2026-10-02, escolhidas **sem marca de terceiros visível**, em `public/portal/commerce/`. **São provisórias**: devem ser trocadas pelas imagens geradas a partir de `docs/prompts/imagens-temas-gpt.md`. IDs de origem (photo-…): 1515886657613-9f3515b0c78f, 1434389677669-e08b4cac3105, 1523381210434-271e8be1f52b, 1551028719-00167b16eac5, 1519415943484-9fa1873496d4, 1594938298603-c8148c4dae35, 1586023492125-27b2c045efd7, 1555041469-a586c61ea9bc, 1540574163026-643ea20ade25, 1567016432779-094069958ea5, 1598300042247-d088f8ab3a91, 1503602642458-232111445657, 1505740420928-5e560c06d30e, 1584917865442-de89df76afd3, 1590874103328-eac38a683ce7, 1617038220319-276d3cfab638, 1627123424574-724758594e93, 1553062407-98eeb64c6a62, 1583394838336-acd977736f90. Uma das fotos mostra uma pessoa (look de moda); confirmar com o jurídico se quiser publicar com rosto identificável.

## Interações e acessibilidade
Menu do celular (botão, Esc fecha, foco), abas das lojas de exemplo (setas do teclado), simulação (grupos de opções com `role="radio"`), perguntas em `<details>`. Sem JavaScript para o conteúdo estático; sem animação, então `prefers-reduced-motion` não tem o que reduzir. Foco visível nos controles; o e2e confere 360, 768 e 1440 px sem rolagem horizontal.

## Verificações
`e2e/commerce-home.mjs` (3 larguras: estrutura, rolagem horizontal, imagens, menu, abas, simulação, perguntas, links, console), `npx tsc --noEmit`, `npx eslint src e2e tests`, `npm run build`.
**Não feito:** medição de desempenho (Lighthouse), teste em navegadores reais de celular, revisão com leitor de tela, axe automatizado nesta página.
