import { ArrowUpRight } from "lucide-react";
import { DEMO_STORES } from "./demo-stores";
import { Phone, Tablet } from "./device";
import { OrdersCards, PayScreen } from "./panel-ui";
import { StoreMock } from "./store-mock";

const card = "group relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[1.75rem] p-6 sm:p-8";

/** "Venda onde seu cliente está": mosaico assimétrico. Só canais que existem hoje (loja virtual, Pix e cartão, pedidos do WhatsApp e do Instagram). */
export function Bento() {
  const casa = DEMO_STORES[1]!;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:grid-rows-2">
      <a href="#exemplos" className={`${card} cm-reveal bg-[#14213d] text-[#f5f1e8] lg:row-span-2 lg:min-h-[40rem]`}>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#f2b600]">Loja online</p>
          <h3 className="mt-2 max-w-sm font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight sm:text-4xl">Vitrine com a cara da sua marca</h3>
        </div>
        <div className="-mx-2 mt-6 translate-y-6 transition-transform duration-500 group-hover:translate-y-2 sm:mx-6"><Tablet><StoreMock store={casa} /></Tablet></div>
        <ArrowUpRight aria-hidden className="absolute right-6 top-6 size-7 text-[#f5f1e8]/70 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </a>

      <a href="#operacao" className={`${card} cm-reveal bg-[#f2b600] text-[#14213d]`}>
        <div className="relative z-10">
          <p className="text-sm font-bold uppercase tracking-wider text-[#14213d]/70">Pagamento</p>
          <h3 className="mt-2 max-w-[14rem] font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight">Pix e cartão em até 6x</h3>
        </div>
        <div className="absolute -bottom-16 right-6 w-[13.5rem] transition-transform duration-500 group-hover:-translate-y-3 sm:right-10"><Phone><PayScreen /></Phone></div>
        <ArrowUpRight aria-hidden className="absolute right-6 top-6 size-7 text-[#14213d]/70" />
      </a>

      <a href="#operacao" className={`${card} cm-reveal bg-[#e7e1d3] text-[#14213d]`}>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#1f47c9]">Pedidos</p>
          <h3 className="mt-2 max-w-xs font-[family-name:var(--nl-font-display)] text-3xl font-extrabold leading-tight">Loja, WhatsApp e Instagram no mesmo painel</h3>
        </div>
        <div className="mt-6 text-neutral-900"><OrdersCards /></div>
        <ArrowUpRight aria-hidden className="absolute right-6 top-6 size-7 text-[#14213d]/70" />
      </a>
    </div>
  );
}
