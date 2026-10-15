"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addItem, markRead } from "@/lib/actions";
import { longDate, time } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { newId, nowIso } from "@/lib/store";
import { studio } from "@/lib/studio";
import { Button, Card, Empty, PageHeader, inputClass } from "@/components/ui";

export default function BerichtenPage() {
  const { project, state, role, scoped } = useProject();
  const [text, setText] = useState("");
  const messages = project ? scoped(state.messages).sort((a, b) => a.at.localeCompare(b.at)) : [];
  const lastAt = messages.at(-1)?.at;
  const projectId = project?.id;

  // Wie de berichten opent, heeft ze gelezen.
  useEffect(() => {
    if (projectId && lastAt) markRead(projectId, role, lastAt);
  }, [projectId, role, lastAt]);

  if (!project) return null;

  function send(event: FormEvent) {
    event.preventDefault();
    if (!project || !text.trim()) return;
    addItem("messages", { id: newId(), projectId: project.id, author: role, text: text.trim(), at: nowIso() });
    setText("");
  }

  const nameOf = (author: string) => (author === "architect" ? studio.architect : project.clientName);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Berichten" intro="Vragen en afspraken op één plek, gekoppeld aan dit project in plaats van verspreid over mail en WhatsApp." />
      <Card className="p-4 sm:p-6">
        {messages.length === 0 ? (
          <Empty>Nog geen berichten. Stel gerust je eerste vraag.</Empty>
        ) : (
          <ul className="space-y-4">
            {messages.map((m, i) => {
              const mine = m.author === role;
              const showDay = i === 0 || messages[i - 1].at.slice(0, 10) !== m.at.slice(0, 10);
              return (
                <li key={m.id}>
                  {showDay && <p className="my-4 text-center text-xs text-muted">{longDate(m.at)}</p>}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? "bg-foreground text-background" : "bg-background"}`}>
                      <p className={`text-xs ${mine ? "text-background/60" : "text-muted"}`}>
                        {nameOf(m.author)} · {time(m.at)}
                      </p>
                      <p className="mt-0.5 text-sm whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <form onSubmit={send} className="mt-6 flex gap-2 border-t border-border pt-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Schrijf een bericht…"
            aria-label="Bericht"
            className={inputClass}
          />
          <Button type="submit" disabled={!text.trim()}>
            Verstuur
          </Button>
        </form>
      </Card>
    </div>
  );
}
