# Auditoria visual de cores do grupo NextLevel + prompt para o Codex

> **Pedido do dono (2026-10-12):** "confirma todas as marcas que já criamos; quais cores elas usam hoje no sistema e nas páginas públicas; quero desenvolver um projeto visual para painéis internos e páginas públicas lá no Codex; me entrega um .md com um prompt explicando a auditoria visual de cores, para analisar o que está no ar e sincronizar de vez esse visual. Marcas fortes, cores que se comunicam no sistema e nas páginas públicas."
>
> **Como usar:**
> 1. Leia as seções 1 a 3: são a fotografia de hoje, levantada no código que está no ar.
> 2. Abra o Codex na cópia do repositório, numa branch própria (ex.: `codex/cores`).
> 3. Cole **todo o bloco da seção 5**. O Codex começa pela Fase 0 (só auditoria, sem mudar nada) e devolve o relatório e as pranchas para você aprovar.
> 4. Só depois da sua aprovação ele passa às fases seguintes. Nada vai para o ar sem você aprovar (regra do `AGENTS.md`).

---

## 1. Marcas: o que já foi criado até aqui

Fontes conferidas: `src/lib/brand.ts` (marcas que o sistema reconhece pelo endereço), o kit **brand-system-v2** (o ZIP enviado pelo dono em 2026-10-12 é idêntico à pasta `brand-system-v2/` do repositório; aprovado em D79), as decisões D108 e D112 e os prompts em `docs/prompts/`.

### 1.1 Marcas com endereço próprio no sistema (7)

| Marca | Endereço | Situação | Logo | Está no kit v2? |
|---|---|---|---|---|
| **NextLevel Soluções Digitais** (holding; Master e página "Soluções") | master.nextlevelgroup.com.br | No ar | Oficial (raio amarelo) | Sim |
| **SuperDrop** | superdrop.com.br | No ar, com clientes | Oficial (raio verde) | Sim |
| **NextLevel Commerce** | lojas.nextlevelgroup.com.br (nextlevelcommerce.com.br a registrar) | No ar | Oficial (raio azul) | Sim |
| **Brás Digital** | bras.nextlevelgroup.com.br | No ar | **Não tem**: logo NextLevel + "Brás Digital" em texto | Só a cor (planejada, sem logo) |
| **NextLevel Cargas** | cargas.nextlevelgroup.com.br | No ar (D108) | **Não tem**: logo NextLevel + "Cargas" em texto | **Não**: nasceu depois do kit; a cor índigo foi escolhida só no código |
| **Creators Hub** (no sistema aparece como "Hub Creators") | — | "Em breve" | Oficial (raio magenta) | Sim |
| **China Hub** | — | "Em breve" | Não tem | Só a cor (planejada) |

### 1.2 Marca do kit que não existe no sistema

| Marca | Situação |
|---|---|
| **NextLevel Play** (feed, lives e compras) | Cor reservada no kit (violeta `#A15EDD`), sem logo. No código existe só um tema de cores "play", sem marca nem endereço |

### 1.3 Programas e submarcas dentro das marcas (sem cor nem logo próprios)

- **Club** (pontos do ecossistema), com **Club+** e **Club Total**.
- **Excursão** (ônibus de excursão, rotas e fardos).
- **Meu Contador**.
- **Programa de Parceiros** (escritório do parceiro).
- **Loja NextLevel**.
- **Academy do lojista**.
- **Estúdio de gravação** (demonstração).

Hoje cada um usa a cor da marca onde aparece. Se algum deles deve virar marca visual (por exemplo o Club, que atravessa todas as marcas), é uma decisão do dono.

### 1.4 Empresas do grupo (D112: não são marcas do sistema)

Aparecem como selo "empresa do grupo", sem cor própria:
- **NextLevel Marketing Ltda** (todas as marcas e sistemas);
- **Starline Viagens e Turismo** / **Mauricio Turismo** (ônibus e cargas);
- **Mega Tron** (atacado; a proposta de "marca da casa" ficou só no papel, `docs/recuperado/`).

> **Pergunta ao dono:** quais marcas estão faltando nesta lista? Elas entram na seção 1 antes de o Codex começar. O kit também precisa receber a NextLevel Cargas e as que você indicar.

## 2. Cores em uso hoje

### 2.1 Base comum a todas as marcas (D79)

| Papel | Claro | Escuro |
|---|---|---|
| Fundo (papel) | off-white `#F4F1E9` | `#0B1427` |
| Superfície (cartões) | branco `#FFFFFF` | navy `#101B34` |
| Tinta (texto) | navy `#101B34` | off-white `#F4F1E9` |
| Destaque do grupo (apoio) | amarelo `#F5BC00` (texto: bronze `#7B4C00`) | `#F5BC00` |

### 2.2 Cor de cada marca: logo × botões e links × página pública

Coluna "Assinatura (kit v2)": a cor da marca no kit aprovado, usada no raio da logo. Coluna "Botão": a versão escurecida do kit para botões com texto branco (o sistema segue o kit aqui).

| Marca | No **logo** (raio) | Botão e seleção nos **painéis**, claro | Link, claro | Botão e link, escuro | **Página pública** hoje |
|---|---|---|---|---|---|
| NextLevel | `#F5BC00` | `#F5BC00` (barra lateral navy `#101B34`) | `#7B4C00` | `#F5BC00` | Tema do sistema; faixa escura **`#30322D`** (navy misturado com amarelo, fica cinza-oliva) |
| SuperDrop | **`#2D9E3B`** | **`#118728`** | `#03721D` | `#62C268` | Tema do sistema; faixa escura **`#102A32`** (verde-petróleo); brilhos em `rgba(34,197,94)` (verde genérico do Tailwind, não é o da marca) |
| Commerce | **`#2F81F4`** | **`#196BD8`** | `#0E59B9` | `#71AAFF` | Tema do sistema + `commerce.css` (amarelo **`#F2B600`**, escuro `#0B1220`, verde `rgba(5,150,105)` no ponto "ao vivo") |
| Brás Digital | — (kit: `#D35C00`, **não usada em lugar nenhum**) | `#B34D00` | `#974000` | `#FB8342` | **CSS próprio** `bras.css` + `bras-ui.tsx` (55 cores fixas): navy `#101B34`/`#18264A`/`#16213D`, laranja `#B34D00`/`#FB8342`/`#FF9A62`, verde `#17643A` e `rgba(5,150,105)` |
| NextLevel Cargas | — (fora do kit) | `#4B4FD8` | `#3A3DBE` | `#9EA2FF` | **CSS próprio** `cargas.css` + `cargas-home.tsx`: navy **`#0D1630`**/`#16234A`, índigo `#4B4FD8`, "placa" amarela `#F5BC00`/`#FFCB2F`, verde `rgba(16,185,129)` |
| Creators Hub | `#D44790` | `#BA327B` | `#9E2567` | `#F975B5` | Página "em breve" |
| China Hub | — (kit: `#00979D`, não usada) | `#008085` | `#006B70` | `#3BBEC5` | Página "em breve" |
| NextLevel Play | — (kit: `#A15EDD`) | `#8B4AC3` (só no tema "play") | `#753CA6` | `#C588FF` | Não existe |

Por que o logo e o botão têm cores diferentes: a cor do logo (`#2D9E3B`, `#2F81F4`) não passa no contraste AA como botão com texto branco. Por isso o sistema escureceu a cor para os botões (`#118728`, `#196BD8`). A escolha tem motivo, mas **não está documentada como regra de marca** e faz o verde do logo parecer outro verde.

### 2.3 Como a cor chega à tela (três caminhos ao mesmo tempo)

1. **Tema do sistema** (`src/design-system/themes.ts`, variáveis `--ds-*`). Vale para todos os painéis e para as páginas públicas do SuperDrop, da Commerce e de Soluções. Calcula sozinho a faixa escura, a barra lateral (9% da cor da marca no claro), o fundo do topo e os estados, e é conferido por testes de contraste.
2. **Paleta da marca** (`src/lib/brand-palette.ts`, variáveis `--brand-*`). Hoje só a tela de entrada, o cadastro de parceiros, o Estúdio de gravação e a home da Brás a usam.
3. **CSS próprio de cada página pública**: `bras.css` (prefixo `bd-`), `cargas.css` (`cg-`) e `commerce.css` (`cm-`). Cada um tem as próprias variáveis e repete à mão o navy, o papel e a cor da marca, às vezes com outro tom.

Fora desses três caminhos ainda há **cores fixas espalhadas**:
- cerca de 40 arquivos com código de cor escrito direto. Os maiores são `bras-ui.tsx` (55), `cargas-home.tsx` (27), `bras-home.tsx` (20), `store-mock.tsx` (15) e `product-art.tsx` (14);
- 23 telas com classes de cor prontas do Tailwind (`neutral`, `amber`, `emerald`, `sky`, `green`, `red`, `indigo`), cerca de 175 usos;
- o link dos e-mails está fixo em verde `#0B6B34` para **todas** as marcas, inclusive Brás e Cargas (`src/lib/email.ts`).

### 2.4 Cores de imagem (direção de arte dos prompts do GPT)

As fotos e ilustrações seguem os prompts `docs/prompts/imagens-*.md`:
- base navy `#101B34` e off-white `#F4F1E9`;
- acentos SuperDrop `#2D9E3B`, Commerce `#2F81F4`, NextLevel `#F5BC00` e Brás `#FB8342`;
- ilustrações dos painéis com acento `#5B7BA6`.

Ou seja, **as fotos usam a cor do logo e os botões usam a cor escurecida**.

## 3. O que já dá para ver (pontos para a auditoria confirmar)

1. **Três navies diferentes** para o mesmo papel: `#101B34` (oficial), `#0D1630` (Cargas) e `#16213D`/`#18264A`/`#0B1220` (Brás e Commerce), além das faixas calculadas (`#102A32`, `#11264B`, `#30322D`…).
2. **Faixa escura da NextLevel e do Master** sai cinza-oliva (`#30322D`), porque a mistura de navy com amarelo não combina; a do SuperDrop sai verde-petróleo.
3. **Dois verdes, dois azuis e três laranjas** por marca (logo × botão × CSS próprio), sem regra escrita de quando usar cada um.
4. **Verdes e amarelos "de fora"** (Tailwind `green-500`, `amber-500`, `emerald`) em brilhos e pontos "ao vivo", inclusive nas páginas da Brás e da Cargas.
5. **Brás e Cargas** têm páginas públicas fora do sistema de tema: trocar uma cor no tema não muda essas páginas.
6. **Brás, Cargas e China** não têm logo própria, só texto ao lado da logo NextLevel. A Brás tem só a cor e a Cargas só o índigo.
7. **Amarelo do grupo** aparece em três tons (`#F5BC00`, `#F2B600` e `#FFCB2F`).
8. E-mail com link verde em todas as marcas.
9. **Estados e gráficos se confundem com marcas:**
   - o verde de "sucesso" (`#007E4D`) é vizinho do verde SuperDrop;
   - o azul de "informação" (`#0075A5`) é vizinho do azul Commerce;
   - as cores dos gráficos (`#2A78D6`, `#008300` e `#EB6834`) parecem Commerce, SuperDrop e Brás.
10. **Cor de assinatura do kit sem uso:**
    - Brás (`#D35C00`) e China Hub (`#00979D`) só existem no papel;
    - os prompts de imagem usam `#FB8342` para a Brás (tom do modo escuro), não a assinatura do kit.
11. **NextLevel Cargas** não está no kit nem tem logo; a cor dela só existe no código.

---

## 4. Objetivo do projeto visual

**Marcas fortes, cores que conversam:** cada marca reconhecível em 1 segundo, nas páginas públicas e nos painéis, com a mesma "família NextLevel" por baixo. Uma fonte de verdade para cor, **sem nenhuma cor escrita à mão fora dela**. Contraste AA garantido por teste.

---

## 5. O PROMPT (copie todo o bloco para o Codex)

```
PAPEL
Você é diretor de design de sistemas e engenheiro de front-end sênior do Grupo NextLevel. O grupo tem várias marcas sobre o MESMO sistema
(Next.js 16, React 19, Tailwind v4, TypeScript estrito), mesmo repositório e mesmo banco:
NextLevel Soluções Digitais (holding, Master e página Soluções), SuperDrop, NextLevel Commerce, Brás Digital, NextLevel Cargas, Creators Hub (em breve),
China Hub (em breve) e NextLevel Play (só no kit), mais os programas Club, Excursão, Meu Contador, Parceiros, Loja NextLevel e Academy.
O kit de marca aprovado é brand-system-v2/ (D79): neutros navy #101B34 e off-white #F4F1E9, um raio colorido por marca, amarelo #F5BC00 do grupo.
O dono aceita refazer tudo se for preciso; o kit é o ponto de partida, não uma amarra.
O dono quer "marcas fortes, cores que se comunicam no sistema e nas páginas públicas" e sincronizar de vez o visual.

REGRAS DO REPOSITÓRIO (obrigatórias)
- Leia antes: AGENTS.md, CLAUDE.md, docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md (autoridade máxima), docs/design/DECISIONS.md (D42, D79, D81, D108),
  docs/design/DIRECAO-VISUAL-V4.md, o kit brand-system-v2/ inteiro (LEIA-ME.md, estrategia.md, paletas.json, tokens.css, contrastes.csv, comparativo.png) e este arquivo (docs/prompts/auditoria-visual-cores-codex.md).
- Trabalhe numa branch própria (ex.: codex/cores). Nada vai para a branch de publicação nem para o ar sem o dono aprovar as capturas.
- Não mude lógica, dados, textos comerciais, preços nem regras de negócio. Sua área é cor, tokens e o aspecto das telas.
- A marca vem do endereço (getBrand()), nunca fixa em componente. Nenhum "se marca X" dentro de componente: componentes leem só variáveis.
- O tema das lojas dos lojistas (src/lib/themes/**, vitrines /store/*) é do lojista e FICA FORA deste projeto.
- Acessibilidade AA: texto ≥ 4,5:1, texto grande e ícones ≥ 3:1, foco visível; sem rolagem horizontal em 360 px; respeitar prefers-reduced-motion.
- Antes de cada entrega: npx tsc --noEmit, npx eslint src e2e tests, npx vitest run tests/brand-palette.test.ts tests/design-system.test.ts e npm run build.
- Textos ao dono em português claro, sem jargão.

ONDE A COR VIVE HOJE (ponto de partida; confirme tudo)
1. src/design-system/themes.ts → variáveis --ds-* (painéis e páginas públicas de SuperDrop, Commerce e Soluções). Calcula faixa escura,
   barra lateral, fundo do topo e estados, e é conferido por tests/design-system.test.ts.
2. src/lib/brand-palette.ts → variáveis --brand-* (usado só em login, cadastro de parceiros, Estúdio de gravação e home da Brás).
3. CSS próprio das páginas públicas: src/components/portal/bras/bras.css (bd-), src/components/portal/cargas/cargas.css (cg-),
   src/components/portal/commerce/commerce.css (cm-), mais cores fixas em bras-ui.tsx, bras-home.tsx, cargas-home.tsx, cargas-form.tsx,
   store-mock.tsx, store-gallery.tsx, personalize.tsx, device.tsx, product-art.tsx, video-card.tsx, hero-v2.tsx, seja-fornecedor e parceiros (brilhos rgba).
4. Classes de cor prontas do Tailwind (neutral, amber, emerald, sky, green, red, indigo) em cerca de 23 telas.
5. Logos v2 em public/brand/v2/<marca>/{claro,escuro}/ (cor do raio: SuperDrop #2D9E3B, Commerce #2F81F4, NextLevel #F5BC00, Creators #D44790).
6. E-mail: src/lib/email.ts (link verde fixo #0B6B34 para todas as marcas; faixa de topo por marca).
7. Prévia de link: src/lib/og-marca.ts e src/app/og/[arquivo]/route.tsx.
8. Imagens: docs/prompts/imagens-*.md (acentos #2D9E3B, #2F81F4, #F5BC00, #FB8342; ilustrações #5B7BA6).

FASE 0 — AUDITORIA (só levantar, NÃO mudar nada no visual)
Entregue docs/design/AUDITORIA-CORES-2026-10.md com:
A. Inventário automático: um script em scripts/auditoria-cores.mjs que varre src/ (fora src/lib/themes e vitrines) e lista cada cor escrita à mão
   (hex, rgb/rgba, hsl, classes Tailwind de cor), com arquivo, linha, a marca e a tela afetadas. Agrupe por "mesma cor com nomes diferentes"
   (ex.: navies #101B34, #0D1630, #16213D, #18264A, #0B1220) e por "cor que não é de nenhuma marca" (ex.: green-500, amber-500, emerald).
B. Kit × sistema: compare brand-system-v2/paletas.json (assinatura, papéis claro/escuro, semânticos, neutros) com themes.ts e brand-palette.ts e
   liste cada diferença; aponte marcas que estão no sistema e não no kit (NextLevel Cargas) e no kit e não no sistema (NextLevel Play).
C. Tabela de tokens: para cada marca e cada modo (claro/escuro), os valores reais calculados de --ds-* e --brand-* (canvas, surface, ink, primary,
   link, band, sideBg, sideActiveBg, heroFrom/heroTo, ring, estados). Gere-a executando themeColors() e paletteOf(), não à mão.
D. Capturas: para cada marca no ar (NextLevel/Master, SuperDrop, Commerce, Brás, Cargas), em 360 e 1440 px, claro e escuro:
   página inicial pública, uma página interna pública (planos ou como funciona), login, cadastro, e o painel principal de cada papel
   (Master, fornecedor, lojista SuperDrop, lojista Commerce, parceiro, membro Brás, importadora, transportadora).
   Use o servidor de demonstração (bash scripts/restart-demo.sh, porta 3100; contas e senha em /gravacao) e playwright-core
   (Chromium em /opt/pw-browsers/chromium). Monte uma PRANCHA por marca (público × painel lado a lado) e uma prancha comparando as marcas entre si.
E. Diagnóstico, em português simples: onde cada marca está forte, onde está apagada, onde duas marcas se confundem, onde a página pública
   e o painel da mesma marca parecem empresas diferentes, contraste que falha (axe), e as cores "de fora".
F. As perguntas que o dono precisa responder (seção PERGUNTAS abaixo), com a sua recomendação em cada uma.
Pare aqui e entregue. Não avance sem a aprovação do dono.

FASE 1 — PROPOSTA DO SISTEMA DE CORES SINCRONIZADO (depois da aprovação da Fase 0)
Proponha, com pranchas e tabela de contraste:
1. UMA fonte de verdade: um único arquivo de definição de marca (ex.: src/design-system/marcas.ts) do qual saem --ds-*, --brand-*, e-mail,
   prévia de link e o texto de acento dos prompts de imagem. brand-palette.ts e themes.ts passam a ler dele (sem duplicar valores).
2. Papéis por marca, iguais para todas:
   - assinatura (cor do logo e das fotos);
   - ação (botão, AA com o texto dele);
   - ação-texto (link sobre papel);
   - ação-escuro;
   - faixa escura;
   - suave (fundos de seleção);
   - apoio (amarelo do grupo).
   Regra escrita de quando usar cada papel.
3. Base comum: navy oficial #101B34 e papel #F4F1E9 como as ÚNICAS bases (decidir se a faixa escura de cada marca é o navy puro ou o navy com um
   toque da marca, e corrigir a faixa da NextLevel que hoje sai #30322D).
4. Relação logo × botão: decidir entre (a) manter a cor do logo e escurecer só onde precisa de contraste, documentado; ou (b) ajustar a cor do
   logo para a mesma do botão. Mostrar as duas lado a lado.
5. Estados (sucesso, aviso, erro, informação) e cores de gráfico iguais em todas as marcas, que não se confundam com a cor de nenhuma marca
   (ex.: o verde de "sucesso" não pode parecer o SuperDrop; o azul de "informação" não pode parecer a Commerce).
6. Assinatura do grupo nas páginas públicas e nos painéis: como as marcas "se comunicam" (rodapé, fio do grupo D132, barra do ecossistema, seletor de marcas),
   sem perder a força de cada uma.
7. Brás, Cargas, China e Play: proposta de cor e de aplicação da marca, coerentes com as demais. Para quem não tem logo, um rascunho de raio na
   cor da marca seguindo a família do kit (lettering inclinado + raio + descritor), só como proposta: logo é decisão do dono (D79).
8. Programas (Club, Excursão, Meu Contador, Parceiros, Loja NextLevel, Academy): regra de como aparecem dentro de cada marca e se o Club
   (que atravessa todas) ganha identidade própria.

FASE 2 — APLICAR (depois da aprovação da Fase 1), em etapas pequenas, uma marca por vez, começando pelo SuperDrop (em produção, com clientes)
1. Implementar a fonte única e fazer themes.ts e brand-palette.ts lerem dela; testes de contraste cobrindo TODOS os papéis de todas as marcas.
2. Levar bras.css, cargas.css e commerce.css para as variáveis do sistema (pode manter o prefixo e o layout; só a COR passa a vir do token).
3. Trocar as cores escritas à mão e as classes de cor do Tailwind pelos tokens. Exceções: só ilustração/mock com motivo escrito no código.
4. E-mail com a cor da própria marca, prévia de link e prompts de imagem lendo os mesmos valores.
5. Um teste que FALHA se aparecer cor escrita à mão nova fora da fonte única (lista de exceções explícita).
6. Capturas antes/depois de cada tela da Fase 0, nas mesmas larguras e modos, para o dono aprovar antes de publicar.

FASE 3 — CONFERÊNCIA FINAL
- axe sem violações graves nas telas da Fase 0 (e2e/polish-v8.mjs como base), sem rolagem horizontal em 360 px.
- npm run build sem "Export encountered"; npx vitest run completo verde.
- Registro da decisão em docs/design/DECISIONS.md (próximo número livre) e atualização de docs/design/DIRECAO-VISUAL-V4.md.

PERGUNTAS PARA O DONO (traga a sua recomendação em cada uma)
1. Cor do logo × cor do botão: mesma cor em tudo (ajustando o logo) ou cor do logo só no logo e nas fotos?
2. Faixa escura das páginas: navy puro em todas as marcas (o grupo fica mais unido) ou navy com toque da marca (cada marca mais forte)?
3. Amarelo do grupo: aparece em todas as marcas (assinatura NextLevel) ou só na NextLevel e no Master?
4. Brás e Cargas: continuam com página pública "autoral" (layout próprio), só com cores sincronizadas, ou entram na família pública padrão?
5. Modo escuro: padrão claro para todos, ou alguma marca nasce escura (ex.: Cargas, Creators)?
6. Quais marcas e programas entram no sistema visual agora (a seção 1 deste arquivo) e quais ficam para depois?
7. A NextLevel Cargas entra no kit com o índigo atual (#4B4FD8) ou ganha outra cor da escala do kit?

ENTREGA DE CADA FASE
- Caminho dos arquivos, pranchas (imagens) e um resumo de 10 linhas em português para o dono.
- O que foi medido e o que NÃO foi medido.
- Uma pergunta de aprovação no final.
```

---

## 6. Critérios de aceite do projeto inteiro

- Cada cor do sistema vem de **um único arquivo**; um teste impede cor escrita à mão nova.
- Página pública e painel da mesma marca usam **as mesmas cores de assinatura e de ação**.
- Uma pessoa reconhece a marca pela cor em 1 segundo (prancha comparativa aprovada pelo dono).
- Contraste AA em todos os papéis e modos, conferido por teste; axe sem violações graves; 360 px sem rolagem lateral.
- SuperDrop (em produção) muda só depois de capturas antes/depois aprovadas.
- Lojas dos lojistas (temas) intactas.
