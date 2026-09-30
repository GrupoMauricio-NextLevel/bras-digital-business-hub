import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { addLabelFile, MAX_LABEL_BYTES } from "@/lib/domain/labels";
import { DomainError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

/** Upload da etiqueta (multipart, campo `file`). Fica em rota própria: server actions limitam o corpo a 1 MB. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_LABEL_BYTES + 64 * 1024) return NextResponse.json({ ok: false, error: "A etiqueta deve ter no máximo 3 MB." }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Selecione o arquivo PDF." }, { status: 400 });
    const { orderId } = await ctx.params;
    const r = await addLabelFile(await getDb(), session.actor, orderId, { filename: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    revalidatePath("/merchant", "layout"); revalidatePath("/supplier", "layout");
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof DomainError) return NextResponse.json({ ok: false, error: e.message, code: e.code }, { status: e.code === "FORBIDDEN" ? 403 : 400 });
    console.error(e);
    return NextResponse.json({ ok: false, error: "Falha ao enviar a etiqueta." }, { status: 500 });
  }
}
