/** Faixa em loop com o que a loja já traz hoje. Sem movimento (e sem repetição) para quem prefere movimento reduzido. */
const ITEMS = ["Temas prontos", "Editor visual", "Pix com confirmação automática", "Cartão em até 6x", "Melhor Envio, Frenet e Correios", "Pixel da Meta, Google e TikTok", "Tiny e Omie", "Pedidos da loja, do WhatsApp e do Instagram", "Clientes", "Análise de vendas", "Prévia antes de publicar", "Domínio próprio no plano de loja própria"];

export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((t) => <li key={t} className="flex items-center whitespace-nowrap px-6 text-[15px] font-bold text-primary-foreground"><span aria-hidden className="mr-6 inline-block size-2 rotate-45 bg-primary-foreground" />{t}</li>)}
    </ul>
  );
  return (
    <div className="cm-marquee overflow-hidden border-y border-border bg-primary py-3.5" role="region" aria-label="O que a loja já traz hoje">
      <div className="cm-marquee-track">{row(false)}{row(true)}</div>
    </div>
  );
}
