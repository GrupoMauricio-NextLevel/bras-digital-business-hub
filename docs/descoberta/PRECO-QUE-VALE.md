# Preço que vale hoje (fase P0)

> **Fonte única para consulta:** Master → Financeiro NextLevel → **Preços do grupo** (`/master/financeiro/precos`).
> - A tela lê as fontes reais e mostra, para cada valor, de onde vem e onde se edita.
> - Este documento registra **as fontes e as divergências**; os números do dia estão na tela, porque o Master pode editá-los.

## Onde mora cada preço (fontes)
| Fonte | O que guarda | Onde se edita |
|---|---|---|
| Tabela do SuperDrop (`price_book`, `platform_settings`) | Planos do lojista (Drop manual, Loja SuperDrop, Loja Própria), taxas por pedido, fornecedor (Start, Growth, Scale), White Label, desconto no Pix, add-ons | Master → Financeiro SuperDrop → Regras |
| Cupons do fornecedor (`coupons.trial_days`) | Dias de teste do lojista SuperDrop | Master → Fornecedores |
| Catálogo do Master (`catalog_products`, `catalog_price_versions`) | Planos Commerce, Loja Pronta, migração, temas, marketing, planos da Brás (membro e importadora) e da Cargas, serviços da Brás e publicidade | Master → Financeiro NextLevel → Catálogo e preços |
| Ofertas (`catalog_offers`) | Oferta de entrada da Commerce (3 dias, 1º mês R$ 9,90, taxa zero por 3 meses) | Master → Financeiro NextLevel → Ofertas e comissões |
| Regras da Brás (`bras.rules`) | Comissão da transportadora por plano, cargas grátis por mês, regras do membro | Brás → Regras |
| Regras da Excursão (`cargas.excursion_rules`) | Taxa por fardo (desligada), Pix do frete (desligado) | Brás → Ônibus de excursão |
| Regras do Club (`club.rules`) | Valor do ponto, pontos por compra, por fardo e por indicação, guia, teto do vale | Brás → Club |
| Parceiros (`partners.settings`) | Comissão do setup por faixa e de manutenção | Master → Parceiros |
| Meu Contador (`fiscal.meu_contador`) | Preço do chamado (cobrança desligada) | Brás → Meu Contador |

## Divergências encontradas (e o caminho aprovado)
1. **Teste grátis:** três regras diferentes: Commerce 3 dias + R$ 9,90; SuperDrop 7 dias com cupom, depois bloqueia; Brás e Cargas grátis. **Caminho:** grátis permanente com taxa sobre a venda + 14 dias do plano do meio que caem para o grátis (fase P5).
2. **Duas tabelas de preço:** SuperDrop no price book; o resto no catálogo do Master. **Caminho:** o catálogo vira a fonte única e o SuperDrop passa a ler dele, por último e com teste de regressão.
3. **Desconto anual:** o catálogo dá 25% no anual da Commerce; o SuperDrop não tem anual; o `PLANOS.md` diz que não há desconto por ciclo nos planos. **Caminho:** "pague 8, leve 12" no Pix, igual em todas as marcas (fase P5).
4. **Planos em rascunho:** os planos da Brás (Prata, Ouro, Platinum), da importadora e da Cargas estão em rascunho no catálogo. **Caminho:** publicar quando a cobrança for ligada.
5. **Documento × sistema:** o `docs/PLANOS.md` (v2) tem valores do fornecedor SuperDrop diferentes do sistema. **Caminho:** o `PLANOS.md` fica como histórico; o preço que vale é a tela "Preços do grupo" (D123).

## Regra a partir de agora (D123)
- **Nenhum preço novo fixo no código.** Preço novo entra no catálogo do Master ou nas regras versionadas.
- **Mudança de preço que vale para cliente** passa pelo Master, com versão e auditoria. Quem já tem uma condição mantém a dela.
