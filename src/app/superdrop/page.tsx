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
      <PageHeader title="SuperDrop" description="Rede de distribuição por fornecedores, lojistas e lojas conectadas ao Commerce Core." />
      <div className="mb-6">
        <Link href="/master/ecosystem" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" /> Voltar ao ecossistema
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Escopo inicial</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Fornecedores e redes</li>
            <li>• Lojistas e lojas</li>
            <li>• Catálogo habilitado para dropshipping</li>
            <li>• Pedidos, recargas, etiquetas e expedição</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
