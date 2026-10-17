# Home imersiva da NextLevel E-commerce: prévia, auditoria e pendências

> Branch de revisão: `revisao/ecommerce-home-imersiva` (não é a branch de publicação; nada foi publicado).
> Data: 2026-10-17. Pacote de origem: `nextlevel-ecommerce-pacote-claude-code.zip` (status do manifesto:
> `PROTOTIPO_VISUAL_NAO_APROVADO_PARA_PUBLICACAO`). Briefing: `docs/prompts/ecommerce-home-imersiva-imagens-gpt.md`.

## 1. O que foi feito

| Peça | Onde | Observação |
|---|---|---|
| Rota de prévia `/previa-home` | `src/app/(portal)/previa-home/page.tsx` | Só existe com `EC_HOME_IMERSIVA_PREVIA=true` **e** no endereço da E-commerce (no SuperDrop e sem a chave: 404). Marcada para não aparecer em buscadores. A home `/` continua exatamente a atual. |
| Página | `src/components/portal/commerce/imersiva/home-imersiva.tsx` | Topo atual (mesmo texto e oferta vinda do Master) → jornada em 5 passos → 4 portas → lojas de exemplo → temas → planos (simulador atual) → dúvidas → chamada final. |
| Jornada "a loja que cresce" | `jornada-ec.tsx` + `imersiva.css` | Mesmo motor da jornada de Soluções (`ImmersiveScroll`). Computador: foto emoldurada à esquerda e texto à direita. Celular e tablet em pé: foto em pé ao fundo, texto em cima. Régua de passos clicável por teclado. Sem JavaScript ou com "menos movimento": passos parados em sequência, cada um com a sua foto. |
| Imagens | `public/portal/nextlevel-ecommerce/v1/home/` (72 arquivos, 2,4 MB) | Faixas do storyboard cortadas, proporção 3:2 / 2:3, AVIF + WebP em 800/1400 (paisagem) e 640/960 (retrato), sem ampliar além do original. Os PNG originais (27 MB) **não** entraram no repositório. |
| Manifesto | `src/lib/marcas/ecommerce-home-imagens.ts` | Tamanhos e cor média de cada imagem (fundo enquanto carrega); `EC_HOME_PROVISORIAS = true`. |
| Componente reaproveitado | `LojasExemplo` em `commerce-home.tsx` | Só extraído para as duas homes usarem o mesmo bloco; a home atual não mudou na tela. |
| Teste | `tests/ecommerce-home-imersiva.test.ts` | As 18 imagens existem nos 4 formatos; a rota fica atrás da chave e com noindex; a home atual não usa a prévia. |

### Como ver a prévia

```bash
npm run build
EC_HOME_IMERSIVA_PREVIA=true BRAND_DOMAINS_NEXTLEVEL_COMMERCE=localhost npm start -- -p 3100
# abrir http://localhost:3100/previa-home
```

### Copy: cada frase conferida no código

| Frase | Onde o sistema faz isso |
|---|---|
| Produtos com variações, estoque e categorias, sem limite de cadastro; um a um ou por planilha | `PLAN_FEATURES` (catálogo), importação por planilha (`Steps` da home atual) |
| Tema gratuito, editor visual com prévia ao vivo e domínio próprio | `PLAN_FEATURES`, editor de tema |
| Pix e cartão pelo Mercado Pago da loja; 100% das vendas na sua conta | `PLAN_FEATURES` ("você recebe 100% das vendas"), texto do financeiro do lojista |
| Frete por regras próprias ou plataforma de envio, rastreio, mensagem no WhatsApp | `PLAN_FEATURES`, pós-venda (`messageFor`, `whatsappUrl`) |
| Pós-venda, cupons, campanhas, avaliações, equipe com acessos separados | menu do lojista, `PLAN_FEATURES` |
| "N dias grátis", "1º mês por R$ X" | vêm da oferta ativa no Master (`commercePlansView`), nunca fixos |

Nenhuma afirmação nova sobre preço, prazo ou frete foi criada.

## 2. Auditoria (build de produção local, banco de demonstração)

| Item | Resultado |
|---|---|
| Rolagem horizontal | 0 px em 360, 768 e 1440 (com e sem movimento reduzido) |
| Salto de layout (CLS) | 0 em todas as larguras |
| Acessibilidade (axe, WCAG A/AA) | 0 violações em 360 e 1440, com e sem movimento reduzido |
| Lighthouse acessibilidade | 100 (celular e computador) |
| Lighthouse desempenho, computador | 99 (LCP 0,9 s), igual à home atual (99) |
| Lighthouse desempenho, celular | 84 e 91 em duas rodadas (LCP 4,5 s e 3,5 s); home atual 89 e 83 no mesmo servidor. Variação da medição; empate técnico |
| Lighthouse boas práticas / SEO | 79 / 66. Boas práticas igual à home atual (servidor local sem HTTPS); SEO baixo só porque a prévia é `noindex` de propósito |
| Jornada | Os 5 passos trocam certo com a rolagem (360, 768, 1440); régua por teclado leva ao passo; com menos movimento fica tudo parado |
| Foco por teclado | Todos os links e botões com contorno visível; só os links do passo atual recebem foco |
| Composição no computador | Foto e texto sem sobreposição em 1024, 1280, 1440 e 1920 px (48 px de folga) |
| CTAs e links | `/cadastro`, `/cadastro?plano=…`, `/temas`, `/temas/*`, `/login`, `/termos`, `/privacidade`, `/quero-minha-loja`: todos 200. Âncoras `#exemplos`, `#planos`, `#duvidas`, `#jornada` existem |
| Peso das imagens novas | ~190 KB para as 5 fotos da jornada (AVIF), com prioridade baixa para não competir com a foto do topo |

Capturas: `docs/design/capturas/ecommerce-home-imersiva/` (computador-1440, celular-360, tablet-e-movimento-reduzido, imagens-provisorias-18).

### Achados que já existem no site no ar (fora da prévia)

1. **Cabeçalho da E-commerce entre 1024 e 1100 px:** o menu passa da tela (85 px de rolagem lateral em 1024 px, 9 px em 1100 px), na home atual e em qualquer página pública. Correção sugerida: esconder "Soluções" ou reduzir o espaçamento do menu abaixo de 1120 px. Não corrigido aqui (fora do escopo da prévia).
2. **Cartões de tema** (`ThemeGallery`): o nome acessível ("Tema Trama: ver demonstração") não começa com o texto visível; aviso leve do Lighthouse, também na home atual.
3. **Logo do cabeçalho no celular** baixa a versão 2x (90 a 110 KB) mesmo em tela pequena.

## 3. Imagens que exigem substituição (todas as 18)

As 18 são recortes ampliados de um único storyboard. Problemas gerais: detalhe "pintado" típico de ampliação (rostos e tecidos
suaves), **luz de fim de tarde quente/alaranjada** (o briefing pedia dia natural frio + um ponto de luz azul), telas com
pseudotexto ilegível e a **mesma pessoa em quase todas** (bom para a história, mas sem a diversidade pedida nas portas).

| Arquivo | Uso | Problema específico | Prioridade |
|---|---|---|---|
| `ec-jornada-1-produto` (+retrato) | Passo 1 | Ângulo diferente dos outros passos; refletor azul cortado na borda; retrato tinha faixa do storyboard (cortada) | Alta |
| `ec-jornada-2-loja` (+retrato) | Passo 2 | Pessoa de costas; ângulo diferente; faixa lateral do storyboard (cortada, perde 3%) | Alta |
| `ec-jornada-3-pedido` (+retrato) | Passo 3 | **Ícone de coração vermelho estilo rede social** (proibido no briefing); faixa lateral (cortada, perde 5%) | Alta |
| `ec-jornada-4-envio` (+retrato) | Passo 4 | Ângulo diferente; faixa lateral (cortada, perde 6%) | Alta |
| `ec-jornada-5-rotina` (+retrato) | Passo 5 | Telas com pseudotexto; faixa lateral (cortada, perde 5%) | Alta |
| `ec-porta-zero` | Porta 1 | Mesma pessoa escrevendo; não mostra "primeira caixa de peças" do briefing | Média |
| `ec-porta-instagram` | Porta 2 | **Ring light** e pose de influenciadora; sem conversa no celular | Média |
| `ec-porta-migrar` | Porta 3 | Notebook fechado de costas; não mostra "duas janelas/organizar fotos" | Média |
| `ec-porta-fisica` | Porta 4 | Boa (balcão com cliente); só a ampliação | Baixa |
| `ec-temas` | Temas | Pseudotexto nas telas; só notebook e cartões (o briefing pedia notebook + tablet + celular) | Média |
| `ec-planos` | Planos | Notebook sem pessoa (o briefing pedia a dona com caderno) | Média |
| `ec-entrar` | **Não usada** | Celular nas mãos, não o "ateliê à noite" pedido; faixa lateral (cortada, perde 9%). Seria para a tela de entrada, que não foi mexida | Média |
| `ec-fecho` | Chamada final | Pessoa espreguiçando (não a prateleira de sacolas pedida); funciona bem como emoção, mas foge do briefing | Baixa |

Pedido para a próxima geração (no mesmo `ecommerce-home-imersiva-imagens-gpt.md`): uma imagem por vez, nunca storyboard;
**mesmo ângulo nas 5 da jornada**; luz de dia fria com um único ponto azul-ciano; sem ícones de rede social; telas com
blocos abstratos (sem pseudotexto); retrato gerado de verdade (não recorte da paisagem).

## 4. Pendências antes de publicar

1. **Trocar as 18 imagens** por gerações individuais (seção 3) e aprovar uma a uma. Basta salvar com o mesmo nome em PNG e
   rodar `python3 -I scripts/imagens/ec-home-converter.py <pasta-dos-png>` (corta, converte e atualiza
   `ecommerce-home-imagens.ts`); depois trocar `EC_HOME_PROVISORIAS` para `false`.
2. **Aprovar a copy** (seção 1) e decidir se a jornada substitui ou complementa os blocos "Sua loja no ar em três passos",
   "Para quem é", "Venda, receba…" e "Personalização" da home atual (a prévia os retirou; o conteúdo deles está coberto pela
   jornada e pelas portas).
3. **Portas com caminho marcado:** hoje as quatro levam ao mesmo cadastro. Para o cadastro chegar "já sabendo" o caminho
   (ex.: oferecer importação por planilha para quem vem de outra plataforma) é preciso ler um parâmetro no cadastro: decisão
   e tarefa à parte.
4. **`ec-entrar`** pronta para a tela de entrada, mas não ligada (a tela de entrada é compartilhada e não foi mexida).
5. **Corrigir o cabeçalho entre 1024 e 1100 px** (achado da seção 2, vale também para o site atual).
6. Para ligar de vez: trocar `CommerceHome` por `HomeImersivaEc` em `src/app/(portal)/page.tsx` (uma linha) ou criar uma chave
   no Master, registrar a decisão em `docs/design/DECISIONS.md` e só então publicar.
