# Prompt engenheiro mestre — implementar identidade Brás Digital Club

Você é o engenheiro responsável por integrar a nova identidade **Brás Digital Club** de ponta a ponta neste repositório. Sua missão inclui arquitetura do design system, aplicação das logos, tema do painel interno, página pública institucional, acessibilidade, desempenho, SEO, testes e revisão visual. Não entregue apenas recomendações: implemente, valide e documente.

## Resultado obrigatório

Ao final, o usuário deve perceber a mesma marca na experiência pública e autenticada. O site será mais expressivo e aspiracional; o painel será mais funcional e disciplinado. Ambos devem compartilhar tokens, logos, geometria, iconografia e voz.

## Materiais obrigatórios

Leia primeiro:

1. `docs/RACIONAL-DIRECAO-VISUAL-SISTEMA-E-PAGINAS.md`
2. `docs/LEIA-ME.md`
3. `docs/INVENTARIO.md`
4. `integration/brand.config.json`
5. `tokens/brand-tokens.css`
6. `tokens/brand-tokens.json`

Considere todos os PNGs de `logos/` como ativos oficiais. Considere `3d/` como material promocional/editorial, nunca como substituto da marca oficial.

## Fase 1 — diagnóstico

- Leia integralmente as instruções do repositório (`CLAUDE.md`, `AGENTS.md` e equivalentes).
- Identifique framework, roteamento, design system, registro de marcas/tenants, modo claro/escuro, autenticação, painel, site público, SEO, testes e pipeline.
- Descubra e use as skills realmente instaladas mais adequadas a frontend, design system, acessibilidade, performance, SEO, testes e revisão visual. Não invente skills.
- Encontre toda referência à marca antiga “Brás Digital”, incluindo assets, textos, slugs, configurações, metadados e banco de dados/migrations.
- Registre riscos antes de mudar contratos públicos, rotas ou dados persistidos.

## Fase 2 — arquitetura de marca

- Copie `bras-digital-club/` para a convenção de ativos do projeto, preservando a hierarquia.
- Crie uma fonte única de verdade para identidade e caminhos; adapte `integration/brand.config.json` ao tipo do projeto.
- Não duplique hexadecimais em componentes.
- Faça escopo por `data-brand="bras-digital-club"`, provider, tenant ou mecanismo equivalente.
- Garanta que nenhuma outra marca receba esses tokens por cascata.
- Implemente um componente de logo que aceite pelo menos `surface: light|dark`, `variant: full|tagline|monogram` e tamanhos responsivos.
- Troque arquivos conforme contraste; nunca use `filter: invert()`.

## Fase 3 — sistema interno

- Sidebar expandida com assinatura horizontal; recolhida com monograma.
- Aplicar navy na estrutura, neutros nas áreas de trabalho e azul nas ações.
- Implementar estados hover, pressed, disabled, selected, loading, success, warning e error sem confundir cor de marca com semântica.
- Revisar header, breadcrumbs, tabs, filtros, forms, tabelas, cards, modais, toast, paginação, gráficos, empty states e autenticação.
- Garantir responsividade, densidade coerente e navegação por teclado.
- Implementar dark mode com superfícies `#0C1830`, `#132445` e `#172B52`, texto off-white e bordas perceptíveis.
- Usar peças 3D apenas em onboarding ou empty state de alto valor, se fizer sentido; não poluir tarefas recorrentes.

## Fase 4 — página pública

- Criar/atualizar a rota `/bras-digital-club`, respeitando a convenção existente.
- Hero: fundo navy, logo correta, título e CTA em HTML e `3d/02-metal-anodizado-sem-texto.png` como visual principal.
- Construir narrativa: pertencimento, transformação, capacidades, como funciona, benefícios, confiança, FAQ e CTA final.
- Usar exatamente: **“Conecte seu negócio ao pulso do Brás.”**
- Não inventar métricas, clientes, depoimentos, integrações, preços ou parceiros.
- Manter alternância clara/off-white/navy e limitar o gradiente aos pontos de energia.
- Criar versão mobile específica do hero e evitar cortes no símbolo.

## Fase 5 — metadados e ativos de plataforma

- Instalar favicon 16/32/48 e ICO.
- Instalar Apple Touch 180 e PWA 192/512.
- Atualizar title, description, Open Graph, Twitter Card, manifest e dados estruturados adequados.
- Não definir canonical, `og:url`, sitemap ou redirects para domínio definitivo sem confirmação da extensão.
- Manter PNGs oficiais como fonte; WebP/AVIF podem ser derivados para conteúdo editorial.

## Fase 6 — qualidade

- Contraste WCAG AA, foco visível, semântica correta, alt text apropriado e `prefers-reduced-motion`.
- Dimensões explícitas para imagens, lazy loading abaixo da dobra e ausência de layout shift.
- Sem distorção, sombra, contorno, recoloração ou compressão agressiva das logos.
- Testar no mínimo: mobile estreito, tablet, desktop, tema claro, tema escuro, sidebar aberta e recolhida.
- Executar os comandos reais de formatter, lint, typecheck, testes e build.
- Fazer inspeção visual das telas principais; se houver ferramenta de captura, gerar evidências antes/depois.
- Buscar referências legadas ao final e justificar qualquer ocorrência mantida.

## Migração segura

Arquive ativos antigos antes de removê-los. Preserve redirects e compatibilidade de slugs quando necessário. Não execute alteração destrutiva em dados nem publique externamente sem autorização. Mudanças reversíveis dentro do repositório fazem parte da implementação.

## Relatório final obrigatório

Entregue:

- resumo do que foi implementado;
- lista de arquivos modificados;
- onde cada logo é usada;
- tokens aplicados;
- rotas e componentes alterados;
- testes/comandos executados e resultados;
- screenshots ou indicação de revisão visual;
- referências legadas restantes;
- pendências reais, especialmente domínio e conteúdo ainda não fornecido.

Não encerre apenas porque o código compilou. Encerre quando painel e página pública estiverem visualmente coerentes, acessíveis, responsivos e usando corretamente os arquivos oficiais.
