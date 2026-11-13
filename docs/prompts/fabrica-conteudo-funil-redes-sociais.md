# Fábrica de conteúdo e funil nas redes sociais (racional + prompt engenheiro mestre)

> Estado: **PROPOSTA** (13/11/2026), para avaliação do dono. Frente: **[E-commerce]** (canal de entrada de lojistas da NextLevel Commerce); depois vira **produto para os clientes** (módulo "Estúdio de Conteúdo" dentro do painel do lojista).
> Ordem normativa: Constituição (`docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`) > `docs/design/DECISIONS.md` > este documento.
> Regras que não mudam: português claro, **sem promessa de ganho**, comparação com concorrente só com fonte e data, nada de depoimento inventado, segredo (token de rede social, ManyChat) só criptografado (`encryptSecret`), um tenant nunca lê dados de outro.
> Documentos irmãos (não duplicar): `serie-youtube-apresentacoes-comerciais.md` (vídeos longos e cortes), `publico-personas-precos-ecossistema.md` (personas P1 a P6), `busca-e-ia-visibilidade-organica.md` (busca e IA), `parceiros-regra-unica.md` (link `/r/...` e 20%), `integracoes-aplicativos-fila.md` (I-19 WhatsApp oficial, Pixel), `base-de-conhecimento-master.md` (trilha "conteúdo").

---

## 0. Resposta curta (para o dono)

1. **A ideia é montar uma "linha de produção", não fazer vídeos soltos.** Uma grade fixa de **12 formatos** (seção 4) gravados em **um dia de estúdio por semana** com o celular, editados em lote com modelos prontos e programados para a semana seguinte. Cada vídeo nasce com um **código** que segue o vídeo até a venda.
2. **Cinco vozes, sempre honestas** (seção 3): você (fundador), a empresa, o especialista/influenciador, o cliente **real** e o perfil sem rosto ("dark"). Falar "como se fosse um cliente" só vale como **encenação avisada** ("situação encenada") ou com cliente de verdade e autorização. Depoimento inventado é proibido pelo CONAR e pelo Código do Consumidor e derruba a confiança na marca.
3. **Três tipos de perfil** (seção 5): perfil da marca (NextLevel Commerce), perfil pessoal do Mauricio (autoridade e bastidores) e **2 perfis sem rosto** de tema amplo para empreendedor brasileiro (ex.: "Vender Online Sem Enrolação" e "Brás por Dentro"), que crescem por conteúdo útil e levam para a marca.
4. **Funil em 4 andares** (seção 6): chamar atenção → gerar confiança → conversa no direct (ManyChat: "comenta LOJA que eu te mando") → loja criada / diagnóstico / migração. Marketing **indireto** (dica, polêmica, bastidor) e **direto** (oferta, demonstração, prazo) convivem numa proporção de 70/20/10.
5. **Tudo rastreado no sistema** (seção 7): cada vídeo tem um link próprio (`/v/CODIGO`) com `utm` e, quando for o caso, o `ref` do parceiro; comentário-palavra-chave → direct → link com código → cadastro de loja → pagamento. O Master mostra **"qual vídeo trouxe qual lojista pagante"**.
6. **No sistema, isso vira o "Estúdio de Conteúdo"** (seção 9): pauta, roteiro com IA, dia de gravação no celular (lista de tomadas, teleprompter, tela dividida), biblioteca de arquivos, agenda de postagens, publicação automática onde a rede permite (Instagram e YouTube primeiro; TikTok depende de aprovação do app), caixa de comentários e placar de resultado por vídeo.
7. **Produto futuro** (seção 11): o mesmo Estúdio vai para o painel do lojista, em camadas por plano (pauta e roteiro no plano de entrada; agenda e publicação no intermediário; automação de direct e placar por vídeo no Scale; produção feita pela agência como serviço da NextLevel Soluções).
8. **O que você não citou e eu incluí** (seção 12): autorização de imagem, regras de cada rede para automação, aviso de conteúdo com IA, biblioteca de ganchos, reaproveitamento de lives, rotina de comentários (os primeiros 60 minutos), banco de provas (prints reais), "pergunta da semana" com clientes, calendário de datas do varejo, kit de equipamento barato, papéis da equipe e o custo por lojista vindo do conteúdo.

---

## 1. Por que isso importa agora

- **Regra de foco D174:** vence o que aproxima a E-commerce do 10º lojista pagante. Conteúdo orgânico é o canal de menor custo por lojista que temos e alimenta todos os outros (parceiros, busca, executivos de rua, anúncios).
- **O público já está nas redes:** quem vende só no Instagram e no WhatsApp (persona P1/P2) consome Reels e TikTok todo dia. A dor dele (taxa alta, loja feia, depender do direct, não saber anunciar) é conteúdo pronto.
- **Temos matéria-prima que a concorrência não tem:** a trajetória do fundador no Brás, a equipe e o estúdio reais (D179), o sistema próprio para mostrar na tela, o programa de parceiros de 20% todo mês (D260) e a série do YouTube já roteirizada (6 vídeos que rendem de 30 a 48 cortes).
- **Já existe base técnica:** atribuição de origem (`src/lib/attribution.ts`, cookies `nl-attr`/`nl-ref`), links de parceiro com contagem de cliques (`partner_links`, `partner_clicks`), interessados com origem (`brand_leads.attribution`), pauta de gravação da Brás (`bd_content_items` com estados IDEIA → GRAVAR → GRAVADO → EDICAO → PUBLICADO). A fábrica **estende** isso; não cria um sistema paralelo.

---

## 2. Princípios da fábrica

1. **Grade antes de inspiração.** Toda semana tem os mesmos "programas" (formatos fixos). A criatividade vai no assunto, não em reinventar o formato.
2. **Gravar em lote, editar em lote, publicar no automático.** Um dia de gravação (3 a 4 horas) rende de 15 a 25 vídeos curtos.
3. **Um vídeo, várias redes, ajuste mínimo.** Gravado em 9:16, com legenda queimada e área segura; o sistema gera a versão de cada rede (texto, hashtags, capa, duração).
4. **Valor primeiro.** 7 em cada 10 vídeos ensinam ou resolvem algo sem pedir nada. É isso que faz o algoritmo e o público confiarem.
5. **Cada vídeo tem um único próximo passo.** "Comenta LOJA", "link na bio", "salva para depois", "manda para o sócio". Nunca três pedidos no mesmo vídeo.
6. **Tudo medido pelo que importa:** lojista pagante, não curtida. Curtida e visualização servem para escolher o próximo vídeo, não para comemorar.
7. **Honestidade como diferencial:** sem promessa de ganho, sem cliente inventado, sem "fature 10 mil no primeiro mês". Prova real (print do painel com permissão, número com data) vence exagero.

---

## 3. As cinco vozes (quem fala no vídeo)

| Voz | Quem aparece | Para que serve | Cuidados |
|---|---|---|---|
| **Fundador** | Mauricio, no escritório ou no Brás | Autoridade, opinião forte, bastidor, história | Falar de experiência própria; números só com data e fonte |
| **Empresa** | Logo, telas do sistema, equipe, locução | Demonstração, novidade, oferta, tutorial | Texto da marca vem de `getBrand()` nas peças geradas pelo sistema |
| **Especialista / influenciador** | Pessoa da equipe ou parceiro criador (trilha de parceiros) | Dica prática, "eu testei", comparação | Parceiro pago marca "publi" / "parceria paga" (regra do CONAR e das redes) |
| **Cliente** | Lojista **real**, com autorização de imagem assinada | Prova social, "como era antes e como ficou" | Nunca inventar. Encenação só com aviso visível "situação encenada" e sem dizer que é cliente |
| **Sem rosto ("dark")** | Mãos, tela, narração (voz própria ou voz sintética **avisada**), texto na tela | Escala, temas amplos, perfis de nicho | Aviso de conteúdo gerado com IA quando houver (as três redes exigem marcar) |

**Personagens de roteiro (encenação avisada)**, úteis para a "tela dividida" e para o humor do dia a dia:
- **"A Juliana do direct"**: vende pelo Instagram, responde 200 mensagens por dia e perde venda de madrugada.
- **"O Rodrigo da loja física"**: tem loja no bairro e acha que loja online "não é pra ele".
- **"A concorrência"**: plataforma genérica, taxa escondida, suporte por robô (sem citar nome, ou citando com fonte e data).
- **"O cunhado que sabe tudo"**: dá o conselho errado que o vídeo corrige.

Esses personagens são **interpretados e avisados**; ninguém é apresentado como cliente real.

---

## 4. A grade de formatos (12 programas fixos)

Cada formato tem: objetivo, rede principal, duração, como gravar no celular, gancho modelo e próximo passo. Os códigos (F01 a F12) viram valores no sistema.

### Andar 1: chamar atenção (topo)

**F01 · Tela dividida "Reage"** (Instagram, TikTok, Shorts · 20 a 45 s)
Metade de cima: um post, notícia, print de taxa da concorrência, vídeo de outro criador (respeitando o recurso nativo de "dueto"/"remix" ou só print com fonte). Metade de baixo: você reagindo e corrigindo.
Gancho: "Ele disse que loja online não vende mais. Olha o que ele esqueceu."
Gravar: app de câmera + modelo de edição com a moldura dividida pronta.

**F02 · Polêmica com dado** (todas · 30 a 60 s)
Uma opinião forte, defendida com um fato com fonte. Temas: "Vender só no Instagram é alugar a loja de outro", "Marketplace não é sua loja, é a vitrine do vizinho", "Taxa por venda é sócio que não trabalha".
Gancho: frase curta e contrária ao senso comum, nos 2 primeiros segundos.
Próximo passo: "Concorda? Comenta SIM ou NÃO" (gera comentário, que o algoritmo entende como interesse).

**F03 · "Onde a concorrência é fraca"** (Instagram, TikTok, YouTube · 30 a 60 s)
Um ponto fraco por vídeo, com comparação justa: taxa por venda, suporte, tempo para ficar pronto, programa de parceiros, tema bonito pago à parte. Sempre com fonte pública e data na tela (regra da série do YouTube).
Gancho: "Três coisas que ninguém te conta antes de assinar uma plataforma de loja."
Cuidado: comparar com regra publicada, nunca ofender; revisão jurídica rápida antes de publicar (lista em 8.4).

**F04 · Dia a dia / situação cotidiana** (Instagram, TikTok · 15 a 40 s)
Mini-esquete com os personagens da seção 3: "Quando o cliente pergunta o preço às 2h da manhã e a loja responde sozinha." Humor leve, problema real, solução mostrada em 3 segundos de tela.
Aviso: "situação encenada" na tela.

**F05 · Tendência adaptada** (TikTok, Reels · 10 a 30 s)
Áudio ou formato do momento (com áudio liberado para uso comercial nas contas de empresa), adaptado ao lojista. A pauta recebe 2 tendências por semana; a que tiver ligação com o tema entra, a que for forçada é descartada.

### Andar 2: gerar confiança (meio)

**F06 · Tutorial em 60 segundos** (todas · 45 a 90 s)
"Como colocar frete grátis acima de R$ 199", "Como montar sua vitrine em 10 minutos". Tela do celular gravada + rosto no canto (ou só tela, no perfil sem rosto).
Próximo passo: "Salva para fazer depois."

**F07 · Bastidor do escritório / Brás** (Instagram Stories, Reels, TikTok · 15 a 60 s)
A equipe trabalhando, a loja de um cliente sendo montada, o estúdio, a visita ao Brás. Mostra que existe gente de verdade por trás.

**F08 · Antes e depois de loja real** (Reels, TikTok, Shorts · 30 a 60 s)
Loja do cliente antes (ou só o Instagram dele) e depois, com autorização. Números só se o cliente autorizar e com data.

**F09 · Pergunta da semana** (todas · 30 a 60 s)
Responde uma pergunta real que chegou no direct, no WhatsApp ou na caixa de atendimento do sistema. Fonte infinita de pauta e prova de que a empresa escuta.

**F10 · História curta do fundador** (Instagram, YouTube, LinkedIn · 45 a 90 s)
Episódios: o Brás, as importadoras chinesas, o primeiro cliente, o erro que custou caro, por que criou a NextLevel. Conecta com o slide de história da série do YouTube.

### Andar 3 e 4: conversa e decisão (fundo)

**F11 · Demonstração direta + palavra-chave** (todas · 30 a 60 s)
Mostra uma função do sistema resolvendo uma dor, termina com "Comenta LOJA que eu te mando o link para testar 3 dias grátis". É aqui que entra a automação de direct (seção 6).

**F12 · Oferta com prazo / evento** (todas, Stories, live · 15 a 60 s + live de 30 a 60 min)
Black Friday, mês de migração, live "monto sua loja ao vivo", diagnóstico gratuito. Sem urgência falsa: prazo real, configurado no sistema.

### Formatos de apoio (sem dia fixo)
- **Carrossel** (Instagram, LinkedIn): versão em imagens de F02, F03 e F06. O sistema pode gerar a partir do roteiro.
- **Live semanal** (Instagram ou YouTube): "Plantão da loja online", 40 minutos, perguntas ao vivo; rende 5 a 8 cortes.
- **Cortes da série do YouTube**: de 5 a 8 por vídeo longo, entram como F06/F10/F03 conforme o capítulo.
- **Stories diários**: enquete, caixinha de perguntas, bastidor; alimentam a pergunta da semana (F09).

### Proporção (por semana)
- **70% valor/indireto:** F01, F02, F04, F05, F06, F07, F09, F10.
- **20% prova/confiança com chamada leve:** F03, F08.
- **10% direto:** F11, F12.

---

## 5. Perfis (com e sem rosto)

| Perfil | Rosto | Tema | Formatos principais | Papel no funil |
|---|---|---|---|---|
| **@nextlevelcommerce** (marca) | Equipe + telas | Loja virtual, novidades, clientes | F06, F08, F11, F12, carrossel | Fundo: decisão |
| **Perfil pessoal do Mauricio** | Sim | Empreender, Brás, opinião, bastidor | F01, F02, F03, F07, F10 | Topo e meio: autoridade |
| **Sem rosto 1: "Vender online sem enrolação"** (nome a definir) | Não | Dicas para quem vende no Instagram/WhatsApp, ferramentas, erros comuns | F01 (com print), F05, F06 (só tela), F09 | Topo amplo; leva para a marca |
| **Sem rosto 2: "Brás por dentro" / atacado e revenda** (nome a definir) | Não | Comprar para revender, atacado, fornecedores, tendências de produto | F02, F05, F06, listas e rankings | Topo do público revendedor; leva para a marca e, depois, para a Brás |
| **LinkedIn do Mauricio e da empresa** | Sim | Gestão, tecnologia, agência, white label | F10, carrossel, texto | Frente `nextlevelgroup.com.br` (D287) |
| **Canal do YouTube** | Sim | Série comercial + plantão | Vídeo longo, Shorts, live | Meio e fundo |

**Regras dos perfis sem rosto:**
- Dizem na bio quem está por trás ("um projeto NextLevel") ou levam para a marca de forma clara. Perfil que esconde ser empresa vendendo para a empresa vira propaganda disfarçada, o que o CONAR proíbe.
- Nada de seguidor comprado, nem rede de perfis falsos comentando uns nos outros (as redes derrubam a conta e o alcance).
- Voz sintética e imagem gerada com IA são marcadas com a etiqueta da própria rede.
- Cada perfil tem uma "bíblia" curta: público, tom, 5 temas, 3 proibições, palavra-chave própria (ex.: "VITRINE", "ATACADO").

---

## 6. O funil (com automação de direct)

```
VER  ──►  CONFIAR  ──►  CONVERSAR  ──►  DECIDIR  ──►  PAGAR  ──►  INDICAR
F01-F05    F06-F10       F11 + ManyChat   loja 3 dias    plano      vira parceiro
                         (comenta LOJA)   diagnóstico               (link /r/...)
                                          migração
```

### 6.1 Automação "comenta e recebe no direct" (ManyChat)
- **Ferramenta:** ManyChat (parceira oficial da Meta para Instagram e Messenger; também tem TikTok em fase de testes e WhatsApp). Alternativas brasileiras para comparar no momento da contratação: as que usam a API oficial da Meta. Só usar ferramenta que trabalhe pela **API oficial**; robô que entra com senha derruba a conta.
- **Fluxo padrão:**
  1. Vídeo F11 termina com "comenta LOJA".
  2. A ferramenta responde o comentário publicamente ("Te mandei no direct!") e manda a mensagem privada.
  3. No direct: uma pergunta de qualificação com botões ("Você já vende? Instagram / Loja física / Outra plataforma / Ainda não vendo").
  4. Manda o link **com código do vídeo** (`/v/CODIGO?k=LOJA`) para a página certa: criar loja (3 dias grátis), diagnóstico gratuito ou migração.
  5. Pede e-mail ou WhatsApp **com consentimento** (LGPD) e envia para o sistema (seção 7.3).
  6. Se não clicou em 23 horas, um lembrete (a Meta só permite responder livremente até 24 horas depois da última mensagem da pessoa).
- **Palavras-chave padrão:** LOJA (criar loja), MIGRAR (migração), DIAGNÓSTICO (diagnóstico gratuito), PARCEIRO (programa de 20%), ATACADO (modalidades de atacado), TEMA (temas pagos).
- **Limites das redes que a fábrica respeita:** sem mensagem para quem não falou primeiro; sem disparo em massa; respostas variadas (não o mesmo texto 500 vezes); conta profissional do Instagram ligada a uma página.

### 6.2 Marketing indireto × direto
- **Indireto:** o vídeo resolve um problema e a marca aparece como "quem sabe disso". O próximo passo é salvar, seguir ou comentar. Mede-se por alcance, salvamentos, seguidores e comentários de palavra-chave espontâneos.
- **Direto:** o vídeo mostra o produto, o preço (quando permitido, ver regra de "preço de serviço só em reunião" na série do YouTube; preço de plano é público) e a oferta. Mede-se por clique, loja criada e pagamento.

### 6.3 Ligação com o que já existe
- **Parceiros (D260):** criadores parceiros usam a mesma grade e o mesmo kit; o link deles é o `/r/...` deles; o vídeo do parceiro é registrado com o código do vídeo + `ref`.
- **Executivos de rua (CX):** recebem os vídeos da semana para mandar no WhatsApp dos clientes que visitaram, com o código deles.
- **Base de conhecimento (D264):** trilha "conteúdo" ensina a grade, a gravação e as regras.
- **Busca e IA:** vídeos tutoriais (F06) viram texto nas páginas de ajuda e de "aprender" (S-fases do plano de busca).

---

## 7. Rastreamento (o coração da fábrica)

### 7.1 Código do vídeo
Cada peça recebe um código curto e legível: `AAMMDD-FORMATO-PERFIL-N`. Ex.: `261118-F11-MARCA-2`.
- O código vai na URL curta (`nextlevelcommerce.com.br/v/261118-F11-MARCA-2`), que redireciona para a página de destino com `utm_source=<rede>`, `utm_medium=organico|direct|bio|stories`, `utm_campaign=<pauta/campanha>`, `utm_content=<código>` e, quando houver, `ref=<parceiro>`.
- Bio de cada perfil: link `/v/bio-<perfil>` (página com os 3 a 5 links da semana, todos com código).
- O proxy já grava o último toque (`nl-attr`); o código do vídeo passa a ser guardado também.

### 7.2 Do vídeo ao lojista pagante
`vídeo → clique (/v/...) → interessado (brand_leads.attribution) ou loja criada (cadastro) → assinatura paga → renovação`.
O Master responde: **quantos lojistas pagantes cada formato, perfil, voz e assunto trouxe, e quanto custou** (horas de equipe + ferramenta).

### 7.3 Do direct ao sistema
A ferramenta de direct manda o contato (nome, @, canal, palavra-chave, código do vídeo, consentimento) para um **endpoint de entrada com assinatura** (segredo compartilhado criptografado; nunca confiar no corpo sem conferir a assinatura; idempotência por `dedupeKey`). Vira um `brand_leads` com `kind` novo `SOCIAL` (ou `needs`/`attribution` preenchidos) e aparece no CRM do Master já com a origem.

### 7.4 Números que voltam das redes
- Primeira fase: o próprio sistema conta cliques, interessados, lojas e pagamentos (o que já é nosso).
- Segunda fase: buscar das redes visualizações, alcance, retenção, salvamentos e comentários (Instagram Graph API, YouTube Analytics API, TikTok API quando aprovada), uma vez por dia.
- Painel "Placar do conteúdo" no Master: por vídeo, por formato, por perfil, por voz, por semana; e o ranking "os 10 vídeos que mais trouxeram lojista pagante".

---

## 8. A rotina (um dia de gravação por semana)

### 8.1 Semana-tipo
| Dia | O que acontece | Quem |
|---|---|---|
| Segunda | Reunião de pauta (30 min): placar da semana passada, perguntas reais, tendências, datas do varejo. Sai a lista de 15 a 25 roteiros | Mauricio + quem cuida de conteúdo |
| Terça | Roteiros prontos e revisados no sistema (com ajuda da IA); lista de tomadas por cenário | Conteúdo |
| **Quarta** | **Dia de gravação (3 a 4 h)**, agrupado por cenário e roupa: mesa do escritório, tela do celular, Brás/rua, estúdio | Mauricio + 1 pessoa |
| Quinta | Edição em lote com modelos prontos (legenda, moldura, tela dividida, capa) | Edição |
| Sexta | Revisão (lista 8.4), textos de cada rede, agendamento da semana seguinte | Conteúdo |
| Todo dia | 2 janelas de 20 min para comentários e direct (a primeira hora depois de postar é a mais importante) | Atendimento |

### 8.2 Ritmo de postagem sugerido (por perfil)
- Marca: 1 Reel/TikTok por dia útil + Stories diários + 2 carrosséis por semana + 1 live.
- Mauricio: 4 a 5 vídeos por semana + Stories de bastidor.
- Cada perfil sem rosto: 1 a 2 vídeos por dia (formato de produção mais rápido).
- YouTube: Shorts todo dia útil (os mesmos cortes) + 1 longo a cada 2 semanas.
Começar com metade disso nas 4 primeiras semanas e subir conforme o ritmo da equipe aguentar.

### 8.3 Kit de gravação no celular (barato)
- Celular com câmera traseira boa (gravar em 4K ou 1080p 30 fps, 9:16).
- Microfone de lapela sem fio (dois transmissores para conversas).
- Luz de anel ou painel de LED + luz da janela.
- Tripé de mesa e tripé de chão; suporte para gravar a tela do computador por cima do ombro.
- Teleprompter no celular (o próprio sistema, seção 9) ou app de teleprompter.
- Aplicativo de edição com modelos (CapCut ou similar); o sistema guarda os modelos da marca.
- Fundo do escritório arrumado com a marca visível; segundo cenário no estúdio.

### 8.4 Lista de revisão antes de publicar
1. O gancho aparece nos 2 primeiros segundos?
2. Tem um único próximo passo?
3. Algum número? Tem fonte e data?
4. Algum cliente aparece? Tem autorização de imagem?
5. Fala de concorrente? Regra publicada, fonte, sem ofensa?
6. Promete ganho? Se sim, refazer.
7. Encenação marcada? IA marcada? Parceria paga marcada?
8. Legenda queimada sem erro, área segura respeitada?
9. Link com código do vídeo?
10. Áudio liberado para uso comercial?

---

## 9. O que o sistema precisa ter ("Estúdio de Conteúdo")

Mapa anti-duplicação (estender, não recriar):

| Necessidade | Já existe | Como estender |
|---|---|---|
| Pauta e estados | `bd_content_items` (Brás) e `content_items` (fornecedor) | Tabela de conteúdo **por marca/tenant** com os mesmos estados (IDEIA → ROTEIRO → GRAVAR → GRAVADO → EDICAO → REVISAO → AGENDADO → PUBLICADO), reaproveitando o padrão da Brás; a Brás passa a usar a mesma tabela depois |
| Link rastreado | `partner_links` + `partner_clicks` | Link curto `/v/CODIGO` no mesmo padrão (hash com sal de IP/agente, LGPD) e ligação opcional com o parceiro |
| Origem do visitante | `src/lib/attribution.ts`, `brand_leads.attribution` | Guardar `utm_content` = código do vídeo; `kind` `SOCIAL` para quem vem do direct |
| Arquivos | `store_assets` (imagem em base64 no banco) | **Vídeo não cabe no banco.** Armazenamento de objetos (R2/S3) pela interface `AssetStorage` já prevista em `src/lib/storage/assets.ts`, com envio direto do celular por URL assinada |
| Integração com token | Padrão do Pixel da Meta (D187) e da central de aplicativos | Conexões Instagram/Facebook, YouTube, TikTok e ManyChat como aplicativos, token com `encryptSecret` |
| Agenda e envio | Rotinas existentes (`emitEvent`) | Fila de publicação com horário, nova tentativa e registro do resultado |
| Treino da equipe | Base de conhecimento (D264) | Trilha "conteúdo" aponta para este documento e para a grade |
| IA para texto | Planos de IA (`mauricio-ia-v3-padrao-hostinger.md`) | Gerador de roteiro, gancho, legenda e hashtags dentro do mesmo painel de IA |

### 9.1 Telas (Master primeiro, celular primeiro)
1. **Grade** (`/master/conteudo/grade`): os 12 formatos, as vozes, os perfis e a proporção 70/20/10 da semana; tudo editável em `platform_settings` (regra configurável, não fixa no código).
2. **Pauta** (`/master/conteudo`): quadro por estado, filtro por perfil, formato e voz; "pergunta da semana" puxa perguntas reais da caixa de atendimento.
3. **Roteiro**: gancho, desenvolvimento, próximo passo, palavra-chave, cenário, voz, avisos (encenação, IA, parceria), fonte dos números; botão "sugerir 5 ganchos" (IA); lista de revisão 8.4 como travas.
4. **Dia de gravação (modo celular)**: lista de tomadas agrupada por cenário; ao tocar numa tomada abre o **teleprompter** com o roteiro, contagem regressiva e **gravação pelo navegador** (câmera do celular) com moldura de área segura e opção de **tela dividida** (metade de cima com o print/vídeo de referência); o arquivo sobe direto para a biblioteca ligado ao roteiro. Marcar "boa", "refazer".
5. **Biblioteca**: brutos e editados por roteiro, com versão por rede, capa e legenda (`.srt`).
6. **Agenda**: calendário da semana por perfil e rede; arrastar para mudar horário; estado de cada envio (agendado, publicado, falhou e por quê).
7. **Caixa de comentários e direct**: o que chegou por palavra-chave, quem já virou interessado, quem falta responder.
8. **Placar do conteúdo**: do vídeo ao lojista pagante (seção 7).

### 9.2 Publicação automática (o que cada rede permite)
- **Instagram (Reels, carrossel, Stories, imagem):** pela API oficial da Meta para contas profissionais, com limite diário de publicações por conta. Fazer primeiro.
- **YouTube (Shorts e vídeos):** pela API do YouTube; envio consome cota diária do projeto (pedir aumento quando o volume crescer). Fazer junto com o Instagram.
- **TikTok:** API de postagem de conteúdo exige aprovação (auditoria) do aplicativo; até lá, o vídeo sai como **rascunho na conta** ou com **lembrete no celular** para postar manualmente com o texto já copiado.
- **Facebook e LinkedIn:** depois, mesmo padrão.
- **Plano B universal:** "postar agora pelo celular": o sistema baixa o arquivo, copia o texto e abre o aplicativo da rede.

---

## 10. Riscos e cuidados

- **Contas derrubadas:** automação fora da API oficial, seguidores comprados, rede de perfis falsos. Proibido.
- **Depoimento falso / propaganda disfarçada:** CONAR e Código do Consumidor; risco de multa e de reputação. Encenação sempre avisada.
- **Direitos:** música sem licença comercial, vídeo de terceiro reutilizado sem recurso nativo, imagem de cliente sem autorização.
- **LGPD:** contato do direct só com consentimento e finalidade clara; opção de sair; nada de dado sensível; origem guardada sem IP puro.
- **Concorrência:** citar regra publicada com fonte e data; nada de afirmação que não dá para provar.
- **Esgotamento do fundador:** a grade só funciona se couber na semana; começar com metade do ritmo; ter uma segunda voz da equipe em 60 dias.
- **Métrica de vaidade:** o placar mostra lojista pagante em primeiro lugar.

---

## 11. Produto futuro para os clientes ("Estúdio de Conteúdo" do lojista)

O mesmo motor, com a marca aberta pelo endereço (`getBrand()`), dentro do painel do lojista:

| Camada | O que o lojista recebe | Plano sugerido |
|---|---|---|
| Pauta e roteiro | Grade de formatos adaptada ao nicho dele, 30 ideias por mês, gerador de gancho e legenda | Entrada (como diferencial de venda) |
| Gravação e biblioteca | Modo celular com teleprompter e tela dividida, biblioteca de vídeos | Intermediário |
| Agenda e publicação | Programar e publicar no Instagram e YouTube da loja | Intermediário |
| Direct automático e rastreio | Palavra-chave → direct → link do produto com código do vídeo → pedido na loja; placar "qual vídeo vendeu" | Scale |
| Feito pela agência | Dia de gravação no estúdio da NextLevel + edição + gestão (serviço da NextLevel Soluções, preço em reunião) | Serviço à parte |

Diferencial para vender: **"o vídeo que vendeu"**: o lojista vê o pedido da loja ligado ao vídeo que o trouxe. A maioria das plataformas de loja não liga conteúdo a pedido.
Permissões: cada loja só vê o próprio conteúdo, as próprias conexões e o próprio placar (tenant isolado).

---

## 12. O que estava faltando (proposto)

1. **Autorização de imagem** (cliente, equipe, parceiro) guardada no sistema e ligada ao vídeo; reaproveitar o fluxo de contratos com assinatura no painel.
2. **Biblioteca de ganchos** que funcionaram (o placar alimenta a lista).
3. **Banco de provas**: prints reais (com permissão), números com data, menções na imprensa, para usar nos vídeos de confiança.
4. **Calendário do varejo**: Dia das Mães, Dia dos Namorados, Dia dos Pais, Dia das Crianças, Black Friday, Natal, volta às aulas; pauta automática 30 dias antes.
5. **Reaproveitamento em cascata**: live → cortes → carrossel → texto do blog/ajuda → e-mail da semana.
6. **Rotina de comunidade**: responder todo comentário na primeira hora; fixar a melhor pergunta; transformar em F09.
7. **Papéis**: apresentador (Mauricio), roteirista/pauta, editor, responsável pela caixa de direct; no começo, 2 pessoas acumulam.
8. **Custo por lojista vindo do conteúdo** (horas + ferramentas ÷ lojistas pagantes) para comparar com anúncio e parceiro.
9. **Anúncio impulsionando o orgânico que já deu certo**: só vídeos com placar bom recebem verba (o Pixel da Meta já existe, D187).
10. **Colaborações**: vídeo em conjunto ("collab" do Instagram) com parceiros criadores e clientes; aparece nos dois perfis.
11. **Grupo/canal de transmissão** no Instagram e no WhatsApp para quem já segue (novidades, lives).
12. **Teste A/B de capa e gancho** (duas versões do mesmo vídeo em perfis diferentes ou em semanas diferentes).
13. **Segurança das contas**: verificação em duas etapas, acesso por papel no gerenciador da Meta, nada de senha compartilhada.

---

## 13. Fases (ordem recomendada)

| Fase | Entrega | Depende de |
|---|---|---|
| **CF0 · Manual (sem código)** | Grade aprovada, bíblias dos perfis, 1º dia de gravação, ManyChat configurado com LOJA e MIGRAR, links com `utm_content` montados à mão | Dono aprovar este documento |
| **CF1 · Link do vídeo e placar básico** | `/v/CODIGO`, contagem de cliques, código do vídeo na origem do interessado e da loja, "Placar do conteúdo" com cliques → interessados → lojas → pagantes | CF0 |
| **CF2 · Pauta e roteiro no Master** | Tabela de conteúdo por marca/tenant, quadro de estados, roteiro com travas da lista 8.4, grade em `platform_settings` | CF1 |
| **CF3 · Entrada do direct** | Endpoint assinado para a ferramenta de direct, `brand_leads` com origem social, CRM mostrando a palavra-chave e o vídeo | CF1 |
| **CF4 · Dia de gravação no celular + biblioteca** | Teleprompter, gravação no navegador com tela dividida, envio direto para armazenamento de objetos | Armazenamento de objetos (R2/S3) contratado |
| **CF5 · Agenda e publicação** | Conexões Instagram e YouTube (tokens criptografados), fila com nova tentativa, plano B "postar pelo celular"; TikTok como rascunho | Apps aprovados na Meta e no Google |
| **CF6 · Números das redes** | Coleta diária de alcance, retenção e salvamentos; ranking de ganchos | CF5 |
| **CF7 · IA de roteiro** | Ganchos, roteiro, legenda e hashtags no padrão de IA do sistema | Plano de IA (IA0) |
| **CF8 · Produto do lojista** | Estúdio no painel do lojista, por plano, isolado por loja; "o vídeo que vendeu" ligado a pedidos | CF1 a CF5 estáveis |

**Começar já pelo CF0** (não precisa de código) e **CF1** (pequeno, aproveita a atribuição existente, e é o que prova o canal).

---

## 14. Prompt engenheiro mestre (para colar numa sessão de trabalho)

```text
Você vai desenvolver a "Fábrica de conteúdo e funil nas redes sociais" da NextLevel
Commerce, fase <CFx>, descrita em docs/prompts/fabrica-conteudo-funil-redes-sociais.md.

ANTES DE COMEÇAR
1. Leia CLAUDE.md, AGENTS.md, docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md e este
   documento inteiro. Leia o guia do Next.js em node_modules/next/dist/docs/ antes de
   criar rota nova.
2. Procure e estenda antes de criar (regra anti-duplicação):
   - atribuição: src/lib/attribution.ts e src/proxy.ts (cookies nl-attr / nl-ref);
   - links e cliques: partner_links e partner_clicks em src/db/schema.ts;
   - interessados: brand_leads (attribution, kind, needs) e o CRM em src/app/master/crm;
   - pauta: bd_content_items (Brás) como modelo de estados;
   - arquivos: src/lib/storage/assets.ts (interface AssetStorage);
   - integrações com token: padrão do Pixel da Meta (D187) e a central de aplicativos;
   - regra configurável: platform_settings (nunca número ou lista fixa no código).
3. Relate primeiro: diga ao dono, em português simples e sem jargão, o que vai criar,
   o que vai reaproveitar e o que fica para a próxima fase. Se algo desta proposta
   conflitar com a Constituição ou uma decisão aprovada, explique e registre.

REGRAS
- Toda ação passa pelo domínio (src/lib/domain/conteudo.ts ou nome equivalente) e por
  runAction; permissões no servidor (requireRole, assertCanAccess); um tenant nunca lê
  conteúdo, conexões ou placar de outro.
- Páginas que consultam o banco declaram export const dynamic = "force-dynamic".
- Tokens de Instagram, YouTube, TikTok e ManyChat só com encryptSecret; nunca em tela,
  log ou e-mail.
- Entrada de webhook (direct): conferir assinatura com segredo criptografado, nunca
  confiar no corpo, idempotência por dedupeKey, consentimento LGPD obrigatório.
- Cliques com hash com sal (IP e agente), igual partner_clicks.
- Textos ao usuário em português claro; sem promessa de ganho; marca por getBrand().
- Acessibilidade AA, sem rolagem horizontal em 360 px; a tela de gravação é pensada
  primeiro para o celular.
- Alterou src/db/schema.ts: npx drizzle-kit generate --name <assunto> e commite drizzle/.
- Mudança de comportamento sem teste não entra.

ESCOPO POR FASE
- CF1: rota pública /v/[codigo] que registra o clique e redireciona com utm_source,
  utm_medium, utm_campaign, utm_content=<codigo> e ref (quando houver); o proxy guarda
  o código na atribuição; cadastro de loja e brand_leads passam a guardar o código;
  tela "Placar do conteúdo" no Master (cliques → interessados → lojas criadas →
  pagantes, por código, formato, perfil e semana); cadastro simples de "peça de
  conteúdo" com código gerado (AAMMDD-FORMATO-PERFIL-N).
- CF2: tabela de conteúdo por marca/tenant (estados IDEIA, ROTEIRO, GRAVAR, GRAVADO,
  EDICAO, REVISAO, AGENDADO, PUBLICADO; formato F01..F12 vindo de platform_settings;
  voz; perfil; palavra-chave; avisos de encenação, IA e parceria; fontes), quadro de
  pauta, editor de roteiro com a lista de revisão como travas para passar a AGENDADO.
- CF3: endpoint de entrada do direct (ManyChat ou similar) assinado; cria/atualiza
  brand_leads com origem social, palavra-chave e código do vídeo; aparece no CRM.
- CF4: modo celular do dia de gravação (lista de tomadas por cenário, teleprompter,
  gravação pelo navegador com moldura 9:16 e tela dividida, envio direto ao
  armazenamento de objetos por URL assinada via AssetStorage).
- CF5: conexões Instagram e YouTube como aplicativos; fila de publicação com horário,
  nova tentativa e motivo da falha; TikTok como rascunho/lembrete; plano B "postar pelo
  celular".
- CF6 a CF8: conforme a seção 13.

TESTES E ENTREGA
- Testes de domínio (Vitest) para: geração e unicidade do código, redirecionamento com
  utm, atribuição até a loja paga, isolamento entre tenants, assinatura e idempotência
  do webhook, travas do roteiro.
- e2e (Playwright) do caminho principal da fase, em 360 px e 1440 px, com axe sem
  violações graves.
- Durante o trabalho: npx tsc --noEmit, npx eslint src e2e tests e os testes dos
  arquivos mexidos. No fim da rodada: npx vitest run e npm run build.
- Registre a decisão em docs/design/DECISIONS.md com a frente [E-commerce], cite-a na
  base de conhecimento (docs/conhecimento/BC0-INVENTARIO.md) e rode
  node scripts/gerar-novidades.mjs.
- Commit em português; push na branch designada; mande ao dono o print real da
  principal tela da fase (placar, pauta ou modo de gravação).
- Relatório do dia com a linha "Esforço do dia por frente".
```

---

## 15. Decisões que o dono precisa tomar

1. Aprovar a grade de 12 formatos e a proporção 70/20/10 (ou ajustar).
2. Nomes e temas dos 2 perfis sem rosto.
3. Quem será a segunda voz da equipe (em até 60 dias).
4. Ferramenta de direct: ManyChat (recomendada pela integração oficial com a Meta) ou outra com API oficial.
5. Armazenamento de vídeo (R2 da Cloudflare é o mais barato para muitos downloads; S3 é a alternativa).
6. Dia fixo de gravação (sugestão: quarta-feira).
7. Liberar a fase CF1 (pequena, prova o canal com números do próprio sistema).
