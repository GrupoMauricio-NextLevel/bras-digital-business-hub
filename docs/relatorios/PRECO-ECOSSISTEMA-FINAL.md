# Público, preço e ecossistema: relatório da rodada completa (D123 a D136)

> Prompt: `docs/prompts/publico-personas-precos-ecossistema.md`. Recomendações da seção A19 aceitas como padrão. Pedido do dono no meio da rodada: "faça o grosso; testes pesados no fim" (D127).
> **Tudo novo está publicado e desligado.** Nada muda para nenhum cliente até você ligar no Master.

## 1. O que ficou pronto, fase por fase
| Fase | O que é | Onde ver ou ligar | Decisão |
|---|---|---|---|
| P0 | **Preços do grupo**: o preço que vale hoje em todas as marcas, com a origem e as divergências | Master → Financeiro → Preços do grupo | D123 |
| P1/P2 | **Descoberta**: funil por marca (só números somados), coortes, origem, uso de recursos; **questionário de preço** anônimo nos painéis; roteiros de entrevista | Master → Financeiro → Descoberta | D124 |
| P3/P4 | **Personas com fonte** e **Proposta de preço** em rascunho: escada sugerida, conta de cada plano, quando cada plano se paga, 12 meses em 3 cenários | Master → Financeiro → Proposta de preço · `docs/descoberta/` | D125 |
| P5 | **Porta de entrada "grátis para começar"**: teste reverso de 14 dias que cai no grátis (sem bloquear), dias por conquista, anual "pague 8, leve 12" no Pix, cashback em pontos | Master → Financeiro → Ofertas e comissões → Porta de entrada (SuperDrop e Commerce) | D126 |
| P5V | **Benefícios nos painéis**: carteira de pontos (em reais também), trilha de primeiros passos com comemoração, medidor do teste, simulador "quanto cada plano custaria para você" | Master → Descoberta → Benefícios | D128 |
| P5E | **Barra do ecossistema**: fio com as cores das marcas e o botão "Marcas do grupo" com recomendações por perfil | Master → Descoberta → Barra do ecossistema | D129 |
| P5A | **Página de ativação** `/ativar` em cada marca: "de onde você vem → o que ganha aqui", números reais da rede e o benefício de entrada | Liga junto com a barra | D130 |
| P5C | **Club+ (R$ 29,90) e Club Total (R$ 247)** no catálogo, em rascunho, com as regras dos níveis e a comparação | Master → Proposta de preço · Catálogo e preços | D131 |
| P5U | **Fio do grupo e selo do Club** no cadastro, entrada, senha e ativação; **rodapé do grupo nos e-mails** | Master → Descoberta → Fio do grupo fora dos painéis | D132 |
| P5P | **Rodapé da família** "Parte do Grupo NextLevel" nas páginas públicas | Mesma chave (páginas públicas) | D133 |
| P5F | **Reputação Bronze, Prata e Ouro** das transportadoras e ônibus, com regras e quadro no Master | Painel da transportadora (com os benefícios) · Master → Descoberta | D134 |
| P5M | **Torre do Ecossistema**: clientes em 2+ marcas, fluxo entre marcas, **fila de oportunidades cruzadas** com dono e placar do mês | Master → Torre do Ecossistema | D135 |
| P6 | **Experimentos**: controle × grupo novo por peça, leitura em português simples com a incerteza, encerramento só com a sua decisão escrita | Master → Financeiro → Experimentos | D136 |

## 2. Como ligar com segurança (sugestão de ordem)
1. **Questionário de preço** (Descoberta) e as **entrevistas** (roteiros em `docs/descoberta/ROTEIROS.md`): 2 a 4 semanas ouvindo antes de mexer em preço.
2. **Benefícios nos painéis** na Commerce, depois no SuperDrop (não muda preço, só mostra).
3. **Porta de entrada** como **experimento** (Experimentos → nova → Porta de entrada do SuperDrop, 50% no grupo novo): começa com uma parte dos clientes novos; quem já é cliente não muda.
4. **Barra do ecossistema, fio na captação, e-mails e páginas públicas**: quando houver duas marcas abertas para o mesmo público.
5. **Club+ e Club Total**: só depois da conta do grupo (pergunta 3 abaixo).

## 3. Verificações da fase final
- Bateria completa de testes (`npx vitest run`) e e2e de ponta a ponta (`e2e/bras-portal.mjs` e o novo `e2e/precos-ecossistema.mjs`, que liga as chaves pelo Master e confere painéis, lançador, captação, ativação e páginas públicas em 390 e 1440 px com acessibilidade). O resultado está na seção 6.
- Tipos, estilo e build de produção a cada fase.

## 4. O que ficou para depois (registrado em cada decisão)
- **Conta do grupo** (uma pessoa com perfis em várias marcas, com aceite) e a passagem entre domínios sem novo cadastro: hoje cada e-mail é um usuário de um papel só. É a base do "ativar em 1 clique", do Club como assinatura por pessoa e do "Suas marcas" no perfil.
- Limites de escala do plano grátis (produtos, selo da marca).
- Passe do Grupo (vantagem de uma marca na outra), convites no momento certo com regras no Master, mensagens da página de ativação editáveis com teste A/B.
- Funções de equipe no Master (Comercial, Suporte, Financeiro, Conteúdo), metas com bônus e fila única de suporte.
- Vantagens por nível de reputação, reputação de importadoras e contadores, Carteira B2B do parceiro.
- Páginas do Club, da Excursão e do Nota Fácil (aguardam as fotos reais de `docs/prompts/fotos-club-excursao.md`).

## 5. Perguntas para você (só o que depende de você)
1. **Proposta de preço:** aprova os valores do rascunho (Commerce: Começo grátis 2,5%, Start R$ 89, Pro R$ 199, Scale R$ 449; SuperDrop: Começo grátis 7%, Loja R$ 79, Própria R$ 179; anual pague 8 leve 12; 5% em pontos) para testar como experimento? Pode ajustar na tela antes.
2. **Ordem de ligar:** concorda com a ordem da seção 2 (questionário → benefícios → porta como experimento → barra/fio → Club)?
3. **Conta do grupo:** autoriza começar? É a mudança estrutural que destrava o "entrar direto" em outra marca e o Club como assinatura por pessoa. Sugestão: começar pelas marcas em `*.nextlevelgroup.com.br`.
4. **Entrevistas:** quem conversa com os clientes (5 por persona principal) e quais clientes podemos chamar (fornecedores do SuperDrop, Starline, Mega Tron, lojistas do Brás)?
5. **Equipe no Master:** quem são as pessoas do Comercial e do Suporte (nome e e-mail) para criar as funções e o placar?
6. **Contador parceiro:** já tem escritório definido para a fila do Meu Contador?
7. **Reputação:** o Ouro pode ter taxa menor sobre o frete e aparecer antes na escolha da transportadora (sempre com rótulo)?
8. **Fotos reais** do Club e da Excursão (lista em `docs/prompts/fotos-club-excursao.md`): quando conseguir, monto as páginas.

## 5A. Depois das suas respostas (2026-10-12)
| Resposta | O que foi feito | Onde | Decisão |
|---|---|---|---|
| 1. Testar os preços da Proposta | Opção "Usar os preços da Proposta" na porta de entrada de cada marca; a loja que entra recebe a escada congelada | Master → Ofertas e comissões → Porta de entrada; depois Experimentos | D140 |
| 2. Ordem de ligar | Cartão "Ligar em ordem" com os 5 passos e o estado de cada um | Topo de Master → Descoberta | D140 |
| 3. Conta do grupo | Perfis da mesma pessoa ligados com aceite; troca de perfil e passagem entre marcas sem novo login; login com a conta do grupo | Menu do usuário → Suas marcas | D141 |
| 5 e 6. Equipe e contador | Cadastro da equipe com funções (Comercial, Suporte, Financeiro, Conteúdo, Contador parceiro) | Master → Equipe do Master | D138 |
| 7. Reputação Ouro | Comissão menor no frete e prioridade na lista, com selo; 3 transportadoras fictícias só na demonstração | Master → Descoberta → Reputação | D139 |
| 8. Fotos | Aguardando (amanhã) | | |

## 6. Resultado da fase final (2026-10-11)
- **Bateria completa:** 133 arquivos, **936 testes, todos passando** (inclui a regressão do SuperDrop com tudo desligado).
- **e2e novo `e2e/precos-ecossistema.mjs`:** passou. O Master abre as 6 telas novas (sem violação grave de acessibilidade em 1440 px e sem rolagem horizontal em 360 px), liga benefícios, barra e fio pelo próprio Master; o lojista vê carteira, trilha e simulador, abre o lançador "Marcas do grupo" (Esc fecha); cadastro, `/ativar` e página inicial mostram o fio e o rodapé da família, em 390 e 1440 px.
- **e2e da Brás (regressão de tudo o que veio antes):** passou inteiro.
- **Corrigido nesta fase:** a Proposta de preço tinha rolagem horizontal no celular (o formulário não encolhia por causa da tabela de cenários).
- **Não medido ainda:** modo escuro de cada tela nova e a velocidade da primeira dobra das páginas públicas com o rodapé ligado (o rodapé só lê uma chave no servidor).

## 7. Verificação depois das respostas (2026-10-12, D137 a D141)
- **Bateria completa:** 137 arquivos, **954 testes, todos passando**.
- **e2e `e2e/precos-ecossistema.mjs`:** passou, agora com a conta do grupo (ligar perfil com aceite e trocar sem novo login, acessibilidade em 390 e 1440 px).
- **e2e da Brás (regressão):** passou inteiro em 3 execuções seguidas. Corrigido no caminho: (1) as transportadoras fictícias da demonstração (D139) apareciam primeiro na lista e o teste abria a errada; (2) as coletas fictícias usavam números altos e a numeração real da demonstração pulava para 90 mil (agora ficam abaixo de 5000 e a contagem real segue em 5001). Duas execuções anteriores pararam esperando páginas carregarem; investiguei (nenhuma consulta lenta, nenhum travamento do servidor) e as três seguintes passaram inteiras.
- **Não medido:** modo escuro das telas novas (Suas marcas, Ligar em ordem).
