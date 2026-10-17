# Racional visual — Brás Digital Club

## Ideia central

O sistema visual deve transmitir **movimento comercial, conexão e presença digital**, sem perder a credibilidade necessária para um produto usado diariamente. O símbolo circular representa simultaneamente a letra “b”, um pulso em expansão, conexão entre pessoas e a energia econômica do Brás. Essa leitura orienta tanto o site institucional quanto o painel interno.

A página pública tem a função de despertar interesse e construir percepção de valor. O painel tem a função de permitir trabalho rápido, seguro e previsível. Eles não devem parecer produtos diferentes: compartilham cores, ritmo, geometria, iconografia e voz; mudam apenas a intensidade.

## Princípios

### 1. Navy cria confiança

O navy `#0C1830` é a base institucional. Ele ancora a composição, dá contraste às cores vibrantes e comunica tecnologia com maturidade. Deve dominar headers importantes, hero, navegação dark, rodapé e superfícies de alto valor.

### 2. Azul elétrico move a ação

O azul `#315CFF` é a cor operacional: botões primários, links, seleção, navegação ativa, destaques e dados principais. Ele deve sinalizar ação, nunca virar decoração indiscriminada.

### 3. Ciano comunica pulso e resposta

O ciano `#00D4FF` funciona como energia, foco e conexão. Use em focus ring, pequenos acentos, linhas, indicadores e transições do gradiente. Evite textos longos em ciano sobre branco e evite grandes áreas sólidas muito luminosas.

### 4. Off-white humaniza

O off-white `#F4F1E9` reduz a frieza digital. Ele serve para lettering sobre navy, fundos editoriais, blocos institucionais e respiro visual. Em formulários extensos, branco ou cinza muito claro pode ser mais funcional.

## Proporção cromática recomendada

- 50–60% navy ou neutros estruturais.
- 25–35% branco/off-white e superfícies de leitura.
- 8–12% azul elétrico para ações e seleção.
- 3–6% ciano para pulso, foco e detalhe.

Essa proporção evita um produto excessivamente neon. A marca continua vibrante porque o azul e o ciano aparecem nos momentos certos.

## Linguagem das páginas públicas

As páginas públicas podem ser mais expressivas:

- Hero navy com logo escura/off-white e uma peça 3D à direita.
- Títulos grandes, curtos e com contraste alto.
- Gradientes usados como luz, caminho ou pulso — não como fundo de todo o site.
- Alternância entre seções off-white, brancas e navy para criar cadência.
- Cards com cantos de 14 a 24 px, bordas discretas e sombra azul-marinho suave.
- Fotografias de comerciantes e profissionais brasileiros em situações naturais, quando existirem, com tratamento sóbrio e iluminação realista.
- Texto sempre em HTML; imagens de hero não devem carregar slogans ou CTAs embutidos.

### Narrativa sugerida

1. **Pertencimento:** o negócio faz parte do pulso do Brás.
2. **Transformação:** conexão e presença digital tornam oportunidades mais acessíveis.
3. **Capacidade:** apresentar serviços e benefícios concretos.
4. **Confiança:** mostrar processos, parceiros e números apenas quando forem reais.
5. **Ação:** convite claro para conhecer, participar ou entrar em contato.

## Linguagem do sistema interno

O painel deve usar a marca com mais disciplina:

- Sidebar navy; logo escura/off-white quando expandida e monograma escuro quando recolhida.
- Área de conteúdo clara para leitura prolongada.
- Azul elétrico em botão primário, item ativo, link e controle selecionado.
- Ciano no foco de teclado e em indicadores de atividade.
- Cards majoritariamente neutros; cor aparece na informação, não na superfície inteira.
- Gráficos usam azul e ciano como primeira família, preservando cores semânticas distintas para sucesso, alerta e erro.
- Tabelas, formulários e modais priorizam contraste e densidade adequada.
- Dark mode usa navy como canvas e superfícies elevadas em `#132445`/`#172B52`, nunca preto puro como padrão.

## Relação entre site e painel

| Elemento | Página pública | Sistema interno |
|---|---|---|
| Navy | hero, header, footer, CTA | sidebar, topbar dark, canvas dark |
| Azul | CTA e links principais | ações, seleção, navegação ativa |
| Ciano | luz, linhas, detalhes | foco, atividade, dado secundário |
| Off-white | seções editoriais | texto em dark e superfícies especiais |
| Gradiente | momentos de impacto | uso raro em ação primária ou progresso |
| Peças 3D | hero e campanha | onboarding ou empty state especial, nunca decoração recorrente |

## Logos

- Superfície clara: `logo-clara.png`.
- Superfície escura: `logo-escura.png`.
- Espaço compacto: monograma correspondente ao fundo.
- Slogan: reservado a hero secundário, apresentação e footer com espaço suficiente.
- Nunca aplicar filtros CSS, inverter cores, inclinar, comprimir, adicionar sombra ou inserir a logo dentro de formas não previstas.
- A versão 3D não substitui a logo oficial em header, autenticação, sidebar ou documentos.

## Tipografia e iconografia

Preserve a tipografia já adotada pelo produto quando ela tiver boa legibilidade. Caso o projeto ainda não tenha uma família definida, escolha uma sans-serif contemporânea de ampla cobertura, com títulos entre 650–800 e corpo entre 400–500. A tipografia da logo faz parte da imagem e não deve ser reconstruída com fonte aproximada.

Ícones devem ter construção consistente, preferencialmente traço de 1,75–2 px, cantos levemente arredondados e tamanhos de 16, 20 ou 24 px no painel. Não misture bibliotecas com estilos visivelmente diferentes.

## Movimento

Animações podem remeter ao pulso: expansão suave, revelação radial ou deslocamento de luz. Duração recomendada de 160–240 ms em interface e até 700 ms em hero. Respeite `prefers-reduced-motion`; nenhuma tarefa do sistema deve depender de animação.

## Acessibilidade

- Garantir WCAG AA para texto e controles.
- Ciano não deve ser usado sozinho para texto pequeno em fundo claro.
- Estado nunca deve depender apenas de cor; combine ícone, texto ou forma.
- Focus ring sempre visível.
- Logos decorativas recebem `alt=""`; logo com função de link recebe texto alternativo equivalente ao nome da marca.
- Dark mode deve manter bordas e hierarquia, não apenas trocar fundo e texto.

## Resultado esperado

O usuário deve reconhecer a mesma marca antes e depois do login. A página pública desperta desejo e posiciona o negócio; o painel confirma essa promessa com clareza, velocidade e consistência. A identidade ganha valor porque aparece como um sistema coerente, não como uma coleção de telas coloridas.
