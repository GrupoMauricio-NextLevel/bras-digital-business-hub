---
name: encerrar
description: Fechar uma conversa sem deixar trabalho solto. Use quando o dono digitar /encerrar, quando a etapa combinada terminar ou quando a conversa ficar longa e for continuar em outra. Junta o trabalho à branch de publicação (ou diz por que não dá), registra a decisão, atualiza o estado de hoje e lista o que espera o dono.
---

# Encerrar

Objetivo: a próxima conversa começa com `/retomar` e encontra tudo em ordem, sem branch esquecida e sem decisão perdida.

## Passos
1. **Trabalho salvo:** `git status --short`. Nada pode ficar só na conversa: commite (português, com os trailers da sessão) e faça push da branch da conversa.
2. **Juntar ao site** (se o dono autorizou publicar; a autorização permanente está no `AGENTS.md`):
   - `git fetch origin claude/wonderful-cannon-5o38v5` e junte com `git merge` na sua branch;
   - **agora, e só agora, escolha os números:** a próxima decisão livre (`grep -E '^## D[0-9]+' docs/design/DECISIONS.md | tail -1`) e a próxima migração (`ls drizzle | grep -E '^[0-9]' | tail -1`). Se a sua já usava um número ocupado, renumere a sua (texto, código, testes, base de conhecimento) e, para migração, apague a sua e rode `npx drizzle-kit generate --name <assunto>` de novo;
   - bateria do tamanho certo (skill `publicar`), push para a branch de publicação e print do site no ar.
   - Não pode juntar ainda? Escreva no ESTADO, em "Branches fora do ar", o nome da branch, o que ela tem e o que falta.
3. **Decisão:** registre em `docs/design/DECISIONS.md` com a frente entre colchetes; adicione a linha em `docs/conhecimento/BC0-INVENTARIO.md`; rode `node scripts/gerar-novidades.mjs`. Se a decisão muda ou substitui uma regra, **atualize `docs/design/DECISOES-VIGENTES.md`** (linha nova e, se for o caso, em "Substituídas").
4. **Atualize `docs/ESTADO.md`:** data, última decisão e migração, "No ar", o próximo passo da frente e "Esperando o dono". Continue com uma página: tire o que ficou velho, porque o histórico já está no `DECISIONS.md`.
5. Commit só de documentos leva `[skip render]`. Se houve código, documento e código vão juntos numa publicação só.
6. **Responda ao dono em até 6 linhas:** o que ficou no ar (com o print), o que ficou fora e por quê, as perguntas para ele e a frase para começar a próxima conversa (ex.: "/retomar — frente Business: ligar o cartão do Meu negócio ao painel").
