# Plano: levar o padrão imersivo (Soluções e E-commerce) a todas as marcas e painéis

> 2026-10-17. Base: `padrao-nextlevel-todas-marcas.md` (régua, regras sem vazamento, fases A a E) e D162, D164, D165.
> Fases A e B (varredura e vazamentos) feitas em todas as marcas. Este arquivo organiza as fases C, D e E.

## 1. Ideia central: uma peça, várias marcas

A página imersiva virou uma peça única do sistema (`src/components/imersiva/`):
- `jornada.tsx` (`JornadaMarca`): a foto presa na tela trocando com a rolagem, régua por teclado, versão parada para
  "menos movimento".
- `foto.tsx` (`FotoImersiva`): AVIF/WebP em duas larguras, cor de fundo enquanto carrega, versão em pé no celular.
- `imersiva.css`: lê só variáveis neutras `--im-*`; cada marca preenche com as suas cores em `.im-tema-<marca>`
  (já existem `.im-tema-ecommerce` e `.im-tema-bras`).
- `src/lib/imersiva/acervo.ts` + `scripts/imagens/imersiva-converter.py`: as fotos de cada marca viram um "acervo".

Cada marca nova entra com **cores + copy + fotos**; o código da jornada, das portas e das seções é o mesmo.

## 2. As quatro etapas de cada marca

1. **Identidade (fase C):** arquivo único da marca em `src/lib/marcas/<marca>.ts` (cores, logos, ícones, variáveis CSS),
   tema com contraste AA, nenhum hexadecimal solto.
2. **Fotos (fase D):** pedido para o GPT no formato da E-commerce v2 (`ecommerce-fotos-v2-personagens-gpt.md`): elenco
   real e diferente ligado ao público da marca, regra da tela, uma foto por vez, conferência antes de salvar.
3. **Página (fase D):** jornada de 5 passos, 4 portas, seções de conversão, copy só do que o sistema faz.
4. **Conferência e publicação:** `scripts/auditoria/marca.mjs` (sem vazamento), e2e em computador/tablet/celular e
   menos movimento, axe, Lighthouse; publicar marca por marca.

## 3. Ordem e situação

| # | Marca | Hoje | Falta |
|---|---|---|---|
| 0 | NextLevel E-commerce | Home imersiva no ar (D165); 5 fotos trocadas por erro de IA | Novo grupo de fotos (v2, personagens diferentes) |
| 1 | SuperDrop | Produção com clientes; home v4 com fotos; logo SVG antiga; amarelo antigo no tema | Identidade, decisão do dono sobre a logo, fotos, jornada (com cuidado: tem clientes) |
| 2 | Brás Digital Club | Identidade pronta (D158), tema `.im-tema-bras` pronto | Fotos e jornada |
| 3 | NextLevel Cargas | Cores no CSS da página, só logo clara, sem foto na entrada | Identidade, logo escura, fotos, jornada |
| 4 | Família (Club, Loja NextLevel, Meu Contador, Parceiros) | Kits no amarelo antigo | Kits (`kit-marcas-gpt.md`) |

## 4. Painéis (fase E), em paralelo e sem depender de fotos

A primeira tela de cada login responde "o que eu preciso fazer agora?": fila do dia com botão de ação, pulso da
operação, números com "e daí?". Como os painéis usam a mesma casca, cada melhoria vale para todas as marcas.
Ordem: lojista (E-commerce e SuperDrop) → fornecedor e expedição → membro e importadora do Brás → transportadora →
Master.

## 5. O que depende do dono

- Fotos de cada marca (pelos pedidos que eu escrever).
- SuperDrop: manter a logo atual ou fazer kit novo.
- Kits da família.
- GitHub: regularizar o pagamento da conta (a verificação automática está parada desde 08/10).
