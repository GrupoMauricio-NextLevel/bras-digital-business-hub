# NextLevel Commerce: regras do negócio e racional de funções

> 2026-10-02. **Substitui o enquadramento "vencer Nuvemshop/Wbuy"** de `estrategia-plataforma-vs-concorrentes.md` (a análise de preços de lá continua útil como referência, não como meta). Decisão do dono: **não competir com gigantes; a vantagem é a proximidade com os lojistas do Brás; o papel é entregar um sistema bem feito, que rode liso; o painel de controle é o diferencial.** Itens marcados *(proposta)* aguardam aceite e viram D42.

## 1. Posicionamento
- **Quem somos:** a tecnologia da loja do lojista do Brás, feita por quem conhece o dia a dia dele (atacado, grade, camisa de time, fornecedor, WhatsApp, Pix, frete).
- **Promessa:** loja simples de operar, que não cai, com um painel que diz **o que fazer hoje**.
- **O que NÃO prometemos:** o maior ecossistema de apps nem o menor preço. Quem precisa disso vai para os gigantes; tudo bem.

## 2. Regras do negócio *(proposta, para o dono aceitar ou ajustar)*
**R1. Quem paga o quê.** O lojista paga **mensalidade previsível** (plano) e, só quando vender com fornecedor da rede, uma **taxa por pedido** sobre o produto do fornecedor. Venda de produto próprio: taxa zero ou mínima. Valores definidos no Master (`platform_settings`), nunca fixos no código; ver faixas em `racional-global-negocio.md` e `estrategia-plataforma-vs-concorrentes.md` seção 3.
**R2. Dinheiro nunca passa pela NextLevel.** Venda e recarga vão para a conta Mercado Pago do lojista/fornecedor; a NextLevel cobra só o que é dela (plano, taxa) por fatura. Mantém simples e evita virar instituição de pagamento.
**R3. Teste de 7 dias, sem cartão, uma vez por CPF/CNPJ** (já existe). Depois, bloqueio gradual (aviso, bloqueio parcial, suspensão), nunca apaga dado.
**R4. Preço travado por 12 meses** para quem já contratou (já existe `priceLockMonths`); mudança de tabela só vale para novos contratos.
**R5. Fornecedor entra barato, ganha com volume** (sem mínimo pesado no começo; planos por capacidade).
**R6. Parceiros e influenciadores ganham por resultado recorrente**, com garantia de 7 dias e pagamento semanal; sem multa de inatividade.
**R7. Um lojista nunca vê dado de outro** (isolamento por tenant, já testado). Pagamento só vale depois de conferido na API do Mercado Pago.
**R8. Nada de promessa de ganho** em tela, e-mail ou material de venda.
**R9. Cada função nova só entra com teste e sem derrubar o que já funciona**; SuperDrop em produção não muda sem teste.
**R10. Suporte humano é serviço pago/priorizado**; o resto resolve por tela de ajuda, Academy e checklist (não pode custar mais que o plano).

## 3. Racional de funções, em camadas
### Camada 1: "Rodar liso" (não negociável)
Sem isto nada mais importa. Critérios objetivos:
- Páginas da loja carregam rápido no celular (meta a medir: Lighthouse desempenho ≥ 85, a validar no e2e).
- Checkout nunca perde pedido: pagamento conferido na API, idempotência, reserva de estoque com expiração (já existe).
- Falha de provedor (Mercado Pago, frete, e-mail) **degrada com aviso**, não quebra a loja.
- Backups e banco: Neon com histórico; plano pago do Render sem hibernar.
- Observabilidade: erro registrado com contexto e visível no Master (hoje parcial: falta painel de erros).
- Deploy seguro: skill `publicar` (tipos, lint, testes, build) e CI.

### Camada 2: Painel de controle (o diferencial)
Princípio: **o painel não mostra números, mostra decisões.** Cada tela responde "o que eu preciso fazer agora?".
- **Para o lojista ("Minha loja")** — já existe: pendências por etapa, checklist "no ar", análise de vendas (margem, ticket, recompra, mapa de calor). **Construir:** "Fila do dia" (pedidos para pagar/etiquetar/responder, estoque acabando, carrinho parado, cliente sem resposta) com um botão de ação em cada item, e "saúde da loja" explicada em linguagem simples (reaproveita `healthScore`).
- **Para o Master** — já existe a Torre de Controle (`control-tower.ts`: pontuação de saúde 0–100 com motivos, alertas por gravidade, Commerce hub, checklist de lançamento). **Construir:** filtro por marca em tudo (pendente), funil de ativação (cadastro → loja publicada → 1ª venda), lojas em risco com ação ("ligar", "mandar WhatsApp", "oferecer serviço").
- **Para o fornecedor/atacadista** — esteira, ondas, corte, etiquetas (já existem).
- Regra de ouro: todo número tem um "e daí?" (ação sugerida) e leva à tela que resolve.

### Camada 3: Proximidade com o Brás (onde a gente é único)
- Grade de tamanhos e camisas de time, importação por planilha, preço de atacado/varejo no mesmo catálogo, pedido por WhatsApp, página do fornecedor (`/f/[slug]`), Academy e serviços "feitos para você", parceiros/influenciadores da própria comunidade.
- Isso orienta a **ordem**: primeiro o que o lojista do Brás usa todo dia, depois o resto.

## 4. Ordem de funções *(proposta)*
1. **Vender sem atrito:** cupom de desconto (P1d), etiqueta + rastreio automático (P1b), pedido manual/WhatsApp redondo, assistente de domínio.
2. **Painel de controle v1:** Fila do dia do lojista, saúde da loja, funil de ativação e lojas em risco no Master, filtro por marca.
3. **Atacado B2B** (preço por faixa, mínimo, aprovação, pedido por planilha): é o que mais casa com o Brás.
4. **Crescimento:** SEO, pixels, carrinho abandonado.
5. **Ampliar:** mais formas de pagamento, avaliações, influenciadores, feed/live (só quando 1 a 4 estiverem dando receita).
Visual (Codex) acompanha cada etapa; ele não decide ordem.

## 5. O que já existe e dá para aproveitar (resposta à pergunta "o que mais do SuperDrop?")
Inventário completo em `aproveitamento-superdrop.md`. Além do núcleo de loja, o que **mais vale levar** para o Commerce:
| Do SuperDrop | Como vira valor no Commerce |
|---|---|
| **Torre de controle e saúde das lojas** (`control-tower.ts`) | Base do painel diferencial: pontuação, alertas e "o que fazer" |
| **Esteira de expedição, ondas, corte, etiquetas** | Módulo de expedição também para lojista com estoque próprio |
| **Carteira + recarga por Pix** | Saldo para comprar etiqueta de frete e pagar fornecedor |
| **Rede de fornecedores e catálogo compartilhado** | "Escolha produtos prontos de fornecedores do Brás" (diferencial) |
| **Página do fornecedor `/f/[slug]` e cupom** | Vitrine de captação do atacadista |
| **Pós-venda por chat** | Atendimento dentro do painel |
| **Parceiros (afiliados)** | Canal de aquisição de lojistas e base dos influenciadores |
| **Importação por planilha, grades de tamanho** | Entrada rápida de catálogo; camisas de time |
| **Teste de 7 dias, bloqueio e cobrança por Pix, trava de preço** | Ciclo de vida do cliente já pronto |
| **Serviços (tabela de serviços) e Loja NextLevel/CRM** | Receita extra: "monto sua loja"; funil de vendas no Master |
| **Academy (existe como add-on `ACADEMY_STORE`)** | Conteúdo precisa ser conferido/produzido; reduz suporte |
| **Eventos de domínio, e-mail transacional** | Base de automações (avisos, régua de cobrança) |
| **Temas**: Starter, Arena, Editorial, Signature + editor | O tema básico do SuperDrop é o ponto de partida das lojas (decisão do dono) |

## 6. Memória do projeto: o que reaproveitar
- `docs/prompts/nextlevel-commerce-plataforma.md`: missão, personas, módulos (seção 5), fases N0–N10, riscos, **GTM do Brás (seção 7)**. Continua válido; as fases N2 (frete, pagamento) e N7 (atacado) coincidem com a ordem acima.
- `docs/prompts/promessas-commerce.md`: especificação detalhada de P0–P6 (conta simples ✔, frete ✔ parcial, atacado, influenciadores, feed/live, tema v2).
- `docs/prompts/fornecedor-360-master.md` e `email-transacional.md`: **base do painel de controle e das automações**; ainda não executados.
- `docs/prompts/programa-parceiros.md`, `editor-templates-evolucao.md`, `imagens-*`: já alimentam parceiros, temas e divulgação.
- `docs/design/DECISIONS.md` (D1–D41) e `RACIONAL-VISUAL-V3.md`: regras já decididas.
- `docs/nextlevel-commerce/racional-global-negocio.md`: preços e riscos; **revisar à luz da decisão de não competir por preço**.

## 7. O que preciso do dono para fechar as regras
1. R1 (quem paga o quê): aceita "mensalidade previsível + taxa só em produto de fornecedor da rede"? Qual faixa de mensalidade faz sentido para o lojista do Brás (ex.: grátis / ~R$70 / ~R$100 / ~R$200)?
2. Quantos lojistas do Brás você consegue levar nos primeiros 90 dias (para dimensionar suporte)?
3. O lojista do Brás vende mais **varejo, atacado ou os dois**? (muda a prioridade do B2B.)
4. O que na **Fila do dia** você mais quer ver primeiro? (pedidos, estoque, pagamentos, clientes sem resposta…)
5. Painel do Master: o que **você** olha toda manhã para saber se o negócio vai bem?
