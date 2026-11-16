# NB0 do NextLevel Business: diagnóstico curto e linha de base (13/11/2026)

> Plano: `docs/prompts/nextlevel-business-coracao-do-negocio.md`. Decisões: D302 (nome e organização) e D303 (esta fase).
> Commit de partida: `bee6a2c` (branch `ccr-ecbeafd1-sh4iy2`). Nenhum código de produto foi alterado nesta fase.

## 1. Verificações automáticas (antes de qualquer mudança)
| Verificação | Resultado |
|---|---|
| Tipos (`npx tsc --noEmit`) | Passou |
| Estilo (`npx eslint src e2e tests`) | Passou |
| Testes dos pontos que o plano vai mexer (19 arquivos: recursos por plano, fila do dia, visão geral, caixa do Master, Minha conta do cliente, propostas, CRM, motor/instalação/renderização/loja de temas, SEO da vitrine, jornada da vitrine, criação de loja, menu, tráfego TR1 e TR3, pedidos, base de conhecimento) | **231 de 231 passaram** |
| Bateria completa e `npm run build` | Não rodados (fase sem código; ficam para o fim da NB1, regra dos testes enxutos) |

## 2. Testes de navegador (demonstração local, porta 3100)
| Teste | Resultado | Observação |
|---|---|---|
| `e2e/smoke-demo.mjs` | Passou (24 páginas) | |
| `e2e/storefront-journey.mjs` | Passou | Loja do membro, editor de produto, logo |
| `e2e/theme-editor.mjs` | Passou | Inclui axe no editor (computador e celular) |
| `e2e/checkout-flow.mjs` | **Falha preexistente** | Fluxo antigo do SuperDrop (página do fornecedor → Pix); para em `[data-blocked-screen]`. SuperDrop em pausa (D216/D287). Não é regressão; não bloqueia o Business |
| `e2e/ecommerce-do-zero.mjs` | Não se aplica neste ambiente | O cadastro da Commerce está **fechado** na demonstração (sem `BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true`): `/cadastro` leva a `/quero-minha-loja`. Precisa do servidor de teste (`npm run e2e`, porta 3300) para valer como linha de base |

**Regressão a repetir no fim de cada fase NB:** `smoke-demo`, `storefront-journey`, `theme-editor` e, no servidor de teste, `ecommerce-do-zero`.

## 3. O que a NB0 corrigiu ou acrescentou no plano
1. **Topo do painel:** a Commerce usa `src/components/commerce/commerce-home.tsx` ("Visão geral da loja"). O "SuperDrop / Minha operação" de `src/app/merchant/page.tsx` só aparece na marca SuperDrop. Não há vazamento na Commerce. A NB1 troca o título para "NextLevel Business · Visão geral do negócio".
2. **Dois modos de entrada (Parte 5.15):** com o cadastro fechado, a entrada é o formulário assistido "Quero minha loja virtual". A escolha Site ou Loja virtual passa a existir também nele, e no Master ao criar a conta.
3. **Academia confirmada (Parte 5.16 e Anexo A):** as fases NB1 a NB3 já preparam o portal:
   - chave `portal` nos módulos;
   - endereço `/portal` reservado;
   - fuso do negócio;
   - aluno = cliente da loja com login por código;
   - modelo de site "Academia".

   O detalhamento do dono entra em `docs/prompts/portal-academia-piloto.md`.
4. **Inventário da Parte 4 conferido** nos pontos citados (editor com 4 páginas fixas, balcão "em breve", sem campo de código de barras, sem nota fiscal, `/solucoes` da agência, `crm_acompanhamento` e `origens_contato` com marca por loja, login do cliente sem senha por loja).

## 4. Prints do estado atual (o "antes" da NB1)
- `docs/relatorios/nb0/antes-painel-lojista-commerce.png`: painel do lojista com o menu de hoje (Escritório, Crescer, Loja e ajustes).
- `docs/relatorios/nb0/antes-quero-minha-loja.png`: entrada assistida de hoje, só para loja virtual.

## 5. Esforço do dia por frente
E-commerce 100% (plano do NextLevel Business, D302 e D303).

## 6. Próxima fase
**NB1:**
- dois caminhos na entrada (cadastro aberto e formulário assistido);
- `stores.formato` e `stores.fuso`;
- `modulos.ts`;
- menu em quatro grupos com o NextLevel Business;
- visão geral com o nome do gerenciador;
- páginas `/empresas`;

tudo atrás da chave `BUSINESS_V1`.
