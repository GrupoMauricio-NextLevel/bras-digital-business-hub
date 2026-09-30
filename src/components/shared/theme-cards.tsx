import { Check, Lock, Eye } from "lucide-react";
import type { Theme } from "@/db/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { formatBRL } from "@/lib/money";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Preview estilizado do tema (wireframe em miniatura). */
export function ThemePreview({ accent, tier, className }: { accent: string; tier: Theme["tier"]; className?: string }) {
  return (
    <div className={cn("relative aspect-[16/10] w-full overflow-hidden rounded-t-lg border-b border-border bg-surface-muted p-3", className)}>
      <div className="flex h-full flex-col gap-1.5 rounded-md bg-surface p-2 shadow-sm">
        <div className="flex items-center justify-between"><span className="h-1.5 w-8 rounded-full" style={{ background: accent }} /><span className="flex gap-1"><i className="block h-1 w-4 rounded-full bg-border" /><i className="block h-1 w-4 rounded-full bg-border" /><i className="block h-1 w-4 rounded-full bg-border" /></span></div>
        <div className={cn("rounded", tier === "ELITE" ? "h-[38%]" : "h-[30%]")} style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}66)` }} />
        <div className="grid flex-1 grid-cols-4 gap-1">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded bg-surface-muted" />)}</div>
        {tier !== "STARTER" ? <div className="grid grid-cols-2 gap-1"><div className="h-2 rounded bg-surface-muted" /><div className="h-2 rounded bg-surface-muted" /></div> : null}
      </div>
    </div>
  );
}

export function ThemeCard({ theme, active, previewHref, onActivate, activating }: { theme: Theme; active?: boolean; previewHref?: string; onActivate?: () => void; activating?: boolean }) {
  return (
    <Card className={cn("flex flex-col overflow-hidden", active && "ring-2 ring-brand")}>
      <ThemePreview accent={theme.previewAccent} tier={theme.tier} />
      <CardContent className="flex-1 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{theme.name}</h3>
          <div className="flex items-center gap-1.5">
            <StatusBadge value={theme.tier} />
            {active ? <Badge tone="success" dot>Ativo</Badge> : null}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{theme.description}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {theme.features.map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="size-3.5 text-success" />{f}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="text-sm font-semibold">{theme.priceCents === 0 ? "Gratuito" : formatBRL(theme.priceCents)}</div>
        <div className="flex gap-2">
          {previewHref ? <a href={previewHref} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}><Eye /> Visualizar</a> : null}
          {onActivate ? (
            active ? <Button size="sm" variant="secondary" disabled>Em uso</Button> : theme.available ? <Button size="sm" onClick={onActivate} loading={activating}>Ativar</Button> : <Button size="sm" variant="secondary" disabled><Lock /> Comprar (em breve)</Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
