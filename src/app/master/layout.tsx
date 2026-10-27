import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { duasEtapasObrigatorias, temDuasEtapas } from "@/lib/domain/seguranca-conta";
import { isDemoMode } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  // Duas etapas no Master (D183): aviso até ligar; com MASTER_2FA_OBRIGATORIO=1, o painel só abre depois de ligar.
  if (duasEtapasObrigatorias(session.user)) redirect("/account/seguranca");
  const aviso = !temDuasEtapas(session.user) && !isDemoMode();
  return (
    <RoleLayout session={session}>
      {aviso ? (
        <p role="status" className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
          <ShieldAlert className="size-4 shrink-0" aria-hidden />
          <span>O Master guarda o dinheiro e os dados de todas as marcas. Ligue a verificação em duas etapas.</span>
          <Link href="/account/seguranca" className="font-semibold underline underline-offset-2">Ligar agora</Link>
        </p>
      ) : null}
      {children}
    </RoleLayout>
  );
}
