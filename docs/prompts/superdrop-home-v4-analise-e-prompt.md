# SuperDrop: análise profunda da página inicial (v4) e prompt mestre

> Pedido do dono (16/10/2026, depois de ver o pacote visual D152 no celular): "ficou muito a desejar… as imagens não foram bem aplicadas… no início não houve imagem de hero, e essa página não está transmitindo realmente a mensagem que precisa."
> Base desta análise: 9 capturas do dono (iPhone, modo claro e escuro), o código atual (`src/app/(portal)/page.tsx`, `src/components/portal/marca-institucional.tsx`), as 12 peças do pacote `public/marcas/superdrop/imagens/` e as 18 fotos de `public/portal/superdrop/v3/`.
> Endereço: https://superdrop.com.br · versão no ar: `1f87a65`.

---

## 1. Veredito em uma frase

A página tem boas peças, mas elas foram **empilhadas** em vez de **organizadas numa história**. A primeira tela não mostra o que é o SuperDrop, as fotos foram usadas no lugar errado, três seções dizem "Tudo…" e a página passa de 15 blocos. Quem chega não entende em 5 segundos **o que é, para quem é e por que é diferente**.

---

## 2. O que as capturas mostram (problema por problema)

### 2.1 Primeira tela (herói)
| # | O que se vê | Por que atrapalha |
|---|---|---|
| H1 | Fundo verde-escuro liso com um brilho, **sem nenhuma imagem**. | A primeira tela é onde a pessoa decide se fica. Sem foto, a página parece um formulário de banco. A foto principal do pacote (`hero-key-visual`) foi feita **exatamente para ser o fundo do herói**: tem uma faixa azul-marinho vazia à esquerda reservada para o texto. Ela foi parar mais abaixo, dentro de um cartão. |
| H2 | A primeira frase visível é a pílula "Pix na hora · ou teste 7 dias com o cupom do seu fornecedor". | Começa falando de **forma de pagamento e cupom** antes de dizer o que o produto faz. "Cupom do seu fornecedor" confunde quem ainda não tem fornecedor. |
| H3 | Título: "Sua loja online sem estoque, pronta para vender hoje." | É correto, mas genérico: qualquer plataforma de dropshipping diz isso. Falta a **ideia que só o SuperDrop tem**: *você vende, o fornecedor separa e envia, cada um recebe o seu dinheiro direto na própria conta*. |
| H4 | Parágrafo de 4 linhas com 4 ideias ("escolha… monte… o fornecedor separa… assine por Pix…"). | Texto demais para a primeira tela do celular. |
| H5 | Três botões: "Criar minha loja", "Área de membros" e "Ver planos". O terceiro aparece solto e desalinhado (recuado). | Três escolhas com o mesmo peso dividem a atenção. "Área de membros" é para quem já é cliente e deveria estar só no menu. |
| H6 | **Modo claro:** cabeçalho creme sobre herói escuro. | O topo fica em "duas cores", parece um erro de montagem. |
| H7 | **Modo escuro:** botão principal verde-claro lavado e cabeçalho azul sobre herói verde. | Perde força e de novo parece colado de duas páginas. |
| H8 | A "esteira ao vivo" (a demonstração animada) vem **depois** do texto e da linha de garantias, quase fora da primeira tela. | É a prova mais forte do produto e está escondida. |

### 2.2 Bloco "Tudo para vender sem estoque" (a vitrine do pacote)
| # | O que se vê | Por que atrapalha |
|---|---|---|
| V1 | A foto principal aparece como cartão com um **terço da imagem azul-escuro liso** à esquerda. | Essa faixa é o espaço do texto do herói. Usada como cartão, parece defeito de carregamento. |
| V2 | **Modo claro:** os cartões "Catálogo pronto / Sua margem / Pedido automático" aparecem **sem os ícones** (espaço vazio à esquerda). No modo escuro eles aparecem. | Parece página quebrada. Causa provável: carregamento preguiçoso (`loading="lazy"`) mais a animação de entrada (`Reveal`) no Safari. Precisa ser conferido e corrigido. |
| V3 | Seis cartões empilhados no celular, um por tela. | Rolagem longa para informação que cabe em uma linha. |

### 2.3 Repetição de mensagem
A página tem **três seções que começam com "Tudo"**: "Tudo para vender sem estoque" (vitrine), "Tudo para começar a vender sem complicação" (problema e promessa) e "Tudo o que a sua loja precisa, em um só lugar" (benefícios). Além disso, "Cada um com o seu papel e o seu dinheiro" aparece **duas vezes** (bloco de papéis e fecho da marca), e "Criar minha loja" aparece em **cinco** lugares. Repetir o mesmo título cansa e dá a impressão de texto feito às pressas.

### 2.4 Bloco de temas ("Uma loja bonita, que você monta sem programar")
| # | O que se vê | Por que atrapalha |
|---|---|---|
| T1 | Uma "prévia" do tema Maison com **quadrados cinza** no lugar das fotos e o título "A coleção da estação" **quase invisível** (texto claro sobre fundo creme). | Justo na seção que promete "loja bonita", o que aparece é uma loja vazia. É a pior impressão da página. |
| T2 | Cartões de preço do tema ("Starter Grátis", "Arena R$ 299,00") logo abaixo. | Preço de tema antes de a pessoa decidir abrir a loja é distração; isso é assunto da Loja NextLevel. |

### 2.5 Bloco de benefícios (fundo escuro)
Ícones dentro de círculos verdes, título e texto, um embaixo do outro: é o padrão que a skill `pagina-de-vendas` chama de **"visual de IA"**. Repete o que a vitrine e o bloco "problema e promessa" já disseram.

### 2.6 Páginas vizinhas (das capturas)
| Página | Situação |
|---|---|
| Entrar (`/login`) | **Boa.** Foto do galpão à noite, logo e cartão. Só o cartão começa muito embaixo no celular: a foto ocupa quase metade da tela antes do formulário. |
| Parceiros: entrar e criar conta | Topo com **grade verde genérica, sem foto**, e já existe a foto `pa-parceiros-hero` no projeto. Em "Como você quer participar?", **Agência** e **Desenvolvedor freelancer** aparecem com o mesmo peso de **Afiliado**, mas estão "em breve". Isso leva a pessoa a escolher algo que não existe. |

### 2.7 Fotos que existem e não aparecem (ou aparecem no lugar errado)
- `hero-key-visual`: feita para o **herói**, usada num cartão no meio da página.
- `cta-moment`: feita para a **chamada final** (também tem faixa azul para texto), mas o fecho usa uma textura.
- `capability-01`, `capability-02`, `proof-editorial`, `system-pattern`, `section-divider`: o fecho e a vitrine usam parte delas; as faixas decorativas (`system-pattern`, `section-divider`) não aparecem.
- `sd-hero-celular-venda` (celular na mão): é a imagem mais clara de "vender pelo celular" e está **pequena, ao lado dos planos**.
- `sd-passo-vende`, `sd-passo-publica`, `sd-passo-envia`: fotos dos passos; o "como funciona" mostra só telas.
- **Cuidado:** `hero-key-visual`, `capability-01`, `capability-02` e `proof-editorial` mostram **as mesmas pessoas no mesmo galpão**. Usar as quatro na mesma página parece banco de imagem repetido. No máximo duas.

---

## 3. A mensagem que a página precisa passar

### 3.1 Para quem é
1. **Quem quer começar a vender pela internet sem comprar estoque** (principal; muitas vezes no celular, desconfiado de "dinheiro fácil").
2. **Quem já vende** (Instagram, WhatsApp) e quer loja própria com produtos que outra pessoa envia.
3. **Fornecedor** que quer lojistas vendendo o produto dele (porta secundária).
4. **Parceiro** que indica (porta terciária, no rodapé e no menu).

### 3.2 A ideia única (o que só o SuperDrop tem, e é verdade no sistema)
> **Você vende. O fornecedor separa, etiqueta e envia. O dinheiro de cada um cai na conta de cada um.**

As provas reais que o código sustenta (sem inventar números): pagamento do cliente direto na conta Mercado Pago da loja; custo do produto debitado do saldo recarregado por Pix, com extrato; fornecedor com horário de corte, ondas de separação e etiqueta; esteira ao vivo do pedido; tema grátis e editor visual; sem fidelidade.

### 3.3 As três perguntas da primeira tela (responder nesta ordem)
1. **O que é?** Loja online com produtos de fornecedores que enviam por você.
2. **Por que confiar?** O dinheiro do cliente cai na sua conta; você vê cada pedido andando.
3. **O que faço agora?** Um botão: "Criar minha loja". Um caminho secundário: "Ver como funciona".

### 3.4 Proposta de texto (para o dono escolher; regra do projeto: sem promessa de ganho)

**Herói, opção A (recomendada)**
- Selo pequeno: `Loja online sem estoque`
- Título: **Você vende. O fornecedor envia.**
- Apoio (2 linhas): Monte sua loja com produtos de fornecedores parceiros. Cada pedido pago vai direto para quem separa, etiqueta e entrega ao seu cliente.
- Botão principal: **Criar minha loja** · Secundário (link): **Ver como funciona ↓**
- Linha de confiança: `O pagamento do cliente cai na sua conta · Sem fidelidade · Tema grátis`

**Herói, opção B**
- Título: **Sua loja no ar hoje. O estoque fica com o fornecedor.**

**Herói, opção C**
- Título: **Venda sem estoque, sem galpão e sem embalar nada.**

**Títulos das seções (sem repetir "Tudo")**
| Seção | Título proposto | Apoio |
|---|---|---|
| Como funciona | **Do clique do cliente à caixa na porta** | Quatro passos; você só cuida do primeiro. |
| Bastidores | **Quem envia é quem entende de envio** | Horário de corte, separação em ondas e etiqueta junto com o pedido. |
| Dinheiro | **O dinheiro de cada um, na conta de cada um** | O cliente paga a sua loja. O custo do produto sai do seu saldo. A NextLevel cobra só o que é dela. |
| Loja e temas | **Sua loja com cara de marca, sem programar** | Comece com o tema grátis e mude quando quiser. |
| Quanto sobra | **Faça a conta antes de começar** | Você define o preço; a taxa da plataforma aparece na hora. |
| Planos | **Escolha o plano e abra a loja hoje** | Pague por Pix; o acesso é liberado na confirmação. |
| Fornecedor/parceiro | **Tem produto ou indica lojistas? Também tem lugar para você.** | — |
| Chamada final | **Sua primeira venda começa com a loja no ar.** | Botão: Criar minha loja |

---

## 4. Visual: cores, desenho e ritmo

### 4.1 Cores
- **Problema:** hoje há três "escuros" diferentes na mesma página: o verde-petróleo do herói, o azul do cabeçalho no modo escuro e o **azul-marinho das fotos** do pacote (que têm a faixa marinho para o texto). Eles brigam.
- **Proposta:**
  - **Fundo escuro único:** o azul-marinho das fotos. Retirar a cor exata da faixa esquerda de `hero-key-visual.png` com um conta-gotas e salvar como token da marca, para foto e fundo se emendarem sem costura.
  - **Verde SuperDrop `#2D9E3B` só como sinal:** botão principal, marcadores, a linha do raio. No modo escuro, o botão continua verde cheio com texto escuro (contraste conferido); nada de verde-claro lavado.
  - **Fundo claro:** o creme atual, nas seções de leitura.
- **Cabeçalho:** transparente sobre o herói (nos dois modos) e sólido só depois de rolar. Acaba com o "topo em duas cores".

### 4.2 Desenho
- **Ritmo de cor:** marinho (herói) → creme (como funciona) → marinho (bastidores, com foto) → creme (temas e conta) → branco (planos) → creme (FAQ) → marinho com foto (chamada final). Uma troca por seção, nunca dois escuros seguidos.
- **Foto com função:** cada foto ilustra o que o texto ao lado diz (passo, papel, momento). Nada de foto "decorativa" dentro de cartão.
- **Ícones do pacote** (traço marinho e preenchimento creme): funcionam no **fundo claro**. No escuro, só dentro de uma "ficha" creme. Aposentar os ícones genéricos em círculo verde (lucide) desta página.
- **Menos cartões iguais:** trocar listas de cartões por composições (foto grande + 3 linhas curtas; passos numerados em linha; mosaico).
- **Celular primeiro:** a primeira tela do iPhone precisa mostrar foto, título, botão e o começo da esteira ao vivo, sem rolar.

### 4.3 Movimento
- A esteira ao vivo entra **dentro do herói** (sobre a foto, à direita no computador e logo abaixo do botão no celular).
- Animações de entrada leves; com "reduzir movimento" ligado, tudo aparece parado.
- Nenhuma imagem importante pode depender da animação para aparecer (causa provável do V2).

---

## 5. Onde cada imagem deve ficar

| Imagem | Onde | Como |
|---|---|---|
| `marcas/superdrop/imagens/hero-key-visual` | **Herói** | Fundo de ponta a ponta. Computador: texto sobre a faixa marinho à esquerda. Celular: foto no topo recortada na parte das pessoas (posição ~70% horizontal), e o texto continua abaixo no mesmo marinho, emendado por um degradê. Carregar com prioridade. |
| `sd-hero-celular-venda` | Herói (celular) ou passo "Você vende" | Alternativa vertical (4:5) para a primeira tela do celular, se o recorte da `hero-key-visual` ficar apertado. |
| `icons/*` (6) | **Como funciona** | Um ícone por passo, em fundo claro. |
| `sd-passo-publica`, `sd-passo-vende`, `sd-passo-envia`, `sd-pacote-entregue` | **Como funciona** | Foto de cada passo (4 passos). |
| `sd-hero-fornecedor-separando`, `sd-etiqueta-impressora`, `sd-expedicao-esteira` | **Bastidores** | Mosaico (já existe `MosaicoEditorial`). |
| `capability-02` | **Bastidores** (computador) | Foto larga de abertura do mosaico. Única foto "com as mesmas pessoas" nesta seção. |
| `proof-editorial` | **O dinheiro de cada um** | Foto ao lado dos 3 pontos de prova. |
| `sd-pix-pagamento` | **Quanto sobra** | Ao lado da calculadora. |
| `section-divider` / `system-pattern` | Transições marinho → creme | Faixa decorativa fina, `aria-hidden`, baixa opacidade. |
| `cta-moment` | **Chamada final** | Fundo da chamada final, texto sobre a faixa marinho (mesma lógica do herói). |
| `sd-fornecedor-parceiro` | Bloco fornecedor/parceiro | Foto do aperto de mãos. |
| `capability-01` | Fica de fora desta página | Mesma cena das outras; guardar para `/como-funciona`. |
| `sd-lojista-home-office`, `sd-login-lateral` | Entrar/criar conta | Já estão em uso; manter. |
| `pa-parceiros-hero` | `/parceiros/entrar` e `/parceiros/cadastro` | Trocar a grade verde genérica por essa foto. |

**Faltam (pedir ao GPT ou gerar do sistema):**
1. **Capturas reais de 2 a 3 lojas de demonstração** (tema com produtos e fotos de verdade) para o bloco de temas, no lugar da prévia cinza. Dá para gerar do próprio sistema com Playwright na demonstração, sem pedir ao GPT.
2. (Opcional) **Versão vertical 4:5 do herói** com a mesma cena e faixa marinho em cima, para o celular. Prompt: *"mesma cena de hero-key-visual (equipe embalando caixas kraft com fita verde, galpão claro com plantas), enquadramento vertical 4:5, terço superior em azul-marinho liso #(cor retirada) para texto, luz natural, sem texto, sem logos"*.

---

## 6. Nova ordem da página (de 15 blocos para 9)

| # | Seção | Fundo | Conteúdo | Sai / entra |
|---|---|---|---|---|
| 1 | **Herói** | marinho + `hero-key-visual` | selo, título, apoio, 1 botão + link, linha de confiança, esteira ao vivo | Sai: pílula de cupom, "Área de membros", "Ver planos" como botão |
| 2 | **Faixa de confiança** | creme | 3 pontos curtos (dinheiro na sua conta · fornecedor envia · sem fidelidade) + fornecedores parceiros | Junta "fornecedores do lançamento" |
| 3 | **Como funciona** | creme | 4 passos com ícone + foto; o passo 1 é "você", os outros são "o fornecedor/o sistema" | Junta a vitrine, "problema e promessa" e "como funciona" (as telas do sistema ficam num botão "ver a tela") |
| 4 | **Bastidores** | marinho | mosaico com `capability-02` + 3 fotos | Mantém `MosaicoEditorial` |
| 5 | **O dinheiro de cada um** | creme | `proof-editorial` + 3 pontos + papéis (lojista, fornecedor, parceiro) | Junta "papéis" e `FechoMarca` (sai a duplicação) |
| 6 | **Sua loja com cara de marca** | branco | 2 a 3 capturas reais de lojas + "tema grátis, troque quando quiser" | Sai: prévia cinza e preços de tema |
| 7 | **Faça a conta / Planos** | creme | calculadora + planos, Pix | Junta 8 e 9; sai a foto pequena ao lado |
| 8 | **Perguntas frequentes** | creme | 5 perguntas | Mantém |
| 9 | **Chamada final** | marinho + `cta-moment` | título, 1 botão | Junta `FechoMarca` e "Pronto para abrir a sua loja?" |

Sai inteiro: o bloco de benefícios com ícones em círculo (os 6 itens viram parte dos passos e da seção de dinheiro).

---

## 7. Lista de aceitação (o que o dono confere)
- [ ] Celular, modo claro e escuro: a **primeira tela** mostra a foto, o título, o botão "Criar minha loja" e o começo da esteira, sem rolar.
- [ ] O topo não tem "duas cores"; o cabeçalho some no herói e aparece ao rolar.
- [ ] Nenhuma faixa azul "vazia" aparece fora do herói e da chamada final.
- [ ] Todos os ícones aparecem nos dois modos, também no Safari do iPhone.
- [ ] Nenhum título se repete; "Criar minha loja" aparece no máximo 3 vezes (herói, planos, final).
- [ ] O bloco de temas mostra lojas de verdade, não quadrados cinza.
- [ ] Parceiros: foto no topo; só "Afiliado" aparece como opção aberta, e as "em breve" ficam num link "Agência ou desenvolvedor? Entre na lista".
- [ ] Contraste AA nos dois modos; sem rolagem para os lados em 360 px; teclado e "reduzir movimento" funcionando.
- [ ] Página mais leve: imagem do herói com prioridade e as outras sob demanda, sem "pulos" de layout.
- [ ] Nenhum texto promete ganho; nenhum número ou depoimento inventado.

---

## 8. Prompt engenheiro mestre (para aplicar as recomendações)

> Copie a partir daqui para uma nova sessão do Claude Code, ou peça nesta: "aplica o prompt mestre da home SuperDrop v4".

```
Você é o engenheiro responsável pela página inicial pública do SuperDrop (https://superdrop.com.br),
no repositório NextLevel (Next.js 16 App Router, React 19, TypeScript estrito, Tailwind v4).
Leia antes: CLAUDE.md, AGENTS.md, as skills .claude/skills/pagina-de-vendas/SKILL.md e qa-visual,
e este arquivo inteiro (docs/prompts/superdrop-home-v4-analise-e-prompt.md), que é a especificação.

OBJETIVO
Reconstruir a home do SuperDrop para que, em 5 segundos e no celular, o visitante entenda:
o que é (loja online sem estoque com fornecedores que enviam), por que confiar (o dinheiro do
cliente cai na conta da loja; o pedido anda à vista na esteira) e o que fazer (Criar minha loja).
Ideia central: "Você vende. O fornecedor envia." (opção A da seção 3.4; o dono pode trocar.)

ESCOPO (só isto)
- src/app/(portal)/page.tsx: apenas o ramo SuperDrop (quando brandHas(brand,"dropship")).
  Não altere os ramos de Cargas, Brás, Commerce e "em breve".
- Componentes do portal em src/components/portal/** que a home SuperDrop usa (herói novo,
  passos, faixa de confiança, chamada final). Prefira estender MosaicoEditorial, LiveConveyor,
  SaleCalculator, MemberPlans, HowItWorks e as peças de marca-institucional.tsx a criar novas.
- Cabeçalho público: comportamento transparente sobre o herói, sólido ao rolar, só nas páginas
  que tiverem herói escuro (propriedade opcional; o padrão das outras páginas não muda).
- Páginas /parceiros/entrar e /parceiros/cadastro: foto pa-parceiros-hero no topo; opções
  "em breve" (Agência, Desenvolvedor freelancer) saem do seletor principal e viram link
  "Agência ou desenvolvedor? Entre na lista", que mantém o fluxo de lista de espera atual.
- Correção dos ícones invisíveis no modo claro (V2): imagens importantes não podem depender da
  animação Reveal nem de loading="lazy" para aparecer na primeira dobra; confirmar no WebKit.

FORA DO ESCOPO
Regras de negócio, preços, planos, banco, domínio, pagamentos, textos jurídicos, outras marcas,
painéis internos. Nenhuma migração. Não mexer em getPriceBook nem no catálogo de temas.

ESTRUTURA FINAL (seção 6 deste arquivo; 9 seções, nesta ordem)
1 Herói marinho com hero-key-visual de fundo + LiveConveyor dentro do herói
2 Faixa de confiança (3 pontos + fornecedores parceiros)
3 Como funciona (4 passos com ícones do pacote + fotos sd-passo-*/sd-pacote-entregue;
  as telas do sistema de HowItWorks ficam acessíveis por um botão "ver a tela" em cada passo)
4 Bastidores (MosaicoEditorial com capability-02 + sd-hero-fornecedor-separando,
  sd-etiqueta-impressora, sd-expedicao-esteira)
5 O dinheiro de cada um (proof-editorial + 3 pontos de MARCAS.superdrop.prova + papéis)
6 Sua loja com cara de marca (capturas reais de lojas de demonstração; sem prévia cinza,
  sem preço de tema)
7 Faça a conta + Planos (SaleCalculator + MemberPlans + 3 passos do Pix)
8 Perguntas frequentes (FAQ atual, 5 itens)
9 Chamada final com cta-moment de fundo
Remover: VitrineMarca e FechoMarca desta página (as peças continuam existindo para outras
marcas), o bloco de benefícios com ícones lucide em círculo e os títulos repetidos "Tudo…".

TEXTOS
Use os textos da seção 3.4. Português claro, sem jargão, sem promessa de ganho, sem números,
logos ou depoimentos inventados. "Criar minha loja" no máximo 3 vezes. "Área de membros" só no
cabeçalho. A marca vem de getBrand(); textos fixos de SuperDrop só dentro do ramo SuperDrop.

IMAGENS (seção 5 deste arquivo)
- Herói: <img> (ou next/image, seguindo o padrão do projeto) com fetchPriority="high",
  loading="eager", width/height reservados; srcset com as versões -800 e -1600 em WebP.
  Computador: object-position à direita, texto sobre a faixa marinho. Celular (<768px): foto no
  topo com proporção 4:3 e object-position ~70% 50%, texto abaixo sobre o mesmo marinho, emendado
  por degradê. Se o recorte cortar as pessoas, usar sd-hero-celular-venda como alternativa.
- Retire a cor da faixa marinho de hero-key-visual.png (conta-gotas em Python/PIL) e registre-a
  como token da marca (ex.: --sd-navy) em src/lib/brand-palette.ts ou nos tokens do portal;
  use o mesmo token nos fundos escuros da home para emendar foto e fundo sem costura.
- Ícones do pacote só sobre fundo claro (ou dentro de ficha creme no escuro).
- No máximo 2 fotos com "as mesmas pessoas" (hero-key-visual, capability-*, proof-editorial).
- Todas as demais imagens: loading="lazy", dimensões reservadas, alt descritivo (ou alt="" se
  decorativa, com aria-hidden).
- Capturas de lojas (seção 6): gere com Playwright na demonstração local (bash scripts/restart-demo.sh,
  porta 3100), 2 a 3 lojas com produtos e fotos reais, 1440x900 e 390x844, salvas em
  public/portal/superdrop/v4/ como WebP (<200 KB cada), e registre no MANIFESTO da pasta.

CORES E DESENHO (seção 4)
Fundo escuro único = marinho das fotos; verde #2D9E3B só como sinal (botão principal cheio nos
dois modos, com texto de contraste AA conferido por readableOn); creme para leitura. Uma troca de
fundo por seção, nunca dois escuros seguidos. Sem gradiente genérico, sem cartões iguais em
grade de 3, sem ícone em círculo. Tipografia display atual (--nl-font-display).

QUALIDADE (obrigatório antes de apresentar)
1. npx tsc --noEmit · npx eslint src e2e tests · testes afetados com npx vitest run <arquivo>.
2. A página continua com export const dynamic = "force-dynamic".
3. Conferência visual (skill qa-visual) em 360, 390, 768 e 1440 px, modo claro e escuro,
   topo e 6 pontos de rolagem, em Chromium e WebKit (o dono usa iPhone).
   Compare com as capturas do dono descritas na seção 2 e confirme cada item da seção 7.
4. axe sem violações graves; sem rolagem horizontal em 360 px; "reduzir movimento" respeitado.
5. Primeira dobra no celular: foto + título + botão + início da esteira visíveis sem rolar.
6. npm run build sem "Export encountered".
7. Registre a decisão em docs/design/DECISIONS.md (próximo número livre) e atualize
   docs/prompts/README.md.

ENTREGA
Mostre ao dono as capturas (celular claro e escuro, computador) antes de publicar, com uma
lista curta do que mudou e do que ainda depende dele (escolha do título A/B/C). Publique
(git pull --rebase e git push na branch de publicação) só depois do "pode publicar".
Fale com o dono em português, sem jargão, e sem gastar tokens com testes que não estão na
lista acima.
```
