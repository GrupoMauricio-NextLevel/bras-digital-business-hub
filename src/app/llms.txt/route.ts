import { llmsTxt } from "@/lib/seo/llms";
import { respostaTexto } from "@/lib/seo/rota-texto";

export const dynamic = "force-dynamic";

/** /llms.txt para leitura por IA (D303). */
export const GET = () => respostaTexto(llmsTxt, "text/plain");
