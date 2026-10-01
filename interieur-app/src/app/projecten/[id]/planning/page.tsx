"use client";

import { useState, type FormEvent } from "react";
import { addItem, patchItem } from "@/lib/actions";
import { longDate, today } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { newId } from "@/lib/store";
import type { Milestone } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, inputClass } from "@/components/ui";

const typeLabel: Record<Milestone["type"], string> = { mijlpaal: "Mijlpaal", afspraak: "Afspraak", levering: "Levering" };

export default function PlanningPage() {
  const { project, state, role, scoped } = useProject();
  const [adding, setAdding] = useState(false);
  if (!project) return null;

  const items = scoped(state.milestones).sort((a, b) => a.date.localeCompare(b.date));
  const now = today();
  const nextId = items.find((m) => !m.done && m.date >= now)?.id;

  return (
    <div>
      <PageHeader
        title="Planning"
        intro={`Van start tot oplevering op ${longDate(project.deliveryDate)}: afspraken, mijlpalen en leveringen.`}
        action={role === "architect" && !adding && <Button onClick={() => setAdding(true)}>+ Toevoegen</Button>}
      />
      {adding && <AddMilestone projectId={project.id} onDone={() => setAdding(false)} />}
      {items.length === 0 ? (
        <Empty>Nog niets gepland.</Empty>
      ) : (
        <ol className="relative ml-3 border-l border-border">
          {items.map((m) => (
            <li key={m.id} className="mb-6 ml-6">
              <span
                className={`absolute -left-[7px] mt-5 h-3.5 w-3.5 rounded-full border-2 ${
                  m.done ? "border-sage bg-sage" : m.id === nextId ? "border-accent bg-surface" : "border-border bg-surface"
                }`}
              />
              <Card className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${m.done ? "opacity-60" : ""}`}>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted">{longDate(m.date)}</p>
                  <p className="mt-1 font-medium">{m.title}</p>
                  {m.location && <p className="text-sm text-muted">{m.location}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {m.id === nextId && <Badge tone="accent">Eerstvolgend</Badge>}
                  <Badge>{typeLabel[m.type]}</Badge>
                  {role === "architect" && (
                    <label className="flex items-center gap-1.5 text-sm text-muted">
                      <input type="checkbox" checked={m.done} onChange={(e) => patchItem("milestones", m.id, { done: e.target.checked })} />
                      Afgerond
                    </label>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-6 text-xs text-muted">In de echte app kun je afspraken als agenda-uitnodiging (.ics) ontvangen.</p>
    </div>
  );
}

function AddMilestone({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addItem("milestones", {
      id: newId(),
      projectId,
      title: String(data.get("title")),
      date: String(data.get("date")),
      type: data.get("type") as Milestone["type"],
      location: String(data.get("location")) || undefined,
      done: false,
    });
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Omschrijving">
          <input name="title" required className={inputClass} />
        </Field>
        <Field label="Datum">
          <input name="date" type="date" required className={inputClass} />
        </Field>
        <Field label="Soort">
          <select name="type" className={inputClass}>
            <option value="afspraak">Afspraak</option>
            <option value="mijlpaal">Mijlpaal</option>
            <option value="levering">Levering</option>
          </select>
        </Field>
        <Field label="Locatie (optioneel)">
          <input name="location" className={inputClass} />
        </Field>
        <div className="flex gap-3">
          <Button type="submit">Opslaan</Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
