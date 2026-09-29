# Auditoria visual e de fluxo (baseline)

Capturas em `docs/design/baseline/` (1440, 1024, 768 e 390 px) dos painéis Master, Fornecedor, Lojista Lite (Arena 10) e Lojista Pro (Mantos Shop). Referência da Natural GO: nenhum material foi anexado em `docs/design/reference/`, então o ponto de partida são os princípios descritos pelo dono (cards claros, dashboards objetivos, ações rápidas, boa experiência mobile).

## O que funciona

- Estrutura previsível: menu lateral, cabeçalho de página, cartões de métrica, tabela e feed de atividades.
- A home do lojista já responde às perguntas certas (como estou, o que fazer agora) e o checklist de onboarding motiva.
- Tabelas viram cartões abaixo de 768 px e há estados de carregamento, vazio e erro.
- Os componentes são consistentes entre painéis, o que facilita a evolução em um único lugar.

## O que confunde ou está fraco

| Área | Achado | Efeito |
|---|---|---|
| Identidade | Neutro frio genérico, mesma aparência nos quatro perfis | Nenhum painel comunica seu papel. O Master não parece torre de controle |
| Hierarquia | Cartões de métrica com o mesmo peso visual, sem destaque para o que exige ação | O olho não sabe onde começar |
| Vocabulário | Texto técnico vazando, como "on_hand − reserved", "PRIVATE_NETWORK" e siglas de status | Linguagem de desenvolvedor no painel do fornecedor |
| Fornecedor | Quadro de expedição é o mesmo painel do gestor, com dados financeiros ao lado | Não há visão segura para um operador de expedição |
| Financeiro do fornecedor | Uma página só com pedidos, faturas e comissões misturados | O gestor não encontra saldo, recargas nem extrato |
| Pagamento à Central | Confirmado manualmente pelo lojista | Contraria a regra de só aceitar pedido com recarga Pix |
| Etiqueta | Apenas código e transportadora | O fornecedor não recebe nem imprime o arquivo do SuperFrete |
| Lojista | Mesma tela para Drop manual, loja em subdomínio e loja própria | O plano mais simples enxerga recursos que não usa, sem caminho de upgrade |
| Loja de serviços | Item de menu comum com botão "Tenho interesse" | Não vende. Sem recomendação contextual nem pedido de serviço |
| Navegação | Sem busca global, sem central de avisos, sem atalhos | Lento para quem opera o dia todo |
| Mobile | Menu vira gaveta única, sem barra inferior | Ações principais a dois toques |
| Tema | Somente claro, sem preferência do usuário | Ambiente de expedição e gestores noturnos sem opção |

## Defeitos medidos

- Rolagem horizontal da página inteira em 768 px nas quatro homes (tabela de pedidos com colunas demais para a largura entre o modo tablet e o desktop).
- Botões e switches com alvo de toque menor que 44 px em várias telas.
- Sem `aria-live` nos contadores que mudam sozinhos.

## Lacunas por papel

- **Master:** falta caixa de alertas, ranking de fornecedores, pipeline de serviços e leitura de receita em risco na primeira dobra.
- **Fornecedor ADM:** falta quadro por estágio com tempo de espera, saldo dos lojistas, recargas e equipe.
- **Expedição:** o papel não existe.
- **Lojista Lite:** falta saldo e recarga Pix como ação principal, upload de etiqueta e bloqueios com upgrade.
- **Lojista Pro:** falta análise, editor com prévia responsiva, equipe e domínio guiado.
- **Todos:** falta a Loja NextLevel como produto em destaque.

## Prioridades

1. Domínio novo: expedição, recarga Pix, etiqueta em arquivo e gates por oferta.
2. Design system v2 com temas por painel e modo escuro.
3. Painéis na ordem Master, Fornecedor, Expedição, Lojista Lite, Lojista Pro.
4. Loja NextLevel transversal.
