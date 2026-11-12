# BC0: inventário das regras para a base de conhecimento

> Fase BC0 de `docs/prompts/base-de-conhecimento-master.md` (06/11/2026). Decisões do dono:
> - só a equipe do Master vê;
> - o nome no menu é "Aprender".
>
> **Tela no Master (D266):** a base já está em Master → Aprender, com as trilhas por função, as aulas usando os números do sistema, a busca e as Novidades.
> **Contratos no painel (D276):** em Master → Contratos o dono ou o Financeiro cria e envia o contrato (Loja Pronta Express); o lojista recebe um e-mail, aceita no painel com "Li e concordo", e o PDF assinado vai anexado ao e-mail dos dois. O texto fica congelado com impressão digital e o aceite guarda data, IP e aparelho.
> **Pix do contrato (D277):** no contrato, o lojista aperta "Já fiz o Pix" na parcela (sinal ou restante); o aviso não marca como pago. No Master → Contratos aparece "Pix para conferir": confira no extrato do Itaú e aperte "Confirmar recebimento" (entra no caixa) ou "Não encontrei" (o cliente é avisado).
> **Cortesia no teste (D278):** para dar meses grátis, use Master → Receita → Caixa → Assinaturas → Estender (até 90 dias por vez). A loja aparece como "Cortesia" até a data, o cliente vê "Grátis (cortesia da NextLevel) até…", e a cobrança só começa depois.
> **Termos de uso da plataforma (D279):** todo dono de loja da E-commerce aceita os termos de uso no primeiro acesso ao painel; sem o aceite, o painel não abre. O texto fica em /termos e em Master → Contratos você vê quem já aceitou.
> **Janela de saída (D280):** quem vai sair do site da E-commerce vê uma janela para deixar o e-mail (com concordância); o contato aparece no CRM do Master como interessado da janela de saída. Na loja, o lojista escolhe em Aparência → Cupom de boas-vindas → "Quando abrir" se a janela abre depois do tempo, ao sair ou nos dois casos.
> **Domínio novo (D281):** a E-commerce vai passar para nextlevelcommerce.com.br. O endereço antigo continua funcionando e leva ao novo; quem já tem conta entra de novo com o mesmo e-mail e senha.
> **Temas para Nuvemshop (D282):** a página /temas-nuvemshop do site da E-commerce mostra as lojas que a NextLevel criou, com o racional de cada uma e o botão para visitar, a direção para semijoias e o pedido de diagnóstico gratuito. Use-a para o cliente da Nuvemshop que quer um layout melhor.
> **Nossos clientes (D283):** a página /clientes (menu "Clientes") mostra as marcas que a equipe NextLevel atende e os melhores templates. Ela não diz que essas lojas rodam na plataforma; quando um cliente migrar, ganha o selo "Na NextLevel E-commerce".
> **Lembrete de parcela (D284):** o sistema avisa o cliente por e-mail 2 dias antes e no dia do vencimento de cada parcela do contrato, e avisa a NextLevel quando uma parcela vence sem \"Já fiz o Pix\".
> **Retorno do bônus (D275):** em Bônus e metas, cada campanha mostra lojas novas, receita nova por mês, custo, custo por loja e em quantos meses a margem paga o bônus (depois da comissão de 28%), com sugestão automática de ajuste e conferência com o extrato.
> **Painel do executivo no celular (D274):** meta da semana, comissão e nível no topo; botões Nova venda, Registrar visita, Meu link e Mostrar a demonstração; agenda de retornos e testes acabando; ranking de visitas; argumentos de bolso. Missões da rua contam visitas e demonstrações; o dono define a meta semanal de cada executivo e vê o feed da equipe.
> **Executivos de venda (D273):** equipe de rua cadastrada pelo dono; venda em dinheiro ou maquininha libera a loja na hora com recibo no WhatsApp; dinheiro entregue em 2 dias úteis (atraso trava novas vendas em dinheiro); prestação de contas no Master lança no caixa; aula "Executivos de venda" na trilha Parceiros.
> **Página pública de comissões e bônus (D272):** /parceiros/comissoes explica toda a regra com os números de hoje; use-a para responder parceiro com dúvida.
> **Missões, sequência, selos e ranking (D272):** cartão "Sua semana" no painel do parceiro, sem dinheiro; missões por público (online e rua), sequência de semanas com venda, 9 selos e ranking separado por público; aula "Missões, sequência, selos e ranking" na trilha Parceiros.
> **Bônus gamificado (D271):** campanhas semanais e mensais ligadas pelo dono, diferentes para online e rua; só a 1ª venda de cada loja, depois da garantia; pontos pelo valor pago; teto de custo por loja e orçamento por período; aula "Bônus gamificado" na trilha Parceiros.
> **Contas de destino e vínculo (D270):** todo lançamento diz para qual conta foi (dinheiro com o Mauricio, Mercado Pago Mega Tron, Pix Itaú CNPJ, Pix Nubank CPF) e toda entrada é ligada a assinatura, template, serviço ou outros com descrição.
> **Receber assinatura e formas de pagamento (D270):** checkout online, maquininha do Mauricio, maquininha com vendedor, Pix na chave do CNPJ e dinheiro; receber à mão renova, libera, comissiona e lança no caixa; aba Assinaturas com vencimentos e ações; aula "Receber assinatura" na trilha Financeiro.
> **Caixa do Master (D269):** o caixa abre e fecha por dia (dono e Financeiro), cada lançamento guarda meio e origem, edição e estorno sempre com motivo, Mercado Pago entra sozinho; aula "Caixa do dia" na trilha Financeiro.
> **Perguntas e progresso (D267):** cada aula termina com 3 perguntas (números ao vivo, correção no servidor); a pessoa vê o próprio progresso por trilha, o dono vê "quem está pronto" na aba Equipe e quem tem aula pendente recebe um card na tela Agora.
>
> **Base ao vivo (D264):** toda atualização publicada entra aqui (regra, valor, estado e decisão); um teste impede publicar decisão nova sem registro.
>
> **Para o dono revisar:** marque o que está errado, o que falta e o que não deve entrar.
>
> **Legenda:**
> - **No ar**: funciona hoje no sistema.
> - **Aprovado**: o dono aprovou, mas falta conferir ou construir.
> - **Em breve**: planejado.
>
> **Fonte:** onde a base vai ler o número ao vivo (BC1). Os valores abaixo são os de hoje (06/11/2026).

---

## Trilha 1: Base (para todos)

### 1.1 O que é a NextLevel
| Regra | Estado | Fonte |
|---|---|---|
| A NextLevel é um grupo de marcas. O Master hoje está focado na **NextLevel E-commerce** (as outras marcas não foram apagadas, só estão fechadas no Master) | No ar | `MASTER_MARCAS_ATIVAS`, manual do Maurício |
| Posicionamento: "do Brás, com foco no atacado". Presença no Brás, no Canindé e em São Paulo; experiência com grandes importadores | No ar | D220 (seção "Vivência de rua") |
| A plataforma vai ser especialista em atacado: "NextLevel E-commerce de Atacado" | Em andamento (AT0 a AT2 no ar) | D257 a D259 |

### 1.2 Planos da E-commerce
| Regra | Valor hoje | Estado | Fonte |
|---|---|---|---|
| Mensal | Start R$ 57 · Pro R$ 147 · Scale R$ 347 | No ar | versão de preço do catálogo (D220) |
| Anual (por mês) | R$ 37 · R$ 119 · R$ 297 | No ar | idem |
| Depois da Black (a partir de 01/12/2026) | mensal R$ 67 / 167 / 397; anual R$ 49 / 139 / 339 por mês | No ar (agendado) | `revisao-d228.ts` (D229) |
| Quem assina na Black mantém o preço enquanto a assinatura estiver ativa | — | No ar | D227, D229 |
| Produtos ativos | 300 / 1.000 / sem limite | No ar | `beneficios-plano.ts` (editável no Master) |
| Pessoas no painel (contando o dono) | 3 / 6 / 12 | No ar | idem |
| Tema pago | não / sim / sim | No ar | idem |
| Suporte | chat e WhatsApp / prioritário em até 4 h / gerente de conta | No ar | idem |
| Migração | paga à parte / 50% de desconto / inclusa | No ar | idem |
| Maurício IA por mês | 40 / 350 / 1.200 usos | No ar | cotas da IA (D244) |
| Chat da loja com IA | Start só com a chave do próprio lojista; Pro e Scale inclusos na cota | No ar | D243, D244 |
| Ao cair de plano, ninguém perde nada: só não cadastra coisas novas acima do limite | — | No ar | D247, D258 |
| Sem plano ativo, vale o Start | — | No ar | `planoDaLoja` |
| Sem fidelidade; mensal ou anual | — | No ar | manual do lojista |
| Oferta de entrada: 3 dias grátis; o 1º mês especial só existe se o Master criar | — | No ar | `commerce-plans.ts` (D233) |
| Preço novo vale para quem assinar depois; quem já assinou mantém o contratado | — | No ar | manual do Master |

### 1.3 Taxa zero e as palavras certas
| Regra | Estado | Fonte |
|---|---|---|
| **Taxa zero da plataforma** sobre as vendas, em todos os planos | No ar | D220, D221 |
| As taxas do Mercado Pago (Pix e cartão) são à parte e não têm nada a ver com a NextLevel. Sempre lembrar isso | No ar | D221 |
| Frase do topo: "A única com taxa zero no checkout do Mercado Pago" | No ar | D221 |
| Nunca: "a única plataforma com taxa zero", "nada sobre as vendas", "100% das vendas na sua conta" | Regra | D221 |
| Nunca "mais barato". Usar "mais vantajoso", "preço mais competitivo", "vencer no preço" | Regra | D220 |
| Nunca inventar dado, cliente, depoimento ou número. Só anunciar o que existe no sistema; o que não existe é "em breve" | Regra | D221, skill `pagina-de-vendas` |

---

## Trilha 2: Comercial, venda direta (lojista)

| Regra | Valor hoje | Estado | Fonte |
|---|---|---|---|
| Funil comercial: cada pessoa aparece uma vez, do contato ao pagante; as etapas andam sozinhas | — | No ar | Master → Comercial |
| Meta de pagantes e mensagens prontas editáveis (vale na hora para a equipe) | — | No ar | Comercial → Meta e mensagens |
| Comparativo: taxa máxima dos concorrentes usando o Mercado Pago | Nuvemshop 2%, Shopify 2%, WBuy 1,5%, Tray 1,25%, Loja Integrada 0,99% | No ar (sites oficiais, 29/10/2026) | D221 |
| Comparamos o **custo total** (mensalidade + taxa). Nos planos de entrada a Loja Integrada (e a WBuy no avançado) tem mensalidade menor: não dizer que somos menores na mensalidade | — | Regra | D221 |
| Os concorrentes também zeram a taxa com o pagamento deles: dizer isso com honestidade | — | Regra | D220 |
| Placar da goleada: só mostra o que vencemos; o jogo que deixa de ser vitória sai do ar sozinho | — | No ar | D226, D230 |
| **Black NextLevel:** até 30/11/2026 às 23h59 (Brasília). O Master pode prorrogar, nunca encurtar | — | No ar | D229 |
| Anual na Black: paga 10, leva 12 (2 meses grátis) | — | No ar | D229 |
| Kit Black para a loja do lojista, em 1 clique | — | No ar | D242 |
| Domínio próprio liberado em todos os planos, com passo a passo e verificação | — | No ar | D234 |
| E-mail com o domínio: caminho grátis guiado (Zoho Mail, conta do lojista). "Marca Completa" pago fica bloqueado | — | No ar | D245 |
| Cliente que indica ganha 1 mês grátis por indicação paga | — | **Aprovado (D226): conferir se está no ar** | D226 |

---

## Trilha 3: Comercial, parceiros (regra única, D260)

| Regra | Valor hoje | Estado | Fonte |
|---|---|---|---|
| Perfis | Indico pelo CPF, Criador, Vendedor e Agência; a comissão segue o documento (CPF ou CNPJ) | No ar | `captacao-regras.ts` (D263) |
| Comissão | Toda mensalidade paga, desde a 1ª, enquanto o cliente ficar. CNPJ (criador, vendedor, agência): 20% / 24% / 28%. CPF (Programa de Indicações): 15% / 19% / 23% | No ar | `revisao-d260.ts`, `DESCONTO_CPF_BPS` (D263) |
| Agência | Só com CNPJ; tem benefícios exclusivos (a página não detalha) | No ar | D263 |
| Níveis | 20% (até 9 clientes ativos), 24% (10+), 28% (25+), sobre a carteira inteira | No ar | `niveis-regras.ts` |
| Sobe e desce | Sobe na hora; desce só depois de 2 meses seguidos abaixo do mínimo | No ar | `MESES_PARA_DESCER` |
| Plano anual | O percentual sobre o valor pago no ano | No ar | D260 |
| Sem Black, sem bônus | Nenhuma campanha muda a regra; o desafio do mês é só reconhecimento | No ar | D260 |
| Garantia | 30 dias antes de liberar o saque | No ar | regra de comissão |
| Saque | Por Pix, mínimo de R$ 50, com CPF ou CNPJ | No ar | configuração do Master |
| Link | Vale por 90 dias; o cupom tem prioridade | No ar | configuração do Master |
| Inativo | 6 meses de cadastro, sem cliente ativo e sem comissão | No ar | D250 |
| Comparativo com os concorrentes | Shopify (destaque: US$ 25 uma vez por loja do Brasil), Nuvemshop, Tray (20%), WBuy; Loja Integrada fora por escolha do dono | No ar | `PROGRAMAS_CONCORRENTES` (D262) |
| Argumento do CPF | Recebe no CPF, por Pix, sem abrir empresa; WBuy exige CNPJ e nota | No ar | `BARREIRA_CNPJ` (D262) |
| Tom das comparações | Agressivo, sempre com fato, fonte e data | Regra fixa | D261 |
| Fixar nível | Master, com motivo obrigatório e auditoria | No ar | D249 |
| CRM de parceiros | Funil, ficha, fila, ranking, segmentos, avisos e desafio do mês | No ar | D251 |
| Página própria do parceiro (/i/nome) | — | Em breve (PV5) | D227 |

---

## Trilha 4: Atacado

| Regra | Valor hoje | Estado | Fonte |
|---|---|---|---|
| Modalidades do Brás | grade fechada, pacote sortido, mix da loja toda, peça avulsa, pedido do balcão e WhatsApp | Racional | prompt do atacado |
| Motor único de preço | o mesmo cálculo na loja, no carrinho, no pedido, na proposta e no balcão; o servidor sempre recalcula | No ar | D257 |
| Peça avulsa | menor entre varejo, faixa do modelo e preço de atacado (quando o mix libera); nunca abaixo do custo ou do mínimo | No ar | `atacado-preco.ts` |
| As peças das grades contam para o mix; caiu abaixo do mínimo, volta ao varejo | — | No ar | D257 |
| Start | 3 faixas, 1 grade por produto, 1 regra de mix (por peças), sem pacote | No ar | `LIMITES_ATACADO` |
| Pro | 5 faixas, 4 grades, 3 regras (peças e valor), com pacote | No ar | idem |
| Scale | 5 faixas, grades sem limite, 6 regras (todos os tipos) | No ar | idem |
| Box do produto | escada de preço, barra do mix, "a partir de… a peça" no card, economia no carrinho | No ar | D259 |
| SuperDrop (loja de rede) | sem atacado; nada muda | No ar | D216 |
| Grade livre (matriz cor × tamanho), cores do produto, mínimo por modelo e múltiplos (Pro e Scale; cores em todos) | `atacado-modelo.ts`, `salvarRegraDoModelo`, `salvarCoresDoProduto` | No ar (D268) | prompt do atacado |
| Excursão e retirada, romaneio, recompra, tabelas por cliente, catálogo fechado | — | Em breve (AT4 a AT8) | prompt do atacado |

---

## Trilha 5: Suporte ao lojista

| Regra | Estado | Fonte |
|---|---|---|
| Ver o painel como o lojista: informar o motivo (fica registrado); começa só olhando; "Agir em nome do cliente" é um passo a mais | No ar | manual do Master |
| Os 19 passos do manual do lojista (produto, planilha, variações, publicar, Mercado Pago, frete, tema, domínio, pedido, cupom, equipe, integrações…) | No ar | `manual.ts` (esfera lojista) |
| Responder conversas: ao responder, você assume; no fim marque Ganha ou Perdida | No ar | manual do Master |
| Domínio que não conecta sozinho cai na fila "Domínios próprios aguardando conexão" | No ar | D234 |
| Chave de IA do lojista: guardada criptografada, nunca aparece na tela; aviso aos 80% da cota | No ar | D243, D244 |
| Direito de arrependimento do comprador: 7 dias após receber | No ar | manual do comprador |

## Trilha 6: Financeiro

| Regra | Estado | Fonte |
|---|---|---|
| Receita mensal soma os planos ativos (o anual dividido por 12) | No ar | Master → Receita |
| Cortesia é acesso dado à mão, sem contrato: não conta como pagante | No ar | manual do Master |
| Vencidas e aguardando pagamento aparecem primeiro; chamar pelo WhatsApp na tela Agora | No ar | manual do Master |
| Comissões: em garantia, disponíveis (depois de 30 dias) e saques | No ar | D248 |
| Recebimento dos planos: precisa do Mercado Pago da NextLevel conectado | No ar | manual do Master |
| Benefícios por plano: só comercial e financeiro editam, com auditoria | No ar | D247 |

## Trilha 7: Conteúdo

| Regra | Estado | Fonte |
|---|---|---|
| Todas as regras de texto da Trilha 1.3 | Regra | D220, D221 |
| Fotos reais da equipe NextLevel; nunca foto genérica para tapar buraco | Regra | skill `pagina-de-vendas` |
| Selos próprios com prompt de imagem; selos de terceiros (Google, Reclame Aqui, Mercado Pago) só com o material oficial | Regra | D221, `SELOS-E-PROVAS.md` |
| Anúncio só do que existe no código; diferenciar "disponível", "demonstração" e "em breve" | Regra | skill `pagina-de-vendas` |

---

## Fora da primeira versão (entram depois, como trilhas próprias)
- **SuperDrop** (rede, Central, recarga) e **Brás Digital**: decisão 4 do prompt.
- **Equipe técnica** (Render, chaves, deploy): não é treinamento de funcionário.

## Aprovado pelo dono (06/11/2026, D265)
- **Trilhas por função:**

  | Função | Trilhas |
  |---|---|
  | Comercial | 1 a 4 |
  | Suporte | 1, 4 e 5 |
  | Financeiro e Contador | 1, 3 e 6 |
  | Conteúdo | 1 e 7 |
  | Dono | todas |

  A trilha 1 (Base) é obrigatória para todos.
- **"Cliente indica = 1 mês grátis":** entra como "em breve" até ser ligado.
- **Regras faltando:** nenhuma apontada pelo dono nesta revisão.
