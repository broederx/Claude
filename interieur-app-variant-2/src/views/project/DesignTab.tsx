"use client";

import { useState, type FormEvent } from "react";
import { addItem, makeChoice } from "@/lib/actions";
import { daysBetween, longDate, newId, shortDate, signedEuro, today, weekday } from "@/lib/format";
import { letter } from "@/lib/labels";
import { useProjectData } from "@/lib/session";
import type { Choice } from "@/lib/types";
import { Badge, Button, Card, Field, PageHeader, Swatches, inputClass } from "@/components/ui";
import Thread from "@/components/Thread";

export default function DesignTab({ projectId }: { projectId: string }) {
  const { state, user, project, scoped } = useProjectData(projectId);
  const [room, setRoom] = useState(project.rooms[0]);
  const [adding, setAdding] = useState(false);
  const mood = scoped(state.mood).filter((m) => m.room === room);
  const choices = scoped(state.choices).filter((c) => c.room === room);
  const isOwner = user.role === "owner";

  return (
    <div>
      <PageHeader
        title="Moodboard & keuzes"
        intro={
          isOwner
            ? "Per ruimte de sfeer en de keuzes die de klant moet maken. Keuzes zijn altijd A, B of C met een deadline."
            : "Per ruimte de sfeer, en de keuzes die we van je nodig hebben. Kies vóór de deadline, dan blijft de planning op schema."
        }
        action={isOwner && !adding && <Button onClick={() => setAdding(true)}>+ Keuze voorleggen</Button>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {project.rooms.map((r) => {
          const open = scoped(state.choices).filter((c) => c.room === r && !c.chosenOptionId).length;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRoom(r)}
              aria-pressed={room === r}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                room === r ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {r}
              {open > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] text-white">{open}</span>}
            </button>
          );
        })}
      </div>

      {adding && <NewChoiceForm projectId={projectId} room={room} onDone={() => setAdding(false)} />}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {choices.length === 0 && <p className="text-sm text-muted">Geen keuzes voor deze ruimte.</p>}
          {choices.map((c) => (
            <ChoiceCard key={c.id} choice={c} />
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted">Moodboard {room.toLowerCase()}</h3>
          {mood.length === 0 && <p className="text-sm text-muted">Nog geen moodboard voor deze ruimte.</p>}
          {mood.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <Swatches colors={m.colors} className="h-24" />
              <div className="p-4">
                <p className="font-serif text-lg">{m.title}</p>
                {m.note && <p className="mt-1 text-sm text-foreground/75">{m.note}</p>}
              </div>
            </Card>
          ))}
          <Card className="p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Opmerkingen over de {room.toLowerCase()}</p>
            <Thread projectId={projectId} targetType="room" targetId={room} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChoiceCard({ choice: c }: { choice: Choice }) {
  const { state, user } = useProjectData(c.projectId);
  const [pending, setPending] = useState<string | null>(null);
  const chosen = c.options.find((o) => o.id === c.chosenOptionId);
  const days = daysBetween(today(), c.deadline);
  const late = !chosen && days < 0;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl">{c.question}</h3>
          {chosen ? (
            <p className="text-sm text-sage">
              Gekozen op {longDate(c.decidedAt!)}: optie {letter(c.options.indexOf(chosen))}, {chosen.label}
            </p>
          ) : (
            <p className={`text-sm ${late ? "text-warn" : "text-muted"}`}>
              Kies optie {c.options.map((_, i) => letter(i)).join(", ").replace(/, ([^,]*)$/, " of $1")} vóór {weekday(c.deadline)}
              {late ? ` (${-days} dag${days === -1 ? "" : "en"} te laat)` : days <= 2 ? ` (nog ${days} dag${days === 1 ? "" : "en"})` : ""}
            </p>
          )}
        </div>
        {chosen ? <Badge tone="sage">Besloten</Badge> : <Badge tone={late ? "warn" : "accent"}>Deadline {shortDate(c.deadline)}</Badge>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {c.options.map((o, i) => {
          const isChosen = o.id === c.chosenOptionId;
          return (
            <div
              key={o.id}
              className={`overflow-hidden rounded-xl border ${isChosen ? "border-foreground ring-1 ring-foreground" : "border-border"} ${chosen && !isChosen ? "opacity-50" : ""}`}
            >
              <Swatches colors={o.colors} className="h-16" />
              <div className="space-y-2 p-3 text-sm">
                <p>
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] text-background">{letter(i)}</span>
                  <span className="font-medium">{o.label}</span>
                </p>
                <p className="text-foreground/70">{o.description}</p>
                <p className="tabular-nums text-muted">{signedEuro(o.priceDelta)}</p>
                {user.role === "client" && !chosen && (
                  <Button variant={pending === o.id ? "primary" : "secondary"} className="w-full" onClick={() => setPending(o.id)}>
                    Kies {letter(i)}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pending && !chosen && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-background p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Je kiest optie {letter(c.options.findIndex((o) => o.id === pending))}: {c.options.find((o) => o.id === pending)?.label}. Dit wordt vastgelegd in het besluitlogboek.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setPending(null)}>
              Annuleren
            </Button>
            <Button onClick={() => makeChoice(user, state, c.id, pending)}>Bevestig keuze</Button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <Thread projectId={c.projectId} targetType="choice" targetId={c.id} compact />
      </div>
    </Card>
  );
}

function NewChoiceForm({ projectId, room, onDone }: { projectId: string; room: string; onDone: () => void }) {
  const [count, setCount] = useState(3);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const options = Array.from({ length: count }, (_, i) => ({
      id: newId(),
      label: String(data.get(`label${i}`)),
      description: String(data.get(`desc${i}`)),
      colors: [String(data.get(`color${i}`))],
      priceDelta: Number(data.get(`delta${i}`)) || 0,
    })).filter((o) => o.label);
    addItem("choices", { id: newId(), projectId, room, question: String(data.get("question")), deadline: String(data.get("deadline")), options });
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label={`Vraag (${room})`}>
              <input name="question" required className={inputClass} placeholder="Welke vloer komt in de hal?" />
            </Field>
          </div>
          <Field label="Deadline">
            <input name="deadline" type="date" required className={inputClass} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Optie {letter(i)}</p>
              <input name={`label${i}`} required={i < 2} placeholder="Naam" className={inputClass} />
              <input name={`desc${i}`} placeholder="Korte toelichting" className={inputClass} />
              <div className="flex gap-2">
                <input name={`delta${i}`} type="number" step="10" placeholder="Meerprijs €" className={inputClass} />
                <input name={`color${i}`} type="color" defaultValue="#c8b9a4" aria-label={`Kleur optie ${letter(i)}`} className="h-9 w-12 shrink-0 rounded-lg border border-border" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Voorleggen aan klant</Button>
          {count < 3 ? (
            <Button variant="ghost" onClick={() => setCount(3)}>+ Optie C</Button>
          ) : (
            <Button variant="ghost" onClick={() => setCount(2)}>Alleen A en B</Button>
          )}
          <Button variant="ghost" onClick={onDone}>Annuleren</Button>
        </div>
      </form>
    </Card>
  );
}
