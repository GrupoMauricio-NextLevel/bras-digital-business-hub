# Prompt para gerar as imagens de demonstração dos 10 temas (produtos fictícios e banners) no GPT

> **Para que serve:** dar aos temas da NextLevel Commerce imagens bonitas e coerentes (produtos fictícios, banners, categorias, lookbook) para a vitrine de temas, as demonstrações navegáveis (`/demo/<tema>`) e o conteúdo inicial de lojas novas. Salvo aqui para você levar ao GPT quando quiser. O trabalho de importar as imagens no sistema fica descrito na seção 4 e pertence ao prompt `docs/prompts/editor-templates-evolucao.md` (fase T1).
>
> **Como usar (resumo):** abra um chat novo no GPT com geração de imagens, cole **todo o bloco da seção 2** e diga "Comece pelo lote 1". Salve cada imagem com o **nome de arquivo exato** que o GPT informar. Ao terminar cada lote, converta para WebP (seção 3) e me traga: eu importo, valido e ligo aos temas.

## 1. Regras que valem para todas as imagens (o GPT recebe isto no bloco)
- **Sem texto legível, sem letras, sem números e sem logotipos** dentro das imagens (o gerador erra texto; o texto real vem do tema). Camisas, caixas e etiquetas ficam lisas ou com estampa abstrata.
- **Sem marcas reais, sem escudos de clubes reais, sem estampas de times reais.** Times e marcas são **inventados**; escudos, se aparecerem, são formas abstratas genéricas.
- **Sem rostos e sem crianças:** peças em **manequim invisível (ghost mannequin)**, **flat lay**, cabides, **cortes no pescoço**, costas ou mãos. Nada de rosto reconhecível, nada de criança fotografada (linha infantil: só peças, brinquedos e cenários).
- **Sem celebridades, sem semelhança com pessoas reais.**
- **Estilo:** fotografia de catálogo profissional, luz de estúdio suave, cores fiéis, foco nítido, fundo coerente com o tema, sombra suave. Nada de aspecto ilustrado, plástico ou excessivamente "IA".
- **Composição segura:** o assunto principal fica na **área central** (as imagens largas são recortadas em telas menores; as de produto são recortadas em 4:5).
- **Consistência:** dentro de um mesmo kit de produtos, mesma luz, mesmo fundo, mesma distância e mesmo ângulo, para a grade ficar uniforme.
- **Diversidade real de produto:** modelagens, cores e tecidos plausíveis para o comércio de moda do Brás.

## 2. O PROMPT (copie tudo o que está no bloco abaixo e cole no GPT)

```
PAPEL
Você é diretor de arte de e-commerce de moda. Vai produzir, em lotes, as imagens de demonstração de 10 temas de loja virtual brasileira (NextLevel Commerce). Todas as marcas, times e produtos são FICTÍCIOS.

REGRAS GLOBAIS (obrigatórias em TODA imagem)
1. Nenhum texto, letra, número ou logotipo visível. Camisas, caixas e etiquetas lisas ou com estampa abstrata.
2. Nenhuma marca real, nenhum clube real, nenhum escudo real. Escudos apenas como formas abstratas genéricas, se necessário.
3. Nenhum rosto e nenhuma criança fotografada. Use ghost mannequin (manequim invisível), flat lay, cabide, corte no pescoço, costas ou mãos. Linha infantil: apenas peças, brinquedos e cenários, sem crianças.
4. Nenhuma pessoa famosa ou semelhante a pessoa real.
5. Fotografia de catálogo profissional, luz de estúdio suave, cores fiéis, foco nítido, sombra suave. Nada de aparência ilustrada ou plástica.
6. Assunto principal na área central: as imagens largas serão recortadas depois (21:9 no computador e 4:5 no celular); as de produto serão recortadas em 4:5.
7. Consistência: dentro de cada kit, mesma luz, mesmo fundo, mesma distância e mesmo ângulo.
8. Brasil: cenários, cores e produtos plausíveis para o comércio de moda brasileiro (Brás, atacado, varejo, esporte, festa).

FORMATOS (o gerador aceita 1024x1024, 1536x1024 e 1024x1536)
- PRODUTO (product): gerar 1024x1536, assunto centralizado ocupando ~75% da altura, fundo liso do kit. Será recortado em 1024x1280 (4:5).
- LARGA (wide: hero, slide, banner, pôster de vídeo): gerar 1536x1024, com ~40% de espaço livre e liso de um lado (para o texto do tema entrar) e o assunto no terço oposto. Descrever o lado livre no nome do arquivo (L = livre à esquerda, R = livre à direita, C = assunto centralizado).
- QUADRADA (square: categoria, imagem com texto): gerar 1024x1024, assunto centralizado.
- RETRATO (portrait: lookbook): gerar 1024x1536, composição editorial, sem rosto.

PROTOCOLO DE TRABALHO
- Trabalhe por LOTE. Comece pelo lote que eu pedir. Em cada lote, gere as imagens uma a uma.
- Antes de cada imagem, escreva em uma linha: ARQUIVO: <nome exato>.webp | ALT: <texto alternativo em português, até 110 caracteres, descrevendo a imagem sem marcas>.
- Depois de cada imagem, confira mentalmente as regras globais. Se violar alguma (texto, logotipo, rosto, marca), gere novamente uma vez, corrigida, e informe.
- Ao fim do lote, liste os arquivos gerados e pergunte se pode seguir para o próximo. Só continue quando eu disser "próximo lote".
- Se eu escrever "refazer <arquivo>: <ajuste>", gere de novo só aquela imagem com o ajuste, mantendo o mesmo nome.
- Não invente arquivos fora da lista. Use exatamente os nomes.

DESTINO DOS ARQUIVOS (para eu organizar)
- Produtos dos kits: kits/<kit>/<sku>-<tomada>.webp
- Peças de cada tema: temas/<tema>/<slot>-<nn>-<lado>.webp

ESTRUTURA DOS PEDIDOS
Cada tema tem: nome, tipo (grátis ou avançado), paleta, clima, kit de produtos e uma lista de "slots" de imagem (hero, banner, categoria, lookbook, lifestyle, poster).
Cada kit tem produtos (sku, nome, cor, descrição) e as tomadas: main (frente, fundo liso), detail (detalhe de tecido/costura/acabamento), back (costas, quando indicado), lifestyle (peça em cenário, sem rosto, apenas para os itens marcados com *).

===================== KITS DE PRODUTOS =====================
KIT casual (fundo: off-white quente #F5F2EC, luz lateral suave; ghost mannequin)
 casual-01 Camiseta Básica Algodão, cor areia
 casual-02 Camiseta Oversized, cor verde-sálvia *
 casual-03 Regata Canelada, cor branca
 casual-04 Camisa Linho Manga Longa, cor azul-claro *
 casual-05 Calça Alfaiataria Feminina, cor caramelo
 casual-06 Calça Jeans Reta, cor azul médio
 casual-07 Vestido Midi Liso, cor terracota *
 casual-08 Saia Plissada, cor preta
 casual-09 Jaqueta Jeans, cor azul-escuro
 casual-10 Moletom Canguru, cor cinza mescla *
 casual-11 Short Alfaiataria, cor bege
 casual-12 Cardigã Tricô, cor off-white
 Tomadas: main, detail; lifestyle nos itens com *.

KIT esportivo (fundo: cinza-carvão #1B1F24, luz de recorte esportiva; ghost mannequin; times INVENTADOS, listras e cores próprias, sem escudo legível)
 esp-01 Camisa Atlético Vale Verde I, verde e branco listrado *
 esp-02 Camisa Atlético Vale Verde II, branca com detalhe verde
 esp-03 Camisa Real Aurora I, vinho e dourado *
 esp-04 Camisa Real Aurora II, dourada com detalhe vinho
 esp-05 Camisa União Serrana I, azul-royal e branco
 esp-06 Camisa União Serrana II, preta com detalhe azul *
 esp-07 Camisa Estrela do Norte I, vermelha e preta
 esp-08 Camisa Porto Azul FC I, azul-celeste
 esp-09 Camisa Retrô Sertão Unido, mostarda e marrom *
 esp-10 Short de Jogo Preto
 esp-11 Jaqueta de Treino Grafite
 esp-12 Meião Listrado Verde e Branco
 Tomadas: main, detail (tecido/costura/gola), back nos itens esp-01, esp-03, esp-05, esp-07; lifestyle nos itens com *.

KIT infantil (fundo: creme claro #FFF8EC, luz alegre; SOMENTE peças e brinquedos, sem crianças)
 kid-01 Conjunto Dinossauro, verde e amarelo *
 kid-02 Vestido Bolinhas, rosa e branco
 kid-03 Macacão Estrelas, azul-marinho e mostarda
 kid-04 Camiseta Arco-íris, branca com estampa colorida abstrata
 kid-05 Short Jeans com Barra Virada, azul médio
 kid-06 Jaqueta Corta-vento, laranja e cinza *
 kid-07 Pijama Nuvens, azul-claro
 kid-08 Body Manga Curta Kit 3, tons pastel
 kid-09 Tênis de Lona Colorido, amarelo *
 kid-10 Mochila Escolar Foguete, azul e vermelho
 kid-11 Boné Aba Curva, verde-limão
 kid-12 Meias Divertidas Kit 5, cores variadas
 Tomadas: main, detail; lifestyle nos itens com * (peças sobre tapete, cama ou cesta de brinquedos).

KIT luxo (fundo: grafite quase preto #101012, luz de destaque quente e sombras profundas; ghost mannequin e produto sobre superfície escura)
 lux-01 Blazer Estruturado, preto *
 lux-02 Vestido Longo Cetim, champanhe *
 lux-03 Camisa Seda, marfim
 lux-04 Calça Pantalona Alfaiataria, preta
 lux-05 Bolsa Estruturada de Couro, caramelo *
 lux-06 Cinto de Couro Fivela Dourada, preto
 lux-07 Brinco Argola Dourado, joia sobre veludo
 lux-08 Colar Correntes Douradas, joia sobre veludo *
 lux-09 Lenço de Seda Estampa Abstrata, bordô e dourado
 lux-10 Sapato Scarpin, preto envernizado
 Tomadas: main, detail; lifestyle nos itens com *.

KIT street (fundo: cinza-claro industrial #E4E6E8 com piso de concreto; luz dura de flash suave; ghost mannequin)
 str-01 Camiseta Boxy Preta, sem estampa legível *
 str-02 Moletom Oversized Cinza Chumbo
 str-03 Calça Cargo, verde-militar *
 str-04 Jaqueta Bomber, preta e laranja
 str-05 Short Tactel, preto com faixa lima
 str-06 Boné Trucker, preto
 str-07 Tênis Chunky Branco e Lima *
 str-08 Bolsa Transversal Nylon, preta
 str-09 Camiseta Manga Longa Off-White
 str-10 Calça Jogger, cinza
 Tomadas: main, detail; lifestyle nos itens com *.

===================== TEMAS =====================
Formato dos slots: <slot> (formato) nº: descrição | nome do arquivo.
"L/R/C" = lado livre para o texto do tema (esquerda, direita, centro).

TEMA starter (GRÁTIS) paleta: preto #111827, verde #16A34A, branco; clima: limpo, neutro, rápido; kit: casual
 hero (wide) 1: mulher não, sem pessoas: arara de roupas neutras numa loja clara e arejada, luz natural | temas/starter/hero-01-L.webp
 banner (wide) 2: pilha de camisetas dobradas em tons neutros sobre bancada de madeira clara | temas/starter/banner-01-R.webp ; acessórios (cinto, boné, bolsa) em flat lay | temas/starter/banner-02-L.webp
 category (square) 4: camisetas | vestidos | calças | acessórios (flat lay de cada, fundo do kit casual) | temas/starter/cat-01.webp a cat-04.webp

TEMA essencial (GRÁTIS) paleta: off-white #F7F5F0, sálvia #8FA98E, grafite #2B2B2B; clima: minimalista, muito respiro, leve; kit: casual
 hero (wide) 1: peça linho pendurada em cabide de madeira diante de parede off-white, sombra de janela | temas/essencial/hero-01-R.webp
 banner (wide) 2: vaso de cerâmica e uma camisa dobrada, composição minimalista | temas/essencial/banner-01-L.webp ; sandálias e bolsa de palha sobre linho | temas/essencial/banner-02-C.webp
 category (square) 4: básicos | linho | acessórios | novidades | temas/essencial/cat-01.webp a cat-04.webp
 lifestyle (square) 1: canto de provador claro com cabide e planta, sem pessoas | temas/essencial/life-01.webp

TEMA vitrine (GRÁTIS) paleta: coral #FF5A4F, azul-marinho #12233F, amarelo #FFC93C; clima: colorido, varejo de bairro, promoções; kit: casual
 hero (wide) 1: vitrine de loja de rua com manequins invisíveis e peças coloridas, clima alegre, sem texto | temas/vitrine/hero-01-L.webp
 banner (wide) 3: sacolas de papel coloridas empilhadas | temas/vitrine/banner-01-R.webp ; arara colorida de liquidação (sem placas com texto) | temas/vitrine/banner-02-L.webp ; caixa de presente e fitas | temas/vitrine/banner-03-C.webp
 category (square) 6: feminino | masculino | jeans | acessórios | calçados | promoção (peças, fundo colorido liso) | temas/vitrine/cat-01.webp a cat-06.webp

TEMA lancamento (GRÁTIS) paleta: preto #0A0A0A, lima #C6FF3D, cinza #9CA3AF; clima: drop, streetwear, uma peça em destaque; kit: street
 hero (wide) 1: uma jaqueta bomber solitária em manequim invisível sobre piso de concreto, luz dramática, muito espaço livre | temas/lancamento/hero-01-R.webp
 banner (wide) 2: tênis chunky em destaque com luz de neon lima discreta | temas/lancamento/banner-01-L.webp ; detalhe de tecido e costura da mesma jaqueta em macro | temas/lancamento/banner-02-C.webp
 category (square) 4: camisetas | moletons | calças | acessórios | temas/lancamento/cat-01.webp a cat-04.webp

TEMA arena (AVANÇADO) paleta: verde #0EA05B, preto #0B0F14, dourado #E7B416; clima: esportivo, clubes, energia; kit: esportivo
 hero (wide) 3: estádio vazio ao entardecer com gramado iluminado, sem pessoas | temas/arena/hero-01-R.webp ; camisas fictícias penduradas em vestiário, luz de recorte | temas/arena/hero-02-L.webp ; bola em campo, grama e luz dourada, sem pessoas | temas/arena/hero-03-C.webp
 banner (wide) 3: coleção de camisas em fileira, cores diferentes por time inventado | temas/arena/banner-01-L.webp ; chuteiras e caneleiras em flat lay | temas/arena/banner-02-R.webp ; arquibancada de torcida em silhueta desfocada, sem rostos | temas/arena/banner-03-C.webp
 category (square) 6: Atlético Vale Verde | Real Aurora | União Serrana | Estrela do Norte | Retrôs | Treino (cada um com a camisa do clube em fundo liso da cor do time) | temas/arena/cat-01.webp a cat-06.webp
 lifestyle (square) 2: camisa dobrada sobre bola e chuteiras | temas/arena/life-01.webp ; camisas empilhadas em banco de vestiário | temas/arena/life-02.webp
 poster (wide) 1: campo visto de cima, linhas do gramado, luz dourada, sem pessoas | temas/arena/poster-01-C.webp

TEMA ofertas (AVANÇADO) paleta: vermelho #E11D2A, amarelo #FFD400, preto #111111; clima: alto giro, promoção, energia; kit: street (e casual)
 hero (wide) 3: montanha de sacolas vermelhas e amarelas com confete, sem texto | temas/ofertas/hero-01-R.webp ; arara lotada de peças coloridas em ponto de venda, vibrante | temas/ofertas/hero-02-L.webp ; caixas de papelão abertas com roupas dobradas, clima de atacado, sem marcas | temas/ofertas/hero-03-C.webp
 banner (wide) 3: pilha de camisetas coloridas com etiqueta lisa em destaque | temas/ofertas/banner-01-L.webp ; bancada de calçados em fileira | temas/ofertas/banner-02-R.webp ; fita métrica e tesoura sobre tecido estampado | temas/ofertas/banner-03-C.webp
 category (square) 6: camisetas | calças | bermudas | jaquetas | acessórios | kits | temas/ofertas/cat-01.webp a cat-06.webp
 lifestyle (square) 2: mãos empilhando peças dobradas | temas/ofertas/life-01.webp ; sacola aberta com roupas coloridas | temas/ofertas/life-02.webp
 poster (wide) 1: fluxo de caixas de papelão numa esteira de expedição, sem pessoas | temas/ofertas/poster-01-C.webp

TEMA pop (AVANÇADO) paleta: azul #2F7BFF, amarelo #FFC83D, rosa #FF6FA5, verde #4CD6A0; clima: lúdico, infantil, arredondado; kit: infantil (SEM CRIANÇAS)
 hero (wide) 3: tapete colorido com blocos de montar e peças de roupa infantil dobradas, luz de janela | temas/pop/hero-01-R.webp ; varal com roupinhas coloridas e pregadores contra céu claro | temas/pop/hero-02-L.webp ; cama infantil arrumada com pijamas dobrados e bichinhos de pelúcia | temas/pop/hero-03-C.webp
 banner (wide) 3: prateleira de brinquedos de madeira e mochilas | temas/pop/banner-01-L.webp ; tênis coloridos enfileirados | temas/pop/banner-02-R.webp ; confete e balões coloridos, sem texto | temas/pop/banner-03-C.webp
 category (square) 6: meninas | meninos | bebês | calçados | acessórios | festa | temas/pop/cat-01.webp a cat-06.webp
 lifestyle (square) 2: cesta de brinquedos com roupinhas | temas/pop/life-01.webp ; mochila e lancheira sobre mesa de estudos | temas/pop/life-02.webp
 poster (wide) 1: sala de brincar vazia, colorida e luminosa | temas/pop/poster-01-C.webp

TEMA editorial (AVANÇADO) paleta: creme #FAF7F2, terracota #B4532A, grafite #1F1F1F; clima: revista, tipografia serifada, lookbook; kit: casual
 hero (wide) 3: tecido esvoaçante terracota em movimento contra parede creme, sem pessoas | temas/editorial/hero-01-R.webp ; ateliê com manequim invisível e rolos de tecido, luz de janela grande | temas/editorial/hero-02-L.webp ; mesa de corte com tesoura, giz e tecido de linho | temas/editorial/hero-03-C.webp
 banner (wide) 2: paleta de tecidos e botões em close | temas/editorial/banner-01-L.webp ; sapatos e bolsa sobre pedestal de gesso | temas/editorial/banner-02-R.webp
 lookbook (portrait) 6: looks completos em manequim invisível ou de costas, cortados no pescoço, cenários de estúdio, rua vazia, escada, cortina, janela e sofá | temas/editorial/look-01.webp a look-06.webp
 lifestyle (square) 2: mãos ajustando a gola de uma camisa (sem rosto) | temas/editorial/life-01.webp ; cabides de madeira alinhados em arara de metal | temas/editorial/life-02.webp
 poster (wide) 1: passarela vazia de estúdio com luz recortada | temas/editorial/poster-01-C.webp

TEMA noir (AVANÇADO) paleta: quase preto #0D0D10, dourado #C8A24B, marfim #EFE7D6; clima: luxo discreto, sombras profundas; kit: luxo
 hero (wide) 3: bolsa estruturada em pedestal de mármore escuro com luz quente pontual | temas/noir/hero-01-R.webp ; joias douradas sobre veludo preto, reflexos suaves | temas/noir/hero-02-L.webp ; vestido de cetim champanhe em manequim invisível diante de cortina escura | temas/noir/hero-03-C.webp
 banner (wide) 2: blazer preto em cabide de madeira escura | temas/noir/banner-01-L.webp ; sapatos scarpin em fileira sobre superfície espelhada escura | temas/noir/banner-02-R.webp
 category (square) 5: vestidos | alfaiataria | bolsas | joias | sapatos | temas/noir/cat-01.webp a cat-05.webp
 lookbook (portrait) 6: composições noturnas sem rosto: mão com pulseira, costas de vestido, silhueta de blazer, bolsa em mesa, sapato em escada, lenço de seda em movimento | temas/noir/look-01.webp a look-06.webp
 lifestyle (square) 2: caixa de presente preta com fita dourada | temas/noir/life-01.webp ; perfume e lenço sobre bandeja escura | temas/noir/life-02.webp
 poster (wide) 1: corredor de loja de luxo vazio, luz quente, reflexos | temas/noir/poster-01-C.webp

TEMA signature (AVANÇADO) paleta: preto #0B0B0C, branco, azul #1F5BFF; clima: grande varejo, premium limpo; kit: casual e luxo (mistura de itens)
 hero (wide) 3: loja conceito ampla, prateleiras e araras organizadas, luz de vitrine, sem pessoas | temas/signature/hero-01-R.webp ; coleção outono em cabides padronizados de madeira clara | temas/signature/hero-02-L.webp ; vitrine externa de loja à noite, reflexos e luz quente, sem pessoas | temas/signature/hero-03-C.webp
 banner (wide) 3: coleção de bolsas em prateleira iluminada | temas/signature/banner-01-L.webp ; jeans dobrados em nicho de madeira | temas/signature/banner-02-R.webp ; estação de embalagem premium (caixa, papel de seda, fita) | temas/signature/banner-03-C.webp
 category (square) 6: feminino | masculino | jeans | acessórios | calçados | novidades | temas/signature/cat-01.webp a cat-06.webp
 lookbook (portrait) 4: looks sofisticados em manequim invisível em cenários urbanos vazios | temas/signature/look-01.webp a look-04.webp
 lifestyle (square) 2: camisas dobradas em mesa de exposição | temas/signature/life-01.webp ; sacolas de papel premium alinhadas | temas/signature/life-02.webp
 poster (wide) 1: fachada de loja moderna ao anoitecer, sem pessoas e sem letreiros legíveis | temas/signature/poster-01-C.webp

===================== LOTES (ordem de trabalho) =====================
LOTE 1  Kit casual: todas as tomadas (12 produtos: main + detail; lifestyle nos itens com *)
LOTE 2  Temas grátis: starter, essencial, vitrine, lancamento (todos os slots)
LOTE 3  Kit esportivo: todas as tomadas
LOTE 4  Tema arena
LOTE 5  Kit street + tema ofertas
LOTE 6  Kit infantil + tema pop
LOTE 7  Tema editorial
LOTE 8  Kit luxo + tema noir
LOTE 9  Tema signature
LOTE 10 Refazer o que eu marcar

Comece pelo LOTE 1. Pergunte antes se algo estiver ambíguo; senão, gere.
```

## 3. Depois de gerar (pós-processamento)
1. **Nomes:** exatamente como o GPT informou (`kits/<kit>/<sku>-<tomada>.webp`, `temas/<tema>/<slot>-<nn>-<lado>.webp`). Se o GPT entregar PNG/JPG, converta e mantenha o nome.
2. **Recorte:** produtos para **4:5 (1024×1280)** centralizado; larguras (`hero`, `banner`, `poster`) ficam **1536×1024** (o tema recorta por CSS); quadradas e retrato como saíram.
3. **Formato e peso:** WebP, qualidade 80, **até 250 KB** por imagem (o limite do sistema é 1,5 MB), sem metadados (EXIF).
4. **Conferência humana:** rejeitar (e pedir "refazer <arquivo>: <ajuste>") qualquer imagem com texto legível, logotipo, marca reconhecível, escudo real, rosto, criança, mão deformada, peça com costura impossível ou cor diferente da descrita.
5. **Alt text:** guarde o texto `ALT:` que o GPT informou por imagem (vamos usar na acessibilidade e no SEO).
6. **Direitos:** guarde uma nota de que as imagens foram geradas por IA para uso comercial conforme os termos do provedor na data da geração (reveja os termos do GPT/OpenAI para uso comercial); nenhuma imagem representa marca ou pessoa real.

## 4. O que o sistema fará com as imagens (para a fase T1 do editor)
- Pasta: `public/theme-demo/<tema>/…` e `public/theme-demo/_kits/<kit>/…`.
- **Manifesto** por tema (`theme_demo_manifests`, JSON validado):
```json
{
  "theme": "arena",
  "version": "1.0.0",
  "kit": "esportivo",
  "brand": { "name": "Arena Demo", "tagline": "Vista a paixão" },
  "slots": {
    "hero": [{ "src": "/theme-demo/arena/hero-01-R.webp", "alt": "Estádio vazio ao entardecer, gramado iluminado", "safe": "R" }],
    "banner": [], "category": [], "lookbook": [], "lifestyle": [], "poster": []
  },
  "products": [
    { "sku": "esp-01", "name": "Camisa Atlético Vale Verde I", "priceCents": 18990, "category": "Atlético Vale Verde",
      "images": ["/theme-demo/_kits/esportivo/esp-01-main.webp", "/theme-demo/_kits/esportivo/esp-01-detail.webp", "/theme-demo/_kits/esportivo/esp-01-back.webp"] }
  ]
}
```
- **Usos:** (1) prévia do tema na loja de temas; (2) demonstração navegável `/demo/<tema>`; (3) botão "usar imagens de demonstração" no editor; (4) conteúdo inicial de loja nova (o lojista troca depois); (5) capturas do portal e da régua de qualidade; (6) o `ProductArt` deixa de usar só gradiente quando houver imagem real.
- **Preços de demonstração** e nomes de loja fictícios ficam no manifesto (nunca em código); textos sempre em português.

## 5. Contagem prevista e dicas de produção
- **Produtos:** casual 12, esportivo 12, infantil 12, luxo 10, street 10 = 56 produtos, cerca de 112 tomadas básicas + `back` do esportivo (4) + `lifestyle` dos itens marcados (cerca de 25) ≈ **140 imagens**.
- **Temas:** hero 1 a 3, banners 2 a 3, categorias 4 a 6, lookbook 4 a 6, lifestyle 2, pôster 1 por tema ≈ **150 imagens**.
- **Total ≈ 290 imagens.** Priorize os lotes 1 e 2 (kit casual e os 4 temas gratuitos): já habilitam os 4 gratuitos e o Starter/Essencial/Vitrine/Lançamento completos.
- **Dica de consistência:** no GPT, após aprovar a 1ª imagem de um kit, diga "mantenha exatamente este estilo, luz, fundo e distância nas próximas do kit".
- **Dica de custo/tempo:** gere em lotes menores (8 a 12 imagens por conversa) e recomece o chat com o bloco quando o GPT perder o estilo.
