# Imagens das lojas (biblioteca e banners)

- **Biblioteca por loja** (`src/lib/domain/assets.ts`): PNG, JPG ou WebP decodificados de verdade (arquivo corrompido, vazio ou gigante é recusado), até 3 MB, até 6000 px por lado e 36 milhões de pixels, até 200 imagens por loja. Guarda largura, altura, nome e descrição.
- **Original preservado**; a loja recebe versões leves em WebP (480, 640, 960, 1280, 1600 e 1920 px) por `/assets/<id>?w=`.
- **Uma loja nunca usa imagem de outra**: salvar ou publicar com imagem de outra loja é recusado no servidor.
- **Remover**: imagem em uso no ar ou no rascunho não sai; usada só em versão antiga fica arquivada (some da biblioteca, continua servida); sem uso é apagada.
- **Armazenamento**: hoje no banco (`databaseStorage`, interface `AssetStorage` em `src/lib/storage/assets.ts`). Trocar por um armazenamento de arquivos (S3/R2) exige só uma nova implementação da interface.
- **Banners**: imagem de computador e de celular, ponto de foco por aparelho, descrição (ou "só decorativa"), escurecimento, alinhamento, link; N4 agenda início e fim (horário de Brasília) e pode limitar a uma categoria. Sem imagem, o banner mostra um fundo nas cores do tema (nunca uma foto aleatória).
- **Imagens das demonstrações**: manifesto por família em `docs/temas-modulares/manifestos/` e prompt em `docs/prompts/imagens-familias-nextlevel-gpt.md`. O arquivo salvo com o nome do manifesto em `public/temas/familias/` substitui a provisória sem mexer em código.
