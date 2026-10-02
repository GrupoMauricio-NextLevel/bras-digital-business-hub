import Link from "next/link";
import { ArrowRight, Factory, Store, Package, ShoppingCart, Wallet, Truck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProductArea } from "@/lib/require-session";

type Entry = {
  title: string;
  description: string;
  href: string;
  icon: typeof Factory;
};

const MASTER_ENTRIES: Entry[] = [
  { title: "Fornecedores", description: "Cadastro, contratos e saúde dos fornecedores da rede.", href: "/master/suppliers", icon: Factory },
  { title: "Lojistas", description: "Lojas conectadas aos fornecedores e situação operacional.", href: "/master/stores", icon: Store },
  { title: "Catálogo", description: "Produtos centrais habilitados para distribuição no SuperDrop.", href: "/master/catalog", icon: Package },
  { title: "Pedidos", description: "Visão consolidada dos pedidos originados pela rede.", href: "/master/orders", icon: ShoppingCart },
  { title: "Financeiro", description: "Receita da plataforma, cobranças e taxas da operação.", href: "/master/finance", icon: Wallet },
];

const SUPPLIER_ENTRIES: Entry[] = [
  { title: "Esteira", description: "Pedidos liberados para separação e expedição.", href: "/supplier", icon: Truck },
  { title: "Pedidos", description: "Pedidos da rede vinculada ao fornecedor.", href: "/supplier/orders", icon: ShoppingCart },
  { title: "Lojistas", description: "Lojas e membros da rede de distribuição.", href: "/supplier/stores", icon: Store },
  { title: "Produtos", description: "Catálogo central, variantes e disponibilidade.", href: "/supplier/products", icon: Package },
  { title: "Financeiro", description: "Recargas, valores e visão financeira da operação.", href: "/supplier/finance", icon: Wallet },
];

const MERCHANT_ENTRIES: Entry[] = [
  { title: "Início", description: "Resumo da operação da sua loja.", href: "/merchant", icon: Store },
  { title: "Catálogo", description: "Escolha produtos da rede e defina sua oferta.", href: "/merchant/products", icon: Package },
  { title: "Pedidos", description: "Acompanhe vendas e status de atendimento.", href: "/merchant/orders", icon: ShoppingCart },
  { title: "Saldo e recargas", description: "Saldo usado para pagar o custo dos pedidos à central.", href: "/merchant/wallet", icon: Wallet },
];

export default async function SuperDropPage() {
  const session = await requireProductArea("SUPERDROP");

  const entries =
    session.user.role === "NEXTLEVEL_MASTER"
      ? MASTER_ENTRIES
      : session.user.role === "SUPPLIER_ADMIN" || session.user.role === "SUPPLIER_DISPATCH"
        ? SUPPLIER_ENTRIES
        : MERCHANT_ENTRIES;

  const profile =
    session.user.role === "NEXTLEVEL_MASTER"
      ? "Administração da plataforma"
      : session.user.role === "SUPPLIER_ADMIN" || session.user.role === "SUPPLIER_DISPATCH"
        ? "Operação do fornecedor"
        : "Operação do lojista";

  return (
    <>
      <PageHeader
        title="SuperDrop"
        description="Rede de distribuição conectando fornecedor, catálogo central, lojista, venda e expedição sem duplicar estoque."
      />

      <div className="mb-5 text-sm text-muted-foreground">
        Contexto atual: <strong className="text-foreground">{profile}</strong>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link key={entry.href} href={entry.href} className="group block">
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" aria-hidden />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
