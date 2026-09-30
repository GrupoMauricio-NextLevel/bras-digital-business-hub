"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { simulateTrialEndAction } from "@/app/actions/demo";

/** Só aparece no ambiente de demonstração. */
export function TrialDemoButton() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { await simulateTrialEndAction(); router.refresh(); })}>Simular fim do teste (demo)</Button>;
}
