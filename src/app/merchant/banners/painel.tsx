"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Eye, EyeOff, ImagePlus, Lock, Megaphone, Plus, Smartphone, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaLibraryProvider, useMediaLibrary } from "@/components/theme-editor/media-library";
import { publishThemeAction, saveGlobalsDraftAction, saveTemplateDraftAction } from "@/app/actions/theme";
import { pontosDeBanner, type PontoBanner } from "@/lib/themes/pontos-banner";
import { addBlock, removeBlock, setBlockSetting, setSetting } from "@/lib/themes/template";
import type { ThemeLevel } from "@/lib/themes/levels";
import type { PageKind, Template, ThemeGlobals } from "@/lib/themes/types";

type Doc = { home: Template; collection: Template; globals: ThemeGlobals };
type Props = { slug: string; nivel: ThemeLevel; tema: string; inicial: Doc; revisoes: Record<PageKind | "globals", number> };

const ROTULO: Record<string, string> = { title: "Título", subtitle: "Texto", ctaLabel: "Texto do botão", link: "Link", eyebrow: "Chamada curta", category: "Categoria" };
const thumb = (src: string) => (/^\/assets\//.test(src) ? `${src}?w=480` : src);

/** Painel de banners (D238): lista os pontos, edita o rascunho localmente e publica tudo de uma vez. */
export function BannersPainel(props: Props) {
  return <MediaLibraryProvider><Painel {...props} /></MediaLibraryProvider>;
}

function Painel({ slug, nivel, tema, inicial, revisoes }: Props) {
  const router = useRouter();
  const pick = useMediaLibrary();
  const [doc, setDoc] = React.useState<Doc>(inicial);
  const [sujo, setSujo] = React.useState<Set<"home" | "collection" | "globals">>(new Set());
  const [rev, setRev] = React.useState(revisoes);
  const [pending, start] = React.useTransition();
  const [versao, setVersao] = React.useState(0);
  const pontos = React.useMemo(() => pontosDeBanner({ home: doc.home, collection: doc.collection }, nivel), [doc, nivel]);
  const avisoId = Object.keys(doc.globals.header.sections).find((k) => doc.globals.header.sections[k]!.type === "announcement-bar");
  const aviso = avisoId ? String(doc.globals.header.sections[avisoId]!.settings.text ?? "") : null;

  const mudar = (pagina: "home" | "collection", fn: (t: Template) => Template) => {
    try { setDoc((d) => ({ ...d, [pagina]: fn(d[pagina]) })); setSujo((s) => new Set(s).add(pagina)); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível mudar."); }
  };
  const campo = (p: PontoBanner, blockId: string, id: string, v: string) => mudar(p.pagina as "home" | "collection", (t) => setBlockSetting(t, p.sectionId, blockId, id, v));
  const imagem = async (p: PontoBanner, blockId: string, id: "image" | "imageMobile") => { const url = await pick?.({}); if (url) campo(p, blockId, id, url); };
  const ocultar = (p: PontoBanner, blockId: string, hidden: boolean) => mudar(p.pagina as "home" | "collection", (t) => {
    const s = t.sections[p.sectionId]!; return { ...t, sections: { ...t.sections, [p.sectionId]: { ...s, blocks: { ...s.blocks, [blockId]: { ...s.blocks[blockId]!, hidden } } } } };
  });
  const novo = (p: PontoBanner) => mudar(p.pagina as "home" | "collection", (t) => addBlock(t, p.sectionId, p.bloco).template);
  const remover = (p: PontoBanner, blockId: string) => mudar(p.pagina as "home" | "collection", (t) => removeBlock(t, p.sectionId, blockId));
  const mudarAviso = (texto: string) => {
    if (!avisoId) return;
    setDoc((d) => {
      const h = setSetting(d.globals.header, avisoId, "text", texto);
      const s = h.sections[avisoId]!;
      return { ...d, globals: { ...d.globals, header: { ...h, sections: { ...h.sections, [avisoId]: { ...s, hidden: !texto.trim() } } } } };
    });
    setSujo((s) => new Set(s).add("globals"));
  };

  const publicar = () => start(async () => {
    const r2 = { ...rev };
    for (const pg of ["home", "collection"] as const) {
      if (!sujo.has(pg)) continue;
      const r = await saveTemplateDraftAction(pg, doc[pg], r2[pg]);
      if (!r.ok) { toast.error(r.error); return; }
      r2[pg] = r.data.revision;
    }
    if (sujo.has("globals")) {
      const r = await saveGlobalsDraftAction(doc.globals, r2.globals);
      if (!r.ok) { toast.error(r.error); return; }
      r2.globals = r.data.revision;
    }
    const p = await publishThemeAction("Banners atualizados", r2);
    if (!p.ok) { toast.error(p.error); return; }
    setRev(p.data.revisions); setSujo(new Set()); setVersao((v) => v + 1);
    toast.success("Banners publicados na loja"); router.refresh();
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid content-start gap-4">
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Tema <b className="text-foreground">{tema}</b> · {sujo.size ? <b className="text-warning">mudanças não publicadas</b> : "tudo publicado"}</p>
          <div className="flex gap-2">
            <Link href="/theme-editor" className="ds-btn ds-btn--sm ds-btn--secondary">Editor completo</Link>
            <Button size="sm" onClick={publicar} loading={pending} disabled={!sujo.size}><UploadCloud /> Publicar banners</Button>
          </div>
        </div>

        {aviso !== null ? (
          <section className="ds-card" aria-labelledby="aviso-t">
            <h2 id="aviso-t" className="flex items-center gap-2 text-lg font-bold"><Megaphone className="size-5 text-muted-foreground" aria-hidden />Barra de aviso</h2>
            <p className="mt-1 text-sm text-muted-foreground">Faixa fina no topo de todas as páginas. Vazia, ela some.</p>
            <label htmlFor="aviso" className="sr-only">Texto da barra de aviso</label>
            <Input id="aviso" className="mt-3" value={aviso} maxLength={120} onChange={(e) => mudarAviso(e.target.value)} placeholder="Ex.: Frete grátis acima de R$ 299" />
          </section>
        ) : null}

        {pontos.map((p) => (
          <section key={`${p.pagina}-${p.sectionId}`} className="ds-card" aria-labelledby={`p-${p.sectionId}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id={`p-${p.sectionId}`} className="text-lg font-bold">{p.nome}{p.oculto ? <span className="ml-2 text-xs font-medium text-muted-foreground">(seção oculta no editor)</span> : null}</h2>
                <p className="text-sm text-muted-foreground">{p.onde} · {p.itens.length} de {p.maximo}</p>
              </div>
              {p.itens.length < p.maximo ? <Button size="sm" variant="secondary" onClick={() => novo(p)}><Plus /> Adicionar banner</Button> : null}
            </div>
            <ul className="mt-4 grid gap-4">
              {p.itens.map((b, i) => (
                <li key={b.blockId} className={`grid gap-4 rounded-xl border border-border p-3 md:grid-cols-[14rem_minmax(0,1fr)] ${b.hidden ? "opacity-60" : ""}`}>
                  <div className="grid content-start gap-2">
                    <button type="button" onClick={() => imagem(p, b.blockId, "image")} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted ring-1 ring-border" aria-label={`Trocar a imagem do banner ${i + 1}`}>
                      {b.image ? <Miniatura src={thumb(b.image)} /> : <span className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-6" aria-hidden /></span>}
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-xs font-semibold text-white">Trocar imagem</span>
                    </button>
                    <button type="button" onClick={() => imagem(p, b.blockId, "imageMobile")} className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <Smartphone className="size-3.5" aria-hidden />{b.imageMobile ? "Imagem do celular: trocar" : "Imagem própria do celular"}
                    </button>
                  </div>
                  <div className="grid content-start gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {p.campos.filter((c) => c !== "category").map((c) => (
                        <label key={c} className="grid gap-1 text-sm"><span className="font-medium">{ROTULO[c]}</span>
                          <Input value={b.textos[c as keyof typeof b.textos] ?? ""} onChange={(e) => campo(p, b.blockId, c, e.target.value)} placeholder={c === "link" ? "/catalog" : ""} />
                        </label>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["startsAt", "endsAt"] as const).map((c) => (
                        <label key={c} className="grid gap-1 text-sm"><span className="flex items-center gap-1.5 font-medium"><CalendarClock className="size-3.5 text-muted-foreground" aria-hidden />{c === "startsAt" ? "Começa em" : "Termina em"} (Brasília){p.agenda ? null : <Lock className="size-3.5 text-muted-foreground" aria-label="bloqueado" />}</span>
                          <Input type="datetime-local" disabled={!p.agenda} value={b.agenda[c]} onChange={(e) => campo(p, b.blockId, c, e.target.value)} />
                        </label>
                      ))}
                    </div>
                    {!p.agenda ? <p className="text-xs text-muted-foreground">Agendar banners (entra e sai sozinho) vem nos temas a partir do nível {p.agendaNivel}. <Link href="/merchant/templates" className="font-semibold text-link underline">Ver temas</Link></p> : null}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => ocultar(p, b.blockId, !b.hidden)}>{b.hidden ? <><Eye /> Mostrar</> : <><EyeOff /> Ocultar</>}</Button>
                      {p.itens.length > 1 ? <Button size="sm" variant="ghost" onClick={() => remover(p, b.blockId)}><Trash2 /> Remover</Button> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!pontos.length ? <p className="ds-card text-sm text-muted-foreground">O tema ativo não tem banners na página inicial. Use o <Link href="/theme-editor" className="font-semibold text-link underline">editor completo</Link> ou troque de tema.</p> : null}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-2 overflow-hidden rounded-[2rem] border-[10px] border-[#111] bg-white shadow-xl" style={{ height: "46rem" }}>
          <iframe key={versao} title="Loja no celular" src={`/store/${slug}`} className="size-full" />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Prévia da loja publicada. Publique para ver as mudanças.</p>
      </aside>
    </div>
  );
}

// eslint-disable-next-line @next/next/no-img-element -- miniatura da biblioteca da loja (já redimensionada)
const Miniatura = ({ src }: { src: string }) => <img src={src} alt="" className="size-full object-cover" />;
