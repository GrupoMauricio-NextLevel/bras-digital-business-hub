---
name: retomar
description: Começar qualquer conversa sabendo onde o projeto parou, sem reler tudo. Use no início de toda conversa (o dono digita /retomar) ou quando a conversa perdeu o fio. Lê o estado de hoje, as decisões em vigor e as branches, e responde em poucas linhas onde paramos, o que pode conflitar e o que vem agora.
---

# Retomar

Objetivo: em poucos minutos e gastando pouca memória, saber o estado do projeto e evitar choque com outras conversas. **Não leia o `DECISIONS.md` inteiro** (passa de 570 mil caracteres).

## Passos
1. Leia `docs/ESTADO.md` (estado de hoje) e `docs/design/DECISOES-VIGENTES.md` (regras em vigor). São curtos: leia inteiros.
2. Atualize a visão das branches:
   - `git fetch origin --quiet`
   - `git log origin/claude/wonderful-cannon-5o38v5 -8 --format='%ad %h %s' --date=short` (o que entrou no ar desde a última atualização do ESTADO);
   - branches com trabalho fora do ar, mexidas nos últimos 3 dias: `git branch -r --sort=-committerdate --format='%(committerdate:short) %(refname:short)' | head -15` e, para cada uma, `git rev-list --count origin/claude/wonderful-cannon-5o38v5..<branch>`.
3. Se o dono disse a frente e o objetivo, procure **só** o que toca nessa frente: `grep -n` no `DECISIONS.md` pelos números citados no ESTADO, e o quadro de duplicações em `docs/planejamento/UNIFICACAO-2026-11-18.md` (seção 3).
4. Confira conflitos antes de começar:
   - outra branch recente mexendo nos mesmos arquivos ou na mesma frente?
   - alguém já criou a migração ou a decisão que você vai criar? (número de decisão e de migração só se pega na hora de juntar.)
   - o pedido contradiz uma regra em vigor? Se sim, pergunte ao dono antes (regra "questionar antes de seguir").
5. Responda ao dono em português, sem jargão, **em no máximo 6 linhas**:
   - onde paramos (1 ou 2 linhas);
   - o que pode conflitar com o pedido de hoje;
   - o que você vai fazer agora e o que não vai mexer;
   - se falta uma decisão dele, a pergunta.

## Se o dono não disse a frente
Mostre as frentes ativas do ESTADO e o item 1 de "Esperando o dono", e pergunte qual frente é a conversa de hoje. **Uma conversa, uma frente.**
