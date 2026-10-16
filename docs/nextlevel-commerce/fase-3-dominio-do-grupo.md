# Fase 3: nextlevelgroup.com.br no sistema (D156)

Decisão do dono (16/10/2026): o endereço principal **nextlevelgroup.com.br** passa a abrir o site do grupo no nosso sistema (Soluções, Club, Meu Contador, Loja NextLevel, termos). O site atual feito no ChatGPT Sites ("NEXTLEVEL Experiência Estratégica") vai para **experiencia.nextlevelgroup.com.br**.

## Como fica
| Endereço | O que abre |
|---|---|
| `nextlevelgroup.com.br` | Soluções (página inicial do grupo), Club, Meu Contador, Loja NextLevel, termos e privacidade |
| `www.nextlevelgroup.com.br` | Leva para `nextlevelgroup.com.br` (mesmo caminho) |
| `master.nextlevelgroup.com.br` | Login e painéis da equipe (sem mudança). "Entrar" no site do grupo leva para cá |
| `experiencia.nextlevelgroup.com.br` | O site atual do ChatGPT Sites |
| `superdrop.com.br`, `lojas.nextlevelgroup.com.br`, Brás, Cargas | Sem mudança; os links de Soluções, Club e Loja NextLevel passam a apontar para `nextlevelgroup.com.br` |

O código já está pronto e testado (`src/lib/host-routing.ts`, `tests/host-routing.test.ts`). Falta ligar o endereço, em 4 passos, nesta ordem.

## Passo 1: mover o site do ChatGPT (para ele não sair do ar)
1. No ChatGPT Sites, abra o projeto "NEXTLEVEL Experiência Estratégica" → configurações de domínio.
2. Troque o domínio personalizado de `nextlevelgroup.com.br` / `www` para **`experiencia.nextlevelgroup.com.br`**.
3. Ele mostra um registro para criar (normalmente um **CNAME** `experiencia` apontando para `custom-domains.chatgpt.site`). Crie esse registro na Hostinger (passo 3).

## Passo 2: adicionar o domínio no Render
Render → serviço **superdrop** → **Settings → Custom Domains → Add Custom Domain**:
- `nextlevelgroup.com.br`
- `www.nextlevelgroup.com.br`

O Render mostra os valores de DNS de cada um. Use os que ele mostrar (normalmente: raiz com registro **A** para `216.24.57.1`; `www` com **CNAME** para `superdrop.onrender.com`).

## Passo 3: DNS na Hostinger (onde o domínio está)
Hostinger → Domínios → nextlevelgroup.com.br → **DNS / Nameservers**:
1. **Apague** os registros atuais da raiz (`@`, tipo A/AAAA que apontam para o ChatGPT) e o **CNAME `www`** que aponta para `custom-domains.chatgpt.site`.
2. **Crie**:
   - `@` tipo **A** → valor que o Render mostrou (ex.: `216.24.57.1`)
   - `www` tipo **CNAME** → `superdrop.onrender.com`
   - `experiencia` tipo **CNAME** → o valor que o ChatGPT Sites mostrou
3. Não mexa em `master`, `lojas`, `bras`, `cargas` e nos registros de e-mail (MX, TXT).

A troca leva de alguns minutos a algumas horas. No Render, espere aparecer **Verified** e o certificado (cadeado) nos dois endereços.

## Passo 4: me avise "domínio verificado"
Eu ligo no Render, no serviço de produção:
- `GROUP_SITE_URL=https://nextlevelgroup.com.br`
- `BRAND_DOMAINS_NEXTLEVEL=master.nextlevelgroup.com.br,nextlevelgroup.com.br,www.nextlevelgroup.com.br`

E confiro: raiz abre Soluções, `www` leva à raiz, Club e Meu Contador abrem, "Entrar" leva ao Master, os links das marcas apontam para o novo endereço, sitemap e robots do grupo respondem.

**Por que nessa ordem:** se eu ligar `GROUP_SITE_URL` antes do DNS, os links de Soluções e Loja NextLevel nas marcas apontariam para um endereço que ainda mostra o site antigo.

## Voltar atrás (se precisar)
Apagar `GROUP_SITE_URL` no Render devolve o comportamento de antes (páginas do grupo em `master.nextlevelgroup.com.br`). Os redirecionamentos continuam temporários (307) de propósito, para o navegador não guardar o destino.
