"use client";

import { useState, type FormEvent } from "react";
import { addItem, logDecision, patchItem } from "@/lib/actions";
import { contractorCanSee, docCategories } from "@/lib/docs";
import { fileSize, longDate } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { openDocument, uploadDocument } from "@/lib/remote";
import { newId, nowIso } from "@/lib/store";
import { isLive } from "@/lib/supabase";
import type { DocStatus, ProjectDoc } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, inputClass } from "@/components/ui";

const categories = docCategories;

const statusInfo: Record<DocStatus, { label: string; tone: "neutral" | "accent" | "sage" | "warn" }> = {
  info: { label: "Ter info", tone: "neutral" },
  "ter-goedkeuring": { label: "Ter goedkeuring", tone: "accent" },
  goedgekeurd: { label: "Goedgekeurd", tone: "sage" },
  "wijziging-gevraagd": { label: "Wijziging gevraagd", tone: "warn" },
};

export default function DocumentenPage() {
  const { project, state, role, scoped } = useProject();
  const [uploading, setUploading] = useState(false);
  if (!project) return null;

  const docs = scoped(state.docs).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <div>
      <PageHeader
        title="Documenten"
        intro={
          role === "architect"
            ? "Tekeningen, impressies en afspraken, altijd in de laatste versie. Uitvoerders van dit project zien alleen documenten die je als definitief aanvinkt."
            : "Tekeningen, impressies en afspraken, altijd in de laatste versie. Goedkeuringen worden vastgelegd."
        }
        action={role === "architect" && !uploading && <Button onClick={() => setUploading(true)}>+ Document delen</Button>}
      />
      {uploading && <UploadForm projectId={project.id} onDone={() => setUploading(false)} />}
      {docs.length === 0 ? (
        <Empty>Nog geen documenten gedeeld.</Empty>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <DocRow key={doc.id} doc={doc} isClient={role === "client"} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocRow({ doc, isClient }: { doc: ProjectDoc; isClient: boolean }) {
  const [feedback, setFeedback] = useState("");
  const [asking, setAsking] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = statusInfo[doc.status];

  async function view() {
    if (!isLive || !doc.storagePath) {
      setViewing(!viewing);
      return;
    }
    try {
      await openDocument(doc.storagePath);
    } catch {
      setError("Het bestand kon niet worden geopend.");
    }
  }

  function shareNewVersion(file?: File, storagePath?: string) {
    patchItem("docs", doc.id, {
      version: doc.version + 1,
      status: "ter-goedkeuring",
      feedback: undefined,
      uploadedAt: nowIso(),
      // Een nieuwe versie is nooit automatisch definitief.
      final: false,
      fileName: file?.name ?? doc.fileName.replace(/v\d+/, `v${doc.version + 1}`),
      ...(file ? { sizeKb: Math.ceil(file.size / 1024), storagePath } : {}),
    });
  }

  async function uploadNewVersion(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      shareNewVersion(file, await uploadDocument(doc.projectId, doc.id, file));
    } catch {
      setError("Uploaden is niet gelukt. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[10px] text-muted">
            PDF
          </div>
          <div>
            <p className="font-medium">{doc.title}</p>
            <p className="text-xs text-muted">
              {categories[doc.category]} · versie {doc.version} · {fileSize(doc.sizeKb)} · {longDate(doc.uploadedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={status.tone}>{status.label}</Badge>
          {!isClient && contractorCanSee(doc) && <Badge tone="sage">Definitief · zichtbaar voor uitvoerders</Badge>}
          <Button variant="secondary" onClick={() => void view()}>
            Bekijken
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      {viewing && (
        <p className="mt-4 rounded-xl bg-background p-3 text-sm text-muted">
          In de echte app opent hier {doc.fileName}, met de mogelijkheid om op de tekening te reageren.
        </p>
      )}

      {doc.feedback && (
        <p className="mt-4 rounded-xl bg-background p-3 text-sm">
          <span className="text-muted">Opmerking klant: </span>
          {doc.feedback}
        </p>
      )}

      {isClient && doc.status === "ter-goedkeuring" && (
        <div className="mt-4 border-t border-border pt-4">
          {asking ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Wat wil je anders zien?"
                className={inputClass}
              />
              <Button
                disabled={!feedback.trim()}
                onClick={() => {
                  patchItem("docs", doc.id, { status: "wijziging-gevraagd", feedback: feedback.trim() });
                  logDecision(doc.projectId, "client", doc.title, `Wijziging gevraagd op versie ${doc.version}: ${feedback.trim()}`);
                }}
              >
                Versturen
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  patchItem("docs", doc.id, { status: "goedgekeurd", feedback: undefined });
                  logDecision(doc.projectId, "client", doc.title, `Versie ${doc.version} goedgekeurd.`);
                }}
              >
                Goedkeuren
              </Button>
              <Button variant="secondary" onClick={() => setAsking(true)}>
                Wijziging vragen
              </Button>
            </div>
          )}
        </div>
      )}

      {!isClient && (
        <label className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
          <input
            type="checkbox"
            checked={doc.final === true}
            onChange={(e) => patchItem("docs", doc.id, { final: e.target.checked })}
          />
          Definitief: zichtbaar voor uitvoerders van dit project
        </label>
      )}

      {!isClient && doc.status === "wijziging-gevraagd" && (
        <div className="mt-4 border-t border-border pt-4">
          {isLive ? (
            <label className="inline-flex cursor-pointer items-center rounded-full border border-border bg-surface px-4 py-2 text-sm hover:border-foreground/40">
              {busy ? "Uploaden…" : `Nieuwe versie ${doc.version + 1} uploaden`}
              <input type="file" className="sr-only" disabled={busy} onChange={(e) => void uploadNewVersion(e.target.files?.[0])} />
            </label>
          ) : (
            <Button variant="secondary" onClick={() => shareNewVersion()}>
              Nieuwe versie {doc.version + 1} delen
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function UploadForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    const hasFile = file instanceof File && file.size > 0;
    const name = hasFile ? file.name : `${String(data.get("title"))}.pdf`;
    const id = newId();
    let storagePath: string | undefined;
    if (isLive) {
      if (!hasFile) {
        setError("Kies eerst een bestand.");
        return;
      }
      setBusy(true);
      setError("");
      try {
        storagePath = await uploadDocument(projectId, id, file);
      } catch {
        setError("Uploaden is niet gelukt. Probeer het opnieuw.");
        setBusy(false);
        return;
      }
    }
    addItem("docs", {
      id,
      storagePath,
      projectId,
      title: String(data.get("title")),
      category: data.get("category") as ProjectDoc["category"],
      version: 1,
      fileName: name,
      sizeKb: hasFile ? Math.ceil(file.size / 1024) : 800,
      uploadedAt: nowIso(),
      status: data.get("approval") ? "ter-goedkeuring" : "info",
      final: data.get("final") === "on",
    });
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Titel">
          <input name="title" required className={inputClass} />
        </Field>
        <Field label="Soort">
          <select name="category" className={inputClass}>
            {Object.entries(categories).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bestand">
          <input name="file" type="file" required={isLive} className="text-sm" />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input name="approval" type="checkbox" defaultChecked /> Klant om goedkeuring vragen
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="final" type="checkbox" /> Definitief: zichtbaar voor uitvoerders
        </label>
        {error && <p className="text-sm text-warn sm:col-span-2">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Uploaden…" : "Delen"}
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
