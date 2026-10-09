# BRÁS DIGITAL: PROMPT MESTRE DE ENGENHARIA (rodada da noite, sem o dono)

> **Para quem é:** o agente de engenharia (Claude) que vai trabalhar sozinho durante a noite de 2026-10-09 na Brás Digital.
> **Pedido do dono (literal):** "vou descansar agora, pensando no Brás Digital, me dê uma lista de demandas a serem desenvolvidas durante a noite, sem minha interferência. Use as skills necessárias para criar um extenso arquivo .md com um prompt mestre de engenheiro para aplicar esse desenvolvimento."
> **Autoridade:** Constituição (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`) > `docs/design/DECISIONS.md` (D91 a D98 são da Brás) > `docs/prompts/bras-digital-plataforma.md` (adendo no começo) > este documento > a tarefa do momento. Em conflito, vence o de cima, e o conflito é registrado.
> **Próxima decisão livre:** D99 (confira em `CLAUDE.md` antes de numerar).

---

## 0. Seu papel e o contrato da noite

Você é o engenheiro responsável pela Brás Digital: domínio, banco, telas, testes e publicação. O dono está dormindo e **não vai responder**. O trabalho é escolher sempre o caminho mais seguro e mais simples, **registrar** cada escolha, e deixar de manhã um sistema melhor, publicado e comprovado, com um relatório que o dono lê em 5 minutos.

### 0.1 O que você PODE fazer sozinho
- Implementar as demandas da seção 4, na ordem, uma de cada vez, com teste.
- Criar tabelas e colunas **aditivas** (prefixo `bd_`), com `npx drizzle-kit generate --name <assunto>`.
- Publicar na branch `claude/wonderful-cannon-5o38v5` depois da bateria completa (D65: "autorizo publicar sempre que for preciso"). Cada push publica no Render em 3 a 6 minutos.
- Escrever textos de interface, e-mails, termos e política **marcados como versão inicial para revisão jurídica**.
- Corrigir bug que encontrar no caminho, dentro da Brás, com teste.

### 0.2 O que você NÃO pode fazer (pare e registre como pendência do dono)
- Ligar ou desligar variável de ambiente no Render (`BRAS_PANELS`, `BRAS_WHATSAPP`, chaves) ou mexer em DNS. **Exceção nenhuma** nesta noite.
- Apagar ou reescrever dado de produção, editar migração já publicada, fazer force push, rebase da branch de publicação.
- Mudar comportamento do SuperDrop ou da Commerce (estão em produção com clientes). Se um arquivo compartilhado precisar mudar, a mudança tem de ser neutra para as outras marcas **e** coberta por teste.
- Cobrar dinheiro, integrar gateway, prometer ganho, inventar número, cliente, depoimento ou importadora.
- Expor preço, estoque, importadora, veredito ou análise para quem não tem direito (regras da seção 2).
- Contratar serviço externo (vídeo, IA, validação de CNPJ, WhatsApp oficial): segunda etapa, decisão do dono.

### 0.3 Quando travar
Se uma demanda depender de algo da seção 0.2 ou de uma resposta do dono, **não invente**: implemente a parte que não depende (com a chave desligada ou o texto marcado `[CONFIRMAR]`), registre em "Pendências do dono" do relatório e passe para a próxima demanda. Nunca fique parado.

---

## 1. Onde a Brás está hoje (estado de 2026-10-09, 00h)

| Área | Situação | Onde |
|---|---|---|
| Endereço | `bras.nextlevelgroup.com.br` no ar, certificado ok (D96) | `src/lib/brand.ts` |
| Abertura | `BRAND_SIGNUP_BRAS_DIGITAL=true` ligado pelo dono (D98): página pública completa e cadastro grátis com CNPJ | Render |
| Página pública | Refeita no nível da Commerce (D98): palco com Meu Brás, mosaico, descobertas, Meu Brás em 3 situações, acesso em 3 camadas, para quem, importadoras, dúvidas | `src/components/portal/bras/bras-home.tsx`, `bras-ui.tsx` |
| Membro | Cadastro com CNPJ (dígitos conferidos), acesso na hora, bloqueio pelo Master | `src/lib/domain/bras/membros.ts`, `bd_members`, papel `BRAS_MEMBER`, `/meu-bras` |
| Descobertas | Shorts público, veredito/nota/trecho para membro, análise completa (aberta no lançamento; depois assinatura ou volume) | `src/lib/domain/bras/descobertas.ts`, `videos.ts`, `bd_videos`, `bd_access_grants` |
| Catálogo e pedido | Importadoras sem login, oferta por vídeo (preço da caixa, unidades, caixas), pedido manual com envio; situações Recebido → Confirmado → Pago → Retirado (ou Cancelado); importadora oculta até confirmar | `src/lib/domain/bras/catalogo.ts`, `bd_importers`, `bd_offers`, `bd_requests` |
| Estúdio (Master) | `/bras`: Pedidos, Descobertas, Importadoras, Membros, Acesso à análise | `src/app/bras/*`, `BRAS_ADMIN_NAV` |
| Balcão (importadora) | Só prévia atrás de `BRAS_PANELS` (desligada) | `src/app/bras/balcao` |
| Dinheiro | Todo para a importadora; ela paga a comissão ao dono **à parte, manualmente** (D92). Nada automatizado | — |
| Atendimento | Responsabilidade do dono/equipe Brás. WhatsApp: `BRAS_WHATSAPP` **não configurado** (cai no suporte geral) | `src/lib/bras/contato.ts` |
| Jurídico | **Termos de uso e privacidade da Brás não existem**, mas o cadastro já guarda CNPJ, nome, e-mail e WhatsApp | — (demanda N1) |
| Fotos | 4 fotos do manifesto pendentes; a página só mostra foto quando o arquivo existe | `public/portal/bras/v3/MANIFESTO.md` |
| Migração atual | `0043_bras_digital` | `drizzle/` |

Testes que já protegem a Brás: `tests/bras-{membros,videos,catalogo,descobertas,panels,visibility}.test.ts`, `tests/host-routing.test.ts`, `tests/brand.test.ts`, `tests/area-theme.test.ts`; e2e `e2e/bras-portal.mjs` (fluxo inteiro, 360/768/1440, axe, nenhum `R$` na página pública, nada vaza).

---

## 2. Regras que não quebram (Brás)

1. **Preço nunca é público.** Visitante não vê valor em reais em nenhum caminho (página, e-mail público, link compartilhado, metadados, imagem de compartilhamento). O e2e confere `R$\s?\d` na página pública; estenda a conferência para cada página pública nova.
2. **A importadora nunca vê o cliente.** Só `brasShippingView` (endereço de envio, transportadora, caixas). Nada de CNPJ, telefone, e-mail ou nome do membro.
3. **O membro não vê a importadora antes do pedido confirmado** (`BRAS_IMPORTER_VISIBLE`).
4. **Análise completa só para quem tem acesso** (`brasAccessFor`: OPEN, SUBSCRIPTION, COURTESY, VOLUME). Veredito, nota, trecho e preço da caixa: membro grátis.
5. **Um tenant nunca lê dado de outro.** Toda ação passa pelo domínio (`src/lib/domain/bras/*`) e por `runAction`; permissão no servidor (`requireRole`, `assertCanAccess`).
6. **Auditoria** (`recordAudit`) em toda ação do Master e em toda mudança de situação.
7. **Valores em centavos**, datas ISO, textos em português claro, sem promessa de ganho ("dados e opinião, nunca promessa de ganho").
8. **Página que consulta o banco** declara `export const dynamic = "force-dynamic"`.
9. **Marca vem de `getBrand()`**; nada de "Brás Digital" fixo em componente compartilhado. Componentes só da Brás ficam em `src/components/portal/bras/`, `src/app/bras/`, `src/app/meu-bras/` e usam o prefixo de CSS `bd-`.
10. **Acessibilidade AA**: axe sem violação grave, foco visível, teclado, sem rolagem horizontal em 360 px (e 320 px nas telas novas).
11. **Regra configurável** em `platform_settings`, nunca fixa (ex.: percentual de comissão padrão, prazos).
12. **Segredos** só com `encryptSecret`; nada em tela, log ou e-mail.

---

## 3. Protocolo de cada demanda (repita sempre)

1. **Ler antes de escrever:** o domínio da Brás que a demanda toca, as decisões citadas e o teste existente. Procure e estenda; não duplique (regra anti-duplicação de `CLAUDE.md`).
2. **Domínio primeiro** (`src/lib/domain/bras/*`), com Zod e auditoria; depois a ação (`src/app/actions/bras.ts`); por último a tela.
3. **Teste de Vitest** para cada regra nova (sucesso, permissão negada, isolamento, borda). Mudança de comportamento sem teste não entra.
4. **Migração** só se precisar: alterou `src/db/schema.ts` → `npx drizzle-kit generate --name <assunto>` → atualize `tests/health.test.ts` com o nome da migração nova.
5. **Tela**: estados vazio, carregando, erro; textos do glossário (seção 6); 360/768/1440; axe.
6. **e2e**: estenda `e2e/bras-portal.mjs` ou crie `e2e/bras-<assunto>.mjs`. Servidor local: `next start` com `BRAND_SIGNUP_BRAS_DIGITAL=true BRAND_DOMAINS_BRAS_DIGITAL=127.0.0.1` (127.0.0.1 faz o papel do endereço da Brás; localhost é o Master/SuperDrop).
7. **Bateria antes do push:** `npx tsc --noEmit`, `npx eslint src e2e tests --max-warnings=0`, `npx vitest run` (completa, ~5 min, uma instância só), `npm run build` (sem "Export encountered"), e2e da Brás.
8. **Decisão** em `docs/design/DECISIONS.md` (D99 em diante) e `CLAUDE.md` "próxima: Dxx".
9. **Commit pequeno**, em português, e `git push origin HEAD:claude/wonderful-cannon-5o38v5` (fast-forward; antes, `git fetch` e confira que a branch remota é ancestral).
10. **Conferir o ar:** `https://lojas.nextlevelgroup.com.br/api/health` mostra a versão nova e a migração; abrir `https://bras.nextlevelgroup.com.br/` e conferir que responde 200 e não tem `R$`.
11. Anotar no relatório da noite (seção 8) o que entrou, o hash e o que ficou pendente.

Skills do projeto para usar: `publicar` (bateria e envio), `nova-migracao` (migração), `e2e-demo` (navegador), `qa-visual` (capturas 360/768/1440 com rolagem), `painel-interno` (telas do Estúdio e do Meu Brás), `pagina-de-vendas` (páginas públicas), `desempenho` (se tocar em página pública pesada).

---

## 4. Demandas da noite (em ordem de prioridade)

Cada demanda tem: **por que**, **o que entregar**, **critérios de aceite**, **testes**. Faça na ordem. Se uma travar, registre e siga.

### N1. Termos de uso, política de privacidade e aceite no cadastro (urgente: o cadastro já está aberto)
**Por quê:** desde D98 o cadastro está aberto e guarda CNPJ, nome, e-mail e WhatsApp sem termos nem política publicados (LGPD). O rodapé ainda diz "serão publicados aqui antes da abertura ao público".

**Entregar:**
- Páginas `/termos` e `/privacidade` no endereço da Brás (portal público da marca fechada; liberar os caminhos em `CLOSED_PUBLIC_PATHS` de `src/lib/host-routing.ts`, com teste).
- Conteúdo fiel ao que o sistema **faz hoje**: quem é o controlador (NextLevel Marketing Ltda.), que dados guarda (`bd_members`, `users`, `bd_requests`), para quê (acesso, pedido, atendimento), com quem compartilha (importadora: só endereço de envio do pedido), por quanto tempo, direitos do titular e canal de contato, uso do YouTube para vídeos, cookies de sessão. Regras do atacado nos termos: só CNPJ, caixa fechada, pedido mínimo de 1 caixa, retirada no Brás pela transportadora do cliente, pagamento combinado com a equipe, análise é opinião e não promessa de ganho, bloqueio por uso indevido.
- Aviso visível no topo de cada página: "Versão inicial de [data]. Em revisão jurídica." e versão (`BRAS_TERMS_VERSION`, constante no domínio).
- **Aceite no cadastro:** caixa obrigatória "Li e aceito os termos de uso e a política de privacidade" com links; o domínio recusa sem aceite. Gravar `terms_accepted_at` e `terms_version` em `bd_members` (migração aditiva, colunas anuláveis para os membros que já existem).
- Rodapé do portal da Brás com os dois links (sem mudar o rodapé das outras marcas).
- Membros antigos sem aceite: aviso no Meu Brás com botão "Aceitar a versão atual" (ação no domínio, auditada).

**Aceite:** sem a caixa marcada o cadastro não passa (mensagem clara); com ela, o membro tem data e versão gravadas; as páginas abrem no endereço da Brás e respondem 404 no endereço da Commerce; nenhum `R$` nas páginas.
**Testes:** `tests/bras-termos.test.ts` (recusa sem aceite, grava versão, aceite posterior, isolamento), `tests/host-routing.test.ts` (caminhos novos só na Brás), e2e: abrir as duas páginas e cadastrar com aceite.
**Pendência do dono:** revisão por advogado `[CONFIRMAR]`; razão social, CNPJ e endereço da controladora `[CONFIRMAR]` (use os dados que já existirem no repositório; nunca invente CNPJ).

### N2. E-mails e avisos da Brás (o membro e a equipe sabem o que aconteceu)
**Por quê:** hoje nada avisa o membro quando o pedido muda de situação, nem a equipe quando chega cadastro ou pedido. O atendimento é do dono: ele precisa saber na hora.

**Entregar** (sobre `src/lib/email.ts`, `sendEmail`, `renderHtml` com a marca da Brás; sem provedor novo):
- Para o membro: boas-vindas no cadastro; "Recebemos o seu pedido N"; "Pedido N confirmado" (com o nome da importadora, que passa a ser visível); "Pagamento do pedido N registrado"; "Pedido N retirado"; "Pedido N cancelado".
- Para a equipe (`MASTER_EMAIL` ou a lista em `platform_settings` `bras.team_emails`): "Novo membro: empresa X (CNPJ)" e "Novo pedido N: produto, caixas, cidade/UF".
- E-mail **nunca** leva preço da caixa para quem não é membro (todos os destinatários aqui são membros ou equipe; mesmo assim, só valores do próprio pedido).
- Aviso dentro do painel (o mecanismo existente de avisos, `recentNotices`) para o membro a cada mudança de situação.
- Envio sem travar a ação: falha de e-mail não desfaz o pedido (registre em `error_events`).

**Aceite:** cada transição dispara exatamente um e-mail ao membro e um aviso; reenvio da mesma transição não duplica (idempotência por chave `bras-request-<id>-<status>`).
**Testes:** `tests/bras-avisos.test.ts` com `fetch` falso (texto, destinatário, marca, sem dado de outro membro, idempotência, falha de envio não quebra a ação).

### N3. Página de cada descoberta para compartilhar (o link do Shorts leva a uma página própria)
**Por quê:** o Shorts precisa de um destino: "veja a análise em bras.nextlevelgroup.com.br/d/<código>". Hoje o link vai para a home.

**Entregar:**
- Rota pública `/d/[id]` (curta; aceitar também um código curto legível se já houver; senão o id): título, gancho, sinal de tendência em palavras, o Shorts (carregado só ao tocar), o que o membro vê ("veredito, preço da caixa, caixas disponíveis") **trancado**, e os botões "Ver análise e preço" (→ `/cadastro?video=<id>`) e "Já sou membro" (→ `/meu-bras/descoberta/<id>` via login).
- Metadados de compartilhamento (título, descrição, imagem = miniatura do YouTube), **sem preço**. Página continua `noindex` como o resto da marca fechada (`robotsForBrandPortal`).
- Descoberta desativada ou inexistente: 404 amigável com link para a home.
- Na home e nos cartões de vídeo, o link "Compartilhar" copia a URL da descoberta.
- No Estúdio, em cada descoberta, o botão "Copiar link para a descrição do Shorts".

**Aceite:** a página não mostra veredito, nota, trecho, análise, importadora ou valor; o botão leva ao cadastro com o vídeo; o caminho é liberado só no endereço da Brás.
**Testes:** domínio (o que a página pública recebe: só campos públicos, teste de chaves como `bras-videos.test.ts`), roteamento, e2e (abrir, conferir ausência de `R$` e do veredito, tocar o vídeo, ir ao cadastro).

### N4. De onde vem cada membro (origem do cadastro por descoberta)
**Por quê:** o dono vai gravar 4 descobertas por semana. Ele precisa saber **qual vídeo traz cadastro e pedido**.

**Entregar:**
- Gravar em `bd_members` a origem: `source_video_id` (quando veio de `/cadastro?video=`), `source` (`descoberta`, `home`, `direto`, `utm_source` se houver, curto e saneado). Migração aditiva.
- No Estúdio, em Descobertas, colunas "Cadastros" e "Pedidos" por descoberta (pedidos dos membros que vieram dela, e pedidos feitos a partir dela).
- Sem cookie de rastreamento novo; só o parâmetro do link no momento do cadastro.

**Aceite:** cadastro vindo de `/cadastro?video=X` conta para X; parâmetro inválido é ignorado sem erro.
**Testes:** domínio (origem gravada, contagem por descoberta, parâmetro inválido), e2e curto.

### N5. Agenda das descobertas (4 por semana sem esquecer)
**Por quê:** o dono decidiu publicar 4 descobertas por semana. Hoje publicar é ligar/desligar na hora.

**Entregar:**
- Campo `publish_at` em `bd_videos` (migração aditiva, anulável = publicada já). A página pública, o feed do membro e `/d/[id]` só mostram descoberta com `active` **e** `publish_at` vazio ou no passado.
- No Estúdio, em Descobertas: escolher data e hora de publicação; selo "Agendada para qui, 10/10 às 18:00"; visão da semana (segunda a domingo) com as descobertas de cada dia e o aviso "Faltam N descobertas para a meta da semana" (meta em `platform_settings` `bras.weekly_goal`, padrão 4).
- Sem agendador novo: a regra é de leitura (comparar com a hora atual), então nada precisa rodar de madrugada.

**Aceite:** agendada para o futuro não aparece para visitante nem membro; aparece no horário; o Estúdio vê todas.
**Testes:** domínio com relógio fixo (antes/depois do horário), e2e do Estúdio agendando.

### N6. Visão geral do Estúdio e controle manual da comissão
**Por quê:** o dinheiro vai todo para a importadora e ela paga a comissão à parte (D92). O dono precisa de um painel que diga quanto cada importadora deve, e marcar quando recebeu, sem planilha.

**Entregar:**
- Nova primeira tela do Estúdio, "Visão geral": membros novos (7 e 30 dias), pedidos por situação, caixas e valor dos pedidos pagos/retirados no mês, descobertas publicadas na semana × meta, últimos 5 pedidos que pedem ação (Recebido há mais de 24 h).
- Percentual de comissão por importadora (coluna `commission_bps` em `bd_importers`, padrão em `platform_settings` `bras.default_commission_bps`; o dono edita na tela de Importadoras). O percentual **vale a partir da data** (guarde o percentual no pedido quando ele vira Pago: `commission_bps` em `bd_requests`, para que mudar o percentual não reescreva o passado).
- Tela "Comissões": por importadora e por mês, os pedidos pagos/retirados, o valor, o percentual congelado, a comissão devida; botão "Marcar como recebida" (fechamento do mês: tabela `bd_commission_settlements` com importadora, mês, valor, data, observação, quem marcou; auditado; desfazer com motivo). Exportar CSV.
- Texto claro: "Controle manual: o sistema calcula, a cobrança é feita por você."

**Aceite:** cálculo em centavos com arredondamento definido e testado; mudar o percentual não altera pedido já pago; mês fechado não muda quando chega pedido novo de outro mês; a importadora nunca vê esta tela.
**Testes:** `tests/bras-comissoes.test.ts` (cálculo, congelamento, fechamento, desfazer, CSV, permissão), e2e do Estúdio.

### N7. Comprovante de retirada e romaneio para a importadora
**Por quê:** a retirada é pela transportadora do cliente. O motorista precisa de um papel; a importadora precisa saber o que separar, **sem** ver o cliente.

**Entregar:**
- Código de retirada por pedido (curto, legível, único, gerado ao confirmar; ex.: `BD-7KQ4`), mostrado ao membro a partir de Confirmado.
- `/meu-bras/pedidos/[id]/retirada`: página para imprimir ou mandar ao motorista (código, caixas, produto, endereço da importadora quando confirmado, orientações). Só o dono do pedido abre (teste de isolamento).
- No Estúdio, "Romaneio" por importadora e dia: pedidos Pagos daquela importadora com **apenas** `brasShippingView` + código + caixas; página de impressão e "copiar texto para o WhatsApp da importadora". Nenhum dado do membro além do envio.

**Aceite:** outro membro recebe 404; o romaneio passa no teste de chaves (só os campos permitidos); impressão limpa (CSS de impressão).
**Testes:** domínio (código único, isolamento, campos do romaneio), e2e (membro imprime, Estúdio gera romaneio).

### N8. Membros: busca, filtro, detalhe e exportação
**Entregar:** na tela Membros do Estúdio, busca por empresa, CNPJ (com ou sem máscara) ou e-mail; filtros (ativos, bloqueados, com pedido, sem pedido, origem); gaveta de detalhe (dados da empresa, aceite dos termos, origem, pedidos, acesso à análise, histórico de bloqueio); exportar CSV (com aviso: contém dados pessoais, uso interno). Paginação simples.
**Aceite e testes:** domínio da busca (CNPJ com máscara acha), permissão (só Master), CSV sem campo sensível além do necessário; e2e.

### N9. Meu Brás: início mais útil
**Entregar:** no Início do membro, "Novas descobertas" (desde o último acesso; gravar `last_seen_at` em `bd_members`), "Seus pedidos em andamento" com a próxima etapa em palavras ("Aguardando a equipe confirmar", "Pagamento combinado com a equipe", "Pronto para a sua transportadora retirar"), atalho para "Minha empresa" quando faltar dado, e o aviso dos termos (N1) quando for o caso.
**Testes:** domínio (contagem de novas, próxima etapa por situação), e2e 390 px.

### N10. Balcão da importadora v1 (atrás da chave, desligado em produção)
**Por quê:** é o próximo passo de produto (relatório da Fase 0). Fica pronto e testado; o dono liga quando quiser.

**Entregar:**
- Papel `BRAS_IMPORTER` vinculado a uma `bd_importers` (tabela `bd_importer_users` ou coluna, escolha registrada). Convite pelo Master: e-mail e senha provisória (troca obrigatória no primeiro acesso), usando o login existente.
- `/balcao` (atrás de `BRAS_PANELS`, que continua **desligada** em produção): pedidos Confirmados e Pagos **só daquela importadora**, com `brasShippingView` + código de retirada + caixas; marcar "Separado" (informativo) e "Retirado" (só quando Pago; muda a situação e avisa o membro, N2).
- Testes de vazamento: a resposta do Balcão passa num teste de chaves (nenhum campo do membro), importadora A não vê pedido de B, membro e visitante recebem 403/redirect.

**Aceite:** com `BRAS_PANELS` desligada, `/balcao` não existe para ninguém; com ela ligada (só nos testes e no e2e local), o fluxo funciona.
**Pendência do dono:** decidir quando ligar `BRAS_PANELS` e quais importadoras convidar.

### N11. Endurecimento, acessibilidade e relatório (sempre por último)
- Varredura axe e 320/360/768/1440 em todas as telas da Brás (pública, cadastro, termos, `/d/[id]`, Meu Brás, Estúdio, Balcão) com `qa-visual`; corrigir o que aparecer.
- Estados vazio/erro/carregando em todas as telas novas.
- Teste "nenhum `R$` público" estendido a `/termos`, `/privacidade`, `/d/[id]` e à imagem/metadados de compartilhamento.
- Atualizar `docs/LINKS.md`, `docs/prompts/README.md` (estado deste prompt), `public/portal/bras/v3/MANIFESTO.md` se algo mudou, e o relatório da noite.

---

## 5. Ordem, tempo e corte

| Ordem | Demanda | Publica sozinha? | Migração |
|---|---|---|---|
| 1 | N1 Termos, privacidade e aceite | Sim | Sim (`bd_members`) |
| 2 | N2 E-mails e avisos | Sim | Talvez (idempotência) |
| 3 | N3 Página da descoberta `/d/[id]` | Sim | Não |
| 4 | N4 Origem do cadastro | Sim | Sim |
| 5 | N5 Agenda das descobertas | Sim | Sim |
| 6 | N6 Visão geral e comissões | Sim | Sim |
| 7 | N7 Retirada e romaneio | Sim | Sim |
| 8 | N8 Membros | Sim | Não |
| 9 | N9 Início do Meu Brás | Sim | Sim (`last_seen_at`) |
| 10 | N10 Balcão v1 | Sim, com a chave **desligada** | Sim |
| 11 | N11 Endurecimento e relatório | Sim | Não |

**Corte:** prefira entregar 6 demandas impecáveis a 11 pela metade. Uma demanda só conta como entregue quando passou a bateria, foi publicada e conferida no ar. Agrupe migrações de demandas próximas quando fizer sentido, mas nunca publique migração sem a tela/regra que a usa testada.

---

## 6. Glossário e tom (textos da interface)

- **Membro** (não "cliente" nem "usuário"); **empresa**; **descoberta** (o achado em vídeo); **análise** / **análise completa**; **veredito** e **nota**; **caixa fechada**; **pedido**; **importadora** (não "fornecedor"); **retirada**; **transportadora**; **equipe da Brás Digital**.
- Situações do pedido: **Recebido, Confirmado, Pago, Retirado, Cancelado** (`BRAS_REQUEST_LABEL`).
- Tom: direto, de atacadista para atacadista, sem exagero e sem promessa de ganho. Frases curtas. Botões com verbo ("Pedir caixas", "Marcar como recebida", "Copiar link").
- Português do Brasil com acentos; datas "qui, 10/10 às 18:00"; dinheiro com `formatBRL`.

---

## 7. Itens `[CONFIRMAR]` conhecidos (não invente; registre)

1. Revisão jurídica dos termos e da política (N1).
2. Dados da controladora (razão social, CNPJ, endereço, e-mail do encarregado) para a política (N1).
3. E-mails da equipe que recebem avisos (`bras.team_emails`), padrão `MASTER_EMAIL` (N2).
4. Percentual de comissão padrão e por importadora (N6): o sistema nasce com 0% e o dono preenche; nada é cobrado.
5. Meta semanal de descobertas (N5): padrão 4, decisão do dono de 2026-10-08.
6. `BRAS_WHATSAPP`, as 4 fotos do manifesto, a logo oficial da Brás (o pacote de marcas não tem).
7. Quando ligar `BRAS_PANELS` (N10).
8. Consulta da marca "Brás Digital" no INPI.

---

## 8. Relatório da manhã (obrigatório)

Arquivo `docs/relatorios/BD-RELATORIO-NOITE-2026-10-09.md`, no formato:

```
# Brás Digital: o que foi feito na noite de 2026-10-09
## Em 5 linhas (para o dono)
## Entregue e no ar (uma linha por demanda: o que mudou para quem usa, decisão Dxx, commit)
## Ficou para depois e por quê
## O que depende de você (lista curta, em ordem de importância)
## Verificação (tipos, estilo, testes: N passaram; build; e2e; capturas examinadas)
## Riscos e dívidas
## Próximo passo recomendado
```

Ao final, avise o dono em português simples, sem jargão: o que ficou pronto, o que ele precisa fazer e o próximo passo.
