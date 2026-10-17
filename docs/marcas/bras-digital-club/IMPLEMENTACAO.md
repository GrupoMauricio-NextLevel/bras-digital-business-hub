# Brás Digital Club: implementação da identidade (D158)

Pacote recebido: `bras-digital-club-upload-sistema-v2.zip` (17/10/2026). Os documentos originais estão nesta pasta (`docs/`, `integration/`, `tokens/`, `referencias/`); os arquivos de imagem oficiais, em `public/marcas/bras-digital-club/`.

## 1. Arquitetura encontrada
- Marca no sistema: código `BRAS_DIGITAL` (`src/lib/brand.ts`), gravado no banco em organizações, membros (`bd_members`), pedidos e regras. **Não foi renomeado**: só o nome exibido, o slogan e a identidade visual mudaram. Nenhuma migração de banco.
- Cores: tema `bras` em `src/design-system/themes.ts` (variáveis `--ds-*` no `<html data-ds-theme="bras">` no endereço da Brás e em `AreaTheme` nas áreas Meu Brás, importadora, Estúdio e balcão) e paleta em `src/lib/brand-palette.ts`.
- Página pública: `src/components/portal/bras/bras-home.tsx` + `bras.css` (prefixo `bd-`), na raiz do endereço da Brás (`bras.nextlevelgroup.com.br`).
- Logo: `BrandLogo` (`src/components/brand/brand-logo.tsx`) usado no cabeçalho e rodapé públicos, login, cadastro e na casca dos painéis (`AppShell`).

## 2. Fonte única
`src/lib/marcas/bras-digital-club.ts`: `BDC` (nome, slogan, rota, `canonicalUrl: null`, cores, gradiente, papéis claro/escuro do pacote), `BDC_LOGOS`, `BDC_HEROI`, `BDC_ICONES` e `bdcCssVars()` (constantes `--bdc-*`). Quem lê: `themes.ts`, `brand-palette.ts`, `brand.ts`, `marcas-visuais.ts`, `brand-logo.tsx`, `app/layout.tsx` (ícones, manifesto, cor da barra do navegador), `og-marca.ts`, `host-routing.ts`, a página pública e `bras.css` (via `--bdc-*`).

## 3. Tokens e temas
| Papel | Claro | Escuro |
|---|---|---|
| Fundo de trabalho (`canvas`) | `#F7F9FC` | `#0C1830` |
| Superfície | `#FFFFFF` | `#132445` |
| Tinta | `#0C1830` | `#F4F1E9` |
| Ação (botão primário) | `#315CFF`, texto branco 5,1:1 | `#315CFF`, texto branco |
| Link e selos | `#2449D8` (azul de ação mais escuro do pacote; 5,8:1 sobre o fundo suave) | `#6C8AFF` clareado 30% (AA sobre superfície e fundo suave) |
| Barra lateral | navy `#0C1830` | navy derivado |
| Destaque (pulso) | ciano `#00D4FF` (só detalhe; texto de destaque em navy) | ciano |
| Foco | azul `#315CFF` (ciano não chega a 3:1 no branco) | ciano `#00D4FF` |
Estados (sucesso, alerta, erro, informação) e a paleta dos gráficos seguem os do sistema, iguais para todas as marcas. Contrastes conferidos por `tests/design-system.test.ts` e `tests/vidro-contraste.test.ts`.

## 4. Onde cada logo aparece
| Arquivo | Onde |
|---|---|
| `logo-clara` | cabeçalho público, login e cadastro no modo claro; barra lateral não (é navy) |
| `logo-escura` | cabeçalho sobre o herói navy e no modo escuro; barra lateral expandida (navy) nos dois modos; lateral do cadastro |
| `logo-escura-com-slogan` | rodapé institucional escuro |
| `logo-clara-com-slogan` | disponível no `BrandLogo` (`variant="assinatura-completa"`, fundo claro) |
| `monograma-claro`/`monograma-escuro` | barra lateral recolhida (navy: escuro) |
| `logo-vertical-*` | copiadas, sem uso por enquanto (apresentações) |
| Favicons 16/32/48 e `.ico`, Apple 180, PWA 192/512 | `<head>` do endereço da Brás e `manifest.webmanifest` |
| `3d/02-metal-anodizado-sem-texto` | herói (WebP 800/1600 e recorte quadrado para celular) e prévia de link `og-1200x630.jpg` (com a logo escura com slogan sobreposta, sem alterar a logo) |
Nenhum filtro, recoloração, sombra ou recorte nas logos: a troca é sempre de arquivo.

## 5. Página pública (`/` no endereço da Brás; `/bras-digital-club`)
1. Cabeçalho: logo oficial, menu curto (O Club, Benefícios, Descobertas, Como funciona, Confiança, Dúvidas) e "Cadastrar grátis"; navy enquanto o herói está por baixo.
2. Herói navy: "Conecte seu negócio ao pulso do Brás." em HTML, texto de apoio, dois botões, peça 3D decorativa (`alt=""`).
3. Proposta de valor e mosaico. 4. Benefícios e capacidades (telas de demonstração do Meu Brás). 5. Descobertas. 6. Como funciona. 7. Para quem é. 8. Acesso por camada. 9. Confiança (só fatos do sistema). 10. Dúvidas. 11. Chamada final. 12. Rodapé escuro.
Sem números, clientes, depoimentos ou preços inventados (preço continua só para membros).

## 6. Referências antigas mantidas (com motivo)
- `BRAS_DIGITAL` (código no banco e nas variáveis de ambiente `BRAND_*_BRAS_DIGITAL`), `bras.nextlevelgroup.com.br`, prefixos `bd-`, rotas `/meu-bras`, `/bras`, "Meu Brás" (nome do painel do membro).
- Termos de uso e privacidade da Brás (`legal.tsx`, versão `BRAS_TERMS_VERSION`), termos do grupo (`legal-grupo.tsx`) e textos jurídicos de `lib/domain/bras/juridico.ts`: são versionados; trocar o nome exige nova versão e novo aceite dos membros. **Decisão do dono.**
- Tabela de preços do grupo e funil (`lib/domain/precos/*`, `lib/finance/catalog-seed-bras.ts`): o rótulo "Brás Digital Club" já é usado ali para o programa de pontos; renomear juntaria as duas linhas. Seeds do catálogo já gravados no banco não mudam.
- Kit antigo laranja em `public/marcas/bras-digital/` (arquivado, sem uso) e fotos de direção de arte em `public/portal/bras/v3/` (continuam em uso: fotos de importadoras e lojistas).
- Comentários de código que citam decisões antigas ("Brás Digital, D92").

## 7. Verificação feita (17/10/2026, servidor local de produção, Chromium)
- `npx tsc --noEmit` e `npx eslint` sem erro; build de produção sem erro (duas vezes).
- Testes: `bras-digital-club` (identidade, arquivos, logos por superfície, tema isolado, ícones, rota), contraste do tema e do vidro, marca, rotas, e 20 arquivos de domínio da Brás (138 testes) passando.
- Capturas: página pública em 360, 768 e 1440 px, claro e escuro, no topo e em 9 a 16 pontos de rolagem; cadastro e login (360 e 1440, claro e escuro); menu do celular; Estúdio (Master) claro e escuro; Meu Brás 390 e 1440, claro e escuro.
- Sem rolagem lateral, sem erro de página, sem filtro nas logos; foco por teclado visível (contorno ciano no herói).
- axe (WCAG A/AA): página pública, cadastro e login sem violações nos dois modos, depois de escurecer o link do modo claro.
- Isolamento: SuperDrop e Commerce seguem com as próprias cores (`--ds-primary` conferido no navegador).
- **Não verificado:** Safari/WebKit; medição de desempenho (Lighthouse); miniaturas do YouTube (sem internet externa nesta máquina).

## 8. Pendências reais
- **Extensão do domínio** (`brasdigitalclub.com.br`? `.com`?): sem ela, nada de canônico, `og:url`, sitemap ou redirecionamento definitivos.
- Termos da Brás com o nome novo (nova versão e novo aceite).
- Nome do programa de pontos dentro da marca (hoje "Indique e ganhe" / "Indicações e pontos").
- Versão vetorial das logos para grande formato (o pacote entrega PNG).
- Outras marcas (Commerce, Cargas e as planejadas) têm selos com contraste abaixo de AA no modo escuro (link sobre fundo suave); não foi mexido aqui para não alterar outras marcas.
