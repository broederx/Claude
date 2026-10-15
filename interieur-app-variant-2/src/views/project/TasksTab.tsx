"use client";

import { useState, type FormEvent } from "react";
import { tasksFor } from "@/lib/access";
import { addItem, audit, isBlocked, patchItem, setTaskStatus } from "@/lib/actions";
import { newId, nowIso, shortDate, today } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import type { Task } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, inputClass } from "@/components/ui";
import Thread from "@/components/Thread";

export default function TasksTab({ projectId }: { projectId: string }) {
  const { state, user, scoped } = useProjectData(projectId);
  const [adding, setAdding] = useState(false);
  const isOwner = user.role === "owner";
  const tasks = tasksFor(user, scoped(state.tasks)).sort((a, b) => a.start.localeCompare(b.start));
  const issues = scoped(state.issues).filter((i) => isOwner || i.reportedBy === user.id);

  return (
    <div>
      <PageHeader
        title={isOwner ? "Taken" : "Mijn taken"}
        intro={
          isOwner
            ? "Taken per uitvoerder met afhankelijkheden: een taak kan pas starten als de taak waarop hij wacht klaar is."
            : "Vink af wat klaar is, voeg voortgangsfoto's toe en stel je vragen direct bij de taak."
        }
        action={isOwner && !adding && <Button onClick={() => setAdding(true)}>+ Taak</Button>}
      />
      {adding && <NewTask projectId={projectId} onDone={() => setAdding(false)} />}

      {issues.filter((i) => i.status === "open").length > 0 && (
        <Card className="mb-6 border-warn/40 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-warn">Gemelde problemen</p>
          <ul className="space-y-2 text-sm">
            {issues.filter((i) => i.status === "open").map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {i.title} <span className="text-muted">· {state.users.find((u) => u.id === i.reportedBy)?.company}</span>
                </span>
                {isOwner && (
                  <Button variant="secondary" onClick={() => { patchItem("issues", i.id, { status: "opgelost" }); audit(user, "aangepast", `Probleem opgelost: ${i.title}`, projectId); }}>
                    Opgelost
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tasks.length === 0 ? (
        <Empty>Geen taken.</Empty>
      ) : (
        <div className="space-y-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task: t }: { task: Task }) {
  const { state, user } = useProjectData(t.projectId);
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const blocked = t.status !== "klaar" && isBlocked(t, state.tasks);
  const deps = t.dependsOn.map((id) => state.tasks.find((x) => x.id === id)).filter(Boolean) as Task[];
  const assignee = state.users.find((u) => u.id === t.assigneeId);
  const isOwner = user.role === "owner";
  const mine = t.assigneeId === user.id;
  const late = t.status !== "klaar" && t.due < today();

  function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const names = Array.from(files).map((f) => f.name);
    patchItem("tasks", t.id, { photos: [...t.photos, ...names] });
    audit(user, "geüpload", `${names.length} foto('s) bij ${t.title}`, t.projectId);
  }

  function report(event: FormEvent) {
    event.preventDefault();
    if (!issue.trim()) return;
    addItem("issues", { id: newId(), projectId: t.projectId, taskId: t.id, reportedBy: user.id, title: issue.trim(), status: "open", at: nowIso() });
    audit(user, "gemeld", `Probleem: ${issue.trim()}`, t.projectId);
    setIssue("");
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tabular-nums text-muted">
            {shortDate(t.start)} – {shortDate(t.due)}
            {t.location && ` · ${t.location}`}
          </p>
          <p className="text-lg font-medium">{t.title}</p>
          {isOwner && <p className="text-sm text-muted">{assignee?.company ?? "Niet toegewezen"}</p>}
          {deps.length > 0 && (
            <p className="mt-1 text-sm">
              <span className="text-muted">Start na: </span>
              {deps.map((d, i) => (
                <span key={d.id} className={d.status === "klaar" ? "text-sage" : "text-warn"}>
                  {i > 0 && ", "}
                  {d.title} {d.status === "klaar" ? "✓" : `(${state.users.find((u) => u.id === d.assigneeId)?.company ?? "open"})`}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {t.status === "klaar" ? (
            <Badge tone="sage">Klaar</Badge>
          ) : blocked ? (
            <Badge tone="warn">Wacht</Badge>
          ) : (
            <Badge tone="accent">{t.status === "bezig" ? "Bezig" : "Kan starten"}</Badge>
          )}
          {late && <Badge tone="warn">Te laat</Badge>}
        </div>
      </div>

      {(mine || isOwner) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {t.status === "open" && <Button variant="secondary" disabled={blocked} onClick={() => setTaskStatus(user, t, "bezig")}>Start</Button>}
          {t.status !== "klaar" && <Button disabled={blocked} onClick={() => setTaskStatus(user, t, "klaar")}>Afvinken: klaar</Button>}
          {t.status === "klaar" && <Button variant="ghost" onClick={() => setTaskStatus(user, t, "bezig")}>Heropenen</Button>}
          <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm hover:border-foreground/40">
            Foto toevoegen
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
          </label>
          <Button variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? "Minder" : "Vragen en problemen"}
          </Button>
        </div>
      )}

      {t.photos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {t.photos.map((p, i) => (
            <li key={`${p}-${i}`} className="rounded-lg bg-background px-2.5 py-1 text-xs text-muted">Foto: {p}</li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-4 grid gap-5 border-t border-border pt-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Vragen over deze taak</p>
            <Thread projectId={t.projectId} targetType="task" targetId={t.id} contractorIds={t.assigneeId ? [t.assigneeId] : []} />
          </div>
          {mine && (
            <form onSubmit={report} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.15em] text-muted">Probleem melden</p>
              <input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Wat houdt je tegen?" className={inputClass} />
              <p className="text-xs text-muted">Spraakmemo&apos;s komen in de mobiele versie van de echte app.</p>
              <Button type="submit" variant="secondary" disabled={!issue.trim()}>Melden aan studio</Button>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}

function NewTask({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const { state, scoped } = useProjectData(projectId);
  const contractors = state.users.filter((u) => u.role === "contractor" && u.projectIds.includes(projectId));
  const tasks = scoped(state.tasks);
  const [deps, setDeps] = useState<string[]>([]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    addItem("tasks", {
      id: newId(),
      projectId,
      title: String(d.get("title")),
      assigneeId: String(d.get("assigneeId")) || undefined,
      start: String(d.get("start")),
      due: String(d.get("due")),
      status: "open",
      dependsOn: deps,
      location: String(d.get("location")) || undefined,
      photos: [],
    });
    onDone();
  }

  return (
    <Card className="mb-6 p-5">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Taak">
            <input name="title" required className={inputClass} />
          </Field>
        </div>
        <Field label="Uitvoerder">
          <select name="assigneeId" className={inputClass}>
            <option value="">Nog niet toegewezen</option>
            {contractors.map((u) => (
              <option key={u.id} value={u.id}>{u.company} ({u.trade})</option>
            ))}
          </select>
        </Field>
        <Field label="Start">
          <input name="start" type="date" required className={inputClass} />
        </Field>
        <Field label="Deadline">
          <input name="due" type="date" required className={inputClass} />
        </Field>
        <Field label="Locatie">
          <input name="location" className={inputClass} />
        </Field>
        <fieldset className="space-y-1.5 text-sm sm:col-span-3">
          <legend className="mb-1 text-muted">Kan pas starten na</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {tasks.map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <input type="checkbox" checked={deps.includes(t.id)} onChange={(e) => setDeps(e.target.checked ? [...deps, t.id] : deps.filter((x) => x !== t.id))} />
                {t.title}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit">Toevoegen</Button>
          <Button variant="ghost" onClick={onDone}>Annuleren</Button>
        </div>
      </form>
    </Card>
  );
}
