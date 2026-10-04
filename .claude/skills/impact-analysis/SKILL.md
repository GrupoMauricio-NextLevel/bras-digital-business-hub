---
name: impact-analysis
description: Mapeia blast radius e dependências antes de mudanças importantes, identificando o que pode quebrar em domínio, dados, APIs, UI, integrações, testes e operações.
disable-model-invocation: true
---

# Impact Analysis

Use esta skill antes de mudanças que podem atravessar múltiplas camadas.

Objetivo: responder **"se mexermos aqui, o que pode ser afetado?"**


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


## Dimensões a inspecionar

- domínio;
- banco e schema;
- migrations;
- serviços;
- APIs;
- jobs;
- eventos;
- webhooks;
- cache;
- auth/autorização;
- tenant isolation;
- painel;
- storefront;
- mobile;
- integrações;
- observabilidade;
- testes;
- CI/CD;
- documentação.

## Classificação

Classifique o blast radius como:

- `LOCAL`
- `MODULE`
- `MULTI_MODULE`
- `CROSS_CUTTING`
- `PLATFORM_LEVEL`

E o risco como:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

## Saída obrigatória

```md
# Impact Analysis

## Mudança analisada

## Ponto de entrada

## Dependências upstream

## Dependências downstream

## Dados afetados

## Contratos afetados

## UX afetada

## Integrações afetadas

## Testes que precisam mudar

## Migração / compatibilidade

## Blast radius

## Risco

## Estratégia de redução de risco

## Sequência segura de implementação

## Rollback / reversão
```

Não implemente a mudança durante a análise.
