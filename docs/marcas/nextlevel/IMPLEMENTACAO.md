# NextLevel v2 — implementação no sistema (D161)

Pacote de origem: `nextlevel-grupo-v2-completo.zip` (raiz `nextlevel/`). Docs, tokens, integração, referências e prévias
do pacote estão nesta pasta; os arquivos de imagem públicos estão em `public/marcas/nextlevel/v2/`.

## Fonte única

`src/lib/marcas/nextlevel.ts`: `NL` (nome, linha de apoio, slogan preservado, endossos, cores, degradês, papéis claro/escuro),
`NL_LOGOS`, `NL_HEROI`, `NL_PECAS_3D`, `NL_ICONES`, `nlCssVars()` (`--nlg-*`).

## Onde cada logo aparece

| Superfície | Variante (`BrandLogo`) | Arquivo |
|---|---|---|
| Cabeçalho público, rodapé, assinatura "desenvolvido pela NextLevel" nas marcas-filhas | `compacta` | `logos/sem-apoio/logo-clara` · `logo-escura` |
| Barra lateral do Master (marinho nos dois modos) | `compacta` (versão escura pela regra da barra escura) | `logos/sem-apoio/logo-escura` |
| Barra lateral recolhida | `monograma` | `logos/monogramas/monograma-flat` |
| Página da marca no Master (`/master/marcas/nextlevel`) | `assinatura-completa` | `logos/flat/logo-clara` · `logo-escura` |
| Tela de entrada do Master (cartão) | `prisma` | `logos/prisma/logo-clara` · `logo-escura` |
| Herói do site do grupo (marinho) | `prisma`, `on-dark` | `logos/prisma/logo-escura` |

As cópias de exibição são WebP 640/1280 (logos) e 256/512 (monogramas), recortadas da margem transparente com folga de 3%.
Os PNG originais estão ao lado. Nunca filtro, recoloração, sombra ou recorte do brilho.

## Peças 3D

- `02-metal-anodizado-sem-texto`: herói do site do grupo (AVIF/WebP 800/1600; recorte quadrado 800 no celular).
- `01-vidro-optico`: foto lateral da tela de entrada do Master.
- `03-camadas-translucidas`: chamada final do site do grupo.
- `04-arquitetura-de-luz-cinetica` e `00-master-flat`: disponíveis, sem uso por ora.

## Tema

`THEME_INPUTS.nextlevel` em `src/design-system/themes.ts`. Os demais papéis são derivados e conferidos pelo contrato (AA) em
`tests/design-system.test.ts` e `tests/nextlevel-marca.test.tsx`.

## Ícones, manifesto e prévia

`logos/favicons/*`, `logos/app-icons/*`, `manifest.webmanifest` (caminhos `/marcas/nextlevel/v2/...`) e
`social/og-nextlevel-1200x630.jpg` (gerado do PNG do pacote achatado sobre o marinho).

## Referências antigas mantidas

- `public/brand/v2/nextlevel/` (raio amarelo): arquivado, sem uso.
- `public/marcas/nextlevel/imagens/` (kit de fotos v1 com linhas amarelas): fora das páginas da marca-mãe; ainda usado pelas
  páginas da família (Club e Loja NextLevel) até elas terem kit próprio.
- `public/portal/nextlevel/v3/` (fotos das famílias de solução, e-mail): continuam, são neutras.
- Logos da família (NextLevel Club, Loja NextLevel, Meu Contador, Parceiros) seguem as do pacote D152, com o amarelo: não
  fazem parte deste pacote.

## Pendências reais

- Kits das marcas da família (Club, Loja NextLevel, Meu Contador, Parceiros) na linguagem v2.
- Faixa de e-mail (`nl-email-topo`) e assinatura de e-mail do pacote (`integration/assinatura-email.html`) ainda não
  aplicadas: os e-mails usam o layout atual.
- Não há arquivo vetorial nem fonte do lettering no pacote (só PNG).
