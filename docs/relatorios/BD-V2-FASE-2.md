# Brás v2 — Fase 2: NextLevel Cargas v1 (D111)

## Em 5 linhas (para o dono)
- **A importadora chama a transportadora pelo painel:** escolhe os pedidos confirmados, a transportadora e o dia, e o sistema monta a mensagem pronta no WhatsApp.
- **A transportadora tem login próprio** no endereço da Cargas (`cargas.nextlevelgroup.com.br/transportadora`). Ela aceita a coleta informando o frete, ou recusa com o motivo.
- **A comissão da NextLevel fica congelada no aceite,** pelo plano dela (grátis 8%, Pro 6%, Premium 5%, editáveis em Regras da Brás). O plano grátis aceita até 20 cargas por mês.
- **O motorista usa um link no celular, sem senha:** vê onde e quando coletar, os códigos de cada pedido, e toca em "Entreguei".
- **Ninguém vê o que não é dele:** a transportadora não vê o comprador nem preço; a importadora não vê o frete nem a comissão; uma não vê as cargas da outra.

## Entregue
| Função | Para quem | Onde |
|---|---|---|
| Cadastrar transportadora (CNPJ ou CPF conferido) | Importadora e Master | /importadora/transportadoras e Brás → Transportadoras (Cargas) |
| Chamar transportadora (pedidos + dia + WhatsApp) | Importadora | /importadora/transportadoras |
| Acompanhar coletas e cancelar | Importadora | /importadora/transportadoras e aviso no Hoje |
| Responder chamadas, coletar e marcar entrega | Transportadora | /transportadora |
| Extrato por mês (frete e comissão) | Transportadora | /transportadora/extrato |
| Perfil (estados, veículos, tabela) e link do motorista | Transportadora e Master | /transportadora/perfil |
| Tela do motorista | Motorista | /motorista/… (link privado) |
| Transportadoras, interessados da página, acesso, plano, comissão a faturar, todas as coletas | Master | Brás → Transportadoras (Cargas) |

## Como funciona a coleta
1. A importadora junta os pedidos (confirmados ou pagos) e chama a transportadora.
2. A transportadora aceita com o frete. Só então vê os códigos de retirada.
3. No balcão, o motorista mostra o código de cada pedido. Quando o último sai, a carga vira "coletada" sozinha.
4. A transportadora ou o motorista marca "entregue".

## Ficou para depois e por quê
- **Cobrança automática da comissão:** nesta fase o Master vê o valor por transportadora e mês e fatura. O split ou boleto automático entra com os planos pagos.
- **Frete calculado e cotação entre várias transportadoras:** fase F8 (transporte avançado), com API e webhook.
- **Rastreio para o comprador:** quando o comprador puder ver a coleta, depois da revisão jurídica dos termos da Cargas.

## O que depende de você
1. Cadastrar as primeiras transportadoras (ou deixar a XDX cadastrar as dela) e criar o acesso em Brás → Transportadoras (Cargas) → Gerenciar.
2. Conferir os percentuais e o limite do plano grátis em Regras da Brás → Transportadoras.

## Verificação
- Tipos, estilo e build ok.
- Testes novos: 11 (`tests/cargas-cargas.test.ts`), com fluxo completo, comissão congelada, limite do plano grátis, códigos só depois do aceite, isolamento entre importadoras e entre transportadoras, link do motorista (hash, troca e desligamento) e volume e peso.
- E2E `bras-portal` passo 8: a importadora cadastra a transportadora; o Master cria o acesso; a transportadora troca a senha, vê o painel e gera o link do motorista, que abre sem login. Com axe em 390 e 1440 px.

## Riscos e dívidas
- O link do motorista não tem senha (como o do Balcão): quem tiver o link vê as coletas aceitas. Gerar um novo desliga o anterior.

## Próxima fase
F3: planos do membro e travas por plano, tendências e calculadora.
