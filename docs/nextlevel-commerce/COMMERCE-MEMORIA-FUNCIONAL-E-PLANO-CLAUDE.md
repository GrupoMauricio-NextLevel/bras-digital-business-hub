# NextLevel Commerce — memória funcional, reaproveitamento do SuperDrop e plano para Claude Code

> Documento de referência persistente, elaborado em 02/10/2026 a pedido do responsável pelo projeto. Consolida os prints enviados nesta conversa e uma inspeção do repositório. Não é uma declaração de que todos os recursos já existem, foram testados ou estão prontos para produção.

## 1. Resultado principal

A NextLevel Commerce não precisa nascer como uma cópia independente do SuperDrop. O repositório já contém um motor compartilhado e uma modalidade de loja independente com catálogo próprio. O caminho de menor retrabalho é completar essa modalidade, preservar as operações de dropshipping e construir os módulos comerciais que faltam sobre os mesmos serviços de domínio.

O maior valor dos prints não é reproduzir a aparência escura do painel de referência. É identificar a rotina completa de um lojista: cadastrar produtos, controlar variantes e estoque, vender, receber, separar, enviar, atender clientes, personalizar a loja, fazer campanhas e acompanhar resultados.

Quatro decisões orientam o desenvolvimento:

1. Reaproveitar catálogo, estoque, pedidos, autenticação, isolamento, pagamentos, impressão de etiquetas, componentes administrativos e editor de temas existentes.
2. Adaptar as operações para o lojista independente, sem apresentar carteira de recarga, pagamentos à Central ou distribuição para uma rede de fornecedores.
3. Construir CRM, categorias avançadas, PDV, propostas com link, campanhas e preferências como extensões reais, não como telas com dados fictícios.
4. Executar em etapas verificáveis no Claude Code. Este documento é o inventário e o plano, não uma autorização automática para implementar tudo, publicar ou alterar preços.

### 1.1 O que significa “salvar na memória”

Este arquivo preserva o contexto fora da conversa e pode ser lido novamente pelo Claude Code. A continuidade depende de o agente receber o arquivo, consultar a versão atual e atualizar as decisões conforme o código evolui. Não pressupõe memória automática de outro agente, sincronização com o Claude ou instalação de uma skill.

### 1.2 Escopo e limites

- Foi solicitada a documentação e a análise; nenhum módulo do aplicativo foi alterado nesta entrega.
- Os prints mostram um painel com marcas wBuy e Alpha Outfit. “SuperDrop” é a base do nosso projeto analisada para reaproveitamento; não é o nome do painel fotografado.
- Não foram reproduzidos os dados pessoais dos clientes exibidos nas imagens. Exemplos futuros devem usar dados sintéticos.
- Não houve acesso ao código do concorrente, à sua API ou ao seu ambiente autenticado.
- Um botão ou switch observado prova apenas que aquela interface apresenta a opção. Não prova como o concorrente implementa a regra.
- Menus e áreas cortadas foram registrados como referências, não como especificações completas.
- Não foram executados testes do aplicativo, build, testes com credenciais reais ou deploy nesta análise documental.

## 2. Evidências e como interpretar este documento

### 2.1 Fotografia do repositório

| Item | Registro da inspeção |
| --- | --- |
| Repositório | `C:\Users\Pichau\Documents\Projetos\bras-digital-business-hub` |
| Branch | `codex/visual` |
| HEAD | `6becfc85b95f3ff9f261b2dc33a7e425b2ef492d` |
| Stack declarada | Next.js 16, React 19, TypeScript, Tailwind 4, Drizzle, Zod, PGlite local e PostgreSQL/Neon em produção |
| Testes existentes | Vitest; infraestrutura E2E com Playwright |
| Estado de trabalho | Havia alterações locais de trabalho visual no portal Commerce; foram preservadas e não fazem parte desta entrega |
| Documentos consultados | `docs/design/BRIEFING-CODEX.md`, `AGENTS.md`, `CLAUDE.md`, `docs/nextlevel-commerce/aproveitamento-superdrop.md`, `docs/prompts/nextlevel-commerce-plataforma.md` |

O inventário histórico de reaproveitamento é útil, mas algumas de suas pendências já possuem implementação na fotografia atual. O Claude deve conferir o código vigente antes de iniciar uma tarefa, especialmente cadastro independente e catálogo próprio.

### 2.2 Legenda de evidência

| Marcador | Significado |
| --- | --- |
| OBS | Função, campo ou opção diretamente visível nos prints |
| MENU | Nome de módulo visível, sem detalhamento suficiente da operação |
| BASE | Implementação identificada no código do projeto; não significa homologação completa |
| ADAPTAR | Há base, mas faltam regras, permissões ou experiência para a Commerce |
| NOVO | Não foi encontrado um módulo equivalente completo no conjunto inspecionado |
| PROPOSTA | Decisão recomendada para o nosso produto, não uma regra comprovada do concorrente |
| VALIDAR | Depende de testes, documentação atual do provedor, decisão comercial ou descoberta adicional |

“NOVO” não é uma prova matemática de ausência em todo o histórico do projeto. É a ausência de um equivalente completo na inspeção atual. Antes de criar uma tabela ou serviço, pesquisar novamente por nomes, schema, rotas, actions e testes relacionados.

### 2.3 Referências dos prints

Para evitar confusão com os números de imagem que reiniciam a cada mensagem, as fontes são agrupadas por tema:

| Grupo | Conjunto visual utilizado |
| --- | --- |
| A | Seletor de contas, visão geral, pedidos, menu de ações e detalhe de pedido dos envios iniciais |
| B | Alteração de status, preferências e estatísticas de pedidos, pedido balcão, link de pagamento, catálogo e primeiras preferências de produtos |
| C | Continuação das preferências de produtos, detalhe rápido, edição, dimensões, estoque/variações, fotos, vídeo e SEO |
| D | Categoria, listagem/detalhe/preferências/edição de clientes, banners, temas, configurações da loja e plano da plataforma |

Há duplicatas de link de pagamento, detalhe de pedido, estoque/variações e edição de cliente. Foram consolidadas; duplicatas não representam funções novas. Uma imagem muito pequena e campos parcialmente cortados não receberam comportamento inventado.

## 3. Organização recomendada dos módulos

Uma navegação útil para a Commerce deve acompanhar as tarefas do lojista, não a organização interna de tabelas do SuperDrop.

```text
Painel da loja
├── Visão geral
├── Vendas
│   ├── Pedidos
│   ├── Pedido balcão / PDV
│   ├── Propostas e links de pagamento
│   └── Pós-venda e devoluções
├── Catálogo
│   ├── Produtos e variações
│   ├── Categorias
│   ├── Estoque e movimentações
│   ├── Importação e exportação
│   └── Vitrines e recomendações
├── Clientes
│   ├── Listagem e histórico
│   ├── Grupos e segmentação
│   └── Créditos e fidelidade [etapa posterior]
├── Marketing
│   ├── Banners e destaques
│   ├── Promoções
│   └── Campanhas e recuperação [etapa posterior]
├── Loja virtual
│   ├── Temas e editor existente
│   ├── Páginas e conteúdo
│   └── Prévia e publicação
├── Financeiro
│   ├── Vendas e recebimentos
│   └── Plano, faturas e serviços
├── Relatórios
└── Configurações
    ├── Identidade e preferências
    ├── Pagamentos
    ├── Frete e logística
    ├── Equipe e permissões
    └── Domínio e integrações
```

PROPOSTA: essa árvore é uma organização funcional, não uma determinação de URLs novas. Preservar rotas atuais quando possível. Não criar atalhos que levem a módulos vazios, nem exibir recursos específicos do SuperDrop para a conta independente.

## 4. Módulo de contas, acesso e estrutura administrativa

Fontes: A e cabeçalhos/menus dos demais grupos.

### 4.1 Inventário

| ID | Função observada | Aplicação recomendada |
| --- | --- | --- |
| ADM-01 | Selecionar conta/loja, buscar contas e ver identidade/domínio | MULTILOJA posterior, após implementar vínculos de usuário e contexto de loja no servidor |
| ADM-02 | Abrir gerenciamento da loja e ver a loja pública | Reaproveitar shell e resolução de URL; manter identidade clara da loja ativa |
| ADM-03 | Busca global com atalho Ctrl+K | Ampliar a busca existente para produtos próprios e ações autorizadas |
| ADM-04 | Menu lateral com grupos, estado ativo e submenus | Reorganizar por tarefas, preservando capacidades por modalidade |
| ADM-05 | Notificações, perfil e acesso a assistência | Evoluir feed existente; assistente é MENU, não especificação de IA |
| ADM-06 | Acesso de suporte mediante solicitação | Se necessário, sessão delegada temporária, explícita e auditada |
| ADM-07 | Personalizar dashboard e fechar avisos | Preferências por usuário/loja, sem alterar números nem regras comerciais |
| ADM-08 | Chamados, notificações, compras, atividade e usuários | MENU; definir requisitos próprios antes de implementar |

### 4.2 O que aproveitar e o que não confundir

BASE: `src/components/app/role-layout.tsx`, `src/lib/nav.ts`, `src/lib/brand.ts`, `src/components/app/command-palette.tsx` e `src/lib/domain/search.ts`.

A busca global já considera o ator. Na ramificação `STORE_OWNER`, a inspeção encontrou busca de pedidos e clientes, mas não a mesma busca de produtos oferecida ao fornecedor. É uma extensão concreta para a Commerce.

O `Actor` atual contém papel, organização, fornecedor e uma loja. `users.storeId` não equivale a uma tabela de associação de múltiplas lojas. O seletor de usuários demo e a troca de painel da loja própria do fornecedor também não equivalem a multiloja de produção.

PROPOSTA para evolução: associação explícita usuário–loja, permissões por vínculo, seleção de loja validada no servidor e auditoria de troca de contexto. Fazer essa evolução em fase própria; não bloquear o MVP de uma única loja.

Não reutilizar `loginAs` como “entrar como cliente”: em `src/app/actions/auth.ts`, essa função é uma facilidade de demo protegida por `isDemoMode()`. O acesso ao cliente exigiria outro domínio de identidade, regras de suporte e rastreabilidade.

## 5. Dashboard e análise de vendas

Fontes: A e B/estatísticas.

### 5.1 Inventário funcional

| ID | Função observada | Situação no projeto e recomendação |
| --- | --- | --- |
| DASH-01 | Período selecionável e comparação de evolução | BASE de janela e comparação; unificar período entre telas |
| DASH-02 | Pedidos, itens vendidos e ticket médio | BASE; definir quais estados/pagamentos entram na conta |
| DASH-03 | Faturamento e gráfico diário | BASE; distinguir subtotal, frete, descontos e recebimento |
| DASH-04 | Visitantes únicos e visitantes online | NOVO: exige telemetria e política de sessão/privacidade |
| DASH-05 | Conversão | NOVO para conversão de visitas; não chamar razão de pedidos pagos de conversão de visitantes |
| DASH-06 | SKUs esgotados e alertas recentes de estoque | Estoque BASE; criar indicadores e alertas operacionais adequados |
| DASH-07 | Pedidos recentes, status e novo cliente | BASE de pedidos; indicador de primeira compra deve ser calculado |
| DASH-08 | Produtos mais visitados | NOVO; produtos mais vendidos já têm base e são outra métrica |
| DASH-09 | Clientes/vendas por estado | BASE em analytics; evitar inferir visitante por UF do comprador |
| DASH-10 | Mapa de calor por dia e hora | BASE; ajustar período e fuso de forma consistente |
| DASH-11 | Atividade recente, operador, ação e horário | BASE parcial em activities; não equivale a auditoria completa |
| DASH-12 | Histórico de movimentações de estoque | BASE em inventory; disponibilizar visão da própria loja |
| DASH-13 | Avisos de vencimento e faturas | Financeiro BASE; adaptar copy e origem de cobrança |
| DASH-14 | Widgets reorganizáveis/personalizáveis | NOVO como configuração de dashboard, não confundir com editor da vitrine |

### 5.2 Divergências encontradas no código

`computeStoreAnalytics`, em `src/lib/domain/analytics.ts`, considera pedidos não cancelados e soma subtotal para vendas/margem. Isso não significa necessariamente receita recebida: um pedido pendente pode integrar o conjunto.

`getMerchantOverview`, em `src/lib/queries/merchant.ts`, utiliza totais de pedido em cálculos do painel, enquanto analytics trabalha com subtotal. Assim, frete pode aparecer de maneira diferente entre indicadores.

O mapa de calor atual usa um deslocamento fixo de Brasília. Outras janelas utilizam critérios diferentes de data. A nova configuração deve adotar um fuso de loja e um intervalo `[início, fim)` consistente, sem presumir que todas as lojas estarão para sempre no mesmo fuso.

`storeCustomers.ordersCount` e `totalSpentCents` são incrementados na criação do pedido. Não são, por si só, “compras pagas” e “total líquido gasto”. Não reutilizar esses campos sem revisão para o ranking de clientes, pontos ou crédito.

### 5.3 Contrato dos indicadores

Definir e documentar separadamente:

- Pedidos criados: quantidade criada no período, inclusive pendentes, com cancelamentos identificados.
- Pedidos pagos: confirmação válida de pagamento no período definido.
- Vendas brutas: valor de produtos antes de descontos, segundo a regra escolhida.
- Vendas líquidas operacionais: produtos menos descontos, com estornos/devoluções explicitados.
- Frete cobrado: separado do custo de frete pago ao transportador.
- Recebimentos: pagamentos confirmados, não mera criação de pedidos.
- Margem estimada: venda menos custo dos produtos; não rotular como lucro líquido se não deduzir taxas, impostos, frete e outras despesas.
- Ticket médio: numerador e denominador derivados do mesmo conjunto de pedidos.
- Conversão de visitas: pedidos elegíveis divididos por sessões elegíveis; só existe após instrumentação adequada.
- Aprovação de pedidos: razão de pedidos pagos/realizados, quando desejada, com nome próprio.
- Recorrência: clientes com compras elegíveis repetidas; não identificar um consumidor exclusivamente pelo nome.

Aceite: todos os cards, gráficos e exportações para o mesmo período devem reconciliar. Sem dados, mostrar estado vazio, não visitantes e percentuais fabricados.

## 6. Pedidos, status e pós-venda

Fontes: A e B.

### 6.1 Listagem e detalhe

| ID | Função observada | Proposta para a Commerce |
| --- | --- | --- |
| PED-01 | Busca por pedido/cliente | Reaproveitar domínio e ampliar filtros de servidor |
| PED-02 | Abas com status, contagem e cores | Derivar contagens do mesmo filtro/escopo; cores configuráveis de apresentação |
| PED-03 | Seleção, filtros, colunas e ações por linha | Usar componentes existentes; acrescentar paginação e colunas persistidas |
| PED-04 | Número, data, cliente, cidade, valor e pagamento | Dados do pedido e snapshots; mascarar documentos por permissão |
| PED-05 | Transportadora/serviço e atualização de status | Separar serviço escolhido, etiqueta e eventos reais de rastreio |
| PED-06 | Prévia lateral e detalhe completo | Reaproveitar quick view, expandir informações úteis |
| PED-07 | Produtos com imagem, código, SKU, variante e quantidade | Reaproveitar itens; preço histórico não depende do cadastro atual |
| PED-08 | Valores unitários, total por item, subtotal, frete e total | Consolidar cálculo server-side e snapshot financeiro |
| PED-09 | Histórico com data, origem e evento | Ampliar eventos com ator e visibilidade explícita |
| PED-10 | Dados do cliente e endereço, com ajustes | Permissão, motivo e auditoria; bloquear alterações incompatíveis com envio |
| PED-11 | Etiquetas “mobile” e “primeira compra” | Capturar origem e derivar primeira compra; não inventar se não houver dados |
| PED-12 | Sinalizar fraude | Criar sinalização de revisão, não classificação automática sem critérios |
| PED-13 | Marcar pedido impresso | Registro de impressão com ator e horário; definir diferença entre abrir preview e imprimir |
| PED-14 | Imprimir pedido | Layout próprio de impressão; preview atual não é impressão térmica completa |

### 6.2 Ações e preferências

| ID | Função observada | Implementação necessária |
| --- | --- | --- |
| PED-15 | Alterar status, mostrar status atual/novo | Mapear status visual para transições permitidas |
| PED-16 | Observação da mudança visível ao cliente | Separar mensagem pública de observação interna |
| PED-17 | Notificar mudança por e-mail | Outbox ou fila, deduplicação, template por evento e tentativas |
| PED-18 | Observação interna | Persistência por pedido; nunca inserir em comunicação pública |
| PED-19 | Declaração de conteúdo | Documento gerado a partir de snapshot e configuração; não é nota fiscal |
| PED-20 | Nota fiscal | Integração fiscal própria, não simples PDF com aparência de NF |
| PED-21 | Enviar para SuperFrete | Compra/criação de envio, além da cotação existente |
| PED-22 | Código de rastreio | Cadastro manual validado e integração de eventos posteriormente |
| PED-23 | Importar pedidos por planilha | Preview, validação, referências, idempotência e relatório por linha |
| PED-24 | Relatório completo de pedidos | Consulta filtrada, exportação segura e valores reconciliados |
| PED-25 | Personalizar status | Catálogo de status de apresentação, sem quebrar estados do motor |
| PED-26 | Política de cancelamento e arquivamento | Separar cancelar operação, liberar estoque e esconder da listagem |
| PED-27 | Impedir nova tentativa de pagamento de negado | Regra por provedor e status; rejeitado não é automaticamente cancelado |
| PED-28 | Ocultar “comprar de novo” | Preferência de experiência; recompra revalida preço e estoque atuais |
| PED-29 | Não manipular estoque ao devolver | Exige processo de devolução e conferência física, não um booleano isolado |
| PED-30 | Sensibilidade de reCaptcha | Alternativa antifraude a selecionar; não obriga esse fornecedor |
| PED-31 | Limite diário por cliente/IP | Política de abuso, com tratamento de redes compartilhadas e exceções |
| PED-32 | Cor das abas, período padrão e largura térmica | Preferências de operador; dimensões de impressão testadas |

### 6.3 Estados existentes e adaptações críticas

BASE: `src/lib/domain/order-status.ts` e `src/lib/domain/orders.ts`. O motor distingue pagamento do cliente, custo/pagamento à Central, etiqueta e andamento de expedição.

Não substituir o enum do motor por todos os nomes fotografados. “Em análise”, “negado”, “faturado” e “em transporte” podem pertencer a eixos distintos: pagamento, revisão de risco, documento fiscal e logística.

PROPOSTA: manter estados transacionais estáveis e modelar etiquetas/status comerciais apenas quando não alterarem os efeitos financeiros e de estoque. Uma transição deve saber se reserva, libera ou consome estoque e se pode disparar comunicação.

Ponto concreto: `src/components/shared/order-actions.tsx` oferece avanço operacional a papéis de fornecedor/expedição, não ao `STORE_OWNER`. A conta independente precisa executar a própria separação e envio sem ganhar acesso administrativo a um fornecedor alheio. Criar capacidade de expedição da própria loja e alinhar domínio, action e interface.

Outro ponto: confirmação manual de pagamento está exposta para pedido não pago na interface do lojista, sem distinção visual por provedor. A função de domínio deve ser revisada para não permitir que a expansão do painel trate pagamento de gateway como dinheiro recebido por declaração arbitrária. Pagamento manual autorizado precisa de motivo e auditoria; gateway deve ser confirmado pelo serviço apropriado.

O motor existente consome a reserva ao enviar e libera em cancelamentos elegíveis. Devolução não é sinônimo de cancelamento: mercadoria devolvida só retorna ao disponível após conferência e decisão operacional. Estorno financeiro é outro evento.

### 6.4 Critérios de aceite

- Loja A não consulta nem altera pedido da loja B por URL, action, exportação ou ID manipulado.
- Status inválido é rejeitado no servidor, mesmo quando o botão não aparece.
- Duas confirmações do mesmo pagamento não duplicam efeito financeiro ou movimentação.
- Cancelamento elegível libera a reserva uma única vez.
- Alterar cadastro de produto/cliente não reescreve snapshots de pedido antigo.
- Observação interna não aparece na vitrine, no e-mail nem em impressão destinada ao consumidor.
- Commerce independente expede sem recarga; SuperDrop mantém seu fluxo de saldo e Central.
- Pedido em transporte não é marcado entregue por mero clique genérico sem regra e evidência.
- Arquivar não apaga trilha, documentos ou dados exigidos pela operação.

## 7. Pedido balcão / PDV

Fonte: B/pedido balcão. É um módulo distinto do formulário manual atual.

### 7.1 Inventário

| ID | Função observada | Requisito recomendado |
| --- | --- | --- |
| PDV-01 | Categorias e busca por produto/SKU/código de barras | Catálogo da própria loja, busca rápida e barcode quando cadastrado |
| PDV-02 | Cards com imagem, preço, disponibilidade e adicionar | Variante obrigatória quando aplicável, disponibilidade do servidor |
| PDV-03 | Carrinho com subtotal e total | Recalcular preços e quantidades no servidor |
| PDV-04 | Buscar cliente por nome/documento/telefone | Integrar CRM sem vazar resultados de outras lojas |
| PDV-05 | Produto temporário | Item avulso autorizado, identificável no relatório e sem estoque fictício |
| PDV-06 | Forma de pagamento e status | Não confundir modalidade escolhida com pagamento confirmado |
| PDV-07 | Ajustar valor | Desconto/acréscimo com limite por permissão e motivo |
| PDV-08 | Observação e entrega | Mensagem pública/interna separadas; entrega opcional e calculada |
| PDV-09 | Afiliado e créditos | Dependem dos respectivos módulos; não ativar antes de existir regra real |
| PDV-10 | Finalizar venda | Comando idempotente, feedback e recibo/pedido criado |
| PDV-11 | Atalhos F2, F3, F4, F8 e F12 | Inspiração de produtividade; verificar conflitos do navegador e acessibilidade |
| PDV-12 | Tela cheia e preferências | Estado preservado e saída sem perder carrinho |

### 7.2 Reaproveitamento correto

`src/app/merchant/orders/new/new-order-form.tsx` já reúne produtos, quantidades, cliente, canal, frete e observações. `createOrder` é a base para estoque, snapshots e cálculo. Não criar outro motor de pedido só para o PDV.

O formulário atual não é um PDV completo: faltam carrinho orientado a catálogo, busca de cliente, código de barras, pagamento discriminado, ajuste autorizado, item avulso e recibo adequado. O estado inicial de “pago” do fluxo manual merece revisão para evitar confirmação acidental.

Recomendação de MVP: um único pagamento por venda, produtos cadastrados, quantidade inteira e cliente simples. Pagamento dividido, troco, gaveta de caixa, turno, crédito, afiliado e periféricos vêm depois, se a operação demandar.

Aceite: clique duplo/falha de rede não cria duas vendas; preço do navegador adulterado é ignorado; estoque alterado por outra venda causa revalidação clara; venda manual não cria preferência de gateway automaticamente.

## 8. Propostas e links de pagamento

Fonte: B/link de pagamento; a imagem mostra estado vazio e explica a composição da proposta.

### 8.1 Funcionalidades

- LINK-01: listar links/propostas, buscar cliente, filtrar e configurar colunas.
- LINK-02: escolher produtos, variantes, quantidades e condições de pagamento.
- LINK-03: definir validade e identificar proposta ativa, expirada, cancelada ou convertida.
- LINK-04: emitir link compartilhável para o consumidor finalizar na loja.
- LINK-05: copiar/compartilhar por WhatsApp ou Instagram sem presumir envio automático por API.
- LINK-06: registrar conversão em pedido e rastrear a origem.

### 8.2 Projeto recomendado

NOVO como módulo de propostas. Uma URL de checkout do Mercado Pago não equivale a proposta comercial: não contém necessariamente o mesmo catálogo editável, validade, revisão e histórico.

Criar entidade de proposta com loja, cliente opcional, linhas, validade, token não enumerável, status e política explícita de preços. O snapshot pode fixar preço até a validade; se a estratégia for reprecificar, informar ao cliente e validar novamente.

Decidir quando o estoque é reservado. Recomendação inicial: proposta não reserva estoque indefinidamente; a conversão faz a reserva com prazo. Não criar pedidos pendentes só para toda proposta se isso contaminar o dashboard e o estoque.

Gateway e domínio de pedidos devem ser reutilizados na conversão. A mesma proposta não pode converter duas vezes por duas abas. Link expirado deve exibir estado específico e nunca retornar dados pessoais completos pelo simples conhecimento do token.

## 9. Catálogo e cadastro de produtos

Fontes: B/catálogo e C/edição.

### 9.1 Listagem e detalhe rápido

| ID | Função observada | Situação/recomendação |
| --- | --- | --- |
| CAT-01 | Busca por nome/código; filtros; seleção; colunas | BASE de listagens; colunas e paginação precisam de extensão |
| CAT-02 | Imagem, título, código, preço e categoria | BASE; evitar preço único enganoso quando houver valores por variante |
| CAT-03 | Quantidade de variações e estoque agregado | BASE de tamanhos/estoque; mostrar disponível versus físico |
| CAT-04 | Ativo/inativo e ações ver/editar/mais | BASE de active/draft/archived; venda/publicação ainda precisam de separação clara |
| CAT-05 | Novo produto, duplicar e ações em lote | BASE no domínio e nas actions |
| CAT-06 | Detalhe com ID, código, imagem e data de alteração | BASE parcial; apresentação consolidada a completar |
| CAT-07 | Pedidos, visualizações, curtidas, avaliações e avise-me | Vendas têm base; telemetria, favoritos, reviews e alertas exigem módulos próprios |
| CAT-08 | Variantes com SKU, código externo, integração, peso, estoque e preço | BASE limitada a tamanho/SKU; demais campos exigem evolução |
| CAT-09 | Exportar/importar e relatório de erros | Importação de produtos tem base; exportação/contrato da variante a completar |

### 9.2 Campos do editor

| ID | Campo ou área observada | Decisão para desenvolvimento |
| --- | --- | --- |
| PROD-01 | Título e código obrigatórios | Reaproveitar name/SKU; distinguir código interno de barcode |
| PROD-02 | Categoria principal e subcategorias; criar categoria | Principal tem base; múltiplas/subcategorias exigem modelagem |
| PROD-03 | Descrição rica com toolbar | Atual é descrição simples; editor sanitizado é extensão |
| PROD-04 | “Otimizar com IA” | OBS de botão, operação desconhecida; adiar até definir provedor, custo e aprovação |
| PROD-05 | Tipo físico/digital | Físico tem base; entrega digital de produto do lojista é outro módulo |
| PROD-06 | Visível na loja e disponível para venda | Separar publicação de capacidade de comprar |
| PROD-07 | Marca, atributos e selos | NOVO como cadastro estruturado da loja |
| PROD-08 | Informações adicionais, especificações, itens inclusos e garantia | Definir campos/editor extensível; não copiar formulários gigantes sem necessidade |
| PROD-09 | Peso e dimensões do produto embalado | BASE; armazenar unidades únicas e converter apenas na apresentação |
| PROD-10 | Preset de embalagem e frete grátis por produto | Preferência nova; frete global já tem base |
| PROD-11 | Sem variação, cor/tamanho e grade específica | Tamanho tem base; atributos genéricos/color-size exigem migração |
| PROD-12 | Configurar variantes, estoque, editar, remover e ativar | Preservar histórico; inativar variante vendida em vez de destruí-la |
| PROD-13 | Fotos, capa, upload e ordenação | BASE de galeria e compressão; revisar storage e acessibilidade |
| PROD-14 | Vídeo URL, usar como capa e vídeo flutuante | NOVO para cadastro completo; tema com vídeo não equivale a vídeo por produto |
| PROD-15 | SEO com título e descrição | BASE; completar canonical/slug/metadata quando necessário |
| PROD-16 | Gravar, cancelar, salvar e ver loja, permanecer na página | Reusar save bar e dirty guard; separar salvo/publicado |
| PROD-17 | Navegação por seções fixas | Experiência a adaptar no formulário atual |

### 9.3 Configurações adicionais do produto

Estas opções aparecem nos prints e devem permanecer no inventário, mesmo quando não forem prioritárias:

- PROD-18: restringir a grupos de clientes.
- PROD-19: selecionar produtos relacionados e compra conjunta.
- PROD-20: combo associado ao produto.
- PROD-21: personalizador/customização.
- PROD-22: campos adicionais configuráveis.
- PROD-23: multiplicador e equivalência de unidade.
- PROD-24: disposição horizontal/vertical das fotos.
- PROD-25: nome e formato do campo de cor na vitrine.
- PROD-26: prazo de produção e data de lançamento.
- PROD-27: permitir venda sem estoque, com política explícita.
- PROD-28: embalagem para presente.
- PROD-29: upload de arquivo pelo comprador.

“Combo”, pack de tamanhos e compra conjunta não são a mesma coisa. O pack do SuperDrop já expande quantidades das variantes para reservar estoque. Pode sustentar grades/atacado, mas um combo de produtos diferentes precisa de composição e precificação próprias.

### 9.4 Base real para reaproveitar

`src/app/merchant/catalogo/page.tsx` usa `ProductsBody` do fornecedor com `independent` e base de rota merchant. `src/app/merchant/catalogo/[id]/page.tsx` reutiliza `ProductBody` da mesma maneira, protegido por `requireIndependent()`.

`catalogSupplierId()` resolve o fornecedor do gestor normal ou a Central oculta da conta independente. Isso já permite reaproveitar actions de catálogo sem conceder ao lojista acesso à rede de outro fornecedor.

`src/lib/domain/products.ts` contém criação, categoria básica automática, duplicação como rascunho e alteração de status. `src/app/actions/supplier.ts` contém edição, estoque, distribuição, importação e fotos. O nome “supplier” do arquivo não é, sozinho, motivo para duplicar todas as funções.

`src/app/supplier/products/[id]/product-forms.tsx` permite editar nome, descrição, custo, sugerido, mínimo, status, venda unitária/grade, dimensões e SEO. Não contém todos os campos do concorrente.

`src/app/supplier/products/[id]/images-editor.tsx` usa `MediaGallery`, compressão e ordenação, com limite atual de seis fotos. Os limites e tamanhos recomendados no print são políticas do concorrente, não requisitos automaticamente adotados para nós.

### 9.5 Lacunas do modelo

`productVariants` contém tamanho e SKU, não um modelo completo de eixos de cor/tamanho, preço por variante, barcode, código externo e ativação individual. `storeProducts` publica/preça o produto para uma loja, com preço de pack, não todos os preços de variante.

PROPOSTA: evoluir sem criar “commerce_products” paralelo. Adicionar entidades/campos necessários ao modelo compartilhado, com defaults que conservem produtos e packs atuais. Escolher se o preço por variante pertence ao produto base, ao listing por loja, ou a ambos por regra de override. Registrar essa decisão antes da migração.

Não transformar produtos digitais de serviços/temas da Loja NextLevel em mecanismo de download de mercadoria digital do lojista. São domínios diferentes.

Aceite: produtos e estoque da conta independente não aparecem em outra loja; duplicar não duplica saldo; SKU e barcode têm unicidade no escopo definido; variante antiga permanece referenciável em pedidos; imagens e HTML não introduzem conteúdo executável.

## 10. Preferências de produto e experiência da vitrine

Fontes: B e C. Esta seção preserva os switches que seriam fáceis de esquecer.

Regra de implementação: não adicionar dezenas de flags soltas sem definição. Cada preferência deve indicar quem configura, escopo, default, efeito no servidor, efeito na vitrine, dependências e teste. Sempre que possível, usar rótulos positivos no nosso painel para evitar duplas negações.

### 10.1 Estoque, visibilidade e preço

| ID | Opção observada | Recomendação |
| --- | --- | --- |
| PREF-P01 | Controlar venda pela quantidade em estoque | P0: validação server-side sempre; não apenas esconder botão |
| PREF-P02 | Ocultar preço para usuário não logado | P2: evitar que o preço continue em JSON/HTML público |
| PREF-P03 | Mostrar preço de produto indisponível | P2: separar visibilidade e compra |
| PREF-P04 | Mostrar preço de esgotado | P2: não liberar checkout por efeito colateral |
| PREF-P05 | Ocultar produtos sem estoque | P1/P2: indexação, paginação e reativação previsíveis |
| PREF-P06 | Permitir registrar custo | BASE; leitura de custo restrita por permissão |
| PREF-P07 | Quantidade máxima por variação | P1: servidor e carrinho devem aplicar o mesmo limite |
| PREF-P08 | Reserva de estoque | BASE transacional; definir se campo adicional representa margem de segurança |
| PREF-P09 | Não aplicar desconto definido no produto | P2: conflito com regras de promoção precisa de precedência |
| PREF-P10 | Formato de preço no varejo | P2: apresentação, sem trocar moeda/unidade armazenada |
| PREF-P11 | Permitir quantidade fracionada | P3: exige mudança de quantidades, cálculo, estoque e integração |
| PREF-P12 | Loja apenas mostruário | P2: bloquear pedido no servidor, não apenas ocultar carrinho |
| PREF-P13 | Mostruário mostra todos os preços ou só promoções | P2: opções dependentes do modo mostruário |
| PREF-P14 | Bloquear cadastros no mostruário | P2: não confundir com bloquear administradores |

### 10.2 Listagem, filtros e variantes

| ID | Opção observada | Recomendação |
| --- | --- | --- |
| PREF-P15 | Produtos na home e na categoria | Paginação/performance; limites configuráveis com teto seguro |
| PREF-P16 | Produtos por linha no mobile | Configuração de layout responsivo do tema |
| PREF-P17 | Variantes listadas independentemente por cor | P2: preservar vínculo e não duplicar estoque |
| PREF-P18 | Ocultar nome da cor no título nessa listagem | Dependente da opção anterior |
| PREF-P19 | Não jogar produtos sem estoque para o fim | Critério de ordenação, não alteração do estoque |
| PREF-P20 | Ocultar filtros de cor, variação, atributos, marca e preço | Cada filtro precisa de dados reais e URL consistente |
| PREF-P21 | Buscar também na descrição | Busca sanitizada/indexada; relevância e performance |
| PREF-P22 | Esconder alerta de indisponível na miniatura do painel | Apenas apresentação administrativa; manter aviso acessível |
| PREF-P23 | Restringir desmarcação em grade de biquíni | Nicho; não adotar antes de existir produto/grade compatível |
| PREF-P24 | URL de download de produto digital | Só após checkout/entitlement de entrega digital |

### 10.3 Página de produto

- PREF-P25: habilitar/desabilitar avaliações.
- PREF-P26: mostrar/ocultar cálculo de frete no detalhe.
- PREF-P27: habilitar/desabilitar solicitação de cotação.
- PREF-P28: mostrar/ocultar compartilhamento social.
- PREF-P29: mostrar/ocultar aviso de últimas unidades.
- PREF-P30: selecionar automaticamente próxima variante disponível, com aviso e sem troca silenciosa de intenção.
- PREF-P31: mostrar/ocultar prazo de disponibilidade/produção.
- PREF-P32: montar ou não nome com cor e variação.
- PREF-P33: mostrar/ocultar contador de promoção e considerar início/fim da campanha.
- PREF-P34: swatch de cor com foto ou cor sólida.
- PREF-P35: mostrar só percentual de desconto.
- PREF-P36: mostrar/ocultar variantes sem estoque.
- PREF-P37: mostrar/ocultar controles de quantidade.
- PREF-P38: redirecionar ou não ao carrinho após adicionar.
- PREF-P39: rolar ou não ao topo ao selecionar cor no celular.
- PREF-P40: mostrar/ocultar botão de favorito.
- PREF-P41: mostrar/ocultar código do produto.
- PREF-P42: mostrar/ocultar marca; usar logo no lugar do nome quando houver.
- PREF-P43: mostrar/ocultar faixa de preços de variações diferentes; o texto estava parcialmente cortado.
- PREF-P44: descrição inicialmente aberta/fechada.
- PREF-P45: especificações, atributos, itens inclusos e garantia inicialmente abertos/fechados.
- PREF-P46: mostrar/ocultar vídeo na galeria.
- PREF-P47: aplicar/desativar zoom ao passar o mouse.
- PREF-P48: respeitar ordem natural de fotos ou priorizar capa.
- PREF-P49: mostrar/ocultar parcelas e abrir/fechar seus detalhes.
- PREF-P50: incluir ou não preço no título SEO, sem metadata enganosa.
- PREF-P51: exigir escolha de cor/variação no varejo.
- PREF-P52: mostrar/ocultar relacionados.
- PREF-P53: tornar campo de personalização opcional quando houver.
- PREF-P54: posição de banner personalizado no produto.
- PREF-P55: posição do vídeo na galeria.

### 10.4 Card/box do produto

- PREF-P56: compra rápida no card.
- PREF-P57: desativar compra rápida no mobile.
- PREF-P58: mostrar mais de um produto por linha no mobile nesse modo.
- PREF-P59: quantidade no card quando não houver variação.
- PREF-P60: mostrar/ocultar nome, preço, parcelamento e botão de abrir detalhe.
- PREF-P61: link externo direciona para detalhe do produto.
- PREF-P62: mostrar/ocultar estrelas de avaliação.
- PREF-P63: mostrar/ocultar código, bloco de cores e bloco de variações.
- PREF-P64: mostrar atributos no card.
- PREF-P65: mostrar marca e, opcionalmente, seu logo.
- PREF-P66: mostrar/ocultar categorias.
- PREF-P67: mostrar/ocultar contador de promoção.
- PREF-P68: trocar ou não imagem no hover quando houver mais de uma.

### 10.5 Preferências que valem trazer primeiro

Primeiro: controle de disponibilidade, exposição de produtos, escolha de variante, limite por compra, layout mobile, compra rápida quando suportada pelo tema e comportamento de adicionar ao carrinho.

Depois: apresentação de marca/código, relacionados, zoom, parcelas e detalhes expansíveis.

Especializadas: showroom, preços apenas para logados, fracionamento, produto digital, grade de biquíni, personalização e upload do comprador. Não são descartadas; têm dependências que impedem tratar todas como switches simples no MVP.

BASE de editor/tema já permite algumas escolhas de apresentação. Integrar as configurações a `themeGlobals`/templates ou ao domínio de produto conforme a responsabilidade. Não criar duas fontes concorrentes para a mesma preferência.

## 11. Categorias, marcas, atributos e vitrines

Fontes: D/categoria e menus de B/C.

### 11.1 Categoria

| ID | Função observada | Proposta |
| --- | --- | --- |
| CATEG-01 | Nome e tipo de categoria | CRUD próprio por loja/owner; slug e unicidade no escopo |
| CATEG-02 | Ordenação padrão de produtos | Novidade, nome, preço, destaque; opções realmente suportadas |
| CATEG-03 | Restrição por grupo de clientes | Depende de grupo e regra server-side |
| CATEG-04 | Cor de texto e ícone opcionais | Apresentação vinculada ao tema, com contraste acessível |
| CATEG-05 | Intervalo do filtro de preço | Validar limites; não alterar preços do catálogo |
| CATEG-06 | Categoria Google Shopping | Taxonomia externa a validar na etapa de integração |
| CATEG-07 | Visível no menu desktop | Separado de publicação/atividade |
| CATEG-08 | Visível no menu mobile | Separado do desktop |
| CATEG-09 | Ocultar categoria | Definir efeito no menu, URL direta e produtos |
| CATEG-10 | Listagem, busca, filtros, colunas e ações | Listagem reaproveitável; detalhe das preferências não foi mostrado |

`categories` atual, em `src/db/schema.ts`, possui id, supplierId, nome e slug. `ensureCategory()` cria a categoria básica pelo nome no cadastro/importação do produto. Não é um módulo completo de categorias com hierarquia, visibilidade, ordenação e metadados.

PROPOSTA inicial: CRUD de categorias simples, ordenação, ativo e visibilidade no menu. Hierarquia, múltiplas associações e restrição por grupo depois de definir o uso real. Uma categoria oculta do menu pode continuar acessível por URL, se essa for a regra escolhida; não confundir ocultar com privacidade.

### 11.2 Menus correlatos

Avaliações, tabelas, vitrines e upsell/cross-sell aparecem como MENU. Não há nos prints detalhe suficiente para especificar exatamente “tabelas”: pode envolver medidas ou outro tipo de tabela. Fazer descoberta antes de implementar.

Marcas e atributos possuem indicação de seleção/cadastro no produto. Construir entidades somente após decidir necessidade de busca, filtro e reutilização. Um campo JSON livre pode servir a conteúdo, mas não substitui um catálogo de atributos quando precisa de filtros consistentes.

Vitrines do tema já têm base no editor. Vitrine automática/curada pode usar produtos publicados e categorias existentes. Upsell/cross-sell exige regras e medição; não apresentar recomendação personalizada quando for apenas lista manual.

## 12. Estoque e operação logística

Fontes: A, B e C.

### 12.1 Estoque

BASE: `src/lib/domain/inventory.ts` distingue físico, reservado e disponível, com movimentos IN, RESERVE, RELEASE, SALE e ADJUSTMENT. Reaproveitar a disciplina transacional, não implementar soma de estoque diretamente em componentes.

| ID | Recurso | Implementação recomendada |
| --- | --- | --- |
| EST-01 | Estoque por variante | Base existente; variantes genéricas preservam esse vínculo |
| EST-02 | Entrada e ajuste com observação | Base existente; exigir motivo e registrar operador |
| EST-03 | Histórico de movimentos | Base existente; filtro, exportação e referências de origem |
| EST-04 | Disponível, físico e reservado | Expor os três conceitos sem apresentar agregado enganoso |
| EST-05 | Alertas de baixo estoque/esgotado | Limite por SKU ou loja, canal de notificação e dedupe |
| EST-06 | Ajuste em lote/importação | Preview de impacto, validação de reserva e relatório |
| EST-07 | Devolução ao estoque | Processo novo de conferência, condição e local |
| EST-08 | Venda sem estoque/prazo de produção | Política nova, não ignorar validação sem limite e promessa clara |

Não copiar o número exibido no print diretamente para `available`: é necessário saber se representa físico, disponível ou outro saldo. Para nosso produto, explicitar a unidade e o significado na UI.

### 12.2 Logística

| ID | Recurso | Estado identificado |
| --- | --- | --- |
| LOG-01 | Conta SuperFrete/Melhor Envio conectada | BASE de verificação de token; adaptar acesso do dono independente |
| LOG-02 | Origem, peso/dimensões e cotação | BASE de servidor e configuração de entrega |
| LOG-03 | Frete grátis, preparo, acréscimo e retirada | BASE em shippingConfig |
| LOG-04 | Upload/download de etiqueta PDF | BASE com validação, hash e isolamento |
| LOG-05 | Mesclar etiquetas, lista de separação e impressão | BASE com permissões de fornecedor; ADAPTAR para própria loja |
| LOG-06 | Comprar/postar envio pelo agregador | NOVO; interface de cotação não equivale a compra |
| LOG-07 | Coleta e rastreamento automático | NOVO/VALIDAR; não confundir com código cadastrado |
| LOG-08 | Declaração de conteúdo | NOVO como documento operacional próprio |
| LOG-09 | Nota fiscal e documento fiscal de transporte | NOVO/VALIDAR como integração especializada |

As actions de conexão de frete ficam no arquivo de supplier e já usam resolução de catálogo. Há caminho técnico para a conta independente, mas a interface e a revalidação de rotas precisam ser conferidas.

`src/lib/shipping/quote.ts` contém observação explícita de necessidade de teste controlado com token real. Portanto: há código de cotação e testes com cenários simulados; não há prova de homologação real nesta entrega.

O fallback de entrega padrão mantém opções quando a cotação falha. A experiência precisa indicar que é entrega configurada pela loja e que a cotação do provedor está indisponível, sem prometer uma etiqueta comprada ou tarifa real que não existe.

Comprar envio requer confirmação porque movimenta dinheiro externo. Implementar estados de solicitação, resposta, falha e conciliação; chave idempotente; vínculo com serviço escolhido; prevenção de compra duplicada; recuperação após timeout. Nunca assumir que timeout significa “não foi comprado”.

Aceite: token nunca volta ao browser nem aparece em logs; origem pertence à loja; valores são recalculados no servidor; arquivo não-PDF é rejeitado; download e lote respeitam tenant; falha de provedor não muda pedido para enviado.

## 13. Clientes e CRM

Fontes: D/listagem, detalhe, preferências, opções e edição.

### 13.1 Cadastro, listagem e detalhe

| ID | Função observada | Proposta para a Commerce |
| --- | --- | --- |
| CRM-01 | Listar e buscar nome/telefone/e-mail | Evoluir página atual com consultas e filtros de servidor |
| CRM-02 | Cadastro, identificador, origem social, localização, tags e atividade | Capturar apenas campos necessários e origem comprovada |
| CRM-03 | Criar, visualizar, editar e excluir | CRUD com permissões; política de arquivamento quando houver pedido |
| CRM-04 | CPF/CNPJ, RG/inscrição estadual, nome, telefone/celular, aniversário, e-mail | Validação e máscara por tipo; não exigir tudo universalmente |
| CRM-05 | Múltiplos endereços e principal | NOVO como cadastro persistente; pedidos mantêm snapshot |
| CRM-06 | Grupo, vendedor e observações internas | Grupos e atribuição comercial novos; notas só no painel |
| CRM-07 | Gerar nova senha | Preferir fluxo de redefinição; não mostrar senha armazenada |
| CRM-08 | Favoritos, pontos e créditos | Módulos próprios; contadores reais e links para histórico |
| CRM-09 | Histórico e ranking de compras | Base de pedidos; corrigir conjunto pago/líquido |
| CRM-10 | Último IP e bloquear IP | Segurança especializada; não tratar bloqueio como identidade do cliente |
| CRM-11 | Entrar como cliente | Recurso sensível, fora do MVP; sessão delegada limitada e auditada |
| CRM-12 | Imprimir cadastro/detalhe | Documento com minimização de dados e permissão |

### 13.2 Preferências de cadastro/login

Registrar todas as opções visíveis sem assumir que são boas escolhas padrão:

- CRM-P01: tipos de cliente aceitos, CPF e/ou CNPJ.
- CRM-P02: grupo padrão de novos clientes.
- CRM-P03: redirecionamento após login, inclusive checkout quando houver carrinho.
- CRM-P04: limites de repetição por endereço, celular e IP.
- CRM-P05: login suspenso/dropdown.
- CRM-P06: cadastro inicialmente inativo.
- CRM-P07: cadastro inicialmente incompleto.
- CRM-P08: permitir que o cliente selecione seu grupo.
- CRM-P09: exibir todos os grupos ativos nessa seleção.
- CRM-P10: habilitar/desabilitar registro via Facebook.
- CRM-P11: habilitar/desabilitar registro via Google.
- CRM-P12: habilitar/desabilitar link rápido de acesso por e-mail.
- CRM-P13: posição dos campos de e-mail e senha no formulário.
- CRM-P14: exigir data de nascimento.
- CRM-P15: exigir RG.
- CRM-P16: ocultar campos opcionais.
- CRM-P17: usar nome de destinatário fornecido no endereço.
- CRM-P18: solicitar tipo de endereço; opção parcialmente visível, sem campos detalhados.

Recomendação importante: selecionar “atacado” não deve conceder automaticamente preço privilegiado quando isso depende de análise comercial. Pode iniciar solicitação de grupo pendente. O servidor decide o grupo efetivo.

Limite por IP não é bloqueio confiável de pessoa: lojas, empresas e operadoras podem compartilhar IP. Separar alertas, limitação progressiva e bloqueio manual, com critérios e revisão.

### 13.3 Importação, exportação e relatórios

- CRM-13: importar clientes com preview e resolução de duplicidade.
- CRM-14: exportar clientes filtrados.
- CRM-15: inserir/remover pontos por planilha.
- CRM-16: inserir/remover créditos por planilha.
- CRM-17: relatório de clientes com pontos.
- CRM-18: relatório de clientes com crédito.
- CRM-19: ranking dos maiores compradores.
- CRM-20: histórico de clientes.

Importação financeira não deve fazer overwrite silencioso de saldo. Transformar cada alteração em lançamento auditado, com referência de importação, motivo, chave idempotente, aprovação quando necessária e relatório de erro.

### 13.4 Consentimento e separação de dados

Os prints mostram newsletter e aceite de recomendações/carrinho abandonado. Esses sinais não autorizam importar todos os clientes para campanhas indiscriminadamente.

BASE: `customers`, `storeCustomers` e `marketingConsents`, mais `getMerchantCustomers`. A tela atual é listagem operacional, não CRM completo. O rótulo de UI “LGPD-ready” não é prova de conformidade legal.

O cadastro global de cliente demanda cuidado: alterações feitas por uma loja não devem reescrever dados privados usados por outra sem uma regra de identidade compartilhada explícita. PROPOSTA: separar identidade global mínima de perfil, notas, tags, endereços e relacionamento comercial por loja. Avaliar a compatibilidade antes de decidir migração.

A consulta atual de consentimentos carrega registros e filtra em memória. Evoluir o filtro para o banco no escopo da loja reduz leitura desnecessária e facilita auditoria; isso não significa afirmar que a tela atual expõe os registros filtrados de outras lojas.

Capturar finalidade, canal, origem, versão do texto e concessão/revogação. Revogação deve bloquear campanhas futuras. Comunicação operacional de pedido deve ser tratada separadamente do marketing.

Aceite: edição por uma loja não afeta o perfil de outra; notas internas não aparecem ao consumidor; exclusão não rompe pedidos; exportação deixa rastro e respeita papel; campanhas excluem revogados; tokens de redefinição de senha expiram e são de uso único.

## 14. Grupos, atacado, pontos e créditos

### 14.1 Grupos e atacado

Referências: tags varejo/atacado, grupo no cliente/categoria/produto e configuração de atacado no menu.

Há BASE de packs/grades e modalidade de venda varejo/atacado no pedido. Isso não equivale a um sistema completo de B2B com grupos, preços por faixa, mínimo de compra, aprovação de comprador e políticas de pagamento.

PROPOSTA: começar com grupos e política explícita de acesso; depois preço por grupo/quantidade e mínimo. Resolver precedência entre preço do listing, variante, promoção, grupo e pack antes de implementar descontos.

Não reaproveitar preço mínimo do fornecedor como preço de atacado do cliente. O piso de revenda do SuperDrop e o benefício B2B do consumidor são regras diferentes.

### 14.2 Fidelidade

NOVO: ledger de pontos com concessão, resgate, reversão e expiração. Concessão recomendada após pagamento elegível, não simples criação de pedido. Estorno/devolução deve reverter conforme regra documentada.

### 14.3 Créditos do consumidor

NOVO como domínio próprio. Não reaproveitar contas de carteira do lojista para guardar crédito de cliente.

Separar:

| Conceito | Titular | Uso |
| --- | --- | --- |
| Carteira SuperDrop | Lojista da rede | Recarga e pagamento de custo à Central |
| Crédito de consumidor | Cliente daquela loja | Compra, compensação ou devolução, conforme política |
| Recebimento de venda | Lojista | Dinheiro confirmado por modalidade/provedor |
| Cobrança de plano | Loja/contratante | Assinatura e recursos da plataforma |

Saldo de crédito deve ser derivado de lançamentos. Proibir débito abaixo do disponível, resgate concorrente duplo e alteração arbitrária por simples edição de campo. Registrar dinheiro em centavos; pontos têm unidade própria, não reais disfarçados.

## 15. Marketing: banners, destaques e campanhas

Fontes: D/banners e menus.

### 15.1 Banners — observado em detalhe

| ID | Função observada | Requisito recomendado |
| --- | --- | --- |
| MKT-01 | Lista com nome, imagem, posição, disponibilidade e atividade | Consulta própria por loja e estado de publicação |
| MKT-02 | Busca, filtros e colunas | Componentes comuns; filtros por posição, período e ativo |
| MKT-03 | Criar, editar, duplicar e excluir | Duplicar como rascunho/inativo para evitar campanha acidental |
| MKT-04 | Posição principal/carrossel, topo, central, rodapé e meio | Mapear para slots reais do tema, não pixels fixos globais |
| MKT-05 | Nome administrativo | Não precisa ser exibido ao consumidor |
| MKT-06 | Formato imagem, GIF ou vídeo | Validar MIME, tamanho, codecs e política de autoplay |
| MKT-07 | Mídia desktop e mobile/tablet | Fallback explícito e preview em ambas as larguras |
| MKT-08 | Link de destino e abertura | Validar URL/protocolo e segurança de nova aba |
| MKT-09 | Expira, disponível de/até e não expira | Fuso, limite exclusivo e publicação automática previsível |
| MKT-10 | Ajuda sobre tamanho e posição | Guia derivado do slot/tema e preview, não exigência de um formato único |
| MKT-11 | Opções avançadas recolhidas | MENU de área; conteúdo não observado, não inventar fields |

### 15.2 Integração com editor existente

Há banners e seções no motor de tema. Isso permite reaproveitar renderizadores e slots, mas não prova a existência de CRUD de campanhas com agenda, listagem e arquivos por dispositivo.

Definir uma única fonte de verdade: o módulo Marketing administra campanhas/ativos e o editor escolhe onde renderizar; ou o banner permanece um bloco do tema com agenda. Se optar pelo primeiro, o bloco referencia campaignId. Não armazenar duas cópias editáveis do mesmo banner sem regra de sincronização.

Aplicar a agenda na renderização/cache e no estado administrativo. Não depender exclusivamente de cron que pode atrasar. Cache e publicação precisam permitir que um banner expire no horário configurado.

### 15.3 Outros módulos apenas citados em menu

| ID | Módulo | Tratamento |
| --- | --- | --- |
| MKT-12 | Popups | Descobrir gatilho, frequência, alvo e consentimento; evitar bloquear checkout |
| MKT-13 | Carrinho abandonado | Captura de carrinho/identidade, elegibilidade, consentimento, fila e cancelamento após compra |
| MKT-14 | Destaques | Reusar vitrines/featured quando equivalente |
| MKT-15 | Live Shop | Requisitos novos de transmissão/oferta; não especificado pelos prints |
| MKT-16 | Newsletter | Listas elegíveis, opt-in/revogação, envio e métricas |
| MKT-17 | Ofertas periódicas | Agenda e política de preço; detalhes não observados |
| MKT-18 | Promoções | Motor de desconto com precedência, limites e auditoria |
| MKT-19 | Redes sociais | Configuração/links; automação não demonstrada |
| MKT-20 | Selos de segurança | Conteúdo verificável; não inventar certificação |

Carrinho abandonado não pode ser apenas um cron mandando e-mail para todo cliente com pedido pendente. Carrinho, checkout iniciado e pagamento aguardando são eventos diferentes.

BASE em `src/lib/domain/order-emails.ts`: notificações de pagamento/envio e deduplicação. Isso ajuda a comunicação transacional, mas não representa campanhas, segmentação, opt-out ou relatório de newsletter completos.

## 16. Temas, conteúdo e publicação

Fonte: D/temas, C/configurações visuais de produto e documentação/código do projeto.

### 16.1 Funcionalidades a preservar

- TEMA-01: identificar tema ativo e temas disponíveis.
- TEMA-02: personalizar conteúdo/estilo e alterar estrutura.
- TEMA-03: reorganizar seções e componentes.
- TEMA-04: editar cabeçalho, logo, busca e ícones quando o schema permitir.
- TEMA-05: preview desktop/mobile antes de publicar.
- TEMA-06: rascunho não muda a loja pública até publicação.
- TEMA-07: histórico/restauração e descarte de rascunho.
- TEMA-08: disponibilidade de recurso por plano/tema comprado.
- TEMA-09: conteúdo de páginas e blog, vistos em MENU, a descobrir/evoluir.

### 16.2 Reaproveitamento de alto valor

BASE: `src/lib/themes/store.ts`, `template.ts`, `types.ts`, `sections.ts`, `editor-state.ts`, `catalog.ts`, `install.ts`, `preview.ts` e componentes de storefront/editor.

O catálogo atual registra Starter, Arena, Editorial e Signature. O engine diferencia templates de home, produto, coleção e carrinho, além de globals de cabeçalho/rodapé, rascunho/publicado e histórico de versões. Não recriar outro page builder para a Commerce.

Importante: a existência de uma seção com vídeo ou compra rápida não significa que todo cadastro de produto ou toda preferência observada esteja implementada. Verificar suporte por tema, schema, entitlement e renderer.

As configurações legadas de aparência e o editor possuem caminhos distintos. Definir autoridade de cada campo e compatibilidade para que salvar cores em Configurações não pareça funcionar enquanto um `themeGlobals.published` anterior prevalece na loja pública.

Não usar o marketing do concorrente “sem custo adicional” como regra de preço do nosso projeto. Preços, compra de temas e planos permanecem decisões comerciais próprias, com fonte de verdade atual e autorização específica para alterações.

Aceite: rascunho só é acessível em preview autorizado; uma loja não acessa preview da outra; publicação é atômica; restaurar versão não altera outra loja; recurso bloqueado não é ativado por payload manual; sem conteúdo publicado, fallback é previsível.

## 17. Configurações da loja e preferências

Fonte: D/configurações.

### 17.1 Identidade e operação

| ID | Recurso observado | Estado/recomendação |
| --- | --- | --- |
| CFG-01 | Nome da loja | BASE em updateStoreAction |
| CFG-02 | Logo com upload/salvar | BASE de aparência; revisar asset/storage e sincronização com tema |
| CFG-03 | Favicon com upload/salvar/excluir | Extensão específica; tamanho e formato validados |
| CFG-04 | Loja em manutenção | NOVO/VALIDAR comportamento público, admin e checkout |
| CFG-05 | Loja em lançamento | Definir preview/página de lançamento e captura de leads |
| CFG-06 | Geral: home, menu mobile, alertas e modal | Preferências divididas por responsabilidade |
| CFG-07 | Carrinho: preferências, cores e textos | Integrar tema sem burlar regras de preço/estoque |
| CFG-08 | Checkout: cores e textos | Integrar engine de checkout; texto não pode ocultar preço obrigatório |
| CFG-09 | Clientes: cadastro, login e central | Depende de CRM/identidade do consumidor |
| CFG-10 | Produtos: preferências, detalhe e card | Inventário da seção 10 |
| CFG-11 | Rodapé: newsletter, copyright, atendimento e pagamento | Conteúdo/tema; ícone de modalidade só se realmente disponível |
| CFG-12 | SEO global | Fonte de metadata e fallback por página |
| CFG-13 | Notificações desejadas | Por usuário/canal; separar operação, marketing e alertas críticos |
| CFG-14 | Segurança | Área parcialmente visível; definir escopo antes de criar controles |

### 17.2 Integrações no menu

Formas de pagamento, frete/logística, atacado, e-mails, domínio e scripts por página aparecem como MENU. Há base real para parte dessas funções, mas não é possível inferir todos os campos do concorrente.

Evitar scripts arbitrários por página no MVP. Eles podem ler dados de checkout ou causar XSS. Quando necessário, oferecer integrações aprovadas, CSP, permissões e auditoria, com segregação de contextos sensíveis.

Não editar configurações globais da plataforma para satisfazer uma preferência da loja. Defaults de plataforma, política comercial, preferências de tenant, overrides de produto e preferências de usuário precisam de precedência explícita.

PROPOSTA de contrato: schemas Zod versionados por área, defaults seguros, leitura centralizada e migrations compatíveis. Usar tabelas/configuração existentes quando equivalentes; não criar um JSON gigante sem validação nem centenas de colunas sem necessidade.

## 18. Plano, faturas, serviços e administração da plataforma

Fonte: D/meu plano e menus gerais.

### 18.1 Inventário

| ID | Função observada | Recomendação |
| --- | --- | --- |
| FIN-01 | Plano atual, mensalidade e limite de produtos | Reaproveitar ofertas/entitlements e regras próprias |
| FIN-02 | Vencimento e modalidade de pagamento | Fonte financeira única, autorização de alteração |
| FIN-03 | Hospedagem e taxas/condições adicionais | Não reproduzir cobrança do concorrente; mostrar somente valores contratados |
| FIN-04 | Comparar planos mensal/anual e benefício | Política comercial própria, preço do servidor |
| FIN-05 | Trocar de plano | Upgrade/downgrade, vigência, proporcionalidade e consequência para recursos |
| FIN-06 | Limite de requisições por IP e termos | Política de plataforma, não controle irrestrito do lojista |
| FIN-07 | Faturas, compras e recursos adicionais | Integração com billing e Loja NextLevel existentes |
| FIN-08 | Atividade, chamados e notificações | Base parcial/novos fluxos a descobrir |

### 18.2 Cuidados de reaproveitamento

Há modelos legados de subscriptions/invoices e o domínio financeiro com `financeInvoices`, além de pagamentos/entitlements NextLevel. A leitura de “Meu plano” deve ser conciliada com o billing efetivamente usado pela conta independente. Não construir um terceiro sistema de fatura por conveniência visual.

`src/lib/features.ts` declara `team` e `reportsExport`. Uma flag habilitada não prova que convite de equipe ou exportação completa estejam implementados. Conferir endpoints, ações, UI e testes antes de marcar pronto.

O financeiro do merchant ainda possui linguagem relacionada a SuperDrop, recarga e custo debitado. A Commerce precisa distinguir plano/serviços da plataforma de vendas/recebimentos do lojista, sem sugerir que o custo do pedido foi pago a uma Central externa.

Não hardcodar no novo painel preços, dias de suspensão, percentuais, descontos anuais ou limites fotografados. Usar fonte de regras existente e parâmetros autorizados. Não alterar preços atuais nesta etapa documental.

## 19. Matriz de reaproveitamento profundo do SuperDrop

### 19.1 Reaproveitar o núcleo, sem duplicação

| Bloco | Evidência de código | O que traz para a Commerce | Limite |
| --- | --- | --- | --- |
| Conta independente | `domain/independent.ts`, `domain/store-access.ts`, `require-independent.ts` | Cadastro sem fornecedor visível, catálogo privado e acesso do dono | Central oculta é adaptação existente, não arquitetura seller concluída |
| Catálogo | `domain/products.ts`, actions de supplier e páginas merchant/catalogo | Cadastro, edição, duplicação, status, fotos e importação | Modelo avançado de variantes/categorias ainda falta |
| Estoque | `domain/inventory.ts` | Reserva, baixa, liberação, entrada e ajuste | Devolução e múltiplos depósitos exigem extensão |
| Pedidos | `domain/orders.ts`, `domain/order-status.ts` | Cálculo, itens, snapshots, eventos e transições | Fluxo visual do dono independente precisa completar expedição |
| Pagamento | `payments/service.ts`, `payments/mercadopago.ts` | Consulta à API com token da loja e confirmação vinculada | Não prova homologação real; rever confirmação manual |
| Frete | `shipping/quote.ts`, `shipping/providers.ts` | Cotação de servidor, validação e fallback | Compra e tracking não são a mesma interface |
| Etiquetas | `domain/labels.ts` | PDF validado, hash, downloads e lote | Permissões atuais de lote são de fornecedor |
| Analytics | `domain/analytics.ts`, queries merchant | Vendas, canais, produtos, UF e mapa de calor | Não há visitantes/conversão real sem telemetria |
| Clientes básicos | Schema + queries + página merchant/customers | Relação de cliente com loja e consentimento | Não é CRM editável completo |
| Temas | `lib/themes/*` | Builder, schemas, drafts, publicação e versões | Integrar novos banners/preferências sem estado duplicado |
| Componentes administrativos | `components/ds/*`, `components/app/*`, `components/shared/*` | Lists, gallery, save bar, drawers e feedback | Componentes não substituem domínio/segurança |
| Billing e entitlements | `domain/finance.ts`, `lib/finance/*`, `features.ts` | Plano, restrições e cobrança | Reconciliar legacy e evitar copy de dropshipping |

### 19.2 Adaptar antes de expor como Commerce

- Expedição e listas de separação acessíveis ao dono independente, restritas à própria loja.
- Copy e navegação sem “Central”, “recarga” e “rede” quando não fazem parte da modalidade.
- Busca global do merchant incluindo catálogo próprio.
- Catálogo base versus publicação/preço da loja: diminuir confusão sem fundir responsabilidades indevidamente.
- Revalidação de páginas merchant após actions compartilhadas originalmente destinadas ao supplier.
- Conexão de frete e origem no contexto da loja independente.
- Dashboard e relatório com definição financeira única e fuso consistente.
- Detalhes de pedido com mensagens públicas/internas e identidade do operador.
- Galeria e formulários com salvar/cancelar/preview uniformes.
- Financeiro do merchant com contratos da conta independente e recebimentos reais.
- Onboarding distinguindo conectado/demo/validado e configuração/completude operacional.

### 19.3 Manter específico do SuperDrop

- Carteira do lojista para financiar custo do pedido à Central.
- Recargas Pix e liberação de pedidos aguardando saldo.
- Distribuição de catálogo para toda a rede ou lojas selecionadas.
- Piso de revenda e margem em relação a preço do fornecedor.
- Taxas/contratos da Central e comissões próprias daquela modalidade.
- Operação agregada de expedição de várias lojas da rede.
- Gerenciamento de fornecedor, rede e lojistas parceiros.

Esses mecanismos continuam importantes no motor compartilhado. “Não trazer para a Commerce” significa não impor ao lojista independente nem apresentá-los como suas rotinas; não significa apagar do projeto.

### 19.4 Construir como extensões

- CRM completo, perfis por loja, endereços, grupos, notas, filtros e exportações.
- Categorias com administração, visibilidade, ordenação e associações avançadas.
- Variantes genéricas, códigos de barras e preço individual/override quando aprovados.
- PDV comercial e propostas com link de pagamento.
- Banners/campanhas com agenda e mídia por dispositivo.
- Cupons/promoções com cálculo server-side e regras de precedência.
- Crédito do consumidor, pontos e respectivos ledgers.
- Telemetria de visitas, favoritos, reviews e avise-me.
- Equipe da loja e multiloja com associações/permissões próprias.
- Compra de etiqueta/envio, tracking e integração fiscal homologada.
- Preferências versionadas de vitrine e checkout que ainda não tenham equivalente.

## 20. Achados prioritários da inspeção e riscos

Os pontos abaixo são itens de engenharia para reprodução e teste. Não são laudos de exploração nem afirmações de incidente em produção.

| ID | Achado | Ação recomendada | Prioridade |
| --- | --- | --- | --- |
| R-01 | Independente já usa Central oculta e SUPPLIER_OWN | Não reimplementar o cadastro; preservar testes de independent | P0 |
| R-02 | OrderActions avança operação apenas no lado supplier | Introduzir capacidade de expedir própria loja em UI/action/domínio | P0 |
| R-03 | Confirmação manual não é discriminada por gateway no botão | Revisar guard e permissão; impedir falsa confirmação de pagamento externo | P0 |
| R-04 | Listagens e textos merchant ainda mostram conceitos da Central | Adaptar por capacidade/modalidade, não apenas pela cor da marca | P0 |
| R-05 | createOrder incrementa totalSpent/contador ao criar | Definir métricas pagas e elegibilidade de CRM/fidelidade | P0/P1 |
| R-06 | Overview e analytics usam bases de soma diferentes | Criar contrato de indicadores e testes de reconciliação | P1 |
| R-07 | Actions de stock/duplicação/frete revalidam rotas supplier em alguns caminhos | Conferir refresh/cache do merchant e acrescentar invalidação apropriada | P1 |
| R-08 | upsertStoreProductAction precisa de revisão de ownership além de status/distribuição | Testar payload com produto estrangeiro; exigir acesso ao catálogo no servidor | P0 |
| R-09 | Consulta de consentimentos filtra após leitura ampla | Escopar query no banco e evitar processamento desnecessário | P1 |
| R-10 | Perfil global de customer é reaproveitado por lojas | Proteger edição tenant-local e documentar identidade compartilhada | P0 antes do CRM |
| R-11 | orderEvents tem papel, não identidade completa do ator/visibilidade | Evoluir auditoria e mensagens públicas/internas com compatibilidade | P1 |
| R-12 | Produto/variante não possui todos os campos dos prints | Migração incremental e backfill, não UI com campos sem efeito | P1 |
| R-13 | IndexList trabalha com rows no cliente | Planejar paginação/filtros de servidor antes de grandes catálogos | P1 |
| R-14 | Cotação contém aviso de validação com token real | Homologar em ambiente autorizado; não prometer compra/envio real | P0 para release logística |
| R-15 | appearance legacy e templates/globals publicados coexistem | Definir precedência e sincronização de campos | P1 |
| R-16 | Flags team/reportsExport não garantem módulos | Descobrir implementação antes de estimar como concluído | P1 |
| R-17 | configuração demo e status conectado podem aparentar onboarding concluído | Gate de produção explícito; mock nunca vale como homologação | P0 |
| R-18 | publishStoreAction não deve ser tratado como certificado de prontidão | Definir checklist operacional separado de ativação/publicação | P0 para release |
| R-19 | Data payload de quick view deve ser revisto por papel | Evitar custo e outros campos sem autorização no client payload | P1 |
| R-20 | Console de integrações pode receber objetos de erro | Sanitizar logs sem token, documento, endereço ou payload completo | P0 |

Os itens não precisam virar uma reescrita ampla. Cada correção deve ter escopo, evidência, teste de regressão e atualização do inventário.

## 21. Arquitetura recomendada para evoluir sem quebrar o SuperDrop

### 21.1 Separar conceitos que parecem iguais na UI

| Conceito | Responsabilidade |
| --- | --- |
| Marca | Identidade visual, copy e entrada pública |
| Modalidade comercial | Conta independente, loja de rede, loja própria de fornecedor etc. |
| Tenant/loja | Fronteira de dados e recursos operacionais |
| Papel/permissão | Ações autorizadas para aquele usuário naquele tenant |
| Plano/entitlement | Recursos contratados e limites |
| Provedor | Pagamento/frete/e-mail externo com credenciais próprias |

Uma cookie de marca, rota `/lojas` ou flag `independent` do componente não concede permissão de dados. O servidor resolve ator, loja, ownership, recurso contratado e transição válida.

### 21.2 Central oculta: aproveitar agora, evoluir depois

O modelo atual cria organization/supplier/network ocultos para armazenar catálogo e estoque e conserva interfaces existentes. É uma adaptação funcional já presente e coberta por testes de domínio.

Não migrar para uma entidade geral `seller` só porque o comentário do código menciona uma fase futura. Essa mudança depende de desenho, compatibilidade de todos os vínculos e necessidade concreta. Primeiro completar as rotinas independentes sobre o modelo existente; depois planejar a abstração com migration e rollback próprios.

`SUPPLIER_OWN` também é usado por loja própria de fornecedor real. Para reconhecer especificamente a conta independente, usar a resolução existente de supplier oculto e não apenas testar kind.

### 21.3 Contratos de escrita

Para cada módulo:

1. Input Zod no limite de confiança.
2. Ator e tenant derivados da sessão, não aceitos como autoridade do cliente.
3. Domínio com guards, invariantes e transação.
4. Idempotência para operações repetíveis ou de efeito financeiro.
5. Eventos/auditoria com autor, entidade, motivo e visibilidade apropriada.
6. Retorno mínimo, sem segredo ou campos de outro papel.
7. Revalidação das rotas/consultas realmente usadas.
8. Tratamento de falha que não finge sucesso.

As primitives de inventory precisam de escopo validado pelo chamador. Não torná-las actions públicas passando apenas variantId e assumindo que estar autenticado basta.

### 21.4 Dinheiro, unidades e históricos

- Dinheiro em centavos inteiros; display com utilitários existentes de BRL.
- Percentuais em representação definida e documentada, sem mistura de fração/percentual/bps.
- Peso canônico em gramas, dimensão em centímetros; converter kg só na entrada/apresentação.
- Quantidade inteira enquanto o motor de estoque não suporta unidade fracionada.
- Pedido guarda snapshot de produto, endereço e preço.
- Identificadores internos não são tokens públicos de acesso.
- Estoque, pontos e créditos precisam de lançamentos, não saldo livre editável sem trilha.
- Datas persistidas de forma coerente; datas de campanha interpretadas no fuso escolhido.

### 21.5 Dados novos — desenho proposto, não schema aprovado

Prováveis extensões, a revisar antes de escrever migrations:

- Perfil/endereços/notas/tags de cliente por loja.
- Grupos e associação de cliente com estado de aprovação.
- Campos e relações de categorias/atributos/marcas.
- Eixos/valores de variante e eventual listing/preço por variante.
- Preferências versionadas por área.
- Propostas e linhas com tokens/validade/conversão.
- Campanhas/assets e referências de slot.
- Impressões, devoluções e mensagens públicas/internas de pedido.
- Memberships e convites de equipe, antes de multiloja.
- Ledger de crédito/loyalty somente na etapa específica.
- Remessas compradas e eventos normalizados de rastreio.

Não criar todas essas tabelas numa única migration antecipada. Cada módulo precisa provar seus relacionamentos, invariantes, consulta e consumo.

## 22. Priorização por valor operacional

| Faixa | Objetivo | Inclui |
| --- | --- | --- |
| P0 | Vender e operar com segurança | Ownership, pagamento, reserva, permissões, expedição independente e separação SuperDrop |
| P1 | Rotina diária completa | Catálogo organizado, categorias, estoque, pedidos, CRM básico, relatórios reconciliados e impressão |
| P2 | Conversão e gestão comercial | PDV, propostas, banners, preferências úteis, grupos/atacado e promoções |
| P3 | Expansão especializada | Fidelidade, crédito, automação, telemetria, fiscal, digital, multiloja e Live Shop |

Não existe compromisso de prazo ou orçamento neste documento. Complexidade depende das decisões de modelo e dos provedores. Nada aqui comprova que “está 80% pronto” ou outro percentual.

### 22.1 O que evitar no primeiro ciclo

- Um clone visual completo com botões sem persistência.
- Todo o conjunto de switches antes de existir o domínio correspondente.
- Transformar tela de plano em alteração de preço sem aprovação.
- Reescrever catálogo/pedido/tema para separar marcas.
- Conectar API real ou comprar etiqueta em teste sem autorização.
- Implementar login como cliente, scripts arbitrários, crédito e fiscal de forma superficial.
- Confundir serviços digitais da plataforma com produtos digitais vendidos pelo lojista.
- Reproduzir limites e defaults do concorrente como requisito absoluto.

## 23. Roteiro de execução no Claude Code

As etapas abaixo são ondas deste plano, não os códigos de fase de documentos históricos do projeto. O Claude deve verificar a correspondência antes de atualizar documentação existente.

### Onda 0 — mapa atual e contratos, sem implementação ampla

Entregas: mapa atualizado de rotas/actions/domínio/schema/testes; reprodução dos achados R-01 a R-20; separação pronta/parcial/nova; contrato mínimo de permissões, status e indicadores; proposta de primeiro PR/commit local.

Concluir com escopo recomendado. Não alterar produção, preços ou criar migrations nesta onda de descoberta. Pequenos ajustes de documentação só se autorizados.

### Onda 1 — núcleo independente e segurança operacional

Entregas: completar expedição do dono independente; guard de confirmação manual; ownership do listing; copy/menu contextual; revalidação adequada; testes tenant-cross e preservação do fluxo SuperDrop.

Aceite: conta independente cria/vende/reserva/separa/envia sem recarga; loja de rede continua dependente de suas regras de saldo; usuário de uma não opera a outra.

Dependência: Onda 0. Não incluir CRM, PDV nem remodelagem geral seller.

### Onda 2 — catálogo, categorias e estoque de uso diário

Entregas: CRUD de categorias; formulário de produto organizado; galerias; filtros e paginação; estoque/movimentações; import/export incremental; variantes avançadas somente após contrato e migration aprovados.

Aceite: cadastrar, editar, arquivar, duplicar, categorizar, importar e publicar produtos; preservar histórico e packs existentes; dados do merchant atualizam imediatamente após actions compartilhadas.

Dependência: Onda 1. Dividir esta onda se a evolução de variantes exigir migração relevante.

### Onda 3 — pedidos completos e impressão

Entregas: filtros/contadores coerentes; detalhe com snapshots; notas públicas/internas; impressão de pedido e picking; metadados de impressão; devolução operacional básica se aprovada; política de status de apresentação.

Aceite: teste de transições, reserva/baixa/liberação, mensagens, acesso a documentos e impressão desktop/térmica; fiscal real não pode ser marcado concluído nessa entrega.

Dependência: Onda 1; categorias não são bloqueio para todo trabalho de pedidos.

### Onda 4 — CRM e grupos

Entregas: perfil tenant-local, CRUD, endereços, tags/notas, histórico elegível, grupos, consentimentos e import/export seguro.

Aceite: cliente compartilhado não permite edição indevida entre lojas; opt-out respeitado; métricas reconciliadas; senha somente por fluxo seguro.

Dependências: Onda 0 para modelo de customer e contrato de indicadores; Onda 3 para histórico/mensagens. Pontos e créditos ficam fora deste escopo.

### Onda 5 — dashboard e relatórios consistentes

Entregas: função única de seleção de pedidos elegíveis; indicadores reconciliados; período/fuso; ranking por venda, canais/UF/horário; alertas; exportação.

Aceite: resultados reproduzíveis por fixture e iguais entre cards/exportações; visitantes e conversão ainda ocultos/indisponíveis quando não instrumentados.

Pode começar antes de Onda 4, desde que contrato de indicadores esteja definido. Não adicionar telemetria invasiva para preencher card vazio.

### Onda 6 — PDV e propostas comerciais

Entregas: PDV MVP apoiado em createOrder; busca de cliente; carrinho validado; modalidades manuais auditadas; proposta válida com conversão idempotente e compartilhamento.

Aceite: duas abas, clique duplo, estoque concorrente, preço adulterado, proposta expirada e retomada após erro. Item temporário e desconto exigem permissão antes de ativar.

Dependências: catálogo/Onda 2, núcleo/Onda 1 e CRM básico/Onda 4.

### Onda 7 — banners, preferências e publicação

Entregas: campanhas/ativos com agenda, referências ao tema, desktop/mobile, preview; preferências P1/P2 selecionadas; identidade/favicon/manutenção; rascunho/publicação coerentes.

Aceite: agenda/fuso/cache; draft não vaza; link seguro; media inválida rejeitada; preferência realmente muda vitrine e não burlar venda. Não criar outro editor.

Dependências: editor atual, Onda 2 e contrato de configuração. Pode evoluir em paralelo lógico a vendas, mas não exige agentes paralelos.

### Onda 8 — integrações e operação real

Entregas: homologação de pagamento/cotação; compra de envio idempotente se autorizada; tracking; eventos/e-mails robustos; gates de produção; fiscal como projeto especializado separado.

Aceite: indisponibilidade externa, webhook repetido/tardio, valor inválido, token inválido, compra incerta por timeout, recuperação e reconciliação. Credenciais reais e custos requerem autorização própria.

### Onda 9 — expansão após rotina principal

Entregas selecionáveis: atacado avançado, promoções, pontos/créditos, reviews/favoritos/avise-me, telemetria, carrinho abandonado/newsletter, equipe e multiloja, entrega digital, personalização e Live Shop.

Cada módulo começa com descoberta e contrato próprio. Não é uma tarefa única gigante. Priorizar demanda operacional e evidência de uso, sem descartar o inventário preservado.

## 24. Padrão de qualidade e verificação

### 24.1 Testes existentes que devem servir de base

- `tests/independent.test.ts`: Central oculta, plano da loja, venda sem carteira e isolamento de catálogo.
- `tests/tenancy.test.ts`: escopo de pedidos, distribuição e guards de acesso.
- `tests/orders.test.ts`: operações de pedido existentes.
- `tests/labels.test.ts`: PDF, duplicidade, limites, download e lote.
- `tests/product-editor.test.ts`: SEO, duplicação e alteração em lote com escopo.
- `tests/product-import.test.ts`: importação de produto.
- `tests/analytics.test.ts`: cálculo, período, canais, UF e mapa de calor.
- `tests/shipping.test.ts`: fallback, cotação simulada, configuração e revalidação do servidor.

Foram identificados e, em parte, lidos. Não foram executados nesta análise. Sua existência não garante cobertura de novos comportamentos nem aprovação no estado atual.

### 24.2 Verificação por entrega

1. Ler briefing e instruções aplicáveis novamente; inspecionar git status e preservar mudanças existentes.
2. Registrar escopo, exclusões e os IDs funcionais atendidos.
3. Testar domínio com fixtures independentes e SuperDrop.
4. Testar todas as mutations contra IDs de outro tenant.
5. Executar scripts existentes de typecheck, lint, testes relevantes e build proporcional ao risco.
6. Consultar documentação local da versão de Next antes de alterações em convenções do framework.
7. Verificar UI com dado real de fixture, inclusive vazio, erro, loading e acesso negado.
8. Verificar desktop, mobile, teclado, foco, labels e contrastes.
9. Testar impressão em preview/renderização, sem disparar impressora física sem necessidade/autorização.
10. Anotar comandos executados e resultados reais; testes não executados ficam explicitados.

Os scripts do package incluem `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`. Adaptar execução ao ambiente atual e às instruções do repositório. Não executar `db:reset` ou seed em banco real. O E2E atual usa bash; no Windows, verificar ambiente suportado antes de assumir que roda diretamente.

### 24.3 Testes negativos indispensáveis

- Tenant estrangeiro em query/action/download/exportação.
- Papel sem capacidade; plano bloqueado por payload direto.
- Quantidade zero/negativa/maior que disponível.
- Preço, desconto, frete e total adulterados no cliente.
- Repetição, corrida e retry da mesma operação financeira.
- Webhook com pedido de outra loja, valor incorreto ou pagamento não aprovado.
- Upload executável, MIME falso, arquivo grande e URL perigosa.
- HTML/script inserido em descrição ou campanha.
- Consentimento revogado e segmentação que tenta incluir outro tenant.
- Campanha expirada/cache antigo.
- Mutação parcial em falha de transação.
- Rollback/migration compatível com produtos, packs e pedidos antigos.

### 24.4 Definição de concluído

Um módulo só pode mudar para validado quando houver persistência real, domínio/guards, UI utilizável, tratamento de erro, testes pertinentes, evidência de execução e documentação atualizada. “Tela pronta”, “flag habilitada” e “teste mock passou” não significam “integração homologada”.

## 25. Prompts prontos para o Claude Code

Estes prompts são instruções para tarefas futuras. Não mudam a autorização da entrega atual, que é documental. Use um por vez e peça execução apenas da etapa desejada.

### 25.1 Comando inicial — ler contexto e propor primeira etapa

```text
Leia integralmente o arquivo COMMERCE-MEMORIA-FUNCIONAL-E-PLANO-CLAUDE.md que estou fornecendo.
No repositório bras-digital-business-hub, leia primeiro docs/design/BRIEFING-CODEX.md,
depois AGENTS.md e CLAUDE.md. Confira também os documentos de reaproveitamento e
o prompt de plataforma citados no MD, mas valide tudo contra o código atual.

Quero usar o motor do SuperDrop para completar os módulos da NextLevel Commerce,
sem duplicar catálogo, pedidos, estoque, billing ou editor de temas.
O arquivo distingue recursos observados nos prints, módulos só citados em menu,
base de código identificada, adaptações e propostas novas.

Comece somente pela Onda 0: audite rotas, schema, actions, domínio e testes.
Revalide os achados R-01 a R-20 e entregue um escopo pequeno para a Onda 1,
com evidências, riscos, critérios de aceite e o que ficará fora.
Não implemente todos os módulos, não altere preços/domínios/segredos,
não faça reset de banco, não faça push/deploy nem efeitos financeiros externos.
Preserve alterações existentes. Não invente funcionalidades concluídas ou testes rodados.
```

### 25.2 Onda 1 — núcleo independente

```text
Implemente apenas o escopo aprovado da Onda 1 do documento de memória funcional.
Revalide a Central oculta, requireIndependent e catalogSupplierId antes de mudar código.
Complete a expedição do dono da loja independente com capacidades no servidor,
sem conceder SUPPLIER_ADMIN nem acesso à rede alheia. Revise confirmação manual
de pagamento, ownership de publicação de produto e copy/menu contextual.
Corrija revalidações necessárias para rotas merchant sem duplicar as actions.
Adicione testes positivos e negativos para Commerce e regressão para SuperDrop.
Não inclua CRM, PDV, migração seller, preços ou integrações externas pagas.
Entregue arquivos alterados, IDs atendidos, resultados dos comandos e pendências.
Sem push/deploy, alteração destrutiva ou credenciais reais sem autorização específica.
```

### 25.3 Onda 2 — catálogo e categorias

```text
Trabalhe apenas na Onda 2 aprovada. Use o catálogo merchant/catalogo que reaproveita
ProductsBody/ProductBody e o domínio de products/inventory existente.
Entregue categorias simples, editor organizado, fotos, filtros/paginação e estoque
com tenant validado. Preserve SKU, packs, histórico, preços e pedidos antigos.
Antes de variantes genéricas ou preço por variante, proponha contrato e migration
compatível; não faça transformação ampla não aprovada.
Não crie commerce_products paralelo nem campos sem persistência/efeito real.
Inclua testes de ownership, duplicação sem estoque e refresh da UI merchant.
```

### 25.4 Onda 3 — pedidos

```text
Complete somente os itens aprovados da Onda 3, com rastreabilidade PED/LOG/EST.
Reuse orders, order-status, labels e snapshots. Separe mensagem pública de nota interna.
Implemente filtros/contagens coerentes, detalhe e layouts de impressão aprovados.
Não permita status livre romper estoque/pagamento e não simule nota fiscal real.
Teste tenant, transições inválidas, duplicidade, cancelamento, impressão e dados privados.
Descreva separadamente o que é declaração de conteúdo, recibo e documento fiscal.
```

### 25.5 Onda 4 — CRM

```text
Implemente apenas CRM básico/grupos/consentimentos da Onda 4 aprovada.
Analise customers global e storeCustomers antes de qualquer edição de cliente.
Garanta perfil, endereços, notas e segmentação por loja, sem modificar dados de outra.
Use compras elegíveis para histórico/ranking, não totalSpent sem conferir significado.
Inclua CRUD, filtros e import/export autorizados, com preview e relatórios seguros.
Não implemente impersonação, pontos ou créditos nesta etapa.
Teste revogação, tenant, edição compartilhada, exportação e preservação de snapshots.
```

### 25.6 Onda 5 — indicadores

```text
Implemente o contrato de indicadores aprovado da Onda 5.
Reconcilie overview, analytics, CRM e exportações quanto a pagamento, cancelamento,
devolução, subtotal, frete, período e fuso. Distinga venda, recebimento e margem estimada.
Reuse computeStoreAnalytics quando compatível e crie testes com números verificáveis.
Não invente visitantes online, sessões ou conversão sem telemetria real.
Entregue a definição de cada indicador e exemplos de reconciliação com fixtures.
```

### 25.7 Onda 6 — vendas assistidas

```text
Execute apenas o PDV MVP ou o submódulo de propostas explicitamente aprovado.
Use createOrder para preço, estoque e snapshots, sem criar um segundo motor de vendas.
PDV: pagamento escolhido não implica pago; desconto/item temporário exige permissão.
Propostas: validade, token público, política de preço/reserva e conversão idempotente.
Teste clique duplo, duas abas, estoque concorrente, preço manipulado e link expirado.
Não adicione crédito, afiliado, pagamentos divididos ou hardware não aprovado.
```

### 25.8 Onda 7 — marketing e tema

```text
Implemente somente banners/preferências aprovados da Onda 7.
Reuse o engine de temas, globals, templates, drafts e publicação existente.
Defina fonte única para campanha e referência no slot; evite cópia editável concorrente.
Inclua agenda no fuso escolhido, media desktop/mobile, link seguro e preview.
Cada preferência deve ter schema, default, escopo, efeito real e teste.
Não crie novo builder nem campanha de e-mail automática nesta etapa.
Teste draft/publicado, expiração/cache, tenant, mídia inválida e renderer dos temas usados.
```

### 25.9 Onda 8 — homologação e integração

```text
Trabalhe na integração explicitamente autorizada da Onda 8.
Primeiro informe ambiente, documentação oficial atual, permissões, credenciais
necessárias e possíveis custos externos, sem imprimir ou copiar segredos.
Reuse serviços de pagamento/cotação e confirme eventos pela API do provedor.
Compra de envio precisa de idempotência, reconciliação e tratamento de timeout incerto.
Teste mocks separados de sandbox/real e marque homologado somente com evidência.
Não faça compra, emissão fiscal, envio de mensagens reais ou deploy sem autorização.
```

### 25.10 Template para qualquer módulo de expansão

```text
Módulo autorizado: [NOME]. IDs do inventário: [IDS]. Escopo: [O QUE ENTREGAR].
Exclusões: [O QUE NÃO FAZER].
Leia a memória funcional e as instruções atuais do repositório.
Localize equivalente existente antes de criar tabelas/actions/componentes.
Apresente contrato, permissões, invariantes, dados e migration necessários.
Implemente apenas o escopo autorizado; valide tenant, dinheiro/estoque e idempotência.
Adicione testes proporcionais e registre comandos/resultados reais.
Atualize a matriz de status com evidências, decisões e pendências.
Não altere produção, preços, domínios, segredos ou arquivos alheios sem autorização.
```

## 26. Controle de implementação e atualização da memória

### 26.1 Modelo de registro por entrega

```markdown
### Entrega [data] — [módulo/onda]

- Escopo autorizado:
- IDs do inventário atendidos:
- Commit/base analisada:
- Arquivos e migrations:
- Decisões de domínio:
- Reaproveitamento realizado:
- Testes executados e resultado:
- Testes não executados:
- Evidência visual/funcional:
- Integrações: mock / sandbox / real homologado:
- Riscos e pendências:
- Próxima etapa sugerida:
```

### 26.2 Estados permitidos no backlog

Referenciado → descoberto → contrato aprovado → implementado → testado localmente → homologado quando aplicável → liberado mediante autorização.

Uma tabela inicial de acompanhamento:

| Família | Fotografia atual | Próximo passo |
| --- | --- | --- |
| ADM | Shell/busca base; multiloja não comprovada | Contextualizar e ampliar busca |
| DASH | Analytics base, definições divergentes | Contrato e reconciliação |
| PED | Domínio base, UI independente incompleta | Onda 1 e detalhe operacional |
| PDV | Formulário manual, não PDV completo | MVP após núcleo/CRM |
| LINK | Sem módulo completo identificado | Propostas e conversão |
| CAT/PROD | CRUD/fotos/import/estoque básicos | Categorias/editor e evolução de variante |
| PREF-P | Parte pode ser resolvida pelo tema | Mapear equivalência e implementar por prioridade |
| CATEG | Nome/slug e criação básica | Administração e visibilidade |
| EST | Reserva/movimentação base | Operação independente e alertas |
| LOG | Cotação e PDFs base | Permissões/homologação; compra/tracking depois |
| CRM | Listagem/relacionamento/consentimento base | Perfil tenant-local e CRUD |
| MKT | Renderizadores de tema, não campanhas completas | Agenda e fonte única de banners |
| TEMA | Engine avançado existente | Integrar sem duplicação |
| CFG | Algumas actions/configurações existentes | Contrato versionado e precedência |
| FIN | Billing/entitlements existentes com legado | Reconciliar fontes e UX independente |

Guardar este arquivo no repositório como documentação, quando essa inclusão for autorizada, facilita que o Claude Code o leia junto ao briefing. Não substituir AGENTS.md/CLAUDE.md inteiro por este inventário. Uma referência curta nesses arquivos, se aprovada, é suficiente; o texto extenso deve continuar separado.

## 27. Índice de evidências de código para retomada

As referências usam caminhos relativos à raiz do repositório para permanecerem portáveis. Linhas correspondem à fotografia da inspeção e podem mudar; procurar também pelo símbolo.

| Arquivo/símbolo | Referência e utilidade |
| --- | --- |
| `src/lib/domain/independent.ts` | createHiddenCentral:16; independentSupplierOfStore:32; catalogSupplierId:39 |
| `src/lib/require-independent.ts` | Guarda da conta independente nas rotas de catálogo |
| `src/lib/domain/store-access.ts` | Cadastro e acesso de membro/conta simples |
| `src/lib/domain/access.ts` | Actor:7; assertCanAccess:24; requireStoreId:37 |
| `src/db/schema.ts` | users:142; categories:160; productVariants:202; storeProducts:233; customers:266; storeCustomers:274; orderEvents:356 |
| `src/app/merchant/catalogo/page.tsx` | Wrapper de ProductsBody com supplier resolvido e independent |
| `src/app/merchant/catalogo/[id]/page.tsx` | Wrapper de ProductBody protegido e rota merchant |
| `src/lib/domain/products.ts` | ensureCategory:40; createProduct:50; duplicateProduct:100; setProductsStatus:121 |
| `src/app/actions/supplier.ts` | receiveStock:29; adjustStock:40; updateProduct:92; create:111; duplicate:121; import preview:146; import:158; images:174; shipping connect:197 |
| `src/app/supplier/products/[id]/product-forms.tsx` | ProductForm, StockActions, DistributionForm e ProductHeaderActions |
| `src/app/supplier/products/[id]/images-editor.tsx` | MediaGallery/compressão e limite de imagens atual |
| `src/lib/domain/product-import.ts` | Modelo, parsing e validação de importação |
| `src/lib/domain/product-import-server.ts` | Aplicação da importação no servidor |
| `src/lib/domain/inventory.ts` | getLevel:15; receive:49; adjust:57; reserve:67; release:77; consume:86 |
| `src/lib/domain/orders.ts` | createOrder:63; customer counters:169; owned read:195; payment confirm:230; label:250; advance:267; cancel:290; system paid:340 |
| `src/lib/domain/order-status.ts` | canTransition:42; resolveFulfillmentStatus:52; NEXT_ACTION:67 |
| `src/components/shared/order-actions.tsx` | Diferença de operações disponíveis por papel |
| `src/components/shared/orders-table.tsx` | Listagem compartilhada e campos de Central |
| `src/components/shared/order-quick-view.tsx` | Drawer atual e impressão via browser |
| `src/app/merchant/orders/new/new-order-form.tsx` | Formulário manual existente, base de experiência do PDV |
| `src/lib/domain/wallet.ts` | tryDebitOrder:62; SUPPLIER_OWN pula débito externo à Central |
| `src/lib/domain/own-store.ts` | Loja própria de fornecedor real; distinta de conta independente |
| `src/lib/domain/labels.ts` | addLabelFile:30; getLabelBytes:78; mergeLabels:86; picking/print:112 e 127 |
| `src/lib/shipping/quote.ts` | QuoteProvider, schemas de entrega e recálculo no servidor |
| `src/lib/shipping/providers.ts` | Verificação de token de conta externa |
| `src/lib/payments/service.ts` | syncMercadoPagoPayment confirma pela API e valida order.storeId |
| `src/lib/payments/mercadopago.ts` | Cliente de integração Mercado Pago |
| `src/app/api/webhooks/mercadopago/route.ts` | Webhook encaminha pagamento para confirmação no serviço |
| `src/lib/domain/order-emails.ts` | E-mails transacionais existentes e dedupe |
| `src/lib/domain/analytics.ts` | computeStoreAnalytics:22 e definições atuais |
| `src/lib/queries/merchant.ts` | onboarding:9; overview:24; customers:65; finance:91 |
| `src/app/merchant/customers/page.tsx` | Listagem atual, sem CRM completo |
| `src/app/actions/merchant.ts` | updateStore:31; appearance:62; listing:82; integration:142; publish:157; MP:177; shipping rules:231 |
| `src/app/merchant/finance/page.tsx` | Financeiro do merchant e texto/regra a contextualizar |
| `src/lib/themes/store.ts` | resolveTemplate:35; draft:65; globals draft:76; publish:94/106; discard:120; versions:126; restore:132 |
| `src/lib/themes/catalog.ts` | Quatro temas existentes e catálogo próprio |
| `src/lib/themes/sections.ts` | Schema de seções consumido por editor/renderers |
| `src/lib/features.ts` | Catálogo de flags, guards e copy ainda ligada ao SuperDrop |
| `src/components/ds/index-list.tsx` | IndexList:28; listagem client-side, views, seleção e bulk |
| `src/components/ds/media-gallery.tsx` | MediaGallery:14; reaproveitamento de galeria |
| `src/components/ds/contextual-save-bar.tsx` | useUnsavedGuard:8; ContextualSaveBar:21 |
| `src/components/app/role-layout.tsx` | Shell/contexto de papel e navegação independente |
| `src/lib/nav.ts` | Estrutura de navegação atual por papel |
| `src/lib/domain/search.ts` | globalSearch:13; escopo por ator e lacuna de produto no merchant |
| `src/app/actions/auth.ts` | loginAs:43 limitado a demo; não serve a suporte/impersonação real |
| `src/lib/domain/finance.ts`, `src/lib/finance/*` | Contratos, regras e billing a reaproveitar/reconciliar |

## 28. Conclusão para a decisão de produto

O essencial dos prints pode virar um painel Commerce sólido usando o motor atual. A oportunidade imediata está em terminar a operação independente e organizar catálogo, estoque, pedidos e CRM; não em recriar a plataforma inteira.

As funções especializadas ficam preservadas neste documento, com dependências e limites. A referência visual inspira organização e produtividade, mas nosso comportamento deve nascer das regras reais do negócio, de permissões consistentes e de testes.

Próxima ação recomendada: fornecer este MD ao Claude Code e executar a Onda 0. Depois autorizar um escopo pequeno da Onda 1. O progresso passa a ser medido por rotinas operacionais verificadas, não por quantidade de telas ou switches desenhados.
