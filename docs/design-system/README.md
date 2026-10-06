# Sistema de design compartilhado (NextLevel, Commerce, SuperDrop e projetos futuros)

Fonte: pacote `commerce-interface-reference` (medidas e padrões) adaptado ao código real deste repositório. Regra central: **todos os projetos têm o mesmo padrão visual e de implementação; a única variação por empresa é a paleta de cores, entregue por tokens de tema.**

## Onde fica cada coisa
| Camada | Arquivo | O que decide |
|---|---|---|
| Cores por projeto (contrato de tema) | `src/design-system/themes.ts` | Papéis semânticos de cor, claro e escuro, de cada empresa. Único lugar com cor de empresa. |
| Forma (tokens estruturais) | `src/design-system/tokens.css` | Tipografia, espaçamento, dimensões, raios, camadas (z), movimento, sombras (forma) e a ponte para os nomes antigos (`--background`, `--primary`...). |
| Componentes compartilhados (CSS) | `src/design-system/core.css` | Casca operacional, KPI, botão, pill, vazio, campo, tabela, superfícies de vidro, família pública. Só lê `--ds-*`. |
| Componentes compartilhados (React) | `src/design-system/components/*` e `src/components/ui/*`, `src/components/app/*` | `OperationalShell`, `SideNav`, `ThemeSwitch`; primitivas `Button`, `Card`, `Badge`, `Input`, `Table`, `Tabs`, `Dialog`; `PageHeader`, `MetricCard`, `DataTable`, `EmptyState`... |
| Dono do tema | `src/app/layout.tsx` + `src/lib/theme-server.ts` | `<html data-ds-theme="…" data-theme="light\|dark\|system">`. Um só dono; portais (diálogos, menus) herdam daqui. |
| Galeria | rota `/dev/design` | Todos os componentes e estados, em todos os temas e larguras, sem dado real. |

## Como funciona o tema
1. A marca vem do endereço (`getBrand()`); lojista logado usa a marca da organização da loja (`getThemeKey()`).
2. `themeKeyForBrand(code)` escolhe a chave (`nextlevel`, `commerce`, `superdrop`, `bras`, `creators`, `china`).
3. O layout raiz grava `data-ds-theme` e injeta `themeCss(chave)`: variáveis `--ds-*` para claro, escuro e "sistema".
4. Preferência do usuário: `localStorage "nl-theme"` = `light | dark | system`. Sem escolha salva, abre no **claro**. O script de pré-pintura aplica antes da primeira pintura (sem piscar).
5. Nenhum componente tem "se empresa X": todos leem `--ds-*`.

## Geometria (valores observados na referência, preservados)
Menu lateral 272 px (recolhido 78); conteúdo máx. 1400 com padding `clamp(18px,2.4vw,34px)`; item de menu 42 px, raio 12; card 22; KPI mínimo 190, gap 14, raio 18; botão 44/raio 12 (pequeno 36/10); pill 999; público: largura 1200, header 72, botão 50 raio 14, card 24. Breakpoints: casca 980/640; público 1020/480. Z: topo 40, véu 55, menu 60, dropdown 70, skip 80, diálogo 100, popover 130, toast 140.

## Adesão de um projeto futuro (exemplo neutro)
1. Em `src/lib/brand-palette.ts` e `src/lib/brand.ts`, cadastre a marca (como já existe para as outras).
2. Em `src/design-system/themes.ts`:
```ts
// 1) chave e entrada de cores (claro e escuro). O resto é derivado e testado.
THEME_KEYS = [..., "meuprojeto"] as const;
THEME_INPUTS.meuprojeto = {
  label: "Meu projeto",
  light: { canvas: "#F4F6FA", ink: "#14213A", primary: "#2557DA", link: "#214ECA", accent: "#EDAA86", accentText: "#914721" },
  dark:  { canvas: "#0B1020", ink: "#EEF3FF", primary: "#3565DF", link: "#91B3FF", accent: "#F1AC85", accentText: "#F4B693" },
};
// 2) marca -> tema
THEME_FOR_BRAND.MEU_PROJETO = "meuprojeto";
```
3. `npx vitest run tests/design-system.test.ts`: o teste confere contraste AA de todos os pares de leitura nos dois modos e que o tema tem exatamente os mesmos papéis dos outros.
4. As telas do projeto compõem `OperationalShell`/`AppShell` (painel) e `PublicShell` (páginas públicas) com seus dados: nada de CSS próprio de cor ou medida.
5. Confira em `/dev/design` (galeria) e rode `e2e/design-system-qa.mjs`.

## Distribuição e atualização
Hoje há **um único repositório** e um único deploy servindo todos os produtos: o núcleo vive em `src/design-system` e é consumido por import (`@/design-system/...`). Se um produto sair para outro repositório: publicar `src/design-system` como pacote interno (`@nextlevel/design-system`) versionado por SemVer, mantendo `themes.ts` como contrato; cada consumidor fixa a versão e só atualiza por PR. Sem cópia de CSS entre repositórios.

Verificações: `tests/design-system.test.ts` (contrato e contraste), `e2e/design-system-qa.mjs` (painéis), `e2e/design-system-public-qa.mjs` (páginas públicas).

## Validação e entregáveis de conferência
- **Matriz de cobertura** (rota → família → padrão → componente → estado): `MATRIZ-COBERTURA.md`, regenerada por `node scripts/gerar-matriz-cobertura.mjs` depois das varreduras.
- **Painéis**: `bash scripts/start-demo-prod.sh` (após `NEXT_PUBLIC_DEMO_MODE=true npm run build`) e então `E2E_BASE=http://localhost:3100 node e2e/design-system-qa.mjs --so-varredura|--so-amostra [--conta=<id>]`. Resultados em `qa/varredura-*.json` e `qa/amostra-*.json` (amostra = 4 larguras × claro/escuro, com capturas em `capturas/` e medida de geometria entre contas).
- **Páginas públicas** (3 marcas × claro/escuro × 1440/840/390/320): `node e2e/design-system-public-qa.mjs [--capturas]` → `qa/resultado-publico.json`.
- **Antes e depois**: `bash scripts/capturas-antes-depois.sh antes` (compila o último commit numa cópia temporária, porta 3200) e `node e2e/design-system-antes-depois.mjs` → `antes-depois/*.png`.
- **Galeria**: `/dev/design` (e `/dev/design/amostra` com todos os componentes × temas × modos), só fora de produção.
- Limites e diferenças conscientes: `DIFERENCAS-DELIBERADAS.md`; decisões que são do dono: `DECISOES-PENDENTES.md`.
