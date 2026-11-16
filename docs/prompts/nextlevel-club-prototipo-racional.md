# NextLevel Club: racional do protótipo funcional (academia, farmácia e negócio genérico)

> **Pedido do dono (16/11/2026):** estudar o prompt mestre vindo do GPT (`docs/prompts/nextlevel-club-prompt-mestre.md`) e trazer um racional de como montar **um protótipo funcional para academia e farmácia nesta semana**.
> **Base:** prompt mestre (requisitos de produto) + leitura do código real (abaixo) + estudo `docs/relatorios/ESTUDO-MERCADO-APPS-ACADEMIA-2026-11-14.md`.
> **Estado:** racional para aprovação. Nada programado ainda. Aprovado, vira a decisão **D300** e as fases P1 a P5 (seção 6).
> **Frente:** `[E-commerce]`. Cada academia ou farmácia é uma loja da NextLevel Commerce com o módulo Club ligado.

---

## 1. A conclusão em 6 linhas

1. **O protótipo cabe na semana** porque a maior parte já existe na **loja da NextLevel Commerce**: entrada do cliente sem senha, aplicativo pelo navegador com a marca da loja, modo "abrimos em breve" com lista de espera, cupons com limite e validade, CRM do lojista, Pix e retirada.
2. **O Club da Brás não é a base certa** para isso. Ele foi feito para usuários com senha e para as empresas do grupo, não para os clientes de cada loja. Ele fica como está; reaproveitamos **o padrão do balcão** (link sem login com QR), **não as tabelas de pontos**.
3. **O que falta construir é pequeno e bem delimitado:** módulo Club por loja (ligar e perfil), carteirinha do cliente na loja, ofertas com resgate no balcão, jornada da aula experimental e indicação. São **4 tabelas novas** pequenas, sem mexer nas antigas.
4. **Fica fora desta semana:** pontos, Meta/Google por loja, entrega rápida por bairro, agenda completa, check-in, WhatsApp automático, app nas lojas Apple/Google e benefícios de saúde reais.
5. **Uma publicação de código só**, na sexta, com o módulo **desligado por padrão**. Liga-se loja a loja pelo Master. Nada muda para quem já usa a plataforma.
6. **Precisa de 4 respostas do dono hoje** (seção 8). A principal: liberar o Club para lojas da Commerce, o que revê a regra de 19/10 que o limitava à Brás e à Cargas.

---

## 2. O que o prompt mestre pede, em resumo

| Pedido | Como o protótipo atende |
|---|---|
| Club como canal permanente de relacionamento e benefícios | Área do membro na loja, sempre no ar; o evento é opcional |
| Academia, farmácia e **negócio genérico** sobre o mesmo núcleo | Um módulo só, com **perfil** (Academia, Farmácia, Genérico) que só muda textos, sugestões e o que aparece |
| Duas experiências de marca: **NextLevel Club** e **marca própria** | Um campo por loja. A marca própria usa o que a loja já tem (logo, cores, domínio, ícone) |
| Habilitação explícita por empresa, sem afetar contas atuais | Liberação de módulo por loja que já existe (`entitlements`), feita pelo Master |
| Ofertas, resgate no balcão, limites, validade, sem duplicar | Tabelas de ofertas e resgates com limite garantido pelo banco |
| Oferta entre negócios (cupom da farmácia para aluno da academia) | A oferta diz em quais lojas parceiras aparece; o resgate acontece no balcão de quem paga o desconto |
| Benefícios de saúde | **Só o formato** "benefício externo" (texto + canal de agendamento), sem registrar interesse, sem pixel, sem CRM |
| Medição: ativações, indicações, resgates, com origem e denominador | Painel do Club no lojista com contagens tiradas dos registros (seção 5) |
| Isolamento entre empresas, testes, celular, acessibilidade | Testes com duas lojas, e2e no celular, axe, 360 px |

---

## 3. O que já existe no código (operacional, parcial, pendente)

| Requisito | Estado | Onde está | Como entra no protótipo |
|---|---|---|---|
| Habilitar módulo por loja | **Operacional** | `entitlements` (loja, chave, origem COURTESY/PLAN/ADD_ON) | Chave nova `CLUB`; o Master liga por cortesia no piloto |
| Marca da loja (logo, cores, domínio próprio) | **Operacional** | `stores` (logo, cores, `custom_domain`), temas | É a experiência "marca própria" |
| App pelo navegador com a marca da loja | **Operacional** | `src/app/store/[slug]/manifest.webmanifest`, ícone por loja | O membro "instala" a área do Club |
| Página "abrimos em breve" com lista de espera | **Operacional** (só e-mail) | `stores.launch_mode`, `store_waitlist` | Pré-abertura da academia; a lista vira convite do Club |
| Entrada do cliente **sem senha** (código no e-mail), sessão por loja | **Operacional** | `src/lib/domain/conta-cliente.ts`, `/store/[slug]/conta` | É a ativação do membro |
| Cliente ligado à loja (vínculo isolado por loja) | **Operacional** | `customers` + `store_customers` (um perfil por loja) | É o "membro" |
| CRM do lojista (conversou, comprou, sumiu; notas e próxima ação) | **Operacional** | `src/lib/domain/crm-loja.ts`, `crm_acompanhamento` | Mostra pedidos de aula e matrículas; "Fechou" = matriculou |
| Cupom da loja com limite, validade e valor | **Operacional** | `store_discounts` | Oferta "compra online com retirada" da farmácia |
| Balcão por link sem login, com QR e só o primeiro nome | **Operacional, mas só para as empresas do grupo** | `src/lib/domain/club/balcao.ts`, `/balcao-club/[token]` | **Reaproveita o padrão** (token com hash, tela do balcão); balcão por loja é novo |
| Indicação com primeira válida e etapas | **Parcial** (Club da Brás, por usuário) | `club_referrals` | O mesmo desenho, por loja e por cliente |
| Pontos, vales, acerto entre empresas | **Operacional para a Brás** | `club_ledger`, `club_vouchers`, `club_settlements` | **Não entra nesta semana**; o acerto entre lojas vira relatório de resgates por quem pagou |
| Página institucional "NextLevel Club" | **Operacional** (só vitrine) | `src/app/(portal)/club` | Ponto de entrada da experiência NextLevel Club depois |
| Restrição do Club à Brás e à Cargas | **Ativa** | `src/lib/club-marcas.ts` (decisão de 19/10/2026) | Não é removida: o Club da Brás segue isolado; o **Club da loja** é outro módulo, ligado por loja (decisão D300) |
| Origem do contato, Meta/Google por loja | **Pendente** (só para o comercial da NextLevel) | `origens_contato`, `conversoes_envio` | Fora; no protótipo a origem é o link/QR/indicação gravado na jornada |
| Entrega rápida por bairro | **Pendente** (existe só "entrega própria" como forma de envio) | `formas-envio.ts` | Fora; farmácia usa resgate no balcão e retirada |
| Agenda, check-in, WhatsApp automático, app nativo | **Pendente** | — | Fora |

---

## 4. O desenho do protótipo

### 4.1 Peças novas (4 tabelas, 1 chave de módulo, nada antigo alterado)

| Peça | O que guarda | Regras que importam |
|---|---|---|
| **Configuração do Club da loja** (coluna ou tabela pequena ligada à loja) | Perfil (Academia, Farmácia, Genérico), experiência (NextLevel Club ou marca própria), participa de ofertas entre parceiros (sim/não), textos | Sem a liberação `CLUB`, nada aparece |
| **Carteirinha do membro** (por loja e cliente) | Código opaco do QR, código de indicação, data de ativação, origem (QR da loja, link, indicação, evento) | Um por cliente por loja; trocar o código invalida o anterior (como na Brás) |
| **Ofertas** | Loja que publica e paga, tipo (cupom no balcão, cupom online, aula experimental, prêmio de indicação, benefício externo), título, regra, quantidade total, limite por membro, início e fim, lojas parceiras onde aparece | Só a loja dona edita; a parceira só vê se tiver aceitado |
| **Resgates** | Oferta, membro, loja onde aconteceu, balcão, situação (confirmado, revertido), quem confirmou, referência ao original na reversão | **Limite garantido pelo banco** (contador com condição + índice único por membro quando o limite é 1): duplo clique e repetição não duplicam |
| **Jornada da academia** (pedido de aula/visita) | Membro ou contato, situação (pedido, confirmado, compareceu, matriculou, perdido com motivo), origem, quem indicou | "Matriculou" é marcado pela recepção; libera o prêmio de indicação |
| **Balcão da loja** | Reaproveitar `club_counters` com chave de empresa `LOJA:<id>` **ou** tabela irmã por loja (a escolher na fase P1, olhando o código do balcão) | Link sem login, só o hash guardado; mostra primeiro nome, oferta e situação |

### 4.2 Telas

| Quem | Tela | O que faz |
|---|---|---|
| **Membro (celular)** | `/store/[slug]/clube` | Entrar com o código do e-mail → carteirinha com QR → ofertas da loja e das parceiras (disponível, vencida, esgotada, já usada) → detalhe da oferta → "Usar no balcão" mostra o QR do resgate → histórico → "Indique um amigo" com link |
| **Academia (celular)** | Mesma área + botão "Quero uma aula experimental" | Pedido com horário preferido; aparece para a recepção |
| **Balcão (celular ou tablet)** | `/balcao-loja/[token]` | Lê o QR (ou digita o código) → vê primeiro nome e oferta → confirma ou recusa; academia: "compareceu" e "matriculou" |
| **Lojista** | Painel → **Club** | Ligar perfil e marca; criar ofertas; aceitar ofertas de parceiras; criar o link do balcão; QR da loja para cartaz; fila de aulas experimentais; números |
| **Master** | Loja → **Liberar Club** | Liga e desliga por loja (cortesia no piloto), escolhe o perfil inicial |

### 4.3 Os três roteiros da demonstração (dados fictícios)

1. **Academia "Academia Demo Centro":** Ana entra pelo QR do cartaz → pede aula experimental → recepção confirma → Ana comparece → recepção marca "matriculou" → carteirinha ativa → Ana indica Bruno → Bruno matricula → Ana recebe o prêmio de indicação (oferta "camiseta" ou "1 semana grátis") → resgata no balcão.
2. **Farmácia "Farmácia Demo Bairro":** Carla entra pelo QR do caixa → vê "10% em higiene até domingo (100 unidades)" → mostra o QR no balcão → farmacêutico confirma → a quantidade cai para 99 → Carla tenta de novo → "já usado".
3. **Entre negócios:** a farmácia publica "protetor solar com 15% para alunos"; a academia aceita → Ana vê a oferta na área da academia → resgata no balcão da farmácia → a farmácia vê só "Ana, aluna da Academia Demo" → o relatório mostra resgates por oferta e quem pagou.
4. **Genérico "Padaria Demo":** liga o Club com o perfil Genérico, cria "café grátis na 10ª visita" como cupom de balcão → mesmo fluxo, sem nada de academia ou farmácia.
5. **Isolamento:** uma segunda academia fictícia não vê membros, ofertas privadas, resgates nem números da primeira (teste automático).

---

## 5. Medição no protótipo

| Métrica | De onde vem | Denominador |
|---|---|---|
| Ativações | Carteirinhas criadas, por origem (QR, link, indicação, lista de espera) | Visitas à página do Club, quando houver; senão, contagem simples |
| Pedidos de aula → comparecimento → matrícula | Jornada da academia | Pedidos do período |
| Indicações confirmadas | Jornadas "matriculou" com quem indicou | Links de indicação gerados |
| Resgates por oferta | Resgates confirmados menos revertidos | Quantidade disponível da oferta e membros que viram a oferta |
| Resgates entre negócios | Resgates em loja diferente da loja do membro | Ofertas compartilhadas aceitas |

**Fica fora:** matrícula para Meta/Google (depende de levar a origem e o retorno para cada loja), "matrícula incremental" (precisa de linha de base, que é tarefa do piloto) e qualquer dado de benefício de saúde.

---

## 6. Plano da semana (uma publicação de código, na sexta)

| Dia | Fase | Entrega | Verificação |
|---|---|---|---|
| **Seg 16** | P0 | Respostas do dono (seção 8), decisão D300, prompt em fases, desenho final das tabelas | — |
| **Ter 17** | P1 | Migração das tabelas novas, regras no domínio: ligar Club, carteirinha, ofertas, resgate com limite, reversão, jornada, indicação, balcão | Testes: limite com duplo clique e concorrência, reversão, isolamento entre duas lojas, permissões (Master, dono, equipe, balcão, membro) |
| **Qua 18** | P2 | Área do membro no celular (`/store/[slug]/clube`) e tela do balcão | Prints em 360 px, axe |
| **Qui 19** | P3 | Painel do lojista (Club, ofertas, parceiras, balcão, aulas, números) e liberação no Master | Prints, axe |
| **Sex 20** | P4 | Dados de demonstração (academia, farmácia, padaria, segunda academia), e2e dos três roteiros, bateria completa, build, **publicação com o módulo desligado** | Prints do site no ar; ligar só nas lojas de demonstração |
| Depois | P5 | Ligar na primeira academia real (inauguração prevista para os dias seguintes) | Linha de base antes de ligar |

**Se o tempo apertar, corta nesta ordem:** (1) experiência "NextLevel Club" fica só como selo, sem página própria; (2) oferta entre negócios fica para a semana seguinte; (3) a padaria vira só um teste automático, sem tela de demonstração. **Não corta:** limite garantido no resgate, isolamento entre lojas e testes.

**Custo de montagem no Render:** uma publicação de código na sexta (as de documento vão com `[skip render]`). Dentro da meta de até 3 por dia.

---

## 7. Riscos e cuidados

| Risco | Cuidado |
|---|---|
| Confundir com o Club da Brás (pontos, empresas do grupo) | Módulo separado por loja; o Club da Brás fica intocado e continua restrito |
| Resgate duplicado (duplo clique, internet ruim no balcão) | Contador com condição no banco + índice único + mesma resposta quando repetido |
| Balcão com link vazado | Token só com hash, trocar link desativa o antigo, balcão vê só primeiro nome e oferta |
| Dados entre negócios | A parceira vê só o primeiro nome, a oferta e de qual loja o membro vem; nada de contato |
| Farmácia e medicamento | Ofertas só de higiene, beleza e conveniência; texto fixo avisando que dúvida de saúde é com o farmacêutico |
| Benefício de saúde | Só o formato "benefício externo" com texto e canal do prestador; sem registro de interesse |
| Prazo da semana | Escopo fechado; o que não couber vai para a fase seguinte, sem esconder |
| Entrada só por e-mail | O público de academia prefere WhatsApp; no protótipo o código vai por e-mail (o que existe). Código por WhatsApp é a primeira melhoria depois |

---

## 8. O que preciso do dono para começar

1. **Liberar o Club para lojas da Commerce** como **módulo por loja**, separado do Club da Brás (que segue como está). Revê a regra de 19/10/2026. *Recomendo: sim.*
2. **Pontos ficam fora desta semana**: o protótipo usa ofertas, resgates e prêmio de indicação. Pontos entram depois, se o piloto pedir. *Recomendo: sim.*
3. **Nome que o membro vê:** "Clube [nome da loja]" com o selo "NextLevel Club" (experiência padrão) e, para quem contratar marca própria, só o nome da loja. *Recomendo: assim.*
4. **Entrada por código no e-mail** no protótipo, com WhatsApp como próxima melhoria. *Recomendo: sim.*

Também ajuda: o nome e o logotipo da primeira academia (para a demonstração com a cara dela, fora do repositório se preferir) e, se já existir, uma farmácia de bairro disposta a testar.
