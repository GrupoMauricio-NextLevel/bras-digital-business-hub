# NextLevel Commerce Engine · SuperDrop (MVP)

Plataforma de e-commerce multi-tenant da NextLevel Marketing Ltda. Fornecedor → catálogo central → rede de lojistas → loja white label → cliente final → pedido → Central → expedição.

Detalhes de arquitetura: [ARCHITECTURE.md](./ARCHITECTURE.md). Este motor também sustentará, no futuro, o **Brás Digital** (marketplace atacadista) sem um segundo core.

## Como rodar local (sem instalar banco)

O banco local é o **PGlite**, um Postgres embutido que grava em `./data/pg`. Nada a instalar além do Node 20+.

```bash
cp .env.example .env.local        # já vem com PGlite e demo mode
npm install
npm run db:migrate                # cria as tabelas em ./data/pg
npm run db:seed                   # dados de demonstração
npm run dev                       # http://localhost:3000
```

`npm run db:reset` apaga o banco local e recria migrações + seed.

## Ambiente de teste com cliente real (sem demo)

1. Defina no ambiente: `DATABASE_URL` (Postgres), `SESSION_SECRET` (`openssl rand -hex 32`), `CRON_SECRET`, `MASTER_EMAIL`, `MASTER_PASSWORD` (mín. 10 caracteres), `NEXT_PUBLIC_DEMO_MODE=false` e, se a URL pública não for detectada, `APP_URL=https://…`.
2. `npm run db:bootstrap` cria tabelas, dados de referência e o master. Não há dados fictícios.
3. Entre em `/login` como master → **Fornecedores → Novo fornecedor**. Envie e-mail e senha temporária ao responsável.
4. O fornecedor troca a senha, cadastra produtos em **Produtos → Novo produto** (com fotos) ou **Importar CSV**, e cria lojas em **Lojistas → Nova loja**.
5. O lojista troca a senha, conecta o Mercado Pago em **Configurações → Pagamentos**, usa **Produtos → Ativar todos** e **Loja Virtual → Publicar loja**.
6. Agende `GET /api/cron/expire-reservations` (header `Authorization: Bearer $CRON_SECRET`) a cada 5–10 minutos.
7. Diagnóstico: `/api/health`.

Mercado Pago: use credenciais de teste (`TEST-…`) para ensaiar e a conta de produção (`APP_USR-…`) para a venda real. A notificação de pagamento precisa de URL pública https (definida automaticamente por cobrança).

## Acessos demo (apenas com `SEED_DEMO=true` e `NEXT_PUBLIC_DEMO_MODE=true`) (sem senha)

Abra `/login` e escolha um perfil (senha `demo1234`), ou use o **Demo Role Switcher** no topo:

| Perfil | Usuário | Painel |
|---|---|---|
| NextLevel Master | master@nextlevel.demo | `/master` |
| Fornecedor (Central Sports) | central@centralsports.demo | `/supplier` |
| Lojista Mantos Shop | dono@mantosshop.demo | `/merchant` |
| Lojista Arena 10 | dono@arena10.demo | `/merchant` |
| Lojista Fut Classics (suspensa) | dono@futclassics.demo | `/merchant` |

Storefronts públicas: `/store/mantos-shop` · `/store/arena-10` (`/store/fut-classics` não publicada: só o dono vê em pré-visualização).

## Golden path da demonstração

1. `/master` — fornecedores, redes, lojas, GMV.
2. Alterne para **Fornecedor** — produtos, estoque central (físico/reservado/disponível), lojistas da rede.
3. Alterne para **Lojista Mantos Shop** — dashboard, checklist de onboarding, aparência (nome, logo, cores), templates.
4. Abra a loja (`/store/mantos-shop`), escolha um produto, tamanho (ou grade de 12), carrinho, checkout.
5. Pedido aparece em `/merchant/orders` como *Aguardando pagamento à Central*.
6. **Confirmar pagamento à Central** → *Aguardando etiqueta*. **Registrar etiqueta** → *Pronto para separação*.
7. Alterne para **Fornecedor** → `/supplier/shipping`: iniciar separação → pronto para envio → enviado (baixa estoque).
8. `/merchant/services` (Serviços NextLevel, "Tenho interesse") e `/merchant/templates` (Starter ativo, Pro/Elite demonstrativos).

## Publicar na internet (navegável)

**Netlify (recomendado, sem banco externo)**
1. Em app.netlify.com: *Add new site → Import an existing project → GitHub* → repositório `GrupoMauricio/bras-digital-business-hub`, branch `claude/wonderful-cannon-5o38v5`. O `netlify.toml` já define build e Node.
2. No site criado, abra *Extensions* e instale **Neon (Netlify DB)**, ou rode `netlify db init` no terminal. Isso cria um Postgres gratuito e injeta `NETLIFY_DATABASE_URL`, que o app usa automaticamente.
3. Em *Site configuration → Environment variables*, confirme `NEXT_PUBLIC_DEMO_MODE=true` (o `netlify.toml` já define para o build).
4. *Trigger deploy*. O build roda `npm run db:bootstrap` (migrações + seed de demonstração, idempotente) e compila o Next.js.
5. Abra o domínio `.netlify.app`: a tela de login mostra os perfis de demonstração.

**Docker (Railway, Fly.io, Render, VPS)**
A imagem usa PGlite em volume persistente (`/app/data`) e faz o bootstrap no boot. Configs prontas: `railway.json`, `fly.toml`, `render.yaml`. Para um Postgres externo, defina `DATABASE_URL=postgres://…`.

**Vercel**
Defina `DATABASE_URL` apontando para um Postgres (Neon, Supabase) e rode `npm run db:bootstrap` uma vez contra ele.

## Scripts

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest (isolamento, estoque, pedidos, permissões)
npm run build       # build de produção
npm run start:prod  # bootstrap do banco + next start (usado no Docker)
```
