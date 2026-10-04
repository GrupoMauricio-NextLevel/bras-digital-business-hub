# Mapa de navegação do painel do lojista Commerce

Só rotas que existem hoje. Não foram criados módulos novos.

| Grupo | Item | Rota |
|---|---|---|
| (topo) | Início | `/merchant` |
| Vendas | Pedidos | `/merchant/orders` |
| Vendas | Clientes | `/merchant/customers` |
| Vendas | Pós-venda | `/merchant/after-sales` |
| Catálogo | Produtos | `/merchant/catalogo` |
| Catálogo | Categorias | `/merchant/catalogo/categorias` |
| Marketing | Campanhas | `/merchant/campanhas` |
| Marketing | Cupons | `/merchant/descontos` |
| Marketing | Avaliações | `/merchant/avaliacoes` |
| Loja virtual | Visão da loja | `/merchant/storefront` |
| Loja virtual | Aparência | `/theme-editor` |
| Loja virtual | Temas | `/merchant/templates` |
| Gestão | Análise | `/merchant/analytics` |
| Gestão | Financeiro | `/merchant/finance` |
| Configurações | Empresa e loja | `/merchant/settings` |
| Configurações | Equipe | `/merchant/team` |
| Configurações | Minha assinatura | `/merchant/finance#assinatura` |
| Configurações | Registro de ações | `/merchant/auditoria` |

## Comportamento
- Grupos expansíveis (`aria-expanded`), o grupo da página atual abre sozinho; item ativo por maior caminho que casa (`aria-current="page"`); links com âncora nunca ficam ativos.
- Equipe (STAFF) vê só Pedidos, Clientes, Pós-venda e Produtos/Categorias (regra anterior preservada; o servidor continua bloqueando o resto).
- Cabeçalho: caminho curto (Grupo / Página), busca real (`globalSearchAction`, também por Ctrl+K), Claro/Escuro/Sistema, sair. Sem sino ou ajuda decorativos.
- Rodapé do menu: "Ver loja" (endereço real, só se o plano libera vitrine) e perfil.
- Celular: barra inferior (Início, Pedidos, Produtos, Financeiro, Mais) e gaveta Radix (foco preso, Esc fecha, foco volta ao botão).
- Itens do prompt que **não existem** e por isso ficaram de fora: Estoque, Navegação, Páginas, Domínio (como telas próprias), Integrações, Pagamentos e Frete como telas separadas (hoje estão dentro de Configurações).

## Console ADM Commerce (`/commerce`)
Menu próprio, sem termos de lojista: Visão geral, Lojas, Vendas, Catálogo das lojas, Interessados, Assinaturas, Plataforma. Identidade "Console administrativo das lojas" e atalho "Voltar ao Master".
