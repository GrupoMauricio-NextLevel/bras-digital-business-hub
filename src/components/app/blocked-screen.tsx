import { Lock, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { InvoicePay } from "@/components/finance/invoice-pay";
import { supportContacts } from "@/lib/support";
import { formatBRL } from "@/lib/money";

/**
 * Tela única quando o teste ou a assinatura acabou: como pagar em destaque (Pix com QR code) e o suporte nos quatro cantos.
 * O pagamento libera o sistema sozinho (o painel confere a cada 5 segundos e recarrega).
 */
export function BlockedScreen({ storeName, reason, invoice, demo, logout }: { storeName: string; reason: "TRIAL" | "PLAN" | "NEW"; invoice: { id: string; amountCents: number; description: string }; demo: boolean; logout?: () => Promise<void> }) {
  const c = supportContacts();
  const support = (className: string) => (
    <div className={`fixed z-10 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs shadow-sm ${className}`} data-support-corner>
      <LifeBuoy className="size-3.5 text-accent-foreground" aria-hidden />
      {c.whatsappUrl ? <a href={c.whatsappUrl} target="_blank" rel="noreferrer" className="font-medium underline-offset-2 hover:underline">Suporte {c.whatsappLabel}</a> : c.email ? <a href={`mailto:${c.email}`} className="font-medium underline-offset-2 hover:underline">{c.email}</a> : <span>Fale com o suporte</span>}
    </div>
  );
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground" data-blocked-screen>
      {(["left-3 top-3", "right-3 top-3", "bottom-3 left-3", "bottom-3 right-3"] as const).map((pos) => <div key={pos}>{support(pos)}</div>)}
      <main className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 text-center shadow-lg sm:p-8">
        <Logo className="mx-auto h-8" />
        <span className="mx-auto mt-6 flex size-12 items-center justify-center rounded-full bg-warning-soft text-warning"><Lock className="size-6" aria-hidden /></span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{reason === "NEW" ? "Falta só o pagamento para liberar sua loja" : reason === "TRIAL" ? "Seu teste gratuito terminou" : "Sua assinatura venceu"}</h1>
        <p className="mt-2 text-muted-foreground">{reason === "NEW" ? <>A loja <b className="text-foreground">{storeName}</b> foi criada. Pague por Pix e o acesso ao plano escolhido é liberado na hora, sem precisar falar com ninguém.</> : <>O acesso à loja <b className="text-foreground">{storeName}</b> está pausado. Seus dados estão guardados. Pague por Pix e o sistema é liberado na hora, sem precisar falar com ninguém.</>}</p>
        <div className="mt-6 rounded-xl border-2 border-accent bg-accent-soft/40 p-5">
          <p className="text-sm font-medium">{invoice.description}</p>
          <p className="text-4xl font-extrabold tabular-nums">{formatBRL(invoice.amountCents)}</p>
          <div className="mt-4 flex justify-center"><InvoicePay key={invoice.id} invoiceId={invoice.id} label="Pagar com Pix (QR code)" demo={demo} autoOpen large /></div>
          <ol className="mt-4 space-y-1 text-left text-sm text-muted-foreground"><li>1. Toque em “Pagar com Pix” e abra o app do seu banco.</li><li>2. Escaneie o QR code ou use o Pix copia e cola.</li><li>3. Assim que o pagamento cair, o painel é liberado sozinho.</li></ol>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
          {c.whatsappUrl ? <a href={c.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-medium hover:bg-surface-muted"><MessageCircle className="size-4" aria-hidden /> Falar com o suporte</a> : null}
          {c.email ? <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-medium hover:bg-surface-muted"><Mail className="size-4" aria-hidden /> {c.email}</a> : null}
        </div>
        {logout ? <form action={logout} className="mt-4"><button className="text-xs text-muted-foreground underline">Sair</button></form> : null}
      </main>
    </div>
  );
}
