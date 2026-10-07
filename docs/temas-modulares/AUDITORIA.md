# Auditoria E0 — Temas, editor, banners e demonstrações (07/10/2026)

**Commit auditado:** `f4c6457cae5fa2845008d7de2aa5726774b5a7a2` (branch de publicação `claude/wonderful-cannon-5o38v5`).
**Trabalho feito em:** branch isolada `claude/temas-modulares-v1`, criada desse commit, sem alterações locais pendentes. Remoto `origin` = GitHub `GrupoMauricio/bras-digital-business-hub`. Sem push, merge ou deploy.

## 1. Baseline (antes de qualquer mudança)

| Verificação | Comando | Resultado no commit auditado |
|---|---|---|
| Tipos | `npx tsc --noEmit` | sem erro |
| Estilo | `npx eslint src e2e tests` | sem erro |
| Testes | `npx vitest run` | 79 arquivos, **587 de 587** passaram |
| Build | `NEXT_PUBLIC_DEMO_MODE=true npm run build` | ok, sem "Export encountered" |

Nenhuma falha preexistente. Toda falha que aparecer depois é desta branch.

## 2. Método e cobertura

- **Leitura** de:
  - `src/lib/themes/*`, `src/lib/features.ts` e `src/lib/domain/{assets,entitlements,nextlevel-billing,orders}.ts`;
  - `src/app/actions/{theme,assets}.ts` e `src/app/theme-editor/page.tsx`;
  - `src/components/theme-editor/*` e `src/components/storefront/sections/*`;
  - a galeria pública, a home Commerce e o `theme-showcase` da home SuperDrop;
  - os testes `tests/theme-*`, `tests/temas-pagos.test.ts` e a Constituição 07 (§8, §14 a §24).
- **Execução** num banco descartável (PGlite em memória, contas sintéticas do seed), com um teste temporário que reproduz cada hipótese. O resultado bruto está em `evidencias/e0/execucao-hipoteses.txt`.
- **Navegador**: build de produção local, porta 3100, demonstração com dados sintéticos. Capturas em `evidencias/e0/`.
- **Não coberto:** produção, pagamentos reais, desempenho de campo (só laboratório depois) e e-mail real.

## 3. Achados

Classificação: **[EXEC]** confirmado por execução · **[LEIT]** confirmado por leitura · **[HIP]** hipótese a testar.

| ID | Sev. | Achado | Evidência | Causa | Impacto | Correção |
|---|---|---|---|---|---|---|
| A01 | **Alta** | Tema em aprovação (`released:false`) pode ser comprado | [EXEC] `buyTheme(ninho)` → "OK (aceito)"; `src/lib/themes/install.ts:59-75` não consulta `released` | Release só filtra a vitrine (`install.ts:49`), não a compra | Cobrança de tema não liberado comercialmente | Política única de release, consultada na compra, instalação e vitrine |
| A02 | **Alta** | Restrição de seção por tema nunca é aplicada | [EXEC] loja `STORE_OWN` sem licença salva `slideshow` (do Arena/Signature); [LEIT] `SectionSchema.themes` não é lido em lugar nenhum (só declarado em `sections.ts`); nenhuma seção tem `premium:true`, então `assertPremium` (`store.ts:60`) nunca dispara | A regra existe só como metadado | Recursos dos temas pagos ficam liberados de graça para quem tem "Loja própria" | Capacidades semânticas por nível, validadas no servidor ao salvar, restaurar e publicar |
| A03 | **Alta** | Quem compra um tema pago numa loja de subdomínio não edita o que comprou | [EXEC] com licença Lume instalada, adicionar FAQ → `FEATURE_LOCKED … Loja própria`; [LEIT] `store.ts:69` e `editor.tsx:128` amarram toda mudança de estrutura a `appearanceAdvanced` (só `STORE_OWN`) | Edição derivada do plano, não do tema licenciado | Contraria a decisão 4.2: upgrade operacional escondido | Edição derivada do tema ativo + licença |
| A04 | **Alta** | Instalar tema apaga o rascunho sem cópia | [EXEC] rascunho com marcador; depois de `installTheme`, rascunho some e nenhuma versão guarda o marcador; [LEIT] `install.ts:111` salva só o publicado e `:116` grava `draft: null` | O snapshot usa `resolveTemplate` sem `draft` | Perda silenciosa de trabalho do lojista (Constituição 07 §19) | Guardar o rascunho no histórico antes e avisar |
| A05 | **Alta** | Duas abas sobrescrevem o rascunho sem aviso | [EXEC] aba B, com base antiga, grava por cima da aba A (valor final "ABA-B") | Rascunho sem número de revisão (`store.ts:65-73`) | Perda silenciosa de edição | Revisão por documento e conflito recuperável |
| A06 | Média | Upload aceita arquivo que não é imagem de verdade | [EXEC] PNG com cabeçalho válido e corpo lixo é aceito; [LEIT] `assets.ts:13` só olha os bytes iniciais; sem limite de dimensões ou pixels | Validação por assinatura | Imagem quebrada na loja e risco de arquivo gigante | Decodificar (sharp), limitar dimensões, pixels e peso |
| A07 | Média | Mídia sem gestão: sem biblioteca, exclusão ou registro de uso; teto de 80 imagens sem como remover | [LEIT] `assets.ts:9-37`; não existe listagem nem remoção; a mensagem pede "Remova imagens que não usa" | Upload simples para campo | Lojista trava ao atingir 80; não reaproveita imagem | Biblioteca de mídia com usos e arquivamento |
| A08 | Média | Imagens guardadas em base64 dentro do banco | [LEIT] `store_assets.data_base64`; `route.ts` decodifica a cada requisição sem cache local | Solução inicial | Banco cresce e o servidor trabalha mais | Interface de armazenamento com adaptador local; migração incremental depois |
| A09 | Alta | "Banners" não têm imagem | [LEIT] `sections.ts:66-71`: só título, subtítulo, cor e link | Seção de texto | Não cumpre o aceite 5 ("banners são imagens reais") | Posições de banner com imagem desktop/mobile, foco e alt |
| A10 | Média | Destaque e slides sem `srcset`, versão mobile, alt ou prioridade | [LEIT] `premium.tsx:20-22` (`background-image` CSS), slides com todos os fundos no DOM | Imagem como fundo | LCP ruim no celular, recorte cego, leitores de tela sem descrição | `<picture>`/`img` com `?w=`, mobile e foco, prioridade só no 1º |
| A11 | Média | Modelos prometem o que não está configurado | [LEIT] `presets.ts:51,78,128` "Frete grátis acima de R$ 299" e "Envio em até 1 dia útil"; `:85,137` contagem regressiva de 7 dias inventada; `sections.ts:46` "7 dias para trocar", `:87` "Enviado pela Central Sports" | Texto de exemplo fixo | Promessa falsa ao consumidor final | Textos neutros; promessa só com regra configurada |
| A12 | Média | Depoimentos de exemplo saem publicados | [LEIT] `presets.ts:111,117,139,144` usam depoimentos "Depoimento de exemplo" | Seção pronta | Prova social fabricada | Ocultar por padrão ou identificar como demonstração |
| A13 | Média | Preço dos temas em três fontes, uma desatualizada | [LEIT] FAQ fixo omite o Lume (`commerce/sections.tsx:107`); `theme-showcase.tsx:8-10` com preços fixos; [EXEC] a tabela "Temas e valores" da home Commerce lista o **Ninho (não liberado)** com preço | Texto duplicado | Preço errado ou tema não liberado anunciado | Fonte única (catálogo + release) |
| A14 | Média | Teste "não pode ser comprado" não tenta comprar | [LEIT] `tests/temas-pagos.test.ts:63-68` só confere a ausência na vitrine | Teste incompleto | Deixou passar A01 | Teste de tentativa direta |
| A15 | Média | Demonstração não simula compra | [EXEC] carrinho da demo aceita item e mostra "Frete Grátis"; o checkout só diz "não existe compra aqui" (`evidencias/e0/demo-lume-checkout-390.png`) | Proteção por recusa (`orders.ts:94`) | Visitante não vê o fluxo; o frete "Grátis" engana | Checkout simulado segregado, sem pedido, estoque, gateway ou e-mail |
| A16 | Média | Galeria sem filtro de nível ou nicho | [EXEC] `/temas` lista 5 temas, sem filtro de nível; `ThemeInfo.tier` mistura nível e preço (STARTER/PRO/ELITE/SIGNATURE) | Modelo antigo | Comparação confusa; não escala para 24 temas | Catálogo com nível, família, segmento e release separados |
| A17 | Baixa | `whatsapp-float`/CTA "Chamar no WhatsApp" sem número configurado | [HIP] presets inserem chamadas para WhatsApp mesmo em loja sem número | — | Botão sem destino | Ocultar sem número (verificar na E3) |
| A18 | Média | Links de imagem aceitam qualquer caminho, inclusive `/assets/` de outra loja | [LEIT] `settings.ts:31` (`/^\/[^\s]*$/`) | Validação genérica | Uma loja referencia imagem de outra (imagem pública; não vaza dado privado, mas foge do controle de uso) | Na mutação, aceitar só mídia da própria loja ou do acervo autorizado |
| A19 | Informativo | Instalar já publica (exceção D-temas-1clique) | [LEIT] `install.ts:114-121`; decisão registrada (DECISIONS, exceção ao 07 §17) | Decisão do dono | — | Manter, com o rascunho preservado (A04) |
| A20 | Informativo | Licença paga: idempotente por fatura e vitalícia | [LEIT] `entitlements.ts:34-36`; `nextlevel-billing.ts:147-155` | — | Correto | Manter e cobrir com teste de evento repetido |

## 4. Hipóteses do prompt (§5.2), com resultado

| # | Hipótese | Resultado |
|---|---|---|
| 1 | Edição avançada depende de `STORE_OWN` | **Confirmada [EXEC]** (A03) |
| 2 | `SectionSchema.themes` não é aplicado | **Confirmada [EXEC+LEIT]** (A02) |
| 3 | Diálogo e salvamento com regras diferentes | Ambos usam `premium`, que nenhuma seção tem: são **iguais e igualmente inoperantes** (A02). O cadeado do editor depende do plano, como o servidor (A03) |
| 4 | `promo-banners` sem imagem | **Confirmada [LEIT]** (A09) |
| 5 | Preços duplicados e Lume omitido | **Confirmada [LEIT+EXEC]** (A13) |
| 6 | Compra/instalação não bloqueiam tema em aprovação | Compra **confirmada [EXEC]** (A01). A instalação exige licença, logo cai junto |
| 7 | Teste "não pode ser comprado" incompleto | **Confirmada [LEIT]** (A14) |
| 8 | Upload: limite fixo, base64 no banco, sem gestão | **Confirmada [EXEC+LEIT]** (A06–A08) |
| 9 | Instalação substitui rascunho | **Confirmada [EXEC]** (A04) |
| 10 | Presets com promessas não configuradas | **Confirmada [LEIT]** (A11, A12) |

## 5. Mapa de dependências (atual)

`catalog.ts` (THEME_CATALOG) → `syncThemeCatalog` (tabela `themes`) → `gallery.ts` (vitrine pública) / `install.ts` (cartões, compra, instalação) → `presets.ts` (composição por tema) → `store.ts` (rascunho/publicação, cadeados pela oferta via `features.ts`) → `template.ts`/`settings.ts` (normalização) → storefront `sections/*` (render). Licenças: `entitlements` (`THEME_<KEY>`), concedidas por `fulfillPaidInvoice`. Mídia: `store_assets` (base64) servida por `/assets/[id]`.

## 6. Matriz atual × proposta

| Tema | Hoje (tier) | Proposta (família · nível) | Observação |
|---|---|---|---|
| Starter | STARTER, grátis | Base · N1 | Continua grátis e padrão de lojas novas |
| Lume | PRO, R$ 149 | Moda · N2 | Preço preservado |
| Ninho | PRO, R$ 149, em aprovação | Casa · N2 | Continua em aprovação |
| Arena | PRO, R$ 299 | Sport · N3 | Preço preservado |
| Editorial | ELITE, R$ 699 | Moda · N3 (identidade "revista") | Preço preservado |
| Signature | SIGNATURE, R$ 1.499 | Base · N4 | Preço preservado |
| Moda N1, Moda N4 (novos) | — | Moda · N1 e N4 | Em revisão; sem preço novo (proposta em documento separado) |

## 7. Conflitos com normas existentes

- **Skill `tema-pago`** ("nunca comece o tema N+1 sem o OK do dono no tema N") × **este pedido** (desenvolver localmente vários temas em revisão). Proposta: a norma passa a valer para **liberação comercial**, não para desenvolvimento local reversível. Fica registrada como proposta; a skill não foi alterada em silêncio.
- **Constituição 07 §17** ("instalação não publica"): a exceção já está registrada nas decisões; mantida, com o rascunho preservado (A04).

## 8. Skills usadas

| Skill | Para quê |
|---|---|
| `tema-pago` | Normas de demo, isolamento, comparação e liberação controlada |
| `qa-visual` | Capturas nas três larguras |
| `desempenho` | Fase E6 |
| `release-gate` | Fase E6 |

As de análise (`repo-auditor`, `root-cause`) foram aplicadas como método (achado → evidência → causa), sem gerar artefatos separados.
