# Brás v2 — Fase 1 (D110)

## Em 5 linhas (para o dono)
- **Cada importadora tem login próprio** em `bras.nextlevelgroup.com.br/importadora`. Você cria o acesso na Importadora 360, com senha provisória que a pessoa troca no primeiro acesso.
- **No celular, a importadora vê a fila do dia:** conferir as caixas, separar e entregar à transportadora com o código do motorista. Ela nunca vê quem é o comprador, nem preço.
- **Produtos de caixa fechada e estoque em caixas**, lançados no painel ou por planilha (com prévia antes de gravar).
- **Estoque real para o comprador:** ligando a descoberta ao produto, o membro vê o saldo de verdade. A confirmação baixa as caixas e nunca vende a mesma caixa duas vezes.
- **Importadora 360 no Estúdio:** ficha, saúde de 0 a 100 com o porquê, vendas e comissão de 12 meses, oportunidades, galpões, acessos e produtos.

## Entregue e no ar
| Função | Para quem | Onde |
|---|---|---|
| Login da importadora e equipe com funções | Importadora | /importadora |
| Hoje: conferir, separar, entregar com código | Importadora (balcão) | /importadora |
| Pedidos (só envio, sem dado do comprador) | Importadora | /importadora/pedidos |
| Produtos de caixa fechada (cubagem, faixas de preço) | Importadora e Master | /importadora/produtos e Importadora 360 |
| Estoque em caixas: lançamentos, contagem, planilha, histórico | Importadora e Master | /importadora/estoque e Importadora 360 |
| Galpões, equipe e ficha comercial | Importadora (dono) e Master | /importadora/galpoes e Importadora 360 |
| Importadora 360: saúde, receita, oportunidades, acesso | Master | Brás → Importadoras → Importadora 360 |
| Ligar a oferta da descoberta ao produto | Master | Brás → Descobertas → oferta |

## Ficou para depois e por quê
- **Bling:** fase F7, depende das credenciais do aplicativo da NextLevel.
- **Alto mar, contêiner e cotações:** fases F4 a F6, depois da revisão jurídica.
- **Chamar transportadora pelo painel:** fase F2, com o painel da NextLevel Cargas.
- **Fotos de produto e logo da importadora:** próxima rodada, pelo mecanismo de arquivos existente.

## O que depende de você
1. Criar o acesso da XDX (e das próximas importadoras) na Importadora 360.
2. Ligar cada descoberta ao produto da importadora: Descobertas → oferta → "Produto da importadora".

## Verificação
- Tipos, estilo e build ok.
- Testes novos: 12 (`tests/bras-importadora.test.ts`), com isolamento entre importadoras, permissões por função, estoque nunca negativo, disputa pela última caixa, planilha, código de retirada e saúde reproduzível.
- E2E `bras-portal` inteiro, incluindo o passo novo: o Master cria o acesso; a importadora troca a senha, cadastra galpão e produto, lança estoque e vê o pedido sem dado do comprador, com axe em 390 e 1440 px.

## Riscos e dívidas
- A contagem de concorrência foi testada no PGlite. No Neon, a atualização condicional vale igual, mas convém repetir o teste lá quando houver ambiente de homologação.

## Próxima fase
F2: NextLevel Cargas v1 (cadastro da transportadora, "chamar transportadora" pela importadora, painel grátis da transportadora e link do motorista).
