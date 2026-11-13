# Portal do cliente: piloto da academia (NB10 do NextLevel Business)

> **Status: AGUARDANDO O DONO.** A academia piloto está confirmada (D296). O dono vai detalhar o piloto em outra conversa. Aqui entram as respostas e, com elas, o prompt de engenharia da NB10.
> **Plano-mãe:** `docs/prompts/nextlevel-business-coracao-do-negocio.md`. Leia a Parte 5.16 (bases que as fases NB1 a NB3 já deixam prontas) e o Anexo A (regras mínimas que este piloto não pode afrouxar).
> **Como preencher:** responda as perguntas da Parte 2 em português simples. Pode responder só as que souber; as outras ficam com o padrão sugerido. Depois, uma sessão de trabalho transforma as respostas na Parte 4 (prompt de engenharia) e começa a NB10.

---

## Parte 1. O que já está decidido (não precisa responder)

- O portal é um **módulo** do painel da NextLevel Commerce. Ligar não muda o site, o domínio, a equipe nem os contatos; desligar esconde o portal e não apaga dados.
- **Endereço do portal:** `/portal` no site da academia (ou `/store/<endereço>/portal` sem domínio próprio).
- **Entrada do aluno sem senha:** código de 6 dígitos no e-mail, por academia, com sessão de 30 dias. Reaproveita o "Minha conta" que as lojas já têm.
- **Isolamento:** o aluno vê só a academia dele e as reservas dele. A equipe vê grade e inscritos. Outra empresa, nunca. Conferido por teste no servidor e por endereço direto.
- **Lotação:** duas reservas ao mesmo tempo na última vaga não passam da capacidade. Clique repetido não duplica reserva.
- **Horários:** no fuso da academia.
- **Fora da primeira versão:** mensalidade e cobrança do aluno, treino, avaliação física, prontuário, controle de catraca e **qualquer dado de saúde**.
- **Na equipe:** o portal aparece no grupo **NextLevel Business** do painel ("Portal do cliente").

---

## Parte 2. Perguntas para o dono (o detalhamento do piloto)

### 2.1 A academia
1. Nome, cidade e se tem mais de uma unidade (o piloto começa com uma).
2. Já tem site? Endereço (domínio) que quer usar?
3. Quantos alunos ativos, mais ou menos? Quantos devem entrar no piloto?
4. Quem da equipe vai usar o painel (recepção, professores, dono)? Quantas pessoas?

### 2.2 Aulas e grade
5. Quais modalidades (musculação, funcional, pilates, spinning, luta…)? Quais têm aula com horário e vaga limitada?
6. A grade se repete toda semana? Há aulas avulsas ou em feriado?
7. Capacidade por aula: fixa por modalidade ou por sala/horário?
8. Cada aula tem professor definido? O aluno precisa ver quem é?
9. Duração padrão de cada aula.

### 2.3 Regras de reserva
10. Com quanta antecedência a reserva abre (ex.: 48 h antes) e até quando fecha (ex.: 30 min antes)?
11. Limite de reservas por aluno (por dia ou por semana)?
12. Cancelamento: até quanto tempo antes? Cancelar em cima da hora ou faltar tem consequência (ex.: bloqueio de 7 dias)?
13. Turma cheia: lista de espera, com aviso automático quando abrir vaga?
14. Aula experimental para quem ainda não é aluno: entra no portal ou continua pelo formulário de contato?

### 2.4 Alunos e acesso
15. Como o aluno entra: a academia **convida** (importa uma lista) ou o aluno **pede acesso** e a equipe aprova?
16. A academia já tem os alunos em planilha ou em outro sistema (qual)? Dá para exportar nome, e-mail e WhatsApp?
17. Aluno com plano vencido pode reservar? Quem marca isso: a equipe, à mão?
18. Presença: a equipe marca quem veio (check-in na recepção) ou não precisa?

### 2.5 Avisos e uso no celular
19. Avisos ao aluno: confirmação da reserva, lembrete antes da aula, vaga liberada? Por e-mail, ou WhatsApp quando houver integração?
20. O aluno deve poder "instalar" o portal no celular como aplicativo (ícone na tela)?
21. O que a equipe quer ver todo dia (ocupação do dia, faltas, aulas cheias)?

### 2.6 Comercial
22. O portal entra como adicional pago ou cortesia no piloto? Por quanto tempo?
23. Com o piloto dando certo, que outro tipo de negócio poderia usar (estúdio, escola de dança, clínica)?

---

## Parte 3. Padrões sugeridos (valem para o que o dono não responder)

| Tema | Padrão |
|---|---|
| Unidades | Uma só |
| Grade | Semanal fixa com exceções por data (feriado, aula extra) |
| Capacidade | Por aula, editável |
| Abertura da reserva | 7 dias antes; fecha 30 min antes do início |
| Limite por aluno | Até 1 reserva por modalidade por dia |
| Cancelamento | Até 2 h antes; depois disso, conta como falta (sem bloqueio automático na v1) |
| Lista de espera | Sim, com aviso por e-mail quando abrir vaga; o primeiro da fila confirma em até 2 h |
| Entrada do aluno | A academia convida (cadastro manual ou planilha CSV com nome, e-mail e WhatsApp); o aluno entra pelo código no e-mail |
| Situação do aluno | Ativo, suspenso (não reserva) ou convidado; a equipe muda à mão |
| Presença | Opcional: a equipe marca na lista de inscritos |
| Avisos | E-mail de confirmação e lembrete 2 h antes |
| Portal no celular | Instalável (ícone na tela) |
| Painel da equipe | Aulas de hoje com ocupação, faltas da semana e aulas sempre cheias |

---

## Parte 4. Prompt de engenharia da NB10

> **A preencher** depois das respostas da Parte 2. Deve seguir o formato da Parte 11 do plano-mãe (função, objetivo, leitura obrigatória, código existente, como trabalhar, limites, aceite) e cobrir:
> - banco: aulas, ocorrências, reservas, lista de espera, situação do aluno;
> - lotação atômica;
> - idempotência;
> - telas da equipe e do aluno;
> - avisos;
> - testes de isolamento e de concorrência;
> - e2e da jornada "publicar site → ligar portal → convidar aluno → ver grade → reservar → cancelar".
