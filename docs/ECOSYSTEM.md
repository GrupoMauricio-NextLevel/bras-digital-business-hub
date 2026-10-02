# Ecossistema NextLevel — arquitetura funcional

## Princípio central

A NextLevel possui um único **Commerce Core**. As verticais são produtos/canais que utilizam o mesmo núcleo de dados e regras.

- **NextLevel Master**: governança do ecossistema.
- **NextLevel Commerce**: motor compartilhado.
- **SuperDrop**: distribuição por fornecedores e lojistas.
- **Brás Digital**: marketplace B2B/atacado.
- **Creators Hub**: aquisição e vendas por creators/afiliados.
- **China Hub**: onboarding e distribuição de importadores/fornecedores chineses.

Não criar bancos, SKUs, estoques ou pedidos paralelos por vertical.

## Entidades únicas do core

Estas entidades pertencem ao Commerce Core e devem ser reutilizadas por todas as verticais:

- organizations
- users
- products
- product_variants
- inventory
- customers
- orders
- order_items
- pagamentos
- frete
- temas
- assinaturas
- eventos de domínio

## Canais de produto

Um produto pode participar de mais de uma vertical por `product_channels`.

Exemplo:

- produto A → SuperDrop
- produto A → Brás Digital
- produto A → Creators Hub

O SKU e o estoque continuam únicos.

## Origem de pedido

`orders.source_area` identifica a vertical que originou a venda:

- SUPERDROP
- BRAS_DIGITAL
- CREATORS_HUB
- CHINA_HUB

A vertical muda a origem e as regras comerciais, não cria outra entidade de pedido.

## Organizações e acesso

Uma organização pode ter múltiplos produtos habilitados em `organization_products`.

Um usuário pode ter múltiplos grants em `user_product_access`.

Exemplo:

Empresa XPTO:
- SuperDrop → SUPPLIER_ADMIN
- Brás Digital → SUPPLIER_ADMIN
- Creators Hub → VERTICAL_ADMIN

A autorização deve sempre considerar:

1. usuário autenticado;
2. organização;
3. área/produto;
4. papel dentro da área;
5. escopo opcional de supplier/store.

`users.role` é legado e permanece apenas durante a migração gradual.

## Responsabilidade dos painéis

### NextLevel Master

Pode:
- administrar organizações;
- habilitar/desabilitar verticais;
- administrar usuários e grants;
- controlar planos, contratos e receita da plataforma;
- acompanhar saúde operacional;
- acessar as verticais como administrador da plataforma.

Não deve ser o local operacional diário de fornecedor ou lojista.

### NextLevel Commerce

É o backoffice/core técnico e operacional:
- catálogo central;
- estoque;
- pedidos;
- clientes;
- pagamentos;
- frete;
- temas;
- integrações;
- assinaturas;
- eventos.

Não deve possuir regras de aquisição específicas de uma vertical.

### SuperDrop

Fluxo principal:

fornecedor → produto → lojista → loja/canal → cliente → pedido → pagamento do custo → etiqueta → separação → expedição.

Perfis principais:
- plataforma;
- fornecedor;
- expedição;
- lojista.

### Brás Digital

Fluxo principal:

fornecedor → catálogo B2B → comprador/revendedor → pedido atacadista → pagamento → retirada/expedição.

Deve reutilizar produto, variante e estoque do Commerce Core.

### Creators Hub

Fluxo principal:

produto → campanha → creator → conteúdo/link/live → venda atribuída → comissão.

Novas entidades específicas podem incluir:
- creator_profiles;
- campaigns;
- campaign_products;
- attribution_events;
- creator_commissions.

Pedidos continuam no core.

### China Hub

Fluxo principal:

empresa/importador → onboarding → catálogo Brasil → representantes/canais → distribuição.

Novas entidades específicas podem incluir:
- importer_profiles;
- representatives;
- business_leads;
- onboarding_records;
- translation/localization metadata.

Depois do onboarding, produtos podem ser habilitados para SuperDrop, Brás Digital e Creators Hub.

## Regra para novas funcionalidades

Antes de criar uma tabela ou módulo novo, responder:

1. Isto é dado do Commerce Core ou dado específico da vertical?
2. Já existe uma entidade equivalente?
3. Precisa duplicar produto, estoque, cliente ou pedido? Se sim, a arquitetura provavelmente está errada.
4. Qual `source_area` gera o evento/pedido?
5. Qual organização possui o dado?
6. Quais grants podem ler ou alterar?

## Estratégia de migração

1. Manter supplier/merchant atuais funcionando.
2. Introduzir grants multi-produto.
3. Tornar os hubs de vertical acessíveis por grant.
4. Migrar telas existentes para contexto de vertical.
5. Criar entidades específicas de Brás Digital, Creators Hub e China Hub somente quando necessárias.
6. Remover dependência de `users.role` apenas após todos os fluxos estarem migrados e cobertos por testes.
