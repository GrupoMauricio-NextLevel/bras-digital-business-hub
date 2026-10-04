---
name: release-gate
description: Executa a checagem final de qualidade antes de considerar uma tarefa pronta, verificando scripts reais, testes, build, E2E, regressões, segurança, migrations, documentação e pendências.
disable-model-invocation: true
---

# Release Gate

Use esta skill quando alguém disser:
- "terminou";
- "está pronto";
- "podemos subir";
- "fecha essa tarefa".

Objetivo: provar se a mudança está pronta **de acordo com o repositório real**.


## Regras globais

- Leia `AGENTS.md` quando ele existir.
- Use os documentos `00` a `13` como fontes arquiteturais e de produto, sem tratá-los como licença para reescrever o projeto inteiro.
- Preserve o que já funciona.
- Não invente decisões estruturais ausentes.
- Diferencie fato observado, inferência, hipótese e decisão registrada.
- Não faça deploy nem altere produção sem autorização explícita.
- Não exponha secrets.
- Para alterações de código, prefira lotes pequenos, verificáveis e reversíveis.
- Não considere UI renderizada como sinônimo de funcionalidade concluída.
- Nunca transforme uma análise em implementação sem que a intenção da skill seja explicitamente de executar mudanças.


## Primeiro passo

Descubra os scripts e ferramentas reais do projeto.

Não invente comandos.

Inspecione `package.json`, configs, CI e documentação antes de executar verificações.

## Gate mínimo

Quando aplicável:

- lint;
- typecheck;
- unit tests;
- integration tests;
- E2E;
- build;
- migrations;
- schema drift;
- segurança;
- tenant isolation;
- observabilidade;
- mobile;
- acessibilidade;
- documentação;
- rollback;
- pendências.

## Regras

- Não marque como aprovado se uma verificação obrigatória não foi executada sem explicar por quê.
- Não esconda testes quebrados já existentes; diferencie "pré-existente" de "introduzido pela mudança".
- Não faça deploy.
- Não altere código só para fazer o gate passar, salvo autorização explícita.

## Saída obrigatória

```md
# Release Gate

## Mudança avaliada

## Verificações executadas

| Verificação | Resultado | Evidência |
|---|---|---|

## Falhas introduzidas pela mudança

## Falhas pré-existentes

## Riscos

## Pendências bloqueantes

## Pendências não bloqueantes

## Status técnico
- READY
- READY_WITH_KNOWN_RISK
- NOT_READY

## Motivo

## Próxima ação
```
