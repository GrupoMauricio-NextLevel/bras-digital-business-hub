# Prompt mestre — aplicar a vitrine de soluções

Aplique os lotes de imagens anexados à página de soluções da NextLevel MARCA-MÃE no projeto existente. Não é um novo rebrand de NextLevel Commerce e não autoriza alteração global do sistema.

## Inspeção e skills

Leia LEIA-ME.md, INVENTARIO.md, MAPA-ASSETS.json, COPY-REVISADA.md e o briefing preservado. Se o repositório possuir solucoes-vitrine-imersiva-construcao.md/D162, leia-o antes de editar. Ele não foi inspecionado na produção destas imagens; não invente seus requisitos.

Inspecione AGENTS.md/instruções locais, alterações existentes, framework, rota da página, componentes, catálogo de serviços, preços e fonte de campanhas. Descubra skills realmente instaladas para frontend, design systems, acessibilidade, performance e testes. Use as pertinentes; não invente skills nem instale ferramentas por conta própria.

## Instalação e mapa

Extraia os quatro lotes preservando pastas e nomes. Instale as imagens em /images/solucoes/lote-N/ ou no diretório público equivalente. Adapte o prefixo numa configuração central, sem espalhar caminhos literais pelo projeto. MAPA-ASSETS.json contém a lista exata.

1. Jornada: lote-1/sol-jornada-1-fundacao.png até sol-jornada-5-escala.png, em ordem. Desktop usa paisagens; mobile usa os arquivos correspondentes com sufixo -retrato.
2. Portas: lote-2/sol-porta-comecar.png, sol-porta-migrar.png, sol-porta-vender-mais.png e sol-porta-minha-plataforma.png.
3. Campanhas: lote-3/sol-campanha-commerce.png, sol-campanha-temas.png e sol-campanha-diagnostico.png.
4. Fecho: lote-3/sol-fecho.png.
5. Cardápio: lote-4/sol-familia-plataforma.png, sol-familia-superdrop.png, sol-familia-loja-pronta.png, sol-familia-migracao.png, sol-familia-temas.png, sol-familia-marketing.png, sol-familia-consultoria.png, sol-familia-white-label.png e sol-familia-cursos.png.

Não associar uma família ao serviço errado. Evitar reutilizar o mesmo asset em toda a página. A hero própria da página não foi solicitada como arquivo separado; não alegar que existe. Manter o tratamento existente ou usar a primeira cena somente se a arquitetura aprovada pedir.

## Layout e movimento

Desktop: jornada com imagem de cenário compartilhada, transição de opacidade entre estados e conteúdo textual à esquerda. Se usar sticky, preservar scroll natural, altura razoável, teclado e leitura sequencial. Nada de capturar a rolagem, bloquear scroll ou exigir animação para revelar texto.

Não usar morphing entre fotografias: há diferenças geométricas. Crossfade discreto é o tratamento adequado. Em prefers-reduced-motion e em dispositivos com poucos recursos, mostrar estados estáticos ou troca direta. Sem autoplay pesado.

Mobile: picture com media query para o retrato correspondente da jornada; preservar área calma superior para a copy. Portas usam imagem retrato com texto em HTML no terço inferior. Nas demais peças, texto à esquerda em desktop; no mobile preferir texto separado acima/abaixo em vez de recorte central que elimine o assunto.

Imagens horizontais 3:2 e retratos 2:3. Começar em object-position 50% 50%, ajustar por peça em navegador real. Não forçar todas a uma proporção 16:9 sem conferir. Se necessário escurecer fundo atrás de copy, usar overlay CSS controlado, sem reexportar a foto com texto embutido. Cor e posição da copy precisam respeitar contraste real.

## Conteúdo e verdade comercial

Imagens são cenários ilustrativos gerados por IA, não fotos reais de clientes/equipe/sede. Não criar depoimentos ou cases fictícios a partir delas. Telas abstratas não são screenshots reais nem confirmação de integrações.

Usar copy em HTML, seguindo COPY-REVISADA.md e o conteúdo aprovado do projeto. Confirmar diagnóstico gratuito, prazo de resposta, temas de compra única, preços e disponibilidade antes de exibir. Campanha só aparece se oferta ativa na fonte de verdade do Master. Não inserir preços ou métricas inventados. Não prometer aquisição diária, faturamento ou resultados garantidos.

Preservar seleção de serviços, totais à vista/mensal e itens sob consulta se já existirem. Não alterar checkout, regras comerciais, autenticação, permissões ou dados como parte da troca visual.

## Performance e acessibilidade

Não pré-carregar 27 PNGs. Dar prioridade à imagem inicial realmente visível e carregar próximas fases de forma progressiva. Usar decoding=async e lazy loading abaixo da dobra. Se converter para WebP/AVIF, manter originais, proporção e inspeção visual. Não instalar novas bibliotecas pesadas para efeitos simples.

Reservar width/height e aspect-ratio para evitar saltos. Texto permanece selecionável. Imagens puramente decorativas usam alt vazio; se transmitirem conteúdo, alt curto da ação sem fingir que é caso real. Não duplicar texto acessível em camadas de crossfade. Testar links, foco, contraste e redução de movimento.

## Escopo e validação

Mudar apenas a vitrine de soluções NextLevel e seus componentes necessários. Não recolorir outros tenants nem as lojas de clientes. Preservar logos aprovadas e tokens da marca-mãe, sem copiar cores novas de outro kit.

Verificar em 360/768/1440 px, com e sem movimento, navegação de teclado, zoom 200%, carregamento lento e imagens indisponíveis. Executar testes/lint/build existentes e registrar resultados reais. Conferir caminhos, imagens corretas por seção, cortes, legibilidade e peso carregado inicialmente.

Entregar implementação efetiva, arquivos alterados, testes e pendências; não apenas plano. Não fazer deploy, mudar DNS ou publicar externamente sem autorização específica.
