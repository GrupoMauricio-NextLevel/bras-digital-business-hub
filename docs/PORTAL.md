# Portal SuperDrop: racional (v2, atualizado)

Domínio: `superdrop.com.br`. Uma aplicação atende todos os endereços e decide o conteúdo pelo endereço de quem acessa.

| Endereço | O que é |
|---|---|
| `superdrop.com.br` | Portal institucional (vender o SuperDrop a pessoas comuns) |
| `superdrop.com.br/f/mantosshop`, `/f/alpha-outfit` | Página de vendas do fornecedor: ele em destaque, SuperDrop discreto |
| `app.superdrop.com.br` | Painéis: master, fornecedor, membro, expedição |
| `loja.superdrop.com.br` | Loja de cada membro |
| domínio do fornecedor white label | A mesma página de vendas dele, sem marca SuperDrop |

## 1. Empresas e foco dos próximos 15 dias
- **NextLevel Marketing Ltda.**: a plataforma (assinaturas, taxas, serviços, Academy).
- **Mega Tron Comércio Eletrônico Ltda.**: a empresa que compra dos fornecedores e vende aos membros NextLevel. Ambas são suas e a parte fiscal está resolvida.
- **Foco agora: os dois fornecedores (MantosShop e Alpha Outfit).** A NextLevel/Mega Tron captando clientes e o assinante independente ficam para depois.
- E-mail transacional: resolver em seguida (bloqueia convites, aviso de fim de teste e recuperação de senha).

## 2. Quem paga o quê e quem recebe o quê

| Situação | Quem paga | Quem recebe | Comissão do fornecedor |
|---|---|---|---|
| Membro que entra com o **cupom** de um fornecedor | 100% à NextLevel | NextLevel | **Só os fundadores**, por acordo temporário: 25% do setup + 20% da mensalidade |
| Fornecedor que não é fundador | Paga setup + mensalidade + taxa de transação | NextLevel | **Nenhuma** (o fornecedor ganha vendendo produtos) |
| Membro que entra por conta da NextLevel | 100% à NextLevel | NextLevel | Nenhuma |
| Assinante independente (todos os fornecedores) | Assinatura à NextLevel; produtos à Mega Tron | NextLevel / Mega Tron | Nenhuma. Sem taxas de plataforma para a própria empresa |

Recebimentos:
- **Fornecedor** recebe as recargas dos membros na conta Mercado Pago **dele**.
- **Membro com loja ativa** (subdomínio ou domínio próprio) conecta o **próprio** Mercado Pago para receber dos clientes.
- Planos, preços e taxas: ver **`docs/PLANOS.md`**.

## 3. Cupom, teste e atribuição
- O cupom (`MANTOSSHOP7`, `ALPHA7`) identifica o fornecedor e fixa de quem é o membro.
- **Teste de 7 dias sem cartão de crédito**, em modo demonstração: dados de exemplo, Pix e pedidos simulados, sem pedido real ao fornecedor. Academy e Loja NextLevel em prévia completa.
- No dia 7 o membro escolhe um plano e paga (Pix à vista ou cartão em até 6x). Os dados do teste ficam guardados por 30 dias.
- Um teste por CPF/CNPJ, e-mail e telefone (antiabuso). Atribuição fixada no primeiro cadastro.

## 4. Comissão dos fundadores (temporária)
- Parâmetros no contrato: percentual do setup, percentual da mensalidade e **data de término** (proposta: 12 meses). Depois disso, condições normais, sem comissão.
- Só sobre valor efetivamente pago; estorno anula; abatida no fechamento mensal do fornecedor (mecanismo já existente).

## 5. Páginas necessárias
**Portal:** Home, Como funciona, Planos e preços, Para fornecedores, White label, Fornecedores parceiros, Academy (prévia), FAQ, Contato; Termos de uso, Privacidade, Compartilhamento de dados, Cookies; Login, Cadastro (com cupom), Recuperar senha, Checkout de assinatura, Boas-vindas.
**Fornecedor:** página de vendas própria, editor da página, leads e assinaturas, cupons e desempenho, extrato de comissões, upgrade para white label (contrato, logo, domínio).
**Membro:** trial com contagem regressiva, Loja NextLevel e Academy impressionantes, escolha de fornecedor (independente).
**Master:** aprovação de fornecedores e páginas, contratos, cupons globais, conciliação de comissões.

## 6. Pontos cegos (atualizado)
1. **Variação por cor não existe.** Hoje cada produto varia só por **tamanho**. Os produtos do Brás (roupas, calçados, acessórios) exigem **cor × tamanho**, grades por cor e fotos por cor. Precisa entrar antes de cadastrar catálogos reais. Também as páginas e textos do portal não devem falar só de "camisas".
2. **Preço definido pelo fornecedor perdeu sentido.** Sem comissão (exceto fundadores), o fornecedor não ganha nada com preço maior e pode baixá-lo para atrair membros. Proposta: **a tabela da NextLevel é o preço**; o fornecedor oferece cupom e bônus, sem alterar o preço. Só os fundadores teriam preço próprio, dentro de piso e teto.
3. **Tarifa de parcelamento do Mercado Pago:** confirmar que 14% cobre o 6x no prazo de recebimento escolhido. Sem isso, o parcelado dá prejuízo.
4. **Empresas emissoras:** cada fatura precisa dizer qual empresa cobra (NextLevel Marketing ou Mega Tron), para o recibo e para a conciliação. Guardar isso desde já no dado da fatura.
5. **Recarga de membros Mega Tron** cai na conta da Mega Tron (e não na do fornecedor), e depois há repasse aos fornecedores. Fica para a fase do assinante independente.
6. **E-mail:** convite, fim do teste, recibo e recuperação de senha dependem dele.
7. **Renovação após os 12 meses grátis** da Loja Própria: definir preço de renovação (R$ 2.364/ano ou R$ 279/mês), aviso antecipado (D-30, D-7) e o que acontece se não pagar.
8. **Antiabuso do cupom:** limite de usos por cupom e por pessoa, prazo de validade, painel de uso para o fornecedor.
9. **LGPD:** aviso e aceite do compartilhamento dos clientes do fornecedor com a NextLevel, com revisão jurídica dos termos.
10. **Academy:** um módulo completo gravado esta semana já sustenta o teste. Precisa de hospedagem de vídeo (ex.: vídeo não listado) e de controle de acesso.
11. **Infra:** o plano gratuito do Render hiberna; para o portal público e o teste de 7 dias, use o plano pago.
12. **Aceite dos termos:** versionar o aceite (quem aceitou qual versão, quando).

## 7. Decisões pendentes
1. R$ 2.400 da Loja Própria: **setup com 12 meses de plataforma incluídos** (interpretação adotada). Confirma?
2. Setup de entrada dos fornecedores (proposta R$ 1.997 no SuperDrop e R$ 15.000 na Central White Label) e mensalidades da tabela em `PLANOS.md`.
3. Prazo do acordo de fundadores (proposta: 12 meses).
4. Preço definido pelo fornecedor: só fundadores ou ninguém (proposta: ninguém, preço da tabela).
5. Benefícios incluídos no pacote de R$ 2.400 (Academy no primeiro ano, suporte prioritário por 3 meses).
6. Conteúdo de MantosShop e Alpha Outfit: logo, cores, textos, WhatsApp, depoimentos, fotos.

## 8. Fases (foco nos dois fornecedores)
- **P1 (15 dias):** portal e páginas de MantosShop e Alpha Outfit, cupom e teste de 7 dias sem cartão, atribuição, planos com semestral e anual, checkout Pix e cartão em até 6x, Academy com o módulo completo, e-mail transacional.
- **P2:** comissão dos fundadores com prazo e extrato, editor da página, upgrade para Central White Label com domínio.
- **P3:** Loja NextLevel e Academy de impacto (com U5).
- **P4:** assinante independente e Mega Tron (custódia, repasse, catálogo multi-fornecedor).
