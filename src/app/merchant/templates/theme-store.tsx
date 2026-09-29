"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Theme } from "@/db/schema";
import { ThemeCard } from "@/components/shared/theme-cards";
import { activateThemeAction } from "@/app/actions/merchant";

export function ThemeStore({ themes, activeThemeId, storeSlug }: { themes: Theme[]; activeThemeId: string | null; storeSlug: string }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const activate = async (id: string) => {
    setPendingId(id);
    const r = await activateThemeAction(id);
    setPendingId(null);
    if (r.ok) { toast.success("Tema ativado"); router.refresh(); } else toast.error(r.error);
  };
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {themes.map((t) => <ThemeCard key={t.id} theme={t} active={t.id === activeThemeId} previewHref={`/store/${storeSlug}?theme=${t.key}`} onActivate={() => activate(t.id)} activating={pendingId === t.id} />)}
    </div>
  );
}
