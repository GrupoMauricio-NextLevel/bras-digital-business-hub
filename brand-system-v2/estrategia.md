# Estratégia de cor do ecossistema NextLevel · v2

Proposta para aprovação. Não altera as logos oficiais do kit v1: só o preenchimento do raio recebe a cor de cada marca. Letras, proporções, raio e monogramas são cópias exatas dos vetores do kit (conferido automaticamente: os contornos `d=` dos SVGs são idênticos aos originais).

## 1. Diagnóstico das logos oficiais (kit v1)

**O que funciona**
- Família clara: lettering robusto e inclinado, raio integrado cortando o nome e monograma de duas letras com o raio no meio. As quatro marcas são reconhecidas como irmãs à primeira vista.
- Descritores (SOLUÇÕES DIGITAIS, COMMERCE, HUB) em caixa alta espaçada criam uma segunda leitura hierárquica abaixo do nome, legível a partir de cerca de 240 px de largura da assinatura.
- Monogramas (NL, SD, CH) com boa massa, adequados para avatar e menu recolhido.

**Falhas observadas** (vistas em renderização ampliada, não opinião estética)
1. **Duas marcas com o mesmo ícone.** NextLevel Soluções Digitais e NextLevel Commerce têm o mesmo monograma NL e o mesmo favicon. Em abas do navegador, avatares e menu recolhido, era impossível distinguir as duas. *Resolvido nesta proposta pela cor do raio (amarelo × azul); continue usando títulos de página distintos.*
2. **O raio desaparece no favicon claro.** O amarelo #F5BC00 sobre off-white tem contraste de 1,54:1; a 16 px o raio vira uma mancha quase invisível. *Nas marcas de produto a nova cor do raio tem ≥3:1 contra o off-white; para o grupo, a versão escura do favicon é a recomendada.*
3. **Serrilhado nos contornos.** Os vetores do kit foram traçados automaticamente só com retas e coordenadas inteiras. Acima de ~1200 px aparecem degraus verticais nas hastes inclinadas (lado direito do D de SuperDrop, o l final de Level) e pequenas lascas no corte do raio (perto do pé do L em NextLevel/Commerce) e esporas mínimas no r e no s de Creators e SuperDrop. Invisível em tamanhos de interface (≤ 640 px); visível em impressão grande e telas de abertura. *Não corrigido aqui, porque redesenhar contornos está fora do escopo. Recomendação: redesenho manual com curvas Bézier a partir das referências oficiais, por um designer, antes de material impresso grande.*
4. **Monograma pequeno no favicon.** O monograma ocupa cerca de 78% da largura do ícone, com margem de 11% (definida no kit). A 16 px as letras ficam borradas; é uma redução óptica natural, não um erro do arquivo. As margens foram preservadas, como pedido.

**Preferências (não são falhas):** o amarelo único em todas as marcas reforçava o grupo, mas apagava a diferença entre produtos; isso motivou o sistema abaixo.

## 2. Mapa das marcas

| Marca | Papel | Status |
|---|---|---|
| NextLevel Soluções Digitais | Marca central (holding NextLevel Marketing Ltda) | Oficial |
| NextLevel Commerce | Motor de catálogo, pedidos e checkout | Oficial |
| SuperDrop | Distribuição e dropshipping | Oficial |
| Creators Hub | Campanhas, produtos, links e comissões dos creators | Oficial |
| NextLevel Play | Feed, lives e compras | Planejada, sem logo oficial |
| China Hub | Fornecedores e importadores | Planejada, sem logo oficial |
| Brás Digital | Ecossistema comercial do Brás | Planejada, sem logo oficial |

## 3. Sistema escolhido: neutros compartilhados + um raio por marca

**Parentesco** vem do que todas compartilham: navy #101B34, off-white #F4F1E9, o desenho das letras, o raio e as regras de aplicação (superfícies neutras, cor só em pontos de ação e identidade).

**Diferença** vem de um único elemento: **o raio**. É o preenchimento que já existe em todas as logos (hoje #F5BC00), então nenhuma forma muda. Na logo, no monograma e no favicon, o raio de cada marca tem a cor de assinatura dela.

**O amarelo** continua sendo do grupo: é a assinatura de NextLevel Soluções Digitais e a cor da identidade corporativa (rodapé “uma empresa NextLevel”, materiais institucionais, Master). Nenhum produto usa amarelo como cor principal.

### As sete cores

| Marca | Cor | Assinatura | OKLCH | Elemento que recebe a cor |
|---|---|---|---|---|
| NextLevel Soluções Digitais | Amarelo NextLevel | #F5BC00 | 82,4% 0,169 86,5 | raio da logo e do monograma (oficial, inalterado) |
| NextLevel Commerce | Azul Commerce | #2F81F4 | 61,6% 0,190 257,9 | raio |
| SuperDrop | Verde SuperDrop | #2D9E3B | 61,6% 0,171 145,0 | raio |
| Creators Hub | Magenta Creators | #D44790 | 61,5% 0,190 352,2 | raio |
| NextLevel Play | Violeta Play | #A15EDD | 61,4% 0,190 305,9 | reservado ao raio da futura logo |
| China Hub | Jade China Hub | #00979D | 61,5% 0,104 199,8 | reservado ao raio da futura logo |
| Brás Digital | Laranja Brás | #D35C00 | 61,5% 0,170 47,1 | reservado ao raio da futura logo |

### Por que essas cores (composição e papel, não “psicologia”)

- **Mesma luminosidade, matizes espaçados.** As seis cores de produto têm a mesma luminosidade (L ≈ 61,5% em OKLCH) e croma alto e parecido. Ficam com o mesmo “peso” ao lado do navy; nenhuma marca grita mais que outra. O jade tem croma menor (0,104) porque é o máximo que o sRGB permite nesse matiz e luminosidade.
- **Faixa de luminosidade calculada para o raio.** Com L ≈ 61,5%, a mesma cor tem ≥3:1 contra o off-white e ≥4,1:1 contra o navy. O raio fica visível nos dois fundos oficiais sem trocar de cor. No escuro, a logo usa um passo mais claro da mesma família (400) para ter o brilho do amarelo original.
- **O círculo de matizes segue o mapa do negócio.** O lado de abastecimento fica nos verdes (SuperDrop 145° e China Hub 200°, vizinhos e distintos: os dois trazem produto para dentro). O motor fica no azul (Commerce 258°). O lado do público fica nos roxos e rosas (Play 306° e Creators 352°, vizinhos: audiência e conteúdo). O varejo de rua fica no laranja (Brás 47°). O círculo fecha no amarelo do grupo (86°), de onde saiu o raio.
- **Distância mínima garantida.** Nenhuma dupla de assinaturas fica a menos de ΔE OK 0,14 (superdrop × china hub: 0,140; creators × play: 0,149; commerce × play: 0,154). Para comparação, 0,02 já é diferença perceptível; 0,14 é uma diferença evidente lado a lado e em avatares.
- **Vermelho fica livre para o erro.** Nenhuma marca é vermelha; o vermelho é só do estado de erro.
- **Continuidade com o que já está no ar.** O azul Commerce e o verde SuperDrop são da mesma família das cores já usadas nos painéis (#2557DA e #127A44), só ajustados para a escala comum.

## 4. Escalas e papéis

Cada marca tem uma escala de 11 passos (50 a 950) em OKLCH com matiz fixo; o amarelo do grupo é ancorado no oficial (#F5BC00 = passo 400) e desce para âmbar/bronze sem esverdear. Os papéis de interface são escolhidos por cálculo de contraste, não à mão (detalhes em `paletas.json` → `origem_dos_papeis`).

| Papel (token) | Claro | Escuro |
|---|---|---|
| `--brand-primary` botão principal | passo 600 (amarelo: 400) | passo 400 |
| `--brand-on-primary` texto do botão | branco (amarelo: navy) | navy |
| `--brand-hover` / `--brand-active` | um e dois passos mais escuros | 300 / 400 escurecido até manter 4,5:1 |
| `--brand-soft` / `--brand-soft-strong` | 100 / 200 | mistura de 20% / 32% da cor com a superfície navy |
| `--brand-text` / `--brand-on-soft` links, item ativo | primeiro passo com ≥4,5:1 em todos os fundos (600–800) | 400 |
| `--brand-indicator` barra ativa, seleção, progresso | primeiro passo com ≥3:1 (500–600) | 400 |
| `--brand-mark` cor do raio | 500 (amarelo: oficial) | 400 (amarelo: oficial) |
| `--focus-ring` anel de foco | igual ao indicador | igual ao indicador |

Neutros por tema: `--canvas`, `--surface`, `--surface-2`, `--text-primary`, `--text-secondary`, `--border`, `--border-strong`, `--overlay`. No claro a base é off-white com superfícies brancas e texto navy; no escuro, a superfície é o próprio navy oficial e o texto é off-white.

## 5. Regras de uso

1. **Superfícies neutras primeiro.** Página, cartões, tabelas e menus usam os neutros. A cor da marca aparece em: botão principal, item ativo do menu (fundo suave + barra), seleção em formulários e checkout, links, anel de foco, raio da logo. Não pinte áreas grandes com a cor de assinatura (exceção: peças de campanha e tela de abertura).
2. **Um botão principal por área.** Ações secundárias usam borda neutra (`--border-strong`).
3. **Amarelo no claro não é texto.** Para links e textos da marca do grupo no claro use `--brand-text` (bronze #7B4C00). O botão amarelo tem rótulo navy; em chips e campos amarelos acrescente borda `--brand-indicator`.
4. **Estados não são marca.** Sucesso, alerta, erro e informação usam os tokens `--success`, `--warning`, `--danger` e `--info` (iguais em todas as marcas) e **sempre** têm ícone e texto. Isso evita ler um selo verde de “pago” como “SuperDrop” ou um aviso azul como “Commerce”.
5. **Mesma família nos dois temas.** No escuro a marca clareia (passo 400), mas nunca troca de cor.
6. **A identidade não depende só da cor.** Nome, descritor e monograma identificam a marca; a cor é reforço. Em especial, NextLevel e Commerce compartilham o monograma NL: mantenha títulos de página, nomes de app e descritor distintos.
7. **Logo sobre fundo médio** (cinzas, fotos): use a versão monocromática branca ou preta em vez da colorida.
8. **Marcas planejadas** só ganham logo quando houver arquivo oficial; até lá aparecem com o nome em texto e a cor proposta, identificadas como proposta.

## 6. Relação entre grupo e produtos

- O grupo assina por baixo: “uma empresa NextLevel” com o raio amarelo no rodapé e nos documentos.
- Cada produto assina por cima: a interface e a logo do produto usam a cor dele.
- O Master (painel central) usa a marca do grupo (amarelo); quando filtra um produto, os indicadores daquele produto aparecem na cor dele.

## 7. Contraste e acessibilidade

`contrastes.csv` lista 244 pares realmente usados (neutros, semânticos e as sete marcas nos dois temas). São 226 aprovados no critério correspondente: texto comum ≥4,5:1, texto grande ≥3:1, componentes e indicadores ≥3:1. Além deles:
- 14 pares são de **logotipo**, isentos dos critérios 1.4.3 e 1.4.11. Treze deles ficam acima de 3:1. O único abaixo é o amarelo oficial sobre o off-white, com 1,54:1.
- 2 pares são **informativos**: as divisórias decorativas.
- 1 par é **uso proibido pela regra**: o amarelo como texto no claro.
- 1 par é **atendido pelo rótulo**: o limite do botão amarelo, porque o texto navy identifica o botão.

O `preview.html` passou no axe-core (WCAG 2.0/2.1 A e AA) sem violações em claro e escuro, a 1440 e 390 px, sem rolagem lateral. **Isso não é uma declaração de conformidade completa:** contraste é só uma parte; foco, teclado, leitores de tela e conteúdo dependem de cada tela real.

## 8. Visão de cores e escala de cinza

Método: simulação de Machado, Oliveira e Fernandes (2009) com severidade 1,0 (dicromacia total: protanopia, deuteranopia, tritanopia), aplicada em RGB linear sobre a prancha e sobre as cores; escala de cinza pela luminância relativa. Resultados em `simulacoes/` (imagens e `distancias.json`).

O que se observou:
- **Escala de cinza:** como as seis cores de produto têm a mesma luminosidade, viram praticamente o mesmo cinza (ΔE ≤ 0,007 entre várias duplas). Só o amarelo do grupo continua mais claro. É a consequência direta de pedir luminosidade compatível: a cor não pode ser o único identificador, e não é. Nome, descritor e monograma continuam legíveis em cinza.
- **Deuteranopia:** Commerce e Play se aproximam muito (ΔE 0,05; no raio escuro, 0,005). Creators e China Hub ficam a 0,036 e SuperDrop e Brás a 0,044.
- **Protanopia:** Commerce e Play ficam a 0,058. As demais duplas estão acima de 0,10.
- **Tritanopia:** SuperDrop e China Hub ficam a 0,024, Creators e Brás a 0,032.
- **Grupo × Commerce** (o mesmo monograma NL) continuam distinguíveis em todas as simulações e em cinza, porque o raio amarelo é bem mais claro que o azul.

Limites: as simulações aproximam a visão dicromática total. Não representam as formas parciais (anomalias), que são as mais comuns, nem a variação entre telas, brilho e ambiente. Não substituem um teste com pessoas.

## 9. O que ainda não foi validado

- As cores ainda não foram aplicadas no sistema em produção. Esta proposta não alterou nenhum site.
- O serrilhado dos contornos (item 1.3) continua nos arquivos, porque foram copiados sem redesenho.
- As cores das três marcas planejadas não foram testadas com logos reais, porque essas logos não existem.
- Não houve teste com usuários nem impressão física (CMYK/Pantone não definidos).
