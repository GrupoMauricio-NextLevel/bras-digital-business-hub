# brand-system-v2 · como usar

Sistema de cores do ecossistema NextLevel: sete marcas, uma família. Comece abrindo **`preview.html`** no navegador (funciona sem internet; alterne Claro / Escuro / Sistema no canto superior). A justificativa está em `estrategia.md`.

## Conteúdo

| Arquivo / pasta | Para que serve |
|---|---|
| `preview.html` | Apresentação: as 7 paletas lado a lado, as 4 logos reais, exemplos de cabeçalho, menu, botão, card e checkout por marca, cores de estado |
| `comparativo.png` | Prancha 4800 × 3562 px: 4 marcas oficiais em claro/escuro + as 7 cores identificadas |
| `tokens.css` | Variáveis CSS prontas (primitivos + semânticos por marca e tema) |
| `tokens.json` | Os mesmos tokens no formato Design Tokens (`$value`, `$type`) |
| `paletas.json` | Hex e OKLCH de tudo, escalas 50–950, papéis por tema e pares de contraste por marca |
| `contrastes.csv` | 244 pares avaliados: cores, contraste, função, critério e resultado (abre no Excel/Sheets) |
| `logos/<marca>/{claro,escuro,monocromatico}/` | SVG, PNG transparente e WebP sem perdas |
| `favicons/<marca>/{claro,escuro}/` | `favicon.svg`, `favicon.ico` (16–256), PNG 16–256, Apple 180, Android 192/512, maskable 512 |
| `favicons/<marca>/site-{claro,escuro}.webmanifest` | Manifestos de app com caminhos relativos |
| `simulacoes/` | Prancha simulada em protanopia, deuteranopia, tritanopia e cinza + `distancias.json` |
| `capturas/` | Capturas do preview em claro/escuro, 1440 e 390 px |
| `verificacao.json` | Resultado da verificação automática do pacote |
| `ferramentas/` | Scripts que geraram tudo (reprodutível) e a página da prancha |

Marcas com logo: `nextlevel` (NextLevel Soluções Digitais), `commerce`, `superdrop`, `creators`. Planejadas, só com cor: `play`, `chinahub`, `bras`.

## Logos: qual arquivo usar

| v2 | Equivale no kit v1 | Quando usar | Tamanho mínimo recomendado |
|---|---|---|---|
| `assinatura-completa` | `logo-completo` | Cabeçalho de site, login, rodapé, documentos | 240 px de largura (descritor legível) |
| `compacta` | `wordmark` | Cabeçalho pequeno, menu, checkout, e-mail | 120 px de largura |
| `monograma` | `simbolo` | Menu recolhido, avatar, app, carimbo | 24 px de altura |

- `claro/` = letras navy, para fundos claros; `escuro/` = letras off-white, para fundos escuros.
- `monocromatico/` = preto ou branco, para fotos, fundos médios, marca-d’água, impressão em uma cor.
- Formatos: **SVG** primeiro (vetor, sem fontes, sem imagens embutidas); **PNG** transparente quando o sistema não aceita SVG (larguras 320/640/1280/2400; monograma 128/256/512/1024); **WebP** sem perdas para reduzir peso.
- Só o raio mudou de cor em relação ao kit v1. Não estique, não aplique brilho, bevel, contorno ou efeito metálico. Sombra suave só em áreas grandes (`filter: drop-shadow(0 3px 5px rgba(0,0,0,.14))`).

## Integração na interface

```html
<!doctype html>
<html lang="pt-BR" data-brand="commerce" data-theme="light">  <!-- sem data-theme, segue o sistema -->
<head>
  <link rel="stylesheet" href="/assets/brand/tokens.css">
  <link rel="icon" href="/assets/brand/favicons/commerce/claro/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/brand/favicons/commerce/claro/favicon.svg" type="image/svg+xml" media="(prefers-color-scheme: light)">
  <link rel="icon" href="/assets/brand/favicons/commerce/escuro/favicon.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)">
  <link rel="apple-touch-icon" href="/assets/brand/favicons/commerce/claro/apple-touch-icon.png">
  <link rel="manifest" href="/assets/brand/favicons/commerce/site-claro.webmanifest">
</head>
```

```css
.botao-principal { background: var(--brand-primary); color: var(--brand-on-primary); }
.botao-principal:hover { background: var(--brand-hover); }
.botao-principal:active { background: var(--brand-active); }
.menu a[aria-current="page"] { background: var(--brand-soft); color: var(--brand-on-soft); box-shadow: inset 3px 0 var(--brand-indicator); }
a { color: var(--brand-text); }
:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }
.cartao { background: var(--surface); border: 1px solid var(--border); color: var(--text-primary); }
.aviso-sucesso { background: var(--success-soft); color: var(--on-success-soft); border: 1px solid var(--success-border); } /* sempre com ícone e texto */
```

Troca de logo por tema manual:

```html
<img class="so-claro" src="/assets/brand/logos/commerce/claro/compacta.svg" alt="NextLevel Commerce" width="160">
<img class="so-escuro" src="/assets/brand/logos/commerce/escuro/compacta.svg" alt="" width="160">
<style>
.so-escuro{display:none}
[data-theme="dark"] .so-claro{display:none} [data-theme="dark"] .so-escuro{display:inline}
</style>
```

**No NextLevel Commerce Engine (este repositório):** o contrato de cores atual fica em `src/design-system/themes.ts`. Para adotar a v2, os valores de `paletas.json` entram como entrada de cada tema (`nextlevel`, `commerce`, `superdrop`, `creators`, `china`, `bras`, mais um tema novo `play`). A forma dos componentes não muda. Isso ainda **não** foi feito: depende da aprovação desta proposta.

## Favicons

- O favicon do grupo (`nextlevel`) em fundo claro tem raio amarelo de baixo contraste (1,54:1). Prefira `escuro/` como padrão para abas e apps do grupo.
- As margens dos ícones são as do kit v1. O maskable reduz o monograma para 56% da largura (zona segura do Android).
- `favicon.ico` contém PNG 16, 32, 48, 64, 128 e 256 (aceito por navegadores atuais e pelo Windows Vista ou superior).

## Limitações

- Os contornos são os do kit v1 (traçado automático): há serrilhado visível só acima de ~1200 px. Veja `estrategia.md`, item 1.3.
- NextLevel e Commerce compartilham o monograma NL; a cor do raio distingue, mas títulos e nomes de app devem continuar distintos.
- Play, China Hub e Brás Digital não têm logo: nenhum arquivo de logo foi criado para elas.
- Cores definidas para tela (sRGB). CMYK/Pantone para impressão não foram definidos.

## Regenerar

Os scripts em `ferramentas/` geram tudo a partir do kit v1 (Node 20+, `sharp` e `playwright-core` com Chromium):

```bash
node ferramentas/gerar-dados.mjs  <saida>                 # paletas, tokens, contrastes
node ferramentas/gerar-ativos.mjs <kit-v1> <saida>        # logos e favicons
node ferramentas/gerar-html.mjs   <saida>                 # preview e prancha
node ferramentas/render.mjs       <saida>                 # comparativo.png, capturas, simulações
node ferramentas/sims.mjs         <saida>                 # distâncias sob simulação de visão de cores
node ferramentas/verificar.mjs    <saida> <kit-v1>        # verificação
```

Para mudar uma cor, edite `MARCAS` em `ferramentas/sistema.mjs` (matiz `H` e croma `C` em OKLCH) e rode de novo. Os papéis e os contrastes são recalculados.
