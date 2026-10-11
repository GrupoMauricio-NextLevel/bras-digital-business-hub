# Dados reais por marca (fase P1, D124)

> **Onde ver:** Master → Financeiro NextLevel → **Descoberta** (`/master/financeiro/descoberta`). Os números são do banco de produção, na hora.
> **Para guardar uma foto do mês:** `DATABASE_URL=<Neon> npx tsx scripts/funil-marcas.ts > docs/descoberta/funil-AAAA-MM.md` (só leitura; `--json` para planilha).
> **Sem dado pessoal:** a tela e o script só mostram números somados. Nenhum nome, documento, e-mail ou telefone sai daqui (há teste que confere isso).

## O que cada bloco mostra
| Bloco | Como é contado | Para que serve |
|---|---|---|
| Funil | Quantos chegaram a cada etapa e a mediana de dias entre uma etapa e a seguinte | Achar onde as pessoas param |
| Cadastros por semana | Últimas 8 semanas, começando na segunda-feira | Ver o efeito de campanha, parceiro e preço |
| Coortes | Por mês de entrada: % que ainda está ativa a partir do dia 30, 60 e 90 (só conta quem já tem esse tempo) e quanto rendeu ao grupo por cliente | Retenção e valor por cliente |
| Faixas de venda | Vendas pagas (lojas), compras pagas (Brás) ou fretes entregues (Cargas) nos últimos 30 dias | Onde um plano maior se paga |
| Origem | Parceiro, indicação do Club, fornecedor (cupom), vídeo de descoberta, campanha, importadora, direto | Canal que mais traz cliente |
| Uso de recursos | % de quem paga × quem não paga que usa logo própria, Mercado Pago, envio, domínio, cupom | Candidatos a recurso de plano pago |

## Etapas por marca
| Marca | Etapas | "Ativo" nas coortes | "Rendeu ao grupo" |
|---|---|---|---|
| NextLevel Commerce e SuperDrop | Cadastro → 1º produto → loja publicada → 1ª venda paga → pagou a NextLevel | Teve venda paga a partir do dia N | Faturas pagas à NextLevel |
| Brás Digital | Cadastro → perfil respondido → 1º pedido → 1º pedido pago → assinou um plano | Fez pedido a partir do dia N | Comissão da Brás nos pedidos pagos |
| NextLevel Cargas | Cadastro → 1ª carga ou viagem → 1ª entrega → plano pago | Teve carga ou viagem a partir do dia N | Comissão das cargas entregues |

## Limites conhecidos (fato)
- **Loja do SuperDrop** recebe o catálogo da rede do fornecedor, sem data própria: o "1º produto" conta a data de entrada.
- **"Pagou a NextLevel"** usa as faturas pagas e a assinatura ativa; contas antigas sem fatura no sistema aparecem como não pagantes.
- **Plano da transportadora** não guarda a data da troca de plano: a etapa "plano pago" usa a data do cadastro.
- **Ativo** é medido por venda, pedido ou carga, não por acesso ao painel (o painel não guarda histórico de acesso por dia).

## Conclusões
Ficam para depois da primeira foto do mês com os dados de produção: **cada conclusão marcada como [fato]** e com o número da tela. Os dados da demonstração local não valem como conclusão.
