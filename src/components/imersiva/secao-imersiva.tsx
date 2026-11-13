import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { acervoCompleto, type Acervo } from "@/lib/imersiva/acervo";
import { FotoImersiva } from "./foto";
import { JornadaMarca, type PassoMarca } from "./jornada";
import "./imersiva.css";

export type PortaMarca<N extends string = string> = { foto: N; titulo: string; texto: string; href: string; cta?: string };

/** Quatro portas de entrada (cartões 2:3 com foto e texto embaixo). Mesma peça da home da Commerce (D165). */
export function PortasMarca<N extends string>({ acervo, portas, eyebrow, titulo, texto, className }: { acervo: Acervo<N>; portas: PortaMarca<N>[]; eyebrow: string; titulo: string; texto: string; className?: string }) {
  return (
    <section id="portas" aria-labelledby="portas-t" className={`scroll-mt-16 px-4 py-16 md:py-24 ${className ?? ""}`}>
      <div className="mx-auto max-w-6xl">
        <p className="im-eyebrow im-eyebrow--claro">{eyebrow}</p>
        <h2 id="portas-t" className="im-h2 mt-3 max-w-3xl">{titulo}</h2>
        <p className="mt-4 max-w-2xl text-lg opacity-85">{texto}</p>
        <ul className="im-portas mt-10">
          {portas.map((p) => (
            <li key={p.foto} className="im-surge">
              <Link href={p.href} className="im-porta">
                <FotoImersiva acervo={acervo} nome={p.foto} alt="" sizes="(min-width: 1024px) 18rem, (min-width: 480px) 50vw, 100vw" />
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
                <span data-cta>{p.cta ?? "Começar por aqui"} <ArrowRight className="size-4" aria-hidden /></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Jornada e portas de uma marca cujas fotos podem ainda estar em produção (D167). No ar só com o acervo completo; antes disso
 * aparece apenas na prévia (`/?previa=imersiva`), com o lugar de cada foto reservado e um aviso. Assim a página atual da marca
 * continua igual até as fotos chegarem, e a jornada entra sozinha quando o conversor grava o acervo.
 */
export function SecaoImersiva<N extends string>({ tema, acervo, previa, jornada, portas, portasClassName }: {
  tema: string; acervo: Acervo<N>; previa: boolean;
  jornada: { passos: PassoMarca<N>[]; eyebrow: string; titulo: string; rotulo: string };
  portas: { itens: PortaMarca<N>[]; eyebrow: string; titulo: string; texto: string };
  portasClassName?: string;
}) {
  const completo = acervoCompleto(acervo);
  if (!completo && !previa) return null;
  return (
    <div className={tema}>
      {!completo ? <p className="im-aviso px-4 py-2 text-center" role="note">Prévia da nova página: os quadros coloridos são as fotos em produção. Esta parte só vai ao ar quando as fotos chegarem.</p> : null}
      <JornadaMarca acervo={acervo} passos={jornada.passos} eyebrow={jornada.eyebrow} titulo={jornada.titulo} rotulo={jornada.rotulo} />
      <PortasMarca acervo={acervo} portas={portas.itens} eyebrow={portas.eyebrow} titulo={portas.titulo} texto={portas.texto} className={portasClassName} />
    </div>
  );
}
