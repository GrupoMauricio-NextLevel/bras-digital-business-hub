import { permanentRedirect } from "next/navigation";

/** A página para fornecedores mudou para /seja-fornecedor (copy própria, separada da página de quem vende). */
export default function Fornecedores() { permanentRedirect("/seja-fornecedor"); }
