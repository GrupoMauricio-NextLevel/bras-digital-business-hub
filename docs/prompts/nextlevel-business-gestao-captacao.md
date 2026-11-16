# NextLevel Business: gestão do negócio e captação de clientes, em autoatendimento

> Pedido do dono (16/11/2026, D303 e D304). Autoridade: `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` > `docs/design/DECISIONS.md` > este documento.
> **Situação:** direção aprovada; etapa começa agora (D304). Piloto: Megatron.

## 1. As três linhas (não misturar)
| Linha | O que é | Quem faz o trabalho |
|---|---|---|
| **NextLevel Commerce** | Loja virtual | O lojista, no painel da loja |
| **NextLevel Business** | Gestão do negócio e captação de clientes | **O próprio cliente, sozinho.** O sistema faz o resto; ninguém da NextLevel participa |
| **NextLevel Soluções** | Portfólio de serviços (site, migração, temas, anúncios, conteúdo) | A equipe da NextLevel (`/solucoes`) |

**Regra de ouro do Business:** se uma tela ou passo precisa de alguém da equipe para funcionar, ela não é Business; ou vira automática, ou vai para a Soluções como serviço opcional.

## 2. Para quem
Para todos (D304): lojistas da Commerce (mesmo login, ativa dentro do painel), empresas de serviço (clínica, escola, imobiliária, agência, prestadores), atacadistas e importadores. Piloto: **Megatron** (Mega Tron Comércio Eletrônico Ltda).

## 3. O que já existe e vira produto (regra anti-duplicação)
| Peça do Business | Onde já existe hoje (uso interno da NextLevel) | Decisões | O que falta para rodar sozinho |
|---|---|---|---|
| **Captação**: de onde veio cada contato, links rastreados, quem está no site agora | Tráfego e campanhas, Agora no site | D290 a D292, D294 | Código de rastreio por empresa; página de captação própria |
| **Anúncios**: Pixel da Meta e Google, retorno de quem virou cliente | Pixel e Google, Retorno | D295, D298 | O cliente cola os próprios códigos; a "Mesa de anúncios" (D299) depende de equipe e **fica na Soluções** |
| **CRM / funil**: contatos, etapas, ficha com linha do tempo | Comercial, CRM | D294, D301 | Etapas configuráveis pelo cliente |
| **Atendimento num lugar só**: WhatsApp, chat do site, e-mail | Atendimento, Caixa de entrada | D296, D297, D300 | Cada cliente conecta o próprio WhatsApp e e-mail; respostas prontas e robô |
| **Propostas e contratos com aceite e Pix** | Contratos, Propostas | D276, D277, D284 | Modelos do cliente; Pix e Mercado Pago do cliente |
| **Financeiro**: cobranças, parcelas, lembretes | Receita, contratos | D270, D284 | Contas do cliente |
| **Equipe de vendas**: metas, comissão, placar | Executivos, Bônus e metas, Placar | D271 a D275 | Regras configuráveis pelo cliente |
| **Aprender**: base de conhecimento da equipe do cliente | Aprender | D264, D266 | Conteúdo do cliente |

## 4. Base técnica (encontrada em 16/11/2026)
- As tabelas dessas telas guardam dados **por marca da NextLevel** (`brand`), por exemplo `crm_acompanhamento`, `trafego_sessoes`, `brand_leads`. Ou seja, hoje só servem à NextLevel.
- A empresa cliente já existe no sistema como **organização** (`organizations`), dona das lojas (`stores.organization_id`).
- **Caminho:** a organização vira a dona dos dados do Business (coluna de organização nas tabelas reaproveitadas, com bloqueio no servidor por `requireRole`/`assertCanAccess`). A NextLevel passa a ser só mais uma organização usando o mesmo módulo. Nada de tabelas paralelas.
- Segredos de cada cliente (WhatsApp, e-mail, Pixel, Mercado Pago) só com `encryptSecret`.
- Preço e limites do Business na tabela de preços (`getPriceBook`).

## 5. Fases
- **B0, desenho (agora):** este documento; lista exata das tabelas e telas a ganhar a organização; o que sai por depender de equipe.
- **B1, piloto Megatron:** código de marca da Business; organização da Megatron com **Captação + CRM** (contatos do site e de links rastreados, funil, ficha); teste automático provando que uma organização nunca vê a outra.
- **B2, painel do cliente:** casca própria do Business (a mesma do Master, sem nada interno da NextLevel), convite da equipe do cliente, funções e permissões, cadastro e primeiros passos sozinho.
- **B3, atendimento:** WhatsApp, chat do site e e-mail do próprio cliente no mesmo lugar.
- **B4, anúncios, propostas e cobrança:** Pixel/Google do cliente com retorno automático; propostas e contratos com Pix do cliente.
- **B5, venda:** planos, teste, página pública da Business e ativação dentro do painel da loja da Commerce.

## 6. Perguntas abertas (não bloqueiam a B1)
1. Nome no menu para o cliente: "Business", "Gestão" ou outro?
2. Preço de entrada e o que entra no plano grátis/teste (decidir antes da B5).
3. Domínio: página da Business dentro de `nextlevelgroup.com.br` ou um domínio próprio?
