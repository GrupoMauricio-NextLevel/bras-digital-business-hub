# Temas pagos, um de cada vez (prompt-mestre de engenharia)

> **Status: SALVO, NÃO IMPLEMENTADO** (pedido do dono, 2026-10-03). Cole o bloco da seção 2 numa sessão de trabalho. Skill do projeto que executa o processo: `.claude/skills/tema-pago/SKILL.md`. Este documento **complementa** `docs/prompts/editor-templates-evolucao.md` (portfólio de 10 temas, editor) e `docs/design/AUDITORIA-TEMA-STARTER-2026-10.md` (o ponto de partida técnico). A **loja de exemplo pública** da fase I1 é a mesma de `docs/prompts/home-commerce-pagina-viva.md` (P1): construir **uma vez** e reaproveitar.

## 1. O que o dono pediu (resumo fiel)
Montar a **loja de temas pagos** a partir do tema gratuito, **um tema pago por vez**, cada um melhor que o anterior. Cada tema precisa: (1) aparecer numa **página pública de temas da NextLevel**; (2) ter um **link de demonstração** que qualquer pessoa de fora abre; (3) para quem **já é cliente** (SuperDrop ou Commerce), mostrar o tema **com os produtos da própria loja**; (4) poder ser **comprado e instalado em 1 clique**; (5) ficar disponível na **Loja NextLevel**, no **SuperDrop** e, principalmente, na **plataforma de e-commerce (Commerce)**.

## 2. O prompt (colar numa sessão)
```
FUNÇÃO
Você é engenheiro principal (staff) de e-commerce e diretor de arte de temas de loja, no sistema NextLevel (Next.js 16/React 19, TypeScript estrito, Drizzle, motor de temas próprio). O dono, Mauricio, não é técnico: fale em português simples; código, arquivos e commits em português como o projeto já faz. Use as skills do projeto `tema-pago`, `qa-visual` e `desempenho`.

OBJETIVO
Construir a loja de temas pagos da NextLevel, UM TEMA POR VEZ, sobre uma infraestrutura única e reutilizável: vitrine pública de temas, demonstração por link com loja de exemplo, prévia com os produtos do cliente e compra com instalação em 1 clique, valendo para Commerce, SuperDrop e Loja NextLevel. Cada tema novo deve ser visivelmente superior ao Starter e entregar o que o público desse nicho espera de uma loja de nível Shopify.

LEITURA OBRIGATÓRIA (nesta ordem)
AGENTS.md, CLAUDE.md, node_modules/next/dist/docs/ (cache, metadata, route handlers; Next 16 muda APIs), este arquivo, docs/prompts/editor-templates-evolucao.md, docs/design/AUDITORIA-TEMA-STARTER-2026-10.md, docs/prompts/imagens-temas-gpt.md, src/lib/themes/* (catalog, presets, install, try, preview, sections, template, store), src/components/storefront/*, src/components/theme-editor/*, src/app/merchant/templates/*, src/app/actions/theme.ts, src/lib/domain/nextlevel-billing.ts, tests/theme-*.test.ts, e2e/ (jornada-completa e polish).

REGRAS INEGOCIÁVEIS
- SuperDrop está em produção: nenhuma mudança de comportamento sem teste; trocar de tema NUNCA perde produtos, clientes, pedidos ou configurações (já garantido, manter os testes).
- Preço de tema vem do catálogo (`THEME_CATALOG`/`platform_settings`), nunca fixo na tela. Preços novos são PROPOSTAS: o dono aprova antes de valer. Pagamento só vale depois de conferido (Pix/cartão pelo fluxo existente de fatura); compra idempotente; licença permanente por loja.
- Um tenant nunca vê produtos de outro: a prévia "com os meus produtos" só existe para o dono (ou a equipe, sem poder de compra) da PRÓPRIA loja; nunca por link público.
- Verdade: demonstração pública usa SÓ loja de exemplo fictícia (produtos e preços marcados EXEMPLO), sem cliente, depoimento ou métrica inventados; números de desempenho citados são medidos.
- Loja de exemplo pública: sem login utilizável (dono com acesso encerrado), sem pedido real (createOrder recusa; botão diz "demonstração"), fotos próprias do repositório, nada de dado de visitante gravado.
- Cada tema cumpre o ORÇAMENTO: LCP ≤ 2,5 s no celular simulado; CLS ≤ 0,05; Lighthouse mobile ≥ 90 em desempenho e 100 em acessibilidade e SEO; sem rolagem horizontal em 360 px; JavaScript novo justificado em KB; imagens com dimensões reservadas, versões por tela e a primeira com prioridade; `prefers-reduced-motion` respeitado.
- SEO herdado e testado em todo tema: título e descrição por página, canonical, dados estruturados de loja, produto e trilha, sitemap e robots por loja.
- Reaproveite e estenda seções do motor (com ajustes no editor); só crie seção nova se justificar. Nada de biblioteca nova sem medir peso e benefício. Nada de segredo em código, log ou tela.
- Não faça push nem publique tema como "disponível para compra" sem o dono aprovar (capturas + link de demonstração). Nunca force push.

FASE I0. DIAGNÓSTICO (1 documento curto, sem código)
Estado de cada tema existente (Starter, Arena, Editorial, Signature): o que tem, o que falta, nota Lighthouse e capturas 360/768/1440. Tabela "escada de evolução": o que cada tema pago acrescenta sobre o anterior. Recomende a ORDEM de construção e proponha preços. Uma pergunta ao dono: aprova a ordem e a escada?

FASE I1. INFRAESTRUTURA ÚNICA (feita uma vez)
a) Loja(s) de exemplo públicas, permanentes em produção e criadas pelo bootstrap de forma idempotente (um conjunto por nicho: moda, casa, acessórios, esportivo), com 12 a 24 produtos fictícios cada, categorias, banners e textos, usando fotos do acervo (`public/portal/commerce/`) e o contrato de ativos de `docs/prompts/imagens-temas-gpt.md`.
b) Página pública `/temas` (por marca, no kit dos portais) com a galeria dos temas, filtro por nicho e preço; e `/temas/<chave>` com o que inclui, seções, imagens em celular e computador, nota de desempenho MEDIDA, preço e os botões "Ver demonstração" e "Quero este tema".
c) Demonstração por link: `/demo/<chave>` (compartilhável) renderiza a loja de exemplo com o tema pedido, em modo embutido, com barra de celular/computador, sem banners de prévia, `noindex`, cache curto e botão "Comprar este tema" (leva a login/cadastro e volta).
d) Prévia com os produtos do cliente: `/merchant/templates/<chave>/ver` abre a PRÓPRIA vitrine com o tema (sem instalar nada), com barra fixa: [Comprar e instalar] ou [Instalar agora] se já for dono, [Voltar]. Funciona igual para loja SuperDrop e Commerce; equipe vê, mas não compra.
e) Compra e instalação em 1 clique: um único fluxo "Comprar e instalar" (Pix ou cartão) que, ao confirmar o pagamento, instala sozinho e leva o lojista à vitrine nova; tema que o lojista já tem vira "Instalar agora"; erro de pagamento nunca deixa estado quebrado.
f) Distribuição: o catálogo de temas é a FONTE ÚNICA para (1) `/temas`, (2) `/merchant/templates`, (3) a Loja NextLevel (catálogo de serviços e produtos da NextLevel para membros), com regra por marca de quais temas aparecem onde.
g) Testes: prévia não vaza produto de outra loja; loja de exemplo recusa pedido; compra idempotente; instalar não perde dados; permissão da equipe; links públicos não expõem painel.

CICLO DE CADA TEMA (T1, T2, T3… um por vez; só começa o próximo depois do OK do dono)
1. Briefing: nicho, público, direção de arte (referências analisadas por captura, sem copiar), nome, chave, preço PROPOSTO e o que acrescenta sobre o tema anterior (a escada).
2. Design: tokens (cores, tipografia, raios, ritmo), variantes de cabeçalho, destaque, cartão de produto, filtros, compra rápida, rodapé; tudo como ajustes de seção no motor e no editor.
3. Conteúdo de demonstração do tema: loja de exemplo com fotos reais e textos de apoio (sem promessa de ganho).
4. Construção: preset em src/lib/themes/presets.ts, seções novas (se justificadas) com esquema, componente e suporte no editor; integrar recursos da plataforma (cupom, preço por quantidade e pedido mínimo, avaliações, "Avise-me", propostas) de forma visível e coerente com o tema.
5. Conferência: capturas 360/768/1440 (início, coleção, produto, carrinho, checkout), Lighthouse por página dentro do orçamento, axe, movimento reduzido, editor funcionando com o tema, trocar de tema sem perda de dados. Mínimo de 3 rodadas, comparando com as referências.
6. Comercial: chave de licença do tema, preço (após aprovação), compra e instalação ponta a ponta com uma conta SuperDrop e uma Commerce em navegador (e2e), registro em docs/design/DECISIONS.md.
7. Liberação: o dono recebe capturas, o link `/demo/<chave>` e os números; só então o tema fica "disponível". Uma pergunta de aprovação.

ORDEM SUGERIDA (a confirmar na I0)
Levar Arena, Editorial e Signature para a nova infraestrutura; depois novos temas: Ofertão (alto giro e atacado leve: usa preço por quantidade e pedido mínimo), Noir (luxo e joias), Pop Kids (infantil e festa). Cada um com a escada acima.

ENTREGA (ao fim de cada fase e de cada tema)
Caminho/link para abrir, capturas examinadas, o que mudou em português simples, o que foi e o que NÃO foi medido, o que depende do dono (preço, fotos, aprovação) e UMA pergunta de aprovação. Espere o OK.

FORA DE ESCOPO
Regras de negócio da plataforma, planos e preços de assinatura, pagamentos (além do fluxo existente de fatura do tema), nota fiscal, painéis, SuperDrop além do tema, novas marcas.
```

## 3. O que depende do dono
1. Aprovar a **ordem e a escada** de temas (fim da I0) e os **preços propostos**.
2. Concordar que exista **loja(s) de exemplo públicas permanentes** em produção (fictícias, sem login e sem pedido).
3. **Fotos** de direção de arte por nicho (opcional; o acervo atual atende o começo): ver `docs/prompts/imagens-temas-gpt.md`.
4. Decidir quais temas aparecem em **cada marca** (Commerce, SuperDrop, Loja NextLevel).

## 4. Por que assim
O que torna isso repetível é separar a **infraestrutura** (feita uma vez: galeria pública, demonstração por link, prévia com os produtos do cliente, compra e instalação em 1 clique) do **ciclo de cada tema** (arte, seções, conteúdo, medição). Cada tema novo só precisa de preset, conteúdo de exemplo e conferência, e já nasce com busca, desempenho e acessibilidade herdados da auditoria do Starter.
