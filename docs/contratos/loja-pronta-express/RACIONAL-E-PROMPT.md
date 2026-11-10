# Contrato "Loja Virtual Pronta Express": racional, desenho e prompt mestre

> Pedido do dono em 10/11/2026: um contrato de **Loja Virtual Pronta Express** que sirva de **base para outros**.
> Primeiro cliente: pessoa física com CPF, a loja "Vestiário das Lendas" (nome inferido do e-mail; confirmar).
> **Os dados pessoais de cada cliente não entram no repositório** (LGPD): o modelo usa campos `{{...}}`, e cada contrato preenchido fica fora do Git (pasta temporária da sessão e o arquivo final enviado ao dono).
> Este documento não é parecer jurídico. Antes de usar o modelo em escala, um advogado revisa (pendência do dono já registrada: "revisão jurídica dos termos").

> **Provisório (dono, 10/11/2026):** a cobrança sai em nome da **NextLevel Marketing Ltda** (CNPJ 51.392.006/0001-92, Pix no Itaú) porque a **NextLevel Soluções** (a agência) ainda não está pronta. Por isso a "contratada", o CNPJ, o banco e a chave Pix **não ficam fixos no modelo nem no código**: vêm de uma configuração do Master (cadastro das empresas do grupo e dados de recebimento). Quando a NextLevel Soluções estiver pronta, troca-se a configuração e os contratos novos já saem no nome dela; os assinados antes continuam como foram (texto congelado).

---

## 1. O que o dono pediu (resumo fiel)

| Ponto | O que foi dito |
|---|---|
| Produto | Loja Virtual Pronta Express |
| Preço | De R$ 3.000 por **R$ 1.500** (promocional), pagamento único |
| Forma | **Pix**: R$ 500 hoje (sinal) e R$ 1.000 no dia 16 (segunda-feira seguinte) |
| Entrega | A entrega final depende do pagamento do restante |
| Desistência | Se o cliente não continuar, por qualquer motivo, **o sinal fica como multa** |
| Escopo | Só o **desenvolvimento da loja dentro da plataforma NextLevel E-commerce** |
| Fora | Mensalidade da plataforma e domínio são à parte |
| Destaque | Dados do pagamento e **chave Pix do Itaú** (CNPJ) |
| Quem assina pela empresa | Mauricio Ramos dos Santos Junior, pela NextLevel Marketing Ltda; contato `agencianextlevelbr@gmail.com` |
| Texto "Como vamos trabalhar juntos?" | Entra no contrato como quadro de responsabilidades (texto do dono, mantido) |

**Dados fixos da empresa** (o modelo já traz):
- NextLevel Marketing Ltda - ME
- CNPJ 51.392.006/0001-92
- Chave Pix: o CNPJ, no Itaú (testada pelo dono em 10/11/2026)

---

## 2. O racional jurídico e comercial (por que cada cláusula existe)

### 2.1 Os riscos que o contrato precisa fechar

| Risco | Como o contrato fecha |
|---|---|
| Cliente acha que "loja pronta" inclui mensalidade, domínio, fotos, anúncios | Cláusula de **escopo** com o que está **incluído** e o que está **fora**, em lista, sem margem |
| "100 produtos" vira 100 modelos × 5 cores × 6 tamanhos | **Definição de produto:** 1 produto = 1 modelo, com as suas variações de cor e tamanho (a grade). Produto além do limite é orçado à parte |
| Material chega aos poucos e o prazo "estoura" por culpa da NextLevel | O prazo **só começa** com o sinal pago **e** o material completo recebido (anexo com a lista do material) |
| Cliente some depois do sinal | **Sinal como multa** (arras penitenciais, art. 420 do Código Civil) e prazo para pagar o restante, com rescisão automática |
| Cliente recebe a loja e não paga | **Entrega final condicionada à quitação:** a loja fica pronta, mas a publicação e a transferência dos acessos de administrador só acontecem depois do pagamento total |
| Pedidos de ajuste infinitos | **Uma rodada de ajustes** dentro do escopo, em até 7 dias depois da entrega; o resto é orçado à parte |
| Problema do Mercado Pago, do domínio ou da transportadora vira "culpa da NextLevel" | Cláusula de **serviços de terceiros**: a NextLevel configura, mas não responde pela operação, pelas taxas nem pelas regras deles |
| Briga sobre de quem é a loja | **Propriedade e acessos:** a loja fica na conta do cliente na plataforma; os produtos, fotos e dados são do cliente |
| Uso dos dados dos clientes da loja | Cláusula de **dados (LGPD)**: a NextLevel acessa só o necessário para montar a loja |

### 2.2 O sinal como multa: o que a lei diz (ponto de atenção ao dono)

- O que o dono pediu ("o sinal fica como multa se o cliente não continuar") é o que o Código Civil chama de **arras penitenciais** (art. 420).
- A mesma regra vale para os dois lados: se for a NextLevel quem desistir, ela **devolve o sinal mais o mesmo valor** (R$ 500 + R$ 500). O contrato precisa dizer isso, para a cláusula ser equilibrada e valer.
- **Cliente pessoa física:** se ele for considerado consumidor (Código de Defesa do Consumidor), uma multa vista como exagerada pode ser reduzida por um juiz. R$ 500 de R$ 1.500 (33%) costuma ser defensável **quando o trabalho já começou**, e o contrato registra que a NextLevel começa a trabalhar ao receber o sinal. Ainda assim, este é o ponto que o advogado deve olhar primeiro.
- **Contratação à distância** (WhatsApp, e-mail): pelo CDC, o consumidor pode desistir em até 7 dias depois de assinar. Para não brigar com a lei, o modelo diz que o trabalho começa a pedido do cliente logo depois do sinal e que, se ele desistir dentro desses 7 dias, recebe de volta o sinal menos o trabalho já feito, comprovado. **Decisão do dono:** manter essa proteção (recomendado) ou assumir o risco.

### 2.3 Prazo "Express"

O nome promete rapidez, então o contrato precisa ter **prazo escrito**. Recomendação:
- **até 7 dias úteis**, contados a partir do sinal pago **e** do material completo recebido;
- o cliente tem até **3 dias úteis** depois do sinal para mandar o material;
- se atrasar, o prazo da NextLevel anda junto.

**Decisão do dono.**

### 2.4 Pagamento atrasado

- Vencimento do restante: **16/11/2026**.
- Até **5 dias corridos** de tolerância, com a entrega suspensa. Passado esse prazo, o contrato se encerra sozinho, o sinal fica como multa e a loja de treino é removida.
- Recomendação: **sem juros** no primeiro contrato (é uma promoção, e evita discussão).

---

## 3. Estrutura do contrato (modelo com campos)

**Título:** Contrato de Prestação de Serviços · Loja Virtual Pronta Express

**Quadro-resumo** (primeira página, antes das cláusulas; é o que o cliente lê primeiro):

| Campo | Valor no modelo |
|---|---|
| Contratada | NextLevel Marketing Ltda - ME · CNPJ 51.392.006/0001-92 |
| Representante | `{{rep_nome}}` · CPF `{{rep_cpf}}` · `{{rep_email}}` |
| Contratante | `{{cli_nome}}` · CPF/CNPJ `{{cli_doc}}` · `{{cli_email}}` · WhatsApp `{{cli_whats}}` |
| Loja | `{{loja_nome}}` |
| Serviço | Loja Virtual Pronta Express na plataforma NextLevel E-commerce |
| Valor | De ~~R$ `{{valor_cheio}}`~~ por **R$ `{{valor_promo}}`** (pagamento único) |
| Pagamento | Pix · sinal R$ `{{sinal}}` em `{{data_sinal}}` · restante R$ `{{restante}}` até `{{data_restante}}` |
| Prazo | até `{{prazo_dias}}` dias úteis depois do sinal e do material completo |
| Produtos incluídos | até `{{qtd_produtos}}` produtos (1 produto = 1 modelo com a sua grade) |
| Fora do valor | Mensalidade da plataforma, domínio, taxas do Mercado Pago e do frete |

**Bloco de pagamento** (em destaque, com borda e fundo próprios):
- Chave Pix (CNPJ): **51.392.006/0001-92**
- Banco: **Itaú**
- Favorecido: **NextLevel Marketing Ltda**
- Duas linhas, uma por pagamento: valor, data e situação ("pago em ___ / a pagar").
- **QR Code Pix de cada parcela** (opcional, recomendado): código Pix estático com a chave, o valor e uma identificação (`LOJAEXPRESS-{{codigo}}-1` e `-2`), gerado pelo padrão do Banco Central e **testado no app do Itaú antes de enviar**. Também o "Pix copia e cola" em texto, para quem paga pelo celular.
- Frase: "Confira o nome do favorecido antes de pagar e envie o comprovante pelo WhatsApp."

**Cláusulas:**
1. **Objeto:** desenvolvimento da loja **exclusivamente** dentro da plataforma NextLevel E-commerce. Não inclui a mensalidade da plataforma nem o domínio, que o cliente contrata à parte.
2. **Como vamos trabalhar juntos:** o quadro do dono, em duas colunas, "A NextLevel cuida de" e "A loja fica responsável por", com o texto dele, mais a frase final ("O nosso trabalho é preparar a tecnologia. O seu é cuidar das vendas e da operação diária da loja").
3. **Detalhe do que está incluído:**
   - criação e configuração da loja (tema grátis do nicho, cores e logotipo enviados pelo cliente);
   - cadastro de até 100 produtos (definição de produto; fotos e textos enviados pelo cliente; descrição melhorada com a IA da plataforma quando o cliente mandar só o básico);
   - integração do Mercado Pago da conta do cliente e do envio (Melhor Envio, Frenet ou Correios, conforme a conta do cliente);
   - configuração dos aplicativos necessários, em lista fechada: chat, WhatsApp, avaliações, cupons, Google, Meta (até onde a plataforma oferece);
   - testes (um pedido de teste ponta a ponta) e a entrega.
4. **O que não está incluído:**
   - mensalidade da plataforma e domínio;
   - fotos e produção de conteúdo;
   - tema premium ou projeto exclusivo;
   - produtos além do limite;
   - anúncios e gestão de redes sociais;
   - atendimento ao cliente da loja;
   - taxas de terceiros;
   - ajustes depois do período de ajustes.
5. **Responsabilidades do contratante:** a lista do dono, mais o prazo para o material e o anexo do material.
6. **Preço e pagamento:** os valores, as datas, o Pix e o quadro de pagamento. A NextLevel envia o recibo de cada pagamento.
7. **Prazo e entrega:** quando o prazo começa; o que é "entrega" (loja configurada, pedido de teste aprovado, reunião de entrega de até 30 minutos e acessos de administrador). A **entrega final só acontece depois do pagamento total**.
8. **Sinal, desistência e atraso:** arras penitenciais com regra para os dois lados; os 7 dias da contratação à distância (se o dono mantiver); a tolerância de 5 dias e a rescisão automática.
9. **Ajustes:** uma rodada de ajustes dentro do escopo, pedida em até 7 dias depois da entrega.
10. **Serviços de terceiros:** a plataforma, o Mercado Pago, o domínio e as transportadoras têm regras, taxas e disponibilidade próprias.
11. **Propriedade e acessos:**
    - a loja e os seus dados são do contratante;
    - a NextLevel usa os acessos só para o serviço;
    - depois da entrega, o contratante troca as senhas que tiver compartilhado.
12. **Dados pessoais (LGPD):** tratamento só para executar o contrato; sigilo; nenhum dado de cliente da loja é usado pela NextLevel para outro fim.
13. **Divulgação (opcional, com caixa de sim e não):** o cliente autoriza ou não a NextLevel a mostrar a loja como exemplo.
14. **Comunicação:** o WhatsApp e os e-mails do quadro-resumo valem como aviso oficial.
15. **Disposições gerais e foro:** São Paulo/SP; assinatura eletrônica válida.
16. **Assinaturas:** as duas partes, com nome, documento, data e espaço para a assinatura eletrônica (gov.br, ZapSign ou equivalente).

**Anexo I · Material que o cliente envia:**
- logotipo;
- cores;
- fotos;
- planilha de produtos (nome, preço, custo, grade, estoque, peso e medidas);
- políticas de troca e frete;
- acesso ao Mercado Pago;
- dados da empresa para o rodapé.

**Anexo II · Lista de entrega:** os itens marcados na reunião de entrega.

---

## 4. Desenho do PDF

**Formato:** A4 em pé (contrato se imprime e se assina). Margens de 18 mm. 6 a 8 páginas.

**Identidade:** a mesma da NextLevel nos documentos comerciais:
- azul `#294cdc` para títulos e destaques;
- azul-escuro `#0b1328` no topo;
- texto `#101a33`;
- fundo branco;
- logotipo da NextLevel E-commerce no topo da primeira página e pequeno no rodapé das outras.

**Hierarquia visual:**
1. **Capa-resumo** (página 1):
   - faixa escura no topo com o logotipo e o título;
   - o **quadro-resumo** em tabela limpa;
   - o **bloco de pagamento** em destaque: borda azul de 2 px, fundo azul bem claro (`#eef3ff`), a chave Pix em letra grande e tabular, os dois QR Codes lado a lado com o valor e a data embaixo de cada um.
2. **"Como vamos trabalhar juntos?"** (página 2):
   - duas colunas com ícones (traço, não emoji colorido, para imprimir bem em preto e branco);
   - a frase final em destaque.
3. **Cláusulas:**
   - numeradas, título curto em negrito, texto em parágrafos curtos;
   - **resumo em linguagem simples** numa caixa cinza no começo das cláusulas de dinheiro, prazo e sinal ("Em resumo: …"). O cliente entende sem advogado.
4. **Anexos** em listas de conferir, com caixas desenhadas.
5. **Assinaturas:** caixas lado a lado, com linha desenhada, nome e documento embaixo.

**Rodapé de todas as páginas:**
- "Contrato Loja Virtual Pronta Express · nº `{{codigo}}` · página X de Y";
- a primeira linha do resumo do valor;
- iniciais da página: um espaço pequeno para rubrica.

**Regras técnicas (as mesmas que acabaram com os quadrados no iPhone):**
- fontes **estáticas** TTF (Inter) embutidas: `pdffonts` só mostra "CID TrueType";
- **proibido:** `box-shadow`, `opacity`, texto com gradiente, campo de formulário, ícone feito com símbolo de texto;
- ícones em SVG;
- QR em SVG (vetor, nítido para imprimir).

**Número do contrato:** `LPX-AAAAMMDD-NN` (ex.: `LPX-20261110-01`), também usado na identificação do Pix.

**Arquivos:**
- o **modelo** (HTML gerado por script, com campos) fica no projeto, em `docs/contratos/loja-pronta-express/`;
- o **contrato preenchido** (PDF) **não** vai para o repositório: é entregue ao dono e guardado por ele, porque tem CPF e e-mail do cliente.

---

## 5. Decisões do dono antes do PDF (com a recomendação)

| # | Decisão | Recomendação |
|---|---|---|
| 1 | Prazo de entrega | **7 dias úteis** depois do sinal e do material completo |
| 2 | Prazo para o cliente mandar o material | **3 dias úteis** depois do sinal |
| 3 | Desistência em 7 dias (contratação à distância) | **Manter**: devolve o sinal menos o trabalho comprovado |
| 4 | Tolerância do restante | **5 dias corridos** depois de 16/11, sem juros; depois, rescisão |
| 5 | Rodada de ajustes | **1 rodada**, pedida em até 7 dias depois da entrega |
| 6 | QR Code Pix no contrato | **Sim**, um por parcela, testado no app do Itaú antes de enviar |
| 7 | Endereço das partes | Incluir, se o cliente informar (contrato mais forte); senão, só documento e e-mail |
| 8 | Nome da loja e WhatsApp do cliente | Confirmar "Vestiário das Lendas" e pedir o WhatsApp |
| 9 | Forma de assinatura | **Assinatura eletrônica gov.br** (grátis e com validade) ou ZapSign |
| 10 | Autorização para mostrar a loja como exemplo | Caixa de sim ou não no contrato |

---

## 6. Prompt mestre (gerar o contrato de qualquer cliente)

```
Você vai gerar o contrato "Loja Virtual Pronta Express" da NextLevel para um cliente.

LEIA ANTES
1. CLAUDE.md (regras: português claro, sem promessa de ganho, dados pessoais fora do repositório).
2. docs/contratos/loja-pronta-express/RACIONAL-E-PROMPT.md inteiro (racional, estrutura, desenho e decisões).

ENTRADA (peça ao dono só o que faltar)
- Cliente: nome, CPF ou CNPJ (validar os dígitos), e-mail, WhatsApp, endereço (opcional), nome da loja.
- Valores: valor cheio, valor promocional, sinal, restante, datas (conferir o dia da semana), prazo em dias úteis,
  quantidade de produtos.
- Representante da NextLevel: nome, CPF, e-mail.
- Decisões da seção 5 (usar as recomendações quando o dono não disser outra coisa, e listar as que usou).

REGRAS
- Os dados da contratada e do recebimento vêm da configuração (hoje, provisoriamente, NextLevel Marketing Ltda - ME,
  CNPJ 51.392.006/0001-92, chave Pix = CNPJ no Itaú; depois, a NextLevel Soluções). Nunca fixos no modelo.
- O contrato preenchido NÃO entra no repositório: gere na pasta temporária da sessão e entregue o PDF ao dono.
- O modelo e o gerador (sem dados de cliente) ficam em docs/contratos/loja-pronta-express/.
- Conta: sinal + restante = valor promocional; datas futuras; dia da semana certo; número do contrato
  LPX-AAAAMMDD-NN.
- QR Code Pix: código estático no padrão do Banco Central (chave, valor, nome "NEXTLEVEL MARKETING", cidade
  "SAO PAULO", identificação LPX-…-1 e -2, conferência CRC16). Validar o "copia e cola" com um leitor e pedir ao
  dono que teste no app do Itaú antes de mandar ao cliente.
- Desenho e regras técnicas da seção 4: A4 em pé, fontes TTF estáticas, sem box-shadow, opacity, gradiente em texto
  nem campo de formulário; pdffonts só com CID TrueType; ícones e QR em SVG.

ENTREGA
1. Gere o HTML pelo script do modelo, imprima o PDF com o Playwright (Chromium em /opt/pw-browsers/chromium) e faça
   prévia de cada página.
2. Revise as prévias: texto cortado, página quase vazia, quadro quebrado entre páginas, valores e datas.
3. Entregue ao dono: o PDF e um resumo de 5 linhas (valores, datas, prazo, o que ele precisa conferir, como
   assinar).
4. Lembre: este modelo não substitui a revisão de um advogado antes do uso em escala.
```
