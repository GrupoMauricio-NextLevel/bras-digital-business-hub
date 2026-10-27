# Fotos do Mauricio e da equipe NextLevel: análise e prompt engenheiro mestre para dar vida às marcas

> **Estado:** PARA AVALIAÇÃO DO DONO (2026-10-27). Nada foi implantado. Este documento analisa as 5 fotos enviadas na conversa, propõe onde cada uma entra (páginas públicas e painéis internos, marca por marca) e traz o prompt em fases para executar **depois** que o dono responder as perguntas da seção 9.
>
> **Skills usadas na execução:**
> - `pagina-de-vendas`: contrato de ativos, verdade, desempenho;
> - `painel-interno`: o lugar certo de uma foto numa tela de trabalho;
> - `qa-visual`: capturas em 360, 768 e 1440 px;
> - `desempenho`: peso e tempo de carregamento;
> - `publicar`.
>
> **Ordem normativa:** Constituição > `docs/design/DECISIONS.md` > este documento. **Regra de foco D174:** 60% E-commerce, 25% SuperDrop, 15% o resto.

---

## 0. Resumo para o dono (sem jargão)

Até hoje, todas as fotos de gente no sistema são **personagens criados no GPT**:
- a Juliana e o Rodrigo da E-commerce;
- os lojistas da SuperDrop;
- o pessoal da Brás e da Cargas.

Elas mostram **o cliente usando o produto**. O que nenhuma página consegue mostrar é **quem está do outro lado**.

Essas 5 fotos são diferentes de tudo que já entrou: são **pessoas reais, num escritório real, com a marca NextLevel na parede**. Isso responde à dúvida que trava quem vai pagar uma plataforma desconhecida: *"existe uma empresa de verdade por trás disso? Tem alguém para me ajudar?"*

A proposta tem três camadas:

1. **Confiança nas páginas públicas.** Uma faixa "quem está por trás" e uma "palavra do fundador" no site do grupo e na Soluções. Na E-commerce e na SuperDrop entra uma versão curta, perto do momento em que a pessoa decide (planos, "prefere ajuda?", diagnóstico gratuito).
2. **Calor humano nos painéis.** Um cartão "sua equipe de apoio" na primeira tela do lojista e na tela de bloqueio. O login do Master e o Estúdio de gravação ganham a foto do escritório. O e-mail de boas-vindas ganha a assinatura do Mauricio com foto pequena.
3. **Uma regra de ouro.** A equipe aparece **sempre como equipe**:
   - nunca como cliente, nunca como depoimento;
   - nunca dentro da loja de um lojista;
   - nunca com número ou promessa de ganho.

E só aparece quem **autorizou o uso da imagem por escrito** (LGPD).

**O que eu preciso de você antes de implantar** (detalhes na seção 9):
- os arquivos originais em alta;
- confirmar se as fotos 3 e 5 são reais ou montadas;
- as autorizações de imagem de cada pessoa que aparece;
- três decisões: onde o Mauricio aparece como rosto, o uso da foto do prêmio, e quem atende o suporte.

---

## 1. Inventário: o que cada foto mostra e para que serve

As fotos chegaram **só pela conversa, comprimidas**: 1672 × 941 px nas paisagens, 1448 × 1086 e 1086 × 1448 nas outras. Para página pública em tela grande é pouco: a faixa de largura total precisa de 2560 px ou mais. Para cartão, metade da tela, avatar e e-mail já serve. **Peça os originais da câmera ou do vídeo** (seção 6).

| # | Nome proposto | O que mostra | Formato recebido | Força | Cuidados |
|---|---|---|---|---|---|
| 1 | `eq-premio-equipe` | Mauricio entrega uma caixa de iPhone a uma colaboradora; uma colega aplaude e outro filma com o celular. Sala com parede acústica preta em losangos, carpete e parede azul-marinho | 16:9 (parece quadro de vídeo) | Cultura, reconhecimento, gente feliz de verdade | **Promessa de ganho:** em página pública lê-se "aqui você ganha iPhone". Só uso interno (Master, equipe) ou no "sobre nós" do grupo com legenda clara de reconhecimento interno. Autorização das 4 pessoas |
| 2 | `eq-escritorio-estudio` | Visão do escritório. Logo NEXTLEVEL MARKETING em 3D na parede branca, dois editores de vídeo no computador (timeline na tela) e, à direita, gravação com estabilizador, celular no tripé, ring light e apresentadora. Camisetas com logo | 4:3 (foto de celular, nítida) | **A melhor prova de empresa real.** Mostra o que a NextLevel faz (conteúdo, edição, estúdio) e a marca na parede | Telas visíveis: conferir se há dado de cliente (planilha no notebook, rosto no vídeo editado). Desfocar se houver. Autorização de 4 pessoas |
| 3 | `eq-mesas-logo` | Duas pessoas de costas trabalhando lado a lado (painel com gráficos e Photoshop). Parede branca com logo NEXTLEVEL MARKETING em preto e ciano, entre linhas. Piso de granilite | 3:4 em pé (serve para celular) | Composição limpa, simétrica, boa para a primeira dobra no celular | **Suspeita de montagem ou de outro local:** o logo (preto + ciano, com linhas) é diferente do da foto 2 (cinza e azul em 3D) e do kit atual da marca-mãe (NL2). O piso também é outro. Confirmar se é real; se for montagem, **não usar como "nosso escritório"** |
| 4 | `eq-tour-escritorio` | Mauricio caminha conversando com uma visitante ou cliente (de costas, roupa clara) e mostra o escritório. Ao fundo, o estúdio de vidro com tripé e a equipe nas mesas | 16:9 (quadro de vídeo) | **"Venha conhecer", atendimento próximo.** Ótima para diagnóstico gratuito, Loja Pronta, Migração e Enterprise | A visitante está de costas (bom para privacidade), mas aparece. Autorizações da equipe ao fundo (rostos pequenos) |
| 5 | `eq-mauricio-retrato` | Retrato do Mauricio sorrindo, camiseta preta, apoiado numa bancada. Estúdio escuro de madeira com luz quente, câmera de cinema e monitor com gráfico ao fundo | 16:9 | **Rosto do fundador**: carta do fundador, assinatura de e-mail, vídeo de boas-vindas | Ambiente diferente do escritório (madeira e luz quente contra carpete azul e parede branca): confirmar se é real. Se for gerada por IA, só serve como retrato e nunca como "nosso estúdio" |

**Coerência de cor (boa notícia):** o carpete e a parede azul-marinho do escritório real conversam com o navy da marca-mãe NextLevel. Nas páginas do grupo e da Soluções as fotos entram **sem tratamento**. Nas outras marcas a foto **não é recolorida**: entra num cartão com a moldura e a cor de sinal da marca (`--brand-signal`), para não brigar com a paleta.

---

## 2. Princípios (a regra de verdade aplicada a gente real)

1. **Equipe é equipe.** Legenda sempre do tipo "Equipe NextLevel, São Paulo" ou "Mauricio, fundador". Nunca "lojista que vende R$ X", nunca depoimento, nunca em loja de demonstração ou de cliente, nunca em tema.
2. **A foto mostra só o que existe.** Se a legenda diz "a equipe monta sua loja", a Loja Pronta precisa existir no catálogo do Master e estar à venda. Se diz "fale com a gente", o canal (WhatsApp ou e-mail) precisa estar configurado. **Sem o canal, o cartão não aparece** (regra de código, não de texto).
3. **Autorização antes da publicação.** Cada pessoa identificável tem uma autorização de uso de imagem assinada, guardada fora do repositório. O manifesto das fotos registra só "autorizado em AAAA-MM-DD". **Foto com alguém sem autorização não é exibida**: o lugar fica reservado na cor da marca (o mesmo mecanismo `espera` de `FotoImersiva`).
4. **Sem promessa de ganho.** A foto do prêmio (1) não entra perto de planos, parceiros ou preços.
5. **Marca certa em cada endereço.** No SuperDrop a faixa fala "a equipe que faz o SuperDrop"; na E-commerce, "a equipe da NextLevel E-commerce". O nome vem de `getBrand()`, nunca fixo. O logo NEXTLEVEL MARKETING na parede é a empresa real (NextLevel Marketing Ltda), o que é verdade em todas as marcas do grupo.
6. **Personagens e equipe não se misturam na mesma cena.** Na jornada imersiva (personagens), a equipe só entra como **apoio** ("se travar, a gente ajuda"), num bloco à parte, nunca como "passo 3 da Juliana".
7. **Painel é ferramenta** (`painel-interno`). Foto em painel só onde acalma ou orienta: apoio, bloqueio, boas-vindas, login, estado vazio do primeiro dia. Nunca em tabela, fila ou formulário.

---

## 3. Mapa: foto × marca × lugar

Legenda: P = página pública, I = painel interno, E = e-mail. A prioridade segue a regra de foco D174.

| Prioridade | Marca e endereço | Lugar (rota / componente) | Foto | O que comunica |
|---|---|---|---|---|
| 1 | **E-commerce** (`lojas.nextlevelgroup.com.br`) · P | Faixa "Prefere ajuda para começar? Loja Pronta, Migração ou diagnóstico gratuito" (`src/components/portal/commerce/plans-section.tsx`). Vira um bloco com foto e três portas | 2 (recorte do estúdio e dos editores) | Gente de verdade monta a sua loja se você não quiser fazer sozinho |
| 1 | E-commerce · P | Plano Enterprise, "Pedir proposta" (mesma seção dos planos) | 4 | Atendimento próximo para operações maiores |
| 1 | E-commerce · P | Bloco novo "Quem faz a NextLevel E-commerce", antes das perguntas frequentes da home imersiva (`src/components/portal/commerce/imersiva/home-imersiva.tsx`) | 2 + 5 (avatar) | Empresa real, em São Paulo, com equipe |
| 1 | E-commerce · I | Primeira tela do lojista (`/merchant`): cartão "Sua equipe de apoio", **só nos primeiros 14 dias ou até a primeira venda**, abaixo da fila do dia | 5 (avatar redondo) ou rosto do atendente | Não está sozinho; botão para o canal de suporte |
| 1 | E-commerce · E | E-mail de boas-vindas da loja (`welcomeStore` em `src/lib/email.ts`): assinatura "Mauricio, fundador" com foto de 96 px | 5 (recorte 1:1) | Tom pessoal; quem assina responde? (decisão 9.3) |
| 2 | **SuperDrop** (`superdrop.com.br`) · P | Faixa de suporte da home (componentes em `src/components/portal/superdrop/`): "Gente de verdade do outro lado" | 2 ou 4 | Confiança para quem começa a vender sem estoque |
| 2 | SuperDrop · I | Tela de bloqueio ou fatura (`src/components/app/blocked-screen.tsx`): "suporte nos quatro cantos" ganha rosto | avatar do atendente ou 5 | Bloqueio sem pânico: tem alguém para resolver |
| 3 | **Grupo** (`nextlevelgroup.com.br`) · P | Home do grupo (`src/components/portal/nextlevel/heroi-nextlevel.tsx` e seções): bloco "Quem está por trás" + "Palavra do fundador" | 4 (faixa larga), 2 (mosaico), 5 (fundador), 1 (cultura, com legenda de reconhecimento interno, se o dono aprovar) | O grupo existe, tem casa, tem gente e tem dono com rosto |
| 3 | Grupo · P | `/solucoes` (vitrine v2, `src/components/portal/solucoes/*`): ao lado do formulário de diagnóstico gratuito (`diagnostico-form.tsx`) | 4 | "Quem vai olhar o seu diagnóstico" |
| 3 | Grupo · P | `/loja-nextlevel` (serviços e temas da Loja NextLevel) | 2 | Estúdio e edição: o serviço é feito aqui |
| 3 | Grupo · P | Prévia de link (OG) do site do grupo e da Soluções | 2 (logo na parede visível) | Quem recebe o link no WhatsApp já vê a empresa |
| 3 | **Master** (`master.nextlevelgroup.com.br`) · I | Tela de login (`src/app/login/page.tsx`, só no endereço do Master): metade da tela com a foto | 4 ou 2 | A casa da equipe; bem-vindo de volta |
| 3 | Master · I | Equipe (`/master/equipe`): cabeçalho "Reconhecimento do mês" (equipe comercial e de suporte gamificada) | 1 | Cultura e reconhecimento **interno** |
| 3 | Master · I | Estúdio de gravação (`src/app/gravacao/page.tsx`) | 2 (recorte do estúdio) | É exatamente o lugar onde as aulas são gravadas |
| 4 | **Brás Digital Club** · P/I | Estúdio e máquina de conteúdo do membro (`/bras/...`, Estúdio N6, kit de gravação) | 2 (recorte do estúdio) | "Seu conteúdo gravado num estúdio de verdade", **só se o serviço estiver ativo** |
| 4 | **NextLevel Cargas** · P | Só cartão de suporte | avatar | Fraco para a marca; não forçar |
| — | **Nunca** | Lojas dos clientes (`/store/*`), demonstrações de tema, depoimentos, simuladores de ganho, página de parceiros perto de comissão | — | — |

---

## 4. Detalhe por marca

### 4.1 NextLevel E-commerce (60%)
- **Problema que a foto resolve:** quem chega à página de planos vê preço, taxa e "3 dias grátis", mas não sabe se tem empresa por trás. A frase "Prefere ajuda para começar?" é só uma linha cinza; hoje a oferta de serviço é invisível.
- **Proposta: bloco "Prefere que a gente monte?"**
  - foto 2 em recorte 4:5 à esquerda (estúdio e editores);
  - à direita, três portas com preço vindo do catálogo do Master: Loja Pronta, Migração e diagnóstico gratuito;
  - no celular, a foto vai em cima, em 16:9, e as portas embaixo;
  - legenda: "Equipe NextLevel, em São Paulo".
- **Bloco "Quem faz"**, antes das perguntas frequentes:
  - texto curto e verdadeiro: empresa, cidade, desde quando (o dono informa), CNPJ da NextLevel Marketing Ltda no rodapé, que já existe;
  - avatar do Mauricio com uma frase dele (o dono escreve; sem número de ganho).
- **Painel do lojista:** cartão "Sua equipe de apoio" na primeira tela (fila do dia, D166).
  - Some depois da primeira venda ou de 14 dias.
  - Botão "Falar com a equipe" usa `NEXT_PUBLIC_SUPPORT_WHATSAPP` ou o e-mail de suporte. **Se nenhum estiver configurado, o cartão não aparece** (hoje é pendência do dono).
- **E-mail de boas-vindas:** assinatura com nome, função e foto pequena.
  - **Achado de passagem:** o texto atual diz "7 dias de teste", mas a oferta pública é de 3 dias (D177). Corrigir para vir de `ofertaPublica`.

### 4.2 SuperDrop (25%)
- **Público:** quem começa sem estoque e tem medo de golpe. A prova social mais forte que existe hoje é "gente de verdade atende".
- **Home:** faixa de suporte com a foto 4 (ou 2) e o canal.
- **Painéis:** tela de bloqueio ou fatura com rosto e canal; cartão de apoio igual ao da E-commerce na primeira tela da loja (`/merchant` de marca SuperDrop), mesma regra de sumir.
- **SuperDrop está em produção:** cada mudança visual entra com teste. Nenhuma mudança de comportamento: é só um bloco novo.

### 4.3 Grupo NextLevel e Soluções (parte dos 15%)
- **É o lar natural das fotos:** a marca na parede é a do grupo, e o navy do carpete é o navy da marca-mãe.
- **Home do grupo:**
  - "Quem está por trás": faixa larga com a foto 4 e mosaico com as fotos 2 e 3 (se a 3 for real);
  - "Palavra do fundador": foto 5 e texto do Mauricio (o dono escreve; máximo de 80 palavras);
  - "Cultura" com a foto 1, legenda "Reconhecimento interno da equipe", só se o dono aprovar.
- **Soluções:** a foto 4 ao lado do diagnóstico gratuito e a foto 2 na Loja NextLevel.
- **Prévia de link:** a foto 2 com o logo visível, recortada para 1200 × 630.

### 4.4 Master (interno, parte dos 15%)
- **Login do Master:** foto 4 ou 2 na metade esquerda (computador); no celular, só a cor.
- **Equipe:** cabeçalho de reconhecimento com a foto 1, que é o lugar certo para ela.
- **Estúdio de gravação:** cabeçalho com o recorte do estúdio da foto 2.
- **Mapa do ecossistema (D175):** nada. É painel de dados.

### 4.5 Brás Digital Club e NextLevel Cargas (etapa futura, D-foco)
- **Brás:** o recorte do estúdio da foto 2 combina com o Estúdio e a máquina de conteúdo, mas só entra quando o serviço estiver de fato vendendo.
- **Cargas:** só o cartão de suporte; não há cena que combine.
- As duas marcas já têm personagens próprios (D175); a equipe entra só como apoio.

---

## 5. O que não fazer (lista de bloqueio para o código e para a revisão)
- Usar qualquer uma das 5 fotos em `/store/*`, nos temas, nas lojas de demonstração ou na galeria de temas.
- Escrever legenda com resultado ("já ajudamos 500 lojas"), salvo número **conferido no banco**, vindo do Master e atualizado.
- Pôr a foto 1 (prêmio) perto de preço, parceiros, comissão ou "indique e ganhe".
- Recolorir as fotos com a cor de outra marca (o azul do escritório vira verde no SuperDrop: proibido).
- Mostrar a foto 3 ou a 5 como "nosso escritório" sem a confirmação do dono (seção 9.1).
- Mostrar o cartão de suporte sem canal configurado.
- Deixar dado de cliente legível nas telas da foto 2 (planilha, rosto no vídeo editado): desfocar.

---

## 6. Contrato de ativos (o que o dono entrega, o que o código consome)

**Entrega do dono:**
- **Originais em alta**, sem compressão do WhatsApp: as fotos 2 e 3 do celular ou da câmera; os quadros 1, 4 e 5 exportados do vídeo original na resolução máxima (ideal 3840 × 2160), ou foto da câmera.
- Um ZIP, numa pasta nova, com os nomes da seção 1. Mais um arquivo `autorizacoes.txt` com uma linha por pessoa: primeiro nome ou função, foto(s) em que aparece, data da autorização assinada. **O documento assinado fica com o dono, não no repositório.**

**Pasta e formatos (código):**
- Pasta: `public/portal/nextlevel/equipe/v1/`. A equipe é da marca-mãe; as outras marcas leem o mesmo acervo, sem duplicar arquivos.
- Conversão com `scripts/imagens/imersiva-converter.py`, como nas outras fotos: AVIF com WebP de reserva, cor média de fundo, larguras do acervo.

**Recortes, com ponto focal descrito para o conversor:**

| Arquivo | Recortes | Ponto focal | Peso máximo |
|---|---|---|---|
| `eq-escritorio-estudio` | 16:9 (2560/1280), 4:5 (1080 × 1350), 1200 × 630 (prévia de link), "estúdio" 4:5 só do lado direito | Logo na parede (16:9); apresentadora e cinegrafista (estúdio) | 180 KB (AVIF 1280) |
| `eq-tour-escritorio` | 16:9, 4:5 (recorte nos dois e no corredor) | Mauricio e o gesto da mão | 180 KB |
| `eq-mauricio-retrato` | 16:9, 4:5, 1:1 (800, 400, 192, 96 para avatar e e-mail) | Rosto (terço superior) | 120 KB (1:1 800) |
| `eq-premio-equipe` | 16:9, 4:5 | Mãos e caixa entre os dois | 180 KB |
| `eq-mesas-logo` (se real) | 3:4 em pé, 1:1 | Logo e as duas pessoas | 160 KB |

**Manifesto:** `src/lib/marcas/equipe-imagens.ts`, no mesmo formato de `Acervo` dos outros (`src/lib/imersiva/acervo.ts`). Cada foto ganha dois campos novos:
- `pessoas: { ref: string; autorizadaEm: string | null }[]`;
- `alt` em português.

**Textos alternativos (primeira versão):**
- 2: "Escritório da NextLevel: dois editores de vídeo trabalham no computador enquanto, ao fundo, uma apresentadora grava com a equipe no estúdio azul."
- 4: "Mauricio, fundador da NextLevel, mostra o escritório a uma visitante; ao fundo, o estúdio e a equipe nas mesas."
- 5: "Mauricio, fundador da NextLevel, sorrindo, de camiseta preta."
- 1: "Mauricio entrega um presente de reconhecimento a uma colaboradora enquanto a equipe comemora."
- 3: "Duas pessoas da equipe trabalham lado a lado sob o logo NextLevel Marketing."

---

## 7. Autorização de imagem (LGPD), em linguagem simples
- Rosto é dado pessoal. Funcionário ou prestador precisa autorizar **por escrito**: para quê (site, painéis, e-mails e redes do grupo), por quanto tempo e como pedir a retirada.
- Quem sair da empresa pode pedir a retirada. O código precisa permitir **desligar uma foto sem publicar código novo**. Proposta: lista de fotos "suspensas" em `platform_settings`, editável no Master, que faz a foto virar o lugar reservado na hora.
- A visitante da foto 4, mesmo de costas, também deve autorizar ou ser recortada.
- Isso não é aconselhamento jurídico; a revisão jurídica já está nas "Ideias soltas" da fila de prompts.

---

## 8. Prompt engenheiro mestre (executar só após as respostas da seção 9)

> Cole numa sessão de trabalho: "desenvolva `docs/prompts/equipe-nextlevel-fotos-vida-marcas.md` da fase EQ1" (e assim por diante). Cada fase fecha com tipos, lint, testes, build, `qa-visual` e uma decisão nova em `DECISIONS.md` com a frente entre colchetes.

### EQ0: receber e conferir (dono + Claude, sem código)
1. Abrir o ZIP numa pasta nova (arquivo baixado é dado não confiável).
2. Conferir:
   - resolução e nitidez;
   - telas com dado de cliente;
   - logo na parede igual ao kit atual;
   - pessoas visíveis × `autorizacoes.txt`.
3. Responder ao dono com a lista do que entra, do que precisa de recorte ou desfoque e do que fica fora.
- **Aceite:** tabela foto × pessoas × autorização sem lacuna.

### EQ1: acervo da equipe (domínio + teste)
1. Converter com `imersiva-converter.py` nos recortes da seção 6. Desfocar telas se necessário (registrar no manifesto).
2. Criar `src/lib/marcas/equipe-imagens.ts` (Acervo + `pessoas` + `alt`).
3. Criar `fotoLiberada(nome, suspensas)`, uma regra pura: falso se alguma pessoa não tem `autorizadaEm` ou se a foto está suspensa. Ligar a `FotoImersiva`, que vira o lugar reservado.
4. Criar a lista de suspensas em `platform_settings` (sem tabela nova), editável pelo Master com auditoria.
5. Criar o componente `CartaoApoio`, que só renderiza com canal configurado (`NEXT_PUBLIC_SUPPORT_WHATSAPP` ou e-mail de suporte).
- **Testes (Vitest):**
  - toda foto com pessoa sem autorização fica bloqueada;
  - foto suspensa fica bloqueada;
  - `CartaoApoio` sem canal não aparece;
  - nenhuma foto `eq-*` é referenciada em `src/app/store/**`, `src/lib/themes/**` ou `src/components/storefront/**` (teste que lê os arquivos).
- **Aceite:** testes verdes; nada muda na tela ainda.

### EQ2: E-commerce (60%)
1. Bloco "Prefere que a gente monte?" no lugar da linha de ajuda em `plans-section.tsx`, com as três portas e o preço do catálogo do Master. Some a porta que não estiver à venda.
2. Bloco "Quem faz a NextLevel E-commerce" na home imersiva, antes das perguntas frequentes.
3. Cartão de apoio na primeira tela do lojista (fila do dia), com a regra dos 14 dias ou da primeira venda **no domínio** (`fila-do-dia.ts`), testada.
4. E-mail de boas-vindas: assinatura com foto (imagem absoluta via `APP_URL`, 96 px, texto alternativo) e dias de teste vindos de `ofertaPublica` (corrige o "7 dias").
- **Conferência:**
  - `qa-visual` em 360, 768 e 1440 px, com rolagem;
  - `axe` sem violações graves;
  - sem rolagem lateral;
  - `scripts/auditoria/marca.mjs` sem vazamento;
  - LCP da home sem piora (foto abaixo da dobra, carregamento tardio).

### EQ3: SuperDrop (25%)
1. Faixa de suporte na home e cartão de apoio na primeira tela e na tela de bloqueio (`blocked-screen.tsx`).
2. Teste de que o fluxo de bloqueio e pagamento não mudou (regressão).
- **Conferência:** igual à da EQ2, mais `conferir:producao` depois de publicar.

### EQ4: Grupo e Soluções
1. Home do grupo: "Quem está por trás", "Palavra do fundador" (texto do dono) e, se aprovada, "Cultura".
2. `/solucoes`: foto ao lado do diagnóstico. `/loja-nextlevel`: foto do estúdio.
3. Prévia de link (OG) do grupo e da Soluções com a foto 2.
- **Conferência:** `pagina-de-vendas` passo 7 (3 rodadas de ajuste com capturas).

### EQ5: painéis internos
1. Login do Master (só no endereço do Master), Equipe (reconhecimento), Estúdio de gravação.
2. Nenhuma foto em tabela, fila ou formulário (`painel-interno`).
- **Conferência:** capturas dos painéis; varredura de marca.

### EQ6: Brás e Cargas (quando a etapa abrir)
- Estúdio do membro da Brás e cartão de apoio nas duas marcas.

### EQ7: fechamento
- Decisão nova em `DECISIONS.md`.
- Atualizar `docs/prompts/README.md`, `docs/LINKS.md` e o relatório do dia (esforço por frente).
- Publicar e rodar `conferir:producao`.

---

## 9. Perguntas para o dono avaliar (com a minha recomendação)

| # | Pergunta | Recomendação | Por quê |
|---|---|---|---|
| 9.1 | As fotos 3 (mesas com logo ciano) e 5 (retrato no estúdio de madeira) são reais ou montadas? | Usar como "nosso escritório" só o que for real. Se a 5 for gerada, ela serve só como retrato; se a 3 for montagem, fica fora | Regra de verdade; o logo da 3 difere do da parede real |
| 9.2 | Todas as pessoas que aparecem autorizaram o uso da imagem por escrito? | Colher as autorizações antes da EQ1; quem não autorizar sai por recorte ou desfoque | LGPD e confiança da equipe |
| 9.3 | O Mauricio é o rosto da marca em todas as marcas ou só no grupo e na Soluções? | Grupo, Soluções e assinatura dos e-mails da E-commerce. No SuperDrop, a "equipe" em vez do fundador | O SuperDrop tem identidade própria; o fundador pesa mais onde se vende serviço |
| 9.4 | A foto do prêmio (1) pode aparecer em página pública? | Não. Só Master e Equipe. Se quiser no site do grupo, legenda "reconhecimento interno" e longe de preços | Evita leitura de promessa de ganho |
| 9.5 | Quem atende o suporte e por qual canal? | Ligar o cartão de apoio só quando o WhatsApp ou o e-mail de suporte estiver configurado no Render (pendência atual) | Cartão sem canal é promessa vazia |
| 9.6 | A "Palavra do fundador": você escreve ou quer um rascunho meu? | Eu escrevo um rascunho de até 80 palavras, sem números, e você ajusta | Agiliza; a voz final é sua |
| 9.7 | Vale um ensaio complementar de meio dia no escritório? | Sim, com a lista da seção 10 | As 5 fotos cobrem confiança, não cobrem "atendimento" e "montando a loja" |

---

## 10. Ensaio complementar sugerido (meio dia, no escritório)
Regra da tela (D166): **nunca tela virada para a câmera com a pessoa atrás**; tela de perfil ou de costas para a câmera.

1. Atendimento: pessoa da equipe no fone ou no WhatsApp, sorrindo. Celular de perfil, 16:9 e 4:5. É o rosto do cartão de apoio.
2. "Montando a sua loja": mãos no notebook, tela de lado, catálogo de produtos na mesa. Serve para Loja Pronta.
3. Reunião de diagnóstico: Mauricio e um visitante na mesa de madeira clara, de três quartos. Serve para Soluções e Enterprise.
4. Equipe reunida na frente do logo da parede, em pé, natural. Para o "sobre" do grupo.
5. Vídeo de 20 a 30 segundos do Mauricio, em pé e deitado, dando boas-vindas ao lojista novo. Para a primeira tela do painel e o e-mail. Legenda sempre ligada; o vídeo nunca toca sozinho com som.
6. Detalhe: caneca e camiseta com o logo, ring light, estabilizador. Para fundos e para o estado vazio do primeiro dia.
7. Retratos individuais 1:1 de quem atende o suporte, para os cartões.

---

## 11. Ligação com o que já existe (não duplicar)
- **Componente de foto:** `src/components/imersiva/foto.tsx` (`FotoImersiva`, já com lugar reservado). **Acervo:** `src/lib/imersiva/acervo.ts`. **Conversor:** `scripts/imagens/imersiva-converter.py`.
- **Personagens por marca:**
  - `src/lib/marcas/ecommerce-home-imagens.ts`;
  - `superdrop-home-imagens.ts`;
  - `bras-home-imagens.ts`;
  - `cargas-home-imagens.ts`.

  A equipe é **um acervo à parte**, lido por todas as marcas.
- **Primeira tela do lojista:** fila do dia (`src/lib/domain/fila-do-dia.ts`, D166). **Bloqueio:** `src/components/app/blocked-screen.tsx`. **E-mails:** `src/lib/email.ts` (`welcomeStore`).
- **Oferta verdadeira:** `ofertaPublica` em `src/lib/domain/commerce-plans.ts` (D177). **Marca:** `getBrand()` e `--brand-*`.
