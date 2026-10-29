import { Handshake, MapPin, PackageSearch, Store } from "lucide-react";

/**
 * Vivência de rua (D220): a NextLevel está no Brás, no Canindé e em toda a região de São Paulo, ao lado dos maiores
 * importadores chineses e brasileiros. É a proximidade com o atacado que nenhuma plataforma de outro estado tem.
 */
const LUGARES = ["Brás", "Canindé", "São Paulo"];
const PILARES = [
  { icon: MapPin, titulo: "Na rua, perto de você", texto: "Estamos no Brás, no Canindé e em toda a região de São Paulo. Visitamos, conversamos e resolvemos de perto, não de outro estado." },
  { icon: PackageSearch, titulo: "Experiência com os maiores importadores", texto: "Trabalhamos com grandes importadores chineses e brasileiros. Sabemos como o produto chega, como gira e como vende." },
  { icon: Store, titulo: "Foco no atacado", texto: "A plataforma nasceu do dia a dia de quem vende no atacado: a loja, o pedido e o envio pensados para essa rotina." },
  { icon: Handshake, titulo: "Negócio entendido por dentro", texto: "Não somos uma agência olhando de longe. Entendemos o seu negócio porque vivemos a mesma rua que você." },
];

export function VivenciaRua() {
  return (
    <section id="vivencia" aria-labelledby="vivencia-t" className="scroll-mt-16 overflow-hidden bg-canvas px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="im-eyebrow im-eyebrow--claro">Vivência de rua</p>
        <h2 id="vivencia-t" className="im-h2 mt-4 max-w-4xl text-foreground">Quem entende de atacado está na rua, não em outro estado.</h2>
        <p className="mt-4 max-w-2xl text-lg text-body">A NextLevel vive o atacado de São Paulo todos os dias. Essa proximidade vira loja certa, atendimento rápido e decisões que fazem sentido para o seu negócio.</p>
        <p aria-hidden className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-1 font-display text-5xl font-bold leading-none tracking-tight text-[var(--im-acao,var(--ds-primary))] md:text-7xl">
          {LUGARES.map((l, i) => <span key={l} className={i === LUGARES.length - 1 ? "opacity-40" : ""}>{l}</span>)}
        </p>
        <ul className="mt-12 grid gap-x-8 gap-y-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {PILARES.map((p, i) => (
            <li key={p.titulo}>
              <div className="flex items-center justify-between"><span className="ec-icone"><p.icon className="size-5" aria-hidden /></span><span className="ec-indice text-foreground">{String(i + 1).padStart(2, "0")}</span></div>
              <h3 className="mt-3 text-lg font-bold text-foreground">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
