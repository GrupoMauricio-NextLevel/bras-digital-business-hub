# NextLevel Club: o que já temos construído (resumo para aprimorar o racional)

> **Para que serve este arquivo:** levar a outra conversa de IA (GPT), por alto, o que a NextLevel **já tem funcionando** na plataforma, para que o racional do **NextLevel Club** parta do que existe e não do zero.
> **Data:** 14/11/2026. **Fonte:** o sistema da NextLevel e o estudo `docs/relatorios/ESTUDO-MERCADO-APPS-ACADEMIA-2026-11-14.md`.
> **Sem nomes de clientes:** o racional vale para qualquer academia, farmácia ou negócio local.

---

## 1. Em uma frase

A NextLevel tem **uma plataforma só** (um sistema, um banco, um painel central) que já roda lojas virtuais, pagamentos, frete, CRM, parceiros, clube de pontos e IA. O **NextLevel Club** seria a camada que **liga consumidores e negócios do bairro**: o consumidor ganha benefícios em vários lugares; o negócio ganha **captação, fidelização e venda**. Dois nichos fortes para começar:

- **Academias → serviço → comunidade de membros** (captar aluno, segurar aluno, aluno indica aluno).
- **Farmácias → produto → entrega rápida no bairro** (pedido pelo celular, entrega em pouco tempo, recompra).

---

## 2. O que já está construído e funcionando

| Bloco | O que já faz | Serve para o Club? |
|---|---|---|
| **Loja virtual completa** | Vitrine com temas e editor visual, produtos com variações, estoque, carrinho, checkout, domínio próprio, avaliações, venda junto, cupons, descontos, preço por faixa e atacado | Base da loja da academia e do delivery da farmácia |
| **Pagamento** | Mercado Pago (cartão e **Pix**), pagamento conferido na API antes de valer, sem cobrança duplicada | Reserva de vaga, compra no delivery, adicionais |
| **Frete e entrega** | Correios, Jadlog, Loggi, transportadoras e calculadoras (Melhor Envio, SuperFrete, Frenet); **entrega própria (motoboy ou carro)** já é uma forma de envio | Ponto de partida do delivery; falta o "rápido no bairro" (seção 5) |
| **Depois da venda** | Separar, enviar, rastrear, cancelar devolvendo o dinheiro, e-mails do pedido | Igual para farmácia |
| **CRM do lojista** | Cada loja vê seus clientes juntos numa pessoa só: quem conversou, abandonou carrinho, comprou, voltou ou sumiu há mais de 90 dias; próxima ação e notas; link pronto para WhatsApp | Alerta de "aluno sumido" e "cliente que não recompra" |
| **Carrinho abandonado** | Recuperação por e-mail, só com consentimento | Recompra na farmácia |
| **Assistente da loja (IA)** | Chat da vitrine que responde com os dados reais da loja (pedido, produtos), sem inventar | Atendimento 24h da academia e da farmácia |
| **Anúncios na Meta pelo painel do lojista** | Diagnóstico em conversa, prévia do anúncio, proposta, acompanhamento da campanha com a equipe; verba sempre na conta do cliente | Captação de alunos e clientes do bairro |
| **Tráfego e campanhas** | Origem de cada contato (anúncio, peça, público, cidade, aparelho), links rastreados, código da visita no WhatsApp, pixel com consentimento, **retorno da venda à Meta e ao Google pelo servidor** | Medir "quem trouxe a matrícula/o pedido". **Hoje serve só ao comercial da própria NextLevel**; precisa passar a servir cada negócio |
| **Parceiros e afiliados** | Links de indicação, comissões, níveis, pagamentos, missões da semana, sequência, selos e ranking | Indicação de membro, embaixadores do bairro |
| **Club (pontos e benefícios)** | Pontos com extrato, **indicações que viram pontos**, vales de desconto, **carteirinha com QR no balcão** do parceiro (o balcão vê só primeiro nome e nível), compra que vira ponto, **acerto entre empresas** de quem bancou o desconto, ranking; rascunho de assinatura premium (Club+ e Club Total) | É o coração do NextLevel Club. **Hoje está ligado só à marca Brás Digital e à Cargas** (decisão do dono de 19/10/2026); abrir para todos exige nova decisão |
| **Serviços e assinaturas** | Catálogo de serviços, pedidos de serviço com conversa, planos, assinaturas e liberação de recursos por plano | Adicionais da academia (avaliação, personal, nutricionista), plano do negócio no Club |
| **Painel central (Master)** | Todas as marcas, lojas, finanças, parceiros, comercial, auditoria; filtro por marca | Gestão do Club e dos negócios |
| **Multiempresa seguro** | Cada negócio só vê os próprios dados; segredos criptografados; permissões no servidor | Requisito para um clube com muitos negócios |
| **Base de conhecimento** | Tela "Aprender" com aulas e novidades para a equipe | Treinar a equipe e os parceiros |

**O que ainda não existe:** app nativo nas lojas Apple/Google (o caminho rápido é o app pelo navegador, PWA), agenda de visita/aula para qualquer negócio, WhatsApp oficial com mensagem automática, check-in na academia, integração com sistemas de gestão de academia (EVO, Tecnofit, Pacto), **entrega rápida com área de entrega, prazo prometido e despacho de motoboy**, catálogo de medicamentos e regras de farmácia.

---

## 3. A ideia do NextLevel Club (como está hoje)

**Dois lados, uma carteirinha:**

| Para o usuário (consumidor) | Para o negócio |
|---|---|
| Uma carteirinha e um saldo de pontos que valem em vários negócios do bairro | Página e loja próprias, com a marca dele |
| Benefícios, descontos e vales | Captação: anúncio medido até a venda, indicação, QR code no comércio vizinho |
| Comunidade (desafios, ranking, mural, eventos) | Fidelização: pontos, alerta de cliente sumido, recompra |
| Indica amigos e ganha | Venda de adicionais e produtos |
| Grátis (com opção premium no futuro) | Paga mensalidade + percentual sobre o que vende ou sobre o resultado medido |

**Regras que o racional deve respeitar:**
- **Um sistema só:** academia, farmácia e lojas são "pacotes" sobre o mesmo motor, não produtos separados.
- **Cada negócio isolado:** o que circula entre negócios é o benefício, com consentimento do consumidor, nunca os dados.
- **Foco da empresa:** até ter 10 lojistas pagantes na NextLevel Commerce, a prioridade é ela. O Club entra como **segmento da Commerce** (cada academia ou farmácia é um lojista pagante), não como empresa nova.
- **Sem promessa de ganho** nos textos; valores reais e medidos.
- **LGPD:** consentimento para marketing; dado de saúde é sensível (academia e farmácia).

---

## 4. Nicho 1: academias (serviço, comunidade de membros)

Resumo do estudo de mercado (no repositório, com fontes):

- **Mercado:** 62.718 centros de atividade física no Brasil em 2025; cerca de R$ 17 bilhões por ano; **evasão de 40% a 60% dos alunos por ano**; grandes redes preveem centenas de aberturas em 2026 (cada inauguração precisa de captação).
- **Concorrência:** sistemas de gestão (Tecnofit, cerca de R$ 3,38 por aluno/mês; EVO/W12; Pacto; Next Fit) fazem contrato, cobrança e catraca, mas são **fracos em captação e comunidade**. Lá fora, app com a marca da academia é adicional caro.
- **Dor que vende rápido:** **captar alunos**, principalmente na inauguração. **Dor que mantém o cliente:** reter alunos.
- **Funções diferenciadas** (a maioria reaproveita o que já existe):
  - página de pré-venda com **vagas de fundador** e **reserva paga por Pix** (abatida da mensalidade);
  - resposta ao contato em menos de 1 minuto e painel "responda agora" com cronômetro;
  - funil de aula experimental com motivo de perda;
  - **a matrícula volta para a Meta e o Google**, para o anúncio otimizar por quem matricula;
  - indicação do fundador com ranking;
  - QR code rastreado no comércio do bairro;
  - aluno de Wellhub e TotalPass vira contato da casa;
  - quem matricula entra no clube: carteirinha, pontos, desafios, mural, loja e adicionais.
- **Modelo sugerido:**
  - primeira academia como **cliente fundador** (inauguração e 90 dias sem mensalidade, 10% das vendas no app, em troca de números e depoimento);
  - depois, planos de **R$ 397/mês (Captação) a R$ 597–797 (Captação + Clube)**, mais **R$ 20 por matrícula** que o sistema registrou e de 8% a 12% das vendas no app;
  - **pacote de inauguração** de R$ 1.500 a R$ 3.000;
  - gestão de anúncios à parte.
- **Conta que convence a academia:** a matrícula pelo anúncio sai por cerca de R$ 85 e vale de R$ 780 a R$ 1.040 (mensalidade × permanência). Reduzir a evasão em 5 pontos numa academia de 2.500 alunos vale cerca de R$ 97 mil por ano. São hipóteses a confirmar com o primeiro cliente.

---

## 5. Nicho 2: farmácias (produto, entrega rápida no bairro)

**Ainda não pesquisado a fundo**; abaixo, o que a plataforma já cobre e o que faltaria.

| Necessidade da farmácia de bairro | Já existe | Falta |
|---|---|---|
| Vitrine com produtos e busca | Loja, catálogo, importação de produtos | Base de produtos de farmácia (código de barras, categorias de higiene, dermocosméticos, medicamentos isentos de receita) |
| Pagamento rápido | Pix e cartão | — |
| **Entrega rápida no bairro** | Forma de envio "entrega própria (motoboy)" | Área de entrega por raio ou bairro, taxa por distância, **prazo prometido** (ex.: até 60 min), fila de pedidos para separar e despachar, aviso "saiu para entrega" |
| Retirada na loja | Parcial | "Compre e retire em 30 minutos" |
| Recompra (uso contínuo) | CRM, carrinho abandonado | Lembrete de recompra ("seu remédio de uso contínuo acaba em 5 dias"), assinatura de produtos recorrentes |
| Fidelidade | Club: pontos, vales, carteirinha | Abrir o Club para a farmácia |
| Atendimento | Assistente da loja (IA) | Regras rígidas: IA **não** indica medicamento; encaminha ao farmacêutico |
| Estoque real | Estoque da loja | Integração com o sistema da farmácia |

**Cuidados a validar com especialista antes de vender:** a venda de medicamentos pela internet tem regras da Anvisa (farmácia licenciada, farmacêutico responsável, limites para medicamentos com receita e proibição para controlados, regras de propaganda de medicamento). O caminho mais seguro para começar é **higiene, beleza, dermocosméticos, conveniência e medicamentos isentos de receita**, com a farmácia como vendedora responsável.

**Concorrência a mapear:** iFood e Rappi (farmácias), apps das grandes redes, programas de fidelidade das redes e dos laboratórios. A pergunta é onde a farmácia de bairro independente perde para eles: **entrega rápida própria sem pagar comissão alta de aplicativo, cliente fiel do bairro e clube local**.

---

## 6. Por que academia e farmácia juntas fazem sentido

- **Serviço recorrente + produto recorrente no mesmo bairro.** O mesmo consumidor treina e compra na farmácia.
- **Benefício cruzado:** o aluno da academia ganha desconto na farmácia (protetor, suplemento, higiene); a farmácia patrocina o desafio da academia e ganha clientes. Cada lado mede o que ganhou (o acerto entre empresas já existe no Club).
- **O bairro vira a unidade do Club:** academia, farmácia, padaria, pet shop e as lojas da NextLevel no mesmo clube local.
- **Captação compartilhada:** o QR code de um parceiro traz cliente para o outro.

---

## 7. Perguntas para o GPT ajudar a aprimorar o racional

1. **Posicionamento:** o NextLevel Club é para o consumidor (app de benefícios do bairro) ou para o negócio (ferramenta de captação e fidelização que vem com um clube)? O que falar primeiro para cada lado?
2. **Ordem de entrada:** começar só por academias (já há cliente) e levar a farmácia como primeiro parceiro do clube local? Ou lançar os dois nichos juntos?
3. **Modelo de receita:** mensalidade do negócio + percentual das vendas + valor por resultado (matrícula, pedido). Faz sentido cobrar algo do consumidor (Club premium)? Quando?
4. **Rede local:** quantos negócios por bairro o clube precisa para o consumidor perceber valor? Como "acender" um bairro?
5. **Farmácia:** qual o produto mínimo (entrega em 60 min, retirada, recompra, clube)? Como competir com iFood e Rappi sem guerra de comissão?
6. **Regulação:** o que o racional precisa prever para farmácia (Anvisa) e para dado de saúde (LGPD)?
7. **Métricas de sucesso** para o piloto de 90 dias em cada nicho.
8. **Nome e marca:** "NextLevel Club" serve para consumidor e negócio, ou o consumidor deve ver a marca do negócio (Clube da Academia X) com "by NextLevel"?

> **Instrução sugerida para colar no GPT:** "Use este resumo como a base do que já existe na plataforma. Aprimore o racional do NextLevel Club aproveitando ao máximo o que já está pronto, aponte o que falta construir em ordem de prioridade, e responda às perguntas da seção 7 com recomendações objetivas, preços de referência e riscos."
