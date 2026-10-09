"use client";
import { BRAS_PROFILE_QUESTIONS } from "@/lib/bras/perfil-perguntas";

export type ProfileDraft = { stage: string; channels: string[]; monthlyPurchase: string; revenue: string; importExperience: string; team: string; goals: string[] };
export const EMPTY_PROFILE: ProfileDraft = { stage: "", channels: [], monthlyPurchase: "", revenue: "", importExperience: "", team: "", goals: [] };
/** Todas as perguntas respondidas (as de múltipla escolha com ao menos uma marcada). */
export const profileComplete = (p: ProfileDraft) => BRAS_PROFILE_QUESTIONS.every((q) => { const v = p[q.key]; return Array.isArray(v) ? v.length > 0 : !!v; });

/**
 * Perguntas que classificam o cliente (D108), no cadastro e em "Meu perfil". Opções como cartões tocáveis; sem número
 * de pontos na tela (o membro responde o que é, não o que dá mais pontos).
 */
export function ProfileQuestions({ value, onChange, idPrefix = "pq" }: { value: ProfileDraft; onChange: (v: ProfileDraft) => void; idPrefix?: string }) {
  return (
    <div className="space-y-5">
      {BRAS_PROFILE_QUESTIONS.map((q, qi) => {
        const cur = value[q.key];
        return (
          <fieldset key={q.key}>
            <legend className="text-sm font-semibold">{qi + 1}. {q.label}{q.multi ? <span className="font-normal text-muted-foreground"> (marque quantas quiser)</span> : null}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {q.options.map((o) => {
                const checked = Array.isArray(cur) ? cur.includes(o.key) : cur === o.key;
                const toggle = () => {
                  if (!q.multi) return onChange({ ...value, [q.key]: o.key });
                  const list = cur as string[];
                  // "Ainda não vendo" exclui os canais (e vice-versa).
                  let next = checked ? list.filter((x) => x !== o.key) : [...list, o.key];
                  if (q.key === "channels" && !checked) next = o.key === "ainda_nao" ? ["ainda_nao"] : next.filter((x) => x !== "ainda_nao");
                  onChange({ ...value, [q.key]: next });
                };
                return (
                  <label key={o.key} htmlFor={`${idPrefix}-${q.key}-${o.key}`} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--bd-laranja)] ${checked ? "border-[var(--bd-laranja)] bg-[var(--bd-laranja)]/10 font-semibold" : "border-border"}`}>
                    <input id={`${idPrefix}-${q.key}-${o.key}`} type={q.multi ? "checkbox" : "radio"} name={`${idPrefix}-${q.key}`} checked={checked} onChange={toggle} className="size-4 shrink-0 accent-[var(--bd-laranja)]" />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
