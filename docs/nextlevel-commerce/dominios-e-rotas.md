# Racional de domínios, painéis e acessos (PROPOSTA v2, aguardando aprovação do dono)

Esta versão **substitui a v1** (que tinha um "escritório" comum em `office.superdrop.com.br`). Por decisão do dono:
- **Cada marca tem sua própria casa**: um endereço principal com as páginas públicas, as vitrines **e** os painéis daquela marca.
- **NextLevel Commerce** → `lojas.nextlevelgroup.com.br`. **SuperDrop** → `superdrop.com.br` (painéis e páginas com a marca SuperDrop).
- A gestão Master de cada marca pode ser **uma pessoa diferente** do Master da holding (seção 4).

Limite do Render: 2 domínios inclusos no plano Hobby; cada extra custa US$ 0,25/mês e pede cartão; o redirecionamento `www` não conta.

## 1. Os endereços

| Endereço | Marca | O que tem |
|---|---|---|
| `lojas.nextlevelgroup.com.br` | **NextLevel Commerce** | portal da plataforma, vitrines das lojas, login e painéis (lojista, afiliado, gestão da marca) |
| `superdrop.com.br` | **SuperDrop** | portal institucional, `/f/<fornecedor>` (loja pública do fornecedor), `/loja/<vendedor>` (vitrine do vendedor), login e painéis (fornecedor, lojista, afiliado, gestão da marca) |
| `app.superdrop.com.br` | SuperDrop | hoje existe; passa a **redirecionar** para `superdrop.com.br` e sai do Render (libera vaga) |
| `nextlevelcommerce.com.br` (futuro) | NextLevel Commerce | vira o endereço principal da Commerce quando comprado; `lojas.nextlevelgroup.com.br` redireciona |

**Render, contagem:** `superdrop.com.br` + `lojas.nextlevelgroup.com.br` = **2 domínios, sem custo** (trocando o `app.superdrop.com.br`). Cada domínio novo depois (ex.: `nextlevelcommerce.com.br`) custa US$ 0,25/mês.

## 2. Mapa de páginas (cada marca no seu endereço)

| Caminho | O que é | SuperDrop | Commerce |
|---|---|---|---|
| `/` , `/planos`, `/faq`, `/como-funciona` | institucional da marca | sim | sim |
| `/seja-fornecedor`, `/parceiros*` | captação de fornecedores e programa de parceiros | sim | parceiros só quando a marca abrir |
| `/cadastro`, `/quero-minha-loja` | criar loja (SuperDrop escolhe fornecedor; Commerce é conta simples) | sim | sim |
| `/f/<fornecedor>` | loja pública do fornecedor | sim | não existe |
| `/loja/<vendedor>` (+ produto, carrinho, checkout, pedido, acompanhar) | vitrine pública do vendedor (`/store/<slug>` continua e redireciona) | sim | sim |
| `/r/<código>` | link rastreável de parceiro | sim | sim |
| `/login`, `/esqueci-senha`, `/redefinir-senha` | acesso, com a cara da marca | sim | sim |
| `/painel` | **atalho**: entra e leva ao painel do nível da pessoa | sim | sim |
| `/master` | gestão Master | da marca (ou da holding) | da marca (ou da holding) |
| `/supplier` | painel do fornecedor | sim | (só se a Commerce passar a ter fornecedores) |
| `/merchant` | painel do vendedor/lojista | sim | sim |
| `/partner` | painel do afiliado | sim | quando a marca abrir parceiros |
| `/api/webhooks/*`, `/api/cron` | Mercado Pago e rotinas | sim | sim |

Por que **não** pôr o nome do fornecedor/loja nas URLs do painel (`/f/<nome>/produtos`): a sessão já define de quem é o painel, e reescrever todos os links custa muito. O atalho `/painel` resolve o "link bonito" de convite.

## 3. Regras de funcionamento
1. **A marca vem do endereço** e vale para tudo: logo, nomes, cores, textos dos painéis e e-mails. Os painéis deixam de ter a marca fixa SuperDrop.
2. **Uma conta pertence a uma marca** (a da organização). Lojista, fornecedor e afiliado só entram pelo endereço da própria marca; pelo outro, veem "sua conta é da NextLevel Commerce/SuperDrop, entre em <endereço>". Isso evita a confusão que você viu (entrar pela Commerce e cair no painel do SuperDrop).
3. **Uma loja, um endereço oficial** (o da marca dela, ou o domínio próprio quando existir). Abrir pelo endereço errado leva ao certo.
4. **Sessão por endereço**: o login de um endereço não vale no outro (cookie do próprio domínio).
5. **Aceitamos um risco conhecido**: painel e vitrines ficam no mesmo endereço. Mitigação: as vitrines usam o motor de temas (sem HTML livre do lojista) e os cookies são protegidos. O risco some quando cada loja tiver domínio próprio.
6. **Nomes reservados** para loja/fornecedor: `master`, `supplier`, `merchant`, `partner`, `painel`, `api`, `login`, `f`, `loja`, `r`.
7. **Endereços técnicos** (`*.onrender.com`, `localhost`) continuam como hoje, para testes (a prévia `/lojas` segue valendo até o domínio estar no ar).

## 4. Gestão Master: holding e gestores de marca
Hoje existe um único tipo de Master, que enxerga **tudo**. Com duas marcas, o desenho recomendado é:

| Nível | Quem | Enxerga | Onde entra |
|---|---|---|---|
| **Master da holding** | você | todas as marcas, com um seletor "Todas · SuperDrop · NextLevel Commerce" | qualquer endereço |
| **Gestor da marca** | a pessoa que cuida do SuperDrop, ou da Commerce | **só a sua marca** (lojas, fornecedores, pedidos, interessados, parceiros) | só no endereço da própria marca |
| Suporte (futuro) | atendimento | leitura limitada | conforme a marca |

Áreas **só da holding**: financeiro consolidado, planos e preços, configurações globais (Mercado Pago da NextLevel, e-mail), equipe e acessos dos gestores.

Como fazer, com segurança:
- Cada usuário Master ganha um **escopo de marcas** (vazio = todas). É uma trava a mais **além** do isolamento por loja/fornecedor, que não muda.
- Um único ponto de código aplica o filtro de marca em todas as listas do Master (lojas, fornecedores, pedidos, CRM, parceiros, escritório virtual, financeiro). Cada tela do Master ganha teste provando que um gestor de marca **não** vê dados da outra.
- No endereço de uma marca, o painel já abre filtrado nela; o Master da holding pode trocar para "Todas".
- O seletor e a área "NextLevel Commerce" do Master (já criada) passam a ser o "painel da marca": o gestor da Commerce cai direto nela.

## 5. Fases
- **D0 (você):** adicionar `lojas.nextlevelgroup.com.br` no Render e o CNAME no DNS; depois tirar o `app.superdrop.com.br` (com aviso aos usuários).
- **D1 (eu): marca por endereço nos painéis.** Logo, nome e textos dos painéis, login e e-mails pela marca do endereço; trava "conta da outra marca"; `/painel`; redirecionamentos.
- **D2 (eu): escopo de marcas no Master**, seletor, áreas só da holding e testes de isolamento por marca.
- **D3 (eu):** `/loja/<slug>` como endereço oficial (com `/store/<slug>` redirecionando) e endereço oficial da loja por marca nos e-mails.
- **D4:** domínio próprio por loja (Commerce), depois subdomínio por loja (precisa certificado curinga).

## 6. Pendência de segurança (independente dos domínios)
Se o banco do site público tiver usuários de demonstração (`*.demo`, senha `demo1234`), é preciso removê-los ou bloqueá-los e criar um Master real antes de divulgar. A área "NextLevel Commerce" do Master já mostra esse alerta.
