# Direção visual v4: alicerce, ajuste de expectativa, identidade original e cores

> 2026-10-02. **Aprovada pelo dono (aceitou as recomendações); alicerce de cores implementado em `src/lib/brand-palette.ts`. Plano da vitrine em `PLANO-VITRINE-V4.md`.** Registrada em D42. Quem executa o visual é o Codex (`AGENTS.md`); eu entrego o alicerce técnico (tokens por marca, desempenho, testes) e este briefing.

## 1. Ajuste de expectativa (honesto)
**Páginas públicas "o mais perto possível do Shopify".** Dá para chegar muito perto no que o cliente final **vê e sente**; não dá para igualar o que o Shopify tem por trás.
| | Chegamos perto? | Como |
|---|---|---|
| Aparência e polimento de vitrine (tipografia, espaços, fotos grandes, cartão de produto, galeria, menu, rodapé) | **Sim** | Temas novos + editor já existente; este é o foco |
| Velocidade percebida (carrega rápido no celular) | **Sim, com trabalho de infraestrutura** | Cache de páginas da loja, imagens otimizadas, CDN gratuita na frente do Render (ex.: Cloudflare), metas medidas |
| Carrinho lateral, busca rápida, filtros, variantes sem recarregar a página | **Sim** | Componentes de loja (Codex) + dados já existentes |
| Checkout curto, claro e confiável | **Sim** | Já temos Pix e cartão; enxugar passos e textos |
| Ecossistema de milhares de apps e temas, Shop Pay, checkout com bilhões de pedidos de histórico, rede global de servidores | **Não** | Não é meta; a nossa vantagem é outra (proximidade com o Brás, fornecedor embutido, painel) |
Promessa que podemos fazer: **"vitrine com qualidade de Shopify, em português, com Pix, frete e fornecedor prontos"**. Não prometer "igual ao Shopify".

**Referência que o dono passou** (`maximize-evolutions.myshopify.com`): não consegui abrir a loja daqui (o endereço respondeu erro ao meu acesso). Preciso de **3 a 5 capturas de tela** (início, página de produto, coleção, carrinho, celular) e do **nome do tema**, se souber, para tirar a lista exata do que copiar em qualidade (não em cópia literal de layout ou marca).

## 2. Páginas públicas: o que define "nível Shopify" (critérios medidos)
1. **Desempenho:** Lighthouse mobile ≥ 90 na home, coleção e produto; LCP < 2,5 s; sem salto de layout (CLS < 0,1).
2. **Imagens:** formatos modernos, tamanhos responsivos, carregamento sob demanda, primeira imagem prioritária.
3. **Cartão de produto:** foto de alta qualidade com segunda foto no hover, selos (novo, últimas peças, promoção), preço riscado, escolha rápida de tamanho/cor, sem pular layout.
4. **Página de produto:** galeria com zoom e miniaturas, seletor de variantes, guia de tamanhos (já há grade), prazo de entrega e frete por CEP (já existe), produtos relacionados, informações em abas.
5. **Navegação:** menu grande com busca instantânea, coleção com filtros e ordenação, carrinho em gaveta lateral, barra de frete grátis.
6. **Acabamento:** tipografia de verdade (fonte de marca, escala consistente), espaçamento generoso, microinterações discretas e desligáveis (`prefers-reduced-motion`), estados vazios e de erro bonitos.
7. **Confiança:** selos de pagamento, política de troca visível, WhatsApp, avaliações (depois).
O que já existe e serve de base: motor de seções (cerca de 30 tipos), 4 temas, editor em tela cheia. A prioridade é **qualidade de cada seção e desempenho**, não mais quantidade.

## 3. Painéis internos: fugir do "visual de sistema feito por IA"
**O que denuncia o visual genérico** (e vamos evitar): gradiente roxo/azul, cartões brancos arredondados idênticos com sombra suave em tudo, círculo colorido com ícone padrão em toda grade, números gigantes com pílula verde "+12%", fonte neutra sem personalidade, vidro fosco, emoji como decoração, tudo centralizado e com o mesmo respiro.

**Direção proposta: "mesa do atacadista" (ferramenta de trabalho, não vitrine de software).**
- **Linguagem tirada do Brás:** romaneio, etiqueta de preço, nota de pedido, fita, tecido. Papel quente em vez de cinza-azulado, tinta escura, **uma cor de sinal por marca**, linhas finas e régua em vez de sombra e caixa arredondada.
- **Tipografia como identidade:** uma fonte de texto com caráter + **numerais tabulares** (tabelas e valores alinhados, aparência de livro-caixa); títulos editoriais, não "Dashboard".
- **Densidade de ferramenta:** tabelas compactas, atalhos de teclado e **paleta de comandos (Ctrl+K)**; o painel é feito para quem passa o dia nele.
- **Pedido como "ficha/romaneio"** (gaveta lateral com cara de documento), **etiqueta** como elemento visual repetido (status, preço, selo).

**Características-assinatura (diferencial real, não só visual):**
1. **Fila do dia:** a primeira tela é uma lista de decisões ("pagar 3 pedidos", "imprimir 5 etiquetas", "responder 2 clientes"), cada uma com botão de ação.
2. **Pulso da loja:** uma faixa fixa e discreta com vendas de hoje, pedidos parados e saúde da loja (reaproveita `healthScore`), sempre visível.
3. **"Entrar como" e visão 360** no Master, com histórico do cliente em uma linha do tempo (base de `fornecedor-360-master.md`).
4. **Linha do tempo do pedido** em todas as telas (do clique ao entregue), com a mesma anatomia em loja, fornecedor e Master.
5. **Modo expedição** (tela de balcão para o celular/tablet): grande, de uma mão, para o separador/expedidor.
6. **Comandos por teclado** e busca global (pedido, cliente, produto, loja).
Cada marca usa o mesmo esqueleto com **cor e tom próprios** (seção 4), para o dono ver "uma família" e o cliente "um produto".

## 4. Paleta reformulada de todas as marcas (proposta)
Regra: **papel + tinta + uma cor de sinal**; sem gradientes; a cor de sinal só em ação, status e destaque. Contraste calculado (WCAG, razão): ≥ 4,5 para texto normal, ≥ 3 só para decoração/texto grande.
| Marca | Papel | Tinta | Sinal | Apoio | Contrastes principais |
|---|---|---|---|---|---|
| **NextLevel Commerce** | `#F5F1E8` | `#14213D` (azul-tinta) | `#F2B600` (amarelo-etiqueta) | `#2F5BEA` links | tinta/papel 14,2 · tinta sobre amarelo 8,7 |
| **SuperDrop** | `#F2EBDD` (kraft claro) | `#0F1A14` | `#127A44` (verde-expedição, mantém a logo) | `#B7793B` (caixa) | tinta/papel 15,0 · branco sobre verde 5,4 · verde/papel 4,55 |
| **Brás Digital** | `#F6F1EA` (linho) | `#2A0F18` | `#8C1D40` (carmim-tecido) | `#C79A2B` (fio dourado, só decorativo) | branco sobre carmim 8,9 · carmim/linho 7,9 · **ouro sobre carmim 3,4 (só ornamento)** |
| **Hub Creators** (futuro) | `#0B0B10` (escuro primeiro) | `#F4F4F0` | `#C6F432` (limão) | `#FF4D8D` | limão/preto 15,3 |
| **China Hub** (futuro) | `#F5F0E6` (papel de arroz) | `#1A1210` | `#B3141F` (vermelho-lacre) | `#0F6B5C` (jade) | branco sobre vermelho 6,9 · vermelho/papel 6,1 · jade/papel 5,6 |
| **NextLevel (holding/Master)** | `#EFEBE3` | `#101418` | `#FF5A1F` (laranja-sinal) | `#14213D` | a validar no teste (texto laranja só grande) |
Modo escuro de cada marca derivado da mesma lógica (tinta vira fundo, papel vira texto). Estados de sistema (sucesso/aviso/erro) ficam **neutros às marcas**, para não confundir verde da marca com "ok".
Observação: o **tema das lojas dos lojistas** é do lojista (cores dele); esta paleta vale para portais e painéis.

## 5. Alicerce e esqueleto (o que eu entrego, nesta ordem)
1. **Tokens por marca numa fonte só:** hoje cada marca guarda 2 cores em `brand.ts` e o resto vive em `globals.css`. Passar para um conjunto completo (papel, tinta, sinal, apoio, claro/escuro) por marca, aplicado no servidor por `getBrand()` como variáveis CSS, **sem tocar nos temas das lojas**. Teste automático de contraste de todas as combinações.
2. **Camada de componentes única** (botão, campo, tabela, gaveta, etiqueta/status, linha do tempo, paleta de comandos) com a nova linguagem; o Codex desenha, eu garanto o contrato e os testes de acessibilidade.
3. **Desempenho das vitrines:** cache e regeneração das páginas públicas, imagens otimizadas, CDN na frente, orçamento de desempenho medido no e2e.
4. **Esqueleto de navegação dos painéis** (Fila do dia, Pulso, busca global, Ctrl+K) com dados reais onde já existem.
5. **Observabilidade e erros** (painel de erros no Master), para "rodar liso".
Tudo com teste, sem quebrar o SuperDrop em produção.

## 6. O que preciso do dono
1. **Capturas da loja de referência** (e nome do tema, se souber), mais **2 ou 3 sistemas que você admira** e **1 ou 2 que você acha "feito por IA"**, para calibrar o gosto.
2. **Aprova a direção** "mesa do atacadista" (seção 3)? Algo a mudar?
3. **Aprova as paletas** (seção 4)? Quer ver amostras em tela antes de aplicar? (o Codex pode montar uma prévia local na porta 3100)
4. **Ordem:** começar pelo alicerce (tokens + desempenho) e depois a vitrine, ou a vitrine primeiro?
