---
name: ux-flow-auditor
description: Audita fluxos ponta a ponta do ponto de vista do usuário, identificando fricção, estados ausentes, navegação ruim, inconsistência mobile e divergências entre UX e domínio.
disable-model-invocation: true
---

# UX Flow Auditor

Use esta skill para analisar experiências completas, não telas isoladas.

Perfis típicos:
- lojista;
- fornecedor;
- comprador;
- operador;
- administrador.


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


## Documentos normalmente relevantes

Priorize conforme o caso:
- `04` Visual Commerce;
- `05` Merchant Panel UX;
- `06` Storefront UX & Conversion;
- `07` Themes/Templates;
- `02` Commerce Core;
- `03` Platform Core;
- `11` Quality Engineering.

## O que auditar

- objetivo do usuário;
- ponto de entrada;
- compreensão imediata;
- hierarquia;
- navegação;
- CTA principal;
- feedback;
- loading;
- empty;
- erro;
- sucesso;
- reversibilidade;
- consistência;
- mobile;
- acessibilidade;
- conexão com dados reais;
- passos desnecessários;
- becos sem saída;
- telas sem ação;
- ações sem confirmação;
- linguagem e nomenclatura.

## Saída obrigatória

```md
# UX Flow Audit

## Persona / ator

## Objetivo do fluxo

## Jornada atual

## Pontos fortes

## Fricções

## Estados ausentes

## Problemas de informação / hierarquia

## Problemas mobile

## Problemas de acessibilidade

## Divergências UX x domínio

## Prioridade dos problemas
### P0
### P1
### P2

## Fluxo recomendado

## Critérios de aceite UX

## Testes E2E recomendados
```

Não redesenhe toda a interface sem evidência de que isso é necessário.
