# Relatório final · Temas modulares NextLevel (Prompt-NextLevel.md)

Branch local `claude/temas-modulares-v1` (sem push, merge ou deploy). Decisões D82 e D83 em `docs/design/DECISIONS.md`.

## 1. Auditado (com evidência)
`docs/temas-modulares/AUDITORIA.md`, achados A01 a A20, evidências em `evidencias/e0/`.
- **Confirmados executando:**
  - A01: tema em revisão podia ser comprado;
  - A02: restrição de seção por tema nunca era aplicada;
  - A03: loja SuperDrop não editava tema comprado;
  - A04: instalar apagava o rascunho;
  - A05: duas abas gravavam uma por cima da outra;
  - A06: PNG corrompido era aceito.
- **Confirmados lendo o código:** A07 a A20, entre eles:
  - imagens guardadas em base64;
  - banners sem imagem;
  - promessas falsas nos modelos;
  - três fontes de preço;
  - checkout real nas lojas de exemplo.

## 2. Executado (testes e verificações)
- `npx vitest run`: 83 arquivos, **622 testes passando**. Arquivos novos: `temas-politica` (16 testes), `temas-banners-midia` (8), `temas-familias` (6) e `temas-modelos` (2), mais os testes de temas que já existiam, atualizados.
- `npx tsc --noEmit` e `npx eslint src e2e tests`: limpos.
- `npm run build`: passa, sem "Export encountered".
- **Navegador (playwright, build de produção):**
  - `e2e/temas-moda.mjs`:
    - 12 lojas de família × 6 telas (home, coleção, produto, carrinho, fechamento, confirmação) × 360/768/1440;
    - mais a galeria e as páginas de tema;
    - **234 verificações, sem rolagem lateral, sem violação grave no axe e sem erro no navegador**.
  - `e2e/temas-editor-niveis.mjs`:
    - cartão do nível;
    - biblioteca com envio real;
    - foco por aparelho (teclado e clique);
    - descrição da imagem;
    - prévia com versão leve;
    - conflito entre duas abas;
    - axe.
  - Antigos, todos OK: `smoke-demo`, `theme-store`, `temas-pagos`, `theme-engine` e `theme-editor`. Três checagens estavam desatualizadas ou dependiam de tempo fixo e foram ajustadas, sem mudar o comportamento.
- **Lighthouse no celular:** `evidencias/e6/lighthouse-celular.txt`. Nota de desempenho 92 a 96, acessibilidade 100, CLS 0.

## 3. Implementado
- **Níveis N1 a N4 cumulativos e capacidades** com uma política única para editor e servidor (`levels.ts`, `policy.ts`).
  - Comprar ou instalar um tema não liberado é recusado também por chamada direta.
  - A loja SuperDrop edita o tema que comprou.
  - Direitos antigos foram preservados: oferta Loja própria e o vídeo do Editorial.
- **Editor progressivo:**
  - cartão do nível com o que pode ser feito;
  - cadeados com o nível necessário;
  - modelos de seção (N3) e de página/campanha (N4);
  - aviso de conflito entre abas;
  - aviso antes de sair sem salvar;
  - teclado na árvore (Alt + setas).
- **Central de Banners:**
  - destaque (1 imagem no N1, 2 slides no N2, carrossel no N3+);
  - dois banners de apoio, faixa e mosaico;
  - imagem de computador e de celular, ponto de foco por aparelho, descrição, link;
  - no N4: agendamento no horário de Brasília, condição por categoria e vídeo;
  - biblioteca por loja com decodificação real, versões leves, uso e remoção segura.
- **Motor por família:** um construtor por nível (`presets-familia.ts`) e identidade por família (`familias-specs.ts`).

| Família | Loja de exemplo | N1 | N2 | N3 | N4 |
|---|---|---|---|---|---|
| Moda | Trama Urbana | Trama | Lume | Editorial | Atelier |
| Casa | Casa em Ordem | Lar | Ninho | Varanda | Morada |
| Sport | Linha de Jogo | Lance | Torcida | Arena (composição própria mantida) | Pódio |

  Cada família tem 14 produtos, 4 categorias, variações e 1 esgotado, e o mesmo catálogo vale em todos os níveis.
- **Lojas de demonstração:** fechamento simulado no navegador (nada de pedido, pagamento ou estoque) e aviso fixo de demonstração.
- **Páginas públicas:**
  - `/temas` com filtro por nível e família;
  - página do tema com selos e comparação dos níveis da família;
  - "Preço em definição" para tema pago sem preço aprovado;
  - miniaturas novas (`e2e/temas-miniaturas.mjs`).
- **Verdade comercial:** sem "frete grátis", prazos ou depoimentos inventados nos modelos. Contagem regressiva e depoimentos nascem ocultos.
- **Manifestos e prompt das imagens**, gerados do código:
  - `docs/temas-modulares/manifestos/<família>.json|.md`;
  - `docs/prompts/imagens-familias-nextlevel-gpt.md`;
  - script `npx tsx scripts/manifesto-temas.ts`.

## 4. Validado visualmente (capturas)
- `evidencias/e3/capturas/`: as 12 lojas em 360, 768 e 1440 (home, coleção, produto, carrinho, fechamento e confirmação), a galeria e as páginas de tema.
- `evidencias/e3/editor/`:
  - editor por nível;
  - biblioteca;
  - foco do banner;
  - conflito entre abas;
  - editor no celular;
  - loja SuperDrop.
- Ajustes feitos depois de olhar as capturas:
  - lookbook sem buraco na grade;
  - botão contornado legível sobre a foto;
  - cabeçalho do N4 numa linha;
  - carrinho sem rolagem em 360 px;
  - painel de imagem cabendo na coluna.

## 5. Aguardando imagem (do dono, no GPT)
- **Moda:** banners usam imagens **provisórias** do acervo. 4 produtos usam ilustração.
- **Casa e Sport:** todos os banners **pendentes** (fundo nas cores do tema) e produtos com ilustração neutra (camisa, pote, caixa, cesto, frasco).
- Total: 51 posições de banner/seção e 42 fotos de produto, com proporção, foco, área livre, texto que vai por cima e nome do arquivo no manifesto. É só salvar com o nome indicado, sem mexer em código.

## 6. Aguardando liberação comercial (decisão do dono)
- **Em revisão (não vendem):** Trama, Lar, Ninho, Lance, Torcida, Varanda, Atelier, Morada e Pódio.
- **Preço em definição:** Torcida, Varanda, Atelier, Morada e Pódio. A proposta, não aplicada, está em `CATALOGO.md`.
- Preços atuais não mudaram: Lume R$ 149, Ninho R$ 149, Arena R$ 299, Editorial R$ 699, Signature R$ 1.499.

## 7. Pendências reais
- **LCP no celular** entre 2,7 e 3,3 s com rede lenta simulada; a meta é 2,5 s.
  - O pré-carregamento da imagem principal já foi feito.
  - Falta medir de novo com as imagens finais e reduzir o JavaScript da página inicial.
- **Beauty (Bela Essência), Conecta (Ponto Conecta) e Atacado (Giro Distribuidora)** não foram feitos.
  - Cada um precisa de uma spec, um catálogo e um manifesto.
  - Atacado depende do módulo de atacado, que ainda não está disponível.
- Ao publicar, o banco de produção ganha os 8 temas novos como indisponíveis e as lojas de demonstração deles (fechadas, fora das contagens).
- A faixa "Envio para todo o Brasil" no rodapé é uma opção antiga, ligada por padrão nas lojas reais. Não foi mexida porque o SuperDrop está em produção; vale decidir se deve nascer desligada.
- Imagens e vídeos ficam no banco (interface pronta para trocar por armazenamento de arquivos).
