import type * as React from "react";
import { MessageCircle, Mail } from "lucide-react";
import { FotoImersiva } from "@/components/imersiva/foto";
import { EQUIPE_ACERVO, EQUIPE_BASE, type EquipeFotoNome } from "@/lib/marcas/equipe-imagens";
import { AVATAR_CEO, CEO, EQUIPE_ALT } from "@/lib/marcas/equipe";
import { CARTA_DO_FUNDADOR, USOS_EQUIPE, type LugarEquipe } from "@/lib/marcas/equipe-usos";
import { supportContacts } from "@/lib/support";

/**
 * Peças da equipe real da NextLevel (D181). Todas herdam as cores da página onde entram; o texto e a foto de cada lugar
 * vêm do mapa único `USOS_EQUIPE`.
 */

/** Retrato redondo do CEO (96/192 px, AVIF com WebP de reserva). */
export function AvatarCeo({ tamanho = 56, className = "" }: { tamanho?: number; className?: string }) {
  return (
    <picture className={`shrink-0 ${className}`}>
      <source type="image/avif" srcSet={`${AVATAR_CEO}-96.avif 96w, ${AVATAR_CEO}-192.avif 192w`} sizes={`${tamanho}px`} />
      <img src={`${AVATAR_CEO}-192.webp`} srcSet={`${AVATAR_CEO}-96.webp 96w, ${AVATAR_CEO}-192.webp 192w`} sizes={`${tamanho}px`} width={tamanho} height={tamanho} alt="" loading="lazy" decoding="async" className="rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />
    </picture>
  );
}

/** Foto leve (480 px) para painéis e cartões: carrega só quando aparece. */
export function FotoEquipeLeve({ nome, className = "", alt }: { nome: EquipeFotoNome; className?: string; alt?: string }) {
  const f = EQUIPE_ACERVO.fotos[nome];
  return (
    <picture className={className} style={{ backgroundColor: f.cor }}>
      <source type="image/avif" srcSet={`${EQUIPE_BASE}/${nome}-480.avif`} />
      <img src={`${EQUIPE_BASE}/${nome}-480.webp`} width={480} height={Math.round((480 * f.h) / f.w)} alt={alt ?? EQUIPE_ALT[nome]} loading="lazy" decoding="async" className="block h-full w-full object-cover" />
    </picture>
  );
}

/** Assinatura do CEO: retrato, nome e cargo. */
export function AssinaturaCeo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AvatarCeo />
      <p className="leading-snug"><span className="block font-semibold">{CEO.nome}</span><span className="block text-sm opacity-75">{CEO.cargo}</span></p>
    </div>
  );
}

/** Contatos da equipe (WhatsApp e e-mail oficiais). */
export function ContatosEquipe({ mensagem, className = "" }: { mensagem?: string; className?: string }) {
  const c = supportContacts(mensagem);
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {c.whatsappUrl ? <a href={c.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-4 text-sm font-semibold hover:bg-current/5"><MessageCircle className="size-4" aria-hidden />WhatsApp {c.whatsappLabel}</a> : null}
      {c.email ? <a href={`mailto:${c.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-4 text-sm font-semibold hover:bg-current/5"><Mail className="size-4" aria-hidden />{c.email}</a> : null}
    </div>
  );
}

/** Bloco de uma página: foto da equipe, título, texto e ações próprias (`children`). */
export function BlocoEquipe({ lugar, children, className = "", id, contatos = false, mensagem }: { lugar: LugarEquipe; children?: React.ReactNode; className?: string; id?: string; contatos?: boolean; mensagem?: string }) {
  const u = USOS_EQUIPE[lugar];
  const foto = u.fotos[0]!;
  const tituloId = `equipe-${lugar}`;
  return (
    <section id={id} aria-labelledby={tituloId} className={`px-4 py-14 md:py-20 ${className}`}>
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1fr_1fr] md:gap-12">
        <figure className="m-0">
          <FotoImersiva acervo={EQUIPE_ACERVO} nome={foto} alt={EQUIPE_ALT[foto]} sizes="(min-width: 768px) 34rem, 100vw" className="block overflow-hidden rounded-2xl" imgClassName="block h-auto w-full" />
          {u.legenda ? <figcaption className="mt-2 text-sm text-muted-foreground">{u.legenda}</figcaption> : null}
        </figure>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">Equipe NextLevel</p>
          <h2 id={tituloId} className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{u.titulo}</h2>
          <p className="mt-3 text-base leading-relaxed opacity-85 md:text-lg">{u.texto}</p>
          {children ? <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">{children}</div> : null}
          {contatos ? <ContatosEquipe mensagem={mensagem} className="mt-5" /> : null}
          <AssinaturaCeo className="mt-6" />
        </div>
      </div>
    </section>
  );
}

/** Palavra do fundador: retrato do Maurício e o texto em nome dele (escrito a pedido do dono, D181). */
export function CartaFundador({ className = "", compacta = false }: { className?: string; compacta?: boolean }) {
  const u = USOS_EQUIPE["carta-fundador"];
  const foto = u.fotos[0]!;
  const paragrafos = compacta ? [CARTA_DO_FUNDADOR[0], CARTA_DO_FUNDADOR[2], CARTA_DO_FUNDADOR[3]] : CARTA_DO_FUNDADOR;
  return (
    <section aria-labelledby="carta-fundador-t" className={`px-4 py-16 md:py-24 ${className}`}>
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
        <figure className="m-0 md:order-2">
          <FotoImersiva acervo={EQUIPE_ACERVO} nome={foto} alt={EQUIPE_ALT[foto]} sizes="(min-width: 768px) 36rem, 100vw" className="block overflow-hidden rounded-2xl" imgClassName="block h-auto w-full" />
          <figcaption className="mt-2 text-sm text-muted-foreground">{u.legenda}</figcaption>
        </figure>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">Palavra do fundador</p>
          <h2 id="carta-fundador-t" className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">Crescer online é para quem dá o primeiro passo.</h2>
          <blockquote className="mt-5 space-y-4 border-l-2 border-current/25 pl-5 text-lg leading-relaxed opacity-90">
            {paragrafos.map((p) => <p key={p}>{p}</p>)}
          </blockquote>
          <AssinaturaCeo className="mt-6" />
        </div>
      </div>
    </section>
  );
}

/** Cartão de apoio (painéis, cadastro, perguntas): retrato do CEO, frase curta e os contatos da equipe. */
export function ApoioEquipe({ titulo, texto, mensagem, className = "" }: { titulo: string; texto: string; mensagem?: string; className?: string }) {
  return (
    <aside aria-label={titulo} className={`rounded-2xl border border-current/15 p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <AvatarCeo tamanho={48} />
        <div className="min-w-0">
          <p className="font-semibold">{titulo}</p>
          <p className="mt-1 text-sm opacity-80">{texto}</p>
        </div>
      </div>
      <ContatosEquipe mensagem={mensagem} className="mt-4" />
    </aside>
  );
}

/**
 * Boas-vindas do CEO na primeira tela do lojista novo (D181): nos 14 primeiros dias, até a primeira venda paga
 * (`mostrarBoasVindas`). Foto leve da equipe, recado curto em nome do Maurício e os contatos da equipe.
 */
export function BoasVindasCeo({ primeiroNome, marca, className = "" }: { primeiroNome: string; marca: string; className?: string }) {
  return (
    <section aria-labelledby="boas-vindas-ceo" className={`ds-card overflow-hidden !p-0 ${className}`}>
      <div className="grid md:grid-cols-[minmax(0,15rem)_1fr]">
        <FotoEquipeLeve nome="eq-loja-com-cliente" className="hidden h-full min-h-44 md:block" />
        <div className="p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Recado do fundador</p>
          <h2 id="boas-vindas-ceo" className="mt-2 text-xl font-semibold tracking-tight">{primeiroNome}, que bom ter você na {marca}.</h2>
          <p className="mt-2 text-body">Sua loja já existe. Agora é seguir a fila do dia, um passo de cada vez, até a primeira venda. Se travar em qualquer ponto, chame a nossa equipe: quem responde é gente de verdade, na nossa sede em São Paulo.</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <AssinaturaCeo />
            <ContatosEquipe mensagem={`Olá! Sou ${primeiroNome}, lojista da ${marca}, e preciso de ajuda.`} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Faixa discreta de painel interno (D181): foto leve da equipe e uma frase. Só em telas de cultura ou apoio, nunca em tabela ou fila. */
export function FaixaEquipePainel({ nome, titulo, texto, className = "" }: { nome: EquipeFotoNome; titulo: string; texto: string; className?: string }) {
  return (
    <section aria-label={titulo} className={`ds-card mb-6 flex items-center gap-4 overflow-hidden !p-0 ${className}`}>
      <FotoEquipeLeve nome={nome} className="block h-24 w-32 shrink-0 sm:h-28 sm:w-44" />
      <div className="min-w-0 py-3 pr-4">
        <p className="font-semibold">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
      </div>
    </section>
  );
}
