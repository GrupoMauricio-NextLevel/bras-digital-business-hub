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
      <PageHeader title="China Hub" description="Porta de entrada de importadores e fornecedores chineses para a distribuição no Brasil." />
      <div className="mb-6">
        <Link href="/master/ecosystem" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" /> Voltar ao ecossistema
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Escopo inicial</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Empresas, importadores e representantes</li>
            <li>• Onboarding e catálogo Brasil</li>
            <li>• Rede comercial e leads B2B</li>
            <li>• Distribuição para SuperDrop, Brás Digital e Creators Hub</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
