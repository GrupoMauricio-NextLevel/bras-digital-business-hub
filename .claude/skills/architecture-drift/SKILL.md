---
name: architecture-drift
description: Compara periodicamente o código real com AGENTS.md e os documentos 00–13 para detectar desvios arquiteturais, duplicação, boundaries rompidos e decisões que migraram para lugares errados.
disable-model-invocation: true
---

# Architecture Drift

Use esta skill para verificar se a implementação está começando a se afastar da arquitetura aprovada.


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


## Objetivo

Comparar:

```text
AGENTS.md
+
documentos 00–13
+
código real
+
testes
```

e apontar drift concreto.

## Tipos de drift a procurar

- regras de negócio espalhadas pela UI;
- lógica específica de provider contaminando o core;
- bypass de services/contratos;
- autorização apenas no frontend;
- falhas de tenant isolation;
- duplicação de fonte de verdade;
- status acoplado à aparência;
- feature flag usada como entitlement;
- plano comercial usado como regra espalhada;
- domínio sendo definido pela tela;
- módulos atravessando boundaries sem contrato;
- caminhos paralelos para a mesma operação;
- dívida temporária virando arquitetura permanente;
- docs desatualizados em relação ao código;
- código correto contrariando docs antigas.

## Importante

Não assuma automaticamente que a documentação está certa e o código está errado.

Quando houver divergência, classifique:

- `CODE_DRIFT`
- `DOC_DRIFT`
- `DECISION_GAP`
- `INTENTIONAL_EXCEPTION`
- `UNKNOWN`

## Saída obrigatória

```md
# Architecture Drift Report

## Escopo

## Alinhamentos confirmados

## Drifts encontrados

### Drift 1
- Tipo:
- Evidência:
- Documento relacionado:
- Código relacionado:
- Impacto:
- Risco:
- Correção sugerida:

## Duplicidades arquiteturais

## Boundaries rompidos

## Documentação possivelmente desatualizada

## Decisões não registradas

## Prioridade
### P0
### P1
### P2

## Plano de correção incremental
```

Não faça refactor durante a auditoria.
