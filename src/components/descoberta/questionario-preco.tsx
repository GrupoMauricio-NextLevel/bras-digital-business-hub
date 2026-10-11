"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/input";
import { IntField, MoneyField } from "@/components/finance/fields";
import { answerSurveyAction, dismissSurveyAction, saveBenefitsSettingsAction, saveSurveySettingsAction } from "@/app/actions/questionario";

function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends { ok: boolean; error?: string }>(fn: () => Promise<T>, msg: string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(msg); router.refresh(); } else toast.error(r.error); }) };
}

const SENTIMENTO = [["MUITO", "Muito decepcionado"], ["POUCO", "Um pouco decepcionado"], ["NADA", "Não faria diferença"]] as const;

/**
 * Questionário de preço no painel (D124, fase P2): 5 perguntas, opcional, anônimo. Aparece só quando o Master liga
 * e só uma vez por marca (respondeu ou clicou "Agora não").
 */
export function QuestionarioPreco({ product }: { product: string }) {
  const { pending, run } = useRun();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ tooCheapCents: 0, bargainCents: 0, expensiveCents: 0, tooExpensiveCents: 0, disappointment: "" as "" | "MUITO" | "POUCO" | "NADA" });
  return (
    <section aria-labelledby="qp-h" className="ds-card mb-6 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <MessageSquareHeart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="qp-h" className="font-semibold">Ajude a definir o preço justo do {product}</h2>
          <p className="text-sm text-muted-foreground">5 perguntas, menos de 1 minuto. A resposta é anônima: ninguém da equipe vê quem respondeu.</p>
        </div>
      </div>
      {!open ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setOpen(true)}>Responder</Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => dismissSurveyAction(), "Tudo bem, não vamos perguntar de novo")}>Agora não</Button>
        </div>
      ) : (
        <form className="mt-3 grid gap-3 sm:grid-cols-2" aria-label="Questionário de preço" onSubmit={(e) => { e.preventDefault(); if (!f.disappointment) { toast.error("Responda a última pergunta."); return; } run(() => answerSurveyAction({ ...f, disappointment: f.disappointment as "MUITO" }), "Obrigado! Sua resposta ajuda a definir o preço."); }}>
          <p className="text-sm sm:col-span-2">Pensando no {product} por mês:</p>
          <MoneyField id="qp-1" label="1. Tão barato que você desconfiaria da qualidade" valueCents={f.tooCheapCents} onChange={(v) => setF({ ...f, tooCheapCents: v })} />
          <MoneyField id="qp-2" label="2. Uma pechincha (ótimo negócio)" valueCents={f.bargainCents} onChange={(v) => setF({ ...f, bargainCents: v })} />
          <MoneyField id="qp-3" label="3. Caro, mas você ainda pagaria" valueCents={f.expensiveCents} onChange={(v) => setF({ ...f, expensiveCents: v })} />
          <MoneyField id="qp-4" label="4. Caro demais, você não pagaria" valueCents={f.tooExpensiveCents} onChange={(v) => setF({ ...f, tooExpensiveCents: v })} />
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 text-sm font-medium">5. Como você se sentiria se não pudesse mais usar o {product}?</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{SENTIMENTO.map(([v, l]) => <label key={v} className="inline-flex items-center gap-2"><input type="radio" name="qp-5" value={v} checked={f.disappointment === v} onChange={() => setF({ ...f, disappointment: v })} />{l}</label>)}</div>
          </fieldset>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" size="sm" loading={pending}>Enviar respostas</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Voltar</Button>
          </div>
        </form>
      )}
    </section>
  );
}

type Brand = "NEXTLEVEL_COMMERCE" | "SUPERDROP" | "BRAS_DIGITAL" | "NEXTLEVEL_CARGAS";
/** Liga e desliga o questionário (Master). */
export function QuestionarioConfig({ value, brands }: { value: { enabled: boolean; brands: Brand[]; minDaysSinceSignup: number; minResponsesToShow: number }; brands: { brand: Brand; label: string }[] }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState(value);
  return (
    <form className="grid gap-3 sm:grid-cols-2" aria-label="Regras do questionário de preço" onSubmit={(e) => { e.preventDefault(); run(() => saveSurveySettingsAction(f), "Questionário atualizado"); }}>
      <div className="sm:col-span-2"><Switch checked={f.enabled} onCheckedChange={(v) => setF({ ...f, enabled: v })} label="Questionário ligado nos painéis" /></div>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Em quais marcas</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{brands.map((b) => <label key={b.brand} className="inline-flex items-center gap-2"><input type="checkbox" checked={f.brands.includes(b.brand)} onChange={(e) => setF({ ...f, brands: e.target.checked ? [...f.brands, b.brand] : f.brands.filter((x) => x !== b.brand) })} />{b.label}</label>)}</div>
      </fieldset>
      <IntField id="qp-dias" label="Perguntar só depois de" suffix="dias de uso" min={0} value={f.minDaysSinceSignup} onChange={(v) => setF({ ...f, minDaysSinceSignup: v })} />
      <IntField id="qp-min" label="Mostrar o resultado a partir de" suffix="respostas" min={3} value={f.minResponsesToShow} onChange={(v) => setF({ ...f, minResponsesToShow: v })} />
      <Button type="submit" loading={pending} className="sm:justify-self-start">Gravar</Button>
    </form>
  );
}

/** Liga e desliga os benefícios gamificados (carteira, trilha, medidor do teste, simulador) por marca (D128). */
export function BeneficiosConfig({ value, brands }: { value: Brand[]; brands: { brand: Brand; label: string }[] }) {
  const { pending, run } = useRun();
  const [f, setF] = React.useState(value);
  return (
    <form className="space-y-3" aria-label="Benefícios nos painéis" onSubmit={(e) => { e.preventDefault(); run(() => saveBenefitsSettingsAction({ brands: f }), "Benefícios atualizados"); }}>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Ligado nos painéis de</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{brands.map((b) => <label key={b.brand} className="inline-flex items-center gap-2"><input type="checkbox" checked={f.includes(b.brand)} onChange={(e) => setF(e.target.checked ? [...f, b.brand] : f.filter((x) => x !== b.brand))} />{b.label}</label>)}</div>
      </fieldset>
      <Button type="submit" loading={pending}>Gravar</Button>
    </form>
  );
}
