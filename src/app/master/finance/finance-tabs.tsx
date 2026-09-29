"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FinanceTab = { value: string; label: string; content: React.ReactNode };

/** Abas do módulo com o estado na URL (?tab=), para compartilhar e voltar ao mesmo ponto. */
export function FinanceTabs({ tabs, initial }: { tabs: FinanceTab[]; initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = tabs.some((t) => t.value === params.get("tab")) ? (params.get("tab") as string) : initial;
  return (
    <Tabs value={current} onValueChange={(v) => { const p = new URLSearchParams(params.toString()); p.set("tab", v); router.replace(`${pathname}?${p.toString()}`, { scroll: false }); }}>
      <TabsList className="mb-2">{tabs.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}</TabsList>
      {tabs.map((t) => <TabsContent key={t.value} value={t.value}>{t.content}</TabsContent>)}
    </Tabs>
  );
}
