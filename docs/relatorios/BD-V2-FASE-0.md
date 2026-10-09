# Brás v2 — Fase 0 (D108)

## Em 5 linhas (para o dono)
- **Tudo da Brás v2 é editável no Master**, em Brás → **Planos e regras**: preços (rascunho), regras, classificação, suporte, jurídico e simulador de cubagem.
- **O cadastro classifica o cliente:** são 7 perguntas, que dão o nível (Iniciante, Em crescimento, Profissional ou Grande conta). Você vê o nível de cada cliente em Membros.
- **O Meu Brás muda conforme o nível e o momento de cada cliente:** quem está começando vê "comece com uma caixa"; a grande conta vê "atendimento de perto".
- **Suporte por plano:** grátis tem as perguntas frequentes; Prata tem chat e WhatsApp; Ouro e Platinum têm agenda pessoal na importadora. Você atende em Brás → Atendimento.
- **A NextLevel Cargas está no ar** em `cargas.nextlevelgroup.com.br`, com página própria e cadastro de interesse. Os cadastros caem no CRM do Master, em Interessados.

## Entregue e no ar
| Função | Para quem | Onde |
|---|---|---|
| Regras v2 (sinal 30%, atraso 30 dias, cotação 7/15 dias e 4 itens, cota 30+15 dias, cubagem, comissão por carga 8/6/5%, estoque e Bling, plano grátis) | Master | Brás → Planos e regras → Regras |
| 11 produtos no catálogo, em rascunho: Prata R$ 97, Ouro R$ 197 e Platinum R$ 397; importadora Pro e Premium; Cargas Pro e Premium; cotação fora do catálogo R$ 1.500; gravação patrocinada; destaques | Master | Planos e preços (publica no Financeiro Master) |
| Classificação: pontos, cortes, pisos e nível comprovado pela compra | Master | Classificação do cliente |
| Nível na lista de membros, com filtro, respostas, momento, plano e ajuste com motivo | Master | Membros |
| Liberar plano (Prata, Ouro ou Platinum) a um membro | Master | Acesso e planos |
| Cadastro em 2 passos com as 7 perguntas | Membro | /cadastro |
| Meu perfil (responder ou atualizar) | Membro | Meu Brás → Meu perfil |
| Painel por nível e momento, cartão do plano e "Quero o plano" | Membro | Meu Brás → Início |
| Suporte: perguntas frequentes, chat, WhatsApp e agenda | Membro | Meu Brás → Suporte |
| Atendimento: conversas e agenda (confirmar dia e hora) | Master | Brás → Atendimento |
| Jurídico: 6 modelos simulados e editáveis, com valores das regras | Master | Planos e regras → Jurídico |
| Pauta de conteúdo e kit de gravação da XDX | Master, Mauricio e Danielle | Brás → Pauta; `docs/bras/kit-gravacao-xdx.md` |
| NextLevel Cargas: página pública e cadastro de interesse | Transportadora e importadora | cargas.nextlevelgroup.com.br |

## Ficou para depois e por quê
- **Cobrança automática dos planos:** fica para a fase F3. Hoje o plano é liberado à mão em Acesso e planos, e o "Quero o plano" avisa a equipe.
- **Paywalls de tendências e da calculadora:** fase F3.
- **Painel da transportadora:** fase F2.
- **Painel da importadora:** fase F1.
- **Alto mar e contêiner:** fases F4 a F6, depois da revisão jurídica. No painel do membro aparecem como "em preparação".
- **Plano anual da Brás:** o texto anual do catálogo fala em 25% de desconto, por isso por ora só existe o mensal.

## O que depende de você
1. **Publicar os preços** que quiser abrir: Financeiro Master → Catálogo → publicar.
2. **Advogado:** revisar os 6 textos e marcar "Revisado", com o nome e a OAB.
3. **Dados da empresa nos textos:** Planos e regras → Jurídico, trocando os [DADO SIMULADO].
4. **Autorização de imagem da XDX** para segunda-feira (está no kit).

## Verificação
- Tipos e estilo sem erros.
- Testes:
  - suíte completa: 817 de 818 passaram;
  - o único que falhou foi o teste de bootstrap, por tempo-limite sob carga. Ele aplica as 48 migrações no próprio corpo, com 18,6 s sozinho; ganhou um limite explícito;
  - novos: `tests/bras-v2-f0.test.ts` (24) e `tests/cargas.test.ts` (4).
- Build de produção ok.
- **E2E:**
  - `e2e/bras-portal.mjs` passou inteiro, com cadastro em 2 passos, painel do iniciante, filtro por nível, todas as abas de Planos e regras com axe, a regra do sinal refletida no texto jurídico, Atendimento e Pauta;
  - `e2e/cargas-portal.mjs`: 360/768/1440 sem rolagem lateral, axe sem violações graves, páginas de outras marcas voltando ao início e cadastro.

## Riscos e dívidas
- A agenda e o chat não mandam e-mail ainda: a equipe vê o número de pendências em Atendimento.
- Os volumes úteis de cubagem são referência de mercado; confirme com a importadora.

## Próxima fase
F1: Importadora 360 e painel da importadora com login (Hoje, Pedidos, Produtos e caixas, Estoque manual e planilha).
