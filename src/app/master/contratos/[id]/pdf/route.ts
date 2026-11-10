import { respostaPdfDoContrato } from "@/lib/contratos/pdf-resposta";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return respostaPdfDoContrato((await params).id);
}
