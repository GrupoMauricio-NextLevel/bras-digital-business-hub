@AGENTS.md

# SuperDrop / NextLevel Commerce Engine: guia para sessões de trabalho

Sistema de tecnologia da **NextLevel Marketing Ltda** (dono: Mauricio). Plataforma de lojas online sem estoque: fornecedores (Centrais), lojistas membros, parceiros afiliados e o painel Master. **Fale com o dono em português, sem jargão**; código, nomes de arquivos e commits em português do jeito que o projeto já faz.

## Constituição da plataforma de lojas virtuais (autoridade máxima do e-commerce)
Leia `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` antes de decisão estrutural (dados, pedidos, pagamentos, estoque, temas, permissões, fronteira entre o motor de lojas e SuperDrop/Master). Ordem normativa: Constituição > decisões aprovadas em `docs/design/DECISIONS.md` > documentos especializados > tarefa atual. Conflito com uma tarefa: identificar, explicar, registrar a decisão (nunca quebrar em silêncio). Índice dos documentos oficiais (00 a 13) e estado de cada um: `docs/constituicao/README.md`. Auditoria contra os artigos: `docs/constituicao/AUDITORIA-2026-10.md`.

## Pilha
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estrito · Tailwind v4 · Radix · Drizzle ORM (PGlite local/produção simples, Postgres/Neon externo) · Zod · Vitest · Playwright (via `playwright-core`, scripts em `e2e/`). Deploy: Docker no Render, direto da branch de trabalho; cada push publica.

## Comandos que você deve usar
- Tipos: `npx tsc --noEmit` · Lint: `npx eslint src e2e tests` · Testes: `npx vitest run` (leva ~30 min; para um arquivo: `npx vitest run tests/x.test.ts`)
- **Testes enxutos (pedido do dono, 2026-10-12):** durante o trabalho rode só tipos, estilo e os testes dos arquivos mexidos; a bateria completa (`npx vitest run`) e `npm run build` ficam para a etapa final de cada rodada, antes da publicação dela. A verificação automática (`.github/workflows/ci.yml`) continua rodando tudo depois do push.
- Build de produção: `npm run build` (rode antes de publicar; precisa passar sem "Export encountered")
- Migração: alterou `src/db/schema.ts` → `npx drizzle-kit generate --name <assunto>` e commite `drizzle/`. Nunca edite migração já publicada.
- Demonstração local: `bash scripts/restart-demo.sh` (porta 3100; `--limpo` apaga `.next`). Depois: `E2E_BASE=http://localhost:3100 node e2e/<arquivo>.mjs`. Reinicie antes de e2e que mudam dados (compras, temas, parceiros) e após migrações.
- Não use `pkill -f` nem `pgrep -f` com padrão que case com o próprio shell.

## Regras do projeto (aprendidas com erro)
- **Página que consulta o banco declara `export const dynamic = "force-dynamic"`.** Senão o `next build` tenta abrir o banco e o deploy quebra (já aconteceu).
- Valores em **centavos** (inteiros); datas ISO; textos ao usuário em português claro; sem promessa de ganho.
- Toda ação passa pelo domínio (`src/lib/domain/*`) e por `runAction`; permissões no servidor (`requireRole`, `assertCanAccess`); um tenant nunca lê dados de outro.
- Segredos (tokens do Mercado Pago e da plataforma de envio, chave Pix) só criptografados (`encryptSecret`), nunca em tela, log ou e-mail.
- Pagamento só vale depois de conferido na API do Mercado Pago (o corpo do webhook nunca é confiável); idempotência por `dedupeKey`.
- Regra de negócio configurável vem de `platform_settings` (tabela de preços `getPriceBook`, regras de parceiros `getPartnerSettings`), nunca fixa no código.
- Acessibilidade AA: `axe` sem violações graves, sem rolagem horizontal em 360 px; use `e2e/polish-v8.mjs` para varrer.
- **Custo de montagem no Render (pedido do dono, 2026-11-09):** cada push na branch de publicação monta o sistema de novo em **dois** serviços (cerca de 5 min cada), e o minuto de montagem é cobrado (US$ 5 por bloco de até 1.000 min; em outubro foram 752 min). Commit **só de documentos** (`docs/`, `.md`, PDFs, notas) leva `[skip render]` na mensagem e não publica; junte documentos e código numa publicação só sempre que der; nada de push só para corrigir vírgula. Meta: até 500 min/mês (grátis), no máximo 3 publicações de código por dia, treino (`nextlevel-demo`) só com deploy manual. **Plano completo: `docs/infra/RENDER-USO.md`** (inventário, custos, regras, rotina, pendências do dono).
- **Eficiência (erro de 2026-10-28):** ajuste visual pequeno = tipos + lint, publica e mostra o print do site no ar, **sem `npm run build` local**; build e bateria completa só em mudança grande; uma montagem por rodada; modo dev não serve para transições. Detalhes nas skills `publicar` e `qa-visual`.
- **A cada etapa entregue, mande ao dono pelo menos um print da principal implementação** (captura real no navegador, Playwright). É como ele confere visualmente.
- Não crie PR sem o dono pedir. Trabalhe na branch designada e faça `git push -u origin <branch>`.
- Registre decisões em `docs/design/DECISIONS.md` (próxima: D276). Mudanças de comportamento sem teste não entram.
- **Base de conhecimento sempre ao vivo (pedido do dono, 06/11/2026, D264):** toda atualização publicada alimenta a base de conhecimento da equipe (`docs/conhecimento/BC0-INVENTARIO.md`; depois, a tela "Aprender" do Master). Decisão nova a partir da D257 sem citação na base faz o teste `tests/base-conhecimento.test.ts` falhar; depois de registrar uma decisão, rode `node scripts/gerar-novidades.mjs` (Novidades da tela Aprender).

## Mapa rápido
- Domínio: `src/lib/domain/` (finance, store-access, partners, nl-sales, orders, own-store, provisioning…) · Preços: `src/lib/finance/` · Temas: `src/lib/themes/` · E-mail: `src/lib/email.ts`
- Telas: `src/app/master`, `supplier`, `merchant`, `partner`, `(portal)` (público), `store/[slug]` (loja do membro), `f/[slug]` (página do fornecedor)
- **Observações do dono sobre as telas (prints): `docs/melhorias/telas-observacoes-do-dono.md`** — registre cada print/comentário assim que chegar e resolva durante as fases.
- **Integrações (aplicativos) a programar, da mais fácil à mais difícil:** `docs/prompts/integracoes-aplicativos-fila.md` (I-01 a I-32; próxima: Rodada A, só configuração: Google Analytics, Tag Manager, Search Console, Google Ads, Pixel do TikTok e do Pinterest, catálogo Meta/TikTok pelo `feed.xml`, chat, PWA, maioridade). Melhorias da E-commerce: `docs/prompts/melhorias-wbuy-prompt-engenheiro.md` (W0–W5 e W6a feitas, D183–D188); comparativo: `docs/relatorios/COMPARATIVO-ECOMMERCE-X-WBUY-2026-10-27.md`
- Prompts para desenvolver aos poucos: `docs/prompts/` (editor de temas: `editor-templates-evolucao.md`; imagens para o GPT: `imagens-temas-gpt.md` e `imagens-paginas-publicas-gpt.md`; **próxima rodada do dono: `auditoria-dono-paineis-e-paginas.md`**; **público, personas e preço de todas as marcas: `publico-personas-precos-ecossistema.md`** — suporte entre painéis, identidade das marcas, páginas públicas; **ônibus de excursão e clube de benefícios: `bras-digital-club-excursao-ecossistema.md`**) · links de tudo: `docs/LINKS.md` (comece por `README.md`); decisões: `docs/design/DECISIONS.md`; visão geral: `ARCHITECTURE.md`, `docs/MAPA.md`, `docs/PLANOS.md`
- Skills do projeto (`.claude/skills/`, uso: `/publicar`, `/e2e-demo`, `/nova-migracao`, `/desenvolver-prompt`): `publicar`, `e2e-demo`, `nova-migracao`, `desenvolver-prompt`. Kit de análise (só quando reduz uma incerteza real; guia em `docs/SKILLS-KIT-README.md`): `repo-auditor`, `root-cause`, `impact-analysis`, `acceptance-designer`, `ux-flow-auditor`, `security-guardian`, `release-gate`, `architecture-drift`

## Direção do produto (atual)
**Regra de foco 60/25/15 (decisão do dono, 19/10/2026, D174):** até a NextLevel E-commerce ter **10 lojistas pagantes**, o esforço vai **60% para a E-commerce, 25% para o SuperDrop e 15% para o resto** (Brás, Cargas, grupo). Todo título de decisão nova em `DECISIONS.md` leva a frente entre colchetes (`[E-commerce]`, `[SuperDrop]`, `[Brás]`, `[Cargas]`, `[Grupo]`) e todo relatório do dia traz a linha "Esforço do dia por frente". Na dúvida sobre o que fazer primeiro, vence o que aproxima a E-commerce do 10º lojista pagante.

**Fase atual (dono, 2026-10-29, D216): só a NextLevel E-commerce** (lojas virtuais) e o Master central. **O SuperDrop NÃO está em produção e não tem clientes**: não trave mudanças por causa dele (as outras marcas ficam para depois). Histórico: o foco antes incluía SuperDrop, NextLevel Commerce (lojas virtuais) e o Master central (`master.nextlevelgroup.com.br`). **Atualização (D91, 2026-10-07): a Brás Digital passou a ser prioridade**: plataforma fechada de atacado de caixa fechada com feed de vídeo e lives. Leia `docs/prompts/bras-digital-plataforma.md` (o adendo no começo prevalece) e as decisões D91 a D96. Desde 2026-10-08 a Brás está na branch de publicação, em `bras.nextlevelgroup.com.br` (D96); a página pública e o cadastro só abrem com `BRAND_SIGNUP_BRAS_DIGITAL=true` (sem ela, "em breve"). **Hub Creators e China Hub ficam para outra etapa**: sem domínio no Render/DNS até haver código desenvolvido (hoje só têm página "em breve" no código). Um Render (Starter) e um Neon para tudo; um domínio por produto (ver `docs/nextlevel-commerce/ligar-escritorio.md`).

O foco passou de SuperDrop para **NextLevel Commerce**, a plataforma de lojas virtuais (o SuperDrop é um módulo, em pausa). Leia `docs/prompts/nextlevel-commerce-plataforma.md` e `docs/nextlevel-commerce/aproveitamento-superdrop.md` antes de propor trabalho novo. Holding: `nextlevelgroup.com.br`; produto: `nextlevelcommerce.com.br` (a registrar).

## Regra anti-duplicação (portfólio NextLevel)
NextLevel Commerce, SuperDrop, Brás Digital e as próximas frentes são **marcas e pacotes de módulos sobre o mesmo motor** (mesmo repositório, deploy e banco). Antes de criar tabela, tela ou regra: **procure e estenda** o que existe (influenciador = `kind` de `partners`; cupom do consumidor estende `coupons`; atacado = lista de preços sobre o mesmo catálogo; feed/live = seções de tema + mídia; marketplace = camada sobre lojas e pedidos existentes). Um painel Master só, com filtro de marca. Texto de marca vem de `getBrand()`, nunca fixo. Detalhes: `docs/prompts/nextlevel-commerce-plataforma.md` seção 4A.

## Configurações de produção que dependem do dono
`DATABASE_URL` (Neon), `SESSION_SECRET`, `MASTER_EMAIL`/`MASTER_PASSWORD`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`/`NEXT_PUBLIC_SUPPORT_EMAIL`, `RESEND_API_KEY`/`EMAIL_FROM`/`EMAIL_REPLY_TO`, `APP_URL`, conta Mercado Pago da NextLevel conectada no Master. Render Free dorme e não tem disco: dados reais exigem Neon e plano pago.
