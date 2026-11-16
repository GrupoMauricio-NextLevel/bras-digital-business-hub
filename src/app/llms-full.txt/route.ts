import { llmsFullTxt } from "@/lib/seo/llms";
import { respostaTexto } from "@/lib/seo/rota-texto";

export const dynamic = "force-dynamic";

/** /llms-full.txt para leitura por IA (D303). */
export const GET = () => respostaTexto(llmsFullTxt, "text/plain");
