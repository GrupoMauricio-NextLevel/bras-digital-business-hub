# Diferenças deliberadas em relação à referência (e por quê)

A referência (`commerce-interface-reference`) foi extraída de outro produto, com paleta verde-esmeralda. Aqui só **medidas, padrões e comportamento** foram transportados. Onde o repositório real ou uma decisão anterior do dono pede outra coisa, a diferença está registrada. Qualquer melhoria foi feita **no núcleo, para todos os projetos**, nunca como exceção de uma empresa.

| # | Tema | Referência | Aqui | Motivo |
|---|---|---|---|---|
| 1 | Cores | Esmeralda/lima, menu sempre escuro | Papéis de cor por projeto (`themes.ts`); em modo claro o menu é claro (derivado do canvas), em escuro é escuro | Direção Claro/Escuro aprovada pelo dono para o painel Commerce; o contrato permite trocar por projeto sem mexer em componente |
| 2 | Fonte | Plus Jakarta Sans (Google Fonts, rede) | Plus Jakarta Sans **empacotada** (`src/app/fonts/jakarta-latin.woff2`, variável 200–800) para todo o sistema; Inter fica só para os temas de loja dos lojistas | Sem dependência de rede, desempenho e licença controlados. Verificado no navegador (`QA`: família aplicada em todas as telas) |
| 3 | Drawer do celular | CSS próprio, sem trava de foco | Radix Dialog (foco preso, Escape, retorno do foco, rolagem travada) | A referência avisa que essa parte era lacuna de acessibilidade |
| 4 | Camadas | Menu 60, véu 55, diálogo 100/101 como adaptação | Escada única: topo 40, véu 55, menu 60, dropdown 70, skip 80, diálogo 100, **popover 130**, toast 140 | Menus abertos dentro de um diálogo ficam acima dele |
| 5 | Tema | Dark por padrão, chave `ds-theme`, tokens em `html[data-theme=dark] body` | **Claro por padrão**, chave `nl-theme` (`light`/`dark`/`system`), variáveis no `<html data-ds-theme>` | Direção do dono (claro por padrão); um único dono do tema e herança para portais |
| 6 | Espaçamento | Valores soltos | Escala nomeada `--ds-space-*` + medidas observadas preservadas como tokens (gap KPI 14, pad do conteúdo `clamp(18px,2.4vw,34px)`) | Documentar sem inventar uma grade de 8 px |
| 7 | Raios | Famílias 12/18/20/22/24 | Preservadas como tokens (`--ds-r-*`); `rounded-lg` do Tailwind passou a 18 px | Os componentes antigos usam `rounded-lg` para caixas médias |
| 8 | Cor de estado | (no tema) | Iguais em todos os temas (sucesso, atenção, erro, info) | Status não é identidade de marca; contraste AA testado por tema |
| 9 | Vidro/lâminas/reflexo | Não existe | `ds-hero`, `ds-blade`, reflexo único na entrada, superfície quente | Melhoria aprovada no Commerce (V1/V2); entrou no **núcleo**, disponível a todos os temas, parada com `prefers-reduced-motion` |
| 10 | Acento secundário | Lima/ouro | `--ds-accent` (cobre no Commerce, navy no NextLevel, cobre no SuperDrop) | Papel decorativo do contrato; nunca marca estado nem ação financeira |
| 11 | Navegação em grupos que abrem | Seções sempre abertas | Mesma `SideNav` com duas apresentações: `sections` e `accordion` | O painel do lojista Commerce tem muitos módulos; é escolha do fluxo, não da empresa |
| 12 | Painel Master por produto | — | Master usa o tema NextLevel; o produto aberto é só orientação (barra lateral do seletor) | Uma casca e um tema por aplicação |
| 13 | Páginas de loja do cliente final (`/store/<slug>`) | — | **Fora do escopo** | O tema da loja pertence ao lojista (editor de temas); não é identidade da plataforma |
| 14 | Ilustrações dentro das páginas públicas (janelas e celulares de exemplo) | — | Mantêm cores próprias (são desenhos de uma loja) | Não fazem parte do sistema; documentadas como exceção |

## O que a referência não provava e continua sem prova aqui
Certificação WCAG completa, leitor de tela, impressão, rede lenta, Safari/Firefox. O que foi medido está em `qa/` e no relatório.

## Expedição (densidade de toque)
A tela de Expedição (`/supplier/dispatch`) usa `data-density="touch"`: botões de 48 px com raio 14 px, fonte de 17 px e barra superior de 64 px (nas demais telas: 44 px, 12 px, 16 px e 65 px). É a única diferença de geometria medida entre todas as contas (varredura de 256 medidas em 1440/840/390/320). Motivo: uso com luva e leitor de código no chão de expedição. Mesma família de componentes, só alvos maiores.

## Limites da medição automática
- A "esteira ao vivo" das páginas públicas troca cartões o tempo todo com animação de entrada; o axe pode medir um cartão em meio ao desvanecer e acusar contraste (12 de 440 renderizações). O texto real tem contraste adequado (tinta sobre superfície, par já testado).
- A varredura por rastreio de links do Master (140 telas) é lenta e não terminou; o Master foi validado pela amostra (40 renderizações: 5 telas × 4 larguras × 2 modos, sem problemas) e as telas do Master que usam o mesmo cabeçalho/tabela/cartão herdam o padrão.
