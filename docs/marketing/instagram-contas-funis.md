# Instagram: reorganização das contas em funis de venda

> Pedido do dono (14/11/2026): reorganizar as contas do Instagram para virarem funis de venda da NextLevel Commerce, do pessoal/comercial e das outras marcas. Aceita trocar @ e mudar tudo.
> Base: prints de 14/11/2026 das contas @brasdigital.sp, @mauriciors.jr, @brasdigitalapp, @chinahubplataforma e da Loja Megatron.
> Regra de foco (D174/D287): o que aproxima a E-commerce do 10º lojista pagante vem primeiro.
> Nada aqui vale como decisão até virar D-número em `docs/design/DECISIONS.md`.

## 0. Atualização de 16/11/2026 (prevalece sobre as seções 3.2 e 3.3)

**Empresas e marcas informadas pelo dono:**
| Empresa (CNPJ) | Marcas fantasia |
|---|---|
| NextLevel Marketing Ltda | NextLevel Commerce · NextLevel Business · Brás Digital (atacado e importadores) · China Hub (importação) |
| Mega Tron Comércio Eletrônico Ltda | Megatron (varejo vendido com parceiros criadores) |

(A divisão das marcas entre os dois CNPJs é suposição a confirmar. NextLevel Business é a tecnologia de gestão do negócio e captação de clientes (D303).)

**Marca pessoal:** Mauricio Ramos dos Santos Junior quer virar criador de conteúdo e fazer collab com todas as marcas, usando o maior perfil.

**Troca de perfis (recomendada):**
| Conta hoje | Seguidores | Vira |
|---|---|---|
| @brasdigitalapp | 6.646 | **@mauriciors.jr**: perfil pessoal de criador (a foto já é a sua, e o público já segue você) |
| @mauriciors.jr | 896 | **@brasdigital**: Brás Digital, atacado e importadores (os vídeos de produto no Brás já combinam). Arquivar os posts de família |
| @brasdigital.sp | 1.348 | **@nextlevelcommerce** (igual à seção 3.1) |
| (nova) | 0 | **@nextlevelbusiness**: reservar agora; o conteúdo começa quando o produto tiver piloto (D303) |
| @chinahubplataforma | 68 | **@chinahub** (igual à seção 3.4) |
| Loja Megatron | 55 | **@megatronbrasil**: os vídeos de produto (caixa de som, ferramentas, câmeras) viram Collab Mauricio + Megatron com link para comprar |

**Ordem da troca:** (1) @mauriciors.jr → @brasdigital (libera o @); (2) logo em seguida, @brasdigitalapp → @mauriciors.jr; (3) as demais. Se o Instagram segurar o @ liberado, usar @mauriciojr ou @mauricio.rsjr. Tipo de conta do pessoal: **Criador de conteúdo**; as marcas ficam como **Empresa**.

## 1. Diagnóstico (o que os prints mostram)

| Conta | Seguidores | Posts | Problema |
|---|---|---|---|
| @brasdigital.sp ("Nextlevel \| Brás Digital") | 1.348 | 13 | Nome diz Brás, a bio diz agência (sites, automação). Os vídeos (pizza, restaurante) são os mesmos da @brasdigitalapp. Não vende nada. |
| @mauriciors.jr (Maurício Jr) | 896 | 289 | É o rosto de tudo, mas a categoria é "Compras e varejo" e a bio não leva a nenhuma oferta. Os vídeos de produto (2.956, 1.528, 1.416 visualizações) dão muito mais que os pessoais. |
| @brasdigitalapp (Brás Digital App) | 6.646 | 139 | Maior público, mas mistura Brás, China Experience, viagem, carro, restaurante. Bio sem chamada e sem link. |
| @chinahubplataforma | 68 | 21 | Posts de "Oportunidade: fazer dinheiro" (contra a regra "sem promessa de ganho"), depoimentos de dropshipping antigos. Marca em pausa. |
| Loja Megatron | 55 | 15 | Loja real de eletrônicos no Shopping VHT. É um caso de uso perfeito, hoje sem ligação com a plataforma. |
| **NextLevel Commerce** | — | — | **Não existe conta.** A frente prioritária não tem Instagram. |

Resumo: o público existe (cerca de 9 mil pessoas somadas, quase todas ligadas ao Brás e a quem compra para revender), mas nenhuma conta leva essa gente até uma loja virtual paga.

## 2. Como fica (o desenho do funil)

```
ATENÇÃO (alcance)            PROVA (confiança)          VENDA (fecha)
@mauriciors.jr  ─┐
                 ├──►  Loja Megatron (caso real) ──►  @nextlevelcommerce ──► site / WhatsApp
@brasdigitalapp ─┘     depoimentos de lojistas         "comente LOJA"
       │
       └──► @chinahub (lista de espera, importação)   [em pausa, só recebe]
```

- **O Mauricio é o rosto; as marcas são as lojas.** Um vídeo gravado vira **post em colaboração (Collab)**: aparece no perfil pessoal e no da marca ao mesmo tempo, somando o alcance dos dois. Grava uma vez, publica em dois.
- Quem vende no Brás e só no WhatsApp/Instagram é exatamente o cliente da NextLevel Commerce. A @brasdigitalapp é a maior porta de entrada para ele.
- Todo link leva etiqueta de origem (`?utm_source=instagram&utm_medium=bio&utm_campaign=<conta>`), para o painel mostrar qual conta trouxe o lojista (o sistema já reconhece a origem "instagram"; ver `docs/prompts/trafego-campanhas-meta-google-reels.md`).

## 3. Conta por conta

> Sugestões de @ em ordem de preferência. A disponibilidade só se confere no próprio app (Editar perfil → Nome de usuário).
> Bio: até 150 caracteres. O campo "Nome" entra na busca do Instagram; por isso leva a palavra que o cliente procura.

### 3.1 @brasdigital.sp → **@nextlevelcommerce** (a conta que vende)
Reaproveita uma conta que já existe, já é verificada e tem 1.348 seguidores do Brás (o público certo).
- **@:** `nextlevelcommerce` · `nextlevelcommerce.br` · `nextlevel.commerce`
- **Nome:** `NextLevel Commerce | Loja virtual`
- **Categoria:** Software (ou Produto/serviço)
- **Bio:**
  ```
  Sua loja virtual pronta, com Pix, cartão e frete
  Pra quem já vende no WhatsApp e no Instagram
  Feita no Brás, pra lojista de verdade
  👇 Veja como funciona
  ```
  (Trocar a última linha pela oferta real quando estiver decidida: teste grátis, demonstração ou plano de entrada. Não prometer o que o sistema ainda não tem.)
- **Links (até 5):** página de cadastro/teste · WhatsApp comercial · loja Megatron (exemplo) · tabela de planos.
- **Destaques:** Comece aqui · Lojas no ar · Como funciona · Planos · Dúvidas
- **Arquivar** os 13 posts atuais (pizza, restaurante, vídeos repetidos). Arquivar não apaga; dá para voltar.
- **Assuntos dos posts:**
  1. "Montei a loja de ___ em 1 dia" (série com lojistas do Brás, antes e depois).
  2. Tutorial de 30 segundos: link de pagamento Pix, cupom, frete, catálogo no Instagram.
  3. Erros de quem vende só pelo WhatsApp (pedido perdido, sem estoque, sem nota).
  4. Bastidor do sistema: tela real do painel, novidade da semana.
  5. Depoimento e números reais de loja (sem promessa de ganho).
- **Chamada fixa:** "Comente LOJA que eu te mando o link" (depois automatizado pela API; ver seção 5.10 do documento de tráfego).

### 3.2 @mauriciors.jr (o rosto, pessoal e comercial)
Fica com o mesmo @ (é o seu nome; trocar perde quem já procura por você).
- **Nome:** `Maurício Jr | Brás, China e lojas online`
- **Categoria:** Empreendedor (ou Criador de conteúdo digital). Sair de "Compras e varejo".
- **Bio:**
  ```
  Empresário do Brás, conecto lojista, fábrica e tecnologia
  🛍️ Loja virtual: @nextlevelcommerce
  📦 Atacado do Brás: @brasdigitalapp
  🚢 Importação: @chinahub
  ```
- **Links:** WhatsApp comercial · NextLevel Commerce · NextLevel Group (agência/sistemas sob medida).
- **Destaques:** Quem sou · Lojas virtuais · Brás · China · Clientes · Família (fica, humaniza).
- **Assuntos:** bastidores do dia no Brás e no galpão, visita a fornecedor, opinião sobre varejo online, clientes que você atendeu, vida de empresário. **A agência (sites, automação, sistemas sob medida) mora aqui por enquanto**, como "o que eu faço para empresas", até valer a pena abrir uma conta só dela (reserve o @ `nextlevelgroup` já).
- **Regra:** todo vídeo de produto do Brás é Collab com @brasdigitalapp; todo vídeo de loja virtual é Collab com @nextlevelcommerce.

### 3.3 @brasdigitalapp (o atacado do Brás, maior público)
Mantém o @ (6.646 seguidores reconhecem). Se quiser encurtar, `brasdigital` ou, depois de liberado, `brasdigital.sp`; só troque se estiver livre e numa única vez.
- **Nome:** `Brás Digital | Atacado do Brás`
- **Categoria:** Atacadista (ou Compras e varejo)
- **Bio:**
  ```
  O Brás no seu celular: novidades de atacado todo dia
  Fornecedores conferidos · Envio pra todo o Brasil
  Quer vender online? @nextlevelcommerce
  👇 Grupo de novidades
  ```
- **Links:** grupo/canal do WhatsApp de novidades · NextLevel Commerce (com etiqueta `utm_campaign=brasdigitalapp`) · excursão/viagem quando houver.
- **Destaques:** Novidades · Fornecedores · Envios · Excursão · Vender online (leva ao Commerce).
- **Assuntos:** achado do dia com preço de atacado, "chegou agora", tour por loja/fornecedor, como comprar e mandar pelo ônibus. Uma vez por semana: "Comprou aqui? Monte sua loja virtual e venda isso online" (ponte para o Commerce).
- **Arquivar:** pizza, restaurante, carro, vídeos repetidos da antiga @brasdigital.sp. **Mover o assunto China** (China Experience, Importação na Prática) para Collab com a @chinahub.

### 3.4 @chinahubplataforma → **@chinahub** (em pausa, só recebe)
Marca para depois (CLAUDE.md). Não investir tempo; só deixar arrumada para não queimar a marca.
- **@:** `chinahub` · `chinahub.br` · `chinahubbr` (o atual é longo e é cortado na tela)
- **Nome:** `China Hub | Importação da China`
- **Bio:**
  ```
  Importação da China com quem está lá
  Busca de fornecedor · Contêiner compartilhado · Excursão
  👇 Entre na lista de espera
  ```
- **Arquivar já:** "Oportunidade fazer dinheiro", "Prepare-se para decolar" e os depoimentos de dropshipping (contra a regra "sem promessa de ganho" e falam de um produto antigo).
- **Conteúdo:** só Collab com @mauriciors.jr quando você gravar algo de importação. Zero produção própria até a marca voltar.

### 3.5 Loja Megatron → **@megatronbrasil** (o caso real)
- **@:** `megatronbrasil` (bate com o site megatronbrasil.com)
- **Nome:** `Megatron | Eletrônicos no Brás`
- **Bio:** manter o que já tem (Shopping VHT, compre no site ou na loja, envia pro Brasil) e trocar o link para a loja na NextLevel Commerce quando ela estiver lá.
- **Papel no funil:** prova. Posts em Collab com @nextlevelcommerce: "como a Megatron vende no balcão e no site com o mesmo estoque". É o argumento mais forte para o lojista do Brás: uma loja vizinha usando.
- Confirmar com o dono: a Megatron é sua ou de parceiro? Se for de terceiro, pedir autorização para usar como caso.

## 4. Ordem para mudar (sem perder nada)
1. **Conferir disponibilidade** de todos os @ novos antes de trocar qualquer um (Editar perfil → Nome de usuário; se aparecer o "✓", está livre).
2. **Trocar um por vez, no mesmo dia:** primeiro @brasdigital.sp → @nextlevelcommerce; depois @chinahubplataforma → @chinahub; depois Megatron.
3. **Proteger o @ antigo:** quando você troca, o @ velho fica livre para qualquer um. O Instagram deixa voltar em até 14 dias, mas depois disso alguém pode pegar `brasdigital.sp`. Se quiser segurar, crie uma conta nova vazia com ele, com a bio "Agora somos @brasdigitalapp".
4. **Reservar** `nextlevelgroup` (agência) agora, mesmo sem usar.
5. **Trocar os links** nos lugares onde o @ antigo aparece: bio das outras contas, WhatsApp, Google Meu Negócio, cartões, rodapé dos sites (hoje o código do site não tem links do Instagram; dá para colocar por marca via `getBrand()`).
6. **Arquivar** (não apagar) os posts fora de lugar de cada conta.
7. Ligar em todas: conta profissional, botão de contato com WhatsApp, e o Meta Business Suite para agendar posts das cinco contas num lugar só.

## 5. Ritmo de produção (realista para uma pessoa)
- **3 vídeos por semana gravados por você**, cada um publicado em Collab em duas contas:
  - 1 de loja virtual (Mauricio + @nextlevelcommerce);
  - 1 de achado do Brás (Mauricio + @brasdigitalapp);
  - 1 de bastidor/opinião (Mauricio, e Collab com a marca que fizer sentido).
- **2 posts por semana sem gravar**, só na @nextlevelcommerce: print de tela do sistema, carrossel "passo a passo", depoimento.
- **Stories todo dia** na conta pessoal (dia a dia no Brás) com uma figurinha de link para a oferta da semana.
- Uma tarde por semana para gravar tudo de uma vez.

## 6. Primeiras 2 semanas (para começar já)
| Dia | Conta | Vídeo/post |
|---|---|---|
| 1 | @nextlevelcommerce + pessoal | "Por que lojista do Brás que vende só no WhatsApp perde venda" (fixar no perfil) |
| 2 | @brasdigitalapp + pessoal | Achado do dia com preço de atacado e "comente QUERO" |
| 3 | @nextlevelcommerce | Carrossel: "Sua loja virtual em 5 passos" com telas reais |
| 4 | @nextlevelcommerce + @megatronbrasil + pessoal | "Fui na Megatron ver como eles vendem no site e no balcão" (fixar) |
| 5 | pessoal | Bastidor: um dia comigo no Brás |
| 8 | @nextlevelcommerce + pessoal | "Montei a loja de ___ em 1 dia" (episódio 1, fixar) |
| 9 | @brasdigitalapp + pessoal | Tour por um fornecedor + "quer vender isso online? link na bio" |
| 10 | @nextlevelcommerce | Tutorial 30 s: link de pagamento no Pix |
| 11 | pessoal | "O que eu faço para empresas" (agência, sistemas sob medida) |
| 12 | @nextlevelcommerce | Perguntas frequentes (preço, taxa, prazo, frete) |

Os três vídeos fixados no topo de cada conta são o "comece aqui": quem cai no perfil entende em 30 segundos o que é e o que fazer.

## 7. Perguntas para o dono
1. Qual é a oferta de entrada da NextLevel Commerce para a bio (teste grátis, demonstração com você, plano de entrada)?
2. A Megatron é sua ou de parceiro? Pode virar caso público?
3. O WhatsApp comercial é o mesmo da sua bio pessoal ou há um número da empresa?
4. Quer abrir já uma conta separada para a agência (@nextlevelgroup) ou deixamos dentro do seu pessoal por enquanto (recomendado)?
5. Quais contas do Instagram você ainda tem que não estão nos prints (SuperDrop, Cargas, Creators)?
