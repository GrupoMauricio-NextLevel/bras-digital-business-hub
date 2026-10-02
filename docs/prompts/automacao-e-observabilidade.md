# Prompt expert: automação, monitoramento e proteção da produção (NextLevel / SuperDrop)

> **Status: SALVO, NÃO IMPLEMENTADO** (decisão do dono, 2026-10-03: "crie um prompt expert e salve para implementar depois"). Cole o bloco da seção 1 numa sessão de trabalho. Skills do projeto relacionadas: `desempenho`, `qa-visual`, `publicar`, `painel-interno` (em `.claude/skills/`).
>
> **Já pronto (não refazer):** ganchos locais de commit e push (`.githooks/`, `scripts/instalar-ganchos.sh`); gancho do Claude antes do `git push` (`.claude/hooks/antes-do-push.sh`); CI em três grupos paralelos com resumo `verificar` (`.github/workflows/ci.yml`); medição de partida e metas (`docs/design/MEDICAO-DESEMPENHO-2026-10.md`); guia de verificação (`docs/nextlevel-commerce/verificacao-automatica.md`).
> **Fatos verificados no código:** `GET /api/cron/finance` (diário; no dia 1 emite mensalidades e fecha o mês, todo dia atualiza atrasos, bloqueios, reservas e pedidos sem saldo) e `GET /api/cron/expire-reservations` (a cada 5 a 10 min) exigem `Authorization: Bearer $CRON_SECRET` e **precisam de um agendador externo chamando-os**; `/api/health` responde o estado do banco; o Render usa `healthCheckPath: /login`, região **Ohio**, plano Starter; a Cloudflare do Render fica na frente, mas as respostas saem `no-store`; **todas as rotas são dinâmicas**; existem `emitEvent`/`domain_events`, `activities`, `email_outbox`, `control-tower.ts` (saúde de lojas e alertas) e `runDailyPartnerJobs`.
> **Não verificado (checar antes de assumir):** se o Render ou outro serviço já agenda os dois cron; plano e recuperação por ponto no tempo do Neon; quais variáveis do Render existem; se o e-mail (Resend) está ligado.

## 1. O prompt (colar numa sessão)
```
FUNÇÃO
Você é engenheiro de confiabilidade (SRE) e engenheiro full-stack sênior do sistema NextLevel (Next.js 16, TypeScript estrito, Drizzle, Neon/PGlite, Render). O dono, Mauricio, não é técnico: fale em português simples e sem jargão; código, arquivos e commits em português, como o projeto faz.

OBJETIVO
Montar a camada de AUTOMAÇÃO, MONITORAMENTO e PROTEÇÃO da produção, para que o sistema rode rápido e liso e o dono saiba de qualquer problema antes do cliente. Cada fase entrega valor sozinha, é testada e só então segue.

LEITURA OBRIGATÓRIA (nesta ordem)
AGENTS.md, CLAUDE.md, o cabeçalho de docs/prompts/automacao-e-observabilidade.md (fatos verificados e NÃO verificados), docs/nextlevel-commerce/verificacao-automatica.md, docs/design/MEDICAO-DESEMPENHO-2026-10.md, .github/workflows/ci.yml, render.yaml, src/app/api/cron/*, src/app/api/health/route.ts, src/lib/domain/control-tower.ts, src/lib/domain/events.ts, src/lib/email.ts e as skills em .claude/skills/. Este Next.js tem mudanças: consulte node_modules/next/dist/docs/ antes de escrever código (cache, instrumentation, route handlers).

REGRAS INEGOCIÁVEIS
- SuperDrop está em produção: nenhuma mudança de comportamento sem teste. Nada de regra de negócio, preço, pagamento ou permissão alterado aqui.
- Segredos nunca no código, em log, tela ou e-mail; tokens só criptografados (encryptSecret); o CRON_SECRET e qualquer chave de alerta ficam em variável de ambiente ou secret do GitHub, pedidos ao dono, nunca inventados.
- Um tenant nunca lê dado de outro: o painel de erros e os resumos respeitam papéis (requireRole) e o filtro de marca.
- Página que consulta o banco declara export const dynamic = "force-dynamic". Valores em centavos.
- Não criar PR sem pedido; trabalhar em branch própria (visual/v4 ou a designada); push só depois da verificação; nunca force push.
- Dado pessoal fora de logs e alertas (LGPD). Alerta diz O QUE falhou e ONDE, não quem comprou.
- Não prometer o que não foi medido. Cada fase fecha com o que foi e o que NÃO foi verificado.

ANTES DE CODAR (diagnóstico, 1 documento curto)
1. Confirme com o dono (pergunte, não presuma): o Render tem cron/agendador? Qual canal de alerta (e-mail, celular, WhatsApp)? Neon: plano e recuperação por ponto no tempo? Resend ligado?
2. Rode a skill desempenho para o ponto de partida e guarde os números.
3. Liste o que já existe para reaproveitar (activities, domain_events, control-tower, email_outbox) e proponha o mínimo novo.

FASES
A0. Agendador das rotinas do sistema (BLOQUEANTE para a cobrança automática)
  - Garantir que /api/cron/finance (1x/dia, 03:00 UTC) e /api/cron/expire-reservations (a cada 10 min) sejam chamados com Authorization: Bearer $CRON_SECRET. Opções por ordem de simplicidade: (1) Render Cron Job; (2) workflow agendado do GitHub com o secret CRON_SECRET; escolha com o dono e documente.
  - Registrar a última execução e o resultado (tabela ou activities) e alertar se uma rotina ficar sem rodar além do dobro do intervalo.
  - Teste: rota recusa sem segredo (401); duas execuções seguidas não duplicam fatura nem comissão (idempotência); falha de uma etapa não impede as outras.
  - Aceite: no dia 1 as mensalidades saem sozinhas na demonstração (relógio simulado) e o Master mostra "última execução".
A1. Monitor do site no ar com alerta
  - Workflow agendado (a cada 15 min) que testa lojas.nextlevelgroup.com.br, superdrop.com.br e master.nextlevelgroup.com.br (código, tempo de resposta, texto esperado) e /api/health (banco responde). Falha repetida 2x seguidas = alerta (GitHub avisa por e-mail; canal extra conforme o dono). Limite de tempo configurável (ex.: > 3 s = aviso).
  - Aceite: derrubar o health na demonstração dispara o alerta; documentar como silenciar manutenção.
A2. Painel de erros automático
  - Capturar exceções do servidor e do navegador (instrumentation do Next, error boundaries, route handlers, webhooks) em uma tabela própria (erros) com: rota, mensagem curta, pilha resumida, versão, marca, papel, contagem e primeira/última ocorrência, SEM dado pessoal nem segredo. Agrupar repetidos (impressão digital). Tela no Master (/master/erros) com filtros e "marcar como resolvido".
  - Teste: erro provocado aparece uma vez agrupado; segredos e e-mails são mascarados; só o Master vê.
A3. Resumo da manhã ao dono
  - Rotina diária (e-mail, depois canal escolhido): vendas e pedidos do dia, lojas novas, lojas em risco (control-tower), faturas vencidas e a vencer, pedidos travados, erros novos, resultado das rotinas. Texto curto em português simples, com links para as telas. Só envia se houver algo (ou resumo semanal quando calmo).
  - Teste: conteúdo montado por função pura; sem dado de outro tenant; idempotente por data (dedupeKey).
A4. Teste sintético de compra
  - Robô agendado (a cada poucas horas) que, na loja de demonstração da produção ou em ambiente de teste, faz compra de teste ponta a ponta (catálogo → carrinho → checkout simulado → pedido → painel) e confere e-mail e estoque; alerta se quebrar. NUNCA usa pagamento real nem dado de cliente real; pedido marcado como teste (não entra em taxa nem relatório).
A5. Regressão visual e orçamento de desempenho no CI
  - Capturas automáticas das telas-chave (home Commerce, SuperDrop, vitrine, login, painel do lojista) em 360/768/1440 comparadas com a referência aprovada; diferença acima do limite falha a verificação com a imagem anexada. Lighthouse nas públicas: falha se a nota cair abaixo da meta definida na skill desempenho (começar permissivo e subir).
A6. Cache das páginas públicas e vitrines (maior ganho de velocidade esperado)
  - Estudar node_modules/next/dist/docs/ (cache e revalidação do Next 16). Cache com revalidação curta para home, planos, dúvidas e vitrines de loja; invalidar quando o lojista publica tema ou muda produto/preço; NUNCA cachear página autenticada nem carrinho/checkout. Conferir cabeçalhos que a Cloudflare respeita.
  - Aceite: antes/depois com a skill desempenho (TTFB e nota); preço alterado aparece em até o tempo de revalidação; teste de que dado de um tenant não vaza pelo cache.
A7. Backup e recuperação
  - Documentar e testar a recuperação do banco (Neon: ponto no tempo; PGlite: cópia do volume). Rotina que verifica que o backup existe e alerta se faltar. Roteiro de restauração em português para o dono. Teste de restauração em ambiente descartável.
A8. Custos e segurança operacional
  - Checklist de alertas de gasto (Render, Neon, e-mail) com passos para o dono; dependabot e varredura de segredos no GitHub; revisão de limites de requisição (rateLimit) nas rotas públicas; plano de segundo fator para o acesso Master (proposta, sem implementar sem decisão).

PARA CADA FASE
Domínio testado antes de tela (Vitest); depois tela; depois e2e quando houver navegador; npx tsc --noEmit; npx eslint src e2e tests; testes que mudou; npm run build para mudança ampla; skills desempenho e qa-visual quando tocar página. Atualizar docs/design/DECISIONS.md (próxima decisão) e docs/nextlevel-commerce/verificacao-automatica.md. Commits pequenos em português, sem force push.

ENTREGA
Ao fim de cada fase: o que mudou para o dono em português simples, como conferir (passo a passo), o que foi e o que NÃO foi verificado, o que depende do dono (variável, painel, canal) e UMA pergunta de aprovação. Depois espere. Não avance de fase sem OK.

FORA DE ESCOPO
Regras de negócio, preços, pagamentos, nota fiscal, novos produtos, redesenho de telas, microsserviços, ferramentas pagas sem decisão do dono.
```

## 2. O que depende do dono (levantar na abertura)
1. O Render tem cron job? Plano e região (hoje Ohio) satisfazem? Ligar "Auto-Deploy: After CI Checks Pass" e a regra de branch (ver `verificacao-automatica.md`).
2. Canal dos alertas: e-mail, celular ou WhatsApp (WhatsApp exige serviço de envio pago).
3. Neon: plano, recuperação por ponto no tempo, região (o ideal é perto do Render e do Brasil).
4. Resend ligado (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`)? Sem ele, o resumo e os avisos não saem.
5. `CRON_SECRET` definido no Render e, se usar GitHub, também como secret do repositório.

## 3. Ordem recomendada
A0 → A1 → A2 → A3 → A6 → A4 → A5 → A7 → A8. A0 e A1 primeiro porque protegem a cobrança e o aviso de queda; A6 traz o maior ganho de velocidade.
