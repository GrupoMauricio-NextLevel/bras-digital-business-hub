"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { setRankingOptInAction } from "@/app/actions/club";

type Ranking = { optedIn: boolean; city: string | null; uf: string | null; rows: { position: number; name: string; activated: number; me: boolean }[] };

/** Ranking do mês na cidade (D122): só quem aceitar aparece; mostra posição, nunca prêmio por posição. */
export function RankingCard({ ranking, defaultCity, defaultUf }: { ranking: Ranking; defaultCity?: string | null; defaultUf?: string | null }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({ city: ranking.city ?? defaultCity ?? "", uf: (ranking.uf ?? defaultUf ?? "SP") as (typeof BRAS_UFS)[number] });
  const save = (show: boolean) => start(async () => { const r = await setRankingOptInAction({ show, ...f }); if (r.ok) { toast.success(show ? "Você aparece no ranking da sua cidade" : "Você saiu do ranking"); router.refresh(); } else toast.error(r.error); });
  return (
    <section aria-labelledby="club-rank" className="ds-card mt-6 p-4">
      <h2 id="club-rank" className="flex items-center gap-2 text-lg font-bold"><Trophy className="size-5 text-[var(--brand-primary)]" aria-hidden />Ranking do mês{ranking.city ? ` em ${ranking.city}/${ranking.uf}` : ""}</h2>
      <p className="mb-3 text-sm text-muted-foreground">Indicações ativadas neste mês. Aparece só quem aceitar, com o primeiro nome. O ranking mostra a posição; os pontos vêm sempre da indicação confirmada.</p>
      {ranking.optedIn && ranking.rows.length ? (
        <ol className="mb-4 space-y-1 text-sm">{ranking.rows.map((r) => <li key={`${r.position}-${r.name}-${r.me}`} className={`flex justify-between gap-2 rounded px-2 py-1 ${r.me ? "bg-surface-muted font-bold" : ""}`}><span>{r.position}º {r.name}{r.me ? " (você)" : ""}</span><span className="tabular-nums">{r.activated}</span></li>)}</ol>
      ) : ranking.optedIn ? <p className="mb-4 text-sm">Ninguém da sua cidade ativou indicação neste mês ainda. Seja o primeiro.</p> : null}
      <form className="grid gap-2 sm:grid-cols-[1fr_6rem_auto] sm:items-end" aria-label="Aparecer no ranking" onSubmit={(e) => { e.preventDefault(); save(true); }}>
        <label className="flex flex-col text-sm font-medium">Cidade<Input required minLength={2} maxLength={80} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className="mt-1" /></label>
        <label className="flex flex-col text-sm font-medium">UF<Select value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value as (typeof BRAS_UFS)[number] })} className="mt-1">{BRAS_UFS.map((u) => <option key={u} value={u}>{u}</option>)}</Select></label>
        <Button type="submit" size="sm" disabled={pending}>{ranking.optedIn ? "Atualizar cidade" : "Aparecer no ranking"}</Button>
      </form>
      {ranking.optedIn ? <Button size="sm" variant="ghost" className="mt-2" disabled={pending} onClick={() => save(false)}>Sair do ranking</Button> : null}
    </section>
  );
}
