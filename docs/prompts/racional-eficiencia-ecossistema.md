# Racional e plano: eficiência do ecossistema NextLevel (prompt engenheiro mestre)

> 19/10/2026. Base: `docs/mapa/MAPA-ECOSSISTEMA-2026-10-18.md` (mapa e análise) e auditoria do código feita com as skills
> `repo-auditor`, `impact-analysis`, `architecture-drift` e `acceptance-designer`.
> **Estado: aguardando o OK do dono.** A Parte A é para você ler e aprovar. A Parte B é o prompt que eu (ou outro agente) sigo
> para construir, fase por fase. Nada de código antes do OK.

---

# Parte A. Racional (para aprovar)

## A1. O problema em uma frase

O sistema cresceu certo na base (um motor, várias marcas), mas três coisas estão custando velocidade e qualidade:
- **Vazamentos repetidos:** a E-commerce nasce como "SuperDrop sem fornecedor", e cada tela decide sozinha o que ela é.
- **Lentidão para conferir:** 20 minutos de testes e nenhuma conferência automática depois de publicar.
- **Dispersão:** frentes fora do foco recebem a maior parte do esforço, o Master está pesado e há nomes que confundem.

## A2. O que a auditoria encontrou (fatos do código, 19/10)

| # | Fato | Onde | Efeito |
|---|---|---|---|
| F1 | A loja da E-commerce é criada com a **oferta do SuperDrop** (`STORE_SUBDOMAIN`). O que ela pode usar sai das ofertas do SuperDrop (`canUse(store.offer, …)`) | `src/lib/features.ts`, `src/db/commerce-demo.ts`, cadastro | Cadeados e textos do SuperDrop no painel da E-commerce (D170 corrigiu só a Análise) |
| F2 | **4 funções diferentes** dizem "que loja é esta": `isCommerceStore`, `brandCodeOfStore`, `storeModality`, e `isIndependentStore` **duplicada** em dois arquivos | `src/lib/store-brand.ts`, `src/lib/domain/order-policy.ts`, `src/lib/domain/independent.ts` | Cada tela consulta o banco de novo e pode chegar a uma conclusão diferente |
| F3 | **35 decisões soltas** "é E-commerce?" em telas, **30 telas** checando "independente", **54 textos** com "SuperDrop" fixo e 46 leituras diretas de `store.offer` | `src/app/**`, `src/components/**` | É a origem de todo vazamento corrigido nos dias 17 e 18 |
| F4 | A casca do painel já calcula marca e "independente" **uma vez**, mas as páginas recalculam por conta própria | `src/components/app/role-layout.tsx` | Trabalho repetido e regras que divergem |
| F5 | Ainda aparece "Administração Commerce" na casca do Admin E-commerce | `role-layout.tsx` | Nome antigo da marca |
| F6 | **Cada um dos 117 arquivos de teste recria o banco do zero** (69 migrações + dados de demonstração) | `tests/setup.ts` (`freshDb`) | A bateria leva cerca de 20 minutos; o banco é a maior parte disso |
| F7 | A verificação do GitHub está parada desde 08/10 (pagamento). A trava local antes do envio só confere tipos e estilo. **Não há conferência do site no ar depois de publicar** (`e2e/smoke-demo.mjs` é só para a demonstração) | `.github/workflows/ci.yml`, `.githooks/pre-push` | Um erro no SuperDrop, que tem clientes, pode chegar ao ar |
| F8 | O filtro de marca do Master **já existe** (`masterBrandFilter`), mas só em 3 telas e não guarda a escolha | `src/lib/brand-server.ts` | Dá para estender sem refazer |
| F9 | O Master tem 22 itens no menu, mais 2 consoles com menus próprios: `/commerce` com 7 e `/bras` com 15. Há dois "Financeiros" | `src/lib/nav.ts` | Difícil achar as coisas; manter três menus |
| F10 | O programa de pontos **já tem nome**: "NextLevel Club" (D152, página `/club` do grupo). Mas a tela de entrada diz "Club do Grupo NextLevel" e **21 telas** falam em "pontos do Brás Digital Club" | `fio-captacao.tsx`, `meu-bras`, `importadora`, `transportadora`, `/bras/club` | O cliente não sabe se o Club é do grupo ou da Brás |
| F11 | `nextlevelgroup.com.br/` leva direto para `/solucoes` | `src/lib/host-routing.ts` (linhas 70 e 73) | O grupo aparece como agência; as marcas ficam escondidas |
| F12 | A aba "Pronto e desligado" já lista **22 itens** (cobrança, acesso, comunicação, ecossistema) | `src/lib/domain/qualidade-desligados.ts` | Funciona como inventário, mas ninguém decide o destino de cada item |
| F13 | Desde a D91, foram 37 de 80 decisões para Brás, Club e Cargas, 11 para a E-commerce e 5 para o SuperDrop | `docs/design/DECISIONS.md` | O esforço vai para fora do foco declarado no `CLAUDE.md` |

## A3. As 6 frentes do plano (e por que nesta ordem)

| Ordem | Frente | Por que agora | Esforço | Risco para o SuperDrop |
|---|---|---|---|---|
| 1 | **R0. Rede de proteção:** testes rápidos e conferência no ar | Tudo o que vem depois mexe em muitas telas. Sem rede, cada mudança é uma aposta | 1 a 2 dias | Nenhum (só testes) |
| 2 | **R1. Perfil da loja único** | Causa raiz dos vazamentos. Depois disso, as telas da E-commerce deixam de herdar o SuperDrop | 3 a 4 dias | **Alto se feito sem cuidado.** Por isso há teste de "antes = depois" do SuperDrop |
| 3 | **R3. Nomes e home do grupo** | Barato, visível ao cliente e tira a confusão do Club | 1 dia | Baixo (só texto) |
| 4 | **R2. Master com seletor de marca** | Só a equipe usa; ganha velocidade de operação | 3 a 4 dias | Nenhum (só o Master) |
| 5 | **R4. Revisão do "Pronto e desligado"** | Processo de 15 minutos por mês; corta peso morto | 0,5 dia + rotina | Nenhum |
| 6 | **R5. Regra de foco** | Processo: protege a E-commerce de novas dispersões | 0,5 dia | Nenhum |

**Fora deste plano:** as fotos de Brás, Cargas e SuperDrop, que seguem por fora pelo pacote de imagens e entram sozinhas.

## A4. O que muda para quem usa

- **Lojista da E-commerce:** nenhum cadeado ou palavra do SuperDrop em nenhuma tela. O que ele pode usar sai do plano dele (Start, Pro ou Scale), configurável no Master.
- **Lojista e fornecedor do SuperDrop:** **nada muda.** Mesmas telas, mesmos cadeados e mesmos textos. Isso é garantido por teste.
- **Membro, importadora e transportadora:** o programa de pontos passa a se chamar sempre "NextLevel Club".
- **Você no Master:** um seletor de marca no topo, um menu só que mostra o que existe naquela marca, e um financeiro com abas.
- **Visitante de nextlevelgroup.com.br:** vê o grupo e as marcas, com a Soluções como uma das portas.
- **Para mim (e para a velocidade):** testes em poucos minutos e conferência automática depois de cada publicação.

## A5. Decisões que preciso de você antes de começar

| # | Pergunta | Minha recomendação | Se você não responder |
|---|---|---|---|
| Q1 | Divisão de esforço até a E-commerce ter 10 lojistas pagando | 60% E-commerce · 25% SuperDrop · 15% resto (Brás e Cargas só fotos e correções) | Uso a recomendação |
| Q2 | Nome do programa de pontos | **Manter "NextLevel Club"** (já existe) em todas as telas. A marca segue "Brás Digital Club", porque o domínio já é seu | Uso a recomendação |
| Q3 | Home de nextlevelgroup.com.br | Página curta do grupo (quem somos, as marcas, "Soluções para empresas" como porta) | Mantenho `/solucoes` e não faço essa parte |
| Q4 | Unificar `/commerce` e `/bras` no Master com seletor de marca | Sim, mantendo os endereços antigos funcionando | Faço só o seletor, sem mexer nos consoles |
| Q5 | O que cada plano da E-commerce libera | **Começar com tudo liberado nos 3 planos** (como na prática já é), com a tabela editável no Master para você restringir depois | Uso a recomendação |
| Q6 | Destino dos 22 itens desligados | Você decide na primeira revisão (R4), com a minha sugestão por item | Faço só a tela da revisão |

## A6. Como vou provar que ficou pronto

- **R0:** bateria completa medida antes e depois (meta: no máximo 6 minutos); `npm run test:rapido` abaixo de 2 minutos; conferência no ar rodando sozinha depois de cada envio.
- **R1:** zero ocorrências de "SuperDrop", "Central", "recarga" ou "Loja SuperDrop" nas telas do lojista E-commerce, por varredura automática no navegador. Teste "antes = depois" do menu, dos cadeados e da fila do SuperDrop.
- **R2:** cada marca no seletor mostra no máximo 12 itens no menu; os endereços antigos continuam abrindo.
- **R3:** zero "Club do Grupo" e zero "pontos do Brás Digital Club" nas telas.
- **R4 e R5:** documento da primeira revisão e regra escrita no `CLAUDE.md`.

---

# Parte B. Prompt engenheiro mestre (executar depois do OK)

> Cole a partir daqui numa sessão nova (ou siga nesta). Execute **uma fase por vez**, na ordem R0 → R1 → R3 → R2 → R4 → R5.
> Ao fim de cada fase: skill `publicar` (tipos, estilo, testes, build, decisão nova, commit, envio). Depois, um relatório curto
> ao dono em português simples.

## B0. Papel, regras e fontes

Você é o engenheiro responsável pelo motor NextLevel (Next.js 16, React 19, TypeScript estrito, Drizzle, PGlite/Neon,
Vitest, Playwright via `playwright-core`). Leia antes:
- `CLAUDE.md` e `AGENTS.md`: pilha, comandos, regras e branch de publicação `claude/wonderful-cannon-5o38v5`;
- `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`: autoridade máxima do e-commerce;
- `docs/design/DECISIONS.md`: em especial D89, D147, D149, D152, D164 a D170; a próxima decisão é a da linha "próxima" do `CLAUDE.md`;
- `docs/mapa/MAPA-ECOSSISTEMA-2026-10-18.md` e a Parte A deste arquivo.

Regras que não podem quebrar:
1. **SuperDrop está em produção:** nenhuma mudança de comportamento dele sem teste "antes = depois".
2. Toda regra de negócio no domínio (`src/lib/domain/*`), testada. Componente não decide regra.
3. Regra configurável vem de `platform_settings` ou do catálogo do Master, nunca fixa no código.
4. Página com banco: `export const dynamic = "force-dynamic"`. Valores em centavos. Textos em português claro.
5. Um tenant nunca lê dado de outro; permissões no servidor.
6. Nunca edite migração publicada. Esta rodada **não precisa de migração**; se precisar, use a skill `nova-migracao`.
7. Estenda o que existe (regra anti-duplicação do `CLAUDE.md`). Nada de segunda fonte de verdade.
8. Commits pequenos, em português. Antes de cada envio: `git pull --rebase origin claude/wonderful-cannon-5o38v5`. Nunca use `--force`.

Diferencie sempre **fato observado**, **inferência** e **decisão do dono**. Se encontrar algo que contradiz a Parte A,
pare, registre e explique antes de seguir.

---

## B1. Fase R0: rede de proteção (fazer primeiro)

**Objetivo:** bateria completa em no máximo 6 minutos, bateria rápida em menos de 2 minutos, e conferência automática do site no ar depois de cada publicação.

### R0.1 Banco de teste pronto uma vez, copiado por teste
- **Fato:** `tests/setup.ts` → `freshDb()` cria o PGlite, roda as 69 migrações e o `seedDatabase` a cada chamada (117 arquivos usam).
- **Fazer:** gerar um "molde" uma vez por execução: banco migrado e semeado, salvo com `dumpDataDir` do PGlite num arquivo
  temporário (via `globalSetup` do Vitest). `freshDb()` carrega o molde (`loadDataDir`) em vez de migrar e semear.
  - Os ids do seed precisam continuar iguais entre cópias. Se o seed gerar ids aleatórios, devolva os mesmos objetos do molde (guarde `seed` em JSON junto do molde).
  - Mantenha `freshDb()` com a mesma assinatura, para os 117 arquivos não mudarem.
  - Se o PGlite desta versão não tiver `dumpDataDir`/`loadDataDir`, a alternativa é aplicar um dump SQL único (`pg_dump` do PGlite) ou reaproveitar o banco por arquivo com transação revertida. Escolha a que medir mais rápido e registre o porquê.
- **Aceite:** tempo da bateria completa medido antes e depois e anotado na decisão; os mesmos 1.070+ testes passando.

### R0.2 Bateria rápida
- `package.json`: `"test:rapido": "vitest run --changed origin/claude/wonderful-cannon-5o38v5"`. Se `--changed` não pegar dependências, use `vitest related <arquivos alterados>`.
- Opcional: rodar `test:rapido` na trava `pre-push` (`.githooks/pre-push`), com limite de tempo.
- **Aceite:** com uma mudança só em `src/lib/domain/fila-do-dia.ts`, a bateria rápida roda os testes da fila em menos de 2 minutos.

### R0.3 Conferência no ar depois de publicar
- Criar `e2e/conferencia-producao.mjs`, **só leitura** e sem login:
  - `/api/health` de cada endereço responde `ok` com a versão esperada (`EXPECT_VERSION`);
  - a home de cada marca (E-commerce, SuperDrop, Brás, Cargas e o site do grupo) responde 200, tem um h1 e não tem "Application error";
  - **varredura de vazamento:** a home e `/planos` da E-commerce sem "SuperDrop", "Central", "recarga" ou "Loja SuperDrop"; o SuperDrop sem "E-commerce" no texto principal;
  - imagens principais carregam (nenhuma com `naturalWidth` zero).
- Documentar em `docs/nextlevel-commerce/verificacao-automatica.md` como rodar (`node e2e/conferencia-producao.mjs`) e incluir na skill `publicar` como passo final.
- **Aceite:** roda contra o site no ar e termina em menos de 60 segundos.

### R0.4 GitHub
Não é código: depende do dono regularizar o pagamento. Registre no relatório. Quando voltar, confira que `verificar` passa.

**Decisão a registrar:** "D1xx — Rede de proteção: molde do banco de teste, bateria rápida e conferência no ar".

---

## B2. Fase R1: perfil da loja único (causa raiz dos vazamentos)

**Objetivo:** uma função responde, uma vez por requisição, **que loja é esta e o que ela pode usar**. Todas as telas leem dela.
A E-commerce para de depender das ofertas do SuperDrop.

### R1.1 Domínio
- Criar `src/lib/domain/perfil-loja.ts`:
```ts
export type PerfilLoja = {
  storeId: string;
  marca: BrandCode;                         // da organização da loja (brandCodeOfStore)
  modalidade: "INDEPENDENT" | "SUPPLIER_OWN" | "NETWORK"; // storeModality
  independente: boolean;                    // modalidade === "INDEPENDENT"
  ecommerce: boolean;                       // marca === "NEXTLEVEL_COMMERCE"
  oferta: OfferKey | null;                  // SÓ no SuperDrop; null na E-commerce
  plano: { productKey: string; nome: string; status: string } | null; // E-commerce: nl_subscriptions
  pode: Record<FeatureKey, boolean>;        // decisão final por recurso
  vocabulario: { produto: string; quemPrepara: string; custo: string }; // "NextLevel E-commerce"/"Sua loja"/"Custo dos produtos" × "SuperDrop"/"Central"/"Custo à Central"
};
export async function perfilDaLoja(db: Database, store: Store): Promise<PerfilLoja>;
export function podeUsar(perfil: PerfilLoja, recurso: FeatureKey): boolean;
```
- Regras de `pode`:
  - **SuperDrop:** exatamente `OFFER_FEATURES[store.offer]` de hoje (comportamento intocado).
  - **E-commerce:** a tabela "plano → recursos" lida de `platform_settings` (chave `ecommerce.recursos-por-plano`), com padrão "tudo liberado nos 3 planos" (Q5).
  - Sem plano ativo (teste ou carência): mesma tabela do Start.
  - `entitlements.ts` (direitos comprados) **soma** ao plano, nunca tira.
- Unificar as fontes:
  - `isIndependentStore` passa a existir **uma vez só**: fica em `order-policy.ts`, e `independent.ts` reexporta. Os dois hoje leem colunas diferentes (`networkId` × `kind`); confira se dão sempre o mesmo resultado e documente;
  - `isCommerceStore` e `brandCodeOfStore` continuam, mas o perfil é o caminho recomendado.
- Cache por requisição com `cache()` do React (`import { cache } from "react"`), para a casca e a página não consultarem o banco duas vezes.
- Tela no Master para editar "plano → recursos" da E-commerce: estender `/master/plans` ou `/commerce/plans`, com auditoria como as outras regras.

### R1.2 Casca e telas
- `src/components/app/role-layout.tsx`: calcular o perfil uma vez e usá-lo para menu, cadeados (`MERCHANT_GATES`) e link da vitrine. Trocar o rótulo "Administração Commerce" por "Administração E-commerce".
- Migrar as telas do lojista, **uma por commit**, trocando:
  - `isCommerceStore(...)` / `commerce ?` → `perfil.ecommerce`;
  - `isIndependentStore` / `storeModality` → `perfil.independente` / `perfil.modalidade`;
  - `canUse(store.offer, x)` → `podeUsar(perfil, x)`;
  - textos com "SuperDrop", "Central" ou "Custo à Central" → `perfil.vocabulario.*`.
- **Ordem de migração** (maior risco de vazamento primeiro):
  1. `merchant/page.tsx`;
  2. `merchant/finance`, `merchant/after-sales`, `merchant/orders/[id]`, `merchant/analytics`, `merchant/templates`, `theme-editor`, `merchant/settings`;
  3. o restante de `merchant/*`;
  4. `components/shared/order-detail.tsx`, `components/commerce/*`;
  5. Master: `master/orders/[id]` e `master/stores` já recebem a marca; trocar pelo perfil.
- Remover `analiseLiberada` (D170) quando a Análise ler o perfil, mantendo o teste equivalente.
- Os 54 textos fixos "SuperDrop": os que estão em tela compartilhada pelas duas marcas passam a vir de `perfil.vocabulario` ou de `getBrand()`. Os que só aparecem no SuperDrop ficam, com um comentário `// só SuperDrop`.

### R1.3 Testes (obrigatórios)
- `tests/perfil-loja.test.ts`:
  - loja SuperDrop em cada oferta gera exatamente os `pode` de hoje (tabela gerada a partir de `OFFER_FEATURES` antes da mudança e congelada no teste);
  - loja E-commerce sem plano, com Start, com Pro e com Scale gera `pode` segundo a tabela padrão; mudando a tabela em `platform_settings`, o resultado muda;
  - entitlement comprado soma, nunca tira;
  - os dois `isIndependentStore` antigos dão o mesmo resultado nas lojas do seed.
- **Teste "antes = depois" do SuperDrop:** menu, cadeados e fila do dia das contas `dono@arena10.demo` e `loja@mrssports.demo` iguais aos de hoje. Gerar a fotografia antes de mexer e guardar em `tests/__fixtures__/superdrop-painel.json`.
- **Teste estático anti-vazamento** (`tests/sem-superdrop-no-lojista.test.ts`): varre `src/app/merchant/**` e `src/components/{shared,commerce}/**` atrás de literais "SuperDrop", "Central" ou "Loja SuperDrop" fora das linhas marcadas `// só SuperDrop`. Falha se encontrar.
- **e2e:** estender `scripts/auditoria/marca.mjs` para entrar como `lojista@commerce.demo` e `completo@commerce.demo` e visitar **todas** as rotas do menu da E-commerce, procurando "SuperDrop", "Central", "recarga", "Loja SuperDrop" e "Drop manual". Meta: zero.

**Aceite R1:** os três testes acima verdes; varredura e2e zerada; bateria completa verde; SuperDrop idêntico.
**Decisão a registrar:** "D1xx — Perfil da loja único; E-commerce sem ofertas do SuperDrop; recursos por plano no Master".

---

## B3. Fase R3: nomes e home do grupo

### R3.1 NextLevel Club em todas as telas (Q2)
- Criar `src/lib/marcas/nextlevel-club.ts` com `CLUB = { nome: "NextLevel Club", pontos: "pontos do NextLevel Club", url: "/club" }`. Fonte única do nome; nenhum texto fixo.
- Trocar nas telas:
  - `components/ecossistema/fio-captacao.tsx`: "Club do Grupo NextLevel" → `CLUB.nome`;
  - as **21 ocorrências** de "pontos do Club" ou "pontos do Brás Digital Club" em `meu-bras/*`, `importadora/indicacoes`, `transportadora/indicacoes` e `bras/club`/`bras/grupo` (sobrancelhas "Brás Digital Club · Pontos" → "NextLevel Club · Pontos");
  - comentários de `src/lib/domain/club/*.ts`: "Pontos do NextLevel Club (antes, do Brás Digital Club)".
- A marca "Brás Digital Club" **não muda** (nome, logo, domínio).
- **Teste:** varredura estática sem "Club do Grupo" e sem "pontos do Brás Digital Club" em `src/app` e `src/components`.

### R3.2 Home do grupo (Q3; só com o sim do dono)
- `src/lib/host-routing.ts`: no endereço do grupo, `/` deixa de levar a `/solucoes` e abre a página do grupo. Atualize o teste de rotas.
- Página nova `src/app/(portal)/grupo/page.tsx`, ou a home do portal quando o endereço for o do grupo, reaproveitando os componentes do site do grupo v1 (D157) e o registro de marcas (`brand.ts`). Conteúdo:
  - quem somos;
  - as 4 marcas no ar com uma frase de cada (do `tagline`) e o link para o endereço delas;
  - NextLevel Club;
  - "Soluções para empresas" como porta.
- Nada de número inventado ou promessa de ganho. Termos e privacidade no rodapé.
- **Aceite:** e2e da home do grupo em 360, 768 e 1440 px, sem rolagem lateral, axe sem violação grave; `/solucoes` continua igual; o Mapa vivo do Master continua sem página fora do lugar.

**Decisão a registrar:** "D1xx — NextLevel Club como nome único do programa; home do grupo".

---

## B4. Fase R2: Master com seletor de marca

### R2.1 Seletor que lembra a escolha
- Estender `masterBrandFilter` (`src/lib/brand-server.ts`):
  - a escolha fica em cookie (`nl-master-marca`, valores: `todas` ou um código de marca);
  - a ordem de prioridade é: parâmetro `?marca=` na URL, depois o cookie, depois a marca do endereço;
  - quem escolhe `todas` vê tudo.
- Componente no topo da casca do Master: "Marca: Todas · E-commerce · SuperDrop · Brás · Cargas". Trocar grava o cookie e recarrega.
- Toda tela do Master que lista lojas, pedidos, clientes, parceiros ou financeiro passa a respeitar o filtro (hoje são só 3). Liste as telas e migre uma por commit.

### R2.2 Menu por marca
- `NavItem` ganha `marcas?: BrandCode[]` (ausente = todas). Exemplos: Fornecedores, Redes, Catálogo e "Financeiro SuperDrop" → `["SUPERDROP"]`; os itens do Estúdio Brás → `["BRAS_DIGITAL","NEXTLEVEL_CARGAS"]`; os do Admin E-commerce → `["NEXTLEVEL_COMMERCE"]`.
- O menu do Master mostra os itens da marca escolhida. A função da equipe (`masterPathAllowed`) continua filtrando por cima.
- Unir os financeiros: `/master/financeiro` com abas "NextLevel" e "Operação SuperDrop" (a segunda só com SuperDrop ou Todas). `/master/financeiro/operacao` continua abrindo (vira a aba).
- `/commerce/*` e `/bras/*`: continuam existindo e abrindo. O menu do Master passa a levar a eles **dentro da mesma casca**, sem "Voltar ao Master". Os menus próprios (`COMMERCE_ADMIN_NAV`, `BRAS_ADMIN_NAV`) viram grupos do menu único.
- **Aceite:**
  - cada marca no seletor mostra no máximo 12 itens no menu;
  - todo endereço antigo abre (teste que percorre a lista de endereços do Master);
  - equipe com função limitada continua vendo só o que pode (teste existente de `masterPathAllowed` verde);
  - capturas em 1440 e 360 px.

**Decisão a registrar:** "D1xx — Master único com seletor de marca; financeiro com abas".

---

## B5. Fase R4: revisão mensal do "Pronto e desligado"

- Na aba "Pronto e desligado" (`src/lib/domain/qualidade-desligados.ts` e a tela da Central de qualidade), cada item ganha **decisão do mês**:
  - "ligar", "esperar mais um mês" ou "retirar";
  - data e quem decidiu, guardados em `platform_settings` (`qualidade.revisao-desligados`), com auditoria.
- Mostrar no topo: "Última revisão: dd/mm · próxima: dd/mm" e o total de itens desligados (meta: menos de 10).
- **Retirar** um item não apaga código sozinho. Gera uma tarefa no relatório para remoção num commit próprio, com teste.
- Primeira revisão: escrever `docs/relatorios/REVISAO-DESLIGADOS-2026-10.md` com a sugestão por item (ligar, esperar ou retirar, e o porquê), para o dono decidir.

**Decisão a registrar:** "D1xx — Revisão mensal do que está pronto e desligado".

## B6. Fase R5: regra de foco

- `CLAUDE.md`, seção "Direção do produto": escrever a divisão aprovada (Q1) e a regra: "Brás, Cargas e Club só recebem fotos, correções e o que destrava venda, até a E-commerce ter 10 lojistas pagando".
- `docs/design/DECISIONS.md`: cada decisão nova traz a frente entre colchetes no título (`[E-commerce]`, `[SuperDrop]`, `[Master]`, `[Brás]`, `[Cargas]`, `[Grupo]`).
- O relatório do dia ganha a linha "Esforço do dia por frente", com a contagem de commits por frente.
- **Aceite:** regra escrita no `CLAUDE.md` e no `AGENTS.md`; o próximo relatório já traz a linha.

---

## B7. Fechamento de cada fase (definição de pronto)

1. `npx tsc --noEmit`, `npx eslint src e2e tests` e `npx vitest run`: tudo verde, com o tempo anotado.
2. `npm run build` sem "Export encountered".
3. e2e da fase em 360, 768 e 1440 px, com menos movimento quando houver animação, e axe sem violação grave.
4. Decisão nova em `docs/design/DECISIONS.md` e linha "próxima" atualizada no `CLAUDE.md`.
5. Commit em português; `git pull --rebase`; envio para a branch de publicação; `e2e/conferencia-producao.mjs` contra o site no ar.
6. Relatório ao dono: o que mudou para quem usa, o que foi medido, o que depende dele.

## B8. Riscos e como evitar (análise de impacto)

| Risco | Onde | Como evitar |
|---|---|---|
| Mudar o que o lojista SuperDrop vê | R1 | Fotografia "antes = depois" e migração tela a tela, um commit por tela |
| Cache do perfil vazar entre lojas | R1 | `cache()` do React vale por requisição; teste com duas lojas na mesma execução |
| Molde do banco de teste com dado velho | R0 | O molde é gerado a cada execução (`globalSetup`), nunca salvo no repositório |
| Endereço antigo do Master parar de abrir | R2 | Teste que percorre a lista de rotas do Master (`src/lib/qualidade/rotas.ts`) |
| Home do grupo afetar o SEO da Soluções | R3 | `/solucoes` e `sitemap.xml` intocados; canônico mantido |
| Remover algo desligado que ainda é usado | R4 | Retirada só num commit próprio, com teste e busca de referências |

## B9. Fora do escopo desta rodada

- Separar o Master por marca em endereços diferentes (D147: "no futuro").
- Trocar o nome interno `NEXTLEVEL_COMMERCE` ou as rotas `/merchant`, `/commerce`: quebraria links salvos sem ganho para o cliente.
- Domínio `nextlevelcommerce.com.br`: só quando começar a campanha de aquisição.
- Fotos das marcas: seguem pelo `pacote-imagens-gpt-2026-10-19.md`.
