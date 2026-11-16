"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { publishStoreAction } from "@/app/actions/merchant";

/** Publicar a vitrine. `site` (NB2, D307): o texto fala de site para quem está no caminho Site. */
export function PublishToggle({ published, site = false }: { published: boolean; site?: boolean }) {
  const nome = site ? "site" : "loja";
  const router = useRouter();
  const [pending, start] = React.useTransition();
  if (published) {
    return (
      <ConfirmDialog trigger={<Button variant="secondary" className="w-full">{`Despublicar ${nome}`}</Button>} title={`Despublicar ${nome}`} description={`Os visitantes verão uma página indisponível até você publicar ${site ? "o site" : "a loja"} novamente.`} confirmLabel="Despublicar" destructive onConfirm={async () => { const r = await publishStoreAction(false); if (r.ok) { toast.success("Loja despublicada"); router.refresh(); } else toast.error(r.error); }} />
    );
  }
  return <Button className="w-full" variant="brand" loading={pending} onClick={() => start(async () => { const r = await publishStoreAction(true); if (r.ok) { toast.success(site ? "Site publicado!" : "Loja publicada!"); router.refresh(); } else toast.error(r.error); })}>{`Publicar ${nome}`}</Button>;
}
