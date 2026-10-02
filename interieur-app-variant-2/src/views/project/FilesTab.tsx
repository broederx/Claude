"use client";

import { useState, type FormEvent } from "react";
import { fileVisible, latestApproved, versionsFor } from "@/lib/access";
import { addItem, audit, decideVersion, patchItem, requestApproval, uploadVersion } from "@/lib/actions";
import { longDate, newId, nowIso, shortDate } from "@/lib/format";
import { folders, versionStatus } from "@/lib/labels";
import { useProjectData } from "@/lib/session";
import type { FileFolder, ProjectFile } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, Toggle, inputClass } from "@/components/ui";
import Thread from "@/components/Thread";

export default function FilesTab({ projectId }: { projectId: string }) {
  const { state, user, scoped } = useProjectData(projectId);
  const [folder, setFolder] = useState<FileFolder | "Alle">("Alle");
  const [adding, setAdding] = useState(false);
  const isOwner = user.role === "owner";
  const files = scoped(state.files).filter((f) => fileVisible(user, f));
  const used = folders.filter((f) => files.some((x) => x.folder === f));
  const shown = files.filter((f) => folder === "Alle" || f.folder === folder);

  return (
    <div>
      <PageHeader
        title={user.role === "contractor" ? "Werktekeningen" : "Bestanden"}
        intro={
          isOwner
            ? "Eén document met versies in plaats van definitief-echt-nu.pdf. Per bestand bepaal je wie het ziet, of downloaden mag en of er een watermerk op komt."
            : user.role === "contractor"
              ? "Je ziet altijd alleen de laatste goedgekeurde versie. Werk nooit met een geprinte oude versie."
              : "Ontwerpen, tekeningen en documenten van je project. Geef akkoord of feedback bij elke versie."
        }
        action={isOwner && !adding && <Button onClick={() => setAdding(true)}>+ Bestand uploaden</Button>}
      />
      {adding && <NewFile projectId={projectId} onDone={() => setAdding(false)} />}

      <div className="mb-6 flex flex-wrap gap-2">
        {(["Alle", ...used] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFolder(f)}
            aria-pressed={folder === f}
            className={`rounded-full border px-3 py-1 text-sm ${folder === f ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty>Geen bestanden.</Empty>
      ) : (
        <div className="space-y-3">
          {shown.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({ file: f }: { file: ProjectFile }) {
  const { state, user } = useProjectData(f.projectId);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const isOwner = user.role === "owner";
  const versions = versionsFor(user, f);
  const current = versions.at(-1);
  const pending = f.versions.find((v) => v.status === "ter-akkoord");
  const approved = latestApproved(f);
  const nameOf = (id?: string) => state.users.find((u) => u.id === id)?.name ?? "";
  const viewers = [...new Set(state.audit.filter((a) => a.target.startsWith(f.title) && (a.action === "bekeken" || a.action === "gedownload")).map((a) => a.userId))];
  const clientId = state.projects.find((p) => p.id === f.projectId)?.clientId;
  const contractors = state.users.filter((u) => u.role === "contractor" && u.projectIds.includes(f.projectId));

  if (!current) return null;

  function view(download: boolean, version: number) {
    audit(user, download ? "gedownload" : "bekeken", `${f.title} v${version}`, f.projectId);
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 items-center gap-4 text-left">
          <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[10px] text-muted">PDF</span>
          <span className="min-w-0">
            <span className="block font-medium">{f.title}</span>
            <span className="block text-xs text-muted">
              {f.folder} · versie {current.version}
              {current.status === "goedgekeurd" && current.decidedAt ? ` · goedgekeurd op ${longDate(current.decidedAt)}` : ` · ${shortDate(current.uploadedAt)}`}
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={versionStatus[current.status].tone}>{versionStatus[current.status].label}</Badge>
          {isOwner && (
            <>
              {!f.visibleToClient && !f.visibleToContractor && <Badge tone="warn">Intern</Badge>}
              {f.visibleToClient && <Badge>Klant</Badge>}
              {f.visibleToContractor && <Badge tone="sage">Uitvoerder</Badge>}
            </>
          )}
          <Button variant="secondary" onClick={() => view(false, current.version)}>Bekijken</Button>
          {f.allowDownload ? (
            <Button variant="ghost" onClick={() => view(true, current.version)}>Download{f.watermark ? " (watermerk)" : ""}</Button>
          ) : (
            <span className="text-xs text-muted">Alleen bekijken</span>
          )}
        </div>
      </div>

      {user.role === "client" && pending && (
        <div className="mt-4 rounded-xl bg-background p-4">
          <p className="text-sm">Versie {pending.version} wacht op je akkoord. Bij akkoord wordt deze versie vastgezet.</p>
          {rejecting ? (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                decideVersion(user, f.id, pending.version, false, note.trim());
                setRejecting(false);
              }}
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Wat moet er anders?" required className={inputClass} />
              <Button type="submit" disabled={!note.trim()}>Feedback versturen</Button>
            </form>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => decideVersion(user, f.id, pending.version, true)}>Akkoord op versie {pending.version}</Button>
              <Button variant="secondary" onClick={() => setRejecting(true)}>Feedback geven</Button>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="mt-4 grid gap-6 border-t border-border pt-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Versies</p>
              <ol className="space-y-2 text-sm">
                {[...versions].reverse().map((v) => (
                  <li key={v.version} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Versie {v.version} <span className="text-muted">· {shortDate(v.uploadedAt)}</span>
                      {v.decidedBy && <span className="text-muted"> · {v.status === "goedgekeurd" ? "akkoord" : "feedback"} {nameOf(v.decidedBy)}</span>}
                      {v.note && <span className="block text-xs text-muted">“{v.note}”</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={versionStatus[v.status].tone}>
                        {versionStatus[v.status].label}
                        {v.status === "goedgekeurd" ? " · vast" : ""}
                      </Badge>
                      {isOwner && v.status === "concept" && (
                        <Button variant="secondary" onClick={() => requestApproval(f.id, v.version)}>Akkoord vragen</Button>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              {user.role === "contractor" && <p className="mt-2 text-xs text-muted">Oudere versies en concepten zijn voor jou verborgen.</p>}
              {user.role === "contractor" && approved && f.versions.some((v) => v.version > approved.version) && (
                <p className="mt-1 text-xs text-accent">Er is een nieuwere versie in voorbereiding. Je ziet hem zodra hij is goedgekeurd.</p>
              )}
            </div>

            {isOwner && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-muted">Rechten op dit bestand</p>
                <Toggle label="Klant ziet dit bestand" checked={f.visibleToClient} onChange={(v) => { patchItem("files", f.id, { visibleToClient: v }); audit(user, "aangepast", `Rechten ${f.title}`, f.projectId); }} />
                <Toggle label="Uitvoerders zien de laatste goedgekeurde versie" checked={f.visibleToContractor} onChange={(v) => { patchItem("files", f.id, { visibleToContractor: v }); audit(user, "aangepast", `Rechten ${f.title}`, f.projectId); }} />
                <Toggle label="Na akkoord automatisch vrijgeven aan uitvoerders" checked={f.releaseOnApproval} onChange={(v) => patchItem("files", f.id, { releaseOnApproval: v })} />
                <Toggle label="Downloaden toestaan" checked={f.allowDownload} onChange={(v) => patchItem("files", f.id, { allowDownload: v })} />
                <Toggle label="Watermerk op downloads" checked={f.watermark} onChange={(v) => patchItem("files", f.id, { watermark: v })} />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted">Alleen voor specifieke personen</span>
                  <select
                    value={f.onlyUserIds?.[0] ?? ""}
                    onChange={(e) => patchItem("files", f.id, { onlyUserIds: e.target.value ? [e.target.value, ...(clientId ? [clientId] : [])] : undefined })}
                    className="rounded-lg border border-border bg-background px-2 py-1.5"
                  >
                    <option value="">Iedereen met de rol hierboven</option>
                    {contractors.map((u) => (
                      <option key={u.id} value={u.id}>Alleen {u.company} (en klant)</option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="secondary" onClick={() => { uploadVersion(user, f.id, true); audit(user, "geüpload", `${f.title} v${(f.versions.at(-1)?.version ?? 0) + 1}`, f.projectId); }}>
                    Nieuwe versie, akkoord vragen
                  </Button>
                  <Button variant="ghost" onClick={() => { uploadVersion(user, f.id, false); audit(user, "geüpload", `${f.title} v${(f.versions.at(-1)?.version ?? 0) + 1} (concept)`, f.projectId); }}>
                    Als concept
                  </Button>
                </div>
              </div>
            )}

            {isOwner && (
              <p className="text-xs text-muted">
                Bekeken door: {viewers.length ? viewers.map(nameOf).join(", ") : "nog niemand"}
                {f.visibleToClient && clientId && !viewers.includes(clientId) && " · klant heeft nog niet gekeken"}
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Berichten bij deze tekening</p>
            <Thread projectId={f.projectId} targetType="file" targetId={f.id} contractorIds={contractors.map((c) => c.id)} />
          </div>
        </div>
      )}
    </Card>
  );
}

function NewFile({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const { user } = useProjectData(projectId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const title = String(d.get("title"));
    const ask = d.get("ask") === "on";
    addItem("files", {
      id: newId(),
      projectId,
      folder: d.get("folder") as FileFolder,
      title,
      versions: [{ version: 1, uploadedAt: nowIso(), status: ask ? "ter-akkoord" : "concept" }],
      visibleToClient: d.get("client") === "on" || ask,
      visibleToContractor: false,
      allowDownload: d.get("download") === "on",
      watermark: d.get("watermark") === "on",
      releaseOnApproval: d.get("release") === "on",
    });
    audit(user, "geüpload", `${title} v1`, projectId);
    onDone();
  }

  return (
    <Card className="mb-6 p-5">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Titel (zonder versie in de naam)">
          <input name="title" required className={inputClass} placeholder="Plattegrond woonkamer" />
        </Field>
        <Field label="Map">
          <select name="folder" className={inputClass}>
            {folders.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Bestand">
          <input type="file" className="text-sm" />
        </Field>
        <div className="grid gap-2 text-sm sm:col-span-3 sm:grid-cols-2">
          <label className="flex items-center gap-2"><input name="ask" type="checkbox" defaultChecked /> Klant om akkoord vragen</label>
          <label className="flex items-center gap-2"><input name="client" type="checkbox" defaultChecked /> Klant mag het zien</label>
          <label className="flex items-center gap-2"><input name="release" type="checkbox" /> Na akkoord vrijgeven aan uitvoerders</label>
          <label className="flex items-center gap-2"><input name="download" type="checkbox" defaultChecked /> Downloaden toestaan</label>
          <label className="flex items-center gap-2"><input name="watermark" type="checkbox" defaultChecked /> Watermerk</label>
        </div>
        <div className="flex gap-3">
          <Button type="submit">Uploaden</Button>
          <Button variant="ghost" onClick={onDone}>Annuleren</Button>
        </div>
      </form>
      <p className="mt-3 text-xs text-muted">In het prototype wordt het bestand zelf niet opgeslagen.</p>
    </Card>
  );
}
