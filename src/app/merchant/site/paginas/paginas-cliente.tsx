"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, PencilLine } from "lucide-react";
import { aplicarModeloAction, arquivarPaginaAction, criarPaginaAction, editarPaginaAction } from "@/app/actions/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Linha = { id: string; titulo: string; slug: string; tipo: string; noMenu: boolean; arquivada: boolean; situacao: string; noAr: boolean; url: string };

/** Lista das páginas do site (NB2, D307): editar no editor, ver no ar, menu e arquivar. */
export function ListaDePaginas({ linhas }: { linhas: Linha[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = React.useState<string | null>(null);
  const rodar = async (id: string, f: () => Promise<{ ok: boolean; error?: string }>, ok: string) => {
    setOcupado(id); const r = await f(); setOcupado(null);
    if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error ?? "Não deu certo. Tente de novo.");
  };
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface" aria-label="Páginas do site">
      {linhas.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{p.titulo} <span className="font-normal text-muted-foreground">/{p.slug}</span></p>
            <p className="text-xs text-muted-foreground">{p.tipo} · {p.situacao}{p.noMenu && !p.arquivada ? " · no menu" : ""}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!p.arquivada ? <Link href={`/theme-editor?pagina=p:${p.id}`} className={buttonVariants({ size: "sm" })}><PencilLine aria-hidden />Editar conteúdo</Link> : null}
            {p.noAr ? <a href={p.url} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "secondary" })}><ExternalLink aria-hidden />Ver no site</a> : null}
            {!p.arquivada ? <Button size="sm" variant="ghost" loading={ocupado === p.id + "m"} onClick={() => rodar(p.id + "m", () => editarPaginaAction(p.id, { noMenu: !p.noMenu }), p.noMenu ? "Tirada do menu." : "Colocada no menu.")}>{p.noMenu ? "Tirar do menu" : "Pôr no menu"}</Button> : null}
            {p.arquivada
              ? <Button size="sm" variant="ghost" loading={ocupado === p.id} onClick={() => rodar(p.id, () => arquivarPaginaAction(p.id, false), "Página de volta (publique no editor se quiser no ar).")}>Trazer de volta</Button>
              : <ConfirmDialog trigger={<Button size="sm" variant="ghost">Arquivar</Button>} title={`Arquivar "${p.titulo}"?`} description="A página sai do ar e do menu. Nada é apagado: dá para trazer de volta depois." confirmLabel="Arquivar" destructive onConfirm={() => rodar(p.id, () => arquivarPaginaAction(p.id, true), "Página arquivada.")} />}
          </div>
        </li>
      ))}
    </ul>
  );
}

const TIPOS = [["INSTITUCIONAL", "Sobre"], ["SERVICO", "Serviços"], ["CONTATO", "Contato"], ["CAMPANHA", "Campanha (fora do menu e do Google)"], ["LIVRE", "Página livre"]] as const;

/** Página nova em branco: título e endereço; o conteúdo vem no editor. */
export function NovaPagina() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [titulo, setTitulo] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [tipo, setTipo] = React.useState<(typeof TIPOS)[number][0]>("LIVRE");
  const sugestao = titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <h2 className="text-base font-semibold">Nova página</h2>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await criarPaginaAction({ titulo, slug: slug || undefined, tipo }); if (r.ok) { toast.success("Página criada. Agora monte o conteúdo no editor."); router.push(`/theme-editor?pagina=p:${r.data.id}`); } else toast.error(r.error); }); }}>
          <label className="block text-sm font-medium">Título<Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required minLength={2} maxLength={80} placeholder="Ex.: Nossa história" className="mt-1" /></label>
          <label className="block text-sm font-medium">Endereço (opcional)<Input value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={60} placeholder={sugestao || "nossa-historia"} className="mt-1" aria-describedby="end-ajuda" /></label>
          <p id="end-ajuda" className="text-xs text-muted-foreground">A página fica em /{slug || sugestao || "endereco"}. Só letras minúsculas, números e hífens.</p>
          <label className="block text-sm font-medium">Tipo<select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm">{TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <Button type="submit" loading={pending}>Criar e abrir no editor</Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Modelos prontos: troca a página inicial (a anterior fica no histórico) e cria as páginas que faltam, em rascunho. */
export function AplicarModelo({ modelos }: { modelos: { chave: string; nome: string; descricao: string }[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = React.useState<string | null>(null);
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <h2 className="text-base font-semibold">Modelos prontos</h2>
        <p className="text-sm text-muted-foreground">Monta a página inicial e as páginas que faltam, com textos para você trocar. Fica em rascunho: revise no editor e publique. A página inicial de agora vai para o histórico.</p>
        <ul className="space-y-2">
          {modelos.map((m) => (
            <li key={m.chave} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <span><b className="block text-sm">{m.nome}</b><span className="text-xs text-muted-foreground">{m.descricao}</span></span>
              <ConfirmDialog trigger={<Button size="sm" variant="secondary" loading={ocupado === m.chave}>Usar este modelo</Button>} title={`Usar o modelo "${m.nome}"?`} description="A página inicial ganha o conteúdo do modelo em rascunho (a atual fica no histórico) e as páginas que ainda não existem são criadas. Nada vai ao ar antes de você publicar." confirmLabel="Usar o modelo"
                onConfirm={async () => { setOcupado(m.chave); const r = await aplicarModeloAction(m.chave); setOcupado(null); if (r.ok) { toast.success(r.data.criadas.length ? `Pronto. Páginas criadas: ${r.data.criadas.join(", ")}.` : "Pronto. As páginas já existiam; a inicial foi atualizada no rascunho."); router.refresh(); } else toast.error(r.error); }} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
