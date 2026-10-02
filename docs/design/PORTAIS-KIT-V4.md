# Kit dos portais v4: levar o padrão da home da Commerce para as outras homes

> Pedido do dono (2026-10-03): "levar o mesmo padrão da página da Commerce para as outras homes" + telas de login e de cadastro de parceiros em dois padrões novos. **Estado:** login e telas de parceiros feitos (v4 entrada); homes abaixo **planejadas**.

## 1. Telas de entrada (feitas)
- **Login** (`/login`): foto em tela cheia + cartão branco arredondado (celular: foto no alto, cartão por baixo; computador: cartão à direita). Só e-mail e senha (não existe login por Google/Apple). Perfis de demonstração continuam, em cartão à parte, só no modo de demonstração. Componente: `src/components/auth/auth-card-shell.tsx`.
- **Parceiros** (`/parceiros/entrar`, `/parceiros/cadastro`): faixa de foto no topo, folha branca arredondada que sobe sobre ela, nome do programa em cor de marca, título grande. Seletor de tipo: **Afiliado** (funciona) e **Agência / Desenvolvedor freelancer** (**lista de espera**, grava como interessado da marca). Componente: `src/components/auth/partner-shell.tsx`. As rotas ficam no grupo `(auth)`, sem o cabeçalho do portal.
- O programa de parceiros só aparece nas marcas com `partnersOpen` (hoje SuperDrop e NextLevel); na Commerce a rota volta para a home.
- Fotos provisórias do acervo da Commerce (`public/portal/commerce/*`); trocar quando houver fotografia de direção de arte.

## 2. Homes (planejadas)
| Página | Marca | Base de texto (já existe) | O que muda |
|---|---|---|---|
| Home geral | SuperDrop | `(portal)/page.tsx` | Cabeçalho flutuante, primeira dobra em campo de cor com palavra que alterna, mosaicos, faixa em loop, perguntas e chamada final |
| Fornecedor | SuperDrop | `(portal)/seja-fornecedor/page.tsx` | Mesmo kit, foco no catálogo → rede de lojas, painéis por papel, expedição |
| **White label** | SuperDrop | (página nova) | Ver seção 3 |
| Parceiros (vendas) | SuperDrop/NextLevel | `(portal)/parceiros/page.tsx` | Mesmo kit, simulador de potencial mantido, regras do programa reais |
| Serviços da agência | NextLevel | `(portal)/loja-nextlevel/page.tsx` | Catálogo completo de serviços em mosaico, pedido e conversa |

## 3. White label: o que a página pode e não pode prometer
**Definição do dono:** fornecedor que compra o sistema para colocar a logo dele.
**Existe hoje (pode anunciar, como "disponível"):** Central do fornecedor com painel por papel e expedição; **loja própria white label** do fornecedor (endereço próprio ou subdomínio, logo, cores e tema dele); página pública do fornecedor (`/f/<nome>`); rede de lojas de membros abastecida pelo catálogo dele; Mercado Pago e plataforma de envio conectados por ele.
**NÃO existe hoje (anunciar só como "sob consulta", sem prometer):** o **sistema inteiro** (portal, painéis e e-mails) com a marca e o domínio do fornecedor. As marcas são fixas no código; uma marca nova exige desenvolvimento e decisão comercial (preço e contrato), que o dono deixou para outra etapa. A página capta o interessado (lista de espera da marca) e a NextLevel conversa.
Sem preço, sem prazo e sem número de clientes na página.

## 4. O kit (peças compartilhadas, lendo a paleta da marca)
Cabeçalho flutuante em pílula · primeira dobra em campo de cor com palavra que alterna e dispositivos · faixa em loop · mosaico (bento) · seções em campos de cor com topo arredondado · perguntas frequentes · chamada final · rodapé. Cores por `--brand-*` (`src/lib/brand-palette.ts`), movimento em CSS nativo com alternativa para `prefers-reduced-motion`, sem biblioteca nova. A home da Commerce **não é alterada** nesta etapa.

## 5. Regras (herdadas da skill `pagina-de-vendas`)
Sem métrica, logo, depoimento ou cliente inventado; "disponível", "demonstração" e "em breve" bem marcados; desempenho e acessibilidade AA; conferência por capturas em 360, 768 e 1440 px e pelo menos 3 rodadas antes de apresentar.
