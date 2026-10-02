---
name: pagina-de-vendas
description: Construir ou revisar uma página de vendas pública de alto nível (home de produto SaaS/plataforma) com direção de arte, movimento e desempenho. Use quando o dono pedir "super página de vendas", "home nível Nuvemshop/Shopify", landing page ou reconstruir a home de uma marca. Exige ativos reais (fotos, vídeo, telas) e conferência por capturas, nunca só "compilou".
---

# Página de vendas de alto nível

## Premissa (aprendida com erro)
Uma página assim **não é só código**: é ativo produzido (fotografia com direção, vídeo, telas do produto em dispositivos) + coreografia de rolagem + texto afiado. Código sem ativo parece "feito por IA". **Nunca** preencha a falta de ativo com foto genérica, gradiente ou retângulo. Se faltar, pare, liste exatamente o que falta (arquivo, proporção, formato, prompt de geração) e use um marcador claramente identificado.

## Roteiro
1. **Anatomia da referência.** Para cada seção da referência (capturas ou site), anote: campo de cor, composição, tipo de ativo, movimento, pergunta do visitante que responde, CTA. Sem copiar texto, imagem, marca ou código.
2. **Contrato de ativos.** Escreva o manifesto (`public/portal/<marca>/v2/…`): nome, proporção, peso máximo, formato (AVIF/WebP/MP4/WebM), prompt de geração, o que ilustra. O dono gera; você consome.
3. **Estrutura e narrativa.** Roteiro curto (seção → dúvida → mensagem → evidência → ação). Cada seção acrescenta informação.
4. **Construção** (servidor por padrão; JavaScript só onde há interação):
   - Campos de cor imersivos que se alternam, topo arredondado entre seções, escala de tipografia grande (`clamp`), uma palavra de destaque no título.
   - Navegação flutuante em pílula; CTA sempre visível no celular.
   - Mosaicos (bento) com fotografia + recorte da interface real do produto dentro da situação.
   - Dispositivo "colado" (sticky) com lista de recursos que se destaca conforme a rolagem (scroll-spy com `IntersectionObserver`).
   - Movimento nativo: `animation-timeline: view()` com alternativa sem suporte, faixa em loop em CSS, palavra que alterna com texto fixo para `prefers-reduced-motion`.
   - Vídeo só com `poster`, `muted`, `playsinline`, `preload="none"`/lazy, ≤ 1,5 MB, e a primeira dobra funcionando sem ele.
   - Sem biblioteca nova sem justificar peso e benefício.
5. **Verdade.** Sem métricas, logos, depoimentos ou clientes inventados. Só anuncie o que existe no código e diferencie "disponível", "demonstração" e "em breve". Dados de demonstração identificados.
6. **Desempenho e acessibilidade.** Imagem da primeira dobra com prioridade e dimensões reservadas; demais lazy; sem salto de layout; contraste AA (`readableOn`); foco visível; teclado; sem rolagem horizontal em 360 px; movimento reduzido respeitado.
7. **Conferência visual obrigatória** (Playwright, `playwright-core`, Chromium em `/opt/pw-browsers/chromium`): capturas em 360, 768 e 1440 px, no topo e em pelo menos 5 pontos de rolagem; interagir (menu, abas, simulação, rolagem do dispositivo). **Compare lado a lado com a referência** e liste as diferenças. Mínimo de 3 rodadas de ajuste antes de apresentar. Não declare qualidade porque compilou.
8. **Entrega:** caminho para abrir, capturas examinadas, decisões, verificações e limites (o que não foi medido), uma pergunta de aprovação. Sem push/deploy sem o dono aprovar.

## Contra o "visual de IA"
Evite: gradientes roxo/azul genéricos, cartões brancos idênticos com sombra em tudo, círculos com ícone padrão, números gigantes com pílula verde, grade de 3 cartões repetida, vidro fosco sem função, texto enorme cobrindo a tela. Prefira: fotografia com direção de arte, interface real do produto, tipografia com personalidade, ritmo de cor, composição assimétrica.

## No projeto
Marca vem de `getBrand()`/`brand.ts` e das variáveis `--brand-*`; estilos isolados por marca; foco atual só Commerce e SuperDrop; textos em português claro; preços em centavos com `formatBRL`; páginas com banco usam `force-dynamic`. Rodar `npx tsc --noEmit`, `npx eslint src e2e tests` e `npm run build`. Referências do dono: `docs/design/HOME-COMMERCE-V1.md`, `docs/prompts/home-commerce-super-pagina.md`.
