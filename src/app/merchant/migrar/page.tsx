import { PageHeader } from "@/components/app/page-header";
import { requireIndependent } from "@/lib/require-independent";
import { getDb } from "@/db/client";
import { listaDeEspera, listarRedirecionamentos } from "@/lib/domain/migrar";
import { entradaDe } from "@/lib/domain/integracoes";
import { storeOrigin } from "@/lib/storefront-seo";
import { formatDateTime } from "@/lib/utils";
import { CopiarLink, FormIntegracoes, FormLancamento, FormPixel, FormRedirecionamentos, RemoverRedirecionamento } from "./forms";

export const dynamic = "force-dynamic";

/** Migrar e anunciar (W4, D187; integrações D189): endereços antigos, catálogos, pixels, Google, chat, celular e lançamento. */
export default async function MigrarPage() {
  const { session } = await requireIndependent();
  const db = await getDb();
  const s = session.store!;
  const [redir, espera, origem] = await Promise.all([listarRedirecionamentos(db, session.actor), listaDeEspera(db, session.actor), storeOrigin(s)]);
  const sec = "ds-card scroll-mt-24 space-y-3";
  return (
    <>
      <PageHeader title="Migrar e anunciar" description="Para quem vem de outra plataforma não perder o Google, e para anunciar com a Meta e o Google Shopping." />
      <nav aria-label="Nesta página" className="ds-seg mb-5">{[["#enderecos", "Endereços antigos"], ["#google", "Catálogos"], ["#meta", "Pixel da Meta"], ["#integracoes", "Google, TikTok e chat"], ["#lancamento", "Lançamento"]].map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
      <div className="space-y-6">
        <section id="enderecos" aria-labelledby="enderecos-t" className={sec}>
          <h2 id="enderecos-t" className="text-lg font-semibold">Endereços antigos (redirecionamento 301)</h2>
          <p className="text-sm text-body">Cole uma linha por endereço: o endereço antigo, ponto e vírgula, o endereço novo na sua loja. Quem abrir o antigo (pelo Google, por um link salvo) cai no novo, e o Google transfere a posição. Exemplo: <code className="rounded bg-surface-muted px-1">/produto/vestido-azul;/product/vestido-azul</code></p>
          <FormRedirecionamentos />
          {redir.length ? (
            <ul className="divide-y divide-border rounded-lg border border-border text-sm">
              {redir.map((r) => <li key={r.fromPath} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"><span className="min-w-0 break-all"><span className="font-mono">{r.fromPath}</span> → <span className="font-mono">{r.toPath}</span></span><span className="flex items-center gap-3 text-muted-foreground">{r.hits} acessos<RemoverRedirecionamento fromPath={r.fromPath} /></span></li>)}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhum endereço antigo cadastrado.</p>}
        </section>
        <section id="google" aria-labelledby="google-t" className={sec}>
          <h2 id="google-t" className="text-lg font-semibold">Catálogo de produtos (Google, Instagram e TikTok)</h2>
          <p className="text-sm text-body">Um endereço só serve para os três. Ele se atualiza sozinho com os produtos ativos, preço e estoque.</p>
          <CopiarLink url={`${origem}/feed.xml`} />
          <ul className="list-disc space-y-1 pl-5 text-sm text-body">
            <li><b>Google Shopping:</b> no Google Merchant Center, adicione o endereço como fonte de produtos (feed programado).</li>
            <li><b>Instagram e Facebook:</b> no Gerenciador de Comércio da Meta, crie um catálogo e escolha &quot;Feed de dados&quot; com envio programado por endereço.</li>
            <li><b>TikTok:</b> no Gerenciador de Catálogos do TikTok, adicione produtos por &quot;Feed de dados&quot; e cole o endereço.</li>
          </ul>
        </section>
        <section id="meta" aria-labelledby="meta-t" className={sec}>
          <h2 id="meta-t" className="text-lg font-semibold">Pixel da Meta (Facebook e Instagram)</h2>
          <p className="text-sm text-body">Conta visitas, produto visto, item no carrinho e compra para os seus anúncios. Com o token da API de conversões, a compra também é avisada pelo servidor, depois do pagamento confirmado (mais precisa, mesmo com bloqueador de anúncios).</p>
          <FormPixel pixelId={s.metaPixelId ?? ""} temToken={!!s.metaCapiTokenEnc} />
        </section>
        <section id="integracoes" aria-labelledby="integracoes-t" className={sec}>
          <h2 id="integracoes-t" className="text-lg font-semibold">Google, TikTok, Pinterest, chat e celular</h2>
          <p className="text-sm text-body">Cole o código de cada serviço que você usa. Os que ficarem em branco continuam desligados. A compra só é contada depois do pagamento confirmado.</p>
          <FormIntegracoes inicial={entradaDe(s.integrations ?? {})} />
        </section>
        <section id="lancamento" aria-labelledby="lancamento-t" className={sec}>
          <h2 id="lancamento-t" className="text-lg font-semibold">Loja em lançamento</h2>
          <p className="text-sm text-body">Ligado, o público vê &quot;abrimos em breve&quot; e pode deixar o e-mail para ser avisado. Você continua vendo e testando a loja normalmente.</p>
          <FormLancamento ligado={s.launchMode} />
          {espera.length ? (
            <details className="text-sm"><summary className="cursor-pointer font-medium">Lista de espera ({espera.length})</summary>
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border">{espera.map((e) => <li key={e.email} className="flex justify-between gap-2 px-3 py-2"><span className="break-all">{e.email}</span><span className="text-muted-foreground">{formatDateTime(e.createdAt)}</span></li>)}</ul>
            </details>
          ) : <p className="text-sm text-muted-foreground">Ninguém na lista de espera ainda.</p>}
        </section>
      </div>
    </>
  );
}
