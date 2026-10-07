# Fase 1 — Navegação e inconsistências de conteúdo

Ferramenta: `e2e/auditoria-navegacao.mjs`. Ela entra com cada conta de demonstração, percorre o menu e os links internos (até 70 telas por conta), em 1440 e 390 px. Registra HTTP, erro de console, tempo, título, item ativo do menu e rolagem lateral. Também procura textos suspeitos ("NaN", "undefined", "null", data inválida, objeto cru, R$ vazio, tela de erro, inglês solto, marca errada) e compara os destinos do menu do celular com os do computador. Resultado bruto em `docs/auditoria-dono/qa/`.

## Cobertura da varredura (07/10/2026)

| Conta | Telas | Itens de menu | Menu do celular igual ao do computador | Problemas |
|---|---|---|---|---|
| Lojista SuperDrop (MRS Sports, Lite) | 68 | 23 | sim | 1 real + 1 falso alarme |
| Lojista SuperDrop Pro (Mantos) | 40 | 23 | sim | 1 real + 1 falso alarme |
| Fornecedor SuperDrop (Mega Tron) | 54 | 14 | sim | 1 real + 1 da própria ferramenta |
| Expedição SuperDrop | 2 | tela única | — | 1 real |
| Parceiro SuperDrop | 6 | 6 | sim | 0 |
| Dono de loja Commerce (Casa Aurora) | 70 | 18 | sim | 2 reais |
| Equipe de loja Commerce | 70 | 6 | sim | 0 |
| Master | 34 (limite) | 20 | sim | 2 reais + 3 falsos alarmes |

Nenhuma tela respondeu com erro (HTTP 4xx/5xx), nenhuma mandou para o login por engano, nenhuma teve rolagem lateral e nenhuma teve item ativo do menu errado.

## Inconsistências encontradas e corrigidas

| # | Tela | O que aparecia | O que deveria aparecer | Gravidade | Correção | Teste |
|---|---|---|---|---|---|---|
| 1.1 | Lojista → Início × Análise | "Vendas · 30 dias" no início usava "agora − 30 dias" no horário local; a Análise usa 30 dias de calendário (UTC). Pedido no limite contava numa tela e não na outra | O mesmo valor nas duas telas | **Alta** (número de dinheiro divergente) | Uma única janela `salesWindow` usada pelas duas; o gráfico diário do início vem da mesma conta | `tests/analytics.test.ts` (pedido no limite) |
| 1.2 | Loja → Auditoria (histórico de mudanças) | Texto técnico: `role: null → "STAFF" · email: null → …`; ações desconhecidas com o código interno | Texto em português: "papel: equipe · e-mail: ana@loja.com · preço: R$ 10,00 → R$ 12,50" | Média (confiança do cliente) | `describeChanges` com rótulos e valores legíveis; ações de suporte com nome claro | `tests/auditoria.test.ts` |
| 1.3 | Editor do tema | Sem título principal (leitor de tela não anunciava a tela) | Título "Editor do tema da loja" | Baixa (acessibilidade) | Título oculto visualmente | varredura |
| 1.4 | Expedição → Enviados | Sem título principal | Título "Enviados" | Baixa (acessibilidade) | Título visível | varredura |
| 1.6 | Master → abrir "NextLevel Commerce" | No endereço do Master, `/commerce` voltava para o login e caía no Dashboard (item ativo errado) | Abrir o console Commerce | **Alta** (atalho principal quebrado) | `/commerce` entrou na lista de prefixos de painel | `tests/host-routing.test.ts` |
| 1.7 | Master → cartões "Seus negócios" | O cartão SuperDrop mostrava o volume da rede inteira (R$ 106,7 mil, incluindo Commerce) e contava pedidos não pagos | Cada cartão com os números da sua marca, só vendas pagas sem frete (SuperDrop R$ 10,6 mil, Commerce R$ 96,1 mil; somam o total da rede) | **Alta** (número de dinheiro errado) | Contrato único de venda no Master (`SALE_WHERE`/`SALE_SUM`) e números por marca | `tests/master-numeros.test.ts` + conferência visual |
| 1.5 | Editor do tema em modo suporte | A faixa de modo suporte não aparecia no editor em tela cheia | Faixa visível também ali | Média (segurança operacional) | Faixa no layout do editor | — |

## Falsos alarmes (conferidos e descartados)

- Lojista → Saldo: "R$" sozinho é o prefixo do campo "Valor da recarga", não um valor vazio.
- Master → Serviços e CRM: "R$" sozinho é o prefixo dos campos "Orçamento" e "Preço cheio".
- Master → detalhe de pedido "lento (15 s)": a ferramenta esperava a rede ficar parada, mas a pré-carga de links nunca para; a tela abre em 0,1 s.
- Fornecedor → "modelo de importação": o link baixa a planilha-modelo (download), por isso não abre como tela.

## Lacunas que continuam abertas

- Não há conta de demonstração de equipe de loja SuperDrop nem de parceiro Commerce (achado 0.4). A varredura cobre esses papéis só pela regra de menu (equipe Commerce usa a mesma regra).
- A varredura limita 70 telas por conta: telas de detalhe muito numerosas (pedidos, produtos) são amostradas, não todas.
