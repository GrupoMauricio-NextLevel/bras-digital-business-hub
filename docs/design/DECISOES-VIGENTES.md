# Decisões que valem hoje (resumo)

> **Leia isto no lugar do `DECISIONS.md` inteiro.** O `DECISIONS.md` é o histórico completo (343 decisões, mais de 570 mil caracteres) e só serve para consultar uma decisão pelo número. Aqui fica uma linha por regra **em vigor**, com o número para conferir o detalhe.
> Atualize este arquivo sempre que uma decisão nova mudar ou substituir uma regra (a skill `/encerrar` cobra isso). Última revisão: 18/11/2026, até a D345.

## Direção e foco
- **Fase atual:** só a NextLevel Commerce e o Master. SuperDrop, Brás, Cargas, Hub Creators e China Hub estão em pausa; não quebrar o que existe, mas não travar por causa deles. (D216, D287)
- **Meta e foco:** 10 empresas pagantes em qualquer porta (Sites, Loja virtual ou Business). Até lá, 60% do esforço na Commerce, 25% no SuperDrop e 15% no resto. Título de decisão leva a frente entre colchetes. (D174, D336)
- **Empresa:** NextLevel Marketing Ltda responde por todas as marcas; "NextLevel Soluções" é o nome dos serviços, não uma empresa. (D279)
- **Dois domínios:** `nextlevelcommerce.com.br` (plataforma) e `nextlevelgroup.com.br` (grupo e agência; Master em `master.`). Agências entram por `painel.nextlevelcommerce.com.br`. (D287, D315)
- **Academia fora de cena:** não falar em academia nem em NextLevel Club; o piloto e o portal de academia estão arquivados. (D340, D344)

## Produtos (as quatro portas)
- **Planos (D345):** uma escada só, tudo em um: Começo R$ 97, Crescer R$ 297, Performance R$ 897 e Sob medida a partir de R$ 2.500 por mês; anual = 10 mensalidades; pessoa extra R$ 29; **zero taxa sobre as vendas**. Sem níveis dentro de cada persona. Detalhes: `docs/precificacao/PRECIFICACAO-TUDO-EM-UM.md`.
- **Implantação em toda contratação (D345):** Ativação R$ 497 (grátis no anual do Começo), Crescer R$ 2.997, Performance R$ 7.997 e Diagnóstico sob medida R$ 2.500. Obrigatória do Crescer em diante. Liga-se ao contrato de projeto (D342).
- **NextLevel Business e Sites** deixam de ter preço próprio: fazem parte dos planos (o Business completo a partir do Crescer). (D345)
- **Um motor só:** o NextLevel Business é o painel de serviços personalizável (o antigo Painel da Agência, com o modelo "Agência de marketing" como um dos modelos). O "Meu negócio" de todo cliente fica com o funil simples (Contatos e orçamentos, quadro, Hoje e Maurício). Não se constrói projeto, contrato, cobrança ou portal de novo em outro lugar. (D344)
- **Nome do painel:** o painel de todo cliente se chama "Meu negócio". "NextLevel Business" só para o produto avançado. (D324)
- **Soluções Digitais:** serviços da agência NextLevel. Agências parceiras não compram o código; o degrau maior é a Licença dedicada. (D312)
- **Portal do cliente** sem limite e sem cobrança por cliente; o preço é por empresa. (D336)

- **Domínio das lojas:** domínio próprio por registros A/CNAME (D234); toda loja tem também o endereço de teste `slug.nextlevelcommerce.com.br`, ligado por `LOJA_TESTE_DOMINIO` (D346). Com `RENDER_API_KEY` o domínio entra sozinho na hospedagem; sem ela, o Master avisa para cadastrar. (D234, D346)

## Dinheiro e cobrança
- Valores em centavos; preços e regras sempre da tabela do Master (`getPriceBook`, `getPartnerSettings`), nunca fixos no código. (D123)
- Pagamento só vale depois de conferido na API do Mercado Pago; o corpo do webhook nunca é confiável.
- Taxa zero no checkout do Mercado Pago é o argumento principal; comparação com concorrentes sempre com fato. (D220, D261)
- **Parceiros:** regra única de 20%, 24% e 28%, sem bônus de Black. Parceiro sem cliente por 6 meses fica Inativo. (D250, D260)
- **Contratos:** gerador e prova de aceite em `src/lib/contratos`, usados pelo Master e pela agência. Contrato aceito nunca muda; mudança vira aditivo. (D276, D321, D342)
- Cortesia durante o teste aparece como "Cortesia" e não vira cobrança. (D278)

## Como trabalhamos
- **Começo e fim de toda conversa:** `/retomar` e `/encerrar`. O estado de hoje fica em `docs/ESTADO.md`. (D344)
- **Número de decisão e de migração só se pega na hora de juntar** à branch de publicação. (D344)
- Antes de criar tela, tabela ou módulo, procurar se já existe em outro painel e estender (regra anti-duplicação; quadro em `docs/planejamento/UNIFICACAO-2026-11-18.md`, seção 3).
- **Render:** commit só de documentos leva `[skip render]`; até 3 publicações de código por dia; uma montagem por rodada. (CLAUDE.md, `docs/infra/RENDER-USO.md`)
- **Banco que dorme:** consulta automática da tela só com `podeConsultar()`; rotinas de hora em hora. (D338)
- **Testes enxutos:** durante o trabalho, só tipos, lint e os testes dos arquivos mexidos; a bateria completa e o build ficam para o fim da rodada. (D127)
- **Base de conhecimento:** toda decisão nova entra em `docs/conhecimento/BC0-INVENTARIO.md` e roda `node scripts/gerar-novidades.mjs`. (D264)
- **Questionar antes de seguir:** se uma decisão parecer ruim para a empresa, perguntar e trazer a solução antes de implementar. (17/11/2026)
- Um print real da principal implementação a cada etapa entregue.
- Segurança: código a cada entrada em todos os painéis (D286); segredos só criptografados; um cliente nunca lê dados de outro.

## Substituídas (não seguir)
- D311 (Start, Pro e Scale intactos), Sites Start, níveis do Business e 50% no segundo produto (D336), taxa sobre as vendas e virada de preço da Black (D229) → **D345**.
- D304/D308 "Business é a base de todo cliente" → **D324** (Business é o produto avançado).
- D310 adicional "Loja virtual" → **D311**; adicional fixo do site → **D336** (50% no segundo produto).
- D305/D307 academia piloto, NB10 portal da academia → **D340/D344** (arquivados).
- D337 opção B (portal da academia) → **D340** (fica a opção A: painel para qualquer empresa).
