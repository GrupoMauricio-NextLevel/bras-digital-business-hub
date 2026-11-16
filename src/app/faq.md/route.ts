import { faqMd } from "@/lib/seo/llms";
import { respostaTexto } from "@/lib/seo/rota-texto";

export const dynamic = "force-dynamic";

/** /faq.md para leitura por IA (D303). */
export const GET = () => respostaTexto(faqMd, "text/markdown");
