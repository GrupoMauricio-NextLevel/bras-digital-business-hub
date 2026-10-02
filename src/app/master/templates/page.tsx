import { LayoutTemplate, Layers3 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { ThemeCard } from "@/components/shared/theme-cards";
import { listThemes } from "@/lib/queries/master";
import { Card, CardContent } from "@/components/ui/card";

export default async function TemplatesPage() {
  const themes = await listThemes();
  const active = themes.filter((t) => t.available).length;
  return (
    <>
      <PageHeader title="Templates" description="Theme Store da NextLevel. Conteúdo é separado do layout: a loja troca de tema sem perder produtos, clientes, pedidos ou configurações." />
      <OperationalPulse className="mb-5" items={[
        { label: "Templates", value: themes.length, icon: LayoutTemplate, tone: "neutral", hint: active + " ativos" },
        { label: "Arquitetura", value: "Conteúdo separado", icon: Layers3, tone: "info", hint: "tema sem perder dados" },
        { label: "Versionamento", value: "Preparado", icon: Layers3, tone: "neutral", hint: "ThemeVersion" },
        { label: "Configuração", value: "Por loja", icon: LayoutTemplate, tone: "info", hint: "StoreTheme + settings" },
      ]} />
      <div className="grid gap-4 md:grid-cols-3">
        {themes.map((t) => <ThemeCard key={t.id} theme={t} previewHref="/store/mantos-shop" />)}
      </div>
      <Card className="mt-6">
        <CardContent className="grid gap-4 py-5 text-sm sm:grid-cols-4">
          <div><div className="font-medium">Theme</div><div className="text-muted-foreground">Produto comercial (Starter, Pro, Elite)</div></div>
          <div><div className="font-medium">ThemeVersion</div><div className="text-muted-foreground">Versões publicadas e depreciadas</div></div>
          <div><div className="font-medium">StoreTheme</div><div className="text-muted-foreground">Tema ativo em cada loja</div></div>
          <div><div className="font-medium">ThemeSettings</div><div className="text-muted-foreground">Conteúdo da loja (hero, banners, textos)</div></div>
        </CardContent>
      </Card>
    </>
  );
}
