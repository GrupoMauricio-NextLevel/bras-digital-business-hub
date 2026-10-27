"use server";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession, setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { confirmarDuasEtapas, desligarDuasEtapas, iniciarDuasEtapas, sairDosOutrosAparelhos } from "@/lib/domain/seguranca-conta";

/** A própria pessoa, nunca a equipe NextLevel em modo suporte (D183). */
async function propria() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  if (s.support) throw new ForbiddenError("No modo suporte não dá para mudar a segurança da conta do cliente.");
  return s;
}

/** Encerra as outras sessões e mantém esta (o cookie é regravado com a versão nova). */
export async function sairDosOutrosAparelhosAction() {
  return runAction(async () => {
    const s = await propria();
    await sairDosOutrosAparelhos(await getDb(), s.user.id);
    await setSessionCookie(s.user.id);
    revalidatePath("/account/seguranca");
    return undefined;
  });
}

export async function iniciarDuasEtapasAction() {
  return runAction(async () => {
    const s = await propria();
    const r = await iniciarDuasEtapas(await getDb(), s.user);
    return { segredo: r.segredo, qr: await QRCode.toDataURL(r.endereco, { margin: 1, width: 220 }) };
  });
}

export async function confirmarDuasEtapasAction(codigo: string) {
  return runAction(async () => {
    const s = await propria();
    const codigos = await confirmarDuasEtapas(await getDb(), s.user, codigo);
    revalidatePath("/account/seguranca");
    return { codigos };
  });
}

export async function desligarDuasEtapasAction(codigo: string) {
  return runAction(async () => {
    const s = await propria();
    await desligarDuasEtapas(await getDb(), s.user, codigo);
    revalidatePath("/account/seguranca");
    return undefined;
  });
}
