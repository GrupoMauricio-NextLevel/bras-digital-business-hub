"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { pulsoAtendimentoAction } from "@/app/actions/vendedor";
import { pulsoAtendimentoLojaAction } from "@/app/actions/atendimento-loja";

const CHAVE = "nl-sons-painel";

/** "Subida" (racional de sons): três notas curtas que sobem, suaves, menos de meio segundo. Sem arquivo de áudio. */
function tocarSubida() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.11;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.24);
    });
    setTimeout(() => void ctx.close(), 900);
  } catch { /* sem áudio no aparelho: o aviso na tela continua */ }
}

/**
 * Aviso de conversa nova no Master (D205): a cada 15 s confere quantas conversas esperam resposta. Quando aumenta, toca a
 * "Subida" (se o som estiver ligado), mostra um aviso com o atalho e põe o número no título da aba. O botão liga e desliga.
 * Com `loja` (D207), vale para o painel do lojista: conta as perguntas dos clientes feitas no "Dúvidas?" da loja.
 */
export function AvisoSonoro({ loja = false }: { loja?: boolean }) {
  const router = useRouter();
  const [som, setSom] = React.useState(true);
  const antes = React.useRef<number | null>(null);
  const esperandoRef = React.useRef(0);
  // O título da aba carrega o número de conversas esperando; a página reescreve o título ao atualizar, então reaplicamos.
  React.useEffect(() => {
    const aplicar = () => {
      const base = document.title.replace(/^\(\d+\)\s*/, "");
      const novo = esperandoRef.current ? `(${esperandoRef.current}) ${base}` : base;
      if (document.title !== novo) document.title = novo;
    };
    const obs = new MutationObserver(aplicar);
    obs.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => obs.disconnect();
  }, []);
  React.useEffect(() => { const id = requestAnimationFrame(() => { try { setSom(localStorage.getItem(CHAVE) !== "0"); } catch { /* sem armazenamento */ } }); return () => cancelAnimationFrame(id); }, []);
  React.useEffect(() => {
    let vivo = true;
    const conferir = async () => {
      const r = await (loja ? pulsoAtendimentoLojaAction() : pulsoAtendimentoAction());
      if (!vivo || !r.ok || !r.data) return;
      const { esperando, ultima } = r.data;
      esperandoRef.current = esperando;
      const base = document.title.replace(/^\(\d+\)\s*/, "");
      document.title = esperando ? `(${esperando}) ${base}` : base;
      if (antes.current !== null && esperando > antes.current && ultima) {
        let ligado = true;
        try { ligado = localStorage.getItem(CHAVE) !== "0"; } catch { /* padrão: ligado */ }
        if (ligado) tocarSubida();
        router.refresh(); // a fila e os números da tela aberta já mostram a conversa nova
        toast(loja ? `Cliente perguntando: ${ultima.nome ?? "cliente da loja"}` : ultima.canal === "PAINEL" ? `Lojista pedindo ajuda: ${ultima.nome ?? "loja"}` : `Conversa nova: ${ultima.nome ?? "visitante do site"}`, {
          description: ultima.texto ?? undefined, duration: 10_000, action: { label: "Responder", onClick: () => router.push(loja ? `/merchant/atendimento?c=${ultima.id}` : `/master/ia?c=${ultima.id}`) },
        });
      }
      antes.current = esperando;
    };
    void conferir();
    const t = setInterval(() => { if (document.visibilityState === "visible") void conferir(); }, 15_000);
    return () => { vivo = false; clearInterval(t); };
  }, [router, loja]);
  const alternar = () => setSom((s) => { const n = !s; try { localStorage.setItem(CHAVE, n ? "1" : "0"); } catch { /* ok */ } if (n) tocarSubida(); return n; });
  return (
    <button type="button" onClick={alternar} aria-pressed={som} aria-label={som ? "Desligar o som dos avisos" : "Ligar o som dos avisos"} title={som ? "Som dos avisos ligado" : "Som dos avisos desligado"} className="ds-iconbtn">
      {som ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
    </button>
  );
}
