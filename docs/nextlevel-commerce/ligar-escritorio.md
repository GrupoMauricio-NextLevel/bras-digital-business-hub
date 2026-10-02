# Conectar os domínios do ecossistema NextLevel (Hostinger + Render)

Um serviço no Render atende **todos** os endereços. O sistema reconhece o produto pelo endereço digitado. Tudo abaixo é feito nos sites do Render e da Hostinger.

## Mapa final
| Endereço | Produto | Observação |
|---|---|---|
| `master.nextlevelgroup.com.br` | **Master central** (só a equipe NextLevel) | entra aqui para gerir todos os produtos |
| `lojas.nextlevelgroup.com.br` | **NextLevel Commerce** | já adicionado no Render |
| `creators.nextlevelgroup.com.br` | **Hub Creators** | página "em breve" + lista de espera |
| `superdrop.com.br` | **SuperDrop** (público) | já no ar |
| `office.superdrop.com.br` | SuperDrop (painéis: login, fornecedor, lojista, afiliado) | já adicionado no Render |
| `bras.superdrop.com.br` | **Brás Digital** | página "em breve" + lista de espera |
| `chinahubglobal.com.br` (+ `www`) | **China Hub** | página "em breve" + lista de espera |
| `app.superdrop.com.br` | (antigo) | **remover** quando o `office.` estiver em uso (economiza US$ 0,25/mês) |

O endereço principal `nextlevelgroup.com.br` **continua sendo o site da holding** (GPT Sites). Não mexa nele.

## Passo 1: adicionar no Render (um por vez)
Render → seu serviço → **Settings → Custom Domains → Add Custom Domain**. Adicione: `master.nextlevelgroup.com.br`, `creators.nextlevelgroup.com.br`, `bras.superdrop.com.br`, `chinahubglobal.com.br` (e `www.chinahubglobal.com.br`, que o Render costuma criar como redirecionamento).
Para cada um, o Render mostra o registro DNS a criar. **Copie exatamente o que ele mostrar.**

## Passo 2: criar os registros na Hostinger
Hostinger → **Domínios** → escolha o domínio → **DNS / Servidores de nomes** → **Adicionar registro**.

**Para os subdomínios** (`master`, `lojas`, `creators` em `nextlevelgroup.com.br`; `office`, `bras` em `superdrop.com.br`):
- Tipo **CNAME**
- Nome: só a parte antes do domínio (`master`, `lojas`, `creators`, `office`, `bras`)
- Valor: `superdrop.onrender.com` (é o endereço técnico do serviço; é o mesmo para todos)

**Para o `chinahubglobal.com.br` (endereço principal, sem prefixo):** o Render mostra o registro certo (em geral um registro **A** com um número IP, ou **ALIAS/ANAME**). Crie exatamente o tipo e o valor que ele indicar. E para o `www`: CNAME `www` → `superdrop.onrender.com` (ou o valor que o Render mostrar).

**Cuidados:**
- Não mexa nos registros do `@` e do `www` de `nextlevelgroup.com.br` (site da holding), nem nos de e-mail (MX e TXT).
- Se já existir um registro com o mesmo nome, edite-o em vez de criar outro.
- Se o DNS estiver em outro lugar (por exemplo Cloudflare), crie lá; deixe a nuvem **cinza (só DNS)** até o certificado sair.

## Passo 3: esperar a verificação
No Render, volte em Custom Domains e clique em **Verify**. Cada domínio deve ficar **Verified** e **Certificate Issued** (de minutos a algumas horas; o Render avisa até 24 h).

## Passo 4: variáveis no Render (Environment) — só depois de os domínios verificados
Os endereços dos produtos já vêm de fábrica no sistema; **não precisa** definir lista de domínios. Defina apenas:

| Variável | Valor | Para quê |
|---|---|---|
| `BRAND_OFFICE_SUPERDROP` | `https://office.superdrop.com.br` | separa os painéis do SuperDrop no `office.` |
| `MASTER_EMAIL` e `MASTER_PASSWORD` | seu e-mail e uma senha forte (10+ caracteres) | cria o seu Master de verdade |
| `MASTER_HOST_ONLY` | `true` — **só depois de conseguir entrar em `master.nextlevelgroup.com.br`** | o Master passa a entrar só pelo endereço central |
| `BRAND_SIGNUP_NEXTLEVEL_COMMERCE` | `true` — quando for abrir cadastro de lojas | abre o cadastro na Commerce |

**Desfazer:** apague a variável e salve; volta ao comportamento anterior.

## Passo 5: conferir
1. `https://master.nextlevelgroup.com.br` mostra a tela de login (e nada mais). Entre com o seu Master.
2. `https://lojas.nextlevelgroup.com.br` mostra o portal da **NextLevel Commerce**.
3. `https://creators.nextlevelgroup.com.br`, `https://bras.superdrop.com.br` e `https://chinahubglobal.com.br` mostram a página **"Em breve"** de cada produto.
4. `https://superdrop.com.br` continua igual; `https://superdrop.com.br/login` leva a `office.superdrop.com.br/login`.
5. Só depois de tudo certo, remova o `app.superdrop.com.br` do Render (avise quem usa).

## Custo
Cada domínio além dos 2 inclusos custa US$ 0,25/mês no Render. Com 7 domínios (sem o `app.`): ≈ US$ 1,25/mês, além dos US$ 7 do serviço.
