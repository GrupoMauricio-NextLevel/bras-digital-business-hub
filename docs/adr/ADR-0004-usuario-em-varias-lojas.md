# ADR-0004. Um usuário em várias lojas

**Estado:** proposta. **Origem:** documento 03 §14 e §15.

## Hoje (fato)
`users.store_id` é único: uma pessoa que tem duas lojas precisa de dois e-mails. A equipe da loja é `storeRole` OWNER ou STAFF.

## Alternativas
1. Tabela `store_memberships` (usuário, loja, papel) e o ator passa a ter "loja ativa" escolhida no painel. `users.store_id` continua valendo como loja padrão (expandir, migrar, contrair).
2. Manter um usuário por loja e oferecer "vincular contas" só na tela de login.

## Recomendação
Alternativa 1. Toda checagem de acesso já passa por `Actor.storeId`, então a mudança fica concentrada em montar o `Actor` e no seletor de loja. Exige teste de isolamento novo (um membro de A e B nunca vê dado de B estando em A).

**Depende do dono:** quer vender "uma conta, várias lojas"? É o caso de agências e lojistas com mais de uma marca.
