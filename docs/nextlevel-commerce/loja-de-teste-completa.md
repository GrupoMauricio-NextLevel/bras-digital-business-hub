# Loja de teste completa (Casa Aurora)

Conta fictícia da NextLevel Commerce com o máximo de dados e movimento, para testar todos os módulos do painel da loja.

- **Login:** `completo@commerce.demo` · senha `demo1234` (a senha de demonstração). Pelo endereço da Commerce (`lojas.nextlevelgroup.com.br`) ou, no ambiente local, pelo servidor de demonstração (`bash scripts/restart-demo.sh`).
- **Só existe no modo de demonstração** (`DEMO_AUTOSEED=true` com banco em memória). Produção (Neon) não recebe esses dados, e o e-mail termina em `.demo`, que o login bloqueia fora da demonstração.
- Equipe da loja (também fictícia): `paulo@casaaurora.demo` (atendimento) e `sofia@casaaurora.demo` (expedição), mesma senha.
- O gerador é determinístico: a mesma loja sai igual a cada reinício. Código: `src/db/commerce-demo-rich.ts`; teste: `tests/commerce-demo-rich.test.ts`. A loja pequena anterior (`lojista@commerce.demo`, Fio & Linha) continua existindo.

## O que a loja tem
| Módulo | Conteúdo fictício |
|---|---|
| Plano | Loja própria (libera Análise, Temas, Aparência etc.), assinatura em dia, loja publicada |
| Catálogo | 34 produtos em 5 categorias, com fotos, tamanhos e estoque farto, baixo, zerado; 2 rascunhos |
| Pedidos | ~144 pedidos em 90 dias (mais recentes mais frequentes): aguardando pagamento, pago, etiqueta, em separação, enviado, entregue, cancelado; canais loja virtual, WhatsApp, Instagram e manual; varejo e atacado; frete grátis e pago; notas internas; cupons aplicados |
| Clientes | ~50 clientes com cidades diferentes, consentimento de marketing misto, nomes longos, etiquetas e anotações |
| Pós-venda / Etiquetas | Pedidos parados em cada etapa e etiquetas com código e transportadora |
| Cupons | Ativo, limitado, com mínimo, quase esgotado, expirado, futuro e pausado |
| Campanhas | No ar, agendada e encerrada |
| Atacado | Pedido mínimo da loja e preço por quantidade em vários produtos |
| Propostas | Aberta, aceita (virou pedido) e cancelada |
| Avaliações | Aprovadas, rejeitadas e pendentes de moderação |
| Avise-me | Pedidos de aviso nos tamanhos esgotados |
| Análise e Financeiro | Vendas dos últimos 60 dias (comparação com o período anterior), margem, recorrência e horários de pico |
| Equipe e histórico | 2 pessoas da equipe e trilha de mudanças |
| Configurações | Dados públicos, regras de frete, retirada na loja |

## Limites (honestos)
- Pagamento real e frete por transportadora não estão conectados (continuam em demonstração, como em qualquer conta de teste); por isso o Início ainda mostra "forma de pagamento real" como pendência.
- Os pedidos são criados pelo mesmo código de pedidos da loja (estoque e eventos reais), mas as datas são ajustadas para o passado.
- Alguns pedidos geram nomes de cliente muito longos de propósito, para testar quebra de linha.
- Subir a demonstração leva cerca de 25 segundos a mais por causa desta geração.
