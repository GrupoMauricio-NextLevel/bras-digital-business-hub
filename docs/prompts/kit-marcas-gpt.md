# Reformulação completa de cada marca no GPT (logo + sistema visual), como no Brás Digital Club

Decisão do dono (17/10/2026): **reformular tudo**, marca por marca, do mesmo jeito que o Brás Digital Club (D158): logo nova
e sistema visual completo. O GPT cria; o dono escolhe; o Claude aplica no sistema (painel + página pública), com fonte única,
tema isolado, claro/escuro, ícones e conferência visual.

## Ordem
| # | Marca | Por quê |
|---|---|---|
| 1 | **NextLevel (grupo)** | É a marca-mãe: define a família (como as marcas "assinam" o grupo, tipografia de apoio, navy/off-white compartilhados ou não). Vitrine em nextlevelgroup.com.br e no Master. Tudo que vier depois se encaixa nela. |
| 2 | **NextLevel Commerce** | Produto foco. |
| 3 | **SuperDrop** | Em produção com clientes: troca de marca com cuidado (aviso aos clientes, e-mails, loja). |
| 4 | **NextLevel Cargas** | Hoje a mais incompleta (logo escura com fundo sólido, sem monograma). |
| 5 | **Família do grupo**: NextLevel Club, Loja NextLevel, Meu Contador, Parceiros NextLevel | Submarcas: derivam da marca-mãe nova; uma conversa para as quatro. |

Uma marca por conversa no ChatGPT, em **duas etapas**: A (propostas) → você escolhe → B (kit completo). Mande o ZIP final aqui
e diga "aplica a marca X". O ZIP `referencias-marcas-gpt.zip` traz as logos atuais (só para contexto) e a prancha do Brás
Digital Club (referência de **qualidade e formato de entrega**, não de estilo).

## Paletas já usadas no grupo (cada marca nova precisa ser distinguível destas)
- Brás Digital Club: navy #0C1830, azul elétrico #315CFF, ciano #00D4FF (símbolo circular "b"/pulso).
- Marcas ainda não reformuladas usam hoje: NextLevel amarelo #F5BC00, Commerce azul #2F81F4, SuperDrop verde #2D9E3B, Cargas índigo #4B4FD8 (podem mudar).
- Conforme cada marca for aprovada, acrescente a paleta nova nesta lista antes de começar a próxima.

---

## ETAPA A: propostas (cole primeiro)

```
Você é diretor de criação e designer de identidade de marca. Vamos REFORMULAR por completo a marca abaixo: logo nova e sistema
visual completo para um site institucional e um painel de sistema (SaaS) usados todo dia. Em anexo: as logos ATUAIS (só para
contexto do que existe, não precisa manter) e a prancha do Brás Digital Club, outra marca do grupo já reformulada: use como
referência do nível de acabamento e do formato de entrega, NÃO copie o estilo, o símbolo nem as cores dela.

BRIEFING
- Nome exato: {NOME}
- O que faz: {O_QUE_FAZ}
- Para quem: {PARA_QUEM}
- Personalidade: {PERSONALIDADE}
- Slogan atual (pode propor melhor): "{SLOGAN}"
- Grupo: faz parte do Grupo NextLevel ({RELACAO_COM_O_GRUPO})
- Paletas já usadas no grupo, a nova precisa ser claramente diferente: {PALETAS_OCUPADAS}
- Evitar: visual genérico de IA, gradiente roxo, ícone de carrinho/caixa óbvio, mascote, clichê de foguete; nada de números,
  selos ou prêmios inventados.

ENTREGUE AGORA 3 DIREÇÕES DIFERENTES, cada uma numa prancha 1672×941 com:
- símbolo/monograma + assinatura horizontal (fundo claro e fundo escuro);
- paleta com 4 cores em hexadecimal (base escura, cor principal de ação, cor de destaque, neutro claro);
- 1 frase de racional (o que o símbolo representa);
- 2 propostas de slogan curto (até 7 palavras, sem promessa de ganho).
O nome deve estar escrito EXATAMENTE como acima, com acentos. Depois das 3 pranchas, diga qual você recomenda e por quê.
```

## ETAPA B: kit completo (cole depois de escolher, ex.: "Direção 2, slogan B")

```
Aprovado: Direção {N}, slogan "{SLOGAN_ESCOLHIDO}". Agora produza o KIT OFICIAL completo, fiel à direção aprovada (mesmo
símbolo, mesma tipografia, mesmas cores; sem redesenhar entre um arquivo e outro). Um arquivo por imagem, PNG, nomes exatos:

logos/flat/
  logo-clara.png — para fundo claro, FUNDO TRANSPARENTE (canal alfa real), ~2000 px de largura, respiro de 4%
  logo-escura.png — para fundo escuro: lettering off-white, FUNDO TRANSPARENTE (nunca a cor de fundo embutida)
  logo-clara-com-slogan.png e logo-escura-com-slogan.png — assinatura + slogan, fundo transparente
logos/vertical/
  logo-vertical-clara.png e logo-vertical-escura.png — símbolo em cima, nome embaixo, ~1180×1330, fundo transparente
logos/monogramas/
  monograma-claro.png e monograma-escuro.png — só o símbolo, 1254×1254, fundo transparente
logos/favicons/
  favicon-16.png, favicon-32.png, favicon-48.png e favicon.ico — símbolo simplificado legível em tamanho mínimo
logos/app-icons/
  app-icon-master.png (1254×1254, símbolo sobre a cor-base escura, sem texto), apple-touch-icon-180.png, icon-192.png, icon-512.png
3d/ (peças de campanha 1672×941, fundo opaco escuro, SEM nenhum texto nem logo escrita)
  00-master-flat.png — o símbolo plano, editorial
  01-vidro-optico.png — o símbolo em vidro óptico, reflexo no chão, centralizado
  02-metal-anodizado-sem-texto.png — o símbolo em metal anodizado, à ESQUERDA do quadro (entre 20% e 55% da largura), lado
    direito livre e escuro para o texto do site (é a imagem do topo da página)
  03-camadas-translucidas.png — camadas translúcidas, luz na cor de destaque
  04-arquitetura-de-luz-cinetica.png — luz cinética, para vídeo/movimento
referencias/
  brand-board-aprovado.png — prancha 1672×941: logo clara e escura, símbolo, monograma, paleta com hexadecimais, aplicação clara e escura

Arquivos de texto:
  tokens/brand-tokens.json e tokens/brand-tokens.css — cores da marca e papéis claro/escuro (surface, surfaceMuted,
    surfaceBrandSoft, border, text, textMuted, action, actionHover, focus) com contraste AA conferido (texto 4,5:1; foco 3:1)
  integration/brand.config.json — { id, name, shortName, tagline, publicRoute, canonicalUrl: null, theme{...}, assets{caminhos} }
  docs/RACIONAL-DIRECAO-VISUAL.md — ideia central, papel de cada cor (proporção de uso), uso no site × no painel, regras das logos
  docs/INVENTARIO.md — todos os arquivos, dimensões e se o fundo é transparente

REGRAS: transparência real em logos/monogramas (sem quadriculado desenhado); nada de sombra, contorno, brilho ou deformação
nas logos (nas peças 3D pode); nome e slogan escritos exatamente, com acentos (se algum arquivo sair com erro de letra, refaça);
nada inventado (números, clientes, selos). No final, um ZIP {ARQUIVO}.zip com a pasta {PASTA}/ contendo tudo acima.
```

---

## Briefing de cada marca (preencha os campos da Etapa A)

### 1. NextLevel (grupo) · ZIP `nextlevel-grupo-v2` · pasta `nextlevel`
- NOME: NextLevel (linha de apoio na assinatura: "Grupo NextLevel" ou "Soluções Digitais", proponha)
- O_QUE_FAZ: grupo de tecnologia e serviços para quem vende online no Brasil: opera SuperDrop, NextLevel Commerce, Brás Digital Club e NextLevel Cargas, e vende loja montada, migração, temas, tráfego e consultoria. Também é o painel central (Master) de todas as marcas.
- PARA_QUEM: lojistas, marcas, importadoras e parceiros; e a própria equipe no painel.
- PERSONALIDADE: estrutura, confiança, ambição sem exagero, "o próximo nível" com método.
- SLOGAN: Estrutura digital para o seu negócio ir além.
- RELACAO_COM_O_GRUPO: é a marca-mãe; proponha também como as outras marcas "assinam" o grupo (ex.: selo "um sistema NextLevel").
- PALETAS_OCUPADAS: Brás Digital Club navy #0C1830, azul #315CFF, ciano #00D4FF.

### 2. NextLevel Commerce · ZIP `nextlevel-commerce-v2` · pasta `nextlevel-commerce`
- O_QUE_FAZ: plataforma de loja virtual com a marca do lojista: temas, Pix e cartão na conta do lojista, frete, painel.
- PARA_QUEM: marcas e lojistas, principalmente moda, que querem loja própria.
- PERSONALIDADE: elegante, editorial, confiável, "sua marca em primeiro lugar".
- SLOGAN: A loja da sua marca, pronta para vender.
- RELACAO_COM_O_GRUPO: produto do Grupo NextLevel (pode carregar "NextLevel" no nome; proponha se o símbolo deriva da marca-mãe nova).
- PALETAS_OCUPADAS: Brás Digital Club + a paleta aprovada do grupo NextLevel.

### 3. SuperDrop · ZIP `superdrop-v2` · pasta `superdrop`
- O_QUE_FAZ: loja online sem estoque; fornecedores parceiros separam, embalam e enviam cada pedido; o lojista vende.
- PARA_QUEM: quem quer começar a vender online sem estoque; fornecedores que querem revendedores.
- PERSONALIDADE: rápido, prático, otimista, energia de movimento.
- SLOGAN: Você vende. O fornecedor envia.
- RELACAO_COM_O_GRUPO: produto do grupo, nome próprio forte (sem "NextLevel" no nome).
- PALETAS_OCUPADAS: Brás Digital Club + grupo + Commerce aprovados.
- Atenção: já tem clientes; a marca nova precisa ser reconhecível como evolução (o nome continua).

### 4. NextLevel Cargas · ZIP `nextlevel-cargas-v2` · pasta `nextlevel-cargas`
- O_QUE_FAZ: transportadoras e ônibus de excursão levando as caixas do Brás para todo o Brasil; coleta, retirada por código, frete combinado.
- PARA_QUEM: transportadoras, motoristas, importadoras e lojistas que compram no Brás.
- PERSONALIDADE: robusta, organizada, rota e controle.
- SLOGAN: Movimento que chega com controle.
- RELACAO_COM_O_GRUPO: produto do grupo ligado ao Brás Digital Club (logística dele).
- PALETAS_OCUPADAS: todas as já aprovadas.

### 5. Família: NextLevel Club, Loja NextLevel, Meu Contador, Parceiros NextLevel · ZIP `nextlevel-familia-v2`
Etapa A única: "proponha um sistema de submarcas derivado da marca-mãe aprovada (anexo), com 2 direções; cada submarca com
símbolo próprio dentro da mesma família e cor de destaque própria". Etapa B: o kit completo para as quatro, pastas
`nextlevel-club`, `loja-nextlevel`, `meu-contador`, `parceiros`.
- NextLevel Club: programa de pontos e vantagens válido em todas as marcas · "Quanto mais você avança, mais valor acompanha."
- Loja NextLevel: temas, serviços e cursos da NextLevel, compra em 1 clique · "Uma vitrine para quem vive o próximo nível."
- Meu Contador: apoio de contador parceiro para membros do Brás Digital Club · "Clareza para decidir. Organização para crescer."
- Parceiros NextLevel: programa de indicação com comissão · "Parcerias que transformam conexão em resultado."

## Depois de cada ZIP
O Claude aplica como na D158: originais preservados, versões leves, fonte única da marca, tema isolado claro/escuro,
logo por superfície, monograma na barra recolhida, favicons/app/manifesto, prévia de link, topo com a peça 3D, textos com o
nome e o slogan novos, testes de contraste AA, capturas em celular/tablet/computador e publicação. Marca antiga arquivada.
