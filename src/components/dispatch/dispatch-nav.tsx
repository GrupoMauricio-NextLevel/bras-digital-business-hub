import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/supplier/dispatch", label: "Fila de expedição" },
  { href: "/supplier/dispatch/print", label: "Ondas e etiquetas" },
  { href: "/supplier/dispatch/shipped", label: "Enviados hoje" },
];

/** Navegação da expedição (o painel mínimo não tem barra lateral). */
export function DispatchNav({ active, adm }: { active: string; adm?: boolean }) {
  return (
    <nav aria-label="Expedição" className="nl-no-print mb-5 flex flex-wrap items-center gap-2">
      {TABS.map((t) => <Link key={t.href} href={t.href} aria-current={active === t.href ? "page" : undefined} className={cn("inline-flex h-12 items-center rounded-lg border px-5 text-base font-semibold", active === t.href ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-muted")}>{t.label}</Link>)}
      {adm ? <Link href="/supplier" className="ml-auto text-sm text-muted-foreground underline-offset-2 hover:underline">Voltar ao painel do gestor</Link> : null}
    </nav>
  );
}
