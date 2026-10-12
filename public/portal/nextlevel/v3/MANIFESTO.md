# Imagens da NextLevel (Soluções, Master e telas comuns às marcas) (v3)

Prompt de origem: `docs/prompts/imagens-auditoria-geral-gpt.md` (lotes A, B e E, entregues em 2026-10-12). Acento da marca: amarelo `#F5BC00`, só em detalhes.
Cada foto entra pelo componente `ImagemEmCriacao`/`FotoOpcional` (`src/components/portal/imagem-em-criacao.tsx`) com `.avif` (qualidade 55), `.webp` (qualidade 82) e o `.png` original como reserva. **Sem arquivo, o lugar não aparece** (nada quebra).

| Arquivo | Formatos instalados | Onde aparece | Recorte exibido |
|---|---|---|---|
| nl-solucoes-hero | avif, webp, png | `/solucoes` → abertura, ao lado do título | 16:9 |
| nl-familia-planos | avif, webp, png | Família "Planos Commerce": cartão em `/solucoes`, abertura de `/solucoes/<produto>` e cartão da Loja NextLevel no painel | 4:3 |
| nl-familia-loja-pronta | avif, webp, png | Família "Loja Pronta" (mesmos três lugares) | 4:3 |
| nl-familia-migracao | avif, webp, png | Família "Migração" (mesmos três lugares) | 4:3 |
| nl-familia-temas | avif, webp, png | Família "Temas" (mesmos três lugares) | 4:3 |
| nl-familia-marketing | avif, webp, png | Família "Marketing" (mesmos três lugares) | 4:3 |
| nl-familia-consultoria | avif, webp, png | Família "Consultoria" (mesmos três lugares) | 4:3 |
| nl-familia-white-label | avif, webp, png | Família "White Label" (mesmos três lugares) | 4:3 |
| nl-login-lateral | avif, webp, png | Tela de entrada do Master (master.nextlevelgroup.com.br; lado esquerdo no computador, escurecida). Cargas e marcas "em breve" seguem sem foto | 3:4 |
| erro-caixa-vazia | avif, webp, png | Páginas "não encontrada" e "algo deu errado" de todas as marcas (acento neutro) | 4:3 |

## Fora da página (prévia de link e e-mail)

Os PNGs são os originais do GPT; os JPGs saem deles (fundo navy `#101B34`, qualidade 84) porque WhatsApp, redes e e-mail não leem AVIF.

| Arquivo | Formatos | Uso | Tamanho |
|---|---|---|---|
| nl-og-solucoes | jpg (usado), png (original) | Prévia do link de `/solucoes` e do endereço do Master/NextLevel | 1200×630 |
| nl-email-topo | jpg (usado), png (original) | Faixa no topo dos e-mails enviados pelo endereço da NextLevel (Master). Brás e Cargas seguem sem faixa | 1200×300 |
