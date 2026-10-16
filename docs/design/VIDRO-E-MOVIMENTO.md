# Vidro, profundidade e movimento: evolução do sistema de design (D155)

Pedido do dono (16/10/2026): executar o prompt mestre de `NEXTLEVEL-analise-construcao-prompt-claude.md` (referência técnica de nextlevelgroup.com.br), com navegação de vidro, motion discreto, profundidade e claro/escuro completos em todas as páginas, **dentro da arquitetura existente**.

## 1. Arquitetura encontrada (antes de mudar)

| Peça | Onde | Estado encontrado |
|---|---|---|
| Tokens de forma (tipografia, espaço, raios, camadas, movimento, sombras) | `src/design-system/tokens.css` | Completo; movimento com 3 durações (120/200/250 ms) |
| Papéis de cor por marca, claro e escuro | `src/design-system/themes.ts` (`deriveColors` → `--ds-*` no `<html data-ds-theme>`) | Completo, sem cor de empresa nos componentes; `glass` = canvas a 82–86% |
| Preferência de tema | `nl-theme` no navegador + script antes da primeira pintura (`THEME_PREPAINT_SCRIPT`); `ThemeSwitch` (Claro, Escuro, Sistema) | Sem escolha salva **abre no claro** (decisão anterior, mantida); `color-scheme` aplicado por modo |
| Casca pública | `PublicShell` (`src/design-system/components/public-shell.tsx`) | Cabeçalho fixo com `backdrop-filter`, menu do celular com Escape e retorno de foco, `aria-current` |
| Casca dos painéis | `AppShell` via `RoleLayout` (Master, fornecedor, lojista, parceiro, Commerce, Brás, Meu Brás, importadora, transportadora) | Barra superior fixa `.ds-top` com vidro |
| Entrada e cadastro | `AuthCardShell`, `PartnerShell`, cadastro, senha | Foto + cartão |
| Lojas dos clientes | `store/[slug]` (tema da loja) | **Fora** desta evolução: o visual é do lojista |
| Revelação ao rolar | `Reveal` (`IntersectionObserver`, uma vez, sem JS o conteúdo aparece) | 700 ms, 16 px |
| Movimento reduzido | `tokens.css` zera animações e transições | Rolagens por JavaScript (`scrollIntoView({behavior:"smooth"})`) **não** respeitavam |

Inventário de rotas: 215 páginas (`src/app/**/page.tsx`): portal 20, entrada de parceiros 2, Master 47, fornecedor 28, lojista 34, parceiro 8, Commerce 7, Brás 18, Meu Brás 13, importadora 7, transportadora 7, loja 8 e avulsas (login, cadastro, senha, balcão, motorista, ativar, conta, demonstração, 404). Todas passam por uma das quatro cascas acima, por isso a mudança é feita nelas e nos tokens.

## 2. O que veio comprovado da referência × o que é evolução nossa

| Tema | Comprovado na referência (código publicado) | Evolução aplicada aqui (recomendação, não cópia) |
|---|---|---|
| Vidro na navegação | **Não** usa `backdrop-filter`; é superfície translúcida sobre luz ambiente | Vidro real com desfoque de 16 px **só** em navegação, menu do celular e barra dos painéis; preenchimento sólido (97%) quando o navegador não desfoca |
| Bordas e reflexo | Borda de 1 px, fundos `#ffffff06` | `glassBorder` e `glassHighlight` por tema (claro: borda escura suave + reflexo branco; escuro: borda clara sutil) |
| Luz ambiente | Gradiente radial + `.ambient` com blur 80 px e opacidade 0,16 | `--ds-ambient` (cor da marca a 9% no claro, 16% no escuro) em duas fontes no topo das páginas públicas, atrás das superfícies |
| Elevação | Hover de card com sombra `0 16px 45px` | Card sobe 3 px, ação 2 px, sombra média e borda tingida pela marca; nada sobe em telas de toque nem com movimento reduzido |
| Estado ativo | Borda + fundo + faixa inferior | Item de menu ativo com **dois sinais**: fundo suave + barra inferior na cor da marca (no celular, barra lateral) |
| Entradas | `rise`: 14 px, 400–600 ms, intervalo 35/45 ms | Tokens `--ds-rise` 14 px, `--ds-dur-enter` 500 ms, `--ds-stagger` 40 ms; atraso máximo 320 ms |
| Movimento reduzido | Media query desliga CSS | Também no JavaScript: `comportamentoDeRolagem()` deixa rolagens programáticas instantâneas |
| Cabeçalho fixo | **Não** comprovado (a referência usa `position:relative`) | Já era fixo no nosso sistema; ganhou estado "rolado" (`data-scrolled`) com elevação |
| Tema claro | **Não** existe completo na referência | Já existia aqui; os novos papéis têm valores próprios para claro e escuro (sem inversão) |

## 3. Contrato de tokens (novos)
- Cor (por marca e modo, em `themes.ts`): `--ds-glass`, `--ds-glass-solid`, `--ds-glass-border`, `--ds-glass-highlight`, `--ds-ambient`.
- Forma (em `tokens.css`): `--ds-glass-blur`, `--ds-glass-shadow`, `--ds-dur-micro` (180 ms), `--ds-dur-enter` (500 ms), `--ds-ease-out`, `--ds-rise` (14 px), `--ds-lift-card` (3 px), `--ds-lift-action` (2 px), `--ds-stagger` (40 ms).
- Primitivas (em `core.css`): `.ds-glass`, `.ds-rise`, `.ds-lift`, `.ds-pub-card` (com elevação quando é link), `.ds-dialog` (entrada curta), `.ds-pub-mobile` (entrada curta).

## 4. Regras
- Vidro só com função (navegação, menus, diálogos); nunca em todo cartão.
- Desfoque nunca é animado; só `transform` e `opacity` animam; transições com propriedades explícitas.
- Nenhuma cor literal nova nos componentes: tudo pelos papéis `--ds-*`.
- Nenhuma ação espera animação.

## 5. Verificação feita (16/10/2026, servidor local de produção, Chromium)
| Amostra | Claro 390 | Escuro 390 | Claro 1440 | Escuro 1440 | 360 sem rolagem lateral |
|---|---|---|---|---|---|
| SuperDrop início e planos | ✓ vidro + rolado | ✓ | ✓ | ✓ | ✓ (início) |
| Commerce início e temas | ✓ | ✓ | ✓ | ✓ | ✓ (início) |
| Grupo /solucoes | ✓ | ✓ | ✓ | ✓ | ✓ |
| Entrar (SuperDrop) e recuperar senha (Commerce) | ✓ (cascas próprias, sem cabeçalho público) | ✓ | ✓ | ✓ | — |
| Parceiros, cadastro | — | — | — | — | ✓ |
| Painel Master | ✓ barra de vidro | — | — | ✓ | ✓ |

- Console: nenhum erro de página nas 28 combinações públicas e nos 3 acessos ao painel.
- Teclado (390 px): Tab chega ao botão do menu, Enter abre (`aria-expanded=true`), Tab vai ao primeiro item, Escape fecha e devolve o foco ao botão; contorno de foco visível.
- Movimento reduzido: menu sem animação; nenhum conteúdo escondido esperando animação na tela.
- Contraste do vidro: teste automático (texto AA no pior fundo, 8 marcas × 2 modos).
- **Não verificado** (limite real): navegador sem `backdrop-filter` (o fallback sólido é garantido pelo CSS e pelo teste de contraste, mas não foi aberto num navegador antigo); Safari/WebKit (não há WebKit nesta máquina); métricas de desempenho (LCP, INP, CLS) não medidas.
