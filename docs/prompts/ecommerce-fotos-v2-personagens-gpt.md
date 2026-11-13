# NextLevel Commerce: novo grupo de fotos com personagens reais e diferentes (para o GPT Imagens)

> Versão 2 (2026-10-17). Substitui as fotos atuais da home imersiva (`lojas.nextlevelgroup.com.br`).
> Como usar: cole a **Parte B** (prompt mestre) uma vez no GPT; depois peça cada imagem da **Parte C**, **uma por vez**,
> colando o bloco daquela imagem. Antes de salvar, passe a **Parte D** (conferência). Traga tudo num ZIP com os nomes
> exatos. Eu converto, confiro de novo e publico.

---

## Parte A. O que deu errado no pacote anterior e o que muda

| Problema | Onde apareceu | Regra nova |
|---|---|---|
| **A mesma personagem em quase tudo** (mesma moça de coque e camisa marinho) | 14 das 18 fotos | **Elenco de 8 pessoas diferentes**, cada uma ligada a um perfil real de cliente. A mesma pessoa só se repete **dentro da jornada** (é a história dela). |
| **Tela do notebook virada para a câmera com a pessoa atrás** (fisicamente impossível: ela estaria olhando para a tampa) | jornada 2, jornada 5, porta "sair de outra plataforma", temas | **Regra da tela** (Parte B, item 6): a tela sempre fica virada para quem usa o aparelho. |
| Mesmo ateliê "bonito de revista" em todas | todas | Cada personagem tem o **seu** lugar real: quarto-escritório, garagem, salinha comercial, loja de rua, sobrado. |
| Luz de fim de tarde alaranjada em tudo | todas | Luz de dia natural; um único ponto de luz azul-ciano discreto (marca). Fim de tarde só na foto da chamada final. |
| Pessoas sempre sorrindo para o nada | portas | Gente concentrada fazendo uma tarefa real e reconhecível. |

### Quem é o público (base: `docs/prompts/publico-personas-precos-ecossistema.md`, A5)

- **Juliana (P3):** 25 a 45 anos, marca própria (moda feminina, fitness, infantil, camisa de time), vende R$ 10 mil a R$ 100 mil por mês entre Instagram, WhatsApp e marketplace. Quer uma loja bonita que tire a marca da dependência do marketplace.
- **Rodrigo (P4):** já tem loja em outra plataforma e quer trocar sem parar de vender.
- **Quem está começando:** primeira marca, pouco capital, vende para amigos e seguidores.
- **Quem tem loja física:** loja de rua ou de bairro que quer vender também pelo site.

As fotos precisam fazer a pessoa pensar **"essa pessoa sou eu"**: Brasil real, gente comum bem fotografada, sem cara de banco de imagem e sem luxo inalcançável.

---

## Parte B. Prompt engenheiro mestre (cole uma vez, no início da conversa)

```
Você é diretor de fotografia, diretor de elenco e diretor de arte de uma campanha publicitária brasileira de alto nível
para a NextLevel Commerce, plataforma de lojas virtuais para pequenas e médias marcas brasileiras (moda, fitness,
infantil, camisa de time, acessórios, beleza). Vamos produzir uma série de fotografias para a página principal do site.
Cada pedido gera UMA imagem, nunca grade, colagem, storyboard ou várias cenas numa imagem.

1. ESTILO FOTOGRÁFICO
- Fotografia editorial documental realista, como uma campanha de marca brasileira fotografada em locação.
- Câmera full frame, lente 35 mm ou 50 mm, f/2.8 a f/4, grão fino, nitidez natural, foco no rosto ou nas mãos da ação.
- Nunca ilustração, render 3D, aparência de banco de imagem, pele de plástico ou brilho artificial.
- Tratamento de cor único na série: brancos limpos, sombras neutras levemente frias, pele com tom natural e quente.

2. LUZ
- Luz de dia natural entrando por uma janela (lado indicado em cada pedido).
- Um único ponto de luz da marca por imagem, discreto, em azul (#3F65FF) a ciano (#27C7F2): brilho de uma tela, fita de
  LED numa prateleira ou luminária. Nunca neon espalhado, nunca luz alaranjada dominante (exceto quando o pedido disser
  "fim de tarde").

3. ELENCO (pessoas reais e diferentes)
- Brasileiros reais e diversos em tom de pele, idade, corpo, cabelo e gênero. Use exatamente a ficha da personagem
  descrita em cada pedido e mantenha o mesmo rosto, cabelo, corpo e roupa sempre que a mesma personagem aparecer de novo.
- Expressões naturais de quem trabalha: concentração, leve satisfação, conversa. Ninguém olha para a câmera. Nada de
  pose de propaganda, polegar para cima ou sorriso forçado.
- Roupas comuns e bem cuidadas, sem logotipo. Maquiagem e cabelo do dia a dia.

4. LUGARES (Brasil real)
- Cada personagem trabalha no SEU lugar, descrito no pedido: quarto que virou escritório, garagem, salinha comercial,
  loja de rua, sobrado. Organizado e fotogênico, mas possível de existir; sem loft de luxo.
- Elementos permitidos: arara com roupas, prateleiras com caixas de papelão kraft SEM marca, mesa de madeira, plantas
  reais, sacolas kraft lisas, papel de seda, fita, celular, notebook, tablet, impressora pequena.

5. PROIBIDO EM TODAS AS IMAGENS
- Qualquer texto legível, letra, número, logotipo, marca (inclusive de redes sociais, bancos, transportadoras,
  computadores e celulares) ou a letra "N" desenhada em qualquer superfície.
- Interfaces com "falso texto": telas mostram apenas blocos de cor, fotos de produto e formas simples, sem letras.
- Verde e amarelo como cor dominante, roxo, dinheiro em espécie, gráfico subindo, troféu, seta, caminhão, ícones
  de coração ou de "curtir" flutuando.

6. REGRA DA TELA (a mais importante: foi o erro da série anterior)
- A tela de notebook, tablet ou celular SEMPRE fica virada para a pessoa que está usando o aparelho.
- Se a pessoa está de frente para a câmera atrás do notebook, a câmera vê a TAMPA (parte de trás) do notebook, nunca a
  tela. Para mostrar a tela, enquadre por cima do ombro da pessoa ou de lado (perfil de 3/4), com a tela visível em
  ângulo e voltada para ela.
- O olhar da pessoa vai na direção da tela que ela usa. Os dedos tocam o teclado ou a tela do lado certo.
- Celular na mão: a tela está virada para o rosto de quem segura (a câmera vê o celular de lado ou por cima do ombro).
- Tablet de balcão virado para o cliente é permitido quando a cena mostra o cliente olhando a tela.

7. ANATOMIA E FÍSICA (reprovação automática se falhar)
- Mãos com cinco dedos, proporções corretas, sem dedos fundidos ou extras. Dois braços e duas pernas por pessoa.
- Objetos apoiados de verdade (nada flutuando), caixas com perspectiva coerente, fita que começa e termina.
- Uma só fonte de luz principal, sombras coerentes com ela. Reflexos coerentes.
- Mesmo objeto não muda de cor ou forma dentro da mesma imagem.

8. COMPOSIÇÃO
- Respeite o "lado do texto" indicado em cada pedido: esse lado fica mais calmo e um pouco mais escuro, sem rosto nem
  objeto importante.
- Paisagem 1536x1024 ou retrato 1024x1536, conforme o pedido. Quando eu pedir a "versão retrato", RECOMPONHA a mesma
  cena em pé (não recorte a paisagem): mesmas pessoas, mesmo lugar, a ação principal no terço de baixo.

9. ANTES DE ENTREGAR CADA IMAGEM
- Responda em até 4 linhas: (a) quem aparece, (b) para onde está virada cada tela da cena e para quem, (c) se há
  algum texto, número ou logotipo visível, (d) se as mãos estão corretas. Se algo violar as regras, gere de novo
  antes de me mostrar.
- Informe o NOME DO ARQUIVO exato do pedido.

Responda apenas "Direção registrada" e aguarde o primeiro pedido.
```

---

## Parte C. Pedidos (um por vez; cole o bloco inteiro de cada imagem)

### Elenco fixo (fichas usadas nos pedidos)

| Ficha | Quem é | Aparência (repetir igual em todos os pedidos dela) | Lugar |
|---|---|---|---|
| **LARISSA** | 31 anos, dona de marca de moda feminina, vende pelo Instagram e agora pela loja | mulher negra de pele retinta, cabelo crespo volumoso preso com lenço terracota, corpo curvilíneo, camisa de linho off-white com mangas dobradas, calça jeans escura, brincos pequenos dourados | sala de um sobrado em Salvador transformada em ateliê: janela grande à esquerda, arara à direita, prateleira de madeira ao fundo, mesa de madeira clara no centro |
| **THIAGO** | 23 anos, começando uma marca de camisetas estampadas | homem pardo, magro, cabelo cacheado curto, barba rala, camiseta cinza lisa, boné virado para trás | garagem da casa dos pais em Guarulhos, com mesa improvisada, prateleira de aço e caixas |
| **PATRÍCIA** | 44 anos, marca de moda fitness, vende pelo WhatsApp e Instagram | mulher branca de cabelo castanho liso na altura do ombro, corpo atlético, regata preta lisa e casaco de moletom aberto | quarto-escritório em Curitiba, com arara de leggings coloridas e tops, ring light DESLIGADO no canto |
| **RODRIGO** | 38 anos, loja de camisas de time numa plataforma que quer trocar | homem branco de cabelo ruivo curto e barba ruiva aparada, óculos de armação fina, camisa polo azul-marinho lisa | salinha comercial em Belo Horizonte com araras de camisas de futebol SEM escudo e SEM números |
| **DONA MARTA** | 58 anos, loja de moda infantil numa rua comercial do interior | mulher parda de cabelo grisalho curto, óculos pendurados no pescoço, blusa estampada discreta, avental de tecido cru | loja de rua em Ribeirão Preto: balcão de madeira, vitrine com roupinhas, porta de vidro à esquerda |
| **BRUNO e ANA** | casal de 28 anos, marca de acessórios e semijoias | Bruno: homem negro de pele clara, cabelo raspado, camisa xadrez aberta sobre camiseta branca. Ana: mulher de traços asiáticos, cabelo preto liso comprido, suéter bege | apartamento pequeno em São Paulo, mesa da sala com bandejas de acessórios |
| **FERNANDA** | 40 anos, marca de cosméticos naturais | mulher indígena brasileira de cabelo preto liso preso em rabo baixo, blusa verde-oliva escura lisa | bancada de um laboratório caseiro limpo em Belém, frascos âmbar SEM rótulo |
| **EQUIPE DA LARISSA** | duas pessoas que entram no passo 5 | **Kauê**, 26, homem negro de pele média, tranças curtas, avental cinza; **Sueli**, 50, mulher branca de cabelo loiro curto, óculos, cardigã marinho | mesmo ateliê da Larissa |

### Lote 1: a jornada da Larissa (5 paisagens + 5 retratos)

Paisagem 1536x1024, **lado do texto: direita**. Mesma câmera nas cinco: tripé na altura dos olhos de quem está sentado, a
**1,8 m da mesa, em diagonal de 3/4 pela frente-esquerda**; janela à esquerda, arara à direita, prateleira ao fundo.
Depois de cada uma peça "versão retrato" (1024x1536, mesmo ângulo, ação no terço de baixo), nome com `-retrato`.

```
ec-jornada-1-produto.png — 1536x1024 — lado do texto: direita — personagem: LARISSA (ficha completa)
Larissa fotografa uma blusa de linho estendida sobre um fundo de papel branco em cima da mesa. Ela segura o celular com
as duas mãos, a tela virada para o próprio rosto, enquadrando a peça de cima. Um refletor pequeno com luz fria à
esquerda. Concentrada, sem olhar para a câmera.
```
```
ec-jornada-2-loja.png — 1536x1024 — lado do texto: direita — personagem: LARISSA
Larissa sentada à mesa monta a loja no notebook. A câmera está na diagonal de 3/4 pela frente-esquerda, então o
notebook aparece de LADO (perfil), com a tela voltada para ela e visível em ângulo, mostrando blocos de fotos de roupas
sem nenhum texto. Uma mão no touchpad, a outra segurando uma blusa ao lado. Xícara de café, caderno.
```
```
ec-jornada-3-pedido.png — 1536x1024 — lado do texto: direita — personagem: LARISSA
O celular de Larissa está apoiado na mesa com a tela para cima, aceso com um brilho azul suave (sem ícones nem texto).
Ela, em pé, já separando a peça do pedido: dobra uma blusa sobre papel de seda. Leve satisfação no rosto.
```
```
ec-jornada-4-envio.png — 1536x1024 — lado do texto: direita — personagem: LARISSA
Larissa fecha uma caixa kraft lisa com fita; ao lado, sacola kraft sem marca e uma etiqueta em branco. Mãos em
destaque, cinco dedos, fita contínua.
```
```
ec-jornada-5-rotina.png — 1536x1024 — lado do texto: direita — personagens: LARISSA, KAUÊ e SUELI
Fim de tarde (luz um pouco mais quente). Larissa de pé confere uma prancheta. Kauê embala pedidos numa ponta da mesa.
Sueli, sentada de LADO para a câmera, usa o notebook com a tela voltada para ela (vista de perfil). Várias caixas
prontas na prateleira. Equipe pequena, ritmo tranquilo.
```

### Lote 2: as quatro portas (retrato 1024x1536, lado do texto: embaixo)

```
ec-porta-zero.png — 1024x1536 — lado do texto: embaixo — personagem: THIAGO
Na garagem, Thiago abre a primeira caixa de camisetas recém-chegadas da estamparia e segura uma camiseta lisa contra a
luz para conferir a costura. Expressão de quem está começando algo próprio. Prateleira de aço ao fundo.
```
```
ec-porta-instagram.png — 1024x1536 — lado do texto: embaixo — personagem: PATRÍCIA
Patrícia, sentada na beira da cama do quarto-escritório, responde clientes no celular. O celular está nas duas mãos,
tela virada para o rosto dela; a câmera vê o celular de lado. Ao fundo, arara de leggings e tops. Ring light desligado.
```
```
ec-porta-migrar.png — 1024x1536 — lado do texto: embaixo — personagem: RODRIGO
Rodrigo, na salinha comercial, compara fotos impressas de produtos espalhadas na mesa. O notebook está à frente dele,
visto POR CIMA DO OMBRO (a câmera atrás e acima do ombro direito), com a tela voltada para ele mostrando duas colunas de
blocos de fotos sem texto. Araras de camisas de futebol sem escudo ao fundo.
```
```
ec-porta-fisica.png — 1024x1536 — lado do texto: embaixo — personagem: DONA MARTA (e uma cliente)
Na loja de rua, Dona Marta, atrás do balcão, mostra a uma cliente (mulher de 30 anos, de costas para a câmera) um tablet
apoiado no balcão com a tela virada PARA A CLIENTE, mostrando fotos de roupinhas sem texto. Vitrine infantil ao fundo,
porta de vidro à esquerda com luz da rua.
```

### Lote 3: conversão (paisagem 1536x1024, lado do texto: esquerda)

```
ec-temas.png — 1536x1024 — lado do texto: esquerda — personagens: BRUNO e ANA
Bruno e Ana, sentados LADO A LADO de frente para a mesa e de costas parciais para a câmera (vistos por cima dos ombros),
comparam no notebook e no tablet a mesma vitrine em dois estilos diferentes (blocos de foto de acessórios, sem texto).
As telas estão viradas para eles. Bandejas com semijoias na mesa.
```
```
ec-planos.png — 1536x1024 — lado do texto: esquerda — personagem: FERNANDA
Fernanda, na bancada do laboratório caseiro, faz contas num caderno com uma calculadora simples (visor apagado, sem
números legíveis). O notebook está à frente dela, visto pela TAMPA (parte de trás), tela voltada para ela. Frascos
âmbar sem rótulo. Expressão tranquila de quem decidiu.
```
```
ec-entrar.png — 1536x1024 — lado do texto: esquerda — sem pessoas
O ateliê da Larissa à noite: só a luz azul da tela de um notebook aberto sobre a mesa, a arara em silhueta, a cidade
pela janela à esquerda desfocada. Tela com blocos simples de cor, sem texto.
```
```
ec-fecho.png — 1536x1024 — lado do texto: esquerda — personagens: LARISSA, KAUÊ e SUELI
Fim de tarde. A equipe da Larissa encosta na prateleira cheia de caixas kraft prontas para envio; Larissa ri de algo
que Sueli diz, Kauê fecha a última caixa. Momento de dever cumprido, sem pose.
```

---

## Parte D. Conferência antes de salvar (um minuto por imagem)

Reprove e peça de novo se qualquer item falhar:

- [ ] **Tela:** cada tela está virada para quem usa o aparelho? (Se a pessoa está atrás do notebook de frente para a
      câmera, a câmera deve ver a tampa, não a tela.)
- [ ] **Texto:** nenhuma letra, número, logotipo ou ícone de rede social (amplie telas, caixas, roupas, sacolas).
- [ ] **Mãos:** cinco dedos, nada fundido, nenhum braço sobrando.
- [ ] **Personagem certo:** rosto, cabelo, corpo e roupa batem com a ficha (e com as outras fotos dela).
- [ ] **Uma imagem só:** não é grade, colagem nem recorte.
- [ ] **Lado do texto** calmo e sem rosto.
- [ ] **Jornada:** o mesmo ângulo de câmera nas cinco fotos da Larissa.
- [ ] **Nome do arquivo** exato.

## Parte E. Entrega

- Um ZIP com as 18 imagens em PNG, nomes exatos (iguais aos de hoje, para eu trocar sem mexer no código):
  `ec-jornada-1-produto`, `ec-jornada-1-produto-retrato`, … `ec-jornada-5-rotina-retrato`, `ec-porta-zero`,
  `ec-porta-instagram`, `ec-porta-migrar`, `ec-porta-fisica`, `ec-temas`, `ec-planos`, `ec-entrar`, `ec-fecho`.
- Do meu lado: conversão (`scripts/imagens/ec-home-converter.py`), conferência por foto contra a Parte D, teste em
  computador, tablet e celular, e publicação. As fotos que falharem na conferência voltam com o motivo, uma por uma.
