# Racional visual — site público e painel

## 1. Papel da marca

NextLevel Commerce é a plataforma de lojas virtuais, não a marca-mãe nem uma agência genérica. Deve transmitir estrutura, movimento e clareza operacional. O parentesco com NextLevel vem da tipografia avançada e do universo azul. A distinção vem do símbolo NE arredondado, do nome completo e da organização do produto.

O símbolo combina um N de fita contínua com três barras que sugerem E. A continuidade remete à passagem entre etapas da operação; as barras sugerem módulos conectados, não três funcionalidades específicas. Não afirmar que representa recursos certificados, inteligência artificial própria ou capacidades não verificadas.

## 2. Cores oficiais da identidade

| Papel | Cor | Uso |
|---|---|---|
| Marinho estrutural | #101A33 | Fundo dark, títulos no claro, estrutura |
| Azul principal | #3F65FF | Assinatura e destaque de marca |
| Ciano | #27C7F2 | Acentos, realce de material, detalhes |
| Gelo | #F3F6FC | Fundo claro e lettering dark |

Gradiente de marca: linear-gradient(135deg, #3F65FF 0%, #27C7F2 100%). O gradiente pertence a detalhes de marca e áreas decorativas, não a todos os componentes. Não colocar texto branco pequeno diretamente sobre ciano. A paleta da marca e as cores funcionais não precisam ser idênticas: os tokens funcionais ajustam contraste.

## 3. Site institucional

- Fundo claro predominante em páginas explicativas, alternando seções marinho pontuais para profundidade.
- Cabeçalho: logo flat transparente; apresentação de marca pode usar Prisma em dimensão maior.
- Hero: título e explicação em HTML, até dois CTAs claros e demonstração REAL do produto se disponível. Não usar imagens geradas de dashboards como prova de funcionalidade.
- Sequência recomendada: proposta de valor → demonstração → capacidades verificadas → implantação/migração, se oferecidas → integrações realmente disponíveis → planos reais → dúvidas → CTA final.
- Não inventar preços, integrações, desempenho, volume de lojas, depoimentos ou disponibilidade de IA. Reutilizar a informação validada do projeto.
- Tipografia de interface recomendada: família legível já existente no projeto, preservando licença e carregamento. Não tentar usar o lettering raster da logo como fonte de títulos.
- Bordas sutis, áreas de respiro, hierarquia forte; evitar vidro e neon em cada cartão.
- Efeitos Prisma são acentos de identidade, não uma camada de ruído sobre o conteúdo.

## 4. Painel operacional SaaS

Objetivo: trabalhar diariamente com legibilidade e baixa fadiga visual.

- Modo claro: superfícies brancas/gelo, texto marinho e ações azuis sólidas.
- Dark: superfícies marinho com elevação por luminância, não somente sombras; texto gelo.
- Logo flat no topo lateral; símbolo isolado na navegação recolhida. Não esmagar a assinatura para caber.
- Não usar grandes imagens, 3D ou brilhos no fundo de tabelas e formulários.
- Estado ativo: fundo suave + marcador + texto, não apenas mudança de cor.
- Sucesso, atenção e erro mantêm cores semânticas distintas da identidade. Sempre associar texto ou ícone.
- Preservar densidade útil, filtros, ordenação, paginação, formulários, confirmações e permissões.

## 5. Regras de aplicação de logo

- Prisma: apresentação, tela de boas-vindas e espaços amplos.
- Flat: navegação, cabeçalho, rodapé e componentes compactos.
- Monocromática: aplicações de uma tinta e casos em que o colorido não funciona.
- Vertical: composição estreita ou apresentação centralizada; não como substituição automática de toda assinatura.
- Monograma: favicon, navegação compacta, avatar da plataforma.
- Área livre inicial recomendada: ao menos 1/4 da altura do símbolo em cada lado, ajustar por QA.
- Não distorcer, rotacionar, recolorir por filtros CSS ou acrescentar sombras arbitrárias.
- Não usar a versão escura em superfície clara nem a clara sobre marinho.
- Em tamanhos pequenos, omitir a linha de apoio por ocultação do conjunto inadequado ou escolher símbolo; não recortar letras.

## 6. Arquitetura do grupo e do produto

Manter NextLevel Master com seu kit próprio. O novo kit só deve atingir o tenant/produto da plataforma. A assinatura institucional pode usar “uma plataforma do Grupo NextLevel” como texto HTML discreto, sem transformar o logo da marca-mãe em selo de certificação.

As vitrines de clientes mantêm nome, logo, cores e SEO próprios. Não aplicar a paleta da plataforma ao storefront de todos os lojistas. Eventual crédito de tecnologia em rodapé depende das regras reais do produto e do contrato.

## 7. Acessibilidade e movimento

Validar WCAG AA: texto comum 4,5:1, texto grande 3:1, elementos não textuais essenciais 3:1. docs/CONTRASTE.md documenta pares estáticos; isso não certifica a aplicação inteira. Testar teclado, foco, nomes acessíveis, erros, zoom 200%, leitores de tela e movimento reduzido.

Animações só se ajudarem compreensão, sem flashes. Respeitar prefers-reduced-motion. Elementos decorativos usam alt vazio; logos com função de navegação devem ter nome acessível contextual.

## 8. Desempenho

Usar os PNGs responsivos adequados ao tamanho de tela, com dimensões reservadas. Nunca carregar todas as variantes. Não ampliar raster além do seu uso confortável. Conversões WebP/AVIF precisam preservar alpha e identidade e ser comparadas visualmente. No futuro, vetorizar manualmente e revisar antes de substituir os masters.

## 9. Critérios de aceite

Nome correto em login, cabeçalho, rodapé, títulos e metadados; tema correto sem flash; logos legíveis em desktop/mobile; contraste, navegação e fluxos preservados; nenhuma mudança em outros tenants ou marcas de clientes; relatório real de testes e limitações.
