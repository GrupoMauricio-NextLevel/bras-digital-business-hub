"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Inbox, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/app/form-field";
import { EmptyState } from "@/components/app/empty-state";
import { MoneyField } from "@/components/finance/fields";
import { addBrasImporterAction, createBalcaoLinkAction, revokeBalcaoLinkAction, removeBrasOfferAction, setBrasDefaultCommissionAction, setBrasImporterActiveAction, setBrasOfferAction, setBrasRequestStatusAction, updateBrasImporterDetailsAction } from "@/app/actions/bras";
import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

type Importer = { id: string; name: string; notes: string | null; active: boolean; pickupAddress?: string | null; commissionBps?: number | null; hasBalcaoLink?: boolean };

/** Link privado do Balcão (D106): aparece uma vez ao gerar; trocar invalida o anterior. Só com BRAS_PANELS ligada. */
function BalcaoLink({ i }: { i: Importer }) {
  const router = useRouter();
  const [url, setUrl] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const gerar = () => start(async () => { const r = await createBalcaoLinkAction(i.id); if (r.ok) { setUrl(`${location.origin.replace("://master.", "://bras.")}${r.data.path}`); router.refresh(); } else toast.error(r.error); });
  const revogar = () => start(async () => { const r = await revokeBalcaoLinkAction(i.id); if (r.ok) { setUrl(null); toast.success("Link do Balcão revogado"); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-2 text-sm">
      <span className="text-muted-foreground">Balcão:</span>
      {url ? <><code className="max-w-full truncate rounded bg-surface-muted px-2 py-1 text-xs">{url}</code><Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(url); toast.success("Link copiado. Mande só para a importadora."); } catch { toast.message(url); } }}>Copiar</Button></> : <span>{i.hasBalcaoLink ? "link ativo" : "sem link"}</span>}
      <Button size="sm" variant="ghost" loading={pending} onClick={gerar} aria-label={`${i.hasBalcaoLink ? "Trocar" : "Gerar"} link do Balcão de ${i.name}`}>{i.hasBalcaoLink ? "Trocar link" : "Gerar link"}</Button>
      {i.hasBalcaoLink ? <Button size="sm" variant="ghost" disabled={pending} onClick={revogar}>Revogar</Button> : null}
    </div>
  );
}

const pct = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;
const lerPct = (v: string) => { const n = Number(v.replace(",", ".")); return v.trim() === "" ? null : Number.isFinite(n) ? n : NaN; };

/** Comissão padrão das importadoras (D102): vale para quem não tem percentual próprio. */
export function DefaultCommission({ bps }: { bps: number }) {
  const router = useRouter();
  const [v, setV] = React.useState((bps / 100).toString().replace(".", ","));
  const [pending, start] = React.useTransition();
  return (
    <form className="ds-card mb-6 flex flex-wrap items-end gap-3 p-4" aria-label="Comissão padrão" onSubmit={(e) => { e.preventDefault(); const n = lerPct(v); if (n === null || Number.isNaN(n)) { toast.error("Informe a comissão em %."); return; } start(async () => { const r = await setBrasDefaultCommissionAction(n); if (r.ok) { toast.success("Comissão padrão salva"); router.refresh(); } else toast.error(r.error); }); }}>
      <FormField label="Comissão padrão (%)" htmlFor="c-padrao" hint="Vale para a importadora sem percentual próprio. Fica congelada em cada pedido quando ele é pago." className="w-56"><Input id="c-padrao" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} /></FormField>
      <Button type="submit" variant="secondary" loading={pending}>Salvar</Button>
      <p className="text-sm text-muted-foreground">Controle manual: o sistema calcula, a cobrança é feita por você. Veja em <Link href="/bras/comissoes" className="font-semibold text-link underline">Comissões</Link>.</p>
    </form>
  );
}

function ImporterDetails({ i, defaultBps }: { i: Importer; defaultBps: number }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ address: i.pickupAddress ?? "", pct: i.commissionBps == null ? "" : (i.commissionBps / 100).toString().replace(".", ",") });
  const [pending, start] = React.useTransition();
  if (!open) return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-sm">
      <span><span className="text-muted-foreground">Retirada:</span> {i.pickupAddress ?? <em className="text-muted-foreground">sem endereço</em>}</span>
      <span><span className="text-muted-foreground">Comissão:</span> {i.commissionBps == null ? `${pct(defaultBps)} (padrão)` : pct(i.commissionBps)}</span>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={`Editar retirada e comissão de ${i.name}`}>Editar</Button>
      <Link href={`/bras/romaneio/${i.id}`} className="font-semibold text-link underline">Romaneio</Link>
    </div>
  );
  return (
    <form className="grid w-full gap-3 border-t border-border pt-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end" aria-label={`Retirada e comissão de ${i.name}`} onSubmit={(e) => {
      e.preventDefault();
      const n = lerPct(f.pct);
      if (Number.isNaN(n)) { toast.error("Comissão inválida."); return; }
      start(async () => { const r = await updateBrasImporterDetailsAction(i.id, { pickupAddress: f.address.trim() || null, commissionPct: n }); if (r.ok) { toast.success("Importadora atualizada"); setOpen(false); router.refresh(); } else toast.error(r.error); });
    }}>
      <FormField label="Endereço de retirada no Brás" htmlFor={`addr-${i.id}`} hint="O membro vê depois do pedido confirmado."><Input id={`addr-${i.id}`} maxLength={200} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Rua Barão de Ladário, 000, loja 00" /></FormField>
      <FormField label="Comissão (%)" htmlFor={`pct-${i.id}`} hint="Vazio = padrão"><Input id={`pct-${i.id}`} inputMode="decimal" value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value })} /></FormField>
      <div className="flex gap-2"><Button type="submit" size="sm" loading={pending}>Salvar</Button><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button></div>
    </form>
  );
}

export function ImportersManager({ importers, defaultBps = 0, balcao = false }: { importers: Importer[]; defaultBps?: number; balcao?: boolean }) {
  const router = useRouter();
  const [f, setF] = React.useState({ name: "", notes: "" });
  const [pending, start] = React.useTransition();
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => { const r = await addBrasImporterAction(f); if (r.ok) { toast.success("Importadora cadastrada"); setF({ name: "", notes: "" }); router.refresh(); } else toast.error(r.error); });
  };
  const toggle = (i: Importer) => start(async () => { const r = await setBrasImporterActiveAction(i.id, !i.active); if (r.ok) router.refresh(); else toast.error(r.error); });
  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <form onSubmit={add} className="ds-card h-fit space-y-3 p-4" aria-labelledby="nova-imp">
        <h2 id="nova-imp" className="text-base font-semibold">Cadastrar importadora</h2>
        <p className="text-sm text-muted-foreground">Só para organizar as ofertas. A importadora não recebe login nem vê os seus membros: quando houver o Balcão, ela verá só os dados de envio dos pedidos.</p>
        <FormField label="Nome" htmlFor="i-name"><Input id="i-name" required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FormField>
        <FormField label="Anotações internas (opcional)" htmlFor="i-notes" hint="Ex.: comissão combinada, contato, endereço da loja no Brás"><Input id="i-notes" maxLength={300} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></FormField>
        <Button type="submit" loading={pending} className="w-full"><Plus className="size-4" aria-hidden />Cadastrar</Button>
      </form>
      {importers.length === 0 ? <EmptyState icon={Building2} title="Nenhuma importadora" description="Cadastre a importadora para ligar preço e caixas aos vídeos." /> : (
        <ul className="space-y-2">
          {importers.map((i) => (
            <li key={i.id} className="ds-card flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1"><p className="flex items-center gap-2 font-semibold"><a href={`/bras/importadoras/${i.id}`} className="underline-offset-2 hover:underline">{i.name}</a>{i.active ? <Badge tone="success">Ativa</Badge> : <Badge>Pausada</Badge>}</p>{i.notes ? <p className="text-sm text-muted-foreground">{i.notes}</p> : null}</div>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => toggle(i)}>{i.active ? "Pausar" : "Reativar"}</Button>
              <a href={`/bras/importadoras/${i.id}`} className="ds-btn ds-btn--sm">Importadora 360</a>
              <ImporterDetails i={i} defaultBps={defaultBps} />
              {balcao ? <BalcaoLink i={i} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Offer = { importerId: string; priceBoxCents: number; unitsPerBox: number; boxesAvailable: number | null; productId?: string | null };
/** Produto de caixa fechada da importadora (D110), para ligar à oferta. */
export type OfferProduct = { id: string; importerId: string; title: string; sku: string; stockBoxes: number; priceBoxCents: number; unitsPerBox: number };

/** Preço da caixa, unidades e caixas disponíveis de um vídeo. Só o membro ativo vê; o público nunca. */
export function OfferEditor({ videoId, title, offer, importers, products = [] }: { videoId: string; title: string; offer: Offer | null; importers: Importer[]; products?: OfferProduct[] }) {
  const router = useRouter();
  const active = importers.filter((i) => i.active || i.id === offer?.importerId);
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ importerId: offer?.importerId ?? active[0]?.id ?? "", priceBoxCents: offer?.priceBoxCents ?? 0, unitsPerBox: offer?.unitsPerBox ?? 0, boxes: offer?.boxesAvailable == null ? "" : String(offer.boxesAvailable), productId: offer?.productId ?? "" });
  const doImp = products.filter((p) => p.importerId === f.importerId);
  const [pending, start] = React.useTransition();
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await setBrasOfferAction(videoId, { importerId: f.importerId, priceBoxCents: f.priceBoxCents, unitsPerBox: f.unitsPerBox, boxesAvailable: f.boxes.trim() === "" ? null : Number(f.boxes), productId: f.productId || null });
      if (r.ok) { toast.success("Oferta salva"); setOpen(false); router.refresh(); } else toast.error(r.error);
    });
  };
  const remove = () => start(async () => { const r = await removeBrasOfferAction(videoId); if (r.ok) { toast.success("Oferta removida"); router.refresh(); } else toast.error(r.error); });
  if (!open) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-2 text-sm">
        <Tag className="size-4 text-muted-foreground" aria-hidden />
        {offer ? <span><b className="tabular-nums">{formatBRL(offer.priceBoxCents)}</b> a caixa · {offer.unitsPerBox} un. · {offer.productId ? `estoque do produto: ${products.find((p) => p.id === offer.productId)?.stockBoxes ?? "?"} caixa(s)` : offer.boxesAvailable == null ? "caixas: consultar" : `${offer.boxesAvailable} caixa(s)`} · {importers.find((i) => i.id === offer.importerId)?.name}</span> : <span className="text-muted-foreground">Sem oferta: o membro vê o vídeo, mas não consegue pedir.</span>}
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={`${offer ? "Editar" : "Definir"} oferta de ${title}`}>{offer ? "Editar oferta" : "Definir oferta"}</Button>
        {offer ? <Button size="sm" variant="ghost" disabled={pending} onClick={remove} aria-label={`Remover oferta de ${title}`}>Remover</Button> : null}
      </div>
    );
  }
  if (!active.length) return <p className="w-full border-t border-border pt-2 text-sm text-muted-foreground">Cadastre uma importadora na aba Importadoras antes de definir a oferta.</p>;
  return (
    <form onSubmit={save} className="grid w-full gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={`Oferta de ${title}`}>
      <FormField label="Importadora" htmlFor={`o-imp-${videoId}`}><Select id={`o-imp-${videoId}`} value={f.importerId} onChange={(e) => setF({ ...f, importerId: e.target.value, productId: "" })}>{active.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></FormField>
      {doImp.length ? <FormField label="Produto da importadora" htmlFor={`o-prod-${videoId}`} hint="Ligado: o membro vê o estoque real e a confirmação baixa as caixas"><Select id={`o-prod-${videoId}`} value={f.productId} onChange={(e) => { const p = doImp.find((x) => x.id === e.target.value); setF({ ...f, productId: e.target.value, ...(p ? { priceBoxCents: p.priceBoxCents, unitsPerBox: p.unitsPerBox } : {}) }); }}><option value="">Sem ligação (caixas à mão)</option>{doImp.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.sku} · {p.stockBoxes} cx</option>)}</Select></FormField> : null}
      <MoneyField key={`price-${f.productId}`} id={`o-price-${videoId}`} label="Preço da caixa" valueCents={f.priceBoxCents} onChange={(v) => setF({ ...f, priceBoxCents: v })} />
      <FormField label="Unidades por caixa" htmlFor={`o-units-${videoId}`}><Input id={`o-units-${videoId}`} type="number" min={1} required value={f.unitsPerBox || ""} onChange={(e) => setF({ ...f, unitsPerBox: Number(e.target.value) })} /></FormField>
      <FormField label="Caixas disponíveis" htmlFor={`o-boxes-${videoId}`} hint="Vazio = consultar a equipe"><Input id={`o-boxes-${videoId}`} type="number" min={0} value={f.boxes} onChange={(e) => setF({ ...f, boxes: e.target.value })} /></FormField>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><Button type="submit" size="sm" loading={pending}>Salvar oferta</Button><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button></div>
    </form>
  );
}

type Status = "NEW" | "CONFIRMED" | "PAID" | "PICKED_UP" | "CANCELED";
export type RequestRow = {
  id: string; number: number; status: Status; createdAt: string; productTitle: string; importerName: string; boxes: number; unitsPerBox: number; priceBoxCents: number; totalCents: number;
  carrier: string; shipName: string; shipAddress: string; shipCity: string; shipState: string; shipZip: string; notes: string | null;
  companyName: string; whatsapp: string; email: string;
};
const LABEL: Record<Status, string> = { NEW: "Recebido", CONFIRMED: "Confirmado", PAID: "Pago", PICKED_UP: "Retirado", CANCELED: "Cancelado" };
const TONE: Record<Status, "info" | "warning" | "success" | "neutral" | "danger"> = { NEW: "info", CONFIRMED: "warning", PAID: "success", PICKED_UP: "neutral", CANCELED: "danger" };
const NEXT: Record<Status, Status[]> = { NEW: ["CONFIRMED", "CANCELED"], CONFIRMED: ["PAID", "CANCELED"], PAID: ["PICKED_UP", "CANCELED"], PICKED_UP: [], CANCELED: [] };
const ACTION: Record<Status, string> = { NEW: "", CONFIRMED: "Confirmar", PAID: "Marcar pago", PICKED_UP: "Marcar retirado", CANCELED: "Cancelar" };

export function RequestsTable({ requests }: { requests: RequestRow[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const move = (r: RequestRow, s: Status) => start(async () => {
    if (s === "CANCELED" && !window.confirm(`Cancelar o pedido ${r.number}?`)) return;
    const x = await setBrasRequestStatusAction(r.id, s);
    if (x.ok) { toast.success(`Pedido ${r.number}: ${LABEL[s]}`); router.refresh(); } else toast.error(x.error);
  });
  if (!requests.length) return <EmptyState icon={Inbox} title="Nenhum pedido ainda" description="Quando um membro pedir caixas pelo Meu Brás, o pedido aparece aqui para você confirmar preço, caixas e pagamento." />;
  const wa = (r: RequestRow) => `https://wa.me/${r.whatsapp.startsWith("55") ? r.whatsapp : `55${r.whatsapp}`}?text=${encodeURIComponent(`Olá! Aqui é da Brás Digital, sobre o pedido ${r.number} (${r.boxes} caixa(s) de ${r.productTitle}).`)}`;
  return (
    <ul className="space-y-3" aria-label="Pedidos de compra">
      {requests.map((r) => (
        <li key={r.id} className="ds-card space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold"><span className="tabular-nums">Pedido {r.number}</span><Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge><span className="text-xs font-normal text-muted-foreground">{formatDateTime(r.createdAt)}</span></p>
              <p className="mt-1">{r.boxes} caixa(s) de <b>{r.productTitle}</b> · {r.unitsPerBox} un./caixa · {r.importerName}</p>
              <p className="tabular-nums text-sm text-muted-foreground">{formatBRL(r.priceBoxCents)} a caixa · total {formatBRL(r.totalCents)} (preço na hora do pedido)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {NEXT[r.status].map((s) => <Button key={s} size="sm" variant={s === "CANCELED" ? "ghost" : "secondary"} disabled={pending} onClick={() => move(r, s)}>{ACTION[s]}</Button>)}
              <a href={wa(r)} target="_blank" rel="noreferrer" className="ds-btn ds-btn--sm">WhatsApp do membro</a>
            </div>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg bg-surface-muted p-3"><p className="text-xs font-semibold uppercase text-muted-foreground">Membro (só a equipe vê)</p><p className="font-medium">{r.companyName}</p><p className="text-muted-foreground">{r.email} · {r.whatsapp}</p>{r.notes ? <p className="mt-1">Obs.: {r.notes}</p> : null}</div>
            <div className="rounded-lg border border-border p-3"><p className="text-xs font-semibold uppercase text-muted-foreground">Envio (o que a importadora pode ver)</p><p className="font-medium">Transportadora: {r.carrier}</p><p>{r.shipName} · {r.shipAddress}, {r.shipCity}/{r.shipState} · CEP {r.shipZip.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</p></div>
          </div>
        </li>
      ))}
    </ul>
  );
}
