"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { emails, sendEmail } from "@/lib/email";

/** Só o Master: envia um e-mail de teste para conferir a configuração do provedor. */
export async function sendTestEmailAction(to: string) {
  return runAction(async () => {
    const s = await getSession();
    if (!s || s.user.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError("Apenas a NextLevel.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new DomainError("EMAIL", "E-mail inválido.");
    const m = emails.invoicePaid("E-mail de teste da configuração", 100, "/master");
    const status = await sendEmail(await getDb(), { kind: "TEST", to: to.trim().toLowerCase(), ...m, subject: "Teste de e-mail SuperDrop", text: "Se você recebeu este e-mail, a configuração de envio está funcionando.\n\n— Equipe NextLevel" });
    revalidatePath("/master/settings");
    return { status };
  });
}
