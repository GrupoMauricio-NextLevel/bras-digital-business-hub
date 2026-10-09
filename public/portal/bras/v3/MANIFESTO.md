# Brás Digital: imagens da página pública, do cadastro e do compartilhamento (D92, D98, D105)

Prompt para gerar no GPT: `docs/prompts/imagens-bras-digital-gpt.md`.

Cada arquivo entra em `public/portal/bras/v3/<nome>.avif` (e `.webp` como reserva). **Sem arquivo, o lugar simplesmente não aparece** (a página da Brás não mostra o quadro "Imagem em criação"). Fotografia documental, luz natural, sem texto, sem logotipo de marca real, sem preço, sem rosto reconhecível; pessoas brasileiras reais, sem aparência de banco de imagem. Paleta: azul-marinho #101B34, papel #F4F1E9, kraft; laranja #FB8342/#B34D00 só em detalhes.

| Nome | Proporção | Onde aparece | Cena |
|---|---|---|---|
| `bd-corredor-caixas` | 16:9 (2400×1350) | Como funciona, faixa larga acima dos 4 passos | Corredor de importadora com caixas fechadas até o teto, carrinho com alça laranja, luz de galpão e luz do dia ao fundo. |
| `bd-publico-marketplace` | 4:3 (1600×1200) | Para quem: vendedor de marketplace | Bancada de estoque em casa, mãos embalando produto com etiqueta lisa, caixas abertas ao fundo, notebook de tela lisa desfocado. |
| `bd-publico-lojista` | 4:3 (1600×1200) | Para quem: lojista | Lojista de utilidades, de perfil e desfocado, olhando o celular de tela lisa entre prateleiras sem marca. |
| `bd-publico-distribuidor` | 4:3 (1600×1200) | Para quem: distribuidor | Caixas sendo carregadas num caminhão baú liso numa rua comercial do Brás pela manhã, carregador de costas. |
| `bd-importadora-balcao` | 4:3 (1600×1200) | Cartão "É importadora no Brás?" | Balcão de importadora, caixas organizadas atrás, prancheta lisa, mãos conferindo uma caixa. |
| `bd-retirada-transportadora` | 4:3 (1600×1200) | Seção "Seus dados ficam com você" | Motorista de costas, colete laranja liso, conferindo caixas no carrinho na porta da importadora antes da van. |
| `bd-cadastro-lateral` | 3:4 (1200×1600) | Painel escuro do cadastro (computador), como textura sob o texto | Rua do Brás ao entardecer vista de cima, azul-marinho dominante, luzes quentes. |
| `bd-og-portal` | 1200×630, **PNG ou JPG** | Prévia do link da Brás nas redes e no WhatsApp | Pilha de caixas com fita laranja à direita, metade esquerda lisa em azul-marinho, sem texto. |

Fora do site (ficam em `docs/marca/bras/` quando chegarem): `bd-shorts-fundo` (9:16, fundo para capas dos Shorts) e `bd-logo-conceito-1..3` (referência para um designer; o nome segue em texto até o dono aprovar uma logo, D79).

## Arquivos no ar (2026-10-09, lotes 1 e 2 do GPT)

| Nome | Fonte PNG | AVIF (q55) | WebP (q82) | Outros |
|---|---|---|---|---|
| `bd-corredor-caixas` | 1672×941 | 95 KB | 164 KB | |
| `bd-publico-marketplace` | 1448×1086 | 53 KB | 88 KB | |
| `bd-publico-lojista` | 1448×1086 | 52 KB | 97 KB | |
| `bd-publico-distribuidor` | 1448×1086 | 96 KB | 165 KB | |
| `bd-importadora-balcao` | 1448×1086 | 52 KB | 85 KB | |
| `bd-retirada-transportadora` | 1448×1086 | 74 KB | 122 KB | |
| `bd-cadastro-lateral` | 1086×1448 | 127 KB | 223 KB | |
| `bd-og-portal` | 1200×630 | — | — | JPG 41 KB (usado nas redes) + PNG fonte |

O navegador escolhe AVIF, depois WebP e, por último, o PNG (fonte preservada). Pendentes (lote 3, opcional): `bd-shorts-fundo` e conceitos de logo.

Peso máximo: 220 KB por AVIF. Ponto de foco no código (`posicao`) em `src/components/portal/bras/bras-home.tsx`.
