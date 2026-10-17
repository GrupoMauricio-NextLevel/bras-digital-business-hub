# Prompt engenheiro mestre — NextLevel v2

Você é responsável pela arquitetura frontend, design system e implementação visual da marca-mãe **NextLevel** neste repositório. Execute a aplicação completa do kit anexado no site institucional e no painel Master, com qualidade de produção e revisão visual. Use os padrões reais do projeto e preserve o funcionamento dos produtos existentes.

## Objetivo final

O visitante da página institucional e o operador do Master devem reconhecer o mesmo produto: marinho como estrutura, azul royal como ação, azul luminoso e turquesa como energia, e a assinatura Prisma Digital integral como expressão da marca.

A NextLevel é a marca-mãe. O contexto Master usa seu tema. Marcas-filhas continuam com registros próprios. A implementação não pode aplicar o tema NextLevel indiscriminadamente a todos os tenants.

## 1. Leitura obrigatória e recuperação do contexto

1. Leia integralmente `CLAUDE.md`, `AGENTS.md` e instruções aplicáveis à pasta do projeto.
2. Localize a raiz `nextlevel/` dos ZIPs; todos os volumes são complementares e devem ser extraídos no mesmo destino.
3. Leia `docs/RACIONAL-DIRECAO-VISUAL-PAINEL-E-PAGINAS.md`, `LEIA-ME.md`, `docs/MEMORIA-DECISOES-APROVADAS.md`, `docs/INVENTARIO.md`, `docs/CONTRASTE.md`, `tokens/brand-tokens.json` e `integration/brand.config.json`.
4. Descubra e utilize as skills realmente instaladas adequadas a frontend, design system, UI/UX, acessibilidade, testes, performance e revisão visual. Não invente nomes de skills nem afirme execução que não ocorreu.
5. Inspecione framework, roteamento, componentes, registro de marcas, tokens, autenticação, Master, páginas públicas, assets, testes e comandos de build.

## 2. Decisões que já estão fechadas

- Nome exato: **NextLevel**.
- Linha de apoio exata: **SOLUÇÕES DIGITAIS**.
- Símbolo: **NL Orbital**, com N inclinado e pé curto do L à direita.
- Lettering: **Orbital em Avanço**, contido nas imagens; não é fonte instalável.
- Acabamento aprovado: **Prisma Digital aplicado em toda a palavra**, com versões clara e dark.
- Paleta: marinho `#070F22`, royal `#365BFF`, azul luminoso `#12B8F4`, turquesa `#2AD7C0`, gelo `#F3F6FC`.
- Slogan de briefing preservado: “Estrutura digital para o seu negócio ir além.”. Nenhum novo slogan foi aprovado.
- Domínio citado no briefing: `nextlevelgroup.com.br`; confirme a configuração no repositório antes de preencher `canonicalUrl`.

Não retome explorações verdes, raio amarelo, outras opções de símbolo ou fontes aproximadas. Não gere outra identidade durante esta implementação.

## 3. Auditoria e plano executável

Faça um mapa curto com os arquivos reais envolvidos e avance para implementação:

- Onde o Master escolhe marca e tema.
- Onde ficam logos e metadados públicos.
- Quais componentes concentram ações, bordas, foco e superfícies.
- Quais rotas/IDs devem ser preservados.
- Onde a marca histórica aparece.
- Qual teste demonstra que uma marca-filha mantém sua identidade.

Preserve alterações locais existentes. Use migração visual reversível. Não altere banco, IDs de tenant, contratos, autenticação ou permissões para trocar cores e imagens.

## 4. Instalação dos arquivos

Adote a convenção real de assets. Caminho sugerido: `public/brands/nextlevel/`, com `assetBase` equivalente a `/brands/nextlevel`. Se o projeto usa imports compilados, adapte o registro mantendo rastreabilidade dos nomes.

Copie as pastas `logos/`, `3d/`, `social/` e `referencias/` conforme necessidade. Documentação e tokens podem ficar em uma pasta interna de design system; evite publicar documentos internos desnecessariamente.

Use `integration/brand.config.json` como contrato de referência, não como imposição de framework. Resolva os caminhos de assets a partir de uma única raiz. Verifique existência e case de cada arquivo em ambiente Linux.

## 5. Design system com isolamento

- Adapte os tokens fornecidos ao provider/tema existente.
- O CSS fornecido usa escopo `[data-brand="nextlevel"]`, sem `:root` global.
- A troca claro/dark usa o atributo `data-theme` desse contexto; adapte ao padrão do projeto.
- Portais de modais/tooltips devem receber o tema correto.
- Se houver uma marca-filha aninhada no Master, controle explicitamente a fronteira dos tokens; herança CSS não pode recolorir o produto-filho.
- Reutilize componentes do design system em vez de duplicar variantes em cada tela.
- Mantenha primitivos de cor separados de papéis semânticos: não substitua todos os verdes de sucesso por turquesa.

## 6. Componente único de marca

Crie ou adapte um componente equivalente a:

`BrandLogo({ brand: 'nextlevel', surface: 'light' | 'dark', treatment: 'prisma' | 'interface' | 'mono', layout: 'horizontal' | 'vertical' | 'symbol', supportLine: boolean, size, priority })`.

Regras:

- `surface` representa a superfície real. Card branco em tela dark continua recebendo logo clara.
- `prisma`: `logos/prisma/logo-clara.png` e `logo-escura.png`, para áreas amplas.
- `interface`: `logos/flat/logo-clara.png` e `logo-escura.png`, para cabeçalhos e sidebar.
- Sem linha de apoio: arquivos em `logos/sem-apoio/`.
- Vertical: arquivos em `logos/vertical/`.
- Símbolo compacto: `logos/monogramas/monograma-flat.png`.
- Documento em uma cor: `logos/monocromaticas/logo-positiva.png` e `logo-negativa.png`.
- Reservar dimensões intrínsecas e usar `object-fit: contain`.
- Não usar `filter: invert()`, CSS para recolorir PNG, sombras adicionais, recortes ou distorção.
- Não reconstruir a marca com texto digitado.
- Tratar a versão de interface como derivação óptica oficial para escala pequena, não como nova direção estética.

## 7. Painel Master

Aplicar em telas compartilhadas do Master e nos elementos institucionais do grupo:

- Sidebar expandida/recolhida, header, menu de usuário, breadcrumbs e seletor de marcas.
- Login, recuperação de acesso e onboarding institucional.
- Dashboard, tabelas, filtros, formulários, tabs, cards, métricas, gráficos, modais, toasts, paginação e empty states.
- Ação principal sólida com os tokens de ação; texto branco.
- Navegação ativa com superfície de marca discreta e marcador visível.
- Foco acessível: pelo menos 2 px e offset de 2 px, sem depender apenas de sombra.
- Borda decorativa em separadores; borda forte para identificar controles.
- Gráficos com série principal royal e secundária azul/turquesa; legendas e formas para não depender apenas de cor.
- Densidade de informação e alinhamento numérico próprios de uso diário.

O Prisma Digital valoriza a marca no login e em espaços amplos. O restante do painel deve continuar limpo, legível e rápido. Não aplicar bevel, neon e brilho em todas as tabelas, textos ou botões.

## 8. Página institucional pública

Atualize a homepage existente do grupo. Use `/` no domínio configurado; se o projeto centraliza marcas em subrotas, respeite a arquitetura existente e avalie `/nextlevel`. Não crie uma página paralela órfã sem necessidade.

Estrutura:

1. Header com navegação curta, assinatura legível e CTA real.
2. Hero navy com título e texto HTML. Usar `3d/02-metal-anodizado-sem-texto.png`, que concentra símbolo à esquerda e deixa direita livre. Componha texto à direita; no mobile, empilhe sem cortar o símbolo.
3. Ecossistema com SuperDrop, NextLevel Commerce, Brás Digital Club e NextLevel Cargas, respeitando assets atuais de cada marca e links reais.
4. Serviços: loja montada, migração, temas, tráfego e consultoria, somente conforme ofertas existentes.
5. Método e benefícios com linguagem concreta.
6. Provas reais, FAQ, contato e CTA final.
7. Footer com assinatura e endosso corporativo.

Copy sugerida, editável: “O próximo nível começa com estrutura.” e “Tecnologia, serviços e operações conectadas para quem vende online.”. Não incorporar essas frases dentro dos PNGs nem apresentá-las como slogan recém-aprovado.

Não invente usuários, faturamento, clientes, parceiros, avaliações, prêmios ou funcionalidades de IA. O símbolo pode sugerir inteligência; a copy descreve funcionalidades efetivamente disponíveis.

## 9. Família e endosso

NextLevel é a marca-mãe e o Master. Não substituir logos de SuperDrop, Commerce, Cargas ou Brás Digital Club pelo monograma NL. Registrar separadamente cada tema e cada conjunto de assets.

Endosso de produto recomendado: “um sistema NextLevel”. Endosso corporativo: “parte do Grupo NextLevel”. Use texto HTML e uma assinatura discreta; respeite a relação real entre os negócios. Não crie badge de certificação ou selo de prêmio.

## 10. Acessibilidade e contraste

Os pares de tokens fornecidos foram calculados em sRGB: texto comum 4,5:1 e limites/foco testados 3:1. Revalidar estados e superfícies compostas na aplicação.

- Turquesa e azul luminoso não são cores padrão de corpo de texto sobre branco.
- Não colocar texto branco sobre a ponta turquesa de um gradiente sem medir o contraste local.
- Use texto, ícone ou forma para comunicar estados além da cor.
- Garanta labels de formulário, foco, semântica de navegação e ordem de teclado.
- Link com logo recebe nome acessível; logo decorativa duplicada pode usar alt vazio.
- Respeite `prefers-reduced-motion`, zoom e reflow.

## 11. SEO, compartilhamento e PWA

- Favicons PNG 16/32/48 e `favicon.ico`.
- Apple Touch Icon 180 e ícones PWA 192/512.
- Use `icon-maskable-512.png` para purpose maskable, com zona segura preservada.
- Adapte `integration/site.webmanifest`: start_url, scope e caminhos ao app real. Não substitua manifest de outra marca.
- Instale `social/og-nextlevel-1200x630.png` nos metadados sociais.
- Atualize title e description. Confirme `canonical`, `og:url`, sitemap e rotas com a configuração validada do grupo.
- Não alterar DNS nem publicar externamente sem autorização específica da tarefa no repositório.

## 12. Performance

- Use dimensão explícita e versão responsiva adequada.
- Não faça preload de todas as logos. Priorize apenas o recurso crítico da dobra inicial.
- Hero é potencial LCP: se visível inicialmente, não aplicar lazy por padrão; escolher prioridade conforme framework e medição.
- Recursos abaixo da dobra podem usar lazy.
- Preserve PNGs mestres; gere WebP/AVIF derivados quando o pipeline já suportar sem destruir alpha.
- Não converter PNG para um SVG que apenas contém a imagem; isso não cria vetor real.
- Elimine layout shift, downloads duplicados e efeitos que prejudicam scroll ou tabelas.

## 13. Conferência e aceite

Faça capturas em 390 px, 768 px e 1440 px, claro e dark. Revise pelo menos homepage, login, dashboard Master, tabela, formulário e sidebar recolhida. Verifique logos sobre cards claros em dark e dark em light.

Execute formatter, lint, typecheck, testes e build com os comandos reais do projeto. Acrescente testes úteis de resolução de logo, escopo de tema e regressão entre marcas se o projeto já tiver infraestrutura. Não crie testes que apenas repetem os hexadecimais sem demonstrar comportamento.

Valide:

- Nome e linha de apoio exatos.
- Prisma integral preservado nos pontos de marca.
- Logos menores legíveis e sem fundos embutidos.
- Tema NextLevel aplicado ao Master e site, sem vazamento para marcas-filhas.
- Favicons, social e PWA corretos.
- Links, contatos e CTAs reais.
- Sem dados inventados.
- Sem novos erros no build e verificações.

## 14. Relatório de entrega

Informe arquivos alterados, rotas atendidas, componentes centrais, mapeamento de logos por superfície, tokens aplicados, materiais editoriais usados, screenshots, comandos de verificação e resultados. Liste referências antigas mantidas e motivo, além das pendências reais.

Avance com autonomia nas decisões reversíveis. Solicite orientação apenas quando faltar uma decisão que mude o escopo, houver operação destrutiva, publicação externa ou alteração de dados/contratos. Não encerre na etapa de plano: implemente e revise a experiência completa.
