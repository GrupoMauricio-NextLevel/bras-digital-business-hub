# NextLevel Business: tecnologia de gestão do negócio e captação de clientes

> Pedido do dono (16/11/2026, D303): "NextLevel Business, quero que seja uma tecnologia de gestão de negócio e captação para nossos clientes."
> Autoridade: `docs/constituicao/00-CONSTITUICAO-ECOMMERCE.md` > `docs/design/DECISIONS.md` > este documento.
> Situação: **direção aprovada, produto ainda não construído.** Nada daqui vale como regra até virar D-número.

## 1. A ideia em uma frase
O que a NextLevel construiu para se gerir no Master (CRM, atendimento, tráfego, campanhas, contratos, cobrança, metas da equipe) vira um produto que **qualquer empresa cliente usa para gerir o próprio negócio e trazer clientes**.

## 2. O que já existe e vira produto (regra anti-duplicação)
Nada de sistema novo: são os mesmos módulos, abertos por empresa cliente (cada uma só vê os próprios dados).

| Peça do Business | Onde já existe hoje | Decisões |
|---|---|---|
| **Captação**: de onde veio cada contato, links rastreados, pessoas no site agora | Master → Tráfego e campanhas, Agora no site | D290, D291, D292, D294 |
| **Anúncios**: Pixel da Meta e Google, retorno de quem virou cliente, mesa de campanhas | Tráfego → Pixel e Google, Retorno, Mesa de anúncios | D295, D298, D299 |
| **CRM / funil de vendas**: contatos, etapas, ficha com linha do tempo | Master → Comercial, CRM | D294, D301 |
| **Atendimento num lugar só**: WhatsApp, chat do site, e-mail | Master → Atendimento, Caixa de entrada | D296, D297, D300 |
| **Propostas e contratos com aceite e Pix** | Master → Contratos, Propostas | D276, D277, D284 |
| **Financeiro**: faturas, parcelas, contas de destino | Master → Receita, Financeiro | D270 |
| **Equipe de vendas**: metas, comissão, executivos de rua, placar | Executivos, Bônus e metas, Placar | D271 a D275 |
| **Base de conhecimento da equipe** | Master → Aprender | D264, D266 |
| **Página de captação / site** | Motor de páginas e temas da Commerce | — |

Para quem já tem loja na NextLevel Commerce, o Business é a camada de gestão e captação **em cima da loja** (mesmo login). Para quem não vende online (serviço, clínica, escola, importadora), é o produto sozinho.

## 3. Para quem (hipóteses a testar)
- Empresa de serviço que vive de WhatsApp e Instagram e perde contato (agência, clínica, escola, imobiliária).
- Lojista da Commerce que quer saber de onde vem a venda e organizar a equipe.
- Importadora ou atacadista do Brás com vendedores (cliente natural da Brás Digital e da China Hub).
- A própria Megatron (varejo com criadores): primeiro cliente de verdade, para provar o produto.

## 4. O que muda no sistema (o trabalho grande)
1. **Empresa cliente como tenant**: hoje esses módulos são da NextLevel; precisam passar a ser "da empresa X", com bloqueio no servidor para uma nunca ver a outra (regra máxima da Constituição).
2. **Painel do cliente Business**: a casca do Master com as telas acima, sem nada interno da NextLevel (lojas, parceiros, receita da plataforma).
3. **Conexões próprias de cada cliente**: o WhatsApp, o e-mail, o Pixel e o Google **dele**, com tokens criptografados (`encryptSecret`).
4. **Planos e cobrança** do Business pela tabela de preços (`getPriceBook`), nunca fixos no código.
5. **Página pública** em `nextlevelgroup.com.br` (hoje `/solucoes`) explicando o produto; o serviço de agência continua como "implantação feita pela nossa equipe".

## 5. Fases propostas
- **B0, decisões do dono:** nome no menu, público inicial, se a agência (fazer por você) continua vendida junto, preço de entrada.
- **B1, piloto interno:** Megatron usando CRM, Atendimento e Tráfego como empresa separada (prova o isolamento entre empresas).
- **B2, painel do cliente:** casca própria, convite da equipe do cliente, permissões por função.
- **B3, conexões do cliente:** WhatsApp, e-mail, Pixel/Google de cada empresa.
- **B4, planos e página pública:** cobrança, teste, página de vendas do Business.
- **B5, integração com a Commerce:** lojista ativa o Business dentro do painel da loja.

## 6. Perguntas para o dono (B0)
1. A agência (nossa equipe fazendo site, anúncio e conteúdo para o cliente) continua vendida dentro do Business como serviço de implantação, ou sai?
2. Primeiro público: empresas de serviço em geral, lojistas da Commerce ou atacadistas/importadores do Brás?
3. A Megatron pode ser o piloto?
4. Ordem de prioridade: pela regra 60/25/15, o Business disputa espaço com a Commerce. Ele entra antes do 10º lojista pagante ou depois?
