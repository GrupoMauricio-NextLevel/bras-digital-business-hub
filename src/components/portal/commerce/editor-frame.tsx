import { DEMO_STORES } from "./demo-stores";
import { StoreMock } from "./store-mock";

/**
 * Ilustração do editor de temas com os nomes e botões que ele tem hoje (barra superior, lista de seções, "Adicionar seção",
 * "Cores, fontes e estilo", Desfazer/Refazer, Rascunho salvo, Histórico, Ver loja, Publicar), com uma loja de demonstração.
 * Não é uma captura do editor em uso: é uma ilustração fiel à estrutura dele.
 */
const SECTIONS = ["Barra de anúncio", "Cabeçalho", "Destaque principal", "Faixa de confiança", "Categorias", "Vitrine de produtos", "Banners"];

export function EditorFrame() {
  const store = DEMO_STORES[0]!;
  return (
    <figure className="overflow-hidden rounded-xl border border-[#14213d]/20 bg-white text-neutral-900 shadow-none">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-200 bg-white px-3 py-2 text-[12px]" aria-hidden>
        <b className="text-[13px]">Editor do tema</b>
        <span className="hidden rounded-md border border-neutral-300 px-2 py-1 sm:inline">Página inicial</span>
        <span className="flex overflow-hidden rounded-md border border-neutral-300 text-neutral-600"><i className="bg-neutral-100 px-2 py-1 font-semibold not-italic text-neutral-900">Computador</i><i className="hidden px-2 py-1 not-italic sm:inline">Tablet</i><i className="px-2 py-1 not-italic">Celular</i></span>
        <span className="ml-auto hidden items-center gap-3 text-neutral-600 md:flex"><span>Desfazer · Refazer</span><span className="text-emerald-700">✓ Rascunho salvo</span><span>Histórico</span><span>Ver loja</span></span>
        <span className="rounded-md bg-[#14213d] px-3 py-1 font-semibold text-white">Publicar</span>
      </div>
      <div className="grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
        <div className="hidden border-r border-neutral-200 bg-white p-3 text-[13px] md:block" aria-hidden>
          <p className="rounded-md border border-neutral-300 px-3 py-2 font-medium">Cores, fontes e estilo</p>
          <p className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Página inicial</p>
          <ul>{SECTIONS.map((s, i) => <li key={s} className={`rounded px-2 py-1.5 ${i === 2 ? "bg-[#f2b600]/25 font-semibold" : ""}`}><span className="mr-1.5 text-neutral-400">⋮⋮</span>{s}</li>)}</ul>
          <p className="mt-3 px-2 text-[13px] font-semibold text-[#1f47c9]">+ Adicionar seção</p>
        </div>
        <div className="bg-neutral-100 p-3 sm:p-5"><div className="overflow-hidden rounded-md border border-neutral-300 bg-white"><StoreMock store={store} /></div></div>
      </div>
      <figcaption className="border-t border-neutral-200 bg-[#f5f1e8] px-3 py-1.5 text-[11px] font-medium text-neutral-700">Ilustração do editor de temas com uma loja de demonstração. Os nomes dos botões e das seções são os do editor de hoje.</figcaption>
    </figure>
  );
}
