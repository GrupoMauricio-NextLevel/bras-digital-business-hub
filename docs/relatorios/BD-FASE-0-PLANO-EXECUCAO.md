# Brás Digital — plano executável da Fase 0

## Objetivo

Preparar os fundamentos da Brás Digital no motor único sem alterar o comportamento do SuperDrop ou da NextLevel Commerce.

## Entregas que podem avançar sem decisão de negócio

| Ordem | Entrega | Evidência de pronto |
|---|---|---|
| 1 | Mapa de reaproveitamento | `BD-FASE-0-MAPEAMENTO.md` revisado pelo dono |
| 2 | Direção visual | Plano de design em duas passagens e tokens contrastados |
| 3 | Privacidade | Inventário, matriz de acesso e testes de não vazamento definidos |
| 4 | Contratos de autorização | Marca, tenant e papel exigidos em toda entrada de área Brás |
| 5 | Estados de acesso | Visitante e membro não aprovado não recebem informação comercial |
| 6 | Auditoria e observabilidade | Eventos críticos e `requestId` definidos para a nova área |
| 7 | Casca dos painéis | Estúdio, Balcão e Meu Brás com estados vazio/carregando/erro, sem dados comerciais |
| 8 | Galeria de design | `/dev/design` com tokens, foco, estados e contraste |
| 9 | Testes de fundação | Isolamento, preço anônimo, contrato do Balcão e acessibilidade inicial |

## Ordem de dependência

```
mapeamento → autorização/privacidade → tokens/galeria
                         └──────────→ casca dos painéis → testes de acesso
contratos de pagamento/estoque [CONFIRMAR] → reserva, Pix, retirada
provedores [CONFIRMAR] → vídeo, lives, Bling, analytics e Full
```

## Decisões adiadas para o final

- D91: encaixe do Estúdio no Master.
- Modelo definitivo de membro B2B e papéis de importadora.
- Pix Split, comissão e plano B.
- Dados pessoais exibidos no Balcão e regras de retenção.
- Provedores de vídeo/live, validação de CNPJ e WhatsApp.
- Importadora piloto, Bling e parâmetros operacionais.

## Verificação mínima antes de qualquer commit de código

```text
npx tsc --noEmit
npx eslint src e2e tests --max-warnings=0
npx vitest run
```

Se a mudança tocar banco: migração aditiva em `drizzle/`, plano de restauração do Neon registrado e testes de migração. Se tocar interface: validação de teclado, contraste AA e 320 px.

## Bloqueio técnico atual

O ambiente deste chat ainda não possui checkout autenticado do repositório: o Git Credential Manager falha ao iniciar antes de fornecer credenciais. Os documentos foram criados pela conexão autenticada do GitHub na branch `claude/bras-digital`.

Enquanto esse checkout não estiver disponível, não é seguro editar código de produto nem alegar que tipagem, lint, testes e build passaram. O próximo avanço de código deve começar recuperando um clone funcional e rodando a suíte completa.
