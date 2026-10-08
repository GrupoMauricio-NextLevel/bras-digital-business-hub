"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { createPartnerLeadAction, movePartnerLeadAction, savePartnerDiagnosisAction, requestQuoteAction } from "@/app/actions/financeiro";

export function NewLead() {
  const router = useRouter();
  const [f, setF] = React.useState({ name: "", email: "", phone: "", company: "" }); const [busy, setBusy] = React.useState(false);
  return (
    <form className="grid gap-3 sm:grid-cols-5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await createPartnerLeadAction({ ...f, phone: f.phone || undefined, company: f.company || undefined }); setBusy(false); if (r.ok) { toast.success("Lead registrado na sua carteira"); setF({ name: "", email: "", phone: "", company: "" }); router.refresh(); } else toast.error(r.error); }}>
      <FormField label="Nome" htmlFor="ld-n"><Input id="ld-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></FormField>
      <FormField label="E-mail" htmlFor="ld-e"><Input id="ld-e" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></FormField>
      <FormField label="WhatsApp" htmlFor="ld-p"><Input id="ld-p" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></FormField>
      <FormField label="Empresa" htmlFor="ld-c"><Input id="ld-c" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></FormField>
      <div className="flex items-end"><Button type="submit" loading={busy}>Registrar lead</Button></div>
    </form>
  );
}

const STAGES: [string, string][] = [["NEW", "Novo lead"], ["DIAG_SCHEDULED", "Diagnóstico agendado"], ["DIAG_DELIVERED", "Diagnóstico entregue"], ["PROPOSAL_SENT", "Proposta enviada"], ["NEGOTIATION", "Negociação"], ["WON", "Ganho"], ["LOST", "Perdido"], ["ONBOARDING", "Onboarding"], ["REACTIVATION", "Reativação"]];

export function LeadActions({ lead, products }: { lead: { id: string; name: string; email: string; phone: string | null; stage: string }; products: { key: string; name: string; quote: boolean }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState<"diag" | "quote" | null>(null);
  const [a, setA] = React.useState({ hasStore: "nao", monthlyOrders: "0", ads: "nao", catalog: "ate_30", social: "nao" });
  const [q, setQ] = React.useState({ productKey: products.find((p) => p.quote)?.key ?? products[0]?.key ?? "", briefing: "" });
  const [busy, setBusy] = React.useState(false);
  const sel = (k: keyof typeof a, label: string, opts: [string, string][]) => <FormField label={label} htmlFor={`d-${k}-${lead.id}`}><Select id={`d-${k}-${lead.id}`} value={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.value })}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></FormField>;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <FormField label="Etapa" htmlFor={`st-${lead.id}`}><Select id={`st-${lead.id}`} value={lead.stage} onChange={async (e) => { const r = await movePartnerLeadAction(lead.id, e.target.value as never); if (r.ok) router.refresh(); else toast.error(r.error); }}>{STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></FormField>
      <Button size="sm" variant="secondary" onClick={() => setOpen("diag")}>Diagnóstico</Button>
      <Button size="sm" variant="secondary" onClick={() => setOpen("quote")}>Pedir proposta</Button>
      <Dialog open={open === "diag"} onOpenChange={(o) => setOpen(o ? "diag" : null)}>
        <DialogContent title={`Diagnóstico de ${lead.name}`} description="Respostas padronizadas geram a nota de maturidade e as recomendações do catálogo (validade de 30 dias).">
          <div className="grid gap-3 sm:grid-cols-2">
            {sel("hasStore", "Tem loja virtual?", [["nao", "Não"], ["sim_outra", "Sim, em outra plataforma"], ["sim_nextlevel", "Sim, na NextLevel"]])}
            {sel("monthlyOrders", "Pedidos por mês", [["0", "Nenhum"], ["1-30", "1 a 30"], ["31-300", "31 a 300"], ["300+", "Mais de 300"]])}
            {sel("ads", "Anuncia?", [["nao", "Não"], ["as_vezes", "Às vezes"], ["sempre", "Sempre"]])}
            {sel("catalog", "Tamanho do catálogo", [["ate_30", "Até 30"], ["ate_150", "Até 150"], ["ate_1000", "Até 1.000"], ["mais", "Mais de 1.000"]])}
            {sel("social", "Redes sociais", [["nao", "Não usa"], ["irregular", "Irregular"], ["constante", "Constante"]])}
          </div>
          <div className="mt-4 flex justify-end"><Button loading={busy} onClick={async () => { setBusy(true); const r = await savePartnerDiagnosisAction(lead.id, a as never); setBusy(false); if (r.ok) { toast.success(`Nota de maturidade: ${r.data.score}`); setOpen(null); router.refresh(); } else toast.error(r.error); }}>Salvar diagnóstico</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={open === "quote"} onOpenChange={(o) => setOpen(o ? "quote" : null)}>
        <DialogContent title={`Proposta para ${lead.name}`} description="A NextLevel monta a proposta com escopo, prazo e valores; a venda fica atribuída a você.">
          <FormField label="Produto" htmlFor={`qp-${lead.id}`}><Select id={`qp-${lead.id}`} value={q.productKey} onChange={(e) => setQ({ ...q, productKey: e.target.value })}>{products.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</Select></FormField>
          <FormField label="Contexto do cliente" htmlFor={`qb-${lead.id}`} className="mt-3"><Textarea id={`qb-${lead.id}`} rows={4} value={q.briefing} onChange={(e) => setQ({ ...q, briefing: e.target.value })} /></FormField>
          <div className="mt-4 flex justify-end"><Button loading={busy} disabled={q.briefing.trim().length < 10} onClick={async () => { setBusy(true); const r = await requestQuoteAction({ productKey: q.productKey, briefing: q.briefing, contact: { name: lead.name, email: lead.email, phone: lead.phone ?? undefined } }); setBusy(false); if (r.ok) { toast.success("Pedido de proposta enviado"); await movePartnerLeadAction(lead.id, "PROPOSAL_SENT"); setOpen(null); router.refresh(); } else toast.error(r.error); }}>Enviar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
