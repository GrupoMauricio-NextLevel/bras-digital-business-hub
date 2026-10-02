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
      <PageHeader title="Creators Hub" description="Camada de aquisição e vendas por creators, afiliados, conteúdo e social commerce." />
      <div className="mb-6">
        <Link href="/master/ecosystem" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" /> Voltar ao ecossistema
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Escopo inicial</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Creators e campanhas</li>
            <li>• Produtos elegíveis por campanha</li>
            <li>• Links, cupons e atribuição</li>
            <li>• Comissões e performance</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
