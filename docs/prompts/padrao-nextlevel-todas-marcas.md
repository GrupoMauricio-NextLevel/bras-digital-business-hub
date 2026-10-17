# Padrão NextLevel em todas as marcas e painéis: resultado, auditoria e prompt engenheiro mestre

> Para quem é: o dono (Mauricio) e qualquer agente (Claude, Codex) que for evoluir páginas públicas e painéis.
> Data: 2026-10-17. Decisão de base: **D164** (`docs/design/DECISIONS.md`). Autoridade máxima do e-commerce: `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md`.

---

## 1. O que conseguimos na NextLevel Soluções (a régua)

O site do grupo (`nextlevelgroup.com.br/solucoes`) é hoje a página mais madura do sistema. O que a fez subir de nível, em ordem de impacto:

| # | O que foi feito | Onde está | Por que funciona |
|---|---|---|---|
| 1 | **Uma fonte só da marca** (nome, cores, logos, ícones, variáveis CSS) | `src/lib/marcas/nextlevel.ts` (`NL`, `nlCssVars()` → `--nlg-*`) | Nenhum hexadecimal solto em componente; trocar a marca é trocar um arquivo |
| 2 | **Logos oficiais por superfície** (flat no cabeçalho, Prisma no herói, monograma recolhido), troca de arquivo para claro/escuro | `BrandLogo` + `PNG_OFICIAIS` | Nunca filtro nem recoloração; nítida em 2x |
| 3 | **Herói marinho com peça 3D**, título e botões em HTML | `heroi-nextlevel.tsx` | Primeira dobra com cara de produto caro, leve, acessível |
| 4 | **Vitrine imersiva** (jornada por fases, portas de entrada, busca por intenção, seleção que vira diagnóstico) | `src/lib/solucoes/*`, `src/components/portal/solucoes/*` | O visitante monta o que precisa; o formulário chega preenchido |
| 5 | **Fotografia com direção** (27 imagens, 800/1600, AVIF+WebP, paisagem no computador e retrato no celular) | `public/portal/nextlevel/v4/solucoes/` | Nada de foto genérica ou gradiente no lugar de ativo |
| 6 | **Copy sem promessa**, com FAQ estruturado (JSON-LD) e estudo de conversão | `docs/prompts/solucoes-copy-conversao-estudo.md` | Texto que responde à dúvida de cada seção |
| 7 | **Movimento nativo** com alternativa para movimento reduzido | `src/components/movimento/*` | Sem biblioteca pesada |
| 8 | **Prévia de link, manifesto e ícones da marca** | `layout.tsx`, `og-marca.ts` | Compartilhar no WhatsApp já mostra a marca certa |
| 9 | **Liga/desliga por chave** (`FIN_SOLUTIONS_V2`) e prévia para o Master (`?previa=v2`) | `src/lib/finance/flags.ts` | Publicar sem medo; voltar atrás com uma variável |

**A régua, em uma frase:** cada marca tem uma fonte única de identidade, logos oficiais por superfície, uma primeira dobra com ativo real, uma jornada que leva o visitante a uma ação, e **nenhum elemento de outra marca fora do lugar**.

---

## 2. Auditoria da NextLevel E-commerce (2026-10-17)

Conta usada: `lojista@commerce.demo` (conta simples, loja independente), `master@nextlevel.demo`. 33 telas capturadas em 1440 px (públicas, 18 do painel do lojista, console E-commerce no Master). Script: `scripts/auditoria/marca.mjs` (seção 4). Depois das correções: 26 telas, só a lista de perfis de demonstração do login ainda cita o SuperDrop (aceito, só existe no modo demonstração).

### 2.1 Profundidade comparada à Soluções

| Camada | Soluções | E-commerce hoje | Distância |
|---|---|---|---|
| Fonte única da marca | ✔ `nextlevel.ts` | ✔ `nextlevel-ecommerce.ts` (D163) | igual |
| Logos e ícones oficiais | ✔ | ✔ | igual |
| Primeira dobra com ativo real | ✔ herói 3D | ✔ foto + recorte do painel | perto |
| Jornada imersiva (fases, portas, seleção → ação) | ✔ | ✘ home em seções lineares; planos com régua de faturamento | **grande** |
| Fotografia própria em todas as seções | ✔ 27 fotos | parcial (home sim; planos, temas, cadastro, login genérico) | média |
| Painel com a cor e o nome da marca | — | ✔ tema `commerce`; ✘ itens herdados do SuperDrop (corrigidos, 2.2) | média |
| Copy e FAQ estruturado | ✔ | parcial | média |

### 2.2 Vazamentos encontrados e situação

| Onde | Vazamento | Situação |
|---|---|---|
| Topo de todos os painéis e páginas de cadastro/entrada | "Fio do grupo" com o verde do SuperDrop e o nome SuperDrop no lançador e no selo do Club | **Corrigido (D164):** a E-commerce não lista o SuperDrop; os segmentos das outras marcas ficam neutros, e só a marca atual tem cor |
| Rodapé "Parte do Grupo NextLevel" nas páginas públicas | bolinhas coloridas de cada marca e link para o SuperDrop | **Corrigido:** sem SuperDrop e sem cor de outra marca |
| Pós-venda do lojista independente | colunas "Aguardando recarga" e "Na Central"; alerta "Parado na Central" | **Corrigido:** a coluna de recarga some; "Na Central" vira "Em preparação" |
| Financeiro do lojista | cartão "Loja SuperDrop · R$ 97/mês" (plano antigo) e "Por que cobramos" com o texto do SuperDrop | **Corrigido:** mostra o plano da E-commerce (assinatura real) e tira a explicação do SuperDrop |
| Nomes de plano | "Commerce Start (o seu)", "Commerce Pro"… | **Corrigido na tela:** "Plano Start / Pro / Scale" (`nomePlanoEc`). No banco o nome continua "Commerce Start" (ver pendências) |
| Console E-commerce no Master (`/commerce/*`) | descrições citando SuperDrop, Central e fila de expedição | **Corrigido:** só fala da E-commerce |
| Menu do Master | "Financeiro SuperDrop" aparecia mesmo com o filtro da marca E-commerce | **Corrigido:** só aparece onde há o módulo de distribuição |
| Cadastro, faturas novas e sugestões do financeiro | "Commerce Start/Pro/Scale" | **Corrigido:** "Plano Start/Pro/Scale" (`nomePlanoEc`, `nomeProdutoEc`); faturas já emitidas guardam o texto antigo (histórico) |
| "Esqueci a senha" | selo do Club listando o SuperDrop (a página não dizia qual era a marca) | **Corrigido** |
| Pedidos do lojista | já tinha modo E-commerce (sem "Aguardando saldo" / "Na Central") | ok desde antes |
| Lista "Perfis de demonstração" no login | cita SuperDrop, Central, etiqueta | aceito: só existe em modo demonstração |

### 2.3 Pendências que dependem do dono

1. **Nome dos planos no banco de produção** ("Commerce Start…"): trocar no Master → Financeiro → Catálogo (gera nova versão, sem mexer no preço). As telas já mostram o nome certo.
2. **Termos legais** ainda dizem "NextLevel Commerce" (`legal-grupo.tsx`): mudar exige a sua decisão (o contrato assinado cita o nome antigo).
3. **Rota `/commerce` do Master** fica com esse nome (é endereço interno, ninguém de fora vê).
4. **Cores semânticas** (verde de "pago" e "entregue", amarelo de alerta, vermelho de erro) são de estado, não de marca, e ficam em todas as marcas.

---

## 3. Regras que valem para todas as marcas (não negociáveis)

1. **Cada marca só mostra a si mesma e ao grupo.** Nenhuma tela de uma marca exibe nome, logo, cor, plano, termo de operação ou link de outra, exceto: a assinatura "um sistema NextLevel" e o lançador "Marcas do grupo" (que segue a tabela de ocultação `OCULTAS_EM` em `lancador.ts`).
2. **Nada de SuperDrop na NextLevel E-commerce**: nem nome, nem verde, nem conceitos de distribuição (Central, recarga, saldo do fornecedor, rede, "Preços e publicação" do fornecedor).
3. **Cor fora do lugar = defeito.** Em cada marca só aparecem: as cores da própria marca (variáveis `--nlg-*`, `--ec-*`, `--bdc-*`, `--brand-*`), neutros do tema e as cores de estado (sucesso, alerta, erro, informação). Hexadecimal escrito à mão em componente é proibido; vai para `src/lib/marcas/<marca>.ts`.
4. **Conceito fora do papel = defeito.** A loja independente (`store.kind === "SUPPLIER_OWN"` e `isIndependentStore`) não vê nada de fornecedor; o fornecedor não vê nada de plano de loja; o parceiro não vê operação.
5. **A decisão fica no domínio** (`src/lib/domain/*`), a tela só desenha. Ex.: `stagesFor(independent)` no pós-venda e `visivelEm` no fio do grupo.
6. **SuperDrop está em produção:** toda mudança mantém o comportamento dele, com teste que prove isso.
7. AA de contraste, sem rolagem horizontal em 360 px, movimento reduzido respeitado e `force-dynamic` em página com banco.

---

## 4. Como avaliar (comandos)

```bash
# 1. Sistema local (porta 3100) ou build de produção (porta 3300)
bash scripts/restart-demo.sh            # ou: npm run build && npm start -- -p 3300

# 2. Varredura de vazamentos e cores de uma marca: telas, termos proibidos e cores fora do lugar
#    Uso: node scripts/auditoria/marca.mjs <host> <conta> <senha> [saida]
node scripts/auditoria/marca.mjs http://cm.test:3300 lojista@commerce.demo demo1234
#    Gera <saida>/relatorio.json (termos e cores por tela) e PNG de cada tela.

# 3. Procura no código (antes de publicar), por marca
rg -n "SuperDrop|Central|recarga" src/app/merchant src/app/commerce src/components/portal/commerce
rg -n "#[0-9A-Fa-f]{6}" src/components src/app --glob '!**/marcas/**'

# 4. Portões
npx tsc --noEmit && npx eslint src e2e tests
npx vitest run tests/ecommerce-sem-superdrop.test.ts tests/marca-certa.test.tsx tests/nextlevel-ecommerce.test.tsx
npm run build
```

**Hosts locais** (Chromium com `--host-resolver-rules=MAP *.test 127.0.0.1`): `nl.test` = NextLevel/Master, `cm.test` = E-commerce, `sd.test` = SuperDrop, `bd.test` = Brás Digital Club, `cg.test` = Cargas.

**Lista de termos proibidos por marca** (o script usa esta tabela; ampliar aqui primeiro):

| Marca | Não pode aparecer |
|---|---|
| NextLevel E-commerce | SuperDrop, Central, recarga, saldo do fornecedor, rede, verde `#2D9E3B`, "Commerce Start/Pro/Scale" |
| SuperDrop | NextLevel E-commerce como produto dele, azul `#3F65FF` da E-commerce |
| Brás Digital Club | SuperDrop, E-commerce como produto dele, amarelo antigo do GRUPO |
| NextLevel Cargas | SuperDrop, cores de outra marca |
| NextLevel (grupo, Master) | amarelo antigo `#F5BC00` nas telas da marca-mãe; nomes antigos das marcas |

---

## 5. Matriz marca × painel × nível de acesso (o que auditar)

| Marca (endereço) | Páginas públicas | Painéis e níveis | Conta de demonstração |
|---|---|---|---|
| **NextLevel (grupo)** `nextlevelgroup.com.br` | `/solucoes`, contato, legais | — | — |
| **Master** `master.nextlevelgroup.com.br` | login | Master completo; equipe por função (financeiro, suporte, comercial…); console da E-commerce (`/commerce`); console do Brás (`/bras`); modo suporte dentro do cliente | `master@nextlevel.demo` |
| **NextLevel E-commerce** `lojas.nextlevelgroup.com.br` | home, planos, temas, FAQ, cadastro, entrar, esqueci a senha, parceiros, demos | lojista dono (conta simples independente), equipe da loja, editor de tema, vitrine da loja (`/store/[slug]`) | `lojista@commerce.demo` |
| **SuperDrop** `superdrop.com.br` | home v4, planos, fornecedores | lojista (lite e pro), fornecedor (admin, expedição), parceiro, página do fornecedor (`/f/[slug]`) | `dono@arena10.demo`, `central@centralsports.demo` |
| **Brás Digital Club** | página pública, rede, diretório | membro (Meu Brás), importadora, balcão, excursão | contas do seed do Brás |
| **NextLevel Cargas** | página pública | transportadora, motorista | contas do seed de Cargas |
| **Família** (Club, Loja NextLevel, Meu Contador, Parceiros) | páginas da família | painel do parceiro | — |

Cada célula é auditada em 360, 768 e 1440 px, claro e escuro, com a lista da seção 4.

---

## 6. Prompt engenheiro mestre (cole para o agente)

```
Você vai elevar TODAS as marcas e TODOS os painéis do sistema NextLevel ao padrão da NextLevel Soluções,
sem nenhum vazamento entre marcas. Leia primeiro: CLAUDE.md, AGENTS.md,
docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md, docs/prompts/padrao-nextlevel-todas-marcas.md (este arquivo,
seções 1 a 5) e as decisões D161 a D164 em docs/design/DECISIONS.md. Fale com o dono em português simples.

REGRA ZERO: nenhuma marca mostra nome, cor, logo, plano, termo de operação ou link de outra marca fora do
lançador "Marcas do grupo" (que obedece OCULTAS_EM em src/lib/domain/ecossistema/lancador.ts). Nada de SuperDrop
na NextLevel E-commerce. Cor de marca só por variável vinda de src/lib/marcas/<marca>.ts. A mistura inteligente
das marcas do grupo (venda cruzada) é uma rodada FUTURA, com decisão própria do dono: não faça agora.

FASE A — Varredura (relatar primeiro, sem mudar código)
  Para cada linha da matriz (seção 5): rode scripts/auditoria/marca.mjs com a conta indicada, capture 360/768/1440
  claro e escuro, e liste por tela: termos proibidos, cores fora do lugar, conceito que não é do papel, contraste
  reprovado, rolagem horizontal. Entregue uma tabela por marca com gravidade (vazamento > contraste > acabamento).

FASE B — Vazamentos (corrigir tudo que a fase A achou)
  A decisão de esconder/renomear fica no domínio (função pura testada); a tela só desenha. Uma loja
  independente nunca vê fornecedor, Central, recarga ou saldo. Teste em tests/<marca>-sem-vazamento.test.ts
  provando que a marca afetada mudou e que o SuperDrop continuou igual.

FASE C — Identidade por marca (o que a Soluções tem e a marca ainda não)
  Para cada marca: fonte única em src/lib/marcas/<marca>.ts (cores, logos, ícones, xxCssVars()), BrandLogo com
  arquivos oficiais, manifesto, ícones, prévia de link, tema derivado com contraste AA. Trocar todo hexadecimal
  escrito à mão pelas variáveis. Kits da família (Club, Loja NextLevel, Meu Contador, Parceiros) saem do
  amarelo antigo quando o dono entregar os kits v2.

FASE D — Profundidade das páginas públicas (E-commerce primeiro)
  Aplicar a anatomia da Soluções: herói com ativo real; jornada por fases com portas de entrada ("quero começar",
  "já vendo no Instagram", "quero sair de outra plataforma"); seleção que vira ação (plano sugerido + cadastro
  preenchido); temas como vitrine imersiva; FAQ com JSON-LD. Antes de construir, escreva o contrato de ativos
  (arquivo, proporção, prompt para o gerador de imagens) e pare se faltar foto: nunca foto genérica.
  Ligue por chave (como FIN_SOLUTIONS_V2) com prévia para o Master.

FASE E — Profundidade dos painéis (todos os níveis de login)
  Cada primeira tela responde "o que preciso fazer agora?": fila do dia com botão de ação, pulso da loja, números
  com "e daí?". Mesma anatomia de pedido em lojista, fornecedor e Master. Cor de sinal única por marca; estados
  (sucesso, alerta, erro) com as cores semânticas do tema. Nada de cartões idênticos com sombra nem gradiente roxo.

PORTÕES (em toda fase): npx tsc --noEmit; npx eslint src e2e tests; testes do que mudou; npm run build; varredura
da seção 4 sem termos proibidos; axe sem violação grave; 360 px sem rolagem horizontal. Registre cada decisão em
docs/design/DECISIONS.md (próxima: D165). Commits pequenos em português; push na branch de publicação.

ENTREGA de cada fase: o que ficou pronto, capturas antes/depois, o que depende do dono, próxima fase.
```

---

## 7. Próxima rodada (registrada a pedido do dono)

**Mistura inteligente das marcas do grupo** (venda cruzada): quando e onde uma marca deve oferecer outra (ex.: lojista E-commerce comprando estoque no Brás Digital Club, transporte pela Cargas), com motivo claro e sem confundir o cliente. Hoje isso fica restrito ao lançador "Marcas do grupo" e à tabela `RECOMMEND` em `lancador.ts`; a rodada vai pedir uma decisão nova do dono.
