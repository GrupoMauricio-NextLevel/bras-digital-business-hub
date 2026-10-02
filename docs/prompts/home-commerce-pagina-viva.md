# Home da NextLevel Commerce: "A Página Viva" (prompt de engenharia de alto nível)

> **Status: SALVO, NÃO IMPLEMENTADO** (pedido do dono em 2026-10-03: "prompt em código de um engenheiro de alto nível para construir uma página de vendas com uma tecnologia diferente de tudo"). Cole o bloco da seção 2 numa sessão de trabalho. Substitui, em ambição, `home-commerce-super-pagina.md` (que ficou na linha "mesma receita da concorrência, melhor executada"). Skill do projeto: `.claude/skills/pagina-de-vendas/SKILL.md`. Estado de partida: `docs/design/HOME-COMMERCE-V1.md` (home v3: navy + amarelo, lojas de demonstração em molduras, correta e contida, mas **estática**).

## 1. A ideia: a página não descreve o produto, ela É o produto
Nuvemshop, Shopify e wBuy mostram **imagens** de lojas e painéis. Nós temos algo que eles não colocam na home: um motor de lojas e um **editor ao vivo** de verdade. A Página Viva troca imagem por produto rodando:

1. **Loja real dentro do celular.** O dispositivo da primeira dobra contém a vitrine de verdade (motor de temas atual) numa loja de exemplo pública, que o visitante rola, abre produto, escolhe tamanho e põe na sacola. Nada de GIF ou mockup.
2. **O editor de verdade, em 10 segundos.** O visitante digita o nome da loja, escolhe uma cor e um dos temas reais; a vitrine dentro do celular **muda na hora** (mesma ponte de prévia do editor, `PreviewBridge`). Frase de apoio honesta: "É o editor que você vai usar."
3. **Desempenho como prova, medida no aparelho de quem olha.** Um selo mostra o LCP e o CLS **reais daquela visita** (`PerformanceObserver`). Não é número de marketing: é medido ali, na hora, e some se não houver suporte.
4. **Painel real, não ilustração.** As telas do painel nos dispositivos são **capturas e gravações geradas por robô** a partir da conta de demonstração (Playwright), reproduzíveis a cada versão. O produto muda, a home se atualiza sozinha.
5. **Rolagem como direção de cena**, em CSS nativo (`animation-timeline: view()/scroll()`, View Transitions, `@starting-style`): um fio SVG que se desenha ligando as seções até virar a grade de uma vitrine; o dispositivo fixo acende cada recurso conforme a rolagem; palavra do título que alterna.
6. **Simulador de margem honesto:** custo, preço de venda e frete viram margem por pedido. Sem prometer ganho; taxas e planos só entram quando o dono definir (hoje "a definir").

Tudo com **degradação graciosa**: sem JavaScript, sem iframe ou com movimento reduzido, a página continua completa, legível e bonita (imagens estáticas geradas pelo mesmo robô).

## 2. O prompt (colar numa sessão)
```
FUNÇÃO
Você é engenheiro frontend principal (staff) com olho de diretor de arte, especialista em Next.js 16/React 19, CSS moderno e desempenho. O dono, Mauricio, não é técnico: fale em português simples; código, arquivos e commits em português como o projeto já faz. Use a skill do projeto `pagina-de-vendas` à risca e as skills `qa-visual` e `desempenho`.

OBJETIVO
Construir "A Página Viva": a home pública da NextLevel Commerce (lojas virtuais) em que o visitante USA o produto na própria página (loja real num celular, editor ao vivo com temas reais, desempenho medido na visita, painel real em dispositivos, rolagem coreografada). Meta de percepção: ninguém na categoria (Nuvemshop, Shopify, Tray, Loja Integrada, wBuy) mostra isso. Meta de engenharia: mais rápida que todas elas.

LEITURA OBRIGATÓRIA (nesta ordem)
AGENTS.md, CLAUDE.md, node_modules/next/dist/docs/ (cache, metadata, instrumentation-client, view transitions se houver; Next 16 muda APIs: ler antes de codar), docs/prompts/home-commerce-pagina-viva.md (este arquivo), docs/design/HOME-COMMERCE-V1.md, docs/design/DIRECAO-VISUAL-V4.md, src/components/portal/commerce/*, src/components/portal/commerce-home.tsx, src/lib/brand-palette.ts, src/components/storefront/preview-bridge.tsx, src/lib/themes/*, src/app/store/[slug]/layout.tsx, e2e/commerce-home.mjs, docs/design/MEDICAO-DESEMPENHO-2026-10.md.

REGRAS INEGOCIÁVEIS
- Escopo: só a home da Commerce e o que ela precisa (modo "embutido" da vitrine, loja de exemplo, gerador de ativos). Não mexer em planos, preços, pagamentos, painéis, SuperDrop, editor de temas (exceto expor a ponte de prévia a um visitante anônimo SEM permissões), regras de negócio, banco de dados real.
- SuperDrop está em produção: nenhuma mudança de comportamento dele sem teste.
- Verdade: sem métrica, logo, depoimento, cliente ou número de vendas inventado. Tudo que a página mostra ou promete existe no código hoje, rotulado "disponível", "demonstração" ou "em breve". Loja e produtos de exemplo identificados como EXEMPLO.
- Sem promessa de ganho. Preços em centavos. Cores via --brand-* (brand-palette). Marca via getBrand(). Texto em português claro.
- Segurança: a loja de exemplo é pública e NÃO tem login utilizável (dono com acesso encerrado, `users.disabledAt`), NÃO aceita pedido de verdade (createOrder recusa; o botão de compra no modo embutido diz "demonstração"), não grava dado de visitante, nunca expõe dado de outra loja. O iframe usa `sandbox` mínimo e a página aceita mensagens só da própria origem (postMessage com checagem de origin e esquema fechado de mensagens, validado com Zod).
- Orçamento (falha de verificação se estourar): LCP ≤ 1,8 s em celular simulado 4G; CLS 0; JavaScript da primeira carga da home ≤ 90 KB gzip (cada efeito novo justifica o peso); imagens da primeira dobra ≤ 150 KB; o iframe/loja só carrega quando ocioso ou na primeira interação; vídeo só com poster, mudo, lazy, ≤ 1,5 MB e a primeira dobra completa SEM ele; Lighthouse mobile ≥ 90 em desempenho e 100 em acessibilidade; axe sem violação grave; sem rolagem horizontal em 360 px.
- Acessibilidade AA: foco visível, teclado completo, contraste via readableOn, `prefers-reduced-motion` desliga todo movimento e mantém conteúdo, controles do celular embutido com rótulo e saída fácil do "foco preso", texto alternativo real.
- Sem biblioteca nova sem justificar peso e benefício; preferir CSS nativo e Web APIs. Sem push/deploy sem o dono aprovar uma etapa. Nunca force push.

FASE P0. DIAGNÓSTICO COM EVIDÊNCIA (1 documento curto, nada de código)
1. Capture com Playwright (360, 768 e 1440; topo + 5 pontos de rolagem) a home atual e 6 referências públicas: Nuvemshop, Shopify, e 4 páginas conhecidas por técnica de produto (por exemplo Linear, Vercel, Stripe, Apple). Analise padrões e técnica, nunca copie texto, imagem, marca ou código. Se o Chromium recusar certificados de sites externos, use curl para HTML/CSS e registre a limitação (NUNCA desligar a verificação TLS).
2. Tabela por seção: campo de cor, composição, ativo, movimento, pergunta do visitante que responde, CTA.
3. Liste o que a nossa v3 faz bem (manter) e o que é estático ou "cara de IA" (trocar).
4. Mostre ao dono 6 capturas lado a lado e UMA pergunta: aprova a direção da seção 3?

FASE P1. LOJA DE EXEMPLO E MODO EMBUTIDO
- Loja de exemplo pública e permanente em produção (slug fixo, ex.: "exemplo-moda"), criada pelo bootstrap de forma idempotente, com produtos fictícios, fotos próprias do repositório e dono com acesso encerrado. Bloqueio de pedido no domínio (teste que prova), e de edição.
- Modo embutido da vitrine (`?embed=1`): sem banners de prévia/teste, sem rastreamento, sem links para fora do exemplo, cabeçalhos que permitam o iframe SÓ para a home da Commerce (`frame-ancestors`), cache curto.
- Testes: pedido na loja de exemplo é recusado; o modo embutido não vaza dado de outra loja; o iframe não carrega sem permissão de origem.

FASE P2. EDITOR AO VIVO NA PÁGINA
- Reaproveitar a ponte de prévia do editor para um visitante anônimo: ele só envia (nome da loja, cor primária/de destaque, tema entre os instaláveis, 2 a 3 interruptores de seção) e a vitrine embutida aplica em memória; nada é salvo. Esquema de mensagem fechado (Zod), limites de tamanho, taxa.
- Botão "Quero esta loja" leva ao cadastro já com a escolha (tema e cor) como sugestão, sem criar nada antes do cadastro.
- Fallback: sem JavaScript ou iframe, mostrar 3 capturas estáticas dos temas.

FASE P3. ATIVOS GERADOS POR ROBÔ (scripts/gerar-ativos-home.mjs)
- Playwright sobe a demonstração, loga na conta de demonstração e gera: capturas do painel (início, pedidos, catálogo, cupons, atacado) em 2x, recortadas sem dado real, e uma gravação curta (WebM → MP4/WebM ≤ 1,5 MB, 8 a 12 s) da jornada "compra → expedição". Saída em public/portal/commerce/v2/ com manifesto (nome, proporção, peso, o que mostra). AVIF/WebP com dimensões reservadas.
- Teste de contrato: o manifesto bate com os arquivos; pesos dentro do orçamento.
- O dono só precisa fornecer (opcional) fotografia de direção de arte para as seções emocionais; sem ela, a página usa as fotos próprias já existentes e marca claramente onde entraria a fotografia.

FASE P4. ESTRUTURA, NARRATIVA E COREOGRAFIA
- Roteiro curto (seção → dúvida do visitante → mensagem → evidência → ação). Sugestão: (1) promessa + loja viva no celular; (2) editor ao vivo; (3) vender em todo lugar (loja, WhatsApp, Instagram, propostas, cupons, atacado) com o painel real; (4) operação simples (pedido → etiqueta → envio, equipe, avaliações) com a gravação; (5) prova de velocidade medida na visita; (6) simulador de margem; (7) como começar e planos (só o que existe, preços como estão no sistema); (8) perguntas e respostas; CTA fixo no celular.
- Coreografia em CSS nativo: fio SVG que se desenha com a rolagem (`animation-timeline`), dispositivo fixo com lista que se acende (scroll-spy com IntersectionObserver), palavra do título que alterna, transições entre seções (View Transitions quando houver suporte), campos de cor imersivos com topo arredondado. Tudo com alternativa sem suporte e sem movimento.
- Tipografia com personalidade: uma família variável autohospedada (licença livre), subset latino, `font-display: swap`, ≤ 60 KB.

FASE P5. MEDIÇÃO NA VISITA E SIMULADOR
- Selo de desempenho: LCP/CLS reais da visita via PerformanceObserver, com texto honesto ("medido neste aparelho, agora"); some se não houver dado. Nada é enviado a servidor.
- Simulador de margem: custo, preço, frete → margem por pedido e por mês para N pedidos; sem taxa de plano até o dono definir; aviso "simulação, não promessa".

FASE P6. CONFERÊNCIA (mínimo 3 rodadas)
- Playwright em 360/768/1440, topo + 6 pontos de rolagem, interagindo (celular embutido, editor ao vivo, menu, simulador, teclado). Lado a lado com as referências da P0 e lista de diferenças; corrigir; repetir.
- Lighthouse mobile e desktop com a skill desempenho (antes/depois), axe, sem rolagem horizontal, movimento reduzido, sem JavaScript.
- npx tsc --noEmit; npx eslint src e2e tests; testes que mudou; npm run build. Registrar decisões em docs/design/DECISIONS.md (próxima numeração) e atualizar HOME-COMMERCE com a v4.

ENTREGA (ao fim de cada fase)
Caminho para abrir, capturas examinadas, o que mudou em português simples, o que foi e o que NÃO foi medido, o que depende do dono, UMA pergunta de aprovação. Espere o OK antes da próxima fase. Sem push nem deploy sem aprovação.

FORA DE ESCOPO
Outras marcas, painéis, planos e preços, pagamentos, nota fiscal, e-mail, regras de negócio, novos produtos, bibliotecas pesadas de animação ou 3D (se achar que WebGL se justifica, proponha com medição de peso e fallback antes de usar).
```

## 3. O que depende do dono
1. **Aprovar a direção** ao fim da P0 (6 capturas lado a lado).
2. **Loja de exemplo em produção:** concordar que exista uma loja pública fictícia permanente (sem login utilizável e sem pedido).
3. **Fotografia de direção de arte** (opcional): se quiser o nível "campanha", enviar ou gerar com `docs/prompts/imagens-temas-gpt.md`; sem ela a página usa o acervo próprio e sinaliza o espaço.
4. Licença da fonte escolhida (propor 2 opções livres e pedir o OK).

## 4. Por que isso é "diferente de tudo"
Concorrentes vendem a loja com **fotos de loja**. Aqui o visitante **mexe numa loja de verdade e no editor de verdade**, vê a **velocidade medida no próprio aparelho** e o **painel real** (capturas feitas por robô, sempre atuais). É mais honesto, mais rápido e impossível de copiar só com design, porque depende do motor que já construímos.
