# 00 — CONSTITUIÇÃO DA PLATAFORMA DE LOJAS VIRTUAIS NEXTLEVEL

> **Status:** Documento normativo principal  
> **Autoridade:** Máxima dentro do conjunto de engenharia do e-commerce  
> **Produto:** Plataforma de Lojas Virtuais NextLevel  
> **Escopo:** Identidade do produto, fronteiras, invariantes e regras de decisão  
> **Regra:** Detalhes que possam mudar sem alterar a identidade da plataforma pertencem aos documentos especializados, não a esta Constituição.

---

## 1. POR QUE ESTA CONSTITUIÇÃO EXISTE

Este documento define o que deve continuar verdadeiro mesmo quando:

- telas mudarem;
- tecnologias forem substituídas;
- novos gateways forem adicionados;
- temas forem redesenhados;
- novos planos comerciais surgirem;
- o volume de lojas crescer;
- produtos derivados consumirem a plataforma;
- a equipe de engenharia mudar.

Ele não é uma lista de funcionalidades.

Ele existe para impedir que decisões locais, urgentes ou visualmente convenientes deformem a plataforma como um todo.

Antes de uma decisão estrutural, este documento deve permitir responder:

- O que estamos construindo?
- Para quem?
- Qual problema pertence ao core?
- Qual problema pertence a uma camada especializada?
- Qual é a fonte de verdade?
- Quais invariantes não podem ser quebrados?
- Qual dependência é aceitável?
- O que deve permanecer reversível?
- Como separar evidência de hipótese?
- Como saber se uma solução fortalece ou fragmenta o produto?

---

## 2. DEFINIÇÃO EXATA DO PRODUTO

**NextLevel E-commerce** significa:

> **a plataforma própria da NextLevel para criar, configurar, publicar, operar, administrar, personalizar e evoluir lojas virtuais.**

Ela pertence à categoria de plataformas de lojas virtuais.

Ela não é apenas:

- um site;
- um template;
- um painel;
- um checkout;
- um sistema de pedidos;
- um ERP;
- um marketplace;
- um construtor visual;
- uma solução criada para um único cliente.

A plataforma deve funcionar como um produto independente e coerente.

---

## 3. AS QUATRO RESPONSABILIDADES FUNDAMENTAIS

A plataforma possui quatro responsabilidades permanentes.

### 3.1 Merchant Experience

O ambiente no qual o lojista ou sua equipe:

- cria;
- configura;
- publica;
- administra;
- monitora;
- opera;
- evolui

uma loja virtual.

### 3.2 Storefront Experience

A experiência pública na qual o consumidor:

- descobre;
- pesquisa;
- compara;
- escolhe;
- compra;
- paga;
- acompanha;
- retorna.

### 3.3 Platform Operations

As capacidades internas necessárias para a própria NextLevel operar o SaaS:

- ciclo de vida das lojas;
- suporte;
- diagnóstico;
- segurança;
- administração de tenants;
- capabilities;
- saúde da plataforma;
- auditoria;
- operações internas indispensáveis.

**Platform Operations não é o produto derivado “Master”.**

É a operação interna necessária para que uma plataforma SaaS exista de forma confiável.

### 3.4 Commerce & Platform Engine

O conjunto de regras, dados, contratos e processos que sustenta as três experiências anteriores.

Nenhuma dessas quatro responsabilidades deve ser tratada como acessória.

---

## 4. FRONTEIRA DO PRODUTO

A Plataforma de Lojas Virtuais NextLevel é o motor de e-commerce.

Outros produtos podem utilizá-la.

Eles não definem o seu domínio central.

Exemplos de produtos ou contextos que não devem contaminar o core por padrão:

- SuperDrop;
- painéis corporativos Master;
- redes específicas de fornecedores;
- marketplaces específicos;
- operações exclusivas de um cliente;
- regras particulares de uma única vertical;
- modelos futuros ainda hipotéticos.

A direção correta é:

**PRODUTO DERIVADO → CONSOME → PLATAFORMA DE E-COMMERCE**

e não:

**PLATAFORMA DE E-COMMERCE → DEPENDE → PRODUTO DERIVADO**

Uma necessidade de produto derivado somente entra no core quando também representa uma capacidade legítima e generalizável da plataforma de lojas virtuais.

---

## 5. CAPACIDADES, NÃO PÁGINAS

A plataforma não deve ser pensada como uma coleção de telas.

Ela deve ser pensada como um conjunto de capacidades.

Uma página é apenas uma representação de capacidades mais profundas.

Exemplos:

- Produtos → Catalog/Product capability
- Estoque → Inventory capability
- Pedidos → Order lifecycle
- Temas → Visual Commerce capability
- Dashboard → Merchant Intelligence
- Domínio → Domain capability
- Pagamentos → Payment capability

Antes de implementar uma tela importante, identificar:

1. qual capacidade ela representa;
2. qual entidade ou processo possui a verdade;
3. qual camada é responsável;
4. quais invariantes precisam permanecer válidos fora daquela tela.

---

## 6. AS CINCO CAMADAS CONCEITUAIS

A plataforma deve preservar cinco grandes fronteiras conceituais.

### 6.1 Commerce Core

Responsável pelas regras fundamentais de comércio.

Inclui, conceitualmente:

- catálogo;
- produto;
- variante;
- SKU;
- preço;
- promoção;
- estoque;
- carrinho;
- checkout;
- pedido;
- pagamento;
- reembolso;
- frete;
- fulfillment;
- cliente.

**Teste constitucional:**

> Uma capacidade pertence ao Commerce Core quando continua fazendo sentido independentemente de tema, plano, gateway, fornecedor ou modelo específico de uma loja.

### 6.2 Platform Core

Responsável pelas capacidades estruturais do SaaS.

Inclui:

- tenants/lojas;
- identidade;
- autenticação;
- autorização;
- usuários;
- permissões;
- capabilities;
- integrações;
- eventos;
- jobs;
- auditoria;
- mídia;
- domínio;
- segurança;
- importação/exportação;
- observabilidade;
- lifecycle da loja.

### 6.3 Visual Commerce Platform

Responsável pela expressão visual e composição das lojas.

Inclui:

- design tokens;
- themes;
- templates;
- sections;
- blocks;
- settings;
- conteúdo;
- editor;
- preview;
- responsividade;
- versionamento;
- publicação;
- rollback.

### 6.4 Merchant Experience

Responsável pela experiência operacional do lojista.

Inclui:

- arquitetura de informação;
- navegação;
- dashboard;
- formulários;
- tabelas;
- ações;
- busca;
- onboarding;
- feedback;
- mobile;
- acessibilidade;
- design system administrativo.

### 6.5 Commerce Intelligence

Responsável por transformar dados e eventos em entendimento e ação.

Inclui:

- analytics;
- métricas;
- alertas;
- saúde da loja;
- prioridades;
- diagnóstico;
- oportunidades;
- contexto operacional.

---

## 7. DIREÇÃO DE DEPENDÊNCIA

As camadas devem preservar dependências saudáveis.

### Regras fundamentais

- apresentação pode depender de contratos do domínio;
- domínio não deve depender de componentes visuais;
- temas consomem capacidades de comércio;
- regras de comércio não pertencem a temas;
- integrações externas devem entrar por fronteiras controladas;
- provedores não devem definir o modelo interno da plataforma;
- analytics e intelligence não devem se tornar fontes de verdade transacional;
- produtos derivados podem depender do e-commerce;
- o e-commerce não deve depender de produtos derivados.

Quando uma dependência inverter essas regras, tratá-la como risco arquitetural explícito.

---

## 8. DOMÍNIO ANTES DA INTERFACE

Banco, APIs e regras não devem ser modelados simplesmente para reproduzir a tela atual.

Antes de adicionar uma estrutura, perguntar:

- Qual conceito de negócio existe?
- Qual é sua fonte de verdade?
- É entidade?
- É configuração?
- É estado?
- É evento?
- É histórico?
- É snapshot?
- É projeção?
- É dado analítico?
- Quem pode alterá-lo?
- Quais invariantes existem?
- Como ele se comporta em outros contextos?

A interface representa o domínio.

O domínio não deve ser deformado pela interface.

---

## 9. UMA FONTE DE VERDADE

Conceitos centrais não devem possuir múltiplas versões independentes apenas porque aparecem em telas distintas.

Exemplos:

- um pedido é o mesmo pedido no dashboard, detalhe, expedição, atendimento e relatório;
- um produto é o mesmo produto no painel, storefront, busca e carrinho;
- um cliente não deve possuir identidades contraditórias entre módulos;
- uma transação financeira não deve ser reinterpretada por cada interface.

Podem existir:

- projeções;
- caches;
- índices;
- snapshots;
- modelos de leitura.

Eles não devem competir com a fonte de verdade.

---

## 10. INVARIANTES ACIMA DE CONVENIÊNCIA

Áreas críticas devem possuir invariantes explícitos.

Especialmente:

- dinheiro;
- estoque;
- pedidos;
- pagamentos;
- reembolsos;
- autorização;
- tenant isolation;
- identidade;
- publicação.

Quando uma melhoria visual ou simplificação de implementação conflitar com uma invariante, a invariante vence.

---

## 11. HISTÓRICO NÃO DEVE SER REESCRITO PELO PRESENTE

Mudanças futuras de catálogo, preço, endereço, tema, nome de produto ou configuração não devem corromper a interpretação correta de transações históricas.

Quando necessário, utilizar snapshots, eventos, histórico ou estruturas equivalentes.

Um pedido histórico deve continuar representando o que efetivamente foi comprado naquele momento.

---

## 12. TENANT ISOLATION É ESTRUTURAL

A plataforma é multi-tenant.

Nenhuma loja pode acessar dados ou ações de outra loja por falha de:

- rota;
- ID;
- filtro;
- frontend;
- cache;
- query;
- endpoint;
- integração;
- permissão.

Toda operação sensível deve validar no servidor:

**identidade + tenant + recurso + permissão + ação**

Isolamento entre lojas não pode depender de convenção de UI.

---

## 13. VISUAL É ARQUITETURA DE PRODUTO

Visual não é acabamento.

Existem duas responsabilidades distintas:

### 13.1 Visual da plataforma

O painel NextLevel deve possuir:

- identidade;
- consistência;
- clareza;
- hierarquia;
- densidade adequada;
- previsibilidade;
- eficiência operacional.

### 13.2 Visual das lojas

As lojas devem poder possuir identidades profundamente distintas sem duplicar ou quebrar o motor de comércio.

A liberdade visual deve existir sobre contratos estáveis.

Tema, template, section ou block nunca devem se tornar fonte de verdade de:

- preço;
- estoque;
- disponibilidade;
- pedido;
- pagamento;
- autorização;
- regras críticas de checkout.

---

## 14. LIBERDADE COM GUARDA-CORPOS

Personalização não significa ausência de regras.

A plataforma deve ajudar um usuário não especialista a produzir uma boa experiência.

Bons defaults são parte do produto.

O sistema deve proteger, sempre que possível:

- legibilidade;
- hierarquia;
- responsividade;
- acessibilidade;
- performance;
- clareza de ações;
- consistência;
- requisitos essenciais de compra.

Criatividade não pode destruir usabilidade.

---

## 15. CONFIGURAR NÃO É O MESMO QUE PUBLICAR

Quando uma alteração puder afetar consumidores ou operação real, considerar explicitamente a separação entre:

- edição;
- validação;
- preview;
- publicação;
- rollback.

Isso se aplica especialmente a:

- temas;
- páginas;
- conteúdo;
- produtos;
- promoções;
- domínios;
- configurações sensíveis.

Publicação é uma operação de produto e deve ser tratada como tal.

---

## 16. MOBILE É PRIMEIRA CLASSE

Storefront deve possuir excelente experiência mobile.

O painel deve permitir operações relevantes em telas menores.

Não aceitar como definição de responsividade:

> “desktop reduzido até caber”.

Componentes e fluxos precisam de comportamento responsivo consciente.

---

## 17. PERFORMANCE É EXPERIÊNCIA

Performance é parte do produto.

Decisões visuais e técnicas devem considerar seu impacto sobre:

- tempo de resposta;
- carregamento;
- estabilidade visual;
- interação;
- imagens;
- scripts;
- consultas;
- cache;
- renderização.

Especialmente no storefront, recursos visuais não podem degradar desnecessariamente a experiência de compra.

---

## 18. ACESSIBILIDADE É QUALIDADE

Acessibilidade não é etapa cosmética posterior.

Interfaces e temas devem considerar:

- teclado;
- foco;
- contraste;
- semântica;
- labels;
- leitores de tela;
- touch targets;
- estados;
- movimento;
- clareza de feedback.

---

## 19. FUNCIONALIDADE REAL ANTES DE APARÊNCIA DE COMPLETUDE

Uma funcionalidade não está pronta porque aparece na tela.

Não tratar como concluído:

- mock;
- botão sem ação;
- dado fictício;
- métrica inventada;
- integração simulada;
- fluxo incompleto;
- placeholder mascarado como funcionalidade real.

Quando algo for parcial ou simulado, isso deve estar explícito no desenvolvimento.

---

## 20. SEGURANÇA É SERVER-SIDE

Frontend não é fronteira de segurança.

Autenticação e autorização devem ser verificadas onde a ação efetivamente acontece.

Segurança deve considerar:

- menor privilégio;
- isolamento de tenant;
- IDOR;
- validação;
- sanitização;
- secrets;
- abuso;
- webhooks;
- sessões;
- ações críticas;
- auditoria.

Nenhuma interface visual substitui autorização real.

---

## 21. PRIVACIDADE E CICLO DE VIDA DOS DADOS

Dados devem possuir propósito e responsabilidade.

A plataforma deve considerar:

- minimização;
- necessidade;
- retenção;
- exclusão quando aplicável;
- auditoria;
- exportação;
- acesso;
- dados sensíveis;
- obrigações legais aplicáveis.

Logs não devem se tornar depósitos indiscriminados de dados pessoais ou secrets.

---

## 22. EVENTOS IMPORTANTES TÊM SIGNIFICADO

Acontecimentos relevantes devem poder ser representados semanticamente.

Exemplos conceituais:

- OrderCreated;
- PaymentApproved;
- PaymentFailed;
- StockReserved;
- StockOut;
- ShipmentCreated;
- ThemePublished;
- DomainVerified.

Isso não exige uma tecnologia específica.

O objetivo é permitir que o mesmo fato possa alimentar, quando necessário:

- auditoria;
- notificações;
- analytics;
- automações;
- integrações;
- observabilidade.

---

## 23. IDEMPOTÊNCIA E CONCORRÊNCIA SÃO REQUISITOS DE CONFIABILIDADE

Operações críticas devem ser projetadas assumindo:

- repetição;
- retry;
- eventos duplicados;
- concorrência;
- falhas parciais;
- respostas fora de ordem;
- interrupção de processos.

Especialmente em:

- pagamento;
- checkout;
- pedido;
- estoque;
- reembolso;
- fulfillment;
- webhooks.

Repetir o mesmo evento não pode gerar duplicação econômica ou operacional indevida.

---

## 24. FALHAS DEVEM SER RECUPERÁVEIS

A plataforma deve preferir modos de falha que:

- preservem dados;
- sejam diagnosticáveis;
- permitam retry seguro;
- não deixem estados silenciosamente inconsistentes;
- ofereçam caminho de recuperação.

Quando possível, uma falha de componente não crítico não deve derrubar toda a experiência.

---

## 25. OBSERVABILIDADE FAZ PARTE DA CONFIABILIDADE

Um problema invisível é um problema operacional caro.

A plataforma deve ser diagnosticável.

Isso inclui, conforme a área:

- logs estruturados;
- correlação;
- métricas;
- eventos;
- health checks;
- auditoria;
- rastreabilidade;
- saúde de integrações;
- saúde por tenant.

Nunca registrar secrets sem necessidade.

---

## 26. ANALYTICS NÃO É OPERAÇÃO

Separar conceitualmente:

### Analytics
Como a loja performou em determinado período?

### Operação
O que precisa da atenção do lojista agora?

Um filtro analítico não deve esconder um problema operacional atual.

---

## 27. SINAL → CONTEXTO → AÇÃO

Quando a plataforma identificar algo relevante, buscar transformar informação em ação.

Sempre que fizer sentido:

1. sinal;
2. contexto;
3. ação.

Um dashboard não deve ser apenas um mural de números.

---

## 28. CAPABILITIES EM VEZ DE CONDICIONAIS COMERCIAIS ESPALHADAS

Recursos habilitados para uma loja devem possuir representação coerente.

Planos comerciais podem conceder capabilities.

O domínio não deve ser contaminado por condicionais de plano espalhadas em dezenas de módulos.

A estratégia comercial pode mudar.

As capacidades do produto devem permanecer semanticamente claras.

---

## 29. MIGRAÇÃO, IMPORTAÇÃO E EXPORTAÇÃO SÃO CAPACIDADES REAIS

Entrada e saída de dados fazem parte de uma plataforma madura.

A arquitetura deve permitir evolução segura para:

- importação;
- exportação;
- migração;
- validação;
- processamento;
- relatório de erros;
- rastreabilidade.

Isso não autoriza formatos específicos nesta Constituição.

Os documentos especializados definem implementação e escopo.

---

## 30. O CICLO DE VIDA DA LOJA É PARTE DO PRODUTO

Uma loja não nasce pronta.

A plataforma deve poder representar e compreender seu ciclo de vida.

Conceitualmente:

- criação;
- configuração;
- validação;
- teste;
- publicação;
- operação;
- pausa;
- suspensão;
- encerramento.

O sistema deve conseguir evoluir para responder:

> “Esta loja está pronta para vender?”

e, quando não estiver:

> “O que falta?”

---

## 31. INTEGRAÇÕES NÃO DEFINEM O CORE

Gateways, transportadoras, ERPs, pixels, marketplaces e outros provedores são dependências externas.

A plataforma deve evitar que conceitos particulares de um fornecedor se tornem conceitos universais do domínio sem necessidade.

Quando possível:

- core define contratos;
- integrações implementam contratos;
- falha de um provedor permanece isolável;
- troca ou adição de fornecedor não exige reconstruir o domínio.

---

## 32. COMPATIBILIDADE E EVOLUÇÃO DE CONTRATOS

Contratos consumidos por outras partes da plataforma, integrações ou produtos não devem ser quebrados de forma casual.

Mudanças estruturais devem considerar:

- compatibilidade;
- migração;
- versionamento quando necessário;
- dados existentes;
- deploy;
- rollback;
- consumidores dependentes.

Evolução é esperada.

Quebra silenciosa não é aceitável.

---

## 33. SIMPLICIDADE ANTES DE COMPLEXIDADE ESPECULATIVA

Robustez não significa maximizar arquitetura.

Escolher a solução mais simples que preserve:

- invariantes;
- escala necessária;
- segurança;
- manutenção;
- extensibilidade real.

Tecnologias ou padrões complexos precisam justificar seu custo.

A Constituição não congela uma arquitetura específica.

Ela exige que complexidade seja proporcional ao problema.

---

## 34. O CÓDIGO EXISTENTE TEM VALOR

Esta Constituição não autoriza reescrever o sistema por preferência técnica.

Antes de mudanças estruturais:

1. inspecionar;
2. compreender;
3. preservar o que funciona;
4. identificar dívida real;
5. medir impacto;
6. planejar migração quando necessária.

Uma implementação existente pode ser imperfeita e ainda assim conter decisões válidas.

---

## 35. DECISÕES REVERSÍVEIS E IRREVERSÍVEIS

Quanto maior o custo de reversão, maior deve ser a evidência necessária.

Decisões de alto custo de reversão incluem, por exemplo:

- modelo multi-tenant;
- fonte de verdade;
- contratos centrais;
- modelo financeiro;
- estoque;
- lifecycle de pedido;
- arquitetura de publicação;
- fronteiras de domínio.

Hipóteses frágeis não devem ser cristalizadas em decisões caras.

---

## 36. BENCHMARK É EVIDÊNCIA, NÃO ORDEM

WBuy e outras plataformas podem ser estudadas profundamente.

Toda descoberta deve ser classificada como:

### CONFIRMADO
Observado diretamente com evidência.

### INFERIDO
Conclusão plausível apoiada em evidência parcial.

### HIPÓTESE
Possibilidade ainda não validada.

Benchmark não define automaticamente a NextLevel.

Sempre perguntar:

- Qual problema isso resolve?
- Para qual ator?
- A solução ainda é adequada?
- Qual limitação observamos?
- A NextLevel precisa dessa capacidade?
- Como ela deveria existir no nosso domínio?
- Qual impacto terá?

---

## 37. HIERARQUIA DE EVIDÊNCIA PARA DECISÕES DE PRODUTO

Quando informações conflitarem, diferenciar claramente:

1. decisão explícita e confirmada do produto;
2. requisito validado;
3. comportamento observado e reproduzível;
4. evidência de benchmark;
5. inferência;
6. hipótese;
7. suposição.

Nunca apresentar inferência ou hipótese como requisito confirmado.

---

## 38. DECISÕES IMPORTANTES DEVEM SER REGISTRADAS

Decisões estruturais não devem sobreviver apenas na memória de uma conversa.

Quando uma decisão possuir impacto duradouro, registrar:

- contexto;
- decisão;
- motivo;
- alternativas relevantes;
- trade-offs;
- consequências;
- condição de revisão, quando aplicável.

O mecanismo detalhado de ADR pertence ao documento de engenharia correspondente.

---

## 39. EXCEÇÕES DEVEM SER EXPLÍCITAS

Uma exceção temporária a uma regra arquitetural não deve virar padrão acidental.

Quando uma exceção for necessária:

- identificar;
- justificar;
- limitar escopo;
- registrar risco;
- definir condição de remoção ou revisão quando relevante.

Dívida consciente é diferente de dívida invisível.

---

## 40. GOVERNANÇA DESTA CONSTITUIÇÃO

A Constituição deve mudar raramente.

Ela deve ser alterada quando:

- a definição do produto mudar;
- uma fronteira fundamental mudar;
- uma invariante se mostrar incorreta;
- uma nova responsabilidade estrutural precisar ser reconhecida;
- uma decisão de longo prazo justificar alteração normativa.

Ela não deve ser alterada apenas porque:

- uma tela mudou;
- uma biblioteca foi trocada;
- um endpoint foi reorganizado;
- um tema ganhou novo componente;
- uma tecnologia diferente foi escolhida.

Detalhes operacionais pertencem aos documentos especializados.

---

## 41. HIERARQUIA DOCUMENTAL

A ordem normativa padrão é:

1. **00-CONSTITUICAO-ECOMMERCE.md**
2. decisões estruturais explicitamente aprovadas e registradas;
3. documentos especializados da área;
4. especificações funcionais;
5. tarefa atual.

Uma tarefa não deve quebrar silenciosamente uma regra superior.

Se houver conflito:

1. identificar;
2. explicar;
3. avaliar se é exceção ou mudança estrutural;
4. registrar a decisão;
5. atualizar os documentos afetados.

---

## 42. AUTONOMIA TÉCNICA COM RESPONSABILIDADE DE PRODUTO

O engenheiro não é executor passivo.

Deve contestar soluções que:

- comprometam segurança;
- violem tenant isolation;
- prejudiquem integridade financeira;
- prejudiquem estoque;
- dupliquem fontes de verdade;
- acoplem o core a produto derivado;
- criem dependência circular entre camadas;
- introduzam dívida estrutural grave;
- contradigam decisão confirmada.

Ao contestar:

1. preservar a intenção do negócio;
2. explicar o risco;
3. propor alternativa;
4. tornar trade-offs claros.

---

## 43. CRITÉRIO DE QUALIDADE

Qualidade é multidimensional.

Uma funcionalidade relevante deve ser avaliada, conforme aplicável, em:

- valor para usuário;
- correção;
- integridade;
- UX;
- visual;
- responsividade;
- acessibilidade;
- segurança;
- performance;
- observabilidade;
- confiabilidade;
- testabilidade;
- manutenibilidade;
- extensibilidade.

Nenhuma dimensão isolada define “pronto”.

Os critérios executáveis pertencem ao documento de Quality Engineering.

---

## 44. PERGUNTAS CONSTITUCIONAIS

Antes de uma decisão significativa, perguntar:

> **Isso fortalece uma plataforma de lojas virtuais coerente ou apenas resolve a tela atual?**

> **Esta regra pertence realmente ao core ou é particular de um tema, plano, integração, segmento ou produto derivado?**

> **Estamos preservando uma fonte de verdade?**

> **A decisão continua correta se houver milhares de lojas e múltiplos provedores?**

> **Estamos transformando hipótese em arquitetura permanente?**

> **O benefício justifica a complexidade adicionada?**

---

## 45. VISÃO DE LONGO PRAZO

A Plataforma de Lojas Virtuais NextLevel deve ser capaz de crescer em:

- lojas;
- produtos;
- SKUs;
- consumidores;
- pedidos;
- pagamentos;
- integrações;
- temas;
- canais;
- volume de dados;

sem perder:

- coerência;
- segurança;
- rastreabilidade;
- usabilidade;
- capacidade de evolução.

Outros produtos poderão utilizar essa fundação.

Eles não redefinem sua identidade.

---

## 46. REGRA FINAL

A NextLevel deve buscar:

**poder sem complexidade desnecessária;  
personalização sem caos;  
beleza sem sacrificar conversão;  
velocidade sem fragilidade;  
automação sem perder rastreabilidade;  
extensibilidade sem contaminar o core;  
e evolução sem perder coerência.**

Esta é a Constituição.

Os documentos especializados definem como cada área cumpre essas regras.
