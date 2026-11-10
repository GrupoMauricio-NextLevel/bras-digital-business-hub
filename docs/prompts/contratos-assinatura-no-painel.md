# Contratos com assinatura no painel (o Master envia, o cliente assina com um clique)

> Estado: **PROPOSTA, NADA DESENVOLVIDO** (10/11/2026, pedido do dono: "de que forma podemos implementar isso dentro do sistema, para visualização no painel do cliente e assinatura digital sem burocracia, com um clique? Eu clico no Master e ele assina no painel dele?"). Frente: **[E-commerce]**.
> Primeiro modelo: `docs/contratos/loja-pronta-express/RACIONAL-E-PROMPT.md` (Loja Virtual Pronta Express).
> Não é parecer jurídico; a forma de assinatura segue a assinatura eletrônica simples aceita entre partes privadas (MP 2.200-2/2001, art. 10, § 2º, e Lei 14.063/2020). Um advogado deve validar o modelo e o "manifesto" de assinatura antes do uso em escala.

> **Provisório (dono, 10/11/2026):** a cobrança sai em nome da **NextLevel Marketing Ltda** (CNPJ 51.392.006/0001-92, Pix no Itaú) porque a **NextLevel Soluções** (a agência) ainda não está pronta. Por isso a "contratada", o CNPJ, o banco e a chave Pix **não ficam fixos no modelo nem no código**: vêm de uma configuração do Master (cadastro das empresas do grupo e dados de recebimento). Quando a NextLevel Soluções estiver pronta, troca-se a configuração e os contratos novos já saem no nome dela; os assinados antes continuam como foram (texto congelado).

---

## 1. O fluxo, do jeito que o dono pediu

```
MASTER                                   CLIENTE (painel do lojista ou link seguro)
1. Comercial → Contratos → Novo
   escolhe o modelo (Loja Pronta Express),
   preenche cliente, valores, datas
2. Confere a prévia → "Assinar e enviar"
   (a NextLevel assina primeiro)  ───────►  3. Aviso por e-mail e WhatsApp + faixa na fila do dia:
                                               "Você tem um contrato para assinar"
                                            4. Abre o contrato no painel (quadro-resumo no topo,
                                               "Em resumo" nas cláusulas de dinheiro e prazo)
                                            5. Marca "Li e concordo" → "Assinar"   (um clique)
6. Recebe o aviso "assinado"   ◄───────     6. Recebe o PDF assinado por e-mail
7. O contrato vira VIGENTE: aparecem as
   cobranças (sinal e restante) e a entrega
   (Loja Pronta) entra na fila da equipe
```

**Se o cliente ainda não tem conta:** o contrato vai por **link seguro** (endereço único e secreto). Para assinar, ele confirma os 3 primeiros dígitos do CPF e digita o código de 6 números que chega no e-mail ou no WhatsApp. É um passo a mais, só para quem não está logado; quem está logado assina com um clique.

---

## 2. Por que essa assinatura vale (e o que ela guarda)

A lei aceita a assinatura eletrônica simples entre empresas e clientes quando as duas partes concordam com o meio. O que dá força é a **prova**. Cada assinatura guarda:

| Prova | Como |
|---|---|
| Quem assinou | Usuário logado (ou CPF parcial mais o código enviado ao e-mail ou WhatsApp, no link seguro) |
| O que assinou | **Impressão digital do documento** (SHA-256 do texto final). Se uma vírgula mudar, a impressão muda |
| Quando | Data e hora do servidor |
| De onde | Endereço de rede (IP) e o aparelho/navegador |
| Que leu | Tempo na página e a marca "Li e concordo" |
| Cópia | PDF com a última página "Manifesto de assinaturas" (nome, documento, data, IP, impressão digital), enviado por e-mail às duas partes |

**Regras:**
- **Contrato assinado não muda.** O texto fica congelado. Qualquer mudança vira um **aditivo**, assinado do mesmo jeito.
- O modelo tem **versão**. Cada contrato guarda a versão usada.
- Os dados pessoais seguem a LGPD: só quem é parte do contrato e o Master veem.

---

## 3. O que já existe no sistema e será estendido (anti-duplicação)

| Já existe | Uso no contrato |
|---|---|
| `corporate_quotes` (propostas com itens, termos, validade e aceite) | A proposta comercial aceita **gera** o contrato; o contrato guarda o vínculo com a proposta |
| `corporate_orders` e as cobranças Pix pelo Mercado Pago (confirmação automática) | Cada parcela do contrato vira uma cobrança; o pagamento confirmado muda o estado sozinho |
| `service_deliveries` (Loja Pronta: prazo, checklist, aceite da entrega) | Contrato vigente com sinal pago cria a entrega; "entrega final só depois da quitação" vira trava nessa tela |
| Caixa do Master (destino "Pix · conta CNPJ NextLevel (Itaú)") | Quando o cliente pagar no Pix do Itaú, a equipe marca a parcela como paga e o caixa recebe o lançamento |
| Fila do dia do lojista e e-mail transacional | Aviso "contrato para assinar" e "parcela vencendo" |
| `termsVersion` e `termsAcceptedAt` (aceite dos parceiros) | Mesmo padrão de versão, agora com prova completa |

**O que é novo (3 tabelas):**
- `contract_templates`: o modelo, com a versão e os campos;
- `contracts`: cada contrato, com o cliente, os valores, as parcelas, o texto congelado, a impressão digital e o estado;
- `contract_signatures`: cada assinatura e a sua prova.

---

## 4. Estados do contrato

`RASCUNHO` → `ENVIADO` (a NextLevel assinou) → `ASSINADO` (o cliente assinou) → `SINAL PAGO` (a entrega começa) → `AGUARDANDO QUITAÇÃO` (loja pronta, publicação travada) → `QUITADO` (entrega final liberada) → `ENCERRADO`.

**Desvios:**
- `EXPIRADO`: não assinado até a validade;
- `CANCELADO`: o Master cancela antes da assinatura;
- `RESCINDIDO`: o restante não foi pago na tolerância, ou alguém desistiu. A regra do sinal (multa ou devolução em dobro) é aplicada e lançada no financeiro.

---

## 5. Pagamento: Pix no CNPJ do Itaú, com aviso e conferência manual (decisão do dono, 10/11/2026)

**Como funciona:**
1. **No painel do cliente**, cada parcela aparece com:
   - valor e vencimento;
   - a chave Pix CNPJ **51.392.006/0001-92** (Itaú, NextLevel Marketing Ltda) com botão "Copiar";
   - o QR estático da parcela.
2. Depois de pagar no banco dele, o cliente aperta **"Já fiz o Pix"**:
   - ele pode anexar o comprovante (opcional, foto ou PDF);
   - a parcela fica **"Aguardando conferência"**;
   - o cliente vê "Recebemos o seu aviso. Vamos conferir no banco e confirmar aqui".
3. **No Master** chega o aviso (fila "Agora" e e-mail ao dono): "Anderson avisou o Pix de R$ 500 · conferir no Itaú".
4. O dono confere o extrato no app do Itaú e, no Master, aperta:
   - **"Confirmar recebimento"**: a parcela fica **paga**, o caixa recebe o lançamento no destino "Pix · conta CNPJ NextLevel (Itaú)", o cliente recebe o recibo e o contrato avança de estado sozinho (sinal pago → entrega começa; restante pago → entrega final liberada);
   - ou **"Não encontrei"**: a parcela volta para "A pagar" e o cliente recebe a mensagem "Não localizamos o Pix; confira o comprovante ou fale com a gente".

**Regras:**
- **O botão do cliente não vale como pagamento.** Só a confirmação do Master muda a parcela para paga, porque comprovante pode ser falso ou o Pix pode ter sido estornado. Isso segue a regra da casa: pagamento só vale depois de conferido.
- Quem confirmou e quando fica registrado (auditoria).
- Lembrete automático ao cliente no dia do vencimento e ao Master quando um aviso estiver há mais de 24 horas sem conferência.

**Mercado Pago:** fica como opção futura (o sistema já sabe cobrar e confirmar sozinho). Não entra agora, por decisão do dono.

---

## 6. Fases

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **CT1 · Modelo e Master** | Tabelas e migração; modelo "Loja Pronta Express" com versão; Master → Comercial → Contratos: criar, prévia, "Assinar e enviar", lista com estados | Testes de domínio (conta das parcelas, datas, campos obrigatórios, CPF/CNPJ válido, texto congelado com impressão digital); prints |
| **CT2 · Assinatura do cliente** | Contrato no painel do lojista (aviso na fila do dia e em Minha conta → Contratos); link seguro com código para quem não tem conta; PDF com o manifesto; e-mail às duas partes | Teste: o assinado não muda; prova completa gravada; um tenant não vê contrato de outro; link expira; código errado bloqueia depois de 5 tentativas; prints no celular |
| **CT3 · Parcelas e entrega** | Parcelas no painel do cliente com o Pix do Itaú e o botão "Já fiz o Pix" (comprovante opcional); conferência no Master ("Confirmar recebimento" ou "Não encontrei"); lançamento no caixa; sinal confirmado cria a entrega da Loja Pronta; trava da entrega final até a quitação; lembretes; tolerância e rescisão automáticas, com a regra do sinal no financeiro | Testes: o aviso do cliente não marca como pago; só o Master confirma; confirmação gravada com quem e quando; idempotência (confirmar duas vezes não lança duas vezes no caixa); cada estado do contrato |
| **CT4 · Aditivos e outros modelos** | Aditivo assinado do mesmo jeito; modelos de Migração, Marketing e Projeto exclusivo; relatório de contratos no Master | Teste do aditivo; prints |

**Ordem:** CT1 → CT2 já resolvem "eu clico no Master e ele assina no painel". CT3 automatiza o dinheiro.

---

## 7. Enquanto o sistema não fica pronto (cliente de hoje)

O primeiro cliente assina pelo **PDF do contrato** com **assinatura eletrônica gov.br** (grátis e válida) ou com o "de acordo" por escrito no WhatsApp e no e-mail, com o PDF anexado. Quando a CT2 estiver no ar, os próximos assinam no painel.

---

## 8. Prompt mestre

```
Você vai desenvolver a fase [CT1..CT4] de "Contratos com assinatura no painel".

LEIA ANTES
1. CLAUDE.md e AGENTS.md (pilha, regras, branch, custo de montagem no Render, base de conhecimento D264).
2. docs/prompts/contratos-assinatura-no-painel.md inteiro e docs/contratos/loja-pronta-express/RACIONAL-E-PROMPT.md.
3. docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md.
4. O código que você vai estender: src/db/schema.ts (corporate_quotes, corporate_orders, service_deliveries, caixa),
   o domínio de propostas, pedidos corporativos e entregas em src/lib/domain/, os pagamentos do Mercado Pago, a fila
   do dia do lojista, o e-mail transacional (src/lib/email.ts) e as telas Comercial do Master.

RELATE PRIMEIRO
- Em até 12 linhas: o que existe, as tabelas novas, a migração, os testes, os riscos (prova da assinatura,
  privacidade, tenant) e o que depende do dono.

REGRAS
- Toda ação passa pelo domínio e por runAction; permissões no servidor (requireRole, assertCanAccess); um tenant
  nunca vê contrato de outro.
- Contrato assinado é imutável: texto congelado e impressão digital SHA-256; mudança só por aditivo.
- Prova da assinatura: usuário, data e hora do servidor, IP, aparelho, impressão digital, versão do modelo, "Li e
  concordo"; no link seguro, CPF parcial e código de 6 números com validade de 10 minutos e limite de tentativas.
- Contratada e dados de recebimento (razão social, CNPJ, banco, chave Pix) vêm da configuração do Master, por modelo
  (hoje NextLevel Marketing; depois NextLevel Soluções); o contrato congela o que estava valendo na assinatura.
- Valores em centavos; datas ISO; textos em português claro; sem promessa de ganho; dados pessoais só para as partes.
- Pagamento (decisão do dono): Pix no CNPJ do Itaú. O cliente aperta "Já fiz o Pix" (comprovante opcional, guardado
  com acesso só das partes) e a parcela fica "Aguardando conferência"; só o Master, depois de conferir o extrato,
  confirma o recebimento (ou "Não encontrei"). Idempotência por dedupeKey no lançamento do caixa. Mercado Pago fica
  para depois.
- Migração: alterou schema.ts → npx drizzle-kit generate --name contratos; nunca editar migração publicada.
- Página com banco: export const dynamic = "force-dynamic". Acessibilidade AA; sem rolagem lateral em 360 px.
- PDF do contrato: A4, fontes TTF estáticas, sem box-shadow, opacity ou gradiente em texto (regras do iPhone).

TESTES
- Domínio: parcelas somam o total; estados e transições válidas; imutável depois de assinado; prova completa;
  tenant isolado; link expira; código com limite; rescisão e regra do sinal; idempotência do pagamento.
- e2e: o Master cria e assina; o lojista vê na fila do dia e assina no celular; prints em 360 e 1440 px.

FECHAMENTO
- Decisão em docs/design/DECISIONS.md (próxima livre, "[E-commerce]"), citada na base de conhecimento; rode
  node scripts/gerar-novidades.mjs.
- Uma publicação por rodada (regra do Render); confira no ar; mande ao dono o print da principal tela.
```
