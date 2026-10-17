import { formatBRL } from "@/lib/money";
import type { DemoStore } from "./demo-stores";

/** Foto com dimensões reservadas, carregamento tardio (a primeira dobra passa `eager`). */
export function Photo({ src, alt = "", className, eager = false, ratio = "4/5" }: { src: string; alt?: string; className?: string; eager?: boolean; ratio?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- fotos estáticas de demonstração, já comprimidas
  return <img src={src} alt={alt} width={900} height={1125} loading={eager ? "eager" : "lazy"} decoding="async" {...(eager ? { fetchPriority: "high" as const } : {})} className={className} style={{ aspectRatio: ratio, objectFit: "cover", width: "100%" }} />;
}

/** Moldura de navegador com a identificação de demonstração. */
export function BrowserFrame({ children, label, className = "" }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <figure className={`overflow-hidden rounded-xl border border-[#14213d]/15 bg-white ${className}`}>
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-[#ece7dc] px-3 py-2" aria-hidden>
        <span className="flex gap-1.5"><i className="size-2.5 rounded-full bg-[#14213d]/25" /><i className="size-2.5 rounded-full bg-[#14213d]/25" /><i className="size-2.5 rounded-full bg-[#14213d]/25" /></span>
        <span className="min-w-0 flex-1 truncate rounded bg-white/80 px-3 py-0.5 text-[11px] text-neutral-600">sualoja.com.br</span>
      </div>
      {children}
      <figcaption className="border-t border-neutral-200 bg-[var(--ec-gelo)] px-3 py-1.5 text-[11px] font-medium text-neutral-700">{label}</figcaption>
    </figure>
  );
}

const money = (c: number) => formatBRL(c);

/** Loja de demonstração no estilo de cada tema existente (Starter, Editorial, Signature). Só ilustra: não é o motor de temas. */
export function StoreMock({ store, eager = false }: { store: DemoStore; eager?: boolean }) {
  const shown = store.products;
  if (store.theme === "editorial") {
    return (
      <div className="bg-[#faf7f2] text-[#1c1917]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <div className="border-b border-[#1c1917]/10 px-4 py-3 text-center">
          <p className="text-sm tracking-[0.32em]">{store.name.toUpperCase()}</p>
          <ul className="mt-2 flex justify-center gap-4 text-[11px] tracking-wide text-[#44403c] sm:gap-6">{store.nav.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
        <div className="relative">
          <Photo src={store.banner.img} alt="" eager={eager} ratio="16/8" className="max-h-72" />
          <div className="absolute inset-y-0 left-0 flex max-w-[62%] flex-col justify-center gap-2 bg-gradient-to-r from-[#faf7f2]/90 via-[#faf7f2]/70 to-transparent p-4 sm:p-7">
            <p className="text-lg leading-tight sm:text-2xl">{store.banner.title}</p>
            <p className="hidden text-xs text-[#44403c] sm:block">{store.banner.text}</p>
            <span className="mt-1 inline-flex w-fit border border-[#1c1917] px-3 py-1.5 text-[11px] tracking-wide">{store.banner.cta}</span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-4 p-4 sm:grid-cols-4">
          {shown.map((pr) => (
            <li key={pr.name}><Photo src={pr.img} ratio="1/1" className="" /><p className="mt-2 text-[12px] leading-snug">{pr.name}</p><p className="text-[12px] text-[#a16207]">{money(pr.priceCents)}</p></li>
          ))}
        </ul>
      </div>
    );
  }
  const sig = store.theme === "signature";
  return (
    <div className="bg-white text-neutral-900" style={{ fontFamily: "var(--nl-font-text), ui-sans-serif, system-ui, sans-serif" }}>
      {sig ? <div className="flex justify-between bg-neutral-900 px-4 py-1.5 text-[11px] text-white"><span>Frete grátis acima de {money(29900)}</span><span className="hidden sm:inline">Parcele em até 6x</span></div> : null}
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <span className="text-sm font-extrabold tracking-tight">{store.name}</span>
        <ul className="hidden gap-4 text-[12px] text-neutral-600 sm:flex">{store.nav.map((n) => <li key={n}>{n}</li>)}</ul>
        {sig ? <span className="ml-auto hidden flex-1 max-w-[11rem] rounded-md border border-neutral-300 px-2 py-1 text-[11px] text-neutral-500 sm:block">Buscar produtos</span> : <span className="ml-auto text-[12px] text-neutral-600">Carrinho (0)</span>}
      </div>
      <div className={`relative ${sig ? "m-3 overflow-hidden rounded-xl" : "m-3 overflow-hidden rounded-[20px]"}`}>
        <Photo src={store.banner.img} alt="" eager={eager} ratio="16/7" className="max-h-60" />
        <div className="absolute inset-y-0 left-0 flex max-w-[60%] flex-col justify-center gap-1.5 bg-gradient-to-r from-black/65 via-black/35 to-transparent p-4 text-white sm:p-6">
          <p className="text-base font-extrabold leading-tight sm:text-xl">{store.banner.title}</p>
          <p className="hidden text-xs text-white/90 sm:block">{store.banner.text}</p>
          <span className="mt-1 inline-flex w-fit rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-900">{store.banner.cta}</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3 px-3 pb-4 sm:grid-cols-4">
        {shown.map((pr) => (
          <li key={pr.name} className="min-w-0">
            <div className={`relative overflow-hidden bg-neutral-100 ${sig ? "rounded-lg" : "rounded-2xl"}`}>
              <Photo src={pr.img} ratio="1/1" />
              {pr.tag ? <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-neutral-900">{pr.tag}</span> : null}
            </div>
            <p className="mt-1.5 truncate text-[12px] font-medium">{pr.name}</p>
            <p className="text-[12px] font-bold">{money(pr.priceCents)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
