# Decisões que valem hoje (resumo)

> **Leia isto no lugar do `DECISIONS.md` inteiro.** O `DECISIONS.md` é o histórico completo (343 decisões, mais de 570 mil caracteres) e só serve para consultar uma decisão pelo número. Aqui fica uma linha por regra **em vigor**, com o número para conferir o detalhe.
> Atualize este arquivo sempre que uma decisão nova mudar ou substituir uma regra (a skill `/encerrar` cobra isso). Última revisão: 18/11/2026, até a D343.

## Direção e foco
- **Fase atual:** só a NextLevel Commerce e o Master. SuperDrop, Brás, Cargas, Hub Creators e China Hub estão em pausa; não quebrar o que existe, mas não travar por causa deles. (D216, D287)
- **Meta e foco:** 10 empresas pagantes em qualquer porta (Sites, Loja virtual ou Business). Até lá, 60% do esforço na Commerce, 25% no SuperDrop e 15% no resto. Título de decisão leva a frente entre colchetes. (D174, D336)
- **Empresa:** NextLevel Marketing Ltda responde por todas as marcas; "NextLevel Soluções" é o nome dos serviços, não uma empresa. (D279)
- **Dois domínios:** `nextlevelcommerce.com.br` (plataforma) e `nextlevelgroup.com.br` (grupo e agência; Master em `master.`). Agências entram por `painel.nextlevelcommerce.com.br`. (D287, D315)
- **Academia fora de cena:** não falar em academia nem em NextLevel Club; o piloto e o portal de academia estão arquivados. (D340, D343)

## Produtos (as quatro portas)
- **Loja virtual:** planos Start, Pro e Scale intactos (preço, funções e telas). Ninguém muda isso sem decisão nova do dono. (D311)
- **Sites:** captação ligada aos anúncios. Sites Start tem preço próprio na tabela; Pro e Scale custam o mesmo que os planos da loja. (D336)
- **Segundo produto com 50% de desconto** (tabela do Master), no lugar do adicional fixo do site. Quem já pagou o adicional mantém o preço. (D336; substitui o preço da D310/D311)
- **NextLevel Business:** sistema avançado, vendido por proposta até o primeiro pagante (níveis de referência Essencial, Profissional e Avançado). O plano Scale traz o Essencial. (D324, D336)
- **Um motor só:** o NextLevel Business é o painel de serviços personalizável (o antigo Painel da Agência, com o modelo "Agência de marketing" como um dos modelos). O "Meu negócio" de todo cliente fica com o funil simples (Contatos e orçamentos, quadro, Hoje e Maurício). Não se constrói projeto, contrato, cobrança ou portal de novo em outro lugar. (D343)
- **Nome do painel:** o painel de todo cliente se chama "Meu negócio". "NextLevel Business" só para o produto avançado. (D324)
- **Soluções Digitais:** serviços da agência NextLevel. Agências parceiras não compram o código; o degrau maior é a Licença dedicada. (D312)
- **Portal do cliente** sem limite e sem cobrança por cliente; o preço é por empresa. (D336)

## Dinheiro e cobrança
- Valores em centavos; preços e regras sempre da tabela do Master (`getPriceBook`, `getPartnerSettings`), nunca fixos no código. (D123)
- Pagamento só vale depois de conferido na API do Mercado Pago; o corpo do webhook nunca é confiável.
- Taxa zero no checkout do Mercado Pago é o argumento principal; comparação com concorrentes sempre com fato. (D220, D261)
- **Parceiros:** regra única de 20%, 24% e 28%, sem bônus de Black. Parceiro sem cliente por 6 meses fica Inativo. (D250, D260)
- **Contratos:** gerador e prova de aceite em `src/lib/contratos`, usados pelo Master e pela agência. Contrato aceito nunca muda; mudança vira aditivo. (D276, D321, D341)
- Cortesia durante o teste aparece como "Cortesia" e não vira cobrança. (D278)

## Como trabalhamos
- **Começo e fim de toda conversa:** `/retomar` e `/encerrar`. O estado de hoje fica em `docs/ESTADO.md`. (D343)
- **Número de decisão e de migração só se pega na hora de juntar** à branch de publicação. (D343)
- Antes de criar tela, tabela ou módulo, procurar se já existe em outro painel e estender (regra anti-duplicação; quadro em `docs/planejamento/UNIFICACAO-2026-11-18.md`, seção 3).
- **Render:** commit só de documentos leva `[skip render]`; até 3 publicações de código por dia; uma montagem por rodada. (CLAUDE.md, `docs/infra/RENDER-USO.md`)
- **Banco que dorme:** consulta automática da tela só com `podeConsultar()`; rotinas de hora em hora. (D338)
- **Testes enxutos:** durante o trabalho, só tipos, lint e os testes dos arquivos mexidos; a bateria completa e o build ficam para o fim da rodada. (D127)
- **Base de conhecimento:** toda decisão nova entra em `docs/conhecimento/BC0-INVENTARIO.md` e roda `node scripts/gerar-novidades.mjs`. (D264)
- **Questionar antes de seguir:** se uma decisão parecer ruim para a empresa, perguntar e trazer a solução antes de implementar. (17/11/2026)
- Um print real da principal implementação a cada etapa entregue.
- Segurança: código a cada entrada em todos os painéis (D286); segredos só criptografados; um cliente nunca lê dados de outro.

## Substituídas (não seguir)
- D304/D308 "Business é a base de todo cliente" → **D324** (Business é o produto avançado).
- D310 adicional "Loja virtual" → **D311**; adicional fixo do site → **D336** (50% no segundo produto).
- D305/D307 academia piloto, NB10 portal da academia → **D340/D343** (arquivados).
- D337 opção B (portal da academia) → **D340** (fica a opção A: painel para qualquer empresa).
