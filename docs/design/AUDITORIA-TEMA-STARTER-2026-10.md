# Auditoria do tema gratuito (Starter), 2026-10-03

**Como medi:** versão de produção (`next build` + `next start`) com a loja de demonstração "Fio & Linha" (tema Starter), Lighthouse em celular simulado (rede lenta), Playwright em 390 e 1440 px e leitura do código. **Limites:** a demonstração usa ilustrações no lugar de fotos de produto, então peso e deslocamento de layout de **fotos reais** não foram medidos; a medição é local (sem rede de verdade); o Lighthouse simulado é mais severo que um celular médio.

## Nota geral
**Base técnica sólida, camada de crescimento ausente.** Para um tema gratuito de entrada está acima da média; para competir com Shopify/Nuvemshop em busca do Google e imagens, está abaixo.

| Lighthouse (celular simulado) | Nota |
|---|---|
| Desempenho | 94 |
| Acessibilidade | 96 |
| Boas práticas | 100 |
| SEO básico | 100 |

## O que está bom (medido)
- 302 KiB transferidos na home; servidor responde em 70 ms; texto na tela em 0,9 s (FCP); bloqueio de interação 70 ms; CLS 0 na home, catálogo e produto; sem rolagem horizontal em 390 e 1440 px.
- Página renderizada no servidor, idioma `pt-BR`, `theme-color`, título, descrição e Open Graph na loja; 1 título principal por página (exceto checkout); todas as imagens têm texto alternativo.
- Plataforma por baixo do tema (vale também no Starter): cupom de desconto, preço por quantidade, pedido mínimo, avaliações com compra verificada, "Avise-me", proposta por link, acompanhamento do pedido.

## O que está fraco (por prioridade)
1. **Imagens (maior risco com fotos reais):** `<img>` sem largura e altura reservadas, sem versões por tamanho de tela, sem conversão para formato leve e sem prioridade para a primeira. O envio é reduzido no navegador do lojista, mas depende dele. Risco de página lenta e de saltos de layout.
2. **Busca do Google:** sem `canonical`, sem dados estruturados de produto (preço, estoque, nota das avaliações aprovadas), sem `sitemap.xml` e `robots.txt` por loja; título e descrição da **página de produto** sem descrição própria, e títulos de catálogo/carrinho/checkout iguais ao da loja.
3. **Salto de layout no carrinho (0,146) e no checkout (0,258)**, medidos no navegador: acima do limite bom (0,1); o checkout ainda não tem título principal (`h1`).
4. **Texto principal demora a aparecer (LCP 3,0 s no celular simulado):** o maior elemento é o título da home e ele só pinta ~1,2 s depois do primeiro byte (espera de estilo, fonte ou animação de entrada). Meta: abaixo de 2,5 s.
5. **Cache:** as páginas públicas das lojas saem com `no-store` (sempre dinâmicas), o que impede o retorno instantâneo do botão "voltar" e deixa a página mais lenta do que precisa. É a fase A6 do plano de proteção da produção.
6. **Contraste (1 item, em todas as páginas):** o texto "Tecnologia ... NextLevel" do rodapé (cinza claro sobre fundo claro). Correção de uma linha.
7. **Peso do JavaScript:** ~577 KB sem compressão (≈ metade comprimida) carregados em todas as páginas, inclusive o carrinho inteiro na vitrine. Aceitável hoje, mas é o primeiro ponto a otimizar depois das imagens.
8. Sem manifesto de aplicativo (instalar na tela inicial), sem busca com sugestões e sem compra rápida: estes ficam nos temas pagos (Arena e Signature) por decisão de produto.

## O que o Starter tem de recursos (código)
Destaque, faixa de confiança, categorias, vitrine, banners, texto "Sobre", grade de produtos; produto com galeria de miniaturas; catálogo com busca e categorias; carrinho e checkout; cores, fontes e textos personalizáveis. Apresentação de slides, contagem regressiva, perguntas frequentes com dados estruturados, WhatsApp flutuante e compra rápida são dos temas pagos.

## Correções rápidas recomendadas (1 a 2 horas de trabalho, sem mudar aparência)
Contraste do rodapé · títulos e descrições por página · `canonical` · dados estruturados de produto e da loja · `sitemap.xml`/`robots.txt` por loja · `h1` no checkout · reservar espaço no carrinho/checkout · largura e altura nas imagens com prioridade na primeira.
## Depois (mais trabalho, maior ganho)
Reduzir e converter imagens no servidor (já temos a biblioteca `sharp`) com versões por tela · cache com renovação curta e invalidação quando o lojista publica ou muda preço (A6) · investigar o atraso do título principal.
