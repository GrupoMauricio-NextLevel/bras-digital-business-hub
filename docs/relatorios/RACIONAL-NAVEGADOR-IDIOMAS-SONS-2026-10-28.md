# Racional: recursos do navegador, idiomas e sons (2026-10-28)

> Pedido do dono: aproveitar ao máximo o que o navegador já faz sozinho, com economia e facilidade; explorar idiomas (1º brasileiros, 2º bolivianos, 3º chineses, 4º inglês); avaliar efeitos sonoros.
> Princípio: **nativo primeiro**. O que o navegador já traz não pesa no carregamento, não tem mensalidade e não depende de biblioteca. Onde o recurso não existe (algum celular ou navegador antigo), a tela funciona igual, só sem o extra.

---

## 1. Recursos nativos do navegador

### Já em uso
| Recurso | Onde |
|---|---|
| View Transitions (troca de página animada) | Movimento "Subida" (D193), nos painéis, nas páginas públicas e nas lojas |
| Animação ligada à rolagem (`animation-timeline`) | Homes imersivas |
| Loja instalável (manifesto PWA) | Lojas com a chave ligada (D189) |
| Compartilhar nativo (`navigator.share`) | Só num botão da Brás |
| Arrastar e soltar arquivos | Galeria de fotos do produto |

### Sugestões, em ordem de valor por esforço
| # | Recurso nativo | O que vira para o usuário | Esforço | Onde funciona |
|---|---|---|---|---|
| N1 | **Colar imagem (Ctrl+V)** e **reduzir a foto no próprio aparelho** antes de enviar | Tira print ou copia a foto e cola direto no cadastro; o envio fica 5 a 10 vezes mais leve e rápido no 4G | Pequeno | Todos |
| N2 | **Rascunho salvo no aparelho** (armazenamento local) | Cadastro de produto que não se perde se a internet cair ou a aba fechar | Pequeno | Todos |
| N3 | **Compartilhar nativo** no produto da loja | No celular abre a lista do próprio aparelho (WhatsApp, Instagram, Telegram) | Muito pequeno | Celulares e Safari; no computador vira "copiar link" |
| N4 | **Tela sempre acesa** (Wake Lock) | No modo expedição e no balcão a tela não apaga no meio da separação | Muito pequeno | Chrome, Edge, Safari recente |
| N5 | **Conta-gotas de cor** (EyeDropper) | No editor de tema, clicar no logo e pegar a cor exata da marca | Muito pequeno | Chrome e Edge no computador (os outros veem o seletor comum) |
| N6 | **Pré-carregar a próxima página** (Speculation Rules) | Página do produto abre instantaneamente ao passar o dedo ou o mouse | Pequeno | Chrome e Edge; os outros abrem normal |
| N7 | **Menus e janelas nativos** (`<dialog>`, Popover) | Menos código, teclado e leitor de tela corretos sem esforço | Contínuo, ao mexer em cada tela | Todos os atuais |
| N8 | **Entrar com a digital ou o rosto** (Passkeys/WebAuthn) | Login sem senha, mais seguro que senha e código | Médio | Todos os atuais |
| N9 | **Aviso de pedido novo no celular** (Web Push) e **número no ícone** (Badging) | O lojista recebe "Pedido pago: R$ 189,90" mesmo com o painel fechado | Médio | Android e computador; no iPhone só com o painel instalado na tela inicial |
| N10 | **Leitor de código de barras pela câmera** (BarcodeDetector) | Balcão e conferência de estoque sem leitor físico | Médio | Android Chrome; no iPhone precisa de uma biblioteca pequena de reserva |
| N11 | **Busca por voz** (Web Speech) | Microfone na busca da loja | Pequeno | Chrome e Safari |
| N12 | **Vibração** | Confirmação tátil na expedição ("bipou") | Muito pequeno | Só Android |

**Não recomendo como base:** a tradução automática embutida no Chrome (Translator API). Ela é nova, só existe no Chrome do computador e não serve de fundação para os idiomas (veja a seção 2). Pode virar um botão extra depois.

---

## 2. Idiomas: português, espanhol, chinês e inglês

### Onde estamos
O sistema inteiro está escrito em português, direto nas telas, e marcado como `pt-BR`. Não há troca de idioma. Para chegar a quatro idiomas, os textos precisam sair das telas para "dicionários", um por idioma.

### Quem lê o quê (define a ordem)
| Público | Onde | Por que importa |
|---|---|---|
| Comprador boliviano ou chinês | **Loja do lojista**: vitrine, produto, carrinho, checkout, acompanhar pedido, e-mails do pedido | Quem não lê português desiste no checkout. São poucas telas e poucos textos: **maior retorno pelo menor esforço** |
| Lojista boliviano ou chinês (forte no Brás) | **Painel do lojista**: produtos, pedidos, financeiro, configurações | Tem muitos textos; é o mais trabalhoso |
| Visitante | **Páginas públicas** de cada marca | Venda para quem chega de fora; precisa cuidar do Google (um endereço por idioma) |

### Como fazer com economia (sem biblioteca paga e sem serviço de tradução cobrado)
1. **Dicionários por idioma** no próprio código: `pt-BR` (base), `es` (espanhol latino-americano neutro, que serve bem ao boliviano), `zh-CN` (chinês simplificado) e `en`. O Next já permite isso sem biblioteca nova.
2. **O idioma é escolhido assim:** primeiro o que a pessoa escolheu no seletor (guardado no navegador); senão, o idioma do aparelho. O seletor mostra "Português · Español · 中文 · English".
3. **Números, datas e moeda** pelo próprio navegador (`Intl`): o valor continua em reais (R$), só a escrita muda conforme o idioma.
4. **Fonte chinesa** pela fonte que já vem no aparelho (PingFang, Microsoft YaHei, Noto), sem baixar nada; uma fonte chinesa baixada pesaria vários MB.
5. **Telas aguentam texto maior:** o espanhol fica de 20% a 30% mais longo. A checagem de 360 px passa a rodar nos quatro idiomas.
6. **O conteúdo do lojista** (nome e descrição do produto) continua no idioma em que ele escreveu. A tradução automática dele fica para depois, como opção.
7. **Tradução:** eu traduzo os dicionários. Recomendo **uma revisão por um falante nativo** de espanhol e de chinês antes de anunciar o idioma, uma vez por fase.

### Fases sugeridas
| Fase | O que entra | Esforço |
|---|---|---|
| I1 | Base dos dicionários, seletor, `Intl` e fonte chinesa. **Loja do lojista e checkout nos 4 idiomas**, mais os e-mails do pedido | 2 a 3 dias |
| I2 | Páginas públicas da E-commerce nos 4 idiomas, com endereço por idioma para o Google (`/es`, `/zh`, `/en`) | 2 dias |
| I3 | Painel do lojista, área por área (pedidos, produtos, financeiro, configurações) | 1 a 2 semanas, aos poucos |
| I4 | Fornecedor, Master e as outras marcas, se fizer sentido | Depois |

---

## 3. Efeitos sonoros

### Dá para fazer com facilidade?
Sim. O navegador gera som pelo próprio código (Web Audio API), **sem arquivo de áudio e sem peso**. Também dá para usar arquivos curtos de 2 a 6 KB.

### Regras que o navegador impõe (e que são boas para nós)
- Som só toca **depois que a pessoa interagiu com a página** (clique ou toque). Nada de som ao abrir o site.
- Toda informação dada por som também aparece na tela; quem não ouve não perde nada.

### Recomendação
- **Páginas públicas e lojas: sem som.** Quem navega no trabalho, no ônibus ou à noite não quer; tira credibilidade e atrapalha a venda.
- **Painéis internos: som opcional,** com chave "Sons do painel" na conta. Ligado por padrão só para "pedido pago".
- **Identidade sonora "Subida",** o par do movimento visual: três notas curtas que sobem (os degraus), suaves, abaixo de 0,3 segundo.

| Momento | Som | Observação |
|---|---|---|
| **Pedido pago** | "Subida" completa (3 notas subindo) | O mais valioso: o lojista ouve a venda entrar com o painel aberto em outra aba |
| Salvo / envio de imagem concluído | Um toque curto e baixo | Opcional |
| Erro | Duas notas descendo, suaves | Sem alarme |
| Expedição: pacote conferido | Bipe curto (+ vibração no Android) | Modo expedição |

**Esforço:** cerca de meio dia para o módulo de sons, a chave na conta e os 4 momentos. Um designer de som pode refinar depois sem mudar o código.

---

## 4. Ordem que eu proponho
1. **I1:** idiomas na loja e no checkout (o maior ganho de venda).
2. **N1 e N2:** colar imagem, foto reduzida no aparelho e rascunho que não se perde (entrada de dados mais rápida).
3. **N3, N4, N5 e N6:** compartilhar, tela acesa, conta-gotas e pré-carregamento (ganhos rápidos).
4. **Sons nos painéis**, com a chave na conta.
5. **I2:** páginas públicas em 4 idiomas.
6. **N8 e N9:** entrar com digital e aviso de pedido no celular.
7. **I3:** painel do lojista em 4 idiomas, aos poucos.

Nada disso depende de configuração sua, contrato ou mensalidade. Só a revisão de um falante nativo nos idiomas é recomendada.
