# NextLevel Commerce: direção visual (vidro azul, Claro e Escuro)

Referência aprovada pelo dono: duas imagens do painel (Claro e Escuro) e o prompt `PROMPT_CLAUDE_NEXTLEVEL_COMMERCE_GLASS_LIGHT_DARK.md`. Esta direção substitui a paleta papel/marinho da D76 (ver D77).

## Escopo
Só aparência, navegação e apresentação do painel do lojista Commerce e do console ADM Commerce. Nenhuma regra de negócio, banco, pagamento, permissão ou rota foi alterada. Master e SuperDrop não mudam: tudo fica dentro de `[data-product="commerce"]`.

## Temas
- **Claro** (padrão quando não há escolha salva): fundo gelo `#f4f7fc`, superfícies brancas, azul royal `#2457e6`, texto `#14213a`.
- **Escuro**: marinho em camadas (`#081329` fundo, `#132444` superfície), azul `#3468e8`/`#6b96ff`, sem preto chapado.
- Escolha **Claro / Escuro / Sistema** no cabeçalho (e no menu do celular), salva em `localStorage "nl-theme"` e aplicada antes da pintura (script no layout raiz, sem piscar). Sistema segue o aparelho.
- `color-scheme` coerente em cada tema.

## Vidro em três níveis (`src/components/commerce/commerce-glass.css`)
1. **Identidade** (`.cm-glass-id`): faixa de boas-vindas e menu lateral; desfoque 20px, reflexo e arte decorativa em CSS/SVG (`aria-hidden`, sem clique).
2. **Funcional** (`.cm-glass-fn`): cartões de números, listas de ação; desfoque 14px.
3. **Superfície de trabalho** (`.cm-glass-work`, `.ds-card`, `.ds-table`): tabelas e formulários quase sólidos para leitura.
Alternativa sem `backdrop-filter`: fundos mais opacos. Desfoque nunca é animado.

## Movimento
Só `transform` e `opacity`. Entrada dos cartões 280 ms com pequeno atraso na carga; elevação ao passar o mouse 160 ms; deriva do brilho do fundo 20 a 22 s. `prefers-reduced-motion` desliga tudo isso. Sem parallax em tabelas ou formulários.

## Contraste
Texto principal 15:1 (Claro) e 17:1 (Escuro); secundário 5,8:1 e 10,5:1; botão azul 5,9:1 e 4,9:1. A varredura `axe` (sério/crítico) passa nas telas verificadas (ver `COMMERCE_VISUAL_QA.md`).

## Componentes compartilhados
`Card`, `DataTable` e `OperationalPulse` ganharam ganchos (`ds-card`, `ds-table`, `ds-pulse`) que só mudam de aparência dentro do Commerce. Páginas ainda não redesenhadas herdam cores, bordas e raios; o conteúdo delas não foi recomposto.
