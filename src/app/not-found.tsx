import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { FotoErro } from "@/components/app/foto-erro";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <Logo className="mx-auto mb-4 h-10" />
      <FotoErro />
      <EmptyState title="Página não encontrada" description="O endereço acessado não existe ou foi removido." action={<Link href="/" className={buttonVariants()}>Ir para o início</Link>} />
    </div>
  );
}
