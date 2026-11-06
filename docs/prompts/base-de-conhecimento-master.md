# Base de conhecimento ao vivo no Master (treinamento da equipe)

> Estado: **PROPOSTA.** Aguardando o "pode" do dono para a fase BC0.
> Pedido do dono (06/11/2026): "precisamos criar dentro do Master uma base de conhecimento ao vivo, porque tem novas pessoas chegando para trabalhar na plataforma. Todo o arcabouço que desenvolvemos nas últimas semanas, todas as regras de todos os setores: comercial dos parceiros, venda direta ao cliente final… em destaque, com treinamento para novos funcionários assimilarem de maneira clara."

---

## 1. A ideia em uma frase

Um lugar no Master (**"Aprender"**) onde a pessoa nova faz a trilha da sua função e sai sabendo vender, atender e operar, com **as regras lidas do próprio sistema**: se um preço, uma comissão ou um limite muda no código, a aula muda junto. Nada de apostila que envelhece.

## 2. Por que "ao vivo"

Hoje o conhecimento está espalhado:
- 259 decisões em `docs/design/DECISIONS.md`;
- tabelas no código: `beneficios-plano.ts` (planos), `revisao-d226.ts` (comissões), `niveis-regras.ts` (Prata, Ouro, Diamante), `captacao-regras.ts`, `LIMITES_ATACADO`;
- manuais do Maurício (`manual.ts`, `manual-parceiro.ts`);
- `docs/PLANOS.md`, `NEGOCIO.md`, `FINANCEIRO.md` e os guias em `docs/manual/`.

A base junta tudo isso numa leitura só. **Regra de ouro:** todo número de uma aula (preço, %, dias, limite) vem da mesma tabela que o sistema usa. Um teste falha se uma aula citar um número digitado à mão.

## 3. O que tem dentro

**Trilhas por função** (as mesmas funções da Equipe do Master):

| Trilha | Para quem | Aulas principais |
|---|---|---|
| **Base (todos)** | toda pessoa nova | O que é a NextLevel e as marcas; a E-commerce em 5 minutos; planos Start, Pro e Scale e o que cada um libera; taxa zero da plataforma; as palavras certas ("mais vantajoso", nunca "mais barato"); o que nunca prometer |
| **Comercial: venda direta** | quem vende a loja ao lojista | Funil comercial; oferta de entrada e teste grátis; mensal e anual; comparativo com a concorrência (só fatos com fonte); objeções comuns; Black NextLevel |
| **Comercial: parceiros** | quem cuida do programa | Perfis (criador, vendedor, agência); comissões 50% + 25% e o anual; níveis Prata, Ouro e Diamante (sobe e desce); bônus de ativação e de meta; 6 meses sem cliente = inativo; CRM de parceiros (funil, ficha, segmentos, desafios) |
| **Atacado** | comercial e suporte | Modalidades do Brás (grade, pacote, mix, cliente aprovado); escada por plano; como o preço é calculado; o que já está no ar e o que vem |
| **Suporte ao lojista** | quem atende | Ver como o lojista; os 20 passos mais pedidos (produto, frete, Mercado Pago, domínio, tema); quando chamar a equipe técnica |
| **Financeiro** | financeiro e contador | Receita, pagantes e cortesia; cobrança dos planos; comissões em garantia, disponíveis e saques; antifraude |
| **Conteúdo** | quem cuida das páginas | Regras de texto, fotos reais da equipe, nada inventado, selos e provas |

**Cada aula tem sempre o mesmo formato:**
1. O que é (2 a 3 frases);
2. A regra, com os números ao vivo;
3. Um exemplo real com valores;
4. O que dizer e o que **nunca** dizer;
5. Onde fica no sistema (botão que abre a tela);
6. Três perguntas rápidas para fixar.

**Mais:**
- **Novidades:** cada decisão nova (Dxxx) entra sozinha numa linha do tempo, em linguagem simples, com a área marcada ("Parceiros", "Atacado", "Planos"…). A equipe vê o que mudou desde a última visita.
- **Busca** em tudo, e o Maurício respondendo pela base (funciona sem chave de IA, como o manual de hoje).
- **Progresso por pessoa:** aulas feitas, acertos e trilha concluída. O dono vê quem já está pronto.
- **Em destaque:**
  - "Aprender" no topo do menu do Master;
  - para quem tem trilha incompleta, um card na tela Agora;
  - ao convidar alguém na Equipe, a trilha da função já vem atribuída.

## 4. Fases

| Fase | Entrega | Pronto quando |
|---|---|---|
| **BC0** | Inventário de todas as regras por área (tirado do código e das decisões) e a estrutura das trilhas | Lista revisada pelo dono |
| **BC1** | Tela "Aprender" no Master: trilhas, aulas com números ao vivo, busca, Novidades a partir das decisões | Teste que proíbe número fixo; capturas em 360/1440 |
| **BC2** | Perguntas por aula, progresso por pessoa, painel do dono ("quem está pronto"), trilha atribuída no convite | e2e: pessoa nova conclui a trilha Base |
| **BC3** | Maurício "equipe" respondendo pela base; a cada decisão nova, a aula da área recebe o aviso "mudou" | Pergunta sobre comissão responde com o número atual |

## 5. Decisões do dono (com o padrão recomendado)

| # | Decisão | Padrão recomendado |
|---|---|---|
| 1 | Quem vê | Toda a equipe do Master; parceiros e lojistas **não** veem (eles já têm o próprio guia) |
| 2 | Trilha obrigatória | A Base é obrigatória para todos; a da função, para quem tem a função |
| 3 | Nome no menu | "Aprender" |
| 4 | Marcas | Começa pela E-commerce; SuperDrop e Brás entram como trilhas próprias depois |

## 6. Cuidados

- Nada de segredo na base: nenhuma chave, senha ou dado de cliente, só regras.
- Aula com regra que ainda não está no ar aparece como **"em breve"**, nunca como pronta.
- Textos curtos e simples, com exemplos de verdade, sem jargão.
