# NextLevel — Claude Code Skill Kit

Este kit adiciona oito skills de projeto ao Claude Code.

## Skills incluídas

- `/repo-auditor` — descobre o que realmente existe no repositório.
- `/root-cause` — investiga bugs até a causa raiz.
- `/impact-analysis` — mede blast radius antes de mudanças relevantes.
- `/acceptance-designer` — define critérios objetivos de aceite e Definition of Done.
- `/ux-flow-auditor` — audita fluxos ponta a ponta de UX.
- `/security-guardian` — revisa auth, multi-tenancy, segurança e dados sensíveis.
- `/release-gate` — verifica se uma mudança está tecnicamente pronta.
- `/architecture-drift` — detecta divergências entre código e arquitetura documentada.

O `/prompt-architect` não está duplicado neste pacote porque já foi criado separadamente.

## Onde colocar

Copie a pasta `.claude` para a raiz do repositório.

Estrutura final esperada:

```text
repo/
├── AGENTS.md
├── ...
└── .claude/
    └── skills/
        ├── prompt-architect/
        │   └── SKILL.md
        ├── repo-auditor/
        │   └── SKILL.md
        ├── root-cause/
        │   └── SKILL.md
        ├── impact-analysis/
        │   └── SKILL.md
        ├── acceptance-designer/
        │   └── SKILL.md
        ├── ux-flow-auditor/
        │   └── SKILL.md
        ├── security-guardian/
        │   └── SKILL.md
        ├── release-gate/
        │   └── SKILL.md
        └── architecture-drift/
            └── SKILL.md
```

## Uso sugerido

### Antes de uma tarefa grande
`/prompt-architect <objetivo>`

### Antes de mexer em uma área que você não conhece bem
`/repo-auditor <área>`

### Antes de uma mudança transversal
`/impact-analysis <mudança>`

### Quando der bug
`/root-cause <sintoma>`

### Antes de implementar uma feature importante
`/acceptance-designer <feature>`

### Para revisar experiência
`/ux-flow-auditor <fluxo>`

### Para mudanças sensíveis
`/security-guardian <mudança>`

### Antes de considerar concluído
`/release-gate <tarefa ou PR>`

### Periodicamente
`/architecture-drift <área ou repositório>`

## Princípio operacional

Não use todas as skills em toda tarefa.

Use apenas as que reduzem uma incerteza real.

Fluxo recomendado:

```text
INTENÇÃO
  ↓
PROMPT ARCHITECT
  ↓
[REPO AUDITOR / IMPACT ANALYSIS quando necessário]
  ↓
CLAUDE CODE EXECUTA
  ↓
[ROOT CAUSE se houver bug]
  ↓
ACCEPTANCE + PLAYWRIGHT
  ↓
SECURITY GUARDIAN + SEMGREP
  ↓
RELEASE GATE
```

## Configuração inicial

As skills foram criadas com:

```yaml
disable-model-invocation: true
```

Isso significa que, inicialmente, você chama cada uma explicitamente.

É proposital: evita auto-invocação excessiva, loops e consumo desnecessário de contexto.

Depois que o fluxo estiver maduro, algumas podem ser liberadas para invocação automática de forma seletiva.
