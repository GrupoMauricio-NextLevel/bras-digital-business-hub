# Imagens dos painéis com vida (pedido pronto para o gerador de imagens)

> **Para que serve:** dar imagem com função aos painéis (abertura de cada painel, convite de próximo nível, "O que a NextLevel fez por você", calendário comercial, conquistas e estados vazios), como pede o prompt mestre `docs/prompts/paineis-com-vida-prompt-mestre.md` (seção B9, decisão D328).
> **Não precisa esperar as imagens:** os painéis funcionam com fundos feitos em código (degradê e grade). Quando um arquivo com o nome certo entra em `public/paineis/v1/`, a imagem aparece sozinha.
> **Como usar:** abra um chat novo no GPT com geração de imagens (ou outra plataforma), cole **todo o bloco da seção 3** e diga "Comece pela PRIORIDADE 1". Salve cada imagem com o **nome exato**. Junte num ZIP por lote e me mande: eu converto, coloco na pasta, atualizo o manifesto e confiro nas telas.
> **O que nunca vem do gerador:** fotos de produto (vêm da loja do cliente), fotos da equipe (usamos as fotos reais, `equipe-nextlevel-fotos-vida-marcas.md`) e o mapa do Brasil (é desenhado em código, com os dados).

> **Situação (17/11/2026):** prioridade 1 completa (Gemini): 15 imagens aprovadas e guardadas em `public/paineis/v1/` (ver o manifesto). Falta a prioridade 2.

## 1. Quantas e em que ordem
| Prioridade | Para quê | Quantas |
|---|---|---|
| **1 (gere primeiro)** | Abertura do lojista (escura e clara), abertura do Master (escura), degraus do próximo nível (escuro e claro), 3 datas próximas (Black Friday, Natal, liquidação de verão), 2 conquistas (primeira venda e marco, em Stories e quadrado), 3 estados vazios | 15 |
| 2 | As outras aberturas (Master claro, parceiro, agência, só Site), "O que a NextLevel fez por você", as outras 9 datas do ano, 2 conquistas (recorde e meta), 5 estados vazios | 27 |
| **Total** | | **42** |

## 2. Regras (já estão dentro do bloco)
- Nenhum texto, letra, número ou logotipo dentro da imagem (o texto real vem da tela).
- Nenhuma marca real, nenhuma estampa reconhecível, nenhum rosto reconhecível e nenhuma criança.
- Se aparecer tela de celular ou computador, ela fica lisa ou desfocada (nunca desenhar interface).
- Lado esquerdo calmo nas imagens largas: o texto do painel fica ali. O detalhe fica no terço direito.
- Paleta das famílias de cor dos painéis (prompt mestre, B5): azul elétrico `#4D9BFF`, ciano `#22D3EE`, violeta `#A78BFA`, âmbar `#FBBF24`, verde-vivo `#34E89E` e magenta `#F472B6`; base escura azul-noite `#070B1A`; base clara pérola `#F6F7FB`. Harmonizar com a abertura atual dos painéis (vidro roxo → violeta → azul).
- Brilho contido: luz bonita, nunca neon estourado.

## 3. O PROMPT (copie todo o bloco)

```
PAPEL
Você é diretor de arte de uma empresa brasileira de tecnologia para lojas virtuais (NextLevel Commerce). Vai produzir, em lotes, imagens para os PAINÉIS do sistema: fundos de abertura, um convite de "próximo nível", imagens de datas comerciais do Brasil, fundos de cartões de conquista e ilustrações de telas vazias. As imagens ficam ATRÁS de textos e números que o sistema escreve por cima. Tudo é fictício.

REGRAS GLOBAIS (obrigatórias em TODA imagem)
1. Nenhum texto, letra, número ou logotipo visível. Embalagens, etiquetas, sacolas e papéis lisos.
2. Nenhuma marca real, nenhuma estampa reconhecível.
3. Nenhum rosto reconhecível e nenhuma criança. Quando houver pessoas, só mãos.
4. Telas de celular ou computador, se aparecerem, ficam LISAS ou desfocadas; não desenhe interface.
5. Imagens largas: o LADO ESQUERDO (cerca de 60% da largura) fica calmo, escuro ou claro conforme a versão, sem detalhe forte, porque o texto do painel fica ali. O assunto principal fica no TERÇO DIREITO.
6. Paleta: base escura azul-noite (#070B1A) ou base clara pérola (#F6F7FB), conforme o nome do arquivo ("escuro" ou "claro"). Cores de luz: azul elétrico (#4D9BFF), ciano (#22D3EE), violeta (#A78BFA), âmbar (#FBBF24), verde-vivo (#34E89E) e magenta (#F472B6). Brilho contido e elegante, nunca neon estourado.
7. Versão "claro" = a mesma composição da versão "escuro", com fundo pérola, cores mais suaves e sombras delicadas.
8. Entregue UMA imagem por vez, no formato pedido, e diga o nome do arquivo exatamente como listado. Depois de cada imagem, pergunte se pode seguir.

ESTILO POR LOTE
- Lotes A, B e D: arte abstrata premium de vidro e luz, 3D suave, profundidade de campo, grão fino, sensação de tecnologia sofisticada.
- Lote C: fotografia real de alta qualidade, cenário brasileiro plausível, luz natural, cores fiéis, profundidade de campo rasa.
- Lote E: ilustração 3D suave (argila fosca com detalhes de vidro), objeto único centralizado, FUNDO TRANSPARENTE, mesma luz em todas, sombra suave; quadrado 1024×1024.

LOTE A — ABERTURAS DOS PAINÉIS (proporção 21:9, PNG)
pv-abertura-loja-escuro.png — fitas de luz fluindo do terço direito para o centro, em azul elétrico, violeta e ciano, sobre azul-noite profundo; grade fina quase invisível; partículas de luz desfocadas; lado esquerdo escuro e calmo.
pv-abertura-loja-claro.png — a mesma composição em versão clara: fitas de luz azul e violeta suaves sobre pérola; lado esquerdo limpo.
pv-abertura-master-escuro.png — constelação de pontos de luz ligados por linhas finas no terço direito, sugerindo de leve um mapa do Brasil abstrato (sem contorno exato, sem nomes); pontos em azul, violeta e verde-vivo; azul-noite.
pv-abertura-master-claro.png — a mesma constelação em versão clara.
pv-abertura-parceiro-escuro.png — trilhas de luz subindo em degraus da esquerda para a direita, terminando num ponto brilhante verde-vivo no terço direito; azul-noite.
pv-abertura-parceiro-claro.png — a mesma cena em versão clara.
pv-abertura-agencia-escuro.png — prisma de vidro no terço direito refratando um feixe de luz branca em seis faixas (azul, ciano, violeta, âmbar, verde-vivo, magenta); estúdio escuro.
pv-abertura-agencia-claro.png — a mesma cena em versão clara.
pv-abertura-site-escuro.png — ondas concêntricas de luz se espalhando a partir de um ponto no terço direito, como um sinal que chega longe; azul e ciano sobre azul-noite.
pv-abertura-site-claro.png — a mesma cena em versão clara.

LOTE B — PRÓXIMO NÍVEL E TRABALHO DO SISTEMA (PNG)
pv-proximo-nivel-degraus-escuro.png — 1:1 — escada de 5 degraus de vidro translúcido subindo da esquerda para a direita, bordas acesas em violeta e ciano, o último degrau mais brilhante, com halo verde-vivo; azul-noite; espaço vazio no alto à esquerda.
pv-proximo-nivel-degraus-claro.png — 1:1 — a mesma escada em versão clara.
pv-valor-entregue-escuro.png — 4:3 — canais de vidro por onde correm partículas de luz em fluxos ordenados, como um sistema trabalhando sozinho; azul, ciano e verde-vivo; azul-noite; lado esquerdo calmo.
pv-valor-entregue-claro.png — 4:3 — a mesma cena em versão clara.

LOTE C — DATAS COMERCIAIS DO BRASIL (proporção 16:9, PNG; assunto no terço direito, lado esquerdo calmo e levemente desfocado)
pv-data-liquidacao-verao.png — araras com roupas leves de verão e etiquetas lisas, sol forte entrando pela janela, cores claras (janeiro).
pv-data-volta-as-aulas.png — mochila, cadernos coloridos sem estampa, estojo e lápis sobre mesa clara, luz da manhã.
pv-data-carnaval.png — serpentinas e confetes coloridos caindo sobre fundo escuro, brilho suave, sem pessoas.
pv-data-pascoa.png — ovos de chocolate embrulhados em papel liso colorido, com laços, sobre madeira clara.
pv-data-dia-das-maes.png — caixa de presente com laço, flores frescas e um cartão em branco, luz suave de janela.
pv-data-dia-dos-namorados.png — duas xícaras, caixa de presente vermelha lisa e pétalas, luz quente de fim de tarde.
pv-data-festa-junina.png — bandeirinhas coloridas lisas, milho e doces de festa, fogueira desfocada ao fundo, noite.
pv-data-dia-dos-pais.png — relógio, carteira de couro e caixa de presente lisa sobre madeira escura.
pv-data-dia-do-cliente.png — mãos recebendo uma sacola de compras lisa com laço, balcão de loja desfocado.
pv-data-dia-das-criancas.png — brinquedos de madeira coloridos, sem marcas, sobre fundo claro.
pv-data-black-friday.png — sacolas de compras pretas lisas com fita neon verde-vivo e ciano, fundo escuro com brilho suave, clima noturno de tecnologia.
pv-data-natal.png — presentes embrulhados em papel liso, luzinhas desfocadas e galho de pinheiro, tons quentes.

LOTE D — FUNDOS DE CONQUISTA (PNG; o CENTRO fica calmo, porque o sistema escreve ali o número da conquista)
pv-conquista-primeira-venda-916.png — 9:16 — explosão suave de partículas de luz e pequenos confetes de vidro em azul, violeta e verde-vivo, ao redor de um centro escuro e calmo; azul-noite.
pv-conquista-primeira-venda-11.png — 1:1 — a mesma cena em quadrado.
pv-conquista-marco-916.png — 9:16 — degraus de luz subindo até perto do centro, com faíscas no alto; centro calmo; azul-noite.
pv-conquista-marco-11.png — 1:1 — a mesma cena em quadrado.
pv-conquista-recorde-916.png — 9:16 — fogos de artifício estilizados de luz em magenta e âmbar, contidos nas bordas; centro calmo; azul-noite.
pv-conquista-recorde-11.png — 1:1 — a mesma cena em quadrado.
pv-conquista-meta-916.png — 9:16 — um anel de luz completo, fechando, em verde-vivo e ciano, com brilho; o centro do anel calmo; azul-noite.
pv-conquista-meta-11.png — 1:1 — a mesma cena em quadrado.

LOTE E — TELAS VAZIAS (ilustração 3D suave, 1:1, 1024×1024, FUNDO TRANSPARENTE)
pv-vazio-vendas.png — pequeno gráfico de barras de vidro com uma plantinha brotando da barra mais alta.
pv-vazio-pedidos.png — caixa de envio aberta e vazia, com um laço de luz saindo de dentro.
pv-vazio-clientes.png — porta de loja aberta com luz quente saindo e um tapete liso de boas-vindas.
pv-vazio-conversas.png — dois balões de conversa vazios, um azul e um violeta, flutuando.
pv-vazio-conquistas.png — pedestal vazio com um brilho suave em cima.
pv-vazio-contatos-site.png — envelope de vidro chegando com um rastro de luz.
pv-vazio-busca.png — lupa de vidro sobre uma superfície com pontinhos de luz.
pv-tudo-em-dia.png — prancheta com a lista toda marcada e um selo de visto verde-vivo, confetes discretos.

ORDEM
PRIORIDADE 1 (15 imagens): pv-abertura-loja-escuro, pv-abertura-loja-claro, pv-abertura-master-escuro, pv-proximo-nivel-degraus-escuro, pv-proximo-nivel-degraus-claro, pv-data-black-friday, pv-data-natal, pv-data-liquidacao-verao, pv-conquista-primeira-venda-916, pv-conquista-primeira-venda-11, pv-conquista-marco-916, pv-conquista-marco-11, pv-vazio-vendas, pv-vazio-pedidos, pv-tudo-em-dia.
PRIORIDADE 2: todas as outras, na ordem dos lotes.
Comece pela PRIORIDADE 1, imagem 1.
```

## 4. Outras plataformas
- **Midjourney ou parecidas:** cole a descrição de uma imagem por vez, junto com as regras globais, e use a proporção no parâmetro (`--ar 21:9`, `--ar 16:9`, `--ar 1:1`, `--ar 9:16`, `--ar 4:3`) e `--no text, letters, numbers, logo, watermark`.
- **Fundo transparente (lote E):** prefira o GPT, que entrega PNG transparente. Se a plataforma não fizer, peça fundo branco liso e me avise.

## 5. Depois de gerar (eu faço)
- Converter para WebP (qualidade 82) e AVIF (qualidade 55), mantendo o nome; lote E em WebP com transparência (qualidade 90).
- Larguras: aberturas 2400 px; datas e "valor entregue" 1600 px; degraus e conquistas 1080 px; ilustrações 1024 px.
- Peso: aberturas até 180 KB; cartões até 90 KB; ilustrações até 60 KB (WebP).
- Pasta `public/paineis/v1/` e `public/paineis/v1/MANIFESTO.md` (arquivo, onde aparece, proporção, peso); conferir o contraste do texto sobre cada imagem por captura, nos dois temas.

## 6. Reanálise depois da prioridade 1 (17/11/2026) e o lote 2, por partes

### O que já temos
- **15 imagens do lote 1** (`public/paineis/v1/`): abertura do lojista (no ar no painel), abertura do Master, degraus, Black Friday, Natal, liquidação de verão, conquistas (1ª venda e marco) e 3 telas vazias.
- **Ilustrações v1** (`public/ilustracoes/v1/`): planas, azul-acinzentado; destoam do visual novo (vidro e luz).
- **Fotos reais da equipe** e miniaturas dos temas.
- **Ícones de traço fino** (lucide) em todo o sistema: limpos, mas é o que faz a tela parecer "sistema genérico".

### O espaço que existe na tela (onde imagem pequena dá mais vida que imagem grande)
| Lugar | Hoje | O que entra |
|---|---|---|
| Cartões de número (4 no início do lojista, 5 no Master) | ícone de traço num quadrado | ícone 3D de vidro da família de cor (48 px) |
| Ações rápidas | ícone de traço | ícone 3D (40 px) |
| Saúde da loja | anel e texto | escudo de vidro ao lado do anel |
| Jornada da loja (próximo nível) | ilustração plana v1 | 5 fases em 3D, no mesmo estilo dos degraus |
| Telas vazias restantes | ilustração v1 ou nada | 3D argila e vidro |
| Acompanhar pedido (consumidor) | texto | 4 ícones neutros da linha do tempo (pago, separado, enviado, entregue), sem cor NextLevel |
| Aberturas de parceiro, agência e só Site | vidro roxo | imagens do lote A |

### Como vamos aplicar (o dinamismo)
- **Ícones 3D nos cartões:** sobem 2 px e giram de leve ao passar o mouse; o número conta ao entrar. Parados com "menos movimento".
- **Fundo das imagens:** o Gemini não faz transparente; pedimos fundo pérola liso **sem sombra no chão** e eu recorto o fundo, para servir no claro e no escuro.
- **Peso:** ícones até 12 KB, ilustrações até 40 KB.

### Frase de estilo (cole no começo de TODA imagem deste lote)
```
Ícone 3D suave no estilo argila fosca com detalhes de vidro translúcido, objeto único centralizado ocupando 70% do quadro, iluminação de estúdio suave vinda do alto à esquerda, cantos arredondados, aparência premium e amigável. Fundo totalmente liso cor pérola #F6F7FB, SEM sombra no chão, sem reflexo, sem texto, sem letras, sem números, sem logotipo. Formato quadrado 1:1.
```

### Parte 1 — ícones das famílias de cor e das ações rápidas (10, aplicação imediata)
| Arquivo | Cole depois da frase de estilo |
|---|---|
| pv-icone-dinheiro.png | Carteira com duas moedas saindo, em azul elétrico (#4D9BFF) com brilho suave nas bordas de vidro. |
| pv-icone-pedidos.png | Sacola de compras com uma caixa pequena ao lado, em ciano (#22D3EE). |
| pv-icone-clientes.png | Dois bonecos estilizados lado a lado, sem rosto, em violeta (#A78BFA). |
| pv-icone-visitas.png | Olho estilizado de vidro com ondas de sinal ao redor, em âmbar (#FBBF24). |
| pv-icone-crescimento.png | Seta subindo em degraus com um pequeno broto no topo, em verde-vivo (#34E89E). |
| pv-icone-festa.png | Estrela com pequenos confetes de vidro ao redor, em magenta (#F472B6). |
| pv-icone-novo-produto.png | Caixa de produto com um sinal de mais flutuando acima, em azul elétrico. |
| pv-icone-novo-pedido.png | Prancheta com uma sacola pequena e um sinal de mais, em ciano. |
| pv-icone-aparencia.png | Pincel e paleta de cores com gotas nas seis cores (azul, ciano, violeta, âmbar, verde, magenta). |
| pv-icone-financeiro.png | Cofrinho de vidro com moedas, em verde-vivo. |

### Parte 2 — Jornada da loja e saúde (6)
| Arquivo | Cole depois da frase de estilo |
|---|---|
| pv-fase-fundacao.png | Bloco de fundação com uma planta baixa e uma régua, em azul elétrico. |
| pv-fase-lancamento.png | Vitrine de loja pequena com toldo, porta aberta e luz acesa, em ciano. |
| pv-fase-aquisicao.png | Ímã atraindo pequenas sacolas de compra, em violeta. |
| pv-fase-otimizacao.png | Engrenagem com um medidor de velocidade, em âmbar. |
| pv-fase-escala.png | Três degraus de vidro com uma bandeira no topo, em verde-vivo. |
| pv-saude-loja.png | Escudo de vidro com um sinal de visto, em verde-vivo, com brilho calmo. |

### Parte 3 — telas vazias restantes e acompanhamento do pedido (9)
| Arquivo | Cole depois da frase de estilo |
|---|---|
| pv-vazio-clientes.png | Porta de loja aberta com luz quente saindo e um tapete liso. |
| pv-vazio-conversas.png | Dois balões de conversa vazios, um azul e um violeta, flutuando. |
| pv-vazio-conquistas.png | Pedestal vazio com um brilho suave em cima. |
| pv-vazio-contatos-site.png | Envelope de vidro chegando com um rastro de luz. |
| pv-vazio-busca.png | Lupa de vidro sobre pontinhos de luz. |
| pv-pedido-pago.png | Cartão de pagamento liso com um visto, tudo em branco e cinza claro (sem cor de marca). |
| pv-pedido-separado.png | Caixa de papelão aberta com papel de seda, em tons neutros de kraft. |
| pv-pedido-enviado.png | Caixa fechada com uma etiqueta lisa e uma seta de movimento, em tons neutros. |
| pv-pedido-entregue.png | Caixa na frente de uma porta com um coração pequeno, em tons neutros. |

### Parte 4 e Parte 5 (depois)
- **Parte 4:** as aberturas que faltam do lote A (Master claro, parceiro, agência e só Site, escuro e claro) e "O que a NextLevel fez por você" (lote B). Usam o bloco da seção 3, não a frase de estilo.
- **Parte 5:** as 9 datas comerciais que faltam (lote C) e as conquistas de recorde e de meta (lote D).
