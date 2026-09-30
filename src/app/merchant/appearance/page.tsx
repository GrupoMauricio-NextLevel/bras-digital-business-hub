import { redirect } from "next/navigation";

/** A aparência agora é editada no editor de tema (seções, cores, fontes e prévia ao vivo). */
export default function AppearancePage() {
  redirect("/theme-editor");
}
