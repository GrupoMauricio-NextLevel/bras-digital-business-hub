# Plano de uso do Render (custos, publicação e manutenção)

> Pedido do dono em 09/11/2026: "documentos não precisam ir para o Render; crie um plano estruturado de utilização do Render e salve na memória". Regra curta em `CLAUDE.md` ("Custo de montagem no Render").
> Toda sessão (Claude, Codex, pessoas) segue este plano antes de dar push na branch de publicação. Hierarquia e nomes (conta, projetos, ambientes): `docs/infra/RENDER-ORGANIZACAO.md`.

---

## 1. O que existe no Render (inventário de 09/11/2026)

**Conta:** workspace "My Workspace" (`tea-dau39tflot8c739ggdog`), região Ohio.

| Serviço | ID | Para que serve | Branch | Plano da máquina | Auto-deploy |
|---|---|---|---|---|---|
| **superdrop** | `srv-dau3ec1srm7s73akufp0` | **O sistema de verdade**: todas as marcas e todos os endereços reais (`lojas.nextlevelgroup.com.br`, `master.nextlevelgroup.com.br`, `superdrop.com.br`, `bras…`, `cargas…`) e, a partir da S0 do plano de busca, `nextlevelcommerce.com.br` | `claude/wonderful-cannon-5o38v5` | **Free** (dorme), mudar para **Starter** | Sim |
| **nextlevel-demo** | `srv-db66moajnfac73ckp8o0` | "Mundo de Treino": dados de demonstração em memória, usado em guias e testes sem risco (`https://nextlevel-demo.onrender.com`) | `claude/wonderful-cannon-5o38v5` | Free (pode dormir) | **Desligar (manual)** |
| **nextlevel-demo-db** | `dpg-db67u8rbc2fs73b58qq0-a` | Postgres grátis criado em 12/10; **vence em 11/11/2026**. O treino usa banco em memória, então tudo indica que não está em uso | — | Free | — |

**Banco de produção:** o `superdrop` deve usar o Neon (`DATABASE_URL` com `neon.tech`). **Neon (D338, 18/11/2026):** o grátis acabou em 17 dias por banco sempre acordado; conta nova (US East 2, Ohio, com pooling), grátis por uma semana e depois Launch (por uso). Toda tela "ao vivo" usa `podeConsultar()`; rotinas do GitHub de hora em hora. Nada de consulta automática nova sem essa regra. **Confirmar com o dono** (ele confere o começo do valor no painel, sem mandar o valor).

**Variáveis de ambiente que o sistema usa no Render** (só nomes; valores nunca em documento, chat ou log):
- banco e sessão: `DATABASE_URL`, `SESSION_SECRET`;
- acesso do dono: `MASTER_EMAIL`, `MASTER_PASSWORD`;
- endereço: `APP_URL`, `BRAND_URL_*`, `BRAND_DOMAINS_*`;
- suporte: `NEXT_PUBLIC_SUPPORT_WHATSAPP`, `NEXT_PUBLIC_SUPPORT_EMAIL`;
- e-mail: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`;
- Brás: `BRAND_SIGNUP_BRAS_DIGITAL`;
- domínio próprio dos lojistas: `LOJA_DOMINIO_CNAME` (= `superdrop.onrender.com`, corrigido em 09/11), `LOJA_DOMINIO_IP` (padrão `216.24.57.1`), `RENDER_SERVICE_ID` (= `srv-dau3ec1srm7s73akufp0`, preenchido em 09/11) e `RENDER_API_KEY` (pendente: o dono cria e cola direto no Render).

---

## 2. Quanto custa e qual é a meta

| Item | Preço do Render | Outubro/2026 | Meta |
|---|---|---|---|
| Máquina do `superdrop` | Free = US$ 0 (dorme); Starter = US$ 7/mês (não dorme) | US$ 0 (dormindo) | **Starter**: US$ 7 |
| Máquina do `nextlevel-demo` | Free | US$ 0 | Free (pode dormir) |
| **Minutos de montagem** (pipeline) | 500 min grátis por mês; depois US$ 5 por bloco de até 1.000 min | 1.252 min (`superdrop` 822 + `nextlevel-demo` 430) → 752 cobrados = **US$ 5** | **até 500 min/mês = US$ 0** |
| Domínios próprios | US$ 0,25 por domínio por mês | 6 domínios = US$ 1,50 | 8 com o domínio novo e o `www` = US$ 2 |
| Postgres do treino | Free (vence) | US$ 0 | Deixar vencer |

**Meta mensal: cerca de US$ 9** (Starter + domínios), com montagem dentro dos 500 minutos grátis.

**Orçamento de montagem** (uma montagem do `superdrop` leva cerca de 5 minutos):

| Serviço | Montagens por mês | Minutos |
|---|---|---|
| `superdrop` | até **85** (média de 3 por dia útil, com folga) | cerca de 425 |
| `nextlevel-demo` | até **10**, só manual, quando houver teste | cerca de 50 |
| **Total** | | **cerca de 475 (dentro dos 500 grátis)** |

---

## 3. Regras de publicação (valem para todas as sessões)

1. **Documento não vai para o Render.** Commit que só mexe em `docs/`, arquivos `.md`, notas, prompts, PDFs e roteiros leva `[skip render]` na mensagem. O commit vai para o GitHub (o histórico fica guardado), mas nada é montado.
2. **Juntar antes de publicar.** Uma rodada de trabalho = **uma publicação**. Os commits pequenos ficam locais (ou no GitHub com `[skip render]`) e a publicação acontece no fim da rodada, depois da verificação (tipos, estilo, testes).
3. **Limite diário:** no máximo **3 publicações de código por dia**. Ajuste urgente (site fora do ar, pagamento, segurança) não conta.
4. **Nunca publicar só para:** vírgula, texto de documento, mudança de nota, teste de "será que funciona". Correção pequena de texto da tela entra na próxima publicação de código.
5. **Branch de revisão** (`revisao/ecommerce-home-imersiva`) não monta nada no Render; pode receber push à vontade.
6. **Variável de ambiente também monta:** mudar variável no Render dispara uma montagem. Juntar as mudanças de variáveis numa vez só e, se possível, junto com a publicação de código.
7. **Montagem que falhou também gasta.** Por isso a verificação local (tipos, estilo, testes do que mudou; build completo em mudança grande) vem antes do push, como já manda o `CLAUDE.md`.
8. **O treino não monta sozinho.** O `nextlevel-demo` fica com auto-deploy desligado. Antes de uma sessão de testes ou de um guia (Daniel, Samuel), o dono ou o Claude dispara "Manual Deploy" uma vez.
9. **O Render olha só o ÚLTIMO commit do push** (lição de 17/11/2026): se o código vai junto com commits de documento e o último commit tem `[skip render]`, nada é montado e o código não sobe. Na publicação, o último commit precisa ser de código (sem `[skip render]`). E mudar variável pelo painel ou pela API monta o commit que já está no ar: ligue a variável **depois** do push do código, ou junto, nunca antes.

**Como saber se um commit é "só documento":** `git diff --name-only <base>..HEAD`. Se todos os arquivos começam com `docs/` ou terminam em `.md`, use `[skip render]`.

---

## 4. Ajustes para montar mais rápido (menos minutos por montagem)

| # | Ajuste | Ganho esperado | Quando |
|---|---|---|---|
| 1 | **`.dockerignore`**: adicionar `docs`, `e2e`, `tests`, `.claude`, `*.pdf`, `*.md` (menos `README.md`, se algum passo usar) e capturas. Hoje a pasta `docs` tem cerca de 129 MB e vai inteira para a montagem, sem ser usada pelo sistema | Menos upload e cópia a cada montagem | Na próxima publicação de código (não gastar uma montagem só para isso) |
| 2 | **Filtro de montagem** no Render (`superdrop` → Settings → Build Filters → Ignored Paths): `docs/**`, `**/*.md`, `e2e/**` | Rede de segurança: mesmo sem `[skip render]`, documento não monta | Dono, agora |
| 3 | Medir o tempo de cada etapa da montagem no log (instalação, build do Next.js) e atacar a maior | Depende do resultado | Quando houver folga |

---

## 5. Máquina, banco e domínios

- **`superdrop` em Starter.** No Free, o site dorme depois de 15 minutos sem visita, e a primeira visita espera cerca de 90 segundos (medido em 09/11). Isso afasta cliente e atrapalha o Google, que mede a velocidade.
- **Banco:**
  - produção no Neon;
  - o Postgres do treino (`nextlevel-demo-db`) pode vencer em 11/11. Antes de excluir, confirmar nos logs do treino que ele não conecta nesse banco.
- **Domínios do `superdrop`:**
  - hoje são 6;
  - o domínio novo `nextlevelcommerce.com.br` e o `www` entram pelo painel (Settings → Custom Domains);
  - a troca de endereço segue a seção 4 do plano `docs/prompts/busca-e-ia-visibilidade-organica.md`, com 301 só para GET e `/api/*` sem redirecionar.
- **Domínio dos lojistas:** com `RENDER_API_KEY` e `RENDER_SERVICE_ID`, o sistema cadastra sozinho no Render. Cada domínio de lojista custa US$ 0,25/mês, um custo pequeno que entra no preço do adicional de domínio.

---

## 6. Rotina de acompanhamento

| Quando | O que | Como |
|---|---|---|
| A cada publicação | Conferir se a montagem terminou e o site respondeu | `list_deploys` (ferramenta do Render) e `curl` no site |
| Toda segunda-feira | Contar as montagens da semana e os minutos | `list_deploys` dos dois serviços; somar `finishedAt − startedAt` |
| Dia 20 de cada mês | Se o mês passou de 400 minutos, segurar publicações (só urgência) até o dia 1º | Painel do Render → Billing → Usage |
| Dia 1º de cada mês | Fatura: conferir e avisar o dono se houver cobrança acima de US$ 10 | Painel do Render → Billing |
| Sempre | Faixa "Payment failed" no painel = avisar o dono no mesmo dia (o Render pode suspender os serviços) | — |

---

## 7. Pendências do dono no Render (09/11/2026)

1. Atualizar o cartão e pagar a fatura de outubro (US$ 6,50).
2. Passar o `superdrop` para **Starter** (Settings → Instance Type).
3. Desligar o **Auto-Deploy** do `nextlevel-demo` (Settings → Build & Deploy).
4. Pôr o **filtro de montagem** no `superdrop` (seção 4, item 2).
5. Confirmar se a `DATABASE_URL` do `superdrop` tem `neon.tech` (só sim ou não).
6. Criar a `RENDER_API_KEY` (Account Settings → API Keys) e colar no Environment do `superdrop`.
7. Adicionar `nextlevelcommerce.com.br` e `www.nextlevelcommerce.com.br` em Custom Domains e mandar o print dos registros de DNS.
- **(17/11/2026, D315)** Custom Domains do `superdrop`: adicionar `painel.nextlevelcommerce.com.br` (CNAME `painel` → `superdrop.onrender.com` no DNS). Depois do domínio verificado, ligar `AGENCIAS_URL=https://painel.nextlevelcommerce.com.br` (o Claude pode ligar pela API).
