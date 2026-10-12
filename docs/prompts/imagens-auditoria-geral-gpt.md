# Auditoria de imagens de todas as marcas + prompt mestre para o GPT

> **Pedido do dono (2026-10-09):** "o que mais falta de geração de imagens das outras marcas? Faça uma auditoria em todas as páginas públicas e internas onde podem ir imagens para auxiliar na navegação, em diversos níveis, e me entregue um .md com um prompt engenheiro mestre."
> **Como usar:**
> 1. Leia a seção 2 (o que falta) para escolher por onde começar. A ordem recomendada é a das prioridades.
> 2. Abra um chat novo no GPT com geração de imagens.
> 3. Cole **todo o bloco da seção 4** e diga, por exemplo: "Comece pelo lote A".
> 4. Salve cada imagem com o **nome exato** informado.
> 5. Traga um ZIP por lote. Eu confiro as regras, converto, coloco na pasta, ligo nas páginas e confiro em 360, 768 e 1440 px antes de publicar.
> **Prompts anteriores (já entregues):** SuperDrop e Commerce em `imagens-paginas-publicas-gpt.md`; Brás em `imagens-bras-digital-gpt.md`.

---

## 1. O que já existe (não gere de novo)

| Marca | Pasta | Situação |
|---|---|---|
| SuperDrop | `public/portal/superdrop/v3/` | **Completo**: 9 fotos na home (fornecedor separando, celular de venda, expedição, etiqueta, lojista, Pix, parceiro, pacote, textura) |
| NextLevel Commerce | `public/portal/commerce/v3/` | **Completo**: 9 fotos na home (marca própria, vitrine no celular, catálogo, cartão, pedido embalado, gestão, temas, atendimento, textura) |
| Brás Digital | `public/portal/bras/v3/` | **Lotes 1 e 2 completos** (8 fotos, publicadas em 2026-10-09). Falta só o lote 3 opcional: `bd-shorts-fundo` e conceitos de logo (prompt em `imagens-bras-digital-gpt.md`) |
| Temas das lojas | `public/temas/`, `public/demos/` | **Não usa GPT**: as capturas dos temas são geradas pelo próprio sistema e as lojas de demonstração já têm os pacotes visuais |
| Hub Creators, China Hub | — | **Fora do foco** (decisão do dono): só página "em breve" até haver produto |

---

## 2. Auditoria: onde faltam imagens, por nível

Cada linha mostra: a página, o que a imagem resolve na navegação e se o **lugar já existe no código** ("pronto": aparece sozinha quando o arquivo chega) ou se **eu ligo quando as imagens chegarem** ("ligar").

### Nível 1: portas de entrada (primeira impressão e compartilhamento)
| # | Onde | Por que ajuda | Lote | Código |
|---|---|---|---|---|
| 1 | Prévia de link do **SuperDrop**, da **Commerce** e da **NextLevel Soluções** (WhatsApp, Instagram, Facebook) | Hoje todas usam a mesma imagem genérica; cada marca precisa ser reconhecida antes do clique | A | ligar |
| 2 | **Login** (lado esquerdo no computador), uma por marca: SuperDrop, Commerce, Master/NextLevel | É a tela que o cliente mais vê; mostra em qual marca ele está entrando | A | ligar |
| 3 | **Cadastro da Commerce** (`/cadastro`, hoje só formulário centralizado) | Reforça "sua loja em 1 minuto" sem tirar a atenção do formulário | A | ligar |
| 4 | **Página de erro e "não encontrada"** (uma imagem neutra para todas as marcas) | Erro sem imagem parece site quebrado; com imagem, parece cuidado | A | ligar |

### Nível 2: páginas de decisão (entender e escolher)
| # | Onde | Por que ajuda | Lote | Código |
|---|---|---|---|---|
| 5 | **NextLevel Soluções** (`/solucoes`): abertura da página | Página de catálogo sem nenhuma imagem; precisa de uma cena forte de "time que faz por você" | B | ligar |
| 6 | **Uma imagem por família de solução** (cartões em `/solucoes`, abertura de `/solucoes/<produto>`, cartões da Loja NextLevel no painel): Planos Commerce, Loja Pronta, Migração, Temas, Marketing, Consultoria, White Label | Quem rola a lista reconhece a família pela imagem antes de ler; a mesma imagem serve nas três telas | B | ligar |
| 7 | **SuperDrop / Como funciona** (`/como-funciona`): 3 cenas dos passos (fornecedor publica, lojista vende, fornecedor envia) | Hoje só texto; os 3 passos ficam visíveis | C | ligar |
| 8 | **SuperDrop / Seja fornecedor** (`/seja-fornecedor`): abertura | Página de captação de fornecedor sem imagem | C | ligar |
| 9 | **Programa de Parceiros** (`/parceiros`): abertura | Mostra o parceiro indicando lojas, sem promessa de ganho | C | ligar |
| 10 | **Planos** do SuperDrop (`/planos`): faixa curta acima da tabela | Quebra o bloco de preço com uma cena de operação | C | ligar |

### Nível 3: dentro dos painéis (orientação e primeiros passos)
| # | Onde | Por que ajuda | Lote | Código |
|---|---|---|---|---|
| 11 | **Jornada da Loja NextLevel** (painel do lojista, em Serviços): faixa de cada fase (Fundação, Lançamento, Aquisição, Otimização, Escala) | O lojista vê em que etapa está e para onde vai | D | ligar |
| 12 | **Estados vazios** principais: primeiro pedido, primeiro produto, primeira campanha, nenhuma onda de expedição, nenhum indicado (parceiro), nenhuma descoberta (Brás) | Hoje só ícone; uma ilustração leve deixa claro o próximo passo e a tela não parece "quebrada" | D | ligar (componente `EmptyState` ganha a ilustração) |
| 13 | **Primeira tela do lojista** (início do painel, conta nova) | Boas-vindas com os 3 primeiros passos | D | ligar |

### Nível 4: apoio comercial (fora das páginas)
| # | Onde | Por que ajuda | Lote | Código |
|---|---|---|---|---|
| 14 | **Materiais para parceiros** divulgarem SuperDrop e Commerce (feed 1:1 e story 9:16, sem texto: o parceiro escreve por cima) | Parceiro divulga com a cara da marca, sem inventar | E | fica em `docs/marca/` (não entra no site) |
| 15 | **Topo dos e-mails** (uma faixa por marca, 1200×300) | O e-mail fica reconhecível na caixa de entrada | E | ligar (e-mail transacional) |

---

## 3. Regras de imagem (valem para tudo; já estão no bloco)

- **Fotografia documental** nas cenas (lotes A, B, C); **ilustração plana** só nos painéis (lote D). Nunca misturar no mesmo lote.
- **Sem texto, letra, número, preço ou logotipo** dentro da imagem. Caixas, sacolas, telas e roupas lisas.
- **Sem marca real**, sem fachada identificável, sem time de futebol real.
- **Sem rosto reconhecível e sem criança.**
- **Telas lisas** (cinza-azulado) ou desfocadas: a interface real é colocada pela página.
- **Sem promessa de ganho:** nada de dinheiro voando, gráfico explodindo, troféu ou pilhas de notas.
- **Paletas por marca** (acento só em detalhe pequeno):
  - SuperDrop: base navy `#101B34` + off-white `#F4F1E9`, acento **verde** `#2D9E3B`.
  - Commerce: mesma base, acento **azul** `#2F81F4`.
  - NextLevel Soluções / Master: mesma base, acento **amarelo** `#F5BC00`.
  - Brás: mesma base + kraft, acento **laranja** `#FB8342`.
  - Ilustrações dos painéis: navy, off-white e cinza, com **um** acento neutro azul-acinzentado `#5B7BA6` (funciona em todas as marcas).
- **Composição:** assunto no centro, 15% de respiro nas bordas (recorte para celular).

---

## 4. O PROMPT (copie todo o bloco)

```
PAPEL
Você é diretor de arte do grupo NextLevel, dono de quatro marcas sobre a mesma plataforma de e-commerce brasileira:
- SuperDrop: lojas online sem estoque; fornecedores (Centrais) separam e enviam pelos lojistas.
- NextLevel Commerce: plataforma de lojas virtuais da própria marca do lojista.
- NextLevel Soluções: serviços que a NextLevel faz pelo lojista (loja pronta, migração, temas, marketing, consultoria, white label).
- Brás Digital: atacado em caixa fechada das importadoras do Brás, São Paulo.
Vai produzir imagens em lotes para o site, os painéis e as redes. Tudo é fictício.

REGRAS GLOBAIS (obrigatórias em TODA imagem)
1. Nenhum texto, letra, número, preço ou logotipo visível. Caixas, etiquetas, sacolas, roupas e telas lisas.
2. Nenhuma marca real, fachada identificável ou time real.
3. Nenhum rosto reconhecível e nenhuma criança: mãos, costas, perfil fora de foco, silhuetas.
4. Telas de celular, tablet e notebook LISAS (cinza-azulado) ou desfocadas; não desenhe interface.
5. Nada que sugira promessa de ganho: sem dinheiro, gráficos subindo, troféus ou comemoração exagerada.
6. Cenário brasileiro plausível: pequenas empresas, ateliês, estoques, home office, comércio de rua, transportadoras.
7. Composição com o assunto no centro e 15% de respiro nas bordas.
8. Paleta base: navy profundo #101B34, off-white quente #F4F1E9, madeira clara e papel kraft. Acento de cada marca SÓ em detalhes pequenos (fita, etiqueta lisa, caneca, peça de roupa):
   SuperDrop = verde #2D9E3B; Commerce = azul #2F81F4; NextLevel Soluções = amarelo #F5BC00; Brás = laranja #FB8342.
9. Lotes A, B e C: FOTOGRAFIA real, documental, luz natural, profundidade de campo rasa, grão fino (não ilustração, não 3D, não banco de imagem).
   Lote D: ILUSTRAÇÃO plana e consistente (ver regras do lote).
10. Entregue UMA imagem por vez, no formato pedido, e informe o nome do arquivo exatamente como listado. Depois de cada uma, pergunte se pode seguir.

LOTE A — PORTAS DE ENTRADA (PNG)
A1. sd-og-portal.png — 1200x630 — Mesa de expedição de um fornecedor com caixas kraft fechadas e uma fita verde, à direita; metade esquerda lisa em navy #101B34. Sem texto.
A2. cm-og-portal.png — 1200x630 — Sacola off-white de loja própria com papel de seda azul e um celular de tela lisa ao lado, à direita; metade esquerda lisa em navy. Sem texto.
A3. nl-og-solucoes.png — 1200x630 — Mesa de trabalho de uma agência pequena vista de cima: notebook de tela lisa, cadernos lisos, uma caneca amarela, à direita; metade esquerda lisa em navy. Sem texto.
A4. sd-login-lateral.png — 3:4 vertical — Estoque de fornecedor ao entardecer, prateleiras com caixas padronizadas, luz quente, tons navy dominantes (ficará escurecida sob texto branco); detalhe verde numa fita.
A5. cm-login-lateral.png — 3:4 vertical — Ateliê de moda à noite com araras e uma luminária, tons navy dominantes, detalhe azul num tecido; ficará escurecida sob texto branco.
A6. nl-login-lateral.png — 3:4 vertical — Escritório pequeno e organizado à noite, janela com cidade desfocada, mesa com notebook de tela lisa, detalhe amarelo numa caneca; tons navy, ficará escurecida.
A7. cm-cadastro-lateral.png — 3:4 vertical — Mão segurando um celular de tela lisa sobre uma bancada com produtos embalados para envio, luz de janela; detalhe azul na fita. Vai ao lado do formulário, sem escurecer.
A8. erro-caixa-vazia.png — 4:3 — Uma caixa kraft aberta e vazia sobre um piso claro, luz suave de lado, muito espaço vazio ao redor; calma, não triste. Sem acento de marca.

LOTE B — NEXTLEVEL SOLUÇÕES (PNG, acento amarelo #F5BC00)
B1. nl-solucoes-hero.png — 16:9 — Duas pessoas de costas trabalhando lado a lado numa mesa de uma agência pequena, uma montando a vitrine de uma loja no notebook de tela lisa, outra organizando fotos de produto impressas lisas; caneca amarela.
B2. nl-familia-planos.png — 4:3 — Notebook de tela lisa aberto sobre a mesa de uma loja pequena, com sacolas da loja ao fundo; sensação de "loja no ar".
B3. nl-familia-loja-pronta.png — 4:3 — Mesa com produtos fotografados em fundo infinito branco, câmera num tripé, mãos ajustando a luz; montagem de loja feita por especialistas.
B4. nl-familia-migracao.png — 4:3 — Duas caixas de arquivo de papelão, uma sendo esvaziada e outra sendo preenchida com pastas lisas, mãos transferindo; mudança organizada.
B5. nl-familia-temas.png — 4:3 — Três amostras de papel e tecido de estilos diferentes (moda, casa, esporte) lado a lado sobre a mesa, com uma paleta de cores impressa lisa; escolha de estilo.
B6. nl-familia-marketing.png — 4:3 — Celular de tela lisa num tripé pequeno gravando um produto sobre a mesa, luz de anel desfocada; conteúdo para redes.
B7. nl-familia-consultoria.png — 4:3 — Duas pessoas de costas diante de um quadro branco com post-its LISOS (sem texto), uma apontando; planejamento.
B8. nl-familia-white-label.png — 4:3 — Mesa com várias sacolas e caixas lisas de cores diferentes (sem marca), lado a lado; muitas marcas sobre a mesma base.

LOTE C — PÁGINAS DE DECISÃO DO SUPERDROP E PARCEIROS (PNG, acento verde #2D9E3B, exceto C5)
C1. sd-passo-publica.png — 4:3 — Fornecedor fotografando um produto sobre a bancada do estoque com o celular de tela lisa; o produto vai para o catálogo.
C2. sd-passo-vende.png — 4:3 — Lojista em casa, de costas, recebendo a notificação no celular de tela lisa enquanto trabalha no notebook; a venda acontece sem estoque.
C3. sd-passo-envia.png — 4:3 — Mãos do fornecedor fechando uma caixa kraft com fita verde e colando etiqueta lisa; o pedido sai.
C4. sd-seja-fornecedor.png — 16:9 — Corredor de um estoque de fornecedor de moda bem organizado, peças dobradas em prateleiras, carrinho, luz da manhã.
C5. pa-parceiros-hero.png — 16:9 — Pessoa de costas numa reunião informal numa loja pequena, mostrando algo no tablet de tela lisa para a dona da loja (de perfil, desfocada); acento neutro, sem cor de marca. Indicação, não venda agressiva.
C6. sd-planos-faixa.png — 21:9 — Bancada longa de expedição vista de lado com caixas em fila, luz uniforme; faixa calma para ficar acima da tabela.

LOTE D — PAINÉIS: ILUSTRAÇÕES PLANAS (PNG com FUNDO TRANSPARENTE, 1:1, 1024x1024)
Estilo único para TODO o lote: ilustração vetorial plana, traço limpo, cantos arredondados, sem sombras realistas, sem degradê forte, sem pessoas com rosto (mãos e objetos apenas). Cores: navy #101B34, off-white #F4F1E9, cinza #C9D1E3 e UM acento azul-acinzentado #5B7BA6. Objeto central ocupando 60% da área, muito respiro. Nenhum texto.
D1. ui-vazio-pedidos.png — uma sacola de compras lisa com um pequeno sino ao lado (primeiro pedido).
D2. ui-vazio-produtos.png — uma etiqueta de produto lisa presa a uma caixa aberta (primeiro produto).
D3. ui-vazio-campanhas.png — um megafone pequeno sobre um cartão liso (primeira campanha).
D4. ui-vazio-expedicao.png — uma pilha de três caixas com um carrinho de mão (nenhuma onda de expedição).
D5. ui-vazio-indicados.png — duas mãos passando um cartão liso uma para a outra (nenhum indicado).
D6. ui-vazio-descobertas.png — uma claquete de vídeo sobre uma caixa kraft (nenhuma descoberta).
D7. ui-boas-vindas-loja.png — uma vitrine de loja pequena com toldo liso e porta aberta (primeira tela do lojista).
D8. ui-fase-fundacao.png — tijolos sendo empilhados (fase Fundação).
D9. ui-fase-lancamento.png — uma porta de loja se abrindo com luz saindo (fase Lançamento).
D10. ui-fase-aquisicao.png — um ímã atraindo pequenos cartões lisos (fase Aquisição).
D11. ui-fase-otimizacao.png — uma chave inglesa ajustando uma engrenagem (fase Otimização).
D12. ui-fase-escala.png — três caixas crescendo de tamanho em degraus (fase Escala).

LOTE E — APOIO COMERCIAL (PNG)
E1. sd-parceiro-feed.png — 1:1 — Caixas kraft com fita verde sobre fundo navy liso, com metade superior livre para o parceiro escrever. Sem texto.
E2. sd-parceiro-story.png — 9:16 — mesma cena de E1, vertical, com o terço superior livre.
E3. cm-parceiro-feed.png — 1:1 — Sacola off-white com papel de seda azul sobre fundo navy liso, metade superior livre. Sem texto.
E4. cm-parceiro-story.png — 9:16 — mesma cena de E3, vertical, terço superior livre.
E5. sd-email-topo.png — 1200x300 — Faixa horizontal: bancada de expedição desfocada em tons navy com um detalhe verde. Sem texto.
E6. cm-email-topo.png — 1200x300 — Faixa horizontal: ateliê desfocado em tons navy com um detalhe azul. Sem texto.
E7. nl-email-topo.png — 1200x300 — Faixa horizontal: mesa de agência desfocada em tons navy com um detalhe amarelo. Sem texto.

Comece pelo lote que eu pedir. Depois de cada imagem, pergunte se pode seguir para a próxima.
```

---

## 5. Se o GPT errar (peça a correção assim)

- **Texto ou logotipo apareceu:** "Refaça sem nenhum texto, número ou logotipo; tudo liso."
- **Rosto apareceu:** "Pessoa de costas ou fora de foco; sem rosto reconhecível."
- **Cor de marca demais:** "Acento só em um detalhe pequeno; o resto navy, off-white e kraft."
- **Lote D saiu com sombra realista ou 3D:** "Ilustração vetorial plana, mesmas cores e traço das anteriores; fundo transparente."
- **Lote D ficou inconsistente:** cole a imagem D1 aprovada e diga "mesmo estilo exato desta".

---

## 6. O que eu faço quando você trouxer

1. **Confiro as regras** em cada imagem (texto, marca, rosto, cor). O que não passar eu devolvo com a correção pronta para o GPT.
2. **Converto os formatos:**
   - fotos em AVIF (qualidade 55) e WebP (qualidade 82);
   - prévias de link em JPG leve, porque WhatsApp e redes não leem AVIF;
   - ilustrações em WebP com transparência.
3. **Coloco nas pastas:**
   - `public/portal/<marca>/v3/` (marcas);
   - `public/portal/nextlevel/v3/` (Soluções e Master);
   - `public/ilustracoes/v1/` (painéis);
   - os manifestos de cada pasta são atualizados.
4. **Ligo nos lugares marcados "ligar"**, sempre do jeito que já vale para as outras fotos: sem o arquivo, nada aparece e nada quebra.
5. **Confiro** em 360, 768 e 1440 px, com acessibilidade e sem rolagem lateral, e publico com os testes.
6. **Material de apoio** (lote E, feed e story): vai para `docs/marca/`, não entra no site.

## 7. Ordem recomendada

1. **Lote A:** portas de entrada; todo mundo vê.
2. **Lote B:** Soluções; a página vende e hoje não tem nenhuma imagem.
3. **Lote D:** painéis; orienta quem já é cliente.
4. **Lote C** e depois **lote E**.

## 8. Checklist

> **2026-10-12:** lotes A a E recebidos, convertidos e ligados (D146). Onde cada imagem aparece: `MANIFESTO.md` de `public/portal/superdrop/v3/`, `public/portal/commerce/v3/`, `public/portal/nextlevel/v3/`, `public/ilustracoes/v1/` e `docs/marca/README.md`.

- [x] Lote A (8): sd-og-portal, cm-og-portal, nl-og-solucoes, sd-login-lateral, cm-login-lateral, nl-login-lateral, cm-cadastro-lateral, erro-caixa-vazia
- [x] Lote B (8): nl-solucoes-hero e 7 famílias (planos, loja-pronta, migracao, temas, marketing, consultoria, white-label)
- [x] Lote C (6): 3 passos do SuperDrop, seja-fornecedor, parceiros, faixa de planos
- [x] Lote D (12): 6 estados vazios, boas-vindas, 5 fases da jornada
- [x] Lote E (7): feed e story de parceiros (SuperDrop e Commerce), topo de e-mail das 3 marcas
- [ ] Brás lote 3 (opcional): bd-shorts-fundo e conceitos de logo (`imagens-bras-digital-gpt.md`)
