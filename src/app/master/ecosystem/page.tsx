import Link from "next/link";
import { ArrowRight, Boxes, Building2, Factory, RadioTower, ShoppingBag, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/require-session";
import { ECOSYSTEM, PRODUCT_AREAS, type ProductArea } from "@/lib/ecosystem";

const ICONS: Record<ProductArea, typeof Boxes> = {
  NEXTLEVEL_COMMERCE: Boxes,
  SUPERDROP: ShoppingBag,
  BRAS_DIGITAL: Building2,
  CREATORS_HUB: UsersRound,
  CHINA_HUB: Factory,
};

const STATUS: Record<ProductArea, string> = {
  NEXTLEVEL_COMMERCE: "Core compartilhado",
  SUPERDROP: "Operação atual",
  BRAS_DIGITAL: "Em estruturação",
  CREATORS_HUB: "Em estruturação",
  CHINA_HUB: "Em estruturação",
};

export default async function EcosystemPage() {
  await requireRole("NEXTLEVEL_MASTER");

  return (
    <>
      <PageHeader
        title="Ecossistema NextLevel"
        description="Escolha a área que deseja administrar. Todas usam o mesmo Commerce Core e compartilham dados sem duplicação."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRODUCT_AREAS.map((area) => {
          const item = ECOSYSTEM[area];
          const Icon = ICONS[area];

          return (
            <Link key={area} href={item.base} className="group block">
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" aria-hidden />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">{item.label}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <RadioTower className="size-3.5" aria-hidden />
                    {STATUS[area]}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
