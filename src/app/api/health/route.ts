import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, resolveDatabaseUrl } from "@/db/client";

export const dynamic = "force-dynamic";

/** Diagnóstico seguro (sem segredos): qual driver está em uso e se o banco responde. */
export async function GET() {
  const url = resolveDatabaseUrl();
  const driver = url.startsWith("postgres") ? "postgres" : "pglite";
  const serverless = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  try {
    const db = await getDb();
    const r = (await db.execute(sql`select count(*)::int as n from organizations`)) as { rows: { n: number }[] };
    // Qual versão está no ar (o Render informa o commit) e a última atualização do banco aplicada: mostra se uma
    // publicação falhou (versão antiga continua no ar) sem precisar abrir o painel do Render. Nada sigiloso.
    let migration: string | null = null;
    try { migration = ((await db.execute(sql`select hash from drizzle.__drizzle_migrations order by created_at desc limit 1`)) as { rows: { hash?: string }[] }).rows[0]?.hash ?? null; } catch { migration = null; }
    const version = (process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? "").slice(0, 7) || null;
    return NextResponse.json({ ok: true, driver, organizations: Number(r.rows[0]?.n ?? 0), serverless, demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true", version, migration });
  } catch (e) {
    console.error("[health]", e);
    return NextResponse.json({ ok: false, driver, serverless }, { status: 503 });
  }
}
