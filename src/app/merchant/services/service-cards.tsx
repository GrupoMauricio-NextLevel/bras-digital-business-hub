"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutTemplate, Palette, Image, Share2, TrendingUp, MessageCircle, Wrench, LifeBuoy, Sparkles, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { formatBRL } from "@/lib/money";
import { createServiceLeadAction } from "@/app/actions/merchant";

const ICONS: Record<string, LucideIcon> = { LayoutTemplate, Palette, Image, Share2, TrendingUp, MessageCircle, Wrench, LifeBuoy };
type S = { id: string; name: string; description: string; category: string; priceFromCents: number | null; icon: string; leadStatus: string | null };

export function ServiceCards({ services }: { services: S[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const interest = async (s: S) => {
    setPendingId(s.id);
    const r = await createServiceLeadAction(s.id);
    setPendingId(null);
    if (r.ok) { toast.success(r.data.already ? "Já registramos seu interesse" : "Interesse registrado! Nossa equipe entrará em contato."); router.refresh(); } else toast.error(r.error);
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((s) => {
        const Icon = ICONS[s.icon] ?? Sparkles;
        return (
          <Card key={s.id} className="flex flex-col">
            <CardContent className="flex-1 pt-5">
              <div className="mb-3 flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-md bg-surface-muted text-foreground"><Icon className="size-5" /></span><Badge tone="outline">{s.category}</Badge></div>
              <h3 className="text-base font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-sm"><span className="text-xs text-muted-foreground">a partir de</span> <span className="font-semibold">{formatBRL(s.priceFromCents ?? 0)}</span></span>
              {s.leadStatus ? <StatusBadge value={s.leadStatus} dot /> : <Button size="sm" onClick={() => interest(s)} loading={pendingId === s.id}>Tenho interesse</Button>}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
