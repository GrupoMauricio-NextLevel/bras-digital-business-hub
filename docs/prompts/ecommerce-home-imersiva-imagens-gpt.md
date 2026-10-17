# Home imersiva da NextLevel E-commerce: imagens de alto valor e copy (para o GPT)

> Versão 1 (2026-10-17), escrita sobre a marca **NextLevel E-commerce** (D163) e o padrão da Soluções (D162, D164).
> Como usar: cole a **Parte B** uma vez no GPT e depois peça as imagens da **Parte C**, lote por lote.
> Traga cada lote num ZIP chamado "imagens do lote N da e-commerce". A copy (**Parte D**) é a proposta para a página:
> mude o que quiser antes de eu aplicar.
> Destino no sistema: `public/portal/nextlevel-ecommerce/v1/home/`. Eu converto para WebP/AVIF 800/1600 e faço os
> recortes do celular.

---

## Parte A. A ideia: a loja que cresce, contada por uma câmera só

A home de hoje é uma sequência de seções. A nova home conta **uma história**: a mesma pessoa, no mesmo cantinho de
trabalho, da primeira peça fotografada até a operação andando sozinha. Ao rolar, a foto muda e o texto acompanha (o mesmo
efeito da jornada da Soluções).

O que faz estas fotos valerem caro:

1. **Mesmo lugar, mesmo ângulo, cinco momentos.** O ateliê/estoque de uma pequena marca brasileira de moda. A câmera não
   se mexe; o que muda é o momento do negócio. Se o ângulo mudar, o efeito se perde.
2. **A marca entra como luz.** Fotografia sóbria (marinho, gelo, madeira clara, papel kraft, tecido) com **um único ponto
   de luz** azul → ciano (brilho da tela, fita de LED na prateleira). Conversa com o Prisma da logo sem desenhar a logo.
3. **Gente de verdade vendendo de verdade.** Dono ou dona de marca pequena, equipe de uma ou duas pessoas. Nada de
   escritório corporativo, nada de gente posando com celular.
4. **Espaço para o texto.** O lado indicado em cada pedido fica calmo e mais escuro.

Enquanto as fotos não chegam, a página continua como está no ar. Cada lote entregue liga uma parte da nova home.

## Parte B. Prompt mestre (cole primeiro, uma vez)

```
Você é diretor de fotografia e diretor de arte de uma campanha de alto padrão para a NextLevel E-commerce, plataforma
brasileira de lojas virtuais para pequenas marcas, principalmente de moda. Vamos produzir uma série de imagens para a
página principal. Todas precisam parecer UMA ÚNICA PRODUÇÃO: mesma equipe, mesmo lugar, mesma luz, mesmo tratamento.

BÍBLIA VISUAL (vale para todas as imagens):
1. Fotografia editorial realista, câmera de médio formato, lente 50 mm, f/2.8, grão fino de filme, nitidez natural.
   Nunca ilustração, render 3D, vetor ou aparência de banco de imagens.
2. Lugar: ateliê-estoque de uma pequena marca de moda brasileira, num sobrado ou sala comercial. Paredes gelo (#F3F6FC),
   uma parede de destaque em marinho profundo (#101A33), prateleiras de madeira clara com peças dobradas, arara com
   roupas, mesa grande de madeira, caixas e sacolas de papel kraft sem marca, plantas reais. Janela grande à ESQUERDA.
3. Luz: dia natural pela janela + UM ÚNICO ponto de luz da marca por imagem, em degradê azul (#3F65FF) → ciano (#27C7F2):
   brilho de tela, fita de LED na prateleira ou luz de estúdio de fotografia de produto. Pele com tom quente e natural.
4. Pessoas brasileiras reais e diversas (idade, cor, corpo). Personagem principal: dona ou dono da marca, 28 a 45 anos,
   roupa simples e bem cuidada (marinho, cinza, branco, cru). Concentrados no que fazem, sem olhar para a câmera, sem
   pose de propaganda. Mãos anatomicamente corretas.
5. PROIBIDO: qualquer texto, letra, número, logotipo, marca de terceiros (inclusive de redes sociais, bancos ou
   transportadoras) ou a letra "N" desenhada em qualquer superfície. Telas mostram interface ABSTRATA: blocos, fotos de
   produto, cartões, gráficos sem números.
6. PROIBIDO: verde, amarelo, roxo, neon espalhado, dinheiro em espécie, troféu, seta subindo, gráfico explodindo,
   caminhão, caixa com logotipo.
7. Composição: o lado do texto (indicado em cada pedido) fica calmo e mais escuro; assunto principal do outro lado.
8. Tratamento de cor único em toda a série: sombras levemente azuladas, brancos limpos, contraste médio.

ENTREGA: gere no tamanho pedido (1536x1024 paisagem, 1024x1536 retrato ou 1024x1024 quadrado) e diga o NOME DO ARQUIVO.
Quando eu pedir "variação retrato", recomponha a MESMA cena em 1024x1536 com o assunto no terço de baixo.
Responda só "Bíblia registrada" e aguarde o primeiro pedido.
```

## Parte C. Pedidos, por lote

### Lote 1: a loja que cresce (o coração da página) · 5 paisagem + 5 retrato

Paisagem 1536x1024, lado do texto: **direita**. Depois de cada uma, peça a "variação retrato" (nome com `-retrato`).
Mesmo ângulo nas cinco: janela à esquerda, mesa de madeira no centro, prateleira ao fundo, luminária visível.

| Arquivo | Momento | O que mostrar |
|---|---|---|
| `ec-jornada-1-produto.png` | Fotografar | a dona fotografando uma peça num pequeno fundo infinito branco sobre a mesa, celular no tripé, luz de estúdio azulada |
| `ec-jornada-2-loja.png` | Montar a loja | a mesma mesa, notebook aberto mostrando uma vitrine abstrata com fotos de roupas, peças ao lado, café |
| `ec-jornada-3-pedido.png` | Primeira venda | celular sobre a mesa acendendo com uma notificação abstrata (sem texto), a dona sorrindo de leve, separando a peça |
| `ec-jornada-4-envio.png` | Embalar e enviar | peça dobrada em papel de seda, sacola kraft sem marca, etiqueta em branco, mãos fechando a caixa |
| `ec-jornada-5-rotina.png` | Operação andando | duas pessoas: uma embala, outra no notebook com o painel abstrato; mais caixas prontas na prateleira; fim de tarde |

### Lote 2: as quatro portas · 4 imagens 1024x1536 (lado do texto: **embaixo**)

| Arquivo | Porta | O que mostrar |
|---|---|---|
| `ec-porta-zero.png` | Quero começar do zero | mãos abrindo a primeira caixa de peças novas sobre a mesa; notebook fechado ao lado |
| `ec-porta-instagram.png` | Já vendo pelo Instagram e WhatsApp | celular na mão com conversa abstrata (balões sem texto), peças penduradas na arara ao fundo |
| `ec-porta-migrar.png` | Quero sair de outra plataforma | notebook com duas janelas abstratas lado a lado, a pessoa organizando fotos impressas de produtos |
| `ec-porta-fisica.png` | Tenho loja física | balcão de uma pequena loja de rua com araras; tablet no balcão mostrando a vitrine abstrata |

### Lote 3: temas, decisão e fecho · 4 imagens 1536x1024 (lado do texto: **esquerda**)

| Arquivo | Uso | O que mostrar |
|---|---|---|
| `ec-temas.png` | Seção de temas | notebook, tablet e celular sobre a mesa com a MESMA vitrine em três estilos diferentes; amostras de tecido |
| `ec-planos.png` | Seção de planos | a dona com caderno e calculadora sem números visíveis, notebook aberto, expressão tranquila de quem decidiu |
| `ec-entrar.png` | Tela de entrada e cadastro (lado da foto) | o ateliê à noite, só a luz azul da tela acesa sobre a mesa, arara em silhueta |
| `ec-fecho.png` | Chamada final | prateleira cheia de sacolas kraft prontas, luz da tarde, fita de LED azul-ciano discreta |

### Conferência antes de mandar (2 minutos por lote)

- [ ] Nenhuma letra, número, logotipo ou "N" desenhado (amplie telas, sacolas, etiquetas e roupas).
- [ ] Jornada: o **mesmo ângulo** nas cinco.
- [ ] Um único ponto de luz azul-ciano; nenhum verde ou amarelo.
- [ ] Mãos com cinco dedos, rostos naturais, ninguém posando.
- [ ] Lado do texto calmo. Nome do arquivo exato.

## Parte D. Copy proposta (só o que o sistema já faz)

Regra: convencer pelo que é verdade e verificável. Sem número inventado, sem depoimento, sem promessa de faturamento.
Cada frase abaixo corresponde a algo que já existe no produto.

| Seção | Texto |
|---|---|
| Topo | **A loja da sua marca, pronta para vender.** · Escolha um tema, ajuste no editor e receba por Pix e cartão direto na sua conta. Pedidos da loja, do WhatsApp e do Instagram no mesmo painel. · *Começar 3 dias grátis* · *Ver lojas de exemplo* |
| Jornada | **Da primeira foto à rotina de pedidos.** · Role a página: cada passo mostra o que a plataforma faz por você. |
| 1. Fotografar | **Cadastre como você vende.** Produtos com variações de tamanho e cor, estoque e categorias, sem limite de cadastro. |
| 2. Montar | **Sua vitrine em minutos.** Tema gratuito, editor visual com prévia ao vivo e domínio próprio. |
| 3. Vender | **O pagamento cai na sua conta.** Pix e cartão pelo Mercado Pago da sua loja; a NextLevel não segura o seu dinheiro. |
| 4. Enviar | **Pedido organizado do pagamento à entrega.** Etiqueta, rastreio e mensagem pronta para o cliente no WhatsApp. |
| 5. Rotina | **Uma operação que cabe no seu dia.** Pós-venda, cupons, campanhas, avaliações e equipe com acesso próprio. |
| Portas | **Por onde você começa?** · Começar do zero · Já vendo pelo Instagram e WhatsApp · Sair de outra plataforma · Tenho loja física |
| Temas | **Temas que vendem pela primeira impressão.** · Abra a loja de demonstração e navegue antes de escolher. |
| Planos | **Preço claro, sem fidelidade.** · Comece com dias grátis e escolha mensal ou anual. |
| Fecho | **Sua marca merece uma loja à altura.** · *Começar 3 dias grátis* |

Cada porta leva ao cadastro com o caminho já marcado (o mesmo princípio da seleção da Soluções, que preenche o
diagnóstico). Antes de publicar, confiro com você os textos de prazo e preço que vêm do Master.
