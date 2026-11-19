"use client";

import * as React from "react";

export function JerseyPersonalizer() {
  const [nome, setNome] = React.useState("SEU NOME");
  const [numero, setNumero] = React.useState("10");
  return (
    <section className="stadium-card p-4" aria-label="Personalização da camisa">
      <h3 className="stadium-title text-xl">Personalize sua camisa</h3>
      <p className="mt-1 text-sm text-[var(--stadium-muted)]">Pré-visualização ao vivo para nome e número.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Nome
          <input className="stadium-input mt-1" value={nome} maxLength={16} onChange={(e) => setNome(e.target.value.toUpperCase())} />
        </label>
        <label className="text-sm">Número
          <input className="stadium-input mt-1" value={numero} maxLength={2} onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 2))} />
        </label>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-[var(--stadium-border)] bg-black/20 p-4 text-center">
        <p className="stadium-title text-2xl">{nome || "SEU NOME"}</p>
        <p className="stadium-title mt-1 text-5xl">{numero || "00"}</p>
      </div>
    </section>
  );
}
