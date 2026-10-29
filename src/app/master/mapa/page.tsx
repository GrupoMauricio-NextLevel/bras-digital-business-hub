import { levarAoEscritorio } from "@/lib/brand-server";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { Badge } from "@/components/ui/badge";
import { marcaDoMaster } from "@/lib/brand-server";
import { brandByCode } from "@/lib/brand";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { mapaDoEcossistema, type NivelSaude } from "@/lib/domain/ecossistema/mapa";
import { MapaConstelacao, ROTULO_SAUDE } from "@/components/master/mapa-constelacao";

export const dynamic = "force-dynamic";

const TOM: Record<NivelSaude, "success" | "warning" | "danger" | "neutral"> = { BEM: "success", OBSERVAR: "warning", ATENCAO: "danger", PREPARACAO: "neutral" };

/**
 * Mapa do Ecossistema vivo (D175): o mapa de 18/10 com os números de hoje. Só leitura; cada bloco leva à tela que resolve.
 * A marca escolhida no seletor do Master (D173) destaca o nó dela e filtra as tabelas.
 */
export default async function MapaPage() {
  await levarAoEscritorio("/master/agora"); // D205: tela antiga → área nova do escritório da E-commerce
  const s = await requireRole("NEXTLEVEL_MASTER");
  const [mapa, marca] = await Promise.all([mapaDoEcossistema(await getDb(), s.actor), marcaDoMaster()]);
  const visiveis = marca ? mapa.marcas.filter((m) => m.code === marca) : mapa.marcas;
  const noAr = mapa.marcas.filter((m) => m.noAr);
  const atencao = noAr.filter((m) => m.saude.nivel === "ATENCAO").length;
  const nomeDe = (c: string) => brandByCode(c).name;
  return (
    <>
      <PageHeader eyebrow="Grupo NextLevel" title="Mapa do ecossistema" description="Todas as marcas, sites, painéis e conexões com os números de hoje. Cada parte leva à tela que cuida dela." />
      <section className="ds-kpis mb-6" aria-label="Resumo do ecossistema">
        <MetricCard label="Marcas no ar" value={`${noAr.length} de ${mapa.marcas.length}`} hint="as outras estão em preparação" />
        <MetricCard label="Pedem atenção" value={String(atencao)} hint={atencao ? "veja o motivo em cada marca" : "nenhuma agora"} tone={atencao ? "danger" : "neutral"} />
        <MetricCard label="Clientes em 2+ marcas" value={String(mapa.emVariasMarcas)} hint="pelo mesmo CPF/CNPJ" />
        <MetricCard label="Erros abertos" value={String(mapa.motor.errosAbertos)} hint={mapa.motor.ultimaConferencia ? `endereços conferidos em ${formatDate(mapa.motor.ultimaConferencia)}` : "endereços ainda não conferidos"} />
      </section>

      <section aria-labelledby="h-const" className="ds-card mb-6 p-4">
        <SectionTitle title="Constelação" description="Tamanho = número de clientes · anel = saúde · linha entre marcas = clientes em comum. Toque numa marca para abrir a tela dela." />
        <h2 id="h-const" className="sr-only">Constelação das marcas</h2>
        <div className="hidden sm:block"><MapaConstelacao mapa={mapa} destaque={marca} /></div>
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Legenda da saúde">
          {(Object.keys(ROTULO_SAUDE) as NivelSaude[]).map((n) => <li key={n}><Badge tone={TOM[n]}>{ROTULO_SAUDE[n]}</Badge></li>)}
        </ul>
      </section>

      <section aria-labelledby="h-marcas" className="mb-6">
        <h2 id="h-marcas" className="sr-only">Marcas</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {visiveis.map((m) => (
            <article key={m.code} className="ds-card grid gap-2 p-4" style={{ borderLeft: `4px solid ${m.cor}` }}>
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold">{m.nome}</h3>
                <Badge tone={TOM[m.saude.nivel]}>{ROTULO_SAUDE[m.saude.nivel]}</Badge>
              </header>
              <p className="text-sm text-muted-foreground">{m.saude.motivo}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-muted-foreground">Clientes</dt><dd className="font-bold tabular-nums">{m.clientes} {m.rotuloClientes}</dd></div>
                {m.vendas ? <div><dt className="text-xs text-muted-foreground">Vendas pagas</dt><dd className="font-bold tabular-nums">{m.vendas.pedidos} · {formatBRL(m.vendas.gmv)}</dd></div> : null}
                <div className="min-w-0"><dt className="text-xs text-muted-foreground">Endereço</dt><dd className="truncate"><a href={m.endereco} target="_blank" rel="noreferrer" className="underline">{m.endereco.replace(/^https?:\/\//, "")}</a></dd></div>
              </dl>
              <Link href={m.href} className="ds-btn ds-btn--secondary ds-btn--sm justify-self-start">Abrir {m.nome}</Link>
            </article>
          ))}
        </div>
      </section>

      <div className="ds-grid ds-grid--main">
        <section aria-labelledby="h-sites" className="ds-card p-4">
          <SectionTitle title="Sites" description="Resultado da última conferência dos endereços." action={<Link href="/master/qualidade" className="text-sm font-semibold text-link underline">Conferir na Central de qualidade</Link>} />
          <h2 id="h-sites" className="sr-only">Sites</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th scope="col" className="py-2 pr-3 font-medium">Marca</th><th scope="col" className="py-2 pr-3 font-medium">Endereço</th><th scope="col" className="py-2 font-medium">Situação</th></tr></thead>
              <tbody>
                {visiveis.map((m) => (
                  <tr key={m.code} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2 pr-3 text-left font-medium">{m.nome}</th>
                    <td className="max-w-[16rem] truncate py-2 pr-3">{m.endereco.replace(/^https?:\/\//, "")}</td>
                    <td className="py-2">{m.site.ok === null ? <span className="text-muted-foreground">sem conferência</span> : m.site.ok ? <Badge tone="success">respondeu</Badge> : <Badge tone="danger">falhou</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="space-y-6">
          <section aria-labelledby="h-paineis" className="ds-card p-4">
            <h2 id="h-paineis" className="mb-1 text-sm font-semibold">Painéis: pessoas com acesso</h2>
            <p className="mb-2 text-xs text-muted-foreground">Contas ativas por marca e papel (sem a equipe NextLevel).</p>
            {visiveis.filter((m) => m.usuariosPorPapel.length).map((m) => (
              <div key={m.code} className="mb-2">
                <p className="text-xs font-semibold">{m.nome}</p>
                <ul className="text-sm">{m.usuariosPorPapel.map((p) => <li key={p.papel} className="flex justify-between border-b border-border py-1"><span>{p.rotulo}</span><span className="tabular-nums">{p.n}</span></li>)}</ul>
              </div>
            ))}
            <Link href="/master/clientes" className="text-sm font-semibold text-link underline">Clientes e suporte</Link>
          </section>
          <section aria-labelledby="h-conexoes" className="ds-card p-4">
            <h2 id="h-conexoes" className="mb-2 text-sm font-semibold">Conexões: clientes em comum</h2>
            {mapa.pares.length ? <ul className="text-sm">{mapa.pares.map((p) => <li key={`${p.a}-${p.b}`} className="flex justify-between border-b border-border py-1"><span>{nomeDe(p.a)} + {nomeDe(p.b)}</span><span className="tabular-nums">{p.n}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Ainda nenhum cliente em duas marcas.</p>}
            <Link href="/master/ecossistema" className="mt-2 inline-block text-sm font-semibold text-link underline">Torre do Ecossistema</Link>
          </section>
        </div>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Atualizado ao abrir a página ({formatDate(mapa.geradoEm)}). Só contagens: nenhum dado pessoal aparece aqui.</p>
    </>
  );
}
