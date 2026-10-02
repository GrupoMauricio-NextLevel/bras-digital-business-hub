# Home da NextLevel Commerce: super página de vendas (prompt de construção + prompt de ativos)

> 2026-10-03. Substitui o brief anterior da home, que mandava evitar vídeo, movimento e imagens pesadas e produziu uma página correta, porém contida demais. Skill do projeto: `.claude/skills/pagina-de-vendas/SKILL.md`. Estado anterior: `docs/design/HOME-COMMERCE-V1.md` (branch `visual/v4`).

## Por que o resultado não chegou perto (diagnóstico honesto)
1. **Ativos.** A referência tem fotografia e vídeo produzidos, dispositivos renderizados e telas do produto compostas dentro de cenas reais. Usei fotos de banco e molduras de navegador.
2. **Coreografia.** Lá a rolagem conduz: o dispositivo fica fixo e a lista de recursos se acende, a palavra do título alterna, as seções entram em campos de cor. A minha é estática.
3. **Imersão.** Campo de cor cheio, logotipo e título gigantes, vídeo logo abaixo, navegação flutuante. A minha é um documento claro, bem arrumado e contido.
4. **O brief que recebi proibia** vídeo, carrossel, animação e efeitos. Agora muda.
**Conclusão:** só código não chega lá. Precisa de (a) ativos gerados por você, (b) coreografia que eu construo, (c) várias rodadas de conferência visual contra a referência.

## 1. Prompt de construção (colar numa sessão de trabalho)
```
FUNÇÃO
Você é diretor de arte de produto e engenheiro frontend sênior. Use a skill do projeto `pagina-de-vendas` (.claude/skills/pagina-de-vendas/SKILL.md) e siga-a à risca.

OBJETIVO
Reconstruir a home pública da NextLevel Commerce como uma SUPER PÁGINA DE VENDAS de alta tecnologia: imersiva, com movimento guiado pela rolagem e demonstração real do produto. Referência de qualidade: https://www.nuvemshop.com.br/ (use as capturas em docs/design/ref-nuvemshop/ se existirem). Não copie texto, imagem, marca, código ou aparência: copie o NÍVEL de produção e o raciocínio.

MUDANÇA DE REGRAS (substitui o brief anterior)
Agora SÃO permitidos: vídeo otimizado (poster, mudo, lazy, ≤1,5 MB, primeira dobra funcionando sem ele), movimento por rolagem, palavra do título que alterna, dispositivo fixo com lista que se acende, faixas em loop, mosaicos com fotografia. Continua proibido: métrica, logo, depoimento ou cliente inventado; prometer o que não existe; rolagem horizontal; dependência pesada sem justificar.

ESCOPO
Só a home da Commerce (src/components/portal/commerce/*, src/components/portal/commerce-home.tsx). Não mexer em planos, temas, editor, painéis, outras marcas, pagamentos, banco, autenticação, domínios, variáveis de ambiente. Marca via getBrand(); cores via src/lib/brand-palette.ts (--brand-*). Branch: visual/v4 (sem push, deploy ou união sem aprovação do dono).

ENTRADAS
1) Capturas da referência (celular e computador) e minha análise de anatomia.
2) Ativos em public/portal/commerce/v2/ conforme o manifesto (seção 2 deste documento). Se faltarem, use marcador identificado "ativo a fornecer" e liste o que falta; NUNCA preencha com foto de banco, gradiente ou retângulo fingindo produto.
3) Telas reais do produto: gere capturas do editor, do painel de pedidos e da análise de vendas rodando em localhost:3100 (loja de demonstração) e componha-as em dispositivos (tablet e celular) em cenas com fotografia.

ESTRUTURA (cada seção, um campo de cor e uma ideia)
1. Primeira dobra: campo de cor cheio da marca, título enorme dizendo "loja virtual" (uma palavra em destaque que alterna, texto fixo no movimento reduzido), um botão principal + link para vendas, navegação em pílula flutuante, e logo abaixo o vídeo/imagem de abertura com topo arredondado.
2. "Venda onde seu cliente está": mosaico de cartões altos com fotografia e a tela do produto dentro da situação (loja online, Pix e cartão, pedidos). Só canais que existem hoje.
3. Personalização: dispositivo FIXO na tela; à esquerda 3 recursos reais do editor (ajustar textos e cores, adicionar seções prontas, reordenar seções) que se acendem conforme a rolagem e trocam o que o dispositivo mostra.
4. Variedade: 3 lojas de demonstração de segmentos diferentes (temas Starter, Editorial, Signature), identificadas como demonstração.
5. Operação: campo escuro; pedidos, vendas e pagamento, cada um com trecho REAL do painel.
6. Como começar: etapas reais (cadastro por convite hoje).
7. Valores: só os preços dos temas do catálogo (formatBRL) + explicação de que o plano é combinado.
8. Dúvidas (até 5) e chamada final.
Rodapé enxuto, só links existentes.

TEXTO
Português natural, títulos concretos, frases curtas, sem "revolucione", "futuro", "inovador". Sem promessa de resultado. Diferenciar disponível / demonstração / em breve.

REQUISITOS TÉCNICOS
Servidor por padrão; JS só nas interações. Imagem da primeira dobra com prioridade e dimensões reservadas; demais lazy; sem salto de layout. AA de contraste (readableOn), foco visível, teclado, prefers-reduced-motion, 360/768/1440 sem rolagem horizontal. Sem biblioteca nova sem justificar (preferir CSS animation-timeline com alternativa e IntersectionObserver).

CONFERÊNCIA (obrigatória, não declare qualidade porque compilou)
Playwright (playwright-core, Chromium /opt/pw-browsers/chromium; servidor já em localhost:3100, página em /lojas): capturas em 360, 768, 1440, no topo e em 5+ pontos de rolagem, e as interações. Compare lado a lado com a referência e liste as diferenças. Faça no mínimo 3 rodadas de ajuste antes de apresentar. Rode: npx tsc --noEmit; npx eslint src e2e tests; npm run build; node e2e/commerce-home.mjs.

ENTREGA
Caminho para abrir, capturas examinadas, decisões em até 6 tópicos, verificações e limites (o que não foi medido), e UMA pergunta de aprovação ao Mauricio. Depois espere aprovação.
```

## 2. Manifesto de ativos e prompts de geração (você gera; eu consumo)
Pasta: `public/portal/commerce/v2/`. Formatos: JPG/WebP até 350 KB (1600 px de largura) ou vídeo MP4 até 1,5 MB (8 a 10 s, 1280×720, sem áudio, loop). **Sem texto, sem logotipo, sem marca de terceiros nas imagens.** As telas do produto eu componho depois a partir do sistema real.

| Arquivo | Proporção | O que mostra |
|---|---|---|
| `abertura.mp4` + `abertura.jpg` | 16:9 | Mãos organizando pedidos e embalando produtos numa mesa de pequena operação brasileira |
| `cena-moda.jpg` | 4:5 | Lojista de moda no ateliê olhando um tablet (a tela fica para eu compor) |
| `cena-casa.jpg` | 4:5 | Pessoa montando uma vitrine de decoração, tablet sobre a bancada |
| `cena-acessorios.jpg` | 4:5 | Lojista de acessórios embalando um pedido, celular na mão |
| `cena-pix.jpg` | 4:5 | Cliente pagando no celular numa sala iluminada (tela a compor) |
| `produtos-moda-1..4.jpg` | 1:1 | Produto em fundo neutro (peças de roupa, calçado) |
| `produtos-casa-1..4.jpg` | 1:1 | Móveis e objetos de casa em fundo neutro |
| `produtos-acessorios-1..4.jpg` | 1:1 | Bolsas, joias, relógio, fone em fundo neutro |

**Prompt de imagem (colar no GPT ou outro gerador, trocando a linha CENA):**
```
Fotografia editorial realista, luz natural suave de janela, câmera 35 mm, profundidade de campo rasa, cores quentes naturais com pequenos acentos em azul-marinho e amarelo, composição limpa com espaço livre para texto à esquerda. Pessoas brasileiras reais e diversas, expressão natural, sem olhar para a câmera. SEM texto, SEM logotipos, SEM marcas visíveis, SEM telas legíveis (telas desligadas ou vazias). Alta resolução, sem aparência de ilustração ou render 3D.
CENA: [descreva a cena do quadro acima]
Proporção: [4:5, 16:9 ou 1:1]
```
**Prompt de vídeo (Sora, Veo ou similar):**
```
8 segundos, plano fixo levemente lateral, 1280x720, sem áudio, loop suave. Mesa de trabalho de uma pequena operação de e-commerce brasileira: mãos separam produtos, dobram uma peça de roupa, fecham uma caixa de papelão e colam uma etiqueta em branco. Luz natural quente, fundo desfocado de prateleiras organizadas, paleta com azul-marinho e amarelo discretos. Realista, estilo documental publicitário. Sem texto, sem logotipos, sem marcas, sem rostos em destaque.
```
