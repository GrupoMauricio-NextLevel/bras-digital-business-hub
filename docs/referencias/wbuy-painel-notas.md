# Notas de referência: painel wBuy (conta de parceiro oficial do dono)

> **Para que serve:** juntar, lote a lote, o que o dono mostra do painel wBuy (plataforma de lojas virtuais da qual ele é parceiro oficial). No fim, vira um arquivo de racional e um prompt mestre para a NextLevel E-commerce (e talvez o SuperDrop).
>
> **Regras:**
> - Anotar padrões e funções, nunca copiar texto, marca, imagem ou código da wBuy.
> - Sem dados de clientes: nada de vendas, pedidos ou e-mail das lojas.
> - Cada item termina com "Nós hoje", para marcar o que já existe no sistema e o que falta.

## Lote 1 (2026-10-27): entrada, escolha de conta, visão geral, assistente e menu do usuário

### 1.1 Tela de entrada
- **Layout:** tela dividida. Do lado esquerdo, um formulário mínimo (logo, saudação de retorno curta, uma linha de apoio). Do lado direito, uma foto grande de empreendedor no estoque.
- **Entrada em duas etapas:** primeiro o e-mail, depois a senha. Tem verificação anti-robô, "Esqueceu seu e-mail?" e, no rodapé, "Ainda não tem uma loja? Criar agora".
- **Nós hoje:** `AuthCardShell` com foto por marca e cartão sobre a foto, convite de cadastro por marca e entrada em uma etapa. Não temos verificação anti-robô; há limite de tentativas? (conferir).

### 1.2 Escolha de conta (parceiro com várias lojas)
- **Título** "Escolha uma conta", com busca de contas.
- **Aviso:** o acesso de suporte à conta de um cliente é pedido pelo painel de parceiro.
- **"Lojas disponíveis" (contador):** cartões com nome, domínio, número da conta, tipo (E-commerce) e o botão "Gerenciar".
- **"Lojas de temas disponíveis":** lojas de teste do parceiro, com endereço provisório na plataforma, para desenvolver temas (tipo "Loja do Parceiro").
- **Nós hoje:** conta do grupo e passagem entre marcas (perfis ligados) e modo suporte auditado (AD2). **Falta:** um seletor de lojas para quem cuida de várias (agência ou parceiro) e uma "loja de testes de tema" para parceiro desenvolvedor.

### 1.3 Visão geral do lojista
- **Tema escuro** com cor de destaque laranja. O modo claro e o escuro se escolhem no menu do usuário.
- **Menu lateral em três grupos:**
  - operação: Visão geral, Pedidos, Produtos, Clientes, Marketing, Afiliados, Omni (vendas por outros canais), Aplicativos, Assinaturas (recorrência), meio de pagamento próprio, Marketplaces, Webmail;
  - "Sua loja": Temas, Páginas, Blog, Estatísticas, Ferramentas, Configurações;
  - "Geral": Plataforma.
- **Topo:** busca com atalho Ctrl+K, notificações, botão do assistente de IA e menu do usuário.
- **Cabeçalho:** "Olá, {nome}! Aqui está o resumo da sua loja hoje.", seletor de período (data a data) e o botão **"Personalizar"** (o lojista monta a própria visão geral).
- **Faixa de campanhas da plataforma, que pode ser fechada:**
  - venda de hospedagem melhor para o pico de vendas;
  - "Analise sua loja para a Black Friday" (diagnóstico sem custo).

  São campanhas sazonais vendendo serviço dentro do painel.
- **Guia de boas-vindas:** "1 de 9", leva cerca de 2 minutos, com "Pular guia" e "Começar", e pode ser revisto no menu do usuário.
- **Indicadores com variação em relação ao período anterior:**
  - visitantes online (ao vivo, com ponto verde);
  - itens vendidos, novos pedidos e visitantes únicos;
  - ticket médio;
  - SKUs sem estoque, com "ver lista".
- **Total em vendas:** gráfico de área no período.
- **Notificações:** estoque esgotado por variação, com horário relativo.
- **Mais abaixo:**
  - últimos pedidos (iniciais do cliente, número, tempo, valor, situação colorida);
  - **pedidos por dia da semana e hora**, num mapa de calor;
  - **registro de atividades** (quem entrou, quando).
- **Nós hoje:**
  - **Temos:** primeira tela com fila do dia, pulso da loja, Ctrl+K, notificações, indicadores e alternância de tema claro e escuro. O recado do fundador (D181) faz um papel parecido com a boas-vindas.
  - **Falta:** visitantes online e únicos (precisa de contagem de visitas na loja), mapa de calor por dia e hora, "Personalizar" a visão geral (já está nas ideias soltas), guia interativo de boas-vindas, faixa de campanhas sazonais da NextLevel dentro do painel (ex.: diagnóstico de Black Friday) e registro de atividades na visão geral.

### 1.4 Assistente de IA (lateral, em teste)
- **Painel lateral de conversa:** "Oi, {nome}! Como posso te ajudar hoje?", com perguntas sugeridas ("como configuro variações", "cliente não consegue se cadastrar", "minha loja não atualiza"), anexo, voz e o aviso "a IA pode cometer erros".
- **Cota diária de ações com IA**, mostrada no menu do usuário com uma barra de uso.
- **Nós hoje:** não temos assistente. **Oportunidade:** um assistente que conhece o sistema (ajuda de uso primeiro, depois ações), com cota por plano.

### 1.5 Menu do usuário
- **Conteúdo:** nome completo, e-mail, papel ("Administrador Master"), cota de IA, "Alterar meus dados", "Rever guia do painel", "Meu plano", "Faturas", "Alternar entre lojas", "Aparência" (claro e escuro), "Desconectar", **"Sair de todos os dispositivos"** e o IP da sessão.
- **Nós hoje:** temos dados, plano, faturas e aparência (conferir). **Falta:** "Sair de todos os dispositivos" (encerrar as outras sessões) e mostrar o IP e a última entrada.

## Lote 2: pedidos, gaveta do pedido, pedido de balcão e lista de produtos

### 2.1 Lista de pedidos
- **Submenu de Pedidos:** "Link de pagamento", "Pedido balcão" e "Trocas e devoluções".
- **Abas por situação, cada uma com contador e cor própria:** todos, aguardando, pagamento em análise, pago, separação, expedição, transporte, cancelado, negado, pedido em análise, nota fiscal.
- **Dica fechável:** baixar o aplicativo de celular para ser avisado a cada pedido novo.
- **Ações:** "Preferências", "Estatísticas de venda", "Opções", busca por pedido ou cliente, "Filtros" e "Colunas" (o lojista escolhe as colunas).
- **Cada linha mostra:**
  - número, com ícones de marcação (estrela = favorito ou destaque; nota; asterisco);
  - forma de envio (SEDEX, PAC, transportadora);
  - data e hora;
  - cliente, com cidade e UF;
  - **situação como seletor colorido que muda o status na própria linha**, com a data da última mudança;
  - valor, forma de pagamento e meio de pagamento;
  - ver e expandir.
- **Nós hoje:** filtros por situação (abas na E-commerce), filtros, link de pagamento? (conferir propostas e link), pedido manual, pós-venda. **Falta:**
  - situação mudada na própria linha;
  - escolher colunas;
  - marcar pedido (favorito ou nota);
  - aba "pagamento em análise" ou antifraude;
  - aba de nota fiscal;
  - trocas e devoluções como fluxo próprio;
  - aplicativo ou aviso no celular a cada pedido (PWA com notificação).

### 2.2 Gaveta do pedido (abre ao lado da lista)
- **Topo:** número, situação (seletor), data, **"Sinalizar fraude"** e a chave **"Pedido impresso"**.
- **Produtos:**
  - foto e nome;
  - código, SKU, código externo e variação;
  - quantidade;
  - preço "de/por" e total;
  - subtotal, frete e total.
- **Histórico do pedido** em linha do tempo, com a origem de cada evento (ex.: "pré-postagem nos Correios", "pagamento retornou pago").
- **"Dados da sessão"**, que pode ser aberto: dispositivo ("MOBILE") e de onde veio o cliente.
- **Lateral:**
  - cliente (número, nome, documento, e-mail, telefone com atalho para WhatsApp, "Ajustar dados", "Ver mais");
  - entrega (endereço, "Ajustar endereço", serviço, prazo, previsão de entrega, código de rastreio);
  - pagamento.
- **Rodapé:** "Fechar" e "Imprimir" (com opções).
- **Nós hoje:** detalhe do pedido em página, linha do tempo, rastreio (D180), impressão. **Falta:**
  - gaveta lateral na própria lista (já está na skill do painel);
  - "pedido impresso";
  - sinalizar fraude;
  - ajustar dados e endereço do cliente no pedido;
  - previsão de entrega;
  - origem do cliente (dispositivo e canal).

### 2.3 Pedido balcão (ponto de venda)
- **Tela cheia de caixa:**
  - categorias à esquerda, com contador;
  - grade de produtos com foto, estoque ("4 un."), código e preço, e botão "+";
  - busca por produto, SKU ou **código de barras (F2)**;
  - **"Produto temporário" (F3)**;
  - cliente buscado por nome, CPF ou telefone (F4);
  - carrinho;
  - forma de pagamento (F8);
  - situação do pedido;
  - "Finalizar venda" (F12).
- **Opções na parte de baixo:** ajustar valor, observação, entrega, afiliado e créditos. Tudo com **atalhos de teclado**.
- **Nós hoje:** pedido manual (formulário) e Balcão v1 da Brás (desligado). **Oportunidade:** um ponto de venda de verdade, para loja física (porta "Tenho loja física" da home), com atalhos e leitor de código de barras.

### 2.4 Lista de produtos
- **Submenu de Produtos:** categorias, avaliações, **tabelas** (de medidas ou de preço?), **vitrines**, **upsell e cross-sell**.
- **Linha:** foto, código, nome, preço, quantidade de variações, categoria (e subcategoria), estoque (destacado), situação, ver, editar e expandir.
- **Nós hoje:** catálogo com busca e filtros. **Falta:** vitrines e upsell ou cross-sell como cadastro próprio, e colunas escolhíveis.

## Lote 3: detalhe e edição do produto

### 3.1 Gaveta do produto
- Foto, nome, código e número do produto.
- Atalhos para "Avaliações" e **"Avise-me"** (com contador).
- **Indicadores do produto:** pedidos (com "ver todos"), **visualizações** e **curtidas** (favoritos).
- **Variações:** foto, tamanho, peso, SKU, número, "Adicionar código" externo, "ver integrações", estoque, preço "de/por", ações (sincronizar e outra).
- "Modificado em …" e "Editar produto".
- **Nós hoje:** produto com variações, avise-me e avaliações. **Falta:** visualizações e favoritos por produto, e código externo por variação (integrações).

### 3.2 Edição do produto
- **Abas:** informações básicas, informações adicionais, peso e dimensões, estoque e variações, fotos, vídeo, SEO.
- **Topo:** "Cancelar", **"Salvar e ver na loja"** e "Gravar produto" (Ctrl+S).
- **Aviso:** lista de produtos proibidos na plataforma.
- **Informações básicas:**
  - título e código;
  - categoria principal (com "+ novo" ali mesmo) e subcategorias (várias);
  - descrição em editor rico com **"Otimizar com IA"**.
- **Coluna "Definições":**
  - tipo **físico ou digital**;
  - "Visível na loja" e "Disponível para venda" (separados);
  - marca, atributos e **selos**.
- **"Configurações adicionais":**
  - campos adicionais;
  - **grupo de clientes** (ex.: só atacado);
  - produtos relacionados;
  - combo;
  - **personalizador** (ex.: nome e número na camisa);
  - **compre junto**;
  - **multiplicador** (venda em múltiplos) e sua equivalência;
  - disposição das fotos;
  - nome e formato do campo "Cor" no site.
- **Chaves:** prazo de produção, data de lançamento, **vender sem estoque** (encomenda), produto customizável, embalagem para presente, envio de arquivo pelo cliente.
- **Peso e dimensões:** embalagem cadastrada (+ novo), peso, comprimento, largura, altura, frete grátis no produto, com aviso "medidas do produto já embalado".
- **Estoque e variações:**
  - tipo de grade: sem variação, **cor ou tamanho**, **biquíni** (grade de duas partes);
  - "Configurar variações";
  - tabela por variação (estoque, editar, apagar, ativa);
  - limite de 150 variações, com recomendação de no máximo 50.
- **Fotos:** várias, reordenáveis, com medidas recomendadas (1600 × 1200 ou 1200 × 1600).
- **Vídeo:** endereço do Vimeo ou YouTube, "usar vídeo como capa" e "vídeo flutuante".
- **SEO** e **"Permanecer na página ao gravar"**.
- **Nós hoje:** cadastro com variações, fotos, SEO e grade de tamanhos (S1). **Falta:**
  - personalizador;
  - compre junto e combo;
  - produto digital;
  - vender sem estoque (encomenda) e prazo de produção;
  - embalagem para presente;
  - grupo de clientes por produto (atacado);
  - "salvar e ver na loja";
  - otimizar descrição com IA;
  - vídeo como capa.

## Lote 4: categorias, clientes, grupos e banners

### 4.1 Categorias
- **Lista com:** ordem (número), situação, nome, número da categoria, contador de subcategorias, quantidade de produtos, **"Mobile"** (aparece no celular?), **"Menu"** (aparece no menu?), ativo, ações.
- Paginação com "itens por página".
- **Nós hoje:** categorias. **Falta:** escolher se aparece no menu e no celular, e a ordem.

### 4.2 Clientes
- **Submenu:** grupos, **membros** (clube ou área de membros?), **aniversários**.
- **Linha:** data de cadastro, número, um "G" (cadastro pelo Google?), nome, e-mail, documento, cidade e UF, compras (valor, quantidade, data da última), **etiquetas** (VAREJO e LEAD), ativo, ver, editar, apagar.
- **Nós hoje:** clientes da loja e CRM. **Falta:** grupos (varejo e atacado), aniversários (campanha), etiquetas, entrada com Google e o cliente "lead" (cadastro sem compra).

### 4.3 Grupos de clientes
- "Varejo" (padrão) e "Atacado", com quantidade de produtos por grupo.
- É o **atacado como grupo de clientes sobre o mesmo catálogo**, a mesma ideia da nossa regra anti-duplicação ("atacado = lista de preços sobre o mesmo catálogo").
- **Nós hoje:** módulo atacado (`/merchant/atacado`) e tabelas de preço por quantidade. **Conferir** se dá para restringir produtos por grupo.

### 4.4 Banners
- **Submenu de Marketing:** banners, popups, **carrinho abandonado**, destaques, **live shop**, newsletter, **ofertas periódicas**, promoções, redes sociais, selos de segurança.
- **Lista:** miniatura, ordem, posição (principal em carrossel, rodapé, topo, central), disponibilidade ("não expira"), ativo, editar, duplicar, apagar.
- **Novo banner:**
  - posição (principal em carrossel, topo, central, rodapé, meio, personalizado);
  - nome;
  - formato **imagem, GIF ou vídeo**;
  - imagem do computador e do celular separadas;
  - link e "abre em";
  - **disponibilidade com data de início e fim**;
  - guia de tamanhos.
- **Nós hoje:** Central de Banners (TM-E2), campanhas e cupons. **Conferir:** agendamento por data, vídeo e GIF, popups, carrinho abandonado (e-mail e WhatsApp), ofertas periódicas.

## Lote 5: afiliados e loja de aplicativos

### 5.1 Afiliados do lojista
- **Indicadores:** pedidos totais, receita total, ticket médio, pedidos pagos, total pago, taxa de conversão.
- **Saques:** valor pendente, "em dia".
- **Gráficos:** faturamento mensal e saques concluídos, com estado vazio explicado.
- **Menu:** ver afiliados, grupos, **ranking**, histórico de saques, **formulário de cadastro**, indicações, **material de apoio**, **painel do afiliado**, **personalizar painel**.
- **Nós hoje:** programa de parceiros da NextLevel (PA0 a PA7: a plataforma com os parceiros). **Falta:** afiliados **de cada loja** (o lojista com os afiliados dele). Influenciador é um `kind` de `partners` (regra anti-duplicação), e o Hub Creators está adiado (D42).

### 5.2 Loja de aplicativos
- **"Conhecer aplicativos"**, busca, filtros (todos, instalados, não instalados, recomendados).
- **Categorias:** experiência do cliente, gestão, logística, marketing, meios de pagamento, vendas, marketplaces, aplicativos externos.
- **Cartão:** logo, nome, categoria, selo "Instalado" ou "Recomendado", uma frase e os botões "Instalar", "Configurar", "Saiba mais" ou "Acessar".
- **Marcados como recomendados:** gestão LGPD, antifraude, landing pages de campanha, Mercado Livre, Mercado Pago, outros meios de pagamento, hub de marketplaces, Shopee, vídeo na página inicial.
- **Instalados nesta loja:** meio de pagamento próprio, Correios (contrato e pré-postagem), Google (Analytics, Merchant, Ads, Sitemap), WhatsApp (botão fixo).
- **Outros vistos:**
  - fidelidade e cashback, roleta de leads, afiliados de terceiros;
  - automação de e-mail e WhatsApp, trocas e devoluções, alertas no WhatsApp (novo pedido, status, senha);
  - muitos meios de pagamento (cartão, boleto, Pix parcelado);
  - muitas transportadoras e hubs de frete (Melhor Envio, SuperFrete, Frenet, Intelipost, Jadlog, Loggi, J&T…);
  - ERPs (Bling, Tiny/Olist, Omie, Conta Azul, Linx…);
  - balcões de retirada, confirmação de maioridade, provador online, chat ao vivo.

## Lotes 6 e 7: o resto da loja de aplicativos e as ferramentas

### 6.1 Aplicativos (continuação)
- **Entrega local:** delivery por bairros (CEP) e **delivery por distância** (instalado nesta loja).
- **Formas de cobrança:** frete a cobrar, **faixas de CEP** (condições por faixa), **pagamento a combinar**, **receber na entrega**, **receber na retirada**, **Pix direto** (sem intermediário, com conferência e baixa manual).
- **Instalados nesta loja:**
  - Pixel do Facebook (catálogo do Instagram Shop e API de conversões);
  - transportadora Onlog;
  - redirecionamento 301 (para migração);
  - XML de produtos (Google Shopping);
  - retirada na loja.
- **Outros:**
  - **PWA** (instalar a loja no celular) e avaliações (RA Trustvox);
  - lista de presentes, perfis de clientes, resgate de códigos;
  - TikTok Shop e TikTok Ads, Pinterest;
  - vídeo flutuante, marketing de influenciadores, recomendação de produtos;
  - SMS, armazém (fulfillment).
- **Aplicativo fora do plano atual:** aviso "Este recurso não está incluso no seu plano atual. Ver opções disponíveis" (venda do plano acima).
- **Cupom de parceiro dentro da loja de aplicativos:** ex.: "Use o cupom … para 20% off".
- **Nós hoje:** frete por regras próprias e SuperFrete/Melhor Envio (P1a), retirada, Mercado Pago, WhatsApp, rastreio. **Falta:**
  - uma "loja de aplicativos" (vitrine de módulos e integrações que se ligam e desligam por loja: os nossos *entitlements* já sustentam isso);
  - delivery por bairro ou distância;
  - receber na entrega ou retirada;
  - Pix direto com baixa manual;
  - redirecionamento 301 (essencial para migração);
  - XML do Google Shopping, Pixel e API de conversões;
  - PWA;
  - lista de presentes.

### 7.1 Ferramentas (calculadoras)
- **Preço e lucro:**
  - calculadora de preço e markup;
  - simulador de promoção (quanto o desconto reduz o lucro e quanto mais vender);
  - parcelamento sem juros (preço para receber o mesmo valor);
  - frete grátis (a partir de quanto cabe na margem);
  - ponto de equilíbrio;
  - ROAS e CAC.
- **Marketing:** gerador de UTM e calendário comercial (datas do varejo e quando começar a preparar).
- **Nós hoje:** simulador de plano e calculadoras de parceiro e de venda (`sale-calculator`, `partner-calculator`). **Oportunidade:** ferramentas simples e úteis, que puxam o lojista para dentro do painel (custo baixo, valor percebido alto). Algumas podem ser públicas (atraem visitantes para a página da marca).
