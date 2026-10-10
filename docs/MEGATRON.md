# Mega Tron: marca da casa no ecossistema NextLevel

## Quem é

| Campo | Valor |
|---|---|
| Razão social | MEGA TRON COMERCIO ELETRONICO LTDA - ME |
| Nome fantasia | MEGA TRON BRASIL (exibido como **Mega Tron**) |
| CNPJ | 50.922.728/0001-49 |
| Inscrição estadual (SP) | 121.681.071.11 (como informado; confira, a IE de SP costuma ter 12 dígitos) |
| Abertura | 02/06/2023 |
| Situação cadastral | Ativa |
| Atividade principal | Comércio varejista especializado de eletrodomésticos e equipamentos de áudio e vídeo |
| Localização | São Paulo - SP |

Fonte única no código: `src/lib/house-brand.ts` (`MEGATRON`). Nenhuma tela deve repetir esses dados à mão.

## O papel dela

O Brás Digital trabalha com importadoras. Em muitas vendas, quem vende é a **Mega Tron**: ela compra da importadora e vende ao cliente (lojista, revendedor ou consumidor) com o próprio CNPJ e a própria nota. Para o cliente, a vendedora é a Mega Tron. Para a importadora, quem compra é a Mega Tron.

Para isso funcionar, existe uma regra de negócio que nunca pode ser quebrada:

> **Sigilo nos dois sentidos.** O cliente não descobre de qual importadora veio o produto, e a importadora não descobre quem é o cliente final. Só o grupo (painel Mega Tron Master) enxerga as duas pontas.

## Dois painéis, uma empresa

```text
                ┌──────────────────────────────────────────┐
                │ Mega Tron Master  (/master/megatron)     │  só o grupo
                │ ficha · equipe · origem de cada produto  │  (NEXTLEVEL_MASTER)
                │ margens · pedidos de compra · sigilo     │
                └──────────────┬───────────────────────────┘
                               │ mesma organização (organizations.house_brand = true)
                ┌──────────────┴───────────────────────────┐
                │ Mega Tron no Brás Digital  (/supplier)   │  equipe Mega Tron
                │ catálogo · estoque · pedidos · expedição │  grants BRAS_DIGITAL + SUPERDROP
                │ NÃO vê as importadoras de origem         │  (SUPPLIER_ADMIN, escopo supplierId)
                └──────────────────────────────────────────┘
```

- **Por que não é uma "vertical" nova.** As áreas de `src/lib/ecosystem.ts` (SuperDrop, Brás Digital etc.) são produtos que a NextLevel oferece. A Mega Tron é uma **empresa** (organização) que atua dentro dessas áreas. Ela é modelada como organização com `house_brand = true`, um fornecedor e grants nas áreas em que opera. Não existe banco, catálogo ou pedido paralelo para ela.
- **Como os painéis se conectam.** Os dois leem a mesma `organization_id` e o mesmo `supplier_id`. O Master acrescenta a camada sigilosa (origem e custo de compra), que nunca chega ao painel operacional nem a nenhuma importadora.
- **Quem entra em cada um.** O Mega Tron Master exige `NEXTLEVEL_MASTER`. A equipe da Mega Tron recebe um acesso criado no próprio Master (senha temporária, troca obrigatória no primeiro acesso) com `SUPPLIER_ADMIN` em `BRAS_DIGITAL` e `SUPERDROP`.

## O que já está pronto

- Colunas da ficha cadastral em `organizations` (migração `0013_house_brand`), com CNPJ único.
- `ensureHouseBrand` (`src/lib/domain/house-brand.ts`): cria ou completa a Mega Tron. Roda a cada deploy (`npm run db:bootstrap`) e não cria usuário nem senha. Em produção nasce sem taxas da plataforma (empresa do grupo). Se a organização já existe, só atualiza a ficha.
- `createHouseBrandAdmin`: cria o acesso da equipe no Master (`/master/megatron` → "Criar acesso").
- Painel **Mega Tron Master** em `/master/megatron` (menu "Marca da casa" e cartão em Ecossistema).
- Na demonstração, a Mega Tron da vitrine recebe a ficha real e mantém a operação de exemplo.

## Próximas etapas do sigilo (em ordem)

1. **Origem sigilosa do produto** (`house_sourcing`: produto da Mega Tron → importadora, custo de compra e SKU da importadora). Só o Master lê. Toda query de lojista, cliente ou vitrine é testada para nunca juntar essa tabela.
2. **Pedido de compra à importadora** (`purchase_orders`): quando o cliente compra da Mega Tron, nasce um pedido de compra *da Mega Tron* para a importadora, com itens e quantidades. **Sem** nome, telefone, e-mail ou documento do cliente. A importadora tem o próprio acesso, escopado ao seu `supplier_id`.
3. **Entrega.** Escolha por importadora:
   - *Cross-docking* (recomendado para sigilo total): a importadora entrega na Mega Tron, que despacha ao cliente. A importadora nunca vê o endereço.
   - *Envio direto às cegas*: a importadora despacha com etiqueta e declaração de conteúdo em nome da Mega Tron. Ela **vê o endereço** na etiqueta. Use só com contrato de não aliciamento e confidencialidade.
4. **Conteúdo gravado nas importadoras**: remover metadados (EXIF/GPS) no upload, revisar fachadas, crachás, caixas com marca, notas e telas ao fundo, e publicar sempre como Mega Tron.
5. **Testes de sigilo** (bloqueiam o merge): uma importadora não lê cliente, endereço, loja nem preço de venda; um lojista ou cliente não lê `house_sourcing`, nome de importadora nem custo de compra.

## Limites legais (validar com contador e jurídico)

- Vender como Mega Tron é legítimo: ela é a vendedora de fato, com CNPJ, nota e responsabilidade perante o cliente (CDC e Decreto 7.962/2013 exigem identificar quem vende, e quem vende é ela).
- **Produto importado traz o importador na embalagem e na etiqueta** (rotulagem obrigatória; para eletrônicos também Anatel/Inmetro). O sistema não pode, nem deve, apagar isso. O sigilo total sobre a origem física exige que a Mega Tron seja a importadora de registro ou use marca própria com rotulagem correta.
- Dados do cliente repassados à importadora precisam de base legal (LGPD). Minimizar o repasse, como descrito acima, já é o caminho mais seguro.
