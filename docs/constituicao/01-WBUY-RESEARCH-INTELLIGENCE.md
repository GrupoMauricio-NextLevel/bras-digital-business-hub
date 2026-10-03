# 01 — WBUY RESEARCH INTELLIGENCE

> **Status:** Base de inteligência competitiva e operacional  
> **Produto analisado:** WBuy  
> **Uso:** Referência para decisões da Plataforma de Lojas Virtuais NextLevel  
> **Regra central:** este documento registra evidências, inferências e hipóteses sobre a WBuy. Ele **não** é uma especificação da NextLevel e **não** autoriza cópia automática de soluções da WBuy.

---

## 1. OBJETIVO

Consolidar o conhecimento obtido no estudo real da WBuy para:

- entender como a plataforma organiza capacidades de e-commerce;
- registrar evidências observadas;
- separar fatos de inferências;
- identificar padrões úteis;
- registrar limitações e fragilidades observadas;
- gerar insumos para os documentos especializados da NextLevel;
- manter uma lista explícita do que ainda precisa ser investigado.

A WBuy deve ser tratada como **referência contínua de pesquisa**, nunca como arquitetura obrigatória.

---

## 2. SISTEMA DE CLASSIFICAÇÃO

Toda descoberta deve ser classificada como:

### CONFIRMADO
Observado diretamente em painel, loja publicada, HTML, exportação, e-mail operacional, arquivo ou comportamento reproduzível.

### INFERIDO
Conclusão técnica plausível derivada de uma ou mais evidências confirmadas, mas não comprovada internamente.

### HIPÓTESE
Possibilidade ainda não validada.

### DECISÃO NEXTLEVEL
Conclusão de produto ou engenharia tomada para a NextLevel a partir da pesquisa.  
**Não é evidência sobre a WBuy.**

---

## 3. PRINCÍPIO DE USO

O fluxo correto é:

**WBuy → evidência → interpretação → decisão NextLevel → documento especializado → implementação**

Nunca:

**WBuy → copiar comportamento → implementar**

---

# 4. PAINEL E DASHBOARD

## 4.1 Carregamento modular

**CONFIRMADO**

Foram observados módulos de dashboard carregados separadamente, incluindo:

- últimos pedidos;
- histórico de estoque;
- notificações.

Também foram identificados endpoints/includes distintos associados a esses blocos.

### Evidência técnica observada

- `ultimos-pedidos-include`
- histórico de estoque carregado separadamente
- `dash-notifications-preview-include`

### Interpretação

**INFERIDO**

A WBuy evita depender de uma única resposta monolítica para montar todo o dashboard.

### Decisão derivada para NextLevel

**DECISÃO NEXTLEVEL**

Um widget lento ou com falha não deve impedir a renderização dos demais blocos do painel.

---

## 4.2 Contratos inconsistentes entre widgets

**CONFIRMADO**

Os módulos não seguem um único padrão de resposta:

- últimos pedidos e histórico de estoque retornaram dados estruturados;
- notificações retornaram fragmento HTML.

### Risco observado

Misturar HTML e dados semânticos na mesma camada de integração aumenta o acoplamento entre backend e apresentação.

### Decisão derivada

**DECISÃO NEXTLEVEL**

Domínio e APIs devem preferir contratos semânticos e tipados.  
A interface é responsável por apresentação, cor, badge, layout e composição.

---

## 4.3 Analytics versus operação

**CONFIRMADO**

Ao alterar o período analítico para `23 set – 29 set`, os widgets operacionais não foram recarregados junto com a alteração do período.

### Interpretação

**INFERIDO**

A WBuy parece separar:

- contexto histórico/analítico;
- contexto operacional atual.

### Decisão derivada

**DECISÃO NEXTLEVEL**

O dashboard NextLevel deve separar claramente:

- desempenho no período;
- operação que exige atenção agora.

---

# 5. PEDIDOS

## 5.1 Status com metadados visuais

**CONFIRMADO**

O retorno de pedidos observado incluía informações de apresentação associadas ao status, incluindo campos equivalentes a:

- `tone`
- `bg`

### Interpretação

A API parece fornecer parte da decisão visual do status.

### Decisão derivada

**DECISÃO NEXTLEVEL**

O domínio deve expor estados semânticos como:

- `PAID`
- `PENDING`
- `SHIPPED`
- `CANCELED`
- `REFUNDED`

O Design System decide:

- cor;
- badge;
- ícone;
- label final;
- contraste.

---

# 6. PRODUTOS, VARIAÇÕES E GRADES

## 6.1 Estrutura de SKU e grade

**CONFIRMADO**

A inspeção do HTML do widget `produto-sku-html.html` revelou:

- `#inc_sku`
- `#produto-sku`
- variável `grade_tipo`

Foram observados pelo menos dois comportamentos:

### `grade_tipo='sku'`

Experiência semelhante a:

- seleção de tamanho/variação;
- uma quantidade compartilhada para a escolha.

### `grade_tipo='grid'`

Experiência em grade com:

- quantidade individual por tamanho/variação;
- múltiplas quantidades adicionadas ao carrinho em uma mesma ação.

---

## 6.2 Comparação concreta entre produtos

**CONFIRMADO**

Foram observados produtos de contas diferentes do mesmo cliente com comportamentos distintos:

- produto Capistrano: `grade_tipo='sku'`
- produto WBuy de referência: `grade_tipo='grid'`

Também foi observado em **Configurações → Configurar atacado**:

- atacado ativo;
- mínimo de 6 peças;
- opção de quantidade por variação individual habilitada.

Essa configuração não alterou automaticamente o `grade_tipo`.

### Conclusão

**CONFIRMADO**

A origem exata de `grade_tipo` permaneceu não identificada.

### Hipóteses abertas

**HIPÓTESE**

`grade_tipo` pode depender de:

- configuração específica do produto;
- template/widget utilizado;
- configuração não exposta no painel analisado;
- configuração por conta;
- regra interna da plataforma.

Ainda precisa ser investigado.

---

## 6.3 Implicação arquitetural

**DECISÃO NEXTLEVEL**

A NextLevel não deve modelar `grid` como outro tipo de produto.

O correto é separar:

- Produto
- Variante
- SKU
- Disponibilidade
- Regra comercial
- Experiência de compra

O mesmo conjunto de SKUs deve poder atender:

- varejo unitário;
- atacado;
- pedido por grade;
- múltiplas quantidades simultâneas.

---

# 7. ESTOQUE

## 7.1 Histórico de movimentação

**CONFIRMADO**

O histórico de estoque observado registrava informações como:

- SKU;
- produto;
- quantidade;
- data/hora;
- tipo de movimentação.

### Decisão derivada

**DECISÃO NEXTLEVEL**

A NextLevel deve ir além e registrar também, quando aplicável:

- saldo anterior;
- saldo posterior;
- motivo;
- pedido relacionado;
- usuário ou processo responsável;
- origem da alteração;
- correlation id;
- idempotency key;
- timestamp;
- tenant.

O estoque deve ser auditável.

---

# 8. IMPORTAÇÃO, EXPORTAÇÃO E MIGRAÇÃO

## 8.1 Exportação de produtos

**CONFIRMADO**

Foi observada exportação WBuy em planilha de produtos.

Em estudos anteriores:

- arquivo de exportação continha produtos-pai e variações;
- fotos eram fornecidas por URLs diretas;
- havia colunas de imagem como `foto1`–`foto6`;
- outra exportação utilizava campo `imagem1`;
- imagens eram servidas pela CDN da WBuy.

Em um conjunto analisado:

- 2.740 linhas de variações;
- aproximadamente 539 produtos-pai.

Em outra amostra:

- 49 produtos-pai com `imagem1` preenchida.

### Observação

Foi levantada possível inconsistência de miniaturas/WEBP em parte de uma amostra. Isso não deve ser generalizado sem nova validação.

---

## 8.2 Exportação de clientes/pontos

**CONFIRMADO**

Foi observado recurso de exportação de clientes/pontos em XLSX.

### Decisão derivada

**DECISÃO NEXTLEVEL**

Importação/exportação não deve ser tratada como acessório.

É parte de:

- migração;
- onboarding;
- aquisição de clientes;
- portabilidade;
- suporte;
- operação em massa.

A plataforma deve evoluir para um **Import/Export Engine** com:

- validação;
- preview;
- processamento em jobs;
- relatório de erros;
- processamento parcial;
- reprocessamento de linhas inválidas.

---

# 9. AUTENTICAÇÃO E SEGURANÇA

## 9.1 Código de acesso

**CONFIRMADO**

A WBuy envia códigos temporários de acesso por e-mail.

---

## 9.2 Alertas de novo IP

**CONFIRMADO**

Foram recebidos alertas quando o IP de acesso mudou.

Os alertas também registravam informações sobre acesso/dispositivo.

---

## 9.3 2FA

**CONFIRMADO**

A WBuy recomenda ativação de autenticação de dois fatores por aplicativo.

Também recomenda:

- senha forte;
- senha única;
- troca de senha em caso de acesso não reconhecido.

### Decisão derivada

**DECISÃO NEXTLEVEL**

A plataforma deve possuir um Security Center capaz de evoluir para:

- 2FA;
- sessões ativas;
- revogação de sessão;
- dispositivos;
- histórico de login;
- alertas;
- eventos de segurança;
- auditoria de ações críticas.

---

# 10. PWA E NOTIFICAÇÕES

## 10.1 PWA

**CONFIRMADO**

Foi observado que a WBuy oferece suporte a PWA.

### Limite da evidência

Não foi confirmado que push seja ilimitado em todos os planos ou cenários.

### Decisão derivada

**DECISÃO NEXTLEVEL**

PWA e comunicação com consumidor devem ser tratadas como capacidades desacopladas do storefront.

---

# 11. TEMAS, TEMPLATES E STOREFRONT

## 11.1 Estrutura de tema editável

**CONFIRMADO**

A WBuy foi utilizada com tema/template editável e publicação independente.

O trabalho realizado exigiu preservar:

- variáveis;
- includes;
- placeholders;
- módulos;
- banners dinâmicos;
- vitrines;
- categorias;
- integrações;
- conteúdo administrável pelo painel.

---

## 11.2 Empacotamento de tema

**CONFIRMADO**

Foi observado que o pacote de tema precisava conter diretamente na raiz do ZIP:

- `config.json`
- `global.css`
- `estruturas/`

Empacotamentos incorretos falharam.

---

## 11.3 Superfícies estudadas

**CONFIRMADO**

O estudo de templates abrangeu:

- home;
- categoria;
- busca;
- card de produto;
- página de produto;
- carrinho;
- páginas institucionais;
- vitrines;
- widgets;
- banners nativos;
- configurações de tema.

---

## 11.4 Recursos de storefront preservados

**CONFIRMADO**

Nos trabalhos sobre lojas WBuy, foram tratados como recursos nativos a preservar:

- preço normal;
- preço promocional;
- preço Pix;
- parcelamento;
- imagens;
- SKUs;
- variações;
- tamanhos;
- estoque;
- quantidade;
- adicionar à sacola;
- frete;
- carrinho;
- login;
- favoritos;
- checkout;
- avaliações;
- produtos relacionados;
- compre-junto;
- filtros;
- paginação;
- banners administráveis;
- links;
- WhatsApp.

---

# 12. PROBLEMAS VISUAIS E DE INTEGRAÇÃO OBSERVADOS

## 12.1 Conflito entre tema customizado e estrutura WBuy

**CONFIRMADO**

Em uma loja publicada foram observados conflitos entre:

- tema customizado;
- banners nativos;
- vitrines;
- cards;
- wrappers;
- grids da WBuy.

---

## 12.2 Problemas observados em mobile

**CONFIRMADO**

Foram encontrados casos de:

- overflow;
- módulos sobrepostos;
- cards congestionados;
- galeria deficiente;
- responsividade inconsistente;
- imagens sem limitação adequada;
- preço duplicado ou mal posicionado;
- cards desalinhados.

---

## 12.3 Conflitos de CSS e seletores

**CONFIRMADO**

Foi identificado conflito entre famílias de classes diferentes, incluindo:

- `bd-pdp-*`
- `.lf-pdp-*`

Regras antigas competiam com novas estruturas em blocos como:

- preço;
- atacado;
- botões;
- PDP.

### Decisão derivada

**DECISÃO NEXTLEVEL**

O Visual Commerce da NextLevel deve possuir:

- contratos claros de componente;
- escopo controlado de estilos;
- design tokens;
- sections/blocks;
- versionamento;
- preview;
- publicação;
- rollback;
- responsividade explícita.

---

# 13. BANNERS E CONTEÚDO ADMINISTRÁVEL

**CONFIRMADO**

Durante o trabalho com WBuy, foi requisito preservar banners nativos editáveis pelo painel.

### Aprendizado

Conteúdo administrável não pode ser convertido em HTML estático apenas para melhorar o visual.

### Decisão derivada

**DECISÃO NEXTLEVEL**

O Theme Engine deve preservar a administração de conteúdo pelo lojista sem exigir alteração de código.

---

# 14. PERFORMANCE E ACESSIBILIDADE

Existiram metas de projeto como:

- Lighthouse mobile 85+;
- acessibilidade 90+;
- CLS < 0,1;
- LCP < 2,5 s;
- INP < 200 ms;
- zero 404/erros próprios.

**IMPORTANTE**

Esses números eram **metas de trabalho sobre a loja**, não medições confirmadas da WBuy.

Portanto, não devem ser registrados como performance real da plataforma.

---

# 15. WBUY PLAY

## Estado da evidência

**INFERIDO / NÃO SUFICIENTEMENTE VALIDADO**

Houve pesquisa anterior relacionando WBuy Play a:

- conteúdos educacionais;
- treinamento;
- onboarding;
- aulas.

Mas não existe neste momento evidência observacional suficiente para transformá-lo em referência estrutural da NextLevel.

### Regra

Não promover para arquitetura até nova validação.

---

# 16. WBUY PAY

## Estado da evidência

**INFERIDO / PARCIALMENTE VALIDADO**

Pesquisas anteriores associaram WBuy Pay a:

- Pix;
- cartão;
- saldo;
- saque/transferência;
- conciliação.

Entretanto, várias dessas capacidades vieram de pesquisa e interpretação, não de inspeção técnica completa.

### Regra

Revalidar antes de usar como referência de Payment Architecture.

---

# 17. PADRÕES QUE A NEXTLEVEL DEVE ESTUDAR MAIS

A pesquisa já indica áreas que merecem comparação estruturada:

1. Dashboard e operação
2. Pedidos
3. Produtos
4. Variações
5. Grades
6. Estoque
7. Clientes
8. Marketing
9. Temas
10. Páginas
11. Blog
12. Pagamentos
13. Frete
14. Estatísticas
15. Configurações
16. Segurança
17. PWA
18. Importação/exportação
19. Apps e integrações
20. Lifecycle da loja

---

# 18. LACUNAS AINDA ABERTAS

## ALTA PRIORIDADE

- origem exata de `grade_tipo`;
- estrutura completa de pedidos;
- cancelamento e reembolso;
- reserva e baixa de estoque;
- estrutura completa de clientes;
- checkout;
- regras de pagamento;
- conciliação;
- frete e fulfillment;
- editor de tema;
- versionamento/publicação;
- páginas;
- SEO;
- analytics;
- permissões de usuário;
- multiusuário;
- integrações;
- webhooks;
- API pública;
- lifecycle da loja.

## MÉDIA PRIORIDADE

- blog;
- marketing;
- cupons;
- recuperação de carrinho;
- fidelidade/pontos;
- PWA/push;
- apps;
- WBuy Play;
- WBuy Pay.

---

# 19. REGRAS PARA PRÓXIMAS SESSÕES DE PESQUISA

Ao estudar a WBuy:

1. registrar a tela ou fluxo;
2. registrar o caminho de navegação;
3. registrar campos e estados;
4. observar chamadas de rede quando possível;
5. identificar entidades;
6. identificar fonte de verdade aparente;
7. identificar acoplamento visual/domínio;
8. registrar comportamento mobile;
9. registrar erros e limites;
10. classificar como CONFIRMADO, INFERIDO ou HIPÓTESE;
11. só depois criar uma DECISÃO NEXTLEVEL.

---

# 20. REGRA CONTRA CONTAMINAÇÃO DE EVIDÊNCIA

Não considerar como evidência da WBuy:

- texto do Cloud lendo arquivos da NextLevel;
- conteúdo do `00-CONSTITUICAO-ECOMMERCE.md`;
- decisões arquiteturais já tomadas pela NextLevel;
- sugestões de IA sem observação real;
- metas de performance não medidas;
- funcionalidades assumidas por analogia com outras plataformas.

---

# 21. PRINCIPAIS APRENDIZADOS JÁ CONSOLIDADOS

A pesquisa da WBuy já sustenta os seguintes aprendizados:

- dashboard operacional deve ser modular;
- analytics não deve ser confundido com operação;
- contratos de dados precisam ser consistentes;
- status deve ser semântico, não visual;
- estoque precisa ser auditável;
- SKU e experiência de compra devem ser separados;
- atacado/grade precisam nascer no core comercial;
- importação/exportação é capacidade estratégica;
- segurança de conta precisa ser produto;
- temas não podem dominar regras de comércio;
- conteúdo administrável deve continuar administrável;
- customização visual sem contratos claros causa conflito estrutural;
- mobile não pode ser tratado como redução do desktop;
- a plataforma precisa permitir evolução visual sem quebrar operação.

---

# 22. RELAÇÃO COM OS OUTROS DOCUMENTOS

Este arquivo alimenta:

- `02-COMMERCE-CORE.md`
- `03-PLATFORM-CORE.md`
- `04-VISUAL-COMMERCE.md`
- `05-MERCHANT-PANEL-UX.md`
- `06-STOREFRONT-UX-CONVERSION.md`
- `07-THEMES-TEMPLATES-SEGMENTS.md`
- `08-DATA-ARCHITECTURE.md`
- `09-INTEGRATIONS-EXTENSIBILITY.md`
- `10-SECURITY-RELIABILITY.md`
- `11-QUALITY-ENGINEERING.md`
- `12-COMMERCE-INTELLIGENCE.md`
- `13-ROADMAP-GAPS-DECISIONS.md`

---

# 23. REGRA FINAL

A WBuy deve continuar sendo estudada profundamente.

Mas a pergunta da NextLevel nunca é:

> “Como copiamos isso?”

A pergunta correta é:

> **“Que capacidade de comércio isso revela, qual problema ela resolve, quais limitações observamos e qual é a melhor forma de a NextLevel tratar esse problema?”**
