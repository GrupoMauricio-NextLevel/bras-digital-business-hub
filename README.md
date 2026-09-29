# NextLevel Commerce Engine · SuperDrop (MVP)

Plataforma de e-commerce multi-tenant da NextLevel Marketing Ltda. Fornecedor → catálogo central → rede de lojistas → loja white label → cliente final → pedido → Central → expedição.

Detalhes de arquitetura: [ARCHITECTURE.md](./ARCHITECTURE.md). Este motor também sustentará, no futuro, o **Brás Digital** (marketplace atacadista) sem um segundo core.

## Como rodar

```bash
cp .env.example .env.local        # já vem com SQLite local e demo mode
npm install
npm run db:migrate                # cria data/nextlevel.db
npm run db:seed                   # dados de demonstração
npm run dev                       # http://localhost:3000
```

`npm run db:reset` apaga o banco local e recria migrações + seed.

## Acessos demo (sem senha)

Abra `/login` e escolha um perfil, ou use o **Demo Role Switcher** no topo:

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

O app precisa de um servidor Node e um banco. Duas rotas prontas:

**Opção A — Railway (mais simples, ~5 min, banco no próprio volume)**
1. Crie um projeto em railway.app → *Deploy from GitHub repo* → escolha este repositório e a branch.
2. O `Dockerfile` e o `railway.json` são detectados automaticamente.
3. Em *Settings → Volumes*, adicione um volume montado em `/app/data`.
4. Em *Settings → Networking*, gere o domínio público. No primeiro boot o app aplica migrações e o seed de demonstração.

A mesma imagem funciona em **Fly.io** (`fly launch` usa o `fly.toml`; crie o volume `nextlevel_data`) e **Render** (`render.yaml` com disco em `/app/data`).

**Opção B — Netlify ou Vercel + Turso (sem servidor próprio)**
Netlify e Vercel rodam o Next.js em funções serverless, sem disco persistente, então o banco fica no Turso (SQLite hospedado; nenhuma mudança de código).
1. Crie um banco em turso.tech e copie a URL `libsql://…` e o token.
2. Importe o repositório na Netlify (*Add new site → Import from Git*; o `netlify.toml` já está pronto) ou na Vercel, e defina `DATABASE_URL`, `DATABASE_AUTH_TOKEN` e `NEXT_PUBLIC_DEMO_MODE=true` nas variáveis de ambiente.
3. Uma vez, localmente, rode `DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run db:bootstrap` para criar tabelas e seed no Turso.
4. Deploy.

`npm run db:bootstrap` é idempotente: aplica migrações e só roda o seed se o banco estiver vazio.

## Scripts

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest (isolamento, estoque, pedidos, permissões)
npm run build       # build de produção
npm run start:prod  # bootstrap do banco + next start (usado no Docker)
```
