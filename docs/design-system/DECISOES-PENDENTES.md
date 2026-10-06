> **Atualização 2026-10-06 (D79):** paletas resolvidas pelo sistema de cores v2 aprovado (`brand-system-v2/`): Commerce azul, NextLevel amarelo do grupo, SuperDrop verde, Creators magenta, Play violeta, China Hub jade, Brás laranja; logos oficiais do kit v1 aplicadas. Os itens abaixo ficam como histórico.

# Decisões que dependem do dono (sinalizadas, não decididas)

1. **Cor primária do Commerce:** o painel já aprovado usa **azul** (`#2557DA`) com cobre e ciano; a identidade da home institucional usa **amarelo-etiqueta** (`#F2B600`) com tinta azul-marinho. O tema `commerce` mantém o azul aprovado. Trocar é mudar duas linhas em `themes.ts`.
2. **Paletas dos produtos "em breve"** (Brás Digital, Hub Creators, China Hub): foram derivadas das paletas já cadastradas em `src/lib/brand-palette.ts`. Precisam de aprovação quando esses produtos forem ao ar.
3. **Cor primária do NextLevel (holding/Master):** o laranja de sinal (`#FF5A1F`) vira a cor dos botões do Master; o texto dos botões é escuro por contraste. Confirmar que o Master deve ser laranja.
4. **Menu claro no modo claro** (diferença deliberada 1): a referência tem menu sempre escuro. Se preferir menu escuro em todos os temas e modos, é uma linha em `deriveColors`.
5. **Logo oficial NextLevel é arte opaca (fundo preto):** hoje aparece numa placa escura. Uma versão com fundo transparente melhoraria o menu e o rodapé.
6. **Projetos fora deste repositório:** nada foi migrado nem verificado fora de `bras-digital-business-hub` (ver matriz).
