# Lojas no nível Shopify: temas grátis, banners, chat e central do cliente (D235, proposta)

Pedido do dono em 03/11/2026, com prints da loja "Mega tron" no celular:
- Domínio próprio para todo cliente novo. **Feito em D234.**
- Um salto grande nos temas grátis.
- Uma área de banners no painel, fácil de trocar.
- Banners em vários pontos da loja, e não só no topo.
- Um chat que atenda bem o cliente final.
- Uma central do cliente melhor.
- Tudo no nível de tecnologia da Shopify e rodando liso.
- Os temas ganham mais funções conforme o preço.

## 1. O que existe hoje (levantamento do código)

**Temas**
- O catálogo fica em `src/lib/themes/catalog.ts` e tem 4 níveis:
  - N1, grátis: 7 temas (starter, trama, lar, lance, petala, sinal, fardo).
  - N2: R$ 149.
  - N3: R$ 299.
  - N4: R$ 999.
- Já existem cerca de 40 tipos de seção. Os de banner são hero-banner, banner-duo, banner-strip, banner-mosaic, category-banner e cta-banner. Também há slideshow, vídeo, lookbook, contagem regressiva, depoimentos, perguntas e selos.
- A agenda de campanha está em `src/lib/themes/banners.ts`, com início e fim no horário de Brasília e opção por categoria.
- As seções têm limite por nível (`minLevel` e `maxByLevel`).

**O problema**
- A loja nova abre com a página quase vazia (print da Mega tron).
- Os banners só podem ser trocados dentro do editor de tema, o que é difícil para quem não é designer.
- Não há uma área "Banners" no painel.

**Chat da loja** (`chat-da-loja.tsx`)
- Responde com guias fixos, sem IA.
- Quando não acha a resposta, manda a pergunta para a caixa "Atendimento" do lojista. Isso funciona.
- O cliente não recebe a resposta do lojista quando sai da página.
- O chat não sabe nada dos produtos, do frete nem do pedido daquele cliente.

**Central do cliente**
- Não existe "Minha conta".
- Existe só o "Acompanhar pedido", que pede o número do pedido e o e-mail.

**Desempenho**
- As páginas da loja são montadas a cada visita (`force-dynamic`).
- As imagens ficam em base64 no banco (com cache longo no navegador).
- Não há cache de página entre visitas.

## 2. Proposta em fases (recomendada)

### L1. Loja nova já bonita (temas grátis, o salto)
- Toda loja nasce com uma home completa no tema grátis. A ordem das seções é:
  - barra de aviso;
  - slideshow com 3 banners;
  - faixa de categorias;
  - vitrine de mais vendidos;
  - dupla de banners;
  - novidades;
  - mosaico;
  - depoimentos;
  - perguntas frequentes;
  - selos;
  - newsletter.
- O conteúdo inicial vem do nicho escolhido no cadastro (moda, casa, sport, beleza, atacado). As imagens de exemplo ficam marcadas como "troque pela sua".
- Os 7 temas grátis ganham uma revisão visual, com tipografia, espaços e movimento no padrão das lojas Shopify de referência. Para isso entram mais seções no N1:
  - slideshow;
  - dupla de banners;
  - mosaico;
  - faixa;
  - banner de categoria;
  - contagem regressiva.
- O limite por nível fica na **quantidade** de cada seção, não no tipo.

### L2. Área "Banners" no painel do lojista (`/merchant/banners`)
- Uma tela única que lista todos os pontos de banner da loja:
  - topo (slideshow);
  - meio da home (dupla, mosaico, faixa);
  - topo de categoria;
  - página de produto;
  - carrinho;
  - barra de aviso;
  - pop-up de boas-vindas.
- Em cada ponto: trocar a imagem (celular e computador), o texto, o botão e o link, agendar início e fim, e definir a ordem arrastando.
- A tela mostra uma prévia ao vivo do celular ao lado. Os dados são os mesmos do editor de tema, então não há dois lugares guardando a mesma coisa.
- Um gerador de banner com IA (Maurício) escreve o texto do banner a partir do produto ou da campanha.

### L3. Chat que atende de verdade
- O chat responde com IA, usando os dados da loja: produtos, estoque, frete pelo CEP, trocas e prazo.
- Com o e-mail e o número do pedido, responde "onde está meu pedido".
- Quando não sabe, passa para o lojista. A resposta do lojista chega ao cliente pelo chat, quando ele volta, e por e-mail ou WhatsApp.
- O chat sugere produtos e tem o botão "adicionar ao carrinho".

### L4. Central do cliente ("Minha conta")
- Entrada por código no e-mail, sem senha.
- Dentro da conta:
  - pedidos com linha do tempo e rastreio;
  - comprar de novo;
  - endereços;
  - favoritos;
  - cupons;
  - trocas e devoluções (pedido de troca que cai no painel do lojista);
  - avaliações.

### L5. Rodar liso
- Cache das páginas da vitrine, renovado quando o lojista publica.
- Imagens servidas por CDN com tamanhos automáticos (AVIF e WebP).
- Uma meta de nota no Lighthouse do celular acima de 90 na home e no produto, medida em toda publicação.

### L6. Temas por preço (o que cada nível soma)
- N1 (grátis): todas as seções básicas e de banner, com quantidade limitada.
- N2: vídeo, lookbook, filtros avançados, visualização rápida e mega-menu.
- N3: compre o look, pacote ou grade com desconto, recomendação por IA e páginas de campanha.
- N4: experiência imersiva (camadas, 3D/AR quando houver), personalização completa e implantação assistida.

## 3. Perguntas ao dono
1. **Ordem:** recomendo L1 → L2 → L5 → L3 → L4 → L6. Aprova?
2. **Chat com IA:** conta nos usos de IA do plano (40, 350 ou 1.200 por mês) ou fica fora da cota?
3. **Minha conta:** entrada só por código no e-mail, ou também por WhatsApp?
4. **Imagens de exemplo dos temas grátis:** usamos o acervo de fotos geradas (como nas páginas da E-commerce) ou você gera um lote novo por nicho?
5. **Domínio:** quer que o cadastro na hospedagem seja automático? Para isso, crie uma chave de API no Render (Account Settings → API Keys) e cadastre `RENDER_API_KEY` e `RENDER_SERVICE_ID` nas variáveis do serviço. Sem isso, cada domínio novo aparece na fila do Master para a equipe cadastrar à mão.

## 4. Prompt mestre (para cada fase)
> Leia este arquivo e `docs/design/DECISIONS.md` (D234+). Desenvolva a fase LX indicada pelo dono, estendendo o que existe: `src/lib/themes/*`, `src/components/storefront/sections/*`, `src/components/theme-editor/*`, `chat-da-loja.tsx`, `atendimento-loja.ts`, `/store/[slug]/acompanhar`. Regras: domínio em `src/lib/domain`, testes de Vitest, celular primeiro (360 px sem rolagem lateral), acessibilidade AA, nada de dado inventado, textos em português simples. Feche com tsc, lint, testes, build, decisão nova, prints do celular e do computador, publicação e conferência de produção.
