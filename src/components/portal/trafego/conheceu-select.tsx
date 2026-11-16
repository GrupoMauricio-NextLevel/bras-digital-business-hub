import { CONHECEU_POR, GRUPO_CONHECEU } from "@/lib/trafego/conheceu";

/** Opções de "Como você conheceu a NextLevel?" (D303), agrupadas. Opcional: o primeiro item é "Prefiro não dizer". */
export function OpcoesConheceu() {
  const grupos = Object.entries(GRUPO_CONHECEU) as [keyof typeof GRUPO_CONHECEU, string][];
  return (
    <>
      <option value="">Prefiro não dizer</option>
      {grupos.map(([g, rotulo]) => (
        <optgroup key={g} label={rotulo}>
          {CONHECEU_POR.filter((c) => c.grupo === g).map((c) => <option key={c.chave} value={c.chave}>{c.rotulo}</option>)}
        </optgroup>
      ))}
    </>
  );
}
