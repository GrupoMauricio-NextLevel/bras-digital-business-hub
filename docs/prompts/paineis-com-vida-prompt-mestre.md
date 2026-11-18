# Painéis com vida: prompt mestre para evoluir todos os painéis, do Master ao cliente final

> **Pedido do dono (17/11/2026), com uma imagem de referência:** "Quero vida no painel. Quero cores. Quero gráficos. Quero números principais em destaque. Quero imagem de fundo em módulos específicos. Quero efeitos com cores e Motion. O que mais estou esquecendo? Pense como dono do negócio: como o visual poderia aumentar a percepção de valor. Crie um prompt mestre, como o melhor engenheiro, para desenvolver a evolução de todos os níveis de painéis de usuários, do Master até o usuário final. Se for preciso, posso criar um grupo de imagens numa plataforma de geração de imagens."
>
> - **Referência do dono:** `docs/melhorias/prints/2026-11-17-referencia-painel-com-vida.jpg` (painel escuro "NextLevel Commerce OS"; é uma imagem conceitual, não uma tela nossa).
> - **Ponto de partida (capturas de hoje, demonstração local):** `docs/design/capturas/paineis-com-vida/` (diagnóstico no Apêndice 3).
> - **Decisão:** D331 (a direção fica registrada; as fases dependem das respostas da seção A6).
> - **Imagens:** o pedido pronto para o gerador de imagens está em `docs/prompts/imagens-paineis-com-vida-gpt.md`.
> - **Como usar:** peça "desenvolver o prompt paineis-com-vida, fase PV1" (skill `desenvolver-prompt`) ou cole a **Parte B** numa sessão nova. Uma fase por vez, com print ao dono no fim de cada uma.
> - **Relação com a reorganização dos menus** (`reorganizacao-paineis-por-persona.md`, D327): aquela proposta decide **onde** cada coisa fica (gavetas); esta decide **como** cada tela ganha vida. Quando as duas tocarem a mesma tela, entram juntas, numa publicação só.

---

## Resumo em uma página (para o dono)

**A ideia central.** Para quem paga mensalidade, o painel é o produto que ele vê todo dia. Cada vez que o lojista abre o "Meu negócio", a tela precisa responder em 5 segundos: *estou ganhando dinheiro? o sistema está trabalhando por mim? estou avançando? o que eu faço agora?* Cor, gráfico, imagem e movimento são a embalagem dessas quatro respostas. Sem as respostas, o visual vira enfeite; com elas, o painel vira **o recibo da mensalidade**: cada vez que o cliente entra, ele confirma que vale a pena pagar.

**A fórmula da percepção de valor** (é isto que o visual precisa aumentar):

> valor percebido = resultado que eu vejo + trabalho que vejo a plataforma fazer por mim + progresso rumo a uma meta + sensação de controle e segurança + prazer de usar − esforço e confusão

| O que você pediu | O que aumenta na fórmula | Como vira tela |
|---|---|---|
| Vida | prazer, sensação de movimento | "ao vivo", números que contam, aviso de venda aprovada |
| Cores | leitura rápida, prazer | uma cor fixa por assunto (dinheiro, pedidos, clientes, visitas, crescimento) em todos os painéis |
| Gráficos | resultado, progresso | vendas no tempo, canais reais, produtos campeões, mapa do Brasil, horários de pico |
| Números em destaque | resultado | os números do dia e do mês na primeira tela, sem rolar, grandes |
| Imagem de fundo | prazer, identidade | a capa da própria loja no topo, calendário comercial, conquistas, convite de crescimento |
| Efeitos e Motion | prazer, controle | entrada em degraus, linha que se desenha, brilho do que é novo, comemoração |

**O que você está esquecendo (os 8 mais importantes; a lista completa está na A3):**
1. **A tela da conta nova.** A maioria dos clientes começa com zero venda. O painel com vida precisa ser bonito no zero.
2. **"O que a NextLevel fez por você este mês."** O trabalho invisível (carrinhos lembrados, avisos enviados, visitas atendidas) mostrado em números reais. É o que mais justifica a mensalidade.
3. **Meta do mês e Jornada da loja.** Uma meta com anel de progresso e o "próximo nível" da loja, usando as 5 fases que já existem no sistema (Fundação, Lançamento, Aquisição, Otimização, Escala). O nome da marca vira experiência.
4. **Momentos de vitória.** Primeira venda, 10ª, 100ª, recorde do dia, meta batida: comemoração leve e um cartão pronto para o Instagram (que ainda divulga a NextLevel).
5. **"Venda aprovada!" na hora**, com som opcional, do jeito que o lojista brasileiro já conhece de outras plataformas.
6. **Dinheiro na fila de ação.** "R$ 1.240 em carrinhos para recuperar: mandar lembrete" vale mais que um gráfico bonito.
7. **Celular primeiro.** O pequeno lojista abre o painel no celular; os números principais precisam aparecer sem rolar.
8. **Valor fora do painel.** Resumo da semana por e-mail e relatório do mês em PDF com o mesmo visual.

**O que não vamos copiar da referência (detalhes na A2):** canais que ainda não existem (SuperDrop, Brás, TikTok Shop, Mercado Livre, Shopee, China Hub) mostrados como se vendessem; "99,9% de disponibilidade" sem medição; dois anúncios de upgrade na mesma tela; números de loja grande. No lugar, entram equivalentes verdadeiros: os canais que o sistema já grava em cada pedido, a saúde da loja medida e um convite de plano só quando faz sentido.

**Ordem recomendada:** PV0 (linha de base e suas respostas) → PV1 (kit de cores, gráficos e movimento) → PV2 (números certos e rápidos) → **PV3 ("Meu negócio" do lojista com vida: a vitrine da mudança)** → PV4 (tempo real e vitórias) → PV5 (seu Master) → PV6 a PV10 (parceiro, agência, consumidor final, valor fora do painel, imagens, acabamento). Motivo: regra 60/25/15 e o 10º lojista pagante; o painel do lojista é o que decide se ele fica e paga.

**Atalho para a Black Friday (27/11):** se você quiser o painel do lojista com vida antes da Black, dá para fazer uma **rodada relâmpago** (PV1 enxuto + só a primeira dobra da PV3: números em destaque com cores, gráfico de vendas com frase, uma faixa de aviso por vez) numa publicação só. É quando o lojista mais abre o painel.

---

## Parte A — Racional de dono

### A1. O que a referência acerta (a ideia fica)
- **Os 4 números do topo**, grandes, cada um com cor própria, variação e mini gráfico.
- **Um gráfico principal** com período (7, 30, 90 dias, 1 ano) e a marcação do ponto mais alto.
- **Produtos campeões com foto.** Foto de produto dá vida sem enfeite.
- **Pedidos recentes com etiqueta colorida** de situação e as iniciais do cliente.
- **Ações rápidas** a um clique.
- **Um bloco de "próximo nível"** com imagem (o convite para crescer).
- **Canais de venda em rosca**, com o total no meio.
- **Status da loja** com anel e itens conferidos.
- **Fundo escuro com brilho:** a sensação de tecnologia premium que você quer passar.

### A2. O que a referência faz e nos prejudicaria (não copiar como está)
| Na referência | Problema para a empresa | O que entra no lugar |
|---|---|---|
| Canais "SuperDrop, Brás Digital, TikTok Shop, Mercado Livre, Shopee", com porcentagens | Nenhum deles está ligado à loja do cliente hoje (SuperDrop e Brás em pausa, D216; marketplaces ainda na fila de integrações). Mostrar é prometer o que não existe: gera cobrança no suporte e quebra a confiança. | Os canais que o sistema já grava em cada pedido: **Loja virtual, WhatsApp, Instagram e Venda manual** (`orders.channel`), mais a **origem da visita** (Google, Instagram, anúncio, direto). Marketplaces aparecem só em "Aplicativos", como "em breve", com o botão "Quero quando sair" (mede o interesse real). |
| "Conhecer o China Hub" e "Expanda seus negócios no Brasil e na China" | O China Hub não tem sistema (fica para outra etapa). Anúncio de algo que não existe é clique frustrado. | **Calendário comercial:** imagem da próxima data (Black Friday em X dias, Natal, Dia das Mães) e o botão que cria a campanha ou o cupom. |
| "99,9% de disponibilidade" | Não medimos disponibilidade por loja. Número sem medição é número falso. | **Saúde da loja** com conferências reais: domínio ligado, cadeado (SSL), pagamento conectado, frete configurado, produtos com foto e estoque. A base já existe (`getStoreReadiness`, `healthScore`). |
| Dois anúncios do plano "Pro" na mesma tela (bloco do foguete e cartão no menu) | Anúncio repetido cansa e parece desespero; o cliente aprende a ignorar. | **Um convite por tela, só quando faz sentido:** perto do limite do plano, recurso bloqueado ou volume que pagaria menos no plano de cima (como o "Quanto cada plano custaria para você", que já existe). Some para quem já está no Scale. |
| 24.780 clientes ativos, 3.842 pedidos, conversão de 8,7% | São números de loja grande, e a conversão está alta demais para a realidade; a maioria dos nossos clientes tem dezenas de pedidos. Se a demonstração mostrar isso, a vida real decepciona. | Números sempre do próprio cliente. Na conta nova, "dados de exemplo" só no gráfico, com o selo "Exemplo" (A3, item 1). A taxa de conversão só aparece com pelo menos 100 visitas no período. |
| Texto cinza pequeno sobre azul-escuro; cor como único sinal (verde = subiu) | Difícil de ler em notebook simples e no sol; quem não distingue cores não entende. | Contraste AA medido; seta, sinal (+/−) e palavra, além da cor. |
| Foguete | Visual genérico, de qualquer sistema. | O símbolo nosso: **degraus de luz** subindo (a assinatura de movimento "Subida", D193). "Próximo nível" é o nome da marca; vira imagem e experiência. |
| Nome "Commerce OS" e título "Dashboard" | Não é o nome do produto. | O painel do cliente se chama "Meu negócio" (D324); a primeira tela é a do dia ("Agora" hoje, "Hoje" quando a reorganização R4 for aprovada). |

### A3. O que você está esquecendo (lista completa, por tipo de valor)

**Resultado (o que eu ganhei)**
1. **O número de hoje antes de tudo:** vendas de hoje comparadas com o mesmo dia da semana passada ("terça passada"), não com ontem. Comparação justa, porque segunda não é sábado.
2. **Frase que explica o número:** "Você vendeu 18% a mais que nos 30 dias anteriores, puxado pela Camiseta Premium." Gráfico sem frase é desenho.
3. **Mapa do Brasil das vendas e horários de pico:** "seus clientes compram mais às 20 h de quinta" (hora certa para postar). Os dados já existem na tela de Análise.
4. **Recompra:** quantos clientes voltaram a comprar. É o número que mais diz "minha loja é boa".

**Trabalho que a plataforma faz por mim (o que justifica a mensalidade)**
5. **"O que a NextLevel fez por você este mês":** carrinhos lembrados e recuperados (em R$), avisos de "voltou ao estoque" enviados, e-mails de pedido enviados, conversas respondidas pelo assistente, visitas de robôs de busca e de IA. Só com contagem real; o que ainda não é contado ganha contador na fase PV2.
6. **Saúde da loja** com selos verdes (cadeado, pagamento, domínio, frete): sensação de segurança e de coisa bem cuidada.
7. **Novidades do sistema:** o "O que mudou" já existe; com cartão e imagem, mostra que a plataforma evolui toda semana.
8. **Suporte com rosto:** as fotos reais da equipe (já temos, `equipe-nextlevel-fotos-vida-marcas.md`) no cartão de ajuda. Nunca um rosto inventado por IA como se fosse "o seu gerente".

**Progresso (para onde estou indo)**
9. **Meta do mês** com anel: o lojista escolhe a meta com uma sugestão (mês passado + 10%); o sistema mostra o que aconteceu, nunca promete.
10. **Jornada da loja (o "próximo nível"):** as 5 fases que já existem (`src/lib/domain/journey.ts`) com as ilustrações já feitas, critérios medidos e "faltam 7 vendas para a fase Aquisição".
11. **Primeiros passos** com barra (já existe "Seus primeiros passos"): na conta nova, vira o centro da tela.

**Emoção (o prazer de usar)**
12. **"Venda aprovada!"** na hora, com a "Subida" (o som de 3 notas que já existe, D205) e o número na aba do navegador. Som desligado até o lojista escolher.
13. **Momentos de vitória:** 1ª venda, 10ª, 100ª, R$ 10 mil vendidos, recorde do dia, meta batida, primeira avaliação 5 estrelas. Confete leve uma vez, cartão de conquista e o botão **"Postar no Instagram"** (imagem pronta, com um selo pequeno "feito com NextLevel": divulgação de graça).
14. **A capa da própria loja como fundo do topo** do "Meu negócio": o painel parece dele, não nosso.
15. **"Ao vivo":** ponto verde pulsando, "3 pessoas na sua loja agora" (já medimos visitas), números que se atualizam sozinhos.

**Controle (sem esforço, sem confusão)**
16. **Fila "Faça agora" com dinheiro:** cada pendência mostra quanto vale ("3 pedidos pagos esperando envio: R$ 540").
17. **Uma faixa de aviso por vez** no topo. Hoje são três empilhadas ("Novo", Black Friday e Novidade), e elas empurram os números para fora da tela.
18. **Celular primeiro:** números do dia e do mês sem rolar, barra de atalhos embaixo, botão do assistente que não cobre conteúdo.
19. **Sem tela branca:** esqueleto com brilho enquanto carrega e transição suave entre telas (a base já existe).
20. **Modo escuro e claro de primeira**, letra maior opcional, "menos movimento" respeitado.
21. **Queda sem bronca:** quando o número cai, a tela não fica toda vermelha; mostra a causa provável e uma ação ("vendas caíram 12%; 5 produtos estão sem estoque").

**Valor fora do painel**
22. **Resumo da semana por e-mail**, com os mesmos números e cores (segunda às 8 h).
23. **Relatório do mês em PDF**, bonito (serve também para o cliente da agência mostrar ao chefe).
24. **Cartão de conquista** pronto para Stories e feed.
25. **Modo demonstração do lojista** (como o da agência, D326): o time comercial mostra o painel vivo na hora da venda e nos vídeos. **O painel com vida também vende a NextLevel.**

**Mais tarde, com cuidado**
26. **Comparação com lojas parecidas** ("lojas de moda vendem mais às 20 h"): só com 50 lojas ou mais e grupos de no mínimo 5, sem expor ninguém.
27. **Notificação no celular (push)** com o painel instalado como aplicativo (PWA), que está na fila de integrações.

### A4. Como cada nível vai sentir a mudança
| Quem | Ao entrar, sente | Número herói | Imagem com função | Momento de vitória |
|---|---|---|---|---|
| Você (Master) | "a empresa está andando" | **Lojistas pagantes: X de 10** (a estrela-guia), com o ritmo do mês | constelação das lojas pelo Brasil | cada novo pagante; lojista que bateu um marco (para você parabenizar) |
| Sua equipe (comercial, suporte, financeiro, conteúdo, contador) | "sei o que é meu hoje" | o número da função (conversas esperando, cobranças vencidas, aulas) | — | meta da função batida |
| Lojista ("Meu negócio") | "minha loja está viva e bem cuidada" | vendas de hoje e do mês | a capa da loja dele | 1ª venda, 100ª, recorde, meta |
| Lojista só com Site | "o site traz clientes" | pedidos de orçamento do mês | a capa do site | primeiro contato pelo site |
| Equipe do lojista | "minha fila do dia" | pedidos para separar e conversas esperando | — | fila zerada no dia |
| Parceiro | "estou ganhando e sei quando recebo" | comissão do mês e próximo pagamento | degraus de luz | indicado que virou pagante |
| Agência | "produção e caixa sob controle" | entregas do mês (contratado × feito) e recebido | estúdio de luz | mês fechado sem atraso |
| Cliente da agência (portal) | "a agência trabalha para mim" | o que espera aprovação, com miniatura | as próprias peças | mês publicado |
| Consumidor da loja | "meu pedido está chegando" | situação do último pedido, com linha do tempo | fotos dos produtos comprados, nas cores da loja | "Chegou!" e convite para avaliar |

### A5. Onde entra vida e onde entra calma (a regra que evita exagero)
- **Vida forte:** telas de visão geral (Agora/Hoje, "Meu negócio"), Dinheiro, Crescer, conquistas, portal do cliente, acompanhamento do pedido.
- **Vida discreta:** listas e fichas (pedidos, produtos, clientes): etiquetas coloridas, foto do produto, linha que corre ao salvar, nada piscando.
- **Calma total:** formulários, pagamento, contratos, configurações e telas de erro. Ninguém quer confete no meio de um cadastro.
- Isso concilia o seu pedido de hoje com a regra antiga dos painéis ("ferramenta de trabalho, não vitrine de software", D42): a ferramenta continua limpa onde se trabalha e ganha vida onde se acompanha o negócio. O visual de tecnologia que você já aprovou (D224, D225) é o ponto de partida, não é jogado fora.

### A6. Decisões que dependem de você (com a minha recomendação)
1. **Tema padrão.** Hoje, sem escolha salva, o painel abre no claro. **Recomendo "seguir o aparelho"** (escuro quando o celular ou o computador estão no escuro), com o tema escuro desenhado com o mesmo capricho da referência. Alternativa: escuro sempre como padrão.
2. **Canais que ainda não existem.** **Recomendo não mostrar** no painel; aparecem só em Aplicativos, com "Quero quando sair".
3. **Convite de plano.** **Recomendo um por tela, só no momento certo**, e nenhum para quem está no Scale.
4. **Som de "venda aprovada".** **Recomendo desligado até o lojista ligar**, com o convite logo depois da primeira venda.
5. **Selo "feito com NextLevel" no cartão de conquista.** **Recomendo ligado e pequeno**, com a opção de tirar.
6. **Jornada da loja e meta do mês.** Aprova usar as 5 fases que já existem como o "próximo nível" da loja? Os critérios de cada fase vêm na PV0 para você aprovar.
7. **Dados de exemplo na conta nova.** **Recomendo só no gráfico**, com o selo "Exemplo"; dinheiro e pedidos sempre reais (zero é zero).
8. **Ordem.** **Recomendo começar pelo lojista (PV3)** e fazer o seu Master na PV5. Se preferir ver primeiro no seu painel, invertemos sem custo extra. E a rodada relâmpago antes da Black (Resumo) é opcional.
9. **Imagens.** Você gera os lotes do arquivo de imagens, ou sigo só com fundos feitos em código (degradês e grade) até elas chegarem? **Recomendo seguir em código e trocar quando chegarem**: o sistema mostra a imagem sozinho quando o arquivo entra na pasta.

### A7. Onde está o maior retorno (impacto × esforço)
| Alavanca | Impacto na percepção | Esforço | Fase |
|---|---|---|---|
| Números do dia e do mês na primeira dobra, com cor por assunto | Alto | Baixo | PV1, PV3 |
| Gráfico de vendas com a frase do achado | Alto | Baixo (os dados já existem) | PV3 |
| Uma faixa de aviso por vez | Médio | Baixo | PV3 |
| Capa da loja no topo | Médio a alto | Baixo | PV3 |
| "O que a NextLevel fez por você" | Alto | Médio (contadores novos) | PV2, PV3 |
| Meta do mês e Jornada da loja | Alto | Médio | PV2, PV3 |
| "Venda aprovada!" ao vivo, com som opcional | Alto | Médio | PV4 |
| Conquistas com cartão para o Instagram | Alto (e divulga a marca) | Médio | PV4 |
| Master com a estrela-guia (pagantes) | Alto para você | Baixo | PV5 |
| Resumo da semana por e-mail | Alto (segura o cliente) | Médio | PV8 |
| Consumidor com linha do tempo do pedido | Médio (melhora o pós-venda do lojista) | Médio | PV7 |
| Imagens sazonais | Médio | Baixo para mim; médio para você (gerar) | PV9 |

---

## Parte B — Prompt engenheiro mestre (cole a partir daqui)

### B0. Papel e missão
Você é, ao mesmo tempo, engenheiro de produto, designer de interface e engenheiro de front-end sênior deste repositório. Sua missão é levar **vida** (cor com significado, gráficos com dados reais, números em destaque, imagem com função e movimento com propósito) a **todos os painéis**, do Master ao consumidor da loja, **aumentando a percepção de valor** sem perder velocidade, acessibilidade, honestidade dos números e isolamento entre clientes. Trabalhe **uma fase por vez** (B13), mostre prints ao dono no fim de cada fase e registre cada decisão. Fale com o dono em português, sem jargão.

### B1. Leia antes de qualquer código (nesta ordem)
1. `CLAUDE.md` e `AGENTS.md`: pilha, comandos, regras, custo de montagem no Render, testes enxutos.
2. **Este Next não é o que você conhece.** Leia em `node_modules/next/dist/docs/01-app/`: `02-guides/view-transitions.md` (morfose entre telas), `02-guides/streaming.md` (primeira dobra antes do resto), `02-guides/caching-without-cache-components.md` (o projeto **não** liga `cacheComponents`), `03-api-reference/04-functions/image-response.md` (cartões de conquista), `03-api-reference/04-functions/after.md`, `02-guides/progressive-web-apps.md` e `01-getting-started/12-images.md`.
3. A Constituição (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`) nos artigos de dados, permissões e temas; `docs/constituicao/README.md` para os documentos de apoio.
4. Decisões: D42 (direção "mesa do atacadista"), D155 (vidro e movimento), D193 ("Subida"), D200 ("Agora" do Master), D205 e D207 (aviso sonoro), D209 e D210 (topo e botão Agente), D222 a D225 (visual de tecnologia e abertura em vidro), D232 (roupa da Black), D238 (Banners da loja), D247 (uso do plano), D271 e D272 (bônus, missões, confete), D291 e D292 (tempo real e visitas), D304, D324 ("Meu negócio"), D326 (modo demonstração), D327 (gavetas) e **D331 (esta direção)**.
5. `docs/design/VIDRO-E-MOVIMENTO.md`, `docs/DESIGN-SYSTEM.md`, `docs/design/DIRECAO-VISUAL-V4.md` (a seção 3 passa a valer só para as telas de trabalho, ver A5) e `docs/prompts/reorganizacao-paineis-por-persona.md` (esqueleto de gavetas; este prompt é a camada visual dele).
6. Skills do projeto: `painel-interno`, `qa-visual`, `desempenho`, `nova-migracao`, `publicar`, `levar-para-marca`. Se a skill `dataviz` estiver disponível na sessão, use o método dela para cores e gráficos.

### B2. Regras inegociáveis
1. **Número verdadeiro ou nenhum número.** Todo valor vem do banco do próprio cliente. Nada inventado, arredondado para impressionar ou de outra loja. Dados de exemplo só em gráfico, com o selo "Exemplo" visível e texto para leitor de tela.
2. **Um tenant nunca lê outro.** Toda consulta nova filtra por loja ou organização no servidor (`requireRole`, `requireStoreAdmin`, `assertCanAccess`), com teste de isolamento para cada função nova.
3. **Contrato único de venda:** `isEligibleSale` e `netSaleCents` (`src/lib/domain/analytics.ts`). O número do início é igual ao da Análise e ao das exportações. Valores em centavos; datas no fuso de Brasília.
4. **Página com banco:** `export const dynamic = "force-dynamic"`.
5. **Cor nunca é o único sinal:** seta, sinal e palavra; contraste AA no texto (4,5:1) e 3:1 em elementos gráficos, nos dois temas, com teste automático.
6. **Movimento com freio:** só `transform`, `opacity` e `stroke-dashoffset`; nenhuma ação espera animação; `prefers-reduced-motion` desliga tudo, no CSS **e** no JavaScript (como `comportamentoDeRolagem()`); no máximo duas animações contínuas visíveis ao mesmo tempo.
7. **Sem biblioteca pesada:** gráficos em SVG próprio; movimento em CSS, WAAPI e `<ViewTransition>`. Biblioteca nova só com justificativa escrita, medição de peso e aprovação do dono.
8. **Servidor primeiro:** componentes de servidor por padrão; JavaScript no cliente só no que interage (a troca de período pode ser um link com `?periodo=30d`, sem JS).
9. **Marca e tema certos:** texto de marca vem de `getBrand()`; o painel do lojista mostra a marca do lojista (D209); a área do consumidor usa as cores da loja (`--sf-*`), nunca a roupa da NextLevel.
10. **Cada papel vê só o que é dele:** dinheiro da empresa só para dono e financeiro; equipe da loja sem Dinheiro e Ajustes; freelancer sem dados do cliente.
11. **Sem promessa de ganho:** metas e conquistas mostram o que já aconteceu; nunca "você vai faturar".
12. **Nada de canal, recurso ou marca que não exista** para aquele cliente (A2).
13. **Todo bloco novo tem os estados** carregando, vazio, erro e sem permissão.
14. **Sem rolagem lateral em 360 px**; alvo de toque ≥ 44 px; foco visível; tudo funciona pelo teclado.
15. **Imagem nunca carrega texto ou número** (o texto real vem da página) e nunca fica sob texto sem véu de contraste.
16. **Anti-duplicação:** procure e estenda antes de criar (B3). A peça antiga substituída vira reexportação, como já foi feito com `src/components/movimento/`.
17. **Mudança de comportamento exige teste.** Mudou o banco: `npx drizzle-kit generate --name <assunto>` (skill `nova-migracao`); nunca edite migração publicada.
18. **Custo de montagem:** junte a fase numa publicação; documento com `[skip render]`; o último commit da publicação é de código; no máximo 3 publicações de código por dia (`docs/infra/RENDER-USO.md`).
19. **Frase do número por regra, sem IA:** as frases ("puxado pela Camiseta Premium") saem de funções puras testadas a partir dos números; a IA não inventa fato (mesma regra do "Pergunte ao Maurício", D325).

### B3. O que já existe (reaproveite; não crie de novo)
| Peça | Onde está | O que fazer com ela |
|---|---|---|
| Tokens de forma, cor por marca e tema claro/escuro | `src/design-system/tokens.css`, `themes.ts`, `core.css` | Estender com os tokens "Vida" (B5), sem cor escrita à mão em componente |
| Visual de tecnologia dos painéis (fontes, borda em degradê, abertura de vidro roxo-azul, roupa da Black) | `src/components/app/painel-tech.tsx` (D224, D225, D232) | Evoluir a abertura (`.ds-hero`) para aceitar imagem de fundo com véu; manter a roupa da Black |
| Movimento "Subida": transição de página, barra de progresso, degraus, linha do campo, aviso salvo | `src/design-system/movimento.css`, `src/components/transicao-de-pagina.tsx` (D193) | Base do catálogo de movimento (B8) |
| Entrada escalonada | `ds-enter` + `--ds-stagger` (D155), usada em `CommerceHome` | Manter e aplicar no kit |
| Cartão de número com variação e mini gráfico | `MetricCard` (`src/components/app/metric-card.tsx`) e `Kpi` (`src/components/commerce/commerce-home.tsx`) | Unificar em `NumeroVivo` (B6) e reexportar os dois |
| Gráficos | `Spark` (em `metric-card.tsx`), `SalesChart` (`src/components/app/sales-chart.tsx`), `LineArea` e `StackedColumns` (`src/components/finance/charts.tsx`), `Heatmap` (`src/components/finance/heatmap.tsx`), `Ring` (em `commerce-home.tsx`) | Consolidar em `src/components/graficos/` (B7) |
| Cálculos da Análise da loja: vendas por dia, canais, produtos campeões, recompra, estados, mapa de calor e período anterior | `computeStoreAnalytics` (`src/lib/domain/analytics.ts`) | Fonte dos blocos do "Meu negócio"; levar para consulta agregada (B10) |
| Visitas, origem, aparelho e conversão da loja | `src/lib/domain/visitas.ts` (`resumoDeVisitas`, `vendasPorOrigem`, `conversao`), tabela `store_visits_daily` | Números de visitas e conversão; "agora na loja" |
| Carrinhos abandonados e recuperados | `resumoCarrinhos` (`src/lib/domain/carrinho-abandonado.ts`), tabela `abandoned_carts` | Fila com R$ e "O que a NextLevel fez por você" |
| Prontidão e saúde da loja | `getStoreReadiness` (`src/lib/domain/readiness.ts`), `healthScore` (`src/lib/domain/control-tower.ts`) | "Saúde da loja" com selos |
| Fila do dia e pulso | `filaDoLojista`, `pulsoDaLoja`, `pedidosParados` (`src/lib/domain/fila-do-dia.ts`); `PulsoLoja`, `PrecisaDeVoce`, `ActionQueue`, `OperationalPulse` (`src/components/app/`) | Fila "Faça agora" com valor em R$ e a faixa do dia |
| Uso do plano | `UsoDoPlano` (`src/components/app/uso-do-plano.tsx`, D247) | Medidor do plano e convite no momento certo |
| Atualização ao vivo | `AoVivo` (`src/components/master/ao-vivo.tsx`) | Indicador "ao vivo" e atualização da tela |
| Som e aviso de novidade | `src/components/master/aviso-sonoro.tsx` (D205, D207) | "Venda aprovada!" (B8) |
| Confete leve | `.nl-confete` (`src/app/globals.css`, D272) | Momentos de vitória |
| Missões, sequência, selos e ranking | `src/lib/domain/engajamento.ts`, `src/lib/finance/engajamento-regras.ts` (D272) | Motor das conquistas (lojista, equipe e parceiro) |
| Fases da Jornada, com ilustrações | `src/lib/domain/journey.ts`, `public/ilustracoes/v1/ui-fase-*` | "Jornada da loja" (o próximo nível) |
| Ilustrações com reserva segura | `Ilustracao` (`src/components/app/ilustracao.tsx`) e `public/ilustracoes/v1/MANIFESTO.md` | Modelo do componente `ImagemDePainel` (B9) |
| Esqueleto com brilho | `.ds-skeleton` e `ds-shimmer` (`core.css`), `src/components/ds/skeletons.tsx` | `loading.tsx` de cada tela inicial |
| "Agora" do Master | `src/app/master/agora/page.tsx`, `agoraEcommerce` (`src/lib/domain/agora-ecommerce.ts`), `DEGRAUS` (`src/lib/domain/funil-ecommerce.ts`) | Estrela-guia e funil vivo (PV5) |
| Mapa vivo do ecossistema | `src/components/master/mapa-constelacao.tsx` | Referência visual para o mapa das lojas |
| Placar da goleada | `src/components/placar/` | Referência de número contado na tela |
| Menu por gavetas | `src/lib/nav.ts` (D327, item `rodape`) | A casca dos painéis (B12) |
| Seletor de tema | `ThemeSwitch` (`src/design-system/components/theme-switch.tsx`) | Padrão escolhido pelo dono (A6, item 1) |
| Testes de contraste e do design system | `tests/vidro-contraste.test.ts`, `tests/brand-palette.test.ts`, `tests/design-system.test.ts` | Estender para os tokens "Vida" |
| Experimentos A/B | tabela `experiments` | Comparar o início novo com o antigo (B17) |
| Varredura de acessibilidade | `e2e/polish-v8.mjs` | Rodar em toda tela tocada |
| Contas de demonstração | `completo@commerce.demo` (loja cheia), `lojista@commerce.demo`, `equipe@commerce.demo`, `master@nextlevel.demo` (botão "Equipe NextLevel" no login), senha `demo1234` | Capturas e e2e |

### B4. Direção "Vida com propósito" (8 princípios)
1. **Cada cor tem um assunto.** Dinheiro, pedidos, clientes, visitas, crescimento e celebração têm famílias de cor fixas em todos os painéis (B5). Quem aprende num painel lê todos.
2. **Número herói primeiro.** Em toda tela inicial, os 1 a 4 números que respondem "estou bem?" ficam na primeira dobra, grandes, com variação e contexto.
3. **Todo número tem um "e daí".** Variação com frase, link para o detalhe e, quando couber, uma ação.
4. **Gráfico conta uma história:** o título é a conclusão ("Sábado foi o seu melhor dia"), não "Gráfico de vendas".
5. **Imagem com função:** identidade (capa da loja), contexto (data comercial), emoção (conquista) ou orientação (estado vazio). Imagem sem função não entra.
6. **O movimento explica:** entra o que chegou, desenha o que cresceu, brilha o que é novo, comemora o que foi conquistado. Nada se move por enfeite em tela de trabalho.
7. **"Ao vivo" de verdade:** o que diz "ao vivo" se atualiza sozinho; o que não se atualiza não diz.
8. **Calma onde se trabalha** (A5).

### B5. Sistema de design "Vida": tokens novos
Estender `tokens.css` (forma e movimento) e `themes.ts` (cores por tema), com nomes `--vida-*`. Os valores abaixo são o ponto de partida: **valide com o teste de contraste e de daltonismo e ajuste**.

**Famílias de assunto** (ícone, mini gráfico, brilho e série de gráfico; nunca para dizer "bom" ou "ruim"):
| Família | Assunto | Tema escuro | Tema claro |
|---|---|---|---|
| `--vida-dinheiro` | vendas, receita, comissão, recebido | `#4D9BFF` | `#1D5FD6` |
| `--vida-pedidos` | pedidos, entregas, expedição | `#22D3EE` | `#0E7490` |
| `--vida-clientes` | clientes, recompra, avaliações | `#A78BFA` | `#6D28D9` |
| `--vida-visitas` | visitas, conversão, tráfego, anúncios | `#FBBF24` | `#B45309` |
| `--vida-crescimento` | meta, jornada, conquistas | `#34E89E` | `#047857` |
| `--vida-festa` | celebração, Black, destaque raro | `#F472B6` | `#BE185D` |

- Cada família ganha 4 derivados gerados por `color-mix` (nunca escritos à mão): `-forte` (texto e ícone), `-suave` (fundo do ícone: 14% no claro, 18% no escuro), `-brilho` (sombra colorida, 35%) e `-trilho` (fundo de barra e anel, 12%).
- **Os estados de sistema continuam neutros às marcas** (`--ds-success`, `--ds-warning`, `--ds-danger`, `--ds-info`): só eles dizem bom ou ruim.
- **Paleta dos gráficos (ordem fixa):** dinheiro, pedidos, clientes, visitas, crescimento, festa e um neutro para "Outros". A série do período anterior usa a mesma cor a 35%, tracejada. A rosca tem no máximo 5 fatias mais "Outros". Sequencial (mapa do Brasil, mapa de calor): 5 degraus de `--vida-dinheiro`, do `-trilho` ao `-forte`.
- **Superfícies:** `--vida-aurora` (luz de fundo do topo: duas manchas radiais nas famílias dinheiro e clientes, 10% no claro e 22% no escuro); `--vida-vidro` (reaproveita `--ds-glass`); `--vida-veu` (véu de contraste para texto sobre imagem: degradê da cor de fundo, de 85% a 0%, da esquerda para a direita no computador e de baixo para cima no celular); `--vida-grade` (grade fina de 32 px, já usada no `.ds-hero`).
- **Números:** `--vida-fs-heroi: clamp(2rem, 4.6vw, 3.4rem)` (número do dia), `--vida-fs-kpi: clamp(1.55rem, 2.6vw, 2.15rem)`, `--vida-fs-rotulo: 0.78rem`. Teste as duas opções e mostre ao dono por print: Space Grotesk com `font-variant-numeric: tabular-nums` nos números grandes (recomendado) ou Geist Mono (o padrão atual, D224). Tabelas e valores pequenos continuam em Geist Mono. Nos cartões, formato compacto (`formatCompactBRL`: "R$ 48,8 mil"), com o valor completo no `aria-label` e na dica. Reserve a largura do número para a contagem não mexer o layout.
- **Brilho e borda:** `--vida-borda-viva` (degradê fino da família, 1 px, no cartão em destaque) e `--vida-halo` (sombra colorida só no cartão em foco ou com novidade). No claro, o brilho vira sombra suave tingida, nunca neon.
- **Movimento (somar aos existentes):** `--vida-dur-contagem: 900ms`, `--vida-dur-desenho: 700ms`, `--vida-dur-tique: 300ms`, `--vida-dur-brilho: 1500ms`, `--vida-dur-aurora: 40s` e `--vida-ease-mola: cubic-bezier(.34, 1.56, .64, 1)` (só em comemoração).
- **Teste novo obrigatório, `tests/vida-tokens.test.ts`:** contraste de texto e de gráfico das 6 famílias nos dois temas e em todas as marcas ligadas; distância mínima entre famílias vizinhas sob simulação de daltonismo (deuteranopia e protanopia); nenhum `#hex` literal novo em `src/components/graficos/**` e `src/components/vida/**`.

### B6. Kit de componentes "Vida"
Pastas: `src/components/vida/` (componentes) e `src/components/graficos/` (gráficos). Todos com os estados carregando, vazio, erro e sem permissão; tema claro e escuro; 360 px; teclado e leitor de tela.

| Componente | Para quê | O que não pode faltar |
|---|---|---|
| `AberturaViva` | Topo das telas iniciais | Saudação pela hora de Brasília, nome do negócio, número do dia (`NumeroHeroi`), "ao vivo", até 2 ações. Fundo: imagem com véu (`ImagemDePainel`) ou aurora em código. Altura máxima de 240 px no computador e 200 px no celular (hoje a abertura tem cerca de 320 px e empurra os números para fora da tela) |
| `NumeroHeroi` | O número do dia | Valor grande, comparação justa ("vs. terça passada"), frase curta, `ContadorVivo` |
| `NumeroVivo` (substitui `MetricCard` e `Kpi`) | Cartões de número | Família de cor, ícone em quadrado suave, valor compacto, variação com seta, sinal e palavra para leitor de tela, mini gráfico de 14 pontos, link para o detalhe com morfose (`<ViewTransition>`), estado "sem dado ainda" com o porquê |
| `ContadorVivo` | Animação de contagem | O valor final já vem no HTML; anima só na primeira visita da sessão; sem JS ou com menos movimento, nada se move |
| `FaixaDoDia` (evolução do `PulsoLoja`) | Pulso fixo | 3 a 5 sinais; um toque leva ao que resolver |
| `FilaFacaAgora` (evolução do `PrecisaDeVoce`) | O que fazer agora | Ordem por urgência e por dinheiro em jogo; valor em R$ quando houver; botão que resolve; até 6 itens com "ver todos" |
| `AnelProgresso` (substitui `Ring`) | Meta, saúde, jornada, primeiros passos | Trilho, número no meio, rótulo para leitor de tela, desenho animado uma vez |
| `JornadaDaLoja` | O próximo nível | As 5 fases de `journey.ts`, a fase atual iluminada, "faltam X para a próxima", ilustração da fase |
| `CartaoConquista` | Momento de vitória | Fundo de imagem, número da conquista, confete leve uma vez, "Postar no Instagram" (imagem gerada com `ImageResponse`, 1080×1920 e 1080×1080) e "Mandar no WhatsApp" |
| `AvisoVenda` | "Venda aprovada!" | Aviso no canto (sonner) com a linha da marca correndo (`.nl-toast-ok`), valor e produto, som opcional "Subida", contador no título da aba |
| `IndicadorAoVivo` | Selo "ao vivo" | Ponto pulsando (para com menos movimento), "atualizado há X s", `aria-live="polite"` só para mudanças importantes |
| `SaudeDaLoja` | Segurança e cuidado | Anel e selos (domínio, cadeado, pagamento, frete, catálogo); cada selo leva à correção |
| `ValorEntregue` | "O que a NextLevel fez por você" | Até 6 contadores reais do mês, com ícone e família de cor; esconde contador zerado; link "como calculamos" |
| `CalendarioComercial` | Próximas datas | Imagem da data, contagem de dias, botão "criar campanha ou cupom"; datas em `platform_settings`, nunca fixas no código |
| `ConviteProximoNivel` | Upgrade no momento certo | Só aparece com gatilho real (uso ≥ 80%, recurso bloqueado, simulação de preço favorável); imagem dos degraus; some no Scale; no máximo um por tela |
| `ListaCampeoes` | Produtos campeões | Foto do produto (miniatura otimizada), posição, unidades, R$, mini gráfico, link para o produto |
| `TabelaRecentes` (estende `OrdersTable`) | Pedidos recentes | Avatar com iniciais e cor estável por cliente, etiqueta de situação com ícone, valor, linha clicável que abre a gaveta |
| `ChipSituacao` (estende `StatusBadge`) | Situação | Ícone, texto e a cor do estado de sistema; nunca só cor |
| `Avatar` | Pessoa ou loja | Foto quando houver; senão, iniciais com cor estável (6 famílias) |
| `ImagemDePainel` | Imagem de fundo e de bloco | Mesmo modelo do `Ilustracao`: sem o arquivo, some sem quebrar; WebP e AVIF; `sizes`; prioridade só na abertura; véu automático; versão clara e escura |
| `EstadoVazioVivo` (estende `EmptyState`) | Vazio que orienta | Ilustração v2, frase do que vai aparecer ali, ação principal |
| `SeletorPeriodo` | 7 dias, 30 dias, 90 dias, 12 meses | Links com `?periodo=` (sem JS), o atual em destaque, morfose do gráfico na troca |
| `CartaoSuporteHumano` | Ajuda com rosto | Foto real da equipe, canal (WhatsApp, chat), horário de atendimento |
| `CartaoNovidade` | O sistema evolui | A novidade mais recente ("O que mudou", que já existe), com imagem e link |
| `MedidorPlano` (estende `UsoDoPlano`) | Uso do plano | Barra na família crescimento, alerta aos 80%, convite aos 100% |
| `FaixaUnica` | Avisos do topo | Uma faixa por vez, por prioridade (segurança > cobrança > campanha > novidade); as outras vão para o sino; fechada, some por 7 dias |
| `VitrineDoKit` (página interna) | Ver tudo junto | `/master/design/vida`, só para o Master: todos os componentes, estados e temas, com dados fictícios marcados; serve de conferência visual e de teste |

### B7. Kit de gráficos (SVG próprio)
**Peças:** `GraficoArea` (linha e área, período anterior tracejado, marcador do melhor dia, dica), `GraficoBarras` (verticais e empilhadas; reaproveita `StackedColumns`), `BarrasRanking` (horizontais: estados, origens, produtos), `Rosca` (até 5 fatias e "Outros", total no meio), `MapaBrasil` (27 UFs desenhadas em SVG no código, coroplético sequencial, sem imagem), `MapaDeCalor` (dia × hora; evolui o `Heatmap`), `Funil` (degraus com a passagem entre etapas em %), `AnelProgresso`, `MiniGrafico` (sparkline) e `Medidor`.

**Regras de todos os gráficos:**
- Título com a conclusão e subtítulo com o período; eixos e grade discretos; números no formato brasileiro.
- **Acessíveis:** `role="img"` e `aria-label` com a frase do achado; botão "Ver como tabela" (tabela de verdade, escondida até ser pedida); a dica abre com o foco do teclado, não só com o mouse.
- **Cores só dos tokens**; nenhuma cor escrita à mão.
- **Movimento:** desenho da linha (`--vida-dur-desenho`) e crescimento das barras uma vez, ao entrar na tela; nada com menos movimento.
- **Desempenho:** pontos reduzidos no servidor (no máximo 90 por série); nenhum cálculo pesado no cliente; `viewBox` responsivo; sem rolagem lateral em 360 px (no celular, o gráfico mostra 7 dias ou rola dentro do próprio cartão).
- **Sem dado:** gráfico fantasma em cinza com o selo "Exemplo" e a frase "Seus números aparecem aqui depois da primeira venda".
- **Testes:** `tests/graficos.test.ts` com as funções puras (escala, redução de pontos, fatias com "Outros", cor por UF) e um e2e que confere o `aria-label` e a tabela.

### B8. Movimento: o catálogo (estende a "Subida", D193)
| Nome | Quando | Como | Duração |
|---|---|---|---|
| Chegada | blocos ao entrar na tela | sobe 14 px e aparece, escalonado (`ds-enter`, `--ds-stagger`), atraso máximo de 320 ms | 500 ms |
| Contagem | número herói e cartões, na primeira visita da sessão | `requestAnimationFrame` do zero ao valor, já no formato final; o valor real já está no HTML | 900 ms |
| Desenho | linhas, anéis e barras | `stroke-dashoffset` e `scaleY` a partir da base | 700 ms |
| Tique | número que mudou numa atualização ao vivo | o dígito desliza e um realce de cor some | 300 ms + 1,2 s |
| Brilho | algo novo chegou (venda, conversa) | halo da família, um ciclo | 1,5 s |
| Ao vivo | indicador | anel que expande e some, contínuo | 2 s |
| Aurora | fundo da abertura, só no computador | mancha de luz desfocada que se desloca bem devagar; pausa com a aba escondida | 40 s |
| Elevação | cartão clicável sob o mouse | sobe 2 a 3 px e ganha a borda viva (`ds-lift`) | 180 ms |
| Morfose | cartão de número → página de detalhe | `<ViewTransition>` com nome compartilhado | nativo |
| Aviso | venda aprovada, salvo | o aviso desce e a linha da marca corre (`.nl-toast-ok`) | 420 ms |
| Comemoração | conquista | confete leve uma vez (`.nl-confete`) e o cartão cresce com mola | 3 s |
| Esqueleto | carregando | brilho que corre (`ds-shimmer`) | 1,4 s |

**Regras:** nenhuma animação em tabela ou formulário; nenhuma ação espera animação; `prefers-reduced-motion` desliga tudo, inclusive contagem e aurora; aba escondida pausa as animações contínuas; "animações não compostas" no Lighthouse = 0; celular de entrada sem travar (60 quadros por segundo no perfil de desempenho com a CPU 4 vezes mais lenta).

**"Venda aprovada!":** estenda o padrão do `aviso-sonoro.tsx`. A cada 15 s (com a aba visível), uma ação leve devolve a última venda paga da loja; se for nova (compare com a última vista, guardada no navegador), mostre o `AvisoVenda`, toque a "Subida" se o som estiver ligado e atualize os números (`router.refresh`). Sem WebSocket. A confirmação continua sendo a do Mercado Pago no servidor: o aviso só lê o que já foi conferido.

### B9. Imagens com função
**Onde entra imagem:**
1. **Abertura do "Meu negócio": a imagem principal da vitrine do lojista.** Procure a fonte certa na área Banners (D238) e nas configurações do tema antes de criar campo novo. Véu automático. Sem imagem: a aurora em código ou o fundo `pv-abertura-loja-*`.
2. **Aberturas dos outros painéis:** Master, parceiro, agência, só Site (lote A do arquivo de imagens).
3. **Calendário comercial:** uma imagem por data (lote C), escolhida pela data de hoje.
4. **Conquistas:** fundos do cartão e da imagem para o Instagram (lote D).
5. **Convite de próximo nível e "O que a NextLevel fez por você":** degraus de luz e fluxo de luz (lote B).
6. **Estados vazios:** ilustrações v2 (lote E), que substituem as v1 aos poucos.
7. **Produtos campeões, pedidos e área do consumidor:** fotos reais dos produtos do lojista (nunca geradas).
8. **Suporte humano:** fotos reais da equipe (nunca geradas).

**Regras técnicas:** pasta `public/paineis/v1/` com `MANIFESTO.md` (a fonte da verdade: arquivo, onde aparece, proporção, peso); componente `ImagemDePainel` com reserva segura (sem o arquivo, entra o fundo em código; nunca imagem quebrada); WebP (qualidade 82) e AVIF (55); abertura até 180 KB, cartões até 90 KB, ilustrações até 60 KB; `loading="lazy"` fora da abertura; `object-position` à direita nas aberturas (o lado esquerdo fica calmo para o texto); `alt=""` quando decorativa; véu com contraste conferido (texto AA no pior ponto da imagem, verificado por captura); versão clara e escura quando a imagem fica atrás de texto.

### B10. Camada de dados: números certos e rápidos
- Crie `src/lib/domain/painel-vivo/` com uma função por painel (`painelDoLojista`, `painelDoMaster`, `painelDoParceiro`, `painelDaAgencia`, `painelDoConsumidor`). Cada uma devolve um objeto tipado `PainelVivo` (números heróis, séries, rankings, fila, conquistas, saúde, frases). **Os componentes não consultam o banco nem decidem regra.**
- **Consulta agregada no banco, não em memória.** Hoje `getMerchantOverview` carrega **todos** os pedidos da loja (`src/lib/queries/merchant.ts`, a primeira consulta da função) para somar 30 dias. Troque por `SUM` e `COUNT` agrupados por dia no período pedido (crie o índice `orders (store_id, created_at)` se faltar), mantendo o contrato de venda e o mesmo número da Análise (teste de igualdade).
- Uma consulta por bloco, os blocos em paralelo (`Promise.all`) e dentro de `Suspense` com esqueleto, para a primeira dobra aparecer antes do resto (`streaming.md`).
- **Períodos:** `7d`, `30d`, `90d` e `12m`; comparação com o período anterior de mesmo tamanho; "hoje" comparado com o mesmo dia da semana anterior; fuso de Brasília.
- **Cache:** por requisição, com `React.cache`. Entre requisições, só se a medição mostrar lentidão, com chave por loja e invalidação ao gravar pedido (leia `caching-without-cache-components.md`), e com teste de que uma loja nunca recebe o cache de outra.
- **Frases do número:** `frasesDoPainel` (função pura, testada) escolhe a frase a partir dos números: melhor dia, produto que puxou a alta, causa provável da queda (sem estoque, sem visitas, pagamento desligado).
- **Contadores que faltam** (para "O que a NextLevel fez por você"): primeiro confira o que já tem a loja na tabela (`abandoned_carts.reminded_at_1`, `reminded_at_2` e `recovered_order_id`; `stock_alerts`; `store_visits_daily`; `ia_conversas`; `robos_visitas_diarias`). O que não tiver (por exemplo, e-mails por loja: `email_outbox` não guarda a loja) ganha um registro diário por loja, idempotente, gravado onde a ação acontece. A migração só acrescenta.
- **Conquistas:** tabela `conquistas` (loja ou parceiro, tipo, valor, alcançada em, vista em, compartilhada em), calculada por regra pura testada a partir dos pedidos pagos; aparece uma vez por pessoa; o Master vê a lista para parabenizar.
- **Meta do mês:** guardada na configuração da loja (procure antes um campo de ajustes da loja; se não houver, coluna nova), com sugestão = mês anterior + 10%, arredondada.
- **Conversão:** só aparece com 100 visitas ou mais no período; abaixo disso, "poucas visitas para calcular".
- **Testes:** `tests/painel-vivo.test.ts` (isolamento entre lojas, período e fuso, centavos, comparação justa, igualdade com a Análise, frases, conquistas, meta, limite da conversão, permissões por papel).

### B11. Cada painel, nível a nível
Os desenhos abaixo são de estrutura (não de estilo) e se encaixam no esqueleto de gavetas (D327). Toda informação tem a fonte no Apêndice 2.

#### 1. Lojista dono: a tela inicial do "Meu negócio" (a vitrine da mudança)
Primeira dobra no computador (1440×900):
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [no máximo uma faixa de aviso]                                                │
│ ABERTURA (capa da loja com véu, até 240 px)                                    │
│  Boa tarde, Helena · Casa Aurora               ● ao vivo · 3 pessoas na loja   │
│  HOJE  R$ 1.719,10  ▲ 32% vs. terça passada · 2 vendas                        │
│  [Ver loja] [Novo pedido]                          (anel) Meta do mês 72%     │
├────────────────┬────────────────┬────────────────┬────────────────┤
│ VENDAS 30 D    │ PEDIDOS 30 D   │ VISITAS → VENDA│ TICKET MÉDIO   │  NumeroVivo × 4
│ R$ 48,8 mil    │ 59             │ 1,9%           │ R$ 827         │  (cor por assunto,
│ ▲ 49,6% ~~~~~  │ ▲ 47,5% ~~~~~  │ ▲ 0,3 pp ~~~~  │ ▼ 2,1% ~~~~~   │   mini gráfico)
├────────────────────────────────────────────┬─────────────────────┤
│ VENDAS NO TEMPO   [7D] [30D] [90D] [12M]    │ FAÇA AGORA           │
│ área + período anterior tracejado           │ até 6 itens, com R$  │
│ "Sábado, 14/11, foi o melhor dia: R$ 4.120" │                      │
└────────────────────────────────────────────┴─────────────────────┘
```
- **Rolando:** canais (rosca com os canais reais) · produtos campeões (com foto) · saúde da loja · pedidos recentes · o que a NextLevel fez por você · jornada da loja · calendário comercial (imagem) · mapa do Brasil e horários de pico · novidade e suporte com rosto · convite de plano (só com gatilho).
- **No celular (390×844), sem rolar:** abertura compacta com o número de hoje, os 4 números em grade 2×2 e o primeiro item do "Faça agora". Embaixo, a barra de atalhos (Hoje, Pedidos, Conversas, Produtos, Mais) com o botão do assistente encaixado nela. Hoje o campo "Pergunte ao Maurício" e o botão do menu cobrem o conteúdo.
- **Conta nova (zero venda):** a abertura troca o número do dia pela **Jornada da loja** (fase Fundação) e pelos primeiros passos em anel; os 4 números aparecem com "—" e a frase do que falta; o gráfico fantasma traz o selo "Exemplo"; a primeira venda dispara a comemoração.
- **Só Site:** número herói = pedidos de orçamento do mês; blocos de visitas por origem, contatos sem resposta e páginas que mais trouxeram contato; nada de pedidos e estoque.
- **Equipe da loja (STAFF, `STAFF_NAV_PREFIXES`):** a mesma abertura sem valores de dinheiro; números de fila (pedidos para separar, conversas esperando, trocas abertas); nunca Dinheiro e Ajustes.

#### 2. Master (o dono): "Agora"
```
┌──────────────────────────────────────────────────────────────────────┐
│ ESTRELA-GUIA (constelação ao fundo)                                    │
│  Lojistas pagantes  3 de 10    (anel grande)    no ritmo / atrasado    │
│  Receita mensal R$ X ▲ · faltam 7 · mais perto de pagar: Fio & Linha   │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│ CONVERSAS   │ NOVOS 24 H  │ EM TESTE    │ ATIVAÇÃO    │ VOLUME DA   │
│ esperando   │             │             │ 1ª venda/7d │ REDE        │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────────┤
│ FUNIL VIVO: visitas → cadastros → teste → loja publicada → 1ª venda → │
│ pagante (barras com a passagem em %)                                  │
├───────────────────────────────────────┬──────────────────────────────┤
│ FILA DE AGORA (já existe)              │ CONQUISTAS DOS LOJISTAS       │
│                                        │ "Casa Aurora: 100ª venda"     │
│                                        │ [Parabenizar no WhatsApp]     │
└───────────────────────────────────────┴──────────────────────────────┘
```
- **Rolando:** feed ao vivo da plataforma (vendas e cadastros, sem dado do consumidor) · mapa do Brasil das lojas e vendas · saúde da plataforma (erros, tarefas atrasadas, e-mails com falha e, quando a chave do Render existir, os minutos de montagem do mês) · crescimento de 6 meses · suas pendências (já existe).
- **Equipe do Master por função** (`COMERCIAL`, `SUPORTE`, `FINANCEIRO`, `CONTEUDO`, `CONTADOR`): cada função tem o próprio número herói e a própria fila (proposta da reorganização, seção 4); placar sem humilhar ninguém.

#### 3. Parceiro (afiliado, representante, agência parceira)
- **Abertura:** "Você já recebeu R$ X com a NextLevel" (real), próximo pagamento em DD/MM e o nível.
- **Números:** cliques em 7 dias, cadastros, pagantes, comissão do mês.
- **Blocos:** funil do link (clique → cadastro → teste → pagante); "Seus bônus" e "Sua semana" (D271, D272) com as cores e o kit; materiais de divulgação com imagem.
- Sem promessa de ganho (mesma regra da página de comissões).

#### 4. Agência (Painel da Agência) e freelancer
- **Abertura com o mês:** anel "contratado × produzido × publicado", recebido no mês, clientes ativos.
- **Blocos:** produção por etapa (barras), atrasos em destaque, placar e metas (D325), crescimento (D325).
- **Freelancer:** "entregas de hoje", "voltou para ajuste" e "meus ganhos" (proposta da reorganização, seção 5).

#### 5. Cliente da agência (portal `/portal/[slug]`)
- **Número herói:** "N peças esperando a sua aprovação", com miniaturas.
- O mês em anel, os pagamentos com o botão Pagar e a marca da agência (não a da NextLevel).

#### 6. Consumidor da loja ("Minha conta" e "Acompanhar pedido")
- Cores e fontes da loja (`--sf-*`).
- **Abertura = o último pedido:** foto do produto, linha do tempo animada (pago → separado → enviado → entregue) com o ponto atual pulsando, previsão de entrega, rastreio e "Falar com a loja" já com o número do pedido.
- **Entregue:** "Chegou!" com o convite para avaliar (alimenta as avaliações do lojista).
- Sem a roupa NextLevel; no máximo "com tecnologia NextLevel" no rodapé, se a loja permitir.

#### 7. Fornecedor, expedição, Brás e Cargas (em pausa, D216)
Não mexer agora e não quebrar. Quando voltarem, recebem o kit pela skill `levar-para-marca`: a expedição com números grandes para usar com uma mão (para separar, atrasados com relógio colorido) e a Brás com as mesmas famílias de cor. As páginas públicas ficam fora deste prompt (já têm a home imersiva).

### B12. A casca (topo, menu e celular)
- **Uma faixa por vez** (`FaixaUnica`): hoje "Novo: Atendimento ao vivo", a faixa da Black e a "Novidade" ficam empilhadas antes da abertura. As que sobram vão para o sino.
- **Menu:** o item ativo ganha a família de cor da gaveta e um brilho suave; contadores só onde há o que fazer (regra da reorganização).
- **Topo:** busca (Ctrl K) em destaque; "ao vivo" ao lado do sino quando houver tempo real na tela; o botão Agente como está (D210).
- **Celular:** barra de atalhos embaixo, respeitando a área segura (`env(safe-area-inset-bottom)`), com o botão do assistente integrado; nada fixo cobre conteúdo (conferir no e2e que o primeiro item da fila fica visível e clicável).
- **Tema:** o seletor Claro / Escuro / Sistema já existe (`ThemeSwitch`); o padrão segue a resposta do dono (A6, item 1).

### B13. Fases (uma por vez; cada uma termina com print ao dono)
| Fase | O que entrega | Pronto quando |
|---|---|---|
| **PV0 · Linha de base e respostas** | Capturas em 360, 768 e 1440 px, claro e escuro, de cada tela inicial (lojista com vendas, lojista novo, só Site, equipe da loja, Master, parceiro, agência, portal, consumidor); medição (LCP, INP, CLS, peso de JS) com a skill `desempenho`; inventário das cores escritas à mão e dos gráficos; Apêndice 2 conferido no código; respostas do dono (A6); critérios das fases da Jornada para aprovar. Relatório em `docs/design/PAINEIS-COM-VIDA-PV0.md`. | O dono respondeu a A6 e os números de partida estão anotados |
| **PV1 · Fundação do kit** | Tokens `--vida-*` nos dois temas; `src/components/graficos/` e `src/components/vida/` com as peças da B6 e da B7; as peças antigas reexportando; `VitrineDoKit` em `/master/design/vida`; testes `vida-tokens` e `graficos`. Nenhuma tela real muda de aparência ainda, além da troca interna das peças. | Testes de contraste e daltonismo passando; a vitrine aprovada pelo dono por print |
| **PV2 · Números certos e rápidos** | `painel-vivo` do lojista e do Master; `getMerchantOverview` agregado no banco; frases do número; contadores que faltam; tabela de conquistas; meta do mês; testes | O mesmo número da Análise; a consulta do início do lojista em até 150 ms com 5.000 pedidos na demonstração |
| **PV3 · "Meu negócio" com vida** | Nova tela inicial do lojista (com vendas, conta nova, só Site, equipe); casca com faixa única e barra do celular; `loading.tsx` com esqueleto; e2e `e2e/paineis-com-vida-lojista.mjs`. Se a reorganização R4 estiver aprovada, entra junto (uma montagem só). | Números do dia e do mês na primeira dobra em 1440×900 e 390×844; axe sem violação grave; sem rolagem lateral em 360 px; LCP ≤ 2,5 s |
| **PV4 · Tempo real e vitórias** | `AvisoVenda` com som opcional; "ao vivo"; tique nos números; conquistas com cartão, confete e imagem para o Instagram (`ImageResponse`); lista de conquistas no Master | Uma venda paga na demonstração aparece em até 20 s com aviso; cada conquista aparece uma vez por pessoa |
| **PV5 · Master com estrela-guia** | "Agora" com o anel dos pagantes, funil vivo, conquistas para parabenizar, feed, mapa e saúde; número herói por função da equipe | Os mesmos números de `agoraEcommerce`; cada função vê só o que é dela (teste) |
| **PV6 · Parceiro e agência** | Início do parceiro e da agência no kit; portal do cliente da agência; freelancer | Testes de permissão passando; prints aprovados |
| **PV7 · Consumidor final** | "Minha conta" e "Acompanhar pedido" com o último pedido em destaque e a linha do tempo, nas cores da loja | Funciona em 3 temas de loja diferentes, sem nenhum vestígio de cor NextLevel |
| **PV8 · Valor fora do painel** | Resumo da semana por e-mail (`src/lib/email.ts`, mesmas famílias de cor, com opção de sair), PDF do mês (`pdf-lib`), cartões de conquista | E-mail aprovado por print; descadastro funcionando; nenhum dado sensível |
| **PV9 · Imagens** | Imagens do dono convertidas e no manifesto; calendário comercial com as datas em `platform_settings` | Nenhuma imagem acima do peso; véu com contraste AA conferido por captura |
| **PV10 · Acabamento e medição** | Rodada de desempenho e acessibilidade em todos os painéis; experimento A/B do início novo (tabela `experiments`), se o dono quiser; relatório antes × depois; modo demonstração do lojista; o kit nas marcas em pausa quando o dono pedir | Metas da B15 batidas e relatório entregue |

### B14. Portão de qualidade de cada fase (não publique sem)
- `npx tsc --noEmit`, `npx eslint src e2e tests` e os testes dos arquivos mexidos durante o trabalho; a bateria completa (`npx vitest run`) e o `npm run build` só na etapa final da rodada (pedido do dono, 2026-10-12).
- Capturas reais (skill `qa-visual`): 360, 768 e 1440 px; claro e escuro; topo e 5 pontos de rolagem; conta com dados e conta nova; olhar cada captura e corrigir (no mínimo 3 rodadas em tela importante).
- `e2e/polish-v8.mjs` sem violação grave; sem rolagem lateral; sem imagem quebrada; sem erro de console.
- Teste de isolamento para toda consulta nova e teste de permissão para todo bloco com dinheiro.
- Decisão nova em `DECISIONS.md` (com a frente entre colchetes), citação em `docs/conhecimento/BC0-INVENTARIO.md`, `node scripts/gerar-novidades.mjs` e a linha deste prompt atualizada em `docs/prompts/README.md`.
- Relatório ao dono (B19).

### B15. Orçamento de desempenho (medido, não estimado)
| Medida | Meta na tela inicial de cada painel |
|---|---|
| LCP (celular, 4G simulado) | ≤ 2,5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0,05 (a contagem dos números não mexe o layout: largura reservada) |
| JS novo no cliente, por painel | ≤ 30 KB comprimido |
| Imagens | abertura ≤ 180 KB; cartão ≤ 90 KB; ilustração ≤ 60 KB |
| Consultas | uma por bloco, em paralelo; nenhuma dentro de laço |
| Animações não compostas (Lighthouse) | 0 |
| Lighthouse (computador) | ≥ 90 em desempenho e em acessibilidade |

### B16. Publicação e custo
Uma publicação por fase (ou junto com outra fase pequena), depois da verificação. Documento com `[skip render]`; o último commit do push é de código; no máximo 3 publicações de código por dia; print do site no ar depois de publicar (skill `publicar`).

### B17. Como saber se a percepção de valor aumentou
- **Ativação:** % de lojas novas com a 1ª venda em até 14 dias (antes × depois).
- **Pagantes:** a estrela-guia (10 lojistas pagantes) e a passagem de teste para pagante.
- **Uso:** dias por semana em que o lojista abre o painel; cliques no "Faça agora"; tempo até a primeira ação.
- **Convite de plano:** cliques e trocas de plano que vieram do `ConviteProximoNivel`.
- **Compartilhamento:** cartões de conquista postados e os cadastros vindos deles (link rastreado `/l/`).
- **Suporte:** menos perguntas do tipo "onde vejo as minhas vendas?".
- **Pergunta de um clique** no fim do mês: "Este painel ajuda você a vender mais?" (sim / mais ou menos / não).
- **Teste A/B** do início novo contra o antigo com a tabela `experiments`, por 14 dias, antes de virar padrão para todos (se o dono quiser comparar).

### B18. Reprovar na revisão (anti-padrões)
- Número inventado ou de outra loja.
- Canal, recurso ou marca que o cliente não tem.
- Neon em tudo e texto cinza fraco.
- Pizza com 8 fatias, gráfico 3D ou gráfico sem título com a conclusão.
- Animação em tabela ou formulário; confete fora de conquista; modal que bloqueia para comemorar.
- Som ligado sem o lojista escolher.
- Convite de plano em todo canto.
- Imagem com texto escrito dentro; rosto inventado como se fosse da equipe.
- Cor escrita à mão no componente.
- Consulta que carrega todos os pedidos para somar.
- Cópia do visual de outra empresa (a referência serve para qualidade, não para copiar marca ou layout).

### B19. Relatório ao dono no fim de cada fase
Português simples e curto: o que ficou pronto (com pelo menos um print da tela principal), o que **não** foi verificado, o que depende dele, a próxima fase e a linha "Esforço do dia por frente" (regra 60/25/15).

---

## Apêndice 1 — A referência, bloco a bloco, no nosso sistema
| Bloco da referência | No nosso painel | Fonte do dado | Fase |
|---|---|---|---|
| "Olá, Maurício! Aqui está o resumo do seu negócio hoje" | `AberturaViva`: saudação pela hora, número do dia e "ao vivo" | sessão e `painelDoLojista` | PV3 |
| Vendas totais, Pedidos, Clientes ativos e Taxa de conversão, com mini gráfico | `NumeroVivo` × 4: Vendas 30 d, Pedidos 30 d, Visitas → venda (com 100 visitas ou mais) e Ticket médio | `analytics.ts`, `visitas.ts` | PV3 |
| Análise de vendas 7D/30D/90D/1A com o pico | `GraficoArea`, `SeletorPeriodo`, período anterior e a frase do melhor dia | `analytics.ts` agregado | PV3 |
| "Seu negócio no próximo nível" (foguete) | `ConviteProximoNivel` com degraus de luz, só com gatilho | `usoDoPlano`, simulação de preço | PV3 |
| Ações rápidas | Ações rápidas (já existem) no kit | — | PV3 |
| Vendas por canal (rosca) | `Rosca` com Loja virtual, WhatsApp, Instagram e Venda manual | `orders.channel` (`byChannel`) | PV3 |
| Top produtos com foto e tendência | `ListaCampeoes` | `topProducts` + `order_items.product_id` para a foto | PV3 |
| Status da loja 99,9% | `SaudeDaLoja` com conferências reais | `getStoreReadiness`, `healthScore` | PV3 |
| Pedidos recentes com avatar e etiqueta | `TabelaRecentes`, `ChipSituacao`, `Avatar` | `orders` | PV3 |
| Banner "Brasil e China" | `CalendarioComercial` com a imagem da próxima data | `platform_settings` | PV3, PV9 |
| Canais de venda no menu (SuperDrop, Brás, TikTok Shop, Mercado Livre, Shopee) | Não entra; marketplaces em Aplicativos, como "em breve", com "Quero quando sair" | `integracoes-aplicativos-fila.md` | — |
| Cartão "NextLevel Pro" no menu | Não entra (um convite por tela, no conteúdo) | — | — |
| Sino com 3 avisos | Sino com contagem real (já existe) | — | — |

## Apêndice 2 — Catálogo de números por painel e de onde vêm
Legenda: ✔ já calculado no sistema · ◐ o dado existe, falta calcular · ✚ precisa de registro novo.

| Painel | Número | Fonte | Situação |
|---|---|---|---|
| Lojista | Vendas, pedidos, ticket médio, margem | `computeStoreAnalytics` | ✔ |
| Lojista | Clientes e recompra | `computeStoreAnalytics` (`repeatRate`) | ✔ |
| Lojista | Visitas por origem e aparelho; conversão | `visitas.ts`, `store_visits_daily` | ✔ (conversão com o limite de 100 visitas) |
| Lojista | Canais | `byChannel` (`orders.channel`) | ✔ |
| Lojista | Produtos campeões | `topProducts` | ✔ (◐ a foto, via `order_items.product_id`) |
| Lojista | Estados e horários de pico | `byState`, `heatmap` | ✔ |
| Lojista | Carrinhos lembrados e recuperados | `resumoCarrinhos` | ✔ |
| Lojista | Avaliações (média, novas) | `product_reviews` | ◐ |
| Lojista | Conversas esperando | fila do lojista, `pulsoAtendimentoLojaAction` | ✔ |
| Lojista | Anúncios na Meta (investido, resultados) | `ads_metricas_diarias`, `anuncios_resultados` | ✔ quando houver campanha |
| Lojista | Uso do plano | `usoDoPlano` | ✔ |
| Lojista | Saúde da loja | `getStoreReadiness`, `healthScore` | ✔ |
| Lojista | Jornada da loja | `journey.ts` + critérios novos | ◐ |
| Lojista | Meta do mês | configuração da loja | ✚ |
| Lojista | Conquistas | tabela `conquistas` | ✚ |
| Lojista | Valor entregue pela NextLevel | tabelas existentes + registro diário por loja | ◐ e ✚ |
| Lojista | Pessoas na loja agora | `store_visits_daily` é diário; "agora" pede uma janela de minutos | ✚ |
| Master | Pagantes, meta, receita mensal, em teste, novos em 24 h, conversas | `agoraEcommerce` | ✔ |
| Master | Funil de ativação | `DEGRAUS` (`funil-ecommerce.ts`) | ✔ |
| Master | Crescimento de 6 meses | `/master/crescimento` | ✔ |
| Master | Volume da rede | `getPlatformOverview` | ✔ |
| Master | Erros, tarefas, e-mails com falha | `error_events`, `job_runs`, `email_outbox` | ✔ |
| Master | Tráfego do site em tempo real | D291 (`trafego_sessoes`) | ✔ |
| Master | Conquistas dos lojistas | tabela `conquistas` | ✚ |
| Master | Minutos de montagem do mês | API do Render (depende da chave, pendência do dono) | ✚ |
| Parceiro | Cliques, indicados, pagantes | `partner_clicks`, `partners` | ✔ |
| Parceiro | Comissões e pagamentos | `partner_commissions`, `partner_payouts` | ✔ |
| Parceiro | Bônus, missões, sequência, ranking | D271, D272 | ✔ |
| Agência | Carteira, ciclo do mês, peças por etapa, cobranças, placar, crescimento | tabelas `agencia_*` (D313 a D327) | ✔ |
| Consumidor | Último pedido, eventos, previsão | `orders`, `order_events`, `expected_delivery_at`, `shipping_days` | ✔ |
| Consumidor | Rastreio | conforme a transportadora | ◐ |
| Consumidor | Avaliação | `product_reviews` | ✔ |

## Apêndice 3 — Ponto de partida (17/11/2026, demonstração local)
Capturas em `docs/design/capturas/paineis-com-vida/`: `antes-lojista-1440.jpg` (página inteira da loja de demonstração "Casa Aurora", com vendas), `antes-lojista-1440-escuro.jpg`, `antes-lojista-390.jpg` e `antes-master-agora-1440.jpg`.

O que elas mostram:
1. **Os números principais estão abaixo da dobra.** No computador, os 4 números do mês começam a cerca de 1.200 px do topo (a tela do notebook mostra 900). Antes deles vêm três faixas (Novo, Black Friday, Novidade), a abertura de cerca de 320 px e a Fila do dia. No celular, o único número visível sem rolar é "R$ 1.719,10 · 2 vendas hoje", dentro de uma etiqueta.
2. **A tela inicial da Commerce não tem nenhum gráfico.** O gráfico de vendas por dia só existe no início antigo do SuperDrop (`src/app/merchant/page.tsx`).
3. **Cartões brancos iguais**, com ícone pequeno e variação pequena; nenhuma cor por assunto.
4. **Espaços vazios:** o cartão "Status da loja" estica até a altura da fila e fica com metade em branco; no fim da página, dois cartões soltos à esquerda.
5. **A única imagem da tela é a dos temas.**
6. **No celular, o campo "Pergunte ao Maurício" e o botão do menu cobrem o conteúdo** do fim da tela.
7. **No Master, "0 de 10 pagantes" é o 4º de 5 cartões iguais;** a "Meta do mês" fica no pé da tela, quase fora.
8. **O que já está bom e fica:** a abertura em vidro e a roupa da Black, a fila do dia com ação, o tema escuro, o topo com busca e Agente.

## Apêndice 4 — Palavras deste documento, em português simples
- **Primeira dobra:** o que aparece na tela antes de rolar.
- **Número herói:** o número mais importante da tela, em tamanho grande.
- **Família de cor:** a cor fixa de um assunto (dinheiro, pedidos, clientes…), igual em todos os painéis.
- **Véu:** a camada escura ou clara sobre uma imagem para o texto ficar legível.
- **Morfose:** quando o cartão "se transforma" na página de detalhe ao ser clicado.
- **Estado vazio:** como a tela fica quando ainda não há dado.
- **Tenant:** cada cliente (loja, agência, parceiro) com os seus dados separados dos outros.
- **Estrela-guia:** o único número que diz se a empresa está no caminho certo (hoje: 10 lojistas pagantes).
