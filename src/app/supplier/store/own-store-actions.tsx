"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOwnStoreAction, enterOwnStoreAction } from "@/app/actions/own-store";

export function OwnStoreActions({ state }: { state: "create" | "enter" }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  if (state === "enter") return <form action={enterOwnStoreAction}><Button type="submit"><Store /> Abrir painel da loja</Button></form>;
  return <Button loading={pending} onClick={() => start(async () => { const r = await createOwnStoreAction(); if (r.ok) { toast.success("Loja criada"); router.refresh(); } else toast.error(r.error); })}><Store /> Criar minha loja</Button>;
}
