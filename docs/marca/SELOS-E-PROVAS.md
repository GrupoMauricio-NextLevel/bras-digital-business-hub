# Selos e provas de confiança (NextLevel E-commerce)

Data: 2026-10-29 · Decisão: D220 · Para: home, /parceiros, /comparativo, checkout das lojas e painéis.

Este arquivo reúne os selos e elementos que podem valorizar as páginas e os painéis. Para cada um, diz se dá para usar já, o que precisa ser verdade antes e de onde vem a imagem. No fim estão os prompts para gerar no ChatGPT os selos que são **nossos**.

## Regra de ouro

1. **Selo próprio** (criado por nós, com a nossa marca): pode usar à vontade, desde que a frase seja verdadeira. Por exemplo, "Taxa zero da plataforma" só vale enquanto a regra existir no sistema.
2. **Selo de outra empresa** (Google, Reclame Aqui, Mercado Pago, PCI):
   - **nunca** gerar no ChatGPT;
   - **nunca** redesenhar;
   - use só o arquivo ou o código oficial que a própria empresa entrega, dentro das regras dela.
   - Logo de terceiro desenhado por IA é imitação de marca e pode gerar notificação.
3. **Número e avaliação só se forem reais e conferíveis.** Exemplos: "zero reclamações", "nota 4,9", "500 lojas". Sempre com a data, e de preferência com um link para a fonte. Nada de depoimento ou cliente inventado.

## 1. Selos próprios (usar já; imagem gerada no ChatGPT)

| Selo | Frase no selo | Onde usar | O que precisa ser verdade |
|---|---|---|---|
| Taxa zero da plataforma | "Taxa 0% da plataforma · checkout Mercado Pago" (nunca "sem taxas": o Mercado Pago cobra as dele) | Topo da home, planos, /parceiros | Regra D220 ativa (assinaturas com taxa 0) |
| Parceiro oficial (versão nossa, sem o logo deles) | "Parceiro oficial Mercado Pago" (só texto) | Topo, rodapé, checkout | Parceria vigente (confirmada pelo dono). Com o kit oficial em mãos, troque pelo selo deles |
| Feita para o atacado | "Grade · pacote · preço por quantidade" | Seção "Feita para o atacado", /recursos | Grade, preço por quantidade e pedido mínimo existem (`/merchant/atacado`) |
| Do Brás para o Brasil | "Equipe no Brás e no Canindé" | Vivência de rua, rodapé, /parceiros | Equipe presente nessas regiões |
| Sem fidelidade | "Sem fidelidade · cancele quando quiser" | Planos, topo | Termos de uso dizem isso |
| 100% na sua conta | "Pix e cartão direto na sua conta" | Planos, comparativo | O dinheiro cai na conta Mercado Pago do lojista |
| Sem limite | "Produtos e pedidos sem limite" | Planos, comparativo | Vale em todos os planos |
| Suporte humano | "Gente de verdade no WhatsApp" | Rodapé, painel do lojista | Atendimento humano em horário comercial |
| Site protegido | "Conexão segura (HTTPS)" | Rodapé da loja, checkout | Todo domínio com certificado (já é automático) |
| Dados protegidos (LGPD) | "Seus dados protegidos · LGPD" | Cadastro, checkout, rodapé | Política de privacidade publicada e canal do encarregado (DPO) ativo |
| Agência parceira | "Agência parceira NextLevel" | Para as agências aprovadas usarem nos sites delas | Só para quem for aprovado no Master (Tipo = Agência) |
| Lojista NextLevel | "Loja feita na NextLevel" | Rodapé das lojas (opcional para o lojista) | — |

## 2. Selos de terceiros (só com o material oficial)

| Selo | Como conseguir | Custo | Cuidado |
|---|---|---|---|
| **Mercado Pago (parceiro)** | Pedir ao contato da parceria o kit de marca (logo, selo de parceiro e regras de uso) | Sem custo (parceria vigente) | Usar exatamente o arquivo deles. Enquanto o kit não chega, o site usa só texto (como hoje) |
| **Reclame Aqui** | Cadastrar a NextLevel como empresa (gratuito) e usar o selo ou widget de reputação que o painel da empresa oferece | Cadastro grátis; o selo "RA Verificada" é pago | "Zero reclamações" só com página ativa, com data e com link para a página. A reputação "RA1000" depende de critérios deles |
| **Google: avaliações do Perfil da Empresa** | Perfil da NextLevel no Google (Maps) com avaliações reais | Grátis | Mostrar a nota em texto ("4,9 no Google, 37 avaliações") com link. Não usar o logo do Google fora das regras de marca dele |
| **Google: Avaliações de Clientes (selo)** | Google Merchant Center, programa Avaliações de Clientes | Grátis, mas exige a pesquisa pós-compra | Faz sentido para as **lojas** dos lojistas, não para a plataforma. Bom recurso futuro |
| **Google Partner** | Programa Google Partners | Grátis, mas exige gasto e certificações em Google Ads | Só se a agência NextLevel se qualificar |
| **PCI DSS** | Não pedir. O Mercado Pago é que processa os cartões | — | Pode escrever "pagamentos processados pelo Mercado Pago, com certificação PCI DSS". Não usar o logo do PCI |
| **Certificado SSL** | Já automático em todos os domínios | Grátis | Não existe "selo oficial" grátis que valha a pena; use o selo próprio "Conexão segura" |
| **ABComm (associação do e-commerce)** | Associação paga | Pago | Opcional; só com associação ativa |

## 3. Outras provas que já podemos mostrar (sem imagem)

- **CNPJ e endereço** no rodapé: confiança imediata para o público do atacado.
- **Fotos reais da equipe** (o acervo já tem 17).
- **Lojas reais no ar** (seção "Lojas de exemplo"). Só com a autorização do lojista.
- **Data e fonte do comparativo**, como já está.
- **Contador real** de lojas ativas ou pedidos, lido do banco, quando os números forem bons. Nunca um valor fixo inventado.

## 4. Como entregar as imagens

- **Formato:** PNG com fundo transparente, 1024 × 1024 px (ou SVG, se o ChatGPT exportar).
- **Nome do arquivo:** `selo-<nome>.png`. Por exemplo: `selo-taxa-zero.png`, `selo-atacado.png`, `selo-bras.png`, `selo-sem-fidelidade.png`, `selo-na-sua-conta.png`, `selo-sem-limite.png`, `selo-suporte.png`, `selo-https.png`, `selo-lgpd.png`, `selo-agencia-parceira.png`, `selo-loja-nextlevel.png`.
- **Onde colocar:** `public/portal/commerce/selos/`. Eu converto para WebP e AVIF e ligo nas páginas.
- **Dica importante:** o gerador de imagem às vezes erra letras. Por isso há dois caminhos:
  - **Recomendado:** gere o **símbolo sem texto**; eu escrevo a frase no site, em texto de verdade (nítido, acessível e fácil de mudar).
  - **Alternativo:** gere com o texto e confira letra por letra antes de mandar.

## 5. Prompts para o ChatGPT (gerador de imagem)

### 5.1 Estilo comum (cole antes de cada prompt)

```
Estilo: selo/insígnia vetorial plano e moderno, para site de tecnologia brasileiro. Formato circular ou escudo arredondado,
borda fina, ícone central simples e geométrico, traço uniforme de 2 px, cantos arredondados. Paleta: azul-marinho #101A33,
azul ciano #00B1EA, verde #00A650 (só no selo de taxa zero), branco. Sem gradiente exagerado, sem sombra pesada, sem
efeito 3D, sem brilho metálico. Fundo totalmente transparente. 1024x1024 px, centralizado, com margem de 10%.
Não use logotipo de nenhuma empresa real (nada de Google, Mercado Pago, Reclame Aqui, Visa, Mastercard, PCI).
```

### 5.2 Selos (símbolo sem texto, recomendado)

1. **Taxa zero** (`selo-taxa-zero.png`)
   ```
   [estilo comum] Ícone: o número "0%" grande e grosso dentro de um círculo verde #00A650, com uma pequena seta de
   recibo/etiqueta riscada ao lado, transmitindo "nenhuma taxa sobre a venda". Contorno externo azul-marinho.
   ```
2. **Feita para o atacado** (`selo-atacado.png`)
   ```
   [estilo comum] Ícone: três caixas de papelão empilhadas em pirâmide, a da frente com uma etiqueta "12", e um cabide
   de roupa por cima, simbolizando grade fechada de peças. Azul-marinho com detalhes ciano.
   ```
3. **Do Brás para o Brasil** (`selo-bras.png`)
   ```
   [estilo comum] Ícone: um pino de mapa com uma pequena fachada de loja de rua dentro (toldo listrado), sobre uma linha
   de ruas estilizada. Azul-marinho e ciano. Transmite comércio de rua de São Paulo e proximidade.
   ```
4. **Sem fidelidade** (`selo-sem-fidelidade.png`)
   ```
   [estilo comum] Ícone: um cadeado aberto com uma pequena marca de "check" ao lado, simbolizando liberdade para cancelar.
   ```
5. **100% na sua conta** (`selo-na-sua-conta.png`)
   ```
   [estilo comum] Ícone: uma carteira com uma seta entrando e o símbolo de moeda "R$", indicando dinheiro caindo direto na conta.
   ```
6. **Sem limite** (`selo-sem-limite.png`)
   ```
   [estilo comum] Ícone: o símbolo do infinito formado por uma fita de etiqueta de produto, em ciano sobre marinho.
   ```
7. **Suporte humano** (`selo-suporte.png`)
   ```
   [estilo comum] Ícone: balão de conversa com um rosto sorridente simples dentro, e um pequeno fone de atendimento.
   ```
8. **Conexão segura** (`selo-https.png`)
   ```
   [estilo comum] Ícone: escudo com cadeado fechado no centro e uma linha de "check". Transmite site protegido.
   ```
9. **Dados protegidos (LGPD)** (`selo-lgpd.png`)
   ```
   [estilo comum] Ícone: escudo com um cartão de identidade estilizado dentro e uma pequena chave. Nada de bandeira ou brasão oficial.
   ```
10. **Agência parceira** (`selo-agencia-parceira.png`)
    ```
    [estilo comum] Ícone: duas mãos em aperto formando um losango, com uma estrela pequena acima. Versão premium: borda
    dupla ciano. Deve parecer um certificado de parceria, sem logotipo.
    ```
11. **Loja feita na NextLevel** (`selo-loja-nextlevel.png`)
    ```
    [estilo comum] Ícone: sacola de compras com um raio estilizado (ideia de "próximo nível"), em marinho e ciano.
    ```

### 5.3 Versão com texto (alternativa; confira a ortografia)

Acrescente ao prompt do selo: `Texto em português, em letras maiúsculas, em arco na borda superior: "<FRASE>". Fonte
geométrica sem serifa, peso bold, perfeitamente legível, sem erros de ortografia.` Use as frases da tabela da seção 1.

### 5.4 Faixa do topo (opcional, para redes sociais e anúncios)

```
[estilo comum, sem o formato de selo] Banner horizontal 1600x600, fundo azul-marinho #101A33 com brilho ciano suave na
base. À esquerda, "0%" gigante em verde #00A650 e, abaixo, espaço vazio para texto (não escreva frases). À direita,
ilustração plana de um notebook com uma loja de roupas aberta e caixas de atacado ao lado. Sem logotipos reais.
```

## 6. Próximos passos

1. **Dono:**
   - gerar os 11 selos;
   - pedir o kit de marca ao Mercado Pago;
   - cadastrar a NextLevel no Reclame Aqui e no Perfil da Empresa no Google.
2. **Sistema:** com os arquivos em `public/portal/commerce/selos/`, eu:
   - crio uma faixa de selos na home (logo abaixo dos planos) e no rodapé;
   - coloco "Conexão segura · LGPD · Mercado Pago" no checkout das lojas;
   - coloco o selo "Agência parceira" no painel do parceiro, para download.
