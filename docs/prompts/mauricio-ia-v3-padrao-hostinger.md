# Maurício v3: a IA dentro do sistema, no padrão de painel da Hostinger

> **O que é:** como a IA aparece e funciona nos painéis e nas páginas públicas, tomando como referência o **jeito de organizar** a IA no painel da Hostinger (hPanel, assistente "Kodee"). Copiamos o padrão de experiência, nunca a marca, as cores, o nome nem os textos.
> **Base:** continua `mauricio-agente-ia-v1.md` (regras técnicas: confirmação antes de gravar, dinheiro calculado pelo sistema e não pela IA, ferramentas sobre o domínio) e `mauricio-agente-ia-v2.md` (públicos, níveis N0 a N6, páginas públicas). Onde este documento conflitar com eles, vale este, porque é o mais novo.
> **Decisão do dono (2026-10-28):**
> - a IA aparece para todos;
> - a função avançada fica **bloqueada para quem não está no plano mais alto**;
> - tudo fica pronto no visual, com a chave ligada;
> - no Master há o espaço para colocar as credenciais do GPT (OpenAI).
>
> **Estado:** especificação. A fase IA0 (seção 9) pode ser programada já, sem chave nenhuma.

---

## 1. Avaliação do padrão Hostinger

### 1.1 Como a IA aparece no painel deles
Descrição pelo que é público. **Confirmar com os prints do dono** (lista na seção 11).

| Elemento | Como funciona lá | Por que funciona |
|---|---|---|
| **Botão flutuante do assistente** | Um botão fixo no canto inferior direito, com ícone de "brilho", em todas as telas do painel | A IA está sempre a um clique, sem ocupar o menu |
| **Painel lateral de conversa** | Abre pela direita, por cima da tela, sem trocar de página; tem saudação, **sugestões prontas em botões** ("como apontar meu domínio?") e campo de texto | O usuário não perde o que estava fazendo; as sugestões ensinam o que a IA sabe fazer |
| **A IA age, não só responde** | Executa tarefas do painel (por exemplo, ajustes técnicos) mostrando o que vai fazer antes de fazer | Transforma suporte em autoatendimento |
| **Ferramentas de IA em cartões** | Uma área com cartões (criar site, escrever texto, logo, SEO, imagem): ícone, nome, uma frase e um botão | Cada ferramenta é um "produto" fácil de entender e de vender |
| **Selos "Novo" e "Beta"** | Em cartões e menus | Mostra evolução e reduz a frustração quando algo falha |
| **Bloqueio por plano** | A ferramenta aparece, mas com aviso e botão para subir de plano | O cliente vê o valor antes de pagar; o upgrade nasce dentro do produto |
| **Consistência** | Mesmo botão, mesmo painel e o mesmo estilo de cartão em todo lugar | Parece um sistema só, maduro |

### 1.2 O que vamos seguir (o padrão)
1. **Um botão flutuante fixo** em todos os painéis (lojista, fornecedor, Master), canto inferior direito.
2. **Painel lateral de conversa** pela direita (420 px no computador; tela cheia no celular), com sugestões prontas por tela.
3. **Central de IA** com ferramentas em cartões (seção 4).
4. **Bloqueio visível:** quem não tem o plano vê tudo, com cadeado, o que faria e o botão "Ver plano".
5. **Selos** "Novo" e "Beta" no nosso estilo.
6. **A IA prepara, a pessoa confirma:** nada é gravado sem o botão "Confirmar" (regra da v1).

### 1.3 O que NÃO vamos copiar
- **Marca, cores e nome:**
  - nada de roxo da Hostinger nem do nome "Kodee";
  - o nosso é o **Maurício**, nas cores de cada marca (`--brand-*`);
  - no painel, o "brilho" usa a cor de sinal da marca.
- **Textos e ícones próprios deles:** escrevemos os nossos em português claro.
- **Ferramentas que não fazem sentido para loja de moda** (criador de site do zero, hospedagem). As nossas giram em torno de produto, pedido, cliente e venda.

---

## 2. Princípios (valem para todas as fases)
1. **Visível para todos, liberado por plano.** O plano mínimo é **configuração do Master**, nunca código fixo.
2. **A IA prepara, a pessoa confirma.** Texto, preço, estoque e cadastro só são gravados com "Confirmar".
3. **Dinheiro é do sistema, não da IA.** Valores, taxas e margens vêm das funções de domínio; a IA só explica.
4. **Um tenant nunca vê dado de outro**, nem pela IA. As ferramentas usam as mesmas permissões das telas (`requireRole`, `assertCanAccess`).
5. **Chave do GPT só no Master, criptografada** (`encryptSecret`), nunca na tela, em log ou e-mail; o lojista não precisa de chave.
6. **Custo sob controle:** cota por plano, contador de uso e corte automático no limite; o Master vê o custo do mês.
7. **Honestidade:** sem promessa de venda; selo "Beta" enquanto aprendemos; erro do provedor vira mensagem clara ("o Maurício está fora do ar agora, tente em instantes").

---

## 3. Planos e bloqueio

### 3.1 Planos de hoje (E-commerce)
`COMMERCE_START` · `COMMERCE_PRO` · `COMMERCE_SCALE` · `COMMERCE_ENTERPRISE` (por proposta).

### 3.2 Proposta (o dono decide, pergunta 1)
| Plano | O que o Maurício faz |
|---|---|
| Start | **Vê e experimenta:** botão, painel e central aparecem; 3 usos de demonstração por mês nas ferramentas de texto; o resto com cadeado |
| Pro | **Ferramentas de texto** (seção 4, grupo A) com cota mensal |
| **Scale (o "Ultimate")** | **Tudo:** ferramentas de texto com cota maior + **assistente que lê a loja e age com confirmação** (grupos B e C) + rotinas |
| Enterprise | Scale + cota sob medida + vendedor na loja (N5), por proposta |
| Teste de 7 dias | Liberado como Scale com cota pequena (é a hora do "uau") |

> A pedido do dono, a versão mínima é: **tudo visível e o avançado bloqueado para quem não é Scale**. A tabela acima detalha isso. Se preferir, Pro e Start ficam iguais (só visual) e só Scale usa.

### 3.3 Os quatro estados de cada ferramenta
| Estado | Quando | O que a pessoa vê |
|---|---|---|
| **Desligada** | O Master ainda não ligou a IA (sem chave) | Cartão com selo "Em breve" e "O Maurício chega em breve ao seu painel." Sem botão de uso |
| **Bloqueada** | Ligada, mas o plano da loja não inclui | Cartão com cadeado, "Disponível no plano Scale", **exemplo do resultado** (gravado, sem custo) e botão "Ver plano Scale" |
| **Liberada** | Plano inclui e há cota | Cartão normal; o uso mostra "12 de 200 usos este mês" |
| **Cota no fim** | Mais de 80% da cota | Aviso amarelo; no limite, "Seus usos do mês acabaram; renovam em 01/11" + "Ver plano" |

**Pedido do dono: "chave ligada e tudo pronto visualmente, mas bloqueado".** Na fase IA0 o Master liga a chave geral "Mostrar o Maurício". Sem credencial cadastrada, todo mundo vê o estado **Bloqueada** (com exemplos) ou **Em breve**, conforme o plano, sem nenhuma chamada à OpenAI e sem custo.

---

## 4. Central de IA (`/merchant/ia`): as ferramentas em cartões

| Grupo | Ferramenta | O que faz | Onde também aparece (atalho no lugar certo) | Fase |
|---|---|---|---|---|
| A. Texto | **Descrição do produto** | A partir de nome, categoria, tecido e fotos (texto), escreve a descrição em tom da loja | Botão "Escrever com o Maurício" no cadastro do produto | IA1 |
| A. Texto | **Título e SEO** | Título para o Google, descrição curta e palavras do produto | Cadastro do produto e configurações de SEO | IA1 |
| A. Texto | **Traduzir produto** | Nome e descrição em espanhol, chinês e inglês (liga com a fase de idiomas I1) | Cadastro do produto | IA1 |
| A. Texto | **Resposta ao cliente** | Rascunho de resposta para dúvida, troca ou atraso, com os dados do pedido | Pedido (gaveta) e pós-venda | IA1 |
| A. Texto | **Ideias de campanha** | Textos para cupom, campanha e post de data comemorativa (usa o calendário do varejo, D188) | Campanhas e cupons | IA1 |
| B. Análise | **Pergunte à sua loja** | "Quanto vendi esta semana?", "Qual produto está parado?" Responde com os números do sistema | Botão flutuante (painel lateral) | IA2 |
| B. Análise | **Resumo da semana** | Toda segunda: vendas, pedidos parados, estoque acabando e o que fazer | E-mail e o painel | IA2 |
| C. Ação | **Cadastro por conversa** | "Cadastra a camiseta preta P M G a R$ 79,90": monta o cartão do produto; a pessoa confere e confirma | Painel lateral | IA3 |
| C. Ação | **Preço em massa** | "Aumenta 10% a coleção inverno": mostra a prévia de todos e confirma | Painel lateral e catálogo | IA3 |

Cada cartão, no padrão: ícone na cor de sinal da marca, nome, uma frase, selo (Novo/Beta), estado (seção 3.3) e um botão.

---

## 5. O visual (nosso, no padrão)

### 5.1 Botão flutuante
- Círculo de 56 px no canto inferior direito, 24 px da borda, acima do botão de WhatsApp quando houver.
- Ícone de brilho na cor de sinal da marca, sobre fundo de tinta (`--brand-ink`). Tem o rótulo "Maurício" que aparece ao passar o mouse, e `aria-label="Abrir o Maurício"`.
- Movimento: entra com a "Subida" (D193); no primeiro acesso, uma única pulsação.
- Atalho de teclado: **Ctrl + J** abre e fecha o painel (Ctrl+K já é a busca).
- Não aparece nas lojas para o cliente final (só no N5, fase IA4), nem na prévia do editor.

### 5.2 Painel lateral
- Abre pela direita (420 px; tela cheia abaixo de 640 px), com fundo `--brand-paper` e linha fina à esquerda, sem sombra pesada. Fecha com Esc e devolve o foco ao botão.
- Topo: "Maurício" + selo "Beta" + o estado do plano ("Scale · 12 de 200 usos").
- Saudação curta pelo nome, no primeiro uso.
- **Sugestões prontas por tela**, em botões:
  - nos pedidos: "Quais pedidos estão parados?";
  - no catálogo: "Escreva a descrição deste produto".
- Respostas com o **cartão de ação** da v1: o que vai mudar, antes e depois, e os botões "Confirmar" e "Ajustar". Nada muda sem "Confirmar".
- Bloqueado: o painel abre igual, com as sugestões visíveis. Ao clicar, aparece o exemplo do que o Maurício faria e o botão "Ver plano Scale".

### 5.3 Central de IA
- Página `/merchant/ia` ("Maurício" no menu, grupo Gestão, com selo "Novo").
- Topo: frase "O Maurício escreve, analisa e prepara; você confere e confirma." e o contador de usos.
- Grade de cartões por grupo (A, B, C). Bloqueado: cadeado discreto e o exemplo a um clique.

### 5.4 Selos e cores
- **Novo:** fundo na cor de sinal, texto de contraste (`readableOn`).
- **Beta:** contorno, sem preenchimento.
- **Bloqueado:** cadeado e texto em `--muted`, nunca vermelho (não é erro, é convite).

### 5.5 Acessibilidade
- Contraste AA, foco visível e teclado em tudo.
- O painel é um `<dialog>` nativo com `aria-modal`.
- As respostas usam `aria-live="polite"`.
- Sem rolagem horizontal em 360 px.
- Movimento reduzido respeitado.

---

## 6. Master: IA (`/master/ia`)

| Bloco | Conteúdo |
|---|---|
| **Credenciais** | Provedor (OpenAI; o desenho aceita outros depois), **chave da API** (campo de senha; salva criptografada; depois mostra só "sk-…a1b2"), organização ou projeto (opcional), botão **"Testar conexão"** (chamada mínima, mostra "Conectado" ou o erro em português) |
| **Liga e desliga** | "Mostrar o Maurício nos painéis" (visual) · "Permitir uso real" (só funciona com credencial testada) |
| **Modelos** | Modelo padrão (texto) e modelo econômico (tarefas simples), editáveis. Venda capacidades, não modelos: o lojista nunca vê o nome do modelo |
| **Planos** | Plano mínimo por ferramenta e cota mensal por plano (`platform_settings`, editável) |
| **Uso e custo** | Usos e custo estimado do mês por loja, por ferramenta e no total; alerta de custo acima do limite definido |
| **Registro** | Últimas chamadas (loja, ferramenta, tokens, custo, erro), **sem o conteúdo** da conversa por padrão (LGPD) |

---

## 7. Arquitetura técnica (mínima e econômica)
- **Sem SDK:** chamada HTTP direta à API da OpenAI pelo servidor, com timeout. O cliente fica em `src/lib/ia/provedor.ts`, numa interface que permite trocar de provedor.
- **Credencial** em `platform_settings` (chave `ia`), `encryptSecret`, lida só no servidor.
- **Domínio** em `src/lib/domain/ia.ts`:
  - `estadoDaIa(loja, ferramenta)` (Desligada, Bloqueada, Liberada ou Cota no fim);
  - `usarFerramenta(actor, ferramenta, entrada)`, que confere permissão, plano, cota, chama, registra e devolve;
  - nada grava dados do lojista: a gravação é a ação de domínio de sempre, chamada pelo "Confirmar".
- **Tabelas:** `ia_uso` (loja, ferramenta, tokens, custo em centavos, data, ok/erro, idempotência por pedido de uso), mais o que a v1 já previa para as conversas (fase IA2).
- **Prompts das ferramentas** em `src/lib/ia/ferramentas/*.ts`, versionados, em português, com regras fixas: não inventar dado; não prometer prazo nem preço fora do sistema; "custo nunca aparece".
- **Cotas:** contadas por mês (fuso de Brasília). Ao estourar, corta antes de chamar o provedor.
- **Exemplos do estado Bloqueada:** textos gravados no código (sem chamada e sem custo).
- **Testes:** provedor falso (fetch falso, como nas integrações), cobrindo os quatro estados, a cota, o tenant e o Master.

---

## 8. Páginas públicas
- **Home da E-commerce:** faixa "Maurício, a IA da sua loja" com os cartões das ferramentas e um **exemplo gravado** (descrição de produto antes e depois). Rótulo honesto: **"Beta: nos planos Pro e Scale"**.
- **Planos:** linha "Maurício (IA)" na comparação: Start "experimente", Pro "ferramentas de texto", Scale "completo".
- **Página `/ia`** (da v2, seção 6.3): o que faz, o que não faz, privacidade (a IA não usa os dados da sua loja para treinar modelos, **depois de confirmado com o provedor**) e perguntas frequentes.
- Sem números de resultado inventados.

---

## 9. Fases
| Fase | Entrega | Depende de |
|---|---|---|
| **IA0: Visual pronto e bloqueado** | Botão flutuante, painel lateral, Central de IA com os cartões, os quatro estados, exemplos gravados, selo na home e nos planos, e o Master com credenciais, "Testar conexão", chaves, planos e cotas. **Sem nenhuma chamada real.** | Nada (pode começar já) |
| **IA1: Ferramentas de texto** | Descrição, Título e SEO, Traduzir, Resposta ao cliente e Campanha, com cota e registro de uso | A chave da OpenAI no Master |
| **IA2: Pergunte à sua loja** | Painel lateral responde com os números do sistema (N1) e resumo semanal | IA1 no ar |
| **IA3: Ações com confirmação** | Cadastro por conversa e preço em massa (N2/N3) | IA2 |
| **IA4: Vendedor na loja** | O Maurício atende o cliente final (N5) | Decisões jurídicas da v2 |

---

## 10. Prompt mestre de engenharia da fase IA0
> Para colar numa sessão: "Desenvolva a fase IA0 de `docs/prompts/mauricio-ia-v3-padrao-hostinger.md`".

1. Leia este documento, as seções 3 e 5 da v2 e as regras técnicas da v1. Registre a decisão nova em `docs/design/DECISIONS.md`.
2. **Dados:**
   - `platform_settings` chave `ia`, com `{ mostrar, usoReal, provedor, chaveEnc, organizacao, modeloPadrao, modeloEconomico, planos: { [ferramenta]: planoMinimo }, cotas: { [plano]: número } }` e padrões seguros (mostrar ligado, uso real desligado, plano mínimo Scale);
   - leitura por `getIaSettings` (como `getPriceBook`).
3. **Domínio** `src/lib/domain/ia.ts`:
   - catálogo de ferramentas (seção 4), com exemplos gravados;
   - `estadoDaIa`;
   - ações do Master `salvarCredencialIa` (`encryptSecret`) e `testarConexaoIa` (fetch com timeout e mensagem em português; nunca devolve a chave).
4. **Telas:**
   - `src/components/ia/botao-mauricio.tsx` (flutuante, Ctrl+J), dentro da `AppShell`;
   - `src/components/ia/painel-mauricio.tsx` (`<dialog>`, sugestões por tela, estado Bloqueada com exemplo);
   - `/merchant/ia` (Central em cartões);
   - `/master/ia` (seção 6);
   - item no menu com selo "Novo".
5. **Páginas públicas:** faixa na home da E-commerce e linha na comparação de planos, com o rótulo "Beta".
6. **Testes:**
   - domínio: os quatro estados, o plano mínimo vindo do Master, a chave criptografada e nunca devolvida, e o teste de conexão com fetch falso;
   - navegador: botão, painel, Ctrl+J, Esc, cadeado, central, Master, axe e 360 px.
7. **Nada chama a OpenAI nesta fase** (a não ser o "Testar conexão", pedido pelo dono no Master).

---

## 11. Perguntas ao dono
1. **Quem tem o Maurício completo?**
   - Só o **Scale** (recomendado, é o "Ultimate" de hoje)?
   - Ou criamos um plano novo acima dele com o nome "Ultimate"?
2. **O Pro libera as ferramentas de texto** (recomendado, para dar degrau de upgrade) ou fica só no visual, como o Start?
3. **Nome:** mantemos "Maurício" no painel ou usamos outro nome por marca (na Brás, por exemplo)?
4. **Prints da Hostinger que ajudam:**
   - o botão e o painel do assistente aberto, com as sugestões;
   - a tela das ferramentas de IA (os cartões);
   - uma ferramenta bloqueada pedindo upgrade;
   - uma resposta em que o assistente propõe uma ação;
   - o painel no celular.
5. **Custo:** qual é o teto de gasto mensal com a OpenAI que você aceita para começar? Ele vira o alerta do Master.
