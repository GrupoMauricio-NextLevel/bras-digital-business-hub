import { redirect } from "next/navigation";

/** Endereço antigo do Estúdio: agora a Brás tem área própria no Master, com a cor e o menu dela (`/bras`). */
export default function EstudioAntigo() {
  redirect("/bras");
}
