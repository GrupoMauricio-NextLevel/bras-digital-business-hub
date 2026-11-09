# Organização do Render: hierarquia, nomes e passo a passo

> Pedido do dono (09/11/2026): "dentro do Render está tudo misturado (SuperDrop, NextLevel demo…). O foco foi a loja virtual (NextLevel Commerce, 95% pronta); agora vamos para a agência, NextLevel Soluções. Coloco todos os projetos na mesma conta? Como organizar as pastas com a hierarquia certa? Prepare o prompt da mudança."
> Complementa `docs/infra/RENDER-USO.md` (custos e regras de publicação). Commits destes documentos levam `[skip render]`.

---

## 1. A resposta curta

**Sim: tudo na mesma conta**, organizado em pastas (no Render, cada pasta é um **Projeto**, e cada projeto tem **Ambientes**, como "Produção" e "Treino").

**Por que uma conta só:**
- um cartão, uma fatura e um lugar só para olhar;
- os 500 minutos grátis de montagem são **por conta** (duas contas = o dobro de lugares para controlar);
- o sistema da NextLevel é **um motor só** para todas as marcas (Commerce, Master, SuperDrop, Brás, Cargas e as páginas de Soluções). Separar em contas não separaria nada de verdade.

**Quando abrir outra conta:** só se um **cliente da agência** for pagar a hospedagem dele direto, ou se uma pessoa de fora precisar mexer apenas nos sites desse cliente. Nesse caso, a conta é do cliente e a NextLevel entra como convidada.

---

## 2. O que está errado hoje

| Hoje | Problema |
|---|---|
| Conta "My Workspace" | Nome genérico |
| Projeto "My project" com o serviço **`superdrop`** | O `superdrop` **não é só o SuperDrop**: é a plataforma inteira, que atende `lojas.nextlevelgroup.com.br`, `master.nextlevelgroup.com.br` e todas as marcas. O nome engana |
| **`nextlevel-demo`** solto, fora de projeto | É o ambiente de treino da mesma plataforma, mas aparece como coisa separada |
| **`nextlevel-demo-db`** solto | Banco grátis que vence em 11/11 e, ao que tudo indica, não está em uso |
| `render.yaml` no projeto | Descreve um serviço `nextlevel-superdrop` com disco e banco local (PGlite) que não é o que roda hoje. É um mapa velho: **nunca aplicar** sem atualizar (pode criar serviços duplicados) |
| Código: `src/lib/domain/dominio-proprio.ts` | O endereço padrão para os domínios dos lojistas ainda é o do treino (`nextlevel-demo.onrender.com`). A variável `LOJA_DOMINIO_CNAME` já corrige isso no Render desde 09/11; o código precisa mudar na próxima publicação |

---

## 3. A hierarquia proposta

```
Conta: NextLevel Group                      (renomear "My Workspace")
│
├── Projeto: Plataforma NextLevel           (o motor único: Commerce, Master, SuperDrop, Brás, Cargas, Soluções)
│   ├── Ambiente: Produção                  (o que os clientes usam)
│   │   └── nextlevel-plataforma            (hoje "superdrop") · Starter · todos os domínios reais
│   │       └── (depois, se precisar) nextlevel-plataforma-tarefas   (tarefas agendadas)
│   └── Ambiente: Treino                    (testes e guias, sem dado real)
│       └── nextlevel-treino                (hoje "nextlevel-demo") · Free · deploy manual
│
├── Projeto: Agência NextLevel Soluções     (criar quando houver o primeiro site de cliente para hospedar)
│   ├── Ambiente: Clientes
│   │   └── cliente-<nome>-site             (um serviço por cliente; site estático é grátis)
│   └── Ambiente: Propostas
│       └── proposta-<nome>                 (páginas temporárias para mostrar ao cliente; apagar em 30 dias)
│
└── Projeto: Laboratório                    (experimentos; tudo Free; apagar o que tiver mais de 30 dias)
```

**O banco de dados de produção** fica no **Neon**, fora do Render, como já está. O `nextlevel-demo-db` sai (seção 5, passo 7).

**Onde fica a agência "NextLevel Soluções":**
- **As páginas da agência** (vitrine de soluções, preços sob consulta, cadastro de interessados) **ficam no motor único**, porque já existem nele (`/solucoes`, catálogo do Master, `nextlevelgroup.com.br`). Elas não precisam de serviço novo no Render; ganham só o domínio da agência quando houver.
- **Os sites e lojas que a agência fizer para clientes** vão para o projeto "Agência NextLevel Soluções". Se o cliente for uma loja virtual, ele vira **lojista da NextLevel Commerce** (domínio próprio ligado à plataforma), e não um serviço novo. Só site fora da plataforma (institucional, landing page própria) vira serviço no projeto da agência.

---

## 4. Regra de nomes

| O quê | Padrão | Exemplos |
|---|---|---|
| Conta | Nome do grupo | NextLevel Group |
| Projeto | Nome do produto ou da área, em português | Plataforma NextLevel · Agência NextLevel Soluções · Laboratório |
| Ambiente | Produção · Treino · Clientes · Propostas | — |
| Serviço | `<produto>-<papel>`, minúsculas, com hífen, sem marca de cliente misturada | `nextlevel-plataforma`, `nextlevel-treino`, `nextlevel-plataforma-tarefas`, `cliente-padaria-sol-site` |
| Banco | `<serviço>-db` | `cliente-x-site-db` (se precisar) |
| Grupo de variáveis | `<projeto>-<ambiente>` | `plataforma-producao` (só se for compartilhar variável entre serviços) |

**O que renomear muda e o que não muda:**
- **Muda:** o nome que aparece no painel.
- **Não muda:** o ID do serviço (`srv-…`), os domínios ligados, as variáveis, o histórico e, pelo funcionamento do Render, o endereço técnico `…onrender.com`, que continua sendo `superdrop.onrender.com`. **Conferir no painel antes e depois de renomear**: os domínios dos lojistas e o DNS de `lojas` e `master` apontam para ele.

---

## 5. Passo a passo (prompt de execução)

> Quem faz cada passo está indicado. O dono faz no painel e manda print; o Claude confere pela ferramenta do Render (`list_services`, `get_service`, `list_deploys`) e pelo site no ar. **Um passo por vez.** Se algo parecer diferente do esperado, parar e perguntar.

```
OBJETIVO: organizar o Render da NextLevel na hierarquia de docs/infra/RENDER-ORGANIZACAO.md, sem tirar nada do ar.

ANTES DE COMEÇAR (Claude)
- Anotar o estado atual: list_services e list_postgres_instances (IDs, nomes, planos, branch, auto-deploy),
  e um curl em lojas.nextlevelgroup.com.br, master.nextlevelgroup.com.br e superdrop.onrender.com
  (código de resposta e título). Guardar como "antes".

PASSO 1 · Conta (dono)
- Avatar → Workspace Settings → nome: "NextLevel Group". Salvar.

PASSO 2 · Projeto da plataforma (dono)
- Abrir o projeto "My project" → Settings → nome: "Plataforma NextLevel".
- Renomear o ambiente que contém o "superdrop" para "Produção" (se o projeto tiver um ambiente só, ele se
  chama "Production" por padrão; renomear para "Produção").
- Criar um segundo ambiente no mesmo projeto: "Treino".

PASSO 3 · Mover o treino para dentro do projeto (dono)
- Abrir o serviço "nextlevel-demo" → Settings → mover para o projeto "Plataforma NextLevel", ambiente
  "Treino" (opção de mover para projeto/ambiente). Mandar print.

PASSO 4 · Renomear os serviços (dono, um de cada vez)
- "nextlevel-demo" → Settings → Name: "nextlevel-treino". Salvar.
- "superdrop" → Settings → Name: "nextlevel-plataforma". Salvar.
- Claude confere logo depois: get_service dos dois IDs (srv-db66moajnfac73ckp8o0 e srv-dau3ec1srm7s73akufp0)
  mostra os nomes novos e o MESMO endereço técnico; curl nos três endereços dá o mesmo resultado do "antes".
  Se o endereço técnico mudar, desfazer o nome na hora e avisar.

PASSO 5 · Plano e montagem (dono)
- "nextlevel-plataforma" → Settings → Instance Type: Starter.
- "nextlevel-plataforma" → Settings → Build Filters → Ignored Paths: docs/**, **/*.md, e2e/**.
- "nextlevel-treino" → Settings → Build & Deploy → Auto-Deploy: Off.

PASSO 6 · Variável de chave (dono)
- Account Settings → API Keys → criar a chave → colar em "nextlevel-plataforma" → Environment →
  RENDER_API_KEY. Não mandar a chave no chat.

PASSO 7 · Banco do treino (Claude confere, dono exclui)
- Claude: list_logs do "nextlevel-treino" procurando conexão com nextlevel_demo_db; se não houver uso,
  avisar o dono.
- Dono: "nextlevel-demo-db" → Settings → Delete (ou deixar vencer em 11/11 e ser apagado pelo Render).

PASSO 8 · Projeto da agência e laboratório (dono, só quando houver o primeiro site de cliente)
- New → Project → "Agência NextLevel Soluções", ambientes "Clientes" e "Propostas".
- New → Project → "Laboratório" (opcional).

PASSO 9 · Código e documentos (Claude, na próxima publicação de código, sem gastar montagem extra)
- src/lib/domain/dominio-proprio.ts: o padrão de LOJA_DOMINIO_CNAME passa a ser o endereço técnico da
  plataforma de produção (não o do treino), com teste.
- render.yaml: reescrever como mapa fiel (nextlevel-plataforma em Starter, sem disco, banco no Neon via
  variável sem valor no arquivo, branch de publicação) ou apagar, com decisão registrada. Nunca aplicar
  como Blueprint sem conferir.
- .dockerignore: incluir docs, e2e, tests, .claude e PDFs.
- docs/infra/RENDER-USO.md: atualizar o inventário com os nomes novos.
- Registrar a decisão em docs/design/DECISIONS.md (próxima livre, título com "[Grupo]") e citar na base de
  conhecimento; rodar node scripts/gerar-novidades.mjs.

DEPOIS (Claude)
- list_services, list_postgres_instances e curl nos endereços: comparar com o "antes" e mandar ao dono o
  resumo (o que mudou, o que continua igual, o que falta).
```

---

## 6. O que fica para depois (não fazer agora)

- **Trocar a branch de publicação para `main`:** organiza o GitHub, mas mexe no fluxo das sessões e do Codex. Fazer numa rodada própria, com o dono.
- **Renomear o repositório** do GitHub (`bras-digital-business-hub` → `nextlevel-plataforma`): o GitHub redireciona, mas o Render pode precisar reconectar. Fazer junto com a troca de branch.
- **Separar a agência em outro serviço:** só se a agência tiver um sistema próprio, diferente do motor. Hoje não tem; a regra anti-duplicação manda estender o motor.
