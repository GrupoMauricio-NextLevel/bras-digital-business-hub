"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createPortal } from "react-dom";
import { ArrowUp, Menu, PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShellBottomItem = { key: string; label: string; icon: React.ReactNode; render: (props: { className?: string }) => React.ReactNode };
export type ShellNavContext = { collapsed: boolean; close?: () => void };

/**
 * Casca OPERACIONAL do sistema de design (um único componente para Master, Fornecedor, Lojista, Parceiro, Commerce e ADM).
 * Layout: menu lateral 272/78, barra superior translúcida, conteúdo até 1400, gaveta acessível no celular (Radix: foco preso, Escape,
 * retorno do foco, trava de rolagem) e barra de atalhos inferior. NÃO conhece produto, permissão nem empresa: recebe tudo por slots.
 */
export function OperationalShell({
  brand, area, renderNav, sideTop, sideFooter, crumb, topActions, banner, bottom, overlays, children, drawerTitle, variant = "full", skipLabel = "Pular para o conteúdo", faixa,
}: {
  brand: React.ReactNode;
  area?: React.ReactNode;
  renderNav: (ctx: ShellNavContext) => React.ReactNode;
  sideTop?: React.ReactNode;
  sideFooter?: React.ReactNode;
  crumb: React.ReactNode;
  topActions: React.ReactNode;
  banner?: React.ReactNode;
  bottom?: ShellBottomItem[];
  overlays?: React.ReactNode;
  children: React.ReactNode;
  drawerTitle: string;
  /** "bare" = sem menu lateral (ex.: Expedição). */
  variant?: "full" | "bare";
  skipLabel?: string;
  /** Capa (D198): faixa escura do ecossistema no topo (início, meio) e moldura de cantos amplos; a barra superior vira a faixa. */
  /** Capa (D198). `agente`: no celular, a pílula "Pergunte ao Maurício" flutua ao lado do botão de menu (D255). */
  faixa?: { inicio?: React.ReactNode; meio?: React.ReactNode; agente?: boolean };
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const bare = variant === "bare";
  const [noNavegador, setNoNavegador] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setNoNavegador(true)); return () => cancelAnimationFrame(id); }, []);

  React.useEffect(() => { const id = requestAnimationFrame(() => { try { setCollapsed(localStorage.getItem("nl-sidebar") === "1"); } catch { /* ignore */ } }); return () => cancelAnimationFrame(id); }, []);
  const toggle = () => setCollapsed((c) => { const n = !c; try { localStorage.setItem("nl-sidebar", n ? "1" : "0"); } catch { /* ignore */ } return n; });

  const capa = !!faixa && !bare;
  const topo = (
    <header className={cn("ds-top", capa && "ds-faixa")}>
      {!bare ? <button type="button" className="ds-iconbtn ds-only-compact" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="size-5" aria-hidden /></button> : null}
      {capa ? <><div className="ds-faixa-inicio">{faixa.inicio}</div><div className="ds-faixa-meio">{faixa.meio}</div></> : <div className="min-w-0">{crumb}</div>}
      <div className="ds-top-actions">{topActions}</div>
    </header>
  );

  return (
    <div className={cn("ds-app", collapsed && !bare && "ds-app--collapsed", bare && "ds-app--bare", capa && "ds-app--capa")}>
      <a href="#conteudo" className="ds-skip">{skipLabel}</a>
      {capa ? topo : null}

      {!bare ? (
        <aside className="ds-side" aria-label="Menu lateral">
          <div className="ds-side-head">{brand}</div>
          {area && !collapsed ? <p className="ds-area">{area}</p> : null}
          {sideTop}
          <div className="ds-nav nl-scroll">{renderNav({ collapsed })}</div>
          <div className="ds-side-foot">
            {sideFooter && !collapsed ? sideFooter : null}
            <button type="button" className="ds-collapse" onClick={toggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} title={collapsed ? "Expandir menu" : "Recolher menu"}>
              {collapsed ? <PanelLeftOpen className="size-[18px]" aria-hidden /> : <><PanelLeftClose className="size-[18px]" aria-hidden /><span>Recolher menu</span></>}
            </button>
          </div>
        </aside>
      ) : null}

      <div className="ds-main">
        {capa ? null : topo}
        <main id="conteudo" className="ds-content">{banner}{children}</main>
      </div>

      {!bare ? (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className={cn("ds-scrim animate-fade-in", capa && "ds-scrim--capa")} />
            <Dialog.Content className={cn("ds-drawer animate-slide-in-left focus:outline-none", capa && "ds-drawer--capa")} aria-describedby={undefined}
              onInteractOutside={(e) => { if ((e.target as Element | null)?.closest?.(".ds-flutua-menu")) e.preventDefault(); }}>
              <Dialog.Title className="sr-only">{drawerTitle}</Dialog.Title>
              <div className="ds-side ds-side--drawer">
                <div className="ds-side-head">{brand}<Dialog.Close className="ds-iconbtn" aria-label="Fechar menu"><X className="size-5" aria-hidden /></Dialog.Close></div>
                {area ? <p className="ds-area">{area}</p> : null}
                {sideTop}
                <div className="ds-nav nl-scroll">{renderNav({ collapsed: false, close: () => setOpen(false) })}</div>
                {sideFooter ? <div className="ds-side-foot">{sideFooter}</div> : null}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}

      {/* Capa no celular (D255, padrão da referência): menu e agente flutuam embaixo, no lugar da barra de atalhos. */}
      {capa && noNavegador ? createPortal(
        <div className="ds-flutua nl-no-print">
          <button type="button" className="ds-flutua-menu" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}>
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
          {faixa.agente && !open ? (
            <button type="button" className="ds-flutua-agente" onClick={() => window.dispatchEvent(new Event("nl-mauricio"))}>
              <Sparkles className="size-5 shrink-0 text-[var(--ds-primary)]" aria-hidden /><span className="truncate">Pergunte ao Maurício…</span>
              <span className="ds-flutua-enviar" aria-hidden><ArrowUp className="size-4" /></span>
            </button>
          ) : null}
        </div>, document.body,
      ) : null}
      {!bare && !capa && bottom && bottom.length ? (
        <nav className="ds-bottom nl-no-print" aria-label="Atalhos">
          <ul>
            {bottom.map((b) => <li key={b.key}>{b.render({})}</li>)}
            <li><button type="button" onClick={() => setOpen(true)}><Menu className="size-5" aria-hidden /><span>Mais</span></button></li>
          </ul>
        </nav>
      ) : null}
      {overlays}
    </div>
  );
}
