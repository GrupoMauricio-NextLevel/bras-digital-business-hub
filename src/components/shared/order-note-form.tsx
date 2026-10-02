"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addOrderNoteAction } from "@/app/actions/orders";

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [text, setText] = React.useState("");
  return (
    <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await addOrderNoteAction(orderId, text); if (r.ok) { setText(""); toast.success("Nota salva"); router.refresh(); } else toast.error(r.error); }); }}>
      <Input aria-label="Nota interna" placeholder="Nota interna (o cliente não vê)" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
      <Button type="submit" variant="secondary" loading={pending} disabled={text.trim().length < 2}>Salvar nota</Button>
    </form>
  );
}
