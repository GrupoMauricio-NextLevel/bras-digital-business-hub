import Link from "next/link";
import { LogoDoEndereco } from "@/components/brand/logo-do-endereco";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { FotoErro } from "@/components/app/foto-erro";

export default async function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <LogoDoEndereco className="mb-4" alturaClasse="h-10" />
      <FotoErro />
      <EmptyState title="Página não encontrada" description="O endereço acessado não existe ou foi removido." action={<Link href="/" className={buttonVariants()}>Ir para o início</Link>} />
    </div>
  );
}
