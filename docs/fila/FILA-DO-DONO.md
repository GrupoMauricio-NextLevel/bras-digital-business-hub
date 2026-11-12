# Fila do dono

Pontos que o dono pediu para não esquecer. Cada item entra assim que ele fala, com a data. Ao concluir, marque `[x]` e cite a decisão (Dnnn).

## Para fazer

- [ ] **Domínio novo `nextlevelcommerce.com.br`** (11/11/2026): ligar no Render e no registro.br, depois trocar o endereço principal da E-commerce (passo a passo em `docs/infra/DOMINIO-NOVO-ECOMMERCE.md`, código pronto no D281).
- [ ] **Lembrete das parcelas do contrato** (sugerido em 11/11/2026): e-mail ao cliente 2 dias antes e no dia; aviso ao dono quando vencer sem "Já fiz o Pix". O restante do Anderson vence em 16/11.
- [ ] **Endereço padrão do domínio próprio dos lojistas** (pendência antiga): o código ainda cai no serviço de Treino se a configuração do Render sumir (`src/lib/domain/dominio-proprio.ts`).
- [ ] **E-mail de verdade (Resend)**: o dono adiciona o domínio no Resend e manda o print do DNS; depois `RESEND_API_KEY` (o dono cola no Render), `EMAIL_FROM` e `EMAIL_REPLY_TO`.
- [ ] **Ler o texto dos termos de uso (D279)** antes da publicação: todos os lojistas vão aceitar esse texto.
- [ ] **Isca da janela de saída (D280)**: se o dono tiver um material (por exemplo, um guia "Como montar sua loja em 1 dia"), trocar a oferta da janela por ele.

- [ ] **Página "NextLevel Temas para Nuvemshop"** (12/11/2026): plano em `docs/prompts/temas-para-nuvemshop-pagina.md`. O dono manda:
  - os prints de Capistrano, Luis Fornecedor e Futcollection;
  - as autorizações dos 5 clientes;
  - a confirmação dos resumos "Como o nosso trabalho ajuda";
  - a prévia com semijoias (prompts no arquivo).

## Feito

- [x] Contratos no painel, Pix manual, cortesia, termos de uso e janela de saída (D276 a D280), salvos para a publicação de 11/11/2026.
