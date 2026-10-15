"use client";

import { useState } from "react";
import { sendInvite } from "@/lib/remote";
import { isLive } from "@/lib/supabase";
import { Button } from "@/components/ui";

// Stuurt een inloglink naar een klant of uitvoerder. Alleen in de live-versie.
export default function InviteButton({ email, label = "Inloglink sturen" }: { email: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  if (!isLive || !email) return null;

  async function send() {
    setStatus("sending");
    try {
      await sendInvite(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button variant="secondary" disabled={status === "sending"} onClick={() => void send()}>
        {status === "sending" ? "Versturen…" : label}
      </Button>
      {status === "sent" && <span className="text-sm text-sage">Verstuurd naar {email}</span>}
      {status === "error" && <span className="text-sm text-warn">Versturen lukte niet. Probeer het over een minuut opnieuw.</span>}
    </span>
  );
}
