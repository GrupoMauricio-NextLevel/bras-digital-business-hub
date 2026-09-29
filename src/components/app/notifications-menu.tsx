"use client";
import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/utils";

export type NoticeView = { id: string; message: string; createdAt: string; type: string };
const KEY = "nl-notice-seen";

/** Central de avisos: atividades recentes do escopo do usuário; "novo" = mais recente que a última abertura. */
export function NotificationsMenu({ notices }: { notices: NoticeView[] }) {
  const [seen, setSeen] = React.useState<number | null>(null);
  React.useEffect(() => { const id = requestAnimationFrame(() => { try { setSeen(Number(localStorage.getItem(KEY) ?? 0)); } catch { setSeen(0); } }); return () => cancelAnimationFrame(id); }, []);
  const unread = seen === null ? 0 : notices.filter((n) => new Date(n.createdAt).getTime() > seen).length;
  const markSeen = (open: boolean) => { if (open) return; const now = Date.now(); setSeen(now); try { localStorage.setItem(KEY, String(now)); } catch { /* ignore */ } };
  return (
    <DropdownMenu onOpenChange={markSeen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `${unread} avisos novos` : "Avisos"}>
          <Bell />
          {unread > 0 ? <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white" aria-hidden>{unread > 9 ? "9+" : unread}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Avisos recentes</DropdownMenuLabel>
        <div aria-live="polite" className="nl-scroll max-h-80 overflow-y-auto">
          {notices.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sem avisos por enquanto.</p> : notices.map((n) => (
            <div key={n.id} className="flex gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-surface-muted">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
              <div className="min-w-0"><p className="leading-snug">{n.message}</p><p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p></div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
