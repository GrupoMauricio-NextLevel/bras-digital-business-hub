# Kit oficial — Brás Digital Club

Versão consolidada para implementação no painel interno e na página institucional externa.

## Identidade aprovada

- Nome: **Brás Digital Club**
- Slogan: **Conecte seu negócio ao pulso do Brás.**
- Navy: `#0C1830`
- Azul elétrico: `#315CFF`
- Ciano: `#00D4FF`
- Off-white: `#F4F1E9`
- Direção: símbolo circular em forma de “b”/pulso, sem alteração de geometria.

## Estrutura

- `logos/flat/`: assinaturas horizontais claras e escuras, com e sem slogan.
- `logos/vertical/`: assinaturas verticais para espaços estreitos e apresentações.
- `logos/monogramas/`: símbolo isolado para navegação compacta e avatares.
- `logos/favicons/`: favicons PNG em 16, 32 e 48 px.
- `logos/app-icons/`: ícones 180, 192 e 512 px e o arquivo mestre.
- `3d/`: peças promocionais, hero e movimento; não substituem a marca oficial.
- `tokens/`: cores e regras de tema em CSS e JSON.
- `integration/`: configuração de referência e mapa de instalação.
- `referencias/`: prancha aprovada, apenas para conferência.
- `docs/`: racional visual, prompts de implementação, inventário e regras de uso.

## Por onde começar

1. Leia `docs/RACIONAL-DIRECAO-VISUAL-SISTEMA-E-PAGINAS.md`.
2. Envie `docs/PROMPT-ENGENHEIRO-MESTRE.md` ao Claude Code.
3. Use `integration/brand.config.json` como referência para o registro da marca.
4. Valide a implementação com os critérios do prompt antes de publicar.

## Regra de aplicação

| Contexto | Arquivo principal |
|---|---|
| Fundo branco/off-white/claro | `logos/flat/logo-clara.png` |
| Fundo navy/escuro/foto escurecida | `logos/flat/logo-escura.png` |
| Sidebar recolhida em fundo claro | `logos/monogramas/monograma-claro.png` |
| Sidebar recolhida em fundo escuro | `logos/monogramas/monograma-escuro.png` |
| Hero institucional | `logos/flat/logo-escura.png` + `3d/02-metal-anodizado-sem-texto.png` |
| Footer escuro | `logos/flat/logo-escura-com-slogan.png` |
| Favicon | `logos/favicons/favicon-32.png` e `favicon-16.png` |
| PWA/app | `logos/app-icons/icon-192.png` e `icon-512.png` |

As versões escuras têm fundo transparente e lettering off-white. O navy deve ser aplicado pelo componente ou pela superfície, não incorporado à imagem. Não aplicar filtros CSS, recoloração, sombras, contornos, rotação, compressão agressiva ou deformação.

## Separação entre marca e campanha

Os arquivos em `logos/` são a identidade oficial. Os arquivos em `3d/` são recursos de comunicação para hero, banners, campanhas, abertura de vídeo e momentos editoriais. Em páginas web, o título, o texto, o slogan e os botões devem permanecer como HTML real; nunca devem ser incorporados na peça 3D.

## Observação de domínio

O nome-base informado é `brasdigitalclub`. Antes de publicar `canonical`, `og:url`, sitemap e redirecionamentos definitivos, confirme a extensão real do domínio (`.com.br`, `.com` ou outra). O prompt de implementação não inventa essa extensão.
