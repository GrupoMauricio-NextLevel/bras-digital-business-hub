"use client";
import * as React from "react";
import Link from "next/link";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, gravarConsentimento, lerConsentimento, type Consentimento } from "@/lib/trafego/consentimento";

const ABRIR = "nl:abrir-cookies";
/** Evento disparado ao salvar a escolha: os pixels (TR4) escutam para carregar ou não. */
export const EVENTO_CONSENTIMENTO = "nl:consentimento";

function bruto(): string {
  try { return document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1) ?? ""; } catch { return ""; }
}
const lerDoNavegador = (): Consentimento | null => lerConsentimento(bruto());
/** O cookie de consentimento como fonte externa: atualiza quando a escolha é salva (nesta ou noutra parte da página). */
const assinar = (cb: () => void) => { window.addEventListener(EVENTO_CONSENTIMENTO, cb); return () => window.removeEventListener(EVENTO_CONSENTIMENTO, cb); };

/**
 * Aviso de cookies (TR0, D290): "Aceitar todos", "Só os necessários" ou "Escolher". Não bloqueia a página. A escolha fica
 * num cookie com a versão do texto (muda a versão, o aviso volta) e vale por 12 meses. Anúncios (Pixel da Meta, Google)
 * só carregam com "sim"; a medição própria do site respeita o "não".
 */
export function AvisoCookies() {
  const salvo = React.useSyncExternalStore(assinar, bruto, () => null);
  const [reaberto, setReaberto] = React.useState(false);
  const [escolher, setEscolher] = React.useState(false);
  const [medicao, setMedicao] = React.useState(true);
  const [anuncios, setAnuncios] = React.useState(false);
  const titulo = React.useId();
  // No servidor (salvo = null) nada aparece; no navegador, aparece sem escolha válida ou quando a pessoa pede pelo rodapé.
  const aberto = reaberto || (salvo !== null && !lerConsentimento(salvo));

  React.useEffect(() => {
    const abrir = () => { const c = lerDoNavegador(); setMedicao(c ? c.medicao : true); setAnuncios(c ? c.anuncios : false); setEscolher(true); setReaberto(true); };
    window.addEventListener(ABRIR, abrir);
    return () => window.removeEventListener(ABRIR, abrir);
  }, []);

  const salvar = (escolha: { medicao: boolean; anuncios: boolean }) => {
    const seguro = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${gravarConsentimento(escolha)}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax${seguro}`;
    window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMENTO, { detail: escolha }));
    setReaberto(false);
    setEscolher(false);
  };

  if (!aberto) return null;
  return (
    <section role="region" aria-labelledby={titulo} className="fixed inset-x-3 bottom-20 z-50 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-4 text-sm text-foreground shadow-[var(--ds-shadow-md)] sm:left-4 sm:right-auto sm:max-w-md">
      <h2 id={titulo} className="text-base font-bold">Cookies e privacidade</h2>
      <p className="mt-1 text-muted-foreground">
        Usamos cookies necessários para o site funcionar e para registrar de onde você veio (indicação ou campanha). Com a sua permissão, também medimos o uso do site e os resultados dos nossos anúncios. <Link href="/privacidade#cookies" className="font-semibold text-link underline">Saiba mais</Link>.
      </p>
      {escolher ? (
        <fieldset className="mt-3 space-y-3">
          <legend className="sr-only">Escolha os cookies</legend>
          <label className="flex gap-3"><input type="checkbox" checked disabled className="mt-1 size-4" /><span><b>Necessários</b> (sempre ligados): entrar na conta, segurança, carrinho e a origem da indicação ou campanha.</span></label>
          <label className="flex gap-3"><input type="checkbox" checked={medicao} onChange={(e) => setMedicao(e.target.checked)} className="mt-1 size-4" /><span><b>Medição do site:</b> de qual canal você chegou e por quais páginas passou, sem nome e sem guardar o seu IP.</span></label>
          <label className="flex gap-3"><input type="checkbox" checked={anuncios} onChange={(e) => setAnuncios(e.target.checked)} className="mt-1 size-4" /><span><b>Anúncios:</b> ferramentas da Meta (Instagram e Facebook) e do Google para medir campanhas e mostrar anúncios mais certos.</span></label>
        </fieldset>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {escolher
          ? <button type="button" className="ds-pub-btn ds-pub-btn--sm min-h-11" onClick={() => salvar({ medicao, anuncios })}>Salvar escolha</button>
          : <button type="button" className="ds-pub-btn ds-pub-btn--sm min-h-11" onClick={() => salvar({ medicao: true, anuncios: true })}>Aceitar todos</button>}
        <button type="button" className="ds-pub-btn ds-pub-btn--ghost ds-pub-btn--sm min-h-11" onClick={() => salvar({ medicao: false, anuncios: false })}>Só os necessários</button>
        {!escolher ? <button type="button" className="ds-pub-btn ds-pub-btn--ghost ds-pub-btn--sm min-h-11" onClick={() => setEscolher(true)}>Escolher</button> : null}
      </div>
    </section>
  );
}

/** Link do rodapé que reabre o aviso para mudar a escolha. */
export function PreferenciasCookies() {
  return <button type="button" className="underline underline-offset-2" onClick={() => window.dispatchEvent(new Event(ABRIR))}>Preferências de cookies</button>;
}
