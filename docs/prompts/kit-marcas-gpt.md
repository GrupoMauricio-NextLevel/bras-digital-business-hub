# Kit oficial de cada marca no GPT (igual ao Brás Digital Club)

Objetivo: cada marca recebe o mesmo pacote que o Brás Digital Club recebeu (D158): logos transparentes para fundo claro e
escuro, com e sem slogan, vertical, monogramas, ícone de app, peças 3D para o topo das páginas, prancha da marca, tokens e
um `brand.config.json`. Com o pacote em mãos, o Claude aplica no sistema (painel + página pública) do mesmo jeito.

**Regra principal:** as marcas do grupo já têm logo aprovada (família "NextLevel com raio"). O GPT **não redesenha**: completa
o kit a partir da logo atual, preservando letras, raio, proporção e cores. Só a Brás ganhou identidade nova.

## Ordem
| # | Marca | Por que nessa ordem | Arquivos para anexar (pasta do ZIP de referências) |
|---|---|---|---|
| 1 | NextLevel Commerce | Produto foco; a versão compacta hoje é "NextLevel" sem a palavra Commerce (o sistema completa com texto) | `01-nextlevel-commerce/` |
| 2 | SuperDrop | Em produção com clientes; só completar o kit, sem mexer na logo | `02-superdrop/` |
| 3 | NextLevel (grupo) | Vitrine em nextlevelgroup.com.br e Master | `03-nextlevel-grupo/` |
| 4 | NextLevel Cargas | Maior falta hoje: logo escura veio com fundo sólido; sem monograma e sem favicon | `04-nextlevel-cargas/` |
| 5 | Club, Loja NextLevel, Meu Contador, Parceiros | Logos já completas; faltam só peças 3D/topo (um pacote para as quatro) | `05` a `08` |

Uma marca por conversa no ChatGPT. Ao terminar, mande o ZIP aqui e diga "aplica a marca X".

## Prompt (copie, troque o bloco "DADOS DA MARCA" e anexe as logos atuais + a prancha do Brás como referência de formato)

```
Você é diretor de arte e designer de identidade. Vou anexar a LOGO ATUAL APROVADA da marca abaixo (versões para fundo claro
e escuro e o monograma) e, como referência de FORMATO de entrega (não de estilo), a prancha do Brás Digital Club.

Sua tarefa: completar o kit oficial desta marca, PRESERVANDO a logo atual. Não redesenhe, não troque fonte, não mude o raio,
a inclinação, a proporção nem as cores. Só reproduza com fidelidade em alta resolução e monte as variações pedidas.

DADOS DA MARCA
- Nome exato: {NOME}
- Slogan exato (usar só onde pedido): "{SLOGAN}"
- Cores: navy {NAVY} · cor de assinatura {COR} · versão clara da cor (para fundo escuro) {COR_CLARA} · off-white #F4F1E9 · destaque do grupo #F5BC00 (só em detalhe)
- O que a marca faz (para as peças 3D e a prancha): {DESCRICAO}

ENTREGA (um arquivo por imagem, PNG, nomes exatamente assim):
logos/flat/
  1. logo-clara.png — logo para fundo claro, FUNDO TRANSPARENTE, ~2000 px de largura, margem de respiro de 4% em volta
  2. logo-escura.png — mesma logo para fundo escuro: lettering off-white #F4F1E9, raio na cor clara, FUNDO TRANSPARENTE (nunca navy embutido)
  3. logo-clara-com-slogan.png — logo + slogan embaixo, fundo transparente
  4. logo-escura-com-slogan.png — idem para fundo escuro, fundo transparente
logos/vertical/
  5. logo-vertical-clara.png e 6. logo-vertical-escura.png — monograma em cima e nome embaixo, fundo transparente, ~1200×1330
logos/monogramas/
  7. monograma-claro.png e 8. monograma-escuro.png — só o símbolo/monograma atual, quadrado 1254×1254, fundo transparente
logos/app-icons/
  9. app-icon-master.png — 1254×1254, monograma escuro centralizado sobre navy {NAVY}, cantos retos (o sistema arredonda), sem texto
3d/ (peças de campanha 1672×941, sem nenhum texto, sem logo escrita, fundo opaco escuro)
  10. 02-hero-sem-texto.png — o SÍMBOLO da marca em 3D (metal anodizado/vidro), à ESQUERDA do quadro (ocupando ~25% a 55% da largura), lado direito livre e escuro para o texto do site; iluminação na cor de assinatura
  11. 01-vidro-optico.png — o símbolo em vidro óptico com reflexo no chão, centralizado
  12. 03-camadas-translucidas.png — o símbolo em camadas translúcidas, luz cinética, centralizado
referencias/
  13. brand-board-aprovado.png — prancha 1672×941 com: logo clara e escura, monograma, paleta com os hexadecimais, aplicação clara e escura

Depois das imagens, gere também (texto, sem imagem):
  tokens/brand-tokens.json — { brand, name, tagline, colors{navy, signature, signatureLight, offWhite}, semantic{light{surface,
    surfaceMuted, text, textMuted, action, focus}, dark{...}} } com contraste AA (texto 4,5:1) — confira os números
  integration/brand.config.json — { id, name, shortName, tagline, canonicalUrl: null, theme{...}, assets{ caminhos acima } }
  docs/INVENTARIO.md — lista de arquivos com dimensões e se o fundo é transparente

REGRAS
- Fundo TRANSPARENTE de verdade (canal alfa) em todas as logos e monogramas: sem quadriculado desenhado, sem fundo branco ou navy.
- Nada de sombra, contorno, brilho, filtro ou deformação nas logos. Nas peças 3D, sim, pode ter luz e material.
- Escreva o nome e o slogan exatamente como estão acima (acentos incluídos). Se não conseguir escrever com perfeição, me avise.
- Não invente slogan, número, selo, cliente ou prêmio.
- No final, junte tudo em um ZIP chamado {ARQUIVO}.zip com as pastas acima.
```

## Dados de cada marca (cole no bloco "DADOS DA MARCA")

**1. NextLevel Commerce** · ZIP `nextlevel-commerce-kit`
- Nome: NextLevel Commerce
- Slogan: "A loja da sua marca, pronta para vender."
- Cores: navy #0B1A36 · azul #2F81F4 · azul claro #71AAFF
- Faz: plataforma de loja virtual com a marca do lojista (temas, Pix e cartão, frete) para marcas e lojistas no Brasil.
- Atenção extra: a versão compacta deve ter "NextLevel" com o raio azul **e** a palavra "COMMERCE" embaixo (como a assinatura completa atual).

**2. SuperDrop** · ZIP `superdrop-kit`
- Nome: SuperDrop
- Slogan: "Você vende. O fornecedor envia."
- Cores: navy #0D1B34 · verde #2D9E3B · verde claro #62C268
- Faz: loja online sem estoque; fornecedores parceiros separam e enviam cada pedido.
- Atenção extra: logo em produção com clientes; reproduzir idêntica (itálico, raio verde entre "Super" e "Drop").

**3. NextLevel (grupo)** · ZIP `nextlevel-grupo-kit`
- Nome: NextLevel · linha de apoio da assinatura: "SOLUÇÕES DIGITAIS"
- Slogan: "Estrutura digital para o seu negócio ir além."
- Cores: navy #101B34 · amarelo #F5BC00 (é a cor de assinatura do grupo)
- Faz: grupo que opera SuperDrop, NextLevel Commerce, Brás Digital Club e NextLevel Cargas; loja virtual, migração, temas, tráfego e consultoria.

**4. NextLevel Cargas** · ZIP `nextlevel-cargas-kit`
- Nome: NextLevel Cargas
- Slogan: "Movimento que chega com controle."
- Cores: navy #101B34 · índigo #4B4FD8 · índigo claro #9EA2FF
- Faz: transportadoras e ônibus de excursão que levam as caixas do Brás para todo o Brasil, com coleta e retirada por código.
- Atenção extra: a logo escura atual veio com **fundo navy sólido**; a nova tem de ser transparente. Criar o monograma "NL" com o raio índigo, no mesmo desenho dos monogramas do grupo (ver `03-nextlevel-grupo/logo-atual-monograma-*`).

**5. Club, Loja NextLevel, Meu Contador e Parceiros** · ZIP `nextlevel-familia-kit`
- Logos já estão completas: peça **só** as peças 3D (itens 10 a 12) e uma prancha de família, para cada uma:
  - NextLevel Club · "Quanto mais você avança, mais valor acompanha." · amarelo #F5BC00 · programa de pontos do grupo
  - Loja NextLevel · "Uma vitrine para quem vive o próximo nível." · amarelo #F5BC00 · temas, serviços e cursos da NextLevel
  - Meu Contador · "Clareza para decidir. Organização para crescer." · azul #2F81F4 · apoio de contador parceiro para membros do Brás Digital Club
  - Parceiros NextLevel · "Parcerias que transformam conexão em resultado." · verde #2D9E3B · programa de indicação com comissão
  - Todas sobre navy #101B34; nomes dos arquivos com o prefixo da marca (ex.: `club-02-hero-sem-texto.png`).

## Depois que o pacote chegar
O Claude faz para cada marca o mesmo da D158: copia os originais, gera versões leves, liga logo clara/escura e monograma no
`BrandLogo`, favicons e ícones de app (gerados a partir do `app-icon-master`), prévia de link, topo da página com a peça 3D,
confere contraste AA, claro/escuro, celular/tablet/computador, e publica.
