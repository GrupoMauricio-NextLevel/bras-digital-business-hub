# ADR-0003. Sessões revogáveis e verificação em duas etapas

**Estado:** proposta. **Origem:** documento 03 §20 a §23, 10 §18.

## Hoje (fato)
A sessão é um cookie assinado (`SESSION_SECRET`) sem registro no servidor: não dá para encerrar um acesso específico, nem "sair de todos os aparelhos", e trocar a senha não derruba sessões abertas. O login já tem limite de tentativas (20 por IP e 8 por e-mail em 15 minutos, em memória).

## Alternativas
1. Tabela `sessions` (id, usuário, aparelho, criada, última atividade, revogada) e cookie com o id. Permite revogar e listar aparelhos.
2. Manter o cookie e adicionar um "número de versão da sessão" no usuário; trocar a senha incrementa e invalida tudo. Mais simples, sem lista de aparelhos.
3. 2FA por app autenticador (TOTP) para Master e fornecedor primeiro; lojista opcional.

## Recomendação
Alternativa 2 já (pequena, aditiva), alternativa 1 depois, e 2FA para Master antes de qualquer outro papel. O limite de tentativas hoje é por instância: com mais de uma instância vira compartilhado (banco ou Redis).

**Depende do dono:** decidir o 2FA e o papel que o exige primeiro.
