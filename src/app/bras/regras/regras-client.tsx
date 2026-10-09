"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IntField, MoneyField, PercentField } from "@/components/finance/fields";
import { saveBrasClassificationAction, saveBrasLegalAction, saveBrasRulesAction } from "@/app/actions/bras";
import { BRAS_MEMBER_PLANS, BRAS_PLAN_LABEL, BRAS_SUPPORT_CHANNELS, BRAS_SUPPORT_LABEL, type BrasMemberPlan, type BrasSupportChannel } from "@/lib/bras/planos";
import { BRAS_LEVELS, BRAS_LEVEL_LABEL, BRAS_PROFILE_QUESTIONS, type BrasClientLevel } from "@/lib/bras/perfil-perguntas";
import { brasCubageQuote, type CubageRules } from "@/lib/bras/cubagem";
import { formatBRL } from "@/lib/money";

type PlanMin = BrasMemberPlan;
type Rules = {
  preorder: { depositPct: number; delayRefundDays: number; balanceDueDays: number; minPlan: PlanMin };
  quotes: { catalogDays: number; offCatalogDays: number; offCatalogMaxItems: number; offCatalogLateRefundPct: number; minPlan: PlanMin };
  shared: { closeDays: number; extensionDays: number; maxExtensions: number; minFillPct: number; minPlan: PlanMin };
  cubage: CubageRules;
  carriers: { commissionBps: { GRATIS: number; PRO: number; PREMIUM: number }; freeLoadsPerMonth: number; earlyAccessMinutes: number };
  stock: { freshnessHours: number; blingSyncMinutes: number };
  freePlan: { trendsVisible: number; openRequestsMax: number };
  support: { channels: Record<BrasMemberPlan, BrasSupportChannel[]>; agendaPerMonth: Record<BrasMemberPlan, number>; largeAccountWhatsapp: boolean; chatReplyHours: number; faq: { q: string; a: string }[] };
};
type Group = keyof Rules;

function useSave() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => start(async () => {
    const r = await fn();
    if (r.ok) { toast.success(okMsg); router.refresh(); } else toast.error(r.error ?? "Não foi possível gravar.");
  });
  return { pending, run };
}

function GroupCard({ title, description, children, onSave, pending, id }: { title: string; description: string; children: React.ReactNode; onSave: () => void; pending: boolean; id: string }) {
  return (
    <form className="ds-card space-y-4 p-4" aria-labelledby={id} onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div><h2 id={id} className="text-base font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>
      {children}
      <Button type="submit" loading={pending}>Gravar</Button>
    </form>
  );
}

function PlanSelect({ id, label, value, onChange }: { id: string; label: string; value: PlanMin; onChange: (v: PlanMin) => void }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as PlanMin)}>{BRAS_MEMBER_PLANS.map((p) => <option key={p} value={p}>{BRAS_PLAN_LABEL[p]}</option>)}</Select>
    </div>
  );
}

/** Editor das regras da Brás v2 por grupo (cada grupo grava sozinho e sobe a versão). */
export function RulesEditor({ rules, only }: { rules: Rules; only: "rules" | "support" }) {
  const [r, setR] = React.useState(rules);
  const { pending, run } = useSave();
  const set = <G extends Group>(g: G, patch: Partial<Rules[G]>) => setR((x) => ({ ...x, [g]: { ...x[g], ...patch } }));
  const save = (g: Group, label: string) => run(() => saveBrasRulesAction({ [g]: r[g] }), `${label}: regra gravada`);
  const grid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";
  if (only === "support") {
    const s = r.support;
    const toggle = (p: BrasMemberPlan, c: BrasSupportChannel) => set("support", { channels: { ...s.channels, [p]: s.channels[p].includes(c) ? s.channels[p].filter((x) => x !== c) : [...s.channels[p], c] } });
    return (
      <div className="space-y-6">
        <GroupCard id="g-sup" title="Suporte por plano" description="Decisão do dono: grátis = perguntas frequentes; Prata = chat e WhatsApp; Ouro e Platinum = agenda pessoal na importadora. As perguntas frequentes valem para todos." pending={pending} onSave={() => save("support", "Suporte")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">Canais de suporte por plano</caption>
              <thead><tr><th scope="col" className="py-2 text-left">Canal</th>{BRAS_MEMBER_PLANS.map((p) => <th key={p} scope="col" className="py-2">{BRAS_PLAN_LABEL[p]}</th>)}</tr></thead>
              <tbody>
                {BRAS_SUPPORT_CHANNELS.map((c) => (
                  <tr key={c} className="border-t border-border">
                    <th scope="row" className="py-2 text-left font-medium">{BRAS_SUPPORT_LABEL[c]}</th>
                    {BRAS_MEMBER_PLANS.map((p) => (
                      <td key={p} className="py-2 text-center">
                        <input type="checkbox" aria-label={`${BRAS_SUPPORT_LABEL[c]} no plano ${BRAS_PLAN_LABEL[p]}`} className="size-4" checked={c === "FAQ" || s.channels[p].includes(c)} disabled={c === "FAQ"} onChange={() => toggle(p, c)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={grid}>
            {BRAS_MEMBER_PLANS.map((p) => <IntField key={p} id={`ag-${p}`} label={`Visitas por mês · ${BRAS_PLAN_LABEL[p]}`} value={s.agendaPerMonth[p]} onChange={(v) => set("support", { agendaPerMonth: { ...s.agendaPerMonth, [p]: v } })} />)}
          </div>
          <div className={grid}>
            <IntField id="chat-h" label="Prazo de resposta do chat" suffix="h" value={s.chatReplyHours} min={1} onChange={(v) => set("support", { chatReplyHours: v })} />
            <div className="sm:col-span-3"><Switch checked={s.largeAccountWhatsapp} onCheckedChange={(v) => set("support", { largeAccountWhatsapp: v })} label="Grande conta fala por WhatsApp mesmo no plano grátis" /></div>
          </div>
        </GroupCard>
        <GroupCard id="g-faq" title="Perguntas frequentes do membro" description="Aparecem no Suporte do Meu Brás para todos os planos. Sem promessa de ganho." pending={pending} onSave={() => save("support", "Perguntas frequentes")}>
          <ol className="space-y-3">
            {s.faq.map((f, i) => (
              <li key={i} className="grid gap-2 rounded-lg border border-border p-3">
                <div className="flex gap-2"><Input aria-label={`Pergunta ${i + 1}`} value={f.q} onChange={(e) => set("support", { faq: s.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} /><Button type="button" variant="ghost" size="icon" aria-label={`Remover pergunta ${i + 1}`} onClick={() => set("support", { faq: s.faq.filter((_, j) => j !== i) })}><Trash2 className="size-4" aria-hidden /></Button></div>
                <textarea aria-label={`Resposta ${i + 1}`} rows={2} className="ds-input min-h-16 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" value={f.a} onChange={(e) => set("support", { faq: s.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
              </li>
            ))}
          </ol>
          <Button type="button" variant="secondary" onClick={() => set("support", { faq: [...s.faq, { q: "Nova pergunta?", a: "Resposta." }] })}><Plus className="size-4" aria-hidden />Adicionar pergunta</Button>
        </GroupCard>
      </div>
    );
  }
  const c = r.cubage;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <GroupCard id="g-pre" title="Pré-pedido (alto mar)" description="Sinal pago à importadora; devolução integral do sinal se o atraso passar do limite sobre a ETA original." pending={pending} onSave={() => save("preorder", "Pré-pedido")}>
        <div className={grid}>
          <IntField id="pre-dep" label="Sinal" suffix="%" value={r.preorder.depositPct} onChange={(v) => set("preorder", { depositPct: v })} />
          <IntField id="pre-atr" label="Atraso que libera devolução" suffix="dias" value={r.preorder.delayRefundDays} onChange={(v) => set("preorder", { delayRefundDays: v })} />
          <IntField id="pre-sal" label="Prazo para pagar o saldo" suffix="dias" value={r.preorder.balanceDueDays} onChange={(v) => set("preorder", { balanceDueDays: v })} />
          <PlanSelect id="pre-plan" label="Plano mínimo" value={r.preorder.minPlan} onChange={(v) => set("preorder", { minPlan: v })} />
        </div>
      </GroupCard>
      <GroupCard id="g-cot" title="Cotação de contêiner fechado" description="A taxa fora do catálogo é preço do catálogo (aba Planos e preços)." pending={pending} onSave={() => save("quotes", "Cotação")}>
        <div className={grid}>
          <IntField id="cot-cat" label="Prazo · itens do catálogo" suffix="dias" value={r.quotes.catalogDays} onChange={(v) => set("quotes", { catalogDays: v })} />
          <IntField id="cot-fora" label="Prazo · fora do catálogo" suffix="dias" value={r.quotes.offCatalogDays} onChange={(v) => set("quotes", { offCatalogDays: v })} />
          <IntField id="cot-itens" label="Itens por cotação paga" value={r.quotes.offCatalogMaxItems} min={1} onChange={(v) => set("quotes", { offCatalogMaxItems: v })} />
          <IntField id="cot-dev" label="Devolução se atrasar" suffix="%" value={r.quotes.offCatalogLateRefundPct} onChange={(v) => set("quotes", { offCatalogLateRefundPct: v })} />
          <PlanSelect id="cot-plan" label="Plano mínimo" value={r.quotes.minPlan} onChange={(v) => set("quotes", { minPlan: v })} />
        </div>
      </GroupCard>
      <GroupCard id="g-sha" title="Contêiner dividido (cotas)" description="Compra de mercadoria com entrega futura. Não completou: devolução integral." pending={pending} onSave={() => save("shared", "Contêiner dividido")}>
        <div className={grid}>
          <IntField id="sha-pz" label="Prazo para completar" suffix="dias" value={r.shared.closeDays} onChange={(v) => set("shared", { closeDays: v })} />
          <IntField id="sha-ext" label="Prorrogação" suffix="dias" value={r.shared.extensionDays} onChange={(v) => set("shared", { extensionDays: v })} />
          <IntField id="sha-n" label="Prorrogações" value={r.shared.maxExtensions} onChange={(v) => set("shared", { maxExtensions: v })} />
          <IntField id="sha-min" label="Mínimo para fechar" suffix="%" value={r.shared.minFillPct} onChange={(v) => set("shared", { minFillPct: v })} />
          <PlanSelect id="sha-plan" label="Plano mínimo" value={r.shared.minPlan} onChange={(v) => set("shared", { minPlan: v })} />
        </div>
      </GroupCard>
      <GroupCard id="g-car" title="NextLevel Cargas" description="Comissão sobre o frete das cargas fechadas pela plataforma, por plano da transportadora." pending={pending} onSave={() => save("carriers", "Cargas")}>
        <div className={grid}>
          <PercentField id="car-g" label="Comissão · Grátis" bps={r.carriers.commissionBps.GRATIS} onChange={(v) => set("carriers", { commissionBps: { ...r.carriers.commissionBps, GRATIS: v } })} />
          <PercentField id="car-p" label="Comissão · Pro" bps={r.carriers.commissionBps.PRO} onChange={(v) => set("carriers", { commissionBps: { ...r.carriers.commissionBps, PRO: v } })} />
          <PercentField id="car-pr" label="Comissão · Premium" bps={r.carriers.commissionBps.PREMIUM} onChange={(v) => set("carriers", { commissionBps: { ...r.carriers.commissionBps, PREMIUM: v } })} />
          <IntField id="car-free" label="Coletas/mês no grátis" value={r.carriers.freeLoadsPerMonth} onChange={(v) => set("carriers", { freeLoadsPerMonth: v })} />
          <IntField id="car-early" label="Antecedência Pro/Premium" suffix="min" value={r.carriers.earlyAccessMinutes} onChange={(v) => set("carriers", { earlyAccessMinutes: v })} />
        </div>
      </GroupCard>
      <GroupCard id="g-cub" title="Cubagem" description="Volumes úteis de referência (confirme com a importadora), ocupação do misto, taxa por item e acréscimo de pouca quantidade." pending={pending} onSave={() => save("cubage", "Cubagem")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["c20", "c40", "c40hc"] as const).map((k) => <IntField key={k} id={`cub-${k}`} label={`Volume útil ${k === "c20" ? "20'" : k === "c40" ? "40'" : "40' HC"} (litros)`} suffix="L" value={c.usefulDm3[k]} min={10000} onChange={(v) => set("cubage", { usefulDm3: { ...c.usefulDm3, [k]: v } })} />)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <IntField id="cub-occ" label="Ocupação do misto" suffix="%" value={c.mixedOccupancyPct} onChange={(v) => set("cubage", { mixedOccupancyPct: v })} />
          <MoneyField id="cub-sku" label="Taxa por item diferente" valueCents={c.perSkuFeeCents} onChange={(v) => set("cubage", { perSkuFeeCents: v })} />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">Acréscimo por pouca quantidade (misto), em ordem crescente de caixas</legend>
          {c.smallQtyCurve.map((t, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <IntField id={`cv-b-${i}`} label="Até" suffix="cx" value={t.upToBoxes} min={1} onChange={(v) => set("cubage", { smallQtyCurve: c.smallQtyCurve.map((x, j) => (j === i ? { ...x, upToBoxes: v } : x)) })} className="w-32" />
              <PercentField id={`cv-p-${i}`} label="Acréscimo" bps={t.surchargeBps} onChange={(v) => set("cubage", { smallQtyCurve: c.smallQtyCurve.map((x, j) => (j === i ? { ...x, surchargeBps: v } : x)) })} className="w-32" />
              <Button type="button" variant="ghost" size="icon" aria-label={`Remover faixa ${i + 1}`} onClick={() => set("cubage", { smallQtyCurve: c.smallQtyCurve.filter((_, j) => j !== i) })}><Trash2 className="size-4" aria-hidden /></Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => set("cubage", { smallQtyCurve: [...c.smallQtyCurve, { upToBoxes: (c.smallQtyCurve.at(-1)?.upToBoxes ?? 0) + 50, surchargeBps: 0 }] })}><Plus className="size-4" aria-hidden />Faixa</Button>
        </fieldset>
      </GroupCard>
      <GroupCard id="g-sto" title="Estoque, Bling e plano grátis" description="Saldo velho avisa a importadora; o Bling sincroniza no intervalo; o grátis vê só parte das tendências." pending={pending} onSave={() => { save("stock", "Estoque"); save("freePlan", "Plano grátis"); }}>
        <div className={grid}>
          <IntField id="st-f" label="Saldo desatualizado após" suffix="h" value={r.stock.freshnessHours} min={1} onChange={(v) => set("stock", { freshnessHours: v })} />
          <IntField id="st-b" label="Sincronizar o Bling a cada" suffix="min" value={r.stock.blingSyncMinutes} min={5} onChange={(v) => set("stock", { blingSyncMinutes: v })} />
          <IntField id="fp-t" label="Tendências visíveis no grátis" value={r.freePlan.trendsVisible} onChange={(v) => set("freePlan", { trendsVisible: v })} />
          <IntField id="fp-r" label="Pedidos abertos no grátis" value={r.freePlan.openRequestsMax} min={1} onChange={(v) => set("freePlan", { openRequestsMax: v })} />
        </div>
      </GroupCard>
    </div>
  );
}

type Classification = {
  points: { stage: Record<string, number>; monthlyPurchase: Record<string, number>; revenue: Record<string, number>; importExperience: Record<string, number>; team: Record<string, number>; channels: Record<string, number>; channelsCap: number };
  thresholds: { CRESCIMENTO: number; PROFISSIONAL: number; GRANDE: number };
  floors: { monthlyPurchase: Record<string, BrasClientLevel>; importExperience: Record<string, BrasClientLevel> };
  behavior: { windowDays: number; CRESCIMENTO: number; PROFISSIONAL: number; GRANDE: number };
  coolingDays: number;
};
const SCORED = ["stage", "channels", "monthlyPurchase", "revenue", "importExperience", "team"] as const;

/** Pontos de cada resposta, cortes de nível, pisos e o nível comprovado pela compra. */
export function ClassificationEditor({ value, maxScore }: { value: Classification; maxScore: number }) {
  const [c, setC] = React.useState(value);
  const { pending, run } = useSave();
  const setPoint = (q: (typeof SCORED)[number], k: string, v: number) => setC((x) => ({ ...x, points: { ...x.points, [q]: { ...x.points[q], [k]: v } } }));
  const setFloor = (q: "monthlyPurchase" | "importExperience", k: string, v: string) => setC((x) => {
    const f = { ...x.floors[q] }; if (v) f[k] = v as BrasClientLevel; else delete f[k];
    return { ...x, floors: { ...x.floors, [q]: f } };
  });
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); run(() => saveBrasClassificationAction(c), "Classificação gravada (vale para os próximos cadastros e edições de perfil)"); }}>
      <p className="text-sm text-muted-foreground">O nível de cada cliente é o maior entre o <b>declarado</b> (pontos das respostas do cadastro) e o <b>comprovado</b> (compras pagas na janela). O ajuste manual na lista de Membros vence os dois. Pontuação máxima com os pontos atuais: <b>{maxScore}</b>.</p>
      <div className="grid gap-4 xl:grid-cols-2">
        {SCORED.map((qk) => {
          const q = BRAS_PROFILE_QUESTIONS.find((x) => x.key === qk)!;
          return (
            <fieldset key={qk} className="ds-card space-y-2 p-4">
              <legend className="px-1 text-sm font-semibold">{q.label}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o) => (
                  <div key={o.key} className="flex items-end gap-2">
                    <IntField id={`pt-${qk}-${o.key}`} label={o.label} value={c.points[qk][o.key] ?? 0} suffix="pts" onChange={(v) => setPoint(qk, o.key, v)} className="flex-1" />
                    {qk === "monthlyPurchase" || qk === "importExperience" ? (
                      <div className="w-36 space-y-1">
                        <label htmlFor={`fl-${qk}-${o.key}`} className="text-xs font-medium text-muted-foreground">Nível mínimo</label>
                        <Select id={`fl-${qk}-${o.key}`} value={c.floors[qk][o.key] ?? ""} onChange={(e) => setFloor(qk, o.key, e.target.value)}>
                          <option value="">—</option>{BRAS_LEVELS.slice(1).map((l) => <option key={l} value={l}>{BRAS_LEVEL_LABEL[l]}</option>)}
                        </Select>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {qk === "channels" ? <IntField id="pt-cap" label="Teto de pontos por canais" value={c.points.channelsCap} onChange={(v) => setC({ ...c, points: { ...c.points, channelsCap: v } })} className="max-w-48" /> : null}
            </fieldset>
          );
        })}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <fieldset className="ds-card space-y-2 p-4">
          <legend className="px-1 text-sm font-semibold">Pontuação mínima de cada nível (declarado)</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["CRESCIMENTO", "PROFISSIONAL", "GRANDE"] as const).map((l) => <IntField key={l} id={`th-${l}`} label={BRAS_LEVEL_LABEL[l]} suffix="pts" value={c.thresholds[l]} onChange={(v) => setC({ ...c, thresholds: { ...c.thresholds, [l]: v } })} />)}
          </div>
        </fieldset>
        <fieldset className="ds-card space-y-2 p-4">
          <legend className="px-1 text-sm font-semibold">Nível comprovado (compras pagas)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <IntField id="bh-w" label="Janela" suffix="dias" value={c.behavior.windowDays} min={30} onChange={(v) => setC({ ...c, behavior: { ...c.behavior, windowDays: v } })} />
            <IntField id="bh-cool" label="Esfriando após (sem visita)" suffix="dias" value={c.coolingDays} min={7} onChange={(v) => setC({ ...c, coolingDays: v })} />
            {(["CRESCIMENTO", "PROFISSIONAL", "GRANDE"] as const).map((l) => <MoneyField key={l} id={`bh-${l}`} label={`${BRAS_LEVEL_LABEL[l]} a partir de`} valueCents={c.behavior[l]} onChange={(v) => setC({ ...c, behavior: { ...c.behavior, [l]: v } })} />)}
          </div>
        </fieldset>
      </div>
      <Button type="submit" loading={pending}>Gravar classificação</Button>
    </form>
  );
}

type LegalDoc = { key: string; label: string; title: string; body: string; status: "SIMULADO" | "REVISADO"; reviewedBy: string | null; reviewedAt: string | null; version: number; preview: string };
type Entity = { legalName: string; cnpj: string; address: string; forum: string; email: string; dpoName: string; simulated: boolean };

/** Dados da empresa e os seis modelos jurídicos (simulados até a revisão do advogado). */
export function LegalEditor({ entity, docs, tokens }: { entity: Entity; docs: LegalDoc[]; tokens: { k: string; label: string }[] }) {
  const [e, setE] = React.useState(entity);
  const [open, setOpen] = React.useState(docs[0]!.key);
  const doc = docs.find((d) => d.key === open)!;
  const { pending, run } = useSave();
  const field = (k: keyof Omit<Entity, "simulated">, label: string) => (
    <div className="space-y-1"><label htmlFor={`le-${k}`} className="text-xs font-medium text-muted-foreground">{label}</label><Input id={`le-${k}`} value={e[k]} onChange={(ev) => setE({ ...e, [k]: ev.target.value })} /></div>
  );
  return (
    <div className="space-y-6">
      <p role="note" className="rounded-lg border border-warning/40 bg-warning-soft/40 p-4 text-sm"><b>Modelos simulados.</b> Os textos e os dados marcados com [DADO SIMULADO] servem para o sistema funcionar e para o advogado revisar. Não valem como contrato até você marcar &quot;Revisado&quot; com o nome de quem revisou.</p>
      <form className="ds-card space-y-3 p-4" aria-labelledby="le-h" onSubmit={(ev) => { ev.preventDefault(); run(() => saveBrasLegalAction({ kind: "entity", entity: e }), "Dados da empresa gravados"); }}>
        <h2 id="le-h" className="text-base font-semibold">Dados da empresa nos textos</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {field("legalName", "Razão social")}{field("cnpj", "CNPJ")}{field("address", "Endereço")}{field("forum", "Foro")}{field("email", "E-mail jurídico")}{field("dpoName", "Encarregado de dados (LGPD)")}
        </div>
        <Switch checked={e.simulated} onCheckedChange={(v) => setE({ ...e, simulated: v })} label="Dados ainda simulados" />
        <Button type="submit" loading={pending}>Gravar dados</Button>
      </form>
      <div className="grid gap-4 xl:grid-cols-[16rem_1fr]">
        <nav aria-label="Documentos" className="ds-card h-fit p-2">
          <ul className="space-y-1">{docs.map((d) => (
            <li key={d.key}><button type="button" onClick={() => setOpen(d.key)} aria-current={open === d.key ? "true" : undefined} className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${open === d.key ? "bg-accent-soft font-semibold" : "hover:bg-surface-muted"}`}>{d.label}<Badge tone={d.status === "REVISADO" ? "success" : "warning"}>{d.status === "REVISADO" ? "Revisado" : "Simulado"}</Badge></button></li>
          ))}</ul>
        </nav>
        <div className="grid gap-4 2xl:grid-cols-2">
          <DocForm key={`${doc.key}-${doc.version}-${doc.status}`} doc={doc} tokens={tokens} />
          <section className="ds-card p-4" aria-labelledby="lp-h">
            <h2 id="lp-h" className="text-base font-semibold">Como o cliente lê (com os valores de hoje)</h2>
            {doc.status === "SIMULADO" ? <p className="mt-2 rounded-md bg-warning-soft/50 px-3 py-2 text-xs font-semibold">Modelo simulado: não vale como contrato até a revisão jurídica.</p> : <p className="mt-2 text-xs text-muted-foreground">Revisado por {doc.reviewedBy}{doc.reviewedAt ? ` em ${new Date(doc.reviewedAt).toLocaleDateString("pt-BR")}` : ""}.</p>}
            <h3 className="mt-3 font-semibold">{doc.title}</h3>
            <div className="mt-2 space-y-2 whitespace-pre-line text-sm leading-relaxed">{doc.preview}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DocForm({ doc, tokens }: { doc: LegalDoc; tokens: { k: string; label: string }[] }) {
  const [draft, setDraft] = React.useState({ title: doc.title, body: doc.body, reviewed: doc.status === "REVISADO", reviewedBy: doc.reviewedBy ?? "" });
  const { pending, run } = useSave();
  return (
    <form className="ds-card space-y-3 p-4" aria-labelledby="ld-h" onSubmit={(ev) => { ev.preventDefault(); run(() => saveBrasLegalAction({ kind: "doc", doc: doc.key as never, title: draft.title, body: draft.body, reviewed: draft.reviewed, reviewedBy: draft.reviewedBy || undefined }), "Documento gravado"); }}>
            <h2 id="ld-h" className="text-base font-semibold">{doc.label} <span className="text-sm font-normal text-muted-foreground">· versão {doc.version}</span></h2>
            <div className="space-y-1"><label htmlFor="ld-t" className="text-xs font-medium text-muted-foreground">Título</label><Input id="ld-t" value={draft.title} onChange={(ev) => setDraft({ ...draft, title: ev.target.value })} /></div>
            <div className="space-y-1"><label htmlFor="ld-b" className="text-xs font-medium text-muted-foreground">Texto (use os marcadores abaixo para valores das regras)</label><textarea id="ld-b" rows={16} className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs leading-relaxed" value={draft.body} onChange={(ev) => setDraft({ ...draft, body: ev.target.value })} /></div>
            <details className="text-xs"><summary className="cursor-pointer font-semibold">Marcadores disponíveis</summary><ul className="mt-2 grid gap-1 sm:grid-cols-2">{tokens.map((t) => <li key={t.k}><code>{`{{${t.k}}}`}</code> · {t.label}</li>)}</ul></details>
            <div className="flex flex-wrap items-end gap-3">
              <Switch checked={draft.reviewed} onCheckedChange={(v) => setDraft({ ...draft, reviewed: v })} label="Revisado por advogado" />
              {draft.reviewed ? <div className="min-w-64 flex-1 space-y-1"><label htmlFor="ld-r" className="text-xs font-medium text-muted-foreground">Quem revisou (nome e OAB)</label><Input id="ld-r" value={draft.reviewedBy} onChange={(ev) => setDraft({ ...draft, reviewedBy: ev.target.value })} /></div> : null}
            </div>
            <Button type="submit" loading={pending}>Gravar documento</Button>
          </form>
  );
}

/** Simulador de cubagem (seção 9.3): mesmo item × misto, cheio × parcial. Só simulação, sem gravar nada. */
export function CubageSimulator({ cubage }: { cubage: CubageRules }) {
  const [i, setI] = React.useState({ container: "c40hc" as "c20" | "c40" | "c40hc", fixedCostCents: 6_800_000, boxDm3: 100, productPerBoxCents: 20_000, unitsPerBox: 24, items: 1, boxesOfItem: 0, soldPct: 100 });
  const q = brasCubageQuote({ cubage }, { ...i, boxesOfItem: i.boxesOfItem || undefined });
  const misto = brasCubageQuote({ cubage }, { ...i, items: Math.max(2, i.items), boxesOfItem: i.boxesOfItem || undefined });
  const igual = brasCubageQuote({ cubage }, { ...i, items: 1, boxesOfItem: undefined });
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <form className="ds-card space-y-3 p-4" aria-labelledby="sim-h" onSubmit={(e) => e.preventDefault()}>
        <h2 id="sim-h" className="text-base font-semibold">Entradas</h2>
        <div className="space-y-1"><label htmlFor="sim-c" className="text-xs font-medium text-muted-foreground">Contêiner</label><Select id="sim-c" value={i.container} onChange={(e) => setI({ ...i, container: e.target.value as typeof i.container })}><option value="c20">20&apos; Dry</option><option value="c40">40&apos; Dry</option><option value="c40hc">40&apos; HC</option></Select></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyField id="sim-cf" label="Custo fixo do contêiner" hint="Frete, seguro, despesas, desembaraço, armazenagem, porto → galpão, margem" valueCents={i.fixedCostCents} onChange={(v) => setI({ ...i, fixedCostCents: v })} />
          <MoneyField id="sim-pp" label="Produto por caixa" valueCents={i.productPerBoxCents} onChange={(v) => setI({ ...i, productPerBoxCents: v })} />
          <IntField id="sim-dm" label="Cubagem da caixa" suffix="litros" value={i.boxDm3} min={1} onChange={(v) => setI({ ...i, boxDm3: v })} />
          <IntField id="sim-un" label="Unidades por caixa" value={i.unitsPerBox} min={1} onChange={(v) => setI({ ...i, unitsPerBox: v })} />
          <IntField id="sim-it" label="Itens diferentes" hint="1 = mesmo item" value={i.items} min={1} onChange={(v) => setI({ ...i, items: v })} />
          <IntField id="sim-bi" label="Caixas deste item" hint="0 = divide o contêiner pelos itens" value={i.boxesOfItem} onChange={(v) => setI({ ...i, boxesOfItem: v })} />
        </div>
        <div className="space-y-1">
          <label htmlFor="sim-sold" className="text-xs font-medium text-muted-foreground">Ocupação vendida: {i.soldPct}%</label>
          <input id="sim-sold" type="range" min={20} max={100} step={5} value={i.soldPct} onChange={(e) => setI({ ...i, soldPct: Number(e.target.value) })} className="w-full" />
        </div>
      </form>
      <section className="ds-card space-y-4 p-4" aria-labelledby="sim-r" aria-live="polite">
        <h2 id="sim-r" className="text-base font-semibold">Resultado {q.mixed ? "(misto)" : "(mesmo item)"}</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Caixas que cabem (cheio)", `${q.boxesFull}`], ["Logística por caixa", formatBRL(q.logisticsPerBoxCents)],
            ["Manuseio por caixa (misto)", formatBRL(q.handlingPerBoxCents)], ["Acréscimo de pouca quantidade", `${(q.surchargeBps / 100).toString().replace(".", ",")}%`],
            ["Preço da caixa (cheio)", formatBRL(q.perBoxCents)], ["Por unidade (cheio)", formatBRL(q.perUnitCents)],
            ["Ajuste de ocupação por caixa", formatBRL(q.occupancyAdjustmentPerBoxCents)], [`Por unidade com ${i.soldPct}%`, formatBRL(q.perUnitAtSoldCents)],
          ].map(([k, v]) => <div key={k} className="rounded-lg bg-surface-muted p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-lg font-bold tabular-nums">{v}</dd></div>)}
        </dl>
        <p className="text-sm">Mesmo item: <b className="tabular-nums">{formatBRL(igual.perUnitCents)}</b> por unidade · Misto ({Math.max(2, i.items)} itens): <b className="tabular-nums">{formatBRL(misto.perUnitCents)}</b> por unidade.</p>
        <p className="text-xs text-muted-foreground">Simulação com os valores informados e as regras atuais. O ajuste de ocupação só pode ser cobrado com o aceite do comprador, antes de confirmar.</p>
      </section>
    </div>
  );
}
