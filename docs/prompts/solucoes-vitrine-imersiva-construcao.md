# Soluções NextLevel: vitrine imersiva (fusão Pódio × cardápio + prompt engenheiro mestre)

> Página: `/solucoes` no site do grupo (`src/app/(portal)/solucoes/page.tsx`) e `/solucoes/<produto>`.
> Par visual: `solucoes-vitrine-imersiva-imagens-gpt.md` (racional, bíblia visual e lotes de imagens para o GPT).
> Estado: **salvo em 2026-10-17, pronto para executar**. Próxima decisão: **D161**.

---

## Parte A. Racional (para o dono)

### A1. O que o Pódio tem e a página de Soluções não tem

Levantamento feito no código e no navegador (1440 px), lado a lado:

| Recurso do Pódio (tema de R$ 999) | Onde está no código | Página de Soluções hoje |
|---|---|---|
| **Destaque imersivo:** a seção fica presa na tela e a rolagem troca quadro e texto (3 passos), com camadas que se movem em velocidades diferentes | `HeroImmersive` (`src/components/storefront/sections/navigation.tsx`) + `ImmersiveScroll` (`src/components/storefront/hero-motion.tsx`) | Topo com uma foto parada |
| **Camadas com mouse e rolagem** (fundo, recorte, primeiro plano) | `LayerMotion` (`hero-motion.tsx`) | Não tem |
| **Carrossel de campanha** com troca automática e **agendamento** (aparece e some sozinho pela data) | `HeroBanner` + `BannerCarousel` (`banner-carousel.tsx`) + `liveBlocks` | Não tem; ofertas aparecem em texto corrido |
| **Cartões de navegação** grandes, verticais, com foto e chamada | `NavCards` | Não tem; o visitante precisa ler tudo para achar o que quer |
| **Mosaico 1+4** (uma peça grande e quatro menores) | `BannerMosaic` | Grade de cartões iguais |
| **Busca com sugestões** (setas, Enter, Esc) | `SearchBox` em `src/components/storefront/header.tsx` | Não tem |
| **Menu grande com submenus** | `HeaderPlus` (`premium.tsx`) | Menu do grupo, sem submenu de soluções |
| **Movimento respeitoso:** sem JavaScript ou com "menos movimento" ligado, mostra o último quadro parado com a chamada | `useReducedMotion` + `data-immersive=off` | Sem movimento |

### A2. O que só a página de Soluções precisa (e o Pódio não resolve)

- **Um cardápio de verdade:** 9 famílias, cerca de 25 produtos, preço publicado ou sob consulta. Tudo vem do catálogo
  Master (`listCatalog`), com preço versionado. Nada de preço escrito na tela.
- **Ajudar a escolher:** quem chega não sabe o nome do produto ("Migração Pro"); sabe o problema ("quero sair da
  Nuvemshop"). A busca precisa entender **intenção**, não só nome.
- **Juntar várias coisas:** uma loja nova costuma precisar de plano + tema + loja pronta. Hoje não dá para montar o
  pacote e ver o total.
- **Duas saídas honestas:** contratar o que já tem preço e checkout, ou mandar a seleção para o diagnóstico gratuito.

### A3. A fusão (o que é único aqui)

1. **"O negócio que cresce enquanto você rola"** (o destaque imersivo com 5 passos). As cinco fases da jornada
   (`getJourneyConfig`) viram cinco quadros da **mesma cena**. A cada passo, ao lado da foto, aparecem as soluções
   daquela fase, vindas do catálogo. É o Pódio contando a história do cliente, não a de uma camisa.
2. **Régua da jornada** fixa durante o destaque: Fundação · Lançamento · Aquisição · Otimização · Escala. Clicar pula
   para o passo. No celular vira uma pílula com "Fase 2 de 5".
3. **Quatro portas** (os cartões de navegação do Pódio) por **intenção**: começar, trocar de plataforma, vender mais,
   ter a minha plataforma. Cada porta abre o cardápio já filtrado.
4. **Cardápio com barra fixa e busca por intenção:** famílias como abas; busca com sugestões que entende sinônimos
   ("sair da shopify" → Migração; "instagram" → Redes sociais e Meta Ads). Mosaico 1+4 por família.
5. **Campanhas da vez** (carrossel agendado do Pódio) alimentadas pelas **ofertas reais do Master** (`activeOffer`):
   entram quando a oferta é ativada no Master (a partir da data de início cadastrada) e saem quando ela é
   desativada, sem mexer no código.
6. **"Sua seleção"**, o montador: marcar soluções em qualquer lugar da página; uma barra acompanha a rolagem com o total
   do que tem preço fixo (Pix e cartão conforme o catálogo) e "N itens sob consulta". Saídas: **contratar** (cada item
   pelo caminho que já existe) ou **enviar para o diagnóstico** (formulário já preenchido com as necessidades e os itens).
7. **Temas em exposição:** a vitrine dos temas com link para a demonstração. O Pódio vira prova: "esta página usa a
   mesma tecnologia do tema Pódio".

### A4. O que não muda

- Preço só do catálogo Master; "sob consulta" quando é sob consulta; sem número inventado, sem depoimento inventado,
  sem promessa de faturamento.
- O formulário de diagnóstico continua o mesmo (só ganha o preenchimento automático).
- `/solucoes/<produto>` continua sendo a página canônica de cada produto.
- As lojas e os temas não mudam de comportamento: a fusão **reaproveita** as peças de movimento, não copia.

---

## Parte B. Arquitetura técnica

### B1. Reaproveitar sem duplicar (regra anti-duplicação)

As peças de movimento hoje moram em `src/components/storefront/` e algumas dependem do `SectionProps`/`ctx` da loja.
O caminho é **extrair primitivas puras** e fazer a loja e o portal usarem as mesmas:

| Primitiva nova (pasta `src/components/movimento/`) | Origem | Mudança |
|---|---|---|
| `ImmersiveScroll` | `storefront/hero-motion.tsx` | Mover; aceitar até **6** passos; expor `data-step` e `--p` como hoje; aceitar `onStep` opcional (para a régua) |
| `LayerMotion` | `storefront/hero-motion.tsx` | Mover sem mudança |
| `useReducedMotion` | `storefront/hero-motion.tsx` | Exportar (hoje é interno) |
| `Carrossel` | `storefront/banner-carousel.tsx` | Mover; manter a API `slides/autoplay/seconds/label` |
| `BuscaComSugestoes` | `SearchBox` em `storefront/header.tsx` | Generalizar: recebe `itens: { id, rotulo, grupo, href, termos[] }` e `onEscolher`; mantém o padrão combobox (setas, Enter, Esc, `aria-activedescendant`) |

`storefront/hero-motion.tsx` e `banner-carousel.tsx` passam a **reexportar** da pasta nova (sem mudar import nenhum da
loja). As classes por passo (`STEP_SHOW`, `FRAME_SHOW`, `DOT_ON`, `IMM_HEIGHT`) viram um módulo `passos.ts` com 6
posições escritas por extenso (o Tailwind precisa das classes literais).

### B2. Dados (servidor, uma ida ao banco)

`src/lib/solucoes/vitrine.ts` (novo, puro + uma função de leitura):

```ts
export type VitrineSolucoes = {
  fases: { key: JourneyPhase; nome: string; objetivo: string; itens: ItemVitrine[] }[]; // de getJourneyConfig + listCatalog
  familias: { key: CatalogFamily; rotulo: string; itens: ItemVitrine[] }[];
  portas: { key: "COMECAR" | "MIGRAR" | "VENDER_MAIS" | "PLATAFORMA"; familias: CatalogFamily[]; fases: JourneyPhase[] }[];
  campanhas: { key: string; titulo: string; texto: string; href: string; inicio: string }[]; // de activeOffer (ACTIVE e effectiveFrom ≤ agora)
  temas: { key: string; nome: string; nivel: number; precoCents: number; demoHref: string }[]; // de THEME_CATALOG (released)
  busca: { id: string; rotulo: string; grupo: string; href: string; termos: string[] }[];
};
export type ItemVitrine = { key: string; slug: string; nome: string; resumo: string; familia: CatalogFamily; fase: JourneyPhase;
  preco: { tipo: "FIXO" | "MENSAL" | "CONSULTA"; cents: number | null; linha: string }; // linha = priceLines(x).main
  contratar: { tipo: "CADASTRO_COMMERCE" | "PAINEL" | "LOJA_NEXTLEVEL" | "SITE_MARCA" | "DIAGNOSTICO"; href: string } };
```

- `montarVitrine(db, attr, now)`: lê catálogo, jornada, planos e oferta em paralelo; filtra `audience` PUBLIC; aplica
  `withAttribution` em todos os links. Função pura `projetarVitrine(entradas)` separada para teste.
- **Sinônimos da busca** (`src/lib/solucoes/intencoes.ts`): mapa de palavras por família/produto ("shopify",
  "nuvemshop", "tray", "wbuy" → Migração; "instagram", "tiktok", "conteúdo" → Redes sociais; "anúncio", "tráfego" →
  Ads; "sem estoque", "dropshipping" → SuperDrop; "minha marca", "agência", "revender a plataforma" → White Label).
  É texto de apoio, não regra de negócio; as fontes de migração vêm de `meta.sources` do catálogo.
- `contratar.href` usa **os caminhos que já existem**: plano Commerce → `/cadastro?plano=` (ou `/quero-minha-loja`);
  produtos do painel → login com `voltar=/merchant/services/solucao/<slug>`; cursos → `/loja-nextlevel`; SuperDrop →
  site da marca; `quote_required` → diagnóstico.

### B3. Componentes da página (`src/components/portal/solucoes/`)

| Componente | Tipo | Faz |
|---|---|---|
| `JornadaImersiva` | cliente (usa `ImmersiveScroll` + `LayerMotion`) | 5 quadros (`sol-jornada-1..5`, retrato no celular via `<picture>`), recorte e primeiro plano opcionais, texto por passo, soluções da fase em lista à direita (desktop) ou embaixo (celular). Sem JS ou com menos movimento: quadro 5 parado + lista completa por fase em acordeão |
| `ReguaJornada` | cliente | 5 botões; marca o passo atual (`aria-current="step"`); clique rola até o passo (`scrollTo` calculado pela altura) |
| `PortasDeEntrada` | servidor | 4 cartões 4:5 (padrão `NavCards`), cada um com `href="#cardapio?porta=..."` tratado por âncora + estado na URL (`?porta=MIGRAR`) para funcionar sem JS |
| `CardapioSolucoes` | servidor + ilha cliente | Barra fixa de famílias (abas que rolam até a família; `position: sticky`, rolagem horizontal própria em 360 px sem rolar a página); `BuscaComSugestoes`; por família, mosaico 1+4 (peça grande = item principal) com preço, "o que inclui" e botão **Adicionar à seleção** |
| `CampanhasDaVez` | servidor + `Carrossel` | Só renderiza se houver campanha ativa; troca automática pausável (botão pausar, para WCAG 2.2.2) |
| `TemasEmExposicao` | servidor | Faixa horizontal de temas com nível, preço do catálogo e "Ver a loja de demonstração" |
| `SuaSelecao` | cliente | Contexto React + `sessionStorage` (protegido com try/catch); barra inferior fixa com contagem, total dos fixos (`formatBRL`), "N sob consulta"; gaveta com a lista, remover item, e as duas saídas |
| `TresCaminhos` | servidor | Os três cartões atuais com as fotos `sol-caminho-*` |

O formulário `DiagnosticoForm` ganha `inicial?: { needs: string[]; mensagem: string }` e escuta o evento da
seleção (ou lê `?selecao=` na URL), preenchendo necessidades e "Quer contar mais?" com a lista de itens. A ação do
servidor **não muda** (mesmo esquema, mesmo limite de 6 necessidades).

### B4. Imagens

- Pasta: `public/portal/nextlevel/v4/solucoes/` com AVIF + WebP em 800 e 1600 (conversão com `sharp`, já instalado;
  nomes no padrão que `formatosDisponiveis` procura). Manifesto `MANIFESTO.md` na pasta.
- Componente: reaproveitar `FotoOpcional`/`formatosDisponiveis` (estender o tipo `Marca` ou aceitar subpasta), com
  **reserva** automática: jornada sem foto → `hero-key-visual` atual; família sem foto nova → `nl-familia-*` atual;
  porta sem foto → cor sólida do grupo com o ícone. A página nunca quebra esperando imagem.
- Primeiro quadro com `fetchPriority="high"` e dimensões reservadas; demais `loading="lazy"`; quadros 2 a 5 só
  carregam depois do primeiro passo (como o `HeroImmersive` faz).

### B5. Qualidade exigida

- LCP ≤ 2,5 s (celular simulado), sem salto de layout (CLS < 0,05), JavaScript da página ≤ 60 kB a mais que hoje.
- `axe` sem violação grave; contraste AA com texto sobre foto (véu calculado, como `scrim()` do Pódio); foco visível;
  tudo por teclado (régua, abas, busca, seleção, gaveta); `prefers-reduced-motion` respeitado; sem rolagem horizontal
  em 360 px; leitor de tela anuncia o passo ("Fase 2 de 5: Lançamento") por `aria-live="polite"` só quando a pessoa
  usa a régua (não a cada pixel de rolagem).
- SEO: um único `h1`; os textos das cinco fases estão no HTML (não só em imagem); `ItemList` do JSON-LD continua.
- Página continua `force-dynamic`.

---

## Parte C. Prompt engenheiro mestre (cole numa sessão de trabalho)

```
Papel: você é o engenheiro de front-end e de produto do NextLevel Commerce Engine (Next.js 16 App Router, React 19,
TypeScript estrito, Tailwind v4, Drizzle). Leia CLAUDE.md, AGENTS.md e node_modules/next/dist/docs/ antes de escrever.
Fale com o dono em português simples.

Missão: transformar /solucoes (src/app/(portal)/solucoes/page.tsx) numa vitrine imersiva de contratação de soluções
digitais, fundindo a tecnologia de navegação do tema Pódio com o cardápio do catálogo Master, conforme
docs/prompts/solucoes-vitrine-imersiva-construcao.md (Partes A e B) e as imagens de
docs/prompts/solucoes-vitrine-imersiva-imagens-gpt.md.

Regras inegociáveis:
1. Reaproveite, não copie: extraia ImmersiveScroll, LayerMotion, useReducedMotion, Carrossel e BuscaComSugestoes para
   src/components/movimento/ e faça a loja reexportar. As lojas (todos os temas) não podem mudar de comportamento:
   rode os testes de temas e capture /store/demo-podio antes e depois (mesma aparência).
2. Preço, nome, resumo, fase e público de cada solução vêm de listCatalog/getJourneyConfig/commercePlansView/
   activeOffer. Nenhum preço escrito em componente. "Sob consulta" quando kind = quote_required.
3. Links de contratação usam só caminhos que já existem (cadastro Commerce, login com voltar para
   /merchant/services/solucao/<slug>, /loja-nextlevel, site da marca, diagnóstico). Toda URL passa por withAttribution.
4. Sem número, depoimento, cliente ou logo inventado; sem promessa de faturamento.
5. Imagem ausente nunca quebra: reserva para as fotos atuais (hero-key-visual, nl-familia-*).
6. Acessibilidade AA, teclado completo, prefers-reduced-motion (último quadro parado + lista por fase), sem rolagem
   horizontal em 360 px, carrossel com botão de pausa, um h1 só.
7. A página nova fica atrás da chave FIN_SOLUTIONS_V2 (src/lib/finance/flags.ts, padrão desligado). Com a chave
   desligada, /solucoes continua exatamente igual; o Master vê a nova em /solucoes?previa=v2 (só com sessão de
   NEXTLEVEL_MASTER). O dono aprova pelas capturas e pela prévia antes de ligar a chave.
8. Cada fase termina com: npx tsc --noEmit, npx eslint src e2e tests, testes do que mudou (npx vitest run <arquivos>),
   capturas em 360/768/1440 claro e escuro (playwright-core, Chromium em /opt/pw-browsers/chromium) examinadas por você,
   commit pequeno em português e push na branch de publicação. Mudança de comportamento sem teste não entra.

Fases (uma por vez, nesta ordem; ao fim de cada uma, mostre as capturas e diga o que falta):

S0 · Linha de base. Capture /solucoes atual (360/768/1440, topo + 6 pontos de rolagem) e /store/demo-podio; meça
     Lighthouse (desempenho, LCP, CLS, acessibilidade) das duas. Salve os números em docs/relatorios/SOLUCOES-V2-BASE.md.

S1 · Primitivas compartilhadas. Extraia as peças (B1), ImmersiveScroll com até 6 passos e onStep, classes por passo
     literais em passos.ts. Teste: vitest de BuscaComSugestoes (setas, Enter, Esc, filtro por termos) e de passos;
     capturas do Pódio idênticas antes/depois.

S2 · Dados. src/lib/solucoes/vitrine.ts (projetarVitrine puro + montarVitrine) e intencoes.ts. Teste: só itens PUBLIC,
     sem TEMA na lista de famílias, fases na ordem da jornada, "sob consulta" correto, links com atribuição, sinônimos
     ("nuvemshop" → Migração; "instagram" → Redes sociais e Meta Ads), campanha só com oferta ACTIVE e data de início já alcançada.

S3 · Jornada imersiva + régua (chave FIN_SOLUTIONS_V2 e prévia do Master). 5 passos com as fotos do lote 1 quando
     existirem e reserva quando não. Lista de soluções da fase ao lado. Sem JS / menos movimento: último quadro +
     acordeão por fase. Teste e2e: rolar troca data-step de 0 a 4; régua leva ao passo; modo reduzido mostra o fim.

S4 · Portas, cardápio e busca. PortasDeEntrada (funciona sem JS por ?porta=), barra fixa de famílias, mosaico 1+4 por
     família, busca com sugestões por intenção. Teste e2e: "shopify" sugere Migração; porta MIGRAR filtra; teclado
     percorre abas e cartões; 360 px sem rolagem lateral.

S5 · Campanhas e temas. CampanhasDaVez (some sem oferta ativa; pausa) e TemasEmExposicao (demo de cada tema). Teste:
     sem oferta não renderiza; oferta com início no futuro ou desativada não renderiza.

S6 · Sua seleção. Contexto + sessionStorage protegido, barra fixa, gaveta, total dos fixos, contagem dos sob consulta,
     "Contratar" por item e "Enviar para o diagnóstico" preenchendo o DiagnosticoForm (needs + mensagem). Teste:
     soma em centavos, item sob consulta não soma, limite de 6 necessidades respeitado, recarregar a página mantém
     a seleção, sem armazenamento a página funciona.

S7 · Imagens. Quando o dono entregar um lote: conferir uma a uma (texto escondido, ângulo igual na jornada, um só
     amarelo, mãos), converter para AVIF/WebP 800/1600, recortes com transparência, MANIFESTO.md, OG 1200x630 a partir
     da J5. Capturas com as fotos reais.

S8 · Acabamento e liberação. Três rodadas de ajuste comparando com o Pódio lado a lado; Lighthouse contra a S0
     (LCP ≤ 2,5 s, CLS < 0,05, acessibilidade 100); axe; npm run build; D161 em docs/design/DECISIONS.md; atualizar
     docs/prompts/README.md. Entregue ao dono: link da prévia, capturas, números antes/depois e a pergunta "posso ligar
     a chave FIN_SOLUTIONS_V2?". Só ligue a chave com o OK dele.

Formato de cada entrega ao dono: o que ficou pronto (em português simples), as capturas examinadas, o que depende
dele (imagens, aprovação) e a próxima fase. Sem jargão.
```

---

## Parte D. Riscos e como cada um foi tratado

| Risco | Tratamento |
|---|---|
| Mexer nas peças do Pódio quebra as lojas | Extrair com reexportação, capturas antes/depois do `/store/demo-podio`, testes de temas |
| Página pesada no celular | Quadros 2 a 5 só depois do primeiro passo; AVIF; meta de JavaScript; retrato no celular |
| Animação incomoda ou exclui | `prefers-reduced-motion`, versão parada completa, carrossel com pausa, anúncio de passo só por ação |
| Imagens atrasam | Reserva com as fotos atuais; a página pode ir ao ar antes do lote 3 |
| Seleção prometer preço que muda | Total recalculado do catálogo no servidor ao abrir a gaveta; texto "preço do dia, confirmado no pagamento" |
| Busca não achar o que a pessoa digita | Sinônimos revisáveis em `intencoes.ts` e, sem resultado, a sugestão "Contar no diagnóstico" |
