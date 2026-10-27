# Fotos da equipe NextLevel, onda 2: usar as 17 fotos em toda parte, com critério

> **Estado:** AVALIAÇÃO PARA O DONO (2026-10-27).
>
> **Onde estamos (D179):** 6 das 17 fotos estão em uso. São 5 fotos de cena, cada uma num bloco "Quem está por trás" nas homes (E-commerce, SuperDrop, Brás, Cargas e Soluções), mais o retrato do Maurício nesses blocos e no e-mail de boas-vindas. Painéis internos: nenhuma foto. 11 fotos estão prontas e paradas.
>
> **Skills usadas:**
> - `pagina-de-vendas`: verdade, desempenho e conferência por capturas;
> - `painel-interno`: foto em painel só onde acalma ou orienta, nunca em tabela, fila ou formulário.
>
> **Regras que continuam valendo** (D179): equipe sempre como equipe, CEO com nome e cargo, sem número nem promessa, nunca nas lojas dos lojistas nem nos temas, e o prêmio só em telas internas.

## 1. O diagnóstico em uma frase
Hoje a foto real aparece **uma vez por site, no fim da home**. Quem entra por outra porta (planos, cadastro, perguntas frequentes, seja fornecedor, parceiros, login) ou já está dentro do painel nunca vê que existe gente de verdade por trás. Esses são justamente os momentos de dúvida, cadastro, espera e primeiro dia.

## 2. Como usar mais sem virar "banco de imagens" (a parte inteligente)
1. **Foto no momento da dúvida, não como enfeite.** Cada lugar novo responde a uma pergunta do visitante ou do lojista:
   - "tem alguém para me ajudar?" (planos, perguntas frequentes, cadastro);
   - "é empresa séria?" (seja fornecedor, parceiros, prévia de link);
   - "e agora?" (primeiro dia no painel, lista vazia);
   - "travou, e agora?" (tela de bloqueio).

   Onde não há dúvida (tabelas, filas, formulários, lojas dos lojistas), não entra foto.
2. **Um mapa único de usos** (`src/lib/marcas/equipe-usos.ts`): cada lugar diz qual foto usa, o tamanho e a legenda. Trocar uma foto é mudar uma linha. Um teste garante quatro coisas:
   - nenhuma foto se repete na mesma página;
   - a mesma página não mistura letreiros diferentes (seção 3);
   - a foto do prêmio não sai das telas internas;
   - toda foto pública tem legenda.
3. **Elenco por marca.** Cada marca ganha o seu conjunto de fotos, para não parecer a mesma imagem em todo lugar:
   - E-commerce: monitor com cliente, análise de tela, relatório;
   - SuperDrop: boas-vindas, tour, reuniões;
   - Brás: estúdio e gravação;
   - Grupo: CEO e escritório.
4. **Rodízio leve.** Alguns lugares (login do Master, primeira tela do painel) trocam de foto por dia, entre 2 ou 3 da mesma família de letreiro. A escolha é feita no servidor pela data, sem sorteio no navegador: a página não pisca e não pesa.
5. **Tamanho certo em cada lugar.** No painel, a foto entra pequena: uma versão nova de 480 px, com cerca de 25 KB em AVIF, que carrega só quando aparece. No site, entram as larguras de 800 e 1400 px que já existem. A primeira tela continua tão rápida quanto hoje.
6. **"Fotos da equipe" no Master.** Uma página mostra cada foto, onde ela aparece e um botão "suspender". Suspender tira a foto de todos os lugares na hora, sem publicar código, para o caso de alguém sair da empresa.

## 3. As 17 fotos agrupadas pelo letreiro da parede
**Pares quase iguais** (a mesma cena com pequena diferença):
- "loja com cliente" e "análise de tela";
- "reunião na mesa" e "reunião na mesa 2".

O mapa de usos impede que os dois de um par apareçam para o mesmo visitante na mesma marca, ou seja, na home e numa página da mesma marca. No painel do lojista eles podem aparecer, porque o contexto é outro.

A mesma página usa um letreiro só.

| Família | Fotos | Uso principal |
|---|---|---|
| **A. Sede, letreiro 3D cinza e azul, carpete azul** | escritório e estúdio, boas-vindas, Maurício no escritório, edição e gravação, gravação, análise de tela, loja com cliente, tour, prêmio | Homes, login, painéis, Master |
| **B. Parede acústica, letreiro neon** | reunião na mesa (2 versões) | Diagnóstico, seja fornecedor, Cargas |
| **C. Letreiro ciano com linhas** | mesas com logo (em pé), relatório ao cliente | Celular (a foto em pé), planos, Enterprise |
| **D. Estúdio escuro de madeira** | retrato do Maurício (fundo neutro), Maurício na bancada, reunião criativa, gravação de produto | Palavra do fundador, parceiros, conteúdo da Brás |

## 4. O plano: 22 lugares novos (11 fotos paradas passam a trabalhar)

### Páginas públicas
| # | Marca | Página | Foto | Pergunta que responde |
|---|---|---|---|---|
| 1 | E-commerce | `/planos`: faixa "Prefere que a gente monte?" (Loja Pronta, Migração, diagnóstico) | relatório ao cliente (C) | Tem alguém para me ajudar? |
| 2 | E-commerce | `/planos`: Enterprise "Pedir proposta" | reunião na mesa 2 (B) | Atendem operação maior? |
| 3 | E-commerce | `/cadastro`: faixa discreta abaixo do formulário com o retrato e "Equipe NextLevel, em São Paulo" | retrato (avatar) | Estou me cadastrando com quem? |
| 4 | E-commerce | `/faq`: "Não achou sua dúvida?" no fim | tour do escritório (A) | Tem gente para perguntar? |
| 5 | E-commerce | `/quero-minha-loja` (contato ou lista de espera) | reunião na mesa (B) | Quem vai me responder? |
| 6 | SuperDrop | `/seja-fornecedor` | reunião na mesa 2 (B) | É empresa séria para eu entrar com a minha Central? |
| 7 | SuperDrop | `/como-funciona` | edição e gravação (A) | Quem faz isso funcionar? |
| 8 | Grupo | `/parceiros`, no topo, longe das comissões | reunião criativa (D) | Quem está por trás do programa? |
| 9 | Grupo | `/solucoes`: ao lado do diagnóstico gratuito | reunião na mesa 2 (B) | Quem vai olhar o meu diagnóstico? |
| 10 | Grupo | `/solucoes`: "Palavra do fundador" (**texto seu**) | Maurício na bancada (D) | Quem é o dono? |
| 11 | Grupo | `/loja-nextlevel` | escritório e estúdio (A) | O serviço é feito por quem? |
| 12 | Grupo | Prévia de link (WhatsApp) do grupo e da Soluções | escritório e estúdio (A), 1200 × 630 | Ao compartilhar, a empresa aparece |
| 13 | Brás | Estúdio e pauta de conteúdo | gravação de produto (D) | Onde o meu conteúdo é gravado? |
| 14 | Cargas | Cadastro da transportadora | reunião na mesa 2 (B) | Quem confere o meu cadastro? |
| 15 | Todas | Página "não encontrada": "Essa página não existe, mas a gente está aqui" | tour do escritório (A) | Perdi o caminho |
| 16 | Celular | No celular, a home do grupo usa a foto em pé | mesas com logo (C, em pé) | Primeira impressão no celular |

### Painéis internos
| # | Painel | Lugar | Foto | Regra |
|---|---|---|---|---|
| 17 | Master | Tela de entrada do Master (hoje sem foto) | Maurício no escritório, boas-vindas e tour (A), em rodízio diário | A casa da equipe |
| 18 | Master | Equipe: cabeçalho "Reconhecimento" | prêmio (A, só interno) | Cultura, uso interno |
| 19 | Master | Estúdio de gravação | gravação (A) | É o lugar real das aulas |
| 20 | Lojista (E-commerce e SuperDrop) | Primeira tela, só nos 14 primeiros dias ou até a primeira venda: cartão "Bem-vindo, a equipe NextLevel está com você" com o retrato e os 3 primeiros passos da fila do dia | retrato (avatar) e loja com cliente (A), 480 px | Some depois. Botão de conversa só se o WhatsApp ou o e-mail de suporte estiver configurado |
| 21 | Lojista | Estado vazio do primeiro dia (Pedidos e Catálogo sem nada ainda) | análise de tela (A), 480 px | Orienta o primeiro passo; some com o primeiro pedido ou produto |
| 22 | Parceiro | Escritório virtual: cabeçalho | reunião criativa (D) | Quem apoia o parceiro |

**Fica sem foto, de propósito:** tabelas, filas, formulários de cadastro de produto, pedidos, financeiro, editor de tema, lojas dos lojistas e a tela de entrada dos lojistas, que já tem foto de personagem por marca e funciona bem.

## 5. O que depende de você
1. **"Palavra do fundador" (item 10):** um texto curto seu, de até 80 palavras, sem números. Posso escrever um rascunho para você ajustar. Sem o seu texto, o item fica fora.
2. **Cartão de boas-vindas (item 20):** confirmar que pode sair em seu nome ("Maurício, CEO") com um texto fixo que eu proponho. O botão de conversa só aparece quando o canal de suporte estiver configurado no Render.
3. **Ordem:** a recomendação é a regra 60/25/15. Onda 2A: E-commerce e painel do lojista (itens 1 a 5, 20 e 21). Onda 2B: SuperDrop, Grupo e Master. Onda 2C: Brás, Cargas e páginas de erro.

## 6. Como será conferido (antes de publicar)
- Capturas em 360, 768 e 1440 px de cada lugar, com rolagem.
- Acessibilidade sem falha grave e sem rolagem lateral.
- Peso da página antes e depois: meta de no máximo 60 KB a mais por página, carregando só ao aparecer.
- O teste do mapa de usos (sem repetição, sem misturar letreiros, prêmio só interno, legenda obrigatória).
- Varredura de marca (nenhuma foto nas lojas e nos temas).
- Testes completos e conferência do site no ar.
