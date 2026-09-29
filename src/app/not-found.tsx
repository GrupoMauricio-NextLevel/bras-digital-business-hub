import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <EmptyState title="Página não encontrada" description="O endereço acessado não existe ou foi removido." action={<Link href="/" className={buttonVariants()}>Ir para o início</Link>} />
    </div>
  );
}
