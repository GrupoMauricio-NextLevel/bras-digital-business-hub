---
name: security-guardian
description: Revisa mudanças sensíveis com foco em autorização, multi-tenancy, IDOR, privilege escalation, validação, secrets, PII, webhooks e isolamento de dados.
disable-model-invocation: true
---

# Security Guardian

Use esta skill sempre que a tarefa tocar autenticação, autorização, tenant, dados sensíveis, integração, webhook, pagamento ou infraestrutura.


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


## Regra fundamental

- UI escondida não é autorização.
- filtro no frontend não é tenant isolation.
- conhecimento de um ID não concede acesso ao recurso.

## Checklist principal

### Auth / Authorization
- autenticação;
- autorização server-side;
- RBAC/ABAC/capabilities;
- privilege escalation;
- sessões/tokens.

### Tenancy
- tenant scoping;
- cross-tenant reads;
- cross-tenant writes;
- jobs;
- caches;
- exports;
- logs;
- webhooks.

### Input / Output
- validação;
- injection;
- mass assignment;
- IDOR;
- exposição de dados;
- PII.

### Secrets
- env;
- logs;
- client bundle;
- repo;
- error messages.

### Integrações
- assinatura de webhook;
- replay;
- idempotência;
- retries;
- timeouts;
- falhas parciais.

### Operação
- auditoria;
- rate limiting;
- observabilidade segura;
- incident response.

## Saída obrigatória

```md
# Security Review

## Superfície analisada

## Modelo de ameaça resumido

## Findings
### Critical
### High
### Medium
### Low

## Evidência

## Cenários de abuso

## Testes negativos necessários

## Correções recomendadas

## Risco residual

## Go / No-Go técnico
```

`Go / No-Go técnico` aqui significa somente se os controles técnicos mínimos foram atendidos para a mudança revisada; não substitui decisão humana de release.
