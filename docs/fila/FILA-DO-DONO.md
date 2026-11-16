# Fila do dono

Pontos que o dono pediu para não esquecer. Cada item entra assim que ele fala, com a data. Ao concluir, marque `[x]` e cite a decisão (Dnnn).

## Checklist do dono (só você consegue fazer)

> Pedido do dono (13/11/2026): tudo o que depende dele fica aqui, em ordem de prioridade, e o Claude manda este checklist todo dia de manhã. Ao fazer, avise na conversa; o Claude confere e marca `[x]`.

**Urgente (destrava o que já está no ar)**
- [ ] **Token da caixa de e-mail (D296):** na Hostinger, E-mails → Correio Agêntico → Acesso à API → criar token; colar no Render como `HOSTINGER_MAIL_TOKEN` (nunca no chat). Liga a Caixa de entrada do Master.
- [ ] **Aviso de e-mail novo (D300), depois do token:** na Hostinger, Correio Agêntico → Webhooks → criar com o endereço `https://nextlevelcommerce.com.br/api/webhooks/hostinger-mail` e o evento "message.received"; colar o segredo que ela mostrar no Render como `HOSTINGER_MAIL_WEBHOOK_SECRET`. (Sem isso, os e-mails entram no Atendimento quando você abre a tela.)
- [ ] **Limite de US$ 0 no GitHub:** empresa nextlevelgroup → Faturamento e licenciamento → Budgets → US$ 0 para Actions (nada cobrado por fora).
- [ ] **Parcela do Anderson (16/11):** quando ele avisar "Já fiz o Pix", conferir no banco e confirmar em Master → Contratos.

**Com data**
- [ ] **Até 12/12/2026: teste do GitHub Enterprise** termina. Decidir: cancelar (recomendado, se os alertas de segurança já tiverem sido tratados) ou pagar.
- [ ] **Até 12/12/2026: teste do e-mail da Hostinger** termina. Renovar o plano (as 5 caixas e apelidos dependem dele).
- [ ] **A partir de 27/11: DMARC mais rígido** (D289): na Hostinger, DNS, `_dmarc` de `p=none` para `p=quarantine`.

**Quando puder**
- [ ] **Google Search Console e Bing:** cadastrar `nextlevelcommerce.com.br` (registro TXT na Hostinger) e pedir a mudança de endereço.
- [ ] **Logos da NextLevel Commerce** (D288): gerar no GPT com os prompts de `docs/marcas/nextlevel-commerce-logo-racional.md` e mandar aqui.
- [ ] **Código de segurança pelo aplicativo:** ligar o aplicativo autenticador na sua conta e na da equipe; depois o Claude liga `MASTER_2FA_OBRIGATORIO=1`.
- [ ] **Ler o texto dos termos de uso** (D279), no ar desde 12/11.
- [ ] **Render:** remover `superdrop.com.br` (D287) e os domínios `hubcreators` e `brasdigitalclub`; apagar o DNS de `bras` e `cargas`.
- [ ] **Materiais para as páginas:** prévia com semijoias, cidade da iRest e da CCV, logotipos dos clientes, um depoimento real (D282, D283); isca da janela de saída (D280); materiais e QR codes com o domínio novo.

## Fila do Claude (o Claude faz, sem depender do dono)

- [ ] **Alertas de segurança das dependências:** o GitHub achou 23 (2 críticos, 5 altos) na organização nova; tratar numa rodada própria.
- [ ] **Busca e IA:** seguir o plano depois da S0 (D293).

## Ideias e pendências antigas

- [x] **Domínio novo `nextlevelcommerce.com.br`** (D287, no ar em 13/11) (11/11/2026): ligar no Render e no registro.br, depois trocar o endereço principal da E-commerce (passo a passo em `docs/infra/DOMINIO-NOVO-ECOMMERCE.md`, código pronto no D281).
- [x] **Lembrete das parcelas do contrato** (D284) (sugerido em 11/11/2026): e-mail ao cliente 2 dias antes e no dia; aviso ao dono quando vencer sem "Já fiz o Pix". O restante do Anderson vence em 16/11.
- [x] **Endereço padrão do domínio próprio dos lojistas** (D284) (pendência antiga): o código ainda cai no serviço de Treino se a configuração do Render sumir (`src/lib/domain/dominio-proprio.ts`).
- [x] **E-mail de verdade (Resend)** (D285, no ar em 12/11): o dono adiciona o domínio no Resend e manda o print do DNS; depois `RESEND_API_KEY` (o dono cola no Render), `EMAIL_FROM` e `EMAIL_REPLY_TO`.
- [ ] **Ler o texto dos termos de uso (D279):** já está no ar desde 12/11; se mudar algo, sai uma versão nova e todos aceitam de novo.
- [ ] **Isca da janela de saída (D280)**: se o dono tiver um material (por exemplo, um guia "Como montar sua loja em 1 dia"), trocar a oferta da janela por ele.

- [ ] **Temas para Nuvemshop e Nossos clientes (D282, D283), no ar:** o que falta é opcional. O dono manda:
  - a prévia com semijoias;
  - a cidade da iRest e da CCV;
  - os logotipos dos clientes;
  - um depoimento real.

  Quando um cliente migrar para a plataforma, ligar o selo "Na NextLevel Commerce".
- [ ] **Personalização com nome e número na camisa** (ideia vinda da Futcollection, 12/11/2026): a plataforma ainda não tem esse recurso; avaliar.
- [ ] **CT4 dos contratos:** aditivos e outros modelos (migração, marketing).
- [ ] **Série do YouTube:** vídeo 5 (o último).
- [ ] **Render:** filtros de montagem (`docs/**`, `**/*.md`); apagar os domínios `hubcreators` e `brasdigitalclub` e o banco do Treino depois de conferir.

- [ ] **Remover `superdrop.com.br` do Render** depois de uns dias sem uso (D287), e apagar o DNS de `bras` e `cargas`.
- [ ] **Google Search Console:** cadastrar `nextlevelcommerce.com.br` e pedir a mudança de endereço (plano de busca S0).
- [ ] **Materiais e QR codes** (série do YouTube, PDFs) com o domínio novo.

- [ ] **Logos da NextLevel Commerce** (D288): gerar no GPT com os prompts de `docs/marcas/nextlevel-commerce-logo-racional.md` e mandar aqui.

- [ ] **DMARC mais rígido** (D289): em 2 a 4 semanas, passar `_dmarc` de `p=none` para `p=quarantine`.
- [ ] **Correio Agêntico** (D289): a caixa de entrada no Master já está pronta (D296); falta o passo seguinte: e-mails de suporte@ virarem atendimento (webhook da Hostinger).

## Feito

- [x] Páginas Temas para Nuvemshop (D282) e Nossos clientes (D283), no ar em 12/11/2026.
- [x] Contratos no painel, Pix manual, cortesia, termos de uso e janela de saída (D276 a D280), salvos para a publicação de 11/11/2026.
