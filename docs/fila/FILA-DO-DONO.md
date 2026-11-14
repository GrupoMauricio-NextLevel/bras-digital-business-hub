# Fila do dono

Pontos que o dono pediu para não esquecer. Cada item entra assim que ele fala, com a data. Ao concluir, marque `[x]` e cite a decisão (Dnnn).

## Checklist do dono (só você consegue fazer)

> Pedido do dono (13/11/2026): tudo o que depende dele fica aqui, em ordem de prioridade, e o Claude manda este checklist todo dia de manhã. Ao fazer, avise na conversa; o Claude confere e marca `[x]`.
>
> **Lista única (pedido do dono, 14/11/2026):** esta é a única lista do que só o dono faz. Ela junta o que estava espalhado em `docs/PENDENCIAS-DO-DONO.md`, `docs/infra/RENDER-USO.md` (seção 7), `docs/nextlevel-commerce/onda-8-homologacao.md`, nas seções "o que depende do dono" dos prompts e no fim de cada conversa deste projeto. **Toda conversa nova que terminar com algo para o dono acrescenta o item aqui**, com data e de onde veio.
>
> Conferido pelo Claude em 14/11: no Render, o plano Starter, os nomes novos (`nextlevel-plataforma` e `nextlevel-treino`) e a montagem automática do treino desligada já estão feitos; o tema Ninho já está à venda. As rotinas automáticas **não** estão rodando (o GitHub chama, mas termina sem fazer nada porque falta o `CRON_SECRET`).

**Urgente (destrava o que já está no ar)**
- [ ] **Senha das rotinas automáticas (`CRON_SECRET`):** sem ela não expiram reservas, não confere pagamentos perdidos e **nada volta para a Meta**. Como: invente uma senha longa; cole no Render (`nextlevel-plataforma` → Environment) como `CRON_SECRET`; no GitHub (repositório → Settings → Secrets and variables → Actions) crie o segredo `CRON_SECRET` com o mesmo valor e a variável `APP_URL` = `https://nextlevelcommerce.com.br`. Nunca mande a senha no chat. (Onda 8, plano comercial, Meta)
- [ ] **Token da caixa de e-mail (D296):** na Hostinger, E-mails → Correio Agêntico → Acesso à API → criar token; colar no Render como `HOSTINGER_MAIL_TOKEN` (nunca no chat). Liga a Caixa de entrada do Master.
- [ ] **Número do Pixel e token da Meta (D298, D299):** colar no Master → Tráfego e campanhas → Pixel e Google, e → Retorno às plataformas. Sem isso o retorno à Meta fica parado.
- [ ] **Limite de US$ 0 no GitHub:** empresa nextlevelgroup → Faturamento e licenciamento → Budgets → US$ 0 para Actions (nada cobrado por fora).
- [ ] **Parcela do Anderson (16/11):** quando ele avisar "Já fiz o Pix", conferir no banco e confirmar em Master → Contratos.
- [ ] **Confirmar o backup do Neon:** no painel do Neon, ver se há ponto de restauração (Backup & Restore) e responder só "sim" ou "não". Destrava a correção da numeração dos pedidos (F1.1, SG3).

**Com data**
- [ ] **16/11:** parcela do Anderson (acima).
- [ ] **A partir de 27/11: DMARC mais rígido** (D289): na Hostinger, DNS, `_dmarc` de `p=none` para `p=quarantine`.
- [ ] **Até 30/11: falar com o contador** sobre o "Simples híbrido" (IBS/CBS em 2027): o prazo para cancelar a opção seria 30/11 (normas não conferidas no texto oficial; ver `reports/Programas de fomento para a NextLevel.md`).
- [ ] **Até 30/11: as 4 pendências técnicas do plano comercial:** backup do Neon (acima), credencial de teste do Mercado Pago, `CRON_SECRET` (acima) e um banco Neon separado para testes (ver "Contas e acessos").
- [ ] **Até 12/12/2026: teste do GitHub Enterprise** termina. Decidir: cancelar (recomendado, se os alertas de segurança já tiverem sido tratados) ou pagar.
- [ ] **Até 12/12/2026: teste do e-mail da Hostinger** termina. Renovar o plano (as 5 caixas e apelidos dependem dele).

**Respostas que as conversas estão esperando**
- [ ] **NextLevel Business (D297, conversa de 13/11, branch `ccr-ecbeafd1-sh4iy2`):** (1) aprova os três produtos (Business, Site e Loja) vendidos em pacotes? (2) a base do Business começa com teste grátis de poucos dias (sugestão) ou grátis para sempre com limites? (3) pode publicar a NB1 no Render (a chave `BUSINESS_V1` fica desligada)? (4) seguir para a NB2?
- [ ] **Anúncios na Meta (D299):** definir o valor da taxa de gestão para a primeira proposta; dizer se começa a TR6 (leitura dos números da Meta); rodar o teste de 3 dias a R$ 20 por dia.
- [ ] **Plano comercial (D290, branch `claude/cool-hamilton-xfcd23`, ainda não publicado):** aprovar o plano e começar pela CM0; responder as decisões 6.1 a 6.7 (contatos por dia, benefício de quem indica, quem faz os contatos…); mandar o plano e o valor do Anderson e do Bazar Prime e de onde veio o Bazar Prime.
- [ ] **Autorização dos clientes:** pedir ao Anderson e ao Bazar Prime autorização (termo simples) para usar nome e depoimento em "Nossos clientes".
- [ ] **Fábrica de conteúdo (conversa de 13/11):** aprovar a grade de formatos; escolher os nomes dos dois perfis sem rosto; definir a segunda pessoa que grava; confirmar o ManyChat; escolher onde guardar os vídeos (sugestão: R2 da Cloudflare); liberar a CF1.
- [ ] **Academia (estudo v2, 14/11, branch `claude/eloquent-ramanujan-rfizdl`):** conversar com a academia esta semana e trazer as respostas 1 a 6 da seção 15 (data da inauguração, pré-venda, quem faz o marketing, verba, quem responde os contatos, meta de alunos).
- [ ] **Segurança das dependências:** dar o "ok" para o Claude tratar os 23 alertas do GitHub (2 críticos).
- [ ] **Decisões técnicas antigas em `docs/adr/`:** ADR-0001 (pagamento e estorno), ADR-0003 (sessões e qual papel exige código de segurança primeiro), ADR-0004 (um usuário em várias lojas) e ADR-0005 (trilha de auditoria e assinatura do webhook). O Claude resume cada uma com recomendação quando você quiser decidir.

**Contas, acessos e aprovações (algumas demoram semanas: pedir logo)**
- [ ] **Meta:** pedir a verificação da empresa e a revisão do aplicativo (Instagram, para os Reels com "comente LOJA").
- [ ] **Google Ads:** pedir o token de desenvolvedor.
- [ ] **Google Search Console e Bing:** cadastrar `nextlevelcommerce.com.br` (registro TXT na Hostinger), enviar o sitemap e pedir a mudança de endereço.
- [ ] **Perfis oficiais:** mandar os links do Instagram, LinkedIn e YouTube (entram nos dados da empresa no site).
- [ ] **Advogado:** revisar o aviso de cookies e a política de privacidade.
- [ ] **Mercado Pago:** credencial de teste e o segredo de assinatura do webhook (só você gera no painel), para homologar o pagamento de ponta a ponta.
- [ ] **Neon de testes:** criar um banco separado (pode ser grátis) para o teste de dois compradores da última peça.
- [ ] **Código de segurança pelo aplicativo:** ligar o aplicativo autenticador na sua conta e na da equipe; depois o Claude liga `MASTER_2FA_OBRIGATORIO=1`.

**Render (o que sobrou da lista de 09/11)**
- [ ] **Filtro de montagem** no `nextlevel-plataforma`: Settings → Build Filters → Ignored Paths: `docs/**`, `**/*.md`, `e2e/**` (economiza minutos pagos).
- [ ] **`RENDER_API_KEY`:** Account Settings → API Keys → criar → colar no Environment do `nextlevel-plataforma` (liga o domínio próprio dos lojistas sozinho).
- [ ] **Fatura:** confirmar que o cartão foi atualizado e a fatura de outubro (US$ 6,50) foi paga.
- [ ] **Limpeza:** remover `superdrop.com.br` (D287) e os domínios `hubcreators` e `brasdigitalclub`; apagar o DNS de `bras` e `cargas`; apagar o banco do treino (`nextlevel-demo-db`), se ainda existir.

**Quando puder (materiais)**
- [ ] **Logos da NextLevel Commerce** (D288): gerar no GPT com os prompts de `docs/marcas/nextlevel-commerce-logo-racional.md` e mandar aqui (o logo do site ainda diz "NextLevel E-commerce").
- [ ] **Ler o texto dos termos de uso** (D279), no ar desde 12/11.
- [ ] **Materiais para as páginas:** prévia com semijoias, cidade da iRest e da CCV, logotipos dos clientes, um depoimento real (D282, D283); isca da janela de saída, por exemplo um guia "Como montar sua loja em 1 dia" (D280); materiais e QR codes com o domínio novo.
- [ ] **Fotos próprias por tema** (moda de marca, esportivo com camisas, casa): hoje as demonstrações reaproveitam as mesmas fotos.
- [ ] **Quando quiser ligar:** compra de etiqueta (SuperFrete/Melhor Envio: token, saldo e sua autorização de gasto real) e nota fiscal (projeto separado: certificado e provedor).

## Fila do Claude (o Claude faz, sem depender do dono)

- [ ] **Alertas de segurança das dependências:** o GitHub achou 23 (2 críticos, 5 altos) na organização nova; tratar numa rodada própria.
- [ ] **Busca e IA:** seguir o plano depois da S0 (D293).

## Ideias e pendências antigas

> Itens que dependem só do dono foram para o checklist acima (14/11/2026).

- [x] **Domínio novo `nextlevelcommerce.com.br`** (D287, no ar em 13/11) (11/11/2026): ligar no Render e no registro.br, depois trocar o endereço principal da E-commerce (passo a passo em `docs/infra/DOMINIO-NOVO-ECOMMERCE.md`, código pronto no D281).
- [x] **Lembrete das parcelas do contrato** (D284) (sugerido em 11/11/2026): e-mail ao cliente 2 dias antes e no dia; aviso ao dono quando vencer sem "Já fiz o Pix". O restante do Anderson vence em 16/11.
- [x] **Endereço padrão do domínio próprio dos lojistas** (D284) (pendência antiga): o código ainda cai no serviço de Treino se a configuração do Render sumir (`src/lib/domain/dominio-proprio.ts`).
- [x] **E-mail de verdade (Resend)** (D285, no ar em 12/11): o dono adiciona o domínio no Resend e manda o print do DNS; depois `RESEND_API_KEY` (o dono cola no Render), `EMAIL_FROM` e `EMAIL_REPLY_TO`.

- [ ] **Temas para Nuvemshop e Nossos clientes (D282, D283), no ar:** o que falta é opcional. O dono manda:
  - a prévia com semijoias;
  - a cidade da iRest e da CCV;
  - os logotipos dos clientes;
  - um depoimento real.

  Quando um cliente migrar para a plataforma, ligar o selo "Na NextLevel Commerce".
- [ ] **Personalização com nome e número na camisa** (ideia vinda da Futcollection, 12/11/2026): a plataforma ainda não tem esse recurso; avaliar.
- [ ] **CT4 dos contratos:** aditivos e outros modelos (migração, marketing).
- [ ] **Série do YouTube:** vídeo 5 (o último).

- [ ] **Correio Agêntico** (D289): a caixa de entrada no Master já está pronta (D296); falta o passo seguinte: e-mails de suporte@ virarem atendimento (webhook da Hostinger).

## Feito

- [x] Páginas Temas para Nuvemshop (D282) e Nossos clientes (D283), no ar em 12/11/2026.
- [x] Contratos no painel, Pix manual, cortesia, termos de uso e janela de saída (D276 a D280), salvos para a publicação de 11/11/2026.
