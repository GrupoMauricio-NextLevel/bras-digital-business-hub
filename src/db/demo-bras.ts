import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "./client";
import { bdImporters, trCarriers, users } from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { hashPassword } from "@/lib/security/password";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasImporter, createBrasRequest, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { createImporterAccess, moveImporterStock, saveImporterProduct } from "@/lib/domain/bras/importadora";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { grantBrasAccess } from "@/lib/domain/bras/descobertas";
import { createCarrier, createCarrierAccess } from "@/lib/domain/cargas/cargas";
import { createTrip, reserveParcels, respondParcel, saveRoute } from "@/lib/domain/cargas/excursao";
import { createCounter, myClubCard, registerPurchase } from "@/lib/domain/club/balcao";
import { openTicket } from "@/lib/domain/fiscal/meu-contador";
import { createMasterMember } from "@/lib/domain/equipe-master";

/**
 * Mundo da Brás Digital e do grupo para o ambiente de demonstração e de gravação de treinamentos (D144). Só roda no
 * banco de demonstração (chamado pelo bootstrap com dados de demonstração) e só uma vez. Tudo passa pelas funções do
 * próprio sistema, como uma pessoa faria nas telas; nomes e documentos são fictícios e marcados "(demonstração)".
 * Senha de todos os acessos: a mesma da demonstração.
 */
export const DEMO_BRAS_ACCOUNTS = {
  membro: "membro@bras.demo",
  membro2: "loja2@bras.demo",
  importadora: "importadora@bras.demo",
  importadoraBalcao: "balcao@bras.demo",
  transportadora: "transportadora@cargas.demo",
  onibus: "onibus@cargas.demo",
  comercial: "comercial@nextlevel.demo",
  suporte: "suporte@nextlevel.demo",
  financeiro: "financeiro@nextlevel.demo",
  contador: "contador@nextlevel.demo",
} as const;

const SENTINEL = "Importadora Aurora (demonstração)";
const NFE = "35261047173173000175550010000000111000000018";
const localIn = (days: number, hours = 0) => new Date(Date.now() + days * 86_400_000 + hours * 3_600_000 - 3 * 3_600_000).toISOString().slice(0, 16);
const envio = { shipName: "Ana Recebimento", shipAddress: "Rua das Flores, 100, Centro", shipCity: "Belo Horizonte", shipState: "MG" as const, shipZip: "30110-000" };

export async function seedDemoBras(db: Database, log: (m: string) => void = () => {}): Promise<boolean> {
  if (await db.query.bdImporters.findFirst({ where: eq(bdImporters.name, SENTINEL) })) return false;
  const masterUser = await db.query.users.findFirst({ where: eq(users.role, "NEXTLEVEL_MASTER") });
  if (!masterUser) return false;
  const master = actorFromUser(masterUser);
  const as = async (userId: string): Promise<Actor> => actorFromUser((await db.query.users.findFirst({ where: eq(users.id, userId) }))!);
  // Cada bloco é independente: se uma regra mudar e um bloco falhar, o resto da demonstração continua de pé.
  const step = async (name: string, fn: () => Promise<void>) => { try { await fn(); } catch (e) { log(`demonstração: "${name}" não foi criado (${(e as Error).message})`); } };

  // 1. Importadora com login, produtos de caixa fechada e estoque.
  const importerId = (await addBrasImporter(db, master, { name: SENTINEL, notes: "Importadora fictícia para treinamentos" })).id;
  let importer: Actor | null = null;
  const products: string[] = [];
  await step("importadora", async () => {
    importer = await as((await createImporterAccess(db, master, importerId, { name: "Rafael Aurora", email: DEMO_BRAS_ACCOUNTS.importadora, password: DEMO_PASSWORD, staffRole: "DONO" })).userId);
    await createImporterAccess(db, importer, null, { name: "Bia do Balcão", email: DEMO_BRAS_ACCOUNTS.importadoraBalcao, password: DEMO_PASSWORD, staffRole: "BALCAO" });
    const items = [
      { sku: "GT-1L", title: "Garrafa térmica inox 1 L", unitsPerBox: 24, priceTiers: [{ minBoxes: 1, priceBoxCents: 30_000 }, { minBoxes: 10, priceBoxCents: 27_000 }], stock: 40 },
      { sku: "KIT-POTES", title: "Kit 5 potes herméticos", unitsPerBox: 30, priceTiers: [{ minBoxes: 1, priceBoxCents: 21_000 }, { minBoxes: 5, priceBoxCents: 19_500 }], stock: 25 },
      { sku: "LUM-LED", title: "Luminária LED de mesa recarregável", unitsPerBox: 20, priceTiers: [{ minBoxes: 1, priceBoxCents: 38_000 }], stock: 12 },
    ];
    for (const it of items) {
      const { id } = await saveImporterProduct(db, importer, null, null, { sku: it.sku, title: it.title, unitsPerBox: it.unitsPerBox, boxLengthMm: 500, boxWidthMm: 400, boxHeightMm: 300, grossWeightG: 12_000, priceTiers: it.priceTiers, minBoxes: 1, status: "ATIVO" });
      await moveImporterStock(db, importer, null, { productId: id, kind: "ENTRADA", boxes: it.stock, note: "Chegada do contêiner (demonstração)" });
      products.push(id);
    }
  });

  // 2. Descobertas (vídeos) com oferta ligada aos produtos.
  const videos: string[] = [];
  await step("descobertas", async () => {
    const vs = [
      { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", title: "Garrafa térmica que mais sai no Brás", summary: "Caixa com 24, preço de atacado" },
      { url: "https://www.youtube.com/watch?v=ScMzIvxBSi4", title: "Potes herméticos: giro rápido em utilidades", summary: "Kit de 5 potes, caixa com 30" },
      { url: "https://www.youtube.com/watch?v=YE7VzlLtp-4", title: "Luminária LED: margem boa no fim de ano", summary: "Caixa com 20 unidades" },
    ];
    for (const [i, v] of vs.entries()) {
      const id = (await addBrasVideo(db, master, v)).id;
      await setBrasOffer(db, master, id, { importerId, priceBoxCents: [30_000, 21_000, 38_000][i]!, unitsPerBox: [24, 30, 20][i]!, boxesAvailable: null, ...(products[i] ? { productId: products[i] } : {}) });
      videos.push(id);
    }
  });

  // 3. Membros (lojistas com CNPJ) com plano, pedidos em cada etapa e cartão do Club.
  let ana: Actor | null = null;
  await step("membros e pedidos", async () => {
    const r = await signupBrasMember(db, { name: "Ana Souza", companyName: "Ana Utilidades (demonstração)", cnpj: "90900001000185", whatsapp: "31988887777", email: DEMO_BRAS_ACCOUNTS.membro, password: DEMO_PASSWORD, acceptTerms: true });
    ana = await as(r.userId);
    const m = (await getBrasMemberByUser(db, r.userId))!;
    await grantBrasAccess(db, master, { memberId: m.id, kind: "COURTESY", plan: "OURO", days: 365, note: "Demonstração" });
    const r2 = await signupBrasMember(db, { name: "Carlos Lima", companyName: "Lima Presentes (demonstração)", cnpj: "90900002000120", whatsapp: "41977776666", email: DEMO_BRAS_ACCOUNTS.membro2, password: DEMO_PASSWORD, acceptTerms: true });
    const carlos = await as(r2.userId);
    const path: ("CONFIRMED" | "PAID" | "PICKED_UP")[][] = [[], ["CONFIRMED"], ["CONFIRMED", "PAID"], ["CONFIRMED", "PAID", "PICKED_UP"]];
    for (const [i, steps] of path.entries()) {
      const buyer = i % 2 ? carlos : ana;
      const videoId = videos[i % videos.length];
      if (!videoId) break;
      const { id } = await createBrasRequest(db, buyer, { videoId, boxes: 2 + i, carrier: "Braspress", ...envio });
      for (const s of steps) await setBrasRequestStatus(db, master, id, s);
    }
  });

  // 4. Transportadora com login (a "Rota Ouro" fictícia, nível Ouro) e o ônibus de excursão com rota, viagem e fardos.
  await step("transportadora", async () => {
    const ouro = await db.query.trCarriers.findFirst({ where: eq(trCarriers.document, "90.000.001/0001-01") });
    if (ouro) await createCarrierAccess(db, master, ouro.id, { name: "Joana Rota Ouro", email: DEMO_BRAS_ACCOUNTS.transportadora, password: DEMO_PASSWORD });
  });
  await step("ônibus de excursão", async () => {
    const id = (await createCarrier(db, master, { name: "Excursão Boa Viagem (demonstração)", docType: "CNPJ", document: "90.900.003/0001-74", contactName: "Seu Zé", phone: "31999990000", ufs: ["MG"], vehicles: ["ONIBUS_EXCURSAO"], operation: "EXCURSAO" })).id;
    const bus = await as((await createCarrierAccess(db, master, id, { name: "Seu Zé da Excursão", email: DEMO_BRAS_ACCOUNTS.onibus, password: DEMO_PASSWORD })).userId);
    const routeId = (await saveRoute(db, bus, null, null, { name: "Brás ↔ Belo Horizonte", originCity: "Belo Horizonte", originUf: "MG", brasPoint: "Rua Rodrigues dos Santos, 600", cityPoint: "Rodoviária de Belo Horizonte", travelHours: 9, arrivalWeekdays: [2, 5], prices: { P: 3_000, M: 5_000, G: 8_000 } })).id;
    const tripId = (await createTrip(db, bus, null, { routeId, arriveBrasAt: localIn(2), departAt: localIn(2, 8) })).id;
    if (ana) {
      const r = await reserveParcels(db, ana, { tripId, items: { P: 2, M: 1, G: 0 }, storeName: "Importadora Aurora, box 14", recipientName: "Ana Souza", invoiceKey: NFE });
      if (r.parcels[0]) await respondParcel(db, bus, r.parcels[0].id, { accept: true });
    }
  });

  // 5. Club: compra no balcão de uma empresa do grupo vira pontos; um chamado no Meu Contador.
  await step("Club e Meu Contador", async () => {
    if (!ana) return;
    const card = (await myClubCard(db, ana.userId)).token;
    const { token } = await createCounter(db, master, { company: "MEGATRON", name: "Mega Tron · box 12 (demonstração)" });
    await registerPurchase(db, token, { card, valueCents: 85_000, receipt: "DEMO-001" });
    await openTicket(db, ana, { storeName: "Loja do Pedro, Rua Oriente", description: "Comprei 3 caixas de potes e a loja não emitiu a nota", approxValueCents: 63_000 });
  });

  // 6. Equipe do Master com cada função, para gravar o que cada pessoa enxerga.
  await step("equipe do Master", async () => {
    const team = [["Camila Comercial", DEMO_BRAS_ACCOUNTS.comercial, "COMERCIAL"], ["Sérgio Suporte", DEMO_BRAS_ACCOUNTS.suporte, "SUPORTE"], ["Fernanda Financeiro", DEMO_BRAS_ACCOUNTS.financeiro, "FINANCEIRO"], ["Escritório Contábil (demonstração)", DEMO_BRAS_ACCOUNTS.contador, "CONTADOR"]] as const;
    for (const [name, email, masterFunction] of team) await createMasterMember(db, master, { name, email, password: "provisoria-demo-1", masterFunction });
  });

  // Todos entram com a senha da demonstração, sem troca obrigatória no primeiro acesso (para gravar sem interrupção).
  await db.update(users).set({ passwordHash: hashPassword(DEMO_PASSWORD), mustChangePassword: false }).where(and(inArray(users.email, Object.values(DEMO_BRAS_ACCOUNTS))));
  log("mundo da Brás e do grupo para gravação criado (membros, importadora, transportadora, ônibus, Club, Meu Contador e equipe)");
  return true;
}
