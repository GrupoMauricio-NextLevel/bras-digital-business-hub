# Imagens da página pública SuperDrop (v3)

Cada arquivo entra na página pelo componente `ImagemEmCriacao` (ou `TexturaDeFundo`). Sem arquivo válido, aparece o aviso "Imagem em criação" no mesmo tamanho.
Formatos: `.avif`, `.webp`, `.png` com o nome exato abaixo; arquivo vazio é ignorado. Pacote de origem e cenas: `docs/imagens-paginas-publicas/`.

| Arquivo | Formatos instalados | Onde aparece (home superdrop.com.br) | Recorte exibido |
|---|---|---|---|
| sd-hero-fornecedor-separando | avif, webp, png | Bastidores → foto grande "Separação na Central" | 4:5 |
| sd-etiqueta-impressora | avif, webp, png | Bastidores → "Etiqueta junto com o pedido" | 4:3 |
| sd-pacote-entregue | avif, webp, png | Bastidores → "Entregue na casa do cliente" | 4:3 |
| sd-expedicao-esteira | avif, webp, png | "Tudo para começar…" → cartão "Vender sem estoque" | 16:10 |
| sd-lojista-home-office | avif, webp, png | "Tudo para começar…" → cartão "Loja profissional sem programar" | 16:10 |
| sd-pix-pagamento | avif, webp, png | "Tudo para começar…" → cartão "Dinheiro sob controle" | 16:10 |
| sd-fornecedor-parceiro | avif, png (webp veio vazio no pacote) | "Quanto sobra em uma venda?" → ao lado de "É fornecedor?" | 3:2 |
| sd-hero-celular-venda | avif, png (webp veio vazio no pacote) | "Escolha o plano e comece hoje" → ao lado do título | 4:5 |
| sd-textura-fundo | avif, webp, png | Chamada final "Pronto para abrir a sua loja?" → fundo decorativo (alt vazio) | cobre a seção |
| sd-passo-publica | avif, webp, png | `/como-funciona` → passo 1 "O fornecedor publica" | 4:3 |
| sd-passo-vende | avif, webp, png | `/como-funciona` → passo 2 "O lojista vende" | 4:3 |
| sd-passo-envia | avif, webp, png | `/como-funciona` → passo 3 "O fornecedor envia" | 4:3 |
| sd-seja-fornecedor | avif, webp, png | `/seja-fornecedor` → abertura, ao lado do título | 16:9 |
| pa-parceiros-hero | avif, webp, png | `/parceiros` (Programa de Parceiros, todas as marcas; acento neutro) → abertura | 16:9 |
| sd-planos-faixa | avif, webp, png | `/planos` do SuperDrop → faixa curta acima da tabela | 21:9 |
| sd-login-lateral | avif, webp, png | Tela de entrada do SuperDrop (lado esquerdo no computador, escurecida sob o texto) | 3:4 |

## Fora da página (prévia de link e e-mail; auditoria geral, 2026-10-12)

Prompt de origem: `docs/prompts/imagens-auditoria-geral-gpt.md` (lotes A, C e E). Os PNGs são os originais do GPT; os JPGs saem deles (fundo navy `#101B34`, qualidade 84) porque WhatsApp, redes e e-mail não leem AVIF.

| Arquivo | Formatos | Uso | Tamanho |
|---|---|---|---|
| sd-og-portal | jpg (usado), png (original) | Prévia do link superdrop.com.br (WhatsApp, Instagram, Facebook) | 1200×630 |
| sd-email-topo | jpg (usado), png (original) | Faixa no topo dos e-mails do SuperDrop | 1200×300 |
