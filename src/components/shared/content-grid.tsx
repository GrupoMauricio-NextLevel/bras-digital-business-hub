import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/app/empty-state";

type Item = { id: string; category: string; title: string; description: string; format: string; accent: string };
const CATS = ["PRODUTOS", "STORIES", "BANNERS", "REELS", "CAMPANHAS"] as const;
const LABEL: Record<string, string> = { PRODUTOS: "Produtos", STORIES: "Stories", BANNERS: "Banners", REELS: "Reels", CAMPANHAS: "Campanhas" };

export function ContentGrid({ items }: { items: Item[] }) {
  return (
    <Tabs defaultValue="ALL">
      <TabsList>
        <TabsTrigger value="ALL">Tudo</TabsTrigger>
        {CATS.map((c) => <TabsTrigger key={c} value={c}>{LABEL[c]}</TabsTrigger>)}
      </TabsList>
      {["ALL", ...CATS].map((c) => {
        const rows = c === "ALL" ? items : items.filter((i) => i.category === c);
        return (
          <TabsContent key={c} value={c}>
            {rows.length === 0 ? <EmptyState title="Sem conteúdo" description="Novos materiais aparecerão aqui." /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rows.map((i) => (
                  <Card key={i.id} className="overflow-hidden">
                    <div className="aspect-[4/3]" style={{ background: `linear-gradient(135deg, ${i.accent}, ${i.accent}99)` }} />
                    <CardContent className="pt-3">
                      <Badge tone="outline">{LABEL[i.category]}</Badge>
                      <div className="mt-2 text-sm font-medium">{i.title}</div>
                      <div className="text-xs text-muted-foreground">{i.description}</div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{i.format}</span><Button size="sm" variant="secondary" disabled><Download /> Baixar</Button></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
