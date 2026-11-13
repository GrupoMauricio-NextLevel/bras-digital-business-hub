/**
 * Detalhe do aparelho (D292), sem dado pessoal: sistema e versão, navegador (inclusive o navegador de dentro do Instagram,
 * Facebook, TikTok…), modelo quando o próprio celular informa (Android/Chrome), tela, idioma e tipo de rede. Pura.
 */
export type Extras = { w?: number; h?: number; l?: string; m?: string; pv?: string; rede?: string };

export function sistemaDe(ua: string | null | undefined, pv?: string | null): string {
  const u = ua ?? "";
  let m: RegExpMatchArray | null;
  if ((m = u.match(/(?:iPhone|iPad|iPod).*?OS (\d+)[_.](\d+)/))) return `iOS ${m[1]}.${m[2]}`;
  if ((m = u.match(/Android (\d+(?:\.\d+)?)/))) {
    // O Chrome esconde a versão real ("Android 10; K"); com a versão que o aparelho informa, vale a informada.
    const real = pv && /^\d+/.test(pv) ? pv.split(".")[0] : null;
    return `Android ${real ?? m[1]}`;
  }
  if (/Windows NT 10/.test(u)) return "Windows";
  if (/Windows/.test(u)) return "Windows (antigo)";
  if (/CrOS/.test(u)) return "ChromeOS";
  if (/Mac OS X|Macintosh/.test(u)) return "macOS";
  if (/Linux/.test(u)) return "Linux";
  return "Outro";
}

export function navegadorDe(ua: string | null | undefined): string {
  const u = ua ?? "";
  if (/Instagram/.test(u)) return "App do Instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(u)) return "App do Facebook";
  if (/musical_ly|BytedanceWebview|TikTok|trill_/i.test(u)) return "App do TikTok";
  if (/LinkedInApp/.test(u)) return "App do LinkedIn";
  if (/Pinterest/.test(u)) return "App do Pinterest";
  if (/WhatsApp/.test(u)) return "WhatsApp";
  if (/SamsungBrowser/.test(u)) return "Samsung Internet";
  if (/EdgA?\/|EdgiOS/.test(u)) return "Edge";
  if (/OPR\/|Opera/.test(u)) return "Opera";
  if (/Firefox|FxiOS/.test(u)) return "Firefox";
  if (/CriOS|Chrome\//.test(u)) return "Chrome";
  if (/Safari\//.test(u)) return "Safari";
  return "Outro";
}

/** Modelo do aparelho: o que o Android informa (dica do Chrome) ou, no iPhone/iPad, só o tipo. */
export function modeloDe(ua: string | null | undefined, informado?: string | null): string | null {
  const m = (informado ?? "").replace(/[^\w\s\-+()]/g, "").trim().slice(0, 40);
  if (m) return m;
  const u = ua ?? "";
  if (/iPhone/.test(u)) return "iPhone";
  if (/iPad/.test(u)) return "iPad";
  const a = u.match(/Android [\d.]+; (?:[a-z]{2}-[a-z]{2}; )?([^;)]+?)(?: Build|\))/i);
  return a && a[1] !== "K" && !/^wv$/.test(a[1]!) ? a[1]!.trim().slice(0, 40) : null;
}

export function limparExtras(e: unknown): { tela: string | null; idioma: string | null; modelo: string | null; versaoSistema: string | null; rede: string | null } {
  const x = (e && typeof e === "object" ? e : {}) as Extras;
  const w = Number(x.w); const h = Number(x.h);
  return {
    tela: w > 0 && h > 0 && w < 10000 && h < 10000 ? `${Math.round(w)}×${Math.round(h)}` : null,
    idioma: typeof x.l === "string" && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(x.l) ? x.l : null,
    modelo: typeof x.m === "string" ? x.m.slice(0, 60) : null,
    versaoSistema: typeof x.pv === "string" && /^[\d.]{1,12}$/.test(x.pv) ? x.pv : null,
    rede: typeof x.rede === "string" && /^(slow-2g|2g|3g|4g|5g|wifi)$/.test(x.rede) ? x.rede : null,
  };
}
