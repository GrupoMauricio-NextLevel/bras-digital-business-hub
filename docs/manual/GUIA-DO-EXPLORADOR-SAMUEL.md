# 🧭 Guia do Explorador: a grande inspeção do Sistema NextLevel

> **Agente:** Samuel · **Missão:** visitar, entender e testar **todas as telas** do sistema da família · **Patente inicial:** Recruta
> **Escrito em:** 12/10/2026 · **Total de telas no sistema:** 213 (lista completa no Apêndice)

---

## 📜 Carta para o Samuel

Samuel,

o sistema que o seu pai está construindo é grande de verdade: são **cinco marcas**, **onze tipos de painel**, **213 telas** e milhares de botões. Programadores e robôs de teste já passaram por ele, mas existe uma coisa que nenhum robô faz bem: **olhar como uma pessoa olha**. Perceber quando um texto confunde, quando um botão parece estar no lugar errado, quando uma página é chata, lenta ou bonita, quando um cliente desistiria de comprar.

É isso que você vai fazer. Você é o **Agente Explorador**: vai entrar em cada tela, entender para que ela serve, testar com os seus "superpoderes" (está tudo explicado aqui) e **anotar tudo** numa ficha. No fim, o seu relatório vai virar trabalho de verdade: cada problema que você achar pode virar uma correção no sistema.

Não tem pressa. São várias sessões, uma missão por vez. Ganhe pontos (XP), suba de patente, conquiste medalhas e enfrente os **chefões** (jornadas completas de ponta a ponta).

Boa caçada. 🕵️

---

## 🗺️ Índice

0. [Para o pai, antes de começar](#0-para-o-pai-antes-de-começar)
1. [As 8 regras de ouro do Agente](#1-as-8-regras-de-ouro-do-agente)
2. [Seu kit de ferramentas](#2-seu-kit-de-ferramentas)
3. [Entendendo o sistema: a história em 5 minutos](#3-entendendo-o-sistema-a-história-em-5-minutos)
4. [O Mundo de Treino (o único que você usa)](#4-o-mundo-de-treino-o-único-que-você-usa)
5. [A Ficha de Inspeção (como anotar)](#5-a-ficha-de-inspeção-como-anotar)
6. [Os 10 superpoderes de teste](#6-os-10-superpoderes-de-teste)
7. [XP, patentes e medalhas](#7-xp-patentes-e-medalhas)
8. [Mundo 1: Os portais públicos](#mundo-1-os-portais-públicos)
9. [Mundo 2: Vitrines, temas e a experiência de compra](#mundo-2-vitrines-temas-e-a-experiência-de-compra)
10. [Mundo 3: Painel do Lojista (SuperDrop)](#mundo-3-painel-do-lojista-superdrop)
11. [Mundo 4: Painel da Loja (NextLevel Commerce)](#mundo-4-painel-da-loja-nextlevel-commerce)
12. [Mundo 5: Fornecedor e Expedição](#mundo-5-fornecedor-e-expedição)
13. [Mundo 6: Parceiro](#mundo-6-parceiro)
14. [Mundo 7: Brás Digital (membro, importadora, balcão)](#mundo-7-brás-digital)
15. [Mundo 8: NextLevel Cargas (transportadora e ônibus)](#mundo-8-nextlevel-cargas)
16. [Mundo 9: O Master (a sala de controle)](#mundo-9-o-master-a-sala-de-controle)
17. [Mundo 10: Links secretos e a sua conta](#mundo-10-links-secretos-e-a-sua-conta)
18. [Os Chefões: jornadas de ponta a ponta](#-os-chefões-jornadas-de-ponta-a-ponta)
19. [Desafios de Mestre (nível avançado)](#-desafios-de-mestre-nível-avançado)
20. [Relatório final](#-relatório-final)
21. [Glossário (dicionário do Agente)](#-glossário-dicionário-do-agente)
22. [Apêndice: checklist das 213 telas](#-apêndice-checklist-das-213-telas)

---

## 0. Para o pai, antes de começar

**Leia esta parte antes de entregar o guia ao Samuel.**

### Onde ele vai testar: só na demonstração
**Todo o guia usa um único endereço: https://nextlevel-demo.onrender.com** (o "Mundo de Treino").

- Lá os dados são inventados, o Pix e o Mercado Pago são de mentira e ele pode apertar qualquer botão sem risco.
- O ambiente foi religado em 12/10 com os perfis do Samuel. Se um dia não abrir, me avise (Claude).
- Todos os endereços dos painéis neste guia aparecem como caminhos curtos (por exemplo `/merchant/orders`): eles sempre começam com **https://nextlevel-demo.onrender.com**.

> 🚫 **ENDEREÇOS REAIS: NÃO ACESSAR.** O sistema de verdade, com clientes, mora em `superdrop.com.br`, `lojas.nextlevelgroup.com.br`, `master.nextlevelgroup.com.br`, `bras.nextlevelgroup.com.br` e `cargas.nextlevelgroup.com.br`. Este guia cita esses nomes só para o Samuel saber que existem. **Ele não deve digitar nenhum deles.**

### O que NÃO entregar ao Samuel

- **A sua senha do Master de verdade.** Ele não precisa dela para nada. Todo painel ele vê na demonstração, com os perfis criados para ele (`samuel.<papel>@familia.demo`, senha `demo1234`, lista na seção 4).
- Nenhum cartão, chave Pix, token ou documento real.

### Como receber o trabalho dele

- Ele preenche as fichas (seção 5) num caderno, num Google Docs ou numa planilha. Sugestão: **uma planilha com uma linha por tela** (as colunas estão na seção 5).
- No fim, ele monta o **Relatório final** (seção 20). Mande o relatório para mim (Claude) aqui na conversa: eu separo o que é defeito, o que é ideia e transformo em correções.

### Tempo estimado

- Mundo 1 (páginas públicas): 2 a 3 sessões de 45 minutos.
- Mundos 2 a 10 (painéis): 8 a 12 sessões de 45 minutos.
- Chefões e Desafios de Mestre: 3 a 5 sessões.
- **Total:** de 3 a 5 semanas, com calma, uma ou duas sessões por dia.

---

## 1. As 8 regras de ouro do Agente

Leia em voz alta antes da primeira missão.

1. **🧪 Um endereço só:** https://nextlevel-demo.onrender.com. Tudo neste guia acontece lá.
2. **🚫 Endereço real, nunca.** Se você vir `superdrop.com.br`, `lojas.nextlevelgroup.com.br`, `master.nextlevelgroup.com.br`, `bras.nextlevelgroup.com.br` ou `cargas.nextlevelgroup.com.br` na barra do navegador, **feche a aba e avise o seu pai**. Esses são o sistema de verdade, com clientes reais. Atenção: alguns links **dentro** do Treino apontam para o sistema real (por exemplo, os links das outras marcas no rodapé e os botões "Abrir" da Central de qualidade). Antes de clicar, olhe para onde o link vai; se não for `nextlevel-demo.onrender.com`, não clique.
3. **🙅 Nunca use dados reais.** Nem o seu nome completo, nem CPF, e-mail, telefone ou endereço de ninguém. Invente: "Teste Samuel", `samuel.teste@exemplo.com`, CPF `529.982.247-25` (é um CPF de teste válido), CEP `01001-000`.
4. **🔑 Senha só a da demonstração:** `demo1234`. Se alguma tela pedir outra senha, pare e chame o seu pai.
5. **🧪 Na demonstração, pode tudo.** Criar pedido, pagar Pix de mentira, mudar cor de loja, apertar "Suspender": tudo liberado. Só **anote** o que você mudou ("apertei Suspender na loja X às 15h10"), porque outra pessoa da família pode estar usando a demonstração ao mesmo tempo.
6. **📸 Prova de tudo:** achou um problema? Tire um print **antes** de fazer qualquer outra coisa (seção 2 ensina como).
7. **🧠 Não existe pergunta boba.** Se você não entendeu para que serve uma tela, **isso já é uma descoberta**: anote "não entendi para que serve". Se você não entendeu, um cliente também pode não entender.
8. **⏸️ Pausa a cada 45 minutos.** Testador cansado deixa passar bug.

---

## 2. Seu kit de ferramentas

| Ferramenta | Para quê | Como usar |
|---|---|---|
| **Google Chrome** (ou Edge) no computador | Navegar | Use sempre o mesmo navegador nos testes |
| **Janela anônima** (`Ctrl + Shift + N`) | Testar como um visitante novo, sem login | Abra o Treino numa janela anônima no Mundo 1 e no Mundo 2 |
| **Modo celular** (`F12` e depois `Ctrl + Shift + M`) | Ver a tela como num celular | Escolha "iPhone SE" ou digite largura **360** |
| **Print de um pedaço da tela** (`Windows + Shift + S`) | Provar o problema | Salve como `M3-pedidos-01.png` (mundo, tela, número) |
| **Zoom** (`Ctrl +` e `Ctrl -`) | Testar letras grandes (pessoas que enxergam pouco) | Teste em 200% |
| **Tecla Tab** | Navegar sem mouse | Aperte Tab várias vezes e veja se dá para saber onde você está |
| **Celular de verdade** | Teste final | Abra https://nextlevel-demo.onrender.com no seu celular |
| **Caderno ou planilha** | As fichas | Modelo na seção 5 |
| **Cronômetro** | Medir tempo de tarefa | "Quanto tempo levei para achar X?" |

**Dica de agente:** deixe duas janelas lado a lado (`Windows + ←` e `Windows + →`): numa o guia, na outra o sistema.

---

## 3. Entendendo o sistema: a história em 5 minutos

### A empresa
A **NextLevel Marketing Ltda.** (do seu pai) fabrica **plataformas**: programas na internet que outras empresas usam para vender. Pense numa fábrica de "shoppings virtuais": a NextLevel constrói o prédio, e cada lojista aluga o seu espaço.

### As marcas (todas no mesmo sistema, com roupas diferentes)
| Marca | Endereço real (🚫 só referência, não acessar) | Em uma frase | Situação |
|---|---|---|---|
| **SuperDrop** | `superdrop.com.br` | Loja sem estoque: o lojista vende, o **fornecedor** guarda o produto e envia para o cliente (isso se chama *dropshipping*) | No ar, com clientes |
| **NextLevel Commerce** | `lojas.nextlevelgroup.com.br` | Loja virtual própria, para quem tem os próprios produtos (concorre com Shopify e Nuvemshop) | No ar |
| **Brás Digital** | `bras.nextlevelgroup.com.br` | Clube de compras em atacado de importadoras do Brás (São Paulo), em caixa fechada, só para empresas com CNPJ | Aberta, em teste |
| **NextLevel Cargas** | `cargas.nextlevelgroup.com.br` | Transportadoras e ônibus de excursão que levam as mercadorias | Página de apresentação |
| **NextLevel Soluções** | `master.nextlevelgroup.com.br/solucoes` | A agência: monta lojas, faz migração, anúncios, consultoria. Tem também a **Loja NextLevel** (vende temas e serviços) | No ar (vai mudar para nextlevelgroup.com.br) |
| Hub Creators e China Hub | (em breve) | Próximos projetos | Só página "em breve" |

**Truque para entender:** todas as marcas são **o mesmo programa**. O que muda é o endereço: o sistema olha o endereço que você digitou e "veste a roupa" da marca certa (logo, cores, textos, menus).

### Os personagens (quem usa o quê)
| Personagem | O que faz | Painel dele |
|---|---|---|
| 🛒 **Cliente final** | Compra numa loja (ex.: uma camisa) | Não tem painel: usa a **vitrine** da loja |
| 🏪 **Lojista** (membro) | Dono da loja; escolhe produtos, preço, tema; vende | `/merchant` |
| 🏭 **Fornecedor** (Central) | Tem o estoque, separa e envia os pedidos dos lojistas (SuperDrop) | `/supplier` |
| 📦 **Expedição** | Funcionário do fornecedor que embala e imprime etiquetas | `/supplier/dispatch` |
| 🤝 **Parceiro** (afiliado) | Indica clientes e ganha comissão | `/partner` |
| 🧳 **Membro Brás** | Empresa que compra caixas no atacado | `/meu-bras` |
| 🏬 **Importadora** | Vende as caixas na Brás | `/importadora` |
| 🚚 **Transportadora / ônibus** | Leva as caixas | `/transportadora` |
| 👑 **Equipe NextLevel** (Master) | Controla tudo: lojas, dinheiro, preços, qualidade | `/master`, `/commerce`, `/bras` |

### Como o dinheiro anda (SuperDrop)
```
Cliente paga R$ 100 na loja  ──►  vai direto para a conta do LOJISTA (Mercado Pago dele)
Lojista recarrega SALDO por Pix ──► vai para a conta do FORNECEDOR
Cada pedido: o custo do produto (ex.: R$ 55) sai do saldo do lojista
Fornecedor envia o produto para o cliente
NextLevel cobra mensalidade e taxas (fatura separada)
Parceiro que indicou ganha comissão
```
**Pergunta de agente:** onde está o lucro do lojista nesse exemplo? (Resposta no fim do Glossário.)

### Uma regra secreta importante
**Um lojista nunca pode ver os dados de outro lojista.** Isso se chama *isolamento entre clientes*. Nos Desafios de Mestre você vai tentar (no Treino) "furar" essa regra. Se conseguir, é o bug mais valioso do guia.

---

## 4. O Mundo de Treino (o único que você usa)

O sistema de verdade tem clientes reais. Por isso existe uma **cópia de treino** com dados inventados: o **Mundo de Treino**. Tudo que você fizer lá é de mentira, e é **só lá** que você vai trabalhar.

> 🚫 **ENDEREÇOS REAIS: NÃO ACESSAR.** O Mundo Real fica em `superdrop.com.br`, `lojas.nextlevelgroup.com.br`, `master.nextlevelgroup.com.br`, `bras.nextlevelgroup.com.br` e `cargas.nextlevelgroup.com.br`. Neste guia eles aparecem só para você saber que existem. **Não digite nenhum deles.**

- **Endereço do Treino:** https://nextlevel-demo.onrender.com
- **Como entrar:** abra https://nextlevel-demo.onrender.com/login. Digite o e-mail do seu perfil e a senha `demo1234`. Ou abra **"Perfis de demonstração"**, embaixo do quadro de entrada, e clique no perfil: você entra com um clique.
- **Como saber que está no Treino:** na tela de entrada aparece a faixa amarela "Ambiente de demonstração · Mercado Pago e Pix SIMULADOS", e dentro dos painéis existe um botão **"Demo"** no topo. E a barra do navegador mostra **nextlevel-demo.onrender.com**. Se não mostrar: **pare**.
- **Primeiro acesso lento:** o Treino "dorme" quando ninguém usa. A primeira página pode levar até 1 minuto. Isso não é bug (mas anote se demorar mais de 2 minutos).
- **Ver como Commerce:** no Treino, todas as marcas moram no mesmo endereço e o site aparece com a cara do SuperDrop. Abra https://nextlevel-demo.onrender.com/lojas para o site ficar com a cara da NextLevel Commerce, e https://nextlevel-demo.onrender.com/lojas/sair para voltar ao SuperDrop.
- **Trocar de personagem:** use o botão **"Demo"** no topo dos painéis, ou clique no seu nome (canto de cima, à direita), **Sair**, e entre com outro perfil.

### ⭐ Os SEUS perfis (criados para você, senha `demo1234`)
Cada perfil tem o seu nome e entra na mesma empresa de um perfil de demonstração, então você vê os mesmos dados. Troque de papel pelo botão **"Demo"** no topo.

| Você vira… | E-mail | Use no |
|---|---|---|
| 👑 **Samuel · Master** (vê todos os fornecedores, lojas, clientes e pedidos) | `samuel.master@familia.demo` | Mundo 9 |
| 🏪 **Samuel · Lojista SuperDrop** (loja Arena 10) | `samuel.lojista@familia.demo` | Mundo 3 |
| 🛍️ **Samuel · Loja Commerce** (loja Casa Aurora) | `samuel.commerce@familia.demo` | Mundo 4 |
| 🏭 **Samuel · Fornecedor** (Mega Tron) | `samuel.fornecedor@familia.demo` | Mundo 5 |
| 📦 **Samuel · Expedição** (Mega Tron) | `samuel.expedicao@familia.demo` | Mundo 5 |
| 🏬 **Samuel · Importadora** | `samuel.importadora@familia.demo` | Mundo 7 |
| 🚚 **Samuel · Transportadora** | `samuel.transportadora@familia.demo` | Mundo 8 |
| 🛒 **Cliente final** | não precisa de login: é só abrir uma loja | Mundo 2 |

> Parceiro e membro da Brás não têm perfil com o seu nome (cada um desses cadastros é único por pessoa). Use os perfis de demonstração da tabela abaixo: `parceira@demo.superdrop.com.br` e `membro@bras.demo`.
> A sua mãe tem um guia próprio, sobre o dinheiro do sistema: `docs/manual/GUIA-GESTAO-FINANCEIRA-DANIELLE.md`. Vocês podem comparar as anotações!

### Outros perfis do Treino (todos com senha `demo1234`)
| Personagem | E-mail do perfil | Use no |
|---|---|---|
| 👑 Dono da NextLevel (Master) | `master@nextlevel.demo` | Mundo 9 |
| Equipe: comercial | `comercial@nextlevel.demo` | Mundo 9 (ver o que um funcionário enxerga) |
| Equipe: financeiro | `financeiro@nextlevel.demo` | Mundo 9 |
| Equipe: suporte | `suporte@nextlevel.demo` | Mundo 9 |
| Contador parceiro | `contador@nextlevel.demo` | Mundo 9 |
| 🏪 Lojista SuperDrop (Arena 10) | `dono@arena10.demo` | Mundo 3 |
| Lojista SuperDrop (Mantos Shop) | `dono@mantosshop.demo` | Mundo 3 e Desafios |
| Lojista SuperDrop (Fut Classics) | `dono@futclassics.demo` | Mundo 3 |
| Lojista (MRS Sports) | `loja@mrssports.demo` | Mundo 3 |
| 🛍️ Loja Commerce simples (Fio & Linha) | `lojista@commerce.demo` | Mundo 4 |
| Loja Commerce completa (Casa Aurora) | `completo@commerce.demo` | Mundo 4 |
| Equipe da loja Commerce | `equipe@commerce.demo`, `paulo@casaaurora.demo`, `sofia@casaaurora.demo` | Mundo 4 (permissões) |
| 🏭 Fornecedor Mega Tron | `megatron@superdrop.demo` | Mundo 5 |
| Fornecedor Central Sports | `central@centralsports.demo` | Mundo 5 |
| 📦 Expedição Mega Tron | `expedicao@megatron.demo` | Mundo 5 |
| Expedição Central Sports | `expedicao@centralsports.demo` | Mundo 5 |
| 🤝 Parceira | `parceira@demo.superdrop.com.br` | Mundo 6 |
| 🧳 Membro Brás | `membro@bras.demo` | Mundo 7 |
| Membro Brás (loja 2) | `loja2@bras.demo` | Mundo 7 |
| 🏬 Importadora | `importadora@bras.demo` | Mundo 7 |
| Balcão da importadora | `balcao@bras.demo` | Mundo 7 |
| 🚚 Transportadora | `transportadora@cargas.demo` | Mundo 8 |
| Ônibus de excursão | `onibus@cargas.demo` | Mundo 8 |

> Se um perfil da lista não aparecer na tela de entrada, anote ("perfil X não aparece") e siga com outro.

---

## 5. A Ficha de Inspeção (como anotar)

Para **cada tela** que você visitar, preencha uma ficha. Pode ser no caderno ou numa planilha com estas colunas:

```
┌──────────────────────────────────────────────────────────────┐
│ FICHA DE INSPEÇÃO Nº ____          Data: __/__   Hora: __:__ │
│ Mundo nº: ____                  Perfil usado: ______________ │
│ Tela: ____________________   Endereço: ____________________  │
│                                                              │
│ 1. Para que serve esta tela? (com as suas palavras)          │
│    ________________________________________________________  │
│ 2. Quem usa? ______________________________________________  │
│ 3. A primeira coisa que meu olho viu: _____________________  │
│ 4. Funcionou? [ ] Sim  [ ] Em parte  [ ] Não                 │
│ 5. Superpoderes testados (seção 6): 1 2 3 4 5 6 7 8 9 10     │
│ 6. Problemas encontrados (use a escala de cores):            │
│    🔴 ______________________________________  print: _____   │
│    🟠 ______________________________________  print: _____   │
│    🟡 ______________________________________  print: _____   │
│ 7. 🟢 Ideias de melhoria: _________________________________  │
│ 8. Nota da tela (0 a 10): Beleza __ Clareza __ Rapidez __    │
│ 9. Uma frase: "Se eu fosse o cliente, eu ________________"   │
│ XP ganho: ____                                               │
└──────────────────────────────────────────────────────────────┘
```

### Escala de problemas (cores)
| Cor | Nome | Exemplo | XP |
|---|---|---|---|
| 🔴 | **Quebrado** | Página com erro, botão que não faz nada, dado errado, conta errada, vê dado de outra loja | 50 |
| 🟠 | **Confuso** | Não dá para entender o que fazer; texto que engana; caminho escondido | 30 |
| 🟡 | **Feio ou estranho** | Letra cortada, cor apagada, coisa desalinhada, erro de português, rolagem para o lado no celular | 15 |
| 🟢 | **Ideia** | "Seria legal se…" | 20 |

### Como descrever um 🔴 (o jeito profissional)
Escreva sempre os **3 passos**:

1. **O que eu fiz:** "Entrei como `dono@arena10.demo`, abri Pedidos, cliquei no pedido #1043, apertei Imprimir."
2. **O que eu esperava:** "Abrir a etiqueta para imprimir."
3. **O que aconteceu:** "Tela branca com a mensagem 'Algo deu errado'." + print.

Se você conseguir **repetir o problema** fazendo os mesmos passos, ganha **+20 XP de "Bug confirmado"**.

---

## 6. Os 10 superpoderes de teste

Em cada tela, use pelo menos 5. Nas telas marcadas com ⭐ use os 10.

| # | Superpoder | Como fazer | O que procurar |
|---|---|---|---|
| 1 | 👀 **Olho de cliente** | Olhe 5 segundos e feche os olhos | Você sabe dizer do que é a página e o que fazer nela? |
| 2 | 📱 **Encolher** | `F12`, `Ctrl+Shift+M`, largura **360** | Tudo cabe? Precisa rolar para o lado? (rolar para o lado é 🟡) Botões dá para apertar com o dedo? |
| 3 | 🌙 **Noite** | Botão de lua no topo (claro/escuro/sistema) | Algum texto some ou fica difícil de ler no escuro? |
| 4 | ⌨️ **Sem mouse** | Só `Tab`, `Shift+Tab` e `Enter` | Dá para ver onde está o "foco"? Dá para chegar em todos os botões? |
| 5 | 🔍 **Lupa** | Zoom 200% | O texto quebra bem ou fica cortado/sobreposto? |
| 6 | 🔗 **Todos os links** | Clique em todos os links e botões | Algum vai para página de erro, para o lugar errado, ou para a tela de login sem motivo? |
| 7 | ✍️ **Formulário teimoso** | Envie vazio; depois com e-mail sem @; telefone com letras; número negativo | A mensagem de erro é clara e em português? Ela diz o que corrigir? |
| 8 | 🔄 **Voltar e recarregar** | Botão voltar do navegador; `F5` no meio de uma tarefa | Perdeu o que estava digitando? Deu erro? |
| 9 | ⏱️ **Cronômetro** | Conte quanto tempo a página leva para aparecer | Mais de 3 segundos = anote. Mais de 10 = 🟠 |
| 10 | 📝 **Revisor** | Leia todos os textos | Erro de português, palavra em inglês sem motivo, texto que promete ganho ("fique rico") = anote |

---

## 7. XP, patentes e medalhas

### XP (pontos)
| Ação | XP |
|---|---|
| Tela visitada e ficha preenchida | 10 |
| Tela ⭐ com os 10 superpoderes | +10 |
| 🔴 Quebrado | 50 |
| 🟠 Confuso | 30 |
| 🟡 Feio/estranho | 15 |
| 🟢 Ideia | 20 |
| Bug confirmado (repetiu os passos) | +20 |
| Chefão derrotado | 200 |
| Desafio de Mestre | 100 a 300 |

### Patentes
| Patente | XP |
|---|---|
| 🥉 Recruta | 0 |
| 🧭 Explorador | 300 |
| 🔎 Inspetor | 800 |
| 🕵️ Detetive | 1.500 |
| 🏗️ Arquiteto | 2.500 |
| 🧙 Mestre do Sistema | 4.000 |

### Medalhas (uma por mundo concluído, e algumas especiais)
| Medalha | Como ganhar |
|---|---|
| 🌍 Cartógrafo | Terminar o Mundo 1 (todas as páginas públicas das 5 marcas) |
| 🛍️ Cliente Oculto | Terminar o Mundo 2 e fazer uma compra completa no Treino |
| 🏪 Mão na Massa | Terminar o Mundo 3 |
| 🎨 Designer | Terminar o Mundo 4 e mudar um tema inteiro de uma loja |
| 🏭 Chefe de Galpão | Terminar o Mundo 5 |
| 🤝 Embaixador | Terminar o Mundo 6 |
| 🧳 Atacadista | Terminar o Mundo 7 |
| 🚚 Caminhoneiro | Terminar o Mundo 8 |
| 👑 Guardião do Master | Terminar o Mundo 9 |
| 🗝️ Chaveiro | Terminar o Mundo 10 |
| 📱 Polegar de Ouro | Testar 30 telas no modo celular |
| 🌙 Coruja | Testar 30 telas no modo escuro |
| 🐛 Caçador de Bugs | Encontrar 10 problemas 🔴 |
| 🛡️ Hacker do Bem | Completar o Desafio de Mestre 1 (isolamento) |

---

# MUNDO 1: Os portais públicos

> **Onde:** Mundo de Treino, numa **janela anônima** (sem login), para ver o site como um visitante.
> **Meta:** entender o que cada marca oferece e se um visitante entenderia e confiaria.
> **Bônus do Treino:** aqui os formulários podem ser enviados de verdade (é tudo de mentira). Teste primeiro **vazio** e com **dado errado**, depois **certinho**, com dados inventados.
> **Medalha:** 🌍 Cartógrafo.

> 🚫 **Lembrete:** no mundo real estas páginas moram em `superdrop.com.br` e `lojas.nextlevelgroup.com.br`. **Não acesse.** Use só os endereços do Treino abaixo.

## 1.A Site do SuperDrop (no Treino)

Antes de começar, garanta que o site está com a cara do SuperDrop: abra https://nextlevel-demo.onrender.com/lojas/sair.

### ⭐ Página inicial

- **Link:** https://nextlevel-demo.onrender.com/
- **O que tem lá:** o que é o SuperDrop, a esteira de pedidos "ao vivo" (animação), calculadora de venda, os papéis (Fornecedor, Membro, Parceiro), temas de loja, planos e perguntas frequentes.
- **Por que importa:** é a **porta de entrada**. Se o visitante não entender em 10 segundos, vai embora.
- **Como testar:** os 10 superpoderes. Use a **calculadora de venda**: mude os valores e veja se o resultado faz sentido (custo, preço, lucro). Clique em cada botão da página.
- **Anote:** em uma frase, o que o SuperDrop faz? A página promete ganho fácil em algum lugar (não pode)?

### Como funciona

- **Link:** https://nextlevel-demo.onrender.com/como-funciona
- **O que tem lá:** o passo a passo do dropshipping, do pedido do cliente até a entrega.
- **Como testar:** leia tudo e depois explique para alguém da sua casa sem olhar. Se você travar em alguma parte, a página não explicou bem.

### Planos

- **Link:** https://nextlevel-demo.onrender.com/planos
- **O que tem lá:** os planos e preços do lojista, o que cada um inclui, o teste grátis.
- **Por que importa:** é aqui que o cliente decide pagar.
- **Como testar:** compare dois planos. Fica claro o que um tem e o outro não? Os preços estão em "R$" com vírgula (ex.: R$ 49,90)? Tem alguma letra miúda que assusta?

### Perguntas frequentes

- **Link:** https://nextlevel-demo.onrender.com/faq
- **Como testar:** abra e feche cada pergunta. Ache uma dúvida que você teria e que **não** está lá: isso é uma 🟢.

### Criar loja (cadastro)

- **Link:** https://nextlevel-demo.onrender.com/cadastro
- **O que tem lá:** o formulário de criação de loja.
- **Por que importa:** é o momento em que o visitante vira cliente.
- **Como testar:** envie vazio; depois com e-mail sem @; depois **crie uma loja de teste completa** com dados inventados ("Loja Teste Samuel"). Quanto tempo levou? Para onde o sistema levou você depois?

### Quero minha loja

- **Link:** https://nextlevel-demo.onrender.com/quero-minha-loja
- **O que tem lá:** pedido de contato para quem quer ajuda.
- **Como testar:** envie um pedido inventado. Depois, no Mundo 9, procure esse pedido em **Interessados** do Master.

### Seja fornecedor

- **Link:** https://nextlevel-demo.onrender.com/seja-fornecedor
- **O que tem lá:** a página de vendas para fábricas e distribuidores entrarem no SuperDrop.
- **Como testar:** leia como se você fosse dono de uma fábrica de camisetas. Ficou com vontade? O que faltou para você confiar?
- **Bônus:** o endereço antigo https://nextlevel-demo.onrender.com/fornecedores deve levar sozinho para esta página. Confira.

### Programa de Parceiros (4 páginas)
| Página | Link (Treino) | O que testar |
|---|---|---|
| Apresentação | https://nextlevel-demo.onrender.com/parceiros | Entende como o parceiro ganha? Fica claro que **não** é promessa de ganho? |
| Cadastro | https://nextlevel-demo.onrender.com/parceiros/cadastro | Envie vazio; depois cadastre um parceiro inventado |
| Entrar | https://nextlevel-demo.onrender.com/parceiros/entrar | Entre com `parceira@demo.superdrop.com.br` / `demo1234` |
| Termos do programa | https://nextlevel-demo.onrender.com/parceiros/termos | Leia uma parte: é claro ou cheio de "juridiquês"? |

### Temas (vitrine de modelos de loja)

- **Links:** https://nextlevel-demo.onrender.com/temas e um tema, por exemplo https://nextlevel-demo.onrender.com/temas/lume
- **O que tem lá:** os modelos visuais que um lojista pode usar na loja dele. Alguns são grátis, outros pagos, organizados em **famílias** (moda, casa, esporte, beleza, celular, atacado) e **níveis** (N1 grátis até N4 marca própria).
- **Por que importa:** o tema é a "roupa" da loja; vende sozinho ou espanta o cliente.
- **Como testar:** abra pelo menos **5 temas** de famílias diferentes. Em cada um, aperte o botão de **ver a demonstração** (abre algo como https://nextlevel-demo.onrender.com/demo/lume). Teste a demonstração no modo celular.
- **Anote:** qual tema você usaria se tivesse uma loja? Por quê? Algum parece igual a outro?

### Entrada e senha
| Página | Link (Treino) | O que testar |
|---|---|---|
| Entrar | https://nextlevel-demo.onrender.com/login | Visual, textos, "Perfis de demonstração", link "Esqueci a minha senha" |
| Esqueci a senha | https://nextlevel-demo.onrender.com/esqueci-senha | Peça a troca para `samuel.lojista@familia.demo`. Na demonstração nenhum e-mail sai de verdade: anote o que a tela diz |

### Termos e privacidade (texto do grupo)

- **Links:** https://nextlevel-demo.onrender.com/termos e https://nextlevel-demo.onrender.com/privacidade
- **O que tem lá:** as regras de uso e como os dados das pessoas são cuidados. Foi publicado em 12/10 e está "em revisão jurídica".
- **Como testar:** leia o item "Sem promessa de ganho" e o item "Cookies". Você entendeu? Marque as frases difíceis.
- **Anote:** o rodapé de **todas** as páginas tem os links "Termos de uso" e "Política de privacidade"?

## 1.B Site da NextLevel Commerce (no Treino)

**Primeiro:** abra https://nextlevel-demo.onrender.com/lojas. O site muda de roupa e fica com a cara da Commerce. Agora abra as páginas abaixo. **No fim, abra https://nextlevel-demo.onrender.com/lojas/sair** para voltar ao SuperDrop.

| Página | Link (Treino, com a cara da Commerce) | O que tem | Como testar |
|---|---|---|---|
| ⭐ Início | https://nextlevel-demo.onrender.com/ | A super página de vendas da plataforma de lojas: lojas de exemplo, personalização, planos | Os 10 superpoderes. Compare com o que você conhece de Nuvemshop e Shopify (pesquise os nomes): o que eles fazem melhor? E pior? |
| Planos | https://nextlevel-demo.onrender.com/planos | Planos mensal/anual, simulador por faturamento, teste grátis | Mexa no simulador. O resultado muda? Faz sentido? |
| Temas | https://nextlevel-demo.onrender.com/temas | Os mesmos temas, com a cara da Commerce | São os mesmos do SuperDrop? A marca no topo mudou? |
| Criar minha loja | https://nextlevel-demo.onrender.com/cadastro | Cadastro da loja Commerce | Crie uma loja de teste com dados inventados |
| Dúvidas | https://nextlevel-demo.onrender.com/faq | Perguntas | São diferentes das do SuperDrop? |
| Termos | https://nextlevel-demo.onrender.com/termos | O mesmo texto do grupo | Diz "NextLevel Commerce" no topo? |

**Pergunta de agente:** o que muda entre o site do SuperDrop e o da Commerce? Faça uma lista com pelo menos 5 diferenças (cores, menu, textos, botões).

## 1.C NextLevel Soluções e Loja NextLevel (no Treino)

| Página | Link (Treino) | O que tem | Como testar |
|---|---|---|---|
| ⭐ Soluções | https://nextlevel-demo.onrender.com/solucoes | Tudo que a agência oferece: planos Commerce, Loja Pronta, Migração, marketing, consultoria, White Label; diagnóstico gratuito | Leia como um dono de empresa. Envie um pedido de diagnóstico inventado |
| Uma solução | https://nextlevel-demo.onrender.com/solucoes/migracao-lite (e as outras, pelos links da página) | Página de cada serviço: problema, resultado, escopo, preço | Abra **todas** as soluções da lista |
| Loja NextLevel | https://nextlevel-demo.onrender.com/loja-nextlevel | Loja de temas e serviços da NextLevel | Compre um tema com Pix de mentira. Guarde o link do pedido (Mundo 10) |

## 1.D Brás Digital, NextLevel Cargas e marcas "em breve"

As páginas públicas destas marcas **só existem no endereço real** de cada uma. Você vai conhecer a Brás e a Cargas **por dentro**, pelos painéis, nos Mundos 7 e 8.

> 🚫 **Só para referência, NÃO ACESSAR:** Brás Digital em `bras.nextlevelgroup.com.br`, NextLevel Cargas em `cargas.nextlevelgroup.com.br`, China Hub em `chinahubglobal.com.br`, Hub Creators em `hubcreators.nextlevelgroup.com.br`.

**Missão de imaginação (vale 🟢):** depois de terminar os Mundos 7 e 8, escreva como você acha que deveria ser a **página inicial** da Brás Digital: título, 3 seções e o botão principal.

## 1.E Arquivos para o Google (curiosidade técnica)
Todo site tem um arquivo que diz ao Google o que ele **pode** e **não pode** visitar.

- Abra https://nextlevel-demo.onrender.com/robots.txt
- Você vai ver `Disallow: /`, que quer dizer "Google, não visite nada daqui".
- **Desafio:** por que o Treino pede para o Google **não** visitar nada? (Dica: o que aconteceria se alguém achasse lojas de mentira pesquisando no Google?) No sistema real, cada marca tem um arquivo diferente, que libera as páginas públicas e proíbe os painéis.

✅ **Fim do Mundo 1.** Some o XP e cole a 🌍 medalha de Cartógrafo.

---

# MUNDO 2: Vitrines, temas e a experiência de compra

> **Onde:** 🧪 Treino. **Perfil:** nenhum (visitante) no começo.
> **Você é:** o **cliente final**, alguém que quer comprar uma camisa.
> **Medalha:** 🛍️ Cliente Oculto.

### O que é uma vitrine
Cada loja tem a sua **vitrine**: o site onde o cliente compra. O endereço é `/store/<nome-da-loja>` (ou `/loja/<nome-da-loja>`, que é o "apelido bonito").

### ⭐ As 7 telas da compra
| Tela | Link (Treino) | O que tem | Como testar |
|---|---|---|---|
| Vitrine (início da loja) | https://nextlevel-demo.onrender.com/store/arena-10 | Destaque, banners, categorias, vitrines de produto | Os 10 superpoderes |
| Catálogo (busca) | https://nextlevel-demo.onrender.com/store/arena-10/catalog | Todos os produtos, busca e filtros | Busque "camisa", depois "xyzxyz" (nada). A mensagem de "nada encontrado" é boa? |
| Produto | (clique num produto) `/store/arena-10/product/<produto>` | Fotos, tamanhos, preço, botão comprar | Escolha tamanho, mude quantidade. Tente comprar sem escolher tamanho |
| Carrinho | https://nextlevel-demo.onrender.com/store/arena-10/cart | Itens, quantidades, total | Some/diminua itens; a conta bate? Feche o navegador e abra de novo: o carrinho ficou? |
| Finalizar compra (checkout) | `/store/arena-10/checkout` | Dados, endereço, frete, pagamento (Pix ou cartão SIMULADOS) | Use dados inventados (regra 3). CEP `01001-000`. Pague o Pix de mentira |
| Pedido feito | `/store/arena-10/order/<número>` | Confirmação e situação do pedido | Guarde o número do pedido: você vai usar no Chefão 1 |
| Acompanhar pedido | https://nextlevel-demo.onrender.com/store/arena-10/acompanhar | Acompanhar pelo código | Coloque o código do seu pedido; depois um código inventado |

**Outras lojas para comparar:** `/store/mantos-shop`, `/store/fut-classics`, `/store/fio-linha` e as demonstrações de tema `/store/demo-lume`, `/store/demo-trama`, `/store/demo-signature`.

### Página do fornecedor

- **Link:** https://nextlevel-demo.onrender.com/f/megatron
- **O que tem:** a página de vendas do fornecedor para atrair lojistas para a rede dele.
- **Como testar:** você entraria na rede desse fornecedor? Por quê?

### Demonstração de temas em tela cheia

- **Link:** https://nextlevel-demo.onrender.com/demo/lume (troque `lume` por outros: `trama`, `lar`, `ninho`, `lance`, `torcida`, `varanda`, `atelier`, `morada`, `podio`, `petala`, `brilho`, `aura`, `musa`, `sinal`, `pulso`, `circuito`, `orbita`, `fardo`, `lote`, `galpao`, `porto`, `signature`)
- **Como testar:** escolha os **3 melhores** e os **3 piores** temas. Explique o porquê de cada um (cor, foto, organização, celular).

### Curiosidade: a marca certa
No sistema real, cada loja só abre no endereço da marca dela (uma loja da Commerce aberta no endereço do SuperDrop é levada para o endereço da Commerce). No Treino isso não acontece, porque lá todas as marcas moram no mesmo endereço.

✅ **Fim do Mundo 2.** Medalha 🛍️ se você fez **uma compra completa** com Pix simulado.

---

# MUNDO 3: Painel do Lojista (SuperDrop)

> **Onde:** 🧪 Treino. **Perfil:** `dono@arena10.demo` (Arena 10). **Você é:** o dono de uma loja sem estoque.
> **Endereço base:** https://nextlevel-demo.onrender.com/merchant
> **Medalha:** 🏪 Mão na Massa.

**Antes de tudo:** observe o **menu da esquerda**. Ele é dividido em grupos (Vendas, Catálogo, Loja virtual, Financeiro, Conta). No celular, ele vira um botão ☰. Teste os dois. Teste também a **busca do topo** (`Ctrl + K`): digite "pedidos" e veja se ela leva até lá.

### Vendas
| Tela | Link | O que tem lá | Por que importa | Como testar |
|---|---|---|---|---|
| ⭐ Início | /merchant | Resumo do dia, o que precisa de atenção, atalhos | É o "painel do carro" do lojista | O que é a **primeira coisa** que ele deveria fazer hoje? A tela diz? |
| ⭐ Pedidos | /merchant/orders | Lista de pedidos, filtros, situação de cada um | Sem pedido não tem dinheiro | Filtre, busque, abra um pedido. A gaveta lateral abre e fecha bem? |
| Um pedido | /merchant/orders/&lt;id&gt; | Itens, cliente, pagamento, envio, histórico | Detalhe para resolver problemas | Ache o pedido que você fez no Mundo 2 |
| Imprimir pedido | /merchant/orders/&lt;id&gt;/print | Versão para imprimir | Papel para separar e embalar | `Ctrl + P`: cabe numa folha? |
| Novo pedido | /merchant/orders/new | Pedido feito à mão (venda pelo WhatsApp, por exemplo) | Nem toda venda é pelo site | Crie um pedido inventado |
| Propostas | /merchant/orders/propostas | Orçamentos enviados por link ao cliente | Venda consultiva | Crie uma e abra o link (Mundo 10) |
| Pós-venda | /merchant/after-sales | Trocas, devoluções, reclamações | Cliente bem atendido volta | Abra um caso. Os passos são claros? |
| Etiquetas | /merchant/labels | Etiquetas de envio | Sem etiqueta não tem entrega | Tente gerar ou ver uma |
| Clientes | /merchant/customers | Lista de quem comprou | Conhecer o cliente | Busque um nome; abra um cliente (/merchant/customers/&lt;id&gt;) |
| Análise | /merchant/analytics | Gráficos de vendas | Decidir com números | Os números batem com a lista de pedidos? Os gráficos têm legenda? |

### Catálogo
| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| ⭐ Catálogo | /merchant/products | Produtos do fornecedor que a loja vende, preço de venda, margem | Mude o preço de um produto: o lucro (margem) aparece? Ponha preço **menor** que o custo: o sistema avisa? |
| Produtos próprios | /merchant/catalogo | Produtos cadastrados pela própria loja | Crie um (/merchant/catalogo/new). Abra a ficha (/merchant/catalogo/&lt;id&gt;) |
| Categorias | /merchant/catalogo/categorias | Organização dos produtos | Crie a categoria "Teste Samuel" |
| Importar | /merchant/catalogo/import | Subir muitos produtos de uma vez por planilha | Só leia as instruções: dá para entender? |
| Conteúdo | /merchant/content | Fotos e textos prontos para redes sociais | Baixe uma imagem |

### Loja virtual
| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| ⭐ Loja virtual | /merchant/storefront | Publicar a loja, endereço, domínio | Ache o link da sua loja e abra |
| ⭐ Editor do tema | /theme-editor | Editor em tela cheia: muda cores, textos, banners, seções, com **prévia ao vivo** | Mude a cor principal, um texto e um banner. Veja a prévia. Publique (é Treino). Abra a vitrine e confira |
| Temas | /merchant/templates | Escolher, testar e comprar temas | Use "testar com os meus produtos" num tema pago. Saia do teste |
| Campanhas | /merchant/campanhas | Faixa de aviso no topo da loja ("Frete grátis hoje!") | Crie uma e veja na vitrine |
| Cupons | /merchant/descontos | Cupons de desconto | Crie `SAMUEL10` e use na compra do Mundo 2 |
| Avaliações | /merchant/avaliacoes | Notas e comentários dos clientes | Aprove/esconda uma |
| Avise-me | /merchant/avise-me | Clientes esperando produto voltar ao estoque | Só olhar |
| Atacado | /merchant/atacado | Preços para quem compra em quantidade | Leia: para que serve? |
| Aparência (antiga) | /merchant/appearance | Endereço antigo | Para onde leva? |

### Financeiro e conta
| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| ⭐ Saldo e recargas | /merchant/wallet | Saldo para pagar o custo dos pedidos; recarga por Pix | Faça uma recarga de R$ 50 com Pix simulado. O saldo subiu? |
| Financeiro | /merchant/finance | Faturas da NextLevel, plano, pagamentos | O que acontece se a fatura atrasar? A tela explica? |
| Loja NextLevel (serviços) | /merchant/services | Temas e serviços para comprar dentro do painel | Abra um serviço (/merchant/services/&lt;id&gt; e /merchant/services/solucao/&lt;nome&gt;) |
| Equipe | /merchant/team | Convidar funcionários | Convide `ajudante@exemplo.com` |
| Histórico (auditoria) | /merchant/auditoria | Quem fez o quê e quando | Ache a sua mudança de preço lá |
| Configurações | /merchant/settings | Dados da loja, Mercado Pago, envios | **Não** cole nada de verdade. Só olhe os campos |

✅ **Fim do Mundo 3.**

---

# MUNDO 4: Painel da Loja (NextLevel Commerce)

> **Onde:** 🧪 Treino. **Perfis:** `lojista@commerce.demo` (Fio & Linha, loja simples) e `completo@commerce.demo` (Casa Aurora, loja completa).
> **Diferença principal para o SuperDrop:** aqui a loja tem **estoque próprio**; não existe fornecedor nem recarga de saldo.
> **Medalha:** 🎨 Designer.

### Missão comparativa

1. Entre como `lojista@commerce.demo` e percorra **todo o menu**.
2. Saia e entre como `completo@commerce.demo`. Percorra de novo.
3. Monte uma tabela: **o que a loja completa tem que a simples não tem?**
4. Compare com o Mundo 3: **o que o lojista SuperDrop tem que o Commerce não tem**, e o contrário?

### Telas
Os endereços são os mesmos do Mundo 3, mas o conteúdo muda. Atenção especial a:
| Tela | Link | O que observar |
|---|---|---|
| ⭐ Início | /merchant | É diferente do SuperDrop? Fala de estoque? |
| ⭐ Produtos | /merchant/catalogo | Cadastro completo: fotos, tamanhos (grade), estoque, preço |
| Novo produto | /merchant/catalogo/new | Cadastre "Camiseta Teste Samuel" com 3 tamanhos e foto. Depois ache na vitrine |
| Categorias | /merchant/catalogo/categorias | Organize |
| Atacado | /merchant/atacado | Lista de preços de atacado |
| Cupons, Campanhas, Avaliações, Avise-me | /merchant/descontos, /merchant/campanhas, /merchant/avaliacoes, /merchant/avise-me | Igual ao Mundo 3 |
| ⭐ Editor do tema | /theme-editor | **Missão Designer:** transforme a Fio & Linha numa loja com cara de Natal (cores, banner, texto). Print antes e depois |
| Análise | /merchant/analytics | Gráficos |
| Financeiro | /merchant/finance | Plano Commerce e a taxa de plataforma |
| Equipe | /merchant/team | Funções e permissões |
| Histórico | /merchant/auditoria | Registro das ações |

### Teste de permissões (equipe)
Entre como `paulo@casaaurora.demo` e depois `sofia@casaaurora.demo` (funcionários da Casa Aurora). **O que eles conseguem ver e o que fica bloqueado?** Um funcionário consegue ver o financeiro? Deveria?

✅ **Fim do Mundo 4.**

---

# MUNDO 5: Fornecedor e Expedição

> **Onde:** 🧪 Treino. **Perfis:** `megatron@superdrop.demo` (dono do fornecedor) e `expedicao@megatron.demo` (funcionário que embala).
> **Você é:** o galpão que guarda os produtos e envia para os clientes de todos os lojistas da rede.
> **Medalha:** 🏭 Chefe de Galpão.

### Operação
| Tela | Link | O que tem lá | Por que importa | Como testar |
|---|---|---|---|---|
| ⭐ Esteira | /supplier | Os pedidos chegando ao vivo, como uma esteira de fábrica | O coração do galpão | Faça uma compra no Mundo 2 e veja ela chegar aqui |
| Corte e operação | /supplier/operations | **Horário de corte** (pedido até X horas sai hoje), **ondas** de separação | Organiza o trabalho do dia | O que é "onda"? A tela explica? |
| Pedidos | /supplier/orders | Todos os pedidos da rede | Controle | Abra um (/supplier/orders/&lt;id&gt;) e a impressão (/supplier/orders/&lt;id&gt;/print) |

### Catálogo
| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| ⭐ Produtos | /supplier/products | Produtos do fornecedor, custo, preço sugerido | Abra um (/supplier/products/&lt;id&gt;) |
| Novo produto | /supplier/products/new | Cadastro com grade de tamanhos | Cadastre um. Ele aparece para os lojistas? |
| Importar planilha | /supplier/products/import | Cadastro em massa | Leia as instruções |
| Categorias | /supplier/products/categorias | Organização (essa tela estava "escondida" até 12/10 e ganhou lugar no menu) | Ache pelo menu |
| Estoque | /supplier/inventory | Quantidades, estoque mínimo | Zere o estoque de um produto: ele some da vitrine do lojista? |
| Conteúdo | /supplier/content | Fotos e textos para os lojistas divulgarem | Só olhar |

### Rede e dinheiro
| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| Lojistas | /supplier/stores | Lojas da rede deste fornecedor | Crie uma (/supplier/stores/new) |
| Minha loja | /supplier/store | A loja própria do fornecedor | Só olhar |
| Recargas | /supplier/wallets | Saldo que cada lojista recarregou | Bate com a recarga do Mundo 3? |
| Faturas | /supplier/invoices | O que o fornecedor paga à NextLevel | Se atrasar, o que acontece? |
| Financeiro | /supplier/finance | Resumo do dinheiro | Os números fazem sentido? |
| Equipe | /supplier/team | Funcionários | Só olhar |
| Loja NextLevel | /supplier/services | Serviços para comprar | Abra um serviço |
| Configurações | /supplier/settings | Dados, Mercado Pago, plataforma de envio | Só olhar |
| Envio (antigo) | /supplier/shipping | Endereço antigo | Para onde leva? |

### Expedição (entre como `expedicao@megatron.demo`)
| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| ⭐ Tela da expedição | /supplier/dispatch | Tela simples para quem embala: o que separar agora | **Não deve mostrar valores em dinheiro.** Mostra? (Se mostrar, é 🔴) |
| Imprimir etiquetas | /supplier/dispatch/print | Etiquetas em PDF | Imprima em PDF (`Ctrl + P`, "Salvar como PDF") |
| Uma onda | /supplier/dispatch/wave/&lt;id&gt; | Os pedidos de uma onda | Marque um como embalado |
| Enviados | /supplier/dispatch/shipped | O que já saiu | O pedido que você embalou apareceu? |

**Teste de permissão:** com o perfil de expedição, tente abrir https://nextlevel-demo.onrender.com/supplier/finance. Deveria **barrar**. Barrou?

✅ **Fim do Mundo 5.**

---

# MUNDO 6: Parceiro

> **Onde:** 🧪 Treino. **Perfil:** `parceira@demo.superdrop.com.br`.
> **Você é:** alguém que indica clientes e ganha comissão.
> **Medalha:** 🤝 Embaixador.

| Tela | Link | O que tem lá | Por que importa | Como testar |
|---|---|---|---|---|
| ⭐ Início | /partner | Resumo: indicações, comissões, próximos pagamentos | Motiva o parceiro | Os números estão claros? Tem promessa de ganho? (não pode) |
| Links | /partner/links | Links de indicação com o código do parceiro | É assim que a indicação é registrada | Copie um link e abra numa **janela anônima** do Treino. A indicação "grudou"? |
| Cupons de 7 dias | /partner/coupons | Cupons para o cliente testar | Crie um |
| Catálogo comercial | /partner/catalogo | Produtos que o parceiro pode vender e a comissão de cada um | Qual paga mais? |
| CRM de clientes | /partner/crm | Clientes que o parceiro acompanha | Cadastre um cliente inventado |
| Indicados | /partner/referrals | Quem entrou pelo link | A sua indicação apareceu? |
| Financeiro | /partner/finance | Comissões: em carência, liberadas, pagas | O que é "carência"? A tela explica? |
| Meu perfil | /partner/profile | Dados e chave Pix | **Não** coloque Pix de verdade |

✅ **Fim do Mundo 6.**

---

# MUNDO 7: Brás Digital

> **Onde:** 🧪 Treino. **Medalha:** 🧳 Atacadista.
> **Atenção:** alguns painéis da Brás podem estar **desligados** de propósito. Se aparecer um aviso dizendo isso, anote e siga.

### 7.A Meu Brás (entre como `membro@bras.demo`)
Você é uma loja que compra caixas fechadas no atacado.
| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| ⭐ Início | /meu-bras | Novidades, pedidos, atalhos | O que um membro faz primeiro? |
| Descobertas | /meu-bras/videos | Vídeos de produtos encontrados nas importadoras | Assista a um. Abra a descoberta (/meu-bras/descoberta/&lt;id&gt;) |
| Pedir | /meu-bras/pedir/&lt;id&gt; | Pedido de caixas de um produto | Faça um pedido de teste |
| Meus pedidos | /meu-bras/pedidos | Pedidos feitos | Abra o comprovante de retirada (/meu-bras/pedidos/&lt;id&gt;/retirada) |
| Fretes | /meu-bras/fretes | Escolher transportadora ou ônibus de excursão | Compare opções de frete |
| Etiquetas de frete | /meu-bras/fretes/etiquetas | Etiquetas | Só olhar |
| Meu Contador | /meu-bras/meu-contador | Ajuda com notas fiscais | Para que serve? |
| Indique e ganhe (Club) | /meu-bras/club | Pontos por indicação | Como ganha pontos? |
| Suporte | /meu-bras/suporte | Falar com a equipe | Abra um chamado de teste |
| Minha empresa | /meu-bras/empresa | Dados do CNPJ | Só olhar |
| Meu perfil | /meu-bras/perfil | Dados pessoais | Só olhar |

### 7.B Importadora (entre como `importadora@bras.demo`)
| Tela | Link | O que tem lá |
|---|---|---|
| ⭐ Hoje | /importadora | O que precisa ser feito hoje |
| Pedidos | /importadora/pedidos | Pedidos dos membros |
| Produtos e caixas | /importadora/produtos | Produtos, quantos vêm por caixa |
| Estoque | /importadora/estoque | Caixas disponíveis |
| Transportadoras | /importadora/transportadoras | Quem leva |
| Galpões, equipe e ficha | /importadora/galpoes | Endereços, funcionários, dados |
| Indique e ganhe | /importadora/indicacoes | Indicação |

**Como testar:** o pedido que você fez como membro aparece aqui? Mude a situação dele e volte ao Meu Brás: mudou lá também?

### 7.C Balcão (entre como `balcao@bras.demo`)
O balcão é o atendente na loja física. Ele recebe um **link secreto** (Mundo 10). Observe: o que ele consegue fazer e o que não consegue?

✅ **Fim do Mundo 7.**

---

# MUNDO 8: NextLevel Cargas

> **Onde:** 🧪 Treino. **Perfis:** `transportadora@cargas.demo` e `onibus@cargas.demo`.
> **Medalha:** 🚚 Caminhoneiro.

| Tela | Link | O que tem lá | Como testar |
|---|---|---|---|
| ⭐ Hoje | /transportadora | Cargas do dia | Fica claro o que buscar e onde? |
| Cargas | /transportadora/cargas | Todas as cargas, situação | Aceite uma carga |
| Rotas e viagens | /transportadora/rotas | Rotas fixas e viagens (ônibus de excursão) | Crie uma viagem de teste |
| Importadoras na rede | /transportadora/importadoras | Clientes da transportadora | Só olhar |
| Extrato | /transportadora/extrato | Dinheiro a receber | Faz sentido? |
| Perfil e motorista | /transportadora/perfil | Dados e link do motorista | Gere o link do motorista (Mundo 10) |
| Indique e ganhe | /transportadora/indicacoes | Indicação | Só olhar |

**Comparação:** o painel do **ônibus** é diferente do da **transportadora**? Em quê?

✅ **Fim do Mundo 8.**

---

# MUNDO 9: O Master (a sala de controle)

> **Onde:** 🧪 Treino. **Perfil:** `master@nextlevel.demo` ("Equipe NextLevel").
> **Você é:** o seu pai. Aqui se vê **todas** as lojas, todo o dinheiro e todas as regras.
> **Regra extra:** no Treino pode mexer, mas **anote cada mudança** (o que, onde, horário).
> **Medalha:** 👑 Guardião do Master.

### 9.A Operação
| Tela | Link | O que tem lá | Por que importa | Como testar |
|---|---|---|---|---|
| ⭐ Dashboard | /master | Os números do grupo, alertas | Visão do todo em um olhar | O que está pedindo atenção agora? |
| ⭐ Clientes e suporte | /master/clientes | Achar qualquer cliente e entrar no "modo suporte" (ver o painel como ele vê) | Ajudar cliente sem pedir senha | Ache a "Arena 10" e entre no modo suporte. Aparece um aviso de que você está em modo suporte? Saia |
| Pedidos | /master/orders | Todos os pedidos de todas as lojas | Controle geral | Ache o seu pedido do Mundo 2 (/master/orders/&lt;id&gt;) |
| Resumo do dia | /master/summary | O que aconteceu hoje | Rotina do dono | Faz sentido? |
| Erros do sistema | /master/errors | Erros registrados | Detectar problemas | Tem algum? Anote |
| Integridade dos dados | /master/integridade | Conferência automática de dados "tortos" | Saúde do banco de dados | O que ela verifica? |
| ⭐ Central de qualidade | /master/qualidade | Todas as telas do sistema, com abas: **Todas as telas, Uma por uma, O que falta, Domínios, Checagem automática, Mapa vivo, Pronto e desligado** | É a ferramenta oficial de teste do seu pai! | Na aba **Uma por uma**, marque 5 telas como "testada". Na aba **Mapa vivo**, abra um galho e aperte "Checar este galho". Na aba **Pronto e desligado**, veja as funções que o seu pai ligou na demonstração para você testar (no sistema real elas ainda estão desligadas) e anote as que continuam desligadas e por quê. 🚫 **Não clique em "Abrir" nem nas siglas dos endereços (MA, SD, CM, BD, CG): eles levam ao sistema real.** Abra as telas pelo menu |
| CRM Loja NextLevel | /master/crm | Pedidos da Loja NextLevel, do pagamento à entrega | Vender serviços | Abra um (/master/crm/&lt;id&gt;) |
| Loja NextLevel | /master/services | A loja de temas e serviços vista por dentro | | Abra um serviço (/master/services/&lt;id&gt;) |

### 9.B Rede
| Tela | Link | O que tem lá |
|---|---|---|
| Fornecedores | /master/suppliers | Todos os fornecedores; novo em /master/suppliers/new |
| Redes | /master/networks | Redes (fornecedor + lojistas) |
| Lojas | /master/stores | Todas as lojas; uma loja em /master/stores/&lt;nome&gt; |
| Catálogo | /master/catalog | Produtos de todo o sistema |
| Página de cada marca | /master/marcas/superdrop e /master/marcas/commerce | Resumo por marca |

### 9.C Negócio (o dinheiro e as regras)
| Tela | Link | O que tem lá |
|---|---|---|
| ⭐ Financeiro NextLevel | /master/financeiro | Visão executiva do dinheiro do grupo, com abas no topo |
| Operação SuperDrop | /master/financeiro/operacao | Receitas, contratos, faturas e simulador do SuperDrop (antigo /master/finance: teste que o endereço antigo leva para cá) |
| Preços do grupo | /master/financeiro/precos | Tabela única de preços de todas as marcas |
| Descoberta | /master/financeiro/descoberta | Questionário e dados para decidir preço |
| Proposta de preço | /master/financeiro/proposta | A proposta de preços (rascunho ou aprovada) |
| Propostas | /master/financeiro/propostas | Lista de propostas |
| Experimentos | /master/financeiro/experimentos | Testar preços diferentes com grupos de clientes |
| Catálogo e preços | /master/financeiro/catalogo (um item: /master/financeiro/catalogo/&lt;chave&gt;) | Produtos que a NextLevel vende e preço com versões |
| Ofertas e comissões | /master/financeiro/ofertas | Ofertas de entrada (teste grátis…) e comissões |
| Assinaturas | /master/financeiro/assinaturas | Quem assina o quê |
| Pagamentos | /master/financeiro/pagamentos | Pagamentos recebidos |
| Gateways | /master/financeiro/gateways | Mercado Pago e Pagar.me |
| Parceiros (financeiro) | /master/financeiro/parceiros | Comissões dos parceiros |
| Jornada | /master/financeiro/jornada | O caminho do cliente dentro do painel até comprar |
| Auditoria | /master/financeiro/auditoria | Registro de tudo que mudou no dinheiro (não se apaga) |
| SuperDrop (resumo) | /master/financeiro/superdrop | Resumo do SuperDrop |
| Torre do Ecossistema | /master/ecossistema | Como as marcas se ajudam (benefícios cruzados) |
| Parceiros | /master/partners (um parceiro: /master/partners/&lt;id&gt;) | Programa de parceiros |
| Planos | /master/plans | Planos dos lojistas |
| Templates | /master/templates | Temas: aprovar, liberar |
| Escritório virtual | /master/office | Ferramentas do dia a dia da equipe |
| Equipe do Master | /master/equipe | Funcionários e o que cada um pode fazer |
| Configurações | /master/settings | Conta Mercado Pago da NextLevel e ajustes gerais (**no Treino, só olhar**) |
| Endereços antigos | /master/bras, /master/commerce | Para onde levam? |

**Como testar o Negócio:** escolha **3 telas** e explique, com as suas palavras, o que o seu pai decide nelas. Exemplo: "Em Experimentos, ele testa se um preço mais barato traz mais clientes".

### 9.D Admin Commerce (equipe NextLevel)
| Tela | Link | O que tem lá |
|---|---|---|
| Visão geral | /commerce | Resumo de todas as lojas Commerce |
| Lojas | /commerce/stores | Lojas Commerce |
| Vendas | /commerce/orders | Pedidos das lojas Commerce |
| Catálogo das lojas | /commerce/catalog | Produtos |
| Interessados | /commerce/leads | Quem pediu contato ("Quero minha loja") |
| Assinaturas | /commerce/plans | Planos das lojas |
| Plataforma | /commerce/settings | Ajustes da Commerce |

### 9.E Estúdio Brás (equipe NextLevel)
| Tela | Link | O que tem lá |
|---|---|---|
| Visão geral | /bras/visao | Resumo da Brás |
| Pedidos | /bras | Pedidos dos membros |
| Atendimento | /bras/atendimento | Chamados de suporte |
| Comissões | /bras/comissoes | Comissões da Brás |
| Descobertas | /bras/descobertas | Vídeos de produtos |
| Pauta de conteúdo | /bras/pauta | Planejamento de vídeos |
| Importadoras | /bras/importadoras (uma: /bras/importadoras/&lt;id&gt;) | Cadastro das importadoras |
| Ônibus de excursão | /bras/excursao | Rotas e regras dos ônibus |
| Transportadoras | /bras/transportadoras | Transportadoras da Cargas |
| Membros | /bras/membros | Quem é membro |
| Club | /bras/club | Pontos e benefícios |
| Acesso e planos | /bras/acesso | Planos dos membros |
| Meu Contador | /bras/meu-contador | Serviço de contabilidade |
| Empresas do grupo | /bras/grupo | Empresas e autorizações |
| Planos e regras | /bras/regras | Regras configuráveis |
| Balcão | /bras/balcao | Gerar links de balcão |
| Romaneio | /bras/romaneio/&lt;id&gt; | Lista de carga para conferência |

### 9.F Funcionários do Master
Saia e entre como `comercial@nextlevel.demo`, depois `financeiro@nextlevel.demo`, `suporte@nextlevel.demo` e `contador@nextlevel.demo`. **Monte uma tabela: o que cada um vê e o que não vê.** O comercial consegue ver o financeiro? Deveria?

✅ **Fim do Mundo 9.**

---

# MUNDO 10: Links secretos e a sua conta

> **Onde:** 🧪 Treino. Estes links não aparecem em menu: são enviados por e-mail ou WhatsApp para uma pessoa específica. Por isso têm um **código longo** no fim (o "token").
> **Medalha:** 🗝️ Chaveiro.

| Link secreto | Exemplo | Quem recebe | Como conseguir no Treino | Como testar |
|---|---|---|---|---|
| Pedido da loja | /store/&lt;loja&gt;/order/&lt;id&gt; | O cliente que comprou | Fazendo a compra do Mundo 2 | Abra numa janela anônima. Funciona sem login? Mostra dados demais? |
| Proposta | /store/&lt;loja&gt;/proposta/&lt;código&gt; | Cliente que recebeu orçamento | Criando no Mundo 3 (Propostas) | Aceite a proposta |
| Pedido da Loja NextLevel | /loja-nextlevel/pedido/&lt;código&gt; | Quem comprou tema ou serviço | Comprando na Loja NextLevel do Treino | Situação do pedido |
| Descoberta compartilhada | /d/&lt;id&gt; | Quem recebeu o vídeo da Brás | Compartilhando no Meu Brás | Abre sem login? |
| Balcão | /balcao/&lt;código&gt; e /balcao-club/&lt;código&gt; | Atendente da importadora | Estúdio Brás > Balcão | O que dá para fazer? |
| Motorista | /motorista/&lt;código&gt; | Motorista da transportadora | Transportadora > Perfil | Funciona bem no celular? |
| Nova senha | /redefinir-senha/&lt;código&gt; | Quem pediu nova senha | (precisa de e-mail; pule) | — |

**Teste de segurança importante:** troque **uma letra** do código de um link secreto e abra. O sistema deve mostrar "não encontrado" e **não** os dados de outra pessoa.

### Sua conta (qualquer perfil)
| Tela | Link | O que tem |
|---|---|---|
| Trocar a senha | /account/password | Mudar senha (no Treino, teste com senha curta: o erro aparece?) |
| Suas marcas | /account/marcas | Para quem tem conta em mais de uma marca |

### Telas só do Treino (bônus)
| Tela | Link | O que tem |
|---|---|---|
| Galeria de design | /dev/design e /dev/design/amostra | Todos os "tijolos" visuais do sistema (botões, cartões, cores) |
| Estúdio de gravação | /gravacao | Modo para gravar vídeos de demonstração |

✅ **Fim do Mundo 10.**

---

## 👹 Os Chefões: jornadas de ponta a ponta

Um chefão só é derrotado se você seguir a jornada **inteira**, trocando de personagem, e conferir que a informação **viajou certa** entre os painéis. Cada um vale **200 XP**.

### Chefão 1: "A Camisa Viajante" (SuperDrop completo)

1. **Lojista** (`dono@arena10.demo`): recarregue R$ 200 de saldo por Pix simulado.
2. **Cliente** (janela anônima): compre uma camisa na vitrine `/store/arena-10` com o cupom que você criou.
3. **Lojista:** o pedido apareceu? O saldo baixou o valor do custo?
4. **Fornecedor** (`megatron@superdrop.demo`): o pedido chegou na Esteira?
5. **Expedição** (`expedicao@megatron.demo`): embale, imprima a etiqueta, marque como enviado.
6. **Cliente:** em `/store/arena-10/acompanhar`, a situação mudou?
7. **Master:** ache o pedido em `/master/orders`.
8. **Anote:** em quais passos a informação **demorou**, **sumiu** ou **ficou diferente**? Algum valor em dinheiro não bateu?

### Chefão 2: "A Loja do Zero" (Commerce)

1. Como `lojista@commerce.demo`: cadastre 3 produtos com foto, preço e estoque.
2. Mude o tema e as cores no editor. Publique.
3. Crie um cupom e uma campanha.
4. Como cliente: compre 2 produtos usando o cupom.
5. Volte ao painel: o estoque baixou? A venda aparece na Análise?

### Chefão 3: "O Indicador" (Parceiro)

1. Como parceira: copie o seu link de indicação.
2. Janela anônima: abra o link e crie uma loja no **Treino** com dados inventados.
3. Como parceira: a indicação apareceu em Indicados? A comissão aparece no Financeiro (em carência)?
4. Como Master: o parceiro e a comissão aparecem em `/master/partners`?

### Chefão 4: "A Caixa do Brás" (Brás + Cargas)

1. Como membro: assista a uma descoberta e peça 1 caixa.
2. Como importadora: confirme o pedido.
3. Escolha frete; como transportadora, aceite a carga.
4. Como membro: abra o comprovante de retirada.

### Chefão 5: "O Inspetor do Inspetor" (Master)

1. Na Central de qualidade, aba **Uma por uma**: marque como "testada" cada tela que você já inspecionou neste guia.
2. Na aba **O que falta**: quantas telas ainda faltam?
3. Compare com o seu Apêndice. Os números batem?

---

## 🧙 Desafios de Mestre (nível avançado)

Para quem quer ir além. Pense como engenheiro, designer e dono de empresa.

### Desafio 1 🛡️ "Hacker do Bem" (300 XP), **só no Treino**
O sistema promete que **um lojista nunca vê dados de outro**. Tente quebrar essa promessa:

1. Entre como `dono@arena10.demo`, abra um pedido e copie o endereço (ex.: `/merchant/orders/123`).
2. Saia, entre como `dono@mantosshop.demo` e cole o mesmo endereço.
3. O que aparece? O certo é "não encontrado" ou "sem acesso". Se aparecer o pedido da Arena 10, é o **🔴 mais grave do guia**: pare tudo e chame o seu pai.
4. Repita com clientes (`/merchant/customers/<id>`), produtos e com o fornecedor Central Sports tentando ver pedidos da Mega Tron.
5. Tente também abrir `/master` com um perfil de lojista.

### Desafio 2 💰 "Contador" (200 XP)
O sistema guarda todo dinheiro em **centavos** (R$ 49,90 vira 4990). Por que você acha que os programadores fazem isso? (Dica: tente somar 0,1 + 0,2 numa calculadora de programação, como o console do navegador: `F12`, aba Console, digite `0.1 + 0.2` e Enter.) Depois procure no sistema um valor que pareça **arredondado errado**.

### Desafio 3 🧭 "Arquiteto da Informação" (200 XP)
Desenhe (papel ou computador) o **mapa** do painel do lojista: menu, grupos e telas. Depois proponha um mapa **melhor**. Explique por que o seu é melhor.

### Desafio 4 🎨 "Crítico de Design" (150 XP)
Escolha **as 5 telas mais bonitas** e **as 5 mais feias** do sistema inteiro. Para cada feia, diga **uma** mudança que a deixaria melhor.

### Desafio 5 ⚡ "Velocista" (150 XP)
Meça com cronômetro quanto tempo leva para: (a) achar um pedido pelo nome do cliente; (b) mudar o preço de um produto; (c) criar um cupom. Depois tente fazer mais rápido usando a busca `Ctrl + K`. Qual tarefa precisa de atalho?

### Desafio 6 🧑‍🦯 "Acessibilidade" (200 XP)
Faça uma compra inteira **sem mouse** (só teclado). Depois tente com zoom 200%. Liste onde travou.

### Desafio 7 🏁 "Concorrência" (200 XP)
Compare a página inicial da Commerce com Shopify, Nuvemshop e Wix. Monte uma tabela: o que cada uma faz melhor. Termine com **3 ideias** que a NextLevel deveria copiar (do jeito dela).

### Desafio 8 🧪 "Caso extremo" (150 XP)
No Treino, tente coisas que um cliente maluco faria: comprar 9.999 unidades; nome com 200 letras; emoji no nome do produto 🧢; preço R$ 0,01; cupom de 100%. O sistema aguenta? As mensagens são boas?

---

## 🏆 Relatório final

Quando terminar (ou a cada mundo concluído), monte o relatório neste formato e entregue ao seu pai:

```
RELATÓRIO DO AGENTE SAMUEL
Período: __/__ a __/__        Patente final: ____________    XP total: ______
Telas inspecionadas: ___ de 213        Medalhas: ______________________

1. TOP 5 PROBLEMAS MAIS GRAVES (🔴), com os 3 passos e print
2. TOP 5 CONFUSÕES (🟠)
3. TOP 10 DETALHES VISUAIS (🟡)
4. TOP 10 IDEIAS (🟢)
5. AS 3 MELHORES TELAS DO SISTEMA (e por quê)
6. AS 3 PIORES TELAS (e o que eu mudaria)
7. SE EU FOSSE O DONO, A PRIMEIRA COISA QUE EU FARIA AMANHÃ SERIA: ________
8. O QUE EU APRENDI SOBRE COMO UMA EMPRESA DE TECNOLOGIA FUNCIONA: ________
```

**Para o pai:** cole o relatório (ou fotos das fichas) aqui na conversa com o Claude. Cada 🔴 vira correção com teste; cada 🟢 vira proposta para você aprovar.

---

## 📖 Glossário (dicionário do Agente)

| Palavra | O que significa |
|---|---|
| **Painel** | A área de trabalho de cada pessoa, depois do login |
| **Vitrine** | O site da loja, onde o cliente compra |
| **Lojista / Membro** | Dono de uma loja |
| **Fornecedor / Central** | Quem tem o estoque e envia (SuperDrop) |
| **Dropshipping** | Vender sem ter o produto em casa: o fornecedor envia direto ao cliente |
| **Expedição** | Setor que separa, embala e envia |
| **Onda** | Um grupo de pedidos separados juntos, para ganhar tempo |
| **Horário de corte** | Pedido feito até esse horário sai no mesmo dia |
| **Etiqueta** | O papel colado na caixa com o endereço e o código de rastreio |
| **Saldo / Recarga** | Dinheiro que o lojista deixa guardado para pagar o custo dos pedidos |
| **Fatura** | Conta que a NextLevel cobra (mensalidade, taxas) |
| **Pix** | Pagamento instantâneo do Banco Central |
| **Mercado Pago / Pagar.me** | Empresas que processam pagamentos ("gateways") |
| **Checkout** | A tela de finalizar a compra |
| **Cupom** | Código de desconto |
| **Campanha** | Faixa de aviso na loja ("Frete grátis hoje") |
| **Tema / Template** | O visual pronto de uma loja |
| **Editor do tema** | Onde se muda o visual da loja |
| **Parceiro / Afiliado** | Quem indica clientes e ganha comissão |
| **Comissão** | Parte do valor paga a quem indicou |
| **Carência** | Tempo de espera antes da comissão ser liberada (caso o cliente desista) |
| **CRM** | Lista organizada de clientes e contatos |
| **Lead / Interessado** | Pessoa que pediu informação mas ainda não comprou |
| **Master** | O painel central da NextLevel, que controla tudo |
| **Modo suporte** | O Master vê o painel do cliente como ele vê, para ajudar |
| **Isolamento entre clientes** (*tenant*) | Regra de que uma loja nunca vê dados de outra |
| **Redirecionamento** | Quando você abre um endereço e o sistema leva você para outro |
| **Domínio** | O nome do site (ex.: `superdrop.com.br`) |
| **Produção** | O sistema de verdade, com clientes (o Mundo Real, que você **não** acessa) |
| **Demonstração / Ambiente de teste** | A cópia com dados de mentira (Mundo de Treino) |
| **Bug** | Defeito no programa |
| **Token / Link secreto** | Código longo num link que funciona como uma chave |
| **robots.txt / sitemap.xml** | Arquivos que orientam o Google |
| **CNPJ** | O "CPF" de uma empresa |
| **Atacado** | Venda em grande quantidade, mais barata por unidade |
| **Romaneio** | Lista de tudo que vai numa carga |
| **White Label** | Plataforma com a marca do cliente, sem aparecer a NextLevel |

**Resposta da pergunta da seção 3:** o lucro do lojista é **R$ 100 − R$ 55 = R$ 45**, menos as taxas e a mensalidade da NextLevel e a taxa do Mercado Pago. Por isso a tela de catálogo do lojista mostra a **margem**: é ela que diz se vale a pena vender.

---

## ✅ Apêndice: checklist das 213 telas

Marque `[x]` quando preencher a ficha da tela. Todas as telas são abertas no Treino (https://nextlevel-demo.onrender.com). Telas com `[id]`, `[slug]`, `[token]` ou `[key]` são detalhes: abra a partir da lista correspondente.


### Páginas públicas (22 telas · Mundo 1)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Página inicial | `/` |  |  |
| [ ] | Ativação de outra marca | `/ativar` |  |  |
| [ ] | Criar conta | `/cadastro` |  |  |
| [ ] | Como funciona | `/como-funciona` |  |  |
| [ ] | Esqueci senha | `/esqueci-senha` |  |  |
| [ ] | Faq | `/faq` |  |  |
| [ ] | Fornecedores | `/fornecedores` |  |  |
| [ ] | Entrada (login) | `/login` |  |  |
| [ ] | Loja nextlevel | `/loja-nextlevel` |  |  |
| [ ] | Parceiros | `/parceiros` |  |  |
| [ ] | Cadastro | `/parceiros/cadastro` |  |  |
| [ ] | Entrar | `/parceiros/entrar` |  |  |
| [ ] | Termos | `/parceiros/termos` |  |  |
| [ ] | Planos | `/planos` |  |  |
| [ ] | Privacidade | `/privacidade` |  |  |
| [ ] | Quero minha loja | `/quero-minha-loja` |  |  |
| [ ] | Seja fornecedor | `/seja-fornecedor` |  |  |
| [ ] | Solucoes | `/solucoes` |  |  |
| [ ] | Solucoes (slug) | `/solucoes/[slug]` |  |  |
| [ ] | Temas | `/temas` |  |  |
| [ ] | Temas (key) | `/temas/[key]` |  |  |
| [ ] | Termos | `/termos` |  |  |

### Vitrines das lojas (7 telas · Mundo 2)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Página do fornecedor | `/f/[slug]` |  |  |
| [ ] | Vitrine da loja | `/store/[slug]` |  |  |
| [ ] | Acompanhar | `/store/[slug]/acompanhar` |  |  |
| [ ] | Cart | `/store/[slug]/cart` |  |  |
| [ ] | Catalog | `/store/[slug]/catalog` |  |  |
| [ ] | Checkout | `/store/[slug]/checkout` |  |  |
| [ ] | Product (productSlug) | `/store/[slug]/product/[productSlug]` |  |  |

### Lojista (35 telas · Mundos 3 e 4)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Início | `/merchant` |  |  |
| [ ] | Pós-venda | `/merchant/after-sales` |  |  |
| [ ] | Análise | `/merchant/analytics` |  |  |
| [ ] | Appearance | `/merchant/appearance` |  |  |
| [ ] | Atacado | `/merchant/atacado` |  |  |
| [ ] | Histórico | `/merchant/auditoria` |  |  |
| [ ] | Avaliações | `/merchant/avaliacoes` |  |  |
| [ ] | Avise-me | `/merchant/avise-me` |  |  |
| [ ] | Campanhas | `/merchant/campanhas` |  |  |
| [ ] | Produtos | `/merchant/catalogo` |  |  |
| [ ] | Catalogo (id) | `/merchant/catalogo/[id]` |  |  |
| [ ] | Categorias | `/merchant/catalogo/categorias` |  |  |
| [ ] | Import | `/merchant/catalogo/import` |  |  |
| [ ] | New | `/merchant/catalogo/new` |  |  |
| [ ] | Conteúdo | `/merchant/content` |  |  |
| [ ] | Clientes | `/merchant/customers` |  |  |
| [ ] | Customers (id) | `/merchant/customers/[id]` |  |  |
| [ ] | Cupons | `/merchant/descontos` |  |  |
| [ ] | Financeiro | `/merchant/finance` |  |  |
| [ ] | Etiquetas | `/merchant/labels` |  |  |
| [ ] | Pedidos | `/merchant/orders` |  |  |
| [ ] | Orders (id) | `/merchant/orders/[id]` |  |  |
| [ ] | Print | `/merchant/orders/[id]/print` |  |  |
| [ ] | Novo pedido | `/merchant/orders/new` |  |  |
| [ ] | Propostas | `/merchant/orders/propostas` |  |  |
| [ ] | Catálogo | `/merchant/products` |  |  |
| [ ] | Loja NextLevel | `/merchant/services` |  |  |
| [ ] | Services (id) | `/merchant/services/[id]` |  |  |
| [ ] | Solucao (slug) | `/merchant/services/solucao/[slug]` |  |  |
| [ ] | Configurações | `/merchant/settings` |  |  |
| [ ] | Loja Virtual | `/merchant/storefront` |  |  |
| [ ] | Equipe | `/merchant/team` |  |  |
| [ ] | Templates | `/merchant/templates` |  |  |
| [ ] | Saldo e recargas | `/merchant/wallet` |  |  |
| [ ] | Editor do tema | `/theme-editor` |  |  |

### Fornecedor (24 telas · Mundo 5)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Esteira | `/supplier` |  |  |
| [ ] | Conteúdo | `/supplier/content` |  |  |
| [ ] | Financeiro | `/supplier/finance` |  |  |
| [ ] | Estoque | `/supplier/inventory` |  |  |
| [ ] | Faturas | `/supplier/invoices` |  |  |
| [ ] | Corte e operação | `/supplier/operations` |  |  |
| [ ] | Pedidos | `/supplier/orders` |  |  |
| [ ] | Orders (id) | `/supplier/orders/[id]` |  |  |
| [ ] | Print | `/supplier/orders/[id]/print` |  |  |
| [ ] | Produtos | `/supplier/products` |  |  |
| [ ] | Products (id) | `/supplier/products/[id]` |  |  |
| [ ] | Categorias | `/supplier/products/categorias` |  |  |
| [ ] | Importar produtos por CSV | `/supplier/products/import` |  |  |
| [ ] | Novo produto | `/supplier/products/new` |  |  |
| [ ] | Loja NextLevel | `/supplier/services` |  |  |
| [ ] | Services (id) | `/supplier/services/[id]` |  |  |
| [ ] | Solucao (slug) | `/supplier/services/solucao/[slug]` |  |  |
| [ ] | Configurações | `/supplier/settings` |  |  |
| [ ] | Shipping | `/supplier/shipping` |  |  |
| [ ] | Minha loja | `/supplier/store` |  |  |
| [ ] | Lojistas | `/supplier/stores` |  |  |
| [ ] | Nova loja | `/supplier/stores/new` |  |  |
| [ ] | Equipe | `/supplier/team` |  |  |
| [ ] | Recargas | `/supplier/wallets` |  |  |

### Expedição (4 telas · Mundo 5)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Abrir tela da expedição | `/supplier/dispatch` |  |  |
| [ ] | Imprimir etiquetas | `/supplier/dispatch/print` |  |  |
| [ ] | Enviados | `/supplier/dispatch/shipped` |  |  |
| [ ] | Wave (id) | `/supplier/dispatch/wave/[id]` |  |  |

### Parceiro (8 telas · Mundo 6)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Início | `/partner` |  |  |
| [ ] | Catálogo comercial | `/partner/catalogo` |  |  |
| [ ] | Cupons de 7 dias | `/partner/coupons` |  |  |
| [ ] | CRM de clientes | `/partner/crm` |  |  |
| [ ] | Financeiro | `/partner/finance` |  |  |
| [ ] | Links | `/partner/links` |  |  |
| [ ] | Meu perfil | `/partner/profile` |  |  |
| [ ] | Indicados | `/partner/referrals` |  |  |

### Membro Brás (13 telas · Mundo 7)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Início | `/meu-bras` |  |  |
| [ ] | Indique e ganhe | `/meu-bras/club` |  |  |
| [ ] | Descoberta (id) | `/meu-bras/descoberta/[id]` |  |  |
| [ ] | Minha empresa | `/meu-bras/empresa` |  |  |
| [ ] | Fretes | `/meu-bras/fretes` |  |  |
| [ ] | Etiquetas | `/meu-bras/fretes/etiquetas` |  |  |
| [ ] | Meu Contador | `/meu-bras/meu-contador` |  |  |
| [ ] | Meus pedidos | `/meu-bras/pedidos` |  |  |
| [ ] | Retirada | `/meu-bras/pedidos/[id]/retirada` |  |  |
| [ ] | Pedir (id) | `/meu-bras/pedir/[id]` |  |  |
| [ ] | Meu perfil | `/meu-bras/perfil` |  |  |
| [ ] | Suporte | `/meu-bras/suporte` |  |  |
| [ ] | Descobertas | `/meu-bras/videos` |  |  |

### Importadora (7 telas · Mundo 7)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Hoje | `/importadora` |  |  |
| [ ] | Estoque | `/importadora/estoque` |  |  |
| [ ] | Galpões, equipe e ficha | `/importadora/galpoes` |  |  |
| [ ] | Indique e ganhe | `/importadora/indicacoes` |  |  |
| [ ] | Pedidos | `/importadora/pedidos` |  |  |
| [ ] | Produtos e caixas | `/importadora/produtos` |  |  |
| [ ] | Transportadoras | `/importadora/transportadoras` |  |  |

### Transportadora (7 telas · Mundo 8)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Hoje | `/transportadora` |  |  |
| [ ] | Cargas | `/transportadora/cargas` |  |  |
| [ ] | Extrato | `/transportadora/extrato` |  |  |
| [ ] | Importadoras na rede | `/transportadora/importadoras` |  |  |
| [ ] | Indique e ganhe | `/transportadora/indicacoes` |  |  |
| [ ] | Perfil e motorista | `/transportadora/perfil` |  |  |
| [ ] | Rotas e viagens | `/transportadora/rotas` |  |  |

### Master (47 telas · Mundo 9)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Dashboard | `/master` |  |  |
| [ ] | Bras | `/master/bras` |  |  |
| [ ] | Catálogo | `/master/catalog` |  |  |
| [ ] | Clientes e suporte | `/master/clientes` |  |  |
| [ ] | Commerce | `/master/commerce` |  |  |
| [ ] | CRM Loja NextLevel | `/master/crm` |  |  |
| [ ] | Crm (id) | `/master/crm/[id]` |  |  |
| [ ] | Torre do Ecossistema | `/master/ecossistema` |  |  |
| [ ] | Equipe do Master | `/master/equipe` |  |  |
| [ ] | Erros do sistema | `/master/errors` |  |  |
| [ ] | Finance | `/master/finance` |  |  |
| [ ] | Financeiro NextLevel | `/master/financeiro` |  |  |
| [ ] | Assinaturas | `/master/financeiro/assinaturas` |  |  |
| [ ] | Auditoria | `/master/financeiro/auditoria` |  |  |
| [ ] | Catalogo | `/master/financeiro/catalogo` |  |  |
| [ ] | Catalogo (key) | `/master/financeiro/catalogo/[key]` |  |  |
| [ ] | Descoberta | `/master/financeiro/descoberta` |  |  |
| [ ] | Experimentos | `/master/financeiro/experimentos` |  |  |
| [ ] | Gateways | `/master/financeiro/gateways` |  |  |
| [ ] | Jornada | `/master/financeiro/jornada` |  |  |
| [ ] | Ofertas e comissões | `/master/financeiro/ofertas` |  |  |
| [ ] | Financeiro SuperDrop | `/master/financeiro/operacao` |  |  |
| [ ] | Pagamentos | `/master/financeiro/pagamentos` |  |  |
| [ ] | Parceiros | `/master/financeiro/parceiros` |  |  |
| [ ] | Preços do grupo | `/master/financeiro/precos` |  |  |
| [ ] | Proposta de preço | `/master/financeiro/proposta` |  |  |
| [ ] | Propostas | `/master/financeiro/propostas` |  |  |
| [ ] | Superdrop | `/master/financeiro/superdrop` |  |  |
| [ ] | Integridade dos dados | `/master/integridade` |  |  |
| [ ] | Marcas (marca) | `/master/marcas/[marca]` |  |  |
| [ ] | Redes | `/master/networks` |  |  |
| [ ] | Escritório virtual | `/master/office` |  |  |
| [ ] | Pedidos | `/master/orders` |  |  |
| [ ] | Orders (id) | `/master/orders/[id]` |  |  |
| [ ] | Parceiros | `/master/partners` |  |  |
| [ ] | Partners (id) | `/master/partners/[id]` |  |  |
| [ ] | Planos | `/master/plans` |  |  |
| [ ] | Central de qualidade | `/master/qualidade` |  |  |
| [ ] | Loja NextLevel | `/master/services` |  |  |
| [ ] | Services (id) | `/master/services/[id]` |  |  |
| [ ] | Configurações | `/master/settings` |  |  |
| [ ] | Lojas | `/master/stores` |  |  |
| [ ] | Stores (slug) | `/master/stores/[slug]` |  |  |
| [ ] | Resumo do dia | `/master/summary` |  |  |
| [ ] | Fornecedores | `/master/suppliers` |  |  |
| [ ] | Novo fornecedor | `/master/suppliers/new` |  |  |
| [ ] | Templates | `/master/templates` |  |  |

### Admin Commerce (7 telas · Mundo 9)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | NextLevel Commerce | `/commerce` |  |  |
| [ ] | Catálogo das lojas | `/commerce/catalog` |  |  |
| [ ] | Interessados | `/commerce/leads` |  |  |
| [ ] | Vendas | `/commerce/orders` |  |  |
| [ ] | Assinaturas | `/commerce/plans` |  |  |
| [ ] | Plataforma | `/commerce/settings` |  |  |
| [ ] | Lojas | `/commerce/stores` |  |  |

### Estúdio Brás (18 telas · Mundo 9)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Brás Digital | `/bras` |  |  |
| [ ] | Acesso e planos | `/bras/acesso` |  |  |
| [ ] | Atendimento | `/bras/atendimento` |  |  |
| [ ] | Balcao | `/bras/balcao` |  |  |
| [ ] | Brás Digital Club | `/bras/club` |  |  |
| [ ] | Comissões | `/bras/comissoes` |  |  |
| [ ] | Descobertas | `/bras/descobertas` |  |  |
| [ ] | Ônibus de excursão | `/bras/excursao` |  |  |
| [ ] | Empresas do grupo | `/bras/grupo` |  |  |
| [ ] | Importadoras | `/bras/importadoras` |  |  |
| [ ] | Importadoras (id) | `/bras/importadoras/[id]` |  |  |
| [ ] | Membros | `/bras/membros` |  |  |
| [ ] | Meu Contador | `/bras/meu-contador` |  |  |
| [ ] | Pauta de conteúdo | `/bras/pauta` |  |  |
| [ ] | Planos e regras | `/bras/regras` |  |  |
| [ ] | Romaneio (id) | `/bras/romaneio/[id]` |  |  |
| [ ] | Transportadoras (Cargas) | `/bras/transportadoras` |  |  |
| [ ] | Visão geral | `/bras/visao` |  |  |

### Links privados (8 telas · Mundo 10)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Balcao club (token) | `/balcao-club/[token]` |  |  |
| [ ] | Balcao (token) | `/balcao/[token]` |  |  |
| [ ] | D (id) | `/d/[id]` |  |  |
| [ ] | Pedido (token) | `/loja-nextlevel/pedido/[token]` |  |  |
| [ ] | Motorista (token) | `/motorista/[token]` |  |  |
| [ ] | Redefinir senha (token) | `/redefinir-senha/[token]` |  |  |
| [ ] | Order (id) | `/store/[slug]/order/[id]` |  |  |
| [ ] | Proposta (token) | `/store/[slug]/proposta/[token]` |  |  |

### Conta (2 telas · Mundo 10)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Suas marcas | `/account/marcas` |  |  |
| [ ] | Trocar a senha | `/account/password` |  |  |

### Só na demonstração (4 telas · Mundo 10)

| ✔ | Tela | Endereço | Ficha nº | XP |
|---|---|---|---|---|
| [ ] | Demo (key) | `/demo/[key]` |  |  |
| [ ] | Design | `/dev/design` |  |  |
| [ ] | Amostra | `/dev/design/amostra` |  |  |
| [ ] | Gravacao | `/gravacao` |  |  |

**Total: 213 telas.** Quando todas estiverem marcadas, você é oficialmente um 🧙 **Mestre do Sistema**.


---

*Guia criado em 12/10/2026 a partir do mapa oficial do sistema (`docs/mapa/rotas.csv`). Quando o sistema ganhar telas novas, peça ao Claude para atualizar este guia.*
