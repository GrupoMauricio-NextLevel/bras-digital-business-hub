# Portal SuperDrop: racional (v2, atualizado)

Domínio: `superdrop.com.br`. Uma aplicação atende todos os endereços e decide o conteúdo pelo endereço de quem acessa.

| Endereço | O que é |
|---|---|
| `superdrop.com.br` | Portal institucional (vender o SuperDrop a pessoas comuns) |
| `superdrop.com.br/f/mantosshop`, `/f/alpha-outfit` | Página de vendas do fornecedor: ele em destaque, SuperDrop discreto |
| `app.superdrop.com.br` | Painéis: master, fornecedor, membro, expedição |
| `loja.superdrop.com.br` | Loja de cada membro |
| domínio do fornecedor white label | A mesma página de vendas dele, sem marca SuperDrop |

## 1. Quem paga o quê e quem recebe o quê

| Situação | Quem paga | Quem recebe | Comissão do fornecedor |
|---|---|---|---|
| Membro que entra **pela página/cupom de um fornecedor** | Membro paga 100% à NextLevel | NextLevel | Sim, sobre **setup e mensalidade** desse membro (percentuais a definir) |
| Membro que entra **por conta da NextLevel** (portal, sem cupom) | Membro paga 100% à NextLevel | NextLevel | Nenhuma |
| Assinante independente (todos os fornecedores) | Paga 100% à NextLevel | NextLevel | Nenhuma sobre a assinatura. O fornecedor vende produtos à NextLevel, sem taxa da NextLevel |
| Fornecedor SuperDrop | Mensalidade + taxa de volume (racional pendente) | NextLevel | não se aplica |
| Fornecedor White Label | Setup + mensalidade + % sobre vendas da rede | NextLevel | Mantém a comissão dos membros dele |

Regras fechadas nesta versão:
- Fornecedor só ganha de clientes **dele**, e só sobre setup e mensalidade (não sobre vendas de produtos nem sobre assinantes da NextLevel).
- Cada fornecedor **define o preço de venda** aos seus membros (limites abaixo).
- A NextLevel compra direto dos fornecedores para os membros NextLevel, **sem taxas para a própria NextLevel**.
- Todo membro básico tem **7 dias de acesso demonstrativo** com o cupom entregue pelo fornecedor (ex.: `MANTOSSHOP7`, `ALPHA7`).
- A **Loja NextLevel e a Academy** dentro do painel do membro precisam impressionar no período de teste, inclusive com módulos bloqueados (mostrando o que está em construção e para onde vamos).

## 2. Cupom, teste e atribuição
- O cupom identifica o fornecedor: quem se cadastra com ele fica **atribuído** àquela rede (base da comissão).
- Teste de 7 dias em **modo demonstração**: dados de exemplo, Pix e pedidos simulados, sem pedido real ao fornecedor. Academy e Loja NextLevel em prévia completa.
- No dia 7 o membro paga a primeira fatura para continuar; os dados do teste ficam guardados por 30 dias.
- Um teste por CPF/CNPJ, e-mail e telefone (antiabuso).
- A atribuição é fixada no primeiro cadastro e não muda depois.

## 3. Comissão recorrente (proposta a validar)
- 25% do setup (já existe) + **20% da mensalidade paga** dos membros dele, enquanto o membro estiver ativo.
- Só sobre valor **efetivamente pago**; estorno ou chargeback anula a comissão; abatida no fechamento mensal do fornecedor (mecanismo já existente).
- Checagem de margem: em uma Loja SuperDrop de R$ 97/mês, custo de servir ~R$ 13 e comissão de 20% (R$ 19), sobram ~R$ 65 (67%). Cabe folga até ~30%.

## 4. Preço definido pelo fornecedor (proposta a validar)
- **Piso:** preço de lista da NextLevel. **Teto suave:** 3x a lista (evita preço absurdo).
- A comissão incide sobre o preço pago. Mudança de preço vale para novos membros; quem já assina mantém o valor (grandfathering).
- Cupom com desconto: o custo do desconto sai da comissão do fornecedor, não da NextLevel.

## 5. Páginas necessárias
**Portal:** Home, Como funciona, Planos e preços, Para fornecedores, White label, Fornecedores parceiros, Academy (prévia), FAQ, Contato; Termos de uso, Privacidade, Compartilhamento de dados, Cookies; Login, Cadastro (com cupom), Recuperar senha, Checkout de assinatura, Boas-vindas.
**Fornecedor:** página de vendas própria, editor da página, leads e assinaturas, cupons e desempenho, extrato de comissões, upgrade para white label (contrato, logo, domínio).
**Membro:** trial com contagem regressiva, Loja NextLevel e Academy impressionantes, escolha de fornecedor (independente).
**Master:** aprovação de fornecedores e páginas, contratos, cupons globais, conciliação de comissões.

## 6. Pontos cegos

### Bloqueiam o lançamento
1. **E-mail transacional não existe.** Convite, fim de trial, recibo e cobrança dependem dele. Também **não há "esqueci a senha" por e-mail** (hoje só senha temporária). Precisa de provedor e SPF/DKIM no domínio.
2. **NextLevel comprando e revendendo ao membro = operação comercial.** Isso cria obrigação fiscal (nota fiscal, ICMS/ISS), contrato de compra e venda com o fornecedor e responsabilidade perante o consumidor. Fiscal está fora do escopo do código, mas **o modelo exige contador e advogado antes de operar**.
3. **Dinheiro em custódia.** Para membros NextLevel, a recarga precisa cair na conta da NextLevel e ser repassada aos fornecedores (hoje cai na conta do fornecedor). Exige regra de repasse (prazo, disputa) e, idealmente, split do Mercado Pago.
4. **LGPD:** compartilhar clientes do fornecedor com a NextLevel exige base legal, aviso no cadastro e contrato entre as partes. Revisão jurídica.
5. **Direito de arrependimento (7 dias, CDC)** em assinatura online: o teste de 7 dias e a primeira cobrança precisam respeitar isso.

### Afetam a receita
6. **Pix não cobra sozinho todo mês.** Mensalidade por Pix depende do membro pagar; a inadimplência sobe. Alternativa: cartão recorrente (Mercado Pago Assinaturas), que é outra integração. Sugestão: começar com fatura mensal por Pix com lembretes (já existe) e oferecer cartão depois.
7. **Desintermediação:** membro e fornecedor combinam por fora para não pagar comissão. Precisa de cláusula de contrato e, para membros NextLevel, esconder a identidade do fornecedor.
8. **Comissão em disputa:** o que acontece se o fornecedor sair ou for suspenso? De quem é o membro quando ele vira white label? Definir e escrever no contrato.
9. **Conflito de canal:** o mesmo produto pode ser vendido pelo fornecedor na página dele e pela NextLevel a independentes por preços diferentes.
10. **Uma parte do teste custa dinheiro** (infraestrutura e suporte). Quem paga o teste dos cupons? Proposta: a NextLevel, com limite por cupom.

### Multi-fornecedor (assinante independente)
11. Catálogo unificado com produtos duplicados entre fornecedores, carrinho dividido por fornecedor, vários fretes, **corte e prazo diferentes por fornecedor**, avaliação e suspensão de fornecedor que atrasa, e carteira por fornecedor ou da NextLevel.

### Operação e produto
12. Cancelamento, troca de plano (SuperDrop para White Label) e regra de proporcionalidade.
13. Produção de conteúdo da Academy: o teste só impressiona com pelo menos um módulo completo e o restante com prévia honesta. Não prometer datas que não serão cumpridas.
14. Marcas de clubes: camisas de time envolvem propriedade intelectual; termos com responsabilidade do fornecedor e política de remoção.
15. Infra: o plano Free do Render hiberna e não serve para um portal público; usar o plano pago no mínimo. Backups e limites do banco gratuito.
16. Antifraude e captcha no cadastro e no teste; medição do funil (visita, cadastro, teste, assinatura).

## 7. Decisões pendentes
1. Percentual da comissão sobre a mensalidade e por quanto tempo (proposta: 20%, enquanto ativo).
2. Piso e teto do preço do fornecedor (proposta: lista e 3x a lista).
3. Teste demonstrativo: sandbox com dados de exemplo (proposta) ou loja real limitada.
4. Mensalidade por Pix agora, cartão depois (proposta).
5. Modelo de compra da NextLevel: tabela de preço de compra por fornecedor, prazo de repasse e quem responde por devolução.
6. Fiscal e jurídico: alinhar com contador e advogado antes de vender a independentes.
7. Preço do assinante independente e do upgrade para white label.
8. Conteúdo de MantosShop e Alpha Outfit: logo, cores, textos, valores, WhatsApp, depoimentos.

## 8. Fases sugeridas
- **P1:** portal institucional, páginas dos dois fornecedores, cupom e teste de 7 dias, atribuição, e-mail transacional e recuperação de senha, assinatura por Pix.
- **P2:** comissão recorrente e extrato do fornecedor, preço definido pelo fornecedor, editor da página, upgrade para white label com domínio.
- **P3:** Academy e Loja NextLevel de impacto (com U5) e cartão recorrente.
- **P4:** assinante independente com todos os fornecedores (depende das decisões 5 e 6).
