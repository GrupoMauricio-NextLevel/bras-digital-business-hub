---
name: repo-auditor
description: Audita o repositório real antes de mudanças relevantes, mapeando arquitetura, funcionalidades existentes, duplicidades, dívida técnica, testes, riscos e divergências com a documentação.
disable-model-invocation: true
---

# Repo Auditor

Use esta skill quando a pergunta central for: **"o que realmente existe hoje no repositório?"**

Ela serve para impedir refactors, reimplementações e decisões baseadas em suposição.


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


## Objetivos

1. Mapear a arquitetura atual.
2. Localizar a implementação real da funcionalidade investigada.
3. Identificar duplicidades e caminhos concorrentes.
4. Encontrar testes, scripts, migrations, flags, providers e dependências relevantes.
5. Comparar o estado atual com `AGENTS.md` e os documentos `00–13`.
6. Separar:
   - já existe e está correto;
   - existe mas precisa evoluir;
   - não existe;
   - conflita com a arquitetura;
   - dúvida ou decisão pendente.

## Não fazer

- Não refatore durante a auditoria.
- Não "conserte aproveitando".
- Não crie arquivos de produção.
- Não altere schemas ou migrations.
- Não conclua que algo está errado apenas porque usa um padrão diferente do preferido.

## Processo

1. Leia `AGENTS.md`.
2. Identifique quais documentos especializados são relevantes.
3. Inspecione estrutura, `package.json`, scripts, configs e diretórios principais.
4. Localize entrypoints, rotas, services, schemas, componentes e testes.
5. Trace os fluxos relevantes.
6. Compare código e documentação.
7. Registre evidências concretas.

## Saída obrigatória

```md
# Repo Audit

## Escopo auditado

## Arquitetura encontrada

## Já existe e está correto

## Existe mas precisa evoluir

## Não existe

## Duplicidades / caminhos concorrentes

## Conflitos com AGENTS.md ou docs 00–13

## Dívida técnica relevante

## Riscos

## Testes existentes

## Dependências

## Decisões pendentes

## Sequência recomendada
```

## Critério de qualidade

A auditoria deve permitir iniciar uma implementação sem precisar redescobrir onde as coisas vivem.
