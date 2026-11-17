# Ecossistema NextLevel tudo em um: aproveitar ao máximo o que já existe

> **Status: APROVADO PELO DONO NA DIREÇÃO (17/11/2026).** "Aceito as recomendações"; "quero muito seguir para o caminho do Bitrix"; "preciso aproveitar o que já tem pronto ao máximo".
>
> **Pedido do dono, na íntegra:** "Vamos fazer um plano para aproveitar ao máximo o que já temos, em termos de módulos nos painéis internos e módulos de páginas públicas. Preciso encontrar uma forma econômica de encorpar esse projeto em tudo em um. [...] Crie um arquivo .md focado em consolidar esse raciocínio no sistema, inclusive no final um grande prompt engenheiro mestre para desenvolver isso de forma eficiente: uma etapa hoje, com os pontos mais visuais e comerciais do sistema, e outra etapa para outro dia, com IA. Ferramentas que exigem configuração muito avançada ficam para depois. NextLevel Commerce, NextLevel Sites, NextLevel Business, NextLevel Soluções (agência): isso tudo precisa se conectar por algum caminho, sempre. Podemos usar o mesmo escopo da página da NextLevel Commerce para essas outras frentes, aproveitar todo o visual e os módulos mudando apenas a copy."
>
> **Base:**
> - `estrategia-dono-nextlevel-commerce-business.md`: cenários e diferenciais;
> - `precificacao-commerce-sites-business.md`: preços por função;
> - `nextlevel-business-coracao-do-negocio.md`: fases NB0 a NB10;
> - `agencias-parceiras-up-piloto.md`: Painel da Agência, D313 a D327.
>
> **Decisão a registrar: D328.** Antes de gravar, conferir na branch de publicação se o número ainda está livre.

---

## Parte 1. A ideia em uma página

### 1.1 O princípio: "uma casa, quatro portas, um painel"
| Frente | O que é (palavras do dono) | Para quem | Porta pública | Onde vive no painel |
|---|---|---|---|---|
| **NextLevel Commerce** | A plataforma de e-commerce (loja virtual) | Quem vende produto online, varejo e atacado | `/` (home de hoje) e `/planos` | Grupo "Loja virtual" do "Meu negócio" |
| **NextLevel Sites** | "Outra função conectada aos anúncios para captação de clientes" | Quem vende serviço, por orçamento, e quem anuncia | `/sites` (hoje `/empresas`) | Grupo "Site" do "Meu negócio" |
| **NextLevel Business** | "O sistema avançado": funil, caixa, portal do cliente, resultados da Meta e mais | Empresa que quer organizar equipe, clientes e vendas (caminho do Bitrix24) | `/business` (nova, montada com peças prontas) | Grupo "NextLevel Business" (quem tem o direito) |
| **NextLevel Soluções** | "Os serviços da agência" | Quem não tem tempo ou equipe e quer a NextLevel fazendo | `/solucoes` (vitrine D162) e Loja NextLevel | "Loja NextLevel" e "Anúncios na Meta" no painel; Painel da Agência para agências |

**Regra de ouro:** nenhuma frente é sistema separado. São **quatro vitrines** (copy diferente sobre o mesmo visual) que levam ao **mesmo cadastro** e ao **mesmo painel** ("Meu negócio"). O que cada cliente vê dentro depende dos **direitos** (entitlements) que já existem no sistema (`grantEntitlement`, `activeEntitlementKeys`, `modulosDoNegocio`).

### 1.2 Por que esse é o jeito econômico
1. **Nada de tabela nova para a etapa visual e comercial.** As frentes são configuração de texto (copy) e direitos.
2. **Visual pronto:**
   - home imersiva da Commerce (D165), com herói, bento, comparativo, planos, equipe, FAQ e CTA final;
   - cabeçalho tech (`CabecalhoTech`), usado em `/empresas`;
   - vitrine de Soluções (D162).
3. **Módulos prontos nos painéis:** contatos, CRM, atendimento, campanhas, anúncios, análise, financeiro, equipe, contratos, IA (Maurício) e o Painel da Agência inteiro (produção, comercial, portal do cliente, contratos). Ver Parte 2.
4. **Um build, um deploy, um banco** (regra anti-duplicação do `CLAUDE.md`).
5. **Uma etapa por dia com uma montagem no Render** (regra de custo, `docs/infra/RENDER-USO.md`).

### 1.3 O caminho que sempre conecta (as "pontes")
Toda tela pública e todo painel tem pelo menos uma ponte para as outras três frentes:

| Onde | Ponte | Peça que já existe e só ganha copy |
|---|---|---|
| Cabeçalho público | Menu "Produtos" com as 4 frentes (ícone, nome, uma linha) | `PublicNavItem` do layout `(portal)` |
| Rodapé público | Coluna "NextLevel" com as 4 frentes | Rodapé do portal |
| Fim de cada página de frente | Faixa "Também da NextLevel" com as outras 3 | Cartões `ec-cartao` (padrão de `/empresas`) |
| Cadastro | "O que você quer?": Site, Loja virtual, Sistema de gestão (Business), Ajuda da agência | Pergunta já existe na entrada (D303/D309); ganha 2 opções |
| "Meu negócio" (visão geral) | Cartão "Seu ecossistema NextLevel": o que está ligado, o que liga com 1 clique e o que é serviço | `OperationalPulse` e os cartões de `/merchant/negocio/plano` |
| Menu do painel | Itens com cadeado "Ligar site", "Ligar loja virtual" (já existem) + "Conhecer o Business" + "Pedir ajuda da agência" | `navDoNegocio` (`src/lib/nav.ts`) |
| Painel da Agência | "Soluções NextLevel" (D323) | `/agencia/solucoes` |
| Portal do cliente da agência | "Use no seu negócio" (Rede NextLevel, etapa 2) | `/portal/[slug]` |
| E-mails transacionais | Assinatura com as 4 frentes (texto) | `src/lib/email.ts` |

---

## Parte 2. Inventário: o que já temos e onde cada peça serve

> **Levantado no código em 17/11/2026** (`src/app`, `src/components/portal`, `src/lib/nav.ts`).
>
> **Legenda das colunas de frente:** C = Commerce, S = Sites, B = Business, Sol = Soluções.
> - ● = já serve como está;
> - ◐ = serve trocando copy ou rótulo;
> - ○ = não se aplica.

### 2.1 Páginas públicas (`src/app/(portal)`)
| Página ou peça | O que faz hoje | C | S | B | Sol | Como aproveitar |
|---|---|---|---|---|---|---|
| `/` `HomeImersivaEc` | Home da Commerce: herói de capa, dois caminhos, comparativo, faixa de taxa zero, planos, temas, lojas de exemplo, equipe, FAQ, CTA | ● | ◐ | ◐ | ◐ | **Molde das 4 páginas**: extrair a copy para uma configuração por frente e escolher as seções |
| `CabecalhoTech` | Cabeçalho com rótulo, título, texto e 3 dados | ● | ● | ● | ● | Topo de `/sites` (já usa), `/business` e subpáginas |
| `DoisCaminhos` | Site ou Loja na home | ● | ● | ◐ | ○ | Vira **"Quatro portas"**, com o mesmo componente e 4 cartões |
| `/empresas` | Página do caminho Site (NB8) | ○ | ● | ○ | ○ | Passa a ser **`/sites`**; `/empresas` redireciona (301) |
| `/quero-meu-site` | Formulário de quem quer site | ○ | ● | ○ | ◐ | Continua; vira CTA do Sites quando o cadastro está fechado |
| `/quero-minha-loja` | Formulário de quem quer loja | ● | ○ | ◐ | ○ | Serve de "quero conhecer o Business" com parâmetro `?para=business` |
| `/planos` + `CommercePlansSection` | Planos da loja (preço do catálogo) | ● | ◐ | ◐ | ○ | **Abas Lojas, Sites e Business** com o mesmo cartão de plano |
| `/comparativo` + `ComparativoHome` | Custo total contra Nuvemshop, Tray etc., com fonte e data | ● | ◐ | ◐ | ○ | Mesmo componente, novas tabelas: **Sites × Wix** e **Business × RD/Kommo/Bitrix24** ("custo da pilha") |
| `/ferramentas` | Calculadoras (margem, frete grátis) | ● | ◐ | ◐ | ○ | Nova calculadora "custo da pilha" (sem banco) |
| `/recursos` | Recursos da Commerce | ● | ◐ | ◐ | ○ | Uma lista por frente |
| `/integracoes` | O que já integra (D192) | ● | ● | ● | ○ | Filtro por frente |
| `/temas`, `ThemeGallery` | Temas da loja | ● | ◐ | ○ | ○ | Sites mostra os modelos de site (serviços, academia) |
| `/clientes` | Lojas da equipe (D283) | ● | ◐ | ◐ | ● | Cases por frente quando existirem (UP, academia) |
| `/parceiros` | Programa de parceiros (D220/D260) | ● | ● | ● | ● | Comissão vale para as 4 frentes |
| `/solucoes`, `/solucoes/[slug]`, diagnóstico | Vitrine de serviços da agência (D162), formulário de diagnóstico | ◐ | ◐ | ◐ | ● | **É a página do Soluções**; ganha a faixa "Também da NextLevel" |
| `/loja-nextlevel` | Loja de serviços e temas | ● | ● | ● | ● | Ponte para Soluções |
| `/como-funciona` | Passos com cena | ● | ◐ | ◐ | ◐ | Passos por frente |
| `/faq` | Perguntas | ● | ◐ | ◐ | ◐ | Grupos por frente |
| `SecaoEquipe` / `BlocoEquipe` | Pessoas reais da equipe | ● | ● | ● | ● | Mesmo bloco em todas |
| `PlacarSecao` | Placar da goleada (D230) | ● | ○ | ○ | ◐ | Só Commerce e Soluções |
| `/orcamento/[slug]` | Pedido de orçamento público | ○ | ● | ● | ○ | Usado pelos sites dos clientes |
| `/l/[codigo]` | Link curto rastreável | ● | ● | ● | ● | Campanhas de cada frente |

### 2.2 Painel do cliente ("Meu negócio", `src/app/merchant`)
| Módulo | Endereço | Base | C | S | B | Observação |
|---|---|---|---|---|---|---|
| Agora (fila do dia) | `/merchant` | D306 | ● | ● | ● | Ganha o cartão "Seu ecossistema" |
| Contatos e orçamentos | `/merchant/contatos` | D309 | ◐ | ● | ● | Funil de orçamento com origem, base do CRM do Business |
| Clientes (CRM com etapas) | `/merchant/crm` | D207 | ● | ● | ● | **Coração do Business**: etapas que andam sozinhas |
| Atendimento | `/merchant/atendimento` | D206 | ● | ● | ● | "Chat" do Business (perguntas do site e da loja) |
| Pedidos e vendas | `/merchant/orders` | | ● | ○ | ● | |
| Financeiro | `/merchant/finance` | | ● | ● | ● | |
| Campanhas | `/merchant/campanhas` | | ● | ◐ | ● | |
| Anúncios na Meta | `/merchant/anuncios` | D299, D302 | ● | ● | ● | Ponte natural com Soluções (a equipe roda) |
| Análise | `/merchant/analytics` | D185 | ● | ● | ● | |
| Maurício (IA) | `/merchant/ia` | D194 | ● | ● | ● | Etapa 2: IA do Business |
| Páginas e serviços do site | `/merchant/site/*` | D307 | ○ | ● | ○ | |
| Loja virtual (produtos, temas, cupons...) | vários | | ● | ○ | ○ | |
| Equipe | `/merchant/team` | | ● | ● | ● | Limite de pessoas por nível do Business |
| Contratos | `/merchant/contratos` | D276 | ● | ● | ● | Contratos com a NextLevel |
| Aplicativos | `/merchant/aplicativos` | D188 | ● | ● | ● | Lista o que está ligado, com as 4 frentes |
| ERP (Tiny, Omie) | `/merchant/erp` | D191 | ● | ○ | ● | |
| Ferramentas | `/merchant/ferramentas` | D188 | ● | ● | ● | |
| Plano do negócio | `/merchant/negocio/plano` | D310/D311 | ● | ● | ● | **Vitrine interna das 4 frentes** |
| Loja NextLevel (serviços) | `/merchant/services` | | ● | ● | ● | Porta interna do Soluções |
| Registro de ações | `/merchant/auditoria` | | ● | ● | ● | |

### 2.3 Painel da Agência (`src/app/agencia`, D313 a D327): o "Business pronto" que ainda não vendemos
| Módulo | Endereço | O que faz | Equivalente no Bitrix24 |
|---|---|---|---|
| Hoje na agência | `/agencia` | Cockpit do dia | Painel inicial |
| Produção | `/agencia/producao` | Quadro do mês por etapa | **Tarefas e projetos (kanban)** |
| Fila e semana | `/agencia/fila`, `/semana` | O que fazer hoje e na semana | Tarefas e planejamento |
| Comercial | `/agencia/comercial` | Funil do briefing ao contrato | **CRM e negociações** |
| Clientes | `/agencia/clientes` | Carteira | CRM e empresas |
| Contratos | `/agencia/contratos` | Modelo, aceite pelo portal, PDF | **Assinatura eletrônica** |
| Financeiro | `/agencia/financeiro` | Cobrança dos clientes | Faturas |
| Atendimento | `/agencia/atendimento` | Caixa de entrada | **Canais abertos e chat** |
| Tráfego | `/agencia/trafego` | Tráfego por cliente, Mesa de anúncios | Marketing |
| Crescimento, placar, equipe | vários | Metas e indicadores | Relatórios e RH |
| Agente | `/agencia/agente` | IA da agência | **CoPilot** |
| Portal do cliente | `/portal/[slug]` | O cliente acompanha, aprova, paga, pede e aceita contrato | **Extranet e portal do cliente** |

**Leitura de dono:** o Painel da Agência já é um Business para um segmento (agências). A forma mais barata de encorpar o NextLevel Business é **generalizar a linguagem** desses módulos. "Produção" vira "Projetos e tarefas" e "Briefing" vira "Negociação", para qualquer empresa de serviços, sem duplicar código. Isso entra na **etapa 2**, porque mexe em permissões e acesso. Na etapa 1, só mostramos e vendemos, com demonstração (modo demonstração D326).

### 2.4 Master (`src/app/master`): o que já mede as 4 frentes
- **Comercial** (D202): funil único do contato ao pagante.
- **Crescimento** (D204).
- **Tráfego e Agora no site** (D291).
- **Caixa de entrada** (D296).
- **Ecossistema.**
- **Aprender** (base de conhecimento).
- **Agências** (D313).
- **Placar.**

A etapa 1 só precisa garantir que **a frente de origem** (Commerce, Sites, Business ou Soluções) chegue ao Comercial do Master. O campo "O que você quer?" do cadastro já grava a intenção.

---

## Parte 3. O mapa contra o Bitrix24 (o que temos, o que falta, o que custa)

| Área do Bitrix24 | Temos? | Onde | Falta | Etapa |
|---|---|---|---|---|
| CRM (contatos, negociações, funil) | **Sim** | `/merchant/crm`, `/merchant/contatos`, Comercial da agência | Juntar em um "Funil" com quadro (o Comercial do Master tem quadro e lista) | 1: vitrine e nomes; 2: unificar |
| Tarefas e projetos | **Sim, para agências** | `/agencia/producao` | Abrir para qualquer empresa | 2 |
| Chat e canais abertos | **Parcial** | Atendimento, caixa de entrada | WhatsApp oficial com vários atendentes | Depois (configuração avançada) |
| Site e loja | **Sim, melhor que o Bitrix** | Sites e Commerce | | Pronto |
| Portal do cliente (extranet) | **Sim, para agências** | `/portal/[slug]` | Abrir para qualquer empresa (academia primeiro) | 2 (NB10) |
| Assinatura eletrônica e contratos | **Sim** | Contratos da agência e da NextLevel | Modelo livre para qualquer empresa | 2 |
| Marketing e anúncios | **Sim, melhor** | Anúncios na Meta, campanhas, origem do contato | | Pronto |
| Relatórios | **Sim** | Análise, crescimento, placar | | Pronto |
| CoPilot (IA) | **Sim, base** | Maurício e agente da agência | IA dentro do funil (resumo, próxima ação, resposta) | 2 |
| Automação | **Parcial** | Etapas do CRM que andam sozinhas | Regras configuráveis | Depois |
| Caixa (frente de loja) | **Parcial** | Balcão (Brás) | NB7 instalado no computador | Depois |
| Telefonia, e-mail próprio, drive | Não | | Fora do foco | Não fazer agora |

**Mensagem comercial:** "Tudo o que uma pequena e média empresa usa do Bitrix24, mais site e loja de verdade, origem de cada cliente e uma agência do lado. Em reais e em português simples."

---

## Parte 4. As quatro páginas públicas (mesmo molde, copy diferente)

### 4.1 Como fazer sem duplicar
Criar **`src/lib/marcas/frentes.ts`** com o tipo `Frente` e um registro `FRENTES` para `commerce`, `sites`, `business` e `solucoes`:

```ts
type Frente = {
  chave: "commerce" | "sites" | "business" | "solucoes";
  nome: string;          // "NextLevel Sites"
  curto: string;         // "Sites"
  linha: string;         // uma linha para menu e cartões
  href: string;          // "/sites"
  icone: NavIcon;
  heroi: { rotulo: string; titulo: string; destaque: string; texto: string; dados: { rotulo: string; valor: string }[] };
  beneficios: { titulo: string; texto: string }[]; // 6 cartões (padrão "O que vem")
  passos: { titulo: string; texto: string }[];     // 3 passos
  faq: { q: string; a: string }[];
  cta: { principal: { rotulo: string; href: string }; secundario?: { rotulo: string; href: string } };
  secoes: SecaoFrente[];  // quais seções do molde aparecem, em ordem
};
```

- **Preço nunca na copy.** Os dados do herói que falam de preço leem da tabela (`commercePlansView`, `getPriceBook`). A copy diz só o rótulo.
- **Marca pelo endereço.** Tudo dentro de `getBrand()` com `NEXTLEVEL_COMMERCE`; outras marcas não veem as frentes.
- **Molde:** `PaginaDeFrente({ frente })`, um componente servidor que monta as seções a partir de peças existentes:
  - `CabecalhoTech`;
  - grade de cartões (de `/empresas`);
  - `CommercePlansSection` (com aba);
  - `ComparativoHome` (com tabela da frente);
  - `BlocoEquipe`;
  - FAQ;
  - faixa "Também da NextLevel".

### 4.2 Copy proposta por frente (para revisar com o dono)

**NextLevel Commerce (home de hoje, só ganha a ponte)**
- Herói atual.
- Nova faixa logo abaixo de "Dois caminhos": **"Quatro portas, um painel"**.

**NextLevel Sites (`/sites`)**
- **Rótulo:** NextLevel Sites.
- **Título:** "Seu site que *transforma anúncio em cliente*".
- **Texto:** "Páginas da empresa e das suas campanhas, pedido de orçamento com a origem de cada contato e o painel para responder e fechar. Pronto em minutos, no seu domínio."
- **Dados:** "Para começar: R$ xx/mês" (tabela) · "Origem do contato: Meta, Google, Instagram" · "Fidelidade: nenhuma".
- **Benefícios:** os 6 de `/empresas` (já escritos).
- **Passos:** escolha o modelo · troque textos e fotos · ligue o anúncio.
- **Comparativo:** "Site comum × NextLevel Sites" (não sabe de onde veio × sabe; formulário no e-mail × funil; dólar × reais).
- **CTA:** "Criar meu site" (`/cadastro?para=site`) · "Quero ajuda para montar" (Soluções).

**NextLevel Business (`/business`)**
- **Rótulo:** NextLevel Business.
- **Título:** "O *coração do seu negócio* num lugar só".
- **Texto:** "Funil de clientes, atendimento, contratos, portal do cliente, equipe e resultados dos anúncios. Para a empresa que cresceu e não cabe mais no WhatsApp e na planilha."
- **Dados:** "Portal do cliente: ilimitado" · "Equipe: a partir de 5 pessoas" · "Incluso no plano Scale".
- **Benefícios (só o que existe; o resto marcado "em breve"):**
  - funil de clientes com etapas;
  - contatos com origem;
  - atendimento;
  - contratos com aceite;
  - análise e anúncios;
  - Maurício, a IA do painel;
  - em breve: projetos e tarefas, portal do cliente para qualquer empresa, caixa.
- **Comparativo:** "custo da pilha" (CRM por usuário + site + loja × NextLevel) e quadro "Bitrix24 × NextLevel Business" (Parte 3).
- **Planos:** Essencial, Profissional e Avançado (preço da tabela; se a venda ainda for por proposta, cartão com "falar com a gente").
- **CTA:** "Quero conhecer o Business" (`/quero-minha-loja?para=business`, com demonstração) · "Já tenho loja: ver no meu plano".

**NextLevel Soluções (`/solucoes`, já existe)**
- Mantém a vitrine.
- Ganha o herói com o mesmo `CabecalhoTech`:
  - **título:** "A *agência* que usa o sistema que você usa";
  - **texto:** "Montamos seu site ou loja, rodamos seus anúncios e cuidamos do seu painel. Você acompanha tudo pelo Meu negócio."
- Ganha a faixa "Também da NextLevel".

### 4.3 Endereços
| Endereço | Situação |
|---|---|
| `nextlevelcommerce.com.br/` | Home Commerce + faixa das 4 portas |
| `/sites` | Novo (molde); `/empresas` → 301 para `/sites` |
| `/business` | Novo (molde) |
| `/solucoes` | Existe; no domínio da Commerce, ou link do grupo (`groupLink`) como hoje: **conferir no passo 0** |
| `/planos?aba=lojas\|sites\|business` | Abas |
| Domínios próprios (nextlevelsites…, nextlevelbusiness…) | **Depois.** Só quando houver tráfego que justifique; um domínio só economiza SEO e Render |

---

## Parte 5. Preços e regras aceitos pelo dono (recomendações de 17/11)
1. **Portal do cliente grátis e ilimitado** (não cobrar por cliente no portal).
2. **Sites Start a R$ 79**; Sites Pro e Scale iguais à loja (R$ 249 e R$ 499). Valores **só na tabela do Master**.
3. **50% no segundo produto** (Site + Loja), uma regra só, no lugar do adicional de R$ 29 (quem já tem mantém). A regra "50% no 1º ano e 30% depois" fica para quando houver volume.
4. **Business Essencial incluso no Scale** (Lojas Scale e Sites Scale).
5. **Meta: 10 empresas pagantes em qualquer porta.** Muda o texto da regra D174 no `CLAUDE.md` e no `AGENTS.md`.
6. **Business vendido por proposta** aos pilotos (UP e academia), com os preços de referência R$ 199, R$ 499 e R$ 999. A compra automática do Business só depois do primeiro pagante.
7. **Fica para depois das 10 pagantes:** Rede NextLevel (desconto por indicação no portal), Business + IA, adicionais por uso e a regra 50%/30%.

---

## Parte 6. Painel: como o "Meu negócio" mostra as 4 frentes
1. **Cartão "Seu ecossistema NextLevel"** na visão geral (`/merchant`, com `BUSINESS_V1`), com 4 linhas:
   - **Loja virtual:** ligada / ligar sem custo (caminho Site) / contratar com 50%;
   - **Site:** ligado / ligar com 50%;
   - **NextLevel Business:** incluso no Scale / conhecer;
   - **Soluções da agência:** "Peça para a equipe fazer" (Loja NextLevel, Anúncios na Meta).
2. **Menu (`navDoNegocio`):**
   - o grupo "NextLevel Business" (hoje com rótulo "Meu negócio", D324) continua o dia a dia;
   - entra um item com cadeado "**NextLevel Business**" que leva à vitrine interna (`/merchant/negocio/plano#business`) para quem não tem;
   - quem tem o direito `MODULO_BUSINESS` vê os itens avançados.
3. **Plano do negócio** (`/merchant/negocio/plano`) vira a vitrine interna das 4 frentes, com os mesmos cartões da página pública (a mesma `FRENTES`).
4. **Direito `MODULO_BUSINESS`:**
   - novo valor em `MODULOS`, sem tabela nova;
   - concedido automaticamente para o plano Scale (fonte `PLAN`) e à mão pelo Master para os pilotos (fonte `MANUAL`);
   - o que ele libera na etapa 1: o rótulo e a vitrine. Os itens avançados entram na etapa 2.

---

## Parte 7. Riscos e cuidados
| Risco | Cuidado |
|---|---|
| Prometer módulo que não existe | "Em breve" explícito; só "incluso" o que está no ar; sem promessa de resultado |
| Quebrar a home que vende hoje | A home só ganha uma faixa; a copy da Commerce não muda |
| SEO de `/empresas` | 301 para `/sites`; canônico e `sitemap.ts` atualizados |
| Preço escrito no código | Teste: nenhum `R$` literal em `frentes.ts` |
| Outras marcas (SuperDrop, Brás) | Frentes só com `NEXTLEVEL_COMMERCE`; `BUSINESS_V1` continua sendo a chave |
| Gasto de Render | Etapa 1 = uma publicação; documentos com `[skip render]` |
| Colisão com outros chats | `git fetch` e pull da branch de publicação antes de cada decisão e migração |
| Acessibilidade | Varredura `axe` e 360 px nas páginas novas |

---

## Parte 8. Como medir que funcionou
- Visitas por frente (`/sites`, `/business`, `/solucoes`) no Tráfego do Master (D291).
- Cadastros por resposta de "O que você quer?" (4 opções) no Comercial do Master.
- Cliques nas pontes ("Também da NextLevel", cartão do ecossistema).
- Pedidos de demonstração do Business.
- Meta: **10 empresas pagantes em qualquer porta.**

---

# Parte 9. PROMPT ENGENHEIRO MESTRE

> Copie a etapa do dia inteira para a sessão de trabalho. Cada etapa termina com **uma** publicação de código.

## Contexto fixo (vale para as duas etapas)
Você trabalha no repositório NextLevel (Next.js 16, React 19, TypeScript estrito, Drizzle, Tailwind v4, Vitest, Playwright via `playwright-core`). Leia:
- `CLAUDE.md` e `AGENTS.md`;
- este arquivo (`docs/prompts/ecossistema-tudo-em-um-aproveitamento.md`);
- `docs/prompts/estrategia-dono-nextlevel-commerce-business.md`;
- as decisões D306 a D327 em `docs/design/DECISIONS.md`.

Regras que não quebram:
- **Antes de tudo:** `git fetch origin claude/wonderful-cannon-5o38v5` e pull com rebase. Confira o próximo número livre de decisão (esperado D328) e de migração.
- **Aproveitar antes de criar:** procure o componente ou módulo pronto (Parte 2). Copy diferente sobre o mesmo componente; nada de página copiada e colada.
- **Preço:** só da tabela do Master (`getPriceBook`, `commercePlansView`, catálogo); valores em centavos; sem promessa de ganho.
- **Marca:** só a marca `NEXTLEVEL_COMMERCE`, com `getBrand()`; as outras marcas não mudam.
- **Banco:** página com banco declara `export const dynamic = "force-dynamic"`.
- **Acesso:** permissões no servidor; um tenant nunca lê o outro.
- **Testes enxutos:** durante o trabalho, `npx tsc --noEmit`, `npx eslint src e2e tests` e os testes dos arquivos mexidos; no fim, a bateria e `npm run build`, porque é mudança grande.
- **Demonstração:**
  - `export BUSINESS_V1=true BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true BRAND_URL_NEXTLEVEL_COMMERCE=http://cm.test:3100 BRAND_DOMAINS_NEXTLEVEL_COMMERCE=cm.test && bash scripts/restart-demo.sh`;
  - Playwright com `--host-resolver-rules=MAP *.test 127.0.0.1`;
  - antes do push: pare a demo e `rm -rf .next/dev/types`.
- **Publicar:** fast-forward da branch de trabalho para `claude/wonderful-cannon-5o38v5`; nunca `--force`; sem PR.
- **Entrega ao dono:** prints reais (360 e 1440 px) das telas principais; relatório em `docs/relatorios/ECO1-AAAA-MM-DD.md` com a linha "Esforço do dia por frente".
- **Decisão:** registrar em `DECISIONS.md` com `[E-commerce]` no título, citar na `docs/conhecimento/BC0-INVENTARIO.md`, rodar `node scripts/gerar-novidades.mjs` e atualizar "(próxima: Dxxx)" no `CLAUDE.md`.
- **Regra do dono (17/11):** se algo deste plano parecer ruim para a empresa, pare, explique o problema e traga a alternativa antes de implementar.

---

## ETAPA 1 (hoje): visual e comercial, sem IA e sem configuração avançada

**Objetivo:** quem chega em qualquer página pública ou abre o painel enxerga as 4 frentes, entende o que cada uma faz, vê o preço da tabela e tem um caminho de um clique para a outra. Sem tabela nova; no máximo entradas na tabela de preços e no catálogo, que são dados.

### Passo 0: conferência (15 min, relatar antes de codar)
1. Liste as seções de `HomeImersivaEc` e quais recebem props, e quais têm texto fixo.
2. Veja como `/planos` e `CommercePlansSection` leem o catálogo, e se um plano novo de Sites (`SITES_START`, `SITES_PRO`, `SITES_SCALE`) pode entrar **só como dado** do catálogo (`catalog-seed.ts` + tabela do Master) e ser contratado pelo fluxo de assinatura atual.
   - **Se sim:** faça o Passo 5 completo.
   - **Se exigir mudar cobrança:** mostre o preço como "a partir de" na página e deixe a contratação para a Etapa 2 (registre isso na decisão).
3. Confira onde `/solucoes` responde (domínio da Commerce ou do grupo via `groupLink`) e escolha a ponte certa.
4. Confira o número livre da decisão.

### Passo 1: registro das frentes
- `src/lib/marcas/frentes.ts`: tipo `Frente`, `FRENTES` (4 itens) e `frenteDe(chave)`, com a copy da Parte 4.2 e nenhum valor em reais.
- **Teste `tests/frentes.test.ts`:**
  - 4 frentes, `href` únicos;
  - nenhuma copy com `R$` ou dígito seguido de "%" de ganho;
  - cada frente lista as outras 3 em `pontes()`.

### Passo 2: molde da página de frente
- `src/components/portal/frentes/pagina-de-frente.tsx` (servidor), montando a partir das peças:
  - `CabecalhoTech`;
  - grade de benefícios (extrair a de `/empresas` para `GradeBeneficios`);
  - passos;
  - planos da frente;
  - comparativo da frente;
  - `BlocoEquipe`;
  - FAQ;
  - `TambemDaNextLevel`.
- `src/components/portal/frentes/tambem-da-nextlevel.tsx`: 3 cartões (as outras frentes), com o mesmo estilo `ec-cartao`.
- **Páginas:**
  - `src/app/(portal)/sites/page.tsx`: frente sites;
  - `src/app/(portal)/business/page.tsx`: frente business;
  - as duas com `force-dynamic`, `notFound()` fora da Commerce ou com `BUSINESS_V1` desligada, e metadados SEO (`metadadosDaPagina`, adicionar as rotas na tabela de metadados e no `sitemap.ts`);
  - `/empresas`: `permanentRedirect("/sites")`.
- **Home Commerce:** `DoisCaminhos` vira "Quatro portas", com os mesmos cartões, mais Business e Soluções (com a chave ligada; sem ela, fica como está).
- **`/solucoes`:** herói com a copy da frente e `TambemDaNextLevel` no fim, sem mexer na vitrine.

### Passo 3: cabeçalho, rodapé e cadastro
- **Cabeçalho do `(portal)`:** item "Produtos" com submenu das 4 frentes. No celular, lista simples dentro do menu; sem rolagem horizontal em 360 px.
- **Rodapé:** coluna "NextLevel" com as 4 frentes.
- **Cadastro e formulários:** "O que você quer?" ganha "Sistema de gestão (Business)" e "Ajuda da agência":
  - Business → cria a conta no caminho Site e marca a intenção `business` no lead para o Comercial do Master;
  - Agência → leva ao diagnóstico de `/solucoes`.
  - Testar a gravação da intenção.

### Passo 4: comparativos ("custo da pilha")
- Reaproveitar `ComparativoHome` e os dados de `src/lib/marcas/comparativo-ecommerce.ts`, com novos conjuntos e o mesmo formato (fonte e data em cada linha):
  - `comparativo-sites.ts`: Wix básico;
  - `comparativo-business.ts`: RD Station CRM, Kommo e Bitrix24 (preços com fonte e data de coleta da Parte 2 da estratégia; Bitrix24 pelas telas do dono).
- Página `/comparativo` ganha abas Lojas, Sites e Business.
- Teste: todo item tem `fonte` e `coletadoEm`.

### Passo 5: preços e planos
- **Tabela do Master e catálogo** (dados, não código de regra):
  - planos Sites Start, Pro e Scale com os valores aprovados;
  - desconto de 50% no segundo produto;
  - referência do Business: Essencial, Profissional e Avançado, como "sob proposta" com "a partir de".
- `/planos?aba=` com 3 abas e o mesmo cartão. Business mostra o que está incluso, "incluso no Scale" e "Falar com a gente".
- **Regra dos 50%:** onde o `contratarModulo` hoje cobra o adicional `MODULO_SITE`, passa a cobrar 50% do plano de Sites equivalente (função pura testada `precoDoSegundoProduto`). Quem já tem o adicional mantém.
- Se o Passo 0 indicar que mexer na cobrança é grande, **adie a cobrança** e só mostre a regra.

### Passo 6: painel
- `MODULOS` ganha `business`, com `MODULO_LABEL.business = "NextLevel Business"`.
  - `modulosDe` ativa `business` quando houver o direito `MODULO_BUSINESS` ou o plano for Scale.
  - Teste em `tests/business-modulos.test.ts`.
- **Cartão "Seu ecossistema NextLevel"** na visão geral (com a chave ligada): 4 linhas, estado e um botão cada. Componente `CartaoEcossistema`, reaproveitando os estilos de `/merchant/negocio/plano`.
- **`navDoNegocio`:** item "NextLevel Business" (com cadeado para quem não tem) e "Pedir ajuda da equipe" (`/merchant/services`). Atualize `tests/nav-business.test.ts`.
- **`/merchant/negocio/plano`:** seções por frente usando `FRENTES` (nome, linha, estado, ação).
- **Master:** ao conceder o Business à mão para um piloto, use o mesmo fluxo de direitos que já existe (sem tela nova se já houver concessão manual; conferir).

### Passo 7: verificação, prints e publicação
1. Tipos, estilo e testes novos e mexidos; depois `npx vitest run` e `npm run build`.
2. Demo + Playwright nas páginas abaixo, com `axe` sem violações graves e sem rolagem horizontal:
   - páginas públicas: `/`, `/sites`, `/business`, `/solucoes`, `/planos?aba=sites`, `/planos?aba=business`, `/comparativo`;
   - painel: `/merchant` (cartão do ecossistema), `/merchant/negocio/plano`.
   - Prints em 360 e 1440 px em `docs/relatorios/eco1/`.
3. **D328:** "[E-commerce] Ecossistema tudo em um: quatro frentes (Commerce, Sites, Business, Soluções), um painel, pontes entre elas". Registrar:
   - as 7 regras da Parte 5;
   - a meta "10 empresas pagantes em qualquer porta", também no `CLAUDE.md` e no `AGENTS.md`;
   - o que ficou para a Etapa 2.
   - Depois: citação no BC0, `gerar-novidades` e "(próxima: D329)".
4. Relatório `docs/relatorios/ECO1-AAAA-MM-DD.md`.
5. Uma publicação. Depois, conferir no ar (`nextlevelcommerce.com.br/sites` e `/business`) e mandar os prints ao dono.

**Fora da Etapa 1:** IA, WhatsApp oficial, Pixel por loja, caixa instalado, portal para outros segmentos, projetos e tarefas para qualquer empresa, compra automática do Business, Rede NextLevel.

---

## ETAPA 2 (outro dia): IA e o Business por dentro, sem configuração muito avançada

**Objetivo:** o Business deixa de ser vitrine e passa a ter os módulos generalizados do Painel da Agência, mais a IA do Maurício trabalhando dentro do funil. Tudo reaproveitando o que existe.

### Passo 0: conferência
- Releia a D328 e o relatório ECO1.
- Mapeie em `src/lib/agencias/*` o que está preso à palavra "agência" (rótulos, papéis, `agenciasLigado`) e o que é genérico.
- Relate antes de codar.

### Passo 1: Projetos e tarefas para qualquer empresa
- Reaproveitar a Produção da agência (`/agencia/producao`, D314).
- Rótulos por segmento: "Produção" → "Projetos e tarefas"; "peça" → "tarefa".
- Mesmo quadro e lista, dentro do grupo NextLevel Business do `/merchant`, só para quem tem `business`.
- Se o modelo de dados da agência estiver amarrado à agência, criar o vínculo por loja **estendendo** a tabela (coluna de dono genérico), nunca uma tabela nova paralela.
- Migração com `/nova-migracao`.

### Passo 2: Funil único
- Juntar Contatos (D309) e Clientes (CRM, D207) num **Funil** com quadro e lista (padrão do Comercial do Master, D202), sem mudar os dados.
- O CRM continua; o funil é uma visão.

### Passo 3: Portal do cliente para qualquer empresa (academia primeiro, NB10)
- Reaproveitar `/portal/[slug]` (D320): acompanhar, aprovar, pagar, pedir e aceitar contrato.
- Sem limite de clientes (regra da Parte 5).
- Ligar só para quem tem `business` e só depois que `docs/prompts/portal-academia-piloto.md` estiver preenchido pelo dono.

### Passo 4: Contratos para qualquer empresa
- Reaproveitar os contratos da agência (D321): modelo, aceite pelo portal e PDF.

### Passo 5: IA do Maurício dentro do Business (base que já existe, D194)
Funções:
- **resumo do contato e próxima ação** na ficha (Contatos e Funil);
- **resposta sugerida** para WhatsApp e e-mail (copiar e colar; nada é enviado sozinho);
- **texto de página de campanha e de serviço** no site (mesma IA que já escreve descrições);
- **pergunta ao painel:** "quantos orçamentos fechei este mês vindos da Meta?", lendo só os dados da própria loja (teste de isolamento).

Regras:
- cota por plano (`beneficios-plano.ts`: IA 40, 350 ou 1200);
- nada de cota ilimitada;
- custo registrado como hoje.
- Sem treinar modelo e sem chave nova: usa o provedor e a configuração atuais.

### Passo 6: Agente da agência (`/agencia/agente`) como modelo do agente do Business
- Mesma tela e mesma regra; troca só o contexto (dados da loja em vez da carteira da agência).

### Passo 7: verificação e publicação
Igual à Etapa 1:
- decisão nova;
- relatório `ECO2-AAAA-MM-DD.md`;
- prints de Projetos e tarefas, Funil, ficha com resumo da IA e portal da academia, se ligado;
- uma publicação.

---

## DEPOIS (configuração avançada; não entra nas Etapas 1 e 2)
| Item | Por que espera | Plano de origem |
|---|---|---|
| WhatsApp oficial com vários atendentes | Conta na Meta, número verificado, custo por conversa | Business, NB3 |
| Pixel e API de conversões por loja (página de campanha) | Consentimento e chaves por loja | NB4, D295/D298 |
| Leitura automática da Meta no Business | Token por loja | NB9, D302 |
| Caixa instalado no computador | Aplicativo e impressora | NB7 |
| Automações configuráveis | Motor de regras | Bitrix24 |
| Rede NextLevel (desconto por indicação no portal) | Depois das 10 pagantes | Estratégia, seção 7 |
| Business + IA (aba paga), adicionais por uso | Depois das 10 pagantes | Precificação 5.6 |
| Regra 50% no 1º ano e 30% depois | Quando houver volume | Estratégia 12.3 |
| Domínios próprios por frente | Quando houver tráfego | Parte 4.3 |
| Compra automática dos níveis do Business | Depois do primeiro pagante por proposta | Parte 5 |

---

## Perguntas para o dono antes da Etapa 1 (só se ele quiser mudar algo; senão vale o que está aqui)
1. Os títulos das páginas (Parte 4.2) estão bons, ou quer outra frase para o Sites e o Business?
2. A home continua sendo a da Commerce, com a faixa das 4 portas (recomendado), ou vira uma home "guarda-chuva" das 4?
3. No Business, mostrar os valores de referência (R$ 199, R$ 499 e R$ 999) na página, ou só "sob proposta" até o primeiro pagante? (**Recomendo "a partir de R$ 199" com "falar com a gente"**.)
