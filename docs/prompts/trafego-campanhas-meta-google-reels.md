# Tráfego, campanhas (Meta e Google), Reels e retorno de vendas: racional, campanha de teste e prompt mestre

> **Status: EM ANDAMENTO.** TR0 e TR1 **feitas** (D290) e TR2 **feita** (D291, com cidade, aparelho e notificações em tempo real na D292), 13/11/2026: aviso de cookies, política revista, clique do anúncio e primeiro toque, regra única de canal, links rastreados `/l/`, medição própria do site, "Agora no site" em tempo real e Origens. TR3 **feita** (D294): origem de cada contato no Comercial, Fechou/Perdeu e código da visita no WhatsApp. TR4 **feita** (D295): Pixel da Meta e Google no site, só com consentimento, números colados no Master. **Próxima: TR5** (devolver contato, conta e pagante pelo servidor).
> **O que o dono pediu:** seguir os passos do Reportei dentro do Master; saber de onde vem cada acesso (anúncio da Meta, Google, orgânico); tráfego do site em tempo real; preparar o site para tráfego pago e orgânico; confirmar se o lead fechou ou não e devolver isso para a Meta e o Google acharem gente parecida; integração de gestão de campanhas; automatizar Reels do Instagram; todos os links rastreados.
> **Como usar:** leia as partes 1 a 9 (racional, em português sem jargão). A parte 10 é a campanha de teste para rodar **depois** de desenvolvido. A parte 12 é o prompt para colar numa sessão de trabalho e desenvolver por fases.
> **Marcação:** **[fato]** = conferido no código hoje; **[plataforma]** = regra da Meta/Google como está documentada (confira no dia, elas mudam); **[hipótese]** = estimativa para testar.

---

## Parte 1. Resposta curta (para ler em 1 minuto)

1. **Sim, dá para integrar a Meta e o Google direto no Master.** Pela API oficial das duas empresas dá para: ler gasto, cliques e resultados de cada campanha; mandar de volta quem virou cliente (para a plataforma achar gente parecida); montar públicos com a lista de clientes; e pausar, ligar e mudar orçamento. **Criar campanha inteira pelo nosso painel também é possível, mas não vale a pena agora:** o Gerenciador de Anúncios faz isso melhor, e o nosso painel deve ser o lugar de **medir, decidir e devolver resultado**.
2. **O pedaço mais valioso não é o anúncio, é o "fechou ou não fechou".** O Reportei e ferramentas parecidas só mostram o que a Meta e o Google contam (cliques, leads do formulário). Eles **não sabem** quem pagou o plano. Nós sabemos, porque o CRM e a cobrança estão no mesmo sistema. Devolver "este lead virou pagante, valor R$ 149" para a Meta e o Google é o que faz a próxima campanha ficar mais barata.
3. **Tráfego em tempo real dá**, com uma medição nossa (sem depender do Google Analytics): quem está no site agora, de qual canal veio, em que página está, quem clicou no WhatsApp.
4. **Reels dá para agendar e publicar automaticamente pela API oficial do Instagram**, ler os números de cada um e responder no direct quem comentar uma palavra (o famoso "comente LOJA que eu te mando o link"). **Não dá** pela API: escolher música em alta da biblioteca, pôr figurinha ou adesivo de link. Gravar continua sendo trabalho de gente (ou de IA com revisão).
5. **Links rastreados em tudo**: um encurtador nosso (`nextlevelcommerce.com.br/l/xxxx`) que anota o clique e manda para a página com a etiqueta da campanha. Serve para anúncio, bio, direct, story, WhatsApp, e-mail, parceiro.
6. **Antes de qualquer anúncio pago, precisa de três coisas que o sistema ainda não tem** (detalhe na Parte 3): medição no site da própria NextLevel (hoje só as lojas dos lojistas têm Pixel), aviso de cookies com consentimento (LGPD), e o registro do clique da Meta e do Google (`fbclid` e `gclid`), que hoje é descartado.
7. **Ordem recomendada:** links e origem → tempo real → lead com origem completa e "fechou/perdeu" → Pixel e API de conversões no site da NextLevel → devolver vendas → painel de campanhas (estilo Reportei) → Reels automáticos → gestão com trava → levar tudo para o lojista como recurso do plano.

---

## Parte 2. O que é o Reportei e o que vamos copiar (e superar)

**O que o Reportei faz** (pelo que a ferramenta divulga publicamente; confira no site deles antes de comparar preço):
- Conecta as contas (Meta Ads, Google Ads, Instagram, Facebook, Google Analytics, YouTube, LinkedIn, TikTok e outras) pelas APIs oficiais, **só leitura**.
- Monta relatórios e painéis prontos com os números de cada rede, compara períodos, mostra metas, tem uma linha do tempo de anotações e envia relatório automático para o cliente.
- Usa IA para escrever a análise do relatório.

**O que ele não faz (e nós podemos fazer):**

| Ponto | Reportei | Nosso Master |
|---|---|---|
| Ver gasto, cliques e leads de cada campanha | Sim | Sim (mesmas APIs) |
| Saber quem do lead **pagou o plano** e quanto | Não (não vê o nosso CRM) | **Sim**: lead, loja, assinatura e pagamento estão no mesmo banco |
| Custo por **cliente pagante** real e retorno real (receita ÷ gasto) | Não | **Sim** |
| Devolver a venda para a Meta e o Google otimizarem | Não | **Sim** (API de conversões e importação de conversões) |
| Tráfego do site em tempo real por canal | Depende do Google Analytics | **Sim**, com medição própria |
| Links rastreados e encurtador | Não é o foco | **Sim** |
| Publicar Reels e responder comentários no direct | Não | **Sim** (fase própria) |
| Comissão do parceiro que indicou | Não | Já existe (D90), e o painel separa "indicação" de "anúncio" |

**Copiar do Reportei:** a forma do relatório (resumo no topo, comparação com o período anterior, gráfico por dia, tabela por campanha, anotações na linha do tempo, relatório semanal por e-mail, texto de análise feito pela IA). **Superar:** fechar o ciclo até o dinheiro.

**Atalho de curto prazo (opcional):** assinar o Reportei só para relatórios enquanto o nosso painel não fica pronto. Ele não substitui as Fases TR1 a TR5, que são o que faz o anúncio ficar mais barato.

---

## Parte 3. O que o sistema já tem hoje e o que falta

**Já existe [fato]:**
- `src/proxy.ts` (D90): quando a pessoa chega com `utm_*` ou `ref` (código do parceiro), grava o **último toque não direto** em cookie próprio por 30 dias (`nl-attr`, `nl-ref`). Visita direta não apaga.
- `src/lib/attribution.ts`: lê esse cookie e leva a origem de um domínio para outro (Commerce, Soluções).
- `brand_leads.attribution` (JSON): o lead do site guarda a origem (utm, página). `corporate-sales.ts` e `brand-leads.ts` gravam.
- `src/lib/domain/comercial.ts` (Master → Comercial): funil com etapas **Contato → Conta criada → Ativando → Vendendo → Pagante → Em risco → Perdido**, com campo `origem`, temperatura, responsável e próxima ação (`crm_acompanhamento`). **É exatamente o "fechou ou não fechou" que a Meta e o Google precisam receber.**
- Lojas dos lojistas: Pixel da Meta no navegador (`pixel-meta.tsx`) e compra pela API de conversões no servidor (`src/lib/payments/meta-capi.ts`, D187), com o número do pedido como `event_id` para a Meta não contar duas vezes; Google Analytics, Tag Manager, Google Ads, TikTok e Pinterest por ID colado (D189, Rodada A da fila de integrações).
- Visitas das lojas por dia, origem e aparelho, **sem cookie e sem dado pessoal** (`src/lib/domain/visitas.ts`, D185), com a função `origemDe` que já classifica google, instagram, facebook, whatsapp, tiktok, youtube.
- Pedido da loja guarda `utm_source`, `utm_medium`, `utm_campaign` e aparelho.
- O redirecionamento do domínio antigo para `nextlevelcommerce.com.br` **mantém** as etiquetas da campanha (`host-routing.ts` repassa `search`) [fato].

**Falta (o que este documento resolve):**
1. **O site da própria NextLevel (páginas públicas da Commerce e do grupo) não tem Pixel da Meta, Google Ads nem Google Analytics.** O que existe é para as lojas dos lojistas. Hoje um anúncio da NextLevel não teria como contar resultado.
2. **Não há aviso de cookies com consentimento** no site público. Para ligar Pixel e Google com segurança (LGPD), precisa.
3. **O clique do anúncio é jogado fora.** O proxy guarda só `utm_*` e `ref`. Os identificadores que a Meta (`fbclid`) e o Google (`gclid`, `gbraid`, `wbraid`) põem no link, que são a "chave" para devolver a venda, não são guardados.
4. **Só o último toque.** Não guardamos o **primeiro** canal (o que trouxe a pessoa pela primeira vez), nem a página de entrada de cada visita.
5. **Sem sessão nem tempo real.** Não há "quem está no site agora".
6. **Sem encurtador de links** e sem padrão de nomes de campanha.
7. **Nada volta para a Meta e o Google** quando um lead da NextLevel vira conta ou pagante.
8. **Não lemos gasto** de campanha nenhuma: não dá para calcular custo por lead nem por cliente.
9. **Lead que chega pelo WhatsApp perde a origem** (a conversa começa fora do site).
10. **Instagram:** nenhuma conexão oficial (publicação, métricas, comentários, direct).

---

## Parte 4. Os níveis de integração com anúncios (do mais simples ao mais profundo)

| Nível | O que é | Precisa de | Valor para nós |
|---|---|---|---|
| **N0. Links etiquetados** | Todo link com `utm_source/medium/campaign/content` e o encurtador `/l/` | Só o nosso sistema | Base de tudo; sem ele, o resto não sabe de onde veio |
| **N1. Pixel e tag no navegador** | Pixel da Meta e tag do Google no site da NextLevel, com consentimento | ID do Pixel e da conversão | A plataforma vê visitas, leads e cadastros; dá para fazer remarketing |
| **N2. Envio pelo servidor** | API de conversões da Meta e conversões avançadas do Google (e-mail/telefone resumidos em código, nunca abertos) | Token da Meta (usuário do sistema) e conta Google Ads | Recupera o que bloqueador de anúncio e iPhone escondem; mais confiável |
| **N3. Devolver o fechamento** | Mandar "virou conta", "virou pagante, R$ X" dias depois do clique | N2 + o clique guardado (`fbclid`/`gclid`) ou e-mail/telefone | **O mais importante.** A plataforma aprende quem paga, não só quem clica |
| **N4. Públicos** | Lista de clientes (resumida em código) para "público semelhante" e para **excluir** quem já é cliente | Permissão de públicos | Achar gente parecida com quem paga; não gastar com quem já comprou |
| **N5. Leitura de campanhas** | Gasto, impressões, cliques, leads por campanha/conjunto/anúncio, por dia | Permissão de leitura de anúncios | Painel estilo Reportei com custo por cliente **real** |
| **N6. Gestão com trava** | Pausar, ligar, mudar orçamento; alerta e sugestão | Permissão de gestão | Agir sem abrir o Gerenciador; sempre com aprovação de uma pessoa |
| **N7. Criar campanha pelo painel** | Montar campanha, conjunto e anúncio pela API | Permissão de gestão + muito trabalho | **Não recomendado agora**: o Gerenciador faz melhor e muda toda hora |
| **N8. Formulário nativo e WhatsApp** | Lead Ads (formulário dentro do Facebook/Instagram) caindo no CRM em segundos; anúncio que abre o WhatsApp com rastreio do clique | Permissão de leads; API oficial do WhatsApp (I-19) | Lead mais barato; o WhatsApp é onde o brasileiro fecha |

**Recomendação:** fazer N0 a N6 e N8. Deixar N7 para quando houver gestor de tráfego pedindo.

**Detalhe importante de acesso [plataforma]:**
- **Meta, para a conta de anúncios da própria NextLevel**, o acesso "padrão" da API basta (é a nossa conta). Para operar contas de **lojistas** (vender o recurso, Fase TR9), precisa de **acesso avançado**, que exige **revisão do aplicativo** e **verificação da empresa** na Meta. Use um **usuário do sistema** do Gerenciador de Negócios para o token (não expira como o token pessoal, que vence em cerca de 60 dias).
- **Google Ads API** exige uma **conta de administrador (MCC)** e um **token de desenvolvedor**; ele começa só com contas de teste e precisa pedir **acesso básico** para mexer em conta real. A aprovação pode levar dias ou semanas: **peça no começo**.

---

## Parte 5. Como cada pedaço funciona (racional por camada)

### 5.1 Links rastreados e padrão de nomes
- **Encurtador próprio**: `https://nextlevelcommerce.com.br/l/<código>` (e `nextlevelgroup.com.br/l/<código>`). O Master cria o link escolhendo destino, canal, campanha e peça; o sistema monta as etiquetas, conta o clique (sem guardar IP) e redireciona.
- **Por que nosso e não bit.ly:** o clique fica no nosso banco, junto do lead; a etiqueta não se perde; dá para trocar o destino depois sem trocar o link impresso.
- **Padrão de nomes (obrigatório, o Master valida):** tudo minúsculo, sem acento, com hífen.
  - `utm_source`: `meta`, `google`, `instagram`, `tiktok`, `youtube`, `whatsapp`, `email`, `parceiro`, `site`
  - `utm_medium`: `pago`, `organico`, `bio`, `story`, `direct`, `reels`, `post`, `lista`, `indicacao`, `remarketing`
  - `utm_campaign`: `<aaaa-mm>-<objetivo>-<oferta>` (ex.: `2026-12-cadastro-teste3dias`)
  - `utm_content`: a peça (`video-dor-direct-v1`, `carrossel-temas-v2`)
  - `utm_term`: público ou palavra-chave (`amplo`, `interesse-moda`, `criar-loja-virtual`)
- **Nos anúncios da Meta**, usar os "parâmetros de URL" do próprio anúncio com as variáveis dinâmicas da Meta (`{{campaign.name}}`, `{{adset.name}}`, `{{ad.name}}`, `{{campaign.id}}`...). **No Google**, ligar a marcação automática (`gclid`) e usar um "modelo de acompanhamento" com as etiquetas.

### 5.2 Primeiro toque, último toque e o clique do anúncio
- Ampliar o proxy para guardar também `fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid` e a **página de entrada**.
- Guardar **dois** registros: o **primeiro toque** (nunca sobrescreve, 90 dias) e o **último toque não direto** (o que já existe, D90).
- Com o `fbclid`, montar o cookie `_fbc` no formato que a Meta pede (`fb.1.<momento>.<fbclid>`) para mandar junto no servidor.
- Quando a pessoa vira lead, **copiar tudo para o lead** (primeiro toque, último toque, cliques, página, aparelho). O lead nunca perde a origem, mesmo que o cookie expire depois.

### 5.3 Canal: a regra que diz "de onde veio"
Uma função só (estende a `origemDe` de `visitas.ts`, regra anti-duplicação) devolve o **canal**:

| Canal | Regra (em ordem) |
|---|---|
| `meta-pago` | tem `fbclid` com `utm_medium=pago`, ou `utm_source=meta` e medium pago |
| `google-pago` | tem `gclid`/`gbraid`/`wbraid`, ou `utm_source=google` e medium pago |
| `indicacao` | tem `ref` de parceiro (a comissão continua pela regra D90, separada desta conta) |
| `instagram-organico` | `utm_source=instagram` sem pago, ou veio de instagram.com / l.instagram.com |
| `facebook-organico` | veio de facebook.com / fb.com sem clique de anúncio |
| `google-organico` | veio de google.* sem `gclid` (busca orgânica, SEO) |
| `ia` | veio de chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com (canal novo e crescente; ver `busca-e-ia-visibilidade-organica.md`) |
| `whatsapp` | `utm_source=whatsapp` ou veio de wa.me / whatsapp.com |
| `email` | `utm_source=email` |
| `outros-sites` | qualquer outro site |
| `direto` | sem etiqueta e sem site de origem |

Observação honesta: o Instagram muitas vezes **não informa** de onde veio (o navegador interno esconde). Por isso link etiquetado em tudo; sem etiqueta, parte do orgânico do Instagram cai como "direto".

### 5.4 Tráfego em tempo real ("Agora no site")
- Um coletor nosso: a página manda um sinal leve ao abrir e a cada 30 s enquanto a aba está visível (com `sendBeacon`), com página, canal e um **identificador anônimo** do visitante (cookie próprio, sem nome, sem IP guardado).
- Master → Tráfego → **Agora**: quantas pessoas estão no site nos últimos 5 minutos, por canal, por página, por aparelho; lista "entrou agora pela campanha X na página Y"; marcadores quando alguém **clica no WhatsApp**, **começa o cadastro** ou **vira lead**. Atualiza a cada 10 s (consulta simples; nada de conexão permanente, que pesa no Render).
- **Robôs fora** (mesma regra `ehRobo` de `visitas.ts`).
- Guardar o detalhe por 90 dias e um resumo por dia por 13 meses (banco leve, custo baixo no Neon).
- Diferença para as lojas dos lojistas: lá a visita é contada **sem cookie** por decisão (D185). Aqui, no site da NextLevel, o visitante anônimo é necessário para ligar visita → lead. Fica explicado no aviso de cookies e na política.

### 5.5 Lead, CRM e "fechou ou não fechou"
- O funil já existe (Master → Comercial). Cada etapa vira um **sinal** para as plataformas:

| Etapa no nosso CRM | Evento para a Meta | Conversão no Google Ads | Valor |
|---|---|---|---|
| Clicou no WhatsApp | `Contact` (só navegador) | "Contato WhatsApp" (secundária) | sem valor |
| Deixou nome e contato (`brand_leads`) | `Lead` | "Lead" | sem valor ou valor simbólico |
| **Conta criada** (loja criada, teste começou) | `StartTrial` (ou `CompleteRegistration`) | "Conta criada" | sem valor |
| **Ativando** (loja no ar com produto) | evento personalizado `LojaNoAr` | "Loja no ar" (secundária) | sem valor |
| **Pagante** (primeiro pagamento conferido no Mercado Pago) | `Subscribe` com valor | "Pagante" com valor | valor do plano (centavos ÷ 100), vindo de `getPriceBook`/catálogo, nunca fixo |
| Serviço vendido (Loja Pronta, tema, migração) | `Purchase` com valor | "Compra de serviço" | valor pago |
| **Perdido** | não envia evento de compra; entra na lista de **exclusão** opcional | não envia | — |

- **Mesmo identificador** (`event_id`) no navegador e no servidor, como já é feito na loja (D187): a Meta junta e não conta duas vezes.
- **Quem envia:** uma **fila de envio** (tabela) alimentada pelos eventos internos (`emitEvent`) quando a etapa muda; uma rotina manda, tenta de novo se falhar e guarda o resultado (enviado, falhou, ignorado). Idempotência por `dedupeKey` (regra do projeto).
- **Pagamento só conta depois de conferido na API do Mercado Pago** (regra do projeto). Nunca mandar "Pagante" por um aviso de "já fiz o Pix".
- **Dados pessoais vão só resumidos em código** (SHA-256 de e-mail e telefone normalizados), como a Meta e o Google exigem. Nunca abertos, nunca em log.
- **Botão no CRM:** "Fechou" e "Perdeu (motivo)" para o que é vendido à mão (contrato, Loja Pronta, executivo de rua). Fechou com contrato → o valor vem do contrato.

**Por que isso baixa o custo:** com poucas vendas por semana, a Meta e o Google ainda não conseguem otimizar direto para "pagante" (elas precisam de volume: a Meta fala em cerca de 50 resultados por semana por conjunto para sair do aprendizado [plataforma]). Então: **otimizar para "Conta criada" no começo**, mas **mandar "Pagante" com valor sempre**. Com o tempo, a plataforma aprende que tipo de conta paga e o público melhora. Quando houver volume, trocar a otimização para o evento mais fundo.

### 5.6 Públicos semelhantes e exclusão
- Lista de **lojistas pagantes** (e-mail e telefone em código) enviada como público personalizado para a Meta e como **Customer Match** para o Google, atualizada por rotina diária.
- Usos: **semelhante de pagantes** (a Meta acha gente parecida) e **exclusão** (não mostrar anúncio de "teste grátis" para quem já é cliente).
- Requisito LGPD: a política de privacidade e os termos precisam dizer que usamos esses dados, em código, para anúncio. Listas pequenas (menos de cerca de 100 pessoas) não funcionam bem; até lá, use o **público de quem visitou o site** e de **quem engajou no Instagram**.

### 5.7 Painel de campanhas (estilo Reportei, mas até o dinheiro)
- Rotina a cada hora (gasto do dia) e de madrugada (dia anterior fechado) lê da **API de Marketing da Meta** (insights) e da **API do Google Ads** (relatório por campanha) e grava por dia, campanha, conjunto e anúncio.
- **Master → Tráfego → Campanhas** mostra, por período e com comparação ao anterior:
  - Gasto, impressões, cliques, custo por clique (o que a plataforma diz);
  - **Leads, contas, pagantes e receita contados pelo nosso CRM** (a verdade);
  - **Custo por lead, custo por conta, custo por pagante (CAC) e retorno (receita ÷ gasto)**;
  - A diferença entre o que a Meta diz e o que nós contamos (a Meta costuma contar a mais; mostrar os dois sem esconder).
- **Orgânico lado a lado:** Search Console (palavras que trazem visita no Google), Instagram (alcance, plays, salvamentos, compartilhamentos, cliques no link da bio), e o nosso coletor (visitas, leads e pagantes de cada canal orgânico).
- **Relatório semanal automático por e-mail** para o dono (Resend já existe), com texto de análise da IA do Master ("o que melhorou, o que piorou, o que fazer").
- **Anotações na linha do tempo** ("subi criativo novo", "mudei oferta") para explicar os picos.
- Valores em **centavos** no banco (regra do projeto). Atenção: o gasto que a Meta mostra pode não incluir impostos cobrados na fatura brasileira; mostrar "gasto informado pela plataforma" e permitir lançar o custo real do mês.

### 5.8 Gestão de campanhas com trava
- Do Master: **pausar/ligar** campanha ou anúncio e **mudar orçamento diário**, sempre com confirmação e registro de quem fez (auditoria).
- **Alertas** (e-mail e painel): "gastou R$ X hoje sem nenhum lead", "custo por conta subiu 50% em 3 dias", "anúncio reprovado", "token vai vencer", "evento do Pixel parou de chegar".
- **Sugestões da IA** com o porquê ("o anúncio A trouxe 4 pagantes por R$ 300; o B, nenhum por R$ 280: sugiro pausar o B"). A IA **sugere**; a pessoa aprova. Nada de piloto automático gastando dinheiro.
- Permissão: só `NEXTLEVEL_MASTER` e a função de marketing do Master (`requireRole`/`requireMasterFn`).

### 5.9 Orgânico: preparar o site
- **Página de entrada por campanha** (mesma mensagem do anúncio, uma ação só, carrega rápido no celular). Página lenta joga dinheiro fora: medir com a skill `desempenho` antes de subir anúncio.
- **SEO**: o sitemap já existe; ligar o **Search Console** do domínio novo (`nextlevelcommerce.com.br`), pedir indexação, títulos e descrições por página, dados estruturados (organização, produto/serviço, perguntas frequentes), páginas por intenção ("loja virtual para quem vende no Instagram", "alternativa à Nuvemshop", "loja virtual de moda"). Detalhes e IA: `docs/prompts/busca-e-ia-visibilidade-organica.md`.
- **Prova social**: `/clientes` e `/temas-nuvemshop` já existem; usar nos anúncios e nas páginas de entrada.
- **Botão de WhatsApp rastreado** (ver 5.11).

### 5.10 Instagram e Reels automáticos
**O que a API oficial do Instagram permite [plataforma]** (conta profissional, empresa ou criador, conectada pelo login do Instagram ou pela página do Facebook):
- **Publicar Reels** agendados: o sistema sobe o vídeo (endereço público do arquivo), a legenda, a capa, se aparece também no feed; espera o Instagram processar e publica. Há um limite de publicações por dia pela API (hoje na casa de 50 em 24 h; confira).
- **Ler métricas** de cada Reel e da conta: alcance, reproduções, curtidas, comentários, salvamentos, compartilhamentos, visitas ao perfil, cliques no link.
- **Comentários**: ler, responder, esconder.
- **Direct a partir do comentário** ("resposta privada"): quem comentar a palavra-chave recebe **uma** mensagem no direct com o link rastreado. Depois disso, a conversa só continua se a pessoa responder (janela de 24 h) [plataforma]. É o funil "comente LOJA".
- **Mensagens do direct** num lugar só (pode cair na central de conversas do Master que já existe).

**O que a API não faz [plataforma]:** música em alta da biblioteca do Instagram (só o áudio do próprio vídeo), figurinhas, enquete, adesivo de link nos stories, editar o vídeo. **Link na legenda do Reels não é clicável**: por isso o caminho é bio com link rastreado + "comente PALAVRA".

**Como fica no Master → Tráfego → Conteúdo:**
- Calendário de Reels: subir vídeo, legenda (a IA sugere três versões a partir do roteiro, sem promessa de ganho), capa, palavra-chave, link rastreado de destino, data e hora.
- Fila: agendado → publicando → publicado (ou falhou, com o motivo em português).
- Resultado por Reel: números do Instagram **mais** o que veio para o site e o CRM pelo link daquele Reel (visitas, leads, contas, pagantes). É isso que diz que tipo de vídeo vende, não só o que viraliza.
- Automação de palavra-chave: "LOJA" → mensagem X com link `/l/reel-123`; "TEMA" → mensagem Y.
- **Produção do vídeo**: a IA ajuda com roteiro, gancho dos 3 primeiros segundos, legenda e chamada; a gravação é de gente (dono, equipe, clientes). Vídeo 100% gerado por IA pode ser testado depois, com revisão humana, sem enganar o público.
- **Depois** (mesma estrutura): TikTok (API de publicação de conteúdo) e Shorts do YouTube.

**Requisitos [plataforma]:** aplicativo na Meta para Desenvolvedores com as permissões de publicação, comentários e mensagens do Instagram, **revisão do aplicativo** pela Meta (pede vídeo mostrando o uso) e verificação da empresa. Prazo: dias a semanas. Comece o pedido cedo.

### 5.11 WhatsApp: onde o brasileiro fecha
- **Botão de WhatsApp do site** abre a conversa com uma mensagem pronta que leva um **código curto da visita** ("Oi, quero saber da loja virtual (código K7Q2)"). A equipe (ou a IA) cola o código no CRM e o lead herda a origem completa. Com a API oficial do WhatsApp (I-19), isso fica automático.
- **Anúncio que abre o WhatsApp** (clique para conversar): com a API oficial, a Meta manda junto o identificador do clique do anúncio; dá para devolver "virou pagante" também para esse tipo de anúncio [plataforma]. Depende da escolha do provedor da I-19 (`integracoes-aplicativos-fila.md`), que segue pendente com o dono.
- **Velocidade de resposta**: lead do anúncio respondido em até 5 minutos fecha muito mais. Alerta no painel para lead novo sem contato.

---

## Parte 6. Privacidade e LGPD (sem isso, não liga anúncio)

- **Aviso de cookies** no site público com "Aceitar todos" e "Só os necessários" (e "Escolher"), registrado com data e versão. **Pixel da Meta e tag do Google só carregam depois do "aceitar"**; no Google, usar o **modo de consentimento** (sinais de consentimento para anúncio e medição).
- **Medição própria anônima** (visitante anônimo, sem IP guardado) como medição de funcionamento do site, explicada na política, com opção de recusar. **Validar com advogado** se ela fica como necessária/legítimo interesse ou sob consentimento.
- **Formulário de lead**: frase clara de que os dados servem para contato e para medir os anúncios (em código), com link da política.
- **Política de privacidade** (`/privacidade` e a do grupo, `legal-grupo.tsx`) ganha: quais ferramentas (Meta, Google), para quê, por quanto tempo, como pedir exclusão.
- **Exclusão**: pedido de exclusão do titular apaga o lead e para os envios; a fila de envio respeita isso.
- **Segredos**: tokens da Meta, Google e Instagram só criptografados (`encryptSecret`), nunca em tela, log ou e-mail (regra do projeto).
- **Sem promessa de ganho** nos anúncios e nas mensagens automáticas (regra do projeto e também política da Meta: anúncio de "renda extra" e "ganhe dinheiro" é reprovado).

---

## Parte 7. O que você não mencionou, mas é importante

1. **Medição no próprio site da NextLevel** (hoje só as lojas dos lojistas têm Pixel). Sem isso, anúncio não mede nada.
2. **Aviso de cookies e política atualizada** (Parte 6). É requisito legal e das plataformas.
3. **Verificação do domínio novo na Meta** (`nextlevelcommerce.com.br`) e **verificação da empresa** no Gerenciador de Negócios (CNPJ 51.392.006/0001-92). Sem elas, a revisão do aplicativo e parte dos eventos travam.
4. **Pedidos que demoram, para fazer já**: token de desenvolvedor do Google Ads (acesso básico) e revisão do aplicativo da Meta (Instagram e anúncios). São semanas; o código pode ficar pronto antes da aprovação.
5. **Teste do encanamento antes de gastar**: 3 dias com R$ 20/dia só para conferir que clique → visita → lead → "fechou" → evento chega na Meta e no Google. Dinheiro de verdade só depois.
6. **Volume x evento**: com poucas vendas, otimizar para "Conta criada" e mandar "Pagante" com valor como aprendizado (5.5).
7. **Página de entrada rápida e com uma ação só** por campanha; velocidade medida.
8. **Velocidade de resposta ao lead** (5 minutos) e roteiro do primeiro contato. Anúncio bom com atendimento lento é dinheiro jogado fora.
9. **WhatsApp perde a origem** se não houver o código da visita (5.11).
10. **Parceiro x anúncio**: a mesma pessoa pode ter clicado num anúncio e usado o código de um parceiro. A comissão segue a regra D90; o painel de tráfego mostra os dois toques, sem mudar comissão.
11. **Canal "IA"** (ChatGPT, Perplexity, Gemini) já traz visita; medir separado.
12. **Bloqueador de anúncio e iPhone** escondem parte do Pixel; por isso o envio pelo servidor (N2).
13. **Clique falso e robôs**: filtrar no coletor e no encurtador; alerta de pico estranho.
14. **Orçamento e caixa**: separar no financeiro do Master a despesa de anúncios por mês para ver o CAC de verdade (incluindo impostos da fatura).
15. **Retenção conta para o retorno real**: um pagante que cancela no 2º mês vale menos. O painel mostra receita dos primeiros 90 dias por canal, não só a primeira mensalidade.
16. **Criativo é o que mais muda o resultado**: plano de produção (3 a 5 peças novas por semana no teste) e biblioteca de criativos com resultado de cada um.
17. **Remarketing**: quem visitou preços ou começou cadastro e não terminou vê anúncio e recebe e-mail (o e-mail de carrinho/abandono já existe nas lojas; reaproveitar o padrão).
18. **Lead Ads (formulário nativo)** costuma ter custo menor e qualidade menor; testar, mas medir até "pagante".
19. **Levar para o lojista** (Fase TR9): o mesmo painel (origem, tempo real, links rastreados, Reels, retorno de vendas) vira recurso dos planos da Commerce. É argumento de venda contra Nuvemshop e Loja Integrada.
20. **Base de conhecimento** (D264): cada fase publicada entra em `docs/conhecimento/BC0-INVENTARIO.md` e nas Novidades da tela Aprender.

---

## Parte 8. O que depende do dono (lista de conferência)

- [ ] Gerenciador de Negócios da Meta da NextLevel com: conta de anúncios, Pixel (conjunto de dados), página do Facebook, Instagram profissional ligado; **verificação da empresa** e **do domínio** `nextlevelcommerce.com.br`.
- [ ] **Usuário do sistema** no Gerenciador de Negócios com acesso ao Pixel e à conta de anúncios; token gerado e colado no Master (o sistema guarda criptografado).
- [ ] Aplicativo na Meta para Desenvolvedores (a equipe cria; o dono aprova a revisão).
- [ ] Conta Google Ads + **conta de administrador (MCC)**; pedido do **token de desenvolvedor** (acesso básico).
- [ ] Search Console com o domínio novo verificado.
- [ ] Decidir o provedor do WhatsApp oficial (I-19), se quiser o anúncio de WhatsApp rastreado de ponta a ponta.
- [ ] Orçamento do teste (sugestão na Parte 10) e quem responde os leads em até 5 minutos.
- [ ] Revisão jurídica do aviso de cookies e da política de privacidade.
- [ ] Vídeos para os primeiros Reels e anúncios (roteiros a IA ajuda a escrever).

---

## Parte 9. Custos e prazos (estimativa)

- **Desenvolvimento**: 9 fases (Parte 11). As fases TR1 a TR5 (o essencial para anunciar com retorno de vendas) cabem em 3 a 5 rodadas de trabalho. **[hipótese]**
- **APIs da Meta e do Google**: sem custo de uso. O custo é o anúncio.
- **Banco**: o coletor gera algumas tabelas leves; com resumo diário e limpeza de 90 dias, o Neon continua no plano atual. **[hipótese]**
- **Render**: nenhuma montagem extra; as rotinas usam o mesmo padrão de `/api/cron/*`. Juntar fases num push (regra `docs/infra/RENDER-USO.md`).
- **Prazos que não dependem de nós**: revisão do aplicativo da Meta e token do Google Ads (dias a semanas).

---

## Parte 10. Campanha de teste (rodar depois de TR1 a TR5 publicadas)

### 10.1 Objetivo
Provar, com pouco dinheiro, **qual canal e qual mensagem trazem lojista que paga**, e provar que o sistema mede tudo de ponta a ponta. Nome interno: **TESTE-01 "Sua loja no ar"**.

### 10.2 Oferta (conferir a ativa antes de subir)
A oferta de entrada vem de Master → Financeiro → Ofertas (hoje no catálogo: **3 dias grátis para montar a loja e taxa zero da plataforma por 3 meses**, uma vez por CPF/CNPJ [fato, `catalog-seed.ts`]). Planos: Start R$ 149, Pro R$ 249, Scale R$ 499 [fato, catálogo; conferir no Master no dia]. **Nunca escrever preço fixo no anúncio sem conferir.**

### 10.3 Público (quem queremos)
Quem **já vende pelo Instagram e WhatsApp** e quer loja própria (moda feminina, fitness, infantil, semijoia, camisa de time), 22 a 50 anos, Brasil. Persona detalhada: `docs/prompts/publico-personas-precos-ecossistema.md`.

### 10.4 Etapa 0: teste do encanamento (3 dias, cerca de R$ 60)
- 1 campanha na Meta, R$ 20/dia, 1 anúncio, objetivo cadastro no site.
- Conferir, com 2 pessoas da equipe clicando de verdade: a visita aparece em "Agora no site" como `meta-pago`; o lead chega no CRM com `fbclid`, campanha e peça; marcar "fechou" num lead de teste e ver o evento no **Gerenciador de Eventos → Testar eventos** (com `test_event_code`); no Google, ver a conversão importada no diagnóstico.
- **Critério para seguir**: 95% ou mais dos leads com canal e campanha preenchidos; eventos chegando sem duplicar.

### 10.5 Etapa 1: teste de verdade (14 dias)
**Meta, R$ 60/dia (cerca de R$ 840)** [hipótese de orçamento]
- **Campanha `2026-12-cadastro-teste3dias`**, objetivo **Leads/Cadastro no site**, otimizando para **Conta criada** (`StartTrial`); orçamento da campanha (CBO).
  - Conjunto `amplo`: Brasil, 22–50, público Advantage+ sem interesses (a Meta acha).
  - Conjunto `interesse-vendedor`: interesses em empreendedorismo, pequenas empresas, Instagram para negócios, moda/varejo.
  - A partir do dia 8, se houver visitas suficientes: conjunto `remarketing` (visitou preços ou começou cadastro nos últimos 30 dias) com R$ 10/dia à parte.
  - **Excluir** pagantes (lista de clientes).
- **Criativos (5 peças, 9:16 e 4:5)**:
  1. `video-dor-direct-v1`: "Você responde 50 pessoas no direct e vende para 3? Sua loja atende sozinha enquanto você dorme." (mostra o celular, a loja, o Pix caindo; sem prometer ganho).
  2. `video-demo-3dias-v1`: tela gravada criando a loja e escolhendo tema.
  3. `video-cliente-v1`: depoimento ou bastidor de loja feita pela equipe (só com autorização; sem dizer que roda na plataforma se não roda, regra D283).
  4. `carrossel-temas-v1`: 5 temas, "escolha o seu e teste 3 dias".
  5. `imagem-comparativo-v1`: o que vem incluso (frete, Pix, cartão, domínio), sem atacar concorrente pelo nome.
- **Link**: página de entrada da campanha com UTM dinâmico da Meta.

**Click-to-WhatsApp, R$ 20/dia (cerca de R$ 280)**, só se a I-19 estiver ligada; senão, botão de WhatsApp com código da visita na página de entrada.

**Google Search, R$ 30/dia (cerca de R$ 420)**
- Campanha `2026-12-busca-lojavirtual`, otimizando para "Conta criada".
- Grupos: `criar-loja-virtual` ("criar loja virtual", "como montar loja virtual"), `plataforma` ("plataforma de loja virtual", "plataforma de e-commerce"), `instagram` ("loja virtual para instagram", "vender pelo instagram site").
- Negativas: grátis para sempre, curso, emprego, vaga, download, apk, modelo pronto grátis.
- Nome de concorrente como palavra-chave: só em grupo separado e com anúncio neutro; avaliar depois.

**Orgânico (mesmo período, custo zero)**
- **6 Reels** (3 por semana): 2 de dor, 2 de demonstração, 1 de bastidor, 1 de resposta a pergunta comum. Cada um com "comente LOJA" → direct automático com link `/l/reel-<n>`.
- Bio com link rastreado `/l/bio`. Stories com link `/l/story-<data>`.
- Parceiros (programa D90) com seus links `ref`, para comparação.

### 10.6 Tabela de links (exemplos)
| Peça | Link |
|---|---|
| Anúncio Meta | página de entrada `?utm_source=meta&utm_medium=pago&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}` |
| Google | marcação automática (`gclid`) + modelo `{lpurl}?utm_source=google&utm_medium=pago&utm_campaign={campaignid}&utm_term={keyword}` |
| Bio do Instagram | `/l/bio` → `utm_source=instagram&utm_medium=bio&utm_campaign=2026-12-organico` |
| Reel 1 (direct) | `/l/reel-1` → `utm_source=instagram&utm_medium=reels&utm_content=reel-1-dor-direct` |
| WhatsApp de status | `/l/wa-status` → `utm_source=whatsapp&utm_medium=organico` |

### 10.7 O que medir e quando decidir
| Indicador | Onde | Meta inicial [hipótese] |
|---|---|---|
| Custo por clique | Plataforma | referência apenas |
| Custo por lead | Nosso CRM | até R$ 25 |
| Custo por **conta criada** | Nosso CRM | até R$ 60 |
| % conta → loja no ar | Nosso CRM | 40% ou mais |
| Custo por **pagante** (CAC) | Nosso CRM | até 2 mensalidades do plano Start (cerca de R$ 300) |
| Tempo até o primeiro contato | CRM | até 5 min no horário comercial |
| Leads com origem completa | Painel | 95% ou mais |

- **Dia 3**: corta peças sem clique e sem lead (frequência alta, custo por clique 3x a média).
- **Dia 7**: pausa conjuntos sem nenhuma conta criada com gasto acima de 3x a meta por conta; põe 2 peças novas no lugar.
- **Dia 14**: relatório (gerado pelo painel) comparando canais **até pagante**; decide onde pôr o orçamento do mês seguinte; registra a decisão em `DECISIONS.md`.
- **Dia 30 e 60**: rever quem continuou pagando (CAC real com cancelamentos).

---

## Parte 11. Fases de desenvolvimento

| Fase | Entrega | Dono precisa |
|---|---|---|
| **TR0** ✅ D290 | Diagnóstico curto, decisão registrada (D-número), aviso de cookies e política (texto para revisão) | Aprovar textos (revisão jurídica pendente) |
| **TR1** ✅ D290 | Encurtador `/l/`, padrão de nomes validado, cliques; proxy guarda `fbclid/gclid/gbraid/wbraid/ttclid`, primeiro toque e página de entrada; função única de canal | — |
| **TR2** ✅ D291 | Coletor próprio (sessões e eventos), **Agora no site** em tempo real, origens por canal, limpeza e resumo diário | — |
| **TR3** ✅ D294 | Lead com origem completa; CRM mostra canal, campanha e peça; botões "Fechou/Perdeu (motivo)"; código da visita no botão de WhatsApp | — |
| **TR4** ✅ D295 | Pixel da Meta e tag do Google no site público da NextLevel, só com consentimento; eventos de navegador (`PageView`, `Contact`, `Lead`, `StartTrial`) com `event_id` | IDs do Pixel e do Google Ads |
| **TR5** | Fila de envio: API de conversões da Meta e importação de conversões/conversões avançadas do Google por etapa do funil; públicos (pagantes para semelhante e exclusão) | Token do usuário do sistema; token de desenvolvedor do Google |
| **TR6** | Leitura de campanhas (Meta, Google, Search Console); painel **Campanhas** com CAC e retorno reais; relatório semanal por e-mail com análise da IA; anotações | — |
| **TR7** | Instagram: conexão, calendário e publicação automática de Reels, métricas, palavra-chave → direct com link rastreado | Revisão do aplicativo aprovada |
| **TR8** | Gestão com trava (pausar, ligar, orçamento), alertas, sugestões da IA; Lead Ads nativo no CRM; anúncio de WhatsApp rastreado (se I-19) | Provedor do WhatsApp |
| **TR9** | Levar para o lojista como recurso de plano (mesmo motor, por loja) | Decidir em qual plano entra |

---

## Parte 12. Prompt mestre (colar numa sessão de trabalho)

```
FUNÇÃO
Você é engenheiro full-stack sênior e especialista em mensuração de marketing (atribuição, API de conversões da Meta, Google Ads API, GA4/Search Console, Instagram API) do sistema NextLevel (Next.js 16 App Router, React 19, TypeScript estrito, Drizzle, PGlite/Neon, Zod, Vitest, Playwright, Render). O dono, Mauricio, não é técnico: fale com ele em português claro, sem jargão. Código, nomes de arquivos e commits em português, como o projeto já faz.

OBJETIVO
Construir no Master da NextLevel Commerce a camada de TRÁFEGO E CAMPANHAS: saber de onde vem cada visita e cada lead (Meta pago, Google pago, orgânico do Instagram, busca do Google, IA, WhatsApp, indicação, direto), ver o tráfego do site em tempo real, rastrear todos os links, devolver para a Meta e o Google quem virou conta e quem virou pagante (com valor), montar públicos de clientes, ler gasto e resultado das campanhas para mostrar custo por cliente REAL (estilo Reportei, mas até o dinheiro), gerir campanhas com trava, e agendar/publicar Reels com resposta automática no direct. Cada fase entrega valor sozinha.

LEITURA OBRIGATÓRIA (nesta ordem)
AGENTS.md; CLAUDE.md; docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md (dados, permissões, fronteiras); docs/prompts/trafego-campanhas-meta-google-reels.md (este documento inteiro: Partes 3, 4, 5, 6 e 11 são o contrato); docs/design/DECISIONS.md (D90 atribuição e parceiros, D185 visitas sem cookie nas lojas, D187 Pixel/CAPI da loja, D189 integrações por ID, D264 base de conhecimento, D280 janela de saída, D283 clientes, D287 domínios); docs/prompts/integracoes-aplicativos-fila.md (I-19 WhatsApp); docs/prompts/busca-e-ia-visibilidade-organica.md; docs/infra/RENDER-USO.md. Documentação do Next.js em node_modules/next/dist/docs/ antes de mexer em proxy, rotas ou cookies.

CÓDIGO QUE JÁ EXISTE (estenda, não duplique)
- src/proxy.ts: attributionFrom / withAttribution (cookies nl-attr e nl-ref, último toque não direto, 30 dias).
- src/lib/attribution.ts: currentAttribution / withAttribution (leva origem entre domínios).
- src/lib/domain/visitas.ts: ehRobo, aparelhoDe, origemDe, diaDeBrasilia (classificação de origem e robôs).
- src/lib/domain/brand-leads.ts e corporate-sales.ts: gravam brand_leads.attribution.
- src/lib/domain/comercial.ts: ETAPAS do funil (contato, conta, ativando, vendendo, pagante, risco, perdido), funilComercial, fichaCliente, salvarAcompanhamento; tabela crm_acompanhamento.
- src/lib/payments/meta-capi.ts: envio de Purchase pela API de conversões da Meta (padrão de event_id, SHA-256, timeoutSignal, nunca lança).
- src/components/storefront/pixel-meta.tsx e integracoes-loja.tsx: padrão do Pixel e das tags (lojas dos lojistas).
- Eventos internos (emitEvent), runAction, requireRole/requireMasterFn, encryptSecret/decryptSecret, platform_settings, getPriceBook/catálogo, rotas /api/cron/*, e-mail (src/lib/email.ts), IA do Master (getIaConfig).
- Master → Crescimento (src/app/master/crescimento/page.tsx) e Master → Comercial/CRM: o novo item "Tráfego e campanhas" entra em Crescimento e o CRM ganha a origem.

REGRAS INEGOCIÁVEIS
- Constituição > DECISIONS.md > documentos > tarefa. Conflito: explique, registre, nunca quebre em silêncio.
- Toda ação passa pelo domínio (src/lib/domain/*) e por runAction; permissões no servidor; um tenant nunca lê dado de outro (o painel de tráfego da NextLevel é só do Master; quando for para o lojista, filtra por loja).
- Página que consulta o banco declara export const dynamic = "force-dynamic".
- Valores em centavos; datas ISO; textos em português claro; sem promessa de ganho (inclusive em legendas e mensagens automáticas geradas pela IA).
- Tokens da Meta, Google e Instagram só com encryptSecret; nunca em tela, log, e-mail ou mensagem de erro. Na tela: só "conectado / desconectado / vence em X dias".
- Dado pessoal para plataformas só em SHA-256 normalizado (e-mail minúsculo sem espaços; telefone com DDI 55, só dígitos). Nunca em log.
- Pagante só depois de pagamento conferido na API do Mercado Pago (corpo de webhook nunca é confiável); "Já fiz o Pix" não conta.
- Idempotência por dedupeKey em toda fila de envio; o mesmo event_id no navegador e no servidor.
- Pixel e tags de anúncio só carregam com consentimento (aviso de cookies); modo de consentimento do Google ligado. Pedido de exclusão do titular para os envios.
- Regra de negócio configurável (preço do plano, valor enviado, janelas, metas de CPL/CAC, palavras-chave do Instagram) vem de platform_settings ou do catálogo, nunca fixa no código.
- A comissão de parceiro (D90) NÃO muda: o painel mostra os toques; quem ganha comissão continua pela regra existente.
- Nada de piloto automático gastando dinheiro: pausar/ligar/orçamento sempre com confirmação humana e registro de auditoria.
- A marca vem de getBrand(); um painel Master só, com filtro de marca (regra anti-duplicação).
- Acessibilidade AA, sem rolagem horizontal em 360 px; axe sem violações graves.
- Alterou src/db/schema.ts: npx drizzle-kit generate --name <assunto> e commite drizzle/. Nunca edite migração publicada.
- Mudança de comportamento sem teste não entra. Testes enxutos durante o trabalho; bateria completa e npm run build no fim da rodada.
- Render: junte código e docs num push; commit só de docs leva [skip render]; até 3 publicações de código por dia.
- Não criar PR sem pedido; trabalhar na branch designada; nunca force push.
- Cada etapa entregue: print real (Playwright) da principal tela para o dono.
- Cada decisão nova vira D-número em DECISIONS.md com [E-commerce] no título, citada em docs/conhecimento/BC0-INVENTARIO.md (teste tests/base-conhecimento.test.ts), e rode node scripts/gerar-novidades.mjs.
- Confira na documentação oficial do dia (Meta for Developers, Google Ads API, Instagram Platform) versões de API, nomes de campos, permissões e limites antes de codar: elas mudam. Versão da Graph API numa constante só (hoje meta-capi.ts usa v19.0; avalie atualizar junto).

MODELO DE DADOS PROPOSTO (ajuste ao que achar no schema; reaproveite antes de criar)
- links_rastreados: codigo (único, curto), destino (caminho ou URL da própria marca; nunca domínio externo arbitrário: evita redirecionamento aberto), brand, utm_source/medium/campaign/content/term, canal, criado_por, ativo, created_at. Cliques: contagem diária em links_cliques_diarios (codigo, dia, cliques, robos) sem IP.
- trafego_sessoes: id, visitante_id (anônimo, cookie próprio 1º parte, 13 meses), brand, host, iniciada_em, ultimo_sinal_em, pagina_entrada, referrer_host, canal, utm_* (saneados), click_ids jsonb {fbclid,gclid,gbraid,wbraid,ttclid}, aparelho, consentimento (NECESSARIOS | TODOS), paginas, lead_id null, codigo_visita (curto, para o WhatsApp). Sem IP, sem nome.
- trafego_eventos: id, sessao_id, tipo (PAGE_VIEW | CLIQUE_WHATSAPP | CTA | INICIO_CADASTRO | LEAD | CONTA_CRIADA), caminho, event_id, criado_em. Limpeza: detalhe 90 dias; resumo em trafego_diario (dia, brand, canal, campanha, pagina, aparelho, visitas, sessoes, leads, contas) por 13 meses.
- Lead: estender brand_leads.attribution (ou coluna nova) com primeiro_toque, ultimo_toque, click_ids, sessao_id, codigo_visita; e o funil já existente. Motivo de perda no crm_acompanhamento.
- conversoes_envio (fila): id, plataforma (META | GOOGLE), evento, referencia (lead/loja/assinatura/pedido), event_id, valor_cents, moeda, dedupe_key (único), status (PENDENTE | ENVIADO | FALHOU | IGNORADO | BLOQUEADO_LGPD), tentativas, proxima_tentativa_em, resposta_resumo (sem dado pessoal), criado_em, enviado_em.
- ads_conexoes em platform_settings ou tabela própria: plataforma, conta (act_..., customer id, ig user id), token_enc, expira_em, status, escopo.
- ads_metricas_diarias: plataforma, conta, campanha_id/nome, conjunto_id/nome, anuncio_id/nome, dia, gasto_cents, impressoes, alcance, cliques, resultados_plataforma; único por (plataforma, anuncio_id, dia).
- ads_acoes (auditoria): quem, quando, plataforma, objeto, acao (PAUSAR | LIGAR | ORCAMENTO), antes, depois, resultado.
- ig_publicacoes: video (arquivo no nosso armazenamento com URL pública temporária), legenda, capa, palavra_chave, link_codigo, agendado_para, status (RASCUNHO | AGENDADO | PUBLICANDO | PUBLICADO | FALHOU), media_id, permalink, erro, métricas (jsonb, atualizadas por rotina). ig_automacoes: palavra_chave → mensagem + link_codigo, ativo. ig_respostas: comentario_id (único, idempotência), quando, resultado.

FASES (uma por rodada; cada uma fecha com testes, print e relatório "o que foi / o que NÃO foi verificado")
TR0 Diagnóstico e base legal
 - Relatório curto: confira cada [fato] da Parte 3 do documento; liste lacunas novas. Pergunte ao dono (não presuma) o que estiver na Parte 8.
 - Aviso de cookies (Aceitar todos / Só necessários / Escolher), com registro de versão; textos de política e do formulário para revisão jurídica. Registre a decisão (D-número).
TR1 Links e origem
 - Encurtador /l/<codigo> (rota que redireciona com 302, conta clique, ignora robô, só destinos da própria marca). Tela Master → Tráfego → Links: criar, copiar, QR code, cliques por dia, validação do padrão de nomes (Parte 5.1).
 - Proxy: guardar fbclid, gclid, gbraid, wbraid, ttclid, página de entrada; cookie de primeiro toque (90 dias, nunca sobrescreve) além do último toque (D90); montar _fbc no formato da Meta. Sanitizar e limitar tamanho (como já é feito).
 - Função única canalDe(...) estendendo origemDe (tabela da Parte 5.3), com testes de tabela para cada linha.
TR2 Tempo real
 - Coletor: rota /api/t (POST, sendBeacon), sinal ao abrir e a cada 30 s com aba visível; visitante anônimo; robôs fora; limite por visitante (anti-abuso); nada de IP gravado.
 - Master → Tráfego → Agora (atualiza a cada 10 s): pessoas nos últimos 5 min por canal, página e aparelho; lista de entradas e marcos (WhatsApp, início de cadastro, lead). Master → Tráfego → Origens: visitas, leads, contas e pagantes por canal e campanha, por período, com comparação.
 - Rotina diária de resumo e limpeza.
TR3 Lead até o fechamento
 - Ao criar lead (brand_leads, janela de saída D280, diagnóstico, cadastro de loja), copiar primeiro/último toque, click_ids, sessão e código da visita. Conferir que o cadastro de loja (etapa "conta") também herda a origem.
 - CRM (Master → Comercial): mostrar canal, campanha e peça; filtro por canal; botões "Fechou" (valor do contrato/plano) e "Perdeu" (motivo de lista configurável); campo para colar o código da visita vindo do WhatsApp.
 - Botão de WhatsApp do site com mensagem pronta contendo o código da visita.
TR4 Pixel e tags no site da NextLevel
 - Pixel da Meta e tag do Google (gtag ou GTM) nas páginas públicas das marcas, IDs em platform_settings, carregando só com consentimento; eventos PageView, Contact, Lead, StartTrial com event_id igual ao do servidor. Reaproveite o padrão de pixel-meta.tsx.
TR5 Retorno para as plataformas
 - Fila conversoes_envio alimentada por emitEvent quando a etapa muda (Parte 5.5: tabela etapa → evento → valor). Rotina /api/cron/conversoes (a cada 15 min): Meta = API de conversões (user_data com em/ph em SHA-256, fbc, fbp, client_user_agent quando houver; action_source adequado; event_id); Google = upload de conversões por clique (gclid/gbraid/wbraid) e conversões avançadas para leads (e-mail/telefone em SHA-256), com a data/hora da conversão e valor. Respeite janelas de envio documentadas; fora da janela = IGNORADO com motivo.
 - Refatore meta-capi.ts para usar um cliente comum (sem quebrar a compra da loja, D187; teste de regressão).
 - Públicos: rotina diária enviando pagantes (SHA-256) para público personalizado da Meta e Customer Match do Google; exclusão de pagantes nas campanhas de aquisição.
 - Tela Master → Tráfego → Retorno: o que foi enviado, falhou, ignorado, por quê; botão "reenviar".
 - Modo de teste: test_event_code da Meta configurável para a etapa 0 da campanha de teste.
TR6 Campanhas (estilo Reportei, até o dinheiro)
 - Conexões (Master → Tráfego → Conexões): Meta (token do usuário do sistema, conta de anúncios), Google Ads (OAuth + MCC + token de desenvolvedor), Search Console, Instagram. Status e vencimento, nunca o valor.
 - Rotinas: horária (gasto de hoje) e diária (dia anterior fechado) para ads_metricas_diarias. Search Console diário (consultas, páginas, cliques, posição).
 - Painel Campanhas: período e comparação; gasto, cliques, CPC (plataforma) lado a lado com leads, contas, pagantes e receita (nosso CRM); custo por lead, por conta, por pagante (CAC) e retorno; receita dos primeiros 90 dias por canal; diferença plataforma x CRM sem esconder; gráfico por dia (use a skill dataviz); anotações na linha do tempo; lançamento do custo real do mês.
 - Relatório semanal por e-mail para o dono, com análise escrita pela IA do Master (sem inventar número: só o que está no painel).
TR7 Instagram e Reels
 - Conexão da conta profissional; Master → Tráfego → Conteúdo: calendário, upload, legenda (IA sugere 3 versões, sem promessa de ganho), capa, palavra-chave, link rastreado, agendamento; rotina de publicação (criar contêiner REELS, aguardar processamento, publicar, registrar media_id/permalink; erro em português); limite diário respeitado.
 - Webhook de comentários: palavra-chave → resposta privada (uma por comentário, idempotente por comentario_id) com link rastreado; conversas no direct caem na central de conversas existente.
 - Métricas por Reel (rotina diária) + resultado no nosso funil pelo link daquele Reel.
TR8 Gestão com trava e alertas
 - Pausar/ligar campanha/conjunto/anúncio e mudar orçamento diário, com confirmação e ads_acoes. Só NEXTLEVEL_MASTER e função de marketing.
 - Alertas (painel + e-mail): gasto sem lead, CAC subindo, anúncio reprovado, token vencendo, Pixel/CAPI sem eventos, lead sem contato em 5 min.
 - Sugestões da IA com o porquê, sempre para aprovação.
 - Lead Ads nativo: webhook de leadgen → brand_leads com canal meta-pago-formulario. Anúncio de WhatsApp rastreado se a I-19 estiver ligada.
TR9 Para o lojista
 - Mesma camada por loja (filtro por storeId; permissões do lojista), como recurso de plano definido pelo dono. Respeite D185 (lojas sem cookie) ou registre a mudança com consentimento por loja.

TESTES (mínimo por fase)
- Unidade: canalDe (tabela completa), sanitização de UTM e click ids, montagem de _fbc, normalização e SHA-256, mapeamento etapa → evento → valor, dedupe da fila, janela de envio, redirecionamento do encurtador só para destino permitido, idempotência da resposta a comentário.
- Integração: lead criado herda origem; mudança de etapa gera um envio (e só um); pagante só com pagamento conferido; exclusão LGPD bloqueia envios; tenant isolation (lojista não lê nada do Master).
- Clientes HTTP da Meta/Google/Instagram com fetch injetável (como meta-capi.ts) e respostas gravadas; nenhum teste chama a internet.
- e2e (scripts em e2e/): visita com ?utm_*&fbclid → aparece em Agora → vira lead → CRM mostra origem → "Fechou" → item na fila. Varredura de acessibilidade das telas novas (e2e/polish-v8.mjs) em 360, 768 e 1440 px.

FORMA DE ENTREGA DE CADA FASE
1. Plano curto (o que muda, arquivos, riscos) antes de codar.
2. Código + migração + testes; tipos, lint e testes dos arquivos mexidos.
3. No fim da rodada: bateria completa e npm run build; um push só.
4. Print real das telas principais para o dono.
5. Relatório ao dono, em português simples: o que ficou pronto, como usar (passo a passo no Master), o que depende dele, o que NÃO foi verificado (ex.: "envio para a Meta testado com resposta simulada; falta conferir com o token real"), e a linha "Esforço do dia por frente".
6. Decisão em DECISIONS.md, citação na base de conhecimento e Novidades.
```

---

## Parte 13. Riscos e como evitar

| Risco | Como evitar |
|---|---|
| Gastar com anúncio sem medir | Etapa 0 (encanamento) obrigatória antes do teste |
| Contar errado (Meta diz 40 leads, CRM tem 25) | Mostrar os dois; decidir pelo CRM |
| Lead sem origem (WhatsApp, Instagram sem etiqueta) | Código da visita, links rastreados em tudo |
| Problema com LGPD | Aviso de cookies, política, SHA-256, exclusão, revisão jurídica |
| Token vazado | encryptSecret, nunca em tela/log; usuário do sistema com acesso mínimo |
| Aprovação da Meta/Google atrasar | Pedir no começo; o código fica pronto e liga quando aprovar |
| API mudar | Versão numa constante; testes com respostas gravadas; alerta quando o envio falhar |
| Anúncio reprovado por "promessa de ganho" | Regra do projeto já proíbe; a IA revisa a legenda |
| Piloto automático queimar dinheiro | Toda ação de gasto exige aprovação humana |
| Painel pesado no Render/Neon | Resumo diário, limpeza de 90 dias, consulta a cada 10 s só com o painel aberto |
