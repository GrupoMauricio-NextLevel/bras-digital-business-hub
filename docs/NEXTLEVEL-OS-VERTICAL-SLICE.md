# NextLevel OS — Auditoria visual e vertical slice

## Diagnóstico do V4

O V4 melhorou a priorização operacional, mas sua linguagem visual permaneceu baseada em padrões genéricos de admin/SaaS.

### Preservar
- regras de domínio, autenticação, grants e multi-tenant;
- CommandPalette, busca, notificações e troca de tema;
- tabelas e filtros funcionais;
- lógica de ActionQueue/OperationalPulse como fonte de informação, não necessariamente sua apresentação;
- responsividade e acessibilidade já existentes;
- fluxos de pedido, carteira, etiqueta, estoque e expedição.

### Substituir visualmente
- verde como identidade transversal;
- sidebar de admin template;
- bottom navigation em cápsula;
- KPI cards repetidos;
- cardificação de informação;
- ícone em quadrado arredondado como linguagem padrão;
- estados vazios baseados apenas em zeros;
- mesma identidade para Master, Commerce e SuperDrop.

## Product Context

| Contexto | Accent | Papel |
| --- | --- | --- |
| Master | Cobalt #2563EB | Control Center |
| Commerce | Cyan #0891B2 | Core operacional |
| SuperDrop | Orange #F97316 | Distribuição & Dropshipping |
| Brás Digital | Amber #D59A16 | Atacado B2B |
| Creators Hub | Violet #A855F7 | Creators & Social Commerce |
| China Hub | Vermilion #D73737 | Brasil ↔ China |

Cor é orientação/contexto, não preenchimento da interface.

## Tokens

A camada NextLevel OS introduz nl-canvas, nl-surface-1/2/elevated, nl-text-primary/secondary/tertiary, nl-hairline e product-accent/soft/contrast.

Light usa neutros off-white/graphite. Dark usa neutros minerais sem viés verde.

## Vertical slice implementado

1. Product Context centralizado.
2. Product Switcher sistêmico.
3. AppShell com identidade do produto e navegação menos admin template.
4. Mobile sem cápsula flutuante: dock inferior mais discreto, com indicador contextual.
5. Master reconstruído como Control Center.
6. Business Portals para entrada nas operações.
7. SuperDrop Merchant Home orientado por informação, sem KPI cards.
8. Lista de pedidos com resumo tipográfico.
9. Detalhe do pedido com hierarquia operacional mais editorial.

## Limites intencionais

Brás Digital, Creators Hub e China Hub aparecem como contextos "Em preparação" porque suas rotas operacionais ainda não estão presentes nesta branch de produção. Nenhuma funcionalidade foi inventada.

O SuperDrop do Master continua apontando para o escopo Master existente. Entrar como fornecedor/lojista depende da política de acesso/grants e não foi simulada visualmente.

## Validação

- Mudanças isoladas em design/nextlevel-os-revolution.
- Nenhum merge em produção.
- Nenhum deploy solicitado.
- Nenhuma regra de negócio alterada.
- Validação estática realizada por inspeção dos arquivos alterados.
- Build/test automatizado ainda não executado neste ambiente: o conector GitHub disponível não executa o toolchain local e o repositório não expõe CI/status checks para esta branch.
- Antes de qualquer merge, executar npm run build e a suíte de testes do repositório em ambiente com checkout/toolchain.

## Próximo gate

Não expandir para Supplier, demais páginas Master ou outros produtos antes da aprovação visual do vertical slice.
