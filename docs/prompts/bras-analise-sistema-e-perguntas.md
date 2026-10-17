# Brás Digital Club: análise do sistema inteiro e perguntas para a próxima fase

> 17/10/2026. Pedido do dono: "o Brás Digital ficou muito grande; destrinchar, entender os participantes e aperfeiçoar o sistema
> inteiro". Base: código atual (D91 a D158), regras no Master e o novo posicionamento proposto pelo dono. Nada aqui muda o
> sistema: é diagnóstico, proposta e perguntas. As decisões entram depois, uma a uma, em `docs/design/DECISIONS.md`.

## 0. Decisões do dono (17/10/2026, D159)
1. **Sentido do Club:** compra coletiva entre empresas verificadas (seção 2B). Pontos são detalhe.
2. **Modelo:** rede aberta com aprovação: fornecedores se cadastram, são aprovados no Estúdio e aparecem pelo nome, por categoria; o comprador pede cotação a vários.
3. **Públicos:** os quatro compradores com CNPJ entram desde o início (lojista do interior, marketplace profissional, marketplace iniciante, distribuidor regional). O revendedor sem CNPJ (C4) segue em aberto.
4. **Receita no começo:** plano do fornecedor, plano do comprador, frete e serviços, e comissão sobre pedido. Como a comissão só não vaza com o pagamento passando pela plataforma, **o pagamento integrado sobe de prioridade** (fase F5 vira parte do núcleo, logo depois da cotação).

## 1. Resumo em uma página

**O que existe hoje.** Em 10 dias o Brás virou um ecossistema: 47 telas em 6 áreas (Estúdio no Master, Meu Brás, painel
da importadora, painel da transportadora, balcão por link, balcão do Club), 38 tabelas próprias (14 da Brás, 14 de cargas e
excursão, 10 do Club), cerca de 5.200 linhas de regra de negócio e 28 arquivos de teste. Está no ar em
`bras.nextlevelgroup.com.br`, com cadastro aberto, e o domínio `brasdigitalclub.com.br` foi comprado.

**O modelo construído** é de **curadoria intermediada**: a equipe NextLevel descobre o produto na importadora, grava o vídeo,
faz a análise de mercado, esconde o nome da importadora, recebe o pedido do comprador, confirma à mão por WhatsApp, a
importadora recebe o dinheiro inteiro e paga a comissão por fora. Isso funciona com poucas importadoras e uma equipe
dedicada; não escala sozinho.

**O posicionamento novo** ("a rede de abastecimento de quem compra para revender": encontrar importadoras, distribuidores e
atacadistas por categoria, pedir cotações, comparar condições; fornecedor recebe solicitações) é outro modelo: **rede aberta
de dois lados**, em que os fornecedores se cadastram sozinhos e são encontrados, e os compradores pedem cotação a vários.

**Os dois modelos se chocam em três pontos** que precisam de decisão antes de qualquer tela:
1. **Nome da importadora:** hoje é escondido até o pedido confirmado (protege a comissão). No modelo novo, encontrar e
   comparar fornecedores pressupõe mostrar quem é.
2. **Como a NextLevel ganha:** hoje, comissão paga por fora pela importadora (frágil: depois do primeiro pedido o comprador
   conhece a importadora e pode comprar direto). No modelo novo, o mais sólido é cobrar de quem recebe valor de forma
   recorrente (assinatura e destaque do fornecedor, créditos de cotação), e comissão só onde a NextLevel controla o fluxo
   (pagamento, frete, contêiner).
3. **Quem trabalha:** hoje a equipe faz tudo (gravar, analisar, confirmar, atender). No modelo novo o sistema faz a ponte e a
   equipe vira curadora e vendedora de serviços.

**Recomendação central:** manter o que dá diferencial (conteúdo de descoberta, análise, logística, contêiner) como
**camadas de serviço pagas**, e construir por baixo o **núcleo de rede** (cadastro dos dois lados, diretório por categoria,
pedido de cotação, resposta, reputação). Congelar o que depende de volume que ainda não existe. Detalhes nas seções 6 a 8.

## 2. Os participantes

| Participante | Quem é | O que quer | O que tem hoje no sistema |
|---|---|---|---|
| **Comprador** (membro) | Vendedor de Mercado Livre e marketplaces, lojista físico ou online, distribuidor de outro estado, já compra no Brás, Canindé e outros polos | Achar produto que gira, preço de atacado, comprar sem viajar, prazo e frete confiáveis | Cadastro grátis com CNPJ (liberado na hora), 7 perguntas de perfil e nível (Iniciante a Grande conta), Meu Brás com descobertas, preço da caixa, pedido, retirada por código, fretes, Meu Contador, indicações e pontos, suporte e planos Prata/Ouro/Platinum (em rascunho) |
| **Fornecedor**: importadora | Importadoras do Brás com estoque em caixa fechada | Vender mais caixas sem prospectar, girar estoque parado, receber pedido certo | Cadastro **feito pelo Master** (sem autocadastro), ficha 360, painel com equipe (dono, comercial, estoque, balcão, financeiro), produtos com faixas de preço, estoque em caixas, galpões, pedidos que só mostram o envio, balcão por link, chamar transportadora, planos Pro/Premium (rascunho) |
| **Fornecedor**: distribuidor e atacadista | Novo no posicionamento | Igual à importadora, muitas vezes sem estoque de contêiner | **Não existe** como tipo; caberia na mesma estrutura da importadora com um campo "tipo de fornecedor" |
| **NextLevel / equipe Brás** | Dono e equipe no Estúdio (Master) | Ser remunerada pelo valor que gera; ter controle da qualidade da rede | Estúdio com 18 telas: pedidos, descobertas e análise, pauta de gravação, membros, importadoras 360, comissões, regras, atendimento, Meu Contador, Club, excursão, transportadoras, empresas do grupo |
| **Transportadora e ônibus de excursão** (NextLevel Cargas) | Quem leva as caixas do Brás para o Brasil | Carga na rota, sem caminhão vazio | Painel da transportadora (7 telas), cargas chamadas pela importadora, rotas, viagens e fardos do ônibus, frete por Pix (desligado), comissão por carga nas regras |
| **Contador parceiro** | Meu Contador | Atender membros com nota fiscal | Chamados no Meu Brás e fila no Estúdio |
| **Indicadores** | Membros, importadoras, transportadoras e parceiros | Ganhar por trazer gente | Club: códigos, indicações, pontos, vales, cartão no balcão das empresas do grupo, ranking |

## 2A. Públicos-alvo em detalhe (hipóteses para validar)

O cadastro já pergunta momento, canais, compra mensal, faturamento, experiência com importação, equipe e objetivos (D108).
Depois do lançamento, esses dados confirmam ou derrubam as hipóteses abaixo; hoje elas vêm do que o sistema foi pensado
para atender e do que se vê no Brás e no Canindé.

**Compradores (quem compra para revender)**

| Perfil | Como compra hoje | Dor principal | Quanto compra | O que faria pagar | Onde encontrar |
|---|---|---|---|---|---|
| **C1. Vendedor de marketplace iniciante** (MEI, vende no Mercado Livre e Shopee) | Vai ao Brás de vez em quando ou compra de quem revende; pouca caixa | Não sabe o que gira; medo de encalhar; pedido mínimo alto | 1 a 5 caixas por mês | Análise de produto, pedido mínimo baixo, frete junto | YouTube, Instagram, grupos de vendedores |
| **C2. Vendedor de marketplace profissional** (CNPJ, Full do Mercado Livre) | Compra recorrente de 2 a 5 importadoras conhecidas | Repor rápido; achar novidade antes do concorrente; preço por volume | dezenas de caixas por mês | Alertas de reposição, cotação rápida entre vários fornecedores, contêiner dividido | Comunidades de sellers, eventos, indicação |
| **C3. Lojista físico do interior** (utilidades, presentes, variedades) | Viaja de ônibus de excursão; compra de tudo num dia | Viagem cara e cansativa; não consegue comparar tudo num dia; frete | caixas de vários produtos por viagem | Comprar sem viajar, juntar frete, ver novidade em vídeo | Guias de excursão, ônibus, WhatsApp |
| **C4. Revendedor informal** (sacoleira, revenda por WhatsApp/Instagram) | Excursão e compra pequena | Pouco capital; muitas vezes sem CNPJ | pouco | Preço e mínimo pequenos | Excursão, redes sociais. *Hoje fica de fora (CNPJ obrigatório).* |
| **C5. Distribuidor ou atacadista regional** | Compra pallet ou contêiner e revende a lojistas da região | Margem: precisa de preço de importação | alto | Contêiner fechado ou dividido, pré-compra em alto mar, condição de pagamento | Indicação, visita, feiras |

**Fornecedores (quem vende para quem revende)**

| Perfil | Situação | Dor principal | O que faria pagar |
|---|---|---|---|
| **F1. Importadora grande** (contêineres, showroom, equipe comercial) | Já vende bem no balcão | Alcançar o Brasil todo sem montar equipe; girar o estoque parado | Destaque, cotações qualificadas, relatório de demanda |
| **F2. Importadora pequena ou média** | Estoque parado, sem marketing digital | Achar comprador; depender só do balcão | Receber cotações, vitrine, gravação patrocinada |
| **F3. Distribuidor ou atacadista** (revende de várias importadoras, às vezes no Canindé) | Variedade grande, margem menor | Visibilidade; concorrência com as importadoras | Perfil completo, cotações da categoria |
| **F4. Fábrica nacional** (em aberto) | Produz e vende para lojistas | Canal de atacado | A decidir se entra |

**Quem leva a mercadoria:** transportadoras e **donos de ônibus de excursão e guias**, que já são o canal de confiança do lojista do interior. São parceiros de distribuição (e de captação de compradores), não só frete.

**Leitura:** C2, C3 e C5 têm volume e dor clara de "comprar sem viajar e comparar"; C1 é o que mais cresce, mas compra pouco; C4 é grande, mas exige decidir sobre o CNPJ. No lado dos fornecedores, F2 é o mais fácil de trazer (tem estoque parado e pouca alternativa) e F1 é o que dá credibilidade à rede.

## 2B. Por que "Club": o sentido do nome

"Club" só faz sentido se ser membro der algo que **sozinho a pessoa não consegue**. Três leituras possíveis:

| Leitura | O que o membro ganha por ser do Club | Já existe no sistema | Força |
|---|---|---|---|
| **A. Clube de compra coletiva** | Juntar o volume de muitos compradores pequenos para ter preço, mínimo e frete de comprador grande: contêiner dividido em cotas, cotação coletiva do mesmo produto, frete consolidado na excursão | Contêiner dividido e cotas, cubagem, fardos do ônibus, frete por carga | **A mais forte e mais difícil de copiar**: transforma o pequeno em grande |
| **B. Rede verificada** | Só empresa com CNPJ conferido compra e só fornecedor aprovado vende: confiança dos dois lados, preço de atacado protegido | Cadastro com CNPJ, bloqueio, fronteira de dados | Necessária, mas sozinha não justifica o nome |
| **C. Clube de vantagens** | Pontos, vales, cartão no balcão, benefícios do grupo (contador, frete) | Club do grupo (pontos, vales, cartão) | Fraca se for só pontos; todo programa tem |

**Recomendação:** o sentido do Club é **A + B**: *"o clube de quem compra para revender: empresas verificadas que juntam força
para comprar como grande"*. Os pontos (C) viram detalhe, não a razão. Isso amarra o nome ao que já foi construído
(contêiner dividido, frete consolidado, excursão) e dá um diferencial que a importadora não oferece sozinha no balcão.
Também resolve a confusão com o NextLevel Club: o Brás Digital Club é um clube de **compra**, e o NextLevel Club é o
programa de **pontos** do grupo, que o membro ganha junto.

Consequência prática: no núcleo de cotação (seção 6), uma **cotação coletiva** (vários compradores pedindo o mesmo produto
viram uma cotação maior) é o recurso que mais expressa o "Club"; deve entrar logo depois da cotação simples.

## 3. O que cada área faz hoje (inventário)

**Público:** página da marca (nova identidade D158), página de cada descoberta (`/d/…`), cadastro com CNPJ, termos próprios com aceite versionado, rota `/bras-digital-club`.

**Meu Brás (comprador, 13 telas):** início por nível e momento, descobertas e vídeos, descoberta com veredito/análise, fazer pedido, meus pedidos e comprovante de retirada, fretes e etiquetas, Meu Contador, Indique e ganhe, empresa, perfil, suporte por plano.

**Painel da importadora (7 telas):** hoje (conferir, separar, entregar), pedidos, produtos e caixas, estoque com movimentos e planilha, galpões e equipe, transportadoras, indicações.

**Estúdio no Master (18 telas):** visão geral, pedidos, descobertas e ofertas, pauta, membros, acesso (liberações de plano), importadoras e ficha 360, comissões mensais, atendimento, Meu Contador, Club (indicações, pontos, vales), empresas do grupo, transportadoras, ônibus de excursão, regras editáveis, balcão, romaneio.

**Cargas e Club:** 14 tabelas de transporte (transportadoras, documentos, rotas, viagens, fardos, cargas, avaliações, pagamentos de frete, clientes de confiança, preferências) e 10 do Club.

**Regras editáveis no Master (`bras.v2_rules`):** pré-pedido de alto mar (sinal 30%), cotação de contêiner (7 e 15 dias), contêiner dividido, cubagem, comissão por carga (8%, 6%, 5% por plano), validade do estoque (72 h), limites do grátis, canais de suporte por plano.

**Preços em rascunho (nada cobrado):** membro Prata R$ 97, Ouro R$ 197, Platinum R$ 397; importadora Pro R$ 297, Premium R$ 697; transportadora Pro R$ 147, Premium R$ 397; cotação fora do catálogo R$ 1.500; gravação patrocinada.

**Como o dinheiro anda hoje:** o comprador paga a importadora direto; a NextLevel registra a comissão do mês por importadora (`bd_commission_settlements`) e cobra por fora. Nenhum pagamento passa pela plataforma.

## 4. Diagnóstico: o que está pesado

1. **Frentes demais antes de ter volume.** Alto mar, contêiner dividido, Platinum, ranking por cidade, cartão no balcão, excursão e frete por Pix pressupõem centenas de compradores e dezenas de fornecedores ativos. Hoje elas aumentam a superfície (telas, regras, testes, suporte) sem gerar receita.
2. **A operação depende da equipe.** Cada descoberta é gravada e analisada pela equipe; cada pedido é confirmado à mão; o atendimento é da Brás. Com 4 descobertas por semana (D95) o catálogo cresce devagar e o custo cresce junto com o volume.
3. **O fornecedor não entra sozinho.** A importadora só existe se o Master cadastrar. Num modelo de rede, isso trava o crescimento do lado da oferta.
4. **A remuneração vaza.** Comissão paga por fora e nome revelado no pedido confirmado: a partir do segundo pedido, comprador e importadora podem negociar direto. Esconder o nome protege pouco e contradiz "encontrar fornecedores".
5. **Nomes que confundem.** "Brás Digital Club" (a marca), "Club" (pontos do grupo, NextLevel Club), "Indique e ganhe", planos Prata/Ouro/Platinum, Club+ e Club Total: o comprador não sabe o que é assinatura de quê. "Meu Brás" e "Brás" no nome também limitam a expansão para Canindé, Bom Retiro, 25 de Março e outros polos.
6. **Preço nunca público** foi certo para proteger a importadora, mas no modelo de cotação o preço nasce na resposta à cotação, e o catálogo pode continuar fechado. Isso precisa ser dito com clareza nas duas pontas.
7. **Pedido fora do motor de pedidos.** `bd_requests` é uma tabela própria (exceção registrada na D93) sem pagamento nem reserva; integrar pagamento depois exigirá decidir se migra para `orders`.

## 5. O que está bom e deve ficar

- Cadastro com CNPJ conferido e perfil com nível (base para qualificar quem pede cotação).
- Fronteira de dados do comprador (a importadora vê só o envio): vira regra de privacidade da rede.
- Produtos em caixa fechada com faixas de preço e estoque em caixas com trava contra venda dupla.
- Painel da importadora com equipe e funções; ficha 360 com saúde de 0 a 100.
- Retirada por código, romaneio, transportadoras e frete: diferencial logístico real do Brás.
- Conteúdo de descoberta e análise: atrai compradores e é produto pago possível.
- Regras editáveis no Master e preços no catálogo em rascunho: dá para ligar e desligar sem programar.

## 6. Proposta: três camadas

| Camada | O que é | Para quem paga | Estado |
|---|---|---|---|
| **1. Rede (núcleo)** | Cadastro dos dois lados, diretório por categoria e polo, perfil do fornecedor (categorias, mínimos, condições, prazo, pagamento), **pedido de cotação** distribuído aos fornecedores certos, respostas comparáveis, mensagens, reputação (tempo de resposta, avaliações) | Fornecedor (assinatura, destaque, créditos de resposta); comprador grátis | A construir, reaproveitando ficha 360, produtos, categorias, perfil do membro e mapa de demanda |
| **2. Transação (opcional por fornecedor)** | Pedido pelo sistema, estoque, retirada por código, pagamento (no futuro com repasse automático) | Comissão só quando o pagamento passar pela plataforma | Já existe (pedido manual); pagamento a decidir |
| **3. Serviços** | Descobertas e análise de mercado, frete e excursão, contêiner e alto mar, Meu Contador, gravação patrocinada | Quem usa: plano do comprador (inteligência), taxa por serviço, comissão de frete | Existe em boa parte, congelado até haver volume |

**Fluxo da cotação (núcleo novo):**
1. O comprador diz o que procura: categoria, produto, quantidade em caixas, região de entrega, prazo, forma de pagamento.
2. O sistema envia para os fornecedores daquela categoria (todos ou os N mais bem avaliados, conforme o plano do fornecedor).
3. Cada fornecedor responde com preço por caixa, mínimo, prazo, condição de pagamento e validade.
4. O comprador compara lado a lado e escolhe; o contato ou o pedido acontece a partir da resposta escolhida.
5. Os dois avaliam; tempo de resposta e conversão viram reputação.

## 7. Formas de remuneração (para decidir)

| Alavanca | Quem paga | Resiste a "comprar por fora"? | Observação |
|---|---|---|---|
| Assinatura do fornecedor (perfil completo, receber cotações) | Fornecedor | Sim | Receita previsível; padrão dos diretórios B2B |
| Destaque e anúncio rotulado na categoria | Fornecedor | Sim | Já previsto ("Destaque patrocinado", "Patrocinado") |
| Créditos por cotação respondida ou por contato liberado | Fornecedor | Sim | Cobra por oportunidade real; precisa de limites contra spam |
| Plano de inteligência do comprador (análise, tendências, alertas) | Comprador | Sim | É o Prata/Ouro/Platinum atual, mais focado |
| Comissão sobre pedido | Fornecedor | Só se o pagamento passar pela plataforma | Hoje vaza; exige pagamento integrado |
| Comissão de frete e excursão | Transportadora | Sim (a carga nasce no sistema) | Já nas regras (8%, 6% e 5%) |
| Contêiner dividido, alto mar e cotação fora do catálogo | Comprador | Sim | Serviço da NextLevel; precisa de volume |
| Gravação patrocinada, relatório de demanda por categoria | Fornecedor | Sim | Dados que a rede gera |
| Meu Contador e serviços do grupo | Comprador | Sim | Já existe |

**Recomendação (a confirmar):** comprador entra grátis; fornecedor tem plano grátis limitado e planos pagos; a NextLevel
ganha com assinatura e destaque de fornecedor, plano de inteligência do comprador, frete e serviços. Comissão sobre pedido
só depois que o pagamento passar pela plataforma.

## 8. O que simplificar agora (proposta)

- **Esconder do menu, sem apagar:** alto mar, contêiner dividido, ranking por cidade, cartão no balcão, frete por Pix, Platinum. Tudo continua no código, atrás de chave, para ligar quando houver volume.
- **Um só "Club":** ou o Brás Digital Club é a marca e os pontos viram "Pontos do Club" dentro dela, ou o programa de pontos continua do grupo (NextLevel Club) e some o nome "Club" das telas do Brás.
- **Menus por participante com no máximo 6 itens** na primeira tela; o resto em "Mais".
- **Uma tela inicial por participante** respondendo "o que eu faço agora?": comprador (cotações abertas, respostas novas, pedidos), fornecedor (cotações para responder, pedidos, estoque velho), equipe (fornecedores para aprovar, cotações sem resposta, pedidos parados).

## 9. Roteiro sugerido (depois das respostas)

| Fase | Entrega | Resultado |
|---|---|---|
| **F0** | Decisões das perguntas abaixo; D159 | Modelo fechado |
| **F1** ✅ (D160) | Nova página pública com as duas portas ("Quero comprar no atacado" e "Quero fornecer"), **autocadastro do fornecedor** com tipo (importadora, distribuidor, atacadista), polo e categorias, aprovação no Estúdio | Os dois lados entram sozinhos |
| **F2** ✅ (D160, no Meu Brás) | Diretório por categoria e polo, perfil público do fornecedor (o que for liberado) | O comprador encontra fornecedores |
| **F3** | Pedido de cotação, distribuição, respostas, comparação, mensagens, avaliação | O núcleo da rede funciona |
| **F4** | Planos do fornecedor e destaque ligados no Financeiro Master; plano de inteligência do comprador | A NextLevel passa a receber |
| **F5** | Pedido e pagamento pela plataforma com repasse ao fornecedor (decidido na D159), frete integrado à cotação, **cotação coletiva** | Comissão sem vazamento e o "Club" em ação |
| **F6** | Religar serviços congelados conforme o volume (contêiner, alto mar, excursão) | Diferenciais pagos |

## 10. Texto proposto pelo dono (para a página nova)

> **Brás Digital Club**
> **A rede de abastecimento de quem compra para revender.**
> Encontre importadoras, distribuidores e atacadistas por categoria. Solicite cotações, compare condições comerciais e descubra oportunidades para abastecer seu negócio.
> **Para compradores:** encontre fornecedores para sua próxima compra.
> **Para fornecedores:** receba solicitações de quem procura seus produtos.
> **Botões:** Quero comprar no atacado · Quero fornecer

Observações: o texto está alinhado ao modelo de rede (seção 6) e é verdadeiro **depois da F3**; até lá, "solicite cotações" e
"compare condições" ainda não existem. Sugestão: o título acima vira o título da página e o slogan oficial ("Conecte seu
negócio ao pulso do Brás.") fica como assinatura da marca, no topo e no rodapé. "Brás" no nome e o texto citando "importadoras
do Brás, Canindé e outros polos" deixam a porta aberta para a expansão.

## 11. Perguntas para o dono (responda o que puder; onde houver recomendação, "ok" basta)

**A. Modelo e participantes**
1. A Brás vira **rede aberta** (fornecedores se cadastram e são encontrados pelo nome) ou continua **curadoria** (a NextLevel escolhe e intermedia, nome escondido até o pedido)? *Recomendo: rede aberta, com aprovação do fornecedor no Estúdio.*
2. Quem pode ser fornecedor? **Respondido (D160): importadora, distribuidor e atacadista.** Fábrica nacional segue em aberto.
3. Quais polos entram no começo? **Respondido (D160): o Canindé primeiro.**
4. O comprador continua só com CNPJ? E MEI? *Recomendo: CNPJ obrigatório, MEI aceito.*
5. O fornecedor entra na hora ou passa por aprovação (documentos, visita)? *Recomendo: aprovação no Estúdio, com prazo.*

**B. Cotação e preço**
6. A cotação vai para todos os fornecedores da categoria ou para no máximo N (ex.: 5)? Quem escolhe os N?
7. O comprador vê o nome do fornecedor **na resposta da cotação** ou só depois de escolher?
8. O catálogo com preço continua fechado (só membro logado) ou o fornecedor decide o que mostrar?
9. Pedido mínimo por fornecedor (caixas ou valor) aparece no perfil?

**C. Como a NextLevel ganha** (marque as que valem no começo)
10. Assinatura do fornecedor · destaque na categoria · créditos por cotação · plano do comprador · comissão sobre pedido · frete · serviços (contêiner, alto mar, contador, gravação).
11. A comissão atual paga por fora pelas importadoras continua para quem já está nesse modelo?
12. O pagamento deve passar pela plataforma (com repasse automático ao fornecedor) em algum momento? Prazo?

**D. O que já existe**
13. Concorda em esconder do menu (sem apagar) alto mar, contêiner dividido, ranking, cartão no balcão, frete por Pix e Platinum até haver volume?
14. As descobertas em vídeo e a análise continuam como produto pago do comprador, ou viram conteúdo gratuito de atração?
15. "Club": os pontos do grupo continuam com o nome NextLevel Club, e o Brás Digital Club é só a marca? Ou os pontos viram parte do Brás Digital Club?
16. "Meu Brás" continua como nome da área do comprador?

**E. Lançamento**
17. Quantas importadoras e compradores reais você já tem conversando? Alguma piloto para a cotação?
18. Prioridade: primeiro trazer fornecedores (oferta) ou compradores (demanda)? *Recomendo: fornecedores primeiro, com cotação, porque é o que o comprador procura.*
19. O domínio `brasdigitalclub.com.br` entra no ar junto com a página nova ou antes, com a página atual?

**F. Públicos e o sentido do Club**
20. Dos compradores da seção 2A (C1 a C5), qual é o **primeiro** que você quer atender bem? *Recomendo: C3 (lojista do interior) e C2 (marketplace profissional): têm volume e dor clara.*
21. O revendedor informal sem CNPJ (C4) entra de alguma forma (só com CPF, com limite), ou fica de fora?
22. Concorda que o "Club" significa **compra coletiva entre empresas verificadas** (seção 2B)? Ou o sentido que você imagina é outro?
23. Você já conhece donos de ônibus de excursão e guias que topariam ser parceiros (trazer compradores e levar caixas)?
24. Ticket médio e frequência que você vê hoje nos compradores do Brás e do Canindé (por viagem ou por mês)?
