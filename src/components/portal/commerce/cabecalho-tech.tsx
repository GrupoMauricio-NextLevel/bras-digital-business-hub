/**
 * Cabeçalho das páginas internas da NextLevel E-commerce (D223): faixa marinho com grade e brilho, rótulo em mono, título
 * grande (trecho em `<em>` ganha degradê) e, opcionalmente, números reais em destaque. Estilos em `tech.css`.
 */
export function CabecalhoTech({ rotulo, titulo, texto, dados, children }: { rotulo: string; titulo: React.ReactNode; texto?: React.ReactNode; dados?: { rotulo: string; valor: string }[]; children?: React.ReactNode }) {
  return (
    <section className="ec-cabecalho" aria-labelledby="cabecalho-t">
      <div className="mx-auto max-w-6xl px-4">
        <p className="ec-mono text-[#7dd3fc]"><span aria-hidden className="mr-2 opacity-60">{"//"}</span>{rotulo}</p>
        <h1 id="cabecalho-t" className="ec-cabecalho-titulo">{titulo}</h1>
        {texto ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#b9c6e4]">{texto}</p> : null}
        {dados?.length ? <dl className="ec-dados">{dados.map((d) => <div key={d.rotulo} className="ec-dado"><dt>{d.rotulo}</dt><dd>{d.valor}</dd></div>)}</dl> : null}
        {children}
      </div>
    </section>
  );
}
