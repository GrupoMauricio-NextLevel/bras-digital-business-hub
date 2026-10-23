"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireMaster } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import {
  activateMasterScenario,
  clearMasterScenario,
  SCENARIO_LEVELS,
  SCENARIO_SCOPES,
} from "@/lib/master-scenario";

const optionsSchema = z.object({
  level: z.enum(SCENARIO_LEVELS),
  scope: z.enum(SCENARIO_SCOPES),
});

async function masterContext() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  requireMaster(session.actor);
  return { session, db: await getDb() };
}

function refreshScenarioViews() {
  revalidatePath("/master", "layout");
  revalidatePath("/master/commerce");
  revalidatePath("/supplier", "layout");
  revalidatePath("/merchant", "layout");
}

export async function activateMasterScenarioAction(input: { level: string; scope: string }) {
  return runAction(async () => {
    const { session, db } = await masterContext();
    const options = optionsSchema.parse(input);
    const result = await activateMasterScenario(db, session.user.id, options);
    refreshScenarioViews();
    return result;
  });
}

export async function clearMasterScenarioAction() {
  return runAction(async () => {
    const { db } = await masterContext();
    const result = await clearMasterScenario(db);
    refreshScenarioViews();
    return result;
  });
}
