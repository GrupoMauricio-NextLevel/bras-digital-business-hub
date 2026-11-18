import { permanentRedirect } from "next/navigation";

/** `/empresas` virou a página da NextLevel Sites (D336): o endereço antigo leva para `/sites`. */
export default function ParaEmpresas() {
  permanentRedirect("/sites");
}
