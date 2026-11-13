"use client";
import * as React from "react";
import Link from "next/link";
import { Building2, Check, Megaphone, Store, Users } from "lucide-react";
import { registerPartnerAction } from "@/app/actions/partners";
import { PERFIS, PERFIL_LISTA, type PerfilCaptacao } from "@/lib/finance/captacao-regras";

const field = "mt-1 h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-signal-text)]";
const primary = "inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--brand-signal)] px-6 text-base font-semibold text-[var(--brand-on-signal)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-signal-text)] disabled:opacity-60";
const ghost = "inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-base font-semibold text-foreground";
const ICONE = { indicacao: Users, criador: Megaphone, vendedor: Store, agencia: Building2 } as const;
const PASSOS = ["Perfil", "Dados", "Sobre você", "Aceite"] as const;
const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0)));

/**
 * Cadastro em etapas do parceiro da Commerce (D252, PV4): perfil → dados → qualificação → aceite. A conta nasce na hora
 * (link pronto) e a candidatura entra no funil do Master como Candidato, com a qualificação na linha do tempo.
 */
export function CandidaturaEc({ termsVersion, inicial }: { termsVersion: string; inicial: PerfilCaptacao }) {
  const [passo, setPasso] = React.useState(0);
  const [perfil, setPerfil] = React.useState<PerfilCaptacao>(inicial);
  const [v, setV] = React.useState({ name: "", email: "", password: "", taxId: "", phone: "", region: "", channels: "", followers: "", carteira: "", sobre: "", terms: false });
  const [erro, setErro] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const titulo = React.useRef<HTMLHeadingElement>(null);
  const primeiro = React.useRef(true);
  React.useEffect(() => { if (primeiro.current) { primeiro.current = false; return; } titulo.current?.focus(); }, [passo]);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const validar = (): string | null => {
    if (passo === 1) {
      if (v.name.trim().length < 3) return "Informe o seu nome completo.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) return "Confira o e-mail.";
      if (v.password.length < 8) return "A senha precisa ter ao menos 8 caracteres.";
      if (v.taxId.replace(/\D/g, "").length < 11) return "Informe o CPF ou CNPJ.";
      const d = v.phone.replace(/\D/g, ""); if (d.length < 10 || d.length > 13) return "WhatsApp com DDD.";
    }
    if (passo === 2 && v.region.trim().length < 2) return "Informe a sua cidade ou região.";
    return null;
  };
  const avancar = (e: React.FormEvent) => {
    e.preventDefault(); setErro(null);
    const m = validar(); if (m) { setErro(m); return; }
    if (passo < 3) { setPasso(passo + 1); return; }
    if (!v.terms) { setErro("É preciso aceitar os termos do programa."); return; }
    start(async () => {
      const r = await registerPartnerAction(
        { name: v.name, email: v.email, password: v.password, taxId: v.taxId, phone: v.phone, acceptTerms: true },
        { perfil, region: v.region, channels: v.channels || undefined, followers: num(v.followers), carteira: num(v.carteira), sobre: v.sobre || undefined },
      );
      if (r && !r.ok) setErro(r.error);
    });
  };
  const p = PERFIS[perfil];
  return (
    <form onSubmit={avancar} noValidate aria-describedby={erro ? "cad-erro" : undefined}>
      <ol className="mb-6 flex items-center gap-2" aria-label="Etapas do cadastro">
        {PASSOS.map((t, i) => <li key={t} className="flex flex-1 flex-col gap-1.5" aria-current={i === passo ? "step" : undefined}><span className={`h-1.5 rounded-full ${i <= passo ? "bg-[var(--brand-signal)]" : "bg-surface-muted"}`} /><span className={`text-xs ${i === passo ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{i < passo ? <Check className="mr-0.5 inline size-3" aria-hidden /> : null}{t}</span></li>)}
      </ol>
      <h2 ref={titulo} tabIndex={-1} className="text-lg font-bold outline-none">{passo === 0 ? "Como você vai indicar?" : passo === 1 ? "Seus dados" : passo === 2 ? "Conte um pouco sobre você" : "Quase lá"}</h2>

      {passo === 0 ? (
        <fieldset className="mt-4 grid gap-3"><legend className="sr-only">Perfil</legend>
          {PERFIL_LISTA.map((k) => { const I = ICONE[k]; return (
            <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${perfil === k ? "border-[var(--brand-signal)] bg-surface-muted/60" : "border-border"}`}>
              <input type="radio" name="perfil" value={k} checked={perfil === k} onChange={() => setPerfil(k)} className="mt-1 size-4" />
              <span><span className="flex items-center gap-2 font-semibold"><I className="size-4" aria-hidden />{PERFIS[k].rotulo}</span><span className="mt-0.5 block text-sm text-body">{PERFIS[k].quem}</span></span>
            </label>
          ); })}
        </fieldset>
      ) : null}

      {passo === 1 ? (
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium">Nome completo<input value={v.name} onChange={set("name")} autoComplete="name" className={field} /></label>
          <label className="block text-sm font-medium">E-mail<input value={v.email} onChange={set("email")} type="email" autoComplete="email" className={field} /></label>
          <label className="block text-sm font-medium">Senha (mínimo 8 caracteres)<input value={v.password} onChange={set("password")} type="password" autoComplete="new-password" className={field} /></label>
          <label className="block text-sm font-medium">CPF ou CNPJ<input value={v.taxId} onChange={set("taxId")} inputMode="numeric" autoComplete="off" className={field} /><span className="mt-1 block text-xs text-muted-foreground">O saque por Pix vai sempre para este mesmo CPF ou CNPJ.</span></label>
          <label className="block text-sm font-medium">WhatsApp com DDD<input value={v.phone} onChange={set("phone")} type="tel" autoComplete="tel" className={field} /></label>
        </div>
      ) : null}

      {passo === 2 ? (
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium">Cidade ou região onde você atua<input value={v.region} onChange={set("region")} placeholder="Ex.: São Paulo - Brás" className={field} /></label>
          <label className="block text-sm font-medium">{perfil === "agencia" ? "Site ou Instagram da agência" : "Onde você divulga (Instagram, TikTok, loja física…)"}<input value={v.channels} onChange={set("channels")} className={field} /></label>
          {perfil === "criador" ? <label className="block text-sm font-medium">Quantos seguidores, somando as redes (aproximado)<input value={v.followers} onChange={set("followers")} inputMode="numeric" className={field} /></label> : null}
          {perfil !== "criador" ? <label className="block text-sm font-medium">{perfil === "agencia" ? "Quantos clientes a agência atende hoje" : "Quantos lojistas você visita ou atende"}<input value={v.carteira} onChange={set("carteira")} inputMode="numeric" className={field} /></label> : null}
          <label className="block text-sm font-medium">Algo mais que a equipe deve saber (opcional)<textarea value={v.sobre} onChange={set("sobre")} rows={3} maxLength={400} className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base" /></label>
        </div>
      ) : null}

      {passo === 3 ? (
        <div className="mt-4 space-y-4">
          <dl className="grid gap-1 rounded-2xl bg-surface-muted p-4 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Perfil</dt><dd className="font-semibold">{p.rotulo.replace("Sou ", "")}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Nome</dt><dd className="font-semibold">{v.name}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Região</dt><dd className="font-semibold">{v.region}</dd></div>
          </dl>
          <p className="text-sm text-body">O seu link sai assim que você entrar. A comissão segue o documento do cadastro: com CNPJ, 20% de toda mensalidade desde o 1º cliente; com CPF, você entra no Programa de Indicações, com 15%. {perfil === "agencia" ? "Agência parceira é só com CNPJ e tem benefícios exclusivos, que a equipe apresenta em até 2 dias úteis." : "A equipe NextLevel entra em contato para te ajudar a começar."}</p>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={v.terms} onChange={set("terms")} className="mt-1 size-4" /> <span>Li e aceito os <Link href="/parceiros/termos" target="_blank" className="font-semibold underline underline-offset-2">termos do programa</Link> (versão {termsVersion}).</span></label>
        </div>
      ) : null}

      {erro ? <p id="cad-erro" role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{erro}</p> : null}
      <div className="mt-6 flex gap-3">
        {passo > 0 ? <button type="button" className={ghost} onClick={() => { setErro(null); setPasso(passo - 1); }}>Voltar</button> : null}
        <button type="submit" disabled={pending} className={primary}>{passo < 3 ? "Continuar" : pending ? "Criando sua conta…" : "Criar minha conta de parceiro"}</button>
      </div>
    </form>
  );
}
