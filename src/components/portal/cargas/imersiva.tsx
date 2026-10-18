import { SecaoImersiva } from "@/components/imersiva/secao-imersiva";
import type { PassoMarca } from "@/components/imersiva/jornada";
import { CG_HOME_ACERVO, type CgHomeFotoNome } from "@/lib/marcas/cargas-home-imagens";

/**
 * Jornada imersiva da NextLevel Cargas (D167): uma carga do Brás até o interior. Só o que existe (D108, D114): coletas por
 * região chamadas pelas importadoras, código de retirada no balcão, link do motorista, extrato do mês, ônibus de excursão com
 * viagens e fardos. Fica na prévia até as fotos chegarem (`cargas-home-imagens.ts`).
 */
const PASSOS: PassoMarca<CgHomeFotoNome>[] = [
  { key: "reserva", nome: "Ver as coletas", foto: "cg-jornada-1-reserva", retrato: "cg-jornada-1-reserva-retrato", titulo: "As coletas da sua rota chegam até você.", texto: "As importadoras do Brás chamam transportadora pelo sistema e as coletas aparecem por região atendida.", links: [{ label: "Cadastrar grátis", href: "#cadastro" }] },
  { key: "coleta", nome: "Coletar", foto: "cg-jornada-2-coleta", retrato: "cg-jornada-2-coleta-retrato", titulo: "Código conferido no balcão.", texto: "Aceite a coleta e receba endereço, janela de retirada e o código do pedido. Sem o código certo, a carga não sai.", links: [{ label: "Como funciona", href: "#como-funciona" }] },
  { key: "estrada", nome: "Levar", foto: "cg-jornada-3-estrada", retrato: "cg-jornada-3-estrada-retrato", titulo: "O motorista confirma pelo celular.", texto: "Retirada e entrega registradas pelo link do motorista, sem instalar aplicativo.", links: [{ label: "Dúvidas", href: "#duvidas" }] },
  { key: "onibus", nome: "Excursão", foto: "cg-jornada-4-onibus", retrato: "cg-jornada-4-onibus-retrato", titulo: "Bagageiro reservado antes da viagem.", texto: "No ônibus de excursão, cada viagem tem espaço medido em fardos e o cliente reserva antes da saída.", links: [{ label: "Cadastrar o ônibus", href: "#cadastro" }] },
  { key: "entrega", nome: "Fechar o mês", foto: "cg-jornada-5-entrega", retrato: "cg-jornada-5-entrega-retrato", titulo: "Entrega registrada, extrato fechado.", texto: "Cada carga entregue entra no extrato do mês, no seu painel.", links: [{ label: "Ver planos", href: "#planos" }] },
];

export function ImersivaCargas({ previa }: { previa: boolean }) {
  return (
    <SecaoImersiva tema="im-tema-cargas" acervo={CG_HOME_ACERVO} previa={previa} portasClassName="cg-claro"
      jornada={{ passos: PASSOS, eyebrow: "Como funciona", titulo: "Do Brás à sua rota, sem prospectar.", rotulo: "Uma carga do Brás até a entrega, em cinco passos" }}
      portas={{ eyebrow: "Por onde começar", titulo: "Cada um entra pelo seu lado da carga.", texto: "O cadastro leva um minuto. A equipe confere os dados e chama você pelo WhatsApp.", itens: [
        { foto: "cg-porta-transportadora", titulo: "Tenho transportadora", texto: "Coletas da sua região, ocupação do caminhão e o código de cada retirada.", href: "#cadastro" },
        { foto: "cg-porta-motorista", titulo: "Sou autônomo", texto: "Cadastro com CPF, os estados que atende e o seu veículo.", href: "#cadastro" },
        { foto: "cg-porta-onibus", titulo: "Tenho ônibus de excursão", texto: "Viagens com bagageiro medido em fardos e reserva antes da saída.", href: "#cadastro" },
        { foto: "cg-porta-importadora", titulo: "Sou importadora", texto: "Chame transportadora com um toque e confira cada retirada pelo código.", href: "#importadoras", cta: "Ver para importadoras" },
      ] }} />
  );
}
