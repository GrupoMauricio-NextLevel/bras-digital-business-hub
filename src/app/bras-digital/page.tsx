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
      <PageHeader title="Brás Digital" description="Marketplace B2B para conectar fornecedores do Brás a compradores e revendedores." />
      <div className="mb-6">
        <Link href="/master/ecosystem" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" /> Voltar ao ecossistema
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Escopo inicial</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Fornecedores e catálogos B2B</li>
            <li>• Venda por atacado e grades</li>
            <li>• Pedidos, retirada e expedição</li>
            <li>• Distribuição nacional sem duplicar estoque</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
