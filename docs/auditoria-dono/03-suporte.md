# Fase 2 — Suporte: ver o painel de qualquer cliente com segurança

## Como usar (dono e equipe NextLevel)
1. No Master, menu **Operação → Clientes e suporte** (`/master/clientes`).
2. Busque por nome, e-mail, loja ou fornecedor; filtre por marca e papel. A coluna "Situação" mostra alertas (loja suspensa, aguardando pagamento, fornecedor com restrição, acesso encerrado).
3. **Ver como cliente** → escolha ou escreva o motivo → você entra no painel do cliente exatamente como ele vê.
4. Uma faixa no topo mostra: quem você está vendo, o papel, seu nome, o motivo, até que horas vale e "somente leitura".
5. Para fazer algo pelo cliente: **Agir em nome do cliente** (confirmação + registro). A faixa fica laranja.
6. **Sair do modo suporte** volta para a mesma busca de onde você saiu. Sair da conta durante o suporte também encerra o suporte.

No console Commerce (`/commerce/stores`) o botão **Ver como lojista** usa o mesmo mecanismo.

## Regras de segurança (implementadas e testadas)
| Regra | Onde |
|---|---|
| Só o Master entra; nunca em outra conta Master | `startSupport` (`src/lib/domain/support.ts`) |
| Motivo obrigatório (5 a 300 letras) | `startSupport` |
| Permissão assinada (HMAC com propósito próprio), presa ao cliente e ao operador | `signToken/verifyToken` (`src/lib/security/crypto.ts`) |
| A sessão do cliente aberta pelo suporte é marcada (`sup`) e **só vale junto com a permissão**: apagar ou forjar o cookie derruba a sessão | `getSession` (`src/lib/auth.ts`) |
| Dura no máximo 1 hora; operador que perde o acesso Master derruba o suporte | `SUPPORT_TTL_MS`, `checkSupport` |
| Somente leitura por padrão: toda ação via `runAction` é recusada até liberar "agir" | `src/lib/action-result.ts` |
| Volta só para caminho interno (`/…`), nunca para outro site | `startSupport` |
| Tudo na trilha `audit_log` (entrada, ação liberada, saída), visível ao dono da loja em "Auditoria" e ao Master na central | `recordAudit` |
| Segredos (tokens, chave Pix) continuam fora da tela, como já eram | regra do projeto |

O mecanismo antigo (`nl_master_return`, cookie sem assinatura) foi removido.

## Testes
- `tests/modo-suporte.test.ts`: assinatura (forjar, trocar propósito, vencer), permissões, motivo, volta segura, operador desativado, trilha visível ao dono, central de clientes.
- `e2e/modo-suporte.mjs`: Master → central → lojista SuperDrop, expedição, parceiro e lojista Commerce, em 1440 e 390 px; faixa, motivo, somente leitura, "agir", sair e voltar; cookie forjado recusado.

## Limites conhecidos
- Ações que não passam por `runAction` (poucas, como trocar de loja própria) não são bloqueadas pelo somente leitura; nenhuma delas está disponível para o operador sem sair do painel do cliente.
- O registro guarda entrada, liberação e saída; ações feitas em nome do cliente aparecem na trilha quando o próprio domínio já as registra (preços, equipe, exportação etc.).
