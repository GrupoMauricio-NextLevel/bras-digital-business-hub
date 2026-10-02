# Briefing consolidado para o design visual (Codex) — estado em 02/10/2026

> **Leia este arquivo primeiro.** Ele resume o estado atual do ecossistema NextLevel com base nas últimas decisões (D28 a D40) e no código de hoje. **O código manda:** se algo aqui divergir da tela, vale a tela. Documentos antigos (`docs/design/RACIONAL-VISUAL-V3.md`, `docs/prompts/mvp-original-v0.md`, `evolucao-visual-v1.md`, `racional-operacao-v2.md`, `historico-design.md`) são histórico: **não** os use como retrato do presente (por exemplo, ainda dizem que só existe 1 tema, o que já não é verdade).
> Os prompts em `docs/prompts/*` são **ideias salvas, não funcionalidades prontas**. A seção 3 lista o que NÃO existe.

## 1. Os produtos e os endereços
Um sistema só (um serviço no Render e um banco no Neon). A **marca vem do endereço** (`getBrand()`, definições em `src/lib/brand.ts`). Para ver cada marca no `localhost:3100`: SuperDrop em `/`, NextLevel Commerce em `/lojas` (e `/lojas/sair` volta).

| Produto | Endereço | Estado hoje | Marca (cores em `brand.ts`) |
|---|---|---|---|
| **SuperDrop** | `superdrop.com.br` (painéis em `office.superdrop.com.br`, ainda desligado) | **em produção**, com clientes e lojas para subir | verde `#22c55e` sobre `#0f1c16`, logo própria |
| **NextLevel Commerce** | `lojas.nextlevelgroup.com.br` | **foco atual**: portal, conta simples (loja sem fornecedor), frete por CEP; cadastro público fechado até o dono ligar | azul `#2563eb` sobre `#0b1a3a`, logo NextLevel + "Commerce" |
| **Master central** | `master.nextlevelgroup.com.br` | gestão de todos os produtos, só equipe NextLevel | `NEXTLEVEL` (azul) |
| Hub Creators, Brás Digital, China Hub | ainda sem domínio | **só** uma página "em breve" com lista de espera (`src/components/portal/soon-home.tsx`) | Creators `#1e1b4b/#7e22ce`, Brás `#3b0764/#f59e0b`, China `#450a0a/#ef4444` (**provisórias**, podem ser refinadas) |

Hierarquia de foco do dono: **SuperDrop (não pode quebrar) → NextLevel Commerce → Master central**. Os três "em breve" ficam para depois.

## 2. O que EXISTE e funciona (pode ser redesenhado)
**Portal público (`src/app/(portal)`)** — home do SuperDrop (`page.tsx`, com calculadora de venda, esteira ao vivo, vitrine de painéis, temas, planos), home da Commerce (`src/components/portal/commerce-home.tsx`), `/planos`, `/faq`, `/como-funciona`, `/seja-fornecedor`, `/fornecedores`, `/parceiros` (+ `/cadastro`, `/termos`), `/quero-minha-loja` (lista de espera), `/loja-nextlevel` (venda de serviços e pacotes aos lojistas) e `/cadastro`. Layout e rodapé: `(portal)/layout.tsx` (menu e logo vêm da marca).

**Painéis (autenticados)** — cada papel tem seu "clima" de cor:
- **Master** `/master`: torre de controle (receita, rede, alertas, saúde das lojas), `/master/commerce` (hub da marca Commerce), pedidos, CRM, fornecedores, redes, lojas, catálogo, parceiros, escritório virtual, financeiro, templates, planos, serviços, configurações.
- **Fornecedor** `/supplier`: esteira ao vivo, expedição (`dispatch`: fila, ondas, etiquetas, enviados), pedidos, produtos (lista, novo, importar), estoque, lojistas, carteira, faturas, financeiro, equipe, conteúdo, configurações.
- **Lojista** `/merchant`: início (checklist "no ar"), pedidos, análise, pós-venda, etiquetas, produtos e "Meus produtos" (`catalogo`, conta simples), clientes, loja virtual, aparência, templates (loja de temas), conteúdo, carteira, financeiro, configurações (inclui frete e entrega).
- **Afiliado** `/partner`: início, links, cupons, indicados, financeiro, perfil.
- **Editor de temas** `/theme-editor`: tela cheia, árvore de seções, painel de ajustes, prévia ao vivo, desfazer, salvar e publicar.

**Loja pública do lojista (`/store/[slug]`)**: início, catálogo, produto, carrinho, checkout (com cotação de frete por CEP), pedido, acompanhar. Página pública do fornecedor: `/f/[slug]`.

**Temas (4 hoje)**, em `src/lib/themes/catalog.ts`: **Starter** (grátis), **Arena** (R$ 299, esportivo/camisas de time), **Editorial** (R$ 699, revista), **Signature** (R$ 1.499, completo). Motor com cerca de 30 tipos de seção/bloco (`src/lib/themes/sections.ts`, `src/components/storefront/sections/*`) e 4 páginas modeladas (início, produto, catálogo, carrinho).

**Design system**
- Tokens em `src/app/globals.css`: base clara, modo escuro e **"clima por painel"** (`[data-panel=...]`): `master` (verde, barra lateral escura), `supplier` (azul-petróleo `#0e6b7e`), `dispatch` (azul `#1240c7`, fonte 17px, tablet), `lite` (verde `#0d803e`), `pro` (índigo `#4338ca`), `partner` (âmbar `#b45309`).
- Fontes: Plus Jakarta Sans (títulos, `--nl-font-display`) e Inter (texto), em `src/app/fonts`.
- Componentes: `src/components/ui` (base, Radix), `src/components/ds` (lista com filtros, galeria de mídia, barra de salvar, banners), `src/components/app` (casca dos painéis, menus, tabelas, métricas), `src/components/shared`, `storefront`, `portal`, `theme-editor`, `brand` (`BrandLogo`, `Logo`).
- Logos em `public/brand/`: SuperDrop (completa e símbolo, versões clara e escura) e NextLevel (`nextlevel-logo.webp`, que usa uma plaquinha preta).
- Dados de demonstração têm só **gradientes** no lugar de fotos de produto (`ProductArt`, prefixo `art:`).

## 3. O que NÃO existe (só prompt salvo): não desenhe como pronto
- **6 temas novos** (Essencial, Vitrine, Lançamento, Ofertão, Pop Kids, Noir) e as imagens de demonstração por tema: plano em `docs/prompts/editor-templates-evolucao.md` e `imagens-temas-gpt.md`.
- **Atacado B2B** (preço por faixa, pedido mínimo, grade por cor e tamanho, cliente atacadista), **influenciadores**, **feed e live shop**: `docs/prompts/promessas-commerce.md`. No portal da Commerce estão marcados "em breve", e assim devem continuar.
- **Creator Commerce Platform** (feed em vídeo, creators, campanhas, amostras, lives, canais 24/7) e integração com TikTok: `docs/prompts/creator-commerce-plataforma.md` e `creator-hub-tiktok.md`. **Nada disso existe.**
- **Brás Digital e China Hub como sistemas** (hoje só a página "em breve").
- **Templates profissionais de e-mail**, **Fornecedor 360 no Master** e demais fases dos prompts `email-transacional.md` e `fornecedor-360-master.md`.
- **Pagamento próprio da NextLevel conectado** (Mercado Pago do Master), compra de etiqueta pela API e rastreio automático, cupom de desconto do consumidor: pendentes.

## 4. Problemas visuais conhecidos (onde há mais ganho)
1. **O "clima por painel" é por papel, não por marca.** Lojista, Master e afiliado herdam o verde/índigo/âmbar pensados no SuperDrop, inclusive quando a marca do endereço é a NextLevel Commerce (azul). Resultado: a Commerce parece o SuperDrop por dentro. A casca já troca logo e nome pela marca (`ShellBrand` em `src/components/app/app-shell.tsx`), mas **as cores dos painéis ainda não seguem a marca**.
2. **Para marcas que não são SuperDrop, o símbolo do painel é um quadrado azul com "NL"** (provisório) e a logo NextLevel tem uma plaquinha preta fixa; falta um conjunto de logo/símbolo por produto.
3. **O portal da Commerce é honesto, mas básico**: pouco "produto na tela", sem prova social real, poucas imagens.
4. **O painel do lojista novo (conta simples)** mostra o checklist "no ar" e menus pensados para quem tem fornecedor; precisa de uma primeira experiência mais clara.
5. **Master central**: o seletor/visão por produto existe só nos filtros; falta identidade própria da holding.
6. **Vitrines e temas**: só 4 temas, imagens de demonstração em gradiente.

## 5. Regras que não mudam
Português claro; valores em centavos (`formatBRL`); sem promessa de ganho; acessibilidade AA (`readableOn` de `src/lib/utils.ts` para texto sobre cor de marca; sem rolagem horizontal em 360 px); textos e cores de marca vêm de `getBrand()`, nunca fixos; páginas com banco usam `export const dynamic = "force-dynamic"`; não mexer em domínios, variáveis de ambiente, regras de negócio (`src/lib/domain`, `finance`, `shipping`, `db`, `actions`) nem testes, salvo ajuste de seletor. Detalhes e fluxo de branches: `AGENTS.md` e `CLAUDE.md`.

## 6. Como ver e testar
`http://localhost:3100` (demonstração ligada por `scripts/dev-demo.ps1`). Perfis em `/login` (senha `demo1234`): Master ("Equipe NextLevel"), fornecedores, lojistas e afiliada. Commerce: `/lojas`. Verificações: `npx tsc --noEmit`, `npx eslint src e2e tests`, e para mudanças grandes `npm run build`.

## 7. Ordem sugerida do trabalho visual
1. **Cores e logos por marca nos painéis** (item 1 e 2 da seção 4): é o que mais resolve a queixa de "tudo misturado".
2. Portal da NextLevel Commerce.
3. Primeira experiência do lojista da conta simples.
4. Master central.
5. Vitrines/temas e novos temas (depende das imagens geradas no GPT).
