"use client";
import * as React from "react";
import { toast } from "sonner";
import { Copy, Power } from "lucide-react";
import { alterarLinkAction, criarLinkAction } from "@/app/actions/trafego";

const campo = "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2";
const limpa = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9_.-]/g, "");

/** Formulário do link rastreado (TR1, D290): mostra o link final enquanto a pessoa digita. */
export function FormNovoLink({ marcas, fontes, meios, mesAtual }: { marcas: { code: string; nome: string; base: string }[]; fontes: readonly string[]; meios: readonly string[]; mesAtual: string }) {
  const vazio = { brand: marcas[0]?.code ?? "NEXTLEVEL_COMMERCE", codigo: "", destino: "/", utmSource: "instagram", utmMedium: "bio", utmCampaign: `${mesAtual}-`, utmContent: "", utmTerm: "", nota: "" };
  const [f, setF] = React.useState(vazio);
  const [pending, start] = React.useTransition();
  const set = (k: keyof typeof vazio) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const base = marcas.find((m) => m.code === f.brand)?.base ?? "";
  const previa = (() => {
    const q = new URLSearchParams();
    for (const [k, v] of [["utm_source", f.utmSource], ["utm_medium", f.utmMedium], ["utm_campaign", f.utmCampaign], ["utm_content", f.utmContent], ["utm_term", f.utmTerm]] as const) if (limpa(v)) q.set(k, limpa(v));
    return `${base}${f.destino.startsWith("/") ? f.destino.split("?")[0] : "/"}?${q.toString()}`;
  })();
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await criarLinkAction({ ...f, brand: f.brand as never });
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`Link /l/${r.data.codigo} criado`);
      for (const a of r.data.avisos) toast.warning(a);
      setF({ ...vazio, utmSource: f.utmSource, utmMedium: f.utmMedium, utmCampaign: f.utmCampaign });
    });
  };
  return (
    <form onSubmit={enviar} className="ds-card text-sm" aria-labelledby="novo-link-t">
      <h2 id="novo-link-t" className="text-lg font-bold">Criar link rastreado</h2>
      <p className="mt-1 text-muted-foreground">Use um link destes em tudo: anúncio, bio, story, direct, WhatsApp, e-mail. O clique é contado e a visita chega com a origem certa.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block font-semibold" htmlFor="l-marca">Site</label>
          <select id="l-marca" value={f.brand} onChange={set("brand")} className={campo}>{marcas.map((m) => <option key={m.code} value={m.code}>{m.nome}</option>)}</select>
        </div>
        <div>
          <label className="block font-semibold" htmlFor="l-destino">Página de destino</label>
          <input id="l-destino" value={f.destino} onChange={set("destino")} placeholder="/planos" className={campo} required />
        </div>
        <div>
          <label className="block font-semibold" htmlFor="l-fonte">Origem (utm_source)</label>
          <input id="l-fonte" list="l-fontes" value={f.utmSource} onChange={set("utmSource")} className={campo} required />
          <datalist id="l-fontes">{fontes.map((x) => <option key={x} value={x} />)}</datalist>
        </div>
        <div>
          <label className="block font-semibold" htmlFor="l-meio">Meio (utm_medium)</label>
          <input id="l-meio" list="l-meios" value={f.utmMedium} onChange={set("utmMedium")} className={campo} required />
          <datalist id="l-meios">{meios.map((x) => <option key={x} value={x} />)}</datalist>
        </div>
        <div className="sm:col-span-2">
          <label className="block font-semibold" htmlFor="l-campanha">Campanha (utm_campaign)</label>
          <input id="l-campanha" value={f.utmCampaign} onChange={set("utmCampaign")} placeholder={`${mesAtual}-cadastro-teste3dias`} className={campo} required />
          <p className="mt-1 text-xs text-muted-foreground">Ano e mês na frente, depois o objetivo e a oferta. Ex.: {mesAtual}-cadastro-teste3dias</p>
        </div>
        <div>
          <label className="block font-semibold" htmlFor="l-peca">Peça (utm_content, opcional)</label>
          <input id="l-peca" value={f.utmContent} onChange={set("utmContent")} placeholder="reel-1-dor-direct" className={campo} />
        </div>
        <div>
          <label className="block font-semibold" htmlFor="l-termo">Público ou palavra (utm_term, opcional)</label>
          <input id="l-termo" value={f.utmTerm} onChange={set("utmTerm")} placeholder="amplo" className={campo} />
        </div>
        <div>
          <label className="block font-semibold" htmlFor="l-codigo">Código do link (opcional)</label>
          <input id="l-codigo" value={f.codigo} onChange={set("codigo")} placeholder="bio" className={campo} />
          <p className="mt-1 text-xs text-muted-foreground">Vazio: o sistema cria um código curto.</p>
        </div>
        <div>
          <label className="block font-semibold" htmlFor="l-nota">Onde vai ser usado (opcional)</label>
          <input id="l-nota" value={f.nota} onChange={set("nota")} placeholder="Bio do Instagram da NextLevel" className={campo} />
        </div>
      </div>
      <p className="mt-4 break-all rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">A pessoa chega em:</span> {previa}</p>
      <button type="submit" disabled={pending} className="ds-btn mt-4">{pending ? "Criando…" : "Criar link"}</button>
    </form>
  );
}

export function CopiarLink({ url }: { url: string }) {
  return (
    <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm gap-1" onClick={() => { void navigator.clipboard?.writeText(url).then(() => toast.success("Link copiado"), () => toast.error("Não foi possível copiar")); }}>
      <Copy className="size-4" aria-hidden />Copiar
    </button>
  );
}

export function LigarLink({ id, ativo }: { id: string; ativo: boolean }) {
  const [pending, start] = React.useTransition();
  return (
    <button type="button" disabled={pending} className="ds-btn ds-btn--ghost ds-btn--sm gap-1" aria-pressed={ativo}
      onClick={() => start(async () => { const r = await alterarLinkAction(id, { ativo: !ativo }); if (r.ok) toast.success(ativo ? "Link desligado: quem clicar vai para a página inicial" : "Link ligado"); else toast.error(r.error); })}>
      <Power className="size-4" aria-hidden />{ativo ? "Desligar" : "Ligar"}
    </button>
  );
}
