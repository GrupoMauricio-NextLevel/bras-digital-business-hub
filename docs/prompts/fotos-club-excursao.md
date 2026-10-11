# Fotos para as páginas públicas do Club e da Excursão (lista para o dono)

> **Para que serve:** o prompt do Club (seção 10) pede três páginas públicas, só com **fotos reais**:
> - "Seu ônibus de confiança traz o Brás até você" (lojista);
> - "Encha o bagageiro antes de sair de São Paulo" (dono do ônibus);
> - "Brás Digital Club: o que você compra aqui vira desconto ali".
>
> Sem as fotos, a página fica com cara de "feita por IA". Por isso as páginas **não foram montadas** nesta rodada: o sistema por trás delas (fretes, ônibus, Club, balcão) já está pronto e testado.
>
> **Como usar:** tire as fotos com o celular (na horizontal, com luz do dia), salve com o **nome exato** da tabela e me mande a pasta. Eu converto, coloco em `public/portal/club/v1/`, monto as páginas, confiro em celular e computador e publico depois da sua aprovação.

## 1. Lista de fotos

| # | Arquivo | Proporção | Página | O que mostrar | Real ou pode ser gerada? |
|---|---|---|---|---|---|
| 1 | `cl-onibus-starline` | 16:9 | Lojista e dono do ônibus (topo) | Um ônibus da Starline estacionado no Brás, porta do bagageiro aberta | **Real** (é a prova de que existe) |
| 2 | `cl-bagageiro-fardos` | 4:3 | Dono do ônibus ("encha o bagageiro") | Bagageiro com fardos de tamanhos P, M e G arrumados | **Real** |
| 3 | `cl-embarque-bras` | 4:3 | Lojista ("onde o fardo embarca") | O ponto de embarque no Brás (rua, estacionamento), sem placa legível | **Real** |
| 4 | `cl-fardo-etiqueta` | 1:1 | Lojista ("seu fardo com etiqueta") | Mãos colando a etiqueta do sistema (com QR) num fardo | **Real** (imprima uma etiqueta de teste no Meu Brás → Fretes → Etiquetas) |
| 5 | `cl-retirada-cidade` | 4:3 | Lojista ("retire na sua cidade") | Cliente recebendo o fardo do ajudante na rodoviária ou ponto de chegada | **Real** (sem rosto reconhecível) |
| 6 | `cl-balcao-megatron` | 4:3 | Club ("comprou aqui, ganhou ali") | Balcão da Mega Tron com o celular mostrando o cartão do Club | **Real** |
| 7 | `cl-celular-cartao` | 3:4 | Club (cartão no celular) | Mão segurando o celular com a tela "Seu cartão do Club" | **Real** (captura da tela do sistema + foto da mão) |
| 8 | `cl-og-club` | 1200×630 | Prévia do link no WhatsApp | Ônibus ou fardos com a cor da marca, **sem texto** | Pode ser montagem com as fotos 1 e 2 |

## 2. Regras
- Sem rosto reconhecível nem criança: mãos, costas, perfil desfocado.
- Sem placa de veículo legível, sem marca de produto, sem preço em nenhuma foto.
- Sem texto na foto: o texto vem da página.
- Composição com respiro de 15% nas bordas (o site recorta para o celular).

## 3. Textos já aprovados no prompt (banco de copy, seção 16)
- Lojista: "Compre do Brás de onde você está. Seu ônibus de confiança traz."
- Dono do ônibus: "Encha o bagageiro antes de sair de São Paulo." e "Fardinho é lucro: tabela por tamanho, sem pechincha."
- Club: "O que você compra aqui vira desconto ali."
- Proibido: "frete grátis para sempre", "lucre R$ X", "carga garantida", número de clientes que não existe.
