# Trabalhar com o Codex e o Claude no mesmo sistema (plano)

## Ideia
- **Codex** cuida do **design visual** (componentes, portal, temas, aparência dos painéis).
- **Claude** cuida do **resto** (regras de negócio, banco, pagamentos, frete, acessos, domínios, testes).
- Os dois trabalham **no mesmo repositório do GitHub** (`GrupoMauricio/bras-digital-business-hub`). Quem publica é o Render, a partir de uma branch. É o GitHub que "conecta" os dois: o que um faz, o outro enxerga.

## O que é "ao vivo" e o que não é
- **Instantâneo** (poucos segundos) só existe no computador de quem desenvolve, com o servidor local atualizando a cada salvamento. Não serve para você ver no celular.
- **Publicado de verdade no Render** leva **de 3 a 6 minutos** (o Render monta o sistema a cada mudança). É rápido, mas não é instantâneo, e nenhum serviço de hospedagem é.
- **Prévia por mudança** (um endereço temporário para cada alteração) existe em alguns planos pagos do Render e em outras hospedagens; confira no Render se o seu plano inclui.

## Proteção da produção (importante: o SuperDrop tem clientes)
Hoje o Render publica **direto da branch de trabalho**: qualquer push vai para o ar. Com dois agentes isso fica arriscado. Desenho recomendado:

| Branch | Para quê | Publica onde |
|---|---|---|
| `main` | **produção** (clientes de verdade) | serviço pago do Render (Starter) |
| `staging` | onde as mudanças dos dois agentes se encontram e você confere ao vivo | um segundo serviço **gratuito** do Render, com um banco de teste no Neon (branch do Neon, grátis) |
| `codex/*` e `claude/*` | trabalho de cada agente | nada (só verificação automática) |

Fluxo: o agente trabalha na sua branch → abre pull request para `staging` → a verificação automática (tipos, lint, testes, build) precisa passar → você vê o resultado no endereço de `staging` (de 3 a 6 minutos) → se aprovar, leva `staging` para `main` e vai para os clientes.

## Divisão de arquivos (evita conflito)
Está em `AGENTS.md` (o Codex lê esse arquivo): visual para o Codex; domínio/banco/testes para o Claude; quem precisar mexer na área do outro faz o mínimo e avisa.

## O que já está pronto no repositório
- `AGENTS.md` com as regras e a divisão de trabalho.
- `.github/workflows/ci.yml`: verificação automática (tipos, lint, testes e build) em cada pull request e em `main`/`staging`.

## O que falta (passos do dono)
1. **Codex:** conectar o Codex ao GitHub (no site do Codex/ChatGPT, autorizando o repositório). Confira lá o procedimento atual; a ferramenta muda com frequência.
2. **GitHub:** criar a branch `staging` e proteger `main` (exigir que a verificação passe e proibir push direto).
3. **Render:** manter o serviço atual como produção apontando para `main`; criar um segundo serviço (gratuito) apontando para `staging`, com um banco de teste no Neon.
4. Antes de apontar a produção para `main`, levar o trabalho atual para `main` (eu preparo; você autoriza).
