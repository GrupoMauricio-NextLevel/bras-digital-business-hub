---
name: root-cause
description: Investiga bugs e regressões até a causa raiz, exigindo reprodução, evidência, impacto e teste de regressão antes de considerar uma correção válida.
disable-model-invocation: true
---

# Root Cause

Use esta skill para bugs, regressões e comportamentos incorretos.

O princípio é simples: **corrigir a causa, não maquiar o sintoma**.


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


## Processo obrigatório

1. Defina o sintoma observado.
2. Reproduza o problema quando possível.
3. Identifique o comportamento esperado.
4. Trace o fluxo de dados e chamadas.
5. Encontre o ponto exato onde o comportamento diverge.
6. Diferencie:
   - causa raiz;
   - efeito secundário;
   - sintoma visual.
7. Verifique impacto adjacente.
8. Proponha a menor correção robusta.
9. Crie ou atualize teste de regressão quando viável.
10. Rode verificações relevantes.

## Anti-padrões proibidos

- "adicionei um if e parece funcionar";
- alterar várias áreas sem saber qual era a causa;
- esconder erro no frontend;
- tratar erro de autorização com UI;
- silenciar exceção sem entender por quê;
- alterar dados em produção para "destravar" o bug.

## Saída obrigatória

```md
# Root Cause Analysis

## Sintoma

## Comportamento esperado

## Reprodução

## Evidência

## Causa raiz

## Impacto

## Correção proposta

## Por que essa correção é a menor mudança segura

## Teste de regressão

## Validação

## Riscos remanescentes
```

Se o usuário pedir somente diagnóstico, não implemente a correção.
