"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Check, X } from "lucide-react";
import { capturarLeadSaidaAction } from "@/app/actions/leads";

/**
 * Janela de resgate na saída (D280): no computador, abre quando o mouse sai pelo topo da página (indo fechar a aba ou
 * trocar de endereço); no celular, quando o visitante sobe a página rápido depois de ter lido boa parte dela. Uma vez a
 * cada 7 dias por navegador, nunca nas páginas de cadastro, login e textos legais. Só promete o que existe (dados reais).
 */
type Props = { trialDays: number | null; temasGratis: number; taxaZero: boolean; black: string | null; cadastro: string };

const CHAVE = "nl-resgate-saida";
const INTERVALO = 7 * 86_400_000;
const FORA = ["/cadastro", "/login", "/termos", "/privacidade", "/esqueci-senha", "/redefinir-senha"];

export function ResgateSaida(p: Props) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (FORA.some((f) => pathname.startsWith(f))) return;
    try { const v = Number(localStorage.getItem(CHAVE) ?? 0); if (v && Date.now() - v < INTERVALO) return; } catch { /* sem armazenamento: segue */ }
    const inicio = Date.now();
    let feito = false;
    // Conta como visto ao abrir (quem deixou o e-mail e saiu pelo link não vê de novo).
    const mostrar = () => { if (feito || Date.now() - inicio < 5000) return; feito = true; setOpen(true); try { localStorage.setItem(CHAVE, String(Date.now())); } catch { /* ignora */ } };
    // Computador: o mouse sai pelo topo da janela.
    const saida = (e: MouseEvent) => { if (!e.relatedTarget && e.clientY <= 0) mostrar(); };
    // Celular: subida rápida depois de ter descido pelo menos 40% da página.
    let ultimoY = window.scrollY, ultimoT = performance.now(), fundo = 0;
    const rolagem = () => {
      const y = window.scrollY, t = performance.now();
      fundo = Math.max(fundo, y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
      if (window.matchMedia("(pointer: coarse)").matches && fundo > 0.4 && ultimoY - y > 120 && t - ultimoT < 250) mostrar();
      ultimoY = y; ultimoT = t;
    };
    document.addEventListener("mouseout", saida);
    window.addEventListener("scroll", rolagem, { passive: true });
    return () => { document.removeEventListener("mouseout", saida); window.removeEventListener("scroll", rolagem); };
  }, [pathname]);
  const mudar = (o: boolean) => { setOpen(o); if (!o) { try { localStorage.setItem(CHAVE, String(Date.now())); } catch { /* ignora */ } } };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={mudar}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#050a18]/70 backdrop-blur-[2px] motion-safe:animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[71] max-h-[94svh] w-[min(94vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto focus:outline-none" data-resgate-saida>
          <Cartao {...p} pathname={pathname} fechar={() => mudar(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Cartao(p: Props & { pathname: string; fechar: () => void }) {
  const [email, setEmail] = React.useState("");
  const [ok, setOk] = React.useState(false);
  const [aceito, setAceito] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const idEmail = React.useId(), idAceite = React.useId(), idErro = React.useId();
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setErro("");
    if (!aceito) { setErro("Marque a caixa para concordar em receber comunicações."); return; }
    setBusy(true);
    const r = await capturarLeadSaidaAction({ email, consent: aceito, pagina: p.pathname });
    setBusy(false);
    if (r.ok) setOk(true); else setErro(r.error ?? "Não deu certo. Tente de novo.");
  };
  const selos = [p.trialDays ? `${p.trialDays} dias grátis` : null, p.taxaZero ? "Taxa zero nas vendas" : null, p.black].filter((x): x is string => !!x).slice(0, 2);
  const beneficios = [
    p.trialDays ? `${p.trialDays} dias de teste com tudo liberado` : null,
    p.temasGratis > 0 ? `${p.temasGratis} temas profissionais grátis` : null,
    p.taxaZero ? "Taxa zero da plataforma sobre as suas vendas" : null,
    "O dinheiro das vendas cai direto na sua conta",
  ].filter((x): x is string => !!x).slice(0, 3);
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(120%_90%_at_100%_0%,#2f5cff_0%,#14318f_38%,#0a1634_75%)] p-6 text-white shadow-[0_30px_80px_-20px_rgba(5,10,24,.7)] ring-1 ring-white/10 sm:p-9">
      <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 size-72 rounded-full bg-[#27c7f2]/25 blur-3xl" />
      <DialogPrimitive.Close aria-label="Fechar" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X className="size-5" aria-hidden /></DialogPrimitive.Close>
      {selos.length ? <p className="relative flex flex-wrap gap-2 pr-12">{selos.map((s, i) => <span key={s} className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[.08em] ${i ? "border-[#2be38b]/70 text-[#7ff5bd]" : "border-[#7fb0ff]/70 text-[#cfe0ff]"}`}>{s}</span>)}</p> : null}
      <div className="relative mt-6 grid items-center gap-6 sm:grid-cols-[1fr_190px]">
        <div>
          <DialogPrimitive.Title className="text-[clamp(1.9rem,5vw,2.75rem)] font-extrabold leading-[1.02] tracking-tight">
            Espera! Sua loja virtual <span className="text-[#ffd25a]">pode estar no ar hoje.</span>
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-3 text-[15px] leading-relaxed text-[#d7e3ff]">
            Deixe o seu e-mail e receba o caminho para criar a sua loja na NextLevel Commerce, sem complicação.
          </DialogPrimitive.Description>
        </div>
        {p.trialDays ? (
          <div aria-hidden className="mx-auto hidden size-[170px] items-center justify-center rounded-full bg-[conic-gradient(from_200deg,#27c7f2,#2be38b,#2f5cff,#27c7f2)] sm:flex">
            <div className="flex size-[160px] flex-col items-center justify-center rounded-full bg-[#0a1634] text-center">
              <span className="text-6xl font-black leading-none tabular-nums">{p.trialDays}</span>
              <span className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-[#7ff5bd]">dias grátis</span>
            </div>
          </div>
        ) : null}
      </div>
      <ul className="relative mt-5 grid gap-1.5 text-sm text-[#e6eeff]">
        {beneficios.map((b) => <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#2be38b]" aria-hidden />{b}</li>)}
      </ul>
      {ok ? (
        <div className="relative mt-6 grid gap-3 rounded-2xl bg-white/10 p-4" role="status">
          <p className="font-semibold">Pronto! Enviamos o caminho para o seu e-mail.</p>
          <Link href={p.cadastro} onClick={p.fechar} className="inline-flex w-fit items-center gap-2 rounded-full bg-[#21d97a] px-6 py-3 font-extrabold uppercase tracking-wide text-[#05210f] transition hover:bg-[#3ae88c]">Criar minha loja agora <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="relative mt-6 grid gap-3" noValidate>
          <label htmlFor={idEmail} className="sr-only">Seu e-mail</label>
          <input id={idEmail} type="email" required autoComplete="email" inputMode="email" placeholder="Digite seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={erro ? idErro : undefined} className="h-14 w-full rounded-full border-0 bg-white px-6 text-base text-[#0b1328] placeholder:text-[#6b7590] focus:outline-none focus:ring-4 focus:ring-[#7fb0ff]/60" />
          <label htmlFor={idAceite} className="flex items-start gap-2.5 text-xs leading-relaxed text-[#d7e3ff]">
            <input id={idAceite} type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#21d97a]" />
            <span>Concordo em receber comunicações da NextLevel por e-mail. Leia a nossa <Link href="/privacidade" target="_blank" className="font-semibold underline">Política de privacidade</Link> e os <Link href="/termos" target="_blank" className="font-semibold underline">Termos de uso</Link>.</span>
          </label>
          {erro ? <p id={idErro} role="alert" className="text-sm font-semibold text-[#ffb4b4]">{erro}</p> : null}
          <button type="submit" disabled={busy} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#21d97a] px-6 text-base font-extrabold uppercase tracking-wide text-[#05210f] shadow-[0_10px_30px_-8px_rgba(33,217,122,.7)] transition hover:bg-[#3ae88c] disabled:opacity-70">
            {busy ? "Enviando…" : "Quero minha loja"} <ArrowRight className="size-5" aria-hidden />
          </button>
        </form>
      )}
    </div>
  );
}
