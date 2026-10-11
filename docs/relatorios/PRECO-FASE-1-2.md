# Preço do grupo — fases P1 e P2: dados reais e a voz do cliente (D124)

## O que ficou pronto
- **Master → Financeiro NextLevel → Descoberta** (`/master/financeiro/descoberta`), uma seção por marca:
  - **funil** do cadastro ao pagamento, com quantos chegam a cada etapa e quanto tempo leva;
  - **cadastros por semana** (8 semanas);
  - **coortes** por mês de entrada: quantos continuam ativos depois de 30, 60 e 90 dias e quanto cada cliente rendeu ao grupo;
  - **faixas de venda** (30 dias), **origem** do cliente e **uso de recursos** por quem paga e quem não paga.
  - Só números somados: nenhum nome, documento, e-mail ou telefone.
- `scripts/funil-marcas.ts`: a mesma conta em Markdown ou JSON, para guardar uma foto por mês (só leitura).
- **Questionário de preço** nos painéis do lojista (Commerce e SuperDrop), do Meu Brás e da transportadora:
  - 5 perguntas, menos de 1 minuto, anônimo;
  - **desligado**: só aparece quando o dono ligar na tela Descoberta;
  - aparece uma vez por pessoa, depois de 7 dias de uso (ajustável);
  - o resultado por marca (faixa de preço aceitável e % que sentiria muita falta) só aparece com 5 respostas ou mais.
- `docs/descoberta/ROTEIROS.md`: roteiros de entrevista para as 12 personas, com as regras (30 minutos, perguntar sobre o passado, gravação só com consentimento, anotação anônima).
- `docs/descoberta/DADOS-MARCAS.md`: como ler cada número e os limites conhecidos.

## Verificações
- `tests/funil-marcas-p1.test.ts`: conta do funil (etapas, mediana, coortes, faixas, origem, uso); nenhuma informação pessoal sai; só o Master vê.
- `tests/questionario-preco-p2.test.ts`: desligado por padrão; dias de uso; uma vez por marca; "agora não"; resposta sem ligação com a pessoa; mínimo de respostas para o Master ver; só o Master configura.
- e2e (passo 15): o Master abre a Descoberta, liga o questionário; a membro responde no Meu Brás (axe em 390 px); o questionário some; o Master vê a resposta somada.
- Tipos, estilo e build de produção sem erro.

## O que depende do dono
- **Aprovar os roteiros** de entrevista antes de usar e dizer quem conversa com os clientes.
- **Ligar o questionário** quando quiser começar a ouvir (Master → Financeiro → Descoberta).
- As conclusões com números de produção entram na fase P3, depois de algumas semanas de questionário e das primeiras entrevistas.

## Próxima fase
P3/P4: cartões de persona com fonte para cada afirmação e a arquitetura de preço em rascunho, com simulação de 12 meses.
