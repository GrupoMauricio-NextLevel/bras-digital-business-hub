"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Check, CheckCheck, ChevronLeft, ChevronRight, Copy, ExternalLink, Globe, ImageIcon, RefreshCw, Search, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QA_AREAS, fillRoute, type QaArea } from "@/lib/qualidade/rotas";
import { NEEDS, NEED_LABEL, fileForScreen, gptImagePrompt, imageBrandOf, type ImageRequest, type Need } from "@/lib/qualidade/gpt";
import type { PublicImage } from "@/lib/qualidade/imagens";
import type { BrandCode } from "@/lib/brand";
import type { QaCheckResult } from "@/db/schema";
import { checkDomainsAction, checkPagesAction, markScreenAction, resetScreensAction } from "@/app/actions/qualidade";
import type { OffGroup } from "@/lib/domain/qualidade-desligados";
import { ProntoDesligado } from "./pronto-desligado";
import { MapaVivo } from "./mapa-vivo";
import type { MapCell } from "@/lib/domain/qualidade";
import { MAP_HOSTS, type MapHost, type TreePage } from "@/lib/qualidade/mapa";

type Mark = { tested: boolean; approved: boolean; problem: boolean; note: string | null; sample: string | null; needs: Need[]; imageBrief: string | null; updatedAt: string | null; updatedByName: string | null };
type Screen = { route: string; label: string; areaKey: string; host: BrandCode; params: string[]; mark: Mark; check: QaCheckResult | null };
type Run = { at: string; ok: number; failed: number; byName: string | null } | null;
type Props = { screens: Screen[]; hosts: Record<BrandCode, string>; images: PublicImage[]; pagesRun: Run; domainsRun: (NonNullable<Run> & { results: QaCheckResult[] }) | null; openErrors: number; version: string | null; off: OffGroup[]; map: { cells: MapCell[]; lastAt: string | null } };

type Filter = "todas" | "pendentes" | "testadas" | "aprovadas" | "concluidas" | "problema" | "falta" | "falhou";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" }, { key: "pendentes", label: "Pendentes" }, { key: "testadas", label: "Testadas" }, { key: "aprovadas", label: "Aprovadas" },
  { key: "concluidas", label: "Testadas e aprovadas" }, { key: "problema", label: "Com problema" }, { key: "falta", label: "Falta algo (imagem, texto…)" }, { key: "falhou", label: "Falhou na checagem" },
];
const HOSTS: { key: "auto" | BrandCode; label: string }[] = [{ key: "auto", label: "Automático (pela área)" }, { key: "NEXTLEVEL", label: "Master" }, { key: "NEXTLEVEL_COMMERCE", label: "Commerce" }];
const AREA = Object.fromEntries(QA_AREAS.map((a) => [a.key, a])) as Record<string, QaArea>;
const KPI = "grid min-w-0 content-start gap-1 rounded-xl border border-border bg-surface p-2.5 sm:p-3";
/** Legenda dos números: some no celular para a área de trabalho aparecer logo. */
const HINT = "hidden text-xs text-muted-foreground sm:block";
const GITHUB_ACTIONS = "https://github.com/GrupoMauricio/bras-digital-business-hub/actions";

const pending = (m: Mark) => !m.tested && !m.approved && !m.problem;
function matches(s: Screen, m: Mark, f: Filter) {
  switch (f) {
    case "pendentes": return pending(m);
    case "testadas": return m.tested;
    case "aprovadas": return m.approved;
    case "concluidas": return m.tested && m.approved;
    case "problema": return m.problem;
    case "falta": return m.needs.length > 0;
    case "falhou": return !!s.check && !s.check.ok;
    default: return true;
  }
}
function statusOf(m: Mark): { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" } {
  if (m.problem) return { label: "Com problema", tone: "danger" };
  if (m.tested && m.approved) return { label: "Testada e aprovada", tone: "success" };
  if (m.approved) return { label: "Aprovada", tone: "success" };
  if (m.tested) return { label: "Testada", tone: "info" };
  return { label: "Pendente", tone: "neutral" };
}
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
const pct = (n: number, t: number) => (t ? Math.round((n / t) * 100) : 0);

/** Preferência da tela (área, filtro, aba, domínio) lembrada neste navegador; sem armazenamento, vale só nesta visita. */
const prefListeners = new Set<() => void>();
const prefMemory = new Map<string, string>();
function usePref<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const k = `qa:${key}`;
  const v = React.useSyncExternalStore(
    (cb) => { prefListeners.add(cb); return () => { prefListeners.delete(cb); }; },
    () => { let stored: string | null = null; try { stored = localStorage.getItem(k); } catch { stored = null; } return (stored ?? prefMemory.get(k) ?? initial) as T; },
    () => initial,
  );
  const set = React.useCallback((x: T) => { prefMemory.set(k, x); try { localStorage.setItem(k, x); } catch { /* sem armazenamento */ } prefListeners.forEach((l) => l()); }, [k]);
  return [v, set];
}

/** Barra empilhada: aprovadas, só testadas, com problema e pendentes (o número sempre escrito ao lado). */
function StackBar({ marks, label }: { marks: Mark[]; label: string }) {
  const t = marks.length || 1;
  const done = marks.filter((m) => m.tested && m.approved && !m.problem).length;
  const partial = marks.filter((m) => !m.problem && (m.tested || m.approved) && !(m.tested && m.approved)).length;
  const prob = marks.filter((m) => m.problem).length;
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${label}: ${done} concluídas, ${partial} em andamento, ${prob} com problema, de ${marks.length}`}>
      <span className="bg-success" style={{ width: `${(done / t) * 100}%` }} />
      <span className="bg-info" style={{ width: `${(partial / t) * 100}%` }} />
      <span className="bg-danger" style={{ width: `${(prob / t) * 100}%` }} />
    </div>
  );
}

export function CentralQualidade({ screens, hosts, images, pagesRun, domainsRun, openErrors, version, off, map }: Props) {
  const router = useRouter();
  const [marks, setMarks] = React.useState<Record<string, Mark>>(() => Object.fromEntries(screens.map((s) => [s.route, s.mark])));
  const [area, setArea] = usePref<string>("area", "todas");
  const [filter, setFilter] = usePref<Filter>("filtro", "todas");
  const [hostSel, setHostSel] = usePref<"auto" | BrandCode>("host", "auto");
  const [tab, setTab] = usePref<string>("aba", "telas");
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);

  const all = screens.map((s) => ({ ...s, mark: marks[s.route] ?? s.mark }));
  const inArea = area === "todas" ? all : all.filter((s) => s.areaKey === area);
  const needle = q.trim().toLowerCase();
  const list = inArea.filter((s) => matches(s, s.mark, filter) && (!needle || s.label.toLowerCase().includes(needle) || s.route.toLowerCase().includes(needle)));

  const urlOf = (s: Screen, m: Mark) => {
    const path = fillRoute(s.route, m.sample);
    if (!path) return null;
    return `${hostSel === "auto" ? hosts[s.host] : hosts[hostSel]}${path}`;
  };

  const save = React.useCallback(async (route: string, patch: Partial<Pick<Mark, "tested" | "approved" | "problem" | "note" | "sample" | "needs" | "imageBrief">>) => {
    let prev: Mark | undefined;
    setMarks((cur) => {
      prev = cur[route];
      const base = cur[route]!;
      const next = { ...base, ...patch, updatedAt: new Date().toISOString(), updatedByName: "você" };
      if (patch.approved === true) next.problem = false;
      if (patch.problem === true) next.approved = false;
      return { ...cur, [route]: next };
    });
    const r = await markScreenAction(route, patch);
    if (!r.ok) { setMarks((cur) => (prev ? { ...cur, [route]: prev } : cur)); toast.error(r.error); return false; }
    return true;
  }, []);

  const treePages: TreePage[] = React.useMemo(() => {
    const byRoute = new Map<string, TreePage["cells"]>();
    for (const c of map.cells) byRoute.set(c.route, { ...(byRoute.get(c.route) ?? {}), [c.host]: { state: c.state, misplaced: c.misplaced, hops: c.hops } });
    return all.map((s) => ({ route: s.route, label: s.label, areaKey: s.areaKey, areaLabel: AREA[s.areaKey]?.label ?? s.areaKey, kind: AREA[s.areaKey]?.kind ?? "PUBLICA", tested: s.mark.tested, approved: s.mark.approved, problem: s.mark.problem, cells: byRoute.get(s.route) ?? {} }));
  }, [all, map.cells]);
  const totalMarks = all.map((s) => s.mark);
  const counts = {
    total: all.length,
    tested: totalMarks.filter((m) => m.tested).length,
    approved: totalMarks.filter((m) => m.approved).length,
    problem: totalMarks.filter((m) => m.problem).length,
    done: totalMarks.filter((m) => m.tested && m.approved).length,
  };
  const domainsOk = domainsRun?.results.filter((r) => r.ok).length ?? null;

  const run = async (kind: "dom" | "pag") => {
    setBusy(kind);
    const r = kind === "dom" ? await checkDomainsAction() : await checkPagesAction();
    setBusy(null);
    if (r.ok) { toast.success(`Checagem pronta: ${r.data.ok} certo(s), ${r.data.failed} com falha`); router.refresh(); } else toast.error(r.error);
  };

  return (
    <div className="grid gap-5">
      <section aria-label="Resumo" className="grid grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-6">
        <div className={KPI}><span className="text-xs font-semibold text-muted-foreground">Telas no sistema</span><span className="text-xl font-bold tabular-nums">{counts.total}</span><StackBar marks={totalMarks} label="Todas as telas" /></div>
        <div className={KPI}><span className="text-xs font-semibold text-muted-foreground">Testadas e aprovadas</span><span className="text-xl font-bold tabular-nums">{counts.done} <span className="text-sm font-medium text-muted-foreground">({pct(counts.done, counts.total)}%)</span></span><span className={HINT}>{counts.tested} testadas · {counts.approved} aprovadas</span></div>
        <button type="button" className={`${KPI} text-left hover:bg-surface-hover`} onClick={() => { setTab("telas"); setFilter("problema"); }}><span className="text-xs font-semibold text-muted-foreground">Com problema</span><span className={`text-xl font-bold tabular-nums ${counts.problem ? "text-danger" : ""}`}>{counts.problem}</span><span className={HINT}>clique para ver a lista</span></button>
        <button type="button" className={`${KPI} text-left hover:bg-surface-hover`} onClick={() => setTab("dominios")}><span className="text-xs font-semibold text-muted-foreground">Domínios no ar</span><span className="text-xl font-bold tabular-nums">{domainsOk === null ? "—" : `${domainsOk}/${domainsRun!.results.length}`}</span><span className={HINT}>{domainsRun ? `checado ${when(domainsRun.at)}` : "ainda não checado"}</span></button>
        <button type="button" className={`${KPI} text-left hover:bg-surface-hover`} onClick={() => setTab("checagem")}><span className="text-xs font-semibold text-muted-foreground">Páginas respondendo</span><span className="text-xl font-bold tabular-nums">{pagesRun ? `${pagesRun.ok}/${pagesRun.ok + pagesRun.failed}` : "—"}</span><span className={HINT}>{pagesRun ? `checado ${when(pagesRun.at)}` : "ainda não checado"}</span></button>
        <a className={KPI} href="/master/errors"><span className="text-xs font-semibold text-muted-foreground">Erros em aberto</span><span className={`text-xl font-bold tabular-nums ${openErrors ? "text-danger" : ""}`}>{openErrors}</span><span className={HINT}>versão no ar {version ?? "local"}</span></a>
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Seções da central">
          <TabsTrigger value="telas">Todas as telas</TabsTrigger>
          <TabsTrigger value="foco">Uma por uma</TabsTrigger>
          <TabsTrigger value="falta">O que falta</TabsTrigger>
          <TabsTrigger value="dominios">Domínios</TabsTrigger>
          <TabsTrigger value="checagem">Checagem automática</TabsTrigger>
          <TabsTrigger value="mapa">Mapa vivo</TabsTrigger>
          <TabsTrigger value="desligado">Pronto e desligado</TabsTrigger>
        </TabsList>

        {/* Controles comuns às telas e ao "uma por uma" */}
        {tab === "telas" || tab === "foco" ? (
          <div className="mt-4 grid gap-3">
            {tab === "telas" ? (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Área">
                <AreaChip active={area === "todas"} onClick={() => setArea("todas")} label="Todas as áreas" marks={totalMarks} />
                {QA_AREAS.map((a) => { const ms = all.filter((s) => s.areaKey === a.key).map((s) => s.mark); return ms.length ? <AreaChip key={a.key} active={area === a.key} onClick={() => setArea(a.key)} label={a.label} marks={ms} /> : null; })}
              </div>
            ) : null}
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex min-w-0 basis-full flex-col text-sm font-medium sm:basis-0 sm:flex-1" htmlFor="qa-busca">Procurar
                <span className="relative mt-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input id="qa-busca" className="pl-9" placeholder="nome ou endereço da tela" value={q} onChange={(e) => setQ(e.target.value)} /></span>
              </label>
              {tab === "foco" ? <label className="flex flex-col text-sm font-medium" htmlFor="qa-area">Área<Select id="qa-area" className="mt-1" value={area} onChange={(e) => setArea(e.target.value)}><option value="todas">Todas as áreas ({all.length})</option>{QA_AREAS.map((a) => { const n = all.filter((s) => s.areaKey === a.key); return n.length ? <option key={a.key} value={a.key}>{a.label} ({n.filter((x) => x.mark.tested && x.mark.approved).length}/{n.length})</option> : null; })}</Select></label> : null}
              <label className="flex flex-col text-sm font-medium" htmlFor="qa-filtro">Situação<Select id="qa-filtro" className="mt-1" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>{FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</Select></label>
              <label className="flex flex-col text-sm font-medium" htmlFor="qa-host">Abrir em<Select id="qa-host" className="mt-1" value={hostSel} onChange={(e) => setHostSel(e.target.value as "auto" | BrandCode)}>{HOSTS.map((h) => <option key={h.key} value={h.key}>{h.label}</option>)}</Select></label>
            </div>
            {area !== "todas" ? <p className="text-sm text-muted-foreground"><b className="text-foreground">Como entrar em {AREA[area]?.label}:</b> {AREA[area]?.access}{AREA[area]?.kind === "PAINEL" && !["master", "commerce-admin", "estudio-bras"].includes(area) ? <> <a className="font-medium text-link underline" href="/master/clientes">Abrir Clientes e suporte</a></> : null}</p> : null}
          </div>
        ) : null}

        <TabsContent value="telas">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>{list.length} tela(s) nesta lista</span>
            {list.length ? <Button size="sm" variant="ghost" onClick={async () => { const r = await resetScreensAction(list.map((s) => s.route)); if (r.ok) { setMarks((cur) => { const n = { ...cur }; for (const s of list) n[s.route] = { ...n[s.route]!, tested: false, approved: false, problem: false }; return n; }); toast.success("Lista zerada para uma nova rodada"); } else toast.error(r.error); }}>Zerar esta lista (nova rodada)</Button> : null}
          </div>
          {list.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {list.map((s) => <ScreenRow key={s.route} s={s} showArea={area === "todas"} url={urlOf(s, s.mark)} onSave={save} />)}
            </ul>
          ) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma tela com esse filtro. Troque a área ou a situação.</p>}
        </TabsContent>

        <TabsContent value="foco">
          <Foco list={list} urlOf={urlOf} onSave={save} />
        </TabsContent>

        <TabsContent value="mapa">
          <MapaVivo pages={treePages} lastAt={map.lastAt} hostUrls={Object.fromEntries(MAP_HOSTS.map((h) => [h, hosts[h]])) as Record<MapHost, string>} pathOf={(r) => fillRoute(r, marks[r]?.sample ?? null)} onSave={save} />
        </TabsContent>

        <TabsContent value="desligado">
          <ProntoDesligado groups={off} />
        </TabsContent>

        <TabsContent value="falta">
          <Faltas screens={all} images={images} urlOf={urlOf} />
        </TabsContent>

        <TabsContent value="dominios">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-prose text-sm text-muted-foreground">Abre o endereço de saúde de cada domínio configurado das marcas: mostra se o sistema está no ar, a versão publicada e a última atualização do banco. Marcas em preparação podem aparecer fora do ar.</p>
            <Button onClick={() => run("dom")} loading={busy === "dom"}><Globe /> Checar domínios agora</Button>
          </div>
          {domainsRun ? (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full text-sm">
              <caption className="sr-only">Domínios das marcas</caption>
              <thead><tr className="border-b border-border text-left"><th scope="col" className="p-3">Endereço</th><th scope="col" className="p-3">Situação</th><th scope="col" className="p-3">Detalhe</th><th scope="col" className="p-3 text-right">Tempo</th></tr></thead>
              <tbody>{domainsRun.results.map((r) => (
                <tr key={r.key} className="border-b border-border last:border-0">
                  <th scope="row" className="p-3 text-left font-medium"><a className="text-link underline" href={r.key} target="_blank" rel="noreferrer">{r.key.replace(/^https?:\/\//, "")}</a></th>
                  <td className="p-3"><Badge tone={r.ok ? "success" : "danger"}>{r.ok ? "No ar" : r.status === 200 ? "Não é o sistema" : r.status ? `Erro ${r.status}` : "Fora do ar"}</Badge></td>
                  <td className="p-3 text-muted-foreground">{r.detail}</td>
                  <td className="p-3 text-right tabular-nums">{r.ms} ms</td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Ainda não houve checagem. Clique em “Checar domínios agora”.</p>}
          {domainsRun ? <p className="mt-2 text-xs text-muted-foreground">Última checagem {when(domainsRun.at)}{domainsRun.byName ? ` por ${domainsRun.byName}` : ""}.</p> : null}
        </TabsContent>

        <TabsContent value="checagem">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-prose text-sm text-muted-foreground">Abre cada tela sem login: página pública precisa abrir; painel precisa mandar para a entrada. Telas com parte variável no endereço entram quando você preenche o exemplo. Leva cerca de um minuto.</p>
            <Button onClick={() => run("pag")} loading={busy === "pag"}><RefreshCw /> Checar todas as páginas</Button>
          </div>
          {pagesRun ? (() => {
            const failed = all.filter((s) => s.check && !s.check.ok);
            const skipped = all.filter((s) => !s.check && AREA[s.areaKey]?.kind !== "DEMO");
            return (
              <div className="grid gap-4">
                <p className="text-sm">Última checagem {when(pagesRun.at)}{pagesRun.byName ? ` por ${pagesRun.byName}` : ""}: <b className="text-success">{pagesRun.ok} certas</b>, <b className={pagesRun.failed ? "text-danger" : ""}>{pagesRun.failed} com falha</b>{skipped.length ? `, ${skipped.length} sem exemplo (não checadas)` : ""}.</p>
                {failed.length ? (
                  <ul className="divide-y divide-border rounded-xl border border-danger bg-surface">
                    {failed.map((s) => <li key={s.route} className="grid gap-1 p-3 text-sm"><span className="font-semibold">{s.label} <span className="font-mono text-xs font-normal text-muted-foreground">{s.route}</span></span><span className="text-danger">{s.check!.detail}</span></li>)}
                  </ul>
                ) : <p className="rounded-xl bg-success-soft p-3 text-sm text-success">Nenhuma falha na última checagem.</p>}
              </div>
            );
          })() : <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Ainda não houve checagem. Clique em “Checar todas as páginas”.</p>}
          <div className="mt-5 grid gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
            <b>Outros testes</b>
            <span>Testes do código a cada publicação: <a className="font-medium text-link underline" href={GITHUB_ACTIONS} target="_blank" rel="noreferrer">verificação automática no GitHub</a> (versão no ar: {version ?? "local"}).</span>
            <span>Falhas do servidor e das telas: <a className="font-medium text-link underline" href="/master/errors">Erros do sistema</a> ({openErrors} em aberto).</span>
            <span>Conferência dos dados: <a className="font-medium text-link underline" href="/master/integridade">Integridade dos dados</a>.</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AreaChip({ active, onClick, label, marks }: { active: boolean; onClick: () => void; label: string; marks: Mark[] }) {
  const done = marks.filter((m) => m.tested && m.approved).length;
  const prob = marks.filter((m) => m.problem).length;
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`grid min-w-32 gap-1 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border bg-surface hover:bg-surface-hover"}`}>
      <span className="flex items-center justify-between gap-2 font-semibold">{label}<span className="font-mono text-xs opacity-80">{done}/{marks.length}</span></span>
      <StackBar marks={marks} label={label} />
      {prob ? <span className={`text-xs ${active ? "" : "text-danger"}`}>{prob} com problema</span> : null}
    </button>
  );
}

type SaveFn = (route: string, patch: Partial<Pick<Mark, "tested" | "approved" | "problem" | "note" | "sample" | "needs" | "imageBrief">>) => Promise<boolean>;

function Toggles({ s, onSave, size = "sm" }: { s: Screen; onSave: SaveFn; size?: "sm" | "md" }) {
  const m = s.mark;
  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} variant={m.tested ? "primary" : "secondary"} aria-pressed={m.tested} onClick={() => onSave(s.route, { tested: !m.tested })}><Check /> Testada</Button>
      <Button size={size} variant={m.approved ? "primary" : "secondary"} aria-pressed={m.approved} onClick={() => onSave(s.route, { approved: !m.approved })}><CheckCheck /> Aprovada</Button>
      <Button size={size} variant={m.problem ? "danger" : "secondary"} aria-pressed={m.problem} onClick={() => onSave(s.route, { problem: !m.problem })}><AlertTriangle /> Problema</Button>
    </div>
  );
}

function NoteAndSample({ s, onSave, autoOpen }: { s: Screen; onSave: SaveFn; autoOpen?: boolean }) {
  // Rascunho local; quem usa passa `key={s.route}`, então trocar de tela recomeça do que está gravado.
  const [note, setNote] = React.useState(s.mark.note ?? "");
  const [sample, setSample] = React.useState(s.mark.sample ?? "");
  const id = s.route.replace(/[^a-z0-9]/gi, "-");
  const [brief, setBrief] = React.useState(s.mark.imageBrief ?? "");
  const toggleNeed = (n: Need) => onSave(s.route, { needs: s.mark.needs.includes(n) ? s.mark.needs.filter((x) => x !== n) : [...s.mark.needs, n] });
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2" role="group" aria-label="O que falta nesta tela">
        <span className="text-xs font-medium">O que falta:</span>
        {NEEDS.map((n) => <button key={n} type="button" aria-pressed={s.mark.needs.includes(n)} onClick={() => toggleNeed(n)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${s.mark.needs.includes(n) ? "border-warning bg-warning-soft text-warning" : "border-border bg-surface hover:bg-surface-hover"}`}>{NEED_LABEL[n]}</button>)}
      </div>
      {s.mark.needs.includes("IMAGEM") ? (
        <label className="flex flex-col text-xs font-medium sm:col-span-2" htmlFor={`qa-img-${id}`}>O que a imagem deve mostrar (vira o pedido para o GPT na aba “O que falta”)
          <Textarea id={`qa-img-${id}`} className="mt-1 min-h-14" placeholder="Ex.: mãos embalando um pedido numa bancada, caixa kraft com fita verde" value={brief} onChange={(e) => setBrief(e.target.value)} onBlur={() => brief !== (s.mark.imageBrief ?? "") && onSave(s.route, { imageBrief: brief || null })} />
        </label>
      ) : null}
      {s.params.length ? (
        <label className="flex flex-col text-xs font-medium" htmlFor={`qa-ex-${id}`}>Exemplo para {s.params.map((p) => `[${p}]`).join(" / ")} (ou cole o link inteiro)
          <Input id={`qa-ex-${id}`} className="mt-1" placeholder={s.params.join("/")} value={sample} onChange={(e) => setSample(e.target.value)} onBlur={() => sample !== (s.mark.sample ?? "") && onSave(s.route, { sample: sample || null })} />
        </label>
      ) : null}
      <label className={`flex flex-col text-xs font-medium ${s.params.length ? "" : "sm:col-span-2"}`} htmlFor={`qa-nota-${id}`}>Anotação (o que precisa mudar)
        <Textarea id={`qa-nota-${id}`} className="mt-1 min-h-16" autoFocus={autoOpen} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (s.mark.note ?? "") && onSave(s.route, { note: note || null })} />
      </label>
    </div>
  );
}

function ScreenRow({ s, showArea, url, onSave }: { s: Screen; showArea: boolean; url: string | null; onSave: SaveFn }) {
  const [open, setOpen] = React.useState(false);
  const st = statusOf(s.mark);
  return (
    <li className="grid gap-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold">{s.label}<Badge tone={st.tone}>{st.label}</Badge>{showArea ? <Badge tone="outline">{AREA[s.areaKey]?.label}</Badge> : null}{s.check ? <Badge tone={s.check.ok ? "success" : "danger"}>{s.check.ok ? `respondeu em ${s.check.ms} ms` : "falhou na checagem"}</Badge> : null}{s.mark.needs.map((n) => <Badge key={n} tone="warning">Falta {NEED_LABEL[n].split(" (")[0]!.toLowerCase()}</Badge>)}</span>
          <span className="break-all font-mono text-xs text-muted-foreground">{s.route}</span>
          {s.mark.note && !open ? <span className="flex items-start gap-1 text-sm text-muted-foreground"><StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden />{s.mark.note}</span> : null}
          {s.mark.updatedAt ? <span className="text-xs text-muted-foreground">Marcada {when(s.mark.updatedAt)}{s.mark.updatedByName ? ` por ${s.mark.updatedByName}` : ""}</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {url ? <a className="ds-btn ds-btn--sm" href={url} target="_blank" rel="noreferrer" aria-label={`Abrir ${s.label} em nova aba`}><ExternalLink /> Abrir</a> : <span className="text-xs text-muted-foreground">Preencha o exemplo para abrir</span>}
          <Toggles s={s} onSave={onSave} />
          <Button size="sm" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}><StickyNote /> {s.params.length ? "Exemplo, nota e o que falta" : "Nota e o que falta"}</Button>
        </div>
      </div>
      {open || (s.params.length && !s.mark.sample) ? <NoteAndSample key={s.route} s={s} onSave={onSave} /> : null}
    </li>
  );
}

/** Uma por uma: a tela atual em destaque, com atalhos (T testada, A aprovada e próxima, P problema, setas). */
function Foco({ list, urlOf, onSave }: { list: Screen[]; urlOf: (s: Screen, m: Mark) => string | null; onSave: SaveFn }) {
  const [rawIdx, setIdx] = React.useState(0);
  // A lista muda com os filtros: o índice fica sempre dentro dela.
  const idx = Math.min(rawIdx, Math.max(0, list.length - 1));
  const firstPending = list.findIndex((s) => pending(s.mark));
  const s = list[idx];
  const go = React.useCallback((d: number) => setIdx((i) => Math.max(0, Math.min(list.length - 1, Math.min(i, list.length - 1) + d))), [list.length]);
  const [noteFor, setNoteFor] = React.useState<string | null>(null);
  const noteOpen = !!s && noteFor === s.route;
  const setNoteOpen = (v: boolean) => setNoteFor(v && s ? s.route : null);
  React.useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!s || (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright") { e.preventDefault(); go(1); }
      else if (k === "arrowleft") { e.preventDefault(); go(-1); }
      else if (k === "t") { e.preventDefault(); await onSave(s.route, { tested: !s.mark.tested }); }
      else if (k === "a") { e.preventDefault(); if (await onSave(s.route, { approved: true, tested: true })) go(1); }
      else if (k === "p") { e.preventDefault(); await onSave(s.route, { problem: true }); setNoteFor(s.route); }
      else if (k === "o") { const u = urlOf(s, s.mark); if (u) { e.preventDefault(); window.open(u, "_blank", "noopener"); } }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, go, onSave, urlOf]);
  if (!s) return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma tela com esse filtro.</p>;
  const url = urlOf(s, s.mark);
  const st = statusOf(s.mark);
  const area = AREA[s.areaKey];
  const left = list.filter((x) => pending(x.mark)).length;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="tabular-nums text-muted-foreground">Tela {idx + 1} de {list.length} · {left} pendente(s) nesta lista</span>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => go(-1)} disabled={idx === 0}><ChevronLeft /> Anterior</Button>
          {firstPending >= 0 && firstPending !== idx ? <Button size="sm" variant="secondary" onClick={() => setIdx(firstPending)}>Ir para a primeira pendente</Button> : null}
          <Button size="sm" variant="secondary" onClick={() => go(1)} disabled={idx >= list.length - 1}>Próxima <ChevronRight /></Button>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden><span className="block h-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${((idx + 1) / list.length) * 100}%` }} /></div>
      <article className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="qa-foco-titulo">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="outline">{area?.label}</Badge><Badge tone={st.tone}>{st.label}</Badge>{s.check ? <Badge tone={s.check.ok ? "success" : "danger"}>{s.check.ok ? `respondeu em ${s.check.ms} ms` : "falhou na checagem"}</Badge> : null}</div>
        <div className="grid gap-1">
          <h2 id="qa-foco-titulo" className="text-2xl font-bold">{s.label}</h2>
          <span className="break-all font-mono text-sm text-muted-foreground">{url ?? s.route}</span>
          <p className="text-sm text-muted-foreground"><b className="text-foreground">Como entrar:</b> {area?.access}</p>
          {s.check && !s.check.ok ? <p className="text-sm text-danger">{s.check.detail}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {url ? <a className="ds-btn ds-btn--lg" href={url} target="_blank" rel="noreferrer"><ExternalLink /> Abrir a tela</a> : <span className="text-sm text-muted-foreground">Preencha o exemplo abaixo para abrir esta tela.</span>}
          <Button size="lg" onClick={async () => { if (await onSave(s.route, { approved: true, tested: true })) go(1); }}><CheckCheck /> Testada e aprovada, próxima</Button>
        </div>
        <Toggles s={s} onSave={onSave} size="md" />
        {noteOpen || s.params.length || s.mark.note || s.mark.needs.length ? <NoteAndSample key={s.route} s={s} onSave={onSave} autoOpen={noteOpen} /> : <div><Button size="sm" variant="ghost" onClick={() => setNoteOpen(true)}><StickyNote /> Nota e o que falta</Button></div>}
        {s.mark.updatedAt ? <span className="text-xs text-muted-foreground">Marcada {when(s.mark.updatedAt)}{s.mark.updatedByName ? ` por ${s.mark.updatedByName}` : ""}</span> : null}
      </article>
      <p className="text-xs text-muted-foreground">Atalhos: <kbd>O</kbd> abrir · <kbd>T</kbd> testada · <kbd>A</kbd> aprovar e ir para a próxima · <kbd>P</kbd> problema (abre a anotação) · <kbd>←</kbd> <kbd>→</kbd> navegar.</p>
    </div>
  );
}

/** Texto pronto para copiar (com reserva: se o navegador recusar a cópia, o texto fica selecionado para copiar à mão). */
function CopyBox({ text, label }: { text: string; label: string }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success("Copiado. Cole no GPT."); }
    catch { ref.current?.select(); toast.message("Selecionei o texto: copie com Ctrl+C (ou segure e copie no celular)."); }
  };
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{label}</b><Button size="sm" onClick={copy}><Copy /> Copiar pedido para o GPT</Button></div>
      <Textarea ref={ref} readOnly aria-label={label} className="min-h-40 font-mono text-xs" value={text} />
    </div>
  );
}

/** O que falta: imagens das páginas públicas (sozinho, pelos arquivos) e o que você marcou em cada tela, com o pedido para o GPT. */
function Faltas({ screens, images, urlOf }: { screens: Screen[]; images: PublicImage[]; urlOf: (s: Screen, m: Mark) => string | null }) {
  const missing = images.filter((i) => !i.formats.length);
  const marked = screens.filter((s) => s.mark.needs.length);
  const requests: ImageRequest[] = [
    ...missing.map((i) => ({ file: i.name, brand: i.brand, ratio: i.ratio || "16:9", scene: i.scene ?? i.where, where: i.where })),
    ...marked.filter((s) => s.mark.needs.includes("IMAGEM")).map((s) => { const b = imageBrandOf(s.host); return { file: fileForScreen(s.route, b), brand: b, ratio: "16:9", scene: s.mark.imageBrief || `imagem para a tela “${s.label}” (${AREA[s.areaKey]?.label})`, where: `${s.label} (${s.route})` }; }),
  ];
  const prompt = gptImagePrompt(requests);
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-xl border border-border bg-surface p-4" aria-labelledby="qa-gpt">
        <h2 id="qa-gpt" className="flex items-center gap-2 text-base font-bold"><ImageIcon className="size-4" aria-hidden /> Imagens para gerar no GPT ({requests.length})</h2>
        {requests.length ? (
          <>
            <p className="text-sm text-muted-foreground">Copie o pedido, cole num chat novo do GPT com geração de imagens e salve cada imagem com o nome exato. Depois me mande os arquivos: eu converto, coloco no lugar e a imagem aparece sozinha na página.</p>
            <CopyBox text={prompt} label="Pedido completo" />
          </>
        ) : <p className="text-sm text-success">Nenhuma imagem faltando. Para pedir uma imagem nova, marque “Imagem” na tela e descreva o que ela deve mostrar.</p>}
      </section>

      <section className="grid gap-2" aria-labelledby="qa-pub">
        <h2 id="qa-pub" className="text-base font-bold">Imagens das páginas públicas: {images.length - missing.length} de {images.length} no ar</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full text-sm">
          <caption className="sr-only">Imagens das páginas públicas por marca</caption>
          <thead><tr className="border-b border-border text-left"><th scope="col" className="p-3">Imagem</th><th scope="col" className="p-3">Marca</th><th scope="col" className="p-3">Onde aparece</th><th scope="col" className="p-3">Situação</th></tr></thead>
          <tbody>{[...missing, ...images.filter((i) => i.formats.length)].map((i) => (
            <tr key={`${i.brand}-${i.name}`} className="border-b border-border last:border-0">
              <th scope="row" className="p-3 text-left font-mono text-xs font-medium">{i.name}</th>
              <td className="p-3">{i.brand === "superdrop" ? "SuperDrop" : i.brand === "commerce" ? "Commerce" : "Brás Digital Club"}</td>
              <td className="p-3 text-muted-foreground">{i.where}</td>
              <td className="p-3"><Badge tone={i.formats.length ? "success" : "warning"}>{i.formats.length ? `No ar (${i.formats.join(", ")})` : "Falta"}</Badge></td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>

      <section className="grid gap-3" aria-labelledby="qa-marcadas">
        <h2 id="qa-marcadas" className="text-base font-bold">O que você marcou nas telas ({marked.length})</h2>
        {marked.length ? NEEDS.map((n) => {
          const list = marked.filter((s) => s.mark.needs.includes(n));
          if (!list.length) return null;
          return (
            <div key={n} className="grid gap-1">
              <h3 className="text-sm font-semibold">{NEED_LABEL[n]} ({list.length})</h3>
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                {list.map((s) => { const u = urlOf(s, s.mark); return (
                  <li key={s.route} className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
                    <span className="grid min-w-0 gap-0.5"><b>{s.label}</b><span className="break-all font-mono text-xs text-muted-foreground">{s.route}</span>{n === "IMAGEM" && s.mark.imageBrief ? <span className="text-muted-foreground">Imagem: {s.mark.imageBrief}</span> : null}{s.mark.note ? <span className="text-muted-foreground">Nota: {s.mark.note}</span> : null}</span>
                    {u ? <a className="ds-btn ds-btn--sm ds-btn--secondary" href={u} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a> : null}
                  </li>
                ); })}
              </ul>
            </div>
          );
        }) : <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma tela marcada. Em “Todas as telas” ou “Uma por uma”, abra “Nota e o que falta” e marque Imagem, Texto, Vídeo, Função ou Dados.</p>}
      </section>
    </div>
  );
}
