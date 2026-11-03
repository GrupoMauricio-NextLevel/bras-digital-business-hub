# Parceiros v2: trilhas, níveis, CRM do Master, páginas de alto nível, white label (esqueleto) e limites por plano

> Racional + prompt engenheiro mestre. Data: 2026-11-03. Pedido do dono (resumo fiel):
> - "Preciso gerenciar com muita atenção os parceiros."
> - Aumentar os tipos de parceiro: de nano influenciadores a agências, vendedores e representantes. Estudar o modelo da Hostinger.
> - No painel gerencial (Master), um **CRM diferenciado** para gerenciar os parceiros.
> - A **página de captação** de parceiros precisa ser de muito alto nível.
> - A **página do parceiro** (a que ele usa para captar clientes) precisa ser de altíssimo nível.
> - Um **plano white label avançadíssimo** (o parceiro muda cores e marca): por enquanto, **só o esqueleto, bloqueado**, sem gastar energia.
> - Nos planos da loja: **lógica de benefícios por nível de plano**, e **sem cadastro ilimitado de produtos**.

---

## 1. O que já existe (não refazer: estender)

| Peça | Onde | Estado |
|---|---|---|
| **Tipos de parceiro** `AFFILIATE`, `REPRESENTATIVE`, `AGENCY`, `AGENCY_ELITE`, `WHITE_LABEL` | `src/db/schema.ts` (`PARTNER_KINDS`, tabela `partners`) | Existem no banco. Só o Master troca o tipo (`PartnerKindControl`). |
| **Regras de comissão versionadas** (produto, ciclo, tipo de parceiro) | `commissionRules`, `findRule` | D220: indicador **20% + 10% por 12 meses**; agência e agência elite **30% + 15% enquanto o cliente ficar**. |
| **Links, cliques, cupons de 7 dias, saques Pix, antifraude e taxa de manutenção de inativo** | `partnerLinks`, `partnerPayouts`, `/partner/links`, `/partner/coupons`, `/partner/finance` | Funcionam. Saque só para o mesmo CPF/CNPJ. |
| **CRM do parceiro** (leads dele, etapas, diagnóstico) | `partnerLeads` (`PARTNER_LEAD_STAGES`), `/partner/crm` | Existe do lado do parceiro. **O Master não tem CRM dos parceiros.** |
| **Painel do parceiro da E-commerce** | `src/app/partner/painel-ec.tsx`, `src/lib/domain/parceiros-ec.ts` | D220/D224/D225: abertura em vidro, pulso, "Precisa de você agora", pedido de agência. |
| **Página pública /parceiros da E-commerce** | `src/components/portal/commerce/parceiros/parceiros-ec.tsx` + `simulador.tsx` | D220/D223: indicador × agência, simulador, como funciona, dúvidas. |
| **Link do parceiro** `/r/[slug]` | `src/app/r/[slug]/route.ts` | **Só redireciona** e grava a atribuição. **Não existe página do parceiro para captar clientes.** |
| **Master → Parceiros** | `src/app/master/partners` (+ `[id]`) | Lista, fila "Precisa de você" (pedidos de agência e saques), tipo do parceiro. |
| **Recursos por plano da loja** | `src/lib/domain/perfil-loja.ts`, configuração `ecommerce.recursos-por-plano` | Tabela editável no Master. Padrão de 19/10: **tudo liberado nos três planos**. |
| **Planos** | `catalog-seed.ts`, revisão `src/lib/finance/revisao-d220.ts` | Start R$ 57, Pro R$ 147, Scale R$ 347 (anual 37/119/297). **Produtos e pedidos sem limite.** Diferença entre planos só nas cotas do Maurício IA (3 / 200 / 1000 por mês). |

**Conclusão:** a base técnica dos parceiros está pronta. Falta:
- a **estratégia** (trilhas e níveis);
- a **gestão** (CRM do Master);
- as **duas vitrines** (captação e página do parceiro).

Nos planos, falta a **escada de benefícios**.

---

## 2. O que aprender com a Hostinger

A Hostinger tem **três programas separados**, cada um para um tipo de pessoa:

1. **Afiliados** (criadores de conteúdo e sites):
   - comissão alta na primeira venda (a partir de 40%, com níveis que sobem conforme o volume);
   - cookie de 30 dias;
   - painel com links e materiais.
2. **Partner Program** (agências que hospedam vários sites de clientes):
   - **20% nas novas indicações e 10% nas renovações, vendas cruzadas e upgrades**;
   - listagem no diretório de parceiros e **selo de parceiro**;
   - desconto no próprio produto da agência;
   - exige um mínimo de indicações para continuar no programa.
3. **Indique um amigo** (o cliente indica): recompensa simples por indicação.

O que copiar, adaptado ao nosso caso:
- **Trilhas por perfil**, com regra, página e painel próprios, no lugar de "um programa para todos". Cada perfil se reconhece na hora: "isto é para mim".
- **Níveis por desempenho** que sobem sozinhos (gamificação com dinheiro de verdade). O parceiro sempre vê "quanto falta para o próximo nível".
- **Selo e diretório** para agências: status vale tanto quanto a comissão.
- **Requalificação**: quem não produz desce de nível ou sai, e o programa fica limpo.
- **O cliente também indica** (indique e ganhe), com recompensa simples.

Fontes:
- [Hostinger Partner Program](https://www.hostinger.com/partner-program)
- [Suporte do Partner Program](https://www.hostinger.com/support/hostinger-partner-program/)
- [Tutorial de programas de afiliados](https://www.hostinger.com/tutorials/affiliate-marketing-programs/)
- [Resenha de terceiros do programa de afiliados](https://bloggerspassion.com/hostinger-affiliate-program)

Os limites de cada nível de afiliado da Hostinger não são públicos.

---

## 3. Proposta: trilhas de parceiro (tipos)

Seis trilhas. As quatro primeiras usam o tipo `AFFILIATE` / `REPRESENTATIVE` com **subtipo** (perfil); agência e white label já são tipos próprios.

| Trilha | Para quem | Como ganha (proposta, **valores a aprovar**) | O que recebe além do dinheiro |
|---|---|---|---|
| **Cliente indica** (indique e ganhe) | Lojista NextLevel que indica outro lojista | Crédito na própria mensalidade: **1 mês grátis por indicação que pagar** (limite de 12 por ano). | Link e cupom dentro do painel do lojista. |
| **Nano e micro criador** (até ~50 mil seguidores) | Criadores de moda e atacado no Instagram e TikTok, consultores | **20% + 10% por 12 meses** (regra D220 de hoje) | Kit de conteúdo (roteiros, fotos, stories prontos), cupom de 7 dias, página pessoal. |
| **Criador Pro** (nível, não cadastro) | Quem chega a 10 clientes pagantes ativos | **25% + 10% por 24 meses** | Destaque no ranking e materiais exclusivos. |
| **Vendedor / representante** | Quem vende na rua: Brás, Canindé, Bom Retiro, feiras, porta a porta | **20% + 10% enquanto o cliente ficar** + **bônus fixo por loja ativada** (ex.: R$ 30 quando a loja publica e faz a 1ª venda) + meta mensal | **Carteira e território** (bairros e ruas), modo "visita" no celular (cadastro da loja na rua em 2 minutos), material impresso com QR. |
| **Agência parceira** | Agências de marketing, social media, consultorias | **30% + 15% enquanto o cliente ficar** (regra D220) | Selo, **diretório público de agências**, atendimento prioritário, preço de revenda nas Soluções (Loja Pronta, Migração). |
| **Agência Elite** (nível) | Agência com 20 ou mais clientes ativos | **35% + 20% enquanto ficar** | Gerente de conta, leads do diretório, co-marketing. |
| **White label** (bloqueado) | Agências grandes que querem revender com a própria marca | Preço de atacado + margem própria (modelo a definir) | Cores, logo, domínio e e-mails com a marca da agência. **Só esqueleto agora** (seção 7). |

### 3.1 Níveis por desempenho (dentro de cada trilha)

| Nível | Clientes pagantes ativos | Efeito |
|---|---|---|
| **Inicial** | 0 a 2 | Regra base da trilha |
| **Prata** | 3 a 9 | +2 pontos na recorrência |
| **Ouro** | 10 a 19 | Vira "Pro" na trilha de criador; +5 pontos na recorrência |
| **Diamante** | 20 ou mais | Vira "Elite" na trilha de agência; gerente de conta |

- **Recalcula todo mês.** Sobe na hora e desce só depois de 2 meses abaixo do limite, para não punir por uma oscilação. O Master pode fixar o nível manualmente, com motivo registrado.
- **Guarda-corpo financeiro:** nenhuma combinação de regra pode passar de **X% da receita** do cliente (sugestão: 40% no 1º mês e 20% recorrente). Usar o mesmo padrão dos guarda-corpos da proposta de preço do Master. Um teste garante esse limite.

**Decisões do dono** (com valores sugeridos):
- percentuais por trilha e por nível;
- valor do bônus do representante;
- a recompensa do "cliente indica";
- o teto de comissão.

---

## 4. CRM de parceiros no Master (o "diferenciado")

Hoje o Master vê uma lista. A proposta é um **escritório de parceiros**: uma tela que responde "quem precisa de mim hoje".

### 4.1 Funil do parceiro (quadro em colunas, arrastável)
`Candidato → Em análise → Aprovado → Ativando (sem 1ª venda) → Produtivo → Em risco (30 dias sem indicar) → Inativo / Desligado`

Cada cartão mostra:
- foto e nome, trilha, nível;
- clientes ativos, receita gerada no mês e comissão a pagar;
- última atividade e próxima ação, com data;
- dono interno (quem da equipe cuida);
- botão de WhatsApp.

### 4.2 Ficha 360 do parceiro (gaveta lateral)
- **Linha do tempo:** cadastro, aprovação, links criados, cliques, testes, vendas, saques, notas, ligações e mudanças de nível.
- **Indicados**, com a situação de cada loja: teste, pagante, atrasada ou cancelada.
- **Dinheiro:** comissões por mês, garantia, saldo e saques.
- **Saúde:** nota de 0 a 100, calculada por conversão, recência, cancelamento dos indicados e sinais de antifraude.
- **Tarefas e lembretes:** "ligar dia 5", "mandar kit" e similares, com aviso na fila do Master.
- **Notas internas**, que o parceiro não vê.

### 4.3 Fila "Precisa de você" (ampliar a que já existe)
- pedidos de agência ou de mudança de trilha;
- saques para aprovar;
- candidatos parados há mais de 48 h;
- parceiros "Ativando" há mais de 14 dias, para ligar e ensinar;
- produtivos que entraram em risco;
- alertas de antifraude (autoindicação, mesmo CPF/CNPJ, mesmo IP).

### 4.4 Visões e números
- **Ranking do mês** por trilha.
- **Mapa por região**, para representantes.
- **Receita e retenção dos indicados** por parceiro.
- **Custo de aquisição** (comissão paga ÷ clientes ativos).
- **Segmentos salvos**, por exemplo "agências Ouro em SP" ou "criadores sem venda em 30 dias".

### 4.5 Ações em massa
- mensagem para um segmento, como um aviso no painel do parceiro ou um e-mail;
- **desafio do mês** (ex.: "3 lojas ativadas = bônus de R$ 100");
- exportar CSV.

### 4.6 Dados novos (migração)
- `partner_profiles`: `partnerId`, `trilha` (CREATOR | SELLER | AGENCY | CUSTOMER), `nivel`, `nivelFixadoPor`, `regiao`, `seguidores`, `canais`, `donoInternoId`.
- `partner_pipeline`: `partnerId`, `etapa`, `proximaAcao`, `proximaAcaoEm`, `atualizadoEm`.
- `partner_activities`: `partnerId`, `tipo` (NOTA | LIGACAO | TAREFA | MUDANCA_NIVEL | MENSAGEM), `texto`, `vencimento`, `feitoEm`, `autorId`.
- `partner_tier_history`: `partnerId`, `de`, `para`, `motivo`, `em`.
- `partner_challenges` (desafios): regra, período, bônus.

Sem apagar nada do que existe.

---

## 5. Página de captação de parceiros (/parceiros), de muito alto nível

Reconstruir sobre a página atual, seguindo a skill `pagina-de-vendas`.

1. **Topo:** "Ganhe dinheiro indicando a plataforma que o Brás está usando", com **seletor de perfil**: *Sou criador*, *Sou vendedor*, *Sou agência*. Cada perfil muda o texto, a comissão e a chamada sem sair da página.
2. **Escada de níveis** (Inicial → Prata → Ouro → Diamante) mostrando quanto se ganha em cada nível com números reais da regra.
3. **Simulador** (o atual, ampliado): perfil + lojas por mês + plano → ganho no mês 1, no 12 e no 24.
4. **"Fácil de vender":**
   - taxa zero da plataforma;
   - comparativo contra 4 concorrentes;
   - feita para o atacado;
   - equipe no Brás.
   Usar os blocos já prontos da home.
5. **O painel do parceiro**, com telas reais em dispositivo, sem inventar números: dados de demonstração identificados.
6. **Diretório de agências** (prova social real, quando houver agências aprovadas).
7. **Como funciona** em 4 passos e **dúvidas**.
8. **Cadastro em etapas:**
   - perfil;
   - dados;
   - qualificação (seguidores, região, carteira de clientes);
   - aceite.
   A candidatura vai para o funil do Master como **Candidato**.

Subpáginas para anúncio e busca: `/parceiros/criadores`, `/parceiros/vendedores` e `/parceiros/agencias`. É a mesma estrutura com outro perfil selecionado, sem duplicar código.

**Ativos que o dono precisa gerar:** fotos de vendedor na rua do Brás com celular, de agência em reunião e de criadora gravando story. Listar no manifesto com prompts; nunca usar foto genérica.

---

## 6. Página do parceiro para captar clientes, de altíssimo nível

**Hoje `/r/[slug]` só redireciona. A proposta é que ele vire uma página:** `/i/[codigo]` (ou `/r/[slug]` mostrando a página no lugar do redirecionamento), uma **home da NextLevel com a assinatura do parceiro**.

- **Faixa do parceiro no topo:**
  - "Indicação de **Ana Souza**", com foto, frase pessoal e botão de WhatsApp dela;
  - para agência, logo da agência e "implantação pela Agência X".
- **Oferta exclusiva:** o cupom do parceiro já aplicado (ex.: 7 dias grátis + 1º mês por R$ 9,90), com contagem regressiva real se houver validade.
- **Blocos da home já prontos:** faixa do 0%, comparativo, feita para o atacado, planos com o cupom, temas e dúvidas. Tudo com o mesmo visual de tecnologia (D222/D223).
- **Personalização no painel do parceiro:**
  - foto, frase, WhatsApp e cor de destaque, escolhida entre 4 da paleta;
  - temas favoritos em destaque;
  - um depoimento próprio, revisado pelo Master antes de ir ao ar.
- **Atribuição:** cookie de 60 dias + cupom. Quem vem pela página e cria loja fica ligado ao parceiro (regra atual de atribuição, sem mudar a lógica de comissão).
- **Kit de divulgação:**
  - QR code em alta resolução e cartão para imprimir (representante);
  - posts e stories gerados com a página;
  - link curto.
- **Rápida e segura:**
  - imagens otimizadas;
  - `noindex` opcional;
  - sem dados pessoais do parceiro além do que ele escolheu mostrar (LGPD).

---

## 7. White label: só o esqueleto, bloqueado

Objetivo: deixar o terreno pronto com o mínimo de esforço.

1. **Configuração** `parceiros.white-label.ativo = false` (padrão desligado), lida no domínio.
2. **Tabela** `partner_brands`, criada e vazia:
   - `partnerId`, `nomeMarca`, `logoUrl`;
   - `corPrimaria`, `corDestaque`;
   - `dominio`, `emailRemetente`;
   - `status` (RASCUNHO | EM_ANALISE | ATIVO).
3. **Domínio** `whiteLabelDoParceiro(db, partnerId)`: devolve `{ disponivel: false, motivo: "Em breve" }` enquanto a configuração estiver desligada. Um teste garante isso.
4. **Painel do parceiro:** cartão "Sua marca (white label) · Em breve", com cadeado, mostrando o que vai existir e o botão "Quero ser avisado", que registra interesse.
5. **Master:** na ficha do parceiro, a seção "White label" aparece desabilitada, com o interruptor travado e o texto "em desenvolvimento".

**Não fazer agora:** aplicar o tema da marca do parceiro nas lojas, domínio próprio do parceiro ou e-mails com a marca dele.

---

## 8. Planos da loja: benefícios por nível e fim do "produtos ilimitados"

Hoje os três planos liberam tudo, sem limite de produtos e pedidos. A proposta é uma escada clara, perto do que o mercado faz (WBuy 200/500/1.000/5.000; Loja Integrada 250/500/ilimitado; Tray 100/750/1.500), mas com folga para o atacado.

| Benefício | **Start** R$ 57 | **Pro** R$ 147 | **Scale** R$ 347 | **Enterprise** |
|---|---|---|---|---|
| Produtos ativos | **500** | **3.000** | **10.000** | Sob consulta |
| Pedidos por mês | Sem limite | Sem limite | Sem limite | Sem limite |
| Pessoas na equipe | 2 | 5 | 15 | Sob consulta |
| Maurício IA (por mês) | 3 | 200 | 1.000 | Sob consulta |
| Atacado: grade, preço por quantidade, pedido mínimo | Sim | Sim | Sim | Sim |
| Propostas e pedidos do balcão | 20 por mês | Sem limite | Sem limite | Sem limite |
| Integrações de ERP (Tiny, Omie) | Não | Sim | Sim | Sim |
| Relatórios em planilha | Não | Sim | Sim | Sim |
| Temas pagos inclusos | Não | 1 tema N2 | 1 tema N3 | Sob consulta |
| Suporte | WhatsApp, horário comercial | Prioritário | Prioritário + gerente | Dedicado |
| Migração assistida | Paga à parte | Desconto de 50% | Inclusa (até 1.000 produtos) | Inclusa |

**Escolha dos números (para o dono confirmar):**
- **500 no Start** cobre a grande maioria das lojas de atacado do Brás. O limite conta **produtos ativos, não variações**: um vestido com 6 tamanhos é 1 produto.
- **Pedidos continuam sem limite** em todos os planos. Limitar pedido pune quem vende, e esse argumento a concorrência não tem.

**Regras de implantação:**
- **Os limites saem da tabela editável do Master** (`ecommerce.recursos-por-plano`), agora com números, não só sim/não. Nada fixo no código.
- **Quem já tem mais produtos que o novo limite não perde nada:**
  - os produtos continuam no ar;
  - a loja só não ativa produtos novos até ficar abaixo do limite ou subir de plano;
  - aviso claro no painel ("Você usa 612 de 500 produtos ativos. Suba para o Pro").
  - Registrar como decisão.
- **Verificação em um lugar só, no domínio** (criar, importar por planilha, migrar, ativar), com teste. A mensagem de bloqueio leva ao upgrade.
- **Barra de uso no painel do lojista** ("Produtos: 412 de 500"), com aviso aos 80%.
- **Site público:**
  - a linha "Sem limite de produtos e pedidos" do comparativo e da home vira **"Pedidos sem limite em todos os planos"** e **"Até 10 mil produtos"**;
  - o cartão "∞" da home troca de mensagem;
  - atualizar os testes do comparativo.
- **O vendedor IA e as dúvidas** passam a explicar os limites.

---

## 9. Riscos e cuidados

- **Comissão alta demais:** usar o guarda-corpo (seção 3.1) e uma simulação no Master antes de ligar um nível novo.
- **Fraude:**
  - autoindicação (mesmo CPF/CNPJ, mesmo cartão, mesmo IP), que o antifraude atual já cobre e precisa ser estendido ao bônus do representante;
  - "loja fantasma" para pegar bônus de ativação: o bônus só sai após a 1ª venda paga **e** 30 dias de assinatura.
- **Limite de produtos assusta quem compara:** o texto destaca "pedidos sem limite" e a folga do Start (500).
- **Página do parceiro com dado pessoal:** só o que ele escolheu publicar; o depoimento passa pela revisão do Master.
- **White label:** não prometer data na página pública.

## 10. Perguntas para o dono antes da implantação

1. Percentuais por trilha e nível (seção 3): aprova os sugeridos?
2. Bônus do representante por loja ativada: R$ 30? Meta mensal com prêmio?
3. Recompensa do "cliente indica": 1 mês grátis por indicação paga?
4. Limites de produtos: 500 / 3.000 / 10.000?
5. Equipe por plano: 2 / 5 / 15?
6. O que mais muda por plano (seção 8)?
7. Endereço da página do parceiro: `nextlevel…/i/ana-souza` ou manter `/r/`?

---

## 11. Fases

| Fase | Entrega | Pronto quando |
|---|---|---|
| **PV0** | Decisões do dono registradas (DECISIONS) e valores no catálogo e nas regras | Regras novas versionadas com motivo; guarda-corpo com teste |
| **PV1** | Dados: perfis, funil, atividades, histórico de nível, desafios, `partner_brands` (vazia) | Migração prova que atualiza banco antigo; seeds idempotentes |
| **PV2** | Níveis: cálculo mensal, subida e descida com carência, nível fixado pelo Master, regra por nível no `findRule` | Testes de domínio para cada caso |
| **PV3** | **CRM do Master:** quadro do funil, ficha 360 em gaveta, fila ampliada, ranking, segmentos, ações em massa | Capturas 1440/390, uma consulta por bloco, permissões no servidor |
| **PV4** | **Página de captação** com seletor de perfil, escada de níveis, simulador ampliado e cadastro em etapas → Candidato no funil | Skill `pagina-de-vendas` (3 rodadas de capturas), sem dado inventado |
| **PV5** | **Página do parceiro** `/i/[codigo]` + personalização no painel + kit (QR, cartão) | Atribuição testada (cookie + cupom), LGPD, velocidade medida |
| **PV6** | **Planos:** limites numéricos editáveis, verificação no domínio, barra de uso, avisos, textos públicos e IA atualizados | Teste de bloqueio e da regra de quem já passou do limite; comparativo atualizado |
| **PV7** | **White label (esqueleto):** configuração desligada, cartão bloqueado no painel do parceiro e no Master, "Quero ser avisado" | Teste garante `disponivel: false` com a configuração desligada |
| **PV8** | Painel do parceiro: nível atual, "quanto falta", desafios do mês, ranking | Capturas e teste do cálculo exibido |

---

## 12. Prompt engenheiro mestre (colar numa sessão de desenvolvimento)

```
Você é o engenheiro responsável pela evolução "Parceiros v2" da NextLevel E-commerce (Next.js 16 App Router, React 19,
Drizzle com PGlite/Neon, Tailwind v4, Vitest, Playwright). Trabalhe em português simples com o dono (Mauricio), sem jargão.

LEIA PRIMEIRO, de forma econômica (índices e trechos, não arquivos inteiros):
- AGENTS.md (esta versão do Next tem mudanças: consulte node_modules/next/dist/docs antes de usar API nova).
- CLAUDE.md e docs/design/DECISIONS.md (últimas decisões: D216 a D225).
- Este arquivo: docs/prompts/parceiros-v2-crm-niveis-planos.md (racional, mapa do que já existe, fases PV0 a PV8).
- Skills do projeto em .claude/skills: desenvolver-prompt, nova-migracao, painel-interno, pagina-de-vendas, qa-visual,
  security-guardian, publicar.

REGRAS DO PROJETO (obrigatórias):
- Estender o que existe; não duplicar. Mapa: partners/PARTNER_KINDS, commissionRules/findRule, partnerLinks, partnerLeads,
  partnerPayouts, parceiros-ec.ts, painel-ec.tsx, parceiros-ec.tsx, /r/[slug], master/partners, perfil-loja.ts
  (ecommerce.recursos-por-plano), revisao-d220.ts.
- Regra de negócio em src/lib/domain/*; componente visual não decide regra; permissão no servidor; dinheiro em centavos
  (formatBRL); páginas com banco usam `export const dynamic = "force-dynamic"`.
- Valores comerciais (percentuais, bônus, limites) vêm de regras versionadas ou da tabela editável do Master, nunca fixos no
  componente. Mudança de valor = nova versão com motivo "Dxxx".
- Nada de números, logos, depoimentos ou clientes inventados nas páginas. Dado de demonstração sempre identificado.
- Taxa zero é "da plataforma"; o Mercado Pago cobra as taxas dele. Nunca escrever "mais barato" (use "mais vantajoso",
  "preço mais competitivo"). Visual: tipografia e kit de tecnologia (tech.css, CabecalhoTech, PainelTech), vidro colorido nas
  aberturas dos painéis (D225).
- Acessibilidade AA, sem rolagem horizontal em 360 px, foco visível, prefers-reduced-motion.
- SuperDrop não está em produção (D216); foco: NextLevel E-commerce + Master.
- Segredos só via encryptSecret; nunca em tela, log ou e-mail.

COMO TRABALHAR CADA FASE (PV0..PV8, uma por vez, na ordem):
1. Confirme no início da fase as decisões pendentes do dono listadas na seção 10 que afetam a fase (pergunte só o que
   bloqueia; use os valores sugeridos do documento se o dono já aprovou).
2. Domínio + testes Vitest primeiro (casos: regra por trilha e nível, carência de descida, guarda-corpo de comissão,
   antifraude do bônus, limite de produtos com e sem excedente antigo, white label sempre indisponível com a chave desligada).
3. Migração com a skill nova-migracao (colunas novas com default ou anuláveis; provar que atualiza banco antigo; seeds
   idempotentes nos dois caminhos: demonstração e produção).
4. Telas: painel-interno para o Master e o painel do parceiro (fila "precisa de você", uma consulta por bloco, gaveta lateral,
   ações com resposta clara); pagina-de-vendas para /parceiros e /i/[codigo] (seletor de perfil, escada de níveis, simulador,
   blocos da home reaproveitados, cadastro em etapas; listar ativos de foto que faltam em vez de usar foto genérica).
5. Conferência visual com qa-visual (1440, 768 e 390 px; interações; antes/depois) e mandar prints ao dono a cada passo.
6. Rodar: npx tsc --noEmit · npx eslint src e2e tests · testes do que mudou (a bateria completa nas fases com dinheiro) ·
   npm run build nas fases grandes.
7. Registrar a decisão nova em docs/design/DECISIONS.md e subir o "(próxima: Dxxx)" do CLAUDE.md; atualizar o estado deste
   prompt em docs/prompts/README.md.
8. Commit com o rodapé de atribuição da sessão; publicar com a skill publicar (push para a branch de trabalho, conferência em
   produção até "Tudo certo"). Nunca force push. Sem PR sem pedido do dono.
9. Reporte ao dono em português simples: o que ficou pronto, prints, o que depende dele e a próxima fase.

ENTREGÁVEIS POR FASE (resumo; detalhes nas seções 3 a 8 do documento):
- PV0: regras de comissão por trilha e nível versionadas + guarda-corpo testado.
- PV1: partner_profiles, partner_pipeline, partner_activities, partner_tier_history, partner_challenges, partner_brands (vazia).
- PV2: cálculo mensal de nível (sobe na hora, desce após 2 meses), nível fixado pelo Master com motivo, findRule por nível.
- PV3: CRM do Master (funil em colunas, ficha 360 em gaveta, fila ampliada, ranking, segmentos salvos, mensagem em massa,
  desafio do mês, CSV).
- PV4: /parceiros de altíssimo nível com subpáginas por perfil e cadastro em etapas que cria "Candidato" no funil.
- PV5: página do parceiro /i/[codigo] (faixa do parceiro, cupom aplicado, blocos da home, personalização revisada pelo
  Master, atribuição 60 dias, QR e cartão para imprimir).
- PV6: limites por plano editáveis no Master (produtos ativos 500/3.000/10.000 sugeridos, equipe, propostas, ERP, relatórios,
  temas, suporte), verificação única no domínio, barra de uso, excedente antigo preservado, textos públicos e IA atualizados.
- PV7: white label só esqueleto e bloqueado (configuração desligada, cartões "Em breve", "Quero ser avisado").
- PV8: painel do parceiro mostra nível, quanto falta, desafios e ranking.

CRITÉRIO DE PRONTO GERAL: o dono consegue, sem ajuda, (a) ver quem precisa dele no CRM de parceiros e agir em 1 clique,
(b) mandar um parceiro novo para a página de captação e vê-lo cair como Candidato, (c) ver a página pessoal de um parceiro
com o cupom aplicado e a atribuição funcionando, (d) mudar um limite de plano no Master e ver o efeito no painel do lojista,
(e) ver o white label bloqueado e pronto para a próxima fase.
```
