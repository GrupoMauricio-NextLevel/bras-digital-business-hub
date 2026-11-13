# Página "Nossos clientes" (NextLevel Commerce): racional e prompt mestre

> **Pedido do dono (12/11/2026):** uma página "Nossos clientes" com os clientes reais (iRest, Capistrano Modas, Luis Fornecedor, Futcollection, CCV Vidros) e, no fim, exemplos dos melhores templates.
> - Diferente da página "Temas para Nuvemshop" (D282): **nada sobre outras plataformas**, 100% NextLevel Commerce.
> - Racional antes de desenvolver.

---

## 1. O ponto mais importante: dizer a verdade sem perder a força

**Fato:** as 5 lojas foram criadas e são atendidas pela equipe NextLevel, mas hoje **não rodam na plataforma NextLevel Commerce**.

**Risco:** uma página "Nossos clientes" dentro do site da E-commerce, ao lado de "Criar minha loja", faz o visitante entender que essas lojas usam a plataforma. Se ele entrar na loja, ver outra tecnologia e se sentir enganado, perde-se a confiança. Seria também **propaganda enganosa** (Código de Defesa do Consumidor, art. 37) e quebra a regra do projeto de não inventar clientes nem prova.

**Como resolver, mantendo a página 100% NextLevel** (não cita plataforma nenhuma, nem para comparar):
- O sujeito da página é **a equipe e a marca NextLevel**, não a tecnologia por trás de cada loja. Título: "Marcas que a NextLevel atende". Subtítulo: "Lojas criadas e acompanhadas pela equipe que construiu a NextLevel Commerce".
- Nenhuma frase diz "loja feita na NextLevel Commerce" ou "roda na nossa plataforma".
- A ponte para a plataforma é honesta e forte: **"o que aprendemos com essas lojas está na NextLevel Commerce"**. Cada decisão de layout que deu certo nos clientes vira um recurso que a plataforma **já tem** (lista na seção 4, conferida no código).
- **Selo por loja, quando for verdade:** quando um cliente migrar para a NextLevel Commerce, o cartão ganha o selo "Na NextLevel Commerce". Hoje nenhum tem. O primeiro a migrar vira o case principal da página.

> **Decisão do dono necessária:** aprovar este enquadramento ("marcas que a NextLevel atende"), ou esperar algum cliente migrar para a plataforma antes de publicar a página.

## 2. Para quem é e o que a página precisa provar

| Quem chega | Dúvida | Resposta da página |
|---|---|---|
| Lojista pensando em abrir a loja na NextLevel Commerce | "Essa empresa é de verdade? Já fez loja para alguém?" | 5 marcas reais, com botão para visitar cada uma |
| Atacadista do Brás ou da Feira da Madrugada | "Eles entendem de atacado?" | Capistrano, Luis Fornecedor e Futcollection: atacado, revenda, mínimo por mix |
| Quem vende produto caro ou serviço | "Serve para o meu negócio?" | iRest (alto valor, Brasil todo) e CCV Vidros (orçamento sob medida) |
| Quem não quer montar sozinho | "Vocês montam para mim?" | A mesma equipe monta a loja (Loja Pronta) |

**Ação principal:** "Criar minha loja", com o teste grátis do catálogo; o texto vem da oferta, nunca fixo.
**Ação secundária:** "Quero a loja montada pela equipe", que leva à Loja Pronta ou ao diagnóstico.

## 3. Estrutura da página (de cima para baixo)

1. **Topo:** "Marcas que a NextLevel atende."
   - Subtítulo do item 1.
   - 3 números verdadeiros: "5 marcas", "4 segmentos" (moda e atacado, eletrônicos e perfumes, poltronas importadas, vidraçaria) e "Brasil todo". Nada de faturamento, visitas ou crescimento.
   - Botões "Criar minha loja" e "Ver as marcas".
2. **Faixa de marcas:** os logotipos dos 5 clientes, autorizados, em tons neutros. **Ativo pendente:** o dono manda os logotipos em PNG ou SVG; sem eles, só o nome em texto.
3. **Uma vitrine por marca:**
   - O formato é diferente da página Nuvemshop: menos "racional de layout", mais **o negócio e o que fizemos juntos**.
   - Cada bloco tem: nome, segmento e cidade; a frase "Como o nosso trabalho ajuda"; 2 ou 3 pontos curtos; a tela no computador e no celular; e o botão em destaque "Visitar a loja".
   - Mesma ordem do dono e mesmas autorizações.
4. **"O que aprendemos com elas, você já tem na NextLevel Commerce":** um quadro que liga cada aprendizado a um recurso **que existe hoje** na plataforma (seção 4). É a ponte honesta entre os clientes e a plataforma.
5. **Segmentos:** cartões curtos por tipo de negócio (atacado e revenda, produto de alto valor, catálogo grande, serviço sob medida), com o tema NextLevel indicado para cada um.
6. **"Nossos melhores templates":** vitrine dos temas mais completos, com "Ver demonstração". Ordem sugerida:
   - Signature;
   - Atelier, Musa, Pódio, Porto e Morada (nível 4);
   - depois Arena, Aura e Galpão.
7. **Chamada final:** "A mesma equipe, a sua loja." Os botões "Criar minha loja" e "Quero a loja montada pela equipe", mais o WhatsApp.

**Fora da página, de propósito:** nome de outra plataforma, comparação, aviso de marca de terceiros, número de venda, depoimento inventado e preço de serviço.

## 4. Aprendizado do cliente → recurso que a NextLevel Commerce já tem

Só entra o que foi conferido no código em 12/11/2026. Antes de publicar, conferir de novo.

| Aprendizado (cliente) | Recurso na NextLevel Commerce | Onde está no código |
|---|---|---|
| Varejo e atacado na mesma vitrine, com mínimo por mix (Capistrano, Futcollection) | Atacado da loja: preço de atacado por produto e regras de mix | `src/lib/domain/atacado.ts` (D257) |
| Grade de tamanhos que evita troca (Futcollection, infantil por idade) | Grades de tamanho, inclusive personalizada | `src/lib/domain/size-grids.ts` |
| Vista rápida no cartão: "Olhar" (Capistrano, Luis) | Vista rápida do produto | `src/components/storefront/quick-view` |
| Atendimento a um toque (todos) | Botão e seções de WhatsApp na loja | `src/components/storefront/sections/*` |
| Parcela à vista no produto caro (iRest) | Parcelamento exibido na compra | `src/components/storefront/buy-box.tsx` |
| Identidade própria de cada marca | Temas com editor visual, cores, fontes e banners | `src/lib/themes/*` |

**Não prometer:** personalização com nome e número na camisa (a Futcollection tem, mas a plataforma ainda não tem esse recurso). Se o dono quiser, isso vira item da fila de desenvolvimento.

## 5. Visual

- Mesma linguagem tecnológica do site da E-commerce (cabeçalho escuro com grade e tipografia `ec`), mas mais **humana**:
  - fotos das telas em molduras de computador e celular;
  - a cor de cada marca no detalhe do bloco (como na D282);
  - a foto dos sócios do Luis Fornecedor, que já está no site dele e foi autorizada.
- Reaproveitar os recortes e as capturas que já estão em `public/portal/temas-nuvemshop/`. Para os recortes que mostram escudos e marcas de terceiros, manter a regra da D282: não destacar.
- **Mesma fonte de dados:** `src/lib/portal/cases-temas.ts`, acrescentando por loja um texto curto de "o negócio" e a cidade. Assim as duas páginas nunca se contradizem.

## 6. Endereço, menu e busca

- Endereço: `/clientes` no site da E-commerce (404 nas outras marcas). Mais tarde, uma versão no site do grupo.
- Menu: entra no menu público da E-commerce como "Clientes" (hoje: Recursos, Comparativo, Planos, Temas, Parceiros), se o dono aprovar.
- Título SEO: "Clientes NextLevel | Marcas que a nossa equipe atende".

## 7. O que depende do dono

1. **Aprovar o enquadramento da seção 1** (ou esperar uma migração).
2. Logotipos dos 5 clientes, se quiser a faixa de marcas.
3. Cidade de cada cliente: iRest (?), Capistrano (São Paulo, Feira da Madrugada), Luis Fornecedor (São Paulo, Brás), Futcollection (São Paulo, Brás), CCV Vidros (?).
4. Um depoimento curto e real de 1 ou 2 clientes (opcional, só com autorização por escrito).
5. "Clientes" no menu: sim ou não.

## 8. Prompt mestre

```
Você vai construir a página pública "Nossos clientes" da NextLevel Commerce.

LEIA ANTES
1. CLAUDE.md e AGENTS.md (regras, branch, custo de montagem, base de conhecimento D264).
2. Este arquivo inteiro (docs/prompts/pagina-nossos-clientes.md), em especial a seção 1 (honestidade).
3. As skills pagina-de-vendas e qa-visual.
4. O que reaproveitar: src/lib/portal/cases-temas.ts (CASES_TEMAS, casesPublicos), src/components/portal/commerce/temas-nuvemshop.tsx
   (blocos de loja, botões, molduras), public/portal/temas-nuvemshop/ (imagens), CabecalhoTech, THEME_CATALOG e a oferta de
   teste (commercePlansView).

REGRAS
- Nenhum nome de outra plataforma na página. Nenhuma frase diz que as lojas rodam na NextLevel Commerce
  (só o selo "Na NextLevel Commerce" quando o campo naPlataforma do case for true).
- Recursos da seção 4 só se existirem no código no dia; conferir cada um.
- Sem número de venda, sem depoimento sem autorização, sem preço de serviço.
- Textos do teste grátis e dos planos vêm do catálogo (commercePlansView), nunca fixos.

CONSTRUA
- Rota /clientes só na marca NEXTLEVEL_COMMERCE. Metadados da seção 6.
- Seções 3.1 a 3.7. Dados por loja em cases-temas.ts (novos campos: negocio, cidade, naPlataforma=false).
- Vitrine final com os temas da seção 3.6 (dados do THEME_CATALOG e capturas das demonstrações).

QUALIDADE
- Capturas em 360, 768 e 1440 px; sem rolagem lateral; axe sem violações graves.
- Teste: nenhuma palavra de outra plataforma nos textos; nenhuma frase "na nossa plataforma"/"feita na NextLevel Commerce"
  sem naPlataforma; botões com o endereço real.
- Decisão em docs/design/DECISIONS.md, base de conhecimento e node scripts/gerar-novidades.mjs. Prints ao dono antes de publicar.
```
