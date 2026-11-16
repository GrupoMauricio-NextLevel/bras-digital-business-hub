"use client";
import { useState, useTransition } from "react";
import { salvarPaginaAcademiaAction } from "@/app/actions/business-academia";
import type { ConfigAcademia } from "@/lib/domain/business/academia";
import { Input, Textarea } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const linhas = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);

export function FormPaginaAcademia({ inicial, pagina }: { inicial: ConfigAcademia; pagina: string }) {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [dias, setDias] = useState<number[]>(inicial.diasExperimental);
  return (
    <form
      className="ds-card grid max-w-3xl gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const v = (k: string) => String(f.get(k) ?? "");
        const dados = { chamada: v("chamada"), sobre: v("sobre"), bairro: v("bairro"), cidade: v("cidade"), horarios: v("horarios"), modalidades: linhas(v("modalidades")), destaques: linhas(v("destaques")), diasExperimental: dias };
        setMsg(null);
        iniciar(async () => { const r = await salvarPaginaAcademiaAction(dados); setMsg(r.ok ? { ok: true, texto: "Página salva." } : { ok: false, texto: r.error }); });
      }}
    >
      <label className="grid gap-1 text-sm font-medium">Chamada principal<Input name="chamada" defaultValue={inicial.chamada} maxLength={120} required /></label>
      <label className="grid gap-1 text-sm font-medium">Sobre a academia<Textarea name="sobre" defaultValue={inicial.sobre} maxLength={600} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Bairro<Input name="bairro" defaultValue={inicial.bairro} maxLength={60} /></label>
        <label className="grid gap-1 text-sm font-medium">Cidade<Input name="cidade" defaultValue={inicial.cidade} maxLength={60} /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Modalidades <span className="font-normal text-muted-foreground">(uma por linha)</span><Textarea name="modalidades" defaultValue={inicial.modalidades.join("\n")} /></label>
      <label className="grid gap-1 text-sm font-medium">Destaques <span className="font-normal text-muted-foreground">(um por linha, até 6)</span><Textarea name="destaques" defaultValue={inicial.destaques.join("\n")} /></label>
      <label className="grid gap-1 text-sm font-medium">Horários de funcionamento<Textarea name="horarios" defaultValue={inicial.horarios} maxLength={200} /></label>
      <fieldset>
        <legend className="text-sm font-medium">Dias em que aceita aula experimental</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIAS.map((d, i) => (
            <label key={d} className="ds-chip cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
              <input type="checkbox" className="sr-only" checked={dias.includes(i)} onChange={(e) => setDias((x) => (e.target.checked ? [...x, i].sort() : x.filter((y) => y !== i)))} />{d}
            </label>
          ))}
        </div>
      </fieldset>
      {msg ? <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-success" : "text-sm text-danger"}>{msg.texto}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pendente}>Salvar página</Button>
        <a href={pagina} target="_blank" rel="noopener" className={buttonVariants({ variant: "secondary" })}>Ver página</a>
      </div>
    </form>
  );
}
