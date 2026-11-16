import { eq } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { newId } from "@/lib/ids";
import { markInvoicePaid } from "@/lib/domain/finance";
import { signupMember } from "@/lib/domain/store-access";
import { ativarAcademia } from "@/lib/domain/business/academia";

export const ACADEMIA_DEMO_EMAIL = "academia@renner.demo";

const dia = (n: number) => { const d = new Date(Date.now() - 3 * 3_600_000); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const atras = (n: number, h = 14) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d.toISOString(); };

/**
 * Conta teste da NextLevel Business (piloto A1, D307): Academia Renner, no Guacuri (São Paulo). Página de captação e
 * interessados fictícios em etapas e origens variadas, para conferir o painel. Só roda na demonstração; idempotente.
 * Os textos da página são de exemplo: o dono da academia ajusta em "Página da academia".
 * Login: academia@renner.demo (senha de demonstração).
 */
export async function seedAcademiaRenner(db: Database): Promise<boolean> {
  if (await db.query.users.findFirst({ where: eq(s.users.email, ACADEMIA_DEMO_EMAIL) })) return false;
  const r = await signupMember(db, { storeName: "Academia Renner", ownerName: "Equipe Renner", email: ACADEMIA_DEMO_EMAIL, password: DEMO_PASSWORD, taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
  for (const inv of await db.select().from(s.financeInvoices).where(eq(s.financeInvoices.storeId, r.storeId))) await markInvoicePaid(db, inv.id);
  await db.update(s.stores).set({ whatsapp: "11900000000", instagram: "academiarenner", address: "Bairro Guacuri, zona sul de São Paulo (endereço completo a confirmar)" }).where(eq(s.stores.id, r.storeId));
  await ativarAcademia(db, r.storeId, {
    bairro: "Guacuri", cidade: "São Paulo",
    chamada: "Treine no Guacuri: a primeira aula é por nossa conta",
    sobre: "Academia de bairro, perto de casa, com professores na área e horários para quem trabalha cedo ou sai tarde.",
    modalidades: ["Musculação", "Funcional", "Lutas", "Dança"],
    destaques: ["Professor acompanhando o seu treino", "Aberta cedo e até tarde", "Aula experimental sem compromisso"],
    horarios: "Segunda a sexta: 6h às 23h\nSábado: 8h às 14h",
    diasExperimental: [1, 2, 3, 4, 5, 6],
  });
  const exemplos: { nome: string; whats: string; origem: string; interesse: string; turno: "MANHA" | "TARDE" | "NOITE"; criado: number; dia?: number; veio?: boolean; naoVeio?: boolean; matriculou?: boolean; perdido?: string }[] = [
    { nome: "Juliana Prado", whats: "11911110001", origem: "instagram", interesse: "Funcional", turno: "NOITE", criado: 0, dia: 1 },
    { nome: "Marcos Vieira", whats: "11911110002", origem: "instagram", interesse: "Musculação", turno: "MANHA", criado: 1, dia: 2 },
    { nome: "Patrícia Gomes", whats: "11911110003", origem: "whatsapp", interesse: "Dança", turno: "TARDE", criado: 3, dia: -1 },
    { nome: "Rafael Souza", whats: "11911110004", origem: "google", interesse: "Lutas", turno: "NOITE", criado: 4, dia: -2, veio: true },
    { nome: "Camila Rocha", whats: "11911110005", origem: "instagram", interesse: "Musculação", turno: "NOITE", criado: 6, dia: -4, veio: true, matriculou: true },
    { nome: "André Lima", whats: "11911110006", origem: "panfleto", interesse: "Musculação", turno: "MANHA", criado: 8, dia: -6, naoVeio: true },
    { nome: "Fernanda Alves", whats: "11911110007", origem: "indicacao", interesse: "Funcional", turno: "MANHA", criado: 10, dia: -8, veio: true, matriculou: true },
    { nome: "Lucas Martins", whats: "11911110008", origem: "direto", interesse: "Lutas", turno: "TARDE", criado: 12, perdido: "Horário" },
    { nome: "Beatriz Costa", whats: "11911110009", origem: "instagram", interesse: "Dança", turno: "NOITE", criado: 2 },
  ];
  for (const e of exemplos) {
    const criado = atras(e.criado);
    const fato = e.dia !== undefined ? atras(Math.max(0, -e.dia), 20) : criado;
    await db.insert(s.businessContatos).values({
      id: newId("bct"), storeId: r.storeId, nome: e.nome, whatsapp: e.whats, interesse: e.interesse, turno: e.turno, experimentalDia: e.dia !== undefined ? dia(e.dia) : null,
      origem: e.origem, consentimento: true, veioEm: e.veio ? fato : null, naoVeioEm: e.naoVeio ? fato : null, matriculouEm: e.matriculou ? fato : null,
      perdidoEm: e.perdido ? criado : null, motivoPerda: e.perdido ?? null, createdAt: criado, updatedAt: fato,
    });
  }
  return true;
}
