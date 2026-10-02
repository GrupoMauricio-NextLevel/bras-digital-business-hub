# Medição de desempenho (2026-10-03): ponto de partida

> Primeira medição do sistema. **Método e limites** estão em cada bloco. Skill: `.claude/skills/desempenho/SKILL.md`.

## 1. Produção, medida de fora (curl, servidor dos EUA/IAD, 4 a 6 requisições por página)
| Página | TTFB típico | Total típico | Peso (gzip) |
|---|---|---|---|
| `lojas.nextlevelgroup.com.br/` (home atual em produção) | 0,3 a 0,8 s | 0,5 a 1,2 s | 14 KB |
| `lojas…/planos`, `/faq` | 0,3 a 0,7 s | 0,4 a 0,6 s | 7 KB |
| `superdrop.com.br/` | 0,25 a 0,75 s | 0,5 a 1,5 s | 20 KB |
| `superdrop.com.br/planos`, `/login` | 0,23 a 0,46 s | 0,3 a 0,7 s | 5 a 9 KB |
| `master.nextlevelgroup.com.br/login` | 0,26 a 0,35 s | 0,33 a 0,41 s | 5 KB |
**Achados:** (a) a Cloudflare do Render está na frente, mas todas as respostas vêm com `cache-control: private, no-cache, no-store` e `cf-cache-status: DYNAMIC`: **nada é guardado em cache**, cada visita renderiza no servidor; (b) compressão ativa (gzip); HTTP/2; (c) **uma primeira requisição levou 55 s no total** (TTFB 0,78 s, corpo travado), sinal de partida a frio ou travamento de resposta em streaming: precisa de nova observação ao longo de um dia; (d) medido dos EUA: de um celular no Brasil a latência é maior (região do Render e do Neon não verificadas).

## 2. Local em modo de produção (`next build` + `next start`, banco em memória, Lighthouse 13.5 mobile simulado: 4x CPU, rede lenta)
Limites: não mede rede real, nem a Cloudflare, nem o Neon.
| Página | Nota | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|
| Home Commerce **antes** das correções | 74 | 1,1 s | 5,6 s | 260 ms | 0 | 1.241 KB |
| Home Commerce **depois** (mediana de 3) | **86** | 1,1 s | **3,9 s** | 159 ms | 0 | **493 KB** |
| Home SuperDrop | 92 | 1,1 s | 3,3 s | 80 ms | 0 | 330 KB |
| Loja de exemplo (`/store/mantos-shop`) | 92 | 0,9 s | 3,2 s | 100 ms | 0 | 311 KB |
Acessibilidade: SuperDrop e loja 100; Commerce 95 → 97 (restavam contraste de textos pequenos nas cores simuladas e um rótulo de link; ajustados depois, sem nova medição).

## 3. O que foi corrigido na home Commerce
- **Imagens:** 2.087 KB em JPG → 344 KB em WebP na largura certa (banners 960 px, produtos 520 px), via `sharp`.
- Primeira palavra do título sem animação inicial; cabeçalho do celular sem estouro; contraste e ordem de títulos.

## 4. Estado do sistema (build)
**Todas as rotas são dinâmicas** (`ƒ`), inclusive home, planos, dúvidas e vitrines de loja. O CSS global (≈ 20 KB) bloqueia a renderização (≈ 140 a 310 ms simulados).

## 5. Próximas alavancas, em ordem de ganho esperado (a validar)
1. **Cache com revalidação curta** nas páginas públicas e nas vitrines (consultar `node_modules/next/dist/docs/` antes): tira renderização do servidor e permite à Cloudflare servir.
2. **Região e plano:** conferir região do Render e do Neon (ideal próximas entre si e do Brasil) e se há hibernação.
3. **Observar a partida a frio** (achado 1c) por um dia e decidir plano/aquecimento.
4. **LCP ≤ 2,5 s** nas públicas: reduzir CSS bloqueante e peso de fonte; imagens já otimizadas.
5. **Painéis:** medir o tempo de navegação e as consultas (nenhuma medição feita ainda nos painéis autenticados).

## 6. Não medido
Painéis autenticados, consultas ao banco real, rede no Brasil, celular físico, produção com Lighthouse (o navegador do ambiente não confia no proxy para sites externos).
