import { PageHeader } from "@/components/app/page-header";
import { ThemeCard } from "@/components/shared/theme-cards";
import { listThemes } from "@/lib/queries/master";
import { Card, CardContent } from "@/components/ui/card";

export default async function TemplatesPage() {
  const themes = await listThemes();
  return (
    <>
      <PageHeader title="Templates" description="Theme Store da NextLevel. Conteúdo é separado do layout: a loja troca de tema sem perder produtos, clientes, pedidos ou configurações." />
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
