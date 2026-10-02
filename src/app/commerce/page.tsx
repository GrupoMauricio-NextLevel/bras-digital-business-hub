import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/require-session";

export default async function Page() {
  await requireRole("NEXTLEVEL_MASTER");

  return (
    <>
      <PageHeader title="NextLevel Commerce" description="Motor central do ecossistema: dados e regras compartilhados por todas as verticais." />
      <div className="mb-6">
        <Link href="/master/ecosystem" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" /> Voltar ao ecossistema
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Escopo inicial</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Organizações, usuários e permissões</li>
            <li>• Catálogo, variantes e estoque central</li>
            <li>• Pedidos, checkout, pagamentos e frete</li>
            <li>• Financeiro, assinaturas, temas e integrações</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
