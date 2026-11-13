# NextLevel Commerce: racional da marca e prompts para o gerador de imagens

> **Pedido do dono (13/11/2026, D288):** parar de usar "NextLevel E-commerce" e usar **"NextLevel Commerce"** em todo o sistema. O texto já foi trocado; a parte que falta é **a arte**: os logos ainda dizem "E-commerce".
> Domínio: `nextlevelcommerce.com.br`. Empresa: NextLevel Marketing Ltda.

---

## 1. Por que "NextLevel Commerce"

- **O nome bate com o domínio.** `nextlevelcommerce.com.br` e "NextLevel Commerce" são a mesma coisa. O visitante digita o que lê.
- **É mais curto e mais forte.** Duas palavras e nenhum hífen. Lê melhor em logo, em ícone de celular e falado ("NextLevel Commerce").
- **Cabe no futuro.** "Commerce" não prende a marca à loja virtual: cobre atacado, venda pelo WhatsApp e marketplace, que estão no plano da plataforma.
- **Fica na família do grupo.** NextLevel (grupo e agência) + Commerce (a plataforma), assim como seria NextLevel Cargas. O "NextLevel" continua sendo a assinatura comum.

## 2. O que manter do logo atual (reconhecimento)

O logo atual (`public/marcas/nextlevel-ecommerce/logos/`) tem três coisas boas:
- **O símbolo em fita 3D azul e ciano** (gradiente de azul elétrico para ciano, volume suave, brilho);
- a tipografia **itálica, pesada e geométrica**, que dá a ideia de movimento ("próximo nível");
- a linha de apoio em letras espaçadas.

**Manter:** as cores, o estilo da fita, o itálico pesado e a linha de apoio.
**Mudar:** o texto ("E-commerce" vira "Commerce") e o monograma ("NE" vira "NC", ou só o "N" em fita).

### Paleta

| Uso | Cor |
|---|---|
| Azul elétrico (principal) | `#1D4ED8` a `#2563EB` |
| Ciano (brilho, fim do gradiente) | `#22D3EE` |
| Azul-marinho (texto no fundo claro) | `#0B1328` |
| Branco (texto no fundo escuro) | `#FFFFFF` |

## 3. Peças que precisam ser geradas (mesmos nomes e tamanhos de hoje)

As pastas estão em `public/marcas/nextlevel-ecommerce/logos/`. Os arquivos novos substituem os atuais **com o mesmo nome**, e assim o sistema troca sozinho.

| Peça | Formato | Fundo | Arquivo |
|---|---|---|---|
| Logo horizontal "prisma" (símbolo 3D + NextLevel / Commerce + linha de apoio) | PNG transparente, cerca de 2400 × 640 | Claro e escuro (2 versões) | `prisma/logo-clara.png`, `prisma/logo-escura.png` |
| Logo horizontal "flat" (mesmo desenho, sem 3D, cores chapadas) | PNG transparente | Claro e escuro | `flat/logo-clara.png`, `flat/logo-escura.png` |
| Logo vertical (símbolo em cima, nome embaixo) | PNG transparente, cerca de 1200 × 1200 | Claro e escuro | `vertical/logo-vertical-clara.png`, `vertical/logo-vertical-escura.png` |
| Monograma (só o símbolo) | PNG transparente, 1024 × 1024 | — | `monogramas/monograma-prisma.png`, `monogramas/monograma-flat.png` |
| Monocromática (uma cor) | PNG transparente | Positiva (marinho) e negativa (branca) | `monocromaticas/logo-positiva.png`, `monocromaticas/logo-negativa.png` |
| Ícone de aplicativo e favicon | Quadrado 1024 × 1024, símbolo centralizado, margem de 12% | Fundo azul-marinho sólido | geramos os tamanhos 16 a 512 a partir dele |
| Imagem de compartilhamento | 1200 × 630 JPG | Escuro | `og-1200x630.jpg` |

Gerado o PNG grande, eu converto para WebP e para os tamanhos 640 e 1280 e troco no sistema.

## 4. Decisões para o dono

1. **Linha de apoio:** manter "PLATAFORMA DE LOJAS VIRTUAIS" ou trocar por algo mais curto, como "LOJAS VIRTUAIS" ou "SUA LOJA NO PRÓXIMO NÍVEL". A recomendação é manter: diz o que é, e o nome "Commerce" sozinho é genérico.
2. **Monograma:** "NC" em fita, como continuação do "NE" atual, ou **só o "N" em fita**, mais simples e mais forte em ícone pequeno. A recomendação é o "N", porque funciona no favicon de 16 px e serve a qualquer produto NextLevel.

## 5. Prompts para o gerador de imagens (GPT)

Dicas que valem para todos:
- Peça **uma peça por vez**.
- Anexe o logo atual (`logos/prisma/logo-clara.png`) como referência e diga "mantenha o estilo do logo anexado".
- O gerador às vezes erra letras: confira se está escrito exatamente **NextLevel** (N e L maiúsculos) e **Commerce** (dois "m").
- Peça **fundo transparente** e **sem sombra externa**.

### 5.1 Logo horizontal prisma (fundo claro)
```
Crie um logotipo horizontal para a marca "NextLevel Commerce", mantendo exatamente o estilo do logo anexado.
À esquerda, o símbolo: uma letra N formada por uma fita 3D contínua, com gradiente de azul elétrico (#1D4ED8)
para ciano (#22D3EE), volume suave e brilho discreto, sem sombra externa.
À direita, em duas linhas, tipografia sans-serif geométrica, itálica e extra-negrito:
linha 1 "NextLevel" em azul-marinho (#0B1328); linha 2 "Commerce" em azul elétrico com gradiente para ciano.
Abaixo, alinhado ao texto, em letras maiúsculas pequenas e bem espaçadas, azul-marinho: "PLATAFORMA DE LOJAS VIRTUAIS".
Fundo transparente, alta resolução, proporção aproximada 4:1, escrita exatamente como indicado, sem outros elementos.
```

### 5.2 Logo horizontal prisma (fundo escuro)
```
Mesmo logotipo "NextLevel Commerce" do pedido anterior, versão para fundo escuro:
"NextLevel" e a linha de apoio em branco; "Commerce" em azul claro com gradiente para ciano; o símbolo em fita com o mesmo
gradiente, um pouco mais luminoso. Fundo transparente, sem sombra externa.
```

### 5.3 Logo flat (sem 3D)
```
Versão "flat" do logotipo "NextLevel Commerce": o mesmo desenho, sem volume 3D, sem brilho e sem gradiente,
com cores chapadas: símbolo em azul elétrico (#2563EB) e ciano (#22D3EE) em duas faixas, "NextLevel" em azul-marinho
(#0B1328), "Commerce" em azul elétrico. Fundo transparente. Faça também a versão para fundo escuro (texto branco).
```

### 5.4 Logo vertical
```
Versão vertical do logotipo "NextLevel Commerce": o símbolo da fita em N centralizado em cima, e embaixo, centralizados,
"NextLevel" e "Commerce" em duas linhas (mesma tipografia itálica extra-negrito) e a linha "PLATAFORMA DE LOJAS VIRTUAIS".
Fundo transparente, formato quadrado. Faça a versão clara e a versão para fundo escuro.
```

### 5.5 Monograma e ícone de aplicativo
```
Crie só o símbolo da marca NextLevel Commerce: uma letra N formada por uma fita 3D contínua, com gradiente de azul
elétrico (#1D4ED8) para ciano (#22D3EE), centralizada, sem texto. Primeiro com fundo transparente; depois uma versão de
ícone de aplicativo: quadrado 1024×1024, fundo azul-marinho sólido (#0B1328), o símbolo centralizado ocupando 75% da área.
Precisa ficar legível também em tamanho muito pequeno (16 px).
```

### 5.6 Monocromáticas
```
Versões monocromáticas do logotipo horizontal "NextLevel Commerce" (símbolo + texto + linha de apoio):
uma toda em azul-marinho (#0B1328) e outra toda em branco. Sem gradiente, sem 3D. Fundo transparente.
```

### 5.7 Imagem de compartilhamento (1200 × 630)
```
Imagem de compartilhamento para redes sociais, 1200×630, para a NextLevel Commerce, plataforma de lojas virtuais.
Fundo azul-marinho profundo com uma grade tecnológica sutil e um brilho ciano no canto inferior direito.
À esquerda, o logotipo horizontal "NextLevel Commerce" (versão para fundo escuro). Abaixo, a frase
"Sua loja virtual no próximo nível". À direita, um celular e um notebook mostrando uma vitrine de loja de moda.
Sem preços, sem números, sem logos de outras empresas. Escrita exatamente como indicado.
```

## 6. Depois que as imagens chegarem

1. O dono manda os PNGs aqui na conversa, como arquivo.
2. Eu confiro a escrita, a transparência e o recorte, gero os tamanhos (WebP 640 e 1280, favicons de 16 a 512, ícones do celular), troco os arquivos e confiro as telas em 360, 768 e 1440 px, claro e escuro.
3. A pasta pode passar a se chamar `nextlevel-commerce`. A troca de pasta é só interna; o visitante não vê.
