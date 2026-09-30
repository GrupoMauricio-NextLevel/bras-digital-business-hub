/** Conteúdo do portal público. Valores confirmados em docs/PLANOS.md (item 0); o que ainda está em decisão não aparece com preço. */
export const FLOW = [
  { title: "O fornecedor cadastra o catálogo", text: "Produtos, estoque e preço de custo ficam com quem produz e despacha." },
  { title: "O membro monta a loja", text: "Escolhe o que vender, define o próprio preço e recebe o pedido do cliente." },
  { title: "O custo sai do saldo", text: "Cada pedido debita o custo da carteira do membro, recarregada por Pix." },
  { title: "O fornecedor separa e envia", text: "Ele separa o pedido no horário de corte e envia direto ao seu cliente." },
  { title: "Todos acompanham", text: "Pedido, etiqueta, pós-venda e financeiro em painéis feitos para cada papel." },
];

export const AUDIENCES = [
  { key: "membro", title: "Para quem vende", text: "Loja no ar sem estoque e sem separar pedido. Você cuida da venda; o fornecedor cuida do resto.", bullets: ["Loja pronta, com subdomínio ou domínio próprio", "Carteira por Pix, sem cartão", "Pós-venda e etiquetas no mesmo lugar"], href: "/como-funciona" },
  { key: "fornecedor", title: "Para quem fornece", text: "Uma operação de expedição ao vivo, com corte, ondas de separação e etiqueta em PDF.", bullets: ["Esteira ao vivo e horário de corte", "Painel de expedição sem valores", "Sua página de vendas para captar membros"], href: "/fornecedores" },
  { key: "whitelabel", title: "Marca própria", text: "A plataforma com a sua identidade, para operar a sua rede de membros.", bullets: ["Sua marca e seu domínio", "Taxa por pedido reduzida", "Implantação acompanhada pela NextLevel"], href: "/seja-fornecedor#white-label" },
];

export const SUPPLIER_PLANS = [
  { key: "superdrop", name: "SuperDrop", tagline: "Opere no subdomínio da plataforma", setup: "R$ 1.500", monthly: "R$ 300", fee: "3%", items: ["Painel do fornecedor, esteira e expedição", "Página de vendas do seu catálogo", "Carteira, etiquetas e pós-venda dos membros", "Sem taxa por pedido nos primeiros 15 dias"] },
  { key: "white-label", name: "White Label", tagline: "Sua marca, seu domínio", setup: "R$ 15.000", monthly: "R$ 2.500", fee: "1,5%", items: ["Tudo do SuperDrop", "Marca e domínio próprios", "Menor taxa por pedido", "Implantação acompanhada"] },
];

export const MEMBER_FEES = [
  { name: "Drop manual", fee: "5%", text: "Você lança os pedidos e o fornecedor envia." },
  { name: "Loja básica", fee: "5%", text: "Loja no subdomínio da plataforma." },
  { name: "Loja própria", fee: "3%", text: "Loja com domínio e identidade próprios." },
];

export const FAQ = [
  { q: "Preciso ter estoque?", a: "Não. O fornecedor mantém o estoque e envia direto ao seu cliente." },
  { q: "Como funciona o teste de 7 dias?", a: "Você começa sem cartão de crédito, com um cupom do fornecedor que te indicou. Só paga se decidir continuar." },
  { q: "Como pago?", a: "Recargas da carteira e vendas da loja são por Pix. Os planos da NextLevel aceitam Pix e cartão." },
  { q: "Como é calculada a taxa por pedido?", a: "Um percentual sobre o valor dos produtos, sem o frete, que é pago pelo cliente final. Se o pedido for estornado, a taxa volta. Pedidos de teste não pagam taxa." },
  { q: "O que acontece se o saldo acabar?", a: "O pedido fica em “Aguardando recarga” por até 72 horas e segue assim que o Pix é confirmado." },
  { q: "Meus dados são compartilhados?", a: "Somente o necessário para o fornecedor separar e enviar o pedido, conforme a política de privacidade e o seu aceite." },
  { q: "Existe desconto nos planos semestral e anual?", a: "Os planos têm o mesmo valor mensal, pagos adiantados. O desconto de 15% (semestral) e 25% (anual) vale para os serviços da Loja NextLevel." },
];
