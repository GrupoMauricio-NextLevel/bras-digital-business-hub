# Prompt mestre para Claude Code — Brás Digital Club

Implemente a identidade consolidada **Brás Digital Club** neste repositório, cobrindo o painel interno e a página institucional pública. Trabalhe até deixar a integração funcional, responsiva, acessível e verificada.

## 1. Antes de alterar o código

1. Leia integralmente `CLAUDE.md`, `AGENTS.md`, documentação do projeto e instruções locais aplicáveis.
2. Descubra as skills realmente instaladas e use as melhores skills disponíveis para: arquitetura frontend, design system, acessibilidade, performance, testes, SEO e revisão visual. Não invente nomes de skills nem finja tê-las executado.
3. Inspecione a arquitetura, o framework, o roteamento, o registro de marcas/tenants, os temas, o painel, a página pública, os testes e o pipeline de build.
4. Localize todas as referências à identidade antiga “Brás Digital” e documente onde aparecem antes de substituí-las.
5. Faça backup ou mova ativos legados para uma pasta de histórico. Não apague nada até provar que não há referências restantes.

## 2. Fonte oficial dos ativos

Este pacote deve ser copiado para o diretório de ativos estáticos apropriado do projeto, preservando nomes e subpastas. A raiz recebida é `bras-digital-club/`.

Arquivos essenciais:

- `logos/flat/logo-clara.png`
- `logos/flat/logo-escura.png`
- `logos/flat/logo-clara-com-slogan.png`
- `logos/flat/logo-escura-com-slogan.png`
- `logos/vertical/logo-vertical-clara.png`
- `logos/vertical/logo-vertical-escura.png`
- `logos/monogramas/monograma-claro.png`
- `logos/monogramas/monograma-escuro.png`
- `logos/favicons/favicon-16.png`
- `logos/favicons/favicon-32.png`
- `logos/favicons/favicon-48.png`
- `logos/app-icons/apple-touch-icon-180.png`
- `logos/app-icons/icon-192.png`
- `logos/app-icons/icon-512.png`
- `3d/02-metal-anodizado-sem-texto.png`
- `tokens/brand-tokens.css`
- `tokens/brand-tokens.json`

Não redesenhe, não recorte o símbolo, não substitua a tipografia da imagem, não use filtros CSS para mudar cores e não incorpore texto novo dentro dos PNGs.

## 3. Fonte única de verdade da marca

Crie ou atualize o registro central de marcas/tenants com:

- `id`/slug: `bras-digital-club`
- nome: `Brás Digital Club`
- slogan: `Conecte seu negócio ao pulso do Brás.`
- navy: `#0C1830`
- azul elétrico: `#315CFF`
- ciano: `#00D4FF`
- off-white: `#F4F1E9`
- gradiente: `linear-gradient(135deg, #315CFF 0%, #00D4FF 100%)`
- logos claras/escuras e monogramas com caminhos explícitos
- ícones PWA e favicons

Não duplique esses valores em componentes isolados. O painel e a página externa devem consumir o mesmo registro/tokens. Garanta isolamento de tema: essa marca não pode alterar outras marcas do ecossistema.

## 4. Aplicação no painel de controle

Implemente o tema de Brás Digital Club em todo o contexto desse tenant:

- Sidebar expandida: assinatura horizontal correta para o fundo.
- Sidebar recolhida: monograma correspondente ao tema.
- Header, breadcrumbs, menus, tabs, cards, modais, formulários, tabelas e estados ativos.
- Botão primário com azul elétrico ou gradiente aprovado, mantendo contraste WCAG AA.
- Focus ring ciano visível; não remova outline sem substituição acessível.
- Fundo dark em navy e superfícies elevadas em tons derivados, sem transformar tudo em neon.
- Gráficos podem usar azul/ciano como série de marca, mas cores semânticas de sucesso, alerta e erro devem continuar inequívocas.
- Alturas e larguras das logos devem preservar proporção; use `object-fit: contain` e nunca estique.
- Defina largura mínima legível e espaçamento de proteção. Em espaços muito pequenos use o monograma.
- Em troca de tema claro/escuro, troque o arquivo da logo, não aplique `filter: invert()`.
- Garanta navegação por teclado, estados hover/focus/disabled e contraste dos textos.

## 5. Página pública institucional

Crie ou atualize a rota pública da marca. Se a convenção do projeto permitir, use `/bras-digital-club`. A extensão final do domínio ainda não foi informada; não invente URL canônica.

Estrutura recomendada:

1. Header com logo oficial, navegação curta e CTA.
2. Hero premium com fundo navy, texto HTML à esquerda e `3d/02-metal-anodizado-sem-texto.png` à direita. A imagem deve ser decorativa (`alt=""`) quando não comunicar informação única.
3. Proposta de valor clara para comerciantes, empreendedores e profissionais conectados ao ecossistema do Brás.
4. Blocos de capacidades/benefícios com linguagem objetiva e sem métricas inventadas.
5. Como funciona em 3 ou 4 passos.
6. Área de confiança/prova somente com dados reais existentes no repositório; use placeholders explícitos se os dados não existirem.
7. FAQ útil e conciso.
8. CTA final.
9. Footer com versão escura da logo e links institucionais reais.

Direção de copy: profissional, direta, contemporânea e comercial. Valorize conexão, presença digital, relacionamento, oportunidades e pulso econômico do Brás. Use exatamente o slogan aprovado. Não faça promessas financeiras, não invente número de associados, parceiros, faturamento ou alcance.

## 6. SEO, compartilhamento e PWA

- Atualize title, description, Open Graph, Twitter Card e dados estruturados apropriados.
- Use favicons 16/32/48, Apple Touch 180 e manifest 192/512.
- Só configure `canonical`, `og:url`, sitemap e redirects definitivos quando a extensão do domínio for confirmada.
- Gere imagem social a partir dos ativos existentes se o projeto já tiver pipeline para isso; não use a peça 3D como substituta da logo no header.

## 7. Performance

- Use dimensões explícitas, `srcset`/`sizes` quando suportado, preload apenas da logo crítica e lazy loading para recursos abaixo da dobra.
- Converta cópias de apresentação para WebP/AVIF somente se o pipeline preservar os PNGs oficiais como fonte.
- Evite layout shift e carregamento duplicado.
- Não comprima favicons nem logos de forma que crie halos.

## 8. Verificação obrigatória

1. Execute formatter, lint, typecheck, testes e build usando os comandos reais do projeto.
2. Verifique painel e página pública em desktop e mobile, nos modos claro e escuro.
3. Revise visualmente logo expandida, monograma, favicon, hero, header e footer.
4. Faça busca final pela marca legada e confirme que referências restantes são intencionais.
5. Verifique que nenhuma outra marca/tenant foi alterada por vazamento de tokens.
6. Liste arquivos modificados, decisões, testes executados, resultados e pendências reais.

## Critérios de aceite

- Nome e slogan corretos em todos os pontos.
- Logo clara em superfícies claras e logo escura/off-white em superfícies escuras.
- Monograma nos contextos compactos.
- Painel com tema isolado, acessível e responsivo.
- Página pública com hero 3D, copy como HTML e CTA funcional.
- Favicons/PWA instalados.
- Sem métricas inventadas, sem domínio inventado, sem filtros de cor e sem deformação da marca.
- Build e verificações do projeto concluídos sem erros novos.

Ao encontrar ambiguidade pequena, siga os padrões existentes do repositório. Pare e peça decisão apenas se houver risco de quebrar produção, alterar dados, publicar externamente ou escolher uma extensão de domínio não informada.
