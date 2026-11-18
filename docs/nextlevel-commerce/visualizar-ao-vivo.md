# Ver o design ao vivo (no seu computador), publicar só no final

## Por quê
Publicar no Render leva de 3 a 6 minutos e vai para o ar a cada push. Para **desenhar**, o melhor é rodar o sistema **no seu próprio computador**: cada arquivo salvo atualiza a tela no navegador em poucos segundos (é o "ao vivo" de verdade). Só quando você aprovar, publica.

> **Abacus (D346):** para trabalhar o visual com o Abacus, use o guia `docs/abacus/COMECE-AQUI.md` e o script `scripts/preparar-abacus.ps1` (branch `abacus/visual`, com trava de envio). O resto desta página vale igual.

## Preparar o computador (uma vez)
1. Instale o **Node 22 (LTS)** (nodejs.org) e o **Git**.
2. Na pasta do projeto no seu computador (o clone do repositório `GrupoMauricio/bras-digital-business-hub`): `npm ci`.

## Ligar a demonstração
Na pasta do projeto, no PowerShell:
`powershell -ExecutionPolicy Bypass -File scripts/dev-demo.ps1`
Abra **http://localhost:3100**. A primeira abertura de cada página demora (compila); depois é rápido. O Codex edita os arquivos da pasta e o navegador atualiza sozinho. Os perfis de demonstração aparecem em `/login` (senha `demo1234`).

## Ver cada produto
- **SuperDrop:** abra `http://localhost:3100` normalmente.
- **NextLevel Commerce:** abra `http://localhost:3100/lojas` (liga a visão da Commerce); `http://localhost:3100/lojas/sair` volta ao SuperDrop.
- **Master:** entre em `/login` com o perfil "Equipe NextLevel".
- **No celular** (mesmo Wi-Fi): edite `scripts/dev-demo.ps1`, troque `127.0.0.1` por `0.0.0.0` e abra `http://IP-DO-PC:3100`.

## Fluxo para "publicar só no final"
- O Codex trabalha numa branch própria (`codex/visual`) no computador e vê tudo ao vivo; nada vai para o Render.
- Quando você aprovar uma etapa, ele une essa branch à branch de publicação (`git pull --rebase`, depois o push). **O push é o que publica.**
- O Claude trabalha na nuvem, na branch de publicação, e **não** aparece ao vivo no seu computador: as mudanças dele chegam quando você (ou o Codex) faz `git pull`.
