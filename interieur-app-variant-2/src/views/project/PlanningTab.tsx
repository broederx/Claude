"use client";

import { useState, type FormEvent } from "react";
import { tasksFor } from "@/lib/access";
import { addItem, isBlocked, patchItem, visibleMilestones } from "@/lib/actions";
import { longDate, newId, shortDate, today } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import type { Milestone } from "@/lib/types";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";

const kindLabel: Record<Milestone["kind"], string> = {
  ontwerp: "Ontwerp",
  keuze: "Keuze",
  bestelling: "Bestelling",
  levering: "Levering",
  uitvoering: "Uitvoering",
  oplevering: "Oplevering",
  facturatie: "Facturatie",
};

type Row = { id: string; date: string; end?: string; title: string; kind: string; done: boolean; blocked?: boolean; audience?: string; assignee?: string };

// Eén planning, verschillende weergaven per rol.
export default function PlanningTab({ projectId }: { projectId: string }) {
  const { state, user, scoped } = useProjectData(projectId);
  const [adding, setAdding] = useState(false);
  const isOwner = user.role === "owner";
  const now = today();
  const nameOf = (id?: string) => state.users.find((u) => u.id === id)?.company ?? "";

  const rows: Row[] = [
    ...visibleMilestones(user, state, projectId).map((m) => ({
      id: m.id,
      date: m.date,
      title: m.title,
      kind: kindLabel[m.kind],
      done: m.done,
      audience: isOwner ? [m.forClient && "klant", m.forContractor && "uitvoerder"].filter(Boolean).join(" + ") || "alleen studio" : undefined,
    })),
    ...tasksFor(user, scoped(state.tasks)).map((t) => ({
      id: t.id,
      date: t.start,
      end: t.due,
      title: t.title,
      kind: "Taak",
      done: t.status === "klaar",
      blocked: t.status !== "klaar" && isBlocked(t, state.tasks),
      assignee: isOwner ? nameOf(t.assigneeId) : undefined,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const intro = {
    owner: "Alles in één planning: ontwerp, bestelmomenten, leveringen, uitvoering, klantdeadlines en facturatie. Per regel zie je wie hem ziet.",
    client: "De hoofdlijnen: wanneer we je keuze nodig hebben, wanneer er besteld en geleverd wordt en wanneer we opleveren.",
    contractor: "Jouw taken en de momenten die voor de uitvoering belangrijk zijn.",
    supplier: "",
  }[user.role];

  return (
    <div>
      <PageHeader title="Planning" intro={intro} action={isOwner && !adding && <Button onClick={() => setAdding(true)}>+ Mijlpaal</Button>} />
      {adding && <NewMilestone projectId={projectId} onDone={() => setAdding(false)} />}
      <ol className="relative ml-2 border-l border-border">
        {rows.map((r) => {
          const past = (r.end ?? r.date) < now;
          return (
            <li key={r.id} className="mb-4 ml-5">
              <span
                className={`absolute -left-[6px] mt-4 h-3 w-3 rounded-full border-2 ${
                  r.done ? "border-sage bg-sage" : r.blocked ? "border-warn bg-surface" : past ? "border-warn bg-warn" : "border-border bg-surface"
                }`}
              />
              <Card className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between ${r.done ? "opacity-60" : ""}`}>
                <div>
                  <p className="text-xs tabular-nums text-muted">
                    {r.end ? `${shortDate(r.date)} – ${shortDate(r.end)}` : longDate(r.date)}
                  </p>
                  <p className="font-medium">{r.title}</p>
                  {r.assignee && <p className="text-xs text-muted">{r.assignee}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.blocked && <Badge tone="warn">Wacht op voorgaande taak</Badge>}
                  <Badge>{r.kind}</Badge>
                  {r.audience && <span className="text-xs text-muted">Zichtbaar: {r.audience}</span>}
                  {isOwner && r.kind !== "Taak" && (
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      <input type="checkbox" checked={r.done} onChange={(e) => patchItem("milestones", r.id, { done: e.target.checked })} />
                      Gedaan
                    </label>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function NewMilestone({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    addItem("milestones", {
      id: newId(),
      projectId,
      title: String(d.get("title")),
      date: String(d.get("date")),
      kind: d.get("kind") as Milestone["kind"],
      forClient: d.get("forClient") === "on",
      forContractor: d.get("forContractor") === "on",
      done: false,
    });
    onDone();
  }
  return (
    <Card className="mb-6 p-5">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Omschrijving">
          <input name="title" required className={inputClass} />
        </Field>
        <Field label="Datum">
          <input name="date" type="date" required className={inputClass} />
        </Field>
        <Field label="Soort">
          <select name="kind" className={inputClass}>
            {Object.entries(kindLabel).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </Field>
        <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
          <label className="flex items-center gap-2"><input name="forClient" type="checkbox" defaultChecked /> Klant ziet dit</label>
          <label className="flex items-center gap-2"><input name="forContractor" type="checkbox" /> Uitvoerders zien dit</label>
        </div>
        <div className="flex gap-3">
          <Button type="submit">Opslaan</Button>
          <Button variant="ghost" onClick={onDone}>Annuleren</Button>
        </div>
      </form>
    </Card>
  );
}
