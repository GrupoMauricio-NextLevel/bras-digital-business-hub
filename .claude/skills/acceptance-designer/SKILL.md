---
name: acceptance-designer
description: Transforma uma feature ou correção em critérios objetivos de aceite, definição de pronto e matriz de testes funcionais, negativos, E2E e de regressão.
disable-model-invocation: true
---

# Acceptance Designer

Use esta skill quando uma tarefa estiver vaga demais para saber quando está realmente pronta.

Objetivo: transformar "faça funcionar" em **condições verificáveis de conclusão**.


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


## Princípios

"Pronto" não significa:
- renderizou;
- compilou;
- o botão apareceu;
- funcionou uma vez no happy path.

Quando aplicável, considere:

- persistência;
- autorização;
- tenant isolation;
- validação;
- loading;
- empty state;
- error state;
- mobile;
- acessibilidade;
- estados intermediários;
- retry/idempotência;
- testes;
- logs;
- build;
- regressões adjacentes.

## Saída obrigatória

```md
# Acceptance Design

## Objetivo da feature

## Usuários / atores

## Pré-condições

## Happy path

## Casos alternativos

## Casos negativos

## Critérios de aceite funcionais
- [ ] ...

## Critérios de aceite de UX
- [ ] ...

## Critérios de aceite de dados
- [ ] ...

## Critérios de aceite de segurança
- [ ] ...

## Critérios de aceite de observabilidade
- [ ] ...

## Testes obrigatórios
### Unit
### Integration
### E2E
### Regression

## Definition of Done
- [ ] ...

## Fora de escopo
```

Não implemente a feature; desenhe os critérios.
