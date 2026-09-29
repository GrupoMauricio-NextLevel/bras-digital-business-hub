"use client";
import { ErrorState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-8">
      <ErrorState description={error.message} action={<Button onClick={reset}>Tentar novamente</Button>} />
    </div>
  );
}
