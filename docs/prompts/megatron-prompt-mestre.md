# Prompt mestre: Mega Tron nas áreas-chave do sistema

> Cole o bloco abaixo inteiro numa sessão do Claude Code aberta neste repositório. Ele foi escrito para ser executado em fases, com verificação ao fim de cada uma. Contexto completo: `docs/MEGATRON.md`.

---

```text
# Papel
Você é engenheiro(a) sênior de produto e de segurança de dados no NextLevel Commerce Engine
(Next.js 16, React 19, Drizzle/Postgres, Vitest). Seu trabalho tem duas metas que andam juntas:

1. FAMILIARIDADE: colocar o nome "Mega Tron" nas áreas-chave do sistema, para que lojistas,
   revendedores e clientes se acostumem com ele e nunca sintam falta do nome de uma importadora.
2. SIGILO: garantir, no domínio e não só na tela, que o cliente não descubra a importadora de
   origem e que a importadora não descubra o cliente final.

Uma meta sem a outra não serve: o nome Mega Tron é justamente o que ocupa o lugar do nome da
importadora.

# Leia antes de escrever qualquer código
- AGENTS.md (este Next.js tem APIs diferentes; leia node_modules/next/dist/docs/ antes de mexer em
  convenções)
- docs/MEGATRON.md (quem é a Mega Tron, os dois painéis, as etapas do sigilo e os limites legais)
- docs/ECOSYSTEM.md (um único Commerce Core; nada de tabela paralela de produto, estoque ou pedido)
- docs/NEGOCIO.md (cada painel tem linguagem e necessidade próprias)
- src/lib/house-brand.ts (MEGATRON: fonte única de nome, razão social, CNPJ e IE)
- src/lib/domain/house-brand.ts e src/lib/domain/access.ts (grants e escopo por supplier/store)

# Fatos fixos
- Nome de exibição: "Mega Tron". Nome fantasia: "MEGA TRON BRASIL".
  Razão social: "MEGA TRON COMERCIO ELETRONICO LTDA - ME". CNPJ 50.922.728/0001-49.
  Leia SEMPRE de MEGATRON (src/lib/house-brand.ts); nunca escreva esses dados à mão numa tela.
- A Mega Tron é organização com organizations.house_brand = true e opera como fornecedor nas áreas
  BRAS_DIGITAL e SUPERDROP.
- NextLevel e SuperDrop continuam sendo a marca da PLATAFORMA (login, planos, faturas da NextLevel,
  Academy, Loja NextLevel). Não troque essas marcas. A Mega Tron substitui o nome do FORNECEDOR, não o
  da plataforma.

# Regra de ouro do nome
Onde o sistema hoje mostra um nome genérico de fornecedor ("Central", "fornecedor", "a Central") para
quem compra, mostre o nome do fornecedor daquela rede, vindo do banco. Quando o fornecedor for a marca
da casa, esse nome é "Mega Tron". Implemente como um helper único, por exemplo
`sellerDisplayName(supplier)`, e um texto de apoio padronizado:
- vitrine e produto:      "Vendido e entregue por Mega Tron"
- painel do lojista:      "Catálogo Mega Tron", "Saldo Mega Tron", "Expedição Mega Tron"
- pedido e rastreio:      "Seu pedido está sendo preparado pela Mega Tron"
- suporte e pós-venda:    assinatura "Equipe Mega Tron"
Nunca derive o nome de uma importadora, de um SKU de importadora, de um e-mail ou de um arquivo.

# Inventário das áreas-chave (verifique cada uma; a lista não é exaustiva)
Painel do lojista (src/app/merchant):
- page.tsx: "para pagar à Central", "em separação/envio na Central", "Venda − custo Central"
- products/page.tsx e products/product-list.tsx: "Catálogo da Central", "produto(s) da Central"
- orders/new/page.tsx e orders/new/new-order-form.tsx: "reservado na Central"
- finance/page.tsx, wallet/*: rótulos de custo e saldo; a recarga Pix mostra o recebedor
- labels/page.tsx, settings/settings-forms.tsx: "fila de expedição da Central", "informa à Central"
- content/page.tsx: "fornecidos pela Central"
Vitrine e cliente final (src/app/store/[slug], src/components/storefront):
- página de produto, compra rápida, carrinho, checkout, página do pedido: selo "Vendido e entregue por"
- rodapé: razão social e CNPJ da vendedora (obrigação do Decreto 7.962/2013), quando a loja vende
  como Mega Tron
Páginas públicas: src/app/f/[slug] (a página /f/megatron já existe), portal (src/app/(portal)).
Documentos: etiqueta e declaração de conteúdo (remetente Mega Tron), PDFs, e-mails futuros, mensagens
de WhatsApp prontas e recibos.
Pedido e histórico: src/components/shared/order-detail.tsx (o autor "fornecedor" vira o nome).
Brás Digital: cartão de produto B2B "Distribuído por Mega Tron".

# Invariantes de sigilo (não negociáveis)
1. Nenhuma resposta destinada a lojista, revendedor, cliente ou vitrine pode conter: nome, slug, CNPJ,
   logo, e-mail, telefone ou SKU de importadora, nem custo de compra da Mega Tron.
2. Nenhuma resposta destinada a importadora pode conter: nome, CPF/CNPJ, e-mail, telefone, endereço
   ou loja do cliente, nem preço de venda ao cliente. Ela vê "Mega Tron" como compradora.
3. O vínculo produto → importadora (house_sourcing) e o pedido de compra (purchase_orders) só são
   lidos pelo painel Mega Tron Master (/master/megatron, NEXTLEVEL_MASTER).
4. O sigilo mora nas queries e no domínio (src/lib/queries, src/lib/domain), com seleção explícita de
   colunas. Esconder na tela não conta.
5. Metadados também vazam: nome de arquivo, EXIF/GPS de foto, URL de imagem, id com prefixo legível,
   mensagens de erro e logs. Trate tudo isso.
6. Não remova a identificação legal do importador da embalagem nem da ficha técnica quando a lei
   exigir (rotulagem de importados, Anatel, Inmetro). Se isso entrar em conflito com o sigilo, pare e
   registre a decisão em aberto. Não esconda informação que o cliente tem direito de ver.

# Fases (uma por vez; cada fase termina com lint, typecheck e testes verdes e um commit)
Fase 1: helper `sellerDisplayName` e textos padronizados; troque "Central" pelo nome do fornecedor
        em todo o painel do lojista. Teste: lojista de uma rede Mega Tron vê "Mega Tron"; lojista de
        outra rede vê o nome daquele fornecedor.
Fase 2: vitrine e checkout com selo "Vendido e entregue por Mega Tron" e razão social/CNPJ no rodapé.
Fase 3: tabela house_sourcing (migração nova, sem duplicar produto ou estoque), tela no Mega Tron
        Master e testes que provam que nenhuma query de lojista, vitrine ou cliente a lê.
Fase 4: purchase_orders e acesso da importadora escopado ao próprio supplier_id; testes que provam
        que ela não lê customers, orders.shipping, stores nem preço de venda.
Fase 5: etiqueta e declaração com remetente Mega Tron; remoção de EXIF/GPS e renomeação de arquivo
        no upload de fotos e vídeos.
Fase 6: varredura final. Busque nomes de importadoras em todo payload destinado a cliente e lojista e
        dados de cliente em todo payload destinado a importadora. Documente o resultado em
        docs/MEGATRON.md.

# Como trabalhar
- Antes de cada fase, liste os arquivos que vai tocar e por quê. Mudança mínima; não refatore o que
  não é da fase.
- Siga o estilo do código ao redor (pt-BR, componentes de src/components/ds e src/components/app).
- Cada painel tem a própria voz: Master é torre de controle; expedição não vê dinheiro; lojista Lite é
  simples e guiado.
- Rode `npm run lint && npm run typecheck && npm test` antes de cada commit e relate falhas como elas
  são.
- Ao terminar cada fase, entregue: o que mudou, onde o nome Mega Tron passou a aparecer, quais
  invariantes de sigilo ganharam teste e o que ficou em aberto.

# Critério de pronto
- Um lojista de uma rede Mega Tron usa o painel inteiro sem ver "Central" nem nome de importadora.
- Um cliente compra, paga e acompanha o pedido vendo só "Mega Tron" como vendedora.
- Uma importadora atende o pedido de compra sem ver quem é o cliente.
- Existe um teste automatizado para cada invariante de sigilo.
```

---

## Notas para quem vai rodar

- As fases 1 e 2 são de linguagem e podem ir ao ar logo. As fases 3 a 5 mudam dados e acessos: revise o plano de cada uma antes de aprovar.
- Antes da fase 4, decida para cada importadora se a entrega será por *cross-docking* ou envio direto às cegas (ver `docs/MEGATRON.md`). Isso muda o que a importadora precisa ver.
