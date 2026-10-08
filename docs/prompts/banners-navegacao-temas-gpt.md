# Banners que organizam a navegação das lojas: prompt para o gerador de imagens do GPT

> **Entregue em 2026-10 (versão enxuta):** o dono gerou **6 imagens por loja** (36 no total), sem texto embutido: `<loja>__hero-<campanha>__desktop.png` e `__mobile.png` (destaque da 1ª campanha do pacote) e quatro `<loja>__atalho-<categoria>.png`. Cartões, cupom, faixa, camadas e sequência ficaram de fora de propósito. Importação: `npx tsx scripts/importar-banners.ts <pastas>`; onde cada imagem aparece: `src/lib/themes/banners-demo.ts` (destaque responsivo; atalhos na grade de categorias e no banner de cada categoria; recortes do destaque e dos atalhos nas faixas, apoios, mosaico e cupom). As posições abaixo sem arquivo continuam com as cores do tema ou somem, nunca com imagem quebrada.

> Para usar no gerador de imagens do GPT. Cole primeiro a **Parte A** (regras gerais) uma vez na conversa e, depois, peça os banners **um por vez**, copiando o bloco de cada imagem da **Parte B**.
> A **Parte C** é para o desenvolvimento do sistema; não precisa colar no GPT.
>
> Seis lojas de exemplo, uma por família de temas. Cada família tem quatro níveis de tema:
>
> | Família | Loja de exemplo | N1 (grátis) | N2 (R$ 149) | N3 (R$ 299*) | N4 (R$ 999) |
> |---|---|---|---|---|---|
> | Moda | Trama Urbana | Trama | Lume | Editorial (*R$ 699) | Atelier |
> | Sport | Linha de Jogo | Lance | Torcida | Arena | Pódio |
> | Casa | Casa em Ordem | Lar | Ninho | Varanda | Morada |
> | Beauty | Bela Essência | Pétala | Brilho | Aura | Musa |
> | Conecta | Ponto Conecta | Sinal | Pulso | Circuito | Órbita |
> | Atacado | Giro Distribuidora | Fardo | Lote | Galpão | Porto |
>
> Quanto mais caro o tema, mais banners ele usa, mais moderna é a forma como a imagem se comporta e mais alto o nível do texto.

---

## Parte A: regras gerais (cole uma vez no GPT)

```
Você vai criar banners fotográficos para lojas virtuais brasileiras de exemplo. Regras para TODAS as imagens desta conversa:

1. Fotografia realista de produto e de ambiente, com direção de arte de revista (não ilustração, não 3D de plástico, não colagem).
2. NUNCA escreva texto, letras, números, preços, logotipos, marcas, selos, escudos de clubes ou marcas-d'água dentro da imagem. O texto do banner é escrito pelo site por cima, numa área livre que eu vou indicar.
3. Deixe a ÁREA LIVRE indicada em cada pedido realmente limpa: fundo simples, sem objetos importantes e com contraste uniforme, para o texto ficar legível.
4. Pessoas: sem rosto reconhecível (de costas, de perfil, recortadas na altura do queixo, mãos e corpo em movimento). Diversidade brasileira real. Nada de celebridades.
5. Produtos genéricos, sem marca visível, coerentes com a categoria pedida.
6. Use só as cores da paleta da loja que eu informar; o destaque aparece em poucos pontos.
7. Luz e ângulo iguais em todas as imagens da mesma loja, para parecerem uma campanha só.
8. Composição pensada para recorte: mantenha o assunto principal na faixa central da imagem, com folga nas bordas, porque o site recorta para formatos mais largos (21:9) e para o celular.
9. Quando eu pedir "RECORTE", entregue PNG com fundo transparente, só o objeto, bordas limpas, sombra suave própria e a mesma luz da cena principal.
10. Sem exagero de saturação, sem brilho artificial, sem efeito "IA": texturas reais, imperfeições naturais, profundidade de campo de lente fotográfica.
```

### Tamanhos (o GPT gera em três formatos; o sistema recorta e otimiza depois)

| Pedido no GPT | Use para | O sistema entrega no site |
|---|---|---|
| **Paisagem 1536 × 1024** | hero do computador, faixas, cabeçalhos de categoria, banners de apoio | 21:9 (2400 × 1029), 4:1 (2400 × 600) ou 4:3 (1600 × 1200) |
| **Retrato 1024 × 1536** | hero do celular, cartões de navegação, mosaico grande | 4:5 (1080 × 1350) |
| **Quadrado 1024 × 1024** | atalhos de categoria, mosaico pequeno, cupom de primeira compra | 1:1 (1200 × 1200) |

**Como salvar:** baixe em PNG com o nome indicado em cada bloco (ex.: `trama-urbana__hero-lancamento__desktop.png`). Depois junte tudo de uma loja numa pasta com o nome da loja, compacte em ZIP e me envie. Eu converto para WebP e AVIF, recorto nos formatos certos e ligo cada imagem ao lugar dela no tema.

---

## Por que esses banners e onde eles aumentam a conversão

Cada banner tem um trabalho: responder uma dúvida do cliente no momento em que ela aparece. Banner que só enfeita não entra.

| # | Banner | Onde fica | Dúvida que resolve | Por que vende mais |
|---|---|---|---|---|
| 1 | **Hero** (destaque principal) | primeira dobra da home | "Que loja é essa e por que eu fico?" | Nos primeiros 3 segundos define se a pessoa rola ou sai. Uma mensagem, um botão. No celular é uma imagem própria, vertical, nunca o banner largo espremido. |
| 2 | **Atalhos de categoria** | logo abaixo do hero | "Onde está o que eu procuro?" | Tira cliques do caminho; no celular substitui o menu escondido. É o banner que mais gera clique depois do hero. |
| 3 | **Cartões de navegação** (Novidades, Ofertas, Mais vendidos, Kits/Presentes) | depois da primeira vitrine de produtos | "Tem algo novo? Tem promoção?" | Ensina o cliente a usar a loja: mostra que existem ofertas e novidades e leva direto para a lista certa. |
| 4 | **Faixa de benefícios** (só texto) | topo do site e abaixo do hero | "Frete? Parcela? Troca? Pix tem desconto?" | Derruba as objeções antes do carrinho. Não precisa de imagem: o sistema escreve. |
| 5 | **Dois banners de apoio** | meio da home | "O que mais combina comigo?" | Divide públicos ou ocasiões (ex.: dia a dia × ocasião especial) e abre dois caminhos de compra. |
| 6 | **Faixa de campanha** | entre duas vitrines | "Vale a pena comprar agora?" | Reativa quem já rolou bastante, com urgência real (fim de coleção, oferta com data). |
| 7 | **Cabeçalho de categoria** | topo de cada página de categoria | "Estou no lugar certo?" | Confirma onde a pessoa está e mostra a oferta daquela categoria. Reduz saída da página de lista. |
| 8 | **Cupom de primeira compra** | janela de boas-vindas e rodapé da home | "Tem vantagem para eu comprar pela primeira vez?" | Captura o contato de quem ainda não decidiu e dá um motivo para a primeira compra. |
| 9 | **Mosaico e galeria** (N3 e N4) | meio da home | "Como isso fica no dia a dia?" | Mostra o produto em uso; aumenta o desejo e o tíquete com "compre o conjunto". |
| 10 | **Hero moderno em camadas** (N3) e **hero imersivo** (N4) | primeira dobra | (o mesmo do hero) | A imagem reage à rolagem e ao mouse: o produto vem para frente e o fundo se move mais devagar. Dá sensação de marca grande e prende a atenção. |

Banners de **texto** que o sistema escreve sem imagem (não peça ao GPT): faixa de benefícios do topo, aviso de frete grátis no carrinho ("faltam R$ 40 para o frete grátis"), selos de confiança perto do botão Comprar, guia de tamanhos, busca sem resultado com atalho para os mais vendidos.

### O que cada nível usa

| Banner | N1 (grátis) | N2 | N3 | N4 |
|---|---|---|---|---|
| Hero | 1 imagem fixa | carrossel de 3 slides | **hero moderno em camadas** + 2 slides de campanha | **hero imersivo** (camadas + sequência de rolagem) + campanha agendada |
| Atalhos de categoria | 4 | 4 | 4 | 4 |
| Cartões de navegação | — | 2 (Novidades, Ofertas) | 4 | 4 |
| Dois banners de apoio | 2 | 2 | 2 | 2 |
| Faixa de campanha | 1 | 1 | 1 | 1 (+ versão agendada) |
| Cabeçalho de categoria | — | — | 4 | 4 |
| Cupom de primeira compra | — | 1 | 1 | 1 |
| Mosaico / galeria | — | — | já pedidos no manifesto da família | já pedidos no manifesto da família |

### Escada do texto (copy) por nível

O texto não vai dentro da imagem: está em cada bloco abaixo para o sistema escrever por cima. Regras para todos os níveis: português claro, sem promessa que a loja não cumpre, sem número inventado ("o mais vendido do Brasil", "milhares de clientes"). Valores de oferta são exemplos que o lojista troca no editor.

- **N1 (grátis): direto.** Título curto com o benefício, um botão. Ex.: "Básicos para todo dia" · **Ver camisetas**.
- **N2 (R$ 149): benefício com motivo.** Chamada + linha de apoio que tira uma dúvida (preço, frete, parcela). Ex.: "Básicos que duram" / "Algodão encorpado, 6x sem juros" · **Comprar básicos**.
- **N3 (R$ 299): editorial e sensorial.** Linha de chamada pequena acima do título, título com imagem mental, apoio que conta o porquê, dois botões (comprar e explorar). Ex.: NOVA COLEÇÃO · "O tecido que acompanha o seu dia" / "Algodão penteado que não deforma depois da lavagem" · **Comprar agora** · Ver a coleção.
- **N4 (R$ 999): voz de marca.** Narrativa curta em sequência (cada slide continua o anterior), microtexto de confiança junto do botão, palavra de destaque no título, texto diferente para o celular (mais curto). Ex.: TEMPORADA 01 · "Feito para a *cidade* que não para" / "Peças em camadas que vão do café ao fim do dia. Troca fácil em 30 dias." · **Montar meu look** · Ver lookbook · microtexto: "Frete grátis acima de R$ 299".

---

## Parte B: os pedidos de imagem, loja por loja

Formato de cada bloco: **nome do arquivo**, formato no GPT, níveis que usam, a cena (o que colar no GPT) e o texto que o sistema escreve por cima, por nível.

> Moda (Trama Urbana) e Sport (Linha de Jogo) já têm as três campanhas de hero, os banners de apoio e as categorias. Para essas duas, gere só o que está marcado **NOVO**.

---

### B1. Moda · Trama Urbana

**Direção de arte (cole antes dos pedidos desta loja):**
```
Loja: Trama Urbana (moda urbana brasileira, básicos de qualidade). Paleta: areia #E9DFD0, navy #1F2A44, terracota #B5562F, off-white #F7F4EE. Luz natural de fim de tarde, quente e lateral. Cenários: rua de concreto aparente, escadarias, muro de cal, apartamento com piso de taco. Texturas de algodão, linho e sarja. Modelos de costas, de perfil ou recortados no queixo, poses em movimento natural.
```

**Hero (N1 a N4 usam; já existe para as 3 campanhas).** Texto por nível para as campanhas existentes:

| Campanha | N1 | N2 | N3 | N4 |
|---|---|---|---|---|
| lançamento | "Essenciais da cidade" · **Ver novidades** | "Essenciais da cidade" / "Peças em algodão para o dia todo" · **Comprar** | NOVA COLEÇÃO · "Essenciais que aguentam o ritmo da cidade" / "Algodão penteado, caimento reto, cores que combinam entre si" · **Comprar agora** · Ver coleção | TEMPORADA 01 · "Feito para a *cidade* que não para" / "Do café ao fim do dia, sem trocar de roupa" · **Montar meu look** · Ver lookbook · "Troca fácil em 30 dias" |
| coleção | — | "Texturas que acompanham você" · **Ver coleção** | TEXTURAS · "Linho, sarja e algodão: sinta a diferença" / "Tecidos naturais que respiram no calor" · **Comprar** · Saber mais | CAPÍTULO 02 · "A textura é o *detalhe* que todo mundo nota" / "Tecidos naturais escolhidos peça por peça" · **Explorar texturas** · "Parcele em até 6x" |
| seleção | — | "Seu próximo conjunto começa aqui" · **Montar conjunto** | CONJUNTOS · "Duas peças, zero dúvida" / "Combinações prontas para não errar" · **Ver conjuntos** · Ver tudo | CAPÍTULO 03 · "Monte uma vez, *use* a semana toda" / "Conjuntos que se misturam entre si" · **Montar meu conjunto** · "Frete grátis acima de R$ 299" |

**NOVO · Hero moderno em camadas (N3 · Editorial)**
- `trama-urbana__hero-camadas__fundo-desktop.png` · Paisagem · *Cena:* "Rua de concreto aparente em fim de tarde, muro de cal com sombra diagonal de janela, chão de cimento queimado. SEM pessoas e SEM roupas: só o cenário. Terço esquerdo com parede lisa e clara (área livre para texto). Luz quente lateral vinda da direita."
- `trama-urbana__hero-camadas__fundo-mobile.png` · Retrato · mesma cena recomposta na vertical; metade de cima limpa (área de texto).
- `trama-urbana__hero-camadas__recorte.png` · Quadrado · RECORTE · *Cena:* "Modelo de costas, recortada nos ombros para baixo, vestindo overshirt navy aberta sobre camiseta areia e calça wide areia, passo em movimento. Fundo transparente. Luz quente vinda da direita, igual à do cenário."
- Texto (N3): EDITORIAL · "O *básico* que virou assinatura" / "Camadas leves para o calor da cidade" · **Comprar a coleção** · Ver lookbook.

**NOVO · Hero imersivo (N4 · Atelier)**: fundo, recorte e primeiro plano se movem em velocidades diferentes; a sequência vira uma animação conforme a pessoa rola.
- `trama-urbana__hero-imersivo__fundo-desktop.png` · Paisagem · "Escadaria de concreto ao entardecer vista de baixo, céu limpo alaranjado, sem pessoas. Metade esquerda com céu liso (área de texto)."
- `trama-urbana__hero-imersivo__fundo-mobile.png` · Retrato · mesma cena; terço de cima com céu liso.
- `trama-urbana__hero-imersivo__recorte.png` · Retrato · RECORTE · "Modelo de perfil subindo um degrau, recortada no queixo, jaqueta em camadas areia sobre conjunto terracota. Fundo transparente."
- `trama-urbana__hero-imersivo__primeiro-plano.png` · Paisagem · RECORTE · "Tecido de linho areia esvoaçando na borda inferior direita, desfocado como se estivesse perto da lente. Fundo transparente."
- `trama-urbana__hero-imersivo__seq-1.png`, `__seq-2.png`, `__seq-3.png` · Paisagem · "Mesma escadaria e mesma modelo dos pedidos acima, câmera fixa; quadro 1: modelo no primeiro degrau; quadro 2: no meio; quadro 3: no topo, olhando para o horizonte. Luz, cor e enquadramento idênticos entre os três."
- Texto (N4), em sequência conforme rola: 1) "Toda cidade tem um *ritmo*." 2) "Toda peça tem um motivo." 3) TEMPORADA 01 · "Vista o seu" · **Montar meu look** · "Troca fácil em 30 dias · 6x sem juros". No celular: "Vista o *seu* ritmo" · **Comprar**.

**NOVO · Cartões de navegação** (Retrato; N2 usa os dois primeiros, N3 e N4 usam os quatro)
- `trama-urbana__nav-novidades.png` · "Arara de roupas novas em ateliê claro, peças areia e navy penduradas em cabides de madeira, uma peça terracota em destaque. Terço inferior com parede lisa (área de texto)."
  - N2: "Novidades" · **Ver o que chegou** · N3: CHEGOU AGORA · "Novidades da semana" · **Ver novidades** · N4: "Acabou de *chegar*" / "Peças novas toda semana" · **Ver primeiro**
- `trama-urbana__nav-ofertas.png` · "Pilha organizada de camisetas dobradas em tons areia e navy sobre mesa de madeira clara, luz lateral. Terço inferior livre."
  - N2: "Ofertas" · **Ver ofertas** · N3: PREÇO ESPECIAL · "Básicos com desconto" · **Aproveitar** · N4: "Últimas *peças* da temporada" / "Quando acabar, não volta" · **Ver ofertas**
- `trama-urbana__nav-mais-vendidos.png` · "Camisa de textura natural pendurada sozinha num gancho de parede de cal, sombra suave. Terço inferior livre."
  - N3: OS PREFERIDOS · "Os mais vendidos" · **Ver lista** · N4: "As peças que *voltam* para o carrinho" · **Ver favoritas**
- `trama-urbana__nav-presentes.png` · "Caixa de papelão kraft aberta com camiseta dobrada e papel de seda areia, fita de algodão, vista de cima. Terço inferior livre."
  - N3: PARA PRESENTEAR · "Presentes até R$ 150" · **Escolher presente** · N4: "Presente que *acerta* o tamanho" / "Troca fácil se não servir" · **Escolher presente**

**NOVO · Cabeçalhos de categoria** (Paisagem; N3 e N4). Faixa baixa: assunto à direita, metade esquerda lisa.
- `trama-urbana__cat-basicos.png` · "Camisetas lisas em areia, navy e off-white dobradas em degradê sobre fundo de cal." · N3: "Básicos" / "Algodão que não deforma" · N4: "Básicos que viram *assinatura*"
- `trama-urbana__cat-calcas.png` · "Calças de sarja e wide penduradas em barra de metal, close nos tecidos." · N3: "Calças" / "Do corte reto ao wide" · N4: "O *caimento* certo para cada dia"
- `trama-urbana__cat-camisas.png` · "Camisa azul horizonte em cabide de madeira contra parede de cal, luz de janela." · N3: "Camisas" / "Textura natural, toque leve" · N4: "Camisas que *respiram* com você"
- `trama-urbana__cat-conjuntos.png` · "Conjunto terracota dobrado ao lado de conjunto navy, vista de cima sobre linho." · N3: "Conjuntos" / "Duas peças, zero dúvida" · N4: "Monte uma vez, use a *semana*"

**NOVO · Cupom de primeira compra** (Quadrado; N2 a N4)
- `trama-urbana__cupom.png` · "Sacola de papel kraft com camiseta areia aparecendo, apoiada em banco de concreto ao entardecer. Metade superior lisa."
  - N2: "10% na primeira compra" · **Quero meu cupom** · N3: BOAS-VINDAS · "Sua primeira peça com 10% off" / "Cadastre o e-mail e receba o cupom" · **Receber cupom** · N4: "Comece pela *peça* que você mais vai usar" / "10% na primeira compra" · **Receber meu cupom** · "Sem spam. Cancele quando quiser."

---

### B2. Sport · Linha de Jogo

**Direção de arte:**
```
Loja: Linha de Jogo (artigos esportivos genéricos, sem clubes nem marcas). Paleta: grafite #17191F, laranja #F26932, off-white #F2F0EB. Luz de refletor de quadra à noite, contraste alto, recortes de luz duros. Cenários: quadra de society com grama sintética, quadra poliesportiva, vestiário de concreto, arquibancada vazia. Camisas sem escudo, sem número de clube, sem patrocinador. Atletas de costas ou recortados, movimento congelado, suor e textura reais.
```

**Hero (já existe para as 3 campanhas).** Texto por nível:

| Campanha | N1 | N2 | N3 | N4 |
|---|---|---|---|---|
| essenciais | "Prepare o próximo jogo" · **Ver camisas** | "Prepare o próximo jogo" / "Tecido leve que seca rápido" · **Comprar** | PRÉ-JOGO · "Tudo pronto antes do apito" / "Camisas, meias e garrafa no mesmo pedido" · **Montar meu kit** · Ver camisas | TEMPORADA NOVA · "O jogo começa no *vestiário*" / "Equipamento que acompanha cada lance" · **Montar meu kit** · "Troca de tamanho grátis" |
| movimento | — | "Seu ritmo, sua escolha" · **Ver treino** | TREINO · "Cada treino conta" / "Peças que acompanham o movimento" · **Comprar treino** · Ver tudo | "O *ritmo* é seu. O conforto, nosso." / "Tecido que respira do aquecimento ao último tiro" · **Treinar agora** · "6x sem juros" |
| equipados | — | "Tudo pronto para entrar em campo" · **Ver acessórios** | EQUIPADOS · "Do aquecimento ao último minuto" / "Bola, cones e mochila para o seu time" · **Equipar o time** · Ver acessórios | "Entre em campo *completo*" / "Monte o kit do time num pedido só" · **Equipar meu time** · "Frete grátis acima de R$ 299" |

**NOVO · Hero moderno em camadas (N3 · Arena)**
- `linha-de-jogo__hero-camadas__fundo-desktop.png` · Paisagem · "Quadra de society à noite, grama sintética com marcação branca, refletores criando cones de luz e névoa leve, sem pessoas. Metade esquerda escura e lisa (área de texto)."
- `linha-de-jogo__hero-camadas__fundo-mobile.png` · Retrato · mesma cena; terço de cima escuro e liso.
- `linha-de-jogo__hero-camadas__recorte.png` · Quadrado · RECORTE · "Bola geométrica laranja e grafite girando no ar, leve borrão de movimento nas costuras, com a luz dura do refletor vinda de cima. Fundo transparente."
- Texto (N3): ARENA · "A bola vem até *você*" / "Equipamento para quem joga toda semana" · **Comprar agora** · Ver lançamentos.

**NOVO · Hero imersivo (N4 · Pódio)**
- `linha-de-jogo__hero-imersivo__fundo-desktop.png` · Paisagem · "Arquibancada de concreto vazia vista do campo, refletores acesos, céu noturno, sem pessoas. Metade esquerda escura."
- `linha-de-jogo__hero-imersivo__fundo-mobile.png` · Retrato · mesma cena.
- `linha-de-jogo__hero-imersivo__recorte.png` · Retrato · RECORTE · "Atleta de costas em salto de comemoração, camisa grafite lisa com detalhes laranja, sem número e sem escudo, recortado acima da cintura. Fundo transparente."
- `linha-de-jogo__hero-imersivo__primeiro-plano.png` · Paisagem · RECORTE · "Partículas de grama sintética e gotas de água voando na borda inferior, desfocadas. Fundo transparente."
- `linha-de-jogo__hero-imersivo__seq-1/2/3.png` · Paisagem · "Mesmo atleta e mesma arquibancada, câmera fixa: 1) agachado amarrando a chuteira; 2) correndo para o campo; 3) no salto de comemoração. Luz idêntica."
- Texto (N4) em sequência: 1) "Antes do jogo, a *preparação*." 2) "Durante, a entrega." 3) PÓDIO · "Depois, a história" · **Montar meu kit** · "Troca de tamanho grátis · 6x sem juros". Celular: "Jogue *completo*" · **Comprar**.

**NOVO · Cartões de navegação** (Retrato)
- `linha-de-jogo__nav-novidades.png` · "Camisa grafite nova dobrada sobre banco de vestiário, luz dura de cima, terço inferior escuro e liso." · N2: "Lançamentos" · **Ver** · N3: ACABOU DE CHEGAR · "Lançamentos da temporada" · **Ver lançamentos** · N4: "Nova *temporada* em campo" · **Ver primeiro**
- `linha-de-jogo__nav-ofertas.png` · "Cones laranja enfileirados na grama sintética, perspectiva profunda, terço inferior livre." · N2: "Ofertas" · **Ver ofertas** · N3: PREÇO DE TREINO · "Ofertas da semana" · **Aproveitar** · N4: "Equipe-se *antes* do apito final" / "Ofertas até domingo" · **Ver ofertas**
- `linha-de-jogo__nav-mais-vendidos.png` · "Bola geométrica parada sobre a marca do pênalti, refletor ao fundo." · N3: "Mais vendidos" · **Ver lista** · N4: "Os *titulares* da loja" · **Ver os favoritos**
- `linha-de-jogo__nav-kits.png` · "Mochila de vestiário aberta com camisa, meias e garrafa arrumadas, vista de cima sobre concreto." · N3: COMPRE JUNTO · "Kits para o time" · **Montar kit** · N4: "O time *inteiro* num pedido só" · **Montar kit**

**NOVO · Cabeçalhos de categoria** (Paisagem; N3 e N4)
- `linha-de-jogo__cat-camisas.png` · "Três camisas lisas grafite, laranja e off-white penduradas em vestiário." · N3: "Camisas" / "Tecido leve, secagem rápida" · N4: "Camisas para *suar* sem pesar"
- `linha-de-jogo__cat-treino.png` · "Corda de pular e cones sobre piso de quadra poliesportiva." · N3: "Treino" / "Do aquecimento ao tiro final" · N4: "Treino que *rende*"
- `linha-de-jogo__cat-vestuario.png` · "Jaqueta pré-jogo e calça de movimento dobradas em banco de vestiário." · N3: "Vestuário" / "Antes e depois do jogo" · N4: "Do *aquecimento* à resenha"
- `linha-de-jogo__cat-acessorios.png` · "Garrafa, meias e bola arrumadas sobre a grama sintética." · N3: "Acessórios" / "O que falta na mochila" · N4: "Nada *esquecido* no vestiário"

**NOVO · Cupom de primeira compra** (Quadrado)
- `linha-de-jogo__cupom.png` · "Chuteira genérica sem marca apoiada na linha lateral do campo à noite, metade superior escura e lisa." · N2: "10% na primeira compra" · **Quero o cupom** · N3: BEM-VINDO AO TIME · "10% off no seu primeiro pedido" · **Receber cupom** · N4: "Seu *primeiro* jogo com a gente tem vantagem" / "10% na primeira compra" · **Entrar para o time** · "Sem spam."

---

### B3. Casa · Casa em Ordem

**Direção de arte:**
```
Loja: Casa em Ordem (utilidades, decoração e organização). Paleta: grafite quente #3A3835, caramelo #B89468, creme #F5F1E8, verde-oliva suave como apoio. Luz da manhã entrando por janela lateral, sombras macias. Cenários: cozinha de madeira clara, sala com sofá de linho, lavanderia organizada, varanda com plantas. Materiais: cerâmica fosca, madeira clara, palha, vidro, linho. Mãos em ação (servindo, organizando, dobrando), sem rosto.
```

**Hero (NOVO para todas as campanhas)**
- `casa-em-ordem__hero-acolher__desktop.png` · Paisagem · "Mesa de café da manhã em madeira clara com vaso curvo de cerâmica, jarra de vidro e manta de tricô no banco, luz de manhã. Metade esquerda com parede creme lisa." · `__mobile.png` · Retrato · mesma cena, metade de cima lisa.
- `casa-em-ordem__hero-organizar__desktop.png` · Paisagem · "Despensa aberta com potes de vidro iguais alinhados, cestos de palha e caixas modulares, tudo em ordem. Metade esquerda com parede lisa." · `__mobile.png` · Retrato.
- `casa-em-ordem__hero-cotidiano__desktop.png` · Paisagem · "Sala com sofá de linho, almofadas texturizadas e bandeja natural com vela acesa sobre mesa de centro, fim de tarde. Metade esquerda livre." · `__mobile.png` · Retrato.
- `casa-em-ordem__hero-sazonal__desktop.png` · Paisagem · (N4, campanha agendada) "Mesa posta para almoço de domingo com toalha de linho, louça cerâmica e ramos verdes, vista de cima a 45 graus. Metade esquerda livre." · `__mobile.png` · Retrato.

| Campanha | N1 | N2 | N3 | N4 |
|---|---|---|---|---|
| acolher | "Detalhes que acolhem" · **Ver decoração** | "Detalhes que acolhem" / "Peças para deixar a casa com a sua cara" · **Comprar** | DECORAÇÃO · "A casa fica pronta nos detalhes" / "Cerâmica, linho e madeira que combinam entre si" · **Ver decoração** · Ver ambientes | "Casa é onde o *dia* desacelera" / "Peças escolhidas para durar e combinar" · **Decorar agora** · "Frete grátis acima de R$ 199" |
| organizar | — | "Mais espaço para o seu dia" · **Ver organização** | ORGANIZAÇÃO · "Cada coisa no seu lugar" / "Potes, cestos e caixas que se encaixam" · **Organizar agora** · Ver tudo | "Organizar é dar *tempo* para o que importa" / "Sistemas modulares que crescem com a casa" · **Começar pela despensa** · "6x sem juros" |
| cotidiano | — | "Sua casa, do seu jeito" · **Ver tudo** | DIA A DIA · "Conforto que se vê e se sente" / "Mantas, almofadas e toalhas macias" · **Comprar têxteis** · Ver ambientes | "O *aconchego* mora nos tecidos" / "Toque macio, lavagem fácil" · **Escolher meus tecidos** · "Troca fácil em 30 dias" |
| sazonal (N4) | — | — | — | MESA DE DOMINGO · "Receba com *calma*" / "Tudo para a mesa posta, num pedido só" · **Montar minha mesa** · "Entrega antes do fim de semana para pedidos até quarta" (só se for verdade na loja) |

**Hero moderno em camadas (N3 · Varanda)**
- `casa-em-ordem__hero-camadas__fundo-desktop.png` · Paisagem · "Varanda com piso de cerâmica, plantas em vasos e cadeira de palha, manhã, sem pessoas. Terço esquerdo com parede creme lisa." · `__fundo-mobile.png` · Retrato.
- `casa-em-ordem__hero-camadas__recorte.png` · Quadrado · RECORTE · "Vaso curvo de cerâmica caramelo com ramo de oliveira, sombra suave própria. Fundo transparente."
- Texto (N3): VARANDA · "Traga a *luz* da manhã para dentro" / "Cerâmica feita para durar" · **Comprar decoração** · Ver ambientes.

**Hero imersivo (N4 · Morada)**
- `casa-em-ordem__hero-imersivo__fundo-desktop.png` · Paisagem · "Sala ampla de pé-direito alto com janela grande, luz da manhã, sem pessoas. Metade esquerda com parede lisa." · `__fundo-mobile.png` · Retrato.
- `casa-em-ordem__hero-imersivo__recorte.png` · Retrato · RECORTE · "Bandeja natural com vela acesa, xícara de cerâmica e livro fechado. Fundo transparente."
- `casa-em-ordem__hero-imersivo__primeiro-plano.png` · Paisagem · RECORTE · "Cortina de linho translúcida entrando pela borda direita, desfocada. Fundo transparente."
- `casa-em-ordem__hero-imersivo__seq-1/2/3.png` · Paisagem · "Mesma sala, câmera fixa: 1) sala vazia; 2) manta sobre o sofá e almofadas; 3) mesa de centro posta com bandeja e vela acesa. Luz idêntica."
- Texto (N4) em sequência: 1) "Uma casa vazia é só *espaço*." 2) "Os detalhes fazem dela um lugar." 3) MORADA · "Faça da sua um *lar*" · **Decorar agora** · "Troca fácil em 30 dias · 6x sem juros". Celular: "Sua casa, *seu* lugar" · **Comprar**.

**Atalhos de categoria** (Quadrado; já existem 3, falta 1; gere os 4 se quiser padronizar)
- `casa-em-ordem__atalho-cozinha.png` · "Kit de utensílios de madeira em pote de cerâmica sobre bancada clara."
- `casa-em-ordem__atalho-decoracao.png` · "Vaso curvo e vela sobre aparador de madeira."
- `casa-em-ordem__atalho-organizacao.png` · "Caixas modulares e cestos de palha em prateleira."
- `casa-em-ordem__atalho-texteis.png` · "Toalhas dobradas e manta enrolada em cesto de palha."
- Texto (todos os níveis): nome da categoria; N4 acrescenta uma linha curta ("Cozinha · para cozinhar com calma").

**Cartões de navegação** (Retrato)
- `casa-em-ordem__nav-novidades.png` · "Prateleira com peças novas de cerâmica e palha, uma caramelo em destaque. Terço inferior livre." · N2: "Novidades" · **Ver** · N3: CHEGOU · "Novidades para a casa" · **Ver novidades** · N4: "Peças *novas* para cantos antigos" · **Ver primeiro**
- `casa-em-ordem__nav-ofertas.png` · "Pilha de potes de vidro com tampa de madeira em bancada. Terço inferior livre." · N2: "Ofertas" · **Aproveitar** · N3: PREÇO ESPECIAL · "Organização com desconto" · **Ver ofertas** · N4: "Organize *mais*, gaste menos" / "Ofertas por tempo limitado" · **Ver ofertas**
- `casa-em-ordem__nav-mais-vendidos.png` · "Manta de tricô caramelo dobrada sobre sofá de linho." · N3: "Mais vendidos" · **Ver lista** · N4: "As peças que *todo mundo* pergunta onde comprou" · **Ver favoritos**
- `casa-em-ordem__nav-presentes.png` · "Caixa de presente kraft aberta com vela, xícara e papel de seda creme." · N3: "Presentes para casa" · **Escolher** · N4: "Presente que *fica* na casa de quem você gosta" · **Escolher presente**

**Cabeçalhos de categoria** (Paisagem; N3 e N4): mesmas cenas dos atalhos, em faixa larga, assunto à direita, metade esquerda lisa. Arquivos `casa-em-ordem__cat-cozinha.png`, `__cat-decoracao.png`, `__cat-organizacao.png`, `__cat-texteis.png`. Texto N3: "Cozinha / Para cozinhar com calma", "Decoração / Detalhes que acolhem", "Organização / Cada coisa no seu lugar", "Têxteis / Toque macio, lavagem fácil". N4: "Cozinha com *calma*", "O *detalhe* que acolhe", "Espaço para o que *importa*", "*Aconchego* que se toca".

**Dois banners de apoio** (Paisagem; todos os níveis)
- `casa-em-ordem__apoio-1.png` · "Cozinha clara com potes e utensílios organizados, mãos guardando um pote. Terço inferior livre." · N1: "Cozinha" · **Ver** · N2+: "Cozinha organizada" / "Potes e utensílios que combinam" · **Comprar**
- `casa-em-ordem__apoio-2.png` · "Quarto com cama arrumada, manta e almofadas texturizadas. Terço inferior livre." · N1: "Têxteis" · **Ver** · N2+: "Quarto aconchegante" / "Mantas e almofadas macias" · **Comprar**

**Faixa de campanha** (Paisagem; todos os níveis)
- `casa-em-ordem__faixa.png` · "Faixa baixa: bancada de madeira com fileira de potes de vidro, vista frontal, centro-direita; esquerda lisa." · N1: "Organização com desconto" · **Ver** · N2: "Semana da organização" / "Potes e caixas com preço especial" · **Aproveitar** · N3: SÓ ESTA SEMANA · "Semana da organização" / "Até domingo ou enquanto durar o estoque" · **Ver ofertas** · N4: "Uma semana para colocar a casa em *ordem*" / "Ofertas até domingo" · **Começar agora**

**Cupom de primeira compra** (Quadrado)
- `casa-em-ordem__cupom.png` · "Xícara de café sobre bandeja natural, luz da manhã, metade de cima lisa." · N2: "10% na primeira compra" · **Quero o cupom** · N3: BOAS-VINDAS · "Sua casa merece começar bem: 10% off" · **Receber cupom** · N4: "O primeiro *detalhe* é por nossa conta" / "10% na primeira compra" · **Receber meu cupom** · "Sem spam."

---

### B4. Beauty · Bela Essência

**Direção de arte:**
```
Loja: Bela Essência (acessórios de beleza: pincéis, esponjas, nécessaires, organizadores, frascos vazios e espelhos; sem cosméticos com fórmula e sem promessa de resultado na pele). Paleta: ameixa #382839, dourado rosado #B99368, nude #F7F0EA, rosa-chá como apoio. Luz suave e difusa de estúdio, brilho delicado em vidro e metal. Cenários: penteadeira de mármore claro, bancada de banheiro com azulejo, tecido de seda, reflexos em espelho redondo. Mãos com unhas naturais em ação, sem rosto.
```

**Hero (NOVO para todas as campanhas)**
- `bela-essencia__hero-ritual__desktop.png` · Paisagem · "Penteadeira de mármore claro com pincéis em porta-pincéis, espelho redondo dourado refletindo luz difusa, seda nude ao lado. Metade esquerda lisa." · `__mobile.png` · Retrato.
- `bela-essencia__hero-organizar__desktop.png` · Paisagem · "Organizador de acrílico cristal com pincéis, esponjas e frascos vazios em ordem, bancada clara. Metade esquerda lisa." · `__mobile.png` · Retrato.
- `bela-essencia__hero-detalhes__desktop.png` · Paisagem · "Close de mãos segurando pincel nuvem sobre seda ameixa, luz suave lateral. Metade esquerda lisa." · `__mobile.png` · Retrato.
- `bela-essencia__hero-sazonal__desktop.png` · Paisagem · (N4) "Nécessaire de presente aberta com fita de cetim dourado rosado e papel de seda nude, vista de cima." · `__mobile.png` · Retrato.

| Campanha | N1 | N2 | N3 | N4 |
|---|---|---|---|---|
| ritual | "Seu ritual, sua essência" · **Ver pincéis** | "Seu ritual, sua essência" / "Pincéis macios para o dia a dia" · **Comprar** | RITUAL · "Os minutos que são só seus" / "Pincéis de cerdas macias que não soltam pelo" · **Montar meu ritual** · Ver coleção | "Beleza começa no *cuidado* com o próprio tempo" / "Ferramentas escolhidas uma a uma" · **Montar meu ritual** · "Troca fácil em 30 dias" |
| organizar | — | "Beleza também é organização" · **Ver organizadores** | ORGANIZAÇÃO · "Tudo à vista, nada perdido" / "Organizadores de acrílico e porta-pincéis" · **Organizar** · Ver tudo | "Uma penteadeira em ordem é um dia *mais leve*" · **Organizar a minha** · "6x sem juros" |
| detalhes | — | "Detalhes para o seu espaço" · **Ver acessórios** | DETALHES · "O acabamento que faz diferença" / "Espelhos, frascos e faixas para o seu espaço" · **Ver acessórios** · Ver tudo | "O *detalhe* é o que fica na memória" · **Escolher os meus** · "Frete grátis acima de R$ 199" |
| sazonal (N4) | — | — | — | PARA PRESENTEAR · "Um presente que vira *ritual*" / "Kits prontos com embalagem de presente" · **Escolher presente** · "Troca fácil se não agradar" |

**Hero moderno em camadas (N3 · Aura)**
- `bela-essencia__hero-camadas__fundo-desktop.png` · Paisagem · "Superfície de mármore claro com reflexo de luz difusa e seda nude ao fundo, sem objetos. Metade esquerda lisa." · `__fundo-mobile.png` · Retrato.
- `bela-essencia__hero-camadas__recorte.png` · Quadrado · RECORTE · "Pincel nuvem de cerdas fofas e cabo dourado rosado em leve inclinação. Fundo transparente."
- Texto (N3): AURA · "A maciez que você *sente* no primeiro toque" / "Cerdas sintéticas que não soltam pelo" · **Comprar pincéis** · Ver coleção.

**Hero imersivo (N4 · Musa)**
- `bela-essencia__hero-imersivo__fundo-desktop.png` · Paisagem · "Penteadeira ampla em mármore e espelho redondo, luz dourada difusa, sem objetos no centro. Metade esquerda lisa." · `__fundo-mobile.png` · Retrato.
- `bela-essencia__hero-imersivo__recorte.png` · Retrato · RECORTE · "Kit de três pincéis e esponja gota em porta-pincéis de vidro. Fundo transparente."
- `bela-essencia__hero-imersivo__primeiro-plano.png` · Paisagem · RECORTE · "Pétalas de rosa-chá e fio de seda caindo na borda inferior, desfocados. Fundo transparente."
- `bela-essencia__hero-imersivo__seq-1/2/3.png` · Paisagem · "Mesma penteadeira, câmera fixa: 1) vazia com luz da manhã; 2) mãos colocando o porta-pincéis; 3) penteadeira completa e organizada. Luz idêntica."
- Texto (N4) em sequência: 1) "Todo ritual começa num *espaço*." 2) "E nas ferramentas certas." 3) MUSA · "O seu, do *seu* jeito" · **Montar meu ritual** · "Troca fácil em 30 dias · 6x sem juros". Celular: "Seu ritual, *sua* essência" · **Comprar**.

**Atalhos de categoria** (Quadrado; todos os níveis)
- `bela-essencia__atalho-pinceis.png` · "Pincéis em leque sobre seda nude." · `__atalho-organizacao.png` · "Organizador cristal com itens em ordem." · `__atalho-embalagens.png` · "Frascos e potes vazios de vidro em fileira." · `__atalho-acessorios.png` · "Espelho aurora, faixa e rolo sobre mármore."
- Texto: nome da categoria; N4 acrescenta linha curta ("Pincéis · toque macio").

**Cartões de navegação** (Retrato)
- `bela-essencia__nav-novidades.png` · "Porta-pincéis novo de vidro com pincéis dourado rosado, terço inferior liso." · N2: "Novidades" · N3: CHEGOU · "Novidades do ritual" · N4: "O que acabou de *chegar* à penteadeira"
- `bela-essencia__nav-ofertas.png` · "Esponjas gota em tons nude enfileiradas sobre mármore." · N2: "Ofertas" · N3: PREÇO ESPECIAL · "Ofertas da semana" · N4: "Cuidar de si com *preço* gentil" / "Ofertas até domingo"
- `bela-essencia__nav-mais-vendidos.png` · "Pincel nuvem sozinho sobre seda ameixa." · N3: "Mais vendidos" · N4: "O pincel que *ninguém* devolve"
- `bela-essencia__nav-kits.png` · "Nécessaire ritual aberta com kit essenciais." · N3: "Kits prontos" · N4: "Um kit, um *ritual* completo"
- Botões: N2 **Ver** · N3 **Ver lista** · N4 **Ver primeiro** / **Escolher kit**.

**Cabeçalhos de categoria** (Paisagem; N3 e N4): mesmas cenas dos atalhos, faixa larga, assunto à direita. Arquivos `bela-essencia__cat-pinceis.png`, `__cat-organizacao.png`, `__cat-embalagens.png`, `__cat-acessorios.png`. Texto N3: "Pincéis / Cerdas macias que não soltam", "Organização / Tudo à vista", "Embalagens / Para levar o seu ritual", "Acessórios / O acabamento que faz diferença". N4: "Maciez no *primeiro* toque", "Penteadeira em *ordem*", "Seu ritual, *onde* for", "O *detalhe* que fica".

**Dois banners de apoio** (Paisagem)
- `bela-essencia__apoio-1.png` · "Mãos aplicando com esponja gota sobre o dorso da mão, luz suave." · N1: "Esponjas" · N2+: "Acabamento uniforme" / "Esponjas macias que não absorvem demais" · **Comprar**
- `bela-essencia__apoio-2.png` · "Nécessaire ritual dentro de uma bolsa de viagem aberta." · N1: "Nécessaires" · N2+: "Seu ritual na bolsa" / "Nécessaires que cabem tudo" · **Comprar**

**Faixa de campanha** (Paisagem)
- `bela-essencia__faixa.png` · "Faixa baixa: fileira de pincéis sobre seda nude, centro-direita; esquerda lisa." · N1: "Pincéis com desconto" · N2: "Semana do pincel" / "Preço especial em toda a linha" · N3: SÓ ESTA SEMANA · "Semana do pincel" / "Até domingo ou enquanto durar" · N4: "Sete dias para renovar o seu *ritual*" · **Ver ofertas**

**Cupom de primeira compra** (Quadrado)
- `bela-essencia__cupom.png` · "Espelho redondo dourado refletindo luz suave sobre mármore, metade de cima lisa." · N2: "10% na primeira compra" · N3: BOAS-VINDAS · "10% off para começar o seu ritual" · N4: "O primeiro *cuidado* é nosso" / "10% na primeira compra" · "Sem spam."

---

### B5. Conecta · Ponto Conecta

**Direção de arte:**
```
Loja: Ponto Conecta (acessórios de tecnologia genéricos: fones, caixas de som, mouse, teclado, suportes, cabos, hubs). Sem logotipos, sem telas com interface de marca (telas apagadas ou com fundo abstrato). Paleta: azul petróleo #172B3B, ciano #38A9C0, cinza claro #EEF2F4, branco. Luz fria e limpa de mesa de trabalho, com reflexo ciano suave de LED. Cenários: home office minimalista, mesa de madeira clara, café, mochila de deslocamento, transporte público. Mãos em uso, sem rosto.
```

**Hero (NOVO para todas as campanhas)**
- `ponto-conecta__hero-mesa__desktop.png` · Paisagem · "Mesa de home office minimalista com notebook fechado, suporte eleva, teclado compacto, mouse e hub, luz fria da manhã. Metade esquerda com parede cinza clara lisa." · `__mobile.png` · Retrato.
- `ponto-conecta__hero-audio__desktop.png` · Paisagem · "Fone orbit sobre a mesa ao lado de caixa pulse, reflexo ciano suave, fundo azul petróleo desfocado. Metade esquerda escura e lisa." · `__mobile.png` · Retrato.
- `ponto-conecta__hero-rotina__desktop.png` · Paisagem · "Pessoa de costas em plataforma de metrô com fone duo e bolsa tech, fim de tarde, desfoque de movimento ao fundo. Metade esquerda lisa." · `__mobile.png` · Retrato.
- `ponto-conecta__hero-sazonal__desktop.png` · Paisagem · (N4) "Kit de acessórios em caixa de presente cinza com papel de seda ciano, vista de cima." · `__mobile.png` · Retrato.

| Campanha | N1 | N2 | N3 | N4 |
|---|---|---|---|---|
| mesa | "Conecte seu espaço" · **Ver mesa** | "Conecte seu espaço" / "Suportes, hubs e teclados para trabalhar melhor" · **Comprar** | HOME OFFICE · "Uma mesa que trabalha com você" / "Postura melhor, cabos no lugar" · **Montar minha mesa** · Ver tudo | "Menos cabo, mais *foco*" / "Acessórios que organizam o seu dia de trabalho" · **Montar minha mesa** · "Garantia de 90 dias" (só se a loja oferecer) |
| áudio | — | "O seu próximo ritmo" · **Ver áudio** | ÁUDIO · "O som que acompanha você" / "Fones e caixas sem fio" · **Ouvir agora** · Ver tudo | "Seu dia tem *trilha* sonora" · **Escolher meu fone** · "6x sem juros" |
| rotina | — | "Pronto para acompanhar você" · **Ver mobilidade** | MOBILIDADE · "Da casa ao trabalho, conectado" / "Cabos, adaptadores e bolsas para levar" · **Comprar** · Ver tudo | "*Carregado* para o dia inteiro" · **Montar meu kit** · "Frete grátis acima de R$ 199" |
| sazonal (N4) | — | — | — | PARA PRESENTEAR · "Tecnologia que *cabe* no presente" / "Kits prontos em caixa de presente" · **Escolher presente** · "Troca fácil em 30 dias" |

**Hero moderno em camadas (N3 · Circuito)**
- `ponto-conecta__hero-camadas__fundo-desktop.png` · Paisagem · "Mesa de madeira clara vazia contra parede azul petróleo com faixa de luz ciano suave, sem objetos. Metade esquerda lisa." · `__fundo-mobile.png` · Retrato.
- `ponto-conecta__hero-camadas__recorte.png` · Quadrado · RECORTE · "Fone orbit em leve rotação, almofadas macias, reflexo ciano na borda. Fundo transparente."
- Texto (N3): CIRCUITO · "Desligue o *barulho*, ligue o foco" / "Fones confortáveis para o dia inteiro" · **Comprar fones** · Ver áudio.

**Hero imersivo (N4 · Órbita)**
- `ponto-conecta__hero-imersivo__fundo-desktop.png` · Paisagem · "Home office à noite com luz ciano suave atrás da mesa, sem objetos no centro. Metade esquerda escura." · `__fundo-mobile.png` · Retrato.
- `ponto-conecta__hero-imersivo__recorte.png` · Retrato · RECORTE · "Conjunto: teclado compacto, mouse navega e fone orbit flutuando em camadas, levemente separados. Fundo transparente."
- `ponto-conecta__hero-imersivo__primeiro-plano.png` · Paisagem · RECORTE · "Cabo trançado em curva na borda inferior, desfocado. Fundo transparente."
- `ponto-conecta__hero-imersivo__seq-1/2/3.png` · Paisagem · "Mesma mesa, câmera fixa: 1) mesa vazia; 2) cabos e hub conectados; 3) mesa completa com fone, teclado e luz ciano acesa. Luz idêntica."
- Texto (N4) em sequência: 1) "Toda ideia precisa de um *ponto* de partida." 2) "Uma mesa que conecta." 3) ÓRBITA · "Tudo no *seu* alcance" · **Montar minha mesa** · "Troca fácil em 30 dias · 6x sem juros". Celular: "Conecte o *seu* dia" · **Comprar**.

**Atalhos de categoria** (Quadrado)
- `ponto-conecta__atalho-audio.png` · "Fone e caixa de som sobre fundo cinza claro." · `__atalho-mesa.png` · "Teclado e mouse sobre mesa clara." · `__atalho-mobilidade.png` · "Bolsa tech aberta com cabos e adaptador." · `__atalho-conexoes.png` · "Hub e cabos trançados organizados."
- Texto: nome da categoria; N4 acrescenta linha curta ("Áudio · som sem fio").

**Cartões de navegação** (Retrato)
- `ponto-conecta__nav-novidades.png` · "Caixa pulse nova sobre pedestal claro com reflexo ciano." · N2: "Lançamentos" · N3: ACABOU DE CHEGAR · "Lançamentos" · N4: "O que há de *novo* na sua mesa"
- `ponto-conecta__nav-ofertas.png` · "Cabos trançados enrolados em fileira sobre fundo azul petróleo." · N2: "Ofertas" · N3: PREÇO ESPECIAL · "Ofertas da semana" · N4: "*Upgrade* com preço de ocasião" / "Ofertas até domingo"
- `ponto-conecta__nav-mais-vendidos.png` · "Mouse navega sozinho sobre mesa, luz lateral." · N3: "Mais vendidos" · N4: "Os *favoritos* de quem trabalha de casa"
- `ponto-conecta__nav-kits.png` · "Kit home office: suporte, teclado e mouse arrumados em vista de cima." · N3: "Kits home office" · N4: "A mesa *inteira* num pedido só"
- Botões: N2 **Ver** · N3 **Ver lista** · N4 **Ver primeiro** / **Montar kit**.

**Cabeçalhos de categoria** (Paisagem; N3 e N4): mesmas cenas dos atalhos, faixa larga. Arquivos `ponto-conecta__cat-audio.png`, `__cat-mesa.png`, `__cat-mobilidade.png`, `__cat-conexoes.png`. Texto N3: "Áudio / Som sem fio", "Mesa / Postura e foco", "Mobilidade / Para levar", "Conexões / Tudo ligado". N4: "Seu dia tem *trilha*", "Menos cabo, mais *foco*", "*Carregado* o dia todo", "Tudo *conectado*".

**Dois banners de apoio** (Paisagem)
- `ponto-conecta__apoio-1.png` · "Suporte eleva com notebook na altura dos olhos, mãos digitando." · N1: "Suportes" · N2+: "Postura melhor" / "Suportes para notebook e celular" · **Comprar**
- `ponto-conecta__apoio-2.png` · "Fone duo pendurado na alça da mochila, rua ao fundo desfocada." · N1: "Fones" · N2+: "Som na rua" / "Fones leves para o trajeto" · **Comprar**

**Faixa de campanha** (Paisagem)
- `ponto-conecta__faixa.png` · "Faixa baixa: fileira de cabos e adaptadores sobre fundo azul petróleo, centro-direita; esquerda lisa." · N1: "Cabos com desconto" · N2: "Semana da conexão" / "Cabos e adaptadores com preço especial" · N3: SÓ ESTA SEMANA · "Semana da conexão" / "Até domingo ou enquanto durar" · N4: "Sete dias para *desembaraçar* sua mesa" · **Ver ofertas**

**Cupom de primeira compra** (Quadrado)
- `ponto-conecta__cupom.png` · "Caixa de som pulse sobre mesa clara com luz ciano, metade de cima lisa." · N2: "10% na primeira compra" · N3: BOAS-VINDAS · "10% off na sua primeira conexão" · N4: "Sua *primeira* conexão com a gente tem vantagem" / "10% na primeira compra" · "Sem spam."

---

### B6. Atacado · Giro Distribuidora

**Contexto:** loja de **atacado de caixa fechada** (importadores e distribuidores como os do Brás e do Canindé), vendendo para lojistas, revendedores e distribuidores de todo o Brasil. Quem compra é profissional: quer **preço por volume, quantidade por caixa, pedido mínimo, prazo de despacho e confiança**. Os banners educam sobre **como comprar no atacado**, e não sobre estilo de vida.

**Direção de arte:**
```
Loja: Giro Distribuidora (atacado de caixa fechada: têxteis, utilidades, papelaria e acessórios, em kits e caixas). Paleta: grafite #28282C, vermelho tijolo #B84638, kraft #F4EEE4, branco. Luz clara e uniforme de galpão com claraboias, leve luz quente lateral. Cenários: galpão organizado com estantes porta-palete, caixas de papelão kraft fechadas e empilhadas, fita adesiva, etiquetas em branco (sem texto), paletes de madeira, bancada de conferência, área de expedição. Pessoas de costas ou recortadas, de colete e luvas, conferindo e embalando. Sem logotipos nas caixas.
```

**Hero (NOVO para todas as campanhas)**
- `giro-distribuidora__hero-mix__desktop.png` · Paisagem · "Corredor de galpão com estantes porta-palete cheias de caixas kraft fechadas, perspectiva profunda, claraboias. Metade esquerda com parede grafite lisa." · `__mobile.png` · Retrato.
- `giro-distribuidora__hero-organizar__desktop.png` · Paisagem · "Bancada de conferência com caixas abertas mostrando kits de utilidades organizados em fileiras, mãos de luva conferindo. Metade esquerda lisa." · `__mobile.png` · Retrato.
- `giro-distribuidora__hero-essenciais__desktop.png` · Paisagem · "Palete com caixas kraft empilhadas e filmadas, pronto para expedição, doca de carga ao fundo. Metade esquerda lisa." · `__mobile.png` · Retrato.
- `giro-distribuidora__hero-sazonal__desktop.png` · Paisagem · (N4) "Caixas kraft com papel de seda vermelho tijolo saindo pela tampa, kits de presente organizados, clima de reposição para datas comemorativas." · `__mobile.png` · Retrato.

| Campanha | N1 | N2 | N3 | N4 |
|---|---|---|---|---|
| mix | "Atacado de caixa fechada" · **Ver produtos** | "Abasteça sua loja" / "Caixa fechada com preço de atacado" · **Ver catálogo** | ATACADO · "Seu estoque, direto do distribuidor" / "Caixas fechadas, preço por volume, envio para todo o Brasil" · **Ver catálogo** · Como comprar | DISTRIBUIDOR · "O *giro* da sua loja começa aqui" / "Mix de têxteis, utilidades e papelaria em caixa fechada" · **Montar meu pedido** · "Pedido mínimo R$ 500 · CNPJ ou CPF" (valores de exemplo) |
| organizar | — | "Sua seleção, bem organizada" · **Ver utilidades** | KITS · "Kits prontos para revenda" / "Quantidade por caixa informada em cada produto" · **Ver kits** · Ver tabela | "Compre por *caixa*, venda por unidade" / "Kits conferidos e embalados para revenda" · **Ver kits prontos** · "Nota fiscal em todos os pedidos" (só se for verdade) |
| essenciais | — | "Essenciais para o seu catálogo" · **Ver seleção** | REPOSIÇÃO · "O que mais sai, sempre em estoque" / "Itens de reposição com despacho rápido" · **Repor estoque** · Ver mais vendidos | "Reposição *sem* surpresa" / "Despacho em até 2 dias úteis após o pagamento" (só se for verdade) · **Repor agora** · "Frete para todo o Brasil" |
| sazonal (N4) | — | — | — | DATAS COMEMORATIVAS · "Estoque *pronto* antes da data" / "Garanta as caixas com antecedência" · **Reservar meu pedido** · "Pague no Pix ou boleto" (o que a loja aceitar) |

**Hero moderno em camadas (N3 · Galpão)**
- `giro-distribuidora__hero-camadas__fundo-desktop.png` · Paisagem · "Galpão amplo e organizado, estantes ao fundo desfocadas, piso de concreto polido, claraboias. Metade esquerda com parede grafite lisa, sem caixas no centro." · `__fundo-mobile.png` · Retrato.
- `giro-distribuidora__hero-camadas__recorte.png` · Quadrado · RECORTE · "Pilha de três caixas kraft fechadas com fita, uma levemente aberta mostrando kits de camisetas dobradas. Fundo transparente."
- Texto (N3): GALPÃO · "A *caixa* certa para a sua prateleira" / "Preço por volume e envio para todo o Brasil" · **Ver catálogo** · Como comprar no atacado.

**Hero imersivo (N4 · Porto)**
- `giro-distribuidora__hero-imersivo__fundo-desktop.png` · Paisagem · "Doca de carga de galpão ao entardecer, portão aberto com luz entrando, sem caminhões com marca. Metade esquerda escura." · `__fundo-mobile.png` · Retrato.
- `giro-distribuidora__hero-imersivo__recorte.png` · Retrato · RECORTE · "Palete com caixas kraft empilhadas e filmadas, visto em três quartos. Fundo transparente."
- `giro-distribuidora__hero-imersivo__primeiro-plano.png` · Paisagem · RECORTE · "Rolo de fita adesiva e ponta de filme stretch na borda inferior, desfocados. Fundo transparente."
- `giro-distribuidora__hero-imersivo__seq-1/2/3.png` · Paisagem · "Mesmo galpão, câmera fixa: 1) caixas sendo separadas na estante; 2) caixas conferidas na bancada; 3) palete fechado na doca, pronto para sair. Luz idêntica."
- Texto (N4) em sequência: 1) "Separado." 2) "Conferido." 3) PORTO · "*Despachado* para a sua loja" / "Do nosso galpão para qualquer lugar do Brasil" · **Montar meu pedido** · "Pedido mínimo R$ 500 · Pix ou boleto" (exemplo). Celular: "Atacado que *gira*" · **Ver catálogo**.

**Atalhos de categoria** (Quadrado)
- `giro-distribuidora__atalho-texteis.png` · "Caixa aberta com kits de camisetas e meias dobradas." · `__atalho-utilidades.png` · "Caixa aberta com potes, copos e garrafas em fileiras." · `__atalho-papelaria.png` · "Caixa aberta com cadernos, canetas e pastas." · `__atalho-acessorios.png` · "Caixa aberta com nécessaires e bolsas dobráveis."
- Texto: nome da categoria + "caixa fechada" (N3 e N4 acrescentam: "Têxteis · a partir de 12 unidades", com quantidade de exemplo).

**Cartões de navegação para atacado** (Retrato): no atacado, os cartões educam sobre **como comprar**.
- `giro-distribuidora__nav-como-comprar.png` · "Mãos com luva apontando para caixa aberta na bancada, prancheta ao lado (sem texto legível)." · N2: "Como comprar no atacado" · **Entender** · N3: PRIMEIRA VEZ? · "Como funciona a compra por caixa" / "Pedido mínimo, quantidades e prazos" · **Ver o passo a passo** · N4: "Comprar no atacado é *simples*" / "Três passos: escolha as caixas, pague e receba" · **Ver como funciona**
- `giro-distribuidora__nav-ofertas.png` · "Pilha de caixas kraft com etiquetas vermelho tijolo em branco." · N2: "Ofertas por volume" · **Ver ofertas** · N3: PREÇO POR VOLUME · "Quanto mais caixas, menor o preço" · **Ver tabela** · N4: "O preço *cai* conforme o seu pedido cresce" · **Ver faixas de preço**
- `giro-distribuidora__nav-novidades.png` · "Caixa recém-chegada sendo aberta com estilete, kits novos aparecendo." · N3: CHEGOU NO GALPÃO · "Novidades para revenda" · **Ver novidades** · N4: "*Primeiro* no seu catálogo, primeiro na sua vitrine" · **Ver primeiro**
- `giro-distribuidora__nav-mais-vendidos.png` · "Estante com a mesma caixa repetida várias vezes, reposição constante." · N3: GIRO RÁPIDO · "Os que mais saem" · **Ver lista** · N4: "Os itens que *giram* mais rápido nas lojas" · **Repor estes**

**Cabeçalhos de categoria** (Paisagem; N3 e N4): mesmas cenas dos atalhos, faixa larga. Arquivos `giro-distribuidora__cat-texteis.png`, `__cat-utilidades.png`, `__cat-papelaria.png`, `__cat-acessorios.png`. Texto N3: "Têxteis / Caixa fechada, preço por volume", "Utilidades / Kits prontos para revenda", "Papelaria / Reposição de volta às aulas e escritório", "Acessórios / Itens de alto giro". N4: "Têxteis que *giram*", "Utilidades para *abastecer*", "Papelaria o ano *inteiro*", "Acessórios de *alto* giro".

**Dois banners de apoio** (Paisagem)
- `giro-distribuidora__apoio-1.png` · "Lojista de costas recebendo caixas na porta de uma loja de bairro." · N1: "Para lojistas" · N2+: "Para a sua loja" / "Caixas pensadas para revenda" · **Ver catálogo**
- `giro-distribuidora__apoio-2.png` · "Pilha de paletes sendo carregada em doca, visão lateral." · N1: "Para distribuidores" · N2+: "Para distribuidores" / "Volumes maiores com condição especial" · **Falar com vendas**

**Faixa de campanha** (Paisagem)
- `giro-distribuidora__faixa.png` · "Faixa baixa: fileira de caixas kraft fechadas em estante, centro-direita; esquerda grafite lisa." · N1: "Preço por volume" · N2: "Semana do estoque" / "Condição especial em caixas fechadas" · N3: SÓ ESTA SEMANA · "Semana do estoque" / "Até sexta ou enquanto houver caixas" · N4: "Abasteça *antes* da alta temporada" / "Condição especial até sexta" · **Montar meu pedido**

**Primeiro pedido** (Quadrado): no atacado não é cupom de varejo; é condição para o primeiro pedido.
- `giro-distribuidora__cupom.png` · "Caixa kraft fechada com laço de fita vermelho tijolo sobre palete, metade de cima lisa." · N2: "Condição especial no primeiro pedido" · **Cadastrar minha loja** · N3: NOVO CLIENTE · "Primeiro pedido com frete reduzido" / "Cadastre sua loja e receba a tabela" (exemplo) · **Receber tabela** · N4: "Sua loja *abastecida* desde o primeiro pedido" / "Cadastre o CNPJ e receba a tabela de preços" · **Quero a tabela** · "Atendimento por WhatsApp em horário comercial" (se houver)

---

## Checklist antes de me enviar

- [ ] Nenhuma imagem tem letra, número, logotipo ou marca.
- [ ] A área livre de cada imagem está mesmo limpa.
- [ ] Os RECORTES estão com fundo transparente (PNG) e a mesma luz da cena.
- [ ] Os três quadros da sequência (seq-1, seq-2, seq-3) têm o mesmo enquadramento.
- [ ] Os nomes dos arquivos estão iguais aos deste documento.
- [ ] Uma pasta por loja, compactada em ZIP.

Ordem sugerida, do que mais vende para o que menos vende: **hero (desktop e celular) → atalhos de categoria → cartões de navegação → faixa de campanha → cabeçalhos de categoria → cupom → hero em camadas e hero imersivo.** Comece pelas famílias sem nenhum banner: Casa, Beauty, Conecta e Atacado.

---

## Parte C: para o desenvolvimento (não cole no GPT)

> **Estado (D88):** as peças abaixo já existem no sistema. Para usar as imagens, rode `npx tsx scripts/importar-banners.ts <pasta>` com os arquivos nomeados como neste documento.

O que o sistema já tem e o que precisa ganhar para usar todas essas imagens:

| Peça | Hoje | Precisa |
|---|---|---|
| Hero com 1 imagem / carrossel | existe (`hero-banner`, slides por nível, campanha agendada no N4) | ligar os arquivos `hero-<campanha>__desktop/mobile` aos slots `<família>-hero-1..4` |
| Dois banners de apoio, faixa, mosaico, galeria | existem | ligar `apoio-1/2` e `faixa` aos slots |
| Atalhos de categoria | existe (`category-grid` com imagem por categoria) | ligar `atalho-*` |
| **Hero em camadas (N3)** | não existe | nova seção: fundo + recorte com movimento leve no mouse e na rolagem (parallax), texto à esquerda; sem movimento quando o visitante pede menos animação; imagem do celular própria |
| **Hero imersivo (N4)** | não existe | nova seção: três camadas com velocidades diferentes + sequência de três quadros trocada pela rolagem, com texto que muda a cada quadro; carregamento leve (a primeira dobra funciona só com o fundo) |
| **Cartões de navegação** | parcial (banners de apoio) | seção "Navegue por" com 2 a 4 cartões verticais que levam a Novidades, Ofertas, Mais vendidos e Kits; no atacado, "Como comprar" leva a uma página explicativa |
| **Cabeçalho de categoria** | não existe | faixa no topo da página de categoria, com imagem e texto editáveis por categoria |
| **Cupom de primeira compra** | cupons existem (`coupons`) | janela de boas-vindas com imagem, que entrega o cupom em troca do e-mail; só aparece uma vez por visitante |
| Faixa de benefícios e aviso de frete grátis no carrinho | parcial | texto vindo das configurações da loja (frete, parcelas, desconto no Pix), nunca fixo |

Os textos deste documento viram os textos padrão de cada tema por nível. O lojista troca todos no editor.
