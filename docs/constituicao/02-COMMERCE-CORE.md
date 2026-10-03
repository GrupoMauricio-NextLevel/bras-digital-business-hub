# 02 — COMMERCE CORE

> **Status:** Documento especializado de engenharia  
> **Autoridade:** Subordinado a `00-CONSTITUICAO-ECOMMERCE.md`  
> **Escopo:** Regras fundamentais de comércio da Plataforma de Lojas Virtuais NextLevel  
> **Não cobre:** UX visual detalhada, Theme Engine, Platform Ops, infraestrutura de deploy ou integrações específicas de provedores

---

## 1. OBJETIVO

Definir o núcleo de comércio que deve permanecer coerente independentemente de:

- tema;
- template;
- segmento;
- plano comercial;
- gateway;
- transportadora;
- canal de venda;
- produto derivado da NextLevel.

Este documento descreve as capacidades que sustentam a operação comercial real da loja virtual.

---

## 2. PRINCÍPIO CENTRAL

O Commerce Core é responsável pela verdade comercial.

Ele deve responder corretamente a perguntas como:

- O que está sendo vendido?
- Qual SKU representa o item?
- Qual preço é válido agora?
- Há estoque disponível?
- Quais regras de compra se aplicam?
- O carrinho ainda é válido?
- Qual frete está disponível?
- Qual é o total real do checkout?
- O pagamento foi aprovado?
- Qual é o estado real do pedido?
- O que já foi separado, enviado, entregue, cancelado ou reembolsado?

O storefront e o painel apresentam essas respostas.

Eles não inventam essas respostas.

---

# PARTE I — CATÁLOGO

## 3. PRODUTO, VARIAÇÃO E SKU

A plataforma deve distinguir claramente:

### Product

A entidade comercial apresentada ao consumidor.

Exemplo:

`Camisa Retrô 1995`

### Variant

Uma combinação comercial de atributos.

Exemplo:

`Tamanho G`

ou:

`Cor Preta + Tamanho G`

### SKU

A unidade identificável para operação e estoque.

Exemplo:

`RETRO95-PRETO-G`

Esses conceitos não devem ser fundidos apenas porque um produto simples possui uma única variante.

---

## 4. IDENTIDADE DO PRODUTO

Um produto deve poder possuir, quando aplicável:

- id interno;
- nome;
- slug;
- descrição;
- descrição curta;
- status;
- marca;
- categorias;
- coleções;
- tags;
- atributos;
- mídia;
- informações de SEO;
- regras de publicação;
- dados logísticos;
- datas relevantes;
- metadados controlados.

Nem todo campo precisa estar na mesma tabela.

O modelo deve favorecer composição e integridade.

---

## 5. ATRIBUTOS

Atributos podem servir diferentes funções.

Exemplos:

- tamanho;
- cor;
- material;
- modelo;
- gênero;
- temporada;
- time;
- marca;
- voltagem;
- capacidade.

O sistema deve distinguir, quando necessário:

- atributo de variação;
- atributo descritivo;
- atributo filtrável;
- atributo exibível;
- atributo interno.

Não assumir que todo atributo gera SKU.

---

## 6. VARIANTES

Uma variante representa uma combinação vendável.

Ela pode possuir:

- preço próprio;
- SKU próprio;
- estoque próprio;
- mídia própria;
- peso/dimensões próprios;
- status próprio;
- barcode;
- identificadores externos;
- ordem de exibição.

A variante deve continuar pertencendo ao mesmo produto.

---

## 7. SKU

SKU deve ser único dentro do escopo definido pela plataforma.

Ele deve ser tratado como chave operacional importante para:

- estoque;
- importação;
- exportação;
- integrações;
- fulfillment;
- auditoria;
- busca operacional.

SKU não deve depender do texto visual exibido ao consumidor.

---

## 8. PRODUTO SIMPLES

Produto simples continua usando a mesma arquitetura conceitual.

Evitar criar dois motores separados:

- “produto simples”;
- “produto com variação”.

O caso simples deve ser uma simplificação do modelo geral.

---

## 9. STATUS DO PRODUTO

Estados devem ser semânticos.

Exemplos conceituais:

- DRAFT;
- ACTIVE;
- INACTIVE;
- ARCHIVED.

Publicação e disponibilidade comercial não devem ser confundidas automaticamente.

Um produto pode existir administrativamente sem estar disponível publicamente.

---

## 10. PUBLICAÇÃO

A plataforma deve poder distinguir:

- produto cadastrado;
- produto válido;
- produto publicado;
- produto disponível para compra.

Esses conceitos podem coincidir em fluxos simples, mas não devem ser fundidos sem necessidade.

---

## 11. CATEGORIAS E COLEÇÕES

Categorias e coleções não devem ser tratadas como sinônimos obrigatórios.

### Categoria

Estrutura taxonômica.

Pode ser hierárquica.

### Coleção

Agrupamento comercial/editorial.

Pode ser manual ou baseado em regras.

Exemplos:

- Lançamentos;
- Mais vendidos;
- Retrô;
- Seleções;
- Até R$ 100.

---

## 12. TAGS

Tags são metadados flexíveis.

Não devem substituir atributos estruturados quando há necessidade de:

- validação;
- filtro consistente;
- integração;
- regra de negócio.

---

## 13. MÍDIA DO PRODUTO

O Commerce Core deve referenciar mídia sem assumir detalhes da implementação de armazenamento.

Produto e variante podem possuir:

- imagem principal;
- galeria;
- mídia específica por variação;
- vídeo;
- alt text;
- ordenação.

Transformação e storage pertencem ao Platform Core/Media Engine.

---

# PARTE II — EXPERIÊNCIA DE COMPRA

## 14. PURCHASE EXPERIENCE

A forma como um item é comprado deve ser separada da identidade do SKU.

O mesmo conjunto de SKUs pode suportar experiências diferentes.

Exemplos:

- compra unitária;
- seleção de tamanho;
- múltiplas quantidades por variação;
- atacado;
- grade;
- quantidade mínima;
- múltiplos obrigatórios;
- kits;
- bundles futuros.

Essa separação é importante para evitar duplicação de catálogo.

---

## 15. LIÇÃO DA WBUY — SKU VS GRID

A pesquisa WBuy revelou comportamentos distintos com:

- `grade_tipo='sku'`;
- `grade_tipo='grid'`.

Na NextLevel, isso não deve virar dois tipos incompatíveis de produto.

A decisão é:

> **Produto/Variant/SKU permanecem estáveis; a regra/experiência de compra determina como quantidades e variações podem ser escolhidas.**

---

## 16. COMPRA UNITÁRIA

O caso padrão deve permitir:

- selecionar variante;
- informar quantidade;
- validar estoque;
- validar regras comerciais;
- adicionar ao carrinho.

---

## 17. COMPRA EM GRADE

A plataforma deve poder suportar, quando habilitada:

- várias variantes do mesmo produto;
- quantidade individual por variante;
- inclusão em uma única ação;
- validação consolidada;
- totalização correta;
- reserva por SKU.

Exemplo:

- P: 2
- M: 4
- G: 4
- GG: 2

---

## 18. QUANTIDADE MÍNIMA

Regras podem existir em diferentes níveis.

Exemplos:

- pedido mínimo;
- produto mínimo;
- variante mínima;
- coleção mínima;
- atacado mínimo.

Essas regras devem ser representadas semanticamente e validadas no Commerce Core.

---

## 19. MÚLTIPLOS

Alguns produtos podem exigir venda em múltiplos.

Exemplo:

- somente múltiplos de 6;
- caixa fechada de 12.

O carrinho e o checkout devem validar isso.

A UI deve orientar o usuário antes do erro.

---

## 20. REGRAS DE ATACADO

Atacado não deve exigir um Commerce Core separado.

Pode utilizar capacidades como:

- quantidade mínima;
- tiers de preço;
- grade;
- elegibilidade de cliente;
- regras de pedido;
- preços específicos.

A experiência detalhada pertence aos documentos especializados.

---

# PARTE III — PREÇOS

## 21. DINHEIRO

Valores monetários devem usar representação segura.

Nunca depender de floating point ingênuo.

Definir padrão interno consistente para:

- moeda;
- arredondamento;
- precisão;
- serialização;
- exibição.

---

## 22. PREÇO BASE

Um SKU/produto deve possuir uma fonte de preço comercial claramente definida.

Preço exibido no storefront deve ser derivado da mesma regra usada no carrinho e checkout.

---

## 23. PREÇO PROMOCIONAL

Promoção pode possuir:

- valor;
- tipo;
- início;
- fim;
- prioridade;
- condições;
- elegibilidade.

Um “preço riscado” não pode ser apenas decoração visual.

---

## 24. SNAPSHOT DE PREÇO NO PEDIDO

O pedido deve preservar:

- preço unitário efetivo;
- descontos aplicados;
- subtotal;
- frete;
- total;
- impostos quando aplicável;
- regras relevantes.

Alterar o preço atual do produto não deve alterar pedidos históricos.

---

## 25. PRICE TIERS

O modelo deve poder evoluir para faixas de preço.

Exemplo:

- 1–5 unidades: R$ X
- 6–11: R$ Y
- 12+: R$ Z

A regra deve ser determinística e testável.

---

## 26. CUPONS

Cupons podem possuir:

- código;
- tipo;
- valor;
- validade;
- limite de uso;
- elegibilidade;
- escopo;
- mínimo de pedido;
- produtos/categorias elegíveis;
- cliente elegível;
- uso por cliente.

A validação final deve ocorrer server-side.

---

## 27. PROMOÇÕES AUTOMÁTICAS

Promoções podem existir sem cupom.

A plataforma deve conseguir distinguir:

- promoção automática;
- cupom;
- preço especial;
- regra comercial.

---

## 28. ORDEM DE APLICAÇÃO

Se múltiplos descontos existirem, a prioridade deve ser explícita.

Nunca depender da ordem acidental de execução do frontend.

---

# PARTE IV — ESTOQUE

## 29. MODELO DE ESTOQUE

Quando aplicável, distinguir:

- `on_hand`;
- `reserved`;
- `available`.

Conceitualmente:

`available = on_hand - reserved`

A implementação deve preservar invariantes mesmo sob concorrência.

---

## 30. AVAILABLE NÃO É CAMPO INDEPENDENTE SEM CONTROLE

Se `available` for persistido por performance, ele precisa de estratégia rigorosa de consistência.

Preferencialmente deve ser derivado ou atualizado transacionalmente.

---

## 31. MOVIMENTAÇÕES

Toda alteração relevante deve gerar um movimento ou fato equivalente.

Tipos conceituais:

- RECEIPT;
- RESERVE;
- RELEASE;
- SALE;
- RETURN;
- CANCELLATION;
- ADJUSTMENT;
- DAMAGE;
- TRANSFER.

---

## 32. STOCK MOVE

Uma movimentação deve poder responder:

- qual SKU;
- quanto mudou;
- saldo anterior;
- saldo posterior;
- tipo;
- motivo;
- pedido relacionado;
- usuário/processo;
- timestamp;
- tenant;
- correlation id;
- idempotency key.

---

## 33. RESERVA

Reserva de estoque precisa possuir:

- origem;
- quantidade;
- prazo/expiração quando necessário;
- vínculo com carrinho/checkout/pedido;
- liberação segura;
- idempotência.

---

## 34. OVERSELLING

A plataforma deve assumir concorrência.

Não aceitar como implementação crítica:

1. ler estoque;
2. comparar;
3. atualizar depois;

sem atomicidade adequada.

---

## 35. PRODUTO SEM ESTOQUE

O comportamento comercial deve ser configurável sem alterar a verdade do estoque.

Possíveis estratégias futuras:

- impedir compra;
- permitir encomenda;
- permitir backorder;
- ocultar produto.

A decisão comercial é separada da contagem física.

---

## 36. ESTOQUE INFINITO/NÃO CONTROLADO

Alguns produtos podem não controlar estoque.

Isso precisa ser explícito.

Nunca representar “não controlado” como um número arbitrariamente alto.

---

# PARTE V — CARRINHO

## 37. CARRINHO COMO ENTIDADE

Carrinho não deve existir apenas em memória de UI.

A plataforma deve suportar uma representação de carrinho capaz de validar:

- itens;
- SKUs;
- preços;
- promoções;
- estoque;
- quantidades;
- regras comerciais;
- frete;
- identidade do cliente quando disponível.

---

## 38. CARRINHO ANÔNIMO

Deve ser possível suportar carrinho sem login.

O identificador deve ser seguro e não permitir acesso ao carrinho de terceiros.

---

## 39. CARRINHO AUTENTICADO

Quando o cliente se autenticar, a plataforma deve possuir estratégia definida para:

- adotar;
- mesclar;
- substituir

carrinho anterior.

Essa política precisa ser consistente.

---

## 40. REVALIDAÇÃO

Carrinho não congela indefinidamente:

- preço;
- estoque;
- promoção;
- frete.

Antes do checkout, condições críticas devem ser revalidadas.

---

## 41. ITEM DO CARRINHO

Cart item deve referenciar SKU/variante real e preservar os dados necessários para exibição.

Não usar apenas nome textual como referência.

---

# PARTE VI — CHECKOUT

## 42. CHECKOUT COMO PROCESSO

Checkout deve ser tratado como processo transacional com estado.

Ele não é apenas uma página.

---

## 43. ETAPAS

Conceitualmente pode incluir:

- identificação;
- contato;
- endereço;
- entrega;
- descontos;
- revisão;
- pagamento;
- confirmação.

A UX pode apresentar isso em uma ou várias telas.

O domínio não deve depender da quantidade de páginas.

---

## 44. CHECKOUT STATE

A plataforma deve poder representar:

- iniciado;
- incompleto;
- pronto para pagamento;
- aguardando pagamento;
- concluído;
- expirado;
- abandonado.

Os estados exatos devem ser validados no design detalhado.

---

## 45. CÁLCULO FINAL

O servidor precisa ser a autoridade final sobre:

- preços;
- descontos;
- frete;
- disponibilidade;
- quantidade;
- total.

Nunca confiar no total enviado pelo browser.

---

## 46. IDEMPOTÊNCIA DE FINALIZAÇÃO

Submeter o checkout duas vezes não deve criar dois pedidos ou duas cobranças.

Finalização é operação idempotente.

---

## 47. SNAPSHOT DE CHECKOUT

Ao converter checkout em pedido, preservar os dados relevantes da transação naquele momento.

---

# PARTE VII — CLIENTE

## 48. CUSTOMER

Cliente comercial e identidade de autenticação não precisam ser a mesma entidade conceitual.

O modelo deve permitir guest checkout.

---

## 49. DADOS DO CLIENTE

Podem incluir:

- nome;
- e-mail;
- telefone;
- documento quando necessário;
- endereços;
- preferências;
- consentimentos;
- histórico comercial.

Aplicar minimização de dados.

---

## 50. ENDEREÇOS

Endereço usado em pedido deve ser preservado como snapshot.

Editar o endereço atual do cliente não deve alterar pedido antigo.

---

# PARTE VIII — PEDIDOS

## 51. ORDER COMO FONTE DE VERDADE

Existe uma entidade central de pedido.

Dashboard, atendimento, expedição e relatórios consomem projeções da mesma verdade.

---

## 52. ORDER ITEM

Pedido deve preservar por item:

- SKU;
- identificação do produto;
- variante;
- descrição relevante;
- quantidade;
- preço unitário;
- descontos;
- total;
- dados necessários para histórico.

---

## 53. ESTADOS DO PEDIDO

Estados devem ser semânticos.

Exemplos conceituais:

- CREATED;
- PENDING_PAYMENT;
- PAID;
- PROCESSING;
- READY_TO_SHIP;
- SHIPPED;
- DELIVERED;
- CANCELED;
- REFUNDED;
- PARTIALLY_REFUNDED.

A máquina final precisa ser definida com regras explícitas.

---

## 54. STATUS NÃO É COR

O Commerce Core fornece significado.

O Design System decide:

- label;
- cor;
- ícone;
- badge.

Isso corrige um acoplamento observado na pesquisa WBuy.

---

## 55. TRANSIÇÕES

Cada transição importante deve definir:

- estado de origem permitido;
- novo estado;
- ator;
- pré-condições;
- efeitos;
- eventos;
- auditoria.

---

## 56. PEDIDO IMUTÁVEL ONDE IMPORTA

Algumas correções administrativas podem existir.

Mas dados históricos relevantes não devem ser silenciosamente sobrescritos.

Mudanças precisam ser auditáveis.

---

## 57. CANCELAMENTO

Cancelamento deve considerar:

- estado atual;
- pagamento;
- estoque reservado;
- fulfillment;
- reembolso;
- comunicação;
- auditoria.

---

# PARTE IX — PAGAMENTOS

## 58. PAYMENT COMO ENTIDADE SEPARADA

Pedido e pagamento não são a mesma coisa.

Um pedido pode possuir:

- tentativa;
- múltiplas tentativas;
- pagamento aprovado;
- falha;
- reembolso;
- chargeback;
- pagamento parcial futuro, se suportado.

---

## 59. PAYMENT PROVIDER

O Commerce Core deve utilizar abstrações estáveis.

Conceitos particulares de Mercado Pago, Stripe ou outro gateway não devem invadir todo o domínio.

---

## 60. ESTADOS DE PAGAMENTO

Exemplos conceituais:

- CREATED;
- PENDING;
- AUTHORIZED;
- PAID;
- FAILED;
- CANCELED;
- REFUNDED;
- PARTIALLY_REFUNDED;
- CHARGEBACK.

Validar conforme o modelo real adotado.

---

## 61. WEBHOOK

Webhook não é automaticamente verdade.

Antes de produzir efeitos:

- verificar autenticidade;
- interpretar evento;
- deduplicar;
- validar transição;
- persistir;
- auditar.

---

## 62. RECONCILIAÇÃO

A plataforma deve ser capaz de comparar sua visão interna com a visão do provedor.

Falhas temporárias de webhook não podem tornar a verdade irrecuperável.

---

## 63. REFUND

Reembolso deve ser entidade/processo auditável.

Pode ser:

- total;
- parcial;
- por item;
- por valor.

Nunca apenas alterar `order.status = refunded` sem preservar o evento financeiro real.

---

# PARTE X — FRETE E FULFILLMENT

## 64. SHIPPING METHOD

Método de entrega deve ser independente do provider.

Exemplos:

- transportadora;
- Correios;
- entrega local;
- retirada;
- frete grátis.

---

## 65. COTAÇÃO

Cotação deve considerar dados necessários como:

- origem;
- destino;
- peso;
- dimensões;
- valor;
- regras comerciais.

Resultados externos podem expirar.

---

## 66. SHIPMENT

Pedido e envio são conceitos diferentes.

Um pedido pode, futuramente, possuir mais de um shipment.

Não assumir `1 pedido = 1 código de rastreio` como lei estrutural.

---

## 67. TRACKING

Rastreamento deve possuir:

- código;
- carrier/provider;
- status;
- eventos;
- URL quando aplicável.

---

## 68. FULFILLMENT

Fulfillment representa o processamento físico do pedido.

Pode incluir:

- separação;
- embalagem;
- etiqueta;
- despacho;
- entrega;
- exceção.

Não confundir fulfillment com status de pagamento.

---

# PARTE XI — CONSISTÊNCIA E EVENTOS

## 69. EVENTOS DE COMÉRCIO

Eventos relevantes podem incluir:

- ProductPublished;
- PriceChanged;
- StockReceived;
- StockReserved;
- StockReleased;
- StockOut;
- CartCreated;
- CheckoutStarted;
- OrderCreated;
- PaymentApproved;
- PaymentFailed;
- OrderCanceled;
- RefundCreated;
- ShipmentCreated;
- ShipmentDelivered.

Os nomes finais devem seguir convenção única.

---

## 70. EVENTO NÃO É SUBSTITUTO DE FONTE DE VERDADE

Eventos registram fatos.

Eles não devem criar duas verdades concorrentes sem desenho consciente de event sourcing.

---

## 71. AUDITORIA

Operações sensíveis precisam registrar contexto suficiente para investigação.

---

## 72. TRANSAÇÕES

Operações que precisam acontecer de forma consistente devem utilizar transações ou estratégia equivalente.

Exemplos:

- reservar estoque + criar item;
- confirmar pagamento + transicionar pedido;
- cancelar pedido + liberar reserva;
- reembolsar + atualizar estado financeiro.

---

# PARTE XII — REGRAS DE ENGENHARIA

## 73. SERVER AUTHORITY

Browser nunca é autoridade final para:

- preço;
- estoque;
- desconto;
- frete;
- total;
- pagamento;
- permissão.

---

## 74. VALIDATION

Validar em fronteiras:

- input;
- domínio;
- provider;
- banco.

Validação de UI serve para experiência, não para segurança.

---

## 75. ERROS DE DOMÍNIO

Erros devem ser semânticos.

Exemplos:

- OUT_OF_STOCK;
- INVALID_QUANTITY;
- COUPON_EXPIRED;
- PAYMENT_FAILED;
- SHIPPING_UNAVAILABLE.

UI traduz o erro para linguagem apropriada.

---

## 76. TESTES OBRIGATÓRIOS

Prioridade alta para:

- cálculo de preço;
- descontos;
- grade;
- quantidade mínima;
- estoque;
- reserva;
- concorrência;
- carrinho;
- checkout;
- criação de pedido;
- transições;
- pagamento;
- webhook idempotente;
- cancelamento;
- reembolso;
- tenant isolation.

---

## 77. NÃO DUPLICAR REGRA

Nunca implementar a mesma regra crítica separadamente em:

- storefront;
- painel;
- API;
- integração.

A regra pertence a uma camada de domínio reutilizável.

---

# PARTE XIII — O QUE NÃO PERTENCE AO COMMERCE CORE

## 78. FORA DESTE DOCUMENTO

Pertencem a documentos especializados:

- Theme Engine;
- Page Builder;
- aparência do painel;
- design tokens;
- analytics detalhado;
- Platform Ops;
- billing SaaS;
- planos da NextLevel;
- infraestrutura;
- observabilidade técnica detalhada;
- import/export técnico;
- domínio/SSL;
- RBAC detalhado;
- apps/plugins;
- SuperDrop;
- Master;
- marketplace específico.

Esses sistemas podem consumir o Commerce Core.

Não devem redefini-lo.

---

# PARTE XIV — DECISÕES DERIVADAS DA PESQUISA WBUY

## 79. DASHBOARD

Pesquisa WBuy mostrou valor de módulos independentes.

Decisão:

> O Commerce Core fornece dados e estados; Merchant Experience e Intelligence compõem os módulos.

---

## 80. STATUS

Pesquisa WBuy mostrou status acompanhado de metadados visuais.

Decisão:

> O Commerce Core expõe significado semântico; visual pertence ao Design System.

---

## 81. GRADE

Pesquisa WBuy mostrou `sku` versus `grid`.

Decisão:

> A NextLevel separa estrutura do produto da experiência/regra de compra.

---

## 82. ESTOQUE

Pesquisa WBuy mostrou histórico de movimentações.

Decisão:

> NextLevel adota rastreabilidade mais rica com origem, saldo, motivo e correlação.

---

## 83. IMPORTAÇÃO

Exportações WBuy demonstraram importância operacional de portabilidade.

Decisão:

> O Commerce Core deve possuir entidades estáveis o suficiente para serem importadas/exportadas sem depender de layout de tela.

---

# PARTE XV — QUESTÕES AINDA ABERTAS

## 84. OPEN QUESTIONS

Ainda precisam de documentos/ADRs específicos:

- política final de reserva de estoque;
- duração de reserva;
- guest checkout;
- política de merge de carrinho;
- máquina final de estados do pedido;
- captura vs autorização de cartão;
- split shipment;
- modelo final de promotion engine;
- tratamento de impostos;
- marketplace futuro;
- múltiplas moedas;
- múltiplos estoques;
- pré-venda/backorder;
- bundles/kits;
- assinatura/recorrência;
- order editing após pagamento.

Nenhuma dessas hipóteses deve contaminar a V1 antes de decisão explícita.

---

## 85. REGRA FINAL

O Commerce Core deve preservar uma verdade:

> **o mesmo produto, preço, estoque, carrinho, checkout, pedido e pagamento precisam significar a mesma coisa independentemente da tela, tema, canal ou integração que os utilize.**

Quando uma funcionalidade exigir quebrar essa coerência, o problema precisa ser redesenhado antes da implementação.
