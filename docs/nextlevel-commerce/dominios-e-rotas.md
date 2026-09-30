# Racional de domínios e rotas (PROPOSTA, aguardando aprovação do dono)

Objetivo: separar **o que é público** do **que é painel de trabalho**, com endereços fáceis de passar para fornecedores, lojistas e parceiros, dentro do limite do Render (2 domínios inclusos no plano Hobby; cada extra custa US$ 0,25/mês e exige cartão cadastrado; redirecionamento `www` não conta).

## 1. Os três endereços (o que cada um faz)

| Endereço | Papel | Quem usa |
|---|---|---|
| `superdrop.com.br` | **Público SuperDrop**: institucional, páginas de fornecedores e vitrines dos vendedores | qualquer visitante e o cliente final |
| `office.superdrop.com.br` | **Escritório** (painéis), com **um login só** para Master, Fornecedor, Vendedor (lojista) e Afiliado | equipe NextLevel, fornecedores, lojistas, parceiros |
| `lojas.nextlevelgroup.com.br` | **Público NextLevel Commerce**: portal da plataforma de lojas virtuais e vitrines das lojas da Commerce | visitantes, novos lojistas e clientes finais |

Observação sobre o seu desenho: no último item da sua lista ("painel de controle das lojas") entendi **afiliado**, isto é, o painel do parceiro. Ajuste se não for isso.

## 2. Mapa de páginas por endereço

### `superdrop.com.br` (público SuperDrop)
| Caminho | Página |
|---|---|
| `/` | institucional para geral |
| `/planos`, `/faq`, `/como-funciona` | conteúdo institucional |
| `/seja-fornecedor`, `/parceiros`, `/parceiros/cadastro` | captação de fornecedores e parceiros |
| `/cadastro` | criar loja (escolhe fornecedor e plano) |
| `/f/<fornecedor>` | **loja pública do fornecedor** (já existe) |
| `/loja/<vendedor>` (+ `/produto`, `/carrinho`, `/checkout`, `/pedido`, `/acompanhar`) | **vitrine pública do vendedor** (hoje `/store/<slug>`, que continua funcionando e redireciona) |
| `/r/<código>` | link rastreável de parceiro |
| `/api/webhooks/*` | retorno do Mercado Pago |
| `/login` e demais telas de painel | **redirecionam para o escritório** |

### `office.superdrop.com.br` (escritório, login único)
| Caminho | Página |
|---|---|
| `/` e `/login` | **login único**; depois leva cada pessoa ao painel do seu nível |
| `/esqueci-senha`, `/redefinir-senha`, `/conta/senha` | recuperação e troca de senha |
| `/master/*` | painel Master (todas as marcas, com filtro) |
| `/supplier/*`, atalho `/f/<fornecedor>` | painel do fornecedor |
| `/merchant/*`, atalho `/loja/<vendedor>` | painel do vendedor/lojista |
| `/partner/*`, atalho `/afiliado` | painel do afiliado |
| `/theme-editor`, `/api/cron`, `/api/labels` | editor de tema, rotinas e etiquetas |
| páginas públicas (institucional, vitrines) | **redirecionam para o endereço público** |

Os atalhos (`/f/<nome>`, `/loja/<nome>`, `/afiliado`) servem para **enviar ao fornecedor/lojista/afiliado um link bonito**: ele abre o login e, depois de entrar, vai ao painel certo. O acesso ao dado continua decidido pela sessão da pessoa (um fornecedor nunca vê outro, mesmo digitando o nome de outro no endereço).

### `lojas.nextlevelgroup.com.br` (público NextLevel Commerce)
| Caminho | Página |
|---|---|
| `/` | portal da plataforma de lojas virtuais |
| `/planos`, `/faq`, `/como-funciona` | conteúdo da marca |
| `/quero-minha-loja`, `/cadastro` | lista de espera / criar loja (conta simples) |
| `/loja/<vendedor>` | **vitrine pública** das lojas da Commerce |
| `/r/<código>`, `/api/webhooks/*` | parceiros e Mercado Pago |
| login | leva ao escritório |

## 3. Regras que tornam isso seguro e limpo
1. **Uma loja, um endereço oficial.** Cada loja tem um endereço canônico pela marca dela (SuperDrop ou Commerce). Se alguém abrir pelo endereço errado, é redirecionada ao certo (evita conteúdo duplicado no Google). Quando a loja tiver domínio próprio, esse vira o oficial.
2. **Painel e vitrine em endereços diferentes = mais segurança.** A sessão de login fica só no `office.` (não é enviada a `superdrop.com.br`). Se uma vitrine personalizada tiver um problema de segurança, ela não alcança a sessão de quem administra.
3. **O escritório é neutro** ("NextLevel Office"): serve SuperDrop e Commerce. As telas mostram a marca da organização da pessoa (não a do endereço).
4. **E-mails** apontam para o lugar certo: senha e painel → escritório; pedido e vitrine → endereço da loja.
5. **Nomes reservados:** `master`, `supplier`, `merchant`, `partner`, `afiliado`, `api`, `login`, `f`, `loja`, `r` não podem ser nome de loja ou fornecedor.
6. **Endereços técnicos** (`*.onrender.com`, `localhost`) continuam funcionando como hoje, sem separação, para testes.

## 4. Domínios e custo no Render
Hoje: `superdrop.com.br` e `app.superdrop.com.br` (2/2).

| Situação | Domínios | Custo |
|---|---|---|
| **Recomendado** | `superdrop.com.br`, `office.superdrop.com.br`, `lojas.nextlevelgroup.com.br` (3) | +US$ 0,25/mês (cadastrar cartão, que você precisará de qualquer forma para o plano pago) |
| Transição | manter `app.superdrop.com.br` por um tempo redirecionando para o `office.` e depois removê-lo | volta a 3 domínios |
| Depois | `nextlevelcommerce.com.br` no lugar de `lojas.nextlevelgroup.com.br` (ou ao lado) | +US$ 0,25/mês cada extra |
| **Sem pagar nada** | `superdrop.com.br` + `office.superdrop.com.br` (trocando o `app.`) e a Commerce aparece por `superdrop.com.br/lojas` (prévia que já existe) | US$ 0 |

Fora do escopo (precisam de passo à parte): subdomínio por loja (`nome.lojas.nextlevelgroup.com.br`) exige certificado curinga; domínio próprio de cada loja já está previsto nos planos.

## 5. Como implementar (fases, depois da sua aprovação)
- **D0 (você, no Render e no DNS):** cadastrar o cartão; adicionar `office.superdrop.com.br` e `lojas.nextlevelgroup.com.br`; criar os CNAMEs.
- **D1 (eu):** "papel do endereço" no código (escritório, público SuperDrop, público Commerce, técnico); redirecionamentos entre papéis no `proxy.ts`; login único no escritório e saída por nível; `/loja/<slug>` como endereço oficial com `/store/<slug>` redirecionando; atalhos `/f/<nome>`, `/loja/<nome>`, `/afiliado` no escritório; endereço oficial da loja por marca; links dos e-mails; nomes reservados; testes e e2e simulando os três endereços.
- **D2 (opcional):** endereços bonitos dentro do painel (`office.../f/<nome>/produtos`). Custa reescrever todos os links do painel e acrescenta pouco, porque a sessão já define de quem é o painel. Recomendo **não** fazer agora.
- **D3:** domínio próprio por loja (Commerce) e depois subdomínio por loja.

## 6. Pendência de segurança (independente dos domínios)
Se o banco do site público tiver os usuários de demonstração (`*.demo`, senha `demo1234`), é preciso removê-los ou bloqueá-los e criar um Master real antes de divulgar.
