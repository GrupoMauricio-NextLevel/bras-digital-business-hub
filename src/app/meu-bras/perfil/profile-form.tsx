"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EMPTY_PROFILE, ProfileQuestions, profileComplete, type ProfileDraft } from "@/components/portal/bras/profile-questions";
import { saveMyBrasProfileAction } from "@/app/actions/bras";
import { BRAS_LEVEL_LABEL } from "@/lib/bras/perfil-perguntas";

export function ProfileForm({ initial }: { initial: ProfileDraft | null }) {
  const router = useRouter();
  const [p, setP] = React.useState<ProfileDraft>(initial ?? EMPTY_PROFILE);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form className="space-y-5" aria-label="Meu perfil de compra" onSubmit={(e) => {
      e.preventDefault(); setError(null);
      if (!profileComplete(p)) { setError("Responda todas as perguntas."); return; }
      start(async () => {
        const r = await saveMyBrasProfileAction(p as never);
        if (r.ok) { toast.success(`Perfil gravado. Painel ajustado para ${BRAS_LEVEL_LABEL[r.data.level]}.`); router.push("/meu-bras"); router.refresh(); } else { setError(r.error); toast.error(r.error); }
      });
    }}>
      <ProfileQuestions value={p} onChange={setP} idPrefix="perfil" />
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" loading={pending}>Gravar meu perfil</Button>
    </form>
  );
}
