# Publicação privada (ChatGPT Sites / Cloudflare)

Versão preparada: **MVP até a U2** (todas as fases anteriores + U1 + U2), em **modo demonstração** (Mercado Pago e Pix SIMULADOS).

## Tipo de aplicação
- **Aplicação Next.js 16 com servidor** (App Router, server actions, sessões por cookie, banco de dados, rotas `/api`, SSE).
- **Não é possível exportar como site estático**: quase todas as telas dependem de sessão e banco. Não existe pasta estática pronta para publicar.

## Build
```bash
npm ci
NEXT_PUBLIC_DEMO_MODE=true npm run build
```
- `NEXT_PUBLIC_DEMO_MODE` é lido **no build**: precisa estar definido nesse comando (ou no ambiente de build). Sem ele, os perfis de demonstração e o Pix simulado não aparecem.
- **Diretório de saída:** `.next/` (saída padrão do Next.js). Para executar, é necessário também `node_modules/`, `package.json`, `public/`, `drizzle/` e `src/` (o build de produção lê `drizzle/` para migrar o banco).

## Execução (preview / produção em Node)
```bash
NODE_ENV=production \
DEMO_AUTOSEED=true DATABASE_URL=pglite://memory \
SESSION_SECRET=<segredo-com-16+-caracteres> CRON_SECRET=<segredo> \
NEXT_PUBLIC_DEMO_MODE=true \
npm run start          # porta ${PORT:-3000}
```
- Com `DEMO_AUTOSEED=true` e `pglite://memory`, o banco nasce migrado e populado na primeira requisição. **Os dados zeram a cada reinício** (uso de demonstração).
- Para manter dados entre reinícios em uma máquina com disco: `DATABASE_URL=pglite:///caminho/data/pg` (ou Postgres, abaixo).
- Verificação: `GET /api/health` devolve `{ "ok": true, ... }`.

## Variáveis e segredos a cadastrar
Cadastre como **segredos** (nunca no código): `SESSION_SECRET`, `CRON_SECRET`, `DATABASE_URL` (quando for Postgres), `MASTER_PASSWORD` (se usar bootstrap sem demonstração).
Como variáveis comuns: `NEXT_PUBLIC_DEMO_MODE`, `DEMO_AUTOSEED`, `APP_URL`, `SUPERDROP_ROOT_DOMAIN`, `MASTER_EMAIL`.
Lista completa (somente nomes) em `.env.example`.
As credenciais do Mercado Pago **não** são variáveis: são coladas no painel de cada tenant e guardadas criptografadas no banco. Em demonstração ninguém precisa delas.

## Mercado Pago em demonstração
- Sem credencial conectada, recarga de saldo e pagamento de faturas geram um Pix fictício, marcado na tela como **"PIX SIMULADO"**, com botão "Simular pagamento".
- O checkout da vitrine em demonstração aprova o pedido sem cobrar (`paymentProvider = DEMO`).
- Fora do modo demonstração, sem credencial, o usuário vê apenas uma mensagem simples ("ainda não habilitado"); nenhum erro técnico é exibido. Detalhes técnicos vão só para o log do servidor.

## Bloqueios técnicos reais para Cloudflare Workers
Foi feita uma tentativa de build com o adaptador OpenNext para Cloudflare. O Next.js compilou, mas o empacotamento do Worker **falhou** ao resolver `pg-cloudflare` (dependência do driver `pg`). A tentativa foi revertida para não deixar dependências sem uso. Mesmo resolvendo esse ponto, restam bloqueios de arquitetura que **não foram contornados de propósito** (regra: não redesenhar):

1. **Banco de dados.** O código usa Drizzle com dialeto **Postgres**. Em Workers não há disco (PGlite em arquivo não funciona) nem Postgres embutido garantido. Caminho viável: Postgres externo (ex.: Neon) via **Cloudflare Hyperdrive** + driver compatível com Workers.
2. **Migrações lidas do disco.** `src/db/migrate.ts` faz `readFileSync` da pasta `drizzle/` em tempo de execução; em Workers as migrações teriam de ser aplicadas no deploy (`npm run db:migrate` contra o banco) ou empacotadas como módulo.
3. **SSE de longa duração** (`/api/live/orders`): Workers limitam a duração/CPU; o polling de fallback cobre, mas precisa ser validado.
4. **APIs Node** (`node:crypto` com scrypt/AES-GCM, `node:fs`): exigem `nodejs_compat` e testes em `workerd`, ainda não feitos.
5. **D1 (SQLite)**: migrar exige reescrever o schema (`pg-core` → `sqlite-core`: `jsonb`, `timestamptz`, índices únicos parciais, `SELECT … FOR UPDATE` da carteira, `RETURNING`) e revalidar as regras de concorrência da carteira e das ondas. É trabalho de várias fases, não de publicação.

**Conclusão:** hoje o MVP roda de forma confiável em qualquer host **Node** (Docker/`Dockerfile`, Railway, Fly.io, Render, VPS, ou o runtime Node de uma plataforma de sites). Se o ChatGPT Sites executar apenas Workers, a publicação depende de uma das rotas acima; não afirmamos compatibilidade sem ter testado no ambiente real.

## Dependências futuras (não bloqueiam o preview Node)
| Recurso | Uso previsto | Estado atual |
|---|---|---|
| **Cloudflare Hyperdrive + Postgres** | Banco em Workers | não configurado |
| **Cloudflare D1** | Alternativa ao Postgres | exige reescrita do schema |
| **Cloudflare R2** | Etiquetas PDF, fotos e anexos | hoje ficam no banco (base64) |
| **E-mail transacional** | Avisos e convites | não implementado |
| **Cron** | `/api/cron/expire-reservations` (5–10 min) e `/api/cron/finance` (diário), header `Authorization: Bearer $CRON_SECRET` | precisa ser agendado na hospedagem |

## Segurança para publicação privada
- Nenhuma credencial real no código nem no ZIP (`.env*` não são incluídos; só `.env.example` sem valores).
- Defina `SESSION_SECRET` e `CRON_SECRET` próprios; sem `SESSION_SECRET` (mín. 16 caracteres) a produção não consegue assinar sessões e falha no login.
- Como o ambiente é de demonstração com dados fictícios e senha `demo1234`, mantenha o site **privado** (acesso restrito).
