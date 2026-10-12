# Fase 1: avaliação de todo o sistema de links (12/10/2026)

> Fase 1 do prompt `docs/prompts/mapa-paginas-dominios-painel.md`. **Só levantamento: nenhum endereço mudou.** Para refazer a qualquer momento: suba o servidor local
> com os 5 endereços e rode `npx tsx scripts/mapa-rotas.ts` (gera `docs/mapa/rotas.csv`, uma linha por página, para abrir no Excel ou no Google Planilhas).
> No Master, a aba **Mapa vivo** da Central de qualidade faz o mesmo teste nos endereços de verdade, galho por galho.

## Resumo em 10 linhas

1. O sistema tem **212 telas**, **13 rotas de arquivo** fora da API (links de parceiro e cupom, prévias de link, planilhas, imagens) e **5 atalhos** que mudam o caminho (`/lojas`, `/lojas/sair`, `/loja/<nome>`, subdomínio de loja, convites do escritório).
2. Testei **cada página nos 5 endereços** (cerca de 1.000 combinações), seguindo cada redirecionamento até o fim.
3. Li **1.096 links** dentro das páginas públicas, que apontam para **232 destinos diferentes**, e abri cada destino.
4. **Nenhum link dá erro 404.** O problema não são links quebrados: são **páginas morando no lugar errado**.
5. **Mais grave para o cliente:** termos e privacidade **não existem** no SuperDrop, na Commerce nem na Cargas.
6. **Defeito visível hoje:** em `master.nextlevelgroup.com.br/solucoes`, sete links do menu e do rodapé (início, Como funciona, Planos, Parceiros, Perguntas, Seja fornecedor, Quero minha loja) **levam à tela de login**.
7. **Soluções e Loja NextLevel aparecem em 3 endereços** (Master, SuperDrop e Commerce). Pela sua decisão, vão para o site do grupo, nextlevelgroup.com.br.
8. **Vitrines das lojas e a página de fornecedor do SuperDrop abrem também no endereço da Commerce.**
9. **147 painéis respondem nos 5 endereços.** Pela sua decisão (todos os painéis no Master), são 588 respostas fora do lugar, porque cada painel abre a tela de login em cada endereço que não é o do Master.
10. **Uma página que ninguém alcança:** "Categorias" do fornecedor existe, mas não tem link no painel dele. Outras 3 são endereços antigos que só redirecionam (estão bem assim e ficam documentadas).

## Suas decisões de 12/10 (registradas em D147)

| Pergunta | Decisão | O que muda no mapa |
|---|---|---|
| Onde mora a NextLevel Soluções | Site do grupo, **nextlevelgroup.com.br** | `/solucoes` sai do Master, do SuperDrop e da Commerce |
| Painéis | **Todos no Master por enquanto**; no futuro cada projeto terá o próprio Master | Painel que responde fora do Master conta como "fora do lugar"; a reorganização deixa pronto o caminho para separar depois |
| Loja NextLevel | É da **agência NextLevel Soluções Digitais** | `/loja-nextlevel` vai junto com Soluções para o site do grupo |
| Termos e privacidade | **Um texto para o grupo inteiro** | Uma página única, presente em todas as marcas |
| Domínios agora | **Só nextlevelgroup.com.br e superdrop.com.br** | nextlevelcommerce.com.br fica para depois; a Commerce segue em lojas.nextlevelgroup.com.br |

## Diagnóstico, em ordem de gravidade

### Afeta o cliente

| # | O que acontece | Onde | Prova |
|---|---|---|---|
| 1 | Termos e privacidade não existem | SuperDrop e Commerce dão **404**; Cargas volta ao início | Tabela A: `/termos` e `/privacidade` |
| 2 | Menu da página de Soluções no Master leva ao login | `master.nextlevelgroup.com.br/solucoes` e cada `/solucoes/<produto>`: links Início, Como funciona, Planos, Parceiros, Perguntas, Seja fornecedor, Quero minha loja | Conferido no site no ar: `/como-funciona`, `/planos` e `/faq` no Master devolvem 307 para `/login` |
| 3 | Loja de uma marca abre no endereço de outra | Qualquer `/store/<loja>`, `/loja/<loja>` e `/f/<fornecedor>` abrem no SuperDrop **e** na Commerce | Tabela A, primeiras linhas |

### Afeta a venda

| # | O que acontece | Onde |
|---|---|---|
| 4 | Soluções e Loja NextLevel em 3 endereços | Master, SuperDrop e Commerce; o lugar decidido (nextlevelgroup.com.br) ainda não existe |
| 5 | Páginas que abrem nas duas marcas sem regra | SuperDrop e Commerce: `/`, `/cadastro`, `/planos`, `/faq`, `/quero-minha-loja`, `/ativar`, `/temas` e `/temas/<tema>`. Algumas mudam o conteúdo pela marca (início, planos, cadastro); outras são iguais nas duas |
| 6 | Corrente de redirecionamentos | Commerce `/fornecedores` vai para `/seja-fornecedor` e depois para o início (2 saltos, sem aviso). O link "Para quem fornece" da página inicial do SuperDrop aponta para `/fornecedores`, que redireciona |
| 7 | Sem mapa para buscadores | Nenhuma marca tem `sitemap.xml` nem `robots.txt` geral; só cada loja tem o seu |

### Organização

| # | O que acontece | Detalhe |
|---|---|---|
| 8 | Painéis respondem em todos os endereços | 147 painéis × 4 endereços fora do Master. Cada um pede login no endereço onde a pessoa está, e a sessão de um endereço não vale no outro |
| 9 | Páginas órfãs | **Real:** `/supplier/products/categorias` (categorias do fornecedor, sem link no painel; o lojista tem a mesma tela pelo menu dele). **Endereços antigos que só redirecionam:** `/master/bras` → `/bras`, `/master/commerce` → `/commerce`, `/supplier/shipping`. **Falsos órfãos** (o link é montado no código e a varredura não enxerga): detalhe de pedido e impressão de pedido, pedido de serviço da Loja NextLevel, solução do fornecedor. **Só na demonstração:** `/dev/design` |
| 10 | Atalhos escondidos | `/lojas` deixa qualquer endereço com a cara da Commerce (cookie de 30 dias); `/loja/<nome>`; subdomínio de loja (desligado); `/r/` parceiro; `/c/` cupom; `/assets/` imagens; `/og/` prévias; planilhas modelo |
| 11 | Nomes de endereço misturados | Inglês (`/merchant`, `/supplier`, `/partner`, `/master/orders`, `/master/finance`) e português (`/meu-bras`, `/importadora`, `/master/financeiro`). Existem `/master/finance` (financeiro SuperDrop) **e** `/master/financeiro` (financeiro NextLevel), dois endereços quase iguais para coisas diferentes |
| 12 | Tela de entrada em modo demonstração | Os atalhos de lojas de demonstração voltam ao início quando abertos pela Brás ou pela Cargas (só na demonstração) |

## O que foi medido e o que NÃO foi

- **Medido:**
  - todas as telas em 5 endereços, no servidor local com as mesmas regras de endereço da produção;
  - todos os links das páginas públicas;
  - menus de todos os painéis;
  - links escritos no código;
  - conferência no site no ar das páginas principais e do defeito do menu no Master.
- **Não medido:**
  - links **dentro dos painéis** com login (a varredura entrou só nas páginas públicas);
  - o conteúdo dos e-mails enviados;
  - 8 links privados que dependem de código real (balcão, motorista, recuperação de senha, proposta e pedido);
  - desempenho e acessibilidade (outros projetos).

## Próximo passo (aguarda a sua aprovação)

**Fase 2:** proposta de reorganização, com a árvore-alvo por endereço, a tabela "endereço antigo → endereço novo" e os redirecionamentos. Já inclui as suas 5 decisões.

Enquanto isso, a **Fase 4** (o painel "Mapa vivo" no Master) já foi construída, porque não muda nenhum endereço.

---

## A. Página pública × endereço (teste de 12/10)

Legenda:
- **abre:** a página aparece;
- **pede login:** vai para a tela de entrada;
- **volta ao início:** redireciona para a página inicial;
- **outra página:** redireciona para outro lugar;
- **(N saltos):** mais de um redirecionamento seguido;
- **⚠:** contraria uma decisão de 12/10.

Teste feito no servidor local; lojas de exemplo `mrs-sports` e `mantosshop`.

| Página | Nome | Master | SuperDrop | Commerce | Brás | Cargas |
|---|---|---|---|---|---|---|
| `/f/[slug]` | Página do fornecedor | pede login | abre | abre | volta ao início | volta ao início |
| `/store/[slug]` | Vitrine da loja | pede login | abre | abre | volta ao início | volta ao início |
| `/store/[slug]/acompanhar` | Acompanhar | pede login | abre | abre | volta ao início | volta ao início |
| `/store/[slug]/cart` | Cart | pede login | abre | abre | volta ao início | volta ao início |
| `/store/[slug]/catalog` | Catalog | pede login | abre | abre | volta ao início | volta ao início |
| `/store/[slug]/checkout` | Checkout | pede login | abre | abre | volta ao início | volta ao início |
| `/store/[slug]/product/[productSlug]` | Product (productSlug) | precisa de exemplo |  |  |  |  |
| `/` | Página inicial | pede login | abre | abre | abre | abre |
| `/ativar` | Ativação de outra marca | pede login | abre | abre | abre | abre |
| `/cadastro` | Criar conta | pede login | abre | abre | abre | volta ao início |
| `/como-funciona` | Como funciona | pede login | abre | volta ao início | volta ao início | volta ao início |
| `/esqueci-senha` | Esqueci senha | abre | abre | abre | abre | abre |
| `/faq` | Faq | pede login | abre | abre | volta ao início | volta ao início |
| `/fornecedores` | Fornecedores | pede login | outra página | volta ao início (2 saltos) | volta ao início | volta ao início |
| `/login` | Entrada (login) | abre | abre | abre | abre | abre |
| `/loja-nextlevel` ⚠ | Loja nextlevel | pede login | abre | abre | volta ao início | volta ao início |
| `/parceiros` | Parceiros | pede login | abre | volta ao início | volta ao início | volta ao início |
| `/parceiros/cadastro` | Cadastro | pede login | abre | volta ao início | volta ao início | volta ao início |
| `/parceiros/entrar` | Entrar | pede login | abre | volta ao início | volta ao início | volta ao início |
| `/parceiros/termos` | Termos | pede login | abre | volta ao início | volta ao início | volta ao início |
| `/planos` | Planos | pede login | abre | abre | volta ao início | volta ao início |
| `/privacidade` ⚠ | Privacidade | pede login | **404** | **404** | abre | volta ao início |
| `/quero-minha-loja` | Quero minha loja | pede login | abre | abre | abre | volta ao início |
| `/seja-fornecedor` | Seja fornecedor | pede login | abre | volta ao início | volta ao início | volta ao início |
| `/solucoes` ⚠ | Solucoes | abre | abre | abre | volta ao início | volta ao início |
| `/solucoes/[slug]` ⚠ | Solucoes (slug) | abre | abre | abre | volta ao início | volta ao início |
| `/temas` | Temas | pede login | abre | abre | volta ao início | volta ao início |
| `/temas/[key]` | Temas (key) | pede login | abre | abre | volta ao início | volta ao início |
| `/termos` ⚠ | Termos | pede login | **404** | **404** | abre | volta ao início |
| `/balcao-club/[token]` | Balcao club (token) | precisa de exemplo |  |  |  |  |
| `/balcao/[token]` | Balcao (token) | precisa de exemplo |  |  |  |  |
| `/d/[id]` | D (id) | precisa de exemplo |  |  |  |  |
| `/loja-nextlevel/pedido/[token]` | Pedido (token) | precisa de exemplo |  |  |  |  |
| `/motorista/[token]` | Motorista (token) | precisa de exemplo |  |  |  |  |
| `/redefinir-senha/[token]` | Redefinir senha (token) | precisa de exemplo |  |  |  |  |
| `/store/[slug]/order/[id]` | Order (id) | precisa de exemplo |  |  |  |  |
| `/store/[slug]/proposta/[token]` | Proposta (token) | precisa de exemplo |  |  |  |  |

A planilha completa (todas as 212 telas, inclusive painéis, com área, público, seção do menu, links que chegam e situação em cada endereço) está em `docs/mapa/rotas.csv`.
