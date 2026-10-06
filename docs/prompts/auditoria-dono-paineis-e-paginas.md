# Prompt: auditoria de dono, suporte entre painéis, identidade de marca e páginas públicas de alto nível

> **Para que serve:** rodada de **teste e evolução** antes de o dono entrar para fazer as ações que só ele pode fazer (Mercado Pago, domínios, variáveis, contas reais). Tudo precisa estar rodando, coerente e fácil de dar suporte.
> **Como usar:** em uma sessão nova do Claude Code neste repositório, diga: *"Desenvolva o prompt `docs/prompts/auditoria-dono-paineis-e-paginas.md`, começando pela fase 0"*. Cada fase termina com relatório, capturas e publicação na branch de publicação (autorização permanente do dono, D65).
> **Prompt irmão (imagens):** `docs/prompts/imagens-paginas-publicas-gpt.md`.

---

## PAPEL

Você é, ao mesmo tempo, o **dono do negócio** (Mauricio, NextLevel Marketing Ltda) e o time que vai dar **suporte** a cada cliente: lojistas, fornecedores, equipe de expedição, parceiros e equipes das lojas Commerce. Pense como quem precisa abrir o painel de qualquer cliente em segundos, entender o que ele está vendo, achar a inconsistência e resolver. Fale com o dono em português, sem jargão; código e commits em português, como o projeto já faz.

Leia antes: `CLAUDE.md`, `AGENTS.md`, `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`, `docs/design/DECISIONS.md` (D65, D77–D79), `docs/design-system/README.md`, `brand-system-v2/estrategia.md`, `docs/LINKS.md`, `docs/prompts/COMANDOS-DO-DONO.md`.

## SKILLS A USAR (só quando reduzem uma incerteza real; diga qual usou e por quê)

| Fase | Skills |
|---|---|
| 0 Mapa | `repo-auditor`, `architecture-drift` |
| 1 Navegação e lógica | `ux-flow-auditor`, `e2e-demo`, `root-cause`, `acceptance-designer` |
| 2 Suporte e troca de painéis | `painel-interno`, `security-guardian`, `impact-analysis`, `nova-migracao` (se precisar de tabela) |
| 3 Cores dos painéis | `painel-interno`, `dataviz`, `qa-visual` |
| 4 Master × marcas | `painel-interno`, `ux-flow-auditor` |
| 5 Páginas públicas | `pagina-de-vendas`, `qa-visual`, `desempenho` |
| 6 Entrega | `release-gate`, `publicar` |

## REGRAS DESTA RODADA

- **Relatar primeiro, depois mudar:** cada fase começa com um diagnóstico curto (o que está errado, prova, gravidade) e só então corrige.
- **Sem invenção:** nenhum número, cliente, depoimento ou logo inventado. Dados de demonstração identificados como demonstração.
- **Mudança de comportamento exige teste** (Vitest para domínio, Playwright em `e2e/` para fluxo). SuperDrop está em produção: não mude o comportamento dele sem teste.
- **Segurança de suporte:** ver o painel de um cliente é uma ação sensível. Permissão no servidor, motivo obrigatório, registro em auditoria, faixa visível de "modo suporte", sem acesso a segredos. Um tenant nunca lê dados de outro fora desse fluxo.
- **Forma é do núcleo, cor é do tema:** toda mudança de cor vai em `src/design-system/themes.ts` (e `brand-system-v2/` quando mudar a paleta). Nenhum "se marca X" em componente do núcleo.
- **Desktop e celular:** toda tela conferida em 1440, 840, 390 e 320 px, claro e escuro, sem rolagem lateral, axe sem violação séria.
- **Commits pequenos**, `npx tsc --noEmit`, `npx eslint src e2e tests`, testes da área e `npm run build` antes de cada push.

---

## FASE 0 — Mapa do sistema (relatório, sem código)

1. Inventário de **marcas × papéis × painéis × rotas** a partir de `src/lib/nav.ts`, `src/lib/brand.ts`, `src/components/app/role-layout.tsx` e da árvore `src/app`. Inclua o que cada papel deveria ver e o que de fato vê.
2. Contas de demonstração existentes (`src/db/seed*`, `src/db/commerce-demo-rich.ts`, `e2e/design-system-qa.mjs`) e lacunas: falta conta para algum papel/marca?
3. Mapa da **relação Master → marcas → clientes**: por onde o dono entra, como chega em uma marca, como chega em um cliente, quantos cliques leva.
4. Entregável: `docs/auditoria-dono/00-mapa.md` com tabela de rotas e um diagrama simples (texto) dos caminhos de navegação.

## FASE 1 — Navegação, conteúdo e lógica de negócio

**1A. Navegação completa (automatizada)**
- Estenda `e2e/design-system-qa.mjs` (ou crie `e2e/auditoria-navegacao.mjs`) para, **por marca e por papel**: rastrear todos os links do menu e das telas, abrir cada rota em 1440 e 390, registrar HTTP, erro de console, rolagem lateral, tempo de resposta, título da página, item ativo do menu e trilha (breadcrumb).
- Verificar: todo item de menu leva a uma tela que existe; o item ativo corresponde à tela; "voltar" funciona; links profundos abrem direto; rota sem permissão mostra mensagem clara (não tela branca nem 500); menu do celular (gaveta e barra inferior) tem os mesmos destinos do desktop.

**1B. Inconsistências de conteúdo (por painel)**
Para cada painel de cada marca, listar e corrigir:
- números que não batem entre telas (KPI do início × lista × financeiro × Master), períodos diferentes sem aviso, soma de pedidos/valores divergente;
- valores fora de centavos ou formatação errada (`formatBRL`), datas sem fuso, status com nomes diferentes para a mesma coisa;
- textos com jargão, inglês solto, promessas de ganho, botões que dizem uma coisa e fazem outra, estados vazios sem próximo passo;
- termos da marca errada (ex.: "SuperDrop" dentro do Commerce), logo ou cor da marca errada.
Entregável: `docs/auditoria-dono/01-inconsistencias.md` (tela, o que aparece, o que deveria aparecer, gravidade, correção, teste).

**1C. Lógica do negócio (aprofundar testes)**
Escrever o **racional de cada fluxo** e testá-lo de ponta a ponta, por marca:
- SuperDrop: cadastro → assinatura → catálogo do fornecedor → pedido → pagamento conferido no Mercado Pago (simulado) → débito de saldo → etiqueta → separação → expedição → enviado → pós-venda → comissões e repasses.
- Commerce: convite/cadastro → configuração da loja → tema → produto → checkout → pagamento → pedido → atendimento → financeiro da loja × assinatura.
- Parceiros: link → indicação → cadastro → comissão → saque.
- Master: aprovação de fornecedor, planos, faturas, bloqueio/desbloqueio, erros, integridade dos dados.
Para cada fluxo: invariantes (ex.: pedido pago nunca sem pagamento conferido; saldo nunca negativo sem aviso; idempotência por `dedupeKey`), teste de domínio existente ou novo, e teste e2e do caminho feliz + 2 caminhos de erro. Entregável: `docs/auditoria-dono/02-logica-e-testes.md` + testes no repositório.

## FASE 2 — Suporte: trocar de negócio e de painel com facilidade

Objetivo: o dono (e a equipe NextLevel) abre o painel de **qualquer cliente de qualquer marca** em até 3 cliques, vê exatamente o que o cliente vê, e volta.

1. **Troca de negócio** no topo do Master: seletor de marca (NextLevel, SuperDrop, Commerce, e as futuras em "em breve") que filtra todo o Master e mostra a identidade da marca escolhida. Atalho de teclado na busca (Ctrl+K): "ir para marca…", "abrir cliente…".
2. **Central de clientes por marca** (`/master/clientes` ou dentro de cada marca): busca por nome, e-mail, CNPJ/CPF, loja, pedido; lista com papel, plano, situação (ativo, bloqueado, devendo, sem pagamento configurado), último acesso, alertas.
3. **"Ver como cliente" (modo suporte):** a partir do cliente, entrar no painel dele com uma faixa fixa "Você está vendo como <cliente> · Sair do modo suporte". Reaproveitar o que já existe (`hasCommerceMasterReturn`, faixa de modo assistido em `role-layout.tsx`) e generalizar para lojista SuperDrop, fornecedor, expedição, parceiro e equipe Commerce.
   - Somente leitura por padrão; ações exigem confirmação explícita "agir em nome do cliente" e ficam registradas.
   - Motivo obrigatório, duração limitada, registro em `audit_log` (quem, quando, cliente, motivo, ações).
   - Segredos (tokens, chave Pix, dados de cartão) nunca aparecem, nem em modo suporte.
   - `security-guardian`: revisar escalonamento de privilégio, vazamento entre tenants, CSRF, sessão.
4. **Dentro de cada cliente:** alternar entre os painéis que ele tem (ex.: fornecedor com loja própria → painel do fornecedor, da expedição e da loja) sem sair do modo suporte.
5. **No ambiente de demonstração:** manter o seletor de contas de demonstração e acrescentar a troca de marca pelo mesmo menu (hoje depende do endereço).
6. Testes: permissões (quem pode e quem não pode entrar em modo suporte), auditoria gravada, saída do modo, isolamento entre tenants, celular.
Entregável: telas funcionando, `docs/auditoria-dono/03-suporte.md` com o fluxo e as regras.

## FASE 3 — Cores dos painéis internos com identidade de cada marca

Hoje os painéis usam neutros compartilhados e a cor de assinatura só em botões, item ativo, links e foco (D79). Avalie e proponha (com capturas antes/depois) onde a marca deve aparecer mais sem perder legibilidade:
- barra lateral com tinta suave da marca (fundo, item ativo, separadores) e cabeçalho com faixa ou detalhe na cor;
- monograma e nome da marca sempre visíveis (também no menu recolhido e no celular);
- KPIs, gráficos (paleta categórica coerente com a marca, `dataviz`), selos e estados vazios;
- modo escuro de cada marca com identidade própria (não só "navy igual para todos"), mantendo AA;
- Master com identidade do grupo (amarelo + navy) e, ao filtrar uma marca, a cor dela.
Regras: tudo pelo contrato de tema (`themes.ts` e papéis derivados), contraste AA medido (`tests/design-system.test.ts`), capturas das 3 marcas × 2 modos × desktop/celular, decisão registrada (D80+). Se a paleta mudar, atualizar `brand-system-v2/` (gerador em `brand-system-v2/ferramentas/`).

## FASE 4 — Relação Master × marcas (auditoria profunda)

1. Racional da navegação do Master: o que o dono precisa ver primeiro todo dia (fila de decisões, dinheiro, problemas), por marca e consolidado.
2. Cada marca no Master com: saúde (pedidos, receita, falhas de pagamento, fornecedores sem estoque, lojas sem pagamento configurado), atalhos para clientes com problema e para o painel da marca.
3. Consistência de termos, números e permissões entre Master, console Commerce (`/commerce`) e painéis das marcas.
4. Propor e implementar: menu do Master organizado por **Grupo → Marca → Cliente**, trilha clara, busca global que encontra cliente, pedido, loja e fornecedor de qualquer marca.
Entregável: `docs/auditoria-dono/04-master-marcas.md` + telas.

## FASE 5 — Páginas públicas SuperDrop e Commerce em nível de agência (> R$ 15 mil)

Use a skill `pagina-de-vendas` (premissas: ativo produzido, coreografia de rolagem, texto afiado; nada de "visual de IA").
1. **Auditoria elemento a elemento** (desktop e celular): cabeçalho, hero, provas, seções de recurso, planos, FAQ, rodapé, botões, cartões, ícones, espaçamentos, ritmo de cor, tipografia, movimento. Notas de 0 a 10 com justificativa e referência do que seria 10.
2. **Dinamismo com propósito:** revelação por rolagem (`animation-timeline: view()` com alternativa), dispositivo fixo com recursos que acendem na rolagem, faixas em loop, contadores apenas com números reais, microinterações em botões e cartões, demonstração interativa do painel (dados fictícios identificados), alternância claro/escuro impecável. Respeitar `prefers-reduced-motion`.
3. **Espaços para imagens:** onde a página ganha com fotografia ou arte, criar o componente `ImagemEmCriacao` (proporção reservada, sem salto de layout, rótulo discreto "Imagem em criação", nome do arquivo esperado visível só em modo demonstração) e o **manifesto** `public/portal/<marca>/v3/MANIFESTO.md` com nome, proporção, formato e uso de cada imagem. Quando o arquivo existir na pasta, a imagem substitui o espaço automaticamente. Prompt para gerar as imagens: `docs/prompts/imagens-paginas-publicas-gpt.md` (atualize-o com o manifesto final).
4. **Cores das páginas públicas:** auditar contra o sistema v2 (navy/off-white, assinatura da marca, amarelo do grupo como apoio), eliminar cores fixas antigas, garantir AA em todas as faixas.
5. **Desempenho:** LCP < 2,5 s no celular, CLS < 0,05, imagens AVIF/WebP com tamanho reservado, nada de biblioteca pesada sem justificativa (`desempenho`).
6. Mínimo de 3 rodadas de ajuste com capturas (360, 768, 1440; topo e 5 pontos de rolagem) antes de apresentar.

## FASE 6 — Entrega e "pronto para o dono"

1. `release-gate`: tipos, estilo, Vitest completo, build, e2e de navegação, axe, desempenho, verificação do GitHub Actions verde.
2. `docs/auditoria-dono/RELATORIO.md`: o que foi encontrado, corrigido, testado e publicado; o que ficou pendente e por quê; capturas antes/depois.
3. **Checklist do dono** (atualizar `docs/prompts/COMANDOS-DO-DONO.md`): tudo o que só o dono faz (conectar Mercado Pago da NextLevel no Master, variáveis do Render, domínios e DNS, e-mail de envio, contas reais, Neon), com o passo a passo em linguagem simples e como conferir que deu certo.
4. Atualizar `docs/LINKS.md` com as telas novas (central de clientes, modo suporte, seletor de marca).

## CRITÉRIOS DE ACEITE

- Dono abre o painel de qualquer cliente de qualquer marca em ≤ 3 cliques, no desktop e no celular, com registro em auditoria.
- Navegação 100% rastreada por papel e marca: zero link quebrado, zero 500, item ativo correto, mesmo destino no menu do celular.
- Lista de inconsistências de conteúdo zerada ou com justificativa.
- Cada fluxo de negócio com racional escrito e teste automatizado.
- Painéis com identidade visível de cada marca nos dois modos, AA medido.
- Páginas públicas com nota ≥ 9 em todos os elementos, espaços de imagem prontos, sem rolagem lateral, metas de desempenho atingidas.
- Tudo publicado, Actions verde, relatório e checklist do dono atualizados.
