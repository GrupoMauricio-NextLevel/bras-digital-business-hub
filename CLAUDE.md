@AGENTS.md

# NextLevel Commerce Engine: guia para sessões de trabalho

Sistema da **NextLevel Marketing Ltda** (CNPJ 51.392.006/0001-92; dono: Mauricio), que responde por todas as marcas (D279). **Fale com o dono em português, sem jargão**; código, arquivos e commits em português, como o projeto já faz.

## Comece e termine toda conversa assim (D344)
1. **`/retomar`** — lê `docs/ESTADO.md` (o estado de hoje, uma página) e `docs/design/DECISOES-VIGENTES.md` (uma linha por regra em vigor). **Não leia o `DECISIONS.md` inteiro** (passa de 570 mil caracteres): use `grep` pelo número da decisão.
2. **Uma conversa, uma frente.** No máximo duas conversas de código ao mesmo tempo, em frentes que não se tocam.
3. **`/encerrar`** — junta o trabalho ao site (ou registra por que não), registra a decisão e atualiza o `ESTADO.md` e as `DECISOES-VIGENTES.md`.
4. **Número de decisão e de migração só se escolhe na hora de juntar** à branch de publicação (próxima decisão: a seguinte à última de `DECISIONS.md`).

## Autoridade
`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` > decisões em `docs/design/DECISIONS.md` > documentos especializados > tarefa atual. Leia a Constituição antes de decisão estrutural (dados, pedidos, pagamentos, estoque, temas, permissões). Conflito com uma tarefa: identificar, explicar e registrar (nunca quebrar em silêncio). **Questionar antes de seguir (17/11/2026):** se uma regra ou decisão do dono parecer ruim para a empresa, pergunte e traga o problema, a alternativa e o que muda antes de implementar.

## Direção (resumo; detalhes em `DECISOES-VIGENTES.md`)
- **Fase atual (D216):** só a NextLevel Commerce e o Master. SuperDrop, Brás, Cargas, Hub Creators e China Hub em pausa: não trave mudança por causa deles, mas não quebre o que existe.
- **Meta (D174, D336):** 10 empresas pagantes em qualquer porta. Até lá, 60% Commerce, 25% SuperDrop e 15% o resto; título de decisão leva a frente entre colchetes (`[E-commerce]`, `[SuperDrop]`, `[Brás]`, `[Cargas]`, `[Grupo]`); relatório do dia traz "Esforço do dia por frente". Na dúvida, vence o que aproxima o 10º pagante.
- **Quatro portas, um painel (D324, D336, D344):** Loja virtual (Start, Pro e Scale intactos), Sites (captação), NextLevel Business (o painel de serviços personalizável, base do antigo Painel da Agência) e Soluções Digitais (serviços da agência). O painel de todo cliente se chama "Meu negócio".
- **Domínios (D287, D315):** `nextlevelcommerce.com.br` (plataforma), `nextlevelgroup.com.br` (grupo e agência; Master em `master.`), agências em `painel.nextlevelcommerce.com.br`.

## Regra anti-duplicação
Marcas e produtos são **pacotes de módulos sobre o mesmo motor** (mesmo repositório, deploy e banco). Antes de criar tabela, tela ou regra, **procure e estenda** o que existe: funil, contratos, cobrança, portal e projetos já existem (quadro em `docs/planejamento/UNIFICACAO-2026-11-18.md`, seção 3). Um Master só, com filtro de marca. Texto de marca vem de `getBrand()`, nunca fixo. Detalhes: `docs/prompts/nextlevel-commerce-plataforma.md`, seção 4A.

## Pilha
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estrito · Tailwind v4 · Radix · Drizzle ORM (PGlite local, Neon em produção) · Zod · Vitest · Playwright (`playwright-core`, scripts em `e2e/`). Deploy: Docker no Render a cada push da branch de publicação.

## Comandos
- Tipos `npx tsc --noEmit` · Lint `npx eslint src e2e tests` · Um teste `npx vitest run tests/x.test.ts` · Bateria completa `npx vitest run` (~30 min) · Build `npm run build` (sem "Export encountered").
- **Testes enxutos (2026-10-12):** durante o trabalho, só tipos, lint e os testes dos arquivos mexidos; bateria completa e build só no fim da rodada, antes de publicar. O CI (`.github/workflows/ci.yml`) roda tudo depois do push.
- Migração: alterou `src/db/schema.ts` → `npx drizzle-kit generate --name <assunto>` e commite `drizzle/`. Nunca edite migração já publicada.
- Demonstração local: `bash scripts/restart-demo.sh` (porta 3100; `--limpo` apaga `.next`), depois `E2E_BASE=http://localhost:3100 node e2e/<arquivo>.mjs`. Reinicie antes de e2e que mudam dados e após migrações.
- Não use `pkill -f` nem `pgrep -f` com padrão que case com o próprio shell.

## Regras do projeto (aprendidas com erro)
- **Página que consulta o banco declara `export const dynamic = "force-dynamic"`** (senão o build tenta abrir o banco e o deploy quebra).
- Valores em **centavos**; datas ISO; textos em português claro; sem promessa de ganho.
- Toda ação passa pelo domínio (`src/lib/domain/*`) e por `runAction`; permissões no servidor (`requireRole`, `assertCanAccess`); um cliente nunca lê dados de outro.
- Segredos (tokens do Mercado Pago, da plataforma de envio, chave Pix) só criptografados (`encryptSecret`), nunca em tela, log ou e-mail.
- Pagamento só vale depois de conferido na API do Mercado Pago (o corpo do webhook nunca é confiável); idempotência por `dedupeKey`.
- Regra de negócio configurável vem de `platform_settings` (`getPriceBook`, `getPartnerSettings`), nunca fixa no código.
- **Banco que dorme (D338):** toda consulta automática da tela passa por `podeConsultar()` (`src/lib/atividade-cliente.ts`); rotinas agendadas de hora em hora, no mesmo minuto.
- Acessibilidade AA: `axe` sem violações graves, sem rolagem horizontal em 360 px (`e2e/polish-v8.mjs`).
- **Custo do Render (2026-11-09):** cada push na branch de publicação monta dois serviços (~5 min cada, minuto cobrado). Commit **só de documentos** leva `[skip render]`; junte documento e código numa publicação; nada de push só para corrigir vírgula; no máximo 3 publicações de código por dia; meta de 500 min/mês. Plano: `docs/infra/RENDER-USO.md`.
- **Eficiência (2026-10-28):** ajuste visual pequeno = tipos + lint, publica e mostra o print do site no ar, sem build local; build e bateria completa só em mudança grande; uma montagem por rodada (skills `publicar` e `qa-visual`).
- **A cada etapa entregue, mande ao dono pelo menos um print real da principal implementação** (Playwright).
- Não crie PR sem o dono pedir. Mudança de comportamento sem teste não entra.
- **Base de conhecimento (D264):** toda decisão nova entra em `docs/conhecimento/BC0-INVENTARIO.md` (o teste `tests/base-conhecimento.test.ts` falha sem ela); depois rode `node scripts/gerar-novidades.mjs`.

## Mapa rápido
- Domínio `src/lib/domain/` · Preços `src/lib/finance/` · Business `src/lib/business/` · Agência/Business avançado `src/lib/agencias/` · Contratos `src/lib/contratos/` · Temas `src/lib/themes/` · E-mail `src/lib/email.ts`
- Telas: `src/app/master`, `merchant` (Meu negócio), `agencia`, `partner`, `supplier`, `(portal)` (público), `store/[slug]` (loja), `f/[slug]` (fornecedor)
- Observações do dono sobre as telas: `docs/melhorias/telas-observacoes-do-dono.md` (registre cada print assim que chegar).
- Prompts por fase: `docs/prompts/` (os ativos estão nas frentes do `docs/ESTADO.md`) · links de tudo: `docs/LINKS.md` · visão geral: `ARCHITECTURE.md`, `docs/MAPA.md`.
- Skills (`.claude/skills/`): `retomar`, `encerrar`, `publicar`, `qa-visual`, `e2e-demo`, `nova-migracao`, `desenvolver-prompt`, `painel-interno`, `pagina-de-vendas`, `tema-pago`, `levar-para-marca`, `desempenho`. Kit de análise (só quando reduz uma incerteza real; `docs/SKILLS-KIT-README.md`): `repo-auditor`, `root-cause`, `impact-analysis`, `acceptance-designer`, `ux-flow-auditor`, `security-guardian`, `release-gate`, `architecture-drift`.

## Configurações de produção que dependem do dono
`DATABASE_URL` (Neon), `SESSION_SECRET`, `MASTER_EMAIL`/`MASTER_PASSWORD`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`/`NEXT_PUBLIC_SUPPORT_EMAIL`, `RESEND_API_KEY`/`EMAIL_FROM`/`EMAIL_REPLY_TO`, `APP_URL`, `GOOGLE_SITE_VERIFICATION`/`BING_SITE_VERIFICATION`, conta Mercado Pago da NextLevel conectada no Master.
