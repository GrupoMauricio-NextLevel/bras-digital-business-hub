# Site do grupo v1 (nextlevelgroup.com.br): análise e prompt mestre

> Estado: **Aplicado (D157)**, 17/10/2026. Páginas: `/solucoes` (início do grupo), `/club`, `/meu-contador`, `/loja-nextlevel`.
> Contexto: desde a Fase 3 (D156) o endereço principal do grupo abre o nosso sistema, então estas quatro páginas viraram a vitrine da holding.

## 1. O que a análise encontrou (capturas em 390 e 1440 px, claro)

### Soluções (início do grupo)
| # | Problema | Por que importa |
|---|---|---|
| S1 | Topo em cinza-oliva liso (cor `band` genérica), título de 7 linhas no computador, foto pequena ao lado, cabeçalho creme por cima do topo escuro ("topo em duas cores") | Primeira impressão fraca e sem a identidade navy + amarelo da NextLevel que SuperDrop v4 e Commerce v3 já usam |
| S2 | A foto principal do kit (`hero-key-visual`, com área navy à esquerda feita para receber texto) aparecia **depois** do topo, como um cartão solto | A melhor imagem do grupo estava fora do lugar |
| S3 | Jornada em 5 fases com texto de 12 px e listas de links miúdas | Ilegível no celular; parece rodapé |
| S4 | Cartão SuperDrop e "Cursos e assessorias" sem imagem no meio de cartões com foto | Buraco branco na grade de "Soluções e preços" |
| S5 | Texto público "Resultados de clientes… **Esta seção fica vazia até lá**" | Nota interna exposta ao visitante |
| S6 | Os três caminhos (sozinho, produto isolado, jornada) com o mesmo peso | O caminho recomendado não se destacava |
| S7 | Chamada final "Comece pelo diagnóstico" vinha **depois** do formulário de diagnóstico | Ordem invertida |
| S8 | As marcas do grupo só apareciam no rodapé | "Um grupo, várias frentes" sem prova visual |

### Club e Meu Contador
| # | Problema |
|---|---|
| C1 | Seção de capacidades com **blocos navy listrados vazios** com "01" e "02" no lugar de foto (marcas sem kit de imagens) |
| C2 | Topo navy sem ligação com o cabeçalho (cabeçalho claro sobre topo escuro) |
| C3 | Club sem nenhuma fotografia, embora o kit do grupo tenha imagens adequadas |

### Loja NextLevel
| # | Problema |
|---|---|
| L1 | Faixa de logo + topo cinza-oliva com **brilho verde** (cor do SuperDrop dentro de uma página da holding) |
| L2 | Lista longa de temas **sem imagem** (só nome, nicho e preço), apesar de existirem capturas das lojas de demonstração |
| L3 | Nicho com dois pontos repetidos: "Beleza: acessórios: marca própria" e "Celular: acessórios: marca própria" |
| L4 | Ícones das ofertas em fundo verde (`success-soft`) |

## 2. Princípios
- Mesma linguagem de SuperDrop v4 e Commerce v3: topo navy de ponta a ponta, cabeçalho que se funde ao topo e volta ao vidro ao rolar, uma palavra de destaque na cor da marca, botão principal grande.
- Cores da holding: navy `#101B34`, amarelo `#F5BC00` (texto escuro sobre ele, 9,8:1), creme `#F4F1E9`.
- Só imagens do kit do grupo (`public/marcas/nextlevel/imagens`) e capturas reais das lojas de demonstração. Nada inventado: sem números, depoimentos ou logos de clientes.
- Marca sem kit de imagens não ganha bloco vazio: vira composição tipográfica.

## 3. Prompt mestre (o que foi pedido ao engenheiro)
> Reconstrua as quatro páginas do site do grupo dentro da arquitetura atual, sem mudar regras de negócio, rotas nem preços:
> 1. **Abertura única** (`AberturaMarca`): `data-heroi-escuro="nextlevel"` + `CabecalhoSobreHeroi`; foto opcional do kit do grupo à direita (computador) ou no topo (celular), com véu navy; logo da marca só quando houver logo escura; título e texto opcionais; lista de garantias como filhos.
> 2. **Soluções:** topo com `hero-key-visual` e título "Estrutura digital para o seu negócio **ir além.**"; garantias (diagnóstico sem custo, preço publicado ou proposta por escrito, sem promessa de faturamento); faixa "As marcas do grupo" com as logos oficiais (`BrandLogo`); vitrine sem repetir a foto do topo; jornada legível (número em círculo navy/amarelo, nome 20 px, objetivo 16 px); imagem nos cartões SuperDrop e Cursos; tirar a nota "fica vazia"; caminho recomendado em cartão navy; prova e chamada antes do formulário.
> 3. **Club:** topo com `cta-moment` (decorativa). **Meu Contador:** mantém monograma.
> 4. **Capacidades sem kit:** dois cartões de texto (o primeiro navy), sem bloco de imagem.
> 5. **Loja NextLevel:** topo pela `AberturaMarca` com `capability-01`; temas com a captura da loja de demonstração (`themeShot`); nicho sem ":" duplo; ícones em `highlight-soft`.
> 6. **Cabeçalho:** variante `nextlevel` no `globals.css` (fundo `#101B34`, botão amarelo com texto navy, item ativo legível).
> 7. Verifique 390 e 1440 px em claro e escuro, 360 px sem rolagem lateral, contraste AA; registre D157.

## 4. O que depende do dono
- Fotos próprias para Club, Meu Contador, Loja NextLevel e Parceiros (hoje usam imagens do kit do grupo ou composição tipográfica).
- Logos escuras com fundo transparente de Brás Digital e NextLevel Cargas (no tema escuro elas aparecem em texto na faixa de marcas).
