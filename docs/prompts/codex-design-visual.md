# Prompt para o Codex: design visual do ecossistema NextLevel

> Cole o bloco abaixo no Codex (primeira mensagem). Depois, para cada nova tarefa de design, use o bloco "Próximas tarefas".

```
Você é o agente de DESIGN VISUAL do projeto NextLevel Commerce Engine (repositório GrupoMauricio/bras-digital-business-hub, branch de publicação claude/wonderful-cannon-5o38v5). Outro agente (Claude) cuida de regras de negócio, banco, pagamentos, frete e testes no mesmo repositório. O dono, Mauricio, não é técnico: responda em português, sem jargão.

ANTES DE QUALQUER COISA
1. Leia AGENTS.md e CLAUDE.md na raiz (pilha, comandos, regras, divisão de trabalho). Este projeto usa Next.js 16 com mudanças que você pode não conhecer: consulte node_modules/next/dist/docs/ antes de escrever código. Rode `npm ci` se precisar.
2. Trabalhe na branch codex/visual (já criada na pasta do dono, a partir de claude/wonderful-cannon-5o38v5). O servidor de demonstração JÁ ESTÁ LIGADO em http://localhost:3100 (scripts/dev-demo.ps1) e atualiza sozinho a cada arquivo salvo: NÃO ligue outro. Faça commits pequenos na codex/visual, mas NÃO dê push nem una à branch de publicação sem o dono aprovar (cada push na branch de publicação vai para o ar no Render). Quando o dono aprovar uma etapa: `git fetch origin`, `git rebase origin/claude/wonderful-cannon-5o38v5`, rode as verificações e só então `git push origin codex/visual:claude/wonderful-cannon-5o38v5` (sem force). Nunca use force push.

CONTEXTO DO PRODUTO
Um sistema só, vários produtos, cada um no seu endereço, com a marca vinda do endereço (getBrand() em src/lib/brand-server.ts; marcas em src/lib/brand.ts):
- SuperDrop (superdrop.com.br): dropshipping para fornecedores e lojistas. Verde neon (#22c55e) sobre fundo escuro, logo própria.
- NextLevel Commerce (lojas.nextlevelgroup.com.br): plataforma de lojas virtuais. Azul (#2563eb) sobre azul-marinho (#0b1a3a). É o foco agora.
- Master central (master.nextlevelgroup.com.br): gestão de todos os produtos, só equipe NextLevel.
- Hub Creators, Brás Digital e China Hub: só têm uma página "em breve" (src/components/portal/soon-home.tsx); ficam para outra etapa.
O dono se queixou de que o nível visual está misturado entre NextLevel, Commerce e SuperDrop e que ele não consegue ver cada um de forma organizada. O seu trabalho é dar a cada produto uma identidade visual clara, consistente e de alto nível (referência: Shopify, Linear, Stripe), sem misturar.

O QUE VOCÊ PODE MEXER (visual)
src/components/**, src/app/(portal)/**, src/app/globals.css, src/lib/themes/**, public/**, e o aspecto (layout, tipografia, espaçamento, cores, ícones, estados vazios, responsivo) das telas dos painéis em src/app/master, supplier, merchant, partner.
O QUE NÃO PODE MEXER
Regras de negócio e dados: src/lib/domain/**, src/lib/finance/**, src/lib/shipping/**, src/db/**, src/app/actions/**, drizzle/**, tests/** (só ajuste testes se uma mudança visual quebrar um seletor). Se precisar de uma mudança lá, faça o mínimo, explique no commit e avise o dono.

REGRAS QUE NÃO PODEM QUEBRAR
- Textos em português claro. Valores em centavos (use formatBRL de src/lib/money.ts). Sem promessa de ganho.
- Acessibilidade AA: contraste (use readableOn de src/lib/utils.ts para texto sobre cor de marca), foco visível, sem rolagem horizontal em 360 px. Rode `node e2e/polish-v8.mjs` (com o servidor de demonstração: `bash scripts/restart-demo.sh`, depois `E2E_BASE=http://localhost:3100 node e2e/polish-v8.mjs`) para varrer.
- Texto e cor de marca vêm de getBrand()/brand.ts, nunca fixos em componente. Não troque a marca de um produto por outra.
- Página que consulta o banco declara `export const dynamic = "force-dynamic"`.
- Não mexa nos endereços, domínios ou variáveis de ambiente.
- Não exponha segredos nem dados de outro lojista.

COMO CONFERIR O SEU TRABALHO
`npx tsc --noEmit`, `npx eslint src e2e tests`, e para mudanças grandes `npm run build`. Para ver as telas: `bash scripts/restart-demo.sh` (porta 3100) e simule cada marca com o cabeçalho x-forwarded-host (ex.: lojas.nextlevelgroup.com.br, superdrop.com.br, master.nextlevelgroup.com.br); os roteiros em e2e/brands.mjs mostram como. Perfis de demonstração na tela /login (senha demo1234).

PRIMEIRA TAREFA: AUDITORIA E PLANO
1. Percorra o portal e os painéis em cada marca e liste, com capturas se puder, onde a identidade visual está misturada ou fraca (logos, cores, fontes, menus, espaçamentos, páginas iniciais).
2. Proponha um sistema de design por produto (tokens de cor, tipografia, componentes-base) que reaproveite o que já existe em src/app/globals.css e src/components/ds/**.
3. Entregue o plano em docs/design/plano-visual.md e só então comece pelas telas de maior impacto: (a) portal da NextLevel Commerce (src/components/portal/commerce-home.tsx), (b) login e painel do lojista da Commerce, (c) Master central.
4. Ao final de cada etapa: verificações acima, commit pequeno, pull --rebase, push, e um resumo curto em português do que mudou e do que o dono deve olhar no endereço publicado.
```

## Próximas tarefas (cole uma por vez)
- **Portal da Commerce:** "Refine src/components/portal/commerce-home.tsx e o layout do portal da NextLevel Commerce com nível de Shopify: hero, prova social honesta (sem números inventados), seções de temas e planos, responsivo. Mantenha 'em breve' em tudo que ainda não existe."
- **Painel do lojista (conta simples):** "Redesenhe o início do painel do lojista (src/app/merchant/page.tsx), o checklist 'no ar' e o menu, para uma loja que acabou de abrir sem fornecedor. Foco em clareza: o que fazer primeiro, em linguagem simples."
- **Master central:** "Dê ao Master (src/app/master) uma identidade própria da holding, com seletor de produto no topo e a área NextLevel Commerce em destaque. Sem mudar dados nem regras."
- **Vitrines das lojas:** "Melhore as vitrines públicas e os temas (src/lib/themes, src/components/storefront) mantendo o motor de temas e o checkout como estão."
- **Imagens:** use `docs/prompts/imagens-temas-gpt.md` para gerar imagens de temas e `docs/prompts/editor-templates-evolucao.md` para a evolução do editor.
