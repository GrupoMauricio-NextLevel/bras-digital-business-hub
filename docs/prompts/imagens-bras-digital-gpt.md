# Prompt mestre para gerar as imagens da Brás Digital no GPT

> **Para que serve:** dar fotografia de verdade à página pública da Brás Digital (`bras.nextlevelgroup.com.br`), ao cadastro e ao compartilhamento nas redes. Hoje a página funciona sem foto (só ícones e as telas do Meu Brás); cada imagem abaixo **aparece sozinha** quando o arquivo com o nome certo entra na pasta. Sem arquivo, nada quebra.
> **Como usar:**
> 1. Abra um chat novo no GPT com geração de imagens.
> 2. Cole **todo o bloco da seção 3** e diga: "Comece pelo lote 1, imagem 1".
> 3. Salve cada imagem com o **nome exato** que o GPT informar (ex.: `bd-corredor-caixas.png`).
> 4. Traga os arquivos para cá (anexe na conversa ou mande a pasta). Eu converto, coloco em `public/portal/bras/v3/`, confiro nas páginas em celular e computador e publico.
> **Fonte da verdade:** `public/portal/bras/v3/MANIFESTO.md` (lista, proporção, onde aparece). Se surgir imagem nova, ela entra lá e aqui.

---

## 1. O que cada imagem resolve (por que ela existe)

| # | Arquivo | Proporção | Onde aparece | O que precisa comunicar |
|---|---|---|---|---|
| 1 | `bd-corredor-caixas` | 16:9 | "Como funciona", faixa larga acima dos 4 passos | Volume real do Brás: caixas fechadas, ordem, atacado de verdade |
| 2 | `bd-publico-marketplace` | 4:3 | "Para quem": vendedor de Mercado Livre | Quem vende online e compra em caixa para revender |
| 3 | `bd-publico-lojista` | 4:3 | "Para quem": lojista | Loja física de utilidades/variedades abastecida pelo Brás |
| 4 | `bd-publico-distribuidor` | 4:3 | "Para quem": distribuidor de outros estados | Carga saindo do Brás para o Brasil |
| 5 | `bd-importadora-balcao` | 4:3 | Cartão "É importadora no Brás?" | O lado da importadora: balcão, estoque, organização |
| 6 | `bd-retirada-transportadora` | 4:3 | Seção "Seus dados ficam com você" (retirada) | A transportadora do cliente retirando as caixas na porta da importadora |
| 7 | `bd-cadastro-lateral` | 3:4 | Painel escuro ao lado do formulário de cadastro (computador) | Confiança e escala; fica escurecida sob o texto |
| 8 | `bd-og-portal` | 1200×630 | Prévia quando alguém compartilha o link da Brás (WhatsApp, Instagram, Facebook) | Chamar o clique: caixas do Brás, cor da marca, sem texto |
| 9 | `bd-shorts-fundo` | 9:16 | **Não entra no site.** Fundo para o dono montar capas e telas dos Shorts | Textura de marca para vídeo vertical |

Opcional (lote 3): **conceito de logo** da Brás Digital. Serve só de referência para um designer; não entra no sistema sem a sua aprovação (hoje o nome aparece em texto, D79).

---

## 2. Regras (já estão dentro do bloco da seção 3)

- **Fotografia documental**, real, de alta qualidade: nada de ilustração, 3D plástico ou cara de banco de imagem.
- **Sem texto, letra, número ou logotipo** em nenhuma imagem (etiquetas e caixas lisas). O texto vem da página.
- **Sem marca real** (de produto, importadora, transportadora ou loja) e sem fachada identificável.
- **Sem rosto reconhecível e sem criança:** mãos, costas, perfil desfocado, silhuetas.
- **Sem preço** em nenhuma forma (regra da Brás: preço nunca é público).
- **Cenário brasileiro plausível:** Brás, São Paulo (ruas comerciais, galerias, importadoras com caixas de papelão), pequenos estoques e lojas de bairro.
- **Paleta da Brás:** azul-marinho profundo `#101B34`, papel `#F4F1E9`, papelão kraft e **laranja como acento** (`#FB8342` claro, `#B34D00` escuro) em detalhes pequenos (fita, etiqueta lisa, colete, carrinho).
- **Composição:** assunto no centro, 15% de respiro nas bordas (o site recorta para celular).

---

## 3. O PROMPT (copie todo o bloco)

```
PAPEL
Você é diretor de fotografia e de arte de uma plataforma brasileira de atacado chamada Brás Digital. Ela conecta importadoras do Brás, em São Paulo, a lojistas, vendedores de Mercado Livre e distribuidores de todo o Brasil, que compram em CAIXA FECHADA. Vai produzir, em lotes, fotografias editoriais para o site e para as redes. Tudo é fictício.

REGRAS GLOBAIS (obrigatórias em TODA imagem)
1. Fotografia real, documental, de alta qualidade (não ilustração, não 3D, não aparência de banco de imagem). Luz natural ou de galpão, profundidade de campo rasa quando fizer sentido, cores fiéis, grão fino.
2. Nenhum texto, letra, número, preço ou logotipo visível. Caixas de papelão, etiquetas, fitas, coletes e sacolas sempre lisos.
3. Nenhuma marca real: nada de logotipo de produto, importadora, transportadora, aplicativo ou loja. Fachadas não identificáveis.
4. Nenhum rosto reconhecível e nenhuma criança. Use mãos, costas, perfil fora de foco, silhuetas.
5. Telas de celular, tablet ou notebook aparecem LISAS (cinza-azulado neutro) ou totalmente desfocadas. Não desenhe interface.
6. Cenário: Brás, São Paulo, e o Brasil que compra dele. Ruas comerciais movimentadas, galerias, importadoras com caixas de papelão empilhadas, pequenos estoques, lojas de bairro, transportadoras.
7. Paleta: azul-marinho profundo (#101B34), papel off-white quente (#F4F1E9), papelão kraft, concreto e metal de galpão. Acento LARANJA (#FB8342 ou #B34D00) só em detalhes pequenos: uma fita, uma etiqueta lisa, um colete, a alça de um carrinho.
8. Composição com o assunto principal no centro e 15% de respiro nas bordas: as imagens serão recortadas para celular.
9. Entregue UMA imagem por vez, no formato pedido, e informe o nome do arquivo exatamente como listado. Depois de cada uma, pergunte se pode seguir.

LOTE 1 — PÁGINA PÚBLICA (PNG, na proporção indicada)
1. bd-corredor-caixas.png — 16:9 — Corredor estreito de uma importadora no Brás com caixas de papelão fechadas e lacradas empilhadas até o teto dos dois lados, etiquetas brancas lisas, um carrinho de carga com alça laranja parado no meio, luz fria de galpão misturada com luz do dia vinda da porta ao fundo. Sensação de volume, ordem e atacado de verdade.
2. bd-publico-marketplace.png — 4:3 — Bancada de um pequeno estoque em casa: mãos de uma vendedora embalando um produto em saco plástico com etiqueta de envio lisa, caixas de papelão abertas com o mesmo produto ao fundo, notebook de tela lisa fora de foco, luz de janela lateral, fita laranja sobre a mesa.
3. bd-publico-lojista.png — 4:3 — Lojista de uma loja de utilidades e variedades de bairro, de perfil e fora de foco, conferindo o celular de tela lisa entre prateleiras cheias de potes, garrafas térmicas e organizadores sem marca, luz quente, foco nas mãos e no celular.
4. bd-publico-distribuidor.png — 4:3 — Manhã numa rua comercial do Brás: caixas de papelão sendo carregadas num caminhão baú (baú liso, sem marca) na calçada, um carregador de costas empurrando o carrinho, rua movimentada fora de foco.
5. bd-importadora-balcao.png — 4:3 — Balcão de atendimento de uma importadora do Brás visto de lado: pilhas organizadas de caixas fechadas atrás, uma prancheta com folha lisa e uma caneta sobre o balcão, mãos de um funcionário conferindo uma caixa, luz de galpão, detalhe laranja numa fita.
6. bd-retirada-transportadora.png — 4:3 — Porta de uma importadora no Brás: motorista de transportadora (de costas, colete laranja liso) conferindo caixas num carrinho antes de colocar na van, outra pessoa entregando as caixas, rua ao fundo fora de foco. Transmite retirada organizada e segura.

LOTE 2 — CADASTRO E COMPARTILHAMENTO
7. bd-cadastro-lateral.png — 3:4 (vertical) — Vista de cima, em ângulo, de uma rua do Brás ao entardecer com galerias e caixas sendo movimentadas, tons azul-marinho dominantes e luzes quentes laranja nas lojas. Pode ser escura: vai ficar sob um texto branco.
8. bd-og-portal.png — 1200×630 (horizontal, 1,91:1) — Composição forte para prévia de link: pilha de caixas de papelão fechadas, com uma fita laranja, sobre um fundo azul-marinho liso à direita; metade esquerda da imagem com espaço vazio liso em azul-marinho. Sem nenhum texto.

LOTE 3 — APOIO AOS VÍDEOS E MARCA (opcional)
9. bd-shorts-fundo.png — 9:16 (vertical) — Textura de fundo para vídeos verticais: papelão kraft e fita laranja em close, com uma faixa lisa azul-marinho no terço de cima (espaço para o título que o dono vai escrever no editor de vídeo). Sem texto.
10. bd-logo-conceito-1.png, bd-logo-conceito-2.png, bd-logo-conceito-3.png — 1:1 — CONCEITO de símbolo para a marca "Brás Digital" (apenas o símbolo, sem letras): ideia de caixa fechada + seta ou ponto de conexão, geométrico, traço firme, legível em 32 px. Variação 1 em laranja #FB8342 sobre azul-marinho #101B34; variação 2 em azul-marinho sobre papel #F4F1E9; variação 3 monocromática. Fundo liso. (É só referência para um designer.)

Comece pelo LOTE 1, imagem 1. Depois de cada imagem, pergunte se pode seguir para a próxima.
```

---

## 4. Se o GPT errar (peça a correção assim)

- Apareceu texto, número ou logotipo: "Refaça sem nenhum texto, número ou logotipo; caixas e etiquetas lisas."
- Ficou com cara de banco de imagem: "Mais documental: luz natural, sem pose, gente de costas, objetos reais do Brás."
- Rosto aparecendo: "Refaça com a pessoa de costas ou fora de foco; sem rosto reconhecível."
- Laranja demais: "Laranja só em um detalhe pequeno; o resto em azul-marinho, papel e kraft."
- Tela com interface desenhada: "A tela do celular/notebook deve ficar lisa, cinza-azulada."

---

## 5. Depois de gerar (o que eu faço quando você trouxer)

1. Confiro nome, proporção e as regras (sem texto, sem marca, sem rosto).
2. Converto para **AVIF** (qualidade 55) e **WebP** (qualidade 82), largura máxima 1600 px (2400 px para a 16:9), peso alvo até 220 KB; a `bd-og-portal` fica em **PNG/JPG** 1200×630 (as redes não leem AVIF).
3. Coloco em `public/portal/bras/v3/` e atualizo o `MANIFESTO.md`.
4. Confiro a página pública, o cadastro e a prévia de compartilhamento em 360, 768 e 1440 px, sem rolagem lateral e com acessibilidade, e publico.
5. Os conceitos de logo e o fundo dos Shorts não entram no site: ficam em `docs/marca/bras/` para você levar ao designer e ao editor de vídeo.

---

## 6. Checklist de entrega (marque ao trazer)

- [ ] 1 `bd-corredor-caixas`
- [ ] 2 `bd-publico-marketplace`
- [ ] 3 `bd-publico-lojista`
- [ ] 4 `bd-publico-distribuidor`
- [ ] 5 `bd-importadora-balcao`
- [ ] 6 `bd-retirada-transportadora`
- [ ] 7 `bd-cadastro-lateral`
- [ ] 8 `bd-og-portal`
- [ ] 9 `bd-shorts-fundo` (opcional)
- [ ] 10 conceitos de logo (opcional)
