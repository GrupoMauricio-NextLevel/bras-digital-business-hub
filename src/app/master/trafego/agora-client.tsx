"use client";
import * as React from "react";
import { Bell, BellOff, FileText, MapPin, MessageCircle, Smartphone, UserPlus, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { agoraNoSiteAction } from "@/app/actions/trafego";
import type { AgoraNoSite } from "@/lib/domain/trafego/coletor";
import { ROTULO_CANAL, ehCanalPago, type Canal } from "@/lib/trafego/canal";
import { Badge } from "@/components/ui/badge";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const APARELHO: Record<string, string> = { MOBILE: "Celular", DESKTOP: "Computador", TABLET: "Tablet" };
const MARCA: Record<string, string> = { NEXTLEVEL_COMMERCE: "Commerce", NEXTLEVEL: "Grupo", SUPERDROP: "SuperDrop", BRAS_DIGITAL: "Brás", NEXTLEVEL_CARGAS: "Cargas", CREATORS_HUB: "Creators", CHINA_HUB: "China" };
type Entrada = AgoraNoSite["entradas"][number];
const PAIS: Record<string, string> = { US: "Estados Unidos", PT: "Portugal", AR: "Argentina", PY: "Paraguai", UY: "Uruguai", CL: "Chile", ES: "Espanha", IT: "Itália", JP: "Japão", CN: "China" };
/** "Campinas/SP" · "São Paulo (cidade não identificada)" · "Portugal". Pelo IP: aproximado. */
export function localDe(e: Pick<Entrada, "cidade" | "uf" | "pais">): string {
  if (e.pais && e.pais !== "BR") return PAIS[e.pais] ?? `Exterior (${e.pais})`;
  if (e.cidade) return e.uf ? `${e.cidade}/${e.uf}` : e.cidade;
  return e.uf ? `${e.uf}` : "Local não identificado";
}
/** "Celular · Android 14 · Samsung SM-S918B · App do Instagram · 4g". */
export function aparelhoDe(e: Pick<Entrada, "aparelho" | "sistema" | "modelo" | "navegador" | "tela" | "rede">): string {
  return [APARELHO[e.aparelho] ?? e.aparelho, e.sistema, e.modelo, e.navegador, e.tela ? `tela ${e.tela}` : null, e.rede === "wifi" ? "Wi-Fi" : e.rede].filter(Boolean).join(" · ");
}
const resumoVisita = (e: Entrada) => `${localDe(e)} · ${aparelhoDe(e)} · veio de ${ROTULO_CANAL[e.canal] ?? e.canal}${e.campanha ? ` (${e.campanha})` : ""} · entrou em ${e.entrada}`;

/** Sem armazenamento no navegador (janela anônima, bloqueio), a escolha vale só enquanto a tela estiver aberta. */
const memoria = new Map<string, boolean>();
function ler(k: string) { if (memoria.has(k)) return memoria.get(k)!; try { return localStorage.getItem(k) === "1"; } catch { return false; } }
const PREFS = "nl-trafego-prefs";
function gravar(k: string, v: boolean) { memoria.set(k, v); try { localStorage.setItem(k, v ? "1" : "0"); } catch { /* sem armazenamento */ } window.dispatchEvent(new Event(PREFS)); }
const assinarPrefs = (cb: () => void) => { window.addEventListener(PREFS, cb); return () => window.removeEventListener(PREFS, cb); };
function bip() {
  try {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return;
    const c = new C(); const o = c.createOscillator(); const g = c.createGain();
    o.frequency.value = 880; g.gain.setValueAtTime(0.08, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.26); o.onended = () => void c.close();
  } catch { /* sem som */ }
}

const MARCO: Record<AgoraNoSite["marcos"][number]["tipo"], { rotulo: string; icone: React.ReactNode }> = {
  CLIQUE_WHATSAPP: { rotulo: "Clicou no WhatsApp", icone: <MessageCircle className="size-4" aria-hidden /> },
  INICIO_CADASTRO: { rotulo: "Foi para o cadastro", icone: <UserPlus className="size-4" aria-hidden /> },
  LEAD: { rotulo: "Deixou o contato", icone: <FileText className="size-4" aria-hidden /> },
};

function Barras({ titulo, itens, rotulo, vazio }: { titulo: string; itens: { chave: string; total: number }[]; rotulo: (k: string) => string; vazio: string }) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  return (
    <section className="ds-card min-w-0 text-sm" aria-label={titulo}>
      <h2 className="text-base font-bold">{titulo}</h2>
      {itens.length === 0 ? <p className="mt-3 text-muted-foreground">{vazio}</p> : (
        <ul className="mt-3 space-y-2">
          {itens.map((i) => (
            <li key={i.chave}>
              <div className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate">{rotulo(i.chave)}</span><span className="font-semibold tabular-nums">{i.total}</span></div>
              <div className="mt-1 h-2 rounded-full bg-surface-muted" aria-hidden><div className="h-2 rounded-full bg-[color:var(--ds-primary)]" style={{ width: `${Math.max(4, (i.total / max) * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Aviso = { chave: string; quando: string; titulo: string; texto: string; tipo: "VISITA" | AgoraNoSite["marcos"][number]["tipo"] };
const chaveMarco = (m: AgoraNoSite["marcos"][number]) => `${m.tipo}-${m.quando}-${m.caminho}`;

/**
 * "Agora no site" (TR2, D291) com notificações em tempo real (D292): pede de novo a cada 5 s com a aba visível (e a cada
 * 30 s escondida, para o aviso do navegador chegar). Cada visita nova vira aviso com cidade e aparelho; WhatsApp, cadastro
 * e contato também. Aviso do navegador e som são opcionais e ficam guardados neste navegador.
 */
export function AgoraAoVivo({ inicial }: { inicial: AgoraNoSite }) {
  const [d, setD] = React.useState(inicial);
  const [erro, setErro] = React.useState(false);
  const [avisos, setAvisos] = React.useState<Aviso[]>([]);
  // Preferências deste navegador como fonte externa: o servidor desenha "desligado" e o navegador corrige sem conflito.
  const som = React.useSyncExternalStore(assinarPrefs, () => ler("nl-trafego-som"), () => false);
  const notif = React.useSyncExternalStore(assinarPrefs, () => ler("nl-trafego-notif") && typeof Notification !== "undefined" && Notification.permission === "granted", () => false);
  const setSom = (v: boolean) => gravar("nl-trafego-som", v);
  const setNotif = (v: boolean) => gravar("nl-trafego-notif", v);
  const vistos = React.useRef(new Set([...inicial.entradas.map((e) => e.id), ...inicial.marcos.map(chaveMarco)]));
  const prefs = React.useRef({ som, notif });
  React.useEffect(() => { prefs.current = { som, notif }; }, [som, notif]);

  React.useEffect(() => {
    let ultimo = 0;
    const tick = async () => {
      const visivel = document.visibilityState === "visible";
      if (!visivel && Date.now() - ultimo < 30_000) return;
      ultimo = Date.now();
      const r = await agoraNoSiteAction();
      if (!r.ok) { setErro(true); return; }
      setD(r.data); setErro(false);
      const novos: Aviso[] = [];
      for (const e of [...r.data.entradas].reverse()) {
        if (vistos.current.has(e.id)) continue;
        vistos.current.add(e.id);
        novos.push({ chave: e.id, quando: e.quando, tipo: "VISITA", titulo: `Nova visita · ${localDe(e)}`, texto: resumoVisita(e) });
      }
      for (const m of [...r.data.marcos].reverse()) {
        const k = chaveMarco(m);
        if (vistos.current.has(k)) continue;
        vistos.current.add(k);
        novos.push({ chave: k, quando: m.quando, tipo: m.tipo, titulo: MARCO[m.tipo].rotulo, texto: `${ROTULO_CANAL[m.canal] ?? m.canal}${m.campanha ? ` · ${m.campanha}` : ""} · ${m.caminho}` });
      }
      if (!novos.length) return;
      setAvisos((a) => [...novos.reverse(), ...a].slice(0, 30));
      for (const n of novos.slice(0, 3)) {
        if (visivel) toast(n.titulo, { description: n.texto });
        if (prefs.current.notif && typeof Notification !== "undefined" && Notification.permission === "granted" && !visivel) {
          try { new Notification(n.titulo, { body: n.texto, tag: n.chave }); } catch { /* navegador sem aviso */ }
        }
      }
      if (prefs.current.som) bip();
    };
    const t = window.setInterval(() => { void tick(); }, 5_000);
    return () => window.clearInterval(t);
  }, []);

  const alternarNotif = async () => {
    if (notif) { setNotif(false); return; }
    if (typeof Notification === "undefined") { toast.error("Este navegador não mostra avisos."); return; }
    const p = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (p !== "granted") { toast.error("O navegador não liberou os avisos. Libere nas configurações do site."); return; }
    setNotif(true); toast.success("Pronto: com a tela aberta em outra aba, cada visita nova aparece como aviso do navegador.");
  };
  const alternarSom = () => { const v = !som; setSom(v); if (v) bip(); };

  const stats = [
    { rotulo: "Visitas hoje", valor: d.hoje.sessoes },
    { rotulo: "Cliques no WhatsApp hoje", valor: d.hoje.whatsapp },
    { rotulo: "Foram ao cadastro hoje", valor: d.hoje.cadastros },
    { rotulo: "Deixaram contato hoje", valor: d.hoje.leads },
  ];
  return (
    <div className="space-y-6">
      <section className="ds-card flex flex-wrap items-center justify-between gap-4" aria-live="polite" aria-label="Pessoas no site agora">
        <div>
          <p className="text-sm font-semibold text-muted-foreground"><span className="mr-2 inline-block size-2.5 animate-pulse rounded-full bg-[color:var(--ds-ok,#16a34a)] motion-reduce:animate-none" aria-hidden />Agora no site (últimos 5 minutos)</p>
          <p className="mt-1 text-5xl font-extrabold tabular-nums">{d.agora}<span className="ml-2 text-lg font-semibold text-muted-foreground">{d.agora === 1 ? "pessoa" : "pessoas"}</span></p>
        </div>
        <p className="text-xs text-muted-foreground">{erro ? "Não consegui atualizar agora; tento de novo em 5 s." : `Atualiza a cada 5 s · última às ${new Date(d.em).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}`}</p>
      </section>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => <div key={s.rotulo} className="ds-card"><dt className="text-sm text-muted-foreground">{s.rotulo}</dt><dd className="mt-1 text-3xl font-bold tabular-nums">{s.valor}</dd></div>)}
      </dl>
      <section className="ds-card min-w-0 text-sm" aria-labelledby="avisos-t">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="avisos-t" className="text-base font-bold">Notificações em tempo real</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm gap-1" aria-pressed={notif} onClick={() => void alternarNotif()}>{notif ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}{notif ? "Aviso do navegador ligado" : "Avisar no navegador"}</button>
            <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm gap-1" aria-pressed={som} onClick={alternarSom}>{som ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}{som ? "Som ligado" : "Tocar som"}</button>
          </div>
        </div>
        <div aria-live="polite">
          {avisos.length === 0 ? <p className="mt-3 text-muted-foreground">Deixe esta tela aberta: cada visita nova aparece aqui na hora, com a cidade e o aparelho, e também quem clicar no WhatsApp, for ao cadastro ou deixar contato.</p> : (
            <ul className="mt-3 divide-y divide-border">
              {avisos.map((a) => (
                <li key={a.chave} className="flex gap-3 py-2">
                  <span className="mt-0.5 text-link">{a.tipo === "VISITA" ? <MapPin className="size-4" aria-hidden /> : MARCO[a.tipo].icone}</span>
                  <span className="min-w-0"><b>{a.titulo}</b> <span className="tabular-nums text-muted-foreground">às {hora(a.quando)}</span><br /><span className="break-words text-muted-foreground">{a.texto}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Barras titulo="De onde vieram" itens={d.porCanal} rotulo={(k) => ROTULO_CANAL[k as Canal] ?? k} vazio="Ninguém no site agora." />
        <Barras titulo="Em qual página estão" itens={d.porPagina} rotulo={(k) => k} vazio="Ninguém no site agora." />
        <Barras titulo="Aparelho" itens={d.porAparelho} rotulo={(k) => APARELHO[k] ?? k} vazio="Ninguém no site agora." />
        <Barras titulo="De qual cidade" itens={d.porCidade} rotulo={(k) => k} vazio="Ninguém no site agora." />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <section className="ds-card min-w-0 text-sm" aria-labelledby="entradas-t">
          <h2 id="entradas-t" className="text-base font-bold">Entradas na última hora</h2>
          {d.entradas.length === 0 ? <p className="mt-3 text-muted-foreground">Nenhuma visita na última hora.</p> : (
            <ul className="mt-3 divide-y divide-border">
              {d.entradas.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums">{hora(e.quando)}</span>
                    <Badge tone={ehCanalPago(e.canal) ? "info" : "neutral"}>{ROTULO_CANAL[e.canal] ?? e.canal}</Badge>
                    {e.ativa ? <Badge tone="success" dot>No site</Badge> : null}
                    {e.whatsapp ? <Badge tone="outline" icon={<MessageCircle />}>WhatsApp</Badge> : null}
                    {e.cadastro ? <Badge tone="outline" icon={<UserPlus />}>Cadastro</Badge> : null}
                    {e.lead ? <Badge tone="success" icon={<FileText />}>Lead</Badge> : null}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1"><span className="inline-flex items-center gap-1 font-medium"><MapPin className="size-4 text-link" aria-hidden />{localDe(e)}</span><span className="inline-flex items-center gap-1"><Smartphone className="size-4 text-link" aria-hidden />{aparelhoDe(e)}</span></p>
                  <p className="mt-1 break-words text-muted-foreground">
                    {MARCA[e.brand] ?? e.brand} · entrou em <span className="font-medium text-foreground">{e.entrada}</span>{e.atual !== e.entrada ? <> · agora em <span className="font-medium text-foreground">{e.atual}</span></> : null} · {e.paginas} {e.paginas === 1 ? "página" : "páginas"}
                    {e.campanha ? <> · campanha <span className="font-medium text-foreground">{e.campanha}</span>{e.peca ? ` / ${e.peca}` : ""}</> : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="ds-card min-w-0 text-sm" aria-labelledby="marcos-t">
          <h2 id="marcos-t" className="text-base font-bold">Momentos importantes (24 h)</h2>
          {d.marcos.length === 0 ? <p className="mt-3 text-muted-foreground">Ainda ninguém clicou no WhatsApp, foi ao cadastro ou deixou contato.</p> : (
            <ul className="mt-3 space-y-3">
              {d.marcos.map((m, i) => (
                <li key={`${m.quando}-${i}`} className="flex gap-3">
                  <span className="mt-0.5 text-link">{MARCO[m.tipo].icone}</span>
                  <span className="min-w-0"><b>{MARCO[m.tipo].rotulo}</b> às {hora(m.quando)}<br /><span className="text-muted-foreground">{ROTULO_CANAL[m.canal] ?? m.canal}{m.campanha ? ` · ${m.campanha}` : ""} · {m.caminho}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
