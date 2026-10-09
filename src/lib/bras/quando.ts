/** Data e hora de Brasília, curtas: "qui, 10/10 às 18:00" (Estúdio e avisos da Brás). */
export const quando = (iso: string) => {
  const d = new Date(iso);
  const dia = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).replace(".", "");
  return `${dia} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`;
};
