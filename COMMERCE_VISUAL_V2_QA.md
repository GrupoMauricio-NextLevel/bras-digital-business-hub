# Commerce visual V2: QA

Roteiro: `e2e/commerce-glass-qa.mjs` (3 fases) + `e2e/commerce-motion-video.mjs` (vídeo). Servidor: `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true bash scripts/restart-demo.sh`; depois `E2E_BASE=http://localhost:3100 node e2e/commerce-glass-qa.mjs`. Em desenvolvimento o selo "N" do Next é escondido nas capturas de entrega (não faz parte do produto).

## Cobertura (todas passaram: sem rolagem lateral, sem erro de console, sem violação grave/crítica de axe)
| Fase | Telas | Estados | Larguras |
|---|---|---|---|
| 1 Loja nova (primeiro acesso) | Início, Pedidos, Produtos, Clientes, Temas, Financeiro, Configurações, Novo produto | Claro e Escuro | 1440 e 390 (Início e Pedidos também 1280 e 768) |
| 2 Loja de demonstração com dados (12+ pedidos simulados no banco descartável da demonstração) | Início em operação, Pedidos preenchido, filtro Pendente, filtro sem resultado, Detalhe do pedido, Produtos (6 com foto), Clientes, Temas, Financeiro, Configurações, Novo produto | Claro e Escuro | 1440 e 390 |
| 3 ADM Commerce | Visão geral, Lojas, Vendas, Assinaturas | Claro e Escuro | 1440 e 390 |

Interações testadas: gaveta do celular abre pelo "Mais", fecha com Esc e devolve o foco; grupo do menu expande por teclado (`aria-expanded`); seletor de tema persiste após recarregar; movimento normal anima o reflexo e movimento reduzido não anima.

Capturas: `docs/commerce-visual/v2/` (`novo-*` primeiro acesso, `demo-*` com dados, `adm-*`, `gaveta-light-390`). Antes: `docs/commerce-visual/baseline-v1/` (mesmas telas da loja nova nos mesmos tamanhos). Vídeo: `docs/commerce-visual/v2/demo-motion.webm` (tema Claro→Escuro→Claro, grupo do menu, navegação, gaveta mobile).

## Limitações (sem rodeio)
- Os dados de "loja com dados" vêm do banco de demonstração (simulação de venda e a loja Fio & Linha); isso prova a aparência com conteúdo, não o comportamento com volume real. Não testei paginação com centenas de pedidos nem nomes extremos de cliente/loja.
- Produtos: 6 itens com foto; não testei produto sem foto, variantes múltiplas, upload nem erro de validação do formulário (só o formulário vazio nos dois temas).
- Detalhe de pedido verificado só quanto a layout, rolagem e axe; não revisei cada linha visualmente nos dois temas.
- Financeiro: "Caixa da loja" e "Assinatura NextLevel" ficaram com títulos separados (e o link "Minha assinatura" do menu agora leva à seção). Configurações ganhou um índice por assunto (Dados, Pagamentos, Frete, Domínio). O conteúdo dos formulários não foi movido nem alterado. O formulário de produto é compartilhado com o SuperDrop e só herda o visual.
- Contraste: axe sobre a composição renderizada nas telas acima; não medi todos os pares sobre o brilho do hero. Tooltips/selects nativos/calendários não foram revisados.
- Paleta de comandos (Ctrl+K) abre em camada fora do painel com cores gerais.
- Não rodei a suíte completa (`vitest`), por só mudar apresentação. Não testei Safari/Firefox, leitor de tela, nem fonte ampliada do sistema.
- ADM: coluna "Acesso" agora em português (Assinatura em dia, Em teste, Sem plano, Bloqueada); Configurações mostra "Não configurado" em vez do código interno do domínio.
- Reação do hero ao ponteiro não foi implementada.
- Isolamento Master/SuperDrop: estilos ficam sob `[data-product="commerce"]`; `FilterTabs` e as mudanças em Pedidos/Temas só entram para lojas Commerce (Pedidos) ou como classes inertes fora do Commerce. Não fiz comparação visual lado a lado do SuperDrop/Master nesta rodada.
