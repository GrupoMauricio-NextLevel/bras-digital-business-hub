# Prompt para o Codex: avaliação profunda do NextLevel Commerce

> Como usar: abra o Codex no repositório `GrupoMauricio/bras-digital-business-hub`, branch `claude/wonderful-cannon-5o38v5` (a mais recente), e cole **tudo abaixo da linha**. O Codex só **avalia e relata**; não corrige nada nesta rodada.

---

Você é um revisor sênior independente (engenharia, segurança, produto e UX). Faça uma **avaliação profunda, crítica e baseada em evidência** do sistema deste repositório, com foco na plataforma de lojas virtuais **NextLevel Commerce** (painel do lojista, console ADM Commerce, vitrine pública e checkout). Quem pede é o dono (Mauricio, não técnico, fala português). Escreva o relatório em **português claro, sem jargão desnecessário**, mas com nomes de arquivo e linhas exatos.

## 0. Regras desta missão
1. **Somente leitura e relatório.** Não altere código, testes, migrações, configuração nem dados. O único arquivo que você cria é o relatório (item 6), em branch própria `codex/avaliacao-AAAA-MM-DD`. Não faça push na `claude/wonderful-cannon-5o38v5`, não faça merge, não faça deploy e não crie PR sem o dono pedir.
2. **Não invente.** Cada achado precisa de evidência: arquivo e linha, saída de comando, captura de tela ou passo de reprodução. Separe claramente **"verifiquei"** de **"suponho"**. Se não conseguiu rodar algo, diga o que faltou. Não declare "tudo OK" por não ter achado nada: diga o que cobriu e o que não cobriu.
3. **Leia antes de opinar:** `CLAUDE.md`, `AGENTS.md`, `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` (autoridade máxima do e-commerce), `docs/constituicao/README.md`, `docs/design/DECISIONS.md` (decisões D1 a D77), `docs/adr/ADR-0001..0005`, `docs/PENDENCIAS-DO-DONO.md`, `docs/nextlevel-commerce/loja-de-teste-completa.md`, `COMMERCE_VISUAL_V2_DECISIONS.md` e `COMMERCE_VISUAL_V2_QA.md`. Onde o código contradiz a Constituição ou uma decisão aprovada, isso é achado.
4. **Fronteiras:** SuperDrop está em produção com clientes: qualquer risco a ele é severidade máxima. Master e SuperDrop não fazem parte da identidade visual do Commerce. Um tenant nunca lê dados de outro.
5. Não exponha segredos. Se encontrar um, relate o local sem copiar o valor.

## 1. Preparação (rode e registre o resultado)
```
npm ci
npx tsc --noEmit
npx eslint src e2e tests
npx vitest run            # ~5 min; registre falhas e testes lentos
npm run build             # não pode aparecer "Export encountered"
BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true bash scripts/restart-demo.sh   # demonstração em http://localhost:3100
E2E_BASE=http://localhost:3100 node e2e/commerce-glass-qa.mjs
```
Contas de demonstração (senha `demo1234`, só existem no modo de demonstração): `completo@commerce.demo` (Casa Aurora, ~144 pedidos, 34 produtos, todos os módulos com dados), `lojista@commerce.demo` (Fio & Linha, loja pequena), Master pela opção "Equipe NextLevel" na tela de login. Para ver a marca Commerce use o cabeçalho `x-forwarded-host: lojas.nextlevelgroup.com.br` (os scripts em `e2e/` já fazem isso). Se algum comando falhar por ambiente, relate e siga com a leitura estática.

## 2. Áreas a avaliar (todas; priorize pela severidade que encontrar)

### A. Dinheiro, pedidos e estoque (maior risco)
- Checkout e criação de pedido (`src/lib/domain/orders.ts`, `src/app/actions`, rotas de checkout): preço sempre calculado no servidor? Cupom nunca abaixo do custo? Frete? Pedido mínimo e preço por quantidade? Arredondamentos em centavos?
- **Idempotência** (`dedupeKey`, `idempotencyKey`): repetição de clique, repetição de webhook, pedido cancelado reaproveitando chave (D70).
- **Estoque:** reserva, expiração (`expireStaleReservations`), consumo no envio, cancelamento liberando uma única vez, corrida entre duas compras da última unidade, estoque negativo.
- **Pagamento:** só vale depois de conferido na API do Mercado Pago? O corpo do webhook nunca é confiável? Segredos só criptografados (`encryptSecret`)? Há log, tela ou e-mail vazando token ou chave Pix?
- Máquina de estados do pedido: transições inválidas, concorrência (`STATE_CONFLICT`), cancelamento de pedido pago, pedido entregue sem envio.
- Cobranças da NextLevel (assinatura, faturas, bloqueio por atraso, taxa por pedido): regras vêm de `platform_settings` (`getPriceBook`, `getPartnerSettings`) ou há valor fixo no código?

### B. Segurança e isolamento entre lojas
- Toda ação passa por `runAction`, `requireRole`/`assertCanAccess`? Procure rotas, server actions e route handlers que leiam ou gravem por `id` sem checar a loja do usuário (IDOR). Teste na prática: com a sessão da Casa Aurora, tente abrir pedido/cliente/produto de outra loja pela URL.
- Equipe (STAFF) realmente bloqueada em finanças, configurações, cupons, preços e equipe **no servidor** (não só no menu)? O menu novo (`commerce-merchant-shell.tsx`) filtra por prefixo: confirme que o servidor também bloqueia.
- Contas de demonstração: o e-mail terminando em `.demo` é bloqueado fora do modo de demonstração (`src/lib/security/demo-accounts.ts`)? A semente de dados de demonstração (`src/db/commerce-demo*.ts`, `bootstrap-data.ts`) pode rodar em produção por engano? Confira `DEMO_AUTOSEED` e o fluxo de `getDb`.
- Sessão, cookies, troca de senha obrigatória, recuperação de senha, limite de tentativas, cabeçalhos de segurança, CSRF em server actions, upload de arquivos (tipo, tamanho, caminho), links seguros (`isSafeLink`), XSS em campos de texto livre (nome de produto, descrição, notas, avaliações, campanhas), injeção em busca e filtros.
- Privacidade (LGPD): consentimento de marketing, exportações CSV só com consentimento, anonimização, trilha de auditoria (`audit_log`) sem dados sensíveis.

### C. Dados e migrações
- `src/db/schema.ts` x `drizzle/`: migrações publicadas editadas depois? Índices faltando em consultas por loja, data e status? Consultas N+1 nas telas de pedidos, clientes e análise com ~150 pedidos (e extrapole para 10 mil)? Transações onde deveria haver? Colunas de dinheiro sempre inteiras?
- Páginas que consultam o banco sem `export const dynamic = "force-dynamic"` (quebram o build/deploy).
- Diferenças entre PGlite (local) e Postgres/Neon (produção) que possam esconder bugs (tipos, ordenação, concorrência, `FOR UPDATE`).

### D. Domínio e regras de negócio do lojista
Percorra cada módulo com a conta `completo@commerce.demo` e confira se o que a tela promete bate com o dado: Pedidos (filtros e abas novas), Pós-venda, Etiquetas, Produtos e variantes, Categorias, Clientes/CRM, Cupons, Campanhas, Atacado, Propostas, Avaliações, Avise-me, Análise, Financeiro (caixa da loja x assinatura NextLevel), Equipe, Histórico, Configurações, Loja virtual/Temas/Aparência. Para cada um: o cálculo mostrado está correto (some por conta própria alguns números de Início, Análise e Financeiro direto no banco)? O estado vazio, de erro e de carregamento existe? Há botão que finge funcionar? Há conceito do SuperDrop vazando para o Commerce (Central, fornecedor, saldo, recarga, "Anexar etiqueta")?
- Indicadores do Início: "Conta ativa" x "Loja publicada" x "X de Y etapas" x "X de Y requisitos": os denominadores batem com `getStoreReadiness` e `computeOnboarding`? Há contradição entre eles?

### E. Vitrine pública e checkout do cliente final
Loja `/store/<slug>`: produto, carrinho, cupom, frete, checkout, acompanhamento do pedido, avaliação, "avise-me". Temas (`src/lib/themes`): troca sem perda de dados, temas pagos (compra e instalação), acesso de uma loja a tema de outra. SEO básico, desempenho de imagens, acessibilidade do checkout.

### F. Visual, navegação e acessibilidade (trabalho recente do Claude)
Arquivos: `src/components/commerce/*`, `src/components/commerce/commerce-glass.css`, `src/app/globals.css`, `src/components/ui/card.tsx`, `src/components/app/data-table.tsx`, `src/components/app/filter-bar.tsx`, `src/app/merchant/page.tsx`, `src/app/merchant/orders/page.tsx`.
- Abra a UI real em Claro e Escuro, 390, 768, 1280 e 1440 px, com `completo@commerce.demo` e com uma loja nova (`/cadastro`). Procure: corte de texto, rolagem lateral, contraste real (meça sobre o fundo renderizado), foco visível, ordem de tabulação, gaveta do celular, `aria-expanded`, `aria-current`, rótulos faltando, alvos de toque abaixo de 44 px, movimento sem respeito a `prefers-reduced-motion`, cores fixas que quebram o Escuro (modais, selects, tooltips, toasts).
- Vazamento visual: as classes e variáveis do Commerce aparecem em Master ou SuperDrop? Compare telas antes e depois (use `git log` para achar o commit anterior ao trabalho visual: `bce90c7`).
- Verifique as afirmações dos documentos `COMMERCE_VISUAL_V2_QA.md` e `COMMERCE_VISUAL_*`: o que está dito como testado foi realmente testado? Aponte qualquer afirmação exagerada.

### G. Qualidade de código e testes
- Lacunas de teste em dinheiro, estoque, permissões e isolamento. Testes que nunca falham (asserções fracas), testes lentos, dependência de ordem, e2e desatualizados.
- Código morto, duplicação, componentes grandes, tipos `any`/`as` perigosos, comentários que mentem, tratamento de erro engolido (`catch {}`), erros sem contexto.
- Desempenho: tamanho dos pacotes das páginas do painel, imagens sem dimensão, consultas pesadas, tempo de subida da demonstração (a semente nova adiciona ~25 s).
- Operação: logs, `error_events`, página de diagnóstico, rotinas agendadas (`CRON_SECRET`), backups, variáveis do Render. O que o dono precisa configurar e ainda não configurou (`docs/PENDENCIAS-DO-DONO.md`).

### H. Produto e prontidão para lançar
Do ponto de vista de um lojista novo: cadastro, pagamento do plano, primeiro produto, publicar, primeira venda. Onde ele trava ou se perde? O que falta para vender de verdade (pagamento real, frete real, domínio, e-mail)? O que a Constituição exige e ainda não está implementado (consulte `docs/constituicao/MATRIZ-COBERTURA-00-13.md` e `MATRIZ-DE-LACUNAS.md`; confirme se estão corretas)?

## 3. Como pontuar
Para cada achado: **ID** (A-01…), **título curto**, **severidade** (Crítico: perda de dinheiro, vazamento entre lojas, indisponibilidade da produção · Alto · Médio · Baixo · Observação), **área**, **evidência** (arquivo:linha, comando, captura), **o que acontece e para quem** (em frase simples), **como reproduzir**, **correção sugerida** (pequena e específica, sem implementar), **esforço** (P/M/G) e **confiança** (verificado / provável / suposição).

## 4. O que NÃO fazer
- Não reescreva a arquitetura nem sugira trocar a pilha (Next.js 16, Drizzle, PGlite/Neon, Vitest, Playwright).
- Não liste dezenas de preferências de estilo. Só o que afeta correção, segurança, dinheiro, acessibilidade, manutenção real ou o dono.
- Não repita pendências já registradas pelo dono sem acrescentar algo novo (apenas cite e remeta ao documento).
- Não afirme conformidade com LGPD, WCAG ou PCI. Diga o que checou.

## 5. Também avalie o próprio processo
O Claude trabalhou muitas horas seguidas, publicando por etapa. Aponte riscos do processo: decisões sem teste, mudanças de comportamento sem registro em `DECISIONS.md`, testes e2e desatualizados mascarando regressões (já encontramos dois), afirmações de "verificado" sem evidência, e o que vale automatizar na verificação do GitHub (`.github/workflows/ci.yml`).

## 6. Entrega
Crie **um único arquivo** `docs/avaliacoes/codex-AAAA-MM-DD.md` (na sua branch `codex/avaliacao-…`) com, nesta ordem:
1. **Resumo para o dono** (máximo 15 linhas, sem jargão): nota de prontidão em 3 níveis (pode vender / pode vender com ressalvas / não vender ainda) **com a justificativa**, os 5 maiores riscos e as 5 melhores melhorias por esforço x ganho.
2. **O que foi coberto e o que não foi** (tabela por área A a H: coberto / parcial / não coberto, e por quê).
3. **Resultado dos comandos** (tipos, estilo, testes, build, e2e) com saídas relevantes.
4. **Achados** ordenados por severidade (formato do item 3).
5. **Divergências com a Constituição e com `DECISIONS.md`.**
6. **Plano de correção sugerido** em ondas (o que fazer primeiro, em que ordem, o que o dono precisa decidir).
7. **Perguntas ao dono** (somente as que travam uma conclusão).

Termine o relatório informando o caminho do arquivo, a branch e o hash do commit. Não publique nada além disso.
