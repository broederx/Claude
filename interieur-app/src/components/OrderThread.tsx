"use client";

import { useState, type FormEvent } from "react";
import { patchItem } from "@/lib/actions";
import { shortDate, time } from "@/lib/format";
import { newId, nowIso } from "@/lib/store";
import { studio } from "@/lib/studio";
import type { PurchaseOrder, Role } from "@/lib/types";
import { Button, inputClass } from "@/components/ui";

// Berichten tussen studio en leverancier over één inkooporder.
export default function OrderThread({
  order,
  role,
  counterpart,
}: {
  order: PurchaseOrder;
  role: Role;
  counterpart: string;
}) {
  const [text, setText] = useState("");

  function send(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    patchItem("orders", order.id, {
      thread: [...order.thread, { id: newId(), author: role, text: text.trim(), at: nowIso() }],
    });
    setText("");
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {order.thread.length > 0 && (
        <ul className="space-y-2">
          {order.thread.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{c.author === role ? "Jij" : c.author === "architect" ? studio.name : counterpart}</span>{" "}
              <span className="text-xs text-muted">
                {shortDate(c.at)} {time(c.at)}
              </span>
              <p className="text-foreground/80">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={send} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Bericht aan ${counterpart} over ${order.number}…`}
          aria-label={`Bericht over ${order.number}`}
          className={inputClass}
        />
        <Button type="submit" variant="secondary" disabled={!text.trim()}>
          Verstuur
        </Button>
      </form>
    </div>
  );
}
