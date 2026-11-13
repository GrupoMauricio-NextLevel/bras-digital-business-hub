"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { salvarTagsAnuncioAction } from "@/app/actions/trafego";
import type { TagsAnuncio } from "@/lib/domain/trafego/tags";

const campo = "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono";
const CAMPOS: { k: keyof TagsAnuncio; rotulo: string; exemplo: string; onde: string }[] = [
  { k: "metaPixelId", rotulo: "Pixel da Meta (número do conjunto de dados)", exemplo: "123456789012345", onde: "Meta: Gerenciador de Eventos → Fontes de dados → o Pixel → Configurações → \"Identificação\"." },
  { k: "googleAdsId", rotulo: "Google Ads: código da conta de conversão", exemplo: "AW-1234567890", onde: "Google Ads: Metas → Conversões → a ação \"Contato\" → Configuração da tag → \"Usar o Google tag\": o código AW-…" },
  { k: "googleAdsLeadLabel", rotulo: "Google Ads: rótulo da conversão \"Contato\"", exemplo: "AbCdEfGhIjK", onde: "No mesmo lugar, o texto depois da barra em send_to: 'AW-…/ESTE-TEXTO'." },
  { k: "ga4Id", rotulo: "Google Analytics 4 (opcional)", exemplo: "G-ABC123XYZ", onde: "Analytics: Administrador → Fluxos de dados → o site → \"ID da métrica\"." },
];

/** Números do Pixel da Meta e do Google (TR4, D295). */
export function FormTags({ inicial }: { inicial: TagsAnuncio }) {
  const router = useRouter();
  const [v, setV] = React.useState(inicial);
  const [pending, start] = React.useTransition();
  return (
    <form className="ds-card text-sm" aria-labelledby="tags-t" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await salvarTagsAnuncioAction(v); if (r.ok) { toast.success("Salvo. As tags passam a carregar para quem aceitar os anúncios no aviso de cookies."); router.refresh(); } else toast.error(r.error); }); }}>
      <h2 id="tags-t" className="text-lg font-bold">Números das ferramentas</h2>
      <p className="mt-1 text-muted-foreground">Cole só os números. Deixe em branco o que ainda não tem. Nada de senha ou token aqui.</p>
      <div className="mt-4 grid gap-5">
        {CAMPOS.map((c) => (
          <div key={c.k}>
            <label className="block font-semibold" htmlFor={`tag-${c.k}`}>{c.rotulo}</label>
            <input id={`tag-${c.k}`} value={v[c.k] ?? ""} onChange={(e) => setV({ ...v, [c.k]: e.target.value.trim() || null })} placeholder={c.exemplo} autoComplete="off" spellCheck={false} className={campo} aria-describedby={`tag-${c.k}-onde`} />
            <p id={`tag-${c.k}-onde`} className="mt-1 text-xs text-muted-foreground">{c.onde}</p>
          </div>
        ))}
      </div>
      <button type="submit" disabled={pending} className="ds-btn mt-5">{pending ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}
