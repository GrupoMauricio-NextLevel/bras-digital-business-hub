"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { addCommissionRuleVersionAction, addOfferVersionAction, addPriceVersionAction, refundOrderAction, saveFinanceSettingsAction, saveGatewayRuleAction, setCatalogStatusAction, setPartnerKindAction, updateCatalogProductAction, updateDeliveryAction, updateQuoteAction, reconcileAction, saveJourneyConfigAction } from "@/app/actions/financeiro";
import { parseBRLToCents } from "@/lib/money";
import { fixarNivelAction } from "@/app/actions/partners";

type R = { ok: true; data?: unknown } | { ok: false; error: string };
function useRun() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const run = async (fn: () => Promise<R>, ok: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); return true; } toast.error(r.error); return false; };
  return { busy, run };
}

function PasswordField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return <FormField label="Sua senha (confirmação)" htmlFor={id} hint="Operação sensível: confirme com a senha do Master."><Input id={id} type="password" autoComplete="current-password" value={value} onChange={(e) => onChange(e.target.value)} /></FormField>;
}

/** Publicar, pausar ou arquivar (sem afetar quem já comprou). */
export function StatusControl({ productId, status }: { productId: string; status: string }) {
  const { busy, run } = useRun();
  const [next, setNext] = React.useState(status);
  const [reason, setReason] = React.useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <FormField label="Situação" htmlFor={`st-${productId}`}><Select id={`st-${productId}`} value={next} onChange={(e) => setNext(e.target.value)}><option value="DRAFT">Rascunho</option><option value="PUBLISHED">Publicado</option><option value="PAUSED">Pausado</option><option value="ARCHIVED">Arquivado</option></Select></FormField>
      <FormField label="Motivo" htmlFor={`rs-${productId}`}><Input id={`rs-${productId}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: fila de entregas cheia" /></FormField>
      <Button size="sm" variant="secondary" loading={busy} disabled={next === status || reason.trim().length < 3} onClick={() => run(() => setCatalogStatusAction(productId, next as never, reason), "Situação atualizada. Compras já feitas não mudam.")}>Aplicar</Button>
    </div>
  );
}

/** Nova versão de preço (a anterior fica guardada e os pedidos antigos mantêm o preço deles). */
export function PriceVersionForm({ productId, defaults }: { productId: string; defaults: { cycle: string; amountCents: number | null; pixDiscountBps: number; cardMaxInstallments: number; cardMarkupBps: number; platformFeeBps: number | null; methods: string[] } }) {
  const { busy, run } = useRun();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ cycle: defaults.cycle, amount: defaults.amountCents === null ? "" : (defaults.amountCents / 100).toFixed(2).replace(".", ","), pix: String(defaults.pixDiscountBps / 100), inst: String(defaults.cardMaxInstallments), markup: String(defaults.cardMarkupBps / 100), fee: defaults.platformFeeBps === null ? "" : String(defaults.platformFeeBps / 100), reason: "", password: "" });
  const bps = (v: string) => Math.round(Number(v.replace(",", ".")) * 100) || 0;
  const submit = async () => {
    const ok = await run(() => addPriceVersionAction(productId, { cycle: f.cycle as never, amountCents: f.cycle === "QUOTE" ? null : parseBRLToCents(f.amount), pixDiscountBps: bps(f.pix), cardMaxInstallments: Number(f.inst) || 1, cardMarkupBps: bps(f.markup), platformFeeBps: f.fee === "" ? null : bps(f.fee), methods: defaults.methods as never, reason: f.reason }, f.password), "Nova versão de preço criada");
    if (ok) setOpen(false);
  };
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Nova versão de preço</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Nova versão de preço" description="A versão atual continua guardada. Pedidos e assinaturas já feitos mantêm o preço que tinham.">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Ciclo" htmlFor="pv-cycle"><Select id="pv-cycle" value={f.cycle} onChange={(e) => setF({ ...f, cycle: e.target.value })}><option value="ONE_TIME">Compra única</option><option value="MONTHLY">Mensal</option><option value="ANNUAL">Anual</option><option value="QUOTE">Sob consulta</option></Select></FormField>
            <FormField label="Preço-base (R$)" htmlFor="pv-amount"><Input id="pv-amount" inputMode="decimal" disabled={f.cycle === "QUOTE"} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></FormField>
            <FormField label="Desconto no Pix (%)" htmlFor="pv-pix"><Input id="pv-pix" inputMode="decimal" value={f.pix} onChange={(e) => setF({ ...f, pix: e.target.value })} /></FormField>
            <FormField label="Parcelas no cartão (máx.)" htmlFor="pv-inst"><Input id="pv-inst" inputMode="numeric" value={f.inst} onChange={(e) => setF({ ...f, inst: e.target.value })} /></FormField>
            <FormField label="Acréscimo do cartão (%)" htmlFor="pv-markup" hint="16 = preço-base × 1,16"><Input id="pv-markup" inputMode="decimal" value={f.markup} onChange={(e) => setF({ ...f, markup: e.target.value })} /></FormField>
            <FormField label="Taxa de plataforma (%)" htmlFor="pv-fee" hint="Só planos Commerce"><Input id="pv-fee" inputMode="decimal" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} /></FormField>
          </div>
          <FormField label="Motivo da mudança" htmlFor="pv-reason" className="mt-3"><Input id="pv-reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></FormField>
          <div className="mt-3"><PasswordField id="pv-pass" value={f.password} onChange={(v) => setF({ ...f, password: v })} /></div>
          <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={busy} disabled={f.reason.trim().length < 5 || !f.password} onClick={submit}>Criar versão</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Textos, fase, bloqueio, gateway e limites do produto (não mexe no preço). */
export function ProductEditForm({ product }: { product: { id: string; name: string; tagline: string; summary: string; phase: string; lockMode: string; gateway: string | null; partnerDiscountMaxBps: number; commissionHoldDays: number; deliveryDays: number | null; prerequisites: string[] } }) {
  const { busy, run } = useRun();
  const [f, setF] = React.useState({ ...product, gateway: product.gateway ?? "", prerequisites: product.prerequisites.join(", "), deliveryDays: product.deliveryDays === null ? "" : String(product.deliveryDays) });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField label="Nome" htmlFor="pe-name"><Input id="pe-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FormField>
      <FormField label="Frase curta" htmlFor="pe-tag"><Input id="pe-tag" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></FormField>
      <FormField label="Resumo" htmlFor="pe-sum" className="sm:col-span-2"><Textarea id="pe-sum" rows={3} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></FormField>
      <FormField label="Fase da jornada" htmlFor="pe-phase"><Select id="pe-phase" value={f.phase} onChange={(e) => setF({ ...f, phase: e.target.value })}><option value="FUNDACAO">Fundação</option><option value="LANCAMENTO">Lançamento</option><option value="AQUISICAO">Aquisição</option><option value="OTIMIZACAO">Otimização</option><option value="ESCALA">Escala</option></Select></FormField>
      <FormField label="Pré-requisito" htmlFor="pe-lock" hint="Obrigatório bloqueia a compra (o card continua visível)"><Select id="pe-lock" value={f.lockMode} onChange={(e) => setF({ ...f, lockMode: e.target.value })}><option value="RECOMMENDED">Só recomendação</option><option value="HARD">Obrigatório</option></Select></FormField>
      <FormField label="Pré-requisitos (chaves)" htmlFor="pe-pre" hint="Ex.: STORE_PUBLISHED, FIRST_SALE, PRODUCT:COMMERCE_START"><Input id="pe-pre" value={f.prerequisites} onChange={(e) => setF({ ...f, prerequisites: e.target.value })} /></FormField>
      <FormField label="Gateway" htmlFor="pe-gw" hint="Vazio = regra global (Mercado Pago)"><Select id="pe-gw" value={f.gateway} onChange={(e) => setF({ ...f, gateway: e.target.value })}><option value="">Regra global</option><option value="MERCADOPAGO">Mercado Pago</option><option value="PAGARME">Pagar.me</option></Select></FormField>
      <FormField label="Desconto máx. do parceiro (%)" htmlFor="pe-pd"><Input id="pe-pd" inputMode="decimal" value={String(f.partnerDiscountMaxBps / 100)} onChange={(e) => setF({ ...f, partnerDiscountMaxBps: Math.round(Number(e.target.value.replace(",", ".")) * 100) || 0 })} /></FormField>
      <FormField label="Carência da comissão (dias)" htmlFor="pe-hold"><Input id="pe-hold" inputMode="numeric" value={String(f.commissionHoldDays)} onChange={(e) => setF({ ...f, commissionHoldDays: Number(e.target.value) || 0 })} /></FormField>
      <FormField label="Prazo de entrega (dias)" htmlFor="pe-days"><Input id="pe-days" inputMode="numeric" value={f.deliveryDays} onChange={(e) => setF({ ...f, deliveryDays: e.target.value })} /></FormField>
      <div className="sm:col-span-2 flex justify-end"><Button loading={busy} onClick={() => run(() => updateCatalogProductAction(product.id, { name: f.name, tagline: f.tagline, summary: f.summary, phase: f.phase as never, lockMode: f.lockMode as never, gateway: (f.gateway || null) as never, partnerDiscountMaxBps: f.partnerDiscountMaxBps, commissionHoldDays: f.commissionHoldDays, deliveryDays: f.deliveryDays === "" ? null : Number(f.deliveryDays), prerequisites: f.prerequisites.split(",").map((x) => x.trim()).filter(Boolean) }), "Produto atualizado")}>Salvar produto</Button></div>
    </div>
  );
}

export function OfferVersionForm({ offerKey, rules }: { offerKey: string; rules: { trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number } }) {
  const { busy, run } = useRun();
  const [f, setF] = React.useState({ status: "ACTIVE", trial: String(rules.trialDays), first: rules.firstPeriodCents === null ? "" : (rules.firstPeriodCents / 100).toFixed(2).replace(".", ","), holiday: String(rules.feeHolidayMonths), reason: "", password: "" });
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FormField label="Situação" htmlFor="of-st"><Select id="of-st" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="ACTIVE">Ativa</option><option value="PAUSED">Pausada</option></Select></FormField>
      <FormField label="Dias de teste" htmlFor="of-trial"><Input id="of-trial" inputMode="numeric" value={f.trial} onChange={(e) => setF({ ...f, trial: e.target.value })} /></FormField>
      <FormField label="1º mês (R$)" htmlFor="of-first"><Input id="of-first" inputMode="decimal" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} /></FormField>
      <FormField label="Meses sem taxa" htmlFor="of-hol"><Input id="of-hol" inputMode="numeric" value={f.holiday} onChange={(e) => setF({ ...f, holiday: e.target.value })} /></FormField>
      <FormField label="Motivo" htmlFor="of-reason" className="sm:col-span-2"><Input id="of-reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></FormField>
      <div className="sm:col-span-2"><PasswordField id="of-pass" value={f.password} onChange={(v) => setF({ ...f, password: v })} /></div>
      <div className="flex items-end"><Button loading={busy} disabled={f.reason.trim().length < 5 || !f.password} onClick={() => run(() => addOfferVersionAction(offerKey, { status: f.status as never, trialDays: Number(f.trial) || 0, firstPeriodCents: f.first === "" ? null : parseBRLToCents(f.first), feeHolidayMonths: Number(f.holiday) || 0, reason: f.reason }, f.password), "Nova versão da oferta criada")}>Criar versão</Button></div>
    </div>
  );
}

export function RuleVersionForm({ ruleKey, rule }: { ruleKey: string; rule: { firstBps: number; recurringBps: number; recurringMonths: number; holdDays: number; benefit: string; active: boolean } }) {
  const { busy, run } = useRun();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ first: String(rule.firstBps / 100), rec: String(rule.recurringBps / 100), months: String(rule.recurringMonths), hold: String(rule.holdDays), benefit: rule.benefit, active: rule.active, reason: "", password: "" });
  const bps = (v: string) => Math.round(Number(v.replace(",", ".")) * 100) || 0;
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Nova versão</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`Regra ${ruleKey}`} description="Comissões já lançadas não mudam; a nova versão vale para as próximas vendas.">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="1º pagamento (%)" htmlFor="rv-f"><Input id="rv-f" inputMode="decimal" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} /></FormField>
            <FormField label="Recorrente (%)" htmlFor="rv-r"><Input id="rv-r" inputMode="decimal" value={f.rec} onChange={(e) => setF({ ...f, rec: e.target.value })} /></FormField>
            <FormField label="Meses de recorrência" htmlFor="rv-m"><Input id="rv-m" inputMode="numeric" value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })} /></FormField>
            <FormField label="Carência (dias)" htmlFor="rv-h"><Input id="rv-h" inputMode="numeric" value={f.hold} onChange={(e) => setF({ ...f, hold: e.target.value })} /></FormField>
            <FormField label="Benefício ao cliente" htmlFor="rv-b" className="sm:col-span-2"><Input id="rv-b" value={f.benefit} onChange={(e) => setF({ ...f, benefit: e.target.value })} /></FormField>
            <FormField label="Situação" htmlFor="rv-a"><Select id="rv-a" value={f.active ? "1" : "0"} onChange={(e) => setF({ ...f, active: e.target.value === "1" })}><option value="1">Ativa</option><option value="0">Desativada</option></Select></FormField>
            <FormField label="Motivo" htmlFor="rv-reason"><Input id="rv-reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></FormField>
          </div>
          <div className="mt-3"><PasswordField id="rv-pass" value={f.password} onChange={(v) => setF({ ...f, password: v })} /></div>
          <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={busy} disabled={f.reason.trim().length < 5 || !f.password} onClick={async () => { if (await run(() => addCommissionRuleVersionAction(ruleKey, { firstBps: bps(f.first), recurringBps: bps(f.rec), recurringMonths: Number(f.months) || 0, holdDays: Number(f.hold) || 0, benefit: f.benefit, active: f.active, reason: f.reason }, f.password), "Regra atualizada")) setOpen(false); }}>Criar versão</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TaxSettingForm({ taxBps }: { taxBps: number }) {
  const { busy, run } = useRun();
  const [v, setV] = React.useState(String(taxBps / 100)); const [p, setP] = React.useState("");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <FormField label="Imposto descontado da base de comissão (%)" htmlFor="tax"><Input id="tax" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} /></FormField>
      <PasswordField id="tax-pass" value={p} onChange={setP} />
      <Button size="sm" loading={busy} disabled={!p} onClick={() => run(() => saveFinanceSettingsAction(Math.round(Number(v.replace(",", ".")) * 100) || 0, p), "Imposto atualizado")}>Salvar</Button>
    </div>
  );
}

export function GatewayRuleForm({ current }: { current: "MERCADOPAGO" | "PAGARME" }) {
  const { busy, run } = useRun();
  const [g, setG] = React.useState(current); const [p, setP] = React.useState("");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <FormField label="Gateway padrão para novas cobranças" htmlFor="gw"><Select id="gw" value={g} onChange={(e) => setG(e.target.value as never)}><option value="MERCADOPAGO">Mercado Pago (recomendado)</option><option value="PAGARME">Pagar.me</option></Select></FormField>
      <PasswordField id="gw-pass" value={p} onChange={setP} />
      <Button size="sm" loading={busy} disabled={!p || g === current} onClick={() => run(() => saveGatewayRuleAction(g, p), "Regra de gateway salva")}>Salvar</Button>
    </div>
  );
}

export function ReconcileButton() {
  const { busy, run } = useRun();
  return <Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => reconcileAction(), "Conciliação concluída")}>Conciliar agora</Button>;
}

export function RefundButton({ orderId, label }: { orderId: string; label: string }) {
  const { busy, run } = useRun();
  const [open, setOpen] = React.useState(false); const [p, setP] = React.useState(""); const [reason, setReason] = React.useState("");
  return (
    <>
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>Reembolsar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`Reembolsar ${label}`} description="O reembolso é pedido ao gateway; o acesso e a comissão são revogados quando o gateway confirma.">
          <FormField label="Motivo" htmlFor="rf-reason"><Input id="rf-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>
          <div className="mt-3"><PasswordField id="rf-pass" value={p} onChange={setP} /></div>
          <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button variant="danger" loading={busy} disabled={!p || reason.trim().length < 5} onClick={async () => { if (await run(() => refundOrderAction(orderId, p, reason), "Reembolso solicitado")) setOpen(false); }}>Confirmar reembolso</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function QuoteEditor({ quote }: { quote: { id: string; status: string; items: { description: string; amountCents: number }[]; discountCents: number; terms: string | null; validUntil: string | null } }) {
  const { busy, run } = useRun();
  const [lines, setLines] = React.useState(quote.items.length ? quote.items.map((i) => `${i.description} | ${(i.amountCents / 100).toFixed(2).replace(".", ",")}`).join("\n") : "");
  const [discount, setDiscount] = React.useState((quote.discountCents / 100).toFixed(2).replace(".", ","));
  const [terms, setTerms] = React.useState(quote.terms ?? "");
  const [status, setStatus] = React.useState(quote.status);
  const items = lines.split("\n").map((l) => l.split("|")).filter((p) => p.length === 2 && p[0]!.trim()).map(([d, v]) => ({ description: d!.trim(), amountCents: parseBRLToCents(v!) }));
  return (
    <div className="grid gap-2">
      <FormField label="Itens (um por linha: descrição | valor)" htmlFor={`qi-${quote.id}`}><Textarea id={`qi-${quote.id}`} rows={3} value={lines} onChange={(e) => setLines(e.target.value)} placeholder="Implantação White Label | 25.000,00" /></FormField>
      <div className="grid gap-2 sm:grid-cols-3">
        <FormField label="Desconto (R$)" htmlFor={`qd-${quote.id}`}><Input id={`qd-${quote.id}`} inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} /></FormField>
        <FormField label="Situação" htmlFor={`qs-${quote.id}`}><Select id={`qs-${quote.id}`} value={status} onChange={(e) => setStatus(e.target.value)}>{["REQUESTED", "DRAFTING", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"].map((s) => <option key={s} value={s}>{({ REQUESTED: "Pedida", DRAFTING: "Em elaboração", SENT: "Enviada", ACCEPTED: "Aceita", REJECTED: "Recusada", EXPIRED: "Vencida", CONVERTED: "Virou pedido" } as Record<string, string>)[s]}</option>)}</Select></FormField>
        <FormField label="Termos" htmlFor={`qt-${quote.id}`}><Input id={`qt-${quote.id}`} value={terms} onChange={(e) => setTerms(e.target.value)} /></FormField>
      </div>
      <div className="flex justify-end"><Button size="sm" loading={busy} onClick={() => run(() => updateQuoteAction(quote.id, { items, discountCents: parseBRLToCents(discount), terms, status: status as never, validUntil: status === "SENT" && !quote.validUntil ? new Date(Date.now() + 15 * 86_400_000).toISOString() : undefined }), "Proposta atualizada")}>Salvar proposta</Button></div>
    </div>
  );
}

export function DeliveryControl({ id, status, checklist }: { id: string; status: string; checklist: { label: string; done: boolean }[] }) {
  const { busy, run } = useRun();
  const [items, setItems] = React.useState(checklist);
  const [st, setSt] = React.useState(status);
  return (
    <div className="grid gap-2">
      <ul className="space-y-1 text-sm">{items.map((c, i) => <li key={c.label}><label className="flex items-start gap-2"><input type="checkbox" checked={c.done} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))} /> <span>{c.label}</span></label></li>)}</ul>
      <div className="flex flex-wrap items-end gap-2">
        <FormField label="Situação" htmlFor={`dl-${id}`}><Select id={`dl-${id}`} value={st} onChange={(e) => setSt(e.target.value)}><option value="WAITING_BRIEFING">Aguardando material</option><option value="IN_PROGRESS">Em execução</option><option value="REVIEW">Em revisão</option><option value="DELIVERED">Entregue (aguarda aceite)</option><option value="CANCELED">Cancelada</option></Select></FormField>
        <Button size="sm" loading={busy} onClick={() => run(() => updateDeliveryAction(id, { status: st as never, checklist: items }), "Entrega atualizada")}>Salvar</Button>
      </div>
    </div>
  );
}

export function PartnerKindControl({ partnerId, kind }: { partnerId: string; kind: string }) {
  const { busy, run } = useRun();
  const [k, setK] = React.useState(kind); const [reason, setReason] = React.useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <FormField label="Tipo" htmlFor={`pk-${partnerId}`}><Select id={`pk-${partnerId}`} value={k} onChange={(e) => setK(e.target.value)}><option value="AFFILIATE">Influenciador</option><option value="REPRESENTATIVE">Representante</option><option value="AGENCY">Agência</option><option value="AGENCY_ELITE">Agência Elite</option><option value="WHITE_LABEL">White Label</option></Select></FormField>
      <FormField label="Motivo" htmlFor={`pkr-${partnerId}`}><Input id={`pkr-${partnerId}`} value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>
      <Button size="sm" variant="secondary" loading={busy} disabled={k === kind || reason.trim().length < 3} onClick={() => run(() => setPartnerKindAction(partnerId, k as never, reason), "Tipo do parceiro atualizado")}>Aplicar</Button>
    </div>
  );
}

/** D249: fixa o nível do parceiro (com motivo) ou volta ao cálculo mensal. */
export function PartnerTierControl({ partnerId, tier, travado }: { partnerId: string; tier: string; travado: boolean }) {
  const { busy, run } = useRun();
  const [t, setT] = React.useState(tier); const [motivo, setMotivo] = React.useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <FormField label="Nível" htmlFor={`pt-${partnerId}`}><Select id={`pt-${partnerId}`} value={t} onChange={(e) => setT(e.target.value)}><option value="INICIAL">Inicial</option><option value="PRATA">Prata</option><option value="OURO">Ouro</option><option value="DIAMANTE">Diamante</option></Select></FormField>
      <FormField label="Motivo" htmlFor={`ptr-${partnerId}`}><Input id={`ptr-${partnerId}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: parceira estratégica da Black" /></FormField>
      <Button size="sm" variant="secondary" loading={busy} disabled={motivo.trim().length < 5} onClick={() => run(() => fixarNivelAction(partnerId, t as never, motivo), "Nível fixado")}>Fixar nível</Button>
      {travado ? <Button size="sm" variant="ghost" loading={busy} onClick={() => run(() => fixarNivelAction(partnerId, null, ""), "Nível volta ao cálculo mensal")}>Voltar ao cálculo</Button> : null}
    </div>
  );
}

export function JourneyEditor({ config }: { config: { phases: { key: string; name: string; goal: string; explanation: string; milestones: string[] }[]; earlyAccess: { planKeys: string[]; partnerKinds: string[] } } }) {
  const { busy, run } = useRun();
  const [c, setC] = React.useState(config);
  const set = (i: number, patch: Partial<(typeof config.phases)[number]>) => setC({ ...c, phases: c.phases.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <div className="space-y-4">
      {c.phases.map((p, i) => (
        <fieldset key={p.key} className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">{i + 1}. {p.key}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nome" htmlFor={`jn-${p.key}`}><Input id={`jn-${p.key}`} value={p.name} onChange={(e) => set(i, { name: e.target.value })} /></FormField>
            <FormField label="Objetivo" htmlFor={`jg-${p.key}`}><Input id={`jg-${p.key}`} value={p.goal} onChange={(e) => set(i, { goal: e.target.value })} /></FormField>
            <FormField label="Como contribui para vender" htmlFor={`je-${p.key}`} className="sm:col-span-2"><Textarea id={`je-${p.key}`} rows={2} value={p.explanation} onChange={(e) => set(i, { explanation: e.target.value })} /></FormField>
            <FormField label="Marcos (chaves)" htmlFor={`jm-${p.key}`} className="sm:col-span-2"><Input id={`jm-${p.key}`} value={p.milestones.join(", ")} onChange={(e) => set(i, { milestones: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></FormField>
          </div>
        </fieldset>
      ))}
      <FormField label="Planos que antecipam acesso a produtos bloqueados" htmlFor="je-plans"><Input id="je-plans" value={c.earlyAccess.planKeys.join(", ")} onChange={(e) => setC({ ...c, earlyAccess: { ...c.earlyAccess, planKeys: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } })} /></FormField>
      <div className="flex justify-end"><Button loading={busy} onClick={() => run(() => saveJourneyConfigAction(c), "Jornada salva")}>Salvar jornada</Button></div>
    </div>
  );
}
