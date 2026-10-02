# Proteção da produção: o que já existe, como conferir e o que falta

Estado em 2026-10-03. Cada item diz se foi **testado** (teste automático ou navegador) ou **não verificado** (depende de algo que só existe no Render/GitHub/Neon).

## Já existe
| O quê | Como conferir | Verificação |
|---|---|---|
| **Rotinas registradas** (`/api/cron/expire-reservations` e `/api/cron/finance`): cada etapa é isolada e o resultado fica gravado | Master → Commerce → lista de lançamento → "Rotinas automáticas rodando" | Testado (`tests/rotinas.test.ts`). **O agendador em si depende de você** (Render ou GitHub, ver abaixo) |
| **Monitor do site no ar** a cada 15 min (`.github/workflows/monitor.yml`): confere `/login` e `/api/health` de lojas, SuperDrop e Master; falhou duas vezes = e-mail do GitHub | Aba Actions → "Monitor do site" | Só a sintaxe foi validada; **não foi executado no GitHub ainda** |
| **Erros do sistema** (Master → Erros do sistema): erro do servidor e das telas, agrupado, sem e-mail/telefone/CPF/fichas | Provocar um erro e abrir a tela | Testado o domínio (`tests/painel-erros.test.ts`); captura real no Render **não verificada** |
| **Resumo do dia** (Master → Resumo do dia) e e-mail diário aos usuários Master | Abrir a tela; o e-mail só sai com Resend configurado | Testado (`tests/resumo-dia.test.ts`) |
| **Dependências** atualizadas por pedido semanal do GitHub (`.github/dependabot.yml`) | Aba Pull requests | Configuração padrão do GitHub |
| **Verificação a cada push** (tipos, estilo, testes e build) e jornada completa de compra em navegador (`e2e/jornada-completa.mjs`) | Aba Actions → ci | Testado |

## Como ligar o agendador das rotinas (escolha UMA forma)
1. **Render:** Cron Job chamando `GET {seu endereço}/api/cron/expire-reservations` (a cada 10 min) e `GET {seu endereço}/api/cron/finance` (1×/dia, 03:00 UTC) com o cabeçalho `Authorization: Bearer {CRON_SECRET}`.
2. **GitHub (sem custo):** Settings → Secrets and variables → Actions: segredo `CRON_SECRET` (mesmo valor do Render) e variável `APP_URL`. O fluxo `rotinas.yml` passa a chamar sozinho.
Depois de 10 minutos o item "Rotinas automáticas rodando" fica verde no Master.

## Backup do banco (Neon): o que você precisa conferir
Não consigo ver a sua conta do Neon daqui. Confira: (1) o plano tem **recuperação a um ponto no tempo** (dias de histórico); (2) crie uma **ramificação (branch) de teste** a partir de um momento passado e abra o painel nela para provar que a restauração funciona; (3) anote o prazo de retenção. Sem plano pago, a retenção é curta. Não tem como testar isso sem a sua conta.

## Alertas de gasto e segurança (checklist)
- Render e Neon: ligar aviso de gasto/limite no próprio painel de cada um.
- GitHub: Settings → Code security → ligar **Dependabot alerts** e **Secret scanning** (gratuitos em repositório privado conforme o plano).
- Acesso Master: o segundo fator (código no celular) é a próxima recomendação de segurança; **não foi implementado** (proposta apenas).
- Limites de requisição existem no cadastro, contato, login e links de parceiro; erros do navegador têm limite próprio.

## Ainda não feito (fases A4 a A8 do prompt)
Teste sintético de compra agendado em produção (exige uma loja de exemplo pública em produção), regressão visual por captura no CI, cache das páginas públicas (maior ganho de velocidade; precisa de medição antes e depois) e teste de restauração do banco (depende do Neon).
