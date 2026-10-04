# Commerce visual V2: decisões

Continuidade da V1 (vidro azul Claro/Escuro). Nada de backend, regra, rota ou indicador foi alterado; só apresentação. Sem push, merge ou deploy.

## Skills
Encontradas e usadas: `painel-interno` (regras dos painéis), `qa-visual` e `e2e-demo` (roteiro e navegador). Não há skills de frontend-design, motion ou acessibilidade instaladas; segui o fluxo do projeto sem instalar nada.

## Baseline (antes)
`docs/commerce-visual/baseline-v1/` (V1). Problemas observados no navegador: superfícies com a mesma materialidade; hero com uma onda fina; cartões de zero repetindo frase; três avisos de preparo se repetindo (pronta para vender, não publicada, configuração incompleta); "Ativa" ao lado de "Loja não publicada" sem explicação; chips de status de Pedidos num trilho longo; KPIs altos no celular; marca só em texto pequeno.

## Paleta e papéis
Tokens do briefing calibrados em `commerce-glass.css` (canvas, superfície, texto, azul de ação `#2557DA/#3565DF`, azul de link `#214ECA/#91B3FF`).
- **Azul**: ação, seleção, item ativo do menu.
- **Ciano gelo** (`--cm-cyan`): só luz: aresta das lâminas, fio de luz no topo do hero, contorno da placa da marca. Nunca texto.
- **Cobre pêssego** (`--cm-copper`, `--cm-warm`, `--cm-warm-text`): só personalização: aresta inferior de uma lâmina do hero, cartão "Aparência da loja" no Início e o aviso da tela Temas. Não marca alerta, erro, pago nem ação financeira.

## Quatro planos
1. Canvas: gradiente ambiental localizado.
2. Shell: vidro leve (menu e cabeçalho).
3. Identidade: hero com três lâminas translúcidas (opacidades e inclinações diferentes, borda ciano, sombra e brilho interno), reflexo que atravessa uma vez na entrada (1,8 s), sem laço.
4. Trabalho: tabelas, checklist e formulários quase sólidos, sombra mínima. No Claro a sombra azul genérica foi trocada por sombra neutra curta; no Escuro os cartões ganham um leve brilho de topo.

## Hierarquia da Home
- **Primeiro acesso** (sem pedido e sem primeira venda): Próximo passo único com um botão, ao lado do Status; resumo compacto; checklist "Até a primeira venda"; pedidos em estado vazio útil (registrar venda manual).
- **Em operação**: números, "O que precisa de você" (inclui o próximo passo, sem repetir os avisos de preparo), Status, pedidos, ações e aparência.
- **Rótulos explícitos**: "Conta ativa" e "Loja ainda não publicada" são duas pílulas diferentes. Status mostra Conta, Vitrine, "Configuração: X de Y etapas" (checklist de onboarding) e "Para vender: X de Y requisitos" (prontidão para vender). O anel é "requisitos para vender". Nenhum cálculo foi mudado; só rótulos e denominadores à mostra.
- Ausência de período anterior é explicada uma vez, abaixo do grupo; ticket médio sem pedido mostra "—".

## Navegação e mobile
Menu agrupado mantido. Placa da marca com o logo oficial (arquivo opaco: vira uma placa escura em qualquer tema). Pedidos: abas (Todos, Pendente, Enviado, Entregue, com contagem) + seletor "Outros status…" com os demais; nenhum status foi removido. No celular, KPIs em grade 2x2 compacta; o hero perde as lâminas abaixo de 480 px; "Mais" abre a gaveta com tema, Ver loja e perfil.

## Motion
Menu e grupos 160 a 200 ms; botão e cartão clicável 140 a 160 ms; tema 240 ms; reflexo do hero uma vez na entrada; deriva de luz do fundo 20 a 22 s; entrada escalonada dos cartões 280 ms. Só `transform`/`opacity`. Sem reação ao ponteiro (opcional do briefing, não feita). `prefers-reduced-motion` remove deriva, reflexo e entrada.

## ADM Commerce
Mesma identidade com menos ambientação (`.cm-admin`), selo "Administração da plataforma", título de visão geral reduzido. Contexto lojista e administrativo continuam separados.

## Decisões de risco
- Botão "Simular venda (demo)" passou a "ghost" (aparece só em demonstração).
- Seletor "Outros status" usa `<select>` nativo (acessível por padrão; aparência do menu aberto é do navegador).
