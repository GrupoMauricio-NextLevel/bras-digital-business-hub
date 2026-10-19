# Verificação automática: o que barra erro antes de ir para o ar

> 2026-10-03. Camadas, da mais próxima do código até a produção. Cada uma pega o que a anterior deixou passar.

## 1. No computador (já ligado)
- **Antes de cada commit** (`.githooks/pre-commit`): tipos (`tsc`) e estilo (`eslint`) dos arquivos alterados. Cerca de 30 s.
- **Antes de cada push** (`.githooks/pre-push`): tipos e estilo do projeto inteiro. Push cancelado se houver erro.
- **No Claude Code** (`.claude/hooks/antes-do-push.sh`, registrado em `.claude/settings.json`): antes de qualquer `git push` feito por mim, roda tipos e estilo e **bloqueia** se falhar.
- **Ligar numa cópia nova:** `npm run ganchos` (a sessão na nuvem liga sozinha, em `.claude/session-start.sh`). Verificação completa à mão: `npm run verificar` (tipos, estilo e todos os testes) ou `npm run verificar:rapido`.

## 2. No GitHub (`.github/workflows/ci.yml`)
Três grupos em paralelo a cada push e a cada pull request: **tipos e estilo**, **testes** (todos) e **build de produção**; mais um resumo chamado `verificar`, que só fica verde se os três passarem. Um novo push cancela a rodada anterior da mesma branch.

## 3. No Render e no GitHub (ações do dono, 2 minutos, **ainda não feitas**)
Sem isto, os testes do GitHub **avisam, mas não impedem** a publicação.
1. **Render → o serviço → Settings → Build & Deploy → Auto-Deploy → "After CI Checks Pass".** O Render passa a publicar só depois do `verificar` verde. Custo: a publicação espera os testes (cerca de 8 a 10 minutos em vez de 3 a 6).
2. **GitHub → Settings → Branches → regra para `claude/wonderful-cannon-5o38v5` (e `main`) → "Require status checks to pass" → marque `verificar`.** Impede unir ou enviar mudança vermelha por pull request.
Observação: `render.yaml` não define o gatilho de deploy (`autoDeployTrigger`); a região do Render declarada é **Ohio** (Estados Unidos).

## 3A. Depois de publicar (D171)
- `npm run conferir:producao` (com `EXPECT_VERSION=<commit curto>` para conferir a versão): cada endereço responde, `/api/health` ok, título presente, sem tela de erro e sem vazamento entre marcas (E-commerce sem SuperDrop, Central ou recarga; SuperDrop sem E-commerce). Leva cerca de 10 segundos. `SITES=` troca a lista de endereços.
- `npm run test:rapido`: só os testes ligados ao que mudou desde a branch publicada.
- Testes ~5x a 10x mais rápidos: o banco de teste é montado uma vez por execução (molde em `tests/molde.ts`, `tests/global-setup.ts`) e cada teste carrega a cópia (0,09 s contra 6,8 s por banco).

## 4. O que ainda não existe
Monitoramento do site no ar com alerta, rotinas agendadas (medição semanal, cobrança) e backup do banco: próximos passos desta frente.
