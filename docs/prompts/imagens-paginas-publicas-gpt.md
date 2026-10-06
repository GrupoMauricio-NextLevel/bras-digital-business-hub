# Prompt para gerar as imagens das páginas públicas (SuperDrop e NextLevel Commerce) no GPT

> **Para que serve:** enriquecer as páginas públicas de superdrop.com.br e lojas.nextlevelgroup.com.br com fotografia de direção de arte. As páginas já reservam o espaço de cada imagem com o aviso "Imagem em criação" (componente `ImagemEmCriacao`, fase 5 de `docs/prompts/auditoria-dono-paineis-e-paginas.md`). Quando o arquivo com o nome certo entra na pasta, a imagem aparece sozinha.
> **Como usar:** abra um chat novo no GPT com geração de imagens, cole **todo o bloco da seção 2** e diga "Comece pelo lote SuperDrop". Salve cada imagem com o **nome exato** indicado. Depois traga os arquivos: eu converto (seção 3), coloco em `public/portal/<marca>/v3/` e confiro nas páginas.
> **Lista final:** o manifesto de cada marca (`public/portal/superdrop/v3/MANIFESTO.md` e `public/portal/commerce/v3/MANIFESTO.md`) é a fonte da verdade. Se a página pedir uma imagem nova, ela entra no manifesto e neste prompt.

## 1. Regras (já estão dentro do bloco)
- Sem texto, letras, números ou logotipos dentro da imagem (o texto real vem da página).
- Sem marcas reais, clubes reais ou estampas reconhecíveis.
- Sem rosto reconhecível e sem crianças: mãos, costas, recortes, silhuetas fora de foco.
- Telas de computador e celular aparecem **lisas ou desfocadas**: a interface real do sistema é colocada por cima pela página.
- Paleta coerente com o sistema de cores v2: navy #101B34 e off-white #F4F1E9 como base; detalhe verde (#2D9E3B) nas cenas SuperDrop e azul (#2F81F4) nas cenas Commerce; amarelo #F5BC00 só como pequeno acento.
- Assunto principal no centro, com respiro nas bordas (recortes para celular).

## 2. O PROMPT (copie todo o bloco)

```
PAPEL
Você é diretor de arte de uma agência que cria páginas de produto para plataformas de e-commerce brasileiras. Vai produzir, em lotes, fotografias editoriais para duas marcas do grupo NextLevel: SuperDrop (lojas online sem estoque, fornecedores que separam e enviam) e NextLevel Commerce (plataforma de lojas virtuais da própria marca do lojista). Tudo é fictício.

REGRAS GLOBAIS (obrigatórias em TODA imagem)
1. Nenhum texto, letra, número ou logotipo visível. Caixas, etiquetas, sacolas e roupas lisas.
2. Nenhuma marca real, nenhum clube real, nenhuma estampa reconhecível.
3. Nenhum rosto reconhecível e nenhuma criança. Use mãos, costas, recortes na altura do ombro, silhuetas desfocadas.
4. Telas de notebook, celular e tablet aparecem com a tela LISA (cinza-azulado neutro) ou totalmente desfocada; não desenhe interface.
5. Fotografia real de alta qualidade (não ilustração, não 3D plástico), luz natural suave ou de estúdio, profundidade de campo rasa, cores fiéis, grão fino.
6. Paleta: base navy profundo (#101B34) e off-white quente (#F4F1E9), madeira clara e papel kraft. Acento da marca: VERDE (#2D9E3B) nas imagens SuperDrop, AZUL (#2F81F4) nas imagens Commerce, em objetos pequenos (fita, etiqueta lisa, caneca, detalhe de roupa). Amarelo (#F5BC00) só como detalhe mínimo.
7. Composição com o assunto no centro e 15% de respiro nas bordas; as imagens largas serão recortadas para celular.
8. Cenário brasileiro plausível: pequena empresa, ateliê, estoque de fornecedor, comércio de moda do Brás, home office.
9. Entregue UMA imagem por vez, no formato pedido, e informe o nome do arquivo exatamente como listado.

LOTE SUPERDROP (formato: proporção indicada, PNG)
sd-hero-fornecedor-separando.png — 16:9 — mãos separando peças de roupa dobradas em caixas kraft numa bancada de expedição organizada; fita verde; luz da manhã.
sd-hero-celular-venda.png — 4:5 — mão segurando celular de tela lisa sobre uma mesa com café e sacola de envio; notificação imaginária sugerida só pela luz da tela.
sd-expedicao-esteira.png — 16:9 — prateleiras de estoque de fornecedor com caixas padronizadas e etiquetas lisas, carrinho, chão limpo; ritmo e ordem.
sd-etiqueta-impressora.png — 4:3 — impressora térmica soltando etiqueta lisa, mãos com luva fina, rolo de fita verde.
sd-lojista-home-office.png — 16:9 — lojista de costas trabalhando no notebook de tela lisa, sala clara, plantas, caixa de produto ao lado.
sd-pix-pagamento.png — 1:1 — celular de tela lisa sobre bancada com maquininha desligada e comprovante dobrado sem texto; sensação de pagamento instantâneo.
sd-fornecedor-parceiro.png — 3:2 — aperto de mãos sobre bancada de estoque, pilhas de peças dobradas, fundo desfocado.
sd-pacote-entregue.png — 4:5 — caixa kraft fechada com fita verde na porta de um apartamento, luz de fim de tarde.
sd-textura-fundo.png — 21:9 — textura abstrata de papel kraft e tecido navy, para fundo de seção.

LOTE COMMERCE (formato: proporção indicada, PNG)
cm-hero-marca-propria.png — 16:9 — ateliê de moda com araras, peças dobradas com etiqueta lisa e sacolas off-white; notebook de tela lisa aberto; detalhe azul.
cm-hero-celular-vitrine.png — 4:5 — mão segurando celular de tela lisa diante de uma arara de roupas desfocada.
cm-catalogo-fotografia.png — 3:2 — mini estúdio caseiro fotografando uma peça em manequim invisível, luz de softbox, celular no tripé.
cm-checkout-cartao.png — 1:1 — mãos com cartão sem números próximo a notebook de tela lisa, xícara azul.
cm-pedido-embalado.png — 4:5 — sacola off-white de loja própria com papel de seda azul, sobre mesa de madeira.
cm-dono-gestao.png — 16:9 — pessoa de costas analisando um monitor de tela lisa num escritório pequeno e organizado, quadro com notas sem texto.
cm-temas-ambiente.png — 21:9 — três ambientes de loja (moda, acessórios, casa) lado a lado, mesma luz, para ilustrar estilos de tema.
cm-equipe-atendimento.png — 3:2 — duas pessoas de costas conferindo pedidos em tablet de tela lisa, estoque leve ao fundo.
cm-textura-fundo.png — 21:9 — textura abstrata de tecido azul profundo e papel off-white, para fundo de seção.

Comece pelo LOTE SUPERDROP, imagem 1. Depois de cada imagem, pergunte se pode seguir para a próxima.
```

## 3. Depois de gerar
- Converter para WebP (qualidade 82) e AVIF (qualidade 55), mantendo o nome; largura máxima 2400 px (as 21:9) e 1600 px (as demais).
- Pastas: `public/portal/superdrop/v3/` e `public/portal/commerce/v3/`.
- Peso alvo: até 250 KB cada em WebP (hero até 350 KB).
- Conferir nas páginas em 360, 768 e 1440 px; o aviso "Imagem em criação" some quando o arquivo existe.
