"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ChevronsDownUp, ChevronsUpDown, Copy, ExternalLink, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { checkMapAction } from "@/app/actions/qualidade";
import {
  CELL_LABEL, MAP_HOSTS, MAP_HOST_LABEL, buildMapTree, mermaidOf, pageFailed, pageMisplaced, pageUnchecked,
  type CellState, type MapHost, type TreeNode, type TreePage,
} from "@/lib/qualidade/mapa";

type Patch = { tested?: boolean; approved?: boolean; problem?: boolean };
type Props = {
  pages: TreePage[]; lastAt: string | null;
  hostUrls: Record<MapHost, string>;
  pathOf: (route: string) => string | null;
  onSave: (route: string, patch: Patch) => Promise<boolean>;
};
type Show = "tudo" | "fora" | "falhou" | "sem" | "problema" | "pendentes";
const SHOW: { key: Show; label: string }[] = [
  { key: "tudo", label: "Tudo" }, { key: "fora", label: "Fora do lugar" }, { key: "falhou", label: "Erro ao abrir" },
  { key: "sem", label: "Ainda não checado" }, { key: "problema", label: "Marcado com problema" }, { key: "pendentes", label: "Falta testar ou aprovar" },
];
const SHORT: Record<MapHost, string> = { NEXTLEVEL: "MA", NEXTLEVEL_COMMERCE: "CM" };
const TONE: Record<CellState, string> = {
  ABRE: "border-success text-success", LOGIN: "border-border text-muted-foreground", INICIO: "border-info text-info", OUTRO: "border-info text-info",
  "404": "border-danger text-danger", ERRO: "border-danger text-danger",
};

function keep(p: TreePage, show: Show, needle: string) {
  if (needle && !`${p.route} ${p.label}`.toLowerCase().includes(needle)) return false;
  if (show === "fora") return pageMisplaced(p);
  if (show === "falhou") return pageFailed(p);
  if (show === "sem") return pageUnchecked(p);
  if (show === "problema") return p.problem;
  if (show === "pendentes") return !(p.tested && p.approved);
  return true;
}

/**
 * Mapa vivo (D147): a árvore de todo o sistema (tipo de página → área → seção do menu → página), com a situação de cada página
 * em cada endereço no ar, os contadores de cada galho e a checagem de um galho só. Abre e fecha com clique, Enter ou setas.
 */
export function MapaVivo({ pages, lastAt, hostUrls, pathOf, onSave }: Props) {
  const router = useRouter();
  const [show, setShow] = React.useState<Show>("tudo");
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [openAll, setOpenAll] = React.useState<boolean | null>(null);
  const needle = q.trim().toLowerCase();
  const filtering = show !== "tudo" || !!needle;
  const tree = React.useMemo(() => buildMapTree(pages.filter((p) => keep(p, show, needle))), [pages, show, needle]);
  const whole = React.useMemo(() => buildMapTree(pages), [pages]);
  const total = whole.reduce((a, n) => ({ total: a.total + n.counts.total, misplaced: a.misplaced + n.counts.misplaced, failed: a.failed + n.counts.failed, unchecked: a.unchecked + n.counts.unchecked }), { total: 0, misplaced: 0, failed: 0, unchecked: 0 });

  const check = async (key: string, routes: string[]) => {
    setBusy(key);
    const r = await checkMapAction(routes);
    setBusy(null);
    if (r.ok) { toast.success(`Checado: ${r.data.ok} certo(s), ${r.data.failed} com aviso`); router.refresh(); } else toast.error(r.error);
  };
  const copyMermaid = async () => {
    try { await navigator.clipboard.writeText(mermaidOf(tree)); toast.success("Mapa mental copiado (cole num editor Mermaid)"); } catch { toast.error("Não consegui copiar"); }
  };

  return (
    <div className="grid gap-4">
      <p className="max-w-prose text-sm text-muted-foreground">
        Todo o sistema em árvore. Cada página mostra o que acontece em cada endereço no ar ({MAP_HOSTS.map((h) => `${SHORT[h]} = ${MAP_HOST_LABEL[h]}`).join(", ")}).
        <b className="text-foreground"> Fora do lugar</b> é o que contraria as suas decisões de 12/10 (painéis da equipe só no Master e os dos clientes no endereço da marca deles; Soluções e Loja NextLevel no site do grupo; termos e privacidade em todas as marcas).
        Abra um galho e use “Checar este galho” para testar só aquele pedaço.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumo do mapa">
        <Stat label="Páginas" value={total.total} />
        <Stat label="Fora do lugar" value={total.misplaced} tone={total.misplaced ? "text-warning" : ""} />
        <Stat label="Erro ao abrir" value={total.failed} tone={total.failed ? "text-danger" : ""} />
        <Stat label="Ainda não checadas" value={total.unchecked} hint={lastAt ? `última checagem ${new Date(lastAt).toLocaleString("pt-BR")}` : "nenhuma checagem ainda"} />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col text-sm font-medium" htmlFor="mv-q">Buscar
          <span className="relative mt-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input id="mv-q" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="nome ou endereço" /></span>
        </label>
        <label className="flex flex-col text-sm font-medium" htmlFor="mv-show">Mostrar<Select id="mv-show" className="mt-1" value={show} onChange={(e) => setShow(e.target.value as Show)}>{SHOW.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</Select></label>
        <Button variant="secondary" onClick={() => setOpenAll(true)}><ChevronsUpDown /> Abrir tudo</Button>
        <Button variant="secondary" onClick={() => setOpenAll(false)}><ChevronsDownUp /> Fechar tudo</Button>
        <Button variant="secondary" onClick={copyMermaid}><Copy /> Copiar mapa mental</Button>
      </div>
      <Legend />
      {tree.length ? (
        <ul className="grid gap-2" aria-label="Árvore do sistema">
          {tree.map((n) => <Branch key={`${n.key}-${openAll}`} n={n} defaultOpen={openAll ?? (filtering || false)} busy={busy} onCheck={check} hostUrls={hostUrls} pathOf={pathOf} onSave={onSave} />)}
        </ul>
      ) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma página com esse filtro.</p>}
    </div>
  );
}

function Stat({ label, value, tone = "", hint }: { label: string; value: number; tone?: string; hint?: string }) {
  return <div className="grid content-start gap-0.5 rounded-xl border border-border bg-surface p-3"><span className="text-xs font-semibold text-muted-foreground">{label}</span><span className={`text-xl font-bold tabular-nums ${tone}`}>{value}</span>{hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}</div>;
}

function Legend() {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {(["ABRE", "LOGIN", "INICIO", "OUTRO", "404", "ERRO"] as CellState[]).map((s) => <span key={s} className="inline-flex items-center gap-1"><span className={`inline-block size-3 rounded-sm border-2 ${TONE[s]}`} aria-hidden />{CELL_LABEL[s]}</span>)}
      <span className="inline-flex items-center gap-1"><AlertTriangle className="size-3.5 text-warning" aria-hidden />fora do lugar</span>
    </p>
  );
}

function Counts({ n }: { n: TreeNode }) {
  const c = n.counts;
  return (
    <span className="flex flex-wrap items-center gap-1 text-xs font-normal">
      <span className="ds-pill ds-pill--mute">{c.total} página{c.total === 1 ? "" : "s"}</span>
      {c.tested || c.approved ? <span className="ds-pill ds-pill--ok">{c.approved} aprovada{c.approved === 1 ? "" : "s"}</span> : null}
      {c.misplaced ? <span className="ds-pill ds-pill--warn">{c.misplaced} fora do lugar</span> : null}
      {c.failed ? <span className="ds-pill ds-pill--bad">{c.failed} com erro</span> : null}
      {c.problem ? <span className="ds-pill ds-pill--bad">{c.problem} com problema</span> : null}
      {c.unchecked ? <span className="ds-pill ds-pill--outline">{c.unchecked} sem checagem</span> : null}
    </span>
  );
}

const arrows = (e: React.KeyboardEvent<HTMLElement>) => {
  const d = (e.currentTarget.parentElement as HTMLDetailsElement | null);
  if (!d) return;
  if (e.key === "ArrowRight" && !d.open) { e.preventDefault(); d.open = true; }
  if (e.key === "ArrowLeft" && d.open) { e.preventDefault(); d.open = false; }
};

function Branch({ n, defaultOpen, busy, onCheck, hostUrls, pathOf, onSave }: { n: TreeNode; defaultOpen: boolean; busy: string | null; onCheck: (key: string, routes: string[]) => void; hostUrls: Record<MapHost, string>; pathOf: (r: string) => string | null; onSave: Props["onSave"] }) {
  const Heading = n.depth === 0 ? "h3" : "span";
  return (
    <li className={n.depth === 0 ? "rounded-xl border border-border bg-surface" : ""}>
      <details open={defaultOpen} className="group">
        <summary onKeyDown={arrows} className={`flex cursor-pointer flex-wrap items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-hover ${n.depth === 0 ? "text-base" : "text-sm"}`}>
          <Heading className="font-semibold">{n.label}</Heading>
          <Counts n={n} />
        </summary>
        <div className={`grid gap-2 pb-3 ${n.depth === 0 ? "px-3" : "border-l border-border pl-3 ml-3"}`}>
          <div><Button size="sm" variant="secondary" loading={busy === n.key} onClick={() => onCheck(n.key, n.routes)}><RefreshCw /> Checar este galho ({n.routes.length})</Button></div>
          {n.children.length ? <ul className="grid gap-1">{n.children.map((c) => <Branch key={c.key} n={c} defaultOpen={defaultOpen} busy={busy} onCheck={onCheck} hostUrls={hostUrls} pathOf={pathOf} onSave={onSave} />)}</ul> : null}
          {n.pages.length ? <ul className="divide-y divide-border rounded-lg border border-border">{n.pages.map((p) => <PageRow key={p.route} p={p} hostUrls={hostUrls} pathOf={pathOf} onSave={onSave} />)}</ul> : null}
        </div>
      </details>
    </li>
  );
}

function PageRow({ p, hostUrls, pathOf, onSave }: { p: TreePage; hostUrls: Record<MapHost, string>; pathOf: (r: string) => string | null; onSave: Props["onSave"] }) {
  const path = pathOf(p.route);
  const why = new Map<string, string[]>();
  for (const h of MAP_HOSTS) { const m = p.cells[h]?.misplaced; if (m) why.set(m, [...(why.get(m) ?? []), MAP_HOST_LABEL[h]]); }
  const home: MapHost = p.kind === "PAINEL" ? "NEXTLEVEL" : (MAP_HOSTS.find((h) => p.cells[h]?.state === "ABRE") ?? "NEXTLEVEL_COMMERCE");
  const toggle = (k: keyof Patch) => onSave(p.route, { [k]: !p[k] });
  return (
    <li className="grid gap-2 p-2.5 text-sm lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <div className="grid min-w-0 gap-0.5">
        <span className="flex flex-wrap items-center gap-2 font-medium">{p.label}{pageMisplaced(p) ? <AlertTriangle className="size-4 text-warning" aria-label="fora do lugar" /> : null}</span>
        <code className="break-all text-xs text-muted-foreground">{p.route}</code>
        {why.size ? <ul className="mt-1 grid gap-0.5 text-xs text-warning">{[...why.entries()].map(([w, hs]) => <li key={w}><b>{hs.join(", ")}:</b> {w}</li>)}</ul> : null}
      </div>
      <ul className="flex flex-wrap gap-1" aria-label={`Situação de ${p.label} em cada endereço`}>
        {MAP_HOSTS.map((h) => {
          const c = p.cells[h];
          const text = c ? `${MAP_HOST_LABEL[h]}: ${CELL_LABEL[c.state]}${c.hops.length > 1 ? ` (${c.hops.length} saltos)` : ""}${c.misplaced ? ` — fora do lugar: ${c.misplaced}` : ""}` : `${MAP_HOST_LABEL[h]}: ainda não checado`;
          // Fora do lugar: fundo de aviso com texto na cor da tinta (contraste AA); a borda mantém a cor do resultado.
          const cls = c ? (c.misplaced ? `${TONE[c.state].split(" ")[0]} bg-warning-soft text-foreground` : TONE[c.state]) : "border-dashed border-border text-muted-foreground";
          return (
            <li key={h}>
              {path ? <a href={`${hostUrls[h]}${path}`} target="_blank" rel="noreferrer" title={text} className={`inline-flex h-7 min-w-9 items-center justify-center rounded-md border-2 px-1 text-xs font-bold ${cls}`}><span aria-hidden>{SHORT[h]}{c?.misplaced ? "!" : ""}</span><span className="sr-only">{text} (abre em nova aba)</span></a>
                : <span title={text} className={`inline-flex h-7 min-w-9 items-center justify-center rounded-md border-2 px-1 text-xs font-bold ${cls}`}><span aria-hidden>{SHORT[h]}</span><span className="sr-only">{text}</span></span>}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-1">
        {path ? <a className="ds-btn ds-btn--secondary ds-btn--sm" href={`${hostUrls[home]}${path}`} target="_blank" rel="noreferrer" aria-label={`Abrir ${p.label}`}><ExternalLink /> Abrir</a> : <span className="text-xs text-muted-foreground">precisa de exemplo</span>}
        <button type="button" aria-pressed={p.tested} onClick={() => toggle("tested")} className={`ds-btn ds-btn--sm ${p.tested ? "" : "ds-btn--secondary"}`}>Testada</button>
        <button type="button" aria-pressed={p.approved} onClick={() => toggle("approved")} className={`ds-btn ds-btn--sm ${p.approved ? "" : "ds-btn--secondary"}`}>Aprovada</button>
        <button type="button" aria-pressed={p.problem} onClick={() => toggle("problem")} className={`ds-btn ds-btn--sm ${p.problem ? "ds-btn--danger" : "ds-btn--secondary"}`}>Problema</button>
      </div>
    </li>
  );
}
