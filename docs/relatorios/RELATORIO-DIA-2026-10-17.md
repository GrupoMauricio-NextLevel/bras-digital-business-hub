# Relatório do dia: 17/10/2026 (com a madrugada de 18/10)

> Para o Mauricio organizar o dia seguinte. Linguagem simples; detalhes técnicos só onde ajudam a decidir.
> Branch publicada: `claude/wonderful-cannon-5o38v5` (cada envio publica no Render em 3 a 6 minutos).
> Última versão conferida no ar: `093468d` (o ajuste `a2d1a40`, de nomes no painel, estava subindo no fechamento).

---

## 1. Resumo em 30 segundos

- **Foram 31 entregas publicadas** em cerca de 22 horas de trabalho: **12 decisões registradas (D157 a D168)**, cerca de **720 arquivos tocados** (a maior parte fotos convertidas) e **mais de 29 mil linhas** novas.
- **A NextLevel E-commerce ganhou cara própria e foi ao ar com a home imersiva**: novo nome, cores, logos e fotos com **8 personagens diferentes**. Também deixou de mostrar qualquer coisa do SuperDrop.
- **O grupo inteiro passou por uma varredura de vazamentos.** E-commerce, SuperDrop, Brás e Cargas terminaram com zero achados nas varreduras, e os vazamentos achados depois foram corrigidos.
- **O padrão "imersivo" virou uma peça só do sistema.** Brás, Cargas e SuperDrop já têm jornada e portas prontas, com o lugar das fotos reservado. Cada página entra no ar sozinha quando as fotos dela forem convertidas.
- **Os painéis ganharam a "fila do dia"**, a primeira tela que responde "o que eu preciso fazer agora?". Ela já está no lojista (E-commerce e SuperDrop), no membro da Brás e na transportadora/ônibus. Fornecedor, importadora e Master já tinham fila.
- **O que depende de você**:
  - refazer 1 foto da E-commerce;
  - gerar as fotos de Brás, Cargas e SuperDrop;
  - decidir a logo do SuperDrop;
  - regularizar o pagamento do GitHub, porque a verificação automática está parada desde 08/10.

---

## 2. Linha do tempo do dia

| Hora | Entrega | Marca |
|---|---|---|
| 02:50 | Fase 3: nextlevelgroup.com.br no ar como site do grupo | Grupo |
| 03:05 | Site do grupo v1: Soluções, Club, Meu Contador e Loja NextLevel (D157) | Grupo |
| 03:32 a 03:49 | Identidade do Brás Digital Club: fonte única, tema, logos e favicons, com 2 rodadas de ajuste AA (D158) | Brás |
| 04:21 a 04:24 | Prompts do kit oficial de cada marca no GPT | Todas |
| 05:09 | Domínio brasdigitalclub.com.br reconhecido, endereço único e canônico | Brás |
| 06:41 a 06:58 | Análise completa do sistema Brás, públicos e D159 (rede aberta com compra coletiva) | Brás |
| 07:19 a 07:28 | Rede aberta F1+F2: duas portas, cadastro do fornecedor (/fornecer) e fila de aprovação (D160) | Brás |
| 07:58 | Racional e prompt da vitrine imersiva da Soluções | Grupo |
| 08:41 | NextLevel v2, a marca-mãe: fonte única, tema marinho/royal e logos por superfície (D161) | Grupo/Master |
| 08:52 | Vitrine imersiva da Soluções, atrás de uma chave (D162) | Grupo |
| 09:03 | **NextLevel E-commerce**: novo nome público, tema, logos, ícones, site e painel (D163) | E-commerce |
| 13:59 a 14:13 | Fotos da Soluções e vitrine liberada ao público | Grupo |
| 15:03 | **Sem SuperDrop na E-commerce** (D164) | E-commerce |
| 15:29 | Varredura de vazamentos em todas as marcas e níveis de login | Todas |
| 16:23 | Prévia da home imersiva da E-commerce | E-commerce |
| 20:31 | Menu das páginas públicas sem passar da tela entre 1021 e 1120 px; cartões de tema acessíveis | Todas |
| 23:04 | **Home imersiva da E-commerce no ar** (D165) | E-commerce |
| 23:28 | Tiradas do ar as fotos com erro de IA (tela do notebook virada para a câmera) | E-commerce |
| 23:32 | Prompt mestre do novo grupo de fotos (8 personagens) e plano para todas as marcas | E-commerce/Todas |
| 00:08 (18/10) | **Fotos v2 no ar** (17 de 18) e **fila do dia do lojista** (D166) | E-commerce/SuperDrop |
| 00:18 | **Jornada imersiva de Brás, Cargas e SuperDrop** com o lugar das fotos reservado (D167) | Brás/Cargas/SuperDrop |
| 00:28 | Fila do dia do membro da Brás e da transportadora; convite do parceiro pela marca (D168) | Brás/Cargas/Parceiros |
| 00:32 | "E-commerce" no seletor do painel e no Master; planos do SuperDrop só onde existem | E-commerce/Master |

---

## 3. Checklist por marca

### 3.1 NextLevel E-commerce (`lojas.nextlevelgroup.com.br`)
- [x] Novo nome público "NextLevel E-commerce". O código interno continua `NEXTLEVEL_COMMERCE`, para não mexer no banco (D163).
- [x] Tema marinho, azul e ciano, com logos clara e escura, ícones e favicon.
- [x] **Nada do SuperDrop**, que estava espalhado em vários pontos:
  - barra do grupo;
  - pós-venda: sem "aguardando recarga"; "Na Central" virou "Em preparação";
  - financeiro: cartão do plano da E-commerce, sem a justificativa da oferta do SuperDrop;
  - nomes de plano;
  - menu "Financeiro SuperDrop" no Master;
  - jornada do lojista;
  - textos do fornecedor (D164).
- [x] Home imersiva no ar (D165). A sequência da página é:
  - primeira dobra;
  - jornada "da primeira foto à rotina de pedidos", com 5 passos e a foto presa na tela;
  - 4 portas de entrada e lojas de exemplo;
  - personalização interativa e temas;
  - simulador de planos, dúvidas e chamada final.
- [x] **Fotos v2 com 8 personagens diferentes** (D166): Larissa na jornada; Thiago, Patrícia, Rodrigo e Dona Marta nas portas; Bruno e Ana nos temas; Fernanda nos planos.
- [x] A tela de entrada (login) usa a foto do ateliê.
- [x] **Fila do dia** no painel do lojista (D166). Ela mostra:
  - o que falta para vender;
  - pedidos parados além do normal, em vermelho;
  - vendas aguardando pagamento;
  - pedidos em preparação;
  - tamanhos que voltaram ao estoque com cliente esperando aviso.
- [x] Seletor da lateral do painel: mostrava "NEXTLEVEL / Commerce" e agora mostra "E-commerce".
- [ ] **Uma foto para refazer:** `ec-jornada-2-loja.png` (paisagem). A tela do notebook ficou virada para a câmera.
  - No computador, o passo 2 usa por enquanto a foto do Bruno e da Ana comparando a vitrine.
  - No celular, a versão em pé está correta e já está no ar.
- [ ] Observação: a Larissa das fotos em pé tem a pele mais clara que a das paisagens. Como o celular só mostra as em pé e o computador só as paisagens, ninguém vê as duas juntas. Ainda assim, vale padronizar na próxima rodada.

### 3.2 SuperDrop (`superdrop.com.br`, em produção com clientes)
- [x] Fila do dia do lojista. Ela mostra, nesta ordem:
  - saldo insuficiente, com o valor que falta;
  - etiquetas pendentes;
  - pedidos parados além do normal (novo);
  - clientes sem pagamento;
  - tamanhos que voltaram ao estoque (novo).

  Os itens que já existiam continuam iguais.
- [x] Cores num arquivo só (`src/lib/marcas/superdrop.ts`), com os mesmos valores; a tela não mudou.
- [x] Jornada imersiva e portas prontas em **prévia** (`superdrop.com.br/?previa=imersiva`). O site normal não mudou.
- [ ] Fotos da jornada (pedido pronto em `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md`, Parte 4).
- [ ] **Decisão sua:** manter a logo atual ou fazer o kit novo. A logo atual é o SVG antigo e o tema ainda tem o amarelo antigo em pontos.

### 3.3 Brás Digital Club (`brasdigitalclub.com.br`)
- [x] Identidade completa (D158): logos, tema navy, azul e ciano, favicons e contraste AA.
- [x] Domínio próprio, com endereço único e canônico.
- [x] Rede aberta F1+F2 (D160):
  - duas portas, comprador e fornecedor;
  - cadastro do fornecedor com tipo e polo;
  - fila de aprovação.
- [x] **Fila do dia do membro** (D168). Ela mostra:
  - cadastro em análise;
  - respostas da equipe;
  - pedido confirmado sem pagamento, em vermelho;
  - pedido pago para mandar retirar;
  - pedido recebido;
  - descobertas novas.
- [x] Jornada imersiva (a compra da Dona Cida) e 4 portas, em **prévia** (`/?previa=imersiva`).
- [ ] Fotos da jornada (pedido pronto, Parte 2). É a marca mais pronta para receber fotos.

### 3.4 NextLevel Cargas (`cargas.nextlevelgroup.com.br`)
- [x] Placa e botão principal no índigo da marca, sem o amarelo antigo (D164).
- [x] **Fila do dia da transportadora e do ônibus** (D168). Ela mostra:
  - chamadas e Pix a devolver, em vermelho;
  - coletas fixas de hoje;
  - coletas;
  - frete na chegada;
  - trânsito;
  - link do motorista.
- [x] Jornada imersiva (uma carga do Brás até a entrega) e 4 portas, em **prévia**. As portas são transportadora, autônomo, ônibus e importadora.
- [ ] Fotos (pedido pronto, Parte 3).
- [ ] Identidade completa (arquivo da marca, logo para fundo claro): fica para o kit da marca no GPT.

### 3.5 Grupo NextLevel e Master (`nextlevelgroup.com.br`, `master.nextlevelgroup.com.br`)
- [x] Site do grupo v1 (D157) e marca-mãe NextLevel v2 (D161).
- [x] Vitrine imersiva da Soluções no ar (D162). Foi ela que deu o padrão para as outras marcas.
- [x] Master: nome curto "E-commerce" nas telas internas (Central de qualidade, ofertas, roteiro de preços e mapa).
- [x] O Master já tinha "O que exige atenção" (alertas da torre de controle).

### 3.6 Parceiros (afiliados)
- [x] **Vazamento corrigido.** Os textos prontos de WhatsApp diziam "Conheça o SuperDrop" e "7 dias" em qualquer marca. Agora vêm da marca do endereço, sem prazo fixo.
- [x] O "plano em destaque" do link (planos do SuperDrop) só aparece onde há SuperDrop.
- [ ] Não há conta de parceiro na demonstração. Vale criar uma para conferir as telas no navegador.

---

## 4. Melhorias que valem para todas as marcas
- **Peça imersiva única** (`src/components/imersiva/`):
  - jornada com a foto presa na tela;
  - portas;
  - fotos em AVIF/WebP em duas larguras;
  - versão em pé no celular;
  - modo parado para quem pede "menos movimento".

  Cada marca entra só com cores, texto e fotos.
- **Lugar da foto reservado:** sem foto, a página mostra um campo na cor da marca, com a mesma proporção e sem texto. A jornada só entra no ar com todas as fotos da marca.
- **Conversor de fotos:** um comando transforma os PNG do GPT em AVIF/WebP, grava a lista e a página passa a usar as fotos novas. Se faltar alguma foto que a página usa, o build avisa.
- **Menu das páginas públicas:** não passa mais da tela entre 1021 e 1120 px.
- **Acessibilidade:** axe sem violações graves nas páginas novas, sem rolagem lateral em 360 px, um título principal por página.
- **Fila do dia:** a regra fica no domínio, com testes, e a tela só mostra o resultado.

---

## 5. Números e verificações
| Item | Resultado |
|---|---|
| Lighthouse E-commerce (computador) | 99 de desempenho, 100 de acessibilidade, CLS 0 |
| Lighthouse E-commerce (celular) | 84 a 91 de desempenho |
| Varredura de vazamento (E-commerce, SuperDrop, Brás, Cargas) | 0 achados |
| e2e da home da E-commerce (computador, tablet, celular, menos movimento) | tudo certo |
| Fila do dia no navegador (lojista E-commerce, lojista SuperDrop, membro Brás, transportadora, ônibus) | aparece certa em 1440 e 360 px, sem rolagem lateral |
| axe nas prévias (Brás, Cargas, SuperDrop, E-commerce; 1440 e 360 px) | sem violações graves |
| Testes automáticos | bateria completa rodada no fechamento (ver seção 9) |
| Build de produção | passou em todas as publicações |

---

## 6. Decisões registradas (em `docs/design/DECISIONS.md`)
| Nº | Decisão |
|---|---|
| D157 | Site do grupo v1 |
| D158 | Identidade do Brás Digital Club |
| D159 | Brás: rede aberta de abastecimento com compra coletiva |
| D160 | Brás: rede aberta F1+F2 (duas portas, cadastro e aprovação de fornecedor) |
| D161 | NextLevel v2, a marca-mãe |
| D162 | Soluções: vitrine imersiva |
| D163 | NextLevel E-commerce: nome público e identidade |
| D164 | Sem vazamento entre marcas, com SuperDrop fora da E-commerce (3 rodadas) |
| D165 | Home imersiva da E-commerce no ar |
| D166 | Fila do dia do lojista e fotos v2 da E-commerce |
| D167 | Jornada imersiva de Brás, Cargas e SuperDrop com o lugar das fotos reservado |
| D168 | Fila do dia do membro da Brás e da transportadora; convite do parceiro pela marca |

A próxima decisão será a D170 (D169, pulso da loja, entrou no fechamento).

---

## 7. Riscos e pontos de atenção
1. **A verificação automática do GitHub está parada desde 08/10** por pagamento da conta ("recent account payments have failed or your spending limit needs to be increased").
   - Hoje eu rodo tipos, estilo, testes e build aqui antes de cada envio. Sem a conferência do GitHub, porém, não há uma segunda rede de proteção.
   - **Prioridade 1 para você:** regularizar em GitHub → Settings → Billing.
2. **SuperDrop tem clientes.** Toda mudança nele foi pequena e com teste: a fila mantém os itens antigos e as cores mudaram só de lugar no código. A jornada imersiva dele **só vai ao ar com fotos e com a sua decisão sobre a logo**.
3. **Personagem com dois tons de pele** (Larissa paisagem × retrato). Não aparecem juntas, mas vale padronizar.
4. **Painel do parceiro sem conta de demonstração**, então não foi visto no navegador; o texto tem teste.
5. **Branches antigas divergentes** (`main`, brave-gates, clever-goldberg, laughing-mendel) têm migrações 0012/0013 em conflito. **Não use para publicar.** A branch certa é `claude/wonderful-cannon-5o38v5`.

---

## 8. O que está pendente

### Com você (em ordem de impacto)
1. **GitHub:** regularizar o pagamento (5 minutos e libera a verificação automática).
2. **Fotos da E-commerce:** refazer só `ec-jornada-2-loja.png` (paisagem 1536x1024, Larissa montando a loja no notebook).
   - No pedido v2 (`docs/prompts/ecommerce-fotos-v2-personagens-gpt.md`), use o bloco da jornada 2.
   - Reforce: **câmera de lado, tela visível em ângulo e voltada para ela**.
   - Se possível, peça o mesmo tom de pele das versões em pé (ou refaça as em pé no tom das paisagens).
3. **Fotos de Brás, Cargas e SuperDrop:** o pedido completo está em `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md`, com prompt mestre por marca, elenco fixo, regra da tela, conferência e nomes de arquivo.
   - Ordem sugerida: **Brás → Cargas → SuperDrop**.
   - Um ZIP por marca.
4. **SuperDrop:** manter a logo atual ou fazer o kit novo (`docs/prompts/kit-marcas-gpt.md`).
5. **Master:** renomear o produto "Commerce Start" no catálogo de preços para o nome novo. É dado no Master, não é código.
6. **Termos de uso:** trocar "NextLevel Commerce" por "NextLevel E-commerce" no texto jurídico.
7. **Kits das marcas da família** (Club, Loja NextLevel, Meu Contador, Parceiros), ainda no amarelo antigo.
8. **Decisão:** no cadastro da E-commerce, a porta escolhida (começar do zero, Instagram, migrar, loja física) deve vir marcada?

### Comigo (próximos passos, sem depender de você)
1. Ao chegar cada ZIP de fotos: converter, conferir foto por foto (tela, texto, mãos, personagem), testar e publicar. A jornada entra no ar sozinha.
2. **"Pulso da loja"**: faixa discreta no lojista com vendas de hoje, pedidos parados e saúde da loja, reaproveitando o `healthScore` que já existe.
3. **Linha do tempo do pedido** com a mesma anatomia em loja, fornecedor e Master.
4. Conta de parceiro na demonstração e varredura do painel do parceiro (`/parceiros/entrar`), que ainda não foi varrido.
5. Arquivo de identidade da Cargas (como fiz para o SuperDrop) e tema sem cores soltas.
6. Revisão de textos de marca restantes no painel do parceiro (filtros e relatórios).

---

## 9. Fechamento técnico
- **Publicado no ar:**
  - `0deeeec`: fotos v2 e fila do lojista;
  - `bf9aa9b`: jornada das outras marcas em prévia;
  - `093468d`: filas do membro e da transportadora, e convite do parceiro;
  - `a2d1a40`: nomes "E-commerce" e planos do parceiro.
- **Conferido no ar:** as fotos novas da E-commerce aparecem em `lojas.nextlevelgroup.com.br` (por exemplo, `ec-jornada-5-rotina` e `ec-porta-migrar`); `/api/health` responde `ok` com a versão `093468d`.
- **Bateria completa de testes:** rodada no fechamento; resultado anotado no fim deste arquivo.

---

## 10. Agenda sugerida para amanhã

| Bloco | O quê | Quem | Tempo |
|---|---|---|---|
| Manhã, 1º | Regularizar o GitHub | Você | 5 min |
| Manhã | Refazer a foto `ec-jornada-2-loja` no GPT | Você | 10 min |
| Manhã | Gerar as fotos da **Brás** (prompt mestre + 17 pedidos) | Você | 1 a 2 h |
| Em paralelo | Pulso da loja e linha do tempo do pedido (painéis) | Eu | 2 a 3 h |
| Tarde | Converter, conferir e publicar as fotos da Brás (a jornada entra no ar) | Eu | 30 a 45 min |
| Tarde | Decidir a logo do SuperDrop e o texto dos termos | Você | 15 min |
| Tarde | Fotos da **Cargas** | Você | 1 a 2 h |
| Fim do dia | Fotos da Cargas no ar, varredura geral e relatório do dia | Eu | 1 h |

**Onde encontrar tudo:**
- Decisões: `docs/design/DECISIONS.md`
- Pedidos de fotos: `docs/prompts/ecommerce-fotos-v2-personagens-gpt.md` e `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md`
- Plano das marcas: `docs/prompts/aplicacao-imersiva-todas-marcas.md`
- Fila de prompts: `docs/prompts/README.md`
- Prévias:
  - `brasdigitalclub.com.br/?previa=imersiva`
  - `superdrop.com.br/?previa=imersiva`
  - `cargas.nextlevelgroup.com.br/?previa=imersiva`
