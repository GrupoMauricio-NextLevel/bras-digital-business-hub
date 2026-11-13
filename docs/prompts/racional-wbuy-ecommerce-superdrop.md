# Racional e prompt mestre: o que melhorar na NextLevel Commerce (e no SuperDrop), a partir do painel wBuy

> **Origem:** 9 lotes de capturas do painel wBuy que o dono enviou em 2026-10-27, tiradas da conta de parceiro oficial dele. As notas brutas estão em `docs/referencias/wbuy-painel-notas.md`.
> **Método (skills):**
> - `painel-interno`: fila de decisões, gaveta, velocidade;
> - `pagina-de-vendas`: só anunciar o que existe;
> - `desempenho`, `nova-migracao` e `desenvolver-prompt`.
>
> Cada "Nós hoje" abaixo foi **conferido no código** nesta data (arquivo citado), e não tirado da memória.
>
> **Regras deste documento:**
> - Aprender padrões, **nunca copiar** texto, marca, imagem ou código da wBuy.
> - Nenhum dado de cliente das lojas da wBuy entra aqui.
> - Vale a regra de foco 60/25/15: E-commerce, SuperDrop e o resto.
> - Vale a regra anti-duplicação (CLAUDE.md): estender o que existe antes de criar.

---

## Parte 1. Resumo para o dono (leia só isto se tiver pressa)

**O que a wBuy tem e nós não:** uma plataforma madura de lojas, com muitas peças pequenas que somadas dão segurança ao lojista:
- pedidos que se resolvem na própria lista;
- uma loja de aplicativos que liga e desliga funções;
- ferramentas de cálculo;
- transparência na cobrança;
- segurança visível (duas etapas, IP, sair de todos os aparelhos).

**O que nós temos e ela não mostrou:**
- **gente de verdade com rosto**: o fundador e a equipe na sede (D179 a D181);
- **fila do dia** com o próximo passo;
- pós-venda simples para a loja sem fornecedor (D180);
- várias marcas sobre o mesmo motor;
- o SuperDrop (vender sem estoque com fornecedor).

**Onde estamos mais perto do que parecia** (conferido no código):

| Recurso | Onde está |
|---|---|
| Gaveta do pedido | `src/components/shared/order-quick-view.tsx` |
| Mapa de calor de pedidos por dia e hora | `src/lib/domain/analytics.ts` (`heatmap`) |
| Vendas por canal | `analytics.ts` (`byChannel`), sobre `orders.channel` |
| Etiquetas de cliente | `src/lib/domain/crm.ts` |
| Atalho Ctrl+K | `src/components/app/command-palette.tsx` |
| Limite de tentativas no login | `allowLoginAttempt` em `src/app/actions/auth.ts` |
| Campanhas com início e fim | `src/lib/domain/campaigns.ts` |
| Ligar e desligar funções por loja | `src/lib/domain/entitlements.ts` |
| Movimentação de estoque | `src/lib/domain/inventory.ts` (`listMovements`) |

**As 10 maiores lacunas, na ordem em que eu atacaria:**
1. **Transparência da taxa e do plano** na tela do lojista: quanto já deu no mês, o que entra e o que não entra, quando fecha, trocar para o anual com a economia em reais. Custa pouco e gera confiança.
2. **Pedidos resolvidos na lista:** abas com contador, mudar a situação na própria linha, marcar e anotar, "já impresso", ajustar endereço.
3. **Contar visitas na loja** (por dia e por produto): sem isso não há conversão, "mais visitados" nem "visitantes agora".
4. **Carrinho abandonado** (e-mail primeiro): é a venda mais barata que existe.
5. **Redirecionamento 301 + XML do Google Shopping + Pixel:** sem isso, quem vem de outra plataforma tem medo de migrar e de perder o anúncio.
6. **Segurança visível:** sair de todos os aparelhos, último acesso e IP por usuário, verificação em duas etapas.
7. **Vender mais por pedido:** produtos relacionados e "compre junto", encomenda com prazo de produção, personalização (nome e número), embalagem de presente.
8. **Ferramentas do lojista:** calculadora de preço e margem, promoção, parcelamento, frete grátis, ponto de equilíbrio, calendário comercial. Algumas também em página pública, para atrair visitantes.
9. **Vitrine de módulos ("Aplicativos")** sobre os *entitlements* que já existem: cada função nova entra como módulo que liga e desliga, com aviso "não está no seu plano".
10. **Balcão (ponto de venda) para loja física**, com leitor de código de barras e atalhos. Serve à porta "Tenho loja física" da home.

**Depois:** API e webhooks de saída para ERP, assistente com IA (o prompt do Maurício v1/v2 já existe), afiliados de cada loja e delivery por bairro ou distância.

**Para o SuperDrop** (em produção; nada muda sem teste): entram os itens 1, 2, 3, 4, 6 e a calculadora de margem. O lojista do SuperDrop escolhe a margem sobre o preço do fornecedor, e a calculadora é ainda mais útil para ele.

---

## Parte 2. Racional: os sete padrões que a wBuy ensina

### 2.1 O painel é uma mesa de trabalho, não um relatório
Na wBuy quase tudo se resolve sem trocar de tela:
- a situação do pedido muda num seletor na própria linha;
- o pedido abre numa gaveta ao lado da lista;
- o produto abre numa gaveta com pedidos, visualizações e favoritos.

**Para nós:** é a mesma direção da skill `painel-interno` ("o que eu preciso fazer agora?"). A gaveta do pedido já existe; falta trazer as **ações** para a lista e para a gaveta.

### 2.2 Uma plataforma vira ecossistema pela loja de aplicativos
A wBuy mostra dezenas de integrações em categorias (pagamento, frete, marketing, ERP, marketplaces), com "instalado" e "recomendado". O que não está no plano mostra o aviso "não está no seu plano", e isso vende o plano de cima.

**Para nós:** já temos `entitlements` (concessão por plano, cortesia ou compra avulsa). Falta a **vitrine**: um catálogo único de módulos com estado por loja. Isso também resolve um problema nosso: o que está pronto e desligado (D145) passa a ter um lugar para ser ligado pelo lojista.

### 2.3 Cobrança transparente gera confiança
A tela de comissão da wBuy explica a conta inteira:
- o que entra e o que não entra;
- quanto já deu na competência;
- quando fecha;
- quanto o lojista economizaria usando o meio de pagamento da plataforma.

**Para nós:** a taxa sobre vendas pagas existe e fecha por mês (FM3, D90), mas o lojista não vê a conta. Mostrar a conta é barato e reduz chamado e cancelamento.

### 2.4 Ferramentas simples seguram o lojista dentro do painel
Calculadoras de preço, promoção, parcelamento, frete grátis, ponto de equilíbrio, ROAS e CAC, mais o calendário comercial. São telas pequenas, sem banco, que respondem dúvidas de todo dia.

**Para nós:** custo baixo e valor alto. Algumas podem ser públicas (atraem visita orgânica para a marca), sempre **sem promessa de ganho**: a ferramenta calcula o que o lojista digita.

### 2.5 Migrar sem medo
O redirecionamento 301, o XML de produtos, o Pixel, a importação e o "Ver loja" com aviso de atualização existem porque quem troca de plataforma tem medo de perder o Google e os anúncios.

**Para nós:** já importamos produtos (`product-import.ts`) e vendemos migração como serviço (bloco da equipe em `/planos`). Faltam os 301 e os feeds. Sem eles, a promessa de "trazer da outra plataforma" fica pela metade.

### 2.6 Segurança que o lojista vê
- usuário por pessoa, com o aviso "não compartilhe a senha";
- duas etapas;
- IP e último acesso;
- "sair de todos os dispositivos";
- bloqueio de IP;
- anti-robô quando a loja está sob ataque.

**Para nós:** temos limite de tentativas e equipe com acessos separados (`store-team.ts`). Falta tornar a segurança **visível e controlável**.

### 2.7 A plataforma vende serviço dentro do painel, na hora certa
A wBuy usa uma faixa fechável com campanhas sazonais ("analise sua loja para a Black Friday", hospedagem para o pico).

**Para nós:** temos o catálogo Master, a Soluções e o diagnóstico. Falta a **faixa de campanha da NextLevel no painel do lojista**, ligada ao calendário comercial e sempre fechável. É receita de serviço sem custo de aquisição.

### Onde **não** devemos seguir a wBuy
- **Menu enorme logo de cara.** Nossa conta simples esconde o que não se aplica (R1, "perfil da loja único"). Módulo desligado não aparece no menu; aparece só na vitrine de módulos.
- **Taxa maior para quem não usa o meio de pagamento da casa.** Não temos meio de pagamento próprio; não inventar.
- **IA com cota como enfeite.** Assistente só quando fizer coisas reais, com confirmação (Maurício v1).
- **Tema escuro como padrão.** Já temos claro e escuro; a cor é da marca (D163).

---

## Parte 3. Matriz completa: o que a wBuy tem, o que nós temos e a lacuna

Legenda:
- **Impacto:** A (alto), M (médio), B (baixo).
- **Esforço:** P (pequeno, até 1 dia), M (médio, 2 a 4 dias), G (grande, 1 semana ou mais).
- **Marca:** EC (E-commerce), SD (SuperDrop).
- **Nós hoje** foi conferido no código.

### 3.1 Entrada, conta e segurança
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Entrada com foto e convite de cadastro | `AuthCardShell` com foto por marca (D181: equipe no Master) | Nenhuma | — | — | — |
| Limite de tentativas | `allowLoginAttempt` (`actions/auth.ts`) | Anti-robô (verificação) só quando há ataque | B | M | EC SD |
| Seletor de lojas para quem cuida de várias | Conta do grupo, perfis ligados, modo suporte (AD2) | Seletor "minhas lojas" para agência ou parceiro com várias contas | M | M | EC |
| Sair de todos os aparelhos | Não existe | Versão da sessão no usuário; o botão invalida as outras sessões | M | P | EC SD |
| Último acesso e IP por usuário | Não existe | Gravar na entrada e mostrar em Equipe e no menu | M | P | EC SD |
| Verificação em duas etapas | Não existe | App autenticador (TOTP), obrigatória para o Master e opcional para o lojista | M | M | EC SD |
| Aviso "um usuário por pessoa" | Não existe | Texto em Equipe | B | P | EC SD |

### 3.2 Visão geral do lojista
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Indicadores com variação | Sim (pulso, análise D170) | — | — | — | — |
| Visitantes agora e visitantes únicos | Não (não contamos visitas) | Contador de visitas (ver 3.6) | A | M | EC SD |
| Mapa de calor dia × hora | **Já existe** em `/merchant/analytics` | Levar um resumo à primeira tela ("seu melhor horário é…") | B | P | EC SD |
| Guia de boas-vindas | Recado do fundador (D181) e fila do dia | Guia passo a passo opcional (só se a fila não bastar; medir antes) | B | M | EC |
| "Personalizar" a visão geral | Não | Esconder e reordenar blocos (preferência por usuário) | B | M | EC |
| Faixa de campanha da NextLevel | Não | Faixa fechável ligada ao calendário comercial e ao catálogo Master | M | P | EC |
| Registro de atividades | Auditoria existe (`/merchant/auditoria`) | Últimas 5 atividades na primeira tela | B | P | EC |

### 3.3 Pedidos
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Abas por situação com contador | Filtros por situação | Contador em cada aba (uma consulta agrupada) | M | P | EC SD |
| Mudar a situação na linha | Só na página do pedido | Seletor na linha, respeitando `order-status.ts` (só as transições permitidas) | A | M | EC |
| Gaveta do pedido | **Já existe** (`order-quick-view.tsx`) | Ações dentro da gaveta (enviar, imprimir, cancelar) | M | M | EC SD |
| Escolher colunas | Não | Preferência por usuário | B | P | EC |
| Marcar e anotar pedido | Não | Estrela e nota interna no pedido | M | P | EC SD |
| "Pedido impresso" | Não | Marcar ao imprimir; filtro "não impressos" | M | P | EC SD |
| Sinalizar suspeita de fraude | Não | Marcação manual + motivo; segura o envio | M | P | EC |
| Ajustar dados e endereço no pedido | Não | Edição auditada antes do envio | M | M | EC |
| Previsão de entrega | Prazo do frete existe | Data prevista calculada (pago + prazo) no pedido e no rastreio | M | P | EC SD |
| Origem do cliente (aparelho, de onde veio) | `channel` só tem 4 valores | Guardar aparelho e UTM no checkout | M | M | EC SD |
| Link de pagamento | **Quase existe:** propostas (`proposals.ts`, `/merchant/orders/propostas`) geram um link que vira pedido | Chamar de "Link de pagamento" na E-commerce, copiar e mandar no WhatsApp | A | P | EC |
| Trocas e devoluções como fluxo | Cancelamento com devolução do dinheiro (D180) | Pedido de troca ou devolução aberto pelo cliente, com etapas | M | G | EC |
| Aviso no celular a cada pedido | E-mail | Notificação do navegador (PWA do painel) | M | M | EC SD |

### 3.4 Produtos e catálogo
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Variações, fotos, SEO, grade de tamanhos | Sim (S1) | — | — | — | — |
| Avise-me e avaliações | Sim (`/merchant/avise-me`, `/merchant/avaliacoes`) | — | — | — | — |
| Visualizações e favoritos por produto | Não | Contador de visitas por produto (3.6); favoritos depois | M | M | EC |
| Relacionados e "compre junto" | Não (só a seção de tema) | Lista manual de relacionados + desconto do "compre junto" sobre `coupons`/descontos | A | M | EC |
| Encomenda e prazo de produção | Não | Chave "vender sem estoque" + dias de produção somados ao prazo | M | M | EC |
| Personalização (nome e número) | Não | Campo de texto por produto, com preço adicional opcional, gravado no item do pedido | M | M | EC |
| Embalagem para presente | Não | Opção com preço no checkout | B | P | EC |
| Produto digital | Não | Entrega por link após o pagamento (sem frete) | M | G | EC |
| Grupo de clientes (só atacado) | Módulo atacado (`/merchant/atacado`) | Conferir se dá para esconder produto do varejo; senão, estender | M | M | EC |
| Categoria no menu e no celular, com ordem | Categorias simples | Chaves "no menu" e "no celular" + ordem | B | P | EC |
| "Salvar e ver na loja" | Não | Botão que salva e abre a página do produto | B | P | EC SD |
| Descrição com IA | Não | Fica para o assistente (fase IA) | B | M | EC |
| Vídeo como capa | Não | Vídeo do YouTube como primeira mídia | B | M | EC |

### 3.5 Clientes e marketing
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Etiquetas | **Já existe** (`crm.ts`) | Filtro por etiqueta já existe; mostrar na lista | B | P | EC |
| Aniversários | Não | Data de nascimento opcional + cupom automático no mês | M | M | EC |
| Cliente "lead" (sem compra) | Cupom de boas-vindas captura e-mail (`welcome-coupon.ts`) | Mostrar os leads no CRM | B | P | EC |
| Entrar com Google (cliente final) | Não | Depois; avaliar a lei e o custo | B | G | EC |
| Banners agendados, celular e computador, vídeo | Central de Banners (TM-E2); campanhas com data | Data de início e fim no banner e imagem separada para o celular | M | M | EC |
| Popup (newsletter ou cupom) | Cupom de boas-vindas | Já cobre o essencial | — | — | — |
| **Carrinho abandonado** | **Não existe** | Capturar o e-mail no 1º passo do checkout; e-mail após 1 h e 24 h com link de volta; parar ao comprar | A | M | EC SD |
| Ofertas periódicas | Campanhas | — | — | — | — |
| Afiliados de cada loja | Programa de parceiros da plataforma (PA0 a PA7) | `partners` com um tipo novo, ligado à loja (anti-duplicação). Hub Creators segue adiado (D42) | M | G | EC |

### 3.6 Estatísticas e relatórios
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Vendas, ticket, margem, produtos mais vendidos, por estado, por canal, recompra | **Já existe** (`analytics.ts`) | — | — | — | — |
| **Visitas da loja** (dia, produto, origem) | Não | Tabela agregada por dia, loja e produto (sem cookie, sem dado pessoal; robôs filtrados) | A | M | EC SD |
| Taxa de conversão | Não | Pedidos pagos ÷ visitas | A | P (depois das visitas) | EC SD |
| Produtos mais visitados | Não | Da tabela de visitas | M | P | EC |
| Movimentação de estoque como relatório | `listMovements` por variação | Tela com filtro e exportação | B | P | EC |
| Exportar planilha | Clientes e financeiro já exportam | Pedidos e produtos em CSV | M | P | EC SD |

### 3.7 Aplicativos, integrações e entrega
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Vitrine de módulos | `entitlements` (sem vitrine) | Catálogo de módulos com estado por loja, "não está no seu plano" e ligar com um clique | A | M | EC |
| Mercado Pago, WhatsApp, frete por regras, SuperFrete/Melhor Envio, retirada | Sim | — | — | — | — |
| **Redirecionamento 301** | Não | Tabela de-para por loja, aplicada no roteamento da loja | A | M | EC |
| **XML do Google Shopping** | Não | Feed por loja (`/store/[slug]/feed.xml`) dos produtos ativos | A | P | EC SD |
| **Pixel e API de conversões** | Não | ID do pixel por loja + eventos de vista, carrinho e compra; o token vai criptografado | A | M | EC SD |
| Scripts por página | Não | Só com lista branca (risco de segurança); preferir integrações nomeadas | B | M | EC |
| Delivery por bairro ou distância | Frete por regras | Regra por faixa de CEP já cobre bairros; distância depois | M | M | EC |
| Receber na entrega ou na retirada | Não | Forma de pagamento "na entrega", com baixa manual | M | M | EC |
| Pix direto com baixa manual | Não | Chave Pix da loja (criptografada), QR estático, baixa pelo lojista. Pagamento **não conferido** fica marcado como manual | M | M | EC |
| Loja instalável no celular (PWA) | Manifest só nas marcas | Manifest por loja (nome, ícone, cor) | B | P | EC |
| Lista de presentes | Não | Depois | B | G | EC |
| ERPs e marketplaces (Bling, Mercado Livre, Shopee) | Bling planejado na Brás (F7) | Via API e webhooks (3.9); integração própria depois | M | G | EC |

### 3.8 Configurações, plano e cobrança
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Loja em manutenção ou em lançamento | Publicar e despublicar | Página "abrimos em breve" com captura de e-mail (lista de espera) | M | P | EC |
| Textos e cores do carrinho e do checkout | Tema define | Pouco ganho; manter no tema | — | — | — |
| Escolher notificações | Não | Preferências de aviso por tipo | B | P | EC SD |
| **Tela "Sua taxa"** (transparência) | Taxa fecha por mês (FM3) | O que entra e o que não entra, valor acumulado, data do fechamento, histórico | A | P | EC SD |
| "Meu plano": anual com economia, trocar de plano, dia de vencimento | Anual com desconto no Master; assinatura | Mostrar ao lojista em reais, trocar sozinho, escolher o dia | A | M | EC |
| Chamados de suporte | WhatsApp e e-mail (D181) | Depois de medir o volume | B | M | EC |
| Novidades e sugestões | Não | Página "O que mudou" (pode vir de `DECISIONS.md`) + caixa de sugestão que vai ao Master | B | P | EC SD |
| "Ver loja" com aviso de atualização | "Ver loja" | Mostrar os dois endereços (domínio próprio e o nosso) | B | P | EC |

### 3.9 Balcão, API e IA
| Item | Nós hoje | Lacuna | Imp. | Esf. | Marca |
|---|---|---|---|---|---|
| Balcão (ponto de venda) | Pedido manual; Balcão v1 da Brás (desligado) | Tela de caixa com busca, código de barras, atalhos e cliente rápido, gerando pedido `channel=MANUAL` (ou um novo canal BALCAO) | M | G | EC |
| API e webhooks de saída | Só eventos internos (`emitEvent`) | Chave de API por loja (criptografada), webhooks de pedido, estoque e produto com assinatura e registro de entregas | M | G | EC |
| Assistente com IA | Prompts `mauricio-agente-ia-v1/v2.md` | Seguir a v1 (ajuda de uso → ações com confirmação), com cota por plano | M | G | EC SD |

---

## Parte 4. Ordem de execução (ondas) e a regra 60/25/15

A ordem segue "confiança antes de recurso": primeiro o lojista entende o que paga e resolve o pedido rápido; depois medimos a loja; depois vendemos mais; por último abrimos o ecossistema.

| Onda | Nome | Itens | Por quê agora | Tamanho |
|---|---|---|---|---|
| **W0** | Confiança | Tela "Sua taxa"; "Meu plano" (anual, troca, vencimento); sair de todos os aparelhos; último acesso e IP; aviso de segurança; "O que mudou" | Barato e reduz cancelamento antes de abrir o cadastro | P a M |
| **W1** | Pedido na mesa | Contador nas abas; situação na linha; ações na gaveta; marcar e anotar; impresso; previsão de entrega; link de pagamento | O lojista vive na lista de pedidos | M |
| **W2** | Medir a loja | Visitas por dia e produto; conversão; mais visitados; origem e aparelho no pedido; CSV de pedidos e produtos | Sem medir, nada abaixo pode ser avaliado | M |
| **W3** | Recuperar e vender mais | Carrinho abandonado; relacionados e "compre junto"; encomenda com prazo; personalização; presente | Mais receita por visita | M a G |
| **W4** | Migrar sem medo | 301; XML do Google; Pixel e API de conversões; manutenção ou lançamento com lista de espera | Destrava quem vem de outra plataforma | M |
| **W5** | Vitrine de módulos e ferramentas | Vitrine sobre `entitlements`; calculadoras (painel e públicas); calendário comercial com a faixa de campanha; Pix direto e receber na entrega como módulos | Vira ecossistema e receita de plano | M a G |
| **W6** | Grandes peças | Balcão; API e webhooks; duas etapas; afiliados por loja; assistente (Maurício v1) | Cada uma é um projeto; só com o dono escolhendo | G |

**Regra de foco:**
- W0 a W4 são E-commerce (60%).
- O que vale para o SuperDrop entra na mesma onda, atrás de teste (25%): tela "Sua taxa", contadores e gaveta, visitas, carrinho abandonado, XML do Google, Pixel e a calculadora de margem.
- O resto do grupo (15%) não recebe nada desta lista agora.

### SuperDrop: o que entra e com qual cuidado
- **Está em produção com clientes:** cada mudança de pedido no SuperDrop exige teste que prove que o fluxo atual (etiqueta antes, recarga, Central) não mudou. A regra `etiquetaAntes` (D180) já separa os dois mundos e deve ser reaproveitada.
- **Situação na linha:** no SuperDrop quem avança o pedido é a Central (fornecedor). O lojista do SuperDrop **não** ganha o seletor na linha; ganha só os contadores, a marcação e a gaveta.
- **Calculadora de margem:** é a ferramenta mais útil para o SuperDrop (preço do fornecedor + margem + taxa + frete grátis), sem promessa de ganho.

---

## Parte 5. Prompt mestre (cole numa sessão de trabalho)

```text
Você vai desenvolver, por ondas, as melhorias da NextLevel Commerce (e o que couber ao SuperDrop)
descritas em docs/prompts/racional-wbuy-ecommerce-superdrop.md.

ANTES DE COMEÇAR
1. Leia CLAUDE.md, AGENTS.md, docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md, este documento inteiro
   e as notas em docs/referencias/wbuy-painel-notas.md.
2. Use as skills: painel-interno (toda tela autenticada), desenvolver-prompt (uma onda por vez),
   nova-migracao (toda mudança de schema), qa-visual (capturas 360/768/1440 + axe), desempenho
   (consultas por bloco, nada de consulta em laço), publicar (no fim de cada onda).
3. Confirme com o dono qual onda (W0 a W6). Se ele não disser, comece pela W0.

REGRAS QUE NÃO QUEBRAM
- Nunca copie texto, marca, imagem ou código da wBuy. Aprenda o padrão e escreva do nosso jeito.
- Anti-duplicação: estenda antes de criar.
  - afiliado da loja = um tipo de partners;
  - "compre junto" e aniversário = coupons/descontos;
  - módulo = entitlements;
  - visita = uma tabela agregada nova, a única tabela nova da W2;
  - balcão = pedido com channel próprio;
  - grupo de clientes = o módulo atacado.
- Domínio em src/lib/domain/*, ações por runAction, permissões no servidor, um tenant nunca lê outro.
- Valores em centavos. Textos em português claro. Sem número ou promessa de ganho em ferramenta
  ou campanha: a calculadora só calcula o que o lojista digita.
- Segredos (token do Pixel, chave Pix, chave de API) só com encryptSecret; nunca em tela, log ou e-mail.
- Pagamento só vale conferido na API do Mercado Pago. Pix direto e "receber na entrega" ficam
  marcados como baixa manual, nunca como pagamento conferido.
- SuperDrop em produção: toda mudança que toca pedido, taxa ou painel do SuperDrop tem teste provando
  que o comportamento atual se mantém; o lojista do SuperDrop não muda situação de pedido (quem
  avança é a Central).
- Conta simples da E-commerce não mostra conceitos do SuperDrop (R1). Módulo desligado não aparece
  no menu, só na vitrine.
- Página com banco: export const dynamic = "force-dynamic". Sem rolagem horizontal em 360 px. axe sem
  violações graves.
- Decisão nova em docs/design/DECISIONS.md com etiqueta da frente (próxima livre: ver CLAUDE.md).

ONDA W0 (Confiança). Critérios de aceite:
- /merchant/finance ganha "Sua taxa":
  - competência atual, valor elegível, percentual do plano, valor acumulado e data do fechamento;
  - lista "entra" e "não entra" vinda da MESMA função que fecha o mês (teste: o número da tela é
    igual ao do fechamento para os mesmos pedidos).
- "Meu plano":
  - plano atual;
  - economia do anual em reais (vinda do Master, nunca fixa);
  - trocar de plano com confirmação;
  - escolher o dia de vencimento entre 4 opções.
- Segurança:
  - "Sair de todos os outros aparelhos" (versão de sessão no usuário; teste: a sessão antiga cai);
  - último acesso e IP em Equipe (o IP só para o dono da loja e para o Master);
  - aviso "um usuário por pessoa".
- "O que mudou": lista curta de novidades por marca, escrita à mão, sem jargão.

ONDA W1 (Pedido na mesa). Critérios de aceite:
- Abas com contador (uma consulta agrupada).
- Seletor de situação na linha só com as transições que order-status.ts permite para a loja
  (teste para loja independente e para loja de rede).
- Gaveta com enviar (EnvioDialog), imprimir e cancelar.
- Estrela e nota interna.
- "Impresso" marcado ao imprimir, com filtro.
- Previsão de entrega = data do pagamento + prazo do frete (+ dias de produção quando houver),
  mostrada no pedido e no rastreio.
- Link de pagamento: o pedido manual gera link do Mercado Pago da loja, conferido pela API ao voltar
  (mesmo caminho do checkout).
- e2e na E-commerce + teste de que o painel do SuperDrop não ganhou o seletor.

ONDA W2 (Medir a loja). Critérios de aceite:
- Tabela agregada de visitas (loja, dia, produto opcional, contagem):
  - sem cookie e sem dado pessoal;
  - robôs filtrados pelo user-agent;
  - gravação que não atrasa a página (fora do caminho crítico).
- Conversão, mais visitados e um "visitas hoje" no pulso.
- Aparelho e UTM gravados no pedido.
- CSV de pedidos e produtos com as permissões do lojista.
- Mede o custo da gravação com a skill desempenho e registra o antes e depois.

ONDA W3 (Recuperar e vender mais). Critérios de aceite:
- Carrinho abandonado:
  - e-mail capturado no 1º passo do checkout, com consentimento claro;
  - e-mails depois de 1 h e de 24 h, com link que recompõe o carrinho;
  - para quando o cliente compra ou se descadastra;
  - idempotência por dedupeKey;
  - painel com quantos voltaram.
- Relacionados manuais e "compre junto" com desconto sobre o motor de descontos existente.
- "Vender sem estoque" e dias de produção.
- Personalização (texto livre com limite e preço adicional opcional) gravada no item e mostrada
  no pedido e na etiqueta.
- Embalagem para presente.

ONDA W4 (Migrar sem medo). Critérios de aceite:
- 301 por loja:
  - importação de-para em CSV;
  - aplicado no roteamento da loja;
  - teste de loop e de endereço externo proibido.
- feed.xml por loja (produtos ativos, preço, disponibilidade, imagem, link).
- Pixel por loja (vista, carrinho, compra) e API de conversões com token criptografado.
- Loja "em lançamento" com página de espera e lista de e-mails.

ONDA W5 (Vitrine de módulos e ferramentas). Critérios de aceite:
- /merchant/aplicativos lista os módulos de um catálogo único:
  - estados: ligado, desligado, "não está no seu plano" (com o plano que libera);
  - ligar e desligar grava entitlements e auditoria.
- Calculadoras: preço e margem, promoção, parcelamento, frete grátis, ponto de equilíbrio
  (funções puras com teste); duas delas também em página pública da marca.
- Calendário comercial com a faixa de campanha da NextLevel, fechável por loja.
- Pix direto e "receber na entrega" como módulos, com baixa manual.

ONDA W6 (Grandes peças). Só com o dono escolhendo qual, uma por vez:
- Balcão;
- API e webhooks (assinatura HMAC e registro de entregas);
- duas etapas (TOTP);
- afiliados por loja;
- assistente (seguir mauricio-agente-ia-v1.md).

FECHAMENTO DE CADA ONDA
- tsc, eslint, vitest e build.
- Capturas 360/1440 com axe 0 nas telas novas.
- e2e do fluxo principal.
- Decisão em DECISIONS.md e linha atualizada em docs/prompts/README.md.
- Publicar (skill publicar) e conferir no ar.
- Relatório ao dono em português simples: o que ficou pronto, o que depende dele e a próxima onda.
```

---

## Parte 6. Decisões que dependem do dono

1. **Ordem das ondas.** Recomendo W0 → W1 → W2 → W3 → W4 → W5, com W6 por escolha.
2. **Link de pagamento (W1).** Usa o Mercado Pago da loja. Se a loja ainda não conectou, mostrar o passo de conectar em vez do link?
3. **Carrinho abandonado (W3).** Começar só por e-mail (Resend) e deixar o WhatsApp para quando houver API oficial.
4. **Pix direto e receber na entrega (W5).** São pagamentos que o sistema **não confere**. Aceita mostrar ao lojista "baixa manual, sob sua responsabilidade"?
5. **Calculadoras públicas (W5).** Quais duas vão para a página pública? Sugestão: preço e margem, e frete grátis.
6. **Balcão (W6).** Quer leitor de código de barras e impressora térmica desde a primeira versão, ou só a tela de caixa?
7. **Duas etapas.** Obrigatória para o Master já na W0 (recomendado) ou junto da W6?
