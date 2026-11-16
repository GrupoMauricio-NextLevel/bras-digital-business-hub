# NextLevel Business: piloto estruturado para academia (e o caminho para farmácia)

> Pedido do dono (16/11/2026, D305): "Precisamos de um piloto bem estruturado para academia e, mais para frente, farmácia." A Megatron fica fora do piloto porque já é cliente da Commerce.
> Base: `docs/prompts/nextlevel-business-gestao-captacao.md` (D303, D304). Regra de ouro: **funciona sozinho, sem ninguém da NextLevel** (D304).
> Legenda: **[fato]** está no código; **[mercado]** a conferir na fonte; **[hipótese]** o piloto confirma ou derruba.

## 1. Por que academia primeiro
- Receita é **mensalidade recorrente**: o valor do sistema aparece no caixa todo mês (menos inadimplência, menos cancelamento).
- Vive de **captação** (Instagram, indicação, aula experimental) e perde aluno em silêncio: quem para de ir cancela semanas depois. Os dois problemas são exatamente "gestão + captação".
- O processo é parecido em academias de bairro, estúdios, box de cross, lutas, pilates e natação: um piloto bom vira produto para todo o setor.
- Concorrentes conhecidos: Tecnofit, Next Fit, EVO (W12), Pacto **[mercado]**. Eles são fortes em gestão; o nosso diferencial é a **captação com origem de cada aluno** (Instagram, anúncio, indicação) e o atendimento num lugar só, que já temos prontos **[fato]**.

## 2. A jornada que o piloto precisa cobrir
```
Viu no Instagram/anúncio ──► Página da academia ──► Pediu aula experimental
        (origem gravada)                               │ lembrete automático
                                                       ▼
                         Veio na experimental? ── não ──► mensagem "remarcar?"
                                    │ sim
                                    ▼
                    Matrícula: plano + termo aceito no celular + 1º pagamento
                                    │
                                    ▼
       Aluno ativo: check-in na recepção ── sumiu 7-10 dias? ──► mensagem automática
                                    │
               Vencimento: lembrete antes, no dia e depois ──► inadimplente
                                    │
                      Renovou / cancelou (motivo gravado)
```
**Tudo o que está numa seta acontece sozinho.** A recepção só faz o check-in (ou o aluno faz pelo QR code) e a matrícula presencial quando quiser.

## 3. Escopo do piloto (o que entra e o que não entra)
| Entra (P1 a P4) | Fica para depois |
|---|---|
| Página da academia com "agendar aula experimental" e links rastreados para Instagram e WhatsApp | Catraca e controle de acesso físico |
| Funil automático: interessado → experimental → matriculado → ativo → em risco → inadimplente → cancelado (a etapa vem dos fatos, ninguém arrasta card) | Agenda de aulas coletivas com vagas e lista de espera |
| Cadastro de alunos (importação por planilha) e planos (mensal, trimestral, anual, com valores da academia) | Ficha de treino e app do aluno |
| Matrícula com termo de adesão aceito no celular | Avaliação física e dados de saúde além do mínimo |
| Cobrança: Pix e link de cartão por mês, com lembretes automáticos; baixa automática quando o Mercado Pago confirma | Cartão recorrente automático (assinatura do Mercado Pago), entra na fase seguinte |
| Check-in por QR code na recepção (o aluno lê com o celular) ou pelo CPF no tablet | Nota fiscal de serviço |
| Mensagens automáticas: lembrete da experimental, "não veio", aluno sumido, vencimento, aniversário, renovação | Robô conversando por WhatsApp oficial (entra quando a API oficial for ligada) |
| Painel do dono da academia: alunos ativos, receita do mês, inadimplência, novos x cancelados, conversão da experimental, de onde vêm os alunos | |

## 4. Como fica no sistema (reaproveitando, sem duplicar)
- **[fato] O sistema já sabe ter clientes isolados**: hoje o "tenant" é a loja ou o fornecedor (`entitlements.ts`), e já existem CRM da loja (D207), atendimento da loja (D206), visitas por loja (D185), equipe da loja e assinatura de plano NextLevel por loja.
- **Proposta:** a academia é um tenant **do mesmo tipo da loja**, com uma **página de captação** no lugar da vitrine. Assim ela herda, sem código novo: login, equipe, isolamento, CRM, atendimento, visitas e origem, cobrança do plano NextLevel e conexão com o Mercado Pago **dela** (o mesmo da Commerce).
- **O que é só de academia** (alunos, planos da academia, matrículas, check-ins, mensalidades) fica num módulo da Business ligado a esse tenant, **fora do motor de lojas** (Constituição, seção 4: produto derivado consome a plataforma; nunca o contrário).
- **Segmento como configuração:** a conta tem um "segmento" (academia; depois farmácia, clínica...). O segmento liga o pacote de telas e automações (capacidades, Constituição seção 28), sem `if academia` espalhado pelo código.
- Tudo com permissão no servidor (identidade + tenant + recurso + permissão + ação); testes automáticos provando que uma academia nunca vê dado de outra.
- **LGPD:** CPF, telefone e frequência são dados pessoais; saúde (atestado, PAR-Q) é **dado sensível** e fica fora do piloto além de "apto/não apto" com data.

## 5. Fases do piloto
| Fase | Entrega | Pronto quando |
|---|---|---|
| **P0, preparar** (1 semana) | Escolher a academia, conversar 1 h com o dono dela (como capta, cobra e controla hoje), receber a planilha de alunos e a tabela de planos | Respostas da seção 7 em mãos |
| **P1, base** | Conta Business com segmento academia; alunos, planos e importação da planilha; painel com ativos e receita | A academia vê os próprios alunos e números; teste de isolamento passa |
| **P2, dinheiro** | Mensalidades, Pix e link de cartão, lembretes, baixa automática, inadimplentes | Uma mensalidade real paga e baixada sem ninguém mexer |
| **P3, frequência e retenção** | Check-in por QR/CPF; "aluno sumido"; motivo de cancelamento | Lista de alunos em risco certa, conferida pelo dono da academia |
| **P4, captação** | Página da academia, aula experimental, links rastreados, funil e origem de cada aluno | Um aluno novo que veio do Instagram aparece com a origem, da experimental à matrícula |
| **P5, avaliação** (30 dias de uso) | Números antes x depois; ajustes; decidir preço e abrir para outras academias | Metas da seção 6 avaliadas |

## 6. Como medir se deu certo (comparar com o mês anterior ao piloto)
- Inadimplência (% de mensalidades vencidas sem pagar).
- Tempo da recepção com cobrança (o dono da academia estima antes e depois).
- Conversão da aula experimental em matrícula.
- Alunos em risco recuperados (voltaram depois da mensagem).
- % de alunos novos com origem conhecida.
- O dono da academia usou sozinho, sem pedir ajuda à NextLevel? (é a regra de ouro).
- Ele pagaria? Quanto? (base para o preço).

## 7. O que preciso saber da academia piloto (P0)
1. Qual academia? Cidade, tamanho (alunos ativos), modalidades.
2. Como cobra hoje: Pix manual, maquininha, cartão recorrente, boleto? Usa algum sistema (qual)?
3. Como controla a entrada: catraca, caderno, nada?
4. De onde vêm os alunos novos hoje (Instagram, indicação, fachada)? Faz aula experimental?
5. Tem a lista de alunos em planilha ou sistema que exporte?
6. Tem conta no Mercado Pago (ou aceita abrir) para receber as mensalidades direto?
7. Quem vai usar no dia a dia (dono, recepção)? Usa mais celular ou computador?
8. O que daria vontade de pagar (o problema que mais dói)?

## 8. Farmácia (próximo segmento, só o desenho)
Mesma base (tenant, página de captação, CRM, atendimento, origem), outro pacote:
- **Recompra de uso contínuo:** lembrete automático quando o remédio de uso contínuo do cliente está para acabar (pelo intervalo da última compra).
- **Fidelidade e cashback** e campanhas por WhatsApp/e-mail com consentimento.
- **Pedido por WhatsApp e entrega no bairro**, ligado à loja da Commerce quando a farmácia vender online.
- **Cuidados que mudam o desenho [a conferir com a regulação]:** medicamento controlado e com retenção de receita não se vende nem se anuncia como produto comum; regras da Anvisa para venda a distância e propaganda de medicamentos; dado de saúde é sensível (LGPD). Antes de construir, um levantamento da regra e uma conversa com um farmacêutico responsável.

## 9. Riscos
- **Foco:** a Commerce está cerca de 90% pronta (dono, D304); o piloto não pode parar os 10% finais nem o atendimento aos lojistas.
- **Suporte disfarçado:** se a academia piloto precisar de nós para tudo, a Business não está pronta (regra de ouro). Medir pedidos de ajuda.
- **Cobrança recorrente no cartão** depende de integrar a assinatura do Mercado Pago (peça nova; o sistema hoje cobra por Pix, link e fatura).
