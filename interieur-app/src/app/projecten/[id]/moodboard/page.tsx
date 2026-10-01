"use client";

import { useState, type FormEvent } from "react";
import { addItem, patchItem, removeItem } from "@/lib/actions";
import { time, shortDate } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { newId, nowIso } from "@/lib/store";
import type { MoodItem, Reaction, Role } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, Swatches, inputClass } from "@/components/ui";

const reactions: { id: Reaction; label: string; icon: string }[] = [
  { id: "love", label: "Mooi", icon: "♥" },
  { id: "maybe", label: "Twijfel", icon: "?" },
  { id: "no", label: "Niet voor mij", icon: "✕" },
];

const kindLabel = { kleur: "Kleur", materiaal: "Materiaal", inspiratie: "Inspiratie" };

export default function MoodboardPage() {
  const { project, state, role, scoped } = useProject();
  const [room, setRoom] = useState("Alle");
  const [adding, setAdding] = useState(false);
  if (!project) return null;

  const items = scoped(state.mood).filter((m) => room === "Alle" || m.room === room);

  return (
    <div>
      <PageHeader
        title="Moodboard"
        intro={
          role === "client"
            ? "Laat per beeld weten wat je ervan vindt. Je kunt ook zelf inspiratie toevoegen."
            : "Deel sfeer, kleuren en materialen. De klant reageert per item."
        }
        action={!adding && <Button onClick={() => setAdding(true)}>+ Toevoegen</Button>}
      />

      {adding && <AddMoodForm projectId={project.id} rooms={project.rooms} role={role} onDone={() => setAdding(false)} />}

      <div className="mb-6 flex flex-wrap gap-2">
        {["Alle", ...project.rooms].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoom(r)}
            className={`rounded-full border px-3 py-1 text-sm ${
              room === r ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <Empty>Nog geen items voor deze ruimte.</Empty>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <MoodCard key={item.id} item={item} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}

function MoodCard({ item, role }: { item: MoodItem; role: Role }) {
  const [text, setText] = useState("");

  function comment(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    patchItem("mood", item.id, {
      comments: [...item.comments, { id: newId(), author: role, text: text.trim(), at: nowIso() }],
    });
    setText("");
  }

  return (
    <Card className="mb-6 break-inside-avoid overflow-hidden">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- willekeurige externe URL's van gebruikers
        <img src={item.imageUrl} alt={item.title} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <Swatches colors={item.colors} className={item.kind === "kleur" ? "h-28" : "h-44"} />
      )}
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl">{item.title}</h3>
            <p className="text-xs text-muted">
              {item.room} · {item.addedBy === "client" ? "toegevoegd door klant" : "voorstel studio"}
            </p>
          </div>
          <Badge>{kindLabel[item.kind]}</Badge>
        </div>
        {item.note && <p className="text-sm text-foreground/80">{item.note}</p>}

        <div className="flex gap-2">
          {reactions.map((r) => {
            const active = item.reaction === r.id;
            return (
              <button
                key={r.id}
                type="button"
                disabled={role !== "client"}
                onClick={() => patchItem("mood", item.id, { reaction: active ? undefined : r.id })}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  active ? "border-accent bg-accent text-white" : "border-border text-muted"
                } ${role === "client" ? "hover:border-accent" : "cursor-default"}`}
              >
                <span aria-hidden>{r.icon}</span> {r.label}
              </button>
            );
          })}
        </div>
        {role === "architect" && !item.reaction && item.addedBy === "architect" && (
          <p className="text-xs text-muted">Klant heeft nog niet gereageerd.</p>
        )}

        {item.comments.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-3">
            {item.comments.map((c) => (
              <li key={c.id} className="text-sm">
                <span className="font-medium">{c.author === "client" ? "Klant" : "Studio"}</span>{" "}
                <span className="text-xs text-muted">
                  {shortDate(c.at)} {time(c.at)}
                </span>
                <p className="text-foreground/80">{c.text}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={comment} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reageer…"
            aria-label={`Reageer op ${item.title}`}
            className={inputClass}
          />
          <Button type="submit" variant="secondary" disabled={!text.trim()}>
            Plaats
          </Button>
        </form>

        {(role === "architect" || item.addedBy === role) && (
          <button
            type="button"
            onClick={() => removeItem("mood", item.id)}
            className="text-xs text-muted hover:text-warn"
          >
            Verwijderen
          </button>
        )}
      </div>
    </Card>
  );
}

function AddMoodForm({ projectId, rooms, role, onDone }: { projectId: string; rooms: string[]; role: Role; onDone: () => void }) {
  const [colors, setColors] = useState(["#e3d8c7", "#a88c6d", "#5c574d"]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addItem("mood", {
      id: newId(),
      projectId,
      title: String(data.get("title")),
      room: String(data.get("room")),
      kind: data.get("kind") as MoodItem["kind"],
      colors,
      imageUrl: String(data.get("imageUrl")) || undefined,
      note: String(data.get("note")) || undefined,
      addedBy: role,
      comments: [],
    });
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Titel">
          <input name="title" required className={inputClass} />
        </Field>
        <Field label="Ruimte">
          <select name="room" className={inputClass}>
            {rooms.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Soort">
          <select name="kind" className={inputClass} defaultValue={role === "client" ? "inspiratie" : "materiaal"}>
            <option value="materiaal">Materiaal</option>
            <option value="kleur">Kleur</option>
            <option value="inspiratie">Inspiratie</option>
          </select>
        </Field>
        <Field label="Afbeelding (link, optioneel; bijv. van Pinterest)">
          <input name="imageUrl" type="url" className={inputClass} placeholder="https://" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Kleuren (als er geen afbeelding is)">
            <div className="flex gap-2">
              {colors.map((c, i) => (
                <input
                  key={i}
                  type="color"
                  value={c}
                  aria-label={`Kleur ${i + 1}`}
                  onChange={(e) => setColors(colors.map((old, j) => (j === i ? e.target.value : old)))}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
                />
              ))}
            </div>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Toelichting">
            <textarea name="note" rows={2} className={inputClass} />
          </Field>
        </div>
        <div className="flex gap-3">
          <Button type="submit">Toevoegen</Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
