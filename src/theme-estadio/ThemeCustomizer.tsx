"use client";

import * as React from "react";
import { STADIUM_PRESETS } from "@/theme-estadio/presets";
import { useStadiumTheme } from "@/theme-estadio/StadiumThemeProvider";
import type { StadiumThemeTokens } from "@/theme-estadio/tokens";

type Props = { onSave: (tokens: StadiumThemeTokens) => Promise<void> | void };

export function ThemeCustomizer({ onSave }: Props) {
  const { tokens, updateTokens, setTokens } = useStadiumTheme();
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(tokens);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="stadium-card p-4">
        <h1 className="stadium-title text-2xl">Editor de aparência · Tema Estádio</h1>
        <p className="mt-1 text-sm text-[var(--stadium-muted)]">Ajuste cores, fontes e efeitos com preview ao vivo da loja.</p>
      </header>

      <div className="stadium-card grid gap-3 p-4 lg:grid-cols-2">
        <label className="text-sm">Preset pronto
          <select className="stadium-select mt-1" defaultValue="" onChange={(e) => {
            const p = STADIUM_PRESETS.find((x) => x.id === e.target.value);
            if (p) setTokens(p.tokens);
          }}>
            <option value="" disabled>Selecione</option>
            {STADIUM_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label className="text-sm">Cor principal
          <input className="stadium-input mt-1 h-11" type="color" value={tokens.colors.primary} onChange={(e) => updateTokens({ colors: { primary: e.target.value } })} />
        </label>
        <label className="text-sm">Cor de destaque
          <input className="stadium-input mt-1 h-11" type="color" value={tokens.colors.accent} onChange={(e) => updateTokens({ colors: { accent: e.target.value } })} />
        </label>
        <label className="text-sm">Fundo
          <input className="stadium-input mt-1 h-11" type="color" value={tokens.colors.background} onChange={(e) => updateTokens({ colors: { background: e.target.value } })} />
        </label>
        <label className="text-sm">Fonte dos títulos
          <select className="stadium-select mt-1" value={tokens.typography.headingFont} onChange={(e) => updateTokens({ typography: { headingFont: e.target.value } })}>
            <option value="var(--estadio-font-bebas), var(--estadio-font-barlow), sans-serif">Bebas + Barlow</option>
            <option value="var(--estadio-font-oswald), var(--estadio-font-barlow), sans-serif">Oswald + Barlow</option>
            <option value="var(--estadio-font-montserrat), var(--estadio-font-barlow), sans-serif">Montserrat + Barlow</option>
          </select>
        </label>
        <label className="text-sm">Raio dos cards ({tokens.radius.md}px)
          <input type="range" min={6} max={28} value={tokens.radius.md} onChange={(e) => updateTokens({ radius: { md: Number(e.target.value), lg: Number(e.target.value) + 6 } })} className="mt-2 w-full" />
        </label>
      </div>

      <section className="stadium-card p-4">
        <h2 className="stadium-title text-xl">Preview rápido</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="stadium-title text-lg">Camisa Oficial 2026</p>
            <p className="text-sm text-[var(--stadium-muted)]">Lançamento com personalização de nome e número.</p>
            <button className="stadium-btn stadium-btn-primary mt-3 px-4 py-2 text-sm font-semibold">Adicionar ao carrinho</button>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm">Frete grátis acima de R$ 299</p>
            <p className="mt-1 text-sm text-[var(--stadium-muted)]">Visual aplicado no mesmo escopo da loja pública.</p>
          </article>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="stadium-btn stadium-btn-primary px-4 py-2 text-sm font-semibold" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar aparência"}</button>
      </div>
    </section>
  );
}
