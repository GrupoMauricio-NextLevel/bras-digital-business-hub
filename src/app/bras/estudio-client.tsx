"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, CalendarClock, Copy, Eye, EyeOff, Lock, LockOpen, Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/app/form-field";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { addBrasVideoAction, moveBrasVideoAction, removeBrasVideoAction, setBrasLevelOverrideAction, setBrasMemberStatusAction, setBrasVideoActiveAction, setBrasVideoPublishAtAction } from "@/app/actions/bras";
import { formatDate } from "@/lib/utils";
import { quando } from "@/lib/bras/quando";
import { formatBRL } from "@/lib/money";
import { BRAS_LEVELS, BRAS_LEVEL_LABEL, BRAS_MOMENT_LABEL, type BrasClientLevel, type BrasMoment } from "@/lib/bras/perfil-perguntas";
import { BRAS_PLAN_LABEL, type BrasMemberPlan } from "@/lib/bras/planos";
import { OfferEditor, type OfferProduct } from "./catalogo-client";

import type { DiscoveryRow } from "./descoberta-editor";
import { DiscoveryEditor } from "./descoberta-editor";

type VideoRow = { id: string; youtubeId: string; title: string; summary: string | null; active: boolean; publishAt: string | null; discovery: DiscoveryRow };

/** Valor para o campo datetime-local no horário de Brasília. */
const paraCampo = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return d.toISOString().slice(0, 16);
};

/** Copia o link curto da descoberta para a descrição do Shorts (D101). */
function CopyLink({ url, title }: { url: string; title: string }) {
  return (
    <Button variant="ghost" size="sm" aria-label={`Copiar link de ${title} para a descrição do Shorts`} onClick={async () => {
      try { await navigator.clipboard.writeText(url); toast.success("Link copiado. Cole na descrição do Shorts."); } catch { toast.message(url); }
    }}><Copy className="size-4" aria-hidden />Copiar link</Button>
  );
}

/** Agenda: escolher dia e hora (Brasília) ou publicar já. A página só mostra a descoberta a partir da hora marcada. */
function Agenda({ v, onRun, pending }: { v: VideoRow; onRun: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; pending: boolean }) {
  const [val, setVal] = React.useState(paraCampo(v.publishAt));
  const id = `agenda-${v.id}`;
  return (
    <div className="flex w-full flex-wrap items-end gap-2 border-t border-border pt-3">
      <FormField label="Publicar em (horário de Brasília)" htmlFor={id} className="min-w-[14rem] flex-1">
        <Input id={id} type="datetime-local" value={val} onChange={(e) => setVal(e.target.value)} />
      </FormField>
      <Button variant="secondary" size="sm" disabled={pending || !val} onClick={() => onRun(() => setBrasVideoPublishAtAction(v.id, `${val}:00-03:00`), "Publicação agendada")}><CalendarClock className="size-4" aria-hidden />Agendar</Button>
      {v.publishAt ? <Button variant="ghost" size="sm" disabled={pending} onClick={() => { setVal(""); onRun(() => setBrasVideoPublishAtAction(v.id, null), "Descoberta publicada"); }}>Publicar agora</Button> : null}
    </div>
  );
}

type OfferRow = { importerId: string; priceBoxCents: number; unitsPerBox: number; boxesAvailable: number | null; productId?: string | null };
type ImporterRow = { id: string; name: string; notes: string | null; active: boolean };

export function VideosManager({ videos, offers, importers, products = [], stats = {}, baseUrl, now }: { videos: VideoRow[]; offers: Record<string, OfferRow>; importers: ImporterRow[]; products?: OfferProduct[]; stats?: Record<string, { signups: number; requests: number }>; baseUrl: string; now: string }) {
  const router = useRouter();
  const [f, setF] = React.useState({ url: "", title: "", summary: "" });
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => {
    const r = await fn();
    if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error ?? "Não deu certo.");
  });
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => { const r = await addBrasVideoAction(f); if (r.ok) setF({ url: "", title: "", summary: "" }); return r; }, "Descoberta adicionada");
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <form onSubmit={add} className="ds-card h-fit space-y-3 p-4" aria-labelledby="novo-video">
        <h2 id="novo-video" className="text-base font-semibold">Nova descoberta</h2>
        <p className="text-sm text-muted-foreground">Comece pelo Shorts de descoberta (público). Depois, na descoberta, coloque o veredito, o trecho e a análise completa. Não coloque preço no título.</p>
        <FormField label="Link do Shorts de descoberta" htmlFor="v-url"><Input id="v-url" required value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://youtube.com/shorts/..." inputMode="url" /></FormField>
        <FormField label="Título" htmlFor="v-title" hint="Até 90 caracteres"><Input id="v-title" required maxLength={90} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Garrafa térmica 1 L, caixa com 24" /></FormField>
        <FormField label="Gancho (opcional)" htmlFor="v-sum" hint="Público. Ex.: Achei no Brás e quase ninguém vende ainda"><Textarea id="v-sum" maxLength={200} rows={3} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></FormField>
        <Button type="submit" loading={pending} className="w-full"><Plus className="size-4" aria-hidden />Adicionar</Button>
      </form>
      {videos.length === 0 ? (
        <EmptyState icon={Video} title="Nenhuma descoberta ainda" description="A página pública mostra as descobertas na ordem desta lista. Enquanto estiver vazia, ela avisa que as primeiras estão sendo gravadas." />
      ) : (
        <ol className="space-y-3" aria-label="Descobertas na ordem da página">
          {videos.map((v, i) => (
            <li key={v.id} className="ds-card flex flex-wrap items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do próprio YouTube */}
              <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" width={120} height={68} loading="lazy" className="h-[68px] w-[120px] shrink-0 rounded-md bg-surface-muted object-cover" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold"><span className="tabular-nums text-muted-foreground">{i + 1}.</span>{v.title}{!v.active ? <Badge>Pausado</Badge> : v.publishAt && v.publishAt > now ? <Badge tone="info">Agendada para {quando(v.publishAt)}</Badge> : <Badge tone="success">Na página</Badge>}</p>
                {v.summary ? <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{v.summary}</p> : null}
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
                  <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noreferrer" className="text-link underline">Abrir no YouTube</a>
                  <span className="text-muted-foreground" aria-label={`Resultado de ${v.title}`}>{stats[v.id]?.signups ?? 0} cadastro(s) · {stats[v.id]?.requests ?? 0} pedido(s)</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <CopyLink url={`${baseUrl}/d/${v.id}`} title={v.title} />
                <Button variant="ghost" size="icon" aria-label={`Subir ${v.title}`} disabled={pending || i === 0} onClick={() => run(() => moveBrasVideoAction(v.id, "up"), "Ordem atualizada")}><ArrowUp className="size-4" aria-hidden /></Button>
                <Button variant="ghost" size="icon" aria-label={`Descer ${v.title}`} disabled={pending || i === videos.length - 1} onClick={() => run(() => moveBrasVideoAction(v.id, "down"), "Ordem atualizada")}><ArrowDown className="size-4" aria-hidden /></Button>
                <Button variant="ghost" size="icon" aria-label={v.active ? `Pausar ${v.title}` : `Mostrar ${v.title}`} disabled={pending} onClick={() => run(() => setBrasVideoActiveAction(v.id, !v.active), v.active ? "Descoberta pausada" : "Descoberta na página")}>{v.active ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</Button>
                <ConfirmDialog destructive title="Remover descoberta?" description="Ela sai da página pública e do Meu Brás, com a análise e a oferta. Os vídeos continuam no YouTube." confirmLabel="Remover"
                  trigger={<Button variant="ghost" size="icon" aria-label={`Remover ${v.title}`} disabled={pending}><Trash2 className="size-4" aria-hidden /></Button>}
                  onConfirm={() => run(() => removeBrasVideoAction(v.id), "Vídeo removido")} />
              </div>
              <Agenda v={v} onRun={run} pending={pending} />
              <DiscoveryEditor videoId={v.id} title={v.title} shortsId={v.youtubeId} d={v.discovery} />
              <OfferEditor videoId={v.id} title={v.title} offer={offers[v.id] ?? null} importers={importers} products={products} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

type MemberRow = { id: string; companyName: string; cnpj: string; name: string; email: string; whatsapp: string; status: "ACTIVE" | "BLOCKED"; blockedReason: string | null; createdAt: string; requests?: number; paidCents?: number; lastRequestAt?: string | null; origin?: string; termsOk?: boolean; lastSeenAt?: string | null;
  /** Classificação (D108): nível final e origem, declarado × comprovado, pontos, momento, plano e respostas do cadastro. */
  level?: { level: BrasClientLevel; source: "AJUSTE" | "DECLARADO" | "COMPROVADO" | "SEM_PERFIL"; declared: BrasClientLevel | null; proven: BrasClientLevel; score: number | null; maxScore: number; moment: BrasMoment; plan: BrasMemberPlan; overrideReason: string | null; answers: { question: string; answer: string }[] };
};
const LEVEL_TONE: Record<BrasClientLevel, "neutral" | "info" | "success" | "warning"> = { INICIANTE: "neutral", CRESCIMENTO: "info", PROFISSIONAL: "success", GRANDE: "warning" };
const SOURCE_LABEL = { AJUSTE: "ajuste da equipe", DECLARADO: "pelas respostas", COMPROVADO: "pelas compras", SEM_PERFIL: "sem respostas" } as const;

/** Nível do cliente com o porquê, as respostas do cadastro e o ajuste manual (motivo obrigatório). */
function LevelCell({ m }: { m: MemberRow }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [lvl, setLvl] = React.useState<string>("");
  const [why, setWhy] = React.useState("");
  const l = m.level;
  if (!l) return null;
  const save = (level: BrasClientLevel | null) => start(async () => {
    const r = await setBrasLevelOverrideAction(m.id, level, why);
    if (r.ok) { toast.success(level ? "Nível ajustado" : "Nível volta a ser automático"); setWhy(""); router.refresh(); } else toast.error(r.error);
  });
  return (
    <div className="space-y-1">
      <Badge tone={LEVEL_TONE[l.level]}>{BRAS_LEVEL_LABEL[l.level]}</Badge>
      <p className="text-xs text-muted-foreground">{SOURCE_LABEL[l.source]}{l.score !== null ? ` · ${l.score} de ${l.maxScore} pts` : ""}</p>
      <p className="text-xs text-muted-foreground">{BRAS_MOMENT_LABEL[l.moment]} · plano {BRAS_PLAN_LABEL[l.plan]}</p>
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-link">Respostas e ajuste</summary>
        <div className="mt-2 w-72 space-y-2">
          {l.answers.length ? <dl className="space-y-1">{l.answers.map((a) => <div key={a.question}><dt className="text-muted-foreground">{a.question}</dt><dd className="font-medium">{a.answer}</dd></div>)}</dl> : <p>Cadastro anterior às perguntas: o membro responde no Meu Brás.</p>}
          <p>Declarado: <b>{l.declared ? BRAS_LEVEL_LABEL[l.declared] : "—"}</b> · Comprovado: <b>{BRAS_LEVEL_LABEL[l.proven]}</b></p>
          {l.source === "AJUSTE" ? <p>Ajuste: {l.overrideReason}</p> : null}
          <label className="block">Ajustar para
            <select className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-1" value={lvl} onChange={(e) => setLvl(e.target.value)}>
              <option value="">Escolha…</option>{BRAS_LEVELS.map((x) => <option key={x} value={x}>{BRAS_LEVEL_LABEL[x]}</option>)}
            </select>
          </label>
          <label className="block">Motivo<input className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-1" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Ex.: compra contêiner fora da plataforma" /></label>
          <div className="flex gap-2">
            <Button size="sm" disabled={pending || !lvl} onClick={() => save(lvl as BrasClientLevel)}>Ajustar</Button>
            {l.source === "AJUSTE" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => save(null)}>Voltar ao automático</Button> : null}
          </div>
        </div>
      </details>
    </div>
  );
}
const FILTROS = [["todos", "Todos"], ["ativos", "Ativos"], ["bloqueados", "Bloqueados"], ["com-pedido", "Com pedido"], ["sem-pedido", "Sem pedido"], ["descoberta", "Vieram de descoberta"], ["GRANDE", "Grande conta"], ["PROFISSIONAL", "Profissional"], ["CRESCIMENTO", "Em crescimento"], ["INICIANTE", "Iniciante"], ["sem-perfil", "Sem respostas"]] as const;
type Filtro = (typeof FILTROS)[number][0];

export function MembersTable({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [q, setQ] = React.useState("");
  const [filtro, setFiltro] = React.useState<Filtro>("todos");
  const setStatus = (m: MemberRow, status: "ACTIVE" | "BLOCKED") => start(async () => {
    const reason = status === "BLOCKED" ? window.prompt(`Motivo do bloqueio de ${m.companyName} (só a equipe vê):`)?.trim() : undefined;
    if (status === "BLOCKED" && !reason) return;
    const r = await setBrasMemberStatusAction(m.id, status, reason);
    if (r.ok) { toast.success(status === "BLOCKED" ? "Membro bloqueado: não vê mais preço e estoque" : "Membro liberado"); router.refresh(); } else toast.error(r.error);
  });
  if (members.length === 0) return <EmptyState icon={Lock} title="Nenhum membro ainda" description="Quem se cadastrar com CNPJ pela página pública aparece aqui na hora, já liberado. Você pode bloquear quem não for lojista." />;
  const t = q.trim().toLowerCase();
  const digits = t.replace(/\D/g, "");
  const passa = (m: MemberRow) => filtro === "todos" || (filtro === "ativos" && m.status === "ACTIVE") || (filtro === "bloqueados" && m.status === "BLOCKED") || (filtro === "com-pedido" && (m.requests ?? 0) > 0) || (filtro === "sem-pedido" && !(m.requests ?? 0)) || (filtro === "descoberta" && m.origin?.startsWith("Descoberta")) || (filtro === "sem-perfil" && m.level?.declared === null) || (m.level?.level === filtro);
  const shown = members.filter(passa).filter((m) => !t || `${m.companyName} ${m.name} ${m.email}`.toLowerCase().includes(t) || (digits.length >= 3 && m.cnpj.replace(/\D/g, "").includes(digits)));
  return (
    <div className="space-y-3">
      <label htmlFor="m-busca" className="sr-only">Buscar membro</label>
      <div className="flex flex-wrap items-center gap-3">
        <Input id="m-busca" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por empresa, nome, e-mail ou CNPJ" className="max-w-md" />
        <a href="/bras/membros/csv" className="ds-btn ds-btn--secondary ds-btn--sm">Exportar CSV</a>
      </div>
      <div role="group" aria-label="Filtrar membros" className="flex flex-wrap gap-2">
        {FILTROS.map(([k, n]) => <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)} className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${filtro === k ? "border-transparent bg-foreground text-surface" : "border-border bg-surface"}`}>{n}</button>)}
      </div>
      <p className="text-xs text-muted-foreground">Dados de contato só para a equipe da Brás Digital: nunca são enviados às importadoras (elas recebem só o endereço de envio de cada pedido).</p>
      <div className="ds-card overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th scope="col" className="p-3">Empresa</th><th scope="col" className="p-3">Contato</th><th scope="col" className="p-3">Nível</th><th scope="col" className="p-3">Cadastro</th><th scope="col" className="p-3">Pedidos</th><th scope="col" className="p-3">Situação</th><th scope="col" className="p-3"><span className="sr-only">Ações</span></th></tr></thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="p-3"><p className="font-semibold">{m.companyName}</p><p className="tabular-nums text-xs text-muted-foreground">{m.cnpj}</p></td>
                <td className="p-3"><p>{m.name}</p><p className="text-xs text-muted-foreground">{m.email} · {m.whatsapp}</p></td>
                <td className="p-3 align-top"><LevelCell m={m} /></td>
                <td className="p-3"><p className="tabular-nums">{formatDate(m.createdAt, { day: "2-digit", month: "short", year: "numeric" })}</p>{m.origin ? <p className="text-xs text-muted-foreground">{m.origin}</p> : null}{m.termsOk === false ? <p className="text-xs text-warning">Termos ainda não aceitos</p> : null}</td>
                <td className="p-3"><p className="tabular-nums">{m.requests ?? 0}</p>{m.paidCents ? <p className="text-xs tabular-nums text-muted-foreground">{formatBRL(m.paidCents)} pagos</p> : null}{m.lastSeenAt ? <p className="text-xs text-muted-foreground">Visto em {formatDate(m.lastSeenAt)}</p> : null}</td>
                <td className="p-3">{m.status === "ACTIVE" ? <Badge tone="success">Ativo</Badge> : <><Badge tone="danger">Bloqueado</Badge>{m.blockedReason ? <p className="mt-1 text-xs text-muted-foreground">{m.blockedReason}</p> : null}</>}</td>
                <td className="p-3 text-right">
                  {m.status === "ACTIVE"
                    ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus(m, "BLOCKED")}><Lock className="size-4" aria-hidden />Bloquear</Button>
                    : <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus(m, "ACTIVE")}><LockOpen className="size-4" aria-hidden />Liberar</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum membro com esse termo.</p> : null}
      </div>
    </div>
  );
}
