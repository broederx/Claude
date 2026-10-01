"use client";

import { useState } from "react";
import { contractorProjects, docCategories } from "@/lib/docs";
import { fileSize, longDate } from "@/lib/format";
import { useAppState } from "@/lib/store";
import { studio } from "@/lib/studio";
import { Card, Empty } from "@/components/ui";

// Het portaal voor een uitvoerder: alleen de definitieve documentatie van de
// projecten waar de studio toegang toe geeft. Geen klantgegevens, prijzen,
// planning of berichten.
export default function ContractorDashboard() {
  const state = useAppState();
  const [open, setOpen] = useState<string | null>(null);
  const contractor = state.contractors.find((c) => c.id === state.contractorView);

  if (!contractor) return <Empty>Geen uitvoerder gekozen.</Empty>;

  const projects = contractorProjects(state, contractor.id);

  return (
    <div className="space-y-12">
      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Uitvoerders · {studio.name}</p>
        <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Welkom, {contractor.name}</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Hier vind je de definitieve tekeningen en documenten voor de projecten waar je aan werkt. Je ziet alleen wat
          de studio als definitief heeft vrijgegeven. Vragen over de documenten stel je aan {studio.architect}, {studio.email}.
        </p>
      </section>

      {projects.length === 0 ? (
        <Empty>Je hebt nog geen toegang tot projecten.</Empty>
      ) : (
        projects.map(({ project, docs }) => (
          <section key={project.id}>
            <div className="mb-4">
              <h2 className="font-serif text-3xl">{project.name}</h2>
              <p className="text-sm text-muted">{project.address}</p>
            </div>
            {docs.length === 0 ? (
              <Empty>Er is voor dit project nog geen definitieve documentatie.</Empty>
            ) : (
              <Card className="divide-y divide-border">
                {docs.map((doc) => (
                  <div key={doc.id} className="px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[10px] text-muted">
                          PDF
                        </div>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-xs text-muted">
                            {docCategories[doc.category]} · versie {doc.version} · {fileSize(doc.sizeKb)} · {longDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpen(open === doc.id ? null : doc.id)}
                        aria-expanded={open === doc.id}
                        className="self-start rounded-full border border-border bg-surface px-4 py-2 text-sm hover:border-foreground/40 sm:self-auto"
                      >
                        Bekijken
                      </button>
                    </div>
                    {open === doc.id && (
                      <p className="mt-3 rounded-xl bg-background p-3 text-sm text-muted">
                        In de echte app opent of download je hier {doc.fileName}.
                      </p>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </section>
        ))
      )}
    </div>
  );
}
