"use client";

import { useState, type FormEvent } from "react";
import { addItem, patchItem } from "@/lib/actions";
import { contractorCanSee, docCategories } from "@/lib/docs";
import { fileSize, longDate } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { newId, nowIso } from "@/lib/store";
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
            ? "Tekeningen, impressies en afspraken, altijd in de laatste versie. Uitvoerders van dit project zien alleen goedgekeurde documenten, nooit contracten."
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
  const status = statusInfo[doc.status];

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
          {!isClient && contractorCanSee(doc) && <Badge>Zichtbaar voor uitvoerders</Badge>}
          <Button variant="secondary" onClick={() => setViewing(!viewing)}>
            Bekijken
          </Button>
        </div>
      </div>

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
                onClick={() => patchItem("docs", doc.id, { status: "wijziging-gevraagd", feedback: feedback.trim() })}
              >
                Versturen
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button onClick={() => patchItem("docs", doc.id, { status: "goedgekeurd", feedback: undefined })}>
                Goedkeuren
              </Button>
              <Button variant="secondary" onClick={() => setAsking(true)}>
                Wijziging vragen
              </Button>
            </div>
          )}
        </div>
      )}

      {!isClient && doc.status === "goedgekeurd" && doc.category !== "contract" && (
        <label className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
          <input
            type="checkbox"
            checked={!doc.hiddenFromContractors}
            onChange={(e) => patchItem("docs", doc.id, { hiddenFromContractors: !e.target.checked })}
          />
          Delen met uitvoerders van dit project
        </label>
      )}

      {!isClient && doc.status === "wijziging-gevraagd" && (
        <div className="mt-4 border-t border-border pt-4">
          <Button
            variant="secondary"
            onClick={() =>
              patchItem("docs", doc.id, {
                version: doc.version + 1,
                status: "ter-goedkeuring",
                feedback: undefined,
                uploadedAt: nowIso(),
                fileName: doc.fileName.replace(/v\d+/, `v${doc.version + 1}`),
              })
            }
          >
            Nieuwe versie {doc.version + 1} delen
          </Button>
        </div>
      )}
    </Card>
  );
}

function UploadForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    const name = file instanceof File && file.name ? file.name : `${String(data.get("title"))}.pdf`;
    addItem("docs", {
      id: newId(),
      projectId,
      title: String(data.get("title")),
      category: data.get("category") as ProjectDoc["category"],
      version: 1,
      fileName: name,
      sizeKb: file instanceof File && file.size ? Math.ceil(file.size / 1024) : 800,
      uploadedAt: nowIso(),
      status: data.get("approval") ? "ter-goedkeuring" : "info",
    });
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
          <input name="file" type="file" className="text-sm" />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input name="approval" type="checkbox" defaultChecked /> Klant om goedkeuring vragen
        </label>
        <div className="flex gap-3">
          <Button type="submit">Delen</Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
