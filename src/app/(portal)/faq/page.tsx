import type { Metadata } from "next";
import { FAQ } from "../content";

export const metadata: Metadata = { title: "Perguntas frequentes" };

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tracking-tight">Perguntas frequentes</h1>
      <div className="mt-8 space-y-3">{FAQ.map((f) => <details key={f.q} className="rounded-xl border border-neutral-200 p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-neutral-600">{f.a}</p></details>)}</div>
    </div>
  );
}
