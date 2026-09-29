import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, resolveDatabaseUrl } from "@/db/client";

export const dynamic = "force-dynamic";

/** Diagnóstico seguro (sem segredos): qual driver está em uso e se o banco responde. */
export async function GET() {
  const url = resolveDatabaseUrl();
  const driver = url.startsWith("postgres") ? "postgres" : "pglite";
  const host = url.startsWith("postgres") ? url.replace(/^postgres(ql)?:\/\/[^@]*@/, "").split(/[/?]/)[0] : url;
  const serverless = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  try {
    const db = await getDb();
    const r = (await db.execute(sql`select count(*)::int as n from organizations`)) as { rows: { n: number }[] };
    return NextResponse.json({ ok: true, driver, host, organizations: Number(r.rows[0]?.n ?? 0), serverless, demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const hint = driver === "pglite" && serverless
      ? "Ambiente serverless sem banco Postgres configurado. Na Netlify, instale a extensão Neon (Netlify DB) ou defina DATABASE_URL=postgres://… e refaça o deploy."
      : "Verifique DATABASE_URL, o acesso de rede ao banco e se `npm run db:bootstrap` foi executado.";
    return NextResponse.json({ ok: false, driver, host, serverless, error: message, hint }, { status: 500 });
  }
}
