# Fotografias das páginas públicas (SuperDrop e NextLevel Commerce) — instalação e verificação

Origem: `imagens-superdrop.zip` e `imagens-commerce.zip` (07/10/2026). `LEIA-ME.md` e `MANIFESTO.json` vieram **idênticos** nos dois pacotes e estão guardados aqui uma vez só (documentação compartilhada; as 18 imagens não foram contadas duas vezes).

## 1. Conferência dos pacotes

- 18 imagens distintas (9 por marca) × 3 formatos = 54 arquivos.
- **51 abrem corretamente**: dimensões e proporções iguais às do manifesto (PNG na resolução original; WebP/AVIF com no máximo 1600 px, ou 1916 px nas 21:9).
- **3 vieram vazios (0 byte)** e não foram instalados:
  - `sd-hero-celular-venda.webp`: o manifesto diz 96.248 bytes;
  - `sd-fornecedor-parceiro.webp`: o manifesto diz 95.254 bytes;
  - `cm-catalogo-fotografia.avif`.

  É falha de empacotamento. As três fotos continuam aparecendo pelos outros formatos (AVIF ou WebP, e PNG por último). Se o arquivo vazio fosse instalado, o navegador escolheria esse formato e mostraria imagem quebrada.
- Nenhum arquivo existente foi substituído: as pastas `v3` só tinham `MANIFESTO.md`.
- Caminhos públicos `/portal/<marca>/v3/<nome>.<ext>`, sem `/public` e sem pasta duplicada.

## 2. Onde cada imagem aparece

Mapa completo nos manifestos de cada marca:
- `public/portal/superdrop/v3/MANIFESTO.md`
- `public/portal/commerce/v3/MANIFESTO.md`

As 18 imagens estão em uso: 16 fotos informativas, com texto alternativo descritivo, e 2 texturas decorativas, com `alt=""` e ocultas para leitores de tela.

## 3. Como o componente entrega

Componente: `src/components/portal/imagem-em-criacao.tsx`.
- Usa `<picture>` com AVIF, depois WebP e, por fim, `<img>` PNG. O navegador baixa um formato só (conferido: 1 requisição por imagem).
- Arquivo vazio não conta como formato.
- Proporção reservada no contêiner, então a página não "pula" quando a foto carrega. Os recortes usam `object-fit: cover` com ponto de foco (`object-position`) por foto.
- Carregamento tardio em todas as fotos. Nenhuma está na primeira dobra: o topo das duas páginas mostra a interface real do sistema, e por isso nenhuma tem prioridade de carregamento.
- O aviso "Imagem em criação" só aparece quando nenhum formato válido existe. Falha de carregamento não é escondida (o navegador mostra o texto alternativo).
- Texturas: `TexturaDeFundo`, em tons de cinza com mistura "luz suave", para não mudar a cor da marca na seção.

## 4. Verificação

Teste automático: `e2e/imagens-paginas-publicas.mjs`, nas duas páginas, em 360, 768 e 1440 px, sobre o build de produção.
- 9 de 9 imagens carregadas em cada página.
- 0 avisos "Imagem em criação" restantes.
- 0 requisições com erro.
- 1 formato por imagem.
- Nenhuma foto da outra marca.
- Sem rolagem lateral e sem erro de console.
- Deslocamento de layout (CLS) no máximo 0,009.
- axe (WCAG A/AA) sem violação grave.

Capturas em `capturas/`:
- `*-topo.png` e `*-inteira.jpg`: as 6 combinações de página e largura;
- `commerce-*-operacao-*.jpg`: a seção "Depois que a loja está no ar";
- `*-chamada-final.jpg`: as chamadas finais.

A seção "Depois que a loja está no ar" usa uma animação de entrada ligada à rolagem. Na captura de página inteira ela aparece vazia, porque a captura não rola; por isso há capturas próprias, feitas rolando até cada linha.

## 5. Limites

- Chromium baixa AVIF; o caminho WebP e o PNG de reserva foram conferidos por requisição direta (200, tamanho e tipo corretos), não num navegador sem suporte a AVIF.
- PNGs são reserva para navegadores antigos (1,5 a 2,5 MB cada). Ficam no repositório e na imagem Docker (cerca de 34 MB), mas navegadores atuais não os baixam.
