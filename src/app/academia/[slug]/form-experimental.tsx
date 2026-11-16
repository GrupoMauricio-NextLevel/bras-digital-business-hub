"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { pedirAulaExperimentalAction } from "@/app/actions/business-academia";

const TURNOS = [{ v: "MANHA", r: "Manhã" }, { v: "TARDE", r: "Tarde" }, { v: "NOITE", r: "Noite" }] as const;
const rotuloDia = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const campo = "mt-1 block h-11 w-full rounded-lg border border-[#c9cfc3] bg-white px-3 text-base text-[#14161a] outline-none focus:border-[#14161a] focus:ring-2 focus:ring-[#14161a]/20";

export function FormExperimental({ slug, nome, modalidades, dias, meta, whatsapp }: { slug: string; nome: string; modalidades: string[]; dias: string[]; meta: { utm: string; campanha: string; indicacao: string }; whatsapp: string | null }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<{ nome: string; dia: string } | null>(null);

  if (feito) {
    const d = (whatsapp ?? "").replace(/\D/g, "");
    const zap = d.length >= 10 ? `https://wa.me/${d.startsWith("55") ? d : `55${d}`}?text=${encodeURIComponent(`Oi! Sou ${feito.nome} e agendei minha aula experimental${feito.dia ? ` para ${rotuloDia(feito.dia)}` : ""} pela página.`)}` : null;
    return (
      <div className="mt-5 rounded-xl bg-[#eef9d0] p-4" role="status" data-experimental-ok>
        <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="size-5 text-[#3b6b00]" aria-hidden />Pronto, {feito.nome.split(" ")[0]}!</p>
        <p className="mt-1 text-sm text-[#2f3a1a]">A {nome} recebeu o seu pedido{feito.dia ? ` para ${rotuloDia(feito.dia)}` : ""} e vai te chamar no WhatsApp para confirmar.</p>
        {zap ? <a href={zap} target="_blank" rel="noopener" className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-[#14161a] px-4 text-sm font-semibold text-white"><MessageCircle className="size-4" aria-hidden />Falar agora no WhatsApp</a> : null}
      </div>
    );
  }

  return (
    <form
      className="mt-5 grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const dados = { nome: String(f.get("nome") ?? ""), whatsapp: String(f.get("whatsapp") ?? ""), email: String(f.get("email") ?? ""), interesse: String(f.get("interesse") ?? "") || undefined, dia: String(f.get("dia") ?? "") || undefined, turno: String(f.get("turno") ?? "") || undefined, consentimento: f.get("consentimento") === "on" };
        setErro(null);
        iniciar(async () => {
          const r = await pedirAulaExperimentalAction(slug, dados, { ...meta, ref: document.referrer });
          if (r.ok) setFeito({ nome: dados.nome.trim(), dia: dados.dia ?? "" });
          else setErro(r.error);
        });
      }}
    >
      <label className="text-sm font-medium">Seu nome<input name="nome" required minLength={2} maxLength={80} autoComplete="name" className={campo} /></label>
      <label className="text-sm font-medium">WhatsApp com DDD<input name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" className={campo} /></label>
      <label className="text-sm font-medium">E-mail <span className="font-normal text-[#4a5160]">(opcional)</span><input name="email" type="email" autoComplete="email" className={campo} /></label>
      {modalidades.length ? (
        <label className="text-sm font-medium">O que quer treinar?
          <select name="interesse" className={campo} defaultValue=""><option value="">Ainda não sei</option>{modalidades.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </label>
      ) : null}
      {dias.length ? (
        <label className="text-sm font-medium">Dia da aula
          <select name="dia" className={`${campo} capitalize`} defaultValue={dias[0]}>{dias.map((d) => <option key={d} value={d}>{rotuloDia(d)}</option>)}</select>
        </label>
      ) : null}
      <fieldset>
        <legend className="text-sm font-medium">Melhor horário</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {TURNOS.map((t) => (
            <label key={t.v} className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[#c9cfc3] text-sm has-[:checked]:border-[#14161a] has-[:checked]:bg-[#14161a] has-[:checked]:text-white">
              <input type="radio" name="turno" value={t.v} className="sr-only" />{t.r}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-sm text-[#4a5160]">
        <input type="checkbox" name="consentimento" className="mt-0.5 size-4" />
        Aceito receber mensagens da {nome} pelo WhatsApp e e-mail. Posso pedir para parar quando quiser.
      </label>
      {erro ? <p className="rounded-lg bg-[#fde8e8] p-3 text-sm text-[#8a1c1c]" role="alert">{erro}</p> : null}
      <button type="submit" disabled={pendente} className="h-12 rounded-lg bg-[#c8f031] text-base font-bold text-[#101418] hover:bg-[#b6e01c] disabled:opacity-60">{pendente ? "Enviando…" : "Quero minha aula experimental"}</button>
      <p className="text-xs text-[#4a5160]">Seus dados vão só para a academia, para combinar a aula.</p>
    </form>
  );
}
