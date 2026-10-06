import Link from "next/link";
import { Check } from "lucide-react";
import type { Brand } from "@/lib/brand";
import { supportContacts } from "@/lib/support";
import { readableOn } from "@/lib/utils";

const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Portal de um produto que ainda não tem sistema próprio (Brás Digital, Hub Creators, China Hub): diz com clareza o que será,
 * marca como "em breve" e recolhe a lista de espera. Nada aqui promete funcionalidade que ainda não existe.
 */
export function SoonHome({ brand }: { brand: Brand }) {
  const soon = brand.soon!;
  const c = supportContacts();
  const talk = c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Quero saber mais sobre o ${brand.name}.`)}`) : null;
  return (
    <>
      <section className="text-band-foreground" style={{ background: `linear-gradient(180deg, ${brand.primaryColor}, #050505)` }}>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
          <p className="inline-block rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: brand.accentColor, color: "#fff" }}>Em breve</p>
          <h1 className="mt-5 font-[family-name:var(--nl-font-display)] text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{soon.headline}</h1>
          <p className="mt-5 max-w-2xl text-lg text-band-foreground/85">{soon.text}</p>
          {soon.zh ? <p lang="zh-CN" className="mt-4 max-w-2xl text-base text-band-foreground/85"><span className="font-semibold">{soon.zh.headline}</span> · {soon.zh.text}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quero-minha-loja" className={btn} style={{ background: brand.accentColor, color: readableOn(brand.accentColor) }}>{soon.leadTitle}</Link>
            {talk ? <a href={talk} target="_blank" rel="noreferrer" className={`${btn} border border-band-foreground/40 text-band-foreground`}>Falar no WhatsApp</a> : null}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="font-[family-name:var(--nl-font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">O que vem por aí</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {soon.bullets.map((b) => <li key={b} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5"><Check className="mt-0.5 size-5 shrink-0" style={{ color: brand.accentColor }} aria-hidden /><span className="font-medium">{b}</span></li>)}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">Ainda estamos construindo. Deixe o seu contato e a equipe da NextLevel avisa quando abrir, com acesso antecipado para quem entrar na lista.</p>
      </section>
    </>
  );
}
