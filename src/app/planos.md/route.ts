import { planosMd } from "@/lib/seo/llms";
import { respostaTexto } from "@/lib/seo/rota-texto";

export const dynamic = "force-dynamic";

/** /planos.md para leitura por IA (D303). */
export const GET = () => respostaTexto(planosMd, "text/markdown");
