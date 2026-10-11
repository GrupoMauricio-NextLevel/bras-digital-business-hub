# Preço do grupo — fases P3 e P4: personas com fonte e proposta de preço em rascunho (D125)

## O que ficou pronto
- `docs/descoberta/PERSONAS.md`: as 12 personas com **fonte em cada afirmação** (sistema, mercado ou hipótese) e o **mapa de fricção** (F1 a F10), com a tela onde acontece e a fase que resolve.
- **Master → Financeiro NextLevel → Proposta de preço** (`/master/financeiro/proposta`):
  - a escada sugerida (Commerce e SuperDrop) ao lado da de hoje, lida das fontes reais;
  - a conta de cada plano por cliente/mês e **a partir de quanto de venda cada plano sai mais barato que o grátis** (o número que o painel vai mostrar ao cliente);
  - **12 meses em 3 cenários**, hoje × proposta, e a proposta com a conversão de hoje (para separar o ganho do grátis do ganho de mais gente assinar);
  - formulário para ajustar valores e cenários; gravar só refaz a conta.
- `docs/descoberta/ARQUITETURA-PRECO.md`: porta de entrada por marca, escada, ciclos, cashback, Passe do Grupo, simulação e guarda-corpos.

## O que a conta mostra (cenários como hipótese)
- No cenário base, **o grátis cobre o custo** (Commerce: rende R$ 26 e custa R$ 9 por cliente/mês em média; SuperDrop: R$ 25 × R$ 9) e **nenhum plano dá prejuízo**.
- Quase todo o ganho vem de quem não assina **continuar vendendo no grátis pagando taxa**, em vez de sair no bloqueio.
- **Ponto de atenção:** no cenário pessimista da Commerce, com a conversão de hoje, a proposta empata com o modelo atual. Os números reais da Descoberta vão dizer em qual cenário estamos.

## Verificações
- `tests/proposta-preco-p4.test.ts`: anual "pague 8, leve 12", ponto de equilíbrio, 12 meses com e sem grátis, guarda-corpos (aponta grátis que não cobre o custo), leitura do modelo de hoje das fontes, só o Master grava.
- e2e: passo 15 abre a Proposta de preço (axe em 1440, sem rolagem em 360).
- Tipos, estilo e build de produção sem erro.

## O que depende do dono
- **Aprovar (ou ajustar) a proposta por escrito.** Sem isso a fase P5 implementa as peças **desligadas**.
