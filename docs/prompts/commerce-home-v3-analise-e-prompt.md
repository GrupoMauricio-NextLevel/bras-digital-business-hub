# NextLevel Commerce: análise profunda (home, cadastro, entrada e senha) e prompt mestre v3

> Pedido do dono (16/10/2026, depois de navegar no celular por lojas.nextlevelgroup.com.br): "ficou muito a desejar… as imagens não foram bem aplicadas… no início não houve imagem de hero… a página não transmite a mensagem… tem logos do SuperDrop em páginas de login ou recuperação de senha… busque ativamente por problemas, melhore todas as copys… imagens e cores têm que combinar".
>
> **Base desta análise:**
> - 10 capturas do dono (iPhone): início, vitrine do pacote, lojas de exemplo, pagamento, temas, chamada final, cadastro, entrar e recuperar senha.
> - O código atual: `src/components/portal/commerce-home.tsx` e `src/components/portal/commerce/*`, as telas de entrada, cadastro e senha, e os componentes de marca.
> - As 6 fotos e os 6 ícones do pacote (`public/marcas/nextlevel-commerce/imagens/`) e as 13 fotos de `public/portal/commerce/v3/`.
>
> **Método:** as skills do projeto `pagina-de-vendas` (anatomia, ativos, narrativa, verdade), `ux-flow-auditor` (o caminho do visitante até a loja criada) e `qa-visual` (o que conferir nas capturas). Cada problema traz o lugar no código.
>
> Irmão deste documento: `docs/prompts/superdrop-home-v4-analise-e-prompt.md` (mesmo método, já aplicado no SuperDrop; reaproveite as peças).

---

## 1. Veredito

A Commerce tem **o melhor material do grupo**: fotos de marca própria, de vitrine, de checkout e de catálogo, um editor de verdade, temas e planos com simulador. A página, porém:

1. **Promete o que a tela seguinte desmente.** "Criar minha loja grátis" leva a planos de R$ 149 a R$ 499 por mês. "Escolha o plano depois" leva a um cadastro que pede o plano primeiro.
2. **Veste a marca errada.** A logo e a assinatura do SuperDrop aparecem na recuperação de senha, e provavelmente no cadastro e no rodapé das lojas Commerce. Além disso, o amarelo que comanda o início não é cor da Commerce.
3. **Esconde as fotos.** Nenhuma foto no início. A foto principal virou um cartão com um bloco azul vazio. Quatro fotos prontas nunca foram usadas.
4. **Mostra lojas de mentira e vazias.** As lojas de exemplo usam fotos antigas que não combinam com a marca (sofá laranja, calça amarela). Os temas de Celular, Casa e Beleza aparecem com o destaque escuro e vazio.

O resultado é uma página que parece um modelo genérico, quando poderia parecer a Shopify brasileira de quem tem marca própria.

---

## 2. Problemas encontrados (busca ativa)

Gravidade: 🔴 quebra confiança ou promete errado · 🟠 prejudica a conversão · 🟡 acabamento.

### 2.1 Marca errada (vale para todas as marcas, não só Commerce)
| # | Onde | O que acontece | Gravidade |
|---|---|---|---|
| M1 | `src/app/esqueci-senha/page.tsx` (linhas 13 e 19) | **Logo do SuperDrop fixa** e assinatura "SuperDrop é um sistema…" em **todas** as marcas (captura do dono em lojas.nextlevelgroup.com.br). O botão vem azul da Commerce, então a tela mistura duas marcas. | 🔴 |
| M2 | `src/app/redefinir-senha/[token]/page.tsx:16` | Mesma logo fixa do SuperDrop na tela de criar a nova senha (é onde o cliente chega pelo e-mail). | 🔴 |
| M3 | `src/app/cadastro/page.tsx:51` | `NextLevelSignature` sem `product`. O padrão do componente é "SuperDrop", então o rodapé do **cadastro da Commerce** diz "SuperDrop é um sistema de tecnologia…". | 🔴 |
| M4 | `src/components/storefront/sections/sections.tsx:134` | Rodapé das lojas: "Tecnologia [logo SuperDrop]" sempre que `store.offer !== "STORE_OWN"`. Lojas criadas pela Commerce nascem com `STORE_SUBDOMAIN` (padrão em `provisioning.ts:31`), então **a loja do cliente Commerce provavelmente mostra a logo do SuperDrop**. Conferir numa loja Commerce e trocar pela marca da organização (`brandByCode(org.brand)`), como já faz `store/[slug]/layout.tsx:66`. | 🔴 |
| M5 | `src/components/app/blocked-screen.tsx:24` e `:44` | Tela de acesso bloqueado (falta de pagamento) com logo e assinatura do SuperDrop para qualquer marca. | 🔴 |
| M6 | `src/app/not-found.tsx:10` | Página "não encontrada" com logo do SuperDrop em todas as marcas. | 🟠 |
| M7 | `src/components/app/app-shell.tsx:74-76` | Painel sem marca definida cai na logo do SuperDrop. Conferir se algum painel da Commerce chega aqui sem `shellBrand`. | 🟡 (conferir) |
| M8 | `src/components/brand/nextlevel-signature.tsx:5` e `src/components/brand/logo.tsx:22` | A raiz dos problemas: os dois componentes têm **"SuperDrop" como padrão**. O certo é exigir a marca (sem padrão), assim o TypeScript aponta todo lugar esquecido. | 🔴 |

### 2.2 Promessas e textos que se contradizem
| # | Onde | Problema | Proposta |
|---|---|---|---|
| C1 | Início, botão "Criar minha loja grátis" (`hero-v2.tsx`) | A loja não é grátis: são 3 dias grátis, depois o 1º mês por R$ 9,90 e planos de R$ 149 a R$ 499. Quem clica se sente enganado no cadastro. | **"Começar 3 dias grátis"**, com a linha abaixo: "Depois, 1º mês por R$ 9,90 · cancele quando quiser". Os números devem vir da oferta (`offer`), nunca fixos. |
| C2 | Chamada final (`marcas-visuais.ts:88`): "Comece pelo teste grátis e escolha o plano depois." | O cadastro pede o plano **antes** (captura do dono). | "Teste 3 dias grátis. Você escolhe o plano no cadastro e pode trocar depois." (Conferir se a troca de plano existe; se não, retirar "trocar depois".) |
| C3 | Cadastro: "Crie sua loja em 1 minuto" e "Leva 1 minuto" | Promessa de tempo que não se cumpre: montar tema e produtos leva mais. | "Crie sua conta agora e monte a loja no seu ritmo." |
| C4 | Cadastro: "Anual (25% off)" | Inglês sem necessidade. | "Anual (25% de desconto)". |
| C5 | Lojas de exemplo: título "Moda, casa, esporte" e abas "Moda / Casa e decoração / Acessórios" | O título fala de esporte e a aba é de acessórios. | Título e abas iguais aos segmentos mostrados (ou trocar por Moda / Esporte com as lojas reais, ver 5.2). |
| C6 | Filtros de temas: "Sport", "Beauty", "Conecta" (`src/lib/themes/levels.ts`, `FAMILY_INFO`) | Inglês e nome interno ("Conecta"). | "Esporte", "Beleza", "Celular e acessórios". A troca é só do rótulo; a chave interna continua igual. |
| C7 | Níveis dos temas (`LEVEL_INFO`): "Grátis / NextLevel Commerce / Commerce PRO / Commerce ULTIMATE", misturados com Starter/Pro/Elite/Signature no catálogo | Quatro nomes para a mesma escada; "NextLevel Commerce" como **nome de nível** confunde com o produto. | Uma escada só, em português: **Grátis · Profissional · Avançado · Exclusivo**. Registrar decisão. |
| C8 | Início: "A loja virtual da sua marca. E um painel que cuida [dos pedidos/pagamentos/…]" | Frase partida em duas, com palavra girando. A ideia é boa, mas fraca para quem não sabe o que é a plataforma. | Ver 3.4 (título com benefício claro). |
| C9 | Vitrine do pacote: "Tudo o que a sua loja precisa para vender" | Mesmo vício do SuperDrop ("Tudo…"), e repete o bento logo abaixo. | Sai (ver nova ordem). |
| C10 | Bento: "Pix e cartão em até 6x" | O celular de demonstração **cobre o título** no celular ("Pix e cartã…"). | Ver V6. |

### 2.3 Visual, cores e imagens
| # | Onde | Problema | Gravidade |
|---|---|---|---|
| V1 | Início (`hero-v2.tsx`) | Sem foto. Fundo azul com grade e manchas de luz (o "gradiente genérico" que a skill `pagina-de-vendas` proíbe), com 128 px de espaço vazio antes do texto (`pt-32`). A primeira tela do celular é só texto. | 🔴 |
| V2 | Início | **Amarelo** no selo "PLATAFORMA DE LOJAS VIRTUAIS", na palavra que gira e num brilho (`rgba(242,182,0,…)`). A Commerce é azul `#2F81F4` e azul-claro `#71AAFF`, e as fotos são marinho, kraft e azul. O amarelo não aparece em nenhuma foto e briga com tudo. | 🟠 |
| V3 | Topo | Cabeçalho creme sobre o início azul: o mesmo "topo em duas cores" do SuperDrop. | 🟠 |
| V4 | Vitrine do pacote (`VitrineMarca`) | A foto principal (`hero-key-visual`), feita com faixa marinho para texto, virou cartão. Aparece **um terço de bloco azul vazio** (captura das 17:31). | 🔴 |
| V5 | Chamada final (`FechoMarca`) | A foto `cta-moment` (também com faixa marinho) num cartão: outro bloco azul vazio à esquerda (captura das 17:33). Há ainda **duas chamadas finais seguidas**: `ClosingCta` e `FechoMarca`. | 🔴 |
| V6 | Bento "Pagamento" (`bento.tsx:28`) | O celular é `absolute` com `w-[13.5rem]` e no celular de 390 px cobre o título. | 🟠 |
| V7 | Lojas de exemplo (`demo-stores.ts`) | Fotos antigas (sofá laranja, calça amarela em quadra de basquete) que não conversam com o marinho e azul da marca. "sualoja.com.br" e "Fio & Linha" são genéricos. As lojas reais montadas no sistema (Trama Urbana, moda; Linha de Jogo, esporte), com fotos do pacote D86, não aparecem. | 🟠 |
| V8 | Galeria de temas | Os temas de Celular (Ponto Conecta), Casa, Beleza e Atacado **não têm imagens de campanha** (D86: 0 de 17) e aparecem com o destaque escuro e vazio. A galeria abre nesses temas (captura do filtro "Conecta"). | 🟠 |
| V9 | Fotos prontas e **nunca usadas** | `cm-hero-marca-propria` (dona da marca embalando, com notebook e araras: **a foto perfeita para o início**), `cm-temas-ambiente` (loja-conceito, perfeita para temas), `cm-catalogo-fotografia` (fotografando produto, perfeita para catálogo), `cm-pedido-embalado` (sacola com papel azul, perfeita para a chamada final ou o pós-venda). | 🔴 |
| V10 | Cadastro (celular) | Fundo creme liso. A foto `cm-cadastro-lateral` (celular na mão entre caixas) só aparece no computador. | 🟡 |
| V11 | Entrar | Boa (foto do ateliê à noite). O botão "Entrar" usa azul-claro com texto escuro, que parece desbotado. Usar o azul cheio `#2F81F4` com texto branco em 18 px negrito, ou `#0E59B9` com texto branco em qualquer tamanho (contraste AA). | 🟡 |
| V12 | Fotos Commerce × SuperDrop | As duas marcas usam o **mesmo marinho** e cenas parecidas (pessoas, caixas kraft). Sem cuidado, as páginas ficam iguais. Diferença proposta: **SuperDrop = galpão e envio (verde)**; **Commerce = marca, vitrine e cliente (azul)**. Na Commerce, priorizar as fotos de marca própria, vitrine, checkout e catálogo, e deixar as de "embalar caixa" em segundo plano. | 🟠 |

### 2.4 Caminho do visitante (ux-flow-auditor)
1. **Início → "Criar minha loja grátis" → cadastro com preço.** A expectativa quebra no primeiro clique (C1).
2. **Início → "Ver planos" → planos → cadastro** pede o plano de novo. O plano escolhido no simulador deveria ir junto: `/cadastro?plano=pro`, já marcado.
3. **Entrar → "Esqueci a minha senha" → tela com a marca SuperDrop** (M1), e o link do e-mail leva a outra tela com a mesma logo (M2). Quem é cliente Commerce acha que caiu no site errado.
4. **Cliente final da loja → rodapé "Tecnologia SuperDrop"** (M4): o lojista Commerce vê outra marca na loja dele.
5. **Loja bloqueada** (M5): a tela que mais exige confiança ("pague para liberar") está com a marca errada.

---

## 3. A mensagem

### 3.1 Para quem é (do código: `ForWhom`)
1. **Quem vende pelo Instagram e WhatsApp** e perde o controle de quem pagou.
2. **Quem tem loja física** e quer vender também online.
3. **Quem já tem loja em outra plataforma** e quer marca própria com custo claro.

### 3.2 A ideia única (verdadeira no sistema)
> **Sua marca, sua loja, seu dinheiro.** Tema com a cara da marca, Pix e cartão direto na sua conta Mercado Pago, e um painel que junta pedidos da loja, do WhatsApp e do Instagram.

Diferença para o SuperDrop: aqui **o produto é seu** (marca própria, estoque próprio). No SuperDrop, quem tem o estoque é o fornecedor. A página nunca pode deixar isso ambíguo.

### 3.3 As três perguntas da primeira tela
1. **O que é?** Plataforma para criar a loja online da sua marca.
2. **Por que confiar?** O dinheiro das vendas cai direto na sua conta; você vê a loja antes de publicar.
3. **O que faço?** "Começar 3 dias grátis". Secundário: "Ver lojas de exemplo".

### 3.4 Textos propostos

**Início, opção A (recomendada)**
- Selo: `Plataforma de lojas virtuais`
- Título: **A loja da sua marca, pronta para vender.**
- Apoio: Escolha um tema, ajuste no editor e receba por Pix e cartão direto na sua conta. Pedidos da loja, do WhatsApp e do Instagram no mesmo painel.
- Botão: **Começar 3 dias grátis** · Link: **Ver lojas de exemplo ↓**
- Linha de confiança, montada a partir da oferta: `3 dias grátis · depois, 1º mês por R$ 9,90 · cancele quando quiser`

**Início, opção B**
- Título: **Sua marca merece uma loja de verdade.**

**Início, opção C**
- Título: **Do Instagram para a sua própria loja online.**

**Títulos das seções**
| Seção | Título | Apoio |
|---|---|---|
| Lojas de exemplo | **Lojas de verdade, montadas aqui** | Moda e esporte, com temas que você pode usar hoje. Produtos de demonstração. |
| Como começar | **Sua loja no ar em três passos** (mantém) | Crie a conta, escolha o tema, conecte o Mercado Pago. |
| Para quem é | **Para quem já vende e quer uma loja com a própria marca** | — |
| O que vem na loja | **Venda, receba e acompanhe no mesmo painel** | — |
| Personalizar | **A cara da sua marca, sem escrever código** | — |
| Operação | **Depois que a loja está no ar, o painel organiza o resto** | — |
| Temas | **Comece com um tema grátis e mude quando quiser** (mantém) | Pagos têm pagamento único e instalam com 1 clique. |
| Planos | **Um plano para cada momento da loja** | Mova a régua com o quanto você vende e veja o custo com a taxa incluída. |
| Dúvidas | **Perguntas frequentes** | — |
| Chamada final | **Sua marca merece uma loja à altura.** | Teste 3 dias grátis. Botão: Começar 3 dias grátis |

**Cadastro, entrar e senha**
- Cadastro: "Crie sua conta e monte a loja no seu ritmo" · "Escolha o plano. Você começa com 3 dias grátis; depois, Pix ou cartão." · "Anual (25% de desconto)".
- Recuperar senha: logo da marca do endereço; "Recuperar a senha" · "Informe o e-mail da sua conta. Enviamos um link para criar uma nova senha." · assinatura "NextLevel Commerce é um sistema…".

---

## 4. Cores e desenho

- **Paleta da Commerce (já no sistema, `brand-palette.ts`):** azul `#2F81F4`, azul-escuro `#0E59B9`, azul-claro `#71AAFF`.
- **Fundo escuro:** o marinho das fotos do pacote (`#0B1A36`, retirado da faixa de `hero-key-visual`). É o mesmo usado no SuperDrop v4 (`#0D1B34`): pode ser **um token do grupo** (`--nl-navy`), com o destaque mudando por marca.
- **Retirar o amarelo** do início e do brilho; destaque em azul-claro `#71AAFF` sobre o marinho (contraste alto).
- **Botão principal:** azul cheio `#2F81F4` com texto branco em 18 px negrito (contraste 3,8:1, permitido só para texto grande), ou `#0E59B9` com branco em qualquer tamanho (6,7:1). Nada de azul-claro lavado com texto escuro.
- **Cabeçalho marinho enquanto o início está embaixo dele.** Reaproveitar o mecanismo do SuperDrop v4: `data-heroi-escuro` + `CabecalhoSobreHeroi` + CSS em `globals.css`.
- **Ritmo:** marinho (início) → creme (lojas de exemplo) → branco (passos) → creme (bento) → marinho com foto (operação) → creme (temas) → branco (planos) → creme (dúvidas) → marinho com foto (final). Nunca dois escuros seguidos.
- **Ícones do pacote** (traço marinho, preenchimento azul): em fundo claro; no escuro, dentro de ficha clara.
- **Sem grade e sem manchas de luz** no início; a foto faz esse papel.

---

## 5. Imagens: onde cada uma entra

| Imagem | Onde | Como |
|---|---|---|
| `portal/commerce/v3/cm-hero-marca-propria` | **Início** | Fundo de ponta a ponta. No computador, texto à esquerda sobre degradê marinho (a foto não tem faixa vazia, então o degradê precisa ser mais forte: marinho 0–40%). No celular, foto no topo em 16:10 (posição ~60% 45%) e texto abaixo, emendado no marinho. Carregar com prioridade. |
| `marcas/nextlevel-commerce/imagens/hero-key-visual` | Alternativa do início (computador) | Tem a faixa marinho pronta para texto. Escolher **uma** das duas para o início, conferindo nas capturas; a outra vai para "Operação". |
| Celular + painel de demonstração do `HeroV2` (`StoreMock`, `OrdersPanel`) | Logo abaixo do texto do início | Mantém: é a prova viva. Fica sobre o marinho, sobrepondo a borda inferior da foto. |
| Capturas reais das lojas **Trama Urbana** (tema Atelier) e **Linha de Jogo** (tema Pódio) | **Lojas de exemplo** | Substituem `demo-stores.ts` (fotos antigas). Gerar com Playwright em `/demo/atelier` e `/demo/podio` (mesmo script do SuperDrop v4, `public/portal/superdrop/v4/`). Salvar em `public/portal/commerce/v4/`. |
| `cm-temas-ambiente` | **Temas** (abertura) | Faixa larga acima da galeria. |
| `cm-catalogo-fotografia` | Bento "Catálogo" ou "Personalizar" | Mostra "fotografe e cadastre". |
| `cm-checkout-cartao` | Bento "Pagamento" | Já usada; no celular, foto em cima e texto embaixo (corrige V6). |
| `capability-01` / `capability-02` | **Operação** (marinho) | Uma foto larga; as duas mostram as mesmas pessoas, então só uma. |
| `proof-editorial` | Dúvidas ou "Para quem é" | Uma só. |
| `cm-pedido-embalado` | **Chamada final** (computador: à direita, com o texto à esquerda) | Ou `cta-moment` como fundo (tem faixa marinho), como no SuperDrop v4. |
| `cm-cadastro-lateral` | Cadastro **também no celular** | Faixa de 30% da altura no topo. |
| `cm-login-lateral` | Entrar | Já está; manter. |
| `system-pattern` | Transição marinho → creme | Faixa fina, decorativa, baixa opacidade. |
| `icons/*` (6) | Bento e "o que vem na loja" | Em fundo claro. |

**Faltam (pedir ao GPT ou resolver no sistema):**
1. **Banners de campanha** das famílias Casa, Beleza, Celular e Atacado (D86: 0 de 17). Até lá, a galeria **abre em Moda** e os temas sem imagem mostram o aviso "Imagens de demonstração em produção", em vez de destaque vazio.
2. (Opcional) Versão vertical 4:5 de `cm-hero-marca-propria` com o terço superior em marinho liso `#0B1A36`, para o início no celular.

---

## 6. Nova ordem da home (de 13 blocos para 10)

| # | Seção | Fundo | O que muda |
|---|---|---|---|
| 1 | **Início** | marinho + `cm-hero-marca-propria` | Título A, botão "Começar 3 dias grátis", sem amarelo, sem grade, sem `pt-32`; celular e painel de demonstração abaixo do texto. Cabeçalho marinho junto. |
| 2 | **Faixa de recursos** (`Marquee`) | creme | Mantém, mais discreta. |
| 3 | **Lojas de verdade, montadas aqui** | creme | Capturas de Trama Urbana e Linha de Jogo no lugar de `demo-stores.ts`; abas = segmentos mostrados. |
| 4 | **Sua loja no ar em três passos** | branco | Mantém `Steps`. |
| 5 | **Para quem é** | creme | Mantém `ForWhom`; troca a foto pequena por `cm-hero-celular-vitrine` maior ao lado. |
| 6 | **Venda, receba e acompanhe** (`Bento`) | branco | Corrige o celular sobre o título; usa ícones e `cm-catalogo-fotografia`. |
| 7 | **A cara da sua marca** (`Personalize`) | creme | Mantém. |
| 8 | **Operação** | marinho + `capability-02` | Mantém `Operation`, com foto. |
| 9 | **Temas** | creme + `cm-temas-ambiente` | Galeria abre em Moda; rótulos em português; níveis com nomes novos. |
| 10 | **Planos** | branco | Plano escolhido vai para `/cadastro?plano=…`. |
| 11 | **Perguntas frequentes** | creme | Mantém. |
| 12 | **Chamada final** | marinho + `cta-moment` de fundo | **Uma** chamada só (sai `FechoMarca`, fica `ClosingCta` com foto e texto novo). |

Saem: `VitrineMarca` (repete o bento e cria o bloco azul vazio) e `FechoMarca` (chamada duplicada).

---

## 7. Lista de aceitação
- [ ] **Nenhuma** tela de lojas.nextlevelgroup.com.br mostra logo ou nome do SuperDrop: início, entrar, cadastro, recuperar senha, nova senha, 404, loja bloqueada, rodapé das lojas Commerce, painel.
- [ ] `Logo` e `NextLevelSignature` sem marca padrão; o TypeScript acusa qualquer uso sem marca.
- [ ] Celular, claro e escuro: a primeira tela mostra foto, título, botão e o início da demonstração; o topo tem uma cor só.
- [ ] Nenhuma promessa contradita: "grátis" só junto de "3 dias", com o valor depois; nada de "1 minuto"; nada de "escolha o plano depois".
- [ ] Nenhum bloco azul vazio fora do início e da chamada final.
- [ ] Sem amarelo na Commerce (só azuis e marinho, mais os neutros).
- [ ] Lojas de exemplo com capturas reais; temas abrindo em Moda; nenhum destaque vazio sem aviso.
- [ ] Rótulos em português (Esporte, Beleza, Celular e acessórios; "25% de desconto"); níveis de tema com os nomes novos.
- [ ] Bento "Pagamento" sem nada cobrindo o título em 360 e 390 px.
- [ ] Contraste AA, sem rolagem para os lados em 360 px, teclado e "reduzir movimento" funcionando; o SuperDrop continua igual onde não foi pedido.

---

## 8. Prompt engenheiro mestre (para aplicar as recomendações)

> Para usar: peça "aplica o prompt mestre da Commerce v3, título A" (ou B/C).

```
Você é o engenheiro responsável pelas páginas públicas e de acesso da NextLevel Commerce
(https://lojas.nextlevelgroup.com.br) no repositório NextLevel (Next.js 16 App Router, React 19,
TypeScript estrito, Tailwind v4, Drizzle). Leia antes: CLAUDE.md, AGENTS.md, as skills
.claude/skills/pagina-de-vendas, qa-visual e (kit) ux-flow-auditor, e este arquivo inteiro
(docs/prompts/commerce-home-v3-analise-e-prompt.md), que é a especificação. O SuperDrop v4
(src/components/portal/superdrop/*) já resolveu herói com foto, cabeçalho marinho e capturas
reais de lojas: reaproveite essas peças em vez de copiar.

ORDEM DE TRABALHO (cada etapa testada antes da próxima)

ETAPA 1: Marca certa em todas as telas (prioridade máxima; vale para todas as marcas)
- src/components/brand/logo.tsx e nextlevel-signature.tsx: retirar o padrão "SuperDrop";
  a marca passa a ser obrigatória. Corrigir cada uso que o TypeScript acusar.
- esqueci-senha, redefinir-senha/[token], cadastro (assinatura), not-found, blocked-screen,
  app-shell (sem shellBrand): usar a marca do endereço (getBrand() + BrandLogo; assinatura com
  product={brand.name}).
- storefront/sections/sections.tsx:134: "Tecnologia" com a marca da ORGANIZAÇÃO da loja
  (mesma regra de store/[slug]/layout.tsx:66), nunca a logo do SuperDrop fixa. Lojas SuperDrop
  continuam mostrando SuperDrop (sem mudança de comportamento para elas).
- Teste novo (Vitest): para cada marca (SUPERDROP, NEXTLEVEL_COMMERCE, BRAS_DIGITAL), a
  assinatura e a logo das telas de senha e do rodapé da loja usam a marca certa. E2E rápido:
  cm.test:3300/esqueci-senha não contém "SuperDrop".

ETAPA 2: Textos que não se contradizem
- hero-v2.tsx, sections.tsx (Steps, ClosingCta), marcas-visuais.ts (nextlevel-commerce.cta),
  cadastro: aplicar a seção 3.4. Valores da oferta sempre de commercePlansView/offer, nunca fixos.
- levels.ts: rótulos das famílias em português (Esporte, Beleza, Celular e acessórios) e escada de
  níveis "Grátis · Profissional · Avançado · Exclusivo" (só rótulos; chaves e preços iguais).
  Atualizar testes que conferem esses textos. Registrar decisão em DECISIONS.md.
- Planos → cadastro: levar o plano escolhido (?plano=) e deixá-lo marcado no cadastro.

ETAPA 3: Home com foto, cores certas e nova ordem (seção 6)
- Herói: foto cm-hero-marca-propria (ou hero-key-visual, escolha pelas capturas) com fetchPriority
  alta e dimensões reservadas; sem cm-grid-bg, sem manchas, sem amarelo (text-highlight e o brilho
  rgba(242,182,0)); destaque #71AAFF; botão azul cheio com contraste AA; pt reduzido no celular.
  Cabeçalho marinho sobre o herói com data-heroi-escuro + CabecalhoSobreHeroi (já existe).
- Retirar VitrineMarca e FechoMarca da home Commerce; ClosingCta ganha cta-moment de fundo.
- Lojas de exemplo: capturas reais (Playwright) de /demo/atelier e /demo/podio, 1440x900 e
  390x844, WebP < 200 KB em public/portal/commerce/v4/ + MANIFESTO; StoreGallery passa a usar as
  capturas (com o celular de demonstração já existente) e as abas seguem os segmentos.
- Bento "Pagamento": no celular, o aparelho vai abaixo do título (sem absolute < md).
- Temas: abrir em Moda; família sem imagens de campanha mostra aviso em vez de destaque vazio;
  cm-temas-ambiente na abertura da seção.
- Cadastro no celular com a faixa de foto cm-cadastro-lateral.
- Fotos com função (tabela da seção 5); no máximo uma das fotos "com as mesmas pessoas".

FORA DO ESCOPO
Preços, planos, regras de cobrança, banco, migrações, pagamentos, painéis internos (exceto a
logo do app-shell), páginas do SuperDrop e da Brás (exceto a correção de marca da Etapa 1).

QUALIDADE (obrigatório antes de apresentar)
1. npx tsc --noEmit · npx eslint src e2e tests · npx vitest run nos arquivos afetados.
2. Páginas com banco continuam com export const dynamic = "force-dynamic".
3. qa-visual: 360, 390, 768 e 1440 px, claro e escuro, topo e 6 pontos de rolagem; também
   cadastro, entrar, recuperar senha, nova senha, 404 e uma loja Commerce (rodapé).
   Comparar com as capturas do dono descritas na seção 2 e marcar cada item da seção 7.
4. axe sem violações graves; sem rolagem horizontal em 360 px.
5. npm run build sem "Export encountered".
6. DECISIONS.md (próximo número livre) e docs/prompts/README.md atualizados.

ENTREGA
Capturas do celular (claro e escuro) e do computador ao dono, com a lista curta do que mudou e do
que depende dele (título A/B/C; nomes dos níveis). Publicar só depois do "pode publicar".
Português claro, sem jargão, sem testes fora desta lista.
```
