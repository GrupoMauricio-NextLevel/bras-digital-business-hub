import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleDashed,
  CircleDotDashed,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireProductArea } from "@/lib/require-session";
import { COMMERCE_CORE_MODULES, type CommerceCoreModuleStatus } from "@/lib/commerce-core";

const STATUS: Record<CommerceCoreModuleStatus, { label: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: "Base existente", icon: CheckCircle2 },
  PARTIAL: { label: "Em consolidação", icon: CircleDotDashed },
  PLANNED: { label: "Planejado", icon: CircleDashed },
};

export default async function Page() {
  await requireProductArea("NEXTLEVEL_COMMERCE");

  return (
    <>
      <PageHeader
        title="NextLevel Commerce"
        description="Motor compartilhado do ecossistema. O core concentra os dados e regras reutilizados por todas as verticais."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/master/ecosystem" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" /> Voltar ao ecossistema
        </Link>
        <div className="text-xs text-muted-foreground">
          Regra: vertical muda contexto comercial; produto, estoque, cliente e pedido continuam únicos.
        </div>
      </div>

      <div className="mb-6 rounded-xl border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
            <Boxes className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold">Fronteira do Commerce Core</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Esta área reúne infraestrutura compartilhada. Regras específicas de dropshipping, atacado,
              creators ou onboarding de importadores permanecem em suas respectivas verticais.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COMMERCE_CORE_MODULES.map((module) => {
          const status = STATUS[module.status];
          const StatusIcon = status.icon;

          const content = (
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{module.label}</CardTitle>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <StatusIcon className="size-3.5" aria-hidden />
                    {status.label}
                  </div>
                </div>
                {module.href ? <ArrowRight className="size-4 text-muted-foreground" aria-hidden /> : null}
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          );

          return module.href ? (
            <Link key={module.key} href={module.href} className="group block">
              {content}
            </Link>
          ) : (
            <div key={module.key}>{content}</div>
          );
        })}
      </div>
    </>
  );
}
