import { CONTATOS } from "@/lib/contatos";

const LINHAS: { k: keyof typeof CONTATOS; rotulo: string }[] = [
  { k: "comercial", rotulo: "Quero uma loja" },
  { k: "suporte", rotulo: "Já sou cliente" },
  { k: "financeiro", rotulo: "Faturas e contratos" },
  { k: "parceiros", rotulo: "Parceiros" },
];

/** E-mails por assunto (D290): a mensagem já chega no endereço certo da caixa do Master. */
export function ContatosPorAssunto() {
  return (
    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {LINHAS.map((l) => <span key={l.k}>{l.rotulo}: <a className="underline underline-offset-2" href={`mailto:${CONTATOS[l.k]}`}>{CONTATOS[l.k]}</a></span>)}
    </p>
  );
}
