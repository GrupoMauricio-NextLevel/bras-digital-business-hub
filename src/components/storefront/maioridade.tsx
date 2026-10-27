"use client";
import * as React from "react";

/**
 * Confirmação de maioridade (Rodada A, I-11, D189): na primeira visita a loja pergunta se a pessoa tem 18 anos.
 * A resposta fica só neste navegador; quem diz que não tem 18 não vê a loja.
 */
const CHAVE = "nl-maioridade";
const AVISO = "nl-maioridade-mudou";
const ler = () => { try { return localStorage.getItem(CHAVE) ?? ""; } catch { return ""; } };
const assinar = (fn: () => void) => { window.addEventListener(AVISO, fn); window.addEventListener("storage", fn); return () => { window.removeEventListener(AVISO, fn); window.removeEventListener("storage", fn); }; };

export function Maioridade({ loja }: { loja: string }) {
  // No servidor a janela não aparece (evita piscar para quem já confirmou); no navegador vale o que foi guardado.
  const resposta = React.useSyncExternalStore(assinar, ler, () => "sim");
  const responder = (v: "sim" | "nao") => { try { localStorage.setItem(CHAVE, v); } catch { /* navegador sem armazenamento: vale só nesta página */ } window.dispatchEvent(new Event(AVISO)); };
  if (resposta === "sim") return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/85 p-4" data-maioridade>
      <div role="dialog" aria-modal="true" aria-labelledby="maioridade-titulo" className="w-full max-w-sm rounded-[var(--sf-radius)] bg-white p-6 text-center text-neutral-900 shadow-xl">
        {resposta === "nao" ? (
          <>
            <h2 id="maioridade-titulo" className="text-lg font-semibold">Esta loja é só para maiores de 18 anos</h2>
            <p className="mt-2 text-sm text-neutral-600">Se você respondeu errado, toque abaixo para responder de novo.</p>
            <button type="button" onClick={() => { try { localStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ } window.dispatchEvent(new Event(AVISO)); }} className="mt-5 w-full rounded-[var(--sf-radius)] border border-neutral-300 px-4 py-2.5 text-sm font-medium">Responder de novo</button>
          </>
        ) : (
          <>
            <h2 id="maioridade-titulo" className="text-lg font-semibold">Você tem 18 anos ou mais?</h2>
            <p className="mt-2 text-sm text-neutral-600">{loja} vende produtos só para maiores de idade.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" autoFocus onClick={() => responder("sim")} className="rounded-[var(--sf-radius)] px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>Sim, tenho</button>
              <button type="button" onClick={() => responder("nao")} className="rounded-[var(--sf-radius)] border border-neutral-300 px-4 py-2.5 text-sm font-medium">Não</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
