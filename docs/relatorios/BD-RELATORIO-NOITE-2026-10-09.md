# Brás Digital: o que foi feito na noite de 2026-10-09

Prompt da noite: `docs/prompts/bras-digital-noite.md`.

## Em 5 linhas (para o dono)
1. A Brás está **aberta**: página pública nova (no nível da Commerce) e cadastro grátis com CNPJ. Os **termos de uso e a política de privacidade** foram publicados, e o aceite passou a ser obrigatório no cadastro.
2. O membro e a equipe recebem **e-mail** a cada cadastro e a cada mudança de pedido.
3. Cada descoberta tem uma **página própria** (`/d/...`) para o link do Shorts. O Estúdio ganhou a **agenda** (meta de 4 por semana) e mostra **quantos cadastros e pedidos cada vídeo trouxe**.
4. O Estúdio também ganhou:
   - **Visão geral** do dia;
   - **Comissões** das importadoras: calculadas pelo sistema, você marca quando receber;
   - **membros** com filtros e planilha.
5. Na retirada, o membro tem **comprovante com código**, o Estúdio gera o **romaneio** da importadora, e o **Balcão** por link já está pronto, mas desligado até você decidir.

## Entregue e no ar
| # | O que mudou para quem usa | Decisão | Commit |
|---|---|---|---|
| — | Página pública da Brás refeita: telas do Meu Brás, mosaico da plataforma, acesso em 3 camadas; nenhum valor em reais | D98 | `ab0069e` |
| N1 | `/termos` e `/privacidade`; aceite obrigatório no cadastro; faixa para quem se cadastrou antes aceitar; origem do cadastro | D99 | `36706fa` |
| N2 | E-mails: boas-vindas, pedido recebido, confirmado, pago, retirado, cancelado; aviso de novo membro e novo pedido para a equipe | D100 | `268391a` |
| N3–N5 | Página de cada descoberta `/d/<id>`; agenda de publicação; semana com a meta; "copiar link"; cadastros e pedidos por descoberta | D101 | `268391a` |
| N6 | Visão geral do Estúdio; comissão por importadora congelada no pagamento; "marcar como recebida"; CSV | D102 | `c51f1d0` |
| N7 | Código `BD-XXXX`; comprovante de retirada (imprimir e WhatsApp); romaneio da importadora | D103 | `c51f1d0` |
| N8–N9 | Membros com filtros, pedidos e CSV; início do Meu Brás com descobertas novas e pedidos em andamento | D104 | `77d14b9` |
| extra | Prompt mestre das fotos da Brás para o GPT; lugares das fotos prontos (aparecem quando o arquivo chegar); prévia de link | D105 | `77d14b9`, `7d52262` |
| N10 | Balcão da importadora por link privado (só envio e código; retirada com o código do motorista), **desligado** | D106 | último commit da noite |

## Ficou para depois e por quê
- **Aviso dentro do painel do membro (sino):** o sino é compartilhado com SuperDrop e Commerce. Mexer nele mudaria outras marcas. O início do Meu Brás e os e-mails cobrem o caso.
- **Login próprio da importadora:** troquei pelo link privado (D106), mais seguro para o que existe hoje. Se um dia a importadora precisar de mais que a fila, o papel de login entra com teste próprio.

## O que depende de você (em ordem)
1. **Revisão jurídica** dos termos e da política. Dados da empresa para completar a política: CNPJ, endereço e responsável pelos dados.
2. **Conta Mercado Pago da NextLevel conectada** e uma compra de teste do 1º mês da Commerce (R$ 9,90).
3. **`BRAS_WHATSAPP`** no Render: hoje os botões de WhatsApp da Brás usam o número geral de suporte.
4. **Comissão:** preencha o percentual padrão e o de cada importadora (Estúdio > Importadoras). O sistema nasce com 0%.
5. **Endereço de retirada** de cada importadora (mesma tela): ele aparece no comprovante do membro.
6. **Fotos:** gerar no GPT com `docs/prompts/imagens-bras-digital-gpt.md` e me trazer.
7. **Balcão:** quando quiser testar com uma importadora, ligue `BRAS_PANELS=true` no Render e gere o link dela no Estúdio.
8. Consultar a marca "Brás Digital" no INPI.

## Verificação
- Tipos (`tsc`) e estilo (`eslint --max-warnings=0`) limpos em cada envio.
- A suíte completa passou antes de cada publicação, de 757 testes (N1) a mais de 780 (N8–N10).
- `npm run build` sem erro.
- `e2e/bras-portal.mjs` em 360/768/1440, com acessibilidade (axe):
  - página pública, termos, página da descoberta, agenda, cadastro com aceite, Meu Brás, pedido, comissões, visão geral, romaneio, comprovante, membros, bloqueio e fronteira entre marcas;
  - Balcão com a chave ligada só no teste local;
  - nenhum valor em reais em página pública.
- Capturas examinadas a cada etapa (Estúdio, página da descoberta, comprovante, comissões, membros, início do Meu Brás, Balcão).

## Riscos e dívidas
- E-mails só saem de verdade com `RESEND_API_KEY` e `EMAIL_FROM` configurados. Sem eles, ficam registrados no banco (`email_outbox`).
- A comissão de pedido cancelado depois de "recebida" aparece como diferença na tela; o acerto é manual.
- Migrações da noite: `0044` a `0047`, todas só de adição (colunas novas e uma tabela). Nada foi apagado.

## Próximo passo recomendado
Primeiro, preencher a comissão e o endereço das importadoras e publicar as 4 primeiras descobertas com a agenda. Depois disso, testar o Balcão com uma importadora piloto. Em seguida vem a etapa de produto já combinada: estoque com baixa automática e pagamento pelo sistema.
