# Contexto de negócio (memória permanente do projeto)

Este arquivo registra o que o dono do produto (NextLevel Marketing) definiu. Leia antes de decidir qualquer tela, regra ou preço. Se algo aqui conflitar com o código, o código está errado.

## 1. O que a NextLevel é
Plataforma que **gerencia tudo** e ainda:
- **Dá pós-venda por chat** para fornecedores e lojistas.
- **Vende um catálogo de serviços** (e academy) tanto ao fornecedor quanto ao lojista final.
- **Recebe seus pagamentos** (setup, mensalidades, taxas, serviços, academy) por uma conta Mercado Pago própria, bem integrada e conciliada.
- **Enxerga todos**: fornecedores e lojistas, na versão básica (subdomínio SuperDrop) e com domínio próprio (white label).
- Tem três necessidades: **gerenciais**, **transacionais automatizadas** e de **pós-venda**.

## 2. SuperDrop, lado do fornecedor
- Conecta em modo **básico** ou **white label**. Em ambos precisa de painel gerencial.
- **Academy** com módulos (parte bloqueada em produção até liberação).
- **Painel de expedição** para funcionários separarem pedidos, otimizado: impressão de etiquetas **em lote fácil**.
- **Esteira de pedidos** (dashboard) em **modo ao vivo e sincronizado**, tudo com **horário de corte**.
- Conecta as **credenciais do Mercado Pago** e recebe as **recargas** dos lojistas com facilidade.

## 3. SuperDrop, lado do membro final (lojista)
- Compra **recarga por Pix**.
- **Anexa etiquetas** geradas nas plataformas (SuperFrete etc.) no formato certo (PDF).
- **Seleciona produtos do catálogo** e envia para a expedição **usando o saldo da recarga**.
- **Academy detalhada** do zero ao faturamento; o acesso custa **uma mensalidade a mais**.
- Ao ativar a loja, **conecta as próprias credenciais do Mercado Pago** e recebe dos clientes por Pix.

## 4. Regras transversais
- **Cada painel tem necessidade visual e de navegação própria.** Não é um painel para todos. Master = torre de controle; ADM do fornecedor = gestão e esteira; expedição = tablet, botões grandes, zero dinheiro; lojista Lite = simples e guiado; lojista Pro = análise e edição.
- **Todo valor de mensalidade e toda taxa por transação precisam de racional** (custo que cobre, valor que entrega, comparação de mercado) e esse racional aparece na tela e no simulador.
- Dinheiro de recarga e de vendas do lojista **não passa pela NextLevel**: vai para a conta Mercado Pago do fornecedor / do lojista. A NextLevel cobra o que é dela em faturas próprias.
- Fiscal está fora do escopo por enquanto.

## 5. Decisões já aceitas
D1 a D7 em `docs/design/DECISIONS.md` (recarga Pix na conta do fornecedor; pedido só entra na expedição após débito do saldo; etiqueta é arquivo; expedição não vê dinheiro; gates por oferta; pt-BR/BRL).
