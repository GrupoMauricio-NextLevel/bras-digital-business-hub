# Agência NextLevel: contratos a 100%, clientes reais, e-mail e site com catálogo de alto nível

> **Pedido do dono (18/11/2026):** migrar o contrato do Vestiário das Lendas do Master para o Painel da Agência,
> formalizar Império Maia e Bazar Prime, deixar o setor de contratos da agência a 100%, trazer o e-mail do Master para
> a agência, editar os dados de qualquer cliente quando quiser e colocar no ar, com urgência, a página da agência
> (NextLevel Marketing Ltda) em alto nível, com catálogo de soluções, área de login para equipe e clientes, páginas de
> captura e um editor ativo dentro do painel, aproveitando ao máximo o que já existe.
>
> "Haja como dono": este documento traz o racional (Parte A), as decisões que eu tomaria (Parte B), o plano por etapas
> (Parte C) e o prompt técnico para desenvolver (Parte D). Nada foi programado ainda.
>
> Frente: `[E-commerce]` (Painel da Agência, D313 em diante). Próxima decisão livre: **D335**.

---

## Parte A: racional

### A.1 O problema em uma frase

A NextLevel Marketing Ltda vende **serviços de agência** (Loja Virtual Pronta Express, Migração Nuvemshop → NextLevel,
temas, tráfego, marketing), mas o sistema hoje só sabe formalizar e cobrar **mensalidade de marketing**. Os serviços
que mais vendem agora são **projetos com entrega** (valor fechado, sinal + restante, prazo, o que está incluso,
cortesias). Por isso o contrato do Vestiário ficou no Master (no motor da loja), e Império Maia e Bazar Prime estão
**sem contrato**, mesmo tendo pago.

### A.2 O que já existe e vamos aproveitar (nada do zero)

| Peça | Onde está | Uso nesta proposta |
|---|---|---|
| Motor de contratos do Master (texto congelado, impressão digital SHA-256, aceite com prova, PDF, parcelas sinal/restante, confirmação de Pix com lançamento no caixa) | `src/lib/domain/contratos.ts`, `src/lib/contratos/*`, tabelas `contratos` e `contrato_parcelas` (D276, D277) | Vira o **motor único**; o modelo "Loja Virtual Pronta Express" passa a valer também na agência |
| Contratos da agência (modelo mensal de marketing, aceite pelo portal do cliente, PDF, e-mail aos dois lados) | `src/lib/agencias/contratos.ts`, `contrato-modelo.ts`, tabela `agencia_contratos` (D321) | Ganha modelos, origem, parcelas e a tela própria |
| Carteira de clientes com edição, importação, equipe, situação | `src/lib/agencias/clientes.ts`, `/agencia/clientes` (D313) | Edição completa e visível, e ligação com a loja do cliente (`agencia_clientes.store_id`, já existe) |
| Cobrança da agência (mensal e avulsa, Mercado Pago da agência, baixa manual, régua) | `agencia_faturas` (D318) | As **parcelas do contrato viram cobranças avulsas ligadas ao contrato** |
| Liberação de tema pela equipe (cortesia ou pago por fora) | `src/lib/themes/liberar-equipe.ts` (D329) | A cortesia do tema **Aura** aparece no contrato como bônus sem custo |
| Caixa de entrada Hostinger dentro do Master, com quem é cada remetente | `src/lib/domain/caixa-entrada.ts`, `src/lib/integrations/hostinger-mail.ts`, `/master/caixa-de-entrada` (D296) | Mesma caixa dentro da agência (a NextLevel é uma empresa só) |
| E-mails transacionais (Resend, `sendEmail`) | `src/lib/email.ts` | Contrato aceito → PDF por e-mail ao cliente e à agência (já existe na D321; estender aos modelos novos) |
| Vitrine "Soluções" com catálogo do Master, busca e formulário de diagnóstico | `src/app/(portal)/solucoes`, `src/components/portal/solucoes/*`, `nl-catalog` | Fonte do **catálogo de soluções** da página da agência (preço e nome vêm do catálogo do Master, um lugar só) |
| Home da Commerce em alto nível (herói, bento, letreiro, comparativo, galeria, integrações, planos, FAQ) | `src/components/portal/commerce/*`, `home-imersiva` | Os blocos viram **seções editáveis** da página da agência, com o texto de agência |
| Motor de Site do "Meu negócio": páginas livres com rascunho/publicado/histórico, página de campanha, serviços, formulário de orçamento com origem, editor de temas | `src/lib/business/paginas.ts`, `servicos.ts`, `modelos-site.ts`, `src/components/theme-editor/*` (D306–D309) | **A página da agência é um Site desse motor**: editor ativo no painel, landing pages de captura e formulário prontos |
| Conta "Meu negócio" da própria agência | `agencias.negocio_store_id` (D323) | É a conta que hospeda o site da agência; nada novo para criar |
| Página de captação da agência → Comercial da agência | `/orcamento/<agência>` (D322) | Ponte: formulário do site da agência entra no **Comercial da agência** |
| Portal do cliente da agência (entrada por e-mail/código, aprovar peças, contratos) | `src/lib/agencias/portal.ts` (D320) | Destino do botão "Sou cliente" da área de login |
| Endereço do painel das agências | `painel.nextlevelcommerce.com.br` (D315) | Destino do botão "Sou da equipe" |
| Site do grupo | `nextlevelgroup.com.br` (D287, D156) — hoje `/` só redireciona para `/solucoes` | A home passa a ser a **página da agência** |

**Conclusão de dono:** quase tudo existe, mas em ilhas. O trabalho inteligente é **ligar as ilhas**: um motor de
contratos, um catálogo, um caixa, um funil e um editor. Não é construir sistemas novos.

### A.3 O que está fraco hoje (sem rodeio)

1. **Contratos da agência só mensais.** Não há modelo de projeto, sinal/restante, cortesia, aditivo nem migração.
2. **Não existe a tela "Contratos" na agência.** O contrato só aparece dentro da ficha do cliente. Não há lista,
   "aguardando aceite", "pago/falta pagar" nem reenviar.
3. **Dois motores de contrato quase iguais** (Master e agência). Toda melhoria precisaria ser feita duas vezes.
4. **Dinheiro em dois lugares.** O Master tem caixa (contrato pago lança no caixa); a agência tem faturas próprias.
   Para a NextLevel Marketing, que é **uma empresa só**, isso pode contar receita duas vezes.
5. **A agência não tem caixa de e-mail.** A equipe usa a do Master; o cliente da agência não é reconhecido nela.
6. **A agência não tem site.** O site do grupo é só a vitrine `/solucoes` (boa, mas fixa no código). Não dá para editar,
   criar landing page de captura nem colocar a área de login.
7. **Nomes de produto desencontrados.** O catálogo do Master chama de "Loja Pronta Essencial/Profissional/Premium" e
   "Migração Lite/Pro"; o contrato e o dono chamam de **"Loja Virtual Pronta Express"** e **"Migração Nuvemshop →
   NextLevel"**. Cliente lê um nome no site e outro no contrato: isso gera desconfiança. Ver decisão B.7.

### A.4 Os três clientes reais (dados combinados com o dono)

| Cliente | Produto | Valor | Pagamento | Incluso | Cortesia | Situação |
|---|---|---|---|---|---|---|
| **Vestiário das Lendas** | Loja Virtual Pronta Express | o do contrato no Master | **100% pago** (o sistema já registra) | o do contrato no Master | Tema avançado liberado (D329) | Contrato **aceito no Master** → transferir para a agência |
| **Império Maia Joias e Semijoias** | **Migração Nuvemshop → NextLevel** | **R$ 500,00** | Sinal **R$ 250,00 pago em 13/11/2026**; saldo **R$ 250,00 com vencimento em 18/11/2026** | **40 produtos e 8 banners** | Tema **Aura** (R$ 299) | Sem contrato. O dono preenche os contatos e gera o contrato |
| **Bazar Prime Outlet** | Loja Virtual Pronta Express | **R$ 1.600,00** | **À vista, pago** (o dono informa a data) | **40 produtos e 8 banners** | Tema **Aura** (R$ 299) | Sem contrato. O dono insere os dados e gera o contrato |

O contrato com a **plataforma de lojas** (planos Start/Pro/Scale, termos de uso) é **outro assunto** e continua no
Master e no painel do lojista, sem mudança.

### A.5 Por que transferir o contrato do Vestiário em vez de assinar de novo

O aceite do Vestiário vale juridicamente **para aquele texto exato** (a impressão digital guarda isso). Reescrever o
contrato ou pedir outro aceite enfraquece a prova e passa uma impressão ruim ao cliente ("assinar de novo por quê?").
A contratada é a mesma empresa (NextLevel Marketing Ltda, D279). Por isso a migração **copia o contrato congelado com
a prova do aceite**, registra a origem ("veio do Master, nº LPX-…") e marca no Master "transferido para o Painel da
Agência". O PDF continua o mesmo, com a mesma impressão digital, e o cliente recebe um e-mail curto avisando que o
contrato agora aparece também no portal dele.

### A.6 Por que a página da agência deve ser um "Site" do nosso motor, e não uma página fixa no código

| Caminho | A favor | Contra |
|---|---|---|
| Página fixa no código (como `/solucoes`) | Visual livre, rápida de fazer bonita | Cada vírgula vira deploy (custa minuto de Render); sem editor; sem landing page sem programar |
| **Site do motor "Meu negócio" com seções novas no padrão da home da Commerce** | **Editor ativo no painel desde o primeiro dia**; páginas de campanha, formulário com origem, histórico de versões e SEO prontos; o mesmo trabalho melhora o produto "Sites" que vendemos aos clientes | Precisa portar os blocos da home da Commerce para seções do tema (trabalho de uma rodada) |

**Escolha:** o segundo. A página da agência vira a **vitrine do nosso próprio produto**. Tudo o que fizermos para ela
(seções de alto nível, landing pages, formulário que cai no Comercial) vira argumento de venda para o produto "Sites" e
para os Sites Express que a equipe monta. É o caminho que aproxima a E-commerce do 10º lojista pagante (regra 60/25/15).

### A.7 Riscos e como evitamos

| Risco | Como evitamos |
|---|---|
| Duplicar receita (Master + agência) | Agência **interna** (a da própria NextLevel) usa **um caixa só**: baixa na agência lança no caixa do Master pelo mesmo caminho das parcelas (D277); pagamento já registrado no Master aparece como "pago, registrado no caixa do Master" e não soma de novo (B.2) |
| Perder a prova do aceite na migração | Cópia byte a byte do conteúdo, hash e prova; teste confere `hash` igual e PDF igual |
| Migrar duas vezes | Coluna única `origem_contrato_id`; o botão é idempotente e registra auditoria |
| Mexer no SuperDrop/Brás sem querer | Tudo restrito à marca Commerce e às agências; nada no motor de lojas muda de comportamento |
| Cliente da agência ver dado de outro | Mesmo isolamento por `agencia_id` + `escopoDaAgencia`, testado no servidor |
| Site da agência quebrar o roteamento do Master | `nextlevelgroup.com.br` (grupo) e `master.nextlevelgroup.com.br` (painéis) já são separados (`host-routing.ts`); só muda o que `/` do grupo mostra |
| Custo de Render | Uma publicação por etapa; commits só de documento com `[skip render]` |

---

## Parte B: decisões (o que eu, dono, decidiria e por quê)

> Cada item traz a recomendação. O dono confirma ou muda; o que não for mudado vale como está ao começar a AGC1.

**B.1 Agência interna.** A NextLevel Marketing Ltda é marcada como `interna` no sistema. Agência interna: usa o caixa
do Master, a caixa de e-mail do Master (Hostinger), o catálogo do Master e o site do grupo. Agências externas (UPClips e
as próximas) continuam como hoje. *Por quê:* uma empresa, um caixa, um funil; nada de conciliar duas contas.

**B.2 Dinheiro conta uma vez só.**
- **Vestiário:** as parcelas entram na agência como **pagas, "registrado no caixa do Master"**. Contam no contrato e
  na ficha, **não** na receita do financeiro da agência.
- **Império e Bazar:** a baixa feita na agência **lança no caixa do Master** (mesmo caminho da confirmação de parcela,
  D277). O financeiro da agência interna lê esse lançamento; ninguém digita duas vezes.

**B.3 Contratos de serviço moram na agência daqui para frente.** O Master continua com os contratos da **plataforma**
(planos, termos). Ao criar um novo "Loja Virtual Pronta Express" no Master, a tela mostra "Contratos de serviço agora
são feitos no Painel da Agência" com o link. Os antigos podem ser trazidos pelo botão de migração.

**B.4 Contrato aceito não muda; dados do cliente mudam sempre.** O dono edita qualquer dado de qualquer cliente quando
quiser. Contrato **aceito** fica congelado (mudança só por **aditivo**, contrato novo ligado ao anterior). Contrato
**enviado e ainda não aceito** é refeito sozinho com os dados novos (e o cliente vê o texto atualizado).

**B.5 E-mail.**
- Depois do aceite: **PDF do contrato assinado por e-mail ao cliente e à agência** (já existe para o mensal; vale para
  todos os modelos). Ao enviar para aceite: e-mail com o link do portal. Contrato transferido: e-mail curto de aviso.
- **Caixa de entrada na agência** (a mesma Hostinger do Master para a agência interna), reconhecendo remetentes que são
  clientes da agência e ligando a mensagem à ficha.

**B.6 Funil.** Contatos que pedem **serviço** (site da agência, landing pages, `/solucoes`) vão para o **Comercial da
agência**. Contatos que pedem **plataforma** (planos, "quero minha loja") continuam no Comercial do Master.

**B.7 Nomes de produto (questionando a decisão antiga, como manda o CLAUDE.md).** O dono definiu os nomes para o
cliente: **"Loja Virtual Pronta Express"** e **"Migração Nuvemshop → NextLevel"**. O catálogo do Master tem outros
nomes ("Loja Pronta Essencial/Profissional/Premium", "Migração Lite/Pro").
- **Problema:** o site mostra um nome e o contrato mostra outro.
- **Proposta:** criar os dois itens no catálogo com esses nomes (preço de referência: Express R$ 1.600, Migração
  R$ 500) e deixar os antigos em rascunho, sem apagar.
- **O que muda:** o site, o contrato e o caixa passam a usar o mesmo nome e o mesmo preço de partida. O dono confirma
  antes de esconder os antigos.

**B.8 Página da agência.** `nextlevelgroup.com.br/` mostra a **home da agência** (Site editável da conta "Meu negócio"
da NextLevel Marketing). `/solucoes` continua como catálogo completo, alimentado pelo catálogo do Master, até ser
substituído por uma página do próprio site.

**B.9 Área de login.** Botão "Entrar" no topo do site da agência leva a `/entrar` com três portas:
- **Sou da equipe:** painel da agência, em `painel.nextlevelcommerce.com.br`;
- **Sou cliente da agência:** portal do cliente;
- **Tenho loja virtual:** painel do lojista, em `nextlevelcommerce.com.br/login`.

---

## Parte C: plano por etapas (ordem de dono: o que destrava dinheiro e formaliza clientes primeiro)

| Etapa | Entrega | Por que nesta ordem | Tamanho |
|---|---|---|---|
| **AGC1** | Contratos a 100%: motor único com modelos, parcelas ligadas a cobranças, tela Contratos, aditivo, e-mails, edição de clientes, **migração do Vestiário** e contratos de Império e Bazar prontos para gerar | Império tem saldo vencendo hoje; três clientes reais sem contrato formal na agência | 1 rodada (código + testes + 1 publicação) |
| **AGS1** | **Home da agência em alto nível** no `nextlevelgroup.com.br`, como Site editável: seções portadas da home da Commerce com o texto de agência, **catálogo de soluções** (do catálogo do Master), prova social, FAQ, formulário → Comercial da agência e `/entrar` | Urgente pelo dono; a vitrine da agência é a primeira impressão de quem vem dos anúncios | 1 rodada |
| **AGC2** | Agência interna: **um caixa só**, **caixa de e-mail** na agência e financeiro lendo o caixa do Master | Fecha a conta do dinheiro e a comunicação da equipe | 1 rodada curta |
| **AGS2** | **Landing pages de captura** (modelo pronto de campanha por serviço: Express, Migração, Tráfego), com origem, Pixel/etiquetas e fila no Comercial | Liga anúncio → página → contato → contrato | 1 rodada curta |
| **AGA** | **Auditoria do Painel da Agência** com prints (360/1440 px), comparando com o Master da Commerce; lista do que falta, em ordem, para o dono aprovar | Responde "o painel está fraco" com fatos, sem chute | 1 relatório |
| **AGS3** | Editor evoluído (arrastar seções livremente, blocos salvos, biblioteca de seções da agência) | Depende do uso real da AGS1/AGS2 | depois |

**Esforço por frente nesta proposta:** E-commerce 100% (Painel da Agência e Sites são da plataforma NextLevel Commerce).

---

## Parte D: prompt técnico para desenvolver

> Cole este bloco numa sessão nova do Claude Code, na branch designada. Ele é autocontido.

````text
Você vai desenvolver, no repositório NextLevel Commerce Engine (Next.js 16, React 19, TypeScript estrito, Drizzle,
Tailwind v4, Vitest, Playwright), as etapas AGC1 e AGS1 (depois AGC2, AGS2) descritas em
docs/prompts/agencia-nextlevel-contratos-site-catalogo.md. Leia antes: CLAUDE.md, AGENTS.md (o Next.js deste projeto
tem mudanças: consulte node_modules/next/dist/docs/ antes de escrever rota ou página), a Parte A e a Parte B daquele
documento, e as decisões D276, D277, D296, D306–D309, D313, D318, D320–D323, D326, D329 em docs/design/DECISIONS.md.
Fale com o dono em português, sem jargão. Próxima decisão: D335 (registre AGC1 como D335, AGS1 como D336...). Depois de
registrar, rode `node scripts/gerar-novidades.mjs` e cite a decisão em docs/conhecimento/BC0-INVENTARIO.md (senão
tests/base-conhecimento.test.ts falha). Testes enxutos durante o trabalho (tipos, lint, testes dos arquivos mexidos);
bateria completa e `npm run build` só no fim de cada etapa, antes da publicação. Uma publicação por etapa. A cada etapa,
mande ao dono prints reais (Playwright) da principal tela.

REGRAS QUE NÃO PODEM QUEBRAR
- Valores em centavos; datas ISO (AAAA-MM-DD); textos em português claro; sem promessa de resultado.
- Toda ação passa pelo domínio (src/lib/agencias/*, src/lib/domain/*) e por runAction; permissões no servidor
  (escopoDaAgencia, pode.*); uma agência nunca lê dados de outra; o cliente do portal só vê o que é dele.
- Página que consulta o banco: `export const dynamic = "force-dynamic"`.
- Migração: altere src/db/schema.ts e rode `npx drizzle-kit generate --name <assunto>`; só acrescenta (a próxima é
  0117). Nunca edite migração publicada.
- Segredo nunca em tela/log/e-mail (encryptSecret). Acessibilidade AA, sem rolagem lateral em 360 px (axe).
- Não mexa no comportamento de SuperDrop/Brás; nada de cobrança nova da plataforma; planos Start/Pro/Scale intactos.
- Reaproveite antes de criar (regra anti-duplicação do CLAUDE.md).

==========================================================================================================
ETAPA AGC1: CONTRATOS DA AGÊNCIA A 100%
==========================================================================================================

1) MOTOR ÚNICO DE CONTRATOS COM MODELOS
- Crie src/lib/contratos/modelos/ com um registro de modelos puros (dados entram, seções saem, sem banco):
  - `MENSAL_MARKETING`: mover o conteúdo de src/lib/agencias/contrato-modelo.ts (manter export antigo reexportando,
    para não quebrar imports e testes).
  - `LOJA_PRONTA_EXPRESS`: generalizar src/lib/contratos/loja-pronta-express.ts para aceitar a contratada vinda da
    agência (razão, documento, cidade do foro, Pix, banco, favorecido, representante, e-mail) em vez de só a constante
    CONTRATADA_PADRAO (que continua sendo o padrão da agência interna). Acrescente ao modelo:
      · `banners` (quantidade de banners incluídos; item no quadro "A NextLevel cuida de");
      · `cortesias`: lista [{ titulo, valorReferenciaCents?, descricao }] → seção "Cortesias (sem custo)", ex.: "Tema
        avançado Aura (valor de referência R$ 299,00), licença permanente";
      · `pagamento`: { forma: "PARCELADO_SINAL" | "A_VISTA", parcelas: [{ ordem, descricao, valorCents, vencimento,
        pagoEm?, meio? }] } — o texto descreve o que já foi pago ("sinal de R$ 250,00 pago em 13/11/2026") e o que
        falta, sem inventar data;
      · `cortesiaMeses` continua (mensalidade de plataforma), separado da cortesia de tema.
    Mantenha VERSAO_LOJA_PRONTA=1 para os contratos antigos (o texto antigo precisa continuar gerando o mesmo hash) e
    crie a versão 2 com os campos novos. Teste: hash da v1 com os dados de um contrato antigo continua idêntico.
  - `MIGRACAO_PLATAFORMA`: "Migração Nuvemshop → NextLevel" (origem configurável: Nuvemshop, Shopify, Tray, Loja
    Integrada, WooCommerce, outra). Cláusulas: objeto (migrar catálogo, clientes se exportáveis, categorias, imagens,
    redirecionamentos de endereço quando a origem permitir), o que a NextLevel faz (até N produtos, M banners,
    configuração de pagamento/envio, tema), o que o cliente fornece (acesso/exportação da plataforma de origem,
    material), valor e pagamento (mesma estrutura de parcelas), prazo (dias corridos após material e pagamento), o que
    não está incluso (mensalidade da plataforma, domínio, apps pagos da origem), desistência (sinal retido), dados
    (LGPD; acesso à plataforma antiga usado só para a migração e apagado ao fim), cortesias, aceite eletrônico, foro.
    Linguagem no padrão do Express (quadros "Como vamos trabalhar juntos?", "Em resumo:").
- Interface comum: `type ModeloContrato<D> = { chave, versao, titulo(d), pendencias(d): string[], secoes(d): Secao[],
  conferir(d): string[] }`. `impressaoDigital(dados, secoes)` continua sendo a do Express.
- PDF: src/lib/contratos/pdf.ts já tem `gerarPdfDocumento`; garanta que todos os modelos e os contratos transferidos
  saem pelo mesmo gerador (cabeçalho com a marca da agência; contratos da agência interna: "NextLevel Soluções").

2) BANCO (migração 0117_agencia_contratos_modelos, só acrescenta)
- agencia_contratos: `modelo` text not null default 'MENSAL_MARKETING'; `versao_modelo` int not null default 1;
  `origem` text not null default 'AGENCIA' (enum AGENCIA | MASTER); `origem_contrato_id` text unique references
  contratos.id; `aditivo_de_id` text references agencia_contratos.id; `aceito_hash` text; `aceito_por` text (usuário,
  quando o aceite veio do painel do lojista); `email_aceite_enviado_em` timestamp; `valor_total_cents` int (projeto).
- agencia_faturas: `contrato_id` text references agencia_contratos.id; `parcela` int; `pago_meio` text (PIX,
  DINHEIRO, TRANSFERENCIA, CARTAO, MERCADO_PAGO, OUTRO); `registrado_no_master` boolean not null default false;
  `caixa_lancamento_id` text. Índice único parcial (contrato_id, parcela) where contrato_id is not null.
  Parcela de contrato é sempre `avulsa = true` (não ocupa a vaga da mensalidade).
- agencias: `interna` boolean not null default false (B.1). Marque a NextLevel Marketing pelo Master → Agências
  (chave nova "Agência interna (a própria NextLevel)", só NEXTLEVEL_MASTER; no máximo uma agência interna).
- contratos (Master): `transferido_em` timestamp; `transferido_para` text (id do agencia_contrato).

3) DOMÍNIO (src/lib/agencias/contratos.ts e arquivo novo src/lib/agencias/contratos-projeto.ts)
- `opcoesSchema` vira união discriminada por `modelo`. Para projeto: produto (do catálogo, ver item 7), valorCheio,
  valor, produtos, banners, prazoDias, cortesiaMeses, cortesias, pagamento (parcelas com pagoEm/meio opcionais),
  origemPlataforma (migração), extras.
- `previaDoContrato` / `enviarContrato` aceitam qualquer modelo; `pendencias` por modelo (CPF/CNPJ e e-mail do cliente
  continuam obrigatórios para enviar; para gerar a PRÉVIA não).
- Ao enviar contrato de projeto: cria as cobranças (agencia_faturas avulsas, uma por parcela, `contrato_id`,
  `parcela`). Parcela informada como paga nasce `PAGA`, `pago_como = MANUAL`, `pago_meio`, `pago_em`; na agência
  interna, lança no caixa do Master pelo mesmo serviço usado na confirmação de parcela do Master (procure em
  src/lib/domain/contratos.ts a confirmação que grava `caixa_lancamento_id` e extraia uma função comum; não duplique).
- Baixa manual de parcela pela tela Contratos e pela ficha: "Recebi por fora" (data, meio, valor, observação) →
  mesma regra acima. Desfazer baixa só para ADMIN, com motivo, e estorna o lançamento do caixa.
- Aceite (portal): grava `aceito_hash` (= hash), prova, marca onboarding e, em seguida, envia por e-mail o PDF do
  contrato assinado ao cliente e à agência (reaproveite o envio da D321; estenda a todos os modelos) e grava
  `email_aceite_enviado_em`. Botão "Reenviar PDF por e-mail" na tela do contrato.
- Aditivo: `criarAditivo(contratoId)` abre a prévia do mesmo modelo com os dados atuais; ao enviar, nasce com
  `aditivo_de_id`; quando aceito, o anterior mostra "substituído pelo aditivo nº …" (o anterior não muda de texto).
- Cancelar: só ENVIADO (como hoje) ou, para ACEITO, "Encerrar contrato" com motivo (não apaga nada; cobranças abertas
  são canceladas, pagas ficam).
- Contrato ENVIADO e não aceito é regenerado quando os dados da ficha mudam (B.4): `atualizarCliente` chama
  `regerarContratosPendentes(clienteId)`, que recalcula seções e hash; contrato ACEITO nunca é tocado (teste).

4) MIGRAÇÃO DO MASTER → AGÊNCIA (src/lib/agencias/migrar-contrato-master.ts)
- `listarContratosParaTrazer(db, actor)`: só agência interna, só ADMIN; contratos do Master (`contratos`) ACEITOS ou
  ENVIADOS, sem `transferido_em`, de modelo de serviço (LOJA_PRONTA_EXPRESS), com o nome da loja e do cliente.
- `trazerContratoDoMaster(db, actor, contratoId)`: em transação,
  a) acha ou cria o agencia_cliente pelo `store_id` da loja (nome da loja/empresa, e-mail e documento do `dados`
     congelado, contato = nome do dono da loja, `store_id` ligado, situação ATIVO, pacote "Loja Virtual Pronta
     Express");
  b) cria agencia_contratos com `modelo`/`versao_modelo` do original, `origem = MASTER`, `origem_contrato_id`,
     `numero` IGUAL ao original, `titulo`, `dados`, `conteudo`, `hash`, `status`, `enviado_em`, `enviado_por`,
     `aceito_*` copiados (aceito_email = e-mail do usuário que aceitou; `aceito_por` = id do usuário), sem alterar
     um caractere do conteúdo;
  c) copia as parcelas (`contrato_parcelas`) para agencia_faturas avulsas ligadas ao contrato: PAGA → `PAGA`,
     `pago_em = confirmado_em`, `registrado_no_master = true`, `caixa_lancamento_id` copiado; ABERTA/AVISADA →
     ABERTA (a confirmação passa a ser feita na agência);
  d) marca o original: `transferido_em`, `transferido_para`; recordAudit nos dois lados
     (AGENCIA_CONTRATO_TRAZIDO_DO_MASTER / CONTRATO_TRANSFERIDO_PARA_AGENCIA);
  e) envia ao cliente um e-mail curto: "Seu contrato nº … agora também aparece no portal da NextLevel Soluções", com
     o link do portal e o PDF anexo (mesmo hash).
  Idempotente: segunda chamada devolve o contrato já trazido (único por origem_contrato_id). Recusa se a agência não
  for interna, se o contrato não for de serviço, se a pessoa não for ADMIN.
- Portal do cliente: o contrato transferido aparece como "Aceito em dd/mm/aaaa (no painel da loja)".
- Master → Contratos: contrato transferido mostra o selo "Transferido para o Painel da Agência" com o link; sai dos
  filtros de pendência; PDF e detalhe continuam abrindo. O formulário de novo contrato "Loja Virtual Pronta Express"
  mostra o aviso da B.3 com o link para a agência (não bloqueia, só orienta).
- Receita: agencia_faturas com `registrado_no_master = true` ficam fora da receita e do "a receber" do Financeiro e do
  Crescimento da agência (mostre como "pago · registrado no caixa do Master"). Teste.

5) TELA "CONTRATOS" NA AGÊNCIA (/agencia/contratos)
- Nova entrada no menu (src/lib/nav.ts, grupo "Clientes", depois de "Clientes"; atualize tests/nav-agencia.test.ts),
  só para quem `pode.editarContrato` (ADMIN, FINANCEIRO).
- Números no topo (cartões `Kpi` reaproveitados): aguardando aceite, aceitos no mês, valor contratado em projetos no
  mês, a receber de contratos.
- Lista com filtros (Todos, Aguardando aceite, Aceitos, Com parcela aberta, Encerrados/Cancelados, Transferidos do
  Master), busca por cliente/número, colunas: número, cliente, modelo, valor, pago/falta (barra), situação, data.
- Detalhe /agencia/contratos/[id]: texto congelado (componente src/components/agencia/texto-contrato.tsx), prova do
  aceite, parcelas com "Recebi por fora", "Copiar link do portal", "Mandar no WhatsApp" (mensagem pronta, wa.me),
  "Reenviar por e-mail", "Baixar PDF", "Fazer aditivo", "Encerrar".
- "Novo contrato" (na tela e na ficha do cliente): passo 1 escolhe o cliente (ou cria um rápido), passo 2 escolhe o
  produto do catálogo (item 7) → modelo e valor pré-preenchidos, passo 3 ajusta (produtos, banners, prazo, parcelas
  já pagas, cortesias com atalho "Tema liberado" que lista os temas liberados à loja do cliente pela D329), passo 4
  prévia do texto exato com as pendências em destaque, passo 5 enviar (ou "Salvar como rascunho" — novo status
  `RASCUNHO`, se necessário acrescente ao enum; rascunho não tem hash fixo nem aparece ao cliente).
- Fila do dia da agência (`cockpitDaAgencia`): "Contratos aguardando aceite há mais de 2 dias", "Parcela de contrato
  vence hoje" (ex.: Império, 18/11), "Cliente ativo sem contrato".

6) CLIENTES: EDITAR SEMPRE (pedido do dono: "em todos os clientes quero a função de editar os dados quando eu quiser")
- O formulário "Editar cliente" já existe (src/app/agencia/clientes/[id]/ficha-cliente.tsx). Torne-o visível no topo
  da ficha (botão "Editar dados" fixo) e na lista (menu "…" → "Editar dados" abrindo a gaveta), com todos os campos:
  nome, razão social (novo campo opcional `razao_social`), CPF/CNPJ, contato, WhatsApp, e-mail, endereço (novo campo
  opcional jsonb `endereco`: rua, número, bairro, cidade, UF, CEP — o contrato de projeto usa quando houver), segmento,
  pacote, incluso, valor, vencimento, início, responsável, observações, "ligar à loja na plataforma" (busca de lojas
  da Commerce pelo nome/slug, só agência interna) e exige aprovação.
- ADMIN edita tudo, sempre. Edição registra auditoria com antes/depois. Teste: editar depois de contrato aceito não
  muda o contrato aceito; contrato enviado é regenerado.

7) CATÁLOGO COMO FONTE DO PRODUTO DO CONTRATO
- Agência interna: o passo "produto" lista os itens do catálogo do Master das famílias de serviço (FAMILIAS_SERVICO em
  src/lib/finance/caixa-regras.ts: LOJA_PRONTA, MIGRACAO, MARKETING, CONSULTORIA, ADDON, ADS) e TEMA, com o preço
  vigente (listCatalog / getPriceBook). Cada item mapeia para um modelo (LOJA_PRONTA → LOJA_PRONTA_EXPRESS, MIGRACAO
  → MIGRACAO_PLATAFORMA, MARKETING → MENSAL_MARKETING; os demais → LOJA_PRONTA_EXPRESS com objeto livre só depois de
  o dono aprovar um modelo "Serviço avulso").
- Seed/ajuste (B.7, só depois do dono confirmar; até lá, apenas proponha): itens "Loja Virtual Pronta Express"
  (one_time, R$ 1.600, 40 produtos, 8 banners) e "Migração Nuvemshop → NextLevel" (one_time, R$ 500, 40 produtos, 8
  banners). Não apague os antigos.
- Agência externa: produto livre (nome + modelo), como hoje.

8) OS TRÊS CLIENTES REAIS (dados de produção: NÃO grave por script no banco do Render/Neon; tudo pelo painel)
- Vestiário das Lendas: botão "Trazer contratos do Master" (Contratos → "Trazer do Master", lista do item 4). O dono
  clica; o sistema faz a migração. Conferir no e2e de demonstração com um contrato semelhante.
- Império Maia Joias e Semijoias: o dono cadastra o cliente (contatos depois) e usa "Novo contrato" → "Migração
  Nuvemshop → NextLevel", R$ 500,00, 40 produtos, 8 banners, sinal R$ 250,00 PAGO em 2026-11-13 (Pix), saldo
  R$ 250,00 com vencimento 2026-11-18, cortesia "Tema avançado Aura (valor de referência R$ 299,00)". A prévia funciona
  sem e-mail/CPF; o envio pede os dois.
- Bazar Prime Outlet: "Novo contrato" → "Loja Virtual Pronta Express", R$ 1.600,00 à vista PAGO (data informada pelo
  dono), 40 produtos, 8 banners, cortesia "Tema avançado Aura".
- Crie na demonstração (seed da agência de demonstração ou do e2e) três casos espelho com nomes fictícios para os
  testes e prints; nunca use os nomes reais em seed.

9) TESTES (Vitest) — tests/agencias-contratos-projeto.test.ts e tests/agencias-migrar-contrato.test.ts
- Modelos puros: seções e pendências de cada modelo; Express v1 com dados antigos gera hash idêntico ao gravado;
  migração com parcelas pagas e a vencer; cortesia aparece; à vista vs sinal.
- Envio de projeto cria as cobranças certas; parcela paga nasce paga; na agência interna lança no caixa uma vez só;
  agência externa não toca o caixa do Master.
- Migração: copia conteúdo e hash sem alteração; prova do aceite preservada; idempotente; recusa sem ADMIN/não
  interna; marca o original; parcelas `registrado_no_master` fora da receita.
- Aceite no portal envia e-mail com PDF (mock do sendEmail) e grava `email_aceite_enviado_em`.
- Editar cliente regenera contrato ENVIADO e não toca ACEITO.
- Isolamento: outra agência não lista, não traz, não vê; cliente do portal só vê os próprios.
- e2e: e2e/agencias-contratos-projeto.mjs (360 e 1440 px, axe): novo contrato de migração com sinal pago → prévia →
  enviar → aceitar no portal → e-mail registrado → tela Contratos com "pago 50%"; trazer do Master; prints para o dono.

10) DOCUMENTOS
- D335 em DECISIONS.md ("[E-commerce] Contratos da agência a 100%: modelos de projeto, parcelas, tela Contratos,
  aditivo, e-mail e migração do Master"), base de conhecimento, `node scripts/gerar-novidades.mjs`, e as tarefas do
  dono no fim: marcar a NextLevel Marketing como agência interna; trazer o contrato do Vestiário; preencher contatos
  da Império e gerar; preencher dados do Bazar e gerar.

==========================================================================================================
ETAPA AGS1: PÁGINA DA AGÊNCIA EM ALTO NÍVEL, COM CATÁLOGO, LOGIN E EDITOR ATIVO
==========================================================================================================

Princípio: a página da agência é um SITE do motor "Meu negócio" (D306–D309) da conta ligada em
agencias.negocio_store_id (D323). O editor de temas (src/components/theme-editor/*) é o editor ativo. Nada de página
fixa nova no código: o que for bonito vira SEÇÃO reutilizável (vale para os clientes de Sites também).

1) FAMÍLIA DE TEMA "AGÊNCIA" (src/lib/themes)
- Nova família `agencia` (nível 4, seções reorganizáveis, uso interno: `release: "internal"` ou equivalente que não
  apareça na loja de temas até o dono decidir vender), com tokens herdados de src/components/portal/commerce/
  commerce.css e tech.css (cores, tipografia de fontes-ec.ts, cantos, sombras), modo claro/escuro.
- Seções novas, cada uma portando um bloco já pronto da home da Commerce (mesma marcação/estilo; conteúdo vindo das
  configurações da seção, editável no painel):
  · `heroi-agencia` ← hero-v2.tsx / heroi-nextlevel.tsx (título com palavra girando — rotating-word.tsx —, texto,
    dois botões, imagem/vídeo, selos);
  · `faixa-logos` ← marquee.tsx (logos de clientes; imagens da biblioteca);
  · `bento-solucoes` ← bento.tsx (cartões de serviço com ícone, texto e link);
  · `catalogo-solucoes` ← vitrine-v2.tsx/busca-solucoes.tsx: LÊ o catálogo do Master (listCatalog, famílias de
    serviço + TEMA), com filtro por etapa (Fundação, Lançamento, Aquisição, Otimização, Escala), "a partir de", prazo
    e botão "Quero este" → formulário com o serviço escolhido. Configurável: famílias visíveis, destaque, ordem. Preço
    e nome nunca digitados na seção (um lugar só: o catálogo).
  · `processo` ← how-it-works.tsx (passo a passo);
  · `vitrine-trabalhos` ← store-gallery.tsx / theme-gallery.tsx (lojas e sites entregues: imagem, nome, link; usa a
    seção "Trabalhos realizados" da NB2 como dado);
  · `comparativo` ← comparativo.tsx (antes/depois ou nós × fazer sozinho), sem promessa de ganho;
  · `depoimentos` (texto + nome + empresa + foto; marcar "depoimento real" é obrigação do editor);
  · `faq` ← content.ts FAQ (perguntas editáveis);
  · `cta-final` ← sections.tsx (faixa de chamada com WhatsApp e formulário);
  · reaproveite as seções existentes "Serviços", "Contato, endereço e horário" e "Formulário de orçamento" (D307/D309).
- Modelo de site pronto "Agência de soluções digitais" (src/lib/business/modelos-site.ts): Início (heroi, logos,
  bento, catálogo, processo, trabalhos, comparativo, depoimentos, faq, cta), Soluções (catálogo completo), Sobre,
  Contato, e as páginas de campanha da AGS2. Textos iniciais com a copy de "Soluções Digitais e serviços de agência"
  (loja virtual pronta, migração, temas, tráfego, marketing, sistemas sob medida, white label), escritos em português
  claro, sem promessa de resultado, com a marca NextLevel (getBrand/NL), CNPJ e razão social no rodapé (D279).
- Desempenho: imagens AVIF/WebP (src/lib/themes/avif.ts), LCP < 2,5 s no celular, sem bloquear com animação
  (reveal.tsx com prefers-reduced-motion). Use a skill `pagina-de-vendas` e `desempenho` para a conferência.

2) ENDEREÇO (src/lib/host-routing.ts)
- No host do grupo (`GROUP_SITE_URL`, nextlevelgroup.com.br), `/` hoje redireciona para /solucoes. Passe a SERVIR o
  site da agência interna: variável nova `GROUP_SITE_AGENCIA=<slug da conta Meu negócio da agência interna>` (ou
  leitura da agência `interna` no banco com cache curto); `/` e as páginas publicadas do site (paginas_site) abrem lá
  por rewrite interno para a vitrine `/store/<slug>/...`. Sem a variável, comportamento atual (reversão segura).
- `/solucoes`, `/solucoes/*`, `/loja-nextlevel/*`, termos e privacidade do grupo continuam como estão.
- SEO: canônico no domínio do grupo, sitemap do site incluído no do grupo, JSON-LD Organization (NextLevel Marketing
  Ltda, CNPJ 51.392.006/0001-92), metadados por página.
- Teste em tests/host-routing.test.ts.

3) ÁREA DE LOGIN (/entrar no host do grupo)
- Página simples, no visual da família `agencia`, com três portas (B.9): "Sou da equipe" → AGENCIAS_URL/login (D315);
  "Sou cliente da agência" → portal do cliente (D320: entrada por e-mail/código); "Tenho loja virtual" → login da
  Commerce. Botão "Entrar" no cabeçalho do site da agência (opção do cabeçalho da família, ligada por padrão).
- Sem sessão nova, sem cadastro novo: só portas para o que existe.

4) FORMULÁRIO → COMERCIAL DA AGÊNCIA (B.6)
- Quando a conta do site for `agencias.negocio_store_id` de uma agência, o envio do formulário de orçamento (D309)
  cria TAMBÉM a oportunidade no Comercial da agência pelo mesmo caminho da página de captação (D322: canal, etiquetas,
  página, serviço, chave do envio única, aviso por e-mail e fila do dia). Uma função só (`registrarPedidoDaAgencia`),
  chamada pelos dois. Teste de duplicidade e de origem.
- /solucoes (diagnóstico) na agência interna: o lead de serviço passa a cair no Comercial da agência; lead de plano
  continua no Master (B.6). Atrás de chave `SOLUCOES_PARA_AGENCIA=true` até o dono conferir.

5) EDITOR ATIVO NO PAINEL DA AGÊNCIA
- Nova gaveta "Site e páginas" no menu da agência (grupo "Crescer"), para ADMIN, GESTOR e quem tiver permissão nova
  `editarSite`: atalhos para Site → Páginas, Serviços, "Editar o site" (abre o editor de temas da conta ligada, no modo
  suporte já existente da D329, sem o menu do lojista), "Ver no ar", "Criar página de captura" (AGS2) e "Usar o modelo
  Agência". Se a agência ainda não tiver conta ligada: botão "Criar o site da agência" (usa a D323 e aplica o modelo).
- A conta do site da agência interna recebe a liberação `EDITOR_COMPLETO` (D329) por cortesia, registrada.

6) TESTES E CONFERÊNCIA
- tests/business-site.test.ts (modelo novo, seções novas com dados vazios não quebram), tests/agencias-site.test.ts
  (gaveta, permissões, criar site, formulário → Comercial), host-routing.
- e2e/agencia-site.mjs: home no host do grupo (360/768/1440, axe, sem rolagem lateral), catálogo com preço do Master,
  "Quero este" → formulário → aparece no Comercial da agência, /entrar com as três portas, editar um título no editor e
  ver publicado. Prints para o dono (skill qa-visual).
- D336 em DECISIONS.md e base de conhecimento.

==========================================================================================================
ETAPA AGC2 (curta): AGÊNCIA INTERNA COM CAIXA ÚNICO E CAIXA DE E-MAIL
==========================================================================================================
- Financeiro da agência interna lê receitas do caixa do Master (lançamentos ligados às cobranças da agência) e não
  soma `registrado_no_master` duas vezes; despesas continuam na agência (D319). Teste de conciliação.
- /agencia/caixa-de-entrada: reaproveite src/lib/domain/caixa-entrada.ts e a tela do Master (componentes extraídos
  para src/components/caixa-entrada/*, usados pelas duas telas). Agência interna usa a mesma caixa Hostinger
  (HOSTINGER_MAIL_TOKEN). Remetente reconhecido como cliente da agência (pelo e-mail da ficha) → selo "Cliente" e link
  para a ficha; "Salvar como contato" → oportunidade no Comercial da agência. Agências externas: tela com "Ligar sua
  caixa de e-mail" (fica para depois; token próprio criptografado). Permissão: ADMIN, ATENDIMENTO, GESTOR.
- E-mails transacionais da agência interna saem com o remetente e a assinatura da "NextLevel Soluções"
  (EMAIL_FROM/REPLY_TO por agência quando houver; padrão o do Master).

==========================================================================================================
ETAPA AGS2 (curta): LANDING PAGES DE CAPTURA
==========================================================================================================
- Tipo de página "Campanha" (D307) com modelos prontos por serviço: "Loja Virtual Pronta Express", "Migração
  Nuvemshop → NextLevel", "Tráfego pago", "Site para empresa". Cada um: herói, dor → solução, o que está incluso
  (lido do catálogo), processo, prova, FAQ, formulário com o serviço já marcado; sem menu (foco), fora do sitemap.
- "Copiar link com etiquetas" (utm_* e lp=) como na D322; Pixel/eventos de Lead quando a Rodada A de integrações
  existir (docs/prompts/integracoes-aplicativos-fila.md).
- Painel: por página, visitas e contatos (contatos_negocio/oportunidades por `pagina`), na gaveta "Site e páginas".

FIM DE CADA ETAPA
- Tipos (`npx tsc --noEmit`), lint (`npx eslint src e2e tests`), testes das áreas mexidas, bateria completa e
  `npm run build` (sem "Export encountered"), commit em português, `git push -u origin <branch>`, conferir o site no
  ar e mandar os prints ao dono com o resumo em português simples e a linha "Esforço do dia por frente".
````

---

## Parte E: o que o dono faz depois de cada etapa

**Depois da AGC1:**
1. Master → Agências → NextLevel Marketing → ligar "Agência interna".
2. Agência → Contratos → "Trazer do Master" → Vestiário das Lendas → confirmar.
3. Agência → Clientes → Império Maia → "Editar dados" (CPF/CNPJ, e-mail, WhatsApp) → "Novo contrato" → Migração
   Nuvemshop → NextLevel → conferir a prévia → Enviar. Quando o saldo de R$ 250,00 cair, "Recebi por fora" na
   parcela 2.
4. Agência → Clientes → Bazar Prime → dados → "Novo contrato" → Loja Virtual Pronta Express → à vista pago → Enviar.
5. Depois do aceite de cada cliente, o PDF assinado chega por e-mail aos dois lados.

**Depois da AGS1:**
1. No Render: `GROUP_SITE_AGENCIA=<slug>` (a equipe passa o valor).
2. Agência → Site e páginas → revisar textos e fotos no editor → Publicar.
3. Mandar fotos reais (equipe, trabalhos entregues, logos de clientes que autorizaram) para trocar as ilustrações.

## Parte F: pontos para o dono confirmar (ficam valendo as recomendações se não houver resposta)

1. **B.2 (dinheiro uma vez só):** recomendação aceita?
2. **B.7 (nomes no catálogo):** criar "Loja Virtual Pronta Express" (R$ 1.600) e "Migração Nuvemshop → NextLevel"
   (R$ 500) e esconder os nomes antigos do site?
3. **B.6 (funil):** os pedidos de serviço do `/solucoes` passam para o Comercial da agência?
4. **Prazo de entrega** padrão do Express e da Migração (sugestão: 10 e 7 dias corridos depois de pagamento e
   material).
5. **Depoimentos e logos** de clientes reais no site: só com autorização por escrito de cada um (sugestão: pedir ao
   Vestiário, à Império e ao Bazar junto com a entrega).
