# Brás Digital: fotos da página pública (D92)

Cada arquivo entra em `public/portal/bras/v3/<nome>.avif` (e `.webp` como reserva). Sem arquivo, a página mostra "Imagem em criação" no mesmo tamanho, sem quebrar o layout. Fotografia documental, luz natural, sem texto, sem logotipo de marca real, sem rosto em close; pessoas brasileiras reais, sem aparência de banco de imagem.

| Nome | Proporção | Onde aparece | Cena (prompt para o gerador) |
|---|---|---|---|
| `bd-corredor-caixas` | 4:3 (1600×1200) | Como funciona | Corredor estreito de uma importadora no Brás, São Paulo, com caixas de papelão fechadas e lacradas empilhadas até o teto dos dois lados, etiquetas brancas sem texto legível, luz fria de galpão misturada com luz do dia vinda da porta ao fundo, carrinho de carga parado no corredor, sensação de volume e organização. |
| `bd-publico-marketplace` | 4:5 (1200×1500) | Para quem: vendedor de marketplace | Bancada de um pequeno estoque em casa, mãos de uma vendedora embalando um produto em saco plástico com etiqueta de envio em branco, caixas de papelão abertas ao fundo, notebook aberto fora de foco, luz de janela lateral. |
| `bd-publico-lojista` | 4:5 (1200×1500) | Para quem: lojista | Lojista de utilidades domésticas, de perfil, olhando o celular entre prateleiras com potes, garrafas e organizadores, loja de bairro, luz quente, foco no celular e nas mãos. |
| `bd-publico-distribuidor` | 4:5 (1200×1500) | Para quem: distribuidor | Caixas de papelão sendo carregadas num caminhão baú na calçada de uma rua comercial do Brás pela manhã, um carregador de costas empurrando o carrinho, rua movimentada fora de foco. |

Peso máximo: 220 KB por AVIF. Ponto de foco já configurado no código (`posicao`); se a composição mudar, ajuste em `src/components/portal/bras/bras-home.tsx`.
