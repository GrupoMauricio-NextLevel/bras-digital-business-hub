# Comparativo de funcionalidades: NextLevel E-commerce × wBuy

**Data:** 27/10/2026, depois das ondas W0 a W5 e W6a (decisões D183 a D188).

**Como foi feito:**
- **wBuy:** o que aparece nos 9 lotes de capturas do painel de parceiro do dono (`docs/referencias/wbuy-painel-notas.md`). Não testamos o sistema deles; só vimos as telas.
- **NextLevel E-commerce:** conferido no código e nos testes desta data.

**Legenda:**
- ✅ = temos;
- 🟡 = temos em parte;
- ❌ = ainda não temos;
- ⭐ = só nós temos (não aparece no wBuy).

---

## 1. Resumo para o dono

| Área | ✅ Temos | 🟡 Em parte | ❌ Falta | ⭐ Só nós |
|---|---|---|---|---|
| Entrada, conta e segurança | 6 | 1 | 1 | 1 |
| Visão geral do painel | 6 | 1 | 2 | 3 |
| Pedidos | 13 | 1 | 2 | 1 |
| Produtos e catálogo | 9 | 1 | 6 | 0 |
| Clientes e marketing | 7 | 2 | 5 | 1 |
| Estatísticas | 8 | 0 | 1 | 0 |
| Pagamentos, frete e integrações | 9 | 1 | 9 | 0 |
| Configurações, plano e cobrança | 7 | 1 | 4 | 1 |
| Balcão, API e IA | 0 | 1 | 2 | 0 |
| **Total** | **65** | **9** | **32** | **7** |

**Em uma frase:** no dia a dia da loja (pedido, pagamento, envio, medir, recuperar venda, migrar sem perder o Google, segurança e transparência da cobrança), a NextLevel E-commerce já está **no mesmo nível** do wBuy. A diferença está em dois pontos:
- a **quantidade de integrações prontas** (o wBuy tem uma loja de aplicativos com dezenas de parceiros: ERPs, marketplaces, muitas transportadoras);
- alguns **recursos de produto** (personalização, encomenda, produto digital, presente).

**Onde estamos à frente:**
- a **equipe real com rosto** (o fundador e a equipe na sede) dentro do produto;
- a **fila do dia**, que diz ao lojista o próximo passo;
- **visitas sem cookie**, respeitando a lei;
- **links de pagamento** ligados ao estoque;
- a central de aplicativos **honesta**: só mostra o que existe e marca o resto como "em breve".

**Onde eles estão à frente:**
- a **loja de aplicativos com parceiros** (Bling, Tiny, Mercado Livre, Shopee, muitas transportadoras);
- o **balcão (ponto de venda)**;
- a **API pública**;
- o **assistente com IA**;
- os **afiliados de cada loja**;
- a **personalização de produto**.

---

## 2. Comparativo detalhado

### 2.1 Entrada, conta e segurança
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Entrada com foto e convite para criar loja | Sim | Sim, com foto por marca | ✅ |
| Limite de tentativas de senha | Sim | Sim | ✅ |
| Verificação anti-robô na entrada | Sim | Não | ❌ |
| Verificação em duas etapas (código no celular) | Sim | Sim: Master e lojista (D183, D188) | ✅ |
| Sair de todos os aparelhos | Sim | Sim (D183) | ✅ |
| Último acesso e IP por usuário | Sim | Sim (D183) | ✅ |
| Um usuário por pessoa, com aviso | Sim | Sim (equipe da loja) | ✅ |
| Escolher entre várias lojas (agência) | Sim | Conta do grupo e modo suporte; falta o seletor para agência | 🟡 |
| Modo suporte auditado (a equipe entra na loja do cliente com registro) | Pedido pelo painel do parceiro | Sim, com prazo e registro (AD2) | ⭐ |

### 2.2 Visão geral do painel
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Indicadores com comparação ao período anterior | Sim | Sim | ✅ |
| Busca com Ctrl+K e notificações | Sim | Sim | ✅ |
| Tema claro e escuro | Sim | Sim | ✅ |
| Mapa de calor de pedidos por dia e hora | Sim | Sim (análise) | ✅ |
| Visitantes / visitas | "Online agora" e únicos | Visitas por dia e hoje, sem cookie (D185) | ✅ |
| Registro de atividades | Sim | Sim (Registro de ações) | ✅ |
| Guia de boas-vindas interativo | Sim | Recado do fundador e fila do dia | 🟡 |
| Montar a própria visão geral ("Personalizar") | Sim | Não | ❌ |
| Faixa de campanha sazonal da plataforma | Sim | Não; o calendário do varejo existe nas Ferramentas (D188) | ❌ |
| Fila do dia (próximo passo do lojista) | Não | Sim | ⭐ |
| Equipe real e fundador dentro do produto | Não | Sim (D179, D181) | ⭐ |
| "O que mudou" por marca | Novidades no menu | Sim (D183) | ⭐ |

### 2.3 Pedidos
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Abas por situação com contador | Sim | Sim | ✅ |
| Mudar a situação na própria linha | Sim | Sim: próximo passo na linha (D184) | ✅ |
| Gaveta do pedido ao lado da lista | Sim | Sim | ✅ |
| Marcar pedido (estrela) | Sim | Sim (D184) | ✅ |
| "Pedido impresso" | Sim | Sim (D184) | ✅ |
| Sinalizar fraude (segura o envio) | Sim | Sim (D184) | ✅ |
| Ajustar endereço no pedido | Sim | Sim, com o antes e o depois no histórico (D184) | ✅ |
| Previsão de entrega | Sim | Sim, em dias úteis, para o lojista e o cliente (D184) | ✅ |
| Rastreio e e-mail de envio ao cliente | Sim | Sim (D180) | ✅ |
| Cancelar devolvendo o dinheiro pelo Mercado Pago | Sim | Sim (D180) | ✅ |
| Link de pagamento | Sim | Sim: o link vira pedido e cobrança pelo Mercado Pago (D184) | ✅ |
| Origem do cliente (aparelho, campanha) | Sim | Sim (D185) | ✅ |
| Pedido manual | Sim | Sim | ✅ |
| Escolher as colunas da lista | Sim | Não | ❌ |
| Trocas e devoluções como fluxo próprio | Sim | Cancelamento com devolução; falta o pedido de troca pelo cliente | 🟡 |
| Aviso no celular a cada pedido (aplicativo) | Sim | Não; aviso por e-mail | ❌ |
| Atalhos "com estrela", "não impressos", "com suspeita" | Não aparece | Sim (D184) | ⭐ |

### 2.4 Produtos e catálogo
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Variações, fotos e SEO | Sim | Sim | ✅ |
| Grade de tamanhos | Sim | Sim | ✅ |
| Avise-me quando chegar | Sim | Sim | ✅ |
| Avaliações | Sim | Sim | ✅ |
| Importar por planilha | Sim | Sim | ✅ |
| Categorias | Sim | Sim | ✅ |
| Compre junto / relacionados | Sim | Sim: até 4 escolhidos (D186) | ✅ |
| Prazo de produção | Sim | Sim, somado à previsão (D186) | ✅ |
| Atacado sobre o mesmo catálogo | Grupo de clientes | Módulo atacado com preço por quantidade | ✅ |
| Visualizações por produto | Sim | Sim: mais visitados (D185); falta na gaveta do produto | 🟡 |
| Vender sem estoque (encomenda) | Sim | Não (mexe no estoque; rodada própria) | ❌ |
| Personalização (nome e número) | Sim | Não (mexe no preço; rodada própria) | ❌ |
| Embalagem para presente | Sim | Não | ❌ |
| Produto digital | Sim | Não | ❌ |
| Descrição com IA | Sim | Não | ❌ |
| Vídeo como capa do produto | Sim | Não | ❌ |

### 2.5 Clientes e marketing
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Lista de clientes com etiquetas | Sim | Sim | ✅ |
| Carrinho abandonado | Sim (aplicativo) | Sim: e-mail em 1 h e 24 h, só com o sim do cliente (D186) | ✅ |
| Cupons e campanhas com início e fim | Sim | Sim | ✅ |
| Cupom de boas-vindas (popup) | Sim | Sim | ✅ |
| Banners | Sim, com posições e vídeo | Sim (Central de Banners) | ✅ |
| Pixel da Meta e API de conversões | Sim (aplicativo) | Sim, sem contar duas vezes (D187) | ✅ |
| Loja em lançamento com lista de espera | Sim | Sim (D187) | ✅ |
| Banner com data de início e fim e imagem para celular | Sim | Em parte (campanhas têm data) | 🟡 |
| Programa de parceiros | Afiliados da loja | Parceiros da plataforma (PA0 a PA7) | 🟡 |
| Aniversários (cupom automático) | Sim | Não | ❌ |
| Afiliados de cada loja | Sim | Não | ❌ |
| Live shop | Sim | Não | ❌ |
| Ofertas periódicas e selos | Sim | Não | ❌ |
| Entrar com Google (cliente) | Sim | Não | ❌ |
| Visitas medidas sem cookie e sem dado pessoal | Não aparece | Sim (D185) | ⭐ |

### 2.6 Estatísticas e relatórios
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Visitas por dia | Sim | Sim (D185) | ✅ |
| Produtos mais visitados | Sim | Sim (D185) | ✅ |
| Produtos mais vendidos | Sim | Sim | ✅ |
| Vendas por canal | Sim | Sim (loja, WhatsApp, Instagram, manual, campanha) | ✅ |
| Conversão | Não aparece | Sim (D185) | ✅ |
| Vendas por estado e recorrência | Métricas de clientes | Sim | ✅ |
| Planilhas (pedidos, produtos, clientes) | Sim | Sim, com origem e rastreio (D185) | ✅ |
| Movimentação de estoque | Sim | Sim, por variação | ✅ |
| Registros técnicos (logs de API e webhook) | Sim | Painel de erros no Master; sem API pública ainda | ❌ |

### 2.7 Pagamentos, frete e integrações
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Mercado Pago (Pix e cartão parcelado) | Sim | Sim, até 6x, conferido na API (D178) | ✅ |
| Frete por regras próprias | Sim | Sim | ✅ |
| SuperFrete / Melhor Envio | Sim | Sim | ✅ |
| Retirada na loja | Sim | Sim | ✅ |
| Botão de WhatsApp | Sim | Sim | ✅ |
| Google Shopping (lista de produtos) | Sim (aplicativo) | Sim (D187) | ✅ |
| Endereços antigos (redirecionamento 301) | Sim (aplicativo) | Sim (D187) | ✅ |
| Domínio próprio | Sim | Sim | ✅ |
| Central que mostra o que está ligado | Loja de aplicativos | Central de aplicativos honesta (D188) | ✅ |
| Loja de aplicativos com parceiros instaláveis | Dezenas | Não | 🟡 |
| Pix direto com baixa manual | Sim | Não (em breve) | ❌ |
| Receber na entrega ou retirada | Sim | Não (em breve) | ❌ |
| Delivery por bairro ou distância | Sim | Só por regras de CEP | ❌ |
| Muitas transportadoras (Jadlog, Loggi, J&T…) | Sim | Via plataforma de envio; sem integração direta | ❌ |
| ERPs (Bling, Tiny, Omie…) | Sim | Não | ❌ |
| Marketplaces (Mercado Livre, Shopee) | Sim | Não | ❌ |
| TikTok Shop e outros anúncios | Sim | Não (pesquisa salva) | ❌ |
| Loja instalável no celular (PWA) | Sim | Só nas marcas | ❌ |
| Lista de presentes | Sim | Não | ❌ |

### 2.8 Configurações, plano e cobrança
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Transparência da comissão (o que entra e o que não entra) | Sim | Sim: "Sua taxa", igual à fatura (D183) | ✅ |
| Plano atual e troca de plano | Sim | Sim | ✅ |
| Economia do anual em reais | Sim | Sim (D183) | ✅ |
| Faturas | Sim | Sim (Pix e cartão) | ✅ |
| Loja em manutenção ou lançamento | Sim | Sim (D187) | ✅ |
| E-mails transacionais | Sim | Sim, com o fundador assinando o de boas-vindas | ✅ |
| Usuários da loja | Sim | Sim | ✅ |
| Escolher o dia de vencimento | Sim | Não (precisa de regra proporcional) | 🟡 |
| Scripts por página | Sim | Não (risco de segurança; preferimos integração nomeada) | ❌ |
| Escolher quais avisos receber | Sim | Não | ❌ |
| Chamados de suporte no painel | Sim | WhatsApp e e-mail oficiais (D181) | ❌ |
| Bloqueio de IP | Sim | Não | ❌ |
| Suporte com gente de verdade e rosto | Não aparece | Sim (D181) | ⭐ |

### 2.9 Balcão, API e IA
| Funcionalidade | wBuy | NextLevel E-commerce | Situação |
|---|---|---|---|
| Balcão (ponto de venda) com atalhos e código de barras | Sim | Pedido manual; o balcão completo é a W6b | 🟡 |
| API pública e webhooks de saída | Sim | Não (W6c) | ❌ |
| Assistente com IA | Sim (em teste, com cota) | Não; o projeto está escrito (Maurício v1 e v2, W6e) | ❌ |

---

## 3. O que falta para empatar (e passar), em ordem

1. **Pix direto e receber na entrega:** pedem a sua decisão sobre a baixa manual, já aprovada em D182. Falta uma rodada própria, com teste de dinheiro.
2. **Encomenda, personalização e presente:** são recursos que vendem mais por pedido e precisam de uma rodada com teste de estoque e preço.
3. **Balcão (W6b):** para a loja física, e abre a porta "Tenho loja física" da home.
4. **Integrações por API (W6c):** com a API aberta, Bling e Tiny se conectam sem precisarmos fazer um a um.
5. **Afiliados de cada loja (W6d):** reaproveita o programa de parceiros que já existe.
6. **Aviso no celular a cada pedido** (painel instalável no celular) e a **faixa de campanha sazonal** no painel.
7. **Assistente com IA (W6e):** depois do resto, como o prompt do Maurício recomenda.

---

## 4. Cuidados com este comparativo
- **Lado da wBuy:** vem de capturas de tela. Pode haver funções que não apareceram e detalhes que não conseguimos ver. Não copiamos texto, marca, imagem nem código.
- **Lado da NextLevel:** é o que está no código e nos testes desta data, e já está publicado ou vai com esta onda. Em "temos", contamos só o que funciona, nunca o "em breve".
- **"Em parte" (🟡):** marca o que existe mas ainda não cobre tudo o que o wBuy mostra. A coluna do meio diz o que falta.
