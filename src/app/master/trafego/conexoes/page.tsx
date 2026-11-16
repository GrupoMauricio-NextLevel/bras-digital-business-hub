import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { getTagsAnuncio } from "@/lib/domain/trafego/tags";
import { AbasTrafego } from "../abas";
import { FormTags } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pixel e Google · Tráfego" };

/** Tráfego e campanhas → Pixel e Google (TR4, D295). */
export default async function ConexoesPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const t = await getTagsAnuncio(await getDb());
  const status = [
    { nome: "Pixel da Meta", ok: !!t.metaPixelId, mede: "Visitas, cliques no WhatsApp e contatos deixados, para os anúncios do Instagram e Facebook." },
    { nome: "Google Ads", ok: !!(t.googleAdsId && t.googleAdsLeadLabel), mede: t.googleAdsId && !t.googleAdsLeadLabel ? "Falta o rótulo da conversão \"Contato\"." : "Contatos deixados a partir de anúncios do Google." },
    { nome: "Google Analytics 4", ok: !!t.ga4Id, mede: "Visitas e contatos no relatório do Google (opcional: o painel Agora no site já mede)." },
  ];
  return (
    <>
      <PageHeader eyebrow="Crescimento" title="Tráfego e campanhas" description="Ligue o Pixel da Meta e o Google no site da NextLevel. Eles só carregam para quem aceitar os anúncios no aviso de cookies." />
      <AbasTrafego ativa="conexoes" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <FormTags inicial={t} />
        <aside className="grid content-start gap-4 text-sm">
          <section className="ds-card" aria-labelledby="estado-t">
            <h2 id="estado-t" className="text-lg font-bold">Como está agora</h2>
            <ul className="mt-3 space-y-3">
              {status.map((s) => <li key={s.nome}><div className="flex items-center gap-2"><b>{s.nome}</b><Badge tone={s.ok ? "success" : "neutral"} dot>{s.ok ? "Ligado" : "Desligado"}</Badge></div><p className="mt-1 text-muted-foreground">{s.mede}</p></li>)}
            </ul>
          </section>
          <section className="ds-card" aria-labelledby="conta-t">
            <h2 id="conta-t" className="text-lg font-bold">O que cada uma conta</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li><b className="text-foreground">Página vista</b> em todas as páginas públicas.</li>
              <li><b className="text-foreground">Contato</b> quando a pessoa clica no WhatsApp.</li>
              <li><b className="text-foreground">Lead</b> quando deixa o contato (lista de espera, janela de saída, diagnóstico), com o mesmo número que o servidor vai mandar na próxima fase, para não contar duas vezes.</li>
              <li><b className="text-foreground">Cadastro e pagante</b> vão pelo servidor na próxima fase (TR5), com o resultado real do Comercial.</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
